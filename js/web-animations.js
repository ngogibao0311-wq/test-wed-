(() => {
 'use strict';
 if(window.WebAnimationSystem)return;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const state={initialized:false,enabled:true,lowPower:false,reducedMotion:media.matches};
 let observer,layer,scheduled=0;
 const activeTabs=new WeakSet(),seenCards=new WeakSet(),animations=new Map(),listeners=[];
 const excluded='.ui-theme-immune,.store-theme-locked,.store-item-card,.luxury-product-card,[data-fxq-root],#global-effect-container,#virtual-pet-container,.ql-container,.ql-toolbar,[class^="effect-"],[class^="pet-"],[class^="hh-"],[class^="royal-"],[class^="lb-"]';
 const on=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));};
 const allowed=()=>state.enabled&&!state.reducedMotion&&!document.hidden;
 function animate(el,kind='enter'){
  if(!allowed()||!el||el.closest(excluded)||!el.getClientRects().length)return;
  // Animate opacity only: never replace item transforms, filters or positioning.
  animations.get(el)?.cancel();
  const frames=kind==='press'?[{opacity:.68},{opacity:1}]:[{opacity:.35},{opacity:1}];
  const animation=el.animate(frames,{duration:kind==='press'?140:200,easing:'ease-out'});
  animations.set(el,animation);
  animation.finished.catch(()=>{}).finally(()=>{if(animations.get(el)===animation)animations.delete(el);animation.cancel();});
 }
 function sync(){
  state.reducedMotion=media.matches;
  state.lowPower=document.documentElement.classList.contains('fxq-low')||document.documentElement.classList.contains('fxq-luxury-low');
  document.body.classList.toggle('wfx-paused',!allowed());
  document.body.classList.toggle('wfx-low-power',state.lowPower);
  if(layer)layer.hidden=!state.enabled||state.reducedMotion;
  if(!allowed()){animations.forEach(a=>a.cancel());animations.clear();}

 }
 function setEnabled(value){state.enabled=!!value;sync();}
 function scan(){
  scheduled=0;sync();
  document.querySelectorAll('.content>.tab-content').forEach(tab=>{
   if(!tab.classList.contains('active')){activeTabs.delete(tab);return;}
   if(!activeTabs.has(tab)){activeTabs.add(tab);animate(tab);}
   tab.querySelectorAll(':scope>.card,:scope>.form-container,:scope>.table-responsive').forEach(card=>{
    if(!seenCards.has(card)){seenCards.add(card);if(!animations.has(tab))animate(card);}
   });
  });
 }
 function schedule(){if(!scheduled)scheduled=requestAnimationFrame(scan);}
 function init(){
  if(state.initialized||!document.body||!document.querySelector('.dashboard'))return;
  state.initialized=true;
  state.enabled=true;
  document.body.classList.add('wfx-ready');
  layer=document.createElement('div');layer.id='wfx-web-animation-layer';layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<div class="wfx-aurora wfx-aurora-a"></div><div class="wfx-aurora wfx-aurora-b"></div>';document.body.prepend(layer);
  on(document,'visibilitychange',sync);on(media,'change',sync);

  on(document,'pointerdown',e=>{const b=e.target.closest?.('.sidebar .nav-item,.sidebar-toggle,.content button');if(b&&!b.disabled)animate(b,'press');},{passive:true});
  observer=new MutationObserver(records=>{
   if(records.some(r=>r.type==='childList'&&[...r.addedNodes].some(n=>n.nodeType===1)||r.type==='attributes'&&(r.target===document.documentElement||r.target.classList.contains('tab-content'))))schedule();
  });
  observer.observe(document.querySelector('.content'),{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  scan();
 }
 function destroy(){observer?.disconnect();listeners.splice(0).forEach(f=>f());cancelAnimationFrame(scheduled);scheduled=0;animations.forEach(a=>a.cancel());animations.clear();layer?.remove();document.body?.classList.remove('wfx-ready','wfx-paused','wfx-low-power');state.initialized=false;}
 window.WebAnimationSystem=Object.freeze({version:'2.0.0',init,refresh:schedule,destroy,enable:()=>setEnabled(true),disable:()=>setEnabled(false),getState:()=>({...state})});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
