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
        for (const root of ['collection_unlocks/alice','collection_reward_catalog','collection_reward_sets','student_inventory/alice','collection_reward_purchases/alice']) if (key.startsWith(root+'/')) return rows[root]?.[key.slice(root.length+1)];
        return null;
    };
    window.commit = index => {
        const op = operations[index];
        for (const [key, value] of Object.entries(op.updates)) {
            const parent = key.slice(0,key.lastIndexOf('/')), id = key.slice(key.lastIndexOf('/')+1);
            rows[parent] ||= {}; rows[parent][id] = value; emit(parent,rows[parent]);
            if (parent === 'student_coins' || parent === 'collection_reward_payments') rows[key] = value;
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
        async transaction(change) {
            const next = change(structuredClone(read(key)));
            if (next === undefined) return {committed:false, snapshot:snapshot(read(key))};
            await this.set(next); return {committed:true, snapshot:snapshot(next)};
        },
        update(updates) { return new Promise((resolve,reject) => {operations.push({updates,resolve,reject}); if (autoAccept) queueMicrotask(() => commit(operations.length-1));}); }
    }; }};
    window.firebase = {database: {ServerValue:{TIMESTAMP:1234}},auth: () => ({onAuthStateChanged(cb) {authCallback=cb;queueMicrotask(()=>cb({uid:'s1'}));}})};
    window.StoreConfig = {items:[{id:'hat',name:'Hat',tag:'Winter'},{id:'coat',name:'Coat',tag:'Winter'}]};
    window.StoreManager = {getItemById(id){return StoreConfig.items.find(x=>x.id===id);},applyItem(){return true;},buyItemSafely(){throw Error('Must not buy reward');},trialItemSafely(){throw Error('Must not trial reward');}};
    window.AppDialog = {confirm: async () => true, alert: async () => {}, notify: () => {}};
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
    await choice.getByText('Đã sở hữu 2/2 vật phẩm vĩnh viễn').waitFor();
    assert.equal(await choice.locator('.cr-art > img').count(),0);
    assert.equal(await choice.getByText('Chọn phần thưởng này',{exact:true}).count(),2);
    await choice.evaluate(() => autoAccept=false);
    await choice.getByText('Chọn phần thưởng này',{exact:true}).nth(1).click();
    assert.equal(await choice.evaluate(()=>operations.length),0);
    assert.equal(await choice.locator('.cr-art > img').count(),0);
    await choice.getByText('Nhận phần thưởng',{exact:true}).click();
    await choice.waitForFunction(()=>operations.length===1);
    assert.equal(await choice.locator('.cr-art > img').count(),0);
    assert.equal(await choice.evaluate(()=>localStorage.getItem('collectionRewardPending:s1:winter')),'reward_bg_b');
    await choice.evaluate(()=>emit('.info/connected',false));
    await choice.getByText('Mất kết nối — chờ đồng bộ, chưa xác nhận phần thưởng.').waitFor();
    await choice.evaluate(()=>{emit('.info/connected',true);commit(0);});
    await choice.getByText('Đã nhận thưởng cho bộ này').waitFor();
    assert.equal(await choice.locator('.cr-art > img').count(),1);
    assert.equal(await choice.evaluate(()=>operations.length),1);
    await choice.evaluate(()=>emit('collection_reward_sets',{winter:{...rows.collection_reward_sets.winter,deleted:true,revision:1}}));
    await choice.getByText('Nền đã nhận — vẫn được giữ khi bộ bị sửa hoặc xóa.',{exact:true}).waitFor();
    assert.equal(await choice.getByText('Sử dụng nền',{exact:true}).count(),1);
    assert.equal(await choice.getByText('Nhận phần thưởng',{exact:true}).count(),0);
    console.log('PASS choice, locked artwork, single flight, offline acknowledgement');
    fs.mkdirSync('tests/artifacts',{recursive:true}); await choice.screenshot({path:'tests/artifacts/rewards-student.png'});

    const automatic = await pageFor("rows.collection_reward_sets.winter.choices=['reward_bg_a']; holdClaims=true; autoAccept=false;");
    await automatic.locator('#collectionRewardNav').waitFor(); await automatic.waitForTimeout(80);
    assert.equal(await automatic.evaluate(()=>operations.length),0);
    await automatic.evaluate(()=>emit('collection_unlocks/alice',{}));
    await automatic.locator('#collectionRewardNav').click();
    await automatic.getByText('Nhận phần thưởng',{exact:true}).waitFor();
    assert.equal(await automatic.evaluate(()=>operations.length),0);
    assert.equal(await automatic.locator('.cr-art > img').count(),0);
    await automatic.getByText('Nhận phần thưởng',{exact:true}).click();
    await automatic.waitForFunction(()=>operations.length===1);
    await automatic.evaluate(()=>operations[0].reject(Object.assign(Error('Permission denied'),{code:'PERMISSION_DENIED'})));
    await automatic.waitForTimeout(100); assert.equal(await automatic.evaluate(()=>operations.length),1);
    await automatic.locator('#collectionRewardNav').click();
    await automatic.getByText('Kiểm tra / thử lại',{exact:true}).click();
    await automatic.waitForFunction(()=>operations.length===2); await automatic.evaluate(()=>commit(1));
    console.log('PASS waits for all snapshots, explicit receive, no permission retry loop');

    const recovery = await pageFor("localStorage.setItem('collectionRewardPending:s1:winter','reward_bg_b');autoAccept=false;");
    await recovery.locator('#collectionRewardNav').click();
    await recovery.getByText('Kiểm tra / thử lại',{exact:true}).waitFor();
    assert.equal(await recovery.evaluate(()=>operations.length),0);
    await recovery.evaluate(()=>{emit('.info/connected',false);emit('.info/connected',true);});
    await recovery.waitForTimeout(60);
    assert.equal(await recovery.evaluate(()=>operations.length),0);
    await recovery.getByText('Kiểm tra / thử lại',{exact:true}).click();
    await recovery.waitForFunction(()=>operations.length===1);
    assert.equal(await recovery.evaluate(()=>operations[0].updates['collection_unlocks/alice/winter'].itemId),'reward_bg_b');
    console.log('PASS saved choice recovery');

    const buyConfig = `
        rows['student_coins/alice']=10000;
        rows['student_inventory/alice'].reward_bg_a={id:'reward_bg_a',type:'background',source:'collection_reward',isEquipped:false};
        rows['collection_unlocks/alice'].winter={itemId:'reward_bg_a',studentUid:'s1'};
    `;
    const purchasePage = await pageFor(buyConfig+'autoAccept=false;');
    await purchasePage.locator('#collectionRewardNav').click();
    await purchasePage.getByText('Mua nền · 5.000 Coin',{exact:true}).waitFor();
    await purchasePage.screenshot({path:'tests/artifacts/rewards-buy-remaining.png'});
    await purchasePage.locator('.cr-buy').evaluate(button=>{button.click();button.click();});
    await purchasePage.waitForFunction(()=>operations.length===1);
    assert.equal(await purchasePage.locator('.cr-art > img').count(),1);
    await purchasePage.evaluate(()=>{emit('.info/connected',false);emit('.info/connected',true);});
    assert.equal(await purchasePage.evaluate(()=>operations.length),1);
    await purchasePage.evaluate(()=>commit(0));
    await purchasePage.getByText('Đã mua nền với giá 5.000 Coin. Bạn có thể sử dụng nền.',{exact:true}).waitFor();
    assert.equal(await purchasePage.evaluate(()=>rows['student_coins/alice']),5000);
    assert.equal(await purchasePage.locator('.cr-art > img').count(),2);
    assert.equal(await purchasePage.locator('.cr-buy').count(),0);
    assert.equal(await purchasePage.getByText('Sử dụng nền',{exact:true}).count(),2);
    const poor = await pageFor(buyConfig+"rows['student_coins/alice']=4999;");
    await poor.locator('#collectionRewardNav').click();await poor.locator('.cr-buy').click();
    await poor.locator('.cr-notice').filter({hasText:'Cần ít nhất 5.000 Coin'}).waitFor();
    assert.equal(await poor.evaluate(()=>operations.length),0);
    const recoverBuy = await pageFor(buyConfig+`
        localStorage.setItem('collectionRewardPurchase:s1:reward_bg_b',JSON.stringify({setId:'winter'}));
        rows['collection_reward_purchases/alice']={reward_bg_b:{itemId:'reward_bg_b'}};
    `);
    await recoverBuy.locator('#collectionRewardNav').click();
    await recoverBuy.getByText('Kiểm tra mua · 5.000 Coin',{exact:true}).click();
    await recoverBuy.locator('.cr-notice').filter({hasText:'Không trừ Coin lần nữa'}).waitFor();
    assert.equal(await recoverBuy.evaluate(()=>operations.length),0);
    const changedSale = await pageFor(buyConfig+"rows.collection_reward_sets.winter.choices=['reward_bg_b'];");
    await changedSale.locator('#collectionRewardNav').click();
    await changedSale.getByText('Bộ đã thay đổi. Nền này không mở bán theo lượt nhận trước của bạn.',{exact:true}).waitFor();
    assert.equal(await changedSale.locator('.cr-buy').count(),0);
    console.log('PASS paid remaining reward: single flight, 5000 debit, offline confirmation, insufficient balance, receipt recovery');

    const equipment = await pageFor(`
        rows['student_inventory/alice'].reward_bg_a={id:'reward_bg_a',source:'collection_reward',type:'background',isEquipped:true};
        rows['collection_unlocks/alice'].winter={itemId:'reward_bg_a'};
        window.CollectionRewardCatalog=[{id:'reward_bg_a',tag:'Mùa Xuân',tagImage:'assets/Premium/Bốn mùa/tag-mua-xuan.png'}];
        window.equipCalls=[];
        StoreManager.applyItem=async id=>{equipCalls.push('on');rows['student_inventory/alice'][id].isEquipped=true;emit('student_inventory/alice',rows['student_inventory/alice']);return true;};
        StoreManager.unapplyItem=async id=>{equipCalls.push('off');rows['student_inventory/alice'][id].isEquipped=false;emit('student_inventory/alice',rows['student_inventory/alice']);return true;};
    `);
    await equipment.locator('#collectionRewardNav').click();
    await equipment.getByText('Tháo nền',{exact:true}).waitFor();
    assert.ok((await equipment.locator('.cr-tag-image img').getAttribute('src')).endsWith('/tag-mua-xuan.png'));
    await equipment.getByText('Tháo nền',{exact:true}).click();
    await equipment.getByText('Sử dụng nền',{exact:true}).click();
    await equipment.getByText('Tháo nền',{exact:true}).waitFor();
    assert.deepEqual(await equipment.evaluate(()=>equipCalls),['off','on']);
    console.log('PASS image tag and equip/remove reward background toggle');

    const springConfig = `
        const springItems = [
            ['pet_premium_mua_xuan','Tiểu Hoa Mộng','teacher_gift'],
            ['effect_premium_mua_xuan','Xuân Tửu Hoa Viên','event_reward'],
            ['theme_mua_xuan_thanh_minh','Thanh Minh Xuân Phổ','lucky_wheel'],
            ['frame_premium_mua_xuan_hoa_mong','Hoa Mộng · Vạn Sinh Chi Hoàn',null],
            ['background_premium_mua_xuan_hoa_mong','Hoa Mộng · Vạn Sinh Thần Viên','store_purchase'],
            ['pet_luxury_mua_xuan','Xuân Thần · Vạn Sinh Hoa Mộng','legacy_purchase']
        ];
        rows.collection_reward_sets.winter={tag:'Mùa Xuân',required:springItems.map(x=>x[0]),choices:['reward_bg_a','reward_bg_b']};
        rows['student_inventory/alice']=Object.fromEntries(springItems.map(([id,name,source])=>[id,{id,isTrial:false,...(source?{source}:{})}]));
        StoreConfig.items=springItems.map(([id,name])=>({id,name,tag:'Mùa xuân'}));
        delete rows['store_charge_receipts/alice'];
    `;
    const springChoice = await pageFor(springConfig);
    await springChoice.locator('#collectionRewardNav').click();
    await springChoice.getByText('Đã sở hữu 6/6 vật phẩm vĩnh viễn').waitFor();
    assert.equal(await springChoice.getByText('Chọn phần thưởng này',{exact:true}).count(),2);
    assert.equal(await springChoice.evaluate(()=>!!listeners['store_charge_receipts/alice']),false);
    await springChoice.getByText('Chọn phần thưởng này',{exact:true}).nth(1).click();
    assert.equal(await springChoice.evaluate(()=>operations.length),0);
    await springChoice.getByText('Nhận phần thưởng',{exact:true}).click();
    await springChoice.getByText('Đã nhận thưởng cho bộ này').waitFor();
    assert.equal(await springChoice.evaluate(()=>rows['collection_unlocks/alice'].winter.itemId),'reward_bg_b');
    const springAuto = await pageFor(springConfig + "rows.collection_reward_sets.winter.choices=['reward_bg_a'];");
    await springAuto.locator('#collectionRewardNav').click();
    await springAuto.getByText('Nhận phần thưởng',{exact:true}).waitFor();
    assert.equal(await springAuto.evaluate(()=>operations.length),0);
    await springAuto.getByText('Nhận phần thưởng',{exact:true}).click();
    await springAuto.waitForFunction(()=>!!rows['collection_unlocks/alice'].winter);
    assert.equal(await springAuto.evaluate(()=>operations.length),1);
    const springTrial = await pageFor(springConfig + "rows['student_inventory/alice'].pet_luxury_mua_xuan.isTrial=true;");
    await springTrial.locator('#collectionRewardNav').click();
    await springTrial.getByText('Đã sở hữu 5/6 vật phẩm vĩnh viễn').waitFor();
    assert.equal(await springTrial.getByText('Chọn phần thưởng này',{exact:true}).count(),0);
    assert.equal(await springTrial.evaluate(()=>operations.length),0);
    console.log('PASS Spring 6/6 mixed permanent ownership: choice/single explicit receive, trial excluded');

    const teacher = await pageFor("rows['users/s1']={role:'teacher',username:'teacher'}; rows.collection_reward_sets.winter.choices=['reward_bg_b']; window.CollectionRewardCatalog=[{...rows.collection_reward_catalog.reward_bg_a,tag:'Mùa đông'}];");
    await teacher.locator('.cr-teacher-entry').click();
    assert.equal(await teacher.locator('#crSetTag').count(),0);
    assert.equal(await teacher.locator('#crRewardChoices input[value="reward_bg_b"]').count(),0);
    await teacher.locator('.cr-option input[value="hat"]').check();
    await teacher.evaluate(()=>emit('collection_reward_sets',rows.collection_reward_sets));
    await teacher.waitForTimeout(60); assert.equal(await teacher.locator('.cr-option input[value="hat"]').isChecked(),true);
    await teacher.locator('.cr-option input[value="reward_bg_a"]').check();
    await teacher.getByText('Công bố bộ thưởng',{exact:true}).click();
    await teacher.getByText('Đã công bố bộ thưởng.',{exact:true}).waitFor();
    assert.equal(await teacher.evaluate(()=>rows.collection_reward_sets.newset.tag),'Mùa đông');
    assert.equal(await teacher.locator('#crRewardChoices input').count(),0);
    await teacher.locator('[data-set-id="newset"]').getByText('Sửa',{exact:true}).click();
    assert.equal(await teacher.locator('#crRewardChoices input[value="reward_bg_a"]').isChecked(),true);
    assert.equal(await teacher.locator('#crRewardChoices input[value="reward_bg_b"]').count(),0);
    assert.equal(await teacher.locator('.cr-option input[value="hat"]').isChecked(),true);
    await teacher.locator('.cr-option input[value="coat"]').check();
    await teacher.getByText('Lưu thay đổi',{exact:true}).click();
    await teacher.getByText('Đã lưu thay đổi bộ thưởng.',{exact:true}).waitFor();
    assert.equal(await teacher.evaluate(()=>rows.collection_reward_sets.newset.revision),2);
    assert.deepEqual(await teacher.evaluate(()=>rows.collection_reward_sets.newset.required),['hat','coat']);
    // A teacher editing an older revision must not overwrite another teacher's save.
    await teacher.locator('[data-set-id="newset"]').getByText('Sửa',{exact:true}).click();
    await teacher.evaluate(()=>{
        rows.collection_reward_sets.newset={...rows.collection_reward_sets.newset,tag:'Concurrent edit',revision:3,mutationId:'other-operation'};
        delete rows['collection_reward_sets/newset']; emit('collection_reward_sets',rows.collection_reward_sets);
    });
    await teacher.getByText('Lưu thay đổi',{exact:true}).click();
    await teacher.locator('.cr-notice').filter({hasText:'phiên khác'}).waitFor();
    assert.equal(await teacher.evaluate(()=>rows.collection_reward_sets.newset.tag),'Concurrent edit');
    await teacher.locator('[data-set-id="newset"]').getByText('Xóa',{exact:true}).click();
    await teacher.locator('.cr-notice').filter({hasText:'Đã xóa bộ'}).waitFor();
    assert.equal(await teacher.locator('[data-set-id="newset"]').count(),0);
    assert.equal(await teacher.evaluate(()=>rows.collection_reward_sets.newset.deleted),true);
    assert.equal(await teacher.locator('#crRewardChoices input[value="reward_bg_a"]').count(),1);
    await teacher.setViewportSize({width:390,height:844}); await teacher.screenshot({path:'tests/artifacts/rewards-teacher-mobile.png'});
    console.log('PASS teacher publish/edit/delete, preserved form, concurrent edit rejected');

    const longLists = await pageFor(`
        rows['users/s1']={role:'teacher',username:'teacher'};
        for(let i=0;i<20;i++) {
            rows.collection_reward_catalog['reward_bg_extra'+i]={...rows.collection_reward_catalog.reward_bg_a,id:'reward_bg_extra'+i,name:'Extra '+i};
            rows.collection_reward_sets['extra'+i]={tag:'Set '+i,required:['hat'],choices:['reward_bg_b']};
        }
    `);
    await longLists.locator('.cr-teacher-entry').click();
    for(const selector of ['#crRewardChoices','#crPublishedSets']) {
        assert.equal(await longLists.locator(selector).evaluate(node=>node.scrollHeight>node.clientHeight && getComputedStyle(node).overflowY==='auto'),true);
        assert.ok(await longLists.locator(selector).evaluate(node=>node.clientHeight)<=300);
    }
    // A newly published reward disappears without clearing selected requirements.
    await longLists.locator('.cr-option input[value="hat"]').check();
    await longLists.locator('#crRewardChoices input[value="reward_bg_extra0"]').check();
    await longLists.evaluate(()=>emit('collection_reward_sets',{...rows.collection_reward_sets,remote:{tag:'Remote',required:['hat'],choices:['reward_bg_extra0']}}));
    await longLists.waitForFunction(()=>!document.querySelector('#crRewardChoices input[value="reward_bg_extra0"]'));
    assert.equal(await longLists.locator('.cr-option input[value="hat"]').isChecked(),true);
    console.log('PASS code tags, published rewards filtered, editing restores own rewards, long lists scroll');

    const changed = await pageFor();
    await changed.locator('#collectionRewardNav').click();
    await changed.getByText('Chọn phần thưởng này',{exact:true}).first().click();
    await changed.evaluate(()=>emit('collection_reward_sets',{winter:{...rows.collection_reward_sets.winter,revision:1}}));
    await changed.waitForFunction(()=>document.querySelector('.cr-receive')?.disabled);
    assert.equal(await changed.evaluate(()=>operations.length),0);
    assert.equal(await changed.getByText('Đã chọn',{exact:true}).count(),0);
    console.log('PASS changed configuration requires selecting again');

    const retryTeacher = await pageFor(`
        rows['users/s1']={role:'teacher',username:'teacher'};
        const value={...rows.collection_reward_sets.winter,deleted:true,revision:1,createdAt:1234,updatedAt:1234,mutationId:'saved-delete-operation'};
        rows.collection_reward_sets.winter=value;
        localStorage.setItem('collectionRewardDraft:s1',JSON.stringify({id:'winter',mode:'delete',baseRevision:0,mutationId:value.mutationId,value}));
    `);
    await retryTeacher.locator('.cr-teacher-entry').click();
    await retryTeacher.getByText('Kiểm tra / thử lưu lại',{exact:true}).click();
    await retryTeacher.locator('.cr-notice').filter({hasText:'Đã xóa bộ'}).waitFor();
    assert.equal(await retryTeacher.evaluate(()=>rows.collection_reward_sets.winter.revision),1);
    assert.equal(await retryTeacher.evaluate(()=>localStorage.getItem('collectionRewardDraft:s1')),null);
    console.log('PASS uncertain teacher delete reconciles without applying twice');

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
