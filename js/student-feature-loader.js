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

    const VERSION = '3.3.2-equipped-frame-css-startup';

    const cssPromises = new Map();
    const scriptPromises = new Map();
    const groupPromises = new Map();

    // Khi người dùng đã mở khu vực Cửa hàng, CSS của THẺ vật phẩm
    // được giữ đầy đủ cho cả Cửa hàng thường và Cửa hàng Sang trọng.
    // Cờ này chỉ ghim CSS card; runtime Theme/Effect/Pet vẫn selective.
    let storeCardCssPinned = false;

    const CSS = Object.freeze({
        storeBase: 'css/store-items.css?v=3.8',
        effectsBase: 'css/effects-pets.css?v=3.8',

        royalBall: 'css/royal-ball.css?v=3.8',
        dailyLogin: 'css/daily-login.css?v=3.8',
        leaderboard: 'css/leaderboard.css?v=20260905.redo-scope-v1',
        painting: 'css/painting.css?v=3.8',
        history: 'css/lich-su-hao-hung.css?v=20260831.1',
        bellum: 'css/bellum-event.css?v=20260912.4',
        midAutumnFestival: 'css/mid-autumn-festival.css?v=20260914.4-balanced-games',

        collections: 'css/store-collections.css?v=20260908.four-seasons-lock-v1',
        luxury: 'css/luxury-store.css?v=3.8',
        camMong: 'css/cam-co-cam-mong.css?v=20260915.store-card-full-v1',
        midAutumnMoon: 'css/trung-thu-nguyet-cung.css?v=20260915.store-card-full-v1',

        lotm: 'css/lord-of-mysteries.css?v=3.3',
        lotmKlein: 'css/lord-of-mysteries-klein.css?v=20260914.5-event-restore',
        legendary: 'css/legendery.css?v=3.8',
        doraemon: 'css/doraemon.css?v=3.8',
        paintingItems: 'css/hoi-hoa.css?v=3.8',
        sevenSins: 'css/that-dai-toi.css?v=3.8',
        birthday: 'css/pet-sinh-nhat.css?v=3.8',
        weather: 'css/thoi-tiet.css?v=3.8',
        seasons: 'css/premium-mua-xuan.css?v=20260907.summer-frame-r2',
        nationalDay: 'css/quoc-khanh-pet.css?v=3.8',
        nyx: 'css/nyx-than-thoai.css?v=20260915.nyx-card-guard-v1',
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

        luxuryStore: 'js/luxury-store.js?v=4.2.12-store-view-isolation',
        collections: 'js/store-collections.js?v=20260908.four-seasons-lock-v1',

        royalBall: 'js/royal-ball.js?v=20260908.lazy-v1',
        leaderboard: 'js/leaderboard.js?v=20260910.trigger-autoload-v1',
        painting: 'js/painting.js?v=20260908.round-query-v1',
        history: 'js/lich-su-hao-hung.js?v=20260831.1',
        bellum: 'js/bellum-event.js?v=20260912.4',
        midAutumnFestival: 'js/mid-autumn-festival.js?v=20260914.4-balanced-games',

        dailyLogin: 'js/daily-login.js?v=20260908.lazy-v1',
        guide: 'js/huong-dan-nguoi-moi.js?v=2.14.0'
    });

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

            getSpecialCssForItemId(itemId)
                .forEach(url => urls.add(url));
        });

        await Promise.all(
            [...urls].map(loadCss)
        );
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
            const id = typeof item === 'string' ? item : item?.id;
            getSpecialCssForItemId(id).forEach(url =>
                keep.add(normalizeStylesheetIdentity(url))
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
            } catch (_) { }
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
        'pet_quoc_khanh_1',
        'pet_mythic_nyx_1',
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
        await preloadEquippedCss(equipped);
        releaseUnusedSpecialCss(equipped);

        const needs = new Set();

        for (const inventoryItem of equipped) {
            const rawId = String(inventoryItem?.id || '').trim();
            const id = rawId.toLowerCase();
            if (!id) continue;

            const itemDef = getCatalogItemById(rawId);

            /*
             * CỬA HÀNG SANG TRỌNG:
             * chỉ cần 1 item Luxury được trang bị -> nạp luxury runtime.
             * luxury-store.js sẽ mount TOÀN BỘ premiumLayers/full-suite được
             * gắn với đúng ID đó (world + interface + pet realm + skill/...).
             */
            if (
                LUXURY_ITEM_IDS.has(id) ||
                itemDef?.luxuryOnly === true
            ) {
                needs.add('luxury-runtime');
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

        if (!needs.size) return false;

        await Promise.all(
            [...needs].map(ensure)
        );

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
            ensureForBag,
            preloadEquippedCss,
            preloadAllStoreCardCss,
            releaseUnusedSpecialCss,
            getSpecialCssForItemId,
            schedulePostCore,
            getState
        });

    preloadFromLocalStorage();
})();