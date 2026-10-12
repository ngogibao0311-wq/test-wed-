/* Server capabilities are established before startup can expose transactions. */
(() => {
    'use strict';
    const active = new Map();
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
                    response=await fetch(endpoint+'/economy',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(saved.body),signal:controller.signal});
                    data=await response.json();
                    if(data.settled!==true&&['ECONOMY_REQUEST_LIMIT_RETRY_SAME_OPERATION','ECONOMY_UNCONFIRMED_RETRY_SAME_OPERATION'].includes(data.error)&&attempt<2){
                        await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));continue;
                    }
                    break;
                }
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
    window.EconomyClient = Object.freeze({execute,initialize,resume,batch});
})();
