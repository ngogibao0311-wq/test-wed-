/* Chronos: brass astrolabe architecture; regular set: a watchmaker's escapement.
 * Decorative hosts are isolated, bounded, and removed when equipment changes. */
(() => {
    'use strict';
    const CSS='css/chronos.css?v=20261013.chronos2';
    const many=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
    const svg=(art,box='0 0 1000 700')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" fill="none" stroke="currentColor" aria-hidden="true">${art}</svg>`;
    const exam=()=>window.isExamVisualItemsSuspended===true||Boolean(window.currentActiveExamId);
    const quiet=()=>document.hidden||exam()||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('wfx-low-power');
    const density=n=>Math.max(4,Math.min(n,window.EffectQualityManager?.getRecommendedCount?.(n)||n));
    function ensureCSS(){if(document.querySelector('link[data-chronos-style]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href=CSS;l.dataset.chronosStyle='1';document.head.append(l);}
    function host(id,cls,art,parent=document.body){const el=document.createElement('div');el.id=id;el.className=cls;el.setAttribute('aria-hidden','true');el.style.setProperty('pointer-events','none','important');el.attachShadow({mode:'open'}).innerHTML=`<link rel="stylesheet" href="${CSS}"><div class="ch-root">${art}</div>`;parent.append(el);return el;}
    // Interlocking teeth, graduated equator and carved spokes; geometry exclusive to this suite.
    const wheel=()=>svg(`<circle cx="150" cy="150" r="136"/><circle cx="150" cy="150" r="123"/><circle cx="150" cy="150" r="91" stroke-dasharray="1 6"/>${many(36,i=>`<path transform="rotate(${i*10} 150 150)" d="M143 15V4H157V15M150 28V36"/>`)}${many(8,i=>`<path transform="rotate(${i*45} 150 150)" d="M145 119 135 56 150 40 165 56 155 119M150 46V111"/>`)}<circle cx="150" cy="150" r="28"/><path d="M150 126 172 150 150 174 128 150Z"/>`,'0 0 300 300');
    const pendulum=()=>svg('<path d="M35 8H105M45 8V28H95V8M53 28V180M87 28V180M45 180H95V204H45ZM48 210Q70 240 92 210M70 33V183"/><circle cx="70" cy="198" r="9"/>','0 0 140 260');
    function sanctum(){return `<div class="ch-nebula"></div><div class="ch-polar-veil"></div>
      <div class="ch-entablature">${svg(many(6,i=>`<path d="M${i*12} 0V${20+i*12}L500 ${115+i*8} ${1000-i*12} ${20+i*12}V0"/>`))}</div>
      <div class="ch-colonnade">${svg(many(8,i=>{const x=i<4?i*25:1000-(i-3)*25;return `<g transform="translate(${x} 0)"><path d="M0 700V160L10 135 20 160V700M4 173V685M16 173V685M-5 135H25V123H-5ZM-5 682H25V695H-5Z"/></g>`;}))}</div>
      <div class="ch-rosette left">${wheel()}</div><div class="ch-rosette right">${wheel()}</div>
      <div class="ch-armillary"><i></i><i></i><i></i></div>
      <div class="ch-ecliptic">${svg('<ellipse cx="500" cy="380" rx="670" ry="160" transform="rotate(-22 500 380)"/><ellipse cx="500" cy="380" rx="680" ry="169" transform="rotate(-22 500 380)"/>')}</div>
      <div class="ch-zodiac">${many(12,i=>`<span style="--i:${i}">${['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ'][i]}</span>`)}</div>
      <div class="ch-pendulums">${many(4,i=>`<span style="--i:${i}">${pendulum()}</span>`)}</div>
      <div class="ch-hour-lines">${svg(many(10,i=>`<path d="M0 ${280+i*28}Q110 ${245+i*28} 140 ${280+i*28}M1000 ${280+i*28}Q890 ${245+i*28} 860 ${280+i*28}"/>`))}</div>
      <div class="ch-dunes">${svg(many(8,i=>`<path d="M0 ${630+i*9}Q220 ${520+i*18} 490 ${620+i*9}T1000 ${620+i*9}"/>`))}</div>
      <div class="ch-sandfalls">${many(8,i=>`<i style="--i:${i};--x:${i<4?2+i*2:92+(i-4)*2}%"></i>`)}</div>
      <div class="ch-prisms">${many(6,i=>`<i style="--i:${i};--x:${i%2?96:3}%;--y:${20+Math.floor(i/2)*25}%"></i>`)}</div>
      <div class="ch-stardust">${many(density(32),i=>`<i style="--i:${i};--x:${(i*67+3)%100}%;--y:${(i*37+2)%100}%"></i>`)}</div>
      <div class="ch-corner-inscriptions">${many(4,i=>`<span style="--i:${i}">TEMPUS · AETERNITAS<br>CHRONOS / III</span>`)}</div><div class="ch-border"></div><div class="ch-floor-light"></div>`;}
    const ticket=i=>`<span class="chr-ticket" style="--i:${i};--x:${(i*37+3)%94}%;--y:${(i*23+8)%87}%"><b>${String(i+1).padStart(2,'0')}</b><i></i><small>SEC</small></span>`;
    let pet,aura,world,events,observer,attrs={},premium=false,cooldown=0,lastClick=-Infinity;
    let effect,effectEvents,effectObserver;
    const transients=new Map();
    function transient(cls,art,ms){const el=host('',cls,art);el.dataset.chronosTransient='1';const timer=setTimeout(()=>{el.remove();transients.delete(el);},ms);transients.set(el,timer);return el;}
    function clearTransients(){for(const [el,timer]of transients){clearTimeout(timer);el.remove();}transients.clear();}
    function clearPet(){events?.abort();observer?.disconnect();clearTransients();aura?.remove();world?.remove();document.documentElement.classList.remove('chronos-equipped');if(pet){pet.classList.remove('ch-character','chr-character');for(const[k,v]of Object.entries(attrs))v===null?pet.removeAttribute(k):pet.setAttribute(k,v);}pet=aura=world=events=observer=null;attrs={};cooldown=0;lastClick=-Infinity;}
    function click(e){
        if(quiet()||pet?.contains(e.target)||performance.now()-lastClick<240)return;
        lastClick=performance.now();
        const seal=svg(`<circle cx="60" cy="60" r="43"/><circle cx="60" cy="60" r="37" stroke-dasharray="1 5"/>${many(12,i=>`<path transform="rotate(${i*30} 60 60)" d="M60 12V19M57 23H63"/>`)}<path d="M49 43H71M49 77H71M51 45Q51 54 59 60Q51 66 51 75M69 45Q69 54 61 60Q69 66 69 75M56 49H64L60 56ZM55 73 60 65 65 73Z"/>`,'0 0 120 120');
        const el=transient('ch-click',`<div class="ch-touch-halo"></div><div class="ch-touch-seal">${seal}</div><div class="ch-touch-orbit"></div>${many(10,i=>{const a=i*Math.PI/5;return `<i class="ch-touch-grain" style="--dx:${Math.cos(a)*(42+i%3*8)}px;--dy:${Math.sin(a)*(42+i%3*8)}px;--delay:${i%3*35}ms"></i>`;})}`,1350);
        el.style.left=e.clientX+'px';el.style.top=e.clientY+'px';
    }
    function ultimate(){if(!pet||quiet()||performance.now()<cooldown||pet.parentElement?.dataset.petDragged==='1')return false;cooldown=performance.now()+(premium?15000:6000);
        if(!premium){transient('chr-ultimate',`<div class="chr-score">${svg('<path d="M40 65H760M40 85H760M40 105H760M40 125H760M40 145H760"/>','0 0 800 210')}${many(9,i=>`<span style="--i:${i}">♪</span>`)}</div><div class="chr-music-box"><i></i><b>KHÚC NHẠC MỘT GIÂY</b><small>CHRONOS · XƯỞNG ĐỒNG HỒ CỔ</small></div>`,3600);return true;}
        // A temporal waterfall, broken epochs and a monumental sand vessel. No portrait,
        // ambient wheel or existing suite markup is included in this cinematic.
        transient('ch-ultimate',`<div class="chu-night"></div><div class="chu-dawn"></div>
          <div class="chu-epochs">${many(10,i=>`<span style="--i:${i}"><b>${['M','D','C','L','X'][i%5]}</b><i></i></span>`)}</div>
          <div class="chu-falls">${svg(many(30,i=>`<path style="--i:${i}" d="M${270+i*16} -100Q${430+(i%5)*32} 270 ${490+(i%3)*10} 350T${220+i*20} 850"/>`))}</div>
          <div class="chu-vessel">${svg('<path d="M260 70H740V110H260ZM290 110C290 225 340 282 487 350C340 418 290 475 290 590H710C710 475 660 418 513 350C660 282 710 225 710 110ZM260 590H740V630H260ZM270 75V625M730 75V625M310 78V105M690 78V105M310 595V620M690 595V620"/><path class="chu-sand" d="M340 174H660Q630 264 500 330Q370 264 340 174ZM320 574Q420 525 500 390Q580 525 680 574Z" fill="currentColor"/><path d="M500 335V405" stroke-width="3"/>')}</div>
          <div class="chu-engraving">${svg(many(2,k=>`<g transform="translate(0 ${k?700:0}) scale(1 ${k?-1:1})"><path d="M240 60Q300 20 360 60T480 60T600 60T720 60L760 60M260 84H740M280 93H720"/>${many(12,i=>`<path d="M${280+i*40} 72l10 -18 10 18 -10 10Z"/>`)}<path d="M230 60 210 90 240 120M770 60 790 90 760 120M500 40V0M480 20H520"/></g>`))}</div>
          <div class="chu-scriptures">${many(2,k=>`<span style="--i:${k}">${svg(many(16,i=>`<path d="M${i*30} 20l8 -8 8 8 -8 8ZM${i*30} 34h16M${i*30+8} 39v8"/>`),'0 0 480 55')}</span>`)}</div>
          <div class="chu-constellation">${svg(many(8,i=>`<g transform="rotate(${i*45} 500 350)"><path d="M500 35V75M480 55H520M500 100 507 116 500 132 493 116ZM500 150V170"/><circle cx="500" cy="185" r="3"/></g>`))}</div>
          <div class="chu-beams">${many(7,i=>`<i style="--i:${i}"></i>`)}</div>
          <div class="chu-sweep"></div><div class="chu-tidal-rings">${many(5,i=>`<i style="--i:${i}"></i>`)}</div>
          <div class="chu-shards">${many(density(34),i=>`<i style="--i:${i};--x:${(i*47)%100}%;--y:${(i*31)%100}%"></i>`)}</div>
          <div class="chu-horizon"></div><div class="chu-caption"><small>CHRONOS · THE ENDLESS HOUR</small><strong>ĐẠI THÁC THỜI GIAN</strong><span>Mọi kỷ nguyên trở về trong một hạt cát.</span></div><div class="chu-letterbox"></div>`,7800);return true;
    }
    function mountPet(isPremium){clearPet();if(exam())return;ensureCSS();pet=document.getElementById('virtual-pet-img');if(!pet)return;premium=isPremium;events=new AbortController();const opts={signal:events.signal};attrs=Object.fromEntries(['role','tabindex','title'].map(k=>[k,pet.getAttribute(k)]));pet.classList.add(premium?'ch-character':'chr-character');pet.setAttribute('role','button');pet.tabIndex=0;pet.title=premium?'Chronos · Chạm để mở Đại Thác Thời Gian':'Chronos · Chạm để mở Khúc Nhạc Một Giây';
        aura=host('chronos-aura',premium?'ch-aura':'chr-aura',premium?`<div class="ch-aura-wheel">${wheel()}</div><div class="ch-aura-orbit"></div><div class="ch-aura-steps">${many(4,i=>`<i style="--i:${i}"></i>`)}</div><div class="ch-aura-chains">${pendulum()}${pendulum()}</div><div class="ch-aura-rune">A E T E R N I T A S</div>`:`<div class="chr-balance"><i></i><b></b></div><div class="chr-spring"></div>${many(3,ticket)}`,pet.parentElement);
        if(premium){world=host('chronos-world','ch-world',sanctum());document.documentElement.classList.add('chronos-equipped');document.addEventListener('pointerdown',click,opts);}
        pet.addEventListener('click',ultimate,opts);pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ultimate();}},opts);
        const update=()=>{if(!pet?.isConnected||pet.parentElement?.style.display==='none'||pet.parentElement?.hidden||exam()){clearPet();return;}const paused=quiet();aura.hidden=paused;if(world)world.hidden=paused;if(paused)clearTransients();};
        observer=new MutationObserver(update);observer.observe(pet.parentElement,{attributes:true,childList:true,attributeFilter:['style','hidden']});observer.observe(document.body,{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',update,opts);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,opts);update();
    }
    function clearEffect(){effectEvents?.abort();effectObserver?.disconnect();effect?.remove();effect=effectEvents=effectObserver=null;}
    function mountEffect(){clearEffect();if(exam())return;ensureCSS();const parent=document.getElementById('global-effect-container');if(!parent)return;effect=host('chronos-regular-effect','chr-weather',`<div class="chr-staff">${many(2,i=>`<span style="--i:${i}">${many(5,j=>`<i style="--j:${j}"></i>`)}</span>`)}</div><div class="chr-escapements">${many(4,i=>`<span style="--i:${i}">${svg('<path d="M10 50H110M20 20V80M100 20V80M35 50 50 26 65 50 80 26 95 50M35 50 50 74 65 50 80 74 95 50"/>','0 0 120 100')}<b>∞</b></span>`)}</div>${many(density(18),ticket)}<div class="chr-chimes">${many(8,i=>`<i style="--i:${i}">♪</i>`)}</div>`,parent);effectEvents=new AbortController();const opts={signal:effectEvents.signal};const update=()=>{if(effect)effect.hidden=quiet();};effectObserver=new MutationObserver(update);effectObserver.observe(document.body,{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',update,opts);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,opts);update();}
    window.ChronosRuntime={mountPremium:()=>mountPet(true),mountRegularPet:()=>mountPet(false),mountEffect,clearPet,clearEffect,ultimate,ensureCSS};
})();
