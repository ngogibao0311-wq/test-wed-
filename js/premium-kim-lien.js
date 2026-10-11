/* Regular Kim Liên: paper kites, dew beads and a jade seal. Independent of the premium lotus scene. */
(() => {
    'use strict';
    if (!document.getElementById('kim-lien-css')) {
        const link = document.createElement('link');
        link.id = 'kim-lien-css'; link.rel = 'stylesheet';
        link.href = 'css/premium-kim-lien.css?v=20261009.regular-art1';
        document.head.appendChild(link);
    }
    window.KimLienRegularRuntime = {
        timers: new Set(),
        clear() {
            this.events?.abort(); this.observer?.disconnect();
            this.timers.forEach(clearTimeout); this.timers.clear();
            this.host?.remove(); this.aura?.remove();
            if (this.pet) {
                this.pet.classList.remove('klr-companion');
                for (const [key, value] of Object.entries(this.saved || {})) {
                    value === null ? this.pet.removeAttribute(key) : this.pet.setAttribute(key, value);
                }
            }
            this.pet = null;
        },
        later(fn, ms) {
            const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms);
            this.timers.add(id);
        },
        quiet() {
            return document.hidden || document.body.classList.contains('wfx-low-power') ||
                window.isExamVisualItemsSuspended === true || Boolean(window.currentActiveExamId) ||
                matchMedia('(prefers-reduced-motion: reduce)').matches;
        },
        sync(items = {}) {
            this.clear();
            if (!items.pet && !items.effect) return;
            this.events = new AbortController();
            const options = { signal: this.events.signal };
            this.host = document.createElement('div');
            this.host.id = 'kim-lien-regular-world';
            this.host.setAttribute('aria-hidden', 'true');
            this.host.style.cssText = 'position:fixed;inset:0;pointer-events:none!important;z-index:950;overflow:hidden';
            this.shadow = this.host.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = '<link rel="stylesheet" href="css/premium-kim-lien.css?v=20261009.regular-art1">';
            if (items.effect) {
                const sky = document.createElement('div'); sky.className = 'klr-sky';
                sky.innerHTML = window.RegularStoreArt.kim.world();
                this.shadow.appendChild(sky);
            }
            document.body.appendChild(this.host);
            if (items.pet) {
                this.pet = document.getElementById('virtual-pet-img');
                if (this.pet) {
                    this.saved = Object.fromEntries(['role','tabindex','title'].map(key => [key,this.pet.getAttribute(key)]));
                    this.pet.classList.add('klr-companion'); this.pet.setAttribute('role','button');
                    this.pet.tabIndex = 0; this.pet.title = 'Kim Liên · Chạm để gọi Diều Ngọc';
                    this.aura = document.createElement('div'); this.aura.className = 'klr-dew';
                    this.aura.setAttribute('aria-hidden','true');
                    this.aura.attachShadow({mode:'open'}).innerHTML = '<link rel="stylesheet" href="css/premium-kim-lien.css?v=20261009.regular-art1">'+window.RegularStoreArt.kim.aura();
                    this.pet.parentElement.appendChild(this.aura);
                    const activate = () => this.ultimate();
                    this.pet.addEventListener('click', activate, options);
                    this.pet.addEventListener('keydown', e => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
                    }, options);
                }
            }
            const update = () => {
                const quiet = this.quiet();
                this.host.hidden = quiet;
                if (this.aura) this.aura.hidden = quiet;
                if (quiet) this.shadow.querySelectorAll('.klr-seal').forEach(n => n.remove());
            };
            this.observer = new MutationObserver(update);
            this.observer.observe(document.body,{attributes:true,attributeFilter:['class']});
            document.addEventListener('visibilitychange', update, options);
            matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', update, options);
            update();
        },
        ultimate() {
            if (!this.pet || this.quiet() || this.pet.parentElement?.dataset.petDragged === '1' ||
                performance.now() < (this.readyAt || 0)) return;
            this.readyAt = performance.now() + 8000;
            const seal = document.createElement('div'); seal.className = 'klr-seal';
            seal.innerHTML = window.RegularStoreArt.kim.ultimate();
            this.shadow.appendChild(seal); this.later(() => seal.remove(), 3400);
        }
    };
})();

