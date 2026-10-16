/* Manual adjustments: receipt, balance, audit and notification commit together. */
(() => {
    'use strict';
    const paths = { coin: 'student_coins', ticket: 'student_bonus_tickets', money: 'student_money_offset' };
    const units = { coin: 'Coin', ticket: 'Vé', money: 'đ' };
    const inFlight = new Map();
    const read = async path => (await db.ref(path).once('value')).val();
    const batchLock = task => typeof navigator !== 'undefined' && navigator.locks
        ? navigator.locks.request('teacher-penalty-batch', task) : Promise.resolve().then(task);
    async function batch(signature, recipients) {
        return batchLock(() => {
        const key = `teacher_penalty_pending_${firebase.auth().currentUser.uid}`;
        let saved; try { saved = JSON.parse(localStorage.getItem(key)); } catch (_) { }
        if (saved && saved.signature !== signature) throw Error('Có đợt trừ tài sản chưa đối soát. Hãy hoàn tất đợt cũ với cùng học sinh, loại, số lượng và lý do trước.');
        if (!saved) {
            saved = { signature, ids: Object.fromEntries(recipients.map(u => [u, db.ref('teacher_money_operations').push().key])) };
            localStorage.setItem(key, JSON.stringify(saved));
        }
        const expected = JSON.stringify(saved);
        return { ids: saved.ids, finish: () => batchLock(() => {
            if (localStorage.getItem(key) === expected) localStorage.removeItem(key);
        }) };
        });
    }
    async function commit(options) {
        const { id, username, type, delta, reason, name = username, originalId = '' } = options;
        const ticketAdjustment = options.kind === 'ticket_adjust';
        const kind = ticketAdjustment ? 'ticket_adjust' : originalId ? 'counter' : 'penalty';
        if (!id || !paths[type] || !Number.isSafeInteger(delta) || !delta || !reason.trim()) throw Error('Giao dịch không hợp lệ');
        if (ticketAdjustment && (type !== 'ticket' || originalId)) throw Error('Điều chỉnh vé không hợp lệ');
        if(window.ECONOMY_SERVER_ENABLED===true && ticketAdjustment)return window.EconomyClient.execute('teacher_tickets',{studentUsername:String(username),mode:delta>0?'add':'sub',amount:String(Math.abs(delta))},{slot:'teacher-tickets:'+username});
        if(window.ECONOMY_SERVER_ENABLED===true)return window.EconomyClient.execute('teacher_adjust',{ledgerId:String(id),studentUsername:String(username),type:String(type),delta:String(delta),reason:String(reason),originalId:String(originalId||'none')},{slot:'teacher-ledger:'+id});
        if (inFlight.has(id)) return inFlight.get(id);
        const work = (async () => {
            const receiptPath = `teacher_money_operations/${id}`;
            const matches = receipt => receipt && receipt.username === username && receipt.type === type && receipt.delta === delta && receipt.kind === kind && (receipt.originalId || '') === originalId;
            const existing = await read(receiptPath);
            if (existing) { if (!matches(existing)) throw Error('Mã giao dịch đã được dùng cho nội dung khác'); return existing; }
            if (originalId) {
                const original = await read(`teacher_money_operations/${originalId}`);
                if (!original || original.kind !== 'penalty' || original.delta !== -delta || original.username !== username || original.type !== type || id !== `counter_${originalId}`) throw Error('Khoản đối ứng không khớp giao dịch gốc');
            }
            const balancePath = `${paths[type]}/${username}`;
            for (let attempt = 0; attempt < 5; attempt++) {
                const before = Number(await read(balancePath) || 0), after = before + delta;
                const ticketBase = ticketAdjustment ? Number(await read(`historical_grade_tickets/${username}`) || 0) : 0;
                const ticketUsed = ticketAdjustment ? Number(await read(`spin_counts/${username}/count`) || 0) : 0;
                if (ticketAdjustment && delta < 0 && ticketBase + after - ticketUsed < 0) {
                    // Another tab may already have committed this same operation while these reads were in flight.
                    const confirmed = await read(receiptPath);
                    if (matches(confirmed)) return confirmed;
                    const error = Error(`Học sinh hiện chỉ còn ${Math.max(0, ticketBase + before - ticketUsed)} vé, không đủ để trừ. Số vé đã được kiểm tra lại.`);
                    error.code = 'TICKET_INSUFFICIENT';
                    throw error;
                }
                const lower = type === 'ticket' ? -9999 : -9999999;
                const upper = type === 'coin' ? 999999999 : -lower;
                if (!Number.isSafeInteger(after) || after < lower || after > upper) {
                    const error = Error('Khoản điều chỉnh vượt giới hạn số dư của hệ thống');
                    error.code = 'LEDGER_BALANCE_LIMIT';
                    throw error;
                }
                const now = Date.now(), user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const actor = { uid: firebase.auth().currentUser.uid, username: String(user.username || ''), name: String(user.name || user.username || 'Giáo viên'), role: 'teacher' };
                const receipt = { id, username, type, delta, before, after, kind, originalId, reason, actorUid: actor.uid, createdAt: firebase.database.ServerValue.TIMESTAMP };
                if (ticketAdjustment) Object.assign(receipt, { ticketBase, ticketUsed });
                const summary = `${ticketAdjustment ? 'Điều chỉnh vé' : originalId ? 'Đối ứng' : 'Trừ tài sản'}: ${delta > 0 ? '+' : ''}${delta.toLocaleString('vi-VN')} ${units[type]} — ${reason}`.slice(0, 500);
                const log = { id, type: ticketAdjustment ? 'teacher_ticket_adjust' : originalId ? 'teacher_counter' : 'teacher_penalty', source: 'teacher_ledger', targetUsername: username, targetName: name, summary, actor, amount: delta, unit: units[type], before, after, reversible: false, status: 'active', createdAt: firebase.database.ServerValue.TIMESTAMP, createdAtClient: now, details: { operationId: id, originalId, penaltyType: type, balancePath, storageBefore: before, storageAfter: after } };
                if (ticketAdjustment) Object.assign(log.details, { ticketBase, ticketUsed, remainingBefore: ticketBase + before - ticketUsed, remainingAfter: ticketBase + after - ticketUsed });
                const message = { message: `${summary}\nMã giao dịch: ${id}${originalId ? `\nĐối ứng cho: ${originalId}` : ''}\n${type === 'coin' ? 'Số dư Coin' : 'Khoản điều chỉnh ' + units[type]}: ${before.toLocaleString('vi-VN')} → ${after.toLocaleString('vi-VN')}`, source: 'teacher_penalty', giftType: 'none', giftValue: '', penaltyApplied: true, penaltyOperationId: id, penaltyType: type, penaltyAmount: -delta, penaltyReason: reason, messageKind: 'penalty', penaltyNotice: true, timestamp: firebase.database.ServerValue.TIMESTAMP, timeString: new Date(now).toLocaleString('vi-VN'), skipInboxGiftAnimation: true, suppressInboxArrivalAnimation: true };
                if (ticketAdjustment) Object.assign(message, { source: 'teacher_ticket_adjust', messageKind: 'ticket_adjust', penaltyNotice: false });
                try {
                    await db.ref().update({ [receiptPath]: receipt, [balancePath]: after, [`transaction_logs/${id}`]: log, [`inbox_messages/${username}/${id}`]: message });
                    return receipt;
                } catch (error) {
                    // An acknowledgement can be lost after the server committed the write.
                    const confirmed = await read(receiptPath);
                    if (matches(confirmed)) return confirmed;
                    const current = Number(await read(balancePath) || 0);
                    const currentBase = ticketAdjustment ? Number(await read(`historical_grade_tickets/${username}`) || 0) : 0;
                    const currentUsed = ticketAdjustment ? Number(await read(`spin_counts/${username}/count`) || 0) : 0;
                    if ((current === before && currentBase === ticketBase && currentUsed === ticketUsed) || attempt === 4) throw Error(`Chưa xác nhận giao dịch ${id}. Giữ nguyên mã để thử lại. Kiểm tra kết nối và Publish database.rules.patched.json mới. ${error.message || ''}`);
                }
            }
        })();
        inFlight.set(id, work);
        try { return await work; } finally { inFlight.delete(id); }
    }
    const ticketActions = new Map();
    async function adjustTickets({ username, mode, amount, name = username }) {
        if (!username || !['add', 'sub'].includes(mode) || !Number.isSafeInteger(amount) || amount <= 0 || amount > 9999) throw Error('Số vé điều chỉnh không hợp lệ');
        const key = `teacher_ticket_pending_${firebase.auth().currentUser.uid}_${username}`;
        if (ticketActions.has(key)) return ticketActions.get(key);
        const run = async () => {
            const signature = JSON.stringify({ username, mode, amount });
            let saved;
            try { saved = JSON.parse(localStorage.getItem(key)); } catch (_) { }
            if (saved && saved.signature !== signature) throw Error('Có lần điều chỉnh vé chưa được xác nhận. Hãy thử lại cùng học sinh, thao tác và số vé trước để đối soát.');
            if (!saved) {
                saved = { signature, id: db.ref('teacher_money_operations').push().key };
                localStorage.setItem(key, JSON.stringify(saved));
            }
            const expected = JSON.stringify(saved);
            const finish = () => { if (localStorage.getItem(key) === expected) localStorage.removeItem(key); };
            try {
                const receipt = await commit({ id: saved.id, username, type: 'ticket', kind: 'ticket_adjust', delta: mode === 'add' ? amount : -amount, reason: mode === 'add' ? 'Giáo viên cộng vé thủ công' : 'Giáo viên trừ vé thủ công', name });
                finish();
                return receipt;
            } catch (error) {
                // This failure is certain and precedes any write. Other failures keep the ID for reconciliation.
                if (error.code === 'TICKET_INSUFFICIENT' || error.code === 'LEDGER_BALANCE_LIMIT') finish();
                throw error;
            }
        };
        const work = typeof navigator !== 'undefined' && navigator.locks
            ? navigator.locks.request(key, run) : run();
        ticketActions.set(key, work);
        try { return await work; } finally { ticketActions.delete(key); }
    }
    const counterBusy = new Set();
    async function counter(id) {
        if (counterBusy.has(id)) return;
        counterBusy.add(id);
        try {
            const original = await read(`teacher_money_operations/${id}`);
            if (!original || original.kind !== 'penalty') throw Error('Chỉ đối ứng khoản trừ được tạo bằng cơ chế mới');
            if (await read(`teacher_money_operations/counter_${id}`)) { await AppDialog.alert('Khoản này đã được đối ứng. Không cộng thêm.'); return; }
            if (!await AppDialog.confirm(`Hoàn lại ${(-original.delta).toLocaleString('vi-VN')} ${units[original.type]} cho ${original.username}?\nGiao dịch gốc: ${id}\nKhoản gốc vẫn được giữ trong lịch sử; chỉ được đối ứng một lần.`)) return;
            if (!await reauthenticateTeacherForDangerousAction('tạo giao dịch đối ứng')) return;
            await commit({ id: `counter_${id}`, username: original.username, type: original.type, delta: -original.delta, reason: 'Hoàn lại khoản trừ thủ công ' + id, originalId: id });
            await AppDialog.alert('Đã ghi giao dịch đối ứng và gửi thư thông báo.');
            await TransactionHistory.loadTeacherLogs();
        } catch (e) { await AppDialog.alert(e.message); } finally { counterBusy.delete(id); }
    }
    function recoveryControl() {
        const submit = document.getElementById('penaltySubmitButton');
        if (!submit) return;
        const button = document.createElement('button'); button.type = 'button';
        button.textContent = 'Khôi phục đợt trừ chưa hoàn tất';
        button.style.cssText = 'margin:10px 0;padding:10px 14px';
        button.onclick = async () => {
            try {
                const pending = JSON.parse(localStorage.getItem(`teacher_penalty_pending_${firebase.auth().currentUser.uid}`) || 'null');
                if (!pending) { await AppDialog.alert('Không có đợt trừ đang chờ trên trình duyệt này.'); return; }
                const value = JSON.parse(pending.signature);
                document.getElementById('penaltyType').value = value.type;
                document.getElementById('penaltyAmount').value = value.amount;
                document.getElementById('penaltyReason').value = value.reason;
                const select = document.getElementById('penaltyTargetStudent');
                for (const option of select.options) option.selected = value.recipients.includes(option.value);
                const label = document.getElementById('penaltyTargetStudent_displayText');
                if (label) label.textContent = value.recipients.join(', ');
                await AppDialog.alert('Đã khôi phục thông tin đợt chờ. Bấm xác nhận để đối soát với các mã cũ; khoản đã ghi thành công sẽ không bị trừ lại.');
            } catch (e) { await AppDialog.alert('Không khôi phục được: ' + e.message); }
        };
        submit.after(button);
    }
    window.TeacherLedger = { batch, commit, counter, adjustTickets };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', recoveryControl, { once: true }); else recoveryControl();
})();
