/* Staged server migration. No direct-write fallback after a server request. */
(() => {
    'use strict';
    const active = new Map();
    async function execute(action, args = {}, {slot = action} = {}) {
        const user = firebase.auth().currentUser;
        if (!user) throw Error('Cần đăng nhập lại.');
        const storageKey = `economy_pending_v1:${user.uid}:${slot}`;
        const intent = JSON.stringify({action, ...args});
        if (active.has(storageKey)) {
            const current = active.get(storageKey);
            if (current.intent !== intent) throw Error('Giao dịch trước đang xử lý.');
            return current.task;
        }
        if (!navigator.locks?.request) throw Error('Trình duyệt chưa hỗ trợ giao dịch an toàn. Hãy cập nhật trình duyệt.');
        const lastKey = storageKey + ':last';
        const observedLast = localStorage.getItem(lastKey);
        const task = navigator.locks.request(storageKey, async () => {
            if (firebase.auth().currentUser?.uid !== user.uid) throw Error('Tài khoản vừa thay đổi.');
            const latest = localStorage.getItem(lastKey);
            // A tab that waited for the same in-flight action joins its outcome.
            // A new click made after completion observes the new value and can
            // start a distinct purchase as usual.
            if (latest && latest !== observedLast) {
                const finished = JSON.parse(latest);
                if (finished.intent === intent) {
                    if (finished.error) throw Error(finished.error);
                    return finished.result;
                }
            }
            let saved;
            try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); }
            catch (_) { throw Error('Dữ liệu giao dịch đang chờ không đọc được; cần kiểm tra trước khi tiếp tục.'); }
            if (saved && saved.intent !== intent) throw Error('Có giao dịch chưa xác nhận. Hãy thử lại giao dịch trước.');
            if (!saved) {
                saved = {intent, body:{...args,action,operationId:crypto.randomUUID()}};
                localStorage.setItem(storageKey,JSON.stringify(saved));
            }
            const token = await user.getIdToken();
            if (firebase.auth().currentUser?.uid !== user.uid) throw Error('Tài khoản vừa thay đổi.');
            const endpoint = String(window.R2_CONFIG?.workerUrl || 'https://school-r2-files.ngogibao0311.workers.dev').replace(/\/$/,'');
            const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),30000);
            try {
                const response = await fetch(endpoint+'/economy',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(saved.body),signal:controller.signal});
                const data = await response.json();
                if (!response.ok || !data.ok) {
                    if (data.settled === true) {
                        localStorage.setItem(lastKey,JSON.stringify({operationId:saved.body.operationId,intent,error:data.error}));
                        if (localStorage.getItem(storageKey) === JSON.stringify(saved)) localStorage.removeItem(storageKey);
                    }
                    throw Error(data.error || 'Chưa xác nhận giao dịch. Hãy thử lại với mã cũ.');
                }
                localStorage.setItem(lastKey,JSON.stringify({operationId:saved.body.operationId,intent,result:data.result}));
                if (localStorage.getItem(storageKey) === JSON.stringify(saved)) localStorage.removeItem(storageKey);
                if (firebase.auth().currentUser?.uid !== user.uid) throw Error('Tài khoản vừa thay đổi; giao dịch của tài khoản trước đã được lưu.');
                if(typeof window.dispatchEvent==='function'&&typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('asset-history-committed'));
                if(data.result?.historyUsername&&window.AssetHistory?.trim)void window.AssetHistory.trim(data.result.historyUsername).catch(()=>{});
                return data.result;
            } finally { clearTimeout(timer); }
        });
        active.set(storageKey,{intent,task});
        try { return await task; } finally { active.delete(storageKey); }
    }
    window.EconomyClient = Object.freeze({execute});
})();
