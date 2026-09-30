'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const source = fs.readFileSync('js/collection-rewards.js', 'utf8');
const functionSource = source.slice(source.indexOf('    function safeURL('), source.indexOf('    function listen('));
function resolve(value, href) {
    return vm.runInNewContext(functionSource + '\nsafeURL(value)', {URL, value, location:{href}});
}
const local = 'file:///C:/Users/DELL/Downloads/quan-ly-bai-tap/teacher.html';
test('the actual Spring catalog image works when teacher.html is opened locally', () => {
    const context = {window:{}};
    vm.runInNewContext(fs.readFileSync('js/collection-reward-catalog.js','utf8'),context);
    const spring = context.window.CollectionRewardCatalog.find(item => item.id === 'reward_bg_poster_xuan');
    assert.ok(fs.existsSync(spring.value));
    assert.equal(resolve(spring.value, local), new URL(spring.value,local).href);
});
test('relative assets work on hosted sites, localhost and local folders with spaces', () => {
    for (const base of ['https://example.test/school/teacher.html','http://localhost:8080/teacher.html','file:///C:/My%20School/teacher.html'])
        assert.equal(resolve('./assets/Premium/Poster/xuan.png',base),new URL('./assets/Premium/Poster/xuan.png',base).href);
});
test('unsafe schemes, local absolute paths and traversal remain rejected', () => {
    for (const value of ['javascript:alert(1)','data:text/html,test','file:///C:/secret.png','../secret.png',
        'assets/../../secret.png','assets/%2e%2e/%2e%2e/secret.png','assets/%2e%2e%2fsecret.png','https://user:pass@example.test/a.png'])
        assert.equal(resolve(value,local),'',value);
    assert.equal(resolve('file:///C:/secret.png','https://example.test/teacher.html'),'');
    assert.equal(resolve('https://example.test/a.png',local),'https://example.test/a.png');
});
