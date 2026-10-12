/* Keep teacher source edits on the server so every ranking input advances its epoch. */
(() => {
 const roots=new Set(['assignments','submissions','users','video_tracking','roadmap_settings','leaderboard_settings','assignment_locks']);
 const prototype=Object.getPrototypeOf(db.ref()),base={};
 for(const k of ['set','update','remove','transaction','push'])base[k]=prototype[k];
 const pathOf=ref=>decodeURIComponent(new URL(ref.toString()).pathname).replace(/^\/+|\/+$/g,'');
 const enabled=()=>window.ECONOMY_SERVER_ENABLED===true&&window.__economyRole==='teacher';
 const source=path=>roots.has(path.split('/')[0]);
 async function send(patch){
  if(Object.keys(patch).some(p=>!source(p)&&!['exam_sessions','name_change_requests','transaction_logs'].includes(p.split('/')[0])))throw Error('Thao tác này chưa được chuyển sang máy chủ; chưa ghi dữ liệu.');
  const entries=Object.entries(patch);
  if(entries.length>10&&entries.every(([p,v])=>v===null&&/^(assignments|submissions)\/[^/]+$/.test(p))){
   // Reward revocation precedes this stage. Bound each removal batch and keep
   // assignments until all selected submissions have been removed. The server
   // refuses the final assignment removal if a new submission appeared.
   for(const root of ['submissions','assignments']){
    const rows=entries.filter(([p])=>p.startsWith(root+'/'));
    for(let i=0;i<rows.length;i+=10)await send(Object.fromEntries(rows.slice(i,i+10)));
   }
   return {updated:true};
  }
  const slot='source:'+Object.keys(patch).sort().join('|');
  const resumed=await window.EconomyClient.resume(slot);
  if(resumed?.args?.patch===JSON.stringify(patch))return resumed.result;
  const expected={};
  for(const path of Object.keys(patch))expected[path]=(await db.ref(path).once('value')).val();
  return window.EconomyClient.execute('teacher_source_write',{patch:JSON.stringify(patch),expected:JSON.stringify(expected)},{slot});
 }
 const completed=(task,callback)=>{if(callback)task.then(()=>callback(null),e=>callback(e));return task;};
 prototype.set=function(value,callback){const path=pathOf(this);return enabled()&&source(path)?completed(send({[path]:value}),callback):base.set.call(this,value,callback);};
 prototype.update=function(value,callback){
  const path=pathOf(this),patch=Object.fromEntries(Object.entries(value).map(([k,v])=>[path?path+'/'+k:k,v]));
  return enabled()&&Object.keys(patch).some(source)?completed(send(patch),callback):base.update.call(this,value,callback);
 };
 prototype.remove=function(callback){return enabled()&&source(pathOf(this))?this.set(null,callback):base.remove.call(this,callback);};
 prototype.push=function(value,callback){
  if(!enabled()||!source(pathOf(this))||arguments.length===0)return base.push.apply(this,arguments);
  const ref=base.push.call(this),task=ref.set(value,callback);
  ref.then=(resolve,reject)=>task.then(()=>{const plain=db.ref(pathOf(ref));return resolve?resolve(plain):plain;},reject);
  ref.catch=reject=>task.catch(reject);return ref;
 };
 prototype.transaction=function(updater,callback,applyLocally){
  const ref=this,path=pathOf(ref);if(!enabled()||!source(path))return base.transaction.call(ref,updater,callback,applyLocally);
  const task=(async()=>{
   const pending=await window.EconomyClient.resume('source:'+path);
   if(pending)return {committed:true,snapshot:await ref.once('value')};
   for(let attempt=0;attempt<3;attempt++){
    const snapshot=await ref.once('value'),next=updater(snapshot.val());
    if(next===undefined)return {committed:false,snapshot};
    try{
     await window.EconomyClient.execute('teacher_source_write',{patch:JSON.stringify({[path]:next}),expected:JSON.stringify({[path]:snapshot.val()})},{slot:'source:'+path});
     return {committed:true,snapshot:await ref.once('value')};
    }catch(error){if(error.message!=='SOURCE_CHANGED'||attempt===2)throw error;}
   }
  })();
  if(callback)task.then(r=>callback(null,r.committed,r.snapshot),e=>callback(e,false,null));return task;
 };
})();
