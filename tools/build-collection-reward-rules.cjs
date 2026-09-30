'use strict';
// Preserve all unrelated rules in the supplied rules file. Run once with the supplied
// file as argument. Always use the original input, not the generated output.
const fs = require('node:fs');
const target = 'database.rules.patched.json';
if (!process.argv[2] || require('node:path').resolve(process.argv[2]) === require('node:path').resolve(target)) {
    throw Error('Pass the original rules file as an argument; do not pass the generated output.');
}
const document = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const rules = document.rules;
const teacher = "auth != null && root.child('users').child(auth.uid).child('role').val() === 'teacher'";
const student = "auth != null && root.child('users').child(auth.uid).child('role').val() === 'student' && root.child('users').child(auth.uid).child('username').val() === $username && root.child('users').child(auth.uid).child('isLocked').val() !== true";
const after = 'newData.parent().parent().parent()';
const set = "root.child('collection_reward_sets').child($setId)";
const chosen = "newData.child('itemId').val()";
const inventory = `${after}.child('student_inventory').child($username).child(${chosen})`;
const origin = `${after}.child('collection_unlocks').child($username).child(${inventory}.child('collectionSetId').val())`;
const claim = `${after}.child('collection_unlocks').child($username).child(newData.child('collectionSetId').val())`;
const rewardId = "$itemId.beginsWith('reward_bg_')";

