/* Device management never grants permission locally; every action is checked by Worker. */
(() => {
    'use strict';
    let panel,body,status,button,busy=false,signalRef,lastSignal=null,channel,sequence=0,lastPrimaryMode=null;
    const api=()=>window.StudentAccountAccess;
    const label=code=>({
        SESSION_PENDING_OPERATIONS:'Còn yêu cầu chưa xác định được kết quả. Nếu phiên chính đã hết hạn, hãy báo giáo viên kiểm tra; đăng nhập lặp lại không giải quyết được yêu cầu này.',
        SESSION_OPERATION_UNCONFIRMED:'Máy chủ chưa xác nhận giao dịch này. Hãy giữ nguyên mã yêu cầu và thử lại.',
        SESSION_EXAM_ACTIVE:'Đang có bài thi chưa kết thúc. Hoàn tất hoặc đối soát bài thi trước khi chuyển quyền.',
        SESSION_PRIMARY_STILL_ACTIVE:'Phiên chính vẫn còn hiệu lực. Hãy nhờ phiên chính đồng ý chuyển quyền.',
        SESSION_TRANSITION_BUSY:'Đang xử lý chuyển quyền. Kiểm tra lại trạng thái trước khi gửi tiếp.',
        REQUEST_EXPIRED:'Yêu cầu đã hết hạn. Hãy gửi yêu cầu chuyển quyền mới.',
        REQUEST_ALREADY_PENDING:'Đã có yêu cầu xin quyền đang chờ. Mở Thiết bị đang đăng nhập ở phiên chính để đồng ý.',
        SESSION_ALREADY_PRIMARY:'Thiết bị này đã có quyền thao tác.'
    }[code]);
    function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
    function safeButton(text,handler){const el=node('button',text);el.type='button';api().registerSessionControl(el);el.addEventListener('click',async event=>{try{await handler(event);}catch(error){status.textContent=label(error.message)||api().message(error);}});return el;}
    function key(suffix){return 'session-v3:'+firebase.app().options.projectId+':'+firebase.auth().currentUser.uid+':'+suffix;}
    function requestId(kind){const k=key(kind);let id=window.TestBrowserStorage.sessionStorage.getItem(k);if(!id){id=crypto.randomUUID();window.TestBrowserStorage.sessionStorage.setItem(k,id);}return id;}
    const time=value=>value?new Date(value).toLocaleString('vi-VN'):'Chưa có thông tin';
    async function act(action,details={}) {
        if(busy)return;busy=true;status.textContent='Đang xác nhận với máy chủ…';panel.setAttribute('aria-busy','true');
        try {
            const result=await api().call(action,details);
            if(result.status==='transferred'){window.TestBrowserStorage.sessionStorage.removeItem(key('transfer'));window.TestBrowserStorage.sessionStorage.removeItem(key('recover'));}
            if(result.status==='recovery_pending')status.textContent='Đã xác nhận một phần giao dịch cũ. Hãy nhập lại mã và bấm khôi phục để kiểm tra phần còn lại.';
            else if(action==='session_request_transfer')status.textContent='Đã gửi yêu cầu. Chờ phiên chính đồng ý.';
            else if(action==='session_reconcile_operation'){
                status.textContent=result.outcome==='completed'?'Giao dịch đã hoàn tất trên máy chủ.':'Yêu cầu chưa thực hiện đã được khóa và hủy an toàn.';
                await api().call('session_ack_operation',{operationId:details.operationId});
            } else status.textContent='Đã xác nhận. Quyền sử dụng được cập nhật từ máy chủ.';
            // Local notifications are optional; they must never skip server refresh.
            try{channel?.postMessage({type:'invalidate'});}catch(_){}
            api().invalidateSession();
            await api().refreshSession();await load();
        } catch(error) {status.textContent=label(error.message)||api().message(error);}
        finally {busy=false;panel.removeAttribute('aria-busy');}
    }
    async function load() {
        const request=++sequence;
        if(api().protocol()<3){
            body.replaceChildren();
            lastPrimaryMode=null;
            if(api().protocol()<2){
                body.append(node('p','Chưa xác nhận được trạng thái bảo vệ của tài khoản. Bấm Cập nhật danh sách để kiểm tra lại.'));
                return;
            }
            body.append(node('h3','Quản lý thiết bị mới chưa được kích hoạt'));
            body.append(node('p','Tài khoản đang dùng chế độ một phiên được thao tác, các phiên sau chỉ xem. Video, nhận quà và xác nhận vẫn bị khóa ở phiên chỉ xem.'));
            body.append(node('p','Chuyển quyền có xác nhận, khôi phục quyền, đăng xuất thiết bị khác và đồng bộ thay đổi quyền cần được kích hoạt cùng cơ chế mới. Thời lượng video do máy chủ xác nhận cũng thuộc đợt nâng cấp này.'));
            body.append(node('p','Người quản lý website cần hoàn tất cập nhật phần xử lý và cấu hình bảo vệ. Sau đó đăng nhập lại khi không còn bài thi hay giao dịch đang chờ.'));
            return;
        }
        const data=await api().call('session_list');if(request!==sequence)return;
        const primaryMode=data.currentSessionId===data.primarySessionId;
        if(lastPrimaryMode!==null && lastPrimaryMode!==primaryMode)status.textContent=primaryMode?'Thiết bị này đang có quyền thao tác.':'Thiết bị này đã chuyển sang chế độ chỉ xem.';
        lastPrimaryMode=primaryMode;
        body.replaceChildren();
        if(!data.request)window.TestBrowserStorage.sessionStorage.removeItem(key('transfer'));
        if(data.currentSessionId===data.primarySessionId)window.TestBrowserStorage.sessionStorage.removeItem(key('recover'));
        body.append(node('p','Mỗi lần đăng nhập là một phiên. Mã khôi phục dùng chung không chứng minh đó là cùng một thiết bị.','session-device-help'));
        const list=node('ul',null,'session-device-list');
        data.sessions.forEach((s,index)=>{
            const row=node('li'),info=node('div');
            info.append(node('strong',(s.current?'Thiết bị này':'Phiên đăng nhập '+(index+1))+' · '+(s.primary?'Được thao tác':'Chỉ xem')),
                node('p','Đăng nhập: '+time(s.createdAt)+' · Hoạt động gần nhất: '+time(s.lastSeenAt)));
            row.append(info);
            if(data.currentSessionId===data.primarySessionId && !s.current)row.append(safeButton('Đăng xuất phiên này',()=>void act('session_revoke',{sessionId:s.id})));
            list.append(row);
        });body.append(list);
        if(data.transition){
            body.append(node('p','Đang khóa thao tác để xác nhận chuyển quyền. Nếu lần trước mất kết nối, có thể hủy bước chuyển chưa hoàn tất.'));
            body.append(safeButton('Hủy bước chuyển đang chờ',()=>void act('session_cancel_transition',{requestId:data.transition.id})));
        }
        if(data.activeRequestCount)body.append(node('p','Đang có thao tác tải hoặc xử lý tệp. Nếu trạng thái này kéo dài sau khi mất kết nối, hãy báo giáo viên để kiểm tra.'));
        if(data.pendingCount){
            body.append(node('p',`Có ${data.pendingCount} giao dịch đang chờ xác nhận.`));
            if(data.currentSessionId===data.primarySessionId){
                data.pendingOperations.forEach(op=>{
                    const row=node('div',null,'session-pending-row');
                    row.append(node('span',time(op.createdAt)),safeButton('Đối soát yêu cầu đang chờ',()=>void act('session_reconcile_operation',{operationId:op.id})));body.append(row);
                });
            }
        }
        if(data.currentSessionId===data.primarySessionId){
            if(data.request){
                body.append(node('p','Một phiên chỉ xem đang xin quyền thao tác. Sau khi đồng ý, thiết bị này chuyển sang chỉ xem.'));
                body.append(safeButton('Đồng ý chuyển quyền',()=>void act('session_approve_transfer',{requestId:data.request.id})));
            }else body.append(node('p','Muốn chuyển quyền: mở mục Thiết bị đang đăng nhập trên thiết bị chỉ xem, bấm Xin quyền từ phiên chính, rồi quay lại đây để đồng ý.'));
        }else{
            body.append(node('p','Phiên này chỉ xem nội dung và trạng thái. Video, nhận quà, xác nhận thư và các thao tác học tập đều bị khóa.'));
            if(data.primarySessionId && data.sessions.some(s=>s.id===data.primarySessionId)) {
                body.append(safeButton('Xin quyền từ phiên chính',()=>void act('session_request_transfer',{requestId:requestId('transfer')})));
            } else {
                body.append(node('p','Phiên chính đã hết hạn hoặc đã đăng xuất. Bạn có thể nhập mã bên dưới để lấy lại quyền. Lần đăng nhập mới bằng mật khẩu và mã khôi phục cũng sẽ kiểm tra để cấp lại quyền.'));
                if(data.pendingCount || data.activeRequestCount)body.append(node('p','Khi khôi phục quyền, hệ thống sẽ đối chiếu các giao dịch đang chờ. Giao dịch đã có kết quả sẽ được xác nhận; yêu cầu chưa rõ kết quả vẫn được giữ để kiểm tra.'));
            }
            const form=node('form'),heading=node('h3','Không còn dùng được phiên chính?'),help=node('p','Chỉ khôi phục khi phiên chính đã hết hạn hoặc đăng xuất. Hệ thống kiểm tra bài thi và đối chiếu giao dịch trước khi cấp quyền.');
            const input=node('input');input.id='sessionTransferRecovery';input.type='password';input.autocomplete='off';input.maxLength=64;input.placeholder='REC-…';
            api().registerSessionControl(input);
            const text=node('label','Nhập lại mã khôi phục');text.htmlFor=input.id;api().registerSessionControl(text);
            const submit=safeButton('Xác nhận để khôi phục quyền',()=>{const code=input.value;input.value='';void act('session_recover_transfer',{requestId:requestId('recover'),code});});
            input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();submit.click();}});
            form.addEventListener('submit',event=>event.preventDefault());form.append(heading,help,text,input,submit);body.append(form);
        }
    }
    function closePanel(){
        if(!panel)return;
        if(panel.open)panel.close();panel.hidden=true;
        button.setAttribute('aria-expanded','false');
        const recovery=panel.querySelector('input[type="password"]');if(recovery)recovery.value='';
        button.focus({preventScroll:true});
    }
    function mount(){
        if(panel)return;
        const host=document.querySelector('#studentDashboard > .content');if(!host)return;
        panel=node('dialog',null,'session-devices session-devices-popup ui-theme-immune');panel.id='studentSessionDevices';panel.hidden=true;
        const title=node('h2','Thiết bị đang đăng nhập');title.id='sessionDevicesTitle';panel.setAttribute('aria-labelledby',title.id);
        const close=safeButton('Đóng',closePanel);close.className='session-popup-close';
        const heading=node('div',null,'session-popup-heading');heading.append(title,close);
        let banner=document.getElementById('studentSessionBanner');
        if(!banner){banner=node('aside',null,'ui-theme-immune');banner.id='studentSessionBanner';banner.setAttribute('role','status');const notice=node('span','Đang kiểm tra phiên đăng nhập.');notice.dataset.sessionNotice='';banner.append(notice);}
        banner.querySelectorAll('button,.session-account-actions').forEach(el=>el.remove());banner.hidden=false;
        body=node('div');status=node('p',null,'session-device-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');heading.append(status);
        const toolbar=node('div',null,'session-device-toolbar');
        toolbar.append(safeButton('Cập nhật danh sách',()=>void api().refreshSession().then(load).then(()=>{status.textContent='';}).catch(e=>{status.textContent=label(e.message)||api().message(e);})),safeButton('Đăng xuất thiết bị này',()=>{closePanel();void window.logout();}),safeButton('Đóng danh sách',closePanel));
        panel.append(heading,banner,body,toolbar);document.body.append(panel);
        panel.addEventListener('cancel',event=>{event.preventDefault();closePanel();});
        button=safeButton('',()=>{
            if(panel.open){closePanel();return;}
            panel.hidden=false;panel.showModal();button.setAttribute('aria-expanded','true');close.focus();
            status.textContent='Đang tải danh sách…';void load().then(()=>{status.textContent='';}).catch(e=>{status.textContent=label(e.message)||api().message(e);});
        });
        button.className='session-devices-open ui-theme-immune';button.id='studentSessionDevicesTrigger';
        button.title='Thiết bị đang đăng nhập';button.setAttribute('aria-label','Thiết bị đang đăng nhập');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-expanded','false');
        button.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="15" height="11" rx="2"/><path d="M6 19h7M9.5 14v5"/><rect x="16" y="9" width="6" height="12" rx="1.5"/><path d="M18.5 18h1"/></svg>';
        let dock=document.getElementById('studentTopActionsFlow');
        if(!dock){dock=node('div',null,'student-top-actions-flow');dock.id='studentTopActionsFlow';host.prepend(dock);}
        dock.prepend(button);
    }
    function connect(){
        const uid=firebase.auth().currentUser?.uid;if(!uid||signalRef)return;
        signalRef=firebase.database().ref('account_access_accounts/'+uid+'/signal');
        signalRef.on('value',snap=>{
            const value=snap.val(),revision=value?.revision;
            if(lastSignal===null){lastSignal=api().signalRevision();}
            if(revision!==lastSignal){lastSignal=revision;api().invalidateSession(revision);void api().refreshSession().then(()=>{if(panel&&!panel.hidden)return load();}).catch(()=>{});}
        },()=>api().invalidateSession());
        try{if(typeof BroadcastChannel==='function'){
            channel=new BroadcastChannel(key('signals'));
            channel.onmessage=()=>{api().invalidateSession();void api().refreshSession().then(()=>{if(panel?.open)return load();}).catch(()=>{});};
        }}catch(_){channel=null;}
        window.addEventListener('pagehide',()=>{signalRef?.off();signalRef=null;channel?.close();channel=null;});
    }
    window.addEventListener('student-session-mode',()=>{
        mount();
        if(api()?.protocol()>=3)connect();
    });
    // Keep the entry visible even before activation, and explain availability.
    mount();
    document.addEventListener('DOMContentLoaded',mount,{once:true});
    (window.SessionPolicyModules ||= {}).devices='20261024.session3';
})();
