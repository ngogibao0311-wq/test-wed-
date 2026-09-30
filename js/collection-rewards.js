(() => {
    'use strict';
    if (window.CollectionRewards) return;
    const el = (tag, text = '', cls = '') => {
        const node = document.createElement(tag);
        node.textContent = text;
        node.className = cls;
        return node;
    };
    const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
    let user, profile, panel, epoch = 0, connected = false;
    let sets = {}, catalog = {}, inventory = {}, receipts = {}, claims = {};
    let subscriptions = [], ready = new Set(), busy = new Map(), failed = new Set(), readErrors = new Map();
    let message = '', renderQueued = false, restoredBackground = '', publishing = false;
    const allReady = () => ['sets', 'catalog', 'inventory', 'receipts', 'claims'].every(key => ready.has(key));
    function safeURL(value) {
        if (typeof value !== 'string' || !value.trim()) return '';
        try {
            const source = value.trim(), url = new URL(source, location.href);
            if (['https:', 'http:'].includes(url.protocol)) return url.username || url.password ? '' : url.href;
            // A teacher may open teacher.html directly from the downloaded project.
            // Permit its own relative assets, without allowing arbitrary local paths.
            const assets = new URL('./assets/', location.href);
            if (url.protocol === 'file:' && assets.protocol === 'file:' &&
                /^(?:\.\/)?assets\//.test(source) && url.href.startsWith(assets.href) &&
                !decodeURIComponent(url.pathname).split(/[\\/]/).includes('..')) return url.href;
            return '';
        }
        catch (_) { return ''; }
    }
    function listen(path, callback) {
        const ref = db.ref(path), session = epoch;
        const onValue = snapshot => {
            if (session !== epoch) return;
            readErrors.delete(path);
            callback(snapshot);
        };
        ref.on('value', onValue, error => {
            if (session !== epoch) return;
            ref.off('value', onValue);
            readErrors.set(path, {code: error.code, retry: () => listen(path, callback)});
            notice('Không đọc được dữ liệu Phần thưởng: ' + error.code + '. Nếu là PERMISSION_DENIED, quản trị viên cần kiểm tra bộ Rules đang Publish trên đúng Firebase của website.');
            refresh();
        });
        subscriptions.push(() => ref.off('value', onValue));
    }
    function notice(text) {
        message = text;
        const node = panel?.querySelector('.cr-notice');
        if (node) { node.textContent = text; node.hidden = !text; }
    }
    function purchaseState(id) {
        const item = inventory[id], receipt = receipts[item?.purchaseOperationId];
        if (!item) return {owned: false, counted: false, reason: 'Chưa có trong kho'};
        if (item.isTrial === true) return {owned: false, counted: false, reason: 'Đang dùng thử, chưa sở hữu vĩnh viễn'};
        if (item.id !== id) return {owned: true, counted: false, reason: 'Dữ liệu kho thiếu hoặc không khớp mã vật phẩm; cần đối soát'};
        if (!item.source || (item.source === 'store_purchase' && !item.purchaseOperationId)) return {
            owned: true, counted: false, reason: 'Đã có vĩnh viễn nhưng thiếu chứng từ mua từ bản cũ; cần giáo viên đối soát, không mua lại'
        };
        if (item.source !== 'store_purchase') return {owned: true, counted: false, reason: 'Đã sở hữu qua quà tặng/sự kiện; điều kiện bộ này yêu cầu vật phẩm đã mua'};
        if (!receipt) return {owned: true, counted: false, reason: 'Đã có vĩnh viễn nhưng chưa tìm thấy biên nhận mua; cần đối soát'};
        if (receipt.kind !== 'purchase' || receipt.itemId !== id) return {owned: true, counted: false, reason: 'Biên nhận không khớp vật phẩm hoặc không phải mua vĩnh viễn'};
        return {owned: true, counted: true, reason: 'Đã mua hợp lệ — được tính'};
    }
    const purchased = id => purchaseState(id).counted;
    const enough = set => !!(set.required.length && set.required.every(purchased));
    const ownsReward = id => inventory[id]?.source === 'collection_reward' && inventory[id]?.isTrial !== true;
    function normalizeSets(raw) {
        return Object.fromEntries(Object.entries(raw || {}).filter(([id, set]) =>
            validId(id) && typeof set?.tag === 'string' &&
            Array.isArray(set.required) && set.required.length > 0 && set.required.length <= 24 &&
            Array.isArray(set.choices) && set.choices.length > 0 && set.choices.length <= 8 &&
            set.required.every(validId) && set.choices.every(x => validId(x) && x.startsWith('reward_bg_')) &&
            new Set(set.required).size === set.required.length && new Set(set.choices).size === set.choices.length));
    }
    function refresh() {
        if (renderQueued) return;
        renderQueued = true;
        requestAnimationFrame(() => {
            renderQueued = false; hookStore();
            const equipped = Object.values(inventory).find(item => item.source === 'collection_reward' && item.isEquipped);
            if (equipped && catalog[equipped.id] && restoredBackground !== equipped.id &&
                typeof StoreManager !== 'undefined' && typeof window.applyEquippedItems === 'function') {
                restoredBackground = equipped.id;
                window.applyEquippedItems();
            }
            if (!equipped) restoredBackground = '';
            // Realtime events must not destroy a teacher's unfinished form.
            if (profile?.role === 'student' || (profile?.role === 'teacher' && panel && !panel.querySelector('form'))) render();
            autoClaim();
        });
    }
    function hookStore() {
        if (typeof StoreManager === 'undefined' || StoreManager.__collectionRewardLookup) return;
        for (const name of ['buyItemSafely', 'trialItemSafely']) {
            const original = StoreManager[name];
            if (typeof original === 'function') StoreManager[name] = function(id, ...args) {
                if (String(id).startsWith('reward_bg_')) return alert('Nền này chỉ nhận trong Phần thưởng, không bán hoặc dùng thử.');
                return original.call(this, id, ...args);
            };
        }
        StoreManager.__collectionRewardLookup = true;
    }
    function pendingKey(setId) { return 'collectionRewardPending:' + user.uid + ':' + setId; }
    function pendingChoice(setId) {
        try { return localStorage.getItem(pendingKey(setId)); } catch (_) { return null; }
    }
    async function claim(setId, choice) {
        if (!user || profile?.role !== 'student' || busy.has(setId)) return;
        if (!connected || !allReady()) return notice('Đang chờ kết nối và đồng bộ dữ liệu. Chưa gửi yêu cầu nhận thưởng.');
        const session = epoch, account = user, username = profile.username, set = sets[setId];
        const itemId = pendingChoice(setId) || choice;
        if (!set || !enough(set) || !set.choices.includes(itemId) || !catalog[itemId]) return;
        const path = 'collection_unlocks/' + username + '/' + setId;
        const storageKey = pendingKey(setId), token = {};
        busy.set(setId, token); failed.delete(setId); render();
        try {
            // Persist the intent before writing. A reload retries the same choice.
            localStorage.setItem(storageKey, itemId);
            const existing = (await db.ref(path).once('value')).val();
            if (session !== epoch) return;
            if (existing) { claims[setId] = existing; localStorage.removeItem(storageKey); return; }
            if (!connected) throw Error('Kết nối bị gián đoạn trước khi gửi.');
            const record = {setId, itemId, studentUid: account.uid, createdAt: firebase.database.ServerValue.TIMESTAMP};
            const updates = {[path]: record};
            // A background reused in another set must not overwrite existing equipment.
            if (!ownsReward(itemId)) updates['student_inventory/' + username + '/' + itemId] = {
                id: itemId, type: 'background', source: 'collection_reward', collectionSetId: setId,
                purchaseTime: firebase.database.ServerValue.TIMESTAMP, isEquipped: false
            };
            // Rules check both paths and reject replacing an existing unlock.
            await db.ref().update(updates);
            if (session !== epoch) return;
            localStorage.removeItem(storageKey);
            notice('Đã xác nhận mở khóa ' + catalog[itemId].name + '. Bạn có thể sử dụng nền.');
        } catch (error) {
            if (session !== epoch) return;
            failed.add(setId); // Do not spin on permission or configuration failures.
            if (connected && /permission.denied/i.test(String(error.code || error.message))) {
                try {
                    const saved = (await db.ref(path).once('value')).val();
                    if (session !== epoch) return;
                    if (saved) {
                        claims[setId] = saved; localStorage.removeItem(storageKey);
                        notice('Bộ này đã được nhận ở một phiên khác. Đã cập nhật kết quả.'); return;
                    }
                } catch (_) { /* Retain the intent until the server can be read. */ }
            }
            notice(/permission.denied/i.test(String(error.code || error.message))
                ? 'Firebase từ chối cấp thưởng (PERMISSION_DENIED). Chưa nhận được nền. Giáo viên cần kiểm tra Rules và điều kiện bộ trên đúng Firebase của website; sau đó bấm Kiểm tra / thử lại. Không cần mua lại vật phẩm.'
                : 'Chưa xác nhận nhận thưởng. Khi có mạng, bấm Kiểm tra / thử lại để đối soát cùng lựa chọn. ' + error.message);
        } finally {
            if (session === epoch && busy.get(setId) === token) { busy.delete(setId); refresh(); }
        }
    }
    function autoClaim() {
        if (profile?.role !== 'student' || !connected || !allReady() || busy.size) return;
        for (const [id, set] of Object.entries(sets)) {
            if (claims[id] || busy.has(id) || failed.has(id) || !enough(set)) continue;
            const choice = pendingChoice(id) || (set.choices.length === 1 ? set.choices[0] : null);
            if (choice) { claim(id, choice); break; }
        }
    }
    function help() {
        const details = el('details', '', 'cr-help');
        details.append(el('summary', 'Hướng dẫn và quy tắc nhận thưởng'));
        details.append(el('p', 'Giáo viên đặt tên tag, chọn vật phẩm phải mua đủ và nền thưởng. Chỉ vật phẩm mua vĩnh viễn có biên nhận hợp lệ được tính; quà tặng và đồ dùng thử không tính.'));
        details.append(el('p', 'Một nền: tự mở khi đủ bộ và có mạng. Nhiều nền: chọn đúng một, không đổi sau khi xác nhận. Nền chưa sở hữu chỉ hiện ô đen và tag; phần thưởng không có nút mua và không trừ Coin.'));
        details.append(el('p', 'Nếu mất mạng, lựa chọn được giữ để đối soát khi kết nối lại. Không chọn sang nền khác. Vật phẩm mua từ bản cũ thiếu biên nhận cần giáo viên đối soát, không cần mua lại.'));
        return details;
    }
    function render() {
        if (!panel || !profile) return;
        panel.replaceChildren();
        const status = el('p', message, 'cr-notice');
        status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.hidden = !message;
        panel.append(status, help());
        if (readErrors.size) {
            const problems = el('ul', '', 'cr-read-errors');
            for (const [path, error] of readErrors) problems.append(el('li', path.split('/')[0] + ': ' + error.code));
            const retry = el('button', 'Tải lại dữ liệu phần thưởng'); retry.type = 'button';
            retry.onclick = () => {
                retry.disabled = true;
                for (const error of [...readErrors.values()]) error.retry();
            };
            panel.append(problems, retry);
        }
        if (profile.role === 'teacher') {
            if (!ready.has('sets') || !ready.has('catalog')) panel.append(el('p', 'Đang tải cấu hình phần thưởng…'));
            else renderTeacher();
            return;
        }
        panel.append(el('p', connected ? 'Đã kết nối' : 'Mất kết nối — chờ đồng bộ, chưa xác nhận phần thưởng.', 'cr-connection'));
        if (!allReady()) { panel.append(el('p', readErrors.size ? 'Chưa thể kiểm tra đủ bộ vì dữ liệu bị từ chối truy cập.' : 'Đang tải điều kiện, kho đồ và kết quả nhận thưởng…')); return; }
        const grid = el('div', '', 'cr-grid'); panel.append(grid);
        for (const [id, set] of Object.entries(sets)) {
            const section = el('section', '', 'cr-set'), unlocked = claims[id], waiting = busy.has(id);
            section.append(el('h3', set.tag));
            section.append(el('p', waiting ? 'Đang chờ máy chủ xác nhận…' : unlocked ? 'Đã nhận thưởng cho bộ này' :
                `Đã mua ${set.required.filter(purchased).length}/${set.required.length} vật phẩm vĩnh viễn`));
            const ownedCount = set.required.filter(required => purchaseState(required).owned).length;
            if (!unlocked && ownedCount > set.required.filter(purchased).length) {
                section.append(el('p', `Kho đã có ${ownedCount}/${set.required.length} món vĩnh viễn, nhưng có món chưa được tính vào điều kiện mua. Mở danh sách bên dưới để xem lý do.`, 'cr-notice'));
            }
            const requirements = el('details'); requirements.append(el('summary', 'Xem vật phẩm cần thu thập'));
            const list = el('ul');
            for (const required of set.required) {
                const item = typeof StoreManager !== 'undefined' ? StoreManager.getItemById(required) : null;
                const state = purchaseState(required);
                list.append(el('li', (state.counted ? '✓ ' : '○ ') + (item?.name || required) + ' — ' + state.reason));
            }
            requirements.append(list); section.append(requirements);
            for (const itemId of set.choices) {
                const item = catalog[itemId], owned = ownsReward(itemId) && !waiting;
                const card = el('article', '', 'cr-item'), art = el('div', '', 'cr-art' + (owned ? '' : ' cr-locked'));
                if (owned && safeURL(item?.value)) {
                    const image = el('img'); image.src = safeURL(item.value); image.alt = item.name;
                    image.loading = 'lazy'; image.decoding = 'async'; art.append(image);
                }
                const tag = el('span', item?.tag || set.tag, 'cr-tag');
                if (safeURL(item?.tagImage)) { const image = el('img'); image.src = safeURL(item.tagImage); image.alt = item.tag || set.tag; image.loading = 'lazy'; tag.replaceChildren(image); }
                art.append(tag); card.append(art);
                if (owned) {
                    card.append(el('h4', item?.name || 'Nền đã mở'));
                    const use = el('button', 'Sử dụng nền'); use.type = 'button'; use.disabled = !connected;
                    use.onclick = async () => {
                        use.disabled = true;
                        try {
                            hookStore();
                            if (typeof StoreManager === 'undefined') throw Error('Cửa hàng chưa sẵn sàng. Hãy mở Cửa hàng rồi thử lại.');
                            const result = await StoreManager.applyItem(itemId);
                            notice(result === false ? 'Chưa sử dụng được nền. Kiểm tra quyền trò chơi và thử lại.' : 'Đã gửi yêu cầu sử dụng nền.');
                        } catch (error) { notice(error.message); } finally { use.disabled = !connected; }
                    };
                    card.append(use);
                }
                if (!unlocked && enough(set) && set.choices.length > 1 && !pendingChoice(id)) {
                    const pick = el('button', 'Chọn phần thưởng này'); pick.type = 'button'; pick.disabled = waiting || !connected || !item;
                    pick.onclick = () => { if (confirm('Chỉ được chọn một nền cho bộ này và không thể đổi sau khi nhận. Xác nhận?')) claim(id, itemId); };
                    card.append(pick);
                }
                section.append(card);
            }
            if (!unlocked && !waiting && (failed.has(id) || pendingChoice(id))) {
                const retry = el('button', 'Kiểm tra / thử lại'); retry.type = 'button'; retry.disabled = !connected;
                retry.onclick = () => claim(id, pendingChoice(id) || set.choices[0]); section.append(retry);
            }
            if (!unlocked && !waiting && enough(set) && set.choices.length === 1 && !failed.has(id) && !pendingChoice(id)) {
                const retry = el('button', 'Kiểm tra và nhận thưởng'); retry.type = 'button'; retry.disabled = !connected;
                retry.onclick = () => claim(id, set.choices[0]); section.append(retry);
            }
            grid.append(section);
        }
        const configured = new Set(Object.values(sets).flatMap(set => set.choices));
        for (const [id, item] of Object.entries(catalog)) {
            if (configured.has(id)) continue;
            const card = el('article', '', 'cr-set'), art = el('div', '', 'cr-art cr-locked');
            art.append(el('span', item.tag || 'Phần thưởng', 'cr-tag'));
            card.append(art, el('p', 'Giáo viên chưa công bố điều kiện nhận.')); grid.append(card);
        }
        if (!Object.keys(sets).length && !Object.keys(catalog).length) panel.append(el('p', 'Giáo viên chưa công bố bộ phần thưởng.'));
    }
    function teacherCatalog() {
        return {...Object.fromEntries((window.CollectionRewardCatalog || []).map(item => [item.id, item])), ...catalog};
    }
    async function syncCatalog(ids, session) {
        for (const id of ids) {
            if (session !== epoch || profile?.role !== 'teacher') throw Error('Phiên đăng nhập đã thay đổi.');
            const item = teacherCatalog()[id];
            if (!item) throw Error('Không tìm thấy nền trong danh mục: ' + id);
            if (!validId(id) || !id.startsWith('reward_bg_') || item.id !== id) throw Error('Mã nền không hợp lệ: ' + id);
            if (item.type !== 'background' || !item.name || !item.tag) throw Error('Nền thiếu tên/tag hoặc không thuộc loại background: ' + id);
            if (!safeURL(item.value)) throw Error('Đường dẫn ảnh nền không hợp lệ: ' + id + '. Dùng ảnh trong assets/ của dự án hoặc đường dẫn http/https.');
            const ref = db.ref('collection_reward_catalog/' + id);
            const current = await ref.once('value');
            if (session !== epoch) throw Error('Phiên đăng nhập đã thay đổi.');
            if (!current.exists()) {
                try { await ref.set(item); }
                catch (error) { if (!(await ref.once('value')).exists()) throw error; }
            }
        }
    }
    function renderTeacher() {
        const session = epoch;
        if (publishing) { panel.append(el('p', 'Đang chờ máy chủ xác nhận công bố. Không cần gửi lần nữa.')); return; }
        const draftKey = 'collectionRewardDraft:' + user.uid;
        let pendingDraft = null;
        try { pendingDraft = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch (_) { /* Start a fresh form. */ }
        if (!validId(pendingDraft?.id) || !Array.isArray(pendingDraft?.value?.required) || !Array.isArray(pendingDraft?.value?.choices)) pendingDraft = null;
        panel.append(el('p', 'Bộ đã công bố giữ nguyên điều kiện để bảo vệ quyền lợi người đã sưu tầm. Muốn đổi điều kiện, công bố bộ mới.'));
        if (pendingDraft) panel.append(el('p', 'Có một bộ đang chờ xác minh. Bấm Kiểm tra / công bố lại để giữ đúng bộ và tránh tạo trùng.'));
        const form = el('form'), title = el('input'); title.id = 'crSetTag'; title.required = true; title.maxLength = 100;
        title.value = pendingDraft?.value.tag || '';
        const titleLabel = el('label', 'Tên tag / bộ sưu tập'); titleLabel.htmlFor = title.id; form.append(titleLabel, title);
        const sourceItems = typeof StoreConfig !== 'undefined' ? StoreConfig.items.filter(item => validId(item.id) && !item.id.startsWith('reward_bg_')) : [];
        const filter = el('select'); filter.id = 'crTagFilter'; const all = el('option', 'Tất cả tag'); all.value = ''; filter.append(all);
        for (const tag of [...new Set(sourceItems.map(item => item.tag).filter(Boolean))].sort()) { const option = el('option', tag); option.value = tag; filter.append(option); }
        const filterLabel = el('label', 'Lọc vật phẩm theo tag'); filterLabel.htmlFor = filter.id;
        form.append(filterLabel, filter, el('h3', 'Chọn vật phẩm cần mua đủ (1–24)'));
        const required = el('div', '', 'cr-options'), selected = new Set(pendingDraft?.value.required || []), count = el('p', `Đã chọn ${pendingDraft?.value.required.length || 0}/24 vật phẩm`);
        function drawRequired() {
            required.replaceChildren();
            for (const item of sourceItems.filter(item => !filter.value || item.tag === filter.value)) {
                const label = el('label', '', 'cr-option'), input = el('input'); input.type = 'checkbox'; input.value = item.id; input.checked = selected.has(item.id);
                input.onchange = () => { if (input.checked) selected.add(item.id); else selected.delete(item.id); count.textContent = `Đã chọn ${selected.size}/24 vật phẩm`; };
                label.append(input, el('span', item.name + ' · ' + (item.tag || 'Không có tag'))); required.append(label);
            }
        }
        filter.onchange = drawRequired; drawRequired(); form.append(required, count, el('h3', 'Nền thưởng (1: tự nhận; 2–8: chọn một)'));
        const choices = el('div', '', 'cr-options'), picked = new Set(pendingDraft?.value.choices || []);
        for (const [id, item] of Object.entries(teacherCatalog())) {
            const label = el('label', '', 'cr-option'), input = el('input'); input.type = 'checkbox'; input.value = id; input.checked = picked.has(id);
            input.onchange = () => input.checked ? picked.add(id) : picked.delete(id);
            label.append(input, el('span', item.name + ' · ' + item.tag)); choices.append(label);
        }
        form.append(choices);
        if (!choices.children.length) form.append(el('p', 'Chưa có nền thưởng. Bổ sung nền trong collection-reward-catalog.js rồi tải lại.'));
        const save = el('button', pendingDraft ? 'Kiểm tra / công bố lại' : 'Công bố bộ thưởng'); save.type = 'submit'; form.append(save);
        const setRef = pendingDraft ? db.ref('collection_reward_sets/' + pendingDraft.id) : db.ref('collection_reward_sets').push();
        if (pendingDraft) Array.from(form.elements).forEach(input => { input.disabled = input !== save; });
        let submitting = false;
        form.onsubmit = async event => {
            event.preventDefault(); if (submitting || publishing) return;
            if (!connected) return notice('Cần kết nối mạng để công bố bộ thưởng.');
            const tag = title.value.trim();
            if (!tag || !selected.size || selected.size > 24 || !picked.size || picked.size > 8) return notice('Nhập tag, chọn 1–24 vật phẩm và 1–8 nền thưởng.');
            const draft = pendingDraft?.value || {tag, required: [...selected], choices: [...picked], createdAt: firebase.database.ServerValue.TIMESTAMP};
            submitting = true; publishing = true; Array.from(form.elements).forEach(input => { input.disabled = true; });
            try {
                localStorage.setItem(draftKey, JSON.stringify({id: setRef.key, value: draft}));
                pendingDraft = {id: setRef.key, value: draft};
                await syncCatalog(draft.choices, session);
                if (session !== epoch) return;
                const current = await setRef.once('value');
                if (session !== epoch) return;
                if (!current.exists()) {
                    try { await setRef.set(draft); }
                    catch (error) { if (!(await setRef.once('value')).exists()) throw error; }
                }
                if (session !== epoch) return;
                localStorage.removeItem(draftKey); pendingDraft = null;
                notice('Đã công bố bộ thưởng.');
            } catch (error) {
                if (session === epoch) notice('Chưa xác nhận công bố. Thử lại để kiểm tra cùng bộ, không tạo bộ trùng. ' + error.message);
            } finally { if (session === epoch) { submitting = false; publishing = false; render(); } }
        };
        panel.append(form, el('h3', 'Các bộ đã công bố'));
        for (const set of Object.values(sets)) panel.append(el('p', `${set.tag}: ${set.required.length} vật phẩm → ${set.choices.length} nền thưởng`));
    }
    async function open() {
        if (!profile || document.getElementById('collectionRewardDialog')) return;
        const openingSession = epoch;
        hookStore();
        if (profile.role === 'student') {
            if (window.currentActiveExamId || window.isStudentStoreGameAccessEnabled?.() === false) return;
            let page = document.getElementById('tab-collection-rewards');
            if (!page) {
                page = el('section', '', 'tab-content cr-page'); page.id = 'tab-collection-rewards';
                const header = el('header'), title = el('h2', '🎁 Phần thưởng');
                const back = el('button', '← Cửa hàng'); back.type = 'button';
                back.onclick = () => window.switchTab?.('tab-store', document.getElementById('studentStoreNav'));
                header.append(title, back); page.append(header, el('div', '', 'cr-body'));
                (document.querySelector('.content') || document.body).append(page);
            }
            try {
                if (window.switchTab) await window.switchTab(page.id, document.getElementById('studentStoreNav'));
                else page.classList.add('active');
                if (openingSession !== epoch || !page.classList.contains('active')) return;
                panel = page.querySelector('.cr-body'); render(); autoClaim();
                if (document.getElementById('storeCollectionArrow')?.getAttribute('aria-expanded') === 'true') window.StoreCollectionPage?.toggleMenu();
            } catch (error) { notice('Chưa mở được Phần thưởng. ' + error.message); }
            return;
        }
        const dialog = el('dialog', '', 'cr-dialog'); dialog.id = 'collectionRewardDialog';
        const header = el('header'), title = el('h2', 'Phần thưởng'); title.id = 'crDialogTitle'; dialog.setAttribute('aria-labelledby', title.id);
        const close = el('button', 'Đóng'); close.type = 'button'; close.onclick = () => dialog.close();
        header.append(title, close); panel = el('div', '', 'cr-body'); const body = panel;
        dialog.append(header, body); document.body.append(dialog);
        dialog.addEventListener('close', () => { dialog.remove(); if (panel === body) panel = null; }, {once: true});
        render(); dialog.showModal(); autoClaim();
    }
    function nav() {
        if (!profile) return; hookStore();
        if (profile.role === 'student') {
            const anchor = document.querySelector('#storeCollectionDropdown .store-collection-dropdown__clip');
            if (!anchor || document.getElementById('collectionRewardNav')) return;
            const button = el('button', '', 'store-collection-dropdown__item collection-reward-menu-item'); button.id = 'collectionRewardNav'; button.type = 'button';
            const label = el('span'); label.append(el('strong', 'Phần thưởng'), el('small', 'Thu thập đủ bộ để mở nền đặc biệt'));
            button.append(el('span', '🎁', 'store-collection-dropdown__item-icon'), label, el('span', '→', 'store-collection-dropdown__go'));
            button.onclick = event => { event.preventDefault(); event.stopPropagation(); open(); }; anchor.append(button);
        } else if (profile.role === 'teacher') {
            const anchor = document.getElementById('teacherLuxuryStoreManageCard');
            if (!anchor || document.getElementById('teacherCollectionRewardCard')) return;
            const section = el('section', '', 'card cr-teacher-card'); section.id = 'teacherCollectionRewardCard';
            const button = el('button', '🎁 Quản lý Phần thưởng →', 'cr-teacher-entry'); button.type = 'button'; button.onclick = open;
            section.append(button); anchor.insertAdjacentElement('afterend', section);
        }
    }
    // Ignore unrelated particle/animation mutations.
    new MutationObserver(mutations => {
        if (mutations.some(m => [...m.addedNodes].some(n => n.nodeType === 1 &&
            (n.matches('#storeCollectionDropdown,#teacherLuxuryStoreManageCard') || n.querySelector('#storeCollectionDropdown,#teacherLuxuryStoreManageCard'))))) nav();
    }).observe(document.body, {childList: true, subtree: true});
    // Definitions remain outside StoreConfig.items: the store never sells these IDs.
    window.CollectionRewards = Object.freeze({getItem: id => catalog[id] || null, open});
    firebase.auth().onAuthStateChanged(async current => {
        const session = ++epoch; subscriptions.forEach(stop => stop()); subscriptions = [];
        user = current; profile = null; connected = false; publishing = false; ready = new Set(); busy = new Map(); failed = new Set(); readErrors = new Map();
        sets = {}; catalog = {}; inventory = {}; receipts = {}; claims = {}; message = ''; restoredBackground = '';
        document.getElementById('collectionRewardDialog')?.close();
        document.getElementById('tab-collection-rewards')?.remove(); panel = null;
        document.getElementById('collectionRewardNav')?.remove(); document.getElementById('teacherCollectionRewardCard')?.remove();
        if (!current) return;
        try {
            const data = (await db.ref('users/' + current.uid).once('value')).val();
            if (session !== epoch || !data || !['student', 'teacher'].includes(data.role)) return;
            profile = data; nav();
            listen('.info/connected', snapshot => { const was = connected; connected = snapshot.val() === true; if (connected && !was) failed.clear(); refresh(); });
            listen('collection_reward_catalog', snapshot => { catalog = snapshot.val() || {}; ready.add('catalog'); hookStore(); refresh(); });
            listen('collection_reward_sets', snapshot => { sets = normalizeSets(snapshot.val()); ready.add('sets'); refresh(); });
            if (profile.role === 'student') {
                listen('store_charge_receipts/' + profile.username, snapshot => { receipts = snapshot.val() || {}; ready.add('receipts'); refresh(); });
                listen('student_inventory/' + profile.username, snapshot => { inventory = snapshot.val() || {}; ready.add('inventory'); refresh(); });
                listen('collection_unlocks/' + profile.username, snapshot => { claims = snapshot.val() || {}; ready.add('claims'); refresh(); });
            }
        } catch (error) { if (session === epoch) console.warn('[Collection rewards]', error); }
    });
})();
