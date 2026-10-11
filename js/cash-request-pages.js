(() => {
    'use strict';
    const labels = { pending: 'Chờ duyệt', processing: 'Đang xử lý', transferring: 'Đang chuyển', completed: 'Hoàn tất', rejected: 'Từ chối' };
    let status = 'pending', cursor = null, more = true, rows = [], generation = 0, loading = false, controls;
    function mount(container) {
        if (controls?.isConnected) return;
        controls = document.createElement('div');
        controls.className = 'cash-page-controls';
        controls.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0';
        const select = document.createElement('select'); select.setAttribute('aria-label', 'Lọc trạng thái yêu cầu rút tiền');
        for (const [value, label] of Object.entries(labels)) { const option = document.createElement('option'); option.value = value; option.textContent = label; select.append(option); }
        select.value = status;
        select.onchange = () => { status = select.value; window.loadTeacherCashRequests(); };
        const refresh = document.createElement('button'); refresh.type = 'button'; refresh.textContent = 'Làm mới'; refresh.onclick = () => window.loadTeacherCashRequests();
        const next = document.createElement('button'); next.type = 'button'; next.dataset.more = ''; next.textContent = 'Xem thêm 30'; next.onclick = () => { if (!loading && more) window.loadTeacherCashRequests(true); };
        const note = document.createElement('span'); note.dataset.note = '';
        controls.append(select, refresh, next, note); container.before(controls);
    }
    async function load(container, append) {
        mount(container);
        const token = ++generation;
        if (!append) { cursor = null; more = true; rows = []; }
        loading = true; controls.querySelector('[data-more]').disabled = true;
        controls.querySelector('[data-note]').textContent = 'Đang tải…';
        try {
            let query = db.ref('cash_requests').orderByChild('status').startAt(status);
            query = cursor ? query.endAt(status, cursor) : query.endAt(status);
            const snap = await query.limitToLast(cursor ? 32 : 31).once('value');
            if (token !== generation) return null;
            const items = []; snap.forEach(child => { if (child.key !== cursor) items.push({ ...child.val(), _fbKey: child.key }); });
            more = items.length > 30;
            const page = items.slice(-30); cursor = page[0]?._fbKey || cursor;
            rows = [...new Map([...rows, ...page].map(row => [row._fbKey, row])).values()];
            controls.querySelector('[data-note]').textContent = `${labels[status]} · đã tải ${rows.length}. Chọn từng trạng thái để xem; bấm Làm mới để lấy thay đổi.`;
            return [...rows];
        } catch (e) {
            if (token !== generation) return null;
            controls.querySelector('[data-note]').textContent = 'Tải thất bại; bấm Làm mới để thử lại.';
            throw e;
        }
        finally { if (token === generation) { loading = false; controls.querySelector('[data-more]').disabled = !more; } }
    }
    window.TeacherCashPages = { load };
})();
