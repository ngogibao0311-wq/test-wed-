/* Exam checks and acknowledgement-based save status. No database writes here. */
(() => {
    'use strict';
    const records = new Map();
    const indicators = [];
    let connected = false, ui, panel, list, busy = false, view = 'sync';
    const state = id => {
        const key = String(id);
        if (!records.has(key)) records.set(key, { revision: 0, local: 'Chưa lưu', cloud: 'Chưa đồng bộ', submission: 'Chưa nộp' });
        return records.get(key);
    };
    function mount() {
        if (ui) return;
        const host = document.createElement('div');
        host.id = 'study-reliability';
        ui = host.attachShadow({ mode: 'open' });
        ui.innerHTML = `<style>
          :host{font:14px/1.5 system-ui;color:#1e293b}button{font:inherit;cursor:pointer;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#24334c;padding:9px 13px}
          dialog{color:#1e293b;background:#fff;border:0;border-radius:18px;padding:24px;width:min(560px,calc(100vw - 56px));max-height:80dvh;overflow:auto;box-sizing:border-box}dialog::backdrop{background:#0f172a99}h2{font-size:20px;margin:0 0 14px}p{white-space:pre-line;overflow-wrap:anywhere}article{border-bottom:1px solid #e2e8f0;padding:10px 0}footer{display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:white;padding-top:14px}
          @media(max-width:767px){dialog{padding:18px}}
        </style><dialog><h2></h2><div id="list" aria-live="polite"></div><footer><button id="close" type="button">Đóng</button><button id="continue" type="button" hidden>Tiếp tục vào thi</button></footer></dialog>`;
        document.body.append(host);
        panel = ui.querySelector('dialog'); list = ui.querySelector('#list');
        document.querySelectorAll('#studentDashboard .tab-content').forEach(tab => {
            const heading = tab.querySelector('h2');
            if (!heading) return;
            const indicator = document.createElement('span');
            indicator.className = 'study-connection-dot ui-theme-immune';
            const shadow = indicator.attachShadow({ mode: 'open' });
            shadow.innerHTML = `<style>
              :host{all:initial;display:inline-block;vertical-align:middle;margin-inline-end:8px;line-height:1}
              button{all:initial;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:24px;height:28px;vertical-align:middle;cursor:pointer;border-radius:8px}
              button:focus-visible{outline:2px solid #6366f1;outline-offset:2px}
              i{display:block;width:11px;height:11px;border-radius:50%;background:#dc2626;box-shadow:0 0 0 3px #dc262618}
              :host([data-connected="true"]) i{background:#16a34a;box-shadow:0 0 0 3px #16a34a18}
            </style><button type="button" aria-haspopup="dialog"><i aria-hidden="true"></i></button>`;
            const button = shadow.querySelector('button');
            button.onclick = () => { if (!busy) { view = 'sync'; render(); if (!panel.open) panel.showModal(); } };
            indicators.push({ indicator, button });
            heading.prepend(indicator);
            // Store headings are rewritten when switching between regular/premium shops.
            new MutationObserver(() => { if (!heading.contains(indicator)) heading.prepend(indicator); }).observe(heading, { childList: true });
        });
        ui.querySelector('#close').onclick = () => panel.close();
        db.ref('.info/connected').on('value', snap => { connected = snap.val() === true; refresh(); });
        window.addEventListener('offline', () => { connected = false; refresh(); });
        refresh();
    }
    function paragraph(text, parent = list) { const p = document.createElement('p'); p.textContent = text; parent.append(p); return p; }
    function render() {
        ui.querySelector('h2').textContent = 'Trạng thái đồng bộ';
        list.replaceChildren();
        paragraph(connected ? '● Đã kết nối đám mây' : '○ Chưa kết nối đám mây; dữ liệu chưa được xác nhận sẽ chờ kết nối.');
        for (const [id, r] of records) {
            const article = document.createElement('article');
            paragraph(`Bài ${id}\nTrên máy: ${r.local}\nĐám mây: ${r.cloud}\nNộp bài: ${r.submission}`, article); list.append(article);
        }
        if (!records.size) paragraph('Chưa có thao tác lưu trong lần mở trang này.');
        paragraph('Tệp đang chọn chưa được tính là đã tải lên. Chỉ thông báo nộp thành công mới xác nhận bài đã được máy chủ tiếp nhận.');
    }
    function refresh() {
        if (!ui) return;
        const error = [...records.values()].some(r => r.local.startsWith('Lưu thất bại') || r.cloud.startsWith('Chưa lưu') || r.submission.startsWith('Chưa nộp thành công'));
        for (const { indicator, button } of indicators) {
            indicator.dataset.connected = String(connected);
            const label = (connected ? 'Đã kết nối đám mây' : 'Chưa kết nối đám mây') + (error ? ' · Có lỗi lưu bài' : '') + ' — nhấn để xem trạng thái đồng bộ';
            button.title = label;
            button.setAttribute('aria-label', label);
        }
        if (panel.open && !busy && view === 'sync') render();
    }
    const time = () => new Date().toLocaleTimeString('vi-VN');
    async function timeout(promise) {
        let timer;
        try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Kết nối quá lâu. Hãy thử lại.')), 12000); })]); }
        finally { clearTimeout(timer); }
    }
    async function preflight(assignment) {
        if (busy) return null;
        mount(); busy = true; view = 'preflight'; list.replaceChildren(); ui.querySelector('h2').textContent = 'Kiểm tra trước khi vào thi';
        const proceed = ui.querySelector('#continue'); proceed.hidden = true;
        panel.showModal(); let live = null, passed = true;
        const check = async (label, task) => { const p = paragraph(`… ${label}`); try { await task(); p.textContent = `✓ ${label}`; } catch (e) { passed = false; p.textContent = `✕ ${label}: ${e.message}`; } };
        await check('Kết nối máy chủ', async () => { if (!navigator.onLine || (await timeout(db.ref('.info/connected').once('value'))).val() !== true) throw Error('Chưa kết nối đám mây'); });
        await check('Phiên đăng nhập', async () => { const user = firebase.auth().currentUser; if (!user) throw Error('Cần đăng nhập lại'); await timeout(user.getIdToken(true)); });
        await check('Khả năng lưu nháp trên máy', async () => { const key = `exam_probe_${Date.now()}`; try { localStorage.setItem(key, 'ok'); if (localStorage.getItem(key) !== 'ok') throw Error('Không đọc được bản nháp'); } finally { localStorage.removeItem(key); } });
        await check('Trạng thái và lịch bài thi', async () => {
            live = (await timeout(db.ref(`assignments/${assignment._fbKey || assignment.id}`).once('value'))).val();
            if (!live) throw Error('Không tìm thấy bài');
            if (live.isLocked === true || live.teacherLocked === true) throw Error('Giáo viên đã khóa bài');
            const now = Date.now();
            if (live.startDate && new Date(live.startDate).getTime() > now) throw Error('Chưa đến giờ bắt đầu');
            if (live.endDate && new Date(live.endDate).getTime() <= now) throw Error('Đã hết hạn nộp');
        });
        paragraph('Các quyền nộp bài và phiên thi tiếp tục được kiểm tra khi vào thi. Bước này không tạo phiên thi mới. Nếu đang tiếp tục bài, thời gian còn lại vẫn tính theo phiên trước.');
        if (!panel.open) { busy = false; return null; }
        if (!passed) { busy = false; return null; }
        proceed.hidden = false;
        return new Promise(resolve => {
            let accepted = false;
            proceed.onclick = () => { accepted = true; panel.close(); };
            panel.addEventListener('close', () => { proceed.hidden = true; proceed.onclick = null; busy = false; resolve(accepted ? { ...assignment, ...live, _fbKey: assignment._fbKey } : null); }, { once: true });
        });
    }
    window.StudyReliability = {
        preflight,
        local(id, ok) { const r = state(id); r.revision++; r.local = ok ? `Đã lưu lúc ${time()}` : 'Lưu thất bại — kiểm tra bộ nhớ trình duyệt'; r.cloud = 'Có thay đổi chưa đồng bộ'; refresh(); },
        begin(id) { const r = state(id); r.cloud = 'Đang gửi…'; refresh(); return r.revision; },
        finish(id, revision, ok) { const r = state(id); if (r.revision === revision) r.cloud = ok ? `Đã được máy chủ xác nhận lúc ${time()}` : 'Chưa lưu lên đám mây — phiên không cho phép hoặc lỗi kết nối'; refresh(); },
        submitted(id, status) { state(id).submission = status; refresh(); }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
