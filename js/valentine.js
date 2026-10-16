/* Regular Cupid effect is independent of the premium pet's five layers. */
(() => {
    'use strict';
    let host = null, observer = null, events = null;
    function clearEffect() {
        observer?.disconnect();
        events?.abort();
        host?.remove();
        host = observer = events = null;
    }
    function mountEffect() {
        clearEffect();
        const parent = document.getElementById('global-effect-container');
        if (!parent) return;
        host = document.createElement('div');
        host.id = 'cupid-regular-effect';
        host.setAttribute('aria-hidden', 'true');
        host.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:900';
        const shadow = host.attachShadow({ mode: 'open' });
        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = 'css/valentine.css?v=20261015.regular-fix1';
        shadow.append(css);
        const stage = document.createElement('div');
        stage.className = 'cupid-regular-weather';
        const count = Math.max(6, Math.min(16, window.EffectQualityManager?.getRecommendedCount?.(16) ?? 16));
        for (let i = 0; i < count; i++) {
            const heart = document.createElement('span');
            heart.style.setProperty('--x', `${(i * 37 + 5) % 100}%`);
            heart.style.setProperty('--delay', `${-i * 1.7}s`);
            heart.style.setProperty('--duration', `${12 + i % 5}s`);
            heart.textContent = i % 3 ? '♡' : '❀';
            stage.append(heart);
        }
        shadow.append(stage); parent.append(host);
        const sync = () => {
            if (!host) return;
            host.hidden = document.hidden || !!window.currentActiveExamId ||
                document.body.classList.contains('exam-active') || document.body.classList.contains('wfx-paused');
            stage.classList.toggle('cupid-still', document.body.classList.contains('wfx-low-power'));
        };
        events = new AbortController();
        document.addEventListener('visibilitychange', sync, { signal: events.signal });
        observer = new MutationObserver(sync);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        sync();
    }
    const CSS='css/valentine.css?v=20261015.regular-fix1';
    const paused=()=>document.hidden||!!window.currentActiveExamId||window.isExamVisualItemsSuspended===true||document.body.classList.contains('exam-active')||document.body.classList.contains('wfx-paused');
    const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('wfx-low-power');
    function ensureCSS(){if(document.getElementById('valentine-regular-css'))return;const link=document.createElement('link');link.id='valentine-regular-css';link.rel='stylesheet';link.href=CSS;document.head.append(link);}
    let pet=null,petAura=null,petEvents=null,petObserver=null,petSaved={},petTimer=null,burst=null,petReady=0;
    function petLayer(cls,art,parent){
        const node=document.createElement('div');node.className=cls;node.setAttribute('aria-hidden','true');node.style.setProperty('pointer-events','none','important');
        const shadow=node.attachShadow({mode:'open'});shadow.innerHTML=`<link rel="stylesheet" href="${CSS}"><div class="cpr-stage" style="visibility:hidden">${art}</div>`;
        const css=shadow.querySelector('link'),stage=shadow.querySelector('.cpr-stage');
        const show=()=>{if(node.isConnected)stage.style.removeProperty('visibility');};css.addEventListener('load',show,{once:true});parent.append(node);if(css.sheet)show();return node;
    }
    function clearBurst(){clearTimeout(petTimer);petTimer=null;burst?.remove();burst=null;}
    function clearPet(){
        petEvents?.abort();petObserver?.disconnect();clearBurst();petAura?.remove();
        if(pet){pet.classList.remove('cpr-character');for(const [key,value]of Object.entries(petSaved))value===null?pet.removeAttribute(key):pet.setAttribute(key,value);}
        pet=petAura=petEvents=petObserver=null;petSaved={};petReady=0;
    }
    function petUltimate(){
        if(!pet?.isConnected||paused()||still()||pet.parentElement?.hidden||pet.parentElement?.style.display==='none'||pet.parentElement?.dataset.petDragged==='1'||performance.now()<petReady)return false;
        petReady=performance.now()+6500;clearBurst();
        burst=petLayer('cpr-ultimate',`<div class="cpr-letter"><div class="cpr-letter-paper"><i>♡</i><span>MỘT LỜI HẸN NHỎ</span></div><div class="cpr-envelope"></div><div class="cpr-envelope-flap"></div></div>${Array.from({length:8},(_,i)=>`<i class="cpr-message-heart" style="--i:${i}">♡</i>`).join('')}`,document.body);
        petTimer=setTimeout(clearBurst,3200);return true;
    }
    function mountPet(){
        clearPet();ensureCSS();pet=document.getElementById('virtual-pet-img');if(!pet)return;
        petSaved=Object.fromEntries(['title','role','tabindex'].map(key=>[key,pet.getAttribute(key)]));pet.classList.add('cpr-character');pet.title='Cupid · Chạm gửi Một Lời Hẹn Nhỏ';pet.setAttribute('role','button');pet.tabIndex=0;
        petAura=petLayer('cpr-aura',`<div class="cpr-halo"></div><div class="cpr-wing cpr-wing-left"></div><div class="cpr-wing cpr-wing-right"></div>${Array.from({length:5},(_,i)=>`<i class="cpr-pet-heart" style="--i:${i}">♡</i>`).join('')}`,pet.parentElement);
        const sync=()=>{if(!pet?.isConnected){clearPet();return;}const hidden=paused()||pet.parentElement?.hidden||pet.parentElement?.style.display==='none';if(petAura.hidden!==!!hidden)petAura.hidden=!!hidden;petAura.shadowRoot.querySelector('.cpr-stage').classList.toggle('cpr-still',still());if(hidden||still())clearBurst();};
        petEvents=new AbortController();const options={signal:petEvents.signal};
        pet.addEventListener('click',petUltimate,options);pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();petUltimate();}},options);
        document.addEventListener('visibilitychange',sync,options);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',sync,options);
        petObserver=new MutationObserver(sync);petObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});sync();
    }
    window.ValentineRegularRuntime = { mountEffect, clearEffect, ensureCSS, mountPet, clearPet, petUltimate };

})();

