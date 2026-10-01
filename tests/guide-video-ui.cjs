const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const {chromium} = require(path.join(process.env.WORKSPACE_NODE_MODULES || 'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','playwright'));
(async()=>{
    const browser=await chromium.launch({channel:'msedge',headless:true});
    try {
        const page=await browser.newPage({viewport:{width:1280,height:900}});
        await page.route('https://practice.test/**',route=>route.fulfill({body:'<!doctype html><html><body><main class="dashboard"><div class="content"></div></main></body></html>',contentType:'text/html'}));
        await page.goto('https://practice.test/');
        const errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.addScriptTag({content:fs.readFileSync('js/app-dialog.js','utf8')});
        // Keep the real tour renderer and interactions; skip only login/remote completion initialization.
        let source=fs.readFileSync('js/huong-dan-nguoi-moi.js','utf8');
        source=source.slice(0,source.indexOf('    const runInitSafely ='))+`
          window.guideTestSetup=role=>{state.role=role;state.user={role,username:'demo'};state.features=roleData[role].features;state.initialized=true;injectStyles();buildInterface();};
          window.guideTestStep=showTourStep;
          window.guideTestReady=()=>!state.transitionLocked;
        })();`;
        await page.addScriptTag({content:source});
        await page.evaluate(()=>{ window.guideTestSetup('student');window.NewUserGuide.startFeature('collection-rewards-new'); });
        await page.waitForFunction(()=>guideTestReady());
        await page.evaluate(()=>guideTestStep(1));
        await page.waitForSelector('#nug-recent-demo');
        await page.waitForFunction(()=>guideTestReady());
        const step=async index=>{await page.evaluate(i=>guideTestStep(i+1),index);await page.waitForFunction(()=>guideTestReady());};
        const button=text=>page.locator('.nug-recent-practice').getByRole('button',{name:text,exact:true});
        await button('Mua nền B · 5.000 Coin').click();
        await button('Xác nhận / Kiểm tra mua').click();
        assert.match(await page.locator('.nug-recent-practice [role="status"]').innerText(),/1.000 Coin/);
        await button('Xác nhận / Kiểm tra mua').click();
        assert.match(await page.locator('.nug-recent-practice [role="status"]').innerText(),/Không trừ lần hai/);
        await step(3);
        await page.getByLabel('Chọn nền mẫu',{exact:true}).selectOption({label:'Nền B'});
        await button('Nhận phần thưởng').click();await button('Xác nhận / Kiểm tra lại').click();
        assert.match(await page.locator('.nug-recent-practice [role="status"]').innerText(),/Đã nhận Nền B/);
        await step(4);await button('Sử dụng nền').click();await button('Thử mặc vật phẩm sang trọng').click();
        assert.match(await page.locator('.nug-recent-practice [role="status"]').innerText(),/Tháo nền/);
        await button('Tháo nền').click();
        await step(2);
        assert.equal(await page.getByLabel('Vật phẩm mẫu cần thu thập').evaluate(el=>el.scrollHeight>el.clientHeight),true);
        await page.screenshot({path:'tests/artifacts/guide-rewards-practice.png'});
        await page.evaluate(()=>NewUserGuide.end());assert.equal(await page.locator('#nug-recent-demo').count(),0);
        // No actual features/data are required for new guides to run.
        for(const id of ['display-controls-new','list-performance-new','mc-workspace-new']){
            await page.evaluate(id=>NewUserGuide.startFeature(id),id);await page.waitForFunction(()=>guideTestReady());
            await step(0);assert.equal(await page.locator('.nug-recent-practice').count(),1);
            await page.evaluate(()=>NewUserGuide.end());
        }
        await page.evaluate(()=>{guideTestSetup('teacher');NewUserGuide.startFeature('collection-rewards-new');});
        await page.waitForFunction(()=>guideTestReady());await step(3);
        await button('Công bố / Lưu thay đổi').click();assert.equal(await page.getByLabel('Nền thưởng mẫu').isVisible(),false);
        await button('Sửa bộ').click();assert.equal(await page.getByLabel('Nền thưởng mẫu').isVisible(),true);
        await button('Xóa bộ (mẫu)').click();
        await page.evaluate(()=>NewUserGuide.end());
        await page.evaluate(()=>NewUserGuide.startFeature('student-deletion-new'));
        await page.waitForFunction(()=>guideTestReady());await step(0);
        await button('Xóa học sinh mẫu').click();
        for(let i=0;i<3;i++)await button('Kiểm tra / tiếp tục xóa').click();
        assert.match(await page.locator('.nug-recent-practice [role="status"]').innerText(),/Đã hoàn tất mô phỏng/);
        await page.evaluate(()=>NewUserGuide.end());
        assert.deepEqual(errors,[]);
        // Read the real card markup and full CSS, including the white-card theme override.
        const html=fs.readFileSync('student.html','utf8');
        const card=html.slice(html.indexOf('<div id="roadmapMoneyCard"'),html.indexOf('<div style="display: flex;',html.indexOf('<div id="roadmapMoneyCard"')));
        await page.setContent(`<html data-app-role="student"><body class="campus-modern"><main class="content">${card}</main></body></html>`);
        await page.addStyleTag({content:fs.readFileSync('css/student.css','utf8')});
        const color=await page.locator('#totalRoadmapMoney').evaluate(el=>getComputedStyle(el).color);
        assert.equal(color,'rgb(9, 99, 72)');
        await page.screenshot({path:'tests/artifacts/roadmap-money-fixed.png'});
        await page.setViewportSize({width:390,height:844});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        // Exercise the iframe polling/cleanup without fetching YouTube or using an account.
        await page.addScriptTag({content:fs.readFileSync('js/video-duration.js','utf8')});
        const result=await page.evaluate(async()=>{
            window.durationReads=0;window.destroyCount=0;
            window.YT={Player:function(id,config){const target={getDuration:()=>++durationReads<3?0:204.9,getVideoData:()=>({})};this.destroy=()=>destroyCount++;setTimeout(()=>config.events.onReady({target}),0);}};
            const value=await VideoDuration.readDuration('https://youtu.be/abcdefghijk');
            return {value,reads:durationReads,destroyed:destroyCount,left:document.querySelectorAll('[id^="yt-duration-"]').length};
        });
        assert.equal(result.value,204);assert.ok(result.reads>=6);assert.equal(result.destroyed,1);assert.equal(result.left,0);
        console.log('PASS: interactive guides, cleanup, teacher edit/delete demo, responsive money card, metadata polling.');
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
