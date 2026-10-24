const loginForm = document.getElementById('loginForm');
let lockoutInterval = null;


// Shared inbox lifetime; permanent messages and item lifetimes are independent.
window.getInboxMessageExpiry = function (message) {
    const expiry = Number(message?.expiry || 0);
    if (!Number.isFinite(expiry) || expiry <= 0) return 0;
    const sentAt = Number(message?.timestamp || 0);
    return Number.isFinite(sentAt) && sentAt > 0
        ? Math.min(expiry, sentAt + 3 * 86400000)
        : expiry;
};

// ======================================================
// IMAGE PROTECTION CORE v2 · GLOBAL + DESKTOP + MOBILE
// - Chạy ngay từ common.js trên cả Giáo viên / Học sinh / Đăng nhập.
// - Chặn menu lưu/copy ảnh, kéo ảnh, copy vùng có ảnh và Ctrl/Cmd+S.
// - Chặn native long-press callout trên iOS/Safari bằng CSS + inline style.
// - Ảnh render động sau này được bảo vệ bằng MutationObserver.
// - Không dùng pointer-events:none / không chặn touchstart để không phá pet/UI.
// - Giữ API StoreImageProtection cũ để Store/Luxury không cần sửa.
// ======================================================
(function installCoreSiteImageProtection() {
    'use strict';

    if (window.SiteImageProtection) {
        window.StoreImageProtection = window.SiteImageProtection;
        return;
    }

    window.__SITE_IMAGE_PROTECTION_BUILD =
        '20260920.v2-core-global-mobile-klein-compatible';

    let lastNoticeAt = 0;

    function getElement(target) {
        if (!target) return null;

        if (target.nodeType === Node.ELEMENT_NODE) {
            return target;
        }

        return target.parentElement || null;
    }

    function getImageElement(target) {
        const element = getElement(target);
        if (!element) return null;

        if (element.matches?.('img')) {
            return element;
        }

        return element.closest?.('img') || null;
    }

    function getEventImage(event) {
        if (!event) return null;

        try {
            const path = event.composedPath?.() || [];
            for (const node of path) {
                if (
                    node &&
                    node.nodeType === Node.ELEMENT_NODE &&
                    node.matches?.('img')
                ) {
                    return node;
                }
            }
        } catch (_) {}

        return getImageElement(event.target);
    }

    function isProtectedImage(target) {
        return Boolean(getImageElement(target));
    }

    function isKleinRightClickSkillImage(target) {
        const image = getImageElement(target);
        return Boolean(
            image &&
            image.id === 'virtual-pet-img' &&
            image.classList.contains('lotm-event-klein-chibi-magic')
        );
    }

    function selectionContainsProtectedImage() {
        const selection = window.getSelection?.();
        if (!selection || selection.rangeCount === 0) {
            return false;
        }

        for (let index = 0; index < selection.rangeCount; index++) {
            const range = selection.getRangeAt(index);
            const ancestor = getElement(range.commonAncestorContainer);
            if (!ancestor) continue;

            if (ancestor.matches?.('img')) {
                return true;
            }

            const scope = ancestor.querySelectorAll
                ? ancestor
                : document.body;

            if (!scope?.querySelectorAll) continue;

            for (const image of scope.querySelectorAll('img')) {
                try {
                    if (range.intersectsNode(image)) {
                        return true;
                    }
                } catch (_) {}
            }
        }

        return false;
    }

    function showProtectionNotice() {
        const now = Date.now();
        if (now - lastNoticeAt < 900) return;
        lastNoticeAt = now;

        const message =
            'Hình ảnh trên website được bảo vệ và không hỗ trợ sao chép/lưu trực tiếp.';

        if (typeof window.showToast === 'function') {
            window.showToast(message, 'warning');
        } else {
            console.info('[SiteImageProtection]', message);
        }
    }

    function blockEvent(event, shouldNotify = true) {
        if (!event) return false;

        event.preventDefault();
        event.stopPropagation();

        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }

        if (shouldNotify) {
            showProtectionNotice();
        }

        return false;
    }

    function protectImage(image) {
        if (!image || !image.matches?.('img')) return;

        image.setAttribute('draggable', 'false');
        image.setAttribute('data-site-image-protected', 'true');

        // Desktop / Chromium / Safari.
        image.style.webkitUserDrag = 'none';
        image.style.userSelect = 'none';
        image.style.webkitUserSelect = 'none';

        // iOS/iPadOS Safari: ẩn native menu khi nhấn giữ ảnh.
        image.style.webkitTouchCallout = 'none';
    }

    function protectSubtree(root = document.body || document.documentElement) {
        if (!root) return;

        if (root.matches?.('img')) {
            protectImage(root);
        }

        root.querySelectorAll?.('img').forEach(protectImage);
    }

    // API cũ vẫn tồn tại để student.js / store-manager.js / luxury-store.js gọi bình thường.
    function protectFloatingStoreItemImages() {
        document
            .querySelectorAll('#virtual-pet-container img, #virtual-pet-img')
            .forEach(protectImage);
    }

    function isStoreOpen() {
        const root = document.querySelector('#tab-store');
        if (!root) return false;

        if (root.classList.contains('active')) {
            return true;
        }

        const style = window.getComputedStyle(root);
        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            !root.hidden
        );
    }

    /*
     * Desktop + Android long-press:
     * chỉ chặn context menu khi mục tiêu là ảnh.
     * Riêng Klein: preventDefault để menu Save/Copy không hiện,
     * nhưng KHÔNG stopPropagation để handler kỹ năng chuột phải vẫn chạy.
     */
    document.addEventListener(
        'contextmenu',
        event => {
            const image = getEventImage(event);
            if (!image) return;

            if (isKleinRightClickSkillImage(image)) {
                event.preventDefault();
                return;
            }

            blockEvent(event);
        },
        true
    );

    // Không cho kéo ảnh ra Desktop, tab mới hoặc thanh địa chỉ.
    document.addEventListener(
        'dragstart',
        event => {
            if (getEventImage(event)) {
                blockEvent(event);
            }
        },
        true
    );

    // Chặn copy trực tiếp ảnh hoặc vùng chọn có chứa ảnh; text thuần vẫn copy bình thường.
    document.addEventListener(
        'copy',
        event => {
            const activeElement = document.activeElement;

            if (
                getEventImage(event) ||
                isProtectedImage(activeElement) ||
                selectionContainsProtectedImage()
            ) {
                blockEvent(event);
            }
        },
        true
    );

    // Chặn Save Page / Save As; Ctrl/Cmd+C chỉ chặn khi vùng chọn có ảnh.
    document.addEventListener(
        'keydown',
        event => {
            const modifier = event.ctrlKey || event.metaKey;
            if (!modifier) return;

            const key = String(event.key || '').toLowerCase();

            if (key === 's') {
                blockEvent(event);
                return;
            }

            if (
                key === 'c' &&
                (
                    isProtectedImage(document.activeElement) ||
                    selectionContainsProtectedImage()
                )
            ) {
                blockEvent(event);
            }
        },
        true
    );

    const startProtection = () => {
        protectSubtree(document.body || document.documentElement);
        protectFloatingStoreItemImages();
    };

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            startProtection,
            { once: true }
        );
    } else {
        startProtection();
    }

    // Ảnh thêm động sau Firebase/modal/store/pet/event cũng được khóa ngay.
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                protectSubtree(node);
            }
        }
    });

    const observeWholePage = () => {
        if (!document.body) return false;

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        startProtection();
        return true;
    };

    if (!observeWholePage()) {
        document.addEventListener(
            'DOMContentLoaded',
            observeWholePage,
            { once: true }
        );
    }

    const protectionAPI = Object.freeze({
        protectSubtree,
        protectFloatingStoreItemImages,
        isStoreOpen,
        isProtectedStoreImage: isProtectedImage,
        isProtectedImage,
        selectionContainsProtectedImage
    });

    window.SiteImageProtection = protectionAPI;
    window.StoreImageProtection = protectionAPI;
})();

// ======================================================
// APP STARTUP LOADER
// CHỜ DỮ LIỆU + VIDEO TRƯỚC KHI MỞ WEB
// ======================================================
(function initAppStartupLoader() {
    const overlay =
        document.getElementById(
            'appStartupLoader'
        );

    // index.html không có loader nên bỏ qua.
    if (
        !overlay ||
        window.AppStartupLoader
    ) {
        return;
    }

    const statusElement =
        document.getElementById(
            'appStartupLoaderStatus'
        );

    const expectedKeys = new Set();
    const readyKeys = new Set();

    const mediaState = new Map();

    let lastMediaMutationAt =
        Date.now();

    let isHidden = false;

    function setStatus(message) {
        if (!statusElement) return;

        statusElement.textContent =
            String(
                message ||
                'Đang tải hệ thống...'
            );
    }

    function attachStartupMedia(element) {
        if (!(element instanceof Element)) {
            return;
        }

        const candidates = [];

        if (
            element.matches?.(
                '[data-startup-video="1"]'
            )
        ) {
            candidates.push(element);
        }

        element
            .querySelectorAll?.(
                '[data-startup-video="1"]'
            )
            .forEach(node => {
                candidates.push(node);
            });

        candidates.forEach(media => {

            if (mediaState.has(media)) {
                return;
            }

            lastMediaMutationAt =
                Date.now();

            mediaState.set(
                media,
                'pending'
            );

            const markDone = () => {
                mediaState.set(
                    media,
                    'ready'
                );

                lastMediaMutationAt =
                    Date.now();
            };

            /*
             * Video HTML5 có thể đã tải
             * trước khi listener được gắn.
             */
            if (
                media.tagName === 'VIDEO' &&
                Number(media.readyState) >= 2
            ) {
                markDone();
                return;
            }

            media.addEventListener(
                'load',
                markDone,
                { once: true }
            );

            media.addEventListener(
                'loadeddata',
                markDone,
                { once: true }
            );

            media.addEventListener(
                'canplay',
                markDone,
                { once: true }
            );

            /*
             * Video lỗi cũng cho qua,
             * tránh khóa cả website.
             */
            media.addEventListener(
                'error',
                markDone,
                { once: true }
            );
        });
    }

    document
        .querySelectorAll(
            '[data-startup-video="1"]'
        )
        .forEach(attachStartupMedia);

    /*
     * Theo dõi video/iframe được render
     * sau khi Firebase trả dữ liệu.
     */
    const mediaObserver =
        new MutationObserver(
            mutations => {

                mutations.forEach(
                    mutation => {

                        mutation.addedNodes
                            .forEach(node => {

                                if (
                                    node.nodeType ===
                                    Node.ELEMENT_NODE
                                ) {
                                    attachStartupMedia(
                                        node
                                    );
                                }

                            });
                    }
                );
            }
        );

    mediaObserver.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true
        }
    );

    function expect(keys) {
        (
            Array.isArray(keys)
                ? keys
                : [keys]
        )
            .filter(Boolean)
            .forEach(key => {
                expectedKeys.add(
                    String(key)
                );
            });
    }

    function markReady(key) {
        if (!key) return;

        readyKeys.add(
            String(key)
        );
    }

    function areExpectedReady() {
        for (const key of expectedKeys) {
            if (!readyKeys.has(key)) {
                return false;
            }
        }

        return true;
    }

    function countPendingMedia() {
        let pending = 0;

        mediaState.forEach(state => {
            if (state === 'pending') {
                pending++;
            }
        });

        return pending;
    }

    async function waitUntil(
        check,
        timeoutMs,
        pollMs = 80
    ) {
        const startedAt =
            Date.now();

        while (
            Date.now() - startedAt <
            timeoutMs
        ) {
            if (check()) {
                return true;
            }

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        pollMs
                    )
            );
        }

        return check();
    }

    async function waitForExpected(
        options = {}
    ) {
        const timeoutMs =
            Math.max(
                1000,
                Number(
                    options.timeoutMs
                ) || 15000
            );

        setStatus(
            'Đang đồng bộ dữ liệu ban đầu...'
        );

        return waitUntil(
            () => areExpectedReady(),
            timeoutMs
        );
    }

    async function waitForMedia(
        options = {}
    ) {
        const timeoutMs =
            Math.max(
                1000,
                Number(
                    options.timeoutMs
                ) || 9000
            );

        const quietMs =
            Math.max(
                150,
                Number(
                    options.quietMs
                ) || 550
            );

        const startedAt =
            Date.now();

        setStatus(
            'Đang chuẩn bị video và liên kết học tập...'
        );

        while (
            Date.now() - startedAt <
            timeoutMs
        ) {
            const pending =
                countPendingMedia();

            const quietFor =
                Date.now() -
                lastMediaMutationAt;

            if (
                pending === 0 &&
                quietFor >= quietMs
            ) {
                return true;
            }

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        100
                    )
            );
        }

        /*
         * Không để YouTube/link ngoài
         * làm treo web.
         */
        return (
            countPendingMedia() === 0
        );
    }

    function hide() {
        if (isHidden) return;

        isHidden = true;

        if (
            window
                .__appStartupLoaderFailsafe
        ) {
            clearTimeout(
                window
                    .__appStartupLoaderFailsafe
            );

            window
                .__appStartupLoaderFailsafe =
                null;
        }

        setStatus('Hoàn tất!');

        overlay.setAttribute(
            'aria-busy',
            'false'
        );

        overlay.classList.add(
            'is-hidden'
        );

        setTimeout(() => {
            overlay.remove();

            mediaObserver.disconnect();
        }, 380);
    }

    window.AppStartupLoader =
        Object.freeze({
            expect,
            markReady,
            setStatus,
            waitForExpected,
            waitForMedia,
            hide
        });
})();

