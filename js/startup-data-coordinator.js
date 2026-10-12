/* Bounded initial subscriptions; optional data is activated on demand. */
(() => {
    'use strict';
    if(window.StartupDataCoordinator||!window.listenFirebase)return;
    const original=window.listenFirebase,loader=window.AppStartupLoader;
    const queue=[],deferred=new Map(),taskQueue=[],openingTabs=new Map();
    let activeTasks=0;
    let running=0,stopped=false;
    const yieldUI=()=>new Promise(resolve=>setTimeout(resolve,0));
    function pathOf(ref){try{return decodeURIComponent(new URL(ref.toString()).pathname).replace(/^\/+|\/+$/g,'');}catch(_){return '';}}
    function pump(){
        if(stopped)return;
        while(running<3&&queue.length){
            const job=queue.shift();running++;
            job().finally(()=>{running--;pump();});
        }
    }
    function enqueue(job){queue.push(job);pump();}
    function pumpTasks(){
        while(!stopped&&activeTasks<2&&taskQueue.length){
            const {task,resolve,reject}=taskQueue.shift();activeTasks++;
            yieldUI().then(task).then(resolve,reject).finally(()=>{activeTasks--;pumpTasks();});
        }
    }
    function run(task){
        if(stopped)return Promise.reject(Error('Phiên đã kết thúc.'));
        return new Promise((resolve,reject)=>{taskQueue.push({task,resolve,reject});pumpTasks();});
    }
    window.listenFirebase=function(ref,event,callback,cancel,context){
        const path=pathOf(ref);
        if(event!=='value'||path.startsWith('.info/')||!path)return original(ref,event,callback,cancel,context);
        let resolveFirst,rejectFirst,first=true,started=false,latest,processing=false,release;
        const ready=new Promise((resolve,reject)=>{resolveFirst=resolve;rejectFirst=reject;});ready.catch(()=>{});
        const fail=error=>{
            if(first){first=false;rejectFirst(error);release?.();}
            if(stopped)return;
            if(typeof cancel==='function')cancel(error);
            else if(!loader?.diagnostics?.().hidden)loader?.fail?.('Chưa chuẩn bị được dữ liệu.', 'Kiểm tra kết nối rồi bấm Thử lại.','data');
            console.error('[Startup data]',path,error);
        };
        const receive=snapshot=>{
            latest=snapshot;
            if(processing)return;
            processing=true;
            (async()=>{
                while(latest&&!stopped){
                    const next=latest;latest=null;
                    await yieldUI();
                    if(stopped)break;
                    await callback.call(context,next);
                    if(first){first=false;resolveFirst();release?.();}
                }
            })().catch(fail).finally(()=>{processing=false;});
        };
        const start=()=>{
            if(started||stopped)return ready;started=true;
            enqueue(()=>new Promise(resolve=>{
                release=resolve;
                try{original(ref,event,receive,fail,context);}catch(error){fail(error);}
            }));return ready;
        };
        const entry={start,ready};
        if(path==='materials'){
            if(!deferred.has('tab-materials'))deferred.set('tab-materials',[]);
            deferred.get('tab-materials').push(entry);
        }else start();
        return receive;
    };
    if(loader){
        const expect=loader.expect.bind(loader);
        loader.expect=(keys,labels)=>expect((Array.isArray(keys)?keys:[keys]).filter(k=>!['student-materials','teacher-materials'].includes(k)),labels);
    }
    function ensureTab(tabId){
        if(openingTabs.has(tabId))return openingTabs.get(tabId);
        const task=loadTab(tabId).finally(()=>openingTabs.delete(tabId));
        openingTabs.set(tabId,task);return task;
    }
    async function loadTab(tabId){
        const tasks=deferred.get(tabId);if(!tasks)return;
        const tab=document.getElementById(tabId),status=document.createElement('p');
        status.setAttribute('role','status');status.textContent='Đang chuẩn bị dữ liệu…';
        status.setAttribute('style','position:fixed;z-index:100000;left:50%;top:18px;transform:translateX(-50%);max-width:calc(100vw - 32px);padding:12px 20px;margin:0;border-radius:14px;background:#fff;color:#24334c;box-shadow:0 6px 24px #0002;font:15px/1.5 system-ui;pointer-events:none');
        (document.body||tab)?.prepend(status);tab?.setAttribute('aria-busy','true');
        let timer;
        try{
            await Promise.race([Promise.all(tasks.map(t=>t.start())),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Chưa tải được dữ liệu. Vui lòng kiểm tra kết nối và mở lại mục này.')),30000);})]);
            deferred.delete(tabId);
        }finally{clearTimeout(timer);status.remove();tab?.removeAttribute('aria-busy');}
    }
    const cleanup=window.cleanupFirebaseListeners;
    window.cleanupFirebaseListeners=function(){stopped=true;queue.length=0;deferred.clear();for(const job of taskQueue.splice(0))job.reject(Error('Phiên đã kết thúc.'));cleanup?.();};
    window.StartupDataCoordinator=Object.freeze({ensureTab,run,diagnostics:()=>({running,queued:queue.length,activeTasks,queuedTasks:taskQueue.length,deferred:[...deferred.keys()]})});
})();
