'use strict';
// Fast regression checks of the actual rule expressions with snapshot semantics.
// This is not a replacement for the Firebase emulator / staging deployment check.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const rules = JSON.parse(fs.readFileSync('database.rules.patched.json', 'utf8')).rules;
const now = 1800000000000;
const clone = value => JSON.parse(JSON.stringify(value));
const parts = path => path.split('/').filter(Boolean);
const get = (tree, path) => parts(path).reduce((node, key) => node?.[key], tree) ?? null;
function put(tree, path, value) {
    const pathParts = parts(path), last = pathParts.pop();
    let node = tree;
    for (const key of pathParts) node = node[key] ||= {};
    if (value === null) delete node[last]; else node[last] = value;
}
class Snapshot {
    constructor(tree, path = '') { this.tree = tree; this.path = path; }
    val() { return get(this.tree, this.path); }
    exists() { return this.val() !== null; }
    child(key) { if (typeof key !== 'string') throw Error('Invalid child key'); return new Snapshot(this.tree, this.path + '/' + key); }
    parent() { const p = parts(this.path); if (!p.length) throw Error('No parent'); p.pop(); return new Snapshot(this.tree, p.join('/')); }
    hasChildren(keys) { return keys ? keys.every(k => this.child(k).exists()) : !!(this.val() && Object.keys(this.val()).length); }
    isString() { return typeof this.val() === 'string'; }
    isNumber() { return typeof this.val() === 'number'; }
    isBoolean() { return typeof this.val() === 'boolean'; }
}
function evaluate(expression, before, after, path, vars, uid) {
    if (typeof expression === 'boolean') return expression;
    if (!expression) return false;
    // String methods in RTDB rules are mapped to their JavaScript equivalents.
    expression = expression.replace(/\.beginsWith\(/g, '.startsWith(').replace(/\.matches\((\/[^\n]+?\/[a-z]*)\)/g, '.match($1)');
    try {
        return !!vm.runInNewContext(expression, {auth: uid ? {uid} : null, now,
            data: new Snapshot(before, path), newData: new Snapshot(after, path), root: new Snapshot(before), ...vars});
    } catch (_) { return false; }
}
function chain(path) {
    let node = rules, current = '', vars = {};
    const result = [{node, current, vars}];
    for (const key of parts(path)) {
        const wildcard = Object.keys(node).find(k => k.startsWith('$'));
        if (!(key in node) && !wildcard) break;
        if (!(key in node)) vars = {...vars, [wildcard]: key};
        node = node[key] || node[wildcard]; current += '/' + key;
        result.push({node, current, vars});
    }
    return result;
}
function accepted(before, updates, uid = 's1') {
    const after = clone(before);
    for (const [path, value] of Object.entries(updates)) put(after, path, value);
    for (const path of Object.keys(updates)) {
        const ancestors = chain(path);
        if (!ancestors.some(({node, current, vars}) => evaluate(node['.write'], before, after, current, vars, uid))) return false;
        for (const {node, current, vars} of ancestors) {
            if (get(after, current) !== null && '.validate' in node && !evaluate(node['.validate'], before, after, current, vars, uid)) return false;
        }
        const visit = (node, current, vars) => {
            const value = get(after, current);
            if (value === null) return true;
            if ('.validate' in node && !evaluate(node['.validate'], before, after, current, vars, uid)) return false;
            if (typeof value !== 'object') return true;
            for (const key of Object.keys(value)) {
                const wildcard = Object.keys(node).find(k => k.startsWith('$'));
                const next = node[key] || node[wildcard];
                if (next && !visit(next, current + '/' + key, node[key] ? vars : {...vars, [wildcard]: key})) return false;
            }
            return true;
        };
        const last = ancestors.at(-1);
        if (!visit(last.node, last.current, last.vars)) return false;
    }
    return true;
}
function fixture(count = 2) {
    const state = {users: {s1: {role: 'student', username: 'alice'}, s2: {role: 'student', username: 'bob'}, t1: {role: 'teacher'}},
        collection_reward_sets: {winter: {tag: 'Winter', required: [], choices: ['reward_bg_a', 'reward_bg_b'], createdAt: now}},
        collection_reward_catalog: {reward_bg_a: {type: 'background'}, reward_bg_b: {type: 'background'}},
        student_inventory: {alice: {}}, store_charge_receipts: {alice: {}}, collection_unlocks: {alice: {}}};
    for (let i = 0; i < count; i++) {
        state.collection_reward_sets.winter.required.push('item' + i);
        state.student_inventory.alice['item' + i] = {id: 'item' + i, source: 'store_purchase', purchaseOperationId: 'receipt' + i};
        state.store_charge_receipts.alice['receipt' + i] = {kind: 'purchase', itemId: 'item' + i};
    }
    return state;
}
function unlock(setId = 'winter', itemId = 'reward_bg_a') {
    return {[`collection_unlocks/alice/${setId}`]: {setId, itemId, studentUid: 's1', createdAt: now},
        [`student_inventory/alice/${itemId}`]: {id: itemId, type: 'background', source: 'collection_reward', collectionSetId: setId, purchaseTime: now, isEquipped: false}};
}
test('eligible students atomically receive a reward, including all 24 requirements', () => {
    assert.equal(accepted(fixture(), unlock()), true);
    assert.equal(accepted(fixture(24), unlock()), true);
});
test('missing item, trial, gift, missing or mismatched receipts cannot qualify', () => {
    for (const change of [s => delete s.student_inventory.alice.item1, s => s.student_inventory.alice.item0.isTrial = true,
        s => s.student_inventory.alice.item0.source = 'teacher_gift', s => delete s.store_charge_receipts.alice.receipt0,
        s => s.store_charge_receipts.alice.receipt0.itemId = 'different', s => s.store_charge_receipts.alice.receipt0.kind = 'trial']) {
        const state = fixture(); change(state); assert.equal(accepted(state, unlock()), false);
    }
});
test('claims are immutable: duplicate, alternate, deletion, subfield rewrite', () => {
    const state = fixture(); for (const [path, value] of Object.entries(unlock())) put(state, path, value);
    for (const updates of [unlock(), unlock('winter', 'reward_bg_b'), {'collection_unlocks/alice/winter': null},
        {'collection_unlocks/alice/winter/itemId': 'reward_bg_b'}, {'student_inventory/alice/reward_bg_a': null}]) assert.equal(accepted(state, updates), false);
    assert.equal(accepted(state, {'student_inventory/alice/reward_bg_a/isEquipped': true}), true);
});
test('partial and forged grant paths are rejected', () => {
    const full = unlock(), entries = Object.entries(full);
    assert.equal(accepted(fixture(), Object.fromEntries([entries[0]])), false);
    assert.equal(accepted(fixture(), Object.fromEntries([entries[1]])), false);
    assert.equal(accepted(fixture(), unlock('winter', 'reward_bg_unknown')), false);
    const wrongSource = clone(full); wrongSource['student_inventory/alice/reward_bg_a'].source = 'teacher_gift';
    assert.equal(accepted(fixture(), wrongSource), false);
});
test('wrong user, anonymous and locked students cannot claim', () => {
    assert.equal(accepted(fixture(), unlock(), 's2'), false);
    assert.equal(accepted(fixture(), unlock(), null), false);
    const state = fixture(); state.users.s1.isLocked = true; assert.equal(accepted(state, unlock()), false);
});
test('reused rewards do not overwrite existing equipped inventory', () => {
    const state = fixture(); for (const [path, value] of Object.entries(unlock())) put(state, path, value);
    state.student_inventory.alice.reward_bg_a.isEquipped = true;
    state.collection_reward_sets.second = clone(state.collection_reward_sets.winter);
    const next = unlock('second'); delete next['student_inventory/alice/reward_bg_a'];
    assert.equal(accepted(state, next), true);
    assert.equal(accepted(state, unlock('second')), false);
});
test('only teachers publish bounded, contiguous, distinct requirement lists', () => {
    const state = fixture(), set = state.collection_reward_sets.winter;
    const create = value => ({'collection_reward_sets/new': value});
    assert.equal(accepted(state, create(set), 't1'), true);
    assert.equal(accepted(state, create(set)), false);
    for (const required of [[], ['item0','item0'], {0: 'item0', 2: 'item1'}, Array.from({length:25}, (_,i) => 'item'+i)])
        assert.equal(accepted(state, create({...set, required}), 't1'), false);
    assert.equal(accepted(state, create({...set, choices: ['reward_bg_unknown']}), 't1'), false);
    assert.equal(accepted(state, {'collection_reward_sets/winter/tag': 'Changed'}, 't1'), false);
});
test('reward IDs cannot enter purchase or trial operations even for teachers', () => {
    for (const path of ['store_purchase_ops/alice/reward_bg_a', 'store_trial_claims/alice/reward_bg_a'])
        assert.equal(accepted(fixture(), {[path]: {id: 'reward_bg_a'}}, 't1'), false);
});
module.exports = {accepted, fixture, unlock};
