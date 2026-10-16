(() => {
    'use strict';
    if (window.PageWork) return;
    const running = new Map(), deferred = new Map(), observed = new WeakSet();
    let wakeTimer = null;
    const observer = new MutationObserver(wake);

    function visible(host) {
        if (!host?.isConnected || document.hidden) return false;
        for (let node = host; node && node !== document.body; node = node.parentElement) {
            if (node.hidden || node.style?.display === 'none') return false;
            if (node.classList?.contains('tab-content') && !node.classList.contains('active')) return false;
        }
        return true;
    }

    function wake() {
        if (wakeTimer !== null || !deferred.size) return;
        wakeTimer = setTimeout(() => {
            wakeTimer = null;
            for (const [key, job] of deferred) {
                if (!visible(document.getElementById(job.hostId))) continue;
                deferred.delete(key);
                Promise.resolve().then(job.work).catch(error => console.error('[Page work]', key, error));
            }
        }, 0);
    }

    // Display-only work may wait for navigation. Never defer transaction,
    // deadline enforcement, auth, or data needed to decide a financial action.
    function defer(key, hostId, work) {
        const host = document.getElementById(hostId);
        if (!host) return false;
        if (visible(host)) { deferred.delete(key); return false; }
        deferred.set(key, {hostId, work});
        for (let node = host; node && node !== document.body; node = node.parentElement) {
            if (observed.has(node)) continue;
            observed.add(node);
            observer.observe(node, {attributes: true, attributeFilter: ['class', 'style', 'hidden']});
        }
        return true;
    }

    // Callers await the latest pass. Bursts during a pass require one followup,
    // not one more full read/render for every notification.
    function run(key, work) {
        const previous = running.get(key);
        if (previous) { previous.next = work; return previous.promise; }
        const state = {next: work, promise: null};
        running.set(key, state);
        state.promise = Promise.resolve().then(async () => {
            let result;
            try {
                while (state.next) {
                    const task = state.next;
                    state.next = null;
                    try { result = await task(); }
                    catch (error) { if (!state.next) throw error; }
                    if (state.next) await new Promise(resolve => setTimeout(resolve, 0));
                }
                return result;
            } finally { running.delete(key); }
        });
        return state.promise;
    }

    function indexSubmissions(rows, assignmentId = row => row.assignmentId, username = row => row.studentUsername) {
        const users = new Map();
        for (const row of rows || []) {
            const user = String(username(row) ?? ''), id = String(assignmentId(row) ?? '');
            if (!users.has(user)) users.set(user, new Map());
            const assignments = users.get(user);
            if (!assignments.has(id)) assignments.set(id, []);
            assignments.get(id).push(row);
        }
        // Return the bucket without sorting or mutating the source. Existing
        // selection functions preserve all tie-break and violation semantics.
        return {get: (user, id) => users.get(String(user ?? ''))?.get(String(id ?? '')) || []};
    }

    document.addEventListener('visibilitychange', wake);
    window.PageWork = Object.freeze({defer, run, indexSubmissions});
})();
