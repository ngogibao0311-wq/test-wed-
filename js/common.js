const loginForm = document.getElementById('loginForm');
let lockoutInterval = null;

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
            'Kết nối mạng hoặc máy chủ Firebase bị gián đoạn.';

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
                                                ? 'Thiết bị đang ngoại tuyến nên Firebase chưa thể đồng bộ dữ liệu.'
                                                : 'Internet vẫn có tín hiệu nhưng máy chủ dữ liệu chưa phản hồi.',

                                        status:
                                            navigator
                                                .onLine ===
                                                false
                                                ? 'Hãy kiểm tra Wi-Fi hoặc 4G/5G.'
                                                : 'Đang thử kết nối lại Firebase...'
                                    });

                                },
                                8000
                            );
                    }
                );
        }
    } catch (error) {
        console.warn(
            'Không thể theo dõi Firebase:',
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
        return String(value || '').trim() === 'centered'
            ? 'centered'
            : 'split';
    }

    function applyLayout(value, saveToStorage = true) {
        const layout = normalizeLayout(value);

        document.body.classList.remove(
            'login-layout-split',
            'login-layout-centered'
        );

        document.body.classList.add(
            layout === 'centered'
                ? 'login-layout-centered'
                : 'login-layout-split'
        );

        document.body.dataset.loginLayout =
            layout;

        if (saveToStorage) {
            try {
                localStorage.setItem(
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
            localStorage.getItem(STORAGE_KEY) ||
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
    let val = localStorage.getItem(key);
    if (!val) {
        const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
        if (match) val = match[2];
    }
    return val;
}

function setLockoutData(key, value, expireSeconds) {
    localStorage.setItem(key, value);
    if (expireSeconds > 0) {
        document.cookie = `${key}=${value}; max-age=${expireSeconds}; path=/`;
    } else {
        document.cookie = `${key}=; max-age=0; path=/`;
    }
}

async function clearAllLockouts() {
    localStorage.removeItem('_sys_df');
    localStorage.removeItem('_sys_dl');

    document.cookie =
        '_sys_df=; max-age=0; path=/';

    document.cookie =
        '_sys_dl=; max-age=0; path=/';
}

if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorMsg = document.getElementById('errorMsg');

        if (!usernameInput || !passwordInput || !errorMsg) {
            console.error('Không tìm thấy thành phần của form đăng nhập.');
            return;
        }

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

        try {
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

            user._fbKey = uid;
            localStorage.setItem('currentUser', JSON.stringify(user));

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
                'Firebase Auth đăng nhập thất bại:',
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
                    'Tài khoản chưa tồn tại trong Firebase Authentication.',

                'auth/wrong-password':
                    'Mật khẩu không chính xác.',

                'auth/invalid-email':
                    'Tên đăng nhập tạo ra email không hợp lệ.',

                'auth/user-disabled':
                    'Tài khoản đã bị vô hiệu hóa.',

                'auth/operation-not-allowed':
                    'Firebase chưa bật đăng nhập Email/Password.',

                'auth/network-request-failed':
                    'Không thể kết nối Firebase Authentication.',

                'auth/too-many-requests':
                    'Firebase tạm chặn vì đăng nhập sai quá nhiều lần.',

                'auth/invalid-api-key':
                    'Firebase API key không hợp lệ hoặc sai dự án.',

                'auth/app-not-authorized':
                    'Tên miền hiện tại chưa được Firebase cho phép.'
            };

            const displayMessage =
                messages[errorCode] ||
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
            console.warn('⚠️ Không thể gỡ Firebase listener:', err);
        }
    });

    window.firebaseListenerRegistry = [];
    console.log('✅ Đã gỡ toàn bộ Firebase listeners:', list.length);
};

// Khi rời trang / F5 / đóng tab cũng tự gỡ listener
window.addEventListener('beforeunload', function () {
    if (typeof window.cleanupFirebaseListeners === 'function') {
        window.cleanupFirebaseListeners();
    }
});

