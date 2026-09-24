(() => {
    'use strict';

    /*
     * Ghi nhớ tương tác đầu tiên ngay từ <head>. MusicManager được lazy-load
     * nên trên một số Safari/WebView cũ navigator.userActivation không có; nếu
     * người dùng đã chạm trước khi MusicManager xuất hiện thì nhạc từng bỏ lỡ
     * lần kích hoạt đó và chờ một lần chạm khác.
     */
    if (window.__studentMusicActivationTrackerInstalled !== true) {
        window.__studentMusicActivationTrackerInstalled = true;

        const activationEvents = [
            'pointerdown',
            'touchstart',
            'keydown',
            'click'
        ];

        const markMusicActivated = () => {
            window.__studentMusicUserActivated = true;
            activationEvents.forEach(eventName => {
                document.removeEventListener(
                    eventName,
                    markMusicActivated,
                    true
                );
            });
        };

        if (
            navigator.userActivation &&
            navigator.userActivation.hasBeenActive === true
        ) {
            markMusicActivated();
        } else {
            activationEvents.forEach(eventName => {
                document.addEventListener(
                    eventName,
                    markMusicActivated,
                    true
                );
            });
        }
    }

    if (window.StudentFeatureLoader) return;

    const VERSION = '3.4.9-autumn-premium-v1';

    const cssPromises = new Map();
    const scriptPromises = new Map();
    const groupPromises = new Map();

    // Khi người dùng đã mở khu vực Cửa hàng, CSS của THẺ vật phẩm
    // được giữ đầy đủ cho cả Cửa hàng thường và Cửa hàng Sang trọng.
    // Cờ này chỉ ghim CSS card; runtime Theme/Effect/Pet vẫn selective.
    let storeCardCssPinned = false;

    const CSS = Object.freeze({
        storeBase: 'css/store-items.css?v=20260917.frame-runtime-barrier-v1',
        effectsBase: 'css/effects-pets.css?v=20260917.frame-runtime-barrier-v1',

        royalBall: 'css/royal-ball.css?v=3.8',
        dailyLogin: 'css/daily-login.css?v=3.8',
        leaderboard: 'css/leaderboard.css?v=20260905.redo-scope-v1',
        painting: 'css/painting.css?v=3.8',
        history: 'css/lich-su-hao-hung.css?v=20260831.1',
        bellum: 'css/bellum-event.css?v=20260912.4',
        midAutumnFestival: 'css/mid-autumn-festival.css?v=20260914.4-balanced-games',

        collections: 'css/store-collections.css?v=20260908.four-seasons-lock-v1',
        luxury: 'css/luxury-store.css?v=3.8',
        camMong: 'css/cam-co-cam-mong.css?v=20260917.frame-runtime-barrier-v1',
        midAutumnMoon: 'css/trung-thu-nguyet-cung.css?v=20260917.frame-runtime-barrier-v1',

        lotm: 'css/lord-of-mysteries.css?v=3.3',
        lotmKlein: 'css/lord-of-mysteries-klein.css?v=20260917.frame-runtime-barrier-v1',
        legendary: 'css/legendery.css?v=20260917.frame-runtime-barrier-v1',
        doraemon: 'css/doraemon.css?v=3.8',
        paintingItems: 'css/hoi-hoa.css?v=3.8',
        sevenSins: 'css/that-dai-toi.css?v=3.8',
        birthday: 'css/pet-sinh-nhat.css?v=3.8',
        weather: 'css/thoi-tiet.css?v=3.8',
        seasons: 'css/premium-mua-xuan.css?v=20260924.autumn-premium-v1',
        nationalDay: 'css/quoc-khanh-pet.css?v=20260917.frame-runtime-barrier-v1',
        nyx: 'css/nyx-than-thoai.css?v=20260917.frame-runtime-barrier-v1',
        aether: 'css/aether-than-thoai.css?v=20260917.aether-frame-v1',
        tamon: 'css/tamon-b-side.css?v=20260917.frame-runtime-barrier-v1',
        linkClickCheng: 'css/link-click-cheng-xiaoshi.css?v=20260917.frame-runtime-barrier-v1'
    });

    const SCRIPT = Object.freeze({
        themeItems: 'js/theme-items.js?v=20260924.decor-pet-integrity-v1',
        effectItems: 'js/effect-items.js?v=4.2',
        petItems: 'js/pet-items.js?v=20260924.autumn-premium-v1',
        petInteractions: 'js/pet-interactions.js?v=20260924.decor-pet-integrity-v1',
        musicManager: 'js/music-manager.js?v=20260910.music-reliability-v3',
        storeManager: 'js/store-manager.js?v=20260923.store-integrity-v1',

        luxuryStore: 'js/luxury-store.js?v=20260924.autumn-premium-v1',
        collections: 'js/store-collections.js?v=20260923.store-integrity-v1',

        royalBall: 'js/royal-ball.js?v=20260924.event-integrity-v1',
        leaderboard: 'js/leaderboard.js?v=20260924.reward-integrity-v1',
        painting: 'js/painting.js?v=20260924.event-integrity-v1',
        history: 'js/lich-su-hao-hung.js?v=20260924.event-integrity-v1',
        bellum: 'js/bellum-event.js?v=20260924.event-integrity-v1',
        midAutumnFestival: 'js/mid-autumn-festival.js?v=20260924.1-rules-authority-fix',

        dailyLogin: 'js/daily-login.js?v=20260924.reward-integrity-v1',
        guide: 'js/huong-dan-nguoi-moi.js?v=2.14.2'
    });

    /*
     * EXACT FRAME CSS ROUTER v1
     * Khung avatar không được phụ thuộc vào việc mở Cửa hàng.
     */
    const FRAME_RUNTIME_CSS_BY_ID = Object.freeze({
        frame_lotm_klein_gray_fog_ring_event: Object.freeze([CSS.lotmKlein]),
        frame_mua_ha_nhat_diep_chi_hoan: Object.freeze([CSS.seasons]),
        frame_premium_mua_xuan_hoa_mong: Object.freeze([CSS.seasons]),
        frame_quoc_khanh_viet_dieu_quoc_an: Object.freeze([CSS.nationalDay]),
        frame_tamon_bside_signal_ring: Object.freeze([CSS.tamon]),
        frame_truyenthuyet_nyx_hac_nguyet_chi_hoan: Object.freeze([
            CSS.nyx,
            CSS.legendary
        ]),
        frame_truyenthuyet_aether_thien_quang_chi_hoan: Object.freeze([
            CSS.aether
        ]),
        frame_cam_mong_thanh_huyen_chi_hoan: Object.freeze([CSS.camMong]),
        frame_trung_thu_chu_cuoi_que_anh_chi_hoan: Object.freeze([CSS.midAutumnMoon]),
        frame_trung_thu_nguyet_que_hoa_hoan: Object.freeze([CSS.midAutumnMoon]),
        frame_linkclick_cheng_xiaoshi_time_window: Object.freeze([CSS.linkClickCheng])
    });

    /*
     * Fallback chỉ gồm CSS có runtime khung, không phải toàn bộ Cửa hàng.
     */
    const FRAME_RUNTIME_CSS_FALLBACK = Object.freeze([
        CSS.lotmKlein,
        CSS.seasons,
        CSS.nationalDay,
        CSS.tamon,
        CSS.nyx,
        CSS.legendary,
        CSS.camMong,
        CSS.midAutumnMoon,
        CSS.linkClickCheng
    ]);

    const ALL_SPECIAL_STORE_CSS = Object.freeze([
        CSS.camMong,
        CSS.midAutumnMoon,
        CSS.lotm,
        CSS.lotmKlein,
        CSS.legendary,
        CSS.doraemon,
        CSS.paintingItems,
        CSS.sevenSins,
        CSS.birthday,
        CSS.weather,
        CSS.seasons,
        CSS.nationalDay,
        CSS.nyx,
        CSS.aether,
        CSS.tamon,
        CSS.linkClickCheng
    ]);

    function normalizeResourceUrl(url) {
        try {
            return new URL(url, document.baseURI).href;
        } catch (_) {
            return String(url || '');
        }
    }

    function normalizeStylesheetIdentity(url) {
        try {
            const parsed = new URL(url, document.baseURI);
            parsed.search = '';
            parsed.hash = '';
            return parsed.href;
        } catch (_) {
            return String(url || '')
                .split('#', 1)[0]
                .split('?', 1)[0];
        }
    }

    function hasStylesheet(url) {
        const wanted = normalizeStylesheetIdentity(url);

        return [...document.querySelectorAll('link[rel="stylesheet"]')]
            .some(link =>
                normalizeStylesheetIdentity(link.href) === wanted
            );
    }

    function hasScript(url) {
        const wanted = normalizeResourceUrl(url);

        return [...document.scripts]
            .some(script =>
                script.src &&
                normalizeResourceUrl(script.src) === wanted
            );
    }

    function loadCss(url) {
        if (!url) return Promise.resolve();

        // CSS cùng pathname chỉ được nạp một lần; ?v= chỉ dùng cache-busting.
        const key = normalizeStylesheetIdentity(url);

        // Thẻ đã có trong DOM vẫn có thể đang tải. Các caller phải cùng
        // chờ Promise của lần nạp đầu tiên, kể cả khi khác query version.
        if (cssPromises.has(key)) {
            return cssPromises.get(key);
        }

        if (hasStylesheet(url)) {
            return Promise.resolve(key);
        }

        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.dataset.studentLazyCss = '1';

            link.onload = () => resolve(key);
            link.onerror = () => {
                link.remove();
                cssPromises.delete(key);
                reject(
                    new Error(
                        `Không tải được CSS: ${url}`
                    )
                );
            };

            document.head.appendChild(link);
        });

        cssPromises.set(key, promise);
        return promise;
    }


    // ======================================================
    // FIRST-PAINT HOTFIX · TOP ACTIONS + AVATAR FRAME
    // ======================================================
    // Cửa hàng đang lazy-load. Vì vậy các nút hành động và host khung avatar
    // không được phụ thuộc vào việc người dùng đã mở tab Cửa hàng hay chưa.
    // CSS tối thiểu này được gắn ngay từ <head>; student.js vẫn khóa geometry
    // bằng inline !important để chống CSS theme/mobile tải sau.
    function installCriticalStudentActionCss() {
        const STYLE_ID =
            'student-top-actions-critical-first-paint-v9-floating-v3';

        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style =
            document.createElement('style');

        style.id = STYLE_ID;
        style.textContent = `
html[data-app-role="student"] body .dashboard > .content {
    position: relative !important;
}

.dashboard > .content > #studentTopActionsFlow.student-top-actions-flow {
    position: absolute !important;
    top: 20px !important;
    right: auto !important;
    bottom: auto !important;
    left: calc(100% - 231px) !important;
    inset: auto !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 9px !important;
    width: max-content !important;
    max-width: calc(100% - 48px) !important;
    min-height: 44px !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    pointer-events: none !important;
    z-index: 500 !important;
}

/*
 * Trước khi student.js kịp chuẩn hóa 4 nút,
 * vô hiệu hóa CSS legacy đặt vị trí riêng cho từng nút. Vị trí của cụm
 * thuộc về #studentTopActionsFlow bên trong .content; mỗi nút chỉ relative.
 */
html[data-app-role="student"] body .dashboard > .content > :is(
    .leaderboard-trigger-btn,
    #btnLeaderboard,
    .bag-trigger-btn,
    .inbox-trigger-btn,
    .profile-trigger-btn
) {
    position: relative !important;
    top: auto !important;
    right: auto !important;
    bottom: auto !important;
    left: auto !important;
    inset: auto !important;
    float: none !important;
    transform: none !important;
}

#studentTopActionsFlow.student-top-actions-flow > :is(
    .leaderboard-trigger-btn,
    #btnLeaderboard,
    .bag-trigger-btn,
    .inbox-trigger-btn,
    .profile-trigger-btn
) {
    position: relative !important;
    inset: auto !important;
    width: 44px !important;
    min-width: 44px !important;
    max-width: 44px !important;
    height: 44px !important;
    min-height: 44px !important;
    max-height: 44px !important;
    flex: 0 0 44px !important;
    margin: 0 !important;
    padding: 0 !important;
    float: none !important;
    pointer-events: auto !important;
    transform: none !important;
}

#studentTopActionsFlow.student-top-actions-flow > :is(
    .bag-trigger-btn,
    .inbox-trigger-btn,
    .profile-trigger-btn
) {
    display: grid !important;
    place-items: center !important;
}

/*
 * Trạng thái KHÔNG đeo khung.
 * Hồ sơ là avatar TRÒN riêng, không dùng hình vuông bo 14px của Túi/Hộp thư.
 * Kích thước ảnh dùng px tuyệt đối theo host 40/44px để tránh percentage/grid
 * làm ảnh bị co ngang thành oval trên một số trình duyệt/DPI.
 */
#studentTopActionsFlow.student-top-actions-flow
> .profile-trigger-btn:not(.avatar-frame-equipped):not([data-avatar-frame-id]):not([data-avatar-frame-effect]) {
    overflow: hidden !important;
    border-radius: 50% !important;
    background: rgba(255,255,255,.78) !important;
    border: 1px solid rgba(255,255,255,.92) !important;
    box-shadow: 0 8px 22px rgba(15,23,42,.10) !important;
    isolation: isolate !important;
    z-index: 1 !important;
    aspect-ratio: 1 / 1 !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
}

#studentTopActionsFlow.student-top-actions-flow
> .profile-trigger-btn:not(.avatar-frame-equipped):not([data-avatar-frame-id]):not([data-avatar-frame-effect])
> #avatarImage {
    display: block !important;
    width: 42px !important;
    height: 42px !important;
    min-width: 42px !important;
    min-height: 42px !important;
    max-width: 42px !important;
    max-height: 42px !important;
    flex: 0 0 42px !important;
    aspect-ratio: 1 / 1 !important;
    box-sizing: border-box !important;
    object-fit: cover !important;
    object-position: center center !important;
    border-radius: 50% !important;
    position: relative !important;
    inset: auto !important;
    transform: none !important;
}

#studentTopActionsFlow.student-top-actions-flow
> .profile-trigger-btn:is(
    .avatar-frame-equipped,
    [data-avatar-frame-id],
    [data-avatar-frame-effect]
) {
    overflow: visible !important;
    border-radius: 50% !important;
    isolation: isolate !important;
    z-index: 4 !important;
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
}

#studentTopActionsFlow.student-top-actions-flow
> .profile-trigger-btn:is(
    .avatar-frame-equipped,
    [data-avatar-frame-id],
    [data-avatar-frame-effect]
)
> :is(
    .avatar-frame-decoration,
    .avatar-frame-aura,
    .avatar-frame-spark,
    [class*="-frame-decoration"],
    [class*="-frame-aura"],
    [class*="-frame-rune"],
    [class*="-frame-glint"]
) {
    position: absolute !important;
    pointer-events: none !important;
}
#studentTopActionsFlow.student-top-actions-flow
> :is(.bag-trigger-btn, .inbox-trigger-btn) {
    display: grid !important;
    place-items: center !important;
    border: 1px solid rgba(255,255,255,.92) !important;
    border-radius: 14px !important;
    background: rgba(255,255,255,.84) !important;
    font-size: 1.2rem !important;
    line-height: 1 !important;
    box-shadow: 0 12px 28px rgba(15,23,42,.16), 0 2px 8px rgba(15,23,42,.08) !important;
    visibility: visible !important;
    opacity: 1 !important;
}

#studentTopActionsFlow.student-top-actions-flow
> :is(.leaderboard-trigger-btn, #btnLeaderboard, .profile-trigger-btn) {
    visibility: visible !important;
    opacity: 1 !important;
}

@media (max-width: 768px) {
    .dashboard > .content > #studentTopActionsFlow.student-top-actions-flow {
        position: absolute !important;
        top: 15px !important;
        right: auto !important;
        left: calc(100% - 196px) !important;
        max-width: none !important;
        min-height: 40px !important;
        margin: 0 !important;
        gap: 7px !important;
    }

    #studentTopActionsFlow.student-top-actions-flow > :is(
        .leaderboard-trigger-btn,
        #btnLeaderboard,
        .bag-trigger-btn,
        .inbox-trigger-btn,
        .profile-trigger-btn
    ) {
        width: 40px !important;
        min-width: 40px !important;
        max-width: 40px !important;
        height: 40px !important;
        min-height: 40px !important;
        max-height: 40px !important;
        flex-basis: 40px !important;
    }

    #studentTopActionsFlow.student-top-actions-flow
    > .profile-trigger-btn:not(.avatar-frame-equipped):not([data-avatar-frame-id]):not([data-avatar-frame-effect])
    > #avatarImage {
        width: 38px !important;
        height: 38px !important;
        min-width: 38px !important;
        min-height: 38px !important;
        max-width: 38px !important;
        max-height: 38px !important;
        flex-basis: 38px !important;
    }
}
        `;

        document.head.appendChild(style);
    }

    function loadScript(url) {
        if (!url) return Promise.resolve();

        const key = normalizeResourceUrl(url);

        // Không coi script đã append là script đã thực thi xong.
        if (scriptPromises.has(key)) {
            return scriptPromises.get(key);
        }

        if (hasScript(url)) {
            return Promise.resolve(key);
        }

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = false;
            script.dataset.studentLazyScript = '1';

            script.onload = () => resolve(key);
            script.onerror = () => {
                script.remove();
                scriptPromises.delete(key);
                reject(
                    new Error(
                        `Không tải được module: ${url}`
                    )
                );
            };

            (document.body || document.head)
                .appendChild(script);
        });

        scriptPromises.set(key, promise);
        return promise;
    }

    async function loadScriptsSequentially(urls) {
        for (const url of urls) {
            await loadScript(url);
        }
    }

    function addRuntimeCssValue(target, value) {
        if (!value) return;

        const values =
            Array.isArray(value)
                ? value
                : [value];

        values.forEach(url => {
            const normalized =
                String(url || '').trim();

            if (normalized) {
                target.add(normalized);
            }
        });
    }

    function getSpecialCssForItemDefinition(itemDef) {
        const result = new Set();

        if (!itemDef || typeof itemDef !== 'object') {
            return [];
        }

        addRuntimeCssValue(
            result,
            itemDef.runtimeCss
        );

        const id =
            String(itemDef.id || '')
                .trim()
                .toLowerCase();

        const exact =
            FRAME_RUNTIME_CSS_BY_ID[id];

        if (exact) {
            exact.forEach(url => result.add(url));
        }

        getSpecialCssForItemId(id)
            .forEach(url => result.add(url));

        if (
            String(itemDef.type || '').toLowerCase() === 'frame' &&
            result.size === 0
        ) {
            FRAME_RUNTIME_CSS_FALLBACK
                .forEach(url => result.add(url));
        }

        return [...result];
    }

    function getSpecialCssForItemId(itemId) {
        const id =
            String(itemId || '')
                .trim()
                .toLowerCase();

        if (!id) return [];

        const result = new Set();

        const exactFrameCss =
            FRAME_RUNTIME_CSS_BY_ID[id];

        if (exactFrameCss) {
            exactFrameCss.forEach(url =>
                result.add(url)
            );
        }

        /*
         * LORD OF THE MYSTERIES · KLEIN EVENT SUITE
         * Tất cả item có namespace lotm_klein (pet/chibi/frame/background)
         * dùng lord-of-mysteries-klein.css. Trước đây chỉ pet chính được nhận
         * diện, nên frame/background bị rơi sang lord-of-mysteries.css và chỉ
         * hiển thị đúng sau khi mở Cửa hàng (store-ui tải toàn bộ special CSS).
         */
        const isLotmKleinEvent =
            id === 'pet_lotm_klein_event_1' ||
            id.includes('lotm_klein');

        if (isLotmKleinEvent) {
            result.add(CSS.lotmKlein);
        } else if (/(lotm|amon|klein|audrey|susie)/.test(id)) {
            result.add(CSS.lotm);
        }

        if (
            /(truyenthuyet|truyen_thuyet|legend|chronos|aether|thanatos|seraph|cupid|nguulang|ngu_lang|chucnu|chuc_nu|famine|pestilence)/.test(id)
        ) {
            result.add(CSS.legendary);
        }

        if (/doraemon/.test(id)) {
            result.add(CSS.doraemon);
        }

        if (/(hoihoa|hoi_hoa|painting|hoa_si)/.test(id)) {
            result.add(CSS.paintingItems);
        }

        if (/(thatdaitoi|that_dai_toi|acedia|seven_sins)/.test(id)) {
            result.add(CSS.sevenSins);
        }

        if (/(sinh_nhat|birthday)/.test(id)) {
            result.add(CSS.birthday);
        }

        if (/(thoi_tiet|weather|mua_ngoai_o_cua)/.test(id)) {
            result.add(CSS.weather);
        }

        if (/(premium_mua_xuan|mua_xuan|mua_ha|premium_mua_thu|mua_thu|autumn|summer|spring)/.test(id)) {
            result.add(CSS.seasons);
        }

        if (/(quoc_khanh|national_day|viet_dieu)/.test(id)) {
            result.add(CSS.nationalDay);
        }

        if (/nyx/.test(id)) {
            result.add(CSS.nyx);
            result.add(CSS.legendary);
        }

        if (/(cam_mong|cam-mong|cam_co|cam-co|camco)/.test(id)) {
            result.add(CSS.camMong);
        }

        if (/(trung_thu|trung-thu|midautumn|mid_autumn|nguyet_cung|chu_cuoi)/.test(id)) {
            result.add(CSS.midAutumnMoon);
        }

        if (/tamon/.test(id)) {
            result.add(CSS.tamon);
        }

        if (/(linkclick|link_click|cheng_xiaoshi|cheng-xiaoshi)/.test(id)) {
            result.add(CSS.linkClickCheng);
        }

        return [...result];
    }

    async function preloadEquippedCss(items) {
        const list =
            Array.isArray(items)
                ? items
                : [];

        const urls = new Set([
            CSS.effectsBase,
            CSS.storeBase
        ]);

        list.forEach(item => {
            const itemId =
                typeof item === 'string'
                    ? item
                    : item?.id;

            const itemDef =
                (
                    item &&
                    typeof item === 'object' &&
                    String(item.type || '')
                )
                    ? item
                    : getCatalogItemById(itemId);

            const cssList =
                itemDef
                    ? getSpecialCssForItemDefinition(itemDef)
                    : getSpecialCssForItemId(itemId);

            cssList.forEach(url =>
                urls.add(url)
            );
        });

        await Promise.all(
            [...urls].map(loadCss)
        );

        const ids =
            list
                .map(item =>
                    typeof item === 'string'
                        ? item
                        : item?.id
                )
                .filter(Boolean)
                .map(String);

        window.dispatchEvent(
            new CustomEvent(
                'student-equipped-css-ready',
                {
                    detail: {
                        ids,
                        version: VERSION
                    }
                }
            )
        );

        return true;
    }

    async function preloadAllStoreCardCss() {
        /*
         * STORE CARD FULL MODE v3.3
         * Khi vào Cửa hàng, hiệu ứng/skin của THẺ phải đầy đủ ở CẢ HAI cửa hàng.
         * Chỉ tải CSS hiển thị card; không tự kích hoạt runtime vật phẩm.
         */
        storeCardCssPinned = true;

        try {
            await Promise.all([
                loadCss(CSS.storeBase),
                loadCss(CSS.luxury),
                loadCss(CSS.collections)
            ]);

            await Promise.all(
                ALL_SPECIAL_STORE_CSS.map(loadCss)
            );

            document.documentElement.dataset.storeCardCssReady = 'true';
            return true;
        } catch (error) {
            storeCardCssPinned = false;
            delete document.documentElement.dataset.storeCardCssReady;
            throw error;
        }
    }

    function releaseUnusedSpecialCss(items) {
        /*
         * Khi Cửa hàng đã mở, không được tháo CSS card vì sẽ làm thẻ trắng/vỡ.
         * Runtime vật phẩm vẫn được dọn bởi Manager riêng; CSS card không chạy
         * world/pet/effect nếu class kích hoạt tương ứng không tồn tại.
         */
        if (storeCardCssPinned) {
            return;
        }

        const list = Array.isArray(items) ? items : [];
        const keep = new Set();

        list.forEach(item => {
            const id =
                typeof item === 'string'
                    ? item
                    : item?.id;

            const itemDef =
                (
                    item &&
                    typeof item === 'object' &&
                    item.type
                )
                    ? item
                    : getCatalogItemById(id);

            const cssList =
                itemDef
                    ? getSpecialCssForItemDefinition(itemDef)
                    : getSpecialCssForItemId(id);

            cssList.forEach(url =>
                keep.add(
                    normalizeStylesheetIdentity(url)
                )
            );
        });

        const special = new Set(
            ALL_SPECIAL_STORE_CSS.map(normalizeStylesheetIdentity)
        );

        document
            .querySelectorAll('link[data-student-lazy-css="1"]')
            .forEach(link => {
                const key = normalizeStylesheetIdentity(link.href);
                if (!special.has(key) || keep.has(key)) return;
                link.remove();
                cssPromises.delete(key);
            });
    }

    function preloadFromLocalStorage() {
        /*
         * K2: localStorage visual keys là dữ liệu do người dùng sửa được.
         * Không preload CSS/runtime từ chúng. Firebase inventory sau Auth mới quyết định
         * item nào thực sự cần ensureForEquippedItems()/preloadEquippedCss().
         */
        [
            'active_theme',
            'active_effect',
            'active_pet',
            'active_frame',
            'active_background'
        ].forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (_) {}
        });

        return false;
    }

    const groupLoaders = {
        async 'music-runtime'() {
            /*
             * Nhạc nền không cần Theme/Effect/Pet. Tải MusicManager + StoreConfig
             * trước để máy yếu không phải chờ toàn bộ visual runtime mới có nhạc.
             */
            await loadScriptsSequentially([
                SCRIPT.musicManager,
                SCRIPT.storeManager
            ]);
        },

        /*
         * SELECTIVE ITEM RUNTIME v3
         * Mỗi nhóm chỉ nạp code thật sự cần cho loại vật phẩm đang trang bị.
         * Mức High/Medium/Low KHÔNG làm thay đổi quy tắc selective-load;
         * EffectQualityManager chỉ quyết định mật độ/chi phí hiệu ứng sau khi runtime đã nạp.
         */
        async 'theme-runtime'() {
            await loadCss(CSS.storeBase);
            await loadScriptsSequentially([
                SCRIPT.themeItems,
                SCRIPT.storeManager
            ]);
        },

        async 'effect-runtime'() {
            await Promise.all([
                loadCss(CSS.storeBase),
                loadCss(CSS.effectsBase)
            ]);
            await loadScriptsSequentially([
                SCRIPT.effectItems,
                SCRIPT.storeManager
            ]);
        },

        async 'pet-runtime'() {
            await Promise.all([
                loadCss(CSS.storeBase),
                loadCss(CSS.effectsBase)
            ]);
            await loadScriptsSequentially([
                SCRIPT.petItems,
                SCRIPT.petInteractions,
                SCRIPT.storeManager
            ]);
        },

        async 'frame-background-runtime'() {
            await loadCss(CSS.storeBase);
            await loadScript(SCRIPT.storeManager);
        },

        async 'luxury-runtime'() {
            /* Luxury hiện tại là pet runtime + bộ đăng ký/runtime riêng. */
            await ensure('pet-runtime');
            await loadCss(CSS.luxury);
            await loadScript(SCRIPT.luxuryStore);
        },

        async 'visual-runtime'() {
            /*
             * Compatibility path: chỉ dùng cho màn hình cần toàn bộ catalog/runtime
             * (Cửa hàng, một số game cũ). Startup vật phẩm KHÔNG đi qua nhánh này nữa.
             */
            await Promise.all([
                ensure('theme-runtime'),
                ensure('effect-runtime'),
                ensure('pet-runtime'),
                ensure('music-runtime')
            ]);
        },

        async 'store-ui'() {
            /*
             * Hai cửa hàng luôn hiển thị đầy đủ hiệu ứng THẺ.
             * Card CSS được nạp toàn bộ khi bước vào Cửa hàng, nhưng runtime vật phẩm
             * vẫn phân loại riêng:
             * - Cửa hàng thường: Theme / Effect / Pet dùng đúng manager của loại đó.
             * - Cửa hàng Sang trọng: 1 item kích hoạt full-suite theo ID của item.
             *
             * pet-runtime được nạp trước luxury-store.js để hook full-suite Luxury
             * luôn được cài ngay, kể cả khi người dùng trang bị trực tiếp từ store.
             */
            await Promise.all([
                ensure('pet-runtime'),
                ensure('frame-background-runtime'),
                preloadAllStoreCardCss()
            ]);

            await loadScriptsSequentially([
                SCRIPT.collections,
                SCRIPT.luxuryStore
            ]);
        },

        async leaderboard() {
            /*
             * BXH có nút truy cập ở mọi tab, nên tải riêng sau khi core đã mở.
             * Không kéo Royal Ball / Hội họa / toàn bộ visual runtime chỉ để hiện nút.
             */
            await loadCss(CSS.leaderboard);
            await loadScript(SCRIPT.leaderboard);
        },

        async game() {
            /*
             * Royal Ball và một số phần thưởng game tra StoreConfig.
             * Visual runtime được nạp trước nhưng không kéo CSS đặc biệt của store.
             */
            await ensure('visual-runtime');

            await Promise.all([
                loadCss(CSS.royalBall),
                loadCss(CSS.leaderboard),
                loadCss(CSS.painting)
            ]);

            await loadScriptsSequentially([
                SCRIPT.royalBall,
                SCRIPT.leaderboard,
                SCRIPT.painting
            ]);
        },

        async 'history-event'() {
            await loadCss(CSS.history);
            await loadScript(SCRIPT.history);
        },

        async 'bellum-event'() {
            // Chỉ nạp bộ điều khiển + giao diện khung. 20 cảnh được lazy-load riêng
            // khi người chơi bước vào từng cảnh, đúng cấu trúc 1 JS + 1 CSS / cảnh.
            await loadCss(CSS.bellum);
            await loadScript(SCRIPT.bellum);
        },

        async 'mid-autumn-festival'() {
            // Đại Hội Trung Thu tự chèn card/modal vào tab Trò chơi.
            // Chỉ cần 1 JS + 1 CSS; dùng MidAutumnCalendar/MidAutumnCoinManager có sẵn trong student.js.
            await loadCss(CSS.midAutumnFestival);
            await loadScript(SCRIPT.midAutumnFestival);
        },

        async 'daily-login'() {
            await loadCss(CSS.dailyLogin);
            await loadScript(SCRIPT.dailyLogin);
        },

        async guide() {
            await loadScript(SCRIPT.guide);
        }
    };

    async function ensure(groupName) {
        const name =
            String(groupName || '').trim();

        if (!name) return;

        if (groupPromises.has(name)) {
            return groupPromises.get(name);
        }

        const loader =
            groupLoaders[name];

        if (typeof loader !== 'function') {
            throw new Error(
                `Nhóm lazy-load không tồn tại: ${name}`
            );
        }

        const promise = (async () => {
            await loader();

            window.dispatchEvent(
                new CustomEvent(
                    'student-feature-loaded',
                    {
                        detail: {
                            group: name,
                            version: VERSION
                        }
                    }
                )
            );

            return name;
        })().catch(error => {
            groupPromises.delete(name);
            throw error;
        });

        groupPromises.set(name, promise);
        return promise;
    }

    async function ensureForTab(tabId) {
        const id =
            String(tabId || '');

        if (id === 'tab-store') {
            await ensure('store-ui');
            return;
        }

        if (id === 'tab-game') {
            await Promise.all([
                ensure('game'),
                ensure('history-event'),
                ensure('bellum-event'),
                ensure('mid-autumn-festival')
            ]);
            return;
        }

        if (id === 'tab-settings') {
            /*
             * Cài đặt có các control pet/effect.
             * Chỉ nạp runtime, không nạp toàn bộ CSS Store.
             */
            await ensure('visual-runtime');
        }
    }

    const LUXURY_ITEM_IDS = new Set([
        'pet_luxury_mua_xuan',
        'pet_luxury_mua_ha',
        'pet_luxury_mua_thu',
        'pet_quoc_khanh_1',
        'pet_mythic_nyx_1',
        'pet_mythic_aether_1',
        'pet_dem_day_sao_1',
        'pet_lotm_klein_event_1',
        'pet_cam_co_cam_mong_1',
        'pet_tamon_b_side_1',
        'pet_tamon_b_side_2',
        'pet_trung_thu_nguyet_cung_tien_tu',
        'pet_trung_thu_chu_cuoi_2',
        'pet_linkclick_cheng_xiaoshi_1'
    ]);

    function getCatalogItemById(itemId) {
        const id = String(itemId || '').trim();
        if (!id) return null;

        try {
            if (
                typeof StoreConfig !== 'undefined' &&
                Array.isArray(StoreConfig?.items)
            ) {
                return StoreConfig.items.find(item =>
                    String(item?.id || '') === id
                ) || null;
            }
        } catch (_) { }

        return null;
    }

    function inferNormalRuntimeGroup(itemId, itemDef = null) {
        /*
         * CỬA HÀNG THƯỜNG:
         * quyết định runtime theo TYPE thật của StoreConfig trước,
         * không gộp Theme/Effect/Pet vào cùng một runtime.
         */
        const type = String(itemDef?.type || '')
            .trim()
            .toLowerCase();

        if (type === 'theme') return 'theme-runtime';
        if (type === 'effect') return 'effect-runtime';
        if (type === 'pet') return 'pet-runtime';
        if (type === 'music') return 'music-runtime';
        if (type === 'frame' || type === 'background') {
            return 'frame-background-runtime';
        }

        // Fallback cho dữ liệu cũ khi catalog chưa có type.
        const id = String(itemId || '').trim().toLowerCase();
        if (/^theme(?:_|-)/.test(id)) return 'theme-runtime';
        if (/^effect(?:_|-)/.test(id)) return 'effect-runtime';
        if (/^pet(?:_|-)/.test(id)) return 'pet-runtime';
        if (/^music(?:_|-)/.test(id)) return 'music-runtime';
        if (/^(frame|background)(?:_|-)/.test(id)) {
            return 'frame-background-runtime';
        }

        return 'visual-runtime';
    }

    async function ensureForEquippedItems(items) {
        const equipped =
            (Array.isArray(items) ? items : [])
                .filter(item =>
                    item &&
                    item.isEquipped === true
                );

        if (!equipped.length) {
            return false;
        }

        /*
         * Nạp catalog nhẹ trước để phân biệt chính xác item thường/Luxury
         * và lấy type thật của item thường.
         */
        await ensure('frame-background-runtime');

        /*
         * CSS runtime của item đang trang bị phải sẵn sàng trước khi mount.
         * Nếu Store UI đã mở thì CSS card đã được ghim và hàm release sẽ không gỡ.
         */
        const equippedDefinitions =
            equipped.map(inventoryItem => {
                const itemDef =
                    getCatalogItemById(
                        inventoryItem?.id
                    );

                return itemDef || inventoryItem;
            });

        await preloadEquippedCss(
            equippedDefinitions
        );
        releaseUnusedSpecialCss(
            equippedDefinitions
        );

        const needs = new Set();
        const unresolvedEquippedIds = [];

        for (const inventoryItem of equipped) {
            const rawId = String(inventoryItem?.id || '').trim();
            const id = rawId.toLowerCase();
            if (!id) continue;

            const itemDef = getCatalogItemById(rawId);

            /*
             * CỬA HÀNG SANG TRỌNG:
             * - Fast path: ID Luxury đã biết hoặc catalog đã đánh dấu luxuryOnly.
             * - Fallback an toàn: nếu Firebase nói item đang trang bị nhưng catalog
             *   Cửa hàng thường không có ID đó, thử nạp Luxury runtime. Đây chính
             *   là tình huống xảy ra với item Luxury mới sau F5: definition chỉ
             *   được đăng ký khi luxury-store.js chạy.
             */
            if (
                LUXURY_ITEM_IDS.has(id) ||
                itemDef?.luxuryOnly === true
            ) {
                needs.add('luxury-runtime');
                continue;
            }

            if (!itemDef) {
                unresolvedEquippedIds.push(rawId);
                continue;
            }

            /*
             * CỬA HÀNG THƯỜNG:
             * chỉ nạp manager đúng loại Theme / Effect / Pet của item.
             */
            needs.add(
                inferNormalRuntimeGroup(rawId, itemDef)
            );
        }

        /*
         * Không yêu cầu người dùng mở tab Cửa hàng để luxury-store.js được load.
         * Chỉ kích hoạt fallback khi có item đang trang bị mà StoreConfig thường
         * chưa nhận diện được. Item rác/cũ nếu có cũng chỉ làm nạp Luxury bundle
         * một lần; applyEquippedItems() vẫn bỏ qua vì không có definition hợp lệ.
         */
        if (unresolvedEquippedIds.length) {
            needs.add('luxury-runtime');
        }

        if (!needs.size) return false;

        await Promise.all(
            [...needs].map(ensure)
        );

        /*
         * Luxury runtime vừa đăng ký thêm item vào StoreConfig. Preload lại CSS
         * của đúng các item đã trang bị để runtime mới có style trước khi apply.
         */
        if (unresolvedEquippedIds.length) {
            const resolvedAfterLuxuryLoad =
                unresolvedEquippedIds
                    .map(id => getCatalogItemById(id))
                    .filter(Boolean);

            if (resolvedAfterLuxuryLoad.length) {
                await preloadEquippedCss(resolvedAfterLuxuryLoad);
                releaseUnusedSpecialCss(resolvedAfterLuxuryLoad);
            }
        }

        return true;
    }


    async function ensureForFrameItem(itemOrId) {
        const id =
            typeof itemOrId === 'string'
                ? String(itemOrId).trim()
                : String(itemOrId?.id || '').trim();

        if (!id) return false;

        await ensure('frame-background-runtime');

        const itemDef =
            (
                itemOrId &&
                typeof itemOrId === 'object' &&
                String(itemOrId.type || '').toLowerCase() === 'frame'
            )
                ? itemOrId
                : getCatalogItemById(id);

        if (
            !itemDef ||
            String(itemDef.type || '').toLowerCase() !== 'frame'
        ) {
            return ensureForItem(id);
        }

        await preloadEquippedCss([
            itemDef
        ]);

        return true;
    }


    async function ensureForBag() {
        /*
         * Túi đồ chỉ cần catalog/StoreConfig để render. Runtime Theme/Effect/Pet
         * sẽ được inventory listener nạp đúng loại sau khi người dùng trang bị.
         */
        await ensure('frame-background-runtime');
    }


    async function ensureForItem(itemId) {
        const id = String(itemId || '').trim();
        if (!id) return false;

        /*
         * Dùng cùng bộ phân loại với startup:
         * - item thường -> runtime theo type
         * - item Luxury -> full-suite theo ID
         */
        return ensureForEquippedItems([
            { id, isEquipped: true }
        ]);
    }

    function schedulePostCore() {
        if (window.__studentPostCoreLazyScheduled) {
            return;
        }

        window.__studentPostCoreLazyScheduled = true;

        const run = () => {
            /*
             * Các tính năng hậu khởi động:
             * - BXH phải có nút truy cập ở mọi tab.
             * - Điểm danh có thể tự bật popup.
             * - Hướng dẫn người mới có thể tự kiểm tra trạng thái.
             * Chúng tải sau khi giao diện đã mở nên không chặn startup.
             */
            ensure('leaderboard').catch(error => {
                console.warn(
                    '[StudentFeatureLoader] Leaderboard lazy-load lỗi:',
                    error
                );
            });

            ensure('daily-login').catch(error => {
                console.warn(
                    '[StudentFeatureLoader] Daily Login lazy-load lỗi:',
                    error
                );
            });

            ensure('guide').catch(error => {
                console.warn(
                    '[StudentFeatureLoader] Guide lazy-load lỗi:',
                    error
                );
            });
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(
                run,
                { timeout: 1800 }
            );
        } else {
            setTimeout(run, 450);
        }
    }

    function getState() {
        return {
            version: VERSION,
            loadedGroups:
                [...groupPromises.keys()],
            loadedCss:
                [...cssPromises.keys()],
            loadedScripts:
                [...scriptPromises.keys()]
        };
    }

    window.StudentFeatureLoader =
        Object.freeze({
            version: VERSION,
            loadCss,
            loadScript,
            ensure,
            ensureForTab,
            ensureForEquippedItems,
            ensureForItem,
            ensureForFrameItem,
            ensureForBag,
            preloadEquippedCss,
            getSpecialCssForItemDefinition,
            preloadAllStoreCardCss,
            releaseUnusedSpecialCss,
            getSpecialCssForItemId,
            schedulePostCore,
            getState
        });

    /*
     * Khung avatar + nút Hồ sơ phải đúng ngay khi mở trang.
     * store-items.css là CSS nền nhỏ cho frame/background, không kích hoạt Store UI
     * và không kéo toàn bộ runtime Cửa hàng.
     */
    installCriticalStudentActionCss();

    loadCss(CSS.storeBase).catch(error => {
        console.warn(
            '[StudentFeatureLoader] Không preload được CSS khung/avatar:',
            error
        );
    });

    preloadFromLocalStorage();
})();
