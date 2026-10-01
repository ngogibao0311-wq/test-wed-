(function () {
    'use strict';
    let busy=false;
    const key=()=> 'studentDeletionPending:'+firebase.auth().currentUser.uid;
    const pending=()=>{try{return JSON.parse(localStorage.getItem(key())||'[]').filter(id=>typeof id==='string');}catch(_){return [];}};
    function remember(uid,done=false) {
        try {localStorage.setItem(key(),JSON.stringify(done?pending().filter(id=>id!==uid):[...new Set([...pending(),uid])]));}catch(_){/* server keeps authoritative progress */}
    }
    function recovery() {
        const container=document.getElementById('studentsListContainer');if(!container)return;
        document.getElementById('studentDeletionRecovery')?.remove();
        const ids=pending();if(!ids.length)return;
        const box=document.createElement('div');box.id='studentDeletionRecovery';box.className='card';
        const title=document.createElement('strong');title.textContent='Có tác vụ xóa học sinh chưa xác nhận hoàn tất';box.append(title);
        ids.forEach(uid=>{const button=document.createElement('button');button.type='button';button.textContent='Kiểm tra / tiếp tục xóa';button.style.margin='8px';button.onclick=()=>window.deleteStudent(uid);box.append(button);});
        container.before(box);
    }
    async function run(uid,options) {
        if(busy){(await AppDialog.alert('Đang xử lý xóa học sinh. Vui lòng chờ tác vụ hiện tại.'));return false;}
        busy=true;let dialog;
        try {
            const snapshot=await options.db.ref('users/'+uid).once('value');const student=snapshot.val();
            const resuming=pending().includes(uid)||student?.deletionPending===true;
            if(!student&&!resuming)throw Error('Không tìm thấy học sinh.');
            if(student&&student.role!=='student')throw Error('Chức năng này chỉ dùng cho học sinh.');
            if(!resuming&&!(await AppDialog.confirm('Xóa vĩnh viễn học sinh ['+student.username+']?\n\nSẽ xóa tài khoản đăng nhập, dữ liệu riêng và tệp trên cloud. Tài liệu dùng chung của lớp được giữ. Không thể hoàn tác.')))return false;
            if(!await options.reauthenticate('xóa toàn bộ dữ liệu học sinh'))return false;
            remember(uid);recovery();
            dialog=document.createElement('dialog');dialog.className='app-progress-dialog';dialog.setAttribute('aria-label','Xóa học sinh và dữ liệu cloud');
            const heading=document.createElement('h3');heading.textContent='Xóa học sinh và dữ liệu cloud';
            const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Đang kết nối máy chủ…';
            const hint=document.createElement('p');hint.textContent='Nếu mất mạng hoặc đóng trang, máy chủ giữ tiến độ. Mở lại Danh sách học sinh để kiểm tra / tiếp tục xóa.';
            const close=document.createElement('button');close.textContent='Đóng thông báo';close.type='button';close.onclick=()=>dialog.close();
            dialog.append(heading,status,hint,close);document.body.append(dialog);dialog.showModal();
            const endpoint=window.CloudflareR2Storage?.config?.workerUrl;
            if(!endpoint)throw Error('Chưa cấu hình máy chủ lưu trữ.');
            while(true) {
                const token=await firebase.auth().currentUser.getIdToken(true);
                const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),60000);
                let response;
                try {response=await fetch(endpoint+'/delete-student',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({uid}),signal:abort.signal});}
                finally{clearTimeout(timer);}
                const result=await response.json();
                if(!response.ok||!result.ok)throw Error(result.error||'Chưa xác nhận xóa hoàn tất.');
                status.textContent=result.label||'Đang xử lý…';
                if(result.done) {remember(uid,true);recovery();status.textContent='Đã xóa tài khoản, dữ liệu riêng và tệp cloud thuộc học sinh. Máy chủ đã kiểm tra lại.';return true;}
                await new Promise(resolve=>setTimeout(resolve,400));
            }
        } catch(error) {
            const message='Chưa xác nhận xóa hoàn tất. '+(error.name==='AbortError'?'Mạng chậm hoặc bị ngắt.':error.message)+'\nBấm Kiểm tra / tiếp tục xóa để chạy tiếp cùng tác vụ.';
            if(dialog)dialog.querySelector('[role="status"]').textContent=message;else (await AppDialog.alert(message));
            return false;
        } finally {
            busy=false;recovery();
            if(dialog){if(!dialog.open)dialog.remove();else dialog.addEventListener('close',()=>dialog.remove(),{once:true});}
        }
    }
    window.StudentDeletionClient={run,recovery};
})();
