(() => {
 'use strict';
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let opening=false;
 document.addEventListener('click',async event=>{
  const trigger=event.target.closest('[data-edit-assigned-quiz]');if(!trigger||opening)return;
  opening=true;trigger.disabled=true;
  try{
   const key=trigger.dataset.editAssignedQuiz;
   const ref=db.ref('assignments/'+key),snapshot=await ref.once('value'),assignment=snapshot.val();
   if(!assignment||!Array.isArray(assignment.questions))throw Error('Không tìm thấy bộ câu hỏi. Hãy tải lại danh sách.');
   const original=JSON.stringify(assignment.questions);
   const root=document.createElement('dialog');root.className='teacher-quiz-editor ui-theme-immune';
   root.innerHTML=`<header><div><small>CHỈNH SỬA TRẮC NGHIỆM ĐÃ GIAO</small><h2>${escape(assignment.title)}</h2></div><button type="button" data-close>Đóng</button></header><p>Chỉnh câu hỏi, các lựa chọn và đáp án đúng. Những bài nộp có bản đề lưu riêng giữ nguyên bản đề đó. Thay đổi áp dụng cho đề học sinh mở sau khi lưu.</p><div class="tqe-layout"><div class="tqe-questions">${assignment.questions.map((q,i)=>`<section id="tqe-${i}" class="tqe-question"><h3>Câu ${i+1}</h3><label>Nội dung câu hỏi<textarea data-field="qText">${escape(q.qText)}</textarea></label>${['A','B','C','D'].map(letter=>`<div class="tqe-option"><label><input type="radio" name="tqe-correct-${i}" value="${letter}" ${q.correct===letter?'checked':''}> ${letter}</label><input aria-label="Câu ${i+1}, lựa chọn ${letter}" data-field="${letter}" value="${escape(q[letter])}"></div>`).join('')}</section>`).join('')}</div><aside><strong>Danh sách câu hỏi</strong><div class="tqe-nav">${assignment.questions.map((_,i)=>`<button type="button" data-question="${i}">${i+1}</button>`).join('')}</div><p>Chọn nút tròn cạnh A–D để đặt đáp án đúng.</p></aside></div><footer><span role="status"></span><button type="button" data-save>Lưu trắc nghiệm</button></footer>`;
   document.body.append(root);root.showModal();let saving=false;
   root.querySelector('[data-close]').onclick=()=>{if(!saving){root.close();root.remove();}};
   root.addEventListener('cancel',event=>{if(saving)event.preventDefault();else root.remove();});
   root.querySelectorAll('[data-question]').forEach(button=>button.onclick=()=>root.querySelector('#tqe-'+button.dataset.question).scrollIntoView({block:'start',behavior:'smooth'}));
   root.querySelector('[data-save]').onclick=async()=>{
    if(saving)return;
    const questions=[...root.querySelectorAll('.tqe-question')].map((section,i)=>{const q={...assignment.questions[i]};section.querySelectorAll('[data-field]').forEach(input=>q[input.dataset.field]=input.value.trim());q.correct=section.querySelector('input[type=radio]:checked')?.value||'';return q;});
    const status=root.querySelector('[role=status]');
    if(questions.some(q=>!q.qText||!q.A||!q.B||!q.C||!q.D||!q.correct)){status.textContent='Điền đủ nội dung và chọn đáp án đúng cho mọi câu.';return;}
    if(assignment.randomExamConfig?.engineVersion===2){try{window.RandomExamEngine.versions(questions,assignment.randomExamConfig);}catch(error){status.textContent=error.message;return;}}
    saving=true;root.querySelector('[data-save]').disabled=true;status.textContent='Đang lưu…';
    try{
     const result=await ref.transaction(current=>{if(!current||JSON.stringify(current.questions)!==original)return;return {...current,questions,questionsUpdatedAt:Date.now()};},undefined,false);
     if(!result.committed)throw Error('Bộ câu hỏi đã thay đổi ở nơi khác. Đóng và mở lại để kiểm tra trước khi lưu.');
     root.close();root.remove();await window.AppDialog.alert('Đã lưu phần trắc nghiệm.');
    }catch(error){status.textContent=error.message;}
    finally{saving=false;root.querySelector('[data-save]').disabled=false;}
   };
  }catch(error){await window.AppDialog.alert(error.message);}
  finally{opening=false;trigger.disabled=false;}
 });
})();
