/**
 * WEB PERFORMANCE OPTIMIZER — BALANCED + SETTINGS
 * Phiên bản: 1.4.0
 *
 * Mặc định: TẮT.
 * Người dùng có thể bật/tắt tại tab Cài đặt.
 *
 * Nguyên tắc:
 * - Không sửa Firebase, dữ liệu, game, chấm điểm, cửa hàng, pet logic.
 * - Không thay timer/requestAnimationFrame của module khác.
 * - Chỉ giảm tải phần hiển thị/nền khi người dùng CHỦ ĐỘNG bật.
 */
(() => {
    'use strict';

    if (window.WebPerformanceOptimizer) return;

    const VERSION = '1.4.0';
    const STORAGE_KEY_BASE = 'webPerformanceOptimizerEnabled';

    function resolveRole() {
        const title = String(document.title || '').toLowerCase();

        if (
            title.includes('giáo viên') ||
            document.querySelector('#teacherGameMainNav') ||
            document.querySelector('#tab-manage-students')
        ) {
            return 'teacher';
        }

        if (
            title.includes('học sinh') ||
            document.querySelector('#studentName') ||
            document.querySelector('#tab-game')
        ) {
            return 'student';
        }

        return 'unknown';
    }

    function getStorageKey() {
        const role = resolveRole();

        if (role === 'teacher') {
            return `${STORAGE_KEY_BASE}:teacher`;
        }

        if (role === 'student') {
            return `${STORAGE_KEY_BASE}:student`;
        }

        return `${STORAGE_KEY_BASE}:default`;
    }
    const STYLE_ID = 'web-performance-optimizer-style';
    const SETTINGS_ROW_ID = 'webPerformanceOptimizerSettingsRow';
    const TOGGLE_ID = 'toggleWebPerformanceOptimizer';
    const STATUS_ID = 'webPerformanceOptimizerStatus';

    const CONFIG = Object.freeze({
        baselineParticleLimit: 24,
        baseParticleLimit: 16,
        assistParticleLimit: 10,
        fpsThreshold: 49,
        sampleDurationMs: 2200,
        sampleDelayMs: 1400,
        lowMemoryGb: 4,
        lowCoreCount: 4
    });

    const state = {
        initialized: false,
        enabled: false,
        assist: false,
        assistReason: '',
        lastFps: null,
        sampleRunning: false,
        observer: null,
        sampleTimer: null
    };

    function safeGetStoredEnabled() {
        try {
            return localStorage.getItem(getStorageKey()) === '1';
        } catch (_) {
            return false;
        }
    }

    function safeStoreEnabled(enabled) {
        try {
            localStorage.setItem(getStorageKey(), enabled ? '1' : '0');
        } catch (_) {}
    }

    function safeNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function detectWeakDevice() {
        const memory = safeNumber(navigator.deviceMemory);
        const cores = safeNumber(navigator.hardwareConcurrency);
        const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches || false;
        const narrowScreen = window.matchMedia?.('(max-width: 768px)').matches || false;

        return (
            (memory > 0 && memory <= CONFIG.lowMemoryGb) ||
            (cores > 0 && cores <= CONFIG.lowCoreCount) ||
            (coarsePointer && narrowScreen)
        );
    }

    function notifyLoader(message) {
        try {
            window.AppStartupLoader?.setStatus?.(message);
        } catch (_) {}
    }

    function registerLoaderStep() {
        try {
            window.AppStartupLoader?.expect?.(
                ['performance_optimizer'],
                { performance_optimizer: 'Tối ưu hiệu năng & nội dung' }
            );
            notifyLoader('Đang chuẩn bị tối ưu nền, bài tập và video...');
        } catch (_) {}
    }

    function finishLoaderStep() {
        try {
            const text = state.enabled
                ? 'Tối ưu hiệu năng & nội dung đã sẵn sàng.'
                : 'Tối ưu hiệu năng đang tắt theo cài đặt.';
            window.AppStartupLoader?.markReady?.(
                'performance_optimizer',
                'Tối ưu hiệu năng & nội dung'
            );
            notifyLoader(text);
        } catch (_) {}
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
/* =========================================================
   BASELINE NHẸ — luôn hoạt động, kể cả khi công tắc tối ưu TẮT.
   Không thay logic; chỉ giảm layout/paint và animation ngoài màn hình.
   ========================================================= */
body.perf-baseline #wfx-web-animation-layer .wfx-particle:nth-child(n + ${CONFIG.baselineParticleLimit + 1}) {
    display: none !important;
}

body.perf-baseline #assignmentsList > .card,
body.perf-baseline #gradesList > .card,
body.perf-baseline #assignedListContainer > .card,
body.perf-baseline #submissionsList > .card {
    content-visibility: auto;
    contain-intrinsic-size: auto 500px;
}

body.perf-baseline.perf-page-hidden {
    animation-play-state: paused !important;
}

body.perf-baseline.perf-page-hidden #wfx-web-animation-layer *,
body.perf-baseline.perf-page-hidden #wfx-scroll-progress * {
    animation-play-state: paused !important;
}

