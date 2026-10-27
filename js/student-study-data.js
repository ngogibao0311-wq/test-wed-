/* Read-only projection. The server chooses identity, ownership and answer visibility. */
(() => {
    'use strict';
    const messages={STUDY_DATA_UNAVAILABLE:'Chưa tải được dữ liệu học tập. Vui lòng thử lại.',
        STUDY_DATA_TOO_LARGE:'Dữ liệu học tập vượt giới hạn tải. Hãy báo giáo viên để được kiểm tra.',
        ASSIGNMENT_NOT_FOUND:'Bài không còn tồn tại hoặc không được giao cho bạn.',
        CLIENT_UPDATE_REQUIRED:'Hãy cập nhật trang trước khi mở phần học tập. Bài đang làm được giữ nguyên.'};
    function snapshot(records) {
        return {val:()=>records,exists:()=>records!==null,forEach:fn=>{
            for(const [key,value] of Object.entries(records||{}))if(fn({key,val:()=>value})===true)return true;
            return false;
        }};
    }
    async function request(resource,extra={},expectedUid=firebase.auth().currentUser?.uid) {
        const user=firebase.auth().currentUser;
        if(!user)throw Error('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.');
        if(user.uid!==expectedUid)throw Error('Tài khoản đã thay đổi. Hãy đăng nhập lại.');
        const endpoint=String(window.R2_CONFIG?.workerUrl||'').replace(/\/$/,'');
        if(!endpoint)throw Error('Chưa tải được cấu hình học tập. Hãy tải lại trang khi đã lưu bài.');
        const url=new URL(endpoint+'/student-study-data');url.searchParams.set('resource',resource);
        for(const [key,value] of Object.entries(extra))if(value)url.searchParams.set(key,value);
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
        try {
            const response=await fetch(url,{headers:{Authorization:'Bearer '+await user.getIdToken()},cache:'no-store',signal:controller.signal});
            let data;try{data=await response.json();}catch(_){throw Error('Dịch vụ học tập chưa được cập nhật. Hãy báo giáo viên.');}
            if(!response.ok||data?.ok!==true)throw Error(messages[data?.error]||'Không tải được dữ liệu học tập ('+(data?.error||response.status)+').');
            if(firebase.auth().currentUser?.uid!==user.uid||window.pageAuthBlocked||window.testPageAuthBlocked)throw Error('Tài khoản đã thay đổi. Hãy đăng nhập lại.');
            return data;
        }finally{clearTimeout(timer);}
    }
    async function read(path) {
        const uid=firebase.auth().currentUser?.uid;
        if(path==='submissions')return snapshot((await request('submissions')).records);
        const [resource,key,...rest]=path.split('/');
        if(!['assignments','materials','schedule','global_notifications','global_surveys'].includes(resource)||rest.length)throw Error('Đường đọc học tập không hợp lệ.');
        if(key)return snapshot(Object.values((await request(resource,{key})).records)[0]||null);
        const rows={},seen=new Set();let after;
        for(let page=0;page<400;page++){
            const data=await request(resource,{after},uid);Object.assign(rows,data.records||{});
            if(!data.next)return snapshot(rows);
            if(seen.has(data.next))throw Error('Danh sách bài thay đổi trong lúc tải. Hãy thử lại.');
            seen.add(data.next);after=data.next;
        }
        throw Error(messages.STUDY_DATA_TOO_LARGE);
    }
    function collectionRef(resource) {
        const listeners=new Map();
        return {on(event,callback,cancel){
            if(event!=='value')throw Error('Sự kiện học tập không hỗ trợ.');
            if(listeners.has(callback))return;
            let stopped=false,running=false,queued=false,previous,reported=false;
            const refresh=async()=>{
                if(stopped||document.visibilityState==='hidden')return;
                if(running){queued=true;return;}
                running=true;
                try{
                    const data=await read(resource),text=JSON.stringify(data.val());
                    if(!stopped&&text!==previous){previous=text;await callback(data);}
                    reported=false;
                }catch(error){if(!stopped&&!reported){reported=true;if(typeof cancel==='function')cancel(error);else window.showToast?.(error.message);console.warn('[Study data]',error.message);}}
                finally{running=false;if(queued){queued=false;refresh();}}
            };
            const timer=setInterval(refresh,30000);
            window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
            window.addEventListener('student-study-refresh',refresh);
            // Keep immediate notifications for current records, while polling also
            // includes old owner-field formats that cannot use the raw query.
            const user=typeof currentUser==='undefined'?null:currentUser?.username;
            const changes=resource==='submissions'&&user&&typeof db!=='undefined'?db.ref('submissions').orderByChild('studentUsername').equalTo(user):null;
            changes?.on('value',refresh,()=>{});
            listeners.set(callback,()=>{stopped=true;clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('student-study-refresh',refresh);changes?.off('value',refresh);});
            refresh();
        },off(event,callback){if(callback){listeners.get(callback)?.();listeners.delete(callback);}else{for(const stop of listeners.values())stop();listeners.clear();}}};
    }
    window.StudentStudyData=Object.freeze({version:1,read,snapshot,ref:collectionRef,assignmentsRef:()=>collectionRef('assignments'),materialsRef:()=>collectionRef('materials'),submissionsRef:()=>collectionRef('submissions'),refresh:()=>window.dispatchEvent(new Event('student-study-refresh')),leaderboard:()=>request('leaderboard')});
})();
