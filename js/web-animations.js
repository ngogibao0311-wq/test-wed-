/* ============================================================================
 * WEB ANIMATIONS — MODULE DÙNG CHUNG CHO STUDENT.HTML VÀ TEACHER.HTML
 * Phiên bản: 1.0.0
 *
 * Cách nạp:
 *   <link rel="stylesheet" href="css/web-animations.css?v=1.0">
 *   <script src="js/web-animations.js?v=1.0"></script>
 *
 * Nên đặt CSS sau mobile.css và đặt JS sau common.js, trước student.js/teacher.js.
 * ========================================================================== */
(() => {
    'use strict';

    if (window.WebAnimationSystem) return;

    const VERSION = '1.0.0';
    const LAYER_ID = 'wfx-web-animation-layer';
    const PROGRESS_ID = 'wfx-scroll-progress';

    const EXCLUSION_SELECTOR = [
        '#global-effect-container',
        '#virtual-pet-container',
        '#coinWidget',
        '.store-item-card',
        '.bag-inventory-slot',
        '.item-icon-wrapper',
        '.modal-overlay',
        '.student-modal-overlay',
        '.ql-toolbar',
        '.ql-container',
        '#hoihoaStudentModal',
        '#hhConfirmModal',
        '#artworkPreviewModal',
        '[class^="effect-"]',
        '[class*=" effect-"]',
        '[class^="pet-"]',
        '[class*=" pet-"]',
        '[class^="fe-"]',
        '[class*=" fe-"]',
        '[class^="hh-"]',
        '[class*=" hh-"]',
        '[class^="royal-"]',
        '[class*=" royal-"]',
        '[class^="leaderboard-"]',
        '[class*=" leaderboard-"]',
        '[class^="lb-"]',
        '[class*=" lb-"]',
        '[class^="dl-"]',
        '[class*=" dl-"]'
    ].join(',');

    const REVEAL_SELECTOR = [
        '.tab-content.active > .card',
        '.tab-content.active > .form-container',
        '.tab-content.active .accordion-card',
        '.tab-content.active .glass-alert',
        '.tab-content.active > table',
        '.tab-content.active .table-responsive',
        '.content > .card'
    ].join(',');

    const RIPPLE_SELECTOR = [
        '.nav-item',
        '.btn-logout',
        '.sidebar-toggle',
        '.content button',
        '.content [role="button"]'
    ].join(',');

    const state = {
        initialized: false,
        enabled: true,
        reducedMotion: false,
        lowPower: false,
        layer: null,
        progress: null,
        observer: null,
        pointerFrame: 0,
        scrollFrame: 0,
        pointerX: window.innerWidth * 0.55,
        pointerY: window.innerHeight * 0.24,
        listeners: []
    };

    function on(target, type, handler, options) {
        target.addEventListener(type, handler, options);

        state.listeners.push(() => {
            target.removeEventListener(type, handler, options);
        });
    }

    function getCurrentUser() {
        try {
            return JSON.parse(
                localStorage.getItem('currentUser') || 'null'
            );
        } catch (_) {
            return null;
        }
    }

    function resolveRole() {
        const role = getCurrentUser()?.role;

        if (role === 'teacher' || role === 'student') {
            return role;
        }

        const title = String(
            document.title || ''
        ).toLowerCase();

        if (title.includes('giáo viên')) {
            return 'teacher';
        }

        if (title.includes('học sinh')) {
            return 'student';
        }

        return document.querySelector('#studentName')
            ? 'student'
            : 'teacher';
    }

    function detectLowPowerMode() {
        const memory = Number(
            navigator.deviceMemory || 0
        );

        const cores = Number(
            navigator.hardwareConcurrency || 0
        );

        const coarsePointer = window.matchMedia(
            '(pointer: coarse)'
        ).matches;

        const narrowScreen = window.matchMedia(
            '(max-width: 768px)'
        ).matches;

        return (
            (memory > 0 && memory <= 4) ||
            (cores > 0 && cores <= 4) ||
            coarsePointer ||
            narrowScreen
        );
    }

    function isExcluded(element) {
        return (
            !element ||
            !(element instanceof Element) ||
            Boolean(element.closest(EXCLUSION_SELECTOR))
        );
    }

    function isVisible(element) {
        if (!element || !element.isConnected) {
            return false;
        }

        const style = getComputedStyle(element);

        if (
            style.display === 'none' ||
            style.visibility === 'hidden'
        ) {
            return false;
        }

        return element.getClientRects().length > 0;
    }

    function createParticle(index, total) {
        const particle = document.createElement('i');

        const size =
            4 + Math.random() * 5;

        const duration =
            8 + Math.random() * 10;

        const delay =
            -(Math.random() * duration);

        const left =
            ((index + Math.random() * 1.6) / total) * 100;

        const top =
            12 + Math.random() * 86;

        const drift =
            -34 + Math.random() * 68;

        particle.className = 'wfx-particle';

        particle.style.setProperty(
            '--wfx-size',
            `${size.toFixed(2)}px`
        );

        particle.style.setProperty(
            '--wfx-duration',
            `${duration.toFixed(2)}s`
        );

        particle.style.setProperty(
            '--wfx-delay',
            `${delay.toFixed(2)}s`
        );

        particle.style.setProperty(
            '--wfx-left',
            `${left.toFixed(2)}%`
        );

        particle.style.setProperty(
            '--wfx-top',
            `${top.toFixed(2)}%`
        );

        particle.style.setProperty(
            '--wfx-drift',
            `${drift.toFixed(1)}px`
        );

        return particle;
    }

    function buildScene() {
        if (document.getElementById(LAYER_ID)) {
            state.layer =
                document.getElementById(LAYER_ID);

            return;
        }

        const dashboard =
            document.querySelector('.dashboard');

        if (!dashboard || !document.body) {
            return;
        }

        const layer =
            document.createElement('div');

        layer.id = LAYER_ID;

        layer.setAttribute(
            'aria-hidden',
            'true'
        );

        layer.innerHTML = `
            <div class="wfx-aurora wfx-aurora-a"></div>
            <div class="wfx-aurora wfx-aurora-b"></div>
            <div class="wfx-aurora wfx-aurora-c"></div>

            <div class="wfx-grid"></div>

            <div class="wfx-cursor-glow"></div>

            <div class="wfx-particle-field"></div>
        `;

        const field =
            layer.querySelector(
                '.wfx-particle-field'
            );

        const particleCount =
            state.reducedMotion
                ? 0
                : state.lowPower
                    ? 14
                    : 32;

        const fragment =
            document.createDocumentFragment();

        for (
            let index = 0;
            index < particleCount;
            index += 1
        ) {
            fragment.appendChild(
                createParticle(
                    index,
                    particleCount
                )
            );
        }

        field.appendChild(fragment);

        document.body.insertBefore(
            layer,
            document.body.firstChild
        );

        state.layer = layer;
    }

    function buildProgressBar() {
        if (document.getElementById(PROGRESS_ID)) {
            state.progress =
                document.getElementById(PROGRESS_ID);

            return;
        }

        const progress =
            document.createElement('div');

        progress.id = PROGRESS_ID;

        progress.setAttribute(
            'aria-hidden',
            'true'
        );

        progress.innerHTML = '<span></span>';

        document.body.appendChild(progress);

        state.progress = progress;
    }

    function updatePointerNow() {
        state.pointerFrame = 0;

        if (!state.layer) {
            return;
        }

        state.layer.style.setProperty(
            '--wfx-pointer-x',
            `${state.pointerX}px`
        );

        state.layer.style.setProperty(
            '--wfx-pointer-y',
            `${state.pointerY}px`
        );
    }

    function handlePointerMove(event) {
        if (
            state.reducedMotion ||
            state.lowPower ||
            !state.enabled
        ) {
            return;
        }

        state.pointerX = event.clientX;
        state.pointerY = event.clientY;

        if (!state.pointerFrame) {
            state.pointerFrame =
                requestAnimationFrame(
                    updatePointerNow
                );
        }
    }

    function updateScrollNow() {
        state.scrollFrame = 0;

        if (!state.progress) {
            return;
        }

        const root =
            document.documentElement;

        const maxScroll = Math.max(
            1,
            root.scrollHeight - window.innerHeight
        );

        const ratio = Math.min(
            1,
            Math.max(
                0,
                window.scrollY / maxScroll
            )
        );

        state.progress.style.setProperty(
            '--wfx-scroll-progress',
            ratio.toFixed(4)
        );
    }

    function handleScroll() {
        if (!state.scrollFrame) {
            state.scrollFrame =
                requestAnimationFrame(
                    updateScrollNow
                );
        }
    }

    function revealElement(
        element,
        order = 0
    ) {
        if (
            state.reducedMotion ||
            !state.enabled ||
            isExcluded(element) ||
            !isVisible(element) ||
            element.dataset.wfxRevealed === '1'
        ) {
            return;
        }

        element.dataset.wfxRevealed = '1';

        const animation = element.animate(
            [
                {
                    opacity: 0,
                    transform:
                        'translate3d(0, 16px, 0)'
                },
                {
                    opacity: 1,
                    transform:
                        'translate3d(0, 0, 0)'
                }
            ],
            {
                duration:
                    state.lowPower
                        ? 300
                        : 440,

                delay:
                    Math.min(order, 8) *
                    (
                        state.lowPower
                            ? 24
                            : 42
                    ),

                easing:
                    'cubic-bezier(.2, .8, .2, 1)',

                fill: 'both'
            }
        );

        animation.finished
            .catch(() => undefined)
            .finally(() => {
                animation.cancel();
            });
    }

    function scanRevealTargets(
        root = document
    ) {
        if (
            !state.enabled ||
            state.reducedMotion
        ) {
            return;
        }

        const targets = [];

        if (
            root instanceof Element &&
            root.matches(REVEAL_SELECTOR)
        ) {
            targets.push(root);
        }

        if (root.querySelectorAll) {
            targets.push(
                ...root.querySelectorAll(
                    REVEAL_SELECTOR
                )
            );
        }

        [...new Set(targets)].forEach(
            (element, index) => {
                revealElement(
                    element,
                    index
                );
            }
        );
    }

    function handleRipple(event) {
        if (
            state.reducedMotion ||
            !state.enabled ||
            event.button > 0
        ) {
            return;
        }

        const host =
            event.target instanceof Element
                ? event.target.closest(
                    RIPPLE_SELECTOR
                )
                : null;

        if (
            !host ||
            isExcluded(host) ||
            host.disabled ||
            host.getAttribute(
                'aria-disabled'
            ) === 'true'
        ) {
            return;
        }

        const rect =
            host.getBoundingClientRect();

        const ripple =
            document.createElement('span');

        ripple.className = 'wfx-ripple';

        ripple.style.setProperty(
            '--wfx-ripple-x',
            `${event.clientX - rect.left}px`
        );

        ripple.style.setProperty(
            '--wfx-ripple-y',
            `${event.clientY - rect.top}px`
        );

        host.classList.add(
            'wfx-ripple-host'
        );

        host.appendChild(ripple);

        ripple.addEventListener(
            'animationend',
            () => ripple.remove(),
            {
                once: true
            }
        );

        setTimeout(
            () => ripple.remove(),
            800
        );
    }

    function handleVisibilityChange() {
        document.body?.classList.toggle(
            'wfx-paused',
            document.hidden || !state.enabled
        );
    }

    function observeDynamicContent() {
        const content =
            document.querySelector('.content');

        if (
            !content ||
            typeof MutationObserver ===
            'undefined'
        ) {
            return;
        }

        state.observer =
            new MutationObserver(
                mutations => {
                    let needsActiveTabScan =
                        false;

                    for (
                        const mutation
                        of mutations
                    ) {
                        if (
                            mutation.type ===
                            'childList'
                        ) {
                            mutation.addedNodes
                                .forEach(node => {
                                    if (
                                        node instanceof
                                        Element
                                    ) {
                                        scanRevealTargets(
                                            node
                                        );
                                    }
                                });
                        }

                        if (
                            mutation.type ===
                            'attributes' &&
                            mutation.target instanceof
                            Element &&
                            mutation.target.classList
                                .contains(
                                    'tab-content'
                                ) &&
                            mutation.target.classList
                                .contains(
                                    'active'
                                )
                        ) {
                            needsActiveTabScan =
                                true;
                        }
                    }

                    if (
                        needsActiveTabScan
                    ) {
                        requestAnimationFrame(
                            () => {
                                scanRevealTargets(
                                    content
                                );
                            }
                        );
                    }
                }
            );

        state.observer.observe(
            content,
            {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: [
                    'class'
                ]
            }
        );
    }

    function bindEvents() {
        on(
            window,
            'pointermove',
            handlePointerMove,
            {
                passive: true
            }
        );

        on(
            window,
            'scroll',
            handleScroll,
            {
                passive: true
            }
        );

        on(
            window,
            'resize',
            handleScroll,
            {
                passive: true
            }
        );

        on(
            document,
            'pointerdown',
            handleRipple,
            {
                passive: true
            }
        );

        on(
            document,
            'visibilitychange',
            handleVisibilityChange
        );

        on(
            document,
            'click',
            event => {
                const nav =
                    event.target instanceof Element
                        ? event.target.closest(
                            '.nav-item'
                        )
                        : null;

                if (nav) {
                    setTimeout(
                        () => {
                            scanRevealTargets(
                                document
                            );
                        },
                        70
                    );
                }
            },
            {
                passive: true
            }
        );
    }

    function init() {
        if (
            state.initialized ||
            !document.body
        ) {
            return;
        }

        if (
            !document.querySelector(
                '.dashboard'
            )
        ) {
            return;
        }

        state.initialized = true;

        state.reducedMotion =
            window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            ).matches;

        state.lowPower =
            detectLowPowerMode();

        const role =
            resolveRole();

        document.body.classList.add(
            'wfx-ready',
            `wfx-role-${role}`
        );

        document.body.classList.toggle(
            'wfx-low-power',
            state.lowPower
        );

        buildScene();
        buildProgressBar();
        bindEvents();
        observeDynamicContent();

        updatePointerNow();
        updateScrollNow();

        requestAnimationFrame(
            () => {
                scanRevealTargets(
                    document
                );
            }
        );
    }

    function setEnabled(enabled) {
        state.enabled =
            Boolean(enabled);

        document.body?.classList.toggle(
            'wfx-paused',
            !state.enabled ||
            document.hidden
        );

        if (state.layer) {
            state.layer.hidden =
                !state.enabled;
        }

        if (state.progress) {
            state.progress.hidden =
                !state.enabled;
        }
    }

    function refresh() {
        scanRevealTargets(document);
        updateScrollNow();
    }

    function destroy() {
        state.observer?.disconnect();

        state.listeners
            .splice(0)
            .forEach(remove => {
                remove();
            });

        if (state.pointerFrame) {
            cancelAnimationFrame(
                state.pointerFrame
            );
        }

        if (state.scrollFrame) {
            cancelAnimationFrame(
                state.scrollFrame
            );
        }

        state.layer?.remove();
        state.progress?.remove();

        document.body?.classList.remove(
            'wfx-ready',
            'wfx-role-teacher',
            'wfx-role-student',
            'wfx-low-power',
            'wfx-paused'
        );

        state.initialized = false;
    }

    window.WebAnimationSystem =
        Object.freeze({
            version: VERSION,

            init,

            refresh,

            destroy,

            enable: () => {
                setEnabled(true);
            },

            disable: () => {
                setEnabled(false);
            },

            getState: () => ({
                initialized:
                    state.initialized,

                enabled:
                    state.enabled,

                reducedMotion:
                    state.reducedMotion,

                lowPower:
                    state.lowPower
            })
        });

    if (
        document.readyState ===
        'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            init,
            {
                once: true
            }
        );
    } else {
        init();
    }
})();