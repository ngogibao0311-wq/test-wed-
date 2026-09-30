'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const packages = process.env.WORKSPACE_NODE_MODULES || 'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium} = require(path.join(packages, 'playwright'));
const rewardScript = fs.readFileSync('js/collection-rewards.js', 'utf8');
const mediaScript = fs.readFileSync('js/list-media-performance.js', 'utf8');
const common = fs.readFileSync('js/common.js', 'utf8');
const previewScript = common.slice(common.indexOf('(function () {', common.indexOf('// BỘ XEM TRỰC TIẾP TỆP/LINK TRÊN WEB')), common.indexOf('// Security hotfix: distinct encoders'));
const css = fs.readFileSync('css/collection-rewards.css', 'utf8');
const mock = () => {
    window.rows = {
        'users/s1': {role: 'student', username: 'alice'}, '.info/connected': true,
        collection_reward_catalog: {
            reward_bg_a: {id:'reward_bg_a', name:'Aurora', tag:'Winter', type:'background',value:'https://reward.test/a.png'},
            reward_bg_b: {id:'reward_bg_b', name:'Snow', tag:'Winter', type:'background',value:'https://reward.test/b.png'}
        },
        collection_reward_sets: {winter: {tag:'Winter',required:['hat','coat'],choices:['reward_bg_a','reward_bg_b']}},
        'student_inventory/alice': {hat:{id:'hat',source:'store_purchase',purchaseOperationId:'p1'},coat:{id:'coat',source:'store_purchase',purchaseOperationId:'p2'}},
        'store_charge_receipts/alice': {p1:{kind:'purchase',itemId:'hat'},p2:{kind:'purchase',itemId:'coat'}},
        'collection_unlocks/alice': {}
    };
    window.listeners = {}; window.operations = []; window.authCallback = null; window.autoAccept = true; window.holdClaims = false;
    const snapshot = val => ({val: () => structuredClone(val ?? null), exists: () => val != null});
    window.emit = (key, value) => { rows[key] = structuredClone(value); (listeners[key] || []).forEach(cb => cb(snapshot(value))); };
    const read = key => {
        if (key in rows) return rows[key];
        for (const root of ['collection_unlocks/alice','collection_reward_catalog','collection_reward_sets']) if (key.startsWith(root+'/')) return rows[root]?.[key.slice(root.length+1)];
        return null;
    };
    window.commit = index => {
        const op = operations[index];
        for (const [key, value] of Object.entries(op.updates)) {
            const parent = key.slice(0,key.lastIndexOf('/')), id = key.slice(key.lastIndexOf('/')+1);
            rows[parent] ||= {}; rows[parent][id] = value; emit(parent,rows[parent]);
        }
        op.resolve();
    };
    window.db = {ref(key = '') { return {
        key: key.split('/').pop(),
        on(event, cb) { (listeners[key] ||= []).push(cb); if (!(window.holdClaims && key === 'collection_unlocks/alice')) queueMicrotask(() => cb(snapshot(read(key)))); },
        off(event, cb) { listeners[key] = (listeners[key] || []).filter(x => x !== cb); },
        once() { return Promise.resolve(snapshot(read(key))); },
        push() { return db.ref(key + '/newset'); },
        set(value) { rows[key] = structuredClone(value); const parent = key.slice(0,key.lastIndexOf('/')), id = key.split('/').pop(); if (rows[parent]) {rows[parent][id] = value; emit(parent,rows[parent]);} return Promise.resolve(); },
        update(updates) { return new Promise((resolve,reject) => {operations.push({updates,resolve,reject}); if (autoAccept) queueMicrotask(() => commit(operations.length-1));}); }
    }; }};
    window.firebase = {database: {ServerValue:{TIMESTAMP:1234}},auth: () => ({onAuthStateChanged(cb) {authCallback=cb;queueMicrotask(()=>cb({uid:'s1'}));}})};
    window.StoreConfig = {items:[{id:'hat',name:'Hat',tag:'Winter'},{id:'coat',name:'Coat',tag:'Winter'}]};
    window.StoreManager = {getItemById(id){return StoreConfig.items.find(x=>x.id===id);},applyItem(){return true;},buyItemSafely(){throw Error('Must not buy reward');},trialItemSafely(){throw Error('Must not trial reward');}};
    window.confirm = () => true;
};
(async () => {
    const browser = await chromium.launch({channel:'msedge',headless:true});
    const context = await browser.newContext({viewport:{width:1100,height:820}});
    const errors = [];
    async function pageFor(config = '', script = rewardScript) {
        const page = await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
        await page.route('https://reward.test/**', route => route.request().url().endsWith('.png') ? route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="#6379b6"/><circle cx="600" cy="100" r="50" fill="#e3ecff"/></svg>'}) : route.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body><div id="storeCollectionDropdown"><div class="store-collection-dropdown__clip"></div></div><div id="teacherLuxuryStoreManageCard"></div><div id="assignmentsList"></div></body></html>'}));
        await page.goto('https://reward.test/' + Math.random());
        await page.evaluate(() => localStorage.clear()); await page.evaluate(mock);
        if (config) await page.evaluate(config);
        await page.addStyleTag({content:css}); await page.addScriptTag({content:script});
        return page;
    }
    const choice = await pageFor();
    await choice.locator('#collectionRewardNav').click();
    await choice.getByText('Đã mua 2/2 vật phẩm vĩnh viễn').waitFor();
    assert.equal(await choice.locator('.cr-art > img').count(),0);
    assert.equal(await choice.getByText('Chọn phần thưởng này',{exact:true}).count(),2);
    await choice.evaluate(() => autoAccept=false);
    await choice.getByText('Chọn phần thưởng này',{exact:true}).nth(1).click();
    await choice.waitForFunction(()=>operations.length===1);
    assert.equal(await choice.locator('.cr-art > img').count(),0);
    assert.equal(await choice.evaluate(()=>localStorage.getItem('collectionRewardPending:s1:winter')),'reward_bg_b');
    await choice.evaluate(()=>emit('.info/connected',false));
    await choice.getByText('Mất kết nối — chờ đồng bộ, chưa xác nhận phần thưởng.').waitFor();
    await choice.evaluate(()=>{emit('.info/connected',true);commit(0);});
    await choice.getByText('Đã nhận thưởng cho bộ này').waitFor();
    assert.equal(await choice.locator('.cr-art > img').count(),1);
    assert.equal(await choice.evaluate(()=>operations.length),1);
    console.log('PASS choice, locked artwork, single flight, offline acknowledgement');
    fs.mkdirSync('tests/artifacts',{recursive:true}); await choice.screenshot({path:'tests/artifacts/rewards-student.png'});

    const automatic = await pageFor("rows.collection_reward_sets.winter.choices=['reward_bg_a']; holdClaims=true; autoAccept=false;");
    await automatic.locator('#collectionRewardNav').waitFor(); await automatic.waitForTimeout(80);
    assert.equal(await automatic.evaluate(()=>operations.length),0);
    await automatic.evaluate(()=>emit('collection_unlocks/alice',{}));
    await automatic.waitForFunction(()=>operations.length===1);
    await automatic.evaluate(()=>operations[0].reject(Object.assign(Error('Permission denied'),{code:'PERMISSION_DENIED'})));
    await automatic.waitForTimeout(100); assert.equal(await automatic.evaluate(()=>operations.length),1);
    await automatic.locator('#collectionRewardNav').click();
    await automatic.getByText('Kiểm tra / thử lại',{exact:true}).click();
    await automatic.waitForFunction(()=>operations.length===2); await automatic.evaluate(()=>commit(1));
    console.log('PASS waits for all snapshots, automatic reward, no permission retry loop');

    const recovery = await pageFor("localStorage.setItem('collectionRewardPending:s1:winter','reward_bg_b');autoAccept=false;");
    await recovery.waitForFunction(()=>operations.length===1);
    assert.equal(await recovery.evaluate(()=>operations[0].updates['collection_unlocks/alice/winter'].itemId),'reward_bg_b');
    console.log('PASS saved choice recovery');

    const teacher = await pageFor("rows['users/s1']={role:'teacher',username:'teacher'};");
    await teacher.locator('.cr-teacher-entry').click();
    await teacher.locator('#crSetTag').fill('Mùa đông');
    await teacher.locator('.cr-option input[value="hat"]').check();
    await teacher.evaluate(()=>emit('collection_reward_sets',rows.collection_reward_sets));
    await teacher.waitForTimeout(60); assert.equal(await teacher.locator('#crSetTag').inputValue(),'Mùa đông');
    await teacher.locator('.cr-option input[value="reward_bg_a"]').check();
    await teacher.getByText('Công bố bộ thưởng',{exact:true}).click();
    await teacher.getByText('Đã công bố bộ thưởng.',{exact:true}).waitFor();
    assert.equal(await teacher.evaluate(()=>rows.collection_reward_sets.newset.tag),'Mùa đông');
    await teacher.setViewportSize({width:390,height:844}); await teacher.screenshot({path:'tests/artifacts/rewards-teacher-mobile.png'});
    console.log('PASS teacher form survives realtime events and publishes');

    const media = await pageFor('',mediaScript);
    const preparation = await media.evaluate(()=>{
        const html='<img src="/asset.png"><iframe src="/video"></iframe><audio src="/sound"></audio>';
        const off=ListMediaPerformance.prepareHTML(html); document.body.classList.add('perf-balanced');
        const on=ListMediaPerformance.prepareHTML(html);
        document.querySelector('#assignmentsList').style.marginTop='6000px';
        document.querySelector('#assignmentsList').innerHTML=on;
        return {off,on};
    });
    assert.ok(!preparation.off.includes('data-perf-src'));
    assert.ok(preparation.on.includes('data-perf-src')); assert.ok(preparation.on.includes('preload="none"'));
    await media.waitForTimeout(80);
    assert.equal(await media.locator('#assignmentsList img').getAttribute('src'),null);
    await media.locator('#assignmentsList').scrollIntoViewIfNeeded();
    await media.waitForFunction(()=>document.querySelector('#assignmentsList img').hasAttribute('src'));
    await media.evaluate(()=>{document.querySelector('#assignmentsList').innerHTML=ListMediaPerformance.prepareHTML('<img src="/next.png">');document.body.classList.remove('perf-balanced');window.dispatchEvent(new Event('web-performance-optimizer-change'));});
    await media.waitForFunction(()=>document.querySelector('#assignmentsList img').getAttribute('src')==='/next.png');
    console.log('PASS deferred network media, near-view hydration, toggle-off restore');

    const preview = await pageFor('',previewScript);
    await preview.evaluate(()=>{
        window.pendingDocs=[]; window.docFetches=0;
        window.fetch=async()=>{docFetches++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};};
        window.mammoth={convertToHtml:()=>new Promise(resolve=>pendingDocs.push(resolve))};
        window.buildFilePreviewHTML({url:'https://reward.test/one.docx',name:'one.docx'});
        window.buildFilePreviewHTML({url:'https://reward.test/two.docx',name:'two.docx'});
        window.keys=Object.keys(window.__filePreviewRegistry);
        openFilePreview(keys[0]);openFilePreview(keys[0]);
    });
    await preview.waitForFunction(()=>pendingDocs.length===1);
    assert.equal(await preview.evaluate(()=>docFetches),1);
    await preview.evaluate(()=>{openFilePreview(keys[1]);});
    await preview.waitForFunction(()=>pendingDocs.length===2);
    await preview.evaluate(()=>pendingDocs[1]({value:'<p>SECOND</p>',messages:[]}));
    await preview.getByText('SECOND',{exact:true}).waitFor();
    await preview.evaluate(()=>pendingDocs[0]({value:'<p>FIRST</p>',messages:[]}));
    await preview.waitForTimeout(50);
    assert.equal(await preview.getByText('FIRST',{exact:true}).count(),0);
    console.log('PASS DOCX repeated click and stale response isolation');
    assert.deepEqual(errors,[]);
    await browser.close(); console.log('All browser checks passed.');
})().catch(error=>{console.error(error);process.exit(1);});
