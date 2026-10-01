import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildDeletionPlan,PERSONAL_ROOTS,KNOWN_ROOTS,removeTarget} from '../r2-worker/src/student-deletion-plan.js';
import {StudentDeletionJob,rulesAllowSafeDeletion} from '../r2-worker/src/student-deletion-job.js';
const rules=JSON.parse(fs.readFileSync('database.rules.patched.json','utf8')).rules;
const clone=value=>structuredClone(value);
const ownFile={provider:'cloudflare-r2',key:'submissions/s1/a.pdf'};
const sharedFile={provider:'cloudflare-r2',key:'submissions/s1/shared.pdf'};
const legacy={provider:'cloudinary',publicId:'old/alice',resourceType:'image',deliveryType:'upload'};
const normalize=v=>v?.provider?clone(v):null;
function seed() {
    const data={users:{t1:{role:'teacher',username:'teacher'},s1:{role:'student',username:'alice'},s2:{role:'student',username:'bob'}},
        submissions:{a:{studentUsername:'alice',file:[ownFile,legacy]},b:{studentUsername:'bob',file:sharedFile}},
        assignments:{a:{targetStudent:['alice','bob'],file:{provider:'cloudflare-r2',key:'assignments/t1/class.pdf'}},b:{targetStudent:['alice']},c:{targetStudent:['all']}},
        materials:{m:{targetStudent:'alice,bob'}},schedule:{s:{targetStudent:'alice'}},
        video_tracking:{a:{alice:40,bob:20}},hoihoa_submissions:{art:{studentUsername:'alice'},other:{studentUsername:'bob',voters:{alice:true,bob:true}}},
        profile_requests:{p:{username:'alice'}},profile_request_secrets:{p:{newPass:'test-only'}},
        submission_appeals:{a:{studentUid:'s1'}},submission_appeal_settlements:{a:{submissionKey:'a'}},
        hoihoa_vote_usage:{round:{alice:{vote:1},bob:{vote:1}}},season_rankings:{round:{alice:{score:1},bob:{score:2}}},
        hoihoa_reward_logs:{season:{students:{alice:{done:true},bob:{done:true}}}},
        global_notifications:{g:{receivers:{alice:true,bob:true}}},global_surveys:{g:{answers:{alice:'yes',bob:'no'}}},
        system_diagnostic_reports:{s1:{message:'a'},s2:{message:'b'}},device_locks:{s1:{device:'a'},s2:{device:'b'}}};
    for(const root of PERSONAL_ROOTS)data[root]={alice:{sample:1},bob:{sample:2}};
    return data;
}
function fixture(data=seed()) {
    const store=new Map(),objects=new Map(),deleted=[],auth=[];let failFile=false,failPatch=false,failAuth=false;
    for(const asset of [ownFile,sharedFile,{key:'submissions/s1/orphan.pdf'},{key:'submissions/s2/b.pdf'}])objects.set(asset.key,{customMetadata:{uploadedBy:asset.key.split('/')[1]}});
    const state={storage:{get:async k=>clone(store.get(k)),put:async(k,v)=>store.set(k,clone(v)),deleteAll:async()=>store.clear(),setAlarm:async()=>{},deleteAlarm:async()=>{}}};
    const get=path=>path.split('/').filter(Boolean).reduce((v,k)=>v?.[k],data)??null;
    const put=(path,value)=>{const keys=path.split('/'),last=keys.pop();let parent=data;for(const key of keys)parent=parent[key]||={};if(value===null)delete parent[last];else parent[last]=clone(value);};
    const admin={database:async(path='',method='GET',body)=>{
        if(path==='.settings/rules')return{value:{rules}};
        if(method==='GET')return{value:clone(get(path)),etag:'etag'};
        if(method==='PATCH'){for(const [key,value]of Object.entries(body))put([path,key].filter(Boolean).join('/'),value);if(failPatch&&path===''){failPatch=false;throw Error('lost patch response');}}
        else put(path,method==='DELETE'?null:body);
        return{value:null};
    },account:async(action,uid)=>{auth.push(action+':'+uid);if(action==='delete'&&failAuth){failAuth=false;throw Error('lost auth response');}return{};}};
    const bucket={put:async(k,v)=>objects.set(k,{body:v,customMetadata:{}}),get:async k=>objects.has(k)?{json:async()=>JSON.parse(objects.get(k).body)}:null,
        head:async k=>objects.get(k)||null,delete:async k=>{if(failFile&&k===ownFile.key){failFile=false;throw Error('cloud offline');}objects.delete(k);deleted.push(k);},
        list:async({cursor})=>{const keys=[...objects.keys()].sort().filter(k=>!cursor||k>cursor).slice(0,2);return{objects:keys.map(key=>({key,...objects.get(key)})),truncated:[...objects.keys()].some(k=>k>keys.at(-1)),cursor:keys.at(-1)};}};
    const env={FILES_BUCKET:bucket};const tools={normalize,deleteCloudinary:async asset=>deleted.push('cloudinary:'+asset.publicId)};
    const job=new StudentDeletionJob(state,env,tools,admin);
    const call=()=>job.fetch(new Request('https://internal/',{method:'POST',body:JSON.stringify({uid:'s1',actorUid:'t1'})}));
    const finish=async()=>{for(let i=0;i<150;i++){const result=await(await call()).json();if(result.done)return result;}throw Error('job did not finish');};
    return{data,job,call,finish,store,objects,deleted,auth,state,env,admin,tools,failFile:()=>failFile=true,failPatch:()=>failPatch=true,failAuth:()=>failAuth=true};
}
test('ownership map covers every current database root; every client write has deletion guard',()=>{
    assert.deepEqual(Object.keys(rules).filter(k=>!k.startsWith('.')&&!KNOWN_ROOTS.has(k)),[]);
    assert.equal(rulesAllowSafeDeletion(rules),true);assert.equal(rulesAllowSafeDeletion({'.write':'auth != null'}),false);
});
test('actual write grants reject deleting and removed callers, including descendant grants',()=>{
    function snap(value) {return {child:key=>snap(value?.[key]),exists:()=>value!==undefined&&value!==null,val:()=>value??null};}
    const expressions=[];
    const walk=node=>{for(const [key,value]of Object.entries(node)){if(key==='.write'&&value!==false)expressions.push(value);else if(key[0]!=='.'&&value&&typeof value==='object')walk(value);}};walk(rules);
    for(const user of [{role:'student',username:'alice',deletionPending:true},null]) {
        const root=snap({users:user?{s1:user}:{}});
        for(const expression of expressions)assert.equal(vm.runInNewContext(expression,{auth:{uid:'s1'},root}),false);
    }
    const root=snap({users:{t1:{role:'teacher'}}});
    assert.equal(vm.runInNewContext(rules.users.$uid['.write'],{auth:{uid:'t1'},root,data:snap({deletionPending:true})}),false);
});
test('plan removes all private nodes and related records, preserves classmates/shared class assets',()=>{
    const data=seed(),plan=buildDeletionPlan(data,'s1','alice',normalize);
    for(const root of PERSONAL_ROOTS)assert.equal(plan.updates[root+'/alice'],null);
    assert.equal(plan.updates['profile_request_secrets/p'],null);assert.equal(plan.updates['submission_appeal_settlements/a'],null);
    assert.equal(plan.updates['hoihoa_submissions/other/voters/alice'],null);
    assert.equal(plan.updates['submissions/b'],undefined);assert.ok(plan.targets.includes('materials/m/targetStudent'));
    assert.deepEqual(removeTarget(['alice','bob'],'alice'),['bob']);assert.deepEqual(removeTarget('alice','alice'),['__private__']);
    assert.ok(!plan.assets.some(a=>a.key===sharedFile.key));assert.ok(plan.assets.some(a=>a.publicId===legacy.publicId));
    assert.equal(data.users.s1.role,'student');
});
test('unknown owned root and reserved usernames stop rather than claim successful deletion',()=>{
    const data=seed();data.future_feature={alice:{private:1}};
    assert.throws(()=>buildDeletionPlan(data,'s1','alice',normalize),/chưa có quy tắc/);
    assert.throws(()=>buildDeletionPlan(seed(),'s1','all',normalize),/không hợp lệ/);
});
test('full job deletes R2 orphan, legacy Cloudinary, private DB and Auth; preserves shared assets',async()=>{
    const f=fixture();await f.finish();
    assert.equal(f.data.users.s1,undefined);assert.ok(f.data.users.s2);
    assert.equal(f.objects.has('submissions/s1/orphan.pdf'),false);assert.equal(f.objects.has(sharedFile.key),true);
    assert.equal(f.objects.has('submissions/s2/b.pdf'),true);assert.ok(f.deleted.includes('cloudinary:old/alice'));
    assert.deepEqual(f.data.assignments.a.targetStudent,['bob']);assert.deepEqual(f.data.assignments.b.targetStudent,['__private__']);
    assert.ok(f.auth.includes('delete:s1'));assert.deepEqual([...f.store.keys()],['job']);
    assert.equal(f.store.get('job').username,undefined);assert.equal([...f.objects.keys()].some(k=>k.startsWith('_student_deletion/')),false);
});
test('cloud failure preserves data/manifest, restarts same persisted job, and duplicate calls are harmless',async()=>{
    const f=fixture();f.failFile();await f.call();await f.call();let response=await(await f.call()).json();
    assert.equal(response.done,false);assert.ok(response.error);assert.ok(f.data.submissions.a);assert.ok(f.store.get('job').manifest);
    const restarted=new StudentDeletionJob(f.state,f.env,f.tools,f.admin);await restarted.alarm();
    await Promise.all([f.call(),f.call()]);await f.finish();
    const count=f.auth.filter(x=>x==='delete:s1').length;
    assert.equal((await(await f.call()).json()).done,true);assert.equal(f.auth.filter(x=>x==='delete:s1').length,count);
});
test('lost Database and Auth responses resume without student password or false completion',async()=>{
    const f=fixture();f.failPatch();f.failAuth();await f.finish();assert.equal(f.data.users.s1,undefined);assert.equal(f.store.get('job').phase,'done');
});
test('teacher account and duplicate username cannot be deleted',async()=>{
    const f=fixture();f.data.users.s1.role='teacher';assert.equal((await(await f.call()).json()).done,false);assert.deepEqual(f.auth,[]);
    f.data.users.s1.role='student';f.data.users.s2.username='alice';assert.match((await(await f.call()).json()).error,/trùng/);assert.deepEqual(f.auth,[]);
});
test('new records arriving before finalization are cleaned before successful completion',async()=>{
    const f=fixture();
    while(f.store.get('job')?.phase!=='finish')await f.call();
    f.data.cash_requests={late:{username:'alice'},other:{username:'bob'}};
    await f.finish();
    assert.equal(f.data.cash_requests.late,undefined);assert.ok(f.data.cash_requests.other);
});
test('mismatched cloud owner is not deleted or silently reported as complete',async()=>{
    const f=fixture();f.objects.get(ownFile.key).customMetadata.uploadedBy='s2';
    await f.call();await f.call();const result=await(await f.call()).json();
    assert.match(result.error,/không khớp/);assert.equal(result.done,false);
    assert.equal(f.objects.has(ownFile.key),true);assert.ok(f.data.submissions.a);
});
test('inventory artwork is not treated as student uploaded legacy Cloudinary media',()=>{
    const data=seed();data.student_inventory.alice={old:{provider:'cloudinary',publicId:'shop/shared-art'}};
    const plan=buildDeletionPlan(data,'s1','alice',normalize);
    assert.ok(!plan.assets.some(asset=>asset.publicId==='shop/shared-art'));
});