function listRules(limit, reward) {
    const result = {'.validate': "newData.child('0').isString()"};
    for (let i = 0; i < limit; i++) {
        const constraints = ["newData.isString()", "newData.val().matches(/^[A-Za-z0-9_-]{1,100}$/)"];
        if (reward) constraints.push("newData.val().beginsWith('reward_bg_')", "root.child('collection_reward_catalog').child(newData.val()).exists()");
        else constraints.push("!newData.val().beginsWith('reward_bg_')");
        if (i) constraints.push(`newData.parent().child('${i - 1}').exists()`);
        for (let j = 0; j < i; j++) constraints.push(`newData.val() !== newData.parent().child('${j}').val()`);
        result[i] = {'.validate': constraints.join(' && ')};
    }
    result.$other = {'.validate': false};
    return result;
}
rules.collection_reward_catalog = {
    '.read': 'auth != null',
    '$itemId': {
        '.write': `${teacher} && !data.exists() && newData.exists()`,
        '.validate': `${rewardId} && $itemId.matches(/^[A-Za-z0-9_-]{1,100}$/) && newData.hasChildren(['id','type','name','tag','value']) && newData.child('id').val() === $itemId && newData.child('type').val() === 'background' && newData.child('name').isString() && newData.child('name').val().length > 0 && newData.child('name').val().length <= 120 && newData.child('tag').isString() && newData.child('tag').val().length > 0 && newData.child('tag').val().length <= 100 && newData.child('value').isString() && newData.child('value').val().length > 0 && newData.child('value').val().length <= 2048`
    }
};
rules.collection_reward_sets = {
    '.read': 'auth != null',
    '$setId': {
        '.write': `${teacher} && !data.exists() && newData.exists()`,
        '.validate': "$setId.matches(/^[A-Za-z0-9_-]{1,100}$/) && newData.hasChildren(['tag','required','choices','createdAt']) && newData.child('tag').isString() && newData.child('tag').val().length > 0 && newData.child('tag').val().length <= 100 && newData.child('createdAt').val() === now",
        tag: {'.validate': 'newData.isString()'}, createdAt: {'.validate': 'newData.isNumber()'},
        required: listRules(24, false), choices: listRules(8, true), '$other': {'.validate': false}
    }
};
const qualifications = [];
for (let i = 0; i < 24; i++) {
    const required = `${set}.child('required/${i}')`;
    const item = `root.child('student_inventory').child($username).child(${required}.val())`;
    const receipt = `root.child('store_charge_receipts').child($username).child(${item}.child('purchaseOperationId').val())`;
    qualifications.push(`(!${required}.exists() || (${item}.child('id').val() === ${required}.val() && ${item}.child('source').val() === 'store_purchase' && ${item}.child('isTrial').val() !== true && ${item}.child('purchaseOperationId').isString() && ${receipt}.child('kind').val() === 'purchase' && ${receipt}.child('itemId').val() === ${required}.val()))`);
}
rules.collection_unlocks = {
    '$username': {
        '.read': `(${student}) || (${teacher})`,
        '$setId': {
            '.write': `${student} && !data.exists() && newData.exists()`,
            '.validate': [
                "newData.hasChildren(['setId','itemId','studentUid','createdAt'])",
                "newData.child('setId').val() === $setId", "newData.child('studentUid').val() === auth.uid", "newData.child('createdAt').val() === now",
                `${set}.child('required/0').isString()`, `${chosen}.beginsWith('reward_bg_')`,
                `root.child('collection_reward_catalog').child(${chosen}).child('type').val() === 'background'`,
                '(' + Array.from({length: 8}, (_, i) => `${set}.child('choices/${i}').val() === ${chosen}`).join(' || ') + ')',
                ...qualifications,
                `${inventory}.child('id').val() === ${chosen}`, `${inventory}.child('source').val() === 'collection_reward'`,
                `${inventory}.child('type').val() === 'background'`, `${inventory}.child('isTrial').val() !== true`,
                `${inventory}.child('collectionSetId').isString()`, `${origin}.child('itemId').val() === ${chosen}`,
                `${origin}.child('studentUid').val() === auth.uid`
            ].join(' && '),
            setId: {'.validate': 'newData.isString()'}, itemId: {'.validate': 'newData.isString()'},
            studentUid: {'.validate': 'newData.isString()'}, createdAt: {'.validate': 'newData.isNumber()'}, '$other': {'.validate': false}
        }
    }
};
// Keep the existing purchase/trial/event logic for ordinary items. The special prefix
// always uses the guarded reward branch, including writes through a teacher parent.
const itemRule = rules.student_inventory.$username.$itemId;
const existingWrite = itemRule['.write'];
const existingValidate = itemRule['.validate'];
const baseWrite = existingWrite;
const baseValidate = existingValidate;
const grant = `${student} && ${rewardId} && !data.exists() && newData.exists() && newData.child('collectionSetId').isString() && !root.child('collection_unlocks').child($username).child(newData.child('collectionSetId').val()).exists() && ${claim}.child('itemId').val() === $itemId && ${claim}.child('studentUid').val() === auth.uid`;
itemRule['.write'] = `(!${rewardId} && (${baseWrite})) || (${grant})`;
itemRule['.validate'] = `(!${rewardId} && (${baseValidate})) || (${rewardId} && newData.hasChildren(['id','type','source','collectionSetId','purchaseTime','isEquipped']) && newData.child('id').val() === $itemId && newData.child('type').val() === 'background' && newData.child('source').val() === 'collection_reward' && !newData.child('isTrial').exists() && newData.child('isEquipped').isBoolean() && newData.child('collectionSetId').isString() && root.child('collection_reward_catalog').child($itemId).exists() && ${claim}.child('itemId').val() === $itemId && ${claim}.child('createdAt').val() === newData.child('purchaseTime').val() && ((!data.exists() && newData.child('purchaseTime').val() === now && newData.child('isEquipped').val() === false) || (data.exists() && newData.child('collectionSetId').val() === data.child('collectionSetId').val() && newData.child('purchaseTime').val() === data.child('purchaseTime').val())))`;
for (const key of ['store_purchase_ops', 'store_trial_claims']) {
    const rule = rules[key].$username.$itemId;
    rule['.write'] = `!${rewardId} && (${rule['.write']})`;
}
const charge = rules.store_charge_receipts.$username.$operationId;
charge['.validate'] = `!newData.child('itemId').val().beginsWith('reward_bg_') && (${charge['.validate']})`;
fs.writeFileSync(target, JSON.stringify(document, null, 2) + '\n');
console.log('Wrote merged rules:', target);
