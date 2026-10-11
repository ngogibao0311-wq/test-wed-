/* Monetary mail: credit + immutable claim + mail removal commit together. */
(() => {
    'use strict';
    const balances = {coin: 'student_coins', ticket: 'student_bonus_tickets', money: 'student_money_offset'};
    const inFlight = new Map();
    const read = async path => (await db.ref(path).once('value')).val();
    async function claim(username, messageId) {
        if (!username || !messageId || /[.#$\[\]\/]/.test(username + messageId)) throw Error('Mã thư không hợp lệ.');
        if (window.ECONOMY_SERVER_ENABLED === true) {
            return window.EconomyClient.execute('inbox_claim', {messageId}, {slot:'inbox:'+messageId});
        }
        const uid = firebase.auth().currentUser?.uid;
        if (!uid) throw Error('Phiên đăng nhập đã kết thúc.');
        const key = uid + '/' + username + '/' + messageId;
        if (inFlight.has(key)) return inFlight.get(key);
        const assertSession = () => { if (firebase.auth().currentUser?.uid !== uid) throw Error('Tài khoản vừa thay đổi; đã dừng nhận quà.'); };
        const work = (async () => {
            const claimPath = 'inbox_gift_claims/' + username + '/' + messageId;
            const messagePath = 'inbox_messages/' + username + '/' + messageId;
            const [previous, message] = await Promise.all([read(claimPath), read(messagePath)]);
            assertSession();
            if (previous?.status === 'claimed') return {recovered: true, giftType: previous.giftType, amount: Number(previous.giftValue)};
            if (previous) throw Error('Thư cũ đang xử lý dở, chưa đủ bằng chứng đã cộng quà hay chưa. Cần giáo viên đối soát; không tự cộng lại.');
            if (!message) throw Error('Thư không còn tồn tại hoặc đã được thu hồi.');
            const root = balances[message.giftType], amount = Number(message.giftValue);
            if (!root || !Number.isSafeInteger(amount) || amount <= 0 || amount > 999999999) throw Error('Quà trong thư không hợp lệ.');
            const offset = Number(await read('.info/serverTimeOffset')) || 0;
            assertSession();
            const expiry = window.getInboxMessageExpiry(message);
            if (expiry && Date.now() + offset >= expiry) throw Error('Thư đã hết hạn nhận quà.');
            const stamp = firebase.database.ServerValue.TIMESTAMP;
            const receipt = {version: 2, status: 'claimed', username, messageId,
                giftType: message.giftType, giftValue: message.giftValue, amount,
                actorUid: uid, startedAt: stamp, updatedAt: stamp, claimedAt: stamp};
            const updates = {[claimPath]: receipt, [messagePath]: null,
                [root + '/' + username]: firebase.database.ServerValue.increment(amount)};
            assertSession();
            try { await db.ref().update(updates); }
            catch (error) {
                const saved = await read(claimPath);
                assertSession();
                if (saved?.version !== 2 || saved.status !== 'claimed' || saved.username !== username ||
                    saved.messageId !== messageId || saved.giftType !== message.giftType || saved.amount !== amount) throw error;
                return {recovered: true, giftType: message.giftType, amount};
            }
            return {recovered: false, giftType: message.giftType, amount};
        })();
        inFlight.set(key, work);
        try { return await work; } finally { inFlight.delete(key); }
    }
    window.InboxLedger = {claim};
})();
