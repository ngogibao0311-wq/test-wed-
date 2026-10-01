const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.WORKSPACE_NODE_MODULES||'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','playwright'));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];const geometry=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='campus.test')return route.abort();let f=decodeURIComponent(u.pathname).slice(1);if(!f||f.includes('..')||!fs.existsSync(f))return route.fulfill({status:404,body:''});let b=fs.readFileSync(f);if(f.endsWith('.html'))b=b.toString().replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');return route.fulfill({body:b,contentType:f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'application/octet-stream'});});

 await page.goto('https://campus.test/student.html');
 await page.evaluate(()=>{document.documentElement.dataset.appRole='student';document.querySelectorAll('[id*="Loader"],[id*="loader"]').forEach(e=>e.remove());document.querySelectorAll('.tab-content').forEach(e=>e.classList.toggle('active',e.id==='tab-store'));window.StoreConfig={items:[{id:'star',name:'Star fixture',tag:'Đêm đầy sao',type:'background',price:100},{id:'click',name:'Click fixture',tag:'Link Click',type:'background',price:100}]};});
 await page.addStyleTag({url:'https://campus.test/css/store-collections.css'});
 for(const f of ['campus-design','store-collections'])await page.addScriptTag({content:fs.readFileSync('js/'+f+'.js','utf8')});
 await page.evaluate(()=>{const clip=document.querySelector('.store-collection-dropdown__clip');for(const label of ['Phần thưởng','Cửa hàng sang trọng']){let b=clip.firstElementChild.cloneNode(true);b.removeAttribute('id');b.querySelector('strong').textContent=label;clip.append(b);}StoreCollectionPage.toggleMenu();});
 await page.waitForTimeout(500);
 const buttons=await page.locator('.store-collection-dropdown__item').evaluateAll(es=>es.map(e=>({y:e.getBoundingClientRect().y,h:e.getBoundingClientRect().height})));
 assert.equal(buttons.length,3);assert.ok(buttons.every(e=>e.h<=56&&Math.abs(e.y-buttons[0].y)<2),JSON.stringify(buttons));
 const arrow=await page.locator('#storeCollectionArrow').boundingBox(),heading=await page.locator('.store-collection-title-row h2').boundingBox();assert.ok(arrow.width<=32&&arrow.x-heading.x-heading.width<15);
 await page.screenshot({path:'tests/artifacts/store-compact-desktop.png'});
 await page.evaluate(()=>StoreCollectionPage.open());
 await page.locator('[data-collection-id="painting"]').click();assert.match(await page.locator('#storeCollectionGrid').innerText(),/Star fixture/);assert.doesNotMatch(await page.locator('#storeCollectionGrid').innerText(),/Click fixture/);
 await page.locator('[data-collection-id="link-click"]').click();assert.match(await page.locator('#storeCollectionGrid').innerText(),/Click fixture/);

 // Real collection render must not drag the document back to its category rail.
 await page.evaluate(()=>{for(let i=0;i<45;i++)StoreConfig.items.push({id:'scroll-'+i,name:'Scroll fixture '+i,tag:'Link Click',type:'background',price:100});StoreCollectionPage.refresh();});
 await page.waitForTimeout(500);await page.evaluate(()=>window.scrollTo({top:1200,behavior:'instant'}));await page.waitForTimeout(100);
 const beforeRefresh=await page.evaluate(()=>scrollY);assert.ok(beforeRefresh>500);
 for(let i=0;i<3;i++){await page.evaluate(()=>StoreCollectionPage.refresh());await page.waitForTimeout(350);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-beforeRefresh)<3,'background refresh preserves reading position');}
 await page.evaluate(()=>{StoreCollectionPage.close();StoreCollectionPage.toggleMenu();});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await page.screenshot({path:'tests/artifacts/store-compact-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS compact store menu desktop/mobile, arrow placement, painting and Link Click filters');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
