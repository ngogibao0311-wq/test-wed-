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
    let sets = {}, catalog = {}, inventory = {}, claims = {};
    let subscriptions = [], ready = new Set(), busy = new Map(), failed = new Set(), readErrors = new Map();
    let message = '', renderQueued = false, restoredBackground = '', publishing = false, editingId = null;
    let selections = new Map();
    let equipmentBusy = new Map();
    let purchaseBusy = new Set();
    function purchaseKey(id) { return 'collectionRewardPurchase:' + user.uid + ':' + id; }
    function pendingPurchase(id) { try { return JSON.parse(localStorage.getItem(purchaseKey(id)) || 'null'); } catch (_) { return null; } }
    async function buyRemaining(setId, itemId) {
        if (!user || profile?.role !== 'student' || purchaseBusy.size || !connected || !allReady()) return;
        const session = epoch, username = profile.username, uid = user.uid, key = purchaseKey(itemId);
        const saved = pendingPurchase(itemId); setId = saved?.setId || setId;
        if (!saved && !(await AppDialog.confirm('Mua nền này với giá 5.000 Coin? Nền được thêm vĩnh viễn vào kho.'))) return;
        if (purchaseBusy.size || session !== epoch || !connected) return;
        const path = 'collection_reward_purchases/' + username + '/' + itemId;
        purchaseBusy.add(itemId); render();
        try {
            const receipt = (await db.ref(path).once('value')).val();
            if (session !== epoch) return;
            if (receipt) { localStorage.removeItem(key); notice('Nền này đã mua thành công. Không trừ Coin lần nữa.'); return; }
            const set = sets[setId], unlocked = claims[setId];
            if (!set || set.deleted || !unlocked || set.choices.length < 2 || !set.choices.includes(itemId) || !set.choices.includes(unlocked.itemId) || unlocked.itemId === itemId)
                throw Error('Bộ đã thay đổi hoặc bạn chưa nhận nền miễn phí trong bộ này.');
            const [owned, balance, payment] = await Promise.all([
                db.ref('student_inventory/' + username + '/' + itemId).once('value'),
                db.ref('student_coins/' + username).once('value'),
                db.ref('collection_reward_payments/' + username).once('value')
            ]);
            if (session !== epoch) return;
            if (owned.exists()) { localStorage.removeItem(key); notice('Bạn đã sở hữu nền này. Không cần mua lại.'); return; }
            if (!connected) throw Error('Mất kết nối. Chưa gửi giao dịch.');
            const coins = balance.val(), revision = Number(payment.val()?.revision || 0) + 1;
            if (!Number.isFinite(coins) || coins < 5000) throw Error('Cần ít nhất 5.000 Coin để mua nền.');
            localStorage.setItem(key, JSON.stringify({setId}));
            const timestamp = firebase.database.ServerValue.TIMESTAMP;
            await db.ref().update({
                [path]: {itemId,setId,setRevision:revisionOf(set),studentUid:uid,amount:5000,createdAt:timestamp,paymentRevision:revision},
                ['collection_reward_payments/' + username]: {itemId,revision},
                ['student_coins/' + username]: coins - 5000,
                ['student_inventory/' + username + '/' + itemId]: {id:itemId,type:'background',source:'collection_reward',rewardPurchase:true,collectionSetId:setId,purchaseTime:timestamp,isEquipped:false}
            });
            if (session !== epoch) return;
            localStorage.removeItem(key); notice('Đã mua nền với giá 5.000 Coin. Bạn có thể sử dụng nền.');
        } catch (error) {
            if (session === epoch) notice('Chưa xác nhận mua nền. ' + error.message + ' Bấm Kiểm tra mua để đối soát nếu giao dịch đang chờ; không mua lại ở bộ khác.');
        } finally { if (session === epoch) { purchaseBusy.delete(itemId); refresh(); } }
    }
    const revisionOf = set => Number.isInteger(set?.revision) ? set.revision : 0;
    const allReady = () => !readErrors.size && ['sets', 'catalog', 'inventory', 'claims'].every(key => ready.has(key));
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
    function ownershipState(id) {
        const item = inventory[id];
        if (!item) return {owned: false, counted: false, reason: 'Chưa có trong kho'};
        if (item.source === 'store_trial' || (item.isTrial != null && item.isTrial !== false)) return {owned: false, counted: false, reason: 'Vật phẩm dùng thử, chưa sở hữu vĩnh viễn'};
        if (item.id !== id) return {owned: false, counted: false, reason: 'Dữ liệu kho thiếu hoặc không khớp mã vật phẩm; cần giáo viên kiểm tra'};
        // Count server inventory ownership, regardless of acquisition source or old receipts.
        // Firebase applies the same condition to committed inventory before the claim.
        return {owned: true, counted: true, reason: 'Đã sở hữu vĩnh viễn — được tính'};
    }
    const collected = id => ownershipState(id).counted;
    const enough = set => !!(set.required.length && set.required.every(collected));
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
            if (profile?.role === 'teacher') {
                panel?.querySelector('form')?.refreshRewardChoices?.();
                renderPublishedSets();
            }
        });
    }
    function hookStore() {
        if (typeof StoreManager === 'undefined' || StoreManager.__collectionRewardLookup) return;
        for (const name of ['buyItemSafely', 'trialItemSafely']) {
            const original = StoreManager[name];
            if (typeof original === 'function') StoreManager[name] = function(id, ...args) {
                if (String(id).startsWith('reward_bg_')) return AppDialog.notify('Nền này chỉ nhận hoặc mua thêm trong Phần thưởng, không mua ở cửa hàng và không dùng thử.');
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
        const session = epoch, account = user, username = profile.username;
        const itemId = pendingChoice(setId) || choice;
        const path = 'collection_unlocks/' + username + '/' + setId;
        const storageKey = pendingKey(setId), token = {itemId};
        busy.set(setId, token); failed.delete(setId); render();
        try {
            const existing = (await db.ref(path).once('value')).val();
            if (session !== epoch) return;
            if (existing) { claims[setId] = existing; localStorage.removeItem(storageKey); return; }
            if (!connected) throw Error('Kết nối bị gián đoạn trước khi gửi.');
            const set = sets[setId];
            if (!set || set.deleted === true || !enough(set) || !set.choices.includes(itemId) || !catalog[itemId]) {
                localStorage.removeItem(storageKey); selections.delete(setId);
                throw Error('Bộ đã thay đổi hoặc chưa đủ điều kiện. Kiểm tra lại danh sách và chọn phần thưởng.');
            }
            // Only an explicit Receive click may create or retry a claim.
            localStorage.setItem(storageKey, itemId);
            const record = {setId, itemId, setRevision: revisionOf(set), studentUid: account.uid, createdAt: firebase.database.ServerValue.TIMESTAMP};
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
    function help() {
        const details = el('details', '', 'cr-help');
        details.append(el('summary', 'Hướng dẫn và quy tắc nhận thưởng'));
        details.append(el('p', 'Giáo viên chọn vật phẩm cần sở hữu đủ và nền thưởng. Tag lấy từ cấu hình nền. Mọi vật phẩm sở hữu vĩnh viễn trong kho đều được tính, kể cả quà tặng, đồ sự kiện và đồ từ bản cũ. Đồ dùng thử không tính.'));
        details.append(el('p', 'Đủ bộ sẽ hiện nút Nhận phần thưởng. Nếu có nhiều nền, chọn một để nhận miễn phí. Sau khi nhận, các nền còn lại trong bộ mở bán riêng cho bạn với giá 5.000 Coin mỗi nền. Mua là tùy chọn, không đổi nền đã nhận; chỉ mở ảnh nền sau khi máy chủ xác nhận.'));
        details.append(el('p', 'Nếu mất mạng, lựa chọn được giữ; khi có mạng bấm Kiểm tra / thử lại để đối soát. Không chọn sang nền khác khi yêu cầu chưa xác nhận. Không cần mua lại đồ đã sở hữu hoặc bổ sung biên nhận mua cũ.'));
        details.append(el('p', 'Khi dùng nền đặc biệt, nút đổi thành Tháo nền. Phải tự tháo nền đặc biệt trước khi mặc nền cửa hàng thường hoặc bất kỳ vật phẩm cửa hàng sang trọng nào. Khi bật nền đặc biệt, các trang bị đó đang mặc sẽ được tháo.'));
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
        if (!connected) panel.append(el('p', 'Mất kết nối — chờ đồng bộ, chưa xác nhận phần thưởng.', 'cr-connection'));
        if (!allReady()) { panel.append(el('p', readErrors.size ? 'Chưa thể kiểm tra đủ bộ vì dữ liệu bị từ chối truy cập.' : 'Đang tải điều kiện, kho đồ và kết quả nhận thưởng…')); return; }
        const grid = el('div', '', 'cr-grid'); panel.append(grid);
        for (const [id, set] of Object.entries(sets)) {
            if (set.deleted === true) continue;
            const section = el('section', '', 'cr-set'), unlocked = claims[id], waiting = busy.has(id);
            const info = el('div', '', 'cr-set-info');
            info.append(el('h3', set.tag));
            info.append(el('p', waiting ? 'Đang chờ máy chủ xác nhận…' : unlocked ? 'Đã nhận thưởng cho bộ này' :
                `Đã sở hữu ${set.required.filter(collected).length}/${set.required.length} vật phẩm vĩnh viễn`));
            const requirements = el('details'); requirements.append(el('summary', 'Xem vật phẩm cần thu thập'));
            const list = el('ul');
            for (const required of set.required) {
                const item = typeof StoreManager !== 'undefined' ? StoreManager.getItemById(required) : null;
                const state = ownershipState(required);
                list.append(el('li', (state.counted ? '✓ ' : '○ ') + (item?.name || required) + ' — ' + state.reason));
            }
            requirements.append(list); info.append(requirements);
            const displayedChoices = [...new Set([...set.choices, ...(unlocked ? [unlocked.itemId] : [])])];
            const selected = selections.get(id);
            const selectedId = selected?.revision === revisionOf(set) && set.choices.includes(selected.itemId) ? selected.itemId : null;
            const rewardItems = el('div', '', 'cr-reward-items'); section.append(rewardItems);
            const cards = new Map();
            for (const itemId of displayedChoices) {
                const item = catalog[itemId], card = rewardCard(itemId, set.tag);
                if (itemId === (unlocked?.itemId || displayedChoices[0])) {
                    card.insertBefore(info, card.querySelector('button'));
                }
                if (unlocked && unlocked.itemId !== itemId && (!ownsReward(itemId) || purchaseBusy.has(itemId))) {
                    const saleAvailable = set.choices.length > 1 && set.choices.includes(unlocked.itemId);
                    card.append(el('h4', item?.name || set.tag), el('p', 'NỀN ĐẶC BIỆT · MỞ BÁN RIÊNG', 'cr-item-type'),
                        el('p', saleAvailable ? 'Bạn đã nhận một nền trong bộ ' + set.tag + '. Có thể mua thêm nền này với giá 5.000 Coin.' : 'Bộ đã thay đổi. Nền này không mở bán theo lượt nhận trước của bạn.'));
                    const buy = el('button', purchaseBusy.has(itemId) ? 'Đang xác nhận…' : pendingPurchase(itemId) ? 'Kiểm tra mua · 5.000 Coin' : 'Mua nền · 5.000 Coin', 'cr-buy');
                    buy.type = 'button'; buy.disabled = !connected || purchaseBusy.size > 0 || !item;
                    buy.onclick = () => buyRemaining(id, itemId);
                    if (saleAvailable || pendingPurchase(itemId)) card.append(buy);
                }
                if (!unlocked && enough(set) && set.choices.length > 1 && !pendingChoice(id)) {
                    const pick = el('button', selectedId === itemId ? 'Đã chọn' : 'Chọn phần thưởng này');
                    pick.type = 'button'; pick.disabled = waiting || !connected || !item;
                    pick.setAttribute('aria-pressed', String(selectedId === itemId));
                    if (selectedId === itemId) card.classList.add('cr-selected');
                    pick.onclick = () => { selections.set(id, {itemId, revision: revisionOf(set)}); render(); };
                    card.append(pick);
                }
                rewardItems.append(card);
                cards.set(itemId, card);
            }
            const actionCard = cards.get(pendingChoice(id) || selectedId) || cards.get(displayedChoices[0]);
            if (!unlocked && !waiting && pendingChoice(id)) {
                const retry = el('button', 'Kiểm tra / thử lại'); retry.type = 'button'; retry.disabled = !connected;
                retry.onclick = () => claim(id, pendingChoice(id)); actionCard.append(retry);
            }
            if (!unlocked && enough(set) && !pendingChoice(id)) {
                const receiveId = set.choices.length === 1 ? set.choices[0] : selectedId;
                const receive = el('button', waiting ? 'Đang nhận…' : 'Nhận phần thưởng', 'cr-receive'); receive.type = 'button';
                receive.disabled = waiting || !connected || !receiveId || !catalog[receiveId];
                receive.onclick = async () => {
                    if (set.choices.length === 1 || (await AppDialog.confirm('Nhận nền đã chọn? Mỗi bộ chỉ nhận một lần và không đổi sau khi nhận.'))) claim(id, receiveId);
                };
                if (set.choices.length > 1 && !selectedId) actionCard.append(el('p', 'Chọn một nền trong bộ, rồi bấm Nhận phần thưởng.'));
                actionCard.append(receive);
            }
            grid.append(section);
        }
        const configured = new Set(Object.entries(sets).filter(([,set]) => !set.deleted).flatMap(([id,set]) => [...set.choices, ...(claims[id] ? [claims[id].itemId] : [])]));
        for (const [id, item] of Object.entries(catalog)) {
            if (configured.has(id)) continue;
            const card = el('section', '', 'cr-set');
            const reward = rewardCard(id, item.tag || 'Phần thưởng');
            reward.insertBefore(el('p', ownsReward(id) ? 'Nền đã nhận — vẫn được giữ khi bộ bị sửa hoặc xóa.' : 'Chưa có bộ đang mở để nhận nền này.'), reward.querySelector('button'));
            card.append(reward); grid.append(card);
        }
        if (!Object.keys(sets).length && !Object.keys(catalog).length) panel.append(el('p', 'Giáo viên chưa công bố bộ phần thưởng.'));
    }
    function rewardCard(itemId, label) {
        const item = catalog[itemId], owned = ownsReward(itemId) && !purchaseBusy.has(itemId) && ![...busy.values()].some(token => token.itemId === itemId);
        const card = el('article', '', 'cr-item'), art = el('div', '', 'cr-art' + (owned ? '' : ' cr-locked'));
        if (owned && safeURL(item?.value)) {
            const image = el('img'); image.src = safeURL(item.value); image.alt = item.name;
            image.loading = 'lazy'; image.decoding = 'async'; art.append(image);
        }
        const tag = el('span', configuredRewardTag(itemId) || label, 'cr-tag');
        const tagImage = (window.CollectionRewardCatalog || []).find(entry => entry.id === itemId)?.tagImage || item?.tagImage;
        if (safeURL(tagImage)) { const image = el('img'); image.src = safeURL(tagImage); image.alt = configuredRewardTag(itemId) || label; image.loading = 'lazy'; tag.replaceChildren(image); tag.classList.add('cr-tag-image'); }
        art.append(tag); card.append(art);
        if (owned) {
            card.append(el('span', 'Phần thưởng', 'cr-ribbon'), el('h4', item?.name || 'Nền đã mở'), el('p', 'NỀN ĐẶC BIỆT', 'cr-item-type'));
            const equipped = inventory[itemId]?.isEquipped === true;
            const use = el('button', equipmentBusy.has(itemId) ? 'Đang lưu…' : equipped ? 'Tháo nền' : 'Sử dụng nền');
            use.type = 'button'; use.disabled = !connected || equipmentBusy.has(itemId);
            use.onclick = async () => {
                if (!connected || equipmentBusy.has(itemId)) return;
                const session = epoch, token = {};
                equipmentBusy.set(itemId, token); render();
                try {
                    hookStore();
                    if (typeof StoreManager === 'undefined') throw Error('Cửa hàng chưa sẵn sàng. Hãy mở Cửa hàng rồi thử lại.');
                    const result = await (equipped ? StoreManager.unapplyItem(itemId) : StoreManager.applyItem(itemId));
                    if (session === epoch) notice(result === false ? 'Chưa đổi được trạng thái nền. Kiểm tra thông báo và thử lại.' : equipped ? 'Đã tháo nền đặc biệt. Bạn có thể mặc vật phẩm cửa hàng.' : 'Đã sử dụng nền đặc biệt.');
                } catch (error) { if (session === epoch) notice(error.message); }
                finally { if (session === epoch && equipmentBusy.get(itemId) === token) { equipmentBusy.delete(itemId); refresh(); } }
            };
            card.append(use);
        }
        return card;
    }
    function teacherCatalog() {
        return {...Object.fromEntries((window.CollectionRewardCatalog || []).map(item => [item.id, item])), ...catalog};
    }
    function configuredRewardTag(id) {
        const configured = (window.CollectionRewardCatalog || []).find(item => item.id === id);
        return String(configured?.tag || catalog[id]?.tag || '').trim();
    }
    function rewardUsedElsewhere(id, ownSetId) {
        return Object.entries(sets).some(([setId, set]) => setId !== ownSetId && !set.deleted && set.choices.includes(id));
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
        if (publishing) { panel.append(el('p', 'Đang chờ máy chủ xác nhận lưu. Không cần gửi lần nữa.')); return; }
        const draftKey = 'collectionRewardDraft:' + user.uid;
        let pendingDraft = null;
        try { pendingDraft = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch (_) { /* Start a fresh form. */ }
        if (!validId(pendingDraft?.id) || !Array.isArray(pendingDraft?.value?.required) || !Array.isArray(pendingDraft?.value?.choices)) pendingDraft = null;
        const original = editingId && sets[editingId];
        const initial = pendingDraft?.value || original;
        panel.append(el('p', 'Sửa bộ sẽ áp dụng điều kiện mới cho người chưa nhận. Xóa bộ sẽ ngừng nhận mới; nền đã nhận và lịch sử nhận vẫn được giữ. Mỗi bộ chỉ nhận một lần, kể cả sau khi sửa.'));
        if (pendingDraft) panel.append(el('p', 'Có thao tác đang chờ xác minh. Bấm Kiểm tra / thử lưu lại để kiểm tra đúng bộ và tránh tạo trùng.'));
        const form = el('form'), ownSetId = pendingDraft?.id || editingId;
        if (original) form.append(el('h3', 'Đang sửa bộ: ' + original.tag));
        const sourceItems = typeof StoreConfig !== 'undefined' ? StoreConfig.items.filter(item => validId(item.id) && !item.id.startsWith('reward_bg_')) : [];
        for (const id of initial?.required || []) if (!sourceItems.some(item => item.id === id)) sourceItems.push({id, name: id, tag: 'Vật phẩm cũ'});
        const filter = el('select'); filter.id = 'crTagFilter'; const all = el('option', 'Tất cả tag'); all.value = ''; filter.append(all);
        for (const tag of [...new Set(sourceItems.map(item => item.tag).filter(Boolean))].sort()) { const option = el('option', tag); option.value = tag; filter.append(option); }
        const filterLabel = el('label', 'Lọc vật phẩm theo tag'); filterLabel.htmlFor = filter.id;
        form.append(filterLabel, filter, el('h3', 'Chọn vật phẩm cần sở hữu đủ (1–24)'));
        const required = el('div', '', 'cr-options'), selected = new Set(initial?.required || []), count = el('p', `Đã chọn ${initial?.required.length || 0}/24 vật phẩm`);
        function drawRequired() {
            required.replaceChildren();
            for (const item of sourceItems.filter(item => !filter.value || item.tag === filter.value)) {
                const label = el('label', '', 'cr-option'), input = el('input'); input.type = 'checkbox'; input.value = item.id; input.checked = selected.has(item.id);
                input.onchange = () => { if (input.checked) selected.add(item.id); else selected.delete(item.id); count.textContent = `Đã chọn ${selected.size}/24 vật phẩm`; };
                label.append(input, el('span', item.name + ' · ' + (item.tag || 'Không có tag'))); required.append(label);
            }
        }
        filter.onchange = drawRequired; drawRequired(); form.append(required, count, el('h3', 'Nền thưởng (1–8; học sinh chọn một nếu có nhiều nền, rồi bấm Nhận)'));
        const choices = el('div', '', 'cr-options'), picked = new Set(initial?.choices || []);
        choices.id = 'crRewardChoices'; choices.tabIndex = 0; choices.setAttribute('aria-label', 'Nền thưởng');
        const emptyChoices = el('p', 'Không còn nền thưởng chưa công bố. Để thay đổi bộ hiện có, bấm Sửa bên dưới.');
        function drawChoices() {
            const scroll = choices.scrollTop;
            const available = Object.entries(teacherCatalog()).filter(([id]) =>
                initial?.choices.includes(id) || !rewardUsedElsewhere(id, ownSetId));
            if (!pendingDraft) for (const id of picked) if (!available.some(([key]) => key === id)) picked.delete(id);
            choices.replaceChildren();
            for (const [id, item] of available) {
                const label = el('label', '', 'cr-option'), input = el('input'); input.type = 'checkbox'; input.value = id; input.checked = picked.has(id);
                input.disabled = !!pendingDraft || publishing;
                input.onchange = () => input.checked ? picked.add(id) : picked.delete(id);
                label.append(input, el('span', item.name + ' · ' + configuredRewardTag(id))); choices.append(label);
            }
            emptyChoices.hidden = available.length > 0;
            choices.hidden = !available.length; choices.scrollTop = scroll;
        }
        form.refreshRewardChoices = drawChoices; drawChoices();
        form.append(choices, emptyChoices);
        const save = el('button', pendingDraft ? 'Kiểm tra / thử lưu lại' : original ? 'Lưu thay đổi' : 'Công bố bộ thưởng'); save.type = 'submit'; form.append(save);
        const setRef = pendingDraft || original ? db.ref('collection_reward_sets/' + (pendingDraft?.id || editingId)) : db.ref('collection_reward_sets').push();
        if (original && !pendingDraft) {
            const cancel = el('button', 'Hủy sửa'); cancel.type = 'button';
            cancel.onclick = () => { editingId = null; render(); }; form.append(cancel);
        }
        if (pendingDraft) Array.from(form.elements).forEach(input => { input.disabled = input !== save; });
        let submitting = false;
        form.onsubmit = async event => {
            event.preventDefault(); if (submitting || publishing) return;
            if (!connected) return notice('Cần kết nối mạng để lưu bộ thưởng.');
            drawChoices();
            if (!selected.size || selected.size > 24 || !picked.size || picked.size > 8) return notice('Chọn 1–24 vật phẩm và 1–8 nền thưởng chưa công bố.');
            const tags = [...new Set([...picked].map(configuredRewardTag))];
            const tag = tags.join(' / ');
            if (!pendingDraft && (tags.includes('') || tag.length > 100)) return notice('Tag của nền thưởng chưa hợp lệ. Vui lòng kiểm tra cấu hình tag.');
            const draft = pendingDraft?.value || {tag, required: [...selected], choices: [...picked]};
            submitting = true; publishing = true; Array.from(form.elements).forEach(input => { input.disabled = true; });
            await saveTeacherOperation(pendingDraft || {id: setRef.key, value: draft, mode: original ? 'edit' : 'create', baseRevision: revisionOf(original)});
            if (session === epoch) submitting = false;
        };
        const published = el('div', '', 'cr-options'); published.id = 'crPublishedSets';
        published.tabIndex = 0; published.setAttribute('aria-label', 'Các bộ đã công bố');
        panel.append(form, el('h3', 'Các bộ đã công bố'), published); renderPublishedSets();
    }
    async function saveTeacherOperation(operation) {
        const session = epoch, draftKey = 'collectionRewardDraft:' + user.uid;
        operation.mode ||= 'create';
        operation.mutationId ||= Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
        publishing = true; renderPublishedSets();
        try {
            localStorage.setItem(draftKey, JSON.stringify(operation));
            await syncCatalog(operation.value.choices, session);
            const ref = db.ref('collection_reward_sets/' + operation.id);
            const before = (await ref.once('value')).val();
            if (session !== epoch) return;
            // Reconcile older pending publications without creating another set.
            const sameOldCreate = operation.mode === 'create' && before && !before.mutationId &&
                !before.deleted && ['tag','required','choices'].every(key => JSON.stringify(before[key]) === JSON.stringify(operation.value[key]));
            if (!sameOldCreate) {
                const result = await ref.transaction(current => {
                    if (session !== epoch || current?.mutationId === operation.mutationId) return;
                    if (operation.mode === 'create' ? !!current : (!current || current.deleted || revisionOf(current) !== operation.baseRevision)) return;
                    return {...operation.value, createdAt: current?.createdAt || firebase.database.ServerValue.TIMESTAMP,
                        revision: revisionOf(current) + 1, updatedAt: firebase.database.ServerValue.TIMESTAMP, mutationId: operation.mutationId};
                }, undefined, false);
                if (session !== epoch) return;
                if (!result.committed && result.snapshot.val()?.mutationId !== operation.mutationId) {
                    localStorage.removeItem(draftKey); editingId = null;
                    throw Error('Bộ đã được thay đổi ở phiên khác. Hãy mở Sửa lại trên dữ liệu mới nhất.');
                }
            }
            localStorage.removeItem(draftKey); editingId = null;
            notice(operation.mode === 'delete' ? 'Đã xóa bộ khỏi danh sách nhận thưởng. Nền đã nhận vẫn được giữ.' : operation.mode === 'edit' ? 'Đã lưu thay đổi bộ thưởng.' : 'Đã công bố bộ thưởng.');
        } catch (error) {
            if (session === epoch) notice('Chưa xác nhận lưu. ' + error.message + ' Nếu có bản chờ, bấm Kiểm tra / thử lưu lại để kiểm tra đúng thao tác.');
        } finally { if (session === epoch) { publishing = false; render(); } }
    }
    function renderPublishedSets() {
        const list = panel?.querySelector('#crPublishedSets'); if (!list) return;
        const scroll = list.scrollTop;
        list.replaceChildren();
        let pending = false;
        try { pending = !!localStorage.getItem('collectionRewardDraft:' + user.uid); } catch (_) { /* Saving will report storage failure. */ }
        for (const [id, set] of Object.entries(sets)) {
            if (set.deleted) continue;
            const row = el('section', '', 'cr-published-row'); row.dataset.setId = id;
            row.append(el('p', `${set.tag}: ${set.required.length} vật phẩm → ${set.choices.length} nền thưởng`));
            const actions = el('div', '', 'cr-published-actions'), edit = el('button', 'Sửa'), remove = el('button', 'Xóa', 'cr-delete');
            edit.type = remove.type = 'button'; edit.disabled = remove.disabled = publishing || pending || !connected;
            edit.onclick = () => { if (publishing) return; editingId = id; render(); panel.querySelector('form')?.scrollIntoView({block:'start'}); };
            remove.onclick = async () => {
                if (publishing || !connected || !(await AppDialog.confirm('Xóa bộ “' + set.tag + '”? Học sinh sẽ không nhận thêm từ bộ này; nền đã nhận vẫn được giữ.'))) return;
                saveTeacherOperation({id, mode:'delete', baseRevision:revisionOf(set), value:{...set, deleted:true}});
            };
            actions.append(edit, remove); row.append(actions); list.append(row);
        }
        if (!list.children.length) list.append(el('p', 'Chưa có bộ đang công bố.'));
        list.scrollTop = scroll;
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
                panel = page.querySelector('.cr-body'); render();
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
        render(); dialog.showModal();
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
        user = current; profile = null; connected = false; publishing = false; editingId = null; selections = new Map(); equipmentBusy = new Map(); purchaseBusy = new Set(); ready = new Set(); busy = new Map(); failed = new Set(); readErrors = new Map();
        sets = {}; catalog = {}; inventory = {}; claims = {}; message = ''; restoredBackground = '';
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
                listen('student_inventory/' + profile.username, snapshot => { inventory = snapshot.val() || {}; ready.add('inventory'); refresh(); });
                listen('collection_unlocks/' + profile.username, snapshot => { claims = snapshot.val() || {}; ready.add('claims'); refresh(); });
            }
        } catch (error) { if (session === epoch) console.warn('[Collection rewards]', error); }
    });
})();
