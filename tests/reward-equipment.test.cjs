const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/store-manager.js','utf8');
const script = source.slice(source.indexOf('window.StoreConcurrency = (() =>'));
function setup(active = true) {
    const inventory = {
        reward_bg_a:{id:'reward_bg_a',type:'background',source:'collection_reward',isEquipped:active},
        background:{id:'background',type:'background',isEquipped:!active},
        luxury:{id:'luxury',type:'pet',isEquipped:!active},
        frame:{id:'frame',type:'frame',isEquipped:!active},
        pet:{id:'pet',type:'pet',isEquipped:false}
    };
    const definitions = {reward_bg_a:{type:'background'},background:{type:'background'},luxury:{type:'pet',luxuryOnly:true},frame:{type:'frame',luxuryOnly:true},pet:{type:'pet'}};
    let revision = 0, writes = 0, race = null;
    const messages = [];
    const context = {AppDialog:{notify:m=>messages.push(m),alert:async m=>messages.push(m)},window:{alert:m=>messages.push(m)},navigator:{onLine:true},db:{ref(path='') {return {
        once:async()=>({val:()=>structuredClone(path.startsWith('store_equipment_revisions') ? revision : inventory)}),
        update:async updates=>{
            if (race) {const run=race; race=null; run(inventory); revision++; throw Object.assign(Error('permission denied'),{code:'PERMISSION_DENIED'});}
            writes++;
            for(const [key,value] of Object.entries(updates)) {
                if(key.startsWith('store_equipment_revisions')) revision=value;
                else inventory[key.split('/')[2]].isEquipped=value;
            }
        }
    };}}};
    vm.runInNewContext(script,context);
    return {inventory,messages,get writes(){return writes;},setRace(fn){race=fn;},equip:(id,on=true)=>context.window.StoreConcurrency.equipment('alice',id,on,key=>definitions[key])};
}
test('special background blocks regular backgrounds and every luxury category until manual removal',async()=>{
    const s=setup();
    for(const id of ['background','luxury','frame']) assert.equal(await s.equip(id),false);
    assert.equal(s.writes,0); assert.equal(s.inventory.reward_bg_a.isEquipped,true);
    assert.equal(s.messages.length,3);
    assert.equal(await s.equip('pet'),true);
    assert.equal(s.inventory.reward_bg_a.isEquipped,true);
    assert.equal(await s.equip('reward_bg_a',false),true);
    assert.equal(await s.equip('background'),true);
    assert.equal(await s.equip('luxury'),true);
});
test('activating special background removes existing incompatible shop equipment',async()=>{
    const s=setup(false);
    assert.equal(await s.equip('reward_bg_a'),true);
    for(const id of ['background','luxury','frame']) assert.equal(s.inventory[id].isEquipped,false);
    assert.equal(s.inventory.reward_bg_a.isEquipped,true);
});
test('another tab activating special background blocks an in-flight shop equip after revision retry',async()=>{
    const s=setup(false);
    s.setRace(inventory=>{inventory.reward_bg_a.isEquipped=true;inventory.background.isEquipped=false;inventory.luxury.isEquipped=false;inventory.frame.isEquipped=false;});
    assert.equal(await s.equip('luxury'),false);
    assert.equal(s.writes,0); assert.equal(s.inventory.reward_bg_a.isEquipped,true);
});
