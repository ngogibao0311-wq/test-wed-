(() => {
 'use strict';
 const letters=['A','B','C','D'];
 const cache=new Map();
 function hash(text){let h=2166136261;for(const c of String(text)){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;}
 function shuffle(items,seed){let n=hash(seed);const a=items.slice();for(let i=a.length-1;i>0;i--){n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);const j=Math.floor(((t^(t>>>14))>>>0)/4294967296*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 const label=i=>i<26?String.fromCharCode(65+i):'A'+(i+1);
 function versions(questions,config){
  const key=JSON.stringify([questions,config.versionCount,config.questionCount,config.shuffleQuestions,config.shuffleAnswers,config.seed]);
  if(cache.has(key))return JSON.parse(cache.get(key));
  const count=Number(config.versionCount),take=Number(config.questionCount)||questions.length;
  if(!Number.isInteger(count)||count<1||count>50||!Number.isInteger(take)||take<1||take>questions.length)throw Error('Số câu hoặc số mã đề không hợp lệ.');
  const source=questions.map((q,i)=>({...q,questionId:q.questionId||'legacy_'+i,_sourceIndex:i}));
  const result=[],seen=new Set();
  for(let attempt=0;attempt<Math.max(200,count*100)&&result.length<count;attempt++){
   const seed=String(config.seed||'campus-exam-v2')+'|'+attempt;
   let selected=take<source.length?shuffle(source,seed+'select').slice(0,take):source.slice();
   selected=config.shuffleQuestions?shuffle(selected,seed+'order'):selected.sort((a,b)=>a._sourceIndex-b._sourceIndex);
   selected=selected.map((q,i)=>{const out={...q,_displayIndex:i};const order=config.shuffleAnswers?shuffle(letters,seed+'answer'+q.questionId):letters;order.forEach((old,j)=>{out[letters[j]]=q[old];if(old===q.correct)out.correct=letters[j];});return out;});
   // Compare what the learner actually sees, not hidden IDs or answer keys.
   const signature=JSON.stringify(selected.map(q=>[q.qText,q.A,q.B,q.C,q.D]));
   if(seen.has(signature))continue;seen.add(signature);result.push(selected);
  }
  if(result.length<count)throw Error('Bộ câu hỏi chỉ tạo được '+result.length+' mã đề khác nhau với thiết lập này. Hãy giảm số mã đề, thêm câu hỏi hoặc bật xáo trộn.');
  if(cache.size>=8)cache.delete(cache.keys().next().value);
  cache.set(key,JSON.stringify(result));
  return result;
 }
 window.RandomExamEngine={versions,forStudent(assignment,username){const config=assignment.randomExamConfig;const all=versions(assignment.questions,config);const index=hash((assignment.id||assignment._fbKey)+'|'+username)%all.length;return {questions:all[index],versionIndex:index,versionCode:label(index),randomized:true};}};
})();
