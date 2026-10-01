const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.WORKSPACE_NODE_MODULES||'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','playwright'));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];const geometry=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='campus.test')return route.abort();let f=decodeURIComponent(u.pathname).slice(1);if(!f||f.includes('..')||!fs.existsSync(f))return route.fulfill({status:404,body:''});let b=fs.readFileSync(f);if(f.endsWith('.html'))b=b.toString().replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');return route.fulfill({body:b,contentType:f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'application/octet-stream'});});
 for(const role of ['student','teacher']){
  await page.goto('https://campus.test/'+role+'.html');
  await page.evaluate(role=>{document.documentElement.dataset.appRole=role;document.querySelectorAll('[id*="Loader"],[id*="loader"]').forEach(e=>e.remove());document.querySelectorAll('.modal-overlay,.student-modal-overlay').forEach(e=>{e.classList.remove('active');e.style.display='none'});},role);
  for(const f of ['campus-design','web-animations','app-dialog'])await page.addScriptTag({content:fs.readFileSync('js/'+f+'.js','utf8')});
  if(role==='student'){
   await page.evaluate(()=>{window.isStudentStoreGameAccessEnabled=()=>false;window.applyStudentProfileButtonBaseVisual=()=>{};window.releaseStudentProfileButtonBaseVisualForFrame=()=>{};});
   const src=fs.readFileSync('js/student.js','utf8'),start=src.indexOf('(function installStudentTopActionsFlow()');
   await page.addScriptTag({content:src.slice(start,src.indexOf('})();',start)+5)});
  }
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.campusPalette),'default');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(244, 246, 251)');
  const tabs=await page.locator('.content>.tab-content').evaluateAll(es=>es.map(e=>e.id));
  for(const id of tabs){await page.evaluate(id=>{document.querySelectorAll('.content>.tab-content').forEach(t=>t.classList.toggle('active',t.id===id));},id);await page.waitForTimeout(230);const w=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:innerWidth}));assert.ok(w.scroll<=w.view+2,role+' overflow '+id+JSON.stringify(w));}
  await page.evaluate(()=>{document.querySelectorAll('.content>.tab-content').forEach((t,i)=>t.classList.toggle('active',i===0));const tab=document.querySelector('.tab-content.active');tab.insertAdjacentHTML('beforeend','<div class="card" id="designProbe"><h3>Kiểm tra giao diện</h3><p>Nội dung rõ ràng và thống nhất.</p><button id="designButton">Lưu thay đổi</button><input placeholder="Tìm kiếm"><table><thead><tr><th>Học sinh</th><th>Trạng thái</th></tr></thead><tbody><tr><td>Nguyễn Minh Anh</td><td>Đã hoàn thành</td></tr></tbody></table></div>');});
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#designButton').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(88, 101, 216)');
  geometry.push(await page.evaluate(()=>{const side=document.querySelector('.sidebar').getBoundingClientRect(),nav=document.querySelector('.nav-item').getBoundingClientRect();return {x:side.x,y:side.y,width:side.width,navHeight:nav.height,navY:nav.y};}));
  assert.ok((await page.locator('.campus-page-title').first().boundingBox()).y<65,role+' no empty header band');
  const common=fs.readFileSync('js/common.js','utf8');
  await page.addScriptTag({content:common.slice(common.indexOf('window.changeTheme ='),common.indexOf('// 4. Tự động áp dụng giao diện'))});
  for(const [theme,color] of [['blue','rgb(40, 117, 190)'],['green','rgb(39, 131, 102)'],['pink','rgb(183, 76, 130)'],['default','rgb(88, 101, 216)']]){
   await page.evaluate(theme=>changeTheme(theme,false),theme);await page.waitForTimeout(300);
   assert.equal(await page.locator('#designButton').evaluate(e=>getComputedStyle(e).backgroundColor),color,role+' display theme '+theme);
  }
  if(role==='student'){
   const src=fs.readFileSync('js/student.js','utf8');
   await page.addScriptTag({content:'var currentUser={username:"layout-test"};'+src.slice(src.indexOf('function getStudentContentGlassStorageKey()'),src.indexOf('function initializeStudentContentGlassSetting()'))});
  }
  const glassButton='#toggle'+(role==='student'?'Student':'Teacher')+'ContentGlassButton';
  for(const enabled of [false,true]){
   await page.locator(glassButton).evaluate(e=>e.click());await page.waitForTimeout(30);
   await page.evaluate(()=>document.querySelector(".app-dialog-host")?.shadowRoot?.querySelector("button")?.click());
   const glass=await page.locator('.dashboard>.content').evaluate(e=>{const s=getComputedStyle(e,'::before');return {display:s.display,blur:s.backdropFilter,height:parseFloat(s.height),contentHeight:e.getBoundingClientRect().height};});
   assert.equal(glass.display,enabled?'block':'none',role+' glass visibility');
   if(enabled){assert.match(glass.blur,/blur\(24px\)/);assert.ok(Math.abs(glass.height-glass.contentHeight)<4,role+' glass spans entire content');}
  }
  assert.equal(await page.locator('#designProbe h3').evaluate(e=>getComputedStyle(e).color),'rgb(34, 49, 77)');
  fs.mkdirSync('tests/artifacts',{recursive:true});await page.screenshot({path:`tests/artifacts/campus-${role}-desktop.png`});
  await page.evaluate(()=>document.querySelector('.dashboard').classList.add('collapsed'));
  await page.waitForTimeout(250);let side=await page.locator('.sidebar').boundingBox();assert.ok(side.width<100);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);
  if(role==='student'){
   await page.locator('#studentCoinBalance').evaluate(e=>e.textContent='809.344');
   const dock=await page.locator('#studentTopActionsFlow').boundingBox();assert.ok(dock.x>=55&&dock.x+dock.width<=391,'mobile action dock fits beside menu');if(dock.height>50)console.log(await page.locator('#studentTopActionsFlow').evaluate(e=>[e,...e.querySelectorAll(':scope>*')].map(n=>({id:n.id,cls:n.className,h:n.getBoundingClientRect().height,min:getComputedStyle(n).minHeight,max:getComputedStyle(n).maxHeight,css:n.style.cssText}))));assert.ok(dock.height<=50,'coin must not stretch header');
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),role+' mobile overflow');
  await page.screenshot({path:`tests/artifacts/campus-${role}-mobile.png`});
  await page.setViewportSize({width:1440,height:960});
  // Install real theme manager and CSS, switch through all defined themes.
  if(role==='student'){
   await page.addScriptTag({content:fs.readFileSync('js/theme-items.js','utf8')});
   for(const file of ['store-items','premium-mua-xuan','nyx-than-thoai','aether-than-thoai','tamon-b-side','premium-hac-mong','cam-co-cam-mong','trung-thu-nguyet-cung'])await page.addStyleTag({url:'https://campus.test/css/'+file+'.css'});
   const themeIds=await page.evaluate(()=>Object.keys(ThemeManager.themes));
   for(const id of themeIds){await page.evaluate(id=>ThemeManager.applyTheme(id),id);await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>document.documentElement.dataset.campusPalette),id==='default'?'default':'custom',id);const b=await page.locator('.sidebar').boundingBox();assert.ok(b.width<100&&b.x>=0,id+' sidebar');assert.ok(await page.evaluate(()=>document.querySelector('.content').getBoundingClientRect().right<=innerWidth+2),id+' content overflow');}
   await page.evaluate(()=>{ThemeManager.applyTheme('default');document.documentElement.classList.add('summer-solstice-equipped','lux10-summer-equipped');});await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.campusPalette),'custom');
   await page.screenshot({path:'tests/artifacts/campus-premium-compatible.png'});
   await page.evaluate(()=>{document.documentElement.classList.remove('summer-solstice-equipped','lux10-summer-equipped');document.body.classList.add('store-background-equipped');document.body.style.setProperty('background-image','url("https://campus.test/assets/Premium/Poster/xuan.png")','important');});await page.waitForTimeout(60);
   assert.match(await page.evaluate(()=>getComputedStyle(document.body).backgroundImage),/xuan.png/);
   assert.equal(await page.locator('#wfx-web-animation-layer').evaluate(e=>getComputedStyle(e).display),'none');
   console.log('PASS '+themeIds.length+' actual theme switches + luxury skin + reward background preservation');
  }
  console.log('PASS '+role+': '+tabs.length+' tabs, palette, desktop/mobile, collapsed geometry');
 }
 assert.deepEqual(geometry[0],geometry[1],'Both sidebars use the same geometry');
 // Replay animation, low quality independence, reduced motion and settings persistence.
 await page.evaluate(()=>{WebAnimationSystem.enable();document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));});await page.waitForTimeout(60);
 await page.evaluate(()=>document.querySelector('.content>.tab-content').classList.add('active'));await page.waitForTimeout(40);
 assert.ok(await page.evaluate(()=>document.querySelector('.content>.tab-content').getAnimations().length>0));
 await page.evaluate(()=>document.documentElement.classList.add('fxq-low'));await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>WebAnimationSystem.getState().enabled),true);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>WebAnimationSystem.getState().reducedMotion);assert.equal(await page.evaluate(()=>WebAnimationSystem.getState().reducedMotion),true);assert.equal(await page.evaluate(()=>document.querySelector('.content>.tab-content').getAnimations().length),0);
 assert.deepEqual(errors,[]);console.log('PASS motion replay, low quality, reduced motion, no script errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});



