/* Audrey Hall — original mirror cathedral / separate paper salon collection. */
(() => {
    'use strict';
    const CSS = 'css/audrey-hall.css?v=20261012.audrey1';
    const many = (n, fn) => Array.from({length:n}, (_, i) => fn(i)).join('');
    const svg = (art, box='0 0 1000 700') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" fill="none" stroke="currentColor" aria-hidden="true">${art}</svg>`;
    const count = n => Math.min(n, Math.max(4, window.EffectQualityManager?.getRecommendedCount?.(n) || n));
    const pane = '<path d="M0 160V-40Q0-135 65-180Q130-135 130-40V160ZM12 150V-40Q12-119 65-162Q118-119 118-40V150ZM65-162V150M12-20H118M12 60H118"/><path d="M65-120 98-60 65 0 32-60ZM65 25 98 80 65 140 32 80Z" fill="currentColor" fill-opacity=".12"/>';
    const justice = svg('<path d="M120 25V188M70 200H170M90 188H150M45 75Q120 100 195 75M120 25 105 44 120 59 135 44Z"/><path d="M58 82 32 132H84ZM182 82 156 132H208Z"/><path d="M32 132Q58 171 84 132M156 132Q182 171 208 132" fill="currentColor" fill-opacity=".18"/><circle cx="120" cy="68" r="7"/>','0 0 240 230');
    const filigree = '<path d="M0 120Q65 65 0 0Q-65 65 0 120M0 105Q35 65 0 25Q-35 65 0 105M0 25V105M0 68Q65 5 78 43Q82 76 37 65Q10 45 28 32M0 68Q-65 5-78 43Q-82 76-37 65Q-10 45-28 32"/>';
    const dragon = svg('<path d="M95 425Q185 570 355 466T667 448Q815 440 819 342Q814 257 722 262Q647 273 672 342Q691 386 726 361Q743 340 722 333M819 335Q878 263 841 214L820 180 840 190 864 177 858 206 894 214 862 239Q885 319 819 375" stroke-width="5"/><path d="M355 466Q352 220 134 83Q327 91 456 339Q459 121 671 84Q550 223 530 414" fill="currentColor" fill-opacity=".08"/><path d="M355 466 210 134M355 466 290 152M456 339 365 189M530 414 629 128M530 414 583 173M368 459Q350 506 301 528M570 454Q600 500 653 497"/>'+many(34,i=>`<path transform="translate(${160+i*18} ${458+Math.sin(i*.2)*34}) rotate(${Math.cos(i*.2)*13})" d="M-8 0 0-10 8 0 0 7Z" fill="currentColor" fill-opacity=".1"/>`),'0 0 1000 600');
    // No assets, shapes or animation builders from previous premium suites.
    function cathedral() {
        return `<div class="ah-atmosphere"></div>
          <div class="ah-vault">${svg(many(7,i=>`<path style="--i:${i}" d="M${-160+i*46} 720V230Q${-160+i*46} ${-170+i*22} 500 ${-100+i*26}Q${1160-i*46} ${-170+i*22} ${1160-i*46} 230V720"/>`))}</div>
          <div class="ah-mirror-aisles">${svg(many(6,i=>`<g class="ah-pane" style="--i:${i}" transform="translate(${i<3?i*64-90:898+(i-3)*64} ${270+(i%3)*70}) scale(.8 1.25)">${pane}</g>`))}</div>
          <div class="ah-gilded-carvings">${svg(many(8,i=>`<g transform="translate(${i%2?976:24} ${20+Math.floor(i/2)*170}) scale(.48 1)">${filigree}</g>`))}</div>
          <div class="ah-rose-windows">${svg(many(2,s=>`<g transform="translate(${s?920:80} 105)">${many(12,i=>`<g transform="rotate(${i*30})"><path d="M0 0Q-27-45 0-72Q27-45 0 0Z" fill="${i%2?'#5b9a7340':'#d8ba6330'}"/><path d="M0-12V-65M-9-45H9"/></g>`)}<circle r="78"/><circle r="83" stroke-dasharray="1 5"/></g>`))}</div>
          <div class="ah-thought-mirrors">${many(6,i=>`<span style="--i:${i};--x:${i%2?89:2}%;--y:${20+Math.floor(i/2)*24}%">${svg('<path d="M40 0 75 25V100L40 130 5 100V25ZM40 10 66 30V94L40 118 14 94V30Z" fill="currentColor" fill-opacity=".08"/><path d="M15 90 63 42M15 64 57 25M25 105 65 66"/>','0 0 80 130')}</span>`)}</div>
          <div class="ah-chandelier">${svg('<path d="M500 0V70M320 0Q500 260 680 0M385 0Q500 180 615 0"/>'+many(17,i=>`<g style="--i:${i}" class="ah-pendant" transform="translate(${308+i*24} ${46+Math.sin(i/16*Math.PI)*110})"><path d="M0 0V35M0 35 5 47 0 62-5 47Z" fill="currentColor" fill-opacity=".5"/></g>`))}</div>
          <div class="ah-psyche-map">${svg(many(12,i=>`<g style="--i:${i}" transform="translate(${(i*137)%960+20} ${40+(i*97)%560})"><path d="M0 0 20-15 38 6 56-11"/><path d="M0-4 4 0 0 4-4 0Z M38 2 42 6 38 10 34 6Z" fill="currentColor"/></g>`))}</div>
          <div class="ah-water">${svg(many(15,i=>`<path style="--i:${i}" d="M-100 ${620+i*6}Q250 ${535+i*10} 500 ${630+i*4}T1100 ${620+i*6}"/>`))}</div>
          <div class="ah-ribbons">${svg(many(5,i=>`<path style="--i:${i}" d="M-40 ${180+i*24}C190 ${600+i*10} 95 ${-110+i*16} 340 ${90+i*22}M1040 ${210+i*24}C810 ${610+i*10} 905 ${-110+i*16} 660 ${90+i*22}"/>`))}</div>
          <div class="ah-seals"><span>${justice}</span><span>${justice}</span></div>
          <div class="ah-prisms">${many(count(28),i=>`<i style="--i:${i};--x:${(i*73+9)%100}%;--y:${(i*37+5)%100}%"></i>`)}</div>
          <div class="ah-corners">${svg(many(4,i=>`<g transform="translate(${i%2?1000:0} ${i>1?700:0}) scale(${i%2?-1:1} ${i>1?-1:1})"><path d="M12 160V12H180M22 130V22H140M35 95V35H110M35 35 65 65 95 35M35 35 65 65 35 95"/><path d="M65 47 83 65 65 83 47 65Z" fill="currentColor" fill-opacity=".3"/></g>`))}</div>`;
    }
    function halo() {
        return `<div class="ah-pet-mirror">${svg(pane,'-25 -205 180 390')}</div><div class="ah-pet-fan">${svg(many(9,i=>`<path transform="translate(120 180) rotate(${i*18-72})" d="M0 0-12-100 0-170 12-100Z" fill="currentColor" fill-opacity=".06"/>`),'0 0 240 240')}</div><div class="ah-pet-orbits">${many(3,i=>`<b style="--i:${i}"></b>`)}</div><div class="ah-pet-dais"></div><div class="ah-pet-jewels">${many(10,i=>`<i style="--i:${i}"></i>`)}</div>`;
    }
    function paperButterfly(i) { return `<span class="ahr-paper" style="--i:${i};--x:${(i*29+7)%100}%;--y:${(i*23+14)%88}%">${svg('<path d="M30 40 2 4 6 42 29 48 14 65 30 55 46 65 31 48 54 42 58 4Z" fill="currentColor" fill-opacity=".2"/><path d="M30 55V35M8 13 28 43M52 13 32 43"/>','0 0 60 70')}</span>`; }
    function layer(id, cls, content, parent=document.body) {
        const host=document.createElement('div'); host.id=id; host.className=cls;
        host.setAttribute('aria-hidden','true');
        host.style.setProperty('pointer-events','none','important');
        const root=host.attachShadow({mode:'open'});
        root.innerHTML=`<link rel="stylesheet" href="${CSS}"><div class="${cls}-inner">${content}</div>`;
        parent.appendChild(host); return host;
    }
    const timers=new Set();
    function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);}
    let pet, events, observer, aura, world, effect, effectEvents, effectObserver, mode='', lastClick=0, readyAt=0, saved;
    const quiet=()=>document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('wfx-low-power') || window.isExamVisualItemsSuspended===true || Boolean(window.currentActiveExamId);
    function clearPet(){
        events?.abort(); observer?.disconnect(); timers.forEach(clearTimeout);timers.clear();
        document.querySelectorAll('[data-audrey-transient]').forEach(n=>n.remove());
        aura?.remove(); world?.remove();
        document.documentElement.classList.remove('ah-equipped','ah-quiet');
        if(pet){pet.classList.remove('ah-character','ahr-character');for(const [k,v] of Object.entries(saved||{}))v===null?pet.removeAttribute(k):pet.setAttribute(k,v);}
        pet=events=observer=aura=world=null; mode='';readyAt=0;lastClick=0;
    }
    function transient(cls,art,ms){const host=layer('',cls,art);host.dataset.audreyTransient='1';later(()=>host.remove(),ms);return host;}
    function burst(x,y){
        if(quiet()||performance.now()-lastClick<180)return;lastClick=performance.now();
        const host=transient('ah-touch',`<div class="ah-touch-gem"></div>${many(8,i=>`<i style="--i:${i}"></i>`)}`,950);
        host.style.left=x+'px';host.style.top=y+'px';
    }
    function ultimate(){
        if(!pet||quiet()||performance.now()<readyAt||pet.parentElement?.dataset.petDragged==='1')return false;
        readyAt=performance.now()+(mode==='premium'?12000:6500);
        if(mode==='regular'){
            transient('ahr-letter',`<div class="ahr-envelope">${svg('<path d="M8 20H192V130H8ZM8 20 100 88 192 20M8 130 75 68M192 130 125 68"/>','0 0 200 150')}<b>TÂM THƯ</b></div>${many(9,paperButterfly)}`,3000);return true;
        }
        // Six-second scene: open mirrored doors, unfold tribunal, disperse prisms.
        const tribunal=svg(many(24,i=>`<path transform="translate(350 350) rotate(${i*15})" d="M0-115-24-195 0-290 24-195Z" fill="currentColor" fill-opacity=".05"/>`)+many(3,i=>`<circle cx="350" cy="350" r="${135+i*75}" stroke-dasharray="${i?4:1} ${i?14:0}"/>`),'0 0 700 700');
        transient('ah-ultimate',`<div class="ah-ult-wash"></div><div class="ah-ult-dragon">${dragon}</div><div class="ah-ult-door left">${svg(pane,'-20 -200 170 380')}</div><div class="ah-ult-door right">${svg(pane,'-20 -200 170 380')}</div><div class="ah-ult-stairs">${many(9,i=>`<i style="--i:${i}"></i>`)}</div><div class="ah-ult-mandala">${tribunal}</div><div class="ah-ult-filigree">${svg(many(12,i=>`<g transform="translate(500 350) rotate(${i*30}) translate(0 -290) scale(.42 .75)">${filigree}</g>`))}</div><div class="ah-ult-scales">${justice}</div><div class="ah-ult-shards">${many(count(42),i=>`<i style="--i:${i};--a:${i*137.5}deg;--r:${180+i%7*36}px"></i>`)}</div><div class="ah-ult-inscription"><small>XI · JUSTICE · AUDREY HALL</small><strong>THÁNH ĐƯỜNG TÂM TRÍ</strong><span>Lắng nghe những điều chưa thành lời</span></div>`,6200);return true;
    }
    function mountPet(premium){
        clearPet();if(quiet() && (window.currentActiveExamId||window.isExamVisualItemsSuspended))return;
        pet=document.getElementById('virtual-pet-img');if(!pet)return;
        mode=premium?'premium':'regular';events=new AbortController();const opts={signal:events.signal};
        saved=Object.fromEntries(['role','tabindex','title'].map(k=>[k,pet.getAttribute(k)]));
        pet.classList.add(premium?'ah-character':'ahr-character');pet.setAttribute('role','button');pet.tabIndex=0;
        pet.title=premium?'Audrey Hall · Chạm để mở Thánh Đường Tâm Trí':'Audrey Hall · Chạm để mở Tâm Thư';
        aura=layer('audrey-pet-aura',premium?'ah-aura':'ahr-aura',premium?halo():`<div class="ahr-book">${svg('<path d="M60 25Q30 0 5 14V100Q30 85 60 112Q90 85 115 100V14Q90 0 60 25ZM60 25V112M17 34 46 43M17 50 46 59M75 43 103 34M75 59 103 50"/>','0 0 120 120')}</div>${many(4,paperButterfly)}`,pet.parentElement);
        if(premium){world=layer('audrey-cathedral','ah-world',cathedral());document.documentElement.classList.add('ah-equipped');document.addEventListener('pointerdown',e=>{if(!pet.contains(e.target)&&e.isPrimary!==false)burst(e.clientX,e.clientY);},opts);}
        pet.addEventListener('click',ultimate,opts);pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ultimate();}},opts);
        const update=()=>{
            if(!pet?.isConnected || pet.parentElement?.style.display==='none' || pet.parentElement?.hidden || window.currentActiveExamId || window.isExamVisualItemsSuspended){clearPet();return;}
            const paused=quiet();document.documentElement.classList.toggle('ah-quiet',premium&&paused);
            if(world)world.hidden=paused;if(aura)aura.hidden=paused;
            if(paused)document.querySelectorAll('[data-audrey-transient]').forEach(n=>n.remove());
        };
        observer=new MutationObserver(update);observer.observe(pet.parentElement,{childList:true,attributes:true,attributeFilter:['style','hidden']});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
        document.addEventListener('visibilitychange',update,opts);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,opts);update();
    }
    function clearEffect(){effectEvents?.abort();effectObserver?.disconnect();effect?.remove();effect=effectEvents=effectObserver=null;}
    function mountEffect(){clearEffect();const parent=document.getElementById('global-effect-container');if(!parent)return;
        effect=layer('audrey-paper-weather','ahr-weather',many(count(16),paperButterfly)+`<div class="ahr-writing">${svg(many(6,i=>`<path style="--i:${i}" d="M0 ${80+i*95}q60-30 110 0t80 0m610 0q60-30 110 0t90 0"/>`))}</div>`,parent);
        effectEvents=new AbortController();const options={signal:effectEvents.signal};
        const update=()=>{if(effect)effect.hidden=quiet();};
        effectObserver=new MutationObserver(update);effectObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
        document.addEventListener('visibilitychange',update,options);
        matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,options);update();
    }
    window.AudreyHallRuntime={mountPremium:()=>mountPet(true),mountRegularPet:()=>mountPet(false),mountEffect,clearPet,clearEffect,ultimate};
})();
