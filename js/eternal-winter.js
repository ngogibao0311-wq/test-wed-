/* Eternal Winter: bounded Canvas simulation. Visual state only; never writes to the database. */
(() => {
    'use strict';
    if (window.EternalWinter) return;
    const CSS = 'css/eternal-winter.css?v=20261010.winter-aura1';
    const ID = 'pet_eternal_winter_4';
    const TAU = Math.PI * 2, clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
    const mix=(a,b,t)=>a+(b-a)*t, smooth=t=>t*t*(3-2*t);
    function noise(x,seed) { const i=Math.floor(x),f=smooth(x-i);const h=n=>{const v=Math.sin(n*127.1+seed*311.7)*43758.5453;return v-Math.floor(v);};return mix(h(i),h(i+1),f)*2-1; }
    const settings = {density:300,wind:1,crystalSize:1,speed:1,light:.8,color:'#9ce9ff',aurora:['#70f1d3','#8990ff','#b580e9'],quality:'auto'};
    const instances=new Set();
    function ensureCSS(){if(!document.getElementById('eternal-winter-css')){const l=document.createElement('link');l.id='eternal-winter-css';l.rel='stylesheet';l.href=CSS;document.head.append(l);}}
    function suspended(){return document.hidden||window.isExamVisualItemsSuspended===true||Boolean(window.currentActiveExamId);}
    class WinterScene {
        constructor(target,options={}) {
            this.target=target;this.options={...settings,...options};this.mode=options.mode||'world';this.state=options.state||'active';this.seed=Math.random()*1000;
            this.time=0;this.phase=0;this.phaseTime=0;this.duration=18+Math.random()*9;this.strength=.12;this.wind=0;this.last=0;this.raf=0;this.visible=true;this.dead=false;this.ultimateAt=-100;this.unlockAt=-100;this.nextPulse=12;this.frameCost=16;
            this.pointer={x:-9999,y:-9999};this.events=new AbortController();this.motion=matchMedia('(prefers-reduced-motion: reduce)');
            this.host=document.createElement('div');this.host.className='ew-canvas-host';this.host.setAttribute('aria-hidden','true');this.host.style.cssText='position:absolute!important;inset:0!important;pointer-events:none!important;overflow:hidden!important;z-index:0!important';
            this.front=document.createElement('div');this.front.className='ew-canvas-front';this.front.setAttribute('aria-hidden','true');this.front.style.cssText='position:absolute!important;inset:0!important;pointer-events:none!important;overflow:hidden!important;z-index:4!important';
            const make=host=>{const shadow=host.attachShadow({mode:'open'}),c=document.createElement('canvas');c.style.cssText='display:block;width:100%;height:100%;pointer-events:none';shadow.append(c);return c;};
            this.backCanvas=make(this.host);this.frontCanvas=make(this.front);this.back=this.backCanvas.getContext('2d');this.ctx=this.frontCanvas.getContext('2d');target.prepend(this.host);target.append(this.front);
            this.snow=Array.from({length:420},()=>({x:Math.random(),y:Math.random(),z:Math.random(),vx:0,vy:0,seed:Math.random()*100}));
            this.crystals=Array.from({length:18},(_,i)=>({x:i%2?.95:.05,y:.1+Math.random()*.8,age:Math.random()*16,life:14+Math.random()*10,r:18+Math.random()*38,branches:3+i%3,rot:Math.random()*TAU,broken:false}));
            this.shards=Array.from({length:150},()=>({life:0,x:0,y:0,vx:0,vy:0,rot:0}));this.pulses=Array.from({length:6},()=>({life:0,x:0,y:0,r:0}));
            this.frost=Array.from({length:36},(_,i)=>({edge:i%4,along:Math.random(),length:20+Math.random()*65,offset:Math.random()*25,melt:0,seed:i+this.seed}));
            const opts={signal:this.events.signal};this.pointerTarget=this.mode==='world'?document:this.mode==='aura'?target.parentElement:target;
            this.pointerTarget.addEventListener('pointermove',e=>{const b=target.getBoundingClientRect();this.pointer.x=e.clientX-b.left;this.pointer.y=e.clientY-b.top;},opts);
            (this.mode==='aura'?this.pointerTarget:target).addEventListener('pointerleave',()=>{this.pointer.x=-9999;this.pointer.y=-9999;},opts);
            document.addEventListener('visibilitychange',()=>this.wake(),opts);this.motion.addEventListener('change',()=>this.wake(),opts);
            this.resizeObserver=new ResizeObserver(()=>{this.resize();this.wake();});this.resizeObserver.observe(target);
            this.intersection=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.wake();});this.intersection.observe(target);
            this.mutation=new MutationObserver(()=>{if(!target.isConnected)this.destroy();else this.wake();});this.mutation.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true});
            this.resize();instances.add(this);this.wake();
        }
        resize(){const r=this.target.getBoundingClientRect();this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);this.dpr=Math.min(devicePixelRatio||1,this.options.quality==='low'?1:1.5);for(const c of [this.backCanvas,this.frontCanvas]){c.width=Math.round(this.w*this.dpr);c.height=Math.round(this.h*this.dpr);}this.back.setTransform(this.dpr,0,0,this.dpr,0,0);this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);}
        canRun(){return !this.dead&&this.visible&&!suspended()&&this.w>1&&this.h>1&&this.target.getClientRects().length>0;}
        wake(){cancelAnimationFrame(this.raf);this.raf=0;this.host.style.visibility=this.front.style.visibility=suspended()?'hidden':'visible';if(!this.canRun())return;this.last=0;this.draw(0);if(!this.motion.matches)this.raf=requestAnimationFrame(t=>this.frame(t));}
        frame(now){this.raf=0;if(!this.canRun())return;const dt=this.last?Math.min((now-this.last)/1000,.04):.016;this.frameCost=mix(this.frameCost,this.last?now-this.last:16,.015);this.last=now;this.draw(dt);if(!this.motion.matches)this.raf=requestAnimationFrame(t=>this.frame(t));}
        pulse(x=this.w*.5,y=this.h*.5){if(this.motion.matches||!this.canRun())return;const p=this.pulses.find(p=>p.life<=0);if(p){p.x=x;p.y=y;p.life=1;p.r=0;}}
        fracture(x,y,count=16){for(const p of this.shards){if(p.life>0)continue;const a=Math.random()*TAU,v=20+Math.random()*100;p.x=x;p.y=y;p.vx=Math.cos(a)*v;p.vy=Math.sin(a)*v;p.rot=a;p.life=1;if(--count===0)break;}}
        setState(state){if(state===this.state)return;const was=this.state;this.state=state;if(was==='sealed'&&state!=='sealed'){this.unlockAt=this.time;this.fracture(this.w/2,this.h/2,75);this.pulse();}this.wake();}
        ultimate(){if(this.motion.matches||!this.canRun()||this.time-this.ultimateAt<16)return false;this.ultimateAt=this.time;this.pulse();return true;}
        draw(dt){
            const {w,h}=this,c=this.ctx,b=this.back;const o=this.options;this.time+=dt*clamp(o.speed,.1,3);this.phaseTime+=dt;
            if(this.phaseTime>this.duration){this.phase=(this.phase+1)%4;this.phaseTime=0;this.duration=16+Math.random()*15;}
            const target=[.12,.5,1,.2][this.phase];this.strength=mix(this.strength,target,1-Math.exp(-dt*.35));this.wind=mix(this.wind,(noise(this.time*.06,this.seed)*180+Math.sin(this.time*.18)*60)*this.strength*o.wind,1-Math.exp(-dt*.9));
            b.clearRect(0,0,w,h);c.clearRect(0,0,w,h);const world=this.mode==='world',aura=this.mode==='aura';
            let cap=clamp(o.density,0,420);const quality=window.EffectQualityManager?.getLuxuryPolicy?.();if(quality)cap*=clamp(quality.countScale??1,.15,1);if(this.mode==='card')cap=Math.min(cap,65);if(aura)cap=Math.min(cap,72);
            if(o.quality==='low'||document.body.classList.contains('wfx-low-power'))cap*=.3;else if(o.quality==='auto'&&(innerWidth<650||navigator.hardwareConcurrency<=4||this.frameCost>26))cap*=.48;
            const staticMode=this.motion.matches; if(staticMode)cap=Math.min(cap,24);
            b.globalAlpha=world?.46:1;
            // Organic aurora curtains sampled from smooth value-noise, different scales and speeds.
            for(let band=0;band<(aura?0:3);band++){
                const g=b.createLinearGradient(0,0,0,h*.42);g.addColorStop(0,'transparent');g.addColorStop(.48,o.aurora[band]);g.addColorStop(1,'transparent');b.fillStyle=g;b.globalAlpha=(world?.12:.22)*clamp(o.light,0,1.5)*(1.25-this.strength*.3);
                b.beginPath();for(let j=0;j<=50;j++){const x=w*j/50,y=h*(.07+band*.045)+noise(j*.12+this.time*.075,this.seed+band)*h*.085+Math.sin(j*.2+this.time*.15)*h*.035;j?b.lineTo(x,y):b.moveTo(x,y);}for(let j=50;j>=0;j--){const x=w*j/50,y=h*(.22+band*.045)+noise(j*.12+this.time*.075,this.seed+band)*h*.085;b.lineTo(x,y);}b.closePath();b.fill();
            }
            b.globalAlpha=1;b.strokeStyle=o.color;b.lineWidth=.8;
            if(aura)this.drawAura(dt);
            if(!world&&!aura){const cx=w/2,cy=h*.48,r=Math.min(w,h)*.41,active=this.state==='active';b.save();b.translate(cx,cy);b.rotate(this.time*(active?.065:.018));b.globalAlpha=active?.6:.24;
                for(let k=0;k<3;k++){b.beginPath();b.ellipse(0,0,r*(1-k*.09),r*(1-k*.09),0,0,TAU);b.stroke();}
                for(let i=0;i<24;i++){const a=i*TAU/24;b.save();b.rotate(a);b.translate(0,-r*.87);b.globalAlpha=.18+.5*Math.max(0,Math.sin(this.time+i));b.beginPath();b.moveTo(-4,-5);b.lineTo(4,5);b.moveTo(4,-5);b.lineTo(-4,5);b.moveTo(0,-8);b.lineTo(0,8);b.stroke();b.restore();const t=a+this.time*.2;b.fillStyle=o.color;b.beginPath();b.arc(Math.cos(t)*r,Math.sin(t)*r,1.7,0,TAU);b.fill();}b.restore();
            }
            if(this.time>this.nextPulse&&this.state==='active'&&!staticMode){this.nextPulse=this.time+10+Math.random()*8;this.pulse(world?w*.88:w*.5,h*.6);}
            // Crystal age drives asymmetric growth, edge glints and fragment release.
            for(let i=0;i<(aura?0:world?14:8);i++){const q=this.crystals[i];q.age+=dt;const x=q.x*w,y=q.y*h;if(q.age>q.life&&!q.broken){q.broken=true;this.fracture(x,y,9);}if(q.age>q.life+3){q.age=0;q.broken=false;q.y=.08+Math.random()*.84;}
                if(q.broken)continue;const grow=clamp(q.age/5),fade=clamp((q.life-q.age)/2),r=q.r*o.crystalSize*grow*(world?1:Math.min(w/350,1));b.save();b.translate(x,y);b.rotate(q.rot+this.time*.07);b.scale(.7+.3*Math.cos(this.time*.22+i),1);b.globalAlpha=fade*(world?.4:.75);b.strokeStyle=o.color;b.lineWidth=1;b.beginPath();
                for(let arm=0;arm<6;arm++){const a=arm*TAU/6,dx=Math.cos(a),dy=Math.sin(a);b.moveTo(0,0);b.lineTo(dx*r,dy*r);for(let twig=1;twig<=q.branches;twig++){const t=twig/(q.branches+1),bx=dx*r*t,by=dy*r*t;for(const side of [-1,1]){b.moveTo(bx,by);b.lineTo(bx+Math.cos(a+side*.85)*r*.22,by+Math.sin(a+side*.85)*r*.22);}}}b.stroke();b.globalAlpha=fade*.7;b.fillStyle='#ecfbff';b.fillRect(-1,-1,3,3);b.restore();
            }
            // Edge frost: branching glass dendrites, delayed growth and cursor melting.
            for(const f of (aura?[]:this.frost)){const x=f.edge===0?0:f.edge===1?w:f.along*w,y=f.edge===2?0:f.edge===3?h:f.along*h;const near=Math.hypot(x-this.pointer.x,y-this.pointer.y)<90;f.melt=mix(f.melt,near?1:0,1-Math.exp(-dt*(near?5:.6)));const growth=(.3+.7*(.5+.5*Math.sin(this.time*.12+f.offset)))*(1-f.melt),len=f.length*growth; b.save();b.translate(x,y);b.rotate([0,Math.PI,Math.PI/2,-Math.PI/2][f.edge]);b.strokeStyle=o.color;b.globalAlpha=world?.3:.65;b.beginPath();b.moveTo(0,0);b.lineTo(len,noise(f.seed,3)*len*.3);for(let k=1;k<6;k++){const xx=len*k/6,yy=noise(k*.3,f.seed)*len*.15;b.moveTo(xx,yy);b.lineTo(xx+len*.2,yy-len*.19);b.moveTo(xx,yy);b.lineTo(xx+len*.13,yy+len*.16);}b.stroke();b.restore();}
            // Three depth bands; wind acceleration, pointer pressure and local vortex fields.
            for(let i=0;i<cap;i++){const p=this.snow[i],x=p.x*w,y=p.y*h,z=.25+p.z;let fx=this.wind*z,fy=18+45*z;
                if(aura){const ax=x-w*.5,ay=(y-h*.52)*.75;fx+=-ay*(.45+this.strength);fy+=ax*(.45+this.strength)-28;}
                if(this.strength>.65){for(let k=0;k<2;k++){const vx=w*(.18+k*.64)+Math.sin(this.time*.15+k)*w*.07,vy=h*(.3+k*.3),dx=x-vx,dy=y-vy,d2=dx*dx+dy*dy+900;const force=11000*this.strength/d2;fx-=dy*force;fy+=dx*force;}}
                const dx=x-this.pointer.x,dy=y-this.pointer.y,d=Math.hypot(dx,dy);if(d<95&&d>1){fx+=dx/d*(95-d)*.8;fy+=dy/d*(95-d)*.5;}
                for(const pulse of this.pulses){if(pulse.life<=0)continue;const px=x-pulse.x,py=y-pulse.y,pd=Math.hypot(px,py);if(pd>1&&Math.abs(pd-pulse.r)<28){fx+=px/pd*230;fy+=py/pd*230;}}
                p.vx=mix(p.vx,fx+Math.sin(this.time+p.seed)*14,1-Math.exp(-dt*2));p.vy=mix(p.vy,fy,1-Math.exp(-dt));p.x+=p.vx*dt/w;p.y+=p.vy*dt/h;if(p.x>1.03)p.x=-.03;if(p.x<-.03)p.x=1.03;if(p.y>1.03)p.y=-.03;if(p.y<-.03)p.y=1.03;
                const ctx=p.z>.64?c:b;ctx.globalAlpha=(world?.18:.5)+p.z*.24;ctx.fillStyle=i%13===0?o.color:'#edf8ff';const radius=.5+p.z*(world?2:1.5);ctx.beginPath();ctx.arc(p.x*w,p.y*h,radius,0,TAU);ctx.fill();if(i%13===0){ctx.globalAlpha=.08;ctx.beginPath();ctx.arc(p.x*w,p.y*h,radius*3.5,0,TAU);ctx.fill();}
            }
            for(const p of this.pulses){if(p.life<=0)continue;p.life-=dt*.5;p.r+=dt*170;c.strokeStyle=o.color;c.globalAlpha=Math.max(0,p.life)*.5;c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y,p.r,0,TAU);c.stroke();c.globalAlpha=Math.max(0,p.life)*.2;c.beginPath();c.arc(p.x,p.y,p.r*.8,0,TAU);c.stroke();}
            for(const p of this.shards){if(p.life<=0)continue;p.life-=dt*.45;p.vy+=dt*28;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=dt;c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.globalAlpha=Math.max(0,p.life)*.8;c.fillStyle=o.color;c.beginPath();c.moveTo(0,-7);c.lineTo(3,0);c.lineTo(0,8);c.lineTo(-2,0);c.closePath();c.fill();c.restore();}
            // Ultimate: ice organ architecture grows from the floor, then dissolves into faceted light.
            const u=this.time-this.ultimateAt;if(u>=0&&u<8){const rise=smooth(clamp(u/2.3)),fade=clamp((8-u)/1.8);b.globalAlpha=fade*.7;b.fillStyle='#091a38';b.fillRect(0,0,w,h);b.strokeStyle='#b6f5ff';
                for(let i=0;i<17;i++){const x=w*i/16,ph=(.22+.46*Math.abs(Math.cos(i*.7)))*h*rise,ww=w/30;const g=b.createLinearGradient(x,h-ph,x+ww,h);g.addColorStop(0,'#d7fbff');g.addColorStop(.3,'#5493c899');g.addColorStop(1,'#142a6344');b.fillStyle=g;b.globalAlpha=fade*.7;b.beginPath();b.moveTo(x-ww,h);b.lineTo(x-ww,h-ph+ww*2);b.lineTo(x,h-ph);b.lineTo(x+ww,h-ph+ww*2);b.lineTo(x+ww,h);b.closePath();b.fill();b.stroke();b.beginPath();b.moveTo(x,h-ph);b.lineTo(x,h);b.stroke();
                    b.fillStyle='#bfefff';b.globalAlpha=fade*.12;b.beginPath();b.moveTo(x,h-ph);b.lineTo(x+ww,h-ph+ww*2);b.lineTo(x+ww,h);b.lineTo(x,h);b.closePath();b.fill();
                    b.globalAlpha=fade*.4;b.beginPath();for(let j=1;j<9;j++){const yy=h-ph+ww*2+(ph-ww*2)*j/10;b.moveTo(x,yy);b.lineTo(x-ww*.6,yy-ww*.55);b.moveTo(x,yy);b.lineTo(x+ww*.6,yy-ww*.55);b.moveTo(x-ww*.72,yy+ww*.22);b.lineTo(x+ww*.72,yy+ww*.22);}b.stroke();
                }
                // Vault ribs and hanging diamond tracery form a growing cathedral rather than a flash.
                b.globalAlpha=fade*.32;b.strokeStyle='#8dcbe8';for(let k=0;k<9;k++){const inset=w*(.03+k*.037),top=h*(.29+k*.018);b.beginPath();b.moveTo(inset,h);b.bezierCurveTo(inset,h*.52,w*.5,top,w*.5,top-h*.08);b.bezierCurveTo(w*.5,top,w-inset,h*.52,w-inset,h);b.stroke();}
                for(let i=0;i<13;i++){const x=w*(i+.5)/13,y=h*(.1+.11*(.5+.5*Math.sin(i*1.4+this.time*.3)));b.globalAlpha=fade*.45;b.beginPath();b.moveTo(x,0);b.lineTo(x,y);b.moveTo(x,y);b.lineTo(x+5,y+10);b.lineTo(x,y+20);b.lineTo(x-5,y+10);b.closePath();b.stroke();}
                c.globalAlpha=fade;c.fillStyle='#e2fbff';c.textAlign='center';c.font=`${clamp(w*.032,17,36)}px Georgia`;c.fillText('VĨNH ĐÔNG · THIÊN THÀNH',w/2,h*.23);c.font='13px system-ui';c.fillText(u<2.5?'Phong ấn thức tỉnh':u<5.7?'Vạn tinh băng · Khai thiên thành':'Cực quang trở về',w/2,h*.23+28);
                if(u>2.3&&u<5.8){c.strokeStyle='#b4e9ff';c.globalAlpha=fade*.5;c.beginPath();for(let i=0;i<32;i++){const a=i*TAU/32+this.time*.08,r=Math.min(w,h)*(.17+.06*Math.sin(i*2.4));const x=w*.5+Math.cos(a)*r,y=h*.45+Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.stroke();}
            }
            if(this.state==='sealed'){c.globalAlpha=.38;c.fillStyle='#08172c';c.fillRect(0,0,w,h);c.strokeStyle='#779fb8';c.globalAlpha=.25;c.lineWidth=1;for(let i=0;i<8;i++){c.beginPath();c.moveTo(w*.5,h*.4);c.lineTo(w*noise(i,this.seed),h*(i/7));c.stroke();}}
            b.globalAlpha=c.globalAlpha=1;this.host.dataset.phase=['calm','awakening','blizzard','peace'][this.phase];
        }
        drawAura(dt){
            const b=this.back,c=this.ctx,w=this.w,h=this.h,t=this.time,cx=w*.5,cy=h*.49,rx=w*.405,ry=h*.405;
            const surge=.35+this.strength*.65,light=clamp(this.options.light,0,1.5);
            // Radial light has zero alpha at its boundary. Never paint an opaque rectangle.
            b.save();b.translate(cx,cy);b.scale(1,ry/rx);
            const glow=b.createRadialGradient(0,0,rx*.45,0,0,rx*1.12);
            glow.addColorStop(0,'#78caff00');glow.addColorStop(.52,'#4e83da12');glow.addColorStop(.77,'#87defd38');glow.addColorStop(1,'#5baaff00');
            b.globalAlpha=light;b.fillStyle=glow;b.fillRect(-rx*1.12,-rx*1.12,rx*2.24,rx*2.24);b.restore();
            // Three independent aurora silk bands follow the silhouette, leaving the face clear.
            for(let k=0;k<3;k++){
                b.save();b.translate(cx,cy);b.globalAlpha=(.10+surge*.07)*light;b.fillStyle=this.options.aurora[k];b.beginPath();
                for(let j=0;j<=72;j++){const a=j*TAU/72,flow=noise(a*1.3+t*.14,this.seed+k)*.055,r=.91+flow+k*.045;j?b.lineTo(Math.cos(a)*rx*r,Math.sin(a)*ry*r):b.moveTo(Math.cos(a)*rx*r,Math.sin(a)*ry*r);}
                for(let j=72;j>=0;j--){const a=j*TAU/72,flow=noise(a*1.3+t*.14,this.seed+k)*.055,r=.84+flow+k*.045;b.lineTo(Math.cos(a)*rx*r,Math.sin(a)*ry*r);}b.closePath();b.fill();b.restore();
            }
            // Counter-rotating engraved ring, distinct glyph silhouettes and flickering runic nodes.
            b.save();b.translate(cx,cy);b.scale(1,ry/rx);b.rotate(t*(.025+surge*.035));b.strokeStyle='#bfeeff';b.lineWidth=.7;
            for(let ring=0;ring<3;ring++){b.globalAlpha=[.42,.22,.36][ring]*light;b.beginPath();b.arc(0,0,rx*(.81+ring*.085),0,TAU);b.stroke();}
            for(let i=0;i<32;i++){b.save();b.rotate(i*TAU/32);b.translate(0,-rx*.895);b.globalAlpha=(.25+.4*Math.pow(Math.max(0,Math.sin(t*.8+i*.6)),4))*light;
                b.beginPath();b.moveTo(0,-5);b.lineTo(0,5);b.moveTo(-3,-2);b.lineTo(0,-5);b.lineTo(3,-2);
                if(i%3===0){b.moveTo(-3,2);b.lineTo(0,5);b.lineTo(3,2);}else if(i%3===1){b.moveTo(-3,1);b.lineTo(3,-1);}else{b.moveTo(-3,3);b.lineTo(-3,-3);b.moveTo(3,3);b.lineTo(3,-3);}b.stroke();b.restore();}
            b.restore();
            // Living faceted crystals orbit in depth, grow, fissure, shed pooled shards, then regrow.
            for(let i=0;i<12;i++){
                const q=this.crystals[i];q.age+=dt;const a=i*TAU/12+t*(i%2?-.035:.047),x=cx+Math.cos(a)*rx*.97,y=cy+Math.sin(a)*ry*.97;
                if(q.age>q.life&&!q.broken){q.broken=true;this.fracture(x,y,6);}if(q.age>q.life+3){q.age=0;q.broken=false;}if(q.broken)continue;
                const size=(7+i%4*2)*clamp(q.age/3)*clamp((q.life-q.age)/1.2)*this.options.crystalSize;
                const ctx=Math.sin(a)>.45?c:b;ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI*.5+Math.sin(t*.3+i)*.12);ctx.globalAlpha=.65*light;
                ctx.fillStyle='#81bff26b';ctx.strokeStyle='#d4faff';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.36,-size*.3);ctx.lineTo(size*.3,size*.55);ctx.lineTo(0,size);ctx.lineTo(-size*.3,size*.55);ctx.lineTo(-size*.36,-size*.3);ctx.closePath();ctx.fill();ctx.stroke();
                ctx.fillStyle='#e8fdff80';ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.36,-size*.3);ctx.lineTo(0,size);ctx.closePath();ctx.fill();
                ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(0,size);ctx.moveTo(-size*.36,-size*.3);ctx.lineTo(size*.3,size*.55);ctx.stroke();
                if(q.age>q.life-3){ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(-size*.3,0);ctx.lineTo(size*.1,-size*.2);ctx.lineTo(-size*.1,size*.25);ctx.lineTo(size*.3,size*.45);ctx.stroke();}
                ctx.restore();
            }
            // Frost grows on six curved crest segments, not on the rectangular Canvas edges.
            for(let k=0;k<6;k++){
                const f=this.frost[k],a=k*TAU/6+t*.015,x=cx+Math.cos(a)*rx*.96,y=cy+Math.sin(a)*ry*.96;
                const near=Math.hypot(x-this.pointer.x,y-this.pointer.y)<65;f.melt=mix(f.melt,near?1:0,1-Math.exp(-dt*(near?6:.7)));
                const growth=(.55+.45*Math.sin(t*.13+k)**2)*(1-f.melt);b.save();b.translate(x,y);b.rotate(a+Math.PI/2);b.strokeStyle='#b8eefa';b.globalAlpha=.38*light;b.lineWidth=.65;b.beginPath();
                for(let branch=0;branch<4;branch++){const yy=(branch-1.5)*7*growth;b.moveTo(0,yy);b.lineTo((9-branch)*growth,yy-6*growth);b.moveTo(0,yy);b.lineTo(-(9-branch)*growth,yy-6*growth);}b.moveTo(0,-17*growth);b.lineTo(0,13*growth);b.stroke();b.restore();
            }
            // Low elliptical altar and traveling energy beads anchor the character to the scene.
            b.save();b.translate(cx,h*.86);b.strokeStyle='#b6ecff';b.globalAlpha=.35*light;
            for(let j=0;j<3;j++){b.beginPath();b.ellipse(0,0,rx*(.76+j*.1),h*(.038+j*.012),0,0,TAU);b.stroke();}
            for(let j=0;j<24;j++){const a=j*TAU/24-t*.2;b.fillStyle='#d7faff';b.globalAlpha=(.2+.6*Math.max(0,Math.sin(a+t)))*light;b.beginPath();b.arc(Math.cos(a)*rx*.85,Math.sin(a)*h*.05,1.1,0,TAU);b.fill();}b.restore();
            b.globalAlpha=c.globalAlpha=1;
        }
        destroy(){if(this.dead)return;this.dead=true;cancelAnimationFrame(this.raf);this.events.abort();this.resizeObserver.disconnect();this.intersection.disconnect();this.mutation.disconnect();this.host.remove();this.front.remove();this.backCanvas.width=this.frontCanvas.width=1;instances.delete(this);}
    }
    function stage(className,parent=document.body){const n=document.createElement('div');n.className=className;n.setAttribute('aria-hidden','true');parent.append(n);return n;}
    function regularMarkup(host,markup){host.attachShadow({mode:'open'}).innerHTML=`<link rel="stylesheet" href="${CSS}">`+markup;}
    const premium={
        clear(){this.events?.abort();this.watch?.disconnect();this.world?.destroy();this.aura?.destroy();this.worldHost?.remove();this.auraHost?.remove();document.documentElement.classList.remove('ew-equipped');if(this.pet){for(const[k,v]of Object.entries(this.saved||{}))v===null?this.pet.removeAttribute(k):this.pet.setAttribute(k,v);this.pet.classList.remove('ew-pet');}this.pet=null;},
        mount(){this.clear();ensureCSS();const pet=this.pet=document.getElementById('virtual-pet-img');if(!pet)return;this.saved=Object.fromEntries(['title','role','tabindex'].map(k=>[k,pet.getAttribute(k)]));pet.classList.add('ew-pet');pet.title='Vĩnh Đông · Chạm mở Thiên Thành Băng';pet.setAttribute('role','button');pet.tabIndex=0;document.documentElement.classList.add('ew-equipped');
            this.worldHost=stage('ew-world');this.world=new WinterScene(this.worldHost,{mode:'world'});this.auraHost=stage('ew-aura',pet.parentElement);this.aura=new WinterScene(this.auraHost,{mode:'aura'});this.aura.front.classList.add('ew-aura-front');pet.parentElement.append(this.aura.front);this.events=new AbortController();const opts={signal:this.events.signal};let last=0;
            document.addEventListener('pointerdown',e=>{if(performance.now()-last<220)return;last=performance.now();this.world?.pulse(e.clientX,e.clientY);},opts);
            const ulti=()=>{if(pet.parentElement?.dataset.petDragged!=='1')this.world?.ultimate();};pet.addEventListener('click',ulti,opts);pet.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();ulti();}},opts);
            this.watch=new MutationObserver(()=>{if(!pet.isConnected)this.clear();});this.watch.observe(document.body,{childList:true,subtree:true});
        }
    };
    // Regular winter items: an independent clockwork snow globe and skating mail trails.
    const regular={
        clear(){this.events?.abort();this.watch?.disconnect();cancelAnimationFrame(this.raf);this.host?.remove();this.aura?.remove();this.film?.remove();if(this.pet){for(const[k,v]of Object.entries(this.saved||{}))v===null?this.pet.removeAttribute(k):this.pet.setAttribute(k,v);this.pet.classList.remove('ewr-pet');}this.pet=null;},
        sync(items={}){this.clear();if(!items.pet&&!items.effect)return;ensureCSS();this.events=new AbortController();const opts={signal:this.events.signal};
            if(items.effect){this.host=stage('ewr-world');regularMarkup(this.host,Array.from({length:12},(_,i)=>`<span class="ewr-letter" style="--i:${i};--x:${(i*29+3)%100}%"><b></b></span>`).join('')+'<div class="ewr-track"></div>');}
            if(items.pet){this.pet=document.getElementById('virtual-pet-img');if(this.pet){this.saved=Object.fromEntries(['title','role','tabindex'].map(k=>[k,this.pet.getAttribute(k)]));this.pet.classList.add('ewr-pet');this.pet.title='Đông Thần · Bưu Trạm Tuyết';this.pet.setAttribute('role','button');this.pet.tabIndex=0;this.aura=stage('ewr-aura',this.pet.parentElement);regularMarkup(this.aura,'<div class="ewr-globe"><i></i><i></i><i></i><i></i></div><div class="ewr-base"></div><span class="ewr-mail">◇</span>');this.pet.addEventListener('click',()=>this.ultimate(),opts);this.pet.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();this.ultimate();}},opts);}}
            const update=()=>{if(this.pet&&!this.pet.isConnected){this.clear();return;}const quiet=suspended()||document.body.classList.contains('wfx-low-power');for(const n of [this.host,this.aura])if(n)n.hidden=quiet;if(quiet)this.film?.remove();};this.watch=new MutationObserver(update);this.watch.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true});document.addEventListener('visibilitychange',update,opts);update();
        },
        ultimate(){if(!this.pet||suspended()||matchMedia('(prefers-reduced-motion: reduce)').matches||performance.now()<(this.ready||0)||this.pet.parentElement?.dataset.petDragged==='1')return;this.ready=performance.now()+8000;this.film?.remove();this.film=stage('ewr-film');regularMarkup(this.film,'<div class="ewr-parcel"><span></span><b>Thư Từ Xứ Tuyết</b></div>'+Array.from({length:8},(_,i)=>`<div class="ewr-letter" style="--i:${i};--x:50%"><b></b></div>`).join(''));this.film.addEventListener('animationend',e=>{if(e.target===this.film)this.film.remove();},{once:true});}
    };
    let cardScenes=[],lastOwned=null;
    function clearCards(){cardScenes.forEach(s=>s.destroy());cardScenes=[];}
    function decorateCards(grid,inventory){clearCards();const card=grid?.querySelector(`[data-item-id="${ID}"]`);if(!card)return;const item=inventory;const owned=Boolean(item)&&(item.isTrial!==true||Number(item.trialExpiry)>Date.now());const state=owned?(item.isEquipped?'active':'owned'):'sealed';const visual=card.querySelector('.luxury-unified-visual');if(!visual)return;ensureCSS();const scene=new WinterScene(visual,{mode:'card',state:lastOwned===false&&owned?'sealed':state});scene.setState(state);lastOwned=owned;cardScenes.push(scene);
    }
    window.EternalWinter={id:'eternal_winter',mount:(target,options)=>new WinterScene(target,options),configure(config){for(const key of Object.keys(settings))if(key in config)settings[key]=config[key];},decorateCards,clearCards,stats:()=>({instances:instances.size,particles:[...instances].reduce((n,s)=>n+s.snow.length+s.shards.length,0),running:[...instances].filter(s=>s.raf).length})};
    window.EternalWinterPremiumRuntime=premium;window.EternalWinterRegularRuntime=regular;ensureCSS();
})();