window.logout = async function () {
    const accepted = confirm(
        'Bạn có chắc chắn muốn đăng xuất?'
    );

    if (!accepted) return;

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
            'Không thể đăng xuất Firebase Authentication:',
            error
        );
    } finally {
        // Không xóa toàn bộ localStorage vì còn giao diện,
        // cài đặt và dữ liệu không liên quan đến đăng nhập.
        localStorage.removeItem('currentUser');

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
// HỆ THỐNG KIỂM TRA CẬP NHẬT PHIÊN BẢN TỪ GITHUB (TRÁNH CACHE)
// ==============================================================
let currentAppVersion = localStorage.getItem('appVersion') || '1.0.0';
let latestAppVersion = currentAppVersion;

async function checkForUpdates() {
    try {
        // Gắn thêm timestamp (?t=...) để ép trình duyệt không dùng bộ nhớ đệm khi tải file này
        const response = await fetch('version.json?t=' + new Date().getTime());
        if (!response.ok) return;

        const data = await response.json();
        latestAppVersion = data.version;

        // Nếu số phiên bản trên GitHub khác số đang lưu trong máy
        if (latestAppVersion !== currentAppVersion) {
            // Hiện chấm đỏ nhấp nháy ở Menu
            const navBtn = document.getElementById('btnSettingsNav');
            if (navBtn) navBtn.classList.add('has-update');

            // Hiện khung màu đỏ trong tab Cài đặt
            const updateBanner = document.getElementById('updateBannerArea');
            if (updateBanner) updateBanner.style.display = 'flex';
        }
    } catch (error) {
        console.log('Không thể kiểm tra cập nhật:', error);
    }
}

window.applySystemUpdate = function () {
    // 1. Lưu phiên bản mới vào máy
    localStorage.setItem('appVersion', latestAppVersion);

    // 2. Xóa sạch bộ nhớ đệm (Cache) của trình duyệt để ép tải lại file HTML/CSS/JS mới
    if ('caches' in window) {
        caches.keys().then((names) => {
            names.forEach(name => { caches.delete(name); });
        });
    }

    // 3. Tải lại trang triệt để
    window.location.reload(true);
};

// Đặt độ trễ 2.5 giây sau khi tải trang mới bắt đầu kiểm tra để web luôn tải nhanh nhất
window.addEventListener('load', () => {
    setTimeout(checkForUpdates, 2500);
});

// ==============================================================
// HỆ THỐNG THAY ĐỔI GIAO DIỆN (ĐỘC LẬP TỪNG TÀI KHOẢN)
// ==============================================================
window.changeTheme = function (themeName, saveToStorage = true) {
    // 1. Xóa các class theme cũ trên thẻ body
    document.body.classList.remove('theme-blue', 'theme-green', 'theme-pink');

    // 2. Thêm class theme mới (nếu không phải mặc định)
    if (themeName !== 'default') {
        document.body.classList.add('theme-' + themeName);
    }

    // 3. Lưu vào bộ nhớ cục bộ THEO TÊN TÀI KHOẢN (VD: appTheme_hs1)
    if (saveToStorage) {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                localStorage.setItem('appTheme_' + user.username, themeName);
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
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                // Lấy theme tương ứng với tài khoản đang đăng nhập
                savedTheme = localStorage.getItem('appTheme_' + user.username) || 'default';
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
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
};

// Tự động khôi phục trạng thái thu gọn khi vừa tải trang xong
window.addEventListener('DOMContentLoaded', () => {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
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
// HỆ THỐNG QUÉT LỖI VÀ CHẨN ĐOÁN WEBSITE (DIAGNOSTICS SCANNER)
// =====================================================================

window.runSystemDiagnostics = async function () {
    const resultBox = document.getElementById('diagnosticResults');
    const statusText = document.getElementById('diagnosticStatus');
    const list = document.getElementById('diagnosticList');

    if (!resultBox || !statusText || !list) return alert("Lỗi: Không tìm thấy khung hiển thị kết quả HTML!");

    // Khởi tạo giao diện
    resultBox.style.display = 'block';
    list.innerHTML = '';
    statusText.innerHTML = '<span style="color: #d35400; font-weight: bold;">⏳ Đang tiến hành rà soát hệ thống... Vui lòng đợi!</span>';

    let errors = [];
    let warnings = [];
    let passes = 0;

    // Hàm tiện ích in log ra giao diện
    const addLog = (msg, type) => {
        let color = type === 'error' ? '#e11d48' : (type === 'warn' ? '#f59e0b' : '#059669');
        let icon = type === 'error' ? '❌' : (type === 'warn' ? '⚠️' : '✅');
        let li = document.createElement('li');
        li.style.cssText = `color: ${color}; border-bottom: 1px dashed rgba(0,0,0,0.05); padding: 5px 0;`;
        li.innerHTML = `<strong>${icon}</strong> ${msg}`;
        list.appendChild(li);
    };

    // Tạo độ trễ ảo để quét từng phần (tránh đơ trình duyệt)
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        await sleep(500); // ----------------------------------------------------
        // 1. KIỂM TRA BỘ NHỚ LƯU TRỮ VÀ PHIÊN ĐĂNG NHẬP
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            errors.push("Mất dữ liệu phiên đăng nhập (currentUser null).");
        } else {
            passes++;
            if (!user.username || !user.role) errors.push("Dữ liệu người dùng bị hỏng (Thiếu username/role).");
        }

        await sleep(500); // ----------------------------------------------------
        // 2. KIỂM TRA ĐƯỜNG TRUYỀN FIREBASE REALTIME DATABASE
        if (typeof db === 'undefined') {
            errors.push("Không tìm thấy kết nối Firebase Database.");
        } else {
            try {
                // Ping nhẹ lên node users (Giới hạn 1 để không kéo data nặng)
                await db.ref('users').limitToFirst(1).once('value');
                passes++;
            } catch (e) {
                errors.push("Mất kết nối mạng hoặc sai cấu hình Firebase config.js.");
            }
        }

        await sleep(500); // ----------------------------------------------------
        // 3. QUÉT TOÀN BỘ HÌNH ẢNH TRÊN DOM (Phát hiện link chết, lỗi Base64)
        const images = document.querySelectorAll('img');
        let brokenImages = 0;
        images.forEach(img => {
            if (!img.complete || img.naturalWidth === 0) {
                brokenImages++;
                let shortSrc = img.src.length > 50 ? img.src.substring(0, 50) + '...' : img.src;
                warnings.push(`Phát hiện ảnh lỗi hoặc không thể tải: ${shortSrc}`);
            }
        });
        if (brokenImages === 0) passes++;

        await sleep(500); // ----------------------------------------------------
        // 4. KIỂM TRA CẤU TRÚC CỬA HÀNG (StoreConfig)
        if (typeof StoreConfig !== 'undefined' && StoreConfig.items) {
            passes++;
            StoreConfig.items.forEach(item => {
                if (!item.id || !item.type || !item.name) {
                    errors.push(`Vật phẩm cửa hàng bị lỗi cấu trúc: Mất định danh ID hoặc Tên.`);
                }
                if (item.isNonCoin && item.price === undefined) {
                    warnings.push(`Vật phẩm [${item.name}] là hàng phi lợi nhuận nhưng chưa set giá = 0, có thể gây lỗi undefined.`);
                }
            });
        } else {
            warnings.push("Hệ thống cửa hàng chưa được tải (StoreConfig undefined).");
        }

        await sleep(500); // ----------------------------------------------------
        // 5. KIỂM TRA XUNG ĐỘT QUẢN LÝ TỆP (DataTransfer)
        if (user && user.role === 'student' && typeof window.studentSubmitDTs === 'undefined') {
            errors.push("Biến quản lý file cộng dồn của học sinh (studentSubmitDTs) bị hỏng hoặc chưa khởi tạo.");
        } else if (user && user.role === 'teacher' && typeof window.teacherGradeDTs === 'undefined') {
            errors.push("Biến quản lý file chấm bài của giáo viên (teacherGradeDTs) bị hỏng.");
        } else {
            passes++;
        }

        await sleep(500); // ----------------------------------------------------
        // 6. KIỂM TRA CÁC BIẾN TOÀN CỤC HOẠT ĐỘNG (ĐỒNG BỘ TRÒ CHƠI)
        if (typeof window.wheelProbs === 'undefined') {
            warnings.push("Cấu hình tỉ lệ vòng quay đang trống, game sẽ dùng mặc định cứng.");
        }

        // Tiến hành kiểm tra động: Nếu chưa có biến, thử đợi Firebase phản hồi trong 1 giây trước khi báo lỗi
        if (typeof window.isGameEnabled === 'undefined') {
            let retryCount = 0;
            while (retryCount < 5 && typeof window.isGameEnabled === 'undefined') {
                await sleep(200); // Đợi thêm 200ms mỗi lần để Firebase kịp kéo data
                retryCount++;
            }
        }

        // Sau khi đã đợi mà vẫn không có dữ liệu thì mới xác nhận là mất đồng bộ dữ liệu hoặc lỗi kết nối
        if (typeof window.isGameEnabled === 'undefined') {
            warnings.push("Hệ thống chưa nhận được trạng thái Trò chơi (isGameEnabled undefined). Vui lòng kiểm tra lại cấu hình node 'game_settings' trên Firebase.");
        } else {
            passes++;
        }
        // === KẾT LUẬN VÀ IN BÁO CÁO ===
        statusText.innerHTML = `<span style="color: #2c3e50; font-weight: bold;">Hoàn tất quét hệ thống!</span>`;

        if (errors.length === 0 && warnings.length === 0) {
            addLog(`Hệ thống đang hoạt động hoàn hảo. (Vượt qua ${passes}/5 bài test lõi)`, 'success');
        } else {
            addLog(`Vượt qua ${passes} bài kiểm tra an toàn.`, 'success');
            warnings.forEach(w => addLog(w, 'warn'));
            errors.forEach(e => addLog(e, 'error'));
        }

    } catch (criticalError) {
        statusText.innerHTML = `<span style="color: #e11d48; font-weight: bold;">Lỗi nghiêm trọng khi đang quét hệ thống!</span>`;
        addLog(`Crashed: ${criticalError.message}`, 'error');
    }
};

// Lắng nghe sự kiện click trên toàn bộ tài liệu
document.addEventListener('click', function (event) {
    // Kiểm tra xem vị trí ngón tay chạm vào có phải là lớp phủ mờ (overlay) không
    if (event.target.classList.contains('modal-overlay') || event.target.classList.contains('student-modal-overlay')) {

        // Tìm nút "X" (close-btn) hoặc nút "Hủy" (btn-cancel) bên trong popup đó
        const closeBtn = event.target.querySelector('.close-btn') || event.target.querySelector('.btn-cancel');

        if (closeBtn) {
            // Tự động kích hoạt nút đóng để chạy các hàm dọn dẹp dữ liệu nếu có
            closeBtn.click();
        } else {
            // Phương án dự phòng: Nếu popup không có nút X, tự ép đóng bằng cách xóa class active
            event.target.classList.remove('active');
            event.target.style.display = 'none';
        }
    }
});

// === HỆ THỐNG AUTO-SAVE DỮ LIỆU NHÁP ===

/**
 * Hàm thiết lập tự động lưu nháp cho một ô nhập liệu (input/textarea)
 * @param {HTMLElement} inputElement - Thẻ input hoặc textarea cần lưu nháp
 * @param {string} storageKey - Khóa lưu trữ duy nhất trong localStorage (VD: 'draft_teacher_assign')
 */
window.setupAutoSave = function (inputElement, storageKey) {
    if (!inputElement) return;

    // 1. Phục hồi dữ liệu nếu có bản nháp từ trước
    const savedDraft = localStorage.getItem(storageKey);
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
            localStorage.setItem(storageKey, inputElement.value);
        }, 1000); // Đợi người dùng ngừng gõ 1 giây mới tiến hành lưu
    };

    // 3. Lắng nghe sự kiện gõ phím
    inputElement.addEventListener('input', saveToLocal);
};

