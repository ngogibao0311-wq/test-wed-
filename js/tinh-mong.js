/* Đêm đầy sao · Tinh Mộng. Two original compositions, isolated from other sets. */
(() => {
    'use strict';
    const css='css/dem-day-sao.css?v=20261009.shared-starry-tag1';
    const repeat=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
    const svg=(body,box='0 0 400 400')=>`<svg viewBox="${box}" fill="none" stroke="currentColor" stroke-width="1.2">${body}</svg>`;
    const jewel='<path d="M0-13 4-4 13 0 4 4 0 13-4 4-13 0-4-4Z" fill="currentColor" fill-opacity=".55"/>';
    // Premium: a celestial loom, woven sky, articulated shuttle and illuminated codices.
    const shuttle=svg('<path d="M200 20Q310 200 200 380Q90 200 200 20Z" fill="#b89459" fill-opacity=".2"/><path d="M200 45Q265 200 200 355Q135 200 200 45Z"/><path d="M200 60V340M164 145H236M158 166H242M155 190H245M157 214H243M164 238H236"/><ellipse cx="200" cy="200" rx="28" ry="67"/><path d="M180 162 220 178 180 195 220 212 180 229" stroke="#f5d99b"/>');
    const codex=svg('<path d="M200 90Q125 38 35 65L20 290Q105 268 200 325Q295 268 380 290L365 65Q275 38 200 90Z" fill="#132347" fill-opacity=".8"/><path d="M200 90V325M28 307Q107 284 200 340Q293 284 372 307M43 82Q125 67 188 102V300Q112 257 35 277ZM212 102Q275 67 357 82L365 277Q288 257 212 300Z"/>'+repeat(7,i=>`<path d="M${50-i*1.2} ${116+i*21}Q115 ${104+i*21} 173 ${133+i*21}M227 ${133+i*21}Q285 ${104+i*21} ${350+i*1.2} ${116+i*21}" opacity="${.25+i*.05}"/>`)+'<g transform="translate(200 70)">'+jewel+'</g>');
    const lace=svg(repeat(8,i=>`<g transform="translate(45 ${25+i*80})"><path d="M0-30V42M-28 0Q0-48 28 0Q0 48-28 0ZM-18 0Q0-24 18 0Q0 24-18 0"/><path d="M-28 0Q-53-23-36-32M28 0Q53-23 36-32"/><circle r="4" fill="currentColor"/></g>`),'0 0 90 650');
    const map=svg(repeat(13,i=>`<path d="M0 ${35+i*27}C100 ${-40+i*30} 280 ${170+i*8} 400 ${20+i*28}" opacity=".3"/>`)+repeat(26,i=>`<g transform="translate(${20+(i*113)%360} ${15+(i*71)%370}) scale(${i%4===0?.8:.3})">${jewel}</g>`));
    const threads=svg(repeat(22,i=>`<path d="M${i*60-40} 0C${450-i*12} 190 ${850-i*13} 380 ${i*60-20} 750" opacity="${.14+(i%4)*.06}"/>`)+repeat(20,i=>`<path d="M0 ${i*41}Q600 ${i*25-70} 1200 ${i*41}" opacity=".14"/>`),'0 0 1200 750');
    const stars=(n)=>repeat(n,i=>`<i class="tmp-star" style="--x:${(i*47+7)%100}%;--y:${(i*31+3)%100}%;--d:${-i*.7}s;--s:${i%4===0?6:3}px"></i>`);
    const hanging=repeat(7,i=>`<span style="--i:${i}"><em></em>${svg('<g transform="translate(200 200) scale(7)">'+jewel+'</g>')}<b>✧</b></span>`);
    const premiumWorld=()=>`<div class="tmp-world"><div class="tmp-velvet"></div><div class="tmp-weave">${threads}</div><div class="tmp-atlas tmp-atlas-left">${map}</div><div class="tmp-atlas tmp-atlas-right">${map}</div><div class="tmp-lace left">${lace}</div><div class="tmp-lace right">${lace}</div><div class="tmp-pendants">${hanging}</div><div class="tmp-river"></div><div class="tmp-folio">${repeat(4,i=>`<span style="--i:${i}">${codex}</span>`)}</div>${stars(32)}</div>`;
    const premiumAura=()=>`<div class="tmp-aura-art"><div class="tmp-aura-weave">${threads}</div><div class="tmp-aura-book">${codex}</div><div class="tmp-aura-shuttle">${shuttle}</div><div class="tmp-aura-lace left">${lace}</div><div class="tmp-aura-lace right">${lace}</div>${stars(12)}</div>`;
    // Regular: folded paper stars, bookmarks and a little pop-up storybook. No premium art reused.
    const paper=svg('<path d="M200 30 238 142 358 147 264 218 295 338 200 269 105 338 136 218 42 147 162 142Z" fill="#c6bef7"/><path d="M200 30V207L358 147 238 142ZM200 207 295 338 264 218ZM200 207 105 338 200 269ZM200 207 42 147 136 218Z" fill="#7775bb"/><path d="M200 30V207L105 338M42 147 200 207 358 147M295 338 200 207" stroke="#fff1bd"/>');
    const bookmark=svg('<path d="M105 20H295V370L200 302 105 370Z" fill="#3c4374"/><path d="M120 35H280V338L200 282 120 338Z" stroke-dasharray="4 6"/><path d="M163 98Q215 65 235 118Q208 110 213 155Q169 154 163 98Z" fill="#f3d99a"/><path d="M148 215H252M148 235H235M148 255H245"/>');
    const paperBook=svg('<path d="M200 150Q106 105 18 135V310Q116 280 200 330Q284 280 382 310V135Q294 105 200 150Z" fill="#fff1cd" stroke="#8475a7"/><path d="M200 150V330M36 156Q119 130 181 168M36 183Q119 157 181 195M219 168Q281 130 364 156M219 195Q281 157 364 183" stroke="#b6a4c8"/><path d="M200 270 137 126 200 60 263 126Z" fill="#8b8dc7"/><path d="M200 60V270M137 126 200 150 263 126" stroke="#f2dfad"/>');
    const regularWorld=()=>`<div class="tmr-world">${repeat(10,i=>`<span class="tmr-paper" style="--i:${i};--x:${(i*31+3)%100}%;--d:${-i*1.9}s">${paper}</span>`)}<div class="tmr-bookmark left">${bookmark}</div><div class="tmr-bookmark right">${bookmark}</div><div class="tmr-handline">${svg('<path d="M0 220Q100 40 210 220T400 220M0 240Q100 60 210 240T400 240"/>')}</div></div>`;
    const regularAura=()=>`<div class="tmr-aura-art"><div class="tmr-mini-book">${paperBook}</div>${repeat(5,i=>`<span style="--i:${i}">${paper}</span>`)}</div>`;
    if(!document.getElementById('tinh-mong-css')){const l=document.createElement('link');l.id='tinh-mong-css';l.rel='stylesheet';l.href=css;document.head.appendChild(l);}
    function runtime(premium){
        const prefix=premium?'tmp':'tmr';
        return {
            timers:new Set(),
            later(fn,ms){const id=setTimeout(()=>{this.timers.delete(id);fn();},ms);this.timers.add(id);},
            quiet(){return document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('wfx-low-power')||window.isExamVisualItemsSuspended===true||Boolean(window.currentActiveExamId);},
            clear(){
                this.events?.abort();this.observer?.disconnect();this.timers.forEach(clearTimeout);this.timers.clear();
                this.host?.remove();this.aura?.remove();this.cinema?.remove();
                if(this.pet){this.pet.classList.remove(prefix+'-pet');for(const [k,v]of Object.entries(this.saved||{}))v===null?this.pet.removeAttribute(k):this.pet.setAttribute(k,v);}
                if(premium)document.documentElement.classList.remove('tmp-equipped');
                this.pet=this.host=this.aura=this.shadow=this.cinema=null;
            },
            mount(){this.sync({pet:true,effect:true});},
            sync(items={}){
                this.clear();if(!items.pet&&!items.effect)return;
                this.events=new AbortController();const opts={signal:this.events.signal};
                const host=this.host=document.createElement('div');host.id=prefix+'-world-host';host.setAttribute('aria-hidden','true');
                host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:950!important;overflow:hidden!important';
                const shadow=this.shadow=host.attachShadow({mode:'open'});shadow.innerHTML=`<link rel="stylesheet" href="${css}">`+(items.effect?(premium?premiumWorld():regularWorld()):'');
                if(premium)document.documentElement.classList.add('tmp-equipped');document.body.appendChild(host);
                if(items.pet){
                    this.pet=document.getElementById('virtual-pet-img');
                    if(this.pet){
                        this.saved=Object.fromEntries(['role','tabindex','title'].map(k=>[k,this.pet.getAttribute(k)]));
                        this.pet.classList.add(prefix+'-pet');this.pet.setAttribute('role','button');this.pet.tabIndex=0;
                        this.pet.title=premium?'Tinh Mộng · Chạm mở Thiên Thư Dệt Sao':'Tinh Mộng · Chạm mở Sách Sao Bừng Nở';
                        this.aura=document.createElement('div');this.aura.className=prefix+'-aura';this.aura.setAttribute('aria-hidden','true');
                        this.aura.attachShadow({mode:'open'}).innerHTML=`<link rel="stylesheet" href="${css}">`+(premium?premiumAura():regularAura());this.pet.parentElement.appendChild(this.aura);
                        this.pet.addEventListener('click',()=>this.ultimate(),opts);
                        this.pet.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();this.ultimate();}},opts);
                    }
                }
                if(premium && items.effect)document.addEventListener('pointerdown',e=>{
                    if(this.quiet()||performance.now()<(this.tapAt||0))return;this.tapAt=performance.now()+250;
                    const n=document.createElement('div');n.className=prefix+'-tap';n.style.cssText=`left:${e.clientX}px;top:${e.clientY}px`;
                    n.innerHTML=svg(repeat(7,i=>`<path d="M0 ${i*16}Q100 ${-150+i*30} 200 ${i*16}T400 ${i*16}"/>`)+'<g transform="translate(200 110) scale(3)">'+jewel+'</g>');
                    shadow.appendChild(n);this.later(()=>n.remove(),1300);
                },opts);
                const update=()=>{
                    if(this.pet&&!this.pet.isConnected){this.clear();return;}
                    const q=this.quiet();host.style.setProperty('display',q?'none':'block','important');if(this.aura)this.aura.hidden=q;
                    if(q){this.cinema?.remove();this.cinema=null;shadow.querySelectorAll('.tmp-tap').forEach(n=>n.remove());}
                };
                this.observer=new MutationObserver(update);this.observer.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true});
                document.addEventListener('visibilitychange',update,opts);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,opts);update();
            },
            ultimate(){
                if(!this.pet||this.quiet()||performance.now()<(this.readyAt||0)||this.pet.parentElement?.dataset.petDragged==='1')return;
                this.readyAt=performance.now()+(premium?12000:7000);
                const host=this.cinema=document.createElement('div');host.className=prefix+'-cinema-host';host.setAttribute('aria-hidden','true');
                host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147482500!important;overflow:hidden!important';
                const s=host.attachShadow({mode:'open'});s.innerHTML=`<link rel="stylesheet" href="${css}"><div class="${prefix}-ultimate" data-phase="gather">`+(premium?
                    `<div class="tmp-curtain"></div><div class="tmp-cosmic-warp">${threads}</div><div class="tmp-loom left">${lace}</div><div class="tmp-loom right">${lace}</div><div class="tmp-great-book">${codex}</div><div class="tmp-sky-pages">${repeat(12,i=>`<span style="--i:${i}">${map}</span>`)}</div><div class="tmp-needle">${shuttle}</div><div class="tmp-written-sky">${repeat(9,i=>`<span style="--i:${i}">${svg('<path d="M0 200Q100 30 200 200T400 200"/>'+repeat(6,j=>`<g transform="translate(${j*65+20} ${170+(j%2)*45}) scale(.7)">${jewel}</g>`))}</span>`)}</div>${stars(44)}<div class="tmp-caption">THIÊN THƯ DỆT SAO<small data-stage-label>Triệu hồi · Thiên thư</small></div>`:
                    `<div class="tmr-popup-book">${paperBook}</div><div class="tmr-paper-bloom">${repeat(9,i=>`<span style="--i:${i}">${paper}</span>`)}</div><div class="tmr-caption">Sách Sao Bừng Nở</div>`)+`</div>`;
                document.body.appendChild(host);
                if(premium){const stage=(phase,label)=>{if(!host.isConnected)return;s.querySelector('.tmp-ultimate').dataset.phase=phase;s.querySelector('[data-stage-label]').textContent=label;};this.later(()=>stage('weave','Ngân hà · Kết sợi'),1800);this.later(()=>stage('illuminate','Vạn trang · Khai sáng'),4000);this.later(()=>stage('settle','Sao về · Trang sách'),6500);}
                this.later(()=>{host.remove();if(this.cinema===host)this.cinema=null;},premium?8000:3600);
            }
        };
    }
    window.TinhMongPremiumRuntime=runtime(true);
    window.TinhMongRegularRuntime=runtime(false);
})();
