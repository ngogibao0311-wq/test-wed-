(() => {
 'use strict';
 if(window.CampusDesign)return;
 const root=document.documentElement;
 const icons={
  work:'M4 4h16v16H4z M8 9h8 M8 13h8 M8 17h5',
  create:'M14 4H4v16h16V10 M14 3l7 7 M13 11l7-7 M12 12l-1 4 4-1',
  submitted:'M4 4h16v16H4z M8 12l3 3 5-6',
  chart:'M4 4v16h16 M8 15v-4 M12 15V7 M16 15V9',
  files:'M3 6h7l2 2h9v12H3z M3 6V4h7l2 2',
  map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16',
  game:'M7 8h10c3 0 5 10 3 11-2 1-4-3-5-3H9c-1 0-3 4-5 3-2-1 0-11 3-11z M6 11v4 M4 13h4 M16 12h.1 M18 14h.1',
  store:'M3 4h2l3 12h10l3-9H6 M9 20h.1 M17 20h.1',
  people:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-3a7 7 0 0 1 14 0v3 M17 4a4 4 0 0 1 0 7 M19 14a6 6 0 0 1 3 5v2',
  settings:'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
  logout:'M10 3H4v18h6 M9 12h12 M17 8l4 4-4 4'
 };
 function navigation(){
  document.querySelectorAll('.sidebar :is(.nav-item,.btn-logout)').forEach(button=>{
   if(button.querySelector('.campus-nav-icon'))return;
   const name=button.querySelector('.nav-text')?.textContent.replace(/\s+/g,' ').trim();if(!name)return;
   const key=/Đăng xuất/.test(name)?'logout':/Cài đặt/.test(name)?'settings':/học sinh/.test(name)?'people':/Cửa hàng/.test(name)?'store':/trò chơi|Trò chơi/.test(name)?'game':/Lộ trình/.test(name)?'map':/Tài liệu/.test(name)?'files':/Kết quả/.test(name)?'chart':/đã nộp/.test(name)?'submitted':/Giao bài tập mới/.test(name)?'create':'work';
   [...button.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.textContent='');
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('campus-nav-icon');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
   const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',icons[key]);svg.append(path);button.prepend(svg);
   if(!button.hasAttribute('aria-label'))button.setAttribute('aria-label',name);
   if(!button.title)button.title=name;
  });
 }
 function syncPalette(){
  const theme=root.dataset.activeThemeId;
  const premium=[...root.classList].some(c=>c.endsWith('-equipped'));
  const custom=Boolean(root.dataset.cosmeticTheme)||premium||(theme?theme!=='default':[...document.body.classList].some(c=>/^(theme-|theme_)/.test(c)&&!['theme-blue','theme-green','theme-pink'].includes(c)));
  const value=custom?'custom':'default';
  if(root.dataset.campusPalette!==value)root.dataset.campusPalette=value;
  const art=Boolean(root.dataset.cosmeticBackground)||document.body.classList.contains('store-background-equipped');
  if(root.dataset.campusArtwork!==String(art))root.dataset.campusArtwork=String(art);
  const glass=document.body.classList.contains('student-content-glass-disabled')||document.body.classList.contains('teacher-content-glass-disabled')?'off':'on';
  if(root.dataset.campusGlass!==glass)root.dataset.campusGlass=glass;
 }
 function displaySettings(){
  const slot=document.querySelector('[data-campus-motion-slot]');
  if(!slot)return;
  let button=document.getElementById('toggleStudentContentGlassButton');
  if(!button&&document.getElementById('teacherDashboard')){
   button=document.createElement('button');button.type='button';button.id='toggleTeacherContentGlassButton';
   let user;try{user=JSON.parse(localStorage.getItem('currentUser')||'null');}catch{}
   const key='teacher_content_glass_enabled:'+(user?.username||'guest');
   const apply=(enabled,save=false)=>{
    document.body.classList.toggle('teacher-content-glass-disabled',!enabled);
    button.setAttribute('aria-pressed',String(enabled));
    button.textContent=enabled?'Tắt lớp kính mờ nội dung':'Bật lớp kính mờ nội dung';
    if(save)try{localStorage.setItem(key,String(enabled));}catch{}
    syncPalette();
   };
   let enabled=true;try{enabled=localStorage.getItem(key)!=='false';}catch{}
   apply(enabled);button.addEventListener('click',()=>apply(button.getAttribute('aria-pressed')!=='true',true));
  }
  if(button){button.classList.add('campus-glass-control');slot.before(button);}
 }
 function init(){
  syncPalette();
  navigation();
  const sidebar=document.querySelector('.dashboard>.sidebar');
  if(sidebar){
   let selected=sidebar.querySelector('.nav-item.active');
   new MutationObserver(()=>{
    const next=sidebar.querySelector('.nav-item.active');
    if(!next||next===selected)return;
    const previous=selected;selected=next;
    const dashboard=sidebar.closest('.dashboard');
    // Wait for successful navigation (including lazy-loaded tabs), not just a click.
    if(previous&&(root.dataset.mobileUi==='phone'||matchMedia('(max-width:768px)').matches)&&!dashboard.classList.contains('collapsed')){
     if(sidebar.contains(document.activeElement))sidebar.querySelector('.sidebar-toggle')?.focus({preventScroll:true});
     dashboard.classList.add('collapsed');
     // Closing the phone menu must not overwrite the desktop sidebar preference.
    }
   }).observe(sidebar,{subtree:true,attributes:true,attributeFilter:['class']});
  }
  displaySettings();
  document.querySelectorAll('.content>.tab-content').forEach(tab=>tab.querySelector('h2')?.classList.add('campus-page-title'));
  const observer=new MutationObserver(syncPalette);
  observer.observe(root,{attributes:true,attributeFilter:['data-active-theme-id','data-cosmetic-theme','data-cosmetic-background','class']});
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  const coin=document.getElementById('coinWidget'),dock=document.getElementById('studentTopActionsFlow');
  if(coin&&dock){coin.dataset.campusDocked='true';dock.prepend(coin);}
  if(dock)new ResizeObserver(()=>root.style.setProperty('--campus-dock-width',Math.ceil(dock.getBoundingClientRect().width)+48+'px')).observe(dock);
 }
 window.CampusDesign={syncPalette};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