/* Trình duyệt yếu / mobile: baseline nhẹ hơn một chút kể cả khi toggle OFF. */
@media (max-width: 768px), (pointer: coarse) {
    body.perf-baseline #wfx-web-animation-layer .wfx-particle:nth-child(n + 15) {
        display: none !important;
    }
}

body.perf-balanced {
    background-attachment: scroll !important;
    animation-duration: 24s !important;
}

body.perf-balanced #wfx-web-animation-layer {
    --wfx-particle-opacity: 0.58;
    --wfx-scene-opacity: 0.88;
}

body.perf-balanced #wfx-web-animation-layer .wfx-particle:nth-child(n + ${CONFIG.baseParticleLimit + 1}) {
    display: none !important;
}

body.perf-balanced #wfx-web-animation-layer .wfx-grid {
    opacity: 0.48 !important;
}

body.perf-assist #wfx-web-animation-layer {
    --wfx-particle-opacity: 0.28;
    --wfx-scene-opacity: 0.72;
}

body.perf-assist #wfx-web-animation-layer .wfx-grid,
body.perf-assist #wfx-web-animation-layer .wfx-aurora-c,
body.perf-assist #wfx-web-animation-layer .wfx-cursor-glow {
    display: none !important;
}

body.perf-assist #wfx-web-animation-layer .wfx-particle:nth-child(n + ${CONFIG.assistParticleLimit + 1}) {
    display: none !important;
}

body.perf-assist #wfx-web-animation-layer .wfx-aurora {
    filter: blur(32px) saturate(1.28) !important;
}

body.perf-assist .store-item-card {
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
}

body.perf-assist #leaderboardModal.modal-overlay,
body.perf-assist #rulesModal.modal-overlay,
body.perf-assist #treasureChestModal.modal-overlay,
body.perf-assist #royalBallModal {
    backdrop-filter: blur(7px) !important;
    -webkit-backdrop-filter: blur(7px) !important;
}

body.perf-page-hidden {
    animation-play-state: paused !important;
}

body.perf-page-hidden #wfx-web-animation-layer *,
body.perf-page-hidden #wfx-scroll-progress * {
    animation-play-state: paused !important;
}

#${SETTINGS_ROW_ID} .perf-setting-copy {
    min-width: 0;
}

#${SETTINGS_ROW_ID} .perf-setting-copy strong {
    color: #2c3e50;
}

#${SETTINGS_ROW_ID} .perf-setting-copy p {
    margin: 4px 0 0;
    color: #666;
    font-size: .85em;
    line-height: 1.4;
}

#${STATUS_ID} {
    display: inline-block;
    margin-top: 5px;
    color: #64748b;
    font-size: .78em;
    font-weight: 800;
}

body.perf-assist #${STATUS_ID} {
    color: #b45309;
}

@media (max-width: 768px), (pointer: coarse) {
    body.perf-balanced #wfx-web-animation-layer .wfx-grid {
        display: none !important;
    }

    body.perf-balanced #wfx-web-animation-layer .wfx-particle:nth-child(n + 11) {
        display: none !important;
    }

    body.perf-balanced #wfx-web-animation-layer {
        --wfx-particle-opacity: 0.30;
        --wfx-scene-opacity: 0.76;
    }
}


/* =========================================================
   TỐI ƯU DANH SÁCH BÀI TẬP — chỉ có hiệu lực khi bật optimizer.
   content-visibility cho phép trình duyệt bỏ qua layout/paint card ngoài viewport
   nhưng DOM và logic bài tập vẫn tồn tại đầy đủ.
   ========================================================= */
body.perf-balanced.wfx-role-student #assignmentsList > .card,
body.perf-balanced.wfx-role-student #gradesList > .card {
    content-visibility: auto;
    contain-intrinsic-size: auto 520px;
}

