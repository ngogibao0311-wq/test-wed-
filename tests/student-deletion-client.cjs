const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.WORKSPACE_NODE_MODULES||'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','playwright'));
(async()=>{
    const browser=await chromium.launch({channel:'msedge',headless:true});
    try {
        const page=await browser.newPage({viewport:{width:1100,height:750}});
        await page.route('https://deletion.test/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><div id="studentsListContainer">Danh sách học sinh</div></body></html>'}));
        await page.goto('https://deletion.test/');
        await page.evaluate(()=>{
            window.firebase={auth:()=>({currentUser:{uid:'teacher',getIdToken:async()=>'fake-token'}})};
            window.CloudflareR2Storage={config:{workerUrl:'https://deletion.test'}};
            window.profile={role:'student',username:'demo'};window.apiCalls=[];window.responses=[];window.alerts=[];
            window.AppDialog={confirm:async()=>true,alert:async message=>alerts.push(message)};
            window.reauth=true;window.db={ref:()=>({once:async()=>({val:()=>profile})})};
            window.fetch=async(url,options)=>{apiCalls.push({url,body:JSON.parse(options.body)});const next=responses.shift();if(next instanceof Error)throw next;return{ok:next.ok!==false,json:async()=>next};};
            window.options={db,reauthenticate:async()=>reauth};
        });
        await page.addStyleTag({content:fs.readFileSync('css/app-dialog.css','utf8')});
        await page.addScriptTag({content:fs.readFileSync('js/student-deletion-client.js','utf8')});
        // Backend not configured: no false success and a retry remains available.
        await page.evaluate(async()=>{responses.push({ok:false,error:'Worker chưa cấu hình'});window.result=await StudentDeletionClient.run('student1',options);});
        assert.equal(await page.evaluate(()=>result),false);
        assert.match(await page.locator('dialog [role="status"]').innerText(),/Chưa xác nhận xóa hoàn tất/);
        assert.equal(await page.locator('#studentDeletionRecovery button').count(),1);
        await page.getByRole('button',{name:'Đóng thông báo'}).click();
        // Auth/database deletion may have completed while its response was lost.
        await page.evaluate(async()=>{profile=null;responses.push({ok:true,done:true,label:'Đã xóa hoàn tất'});window.result=await StudentDeletionClient.run('student1',options);});
        assert.equal(await page.evaluate(()=>result),true);
        assert.equal(await page.locator('#studentDeletionRecovery').count(),0);
        assert.deepEqual(await page.evaluate(()=>apiCalls.map(c=>c.body)),[{uid:'student1'},{uid:'student1'}]);
        await page.getByRole('button',{name:'Đóng thông báo'}).click();
        // An unconfirmed new deletion makes no API request.
        const count=await page.evaluate(()=>apiCalls.length);
        await page.evaluate(async()=>{profile={role:'student',username:'demo'};AppDialog.confirm=async()=>false;await StudentDeletionClient.run('student2',options);});
        assert.equal(await page.evaluate(()=>apiCalls.length),count);
        // Multiple clicks cannot initiate parallel calls; show progress during actual work.
        await page.evaluate(()=>{
            AppDialog.confirm=async()=>true;window.release=null;
            window.fetch=async(url,options)=>{apiCalls.push({url,body:JSON.parse(options.body)});return await new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>({ok:true,done:true})});});};
            window.running=StudentDeletionClient.run('student3',options);
        });
        await page.waitForFunction(()=>typeof release==='function');
        await page.evaluate(async()=>{await StudentDeletionClient.run('student3',options);});
        assert.equal(await page.evaluate(()=>apiCalls.length),count+1);
        await page.screenshot({path:'tests/artifacts/student-deletion-progress.png'});
        await page.evaluate(async()=>{release();await running;});
        assert.equal(await page.locator('#studentDeletionRecovery').count(),0);
        console.log('PASS: progress UI, config failure, confirmation, duplicate clicks, retry after profile removal.');
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
