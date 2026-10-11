(() => {
 'use strict';
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const editorStyles="\n:host{position:fixed!important;inset:0!important;margin:auto!important;width:min(1120px,calc(100vw - 40px))!important;height:min(820px,calc(100dvh - 40px))!important;max-width:none!important;max-height:none!important;padding:0!important;border:1px solid #dce3ef!important;border-radius:20px!important;box-sizing:border-box!important;background:#f5f7fb!important;color:#22314d!important;box-shadow:0 24px 80px #101c3f44!important;overflow:hidden!important;font:14px/1.5 'Segoe UI',Arial,sans-serif!important}\n:host{display:grid!important;grid-template-rows:auto auto minmax(0,1fr) auto!important;grid-template-columns:minmax(0,1fr)!important}\n*{box-sizing:border-box}header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 26px;background:white;border-bottom:1px solid #e2e7f0}header>div{min-width:0}small{font-size:11px;font-weight:700;letter-spacing:1px;color:#65738e}h2{margin:5px 0 0;font-size:23px;line-height:1.3;overflow-wrap:anywhere}button{font:inherit;font-weight:600;cursor:pointer;border:1px solid #dce3ef;border-radius:9px;padding:9px 15px;background:white;color:#34415c;width:auto;flex-shrink:0}button:hover{background:#eef1ff;border-color:#9ba5e7}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #b8c0ff;outline-offset:2px}button:disabled{opacity:.55;cursor:wait}[data-close]{display:flex;gap:8px;align-items:center}.tqe-intro{margin:0;padding:14px 26px;color:#65738e;font-size:13px}.tqe-layout{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:20px;min-height:0;padding:0 26px 20px}.tqe-questions{overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;min-height:0;padding-right:5px}.tqe-question{background:white;border:1px solid #e0e5ee;border-radius:14px;padding:20px;margin-bottom:16px;scroll-margin-top:0}.tqe-question:last-child{margin-bottom:0}.tqe-question-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px}h3{margin:0;font-size:17px}.tqe-question-heading span{font-size:11px;color:#687790}.tqe-question>label{display:block;font-size:13px;font-weight:600}textarea,input:not([type=radio]){width:100%;font:inherit;color:#22314d;background:#fff;border:1px solid #dce3ef;border-radius:9px;padding:10px 12px;min-width:0}textarea{min-height:90px;resize:vertical;margin:7px 0 12px}.tqe-option{display:flex;align-items:center;gap:12px;margin-top:9px;border:1px solid #e4e9f0;padding:8px 10px;border-radius:10px}.tqe-option:has(input:checked){border-color:#8f9be8;background:#f1f3ff}.tqe-option label{display:flex;gap:8px;align-items:center;font-weight:700;cursor:pointer}.tqe-option input[type=radio]{width:17px;height:17px;margin:0;accent-color:#5865d8}.tqe-option input:not([type=radio]){border-color:transparent;background:transparent;padding:5px 7px}.tqe-layout aside{min-width:0;align-self:start;max-height:100%;overflow:auto;background:white;border:1px solid #e0e5ee;border-radius:14px;padding:18px}.tqe-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}.tqe-nav button{padding:0;height:36px;background:#f1f3ff;color:#4b58be;border-color:#dde1fa}.tqe-layout aside p{font-size:12px;color:#65738e;margin:0}footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 26px;background:white;border-top:1px solid #e0e5ee}[role=status]{font-size:12px;color:#65738e;overflow-wrap:anywhere}[data-save]{background:#5865d8;color:white;border-color:#5865d8;padding:11px 22px}[data-save]:hover{background:#4653bf}\n@media(max-width:650px){:host{width:calc(100vw - 16px)!important;height:calc(100dvh - 16px)!important;border-radius:14px!important}header{padding:16px;gap:10px}h2{font-size:18px}small{font-size:9px;letter-spacing:.5px}[data-close] span{display:none}.tqe-intro{padding:12px 16px;font-size:12px}.tqe-layout{display:flex;flex-direction:column;padding:0 16px 14px;gap:12px}.tqe-layout aside{order:-1;width:100%;padding:10px 12px;overflow:visible}.tqe-layout aside strong,.tqe-layout aside p{display:none}.tqe-nav{display:flex;overflow:auto;margin:0;padding:2px;gap:7px}.tqe-nav button{min-width:36px}.tqe-questions{flex:1;min-height:0;padding-right:2px}.tqe-question{padding:14px}.tqe-question-heading span{display:none}footer{padding:12px 16px;gap:10px}[data-save]{padding:10px 14px}[role=status]{font-size:11px}}\n";
 let opening=false;
 function openQuizEditor(assignment, {ref=null, draftBlocks=null, focusIndex=-1, message=''}={}) {
   document.querySelector('dialog.teacher-quiz-editor[data-draft]')?.remove();
   const original=JSON.stringify(assignment.questions);
   const dialog=document.createElement('dialog');dialog.className='teacher-quiz-editor ui-theme-immune';dialog.setAttribute('aria-label',draftBlocks?'Kiểm tra trắc nghiệm':'Chỉnh sửa trắc nghiệm đã giao');if(draftBlocks)dialog.dataset.draft='true';
   const host=document.createElement('div');dialog.append(host);const root=host.attachShadow({mode:'open'});
   root.innerHTML=`<style>${editorStyles}</style><header><div><small>${draftBlocks?'KIỂM TRA TRẮC NGHIỆM TRƯỚC KHI GIAO':'CHỈNH SỬA TRẮC NGHIỆM ĐÃ GIAO'}</small><h2>${escape(assignment.title)}</h2></div><button type="button" data-close aria-label="Đóng cửa sổ">✕ <span>Đóng</span></button></header><p class="tqe-intro">${draftBlocks?'Đọc lại từng câu, kiểm tra A–D và đáp án đúng. Chỉnh sửa được giữ ngay trong bản nháp, chưa giao cho học sinh.':'Chỉnh nội dung và chọn đáp án đúng. Thay đổi áp dụng cho đề mở sau khi lưu; bài nộp có bản đề riêng giữ nguyên bản đó.'}</p><div class="tqe-layout"><div class="tqe-questions">${assignment.questions.map((q,i)=>`<section id="tqe-${i}" class="tqe-question"><div class="tqe-question-heading"><h3>Câu ${i+1}</h3><span>Chọn một đáp án đúng</span>${draftBlocks?`<button type="button" data-remove="${i}" aria-label="Xóa câu ${i+1}">Xóa câu</button>`:''}</div><label>Nội dung câu hỏi<textarea data-field="qText">${escape(q.qText)}</textarea></label>${['A','B','C','D'].map(letter=>`<div class="tqe-option"><label><input type="radio" name="tqe-correct-${i}" value="${letter}" ${q.correct===letter?'checked':''}> ${letter}</label><input aria-label="Câu ${i+1}, lựa chọn ${letter}" data-field="${letter}" value="${escape(q[letter])}"></div>`).join('')}</section>`).join('')}</div><aside><strong>Danh sách câu hỏi</strong><div class="tqe-nav">${assignment.questions.map((_,i)=>`<button type="button" data-question="${i}">${i+1}</button>`).join('')}</div><p>Chọn nút tròn cạnh A–D để đặt đáp án đúng.</p></aside></div><footer><span role="status">${assignment.questions.length} câu hỏi · Chưa có thay đổi</span><button type="button" data-save>${draftBlocks?'Kiểm tra xong':'Lưu trắc nghiệm'}</button></footer>`;
   document.body.append(dialog);dialog.showModal();let saving=false;
   root.querySelector('[data-close]').onclick=()=>{if(!saving){dialog.close();dialog.remove();}};
   dialog.addEventListener('cancel',event=>{if(saving)event.preventDefault();else dialog.remove();});
   const readQuestions=()=>[...root.querySelectorAll('.tqe-question')].map((section,i)=>{
    const q={...assignment.questions[i]};section.querySelectorAll('[data-field]').forEach(input=>q[input.dataset.field]=input.value.trim());
    q.correct=section.querySelector('input[type=radio]:checked')?.value||'';return q;
   });
   const jump=(index,text='')=>{
    const section=root.querySelector('#tqe-'+index);if(!section)return;
    root.querySelectorAll('.tqe-question').forEach(el=>el.style.outline='');
    section.style.outline=text?'2px solid #e11d48':'';
    section.scrollIntoView({block:'start',behavior:'instant'});
    const field=[...section.querySelectorAll('[data-field]')].find(el=>!el.value.trim()) ||
     (!section.querySelector('input[type=radio]:checked')?section.querySelector('input[type=radio]'):section.querySelector('textarea'));
    field?.focus({preventScroll:true});if(text)root.querySelector('[role=status]').textContent=text;
   };
   const syncDraft=()=>{
    if(!draftBlocks)return;
    readQuestions().forEach((q,i)=>{
     const block=draftBlocks[i];
     for(const field of ['qText','A','B','C','D'])block.querySelector(field==='qText'?'.q-text':'.q-opt'+field).value=q[field];
     block.querySelectorAll('input[type=radio]').forEach(input=>input.checked=input.value===q.correct);
     block.dispatchEvent(new Event('input',{bubbles:true}));
    });
    window.refreshTeacherQuizCheck?.();
   };
   root.addEventListener('input',()=>{syncDraft();root.querySelector('[role=status]').textContent=draftBlocks?'Đã cập nhật vào bản nháp':'Có thay đổi chưa lưu';});
   if(focusIndex>=0)requestAnimationFrame(()=>jump(focusIndex,message));
   root.querySelectorAll('[data-question]').forEach(button=>button.onclick=()=>root.querySelector('#tqe-'+button.dataset.question).scrollIntoView({block:'start',behavior:'smooth'}));
   root.querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>{
    const index=Number(button.dataset.remove);
    syncDraft();
    window.removeQuestion(draftBlocks[index].querySelector('input'));
    dialog.close();dialog.remove();
    window.refreshTeacherQuizCheck();
    const remaining=document.querySelectorAll('#questionsContainer .question-block').length;
    if(remaining)window.openTeacherDraftQuizCheck(Math.min(index,remaining-1));
   });
   root.querySelector('[data-save]').onclick=async()=>{
    if(saving)return;
    const questions=readQuestions();
    const status=root.querySelector('[role=status]');
    const invalid=questions.findIndex(q=>!q.qText||!q.A||!q.B||!q.C||!q.D||!q.correct);
    if(invalid>=0){jump(invalid,`Câu ${invalid+1}: điền đủ nội dung, lựa chọn A–D và chọn đáp án đúng.`);return;}
    if(draftBlocks){syncDraft();dialog.close();dialog.remove();return;}
    if(assignment.randomExamConfig?.engineVersion===2){try{window.RandomExamEngine.versions(questions,assignment.randomExamConfig);}catch(error){status.textContent=error.message;return;}}
    saving=true;root.querySelector('[data-save]').disabled=true;status.textContent='Đang lưu…';
    try{
     const result=await ref.transaction(current=>{if(!current||JSON.stringify(current.questions)!==original)return;return {...current,questions,questionsUpdatedAt:Date.now()};},undefined,false);
     if(!result.committed)throw Error('Bộ câu hỏi đã thay đổi ở nơi khác. Đóng và mở lại để kiểm tra trước khi lưu.');
     dialog.close();dialog.remove();await window.AppDialog.alert('Đã lưu phần trắc nghiệm.');
    }catch(error){status.textContent=error.message;}
    finally{saving=false;root.querySelector('[data-save]').disabled=false;}
   };
 }
 window.openTeacherDraftQuizCheck=function(focusIndex=-1,message=''){
  const blocks=[...document.querySelectorAll('#questionsContainer .question-block')];
  if(!blocks.length)return;
  const questions=blocks.map(block=>({qText:block.querySelector('.q-text')?.value||'',
   ...Object.fromEntries(['A','B','C','D'].map(k=>[k,block.querySelector('.q-opt'+k)?.value||''])),
   correct:block.querySelector('input[type=radio]:checked')?.value||''}));
  openQuizEditor({title:document.getElementById('title')?.value||'Bộ câu hỏi đang soạn',questions},{draftBlocks:blocks,focusIndex,message});
 };
 window.refreshTeacherQuizCheck=function(){
  const count=document.querySelectorAll('#questionsContainer .question-block').length;
  const panel=document.getElementById('teacherQuizCheckPanel');if(panel)panel.hidden=count===0;
  const label=document.getElementById('teacherQuizCheckCount');if(label)label.textContent=`${count} câu hỏi đã thêm · Xem lại nội dung và đáp án trước khi giao.`;
 };
 const container=document.getElementById('questionsContainer');
 if(container){new MutationObserver(window.refreshTeacherQuizCheck).observe(container,{childList:true});window.refreshTeacherQuizCheck();}
 document.addEventListener('click',async event=>{
  const trigger=event.target.closest('[data-edit-assigned-quiz]');if(!trigger||opening)return;
  opening=true;trigger.disabled=true;
  try{
   const ref=db.ref('assignments/'+trigger.dataset.editAssignedQuiz),snapshot=await ref.once('value'),assignment=snapshot.val();
   if(!assignment||!Array.isArray(assignment.questions))throw Error('Không tìm thấy bộ câu hỏi. Hãy tải lại danh sách.');
   openQuizEditor(assignment,{ref});
  }catch(error){await window.AppDialog.alert(error.message);}
  finally{opening=false;trigger.disabled=false;}
 });
})();