/* Kim Liên: independent vector lotus/lantern scene, isolated from equipped themes. */
(() => {
    'use strict';
    const css = 'css/premium-kim-lien.css?v=20261009.regular-art1';
    const repeat=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
    const runtime = window.KimLienRuntime = {
        timers:new Set(),
        later(fn,ms) { const id=setTimeout(()=>{this.timers.delete(id);fn();},ms);this.timers.add(id); },
        lanternArt() {
            return `<svg viewBox="0 0 120 240" fill="none" stroke="#e6c37a"><path d="M60 0V30M38 30H82L94 53 88 116 60 135 32 116 26 53Z" fill="#967129" fill-opacity=".26"/><path d="M38 30 45 52 43 115 60 135 77 115 75 52 82 30M26 53H94M32 116H88M45 52H75M60 30V135"/><path d="M50 78Q60 58 70 78Q60 103 50 78Z" fill="#fff2b6"/><path d="M60 135V225M48 142V207M72 142V207M43 145H77"/><circle cx="60" cy="154" r="5" fill="#fcdf93"/><path d="M54 218 60 236 66 218"/>${repeat(5,i=>`<path d="M${36+i*12} 111v-12"/>`)}</svg>`;
        },
        vine() {
            return `<svg viewBox="0 0 200 650" fill="none" stroke="#d9b766"><path d="M95 650C-30 525 205 425 95 300S-20 125 110 0" stroke-width="2"/>${repeat(9,i=>`<g transform="translate(${80+Math.sin(i*1.9)*30} ${35+i*70}) rotate(${i%2?30:-25})"><path d="M0 55Q-85 10-60-30Q5-20 0 55Q55-30 83-15Q90 25 0 55" fill="#d5ac49" fill-opacity=".1"/><path d="M0 55-60-30M0 55 83-15M-18 28-40 22M-30 11-53 4M18 37 46 35M32 24 64 19"/><path d="M0 55Q35 75 33 100Q15 120 7 101Q0 85 15 83"/></g>`)}</svg>`;
        },
        embroidery() {
            return `<svg viewBox="0 0 600 600" fill="none" stroke="#f6d894">${repeat(24,i=>`<g transform="rotate(${i*15} 300 300)"><path d="M300 12Q340 40 300 74Q260 40 300 12Z" fill="#a77f37" fill-opacity=".18"/><path d="M300 20V63M286 39 300 50 314 39M300 78V95"/><circle cx="300" cy="103" r="3" fill="#fae7b1"/></g>`)}<circle cx="300" cy="300" r="288"/><circle cx="300" cy="300" r="214" stroke-dasharray="1 5"/>${repeat(12,i=>`<path transform="rotate(${i*30} 300 300)" d="M300 112C350 125 370 190 325 206C296 211 292 175 315 175C333 175 330 193 321 190M300 112C250 125 230 190 275 206C304 211 308 175 285 175C267 175 270 193 279 190"/>`)}</svg>`;
        },
        ornaments(ultimate=false) {
            return `<div class="kl-brocade kl-brocade-left">${this.vine()}</div><div class="kl-brocade kl-brocade-right">${this.vine()}</div><div class="kl-ceiling">${repeat(ultimate?9:5,i=>`<span style="--i:${i};--n:${ultimate?9:5}">${this.lanternArt()}</span>`)}</div><div class="kl-prayer-ribbons">${repeat(ultimate?18:8,i=>`<i style="--i:${i};--x:${(i*47)%100}%;--d:${-i*1.17}s"><b>蓮</b></i>`)}</div>`;
        },
        setStage(scene,phase,label){if(!scene.isConnected)return;scene.dataset.phase=phase;const caption=scene.querySelector('[data-stage-label]');if(caption)caption.textContent=label;},
        astrolabe() {
            return `<svg viewBox="0 0 600 600" fill="none" stroke="currentColor"><circle cx="300" cy="300" r="275" stroke-width="2"/><circle cx="300" cy="300" r="256" stroke-dasharray="1 9" stroke-width="8"/><circle cx="300" cy="300" r="230"/>${Array.from({length:16},(_,i)=>`<g transform="rotate(${i*22.5} 300 300)"><path d="M300 24 L310 44 L300 64 L290 44Z" fill="currentColor" fill-opacity=".5"/><path d="M300 72 L300 110 M286 92 L314 92"/><path d="M300 120 Q360 180 300 300 Q240 180 300 120Z" stroke-opacity=".5"/></g>`).join('')}</svg>`;
        },
        palace() {
            return `<div class="kl-palace"><div class="kl-celestial-clock">${this.astrolabe()}</div>${[-1,1].map(side=>`<div class="kl-pavilion" style="--side:${side}"><svg viewBox="0 0 260 700" fill="none" stroke="currentColor"><path d="M25 680 V260 Q130 30 235 260 V680 M52 680 V280 Q130 100 208 280 V680 M20 265 Q130 235 240 265 M15 290 H245 M40 630 H220 M60 652 H200" stroke-width="2"/><path d="M130 95 V25 M108 62 L130 25 L152 62 M80 175 L130 100 L180 175 M80 175 Q130 150 180 175"/><path d="M70 600 V350 Q130 220 190 350 V600"/><circle cx="130" cy="390" r="43"/><path d="M130 330 L155 390 L130 450 L105 390Z"/><path d="M25 680 Q130 640 235 680 M10 692 H250"/></svg></div>`).join('')}<div class="kl-river"></div>${Array.from({length:14},(_,i)=>`<i class="kl-starfall" style="--x:${i*7}%;--delay:${-i*1.3}s"></i>`).join('')}</div>`;
        },
        lotus() {
            return `<svg viewBox="0 0 600 600" fill="none" aria-hidden="true">${[0,1,2].map(layer=>`<g class="kl-corolla" style="--layer:${layer};transform-origin:300px 300px">${repeat(12,i=>`<g transform="rotate(${i*30+layer*15} 300 300) translate(300 300) scale(${1-layer*.24}) translate(-300 -300)"><path d="M300 300C196 207 202 110 300 38C398 110 404 207 300 300Z" fill="${['#937031','#caa457','#ffe3a0'][layer]}" fill-opacity="${.24+layer*.12}" stroke="#f9df9d" stroke-width="1.5"/><path d="M300 280C241 205 246 124 300 60C354 124 359 205 300 280ZM300 64V280" stroke="#ffe8b3" stroke-opacity=".55"/>${repeat(5,j=>`<path d="M300 ${110+j*30}q-${20+j*3} -10-${28+j*2} -${25+j*4}M300 ${110+j*30}q${20+j*3} -10 ${28+j*2} -${25+j*4}" stroke="#efce82" stroke-opacity=".45"/>`)}</g>`)}</g>`).join('')}<circle cx="300" cy="300" r="33" fill="#e2b04e" stroke="#fff2c0"/>${repeat(12,i=>`<circle cx="${300+20*Math.cos(i*Math.PI/6)}" cy="${300+20*Math.sin(i*Math.PI/6)}" r="3" fill="#fff5d1"/>`)}</svg>`;
        },
        clear() {
            this.events?.abort();this.observer?.disconnect();this.motion?.removeEventListener('change',this.sync);
            this.timers.forEach(clearTimeout);this.timers.clear();this.host?.remove();this.realm?.remove();
            if(this.pet){this.pet.classList.remove('kl-pet');for(const [k,v]of Object.entries(this.saved||{}))v===null?this.pet.removeAttribute(k):this.pet.setAttribute(k,v);}
            document.documentElement.classList.remove('kl-equipped');
            this.pet=this.host=this.realm=this.shadow=null;this.nextCast=0;
        },
        mount() {
            this.clear();const pet=document.getElementById('virtual-pet-img');if(!pet)return;
            this.pet=pet;this.saved=Object.fromEntries(['title','tabindex','role','aria-label'].map(k=>[k,pet.getAttribute(k)]));
            pet.classList.add('kl-pet');pet.title='Vạn Đăng Khai Liên · nhấn để kích hoạt · hồi chiêu 12 giây';
            pet.tabIndex=0;pet.setAttribute('role','button');pet.setAttribute('aria-label','Kim Liên: kích hoạt Vạn Đăng Khai Liên');
            if(!document.getElementById('kim-lien-css')){const link=document.createElement('link');link.id='kim-lien-css';link.rel='stylesheet';link.href=css;document.head.appendChild(link);}
            document.documentElement.classList.add('kl-equipped');
            const host=this.host=document.createElement('div');host.id='kim-lien-world';host.setAttribute('aria-hidden','true');
            host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:950!important;overflow:hidden!important;contain:strict!important;';
            const shadow=this.shadow=host.attachShadow({mode:'open'});
            const count=window.EffectQualityManager?.getRecommendedCount?.(18)||18;
            shadow.innerHTML=`<link rel="stylesheet" href="${css}"><div class="kl-atmosphere">${this.palace()}<div class="kl-silk"></div><div class="kl-reflection"></div><div class="kl-edge kl-left">${this.lotus()}</div><div class="kl-edge kl-right">${this.lotus()}</div>${Array.from({length:Math.min(22,Math.max(5,count))},(_,i)=>`<i class="kl-lantern" style="--x:${(i*61)%100}%;--delay:${-i*1.7}s;--duration:${18+i%7}s;--scale:${.4+(i%5)*.15}"><b></b></i>`).join('')}</div>`;
            document.body.appendChild(host);
            const adornment=document.createElement('div');adornment.className='kl-adornment';adornment.innerHTML=this.ornaments();shadow.appendChild(adornment);
            this.realm=document.createElement('div');this.realm.className='kl-pet-realm';this.realm.setAttribute('aria-hidden','true');this.realm.attachShadow({mode:'open'}).innerHTML=`<link rel="stylesheet" href="${css}"><div class="kl-aura-scene"><div class="kl-aura-halo">${this.astrolabe()}</div><div class="kl-aura-throne">${this.lotus()}</div><div class="kl-aura-mist"></div>${Array.from({length:8},(_,i)=>`<i class="kl-aura-jewel" style="--i:${i}"></i>`).join('')}</div>`;pet.parentElement.appendChild(this.realm);
            const jewel=document.createElement('div');jewel.className='kl-aura-diadem';jewel.innerHTML=this.embroidery();this.realm.shadowRoot.querySelector('.kl-aura-scene').prepend(jewel);
            const pendants=document.createElement('div');pendants.className='kl-aura-pendants';pendants.innerHTML=this.lanternArt()+this.lanternArt();this.realm.shadowRoot.querySelector('.kl-aura-scene').appendChild(pendants);
            this.events=new AbortController();const {signal}=this.events;
            const cast=e=>{if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;e.preventDefault();this.ultimate();};
            pet.addEventListener('click',cast,{signal});pet.addEventListener('keydown',cast,{signal});
            document.addEventListener('pointerdown',e=>{if(e.target===pet||this.paused)return;this.bloom(e.clientX,e.clientY);},{signal,passive:true});
            this.motion=matchMedia('(prefers-reduced-motion: reduce)');
            this.sync=()=>{
                if(!pet.isConnected){this.clear();return;}
                this.paused=document.hidden||this.motion.matches||document.body.classList.contains('wfx-low-power')||window.isExamVisualItemsSuspended===true||Boolean(window.currentActiveExamId);
                host.classList.toggle('kl-paused',this.paused);
                host.hidden=this.paused;
                if(this.realm)this.realm.hidden=this.paused;
                if(this.paused)shadow.querySelectorAll('.kl-ultimate,.kl-bloom').forEach(n=>n.remove());
            };
            document.addEventListener('visibilitychange',this.sync,{signal});this.motion.addEventListener('change',this.sync);
            this.observer=new MutationObserver(this.sync);this.observer.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true});this.sync();
        },
        bloom(x,y) {
            if(!this.shadow||performance.now()-(this.lastTap||0)<180)return;this.lastTap=performance.now();
            const bloom=document.createElement('div');bloom.className='kl-bloom';bloom.style.cssText=`left:${x}px;top:${y}px`;bloom.innerHTML=this.lotus()+`<div class="kl-pollen">${repeat(8,i=>`<i style="--i:${i}"></i>`)}</div>`;this.shadow.appendChild(bloom);this.later(()=>bloom.remove(),1500);
        },
        ultimate() {
            if(!this.shadow||this.paused||Date.now()<this.nextCast||this.pet?.parentElement?.dataset.petDragged==='1')return;
            this.nextCast=Date.now()+12000;
            const scene=document.createElement('div');scene.className='kl-ultimate';
            scene.dataset.phase='gather';
            scene.innerHTML=`<div class="kl-eclipse"></div>${this.ornaments(true)}<div class="kl-ceremony-rim">${this.embroidery()}</div><div class="kl-doors"><span>${this.vine()}</span><span>${this.vine()}</span></div><div class="kl-sanctum">${this.lotus()}</div><div class="kl-seed-stream">${repeat(matchMedia('(max-width:600px)').matches?20:40,i=>`<i style="--i:${i};--x:${(i*37)%100}%;--dx:${Math.sin(i*2.4)*200}px;--d:${i*.04}s"></i>`)}</div><div class="kl-festival-floor">${repeat(7,i=>`<span style="--i:${i}">${this.lotus()}</span>`)}</div><div class="kl-title">VẠN ĐĂNG KHAI LIÊN<small data-stage-label>Ngưng châu · Dẫn đăng</small></div>`;
            this.shadow.appendChild(scene);
            this.later(()=>this.setStage(scene,'bloom','Khai điện · Thiên liên nở'),1600);
            this.later(()=>this.setStage(scene,'release','Vạn đăng · Quy thiên'),3900);
            this.later(()=>this.setStage(scene,'fade','Dư hương · Tĩnh giới'),6600);
            this.later(()=>scene.remove(),8000);
        }
    };
})();
