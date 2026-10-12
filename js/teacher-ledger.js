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
        if (!id || !paths[type] || !Number.isSafeInteger(delta) || !delta || !reason.trim()) throw Error('Giao dịch không hợp lệ');
        if(window.ECONOMY_SERVER_ENABLED===true)return window.EconomyClient.execute('teacher_adjust',{ledgerId:String(id),studentUsername:String(username),type:String(type),delta:String(delta),reason:String(reason),originalId:String(originalId||'none')},{slot:'teacher-ledger:'+id});
        if (inFlight.has(id)) return inFlight.get(id);
        const work = (async () => {
            const receiptPath = `teacher_money_operations/${id}`;
            const matches = receipt => receipt && receipt.username === username && receipt.type === type && receipt.delta === delta && (receipt.originalId || '') === originalId;
            const existing = await read(receiptPath);
            if (existing) { if (!matches(existing)) throw Error('Mã giao dịch đã được dùng cho nội dung khác'); return existing; }
            if (originalId) {
                const original = await read(`teacher_money_operations/${originalId}`);
                if (!original || original.kind !== 'penalty' || original.delta !== -delta || original.username !== username || original.type !== type || id !== `counter_${originalId}`) throw Error('Khoản đối ứng không khớp giao dịch gốc');
            }
            const balancePath = `${paths[type]}/${username}`;
            for (let attempt = 0; attempt < 3; attempt++) {
                const before = Number(await read(balancePath) || 0), after = before + delta;
                const lower = type === 'ticket' ? -9999 : -9999999;
                const upper = type === 'coin' ? 999999999 : -lower;
                if (!Number.isSafeInteger(after) || after < lower || after > upper) throw Error('Khoản điều chỉnh vượt giới hạn số dư của hệ thống');
                const now = Date.now(), user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const actor = { uid: firebase.auth().currentUser.uid, username: String(user.username || ''), name: String(user.name || user.username || 'Giáo viên'), role: 'teacher' };
                const kind = originalId ? 'counter' : 'penalty';
                const receipt = { id, username, type, delta, before, after, kind, originalId, reason, actorUid: actor.uid, createdAt: firebase.database.ServerValue.TIMESTAMP };
                const summary = `${originalId ? 'Đối ứng' : 'Trừ tài sản'}: ${delta > 0 ? '+' : ''}${delta.toLocaleString('vi-VN')} ${units[type]} — ${reason}`.slice(0, 500);
                const log = { id, type: originalId ? 'teacher_counter' : 'teacher_penalty', source: 'teacher_ledger', targetUsername: username, targetName: name, summary, actor, amount: delta, unit: units[type], before, after, reversible: false, status: 'active', createdAt: firebase.database.ServerValue.TIMESTAMP, createdAtClient: now, details: { operationId: id, originalId, penaltyType: type, balancePath, storageBefore: before, storageAfter: after } };
                const message = { message: `${summary}\nMã giao dịch: ${id}${originalId ? `\nĐối ứng cho: ${originalId}` : ''}\n${type === 'coin' ? 'Số dư Coin' : 'Khoản điều chỉnh ' + units[type]}: ${before.toLocaleString('vi-VN')} → ${after.toLocaleString('vi-VN')}`, source: 'teacher_penalty', giftType: 'none', giftValue: '', penaltyApplied: true, penaltyOperationId: id, penaltyType: type, penaltyAmount: -delta, penaltyReason: reason, messageKind: 'penalty', penaltyNotice: true, timestamp: firebase.database.ServerValue.TIMESTAMP, timeString: new Date(now).toLocaleString('vi-VN'), skipInboxGiftAnimation: true, suppressInboxArrivalAnimation: true };
                try {
                    await db.ref().update({ [receiptPath]: receipt, [balancePath]: after, [`transaction_logs/${id}`]: log, [`inbox_messages/${username}/${id}`]: message });
                    return receipt;
                } catch (error) {
                    // An acknowledgement can be lost after the server committed the write.
                    const confirmed = await read(receiptPath);
                    if (matches(confirmed)) return confirmed;
                    const current = Number(await read(balancePath) || 0);
                    if (current === before || attempt === 2) throw Error(`Chưa xác nhận giao dịch ${id}. Giữ nguyên mã để thử lại. Kiểm tra kết nối và Publish database.rules.patched.json mới. ${error.message || ''}`);
                }
            }
        })();
        inFlight.set(id, work);
        try { return await work; } finally { inFlight.delete(id); }
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
    window.TeacherLedger = { batch, commit, counter };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', recoveryControl, { once: true }); else recoveryControl();
})();