/* Nếu class role của WebAnimationSystem chưa có, fallback theo cấu trúc trang học sinh. */
body.perf-balanced:has(#studentName) #assignmentsList > .card,
body.perf-balanced:has(#studentName) #gradesList > .card {
    content-visibility: auto;
    contain-intrinsic-size: auto 520px;
}

/* Tránh trình duyệt dành tài nguyên quá sớm cho iframe ở xa viewport. */
body.perf-balanced .video-wrapper iframe[loading="lazy"] {
    content-visibility: auto;
}

/* Placeholder editor trước khi Quill được khởi tạo. */
body.perf-balanced .quill-student-editor[data-perf-quill-pending="1"] {
    min-height: 120px;
}

@media (prefers-reduced-motion: reduce) {
    body.perf-balanced {
        animation: none !important;
    }

    body.perf-balanced #wfx-web-animation-layer {
        display: none !important;
    }
}
`;
        (document.head || document.documentElement).appendChild(style);
    }

    function updateStatusText() {
        const el = document.getElementById(STATUS_ID);
        if (!el) return;

        if (!state.enabled) {
            el.textContent = 'Đang tắt • Tối ưu nền nhẹ vẫn hoạt động';
            return;
        }

        if (state.assist) {
            const fpsText = state.lastFps != null
                ? ` • ${state.lastFps.toFixed(0)} FPS`
                : '';
            el.textContent = `Đang bật • Hỗ trợ thêm${fpsText}`;
            return;
        }

        el.textContent = resolveRole() === 'student'
            ? 'Đang bật • Nền + bài tập + video'
            : 'Đang bật • Chế độ cân bằng';
    }

    function syncToggle() {
        const toggle = document.getElementById(TOGGLE_ID);
        if (toggle) toggle.checked = state.enabled;
        updateStatusText();
    }

    function injectSettingsToggle() {
        if (document.getElementById(SETTINGS_ROW_ID)) {
            syncToggle();
            return;
        }

        const settingsTab = document.getElementById('tab-settings');
        const container = settingsTab?.querySelector('.form-container');

        if (!container) return;

        const row = document.createElement('div');
        row.id = SETTINGS_ROW_ID;
        row.style.cssText = [
            'background:rgba(255,255,255,0.5)',
            'padding:15px',
            'border-radius:12px',
            'display:flex',
            'align-items:center',
            'justify-content:space-between',
            'gap:15px',
            'margin-bottom:20px',
            'border:1px solid rgba(0,0,0,0.05)'
        ].join(';');

        row.innerHTML = `
            <div class="perf-setting-copy">
                <strong>⚡ Tối ưu hiệu năng</strong>
                <p>
                    Giảm nền/blur và tối ưu bài tập nặng, video, trình soạn thảo khi cần.
                    Không thay đổi logic trò chơi, điểm, dữ liệu hay vật phẩm.
                </p>
                <span id="${STATUS_ID}">Đang tắt • Mặc định</span>
            </div>
            <label class="switch" title="Bật hoặc tắt tối ưu hiệu năng">
                <input type="checkbox" id="${TOGGLE_ID}">
                <span class="slider"></span>
            </label>
        `;

        container.insertBefore(row, container.firstChild);

        const toggle = row.querySelector(`#${TOGGLE_ID}`);
        toggle?.addEventListener('change', event => {
            setEnabled(Boolean(event.target.checked), true);
        });

        syncToggle();
    }

    function setHiddenState() {
        document.body?.classList.toggle(
            'perf-page-hidden',
            document.hidden
        );
    }

    function clearPerformanceWork() {
        if (state.sampleTimer) {
            clearTimeout(state.sampleTimer);
            state.sampleTimer = null;
        }

        state.observer?.disconnect();
        state.observer = null;
        state.sampleRunning = false;
    }

    function setAssist(enabled, reason = '') {
        if (!state.enabled || !document.body) return;

        state.assist = Boolean(enabled);
        state.assistReason = state.assist ? String(reason || 'manual') : '';
        document.body.classList.toggle('perf-assist', state.assist);
        updateStatusText();
    }

    function measureFps() {
        if (
            state.sampleRunning ||
            document.hidden ||
            !state.enabled ||
            typeof requestAnimationFrame !== 'function'
        ) {
            return Promise.resolve(null);
        }

        state.sampleRunning = true;

        return new Promise(resolve => {
            const startedAt = performance.now();
            let lastAt = startedAt;
            let frames = 0;
            let validElapsed = 0;

            function frame(now) {
                if (!state.enabled || document.hidden) {
                    state.sampleRunning = false;
                    resolve(null);
                    return;
                }

                const delta = now - lastAt;
                lastAt = now;

                if (delta > 0 && delta < 250) {
                    frames += 1;
                    validElapsed += delta;
                }

                if (now - startedAt < CONFIG.sampleDurationMs) {
                    requestAnimationFrame(frame);
                    return;
                }

                state.sampleRunning = false;

                const fps = validElapsed > 0
                    ? (frames * 1000) / validElapsed
                    : null;

                state.lastFps = fps;

                if (fps != null && fps < CONFIG.fpsThreshold) {
                    setAssist(true, 'fps-low');
                }

                updateStatusText();
                resolve(fps);
            }

            requestAnimationFrame(frame);
        });
    }

    function scheduleFpsSample() {
        if (!state.enabled) return;

        if (state.sampleTimer) clearTimeout(state.sampleTimer);

        state.sampleTimer = setTimeout(() => {
            state.sampleTimer = null;
            measureFps().catch(() => {});
        }, CONFIG.sampleDelayMs);
    }

    function initLongTaskObserver() {
        if (
            !state.enabled ||
            typeof PerformanceObserver !== 'function' ||
            !PerformanceObserver.supportedEntryTypes?.includes('longtask')
        ) {
            return;
        }

        let heavyTasks = 0;

        try {
            state.observer = new PerformanceObserver(list => {
                for (const entry of list.getEntries()) {
                    if (entry.duration >= 120) heavyTasks += 1;
                }

                if (heavyTasks >= 4 && !state.assist) {
                    setAssist(true, 'long-tasks');
                    state.observer?.disconnect();
                    state.observer = null;
                }
            });

            state.observer.observe({ entryTypes: ['longtask'] });

            setTimeout(() => {
                state.observer?.disconnect();
                state.observer = null;
            }, 10000);
        } catch (_) {
            state.observer = null;
        }
    }


    function ensureStudentVideoPreconnects() {
        if (!state.enabled || resolveRole() !== 'student') return;

        const targets = [
            'https://www.youtube.com',
            'https://i.ytimg.com'
        ];

        targets.forEach(href => {
            if (document.querySelector(`link[data-perf-preconnect="${href}"]`)) return;

            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = href;
            link.crossOrigin = 'anonymous';
            link.dataset.perfPreconnect = href;
            (document.head || document.documentElement).appendChild(link);
        });
    }

    function announceStateChange() {
        try {
            window.dispatchEvent(
                new CustomEvent(
                    'web-performance-optimizer-change',
                    {
                        detail: {
                            enabled: state.enabled,
                            role: resolveRole(),
                            assist: state.assist
                        }
                    }
                )
            );
        } catch (_) {}
    }

    function setEnabled(enabled, persist = false) {
        state.enabled = Boolean(enabled);

        if (persist) safeStoreEnabled(state.enabled);

        clearPerformanceWork();

        if (!document.body) {
            syncToggle();
            return;
        }

        document.body.classList.toggle('perf-balanced', state.enabled);

        if (!state.enabled) {
            state.assist = false;
            state.assistReason = '';
            state.lastFps = null;
            document.body.classList.remove('perf-assist');
            setHiddenState();
            syncToggle();
            announceStateChange();
            return;
        }

        if (detectWeakDevice()) {
            setAssist(true, 'weak-device');
        } else {
            state.assist = false;
            state.assistReason = '';
            document.body.classList.remove('perf-assist');
        }

        ensureStudentVideoPreconnects();
        setHiddenState();
        scheduleFpsSample();
        initLongTaskObserver();
        syncToggle();
        announceStateChange();
    }

    function init() {
        if (state.initialized) return;
        state.initialized = true;

        registerLoaderStep();
        injectStyles();

        const start = () => {
            if (!document.body) {
                requestAnimationFrame(start);
                return;
            }

            document.body.classList.add('perf-baseline');
            state.enabled = safeGetStoredEnabled();
            injectSettingsToggle();
            setEnabled(state.enabled, false);

            document.addEventListener(
                'visibilitychange',
                setHiddenState,
                { passive: true }
            );

            let hiddenAt = 0;

            document.addEventListener(
                'visibilitychange',
                () => {
                    if (document.hidden) {
                        hiddenAt = Date.now();
                        return;
                    }

                    if (
                        state.enabled &&
                        hiddenAt &&
                        Date.now() - hiddenAt > 30000 &&
                        !state.assist
                    ) {
                        scheduleFpsSample();
                    }
                },
                { passive: true }
            );

            finishLoaderStep();

            console.info(
                `[WebPerformanceOptimizer] v${VERSION} ready — ${
                    state.enabled ? 'ON' : 'OFF (default)'
                }`
            );
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }

    window.WebPerformanceOptimizer = Object.freeze({
        version: VERSION,
        isEnabled: () => state.enabled,
        enable: () => setEnabled(true, true),
        disable: () => setEnabled(false, true),
        toggle: enabled => setEnabled(Boolean(enabled), true),
        enableAssist: () => {
            if (!state.enabled) setEnabled(true, true);
            setAssist(true, 'manual');
        },
        disableAssist: () => setAssist(false),
        testFps: () => measureFps(),
        getState: () => ({
            initialized: state.initialized,
            enabled: state.enabled,
            assist: state.assist,
            assistReason: state.assistReason,
            lastFps: state.lastFps,
            weakDevice: detectWeakDevice(),
            role: resolveRole(),
            storageKey: getStorageKey()
        })
    });

    init();
})();
