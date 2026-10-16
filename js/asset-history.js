/* Records acknowledged asset operations. Never writes a balance or grants a refund. */
(() => {
    'use strict';
    if (window.AssetHistory) return;
    const ROOT = 'student_asset_history';
    const trimPending = new Set();
    let trimTimer, trimRunning = false, trimError = false;
    async function trim(username) {
        const actor = firebase.auth().currentUser;
        if (!actor || !username) return false;
        const options=firebase.app?.().options;
        if(options?.projectId==='web-chan-doan-test'&&String(options.databaseURL||'').replace(/\/$/,'')==='https://web-chan-doan-test-default-rtdb.asia-southeast1.firebasedatabase.app')return true;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const endpoint = (window.CloudflareR2Storage?.config?.workerUrl || 'https://school-r2-files.ngogibao0311.workers.dev').replace(/\/$/, '');
            const token = await actor.getIdToken();
            const response = await fetch(endpoint + '/asset-history/trim', {
                method: 'POST', headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
                body: JSON.stringify({username}), signal: controller.signal
            });
            const result = await response.json();
            if (!response.ok || result.ok !== true) throw Error(result.error || 'HISTORY_TRIM_FAILED');
            trimError = false;
            return true;
        } catch (_) {
            trimError = true;
            return false; // A cleanup outage must never fail an acknowledged purchase.
        } finally { clearTimeout(timeout); }
    }
    function scheduleTrim(username) {
        trimPending.add(username);
        if (!trimRunning) { clearTimeout(trimTimer); trimTimer = setTimeout(drainTrims, 350); }
    }
    async function drainTrims() {
        if (trimRunning || !uid()) return;
        trimRunning = true;
        const failed = [];
        try {
            for (const username of trimPending) {
                trimPending.delete(username);
                if (!await trim(username)) failed.push(username);
            }
        } finally {
            for (const username of failed) trimPending.add(username);
            trimRunning = false;
            if (trimPending.size) trimTimer = setTimeout(drainTrims, 30000);
        }
    }
    const numeric = {
        student_coins: ['coin', 'Coin'], student_bonus_tickets: ['ticket', 'Vé quay'],
        student_money_offset: ['money', 'Tiền lộ trình'], historical_grade_tickets: ['ticket', 'Vé cơ sở'],
        spin_counts: ['ticket', 'Vé quay'], birthday_coins: ['event', 'Xu sinh nhật'],
        student_special_birthday_coins: ['event', 'Xu sinh nhật đặc biệt'], mid_autumn_wallets: ['event', 'Xu Trung Thu'],
        that_tich_wallets: ['event', 'Xu Thất Tịch'],
        love_coin_wallets: ['event', 'Xu tình yêu']
    };
    const watched = new Set([...Object.keys(numeric), 'student_inventory', 'student_discounts']);
    const sourceNames = { test_catalog: 'Cấp vật phẩm kiểm thử (giáo viên)', love_coin: 'Đổi bằng Xu tình yêu', that_tich_coin: 'Đổi bằng Xu Thất Tịch', store_purchase: 'Mua vật phẩm', teacher_gift: 'Nhận quà giáo viên', daily_login: 'Thưởng đăng nhập', collection_reward: 'Phần thưởng sưu tầm', special_birthday_coin: 'Đổi vật phẩm sinh nhật', birthday_coin: 'Đổi vật phẩm sinh nhật' };
    const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
    const profile = () => { try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch (_) { return {}; } };
    const uid = () => firebase.auth().currentUser?.uid || '';
    const pathOf = ref => decodeURIComponent(new URL(ref.toString()).pathname).replace(/^\/+|\/+$/g, '');
    const valueAt = (value, parts) => parts.reduce((v, p) => v?.[p], value);
    function setAt(tree, parts, value) { let node = tree; for (const p of parts.slice(0, -1)) node = node[p] ??= {}; if (parts.length) node[parts.at(-1)] = value; }
    function amount(root, entry) {
        if (typeof entry === 'number') return root === 'spin_counts' ? -entry : entry;
        if (root === 'spin_counts') return -Number(entry?.count || 0);
        if (root === 'student_special_birthday_coins') return Number(entry?.remaining || 0);
        return Number(entry?.balance || 0);
    }
    function itemName(key, data) {
        let item;
        try { item = typeof StoreConfig !== 'undefined' && StoreConfig.items?.find(i => String(i.id) === key); } catch (_) { }
        return String(data?.name || item?.name || key).slice(0, 200);
    }
    function units(root, entry) {
        if (!entry) return 0;
        if (root === 'student_discounts') return entry.used || entry.isUsed || entry.sold ? 0 : 1;
        return entry.quantity != null && Number.isFinite(Number(entry.quantity)) ? Number(entry.quantity) : 1;
    }
    function diff(root, key, before, after, exact = true) {
        if (root === 'student_inventory' || root === 'student_discounts') {
            const oldCount = units(root, before), newCount = units(root, after);
            if (oldCount === newCount) {
                if (root === 'student_inventory' && before && after && before.isTrial && !after.isTrial) return { kind: 'item', asset: key, label: itemName(key, after), action: 'upgrade', delta: 0, note: 'Chuyển từ dùng thử sang sở hữu' };
                return null; // Equip/unequip, UI metadata and repeated grants are not purchases.
            }
            return { kind: root === 'student_inventory' ? 'item' : 'discount', asset: key,
                label: root === 'student_discounts' ? `Thẻ giảm giá ${after?.percent || before?.percent || ''}%` : itemName(key, after || before),
                delta: exact ? newCount - oldCount : null, after: newCount, action: after ? 'grant' : 'remove',
                note: after?.isTrial ? 'Dùng thử' : '' };
        }
        const [kind, label] = numeric[root];
        const previous = amount(root, before), next = amount(root, after);
        if (previous === next && before !== undefined) return null;
        return { kind, asset: key || root, label, delta: exact ? next - previous : null, after: next,
            ...(exact ? { before: previous } : {}), note: root === 'student_money_offset' ? 'Khoản điều chỉnh, không phải tổng tiền đạt từ bài tập' : '' };
    }
    function groups(path, before, after, exact = true) {
        const parts = path.split('/').filter(Boolean), output = {};
        const roots = parts.length ? [parts[0]] : [...watched];
        for (const root of roots) {
            if (!watched.has(root)) continue;
            const oldRoot = parts.length ? before : before?.[root];
            const newRoot = parts.length ? after : after?.[root];
            const users = parts[1] ? [parts[1]] : [...new Set([...Object.keys(oldRoot || {}), ...Object.keys(newRoot || {})])];
            for (const user of users) {
                let oldUser = parts[1] ? oldRoot : oldRoot?.[user], newUser = parts[1] ? newRoot : newRoot?.[user];
                const keyed = ['student_inventory', 'student_discounts', 'birthday_coins', 'student_special_birthday_coins'].includes(root);
                const keys = keyed ? (parts[2] ? [parts[2]] : [...new Set([...Object.keys(oldUser || {}), ...Object.keys(newUser || {})])]) : [''];
                for (const key of keys) {
                    let a = keyed && !parts[2] ? oldUser?.[key] : oldUser, b = keyed && !parts[2] ? newUser?.[key] : newUser;
                    // When a child field is changed, reconstruct its containing asset.
                    const tail = parts.slice(keyed ? 3 : 2);
                    if (tail.length && ((root === 'student_inventory' && !['quantity','isTrial'].includes(tail[0])) || (root === 'student_discounts' && !['isUsed','used','sold'].includes(tail[0])) || (numeric[root] && !['balance','count','remaining'].includes(tail[0])))) continue;
                    if (tail.length) { const aa = {}, bb = {}; setAt(aa, tail, a); setAt(bb, tail, b); a = aa; b = bb; }
                    const change = diff(root, key, a, b, exact);
                    if (change) (output[user] ??= []).push(change);
                }
            }
        }
        return output;
    }
    const queue = new Map();
    let flushing = false, retryTimer, recordingError = false;
    const storageKey = () => 'asset_history_pending_' + uid() + ':';
    function saveQueue() {
        try { for (const row of queue.values()) if (row.actorUid === uid()) localStorage.setItem(storageKey() + row.username + '/' + row.id, JSON.stringify(row)); }
        catch (_) { recordingError = true; window.dispatchEvent(new CustomEvent('asset-history-status', { detail: 'storage-error' })); }
    }
    function restore() {
        if (!uid()) return;
        try {
            const prefix = storageKey();
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i); if (!key?.startsWith(prefix)) continue;
                const row = JSON.parse(localStorage.getItem(key));
                if (row.actorUid === uid()) queue.set(row.username + '/' + row.id, row);
            }
        } catch (_) { }
    }
    let flushPromise = null;
    function flush() {
        if (!flushPromise) flushPromise = flushQueue().finally(() => { flushPromise = null; });
        return flushPromise;
    }
    async function flushQueue() {
        if (flushing || !uid()) return;
        restore(); flushing = true;
        try {
            for (const [key, row] of queue) {
                if (row.actorUid !== uid()) continue;
                try {
                    const ref = db.ref(ROOT + '/' + key);
                    // Rules make entries immutable; a lost response is resolved using the same ID.
                    const existing = (await ref.once('value')).val();
                    if (!existing) await ref.set(row);
                    else if (existing.token !== row.token) throw Error('HISTORY_ID_CONFLICT');
                    queue.delete(key); scheduleTrim(row.username); window.dispatchEvent(new CustomEvent('asset-history-committed')); try { localStorage.removeItem(storageKey() + key); } catch (_) { }
                } catch (error) { console.warn('[Lịch sử tài sản] Chưa lưu nhật ký, giữ mã để thử lại:', row.id, error.code || error.message); break; }
            }
        } finally {
            flushing = false;
            window.dispatchEvent(new CustomEvent('asset-history-status'));
            clearTimeout(retryTimer);
            if ([...queue.values()].some(r => r.actorUid === uid())) retryTimer = setTimeout(flush, 30000);
        }
    }
    function makeRows(changes, context = {}) {
        const actorUid = context.actorUid || uid(); if (!actorUid) return [];
        const id = context.id || db.ref(ROOT).push().key, now = Date.now();
        return Object.entries(changes).filter(([, c]) => c.length).map(([username, entries]) => ({
            id, username, actorUid, token: context.token || id, version: 1,
            createdAt: firebase.database.ServerValue.TIMESTAMP, occurredAt: now, source: context.source || 'asset_change',
            summary: String(context.summary || 'Biến động tài sản').slice(0, 500),
            originalId: context.originalId || '', operationId: context.operationId || '',
            changes: entries, actorRole: context.actorRole || (profile().role === 'teacher' ? 'teacher' : 'student')
        }));
    }
    function enqueue(rows) {
        for (const row of rows) queue.set(row.username + '/' + row.id, row);
        saveQueue(); window.dispatchEvent(new CustomEvent('asset-history-status')); void flush();
    }
    function safeEnqueue(rows) {
        try { if (rows.length) enqueue(rows); } catch (error) {
            recordingError = true;
            console.error('[Lịch sử] Giao dịch đã thành công nhưng chưa ghi được lịch sử:', error);
            window.dispatchEvent(new CustomEvent('asset-history-status'));
        }
    }
    function contextFrom(patch) {
        const shoppingEntry=Object.entries(patch||{}).find(([path,value])=>path.startsWith('store_purchase_ops/')&&path.endsWith('/shoppingDraft')&&value===true);
        if(shoppingEntry){
            const prefix=shoppingEntry[0].slice(0,-'shoppingDraft'.length),grant=patch[prefix+'inventoryGrant'];
            if(grant?.purchaseOperationId)return {id:'store_'+grant.purchaseOperationId,operationId:grant.purchaseOperationId,source:'shopping_buy',summary:`Ngày hội mua sắm · ${itemName(grant.id,{})} · giảm ${patch[prefix+'shoppingPercent']}% · ${grant.purchaseBasePrice} → ${grant.purchasePrice} Coin (bản test)`};
        }
        for (const [path, value] of Object.entries(patch || {})) {
            if (path.startsWith('student_event_rewards/') && path.includes('/bellum/') && value?.status === 'claimed') return {operationId:path,source:'bellum_completion_reward',summary:'THẤT ĐẠI TỘI: TU VIỆN BELLUM · Nhận '+String(value.itemName || value.itemId)};
            if (path.startsWith('student_collection_rewards/') && value?.status === 'sent') {
                const parts=path.split('/');
                return {id:'collection_'+parts[2]+'_'+parts[3],operationId:path,source:'collection_milestone',
                    summary:'Thưởng Sưu tầm · '+String(value.collectionLabel||parts[2])+' · Mốc '+Number(value.milestone||parts[3])+' món'};
            }
            if (path.startsWith('student_conversion_usage/') && value?.receipt) return {id: 'convert_' + value.reservationId, operationId: path, source: 'student_conversion', summary: 'Quy đổi Coin và Tiền lộ trình'};
            if (path.startsWith('inbox_gift_claims/') && value?.version === 2) return {id: 'mail_' + path.split('/').at(-1), operationId: path, source: 'teacher_gift', summary: 'Nhận quà trong thư'};
            if (path.startsWith('cash_requests/') && value?.debitReceipt) return { id: 'cash_' + path.split('/')[1], operationId: path, source: 'cash_withdrawal', summary: 'Duyệt yêu cầu tiền mặt', }; 
            if (path.startsWith('teacher_money_operations/') && value?.id) return { id: 'ledger_' + value.id, operationId: value.id, originalId: value.originalId ? 'ledger_' + value.originalId : '', source: value.originalId ? 'counter' : 'teacher_penalty', summary: value.reason };
            if (path.startsWith('store_charge_receipts/')) return { id: 'store_' + path.split('/').at(-1), operationId: path.split('/').at(-1), source: 'store_purchase', summary: 'Thanh toán ' + (value.kind === 'trial' ? 'dùng thử: ' : 'vật phẩm: ') + itemName(value.itemId, {}) };
            if (path.startsWith('grade_reward_settlements/')) { const p = path.split('/'); return { id: 'grade_' + p[2] + '_' + p[3], operationId: path, originalId: Number(p[3]) > 1 ? 'grade_' + p[2] + '_' + (Number(p[3]) - 1) : '', source: Number(p[3]) > 1 ? 'adjustment' : 'grade_settlement', summary: 'Đối soát thưởng–phạt bài tập' }; }
            if (path.startsWith('submission_appeal_settlements/')) return { operationId: path, source: 'appeal', summary: 'Điều chỉnh sau kháng cáo' };
            if (path.startsWith('transaction_logs/') && path.endsWith('/status') && value === 'undone') return { id: 'undo_' + path.split('/')[1], operationId: path.split('/')[1], source: 'counter', summary: 'Giao dịch hoàn tác của giáo viên', originalId: 'legacy_' + path.split('/')[1] };
        }
        return {};
    }
    const proto = Object.getPrototypeOf(db.ref());
    const original = { set: proto.set, update: proto.update, transaction: proto.transaction, remove: proto.remove };
    const observed = path => !path || watched.has(path.split('/')[0]);
    function normalizeTarget(path) {
        const parts = path.split('/');
        return parts.slice(0, ['student_inventory', 'student_discounts', 'birthday_coins', 'student_special_birthday_coins'].includes(parts[0]) ? 3 : 2).join('/');
    }
    async function readBefore(path) {
        let timer;
        try { return await Promise.race([db.ref(path).once('value').then(s => s.val()), new Promise(resolve => { timer = setTimeout(() => resolve(undefined), 1500); })]); }
        catch (_) { return undefined; } finally { clearTimeout(timer); }
    }
    async function captureWrite(ref, method, value, callback) {
        const path = pathOf(ref);
        if (!observed(path)) return original[method].call(ref, value, callback);
        const updates = method === 'update' ? Object.fromEntries(Object.entries(value || {}).map(([k, v]) => [[path, k].filter(Boolean).join('/'), v])) : { [path]: value };
        const relevant = Object.keys(updates).filter(p => {
            if (!p || !watched.has(p.split('/')[0])) return false;
            const target = normalizeTarget(p), tail = p.slice(target.length + 1).split('/')[0];
            return p === target || ['quantity','isTrial','isUsed','used','sold','balance','count','remaining'].includes(tail);
        });
        const targets = [...new Set(relevant.map(normalizeTarget))].filter((p, _, all) => !all.some(other => other !== p && p.startsWith(other + '/')));
        if (!targets.length) return original[method].call(ref, value, callback);
        // Preserve the actor while async reads are in progress.
        const actorUid = uid(), actorRole = profile().role === 'teacher' ? 'teacher' : 'student';
        const snapshots = new Map(await Promise.all(targets.map(async p => [p, await readBefore(p)])));
        const changes = {}, context = { ...contextFrom(updates), actorUid, actorRole };
        for (const target of targets) {
            const before = snapshots.get(target);
            let after = clone(before) ?? null;
            for (const [p, v] of Object.entries(updates)) {
                if (p !== target && !p.startsWith(target + '/')) continue;
                const tail = p === target ? [] : p.slice(target.length + 1).split('/');
                let resolved = v;
                if (v && typeof v === 'object' && typeof v['.sv']?.increment === 'number') resolved = Number(valueAt(after, tail) || 0) + v['.sv'].increment;
                if (!tail.length) after = resolved; else { if (!after || typeof after !== 'object') after = {}; setAt(after, tail, resolved); }
            }
            // A read-before-set is an observation, not a server transaction before-value.
            const change = groups(target, before, after, false);
            const root = target.split('/')[0];
            const direct = updates[target];
            for (const entries of Object.values(change)) for (const entry of entries) {
                if (typeof direct?.['.sv']?.increment === 'number') { entry.delta = direct['.sv'].increment * (root === 'spin_counts' ? -1 : 1); delete entry.after; }
                if ((root === 'student_inventory' || root === 'student_discounts') && before !== undefined) {
                    const isCollection = target.split('/').length === 2;
                    const a = units(root, isCollection ? before?.[entry.asset] : before), b = units(root, isCollection ? after?.[entry.asset] : after); entry.delta = b - a;
                }
                if (context.source === 'teacher_penalty' || context.source === 'counter') {
                    const receipt = Object.entries(updates).find(([p]) => p.startsWith('teacher_money_operations/'))?.[1];
                    entry.delta = receipt.delta; entry.before = receipt.before; entry.after = receipt.after;
                }
            }
            for (const [user, entries] of Object.entries(change)) (changes[user] ??= []).push(...entries);
        }
        const rows = makeRows(changes, context);
        // Root multipath operations (shop charges, settlements, teacher adjustments)
        // can commit their journal in the SAME atomic write without changing SDK semantics.
        if (!path && method === 'update' && rows.length) {
            const augmented = { ...value };
            for (const row of rows) augmented[`${ROOT}/${row.username}/${row.id}`] = row;
            const result = await original.update.call(ref, augmented, callback);
            for (const row of rows) scheduleTrim(row.username);
            window.dispatchEvent(new CustomEvent('asset-history-committed'));
            return result;
        }
        // Keep the original SDK operation and completion callback semantics.
        const result = await original[method].call(ref, value, callback);
        safeEnqueue(rows);
        return result;
    }
    proto.set = function(value, callback) { return captureWrite(this, 'set', value, callback); };
    proto.update = function(value, callback) { return captureWrite(this, 'update', value, callback); };
    proto.remove = function(callback) { return captureWrite(this, 'set', null, callback); };
    proto.transaction = function(update, complete, applyLocally) {
        const path = pathOf(this);
        if (!observed(path)) return original.transaction.call(this, update, complete, applyLocally);
        let before;
        const actorUid = uid(), actorRole = profile().role === 'teacher' ? 'teacher' : 'student';
        const wrapped = current => { before = clone(current); return update(current); };
        const token = db.ref(ROOT).push().key;
        return original.transaction.call(this, wrapped, complete, applyLocally).then(result => {
            if (result.committed) {
                const after = result.snapshot.val();
                try {
                    const source = after?.source || '';
                    const root = path.split('/')[0];
                    const summary = after?.shoppingDraft===true&&root==='student_inventory'?`Ngày hội mua sắm · Nhận ${itemName(after.id,{})} · giảm ${after.shoppingPercent}% · ${after.purchasePrice} Coin (bản test)`:sourceNames[source] || (root === 'spin_counts' ? 'Sử dụng / hoàn vé quay' : root === 'student_inventory' ? 'Nhận / thay đổi vật phẩm' : root === 'student_discounts' ? 'Nhận / sử dụng thẻ giảm giá' : 'Biến động ' + (numeric[root]?.[1] || 'tài sản'));
                    safeEnqueue(makeRows(groups(path, before, after), { id: token, actorUid, actorRole,
                        operationId: after?.purchaseOperationId || after?.trialOperationId || '',
                        source: source || 'asset_change', summary }));
                } catch (error) { recordingError = true; console.error('[Lịch sử] Không tạo được nhật ký:', error); }
            }
            return result;
        });
    };
    window.AssetHistory = { flush, trim, retentionLimit: 30, hasTrimError: () => trimError, pending: () => [...queue.values()].filter(r => r.actorUid === uid()).length, hasError: () => recordingError, makeRows, groups };
    firebase.auth().onAuthStateChanged(() => { restore(); void flush(); });
    window.addEventListener('online', flush);
})();
