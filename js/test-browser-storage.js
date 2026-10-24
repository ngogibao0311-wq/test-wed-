/* Test-only browser state. Production keeps its existing keys and sessions. */
(() => {
    'use strict';
    const prefix = 'web-chan-doan-test:';
    function scoped(native) {
        const keys = () => Array.from({length:native.length}, (_,i)=>native.key(i)).filter(k=>k?.startsWith(prefix));
        return Object.freeze({
            get length() { return keys().length; },
            key(index) { return keys()[index]?.slice(prefix.length) ?? null; },
            getItem(key) { return native.getItem(prefix+String(key)); },
            setItem(key,value) { native.setItem(prefix+String(key),String(value)); },
            removeItem(key) { native.removeItem(prefix+String(key)); },
            clear() { for(const key of keys())native.removeItem(key); }
        });
    }
    const nativeLocks=navigator.locks;
    const locks=nativeLocks ? Object.freeze({
        request(name,...args) { return nativeLocks.request(prefix+name,...args); },
        async query() { const state=await nativeLocks.query();return Object.fromEntries(Object.entries(state).map(([kind,rows])=>[kind,rows.filter(r=>r.name.startsWith(prefix)).map(r=>({...r,name:r.name.slice(prefix.length)}))])); }
    }) : undefined;
    const Channel=window.BroadcastChannel;
    window.TestBrowserStorage=Object.freeze({
        localStorage:scoped(window.localStorage),
        sessionStorage:scoped(window.sessionStorage),
        locks,
        BroadcastChannel:Channel ? class extends Channel { constructor(name) { super(prefix+name); } } : undefined,
        eventKey(event) { return typeof event.key==='string'&&event.key.startsWith(prefix)?event.key.slice(prefix.length):undefined; }
    });
})();
/* Test asset compatibility: gates feature startup, never changes server authorization. */
(() => {
 'use strict';
 const BUILD='20261018.romeo1';
 const groups={
  login:{js:['firebase-config','common'],css:['common']},
  session:{js:['firebase-config','common','student','student-feature-loader','economy-client'],css:['common']},
  exam:{js:['firebase-config','common','student','mc-workspace'],css:['common','mc-workspace']},
  store:{js:['store-manager','luxury-store','valentine','pet-items'],css:['valentine']},
  valentine:{js:['valentine'],css:['valentine']}
 };
 const modules=window.AssetModuleVersions ||= {};
 const expected=()=>document.querySelector('meta[name="asset-compat-version"]')?.content || '';
 const active=()=>!!expected();
 const cssVersion=id=>getComputedStyle(document.documentElement).getPropertyValue('--asset-'+id).trim();
 function check(group){
  const spec=groups[group];if(!spec)throw Error('UNKNOWN_ASSET_GROUP');
  if(!active())return {ok:true,legacy:true,missing:[]};
  const missing=[];
  if(expected()!==BUILD)missing.push('Bộ kiểm tra phiên bản');
  for(const id of spec.js)if(modules[id]!==expected())missing.push('js/'+id+'.js');
  for(const id of spec.css)if(cssVersion(id)!==expected())missing.push('css/'+id+'.css');
  return {ok:!missing.length,missing};
 }
 const repairs=new Map();
 function repairStyle(id){
  const href=new URL('css/'+id+'.css?v='+encodeURIComponent(expected()),document.baseURI).href;
  if(repairs.has(href))return repairs.get(href);
  const task=new Promise((resolve,reject)=>{
   const previous=[...document.querySelectorAll('link[rel="stylesheet"]')].filter(l=>{try{return new URL(l.href).pathname===new URL(href).pathname;}catch{return false;}});
   const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.compatRepair='1';
   const timer=setTimeout(()=>done(false),10000);
   function done(ok){clearTimeout(timer);link.onload=link.onerror=null;if(ok){previous.forEach(l=>l.remove());resolve();}else{link.remove();reject(Error('ASSET_STYLE_LOAD_FAILED'));}}
   link.onload=()=>done(true);link.onerror=()=>done(false);document.head.append(link);
  }).finally(()=>repairs.delete(href));repairs.set(href,task);return task;
 }
 let notice=null,noticeGroup='';
 function show(group,missing){
  noticeGroup=group;
  if(!notice){notice=document.createElement('aside');notice.id='assetCompatibilityNotice';notice.className='ui-theme-immune';notice.setAttribute('role','alert');
   notice.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:2147483000;max-width:600px;margin:auto';
   const shadow=notice.attachShadow({mode:'open'});shadow.innerHTML='<style>:host{font:14px/1.6 system-ui;color:#253653}section{padding:18px;background:#fffaf0;border:1px solid #dfbf7e;border-radius:16px;box-shadow:0 8px 36px #142b4422}strong{display:block}p{margin:8px 0;overflow-wrap:anywhere}button{font:inherit;padding:8px 14px;border:1px solid #b9c4de;border-radius:9px;background:white;color:#324971;cursor:pointer;margin-right:8px}</style><section><strong>Mã website chưa đồng bộ</strong><p></p><button type="button">Kiểm tra lại</button><button type="button">Đóng thông báo</button></section>';
   const buttons=shadow.querySelectorAll('button');buttons[0].onclick=()=>requireGroup(noticeGroup).catch(()=>{});buttons[1].onclick=()=>notice.hidden=true;document.body.append(notice);
  }
  notice.hidden=false;notice.shadowRoot.querySelector('p').textContent='Chưa khớp: '+missing.join(', ')+'. Chức năng này chưa sẵn sàng. Hãy hoàn tất bài/giao dịch đang làm trước khi tải lại trang; bản nháp không bị xóa.';
 }
 async function requireGroup(group){
  let result=check(group);if(result.ok)return true;
  // CSS can safely be replaced. Never re-execute a JS module or force a page reload.
  if(expected()===BUILD)await Promise.allSettled(groups[group].css.filter(id=>cssVersion(id)!==expected()).map(repairStyle));
  result=check(group);if(!result.ok){show(group,result.missing);throw Object.assign(Error('Các tệp website chưa đồng bộ. Hãy cập nhật đủ tệp rồi thử lại.'),{code:'ASSET_VERSION_MISMATCH',missing:result.missing});}
  if(notice&&noticeGroup===group)notice.hidden=true;return true;
 }
 function assertScript(url){
  if(!active())return;
  const path=new URL(url,document.baseURI).pathname, id=path.split('/').pop().replace(/\.js$/,'');
  const known=Object.values(groups).some(g=>g.js.includes(id));
  if(known&&modules[id]!==expected()){show(Object.keys(groups).find(key=>groups[key].js.includes(id)),['js/'+id+'.js']);throw Object.assign(Error('Module chưa đồng bộ: '+id),{code:'ASSET_VERSION_MISMATCH'});}
 }
 window.AssetCompatibility=Object.freeze({build:BUILD,check,ready:group=>check(group).ok,require:requireGroup,assertScript,groups});
 if(location.protocol==='file:')document.addEventListener('DOMContentLoaded',()=>{
  const note=document.createElement('div');note.textContent='Bản test trên máy · Cần Internet để đăng nhập/lưu dữ liệu. Cập nhật tự động và bộ nhớ đệm offline không khả dụng.';
  note.style.cssText='font:12px/1.5 system-ui;padding:8px 12px;background:#eef3ff;color:#37516b;border-radius:10px;margin:8px';
  (document.querySelector('.login-help-note')||document.querySelector('.sidebar-footer'))?.append(note);
 },{once:true});
})();
