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

    const VERSION = '2.0.12-lotm-klein-path-fix';

    const cssPromises = new Map();
    const scriptPromises = new Map();
    const groupPromises = new Map();

    const CSS = Object.freeze({
        storeBase: 'css/store-items.css?v=3.8',
        effectsBase: 'css/effects-pets.css?v=3.8',

        royalBall: 'css/royal-ball.css?v=3.8',
        dailyLogin: 'css/daily-login.css?v=3.8',
        leaderboard: 'css/leaderboard.css?v=20260905.redo-scope-v1',
        painting: 'css/painting.css?v=3.8',
        history: 'css/lich-su-hao-hung.css?v=20260831.1',
        bellum: 'css/bellum-event.css?v=20260912.4',

        collections: 'css/store-collections.css?v=20260908.four-seasons-lock-v1',
        luxury: 'css/luxury-store.css?v=3.8',

        lotm: 'css/lord-of-mysteries.css?v=3.3',
        lotmKlein: 'css/lord-of-mysteries-klein.css?v=20260914.4-path-fix',
        legendary: 'css/legendery.css?v=3.8',
        doraemon: 'css/doraemon.css?v=3.8',
        paintingItems: 'css/hoi-hoa.css?v=3.8',
        sevenSins: 'css/that-dai-toi.css?v=3.8',
        birthday: 'css/pet-sinh-nhat.css?v=3.8',
        weather: 'css/thoi-tiet.css?v=3.8',
        seasons: 'css/premium-mua-xuan.css?v=20260907.summer-frame-r2',
        nationalDay: 'css/quoc-khanh-pet.css?v=3.8',
        nyx: 'css/nyx-than-thoai.css?v=3.8',
        tamon: 'css/tamon-b-side.css?v=3.8',
        linkClickCheng: 'css/link-click-cheng-xiaoshi.css?v=20260911.5-card-description-hide-fix'
    });

    const SCRIPT = Object.freeze({
        themeItems: 'js/theme-items.js?v=4.2.1-lotm-klein',
        effectItems: 'js/effect-items.js?v=4.2',
        petItems: 'js/pet-items.js?v=4.2',
        petInteractions: 'js/pet-interactions.js?v=3.8',
        musicManager: 'js/music-manager.js?v=20260910.music-reliability-v3',
        storeManager: 'js/store-manager.js?v=20260910.music-library-v2',

        luxuryStore: 'js/luxury-store.js?v=4.2.8-lotm-klein-path-fix',
        collections: 'js/store-collections.js?v=20260908.four-seasons-lock-v1',

        royalBall: 'js/royal-ball.js?v=20260908.lazy-v1',
        leaderboard: 'js/leaderboard.js?v=20260910.trigger-autoload-v1',
        painting: 'js/painting.js?v=20260908.round-query-v1',
        history: 'js/lich-su-hao-hung.js?v=20260831.1',
        bellum: 'js/bellum-event.js?v=20260912.4',

        dailyLogin: 'js/daily-login.js?v=20260908.lazy-v1',
        guide: 'js/huong-dan-nguoi-moi.js?v=2.14.0'
    });

    const ALL_SPECIAL_STORE_CSS = Object.freeze([
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

    function hasStylesheet(url) {
        const wanted = normalizeResourceUrl(url);

        return [...document.querySelectorAll('link[rel="stylesheet"]')]
            .some(link =>
                normalizeResourceUrl(link.href) === wanted
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

        const key = normalizeResourceUrl(url);

        if (hasStylesheet(url)) {
            return Promise.resolve(key);
        }

        if (cssPromises.has(key)) {
            return cssPromises.get(key);
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

    function loadScript(url) {
        if (!url) return Promise.resolve();

        const key = normalizeResourceUrl(url);

        if (hasScript(url)) {
            return Promise.resolve(key);
        }

        if (scriptPromises.has(key)) {
            return scriptPromises.get(key);
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

    function getSpecialCssForItemId(itemId) {
        const id =
            String(itemId || '')
                .trim()
                .toLowerCase();

        if (!id) return [];

        const result = new Set();

        const isLotmKleinEvent = id === 'pet_lotm_klein_event_1';

        if (isLotmKleinEvent) {
            // Klein event dùng đúng 1 CSS riêng, không phụ thuộc skin LOTM cũ.
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

        if (/(premium_mua_xuan|mua_xuan|mua_ha|summer|spring)/.test(id)) {
            result.add(CSS.seasons);
        }

        if (/(quoc_khanh|national_day|viet_dieu)/.test(id)) {
            result.add(CSS.nationalDay);
        }

        if (/nyx/.test(id)) {
            result.add(CSS.nyx);
            result.add(CSS.legendary);
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

            getSpecialCssForItemId(itemId)
                .forEach(url => urls.add(url));
        });

        await Promise.all(
            [...urls].map(loadCss)
        );
    }

    function preloadFromLocalStorage() {
        const ids = [];

        [
            'active_theme',
            'active_effect',
            'active_pet',
            // Nhạc không cần CSS; tránh kéo Store/Effect CSS chỉ vì active_music.
            'active_frame',
            'active_background'
        ].forEach(key => {
            try {
                const value =
                    localStorage.getItem(key);

                if (value) ids.push(value);
            } catch (_) {}
        });

        if (!ids.length) return;

        /*
         * Bắt đầu tải CSS ngay khi <head> đang parse.
         * Firebase inventory vẫn là nguồn xác nhận cuối cùng ở startup.
         */
        preloadEquippedCss(ids).catch(error => {
            console.warn(
                '[StudentFeatureLoader] Preload CSS localStorage lỗi:',
                error
            );
        });
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

        async 'visual-runtime'() {
            await Promise.all([
                loadCss(CSS.storeBase),
                loadCss(CSS.effectsBase)
            ]);

            await loadScriptsSequentially([
                SCRIPT.themeItems,
                SCRIPT.effectItems,
                SCRIPT.petItems,
                SCRIPT.petInteractions,
                SCRIPT.musicManager,
                SCRIPT.storeManager
            ]);
        },

        async 'store-ui'() {
            await ensure('visual-runtime');

            await Promise.all([
                loadCss(CSS.collections),
                loadCss(CSS.luxury),
                ...ALL_SPECIAL_STORE_CSS.map(loadCss)
            ]);

            await loadScriptsSequentially([
                SCRIPT.luxuryStore,
                SCRIPT.collections
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
                ensure('bellum-event')
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

        const hasOnlyMusic = equipped.every(item =>
            /^music(?:_|-)/i.test(String(item?.id || ''))
        );

        if (hasOnlyMusic) {
            await ensure('music-runtime');
            return true;
        }

        /*
         * CSS phải xong trước runtime + applyEquippedItems.
         * Startup inventory listener await hàm này trước khi markReady,
         * nên loader không biến mất khi skin đang trang bị chưa có CSS.
         */
        await preloadEquippedCss(equipped);

        const needsLuxuryRuntime = equipped.some(item => {
            const id = String(item?.id || '');
            return (
                id === 'pet_linkclick_cheng_xiaoshi_1' ||
                id === 'pet_lotm_klein_event_1'
            );
        });

        if (needsLuxuryRuntime) {
            /*
             * Vật phẩm Cheng Xiaoshi đăng ký/runtime trong luxury-store.js.
             * Tải store-ui ngay khi pet này đang trang bị để reload trang vẫn
             * khôi phục world/interface/pet realm trước khi startup hoàn tất.
             */
            await ensure('store-ui');
            return true;
        }

        await ensure('visual-runtime');

        return true;
    }

    async function ensureForBag() {
        await ensure('visual-runtime');
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
            ensureForBag,
            preloadEquippedCss,
            getSpecialCssForItemId,
            schedulePostCore,
            getState
        });

    preloadFromLocalStorage();
})();