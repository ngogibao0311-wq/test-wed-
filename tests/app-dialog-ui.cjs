const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(path.join(process.env.WORKSPACE_NODE_MODULES || 'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', 'playwright'));
(async () => {
    const browser = await chromium.launch({channel:'msedge', headless:true});
    try {
        const page = await browser.newPage({viewport:{width:1366,height:850}});
        await page.route('https://dialogs.test/**', route => route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><main><h1>Danh sách học sinh</h1><button id="trigger">Mở thông báo</button><div id="studentsListContainer"></div></main></body></html>'}));
        await page.goto('https://dialogs.test/');
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        let nativeDialogs = 0; page.on('dialog', async d => { nativeDialogs++; await d.dismiss(); });
        for (const f of ['common','teacher','mobile','dashboard-refresh','app-dialog']) await page.addStyleTag({content:fs.readFileSync(`css/${f}.css`,'utf8').replace(/@import[^;]+;/g,'')});
        await page.addScriptTag({content:fs.readFileSync('js/app-dialog.js','utf8')});
        const dialog = () => page.locator('.app-dialog-host dialog[open]');
        async function centered(locator) {
            await locator.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))));
            const box = await locator.boundingBox(), v = page.viewportSize();
            assert.ok(box && Math.abs(box.x+box.width/2-v.width/2)<2, 'horizontal center');
            assert.ok(Math.abs(box.y+box.height/2-v.height/2)<2, 'vertical center');
            assert.ok(box.width<=v.width && box.height<=v.height, 'fits viewport');
        }
        await page.locator('#trigger').focus();
        await page.evaluate(() => { window.answer='pending'; AppDialog.confirm('Xóa dữ liệu mẫu?').then(v=>answer=v); });
        await centered(dialog());
        await dialog().getByRole('button',{name:'Hủy',exact:true}).click();
        assert.equal(await page.evaluate(()=>answer), false);
        assert.equal(await page.evaluate(()=>document.activeElement.id), 'trigger');
        await page.evaluate(() => {
            window.writes=0;
            const act=async()=>{if(await AppDialog.confirm('Xác nhận cùng thao tác?'))writes++;};act();act();
        });
        assert.equal(await dialog().count(),1);
        await dialog().getByRole('button',{name:'Xác nhận',exact:true}).click();
        assert.equal(await page.evaluate(()=>writes),1);
        await page.evaluate(() => { AppDialog.prompt('Nhập mật khẩu','',{password:true}).then(v=>window.passwordResult=v); });
        assert.equal(await dialog().locator('input').getAttribute('type'),'password');
        await dialog().locator('input').fill('demo-only');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(()=>passwordResult),null);
        assert.equal(await page.locator('.app-dialog-host').count(),0);
        await page.evaluate(() => { AppDialog.alert('<img src=x onerror=alert(1)>'); AppDialog.alert('Thông báo thứ hai'); });
        assert.equal(await dialog().locator('img').count(),0);
        await dialog().getByRole('button',{name:'Đã hiểu'}).click();
        assert.match(await dialog().innerText(),/Thông báo thứ hai/);
        await dialog().getByRole('button',{name:'Đã hiểu'}).click();
        await page.setViewportSize({width:375,height:667});
        await page.evaluate(() => { AppDialog.alert('Thông báo dài\n'.repeat(120)); });
        await centered(dialog());
        assert.ok(await dialog().evaluate(el=>el.scrollHeight>el.clientHeight));
        await page.keyboard.press('Escape');
        // Real deletion client: cancelling never reauthenticates or requests deletion.
        await page.evaluate(() => {
            window.apiCalls=0;window.reauthCalls=0;
            window.firebase={auth:()=>({currentUser:{uid:'teacher',getIdToken:async()=>'test-token'}})};
            window.CloudflareR2Storage={config:{workerUrl:'https://dialogs.test'}};
            window.options={db:{ref:()=>({once:async()=>({val:()=>({role:'student',username:'demo'})})})},reauthenticate:async()=>{reauthCalls++;return true;}};
            window.fetch=async()=>{apiCalls++;throw Error('Failed to fetch');};
        });
        await page.addScriptTag({content:fs.readFileSync('js/student-deletion-client.js','utf8')});
        await page.evaluate(() => { StudentDeletionClient.run('demo',options); });
        await dialog().getByRole('button',{name:'Hủy',exact:true}).click();
        assert.deepEqual(await page.evaluate(()=>[apiCalls,reauthCalls]),[0,0]);
        await page.evaluate(() => { StudentDeletionClient.run('demo',options); });
        await dialog().getByRole('button',{name:'Xác nhận',exact:true}).click();
        const progress=page.locator('dialog.app-progress-dialog');
        await progress.waitFor();
        await centered(progress);
        assert.match(await progress.innerText(),/Chưa xác nhận xóa hoàn tất/);
        await page.setViewportSize({width:1366,height:850});
        await centered(progress);
        fs.mkdirSync('tests/artifacts',{recursive:true});
        await page.screenshot({path:'tests/artifacts/dialog-centered.png'});
        await progress.getByRole('button',{name:'Đóng thông báo'}).click();
        await page.evaluate(()=>{AppDialog.toast('Đã lưu thay đổi','success');});
        const toast=page.locator('.app-dialog-host dialog:popover-open');
        await centered(toast);
        await page.locator('#trigger').click();
        await toast.getByRole('button',{name:'Đã hiểu'}).click();
        assert.equal(nativeDialogs,0);
        assert.deepEqual(errors,[]);
        console.log('PASS: desktop/mobile centering, scrolling, focus, cancel, duplicate action, password, text safety, queue, deletion failure, toast; no native dialogs.');
    } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
