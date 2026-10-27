/* Paid deadlines. All eligibility, prices and balance changes are decided by Worker. */
(() => {
    'use strict';
    const snapshots=new WeakMap(), minute=60000, vn=25200000;
    let dialogHost=null;
    const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const format=t=>t?new Date(t).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'Không giới hạn';
    const localValue=t=>new Date(t+vn).toISOString().slice(0,16);
    const parse=v=>Date.parse(v+'+07:00');
    const messages={
        EXTENSION_NOT_READY:'Chức năng gia hạn chưa được mở hoặc đang bảo trì. Coin của bạn chưa bị trừ.',
        EXTENSION_ORIGINAL_MISSING:'Bài này chưa có mốc giao bài và hạn ban đầu được xác nhận. Hãy nhờ giáo viên kiểm tra.',
        EXTENSION_ORIGINAL_ALREADY_SET:'Bài đã có mốc gốc được lưu cố định; không ghi đè các mốc này.',
        EXTENSION_BALANCE_ON_HOLD:'Số dư đang chờ đối soát do chấm lại bài. Hãy đợi giáo viên hoàn tất trước khi trả coin gia hạn.',
        EXTENSION_QUOTE_CHANGED:'Thông tin bài hoặc số dư đã thay đổi. Hãy kiểm tra thông tin mới rồi xác nhận lại.',
        EXTENSION_INVALID_TIME:'Hạn mới phải muộn hơn hạn hiện tại và hiện giờ, trong 14 ngày từ lúc giao và trong tháng giao bài.',
        EXTENSION_LIMIT:'Bài này đã dùng đủ 2 lần gia hạn.',EXTENSION_NO_TIME:'Không còn thời điểm hợp lệ để gia hạn.',
        EXTENSION_ALREADY_SUBMITTED:'Bài đã nộp không được gia hạn, kể cả khi được làm lại.',
        EXTENSION_ANSWERS_VISIBLE:'Bài đã công bố đáp án hoặc lời giải nên không thể gia hạn.',
        EXTENSION_SUBMISSION_BUSY:'Bài đang được nộp. Hãy chờ xác nhận kết quả.',EXTENSION_EXAM_EXPIRED:'Đồng hồ làm bài đã hết. Gia hạn không khôi phục thời gian làm bài.',
        ASSIGNMENT_TEACHER_LOCKED:'Giáo viên đã khóa bài. Không thể gia hạn.',ASSIGNMENT_NOT_ASSIGNED:'Bài không còn được giao cho bạn.',
        INSUFFICIENT_COINS:'Số dư không đủ để gia hạn.',EXTENSION_UPDATE_REQUIRED:'Hãy cập nhật trang khi đã lưu bài; phiên bản gia hạn hiện tại không còn phù hợp.',
        EXTENSION_ACTIVATION_REQUIRED:'Chưa xác nhận được chức năng gia hạn cho tài khoản. Hãy thử lại.',EXTENSION_DATA_INVALID:'Dữ liệu gia hạn cần được giáo viên kiểm tra.'
    };
    const explain=e=>messages[e?.message]||window.EconomyClient?.explainError?.(e)||e.message;
    function makeDialog(title) {
        if(dialogHost)return null;
        const host=document.createElement('div');host.className='ui-theme-immune';dialogHost=host;
        const root=host.attachShadow({mode:'open'});
        root.innerHTML=`<style>:host{all:initial}*{box-sizing:border-box}dialog{font:15px/1.6 'Segoe UI',sans-serif;color:#20304a;background:#fff;border:0;border-radius:20px;width:min(540px,calc(100vw - 24px));max-height:90dvh;overflow:auto;padding:24px;box-shadow:0 24px 80px #15254955}dialog::backdrop{background:#17274477}h2{font-size:21px;margin:0 0 16px}p{margin:10px 0}label{display:block;font-weight:600}input{display:block;width:100%;padding:10px;border:1px solid #aeb9cf;border-radius:8px;font:inherit;color:inherit;background:#fff}button{font:600 14px/1.4 'Segoe UI',sans-serif;border-radius:9px;border:1px solid #b9c4d8;padding:10px 15px;cursor:pointer;background:#f4f6fc;color:#20304a}button.primary{background:#5254bb;color:#fff;border-color:#5254bb}button:disabled{opacity:.5;cursor:not-allowed}button:focus-visible,input:focus-visible{outline:3px solid #a7b1f8;outline-offset:2px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.details{padding:12px;background:#f3f5fc;border-radius:12px;overflow-wrap:anywhere}.notice{font-size:13px;color:#52617a}.status{color:#8c3a1e;white-space:pre-wrap}strong{color:#303780}</style>
        <dialog aria-labelledby="extensionTitle"><h2 id="extensionTitle"></h2><div id="body"></div><p class="status" role="status" aria-live="polite"></p><div class="actions"><button class="primary" id="confirm" type="button">Xác nhận gia hạn</button><button id="close" type="button">Đóng</button></div></dialog>`;
        root.querySelector('h2').textContent=title;
        (document.fullscreenElement||document.body).append(host);
        const dialog=root.querySelector('dialog'),button=root.querySelector('#confirm'),close=root.querySelector('#close'),status=root.querySelector('.status'),body=root.querySelector('#body');
        let busy=false;
        const end=()=>{if(!busy){dialog.close();host.remove();dialogHost=null;}};
        close.onclick=end;dialog.addEventListener('cancel',e=>{e.preventDefault();end();});dialog.showModal();
        return {body,status,button,close:end,busy(v){busy=v;button.disabled=v;close.disabled=v;dialog.setAttribute('aria-busy',String(v));}};
    }
    function refreshResult(result) {
        const a=(window.cachedAssignments||[]).find(a=>String(a._fbKey||a.id)===result.assignmentKey);
        if(a){a.classEndDate=a.classEndDate??a.endDate;a.endDate=result.deadline;a.extension=result.record;}
        window.StudentStudyData?.refresh();
        if(typeof window.loadAssignments==='function')void window.loadAssignments();
    }
    async function open(assignment) {
        if(!window.EconomyClient||window.ECONOMY_SERVER_ENABLED!==true)return window.AppDialog.alert('Dịch vụ gia hạn chưa sẵn sàng.');
        if(window.StudentAccountAccess&&!window.StudentAccountAccess.requireWrite())return;
        const view=makeDialog('Gia hạn nộp bài');if(!view)return;
        const uid=firebase.auth().currentUser?.uid,key=String(assignment._fbKey||assignment.id),slot='extension:'+key;
        let quote=null,input=null,feeNode=null,remainingNode=null;
        const sameUser=()=>{if(firebase.auth().currentUser?.uid!==uid)throw Error('Tài khoản đã thay đổi. Hãy đóng cửa sổ này.');};
        function calculate() {
            if(!quote||!input)return null;
            const until=parse(input.value),fee=Math.max(0,Math.ceil(Math.max(0,until-quote.freeUntil)*100/3600000)-quote.netPaid);
            const valid=Number.isSafeInteger(until)&&until%minute===0&&until>=quote.minimumDueAt&&until<=quote.maximumDueAt;
            feeNode.textContent=valid?fee.toLocaleString('vi-VN')+' coin':'Chưa chọn thời gian hợp lệ';
            remainingNode.textContent=valid?(quote.balance-fee).toLocaleString('vi-VN')+' coin':'—';
            view.button.disabled=!valid||fee>quote.balance;
            return valid?{until,fee}:null;
        }
        async function loadQuote() {
            const selected=input?.value;
            quote=await window.EconomyClient.execute('extension_quote',{protocol:'1',assignmentKey:key},{slot:'extension-quote:'+key});sameUser();
            view.body.innerHTML=`<div class="details">Giờ giao bài: ${esc(format(quote.assignedAt))}<br>Hạn ban đầu: ${esc(format(quote.originalDueAt))}<br>Hạn hiện tại: <strong>${esc(format(quote.currentDueAt))}</strong><br>Hạn tối đa: ${esc(format(quote.maximumDueAt))}<br>Thời gian miễn phí đến: ${esc(format(quote.freeUntil))}<br>Đã gia hạn: ${quote.count}/2 lần<br>Đã trả: ${quote.paid.toLocaleString('vi-VN')} coin · Đã hoàn: ${quote.refunded.toLocaleString('vi-VN')} coin<br>Số dư: ${quote.balance.toLocaleString('vi-VN')} coin</div>
            <p><label>Hạn mới (giờ Việt Nam)<input id="until" type="datetime-local" step="60" required min="${localValue(quote.minimumDueAt)}" max="${localValue(quote.maximumDueAt)}"></label></p>
            <p>Cần trả thêm: <strong id="fee"></strong><br>Số dư sau thanh toán: <strong id="remaining"></strong></p>
            <p class="notice">100 coin/giờ; giờ lẻ tính theo phút, làm tròn tổng phí lên 1 coin. Trừ phần đã thanh toán và phần giáo viên cho thêm miễn phí. Gia hạn không tăng thời gian làm bài hoặc xóa lỗi quá hạn đã có.</p>`;
            if(quote.testQuickStart){const note=document.createElement('p');note.className='notice';note.textContent='Bản test · đang mở gia hạn thử nhanh. Coin được trừ trong tài khoản test.';view.body.prepend(note);}
            input=view.body.querySelector('#until');feeNode=view.body.querySelector('#fee');remainingNode=view.body.querySelector('#remaining');
            input.value=selected||localValue(quote.minimumDueAt);input.oninput=calculate;calculate();
        }
        view.button.onclick=async()=>{
            const value=calculate();if(!value)return;
            view.busy(true);view.status.textContent='Đang xử lý gia hạn, vui lòng chờ';
            try {
                sameUser();
                const result=await window.EconomyClient.execute('extension_buy',{protocol:'1',assignmentKey:key,quoteId:quote.quoteId,until:String(value.until),amount:String(value.fee)},{slot});sameUser();
                refreshResult(result);view.body.textContent=`Đã gia hạn đến ${format(result.record.paidUntil)}. Đã trừ ${result.charged.toLocaleString('vi-VN')} coin. Số dư: ${result.balance.toLocaleString('vi-VN')} coin.`;
                view.status.textContent='Gia hạn thành công.';quote=null;view.button.hidden=true;
            }catch(error){
                view.status.textContent=explain(error);
                if(['EXTENSION_QUOTE_CHANGED','INSUFFICIENT_COINS','EXTENSION_INVALID_TIME'].includes(error.message)){
                    try{await loadQuote();}catch(next){quote=null;view.status.textContent=explain(next);}
                } else if(error.message==='ECONOMY_UNCONFIRMED_RETRY_SAME_OPERATION') {
                    view.status.textContent=explain(error)+' Đóng rồi mở lại Gia hạn để kiểm tra đúng yêu cầu này.';quote=null;
                } else quote=null;
            }finally{view.busy(false);if(quote)calculate();else view.button.disabled=true;}
        };
        view.busy(true);view.status.textContent='Đang kiểm tra thông tin gia hạn…';
        try {
            const resumed=await window.EconomyClient.resume(slot);sameUser();
            if(resumed){refreshResult(resumed.result);view.body.textContent=`Yêu cầu trước đã thành công. Hạn mới: ${format(resumed.result.record.paidUntil)}. Không trừ coin lần nữa.`;view.button.hidden=true;view.status.textContent='Đã kiểm tra xong.';}
            else {
                await window.EconomyClient.execute('extension_activate',{protocol:'1'},{slot:'extension-activate'});sameUser();
                await loadQuote();view.status.textContent='Kiểm tra hạn mới và số coin trước khi xác nhận.';
            }
        }catch(error){view.status.textContent=explain(error);quote=null;}
        finally{view.busy(false);if(quote)calculate();else view.button.disabled=true;}
    }
    function signature(a,sub) {
        const {endDate,classEndDate,extension,extensionPolicy,...stable}=a;
        return JSON.stringify([stable,sub||null]);
    }
    function hasPendingPayment(a) {
        try{return !!window.TestBrowserStorage.localStorage.getItem(`economy_pending_v1:${firebase.auth().currentUser?.uid}:extension:${String(a._fbKey||a.id)}`);}catch(_){return false;}
    }
    function preserveCard(card,a,sub,hash) {
        const previous=snapshots.get(card);
        if(!previous||previous.signature!==signature(a,sub)||previous.due===a.endDate||!previous.due||!a.endDate)return false;
        for(const box of card.querySelectorAll('.assignment-meta,.accordion-meta')) {
            const walker=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);let node;
            while((node=walker.nextNode()))node.nodeValue=node.nodeValue.split(previous.due).join(a.endDate);
        }
        card.dataset.hash=hash;snapshots.set(card,{signature:signature(a,sub),due:a.endDate});return true;
    }
    function mountStudent(assignments,submissions) {
        const list=document.getElementById('assignmentsList');if(!list)return;
        if(!document.getElementById('assignmentExtensionLayout')) {
            const style=document.createElement('style');style.id='assignmentExtensionLayout';
            style.textContent=`
                html body #assignmentsList .assignment-meta.assignment-extension-meta{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:12px 20px!important}
                html body #assignmentsList .assignment-extension-details{flex:1 1 240px;min-width:0;overflow-wrap:anywhere}
                html body #assignmentsList .assignment-extension-control{position:relative;display:flex!important;flex-direction:column!important;align-items:flex-end!important;justify-content:center;gap:6px!important;flex:0 1 auto!important;width:auto!important;max-width:100%!important;margin:0 0 0 auto!important}
                html body #assignmentsList .assignment-extension-control button{display:inline-flex!important;align-items:center;justify-content:center;width:auto!important;min-width:0!important;max-width:100%!important;flex:none!important;margin:0!important;padding:9px 16px!important;min-height:38px;white-space:nowrap;box-shadow:none!important;line-height:1.3!important;font-size:14px!important}
                html body #assignmentsList .assignment-extension-control button:disabled{opacity:.55;cursor:not-allowed}
                html body #assignmentsList .assignment-extension-control span{max-width:230px;font:12px/1.4 'Segoe UI',sans-serif;text-align:right;overflow-wrap:anywhere}
            `;
            document.head.append(style);
        }
        for(const card of list.querySelectorAll('.card[data-id]')) {
            const a=assignments.find(a=>String(a.id)===card.dataset.id);if(!a)continue;
            const sub=submissions.find(s=>String(s.assignmentId??s.assignId??s.assignmentKey)===String(a.id)&&String(s.studentUsername??s.username??s.studentUser??s.studentId)===currentUser.username);
            const pending=hasPendingPayment(a);
            const disabled=(!!sub||a.isLocked===true||Number(a.extension?.count)>=2)&&!pending;
            const noteText=pending?'Có yêu cầu đang chờ kiểm tra':sub?'Bài đã nộp':a.isLocked?'Bài đang khóa':a.extension?.count?`Đã gia hạn ${a.extension.count}/2 lần`:'100 coin/giờ · Tối đa 2 lần';
            snapshots.set(card,{signature:signature(a,sub),due:a.endDate});
            const prior=card.querySelector('.assignment-extension-control');
            if(prior){
                prior.querySelector('button').disabled=disabled;
                prior.querySelector('span').textContent=noteText;
                continue;
            }
            const wrap=document.createElement('div');wrap.className='assignment-extension-control ui-theme-immune';
            const button=document.createElement('button');button.type='button';button.textContent='Gia hạn';button.style.cssText='padding:9px 16px;border:1px solid #7779c4;border-radius:9px;background:#f8f8ff;color:#353878;font:600 14px Segoe UI,sans-serif;cursor:pointer;';
            const note=document.createElement('span');note.style.cssText='color:inherit;';
            note.textContent=noteText;
            button.disabled=disabled;button.onclick=e=>{e.stopPropagation();void open(a);};
            wrap.append(button,note);
            const meta=card.querySelector('.assignment-meta');
            if(meta){
                const details=document.createElement('div');details.className='assignment-extension-details';
                while(meta.firstChild)details.append(meta.firstChild);
                meta.classList.add('assignment-extension-meta');meta.append(details,wrap);
            }else card.append(wrap);
        }
    }
    function teacherInfo(sub) {
        if(!sub.assignmentExtension?.count)return '';
        return `<p class="assignment-extension-note">Có gia hạn <button type="button" title="Xem lịch sử gia hạn" aria-label="Xem lịch sử gia hạn" data-extension-record="${esc(sub.assignmentKey||sub.assignmentExtension.assignmentKey)}" data-extension-student="${esc(sub.studentUsername)}">!</button><br>Hạn riêng tại lúc nộp: ${esc(format(sub.assignmentExtension.effectiveDueAt))}</p>`;
    }
    async function teacherDetails(key,username) {
        const view=makeDialog('Lịch sử gia hạn');if(!view)return;view.button.hidden=true;
        const uid=firebase.auth().currentUser?.uid;
        try {
            const [stored,assignment]=await Promise.all([db.ref('student_assignment_extensions/'+username+'/'+key).once('value'),db.ref('assignments/'+key).once('value')]);
            if(firebase.auth().currentUser?.uid!==uid)throw Error('Tài khoản đã thay đổi. Hãy đóng cửa sổ này.');
            const r=stored.val(),a=assignment.val();
            if(!r)throw Error('Chưa tải được lịch sử gia hạn.');
            const common=a?.endDate?parse(a.endDate.replace(' ','T')):0;
            const effective=!a?'Bài đã thu hồi':a.isLocked?'Bài đang khóa':common?format(Math.max(common,Number(r.paidUntil)||0)):'Không giới hạn';
            view.body.innerHTML=`<p>Hạn ban đầu: ${esc(format(r.originalDueAt))}<br>Hạn riêng đã mua: ${r.paidUntil?esc(format(r.paidUntil)):'Đã hủy khi hoàn coin'}<br>Hạn nộp/hạn sửa đang áp dụng cho học sinh: ${esc(effective)}<br>Đã trả: ${r.paid} coin · Đã hoàn: ${r.refunded} coin</p>`;
            for(const h of Object.values(r.history||{})){const p=document.createElement('p');p.textContent=`${format(h.at)}: ${format(h.from)} → ${format(h.to)} · ${h.coins} coin`;view.body.append(p);}
            for(const h of Object.values(r.refunds||{})){const p=document.createElement('p');p.textContent=`${format(h.at)}: hoàn ${h.coins} coin (${({thu_hoi_bai:'thu hồi bài',rut_ngan_han:'rút ngắn hạn',khoa_bai:'khóa bài',them_thoi_gian_mien_phi:'thêm thời gian miễn phí'})[h.reason]||h.reason})`;view.body.append(p);}
        }catch(e){view.status.textContent=explain(e);}
    }
    async function seed(key) {
        const view=makeDialog('Xác nhận mốc gia hạn của bài cũ');if(!view)return;view.busy(true);
        const uid=firebase.auth().currentUser?.uid;
        try {
            const [s,p]=await Promise.all([db.ref('assignments/'+key).once('value'),db.ref('assignment_extension_policies/'+key).once('value')]);
            if(firebase.auth().currentUser?.uid!==uid)throw Error('Tài khoản đã thay đổi. Hãy đóng cửa sổ này.');
            const a=s.val();if(!a)throw Error('Bài không còn tồn tại.');
            if(p.val()){view.body.textContent=`Đã lưu cố định: giao lúc ${format(p.val().assignedAt)}, hạn ban đầu ${format(p.val().originalDueAt)}.`;view.button.hidden=true;return;}
            view.body.innerHTML='<p class="notice">Chỉ xác nhận sau khi đã kiểm tra đúng ngày giao và hạn nộp ban đầu. Hạn hiện tại có thể đã được sửa; không dùng nó thay hạn gốc nếu không có bằng chứng. Sau khi xác nhận, hai mốc này được giữ cố định.</p><p><label>Ngày, giờ giao bài (giờ Việt Nam)<input id="assigned" type="datetime-local" step="60" required></label></p><p><label>Hạn nộp ban đầu (giờ Việt Nam)<input id="original" type="datetime-local" step="60" required></label></p>';
            view.button.textContent='Xác nhận hai mốc gốc';
            view.button.onclick=async()=>{
                if(firebase.auth().currentUser?.uid!==uid){view.status.textContent='Tài khoản đã thay đổi. Hãy đóng cửa sổ này.';return;}
                const assignedAt=parse(view.body.querySelector('#assigned').value),originalDueAt=parse(view.body.querySelector('#original').value);
                if(!Number.isSafeInteger(assignedAt)||!Number.isSafeInteger(originalDueAt)){view.status.textContent='Hãy nhập đầy đủ hai mốc thời gian.';return;}
                view.busy(true);
                try{await window.EconomyClient.execute('extension_seed',{assignmentKey:key,assignedAt:String(assignedAt),originalDueAt:String(originalDueAt),expectedDue:String(a.endDate?parse(a.endDate.replace(' ','T')):0)},{slot:'extension-seed:'+key});view.body.textContent='Đã lưu mốc gốc. Học sinh có thể gia hạn nếu còn đáp ứng các điều kiện.';view.button.hidden=true;}
                catch(e){view.status.textContent=explain(e);}finally{view.busy(false);}
            };
        }catch(e){view.status.textContent=explain(e);view.button.hidden=true;}finally{view.busy(false);}
    }
    document.addEventListener('click',e=>{
        const detail=e.target.closest?.('[data-extension-record]'),setup=e.target.closest?.('[data-extension-seed]');
        if(detail){e.stopPropagation();void teacherDetails(detail.dataset.extensionRecord,detail.dataset.extensionStudent);}
        else if(setup){e.stopPropagation();void seed(setup.dataset.extensionSeed);}
    });
    window.AssignmentExtensions=Object.freeze({version:1,mountStudent,preserveCard,teacherInfo,
        currentDeadline:(id,fallback)=>{const a=(window.cachedAssignments||[]).find(x=>String(x.id)===String(id));if(!a)return fallback;if(!a.endDate)return Infinity;const s=a.endDate.replace(' ','T');return Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(s)?s:s+'+07:00');}});
})();
