/* Cash requests: stable submission IDs and an atomic teacher debit receipt. */
(() => {
    'use strict';
    const read = async path => (await db.ref(path).once('value')).val();
    const safeAmount = n => Number.isSafeInteger(n) && n > 0 && n <= 999999999;
    const owner = request => String(request?.studentUsername || request?.username || '');
    const inFlight = new Map();
    const session = () => {
        const uid = firebase.auth().currentUser?.uid;
        if (!uid) throw Error('Phiên đăng nhập đã kết thúc.');
        return () => { if (firebase.auth().currentUser?.uid !== uid) throw Error('Tài khoản vừa thay đổi; đã dừng thao tác.'); return uid; };
    };
    function clearPending(key, id) {
        // Another tab may already have stored a newer request.
        if (JSON.parse(localStorage.getItem(key) || 'null')?.id === id) localStorage.removeItem(key);
    }
    async function approve(id, username, getBaseMoney) {
        if(window.ECONOMY_SERVER_ENABLED===true)return window.EconomyClient.execute('cash_approve',{requestId:String(id),studentUsername:String(username)},{slot:'cash-approve:'+id});
        if (inFlight.has(id)) return inFlight.get(id);
        const assertSession = session();
        const task = (async () => {
            const path = 'cash_requests/' + id;
            for (let attempt = 0; attempt < 3; attempt++) {
                const request = await read(path);
                assertSession();
                if (!request) throw Error('Không còn yêu cầu này.');
                if (request.debitReceipt) {
                    if (request.debitReceipt.requestId !== id || request.debitReceipt.username !== username) throw Error('Biên nhận không khớp yêu cầu.');
                    return request;
                }
                if (request.status !== 'pending') throw Error('Yêu cầu không còn chờ duyệt; không tự trừ thêm tiền.');
                const amount = Number(request.amount);
                if (!safeAmount(amount) || (owner(request) && owner(request) !== username)) throw Error('Số tiền hoặc học sinh của yêu cầu không hợp lệ.');
                const balancePath = 'student_money_offset/' + username;
                const [rawBefore, base] = await Promise.all([read(balancePath), getBaseMoney()]);
                assertSession();
                const before = rawBefore == null ? 0 : Number(rawBefore), after = before - amount;
                if (![before, after, base].every(Number.isSafeInteger) || after < -9999999 || after > 9999999) throw Error('Số tiền không hợp lệ hoặc vượt giới hạn cho phép.');
                if (Math.max(0, base + before) < amount) throw Error('Tiền lộ trình hiện tại không đủ để duyệt yêu cầu.');
                const receipt = { version: 1, requestId: id, username, amount, before, after,
                    baseMoney: base, actorUid: assertSession(),
                    createdAt: firebase.database.ServerValue.TIMESTAMP };
                const next = { ...request, studentUsername: username, status: 'transferring',
                    debitReceipt: receipt, debitApplied: true, debitAmount: amount,
                    debitOffsetBefore: before, debitOffsetAfter: after,
                    approvedAt: firebase.database.ServerValue.TIMESTAMP };
                try {
                    await db.ref().update({ [path]: next, [balancePath]: after });
                    return next;
                } catch (error) {
                    // Lost acknowledgement is resolved by this request's receipt, not a balance guess.
                    const saved = await read(path);
                    assertSession();
                    if (saved?.debitReceipt) {
                        if (saved.debitReceipt.requestId !== id || saved.debitReceipt.username !== username) throw Error('Biên nhận không khớp yêu cầu.');
                        return saved;
                    }
                    if (saved?.status !== 'pending' || saved?.amount !== request.amount ||
                        owner(saved) !== owner(request)) throw Error('Yêu cầu vừa thay đổi; chưa xác nhận trừ tiền. Hãy tải lại danh sách.');
                    const latest = await read(balancePath);
                    if (Number(latest || 0) === before || attempt === 2) throw error;
                }
            }
        })();
        inFlight.set(id, task);
        try { return await task; } finally { inFlight.delete(id); }
    }
    async function recoverPending(username) {
        const uid = firebase.auth().currentUser?.uid;
        if (!uid) return null;
        const assertSession = session();
        const key = 'pending_cash_request_v3_' + uid;
        const pending = JSON.parse(localStorage.getItem(key) || 'null');
        if (!pending) return null;
        if (pending.payload?.studentUsername !== username || !pending.id) throw Error('Mã yêu cầu đang chờ không hợp lệ.');
        const existing = await read('cash_requests/' + pending.id);
        assertSession();
        if (!existing) return null;
        if (owner(existing) !== username || existing.amount !== pending.payload.amount) throw Error('Mã yêu cầu không khớp.');
        clearPending(key, pending.id);
        return { recovered: true, amount: existing.amount };
    }
    async function submit(payload) {
        const uid = firebase.auth().currentUser?.uid;
        if (!uid || !safeAmount(payload.amount)) throw Error('Yêu cầu không hợp lệ.');
        const assertSession = session();
        const storageKey = 'pending_cash_request_v3_' + uid;
        let pending = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (window.ECONOMY_SERVER_ENABLED === true) {
            if (pending) {
                const recovered = await recoverPending(payload.studentUsername);
                assertSession();
                if (recovered) return recovered;
                if(pending.payload?.studentUsername!==payload.studentUsername||!pending.id)throw Error('Mã yêu cầu cũ không hợp lệ.');
                const resolved=await window.EconomyClient.execute('legacy_cash_recover',{requestId:String(pending.id),amount:String(pending.payload.amount)},{slot:'cash-recover'});
                assertSession();clearPending(storageKey,pending.id);
                if(resolved.recovered)return resolved;
            }
            const result = await window.EconomyClient.execute('cash_request', {amount:String(payload.amount)}, {slot:'cash-request'});
            assertSession();
            return result;
        }
        if (pending) {
            if (pending.payload?.studentUsername !== payload.studentUsername || !pending.id) throw Error('Cần kiểm tra yêu cầu đang chờ của tài khoản này.');
            const existing = await read('cash_requests/' + pending.id);
            assertSession();
            if (existing) {
                if (owner(existing) !== payload.studentUsername || existing.amount !== pending.payload.amount) throw Error('Mã yêu cầu không khớp.');
                clearPending(storageKey, pending.id);
                return { recovered: true, amount: existing.amount };
            }
            if (pending.payload.amount !== payload.amount) throw Error('Có yêu cầu chưa xác nhận với số tiền ' + pending.payload.amount + ' VNĐ. Hãy gửi lại đúng số tiền này để đối soát trước.');
        } else {
            pending = { id: db.ref('cash_requests').push().key, payload };
            // If durable storage fails, stop before sending; a retry must keep the same ID.
            localStorage.setItem(storageKey, JSON.stringify(pending));
        }
        if (!Number.isFinite(Number(pending.payload.timestamp)) || Date.now() - Number(pending.payload.timestamp) > 86400000) throw Error('Yêu cầu chưa xác nhận đã quá 24 giờ; cần giáo viên kiểm tra trước khi gửi lại.');
        const path = 'cash_requests/' + pending.id;
        try {
            assertSession();
            await db.ref(path).set({ ...pending.payload, timestamp: firebase.database.ServerValue.TIMESTAMP });
        } catch (error) {
            const existing = await read(path);
            assertSession();
            if (!existing || owner(existing) !== payload.studentUsername || existing.amount !== pending.payload.amount) throw error;
        }
        clearPending(storageKey, pending.id);
        return { recovered: false, amount: pending.payload.amount };
    }
    window.CashLedger = { approve, submit, recoverPending };
})();
