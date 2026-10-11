/* Phone-only navigation. Existing buttons retain permissions, exam guards and lazy loading. */
(() => {
 'use strict';
 if(window.PhoneLayout)return;
 const media=matchMedia('(max-width:768px), (max-width:1024px) and (pointer:coarse) and (max-height:600px)'),root=document.documentElement;
 let dashboard,sidebar,header,nav,backdrop,desktopCollapsed,active=false,queued=false,observer;
 const links=[];
 function setMenu(open){
  if(!active||!dashboard)return;
  dashboard.classList.toggle('collapsed',!open);
  sync();
  if(open)sidebar.querySelector('.nav-item.active,.nav-item')?.focus({preventScroll:true});
  else nav.querySelector('[data-menu]').focus({preventScroll:true});
 }
 function sync(){
  if(!active||!dashboard)return;
  const selected=sidebar.querySelector('.nav-item.active');
  links.forEach(({source,button})=>{
   button.disabled=source.disabled;
   const unavailable=source.hidden||getComputedStyle(source).display==='none';
   button.hidden=unavailable;
   button.setAttribute('aria-current',source===selected?'page':'false');
  });
  const open=!dashboard.classList.contains('collapsed');
  document.body.classList.toggle('mobile-menu-open',open);
  backdrop.hidden=!open;
  sidebar.inert=!open;
  nav.querySelector('[data-menu]').setAttribute('aria-expanded',String(open));
  document.querySelectorAll('#studentsListContainer table').forEach(table=>{
   const labels=[...table.querySelectorAll('thead th')].map(n=>n.textContent.trim());
   table.querySelectorAll('tbody tr').forEach(row=>[...row.cells].forEach((cell,i)=>{
    if(labels[i]&&cell.colSpan===1&&cell.dataset.mobileLabel!==labels[i])cell.dataset.mobileLabel=labels[i];
   }));
  });
 }
 function schedule(){if(!active||queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}
 function build(){
  dashboard=document.querySelector('#studentDashboard,#teacherDashboard');if(!dashboard)return;
  sidebar=dashboard.querySelector('.sidebar');if(!sidebar)return;
  const teacher=dashboard.id==='teacherDashboard';
  if(!teacher){header=document.createElement('header');header.className='mobile-app-header ui-theme-immune';header.id='mobileStudentHeader';}
  nav=document.createElement('nav');nav.className='mobile-app-nav ui-theme-immune';nav.setAttribute('aria-label','Điều hướng điện thoại');
  const tabs=teacher?[['tab-create','Giao bài'],['tab-assigned','Đã giao'],['tab-list','Bài nộp'],['tab-manage-students','Học sinh']]:[['tab-todo','Bài tập'],['tab-grades','Kết quả'],['tab-roadmap','Lộ trình'],['tab-store','Cửa hàng']];
  for(const [id,label]of tabs){
   const source=(id==='tab-create'?document.getElementById('teacherAssignmentMainNav'):null)||[...sidebar.querySelectorAll('.nav-item')].find(b=>(b.getAttribute('onclick')||'').includes("'"+id+"'"));if(!source)continue;
   const button=document.createElement('button');button.type='button';button.dataset.mobileTab=id;
   const icon=source.querySelector('svg');if(icon)button.append(icon.cloneNode(true));
   const text=document.createElement('span');text.textContent=label;button.append(text);
   button.addEventListener('click',()=>{if(!source.disabled&&!source.hidden)source.click();});
   links.push({source,button});nav.append(button);
  }
  const menu=document.createElement('button');menu.type='button';menu.dataset.menu='';menu.setAttribute('aria-label','Tất cả chức năng');menu.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>Menu</span>';nav.append(menu);
  const close=document.createElement('button');close.type='button';close.className='mobile-menu-close';close.textContent='Đóng menu ✕';close.onclick=()=>setMenu(false);sidebar.prepend(close);
  menu.onclick=()=>setMenu(dashboard.classList.contains('collapsed'));
  backdrop=document.createElement('div');backdrop.className='mobile-menu-backdrop';backdrop.hidden=true;backdrop.onclick=()=>setMenu(false);
  if(header)document.body.append(header);
  document.body.append(backdrop,nav);
  if(!teacher){const dock=document.getElementById('studentTopActionsFlow');if(dock)header.append(dock);}
  observer=new MutationObserver(schedule);
  observer.observe(dashboard,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled','hidden']});
  document.addEventListener('keydown',e=>{if(active&&e.key==='Escape'&&!dashboard.classList.contains('collapsed')){setMenu(false);}});
  // Trap focus in the open phone menu; dashboard navigation continues through the original handlers.
  sidebar.addEventListener('keydown',e=>{
   if(!active||e.key!=='Tab'||dashboard.classList.contains('collapsed'))return;
   const items=[...sidebar.querySelectorAll('button:not(:disabled),a[href]')].filter(b=>b.getClientRects().length);
   const first=items[0],last=items.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  });
 }
 function apply(){
  if(media.matches){
   root.dataset.mobileUi='phone';
   if(!dashboard)build();
   if(!active&&dashboard){desktopCollapsed=dashboard.classList.contains('collapsed');dashboard.classList.add('collapsed');}
   active=true;window.refreshStudentTopActionPositions?.();sync();
  }else{
   delete root.dataset.mobileUi;
   if(active&&dashboard){dashboard.classList.toggle('collapsed',desktopCollapsed);sidebar.inert=false;}
   active=false;window.refreshStudentTopActionPositions?.();document.body.classList.remove('mobile-menu-open');if(backdrop)backdrop.hidden=true;
  }
 }
 function init(){apply();media.addEventListener('change',apply);}
 window.PhoneLayout={sync:schedule};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
