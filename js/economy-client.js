/* Server capabilities are established before startup can expose transactions. */
(() => {
    'use strict';
    const active = new Map();
    // Shared across tabs: an unavailable Worker must not be hammered by every
    // video timer / wallet listener. Pending operation IDs remain untouched.
    function retryKey(uid) { return 'economy_retry_v1:' + uid; }
    function readRetry(uid) {
        try { return JSON.parse(localStorage.getItem(retryKey(uid)) || 'null'); }
        catch (_) { return null; }
    }
    function unavailableError(until) {
        return Object.assign(Error('ECONOMY_UNCONFIRMED_RETRY_SAME_OPERATION'), {retryAt: until});
    }
    function deferRetry(uid, response) {
        const previous = readRetry(uid);
        const failures = Math.min(3, (Number(previous?.failures) || 0) + 1);
        const header = response?.headers?.get('Retry-After');
        const requested = header ? (Number.isFinite(Number(header)) ? Number(header) * 1000 : Date.parse(header) - Date.now()) : 0;
        const delay = Math.min(120000, Math.max(15000 * 2 ** (failures - 1), requested || 0));
        const until = Date.now() + delay;
        localStorage.setItem(retryKey(uid), JSON.stringify({until, failures}));
        return until;
    }
    function explainError(error) {
        if (error?.message === 'ECONOMY_UNCONFIRMED_RETRY_SAME_OPERATION') {
            const seconds = Math.max(0, Math.ceil(((error.retryAt || 0) - Date.now()) / 1000));
            return 'Máy chủ giao dịch tạm thời chưa phản hồi. Giao dịch đang chờ được giữ nguyên để xác nhận lại.' +
                (seconds ? ` Vui lòng thử lại sau ${seconds} giây.` : ' Vui lòng thử lại sau.');
        }
        if (error?.message !== 'ACCOUNT_NOT_ALLOWED') return error?.message || 'Không xác nhận được giao dịch.';
        const reasons = {
            PROFILE_MISSING: 'Không tìm thấy hồ sơ của tài khoản đang đăng nhập trong dữ liệu Firebase.',
            USERNAME_INVALID: 'Tên đăng nhập trong hồ sơ bị thiếu hoặc chứa ký tự không dùng được làm khóa dữ liệu (. # $ [ ] /).',
            ROLE_INVALID: 'Vai trò trong hồ sơ phải là teacher hoặc student.',
            ACCOUNT_LOCKED: 'Hồ sơ tài khoản đang đánh dấu bị khóa (isLocked).',
            ACCOUNT_DELETION_PENDING: 'Hồ sơ tài khoản đang đánh dấu chờ xóa (deletionPending).'
        };
        return (reasons[error.reason] || 'Máy chủ từ chối hồ sơ tài khoản đang đăng nhập.') +
            '\nKiểm tra hồ sơ users trong Firebase chính; nếu trạng thái là chuỗi "false", hãy sửa thành giá trị boolean false. Không cần mở quyền ghi trong Rules.';
    }
    async function accountErrorReason(user) {
        // Compatibility with an older Worker: read only the signed-in profile.
        try {
            const profile = (await db.ref('users/' + user.uid).once('value')).val();
            if (firebase.auth().currentUser?.uid !== user.uid) return undefined;
            if (!profile) return 'PROFILE_MISSING';
            const name = profile.username;
            if (typeof name !== 'string' || !name.length || name.length > 200 ||
                ['__proto__', 'constructor', 'prototype'].includes(name) || /[.#$\[\]/\u0000-\u001f]/.test(name)) return 'USERNAME_INVALID';
            if (!['student', 'teacher'].includes(profile.role)) return 'ROLE_INVALID';
            if (profile.deletionPending) return 'ACCOUNT_DELETION_PENDING';
            if (profile.isLocked) return 'ACCOUNT_LOCKED';
        } catch (_) { /* Keep the original rejection when diagnostics cannot be read. */ }
        return undefined;
    }
    function isFirebaseDraft() {
        const options = firebase.app?.().options;
        return options?.projectId === 'web-chan-doan-test' &&
            String(options.databaseURL || '').replace(/\/$/, '') ===
                'https://web-chan-doan-test-default-rtdb.asia-southeast1.firebasedatabase.app';
    }
    async function initialize() {
        const user=firebase.auth().currentUser;
        if(!user)throw Error('Cần đăng nhập lại.');
        if (isFirebaseDraft()) {
            // The isolated draft has no economy Worker. Never fall back here
            // because of a network/CORS failure on the production project.
            // Legacy draft Rules need not expose economy_config. This mode
            // grants no database permissions; Rules still enforce every write.
            const role = (await db.ref('users/'+user.uid).once('value')).val()?.role;
            if (firebase.auth().currentUser?.uid !== user.uid) throw Error('Tài khoản vừa thay đổi.');
            window.__economyRole = role;
            window.ECONOMY_SERVER_ENABLED = false;
            return {ok:true, protocol:3, enabled:false, mode:'firebase-draft'};
        }
        const endpoint=String(window.R2_CONFIG?.workerUrl||'https://school-r2-files.ngogibao0311.workers.dev').replace(/\/$/,'');
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
        try {
            const response=await fetch(endpoint+'/economy/status',{headers:{Authorization:'Bearer '+await user.getIdToken()},cache:'no-store',signal:controller.signal});
            const status=await response.json();
            if(!response.ok||!status.ok||status.protocol!==3||typeof status.enabled!=='boolean')throw Error('Chưa xác nhận được trạng thái giao dịch trên máy chủ.');
            if(firebase.auth().currentUser?.uid!==user.uid)throw Error('Tài khoản vừa thay đổi.');
            window.__economyRole=(await db.ref('users/'+user.uid).once('value')).val()?.role;
            const key='economy_server_mode_v2:'+user.uid;
            if(status.enabled){localStorage.setItem(key,'enabled');window.ECONOMY_SERVER_ENABLED=true;}
            else {
                if(localStorage.getItem(key)==='enabled')throw Error('Máy chủ đang bảo trì giao dịch. Vui lòng thử lại sau.');
                window.ECONOMY_SERVER_ENABLED=false;
            }
            return status;
        }finally{clearTimeout(timer);}
    }
    async function execute(action, args = {}, {slot = action} = {}) {
        if (isFirebaseDraft()) throw Error('Dự án nháp không dùng Worker giao dịch.');
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
            const retry = readRetry(user.uid);
            if (retry?.until > Date.now()) throw unavailableError(retry.until);
            if (!saved) {
                saved = {intent, body:{...args,action,operationId:crypto.randomUUID()}};
                localStorage.setItem(storageKey,JSON.stringify(saved));
            }
            const token = await user.getIdToken();
            if (firebase.auth().currentUser?.uid !== user.uid) throw Error('Tài khoản vừa thay đổi.');
            const endpoint = String(window.R2_CONFIG?.workerUrl || 'https://school-r2-files.ngogibao0311.workers.dev').replace(/\/$/,'');
            const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),30000);
            try {
                let response,data;
                for(let attempt=0;attempt<3;attempt++){
                    if(firebase.auth().currentUser?.uid!==user.uid)throw Error('Tài khoản vừa thay đổi.');
                    try {
                        response=await fetch(endpoint+'/economy',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(saved.body),signal:controller.signal});
                        data=await response.json();
                        if (!data || typeof data !== 'object') throw Error('INVALID_ECONOMY_RESPONSE');
                    } catch (_) {
                        // Includes HTML error pages and a lost response after commit.
                        throw unavailableError(deferRetry(user.uid, response));
                    }
                    if(data.settled!==true&&data.error==='ECONOMY_REQUEST_LIMIT_RETRY_SAME_OPERATION'&&attempt<2){
                        await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));continue;
                    }
                    if (data.settled !== true && (response.status >= 500 || response.status === 429 ||
                        data.error === 'ECONOMY_UNCONFIRMED_RETRY_SAME_OPERATION')) {
                        throw unavailableError(deferRetry(user.uid, response));
                    }
                    break;
                }
                if (!response.ok || !data.ok) {
                    if (data.settled === true) {
                        localStorage.setItem(lastKey,JSON.stringify({operationId:saved.body.operationId,intent,error:data.error}));
                        if (localStorage.getItem(storageKey) === JSON.stringify(saved)) localStorage.removeItem(storageKey);
                    }
                    const error = Error(data.error || 'Chưa xác nhận giao dịch. Hãy thử lại với mã cũ.');
                    if (data.error === 'ACCOUNT_NOT_ALLOWED') error.reason = data.reason || await accountErrorReason(user);
                    throw error;
                }
                localStorage.removeItem(retryKey(user.uid));
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
    async function resume(slot) {
        const uid=firebase.auth().currentUser?.uid;
        if(!uid)throw Error('Cần đăng nhập lại.');
        const raw=localStorage.getItem(`economy_pending_v1:${uid}:${slot}`);
        if(!raw)return null;
        const saved=JSON.parse(raw),{action,operationId,...args}=saved.body;
        return {result:await execute(action,args,{slot}),action,args};
    }
    async function batch(scope,signature,recipients){
        const uid=firebase.auth().currentUser?.uid;if(!uid)throw Error('Cần đăng nhập lại.');
        const key=`economy_batch:${uid}:${scope}`;
        return navigator.locks.request(key,async()=>{
            let saved=JSON.parse(localStorage.getItem(key)||'null');
            if(saved&&saved.signature!==signature)throw Error('Đợt gửi trước chưa hoàn tất. Hãy giữ nguyên nội dung quà để thử lại.');
            saved||={signature,ids:{}};
            for(const u of recipients)saved.ids[u]||=crypto.randomUUID();
            const encoded=JSON.stringify(saved);localStorage.setItem(key,encoded);
            return {ids:saved.ids,finish:()=>navigator.locks.request(key,()=>{if(localStorage.getItem(key)===encoded)localStorage.removeItem(key);})};
        });
    }
    window.EconomyClient = Object.freeze({execute,initialize,resume,batch,explainError});
})();
