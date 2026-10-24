/* Server capabilities are established before startup can expose transactions. */
(() => {
    'use strict';
    const active = new Map();
    const reported = new Map();
    // Shared across tabs: an unavailable Worker must not be hammered by every
    // video timer / wallet listener. Pending operation IDs remain untouched.
    function retryKey(uid) { return 'economy_retry_v1:' + uid; }
    function readRetry(uid) {
        try { return JSON.parse(window.TestBrowserStorage.localStorage.getItem(retryKey(uid)) || 'null'); }
        catch (_) { return null; }
    }
    function unavailableError(until, reason) {
        return Object.assign(Error('ECONOMY_UNCONFIRMED_RETRY_SAME_OPERATION'), {retryAt: until, reason});
    }
    function deferRetry(uid, response, reason) {
        const previous = readRetry(uid);
        const failures = Math.min(3, (Number(previous?.failures) || 0) + 1);
        const header = response?.headers?.get('Retry-After');
        const requested = header ? (Number.isFinite(Number(header)) ? Number(header) * 1000 : Date.parse(header) - Date.now()) : 0;
        const delay = Math.min(120000, Math.max(15000 * 2 ** (failures - 1), requested || 0));
        const until = Date.now() + delay;
        window.TestBrowserStorage.localStorage.setItem(retryKey(uid), JSON.stringify({until, failures, reason}));
        return until;
    }
    function explainError(error) {
        const sessionMessages={VIDEO_PLAYBACK_BUSY:'Một tab khác đang tính thời gian video. Dừng video ở tab đó và đợi 15 giây trước khi xem tiếp.',VIDEO_WATCH_REQUIRED:'Thời lượng xem trên máy chủ chưa đủ để nộp bài.',SESSION_OPERATION_CANCELLED:'Yêu cầu này đã được đối soát và hủy. Bạn có thể bắt đầu thao tác mới.',SESSION_PENDING_OPERATIONS:'Còn giao dịch đang chờ. Mở Thiết bị đang đăng nhập để đối soát.',SESSION_TRANSITION_BUSY:'Đang chuyển quyền thiết bị. Hãy đợi xác nhận từ máy chủ.'};
        if(sessionMessages[error?.message])return sessionMessages[error.message];
        if (error?.message === 'ECONOMY_UNCONFIRMED_RETRY_SAME_OPERATION') {
            const seconds = Math.max(0, Math.ceil(((error.retryAt || 0) - Date.now()) / 1000));
            const reasons={
                ECONOMY_COMMIT_REJECTED:'Firebase chưa chấp nhận giao dịch. Cần kiểm tra Rules và dữ liệu đang được đối soát.',
                ACCESS_DATABASE_CONNECTION:'Worker chưa kết nối được Firebase.',
                ACCESS_DATABASE_PERMISSION:'Firebase từ chối quyền truy cập của Worker.',
                ACCESS_DATABASE_RESPONSE:'Firebase trả lỗi khi xử lý giao dịch.',
                ACCESS_SECRET_MISSING:'Worker chưa có khóa Firebase.',
                ACCESS_SECRET_INVALID:'Khóa Firebase trên Worker không hợp lệ.',
                ACCESS_SECRET_PROJECT:'Khóa Firebase trên Worker thuộc sai dự án.',
                ACCESS_SECRET_KEY:'Khóa Firebase trên Worker bị hỏng.',
                ACCESS_GOOGLE_CONNECTION:'Worker chưa kết nối được máy chủ xác thực Google.',
                ACCESS_GOOGLE_AUTH:'Google từ chối khóa Firebase của Worker.',
                ECONOMY_NOT_ENABLED:'Dịch vụ giao dịch trên Worker chưa được bật.',
                SERVER_MONEY_NOT_READY:'Cấu hình giao dịch trên Firebase chưa sẵn sàng.'
            };
            return (reasons[error.reason] || 'Máy chủ giao dịch tạm thời chưa phản hồi.') + ' Giao dịch đang chờ được giữ nguyên để xác nhận lại.' +
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
    function reportError(scope,error) {
        if (error?.code === 'READ_ONLY_SESSION' || error?.message === 'READ_ONLY_SESSION') return false;
        const uid=firebase.auth().currentUser?.uid || '';
        const key=uid+':'+scope+':'+error?.message+':'+(error?.reason||'');
        if(error?.message==='ECONOMY_UNCONFIRMED_RETRY_SAME_OPERATION') {
            if((reported.get(key)||0)>Date.now())return false;
            if(reported.size>=100)reported.clear();
            reported.set(key,Math.max(Number(error.retryAt)||0,Date.now()+60000));
        }
        console.warn(scope,explainError(error),error?.reason||error?.message||'');
        return true;
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
        const endpoint=String(window.R2_CONFIG?.workerUrl||'https://school-account-access-test.ngogibao0311.workers.dev').replace(/\/$/,'');
            if (endpoint.includes('YOUR-R2-WORKER')) throw Error('Chưa cấu hình Worker riêng cho bản test.');
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
        try {
            const response=await fetch(endpoint+'/economy/status',{headers:{Authorization:'Bearer '+await user.getIdToken()},cache:'no-store',signal:controller.signal});
            const status=await response.json();
            if(!response.ok||!status.ok||status.protocol!==3||typeof status.enabled!=='boolean')throw Error('Chưa xác nhận được trạng thái giao dịch trên máy chủ.');
            if(firebase.auth().currentUser?.uid!==user.uid)throw Error('Tài khoản vừa thay đổi.');
            window.__economyRole=(await db.ref('users/'+user.uid).once('value')).val()?.role;
            const key='economy_server_mode_v2:'+user.uid;
            if(status.enabled){window.TestBrowserStorage.localStorage.setItem(key,'enabled');window.ECONOMY_SERVER_ENABLED=true;}
            else {
                if(window.TestBrowserStorage.localStorage.getItem(key)==='enabled')throw Error('Máy chủ đang bảo trì giao dịch. Vui lòng thử lại sau.');
                window.ECONOMY_SERVER_ENABLED=false;
            }
            window.ECONOMY_EVENT_WALLETS_ENABLED = status.enabled || status.eventWallets === true;
            return status;
        }finally{clearTimeout(timer);}
    }
    function canMutate() {
        return window.__economyRole === 'teacher' || !window.StudentAccountAccess || window.StudentAccountAccess.canWrite();
    }
    function assertMutationSession() {
        if (!canMutate()) throw Object.assign(Error('Phiên này chỉ được xem. Đăng xuất và đăng nhập lại sau khi phiên chính kết thúc để thao tác.'), {code:'READ_ONLY_SESSION'});
    }
    async function execute(action, args = {}, options = {}) {
        const task = () => executeCore(action, args, options);
        return window.ServerActivity ? window.ServerActivity.economy(action, task, options) : task();
    }
    async function acknowledgeOperation(id) {
        if(window.StudentAccountAccess?.protocol?.()>=3)await window.StudentAccountAccess.call('session_ack_operation',{operationId:id});
    }
    async function executeCore(action, args = {}, {slot = action} = {}) {
        assertMutationSession();
        const study = action === 'submission_submit' && window.StudyProtocol?.active();
        if (isFirebaseDraft() && !study && window.ECONOMY_SERVER_ENABLED !== true && !(window.ECONOMY_EVENT_WALLETS_ENABLED === true && ['that_tich_auto','that_tich_redeem'].includes(action))) throw Error('Dự án nháp chỉ bật giao dịch ví sự kiện.');
        const user = firebase.auth().currentUser;
        if (!user) throw Error('Cần đăng nhập lại.');
        const storageKey = `economy_pending_v1:${user.uid}:${slot}`;
        const intent = JSON.stringify({action, ...args});
        if (active.has(storageKey)) {
            const current = active.get(storageKey);
            if (current.intent !== intent) throw Error('Giao dịch trước đang xử lý.');
            return current.task;
        }
        if (!window.TestBrowserStorage.locks?.request) throw Error('Trình duyệt chưa hỗ trợ giao dịch an toàn. Hãy cập nhật trình duyệt.');
        const lastKey = storageKey + ':last';
        const observedLast = window.TestBrowserStorage.localStorage.getItem(lastKey);
        const task = window.TestBrowserStorage.locks.request(storageKey, async () => {
            if (firebase.auth().currentUser?.uid !== user.uid) throw Error('Tài khoản vừa thay đổi.');
            assertMutationSession();
            const latest = window.TestBrowserStorage.localStorage.getItem(lastKey);
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
            try { saved = JSON.parse(window.TestBrowserStorage.localStorage.getItem(storageKey) || 'null'); }
            catch (_) { throw Error('Dữ liệu giao dịch đang chờ không đọc được; cần kiểm tra trước khi tiếp tục.'); }
            if (saved && saved.intent !== intent) throw Error('Có giao dịch chưa xác nhận. Hãy thử lại giao dịch trước.');
            const retry = readRetry(user.uid);
            if (retry?.until > Date.now()) throw unavailableError(retry.until,retry.reason);
            const resuming = !!saved;
            if (!saved) {
                saved = {intent, body:{...args,action,operationId:crypto.randomUUID()}};
                window.TestBrowserStorage.localStorage.setItem(storageKey,JSON.stringify(saved));
            }
            const token = await user.getIdToken();
            if (firebase.auth().currentUser?.uid !== user.uid) throw Error('Tài khoản vừa thay đổi.');
            const endpoint = String(window.R2_CONFIG?.workerUrl || 'https://school-account-access-test.ngogibao0311.workers.dev').replace(/\/$/,'');
            if (endpoint.includes('YOUR-R2-WORKER')) throw Error('Chưa cấu hình Worker riêng cho bản test.');
            const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),30000);
            try {
                let response,data;
                for(let attempt=0;attempt<3;attempt++){
                    if(firebase.auth().currentUser?.uid!==user.uid)throw Error('Tài khoản vừa thay đổi.');
                    try {
                        if (study && resuming && attempt === 0) {
                            response=await fetch(endpoint+'/study/receipt?operationId='+encodeURIComponent(saved.body.operationId),{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:controller.signal});
                            data=await response.json();
                            if (!response.ok || data.operationId !== saved.body.operationId || typeof data.found !== 'boolean') throw Error('INVALID_RECEIPT_RESPONSE');
                            if(data.found) break;
                        }
                        response=await fetch(endpoint+(study?'/study/submission':'/economy'),{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(saved.body),signal:controller.signal});
                        data=await response.json();
                        if (!data || typeof data !== 'object' || (study && data.ok && (data.operationId !== saved.body.operationId || data.settled !== true || !data.result?.submissionKey))) throw Error('INVALID_ECONOMY_RESPONSE');
                    } catch (_) {
                        // Includes HTML error pages and a lost response after commit.
                        throw unavailableError(deferRetry(user.uid, response));
                    }
                    if(data.settled!==true&&data.error==='ECONOMY_REQUEST_LIMIT_RETRY_SAME_OPERATION'&&attempt<2){
                        await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));continue;
                    }
                    if (data.settled !== true && (response.status >= 500 || response.status === 429 ||
                        data.error === 'ECONOMY_UNCONFIRMED_RETRY_SAME_OPERATION')) {
                        const reason=data.reason || data.error;
                        throw unavailableError(deferRetry(user.uid, response, reason),reason);
                    }
                    break;
                }
                if (!response.ok || !data.ok) {
                    if (data.settled === true) {
                        await acknowledgeOperation(saved.body.operationId);
                        window.TestBrowserStorage.localStorage.setItem(lastKey,JSON.stringify({operationId:saved.body.operationId,intent,error:data.error}));
                        if (window.TestBrowserStorage.localStorage.getItem(storageKey) === JSON.stringify(saved)) window.TestBrowserStorage.localStorage.removeItem(storageKey);
                    }
                    if (data.error === 'READ_ONLY_SESSION' || data.error === 'DEVICE_VERIFICATION_REQUIRED') {
                        await window.StudentAccountAccess?.refreshSession?.().catch(() => {});
                    }
                    const error = Error(data.error || 'Chưa xác nhận giao dịch. Hãy thử lại với mã cũ.');
                    error.code = data.error;
                    if (data.error === 'ACCOUNT_NOT_ALLOWED') error.reason = data.reason || await accountErrorReason(user);
                    throw error;
                }
                await acknowledgeOperation(saved.body.operationId);
                window.TestBrowserStorage.localStorage.removeItem(retryKey(user.uid));
                reported.clear();
                window.TestBrowserStorage.localStorage.setItem(lastKey,JSON.stringify({operationId:saved.body.operationId,intent,result:data.result}));
                if (window.TestBrowserStorage.localStorage.getItem(storageKey) === JSON.stringify(saved)) window.TestBrowserStorage.localStorage.removeItem(storageKey);
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
        const raw=window.TestBrowserStorage.localStorage.getItem(`economy_pending_v1:${uid}:${slot}`);
        if(!raw)return null;
        const saved=JSON.parse(raw),{action,operationId,...args}=saved.body;
        return {result:await execute(action,args,{slot}),action,args};
    }
    function pendingSubmission(assignmentKey) {
        const account=firebase.auth().currentUser?.uid;
        const storage=window.TestBrowserStorage.localStorage;
        const prefix=`economy_pending_v1:${account}:submit:`;
        for(let i=0;i<storage.length;i++) {
            const key=storage.key(i);
            if(!key?.startsWith(prefix) || key.endsWith(':last')) continue;
            let saved;try{saved=JSON.parse(storage.getItem(key));}catch{throw Error('SUBMISSION_PENDING_UNREADABLE');}
            if(saved?.body?.action==='submission_submit' && saved.body.assignmentKey===assignmentKey) return key.slice(`economy_pending_v1:${account}:`.length);
        }
        return null;
    }
    async function resumeSubmission(assignmentKey) {
        const slot=pendingSubmission(assignmentKey);
        return slot ? resume(slot) : null;
    }
    async function batch(scope,signature,recipients){
        const uid=firebase.auth().currentUser?.uid;if(!uid)throw Error('Cần đăng nhập lại.');
        const key=`economy_batch:${uid}:${scope}`;
        return window.TestBrowserStorage.locks.request(key,async()=>{
            let saved=JSON.parse(window.TestBrowserStorage.localStorage.getItem(key)||'null');
            if(saved&&saved.signature!==signature)throw Error('Đợt gửi trước chưa hoàn tất. Hãy giữ nguyên nội dung quà để thử lại.');
            saved||={signature,ids:{}};
            for(const u of recipients)saved.ids[u]||=crypto.randomUUID();
            const encoded=JSON.stringify(saved);window.TestBrowserStorage.localStorage.setItem(key,encoded);
            return {ids:saved.ids,finish:()=>window.TestBrowserStorage.locks.request(key,()=>{if(window.TestBrowserStorage.localStorage.getItem(key)===encoded)window.TestBrowserStorage.localStorage.removeItem(key);})};
        });
    }
    window.EconomyClient = Object.freeze({execute,initialize,resume,resumeSubmission,hasPendingSubmission:key=>!!pendingSubmission(key),batch,explainError,reportError,canMutate});
})();

(window.AssetModuleVersions ||= {})['economy-client'] = '20261018.romeo1';
(window.StudyModuleVersions ||= {})['economy'] = '20261019.study1';
// Written only after this module has executed successfully.
(window.SessionPolicyModules ||= {}).economy = '20261024.session3';


