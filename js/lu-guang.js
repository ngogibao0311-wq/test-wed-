/* Lu Guang: silver-blue memory observatory; regular set: cyanotype contact album.
 * Artwork is generated here; no scene, particles or ultimate from another suite.
 */
(() => {
    'use strict';
    const CSS='css/lu-guang.css?v=20261012.luguang2';
    const many=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
    const svg=(art,box='0 0 1200 800')=>`<svg viewBox="${box}" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${art}</svg>`;
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    const exam=()=>window.isExamVisualItemsSuspended===true||Boolean(window.currentActiveExamId);
    const quiet=()=>document.hidden||reduced()||document.body.classList.contains('wfx-low-power')||exam();
    const density=n=>Math.max(4,Math.min(n,window.EffectQualityManager?.getRecommendedCount?.(n)||n));
    function ensureStyle(){if(!document.querySelector('link[data-lu-guang-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href=CSS;link.dataset.luGuangStyle='1';document.head.append(link);}}
    function layer(id,cls,html,parent=document.body){
        const host=document.createElement('div');host.id=id;host.className=cls;host.setAttribute('aria-hidden','true');host.style.setProperty('pointer-events','none','important');
        host.attachShadow({mode:'open'}).innerHTML=`<link rel="stylesheet" href="${CSS}"><div class="${cls}-inner">${html}</div>`;parent.append(host);return host;
    }
    const dial=()=>svg(`<circle cx="200" cy="200" r="184"/><circle cx="200" cy="200" r="171"/><circle cx="200" cy="200" r="130" stroke-dasharray="2 7"/>${many(60,i=>`<path transform="rotate(${i*6} 200 200)" d="M200 17V${i%5?25:36}"/>`)}${many(12,i=>`<text x="${200+Math.sin(i*Math.PI/6)*151}" y="${204-Math.cos(i*Math.PI/6)*151}" text-anchor="middle" stroke="none" fill="currentColor" font-size="12">${String(i||12).padStart(2,'0')}</text>`)}<g class="lg-clock-hour"><path d="M200 218V96L193 108M200 96 207 108" stroke-width="3"/></g><g class="lg-clock-minute"><path d="M200 220V54"/><circle cx="200" cy="200" r="6"/></g>`,'0 0 400 400');
    const skyline=()=>svg(many(22,i=>{const x=i*60,h=45+(i*37)%170;return `<g><path d="M${x} 760V${760-h}h42V760M${x+8} ${760-h}v-12h26v12"/>${many(5,j=>`<path d="M${x+9} ${774-h+j*22}h7m10 0h7"/>`)}</g>`}));
    const photo=(i)=>`<span class="lg-photo" style="--i:${i};--x:${i%2?91:1}%;--y:${17+Math.floor(i/2)*23}%"><b>${svg(`<path d="M0 60 22 34 37 50 60 12 100 64M8 74H90"/><circle cx="20" cy="16" r="8"/>`,'0 0 100 80')}</b><small>MEMORY ${String(i+1).padStart(3,'0')}</small></span>`;
    function observatory(){return `
      <div class="lg-atmosphere"></div>
      <div class="lg-horizon">${skyline()}</div>
      <div class="lg-reflection">${skyline()}</div>
      <div class="lg-ceiling">${svg(many(9,i=>`<path d="M${-120+i*45} 0 600 ${155+i*13} ${1320-i*45} 0M${-120+i*45} 0V800M${1320-i*45} 0V800"/>`))}</div>
      <div class="lg-vault-ribs">${svg(many(7,i=>`<path d="M${i*18} 800V${70+i*28}H${1200-i*18}V800M${i*18} ${70+i*28} 600 370 ${1200-i*18} ${70+i*28}"/>`))}</div>
      <div class="lg-archive-left">${svg(many(7,i=>`<g transform="translate(${i*16} ${170+i*22})"><path d="M0 0 100 40V440L0 560ZM14 26 86 54V427L14 523M14 128 86 131M14 250 86 230M14 380 86 341"/><path d="M27 36V507M66 49V452" stroke-dasharray="2 9"/></g>`))}</div>
      <div class="lg-archive-right">${svg(many(7,i=>`<g transform="translate(${1200-i*16} ${170+i*22}) scale(-1 1)"><path d="M0 0 100 40V440L0 560ZM14 26 86 54V427L14 523M14 128 86 131M14 250 86 230M14 380 86 341"/><path d="M27 36V507M66 49V452" stroke-dasharray="2 9"/></g>`))}</div>
      <div class="lg-transit-floor">${svg(many(12,i=>`<path d="M${-900+i*275} 820 600 390"/>`)+many(9,i=>`<path d="M0 ${590+i*i*3}H1200"/>`))}</div>
      <div class="lg-chronometers"><span>${dial()}</span><span>${dial()}</span></div>
      <div class="lg-projectors">${svg('<path d="M-20 80 425 600 32 800Z M1220 80 775 600 1168 800Z" fill="currentColor" stroke="none"/>')}</div>
      <div class="lg-film-elevators">${many(2,i=>`<span style="--side:${i}">${many(9,j=>`<b><i>${String(j+1).padStart(2,'0')}</i></b>`)}</span>`)}</div>
      <div class="lg-suspended-photos">${many(6,photo)}</div>
      <div class="lg-focus-brackets">${svg('<path d="M20 110V20H130M1180 110V20H1070M20 690V780H130M1180 690V780H1070M600 10V40M600 760V790"/>')}</div>
      <div class="lg-spectral-lines">${svg(many(8,i=>`<path style="--i:${i}" d="M0 ${80+i*80}h${110+i*5}l40 16h60M1200 ${96+i*80}h-${110+i*5}l-40-16h-60"/>`))}</div>
      <div class="lg-silver-dust">${many(density(36),i=>`<i style="--i:${i};--x:${(i*79)%100}%;--y:${(i*43)%100}%"></i>`)}</div>
      <div class="lg-timestamp"><span>00:00:02 / ARCHIVE</span><span>光 · MEMORY OBSERVATORY</span></div>
      <div class="lg-light-meter">${many(24,i=>`<i style="--i:${i};--h:${8+i%7*3}px"></i>`)}</div>
      <div class="lg-perimeter"><span>LU GUANG</span><span>THE LIGHT REMEMBERS</span></div>`;}
    function auraArt(){return `<div class="lg-aura-dial">${dial()}</div><div class="lg-aura-rails">${svg('<path d="M12 265V12H90M228 265V12H150M30 290V32H210V290M12 265 45 305H195L228 265M80 322H160"/>','0 0 240 340')}</div><div class="lg-aura-exposures">${many(4,i=>`<i style="--i:${i}"></i>`)}</div><div class="lg-aura-platform"></div><div class="lg-aura-ticks">${many(12,i=>`<i style="--i:${i}"></i>`)}</div><div class="lg-aura-caption">FRAME 002 · LU GUANG</div>`;}
    // The regular collection uses cyanotype imprints and album tabs, never the observatory.
    const imprint=i=>`<span class="lgr-imprint" style="--i:${i};--x:${(i*31+6)%94}%;--y:${(i*19+12)%90}%">${svg('<path d="M12 60Q22 36 52 20M22 48Q4 44 9 30Q29 27 30 41M34 35Q28 15 42 13Q54 22 43 28M47 24Q46 4 61 9Q67 23 52 21M11 63H70"/>','0 0 80 80')}</span>`;
    let pet,aura,world,petEvents,petObserver,mode='',attributes={},cooldown=0,lastClick=0;
    let effect,effectEvents,effectObserver;const timers=new Set();
    function transient(cls,html,ms){const host=layer('',cls,html);host.dataset.luGuangTransient='1';const id=setTimeout(()=>{host.remove();timers.delete(id);},ms);timers.add(id);return host;}
    function removeTransients(){document.querySelectorAll('[data-lu-guang-transient]').forEach(e=>e.remove());timers.forEach(clearTimeout);timers.clear();}
    function clearPet(){petEvents?.abort();petObserver?.disconnect();removeTransients();aura?.remove();world?.remove();document.documentElement.classList.remove('lg-equipped');
        if(pet){pet.classList.remove('lg-character','lgr-character');Object.entries(attributes).forEach(([k,v])=>v===null?pet.removeAttribute(k):pet.setAttribute(k,v));}
        pet=aura=world=petEvents=petObserver=null;mode='';cooldown=0;lastClick=0;attributes={};}
    function clickExposure(e){if(quiet()||performance.now()-lastClick<220||pet?.contains(e.target))return;lastClick=performance.now();const host=transient('lg-focus-click','<i></i><b></b><span>+ EXPOSURE</span>',900);host.style.left=e.clientX+'px';host.style.top=e.clientY+'px';}
    function ultimate(){
        if(!pet||quiet()||performance.now()<cooldown||pet.parentElement?.dataset.petDragged==='1')return false;
        cooldown=performance.now()+(mode==='premium'?14000:6500);
        if(mode==='regular'){
            transient('lgr-develop',`<div class="lgr-proof"><div>${svg('<path d="M10 90 38 50 57 72 84 26 125 90M8 108H132"/><circle cx="30" cy="24" r="10"/>','0 0 140 120')}</div><b>MỘT KHOẢNH KHẮC ĐƯỢC GIỮ LẠI</b><small>Lu Guang · lick click</small></div>${many(7,imprint)}`,3300);return true;
        }
        const iris=svg(many(8,i=>`<path transform="rotate(${i*45} 400 400)" d="M400 400 170 0H630L550 290Z" fill="currentColor" class="lg-iris-blade" style="--i:${i}"/>`),'0 0 800 800');
        transient('lg-ultimate',`<div class="lg-ult-dim"></div><div class="lg-ult-iris">${iris}</div><div class="lg-ult-corridor">${svg(many(12,i=>`<rect class="lg-flight-frame" style="--i:${i}" x="${30+i*42}" y="${20+i*27}" width="${1140-i*84}" height="${760-i*54}"/>`))}</div><div class="lg-ult-platform">${svg(many(19,i=>`<path d="M${-1600+i*250} 800 600 410"/>`)+many(12,i=>`<path d="M0 ${420+i*i*3}H1200"/>`))}</div><div class="lg-ult-city">${skyline()}</div><div class="lg-ult-clock">${dial()}</div><div class="lg-ult-reels">${many(8,i=>`<span style="--i:${i}">${photo(i)}</span>`)}</div><div class="lg-ult-split left"></div><div class="lg-ult-split right"></div><div class="lg-ult-person"><img src="assets/Premium/Lock/lu_guang_nhan_vat2.png" alt=""></div><div class="lg-ult-coordinate">${svg(many(16,i=>`<path style="--i:${i}" d="M${(i*107)%1200} 0V800"/>`))}</div><div class="lg-ult-grains">${many(density(48),i=>`<i style="--i:${i};--x:${(i*71)%100}%;--y:${(i*47)%100}%"></i>`)}</div><div class="lg-ult-title"><small>LICK CLICK / LU GUANG / 002</small><strong>THIÊN VĂN VIỆN KÝ ỨC</strong><span>Ánh sáng không quên một khoảnh khắc nào.</span></div><div class="lg-ult-progress"><i></i><span>QUAN SÁT · LƯU GIỮ · TRỞ VỀ</span></div>`,7200);return true;
    }
    function mountPet(premium){
        clearPet();if(exam())return;ensureStyle();pet=document.getElementById('virtual-pet-img');if(!pet)return;
        mode=premium?'premium':'regular';petEvents=new AbortController();const opts={signal:petEvents.signal};
        attributes=Object.fromEntries(['role','tabindex','title'].map(k=>[k,pet.getAttribute(k)]));pet.classList.add(premium?'lg-character':'lgr-character');pet.setAttribute('role','button');pet.tabIndex=0;pet.title=premium?'Lu Guang · Chạm để mở Thiên Văn Viện Ký Ức':'Lu Guang · Chạm để hiện ảnh ký ức';
        aura=layer('lu-guang-pet-aura',premium?'lg-aura':'lgr-aura',premium?auraArt():`<div class="lgr-contact-border"></div><div class="lgr-tabs"><i>02</i><i>LG</i></div>${many(4,imprint)}`,pet.parentElement);
        if(premium){world=layer('lu-guang-observatory','lg-world',observatory());document.documentElement.classList.add('lg-equipped');document.addEventListener('pointerdown',clickExposure,opts);}
        pet.addEventListener('click',ultimate,opts);pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ultimate();}},opts);
        const update=()=>{if(!pet?.isConnected||pet.parentElement?.style.display==='none'||pet.parentElement?.hidden||exam()){clearPet();return;}const paused=quiet();if(aura)aura.hidden=paused;if(world)world.hidden=paused;if(paused)removeTransients();};
        petObserver=new MutationObserver(update);petObserver.observe(pet.parentElement,{attributes:true,childList:true,attributeFilter:['style','hidden']});petObserver.observe(document.body,{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',update,opts);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,opts);update();
    }
    function clearEffect(){effectEvents?.abort();effectObserver?.disconnect();effect?.remove();effect=effectEvents=effectObserver=null;}
    function mountEffect(){clearEffect();if(exam())return;ensureStyle();const parent=document.getElementById('global-effect-container');if(!parent)return;
        effect=layer('lu-guang-cyanotypes','lgr-weather',`<div class="lgr-emulsion"></div><div class="lgr-contact-corners">${many(4,i=>`<span style="--i:${i}">${svg('<path d="M8 8H112V122H8ZM16 16H104V92H16M16 78 40 43 58 64 80 31 104 77M30 105H89"/><circle cx="34" cy="31" r="8"/>','0 0 120 130')}<b>MEMORY / 00${i+1}</b></span>`)}</div>${many(density(20),imprint)}<div class="lgr-rulers">${many(2,i=>`<span>${many(16,j=>`<i>${j%4?'':j}</i>`)}</span>`)}</div>`,parent);
        effectEvents=new AbortController();const opts={signal:effectEvents.signal};const update=()=>{if(effect)effect.hidden=quiet();};effectObserver=new MutationObserver(update);effectObserver.observe(document.body,{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',update,opts);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,opts);update();
    }
    window.LuGuangRuntime={mountPremium:()=>mountPet(true),mountRegularPet:()=>mountPet(false),mountEffect,clearPet,clearEffect,ultimate};
})();