/* Valentine, five-layer premium runtime. No asset/account writes. */
(() => {
    'use strict';
    if (window.ValentinePremiumRuntime) return;
    const CSS = 'css/valentine.css?v=20261015.regular-fix1';
    const HEART = 'M12 21C9 18 1 13 1 7C1 1 9 -1 12 5C15 -1 23 1 23 7C23 13 15 18 12 21Z';
    const PETAL = 'M3 22C-4 9 3 -2 16 2C27 7 20 19 3 22Z';
    const svg = (body, box = '0 0 24 24') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" aria-hidden="true">${body}</svg>`;
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    function getLuxuryQualityCount(base, minimum = 1) {
        const manager = window.EffectQualityManager;
        const scale = manager?.getLuxuryPolicy?.()?.countScale;
        return Math.max(minimum, Math.min(base, scale != null ? Math.ceil(base * scale) : manager?.getRecommendedCount?.(base) ?? base));
    }
    function ensureCSS() {
        if (document.getElementById('vlt-css')) return;
        const link = document.createElement('link'); link.id = 'vlt-css'; link.rel = 'stylesheet'; link.href = CSS; document.head.append(link);
    }
    function appendMarkup(shadow, html) {
        const template=document.createElement('template');template.innerHTML=html;shadow.append(template.content);
    }
    function layer(name) {
        const host=document.createElement('div');host.className=name;host.setAttribute('aria-hidden','true');
        host.style.cssText='position:fixed!important;inset:0!important;pointer-events:none!important;overflow:hidden!important;z-index:940!important;visibility:hidden!important';
        const shadow=host.attachShadow({mode:'open'}),link=document.createElement('link');link.rel='stylesheet';link.href=CSS;
        const part={host,shadow,link,styled:false};
        part.ready=new Promise(resolve=>{
            link.addEventListener('load',()=>{part.styled=true;if(host.isConnected){const paused=document.hidden||window.isExamVisualItemsSuspended===true||Boolean(window.currentActiveExamId);host.style.setProperty('visibility',paused?'hidden':'visible','important');if(paused)for(const animation of shadow.getAnimations())animation.pause();}resolve(true);},{once:true});
            link.addEventListener('error',()=>resolve(false),{once:true});
        });
        shadow.append(link);document.body.append(host);return part;
    }
    function corner() {
        return svg('<g fill="none" stroke="currentColor" stroke-width=".8"><path d="M8 114V28Q8 8 28 8H114M17 96V33Q17 17 33 17H96M8 58C57 60 60 8 58 8M8 86C75 79 79 8 86 8"/><path d="M19 63Q30 58 27 45Q39 45 40 32Q55 37 62 19M19 81Q34 79 35 65Q51 68 54 51Q68 51 67 35Q80 34 81 19"/><path d="M22 38Q8 24 27 19Q43 17 43 33Q39 48 25 45Q16 43 22 31Q30 23 35 32Q39 39 29 39Q24 35 30 32" fill="#ffb3c130"/><path d="M40 45Q61 33 61 46Q51 58 40 45ZM25 47Q14 60 27 64Q37 57 25 47Z" fill="#c9184a20"/></g><g fill="#f4c76b"><circle cx="8" cy="98" r="1.8"/><circle cx="98" cy="8" r="1.8"/><circle cx="54" cy="51" r="1.5"/></g>', '0 0 120 120');
    }
    const runtime = {
        ensureCSS,
        implementedLayers: ['world-effect','interface','pet-realm','global-click','ultimate'],
        mount(options = {}) {
            this.clear(); ensureCSS();
            const pet = document.getElementById('virtual-pet-img'); if (!pet) return;
            this.pet = pet; this.quality = options.getLuxuryQualityCount || getLuxuryQualityCount;
            this.events = new AbortController(); this.tagged = new Map(); this.motion = matchMedia('(prefers-reduced-motion: reduce)');
            document.documentElement.classList.add('vlt-equipped');
            this.world = layer('vlt-world'); this.frame = layer('vlt-interface');
            appendMarkup(this.frame.shadow,  '<div class="vlt-edge">'+svg('<rect x="7" y="7" width="986" height="986" rx="24" fill="none" stroke="#ff4d6d" stroke-width="1" vector-effect="non-scaling-stroke"/>','0 0 1000 1000').replace('<svg ', '<svg preserveAspectRatio="none" ')+'</div>'+[0,1,2,3].map(i=>`<div class="vlt-corner vlt-corner-${i}">${corner()}</div>`).join(''));
            this.paintWorld(); this.paintRealm(); this.markInterface(); this.sync();
            const signal = this.events.signal;
            this.savedPet=Object.fromEntries(['title','role','tabindex'].map(k=>[k,pet.getAttribute(k)]));
            pet.classList.add('vlt-pet');pet.title='Cupid · Chạm mở Hồng Tuyến Vĩnh Kết';pet.setAttribute('role','button');pet.tabIndex=0;
            this.clicks=new Set();this.lastPoint=null;this.lastClick=-Infinity;
            document.addEventListener('pointerdown',e=>{if(e.button===0)this.clickAt(e.clientX,e.clientY);},{signal});
            pet.addEventListener('click',()=>{if(pet.parentElement?.dataset.petDragged!=='1')this.ultimate();},{signal});
            pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.ultimate();}},{signal});
            document.addEventListener('visibilitychange', () => this.sync(), {signal});
            this.motion.addEventListener('change', () => {this.paintWorld(); this.stopUltimate(); this.clearClicks(); this.sync();}, {signal});
            window.addEventListener('resize', () => {clearTimeout(this.resizeTimer);this.resizeTimer=setTimeout(()=>this.paintWorld(),180);}, {signal});
            this.observer = new MutationObserver(() => {
                if (!pet.isConnected) {this.clear();return;}
                this.sync();
                if (!this.markFrame) this.markFrame = requestAnimationFrame(() => {this.markFrame=0;this.markInterface();});
            });
            this.observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
        },
        paintWorld() {
            if (!this.world) return;
            const small = innerWidth < 650, quiet = reduced();
            const count = quiet ? 0 : Math.max(0, Math.min(64, this.quality(small ? 32 : 60, 4)));
            let html = '';
            for (let i=0;i<count;i++) {
                const near=i%3===0, heart=i%5===0, duration=(near?22:38)+Math.random()*16;
                html += `<div class="vlt-drift ${near?'vlt-near':'vlt-far'}" style="--x:${Math.random()*100}%;--duration:${duration}s;--delay:${-Math.random()*duration}s;--drift:${Math.random()*100-50}px;--size:${near?12+Math.random()*6:5+Math.random()*5}px;--turn:${Math.random()*100-50}deg"><span class="vlt-sway">${svg(`<path d="${heart?HEART:PETAL}" fill="${i%2?'#ffb3c1':'#ff4d6d'}"/><path d="M4 17Q8 8 16 5" fill="none" stroke="#fff0f3" stroke-width=".7" opacity=".7"/>`)}</span></div>`;
            }
            const lights=quiet?3:Math.min(12,this.quality(small?5:9,2));
            for(let i=0;i<lights;i++) html+=`<i class="vlt-bokeh" style="--x:${(i*31+11)%100}%;--y:${(i*23+17)%100}%;--delay:${-i*1.7}s;--size:${18+i%3*15}px"></i>`;
            if(!quiet) for(let i=0;i<2;i++) html+=`<div class="vlt-thread" style="--y:${27+i*39}%;--delay:${-i*13}s">${svg(`<path class="vlt-thread-line" d="M-30 85C170 -20 245 170 420 75S720 35 1030 80"/><path d="${HEART}" transform="translate(405 63) scale(.75)" fill="#ffb3c1"/><path d="${HEART}" transform="translate(707 43) scale(.5)" fill="#ff4d6d"/>`,'0 0 1000 180')}</div>`;
            // Embroidered threads at the edges, with tiny heart constellations, never a giant central heart.
            let embroidery='';
            for(let i=0;i<5;i++){const y=70+i*123;embroidery+=`<path class="vlt-embroidered-line" style="--delay:${-i*2.8}s" d="M-60 ${y}C140 ${y-80} 260 ${y+110} 420 ${y+25}S770 ${y-65} 1060 ${y+45}" fill="none" stroke="${i%2?'#f4c76b':'#ff4d6d'}" stroke-width=".65"/>`;}
            html+='<div class="vlt-embroidered-sky">'+svg(embroidery,'0 0 1000 700').replace('<svg ','<svg preserveAspectRatio="none" ')+'</div>';
            const ornaments=quiet?2:Math.min(8,this.quality(small?4:7,2));
            for(let i=0;i<ornaments;i++){
                const length=60+i%3*29;
                html+=`<div class="vlt-pendant" style="--x:${8+i*84/Math.max(1,ornaments-1)}%;--length:${length}px;--delay:${-i*2.3}s">${svg(`<path d="M20 0Q6 30 20 60T20 118" fill="none" stroke="#ff4d6d" stroke-width=".7"/><g fill="#f4c76b" opacity=".6"><circle cx="18" cy="37" r="1"/><circle cx="19" cy="86" r="1.2"/></g><path d="${HEART}" transform="translate(12 115) scale(.67)" fill="#ffb3c125" stroke="#ffb3c1" stroke-width=".9"/><path d="M8 115L20 102L31 115" fill="none" stroke="#f4c76b" stroke-width=".5"/>`,'0 0 40 142')}</div>`;
            }
            const stars=quiet?4:Math.min(24,this.quality(small?10:20,4));
            for(let i=0;i<stars;i++)html+=`<span class="vlt-thread-star" style="--x:${(i*37+3)%100}%;--y:${(i*29+14)%100}%;--delay:${-i*.8}s">${svg('<path d="M12 1Q12 12 23 12Q12 12 12 23Q12 12 1 12Q12 12 12 1Z" fill="#f4c76b"/>')}</span>`;
            for(let side=0;side<2;side++){
                let roses='';for(let j=0;j<3;j++){const x=35+j*65,y=120-j%2*35;roses+=`<g transform="translate(${x} ${y}) rotate(${j*22})"><path d="M0 0C-14 -19 10 -28 22 -9C35 11 9 28 -6 15C-26 -3 -7 -35 17 -24C44 -11 32 29 4 30C-24 35 -44 7 -27 -16" fill="#c9184a12" stroke="#ffb3c1" stroke-width=".7"/><path d="M0 0C9 -12 16 3 5 9C-6 13 -8 -8 4 -10M-8 28Q-36 14 -40 29Q-18 43 -8 28M19 25Q39 13 43 28Q30 39 19 25" fill="none" stroke="#f4c76b" stroke-width=".5"/></g>`;}
                html+=`<div class="vlt-rose-bank vlt-rose-bank-${side}">${svg('<path d="M-20 142C48 78 102 196 250 85" fill="none" stroke="#ff4d6d" stroke-width="1"/>'+roses,'0 0 250 190')}</div>`;
            }
            for(const node of [...this.world.shadow.childNodes])if(node!==this.world.link)node.remove();appendMarkup(this.world.shadow,html); this.world.host.dataset.particles=String(count);this.sync();
        },
        quiet() {return reduced()||document.hidden||window.isExamVisualItemsSuspended===true||Boolean(window.currentActiveExamId);},
        paintRealm() {
            for(const name of ['realm','realmFront']) {
                this[name]=layer(name==='realm'?'vlt-realm':'vlt-realm-front');
                this[name].host.style.cssText='position:absolute!important;inset:-17% -24% -13%!important;pointer-events:none!important;overflow:visible!important;z-index:'+(name==='realm'?1:3)+'!important;visibility:hidden!important';
                this.pet.parentElement.append(this[name].host);
            }
            let jewels='',petals='',glints='';
            for(let i=0;i<12;i++){
                const a=i*Math.PI/6,x=150+Math.cos(a)*124,y=205+Math.sin(a)*166;
                jewels+=`<g transform="translate(${x-8} ${y-8}) scale(.7)"><path d="${HEART}" fill="url(#vlt-gem)" stroke="#ffb3c1" stroke-width=".8"/><path d="M12 5L6 10L12 21L18 10ZM1 7L6 10L12 5L18 10L23 7" fill="none" stroke="#fff0f3" stroke-width=".65" opacity=".8"/></g>`;
                petals+=`<g class="vlt-orbit-petal" style="--delay:${-i*1.7}s;--duration:${19+i%4*3}s"><g transform="translate(${150+Math.cos(a)*135} ${205+Math.sin(a)*175}) rotate(${i*30}) scale(.45)"><path d="${PETAL}" fill="${i%2?'#ffb3c1':'#ff4d6d'}" opacity=".6"/><path d="M4 17Q7 8 17 4" stroke="#fff0f3" stroke-width=".7" fill="none"/></g></g>`;
                glints+=`<path class="vlt-glint" style="--delay:${-i*.8}s" d="M${x-4} ${y}H${x+4}M${x} ${y-6}V${y+6}" stroke="#f4c76b" stroke-width=".9"/>`;
            }
            appendMarkup(this.realm.shadow, `<div class="vlt-realm-glow"></div><div class="vlt-realm-art">`+svg(`<defs><linearGradient id="vlt-gem" x2="1" y2="1"><stop stop-color="#fff0f3"/><stop offset=".4" stop-color="#ffb3c180"/><stop offset=".7" stop-color="#c9184ab0"/><stop offset="1" stop-color="#f4c76b"/></linearGradient></defs><g fill="none"><ellipse cx="150" cy="205" rx="124" ry="166" stroke="#ffb3c13d"/><ellipse cx="150" cy="205" rx="116" ry="156" stroke="#f4c76b45"/><path class="vlt-realm-thread" d="M150 380C-60 260 50 28 150 72C245 10 330 290 150 380C65 330 234 243 150 186C52 100 245 83 253 170" stroke="#ff4d6d" stroke-width="1.1"/></g><g class="vlt-jewel-orbit">${jewels}</g>${petals}${glints}<g fill="none" stroke="#f4c76b" opacity=".45"><ellipse cx="150" cy="374" rx="99" ry="17"/><ellipse cx="150" cy="374" rx="85" ry="12"/><path d="M137 374Q115 350 106 362Q110 382 150 374Q195 353 196 368Q181 390 137 374"/></g>`, '0 0 300 410')+'</div>'); 
            appendMarkup(this.realmFront.shadow, '<div class="vlt-realm-art">'+svg('<path class="vlt-front-thread" d="M15 280C65 357 120 366 205 320S281 226 284 173" fill="none" stroke="#ff4d6d" stroke-width="1.1"/><path class="vlt-front-thread" d="M27 293C90 349 166 354 239 291" fill="none" stroke="#f4c76b" stroke-width=".65"/>'+glints, '0 0 300 410')+'</div>');
        },
        clearClicks() {for(const fx of this.clicks||[]){clearTimeout(fx.timer);fx.host.remove();}this.clicks?.clear();this.lastPoint=null;},
        clickAt(x,y) {
            if(!this.pet||this.quiet()||performance.now()-this.lastClick<140)return;
            this.lastClick=performance.now();
            if(this.clicks.size>=5){const first=this.clicks.values().next().value;clearTimeout(first.timer);first.host.remove();this.clicks.delete(first);}
            const fx=layer('vlt-click');fx.host.style.setProperty('z-index','10020','important');
            let html=`<div class="vlt-click-bloom" style="left:${x}px;top:${y}px">${svg(`<path d="${HEART}" fill="#ffb3c140" stroke="#ff4d6d" stroke-width=".8"/>`)}<i class="vlt-click-wave"></i><i class="vlt-click-wave vlt-wave-late"></i></div>`;
            const count=Math.max(6,Math.min(10,this.quality(10,6)));
            for(let i=0;i<count;i++){const a=-Math.PI+.2+(i/(count-1))*(Math.PI-.4),r=35+Math.random()*42;html+=`<div class="vlt-click-piece" style="left:${x}px;top:${y}px;--dx:${Math.cos(a)*r}px;--dy:${Math.sin(a)*r}px;--turn:${i*57}deg">${svg(`<path d="${i%3?PETAL:HEART}" fill="${i%2?'#ffb3c1':'#ff4d6d'}"/>`)}</div>`;}
            if(this.lastPoint&&performance.now()-this.lastPoint.time<4000){const p=this.lastPoint;html+=`<svg class="vlt-click-link" width="100%" height="100%"><path d="M${p.x} ${p.y}C${p.x} ${(p.y+y)*.5-45} ${x} ${(p.y+y)*.5+45} ${x} ${y}" pathLength="1" fill="none" stroke="#ff4d6d" stroke-width="1.2"/></svg>`;}
            appendMarkup(fx.shadow, html);this.lastPoint={x,y,time:performance.now()};this.clicks.add(fx);
            fx.timer=setTimeout(()=>{fx.host.remove();this.clicks.delete(fx);},1600);
        },
        stopUltimate() {
            cancelAnimationFrame(this.ultimateFrame);this.ultimateFrame=0;
            this.cinema?.host.remove();this.cinema=null;this.ultimateStarted=null;
        },
        ultimate() {
            if(!this.pet||this.quiet()||this.cinema||performance.now()<(this.ultimateReady||0))return false;
            this.ultimateReady=performance.now()+18000;this.ultimateStarted=performance.now();
            const film=this.cinema=layer('vlt-ultimate');film.host.style.setProperty('z-index','12000','important');
            const point=a=>({x:300+16*Math.sin(a)**3*13,y:268-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))*13});
            let paths='';const threadCount=Math.min(240,this.quality(innerWidth<650?120:220,40));
            for(let i=0;i<threadCount;i++){
                const a=i*Math.PI*2/threadCount,p=point(a),q=point(a+.055),bend=(i%9-4)*5;
                paths+=`<path class="vlt-love-filament" style="--delay:${1+(i%17)*.06}s" d="M300 314C${300+bend} ${220+bend} ${p.x} ${p.y+bend} ${p.x} ${p.y}Q${q.x} ${q.y} 300 314" fill="none" stroke="${i%7?'#ff4d6d':'#f4c76b'}" stroke-width="${i%7?.55:.75}" pathLength="1"/>`;
            }
            const outline=Array.from({length:121},(_,i)=>{const p=point(i*Math.PI*2/120);return (i?'L':'M')+p.x+' '+p.y;}).join('')+'Z';
            // Lace follows the heart contour; ornaments are built once, never in the frame loop.
            let lace='',roses='';const stitches=Math.min(96,this.quality(80,32));
            for(let i=0;i<stitches;i++){
                const a=i*Math.PI*2/stitches,p=point(a),q=point(a+Math.PI*2/stitches),mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
                lace+=`<path d="M${p.x} ${p.y}Q${300+(mx-300)*1.13} ${300+(my-300)*1.13} ${q.x} ${q.y}"/><circle cx="${p.x}" cy="${p.y}" r="${i%4?1:2}" fill="#f4c76b" stroke="none"/>`;
            }
            for(let i=0;i<6;i++){
                const p=point((i+.5)*Math.PI/3);
                roses+=`<g class="vlt-vow-rose" transform="translate(${300+(p.x-300)*1.1} ${300+(p.y-300)*1.1})"><path d="M0 5C-16 7-20-5-9-12C-6-23 10-22 12-11C24-4 17 11 6 10C-7 19-17 5-8-3C-2-13 12-7 7 1C3 7-6 3-2-2" fill="#590d22" stroke="#ffb3c1" stroke-width="1.2"/><path d="M-13 6Q-33 2-26 19Q-17 19-13 6M13 9Q34 4 27 23Q17 22 13 9" fill="#f4c76b22" stroke="#f4c76b" stroke-width=".7"/></g>`;
            }
            const orbit=Array.from({length:3},(_,i)=>`<g class="vlt-vow-orbit" style="--turn:${i*60}deg;--duration:${14+i*4}s"><ellipse cx="300" cy="300" rx="272" ry="${100+i*20}" fill="none" stroke="${i===1?'#f4c76b':'#ffb3c1'}" stroke-width=".65" stroke-dasharray="210 12 3 12"/><circle cx="572" cy="300" r="2.5" fill="#f4c76b"/></g>`).join('');
            appendMarkup(film.shadow, `<div class="vlt-wine-veil"></div><div class="vlt-vow-stage">${svg(`<g class="vlt-vow-ornaments">${orbit}</g><path class="vlt-opening-thread" d="M-50 335Q170 255 300 314T660 282" fill="none" stroke="#ffb3c1" stroke-width="1.5" pathLength="1"/><g class="vlt-giant-heart">${paths}<path class="vlt-heart-outline" d="${outline}" fill="#c9184a0a" stroke="#ffb3c1" stroke-width="1.3" pathLength="1"/><g class="vlt-vow-lace" fill="none" stroke="#f4c76b" stroke-width=".6">${lace}${roses}</g></g>`,'0 0 600 600')}<div class="vlt-vow"><span class="vlt-vow-kicker">CUPID · HỒNG TUYẾN ĐỊNH MỆNH</span><h2>HỒNG TUYẾN<br>VĨNH KẾT</h2><span class="vlt-vow-divider">✧</span><p>Một sợi chỉ hồng · Vạn duyên giao hội</p></div></div>`);
            const canvas=document.createElement('canvas');canvas.className='vlt-cinema-petals';film.shadow.append(canvas);
            const ctx=canvas.getContext('2d'),dpr=Math.min(devicePixelRatio||1,1.5);let w=innerWidth,h=innerHeight;
            const resize=()=>{w=innerWidth;h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);};resize();
            const count=Math.min(1400,this.quality(innerWidth<650?650:1200,100));
            const particles=Array.from({length:count},(_,i)=>{const a=Math.random()*Math.PI*2,p=point(a);return {hx:(p.x-300)/600,hy:(p.y-300)/600,a,drift:(Math.random()-.5)*130,up:70+Math.random()*200,rot:Math.random()*6,size:1.5+Math.random()*4,depth:Math.random(),phase:i%3};});
            const petal=new Path2D(PETAL),heart=new Path2D(HEART);this.ultimateParticles=count;
            const draw=now=>{
                if(this.cinema!==film)return;const t=(now-this.ultimateStarted)/1000;
                if(t>=8||this.quiet()){this.stopUltimate();return;}
                if(w!==innerWidth||h!==innerHeight)resize();ctx.clearRect(0,0,w,h);
                const size=Math.min(w*.94,h*.84,680),cx=w*.5,cy=h*.5;
                film.host.dataset.phase=t<1?'thread':t<3?'weave':t<5?'heartbeat':t<6.5?'vow':'petals';
                if(t>1&&t<6.5){const glints=Math.min(72,Math.floor(count/10));for(let i=0;i<glints;i++){
                    const p=particles[i],a=p.a+t*(.12+p.depth*.16),r=size*(.38+p.depth*.13),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.82;
                    ctx.globalAlpha=Math.min(1,t-1)*(Math.sin(t*2+p.rot)*.2+.3);ctx.strokeStyle=i%3?'#ffb3c1':'#f4c76b';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-2-p.depth*2,y);ctx.lineTo(x+2+p.depth*2,y);ctx.moveTo(x,y-2-p.depth*2);ctx.lineTo(x,y+2+p.depth*2);ctx.stroke();
                }}
                if(t>=3&&t<5.8){for(let beat=0;beat<3;beat++){const age=t-(3+beat*.66);if(age<0||age>1.4)continue;ctx.globalAlpha=(1-age/1.4)*(.22+beat*.08);ctx.strokeStyle='#ffb3c1';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(cx,cy,size*(.2+age*.37),size*(.18+age*.32),0,0,Math.PI*2);ctx.stroke();}}
                if(t>=3){for(let i=0;i<count;i++){
                    const p=particles[i],burst=t>=6.5,age=burst?t-6.5:t-(3+p.phase*.66);
                    if(age<0||(!burst&&(i>count*.22||age>2)))continue;
                    const scale=1+age*(burst?.12:.27),x=cx+p.hx*size*scale+p.drift*age,y=cy+p.hy*size*scale+(burst?-p.up*age:Math.sin(p.a)*age*100+age*age*24);
                    ctx.save();ctx.translate(x,y);ctx.rotate(p.rot+age*(p.depth-.5)*3);ctx.scale(p.size/24,p.size/24*(.55+.45*Math.abs(Math.sin(age+p.rot))));ctx.globalAlpha=(burst?Math.min(1,(8-t)/.55):Math.max(0,1-age/2))*(.35+p.depth*.6);ctx.fillStyle=i%9===0?'#f4c76b':i%2?'#ffb3c1':'#ff4d6d';ctx.fill(i%11?petal:heart);ctx.restore();
                }}
                ctx.globalAlpha=1;this.ultimateFrame=requestAnimationFrame(draw);
            };
            film.ready.then(ok=>{if(this.cinema!==film)return;if(!ok){this.stopUltimate();return;}this.ultimateStarted=performance.now();this.ultimateFrame=requestAnimationFrame(draw);});return true;
        },

        markInterface() {
            const groups = [
                ['.modal-content,.form-container,.assignment-card,.dashboard-card,.stat-card,.settings-card,.homework-card,.accordion-header','vlt-panel'],
                ['.sidebar','vlt-sidebar'],['h1,h2,h3,h4,p,label,td,th','vlt-copy'],
                ['input,textarea,select','vlt-field'],['button,.btn','vlt-button']
            ];
            for(const [selector,name] of groups) for(const el of document.querySelectorAll(selector)) {
                if(el.closest('.ui-theme-immune,.store-theme-locked,[data-theme-immune="true"],#virtual-pet-container,.vlt-world,.vlt-interface')) continue;
                if(!el.classList.contains(name)){el.classList.add(name);let classes=this.tagged.get(el);if(!classes)this.tagged.set(el,classes=[]);classes.push(name);}
            }
            for(const el of this.tagged.keys()) if(!el.isConnected)this.tagged.delete(el);
        },
        sync() {
            const paused=document.hidden||window.isExamVisualItemsSuspended===true||Boolean(window.currentActiveExamId);
            if(paused){this.stopUltimate();this.clearClicks();}
            for(const part of [this.world,this.frame,this.realm,this.realmFront]) if(part){part.host.style.setProperty('visibility',paused||!part.styled?'hidden':'visible','important');for(const anim of part.shadow.getAnimations?.()||[])paused?anim.pause():anim.play();}
            document.documentElement.classList.toggle('vlt-paused',paused);
        },
        clear() {
            this.stopUltimate();this.clearClicks();this.realm?.host.remove();this.realmFront?.host.remove();this.realm=this.realmFront=null;
            if(this.pet){this.pet.classList.remove('vlt-pet');for(const[k,v]of Object.entries(this.savedPet||{}))v===null?this.pet.removeAttribute(k):this.pet.setAttribute(k,v);}
            this.events?.abort();this.observer?.disconnect();clearTimeout(this.resizeTimer);cancelAnimationFrame(this.markFrame);this.markFrame=0;
            for(const [el,names] of this.tagged||[])for(const name of names)el.classList.remove(name);
            this.tagged?.clear();this.world?.host.remove();this.frame?.host.remove();this.world=this.frame=this.pet=null;
            document.documentElement.classList.remove('vlt-equipped','vlt-paused');
        }
    };
    window.ValentinePremiumRuntime=runtime;
})();
/* Juliet · Verona theatre. Original stained-glass architecture; independent regular stationery/butterfly suite. */
(() => {
 'use strict';
 const CSS='css/valentine.css?v=20261015.regular-fix1';
 const svg=(art,box='0 0 600 800')=>`<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" aria-hidden="true">${art}</svg>`;
 const many=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const paused=()=>document.hidden||!!window.currentActiveExamId||window.isExamVisualItemsSuspended===true||document.body.classList.contains('exam-active')||document.body.classList.contains('wfx-paused');
 const quiet=()=>reduced()||document.body.classList.contains('wfx-low-power');
 const count=n=>Math.max(3,Math.min(n,window.EffectQualityManager?.getRecommendedCount?.(n)??n));
 function ensureCSS(){if(document.getElementById('juliet-css'))return;const l=document.createElement('link');l.id='juliet-css';l.rel='stylesheet';l.href=CSS;document.head.append(l);}
 function host(cls,art,parent=document.body){
  const e=document.createElement('div');e.className=cls;e.setAttribute('aria-hidden','true');e.style.setProperty('pointer-events','none','important');
  e.attachShadow({mode:'open'}).innerHTML=`<link rel="stylesheet" href="${CSS}"><div class="jlt-root" style="visibility:hidden">${art}</div>`;
  const root=e.shadowRoot.querySelector('.jlt-root'),css=e.shadowRoot.querySelector('link');
  const reveal=()=>{if(e.isConnected)root.style.removeProperty('visibility');};
  css.addEventListener('load',reveal,{once:true});parent.append(e);if(css.sheet)reveal();return e;
 }
 // Radial lancet tracery, cut glass, carved stone; no borrowed Cupid geometry.
 function rosette(){return svg(`<circle cx="150" cy="150" r="138"/><circle cx="150" cy="150" r="123"/>${many(12,i=>`<g transform="rotate(${i*30} 150 150)"><path d="M150 25Q183 78 150 126Q117 78 150 25Z" fill="${i%2?'#9e416a55':'#d5b57755'}"/><path d="M150 34V108M139 66H161"/><path d="M150 4 156 14 150 24 144 14Z" fill="#f3d8a2"/></g>`)}<circle cx="150" cy="150" r="23"/><path d="M150 128 172 150 150 172 128 150Z" fill="#eacb8c66"/>`,'0 0 300 300');}
 function arch(){return svg(`<path class="jlt-glass" d="M50 790V270Q50 150 300 28Q550 150 550 270V790Z"/><path d="M25 790V265Q25 130 300 4Q575 130 575 265V790M50 790V270Q50 150 300 28Q550 150 550 270V790M80 790V280Q80 180 300 62Q520 180 520 280V790M300 62V790M80 345H520M80 540H520M190 190V790M410 190V790"/>${many(5,i=>`<path d="M80 ${390+i*75} 190 ${345+i*75} 300 ${390+i*75} 410 ${345+i*75} 520 ${390+i*75}"/>`)}${many(8,i=>`<path d="M${50+i*70} 760v-50q35-60 70 0v50"/>`)}<path d="M25 765H575V790H25Z" fill="#ac805333"/>`);}
 function quill(){return svg('<path d="M20 160Q112 11 150 8Q168 55 38 148L20 160ZM48 130 149 10M72 101 106 98M91 75 124 71M111 49 136 43M58 118 53 91M77 89 77 64M99 61 102 37"/>','0 0 170 170');}
 function butterfly(i){return `<span class="jlr-butterfly" style="--i:${i};--x:${(i*37+8)%96}%;--y:${(i*29+12)%90}%;--d:${10+i%5*2}s"><b></b><b></b><em></em></span>`;}
 // Carved Verona roses: layered pointed petals, engraved leaves and pearl centres.
 function veronaRose(){return `<g>${many(8,i=>`<path transform="rotate(${i*45})" d="M0-5C-32-18-29-47 0-55C29-47 32-18 0-5Z" fill="${i%2?'#9b3c62':'#c66e84'}" stroke="#efbc99"/>`)}${many(6,i=>`<path transform="rotate(${i*60+15})" d="M0-3C-17-8-21-28 0-35C21-28 17-8 0-3Z" fill="${i%2?'#e9a4ac':'#b85973'}" stroke="#f8d5b2"/>`)}<path d="M-9 5C-25-11 1-28 13-13C26 3 5 22-8 9C-18-3-1-12 6-4C12 5 0 11-3 4" stroke="#ffe5b8" fill="#914258"/><circle r="3" fill="#ffe9bc"/></g>`;}
 function gardenCorner(){return svg(`<path d="M5 270V72Q5 5 72 5H270M15 270V78Q15 15 78 15H270M24 245V86Q24 24 86 24H245" stroke="#d6ac70"/><path d="M27 243C80 174 12 91 115 53S214 73 251 25M31 226C129 200 78 103 159 78M45 155C-5 71 93 26 168 37" stroke="#b28b61"/>${many(8,i=>`<g transform="translate(${36+i*25} ${180-i*20}) rotate(${-75+i*14})"><path d="M0 0C-33-4-31-25-41-36C-17-34 2-20 0 0Z" fill="${i%2?'#66887b':'#9bad8a'}" stroke="#d5c49a"/><path d="M0 0-35-30M-10-10-25-8M-20-18-24-29" stroke="#e5d6a9"/><path d="M1-2C5-33 31-35 38-45C42-17 24 0 1-2Z" fill="#798c7c" stroke="#e6d2a5"/></g>`)}<g transform="translate(64 64) scale(.85)">${veronaRose()}</g><g transform="translate(133 41) scale(.5) rotate(20)">${veronaRose()}</g><g transform="translate(42 137) scale(.48) rotate(-25)">${veronaRose()}</g>${many(11,i=>`<circle cx="${36+i*17}" cy="${44+(i%3)*14}" r="${i%3===0?2.8:1.5}" fill="#ffe7ba"/>`)}<path d="M9 170Q92 93 136 111Q91 131 103 173Q60 130 9 170Z" fill="#b9657855" stroke="#deb58a"/>`,'0 0 280 280');}
 function pendant(i){return `<div class="jlt-pendant" style="--i:${i};--length:${74+(i%3)*28}px"><div class="jlt-pendant-chain"></div>${svg('<path d="M20 1 36 25 20 58 4 25Z" fill="#b05a7866" stroke="#f6d7a2"/><path d="M20 1V58M4 25H36M20 1 12 25 20 58 28 25Z" stroke="#f3c997"/><circle cx="20" cy="25" r="4" fill="#fff2cb"/>','0 0 40 60')}<i></i></div>`;}
 function worldArt(){return `<div class="jlt-atmosphere"></div><div class="jlt-arch left">${arch()}</div><div class="jlt-arch right">${arch()}</div><div class="jlt-rose-window">${rosette()}</div><div class="jlt-canopy">${svg('<path d="M0 10Q150 84 300 10Q450 84 600 10M0 17Q150 91 300 17Q450 91 600 17M0 31Q150 106 300 31Q450 106 600 31" stroke="#d5aa73"/>'+many(19,i=>`<path d="M${i*33} 16v${18+(i%3)*9}m-3-3 3 5 3-5" stroke="#d9b889"/><circle cx="${i*33}" cy="${40+(i%3)*9}" r="2" fill="#ffe4ac"/>`),'0 0 600 100')}</div><div class="jlt-pendants">${many(7,pendant)}</div><div class="jlt-lights">${many(5,i=>`<i style="--i:${i}"></i>`)}</div><div class="jlt-chandelier">${svg('<path d="M300 0V80M170 0V46M430 0V46M170 46Q300 160 430 46M210 72V110M390 72V110M260 95V139M340 95V139M294 80 300 65 306 80 300 96ZM164 46 170 32 176 46 170 61ZM424 46 430 32 436 46 430 61Z"/>','0 0 600 160')}</div>${many(4,i=>`<div class="jlt-garden-corner jlt-garden-${i}">${gardenCorner()}</div>`)}<div class="jlt-balcony">${svg('<path d="M0 20H1200M0 28H1200M0 88H1200M0 94H1200"/>'+many(24,i=>`<g transform="translate(${i*50} 0)"><path d="M25 28V88M25 32C-5 36-5 69 25 77C55 69 55 36 25 32ZM25 48 32 57 25 66 18 57Z"/><circle cx="25" cy="20" r="4" fill="#d7b47e"/></g>`),'0 0 1200 100')}</div>${many(count(innerWidth<650?8:16),i=>`<div class="jlt-floating-petal" style="--i:${i};--x:${i%2===0?2+(i*7)%20:78+(i*7)%20}%;--d:${14+i%5*3}s;--delay:${-i*2.3}s"><i></i></div>`)}${many(count(innerWidth<650?12:24),i=>`<i class="jlt-prism" style="--x:${(i*41+3)%100}%;--y:${(i*31+9)%100}%;--i:${i}"></i>`)}<div class="jlt-velvet-edge"></div>`;}
 function auraArt(){return `<div class="jlt-aura-window">${arch()}</div><div class="jlt-aura-rosette">${rosette()}</div><div class="jlt-aura-quill left">${quill()}</div><div class="jlt-aura-quill right">${quill()}</div><div class="jlt-pedestal"><i></i><i></i><i></i></div>${many(7,i=>`<i class="jlt-jewel" style="--i:${i}"></i>`)}`;}
 function ultimateArt(){return `<div class="jlt-stage-night"></div><div class="jlt-stage-rays">${many(10,i=>`<i style="--i:${i}"></i>`)}</div><div class="jlt-curtain left"></div><div class="jlt-curtain right"></div><div class="jlt-stage-columns">${many(4,i=>`<div style="--i:${i}">${arch()}</div>`)}</div><div class="jlt-stage-rosette">${rosette()}</div><div class="jlt-stage-floor">${svg(many(16,i=>`<path d="M600 0 ${i*90-100} 350"/>`)+many(7,i=>`<path d="M0 ${i*i*8}H1200"/>`),'0 0 1200 350')}</div><div class="jlt-score">${svg(many(7,i=>`<path d="M0 ${80+i*22}Q350 ${i*22} 600 ${80+i*22}T1200 ${80+i*22}"/>`),'0 0 1200 300')}</div><div class="jlt-oath-book"><div></div><div></div><i>${quill()}</i></div><div class="jlt-title"><small>JULIET · THÀNH VERONA</small><strong>LỜI THỀ<br>BẤT DIỆT</strong><span>Một lời hẹn, vượt qua ngàn mùa hoa.</span></div><div class="jlt-crown">${svg('<path d="M15 90 0 20 60 55 100 0 140 55 200 20 185 90ZM15 90H185V108H15ZM40 83 45 70 50 83M150 83 155 70 160 83M92 78 100 60 108 78"/>','0 0 200 110')}</div>${many(count(36),i=>`<i class="jlt-stage-glint" style="--i:${i};--x:${(i*43+4)%100}%;--y:${(i*37+8)%100}%"></i>`)}<div class="jlt-stage-vignette"></div>`;}
 let pet=null,mode='',world=null,aura=null,events=null,observer=null,ready=0,lastClick=-1000,markFrame=0;
 let saved={},tagged=new Map(),transients=new Set(),timers=new Set();
 function removeTransient(e){e?.remove();transients.delete(e);}
 function transient(cls,art,ms){const e=host(cls,art);transients.add(e);const timer=setTimeout(()=>{removeTransient(e);timers.delete(timer);},ms);timers.add(timer);return e;}
 function clearTransient(){transients.forEach(e=>e.remove());transients.clear();timers.forEach(clearTimeout);timers.clear();}
 const immune='.ui-theme-immune,.store-theme-locked,[data-theme-immune="true"],.luxury-product-card,.store-item-card';
 function markInterface(){
  if(mode!=='premium')return;
  for(const [selector,cls] of [
   ['.sidebar,.sidebar-header,.sidebar-nav','jlt-navigation'],
   ['.modal-content,.popup-content,.assignment-card,.stat-card,.dashboard-card,.card,.content-section','jlt-surface'],
   ['h1,h2,h3,.modal-title,.section-title','jlt-heading'],
   ['button,.btn,.nav-item','jlt-control'],
   ['input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),select,textarea','jlt-field']]){
   document.querySelectorAll(selector).forEach(el=>{if(el.closest(immune)||el.closest('#virtual-pet-container'))return;if(!el.classList.contains(cls)){el.classList.add(cls);if(!tagged.has(el))tagged.set(el,new Set());tagged.get(el).add(cls);}});
  }
 }
 function sync(){
  if(!pet?.isConnected){clearPet();return;}
  const hidden=paused()||pet.parentElement?.hidden||pet.parentElement?.style.display==='none';
  for(const h of [world,aura])if(h){if(h.hidden!==hidden)h.hidden=hidden;h.shadowRoot.querySelector('.jlt-root')?.classList.toggle('jlt-still',quiet());}
  document.documentElement.classList.toggle('jlt-suspended',hidden);
  if(hidden||quiet())clearTransient();
 }
 function clickAt(x,y){
  if(mode!=='premium'||paused()||quiet()||!pet?.isConnected||performance.now()-lastClick<160)return false;
  lastClick=performance.now();
  const e=transient('jlt-click',`<div class="jlt-click-seal">${rosette()}</div>${many(6,i=>`<i class="jlt-click-chip" style="--i:${i}"></i>`)}`,1250);
  e.style.left=x+'px';e.style.top=y+'px';return true;
 }
 function ultimate(){
  if(!pet||paused()||quiet()||performance.now()<ready||pet.parentElement?.dataset.petDragged==='1')return false;
  ready=performance.now()+(mode==='premium'?16000:6500);
  if(mode==='premium'){
   const e=transient('jlt-ultimate',ultimateArt(),8200);e.dataset.phase='curtain';
   for(const [ms,phase]of [[1300,'glass'],[3000,'book'],[4400,'oath'],[6900,'farewell']]){const t=setTimeout(()=>{if(e.isConnected)e.dataset.phase=phase;timers.delete(t);},ms);timers.add(t);}
  }else{
   transient('jlr-ultimate',`<div class="jlr-music-box"><div class="jlr-lid"></div><div class="jlr-box-base"></div><div class="jlr-dancer">${butterfly(0)}</div><strong>KHÚC NHẠC HẸN ƯỚC</strong></div>${many(7,i=>`<span class="jlr-note" style="--i:${i}">${i%2?'♪':'♫'}</span>`)}`,3500);
  }return true;
 }
 function clearPet(){
  events?.abort();observer?.disconnect();cancelAnimationFrame(markFrame);markFrame=0;clearTransient();world?.remove();aura?.remove();
  for(const [el,classes]of tagged)classes.forEach(c=>el.classList.remove(c));tagged.clear();
  document.documentElement.classList.remove('jlt-equipped','jlt-suspended');
  if(pet){pet.classList.remove('jlt-character','jlr-character');for(const [k,v]of Object.entries(saved))v===null?pet.removeAttribute(k):pet.setAttribute(k,v);}
  pet=world=aura=events=observer=null;mode='';saved={};ready=0;lastClick=-1000;
 }
 function mountPet(premium){
  clearPet();ensureCSS();pet=document.getElementById('virtual-pet-img');if(!pet)return;mode=premium?'premium':'regular';
  saved=Object.fromEntries(['title','role','tabindex'].map(k=>[k,pet.getAttribute(k)]));pet.classList.add(premium?'jlt-character':'jlr-character');
  pet.title=premium?'Juliet · Chạm mở Lời Thề Bất Diệt':'Juliet · Chạm mở Khúc Nhạc Hẹn Ước';pet.setAttribute('role','button');pet.tabIndex=0;
  events=new AbortController();const opt={signal:events.signal};
  aura=host(premium?'jlt-aura':'jlr-aura',premium?auraArt():`<div class="jlr-doily"></div><div class="jlr-ribbon"></div>${many(4,butterfly)}`,pet.parentElement);
  if(premium){document.documentElement.classList.add('jlt-equipped');world=host('jlt-world',worldArt());markInterface();document.addEventListener('pointerdown',e=>{if(e.button===0&&!pet?.contains(e.target))clickAt(e.clientX,e.clientY);},opt);}
  pet.addEventListener('click',ultimate,opt);pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ultimate();}},opt);
  document.addEventListener('visibilitychange',sync,opt);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',sync,opt);
  observer=new MutationObserver(()=>{sync();if(mode==='premium'&&!markFrame)markFrame=requestAnimationFrame(()=>{markFrame=0;markInterface();});});
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});sync();
 }
 let effect=null,effectEvents=null,effectObserver=null;
 function clearEffect(){effectEvents?.abort();effectObserver?.disconnect();effect?.remove();effect=effectEvents=effectObserver=null;}
 function mountEffect(){
  clearEffect();ensureCSS();const parent=document.getElementById('global-effect-container');if(!parent)return;
  effect=host('jlr-weather',`<div class="jlr-paper-light"></div>${many(count(18),butterfly)}<div class="jlr-pressed-flowers">${many(5,i=>`<i style="--i:${i}">✼</i>`)}</div>`,parent);
  const update=()=>{if(effect){effect.hidden=paused();effect.shadowRoot.querySelector('.jlt-root').classList.toggle('jlt-still',quiet());}};
  effectEvents=new AbortController();document.addEventListener('visibilitychange',update,{signal:effectEvents.signal});matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,{signal:effectEvents.signal});
  effectObserver=new MutationObserver(update);effectObserver.observe(document.body,{attributes:true,attributeFilter:['class']});update();
 }
 window.JulietRuntime={isPremiumActive:()=>mode==='premium',ensureCSS,mountPremium:()=>mountPet(true),mountRegularPet:()=>mountPet(false),clearPet,mountEffect,clearEffect,ultimate,clickAt,implementedLayers:['world-effect','interface','pet-realm','global-click','ultimate']};
})();
