/* Thanh Lãnh: two independent visual compositions; shared lifecycle only. */
(() => {
    'use strict';
    const css = 'css/premium-hac-mong.css?v=20261009.regular-art1';
    const repeat = (n, fn) => Array.from({length:n}, (_,i)=>fn(i)).join('');
    const crystal = '<svg viewBox="0 0 80 200" fill="none" stroke="currentColor"><path fill="#91b9de" fill-opacity=".22" d="M40 2 76 58 65 155 40 198 15 155 4 58Z"/><path d="M40 2 27 64 40 198 53 64Z" fill="#e6f8ff" fill-opacity=".3"/><path d="M4 58 27 64 15 155Z" fill="#526eab" fill-opacity=".6"/><path d="M76 58 53 64 65 155Z" fill="#b5dbed" fill-opacity=".3"/><path d="M40 2 27 64 40 198 53 64ZM4 58 27 64 65 155M76 58 53 64 15 155M27 64H53M40 2V198M12 64 40 173 68 64"/><path d="M33 79 40 68 47 79 40 120ZM24 117 40 145 56 117" stroke-opacity=".5"/></svg>';
    const frost = '<svg viewBox="0 0 200 320" fill="none" stroke="currentColor"><path d="M100 310V12M100 55 74 30M100 55 126 30M100 110 50 60M100 110 150 60M100 180 25 105M100 180 175 105M100 260 8 168M100 260 192 168M50 60V95M150 60V95M25 105V145M175 105V145M8 168V215M192 168V215"/></svg>';
    const snowSeal = `<svg viewBox="0 0 600 600" fill="none" stroke="currentColor"><path d="M300 20 543 160V440L300 580 57 440V160ZM300 65 504 183V417L300 535 96 417V183Z" opacity=".45"/>${repeat(6,i=>`<g transform="rotate(${i*60} 300 300)"><path d="M300 300V40M300 100 270 70 270 45M300 100 330 70 330 45M300 165 225 90M300 165 375 90M300 240 190 130M300 240 410 130M225 90V135H255M375 90V135H345M190 130V175H235M410 130V175H365"/><path d="M300 76 311 96 300 115 289 96ZM300 175 316 200 300 225 284 200Z" fill="currentColor" fill-opacity=".25"/><path d="M280 230Q230 160 215 170Q200 180 240 210M320 230Q370 160 385 170Q400 180 360 210"/>${repeat(5,j=>`<path d="M${244-j*12} ${164-j*12}l-8-18m8 18-18-8M${356+j*12} ${164-j*12}l8-18m-8 18 18-8"/>`)}</g>`)}</svg>`;
    const gallery = `<svg viewBox="0 0 1200 650" preserveAspectRatio="none" fill="none" stroke="currentColor">${repeat(12,i=>`<g transform="translate(${i*100} 0)"><path fill="currentColor" fill-opacity=".04" d="M5 650V220L50 ${50+Math.abs(5.5-i)*18} 95 220V650ZM15 640V225L50 160 85 225V640"/><path d="M5 240H95M15 260H85M25 650V290Q50 240 75 290V650M35 650V300Q50 275 65 300V650M5 600H95M0 610H100M50 165V50M44 80H56M20 220 50 195 80 220"/>${repeat(5,j=>`<path d="M25 ${340+j*48} 50 ${316+j*48} 75 ${340+j*48} 50 ${364+j*48}Z" opacity=".5"/>`)}</g>`)}</svg>`;
    const fan = '<svg viewBox="0 0 240 150" fill="none" stroke="currentColor"><path fill="currentColor" fill-opacity=".1" d="M120 145 8 60Q120-45 232 60Z"/><path d="M120 145 40 35M120 145 77 17M120 145V8M120 145 163 17M120 145 200 35M25 77Q120-6 215 77"/></svg>';
    const bird = `<svg viewBox="0 0 220 140" fill="none" stroke="#d9f2ff"><path d="M103 91Q75 52 10 21Q40 72 79 96L54 132 104 112 135 122 125 101Q154 101 210 35Q155 48 116 83L123 70 139 72 127 80" fill="#c0e0f0" fill-opacity=".45"/>${repeat(7,i=>`<path d="M${25+i*8} ${35+i*7}Q${65+i*5} 65 ${87+i*3} 94M${195-i*9} ${48+i*5}Q${154-i*4} 85 ${130-i*2} 97" stroke-opacity=".55"/>`)}<path d="M96 86Q103 110 117 105M105 90 99 122"/></svg>`;
    const filigree = `<svg viewBox="0 0 180 700" fill="none" stroke="currentColor"><path d="M90 0V700M84 0V700M96 0V700" opacity=".4"/>${repeat(7,i=>`<g transform="translate(90 ${45+i*100})"><path d="M0-40 42 0 0 40-42 0Z" fill="#7eb0cf" fill-opacity=".1"/><path d="M0-28 28 0 0 28-28 0ZM0-40V40M-42 0H42M-42 0Q-85-35-70 15Q-55 45-42 0M42 0Q85-35 70 15Q55 45 42 0"/><path d="M0 40V58M-5 52 0 64 5 52"/><circle r="5" fill="#def8ff" fill-opacity=".55"/></g>`)}</svg>`;
    const embroidery = `<div class="tlp-carving tlp-carving-left">${filigree}</div><div class="tlp-carving tlp-carving-right">${filigree}</div><div class="tlp-ice-threads">${repeat(6,i=>`<span style="--i:${i}">${crystal}<i></i></span>`)}</div>`;
    if (!document.getElementById('thanh-lanh-css')) {
        const link=document.createElement('link');link.id='thanh-lanh-css';link.rel='stylesheet';link.href=css;document.head.appendChild(link);
    }
    function runtime(premium) {
        return {
            timers:new Set(),
            later(fn,ms){const id=setTimeout(()=>{this.timers.delete(id);fn();},ms);this.timers.add(id);},
            quiet(){return document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('wfx-low-power') || window.isExamVisualItemsSuspended===true || Boolean(window.currentActiveExamId);},
            clear(){
                this.events?.abort();this.observer?.disconnect();this.timers.forEach(clearTimeout);this.timers.clear();
                this.host?.remove();this.aura?.remove();
                if(this.pet){this.pet.classList.remove('tlp-pet','tlr-pet');for(const [key,value] of Object.entries(this.saved||{}))value===null?this.pet.removeAttribute(key):this.pet.setAttribute(key,value);}
                if(premium)document.documentElement.classList.remove('tlp-equipped');
                this.pet=this.host=this.aura=this.shadow=null;
            },
            mount(){this.sync({pet:true,effect:true});},
            sync(items={}){
                this.clear();if(!items.pet&&!items.effect)return;
                this.events=new AbortController();const opts={signal:this.events.signal};
                const host=this.host=document.createElement('div');host.id=premium?'thanh-lanh-premium-world':'thanh-lanh-regular-world';
                host.setAttribute('aria-hidden','true');host.style.cssText='position:fixed!important;inset:0!important;pointer-events:none!important;z-index:950;overflow:hidden';
                const shadow=this.shadow=host.attachShadow({mode:'open'});shadow.innerHTML=`<link rel="stylesheet" href="${css}">`;
                if(premium){
                    document.documentElement.classList.add('tlp-equipped');
                    shadow.innerHTML+=`<div class="tlp-sky"><div class="tlp-aurora"></div><div class="tlp-aurora tlp-aurora-two"></div><div class="tlp-vault">${repeat(7,i=>`<b style="--i:${i}"></b>`)}</div><div class="tlp-frieze">${repeat(12,i=>`<span style="--i:${i}">${crystal}</span>`)}</div><div class="tlp-branches">${frost}${frost}</div><div class="tlp-reflection"></div>${embroidery}<div class="tlp-snow-flight">${repeat(3,i=>`<span style="--i:${i}">${bird}</span>`)}</div>${repeat(matchMedia('(max-width:600px)').matches?12:26,i=>`<i class="tlp-dust" style="--x:${(i*37)%100}%;--y:${(i*19)%100}%;--d:${i*.53}s"></i>`)}</div>`;
                }else if(items.effect){
                    shadow.innerHTML+='<div class="tlr-weather">'+window.RegularStoreArt.thanh.world()+'</div>';
                }
                document.body.appendChild(host);
                if(items.pet){
                    this.pet=document.getElementById('virtual-pet-img');
                    if(this.pet){
                        this.saved=Object.fromEntries(['role','tabindex','title'].map(k=>[k,this.pet.getAttribute(k)]));
                        this.pet.classList.add(premium?'tlp-pet':'tlr-pet');this.pet.setAttribute('role','button');this.pet.tabIndex=0;
                        this.pet.title=premium?'Thanh Lãnh · Chạm mở Thiên Kính Hàn Cung':'Thanh Lãnh · Chạm mở quạt Tuyết Phiến';
                        this.aura=document.createElement('div');this.aura.className=premium?'tlp-aura':'tlr-aura';this.aura.setAttribute('aria-hidden','true');
                        this.aura.attachShadow({mode:'open'}).innerHTML=`<link rel="stylesheet" href="${css}">`+(premium?`<div class="tlp-reliquary"><div class="tlp-canopy"></div><div class="tlp-shoulder left">${frost}</div><div class="tlp-shoulder right">${frost}</div>${repeat(5,i=>`<span class="tlp-satellite" style="--i:${i}">${crystal}</span>`)}<div class="tlp-plinth"></div></div>`:window.RegularStoreArt.thanh.aura());
                        this.pet.parentElement.appendChild(this.aura);
                        if(premium){const n=document.createElement('div');n.className='tlp-aura-insignia';n.innerHTML=`<div class="tlp-aura-seal">${snowSeal}</div><div class="tlp-familiar">${bird}</div><div class="tlp-frost-strands">${filigree}${filigree}</div>`;this.aura.shadowRoot.querySelector('.tlp-reliquary').appendChild(n);}
                        this.pet.addEventListener('click',()=>this.ultimate(),opts);
                        this.pet.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();this.ultimate();}},opts);
                    }
                }
                if(premium && items.effect)document.addEventListener('pointerdown',e=>{if(this.quiet()||performance.now()<(this.tapAt||0))return;this.tapAt=performance.now()+250;const n=document.createElement('div');n.className='tlp-impact';n.style.cssText=`left:${e.clientX}px;top:${e.clientY}px`;n.innerHTML=`<div class="tlp-touch-seal">${snowSeal}</div>`+repeat(6,i=>`<b style="--i:${i}">${crystal}</b>`);shadow.appendChild(n);this.later(()=>n.remove(),1400);},opts);
                const update=()=>{if(this.pet&&!this.pet.isConnected){this.clear();return;}const q=this.quiet();host.hidden=q;if(this.aura)this.aura.hidden=q;if(q)shadow.querySelectorAll('.tlp-ultimate,.tlr-ultimate,.tlp-impact').forEach(n=>n.remove());};
                this.observer=new MutationObserver(update);this.observer.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true});
                document.addEventListener('visibilitychange',update,opts);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,opts);update();
            },
            ultimate(){
                if(!this.pet||!this.shadow||this.quiet()||performance.now()<(this.readyAt||0)||this.pet.parentElement?.dataset.petDragged==='1')return;
                this.readyAt=performance.now()+(premium?12000:7000);
                const n=document.createElement('div');n.className=premium?'tlp-ultimate':'tlr-ultimate';
                n.innerHTML=premium?'':window.RegularStoreArt.thanh.ultimate();
                if(premium){
                    n.dataset.phase='condense';
                    n.innerHTML=`<div class="tlp-eclipse"></div><div class="tlp-ice-gallery">${gallery}</div>${embroidery}<div class="tlp-iris">${repeat(6,i=>`<span style="--i:${i}">${crystal}</span>`)}</div><div class="tlp-snow-tree">${snowSeal}</div><div class="tlp-crack">${repeat(12,i=>`<i style="--i:${i}"></i>`)}</div><div class="tlp-shard-storm">${repeat(matchMedia('(max-width:600px)').matches?18:32,i=>`<span style="--i:${i};--x:${(i*41)%100}%;--y:${(i*23)%100}%;--a:${i*137.5}deg;--d:${i*.025}s">${crystal}</span>`)}</div><div class="tlp-ascendant">${repeat(5,i=>`<span style="--i:${i}">${bird}</span>`)}</div><div class="tlp-sweep"></div><div class="tlp-inscription">THIÊN KÍNH HÀN CUNG<small data-stage-label>Ngưng sương · Kết kính</small></div>`;
                    const stage=(phase,label)=>{if(!n.isConnected)return;n.dataset.phase=phase;n.querySelector('[data-stage-label]').textContent=label;};
                    this.later(()=>stage('awaken','Hàn ấn · Khai điện'),1700);
                    this.later(()=>stage('shatter','Thiên kính · Tán quang'),4000);
                    this.later(()=>stage('dissolve','Tuyết điểu · Quy tĩnh'),6500);
                }
                this.shadow.appendChild(n);this.later(()=>n.remove(),premium?8000:3400);
            }
        };
    }
    window.ThanhLanhPremiumRuntime=runtime(true);
    window.ThanhLanhRegularRuntime=runtime(false);
})();
