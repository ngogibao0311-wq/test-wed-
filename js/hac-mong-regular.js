/* Hạc Mộng regular: ink-wash clouds, feather trails and a migrating crane. */
(() => {
    'use strict';
    const css = 'css/premium-hac-mong.css?v=20261009.regular-art1';
    if (!document.getElementById('hac-mong-regular-css')) {
        const link = document.createElement('link');
        link.id = 'hac-mong-regular-css'; link.rel = 'stylesheet'; link.href = css;
        document.head.appendChild(link);
    }
    window.HacMongRegularRuntime = {
        timers: new Set(),
        clear() {
            this.events?.abort(); this.observer?.disconnect();
            this.timers.forEach(clearTimeout); this.timers.clear();
            this.host?.remove(); this.aura?.remove();
            if (this.pet) {
                this.pet.classList.remove('hmr-pet');
                for (const [key,value] of Object.entries(this.saved || {})) value === null ? this.pet.removeAttribute(key) : this.pet.setAttribute(key,value);
            }
            this.pet = this.host = this.aura = null;
        },
        later(fn,ms) { const id=setTimeout(()=>{this.timers.delete(id);fn();},ms);this.timers.add(id); },
        quiet() { return document.hidden || document.body.classList.contains('wfx-low-power') ||
            window.isExamVisualItemsSuspended === true || Boolean(window.currentActiveExamId) || matchMedia('(prefers-reduced-motion: reduce)').matches; },
        sync(items = {}) {
            this.clear();
            if (!items.pet && !items.effect) return;
            this.events = new AbortController(); const options = {signal:this.events.signal};
            this.host = document.createElement('div'); this.host.id = 'hac-mong-regular-world';
            this.host.setAttribute('aria-hidden','true');
            this.host.style.cssText = 'position:fixed!important;inset:0!important;pointer-events:none!important;z-index:950;overflow:hidden';
            this.shadow = this.host.attachShadow({mode:'open'});
            this.shadow.innerHTML = `<link rel="stylesheet" href="${css}">`;
            if (items.effect) {
                const clouds = document.createElement('div'); clouds.className = 'hmr-weather';
                clouds.innerHTML = window.RegularStoreArt.hac.world();
                this.shadow.appendChild(clouds);
            }
            document.body.appendChild(this.host);
            if (items.pet) {
                this.pet=document.getElementById('virtual-pet-img');
                if(this.pet){
                    this.saved=Object.fromEntries(['role','tabindex','title'].map(k=>[k,this.pet.getAttribute(k)]));
                    this.pet.classList.add('hmr-pet');this.pet.setAttribute('role','button');this.pet.tabIndex=0;
                    this.pet.title='Hạc Mộng · Chạm để gọi Vân Hạc';
                    this.aura=document.createElement('div');this.aura.className='hmr-aura';this.aura.setAttribute('aria-hidden','true');
                    this.aura.attachShadow({mode:'open'}).innerHTML=`<link rel="stylesheet" href="${css}"><div class="hmr-nest"><b></b><b></b><b></b><i></i><i></i></div>`;
                    this.pet.parentElement.appendChild(this.aura);
                    this.pet.addEventListener('click',()=>this.ultimate(),options);
                    this.pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.ultimate();}},options);
                }
            }
            const update=()=>{const quiet=this.quiet();this.host.hidden=quiet;if(this.aura)this.aura.hidden=quiet;
                if(quiet)this.shadow.querySelectorAll('.hmr-flight').forEach(n=>n.remove());};
            this.observer=new MutationObserver(update);this.observer.observe(document.body,{attributes:true,attributeFilter:['class']});
            document.addEventListener('visibilitychange',update,options);
            matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,options);update();
        },
        ultimate() {
            if(!this.pet||this.quiet()||performance.now()<(this.readyAt||0)||this.pet.parentElement?.dataset.petDragged==='1')return;
            this.readyAt=performance.now()+8000;
            const flight=document.createElement('div');flight.className='hmr-flight';
            flight.innerHTML='<div class="hmr-horizon"></div><svg viewBox="0 0 420 200" aria-hidden="true"><path class="hmr-wing" d="M215 120 Q125 20 10 36 Q100 95 175 125 L215 140Z"/><path class="hmr-wing hmr-wing-far" d="M220 116 Q290 5 403 15 Q330 95 235 140Z"/><path d="M160 134 Q206 99 247 117 Q265 94 275 75 Q288 58 303 73 L318 80 L300 84 Q283 80 281 99 L263 139 Q234 162 191 153 L143 168 L165 146Z"/></svg><span>VÂN HẠC QUY LAI</span>';
            this.shadow.appendChild(flight);this.later(()=>flight.remove(),3200);
        }
    };
})();