/**
 * Hàm xóa bản nháp (gọi hàm này SAU KHI người dùng đã nộp bài/lưu bài thành công)
 */
window.clearAutoSave = function (storageKey) {
    localStorage.removeItem(storageKey);
};

// ==============================================================
// BỘ XEM TRỰC TIẾP TỆP/LINK TRÊN WEB (ẢNH, PDF, DOCX, URL)
// ==============================================================
(function () {
    const registry =
        window.__filePreviewRegistry =
        window.__filePreviewRegistry || {};

    let previewCounter = 0;

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
            alert(
                'Không tìm thấy dữ liệu tài liệu để mở.'
            );

            return;
        }

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
                        let arrayBuffer;

                        // DOCX được lưu Base64 trong Firebase
                        if (
                            item.url.startsWith(
                                'data:'
                            )
                        ) {
                            arrayBuffer =
                                dataUrlToArrayBuffer(
                                    item.url
                                );
                        } else {
                            // DOCX dạng link công khai
                            const response =
                                await fetch(item.url);

                            if (!response.ok) {
                                throw new Error(
                                    'Không tải được DOCX'
                                );
                            }

                            arrayBuffer =
                                await response.arrayBuffer();
                        }

                        const result =
                            await window.mammoth
                                .convertToHtml({
                                    arrayBuffer:
                                        arrayBuffer
                                });

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
                alert(
                    'Trình duyệt đang chặn cửa sổ mới. Vui lòng cho phép pop-up cho trang này.'
                );
            }
        };

    // Đóng cửa sổ xem file
    window.closeFilePreview = function () {
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