// ======================================================
// MÀN HÌNH 404 / OFFLINE
// ======================================================
(function initAppNetwork404() {
    if (window.AppNetwork404) return;

    const state = {
        visible: false,
        startupInterrupted: false,
        firebaseConnected: null,
        firebaseTimer: null
    };

    function isStartupPhase() {
        const loader =
            document.getElementById(
                'appStartupLoader'
            );

        return (
            document.readyState !== 'complete' ||
            Boolean(
                loader &&
                !loader.classList.contains(
                    'is-hidden'
                )
            )
        );
    }

    function ensurePage() {
        let page =
            document.getElementById(
                'appNetwork404Page'
            );

        if (page) return page;

        const style =
            document.createElement('style');

        style.id =
            'appNetwork404Styles';

        style.textContent = `
            html.app-network-404-open,
            body.app-network-404-open {
                overflow: hidden !important;
            }

            #appNetwork404Page[hidden] {
                display: none !important;
            }

            #appNetwork404Page {
                position: fixed;
                inset: 0;
                z-index: 2147483647;

                min-height: 100dvh;
                padding: 24px;
                box-sizing: border-box;

                display: flex;
                align-items: center;
                justify-content: center;

                overflow: auto;

                color: #fff;

                font-family:
                    Inter,
                    system-ui,
                    -apple-system,
                    "Segoe UI",
                    sans-serif;

                background:
                    radial-gradient(
                        circle at 20% 15%,
                        rgba(0,210,255,.18),
                        transparent 30%
                    ),
                    linear-gradient(
                        145deg,
                        #050b18,
                        #091a35 55%,
                        #061022
                    );
            }

            .network404-shell {
                width: min(1000px, 100%);

                display: grid;

                grid-template-columns:
                    1.1fr .9fr;

                gap: 55px;

                align-items: center;
            }

            .network404-scene {
                position: relative;

                min-height: 360px;

                overflow: hidden;

                border:
                    1px solid
                    rgba(130,220,255,.25);

                border-radius: 28px;

                background:
                    linear-gradient(
                        180deg,
                        #0b3564,
                        #061328
                    );

                box-shadow:
                    0 25px 70px
                    rgba(0,0,0,.35);
            }

            .network404-ghost {
                position: absolute;

                top: 55px;
                left: 55px;

                z-index: 3;

                font-size: 60px;

                animation:
                    network404Float
                    2.6s
                    ease-in-out
                    infinite;
            }

            .network404-beam {
                position: absolute;

                left: 92px;
                top: 126px;

                width: 440px;
                height: 190px;

                background:
                    linear-gradient(
                        90deg,
                        rgba(225,253,255,.9),
                        rgba(100,220,255,.35),
                        transparent
                    );

                clip-path:
                    polygon(
                        0 42%,
                        100% 0,
                        100% 100%,
                        0 58%
                    );

                opacity: .82;
            }

            .network404-code {
                position: absolute;

                z-index: 4;

                left: 50%;
                top: 53%;

                transform:
                    translate(-50%,-50%)
                    rotate(-5deg);

                font-size:
                    clamp(
                        7rem,
                        18vw,
                        12rem
                    );

                line-height: .8;

                font-weight: 1000;

                letter-spacing: -.08em;

                color: #39d9ff;

                text-shadow:
                    0 9px 0 #07527c,
                    0 20px 45px
                    rgba(0,210,255,.25);
            }

            .network404-copy h1 {
                margin: 0 0 14px;

                font-size:
                    clamp(
                        2rem,
                        5vw,
                        3.2rem
                    );
            }

            .network404-copy p {
                margin: 0;

                color: #aebdd3;

                line-height: 1.7;
            }

            .network404-kicker {
                color: #62e2ff;

                font-weight: 900;

                letter-spacing: .12em;

                margin-bottom: 14px;
            }

            .network404-status {
                margin-top: 20px;

                padding: 13px 15px;

                border-radius: 13px;

                border:
                    1px solid
                    rgba(255,255,255,.1);

                background:
                    rgba(255,255,255,.05);

                color: #e1ebf7;
            }

            .network404-actions {
                display: flex;

                gap: 10px;

                flex-wrap: wrap;

                margin-top: 22px;
            }

            .network404-actions button {
                min-height: 46px;

                padding: 0 18px;

                border-radius: 12px;

                border:
                    1px solid
                    rgba(255,255,255,.15);

                font: inherit;

                font-weight: 800;

                cursor: pointer;
            }

            #appNetwork404Retry {
                background:
                    linear-gradient(
                        135deg,
                        #68e8ff,
                        #42c7ff
                    );

                color: #03131d;
            }

            #appNetwork404Login {
                background:
                    rgba(255,255,255,.06);

                color: #fff;
            }

            @keyframes network404Float {
                0%,
                100% {
                    transform:
                        translateY(0)
                        rotate(-4deg);
                }

                50% {
                    transform:
                        translateY(-12px)
                        rotate(4deg);
                }
            }

            @media (max-width: 760px) {
                #appNetwork404Page {
                    padding: 16px;

                    align-items:
                        flex-start;
                }

                .network404-shell {
                    grid-template-columns:
                        1fr;

                    gap: 22px;

                    max-width: 540px;
                }

                .network404-scene {
                    min-height: 270px;
                }

                .network404-copy {
                    text-align: center;
                }

                .network404-actions {
                    justify-content:
                        center;
                }
            }

            @media (max-width: 430px) {
                .network404-scene {
                    min-height: 235px;
                }

                .network404-ghost {
                    top: 28px;
                    left: 22px;

                    font-size: 48px;
                }

                .network404-beam {
                    left: 58px;
                    top: 92px;
                }

                .network404-actions {
                    display: grid;
                }

                .network404-actions button {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(
            style
        );

        page =
            document.createElement(
                'div'
            );

        page.id =
            'appNetwork404Page';

        page.hidden = true;

        page.innerHTML = `
            <div class="network404-shell">

                <section
                    class="network404-scene"
                    aria-hidden="true"
                >
                    <div
                        class="network404-ghost"
                    >
                        👻
                    </div>

                    <div
                        class="network404-beam"
                    ></div>

                    <div
                        class="network404-code"
                    >
                        404
                    </div>
                </section>

                <section
                    class="network404-copy"
                >

                    <div
                        class="network404-kicker"
                    >
                        ● CONNECTION LOST
                    </div>

                    <h1
                        id="appNetwork404Title"
                    >
                        Có ai ở đó không?
                    </h1>

                    <p
                        id="appNetwork404Message"
                    >
                        Kết nối bị gián đoạn
                        nên hệ thống chưa thể
                        tải đủ dữ liệu.
                        Dữ liệu hiện tại của
                        bạn không bị xóa.
                    </p>

                    <div
                        class="network404-status"
                        id="appNetwork404Status"
                    >
                        Đang chờ kết nối
                        mạng trở lại...
                    </div>

                    <div
                        class="network404-actions"
                    >

                        <button
                            type="button"
                            id="appNetwork404Retry"
                        >
                            ↻ Thử lại
                        </button>

                        <button
                            type="button"
                            id="appNetwork404Login"
                        >
                            ⌂ Trang đăng nhập
                        </button>

                    </div>
                </section>

            </div>
        `;

        (
            document.body ||
            document.documentElement
        ).appendChild(page);

        document.getElementById(
            'appNetwork404Retry'
        ).onclick = retry;

        document.getElementById(
            'appNetwork404Login'
        ).onclick = function () {
            window.location.href =
                'index.html';
        };

        return page;
    }

    function show(options = {}) {
        const page =
            ensurePage();

        state.visible = true;

        const interrupted =
            typeof options.startup ===
                'boolean'
                ? options.startup
                : isStartupPhase();

        state.startupInterrupted =
            state.startupInterrupted ||
            interrupted;

        document.getElementById(
            'appNetwork404Title'
        ).textContent =
            options.title ||
            '404 — Mất kết nối';

        document.getElementById(
            'appNetwork404Message'
        ).textContent =
            options.message ||
            'Kết nối mạng hoặc máy chủ đám mây bị gián đoạn.';

        document.getElementById(
            'appNetwork404Status'
        ).textContent =
            options.status ||
            (
                navigator.onLine === false
                    ? 'Thiết bị đang ngoại tuyến. Hãy kiểm tra Wi-Fi hoặc 4G/5G.'
                    : 'Đang chờ máy chủ dữ liệu phản hồi...'
            );

        page.hidden = false;

        document.documentElement
            .classList.add(
                'app-network-404-open'
            );

        document.body?.classList.add(
            'app-network-404-open'
        );

        /*
         * Khi 404 xuất hiện thì
         * ngừng timer tự tắt loader.
         */
        if (
            window
                .__appStartupLoaderFailsafe
        ) {
            clearTimeout(
                window
                    .__appStartupLoaderFailsafe
            );

            window
                .__appStartupLoaderFailsafe =
                null;
        }

        if (
            window.AppStartupLoader
        ) {
            window.AppStartupLoader
                .setStatus(
                    'Kết nối bị gián đoạn...'
                );
        }
    }

    function hide() {
        const page =
            document.getElementById(
                'appNetwork404Page'
            );

        if (page) {
            page.hidden = true;
        }

        state.visible = false;

        state.startupInterrupted =
            false;

        document.documentElement
            .classList.remove(
                'app-network-404-open'
            );

        document.body?.classList.remove(
            'app-network-404-open'
        );
    }

    function retry() {
        if (
            navigator.onLine === false
        ) {
            show({
                status:
                    'Vẫn chưa có mạng. Hãy kiểm tra Wi-Fi hoặc 4G/5G rồi thử lại.'
            });

            return;
        }

        document.getElementById(
            'appNetwork404Status'
        ).textContent =
            'Đã phát hiện mạng. Đang tải lại hệ thống...';

        setTimeout(
            function () {
                window.location.reload();
            },
            450
        );
    }

    function isNetworkError(error) {
        if (!error) {
            return false;
        }

        const code =
            String(
                error.code || ''
            ).toLowerCase();

        const message =
            String(
                error.message ||
                error ||
                ''
            ).toLowerCase();

        const tokens = [
            'network-request-failed',
            'network error',
            'failed to fetch',
            'client is offline',
            'disconnected',
            'connection lost',
            'offline',
            'err_internet_disconnected',
            'unavailable',
            'timeout',
            'timed out'
        ];

        return tokens.some(
            token =>
                code.includes(token) ||
                message.includes(token)
        );
    }

    function report(
        error,
        context = 'network'
    ) {
        if (
            !isNetworkError(error)
        ) {
            return false;
        }

        const isLogin =
            context === 'login';

        show({
            startup:
                isLogin
                    ? false
                    : isStartupPhase(),

            title:
                isLogin
                    ? 'Đăng nhập bị gián đoạn'
                    : 'Không thể tải đủ dữ liệu',

            message:
                isLogin
                    ? 'Kết nối bị mất trong lúc xác thực tài khoản. Hệ thống không tính đây là một lần nhập sai mật khẩu.'
                    : 'Kết nối bị gián đoạn trong lúc trang đang tải. Hãy kết nối lại rồi thử lại.'
        });

        return true;
    }

    function recovered() {
        if (!state.visible) {
            return;
        }

        const status =
            document.getElementById(
                'appNetwork404Status'
            );

        if (status) {
            status.textContent =
                'Kết nối đã trở lại.';
        }

        /*
         * Nếu bị mất mạng khi đang
         * tải trang thì reload để tải
         * lại đầy đủ dữ liệu Firebase.
         */
        if (
            state.startupInterrupted
        ) {
            setTimeout(
                function () {
                    window.location.reload();
                },
                800
            );

            return;
        }

        /*
         * Nếu đang dùng bình thường
         * rồi mất mạng, mạng trở lại
         * thì chỉ đóng màn hình 404.
         */
        setTimeout(
            hide,
            600
        );
    }

    window.AppNetwork404 =
        Object.freeze({
            show,
            hide,
            retry,
            report,
            isNetworkError
        });

    /*
     * Mất Wi-Fi / 4G / 5G.
     */
    window.addEventListener(
        'offline',
        function () {
            show({
                startup:
                    isStartupPhase(),

                title:
                    '404 — Mất kết nối',

                message:
                    'Thiết bị vừa mất Internet nên thao tác hiện tại chưa thể hoàn tất.'
            });
        }
    );

    /*
     * Internet trở lại.
     */
    window.addEventListener(
        'online',
        function () {

            /*
             * Có Internet nhưng Firebase
             * chưa kết nối thì vẫn chờ.
             */
            if (
                state.firebaseConnected ===
                false
            ) {
                return;
            }

            recovered();
        }
    );

    /*
     * Bắt promise Firebase/fetch bị lỗi
     * khi window.onload đang chạy.
     */
    window.addEventListener(
        'unhandledrejection',
        function (event) {
            report(
                event.reason,
                isStartupPhase()
                    ? 'startup'
                    : 'network'
            );
        }
    );

    /*
     * JS/CSS quan trọng không tải được
     * trong lúc trang đang mở.
     */
    window.addEventListener(
        'error',
        function (event) {

            const target =
                event.target;

            if (
                !target ||
                target === window ||
                document.readyState ===
                'complete'
            ) {
                return;
            }

            const tag =
                String(
                    target.tagName || ''
                ).toUpperCase();

            if (
                tag === 'SCRIPT' ||
                tag === 'LINK'
            ) {
                show({
                    startup: true,

                    title:
                        'Tải trang bị gián đoạn',

                    message:
                        'Một tài nguyên cần thiết của trang chưa tải xong. Hãy kiểm tra kết nối rồi thử lại.'
                });
            }
        },
        true
    );

    /*
     * Kiểm tra kết nối THẬT
     * với Firebase.
     */
    try {
        if (
            window.db &&
            typeof window.db.ref ===
            'function'
        ) {
            window.db
                .ref('.info/connected')
                .on(
                    'value',
                    function (snapshot) {

                        state.firebaseConnected =
                            snapshot.val() ===
                            true;

                        clearTimeout(
                            state.firebaseTimer
                        );

                        if (
                            state.firebaseConnected
                        ) {
                            recovered();
                            return;
                        }

                        /*
                         * Firebase false thoáng qua
                         * khi mới vào web là bình thường.
                         * Đợi 8 giây mới hiện 404.
                         */
                        state.firebaseTimer =
                            setTimeout(
                                function () {

                                    if (
                                        state
                                            .firebaseConnected !==
                                        false
                                    ) {
                                        return;
                                    }

                                    show({
                                        startup:
                                            isStartupPhase(),

                                        title:
                                            navigator
                                                .onLine ===
                                                false
                                                ? '404 — Mất kết nối'
                                                : '404 — Không thể kết nối máy chủ',

                                        message:
                                            navigator
                                                .onLine ===
                                                false
                                                ? 'Thiết bị đang ngoại tuyến nên đám mây chưa thể đồng bộ dữ liệu.'
                                                : 'Internet vẫn có tín hiệu nhưng máy chủ dữ liệu chưa phản hồi.',

                                        status:
                                            navigator
                                                .onLine ===
                                                false
                                                ? 'Hãy kiểm tra Wi-Fi hoặc 4G/5G.'
                                                : 'Đang thử kết nối lại đám mây...'
                                    });

                                },
                                8000
                            );
                    }
                );
        }
    } catch (error) {
        console.warn(
            'Không thể theo dõi đám mây:',
            error
        );
    }

    /*
     * Vừa mở web đã mất mạng.
     */
    if (
        navigator.onLine === false
    ) {
        setTimeout(
            function () {
                show({
                    startup:
                        isStartupPhase()
                });
            },
            0
        );
    }

    /*
     * Đăng ký trang offline.
     */
    if (
        'serviceWorker' in navigator &&
        (
            location.protocol ===
            'https:' ||
            location.hostname ===
            'localhost' ||
            location.hostname ===
            '127.0.0.1'
        )
    ) {
        window.addEventListener(
            'load',
            function () {

                navigator
                    .serviceWorker
                    .register(
                        './sw.js',
                        {
                            scope: './'
                        }
                    )
                    .catch(
                        function (error) {
                            console.warn(
                                'Không thể đăng ký Service Worker:',
                                error
                            );
                        }
                    );
            }
        );
    }

})();

// ======================================================
// KHUNG MEDIA ĐĂNG NHẬP: TỰ NHẬN ẢNH HOẶC VIDEO
// ======================================================
(function initLoginSceneMedia() {
    const panel = document.getElementById('loginScenePanel');

    // common.js dùng cho nhiều trang.
    // Chỉ chạy đoạn này khi đang ở màn hình đăng nhập.
    if (!panel) return;

    const imagePattern =
        /\.(avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

    const videoPattern =
        /\.(m4v|mov|mp4|og[gv]|webm)(?:[?#].*)?$/i;

    function detectMediaType(source, requestedType) {
        const normalizedType =
            String(requestedType || 'auto').toLowerCase();

        // Cho phép ép kiểu thủ công nếu cần.
        if (
            normalizedType === 'image' ||
            normalizedType === 'video'
        ) {
            return normalizedType;
        }

        // Tự nhận loại tệp theo phần mở rộng.
        if (videoPattern.test(source)) {
            return 'video';
        }

        if (imagePattern.test(source)) {
            return 'image';
        }

        // URL không có đuôi tệp thì mặc định dùng ảnh.
        return 'image';
    }

    function createImage(source, objectPosition) {
        const image = document.createElement('img');

        image.id = 'loginBackgroundImage';
        image.className = 'scene-video scene-media';
        image.src = source;
        image.alt = '';
        image.loading = 'eager';
        image.decoding = 'async';
        image.draggable = false;
        image.style.objectPosition = objectPosition;

        return image;
    }

    function createVideo(
        source,
        objectPosition,
        fallbackImage
    ) {
        const video = document.createElement('video');

        video.id = 'loginBackgroundVideo';
        video.className = 'scene-video scene-media';

        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'auto';

        video.src = source;
        video.style.objectPosition = objectPosition;

        video.setAttribute('aria-hidden', 'true');

        // Nếu video tải lỗi thì chuyển sang ảnh dự phòng.
        if (fallbackImage) {
            video.addEventListener(
                'error',
                function () {
                    renderLoginScene(
                        fallbackImage,
                        'image'
                    );
                },
                { once: true }
            );
        }

        video.addEventListener(
            'canplay',
            function () {
                const playPromise = video.play();

                if (
                    playPromise &&
                    typeof playPromise.catch === 'function'
                ) {
                    playPromise.catch(function () {
                        // Trình duyệt có thể chặn tự phát video.
                        // Không ảnh hưởng đến form đăng nhập.
                    });
                }
            },
            { once: true }
        );

        return video;
    }

    function renderLoginScene(
        source,
        requestedType
    ) {
        const cleanSource =
            String(source || '').trim();

        // Không có đường dẫn thì để trống phần bên trái.
        if (!cleanSource) {
            panel.replaceChildren();
            return false;
        }

        const objectPosition =
            String(
                panel.dataset.objectPosition || 'center'
            ).trim() || 'center';

        const fallbackImage =
            String(
                panel.dataset.fallbackImage || ''
            ).trim();

        const mediaType = detectMediaType(
            cleanSource,
            requestedType
        );

        const mediaElement =
            mediaType === 'video'
                ? createVideo(
                    cleanSource,
                    objectPosition,
                    fallbackImage
                )
                : createImage(
                    cleanSource,
                    objectPosition
                );

        // Chỉ thay nội dung trong khung bên trái.
        panel.replaceChildren(mediaElement);

        panel.dataset.mediaSrc = cleanSource;
        panel.dataset.mediaType = mediaType;

        return true;
    }

    // Hàm thay ảnh/video trong lúc trang đang chạy.
    window.setLoginSceneMedia = function (
        source,
        type
    ) {
        return renderLoginScene(
            source,
            type || 'auto'
        );
    };

    // Hiển thị media được khai báo trong index.html.
    renderLoginScene(
        panel.dataset.mediaSrc,
        panel.dataset.mediaType || 'auto'
    );
})();

// ======================================================
// ÁP DỤNG BỐ CỤC TRANG ĐĂNG NHẬP
// Chỉ chạy khi tồn tại #loginScenePanel.
// ======================================================
(function initLoginPageLayout() {
    const loginScenePanel =
        document.getElementById('loginScenePanel');

    // common.js còn dùng ở trang giáo viên và học sinh.
    // Không có panel thì không chạy phần này.
    if (!loginScenePanel) return;

    const STORAGE_KEY = 'loginPageLayout';

    const FIREBASE_PATH =
        'system_settings/loginPageLayout';

    function normalizeLayout(value) {
        const normalized =
            String(value || '')
                .trim()
                .toLowerCase();

        const allowedLayouts = new Set([
            'split',
            'centered',
            'reversed',
            'cinematic'
        ]);

        return allowedLayouts.has(normalized)
            ? normalized
            : 'split';
    }

    function applyLayout(value, saveToStorage = true) {
        const layout = normalizeLayout(value);

        document.body.classList.remove(
            'login-layout-split',
            'login-layout-centered',
            'login-layout-reversed',
            'login-layout-cinematic'
        );

        document.body.classList.add(
            'login-layout-' + layout
        );

        document.body.dataset.loginLayout =
            layout;

        if (saveToStorage) {
            try {
                window.TestBrowserStorage.localStorage.setItem(
                    STORAGE_KEY,
                    layout
                );
            } catch (error) {
                // Không để lỗi lưu bộ nhớ ảnh hưởng đăng nhập.
            }
        }

        return layout;
    }

    // Cho phép gọi thủ công khi cần.
    window.applyLoginPageLayout = applyLayout;

    // Áp dụng bản lưu trước để tránh giao diện nháy.
    let cachedLayout = 'split';

    try {
        cachedLayout =
            window.TestBrowserStorage.localStorage.getItem(STORAGE_KEY) ||
            'split';
    } catch (error) {
        cachedLayout = 'split';
    }

    applyLayout(cachedLayout, false);

    // Tải cấu hình chung từ Firebase.
    try {
        if (
            typeof db !== 'undefined' &&
            db &&
            typeof db.ref === 'function'
        ) {
            const layoutRef =
                db.ref(FIREBASE_PATH);

            const handleLayoutValue =
                function (snapshot) {
                    applyLayout(
                        snapshot.val() || 'split'
                    );
                };

            const handleLayoutError =
                function (error) {
                    console.warn(
                        'Không thể tải bố cục đăng nhập:',
                        error && error.code
                            ? error.code
                            : error
                    );
                };

            layoutRef.on(
                'value',
                handleLayoutValue,
                handleLayoutError
            );

            // Gỡ listener khi rời trang.
            window.addEventListener(
                'beforeunload',
                function () {
                    layoutRef.off(
                        'value',
                        handleLayoutValue
                    );
                },
                { once: true }
            );
        }
    } catch (error) {
        console.warn(
            'Không thể khởi tạo bố cục đăng nhập:',
            error
        );
    }
})();

// ======================================================
// HÀM CHỐNG CHÈN HTML / XSS DÙNG CHUNG
// ======================================================

window.escapeHTML = function (value) {
    return String(
        value === null || value === undefined
            ? ''
            : value
    )
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

window.sanitizeRichHTML = function (value) {
    const raw = String(
        value === null || value === undefined
            ? ''
            : value
    );

    const source =
        /<\/?[a-z][\s\S]*>/i.test(raw)
            ? raw
            : window
                .escapeHTML(raw)
                .replace(/\n/g, '<br>');

    if (
        !window.DOMPurify ||
        typeof window.DOMPurify.sanitize !==
        'function'
    ) {
        console.error(
            'DOMPurify chưa được nạp trước common.js.'
        );

        return window
            .escapeHTML(raw)
            .replace(/\n/g, '<br>');
    }

    return window.DOMPurify.sanitize(
        source,
        {
            USE_PROFILES: {
                html: true
            },

            FORBID_TAGS: [
                'script',
                'iframe',
                'object',
                'embed',
                'form'
            ],

            FORBID_ATTR: [
                'srcdoc'
            ]
        }
    );
};

// ==========================================
// HỆ THỐNG BẢO MẬT: DẤU VÂN TAY THIẾT BỊ
// ==========================================
// Hàm này tạo ra một ID cố định dựa trên phần cứng và trình duyệt của thiết bị
function getDeviceID() {
    const deviceInfo = navigator.userAgent + screen.width + screen.height + navigator.language;
    let hash = 0;
    for (let i = 0; i < deviceInfo.length; i++) {
        hash = ((hash << 5) - hash) + deviceInfo.charCodeAt(i);
        hash |= 0;
    }
    return 'dev_' + Math.abs(hash);
}

const DEVICE_ID = getDeviceID();

// Vẫn giữ LocalStorage/Cookie làm lớp phòng thủ đầu tiên cho nhẹ Server
function getLockoutData(key) {
    let val = window.TestBrowserStorage.localStorage.getItem(key);
    if (!val) {
        const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
        if (match) val = match[2];
    }
    return val;
}

function setLockoutData(key, value, expireSeconds) {
    window.TestBrowserStorage.localStorage.setItem(key, value);
    if (expireSeconds > 0) {
        document.cookie = `${key}=${value}; max-age=${expireSeconds}; path=/`;
    } else {
        document.cookie = `${key}=; max-age=0; path=/`;
    }
}

async function clearAllLockouts() {
    window.TestBrowserStorage.localStorage.removeItem('_sys_df');
    window.TestBrowserStorage.localStorage.removeItem('_sys_dl');

    document.cookie =
        '_sys_df=; max-age=0; path=/';

    document.cookie =
        '_sys_dl=; max-age=0; path=/';
}

if (loginForm) {
    if (new URLSearchParams(window.location.search).get('reason') === 'update_required') {
        const notice = document.getElementById('errorMsg');
        if (notice) notice.textContent = 'Website đã cập nhật cơ chế bảo vệ. Nhấn Ctrl+F5 rồi đăng nhập lại bằng tài khoản, mật khẩu và mã đã lưu.';
    }
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (loginForm.dataset.submitting === 'true') return;
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorMsg = document.getElementById('errorMsg');

        if (!usernameInput || !passwordInput || !errorMsg) {
            console.error('Không tìm thấy thành phần của form đăng nhập.');
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"], input[type="submit"]');
        let finishLoginActivity = null;
        loginForm.dataset.submitting = 'true';
        if (submitBtn) submitBtn.disabled = true;

        try {
            const userVal = usernameInput.value.trim();
            const passVal = passwordInput.value;

        // Dùng \s để chặn cả dấu cách, tab và xuống dòng.
        if (/\s/.test(userVal)) {
            errorMsg.textContent =
                '❌ Tên đăng nhập không được chứa khoảng trắng!';
            errorMsg.style.color = 'red';
            return;
        }

        if (!userVal || !passVal) {
            errorMsg.textContent =
                '❌ Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!';
            errorMsg.style.color = 'red';
            return;
        }

        if (lockoutInterval) {
            clearInterval(lockoutInterval);
            lockoutInterval = null;
        }

        errorMsg.innerHTML = '⏳ Đang kiểm tra an ninh thiết bị...';
        errorMsg.style.color = 'blue';

        const now = Date.now();

        const localLockoutTime = Number(
            getLockoutData('_sys_dl') || 0
        );

        if (localLockoutTime > now) {
            startLockoutCountdown(
                localLockoutTime,
                errorMsg
            );
            return;
        }

        errorMsg.innerHTML = 'Đang xác thực...';
        const fakeEmail = userVal + "@hethong.edu.vn";
        finishLoginActivity = window.ServerActivity?.begin('Đang xác minh đăng nhập…');

        try {
            if (document.querySelector('meta[name="asset-compat-version"]') && !window.AssetCompatibility) throw Error('Bộ kiểm tra phiên bản chưa tải được. Hãy cập nhật đủ tệp website.');
            await window.AssetCompatibility?.require('login');
            const userCredential = await firebase.auth().signInWithEmailAndPassword(fakeEmail, passVal);
            const uid = userCredential.user.uid;

            const snapshot = await db.ref('users/' + uid).once('value');
            const user = snapshot.val();

            if (!user) {
                errorMsg.innerHTML = '❌ Tài khoản không tồn tại dữ liệu trên máy chủ!';
                errorMsg.style.color = 'red';
                return;
            }

            if (user.isLocked) {
                errorMsg.innerHTML = '🔒 LỖI: Tài khoản đã bị khóa.<br>Vui lòng liên hệ Giáo viên để giải quyết!';
                errorMsg.style.color = 'red';
                await firebase.auth().signOut();
                return;
            }

            // Đăng nhập thành công -> Gỡ bỏ hoàn toàn mọi án phạt
            await clearAllLockouts();

            if(user.role==='student' && !(await window.StudentAccountAccess.login(userCredential.user,user)))return;

            user._fbKey = uid;
            window.TestBrowserStorage.localStorage.setItem('currentUser', JSON.stringify(Object.fromEntries(Object.entries(user).filter(([key]) => !['password', 'newPass', 'oldPass'].includes(key)))));

            if (user.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else {
                window.location.href = 'student.html';
            }

        } catch (error) {
            let errorCode =
                error && error.code
                    ? String(error.code)
                    : 'auth/unknown-error';

            const rawAuthErrorMessage =
                error && error.message
                    ? String(error.message)
                    : '';

            // Firebase SDK v8 cũ không nhận diện mã mới này.
            if (
                errorCode === 'auth/internal-error' &&
                rawAuthErrorMessage.includes(
                    'INVALID_LOGIN_CREDENTIALS'
                )
            ) {
                errorCode = 'auth/invalid-credential';
            }

            console.error(
                'xác thực đám mây đăng nhập thất bại:',
                {
                    code: errorCode,
                    originalCode: error?.code,
                    message: rawAuthErrorMessage,
                    email: fakeEmail
                }
            );

            // Nếu lỗi là do mất mạng,
            // mở màn hình 404.
            //
            // Quan trọng:
            // KHÔNG tính đây là một lần
            // nhập sai mật khẩu.
            if (
                window.AppNetwork404 &&
                window.AppNetwork404.report(
                    error,
                    'login'
                )
            ) {
                errorMsg.textContent =
                    '⚠️ Kết nối bị gián đoạn. Hãy kiểm tra mạng rồi thử lại.';

                errorMsg.style.color =
                    '#d97706';

                return;
            }

            // Phần code xử lý lỗi phía dưới giữ nguyên.

            const messages = {
                'auth/invalid-credential':
                    'Tên đăng nhập hoặc mật khẩu không chính xác.',

                'auth/invalid-login-credentials':
                    'Tên đăng nhập hoặc mật khẩu không chính xác.',

                'auth/user-not-found':
                    'Tài khoản chưa tồn tại trong xác thực đám mây.',

                'auth/wrong-password':
                    'Mật khẩu không chính xác.',

                'auth/invalid-email':
                    'Tên đăng nhập tạo ra email không hợp lệ.',

                'auth/user-disabled':
                    'Tài khoản đã bị vô hiệu hóa.',

                'auth/operation-not-allowed':
                    'đám mây chưa bật đăng nhập Email/Password.',

                'auth/network-request-failed':
                    'Không thể kết nối xác thực đám mây.',

                'auth/too-many-requests':
                    'đám mây tạm chặn vì đăng nhập sai quá nhiều lần.',

                'auth/invalid-api-key':
                    'đám mây API key không hợp lệ hoặc sai dự án.',

                'auth/app-not-authorized':
                    'Tên miền hiện tại chưa được đám mây cho phép.'
            };

            const displayMessage =
                messages[errorCode] ||
                window.StudentAccountAccess?.message(error) ||
                `Đăng nhập thất bại: ${errorCode}`;

            const credentialErrors = new Set([
                'auth/invalid-credential',
                'auth/invalid-login-credentials',
                'auth/user-not-found',
                'auth/wrong-password'
            ]);

            const forceLock =
                errorCode === 'auth/too-many-requests';

            // Không tính lỗi mạng/cấu hình là nhập sai mật khẩu.
            if (
                !credentialErrors.has(errorCode) &&
                !forceLock
            ) {
                errorMsg.textContent =
                    `❌ ${displayMessage}`;

                errorMsg.style.color = 'red';
                return;
            }

            const currentFails =
                Number(getLockoutData('_sys_df') || 0) + 1;

            if (currentFails >= 5 || forceLock) {
                const lockTime =
                    Date.now() + 15 * 60 * 1000;

                setLockoutData(
                    '_sys_dl',
                    lockTime,
                    15 * 60
                );

                setLockoutData(
                    '_sys_df',
                    '0',
                    0
                );

                startLockoutCountdown(
                    lockTime,
                    errorMsg
                );

                return;
            }

            setLockoutData(
                '_sys_df',
                currentFails,
                24 * 60 * 60
            );

            errorMsg.innerHTML =
                `❌ ${displayMessage}<br>` +
                `Thiết bị này còn ` +
                `<b>${5 - currentFails}</b> lần thử.`;

            errorMsg.style.color = 'red';
        }
        } finally {
            finishLoginActivity?.();
            loginForm.dataset.submitting = 'false';
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// ==========================================
// HÀM HỖ TRỢ: CHẠY ĐỒNG HỒ ĐẾM NGƯỢC (ĐÃ SỬA LỖI TRÙNG LẶP)
// ==========================================
function startLockoutCountdown(lockoutUntil, errorElement) {
    if (lockoutInterval) clearInterval(lockoutInterval);

    function update() {
        const remain = lockoutUntil - Date.now();
        if (remain <= 0) {
            clearInterval(lockoutInterval);
            lockoutInterval = null;

            errorElement.innerHTML =
                '✅ Hết thời gian phạt! Bạn có thể thử đăng nhập lại.';
            errorElement.style.color = 'green';

            clearAllLockouts().catch(console.error);
            return;
        }

        const minutes = Math.floor(remain / 60000);
        const seconds = Math.floor((remain % 60000) / 1000);
        errorElement.innerHTML = `⏳ Cảnh báo An ninh: Thiết bị nhập sai quá nhiều lần.<br>Khóa đăng nhập trên thiết bị trong: <b style="color:red;">${minutes} phút ${seconds} giây</b>`;
        errorElement.style.color = '#e67e22';
    }

    // Chạy ngay lập tức hàm update() để không bị delay 1 giây ban đầu
    update();
    lockoutInterval = setInterval(update, 1000);
}

// ==============================================================
// QUẢN LÝ FIREBASE REALTIME LISTENERS - CHỐNG MEMORY LEAK
// ==============================================================

window.firebaseListenerRegistry = window.firebaseListenerRegistry || [];

window.listenFirebase = function (queryOrRef, eventType, callback, cancelCallbackOrContext, context) {
    if (!queryOrRef || typeof queryOrRef.on !== 'function') {
        console.warn('⚠️ listenFirebase nhận ref/query không hợp lệ:', queryOrRef);
        return callback;
    }

    queryOrRef.on(eventType, callback, cancelCallbackOrContext, context);

    window.firebaseListenerRegistry.push({
        ref: queryOrRef,
        eventType,
        callback,
        context
    });

    return callback;
};

window.cleanupFirebaseListeners = function () {
    const list = window.firebaseListenerRegistry || [];

    list.forEach(item => {
        try {
            item.ref.off(item.eventType, item.callback, item.context);
        } catch (err) {
            console.warn('⚠️ Không thể gỡ đám mây listener:', err);
        }
    });

    window.firebaseListenerRegistry = [];
    console.log('✅ Đã gỡ toàn bộ đám mây listeners:', list.length);
};

// Khi rời trang / F5 / đóng tab cũng tự gỡ listener
window.addEventListener('beforeunload', function () {
    if (typeof window.cleanupFirebaseListeners === 'function') {
        window.cleanupFirebaseListeners();
    }
});

window.logout = async function () {
    const accepted = await (AppDialog.confirmLogout?.() ?? AppDialog.confirm('Bạn có chắc chắn muốn đăng xuất?'));

    if (!accepted) return;
    if (/student\.html$/.test(window.location.pathname)) {
        try { await window.StudentAccountAccess?.releaseSession(); }
        catch (_) {
            await AppDialog.alert('Chưa báo đăng xuất được với máy chủ. Bạn vẫn sẽ đăng xuất trên thiết bị này; phiên trên máy chủ sẽ kết thúc khi hết hạn. Các giao dịch đang chờ được giữ lại để kiểm tra sau.');
        }
    }

    try {
        // Gỡ các listener Realtime Database.
        if (
            typeof window.cleanupFirebaseListeners ===
            'function'
        ) {
            window.cleanupFirebaseListeners();
        }

        // Đăng xuất Firebase Authentication.
        if (
            typeof firebase !== 'undefined' &&
            typeof firebase.auth === 'function'
        ) {
            await firebase.auth().signOut();
        }
    } catch (error) {
        console.error(
            'Không thể đăng xuất xác thực đám mây:',
            error
        );
    } finally {
        // Không xóa toàn bộ window.TestBrowserStorage.localStorage vì còn giao diện,
        // cài đặt và dữ liệu không liên quan đến đăng nhập.
        window.TestBrowserStorage.localStorage.removeItem('currentUser');

        // replace để người dùng không bấm Back quay lại trang cũ.
        window.location.replace('index.html');
    }
};

// ==============================================================
// HÀM XỬ LÝ ĐÓNG / MỞ CARD (ACCORDION)
// ==============================================================
window.toggleAccordion = function (contentId, headerElement) {
    const content = document.getElementById(contentId);
    if (content) {
        content.classList.toggle('active');
        headerElement.classList.toggle('active');
    }
};

// ==============================================================
// TƯƠNG THÍCH HỆ THỐNG CẬP NHẬT
// - Update Manager là nguồn cập nhật DUY NHẤT.
// - common.js KHÔNG tự fetch version.json, KHÔNG tự xóa cache, KHÔNG tự reload.
// - Hai hàm dưới đây chỉ là proxy tạm thời cho code/nút cũ.
// - update-manager.js sẽ ghi đè chúng bằng API chính thức ngay sau khi được nạp.
// ==============================================================
window.checkForUpdates = function () {
    const manager = window.SystemUpdateManager;

    if (manager && typeof manager.check === 'function') {
        return manager.check({ manual: true });
    }

    console.warn(
        '[SystemUpdate] Update Manager chưa sẵn sàng; bỏ qua yêu cầu kiểm tra tạm thời.'
    );

    return Promise.resolve(null);
};

window.applySystemUpdate = function () {
    const manager = window.SystemUpdateManager;

    if (manager && typeof manager.apply === 'function') {
        return manager.apply();
    }

    console.warn(
        '[SystemUpdate] Update Manager chưa sẵn sàng; không tự xóa cache hoặc reload từ common.js.'
    );

    return Promise.resolve(false);
};

// ==============================================================
// HỆ THỐNG THAY ĐỔI GIAO DIỆN (ĐỘC LẬP TỪNG TÀI KHOẢN)
// ==============================================================
window.changeTheme = function (themeName, saveToStorage = true) {
    if (!['default', 'blue', 'green', 'pink'].includes(themeName)) themeName = 'default';
    document.documentElement.dataset.uiTheme = themeName;
    // 1. Xóa các class theme cũ trên thẻ body
    document.body.classList.remove('theme-blue', 'theme-green', 'theme-pink');

    // 2. Thêm class theme mới (nếu không phải mặc định)
    if (themeName !== 'default') {
        document.body.classList.add('theme-' + themeName);
    }

    // 3. Lưu vào bộ nhớ cục bộ THEO TÊN TÀI KHOẢN (VD: appTheme_hs1)
    if (saveToStorage) {
        const userStr = window.TestBrowserStorage.localStorage.getItem('currentUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                window.TestBrowserStorage.localStorage.setItem('appTheme_' + user.username, themeName);
            } catch (e) { }
        }
    }
};

// 4. Tự động áp dụng giao diện khi vừa mở trang web lên
function initAppTheme() {
    // Kiểm tra xem có đang ở trang đăng nhập không (index.html hoặc link gốc)
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');

    let savedTheme = 'default'; // Trang đăng nhập luôn dùng mặc định

    // Nếu ĐANG TRONG TRANG GIÁO VIÊN / HỌC SINH thì mới tải theme cá nhân
    if (!isLoginPage) {
        const userStr = window.TestBrowserStorage.localStorage.getItem('currentUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                // Lấy theme tương ứng với tài khoản đang đăng nhập
                savedTheme = window.TestBrowserStorage.localStorage.getItem('appTheme_' + user.username) || 'default';
            } catch (e) { }
        }
    }

    // Áp dụng theme (và KHÔNG lưu đè lại vào bộ nhớ nếu đang ở trang đăng nhập)
    changeTheme(savedTheme, !isLoginPage);

    // Cập nhật lại thanh select (dropdown) cho đúng với theme đang chọn
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.value = savedTheme;
    }
}

// Khắc phục lỗi bất đồng bộ: Nếu DOM đã load xong rồi thì chạy luôn, nếu chưa thì chờ
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppTheme);
} else {
    initAppTheme();
}

// ==============================================================
// XỬ LÝ RÚT GỌN / MỞ RỘNG SIDEBAR
// ==============================================================
window.toggleSidebar = function () {
    const dashboard = document.querySelector('.dashboard');
    if (dashboard) {
        dashboard.classList.toggle('collapsed');

        // Lưu trạng thái vào bộ nhớ để F5 không bị mất
        const isCollapsed = dashboard.classList.contains('collapsed');
        window.TestBrowserStorage.localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
};

// Tự động khôi phục trạng thái thu gọn khi vừa tải trang xong
window.addEventListener('DOMContentLoaded', () => {
    const isCollapsed = window.TestBrowserStorage.localStorage.getItem('sidebarCollapsed') === 'true';
    const dashboard = document.querySelector('.dashboard');
    if (isCollapsed && dashboard) {
        dashboard.classList.add('collapsed');
    }
});
// ==============================================================
// HÀM TÌM KIẾM DỮ LIỆU ĐA NĂNG (DÙNG CHUNG)
// ==============================================================
window.filterItems = function (containerId, keyword) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const term = keyword.toLowerCase().trim();

    // Kiểm tra xem container đang chứa Table (Bảng) hay Div (Card)
    if (container.tagName === 'TBODY' || container.querySelector('table')) {
        // Xử lý tìm kiếm trong Bảng (Ví dụ: Danh sách học sinh)
        const tbody = container.tagName === 'TBODY' ? container : container.querySelector('tbody');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                // Bỏ qua hàng tiêu đề (th) nếu có
                if (row.querySelector('th')) return;

                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        }
    } else {
        // Xử lý tìm kiếm trong danh sách Card (Ví dụ: Bài tập, Tài liệu)
        const items = container.children;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Bỏ qua các thẻ thông báo trống (Chưa có bài nộp...)
            if (item.tagName === 'P' && item.innerText.includes('Chưa có')) continue;

            // Tìm kiếm dựa trên toàn bộ text hiển thị trong Card đó
            const text = item.innerText.toLowerCase();
            item.style.display = text.includes(term) ? '' : 'none';
        }
    }
};

// =====================================================================
// SYSTEM HEALTH CENTER 2.0 — CHẨN ĐOÁN CHỈ ĐỌC
// - Không tự sửa window.TestBrowserStorage.localStorage/Firebase/R2/Cloudinary.
// - Không gửi báo cáo tự động và không đánh dấu trạng thái dữ liệu.
// - Kiểm tra Auth, RTDB, Service Worker, cache/build, R2, Cloudinary,
//   module, listener/timer runtime và số DOM effect/animation đang hoạt động.
// =====================================================================
(() => {
    'use strict';

    const VERSION = '2.1.0';
    const R2_PROBE_TIMEOUT_MS = 3500;
    const SW_PING_TIMEOUT_MS = 1800;

    const nativeTimers = Object.freeze({
        setTimeout: window.setTimeout.bind(window),
        clearTimeout: window.clearTimeout.bind(window),
        setInterval: window.setInterval.bind(window),
        clearInterval: window.clearInterval.bind(window),
        requestAnimationFrame:
            typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame.bind(window)
                : null,
        cancelAnimationFrame:
            typeof window.cancelAnimationFrame === 'function'
                ? window.cancelAnimationFrame.bind(window)
                : null
    });

    const state = {
        running: false,
        lastResult: null
    };

    function installRuntimeTelemetry() {
        if (window.__SystemHealthRuntimeTelemetry) {
            return window.__SystemHealthRuntimeTelemetry;
        }

        const telemetry = {
            startedAt: Date.now(),
            listeners: {
                activeEstimate: 0,
                added: 0,
                removed: 0,
                onceRegistrations: 0,
                byType: new Map()
            },
            timeouts: new Map(),
            intervals: new Map(),
            rafs: new Set()
        };

        const listenerRegistry = new WeakMap();
        const eventTargetPrototype =
            typeof EventTarget !== 'undefined'
                ? EventTarget.prototype
                : null;

        const nativeAdd = eventTargetPrototype?.addEventListener;
        const nativeRemove = eventTargetPrototype?.removeEventListener;

        function getCapture(options) {
            return typeof options === 'boolean'
                ? options
                : Boolean(options?.capture);
        }

        function trackListenerAdd(target, type, listener, options) {
            if (!target || !listener) return;

            let targetMap = listenerRegistry.get(target);
            if (!targetMap) {
                targetMap = new Map();
                listenerRegistry.set(target, targetMap);
            }

            const normalizedType = String(type || 'unknown');
            let typeMap = targetMap.get(normalizedType);
            if (!typeMap) {
                typeMap = new Map();
                targetMap.set(normalizedType, typeMap);
            }

            let captures = typeMap.get(listener);
            if (!captures) {
                captures = new Set();
                typeMap.set(listener, captures);
            }

            const capture = getCapture(options);
            if (captures.has(capture)) return;

            captures.add(capture);
            telemetry.listeners.activeEstimate++;
            telemetry.listeners.added++;
            telemetry.listeners.byType.set(
                normalizedType,
                (telemetry.listeners.byType.get(normalizedType) || 0) + 1
            );

            if (
                options &&
                typeof options === 'object' &&
                options.once === true
            ) {
                telemetry.listeners.onceRegistrations++;
            }

            const signal =
                options && typeof options === 'object'
                    ? options.signal
                    : null;

            if (
                signal &&
                typeof nativeAdd === 'function' &&
                typeof signal.addEventListener === 'function'
            ) {
                try {
                    nativeAdd.call(
                        signal,
                        'abort',
                        () => {
                            trackListenerRemove(
                                target,
                                normalizedType,
                                listener,
                                options
                            );
                        },
                        { once: true }
                    );
                } catch (_) {}
            }
        }

        function trackListenerRemove(target, type, listener, options) {
            if (!target || !listener) return;

            const normalizedType = String(type || 'unknown');
            const targetMap = listenerRegistry.get(target);
            const typeMap = targetMap?.get(normalizedType);
            const captures = typeMap?.get(listener);
            const capture = getCapture(options);

            if (!captures?.has(capture)) return;

            captures.delete(capture);
            telemetry.listeners.activeEstimate = Math.max(
                0,
                telemetry.listeners.activeEstimate - 1
            );
            telemetry.listeners.removed++;

            const nextTypeCount = Math.max(
                0,
                (telemetry.listeners.byType.get(normalizedType) || 0) - 1
            );

            if (nextTypeCount) {
                telemetry.listeners.byType.set(
                    normalizedType,
                    nextTypeCount
                );
            } else {
                telemetry.listeners.byType.delete(normalizedType);
            }

            if (captures.size === 0) {
                typeMap.delete(listener);
            }
            if (typeMap.size === 0) {
                targetMap.delete(normalizedType);
            }
        }

        if (
            eventTargetPrototype &&
            typeof nativeAdd === 'function' &&
            typeof nativeRemove === 'function'
        ) {
            try {
                eventTargetPrototype.addEventListener = function (
                    type,
                    listener,
                    options
                ) {
                    const result = nativeAdd.call(
                        this,
                        type,
                        listener,
                        options
                    );

                    trackListenerAdd(
                        this,
                        type,
                        listener,
                        options
                    );

                    return result;
                };

                eventTargetPrototype.removeEventListener = function (
                    type,
                    listener,
                    options
                ) {
                    const result = nativeRemove.call(
                        this,
                        type,
                        listener,
                        options
                    );

                    trackListenerRemove(
                        this,
                        type,
                        listener,
                        options
                    );

                    return result;
                };
            } catch (error) {
                console.warn(
                    '[SystemHealth] Không thể bật listener telemetry:',
                    error
                );
            }
        }

        try {
            window.setTimeout = function (handler, delay, ...args) {
                let timerId;

                if (typeof handler === 'function') {
                    const wrapped = function (...callbackArgs) {
                        telemetry.timeouts.delete(timerId);
                        return handler.apply(this, callbackArgs);
                    };

                    timerId = nativeTimers.setTimeout(
                        wrapped,
                        delay,
                        ...args
                    );
                } else {
                    timerId = nativeTimers.setTimeout(
                        handler,
                        delay,
                        ...args
                    );
                }

                telemetry.timeouts.set(timerId, {
                    delay: Number(delay) || 0,
                    createdAt: Date.now()
                });

                return timerId;
            };

            window.clearTimeout = function (timerId) {
                telemetry.timeouts.delete(timerId);
                telemetry.intervals.delete(timerId);
                return nativeTimers.clearTimeout(timerId);
            };

            window.setInterval = function (handler, delay, ...args) {
                const timerId = nativeTimers.setInterval(
                    handler,
                    delay,
                    ...args
                );

                telemetry.intervals.set(timerId, {
                    delay: Number(delay) || 0,
                    createdAt: Date.now()
                });

                return timerId;
            };

            window.clearInterval = function (timerId) {
                telemetry.intervals.delete(timerId);
                telemetry.timeouts.delete(timerId);
                return nativeTimers.clearInterval(timerId);
            };

            if (
                nativeTimers.requestAnimationFrame &&
                nativeTimers.cancelAnimationFrame
            ) {
                window.requestAnimationFrame = function (callback) {
                    let frameId;
                    frameId = nativeTimers.requestAnimationFrame(
                        timestamp => {
                            telemetry.rafs.delete(frameId);
                            callback(timestamp);
                        }
                    );
                    telemetry.rafs.add(frameId);
                    return frameId;
                };

                window.cancelAnimationFrame = function (frameId) {
                    telemetry.rafs.delete(frameId);
                    return nativeTimers.cancelAnimationFrame(frameId);
                };
            }
        } catch (error) {
            console.warn(
                '[SystemHealth] Không thể bật timer telemetry:',
                error
            );
        }

        const api = Object.freeze({
            version: VERSION,
            getSnapshot() {
                const byType = [...telemetry.listeners.byType.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 12)
                    .map(([type, count]) => ({ type, count }));

                return {
                    startedAt: telemetry.startedAt,
                    uptimeMs: Date.now() - telemetry.startedAt,
                    listeners: {
                        activeEstimate:
                            telemetry.listeners.activeEstimate,
                        added: telemetry.listeners.added,
                        removed: telemetry.listeners.removed,
                        onceRegistrations:
                            telemetry.listeners.onceRegistrations,
                        byType
                    },
                    timers: {
                        timeouts: telemetry.timeouts.size,
                        intervals: telemetry.intervals.size,
                        animationFrames: telemetry.rafs.size,
                        total:
                            telemetry.timeouts.size +
                            telemetry.intervals.size +
                            telemetry.rafs.size
                    }
                };
            }
        });

        window.__SystemHealthRuntimeTelemetry = api;
        return api;
    }

    const telemetry = installRuntimeTelemetry();

    function wait(ms) {
        return new Promise(resolve => {
            nativeTimers.setTimeout(resolve, ms);
        });
    }

    function resolvePageRole() {
        const explicitRole = String(
            window.__APP_PAGE_ROLE__ ||
            document.documentElement?.dataset?.appRole ||
            document.body?.dataset?.appRole ||
            ''
        ).trim().toLowerCase();

        if (
            explicitRole === 'teacher' ||
            explicitRole === 'student'
        ) {
            return explicitRole;
        }

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

    function getDatabase() {
        try {
            if (
                typeof db !== 'undefined' &&
                db &&
                typeof db.ref === 'function'
            ) {
                return db;
            }
        } catch (_) {}

        return (
            window.db &&
            typeof window.db.ref === 'function'
        )
            ? window.db
            : null;
    }

    function getAuthUser() {
        try {
            if (
                typeof firebase !== 'undefined' &&
                typeof firebase.auth === 'function'
            ) {
                return firebase.auth().currentUser || null;
            }
        } catch (_) {}

        return null;
    }

    function appVersion() {
        return String(
            document
                .querySelector('meta[name="application-version"]')
                ?.getAttribute('content') ||
            window.APP_VERSION ||
            ''
        ).trim();
    }

    function row(id, title, status, summary, details = [], meta = {}) {
        const allowed = new Set(['pass', 'warn', 'error', 'info']);
        return {
            id,
            title,
            status: allowed.has(status) ? status : 'info',
            summary: String(summary || ''),
            details: (Array.isArray(details) ? details : [details])
                .filter(Boolean)
                .map(value => String(value)),
            meta
        };
    }

    async function checkAuth() {
        if (
            typeof firebase === 'undefined' ||
            typeof firebase.auth !== 'function'
        ) {
            return row(
                'firebase-auth',
                'xác thực đám mây',
                'error',
                'bộ kết nối xác thực đám mây chưa sẵn sàng.'
            );
        }

        let user = getAuthUser();

        if (!user) {
            await wait(180);
            user = getAuthUser();
        }

        if (!user?.uid) {
            return row(
                'firebase-auth',
                'xác thực đám mây',
                'error',
                'Không có phiên xác thực đám mây đang đăng nhập.'
            );
        }

        return row(
            'firebase-auth',
            'xác thực đám mây',
            'pass',
            'Phiên đăng nhập đám mây đang hoạt động.',
            [
                `UID: ${user.uid}`,
                user.email ? `Email: ${user.email}` : ''
            ],
            { uid: user.uid }
        );
    }

    async function checkRTDB() {
        const database = getDatabase();
        const authUser = getAuthUser();

        if (!database) {
            return row(
                'firebase-rtdb',
                'cơ sở dữ liệu đám mây',
                'error',
                'Không tìm thấy kết nối Realtime Database.'
            );
        }

        try {
            const startedAt = performance.now();
            const connectedSnapshot = await database
                .ref('.info/connected')
                .once('value');
            const latencyMs = Math.max(
                0,
                Math.round(performance.now() - startedAt)
            );
            const connected = connectedSnapshot.val() === true;

            const details = [
                `Đọc .info/connected: ${latencyMs} ms`,
                `Trạng thái realtime: ${connected ? 'connected' : 'disconnected'}`
            ];

            if (authUser?.uid) {
                try {
                    const userStartedAt = performance.now();
                    const userSnapshot = await database
                        .ref(`users/${authUser.uid}`)
                        .once('value');
                    const userLatencyMs = Math.max(
                        0,
                        Math.round(performance.now() - userStartedAt)
                    );

                    details.push(
                        `Đọc users/<uid>: ${userLatencyMs} ms · ${
                            userSnapshot.exists()
                                ? 'có hồ sơ'
                                : 'không có hồ sơ'
                        }`
                    );

                    if (!userSnapshot.exists()) {
                        return row(
                            'firebase-rtdb',
                            'cơ sở dữ liệu đám mây',
                            'error',
                            'RTDB đọc được nhưng hồ sơ users/<uid> không tồn tại.',
                            details,
                            { connected, latencyMs }
                        );
                    }
                } catch (error) {
                    details.push(
                        `Không đọc được users/<uid>: ${error?.message || error}`
                    );
                    return row(
                        'firebase-rtdb',
                        'cơ sở dữ liệu đám mây',
                        'warn',
                        'RTDB lõi phản hồi nhưng không xác minh được hồ sơ người dùng.',
                        details,
                        { connected, latencyMs }
                    );
                }
            }

            return row(
                'firebase-rtdb',
                'cơ sở dữ liệu đám mây',
                connected ? 'pass' : 'warn',
                connected
                    ? 'Realtime Database đang kết nối.'
                    : 'RTDB đọc được nhưng client đang báo disconnected.',
                details,
                { connected, latencyMs }
            );
        } catch (error) {
            return row(
                'firebase-rtdb',
                'cơ sở dữ liệu đám mây',
                'error',
                'Không thể đọc Realtime Database.',
                [error?.message || String(error)]
            );
        }
    }

    async function pingServiceWorker(worker) {
        if (!worker || typeof MessageChannel === 'undefined') {
            return null;
        }

        return new Promise(resolve => {
            const channel = new MessageChannel();
            let settled = false;

            const finish = value => {
                if (settled) return;
                settled = true;
                nativeTimers.clearTimeout(timeoutId);
                try {
                    channel.port1.close();
                    channel.port2.close();
                } catch (_) {}
                resolve(value || null);
            };

            const timeoutId = nativeTimers.setTimeout(
                () => finish(null),
                SW_PING_TIMEOUT_MS
            );

            channel.port1.onmessage = event => {
                const data = event?.data;
                if (data?.type === 'PONG') {
                    finish(data);
                }
            };

            try {
                worker.postMessage(
                    {
                        type: 'PING',
                        requestId:
                            `health-${Date.now()}-${Math.random()
                                .toString(36)
                                .slice(2)}`
                    },
                    [channel.port2]
                );
            } catch (_) {
                finish(null);
            }
        });
    }

    async function checkServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            return {
                healthRow: row(
                    'service-worker',
                    'Service Worker',
                    'warn',
                    'Trình duyệt không hỗ trợ Service Worker.'
                ),
                pong: null
            };
        }

        if (!/^https?:$/.test(location.protocol)) {
            return {
                healthRow: row(
                    'service-worker',
                    'Service Worker',
                    'warn',
                    'Service Worker không hoạt động trên giao thức hiện tại.',
                    [`Protocol: ${location.protocol}`]
                ),
                pong: null
            };
        }

        try {
            const registration =
                await navigator.serviceWorker.getRegistration();

            if (!registration) {
                return {
                    healthRow: row(
                        'service-worker',
                        'Service Worker',
                        'warn',
                        'Chưa có Service Worker registration cho trang hiện tại.'
                    ),
                    pong: null
                };
            }

            const worker =
                registration.active ||
                registration.waiting ||
                registration.installing ||
                navigator.serviceWorker.controller;
            const pong = await pingServiceWorker(worker);

            const details = [
                `Scope: ${registration.scope || '(không rõ)'}`,
                `Worker state: ${worker?.state || 'unknown'}`,
                `Controller: ${navigator.serviceWorker.controller ? 'có' : 'chưa có'}`
            ];

            if (pong) {
                details.push(
                    `SW appVersion: ${pong.appVersion || '(trống)'}`,
                    `SW build: ${pong.build || '(trống)'}`,
                    `SW cacheVersion: ${pong.cacheVersion || '(trống)'}`
                );
            }

            const expectedAppVersion = appVersion();
            const versionMismatch = Boolean(
                pong?.appVersion &&
                expectedAppVersion &&
                String(pong.appVersion) !== expectedAppVersion
            );

            return {
                healthRow: row(
                    'service-worker',
                    'Service Worker',
                    versionMismatch
                        ? 'warn'
                        : pong
                            ? 'pass'
                            : 'warn',
                    versionMismatch
                        ? `Service Worker đang dùng appVersion ${pong.appVersion}, khác trang ${expectedAppVersion}.`
                        : pong
                            ? 'Service Worker phản hồi PING bình thường.'
                            : 'Service Worker đã đăng ký nhưng chưa phản hồi PING Health Center.',
                    details,
                    {
                        cacheVersion: pong?.cacheVersion || '',
                        build: pong?.build || '',
                        appVersion: pong?.appVersion || ''
                    }
                ),
                pong
            };
        } catch (error) {
            return {
                healthRow: row(
                    'service-worker',
                    'Service Worker',
                    'error',
                    'Không đọc được trạng thái Service Worker.',
                    [error?.message || String(error)]
                ),
                pong: null
            };
        }
    }

    async function checkCache(swPong) {
        if (!('caches' in window)) {
            return row(
                'cache-version',
                'Cache / Build',
                'warn',
                'Trình duyệt không cung cấp Cache Storage API.'
            );
        }

        try {
            const names = await caches.keys();
            const studyCaches = names.filter(name =>
                String(name).startsWith('study-')
            );
            const expectedCache =
                String(swPong?.cacheVersion || '').trim();
            const matching = expectedCache
                ? studyCaches.includes(expectedCache) ||
                    studyCaches.includes(`${expectedCache}-offline`) ||
                    studyCaches.includes(`${expectedCache}-runtime`)
                : false;

            const updateState =
                window.SystemUpdateManager?.getState?.() || null;
            const installedVersion = String(
                updateState?.installedVersion || appVersion() || ''
            );

            const details = [
                `Trang appVersion: ${appVersion() || '(trống)'}`,
                `Update Manager installedVersion: ${installedVersion || '(trống)'}`,
                `Cache study-* hiện có: ${studyCaches.length}`,
                ...studyCaches.slice(0, 6).map(name => `• ${name}`)
            ];

            if (expectedCache) {
                details.unshift(
                    `Cache version SW mong đợi: ${expectedCache}`
                );
            }

            if (!studyCaches.length) {
                return row(
                    'cache-version',
                    'Cache / Build',
                    'warn',
                    'Chưa thấy cache study-* trong Cache Storage.',
                    details
                );
            }

            if (expectedCache && !matching) {
                return row(
                    'cache-version',
                    'Cache / Build',
                    'warn',
                    'Cache hiện tại chưa khớp cacheVersion của Service Worker.',
                    details,
                    { expectedCache, studyCaches }
                );
            }

            return row(
                'cache-version',
                'Cache / Build',
                'pass',
                expectedCache
                    ? 'Cache và Service Worker đang dùng cùng build.'
                    : 'Cache Storage đang hoạt động; chưa có metadata PING để đối chiếu build.',
                details,
                { expectedCache, studyCaches }
            );
        } catch (error) {
            return row(
                'cache-version',
                'Cache / Build',
                'warn',
                'Không đọc được danh sách Cache Storage.',
                [error?.message || String(error)]
            );
        }
    }

    async function checkR2() {
        const storage = window.CloudflareR2Storage;

        if (!storage) {
            return row(
                'cloudflare-r2',
                'Cloudflare R2',
                'error',
                'Module CloudflareR2Storage bị thiếu.'
            );
        }

        const configured =
            typeof storage.isConfigured === 'function'
                ? storage.isConfigured()
                : Boolean(storage.config?.workerUrl);
        const workerUrl = String(
            storage.config?.workerUrl || ''
        ).replace(/\/+$/, '');

        if (!configured || !workerUrl) {
            return row(
                'cloudflare-r2',
                'Cloudflare R2',
                'error',
                'R2 module có mặt nhưng Worker URL chưa được cấu hình.'
            );
        }

        const controller =
            typeof AbortController !== 'undefined'
                ? new AbortController()
                : null;
        const timeoutId = nativeTimers.setTimeout(
            () => controller?.abort(),
            R2_PROBE_TIMEOUT_MS
        );

        try {
            const startedAt = performance.now();
            const response = await fetch(workerUrl, {
                method: 'GET',
                cache: 'no-store',
                credentials: 'omit',
                signal: controller?.signal
            });
            const latencyMs = Math.max(
                0,
                Math.round(performance.now() - startedAt)
            );

            const reachable = response.status < 500;
            const protectedStatus = [401, 403].includes(response.status);
            const routeNotExposed = [404, 405].includes(response.status);

            return row(
                'cloudflare-r2',
                'Cloudflare R2',
                reachable ? 'pass' : 'warn',
                reachable
                    ? protectedStatus
                        ? 'R2 Worker có phản hồi và đang yêu cầu xác thực.'
                        : routeNotExposed
                            ? 'R2 Worker có phản hồi; route gốc không công khai health endpoint.'
                            : 'R2 Worker có phản hồi bình thường.'
                    : `R2 Worker phản hồi HTTP ${response.status}.`,
                [
                    `Worker: ${workerUrl}`,
                    `HTTP: ${response.status}`,
                    `Thời gian: ${latencyMs} ms`,
                    'Probe chỉ dùng GET; không upload/xóa file.'
                ],
                { status: response.status, latencyMs }
            );
        } catch (error) {
            return row(
                'cloudflare-r2',
                'Cloudflare R2',
                'warn',
                'R2 đã cấu hình nhưng Health Center không probe được Worker từ trình duyệt.',
                [
                    `Worker: ${workerUrl}`,
                    error?.name === 'AbortError'
                        ? `Probe quá ${R2_PROBE_TIMEOUT_MS} ms.`
                        : (error?.message || String(error)),
                    'Không có thao tác ghi nào được thực hiện.'
                ]
            );
        } finally {
            nativeTimers.clearTimeout(timeoutId);
        }
    }

    function checkCloudinary() {
        const storage = window.CloudinaryStorage;

        if (!storage) {
            return row(
                'cloudinary',
                'Cloudinary',
                'error',
                'Module CloudinaryStorage bị thiếu.'
            );
        }

        const provider = String(
            storage.config?.provider || ''
        ).trim();
        const compatibilityMode =
            storage.config?.compatibilityMode === true;
        const uploadApiPresent =
            typeof storage.uploadFile === 'function' &&
            typeof storage.uploadFiles === 'function';

        if (!uploadApiPresent) {
            return row(
                'cloudinary',
                'Cloudinary',
                'error',
                'CloudinaryStorage có mặt nhưng API tương thích bị thiếu.'
            );
        }

        if (
            compatibilityMode &&
            provider === 'cloudflare-r2'
        ) {
            return row(
                'cloudinary',
                'Cloudinary',
                'pass',
                'Cloudinary đang ở compatibility mode và chuyển lưu trữ mới sang R2.',
                [
                    'Không còn dùng unsigned Cloudinary upload trực tiếp.',
                    'Health Center chỉ kiểm tra cấu hình/runtime; không upload thử.'
                ],
                { provider, compatibilityMode }
            );
        }

        return row(
            'cloudinary',
            'Cloudinary',
            'info',
            'CloudinaryStorage runtime đang hoạt động.',
            [
                `Provider: ${provider || '(không khai báo)'}`,
                `Compatibility mode: ${compatibilityMode ? 'bật' : 'tắt'}`
            ],
            { provider, compatibilityMode }
        );
    }

    function scriptBasenames() {
        return new Set(
            [...document.scripts]
                .map(script => {
                    const src = String(script.src || '');
                    if (!src) return '';
                    try {
                        return new URL(src, document.baseURI)
                            .pathname
                            .split('/')
                            .pop();
                    } catch (_) {
                        return src.split(/[/?#]/).filter(Boolean).pop() || '';
                    }
                })
                .filter(Boolean)
        );
    }

    function checkModules() {
        const role = resolvePageRole();
        const scripts = scriptBasenames();

        const checks = [
            {
                name: 'firebase-config.js',
                required: true,
                ready: () =>
                    typeof firebase !== 'undefined' &&
                    typeof firebase.auth === 'function' &&
                    typeof firebase.database === 'function'
            },
            {
                name: 'cloudinary-storage.js',
                required: true,
                ready: () => Boolean(window.CloudinaryStorage)
            },
            {
                name: 'cloudflare-r2-storage.js',
                required: true,
                ready: () => Boolean(window.CloudflareR2Storage)
            },
            {
                name: 'update-manager.js',
                required: true,
                ready: () => Boolean(window.SystemUpdateManager)
            },
            {
                name: 'web-animations.js',
                required: true,
                ready: () => Boolean(window.WebAnimationSystem)
            },
            {
                name: 'web-performance-optimizer.js',
                required: true,
                ready: () => Boolean(window.WebPerformanceOptimizer)
            },
            {
                name: 'transaction-history.js',
                required: true,
                ready: () => Boolean(window.TransactionHistory)
            },
            {
                name: 'effect-quality-manager.js',
                required: true,
                ready: () => Boolean(window.EffectQualityManager)
            },
            {
                name: 'student-feature-loader.js',
                required: role === 'student',
                ready: () => Boolean(window.StudentFeatureLoader)
            },
            {
                name: 'daily-login.js',
                required: role === 'teacher',
                ready: () => typeof DailyLoginManager !== 'undefined'
            },
            {
                name: 'theme-items.js',
                required: role === 'teacher',
                ready: () => typeof ThemeManager !== 'undefined'
            },
            {
                name: 'effect-items.js',
                required: role === 'teacher',
                ready: () => typeof EffectManager !== 'undefined'
            },
            {
                name: 'pet-items.js',
                required: role === 'teacher',
                ready: () => typeof PetManager !== 'undefined'
            },
            {
                name: 'royal-ball.js',
                required: role === 'teacher',
                ready: () => typeof RoyalBallEvent !== 'undefined'
            },
            {
                name: 'music-manager.js',
                required: role === 'teacher',
                ready: () => Boolean(window.MusicManager)
            },
            {
                name: 'store-manager.js',
                required: role === 'teacher',
                ready: () =>
                    typeof StoreManager !== 'undefined' &&
                    typeof StoreConfig !== 'undefined'
            },
            {
                name: 'painting.js',
                required: role === 'teacher',
                ready: () => Boolean(window.HoiHoaSystem)
            },
            {
                name: 'luxury-store.js',
                required: role === 'teacher',
                ready: () => Boolean(window.LuxuryStore)
            }
        ];

        const relevant = checks.filter(check => check.required);
        const missing = [];
        const healthy = [];

        relevant.forEach(check => {
            const declared = scripts.has(check.name);
            let ready = false;

            try {
                ready = Boolean(check.ready());
            } catch (_) {
                ready = false;
            }

            if (!declared || !ready) {
                missing.push(
                    `${check.name}: ${
                        !declared
                            ? 'thiếu <script>'
                            : 'script có nhưng runtime chưa sẵn sàng'
                    }`
                );
            } else {
                healthy.push(check.name);
            }
        });

        const lazyState =
            role === 'student'
                ? window.StudentFeatureLoader?.getState?.()
                : null;

        const details = [
            `Đã xác minh: ${healthy.length}/${relevant.length} module bắt buộc.`,
            ...missing.map(value => `Thiếu: ${value}`)
        ];

        if (lazyState) {
            details.push(
                `Student lazy groups đã yêu cầu: ${
                    Array.isArray(lazyState.loadedGroups)
                        ? lazyState.loadedGroups.join(', ') || '(chưa có)'
                        : '(không rõ)'
                }`
            );
        }

        return row(
            'modules',
            'Module runtime',
            missing.length ? 'error' : 'pass',
            missing.length
                ? `Phát hiện ${missing.length} module bắt buộc bị thiếu/chưa khởi tạo.`
                : 'Các module bắt buộc của trang hiện tại đều sẵn sàng.',
            details,
            { missing, healthy }
        );
    }

    function checkListeners() {
        const snapshot = telemetry?.getSnapshot?.();
        const listenerState = snapshot?.listeners;

        if (!listenerState) {
            return row(
                'listeners',
                'Event Listener',
                'info',
                'Không có runtime telemetry cho listener.'
            );
        }

        const topTypes = listenerState.byType || [];
        const details = [
            `Đang theo dõi (ước tính): ${listenerState.activeEstimate}`,
            `Đã add: ${listenerState.added} · đã remove: ${listenerState.removed}`,
            `Listener once đã đăng ký: ${listenerState.onceRegistrations}`,
            ...topTypes.map(item =>
                `${item.type}: ${item.count}`
            ),
            'Số liệu bắt đầu từ lúc common.js nạp Health Center; browser không cung cấp API chuẩn để liệt kê toàn bộ listener đã tồn tại trước đó.'
        ];

        return row(
            'listeners',
            'Event Listener',
            'info',
            `${listenerState.activeEstimate} listener đang được telemetry theo dõi.`,
            details,
            listenerState
        );
    }

    function checkTimers() {
        const snapshot = telemetry?.getSnapshot?.();
        const timerState = snapshot?.timers;

        if (!timerState) {
            return row(
                'timers',
                'Timer / RAF',
                'info',
                'Không có runtime telemetry cho timer.'
            );
        }

        const status =
            timerState.total > 120
                ? 'warn'
                : 'info';

        return row(
            'timers',
            'Timer / RAF',
            status,
            `${timerState.total} timer/animation frame đang được theo dõi.`,
            [
                `setTimeout đang chờ: ${timerState.timeouts}`,
                `setInterval đang chạy: ${timerState.intervals}`,
                `requestAnimationFrame đang chờ: ${timerState.animationFrames}`,
                status === 'warn'
                    ? 'Số timer cao; nên xem module nào tạo timer lặp nếu máy có dấu hiệu chậm.'
                    : 'Mức này chỉ là telemetry runtime, không thay đổi hay hủy timer.'
            ],
            timerState
        );
    }

    function checkDomEffects() {
        const nodes = new Set();

        const selectors = [
            '#global-effect-container *',
            '#wfx-web-animation-layer *',
            '[class^="effect-particle"]',
            '[class*=" effect-particle"]',
            '[class*="-particle"]',
            '[class*=" spark"]',
            '[class^="spark"]',
            '[class*=" confetti"]',
            '[class^="confetti"]'
        ];

        selectors.forEach(selector => {
            try {
                document
                    .querySelectorAll(selector)
                    .forEach(node => nodes.add(node));
            } catch (_) {}
        });

        let runningAnimations = 0;
        let totalAnimations = 0;

        try {
            const animations = document.getAnimations
                ? document.getAnimations()
                : [];
            totalAnimations = animations.length;
            runningAnimations = animations.filter(animation =>
                animation.playState === 'running' ||
                animation.playState === 'pending'
            ).length;
        } catch (_) {}

        const globalEffectChildren =
            document.querySelector('#global-effect-container')
                ?.childElementCount || 0;
        const webAnimationChildren =
            document.querySelector('#wfx-web-animation-layer')
                ?.childElementCount || 0;

        const status =
            nodes.size > 300 || runningAnimations > 180
                ? 'warn'
                : 'info';

        return row(
            'dom-effects',
            'DOM Effect',
            status,
            `${nodes.size} node hiệu ứng · ${runningAnimations} animation đang chạy/chờ.`,
            [
                `#global-effect-container: ${globalEffectChildren} phần tử con trực tiếp`,
                `#wfx-web-animation-layer: ${webAnimationChildren} phần tử con trực tiếp`,
                `DOM effect selectors (unique): ${nodes.size}`,
                `Web/CSS animations: ${runningAnimations}/${totalAnimations} đang chạy hoặc pending`,
                status === 'warn'
                    ? 'Mật độ hiệu ứng đang cao; đây là cảnh báo hiệu năng, không phải lỗi dữ liệu.'
                    : 'Health Center chỉ đếm DOM/animation, không dừng hay xóa hiệu ứng.'
            ],
            {
                effectNodes: nodes.size,
                runningAnimations,
                totalAnimations,
                globalEffectChildren,
                webAnimationChildren
            }
        );
    }

    function ensureStyles() {
        if (document.getElementById('systemHealthCenterStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'systemHealthCenterStyles';
        style.textContent = `
            #diagnosticResults.health-center-v2 {
                max-height: min(68vh, 760px) !important;
                padding: 14px !important;
                background: rgba(248,250,252,.96) !important;
                border: 1px solid rgba(59,130,246,.20) !important;
                overflow: auto !important;
            }
            #systemHealthDashboard {
                margin-top: 10px;
                color: #0f172a;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            #systemHealthDashboard .shc-banner {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 8px;
                margin-bottom: 12px;
            }
            #systemHealthDashboard .shc-stat {
                padding: 10px 12px;
                border-radius: 12px;
                background: #fff;
                border: 1px solid #e2e8f0;
                text-align: center;
            }
            #systemHealthDashboard .shc-stat strong {
                display: block;
                font-size: 1.15rem;
                color: #0f172a;
            }
            #systemHealthDashboard .shc-stat small {
                color: #64748b;
            }
            #systemHealthDashboard .shc-note {
                margin: 0 0 12px;
                padding: 10px 12px;
                border-radius: 10px;
                background: #eff6ff;
                color: #1e40af;
                font-size: .82rem;
                line-height: 1.5;
                border: 1px solid #bfdbfe;
            }
            #systemHealthDashboard .shc-table-wrap {
                overflow: auto;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                background: #fff;
            }
            #systemHealthDashboard table {
                width: 100%;
                min-width: 720px;
                border-collapse: collapse;
                font-size: .84rem;
            }
            #systemHealthDashboard th,
            #systemHealthDashboard td {
                padding: 10px 12px;
                border-bottom: 1px solid #eef2f7;
                vertical-align: top;
                text-align: left;
            }
            #systemHealthDashboard th {
                position: sticky;
                top: 0;
                z-index: 1;
                background: #f8fafc;
                color: #334155;
                font-size: .78rem;
                text-transform: uppercase;
                letter-spacing: .04em;
            }
            #systemHealthDashboard tr:last-child td {
                border-bottom: 0;
            }
            #systemHealthDashboard .shc-status {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 4px 8px;
                border-radius: 999px;
                font-weight: 800;
                white-space: nowrap;
            }
            #systemHealthDashboard .shc-pass {
                color: #047857;
                background: #ecfdf5;
            }
            #systemHealthDashboard .shc-warn {
                color: #b45309;
                background: #fffbeb;
            }
            #systemHealthDashboard .shc-error {
                color: #b91c1c;
                background: #fef2f2;
            }
            #systemHealthDashboard .shc-info {
                color: #1d4ed8;
                background: #eff6ff;
            }
            #systemHealthDashboard details {
                margin-top: 5px;
            }
            #systemHealthDashboard summary {
                cursor: pointer;
                color: #475569;
                font-weight: 700;
            }
            #systemHealthDashboard .shc-detail-list {
                margin: 6px 0 0;
                padding-left: 18px;
                color: #64748b;
                line-height: 1.45;
            }
            @media (max-width: 760px) {
                #systemHealthDashboard .shc-banner {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function statusLabel(status) {
        if (status === 'pass') return ['✅', 'Tốt'];
        if (status === 'warn') return ['⚠️', 'Cảnh báo'];
        if (status === 'error') return ['❌', 'Lỗi'];
        return ['ℹ️', 'Thông tin'];
    }

    function renderDashboard(resultBox, rows, scannedAt) {
        ensureStyles();

        resultBox.classList.add('health-center-v2');

        let dashboard = document.getElementById(
            'systemHealthDashboard'
        );

        if (!dashboard) {
            dashboard = document.createElement('section');
            dashboard.id = 'systemHealthDashboard';
            resultBox.appendChild(dashboard);
        }

        dashboard.innerHTML = '';

        const errorCount = rows.filter(item =>
            item.status === 'error'
        ).length;
        const warningCount = rows.filter(item =>
            item.status === 'warn'
        ).length;
        const passCount = rows.filter(item =>
            item.status === 'pass'
        ).length;

        const banner = document.createElement('div');
        banner.className = 'shc-banner';

        [
            ['✅', passCount, 'Hạng mục tốt'],
            ['⚠️', warningCount, 'Cảnh báo'],
            ['❌', errorCount, 'Lỗi']
        ].forEach(([icon, value, label]) => {
            const card = document.createElement('div');
            card.className = 'shc-stat';
            const strong = document.createElement('strong');
            strong.textContent = `${icon} ${value}`;
            const small = document.createElement('small');
            small.textContent = label;
            card.append(strong, small);
            banner.appendChild(card);
        });

        const note = document.createElement('p');
        note.className = 'shc-note';
        note.textContent =
            '🔒 Chế độ chỉ đọc: lần quét này không set/update/remove đám mây, không sửa window.TestBrowserStorage.localStorage, không upload/xóa R2/Cloudinary và không tự dừng listener/timer/effect.';

        const wrap = document.createElement('div');
        wrap.className = 'shc-table-wrap';

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        ['Hạng mục', 'Trạng thái', 'Kết quả', 'Chi tiết'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        rows.forEach(item => {
            const tr = document.createElement('tr');

            const nameCell = document.createElement('td');
            const nameStrong = document.createElement('strong');
            nameStrong.textContent = item.title;
            nameCell.appendChild(nameStrong);

            const statusCell = document.createElement('td');
            const [icon, label] = statusLabel(item.status);
            const badge = document.createElement('span');
            badge.className = `shc-status shc-${item.status}`;
            badge.textContent = `${icon} ${label}`;
            statusCell.appendChild(badge);

            const summaryCell = document.createElement('td');
            summaryCell.textContent = item.summary;

            const detailCell = document.createElement('td');
            if (item.details.length) {
                const details = document.createElement('details');
                const summary = document.createElement('summary');
                summary.textContent = 'Xem chi tiết';
                const list = document.createElement('ul');
                list.className = 'shc-detail-list';

                item.details.forEach(detail => {
                    const li = document.createElement('li');
                    li.textContent = detail;
                    list.appendChild(li);
                });

                details.append(summary, list);
                detailCell.appendChild(details);
            } else {
                detailCell.textContent = '—';
            }

            tr.append(
                nameCell,
                statusCell,
                summaryCell,
                detailCell
            );
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        wrap.appendChild(table);

        const footer = document.createElement('p');
        footer.style.cssText =
            'margin:10px 2px 0;color:#64748b;font-size:.78rem;line-height:1.45;';
        footer.textContent =
            `System Health Center v${VERSION} · Quét lúc ${
                new Date(scannedAt).toLocaleString('vi-VN')
            } · ${resolvePageRole()}`;

        dashboard.append(banner, note, wrap, footer);

        return { errorCount, warningCount, passCount };
    }

    function updateScannerCardCopy() {
        const button = document.querySelector(
            'button[onclick*="runSystemDiagnostics"]'
        );
        const card = button?.closest('.glass-alert');

        if (!card) return;

        const heading = card.querySelector('h3');
        const paragraph = card.querySelector('p');

        if (heading) {
            heading.textContent = '🩺 System Health Center 2.1';
        }

        if (paragraph) {
            paragraph.textContent =
                'Bảng chẩn đoán chỉ đọc: kiểm tra đám mây, Service Worker/cache, R2/Cloudinary, module runtime, listener/timer và mật độ hiệu ứng DOM. Không tự sửa dữ liệu.';
        }

        button.textContent = '🩺 Quét sức khỏe hệ thống';
        button.title =
            'Chỉ đọc trạng thái hệ thống; không sửa hoặc xóa dữ liệu.';
    }

    async function checkResponsiveness() {
        const started=performance.now();
        await new Promise(resolve=>setTimeout(resolve,50));
        const delay=Math.max(0,Math.round(performance.now()-started-50));
        return row('responsiveness','Độ phản hồi giao diện',delay>200?'warn':'pass','Độ trễ vòng xử lý: '+delay+' ms',delay>200?['Đóng các cửa sổ không dùng và chọn mức thấp trong Tối ưu hiệu năng.']:['Đây là mẫu đo tại thời điểm quét, không phải tốc độ mạng.']);
    }
    function checkExamWorkspace() {
        const exam=window.currentActiveExamId;
        const full=!!document.fullscreenElement;
        return row('exam-workspace','Phiên thi và trắc nghiệm',exam&&!full?'warn':'info',exam?(full?'Đang thi trong toàn màn hình.':'Bài thi cần quay lại toàn màn hình.'):'Không có bài thi đang hoạt động.',[window.MCWorkspace?'Bộ trắc nghiệm đã tải.':'Bộ trắc nghiệm chưa tải.',exam&&!full?'Dùng nút Tiếp tục thi; không mở thêm tab làm bài.':'Không thay đổi hay kết thúc phiên thi khi quét.']);
    }
    async function run() {
        if (state.running) {
            return state.lastResult;
        }

        const resultBox = document.getElementById(
            'diagnosticResults'
        );
        const statusText = document.getElementById(
            'diagnosticStatus'
        );
        const legacyList = document.getElementById(
            'diagnosticList'
        );

        if (!resultBox || !statusText) {
            (await AppDialog.alert(
                'Không tìm thấy vùng hiển thị System Health Center.'
            ));
            return null;
        }

        state.running = true;
        resultBox.style.display = 'block';
        statusText.textContent =
            '⏳ Đang quét sức khỏe hệ thống ở chế độ chỉ đọc...';
        statusText.style.color = '#1d4ed8';
        statusText.style.fontWeight = '800';

        if (legacyList) {
            legacyList.innerHTML = '';
            legacyList.style.display = 'none';
        }

        document.getElementById('diagnosticActions')?.remove();
        document.getElementById('teacherDiagnosticReports')?.remove();

        try {
            const [
                authRow,
                rtdbRow,
                swResult,
                r2Row
            ] = await Promise.all([
                checkAuth().catch(error=>row('auth','xác thực đám mây','error',error.message)),
                checkRTDB().catch(error=>row('rtdb','cơ sở dữ liệu đám mây','error',error.message)),
                checkServiceWorker().catch(error=>({healthRow:row('sw','Service Worker','warn',error.message),pong:null})),
                checkR2().catch(error=>row('r2','Cloudflare R2','error',error.message))
            ]);

            const rows = [
                authRow,
                rtdbRow,
                swResult.healthRow,
                await checkCache(swResult.pong),
                r2Row,
                checkCloudinary(),
                checkModules(),
                checkListeners(),
                checkTimers(),
                checkDomEffects(),
                await checkResponsiveness(),
                checkExamWorkspace()
            ];

            const scannedAt = Date.now();
            const counts = renderDashboard(
                resultBox,
                rows,
                scannedAt
            );

            statusText.textContent =
                counts.errorCount > 0
                    ? `Hoàn tất: ${counts.errorCount} lỗi, ${counts.warningCount} cảnh báo.`
                    : counts.warningCount > 0
                        ? `Hoàn tất: không có lỗi nghiêm trọng, ${counts.warningCount} cảnh báo.`
                        : 'Hoàn tất: các hạng mục chính đang ổn định.';
            statusText.style.color =
                counts.errorCount > 0
                    ? '#b91c1c'
                    : counts.warningCount > 0
                        ? '#b45309'
                        : '#047857';

            const result = {
                version: VERSION,
                role: resolvePageRole(),
                readOnly: true,
                rows,
                ...counts,
                scannedAt
            };

            const actions=document.createElement('div');actions.id='diagnosticActions';
            const download=document.createElement('button');download.type='button';download.textContent='Tải báo cáo chẩn đoán';
            download.onclick=()=>{const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='chan-doan-he-thong.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
            actions.append(download);resultBox.append(actions);
            state.lastResult = result;
            return result;
        } catch (error) {
            console.error(
                '[SystemHealth] Health Center crashed:',
                error
            );
            statusText.textContent =
                '❌ Health Center gặp lỗi khi đang quét.';
            statusText.style.color = '#b91c1c';

            const fallback = row(
                'health-center',
                'System Health Center',
                'error',
                'Bộ chẩn đoán gặp lỗi ngoài dự kiến.',
                [error?.message || String(error)]
            );
            renderDashboard(
                resultBox,
                [fallback],
                Date.now()
            );
            return null;
        } finally {
            state.running = false;
        }
    }

    function boot() {
        updateScannerCardCopy();
    }

    window.SystemDiagnostics = Object.freeze({
        version: VERSION,
        name: 'System Health Center 2.1',
        readOnly: true,
        run,
        resolvePageRole,
        getLastResult: () => state.lastResult,
        getRuntimeTelemetry: () =>
            telemetry?.getSnapshot?.() || null
    });

    window.SystemHealthCenter = window.SystemDiagnostics;
    window.runSystemDiagnostics = () => run();

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            boot,
            { once: true }
        );
    } else {
        boot();
    }
})();

// ==============================================================
// MODAL MANAGER - ĐÓNG MODAL AN TOÀN, KHÔNG BỎ QUA CLEANUP
// ==============================================================
// Mục tiêu:
// 1) Ưu tiên handler cleanup do module đăng ký.
// 2) Cho module nghe custom event `app:modal-close-request`.
// 3) Nếu không có handler riêng thì vẫn click nút đóng cũ để giữ tương thích.
// 4) KHÔNG force-hide modal khi không biết cách cleanup.
// ==============================================================
window.ModalManager = window.ModalManager || (() => {
    const cleanupHandlers = new WeakMap();
    const closingModals = new WeakSet();

    function resolveModal(modalOrSelector) {
        if (!modalOrSelector) return null;

        if (modalOrSelector instanceof Element) {
            return modalOrSelector;
        }

        if (typeof modalOrSelector === 'string') {
            return document.querySelector(modalOrSelector);
        }

        return null;
    }

    function register(modalOrSelector, closeHandler) {
        const modal = resolveModal(modalOrSelector);

        if (!modal) {
            console.warn(
                '[ModalManager] Không tìm thấy modal để đăng ký cleanup:',
                modalOrSelector
            );
            return function noop() {};
        }

        if (typeof closeHandler !== 'function') {
            throw new TypeError(
                '[ModalManager] closeHandler phải là function.'
            );
        }

        cleanupHandlers.set(modal, closeHandler);

        return function unregisterRegisteredModal() {
            if (cleanupHandlers.get(modal) === closeHandler) {
                cleanupHandlers.delete(modal);
            }
        };
    }

    function unregister(modalOrSelector) {
        const modal = resolveModal(modalOrSelector);
        if (!modal) return false;

        return cleanupHandlers.delete(modal);
    }

    function findCloseButton(modal) {
        return (
            modal.querySelector('[data-modal-close]') ||
            modal.querySelector('.close-btn') ||
            modal.querySelector('.btn-cancel')
        );
    }

    async function requestClose(modalOrSelector, options = {}) {
        const modal = resolveModal(modalOrSelector);
        if (!modal) return false;

        if (closingModals.has(modal)) {
            return false;
        }

        closingModals.add(modal);

        const reason =
            String(options.reason || 'request');

        const sourceEvent =
            options.sourceEvent || null;

        try {
            // 1. Module có đăng ký lifecycle cleanup riêng.
            const closeHandler =
                cleanupHandlers.get(modal);

            if (typeof closeHandler === 'function') {
                const result =
                    await closeHandler({
                        modal,
                        reason,
                        sourceEvent
                    });

                // false nghĩa là module chủ động từ chối đóng.
                return result !== false;
            }

            // 2. Cho module tự bắt event và preventDefault()
            //    nếu nó muốn xử lý cleanup/đóng theo cách riêng.
            const closeRequestEvent =
                new CustomEvent(
                    'app:modal-close-request',
                    {
                        bubbles: false,
                        cancelable: true,
                        detail: {
                            modal,
                            reason,
                            sourceEvent
                        }
                    }
                );

            const shouldContinueFallback =
                modal.dispatchEvent(
                    closeRequestEvent
                );

            if (!shouldContinueFallback) {
                return true;
            }

            // 3. Giữ tương thích modal cũ:
            //    click nút đóng để module tự chạy cleanup hiện có.
            const closeBtn =
                findCloseButton(modal);

            if (closeBtn) {
                closeBtn.click();
                return true;
            }

            // 4. Không còn force-hide.
            //    Nếu không có lifecycle hoặc nút đóng an toàn,
            //    giữ nguyên modal để tránh timer/observer/audio/canvas chạy ngầm.
            console.warn(
                '[ModalManager] Bỏ qua force-hide vì modal không có cơ chế cleanup an toàn:',
                modal.id || modal.className || modal
            );

            return false;
        } catch (error) {
            console.error(
                '[ModalManager] Lỗi khi đóng modal:',
                error
            );

            return false;
        } finally {
            closingModals.delete(modal);
        }
    }

    return Object.freeze({
        register,
        unregister,
        requestClose
    });
})();

// Lắng nghe click vào chính lớp overlay.
// Modal có close button vẫn hoạt động như trước;
// modal đặc biệt có thể đăng ký cleanup qua ModalManager/custom event.
document.addEventListener('click', function (event) {
    const target = event.target;

    if (!(target instanceof Element)) {
        return;
    }

    const isModalOverlay =
        target.classList.contains('modal-overlay') ||
        target.classList.contains('student-modal-overlay');

    if (!isModalOverlay) {
        return;
    }

    window.ModalManager
        .requestClose(
            target,
            {
                reason: 'backdrop',
                sourceEvent: event
            }
        )
        .catch(error => {
            console.error(
                '[ModalManager] Không thể xử lý yêu cầu đóng modal:',
                error
            );
        });
});

// === HỆ THỐNG AUTO-SAVE DỮ LIỆU NHÁP ===

/**
 * Hàm thiết lập tự động lưu nháp cho một ô nhập liệu (input/textarea)
 * @param {HTMLElement} inputElement - Thẻ input hoặc textarea cần lưu nháp
 * @param {string} storageKey - Khóa lưu trữ duy nhất trong window.TestBrowserStorage.localStorage (VD: 'draft_teacher_assign')
 */
window.setupAutoSave = function (inputElement, storageKey) {
    if (!inputElement) return;

    // 1. Phục hồi dữ liệu nếu có bản nháp từ trước
    const savedDraft = window.TestBrowserStorage.localStorage.getItem(storageKey);
    if (savedDraft) {
        inputElement.value = savedDraft;
        // Kích hoạt sự kiện input để các thư viện UI (nếu có) tự cập nhật chiều cao, style...
        inputElement.dispatchEvent(new Event('input'));
    }

    // 2. Hàm delay (debounce) tích hợp sẵn để chống lưu liên tục gây giật lag
    let timeout;
    const saveToLocal = function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            window.TestBrowserStorage.localStorage.setItem(storageKey, inputElement.value);
        }, 1000); // Đợi người dùng ngừng gõ 1 giây mới tiến hành lưu
    };

    // 3. Lắng nghe sự kiện gõ phím
    inputElement.addEventListener('input', saveToLocal);
};

/**
 * Hàm xóa bản nháp (gọi hàm này SAU KHI người dùng đã nộp bài/lưu bài thành công)
 */
window.clearAutoSave = function (storageKey) {
    window.TestBrowserStorage.localStorage.removeItem(storageKey);
};

// ==============================================================
// BỘ XEM TRỰC TIẾP TỆP/LINK TRÊN WEB (ẢNH, PDF, DOCX, URL)
// ==============================================================
(function () {
    const registry =
        window.__filePreviewRegistry =
        window.__filePreviewRegistry || {};

    let previewCounter = 0;
    let previewGeneration = 0;
    let previewPendingKey = null;
    // Only retain in-flight document work. Large/private documents are not cached on disk.
    const docxWork = new Map();
    function loadDocx(item) {
        if (docxWork.has(item.url)) return docxWork.get(item.url);
        const work = (async () => {
            let buffer;
            if (item.url.startsWith('data:')) buffer = dataUrlToArrayBuffer(item.url);
            else {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);
                try {
                    const response = await fetch(item.url, {signal: controller.signal});
                    if (!response.ok) throw Error('Không tải được DOCX');
                    buffer = await response.arrayBuffer();
                } finally { clearTimeout(timeout); }
            }
            return window.mammoth.convertToHtml({arrayBuffer: buffer});
        })();
        docxWork.set(item.url, work);
        work.then(() => docxWork.delete(item.url), () => docxWork.delete(item.url));
        return work;
    }

    // Chống chèn mã HTML vào giao diện
    function escapeHTML(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Chuẩn hóa và kiểm tra URL
    function normalizeUrl(url) {
        const value = String(url || '').trim();

        if (
            !value ||
            /^(javascript|vbscript|file):/i.test(value)
        ) {
            return '';
        }

        // Chỉ chấp nhận các Data URL an toàn cần dùng
        if (/^data:/i.test(value)) {
            const safeData =
                /^data:(image\/|application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)/i.test(
                    value
                );

            return safeData ? value : '';
        }

        if (
            /^(blob:|https?:\/\/|\/|\.\.?\/)/i.test(value)
        ) {
            return value;
        }

        // Tự thêm https:// khi người dùng nhập www...
        if (
            /^www\./i.test(value) ||
            /^[a-z0-9.-]+\.[a-z]{2,}(?:[\/:?#]|$)/i.test(
                value
            )
        ) {
            return 'https://' + value;
        }

        return value;
    }

    // Lấy phần mở rộng của tên file hoặc URL
    function getExtension(nameOrUrl) {
        const clean = String(nameOrUrl || '')
            .split('#')[0]
            .split('?')[0];

        const match = clean.match(/\.([a-z0-9]{1,8})$/i);

        return match ? match[1].toLowerCase() : '';
    }

    // Nhận diện file là ảnh, PDF, DOCX, DOC hay link web
    function inferKind(item) {
        const url = item.url || '';
        const type = String(item.type || '').toLowerCase();
        const ext = getExtension(item.name || url);

        const dataMime = url.startsWith('data:')
            ? (
                url.slice(5).split(';')[0] || ''
            ).toLowerCase()
            : '';

        const mime = type || dataMime;

        if (
            mime.startsWith('image/') ||
            [
                'png',
                'jpg',
                'jpeg',
                'gif',
                'webp',
                'bmp',
                'svg',
                'avif'
            ].includes(ext)
        ) {
            return 'image';
        }

        if (
            mime === 'application/pdf' ||
            ext === 'pdf'
        ) {
            return 'pdf';
        }

        if (
            mime.includes('wordprocessingml') ||
            ext === 'docx'
        ) {
            return 'docx';
        }

        if (
            mime === 'application/msword' ||
            ext === 'doc'
        ) {
            return 'doc';
        }

        return 'web';
    }

    // Chuyển một số link Google thành link có thể xem trong iframe
    function toEmbeddableUrl(url) {
        let value = normalizeUrl(url);

        if (!value) {
            return '';
        }

        try {
            const parsed = new URL(
                value,
                window.location.href
            );

            const host = parsed.hostname.toLowerCase();

            // Google Drive
            if (host.includes('drive.google.com')) {
                const fileMatch =
                    parsed.pathname.match(
                        /\/file\/d\/([^/]+)/
                    );

                if (fileMatch) {
                    return (
                        'https://drive.google.com/file/d/' +
                        fileMatch[1] +
                        '/preview'
                    );
                }
            }

            // Google Docs, Sheets, Slides
            if (host.includes('docs.google.com')) {
                const docsMatch =
                    parsed.pathname.match(
                        /\/(document|spreadsheets|presentation)\/d\/([^/]+)/
                    );

                if (docsMatch) {
                    return (
                        'https://docs.google.com/' +
                        docsMatch[1] +
                        '/d/' +
                        docsMatch[2] +
                        '/preview'
                    );
                }
            }

            return parsed.href;
        } catch (error) {
            return value;
        }
    }

    // Chuyển DOCX dạng Base64 thành ArrayBuffer cho Mammoth
    function dataUrlToArrayBuffer(dataUrl) {
        const parts = String(dataUrl).split(',');

        if (parts.length < 2) {
            throw new Error(
                'Dữ liệu DOCX không hợp lệ.'
            );
        }

        const meta = parts[0];
        const body = parts.slice(1).join(',');

        const binary = meta.includes(';base64')
            ? atob(body)
            : decodeURIComponent(body);

        const bytes = new Uint8Array(binary.length);

        for (
            let index = 0;
            index < binary.length;
            index++
        ) {
            bytes[index] =
                binary.charCodeAt(index);
        }

        return bytes.buffer;
    }

    // Loại bỏ các nội dung nguy hiểm trong HTML do Mammoth tạo
    function sanitizeMammothHTML(html) {
        const doc = new DOMParser().parseFromString(
            `<div>${html || ''}</div>`,
            'text/html'
        );

        doc.querySelectorAll(
            'script, iframe, object, embed, style, link, meta'
        ).forEach(element => {
            element.remove();
        });

        doc.querySelectorAll('*').forEach(element => {
            [...element.attributes].forEach(attribute => {
                const name =
                    attribute.name.toLowerCase();

                const value =
                    String(attribute.value || '')
                        .trim()
                        .toLowerCase();

                if (
                    name.startsWith('on') ||
                    (
                        (
                            name === 'href' ||
                            name === 'src'
                        ) &&
                        value.startsWith('javascript:')
                    )
                ) {
                    element.removeAttribute(
                        attribute.name
                    );
                }
            });
        });

        return doc.body.firstElementChild
            ? doc.body.firstElementChild.innerHTML
            : '';
    }

    // Tạo cửa sổ xem file nếu chưa tồn tại
    function ensureModal() {
        let modal = document.getElementById(
            'universalFilePreviewModal'
        );

        if (modal) {
            return modal;
        }

        modal = document.createElement('div');

        modal.id = 'universalFilePreviewModal';

        modal.className =
            'modal-overlay universal-preview-overlay';

        modal.innerHTML = `
            <div
                class="universal-preview-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="universalPreviewTitle"
            >
                <div class="universal-preview-header">
                    <div>
                        <p class="universal-preview-kicker">
                            XEM TRỰC TIẾP TRÊN WEB
                        </p>

                        <h3 id="universalPreviewTitle">
                            Tài liệu
                        </h3>
                    </div>

                    <button
                        type="button"
                        class="close-btn universal-preview-close"
                        onclick="closeFilePreview()"
                        aria-label="Đóng"
                    >
                        ✖
                    </button>
                </div>

                <div class="universal-preview-actions">
                    <button
                        type="button"
                        id="universalPreviewOpenTab"
                        class="preview-action-btn"
                        onclick="openPreviewSourceInNewTab()"
                    >
                        ↗ Mở tab mới
                    </button>

                    <a
                        id="universalPreviewDownload"
                        class="preview-action-btn preview-download-btn"
                        href="#"
                        download
                        style="display:none;"
                    >
                        ⬇ Tải xuống
                    </a>
                </div>

                <div
                    id="universalPreviewNotice"
                    class="universal-preview-notice"
                    style="display:none;"
                ></div>

                <div
                    id="universalPreviewBody"
                    class="universal-preview-body"
                ></div>
            </div>
        `;

        document.body.appendChild(modal);

        return modal;
    }

    // Hiển thị trạng thái đang tải
    function showLoading(text) {
        const body = document.getElementById(
            'universalPreviewBody'
        );

        if (!body) {
            return;
        }

        body.innerHTML = `
            <div class="preview-loading">
                <span class="preview-spinner"></span>

                <p>
                    ${escapeHTML(
            text ||
            'Đang mở tài liệu...'
        )}
                </p>
            </div>
        `;
    }

    // Hiện thông báo phía trên khung xem
    function showNotice(message) {
        const notice = document.getElementById(
            'universalPreviewNotice'
        );

        if (!notice) {
            return;
        }

        notice.textContent = message || '';

        notice.style.display = message
            ? 'block'
            : 'none';
    }

    // Tạo iframe dùng xem PDF, link web, Google Drive...
    function createIframe(
        url,
        title,
        sandboxed
    ) {
        const iframe =
            document.createElement('iframe');

        iframe.className =
            'universal-preview-frame';

        iframe.title =
            title || 'Xem tài liệu';

        iframe.src = url;

        iframe.referrerPolicy =
            'no-referrer-when-downgrade';

        iframe.allow =
            'fullscreen; clipboard-read; clipboard-write';

        if (sandboxed) {
            iframe.setAttribute(
                'sandbox',
                [
                    'allow-scripts',
                    'allow-same-origin',
                    'allow-forms',
                    'allow-popups',
                    'allow-downloads'
                ].join(' ')
            );
        }

        return iframe;
    }

    /**
     * Tạo HTML nút xem file.
     *
     * source có thể là:
     * - Chuỗi URL
     * - Object: { name, type, base64 }
     * - Object: { name, type, url }
     */
    window.buildFilePreviewHTML = function (
        source,
        label,
        options
    ) {
        options = options || {};

        const raw =
            typeof source === 'string'
                ? { url: source }
                : (source || {});

        const url = normalizeUrl(
            raw.url ||
            raw.base64 ||
            raw.href ||
            ''
        );

        if (!url) {
            return '';
        }

        const name =
            raw.name ||
            options.name ||
            (
                typeof source === 'string'
                    ? source
                    : 'Tài liệu'
            );

        const key =
            `preview_${Date.now()}_${++previewCounter}`;

        registry[key] = {
            url: url,
            name: name,
            type: raw.type || '',
            label: label || 'Tài liệu',

            allowDownload:
                options.allowDownload !== false,

            sourceIsLink:
                typeof source === 'string' ||
                (
                    Boolean(raw.url) &&
                    !raw.base64
                )
        };

        const tone = options.tone
            ? (
                ' preview-file-card--' +
                escapeHTML(options.tone)
            )
            : '';

        return `
            <div class="preview-file-card${tone}">
                <div class="preview-file-info">
                    <strong>
                        ${escapeHTML(
            label ||
            '📎 Tài liệu'
        )}
                    </strong>

                    <span title="${escapeHTML(name)}">
                        ${escapeHTML(name)}
                    </span>
                </div>

                <div class="preview-file-buttons">
                    <button
                        type="button"
                        class="preview-inline-btn"
                        onclick="
                            event.stopPropagation();
                            openFilePreview('${key}');
                        "
                    >
                        👁 Xem trực tiếp
                    </button>

                    <button
                        type="button"
                        class="
                            preview-inline-btn
                            preview-inline-btn-secondary
                        "
                        onclick="
                            event.stopPropagation();
                            openPreviewSourceInNewTab('${key}');
                        "
                    >
                        ↗ Mở tab mới
                    </button>
                </div>
            </div>
        `;
    };

    // Mở cửa sổ xem trực tiếp
    window.openFilePreview = async function (
        key
    ) {
        const item = registry[key];

        if (!item) {
            (await AppDialog.alert(
                'Không tìm thấy dữ liệu tài liệu để mở.'
            ));

            return;
        }

        if (previewPendingKey === key) return;
        const generation = ++previewGeneration;
        previewPendingKey = key;
        const modal = ensureModal();

        window.__activePreviewKey = key;

        modal.classList.add('active');

        document.body.classList.add(
            'preview-modal-open'
        );

        const title =
            document.getElementById(
                'universalPreviewTitle'
            );

        const body =
            document.getElementById(
                'universalPreviewBody'
            );

        const download =
            document.getElementById(
                'universalPreviewDownload'
            );

        if (title) {
            title.textContent =
                item.name ||
                item.label ||
                'Tài liệu';
        }

        if (body) {
            body.innerHTML = '';
        }

        showNotice('');
        showLoading('Đang chuẩn bị nội dung...');

        if (download) {
            const isDownloadableData =
                /^(data:|blob:)/i.test(
                    item.url
                );

            download.style.display =
                item.allowDownload &&
                    isDownloadableData
                    ? 'inline-flex'
                    : 'none';

            download.href = item.url;

            download.download =
                item.name || 'tai-lieu';
        }

        const kind = inferKind(item);

        try {
            body.innerHTML = '';

            // Xem ảnh
            if (kind === 'image') {
                const wrap =
                    document.createElement('div');

                wrap.className =
                    'universal-image-wrap';

                const image =
                    document.createElement('img');

                image.src = item.url;

                image.alt =
                    item.name ||
                    'Ảnh tài liệu';

                image.className =
                    'universal-preview-image';

                wrap.appendChild(image);
                body.appendChild(wrap);

                return;
            }

            // Xem PDF
            if (kind === 'pdf') {
                body.appendChild(
                    createIframe(
                        item.url,
                        item.name,
                        false
                    )
                );

                return;
            }

            // Xem DOCX
            if (kind === 'docx') {
                // Ưu tiên dùng Mammoth.js
                if (window.mammoth) {
                    try {
                        const result = await loadDocx(item);
                        if (generation !== previewGeneration) return;

                        const article =
                            document.createElement(
                                'article'
                            );

                        article.className =
                            'universal-docx-content';

                        article.innerHTML =
                            sanitizeMammothHTML(
                                result.value
                            );

                        body.appendChild(article);

                        if (
                            result.messages &&
                            result.messages.length
                        ) {
                            showNotice(
                                'Một số định dạng phức tạp trong DOCX có thể hiển thị khác so với Microsoft Word.'
                            );
                        }

                        return;
                    } catch (docxError) {
                        if (generation !== previewGeneration) return;
                        console.warn(
                            'Không thể đọc DOCX trực tiếp bằng Mammoth:',
                            docxError
                        );
                    }
                }

                // Nếu Mammoth không đọc được và DOCX là URL công khai
                if (
                    /^https?:\/\//i.test(
                        item.url
                    )
                ) {
                    const officeUrl =
                        'https://view.officeapps.live.com/op/embed.aspx?src=' +
                        encodeURIComponent(
                            item.url
                        );

                    showNotice(
                        'Đang dùng Microsoft Office Online để xem DOCX. Link phải được chia sẻ công khai.'
                    );

                    body.appendChild(
                        createIframe(
                            officeUrl,
                            item.name,
                            false
                        )
                    );
                } else {
                    showNotice(
                        'Trình duyệt chưa thể đọc DOCX này trực tiếp. Hãy dùng nút “Mở tab mới” hoặc “Tải xuống”.'
                    );

                    body.innerHTML = `
                        <div class="preview-empty-state">
                            Không thể hiển thị DOCX
                            trong khung xem.
                        </div>
                    `;
                }

                return;
            }

            // Xem định dạng Word .doc cũ
            if (kind === 'doc') {
                if (
                    /^https?:\/\//i.test(
                        item.url
                    )
                ) {
                    const officeUrl =
                        'https://view.officeapps.live.com/op/embed.aspx?src=' +
                        encodeURIComponent(
                            item.url
                        );

                    showNotice(
                        'Đang dùng Microsoft Office Online để xem tệp Word. Link phải được chia sẻ công khai.'
                    );

                    body.appendChild(
                        createIframe(
                            officeUrl,
                            item.name,
                            false
                        )
                    );
                } else {
                    showNotice(
                        'Tệp .doc cũ không thể đọc trực tiếp từ dữ liệu nội bộ. Vui lòng tải xuống.'
                    );

                    body.innerHTML = `
                        <div class="preview-empty-state">
                            Không thể hiển thị
                            tệp .doc cũ.
                        </div>
                    `;
                }

                return;
            }

            // Xem link trang web, Google Drive, Google Docs...
            const embedUrl =
                toEmbeddableUrl(item.url);

            showNotice(
                'Nếu trang nguồn chặn nhúng, hãy bấm “Mở tab mới” ở phía trên.'
            );

            body.appendChild(
                createIframe(
                    embedUrl,
                    item.name,
                    true
                )
            );
        } catch (error) {
            console.error(
                'Lỗi xem trực tiếp tài liệu:',
                error
            );

            showNotice(
                'Không thể hiển thị tài liệu trong khung xem. Hãy thử mở ở tab mới.'
            );

            body.innerHTML = `
                <div class="preview-empty-state">
                    Không thể tải nội dung tài liệu.
                </div>
            `;
        } finally {
            if (generation === previewGeneration) previewPendingKey = null;
        }
    };

    // Mở nguồn tài liệu trong tab mới
    window.openPreviewSourceInNewTab =
        function (key) {
            const activeKey =
                key ||
                window.__activePreviewKey;

            const item =
                registry[activeKey];

            if (
                !item ||
                !item.url
            ) {
                return;
            }

            const targetUrl =
                toEmbeddableUrl(item.url);

            const opened =
                window.open(
                    targetUrl,
                    '_blank'
                );

            if (opened) {
                try {
                    opened.opener = null;
                } catch (error) {
                    // Không cần xử lý
                }
            } else {
                AppDialog.notify(
                    'Trình duyệt đang chặn cửa sổ mới. Vui lòng cho phép pop-up cho trang này.'
                );
            }
        };

    // Đóng cửa sổ xem file
    window.closeFilePreview = function () {
        previewGeneration++;
        previewPendingKey = null;
        const modal =
            document.getElementById(
                'universalFilePreviewModal'
            );

        const body =
            document.getElementById(
                'universalPreviewBody'
            );

        if (modal) {
            modal.classList.remove('active');
        }

        if (body) {
            body.innerHTML = '';
        }

        showNotice('');

        document.body.classList.remove(
            'preview-modal-open'
        );

        window.__activePreviewKey = null;
    };

    // Nhấn Escape để đóng cửa sổ xem
    document.addEventListener(
        'keydown',
        function (event) {
            const modal =
                document.getElementById(
                    'universalFilePreviewModal'
                );

            if (
                event.key === 'Escape' &&
                modal &&
                modal.classList.contains(
                    'active'
                )
            ) {
                window.closeFilePreview();
            }
        }
    );
})();
// Security hotfix: distinct encoders for text and inline JavaScript arguments.
window.securityHotfix = Object.freeze({
  inline(value) { return window.escapeHTML(JSON.stringify(String(value ?? ''))); },
  remoteURL(value) {
    try { const url = new URL(String(value)); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
  }
});

// ACCOUNT ACCESS — password first; server grants access only after a saved code or teacher-approved replacement.
(() => {
    'use strict';
    let loginEpoch=0,screenUser=null,screenProfile=null,requestTimer=null,sessionLoginNonce=null;
    let recoveryClientVersion=3;
    function recoveryProtocol(state, required) {
        // Old servers advertise no capability and mint only protocol 2.
        // Their atomic account check still enforces the stored minimum.
        if (!['code_required','enroll','verified'].includes(state?.status)) throw Error('ACCESS_UNAVAILABLE');
        if (required !== null && (!Number.isSafeInteger(required) || required < 0)) throw Error('ACCESS_UNAVAILABLE');
        if (required > 3) throw Error('CLIENT_UPDATE_REQUIRED');
        if (state.supportedSessionProtocol === undefined) return required >= 3 ? 3 : 2;
        if (state.supportedSessionProtocol === 3) return 3;
        throw Error('ACCESS_UNAVAILABLE');
    }
    const project=()=>firebase.app().options.projectId;
    const uid=()=>firebase.auth().currentUser?.uid;
    const messages={ACCESS_UNAVAILABLE:'Chưa kết nối được máy chủ tài khoản. Hãy thử lại sau.',ACCESS_NOT_ENABLED:'Chức năng chưa được bật trên máy chủ.',ACCESS_PROJECT_MISMATCH:'Máy chủ tài khoản chưa đúng dự án Firebase.',RECOVERY_INVALID:'Mã khôi phục không đúng. Kiểm tra mã rồi thử lại.',PASSWORD_LOGIN_REQUIRED:'Hãy nhập lại tài khoản và mật khẩu để tiếp tục.',DEVICE_VERIFICATION_REQUIRED:'Cần xác nhận mã thiết bị trước khi vào website.',APPROVAL_REQUIRED:'Yêu cầu chưa được giáo viên đồng ý hoặc đã hết hạn.',REQUEST_EXPIRED:'Yêu cầu đã hết hạn. Hãy gửi lại yêu cầu.',REQUEST_ALREADY_PENDING:'Đã có yêu cầu đang chờ. Hãy báo giáo viên kèm tên tài khoản của bạn.',REQUEST_ALREADY_REVIEWED:'Yêu cầu đã được xử lý ở phiên khác. Hãy cập nhật lại danh sách.',REQUEST_USED:'Yêu cầu này đã được dùng với thông tin khác.',ACCESS_CHANGED:'Thông tin xác thực đã thay đổi. Hãy đăng nhập lại.',ACCESS_RATE_LIMIT:'Đã thử quá nhiều lần. Vui lòng đợi rồi thử lại.',WEAK_PASSWORD:'Mật khẩu cần 8–128 ký tự, có chữ và số, khác tên đăng nhập.',ACCOUNT_NOT_ALLOWED:'Tài khoản không còn hoạt động hoặc đang bị khóa.'};
    messages.READ_ONLY_SESSION='Phiên này chỉ được xem. Đăng xuất rồi đăng nhập lại sau khi phiên số 1 kết thúc để được xét quyền thao tác.';
    Object.assign(messages,{SESSION_SERVER_NOT_READY:'Máy chủ chưa xác nhận Rules cho quản lý thiết bị mới. Chưa kích hoạt tài khoản.',SERVER_MONEY_NOT_READY:'Máy chủ giao dịch chưa sẵn sàng để bật quản lý thiết bị mới.',SESSION_EXAM_ACTIVE:'Đang có bài thi chưa kết thúc. Hoàn tất hoặc đối soát bài thi trước khi bật cơ chế mới.',SESSION_PENDING_OPERATIONS:'Còn thao tác đang chờ xác nhận. Hãy đối soát trước khi chuyển quyền.',SESSION_TRANSITION_BUSY:'Đang xác nhận chuyển quyền. Vui lòng kiểm tra lại trạng thái.'});
    messages.ACCESS_SESSION_LIMIT='Đã có 20 phiên còn hiệu lực. Hãy đăng xuất bớt phiên trước khi đăng nhập tiếp.';
    messages.ACCESS_BUSY='Yêu cầu đang được xử lý. Chờ khoảng một phút rồi thử lại với cùng thông tin.';
    messages.CLIENT_UPDATE_REQUIRED='Tài khoản đã dùng cơ chế bảo vệ mới. Hãy tải lại website bằng Ctrl+F5 rồi đăng nhập lại; không thể tiếp tục bằng bản cũ.';
    Object.assign(messages,{
        ACCESS_SECRET_MISSING:'Worker chưa có khóa FIREBASE_SERVICE_ACCOUNT. Cần thêm khóa của đúng dự án Firebase.',
        ACCESS_SECRET_INVALID:'Khóa Firebase trên Worker không phải JSON hợp lệ hoặc thiếu thông tin. Cần nhập lại toàn bộ file khóa.',
        ACCESS_SECRET_PROJECT:'Khóa trên Worker phải thuộc dự án web-chan-doan-test.',
        ACCESS_SECRET_KEY:'Khóa riêng Firebase trên Worker bị thiếu hoặc hỏng. Cần nhập lại file khóa đầy đủ.',
        ACCESS_GOOGLE_CONNECTION:'Worker chưa kết nối được máy chủ xác thực Google. Hãy thử lại sau.',
        ACCESS_GOOGLE_AUTH:'Google từ chối khóa Firebase của Worker. Cần kiểm tra khóa còn hiệu lực và đúng dự án.',
        ACCESS_DATABASE_CONNECTION:'Worker chưa kết nối được Firebase Database. Cần kiểm tra địa chỉ Database và kết nối.',
        ACCESS_DATABASE_PERMISSION:'Firebase từ chối quyền của Worker. Cần kiểm tra service account và Database đúng dự án.',
        ACCESS_DATABASE_RESPONSE:'Firebase Database trả lỗi cho Worker. Cần kiểm tra cấu hình và nhật ký Worker.'
    });
    const message=error=>messages[error?.message] || 'Chưa xác nhận được thao tác. Kiểm tra kết nối và thử lại.';
    function enabled() {
        // The per-account latch is authoritative even if the global switch is off.
        return Promise.all([
            firebase.database().ref('account_access_config/enabled').once('value'),
            uid() ? firebase.database().ref('account_access_accounts/'+uid()+'/requiredClientVersion').once('value') : null
        ]).then(([config, required]) => config.val() === true || Number(required?.val()) >= 2);
    }
    function endpoint() {
        const configured=window.ACCOUNT_ACCESS_WORKERS?.[project()];
        const known={'web-chan-doan-test':'https://school-account-access-test.ngogibao0311.workers.dev'};
        const url=new URL(configured || known[project()] || 'https://invalid.local');
        if(url.protocol!=='https:' || (url.hostname==='invalid.local' || url.hostname.endsWith('.invalid')))throw Error('ACCESS_PROJECT_MISMATCH');
        return url.href.replace(/\/$/,'')+'/account-access';
    }
    async function call(action,input={},anonymous=false) {
        const task = () => callCore(action,input,anonymous);
        return window.ServerActivity ? window.ServerActivity.account(action,task) : task();
    }
    async function callCore(action,input={},anonymous=false) {
        if (window.testPageAuthBlocked) throw Error('ACCESS_CHANGED');
        if (['verify','enroll','reset_device'].includes(action)) {
            sessionLoginNonce ||= secret();
            input = {...input, clientVersion: recoveryClientVersion, loginNonce: sessionLoginNonce};
        }
        const current=firebase.auth().currentUser;
        const headers={'Content-Type':'application/json'};
        if(!anonymous && current) {
            const token = await current.getIdToken();
            headers.Authorization='Bearer '+token;
            if (action === 'state' && input.tab) unloadToken = token;
        }
        const response=await fetch(endpoint(),{method:'POST',headers,body:JSON.stringify({action,projectId:project(),clientVersion:3,...input}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(20000)});
        let value;try{value=await response.json();}catch(_){throw Error('ACCESS_UNAVAILABLE');}
        if(!response.ok || !value.ok)throw Error(value.error || 'ACCESS_UNAVAILABLE');
        if(window.testPageAuthBlocked || (!anonymous && uid()!==current?.uid))throw Error('ACCESS_CHANGED');
        return value;
    }
    function secret() {return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
    function code() {return 'REC-'+crypto.randomUUID().replace(/-/g,'').toUpperCase();}
    function ticketKey(kind,username) {return `accountRecovery:v1:${project()}:${kind}:${username}`;}
    const requestTickets = new Map();
    const validTicket = value => /^[0-9a-f]{64}$/.test(value || '');
    function rememberTicket(kind,username,token) {
        const key=ticketKey(kind,username);requestTickets.set(key,token);
        // Keep the request proof across tab closure. It grants nothing without
        // a password login and a still-valid teacher approval on the server.
        for(const store of ['localStorage','sessionStorage']) {
            try{window.TestBrowserStorage[store].setItem(key,token);}catch(_){}
        }
        return token;
    }
    function readTicket(kind,username) {
        const key=ticketKey(kind,username);
        for(const store of ['localStorage','sessionStorage']) {
            try {
                const token=window.TestBrowserStorage[store].getItem(key);
                if(validTicket(token))return rememberTicket(kind,username,token);
            }catch(_){}
        }
        return requestTickets.get(key) || null;
    }
    function clearTicket(kind,username,token) {
        const key=ticketKey(kind,username);
        if(requestTickets.get(key)===token)requestTickets.delete(key);
        for(const store of ['localStorage','sessionStorage']) {
            try{if(window.TestBrowserStorage[store].getItem(key)===token)window.TestBrowserStorage[store].removeItem(key);}catch(_){}
        }
    }
    function savedTicket(kind,username) {
        return readTicket(kind,username) || rememberTicket(kind,username,secret());
    }
    function panel(title,description) {
        clearTimeout(requestTimer);requestTimer=null;
        const root=document.querySelector('.login-container');if(!root)throw Error('LOGIN_PAGE_REQUIRED');
        root.querySelector('.login-heading').hidden=true;document.getElementById('loginForm').hidden=true;
        document.getElementById('forgotPasswordButton').hidden=true;document.getElementById('errorMsg').textContent='';
        let box=document.getElementById('studentAccessStep');if(!box){box=document.createElement('section');box.id='studentAccessStep';root.insertBefore(box,root.querySelector('.login-help-note'));}
        box.replaceChildren();box.hidden=false;
        const eyebrow=document.createElement('p');eyebrow.className='access-eyebrow';eyebrow.textContent='BẢO VỆ TÀI KHOẢN';
        const h=document.createElement('h2');h.textContent=title;h.tabIndex=-1;
        const p=document.createElement('p');p.textContent=description;
        const body=document.createElement('div');body.className='access-step-body';
        const status=document.createElement('p');status.className='access-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
        const back=document.createElement('button');back.type='button';back.className='access-link';back.textContent='← Quay lại đăng nhập';
        back.addEventListener('click',()=>{void resetLogin();});box.append(eyebrow,h,p,body,status,back);h.focus();return {body,status};
    }
    function button(text,handler,secondary=false) {
        const el=document.createElement('button');el.type='button';el.textContent=text;el.className=secondary?'access-secondary':'access-primary';el.addEventListener('click',handler);return el;
    }
    async function resetLogin() {
        loginEpoch++;clearTimeout(requestTimer);requestTimer=null;screenUser=null;screenProfile=null;
        await firebase.auth().signOut();
        const box=document.getElementById('studentAccessStep');if(box)box.hidden=true;
        document.querySelector('.login-heading').hidden=false;document.getElementById('loginForm').hidden=false;document.getElementById('forgotPasswordButton').hidden=false;
        document.getElementById('password').value='';document.getElementById('username').focus();
    }
    async function accept(result,epoch) {
        if(epoch!==loginEpoch || uid()!==screenUser?.uid)return;
        if(!result.customToken || !result.deviceId)throw Error('ACCESS_UNAVAILABLE');
        const expected=screenUser.uid;
        const credential=await firebase.auth().signInWithCustomToken(result.customToken);
        if(epoch!==loginEpoch || credential.user.uid!==expected){await firebase.auth().signOut();return;}
        await window.StudentConnectionInfo.linkDevice(result.deviceId);
        window.TestBrowserStorage.localStorage.setItem('currentUser',JSON.stringify(Object.fromEntries(Object.entries({...screenProfile,_fbKey:expected}).filter(([k])=>!['password','newPass','oldPass'].includes(k)))));
        window.location.href='student.html';
    }
    async function showCreate(action,ticket) {
        const epoch=loginEpoch;
        const {body,status}=panel(action==='reset_device'?'Tạo mã khôi phục mới':'Lưu mã khôi phục của bạn',action==='reset_device'?'Giáo viên đã đồng ý. Mã cũ đã bị vô hiệu hóa. Hoàn tất bước này để vào website.':'Đây là mã dùng sau khi đăng nhập bằng tài khoản và mật khẩu. Hãy cất mã ở nơi riêng.');
        const fresh=code(),device=(await window.StudentConnectionInfo.ensureDevice()).id;if(epoch!==loginEpoch)return;
        const output=document.createElement('code');output.textContent=fresh;
        const copy=button('Sao chép mã',async()=>{try{await navigator.clipboard.writeText(fresh);status.textContent='Đã sao chép. Hãy cất mã trước khi tiếp tục.';}catch(_){status.textContent='Hãy chọn mã và nhấn Ctrl+C hoặc nhấn giữ để sao chép.';}},true);
        const label=document.createElement('label');label.className='access-confirm';const check=document.createElement('input');check.type='checkbox';label.append(check,document.createTextNode('Tôi đã cất mã khôi phục'));
        const next=button('Lưu mã và vào website',async()=>{
            next.disabled=true;status.textContent='Đang lưu mã…';
            try{await accept(await call(action,{code:fresh,deviceId:device,secret:ticket}),epoch);}catch(error){if(epoch===loginEpoch){status.textContent=message(error);next.disabled=!check.checked;}}
        });next.disabled=true;check.addEventListener('change',()=>next.disabled=!check.checked);
        body.append(output,copy,label,next);
    }
    async function waitRequest(kind,username,token) {
        const epoch=loginEpoch,{body,status}=panel(kind==='device'?'Chờ giáo viên duyệt':'Đã báo quên mật khẩu',kind==='device'?'Giáo viên cần đồng ý trước khi bạn tạo lại mã. Giữ trang này để nhận kết quả.':'Yêu cầu này chỉ báo cho giáo viên. Giáo viên sẽ đổi mật khẩu và gửi lại cho bạn qua kênh liên hệ đang dùng.');
        const reference=document.createElement('p');reference.className='access-reference';body.append(reference);
        let busy=false;
        const check=button('Kiểm tra kết quả',()=>{void poll();},true);body.append(check);
        async function poll(){
            if(busy || epoch!==loginEpoch)return;busy=true;check.disabled=true;clearTimeout(requestTimer);
            try{
                const result=await call('request_status',{kind,username,secret:token},true);if(epoch!==loginEpoch)return;
                reference.textContent=result.id?'Mã yêu cầu: '+result.id:'';
                if(result.status==='approved' && kind==='device'){await showCreate('reset_device',token);return;}
                if(['rejected','unavailable','consumed','resolved'].includes(result.status)){
                    const terminalMessages = {
                        resolved: 'Bạn đã đăng nhập bằng mã khôi phục. Yêu cầu hỗ trợ đã tự kết thúc.',
                        rejected: 'Giáo viên đã từ chối yêu cầu. Bạn chưa được cấp quyền vào website.',
                        consumed: kind === 'password'
                            ? 'Giáo viên đã xử lý. Hãy nhận mật khẩu mới từ giáo viên rồi đăng nhập lại.'
                            : 'Yêu cầu đã được dùng để tạo mã mới. Quay lại đăng nhập bằng mã đã lưu.',
                        unavailable: 'Yêu cầu không còn hiệu lực. Quay lại đăng nhập và gửi yêu cầu mới nếu cần.'
                    };
                    status.textContent = terminalMessages[result.status];
                    clearTicket(kind,username,token);
                    return;
                }
                status.textContent='Đang chờ giáo viên xử lý…';
                requestTimer=setTimeout(()=>{if(document.visibilityState==='visible')void poll();else requestTimer=setTimeout(()=>void poll(),12000);},12000);
            }catch(error){if(epoch===loginEpoch)status.textContent=message(error);}
            finally{busy=false;check.disabled=false;}
        }
        await poll();
    }
    async function login(authUser,profile) {
        if(!(await enabled()))return true;
        screenUser=authUser;screenProfile=profile;sessionLoginNonce=secret();const epoch=++loginEpoch;
        const state=await call('state');if(epoch!==loginEpoch)return false;
        const required=(await firebase.database().ref('account_access_accounts/'+authUser.uid+'/requiredClientVersion').once('value')).val();
        if(epoch!==loginEpoch)return false;
        recoveryClientVersion=recoveryProtocol(state,required);
        const ticket=readTicket('device',profile.username);
        let pendingRequest=false,requestNotice='';
        if(ticket) {
            const request=await call('request_status',{kind:'device',username:profile.username,secret:ticket},true);
            if(epoch!==loginEpoch)return false;
            if(request.status==='approved') {await showCreate('reset_device',ticket);return false;}
            pendingRequest=request.status==='pending';
            if(['rejected','unavailable','consumed','resolved'].includes(request.status)) {
                clearTicket('device',profile.username,ticket);
                requestNotice={
                    rejected:'Giáo viên đã từ chối yêu cầu quên mã. Hãy nhập mã đã lưu hoặc liên hệ giáo viên.',
                    unavailable:'Yêu cầu trước không còn khả dụng. Hãy kiểm tra ở tab đã gửi yêu cầu hoặc gửi yêu cầu mới nếu đã hết hạn.',
                    consumed:'Yêu cầu đã được dùng để tạo mã mới. Hãy nhập mã mới bạn đã lưu.',
                    resolved:'Yêu cầu hỗ trợ đã kết thúc. Hãy nhập mã đã lưu để đăng nhập.'
                }[request.status];
            }
        }
        if(state.status==='enroll'){await showCreate('enroll');return false;}
        const {body,status}=panel('Khôi phục thiết bị đã lưu','Tài khoản và mật khẩu đã đúng. Nhập mã khôi phục để tiếp tục vào website.');
        const form=document.createElement('form'),label=document.createElement('label'),input=document.createElement('input');
        label.htmlFor='loginRecoveryCode';label.textContent='Mã khôi phục';input.id='loginRecoveryCode';input.type='password';input.autocomplete='off';input.spellcheck=false;input.placeholder='REC-…';input.maxLength=64;input.required=true;
        const next=button('Xác nhận và đăng nhập',()=>{});next.type='submit';
        form.append(label,input,next);form.addEventListener('submit',async event=>{
            event.preventDefault();if(next.disabled)return;next.disabled=true;status.textContent='Đang xác nhận mã…';
            try{await accept(await call('verify',{code:input.value}),epoch);}catch(error){if(epoch===loginEpoch)status.textContent=message(error);}finally{next.disabled=false;}
        });
        const forgot=button(pendingRequest?'Kiểm tra yêu cầu đã gửi':'Quên mã khôi phục',async()=>{
            forgot.disabled=true;const token=savedTicket('device',profile.username);
            try{if(!pendingRequest)await call('request_device',{secret:token});if(epoch===loginEpoch)await waitRequest('device',profile.username,token);}catch(error){if(epoch===loginEpoch)status.textContent=message(error);}finally{forgot.disabled=false;}
        },true);body.append(form,forgot);
        status.textContent=pendingRequest?'Yêu cầu quên mã đang chờ giáo viên duyệt. Nếu đã nhớ lại mã, bạn vẫn có thể nhập để đăng nhập.':requestNotice;
        input.focus();return false;
    }
    async function forgotPassword() {
        const username=document.getElementById('username').value.trim(),error=document.getElementById('errorMsg');
        if(!username){error.textContent='Nhập tên tài khoản để báo giáo viên.';return;}
        const trigger=document.getElementById('forgotPasswordButton');trigger.disabled=true;
        try{
            if(!(await enabled())){error.textContent='Hãy liên hệ giáo viên để được đổi mật khẩu.';return;}
            const token=savedTicket('password',username);await call('request_password',{username,secret:token},true);
            loginEpoch++;await waitRequest('password',username,token);
        }catch(e){error.textContent=message(e);}finally{trigger.disabled=false;}
    }
    let sessionMode = 'checking', sessionRank = null, sessionDeadline = 0;
    let sessionProtocol=0, signalRevision=0, minimumSignalRevision=0;
    const sessionSafeControls=new WeakSet();
    function invalidateSession(revision=0){minimumSignalRevision=Math.max(minimumSignalRevision,Number(revision)||0);sessionMode='checking';sessionDeadline=0;renderSession();}
    // null: chưa xác nhận. false: tài khoản chưa kích hoạt và đang dùng luồng cũ.
    // Một tài khoản đã kích hoạt trên máy chủ không được quay về false.
    let accessEnforced = null;
    let sessionTimer = null, sessionCheck = null, sessionStarted = false, sessionExpiryTimer = null;
    const TAB_ID = crypto.randomUUID();
    let tabSequence = 0, activityRevision = 0, acknowledgedActivity = 0;
    let lastActivity = -Infinity, unloadToken = null, pageClosed = false, forcedLoggingOut = false;
    const POLICY_BUILD = '20261024.session3';
    const policyCodeReady = () => (window.AssetCompatibility?.ready('session') ?? true) && ['html','auth','common','student','loader','economy','devices'].every(
        key => window.SessionPolicyModules?.[key] === POLICY_BUILD);
    function tabPresence(active = false) {
        return {id: TAB_ID, seq: ++tabSequence, visible: document.visibilityState === 'visible', active};
    }
    function handleTabUnload() {
        if (pageClosed || forcedLoggingOut || window.testPageAuthBlocked || !unloadToken) return;
        pageClosed = true;
        // No asynchronous token lookup during unload. Missing delivery is covered by the server lease.
        const body = JSON.stringify({action: 'session_unload', projectId: project(), clientVersion:3, tab: tabPresence(false)});
        void fetch(endpoint(), {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + unloadToken},
            body, keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer'}).catch(() => {});
    }
    function markUserActivity(event) {
        if (!event.isTrusted || document.visibilityState !== 'visible' || pageClosed || forcedLoggingOut) return;
        if (performance.now() - lastActivity < 5000) return;
        lastActivity = performance.now(); activityRevision++;
        void refreshSession().catch(() => {});
    }
    async function triggerForcedLogout(reason) {
        if (window.testPageAuthBlocked) return;
        if (forcedLoggingOut) return;
        forcedLoggingOut = true;
        sessionMode = 'checking'; sessionDeadline = 0; clearInterval(sessionTimer);
        window.cleanupFirebaseListeners?.();
        // The server already rejected this session. Do not wait on another network operation.
        if (reason !== 'session_changed') {
            window.TestBrowserStorage.localStorage.removeItem('currentUser');
            try { await firebase.auth().signOut(); } catch (_) {}
        }
        window.location.replace('index.html?reason=' + encodeURIComponent(reason));
    }
    const readOnlyText = 'Phiên này chỉ xem nội dung và trạng thái. Video, nhận quà và xác nhận đều bị khóa. Quản lý quyền tại mục Thiết bị đang đăng nhập.';
    function canWrite() {
        if (window.testPageAuthBlocked) return false;
        // Cơ chế phiên chưa bật: không có "phiên chính/phụ" để xét, cho thao tác như trước 17/10.
        if (accessEnforced === false) return true;
        return sessionMode === 'primary' && performance.now() < sessionDeadline;
    }
    function notifyReadOnly() {
        if (window.showToast) window.showToast(readOnlyText, 'warning');
        else void window.AppDialog?.alert(readOnlyText);
    }
    function requireWrite() {
        if (canWrite()) return true;
        notifyReadOnly();
        return false;
    }
    function renderSession() {
        if (!sessionStarted) return;
        document.body.classList.toggle('student-view-session', !canWrite());
        let banner = document.getElementById('studentSessionBanner');
        if (!banner) {
            const content = document.querySelector('#studentDashboard > .content');
            if (!content) return;
            banner = document.createElement('aside');
            banner.id = 'studentSessionBanner';
            banner.className = 'ui-theme-immune';
            banner.setAttribute('role', 'status');
            const text = document.createElement('span'); text.dataset.sessionNotice = '';
            const exit = document.createElement('button'); exit.type = 'button'; exit.textContent = 'Đăng xuất';
            exit.addEventListener('click', () => void window.logout());
            banner.append(text, exit);
            // Keep the notice inside the dashboard's natural height. Body padding
            // would create an extra scroll area beyond the sticky sidebar's parent.
            content.insertBefore(banner, content.querySelector('.tab-content'));
        }
        banner.hidden = canWrite() && !banner.closest('.session-devices-popup') && !banner.querySelector('.session-devices-open');
        banner.querySelector('[data-session-notice]').textContent = canWrite()
            ? 'Thiết bị này đang được thao tác.'
            : sessionMode === 'checking'
            ? 'Đang kiểm tra quyền thao tác. Bạn có thể xem nội dung.'
            : `Lần đăng nhập ${sessionRank || 'phụ'} · Chỉ xem: không phát video, nhận quà hoặc xác nhận. Mở Thiết bị đang đăng nhập để xem hoặc xin chuyển quyền.`;
        window.dispatchEvent(new CustomEvent('student-session-mode', {detail: {mode: sessionMode, rank: sessionRank}}));
    }
    function applySession(result) {
        if(Number(result.signalRevision||0)<minimumSignalRevision)throw Error('SESSION_TRANSITION_BUSY');
        sessionProtocol=Number(result.protocol)||0;signalRevision=Number(result.signalRevision)||0;
        sessionMode = result.accessMode === 'primary' ? 'primary' : 'view';
        sessionRank = result.loginRank;
        sessionDeadline = performance.now() + Math.max(0, Number(result.sessionExpiresAt) - Number(result.serverNow));
        clearTimeout(sessionExpiryTimer);
        sessionExpiryTimer = setTimeout(() => { if (!canWrite()) renderSession(); }, Math.max(0, sessionDeadline - performance.now()));
        renderSession();
    }
    async function refreshSession() {
        if (accessEnforced === false) return {status:'legacy'};
        if (sessionCheck) return sessionCheck;
        sessionCheck = (async () => {
            try {
                const revision = activityRevision;
                const result = await call('state', {tab: tabPresence(revision > acknowledgedActivity)});
                if (result.status !== 'verified') throw Error('DEVICE_VERIFICATION_REQUIRED');
                acknowledgedActivity = revision;
                applySession(result);
                return result;
            } catch (error) {
                sessionMode = 'checking'; sessionDeadline = 0; renderSession();
                if (sessionStarted && /^(DEVICE_VERIFICATION_REQUIRED|PASSWORD_LOGIN_REQUIRED|ACCOUNT_NOT_ALLOWED|ACCESS_CHANGED|CLIENT_UPDATE_REQUIRED)$/.test(error.message)) {
                    void triggerForcedLogout(error.message === 'CLIENT_UPDATE_REQUIRED' ? 'update_required' : error.message === 'ACCESS_CHANGED' ? 'session_changed' : 'session_expired');
                }
                throw error;
            } finally { sessionCheck = null; }
        })();
        return sessionCheck;
    }
    function installSessionControls() {
        if (sessionStarted) return;
        sessionStarted = true;
        // Stop local optimistic writes too; Firebase Rules remain the security boundary.
        const proto = Object.getPrototypeOf(firebase.database().ref());
        for (const name of ['set', 'update', 'remove', 'transaction', 'setWithPriority', 'setPriority']) {
            const original = proto[name];
            if (typeof original !== 'function') continue;
            proto[name] = function (...args) {
                if (sessionStarted && !canWrite()) {
                    const error = Object.assign(Error(readOnlyText), {code: 'READ_ONLY_SESSION'});
                    const callback = args[name === 'transaction' ? 1 : name === 'remove' ? 0 : name === 'setWithPriority' ? 2 : 1];
                    if (typeof callback === 'function') queueMicrotask(() => callback(error));
                    const denied = Promise.reject(error); denied.catch(() => {}); return denied;
                }
                return original.apply(this, args);
            };
        }
        // Deny interactions by default. Only these audited view/navigation
        // handlers are allowed; labels such as "Confirm" never grant permission.
        const controlSelector = 'button, a, input, select, textarea, label, summary, iframe, video, audio, object, embed, [role="button"], [onclick], [tabindex], [contenteditable]';
        const viewHandler = /^\s*(?:window\.)?(?:logout|switchTab|toggleSidebar|toggleAccordion|toggleRoadmapView|openStudentInbox|closeStudentInbox|openStudentBag|closeStudentBag|openStudentInfoModal|closeStudentInfoModal|closeBagItemPopup|closeReadOnlyStudentModal)\([^()]*\)\s*;?\s*$/;
        const isViewControl = control => !!control && (
            sessionSafeControls.has(control) || !!control.closest('#studentSessionBanner') ||
            (control.matches('[data-session-view-dismiss]') && control.getRootNode?.().host?.classList.contains('app-dialog-host')) ||
            viewHandler.test(control.getAttribute('onclick') || '')
        );
        const eventTarget = event => event.composedPath?.()[0] || event.target;
        const marked = new Map(), suspendedMedia = new Map(), mediaNotes = new Map();
        function restoreAttribute(element, name, value) {
            if (value === null) element.removeAttribute(name);
            else element.setAttribute(name, value);
        }
        function syncMedia() {
            for(const [media,note] of mediaNotes){if(canWrite()||!media.isConnected){note.remove();mediaNotes.delete(media);}}
            for (const [media, before] of suspendedMedia) {
                if (media.isConnected && !canWrite()) continue;
                if (media.isConnected) {
                    for (const [name, value] of Object.entries(before)) restoreAttribute(media, name, value);
                }
                suspendedMedia.delete(media);
            }
            if (canWrite()) return;
            for (const media of document.querySelectorAll('video, audio, iframe, object, embed')) {
                if(!mediaNotes.has(media)){const note=document.createElement('p');note.className='session-media-locked';note.textContent='Chỉ xem · Video bị khóa trên phiên này, không ghi thời gian hay mở bài.';media.before(note);mediaNotes.set(media,note);}
                const native = media.matches('video, audio');
                // Tracked YouTube players retain their API connection; student.js
                // pauses them and rejects every progress tick when permission is lost.
                const tracked = media.matches('iframe[id^="yt-player-"]');
                if (!suspendedMedia.has(media)) {
                    const attrs = native ? ['autoplay', 'controls', 'inert'] :
                        tracked ? ['inert'] : ['src', 'srcdoc', 'data', 'inert'];
                    suspendedMedia.set(media, Object.fromEntries(attrs.map(name => [name, media.getAttribute(name)])));
                }
                if (!media.hasAttribute('inert')) media.setAttribute('inert', '');
                if (native) {
                    media.pause();
                    media.removeAttribute('autoplay');
                    media.removeAttribute('controls');
                } else if (!tracked) {
                    if (media.getAttribute('src') && media.getAttribute('src') !== 'about:blank') media.setAttribute('src', 'about:blank');
                    if (media.hasAttribute('srcdoc')) media.removeAttribute('srcdoc');
                    if (media.hasAttribute('data') && media.getAttribute('data') !== 'about:blank') media.setAttribute('data', 'about:blank');
                }
            }
        }
        const markControls = () => {
            for (const [control, before] of marked) {
                if (control.isConnected && !canWrite() && !isViewControl(control)) continue;
                control.classList.remove('student-session-locked');
                restoreAttribute(control, 'aria-disabled', before.aria);
                restoreAttribute(control, 'title', before.title);
                restoreAttribute(control, 'tabindex', before.tabindex);
                marked.delete(control);
            }
            if (!canWrite()) {
                for (const control of document.querySelectorAll(controlSelector)) {
                    if (isViewControl(control) || marked.has(control)) continue;
                    marked.set(control, {aria: control.getAttribute('aria-disabled'), title: control.getAttribute('title'), tabindex: control.getAttribute('tabindex')});
                    control.classList.add('student-session-locked');
                    control.setAttribute('aria-disabled', 'true');
                    control.setAttribute('title', readOnlyText);
                    control.setAttribute('tabindex', '-1');
                }
            }
            syncMedia();
        };
        let markFrame = null;
        new MutationObserver(() => {
            if (markFrame === null) markFrame = requestAnimationFrame(() => { markFrame = null; markControls(); });
        }).observe(document.body, {childList: true, subtree: true, attributes: true,
            attributeFilter: ['src', 'srcdoc', 'data', 'autoplay', 'controls', 'onclick']});
        window.addEventListener('student-session-mode', markControls);
        markControls();
        const stopInteraction = (event, notify = false) => {
            event.preventDefault(); event.stopImmediatePropagation();
            if (notify) notifyReadOnly();
        };
        for (const type of ['click', 'dblclick', 'auxclick', 'submit', 'beforeinput', 'input', 'change', 'dragstart', 'drop']) {
            window.addEventListener(type, event => {
                if (canWrite() || isViewControl(eventTarget(event).closest?.(controlSelector))) return;
                stopInteraction(event, type === 'click' || type === 'submit');
            }, true);
        }
        for (const type of ['pointerdown', 'mousedown', 'touchstart']) {
            window.addEventListener(type, event => {
                if (canWrite() || isViewControl(eventTarget(event).closest?.(controlSelector))) return;
                // Keep native scrolling/text selection, but stop app/game handlers.
                event.stopImmediatePropagation();
                if (eventTarget(event).closest?.('input, select, textarea, label, summary, [contenteditable]')) event.preventDefault();
            }, {capture: true, passive: false});
        }
        for (const type of ['keydown', 'keyup']) {
            window.addEventListener(type, event => {
                if (canWrite() || isViewControl(eventTarget(event).closest?.(controlSelector))) return;
                const editing = eventTarget(event).closest?.('input, select, textarea, [contenteditable]');
                if (event.key === 'Tab' || event.key === 'Escape' ||
                    (!editing && /^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End)$/.test(event.key)) ||
                    (!editing && (event.ctrlKey || event.metaKey) && /^(c|a)$/i.test(event.key))) return;
                stopInteraction(event, type === 'keydown' && /^(Enter| )$/.test(event.key));
            }, true);
        }
        window.addEventListener('focusin', event => {
            if (!canWrite() && !isViewControl(eventTarget(event)) && eventTarget(event).matches?.('input, select, textarea, iframe, video, audio, [contenteditable]')) eventTarget(event).blur();
        }, true);
        document.addEventListener('play', event => {
            if (!canWrite() && event.target.matches?.('video, audio')) event.target.pause();
        }, true);
        const scheduleCheck = () => {
            clearInterval(sessionTimer);
            sessionTimer = setInterval(() => {
                if (pageClosed || forcedLoggingOut) return;
                // Server deadlines aggregate all tabs. A hidden tab cannot revoke
                // another active tab, and a heartbeat never revives an expired session.
                void refreshSession().catch(() => {});
            }, 10000);
        };
        scheduleCheck();

        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
            window.addEventListener(evt, markUserActivity, { passive: true, capture: true });
        });

        window.addEventListener('pageshow', event => {
            if (event.persisted) {
                pageClosed = false;
                scheduleCheck();
                void refreshSession().catch(() => {});
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (pageClosed || forcedLoggingOut) return;
            void refreshSession().catch(() => {});
        });
        window.addEventListener('pagehide', () => {
            handleTabUnload();
            clearInterval(sessionTimer);
        });
    }
    async function releaseSession() {
        if (await enabled()) await call('release_session');
        sessionMode = 'view'; sessionDeadline = 0;
        renderSession();
        clearInterval(sessionTimer);
        unloadToken = null;
    }
    async function ensure() {
        if (await window.TestPageAuthReady === false || window.testPageAuthBlocked) return false;
        const required = Number((await firebase.database().ref('account_access_accounts/'+uid()+'/requiredClientVersion').once('value')).val()) || 0;
        if (!policyCodeReady()) {
            if (required >= 2) throw Error(messages.CLIENT_UPDATE_REQUIRED);
            accessEnforced = false;
            return true; // A partial deployment must not activate an untouched account.
        }
        if (!(await enabled())) { accessEnforced = false; return true; }
        accessEnforced = true;
        let result;
        try {
            // Install guards before the one-way server activation.
            installSessionControls();
            const economy=await window.EconomyClient.initialize();
            if(economy?.enabled!==true){
                if(required>=3)throw Error('Tài khoản đã bật quản lý thiết bị mới. Cần bật máy chủ giao dịch test để tiếp tục.');
                // Daily relaxed test mode keeps its existing v2 authority. It
                // cannot activate v3 or downgrade an account already on v3.
                await call('activate_policy',{clientVersion:2});
                result=await refreshSession();
                await window.StudentConnectionInfo.linkDevice(result.deviceId);
                renderSession();return true;
            }
            // An old tab with a pending operation must finish/reconcile before
            // upgrading; never reload or erase its saved operation IDs.
            if(required<3 && Array.from({length:window.TestBrowserStorage.localStorage.length},(_,i)=>window.TestBrowserStorage.localStorage.key(i)).some(key=>key.startsWith('economy_pending_v1:'+uid()+':')&&!key.endsWith(':last')))
                throw Error('Còn giao dịch đang chờ. Hãy xác nhận giao dịch trước khi bật quản lý thiết bị mới.');
            const claims=(await firebase.auth().currentUser.getIdTokenResult()).claims;
            if(claims.sessionProtocol!==3){
                const upgraded=await call('upgrade_session');
                window.testDeviceRotationUid=uid();
                try{await firebase.auth().signInWithCustomToken(upgraded.customToken);}finally{window.testDeviceRotationUid=null;}
            }
            await call('activate_policy');
            result = await refreshSession();
        }
        catch (error) {
            if (/^(DEVICE_VERIFICATION_REQUIRED|PASSWORD_LOGIN_REQUIRED|ACCOUNT_NOT_ALLOWED|ACCESS_CHANGED|CLIENT_UPDATE_REQUIRED)$/.test(error.message)) {
                await triggerForcedLogout(error.message === 'CLIENT_UPDATE_REQUIRED' ? 'update_required' : error.message === 'ACCESS_CHANGED' ? 'session_changed' : 'session_expired');
                return false;
            }
            if(/^(SESSION_SERVER_NOT_READY|SERVER_MONEY_NOT_READY|SESSION_EXAM_ACTIVE|SESSION_PENDING_OPERATIONS)$/.test(error.message))throw Error(message(error));
            throw error;
        }
        await window.StudentConnectionInfo.linkDevice(result.deviceId);
        installSessionControls(); renderSession();
        return true;
    }
    async function rotate(deviceId,fresh) {
        const result=await call('rotate',{deviceId,code:fresh});
        window.testDeviceRotationUid = uid();
        try { await firebase.auth().signInWithCustomToken(result.customToken); }
        catch (error) { window.testDeviceRotationUid = null; throw error; }
        await refreshSession();
        await window.StudentConnectionInfo.linkDevice(result.deviceId);
        return result;
    }
    window.StudentAccountAccess=Object.freeze({enabled,call,login,ensure,rotate,message,canWrite,requireWrite,refreshSession,releaseSession,invalidateSession,protocol:()=>sessionProtocol,signalRevision:()=>signalRevision,registerSessionControl:el=>sessionSafeControls.add(el),
        activateStudy: async studyBuild => {
            if (!canWrite()) throw Object.assign(Error(readOnlyText),{code:'READ_ONLY_SESSION'});
            return call('activate_policy',{studyVersion:1,studyBuild});
        }});
    function initTeacherRequests() {
        const root=document.getElementById('accountRecoveryRequests');if(!root)return;
        const list=root.querySelector('[data-access-requests]'),status=root.querySelector('[data-access-teacher-status]'),more=root.querySelector('[data-access-more]');
        let cursor=null,busy=false,timer=null;
        async function load(append=false) {
            if(busy || !uid())return;busy=true;
            try {
                if (await window.TestPageAuthReady === false || window.testPageAuthBlocked) return;
                if(!(await enabled())){list.replaceChildren();more.hidden=true;cursor=null;root.classList.add('access-empty');status.textContent='Chức năng hỗ trợ đăng nhập chưa được bật.';return;}
                const result=await call('teacher_list',{cursor:append?cursor:null});
                if(!append)list.replaceChildren();cursor=result.nextCursor;more.hidden=!cursor;
                root.classList.toggle('access-empty', !result.rows.length && !list.children.length && !cursor);
                for(const row of result.rows) {
                    const card=document.createElement('article');card.className='access-request';
                    const title=document.createElement('strong');title.textContent=row.name+' ('+row.username+')';
                    const info=document.createElement('p');info.textContent=(row.kind==='device'?'Quên mã khôi phục':'Báo quên mật khẩu')+' · '+new Date(row.createdAt).toLocaleString('vi-VN');
                    const ref=document.createElement('p');ref.textContent='Mã yêu cầu: '+row.id+' · '+({pending:'Chờ xử lý',approved:'Đã duyệt, chờ tạo mã',processing:'Đang đổi mật khẩu'}[row.status]||row.status);
                    const note=document.createElement('p');note.className='access-request-note';note.textContent=row.kind==='device'?'Xác nhận đúng học sinh trước khi duyệt. Đồng ý sẽ vô hiệu hóa mã cũ và cho phép tạo mã mới trong 15 phút.':'Yêu cầu này có thể gửi khi chưa đăng nhập. Xác nhận học sinh qua kênh liên hệ đã biết trước khi đổi và gửi mật khẩu mới.';
                    const actions=document.createElement('div');actions.className='access-request-actions';
                    const approve=button(row.kind==='device'?'Đồng ý tạo mã mới':'Đổi mật khẩu',()=>void decide(true));
                    const reject=button('Từ chối',()=>void decide(false),true);
                    approve.disabled=row.status==='approved';reject.disabled=row.status!=='pending';actions.append(approve,reject);
                    card.append(title,info,ref,note,actions);list.appendChild(card);
                    async function decide(yes) {
                        let password;
                        if(yes && row.kind==='password') {
                            password=await window.AppDialog.prompt((row.status==='processing'?'Nhập lại đúng mật khẩu đã gửi ở lần trước để tiếp tục xử lý. ':'')+'Nhập mật khẩu mới (8–128 ký tự, có chữ và số). Sau khi đổi, gửi riêng cho đúng học sinh.','',{password:true,title:'Đổi mật khẩu cho '+row.username,inputLabel:'Mật khẩu mới'});
                            if(password===null || password===undefined)return;
                        } else if(yes && !(await window.AppDialog.confirm('Đồng ý cho '+row.username+' tạo mã mới? Mã khôi phục cũ sẽ hết hiệu lực.')))return;
                        approve.disabled=true;reject.disabled=true;
                        try {
                            const result=await call('teacher_decide',{uid:row.uid,kind:row.kind,id:row.id,approve:yes,...(password?{password}:{})});
                            status.textContent=result.status==='password_changed'?'Đã đổi mật khẩu. Hãy gửi mật khẩu mới cho học sinh qua kênh liên hệ đã xác nhận.':yes?'Đã duyệt. Học sinh có 15 phút để tạo mã mới.':'Đã từ chối yêu cầu.';
                            card.remove();
                        } catch (error) {
                            status.textContent = message(error);
                            approve.disabled = false;
                            reject.disabled = row.status !== 'pending';
                            if (/REQUEST_ALREADY_REVIEWED|REQUEST_EXPIRED/.test(String(error?.code || error?.message || ''))) {
                                void load();
                            }
                        }
                        password=null;
                    }
                }
                status.textContent=list.children.length?'Có '+list.children.length+' yêu cầu trong các trang đã tải.':'Không có yêu cầu chờ xử lý trong trang này.';
            }catch(error){status.textContent=message(error);}finally{busy=false;}
        }
        root.querySelector('[data-access-refresh]').addEventListener('click',()=>void load());more.addEventListener('click',()=>void load(true));
        try{firebase.auth().onAuthStateChanged(user=>{if(user)void load();else list.replaceChildren();});}catch(_){}
        timer=setInterval(()=>{if(document.visibilityState==='visible' && root.closest('.tab-content')?.classList.contains('active') && !cursor)void load();},30000);
        window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
    }
    const init=()=>{document.getElementById('forgotPasswordButton')?.addEventListener('click',()=>{void forgotPassword();});initTeacherRequests();};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
    window.addEventListener('pagehide',()=>{loginEpoch++;clearTimeout(requestTimer);});
})();

// CONNECTION INFO — account-scoped device profiles and observed public IPs; not hardware authentication.
(() => {
    'use strict';
    if (window.StudentConnectionInfo) return;
    const ROW_ID = 'studentConnectionInfo';
    const DEVICE_KEY = 'studyBrowserDeviceId:v1';
    const DEVICE_ID_RE = /^DEV-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let started = false, pending = null, controller = null, generation = 0;
    let cached = null, cachedAt = 0;
    let device = {id: null, persistent: false}, devicePending = null;
    let authEpoch = 0, cloudProfile = null, recoveryBusy = false, recoveryCode = '', pendingRecovery = null;
    const MAX_NETWORKS = 10;

    function authUser() { try { return window.firebase?.auth?.().currentUser || null; } catch (_) { return null; } }
    function projectId() { try { return window.firebase?.app?.().options.projectId || 'default'; } catch (_) { return 'default'; } }
    function linkKey() { return `${DEVICE_KEY}:link:${projectId()}:${authUser()?.uid || ''}`; }
    function cloudContext() { return {uid: authUser()?.uid, id: device.id, epoch: authEpoch, generation}; }
    function isCurrent(ctx) { return ctx.uid && ctx.uid === authUser()?.uid && ctx.id === device.id && ctx.epoch === authEpoch && ctx.generation === generation; }
    function profilesRef(uid) { return window.firebase.database().ref(`student_device_profiles/${uid}`); }
    function cloudStatus(message) { const el = document.querySelector(`#${ROW_ID} [data-device-cloud-status]`); if (el) el.textContent = message; }
    function errorMessage(error) {
        const code = String(error?.code || error?.message || '');
        if (/permission|denied/i.test(code)) return 'Chưa có quyền lưu thiết bị. Kiểm tra Rules và trạng thái đăng nhập của tài khoản.';
        if (/OFFLINE/.test(code)) return 'Đang ngoại tuyến. Kết nối lại để lưu hoặc khôi phục thiết bị.';
        if (/AUTH/.test(code)) return 'Đăng nhập để lưu và khôi phục thiết bị của tài khoản này.';
        if (/RECOVERY_NOT_FOUND/.test(code)) return 'Mã không đúng hoặc không thuộc tài khoản đang đăng nhập.';
        if (/RECOVERY_INVALID/.test(code)) return 'Mã khôi phục cần có dạng REC- và 32 ký tự phía sau.';
        return 'Chưa xác nhận được thao tác. Kiểm tra kết nối rồi thử lại.';
    }

    function renderProfile(profile, network = cached) {
        const list = document.querySelector(`#${ROW_ID} [data-device-networks]`);
        const status = document.querySelector(`#${ROW_ID} [data-network-match]`);
        if (!list || !status) return;
        list.replaceChildren();
        const rows = Object.values(profile?.networks || {}).filter(value=>value && typeof value.ip==='string').sort((a,b) => b.lastSeenAt - a.lastSeenAt);
        for (const entry of rows) {
            const item = document.createElement('li');
            const time = new Date(entry.lastSeenAt).toLocaleString('vi-VN');
            const address=document.createElement('strong'),detail=document.createElement('span');
            address.textContent=entry.ip;
            detail.textContent=`${[entry.city, entry.region, entry.country].filter(Boolean).join(', ') || 'Chưa rõ khu vực'} · ${time}`;
            item.append(address,detail);
            list.appendChild(item);
        }
        if (!rows.length) { const item=document.createElement('li');item.textContent='Chưa có IP đã lưu cho thiết bị này.';list.appendChild(item); }
        const count=document.querySelector(`#${ROW_ID} [data-network-count]`);if(count)count.textContent=String(rows.length);
        status.textContent = network?.ip
            ? rows.some(entry => entry.ip === network.ip) ? 'IP hiện tại đã có trong danh sách đã ghi nhận.' : 'IP hiện tại chưa có trong danh sách đã ghi nhận.'
            : 'Chưa xác định IP hiện tại; danh sách dưới đây chỉ là thông tin đã lưu.';
    }

    async function syncDeviceProfile() {
        if (window.StudentAccountAccess && !window.StudentAccountAccess.canWrite()) return;
        await ensureDevice();
        const ctx = cloudContext(), network = cached;
        if (!ctx.uid || !ctx.id) { cloudStatus('Đăng nhập để lưu thiết bị và các IP đã ghi nhận.'); return null; }
        if (navigator.onLine === false) { cloudStatus(errorMessage(Error('OFFLINE')));return null; }
        try {
            const timestamp = window.firebase.database.ServerValue.TIMESTAMP;
            const result = await profilesRef(ctx.uid).child(ctx.id).transaction(current => {
                if (!isCurrent(ctx)) return;
                // Observations are self-reported, never used as proof of identity or to award/penalize.
                const record = current || {id: ctx.id, createdAt: timestamp};
                const rows = Object.entries(record.networks || {}).filter(([,value])=>value && typeof value.ip==='string');
                const known = network?.ip && rows.find(([,value]) => value.ip === network.ip);
                if (current && (!network?.ip || (known && record.latestIp === network.ip && Date.now() - Number(record.updatedAt) < 600000))) return;
                const next = {...record, updatedAt: timestamp};
                if (network?.ip) {
                    let slot = known?.[0];
                    if (slot == null) slot = Array.from({length:MAX_NETWORKS},(_,i)=>String(i)).find(key=>!record.networks?.[key]);
                    if (slot == null) slot = rows.sort((a,b)=>a[1].lastSeenAt-b[1].lastSeenAt)[0][0];
                    const clean = value => typeof value === 'string' ? value.slice(0,120) : '';
                    next.networks = {...record.networks, [slot]: {
                        ip: clean(network.ip), city: clean(network.city), region: clean(network.region), country: clean(network.country),
                        firstSeenAt: known?.[1]?.firstSeenAt || timestamp, lastSeenAt: timestamp
                    }};
                    next.latestIp = network.ip;
                }
                return next;
            }, undefined, false);
            if (!isCurrent(ctx)) return null;
            cloudProfile = result.snapshot.val();
            renderProfile(cloudProfile, network);
            cloudStatus(cloudProfile ? 'Đã lưu thiết bị trên Firebase của tài khoản này.' : 'Chưa xác nhận được bản ghi thiết bị.');
            return cloudProfile;
        } catch (error) { if (isCurrent(ctx)) cloudStatus(errorMessage(error)); return null; }
    }

    async function recoveryHash(code, uid) {
        const normalized = String(code || '').toUpperCase().replace(/\s/g,'');
        if (!/^REC-[0-9A-F]{32}$/.test(normalized)) throw Error('RECOVERY_INVALID');
        const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`study-device:v1|${projectId()}|${uid}|${normalized}`));
        return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
    }

    function setRecoveryBusy(value) {
        recoveryBusy = value;
        document.querySelectorAll(`#${ROW_ID} [data-device-generate]`).forEach(button=>{button.disabled=value;});
    }

    async function generateRecoveryCode() {
        if (recoveryBusy) return;
        setRecoveryBusy(true);
        let ctx;
        try {
            await ensureDevice();ctx=cloudContext();
            if (!ctx.uid || !ctx.id) throw Error('AUTH_REQUIRED');
            if (navigator.onLine === false) throw Error('OFFLINE');
            const random = newDeviceId();
            if (!random) throw Error('NO_SECURE_RANDOM');
            const code = pendingRecovery?.uid===ctx.uid && pendingRecovery.id===ctx.id ? pendingRecovery.code : 'REC-' + random.slice(4).replace(/-/g,'').toUpperCase();
            if(window.StudentAccountAccess && await window.StudentAccountAccess.enabled()) {
                pendingRecovery={uid:ctx.uid,id:ctx.id,code};
                await window.StudentAccountAccess.rotate(ctx.id,code);
                if(ctx.uid!==authUser()?.uid)return;
                const output=document.querySelector(`#${ROW_ID} [data-device-recovery-code]`);
                output.hidden=false;output.textContent=code;
                pendingRecovery=null;
                cloudStatus('Đã tạo mã mới. Hãy cất mã để dùng ở lần đăng nhập sau; mã cũ đã hết hiệu lực.');
                return;
            }
            const hash = await recoveryHash(code,ctx.uid);
            if (!isCurrent(ctx)) return;
            const timestamp=window.firebase.database.ServerValue.TIMESTAMP;
            const result=await profilesRef(ctx.uid).child(ctx.id).transaction(current=>{
                if (!isCurrent(ctx)) return;
                return {...(current || {id:ctx.id,createdAt:timestamp}),updatedAt:timestamp,recoveryHash:hash};
            },undefined,false);
            if (!isCurrent(ctx) || !result.committed) return;
            recoveryCode=code;
            const output=document.querySelector(`#${ROW_ID} [data-device-recovery-code]`);
            output.hidden=false;output.textContent=code;
            cloudProfile=result.snapshot.val();renderProfile(cloudProfile);
            cloudStatus('Đã tạo mã mới. Hãy chép và cất riêng; mã trước đó đã hết hiệu lực. Mã này chỉ hiện trong phiên này.');
        } catch(error) { if (!ctx || ctx.uid===authUser()?.uid) cloudStatus(window.StudentAccountAccess?.message(error) || errorMessage(error)); }
        finally { setRecoveryBusy(false); }
    }

    let restoredSession = null;

    function isStudentPage() {
        return Boolean(document.getElementById('studentName')) && !document.getElementById('tab-manage-students');
    }

    function newDeviceId() {
        try {
            const id = `DEV-${window.crypto.randomUUID()}`;
            if (DEVICE_ID_RE.test(id)) return id;
        } catch (_) {}
        try {
            const bytes = window.crypto.getRandomValues(new Uint8Array(16));
            bytes[6] = (bytes[6] & 15) | 64;
            bytes[8] = (bytes[8] & 63) | 128;
            const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
            return `DEV-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        } catch (_) { return null; }
    }

    function readOrCreateDevice() {
        try {
            const saved = window.TestBrowserStorage.localStorage.getItem(DEVICE_KEY);
            if (DEVICE_ID_RE.test(saved || '')) return {id: saved, persistent: true};
        } catch (_) {}
        // No hardware fingerprint, account name or IP participates in this ID.
        const id = !device.persistent && device.id ? device.id : newDeviceId();
        if (!id) return {id: null, persistent: false};
        try {
            window.TestBrowserStorage.localStorage.setItem(DEVICE_KEY, id);
            const saved = window.TestBrowserStorage.localStorage.getItem(DEVICE_KEY);
            if (DEVICE_ID_RE.test(saved || '')) return {id: saved, persistent: true};
        } catch (_) {}
        return {id, persistent: false};
    }

    function renderDevice() {
        const row = document.getElementById(ROW_ID);
        if (!row) return;
        row.querySelector('[data-device-id]').textContent = device.id || 'Chưa tạo được mã';
        row.querySelector('[data-device-status]').textContent = !device.id
            ? 'Trình duyệt này chưa hỗ trợ tạo mã an toàn.'
            : device.persistent ? 'Đã lưu mã trên trình duyệt này.'
            : 'Mã tạm thời: trình duyệt không cho lưu dữ liệu, mã có thể đổi khi tải lại trang.';
        row.querySelector('[data-device-copy]').disabled = !device.id;
    }

    function ensureDevice() {
        if (devicePending) return devicePending;
        devicePending = Promise.resolve().then(async () => {
            try {
                // Serialize first creation across tabs. The callback has no network or other waits.
                device = window.TestBrowserStorage.locks?.request
                    ? await window.TestBrowserStorage.locks.request(DEVICE_KEY, readOrCreateDevice)
                    : readOrCreateDevice();
            } catch (_) { device = readOrCreateDevice(); }
            const uid=authUser()?.uid;
            try {
                const linked=uid && window.TestBrowserStorage.localStorage.getItem(linkKey());
                if (DEVICE_ID_RE.test(linked || '')) device={id:linked,persistent:true};
                else if (restoredSession?.uid===uid) device={id:restoredSession.id,persistent:false};
            } catch (_) { if (uid && restoredSession?.uid===uid) device={id:restoredSession.id,persistent:false}; }
            renderDevice();
            return {...device};
        }).finally(() => { devicePending = null; });
        return devicePending;
    }

    async function copyDeviceId() {
        const row = document.getElementById(ROW_ID);
        if (!row || !device.id) return;
        const status = row.querySelector('[data-device-status]');
        try {
            await navigator.clipboard.writeText(device.id);
            status.textContent = 'Đã sao chép mã nhận dạng.';
        } catch (_) {
            const range = document.createRange();
            range.selectNodeContents(row.querySelector('[data-device-id]'));
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            status.textContent = 'Hãy nhấn Ctrl+C hoặc nhấn giữ mã để sao chép.';
        }
    }

    function render(data, message = '') {
        const row = document.getElementById(ROW_ID);
        if (!row) return;
        const text = value => typeof value === 'string' ? value.slice(0, 120) : '';
        row.querySelector('[data-network-ip]').textContent = text(data?.ip) || 'Chưa xác định';
        let country = text(data?.country);
        try {
            if (/^[A-Z]{2}$/.test(country)) country = new Intl.DisplayNames(['vi'], {type: 'region'}).of(country);
        } catch (_) {}
        const region = [...new Set([text(data?.city), text(data?.region), country].filter(Boolean))];
        row.querySelector('[data-network-region]').textContent = region.join(', ') || 'Chưa xác định';
        row.querySelector('[data-network-status]').textContent = message || 'Đã tự phát hiện kết nối hiện tại.';
    }

    function clearConnection() {
        generation += 1;
        controller?.abort();
        controller = null;
        pending = null;
        cached = null;
        cachedAt = 0;
        renderProfile(cloudProfile, null);
    }

    function refresh() {
        if (!started || !isStudentPage()) return Promise.resolve(null);
        if (pending) return pending;
        if (cached && Date.now() - cachedAt < 60000) { void syncDeviceProfile(); return Promise.resolve(cached); }
        if (navigator.onLine === false) {
            render(null, 'Đang ngoại tuyến. Kết nối lại để tự phát hiện IP.');
            return Promise.resolve(null);
        }
        const id = ++generation;
        const abort = new AbortController();
        controller = abort;
        const button = document.querySelector(`#${ROW_ID} [data-network-refresh]`);
        if (button) button.disabled = true;
        render(null, 'Đang tự phát hiện IP và khu vực kết nối…');
        const timer = setTimeout(() => abort.abort(), 8000);
        const run = async () => {
            try {
                if (id !== generation || abort.signal.aborted) return null;
                const base = String(window.CloudflareR2Storage?.config?.workerUrl || window.R2_WORKER_URL ||
                    window.APP_STORAGE_CONFIG?.r2WorkerUrl || 'https://school-account-access-test.ngogibao0311.workers.dev');
                const url = new URL(base.replace(/\/+$/, '') + '/network-info');
                if (url.hostname.endsWith('.invalid') || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) {
                    throw new Error('INVALID_NETWORK_ENDPOINT');
                }
                const response = await fetch(url.href, {
                    method: 'GET', cache: 'no-store', credentials: 'omit',
                    referrerPolicy: 'no-referrer', signal: abort.signal
                });
                if (!response.ok) throw new Error('NETWORK_INFO_UNAVAILABLE');
                const data = await response.json();
                if (data?.ok !== true || data?.source !== 'cloudflare') throw new Error('INVALID_NETWORK_INFO');
                if (id !== generation) return null;
                cached = data;
                cachedAt = Date.now();
                render(data, data.ip ? '' : 'Kết nối này chưa cung cấp thông tin IP.');
                void syncDeviceProfile();
                return data;
            } catch (_) {
                if (id === generation) render(null, navigator.onLine === false
                    ? 'Đang ngoại tuyến. Kết nối lại để tự phát hiện IP.'
                    : 'Chưa lấy được thông tin kết nối. Bạn có thể thử lại sau.');
                return null;
            } finally {
                clearTimeout(timer);
                if (id === generation) {
                    pending = null;
                    controller = null;
                    if (button) button.disabled = false;
                }
            }
        };
        pending = Promise.resolve().then(run);
        return pending;
    }

    function init() {
        if (started || !isStudentPage()) return;
        const container = document.querySelector('#tab-settings .student-settings-section-account');
        if (!container) return;
        started = true;
        const row = document.createElement('section');
        row.id = ROW_ID;
        row.className = 'student-connection-info';
        row.setAttribute('aria-label', 'Thông tin kết nối và mã nhận dạng của bạn');
        row.innerHTML = `<header class="connection-heading"><span class="connection-symbol" aria-hidden="true">◎</span>
            <div><h4>Kết nối của bạn</h4><p>Thiết bị &amp; mạng đang sử dụng</p></div><span class="connection-private">Cá nhân</span></header>
            <div class="connection-body"><div class="connection-network"><div class="connection-section-title"><strong>Kết nối hiện tại</strong>
            <button type="button" data-network-refresh>Cập nhật lại</button></div>
            <dl><div><dt>IP công khai</dt><dd data-network-ip>Đang phát hiện…</dd></div>
            <div><dt>Khu vực gần đúng</dt><dd data-network-region>Đang phát hiện…</dd></div></dl>
            <p class="connection-status" data-network-status role="status" aria-live="polite"></p></div>
            <div class="student-device-info"><strong>Mã thiết bị của bạn</strong>
            <code data-device-id>Đang tạo mã…</code>
            <div class="student-connection-actions"><span data-device-status role="status" aria-live="polite"></span>
            <button type="button" data-device-copy disabled>Sao chép</button></div>
            <p class="connection-status" data-device-cloud-status role="status">Đăng nhập để lưu và khôi phục thiết bị.</p>
            <div class="connection-recovery"><strong>Giữ lại thiết bị khi đổi trình duyệt</strong>
            <p>Cất mã khôi phục ở nơi riêng để liên kết lại hồ sơ. Tạo mã mới sẽ vô hiệu hóa mã khôi phục cũ.</p>
            <button type="button" data-device-generate>Tạo mã khôi phục mới</button>
            <code data-device-recovery-code hidden></code>
            <p>Nhập mã khôi phục ở bước sau đăng nhập, kể cả khi đổi trình duyệt hoặc xóa dữ liệu.</p></div></div>
            <details class="connection-history"><summary>IP đã ghi nhận <span data-network-count>0</span></summary>
            <p data-network-match></p><ul data-device-networks></ul></details>
            <p class="connection-footnote">Lưu tối đa 10 IP gần đây trong tài khoản. IP và khu vực chỉ là thông tin gần đúng; cùng IP không có nghĩa là cùng máy.</p></div>`;
        container.insertBefore(row,container.querySelector('#toggleStudentContentGlassButton'));
        row.querySelector('[data-network-refresh]').addEventListener('click', () => { void refresh(); });
        row.querySelector('[data-device-copy]').addEventListener('click', () => { void copyDeviceId(); });
        row.querySelector('[data-device-generate]').addEventListener('click', () => { void generateRecoveryCode(); });
        void ensureDevice();
        window.addEventListener('storage', event => {
            if (window.TestBrowserStorage.eventKey(event) === DEVICE_KEY || window.TestBrowserStorage.eventKey(event) === linkKey() || (event.key === null && event.storageArea === window.localStorage)) {
                restoredSession=null;authEpoch+=1;cloudProfile=null;renderProfile(null);
                void ensureDevice().then(()=>syncDeviceProfile());
            }
        });
        const changed = () => {
            clearConnection();
            const button = row.querySelector('[data-network-refresh]');
            if (button) button.disabled = false;
            void refresh();
        };
        window.addEventListener('online', changed);
        window.addEventListener('offline', changed);
        navigator.connection?.addEventListener?.('change', changed);
        window.addEventListener('pagehide', clearConnection);
        window.addEventListener('pageshow', event => {
            if (event.persisted) { void ensureDevice(); changed(); }
        });
        try {
            window.firebase?.auth?.().onAuthStateChanged(() => {
                authEpoch+=1;cloudProfile=null;restoredSession=null;recoveryCode='';
                row.querySelector('[data-device-recovery-code]').hidden=true;
                row.querySelector('[data-device-recovery-code]').textContent='';
                renderProfile(null);void syncDeviceProfile();
            });
        } catch (_) {}
        void refresh();
    }

    async function linkDevice(id) {
        if(!DEVICE_ID_RE.test(id || '') || !authUser()?.uid)throw Error('INVALID_DEVICE');
        const uid=authUser().uid;
        let persistent=false;try{window.TestBrowserStorage.localStorage.setItem(linkKey(),id);persistent=window.TestBrowserStorage.localStorage.getItem(linkKey())===id;}catch(_){}
        authEpoch++;restoredSession={uid,id};device={id,persistent};cloudProfile=null;renderDevice();renderProfile(null);
    }
    window.StudentConnectionInfo = Object.freeze({refresh,ensureDevice,linkDevice,getDeviceInfo: () => ({...device})});
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
    else init();
})();

(window.AssetModuleVersions ||= {})['common'] = '20261018.romeo1';
(window.StudyModuleVersions ||= {})['common'] = '20261019.study1';
// Written only after this module has executed successfully.
(window.SessionPolicyModules ||= {}).common = '20261024.session3';


