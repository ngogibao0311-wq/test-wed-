/* Valentine, five-layer premium runtime. No asset/account writes. */
(() => {
    'use strict';
    if (window.ValentinePremiumRuntime) return;
    const CSS = 'css/valentine.css?v=20261010.vlt4';
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
