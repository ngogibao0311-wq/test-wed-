(() => {
    'use strict';
    if (window.ListMediaPerformance) return;
    const scopes = '#assignmentsList,#gradesList,#studentMaterialsList,#assignedListContainer,#submissionsList,#teacherMaterialsContainer,#view-roadmap,#view-schedule,#storeItemsContainer,#luxuryStoreGrid';
    const enabled = () => document.body.classList.contains('perf-balanced');
    const deferred = new Set(), roots = new Set();
    let queued = false;
    const style = document.createElement('style');
    style.textContent = `
        body.perf-balanced :is(${scopes}) > :is(.card,.store-item,article) {
            content-visibility:auto; contain-intrinsic-size:auto 420px;
        }
        body.perf-balanced :is(#teacherRoadmapBody,#studentRoadmapBody,#teacherScheduleBody,#studentScheduleBody) > tr {
            content-visibility:auto; contain-intrinsic-size:auto 64px;
        }
        [data-perf-src] { min-height:80px; }
        @media print { body.perf-balanced :is(${scopes}) *, body.perf-balanced tr { content-visibility:visible!important; } }
    `;
    document.head.append(style);
    function hydrate(node) {
        intersection?.unobserve(node); deferred.delete(node);
        for (const attr of ['sizes', 'srcset', 'src']) {
            const value = node.getAttribute('data-perf-' + attr);
            if (value !== null) { node.setAttribute(attr, value); node.removeAttribute('data-perf-' + attr); }
        }
    }
    const intersection = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) hydrate(entry.target); });
    }, {rootMargin: '400px 0px'}) : null;
    function prepareHTML(html) {
        if (!enabled() || typeof html !== 'string' || !/<(?:img|iframe|audio|video)\b/i.test(html)) return html;
        const template = document.createElement('template'); template.innerHTML = html;
        template.content.querySelectorAll('img,iframe,audio,video').forEach(node => {
            if (node.matches('audio,video')) { if (!node.hasAttribute('autoplay')) node.preload = 'none'; return; }
            node.loading = 'lazy';
            if (node.tagName === 'IMG') node.decoding = 'async';
            // Assignment timers and YouTube tracking own their player's lifecycle.
            if (!intersection || node.matches('[data-assignment-id],[id^="yt-player-"]') || node.closest('picture')) return;
            for (const attr of ['src', 'srcset', 'sizes']) {
                if (node.hasAttribute(attr)) { node.setAttribute('data-perf-' + attr, node.getAttribute(attr)); node.removeAttribute(attr); }
            }
        });
        return template.innerHTML;
    }
    function scan(root) {
        const media = root.matches?.('img,iframe,audio,video') ? [root] : [];
        root.querySelectorAll?.('img,iframe,audio,video').forEach(node => media.push(node));
        for (const node of media) {
            // HTML helpers also serve modals. A user-opened viewer must load immediately.
            if (node.hasAttribute('data-perf-src')) {
                if (!enabled() || !node.closest(scopes) || !intersection) hydrate(node);
                else if (!deferred.has(node)) { deferred.add(node); intersection.observe(node); }
            }
            if (!enabled() || !node.closest(scopes)) continue;
            if (node.matches('img,iframe')) node.loading = 'lazy';
            if (node.tagName === 'IMG') node.decoding = 'async';
            // Do not interrupt any audio/video already playing.
            if (node.matches('audio,video') && node.paused && !node.autoplay) node.preload = 'none';
        }
    }
    function flush() {
        queued = false;
        for (const node of deferred) if (!node.isConnected) { intersection?.unobserve(node); deferred.delete(node); }
        for (const root of roots) if (root.isConnected) scan(root);
        roots.clear();
    }
    new MutationObserver(mutations => {
        let removed = false;
        for (const mutation of mutations) {
            removed ||= mutation.removedNodes.length > 0;
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && (node.matches('img,iframe,audio,video,[data-perf-src]') || node.querySelector('img,iframe,audio,video,[data-perf-src]'))) roots.add(node);
            }
        }
        if (!queued && (roots.size || (removed && deferred.size))) { queued = true; requestAnimationFrame(flush); }
    }).observe(document.body, {childList: true, subtree: true});
    for (const name of ['buildAttachmentPreviewHTML', 'getEmbedHTML']) {
        const original = window[name];
        if (typeof original === 'function') window[name] = function(...args) { return prepareHTML(original.apply(this, args)); };
    }
    window.addEventListener('web-performance-optimizer-change', () => {
        if (!enabled()) for (const node of [...deferred]) hydrate(node);
        document.querySelectorAll(scopes).forEach(scan);
    });
    window.ListMediaPerformance = Object.freeze({prepareHTML});
    document.querySelectorAll(scopes).forEach(scan);
})();
