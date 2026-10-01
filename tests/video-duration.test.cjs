const { test } = require('node:test');
const assert = require('node:assert/strict');
const { seconds, parts, videoId, createController } = require('../js/video-duration.js');
function fixture() {
    const nodes = {};
    for (const prefix of ['cond','editCond']) for (const suffix of ['Day','Hour','Min','Sec']) nodes[prefix+suffix] = {value:'',disabled:false};
    for (const id of ['videoTotalTimeDisplay','editVideoTotalTimeDisplay']) nodes[id] = {textContent:''};
    const requests = [];
    const controller = createController((url,signal) => new Promise((resolve,reject) => requests.push({url,signal,resolve,reject})), {getElementById:id=>nodes[id]});
    return { nodes, requests, controller };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
test('fractional seconds never round up; day/hour/minute rollover is exact',()=>{
    assert.equal(seconds(204.999),204);
    assert.equal(seconds(59.999),59);
    assert.equal(seconds(Infinity),0);
    assert.deepEqual(parts(93784.87),[1,2,3,4]);
    assert.deepEqual(parts(3600),[0,1,0,0]);
});
test('parses shared, watch, shorts links and rejects lookalike hosts',()=>{
    for(const url of ['https://www.youtube.com/watch?si=x&v=abcdefghijk&t=15', 'youtu.be/abcdefghijk?si=a','https://m.youtube.com/shorts/abcdefghijk']) assert.equal(videoId(url),'abcdefghijk');
    for(const url of ['https://youtube.com.evil.test/watch?v=abcdefghijk','https://evil.test/youtu.be/abcdefghijk','https://youtube.com/watch?v=abc']) assert.equal(videoId(url),'');
});
test('old response cannot overwrite changed link or cleared form',async()=>{
    const {controller:c,requests:r,nodes:n}=fixture();
    const a=c.update('cond','A',{immediate:true});await tick();
    const b=c.update('cond','B',{immediate:true});await tick();
    assert.equal(r[0].signal.aborted,true);
    r[1].resolve(61);await b;r[0].resolve(900);await a;
    assert.equal(n.condMin.value,1);assert.equal(n.condSec.value,1);
    const next=c.update('cond','C',{immediate:true});await tick();
    await c.update('cond','');r[2].resolve(300);await next;
    assert.equal(n.condSec.value,'');assert.equal(n.videoTotalTimeDisplay.textContent,'(Chưa có video)');
});
test('create/edit limits independent; editing preserves condition and clamps all units',async()=>{
    const {controller:c,requests:r,nodes:n}=fixture();
    n.editCondMin.value=1;
    const a=c.update('cond','A',{immediate:true});const b=c.update('editCond','B',{immediate:true,preserve:true});await tick();
    r[0].resolve(93784);r[1].resolve(200);await Promise.all([a,b]);
    assert.equal(n.editCondMin.value,1);assert.equal(n.editCondSec.value,0);
    n.editCondHour.value=10;c.validate('editCond');
    assert.equal(n.editCondHour.value,0);assert.equal(n.editCondMin.value,3);assert.equal(n.editCondSec.value,20);
    assert.equal(n.condDay.value,1);assert.equal(n.condHour.value,2);
    assert.equal(c.canSave('cond','B'),false);assert.equal(c.canSave('cond','A'),true);
});
test('failed/pending reads cannot save; recovery enables inputs',async()=>{
    const {controller:c,requests:r,nodes:n}=fixture();
    const a=c.update('cond','A',{immediate:true});await tick();assert.equal(c.canSave('cond','A'),false);
    r[0].reject(new Error('Mất mạng'));await a;
    assert.equal(c.canSave('cond','A'),false);assert.equal(n.condSec.disabled,true);
    const b=c.update('cond','A',{immediate:true});await tick();r[1].resolve(204.8);await b;
    assert.equal(c.canSave('cond','A'),true);assert.equal(n.condSec.value,24);
});
