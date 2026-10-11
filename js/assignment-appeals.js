// Presentation only: never change stored answers or grading inputs.
window.getSubmissionEssayDisplay = function (submission, assignment) {
    const answer = typeof submission?.answer === 'string' ? submission.answer : '';
    const hasMC = ['trac_nghiem', 'ket_hop', 'thi'].includes(assignment?.assessmentType) &&
        ((assignment?.questions?.length || submission?.questionSnapshot?.length) || submission?.mcAnswers);
    if (!hasMC) return answer || (typeof submission?.rawEssay === 'string' ? submission.rawEssay : '');
    if (typeof submission.rawEssay === 'string') return submission.rawEssay;
    const marker = '[PHẦN TỰ LUẬN]';
    if (/^\s*(?:📝\s*)?\[?PHẦN TRẮC NGHIỆM\]?/u.test(answer)) {
        const index = answer.indexOf(marker);
        return index >= 0 ? answer.slice(index + marker.length).trim() : '';
    }
    return answer;
};
/* Appeals record decisions separately from economic settlement. */
(() => {
    'use strict';
    let profile = null, records = {}, listening = null, listener = null;

    const RETENTION_MS=7*24*60*60*1000;
    let cleanupRunning=false;
    async function cleanupCompletedAppeals(){
        if(profile?.role!=='teacher'||cleanupRunning)return;
        cleanupRunning=true;
        try{
            for(const [key,record] of Object.entries(records)){
                if(record.archived===true||record.status!=='completed'||!Number.isFinite(record.decidedAt)||Date.now()-record.decidedAt<RETENTION_MS)continue;
                if(record.decision==='approved' && !(await db.ref('submission_appeal_settlements/'+key).once('value')).exists())continue;
                await transaction(db.ref('submission_appeals/'+key),current=>{
                    if(!current||current.archived||current.status!=='completed'||current.decidedAt!==record.decidedAt)return;
                    return {...current,reason:'[Đã dọn sau 7 ngày]',decisionReason:'[Đã dọn sau 7 ngày]',archived:true,archivedAt:firebase.database.ServerValue.TIMESTAMP};
                });
            }
        }catch(error){console.warn('[Appeals cleanup]',error.code||error.message);}
        finally{cleanupRunning=false;}
    }
    setInterval(()=>{cleanupCompletedAppeals();},60000);
    const labels = { sent: 'Đã gửi', reviewing: 'Đang tiếp nhận', completed: 'Đã hoàn tất' };
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const violated = s => s && (s.rewardForfeited === true || ['isLateFail','isAutoSubmitted','isCheatFail','isEssayMissing'].some(k => s[k] === true) || Object.values(s.redoViolationHistory || {}).some(v => v === true));
    const eligible = s => s && typeof s.grade === 'number' && typeof s.gradedAt === 'number' && (!s.redoCompletedAt || s.gradedAt >= s.redoCompletedAt) && !s.isRedoing && !s.isRegrading && violated(s);
    function card(s) {
        const key = s?._fbKey;
        if (!key || records[key]?.archived === true) return '';
        if (s.isRedoing && s.violationAudit && typeof s.violationAudit === 'object' && /teacher\.html/i.test(location.pathname)) return '<button type="button" class="btn-approve" data-repair-redo="'+escape(key)+'">Khôi phục quyền nộp lại</button>';
        if (!eligible(s) && !records[key]) return '';
        return `<button type="button" class="appeal-launch-button" data-appeal-key="${escape(key)}">⚖️ <span data-appeal-label="${escape(key)}">${escape(labels[records[key]?.status] || 'Kháng cáo')}</span></button>`;
    }
    function updateLabels() {
        document.querySelectorAll('[data-appeal-label]').forEach(el => {
            el.closest('[data-appeal-key]')?.toggleAttribute('hidden', records[el.dataset.appealLabel]?.archived === true);
            el.textContent = labels[records[el.dataset.appealLabel]?.status] || 'Kháng cáo';
        });
        let button = document.getElementById('appeals-notification');
        if (profile?.role !== 'teacher') { button?.remove(); return; }
        if (!button) {
            button = document.createElement('button'); button.id = 'appeals-notification';
            button.className = 'appeal-inbox-button';
            button.onclick = showList; document.body.appendChild(button);
        }
        const pending = Object.values(records).filter(r => r.status !== 'completed').length;
        button.textContent = `⚖️ Kháng cáo · ${pending}`;
        button.title = `${pending} kháng cáo chưa hoàn tất`;
        button.setAttribute('aria-label', `Mở kháng cáo, ${pending} chưa hoàn tất`);
        button.type = 'button';
    }
    function modal(title) {
        const dialog = document.createElement('dialog'); dialog.className='appeal-dialog';
        const header=document.createElement('header');header.className='appeal-header';
        const caption=document.createElement('div');
        const eyebrow=document.createElement('span');eyebrow.className='appeal-eyebrow';eyebrow.textContent='HỖ TRỢ HỌC TẬP';
        const heading=document.createElement('h2');heading.textContent=title;
        caption.append(eyebrow,heading);
        const close=document.createElement('button');close.className='appeal-close';close.textContent='×';close.setAttribute('aria-label','Đóng kháng cáo');close.onclick=()=>dialog.close();
        header.append(caption,close);
        const body=document.createElement('div');body.className='appeal-body';body.close=()=>dialog.close();
        dialog.append(header,body);document.body.appendChild(dialog);
        dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();return body;
    }
    function text(parent,value) {
        const content=String(value??'');
        if(content.startsWith('Bằng chứng trạng thái:') || content.startsWith('Bản ghi thưởng/phạt để kiểm tra:') || content.startsWith('Nội dung bài (văn bản nguồn):')) {
            const details=document.createElement('details');details.className='appeal-evidence';
            const summary=document.createElement('summary');const split=content.indexOf(':');summary.textContent=content.slice(0,split);
            const pre=document.createElement('pre');pre.textContent=content.slice(split+1).trim();details.append(summary,pre);parent.appendChild(details);return pre;
        }
        const p=document.createElement('p');p.textContent=content;p.className='appeal-note';
        if(content.startsWith('Lý do:') || content.startsWith('Đồng ý') || content.startsWith('Từ chối'))p.classList.add('appeal-reason');
        if(content.startsWith('Trạng thái:'))p.classList.add('appeal-status');
        parent.appendChild(p);return p;
    }
    function progress(parent,status) {
        const list=document.createElement('ol');list.className='appeal-progress';
        const statuses=['sent','reviewing','completed'];const current=statuses.indexOf(status);
        statuses.forEach((key,index)=>{const item=document.createElement('li');item.textContent=labels[key];if(index<=current)item.className='is-reached';if(index===current)item.setAttribute('aria-current','step');list.appendChild(item);});parent.appendChild(list);
    }
    async function transaction(ref, updater) {
        let callback;
        try { await new Promise((resolve,reject) => {callback=()=>resolve();ref.on('value',callback,reject);}); return await ref.transaction(updater,undefined,false); }
        finally { if(callback)ref.off('value',callback); }
    }
    async function open(key) {
        if (!profile) throw new Error('Vui lòng đăng nhập lại.');
        const ref = db.ref('submission_appeals/' + key);
        let appeal = (await ref.once('value')).val();
        if(appeal?.archived===true){(await AppDialog.alert('Kháng cáo đã hoàn tất và được dọn sau 7 ngày.'));return;}
        if (profile.role === 'teacher' && appeal?.status === 'sent') {
            const tx = await transaction(ref, current => current?.status === 'sent' ? {...current,status:'reviewing',reviewerUid:firebase.auth().currentUser.uid,reviewedAt:firebase.database.ServerValue.TIMESTAMP} : undefined);
            appeal = tx.snapshot.val();
        }
        const submission = (await db.ref('submissions/' + key).once('value')).val();
        if (!submission) throw new Error('Bài nộp không còn tồn tại.');
        const panel = modal(profile.role==='teacher' ? 'Xem xét kháng cáo' : 'Kháng cáo bài nộp');
        progress(panel,appeal?.status);
        text(panel, 'Mã bài: ' + (submission.assignmentId || key));
        text(panel, 'Học sinh: ' + submission.studentUsername + ' · Điểm: ' + submission.grade);
        if (!appeal) {
            if (profile.role === 'teacher') {text(panel,'Chưa có kháng cáo.');return;}
            if (!eligible(submission)) {text(panel,'Chỉ kháng cáo bài vi phạm đã được giáo viên chấm xong.');return;}
            const reason = document.createElement('textarea'); reason.rows=5; reason.maxLength=2000;
            reason.placeholder='Nhập lý do và thông tin để giáo viên kiểm tra (10–2000 ký tự)'; reason.setAttribute('aria-label','Lý do kháng cáo'); reason.style.width='100%';panel.appendChild(reason);
            const send=document.createElement('button');send.textContent='Gửi kháng cáo';send.className='appeal-primary';panel.appendChild(send);
            send.onclick=async()=>{
                const value=reason.value.trim(); if(value.length<10)return text(panel,'Vui lòng nhập lý do ít nhất 10 ký tự.');
                send.disabled=true;
                try {
                    await transaction(ref,current=>current ? undefined : {submissionKey:key,studentUid:firebase.auth().currentUser.uid,studentUsername:profile.username,reason:value,status:'sent',createdAt:firebase.database.ServerValue.TIMESTAMP,gradeAtRequest:submission.grade,gradedAtRequest:submission.gradedAt});
                    // Always re-read after an uncertain response; never invent another appeal ID.
                    const stored=(await ref.once('value')).val();if(!stored)throw Error('Chưa xác minh được kháng cáo. Đóng rồi mở lại để kiểm tra.');
                    panel.close();await open(key);
                } catch(error){text(panel,'Chưa xác nhận gửi thành công. Mở lại bài để kiểm tra trước khi thử lại. '+error.message);send.disabled=false;}
            };return;
        }
        text(panel,'Trạng thái: '+labels[appeal.status]);text(panel,'Lý do: '+appeal.reason);
        if(appeal.status==='completed'){
            text(panel,(appeal.decision==='approved'?'Đồng ý':'Từ chối')+' — '+appeal.decisionReason);
            if(appeal.decision==='approved')await showSettlement(panel,key,appeal,submission);
            return;
        }
        if(profile.role!=='teacher')return;
        text(panel,'Kiểm tra nội dung bài, hạn nộp, lần làm lại, bằng chứng vi phạm và khoản phạt đã áp dụng trước khi quyết định.');
        text(panel,'Nội dung bài (văn bản nguồn): '+String(submission.answer||''));
        text(panel,'Bằng chứng trạng thái: '+JSON.stringify({gradedAt:submission.gradedAt,redoCount:submission.redoCount,isLateFail:submission.isLateFail,isAutoSubmitted:submission.isAutoSubmitted,isCheatFail:submission.isCheatFail,isEssayMissing:submission.isEssayMissing,history:submission.redoViolationHistory,audit:submission.violationAudit},null,2));
        const basis=document.createElement('select');basis.setAttribute('aria-label','Căn cứ chấp thuận');
        for(const [value,label] of [['false_positive','Phạt nhầm — đề nghị hoàn phạt và xét thưởng'],['leniency','Vi phạm nhẹ — chỉ duyệt xét thưởng lại']]){const option=document.createElement('option');option.value=value;option.textContent=label;basis.appendChild(option);}panel.appendChild(basis);
        const reason=document.createElement('textarea');reason.rows=4;reason.maxLength=2000;reason.placeholder='Kết quả kiểm tra và lý do quyết định (ít nhất 10 ký tự)';reason.style.width='100%';panel.appendChild(reason);
        const buttons=[];
        for(const [decision,label] of [['approved','Đồng ý'],['rejected','Từ chối']]){
            const button=document.createElement('button');button.textContent=label;button.className=decision==='approved'?'appeal-approve':'appeal-reject';buttons.push(button);panel.appendChild(button);
            button.onclick=async()=>{
                if(reason.value.trim().length<10)return text(panel,'Vui lòng ghi kết quả kiểm tra ít nhất 10 ký tự.');
                buttons.forEach(b=>b.disabled=true);
                try {
                    // Decision and its notification commit together; deterministic key prevents duplicate mail.
                    const current=(await ref.once('value')).val();
                    if(current?.status!=='reviewing'){panel.close();await open(key);return;}
                    const completed={...current,status:'completed',decision,decisionReason:reason.value.trim(),decisionBasis:decision==='approved'?basis.value:'rejected',decidedBy:firebase.auth().currentUser.uid,decidedAt:firebase.database.ServerValue.TIMESTAMP,settlementStatus:decision==='approved'?'pending_review':'not_applicable'};
                    const message={message:'Kháng cáo bài '+String(submission.assignmentId||key)+' đã hoàn tất. Kết quả: '+(decision==='approved'?'Đồng ý':'Từ chối')+'.\nLý do: '+reason.value.trim()+(decision==='approved'?'\nQuyền lợi đang chờ giáo viên xác minh và đối soát.':''),giftType:'none',giftValue:0,source:'submission_appeal_completed',submissionKey:key,skipInboxGiftAnimation:true,suppressInboxArrivalAnimation:true,timestamp:firebase.database.ServerValue.TIMESTAMP,timeString:new Date().toLocaleString('vi-VN')};
                    await db.ref().update({['submission_appeals/'+key]:completed,['inbox_messages/'+current.studentUsername+'/appeal_completed_'+key]:message});
                    panel.close();await open(key);
                }catch(error){text(panel,'Chưa xác nhận quyết định đã lưu. Đóng rồi mở lại để kiểm tra. '+error.message);buttons.forEach(b=>b.disabled=false);}
            };
        }
    }
    async function showSettlement(panel, key, appeal, submission) {
        const settlementRef = db.ref('submission_appeal_settlements/' + key);
        const existing = (await settlementRef.once('value')).val();
        if (existing) { text(panel, existing.source === 'grade_settlement_v5'
            ? `Đã đối soát qua sổ thưởng/phạt của bài. ${existing.reason}`
            : `Đã đối soát: +${existing.coinDelta} Coin, +${existing.ticketDelta} vé. ${existing.reason}`); return; }
        if (profile.role !== 'teacher') { text(panel, 'Giáo viên đã đồng ý; đang chờ xác minh và đối soát quyền lợi.'); return; }
        const username = appeal.studentUsername;
        const event = (await db.ref('grade_reward_events/' + username + '/' + key).once('value')).val();
        if (Number(event?.version || 0) >= 5) {
            text(panel, 'Bài dùng đối soát thưởng trừ phạt: khoản hoàn được tính bằng chênh lệch trong cùng sổ thưởng, không nhập và cộng thêm lần nữa.');
            if (appeal.decisionBasis !== 'false_positive') {
                text(panel, 'Vi phạm nhẹ vẫn giữ mức phạt đã áp dụng. Nếu điểm cần chỉnh, lưu điểm mới tại Danh sách bài đã nộp.');
                return;
            }
            const reconcile = document.createElement('button');
            reconcile.className = 'appeal-primary';
            reconcile.textContent = 'Xóa lỗi ghi nhận nhầm và đối soát chênh lệch';
            panel.appendChild(reconcile);
            reconcile.onclick = async () => {
                reconcile.disabled = true;
                try {
                    await pardonTeacherSubmissionWithAudit(key);
                    const fresh = (await db.ref('submissions/' + key).once('value')).val();
                    if (!fresh || fresh.grade === null || fresh.grade === undefined || fresh.grade === '')
                        throw Error('Đã xóa lỗi; cần giáo viên chấm và lưu điểm để đối soát.');
                    const sub = {...fresh, _fbKey:key};
                    const result = await issueTeacherGradeRewardV2(sub, fresh.grade, fresh.gradedAt || Date.now());
                    // The balance adjustment already committed in the grading ledger.
                    // This zero-value appeal receipt records completion without crediting twice.
                    const [coins,tickets] = await Promise.all([
                        db.ref('student_coins/' + username).once('value'),
                        db.ref('student_bonus_tickets/' + username).once('value')
                    ]);
                    await settlementRef.set({submissionKey:key,studentUsername:username,
                        actorUid:firebase.auth().currentUser.uid,decisionBasis:appeal.decisionBasis,
                        rewardCoins:0,rewardTickets:0,refundCoins:0,refundTickets:0,coinDelta:0,ticketDelta:0,
                        previousCoins:coins.val() || 0,previousTickets:tickets.val() || 0,
                        source:'grade_settlement_v5',rewardRevision:result.revision,
                        reason:`Đã xóa lỗi ghi nhận nhầm và đối soát theo sổ thưởng/phạt, phiên bản ${result.revision}. Xem thư thông báo chi tiết.`,
                        createdAt:firebase.database.ServerValue.TIMESTAMP});
                    text(panel, `Đã đối soát theo điểm ${result.score}. Kết quả ròng của bài: ${result.ticketDelta} vé, ${result.coinReward} Coin. Hộp thư ghi rõ phần chênh lệch vừa xử lý.`);
                } catch (error) {
                    text(panel, 'Chưa xác nhận hoàn tất. Mở lại để kiểm tra và thử tiếp; sổ đối soát sẽ không cộng trùng. ' + error.message);
                }
            };
            return;
        }
        text(panel, 'Đối soát thủ công: chỉ nhập khoản phạt đã xác minh chưa hoàn và phần thưởng còn thiếu sau khi trừ phần đã phát. Không nhập lại toàn bộ thưởng đã nhận.');
        text(panel, 'Bản ghi thưởng/phạt để kiểm tra: ' + JSON.stringify(event || {}, null, 2));
        const inputs = {};
        for (const [name,label] of [['rewardCoins','Coin thưởng còn thiếu'],['rewardTickets','Vé thưởng còn thiếu'],['refundCoins','Coin phạt nhầm cần hoàn'],['refundTickets','Vé phạt nhầm cần hoàn']]) {
            const row=document.createElement('label');row.style.display='block';row.textContent=label+' ';
            const input=document.createElement('input');input.type='number';input.min='0';input.max=name.includes('Coins')?'999999':'9999';input.step='1';input.value='0';
            if(name.startsWith('refund') && appeal.decisionBasis!=='false_positive')input.disabled=true;
            inputs[name]=input;row.appendChild(input);panel.appendChild(row);
        }
        const reason=document.createElement('textarea');reason.placeholder='Ghi căn cứ khoản hoàn và cách tính phần thưởng còn thiếu';reason.rows=3;reason.maxLength=2000;reason.style.width='100%';panel.appendChild(reason);
        const save=document.createElement('button');save.textContent='Xác nhận đối soát quyền lợi';save.className='appeal-primary';panel.appendChild(save);
        save.onclick=async()=>{
            const amounts=Object.fromEntries(Object.entries(inputs).map(([name,input])=>[name,Number(input.value)]));
            if(Object.entries(amounts).some(([name,n])=>!Number.isSafeInteger(n)||n<0||n>(name.includes('Coins')?999999:9999)))return text(panel,'Nhập số nguyên không âm trong giới hạn.');
            if(appeal.decisionBasis!=='false_positive' && (amounts.refundCoins||amounts.refundTickets))return text(panel,'Vi phạm nhẹ không được hoàn khoản phạt cũ.');
            if(reason.value.trim().length<10)return text(panel,'Ghi rõ căn cứ đối soát, ít nhất 10 ký tự.');
            const coinDelta=amounts.rewardCoins+amounts.refundCoins, ticketDelta=amounts.rewardTickets+amounts.refundTickets;
            if(!(await AppDialog.confirm(`Xác nhận cộng ${coinDelta} Coin và ${ticketDelta} vé sau khi đã kiểm tra lịch sử? Quyết định đối soát này chỉ thực hiện một lần.`)))return;
            save.disabled=true;
            try {
                const [coinSnap,ticketSnap,proof]=await Promise.all([db.ref('student_coins/'+username).once('value'),db.ref('student_bonus_tickets/'+username).once('value'),settlementRef.once('value')]);
                if(proof.exists()){panel.close();await open(key);return;}
                const previousCoins=coinSnap.val()??0,previousTickets=ticketSnap.val()??0;
                if(!Number.isFinite(previousCoins)||!Number.isFinite(previousTickets))throw Error('Số dư không hợp lệ, cần kiểm tra dữ liệu.');
                const record={submissionKey:key,studentUsername:username,actorUid:firebase.auth().currentUser.uid,decisionBasis:appeal.decisionBasis,...amounts,coinDelta,ticketDelta,previousCoins,previousTickets,reason:reason.value.trim(),createdAt:firebase.database.ServerValue.TIMESTAMP};
                await db.ref().update({['submission_appeal_settlements/'+key]:record,['student_coins/'+username]:previousCoins+coinDelta,['student_bonus_tickets/'+username]:previousTickets+ticketDelta});
                panel.close();await open(key);
            }catch(error){
                text(panel,'Chưa xác nhận đối soát. Đóng và mở lại để đọc biên nhận trước khi thao tác tiếp. '+error.message);
                // Keep this attempt disabled: a network error does not prove the write failed.
            }
        };
    }

    function showList(){
        const panel=modal('Danh sách kháng cáo');
        const entries=Object.entries(records).filter(([,record])=>record.archived!==true).sort((a,b)=>b[1].createdAt-a[1].createdAt);
        if(!entries.length){text(panel,'Chưa có kháng cáo nào.');return;}
        for(const [key,record] of entries){
            const button=document.createElement('button');button.type='button';button.className='appeal-list-row';
            const name=document.createElement('strong');name.textContent=record.studentUsername;
            const status=document.createElement('span');status.className='appeal-list-status';status.dataset.status=record.status;status.textContent=labels[record.status]||'Đã gửi';
            const arrow=document.createElement('span');arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
            button.append(name,status,arrow);
            button.onclick=()=>{panel.close();open(key).catch(e=>AppDialog.notify(e.message));};panel.appendChild(button);
        }
    }
    document.addEventListener('click',event=>{const button=event.target.closest('[data-appeal-key]');if(button)open(button.dataset.appealKey).catch(error=>AppDialog.notify(error.message));});
    document.addEventListener('click',async event=>{
        const button=event.target.closest('[data-repair-redo]');if(!button || profile?.role!=='teacher')return;
        button.disabled=true;
        try {
            const ref=db.ref('submissions/'+button.dataset.repairRedo);
            await transaction(ref,current=>current?.isRedoing && current.violationAudit && typeof current.violationAudit==='object' ? {...current,violationAudit:JSON.stringify(current.violationAudit)} : undefined);
            text(button.parentElement,'Đã giữ nguyên lịch sử và khôi phục định dạng. Học sinh tải lại trang để nộp lại.');
        }catch(error){(await AppDialog.alert(error.message));button.disabled=false;}
    });
    window.AssignmentAppeals={card};
    firebase.auth().onAuthStateChanged(async user=>{
        if(listening&&listener)listening.off('value',listener);profile=null;records={};updateLabels();
        if(!user)return;
        try {
            const value=(await db.ref('users/'+user.uid).once('value')).val();if(firebase.auth().currentUser?.uid!==user.uid)return;profile=value;
            listening=profile.role==='teacher'?db.ref('submission_appeals'):db.ref('submission_appeals').orderByChild('studentUid').equalTo(user.uid);
            listener=snapshot=>{records=snapshot.val()||{};updateLabels();cleanupCompletedAppeals();};listening.on('value',listener,error=>console.error('[Appeals]',error.code));
        }catch(error){console.error('[Appeals]',error.code);}
    });
})();
