(() => {
    'use strict';
    if (window.StudentViewPerformance) return;

    // Keep only the newest display request per view. Hidden views retain their
    // request until navigation reveals them; transaction work never enters here.
    const pending = new Map();
    let frame = null;
    let observedTab = null;
    const observer = new MutationObserver(wake);

    function visible(view) {
        const tab = document.getElementById('tab-store');
        if (document.hidden || !tab?.classList.contains('active')) return false;
        const luxury = tab.classList.contains('luxury-store-view-active');
        const collection = tab.classList.contains('store-collection-view-active');
        if (view === 'luxury') return luxury && !collection;
        if (view === 'collections') return collection;
        return !luxury && !collection;
    }

    function wake() {
        if (frame !== null || ![...pending.keys()].some(visible)) return;
        frame = requestAnimationFrame(flush);
    }

    function flush() {
        frame = null;
        for (const [view, render] of pending) {
            if (!visible(view)) continue;
            pending.delete(view);
            try { render(); }
            catch (error) { console.error('[Student view]', view, error); }
            // At most one full list per frame, even if a render navigates.
            break;
        }
        wake();
    }

    function schedule(view, render) {
        const tab = document.getElementById('tab-store');
        if (tab && tab !== observedTab) {
            observer.disconnect();
            observer.observe(tab, {attributes: true, attributeFilter: ['class']});
            observedTab = tab;
        }
        pending.set(view, render);
        wake();
    }

    document.addEventListener('visibilitychange', wake);
    window.StudentViewPerformance = Object.freeze({schedule, visible});
})();
