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
const purchased = `${after}.child('collection_reward_purchases').child($username).child($itemId)`;

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
        '.write': `${teacher} && newData.exists() && data.child('deleted').val() !== true`,
        '.validate': "$setId.matches(/^[A-Za-z0-9_-]{1,100}$/) && newData.hasChildren(['tag','required','choices','createdAt','revision','updatedAt','mutationId']) && newData.child('tag').isString() && newData.child('tag').val().length > 0 && newData.child('tag').val().length <= 100 && newData.child('createdAt').val() === (data.exists() ? data.child('createdAt').val() : now) && newData.child('revision').val() === (data.child('revision').isNumber() ? data.child('revision').val() + 1 : 1) && newData.child('updatedAt').val() === now",
        tag: {'.validate': 'newData.isString()'}, createdAt: {'.validate': 'newData.isNumber()'},
        revision: {'.validate': 'newData.isNumber()'}, updatedAt: {'.validate': 'newData.isNumber()'},
        mutationId: {'.validate': 'newData.isString() && newData.val().length >= 8 && newData.val().length <= 100'},
        deleted: {'.validate': 'newData.isBoolean()'},
        required: listRules(24, false), choices: listRules(8, true), '$other': {'.validate': false}
    }
};
const qualifications = [];
for (let i = 0; i < 24; i++) {
    const required = `${set}.child('required/${i}')`;
    const item = `root.child('student_inventory').child($username).child(${required}.val())`;
    qualifications.push(`(!${required}.exists() || (${item}.child('id').val() === ${required}.val() && ${item}.child('source').val() !== 'store_trial' && (!${item}.child('isTrial').exists() || ${item}.child('isTrial').val() === false)))`);
}
rules.collection_unlocks = {
    '$username': {
        '.read': `(${student}) || (${teacher})`,
        '$setId': {
            '.write': `${student} && !data.exists() && newData.exists()`,
            '.validate': [
                "newData.hasChildren(['setId','itemId','setRevision','studentUid','createdAt'])",
                `${set}.child('deleted').val() !== true`,
                `newData.child('setRevision').val() === (${set}.child('revision').isNumber() ? ${set}.child('revision').val() : 0)`,
                "newData.child('setId').val() === $setId", "newData.child('studentUid').val() === auth.uid", "newData.child('createdAt').val() === now",
                `${set}.child('required/0').isString()`, `${chosen}.beginsWith('reward_bg_')`,
                `root.child('collection_reward_catalog').child(${chosen}).child('type').val() === 'background'`,
                '(' + Array.from({length: 8}, (_, i) => `${set}.child('choices/${i}').val() === ${chosen}`).join(' || ') + ')',
                ...qualifications,
                `${inventory}.child('id').val() === ${chosen}`, `${inventory}.child('source').val() === 'collection_reward'`,
                `${inventory}.child('type').val() === 'background'`, `${inventory}.child('isTrial').val() !== true`,
                `${inventory}.child('collectionSetId').isString()`,
                `((${origin}.child('itemId').val() === ${chosen} && ${origin}.child('studentUid').val() === auth.uid) || (${after}.child('collection_reward_purchases').child($username).child(${chosen}).child('studentUid').val() === auth.uid))`
            ].join(' && '),
            setId: {'.validate': 'newData.isString()'}, itemId: {'.validate': 'newData.isString()'},
            setRevision: {'.validate': 'newData.isNumber()'},
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
// One immutable purchase per student/background, coupled to one payment sequence.
// The sequence prevents buying several backgrounds with a single 5,000 Coin debit.
const paidSet = "root.child('collection_reward_sets').child(newData.child('setId').val())";
const paidUnlock = "root.child('collection_unlocks').child($username).child(newData.child('setId').val())";
const paidInventory = `${after}.child('student_inventory').child($username).child($itemId)`;
const payment = `${after}.child('collection_reward_payments').child($username)`;
const choicesContain = value => '(' + Array.from({length:8},(_,i)=>`${paidSet}.child('choices/${i}').val() === ${value}`).join(' || ') + ')';
rules.collection_reward_purchases = {'$username': {
    '.read': `(${student}) || (${teacher})`,
    '$itemId': {
        '.write': `${student} && !data.exists() && newData.exists()`,
        '.validate': [rewardId,
            "newData.hasChildren(['itemId','setId','setRevision','studentUid','amount','createdAt','paymentRevision'])",
            "newData.child('itemId').val() === $itemId", "newData.child('studentUid').val() === auth.uid",
            "newData.child('amount').val() === 5000", "newData.child('createdAt').val() === now",
            `${paidSet}.child('deleted').val() !== true`, `${paidSet}.child('choices/1').isString()`,
            `newData.child('setRevision').val() === (${paidSet}.child('revision').isNumber() ? ${paidSet}.child('revision').val() : 0)`,
            `${paidUnlock}.child('studentUid').val() === auth.uid`, `${paidUnlock}.child('itemId').val() !== $itemId`,
            choicesContain('$itemId'), choicesContain(`${paidUnlock}.child('itemId').val()`),
            "!root.child('student_inventory').child($username).child($itemId).exists()",
            `${paidInventory}.child('id').val() === $itemId`, `${paidInventory}.child('rewardPurchase').val() === true`,
            `${payment}.child('itemId').val() === $itemId`, `${payment}.child('revision').val() === newData.child('paymentRevision').val()`,
            "root.child('student_coins').child($username).isNumber()", "root.child('student_coins').child($username).val() >= 5000",
            `${after}.child('student_coins').child($username).val() === root.child('student_coins').child($username).val() - 5000`
        ].join(' && '),
        itemId:{'.validate':'newData.isString()'}, setId:{'.validate':'newData.isString()'}, setRevision:{'.validate':'newData.isNumber()'},
        studentUid:{'.validate':'newData.isString()'},amount:{'.validate':'newData.isNumber()'},createdAt:{'.validate':'newData.isNumber()'},
        paymentRevision:{'.validate':'newData.isNumber()'},'$other':{'.validate':false}
    }
}};
const payAfter = 'newData.parent().parent()';
const payReceipt = `${payAfter}.child('collection_reward_purchases').child($username).child(newData.child('itemId').val())`;
rules.collection_reward_payments = {'$username': {
    '.read':`(${student}) || (${teacher})`,
    '.write':`${student} && newData.exists()`,
    '.validate': `newData.hasChildren(['itemId','revision']) && newData.child('itemId').isString() && newData.child('revision').isNumber() && newData.child('revision').val() === (data.child('revision').isNumber() ? data.child('revision').val() + 1 : 1) && !root.child('collection_reward_purchases').child($username).child(newData.child('itemId').val()).exists() && ${payReceipt}.child('paymentRevision').val() === newData.child('revision').val() && ${payReceipt}.child('studentUid').val() === auth.uid`,
    itemId:{'.validate':'newData.isString()'},revision:{'.validate':'newData.isNumber()'},'$other':{'.validate':false}
}};
itemRule['.write'] += ` || (${student} && ${rewardId} && !data.exists() && newData.exists() && ${purchased}.child('studentUid').val() === auth.uid)`;
itemRule['.validate'] = `(${itemRule['.validate']} && !newData.child('rewardPurchase').exists()) || (${rewardId} && newData.child('rewardPurchase').val() === true && newData.child('id').val() === $itemId && newData.child('source').val() === 'collection_reward' && newData.child('type').val() === 'background' && !newData.child('isTrial').exists() && newData.child('isEquipped').isBoolean() && root.child('collection_reward_catalog').child($itemId).exists() && ${purchased}.child('itemId').val() === $itemId && ${purchased}.child('setId').val() === newData.child('collectionSetId').val() && ${purchased}.child('createdAt').val() === newData.child('purchaseTime').val() && ((!data.exists() && newData.child('purchaseTime').val() === now && newData.child('isEquipped').val() === false) || (data.child('rewardPurchase').val() === true && newData.child('collectionSetId').val() === data.child('collectionSetId').val() && newData.child('purchaseTime').val() === data.child('purchaseTime').val())))`;
for (const key of ['store_purchase_ops', 'store_trial_claims']) {
    const rule = rules[key].$username.$itemId;
    rule['.write'] = `!${rewardId} && (${rule['.write']})`;
}
const charge = rules.store_charge_receipts.$username.$operationId;
charge['.validate'] = `!newData.child('itemId').val().beginsWith('reward_bg_') && (${charge['.validate']})`;
require('./student-deletion-rules.cjs').protect(rules);
fs.writeFileSync(target, JSON.stringify(document, null, 2) + '\n');
console.log('Wrote merged rules:', target);
