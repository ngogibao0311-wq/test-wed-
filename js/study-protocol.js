/* Study protocol v1. Server activation is part of the existing account policy. */
(() => {
    'use strict';
    const BUILD = '20261019.study1';
    const chains = new Map();
    let activatedUid = '', activation = null;
    const conflict = () => Object.assign(Error('Bản nháp trên máy chủ đã thay đổi. Bản trên máy được giữ lại; hãy mở lại bài để đối chiếu.'), {code:'DRAFT_CONFLICT'});
    const uid = () => window.firebase?.auth().currentUser?.uid || '';
    const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
    function token(value) {
        return JSON.stringify([value?.sessionId || '', value?.ownerTabId || value?.ownerId || '', Number(value?.startedAt || 0),
            Number(value?.draftGeneration || 0), Number(value?.draftOwnerEpoch || 0), Number(value?.draftRevision || 0)]);
    }
    function canonical(value) {
        if (!value || typeof value !== 'object') return JSON.stringify(value ?? null);
        return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
    }
    function contentToken(value) {
        return canonical([value?.sessionId || '', value?.startedAt || 0, value?.answers || value?.mcAnswers || {}, value?.essay || '']);
    }
    function assertDraftBase(draft, remote) {
        if (!remote?.draftProtocol) return;
        const unchanged = canonical([draft.mcAnswers || {},draft.essay || '']) === canonical([remote.mcAnswers || {},remote.essay || '']);
        if (!unchanged && draft.baseContent !== contentToken(remote)) throw conflict();
    }
    function assertCanReload() {
        const storage=window.TestBrowserStorage.localStorage;
        const prefix='economy_pending_v1:'+uid()+':';
        let pending=!!window.currentActiveExamId || chains.size>0 || !!document.querySelector('.mcw2-overlay:not([data-review-mode="true"])');
        for(let i=0;i<storage.length;i++) { const key=storage.key(i); if(key?.startsWith(prefix)&&!key.endsWith(':last'))pending=true; }
        if(pending) throw Error('Hãy hoàn tất bài đang làm hoặc xác nhận giao dịch đang chờ trước khi cập nhật.');
    }
    function enqueue(key, task) {
        const previous = chains.get(key) || Promise.resolve();
        const next = previous.catch(() => {}).then(task);
        chains.set(key, next);
        next.finally(() => { if (chains.get(key) === next) chains.delete(key); }).catch(() => {});
        return next;
    }
    function check(group) {
        const manifest = window.StudyManifest;
        const spec = manifest?.groups?.[group];
        const missing = [];
        if (!spec || manifest.build !== BUILD || document.querySelector('meta[name="study-build"]')?.content !== BUILD) missing.push('bộ kiểm tra chức năng');
        for (const name of spec || []) {
            if (window.StudyModuleVersions?.[name] !== BUILD) missing.push(name);
        }
        const initialized = {
            protocol:window.StudyProtocol?.build === BUILD,
            common:typeof window.StudentAccountAccess?.activateStudy === 'function',
            student:typeof window.examRecoveryManager?.syncQueued === 'function',
            'mc-workspace':window.MCWorkspace?.__build === BUILD,
            economy:typeof window.EconomyClient?.resumeSubmission === 'function',
            loader:window.StudentFeatureLoader?.version === BUILD
        };
        for (const name of spec || []) if (!initialized[name] && !missing.includes(name)) missing.push(name+' chưa khởi tạo');
        return {ok:missing.length === 0, missing};
    }
    async function ready(group = 'study') {
        const result = check(group);
        if (!result.ok) throw Object.assign(Error('Chức năng chưa tải đủ phiên bản: ' + result.missing.join(', ') + '. Bản nháp được giữ nguyên.'), {code:'STUDY_MODULES_MISSING'});
        await window.AssetCompatibility.require(group === 'submission' || group === 'study' ? 'exam' : group);
    }
    async function requireFeature(group = 'study') {
        await ready(group);
        const account = uid();
        if (!account) throw Error('SUBMISSION_AUTH_REQUIRED');
        if (activatedUid === account) return true;
        if (activation?.uid === account) return activation.task;
        const task = (async () => {
            // All compulsory study modules are initialized before the one-way latch.
            await ready('study');
            const result = await window.StudentAccountAccess.activateStudy(BUILD);
            if (uid() !== account) throw Error('ACCOUNT_CHANGED');
            if (result?.requiredStudyVersion !== 1) throw Error('STUDY_SERVER_UPDATE_REQUIRED');
            activatedUid = account;
            return true;
        })();
        activation = {uid:account, task};
        try { return await task; } finally { if (activation?.task === task) activation = null; }
    }
    function decorate(current, next, {owner, acquire = false, expected, now = Date.now()} = {}) {
        if (next === undefined || next === null) return next;
        if (expected !== undefined && token(current) !== token(expected)) throw conflict();
        const ownerField = Object.hasOwn(next, 'ownerTabId') ? 'ownerTabId' : 'ownerId';
        const oldOwner = current?.[ownerField];
        const newAttempt = !!current && (String(next.sessionId || '') !== String(current.sessionId || '') || Number(next.startedAt || 0) !== Number(current.startedAt || 0));
        if (current && oldOwner && oldOwner !== owner && (!acquire || Number(current.ownerLeaseUntil || 0) > now)) throw conflict();
        if (current && newAttempt && !acquire) throw conflict();
        // An expired previous owner may claim the lease, but cannot bring its old answers along.
        if (current && oldOwner !== owner && acquire && !newAttempt) {
            if ('answers' in next) next.answers = clone(current.answers || {});
            if ('mcAnswers' in next) next.mcAnswers = clone(current.mcAnswers || {});
            if ('essay' in next) next.essay = current.essay || '';
        }
        return {...next, [ownerField]:owner,
            draftProtocol:1,
            draftBaseRevision:Number(current?.draftRevision || 0),
            draftRevision:Number(current?.draftRevision || 0) + 1,
            draftGeneration:Number(current?.draftGeneration || 0) + (!current?.draftGeneration || newAttempt ? 1 : 0),
            draftOwnerEpoch:Number(current?.draftOwnerEpoch || 0) + (!current?.draftOwnerEpoch || oldOwner !== owner || newAttempt ? 1 : 0)};
    }
    async function transaction(ref, update, {owner, acquire = false, expected, onComplete} = {}) {
        await requireFeature('study');
        const account = uid();
        const keep = () => {};
        ref.on?.('value', keep, () => {});
        try {
            const base = (await ref.once('value')).val();
            if (expected !== undefined && token(base) !== token(expected)) throw conflict();
            const baseToken = token(base);
            if (base && (['submitted','finalized','finalizing'].includes(base.status) ||
                (base.ownerTabId || base.ownerId) !== owner)) {
                const proposed = decorate(base,update(clone(base)),{owner,acquire,expected:base});
                if (proposed == null) return {committed:false,snapshot:{val:()=>base}};
                // Redo reset is already a Rules-validated new generation. Other
                // handoffs must preserve object contents, checked by the Worker.
                if (Number(proposed.startedAt) === Number(base.startedAt) && proposed.sessionId === base.sessionId) {
                    const parts=new URL(String(ref)).pathname.split('/').filter(Boolean);
                    const index=parts.findIndex(p=>['exam_sessions','mc_workspace_sessions'].includes(p));
                    if(index<0 || parts.length!==index+3) throw Error('INVALID_DRAFT_PATH');
                    const endpoint=String(window.R2_CONFIG?.workerUrl || '').replace(/\/$/,'');
                    if(!endpoint) throw Error('STUDY_SERVER_UPDATE_REQUIRED');
                    const user=window.firebase.auth().currentUser;
                    const idToken=await user.getIdToken();
                    if(uid()!==account) throw Error('ACCOUNT_CHANGED');
                    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
                    try {
                        const response=await fetch(endpoint+'/study/draft-transition',{method:'POST',headers:{Authorization:'Bearer '+idToken,'Content-Type':'application/json'},body:JSON.stringify({kind:parts[index],assignmentId:decodeURIComponent(parts[index+2]),expected:baseToken,next:proposed}),signal:controller.signal});
                        const data=await response.json();
                        if(!response.ok || !data.ok || token(data.session)!==token(proposed)) throw conflict();
                        if(uid()!==account) throw Error('ACCOUNT_CHANGED');
                        const snapshot={val:()=>data.session};onComplete?.(null,true,snapshot);
                        return {committed:true,snapshot};
                    } finally { clearTimeout(timer); }
                }
            }
            let collision = false;
            const result = await ref.transaction(current => {
                if (uid() !== account) return;
                if (token(current) !== baseToken) { collision = true; return; }
                return decorate(current, update(clone(current)), {owner, acquire, expected:base});
            }, undefined, false);
            if (collision && !result.committed) throw conflict();
            onComplete?.(null, result.committed, result.snapshot);
            return result;
        } catch (error) { onComplete?.(error, false, null); throw error; }
        finally { ref.off?.('value', keep); }
    }
    window.StudyProtocol = Object.freeze({build:BUILD, check, ready, require:requireFeature,
        active:() => !!activatedUid && activatedUid === uid(), token, contentToken, canonical, assertDraftBase, assertCanReload, decorate, transaction, enqueue});
    (window.StudyModuleVersions ||= {}).protocol = BUILD;
})();
