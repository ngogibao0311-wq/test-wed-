(() => {
    'use strict';
    const state = { rows: [], loading: false, generation: 0, username: '', selected: null };
    const labels = { all: 'Tất cả tài sản', coin: 'Coin', ticket: 'Vé quay', item: 'Vật phẩm', discount: 'Thẻ giảm giá', event: 'Xu sự kiện', money: 'Tiền lộ trình' };
    let ui, list, status, dialog, refreshTimer;
    function refreshAfterCommit() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
            const host = document.getElementById('studentAssetHistoryHost');
            if (!host?.getClientRects().length) return;
            if (state.loading) { refreshAfterCommit(); return; }
            void load(false);
        }, 180);
    }
    function text(tag, value, className) { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; }
    function signed(n) { return (n > 0 ? '+' : '') + Number(n).toLocaleString('vi-VN'); }
    function when(row) { return new Date(Number(row.createdAt)).toLocaleString('vi-VN'); }
    function changes(row) { return Object.values(row.changes || {}).filter(c => c && typeof c.label === 'string'); }
    function describe(change) {
        if (change.action === 'upgrade') return 'Nâng cấp · ' + change.label;
        if (typeof change.delta === 'number') return `${signed(change.delta)} ${change.label}`;
        return `${change.label}: cập nhật thành ${Number(change.after || 0).toLocaleString('vi-VN')}`;
    }
    function mount() {
        if (ui) return;
        const host = document.getElementById('studentAssetHistoryHost');
        if (!host) return;
        ui = host.attachShadow({ mode: 'open' });
        ui.innerHTML = `<style>
        [hidden]{display:none!important}:host{display:block;color:#24334c;font:15px/1.6 system-ui;min-width:0}*{box-sizing:border-box}button,input,select{font:inherit;color:inherit}button{cursor:pointer}button:disabled{cursor:default;opacity:.5}button,input,select{border:1px solid #d9dfec;border-radius:11px;background:white;padding:10px 13px}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #a5b4fc;outline-offset:2px}.hero{background:linear-gradient(120deg,#16243e,#384895);color:white;border-radius:20px;padding:24px;margin:0 0 20px}.hero h3{margin:0;font-size:24px}.hero p{margin:8px 0 0;color:#dce4ff}.toolbar{display:flex;gap:10px;flex-wrap:wrap;background:#fff;padding:16px;border:1px solid #e0e5f0;border-radius:16px}.toolbar label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:650;min-width:0}.search{flex:1;min-width:190px!important}.toolbar input,.toolbar select{width:100%;min-width:0;font-size:14px}.actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0}.actions p{flex:1;font-size:13px;color:#56657f}#list{display:grid;gap:12px}.row{background:white;border:1px solid #dfe5ef;border-radius:16px;padding:18px;min-width:0}.row-head{display:flex;align-items:flex-start;gap:12px;justify-content:space-between}.row h4{font-size:16px;margin:0}.time{color:#687791;font-size:12px;white-space:nowrap}.amounts{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.chip{border-radius:8px;padding:5px 9px;background:#f1f4f9;color:#34445e;font-weight:650;font-size:14px;overflow-wrap:anywhere}.positive{background:#e6f6ee;color:#126c4c}.negative{background:#fff0ee;color:#ad3e39}.meta{color:#63718b;font-size:12px;overflow-wrap:anywhere}.bottom{display:flex;gap:10px;justify-content:space-between;align-items:center}.link{color:#4b50bc;background:#f0f1ff;border-color:#d7dafa;font-size:13px}.empty{text-align:center;padding:36px 18px;background:white;border:1px dashed #ccd4e5;border-radius:16px;color:#63718b}.note{color:#63718b;font-size:12px}.error{color:#aa342d}dialog{border:0;border-radius:18px;padding:0;width:min(640px,calc(100vw - 32px));max-height:85dvh;color:#24334c;box-shadow:0 20px 90px #0005;background:white}dialog::backdrop{background:#0f172a99}.dialog-head{display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;padding:16px 20px;border-bottom:1px solid #e0e5ef;z-index:1}.dialog-head h3{margin:0;font-size:18px}.dialog-body{padding:20px;overflow-wrap:anywhere}.dialog-body p{white-space:pre-line}.detail-line{border-bottom:1px solid #e3e8f2;padding:12px 0}.links{display:flex;flex-wrap:wrap;gap:8px}.notice{background:#f0f3fa;padding:12px;border-radius:10px;font-size:13px}a{color:#4b50bc}@media(max-width:600px){.hero{padding:20px}.hero h3{font-size:21px}.toolbar{padding:12px;gap:8px}.toolbar label{flex:1 1 44%}.toolbar .search{flex-basis:100%}.row{padding:14px}.row-head{flex-direction:column;gap:4px}.bottom{align-items:flex-start;flex-direction:column}.meta{max-width:100%}}
        </style>
        <section class="hero"><h3>Sổ giao dịch của em</h3><p>Coin, vé quay, vật phẩm và các khoản điều chỉnh — mỗi lần thay đổi đều có mã để tra cứu.</p></section>
        <div class="toolbar"><label class="search">Tìm giao dịch<input id="search" type="search" placeholder="Tên vật phẩm, nội dung hoặc mã…"></label><label>Tài sản<select id="asset"></select></label><label>Loại thay đổi<select id="direction"><option value="all">Tất cả</option><option value="in">Nhận / cộng</option><option value="out">Trừ / sử dụng</option><option value="counter">Đối ứng / điều chỉnh</option></select></label></div>
        <div class="actions"><p id="status" role="status" aria-live="polite"></p><button id="refresh" type="button">↻ Làm mới</button><button id="retry" type="button" hidden>Gửi lại nhật ký chờ</button></div>
        <div id="list"></div>
        <p class="note" id="retention">Chỉ giữ 30 giao dịch mới nhất. Khi có giao dịch mới, bản ghi cũ nhất sẽ được xóa. Bộ lọc tìm trong 30 giao dịch này; số dư và vật phẩm không bị thay đổi.</p>
        <dialog aria-labelledby="historyDetailTitle"><div class="dialog-head"><h3 id="historyDetailTitle">Chi tiết giao dịch</h3><button id="close" type="button" aria-label="Đóng chi tiết">✕</button></div><div class="dialog-body"></div></dialog>`;
        list = ui.querySelector('#list'); status = ui.querySelector('#status'); dialog = ui.querySelector('dialog');
        for (const [value, label] of Object.entries(labels)) { const option = text('option', label); option.value = value; ui.querySelector('#asset').append(option); }
        for (const id of ['search', 'asset', 'direction']) ui.querySelector('#' + id).addEventListener('input', render);
        ui.querySelector('#refresh').onclick = () => load(false);
        ui.querySelector('#retry').onclick = () => window.AssetHistory?.flush();
        ui.querySelector('#close').onclick = () => dialog.close();
        window.addEventListener('asset-history-status', updatePending);
        window.addEventListener('asset-history-committed', refreshAfterCommit);
    }
    function updatePending() {
        if (!ui) return;
        const pending = window.AssetHistory?.pending() || 0;
        const retry = ui.querySelector('#retry'); retry.hidden = !pending; retry.textContent = `Gửi lại ${pending} nhật ký chờ`;
        if (window.AssetHistory?.hasError()) { status.textContent = 'Có thao tác chưa ghi được nhật ký. Tài sản không bị cộng/trừ lại; hãy kiểm tra kết nối và bộ nhớ trình duyệt.'; status.className = 'error'; }
    }
    async function load() {
        if (window.PageWork) return window.PageWork.run('student-history', loadNow);
        return loadNow();
    }
    async function loadNow() {
        mount(); if (!ui || state.loading) return;
        const user = typeof currentUser !== 'undefined' ? currentUser : JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (!firebase.auth().currentUser || !user.username) { status.textContent = 'Cần đăng nhập để xem lịch sử.'; return; }
        const username = user.username;
        if (state.username !== username) { state.rows = []; list.replaceChildren(); }
        state.username = username;
        const generation = ++state.generation; state.loading = true;
        status.className = ''; status.textContent = 'Đang tải lịch sử…';
        ui.querySelector('#refresh').disabled = true;
        try {
            await window.AssetHistory?.flush();
            const cleaned = await window.AssetHistory?.trim?.(state.username);
            ui.querySelector('#retention').textContent = cleaned === false
                ? 'Đang hiển thị 30 giao dịch mới nhất. Chưa dọn được bản ghi cũ trên máy chủ; sẽ thử lại. Giáo viên cần cập nhật Worker nếu thông báo này kéo dài.'
                : 'Chỉ giữ 30 giao dịch mới nhất. Giao dịch mới sẽ thay bản ghi cũ nhất; số dư, vật phẩm và dữ liệu chống nhận thưởng trùng không thay đổi.';
            const snap = await db.ref(`student_asset_history/${state.username}`).orderByChild('createdAt').limitToLast(30).once('value');
            const activeUser = typeof currentUser !== 'undefined' ? currentUser : JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (generation !== state.generation || activeUser.username !== username) return;
            const rows = [];
            snap.forEach(child => {
                rows.push({ ...child.val(), id: child.key });
                // Snapshot iteration stops on a truthy return value; Array.push
                // returns the new length, so it must not be returned here.
            });
            state.rows = rows.sort((a,b) => b.createdAt-a.createdAt || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)).slice(0,30);
            render();
        } catch (error) {
            status.className = 'error'; status.textContent = /permission/i.test(error.code || error.message) ? 'Chưa có quyền đọc lịch sử. Giáo viên cần Publish Rules của bản cập nhật này.' : 'Không tải được lịch sử. Kiểm tra kết nối rồi bấm Làm mới.';
        } finally {
            state.loading = false; ui.querySelector('#refresh').disabled = false; updatePending();
        }
    }
    function render() {
        if (!ui) return;
        const query = ui.querySelector('#search').value.trim().toLocaleLowerCase('vi');
        const asset = ui.querySelector('#asset').value, direction = ui.querySelector('#direction').value;
        const rows = state.rows.filter(row => {
            const entries = changes(row), relevant = asset === 'all' ? entries : entries.filter(c => c.kind === asset);
            return relevant.length && (!query || [row.id,row.operationId,row.summary,...entries.map(c=>c.label)].join(' ').toLocaleLowerCase('vi').includes(query)) &&
                (direction === 'all' || direction === 'in' && relevant.some(c => c.delta > 0) || direction === 'out' && relevant.some(c => c.delta < 0) || direction === 'counter' && (row.originalId || ['counter','adjustment','appeal'].includes(row.source)));
        });
        list.replaceChildren();
        for (const row of rows) {
            const card = text('article','', 'row'), head = text('div','', 'row-head');
            head.append(text('h4',row.summary || 'Biến động tài sản'),text('time',when(row),'time'));card.append(head);
            const amounts = text('div','', 'amounts');
            for (const change of changes(row).slice(0,4)) amounts.append(text('span',describe(change),'chip ' + (change.delta > 0 ? 'positive' : change.delta < 0 ? 'negative' : '')));
            if (changes(row).length > 4) amounts.append(text('span',`+ ${changes(row).length-4} thay đổi`,'chip'));
            card.append(amounts);
            const bottom = text('div','', 'bottom'); bottom.append(text('span','Mã: ' + row.id,'meta'));
            const button = text('button',row.originalId ? 'Xem giao dịch & khoản gốc' : 'Xem chi tiết','link'); button.type = 'button';button.onclick = () => detail(row);bottom.append(button);card.append(bottom);list.append(card);
        }
        if (!rows.length) list.append(text('div',state.rows.length ? 'Chưa thấy giao dịch phù hợp trong phần đã tải.' : 'Chưa có giao dịch được ghi nhận. Giao dịch mới sẽ xuất hiện sau khi được lưu thành công.','empty'));
        status.className = ''; status.textContent = `Hiển thị ${rows.length} / ${state.rows.length} giao dịch đã tải.`;
        updatePending();
    }
    async function detail(row) {
        state.selected = row.id;
        const body = ui.querySelector('.dialog-body');body.replaceChildren();
        body.append(text('h4',row.summary),text('p',`${when(row)}\nMã giao dịch: ${row.id}${row.operationId ? '\nMã nghiệp vụ: '+row.operationId : ''}`,'meta'));
        for (const change of changes(row)) {
            const line = text('div',describe(change),'detail-line');
            if (typeof change.before === 'number' && typeof change.after === 'number') line.append(text('div',`${change.before.toLocaleString('vi-VN')} → ${change.after.toLocaleString('vi-VN')}`,'meta'));
            if (change.note) line.append(text('div',change.note,'meta'));body.append(line);
        }
        if (changes(row).some(c => typeof c.delta !== 'number')) body.append(text('p','Một số thao tác đặt trực tiếp số dư. Lịch sử ghi giá trị sau khi cập nhật, không suy đoán số cộng/trừ khi chưa có số trước được xác nhận.','notice'));
        body.append(text('p','Khoản đối ứng có mã riêng để liên kết khoản gốc. Bản ghi gốc có thể đã ra ngoài giới hạn 30 giao dịch; dữ liệu đối soát vẫn được giữ. Chỉ giáo viên được thực hiện điều chỉnh; mở lịch sử không làm thay đổi số dư.','notice'));
        const links = text('div','', 'links');body.append(links);
        if (!dialog.open) dialog.showModal();
        const openRelated = async id => {
            try {
                const related = (await db.ref(`student_asset_history/${state.username}/${id}`).once('value')).val();
                if (related) detail({ ...related,id }); else body.append(text('p','Khoản gốc không còn trong 30 giao dịch gần nhất hoặc chưa từng được ghi nhận. Mã tra cứu: '+id,'notice'));
            } catch (_) { body.append(text('p','Không tải được khoản liên quan. Hãy thử lại.','notice')); }
        };
        if (row.originalId) { const button=text('button','↗ Khoản gốc','link');button.onclick=()=>openRelated(row.originalId);links.append(button); }
        try {
            const snap=await db.ref(`student_asset_history/${state.username}`).orderByChild('originalId').equalTo(row.id).limitToLast(20).once('value');
            if(state.selected!==row.id)return;
            snap.forEach(child=>{const button=text('button','↗ Khoản đối ứng / điều chỉnh','link');button.onclick=()=>detail({...child.val(),id:child.key});links.append(button);});
        } catch (_) { links.append(text('p','Chưa tải được liên kết đối ứng.','meta')); }
    }
    window.StudentAssetHistory = { open: () => load(false), load };
})();
