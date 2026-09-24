/*
 * ============================================================
 * CỬA HÀNG SANG TRỌNG
 * - Nằm trong menu xổ xuống của Cửa hàng
 * - Cùng vị trí với mục Sưu tầm
 * - Vật phẩm được thêm THỦ CÔNG bằng ID
 * ============================================================
 */

(() => {
    'use strict';

    window.__LUXURY_STORE_GUARD_BUILD = '20260917.v1-D1-D8';


    // EFFECT QUALITY MANAGER v1.2.0
    // Dùng chung cho toàn bộ runtime Luxury/Premium, kể cả vật phẩm thêm sau này.
    function getLuxuryQualityCount(baseCount, minimum = 1) {
        const base = Math.max(0, Number(baseCount) || 0);
        try {
            const manager = window.EffectQualityManager;
            if (manager && typeof manager.getRecommendedCount === 'function') {
                const next = manager.getRecommendedCount(base);
                return base > 0 ? Math.max(minimum, next) : 0;
            }
        } catch (_) {}
        return Math.ceil(base);
    }

    // ========================================================
    // 1. DANH SÁCH VẬT PHẨM SANG TRỌNG
    // ========================================================
    // Muốn món nào xuất hiện thì ghi ID món đó vào đây.
    const LUXURY_ITEM_IDS = [
        'pet_luxury_mua_xuan',
        'pet_luxury_mua_ha',
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
    ];

    // ========================================================
    // VẬT PHẨM PREMIUM THỦ CÔNG
    // ========================================================

    // ========================================================
    // QUỐC KHÁNH · HÀO KHÍ VIỆT NAM
    // - Chỉ nhận từ sự kiện Lịch sử hào hùng.
    // - Không mua / không dùng thử bằng Coin.
    // - Vật phẩm Luxury 10/10.
    // ========================================================
    const NATIONAL_DAY_PREMIUM_PET = {
        id: 'pet_quoc_khanh_1',

        name: '🇻🇳 Việt Diệu · Hồn Thiêng Độc Lập',

        type: 'pet',

        // Không bán bằng Coin
        price: 0,
        isNonCoin: true,
        luxuryOnly: true,
        eventOnly: true,

        eventId: 'lich_su_hao_hung',
        eventRewardTier: 'luxury',
        eventScoreRequired: 10,

        tag: 'Quốc khánh',
        tags: [
            'Quốc khánh',
            '2/9',
            'Lịch sử hào hùng',
            'Premium',
            'Sự kiện'
        ],

        image:
            'assets/Premium/quốc khánh/nhan-vat-quoc-khanh1.png',

        asset:
            'assets/Premium/quốc khánh/nhan-vat-quoc-khanh1.png',

        value:
            'assets/Premium/quốc khánh/nhan-vat-quoc-khanh1.png',

        luxuryTagImage:
            'assets/Premium/quốc khánh/tag.png',

        isIcon: false,

        /*
         * Bộ hiệu ứng riêng:
         * trống đồng Đông Sơn + sơn son đỏ + quầng sao vàng.
         * Không tái sử dụng runtime / class / keyframe của vật phẩm cũ.
         */
        petEffect: 'national-day-chibi-star-magic',
        premiumSuite: 'national-day-heritage-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'ultimate'
        ],

        // Pet có kỹ năng nhấn riêng, không dùng click effect mặc định.
        disableClickEffect: true
    };

    // ========================================================
    // QUỐC KHÁNH · LUXURY RUNTIME V2
    // WORLD + INTERFACE
    // Pet realm + click skill vẫn do PetManager quản lý.
    // ========================================================
    const LuxuryNationalDayRuntime = {
        activePetElement: null,
        petClickHandler: null,
        skillLocked: false,


        clear() {

            if (
                this.activePetElement &&
                this.petClickHandler
            ) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            this.activePetElement = null;
            this.petClickHandler = null;
            this.skillLocked = false;

            document
                .querySelectorAll(
                    '.national-day-screen-burst-v4,' +
                    '.national-day-divine-world-v4,' +
                    '.national-day-ultimate-dialogue-v4'
                )
                .forEach(element => element.remove());

            document.documentElement.classList.remove(
                'national-day-luxury-equipped'
            );

            document
                .querySelectorAll(
                    '.national-day-world-v2,' +
                    '.national-day-ui-frame-v2,' +
                    '.national-day-ui-shell-v3'
                )
                .forEach(element => element.remove());
        },


        // ====================================================
        // WORLD EFFECT
        // ====================================================
        createWorld() {

            document
                .querySelectorAll(
                    '.national-day-world-v2'
                )
                .forEach(element => element.remove());

            const world =
                document.createElement('div');

            world.className =
                'national-day-world-v2';

            world.setAttribute(
                'aria-hidden',
                'true'
            );

            world.innerHTML = `
            <div class="ndv2-red-vignette"></div>

            <div class="ndv2-heaven-sun"></div>

            <div class="ndv2-grand-drum">
                <span class="ndv2-grand-star">★</span>

                <span class="
                    ndv2-grand-ring
                    ring-one
                "></span>

                <span class="
                    ndv2-grand-ring
                    ring-two
                "></span>

                <span class="
                    ndv2-grand-ring
                    ring-three
                "></span>
            </div>


            <div class="
                ndv2-flag-silk
                silk-a
            "></div>

            <div class="
                ndv2-flag-silk
                silk-b
            "></div>

            <div class="
                ndv2-flag-silk
                silk-c
            "></div>


            <div class="ndv2-gold-horizon"></div>

            <div class="ndv2-light-beams"></div>

            <div class="ndv2-ember-field"></div>

            <div class="ndv2-star-field"></div>

            <div class="ndv2-bronze-field"></div>
        `;


            const mobile =
                window.matchMedia(
                    '(max-width: 768px), (pointer: coarse)'
                ).matches;


            // ==============================
            // MƯA ÁNH ĐỒNG
            // ==============================
            const emberField =
                world.querySelector(
                    '.ndv2-ember-field'
                );

            const emberCount =
                getLuxuryQualityCount(mobile ? 18 : 38);

            for (
                let i = 0;
                i < emberCount;
                i++
            ) {
                const ember =
                    document.createElement('span');

                ember.className =
                    'ndv2-ember';

                ember.style.setProperty(
                    '--ndv2-x',
                    `${Math.random() * 100}%`
                );

                ember.style.setProperty(
                    '--ndv2-size',
                    `${2 + Math.random() * 5}px`
                );

                ember.style.setProperty(
                    '--ndv2-duration',
                    `${7 + Math.random() * 9}s`
                );

                ember.style.setProperty(
                    '--ndv2-delay',
                    `${-Math.random() * 14}s`
                );

                emberField?.appendChild(
                    ember
                );
            }


            // ==============================
            // SAO VÀNG TOÀN MÀN HÌNH
            // ==============================
            const starField =
                world.querySelector(
                    '.ndv2-star-field'
                );

            const starCount =
                getLuxuryQualityCount(mobile ? 8 : 17);

            for (
                let i = 0;
                i < starCount;
                i++
            ) {
                const star =
                    document.createElement('span');

                star.className =
                    'ndv2-screen-star';

                star.textContent = '★';

                star.style.setProperty(
                    '--ndv2-sx',
                    `${5 + Math.random() * 90}%`
                );

                star.style.setProperty(
                    '--ndv2-sy',
                    `${7 + Math.random() * 82}%`
                );

                star.style.setProperty(
                    '--ndv2-ssize',
                    `${7 + Math.random() * 13}px`
                );

                star.style.setProperty(
                    '--ndv2-sdelay',
                    `${-Math.random() * 5}s`
                );

                starField?.appendChild(
                    star
                );
            }


            // ==============================
            // MẢNH TRỐNG ĐỒNG
            // ==============================
            const bronzeField =
                world.querySelector(
                    '.ndv2-bronze-field'
                );

            const bronzeCount =
                getLuxuryQualityCount(mobile ? 10 : 24);

            for (
                let i = 0;
                i < bronzeCount;
                i++
            ) {
                const shard =
                    document.createElement('span');

                shard.className =
                    'ndv2-bronze-shard';

                shard.style.setProperty(
                    '--ndv2-bx',
                    `${Math.random() * 100}%`
                );

                shard.style.setProperty(
                    '--ndv2-by',
                    `${Math.random() * 100}%`
                );

                shard.style.setProperty(
                    '--ndv2-bdelay',
                    `${-Math.random() * 7}s`
                );

                bronzeField?.appendChild(
                    shard
                );
            }


            document.body.appendChild(
                world
            );

            requestAnimationFrame(() => {
                world.classList.add(
                    'is-active'
                );
            });
        },


        // ====================================================
        // GIAO DIỆN LUXURY QUỐC KHÁNH
        // - Frame V2: viền trang trí cố định
        // - Shell V3: đổi giao diện web + huy hiệu 02/09
        // ====================================================
        createInterface() {

            document
                .querySelectorAll(
                    '.national-day-ui-frame-v2,' +
                    '.national-day-ui-shell-v3'
                )
                .forEach(element => element.remove());


            // -----------------------------------------------
            // FRAME V2 · VIỀN TRANG TRÍ
            // -----------------------------------------------
            const frame =
                document.createElement('div');

            frame.className =
                'national-day-ui-frame-v2';

            frame.setAttribute(
                'aria-hidden',
                'true'
            );

            frame.innerHTML = `
                <div class="ndv2-ui-side side-left">
                    <i></i><b>★</b><i></i>
                </div>

                <div class="ndv2-ui-side side-right">
                    <i></i><b>★</b><i></i>
                </div>

                <span class="ndv2-ui-corner corner-tl">✦</span>
                <span class="ndv2-ui-corner corner-tr">✦</span>
                <span class="ndv2-ui-corner corner-bl">✦</span>
                <span class="ndv2-ui-corner corner-br">✦</span>

                <div class="ndv2-ui-bottom">
                    <i></i>
                    <span>★ ĐỘC LẬP · TỰ DO · HẠNH PHÚC ★</span>
                    <i></i>
                </div>
            `;


            // -----------------------------------------------
            // SHELL V3 · GIAO DIỆN WEB QUỐC KHÁNH
            // CSS của shell này đổi toolbar/sidebar/card/web.
            // -----------------------------------------------
            const shell =
                document.createElement('div');

            shell.className =
                'national-day-ui-shell-v3';

            shell.setAttribute(
                'aria-hidden',
                'true'
            );

            shell.innerHTML = `
                <div class="nd-ui-screen-wash"></div>

                <div class="nd-ui-top-seal">
                    <span class="nd-ui-top-line"></span>

                    <div class="nd-ui-top-emblem">
                        <b>★</b>
                        <strong>02 · 09</strong>
                        <small>HÀO KHÍ VIỆT NAM</small>
                    </div>

                    <span class="nd-ui-top-line right"></span>
                </div>

                <div class="nd-ui-side-rail rail-left">
                    <i></i><span>★</span><i></i>
                </div>

                <div class="nd-ui-side-rail rail-right">
                    <i></i><span>★</span><i></i>
                </div>

                <span class="nd-ui-corner corner-tl">✦</span>
                <span class="nd-ui-corner corner-tr">✦</span>
                <span class="nd-ui-corner corner-bl">✦</span>
                <span class="nd-ui-corner corner-br">✦</span>

                <div class="nd-ui-bottom-seal">
                    <i></i>
                    <span>ĐỘC LẬP · TỰ DO · HẠNH PHÚC</span>
                    <i></i>
                </div>
            `;


            document.body.append(
                frame,
                shell
            );


            requestAnimationFrame(() => {
                frame.classList.add(
                    'is-mounted'
                );

                shell.classList.add(
                    'is-mounted'
                );
            });
        },

        // ====================================================
        // CLICK SKILL · HỒN THIÊNG ĐỘC LẬP
        // Cấu trúc 3 tầng giống độ hoành tráng của Vạn Sinh Hoa Mộng:
        // 1) local pet burst do PetManager xử lý
        // 2) screen burst riêng
        // 3) ultimate toàn màn hình riêng
        // ====================================================
        installPetSkill() {

            const container =
                document.getElementById(
                    'virtual-pet-container'
                );

            const pet =
                container?.querySelector(
                    '#virtual-pet-img'
                );

            if (!container || !pet) {
                return;
            }

            this.activePetElement = pet;

            this.petClickHandler = event => {

                if (this.skillLocked) {
                    return;
                }

                if (
                    !document.documentElement.classList.contains(
                        'national-day-luxury-equipped'
                    )
                ) {
                    return;
                }

                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) {
                    return;
                }

                const rect =
                    pet.getBoundingClientRect();

                const x =
                    Number.isFinite(event.clientX) &&
                        event.clientX > 0
                        ? event.clientX
                        : rect.left + rect.width / 2;

                const y =
                    Number.isFinite(event.clientY) &&
                        event.clientY > 0
                        ? event.clientY
                        : rect.top + rect.height / 2;

                this.skillLocked = true;

                // Tầng 2: nổ trống đồng / sóng vàng toàn màn hình
                this.createScreenBurst(
                    x,
                    y
                );

                // Tầng 3: ultimate Hồn Thiêng Độc Lập
                this.createUltimate(
                    x,
                    y,
                    container
                );

                window.setTimeout(() => {
                    this.skillLocked = false;
                }, 6400);
            };

            pet.addEventListener(
                'click',
                this.petClickHandler
            );
        },


        // ====================================================
        // TẦNG 2 · SCREEN BURST
        // ====================================================
        createScreenBurst(x, y) {

            document
                .querySelectorAll(
                    '.national-day-screen-burst-v4'
                )
                .forEach(element => element.remove());

            const burst =
                document.createElement('div');

            burst.className =
                'national-day-screen-burst-v4';

            burst.style.setProperty(
                '--ndu4-x',
                `${x}px`
            );

            burst.style.setProperty(
                '--ndu4-y',
                `${y}px`
            );

            burst.innerHTML = `
                <div class="ndu4-screen-flash"></div>

                <span class="ndu4-screen-wave wave-a"></span>
                <span class="ndu4-screen-wave wave-b"></span>
                <span class="ndu4-screen-wave wave-c"></span>
                <span class="ndu4-screen-wave wave-d"></span>

                <div class="ndu4-screen-drum">
                    <span class="ndu4-screen-drum-star">★</span>
                    <span class="ndu4-screen-drum-ring ring-a"></span>
                    <span class="ndu4-screen-drum-ring ring-b"></span>
                    <span class="ndu4-screen-drum-ring ring-c"></span>
                </div>

                <div class="ndu4-screen-rays"></div>
                <div class="ndu4-screen-stars"></div>
                <div class="ndu4-screen-shards"></div>

                <div class="ndu4-screen-banner banner-a"></div>
                <div class="ndu4-screen-banner banner-b"></div>

                <div class="ndu4-screen-title">
                    <small>02 · 09</small>
                    <strong>HÀO KHÍ NON SÔNG</strong>
                </div>
            `;

            const stars =
                burst.querySelector(
                    '.ndu4-screen-stars'
                );

            for (let i = 0; i < 28; i++) {

                const star =
                    document.createElement('span');

                star.textContent = '★';

                star.style.setProperty(
                    '--ndu4-angle',
                    `${i * (360 / 28)}deg`
                );

                star.style.setProperty(
                    '--ndu4-distance',
                    `${105 + Math.random() * 235}px`
                );

                star.style.setProperty(
                    '--ndu4-size',
                    `${8 + Math.random() * 15}px`
                );

                star.style.setProperty(
                    '--ndu4-delay',
                    `${Math.random() * 0.22}s`
                );

                stars?.appendChild(star);
            }

            const shards =
                burst.querySelector(
                    '.ndu4-screen-shards'
                );

            for (let i = 0; i < 34; i++) {

                const shard =
                    document.createElement('i');

                shard.style.setProperty(
                    '--ndu4-angle',
                    `${Math.random() * 360}deg`
                );

                shard.style.setProperty(
                    '--ndu4-distance',
                    `${90 + Math.random() * 280}px`
                );

                shard.style.setProperty(
                    '--ndu4-delay',
                    `${Math.random() * 0.26}s`
                );

                shard.style.setProperty(
                    '--ndu4-rotate',
                    `${Math.random() * 180 - 90}deg`
                );

                shards?.appendChild(shard);
            }

            document.body.appendChild(
                burst
            );

            requestAnimationFrame(() => {
                burst.classList.add(
                    'is-active'
                );
            });

            window.setTimeout(
                () => burst.remove(),
                2100
            );
        },


        // ====================================================
        // TẦNG 3 · ULTIMATE TOÀN MÀN HÌNH
        // ====================================================
        createUltimate(x, y, container) {

            document
                .querySelectorAll(
                    '.national-day-divine-world-v4,' +
                    '.national-day-ultimate-dialogue-v4'
                )
                .forEach(element => element.remove());

            const world =
                document.createElement('div');

            world.className =
                'national-day-divine-world-v4';

            world.style.setProperty(
                '--ndu4-origin-x',
                `${x}px`
            );

            world.style.setProperty(
                '--ndu4-origin-y',
                `${y}px`
            );

            world.innerHTML = `
                <div class="ndu4-ultimate-red-sky"></div>
                <div class="ndu4-ultimate-gold-dawn"></div>
                <div class="ndu4-ultimate-heaven-rays"></div>

                <div class="ndu4-ultimate-flag flag-left"></div>
                <div class="ndu4-ultimate-flag flag-right"></div>

                <div class="ndu4-ultimate-grand-drum">
                    <span class="ndu4-ultimate-drum-star">★</span>
                    <span class="ndu4-ultimate-drum-ring ring-1"></span>
                    <span class="ndu4-ultimate-drum-ring ring-2"></span>
                    <span class="ndu4-ultimate-drum-ring ring-3"></span>
                    <span class="ndu4-ultimate-drum-ring ring-4"></span>
                </div>

                <div class="ndu4-ultimate-bronze-grid"></div>
                <div class="ndu4-ultimate-star-field"></div>
                <div class="ndu4-ultimate-ember-field"></div>

                <div class="ndu4-ultimate-pillars pillar-left"></div>
                <div class="ndu4-ultimate-pillars pillar-right"></div>

                <div class="ndu4-ultimate-horizon"></div>

                <div class="ndu4-ultimate-title">
                    <small>VIỆT DIỆU · 02.09</small>
                    <strong>HỒN THIÊNG ĐỘC LẬP</strong>
                    <span>ĐỘC LẬP · TỰ DO · HẠNH PHÚC</span>
                </div>
            `;

            const starField =
                world.querySelector(
                    '.ndu4-ultimate-star-field'
                );

            const emberField =
                world.querySelector(
                    '.ndu4-ultimate-ember-field'
                );

            const mobile =
                window.matchMedia(
                    '(max-width: 768px), (pointer: coarse)'
                ).matches;

            const starCount =
                getLuxuryQualityCount(mobile ? 20 : 42);

            const emberCount =
                getLuxuryQualityCount(mobile ? 28 : 64);

            for (let i = 0; i < starCount; i++) {

                const star =
                    document.createElement('span');

                star.textContent = '★';

                star.style.setProperty(
                    '--ndu4-ux',
                    `${4 + Math.random() * 92}%`
                );

                star.style.setProperty(
                    '--ndu4-uy',
                    `${5 + Math.random() * 86}%`
                );

                star.style.setProperty(
                    '--ndu4-usize',
                    `${6 + Math.random() * 15}px`
                );

                star.style.setProperty(
                    '--ndu4-udelay',
                    `${Math.random() * 0.9}s`
                );

                starField?.appendChild(star);
            }

            for (let i = 0; i < emberCount; i++) {

                const ember =
                    document.createElement('i');

                ember.style.setProperty(
                    '--ndu4-ex',
                    `${Math.random() * 100}%`
                );

                ember.style.setProperty(
                    '--ndu4-ey',
                    `${20 + Math.random() * 85}%`
                );

                ember.style.setProperty(
                    '--ndu4-esize',
                    `${2 + Math.random() * 5}px`
                );

                ember.style.setProperty(
                    '--ndu4-edelay',
                    `${Math.random() * 1.2}s`
                );

                emberField?.appendChild(ember);
            }

            document.body.appendChild(
                world
            );

            const dialogue =
                document.createElement('div');

            dialogue.className =
                'national-day-ultimate-dialogue-v4';

            dialogue.innerHTML = `
                <b>★</b>
                <span>Hào khí nghìn thu — non sông trường tồn!</span>
            `;

            container?.appendChild(
                dialogue
            );

            requestAnimationFrame(() => {
                world.classList.add(
                    'is-active'
                );
            });

            window.setTimeout(() => {
                world.classList.add(
                    'is-climax'
                );
            }, 1250);

            window.setTimeout(() => {
                world.classList.add(
                    'is-ending'
                );
            }, 4700);

            window.setTimeout(() => {
                world.remove();
                dialogue.remove();
            }, 6000);
        },


        mount() {

            this.clear();

            document.documentElement.classList.add(
                'national-day-luxury-equipped'
            );

            this.createWorld();
            this.createInterface();
            this.installPetSkill();
        }
    };

    const SPRING_PREMIUM_PET = {
        id: 'pet_luxury_mua_xuan',

        name: 'Xuân Thần · Vạn Sinh Hoa Mộng',

        type: 'pet',

        // Không bán bằng Coin
        // Bán bằng Coin
        price: 12000,
        isNonCoin: false,
        luxuryOnly: true,

        // Không còn là vật phẩm sự kiện
        eventOnly: false,

        tag: 'Mùa xuân',
        tags: [
            'Mùa xuân',
            'Bốn mùa',
            'Premium'
        ],

        // Ảnh nhân vật
        image:
            'assets/Premium/Bốn mùa/mua-xuan-nhan-vat.png',

        asset:
            'assets/Premium/Bốn mùa/mua-xuan-nhan-vat.png',

        value:
            'assets/Premium/Bốn mùa/mua-xuan-nhan-vat.png',

        // Ảnh tag riêng trên card
        luxuryTagImage:
            'assets/Premium/Bốn mùa/tag-mua-xuan.png',

        isIcon: false,

        // Bộ hiệu ứng Premium Mùa Xuân
        petEffect: 'premium-spring-goddess-magic',
        premiumSuite: 'spring-crown-court-v3',
        premiumLayers: ['world-effect', 'interface', 'pet-realm'],

        // Không dùng hiệu ứng click thú cưng mặc định
        disableClickEffect: true
    };


    // ========================================================
    // PREMIUM MÙA HẠ · HẠ NHẬT LƯU KIM
    // - Đổi bằng 2 Xu Trung Thu đúng ngày Trung Thu
    // - Card giữ nguyên bố cục Luxury Store
    // - Tag riêng: assets/Premium/Bốn mùa/ha_tag2.png
    // - Pet riêng: assets/Premium/Bốn mùa/ha_nhan_vat2.png
    // - Full suite độc lập, KHÔNG ghi active_theme / active_effect
    // ========================================================
    const SUMMER_PREMIUM_PET = {
        id: 'pet_luxury_mua_ha',
        name: 'Hạ Thần · Nhật Diệu Lưu Kim',
        type: 'pet',
        price: 12000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Mùa hạ',
        tags: [
            'Mùa hạ',
            'Bốn mùa',
            'Premium'
        ],

        image: 'assets/Premium/Bốn mùa/ha_nhan_vat2.png',
        asset: 'assets/Premium/Bốn mùa/ha_nhan_vat2.png',
        value: 'assets/Premium/Bốn mùa/ha_nhan_vat2.png',

        luxuryTagImage:
            'assets/Premium/Bốn mùa/ha_tag2.png',

        isIcon: false,

        petEffect: 'premium-summer-solstice-magic',
        premiumSuite: 'summer-solstice-golden-mirror-court-v3',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'pet-skill',
            'drag-trail'
        ],

        // Kỹ năng click do LuxurySummerRuntime tự quản lý.
        disableClickEffect: true
    };


    // ========================================================
    // MÙA HẠ · HẠ NHẬT LƯU KIM — FULL WEB RUNTIME
    // Namespace: summer-solstice-* / ssv2-* / ssv3-*
    // Không gọi ThemeManager / EffectManager nên không chiếm
    // active_theme / active_effect và không xóa vật phẩm khác.
    // ========================================================
    const LuxurySummerRuntime = {
        activePetElement: null,
        petClickHandler: null,
        petPointerDownHandler: null,
        petPointerMoveHandler: null,
        petPointerUpHandler: null,
        globalClickHandler: null,
        observer: null,
        observerTimer: null,
        repairTimers: new Set(),
        skillLocked: false,
        dragState: null,

        clearTimerBag() {
            this.repairTimers.forEach(timer => {
                window.clearTimeout(timer);
            });
            this.repairTimers.clear();

            if (this.observerTimer) {
                window.clearTimeout(this.observerTimer);
                this.observerTimer = null;
            }
        },

        setRepairTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.repairTimers.delete(timer);
                callback();
            }, delay);

            this.repairTimers.add(timer);
            return timer;
        },

        clear() {
            this.clearTimerBag();

            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.activePetElement && this.petPointerDownHandler) {
                this.activePetElement.removeEventListener(
                    'pointerdown',
                    this.petPointerDownHandler
                );
            }

            if (this.petPointerMoveHandler) {
                document.removeEventListener(
                    'pointermove',
                    this.petPointerMoveHandler
                );
            }

            if (this.petPointerUpHandler) {
                document.removeEventListener(
                    'pointerup',
                    this.petPointerUpHandler
                );
                document.removeEventListener(
                    'pointercancel',
                    this.petPointerUpHandler
                );
            }

            if (this.globalClickHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.globalClickHandler,
                    true
                );
            }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.activePetElement = null;
            this.petClickHandler = null;
            this.petPointerDownHandler = null;
            this.petPointerMoveHandler = null;
            this.petPointerUpHandler = null;
            this.globalClickHandler = null;
            this.skillLocked = false;
            this.dragState = null;

            document.documentElement.classList.remove(
                'summer-solstice-equipped',
                'summer-solstice-skill-active',
                'summer-solstice-v3-equipped'
            );

            document.body?.classList.remove(
                'theme-summer-solstice-stage'
            );

            const container =
                document.getElementById('virtual-pet-container');

            container?.classList.remove(
                'pet-summer-solstice-stage',
                'summer-solstice-awakening',
                'summer-solstice-casting',
                'summer-solstice-v3-casting'
            );

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove(
                    'summer-solstice-avatar',
                    'summer-solstice-v3-avatar'
                );

            document
                .querySelectorAll(
                    '.summer-solstice-world,' +
                    '.summer-solstice-ui-frame,' +
                    '.summer-solstice-pet-realm,' +
                    '.summer-solstice-click-burst,' +
                    '.summer-solstice-drag-trail,' +
                    '.summer-solstice-ultimate,' +
                    '.summer-solstice-screen-burst-v3,' +
                    '.summer-solstice-pet-dialogue,' +
                    '.summer-solstice-local-burst'
                )
                .forEach(node => node.remove());
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container ' +
                '#virtual-pet-img.premium-summer-solstice-magic'
            );
        },

        createWorld() {
            document
                .querySelectorAll('.summer-solstice-world')
                .forEach(node => node.remove());

            const world = document.createElement('div');
            world.className =
                'summer-solstice-world summer-solstice-world-v3 ui-theme-immune';
            world.dataset.themeImmune = 'true';
            world.setAttribute('aria-hidden', 'true');

            world.innerHTML = `
                <div class="ssv2-atmosphere"></div>

                <div class="ssv3-sky-veil"></div>
                <div class="ssv3-golden-hour-band"></div>

                <div class="ssv2-sun-vault">
                    <span class="ssv2-sun-core"></span>
                    <span class="ssv2-sun-ring ring-a"></span>
                    <span class="ssv2-sun-ring ring-b"></span>
                    <span class="ssv2-sun-ring ring-c"></span>
                    <div class="ssv2-sun-spokes">
                        <i style="--i:0"></i><i style="--i:1"></i>
                        <i style="--i:2"></i><i style="--i:3"></i>
                        <i style="--i:4"></i><i style="--i:5"></i>
                        <i style="--i:6"></i><i style="--i:7"></i>
                        <i style="--i:8"></i><i style="--i:9"></i>
                        <i style="--i:10"></i><i style="--i:11"></i>
                    </div>
                </div>

                <div class="ssv3-solar-astrolabe">
                    <span class="ssv3-astro-core">☀</span>
                    <span class="ssv3-astro-ring ring-a"></span>
                    <span class="ssv3-astro-ring ring-b"></span>
                    <span class="ssv3-astro-ring ring-c"></span>
                    <span class="ssv3-astro-ring ring-d"></span>
                    <div class="ssv3-astro-spokes">
                        ${Array.from({ length: 24 }, (_, i) =>
                            `<i style="--i:${i}"></i>`
                        ).join('')}
                    </div>
                    <div class="ssv3-astro-marks">
                        ${Array.from({ length: 12 }, (_, i) =>
                            `<b style="--i:${i}"></b>`
                        ).join('')}
                    </div>
                </div>

                <div class="ssv3-prism-canopy canopy-a"></div>
                <div class="ssv3-prism-canopy canopy-b"></div>
                <div class="ssv3-prism-canopy canopy-c"></div>

                <div class="ssv3-heat-mirage mirage-a"></div>
                <div class="ssv3-heat-mirage mirage-b"></div>
                <div class="ssv3-heat-mirage mirage-c"></div>
                <div class="ssv3-heat-mirage mirage-d"></div>

                <div class="ssv2-heat-ribbon ribbon-a"></div>
                <div class="ssv2-heat-ribbon ribbon-b"></div>
                <div class="ssv2-heat-ribbon ribbon-c"></div>

                <div class="ssv3-aqua-lens lens-a"></div>
                <div class="ssv3-aqua-lens lens-b"></div>
                <div class="ssv3-aqua-lens lens-c"></div>

                <div class="ssv2-horizon-line"></div>

                <div class="ssv3-horizon-mirror">
                    <span class="wave wave-a"></span>
                    <span class="wave wave-b"></span>
                    <span class="wave wave-c"></span>
                    <span class="wave wave-d"></span>
                    <span class="wave wave-e"></span>
                </div>

                <div class="ssv2-caustic-sea">
                    <i></i><i></i><i></i><i></i><i></i><i></i>
                </div>

                <div class="ssv3-edge-reed reed-left">
                    <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                </div>
                <div class="ssv3-edge-reed reed-right">
                    <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                </div>

                <div class="ssv2-glint-field"></div>
                <div class="ssv2-pollen-field"></div>
                <div class="ssv2-streak-field"></div>

                <div class="ssv3-firefly-field"></div>
                <div class="ssv3-sunseed-field"></div>
                <div class="ssv3-prism-field"></div>
                <div class="ssv3-water-spark-field"></div>

                <div class="ssv2-corner-bloom bloom-left"></div>
                <div class="ssv2-corner-bloom bloom-right"></div>
            `;

            const reduced = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse), ' +
                '(prefers-reduced-motion: reduce)'
            ).matches;

            const glintField =
                world.querySelector('.ssv2-glint-field');
            const pollenField =
                world.querySelector('.ssv2-pollen-field');
            const streakField =
                world.querySelector('.ssv2-streak-field');
            const fireflyField =
                world.querySelector('.ssv3-firefly-field');
            const sunseedField =
                world.querySelector('.ssv3-sunseed-field');
            const prismField =
                world.querySelector('.ssv3-prism-field');
            const waterSparkField =
                world.querySelector('.ssv3-water-spark-field');

            const glintCount = getLuxuryQualityCount(reduced ? 16 : 42);
            const pollenCount = getLuxuryQualityCount(reduced ? 12 : 30);
            const streakCount = getLuxuryQualityCount(reduced ? 6 : 14);
            const fireflyCount = getLuxuryQualityCount(reduced ? 16 : 38);
            const sunseedCount = getLuxuryQualityCount(reduced ? 14 : 32);
            const prismCount = getLuxuryQualityCount(reduced ? 8 : 18);
            const waterSparkCount = getLuxuryQualityCount(reduced ? 10 : 24);

            for (let index = 0; index < glintCount; index++) {
                const glint = document.createElement('span');
                glint.className =
                    index % 5 === 0
                        ? 'ssv2-glint is-aqua'
                        : (
                            index % 3 === 0
                                ? 'ssv2-glint is-star'
                                : 'ssv2-glint'
                        );
                glint.style.setProperty('--gx', `${(index * 41 + 7) % 97}%`);
                glint.style.setProperty('--gy', `${(index * 67 + 13) % 91}%`);
                glint.style.setProperty('--gs', `${2.2 + (index % 5) * 1.15}px`);
                glint.style.setProperty('--gd', `${4.8 + (index % 7) * .72}s`);
                glint.style.setProperty('--gdelay', `${-(index % 11) * .51}s`);
                glintField?.appendChild(glint);
            }

            for (let index = 0; index < pollenCount; index++) {
                const mote = document.createElement('span');
                mote.className =
                    index % 4 === 0
                        ? 'ssv2-pollen is-aqua'
                        : 'ssv2-pollen';
                mote.style.setProperty('--px', `${(index * 53 + 9) % 100}%`);
                mote.style.setProperty('--ps', `${3 + (index % 4) * 1.2}px`);
                mote.style.setProperty('--pd', `${8 + (index % 7) * 1.1}s`);
                mote.style.setProperty('--pdelay', `${-(index % 13) * .66}s`);
                mote.style.setProperty('--pdrift', `${-24 + (index % 9) * 7}px`);
                pollenField?.appendChild(mote);
            }

            for (let index = 0; index < streakCount; index++) {
                const streak = document.createElement('span');
                streak.className = 'ssv2-streak';
                streak.style.setProperty('--sx', `${(index * 71 + 5) % 96}%`);
                streak.style.setProperty('--sd', `${5.5 + (index % 5) * 1.1}s`);
                streak.style.setProperty('--sdelay', `${-(index % 7) * .8}s`);
                streak.style.setProperty('--stilt', `${-20 + (index % 7) * 6}deg`);
                streakField?.appendChild(streak);
            }

            for (let index = 0; index < fireflyCount; index++) {
                const firefly = document.createElement('span');
                firefly.className =
                    index % 7 === 0
                        ? 'ssv3-firefly is-aqua'
                        : 'ssv3-firefly';
                firefly.style.setProperty('--fx', `${3 + (index * 47) % 94}%`);
                firefly.style.setProperty('--fy', `${6 + (index * 73) % 86}%`);
                firefly.style.setProperty('--fs', `${2 + (index % 5) * .9}px`);
                firefly.style.setProperty('--fd', `${5.8 + (index % 8) * .7}s`);
                firefly.style.setProperty('--fdelay', `${-(index % 15) * .48}s`);
                firefly.style.setProperty('--fdriftx', `${-34 + (index % 11) * 7}px`);
                firefly.style.setProperty('--fdrifty', `${-22 + (index % 9) * 6}px`);
                fireflyField?.appendChild(firefly);
            }

            for (let index = 0; index < sunseedCount; index++) {
                const seed = document.createElement('span');
                seed.className =
                    index % 6 === 0
                        ? 'ssv3-sunseed is-coral'
                        : (
                            index % 5 === 0
                                ? 'ssv3-sunseed is-aqua'
                                : 'ssv3-sunseed'
                        );
                seed.style.setProperty('--seedx', `${2 + (index * 59) % 96}%`);
                seed.style.setProperty('--seeds', `${5 + (index % 5) * 1.4}px`);
                seed.style.setProperty('--seedd', `${9 + (index % 9) * .8}s`);
                seed.style.setProperty('--seeddelay', `${-(index % 16) * .72}s`);
                seed.style.setProperty('--seeddrift', `${-70 + (index % 12) * 13}px`);
                seed.style.setProperty('--seedrot', `${(index * 31) % 180 - 90}deg`);
                sunseedField?.appendChild(seed);
            }

            for (let index = 0; index < prismCount; index++) {
                const shard = document.createElement('span');
                shard.className = 'ssv3-prism-shard';
                shard.style.setProperty('--prx', `${6 + (index * 61) % 88}%`);
                shard.style.setProperty('--pry', `${8 + (index * 43) % 78}%`);
                shard.style.setProperty('--prs', `${10 + (index % 5) * 5}px`);
                shard.style.setProperty('--prd', `${7 + (index % 7) * 1.2}s`);
                shard.style.setProperty('--prdelay', `${-(index % 9) * .73}s`);
                shard.style.setProperty('--prrot', `${-35 + (index % 9) * 13}deg`);
                prismField?.appendChild(shard);
            }

            for (let index = 0; index < waterSparkCount; index++) {
                const spark = document.createElement('span');
                spark.className = 'ssv3-water-spark';
                spark.style.setProperty('--wsx', `${4 + (index * 37) % 92}%`);
                spark.style.setProperty('--wsy', `${58 + (index * 19) % 34}%`);
                spark.style.setProperty('--wsd', `${3.8 + (index % 6) * .62}s`);
                spark.style.setProperty('--wsdelay', `${-(index % 10) * .42}s`);
                waterSparkField?.appendChild(spark);
            }

            document.body.appendChild(world);

            requestAnimationFrame(() => {
                world.classList.add('is-active');
            });
        },

        createInterface() {
            document
                .querySelectorAll('.summer-solstice-ui-frame')
                .forEach(node => node.remove());

            const frame = document.createElement('div');
            frame.className =
                'summer-solstice-ui-frame summer-solstice-ui-v3 ui-theme-immune';
            frame.dataset.themeImmune = 'true';
            frame.setAttribute('aria-hidden', 'true');

            frame.innerHTML = `
                <div class="ssv3-ui-crown">
                    <span class="ssv3-ui-line line-left"></span>
                    <div class="ssv3-ui-medallion">
                        <span class="ssv3-ui-medallion-ring ring-a"></span>
                        <span class="ssv3-ui-medallion-ring ring-b"></span>
                        <b>☀</b>
                        <small>HẠ NHẬT</small>
                    </div>
                    <span class="ssv3-ui-line line-right"></span>
                </div>

                <div class="ssv2-ui-top">
                    <i></i>
                    <span>HẠ NHẬT · NHẬT DIỆU LƯU KIM</span>
                    <i></i>
                </div>

                <div class="ssv3-ui-rail rail-left">
                    <b></b><i></i><i></i><i></i><i></i><i></i>
                </div>
                <div class="ssv3-ui-rail rail-right">
                    <b></b><i></i><i></i><i></i><i></i><i></i>
                </div>

                <div class="ssv2-ui-side side-left">
                    <b></b><i></i><i></i><i></i>
                </div>
                <div class="ssv2-ui-side side-right">
                    <b></b><i></i><i></i><i></i>
                </div>

                <span class="ssv3-ui-corner corner-tl"><i></i><b>✦</b></span>
                <span class="ssv3-ui-corner corner-tr"><i></i><b>✦</b></span>
                <span class="ssv3-ui-corner corner-bl"><i></i><b>≈</b></span>
                <span class="ssv3-ui-corner corner-br"><i></i><b>≈</b></span>

                <span class="ssv2-ui-corner corner-tl">✦</span>
                <span class="ssv2-ui-corner corner-tr">✦</span>
                <span class="ssv2-ui-corner corner-bl">≈</span>
                <span class="ssv2-ui-corner corner-br">≈</span>

                <div class="ssv3-ui-bottom-seal">
                    <span></span>
                    <div>
                        <small>GOLDEN HOUR · MIRROR WATER</small>
                        <strong>☀　HẠ GIỚI LƯU QUANG　☀</strong>
                    </div>
                    <span></span>
                </div>

                <div class="ssv2-ui-bottom">
                    <i></i>
                    <strong>GOLDEN SUMMER · AQUA SHIMMER</strong>
                    <i></i>
                </div>
            `;

            document.body.appendChild(frame);

            requestAnimationFrame(() => {
                frame.classList.add('is-mounted');
            });
        },

        createPetRealm() {
            const container =
                document.getElementById('virtual-pet-container');
            const pet = this.getPet();

            if (!container || !pet) {
                return false;
            }

            container
                .querySelectorAll('.summer-solstice-pet-realm')
                .forEach(node => node.remove());

            container.classList.add(
                'pet-summer-solstice-stage',
                'summer-solstice-awakening'
            );

            pet.classList.add(
                'summer-solstice-avatar',
                'summer-solstice-v3-avatar'
            );
            pet.setAttribute('draggable', 'false');

            const realm = document.createElement('div');
            realm.className =
                'summer-solstice-pet-realm summer-solstice-pet-realm-v3 ui-theme-immune';
            realm.dataset.themeImmune = 'true';
            realm.setAttribute('aria-hidden', 'true');

            realm.innerHTML = `
                <!-- V4 · AURA MÙA HẠ — LUÔN HIỆN QUANH NHÂN VẬT -->
                <span class="ssv4-pet-aura aura-warm"></span>
                <span class="ssv4-pet-aura aura-aqua"></span>
                <span class="ssv4-pet-aura aura-coral"></span>

                <span class="ssv4-pet-corona">
                    ${Array.from({ length: 12 }, (_, i) =>
                        `<i style="--i:${i}"></i>`
                    ).join('')}
                </span>

                <span class="ssv4-pet-ribbon ribbon-a"></span>
                <span class="ssv4-pet-ribbon ribbon-b"></span>
                <span class="ssv4-pet-ribbon ribbon-c"></span>

                <span class="ssv4-pet-orb-field"></span>
                <span class="ssv4-pet-droplet-field"></span>

                <span class="ssv2-pet-halo halo-a"></span>
                <span class="ssv2-pet-halo halo-b"></span>

                <span class="ssv3-pet-sunwheel">
                    <i class="ring r1"></i>
                    <i class="ring r2"></i>
                    <i class="ring r3"></i>
                    <i class="ring r4"></i>
                    <b class="core">☀</b>
                    <span class="rays">
                        ${Array.from({ length: 20 }, (_, i) =>
                            `<u style="--i:${i}"></u>`
                        ).join('')}
                    </span>
                </span>

                <span class="ssv2-pet-mandala">
                    <i class="ring r1"></i>
                    <i class="ring r2"></i>
                    <i class="ring r3"></i>
                    <b></b>
                </span>

                <span class="ssv3-pet-glass-wing wing-left"></span>
                <span class="ssv3-pet-glass-wing wing-right"></span>

                <span class="ssv3-pet-wave wave-a"></span>
                <span class="ssv3-pet-wave wave-b"></span>
                <span class="ssv3-pet-wave wave-c"></span>

                <span class="ssv2-pet-orbit orbit-a"></span>
                <span class="ssv2-pet-orbit orbit-b"></span>
                <span class="ssv2-pet-caustic caustic-a"></span>
                <span class="ssv2-pet-caustic caustic-b"></span>

                <span class="ssv3-pet-crown">
                    <i></i><b>✦</b><i></i>
                </span>

                <span class="ssv3-pet-pedestal">
                    <i class="mirror"></i>
                    <i class="gold-line"></i>
                </span>

                <span class="ssv2-pet-motes"></span>
                <span class="ssv3-pet-fireflies"></span>
                <span class="ssv3-pet-sunseeds"></span>
            `;

            const moteField = realm.querySelector('.ssv2-pet-motes');
            const fireflyField = realm.querySelector('.ssv3-pet-fireflies');
            const seedField = realm.querySelector('.ssv3-pet-sunseeds');
            const orbField = realm.querySelector('.ssv4-pet-orb-field');
            const dropletField = realm.querySelector('.ssv4-pet-droplet-field');

            for (let index = 0; index < 16; index++) {
                const mote = document.createElement('i');
                mote.className = index % 4 === 0 ? 'is-aqua' : '';
                mote.style.setProperty('--mi', String(index));
                mote.style.setProperty('--mx', `${8 + (index * 29) % 85}%`);
                mote.style.setProperty('--my', `${8 + (index * 47) % 82}%`);
                moteField?.appendChild(mote);
            }

            for (let index = 0; index < 18; index++) {
                const firefly = document.createElement('i');
                firefly.className = index % 6 === 0 ? 'is-aqua' : '';
                firefly.style.setProperty('--pfx', `${4 + (index * 37) % 92}%`);
                firefly.style.setProperty('--pfy', `${7 + (index * 53) % 84}%`);
                firefly.style.setProperty('--pfd', `${3.6 + (index % 6) * .55}s`);
                firefly.style.setProperty('--pfdelay', `${-(index % 9) * .47}s`);
                fireflyField?.appendChild(firefly);
            }

            for (let index = 0; index < 11; index++) {
                const seed = document.createElement('i');
                seed.style.setProperty('--psi', String(index));
                seed.style.setProperty('--psx', `${8 + (index * 43) % 83}%`);
                seed.style.setProperty('--psy', `${12 + (index * 31) % 74}%`);
                seed.style.setProperty('--psdelay', `${-(index % 7) * .5}s`);
                seedField?.appendChild(seed);
            }

            // V4 · 16 quang châu chạy quỹ đạo quanh nhân vật.
            for (let index = 0; index < 16; index++) {
                const orb = document.createElement('i');

                orb.className =
                    index % 5 === 0
                        ? 'is-aqua'
                        : (
                            index % 4 === 0
                                ? 'is-coral'
                                : 'is-gold'
                        );

                orb.style.setProperty(
                    '--ssv4-orb-angle',
                    `${index * 22.5}deg`
                );
                orb.style.setProperty(
                    '--ssv4-orb-distance',
                    `${72 + (index % 4) * 14}px`
                );
                orb.style.setProperty(
                    '--ssv4-orb-size',
                    `${3 + (index % 3) * 1.2}px`
                );
                orb.style.setProperty(
                    '--ssv4-orb-delay',
                    `${-(index % 8) * .38}s`
                );

                orbField?.appendChild(orb);
            }

            // V4 · giọt thủy quang lơ lửng quanh chân và hai bên pet.
            for (let index = 0; index < 12; index++) {
                const drop = document.createElement('i');

                drop.className =
                    index % 4 === 0
                        ? 'is-gold'
                        : 'is-aqua';

                drop.style.setProperty(
                    '--ssv4-drop-x',
                    `${7 + (index * 41) % 86}%`
                );
                drop.style.setProperty(
                    '--ssv4-drop-y',
                    `${18 + (index * 37) % 70}%`
                );
                drop.style.setProperty(
                    '--ssv4-drop-delay',
                    `${-(index % 7) * .46}s`
                );
                drop.style.setProperty(
                    '--ssv4-drop-drift',
                    `${index % 2 === 0 ? -10 : 10}px`
                );

                dropletField?.appendChild(drop);
            }

            container.insertBefore(realm, pet);

            /*
             * V4 · FOREGROUND SPARKLES:
             * Realm nền luôn nằm sau pet. Lớp này được đặt SAU ảnh pet
             * để vài ánh kim/giọt nước thật sự lướt phía trước nhân vật,
             * tạo cảm giác "bao quanh" thay vì chỉ là vòng tròn ở sau lưng.
             */
            const foreground = document.createElement('div');
            foreground.className =
                'summer-solstice-pet-realm summer-solstice-pet-foreground-v4 ui-theme-immune';
            foreground.dataset.themeImmune = 'true';
            foreground.setAttribute('aria-hidden', 'true');

            foreground.innerHTML = `
                <span class="ssv4-pet-front-glints"></span>
                <span class="ssv4-pet-front-drops"></span>
                <span class="ssv4-pet-front-streak streak-a"></span>
                <span class="ssv4-pet-front-streak streak-b"></span>
            `;

            const frontGlints =
                foreground.querySelector('.ssv4-pet-front-glints');

            const frontDrops =
                foreground.querySelector('.ssv4-pet-front-drops');

            for (let index = 0; index < 10; index++) {
                const glint = document.createElement('i');

                glint.style.setProperty(
                    '--ssv4-fgx',
                    `${12 + (index * 43) % 77}%`
                );
                glint.style.setProperty(
                    '--ssv4-fgy',
                    `${15 + (index * 31) % 67}%`
                );
                glint.style.setProperty(
                    '--ssv4-fgdelay',
                    `${-(index % 6) * .41}s`
                );

                frontGlints?.appendChild(glint);
            }

            for (let index = 0; index < 7; index++) {
                const drop = document.createElement('i');

                drop.style.setProperty(
                    '--ssv4-fdx',
                    `${17 + (index * 47) % 69}%`
                );
                drop.style.setProperty(
                    '--ssv4-fdy',
                    `${25 + (index * 29) % 58}%`
                );
                drop.style.setProperty(
                    '--ssv4-fddelay',
                    `${-(index % 5) * .52}s`
                );

                frontDrops?.appendChild(drop);
            }

            pet.insertAdjacentElement('afterend', foreground);

            window.setTimeout(() => {
                container?.classList.remove('summer-solstice-awakening');
            }, 1450);

            return true;
        },

        createClickBurst(x, y, strong = false) {
            const burst = document.createElement('span');
            burst.className =
                strong
                    ? 'summer-solstice-click-burst is-strong is-v3 ui-theme-immune'
                    : 'summer-solstice-click-burst is-v3 ui-theme-immune';

            burst.dataset.themeImmune = 'true';
            burst.style.left = `${x}px`;
            burst.style.top = `${y}px`;

            burst.innerHTML = `
                <b class="ssv3-click-core"></b>
                <b class="ssv3-click-ring ring-a"></b>
                <b class="ssv3-click-ring ring-b"></b>
                <u class="ssv3-click-wave"></u>
            `;

            const count = strong ? 22 : 12;

            for (let index = 0; index < count; index++) {
                const spark = document.createElement('i');
                spark.className =
                    index % 6 === 0
                        ? 'is-aqua'
                        : (
                            index % 5 === 0
                                ? 'is-prism'
                                : ''
                        );

                spark.style.setProperty(
                    '--ssv2-click-angle',
                    `${index * (360 / count)}deg`
                );
                spark.style.setProperty(
                    '--ssv2-click-distance',
                    `${strong ? 62 + (index % 6) * 12 : 34 + (index % 5) * 7}px`
                );
                spark.style.setProperty(
                    '--ssv2-click-delay',
                    `${(index % 5) * .022}s`
                );
                burst.appendChild(spark);
            }

            document.body.appendChild(burst);

            window.setTimeout(() => {
                burst.remove();
            }, strong ? 1320 : 880);
        },

        installGlobalClick() {
            if (this.globalClickHandler) {
                return;
            }

            this.globalClickHandler = event => {
                if (
                    !document.documentElement.classList.contains(
                        'summer-solstice-equipped'
                    )
                ) {
                    return;
                }

                const target =
                    event.target instanceof Element
                        ? event.target
                        : null;

                if (
                    target?.closest(
                        '#virtual-pet-img.premium-summer-solstice-magic,' +
                        '.pet-close-btn'
                    )
                ) {
                    return;
                }

                this.createClickBurst(
                    event.clientX,
                    event.clientY,
                    false
                );
            };

            document.addEventListener(
                'pointerdown',
                this.globalClickHandler,
                true
            );
        },

        createDragTrail(x, y) {
            const trail = document.createElement('span');
            const roll = Math.random();
            trail.className =
                roll < .28
                    ? 'summer-solstice-drag-trail is-water ui-theme-immune'
                    : (
                        roll < .44
                            ? 'summer-solstice-drag-trail is-prism ui-theme-immune'
                            : 'summer-solstice-drag-trail ui-theme-immune'
                    );

            trail.dataset.themeImmune = 'true';
            trail.style.left = `${x + (Math.random() * 26 - 13)}px`;
            trail.style.top = `${y + (Math.random() * 22 - 11)}px`;
            trail.style.setProperty('--ssv2-trail-drift-x', `${Math.random() * 62 - 31}px`);
            trail.style.setProperty('--ssv2-trail-drift-y', `${18 + Math.random() * 42}px`);
            trail.style.setProperty('--ssv3-trail-turn', `${Math.random() * 120 - 60}deg`);

            document.body.appendChild(trail);

            window.setTimeout(() => {
                trail.remove();
            }, 1280);
        },

        createScreenBurst(originX, originY) {
            document
                .querySelectorAll('.summer-solstice-screen-burst-v3')
                .forEach(node => node.remove());

            const burst = document.createElement('div');
            burst.className =
                'summer-solstice-screen-burst-v3 ui-theme-immune';
            burst.dataset.themeImmune = 'true';
            burst.setAttribute('aria-hidden', 'true');
            burst.style.setProperty('--ssv3-burst-x', `${originX}px`);
            burst.style.setProperty('--ssv3-burst-y', `${originY}px`);

            burst.innerHTML = `
                <div class="ssv3-burst-dim"></div>
                <div class="ssv3-burst-origin">
                    <span class="core"></span>
                    <span class="ring ring-a"></span>
                    <span class="ring ring-b"></span>
                    <span class="ring ring-c"></span>
                    <div class="rays">
                        ${Array.from({ length: 18 }, (_, i) =>
                            `<i style="--i:${i}"></i>`
                        ).join('')}
                    </div>
                </div>
                <span class="ssv3-burst-wave wave-a"></span>
                <span class="ssv3-burst-wave wave-b"></span>
                <span class="ssv3-burst-wave wave-c"></span>
                <span class="ssv3-burst-wave wave-d"></span>
                <div class="ssv3-burst-prism prism-a"></div>
                <div class="ssv3-burst-prism prism-b"></div>
                <div class="ssv3-burst-particles"></div>
                <div class="ssv3-burst-shards"></div>
                <div class="ssv3-burst-caption">
                    <small>HẠ NHẬT THỨC TỈNH</small>
                    <strong>NHẬT QUANG · THỦY KÍNH</strong>
                </div>
            `;

            const particles = burst.querySelector('.ssv3-burst-particles');
            const shards = burst.querySelector('.ssv3-burst-shards');
            const mobile = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse)'
            ).matches;

            const particleCount = getLuxuryQualityCount(mobile ? 18 : 34);
            const shardCount = getLuxuryQualityCount(mobile ? 8 : 16);

            for (let index = 0; index < particleCount; index++) {
                const particle = document.createElement('span');
                particle.className = index % 6 === 0 ? 'is-aqua' : '';
                particle.style.setProperty('--ba', `${index * (360 / particleCount)}deg`);
                particle.style.setProperty('--bd', `${85 + (index % 9) * 24}px`);
                particle.style.setProperty('--bs', `${3 + (index % 5) * 1.1}px`);
                particle.style.setProperty('--bdelay', `${(index % 8) * .018}s`);
                particles?.appendChild(particle);
            }

            for (let index = 0; index < shardCount; index++) {
                const shard = document.createElement('i');
                shard.style.setProperty('--sha', `${index * (360 / shardCount) + 11}deg`);
                shard.style.setProperty('--shd', `${110 + (index % 6) * 34}px`);
                shard.style.setProperty('--shdelay', `${(index % 6) * .03}s`);
                shard.style.setProperty('--shrot', `${-45 + (index % 7) * 18}deg`);
                shards?.appendChild(shard);
            }

            document.body.appendChild(burst);
            requestAnimationFrame(() => burst.classList.add('is-active'));

            this.setRepairTimer(() => {
                burst.classList.add('is-ending');
            }, 1700);

            this.setRepairTimer(() => {
                burst.remove();
            }, 2250);
        },

        createUltimate(originX, originY) {
            document
                .querySelectorAll('.summer-solstice-ultimate')
                .forEach(node => node.remove());

            const ultimate = document.createElement('div');
            ultimate.className =
                'summer-solstice-ultimate summer-solstice-ultimate-v3 ui-theme-immune';
            ultimate.dataset.themeImmune = 'true';
            ultimate.setAttribute('aria-hidden', 'true');
            ultimate.style.setProperty('--ssv2-origin-x', `${originX}px`);
            ultimate.style.setProperty('--ssv2-origin-y', `${originY}px`);

            ultimate.innerHTML = `
                <div class="ssv2-ult-dim"></div>
                <div class="ssv3-ult-sky"></div>
                <div class="ssv3-ult-vignette"></div>

                <div class="ssv2-ult-origin">
                    <span class="ssv2-ult-origin-core"></span>
                    <span class="ssv2-ult-origin-ring ring-a"></span>
                    <span class="ssv2-ult-origin-ring ring-b"></span>
                </div>

                <div class="ssv3-ult-origin-crown">
                    <span class="core">✦</span>
                    <span class="ring ring-a"></span>
                    <span class="ring ring-b"></span>
                    <span class="ring ring-c"></span>
                </div>

                <div class="ssv2-ult-sun">
                    <span class="core"></span>
                    <i class="ring ring-a"></i>
                    <i class="ring ring-b"></i>
                    <i class="ring ring-c"></i>
                    <div class="spokes">
                        ${Array.from({ length: 16 }, (_, i) =>
                            `<b style="--i:${i}"></b>`
                        ).join('')}
                    </div>
                </div>

                <div class="ssv3-ult-astrolabe">
                    <span class="core"><b>☀</b><i></i></span>
                    <span class="ring ring-a"></span>
                    <span class="ring ring-b"></span>
                    <span class="ring ring-c"></span>
                    <span class="ring ring-d"></span>
                    <span class="ring ring-e"></span>
                    <div class="rays">
                        ${Array.from({ length: 24 }, (_, i) =>
                            `<i style="--i:${i}"></i>`
                        ).join('')}
                    </div>
                    <div class="marks">
                        ${Array.from({ length: 12 }, (_, i) =>
                            `<b style="--i:${i}"></b>`
                        ).join('')}
                    </div>
                </div>

                <div class="ssv3-ult-light-pillar"></div>
                <div class="ssv3-ult-halo halo-a"></div>
                <div class="ssv3-ult-halo halo-b"></div>
                <div class="ssv3-ult-halo halo-c"></div>

                <div class="ssv3-ult-curtain curtain-a"></div>
                <div class="ssv3-ult-curtain curtain-b"></div>
                <div class="ssv3-ult-curtain curtain-c"></div>
                <div class="ssv3-ult-curtain curtain-d"></div>

                <div class="ssv2-ult-ripple ripple-a"></div>
                <div class="ssv2-ult-ripple ripple-b"></div>
                <div class="ssv2-ult-ripple ripple-c"></div>

                <div class="ssv3-ult-wave-ring wave-a"></div>
                <div class="ssv3-ult-wave-ring wave-b"></div>
                <div class="ssv3-ult-wave-ring wave-c"></div>
                <div class="ssv3-ult-wave-ring wave-d"></div>

                <div class="ssv2-ult-ribbon ribbon-a"></div>
                <div class="ssv2-ult-ribbon ribbon-b"></div>
                <div class="ssv2-ult-ribbon ribbon-c"></div>

                <div class="ssv3-ult-prism prism-a"></div>
                <div class="ssv3-ult-prism prism-b"></div>
                <div class="ssv3-ult-prism prism-c"></div>

                <div class="ssv3-ult-mirror-sea">
                    <span class="sea-line line-a"></span>
                    <span class="sea-line line-b"></span>
                    <span class="sea-line line-c"></span>
                    <span class="sea-line line-d"></span>
                    <span class="sea-line line-e"></span>
                    <span class="reflection"></span>
                </div>

                <div class="ssv2-ult-caustic"></div>
                <div class="ssv3-ult-caustic caustic-a"></div>
                <div class="ssv3-ult-caustic caustic-b"></div>

                <div class="ssv2-ult-starfield"></div>
                <div class="ssv2-ult-petalfield"></div>
                <div class="ssv3-ult-fireflies"></div>
                <div class="ssv3-ult-sunseeds"></div>
                <div class="ssv3-ult-shards"></div>
                <div class="ssv3-ult-water-sparks"></div>

                <div class="ssv3-ult-title-frame">
                    <span class="ornament ornament-left"></span>
                    <div class="ssv2-ult-title">
                        <small>HẠ NHẬT THẦN VỰC · GOLDEN SOLSTICE</small>
                        <strong>NHẬT DIỆU · LƯU KIM</strong>
                        <em>Kim quang kết hạ · thủy kính lưu huy · vạn điểm tinh quang</em>
                    </div>
                    <span class="ornament ornament-right"></span>
                </div>
            `;

            const starField = ultimate.querySelector('.ssv2-ult-starfield');
            const petalField = ultimate.querySelector('.ssv2-ult-petalfield');
            const fireflyField = ultimate.querySelector('.ssv3-ult-fireflies');
            const seedField = ultimate.querySelector('.ssv3-ult-sunseeds');
            const shardField = ultimate.querySelector('.ssv3-ult-shards');
            const waterField = ultimate.querySelector('.ssv3-ult-water-sparks');

            const mobile = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse)'
            ).matches;

            const starCount = getLuxuryQualityCount(mobile ? 26 : 54);
            const petalCount = getLuxuryQualityCount(mobile ? 14 : 28);
            const fireflyCount = getLuxuryQualityCount(mobile ? 20 : 46);
            const seedCount = getLuxuryQualityCount(mobile ? 18 : 38);
            const shardCount = getLuxuryQualityCount(mobile ? 10 : 24);
            const waterCount = getLuxuryQualityCount(mobile ? 14 : 32);

            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('span');
                star.className =
                    index % 6 === 0
                        ? 'is-aqua'
                        : (
                            index % 4 === 0
                                ? 'is-star'
                                : ''
                        );
                star.style.setProperty('--ua', `${index * (360 / starCount)}deg`);
                star.style.setProperty('--ud', `${130 + (index % 10) * 30}px`);
                star.style.setProperty('--us', `${3 + (index % 5) * 1.25}px`);
                star.style.setProperty('--udel', `${(index % 9) * .022}s`);
                starField?.appendChild(star);
            }

            for (let index = 0; index < petalCount; index++) {
                const petal = document.createElement('span');
                petal.className = index % 5 === 0 ? 'is-aqua' : '';
                petal.style.setProperty('--px', `${4 + (index * 43) % 92}%`);
                petal.style.setProperty('--pdelay', `${(index % 8) * .065}s`);
                petal.style.setProperty('--prot', `${-45 + (index % 11) * 17}deg`);
                petal.style.setProperty('--pdrift', `${-80 + (index % 10) * 18}px`);
                petalField?.appendChild(petal);
            }

            for (let index = 0; index < fireflyCount; index++) {
                const firefly = document.createElement('span');
                firefly.className = index % 8 === 0 ? 'is-aqua' : '';
                firefly.style.setProperty('--ufx', `${3 + (index * 47) % 94}%`);
                firefly.style.setProperty('--ufy', `${5 + (index * 61) % 86}%`);
                firefly.style.setProperty('--ufs', `${2 + (index % 5) * .95}px`);
                firefly.style.setProperty('--ufd', `${3.4 + (index % 7) * .52}s`);
                firefly.style.setProperty('--ufdelay', `${(index % 12) * .05}s`);
                fireflyField?.appendChild(firefly);
            }

            for (let index = 0; index < seedCount; index++) {
                const seed = document.createElement('span');
                seed.className =
                    index % 6 === 0
                        ? 'is-coral'
                        : (
                            index % 5 === 0
                                ? 'is-aqua'
                                : ''
                        );
                seed.style.setProperty('--usx', `${2 + (index * 53) % 96}%`);
                seed.style.setProperty('--usd', `${3.6 + (index % 7) * .42}s`);
                seed.style.setProperty('--usdelay', `${(index % 11) * .045}s`);
                seed.style.setProperty('--usdrift', `${-90 + (index % 11) * 18}px`);
                seed.style.setProperty('--usrot', `${-60 + (index % 13) * 19}deg`);
                seedField?.appendChild(seed);
            }

            for (let index = 0; index < shardCount; index++) {
                const shard = document.createElement('span');
                shard.style.setProperty('--ushx', `${5 + (index * 67) % 90}%`);
                shard.style.setProperty('--ushy', `${9 + (index * 41) % 72}%`);
                shard.style.setProperty('--ushs', `${12 + (index % 6) * 6}px`);
                shard.style.setProperty('--ushdelay', `${(index % 8) * .05}s`);
                shard.style.setProperty('--ushrot', `${-40 + (index % 9) * 15}deg`);
                shardField?.appendChild(shard);
            }

            for (let index = 0; index < waterCount; index++) {
                const spark = document.createElement('span');
                spark.style.setProperty('--uwx', `${3 + (index * 31) % 94}%`);
                spark.style.setProperty('--uwy', `${61 + (index * 17) % 31}%`);
                spark.style.setProperty('--uwdelay', `${(index % 10) * .05}s`);
                spark.style.setProperty('--uws', `${7 + (index % 5) * 3}px`);
                waterField?.appendChild(spark);
            }

            document.body.appendChild(ultimate);
            document.documentElement.classList.add(
                'summer-solstice-skill-active'
            );

            requestAnimationFrame(() => {
                ultimate.classList.add('is-active');
            });

            this.setRepairTimer(() => {
                ultimate.classList.add('is-climax');
            }, 980);

            this.setRepairTimer(() => {
                ultimate.classList.add('is-second-climax');
            }, 2050);

            this.setRepairTimer(() => {
                ultimate.classList.add('is-ending');
            }, 4550);

            this.setRepairTimer(() => {
                ultimate.remove();
                document.documentElement.classList.remove(
                    'summer-solstice-skill-active'
                );
            }, 5650);
        },

        installPetSkill() {
            const container =
                document.getElementById('virtual-pet-container');
            const pet = this.getPet();

            if (!container || !pet) {
                return false;
            }

            if (
                this.activePetElement === pet &&
                this.petClickHandler
            ) {
                return true;
            }

            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            this.activePetElement = pet;

            this.petPointerDownHandler = event => {
                this.dragState = {
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    moved: false,
                    active: true
                };
            };

            this.petPointerMoveHandler = event => {
                const state = this.dragState;

                if (!state?.active || state.pointerId !== event.pointerId) {
                    return;
                }

                const distance =
                    Math.abs(event.clientX - state.startX) +
                    Math.abs(event.clientY - state.startY);

                if (distance > 7) {
                    state.moved = true;
                }

                if (state.moved && Math.random() < .72) {
                    this.createDragTrail(event.clientX, event.clientY);
                }
            };

            this.petPointerUpHandler = event => {
                if (this.dragState?.pointerId === event.pointerId) {
                    const moved = this.dragState.moved;
                    this.dragState.active = false;

                    if (moved) {
                        this.setRepairTimer(() => {
                            if (this.dragState) {
                                this.dragState.moved = false;
                            }
                        }, 80);
                    }
                }
            };

            this.petClickHandler = event => {
                if (this.dragState?.moved) {
                    this.dragState.moved = false;
                    return;
                }

                if (
                    this.skillLocked ||
                    !document.documentElement.classList.contains(
                        'summer-solstice-equipped'
                    )
                ) {
                    return;
                }

                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) {
                    return;
                }

                this.skillLocked = true;
                event.preventDefault();
                event.stopPropagation();

                const rect = pet.getBoundingClientRect();
                const originX =
                    Number.isFinite(event.clientX) && event.clientX > 0
                        ? event.clientX
                        : rect.left + rect.width / 2;
                const originY =
                    Number.isFinite(event.clientY) && event.clientY > 0
                        ? event.clientY
                        : rect.top + rect.height / 2;

                container.classList.remove(
                    'summer-solstice-casting',
                    'summer-solstice-v3-casting'
                );
                void container.offsetWidth;
                container.classList.add(
                    'summer-solstice-casting',
                    'summer-solstice-v3-casting'
                );

                this.createClickBurst(originX, originY, true);
                this.createScreenBurst(originX, originY);

                const realm = container.querySelector(
                    '.summer-solstice-pet-realm'
                );

                const localBurst = document.createElement('span');
                localBurst.className =
                    'summer-solstice-local-burst summer-solstice-local-burst-v3 ui-theme-immune';
                localBurst.dataset.themeImmune = 'true';
                localBurst.innerHTML = `
                    <b class="ssv3-local-core">☀</b>
                    <span class="ssv3-local-ring ring-a"></span>
                    <span class="ssv3-local-ring ring-b"></span>
                    <span class="ssv3-local-rays">
                        ${Array.from({ length: 12 }, (_, i) =>
                            `<i style="--i:${i}"></i>`
                        ).join('')}
                    </span>
                    <span class="ssv3-local-particles"></span>
                `;

                const localParticles =
                    localBurst.querySelector('.ssv3-local-particles');
                for (let index = 0; index < 20; index++) {
                    const particle = document.createElement('i');
                    particle.className = index % 5 === 0 ? 'is-aqua' : '';
                    particle.style.setProperty('--la', `${index * 18}deg`);
                    particle.style.setProperty('--ld', `${45 + (index % 7) * 13}px`);
                    particle.style.setProperty('--ldelay', `${(index % 6) * .02}s`);
                    localParticles?.appendChild(particle);
                }
                realm?.appendChild(localBurst);

                const dialogue = document.createElement('div');
                dialogue.className =
                    'summer-solstice-pet-dialogue ui-theme-immune';
                dialogue.dataset.themeImmune = 'true';
                dialogue.innerHTML = `
                    <small>☀ HẠ NHẬT THỨC TỈNH · SOLSTICE AWAKENING</small>
                    <strong>NHẬT DIỆU · LƯU KIM</strong>
                    <em>Kim quang soi thủy kính · hạ giới vạn điểm lưu huy</em>
                `;
                container.appendChild(dialogue);

                this.createUltimate(originX, originY);

                this.setRepairTimer(() => {
                    container.classList.remove(
                        'summer-solstice-casting',
                        'summer-solstice-v3-casting'
                    );
                    localBurst.remove();
                    dialogue.remove();
                }, 4550);

                this.setRepairTimer(() => {
                    this.skillLocked = false;
                }, 5900);
            };

            pet.addEventListener('pointerdown', this.petPointerDownHandler);
            document.addEventListener('pointermove', this.petPointerMoveHandler);
            document.addEventListener('pointerup', this.petPointerUpHandler);
            document.addEventListener('pointercancel', this.petPointerUpHandler);
            pet.addEventListener('click', this.petClickHandler);

            return true;
        },

        installObserver() {
            const container =
                document.getElementById('virtual-pet-container');

            if (!container) {
                return;
            }

            if (this.observer) {
                this.observer.disconnect();
            }

            this.observer = new MutationObserver(() => {
                if (this.observerTimer) {
                    window.clearTimeout(this.observerTimer);
                }

                this.observerTimer = window.setTimeout(() => {
                    this.observerTimer = null;

                    const activePet = this.getPet();
                    const activePetId = localStorage.getItem('active_pet');

                    if (
                        !activePet &&
                        activePetId !== 'pet_luxury_mua_ha'
                    ) {
                        this.clear();
                        return;
                    }

                    if (activePet) {
                        this.repair();
                    }
                }, 140);
            });

            this.observer.observe(
                container,
                {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'style']
                }
            );
        },

        promoteStylesheetPriority() {
            const head = document.head;

            if (!head) {
                return;
            }

            document
                .querySelectorAll('link[rel="stylesheet"], style')
                .forEach(node => {
                    const href =
                        node instanceof HTMLLinkElement
                            ? String(node.href || '')
                            : '';

                    const isSummerStylesheet =
                        /premium-mua-xuan|premium-bon-mua-xuan-ha/i.test(href) ||
                        (
                            node instanceof HTMLStyleElement &&
                            String(node.textContent || '').includes(
                                '.summer-solstice-equipped'
                            )
                        );

                    if (isSummerStylesheet && node.parentNode === head) {
                        head.appendChild(node);
                    }
                });
        },

        repair() {
            if (
                !document.documentElement.classList.contains(
                    'summer-solstice-equipped'
                )
            ) {
                return;
            }

            const pet = this.getPet();

            if (!pet) {
                return;
            }

            if (!document.querySelector('.summer-solstice-world')) {
                this.createWorld();
            }

            if (!document.querySelector('.summer-solstice-ui-frame')) {
                this.createInterface();
            }

            if (
                !document.querySelector(
                    '#virtual-pet-container .summer-solstice-pet-realm'
                )
            ) {
                this.createPetRealm();
            }

            if (this.activePetElement !== pet || !this.petClickHandler) {
                this.installPetSkill();
            }

            if (!this.globalClickHandler) {
                this.installGlobalClick();
            }
        },

        mount() {
            this.clear();

            const pet = this.getPet();

            if (!pet) {
                return false;
            }

            document.documentElement.classList.add(
                'summer-solstice-equipped',
                'summer-solstice-v3-equipped'
            );
            document.body?.classList.add(
                'theme-summer-solstice-stage'
            );

            this.promoteStylesheetPriority();
            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installPetSkill();
            this.installObserver();

            [120, 420, 900, 1600, 2800].forEach(delay => {
                this.setRepairTimer(() => {
                    this.repair();
                }, delay);
            });

            return true;
        },

        restore(attempt = 0) {
            const activePetId = localStorage.getItem('active_pet');
            const hasSummerPet = !!this.getPet();

            if (
                activePetId !== 'pet_luxury_mua_ha' &&
                !hasSummerPet
            ) {
                return;
            }

            if (this.mount()) {
                return;
            }

            if (attempt < 24) {
                this.setRepairTimer(() => {
                    this.restore(attempt + 1);
                }, 160 + attempt * 35);
            }
        }
    };



    // ========================================================
    // NYX · HẮC DẠ NGUYÊN SƠ — THẦN THOẠI
    // - Bán 12.000 Coin
    // - Card + tag riêng, khóa theo data-item-id
    // - Chỉ là thú cưng; không tự bật theme/effect giao diện khác
    // ========================================================
    const MYTHIC_NYX_PET = {
        id: 'pet_mythic_nyx_1',
        name: 'NYX · Vĩnh Dạ Tinh Thần',
        type: 'pet',
        price: 12000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Thần thoại',
        tags: [
            'Thần thoại',
            'Nyx',
            'Nữ thần màn đêm',
            'Premium'
        ],

        image: 'assets/Premium/Thần thoại/nyx-nhanvat1.png',
        asset: 'assets/Premium/Thần thoại/nyx-nhanvat1.png',
        value: 'assets/Premium/Thần thoại/nyx-nhanvat1.png',
        luxuryTagImage:
            'assets/Premium/Thần thoại/nyx-tag1.png',
        isIcon: false,

        // Namespace hiệu ứng mới, không tái sử dụng pet cũ.
        petEffect: 'mythic-nyx-night-magic',
        premiumSuite: 'nyx-first-night-v2',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };



    // ========================================================
    // AETHER · THIÊN QUANG NGUYÊN SƠ — THẦN THOẠI
    // - Bán 15.000 Coin
    // - Card riêng nhưng giữ nguyên bố cục Luxury chuẩn
    // - Tag ảnh: assets/Premium/Thần thoại/aether-tag2.png
    // - Full suite độc lập, không ghi đè active_theme / active_effect
    // - MỘT CSS: css/aether-than-thoai.css
    // ========================================================
    const MYTHIC_AETHER_PET = {
        id: 'pet_mythic_aether_1',
        name: 'AETHER · Thiên Quang Nguyên Sơ',
        type: 'pet',
        price: 15000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Thần thoại',
        tags: [
            'Thần thoại',
            'Aether',
            'Thiên quang',
            'Premium'
        ],

        image: 'assets/Premium/Thần thoại/aether-nhan-vat2.png',
        asset: 'assets/Premium/Thần thoại/aether-nhan-vat2.png',
        value: 'assets/Premium/Thần thoại/aether-nhan-vat2.png',
        luxuryTagImage:
            'assets/Premium/Thần thoại/aether-tag2.png',
        isIcon: false,

        // Chỉ dùng class riêng của Aether; PetManager generic sẽ gắn class này.
        petEffect: 'mythic-aether-luminous-magic',
        premiumSuite: 'aether-luminous-heaven-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],

        // Click được LuxuryAetherRuntime quản lý hoàn toàn.
        disableClickEffect: true
    };




    // ========================================================
    // ĐÊM ĐẦY SAO · VAN GOGH INSPIRED — PREMIUM PET
    // - Bán 15.000 Coin
    // - Tag ảnh: assets/Premium/đêm đầy sao/tag.png
    // - Nhân vật: assets/Premium/đêm đầy sao/nam_nham_vat1.png
    // - Card riêng nhưng GIỮ NGUYÊN bố cục Luxury chuẩn
    // - Full-web suite độc lập; không ghi đè active_theme / active_effect
    // - MỘT CSS: css/dem-day-sao.css
    // ========================================================
    const STARRY_NIGHT_PREMIUM_PET = {
        id: 'pet_dem_day_sao_1',
        name: 'Tinh Dạ · Lữ Khách Đêm Sao',
        type: 'pet',
        price: 15000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Đêm đầy sao',
        tags: [
            'Đêm đầy sao',
            'Van Gogh',
            'Tinh dạ',
            'Premium'
        ],

        image: 'assets/Premium/đêm đầy sao/nam_nham_vat1.png',
        asset: 'assets/Premium/đêm đầy sao/nam_nham_vat1.png',
        value: 'assets/Premium/đêm đầy sao/nam_nham_vat1.png',
        luxuryTagImage: 'assets/Premium/đêm đầy sao/tag.png',
        isIcon: false,

        petEffect: 'starry-night-van-gogh-magic',
        premiumSuite: 'starry-night-canvas-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };



    // ========================================================
    // LORD OF THE MYSTERIES · KLEIN MORETTI — EVENT PREMIUM PET
    // - KHÔNG bán bằng Coin.
    // - Chỉ nhận từ sự kiện Lord of the Mysteries.
    // - Tag: assets/Premium/quỷ bí/tag1.png
    // - Nhân vật: assets/Premium/quỷ bí/klain_nha-vat.png
    // - Card riêng nhưng GIỮ NGUYÊN bố cục Luxury Store.
    // - Full suite độc lập; không ghi đè active_theme / active_effect.
    // - MỘT CSS: css/lord-of-mysteries-klein.css
    // ========================================================
    const LOTM_KLEIN_EVENT_PET = {
        id: 'pet_lotm_klein_event_1',
        name: 'Klein Moretti · Quỷ Bí Chi Chủ',
        type: 'pet',
        price: 0,
        isNonCoin: true,
        luxuryOnly: true,
        eventOnly: true,

        eventId: 'lord_of_the_mysteries_event',
        eventRewardTier: 'premium',

        tag: 'Lord of the Mysteries',
        tags: [
            'Lord of the Mysteries',
            'Quỷ Bí Chi Chủ',
            'Klein Moretti',
            'Premium',
            'Sự kiện'
        ],

        image: 'assets/Premium/quỷ bí/klain_nha-vat.png',
        asset: 'assets/Premium/quỷ bí/klain_nha-vat.png',
        value: 'assets/Premium/quỷ bí/klain_nha-vat.png',
        luxuryTagImage: 'assets/Premium/quỷ bí/tag1.png',
        isIcon: false,

        petEffect: 'lotm-klein-mystery-magic',
        premiumSuite: 'lotm-klein-sefirah-castle-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };


    // ========================================================
    // CẦM CƠ · CẦM MỘNG — TU TIÊN PREMIUM
    // - Bán 12.000 Coin
    // - Tag ảnh: assets/Premium/Tu tiên/cam_co_tag1.png
    // - Nhân vật: assets/Premium/Tu tiên/cam_co_nhan_vat1.png
    // - Card riêng nhưng GIỮ NGUYÊN bố cục Luxury Store.
    // - Full suite độc lập; không ghi đè active_theme / active_effect.
    // ========================================================
    const CAM_CO_CAM_MONG_PET = {
        id: 'pet_cam_co_cam_mong_1',
        name: 'Lạc Thanh Huyền',
        type: 'pet',
        price: 12000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Cầm Mộng',
        tags: [
            'Cầm Mộng',
            'Cầm Cơ',
            'Tu tiên',
            'Premium'
        ],

        image: 'assets/Premium/Tu tiên/cam_co_nhan_vat1.png',
        asset: 'assets/Premium/Tu tiên/cam_co_nhan_vat1.png',
        value: 'assets/Premium/Tu tiên/cam_co_nhan_vat1.png',
        luxuryTagImage: 'assets/Premium/Tu tiên/cam_co_tag1.png',
        isIcon: false,

        petEffect: 'cam-co-cam-mong-qin-dream-magic',
        premiumSuite: 'cam-co-cam-mong-palace-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };



    // ========================================================
    // TAMON'S B-SIDE · PREMIUM PET
    // - Bán 15.000 Coin
    // - Tag ảnh: assets/Premium/Tamon/tamon-tag1.png
    // - Nhân vật: assets/Premium/Tamon/tamon-nhan-vat1.png
    // - Card giữ đúng bố cục Luxury hiện có nhưng có skin riêng.
    // - Full suite độc lập; KHÔNG dùng ThemeManager/EffectManager.
    // ========================================================
    const TAMON_BSIDE_PET = {
        id: 'pet_tamon_b_side_1',
        name: "Tamon · Bóng Hồng Ngạo Nghễ  ",
        type: 'pet',
        price: 15000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: "Tamon's B-Side",
        tags: [
            "Tamon's B-Side",
            'Tamon',
            'B-Side',
            'Premium'
        ],

        image: 'assets/Premium/Tamon/tamon-nhan-vat1.png',
        asset: 'assets/Premium/Tamon/tamon-nhan-vat1.png',
        value: 'assets/Premium/Tamon/tamon-nhan-vat1.png',
        luxuryTagImage: 'assets/Premium/Tamon/tamon-tag1.png',
        isIcon: false,

        petEffect: 'tamon-b-side-soundwave-magic',
        premiumSuite: 'tamon-b-side-stage-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };


    // ========================================================
    // TAMON'S B-SIDE · PINK STATIC · PREMIUM PET #2
    // - KHÔNG bán bằng Coin
    // - Nhận từ sự kiện
    // - Tag: assets/Premium/Tamon/tamon-tag1.png
    // - Nhân vật: assets/Premium/Tamon/tamon-nhan-vat2.png
    // - Full suite hoàn toàn mới; không tái sử dụng hiệu ứng pet 1.
    // - Dùng CHUNG file css/tamon-b-side.css.
    // ========================================================
    const TAMON_PINKSTATIC_PET = {
        id: 'pet_tamon_b_side_2',
        name: 'Tamon · Hắc Miêu Thiếu Niên  ',
        type: 'pet',
        price: 0,
        isNonCoin: true,
        luxuryOnly: true,
        eventOnly: true,

        eventId: 'tamon_b_side_event',
        eventRewardTier: 'luxury',
        eventScoreRequired: 10,

        tag: "Tamon's B-Side",
        tags: [
            "Tamon's B-Side",
            'Tamon',
            'B-Side',
            'Pink Static',
            'Premium',
            'Sự kiện'
        ],

        image: 'assets/Premium/Tamon/tamon-nhan-vat2.png',
        asset: 'assets/Premium/Tamon/tamon-nhan-vat2.png',
        value: 'assets/Premium/Tamon/tamon-nhan-vat2.png',
        luxuryTagImage: 'assets/Premium/Tamon/tamon-tag1.png',
        isIcon: false,

        petEffect: 'tamon-pink-static-magic',
        premiumSuite: 'tamon-pink-static-stage-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };



    // ========================================================
    // TRUNG THU · NGUYỆT CUNG TIÊN TỬ — PREMIUM PET
    // - Đổi bằng 2 Xu Trung Thu đúng ngày Trung Thu
    // - Nhân vật: assets/Premium/Trung thu/hang_nhan_vat1.png
    // - Tag: assets/Premium/Trung thu/tag1.png
    // - Card riêng nhưng giữ đúng bố cục Luxury Store hiện hành.
    // - Full suite độc lập, KHÔNG chiếm active_theme / active_effect.
    // ========================================================
    const MID_AUTUMN_MOON_PET = {
        id: 'pet_trung_thu_nguyet_cung_tien_tu',
        name: 'Nguyệt Cung Tiên Tử',
        type: 'pet',
        price: 0,
        isNonCoin: true,
        midAutumnCoinPrice: 2,
        currency: 'mid_autumn_coin',
        luxuryOnly: true,
        eventOnly: true,

        tag: 'Trung thu',
        tags: [
            'Trung thu',
            'Nguyệt cung',
            'Cổ tích',
            'Premium'
        ],

        image: 'assets/Premium/Trung thu/hang_nhan_vat1.png',
        asset: 'assets/Premium/Trung thu/hang_nhan_vat1.png',
        value: 'assets/Premium/Trung thu/hang_nhan_vat1.png',
        luxuryTagImage: 'assets/Premium/Trung thu/tag1.png',
        isIcon: false,

        petEffect: 'midautumn-moon-palace-pet-magic',
        premiumSuite: 'midautumn-moon-palace-fairytale-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'pet-skill',
            'ultimate'
        ],

        // Click của pet do LuxuryMidAutumnRuntime quản lý.
        disableClickEffect: true
    };


    // ========================================================
    // TRUNG THU · CHÚ CUỘI — PREMIUM PET #2
    // - Đổi bằng 2 Xu Trung Thu đúng ngày Trung Thu.
    // - Nhân vật: assets/Premium/Trung thu/cuoi_nhan_vat2.png
    // - Dùng CHUNG ảnh tag Trung Thu với Nguyệt Cung Tiên Tử.
    // - Card riêng nhưng giữ nguyên bố cục Luxury Store.
    // - Full suite dùng runtime Trung Thu độc lập, có biến thể Cuội;
    //   KHÔNG chiếm active_theme / active_effect.
    // ========================================================
    const MID_AUTUMN_CUOI_PET = {
        id: 'pet_trung_thu_chu_cuoi_2',
        name: 'Chú Cuội · Nguyệt Quế Tiên Đồng',
        type: 'pet',
        price: 0,
        isNonCoin: true,
        midAutumnCoinPrice: 2,
        currency: 'mid_autumn_coin',
        luxuryOnly: true,
        eventOnly: true,

        tag: 'Trung thu',
        tags: [
            'Trung thu',
            'Chú Cuội',
            'Nguyệt quế',
            'Premium'
        ],

        image: 'assets/Premium/Trung thu/cuoi_nhan_vat2.png',
        asset: 'assets/Premium/Trung thu/cuoi_nhan_vat2.png',
        value: 'assets/Premium/Trung thu/cuoi_nhan_vat2.png',

        // CÙNG TAG với Nguyệt Cung Tiên Tử.
        luxuryTagImage: 'assets/Premium/Trung thu/tag1.png',
        isIcon: false,

        petEffect: 'midautumn-cuoi-moonwood-magic',
        premiumSuite: 'midautumn-cuoi-moonwood-fairytale-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'pet-skill',
            'ultimate'
        ],

        disableClickEffect: true
    };



    // ========================================================
    // LINK CLICK · CHENG XIAOSHI — PREMIUM PET
    // - Bán 12.000 Coin.
    // - Tag ảnh: assets/Premium/Lock/tag1.png
    // - Nhân vật: assets/Premium/Lock/Cheng Xiaoshi-nhan-vat1.png
    // - Card riêng nhưng giữ nguyên cấu trúc/bố cục Luxury Store.
    // - Full suite độc lập; KHÔNG ghi đè active_theme / active_effect.
    // ========================================================
    const LINKCLICK_CHENG_XIAOSHI_PET = {
        id: 'pet_linkclick_cheng_xiaoshi_1',
        name: 'Cheng Xiaoshi · Thời Quang Ảnh Giới',
        type: 'pet',
        price: 12000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Link Click',
        tags: [
            'Link Click',
            'Cheng Xiaoshi',
            'Thời Quang',
            'Premium'
        ],

        image: 'assets/Premium/Lock/Cheng Xiaoshi-nhan-vat1.png',
        asset: 'assets/Premium/Lock/Cheng Xiaoshi-nhan-vat1.png',
        value: 'assets/Premium/Lock/Cheng Xiaoshi-nhan-vat1.png',
        luxuryTagImage: 'assets/Premium/Lock/tag1.png',
        isIcon: false,

        petEffect: 'linkclick-cheng-timeframe-magic',
        premiumSuite: 'linkclick-cheng-timeframe-v2-cinematic',
        premiumLayers: [
            'world-effect',
            'interface',
            'cinematic-hud',
            'time-memory-world',
            'pet-realm',
            'global-click',
            'pet-skill',
            'ultimate'
        ],

        // Click pet do LuxuryLinkClickChengRuntime quản lý.
        disableClickEffect: true
    };


    // ========================================================
    // TRUNG THU · NGUYỆT CUNG — CSS LOADER
    // CHỈ MỘT file CSS đảm nhiệm toàn bộ:
    // card + pet realm + full-web skin + popup/input/slider/scrollbar
    // + click effect + fullscreen ultimate.
    // ========================================================
    function ensureMidAutumnStylesheet() {
        if (document.getElementById('midautumn-moon-palace-premium-style')) {
            return;
        }

        let href = '';

        if (window.MID_AUTUMN_MOON_CSS_PATH) {
            href = String(window.MID_AUTUMN_MOON_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script => /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i.test(script.src || ''));

            if (ownScript?.src) {
                try {
                    href = new URL('../css/trung-thu-nguyet-cung.css', ownScript.src).href;
                } catch (_) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL('css/trung-thu-nguyet-cung.css', document.baseURI).href;
        }

        const link = document.createElement('link');
        link.id = 'midautumn-moon-palace-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.midAutumnMoonPalace = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[Trung thu] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/trung-thu-nguyet-cung.css hoặc gán window.MID_AUTUMN_MOON_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
    }


    // ========================================================
    // TRUNG THU · NGUYỆT CUNG — FULL PREMIUM RUNTIME V1
    // Namespace: midautumn-* / ma-*
    // KHÔNG gọi ThemeManager / EffectManager.
    // Runtime sống cùng pet; gỡ/đổi pet là dọn sạch toàn bộ.
    // ========================================================
    const LuxuryMidAutumnRuntime = {
        activePetElement: null,
        petClickHandler: null,
        documentClickHandler: null,
        observer: null,
        skillLocked: false,
        timers: new Set(),
        variant: 'moon',

        detectVariant() {
            const activePetId =
                String(localStorage.getItem('active_pet') || '');

            const pet =
                document.querySelector(
                    '#virtual-pet-container #virtual-pet-img'
                );

            const src =
                String(pet?.getAttribute('src') || '');

            if (
                activePetId === MID_AUTUMN_CUOI_PET.id ||
                pet?.classList.contains('midautumn-cuoi-moonwood-magic') ||
                src.includes('/Trung thu/cuoi_nhan_vat2.png')
            ) {
                return 'cuoi';
            }

            return 'moon';
        },

        getVariantConfig() {
            if (this.variant === 'cuoi') {
                return {
                    rootClass: 'midautumn-cuoi-equipped',
                    bodyClass: 'theme-midautumn-cuoi',
                    stageClass: 'pet-midautumn-cuoi-stage',
                    petClass: 'midautumn-cuoi-pet',
                    image: 'assets/Premium/Trung thu/cuoi_nhan_vat2.png',
                    sealSmall: '中 秋 · 桂 影',
                    sealTitle: 'NGUYỆT QUẾ',
                    sealSubtitle: 'TRĂNG RẰM · CÂY QUẾ · CỔ TÍCH',
                    bottomTitle: 'CHÚ CUỘI · NGUYỆT QUẾ TIÊN ĐỒNG',
                    clickSeal: '桂',
                    glyphs: ['桂', '月', '童'],
                    ultimateSmall: '桂 影 入 梦 · 月 满 人 间',
                    ultimateTitle: 'NGUYỆT QUẾ TIÊN CẢNH',
                    ultimateSubtitle: 'CUỘI KHAI QUẾ ẢNH · VẠN ĐĂNG ĐỒNG MINH',
                    dialogueSmall: 'TRUNG THU · NGUYỆT QUẾ KHAI CẢNH',
                    dialogueTitle: 'CHÚ CUỘI · NGUYỆT QUẾ TIÊN ĐỒNG',
                    dialogueSubtitle: 'QUẾ ẢNH PHÙ QUANG · TRĂNG RẰM ĐOÀN VIÊN'
                };
            }

            return {
                rootClass: '',
                bodyClass: '',
                stageClass: 'pet-midautumn-moon-palace-stage',
                petClass: 'midautumn-moon-palace-pet',
                image: 'assets/Premium/Trung thu/hang_nhan_vat1.png',
                sealSmall: '中 秋 · 月 宫',
                sealTitle: 'NGUYỆT CUNG',
                sealSubtitle: 'TRĂNG RẰM · CỔ TÍCH · ĐOÀN VIÊN',
                bottomTitle: 'NGUYỆT CUNG TIÊN TỬ',
                clickSeal: '月',
                glyphs: ['桂', '宫', '兔'],
                ultimateSmall: '桂 香 入 梦 · 月 满 人 间',
                ultimateTitle: 'NGUYỆT CUNG TIÊN CẢNH',
                ultimateSubtitle: 'TRĂNG RẰM KHAI CẢNH · VẠN ĐĂNG ĐỒNG MINH',
                dialogueSmall: 'TRUNG THU · NGUYỆT CUNG KHAI CẢNH',
                dialogueTitle: 'NGUYỆT CUNG TIÊN TỬ',
                dialogueSubtitle: 'QUẾ HƯƠNG NHẬP MỘNG · VẠN ĐĂNG ĐOÀN VIÊN'
            };
        },

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container #virtual-pet-img.midautumn-moon-palace-pet,' +
                '#virtual-pet-container #virtual-pet-img.midautumn-cuoi-pet'
            );
        },

        clear() {
            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentClickHandler) {
                document.removeEventListener(
                    'click',
                    this.documentClickHandler,
                    true
                );
            }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.clearTimers();
            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentClickHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'midautumn-moon-palace-equipped',
                'midautumn-moon-palace-skill-active',
                'midautumn-cuoi-equipped'
            );
            document.body?.classList.remove(
                'theme-midautumn-moon-palace',
                'theme-midautumn-cuoi'
            );

            document
                .querySelectorAll(
                    '.midautumn-world,' +
                    '.midautumn-ui-frame,' +
                    '.midautumn-page-click,' +
                    '.midautumn-ultimate,' +
                    '.midautumn-dialogue'
                )
                .forEach(element => element.remove());

            const container =
                document.getElementById('virtual-pet-container');

            container?.classList.remove(
                'pet-midautumn-moon-palace-stage',
                'pet-midautumn-cuoi-stage',
                'midautumn-pet-casting'
            );

            container
                ?.querySelectorAll('.midautumn-pet-realm')
                .forEach(element => element.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove(
                    'midautumn-moon-palace-pet',
                    'midautumn-cuoi-pet'
                );
        },

        createWorld() {
            document
                .querySelectorAll('.midautumn-world')
                .forEach(element => element.remove());

            const world = document.createElement('div');
            world.className = 'midautumn-world';
            world.setAttribute('aria-hidden', 'true');
            world.setAttribute('data-effect-quality-root', '1');

            world.innerHTML = `
                <div class="ma-world-night"></div>
                <div class="ma-world-aurora aurora-a"></div>
                <div class="ma-world-aurora aurora-b"></div>
                <div class="ma-world-mist mist-a"></div>
                <div class="ma-world-mist mist-b"></div>
                <div class="ma-world-branch branch-left"></div>
                <div class="ma-world-branch branch-right"></div>
                <div class="ma-world-lantern-chain chain-left"></div>
                <div class="ma-world-lantern-chain chain-right"></div>
                <div class="ma-world-waterline"></div>
                <div class="ma-world-moon">
                    <i class="moon-glow"></i>
                    <i class="moon-disc"></i>
                    <i class="moon-rabbit"></i>
                    <i class="moon-cloud cloud-a"></i>
                    <i class="moon-cloud cloud-b"></i>
                </div>

                <div class="ma-world-palace">
                    <span class="roof roof-back"></span>
                    <span class="roof roof-front"></span>
                    <span class="pillar pillar-a"></span>
                    <span class="pillar pillar-b"></span>
                    <span class="gate"></span>
                </div>

                <div class="ma-world-clouds">
                    <i class="cloud c1"></i><i class="cloud c2"></i>
                    <i class="cloud c3"></i><i class="cloud c4"></i>
                    <i class="cloud c5"></i><i class="cloud c6"></i>
                </div>

                <div class="ma-world-lanterns"></div>
                <div class="ma-world-osmanthus"></div>
                <div class="ma-world-stars"></div>
                <div class="ma-world-jade-dust"></div>
                <div class="ma-world-fireflies"></div>
                <div class="ma-world-ribbons ribbon-a"></div>
                <div class="ma-world-ribbons ribbon-b"></div>
                <div class="ma-world-vignette"></div>
            `;

            const reduced = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
            ).matches;

            const lanternField = world.querySelector('.ma-world-lanterns');
            const flowerField = world.querySelector('.ma-world-osmanthus');
            const starField = world.querySelector('.ma-world-stars');
            const dustField = world.querySelector('.ma-world-jade-dust');
            const fireflyField = world.querySelector('.ma-world-fireflies');

            const lanternCount = getLuxuryQualityCount(reduced ? 6 : 14);
            const flowerCount = getLuxuryQualityCount(reduced ? 24 : 68);
            const starCount = getLuxuryQualityCount(reduced ? 24 : 72);
            const dustCount = getLuxuryQualityCount(reduced ? 28 : 82);
            const fireflyCount = getLuxuryQualityCount(reduced ? 8 : 24);

            for (let index = 0; index < lanternCount; index++) {
                const lantern = document.createElement('i');
                lantern.className = 'ma-lantern';
                lantern.innerHTML = '<b></b><span></span><em></em>';
                lantern.style.setProperty('--ma-lx', `${5 + ((index * 83) % 90)}%`);
                lantern.style.setProperty('--ma-ly', `${10 + ((index * 47) % 58)}%`);
                lantern.style.setProperty('--ma-ls', `${0.72 + (index % 4) * 0.11}`);
                lantern.style.setProperty('--ma-ld', `${-(index % 8) * 0.72}s`);
                lanternField?.appendChild(lantern);
            }

            for (let index = 0; index < flowerCount; index++) {
                const flower = document.createElement('i');
                flower.className = 'ma-osmanthus';
                flower.style.setProperty('--ma-fx', `${(index * 37 + 7) % 98}%`);
                flower.style.setProperty('--ma-fsize', `${5 + (index % 5) * 1.45}px`);
                flower.style.setProperty('--ma-fdelay', `${-(index % 15) * 0.48}s`);
                flower.style.setProperty('--ma-fdrift', `${-52 + (index % 10) * 12}px`);
                flowerField?.appendChild(flower);
            }

            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('i');
                star.className = 'ma-star';
                star.textContent = index % 9 === 0 ? '✦' : '';
                star.style.setProperty('--ma-sx', `${(index * 61 + 5) % 97}%`);
                star.style.setProperty('--ma-sy', `${(index * 43 + 7) % 89}%`);
                star.style.setProperty('--ma-ss', `${2 + (index % 5) * 0.9}px`);
                star.style.setProperty('--ma-sd', `${-(index % 12) * 0.36}s`);
                starField?.appendChild(star);
            }

            for (let index = 0; index < dustCount; index++) {
                const dust = document.createElement('i');
                dust.className = 'ma-jade-dust';
                dust.style.setProperty('--ma-dx', `${(index * 29 + 3) % 99}%`);
                dust.style.setProperty('--ma-dy', `${(index * 71 + 11) % 91}%`);
                dust.style.setProperty('--ma-ds', `${2 + (index % 4) * 0.65}px`);
                dust.style.setProperty('--ma-dd', `${-(index % 14) * 0.42}s`);
                dustField?.appendChild(dust);
            }

            for (let index = 0; index < fireflyCount; index++) {
                const firefly = document.createElement('i');
                firefly.className = 'ma-firefly';
                firefly.style.setProperty('--ma-ffx', `${(index * 41 + 9) % 96}%`);
                firefly.style.setProperty('--ma-ffy', `${18 + ((index * 59 + 7) % 72)}%`);
                firefly.style.setProperty('--ma-ffd', `${-(index % 12) * 0.57}s`);
                firefly.style.setProperty('--ma-ffs', `${2 + (index % 4)}px`);
                fireflyField?.appendChild(firefly);
            }

            document.body.appendChild(world);
            requestAnimationFrame(() => world.classList.add('is-mounted'));
        },

        createInterface() {
            const variant = this.getVariantConfig();

            document
                .querySelectorAll('.midautumn-ui-frame')
                .forEach(element => element.remove());

            const frame = document.createElement('div');
            frame.className = 'midautumn-ui-frame';
            frame.setAttribute('aria-hidden', 'true');

            frame.innerHTML = `
                <div class="ma-ui-moon-crown"><i></i><b>月</b><i></i></div>
                <div class="ma-ui-top">
                    <i></i>
                    <span class="ma-ui-cloud left"></span>
                    <div class="ma-ui-seal">
                        <small>${variant.sealSmall}</small>
                        <strong>${variant.sealTitle}</strong>
                        <span>${variant.sealSubtitle}</span>
                    </div>
                    <span class="ma-ui-cloud right"></span>
                    <i></i>
                </div>

                <span class="ma-ui-corner corner-tl">☾</span>
                <span class="ma-ui-corner corner-tr">✦</span>
                <span class="ma-ui-corner corner-bl">❀</span>
                <span class="ma-ui-corner corner-br">☾</span>

                <div class="ma-ui-side side-left"><span>☾</span><i></i><b>月</b><i></i><span>❀</span></div>
                <div class="ma-ui-side side-right"><span>✦</span><i></i><b>宫</b><i></i><span>☾</span></div>
                <div class="ma-ui-hanging hanging-left"><i></i><b></b><em></em></div>
                <div class="ma-ui-hanging hanging-right"><i></i><b></b><em></em></div>

                <div class="ma-ui-bottom">
                    <span>❀</span><i></i>
                    <strong>${variant.bottomTitle}</strong>
                    <i></i><span>☾</span>
                </div>
            `;

            document.body.appendChild(frame);
            requestAnimationFrame(() => frame.classList.add('is-mounted'));
        },

        createPetRealm() {
            const variant = this.getVariantConfig();

            const container =
                document.getElementById('virtual-pet-container');
            const pet =
                container?.querySelector('#virtual-pet-img');

            if (!container || !pet) return;

            container.classList.add(variant.stageClass);
            pet.classList.add(variant.petClass);
            pet.setAttribute('draggable', 'false');

            container
                .querySelectorAll('.midautumn-pet-realm')
                .forEach(element => element.remove());

            const realm = document.createElement('div');
            realm.className = 'midautumn-pet-realm';
            realm.setAttribute('aria-hidden', 'true');
            realm.setAttribute('data-effect-quality-root', '1');

            realm.innerHTML = `
                <span class="ma-pet-aura-backdrop"></span>
                <span class="ma-pet-moon-gate"><i></i><b></b><em></em></span>
                <span class="ma-pet-moon"><i></i><b></b></span>
                <span class="ma-pet-crescent crescent-a"></span>
                <span class="ma-pet-crescent crescent-b"></span>
                <span class="ma-pet-halo halo-a"></span>
                <span class="ma-pet-halo halo-b"></span>
                <span class="ma-pet-ring ring-a"></span>
                <span class="ma-pet-ring ring-b"></span>
                <span class="ma-pet-ring ring-c"></span>
                <span class="ma-pet-cloud cloud-a"></span>
                <span class="ma-pet-cloud cloud-b"></span>
                <span class="ma-pet-cloud cloud-c"></span>
                <span class="ma-pet-ribbon ribbon-a"></span>
                <span class="ma-pet-ribbon ribbon-b"></span>
                <span class="ma-pet-lantern lantern-a"><i></i></span>
                <span class="ma-pet-lantern lantern-b"><i></i></span>
                <span class="ma-pet-tassel tassel-a"><i></i></span>
                <span class="ma-pet-tassel tassel-b"><i></i></span>
                <span class="ma-pet-lotus-base"><i></i><b></b><em></em></span>
                <span class="ma-pet-phases"></span>
                <span class="ma-pet-sigils"></span>
                <span class="ma-pet-sparks"></span>
                <span class="ma-pet-flowers"></span>
            `;

            const sparkField = realm.querySelector('.ma-pet-sparks');
            const flowerField = realm.querySelector('.ma-pet-flowers');
            const phaseField = realm.querySelector('.ma-pet-phases');
            const sigilField = realm.querySelector('.ma-pet-sigils');

            for (let index = 0; index < 24; index++) {
                const spark = document.createElement('i');
                spark.style.setProperty('--ma-psa', `${index * 15}deg`);
                spark.style.setProperty('--ma-psa-neg', `${index * -15}deg`);
                spark.style.setProperty('--ma-psr-neg', `${-(64 + (index % 6) * 14)}px`);
                spark.style.setProperty('--ma-psd', `${-(index % 9) * 0.22}s`);
                sparkField?.appendChild(spark);
            }

            for (let index = 0; index < 22; index++) {
                const flower = document.createElement('i');
                flower.style.setProperty('--ma-pfa', `${index * (360 / 22)}deg`);
                flower.style.setProperty('--ma-pfa-neg', `${index * -(360 / 22)}deg`);
                flower.style.setProperty('--ma-pfr-neg', `${-(72 + (index % 6) * 18)}px`);
                flower.style.setProperty('--ma-pfd', `${-(index % 10) * 0.29}s`);
                flowerField?.appendChild(flower);
            }

            for (let index = 0; index < 8; index++) {
                const phase = document.createElement('i');
                phase.style.setProperty('--ma-phase-a', `${index * 45}deg`);
                phase.style.setProperty('--ma-phase-a-neg', `${index * -45}deg`);
                phase.style.setProperty('--ma-phase-d', `${-(index % 4) * 0.45}s`);
                phaseField?.appendChild(phase);
            }

            ['月','桂','兔','宫','秋','圆','云','梦','仙','灯','玉','华'].forEach((symbol, index) => {
                const sigil = document.createElement('i');
                sigil.textContent = symbol;
                sigil.style.setProperty('--ma-sigil-a', `${index * 30}deg`);
                sigil.style.setProperty('--ma-sigil-a-neg', `${index * -30}deg`);
                sigil.style.setProperty('--ma-sigil-d', `${-(index % 6) * 0.33}s`);
                sigilField?.appendChild(sigil);
            });

            container.insertBefore(realm, pet);
            this.installPetSkill(pet, container);
        },

        installPetSkill(pet, container) {
            if (!pet || !container) return;

            this.activePetElement = pet;
            this.petClickHandler = event => {
                if (this.skillLocked) return;
                if (!document.documentElement.classList.contains('midautumn-moon-palace-equipped')) return;
                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) return;

                event.preventDefault();
                event.stopPropagation();

                const rect = pet.getBoundingClientRect();
                const x = Number.isFinite(event.clientX) && event.clientX > 0
                    ? event.clientX
                    : rect.left + rect.width / 2;
                const y = Number.isFinite(event.clientY) && event.clientY > 0
                    ? event.clientY
                    : rect.top + rect.height / 2;

                this.skillLocked = true;
                document.documentElement.classList.add(
                    'midautumn-moon-palace-skill-active'
                );
                container.classList.add('midautumn-pet-casting');

                this.createPageClick(x, y, true);
                this.createUltimate(x, y);

                this.setTimer(() => {
                    this.skillLocked = false;
                    document.documentElement.classList.remove(
                        'midautumn-moon-palace-skill-active'
                    );
                    container.classList.remove('midautumn-pet-casting');
                }, 6800);
            };

            pet.addEventListener('click', this.petClickHandler);
        },

        installGlobalClick() {
            this.documentClickHandler = event => {
                if (!document.documentElement.classList.contains('midautumn-moon-palace-equipped')) return;

                const target = event.target;

                if (
                    target instanceof Element &&
                    target.closest('.ui-theme-immune, [data-theme-immune="true"]')
                ) return;

                // Pet click được xử lý riêng để tạo fullscreen ultimate.
                if (
                    target instanceof Element &&
                    target.closest('#virtual-pet-container')
                ) return;

                const x = Number.isFinite(event.clientX)
                    ? event.clientX
                    : window.innerWidth / 2;
                const y = Number.isFinite(event.clientY)
                    ? event.clientY
                    : window.innerHeight / 2;

                this.createPageClick(x, y, false);
            };

            document.addEventListener('click', this.documentClickHandler, true);
        },

        createPageClick(x, y, strong = false) {
            const variant = this.getVariantConfig();
            const burst = document.createElement('div');
            burst.className = 'midautumn-page-click' + (strong ? ' is-strong' : '');
            burst.style.setProperty('--ma-click-x', `${x}px`);
            burst.style.setProperty('--ma-click-y', `${y}px`);
            burst.setAttribute('aria-hidden', 'true');
            burst.setAttribute('data-effect-quality-root', '1');

            burst.innerHTML = `
                <i class="ring ring-a"></i>
                <i class="ring ring-b"></i>
                <i class="ring ring-c"></i>
                <i class="ring ring-d"></i>
                <span class="click-seal"><i>${variant.clickSeal}</i></span>
                <span class="moon">☾</span>
                <span class="flower flower-a">❀</span>
                <span class="flower flower-b">✦</span>
                <span class="flower flower-c">❀</span>
                <span class="flower flower-d">✿</span>
                <span class="flower flower-e">❀</span>
                <span class="cloud cloud-a"></span>
                <span class="cloud cloud-b"></span>
                <span class="click-lantern"><i></i></span>
                <span class="click-glyph glyph-a">${variant.glyphs[0]}</span>
                <span class="click-glyph glyph-b">${variant.glyphs[1]}</span>
                <span class="click-glyph glyph-c">${variant.glyphs[2]}</span>
                <b class="ray ray-a"></b>
                <b class="ray ray-b"></b>
                <b class="ray ray-c"></b>
                <b class="ray ray-d"></b>
                <b class="ray ray-e"></b>
                <b class="ray ray-f"></b>
            `;

            document.body.appendChild(burst);
            requestAnimationFrame(() => burst.classList.add('is-active'));
            this.setTimer(() => burst.remove(), strong ? 1700 : 1100);
        },

        createUltimate(x, y) {
            const variant = this.getVariantConfig();

            document
                .querySelectorAll('.midautumn-ultimate, .midautumn-dialogue')
                .forEach(element => element.remove());

            const ultimate = document.createElement('div');
            ultimate.className = 'midautumn-ultimate';
            ultimate.style.setProperty('--ma-ultimate-x', `${x}px`);
            ultimate.style.setProperty('--ma-ultimate-y', `${y}px`);
            ultimate.setAttribute('aria-hidden', 'true');
            ultimate.setAttribute('data-effect-quality-root', '1');

            ultimate.innerHTML = `
                <div class="ma-ult-flash"></div>
                <div class="ma-ult-sky"></div>
                <div class="ma-ult-nebula nebula-a"></div>
                <div class="ma-ult-nebula nebula-b"></div>
                <div class="ma-ult-moon-gate"><i></i><b></b><em></em></div>
                <div class="ma-ult-moon"><i></i><b></b><em>月</em></div>
                <div class="ma-ult-rabbit"></div>
                <img class="ma-ult-character" src="${variant.image}" alt="" draggable="false">

                <div class="ma-ult-palace">
                    <i class="roof"></i>
                    <i class="pillar left"></i>
                    <i class="pillar right"></i>
                    <b class="gate"></b>
                </div>

                <div class="ma-ult-cloud cloud-a"></div>
                <div class="ma-ult-cloud cloud-b"></div>
                <div class="ma-ult-cloud cloud-c"></div>
                <div class="ma-ult-cloud cloud-d"></div>

                <div class="ma-ult-lanterns"></div>
                <div class="ma-ult-flowers"></div>
                <div class="ma-ult-stars"></div>
                <div class="ma-ult-runes"></div>
                <div class="ma-ult-rays"></div>
                <div class="ma-ult-lotus-water"><i></i><b></b><em></em></div>
                <div class="ma-ult-bridge"></div>
                <div class="ma-ult-curtain curtain-left"></div>
                <div class="ma-ult-curtain curtain-right"></div>

                <div class="ma-ult-title">
                    <small>${variant.ultimateSmall}</small>
                    <strong>${variant.ultimateTitle}</strong>
                    <span>${variant.ultimateSubtitle}</span>
                </div>
            `;

            const lanterns = ultimate.querySelector('.ma-ult-lanterns');
            const flowers = ultimate.querySelector('.ma-ult-flowers');
            const stars = ultimate.querySelector('.ma-ult-stars');
            const runes = ultimate.querySelector('.ma-ult-runes');
            const rays = ultimate.querySelector('.ma-ult-rays');

            for (let index = 0; index < 12; index++) {
                const lantern = document.createElement('i');
                lantern.innerHTML = '<b></b><span></span>';
                lantern.style.setProperty('--ma-ulx', `${5 + ((index * 79) % 90)}%`);
                lantern.style.setProperty('--ma-uly', `${9 + ((index * 41) % 68)}%`);
                lantern.style.setProperty('--ma-uls', `${0.7 + (index % 4) * 0.13}`);
                lantern.style.setProperty('--ma-uld', `${index * 0.07}s`);
                lanterns?.appendChild(lantern);
            }

            for (let index = 0; index < 76; index++) {
                const flower = document.createElement('i');
                flower.style.setProperty('--ma-ufa', `${index * (360 / 76)}deg`);
                flower.style.setProperty('--ma-ufa-neg', `${index * -(360 / 76)}deg`);
                const radius = 130 + (index % 10) * 34;
                flower.style.setProperty('--ma-ufr-neg', `${-radius}px`);
                flower.style.setProperty('--ma-ufd', `${(index % 12) * 0.034}s`);
                flowers?.appendChild(flower);
            }

            for (let index = 0; index < 72; index++) {
                const star = document.createElement('i');
                star.style.setProperty('--ma-usx', `${(index * 47 + 5) % 96}%`);
                star.style.setProperty('--ma-usy', `${(index * 73 + 7) % 90}%`);
                star.style.setProperty('--ma-uss', `${2 + (index % 6) * 0.9}px`);
                star.style.setProperty('--ma-usd', `${-(index % 14) * 0.11}s`);
                stars?.appendChild(star);
            }

            ['月','宫','桂','兔','秋','圆','梦','仙','灯','华','夜','云','玉','露','霜','心'].forEach((symbol, index) => {
                const rune = document.createElement('i');
                rune.textContent = symbol;
                rune.style.setProperty('--ma-uri', index);
                rune.style.setProperty('--ma-ura', `${index * 22.5}deg`);
                rune.style.setProperty('--ma-ura-neg', `${index * -22.5}deg`);
                rune.style.setProperty('--ma-urd', `${(index % 8) * 0.055}s`);
                runes?.appendChild(rune);
            });

            for (let index = 0; index < 16; index++) {
                const ray = document.createElement('i');
                ray.style.setProperty('--ma-ray-a', `${index * 22.5}deg`);
                ray.style.setProperty('--ma-ray-d', `${index * 0.026}s`);
                rays?.appendChild(ray);
            }

            const dialogue = document.createElement('div');
            dialogue.className = 'midautumn-dialogue';
            dialogue.innerHTML = `
                <i>❀</i>
                <small>${variant.dialogueSmall}</small>
                <strong>${variant.dialogueTitle}</strong>
                <span>${variant.dialogueSubtitle}</span>
                <i>☾</i>
            `;

            document.body.append(ultimate, dialogue);

            requestAnimationFrame(() => {
                ultimate.classList.add('is-active');
                dialogue.classList.add('is-active');
            });

            this.setTimer(() => ultimate.classList.add('is-climax'), 780);
            this.setTimer(() => dialogue.classList.add('is-visible'), 920);
            this.setTimer(() => {
                ultimate.classList.add('is-ending');
                dialogue.classList.add('is-ending');
            }, 5150);
            this.setTimer(() => {
                ultimate.remove();
                dialogue.remove();
            }, 6500);
        },

        installObserver() {
            if (this.observer) {
                this.observer.disconnect();
            }

            const container =
                document.getElementById('virtual-pet-container');
            if (!container) return;

            this.observer = new MutationObserver(() => {
                if (!document.documentElement.classList.contains('midautumn-moon-palace-equipped')) return;

                const pet = this.getPet();
                const style = window.getComputedStyle(container);
                const visible =
                    style.display !== 'none' &&
                    style.visibility !== 'hidden';

                if (!pet || !visible) {
                    this.clear();
                }
            });

            this.observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        },

        mount() {
            const nextVariant = this.detectVariant();

            this.clear();
            this.variant = nextVariant;
            ensureMidAutumnStylesheet();

            const variant =
                this.getVariantConfig();

            document.documentElement.classList.add(
                'midautumn-moon-palace-equipped'
            );

            if (variant.rootClass) {
                document.documentElement.classList.add(
                    variant.rootClass
                );
            }

            document.body?.classList.add(
                'theme-midautumn-moon-palace'
            );

            if (variant.bodyClass) {
                document.body?.classList.add(
                    variant.bodyClass
                );
            }

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installObserver();

            const repairMount = () => {
                if (!document.documentElement.classList.contains('midautumn-moon-palace-equipped')) return;

                if (!document.querySelector('.midautumn-world')) {
                    this.createWorld();
                }
                if (!document.querySelector('.midautumn-ui-frame')) {
                    this.createInterface();
                }

                const pet = document.querySelector('#virtual-pet-container #virtual-pet-img');
                if (
                    pet &&
                    !document.querySelector('#virtual-pet-container .midautumn-pet-realm')
                ) {
                    this.createPetRealm();
                }
            };

            this.setTimer(repairMount, 120);
            this.setTimer(repairMount, 520);
            this.setTimer(repairMount, 1200);
        },

        restore(attempt = 0) {
            ensureMidAutumnStylesheet();

            const activePetId =
                String(localStorage.getItem('active_pet') || '');
            const pet =
                document.querySelector('#virtual-pet-container #virtual-pet-img');

            const looksActive =
                activePetId === MID_AUTUMN_MOON_PET.id ||
                activePetId === MID_AUTUMN_CUOI_PET.id ||
                pet?.classList.contains('midautumn-moon-palace-pet-magic') ||
                pet?.classList.contains('midautumn-cuoi-moonwood-magic') ||
                String(pet?.getAttribute('src') || '').includes('/Trung thu/hang_nhan_vat1.png') ||
                String(pet?.getAttribute('src') || '').includes('/Trung thu/cuoi_nhan_vat2.png');

            if (!looksActive) {
                return false;
            }

            if (pet) {
                this.mount();
                return true;
            }

            if (attempt < 8) {
                this.setTimer(() => this.restore(attempt + 1), 180 + attempt * 70);
            }

            return false;
        }
    };



    // ========================================================
    // LINK CLICK · CHENG XIAOSHI — CSS LOADER
    // MỘT file CSS đảm nhiệm: card + full-web skin + popup/form/
    // slider/scrollbar + pet realm + click + ultimate.
    // ========================================================
    function ensureLinkClickChengStylesheet() {
        const existing = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).find(link =>
            /(?:^|\/)link-click-cheng-xiaoshi(?:\(\d+\))?\.css(?:[?#].*)?$/i
                .test(link.href || '')
        );

        if (existing) {
            existing.id = existing.id || 'linkclick-cheng-premium-style';
            return;
        }

        if (document.getElementById('linkclick-cheng-premium-style')) {
            return;
        }

        let href = '';

        if (window.LINKCLICK_CHENG_CSS_PATH) {
            href = String(window.LINKCLICK_CHENG_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script => /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i.test(script.src || ''));

            if (ownScript?.src) {
                try {
                    href = new URL(
                        '../css/link-click-cheng-xiaoshi.css?v=20260911.3-cinematic',
                        ownScript.src
                    ).href;
                } catch (_) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL(
                'css/link-click-cheng-xiaoshi.css?v=20260911.3-cinematic',
                document.baseURI
            ).href;
        }

        const link = document.createElement('link');
        link.id = 'linkclick-cheng-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.linkClickCheng = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[Link Click] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/link-click-cheng-xiaoshi.css hoặc gán window.LINKCLICK_CHENG_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
    }


    // ========================================================
    // LINK CLICK · CHENG XIAOSHI — FULL PREMIUM RUNTIME V2 · CINEMATIC
    // Namespace độc lập: lcx-* / linkclick-cheng-*
    // KHÔNG gọi ThemeManager / EffectManager.
    // ========================================================
    const LuxuryLinkClickChengRuntime = {
        activePetElement: null,
        petClickHandler: null,
        documentClickHandler: null,
        pointerMoveHandler: null,
        observer: null,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container #virtual-pet-img.lcx-cheng-pet'
            );
        },

        clear() {
            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentClickHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentClickHandler,
                    true
                );
            }

            if (this.pointerMoveHandler) {
                document.removeEventListener(
                    'pointermove',
                    this.pointerMoveHandler,
                    true
                );
            }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.clearTimers();
            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentClickHandler = null;
            this.pointerMoveHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'linkclick-cheng-equipped',
                'linkclick-cheng-skill-active'
            );

            document.body?.classList.remove(
                'theme-linkclick-cheng'
            );

            document
                .querySelectorAll(
                    '.lcx-world,' +
                    '.lcx-ui-frame,' +
                    '.lcx-page-click,' +
                    '.lcx-ultimate,' +
                    '.lcx-dialogue'
                )
                .forEach(element => element.remove());

            const container =
                document.getElementById('virtual-pet-container');

            container?.classList.remove(
                'pet-linkclick-cheng-stage',
                'linkclick-cheng-casting'
            );

            container
                ?.querySelectorAll('.lcx-pet-realm')
                .forEach(element => element.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('lcx-cheng-pet');
        },

        createWorld() {
            document
                .querySelectorAll('.lcx-world')
                .forEach(element => element.remove());

            const world = document.createElement('div');
            world.className = 'lcx-world';
            world.setAttribute('aria-hidden', 'true');
            world.innerHTML = `
                <div class="lcx-world__wash"></div>
                <div class="lcx-world__vignette"></div>
                <div class="lcx-world__grain"></div>
                <div class="lcx-world__grid"></div>
                <div class="lcx-world__light-beam beam-a"></div>
                <div class="lcx-world__light-beam beam-b"></div>

                <div class="lcx-world__clock">
                    <span class="ring ring-a"></span>
                    <span class="ring ring-b"></span>
                    <span class="ring ring-c"></span>
                    <i class="hand hand-hour"></i>
                    <i class="hand hand-minute"></i>
                    <b class="clock-core"></b>
                </div>

                <div class="lcx-world__memory memory-a">
                    <i></i><span>05:12</span>
                </div>
                <div class="lcx-world__memory memory-b">
                    <i></i><span>PHOTO</span>
                </div>
                <div class="lcx-world__memory memory-c">
                    <i></i><span>TIME</span>
                </div>

                <div class="lcx-world__film-rail rail-left">
                    ${'<i></i>'.repeat(9)}
                </div>
                <div class="lcx-world__film-rail rail-right">
                    ${'<i></i>'.repeat(9)}
                </div>

                <div class="lcx-world__timeline">
                    <span>00</span><i></i><i></i><i></i>
                    <strong>05:12</strong>
                    <i></i><i></i><i></i><span>24</span>
                </div>

                <div class="lcx-world__timecode">
                    <small>FRAME</small>
                    <strong>00:05:12:00</strong>
                </div>

                <div class="lcx-world__film film-a"></div>
                <div class="lcx-world__film film-b"></div>
                <div class="lcx-world__focus focus-a"></div>
                <div class="lcx-world__focus focus-b"></div>
                <div class="lcx-world__particles"></div>
            `;

            const particleField =
                world.querySelector('.lcx-world__particles');

            const reduced = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
            ).matches;

            const count = getLuxuryQualityCount(reduced ? 16 : 42);

            for (let index = 0; index < count; index++) {
                const particle = document.createElement('i');
                particle.className =
                    index % 7 === 0
                        ? 'lcx-particle lcx-particle--frame'
                        : index % 5 === 0
                            ? 'lcx-particle lcx-particle--red'
                            : 'lcx-particle';

                particle.style.setProperty(
                    '--lcx-x',
                    `${(index * 37 + 9) % 98}%`
                );
                particle.style.setProperty(
                    '--lcx-y',
                    `${(index * 61 + 7) % 92}%`
                );
                particle.style.setProperty(
                    '--lcx-delay',
                    `${-(index % 15) * .39}s`
                );
                particle.style.setProperty(
                    '--lcx-size',
                    `${2 + (index % 5) * 1.05}px`
                );
                particleField?.appendChild(particle);
            }

            document.body.appendChild(world);
            requestAnimationFrame(() => world.classList.add('is-mounted'));
        },

        createInterface() {
            document
                .querySelectorAll('.lcx-ui-frame')
                .forEach(element => element.remove());

            const frame = document.createElement('div');
            frame.className = 'lcx-ui-frame';
            frame.setAttribute('aria-hidden', 'true');
            frame.innerHTML = `
                <span class="lcx-corner corner-tl"></span>
                <span class="lcx-corner corner-tr"></span>
                <span class="lcx-corner corner-bl"></span>
                <span class="lcx-corner corner-br"></span>

                <div class="lcx-ui-topbar">
                    <span class="lcx-ui-rec"><i></i> REC</span>
                    <span class="lcx-ui-mode">TIME PHOTO · 24 FPS</span>
                    <span class="lcx-ui-counter">05:12 / 24</span>
                </div>

                <div class="lcx-ui-left-rail">
                    <span>ISO 400</span>
                    <i></i><i></i><i></i><i></i><i></i>
                    <span>F 2.8</span>
                </div>

                <div class="lcx-ui-right-rail">
                    <span>MEM</span>
                    <i></i><i></i><i></i><i></i><i></i>
                    <span>∞</span>
                </div>

                <span class="lcx-ui-date">TIME PHOTO STUDIO · LINK CLICK</span>
                <span class="lcx-ui-focus"></span>
                <span class="lcx-ui-crosshair"></span>
                <span class="lcx-cursor-reticle"><i></i><b></b></span>

                <div class="lcx-ui-bottom-film">
                    ${'<i></i>'.repeat(18)}
                </div>
            `;
            document.body.appendChild(frame);
        },

        createPetRealm() {
            const container =
                document.getElementById('virtual-pet-container');
            const pet =
                container?.querySelector('#virtual-pet-img');

            if (!container || !pet) return false;

            container
                .querySelectorAll('.lcx-pet-realm')
                .forEach(element => element.remove());

            pet.classList.add('lcx-cheng-pet');
            pet.setAttribute('draggable', 'false');
            container.classList.add('pet-linkclick-cheng-stage');

            const realm = document.createElement('div');
            realm.className = 'lcx-pet-realm';
            realm.setAttribute('aria-hidden', 'true');
            realm.innerHTML = `
                <span class="lcx-pet-aura"></span>
                <span class="lcx-pet-clock clock-a"></span>
                <span class="lcx-pet-clock clock-b"></span>
                <span class="lcx-pet-focus"></span>
                <span class="lcx-pet-polaroid polaroid-a"></span>
                <span class="lcx-pet-polaroid polaroid-b"></span>
                <span class="lcx-pet-shadow"></span>
                <div class="lcx-pet-sparks"></div>
            `;

            const sparks = realm.querySelector('.lcx-pet-sparks');
            const count = getLuxuryQualityCount(16);
            for (let index = 0; index < count; index++) {
                const spark = document.createElement('i');
                spark.style.setProperty(
                    '--lcx-pa',
                    `${index * (360 / count)}deg`
                );
                spark.style.setProperty(
                    '--lcx-pr',
                    `${62 + (index % 5) * 11}px`
                );
                spark.style.setProperty(
                    '--lcx-pd',
                    `${-(index % 8) * .21}s`
                );
                sparks?.appendChild(spark);
            }

            container.appendChild(realm);

            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            this.activePetElement = pet;
            this.petClickHandler = event => {
                event.stopPropagation();
                if (this.skillLocked) return;

                this.skillLocked = true;
                container.classList.add('linkclick-cheng-casting');
                document.documentElement.classList.add(
                    'linkclick-cheng-skill-active'
                );

                const rect = pet.getBoundingClientRect();
                this.createUltimate(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2
                );

                this.setTimer(() => {
                    container.classList.remove('linkclick-cheng-casting');
                    document.documentElement.classList.remove(
                        'linkclick-cheng-skill-active'
                    );
                    this.skillLocked = false;
                }, 4300);
            };

            pet.addEventListener('click', this.petClickHandler);
            return true;
        },

        installGlobalClick() {
            if (this.documentClickHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentClickHandler,
                    true
                );
            }

            if (this.pointerMoveHandler) {
                document.removeEventListener(
                    'pointermove',
                    this.pointerMoveHandler,
                    true
                );
            }

            this.documentClickHandler = event => {
                if (
                    !document.documentElement.classList.contains(
                        'linkclick-cheng-equipped'
                    )
                ) return;

                if (event.target?.closest?.('#virtual-pet-container')) {
                    return;
                }

                const burst = document.createElement('span');
                burst.className = 'lcx-page-click';
                burst.style.setProperty('--lcx-click-x', `${event.clientX}px`);
                burst.style.setProperty('--lcx-click-y', `${event.clientY}px`);
                burst.innerHTML = `
                    <i></i><b></b><em></em>
                    <span class="lcx-click-ring ring-a"></span>
                    <span class="lcx-click-ring ring-b"></span>
                    <span class="lcx-click-label">FOCUS</span>
                `;
                document.body.appendChild(burst);
                this.setTimer(() => burst.remove(), 1050);
            };

            let pointerFrame = 0;
            let pointerIdleTimer = 0;

            this.pointerMoveHandler = event => {
                if (
                    !document.documentElement.classList.contains(
                        'linkclick-cheng-equipped'
                    ) ||
                    window.matchMedia?.('(pointer: coarse)').matches
                ) return;

                if (pointerFrame) return;

                pointerFrame = requestAnimationFrame(() => {
                    pointerFrame = 0;

                    const reticle = document.querySelector(
                        '.lcx-ui-frame .lcx-cursor-reticle'
                    );
                    if (!reticle) return;

                    reticle.style.setProperty(
                        '--lcx-pointer-x',
                        `${event.clientX}px`
                    );
                    reticle.style.setProperty(
                        '--lcx-pointer-y',
                        `${event.clientY}px`
                    );
                    reticle.classList.add('is-moving');

                    window.clearTimeout(pointerIdleTimer);
                    pointerIdleTimer = window.setTimeout(() => {
                        reticle.classList.remove('is-moving');
                    }, 150);
                });
            };

            document.addEventListener(
                'pointerdown',
                this.documentClickHandler,
                true
            );

            document.addEventListener(
                'pointermove',
                this.pointerMoveHandler,
                {
                    capture: true,
                    passive: true
                }
            );
        },

        createUltimate(x, y) {
            document
                .querySelectorAll('.lcx-ultimate, .lcx-dialogue')
                .forEach(element => element.remove());

            const ultimate = document.createElement('div');
            ultimate.className = 'lcx-ultimate';
            ultimate.style.setProperty('--lcx-origin-x', `${x}px`);
            ultimate.style.setProperty('--lcx-origin-y', `${y}px`);
            ultimate.innerHTML = `
                <div class="lcx-ultimate__flash"></div>
                <div class="lcx-ultimate__shutter">
                    ${'<i></i>'.repeat(8)}
                </div>
                <div class="lcx-ultimate__clock">
                    <b></b><i></i><span>12</span><em>06</em>
                </div>
                <div class="lcx-ultimate__photos">
                    <i class="photo-a"></i>
                    <i class="photo-b"></i>
                    <i class="photo-c"></i>
                    <i class="photo-d"></i>
                </div>
                <div class="lcx-ultimate__lines"></div>
            `;

            const dialogue = document.createElement('div');
            dialogue.className = 'lcx-dialogue';
            dialogue.innerHTML = `
                <small>LINK CLICK · TIME PHOTO STUDIO</small>
                <strong>CHENG XIAOSHI</strong>
                <span>Khoảnh khắc đã chụp · thời gian bắt đầu chuyển động</span>
            `;

            document.body.append(ultimate, dialogue);

            requestAnimationFrame(() => {
                ultimate.classList.add('is-active');
                dialogue.classList.add('is-active');
            });

            this.setTimer(() => ultimate.classList.add('is-climax'), 700);
            this.setTimer(() => dialogue.classList.add('is-visible'), 820);
            this.setTimer(() => {
                ultimate.classList.add('is-ending');
                dialogue.classList.add('is-ending');
            }, 3100);
            this.setTimer(() => {
                ultimate.remove();
                dialogue.remove();
            }, 4050);
        },

        installObserver() {
            if (this.observer) {
                this.observer.disconnect();
            }

            const container =
                document.getElementById('virtual-pet-container');
            if (!container) return;

            this.observer = new MutationObserver(() => {
                if (
                    !document.documentElement.classList.contains(
                        'linkclick-cheng-equipped'
                    )
                ) return;

                const pet = this.getPet();
                const style = window.getComputedStyle(container);
                const visible =
                    style.display !== 'none' &&
                    style.visibility !== 'hidden';

                if (!pet || !visible) {
                    this.clear();
                }
            });

            this.observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        },

        mount() {
            this.clear();
            ensureLinkClickChengStylesheet();

            document.documentElement.classList.add(
                'linkclick-cheng-equipped'
            );
            document.body?.classList.add(
                'theme-linkclick-cheng'
            );

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installObserver();

            const repairMount = () => {
                if (
                    !document.documentElement.classList.contains(
                        'linkclick-cheng-equipped'
                    )
                ) return;

                if (!document.querySelector('.lcx-world')) {
                    this.createWorld();
                }
                if (!document.querySelector('.lcx-ui-frame')) {
                    this.createInterface();
                }
                if (
                    document.querySelector('#virtual-pet-container #virtual-pet-img') &&
                    !document.querySelector('#virtual-pet-container .lcx-pet-realm')
                ) {
                    this.createPetRealm();
                }
            };

            this.setTimer(repairMount, 120);
            this.setTimer(repairMount, 520);
            this.setTimer(repairMount, 1200);
        },

        restore(attempt = 0) {
            ensureLinkClickChengStylesheet();

            const activePetId =
                String(localStorage.getItem('active_pet') || '');
            const pet =
                document.querySelector('#virtual-pet-container #virtual-pet-img');

            const looksActive =
                activePetId === LINKCLICK_CHENG_XIAOSHI_PET.id ||
                pet?.classList.contains('linkclick-cheng-timeframe-magic') ||
                String(pet?.getAttribute('src') || '').includes(
                    '/Premium/Lock/Cheng Xiaoshi-nhan-vat1.png'
                );

            if (!looksActive) {
                return false;
            }

            if (pet) {
                this.mount();
                return true;
            }

            if (attempt < 8) {
                this.setTimer(
                    () => this.restore(attempt + 1),
                    180 + attempt * 70
                );
            }

            return false;
        }
    };


    // ========================================================
    // LINK CLICK · CHENG XIAOSHI — AUTO MOUNT / SELF-HEAL V1.1
    // Bắt cả trường hợp pet được spawn trước khi luxury-store.js cài hook,
    // hoặc reload trang mà active_pet chưa kịp đồng bộ vào localStorage.
    // ========================================================
    let linkClickChengAutoObserver = null;
    let linkClickChengAutoRetryTimer = null;

    function isLinkClickChengPetElement(pet) {
        if (!pet) return false;

        if (
            pet.classList?.contains('linkclick-cheng-timeframe-magic') ||
            pet.classList?.contains('lcx-cheng-pet')
        ) {
            return true;
        }

        let source = String(
            pet.getAttribute?.('src') ||
            pet.src ||
            ''
        );

        try {
            source = decodeURIComponent(source);
        } catch (_) {}

        source = source
            .replace(/\\/g, '/')
            .toLowerCase();

        return (
            source.includes(
                '/premium/lock/cheng xiaoshi-nhan-vat1.png'
            ) ||
            source.endsWith(
                'assets/premium/lock/cheng xiaoshi-nhan-vat1.png'
            )
        );
    }

    function syncLinkClickChengRuntimeFromDom() {
        if (window.isStudentStoreGameAccessEnabled?.() === false) return null;
        const container =
            document.getElementById('virtual-pet-container');

        const pet =
            container?.querySelector('#virtual-pet-img');

        const shouldBeActive =
            isLinkClickChengPetElement(pet);

        const htmlRoot =
            document.documentElement;

        if (shouldBeActive) {
            const healthy =
                htmlRoot.classList.contains(
                    'linkclick-cheng-equipped'
                ) &&
                Boolean(
                    document.querySelector('.lcx-world')
                ) &&
                Boolean(
                    document.querySelector('.lcx-ui-frame')
                ) &&
                Boolean(
                    container?.querySelector('.lcx-pet-realm')
                );

            if (!healthy) {
                try {
                    LuxuryLinkClickChengRuntime.mount();
                } catch (error) {
                    console.error(
                        '[Link Click] Auto-mount Cheng Xiaoshi thất bại:',
                        error
                    );
                }
            }

            return true;
        }

        if (
            htmlRoot.classList.contains(
                'linkclick-cheng-equipped'
            )
        ) {
            LuxuryLinkClickChengRuntime.clear();
        }

        return false;
    }

    function installLinkClickChengAutoMountObserver(
        attempt = 0
    ) {
        const container =
            document.getElementById('virtual-pet-container');

        if (!container) {
            if (attempt < 80) {
                window.clearTimeout(
                    linkClickChengAutoRetryTimer
                );

                linkClickChengAutoRetryTimer =
                    window.setTimeout(
                        () =>
                            installLinkClickChengAutoMountObserver(
                                attempt + 1
                            ),
                        100
                    );
            }
            return;
        }

        if (linkClickChengAutoObserver) {
            linkClickChengAutoObserver.disconnect();
        }

        let syncQueued = false;

        const queueSync = () => {
            if (syncQueued) return;
            syncQueued = true;

            queueMicrotask(() => {
                syncQueued = false;
                syncLinkClickChengRuntimeFromDom();
            });
        };

        linkClickChengAutoObserver =
            new MutationObserver(queueSync);

        linkClickChengAutoObserver.observe(
            container,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'src',
                    'class',
                    'style'
                ]
            }
        );

        syncLinkClickChengRuntimeFromDom();

        window.setTimeout(
            syncLinkClickChengRuntimeFromDom,
            180
        );

        window.setTimeout(
            syncLinkClickChengRuntimeFromDom,
            650
        );

        window.setTimeout(
            syncLinkClickChengRuntimeFromDom,
            1600
        );
    }



    // ========================================================
    // LORD OF THE MYSTERIES · KLEIN · CSS LOADER
    // MỘT file CSS duy nhất đảm nhiệm:
    // card + pet realm + full-web skin + popup/form/slider/scrollbar
    // + click toàn trang + ultimate khi nhấn nhân vật.
    // ========================================================
    function ensureLotmKleinStylesheet() {
        if (document.getElementById('lotm-klein-premium-style')) {
            return;
        }

        let href = '';

        if (window.LOTM_KLEIN_CSS_PATH) {
            href = String(window.LOTM_KLEIN_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script => /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i.test(script.src || ''));

            if (ownScript?.src) {
                try {
                    href = new URL('../css/lord-of-mysteries-klein.css', ownScript.src).href;
                } catch (error) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL('css/lord-of-mysteries-klein.css', document.baseURI).href;
        }

        // Ép trình duyệt lấy bản CSS Klein mới thay vì cache bản cũ.
        // Nếu dự án gán LOTM_KLEIN_CSS_PATH thì vẫn giữ nguyên đường dẫn đó,
        // chỉ thêm version query an toàn.
        try {
            const cssUrl = new URL(href, document.baseURI);
            cssUrl.searchParams.set('lotmk', '20260914-v2');
            href = cssUrl.href;
        } catch (_) {}

        const link = document.createElement('link');
        link.id = 'lotm-klein-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.lotmKlein = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[LOTM Klein] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/lord-of-mysteries-klein.css hoặc gán window.LOTM_KLEIN_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
    }


    // ========================================================
    // LORD OF THE MYSTERIES · KLEIN · FULL PREMIUM RUNTIME V1
    // Namespace: lotm-klein-* / lotmk-*
    // Không gọi ThemeManager / EffectManager và không thay active_theme.
    // ========================================================
    const LuxuryLotmKleinRuntime = {
        activePetElement: null,
        petClickHandler: null,
        documentClickHandler: null,
        observer: null,
        repairQueued: false,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);

            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container #virtual-pet-img.lotm-klein-mystery-magic, ' +
                '#virtual-pet-container #virtual-pet-img.lotm-klein-pet'
            );
        },

        ensurePetInteractivity(pet = this.getPet()) {
            const container =
                document.getElementById('virtual-pet-container');

            if (!container || !pet) {
                return false;
            }

            if (container.style.pointerEvents !== 'auto') {
                container.style.pointerEvents = 'auto';
            }

            if (container.style.visibility !== 'visible') {
                container.style.visibility = 'visible';
            }

            if (container.style.opacity !== '1') {
                container.style.opacity = '1';
            }

            if (pet.style.pointerEvents !== 'auto') {
                pet.style.pointerEvents = 'auto';
            }

            if (pet.style.cursor !== 'pointer') {
                pet.style.cursor = 'pointer';
            }

            pet.setAttribute('draggable', 'false');
            pet.dataset.lotmKleinPremiumInteractive = 'true';

            return true;
        },

        clear() {
            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler,
                    true
                );
            }

            if (this.documentClickHandler) {
                document.removeEventListener(
                    'click',
                    this.documentClickHandler,
                    true
                );
            }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.repairQueued = false;
            this.clearTimers();

            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentClickHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'lotm-klein-equipped',
                'lotm-klein-skill-active'
            );

            document.body?.classList.remove(
                'theme-lotm-klein-premium'
            );

            document
                .querySelectorAll(
                    '.lotm-klein-world,' +
                    '.lotm-klein-ui-frame,' +
                    '.lotm-klein-page-click,' +
                    '.lotm-klein-ultimate'
                )
                .forEach(element => element.remove());

            const container =
                document.getElementById('virtual-pet-container');

            if (
                container &&
                container.__lotmKleinPremiumClickFallback
            ) {
                container.removeEventListener(
                    'click',
                    container.__lotmKleinPremiumClickFallback,
                    true
                );

                delete container.__lotmKleinPremiumClickFallback;
            }

            container?.classList.remove(
                'pet-lotm-klein-stage',
                'lotm-klein-casting'
            );

            container
                ?.querySelectorAll('.lotm-klein-pet-realm')
                .forEach(element => element.remove());

            const activePet =
                container?.querySelector('#virtual-pet-img');

            activePet?.classList.remove('lotm-klein-pet');

            if (activePet?.dataset) {
                delete activePet.dataset.lotmKleinPremiumInteractive;
            }
        },

        createWorld() {
            document
                .querySelectorAll('.lotm-klein-world')
                .forEach(element => element.remove());

            const world = document.createElement('div');
            world.className = 'lotm-klein-world lotm-klein-world-v2';
            world.setAttribute('aria-hidden', 'true');
            world.setAttribute('data-effect-quality-root', '1');

            world.innerHTML = `
                <div class="lotm-klein-world-veil"></div>
                <div class="lotm-klein-world-vignette"></div>
                <div class="lotm-klein-world-aurora aurora-a"></div>
                <div class="lotm-klein-world-aurora aurora-b"></div>
                <div class="lotm-klein-world-fog fog-a"></div>
                <div class="lotm-klein-world-fog fog-b"></div>

                <div class="lotm-klein-world-sigil sigil-main"></div>
                <div class="lotm-klein-world-sigil sigil-left"></div>
                <div class="lotm-klein-world-sigil sigil-right"></div>

                <div class="lotm-klein-world-eye">
                    <i></i><b></b><em></em>
                </div>

                <div class="lotm-klein-world-clock"></div>
                <div class="lotm-klein-world-cathedral"></div>
                <div class="lotm-klein-world-rays"></div>
                <div class="lotm-klein-world-cards"></div>
                <div class="lotm-klein-world-runes"></div>
                <div class="lotm-klein-world-motes"></div>
            `;

            const mobile =
                window.matchMedia?.(
                    '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
                ).matches;

            const cardField =
                world.querySelector('.lotm-klein-world-cards');

            const cardCount =
                getLuxuryQualityCount(mobile ? 7 : 18);

            for (let index = 0; index < cardCount; index++) {
                const card = document.createElement('span');
                card.className = 'lotm-klein-world-card';

                card.style.left =
                    `${3 + ((index * 31 + 7) % 92)}%`;

                card.style.top =
                    `${6 + ((index * 47 + 13) % 84)}%`;

                card.style.setProperty(
                    '--lotmk-duration',
                    `${9 + (index % 7) * 1.35}s`
                );

                card.style.setProperty(
                    '--lotmk-delay',
                    `${-(index % 9) * .73}s`
                );

                card.style.setProperty(
                    '--lotmk-rot',
                    `${-24 + (index % 11) * 5}deg`
                );

                card.style.setProperty(
                    '--lotmk-dx',
                    `${-20 + (index % 8) * 6}px`
                );

                cardField?.appendChild(card);
            }

            const runeField =
                world.querySelector('.lotm-klein-world-runes');

            const runeGlyphs = [
                '✦', '✧', '◇', '◈', '☽', 'Ⅰ', 'Ⅱ', 'Ⅲ',
                'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', '✶'
            ];

            const runeCount =
                getLuxuryQualityCount(mobile ? 8 : 24);

            for (let index = 0; index < runeCount; index++) {
                const rune = document.createElement('span');
                rune.className = 'lotm-klein-world-rune';
                rune.textContent = runeGlyphs[index % runeGlyphs.length];
                rune.style.setProperty(
                    '--lotmk-rx',
                    `${4 + ((index * 37 + 11) % 92)}%`
                );
                rune.style.setProperty(
                    '--lotmk-ry',
                    `${7 + ((index * 59 + 17) % 82)}%`
                );
                rune.style.setProperty(
                    '--lotmk-rd',
                    `${-(index % 10) * .53}s`
                );
                rune.style.setProperty(
                    '--lotmk-rs',
                    `${.72 + (index % 5) * .14}`
                );
                runeField?.appendChild(rune);
            }

            const moteField =
                world.querySelector('.lotm-klein-world-motes');

            const moteCount =
                getLuxuryQualityCount(mobile ? 18 : 52);

            for (let index = 0; index < moteCount; index++) {
                const mote = document.createElement('span');
                mote.className = 'lotm-klein-world-mote';

                mote.style.setProperty(
                    '--lotmk-x',
                    `${(index * 43 + 9) % 100}%`
                );

                mote.style.setProperty(
                    '--lotmk-y',
                    `${(index * 67 + 11) % 100}%`
                );

                mote.style.setProperty(
                    '--lotmk-size',
                    `${1 + (index % 4)}px`
                );

                mote.style.setProperty(
                    '--lotmk-duration',
                    `${4.5 + (index % 8) * .72}s`
                );

                mote.style.setProperty(
                    '--lotmk-delay',
                    `${-(index % 11) * .39}s`
                );

                moteField?.appendChild(mote);
            }

            document.body.appendChild(world);

            requestAnimationFrame(() => {
                world.classList.add('is-active');
            });
        },

        createInterface() {
            document
                .querySelectorAll('.lotm-klein-ui-frame')
                .forEach(element => element.remove());

            const frame = document.createElement('div');
            frame.className = 'lotm-klein-ui-frame lotm-klein-ui-frame-v2';
            frame.setAttribute('aria-hidden', 'true');
            frame.dataset.themeImmune = 'true';

            frame.innerHTML = `
                <span class="lotm-klein-ui-corner tl"></span>
                <span class="lotm-klein-ui-corner tr"></span>
                <span class="lotm-klein-ui-corner bl"></span>
                <span class="lotm-klein-ui-corner br"></span>

                <span class="lotm-klein-ui-rail rail-left">
                    <i></i><b>✦</b><i></i>
                </span>
                <span class="lotm-klein-ui-rail rail-right">
                    <i></i><b>✦</b><i></i>
                </span>

                <div class="lotm-klein-ui-crest">
                    LORD OF THE MYSTERIES · SEFIRAH CASTLE
                </div>
                <div class="lotm-klein-ui-bottom-seal">
                    <i></i><span>THE FOOL · MYSTERY · DESTINY</span><i></i>
                </div>
            `;

            document.body.appendChild(frame);

            requestAnimationFrame(() => {
                frame.classList.add('is-active');
            });
        },

        createPetRealm() {
            const container =
                document.getElementById('virtual-pet-container');

            const pet =
                container?.querySelector('#virtual-pet-img');

            if (!container || !pet) {
                return false;
            }

            container
                .querySelectorAll('.lotm-klein-pet-realm')
                .forEach(element => element.remove());

            container.classList.add(
                'pet-lotm-klein-stage'
            );

            pet.classList.add(
                'lotm-klein-pet'
            );

            pet.setAttribute('draggable', 'false');
            this.ensurePetInteractivity(pet);

            const realm = document.createElement('div');
            realm.className = 'lotm-klein-pet-realm lotm-klein-pet-realm-v2';
            realm.setAttribute('aria-hidden', 'true');

            realm.innerHTML = `
                <span class="lotm-klein-pet-aura aura-outer"></span>
                <span class="lotm-klein-pet-aura aura-inner"></span>
                <span class="lotm-klein-pet-halo"></span>
                <span class="lotm-klein-pet-ring ring-a"></span>
                <span class="lotm-klein-pet-ring ring-b"></span>
                <span class="lotm-klein-pet-ring ring-c"></span>
                <span class="lotm-klein-pet-ring ring-d"></span>
                <span class="lotm-klein-pet-arcana-wheel"></span>
                <span class="lotm-klein-pet-crown"></span>
                <span class="lotm-klein-pet-eye"></span>
                <span class="lotm-klein-pet-throne"></span>
                <span class="lotm-klein-pet-floor"></span>
                <span class="lotm-klein-pet-fog fog-a"></span>
                <span class="lotm-klein-pet-fog fog-b"></span>
                <span class="lotm-klein-pet-card-field"></span>
                <span class="lotm-klein-pet-spark-field"></span>
            `;

            const localCards =
                realm.querySelector('.lotm-klein-pet-card-field');

            for (let index = 0; index < 10; index++) {
                const card = document.createElement('i');
                card.className = 'lotm-klein-pet-card';
                card.style.setProperty('--lotmk-pca', `${index * 36}deg`);
                card.style.setProperty('--lotmk-pcd', `${-index * .31}s`);
                card.style.setProperty('--lotmk-pcr', `${-(98 + (index % 3) * 18)}px`);
                localCards?.appendChild(card);
            }

            const sparkField =
                realm.querySelector('.lotm-klein-pet-spark-field');

            const localSparkCount =
                getLuxuryQualityCount(28, 10);

            for (let index = 0; index < localSparkCount; index++) {
                const spark = document.createElement('i');
                spark.className = 'lotm-klein-pet-spark';
                spark.style.setProperty(
                    '--lotmk-psx',
                    `${8 + ((index * 37) % 84)}%`
                );
                spark.style.setProperty(
                    '--lotmk-psy',
                    `${10 + ((index * 53) % 78)}%`
                );
                spark.style.setProperty(
                    '--lotmk-psd',
                    `${-(index % 9) * .34}s`
                );
                spark.style.setProperty(
                    '--lotmk-pss',
                    `${2 + (index % 4)}px`
                );
                sparkField?.appendChild(spark);
            }

            container.insertBefore(
                realm,
                pet
            );

            this.activePetElement = pet;
            return true;
        },

        createPageClick(x, y) {
            const click = document.createElement('span');
            click.className = 'lotm-klein-page-click';
            click.style.setProperty('--lotmk-click-x', `${x}px`);
            click.style.setProperty('--lotmk-click-y', `${y}px`);

            for (let index = 0; index < 12; index++) {
                const shard = document.createElement('i');
                shard.className = 'lotm-klein-click-shard';
                shard.style.setProperty(
                    '--lotmk-angle',
                    `${index * 30}deg`
                );
                click.appendChild(shard);
            }

            document.body.appendChild(click);

            this.setTimer(
                () => click.remove(),
                900
            );
        },

        installGlobalClick() {
            if (this.documentClickHandler) {
                document.removeEventListener(
                    'click',
                    this.documentClickHandler,
                    true
                );
            }

            this.documentClickHandler = event => {
                if (
                    !document.documentElement.classList.contains(
                        'lotm-klein-equipped'
                    )
                ) {
                    return;
                }

                const target = event.target;

                if (
                    target instanceof Element &&
                    target.closest(
                        '.ui-theme-immune, [data-theme-immune="true"], ' +
                        '.lotm-klein-ultimate, .lotm-klein-ui-frame'
                    )
                ) {
                    return;
                }

                this.createPageClick(
                    event.clientX,
                    event.clientY
                );
            };

            document.addEventListener(
                'click',
                this.documentClickHandler,
                true
            );
        },

        createUltimate(x, y) {
            if (this.skillLocked) {
                return false;
            }

            this.skillLocked = true;

            document
                .querySelectorAll('.lotm-klein-ultimate')
                .forEach(element => element.remove());

            const ultimate = document.createElement('div');
            ultimate.className = 'lotm-klein-ultimate lotm-klein-ultimate-v2';
            ultimate.setAttribute('aria-hidden', 'true');

            const ux =
                `${Math.max(8, Math.min(92, x / Math.max(1, window.innerWidth) * 100))}%`;

            const uy =
                `${Math.max(10, Math.min(88, y / Math.max(1, window.innerHeight) * 100))}%`;

            ultimate.style.setProperty('--lotmk-ux', ux);
            ultimate.style.setProperty('--lotmk-uy', uy);

            ultimate.innerHTML = `
                <div class="lotm-klein-ultimate-blackout"></div>
                <div class="lotm-klein-ultimate-flash"></div>
                <div class="lotm-klein-ultimate-fog fog-a"></div>
                <div class="lotm-klein-ultimate-fog fog-b"></div>
                <div class="lotm-klein-ultimate-rays"></div>

                <div class="lotm-klein-ultimate-castle">
                    <span class="tower tower-a"></span>
                    <span class="tower tower-b"></span>
                    <span class="tower tower-c"></span>
                </div>

                <div class="lotm-klein-ultimate-sigil sigil-a"></div>
                <div class="lotm-klein-ultimate-sigil sigil-b"></div>
                <div class="lotm-klein-ultimate-sigil sigil-c"></div>
                <div class="lotm-klein-ultimate-eye"></div>
                <div class="lotm-klein-ultimate-cardstorm"></div>
                <div class="lotm-klein-ultimate-glyphs"></div>

                <div class="lotm-klein-ultimate-title">
                    <small>SEFIRAH CASTLE · MYSTERY DESCENDS</small>
                    <strong>LORD OF THE MYSTERIES</strong>
                    <em>THE FOOL ABOVE THE GRAY FOG</em>
                </div>
            `;

            const cardStorm =
                ultimate.querySelector('.lotm-klein-ultimate-cardstorm');

            const ultimateCards =
                getLuxuryQualityCount(28, 10);

            for (let index = 0; index < ultimateCards; index++) {
                const card = document.createElement('i');
                card.className = 'lotm-klein-ultimate-card';
                card.style.setProperty(
                    '--lotmk-ucx',
                    `${2 + ((index * 37 + 9) % 96)}%`
                );
                card.style.setProperty(
                    '--lotmk-ucy',
                    `${-18 - (index % 6) * 8}%`
                );
                card.style.setProperty(
                    '--lotmk-ucd',
                    `${index * .045}s`
                );
                card.style.setProperty(
                    '--lotmk-ucr',
                    `${-34 + (index % 13) * 6}deg`
                );
                cardStorm?.appendChild(card);
            }

            const glyphField =
                ultimate.querySelector('.lotm-klein-ultimate-glyphs');

            ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','☽','✦'].forEach(
                (glyph, index) => {
                    const mark = document.createElement('b');
                    mark.textContent = glyph;
                    mark.style.setProperty('--lotmk-uga', `${index * 30}deg`);
                    mark.style.setProperty('--lotmk-ugd', `${index * .035}s`);
                    glyphField?.appendChild(mark);
                }
            );

            document.body.appendChild(ultimate);

            document.documentElement.classList.add(
                'lotm-klein-skill-active'
            );

            document
                .getElementById('virtual-pet-container')
                ?.classList.add('lotm-klein-casting');

            this.setTimer(() => {
                ultimate.remove();

                document.documentElement.classList.remove(
                    'lotm-klein-skill-active'
                );

                document
                    .getElementById('virtual-pet-container')
                    ?.classList.remove('lotm-klein-casting');

                this.skillLocked = false;
            }, 3250);

            return true;
        },

        installPetSkill() {
            const pet =
                this.getPet() ||
                document.querySelector(
                    '#virtual-pet-container #virtual-pet-img'
                );

            if (!pet) {
                return false;
            }

            this.ensurePetInteractivity(pet);

            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler,
                    true
                );
            }

            this.activePetElement = pet;

            this.petClickHandler = event => {
                if (
                    !document.documentElement.classList.contains(
                        'lotm-klein-equipped'
                    )
                ) {
                    return;
                }

                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                event.__lotmKleinPremiumHandled = true;

                const rect =
                    pet.getBoundingClientRect();

                this.createUltimate(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2
                );
            };

            // Capture phase để kỹ năng Klein không bị listener kéo/thả hoặc
            // listener pet mặc định chặn trước khi tới handler Premium.
            pet.addEventListener(
                'click',
                this.petClickHandler,
                true
            );

            /*
             * Fallback ở container:
             * nếu một lớp CSS/runtime khác khiến target click không đi đúng
             * listener ảnh nhưng click vẫn nằm trong vùng Klein, ultimate vẫn chạy.
             */
            const container =
                document.getElementById('virtual-pet-container');

            if (container && !container.__lotmKleinPremiumClickFallback) {
                container.__lotmKleinPremiumClickFallback = event => {
                    if (
                        event.__lotmKleinPremiumHandled ||
                        !document.documentElement.classList.contains(
                            'lotm-klein-equipped'
                        )
                    ) {
                        return;
                    }

                    const currentPet = this.getPet();

                    if (!currentPet) {
                        return;
                    }

                    const target = event.target;

                    if (
                        target !== currentPet &&
                        !(target instanceof Element &&
                          target.closest('#virtual-pet-img') === currentPet)
                    ) {
                        return;
                    }

                    if (
                        typeof PetInteractionManager !== 'undefined' &&
                        PetInteractionManager.isPetDragging
                    ) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    event.__lotmKleinPremiumHandled = true;

                    const rect =
                        currentPet.getBoundingClientRect();

                    this.createUltimate(
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2
                    );
                };

                container.addEventListener(
                    'click',
                    container.__lotmKleinPremiumClickFallback,
                    true
                );
            }

            return true;
        },

        repair() {
            if (
                !document.documentElement.classList.contains(
                    'lotm-klein-equipped'
                )
            ) {
                return false;
            }

            ensureLotmKleinStylesheet();

            document.body?.classList.add(
                'theme-lotm-klein-premium'
            );

            if (!document.querySelector('.lotm-klein-world')) {
                this.createWorld();
            }

            if (!document.querySelector('.lotm-klein-ui-frame')) {
                this.createInterface();
            }

            const container =
                document.getElementById('virtual-pet-container');

            const pet =
                container?.querySelector('#virtual-pet-img');

            if (container && pet) {
                if (
                    !pet.classList.contains('lotm-klein-pet') ||
                    !container.querySelector('.lotm-klein-pet-realm')
                ) {
                    this.createPetRealm();
                }

                this.ensurePetInteractivity(pet);

                /*
                 * Rebind mỗi lần repair:
                 * removeEventListener + addEventListener trong installPetSkill()
                 * là idempotent và giúp khôi phục click nếu DOM/runtime khác
                 * đã làm mất listener mà reference cũ vẫn còn.
                 */
                this.installPetSkill();
            }

            if (!this.documentClickHandler) {
                this.installGlobalClick();
            }

            return true;
        },

        installObserver() {
            const container =
                document.getElementById('virtual-pet-container');

            if (!container) {
                return false;
            }

            if (this.observer) {
                this.observer.disconnect();
            }

            this.observer = new MutationObserver(() => {
                if (
                    !document.documentElement.classList.contains(
                        'lotm-klein-equipped'
                    ) ||
                    this.repairQueued
                ) {
                    return;
                }

                this.repairQueued = true;

                queueMicrotask(() => {
                    this.repairQueued = false;
                    this.repair();
                });
            });

            this.observer.observe(
                container,
                {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: [
                        'src',
                        'class',
                        'style'
                    ]
                }
            );

            return true;
        },

        mount() {
            ensureLotmKleinStylesheet();
            this.clear();

            document.documentElement.classList.add(
                'lotm-klein-equipped'
            );

            document.body?.classList.add(
                'theme-lotm-klein-premium'
            );

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installPetSkill();
            this.installObserver();

            [100, 320, 720, 1400, 2600].forEach(delay => {
                this.setTimer(() => {
                    this.repair();
                }, delay);
            });

            return true;
        },

        restore(attempt = 0) {
            ensureLotmKleinStylesheet();

            const pet = this.getPet();
            const activePetId = localStorage.getItem('active_pet');

            if (
                activePetId !== 'pet_lotm_klein_event_1' &&
                !pet
            ) {
                return false;
            }

            if (pet) {
                this.mount();
                return true;
            }

            if (attempt < 28) {
                this.setTimer(
                    () => this.restore(attempt + 1),
                    140 + attempt * 30
                );
            }

            return false;
        }
    };


    // ========================================================
    // LORD OF THE MYSTERIES · KLEIN · AUTO-MOUNT BRIDGE
    // Nếu PetManager render trước/sau LuxuryStore hoặc DOM pet bị dựng lại,
    // runtime vẫn tự phục hồi world + UI + realm + kỹ năng nhấn.
    // ========================================================
    let lotmKleinAutoObserver = null;
    let lotmKleinAutoRetryTimer = null;
    let lotmKleinAutoSyncQueued = false;

    function syncLotmKleinRuntimeFromDom() {
        if (window.isStudentStoreGameAccessEnabled?.() === false) return null;
        const pet = document.querySelector(
            '#virtual-pet-container #virtual-pet-img.lotm-klein-mystery-magic, ' +
            '#virtual-pet-container #virtual-pet-img.lotm-klein-pet'
        );

        if (!pet) {
            return;
        }

        const needsMount =
            !document.documentElement.classList.contains('lotm-klein-equipped') ||
            !document.querySelector('.lotm-klein-world') ||
            !document.querySelector('.lotm-klein-ui-frame') ||
            !document.querySelector('#virtual-pet-container .lotm-klein-pet-realm');

        if (needsMount) {
            LuxuryLotmKleinRuntime.mount();
        } else {
            LuxuryLotmKleinRuntime.repair();
        }
    }

    function installLotmKleinAutoMountObserver(attempt = 0) {
        const container =
            document.getElementById('virtual-pet-container');

        if (!container) {
            if (attempt < 80) {
                window.clearTimeout(lotmKleinAutoRetryTimer);
                lotmKleinAutoRetryTimer = window.setTimeout(
                    () => installLotmKleinAutoMountObserver(attempt + 1),
                    100
                );
            }
            return;
        }

        lotmKleinAutoObserver?.disconnect();

        const queueSync = () => {
            if (lotmKleinAutoSyncQueued) return;
            lotmKleinAutoSyncQueued = true;

            queueMicrotask(() => {
                lotmKleinAutoSyncQueued = false;
                syncLotmKleinRuntimeFromDom();
            });
        };

        lotmKleinAutoObserver =
            new MutationObserver(queueSync);

        lotmKleinAutoObserver.observe(
            container,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src', 'class', 'style']
            }
        );

        syncLotmKleinRuntimeFromDom();

        [180, 650, 1600].forEach(delay => {
            window.setTimeout(syncLotmKleinRuntimeFromDom, delay);
        });
    }

    installLotmKleinAutoMountObserver();


    // ========================================================
    // CẦM CƠ · CẦM MỘNG · CSS LOADER
    // MỘT file CSS duy nhất đảm nhiệm card + pet realm + full web skin
    // + popup/input/slider/scrollbar + click + ultimate.
    // ========================================================
    function ensureCamCoCamMongStylesheet() {
        if (document.getElementById('cam-co-cam-mong-premium-style')) {
            return;
        }

        let href = '';

        if (window.CAM_CO_CAM_MONG_CSS_PATH) {
            href = String(window.CAM_CO_CAM_MONG_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script => /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i.test(script.src || ''));

            if (ownScript?.src) {
                try {
                    href = new URL('../css/cam-co-cam-mong.css', ownScript.src).href;
                } catch (error) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL('css/cam-co-cam-mong.css', document.baseURI).href;
        }

        const link = document.createElement('link');
        link.id = 'cam-co-cam-mong-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.camCoCamMong = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[Cầm Mộng] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/cam-co-cam-mong.css hoặc gán window.CAM_CO_CAM_MONG_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
    }


    // ========================================================
    // CẦM CƠ · CẦM MỘNG · FULL PREMIUM RUNTIME V1
    // Namespace: cam-co-cam-mong-*
    // KHÔNG gọi ThemeManager / EffectManager, KHÔNG thay active_theme
    // hay active_effect. Runtime chỉ sống theo pet đang được trang bị.
    // ========================================================
    const LuxuryCamCoCamMongRuntime = {
        activePetElement: null,
        petClickHandler: null,
        documentClickHandler: null,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        clear() {
            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentClickHandler) {
                document.removeEventListener(
                    'click',
                    this.documentClickHandler,
                    true
                );
            }

            this.clearTimers();
            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentClickHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'cam-co-cam-mong-equipped'
            );
            document.body?.classList.remove(
                'theme-cam-co-cam-mong'
            );

            document
                .querySelectorAll(
                    '.cam-co-cam-mong-world,' +
                    '.cam-co-cam-mong-ui-frame,' +
                    '.cam-co-cam-mong-page-click,' +
                    '.cam-co-cam-mong-ultimate,' +
                    '.cam-co-cam-mong-dialogue'
                )
                .forEach(element => element.remove());

            const container =
                document.getElementById('virtual-pet-container');

            container?.classList.remove(
                'pet-cam-co-cam-mong-stage',
                'cam-co-cam-mong-casting'
            );

            container
                ?.querySelectorAll('.cam-co-cam-mong-pet-realm')
                .forEach(element => element.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('cam-co-cam-mong-pet');
        },

        createWorld() {
            document
                .querySelectorAll('.cam-co-cam-mong-world')
                .forEach(element => element.remove());

            const world = document.createElement('div');
            world.className = 'cam-co-cam-mong-world cam-co-ancient-world-v2';
            world.setAttribute('aria-hidden', 'true');
            world.setAttribute('data-effect-quality-root', '1');

            world.innerHTML = `
                <div class="cam-co-world-ink"></div>
                <div class="cam-co-world-palace-haze"></div>

                <div class="cam-co-world-moon">
                    <i></i><b></b><span></span>
                    <em>梦</em>
                </div>

                <div class="cam-co-world-mountain mountain-a"></div>
                <div class="cam-co-world-mountain mountain-b"></div>
                <div class="cam-co-world-mountain mountain-c"></div>

                <div class="cam-co-world-cloud cloud-a"></div>
                <div class="cam-co-world-cloud cloud-b"></div>
                <div class="cam-co-world-cloud cloud-c"></div>
                <div class="cam-co-world-cloud cloud-d"></div>
                <div class="cam-co-world-cloud cloud-e"></div>

                <div class="cam-co-world-palace-gate gate-left">
                    <i></i><i></i><i></i><i></i><b></b>
                </div>
                <div class="cam-co-world-palace-gate gate-right">
                    <i></i><i></i><i></i><i></i><b></b>
                </div>

                <div class="cam-co-world-ribbon ribbon-a"></div>
                <div class="cam-co-world-ribbon ribbon-b"></div>
                <div class="cam-co-world-ribbon ribbon-c"></div>
                <div class="cam-co-world-ribbon ribbon-d"></div>

                <div class="cam-co-world-screen-glow"></div>
                <div class="cam-co-world-light-sweep"></div>
                <div class="cam-co-world-cloud-veil"></div>
                <div class="cam-co-world-bokeh"></div>
                <div class="cam-co-world-talismans"></div>

                <div class="cam-co-world-lanterns"></div>
                <div class="cam-co-world-lotus-field"></div>
                <div class="cam-co-world-qin-lines"></div>
                <div class="cam-co-world-petals"></div>
                <div class="cam-co-world-stars"></div>
                <div class="cam-co-world-jade-dust"></div>
            `;

            const reduced = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
            ).matches;

            const petalField = world.querySelector('.cam-co-world-petals');
            const starField = world.querySelector('.cam-co-world-stars');
            const dustField = world.querySelector('.cam-co-world-jade-dust');
            const qinLines = world.querySelector('.cam-co-world-qin-lines');
            const lanternField = world.querySelector('.cam-co-world-lanterns');
            const lotusField = world.querySelector('.cam-co-world-lotus-field');
            const bokehField = world.querySelector('.cam-co-world-bokeh');
            const talismanField = world.querySelector('.cam-co-world-talismans');

            const petalCount = getLuxuryQualityCount(reduced ? 20 : 52);
            const starCount = getLuxuryQualityCount(reduced ? 18 : 46);
            const dustCount = getLuxuryQualityCount(reduced ? 22 : 58);
            const stringCount = getLuxuryQualityCount(reduced ? 7 : 13);
            const lanternCount = getLuxuryQualityCount(reduced ? 4 : 9);
            const lotusCount = getLuxuryQualityCount(reduced ? 4 : 8);
            const bokehCount = getLuxuryQualityCount(reduced ? 10 : 34);
            const talismanCount = getLuxuryQualityCount(reduced ? 5 : 14);

            for (let index = 0; index < petalCount; index++) {
                const petal = document.createElement('i');
                petal.style.setProperty('--cc-x', `${(index * 37 + 7) % 97}%`);
                petal.style.setProperty('--cc-size', `${6 + (index % 6) * 1.7}px`);
                petal.style.setProperty('--cc-delay', `${-(index % 15) * .61}s`);
                petal.style.setProperty('--cc-drift', `${-58 + (index % 11) * 12}px`);
                petal.style.setProperty('--cc-petal-rot', `${(index * 41) % 180}deg`);
                petalField?.appendChild(petal);
            }

            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('i');
                star.textContent = index % 7 === 0 ? '✦' : (index % 11 === 0 ? '✧' : '');
                star.style.setProperty('--cc-sx', `${(index * 53 + 11) % 96}%`);
                star.style.setProperty('--cc-sy', `${(index * 71 + 5) % 88}%`);
                star.style.setProperty('--cc-ss', `${2.2 + (index % 5) * 1.1}px`);
                star.style.setProperty('--cc-sd', `${-(index % 10) * .48}s`);
                starField?.appendChild(star);
            }

            for (let index = 0; index < dustCount; index++) {
                const dust = document.createElement('i');
                dust.style.setProperty('--cc-dx', `${(index * 29 + 3) % 98}%`);
                dust.style.setProperty('--cc-dy', `${(index * 47 + 9) % 92}%`);
                dust.style.setProperty('--cc-ds', `${2 + (index % 5) * .75}px`);
                dust.style.setProperty('--cc-dd', `${-(index % 13) * .57}s`);
                dust.style.setProperty('--cc-ddrift', `${-18 + (index % 7) * 7}px`);
                dustField?.appendChild(dust);
            }

            for (let index = 0; index < stringCount; index++) {
                const string = document.createElement('i');
                string.style.setProperty('--cc-qi', index);
                string.style.setProperty('--cc-qd', `${-(index % 8) * .17}s`);
                qinLines?.appendChild(string);
            }

            for (let index = 0; index < lanternCount; index++) {
                const lantern = document.createElement('i');
                lantern.innerHTML = '<b></b><span></span>';
                lantern.style.setProperty('--cc-lx', `${8 + ((index * 91) % 84)}%`);
                lantern.style.setProperty('--cc-ly', `${9 + ((index * 41) % 57)}%`);
                lantern.style.setProperty('--cc-ls', `${.72 + (index % 4) * .12}`);
                lantern.style.setProperty('--cc-ld', `${-(index % 7) * .8}s`);
                lanternField?.appendChild(lantern);
            }

            for (let index = 0; index < lotusCount; index++) {
                const lotus = document.createElement('i');
                lotus.innerHTML = '<b></b><b></b><b></b><b></b><b></b><span></span>';
                lotus.style.setProperty('--cc-lox', `${5 + ((index * 79) % 90)}%`);
                lotus.style.setProperty('--cc-los', `${.68 + (index % 3) * .17}`);
                lotus.style.setProperty('--cc-lod', `${-(index % 5) * 1.1}s`);
                lotusField?.appendChild(lotus);
            }

            for (let index = 0; index < bokehCount; index++) {
                const orb = document.createElement('i');
                orb.style.setProperty('--cc-bx', `${(index * 67 + 9) % 96}%`);
                orb.style.setProperty('--cc-by', `${(index * 43 + 6) % 90}%`);
                orb.style.setProperty('--cc-bs', `${18 + (index % 7) * 11}px`);
                orb.style.setProperty('--cc-bd', `${-(index % 12) * .62}s`);
                orb.style.setProperty('--cc-bdrift', `${-28 + (index % 9) * 8}px`);
                bokehField?.appendChild(orb);
            }

            const talismanSymbols = ['琴','梦','仙','月','云','花','灵'];
            for (let index = 0; index < talismanCount; index++) {
                const seal = document.createElement('i');
                seal.textContent = talismanSymbols[index % talismanSymbols.length];
                seal.style.setProperty('--cc-tx', `${6 + ((index * 83) % 88)}%`);
                seal.style.setProperty('--cc-ty', `${10 + ((index * 57) % 74)}%`);
                seal.style.setProperty('--cc-ts', `${.72 + (index % 5) * .12}`);
                seal.style.setProperty('--cc-td', `${-(index % 9) * .78}s`);
                seal.style.setProperty('--cc-tr', `${-10 + (index % 7) * 4}deg`);
                talismanField?.appendChild(seal);
            }

            document.body.appendChild(world);
            requestAnimationFrame(() => world.classList.add('is-mounted'));
        },

        createInterface() {
            document
                .querySelectorAll('.cam-co-cam-mong-ui-frame')
                .forEach(element => element.remove());

            const frame = document.createElement('div');
            frame.className = 'cam-co-cam-mong-ui-frame cam-co-ancient-ui-v2';
            frame.setAttribute('aria-hidden', 'true');

            frame.innerHTML = `
                <div class="cam-co-ui-top">
                    <i></i>
                    <div class="cam-co-ui-tassel tassel-left"><b></b><span></span></div>
                    <div class="cam-co-ui-seal">
                        <em class="cam-co-ui-cloud cloud-left"></em>
                        <small>仙 · 琴 · 梦</small>
                        <strong>CẦM MỘNG</strong>
                        <span>NHẤT KHÚC NHẬP TIÊN MÔN</span>
                        <em class="cam-co-ui-cloud cloud-right"></em>
                    </div>
                    <div class="cam-co-ui-tassel tassel-right"><b></b><span></span></div>
                    <i></i>
                </div>

                <div class="cam-co-ui-corner-wrap corner-tl">
                    <span class="cam-co-ui-corner">❀</span><i></i><b></b>
                </div>
                <div class="cam-co-ui-corner-wrap corner-tr">
                    <span class="cam-co-ui-corner">❀</span><i></i><b></b>
                </div>
                <div class="cam-co-ui-corner-wrap corner-bl">
                    <span class="cam-co-ui-corner">☾</span><i></i><b></b>
                </div>
                <div class="cam-co-ui-corner-wrap corner-br">
                    <span class="cam-co-ui-corner">☾</span><i></i><b></b>
                </div>

                <div class="cam-co-ui-side side-left">
                    <em>琴</em><b></b><b></b><b></b><b></b><span>❀</span>
                </div>
                <div class="cam-co-ui-side side-right">
                    <em>梦</em><b></b><b></b><b></b><b></b><span>❀</span>
                </div>

                <div class="cam-co-ui-bottom">
                    <span>琴</span>
                    <i></i><i></i><i></i><i></i><i></i>
                    <strong>LẠC THANH HUYỀN</strong>
                    <i></i><i></i><i></i><i></i><i></i>
                    <span>梦</span>
                </div>
            `;

            document.body.appendChild(frame);
            requestAnimationFrame(() => frame.classList.add('is-mounted'));
        },

        createPetRealm() {
            const container =
                document.getElementById('virtual-pet-container');
            const pet =
                container?.querySelector('#virtual-pet-img');

            if (!container || !pet) return;

            container.classList.add('pet-cam-co-cam-mong-stage');
            pet.classList.add('cam-co-cam-mong-pet');

            container
                .querySelectorAll('.cam-co-cam-mong-pet-realm')
                .forEach(element => element.remove());

            const realm = document.createElement('div');
            realm.className = 'cam-co-cam-mong-pet-realm cam-co-ancient-pet-realm-v2';
            realm.setAttribute('aria-hidden', 'true');
            realm.setAttribute('data-effect-quality-root', '1');

            realm.innerHTML = `
                <span class="cam-co-pet-halo"></span>
                <span class="cam-co-pet-moon"></span>
                <span class="cam-co-pet-ring ring-a"></span>
                <span class="cam-co-pet-ring ring-b"></span>
                <span class="cam-co-pet-ring ring-c"></span>

                <span class="cam-co-pet-cloud cloud-a"></span>
                <span class="cam-co-pet-cloud cloud-b"></span>
                <span class="cam-co-pet-cloud cloud-c"></span>

                <span class="cam-co-pet-ribbon ribbon-a"></span>
                <span class="cam-co-pet-ribbon ribbon-b"></span>

                <span class="cam-co-pet-qin"></span>

                <span class="cam-co-pet-lotus">
                    <i></i><i></i><i></i><i></i><i></i><i></i><b></b>
                </span>

                <span class="cam-co-pet-talisman talisman-a">琴</span>
                <span class="cam-co-pet-talisman talisman-b">梦</span>
                <span class="cam-co-pet-talisman talisman-c">仙</span>

                <span class="cam-co-pet-notes"></span>
                <span class="cam-co-pet-sparks"></span>
                <span class="cam-co-pet-petals"></span>
            `;

            const notes = realm.querySelector('.cam-co-pet-notes');
            ['♪','✦','♫','❀','♪','✧','♫','☾','✦','♪','梦','琴','❀','♫'].forEach((symbol, index) => {
                const note = document.createElement('i');
                note.textContent = symbol;
                note.style.setProperty('--cc-ni', index);
                note.style.setProperty('--cc-nd', `${-(index % 7) * .28}s`);
                notes?.appendChild(note);
            });

            const sparks = realm.querySelector('.cam-co-pet-sparks');
            for (let index = 0; index < 26; index++) {
                const spark = document.createElement('i');
                spark.style.setProperty('--cc-psa', `${index * (360 / 26)}deg`);
                spark.style.setProperty('--cc-psad', `${index * -(360 / 26)}deg`);
                spark.style.setProperty('--cc-psr-neg', `${-(72 + (index % 6) * 17)}px`);
                spark.style.setProperty('--cc-psd', `${-(index % 9) * .23}s`);
                sparks?.appendChild(spark);
            }

            const petals = realm.querySelector('.cam-co-pet-petals');
            for (let index = 0; index < 20; index++) {
                const petal = document.createElement('i');
                petal.style.setProperty('--cc-ppa', `${index * 18}deg`);
                petal.style.setProperty('--cc-ppad', `${index * -18}deg`);
                petal.style.setProperty('--cc-ppr-neg', `${-(66 + (index % 5) * 18)}px`);
                petal.style.setProperty('--cc-ppd', `${-(index % 8) * .31}s`);
                petals?.appendChild(petal);
            }

            container.insertBefore(realm, pet);
            this.installPetSkill(pet, container);
        },

        installPetSkill(pet, container) {
            if (!pet || !container) return;

            this.activePetElement = pet;
            this.petClickHandler = event => {
                if (this.skillLocked) return;
                if (!document.documentElement.classList.contains('cam-co-cam-mong-equipped')) return;
                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) return;

                event.stopPropagation();

                const rect = pet.getBoundingClientRect();
                const x = Number.isFinite(event.clientX) && event.clientX > 0
                    ? event.clientX
                    : rect.left + rect.width / 2;
                const y = Number.isFinite(event.clientY) && event.clientY > 0
                    ? event.clientY
                    : rect.top + rect.height / 2;

                this.skillLocked = true;
                container.classList.add('cam-co-cam-mong-casting');
                this.createPageClick(x, y, true);
                this.createUltimate(x, y, container);

                this.setTimer(() => {
                    this.skillLocked = false;
                    container.classList.remove('cam-co-cam-mong-casting');
                }, 6900);
            };

            pet.addEventListener('click', this.petClickHandler);
        },

        installGlobalClick() {
            this.documentClickHandler = event => {
                if (!document.documentElement.classList.contains('cam-co-cam-mong-equipped')) return;

                const target = event.target;
                if (target instanceof Element && target.closest('#virtual-pet-container')) {
                    const pet = target.closest('#virtual-pet-img') ||
                        document.querySelector('#virtual-pet-container #virtual-pet-img.cam-co-cam-mong-pet');
                    if (pet && typeof this.petClickHandler === 'function') {
                        this.petClickHandler(event);
                    }
                    return;
                }

                if (
                    target instanceof Element &&
                    target.closest('.ui-theme-immune, [data-theme-immune="true"]')
                ) return;

                const x = Number.isFinite(event.clientX) ? event.clientX : window.innerWidth / 2;
                const y = Number.isFinite(event.clientY) ? event.clientY : window.innerHeight / 2;
                this.createPageClick(x, y, false);
            };

            document.addEventListener('click', this.documentClickHandler, true);
        },

        createPageClick(x, y, strong = false) {
            const burst = document.createElement('div');
            burst.className = 'cam-co-cam-mong-page-click cam-co-ancient-click-v2' + (strong ? ' is-strong' : '');
            burst.style.setProperty('--cc-click-x', `${x}px`);
            burst.style.setProperty('--cc-click-y', `${y}px`);
            burst.setAttribute('aria-hidden', 'true');
            burst.setAttribute('data-effect-quality-root', '1');

            burst.innerHTML = `
                <i class="ring ring-a"></i>
                <i class="ring ring-b"></i>
                <i class="ring ring-c"></i>
                <i class="ring ring-d"></i>
                <span class="seal">琴</span>
                <span class="seal-outer">梦</span>
                <b class="note note-a">♪</b>
                <b class="note note-b">✦</b>
                <b class="note note-c">❀</b>
                <b class="note note-d">♫</b>
                <b class="note note-e">☾</b>
                <em class="ink ink-a"></em>
                <em class="ink ink-b"></em>
                <em class="petal petal-a"></em>
                <em class="petal petal-b"></em>
                <em class="petal petal-c"></em>
                <em class="petal petal-d"></em>
                <span class="ray ray-a"></span>
                <span class="ray ray-b"></span>
                <span class="ray ray-c"></span>
                <span class="ray ray-d"></span>
            `;

            document.body.appendChild(burst);
            requestAnimationFrame(() => burst.classList.add('is-active'));
            this.setTimer(() => burst.remove(), strong ? 1800 : 1250);
        },

        createUltimate(x, y, container) {
            document
                .querySelectorAll('.cam-co-cam-mong-ultimate, .cam-co-cam-mong-dialogue')
                .forEach(element => element.remove());

            const ultimate = document.createElement('div');
            ultimate.className = 'cam-co-cam-mong-ultimate cam-co-ancient-ultimate-v2';
            ultimate.style.setProperty('--cc-ultimate-x', `${x}px`);
            ultimate.style.setProperty('--cc-ultimate-y', `${y}px`);
            ultimate.setAttribute('aria-hidden', 'true');
            ultimate.setAttribute('data-effect-quality-root', '1');

            ultimate.innerHTML = `
                <div class="cam-co-ultimate-flash"></div>
                <div class="cam-co-ultimate-sky"></div>

                <div class="cam-co-ultimate-curtain curtain-left"></div>
                <div class="cam-co-ultimate-curtain curtain-right"></div>

                <div class="cam-co-ultimate-ink ink-left"></div>
                <div class="cam-co-ultimate-ink ink-right"></div>

                <div class="cam-co-ultimate-palace">
                    <i></i><i></i><i></i><i></i><b></b><span></span>
                </div>

                <div class="cam-co-ultimate-moon">
                    <i></i><b></b><strong>琴</strong><em>梦</em>
                </div>

                <div class="cam-co-ultimate-ribbon ribbon-a"></div>
                <div class="cam-co-ultimate-ribbon ribbon-b"></div>
                <div class="cam-co-ultimate-ribbon ribbon-c"></div>
                <div class="cam-co-ultimate-ribbon ribbon-d"></div>

                <div class="cam-co-ultimate-qin"></div>
                <div class="cam-co-ultimate-petals"></div>
                <div class="cam-co-ultimate-runes"></div>
                <div class="cam-co-ultimate-stars"></div>
                <div class="cam-co-ultimate-lotus-field"></div>

                <div class="cam-co-ultimate-wave wave-a"></div>
                <div class="cam-co-ultimate-wave wave-b"></div>
                <div class="cam-co-ultimate-wave wave-c"></div>

                <div class="cam-co-ultimate-title-seal">
                    <small>九霄仙音</small>
                    <strong>一曲入梦</strong>
                    <span>CẦM MỘNG TIÊN CẢNH</span>
                </div>
            `;

            const qin = ultimate.querySelector('.cam-co-ultimate-qin');
            const petals = ultimate.querySelector('.cam-co-ultimate-petals');
            const runes = ultimate.querySelector('.cam-co-ultimate-runes');
            const stars = ultimate.querySelector('.cam-co-ultimate-stars');
            const lotuses = ultimate.querySelector('.cam-co-ultimate-lotus-field');

            for (let index = 0; index < 21; index++) {
                const string = document.createElement('i');
                string.style.setProperty('--cc-ui', index);
                string.style.setProperty('--cc-ud', `${index * .028}s`);
                qin?.appendChild(string);
            }

            for (let index = 0; index < 72; index++) {
                const petal = document.createElement('i');
                petal.style.setProperty('--cc-ua', `${index * 5}deg`);
                petal.style.setProperty('--cc-uad', `${index * -5}deg`);
                const radius = 120 + (index % 10) * 31;
                petal.style.setProperty('--cc-ur', `${radius}px`);
                petal.style.setProperty('--cc-ur-neg', `${-radius}px`);
                petal.style.setProperty('--cc-upd', `${(index % 12) * .036}s`);
                petals?.appendChild(petal);
            }

            ['仙','梦','琴','月','灵','心','道','音','云','花','夜','境','玉','霜','弦','华'].forEach((symbol, index) => {
                const rune = document.createElement('i');
                rune.textContent = symbol;
                rune.style.setProperty('--cc-ri', index);
                rune.style.setProperty('--cc-ra', `${index * 22.5}deg`);
                rune.style.setProperty('--cc-ra-neg', `${index * -22.5}deg`);
                rune.style.setProperty('--cc-ra-end', `${index * 22.5 + 18}deg`);
                rune.style.setProperty('--cc-ra-end-neg', `${index * -22.5 - 18}deg`);
                rune.style.setProperty('--cc-rd', `${(index % 8) * .065}s`);
                runes?.appendChild(rune);
            });

            for (let index = 0; index < 68; index++) {
                const star = document.createElement('i');
                star.style.setProperty('--cc-usx', `${(index * 47 + 5) % 96}%`);
                star.style.setProperty('--cc-usy', `${(index * 73 + 7) % 90}%`);
                star.style.setProperty('--cc-uss', `${2 + (index % 6) * .9}px`);
                star.style.setProperty('--cc-usd', `${-(index % 14) * .11}s`);
                stars?.appendChild(star);
            }

            for (let index = 0; index < 10; index++) {
                const lotus = document.createElement('i');
                lotus.innerHTML = '<b></b><b></b><b></b><b></b><b></b><span></span>';
                lotus.style.setProperty('--cc-ulx', `${5 + ((index * 83) % 90)}%`);
                lotus.style.setProperty('--cc-uls', `${.72 + (index % 4) * .14}`);
                lotus.style.setProperty('--cc-uld', `${(index % 6) * .12}s`);
                lotuses?.appendChild(lotus);
            }

            const dialogue = document.createElement('div');
            dialogue.className = 'cam-co-cam-mong-dialogue cam-co-ancient-dialogue-v2';
            dialogue.innerHTML = `
                <i class="ornament ornament-left">❀</i>
                <small>仙音入梦 · CỔ CẦM KHAI CẢNH</small>
                <strong>CẦM MỘNG · VẠN HOA TIÊN KHÚC</strong>
                <span>NHẤT KHÚC MỘNG KHỞI · VẠN NIỆM TỊNH TÂM</span>
                <i class="ornament ornament-right">❀</i>
            `;

            document.body.append(ultimate, dialogue);
            requestAnimationFrame(() => {
                ultimate.classList.add('is-active');
                dialogue.classList.add('is-active');
            });

            this.setTimer(() => ultimate.classList.add('is-climax'), 720);
            this.setTimer(() => dialogue.classList.add('is-visible'), 860);
            this.setTimer(() => {
                ultimate.classList.add('is-ending');
                dialogue.classList.add('is-ending');
            }, 5250);
            this.setTimer(() => {
                ultimate.remove();
                dialogue.remove();
                container?.classList.remove('cam-co-cam-mong-casting');
            }, 6500);
        },

        mount() {
            this.clear();
            ensureCamCoCamMongStylesheet();

            document.documentElement.classList.add('cam-co-cam-mong-equipped');
            document.body?.classList.add('theme-cam-co-cam-mong');

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();

            const repairMount = () => {
                if (!document.documentElement.classList.contains('cam-co-cam-mong-equipped')) return;
                if (!document.querySelector('.cam-co-cam-mong-world')) this.createWorld();
                if (!document.querySelector('.cam-co-cam-mong-ui-frame')) this.createInterface();

                const pet = document.querySelector('#virtual-pet-container #virtual-pet-img');
                if (pet && !document.querySelector('#virtual-pet-container .cam-co-cam-mong-pet-realm')) {
                    this.createPetRealm();
                }
            };

            this.setTimer(repairMount, 120);
            this.setTimer(repairMount, 520);
            this.setTimer(repairMount, 1200);
        }
    };


    // ========================================================
    // TAMON'S B-SIDE · CSS LOADER
    // Một file CSS đảm nhiệm toàn bộ skin / animation.
    // Có thể đặt window.TAMON_BSIDE_CSS_PATH trước khi file này chạy
    // nếu project lưu CSS ở đường dẫn khác.
    // ========================================================
    function ensureTamonBSideStylesheet() {
        if (document.getElementById('tamon-b-side-premium-style')) {
            return;
        }

        /*
         * Project hiện tại đặt JavaScript trong /js và CSS trong /css.
         * Trước đây href='tamon-b-side.css' bị browser hiểu theo URL của
         * trang HTML, nên phát sinh ERR_FILE_NOT_FOUND.
         *
         * Ưu tiên:
         * 1) window.TAMON_BSIDE_CSS_PATH nếu project tự cấu hình.
         * 2) Tự suy ra ../css/tamon-b-side.css từ chính luxury-store.js.
         * 3) Fallback css/tamon-b-side.css theo document.baseURI.
         */
        let href = '';

        if (window.TAMON_BSIDE_CSS_PATH) {
            href = String(window.TAMON_BSIDE_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script => /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i.test(script.src || ''));

            if (ownScript?.src) {
                try {
                    href = new URL('../css/tamon-b-side.css', ownScript.src).href;
                } catch (error) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL('css/tamon-b-side.css', document.baseURI).href;
        }

        const link = document.createElement('link');
        link.id = 'tamon-b-side-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.tamonBside = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[Tamon B-Side] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/tamon-b-side.css hoặc gán window.TAMON_BSIDE_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
    }



    // ========================================================
    // TAMON · PINK STATIC · CSS LOADER
    // Dùng CHUNG file css/tamon-b-side.css với pet 1.
    // ========================================================
    function ensureTamonPinkStaticStylesheet() {
        ensureTamonBSideStylesheet();
    }


    // ========================================================
    // TAMON'S B-SIDE · FULL PREMIUM RUNTIME V1
    // Namespace: tamon-bside-*
    // Không đụng active_theme / active_effect, vì vậy pet này không
    // ghi đè dữ liệu giao diện hoặc hiệu ứng khác trong localStorage.
    // ========================================================
    const LuxuryTamonBSideRuntime = {
        activePetElement: null,
        petClickHandler: null,
        documentPointerHandler: null,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);

            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => {
                window.clearTimeout(timer);
            });
            this.timers.clear();
        },

        clear() {
            if (
                this.activePetElement &&
                this.petClickHandler
            ) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentPointerHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentPointerHandler,
                    true
                );
                document.removeEventListener(
                    'click',
                    this.documentPointerHandler,
                    true
                );
            }

            this.clearTimers();

            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentPointerHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'tamon-bside-equipped'
            );

            document.body?.classList.remove(
                'theme-tamon-bside-stage'
            );

            document
                .querySelectorAll(
                    '.tamon-bside-world,' +
                    '.tamon-bside-ui-frame,' +
                    '.tamon-bside-page-click,' +
                    '.tamon-bside-ultimate,' +
                    '.tamon-bside-screen-dialogue'
                )
                .forEach(element => element.remove());

            const container =
                document.getElementById(
                    'virtual-pet-container'
                );

            container?.classList.remove(
                'pet-tamon-bside-stage',
                'tamon-bside-pet-casting'
            );

            container
                ?.querySelectorAll(
                    '.tamon-bside-pet-realm'
                )
                .forEach(element => element.remove());

            const pet =
                container?.querySelector(
                    '#virtual-pet-img'
                );

            pet?.classList.remove(
                'tamon-bside-pet'
            );
        },

        createWorld() {
            document
                .querySelectorAll(
                    '.tamon-bside-world'
                )
                .forEach(element => element.remove());

            const world =
                document.createElement('div');

            world.className =
                'tamon-bside-world';

            world.setAttribute(
                'aria-hidden',
                'true'
            );

            world.innerHTML = `
                <div class="tamon-bside-world-wash"></div>
                <div class="tamon-bside-world-grid"></div>

                <div class="tamon-bside-vinyl vinyl-left">
                    <i></i><b></b><span></span>
                </div>

                <div class="tamon-bside-vinyl vinyl-right">
                    <i></i><b></b><span></span>
                </div>

                <div class="tamon-bside-world-wave wave-a"></div>
                <div class="tamon-bside-world-wave wave-b"></div>
                <div class="tamon-bside-world-wave wave-c"></div>

                <div class="tamon-bside-world-stars"></div>
                <div class="tamon-bside-world-eq"></div>
                <div class="tamon-bside-world-glints"></div>
            `;

            const reduced =
                window.matchMedia?.(
                    '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
                ).matches;

            const starField =
                world.querySelector(
                    '.tamon-bside-world-stars'
                );

            const eqField =
                world.querySelector(
                    '.tamon-bside-world-eq'
                );

            const glintField =
                world.querySelector(
                    '.tamon-bside-world-glints'
                );

            const starCount = getLuxuryQualityCount(reduced ? 18 : 42);
            const eqCount = getLuxuryQualityCount(reduced ? 14 : 28);
            const glintCount = getLuxuryQualityCount(reduced ? 7 : 15);

            for (
                let index = 0;
                index < starCount;
                index++
            ) {
                const star =
                    document.createElement('span');

                star.className =
                    index % 6 === 0
                        ? 'tamon-bside-world-star is-star'
                        : 'tamon-bside-world-star';

                star.textContent =
                    index % 6 === 0
                        ? '✦'
                        : '';

                star.style.setProperty(
                    '--tb-x',
                    `${(index * 47 + 9) % 97}%`
                );

                star.style.setProperty(
                    '--tb-y',
                    `${(index * 71 + 13) % 93}%`
                );

                star.style.setProperty(
                    '--tb-size',
                    `${1.5 + (index % 5) * .85}px`
                );

                star.style.setProperty(
                    '--tb-delay',
                    `${-(index % 11) * .43}s`
                );

                starField?.appendChild(star);
            }

            for (
                let index = 0;
                index < eqCount;
                index++
            ) {
                const bar =
                    document.createElement('i');

                bar.style.setProperty(
                    '--tb-eq-i',
                    index
                );

                bar.style.setProperty(
                    '--tb-eq-h',
                    `${24 + ((index * 17) % 72)}px`
                );

                bar.style.setProperty(
                    '--tb-eq-delay',
                    `${-(index % 9) * .16}s`
                );

                eqField?.appendChild(bar);
            }

            for (
                let index = 0;
                index < glintCount;
                index++
            ) {
                const glint =
                    document.createElement('span');

                glint.style.setProperty(
                    '--tb-gx',
                    `${8 + ((index * 37) % 84)}%`
                );

                glint.style.setProperty(
                    '--tb-gy',
                    `${10 + ((index * 53) % 78)}%`
                );

                glint.style.setProperty(
                    '--tb-gd',
                    `${-(index % 7) * .7}s`
                );

                glintField?.appendChild(glint);
            }

            document.body.appendChild(world);

            requestAnimationFrame(() => {
                world.classList.add('is-mounted');
            });
        },

        createInterface() {
            document
                .querySelectorAll(
                    '.tamon-bside-ui-frame'
                )
                .forEach(element => element.remove());

            const frame =
                document.createElement('div');

            frame.className =
                'tamon-bside-ui-frame';

            frame.setAttribute(
                'aria-hidden',
                'true'
            );

            frame.innerHTML = `
                <div class="tamon-bside-ui-top">
                    <i></i>
                    <div class="tamon-bside-ui-badge">
                        <strong>TAMON</strong>
                        <span>B-SIDE</span>
                    </div>
                    <i></i>
                </div>

                <span class="tamon-bside-ui-corner corner-tl">✦</span>
                <span class="tamon-bside-ui-corner corner-tr">✦</span>
                <span class="tamon-bside-ui-corner corner-bl">✦</span>
                <span class="tamon-bside-ui-corner corner-br">✦</span>

                <div class="tamon-bside-ui-side side-left">
                    <b></b><b></b><b></b><b></b><b></b>
                </div>

                <div class="tamon-bside-ui-side side-right">
                    <b></b><b></b><b></b><b></b><b></b>
                </div>

                <div class="tamon-bside-now-playing">
                    <div class="tamon-bside-now-playing__pulse"></div>
                    <div class="tamon-bside-now-playing__copy">
                        <small>NOW PLAYING</small>
                        <strong>TAMON'S B-SIDE</strong>
                        <span>TRACK 02 · FLIP THE SIDE</span>
                    </div>
                    <div class="tamon-bside-now-playing__eq" aria-hidden="true">
                        <i></i><i></i><i></i><i></i><i></i>
                        <i></i><i></i><i></i><i></i>
                    </div>
                </div>

                <div class="tamon-bside-ui-bottom">
                    <span>01</span>
                    <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                    <strong>PLAY THE OTHER SIDE</strong>
                    <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                    <span>02</span>
                </div>
            `;

            document.body.appendChild(frame);

            requestAnimationFrame(() => {
                frame.classList.add('is-mounted');
            });
        },

        createPetRealm() {
            const container =
                document.getElementById(
                    'virtual-pet-container'
                );

            const pet =
                container?.querySelector(
                    '#virtual-pet-img'
                );

            if (!container || !pet) {
                return;
            }

            container.classList.add(
                'pet-tamon-bside-stage'
            );

            pet.classList.add(
                'tamon-bside-pet'
            );

            container
                .querySelectorAll(
                    '.tamon-bside-pet-realm'
                )
                .forEach(element => element.remove());

            const realm =
                document.createElement('div');

            realm.className =
                'tamon-bside-pet-realm';

            realm.setAttribute(
                'aria-hidden',
                'true'
            );

            realm.innerHTML = `
                <span class="tamon-bside-pet-halo"></span>
                <span class="tamon-bside-pet-disc disc-a"></span>
                <span class="tamon-bside-pet-disc disc-b"></span>
                <span class="tamon-bside-pet-orbit orbit-a"><i>★</i></span>
                <span class="tamon-bside-pet-orbit orbit-b"><i>✦</i></span>
                <span class="tamon-bside-pet-wave wave-a"></span>
                <span class="tamon-bside-pet-wave wave-b"></span>
                <span class="tamon-bside-pet-eq"></span>
            `;

            const eq =
                realm.querySelector(
                    '.tamon-bside-pet-eq'
                );

            for (
                let index = 0;
                index < 13;
                index++
            ) {
                const bar =
                    document.createElement('i');

                bar.style.setProperty(
                    '--tb-pet-i',
                    index
                );

                bar.style.setProperty(
                    '--tb-pet-delay',
                    `${-(index % 7) * .13}s`
                );

                eq?.appendChild(bar);
            }

            container.insertBefore(
                realm,
                pet
            );

            this.installPetSkill(
                pet,
                container
            );
        },

        installPetSkill(pet, container) {
            if (!pet || !container) {
                return;
            }

            this.activePetElement = pet;

            this.petClickHandler = event => {
                if (this.skillLocked) {
                    return;
                }

                if (
                    !document.documentElement.classList.contains(
                        'tamon-bside-equipped'
                    )
                ) {
                    return;
                }

                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) {
                    return;
                }

                event.stopPropagation();

                const rect =
                    pet.getBoundingClientRect();

                const x =
                    Number.isFinite(event.clientX) &&
                    event.clientX > 0
                        ? event.clientX
                        : rect.left + rect.width / 2;

                const y =
                    Number.isFinite(event.clientY) &&
                    event.clientY > 0
                        ? event.clientY
                        : rect.top + rect.height / 2;

                this.skillLocked = true;

                container.classList.add(
                    'tamon-bside-pet-casting'
                );

                this.createPageClick(
                    x,
                    y,
                    true
                );

                this.createUltimate(
                    x,
                    y,
                    container
                );

                this.setTimer(() => {
                    this.skillLocked = false;
                    container.classList.remove(
                        'tamon-bside-pet-casting'
                    );
                }, 5200);
            };

            pet.addEventListener(
                'click',
                this.petClickHandler
            );
        },

        installGlobalClick() {
            this.documentPointerHandler = event => {
                if (
                    !document.documentElement.classList.contains(
                        'tamon-bside-equipped'
                    )
                ) {
                    return;
                }

                const target = event.target;

                /*
                 * Click đúng Tamon:
                 * chạy skill ngay ở capture phase để không bị drag/click
                 * handler khác nuốt mất sự kiện. petClickHandler có khóa
                 * skill nên listener bubble phía sau không thể chạy lặp.
                 */
                if (
                    target instanceof Element &&
                    target.closest(
                        '#virtual-pet-container'
                    )
                ) {
                    const pet =
                        target.closest('#virtual-pet-img') ||
                        document.querySelector(
                            '#virtual-pet-container #virtual-pet-img.tamon-bside-pet'
                        );

                    if (
                        pet &&
                        typeof this.petClickHandler === 'function'
                    ) {
                        this.petClickHandler(event);
                    }

                    return;
                }

                if (
                    target instanceof Element &&
                    target.closest(
                        '.ui-theme-immune, ' +
                        '[data-theme-immune="true"]'
                    )
                ) {
                    return;
                }

                const x =
                    Number.isFinite(event.clientX)
                        ? event.clientX
                        : window.innerWidth / 2;

                const y =
                    Number.isFinite(event.clientY)
                        ? event.clientY
                        : window.innerHeight / 2;

                this.createPageClick(x, y, false);
            };

            document.addEventListener(
                'click',
                this.documentPointerHandler,
                true
            );
        },

        createPageClick(x, y, strong = false) {
            const burst =
                document.createElement('div');

            burst.className =
                'tamon-bside-page-click' +
                (strong ? ' is-strong' : '');

            burst.style.setProperty(
                '--tb-click-x',
                `${x}px`
            );

            burst.style.setProperty(
                '--tb-click-y',
                `${y}px`
            );

            burst.innerHTML = `
                <i class="ring ring-a"></i>
                <i class="ring ring-b"></i>
                <b class="spark spark-a">✦</b>
                <b class="spark spark-b">★</b>
                <b class="spark spark-c">✦</b>
                <span class="beat beat-a"></span>
                <span class="beat beat-b"></span>
                <span class="beat beat-c"></span>
            `;

            document.body.appendChild(burst);

            requestAnimationFrame(() => {
                burst.classList.add('is-active');
            });

            this.setTimer(() => {
                burst.remove();
            }, strong ? 1350 : 900);
        },

        createUltimate(x, y, container) {
            document
                .querySelectorAll(
                    '.tamon-bside-ultimate,' +
                    '.tamon-bside-screen-dialogue'
                )
                .forEach(element => element.remove());

            const ultimate =
                document.createElement('div');

            ultimate.className =
                'tamon-bside-ultimate';

            ultimate.style.setProperty(
                '--tb-ultimate-x',
                `${x}px`
            );

            ultimate.style.setProperty(
                '--tb-ultimate-y',
                `${y}px`
            );

            ultimate.setAttribute(
                'aria-hidden',
                'true'
            );

            ultimate.innerHTML = `
                <div class="tamon-bside-ultimate-flash"></div>
                <div class="tamon-bside-ultimate-shutter shutter-a"></div>
                <div class="tamon-bside-ultimate-shutter shutter-b"></div>

                <div class="tamon-bside-ultimate-disc">
                    <i class="ring ring-a"></i>
                    <i class="ring ring-b"></i>
                    <i class="ring ring-c"></i>
                    <b></b>
                    <strong>B</strong>
                </div>

                <div class="tamon-bside-ultimate-spectrum"></div>
                <div class="tamon-bside-ultimate-stars"></div>
                <div class="tamon-bside-ultimate-scan"></div>
            `;

            const spectrum =
                ultimate.querySelector(
                    '.tamon-bside-ultimate-spectrum'
                );

            for (
                let index = 0;
                index < 36;
                index++
            ) {
                const bar =
                    document.createElement('i');

                bar.style.setProperty(
                    '--tb-u-i',
                    index
                );

                bar.style.setProperty(
                    '--tb-u-delay',
                    `${-(index % 12) * .07}s`
                );

                spectrum?.appendChild(bar);
            }

            const stars =
                ultimate.querySelector(
                    '.tamon-bside-ultimate-stars'
                );

            for (
                let index = 0;
                index < 24;
                index++
            ) {
                const star =
                    document.createElement('i');

                star.textContent =
                    index % 3 === 0
                        ? '★'
                        : '✦';

                star.style.setProperty(
                    '--tb-u-angle',
                    `${index * 15}deg`
                );

                star.style.setProperty(
                    '--tb-u-angle-neg',
                    `${index * -15}deg`
                );

                star.style.setProperty(
                    '--tb-u-distance',
                    `${120 + (index % 6) * 28}px`
                );

                star.style.setProperty(
                    '--tb-u-delay',
                    `${(index % 8) * .035}s`
                );

                stars?.appendChild(star);
            }

            const dialogue =
                document.createElement('div');

            dialogue.className =
                'tamon-bside-screen-dialogue';

            dialogue.innerHTML = `
                <span>NOW PLAYING</span>
                <strong>TAMON'S B-SIDE</strong>
                <small>FLIP THE TRACK · BREAK THE FRAME</small>
            `;

            document.body.append(
                ultimate,
                dialogue
            );

            requestAnimationFrame(() => {
                ultimate.classList.add('is-active');
                dialogue.classList.add('is-active');
            });

            this.setTimer(() => {
                ultimate.classList.add('is-climax');
            }, 700);

            this.setTimer(() => {
                dialogue.classList.add('is-visible');
            }, 780);

            this.setTimer(() => {
                ultimate.classList.add('is-ending');
                dialogue.classList.add('is-ending');
            }, 3900);

            this.setTimer(() => {
                ultimate.remove();
                dialogue.remove();
                container?.classList.remove(
                    'tamon-bside-pet-casting'
                );
            }, 5000);
        },

        mount() {
            this.clear();
            ensureTamonBSideStylesheet();

            document.documentElement.classList.add(
                'tamon-bside-equipped'
            );

            document.body?.classList.add(
                'theme-tamon-bside-stage'
            );

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();

            /*
             * Một số trang gọi render/spawn liên tiếp trong cùng frame.
             * Tự kiểm tra lại để world / HUD / pet realm không bị render
             * tiếp theo xóa mất.
             */
            const repairMount = () => {
                if (
                    !document.documentElement.classList.contains(
                        'tamon-bside-equipped'
                    )
                ) {
                    return;
                }

                if (!document.querySelector('.tamon-bside-world')) {
                    this.createWorld();
                }

                if (!document.querySelector('.tamon-bside-ui-frame')) {
                    this.createInterface();
                }

                const pet =
                    document.querySelector(
                        '#virtual-pet-container #virtual-pet-img'
                    );

                if (
                    pet &&
                    !document.querySelector(
                        '#virtual-pet-container .tamon-bside-pet-realm'
                    )
                ) {
                    this.createPetRealm();
                }
            };

            this.setTimer(repairMount, 120);
            this.setTimer(repairMount, 520);
            this.setTimer(repairMount, 1200);
        }
    };



    // ========================================================
    // TAMON · HẮC PHẤN NGHỊCH NHỊP · FULL PREMIUM RUNTIME V1
    // Namespace mới: tamon-pinkstatic-*
    // Concept: cassette / sticker / scanline / black-pink backstage.
    // Không gọi ThemeManager / EffectManager và không dùng tamon-bside-*.
    // ========================================================
    const LuxuryTamonPinkStaticRuntime = {
        activePetElement: null,
        petClickHandler: null,
        documentClickHandler: null,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        clear() {
            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentClickHandler) {
                document.removeEventListener(
                    'click',
                    this.documentClickHandler,
                    true
                );
            }

            this.clearTimers();
            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentClickHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'tamon-pinkstatic-equipped'
            );
            document.body?.classList.remove(
                'theme-tamon-pinkstatic-stage'
            );

            document
                .querySelectorAll(
                    '.tamon-pinkstatic-world,' +
                    '.tamon-pinkstatic-ui,' +
                    '.tamon-pinkstatic-click,' +
                    '.tamon-pinkstatic-ultimate,' +
                    '.tamon-pinkstatic-dialogue'
                )
                .forEach(node => node.remove());

            const container = document.getElementById(
                'virtual-pet-container'
            );

            container?.classList.remove(
                'pet-tamon-pinkstatic-stage',
                'tamon-pinkstatic-casting'
            );

            container
                ?.querySelectorAll('.tamon-pinkstatic-realm')
                .forEach(node => node.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('tamon-pinkstatic-pet');
        },

        createWorld() {
            document
                .querySelectorAll('.tamon-pinkstatic-world')
                .forEach(node => node.remove());

            const world = document.createElement('div');
            world.className = 'tamon-pinkstatic-world';
            world.setAttribute('aria-hidden', 'true');
            world.innerHTML = `
                <div class="tamon-pinkstatic-wash"></div>
                <div class="tamon-pinkstatic-dotgrid"></div>
                <div class="tamon-pinkstatic-scanlines"></div>
                <div class="tamon-pinkstatic-tape tape-a"></div>
                <div class="tamon-pinkstatic-tape tape-b"></div>
                <div class="tamon-pinkstatic-tape tape-c"></div>
                <div class="tamon-pinkstatic-cassette-mark">
                    <span class="reel reel-a"></span>
                    <span class="reel reel-b"></span>
                    <i></i>
                </div>
                <div class="tamon-pinkstatic-world-particles"></div>
                <div class="tamon-pinkstatic-world-spectrum"></div>
            `;

            const reduced = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
            ).matches;

            const particleField = world.querySelector(
                '.tamon-pinkstatic-world-particles'
            );
            const particleCount = getLuxuryQualityCount(reduced ? 18 : 44);

            for (let index = 0; index < particleCount; index++) {
                const particle = document.createElement('span');
                particle.className =
                    index % 7 === 0
                        ? 'is-sticker'
                        : index % 3 === 0
                            ? 'is-dash'
                            : 'is-dot';
                particle.textContent =
                    index % 7 === 0
                        ? (index % 14 === 0 ? '★' : '✦')
                        : '';
                particle.style.setProperty(
                    '--ps-x',
                    `${(index * 37 + 9) % 96}%`
                );
                particle.style.setProperty(
                    '--ps-y',
                    `${(index * 61 + 13) % 92}%`
                );
                particle.style.setProperty(
                    '--ps-delay',
                    `${-(index % 13) * .43}s`
                );
                particle.style.setProperty(
                    '--ps-drift',
                    `${22 + (index % 8) * 9}px`
                );
                particleField?.appendChild(particle);
            }

            const spectrum = world.querySelector(
                '.tamon-pinkstatic-world-spectrum'
            );
            const bars = reduced ? 18 : 42;
            for (let index = 0; index < bars; index++) {
                const bar = document.createElement('i');
                bar.style.setProperty(
                    '--ps-bar-delay',
                    `${-(index % 11) * .07}s`
                );
                bar.style.setProperty(
                    '--ps-bar-height',
                    `${18 + (index * 17) % 72}%`
                );
                spectrum?.appendChild(bar);
            }

            document.body.appendChild(world);
            requestAnimationFrame(() => world.classList.add('is-active'));
        },

        createInterface() {
            document
                .querySelectorAll('.tamon-pinkstatic-ui')
                .forEach(node => node.remove());

            const ui = document.createElement('div');
            ui.className = 'tamon-pinkstatic-ui';
            ui.setAttribute('aria-hidden', 'true');
            ui.innerHTML = `
                <div class="tamon-pinkstatic-ui-top">
                    <span>TRACK 03</span>
                    <i></i>
                    <strong>TAMON // B-SIDE</strong>
                    <i></i>
                    <span>PINK STATIC</span>
                </div>
                <div class="tamon-pinkstatic-ui-corner corner-tl">✦</div>
                <div class="tamon-pinkstatic-ui-corner corner-tr">03</div>
                <div class="tamon-pinkstatic-ui-corner corner-bl">SIDE B</div>
                <div class="tamon-pinkstatic-ui-corner corner-br">★</div>
                <div class="tamon-pinkstatic-nowplaying">
                    <div class="tamon-pinkstatic-nowplaying-disc">
                        <i></i>
                    </div>
                    <div class="tamon-pinkstatic-nowplaying-copy">
                        <small>NOW PLAYING</small>
                        <strong>HẮC PHẤN NGHỊCH NHỊP</strong>
                        <span>CASSETTE 03 · PINK STATIC</span>
                    </div>
                    <div class="tamon-pinkstatic-nowplaying-eq">
                        <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                    </div>
                </div>
            `;

            document.body.appendChild(ui);
            requestAnimationFrame(() => ui.classList.add('is-active'));
        },

        createPetRealm() {
            const container = document.getElementById(
                'virtual-pet-container'
            );
            const pet = container?.querySelector('#virtual-pet-img');
            if (!container || !pet) return;

            container
                .querySelectorAll('.tamon-pinkstatic-realm')
                .forEach(node => node.remove());

            container.classList.add('pet-tamon-pinkstatic-stage');
            pet.classList.add('tamon-pinkstatic-pet');
            pet.setAttribute('draggable', 'false');

            const realm = document.createElement('div');
            realm.className = 'tamon-pinkstatic-realm';
            realm.setAttribute('aria-hidden', 'true');
            realm.innerHTML = `
                <div class="tamon-pinkstatic-realm-glow"></div>
                <div class="tamon-pinkstatic-realm-cassette">
                    <span class="reel reel-a"><i></i></span>
                    <span class="reel reel-b"><i></i></span>
                    <b>SIDE B</b>
                </div>
                <div class="tamon-pinkstatic-realm-orbit orbit-a"><i>★</i></div>
                <div class="tamon-pinkstatic-realm-orbit orbit-b"><i>✦</i></div>
                <div class="tamon-pinkstatic-realm-wave wave-a"></div>
                <div class="tamon-pinkstatic-realm-wave wave-b"></div>
                <div class="tamon-pinkstatic-realm-eq">
                    <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                </div>
                <div class="tamon-pinkstatic-realm-stickers">
                    <span>★</span><span>03</span><span>✦</span><span>B</span>
                </div>
            `;

            container.insertBefore(realm, pet);
            this.activePetElement = pet;

            this.petClickHandler = event => {
                if (event?.__tamonPinkStaticHandled) {
                    return;
                }
                if (event) {
                    event.__tamonPinkStaticHandled = true;
                }
                event?.stopPropagation?.();
                const rect = pet.getBoundingClientRect();
                const x = Number.isFinite(event?.clientX)
                    ? event.clientX
                    : rect.left + rect.width / 2;
                const y = Number.isFinite(event?.clientY)
                    ? event.clientY
                    : rect.top + rect.height / 2;

                this.createPageClick(x, y, true);
                this.triggerUltimate(x, y);
            };

            pet.addEventListener('click', this.petClickHandler);
        },

        installGlobalClick() {
            this.documentClickHandler = event => {
                if (!document.documentElement.classList.contains(
                    'tamon-pinkstatic-equipped'
                )) {
                    return;
                }

                const target = event.target;

                if (
                    target instanceof Element &&
                    target.closest('#virtual-pet-container')
                ) {
                    const pet = target.closest('#virtual-pet-img') ||
                        document.querySelector(
                            '#virtual-pet-container #virtual-pet-img.tamon-pinkstatic-pet'
                        );
                    if (pet && typeof this.petClickHandler === 'function') {
                        this.petClickHandler(event);
                    }
                    return;
                }

                if (
                    target instanceof Element &&
                    target.closest(
                        '.ui-theme-immune, [data-theme-immune="true"]'
                    )
                ) {
                    return;
                }

                const x = Number.isFinite(event.clientX)
                    ? event.clientX
                    : window.innerWidth / 2;
                const y = Number.isFinite(event.clientY)
                    ? event.clientY
                    : window.innerHeight / 2;
                this.createPageClick(x, y, false);
            };

            document.addEventListener(
                'click',
                this.documentClickHandler,
                true
            );
        },

        createPageClick(x, y, strong = false) {
            const click = document.createElement('div');
            click.className =
                'tamon-pinkstatic-click' +
                (strong ? ' is-strong' : '');
            click.style.left = `${x}px`;
            click.style.top = `${y}px`;
            click.innerHTML = `
                <i class="ring ring-a"></i>
                <i class="ring ring-b"></i>
                <span class="spark spark-a">✦</span>
                <span class="spark spark-b">★</span>
                <span class="note">B</span>
            `;
            document.body.appendChild(click);
            this.setTimer(() => click.remove(), strong ? 1050 : 720);
        },

        triggerUltimate(x, y) {
            if (this.skillLocked) return;
            this.skillLocked = true;

            document
                .querySelectorAll(
                    '.tamon-pinkstatic-ultimate, .tamon-pinkstatic-dialogue'
                )
                .forEach(node => node.remove());

            const ultimate = document.createElement('div');
            ultimate.className = 'tamon-pinkstatic-ultimate';
            ultimate.setAttribute('aria-hidden', 'true');
            ultimate.style.setProperty('--ps-ux', `${x}px`);
            ultimate.style.setProperty('--ps-uy', `${y}px`);
            ultimate.innerHTML = `
                <div class="tamon-pinkstatic-ultimate-blackout"></div>
                <div class="tamon-pinkstatic-ultimate-flash"></div>
                <div class="tamon-pinkstatic-ultimate-grid"></div>
                <div class="tamon-pinkstatic-ultimate-cassette">
                    <span class="reel reel-a"><i></i></span>
                    <span class="reel reel-b"><i></i></span>
                    <strong>B</strong>
                </div>
                <div class="tamon-pinkstatic-ultimate-rings">
                    <i></i><i></i><i></i><i></i>
                </div>
                <div class="tamon-pinkstatic-ultimate-spectrum"></div>
                <div class="tamon-pinkstatic-ultimate-stickers"></div>
            `;

            const spectrum = ultimate.querySelector(
                '.tamon-pinkstatic-ultimate-spectrum'
            );
            for (let index = 0; index < 36; index++) {
                const bar = document.createElement('i');
                bar.style.setProperty(
                    '--ps-u-delay',
                    `${-(index % 9) * .055}s`
                );
                spectrum?.appendChild(bar);
            }

            const stickers = ultimate.querySelector(
                '.tamon-pinkstatic-ultimate-stickers'
            );
            const glyphs = ['★', '✦', 'B', '03', 'SIDE', 'PLAY', '★', '✧'];
            for (let index = 0; index < 24; index++) {
                const sticker = document.createElement('span');
                sticker.textContent = glyphs[index % glyphs.length];
                sticker.style.setProperty(
                    '--ps-u-angle',
                    `${index * 15}deg`
                );
                sticker.style.setProperty(
                    '--ps-u-distance',
                    `${105 + (index % 6) * 38}px`
                );
                sticker.style.setProperty(
                    '--ps-u-delay',
                    `${index * .018}s`
                );
                stickers?.appendChild(sticker);
            }

            const dialogue = document.createElement('div');
            dialogue.className = 'tamon-pinkstatic-dialogue';
            dialogue.innerHTML = `
                <span>BEAT DROP // SIDE B</span>
                <strong>HẮC PHẤN NGHỊCH NHỊP</strong>
                <small>FLIP THE TAPE · BREAK THE QUIET</small>
            `;

            document.body.append(ultimate, dialogue);
            requestAnimationFrame(() => {
                ultimate.classList.add('is-active');
                dialogue.classList.add('is-active');
            });

            this.setTimer(() => ultimate.classList.add('is-climax'), 620);
            this.setTimer(() => dialogue.classList.add('is-visible'), 700);
            this.setTimer(() => {
                ultimate.classList.add('is-ending');
                dialogue.classList.add('is-ending');
            }, 2600);
            this.setTimer(() => {
                ultimate.remove();
                dialogue.remove();
                this.skillLocked = false;
            }, 3400);
        },

        mount() {
            this.clear();
            ensureTamonPinkStaticStylesheet();

            document.documentElement.classList.add(
                'tamon-pinkstatic-equipped'
            );
            document.body?.classList.add(
                'theme-tamon-pinkstatic-stage'
            );

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();

            const repair = () => {
                if (!document.documentElement.classList.contains(
                    'tamon-pinkstatic-equipped'
                )) {
                    return;
                }
                if (!document.querySelector('.tamon-pinkstatic-world')) {
                    this.createWorld();
                }
                if (!document.querySelector('.tamon-pinkstatic-ui')) {
                    this.createInterface();
                }
                const pet = document.querySelector(
                    '#virtual-pet-container #virtual-pet-img'
                );
                if (
                    pet &&
                    !document.querySelector(
                        '#virtual-pet-container .tamon-pinkstatic-realm'
                    )
                ) {
                    this.createPetRealm();
                }
            };

            this.setTimer(repair, 120);
            this.setTimer(repair, 520);
            this.setTimer(repair, 1200);
        }
    };



    // ========================================================
    // AETHER · CSS LAZY GUARD
    // Một CSS duy nhất cho card + pet + full-web suite.
    // ========================================================
    function ensureAetherStylesheet() {
        const existing = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).find(link =>
            /(?:^|\/)aether-than-thoai(?:\(\d+\))?\.css(?:[?#].*)?$/i
                .test(link.href || '')
        );

        if (existing) {
            existing.id = existing.id || 'aether-mythic-premium-style';
            return existing;
        }

        const byId = document.getElementById(
            'aether-mythic-premium-style'
        );
        if (byId) return byId;

        let href = '';

        if (window.AETHER_MYTHIC_CSS_PATH) {
            href = String(window.AETHER_MYTHIC_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script =>
                    /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i
                        .test(script.src || '')
                );

            if (ownScript?.src) {
                try {
                    href = new URL(
                        '../css/aether-than-thoai.css?v=20260917.aether-v1',
                        ownScript.src
                    ).href;
                } catch (_) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL(
                'css/aether-than-thoai.css?v=20260917.aether-v1',
                document.baseURI
            ).href;
        }

        const link = document.createElement('link');
        link.id = 'aether-mythic-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.aetherMythic = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[AETHER] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/aether-than-thoai.css hoặc gán window.AETHER_MYTHIC_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
        return link;
    }

    // ========================================================
    // AETHER · THIÊN QUANG NGUYÊN SƠ — FULL PREMIUM SUITE V1
    // JS chỉ dựng DOM/lifecycle. Toàn bộ giao diện nằm trong 1 CSS.
    // Namespace độc lập: aether-mythic-* / aetherLuminous*
    // ========================================================
    const LuxuryAetherRuntime = {
        activePetElement: null,
        petClickHandler: null,
        petPointerDownHandler: null,
        petPointerUpHandler: null,
        petKeyHandler: null,
        petPointerState: null,
        documentPointerHandler: null,
        timers: new Set(),
        skillLocked: false,

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container #virtual-pet-img.mythic-aether-luminous-magic, ' +
                '#virtual-pet-container #virtual-pet-img.aether-mythic-avatar'
            );
        },

        clear() {
            const oldPet = this.activePetElement;
            if (oldPet) {
                if (this.petClickHandler) {
                    oldPet.removeEventListener('click', this.petClickHandler);
                }
                if (this.petPointerDownHandler) {
                    oldPet.removeEventListener('pointerdown', this.petPointerDownHandler);
                }
                if (this.petPointerUpHandler) {
                    oldPet.removeEventListener('pointerup', this.petPointerUpHandler);
                }
                if (this.petKeyHandler) {
                    oldPet.removeEventListener('keydown', this.petKeyHandler);
                }
            }

            if (this.documentPointerHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentPointerHandler,
                    true
                );
            }

            this.clearTimers();
            this.activePetElement = null;
            this.petClickHandler = null;
            this.petPointerDownHandler = null;
            this.petPointerUpHandler = null;
            this.petKeyHandler = null;
            this.petPointerState = null;
            this.documentPointerHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'aether-luminous-equipped',
                'aether-luminous-skill-active'
            );
            document.body?.classList.remove(
                'theme-aether-luminous-stage'
            );

            document
                .querySelectorAll(
                    '.aether-mythic-world,' +
                    '.aether-mythic-ui-frame,' +
                    '.aether-mythic-page-click,' +
                    '.aether-mythic-screen-burst,' +
                    '.aether-mythic-screen-dialogue'
                )
                .forEach(node => node.remove());

            const container = document.getElementById(
                'virtual-pet-container'
            );

            container?.classList.remove(
                'pet-aether-mythic-stage',
                'aether-mythic-awakening',
                'aether-mythic-casting',
                'aether-mythic-pressed'
            );

            container
                ?.querySelectorAll('.aether-mythic-pet-realm')
                .forEach(node => node.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('aether-mythic-avatar');
        },

        createWorld() {
            document
                .querySelectorAll('.aether-mythic-world')
                .forEach(node => node.remove());

            const world = document.createElement('div');
            world.className = 'aether-mythic-world';
            world.setAttribute('aria-hidden', 'true');
            world.innerHTML = `
                <div class="aether-world-wash"></div>
                <div class="aether-world-nebula nebula-a"></div>
                <div class="aether-world-nebula nebula-b"></div>
                <div class="aether-world-sun">
                    <span class="aether-world-sun-core"></span>
                    <span class="aether-world-sun-ring ring-a"></span>
                    <span class="aether-world-sun-ring ring-b"></span>
                    <span class="aether-world-sun-ring ring-c"></span>
                    <span class="aether-world-sun-ring ring-d"></span>
                </div>
                <div class="aether-world-aurora aurora-a"></div>
                <div class="aether-world-aurora aurora-b"></div>
                <div class="aether-world-rays"></div>
                <div class="aether-world-constellation"></div>
                <div class="aether-world-meteors"></div>
                <div class="aether-world-particles"></div>
                <div class="aether-world-horizon"></div>
            `;

            const reduced = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
            ).matches;

            const particleField = world.querySelector('.aether-world-particles');
            const particleCount = getLuxuryQualityCount(reduced ? 18 : 52);
            for (let index = 0; index < particleCount; index++) {
                const particle = document.createElement('i');
                particle.className =
                    index % 6 === 0
                        ? 'aether-world-particle is-star'
                        : 'aether-world-particle';
                particle.textContent = index % 6 === 0 ? '✦' : '';
                particle.style.setProperty('--aether-x', `${(index * 37 + 11) % 100}%`);
                particle.style.setProperty('--aether-y', `${(index * 61 + 7) % 100}%`);
                particle.style.setProperty('--aether-size', `${2 + (index % 5)}px`);
                particle.style.setProperty('--aether-delay', `${-(index % 17) * .37}s`);
                particleField?.appendChild(particle);
            }

            const constellation = world.querySelector('.aether-world-constellation');
            const constellationCount = getLuxuryQualityCount(reduced ? 9 : 20);
            for (let index = 0; index < constellationCount; index++) {
                const node = document.createElement('i');
                node.style.setProperty('--aether-cx', `${7 + ((index * 29) % 86)}%`);
                node.style.setProperty('--aether-cy', `${8 + ((index * 47) % 74)}%`);
                node.style.setProperty('--aether-cdelay', `${-index * .31}s`);
                constellation?.appendChild(node);
            }

            const meteors = world.querySelector('.aether-world-meteors');
            const meteorCount = getLuxuryQualityCount(reduced ? 3 : 7);
            for (let index = 0; index < meteorCount; index++) {
                const meteor = document.createElement('i');
                meteor.style.setProperty('--aether-mx', `${10 + ((index * 17) % 78)}%`);
                meteor.style.setProperty('--aether-my', `${4 + ((index * 23) % 48)}%`);
                meteor.style.setProperty('--aether-mdelay', `${-index * 1.7}s`);
                meteors?.appendChild(meteor);
            }

            document.body.appendChild(world);
        },

        createInterface() {
            document
                .querySelectorAll('.aether-mythic-ui-frame')
                .forEach(node => node.remove());

            const frame = document.createElement('div');
            frame.className = 'aether-mythic-ui-frame';
            frame.setAttribute('aria-hidden', 'true');
            frame.innerHTML = `
                <span class="aether-ui-corner corner-tl"></span>
                <span class="aether-ui-corner corner-tr"></span>
                <span class="aether-ui-corner corner-bl"></span>
                <span class="aether-ui-corner corner-br"></span>
                <div class="aether-ui-top-sigil"><i></i><b>ΑΙΘΗΡ</b><i></i></div>
                <div class="aether-ui-bottom-line"></div>
            `;
            document.body.appendChild(frame);
            requestAnimationFrame(() => frame.classList.add('is-mounted'));
        },

        createPetRealm() {
            const container = document.getElementById(
                'virtual-pet-container'
            );
            const pet = this.getPet() || container?.querySelector(
                '#virtual-pet-img'
            );

            if (!container || !pet) return false;

            container
                .querySelectorAll('.aether-mythic-pet-realm')
                .forEach(node => node.remove());

            pet.classList.add('aether-mythic-avatar');
            pet.setAttribute('draggable', 'false');
            pet.setAttribute('tabindex', '0');
            pet.setAttribute('role', 'button');
            pet.setAttribute('aria-label', 'Kích hoạt Thiên Quang Nguyên Sơ');
            container.classList.add(
                'pet-aether-mythic-stage',
                'aether-mythic-awakening'
            );

            const realm = document.createElement('div');
            realm.className = 'aether-mythic-pet-realm';
            realm.setAttribute('aria-hidden', 'true');
            realm.innerHTML = `
                <span class="aether-local-sanctum"></span>
                <span class="aether-local-aura aura-back"></span>
                <span class="aether-local-aura aura-front"></span>
                <span class="aether-local-halo"></span>
                <span class="aether-local-crown">✦</span>
                <span class="aether-local-ring ring-a"></span>
                <span class="aether-local-ring ring-b"></span>
                <span class="aether-local-ring ring-c"></span>
                <span class="aether-local-ring ring-d"></span>
                <span class="aether-local-sigil sigil-a"></span>
                <span class="aether-local-sigil sigil-b"></span>
                <span class="aether-local-wing wing-left"></span>
                <span class="aether-local-wing wing-right"></span>
                <span class="aether-local-ribbon ribbon-a"></span>
                <span class="aether-local-ribbon ribbon-b"></span>
                <div class="aether-local-runes"></div>
                <div class="aether-local-feathers"></div>
                <div class="aether-local-stars"></div>
                <span class="aether-local-ground"></span>
                <span class="aether-local-ground-ring ground-a"></span>
                <span class="aether-local-ground-ring ground-b"></span>
            `;

            const stars = realm.querySelector('.aether-local-stars');
            const starCount = getLuxuryQualityCount(24);
            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('i');
                star.textContent = index % 4 === 0 ? '✦' : '·';
                star.style.setProperty('--aether-local-angle', `${index * (360 / starCount)}deg`);
                star.style.setProperty('--aether-local-delay', `${-index * .13}s`);
                star.style.setProperty('--aether-local-radius', `${92 + (index % 4) * 14}px`);
                stars?.appendChild(star);
            }

            const runes = realm.querySelector('.aether-local-runes');
            const runeChars = ['✦', '✧', '◇', '⋆', '✶', '✷', '✹', '✺', '✦', '◇'];
            runeChars.forEach((char, index) => {
                const rune = document.createElement('i');
                rune.textContent = char;
                rune.style.setProperty('--aether-rune-angle', `${index * 36}deg`);
                rune.style.setProperty('--aether-rune-delay', `${-index * .21}s`);
                runes?.appendChild(rune);
            });

            const feathers = realm.querySelector('.aether-local-feathers');
            const featherCount = getLuxuryQualityCount(12);
            for (let index = 0; index < featherCount; index++) {
                const feather = document.createElement('i');
                feather.style.setProperty('--aether-local-feather-angle', `${index * (360 / featherCount)}deg`);
                feather.style.setProperty('--aether-local-feather-delay', `${-index * .17}s`);
                feathers?.appendChild(feather);
            }

            container.insertBefore(realm, pet);
            return true;
        },

        createPageClick(x, y, strong = false) {
            if (!document.documentElement.classList.contains(
                'aether-luminous-equipped'
            )) return;

            const click = document.createElement('div');
            click.className =
                'aether-mythic-page-click' +
                (strong ? ' is-strong' : '');
            click.style.setProperty('--aether-click-x', `${x}px`);
            click.style.setProperty('--aether-click-y', `${y}px`);
            click.setAttribute('aria-hidden', 'true');
            click.innerHTML = `
                <span class="aether-click-flash"></span>
                <span class="aether-click-core"></span>
                <span class="aether-click-ring ring-a"></span>
                <span class="aether-click-ring ring-b"></span>
                <span class="aether-click-ring ring-c"></span>
                <span class="aether-click-ring ring-d"></span>
                <span class="aether-click-cross cross-a"></span>
                <span class="aether-click-cross cross-b"></span>
                <span class="aether-click-glyph">✦</span>
                <span class="aether-click-starburst"></span>
                <div class="aether-click-orbit-nodes"></div>
                <div class="aether-click-sparks"></div>
            `;

            const sparks = click.querySelector('.aether-click-sparks');
            const sparkCount = getLuxuryQualityCount(strong ? 24 : 16);
            for (let index = 0; index < sparkCount; index++) {
                const spark = document.createElement('i');
                spark.style.setProperty('--aether-click-angle', `${index * (360 / sparkCount)}deg`);
                spark.style.setProperty('--aether-click-distance', `${strong ? 70 + (index % 5) * 10 : 46 + (index % 4) * 8}px`);
                spark.style.setProperty('--aether-click-delay', `${(index % 5) * .018}s`);
                sparks?.appendChild(spark);
            }

            const nodes = click.querySelector('.aether-click-orbit-nodes');
            for (let index = 0; index < 8; index++) {
                const node = document.createElement('i');
                node.style.setProperty('--aether-node-angle', `${index * 45}deg`);
                nodes?.appendChild(node);
            }

            document.body.appendChild(click);
            requestAnimationFrame(() => click.classList.add('is-active'));
            this.setTimer(() => click.remove(), strong ? 1500 : 1050);
        },

        installGlobalClick() {
            this.documentPointerHandler = event => {
                if (
                    event.button !== undefined &&
                    event.button !== 0
                ) return;

                if (!document.documentElement.classList.contains(
                    'aether-luminous-equipped'
                )) return;

                const target = event.target;
                if (
                    target?.closest?.(
                        '.aether-mythic-screen-burst,' +
                        '.aether-mythic-screen-dialogue,' +
                        '.aether-mythic-page-click,' +
                        '#virtual-pet-container'
                    )
                ) return;

                this.createPageClick(
                    Number(event.clientX) || window.innerWidth / 2,
                    Number(event.clientY) || window.innerHeight / 2,
                    false
                );
            };

            document.addEventListener(
                'pointerdown',
                this.documentPointerHandler,
                true
            );
        },

        triggerUltimate(x, y) {
            if (this.skillLocked) return false;
            this.skillLocked = true;

            document.documentElement.classList.add(
                'aether-luminous-skill-active'
            );

            document
                .querySelectorAll(
                    '.aether-mythic-screen-burst,' +
                    '.aether-mythic-screen-dialogue'
                )
                .forEach(node => node.remove());

            const burst = document.createElement('div');
            burst.className = 'aether-mythic-screen-burst';
            burst.style.setProperty('--aether-skill-x', `${x}px`);
            burst.style.setProperty('--aether-skill-y', `${y}px`);
            burst.setAttribute('aria-hidden', 'true');
            burst.innerHTML = `
                <div class="aether-skill-veil"></div>
                <div class="aether-skill-whiteout"></div>
                <div class="aether-skill-rays"></div>
                <div class="aether-skill-mandala">
                    <span class="mandala-ring ring-a"></span>
                    <span class="mandala-ring ring-b"></span>
                    <span class="mandala-ring ring-c"></span>
                    <span class="mandala-star">✦</span>
                </div>
                <div class="aether-skill-heaven-core">
                    <span class="aether-skill-sun"></span>
                    <span class="aether-skill-ring ring-a"></span>
                    <span class="aether-skill-ring ring-b"></span>
                    <span class="aether-skill-ring ring-c"></span>
                    <span class="aether-skill-ring ring-d"></span>
                </div>
                <div class="aether-skill-wings wing-left"></div>
                <div class="aether-skill-wings wing-right"></div>
                <div class="aether-skill-orbit"></div>
                <div class="aether-skill-feathers"></div>
                <div class="aether-skill-comets"></div>
                <div class="aether-skill-shards"></div>
                <div class="aether-skill-stars"></div>
                <div class="aether-skill-horizon"></div>
                <div class="aether-skill-crown">✦ AETHER ✦</div>
            `;

            const feathers = burst.querySelector('.aether-skill-feathers');
            const featherCount = getLuxuryQualityCount(34);
            for (let index = 0; index < featherCount; index++) {
                const feather = document.createElement('i');
                feather.style.setProperty('--aether-feather-angle', `${index * (360 / featherCount)}deg`);
                feather.style.setProperty('--aether-feather-distance', `${150 + (index % 7) * 48}px`);
                feather.style.setProperty('--aether-feather-delay', `${index * .016}s`);
                feathers?.appendChild(feather);
            }

            const stars = burst.querySelector('.aether-skill-stars');
            const starCount = getLuxuryQualityCount(52);
            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('i');
                star.textContent = index % 5 === 0 ? '✦' : '·';
                star.style.setProperty('--aether-star-x', `${(index * 43 + 7) % 100}%`);
                star.style.setProperty('--aether-star-y', `${(index * 71 + 13) % 100}%`);
                star.style.setProperty('--aether-star-delay', `${index * .012}s`);
                stars?.appendChild(star);
            }

            const comets = burst.querySelector('.aether-skill-comets');
            const cometCount = getLuxuryQualityCount(10);
            for (let index = 0; index < cometCount; index++) {
                const comet = document.createElement('i');
                comet.style.setProperty('--aether-comet-x', `${8 + ((index * 17) % 86)}%`);
                comet.style.setProperty('--aether-comet-y', `${5 + ((index * 31) % 55)}%`);
                comet.style.setProperty('--aether-comet-delay', `${index * .12}s`);
                comets?.appendChild(comet);
            }

            const shards = burst.querySelector('.aether-skill-shards');
            const shardCount = getLuxuryQualityCount(28);
            for (let index = 0; index < shardCount; index++) {
                const shard = document.createElement('i');
                shard.style.setProperty('--aether-shard-angle', `${index * (360 / shardCount)}deg`);
                shard.style.setProperty('--aether-shard-distance', `${90 + (index % 6) * 44}px`);
                shard.style.setProperty('--aether-shard-delay', `${index * .018}s`);
                shards?.appendChild(shard);
            }

            const orbit = burst.querySelector('.aether-skill-orbit');
            for (let index = 0; index < 12; index++) {
                const node = document.createElement('i');
                node.textContent = index % 3 === 0 ? '✦' : '◇';
                node.style.setProperty('--aether-skill-node-angle', `${index * 30}deg`);
                orbit?.appendChild(node);
            }

            const dialogue = document.createElement('div');
            dialogue.className = 'aether-mythic-screen-dialogue';
            dialogue.innerHTML = `
                <span>✦</span>
                <div>
                    <small>AETHER · THẦN THOẠI</small>
                    <strong>THIÊN QUANG NGUYÊN SƠ</strong>
                    <em>Thiên quang giáng thế · tinh giới khai môn.</em>
                </div>
                <span>✧</span>
            `;

            document.body.append(burst, dialogue);
            requestAnimationFrame(() => {
                burst.classList.add('is-active');
                dialogue.classList.add('is-active');
            });

            this.setTimer(() => burst.classList.add('is-climax'), 520);
            this.setTimer(() => burst.classList.add('is-apex'), 1180);
            this.setTimer(() => {
                burst.classList.add('is-ending');
                dialogue.classList.add('is-ending');
            }, 3900);
            this.setTimer(() => {
                burst.remove();
                dialogue.remove();
                document.documentElement.classList.remove(
                    'aether-luminous-skill-active'
                );
                this.skillLocked = false;
            }, 5000);

            return true;
        },

        installPetSkill() {
            const pet = this.getPet();
            const container = document.getElementById(
                'virtual-pet-container'
            );
            if (!pet || !container) return false;

            if (this.activePetElement && this.activePetElement !== pet) {
                const oldPet = this.activePetElement;
                if (this.petClickHandler) oldPet.removeEventListener('click', this.petClickHandler);
                if (this.petPointerDownHandler) oldPet.removeEventListener('pointerdown', this.petPointerDownHandler);
                if (this.petPointerUpHandler) oldPet.removeEventListener('pointerup', this.petPointerUpHandler);
                if (this.petKeyHandler) oldPet.removeEventListener('keydown', this.petKeyHandler);
            }

            this.activePetElement = pet;
            let lastPointerUltimateAt = 0;

            const activateAt = (x, y) => {
                if (this.skillLocked) return false;
                container.classList.remove('aether-mythic-casting');
                void container.offsetWidth;
                container.classList.add('aether-mythic-casting');
                this.createPageClick(x, y, true);
                const started = this.triggerUltimate(x, y);
                if (started) {
                    this.setTimer(() => {
                        container.classList.remove('aether-mythic-casting');
                    }, 2300);
                }
                return started;
            };

            this.petPointerDownHandler = event => {
                if (event.button !== undefined && event.button !== 0) return;
                const rect = pet.getBoundingClientRect();
                const x = Number.isFinite(event.clientX) ? event.clientX : rect.left + rect.width / 2;
                const y = Number.isFinite(event.clientY) ? event.clientY : rect.top + rect.height / 2;
                this.petPointerState = {
                    id: event.pointerId,
                    x,
                    y,
                    time: performance.now()
                };
                container.classList.add('aether-mythic-pressed');
                this.createPageClick(x, y, true);
            };

            this.petPointerUpHandler = event => {
                container.classList.remove('aether-mythic-pressed');
                const state = this.petPointerState;
                this.petPointerState = null;
                if (!state) return;
                if (state.id !== undefined && event.pointerId !== undefined && state.id !== event.pointerId) return;

                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) return;

                const x = Number.isFinite(event.clientX) ? event.clientX : state.x;
                const y = Number.isFinite(event.clientY) ? event.clientY : state.y;
                const distance = Math.hypot(x - state.x, y - state.y);
                const duration = performance.now() - state.time;
                if (distance > 18 || duration > 900) return;

                event.preventDefault();
                event.stopPropagation();
                lastPointerUltimateAt = performance.now();
                activateAt(x, y);
            };

            this.petClickHandler = event => {
                if (performance.now() - lastPointerUltimateAt < 500) return;
                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) return;

                event.preventDefault();
                event.stopPropagation();
                const rect = pet.getBoundingClientRect();
                const x = Number.isFinite(event.clientX) && event.clientX > 0
                    ? event.clientX
                    : rect.left + rect.width / 2;
                const y = Number.isFinite(event.clientY) && event.clientY > 0
                    ? event.clientY
                    : rect.top + rect.height / 2;
                activateAt(x, y);
            };

            this.petKeyHandler = event => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                const rect = pet.getBoundingClientRect();
                activateAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
            };

            pet.addEventListener('pointerdown', this.petPointerDownHandler);
            pet.addEventListener('pointerup', this.petPointerUpHandler);
            pet.addEventListener('click', this.petClickHandler);
            pet.addEventListener('keydown', this.petKeyHandler);
            return true;
        },

        repair() {
            if (!document.documentElement.classList.contains(
                'aether-luminous-equipped'
            )) return;

            if (!document.querySelector('.aether-mythic-world')) {
                this.createWorld();
            }
            if (!document.querySelector('.aether-mythic-ui-frame')) {
                this.createInterface();
            }
            if (
                !document.querySelector(
                    '#virtual-pet-container .aether-mythic-pet-realm'
                )
            ) {
                this.createPetRealm();
            }
            if (!this.activePetElement || !this.activePetElement.isConnected) {
                if (this.activePetElement && this.petClickHandler) {
                    this.activePetElement.removeEventListener('click', this.petClickHandler);
                    if (this.petPointerDownHandler) this.activePetElement.removeEventListener('pointerdown', this.petPointerDownHandler);
                    if (this.petPointerUpHandler) this.activePetElement.removeEventListener('pointerup', this.petPointerUpHandler);
                    if (this.petKeyHandler) this.activePetElement.removeEventListener('keydown', this.petKeyHandler);
                }
                this.activePetElement = null;
                this.petClickHandler = null;
                this.petPointerDownHandler = null;
                this.petPointerUpHandler = null;
                this.petKeyHandler = null;
                this.installPetSkill();
            }
        },

        mount() {
            this.clear();
            ensureAetherStylesheet();

            document.documentElement.classList.add(
                'aether-luminous-equipped'
            );
            document.body?.classList.add(
                'theme-aether-luminous-stage'
            );

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installPetSkill();

            [120, 420, 900, 1600].forEach(delay => {
                this.setTimer(() => this.repair(), delay);
            });

            return true;
        }
    };

    // ========================================================
    // NYX · CSS LAZY GUARD
    // - Không tải ở startup nếu NYX không cần.
    // - Chỉ tải khi card NYX cần hiển thị hoặc NYX được mount.
    // - Tránh card rơi về nền trắng khi selective loader đã bỏ
    //   ALL_SPECIAL_STORE_CSS khỏi store-ui.
    // ========================================================
    function ensureNyxStylesheet() {
        const existing = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).find(link =>
            /(?:^|\/)nyx-than-thoai(?:\(\d+\))?\.css(?:[?#].*)?$/i
                .test(link.href || '')
        );

        if (existing) {
            existing.id = existing.id || 'nyx-mythic-premium-style';
            return existing;
        }

        if (document.getElementById('nyx-mythic-premium-style')) {
            return document.getElementById('nyx-mythic-premium-style');
        }

        let href = '';

        if (window.NYX_MYTHIC_CSS_PATH) {
            href = String(window.NYX_MYTHIC_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script =>
                    /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i
                        .test(script.src || '')
                );

            if (ownScript?.src) {
                try {
                    href = new URL(
                        '../css/nyx-than-thoai.css?v=20260915.nyx-card-guard-v1',
                        ownScript.src
                    ).href;
                } catch (_) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL(
                'css/nyx-than-thoai.css?v=20260915.nyx-card-guard-v1',
                document.baseURI
            ).href;
        }

        const link = document.createElement('link');
        link.id = 'nyx-mythic-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.nyxMythic = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[NYX] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/nyx-than-thoai.css hoặc gán window.NYX_MYTHIC_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
        return link;
    }

    // ========================================================
    // NYX · HẮC DẠ NGUYÊN SƠ — FULL PREMIUM SUITE V2
    // WORLD + INTERFACE + GLOBAL CLICK + SCREEN SKILL
    // Pet Realm + ultimate gốc vẫn do PetManager quản lý.
    // Namespace độc lập: nyx-mythic-*
    // ========================================================
    const LuxuryNyxRuntime = {
        activePetElement: null,
        petClickHandler: null,
        documentPointerHandler: null,
        skillLocked: false,

        clear() {
            if (
                this.activePetElement &&
                this.petClickHandler
            ) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentPointerHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentPointerHandler,
                    true
                );
            }

            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentPointerHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'nyx-first-night-equipped'
            );

            document.body?.classList.remove(
                'theme-nyx-first-night'
            );

            document
                .querySelectorAll(
                    '.nyx-mythic-world-v2,' +
                    '.nyx-mythic-ui-frame-v2,' +
                    '.nyx-mythic-page-click,' +
                    '.nyx-mythic-screen-burst-v2,' +
                    '.nyx-mythic-screen-dialogue-v2'
                )
                .forEach(element => element.remove());
        },

        createWorld() {
            document
                .querySelectorAll('.nyx-mythic-world-v2')
                .forEach(element => element.remove());

            const world = document.createElement('div');
            world.className = 'nyx-mythic-world-v2';
            world.setAttribute('aria-hidden', 'true');

            world.innerHTML = `
                <div class="nyx-world-night-wash"></div>
                <div class="nyx-world-nebula nebula-a"></div>
                <div class="nyx-world-nebula nebula-b"></div>
                <div class="nyx-world-nebula nebula-c"></div>

                <div class="nyx-world-eclipse-crown">
                    <span class="nyx-world-eclipse-core"></span>
                    <span class="nyx-world-eclipse-orbit orbit-a"></span>
                    <span class="nyx-world-eclipse-orbit orbit-b"></span>
                    <span class="nyx-world-eclipse-mark">☾</span>
                </div>

                <div class="nyx-world-veil veil-a"></div>
                <div class="nyx-world-veil veil-b"></div>
                <div class="nyx-world-veil veil-c"></div>

                <div class="nyx-world-star-field"></div>
                <div class="nyx-world-dust-field"></div>
                <div class="nyx-world-horizon"></div>
            `;

            const starField = world.querySelector(
                '.nyx-world-star-field'
            );
            const dustField = world.querySelector(
                '.nyx-world-dust-field'
            );

            const reduced = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
            ).matches;

            const starCount = getLuxuryQualityCount(reduced ? 20 : 48);
            const dustCount = getLuxuryQualityCount(reduced ? 10 : 24);

            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('span');
                star.className =
                    index % 7 === 0
                        ? 'nyx-world-star is-cross'
                        : 'nyx-world-star';
                star.textContent = index % 7 === 0 ? '✦' : '';
                star.style.setProperty(
                    '--nyx-wx',
                    `${(index * 47 + 11) % 98}%`
                );
                star.style.setProperty(
                    '--nyx-wy',
                    `${(index * 71 + 7) % 94}%`
                );
                star.style.setProperty(
                    '--nyx-ws',
                    `${1.2 + (index % 5) * .75}px`
                );
                star.style.setProperty(
                    '--nyx-wd',
                    `${-(index % 13) * .37}s`
                );
                star.style.setProperty(
                    '--nyx-wt',
                    `${3.8 + (index % 7) * .55}s`
                );
                starField?.appendChild(star);
            }

            for (let index = 0; index < dustCount; index++) {
                const dust = document.createElement('span');
                dust.className = 'nyx-world-dust';
                dust.style.setProperty(
                    '--nyx-dx',
                    `${(index * 61 + 5) % 100}%`
                );
                dust.style.setProperty(
                    '--nyx-dy',
                    `${(index * 43 + 17) % 100}%`
                );
                dust.style.setProperty(
                    '--nyx-ds',
                    `${8 + (index % 6) * 5}px`
                );
                dust.style.setProperty(
                    '--nyx-dd',
                    `${-(index % 9) * .54}s`
                );
                dustField?.appendChild(dust);
            }

            document.body.appendChild(world);

            requestAnimationFrame(() => {
                world.classList.add('is-mounted');
            });
        },

        createInterface() {
            document
                .querySelectorAll('.nyx-mythic-ui-frame-v2')
                .forEach(element => element.remove());

            const frame = document.createElement('div');
            frame.className = 'nyx-mythic-ui-frame-v2';
            frame.setAttribute('aria-hidden', 'true');

            frame.innerHTML = `
                <div class="nyx-ui-top-seal">
                    <span class="nyx-ui-top-line left"></span>
                    <div class="nyx-ui-crown">
                        <i>☾</i>
                        <strong>NYX</strong>
                        <small>HẮC DẠ NGUYÊN SƠ</small>
                    </div>
                    <span class="nyx-ui-top-line right"></span>
                </div>

                <div class="nyx-ui-side-rail rail-left">
                    <i></i><b>✦</b><i></i><b>·</b><i></i>
                </div>
                <div class="nyx-ui-side-rail rail-right">
                    <i></i><b>✦</b><i></i><b>·</b><i></i>
                </div>

                <span class="nyx-ui-corner corner-tl">⌜✦</span>
                <span class="nyx-ui-corner corner-tr">✦⌝</span>
                <span class="nyx-ui-corner corner-bl">⌞☾</span>
                <span class="nyx-ui-corner corner-br">☾⌟</span>

                <div class="nyx-ui-bottom-seal">
                    <i></i>
                    <span>PRIMORDIAL NIGHT · FIRST DARKNESS</span>
                    <i></i>
                </div>
            `;

            document.body.appendChild(frame);

            requestAnimationFrame(() => {
                frame.classList.add('is-mounted');
            });
        },

        createPageClick(x, y) {
            if (
                !document.documentElement.classList.contains(
                    'nyx-first-night-equipped'
                )
            ) {
                return;
            }

            const click = document.createElement('div');
            click.className = 'nyx-mythic-page-click';
            click.style.setProperty('--nyx-click-x', `${x}px`);
            click.style.setProperty('--nyx-click-y', `${y}px`);
            click.setAttribute('aria-hidden', 'true');

            click.innerHTML = `
                <span class="nyx-page-click-core"></span>
                <span class="nyx-page-click-ring ring-a"></span>
                <span class="nyx-page-click-ring ring-b"></span>
                <div class="nyx-page-click-shards"></div>
            `;

            const shardField = click.querySelector(
                '.nyx-page-click-shards'
            );

            for (let index = 0; index < 8; index++) {
                const shard = document.createElement('i');
                shard.style.setProperty(
                    '--nyx-click-angle',
                    `${index * 45}deg`
                );
                shardField?.appendChild(shard);
            }

            document.body.appendChild(click);
            requestAnimationFrame(() => click.classList.add('is-active'));
            window.setTimeout(() => click.remove(), 950);
        },

        installGlobalClickEffect() {
            this.documentPointerHandler = event => {
                if (
                    event.button !== undefined &&
                    event.button !== 0
                ) {
                    return;
                }

                const target = event.target;

                if (
                    target?.closest?.(
                        '.nyx-mythic-ultimate,' +
                        '.nyx-mythic-screen-burst-v2,' +
                        '.nyx-mythic-page-click'
                    )
                ) {
                    return;
                }

                this.createPageClick(
                    Number(event.clientX) || 0,
                    Number(event.clientY) || 0
                );
            };

            document.addEventListener(
                'pointerdown',
                this.documentPointerHandler,
                true
            );
        },

        createScreenBurst(x, y) {
            document
                .querySelectorAll(
                    '.nyx-mythic-screen-burst-v2,' +
                    '.nyx-mythic-screen-dialogue-v2'
                )
                .forEach(element => element.remove());

            const burst = document.createElement('div');
            burst.className = 'nyx-mythic-screen-burst-v2';
            burst.style.setProperty('--nyx-skill-x', `${x}px`);
            burst.style.setProperty('--nyx-skill-y', `${y}px`);
            burst.setAttribute('aria-hidden', 'true');

            burst.innerHTML = `
                <div class="nyx-skill-black-flash"></div>
                <div class="nyx-skill-eclipse">
                    <span class="nyx-skill-eclipse-core"></span>
                    <span class="nyx-skill-eclipse-ring ring-a"></span>
                    <span class="nyx-skill-eclipse-ring ring-b"></span>
                </div>
                <div class="nyx-skill-ray-field"></div>
                <div class="nyx-skill-star-field"></div>
                <div class="nyx-skill-fracture fracture-a"></div>
                <div class="nyx-skill-fracture fracture-b"></div>
            `;

            const rayField = burst.querySelector(
                '.nyx-skill-ray-field'
            );
            const starField = burst.querySelector(
                '.nyx-skill-star-field'
            );

            for (let index = 0; index < 14; index++) {
                const ray = document.createElement('i');
                ray.style.setProperty(
                    '--nyx-skill-angle',
                    `${index * (360 / 14)}deg`
                );
                ray.style.setProperty(
                    '--nyx-skill-length',
                    `${110 + (index % 4) * 42}px`
                );
                rayField?.appendChild(ray);
            }

            for (let index = 0; index < 26; index++) {
                const star = document.createElement('i');
                star.textContent = index % 5 === 0 ? '✦' : '';
                star.style.setProperty(
                    '--nyx-skill-star-x',
                    `${(index * 41 + 3) % 97}%`
                );
                star.style.setProperty(
                    '--nyx-skill-star-y',
                    `${(index * 67 + 9) % 91}%`
                );
                star.style.setProperty(
                    '--nyx-skill-star-delay',
                    `${index * .025}s`
                );
                starField?.appendChild(star);
            }

            const dialogue = document.createElement('div');
            dialogue.className = 'nyx-mythic-screen-dialogue-v2';
            dialogue.innerHTML = `
                <span>☾</span>
                <div>
                    <small>NYX · NỮ THẦN MÀN ĐÊM</small>
                    <strong>“MỌI ÁNH SÁNG ĐỀU SINH RA TỪ ĐÊM.”</strong>
                </div>
                <span>✦</span>
            `;

            document.body.append(burst, dialogue);

            requestAnimationFrame(() => {
                burst.classList.add('is-active');
                dialogue.classList.add('is-active');
            });

            window.setTimeout(() => {
                burst.classList.add('is-climax');
            }, 620);

            window.setTimeout(() => {
                burst.classList.add('is-ending');
                dialogue.classList.add('is-ending');
            }, 2450);

            window.setTimeout(() => {
                burst.remove();
                dialogue.remove();
            }, 3400);
        },

        installPetSkill() {
            const container = document.getElementById(
                'virtual-pet-container'
            );
            const pet = container?.querySelector(
                '#virtual-pet-img.mythic-nyx-night-magic, #virtual-pet-img.nyx-mythic-avatar'
            );

            if (!container || !pet) {
                return;
            }

            this.activePetElement = pet;

            this.petClickHandler = event => {
                if (this.skillLocked) {
                    return;
                }

                if (
                    !document.documentElement.classList.contains(
                        'nyx-first-night-equipped'
                    )
                ) {
                    return;
                }

                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) {
                    return;
                }

                this.skillLocked = true;

                const rect = pet.getBoundingClientRect();
                const x =
                    Number.isFinite(event.clientX) &&
                        event.clientX > 0
                        ? event.clientX
                        : rect.left + rect.width / 2;
                const y =
                    Number.isFinite(event.clientY) &&
                        event.clientY > 0
                        ? event.clientY
                        : rect.top + rect.height / 2;

                // Tầng 2: screen burst của Luxury Runtime.
                this.createScreenBurst(x, y);

                // Tầng 3: ĐÊM NGUYÊN SƠ V3.
                // Nếu PetManager listener chạy trước thì cờ Event đã được đặt,
                // nếu Luxury listener chạy trước thì gọi canonical creator tại đây.
                container.classList.remove('nyx-mythic-casting');
                void container.offsetWidth;
                container.classList.add('nyx-mythic-casting');

                if (
                    !event.__nyxUltimateHandled &&
                    typeof PetManager !== 'undefined' &&
                    typeof PetManager.createNyxPrimordialNightUltimate === 'function'
                ) {
                    event.__nyxUltimateHandled = true;
                    PetManager.createNyxPrimordialNightUltimate(x, y);
                }

                window.setTimeout(() => {
                    container.classList.remove('nyx-mythic-casting');
                }, 1750);

                window.setTimeout(() => {
                    this.skillLocked = false;
                }, 5600);
            };

            pet.addEventListener(
                'click',
                this.petClickHandler
            );
        },

        mount() {
            this.clear();
            ensureNyxStylesheet();

            document.documentElement.classList.add(
                'nyx-first-night-equipped'
            );
            document.body?.classList.add(
                'theme-nyx-first-night'
            );

            this.createWorld();
            this.createInterface();
            this.installGlobalClickEffect();
            this.installPetSkill();
        }
    };


    // ========================================================
    // ĐÊM ĐẦY SAO · ONE-CSS RUNTIME GUARD
    // ========================================================
    function ensureStarryNightStylesheet() {
        const existing = Array.from(
            document.querySelectorAll('link[rel="stylesheet"][href]')
        ).find(link =>
            /(?:^|\/)dem-day-sao(?:\(\d+\))?\.css(?:[?#].*)?$/i
                .test(link.href || '')
        );

        if (existing) {
            existing.id = existing.id || 'starry-night-premium-style';
            return existing;
        }

        const byId = document.getElementById('starry-night-premium-style');
        if (byId) return byId;

        let href = '';

        if (window.STARRY_NIGHT_CSS_PATH) {
            href = String(window.STARRY_NIGHT_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script =>
                    /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i
                        .test(script.src || '')
                );

            if (ownScript?.src) {
                try {
                    href = new URL(
                        '../css/dem-day-sao.css?v=20260921.starry-night-v3',
                        ownScript.src
                    ).href;
                } catch (_) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL(
                'css/dem-day-sao.css?v=20260921.starry-night-v3',
                document.baseURI
            ).href;
        }

        const link = document.createElement('link');
        link.id = 'starry-night-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.starryNight = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[StarryNight] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/dem-day-sao.css hoặc gán window.STARRY_NIGHT_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
        return link;
    }


    // ========================================================
    // ĐÊM ĐẦY SAO · FULL PREMIUM SUITE V1
    // WORLD + INTERFACE + PET REALM + GLOBAL CLICK + ULTIMATE
    // Không dùng ThemeManager/EffectManager, không ghi active_theme/effect.
    // ========================================================
    const LuxuryStarryNightRuntime = {
        activePetElement: null,
        petClickHandler: null,
        documentPointerHandler: null,
        observer: null,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container #virtual-pet-img.starry-night-van-gogh-magic,' +
                '#virtual-pet-container #virtual-pet-img.starry-night-avatar'
            );
        },

        promoteStylesheetPriority() {
            const link = ensureStarryNightStylesheet();
            if (link?.parentNode === document.head) {
                document.head.appendChild(link);
            }
            return link;
        },

        clear() {
            this.clearTimers();

            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentPointerHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentPointerHandler,
                    true
                );
            }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentPointerHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'starry-night-equipped',
                'starry-night-skill-active'
            );

            document.body?.classList.remove(
                'theme-starry-night-canvas'
            );

            const container = document.getElementById(
                'virtual-pet-container'
            );

            container?.classList.remove(
                'pet-starry-night-stage',
                'starry-night-casting'
            );

            if (container?.dataset) {
                delete container.dataset.starryNightClickLocked;
            }

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('starry-night-avatar');

            document
                .querySelectorAll(
                    '.snv-world,' +
                    '.snv-ui-frame,' +
                    '.snv-pet-realm,' +
                    '.snv-page-click,' +
                    '.snv-ultimate,' +
                    '.snv-dialogue'
                )
                .forEach(element => element.remove());
        },

        createWorld() {
            document
                .querySelectorAll('.snv-world')
                .forEach(element => element.remove());

            const world = document.createElement('div');
            world.className = 'snv-world';
            world.setAttribute('aria-hidden', 'true');
            world.innerHTML = `
                <div class="snv-world-wash"></div>
                <div class="snv-world-moon"></div>
                <div class="snv-world-swirl swirl-a"></div>
                <div class="snv-world-swirl swirl-b"></div>
                <div class="snv-world-swirl swirl-c"></div>
                <div class="snv-world-swirl swirl-d"></div>
                <div class="snv-world-swirl swirl-e"></div>
                <div class="snv-world-stars"></div>
                <div class="snv-world-brushes"></div>
                <div class="snv-world-ribbons"></div>
                <div class="snv-world-cypress"></div>
                <div class="snv-world-horizon"></div>
            `;

            const reduced = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
            ).matches;

            const starField = world.querySelector('.snv-world-stars');
            const brushField = world.querySelector('.snv-world-brushes');
            const ribbonField = world.querySelector('.snv-world-ribbons');
            const starCount = getLuxuryQualityCount(reduced ? 34 : 92);
            const brushCount = getLuxuryQualityCount(reduced ? 16 : 34);
            const ribbonCount = getLuxuryQualityCount(reduced ? 7 : 16);

            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('span');
                star.className = index % 9 === 0
                    ? 'snv-world-star is-cross'
                    : 'snv-world-star';
                star.textContent = index % 9 === 0 ? '✦' : '';
                star.style.setProperty('--snv-wx', `${(index * 47 + 7) % 98}%`);
                star.style.setProperty('--snv-wy', `${(index * 71 + 11) % 92}%`);
                star.style.setProperty('--snv-ws', `${1.2 + (index % 5) * .8}px`);
                star.style.setProperty('--snv-wd', `${-(index % 13) * .31}s`);
                star.style.setProperty('--snv-wt', `${3.6 + (index % 7) * .52}s`);
                starField?.appendChild(star);
            }

            for (let index = 0; index < brushCount; index++) {
                const brush = document.createElement('span');
                brush.className = 'snv-world-brush';
                brush.style.setProperty('--snv-bx', `${(index * 59 + 3) % 94}%`);
                brush.style.setProperty('--snv-by', `${(index * 37 + 15) % 88}%`);
                brush.style.setProperty('--snv-bw', `${110 + (index % 6) * 44}px`);
                brush.style.setProperty('--snv-br', `${-24 + (index % 8) * 7}deg`);
                brush.style.setProperty('--snv-bd', `${-(index % 7) * .4}s`);
                brush.style.setProperty('--snv-bt', `${6 + (index % 5) * 1.1}s`);
                brushField?.appendChild(brush);
            }

            for (let index = 0; index < ribbonCount; index++) {
                const ribbon = document.createElement('span');
                ribbon.className = 'snv-world-ribbon';
                ribbon.style.setProperty('--snv-rx', `${(index * 33 + 12) % 92}%`);
                ribbon.style.setProperty('--snv-ry', `${(index * 41 + 8) % 86}%`);
                ribbon.style.setProperty('--snv-rw', `${180 + (index % 6) * 54}px`);
                ribbon.style.setProperty('--snv-rr', `${-18 + (index % 7) * 6}deg`);
                ribbon.style.setProperty('--snv-rd', `${-(index % 6) * .55}s`);
                ribbon.style.setProperty('--snv-rt', `${8 + (index % 4) * 1.4}s`);
                ribbonField?.appendChild(ribbon);
            }

            document.body.appendChild(world);
            requestAnimationFrame(() => world.classList.add('is-mounted'));
        },

        createInterface() {
            document
                .querySelectorAll('.snv-ui-frame')
                .forEach(element => element.remove());

            const frame = document.createElement('div');
            frame.className = 'snv-ui-frame';
            frame.setAttribute('aria-hidden', 'true');
            frame.innerHTML = `
                <div class="snv-ui-title">
                    <i>✦</i><span>ĐÊM ĐẦY SAO · STARRY NIGHT</span><i>✦</i>
                </div>
                <div class="snv-ui-side-rail left"></div>
                <div class="snv-ui-side-rail right"></div>
                <div class="snv-ui-bottom-seal"><i></i><span>VINCENT · STARRY NIGHT · TINH DẠ KHAI HỌA</span><i></i></div>
                <span class="snv-ui-corner tl"></span>
                <span class="snv-ui-corner tr"></span>
                <span class="snv-ui-corner bl"></span>
                <span class="snv-ui-corner br"></span>
            `;

            document.body.appendChild(frame);
            requestAnimationFrame(() => frame.classList.add('is-mounted'));
        },

        createPetRealm() {
            const container = document.getElementById('virtual-pet-container');
            const pet = this.getPet();

            if (!container || !pet) return false;

            container
                .querySelectorAll('.snv-pet-realm')
                .forEach(element => element.remove());

            container.classList.add('pet-starry-night-stage');
            pet.classList.add('starry-night-avatar');
            pet.setAttribute('draggable', 'false');

            const realm = document.createElement('div');
            realm.className = 'snv-pet-realm';
            realm.setAttribute('aria-hidden', 'true');
            realm.innerHTML = `
                <span class="snv-pet-halo-outer"></span>
                <span class="snv-pet-halo"></span>
                <span class="snv-pet-swirl"></span>
                <span class="snv-pet-swirl-b"></span>
                <span class="snv-pet-moon"></span>
                <span class="snv-pet-cypress"></span>
                <div class="snv-pet-star-field"></div>
                <span class="snv-pet-ground"></span>
            `;

            const starField = realm.querySelector('.snv-pet-star-field');
            const starCount = getLuxuryQualityCount(30);

            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('i');
                star.className = 'snv-pet-star';
                star.style.setProperty('--snv-psx', `${(index * 43 + 7) % 92}%`);
                star.style.setProperty('--snv-psy', `${(index * 61 + 3) % 80}%`);
                star.style.setProperty('--snv-pss', `${2 + (index % 4) * 1.2}px`);
                star.style.setProperty('--snv-psd', `${-(index % 9) * .28}s`);
                starField?.appendChild(star);
            }

            container.insertBefore(realm, pet);
            return true;
        },

        createPageClick(x, y) {
            if (!document.documentElement.classList.contains('starry-night-equipped')) {
                return;
            }

            const click = document.createElement('div');
            click.className = 'snv-page-click';
            click.style.setProperty('--snv-click-x', `${x}px`);
            click.style.setProperty('--snv-click-y', `${y}px`);
            click.setAttribute('aria-hidden', 'true');
            click.innerHTML = `
                <span class="snv-page-click-core"></span>
                <span class="snv-page-click-ring ring-a"></span>
                <span class="snv-page-click-ring ring-b"></span>
                <span class="snv-page-click-ring ring-c"></span>
                <div class="snv-page-click-rays"></div>
            `;

            const rayField = click.querySelector('.snv-page-click-rays');
            const rayCount = getLuxuryQualityCount(16);

            for (let index = 0; index < rayCount; index++) {
                const ray = document.createElement('i');
                ray.style.setProperty(
                    '--snv-click-angle',
                    `${index * (360 / Math.max(1, rayCount))}deg`
                );
                ray.style.setProperty(
                    '--snv-click-distance',
                    `${38 + (index % 4) * 9}px`
                );
                rayField?.appendChild(ray);
            }

            document.body.appendChild(click);
            requestAnimationFrame(() => click.classList.add('is-active'));
            this.setTimer(() => click.remove(), 1280);
        },

        installGlobalClick() {
            this.documentPointerHandler = event => {
                if (event.button !== undefined && event.button !== 0) return;

                const target = event.target;
                if (
                    target?.closest?.(
                        '#virtual-pet-container,' +
                        '.snv-page-click,' +
                        '.snv-ultimate,' +
                        '.snv-dialogue'
                    )
                ) {
                    return;
                }

                this.createPageClick(
                    Number(event.clientX) || 0,
                    Number(event.clientY) || 0
                );
            };

            document.addEventListener(
                'pointerdown',
                this.documentPointerHandler,
                true
            );
        },

        createUltimate(x, y) {
            if (this.skillLocked) return false;
            this.skillLocked = true;

            document
                .querySelectorAll('.snv-ultimate, .snv-dialogue')
                .forEach(element => element.remove());

            document.documentElement.classList.add('starry-night-skill-active');

            const ultimate = document.createElement('div');
            ultimate.className = 'snv-ultimate';
            ultimate.style.setProperty('--snv-skill-x', `${x}px`);
            ultimate.style.setProperty('--snv-skill-y', `${y}px`);
            ultimate.setAttribute('aria-hidden', 'true');
            ultimate.innerHTML = `
                <div class="snv-ultimate-flash"></div>
                <div class="snv-ultimate-sky"></div>
                <div class="snv-ultimate-moon"></div>
                <div class="snv-ultimate-rings"></div>
                <div class="snv-ultimate-vortex"></div>
                <div class="snv-ultimate-stars"></div>
                <div class="snv-ultimate-strokes"></div>
                <div class="snv-ultimate-cypress"></div>
            `;

            const starField = ultimate.querySelector('.snv-ultimate-stars');
            const strokeField = ultimate.querySelector('.snv-ultimate-strokes');
            const reduced = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
            ).matches;
            const starCount = getLuxuryQualityCount(reduced ? 42 : 88);
            const strokeCount = getLuxuryQualityCount(reduced ? 20 : 46);

            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('i');
                star.className = 'snv-ultimate-star';
                star.textContent = index % 4 === 0 ? '✦' : '•';
                star.style.setProperty('--snv-usx', `${(index * 47 + 5) % 96}%`);
                star.style.setProperty('--snv-usy', `${(index * 67 + 7) % 88}%`);
                star.style.setProperty('--snv-uss', `${9 + (index % 8) * 3.4}px`);
                star.style.setProperty('--snv-usd', `${index * .018}s`);
                starField?.appendChild(star);
            }

            for (let index = 0; index < strokeCount; index++) {
                const stroke = document.createElement('i');
                stroke.className = 'snv-ultimate-stroke';
                stroke.style.setProperty('--snv-ubx', `${(index * 53 + 4) % 90}%`);
                stroke.style.setProperty('--snv-uby', `${(index * 41 + 9) % 82}%`);
                stroke.style.setProperty('--snv-ubw', `${150 + (index % 6) * 56}px`);
                stroke.style.setProperty('--snv-ubr', `${-28 + (index % 10) * 7}deg`);
                stroke.style.setProperty('--snv-ubd', `${index * .026}s`);
                strokeField?.appendChild(stroke);
            }

            const dialogue = document.createElement('div');
            dialogue.className = 'snv-dialogue';
            dialogue.innerHTML = `
                <small>ĐÊM ĐẦY SAO · TINH DẠ KHAI HỌA</small>
                <strong>“Bầu trời đêm không im lặng — nó đang xoáy chuyển thành những vệt sáng sống động.”</strong>
            `;

            document.body.append(ultimate, dialogue);

            requestAnimationFrame(() => {
                ultimate.classList.add('is-active');
                dialogue.classList.add('is-active');
            });

            this.setTimer(() => {
                ultimate.classList.add('is-climax');
            }, 820);

            this.setTimer(() => {
                ultimate.classList.add('is-ending');
                dialogue.classList.add('is-ending');
            }, 3400);

            this.setTimer(() => {
                ultimate.remove();
                dialogue.remove();
                document.documentElement.classList.remove('starry-night-skill-active');
                this.skillLocked = false;
            }, 4550);

            return true;
        },

        installPetSkill() {
            const container = document.getElementById('virtual-pet-container');
            const pet = this.getPet();

            if (!container || !pet) return false;

            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            this.activePetElement = pet;
            this.petClickHandler = event => {
                if (this.skillLocked) return;

                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation?.();

                const rect = pet.getBoundingClientRect();
                const x = Number.isFinite(event.clientX) && event.clientX > 0
                    ? event.clientX
                    : rect.left + rect.width / 2;
                const y = Number.isFinite(event.clientY) && event.clientY > 0
                    ? event.clientY
                    : rect.top + rect.height / 2;

                container.classList.remove('starry-night-casting');
                void container.offsetWidth;
                container.classList.add('starry-night-casting');

                this.createUltimate(x, y);
                this.setTimer(
                    () => container.classList.remove('starry-night-casting'),
                    1600
                );
            };

            pet.addEventListener('click', this.petClickHandler);
            return true;
        },

        installObserver() {
            const container = document.getElementById('virtual-pet-container');
            if (!container) return;

            if (this.observer) this.observer.disconnect();

            this.observer = new MutationObserver(() => {
                if (!document.documentElement.classList.contains('starry-night-equipped')) {
                    return;
                }

                const activePetId = String(localStorage.getItem('active_pet') || '');
                if (activePetId && activePetId !== STARRY_NIGHT_PREMIUM_PET.id) {
                    this.clear();
                    return;
                }

                if (!this.getPet()) {
                    this.clear();
                }
            });

            this.observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'src']
            });
        },

        repair() {
            if (!document.documentElement.classList.contains('starry-night-equipped')) {
                return false;
            }

            this.promoteStylesheetPriority();

            if (!document.querySelector('.snv-world')) {
                this.createWorld();
            }

            if (!document.querySelector('.snv-ui-frame')) {
                this.createInterface();
            }

            if (this.getPet()) {
                if (!document.querySelector('#virtual-pet-container .snv-pet-realm')) {
                    this.createPetRealm();
                }

                if (this.activePetElement !== this.getPet()) {
                    this.installPetSkill();
                }
            }

            return true;
        },

        mount() {
            this.clear();
            this.promoteStylesheetPriority();

            document.documentElement.classList.add('starry-night-equipped');
            document.body?.classList.add('theme-starry-night-canvas');

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installPetSkill();
            this.installObserver();

            [140, 520, 1200].forEach(delay => {
                this.setTimer(() => this.repair(), delay);
            });

            return true;
        },

        restore(attempt = 0) {
            ensureStarryNightStylesheet();

            const activePetId = String(localStorage.getItem('active_pet') || '');
            const pet = document.querySelector('#virtual-pet-container #virtual-pet-img');
            const source = String(pet?.getAttribute('src') || '');

            const looksActive =
                activePetId === STARRY_NIGHT_PREMIUM_PET.id ||
                pet?.classList.contains('starry-night-van-gogh-magic') ||
                source.includes('/Premium/đêm đầy sao/nam_nham_vat1.png');

            if (!looksActive) return false;

            if (pet) {
                this.mount();
                return true;
            }

            if (attempt < 10) {
                this.setTimer(
                    () => this.restore(attempt + 1),
                    180 + attempt * 60
                );
            }

            return false;
        }
    };

    // ========================================================
    // XUÂN THẦN · VẠN SINH HOA MỘNG
    // RUNTIME HIỆU ỨNG LUXURY V3
    // ========================================================

    const LuxurySpringRuntime = {
        activePetElement: null,
        petClickHandler: null,
        skillLocked: false,

        clear() {

            // ========================================================
            // DỌN TƯƠNG TÁC RIÊNG CỦA XUÂN THẦN
            // ========================================================

            if (
                this.activePetElement &&
                this.petClickHandler
            ) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            this.activePetElement = null;
            this.petClickHandler = null;
            this.skillLocked = false;

            document
                .querySelectorAll(
                    '.spring-crown-screen-burst,' +
                    '.spring-goddess-divine-world,' +
                    '.spring-goddess-skill-impact,' +
                    '.spring-goddess-dialogue-box,' +
                    '.spring-crown-pet-burst-v3'
                )
                .forEach(el => el.remove());

            // EFFECT TOÀN WEB
            document
                .querySelectorAll(
                    '.premium-spring-world.spring-crown-world-v3'
                )
                .forEach(el => el.remove());

            // GIAO DIỆN
            document
                .querySelectorAll(
                    '.spring-palace-ui-frame,' +
                    '.spring-crown-ui-frame'
                )
                .forEach(
                    element =>
                        element.remove()
                );

            // ULTIMATE / BURST CŨ
            document
                .querySelectorAll(
                    '.spring-crown-screen-burst,' +
                    '.spring-goddess-divine-world'
                )
                .forEach(el => el.remove());

            // XÓA CLASS GIAO DIỆN
            document.documentElement.classList.remove(
                'premium-spring-sanctuary-equipped'
            );

            // PET REALM
            const container =
                document.getElementById(
                    'virtual-pet-container'
                );

            if (container) {
                container.classList.remove(
                    'spring-crown-pet-stage-v3',
                    'spring-crown-pet-casting',
                    'pet-premium-spring-stage'
                );

                container
                    .querySelectorAll(
                        '.spring-crown-pet-court,' +
                        '.premium-spring-pet-legacy-realm'
                    )
                    .forEach(el => el.remove());

                const img =
                    container.querySelector(
                        '#virtual-pet-img'
                    );

                img?.classList.remove(
                    'spring-crown-goddess-avatar-v3'
                );
            }
        },


        createPetRealm() {

            const container =
                document.getElementById(
                    'virtual-pet-container'
                );

            const pet =
                container?.querySelector(
                    '#virtual-pet-img'
                );

            if (!container || !pet) {
                return;
            }

            container.classList.add(
                'spring-crown-pet-stage-v3',
                'pet-premium-spring-stage'
            );

            pet.classList.add(
                'spring-crown-goddess-avatar-v3',
                'premium-spring-goddess-magic'
            );

            pet.setAttribute(
                'draggable',
                'false'
            );

            // ========================================================
            // PET REALM V2 · THÁNH VỰC MÙA XUÂN
            // ========================================================

            container
                .querySelector(
                    '.premium-spring-pet-legacy-realm'
                )
                ?.remove();

            const legacyRealm =
                document.createElement('div');

            legacyRealm.className =
                'premium-spring-pet-legacy-realm';

            legacyRealm.setAttribute(
                'aria-hidden',
                'true'
            );

            legacyRealm.innerHTML = `
    <span class="premium-spring-pet-halo"></span>

    <span class="
        premium-spring-pet-ring
        ring-one
    "></span>

    <span class="
        premium-spring-pet-ring
        ring-two
    "></span>

    <span class="
        premium-spring-pet-garden
    "></span>

    <div class="
        premium-spring-pet-mote-field
    "></div>
`;

            const legacyMoteField =
                legacyRealm.querySelector(
                    '.premium-spring-pet-mote-field'
                );

            const legacyMoteCount =
                getLuxuryQualityCount(window.matchMedia(
                    '(max-width: 768px), (pointer: coarse)'
                ).matches
                    ? 7
                    : 12);

            for (
                let i = 0;
                i < legacyMoteCount;
                i++
            ) {

                const mote =
                    document.createElement(
                        'span'
                    );

                mote.className =
                    'premium-spring-pet-mote';

                mote.style.left =
                    `${8 + Math.random() * 76}%`;

                mote.style.top =
                    `${34 + Math.random() * 54}%`;

                mote.style.animationDelay =
                    `${-Math.random() * 7}s`;

                mote.style.transform =
                    `scale(${0.65 +
                    Math.random() * 0.8
                    })`;

                legacyMoteField.appendChild(
                    mote
                );
            }

            container.insertBefore(
                legacyRealm,
                pet
            );


            // Không tạo trùng
            container
                .querySelector(
                    '.spring-crown-pet-court'
                )
                ?.remove();


            const court =
                document.createElement('div');

            court.className =
                'spring-crown-pet-court';

            court.setAttribute(
                'aria-hidden',
                'true'
            );


            court.innerHTML = `
            <div class="spring-crown-pet-throne">

                <span class="spring-crown-throne-petal petal-1"></span>
                <span class="spring-crown-throne-petal petal-2"></span>
                <span class="spring-crown-throne-petal petal-3"></span>
                <span class="spring-crown-throne-petal petal-4"></span>
                <span class="spring-crown-throne-petal petal-5"></span>
                <span class="spring-crown-throne-petal petal-6"></span>
                <span class="spring-crown-throne-petal petal-7"></span>
                <span class="spring-crown-throne-petal petal-8"></span>

                <span class="spring-crown-throne-core">
                    ✦
                </span>

            </div>


            <span class="spring-crown-pet-silk"></span>
            <span class="spring-crown-pet-silk silk-b"></span>
            <span class="spring-crown-pet-silk silk-c"></span>


            <span class="spring-crown-pet-rune rune-a">
                ✦
            </span>

            <span class="spring-crown-pet-rune rune-b">
                ❀
            </span>

            <span class="spring-crown-pet-rune rune-c">
                ◇
            </span>


            <div class="spring-crown-pet-dais">

                <span class="spring-crown-dais-light"></span>

                <span class="spring-crown-dais-bloom bloom-1"></span>
                <span class="spring-crown-dais-bloom bloom-2"></span>
                <span class="spring-crown-dais-bloom bloom-3"></span>
                <span class="spring-crown-dais-bloom bloom-4"></span>
                <span class="spring-crown-dais-bloom bloom-5"></span>

                <span class="spring-crown-dais-leaf leaf-1"></span>
                <span class="spring-crown-dais-leaf leaf-2"></span>
                <span class="spring-crown-dais-leaf leaf-3"></span>

            </div>


            <div class="spring-crown-pet-mote-field"></div>

            <div class="spring-crown-pet-butterfly-field">

                <span class="spring-crown-pet-butterfly-v3">
                    <i></i><b></b>
                </span>

                <span class="spring-crown-pet-butterfly-v3">
                    <i></i><b></b>
                </span>

                <span class="spring-crown-pet-butterfly-v3">
                    <i></i><b></b>
                </span>

                <span class="spring-crown-pet-butterfly-v3">
                    <i></i><b></b>
                </span>

                <span class="spring-crown-pet-butterfly-v3">
                    <i></i><b></b>
                </span>

            </div>
        `;


            const moteField =
                court.querySelector(
                    '.spring-crown-pet-mote-field'
                );


            for (let i = 0; i < 18; i++) {

                const mote =
                    document.createElement(
                        'span'
                    );

                mote.className =
                    'spring-crown-pet-mote-v3';

                mote.style.setProperty(
                    '--scp-x',
                    `${6 + Math.random() * 88}%`
                );

                mote.style.setProperty(
                    '--scp-y',
                    `${8 + Math.random() * 80}%`
                );

                mote.style.setProperty(
                    '--scp-size',
                    `${2 + Math.random() * 4}px`
                );

                mote.style.setProperty(
                    '--scp-delay',
                    `${-Math.random() * 5}s`
                );

                moteField.appendChild(
                    mote
                );
            }


            /*
             * Court phải đứng sau ảnh.
             * CSS đã tự quản lý z-index.
             */
            container.insertBefore(
                court,
                pet
            );

            // Gắn kỹ năng riêng cho Xuân Thần
            this.installPetSkill(
                pet,
                container
            );
        },

        // ========================================================
        // CLICK SKILL · XUÂN THẦN
        // ========================================================

        installPetSkill(pet, container) {

            if (!pet || !container) {
                return;
            }

            this.activePetElement = pet;

            this.petClickHandler = event => {

                if (this.skillLocked) {
                    return;
                }

                if (
                    !document.documentElement.classList.contains(
                        'premium-spring-sanctuary-equipped'
                    )
                ) {
                    return;
                }

                const rect =
                    pet.getBoundingClientRect();

                const x =
                    Number.isFinite(event.clientX) &&
                        event.clientX > 0
                        ? event.clientX
                        : rect.left + rect.width / 2;

                const y =
                    Number.isFinite(event.clientY) &&
                        event.clientY > 0
                        ? event.clientY
                        : rect.top + rect.height / 2;

                this.skillLocked = true;

                // 1. Burst ngay quanh pet
                this.createLocalPetBurst(
                    container
                );

                // 2. Burst lan toàn màn hình
                this.createScreenBurst(
                    x,
                    y
                );

                // 3. Ultimate Vạn Sinh Hoa Mộng
                this.createUltimate(
                    x,
                    y,
                    container
                );

                window.setTimeout(() => {
                    this.skillLocked = false;
                }, 6400);
            };

            pet.addEventListener(
                'click',
                this.petClickHandler
            );
        },


        // ========================================================
        // BURST CỤC BỘ QUANH PET
        // ========================================================

        createLocalPetBurst(container) {

            container.classList.add(
                'spring-crown-pet-casting'
            );

            container
                .querySelector(
                    '.spring-crown-pet-burst-v3'
                )
                ?.remove();

            const burst =
                document.createElement('div');

            burst.className =
                'spring-crown-pet-burst-v3';

            for (let i = 0; i < 14; i++) {

                const petal =
                    document.createElement(
                        'span'
                    );

                petal.style.setProperty(
                    '--scp-burst-angle',
                    `${i * (360 / 14)}deg`
                );

                petal.style.setProperty(
                    '--scp-burst-distance',
                    `${48 + Math.random() * 72}px`
                );

                burst.appendChild(
                    petal
                );
            }

            container.appendChild(
                burst
            );

            window.setTimeout(() => {

                burst.remove();

                container.classList.remove(
                    'spring-crown-pet-casting'
                );

            }, 1100);
        },


        // ========================================================
        // BURST TOÀN MÀN HÌNH KHI CHẠM XUÂN THẦN
        // ========================================================

        createScreenBurst(x, y) {

            document
                .querySelectorAll(
                    '.spring-crown-screen-burst'
                )
                .forEach(el => el.remove());

            const burst =
                document.createElement(
                    'div'
                );

            burst.className =
                'spring-crown-screen-burst ' +
                'spring-crown-skill-manifestation';

            burst.style.setProperty(
                '--sc-burst-x',
                `${x}px`
            );

            burst.style.setProperty(
                '--sc-burst-y',
                `${y}px`
            );

            burst.innerHTML = `
        <span class="
            spring-crown-burst-wave
            wave-a
        "></span>

        <span class="
            spring-crown-burst-wave
            wave-b
        "></span>

        <span class="
            spring-crown-burst-wave
            wave-c
        "></span>

        <span class="
            spring-crown-burst-core
        ">
            ✦
        </span>


        <div class="
            spring-crown-burst-ray
        "></div>


        <span class="
            spring-crown-burst-halo
            halo-a
        "></span>

        <span class="
            spring-crown-burst-halo
            halo-b
        "></span>


        <div class="
            spring-crown-burst-petals
        "></div>


        <div class="
            spring-crown-burst-lotus
        ">
            <span class="
                lotus-petal lotus-a
            "></span>

            <span class="
                lotus-petal lotus-b
            "></span>

            <span class="
                lotus-petal lotus-c
            "></span>

            <span class="
                lotus-petal lotus-d
            "></span>

            <span class="
                lotus-petal lotus-e
            "></span>

            <span class="
                lotus-petal lotus-f
            "></span>
        </div>


        <div class="
            spring-crown-burst-sigil
        "></div>


        <div class="
            spring-crown-burst-motes
        "></div>


        <div class="
            spring-crown-burst-butterflies
        "></div>


        <div class="
            spring-crown-burst-title
        ">
            VẠN SINH HOA MỘNG
        </div>
    `;


            // Cánh hoa nổ
            const petals =
                burst.querySelector(
                    '.spring-crown-burst-petals'
                );

            for (let i = 0; i < 18; i++) {

                const petal =
                    document.createElement('i');

                petal.style.setProperty(
                    '--sc-burst-angle',
                    `${i * 20}deg`
                );

                petal.style.setProperty(
                    '--sc-burst-distance',
                    `${75 + Math.random() * 150}px`
                );

                petal.style.setProperty(
                    '--sc-burst-delay',
                    `${Math.random() * 0.18}s`
                );

                petals.appendChild(
                    petal
                );
            }


            // Hạt sáng
            const motes =
                burst.querySelector(
                    '.spring-crown-burst-motes'
                );

            for (let i = 0; i < 22; i++) {

                const mote =
                    document.createElement(
                        'span'
                    );

                mote.className =
                    'spring-crown-burst-mote';

                mote.style.setProperty(
                    '--sc-mote-angle',
                    `${Math.random() * 360}deg`
                );

                mote.style.setProperty(
                    '--sc-mote-distance',
                    `${70 + Math.random() * 170}px`
                );

                mote.style.setProperty(
                    '--sc-mote-size',
                    `${3 + Math.random() * 5}px`
                );

                mote.style.setProperty(
                    '--sc-mote-delay',
                    `${Math.random() * 0.22}s`
                );

                motes.appendChild(
                    mote
                );
            }


            // Bướm bung ra
            const butterflies =
                burst.querySelector(
                    '.spring-crown-burst-butterflies'
                );

            for (let i = 0; i < 6; i++) {

                const butterfly =
                    document.createElement(
                        'span'
                    );

                butterfly.className =
                    'spring-crown-burst-butterfly';

                butterfly.innerHTML =
                    '<b></b><u></u>';

                butterfly.style.setProperty(
                    '--sc-butterfly-angle',
                    `${i * 60}deg`
                );

                butterfly.style.setProperty(
                    '--sc-butterfly-distance',
                    `${90 + Math.random() * 110}px`
                );

                butterfly.style.setProperty(
                    '--sc-butterfly-delay',
                    `${i * 0.06}s`
                );

                butterflies.appendChild(
                    butterfly
                );
            }


            document.body.appendChild(
                burst
            );

            requestAnimationFrame(() => {
                burst.classList.add(
                    'is-active'
                );
            });

            window.setTimeout(
                () => burst.remove(),
                1700
            );
        },


        // ========================================================
        // ULTIMATE · THẦN VỰC — VẠN HOA KHAI GIỚI
        // ========================================================

        createUltimate(x, y, container) {

            document
                .querySelectorAll(
                    '.spring-goddess-divine-world'
                )
                .forEach(el => el.remove());


            const world =
                document.createElement(
                    'div'
                );

            world.className =
                'spring-goddess-divine-world';


            world.innerHTML = `

        <div class="
            spring-goddess-skill-dawn
        "></div>


        <div class="
            spring-goddess-skill-heaven-rays
        "></div>


        <div class="
            spring-goddess-skill-aurora
            aurora-left
        "></div>

        <div class="
            spring-goddess-skill-aurora
            aurora-right
        "></div>


        <!-- MẶT TRỜI HOA THẦN -->
        <div class="
            spring-goddess-skill-sun
        ">

            <span class="
                spring-goddess-skill-sun-core
            "></span>

            <span class="
                spring-goddess-skill-sun-ring
                ring-a
            "></span>

            <span class="
                spring-goddess-skill-sun-ring
                ring-b
            "></span>

            <span class="
                spring-goddess-skill-sun-ring
                ring-c
            "></span>

        </div>


        <!-- ĐẠI PHÁP TRẬN -->
        <div class="
            spring-goddess-skill-sigil
        ">

            <span class="
                spring-goddess-skill-sigil-ring
                ring-one
            "></span>

            <span class="
                spring-goddess-skill-sigil-ring
                ring-two
            "></span>

            <span class="
                spring-goddess-skill-sigil-ring
                ring-three
            "></span>

            <span class="
                spring-goddess-skill-sigil-core
            ">
                ❀
            </span>

        </div>


        <!-- CỔNG HOA -->
        <div class="
            spring-goddess-skill-gate
        ">

            <span class="
                spring-goddess-skill-pillar
                pillar-left
            "></span>

            <span class="
                spring-goddess-skill-pillar
                pillar-right
            "></span>

            <span class="
                spring-goddess-skill-arch
            "></span>

            <span class="
                spring-goddess-skill-gate-light
            "></span>

        </div>


        <div class="
            spring-goddess-skill-vines
            vines-left
        "></div>

        <div class="
            spring-goddess-skill-vines
            vines-right
        "></div>


        <div class="
            spring-goddess-skill-petal-storm
        "></div>

        <div class="
            spring-goddess-skill-light-seeds
        "></div>

        <div class="
            spring-goddess-skill-butterflies
        "></div>


        <div class="
            spring-goddess-skill-ground-bloom
        "></div>


        <div class="
            spring-goddess-skill-title
        ">
            <small>
                XUÂN THẦN · PREMIUM
            </small>

            <strong>
                VẠN SINH HOA MỘNG
            </strong>
        </div>
    `;


            // ====================================================
            // BÃO CÁNH HOA
            // ====================================================

            const petalStorm =
                world.querySelector(
                    '.spring-goddess-skill-petal-storm'
                );

            const isMobile =
                window.matchMedia(
                    '(max-width:768px),' +
                    '(pointer:coarse)'
                ).matches;

            const petalCount =
                getLuxuryQualityCount(isMobile ? 32 : 62);

            for (
                let i = 0;
                i < petalCount;
                i++
            ) {

                const petal =
                    document.createElement(
                        'span'
                    );

                petal.className =
                    'spring-goddess-skill-petal ' +
                    `petal-${i % 3}`;

                petal.style.left =
                    `${Math.random() * 100}%`;

                petal.style.setProperty(
                    '--spring-petal-size',
                    `${7 + Math.random() * 13}px`
                );

                petal.style.setProperty(
                    '--spring-petal-duration',
                    `${3.8 + Math.random() * 2.2}s`
                );

                petal.style.setProperty(
                    '--spring-petal-delay',
                    `${Math.random() * 1.6}s`
                );

                petal.style.setProperty(
                    '--spring-petal-drift',
                    `${-90 + Math.random() * 180}px`
                );

                petalStorm.appendChild(
                    petal
                );
            }


            // ====================================================
            // HẠT ÁNH SÁNG
            // ====================================================

            const seedField =
                world.querySelector(
                    '.spring-goddess-skill-light-seeds'
                );

            const seedCount =
                getLuxuryQualityCount(isMobile ? 14 : 30);

            for (
                let i = 0;
                i < seedCount;
                i++
            ) {

                const seed =
                    document.createElement(
                        'span'
                    );

                seed.className =
                    'spring-goddess-skill-seed';

                seed.style.left =
                    `${Math.random() * 100}%`;

                seed.style.bottom =
                    `${Math.random() * 45}%`;

                seed.style.setProperty(
                    '--spring-seed-size',
                    `${2 + Math.random() * 5}px`
                );

                seed.style.setProperty(
                    '--spring-seed-delay',
                    `${-Math.random() * 2.5}s`
                );

                seedField.appendChild(
                    seed
                );
            }


            // ====================================================
            // BƯỚM THẦN
            // ====================================================

            const butterflyField =
                world.querySelector(
                    '.spring-goddess-skill-butterflies'
                );

            const butterflyCount =
                getLuxuryQualityCount(isMobile ? 4 : 8);

            for (
                let i = 0;
                i < butterflyCount;
                i++
            ) {

                const butterfly =
                    document.createElement(
                        'span'
                    );

                butterfly.className =
                    'spring-goddess-skill-butterfly';

                butterfly.innerHTML =
                    '<i></i><b></b>';

                butterfly.style.setProperty(
                    '--spring-bfly-start-x',
                    `${5 + Math.random() * 90}%`
                );

                butterfly.style.setProperty(
                    '--spring-bfly-start-y',
                    `${40 + Math.random() * 48}%`
                );

                butterfly.style.setProperty(
                    '--spring-bfly-drift-x',
                    `${-140 + Math.random() * 280}px`
                );

                butterfly.style.setProperty(
                    '--spring-bfly-delay',
                    `${0.3 + i * 0.22}s`
                );

                butterflyField.appendChild(
                    butterfly
                );
            }


            document.body.appendChild(
                world
            );

            requestAnimationFrame(() => {
                world.classList.add(
                    'is-active'
                );
            });


            // ====================================================
            // IMPACT NGAY VỊ TRÍ CLICK
            // ====================================================

            const impact =
                document.createElement(
                    'span'
                );

            impact.className =
                'spring-goddess-skill-impact';

            impact.style.left =
                `${x}px`;

            impact.style.top =
                `${y}px`;

            document.body.appendChild(
                impact
            );

            window.setTimeout(
                () => impact.remove(),
                1400
            );


            // ====================================================
            // HỘP THOẠI CỦA XUÂN THẦN
            // ====================================================

            const dialogue =
                document.createElement(
                    'div'
                );

            dialogue.className =
                'spring-goddess-dialogue-box';

            dialogue.textContent =
                'Vạn vật sinh trưởng — ' +
                'xuân giới khai hoa.';

            container.appendChild(
                dialogue
            );


            window.setTimeout(() => {

                world.remove();
                dialogue.remove();

            }, 6400);
        },


        createWorld() {

            document
                .querySelectorAll(
                    '.premium-spring-world.spring-crown-world-v3'
                )
                .forEach(el => el.remove());


            const world =
                document.createElement(
                    'div'
                );

            world.className =
                'premium-spring-world spring-crown-world-v3';

            world.setAttribute(
                'aria-hidden',
                'true'
            );


            world.innerHTML = `

    <!-- =====================================================
         WEB EFFECT V2 · MƯA HOA & NẮNG MA THUẬT
         ===================================================== -->

    <div class="premium-spring-world-wash"></div>

    <div class="premium-spring-world-sun"></div>

    <div class="premium-spring-legacy-petal-field"></div>

    <div class="
    premium-spring-world-bough
    bough-left
"></div>

<div class="
    premium-spring-world-bough
    bough-right
"></div>


    <!-- =====================================================
         WEB EFFECT V3 · NGỰ HOA THIÊN MÔN
         ===================================================== -->

    <div class="spring-crown-sky-vault">

        <div class="spring-crown-dawn-orb"></div>

                <span class="spring-crown-aurora aurora-a"></span>
                <span class="spring-crown-aurora aurora-b"></span>
                <span class="spring-crown-aurora aurora-c"></span>

                <span class="spring-crown-prism prism-a"></span>
                <span class="spring-crown-prism prism-b"></span>

                <span class="spring-crown-silk-road"></span>
                <span class="spring-crown-silk-road silk-two"></span>
                <span class="spring-crown-silk-road silk-three"></span>

                <div class="spring-crown-petal-field"></div>

                <div class="spring-crown-lumina-field"></div>

                <div class="spring-crown-butterfly-field"></div>

                <div class="spring-crown-sigil-field"></div>


                <div class="spring-crown-edge-garden garden-left">

                    <span class="spring-crown-stem"></span>
                    <span class="spring-crown-stem stem-b"></span>

                    <span class="spring-crown-bloom bloom-a"></span>
                    <span class="spring-crown-bloom bloom-b"></span>
                    <span class="spring-crown-bloom bloom-c"></span>

                    <span class="spring-crown-leaf leaf-a"></span>
                    <span class="spring-crown-leaf leaf-b"></span>

                </div>


                <div class="spring-crown-edge-garden garden-right">

                    <span class="spring-crown-stem"></span>
                    <span class="spring-crown-stem stem-b"></span>

                    <span class="spring-crown-bloom bloom-a"></span>
                    <span class="spring-crown-bloom bloom-b"></span>
                    <span class="spring-crown-bloom bloom-c"></span>

                    <span class="spring-crown-leaf leaf-a"></span>
                    <span class="spring-crown-leaf leaf-b"></span>

                </div>


                <div class="spring-crown-bottom-haze"></div>

            </div>
        `;


            // ========================================================
            // WEB EFFECT V2 · MƯA CÁNH HOA MÙA XUÂN
            // ========================================================

            const legacyPetalField =
                world.querySelector(
                    '.premium-spring-legacy-petal-field'
                );

            const legacyIsMobile =
                window.matchMedia(
                    '(max-width: 768px), (pointer: coarse)'
                ).matches;

            const legacyPetalCount =
                getLuxuryQualityCount(legacyIsMobile ? 18 : 36);

            if (legacyPetalField) {

                for (
                    let i = 0;
                    i < legacyPetalCount;
                    i++
                ) {

                    const petal =
                        document.createElement(
                            'span'
                        );

                    petal.className =
                        'premium-spring-screen-petal';

                    petal.style.setProperty(
                        '--ps-x',
                        `${Math.random() * 100}%`
                    );

                    petal.style.setProperty(
                        '--ps-duration',
                        `${7 + Math.random() * 8}s`
                    );

                    petal.style.setProperty(
                        '--ps-delay',
                        `${-Math.random() * 12}s`
                    );

                    petal.style.transform =
                        `scale(${0.55 + Math.random() * 0.85})`;

                    legacyPetalField.appendChild(
                        petal
                    );
                }
            }

            const petalField =
                world.querySelector(
                    '.spring-crown-petal-field'
                );


            const isMobile =
                window.matchMedia(
                    '(max-width: 768px), (pointer: coarse)'
                ).matches;


            const petalCount =
                getLuxuryQualityCount(isMobile ? 22 : 42);


            for (
                let i = 0;
                i < petalCount;
                i++
            ) {

                const petal =
                    document.createElement(
                        'span'
                    );

                const types = [
                    'petal-round',
                    'petal-heart',
                    'petal-lance'
                ];

                petal.className =
                    'spring-crown-falling-petal ' +
                    types[i % types.length] +
                    (i % 4 === 0
                        ? ' is-near'
                        : '');

                petal.style.setProperty(
                    '--sc-x',
                    `${Math.random() * 100}%`
                );

                petal.style.setProperty(
                    '--sc-size',
                    `${7 + Math.random() * 11}px`
                );

                petal.style.setProperty(
                    '--sc-duration',
                    `${7 + Math.random() * 8}s`
                );

                petal.style.setProperty(
                    '--sc-delay',
                    `${-Math.random() * 12}s`
                );

                petalField.appendChild(
                    petal
                );
            }


            const luminaField =
                world.querySelector(
                    '.spring-crown-lumina-field'
                );


            const luminaCount =
                getLuxuryQualityCount(isMobile ? 12 : 26);


            for (
                let i = 0;
                i < luminaCount;
                i++
            ) {

                const light =
                    document.createElement(
                        'span'
                    );

                light.className =
                    'spring-crown-lumina';

                light.style.setProperty(
                    '--sc-lx',
                    `${Math.random() * 100}%`
                );

                light.style.setProperty(
                    '--sc-ly',
                    `${Math.random() * 100}%`
                );

                light.style.setProperty(
                    '--sc-lsize',
                    `${2 + Math.random() * 4}px`
                );

                light.style.setProperty(
                    '--sc-lduration',
                    `${3 + Math.random() * 5}s`
                );

                light.style.setProperty(
                    '--sc-ldelay',
                    `${-Math.random() * 6}s`
                );

                luminaField.appendChild(
                    light
                );
            }


            const butterflyField =
                world.querySelector(
                    '.spring-crown-butterfly-field'
                );


            const butterflyCount =
                getLuxuryQualityCount(isMobile ? 3 : 6);


            for (
                let i = 0;
                i < butterflyCount;
                i++
            ) {

                const butterfly =
                    document.createElement(
                        'span'
                    );

                butterfly.className =
                    'spring-crown-screen-butterfly';

                butterfly.innerHTML =
                    '<i></i><b></b>';

                butterfly.style.setProperty(
                    '--sc-by',
                    `${12 + Math.random() * 70}%`
                );

                butterfly.style.setProperty(
                    '--sc-bscale',
                    `${0.6 + Math.random() * 0.7}`
                );

                butterfly.style.setProperty(
                    '--sc-bduration',
                    `${12 + Math.random() * 10}s`
                );

                butterfly.style.setProperty(
                    '--sc-bdelay',
                    `${-Math.random() * 18}s`
                );

                butterflyField.appendChild(
                    butterfly
                );
            }


            const sigilField =
                world.querySelector(
                    '.spring-crown-sigil-field'
                );


            ['✦', '❀', '◇', '✧', '❖']
                .forEach(
                    (symbol, index) => {

                        const sigil =
                            document.createElement(
                                'span'
                            );

                        sigil.className =
                            'spring-crown-sigil';

                        sigil.textContent =
                            symbol;

                        sigil.style.setProperty(
                            '--sc-sx',
                            `${12 + index * 18}%`
                        );

                        sigil.style.setProperty(
                            '--sc-sy',
                            `${18 + (index * 17) % 62}%`
                        );

                        sigil.style.setProperty(
                            '--sc-ssize',
                            `${16 + index * 3}px`
                        );

                        sigil.style.setProperty(
                            '--sc-sdelay',
                            `${-index * 0.8}s`
                        );

                        sigilField.appendChild(
                            sigil
                        );
                    }
                );


            document.body.appendChild(
                world
            );


            requestAnimationFrame(
                () => {
                    world.classList.add(
                        'is-active'
                    );
                }
            );
        },


        createInterface() {

            document.documentElement
                .classList.add(
                    'premium-spring-sanctuary-equipped'
                );


            // Chỉ dọn khung giao diện cũ.
            // KHÔNG xóa World Effect vừa tạo.

            document
                .querySelectorAll(
                    '.spring-palace-ui-frame,' +
                    '.spring-crown-ui-frame'
                )
                .forEach(
                    element =>
                        element.remove()
                );


            const frame =
                document.createElement(
                    'div'
                );

            frame.className =
                'spring-palace-ui-frame';

            frame.setAttribute(
                'aria-hidden',
                'true'
            );


            frame.innerHTML = `
            <div class="spring-palace-top-arch">

                <span class="spring-palace-arch-line"></span>

                <span class="spring-palace-arch-bloom">
                    ❀
                </span>

                <span class="spring-palace-arch-gem">
                    ✦
                </span>

                <span class="spring-palace-arch-bloom">
                    ❀
                </span>

                <span class="
                    spring-palace-arch-line
                    line-right
                "></span>

            </div>


            <div class="
                spring-palace-side-vine
                vine-left
            ">
                <i></i><i></i><i></i><i></i><i></i>
            </div>


            <div class="
                spring-palace-side-vine
                vine-right
            ">
                <i></i><i></i><i></i><i></i><i></i>
            </div>


            <span class="
                spring-palace-corner-garden
                garden-tl
            "></span>

            <span class="
                spring-palace-corner-garden
                garden-tr
            "></span>

            <span class="
                spring-palace-corner-garden
                garden-bl
            "></span>

            <span class="
                spring-palace-corner-garden
                garden-br
            "></span>


            <div class="spring-palace-bottom-seal">
                <i></i>
                <b>❀ ✦ ❀</b>
                <i></i>
            </div>
        `;


            document.body.appendChild(
                frame
            );


            requestAnimationFrame(
                () => {
                    frame.classList.add(
                        'is-mounted'
                    );
                }
            );
        },


        mount() {

            this.clear();

            this.createPetRealm();
            this.createWorld();
            this.createInterface();
        }
    };

    // ========================================================
    // GẮN RUNTIME LUXURY VÀO PETMANAGER
    // ========================================================

    function installLuxurySpringPetHook(
        attempt = 0
    ) {

        if (
            typeof PetManager === 'undefined' ||
            typeof PetManager.spawnPet !== 'function'
        ) {

            if (attempt < 100) {
                setTimeout(
                    () =>
                        installLuxurySpringPetHook(
                            attempt + 1
                        ),
                    100
                );
            }

            return;
        }


        if (
            PetManager.__luxurySpringHookInstalled
        ) {
            return;
        }


        const originalSpawnPet =
            PetManager.spawnPet.bind(
                PetManager
            );


        PetManager.spawnPet =
            function (petData) {
                if (window.isStudentStoreGameAccessEnabled?.() === false) return false;

                /*
                 * Mỗi lần đổi pet dọn toàn bộ runtime Luxury đang hoạt động.
                 * Tuyệt đối KHÔNG gọi EffectManager.clearEffects(),
                 * nên vật phẩm Effect đang trang bị vẫn độc lập.
                 */
                try {
                    LuxurySpringRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Xuân Thần:',
                        error
                    );
                }

                try {
                    LuxurySummerRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Hạ Thần:',
                        error
                    );
                }

                try {
                    LuxuryNationalDayRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Quốc khánh:',
                        error
                    );
                }

                try {
                    LuxuryNyxRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Nyx:',
                        error
                    );
                }


                try {
                    LuxuryAetherRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Aether:',
                        error
                    );
                }

                try {
                    LuxuryLotmKleinRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime LOTM Klein:',
                        error
                    );
                }

                try {
                    LuxuryCamCoCamMongRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Cầm Mộng:',
                        error
                    );
                }

                try {
                    LuxuryTamonBSideRuntime.clear();
                } catch (error) {
                    console.warn(
                        "[LuxuryStore] Không thể dọn runtime Tamon's B-Side:",
                        error
                    );
                }

                try {
                    LuxuryTamonPinkStaticRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Tamon Pink Static:',
                        error
                    );
                }

                try {
                    LuxuryMidAutumnRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Trung thu:',
                        error
                    );
                }

                try {
                    LuxuryLinkClickChengRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Link Click:',
                        error
                    );
                }

                try {
                    LuxuryStarryNightRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Đêm đầy sao:',
                        error
                    );
                }

// Render pet gốc trước.
                originalSpawnPet(
                    petData
                );


                const isLuxurySpring =
                    petData?.id ===
                    'pet_luxury_mua_xuan' ||
                    petData?.petEffect ===
                    'premium-spring-goddess-magic';

                const isLuxurySummer =
                    petData?.id ===
                    'pet_luxury_mua_ha' ||
                    petData?.petEffect ===
                    'premium-summer-solstice-magic';

                const isNationalDay =
                    petData?.id ===
                    'pet_quoc_khanh_1' ||
                    petData?.petEffect ===
                    'national-day-dong-son-magic';

                const isMythicNyx =
                    petData?.id ===
                    'pet_mythic_nyx_1' ||
                    petData?.petEffect ===
                    'mythic-nyx-night-magic';


                const isMythicAether =
                    petData?.id ===
                    'pet_mythic_aether_1' ||
                    petData?.petEffect ===
                    'mythic-aether-luminous-magic';

                const isLotmKlein =
                    petData?.id ===
                    'pet_lotm_klein_event_1' ||
                    petData?.petEffect ===
                    'lotm-klein-mystery-magic';

                const isCamCoCamMong =
                    petData?.id ===
                    'pet_cam_co_cam_mong_1' ||
                    petData?.petEffect ===
                    'cam-co-cam-mong-qin-dream-magic';

                const isTamonBSide =
                    petData?.id ===
                    'pet_tamon_b_side_1' ||
                    petData?.petEffect ===
                    'tamon-b-side-soundwave-magic';

                const isTamonPinkStatic =
                    petData?.id ===
                    'pet_tamon_b_side_2' ||
                    petData?.petEffect ===
                    'tamon-pink-static-magic';

                const isMidAutumnMoonPalace =
                    petData?.id ===
                    'pet_trung_thu_nguyet_cung_tien_tu' ||
                    petData?.id ===
                    'pet_trung_thu_chu_cuoi_2' ||
                    petData?.petEffect ===
                    'midautumn-moon-palace-pet-magic' ||
                    petData?.petEffect ===
                    'midautumn-cuoi-moonwood-magic';

                const isLinkClickCheng =
                    petData?.id ===
                    'pet_linkclick_cheng_xiaoshi_1' ||
                    petData?.petEffect ===
                    'linkclick-cheng-timeframe-magic';

                const isStarryNight =
                    petData?.id ===
                    'pet_dem_day_sao_1' ||
                    petData?.petEffect ===
                    'starry-night-van-gogh-magic';
/*
                 * XUÂN THẦN:
                 * phải mount lại đủ Pet Realm + World + Interface.
                 * Đây là nhánh đã bị mất trong bản trước.
                 */
                if (isLuxurySpring) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxurySpringRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Xuân Thần:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * HẠ THẦN · NHẬT DIỆU LƯU KIM:
                 * Full suite riêng: world + interface + pet realm
                 * + global click + pet skill + drag trail.
                 * Không ghi đè active_theme / active_effect.
                 */
                if (isLuxurySummer) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxurySummerRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Hạ Thần:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * LORD OF THE MYSTERIES · KLEIN:
                 * Full suite riêng: world + interface + pet realm
                 * + global click + ultimate. Không chiếm active_theme/effect.
                 */
                if (isLotmKlein) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryLotmKleinRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount LOTM Klein:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * CẦM CƠ · CẦM MỘNG:
                 * Full suite riêng: world + interface + pet realm
                 * + global click + ultimate. Không đụng effect/theme storage.
                 */
                if (isCamCoCamMong) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryCamCoCamMongRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Cầm Mộng:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * TAMON'S B-SIDE:
                 * Runtime riêng dựng pet realm + world + interface + click.
                 * Không gọi ThemeManager/EffectManager nên không xóa lớp khác.
                 */
                if (isTamonBSide) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryTamonBSideRuntime.mount();
                            } catch (error) {
                                console.error(
                                    "[LuxuryStore] Lỗi mount Tamon's B-Side:",
                                    error
                                );
                            }
                        }
                    );

                    return;
                }

                /*
                 * TAMON PINK STATIC:
                 * Suite #2 hoàn toàn mới: cassette + sticker + black/pink UI.
                 */
                if (isTamonPinkStatic) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryTamonPinkStaticRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Tamon Pink Static:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * TRUNG THU · NGUYỆT CUNG TIÊN TỬ:
                 * Full suite riêng: world + interface + pet realm
                 * + global click + fullscreen ultimate khi click pet.
                 * Không ghi đè active_theme / active_effect.
                 */
                if (isMidAutumnMoonPalace) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryMidAutumnRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Nguyệt Cung Tiên Tử:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }

                /*
                 * LINK CLICK · CHENG XIAOSHI:
                 * Full suite riêng: world + interface + pet realm
                 * + click toàn web + ultimate khi nhấn nhân vật.
                 */
                if (isLinkClickCheng) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryLinkClickChengRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Cheng Xiaoshi:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * ĐÊM ĐẦY SAO:
                 * Full suite riêng: world + interface + pet realm
                 * + global click + ultimate. Không chiếm active_theme/effect.
                 */
                if (isStarryNight) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryStarryNightRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Đêm đầy sao:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * AETHER THẦN THOẠI:
                 * Runtime riêng dựng world + interface + pet realm
                 * + click toàn web + ultimate khi nhấn nhân vật.
                 */
                if (isMythicAether) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryAetherRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Aether:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * NYX THẦN THOẠI:
                 * PetManager dựng pet realm + ultimate gốc.
                 * Runtime V2 bổ sung World + Interface + global click
                 * + screen burst khi nhấn Nyx.
                 */
                if (isMythicNyx) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryNyxRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Nyx:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * QUỐC KHÁNH:
                 * PetManager tự dựng pet realm + click skill.
                 * Runtime này chỉ bổ sung World + Interface.
                 */
                if (isNationalDay) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryNationalDayRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Quốc khánh:',
                                    error
                                );
                            }
                        }
                    );
                }
            };


        PetManager.__luxurySpringHookInstalled =
            true;
    }

    // ========================================================
    // GỠ XUÂN THẦN → DỌN TOÀN BỘ RUNTIME LUXURY
    // ========================================================

    function installLuxurySpringUnapplyHook(
        attempt = 0
    ) {

        if (
            typeof StoreManager === 'undefined' ||
            typeof StoreManager.unapplyItem !== 'function'
        ) {

            if (attempt < 100) {
                setTimeout(
                    () =>
                        installLuxurySpringUnapplyHook(
                            attempt + 1
                        ),
                    100
                );
            }

            return;
        }


        if (
            StoreManager.__luxurySpringUnapplyHookInstalled
        ) {
            return;
        }


        const originalUnapplyItem =
            StoreManager.unapplyItem.bind(
                StoreManager
            );


        StoreManager.unapplyItem =
            async function (itemId) {

                const isLuxurySpring =
                    String(itemId) ===
                    'pet_luxury_mua_xuan';

                const isLuxurySummer =
                    String(itemId) ===
                    'pet_luxury_mua_ha';

                const isNationalDay =
                    String(itemId) ===
                    'pet_quoc_khanh_1';

                const isMythicNyx =
                    String(itemId) ===
                    'pet_mythic_nyx_1';


                const isMythicAether =
                    String(itemId) ===
                    'pet_mythic_aether_1';

                const isLotmKlein =
                    String(itemId) ===
                    'pet_lotm_klein_event_1';

                const isCamCoCamMong =
                    String(itemId) ===
                    'pet_cam_co_cam_mong_1';

                const isTamonBSide =
                    String(itemId) ===
                    'pet_tamon_b_side_1';

                const isTamonPinkStatic =
                    String(itemId) ===
                    'pet_tamon_b_side_2';

                const isMidAutumnMoonPalace =
                    String(itemId) ===
                    'pet_trung_thu_nguyet_cung_tien_tu' ||
                    String(itemId) ===
                    'pet_trung_thu_chu_cuoi_2';

                const isLinkClickCheng =
                    String(itemId) ===
                    'pet_linkclick_cheng_xiaoshi_1';

                const isStarryNight =
                    String(itemId) ===
                    'pet_dem_day_sao_1';
/*
                 * DỌN NGAY trước khi Firebase cập nhật.
                 */
                if (isLuxurySpring) {
                    LuxurySpringRuntime.clear();
                }

                if (isLuxurySummer) {
                    LuxurySummerRuntime.clear();
                }

                if (isMythicNyx) {
                    LuxuryNyxRuntime.clear();
                }


                if (isMythicAether) {
                    LuxuryAetherRuntime.clear();
                }

                if (isLotmKlein) {
                    LuxuryLotmKleinRuntime.clear();
                }

                if (isCamCoCamMong) {
                    LuxuryCamCoCamMongRuntime.clear();
                }

                if (isTamonBSide) {
                    LuxuryTamonBSideRuntime.clear();
                }

                if (isTamonPinkStatic) {
                    LuxuryTamonPinkStaticRuntime.clear();
                }

                if (isMidAutumnMoonPalace) {
                    LuxuryMidAutumnRuntime.clear();
                }

                if (isLinkClickCheng) {
                    LuxuryLinkClickChengRuntime.clear();
                }

                if (isStarryNight) {
                    LuxuryStarryNightRuntime.clear();
                }

if (isNationalDay) {

                    LuxuryNationalDayRuntime.clear();

                    if (
                        typeof PetManager !== 'undefined' &&
                        typeof PetManager.clearNationalDayRealm ===
                        'function'
                    ) {
                        PetManager.clearNationalDayRealm();
                    }
                }


                try {

                    return await originalUnapplyItem(
                        itemId
                    );

                } finally {

                    /*
                     * DỌN LẦN 2 sau khi hàm gỡ gốc hoàn tất.
                     * Chặn trường hợp observer/render tạo lại
                     * một phần hiệu ứng trong lúc Firebase cập nhật.
                     */
                    if (isLuxurySpring) {

                        LuxurySpringRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        if (container) {

                            container.classList.remove(
                                'spring-crown-pet-stage-v3',
                                'spring-crown-pet-casting',
                                'pet-premium-spring-stage'
                            );

                            container
                                .querySelectorAll(
                                    '.spring-crown-pet-court,' +
                                    '.spring-crown-pet-burst-v3,' +
                                    '.premium-spring-pet-legacy-realm'
                                )
                                .forEach(
                                    element =>
                                        element.remove()
                                );
                        }


                        document.documentElement
                            .classList.remove(
                                'premium-spring-sanctuary-equipped'
                            );


                        document
                            .querySelectorAll(
                                '.premium-spring-world.spring-crown-world-v3,' +
                                '.spring-crown-ui-frame,' +
                                '.spring-palace-ui-frame,' +
                                '.spring-crown-screen-burst,' +
                                '.spring-goddess-divine-world,' +
                                '.spring-goddess-skill-impact,' +
                                '.spring-goddess-dialogue-box'
                            )
                            .forEach(
                                element =>
                                    element.remove()
                            );
                    }


                    if (isLuxurySummer) {
                        LuxurySummerRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        container?.classList.remove(
                            'pet-summer-solstice-stage',
                            'summer-solstice-awakening',
                            'summer-solstice-casting'
                        );

                        document.documentElement.classList.remove(
                            'summer-solstice-equipped',
                            'summer-solstice-skill-active'
                        );

                        document
                            .querySelectorAll(
                                '.summer-solstice-world,' +
                                '.summer-solstice-ui-frame,' +
                                '.summer-solstice-pet-realm,' +
                                '.summer-solstice-click-burst,' +
                                '.summer-solstice-drag-trail,' +
                                '.summer-solstice-ultimate,' +
                                '.summer-solstice-pet-dialogue,' +
                                '.summer-solstice-local-burst'
                            )
                            .forEach(node => node.remove());
                    }

                    if (isMythicNyx) {
                        LuxuryNyxRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        container?.classList.remove(
                            'pet-nyx-mythic-stage',
                            'nyx-mythic-awakening',
                            'nyx-mythic-casting'
                        );

                        document.documentElement.classList.remove(
                            'nyx-mythic-pet-equipped',
                            'nyx-first-night-equipped'
                        );

                        document
                            .querySelectorAll(
                                '.nyx-mythic-ultimate,' +
                                '.nyx-mythic-pet-realm,' +
                                '.nyx-mythic-world-v2,' +
                                '.nyx-mythic-ui-frame-v2,' +
                                '.nyx-mythic-screen-burst-v2,' +
                                '.nyx-mythic-screen-dialogue-v2'
                            )
                            .forEach(element => element.remove());
                    }

                    if (isMythicAether) {
                        LuxuryAetherRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        container?.classList.remove(
                            'pet-aether-mythic-stage',
                            'aether-mythic-awakening',
                            'aether-mythic-casting'
                        );

                        container
                            ?.querySelectorAll(
                                '.aether-mythic-pet-realm'
                            )
                            .forEach(element => element.remove());

                        document.documentElement.classList.remove(
                            'aether-luminous-equipped',
                            'aether-luminous-skill-active'
                        );

                        document.body?.classList.remove(
                            'theme-aether-luminous-stage'
                        );
                    }

                    if (isLotmKlein) {
                        LuxuryLotmKleinRuntime.clear();

                        const container =
                            document.getElementById('virtual-pet-container');

                        container?.classList.remove(
                            'pet-lotm-klein-stage',
                            'lotm-klein-casting'
                        );

                        container
                            ?.querySelectorAll('.lotm-klein-pet-realm')
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove('lotm-klein-pet');

                        document.documentElement.classList.remove(
                            'lotm-klein-equipped',
                            'lotm-klein-skill-active'
                        );

                        document.body?.classList.remove(
                            'theme-lotm-klein-premium'
                        );
                    }

                    if (isCamCoCamMong) {
                        LuxuryCamCoCamMongRuntime.clear();

                        const container =
                            document.getElementById('virtual-pet-container');

                        container?.classList.remove(
                            'pet-cam-co-cam-mong-stage',
                            'cam-co-cam-mong-casting'
                        );

                        container
                            ?.querySelectorAll('.cam-co-cam-mong-pet-realm')
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove('cam-co-cam-mong-pet');

                        document.documentElement.classList.remove(
                            'cam-co-cam-mong-equipped'
                        );

                        document.body?.classList.remove(
                            'theme-cam-co-cam-mong'
                        );
                    }

                    if (isTamonBSide) {
                        LuxuryTamonBSideRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        container?.classList.remove(
                            'pet-tamon-bside-stage',
                            'tamon-bside-pet-casting'
                        );

                        container
                            ?.querySelectorAll(
                                '.tamon-bside-pet-realm'
                            )
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove(
                                'tamon-bside-pet'
                            );

                        document.documentElement.classList.remove(
                            'tamon-bside-equipped'
                        );

                        document.body?.classList.remove(
                            'theme-tamon-bside-stage'
                        );
                    }

                    if (isTamonPinkStatic) {
                        LuxuryTamonPinkStaticRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        container?.classList.remove(
                            'pet-tamon-pinkstatic-stage',
                            'tamon-pinkstatic-casting'
                        );

                        container
                            ?.querySelectorAll(
                                '.tamon-pinkstatic-realm'
                            )
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove(
                                'tamon-pinkstatic-pet'
                            );

                        document.documentElement.classList.remove(
                            'tamon-pinkstatic-equipped'
                        );

                        document.body?.classList.remove(
                            'theme-tamon-pinkstatic-stage'
                        );
                    }

                    if (isMidAutumnMoonPalace) {
                        LuxuryMidAutumnRuntime.clear();

                        const container =
                            document.getElementById('virtual-pet-container');

                        container?.classList.remove(
                            'pet-midautumn-moon-palace-stage',
                            'pet-midautumn-cuoi-stage',
                            'midautumn-pet-casting'
                        );

                        container
                            ?.querySelectorAll('.midautumn-pet-realm')
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove(
                                'midautumn-moon-palace-pet',
                                'midautumn-cuoi-pet'
                            );

                        document.documentElement.classList.remove(
                            'midautumn-moon-palace-equipped',
                            'midautumn-moon-palace-skill-active',
                            'midautumn-cuoi-equipped'
                        );

                        document.body?.classList.remove(
                            'theme-midautumn-moon-palace',
                            'theme-midautumn-cuoi'
                        );
                    }

                    if (isLinkClickCheng) {
                        LuxuryLinkClickChengRuntime.clear();
                    }

                    if (isStarryNight) {
                        LuxuryStarryNightRuntime.clear();
                    }

                    if (isNationalDay) {

                        LuxuryNationalDayRuntime.clear();

                        if (
                            typeof PetManager !== 'undefined' &&
                            typeof PetManager.clearNationalDayRealm ===
                            'function'
                        ) {
                            PetManager.clearNationalDayRealm();
                        }
                    }
                }
            };


        StoreManager.__luxurySpringUnapplyHookInstalled =
            true;
    }

    // ========================================================
    // KHÓA TRANG BỊ GIỮA CỬA HÀNG THƯỜNG / SANG TRỌNG
    // Ngoại lệ: Nền (background) và Khung viền (frame)
    // ========================================================

    const STORE_BOUNDARY_EXEMPT_TYPES =
        new Set([
            'background',
            'frame'
        ]);

    function isStoreBoundaryExempt(item) {
        return STORE_BOUNDARY_EXEMPT_TYPES.has(
            String(item?.type || '')
                .trim()
                .toLowerCase()
        );
    }

    function isLuxuryBoundaryItem(itemOrId) {
        const itemId =
            typeof itemOrId === 'object'
                ? itemOrId?.id
                : itemOrId;

        const item =
            typeof itemOrId === 'object'
                ? itemOrId
                : (
                    typeof StoreManager !== 'undefined'
                        ? StoreManager.getItemById(itemId)
                        : null
                );

        return (
            item?.luxuryOnly === true ||
            LUXURY_ITEM_IDS.includes(
                String(itemId || '')
            )
        );
    }

    // ========================================================
    // DỌN TRẠNG THÁI TRÌNH DUYỆT KHI ĐỔI GIỮA 2 CỬA HÀNG
    // - Tự sửa cả trạng thái cũ từng bị kẹt do chỉ đổi Firebase.
    // - Chỉ dọn pet/theme/effect thuộc cửa hàng ĐỐI DIỆN.
    // - Nền và Khung viền vẫn giữ nguyên.
    // ========================================================
    function getBoundaryActiveItem(storageKey) {
        const activeId = localStorage.getItem(storageKey);

        if (!activeId) {
            return null;
        }

        const item = StoreManager.getItemById(activeId);

        if (!item || isStoreBoundaryExempt(item)) {
            return null;
        }

        return item;
    }

    function isOppositeBoundaryItem(
        item,
        targetIsLuxury
    ) {
        return Boolean(item) &&
            isLuxuryBoundaryItem(item) !== targetIsLuxury;
    }

    function getOppositeStoreBrowserItems(
        targetIsLuxury
    ) {
        const storageKeys = [
            'active_pet',
            'active_theme',
            'active_effect'
        ];

        const items = [];
        const seenIds = new Set();

        storageKeys.forEach(storageKey => {
            const item =
                getBoundaryActiveItem(storageKey);

            if (
                !isOppositeBoundaryItem(
                    item,
                    targetIsLuxury
                )
            ) {
                return;
            }

            const itemId = String(item.id);

            if (seenIds.has(itemId)) {
                return;
            }

            seenIds.add(itemId);
            items.push(item);
        });

        return items;
    }

    function hardClearBoundaryPetRuntime() {
        /*
         * Dọn các runtime Luxury trước.
         * Các hàm này đều nằm trong cùng module luxury-store.js.
         */
        [
            LuxurySpringRuntime,
            LuxurySummerRuntime,
            LuxuryNationalDayRuntime,
            LuxuryNyxRuntime,
            LuxuryAetherRuntime,
            LuxuryTamonBSideRuntime,
            LuxuryTamonPinkStaticRuntime,
            LuxuryLotmKleinRuntime,
            LuxuryCamCoCamMongRuntime,
            LuxuryMidAutumnRuntime,
            LuxuryLinkClickChengRuntime,
            LuxuryStarryNightRuntime
        ].forEach(runtime => {
            try {
                runtime?.clear?.();
            } catch (error) {
                console.warn(
                    '[LuxuryStore] Không thể dọn Luxury pet runtime:',
                    error
                );
            }
        });

        if (typeof PetManager !== 'undefined') {
            [
                'clearSlothDreamRealm',
                'clearBirthday2026Realm',
                'clearPremiumSpringRealm',
                'clearSummerLimitedHa2Realm',
                'clearNationalDayRealm'
            ].forEach(methodName => {
                try {
                    PetManager[methodName]?.call(PetManager);
                } catch (error) {
                    console.warn(
                        `[LuxuryStore] Không thể gọi PetManager.${methodName}():`,
                        error
                    );
                }
            });
        }

        if (
            typeof PetInteractionManager !== 'undefined' &&
            typeof PetInteractionManager.detachEvents === 'function'
        ) {
            try {
                PetInteractionManager.detachEvents({
                    keepLoop: false,
                    removeHungerBar: true
                });
            } catch (error) {
                console.warn(
                    '[LuxuryStore] Không thể dọn tương tác pet:',
                    error
                );
            }
        }

        const container =
            document.getElementById('virtual-pet-container');

        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
            container.style.visibility = 'hidden';
            container.style.opacity = '0';
            container.style.pointerEvents = 'none';
            container.setAttribute('aria-hidden', 'true');
        }

        document
            .querySelectorAll(
                '.nyx-mythic-ultimate,' +
                '.tbc1-fullscreen-ultimate,' +
                '.nd29-independence-flash,' +
                '.nd29-pet-dialogue'
            )
            .forEach(node => node.remove());

        localStorage.removeItem('active_pet');
    }

    function clearOppositeStoreBrowserRuntime(
        targetIsLuxury
    ) {
        /*
         * EFFECT
         * clearEffects(true) xóa cả DOM effect + active_effect,
         * tránh visibilitychange khôi phục lại hiệu ứng cũ.
         */
        const activeEffect =
            getBoundaryActiveItem('active_effect');

        if (
            isOppositeBoundaryItem(
                activeEffect,
                targetIsLuxury
            )
        ) {
            if (
                typeof EffectManager !== 'undefined' &&
                typeof EffectManager.clearEffects === 'function'
            ) {
                EffectManager.clearEffects(true);
            } else {
                localStorage.removeItem('active_effect');
            }
        }

        /*
         * THEME
         * Trả về mặc định rồi xóa active_theme để không tự hồi sinh
         * giao diện cũ ở lần tải trang kế tiếp.
         */
        const activeTheme =
            getBoundaryActiveItem('active_theme');

        if (
            isOppositeBoundaryItem(
                activeTheme,
                targetIsLuxury
            )
        ) {
            if (
                typeof ThemeManager !== 'undefined' &&
                typeof ThemeManager.applyTheme === 'function'
            ) {
                ThemeManager.applyTheme('default');
            }

            localStorage.removeItem('active_theme');
        }

        /* PET */
        const activePet =
            getBoundaryActiveItem('active_pet');

        if (
            isOppositeBoundaryItem(
                activePet,
                targetIsLuxury
            )
        ) {
            hardClearBoundaryPetRuntime();
        }
    }

    async function fullyUnapplyBoundaryConflicts(
        conflicts,
        browserConflictItems,
        inventoryRef,
        targetIsLuxury
    ) {
        /*
         * 1) Gọi đúng luồng GỠ của website cho TỪNG món.
         * Đây là phần logic cũ bị thiếu: trước đây chỉ set
         * isEquipped=false trong Firebase nên DOM/localStorage vẫn còn.
         */
        const uniqueIds = Array.from(
            new Set(
                [
                    ...conflicts.map(
                        conflict => conflict?.item?.id
                    ),
                    ...browserConflictItems.map(
                        item => item?.id
                    )
                ]
                    .filter(Boolean)
                    .map(String)
            )
        );

        for (const conflictItemId of uniqueIds) {
            try {
                await StoreManager.unapplyItem(
                    conflictItemId
                );
            } catch (error) {
                /*
                 * Không dừng toàn bộ quá trình chỉ vì một món gỡ lỗi.
                 * Phần fallback phía dưới vẫn tiếp tục dọn runtime
                 * và ép Firebase về trạng thái đúng.
                 */
                console.error(
                    `[LuxuryStore] Lỗi khi gỡ ${conflictItemId}:`,
                    error
                );
            }
        }

        /*
         * 2) Tự chữa trạng thái từng bị kẹt từ phiên bản cũ.
         * Dựa vào active_pet / active_theme / active_effect hiện tại,
         * chỉ dọn những gì thuộc cửa hàng đối diện với món sắp mặc.
         */
        clearOppositeStoreBrowserRuntime(
            targetIsLuxury
        );

        /*
         * 3) Firebase là lớp chốt cuối cùng.
         * Dù unapplyItem() đã cập nhật, update lại false là idempotent
         * và bảo đảm không còn món đối diện nào mang isEquipped=true.
         */
        const updates = {};

        conflicts.forEach(conflict => {
            updates[
                `${conflict.firebaseKey}/isEquipped`
            ] = false;
        });

        if (Object.keys(updates).length) {
            await inventoryRef.update(updates);
        }
    }

    async function prepareStoreBoundaryEquip(
        itemId
    ) {
        const targetItem =
            StoreManager.getItemById(itemId);

        if (!targetItem) {
            return true;
        }

        /*
         * Nền và Khung viền:
         * không tham gia cơ chế khóa hai cửa hàng.
         */
        if (
            isStoreBoundaryExempt(
                targetItem
            )
        ) {
            return true;
        }

        const user = JSON.parse(
            localStorage.getItem(
                'currentUser'
            ) || 'null'
        );

        if (
            typeof db === 'undefined' ||
            !user?.username
        ) {
            return true;
        }

        const inventoryRef =
            db.ref(
                `student_inventory/${user.username}`
            );

        const snapshot =
            await inventoryRef.once('value');

        const inventory =
            snapshot.val() || {};

        const entries =
            Object.entries(inventory);

        /*
         * Tìm chính vật phẩm người dùng
         * đang muốn trang bị trong kho.
         */
        const targetEntry =
            entries.find(
                ([, inv]) =>
                    String(inv?.id) ===
                    String(itemId)
            ) || null;

        if (!targetEntry) {
            return true;
        }

        const targetIsLuxury =
            isLuxuryBoundaryItem(
                targetItem
            );

        const conflicts = [];

        /*
         * Tìm vật phẩm đang trang bị
         * thuộc cửa hàng ĐỐI DIỆN.
         */
        entries.forEach(
            ([firebaseKey, inv]) => {

                if (
                    inv?.isEquipped !== true
                ) {
                    return;
                }

                if (
                    String(inv.id) ===
                    String(itemId)
                ) {
                    return;
                }

                const equippedItem =
                    StoreManager.getItemById(
                        inv.id
                    );

                if (!equippedItem) {
                    return;
                }

                /*
                 * Nền và Khung viền
                 * luôn được giữ nguyên.
                 */
                if (
                    isStoreBoundaryExempt(
                        equippedItem
                    )
                ) {
                    return;
                }

                const equippedIsLuxury =
                    isLuxuryBoundaryItem(
                        equippedItem
                    );

                if (
                    equippedIsLuxury !==
                    targetIsLuxury
                ) {
                    conflicts.push({
                        firebaseKey,
                        item: equippedItem
                    });
                }
            }
        );

        /*
         * Ngoài Firebase, kiểm tra thêm runtime/localStorage.
         * Đây là lớp tự chữa cho các phiên bản cũ từng chỉ đổi
         * isEquipped=false nhưng không dọn giao diện thật.
         */
        const browserConflictItems =
            getOppositeStoreBrowserItems(
                targetIsLuxury
            );

        /*
         * Không có đồ phía đối diện ở cả Firebase lẫn trình duyệt
         * → mặc bình thường.
         */
        if (
            !conflicts.length &&
            !browserConflictItems.length
        ) {
            return true;
        }

        const oldStore =
            targetIsLuxury
                ? 'Cửa hàng thường'
                : 'Cửa hàng Sang trọng';

        const newStore =
            targetIsLuxury
                ? 'Cửa hàng Sang trọng'
                : 'Cửa hàng thường';

        const equippedNames =
            Array.from(
                new Map(
                    [
                        ...conflicts.map(
                            conflict => conflict.item
                        ),
                        ...browserConflictItems
                    ].map(item => [
                        String(item.id),
                        item
                    ])
                ).values()
            )
                .map(item => `• ${item.name}`)
                .join('\n');

        const agreed =
            confirm(
                `⚠️ Bạn đang trang bị vật phẩm từ ${oldStore}:\n\n` +
                `${equippedNames}\n\n` +

                `Bạn không thể đồng thời trang bị vật phẩm ` +
                `giữa Cửa hàng thường và Cửa hàng Sang trọng.\n\n` +

                `Nếu tiếp tục, hệ thống sẽ gỡ các vật phẩm trên ` +
                `và trang bị [${targetItem.name}] từ ${newStore}.\n\n` +

                `Nền và Khung viền sẽ KHÔNG bị gỡ.\n\n` +

                `Bạn có đồng ý không?`
            );

        if (!agreed) {

            /*
             * Trường hợp vừa MUA món mới:
             * logic mua hiện tại có thể đã đặt
             * isEquipped = true trước khi gọi applyItem().
             *
             * Nếu người dùng bấm Hủy,
             * đưa món mới về chưa trang bị,
             * nhưng KHÔNG xóa khỏi kho.
             */
            const [
                targetFirebaseKey,
                targetInventoryItem
            ] = targetEntry;

            if (
                targetInventoryItem
                    ?.isEquipped === true
            ) {
                await inventoryRef
                    .child(targetFirebaseKey)
                    .update({
                        isEquipped: false
                    });
            }

            return false;
        }

        /*
         * Người dùng đồng ý:
         * GỠ THẬT toàn bộ vật phẩm của cửa hàng đối diện.
         * Không chỉ đổi cờ Firebase như logic cũ.
         */
        await fullyUnapplyBoundaryConflicts(
            conflicts,
            browserConflictItems,
            inventoryRef,
            targetIsLuxury
        );

        return true;
    }


    // ========================================================
    // BỌC StoreManager.applyItem()
    // ========================================================

    function installStoreBoundaryEquipGuard(
        attempt = 0
    ) {
        /*
         * Chờ student.js tạo xong
         * applyItem + unapplyItem cuối cùng.
         */
        if (
            typeof StoreManager === 'undefined' ||
            typeof StoreManager.applyItem !==
            'function' ||
            typeof StoreManager.unapplyItem !==
            'function'
        ) {
            if (attempt < 100) {
                setTimeout(
                    () =>
                        installStoreBoundaryEquipGuard(
                            attempt + 1
                        ),
                    100
                );
            }

            return;
        }

        /*
         * Không bọc trùng nhiều lần.
         */
        if (
            StoreManager
                .__storeBoundaryEquipGuardInstalled
        ) {
            return;
        }

        const originalApplyItem =
            StoreManager.applyItem.bind(
                StoreManager
            );

        StoreManager.applyItem =
            async function (itemId) {

                const executeBoundaryEquip = async () => {
                    if (window.isStudentStoreSystemOpen?.() === false) {
                        window.showStudentStoreSystemLocked?.();
                        return false;
                    }

                    if (
                        typeof window.assertStudentStoreLiveAccessAllowed === 'function' &&
                        !await window.assertStudentStoreLiveAccessAllowed(
                            itemId,
                            'trang bị vật phẩm'
                        )
                    ) {
                        return false;
                    }

                    try {
                        const allowed =
                            await prepareStoreBoundaryEquip(
                                itemId
                            );

                        /*
                         * Người dùng chọn Hủy.
                         */
                        if (!allowed || window.isStudentStoreSystemOpen?.() === false) {
                            return false;
                        }

                        /*
                         * Không xung đột hoặc người dùng đã đồng ý.
                         * originalApplyItem dùng cùng equip lease do student.js giữ.
                         */
                        return await originalApplyItem(
                            itemId
                        );

                    } catch (error) {
                        console.error(
                            '[LuxuryStore] Lỗi kiểm tra trang bị:',
                            error
                        );

                        alert(
                            '❌ Không thể kiểm tra trạng thái trang bị. ' +
                            'Vui lòng thử lại.'
                        );

                        return false;
                    }
                };

                if (
                    typeof window.withStudentStoreEquipLock === 'function' &&
                    !window.isStudentStoreEquipLockHeldFor?.(itemId)
                ) {
                    return window.withStudentStoreEquipLock(
                        itemId,
                        executeBoundaryEquip
                    );
                }

                return executeBoundaryEquip();
            };

        StoreManager
            .__storeBoundaryEquipGuardInstalled =
            true;
    }


    // Đăng ký vào StoreConfig
    // Đăng ký các vật phẩm Luxury thủ công vào StoreConfig.
    // Vật phẩm Quốc khánh được đăng ký ở đây để module sự kiện
    // có thể trao trực tiếp bằng ID mà không cần mua qua cửa hàng.
    if (
        typeof StoreConfig !== 'undefined' &&
        Array.isArray(StoreConfig.items)
    ) {
        [
            SPRING_PREMIUM_PET,
            SUMMER_PREMIUM_PET,
            NATIONAL_DAY_PREMIUM_PET,
            MYTHIC_NYX_PET,
            MYTHIC_AETHER_PET,
            STARRY_NIGHT_PREMIUM_PET,
            LOTM_KLEIN_EVENT_PET,
            CAM_CO_CAM_MONG_PET,
            TAMON_BSIDE_PET,
            TAMON_PINKSTATIC_PET,
            MID_AUTUMN_MOON_PET,
            MID_AUTUMN_CUOI_PET,
            LINKCLICK_CHENG_XIAOSHI_PET
        ].forEach(itemDefinition => {
            const existing = StoreConfig.items.find(
                item =>
                    String(item?.id) ===
                    String(itemDefinition.id)
            );

            if (!existing) {
                StoreConfig.items.push(
                    itemDefinition
                );
                return;
            }

            /*
             * Đồng bộ các trường bất biến của vật phẩm sự kiện.
             * Không để cấu hình giá động biến nó thành vật phẩm Coin.
             */
            if (
                itemDefinition.id ===
                NATIONAL_DAY_PREMIUM_PET.id ||
                itemDefinition.id ===
                LOTM_KLEIN_EVENT_PET.id ||
                itemDefinition.id ===
                CAM_CO_CAM_MONG_PET.id ||
                itemDefinition.id ===
                STARRY_NIGHT_PREMIUM_PET.id ||
                itemDefinition.id ===
                TAMON_BSIDE_PET.id ||
                itemDefinition.id ===
                TAMON_PINKSTATIC_PET.id ||
                itemDefinition.id ===
                MID_AUTUMN_MOON_PET.id ||
                itemDefinition.id ===
                MID_AUTUMN_CUOI_PET.id ||
                itemDefinition.id ===
                LINKCLICK_CHENG_XIAOSHI_PET.id
            ) {
                Object.assign(
                    existing,
                    itemDefinition
                );
            }
        });
    }

    // ========================================================
    // ẨN VẬT PHẨM PREMIUM KHỎI CỬA HÀNG THƯỜNG
    // ========================================================

    if (
        typeof StoreManager !== 'undefined' &&
        !StoreManager.__luxuryFilterInstalled
    ) {
        const originalGetItemsByType =
            StoreManager.getItemsByType.bind(
                StoreManager
            );

        StoreManager.getItemsByType =
            function (type) {

                return originalGetItemsByType(type)
                    .filter(
                        item =>
                            item.luxuryOnly !== true
                    );
            };

        StoreManager.__luxuryFilterInstalled =
            true;
    }


    const IDS = {
        button: 'luxuryStoreOpenButton',
        page: 'luxuryStorePage',
        grid: 'luxuryStoreGrid'
    };

    // ========================================================
    // TRẠNG THÁI KHO RIÊNG CỦA LUXURY STORE
    // ========================================================

    let luxuryInventoryState = {};


    function findInventoryItemById(
        inventory,
        itemId
    ) {
        const wantedId = String(itemId ?? '');

        if (!wantedId) {
            return null;
        }

        if (Array.isArray(inventory)) {
            return inventory.find(
                inv =>
                    String(inv?.id ?? '') ===
                    wantedId
            ) || null;
        }

        if (
            inventory &&
            typeof inventory === 'object'
        ) {
            return Object
                .values(inventory)
                .find(
                    inv =>
                        String(inv?.id ?? '') ===
                        wantedId
                ) || null;
        }

        return null;
    }


    function getLuxuryInventoryItem(itemId) {

        /*
         * Nguồn chính của trang học sinh là window.myInventory.
         * Luxury Store vẫn giữ listener riêng để render tức thời,
         * nhưng không được coi biến local là nguồn duy nhất.
         *
         * Điều này tránh trường hợp module Luxury được lazy-load/reload
         * sau khi inventory chính đã về: card không được phép hiện
         * "Mua" cho món thực tế vẫn còn trong Firebase.
         */
        const mainInventoryItem =
            findInventoryItemById(
                window.myInventory,
                itemId
            );

        if (mainInventoryItem) {
            return mainInventoryItem;
        }

        const bridgeInventoryItem =
            findInventoryItemById(
                window.__luxuryInventoryBridgeState
                    ?.inventory,
                itemId
            );

        if (bridgeInventoryItem) {
            return bridgeInventoryItem;
        }

        return findInventoryItemById(
            luxuryInventoryState,
            itemId
        );
    }


    const luxuryPurchasesInFlight = new Set();
    async function buyLuxuryItemSafely(itemId) {
        const key = String(itemId);
        if (luxuryPurchasesInFlight.has(key)) return false;
        luxuryPurchasesInFlight.add(key);
        try {
            return await buyLuxuryItemChecked(key);
        } finally {
            luxuryPurchasesInFlight.delete(key);
        }
    }

    async function buyLuxuryItemChecked(itemId) {
        let user;
        try { user = JSON.parse(localStorage.getItem('currentUser') || 'null'); }
        catch (_) { user = null; }
        if (typeof db === 'undefined' || !user?.username) {
            alert('Chưa xác định được tài khoản. Vui lòng đăng nhập lại.');
            return false;
        }
        let upgradingFromTrial = false;

        /*
         * Chốt chống mua lại:
         * trước khi gọi luồng thanh toán chung, kiểm tra trực tiếp Firebase.
         * Nếu item đã tồn tại thì chỉ đồng bộ UI, tuyệt đối không trừ Coin lần nữa.
         */
        if (
            typeof db !== 'undefined' &&
            user?.username
        ) {
            try {
                const itemRef =
                    db.ref(
                        `student_inventory/${user.username}/${itemId}`
                    );

                const snapshot =
                    await itemRef.once('value');

                const existingItem =
                    snapshot.val();

                if (existingItem?.isTrial === true) {
                    if (Number(existingItem.trialExpiry || 0) <= Date.now()) {
                        alert('Lượt dùng thử đã hết hạn. Vui lòng chờ kho cập nhật rồi thử lại.');
                        return false;
                    }
                    upgradingFromTrial = true;
                }
                if (
                    existingItem && existingItem.isTrial !== true &&
                    String(existingItem.id ?? '') ===
                        String(itemId)
                ) {
                    luxuryInventoryState = {
                        ...(luxuryInventoryState || {}),
                        [String(itemId)]: existingItem
                    };

                    window.__luxuryInventoryBridgeState = {
                        username:
                            String(user.username),
                        inventory: {
                            ...(
                                window.__luxuryInventoryBridgeState
                                    ?.inventory || {}
                            ),
                            [String(itemId)]:
                                existingItem
                        }
                    };

                    renderLuxuryStore();

                    alert(
                        '✅ Vật phẩm này vẫn đang có trong kho của bạn. ' +
                        'Hệ thống đã đồng bộ lại trạng thái sở hữu.'
                    );

                    return false;
                }
            } catch (error) {
                console.warn(
                    '[LuxuryStore] Không thể kiểm tra quyền sở hữu trước khi mua:',
                    error
                );
                alert('Không kiểm tra được kho vật phẩm. Vui lòng thử lại khi kết nối ổn định.');
                return false;
            }
        }

        if (
            typeof window.buyItem === 'function'
        ) {
            return window.buyItem(itemId, upgradingFromTrial, 'luxury');
        }

        console.error(
            '[LuxuryStore] Không tìm thấy hàm buyItem().'
        );

        return false;
    }


    function installLuxuryInventoryListener() {

        const user = JSON.parse(
            localStorage.getItem('currentUser') || 'null'
        );

        /*
         * Nếu Firebase/chủ tài khoản chưa sẵn sàng
         * thì thử lại.
         */
        if (
            typeof db === 'undefined' ||
            !user?.username
        ) {
            setTimeout(
                installLuxuryInventoryListener,
                300
            );

            return;
        }


        const username =
            String(user.username);

        const bridgeState =
            window.__luxuryInventoryBridgeState;

        /*
         * Bản cũ chỉ dùng một boolean global. Nếu luxury-store.js bị nạp lại,
         * module mới có luxuryInventoryState = {} nhưng lại không được gắn
         * listener mới => toàn bộ card bị hiểu nhầm là chưa mua.
         *
         * Bản mới chỉ tái sử dụng listener khi đã có bridge state đúng user.
         * Nếu gặp cờ boolean cũ mà không có bridge dữ liệu, cho phép gắn lại.
         */
        if (
            window.__luxuryInventoryListeningUser ===
                username &&
            bridgeState?.username === username
        ) {
            luxuryInventoryState =
                bridgeState.inventory || {};

            return;
        }

        window.__luxuryInventoryListeningUser =
            username;

        const inventoryRef =
            db.ref(
                `student_inventory/${username}`
            );

        inventoryRef.on(
            'value',
            snapshot => {

                luxuryInventoryState =
                    snapshot.val() || {};

                window.__luxuryInventoryBridgeState = {
                    username,
                    inventory:
                        luxuryInventoryState
                };

                // ====================================================
                // Nếu Xuân Thần đã được gỡ trên Firebase
                // thì tuyệt đối không để Runtime Luxury tồn tại.
                // ====================================================

                const equippedLuxurySpring =
                    Object
                        .values(
                            luxuryInventoryState || {}
                        )
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_luxury_mua_xuan' &&
                                item?.isEquipped === true
                        );


                if (!equippedLuxurySpring) {

                    LuxurySpringRuntime.clear();

                    document.documentElement
                        .classList.remove(
                            'premium-spring-sanctuary-equipped'
                        );
                }

                const equippedLuxurySummer =
                    Object
                        .values(
                            luxuryInventoryState || {}
                        )
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_luxury_mua_ha' &&
                                item?.isEquipped === true
                        );

                if (!equippedLuxurySummer) {
                    LuxurySummerRuntime.clear();
                }

                const equippedMythicNyx =
                    Object
                        .values(
                            luxuryInventoryState || {}
                        )
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_mythic_nyx_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedMythicNyx) {
                    LuxuryNyxRuntime.clear();
                }


                const equippedMythicAether =
                    Object
                        .values(
                            luxuryInventoryState || {}
                        )
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_mythic_aether_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedMythicAether) {
                    LuxuryAetherRuntime.clear();
                }

                const equippedLotmKlein =
                    Object
                        .values(luxuryInventoryState || {})
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_lotm_klein_event_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedLotmKlein) {
                    LuxuryLotmKleinRuntime.clear();
                }

                const equippedCamCoCamMong =
                    Object
                        .values(luxuryInventoryState || {})
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_cam_co_cam_mong_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedCamCoCamMong) {
                    LuxuryCamCoCamMongRuntime.clear();
                }

                const equippedMidAutumnMoonPalace =
                    Object
                        .values(luxuryInventoryState || {})
                        .find(
                            item =>
                                (
                                    String(item?.id) ===
                                        'pet_trung_thu_nguyet_cung_tien_tu' ||
                                    String(item?.id) ===
                                        'pet_trung_thu_chu_cuoi_2'
                                ) &&
                                item?.isEquipped === true
                        );

                if (!equippedMidAutumnMoonPalace) {
                    LuxuryMidAutumnRuntime.clear();
                }

                const equippedStarryNight =
                    Object
                        .values(luxuryInventoryState || {})
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_dem_day_sao_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedStarryNight) {
                    LuxuryStarryNightRuntime.clear();
                }

                const equippedLinkClickCheng =
                    Object
                        .values(luxuryInventoryState || {})
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_linkclick_cheng_xiaoshi_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedLinkClickCheng) {
                    LuxuryLinkClickChengRuntime.clear();
                }
/*
                 * Khi Firebase thay đổi:
                 * render lại Luxury Store ngay.
                 */
                const page =
                    document.getElementById(
                        IDS.page
                    );

                if (
                    page &&
                    page.hidden !== true
                ) {
                    renderLuxuryStore();
                }
            },
            error => {
                console.error(
                    '[LuxuryStore] Lỗi listener kho Luxury:',
                    error
                );

                if (
                    window.__luxuryInventoryListeningUser ===
                    username
                ) {
                    delete window
                        .__luxuryInventoryListeningUser;
                }

                window.setTimeout(
                    installLuxuryInventoryListener,
                    700
                );
            }
        );
    }

    // ========================================================
    // 2. ESCAPE HTML
    // ========================================================
    function escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    // ========================================================
    // 3. LẤY DANH SÁCH VẬT PHẨM THỦ CÔNG
    // ========================================================
    function getLuxuryItems() {

        if (
            typeof StoreConfig === 'undefined' ||
            !StoreConfig ||
            !Array.isArray(StoreConfig.items)
        ) {
            return [];
        }

        return StoreConfig.items.filter(item =>
            LUXURY_ITEM_IDS.includes(
                String(item?.id ?? '')
            )
        );
    }


    // ========================================================
    // 4. TẠO CARD
    // ========================================================
    function renderCard(item) {

        const name =
            escapeHTML(
                item.name || 'Vật phẩm'
            );

        const image =
            escapeHTML(
                item.image ||
                item.asset ||
                item.value ||
                ''
            );

        const id =
            escapeHTML(item.id);

        // ====================================================
        // KHÓA BỞI GIÁO VIÊN · HOTFIX v4.0.1
        // Chỉ render một placeholder khóa duy nhất.
        // Không render ảnh / tên / nút của vật phẩm ở phía dưới.
        // ====================================================
        if (item.isLocked === true) {
            return `
                <article
                    class="
                        luxury-product-card
                        luxury-teacher-locked-card
                        is-teacher-locked
                        ui-theme-immune
                    "
                    data-locked-by-teacher="true"
                    aria-label="Vật phẩm đang cập nhật, sẽ xuất hiện trong tương lai"
                >
                    <div
                        class="store-teacher-lock-overlay"
                        role="status"
                        title="Vật phẩm đang cập nhật, sẽ xuất hiện trong tương lai"
                    >
                        <div class="store-teacher-lock-content">
                            <span
                                class="store-teacher-lock-question"
                                aria-hidden="true"
                            >?</span>

                            <strong>
                                Vật phẩm đang cập nhật
                            </strong>

                            <small>
                                Sẽ xuất hiện trong tương lai.
                            </small>
                        </div>
                    </div>
                </article>
            `;
        }

        const inventoryItem =
            getLuxuryInventoryItem(item.id);

        const isOwned = Boolean(inventoryItem) &&
            (inventoryItem.isTrial !== true || Number(inventoryItem.trialExpiry || 0) > Date.now());

        const isEquipped =
            isOwned && inventoryItem?.isEquipped === true;

        // ====================================================
        // CARD RIÊNG QUỐC KHÁNH
        // Hoàn toàn độc lập với card Mùa Xuân và theme toàn web.
        // ====================================================
        if (item.id === 'pet_quoc_khanh_1') {

            const tagImage = escapeHTML(
                item.luxuryTagImage || ''
            );

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
            <button
                type="button"
                class="
                    national-day-premium-use-button
                    national-day-premium-event-button
                "
                disabled
                aria-disabled="true"
            >
                🎁 Nhận từ sự kiện · 10/10
            </button>
        `;
            } else if (isEquipped) {
                actionHTML = `
            <button
                type="button"
                class="
                    national-day-premium-use-button
                    is-equipped
                "
                onclick="
                    StoreManager.unapplyItem(
                        '${id}'
                    )
                "
            >
                ✕ Gỡ
            </button>
        `;
            } else {
                actionHTML = `
            <button
                type="button"
                class="national-day-premium-use-button"
                onclick="
                    StoreManager.applyItem(
                        '${id}'
                    )
                "
            >
                ★ Sử dụng
            </button>
        `;
            }

            return `
        <article
            class="
                luxury-product-card
                national-day-premium-card
                store-theme-locked
                ui-theme-immune
            "
            data-item-id="${id}"
            data-theme-immune="true"
            data-luxury-style="national-day"
            tabindex="0"
        >
            <div class="national-day-premium-card__visual">

                <div class="nd-card-lacquer"></div>
                <div class="nd-card-drum-disc"></div>
                <div class="nd-card-drum-ring ring-a"></div>
                <div class="nd-card-drum-ring ring-b"></div>

                <div
                    class="nd-card-rays"
                    aria-hidden="true"
                ></div>

                <div
                    class="nd-card-bronze-field"
                    aria-hidden="true"
                >
                    <i style="--i:0"></i>
                    <i style="--i:1"></i>
                    <i style="--i:2"></i>
                    <i style="--i:3"></i>
                    <i style="--i:4"></i>
                    <i style="--i:5"></i>
                    <i style="--i:6"></i>
                    <i style="--i:7"></i>
                    <i style="--i:8"></i>
                    <i style="--i:9"></i>
                    <i style="--i:10"></i>
                    <i style="--i:11"></i>
                </div>

                ${tagImage
                    ? `
                        <div
                            class="national-day-premium-tag-shell"
                            aria-hidden="true"
                        >
                            <img
                                src="${tagImage}"
                                alt="Quốc khánh"
                                class="national-day-premium-tag"
                                draggable="false"
                            >
                        </div>
                    `
                    : ''
                }

                <img
                    src="${image}"
                    alt="${name}"
                    class="national-day-premium-character"
                    draggable="false"
                >

                <div class="national-day-premium-details">
                    <div class="national-day-premium-type">
                        🇻🇳 THÚ CƯNG PREMIUM · QUỐC KHÁNH
                    </div>

                    <h3>${name}</h3>

                    <p class="national-day-premium-description">
    Linh thú Quốc khánh mang biểu tượng
    hồn thiêng sông núi, khí phách dân tộc
    và ánh sáng độc lập của Việt Nam.
</p>

                    <div class="national-day-premium-source">
                        🎖️ Phần thưởng Lịch sử hào hùng · Mốc 10/10
                    </div>

                    ${actionHTML}
                </div>
            </div>
        </article>
    `;
        }



        // ====================================================
        // CARD LORD OF THE MYSTERIES · KLEIN
        // Giữ nguyên bố cục chuẩn Luxury:
        // visual -> info -> label -> title -> price/source -> action.
        // Chỉ skin riêng bằng CSS, không đổi flow/kích thước của grid.
        // ====================================================
        if (item.id === 'pet_lotm_klein_event_1') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/quỷ bí/tag1.png'
            );

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="lotm-klein-card-action"
                        disabled
                        aria-disabled="true"
                        title="Vật phẩm này chỉ nhận từ sự kiện Lord of the Mysteries"
                    >
                        🎁 Nhận từ sự kiện
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="lotm-klein-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="lotm-klein-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ◈ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card lotm-klein-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="lotm-klein-event-premium"
                    data-theme-immune="true"
                    data-luxury-style="lotm-klein-event"
                    tabindex="0"
                >
                    <div class="luxury-product-visual lotm-klein-card-visual">
                        <div class="luxury-product-shape lotm-klein-card-shape"></div>
                        <div class="lotm-klein-card-fog" aria-hidden="true"></div>
                        <div class="lotm-klein-card-clock" aria-hidden="true"></div>
                        <div class="lotm-klein-card-eye" aria-hidden="true"></div>

                        <div
                            class="lotm-klein-card-tag"
                            aria-label="Lord of the Mysteries"
                        >
                            <img
                                src="${tagImage}"
                                alt="Lord of the Mysteries"
                                class="lotm-klein-card-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image lotm-klein-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info lotm-klein-card-info">
                        <span class="luxury-product-label lotm-klein-card-label">
                            LORD OF THE MYSTERIES
                        </span>

                        <h3>${name}</h3>

                        <div class="luxury-product-price lotm-klein-card-price">
                            🎁 Phần thưởng sự kiện
                        </div>

                        ${actionHTML}
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD CẦM CƠ · CẦM MỘNG
        // Đồng bộ cấu trúc Premium đang dùng trong cùng grid:
        // article -> visual toàn thẻ -> tag/nhân vật -> details overlay.
        // Details ẩn mặc định, trượt lên khi hover/focus giống các thẻ Premium khác.
        // Card khóa theme để không bị vật phẩm giao diện khác nhuộm màu.
        // ====================================================
        if (item.id === 'pet_cam_co_cam_mong_1') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Tu tiên/cam_co_tag1.png'
            );

            const price = Number(item.price) || 12000;
            const formattedPrice = price.toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="cam-co-cam-mong-action cam-co-cam-mong-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="cam-co-cam-mong-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="cam-co-cam-mong-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ♪ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card cam-co-cam-mong-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="cam-co-cam-mong-premium"
                    data-theme-immune="true"
                    data-luxury-style="cam-co-cam-mong"
                    tabindex="0"
                >
                    <div class="cam-co-cam-mong-card-visual">
                        <div class="cam-co-cam-mong-card-shape" aria-hidden="true"></div>
                        <div class="cam-co-card-moon" aria-hidden="true"></div>
                        <div class="cam-co-card-qin" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>
                        <div class="cam-co-card-cloud cloud-a" aria-hidden="true"></div>
                        <div class="cam-co-card-cloud cloud-b" aria-hidden="true"></div>

                        <div class="cam-co-cam-mong-tag" aria-label="Cầm Mộng">
                            <img
                                src="${tagImage}"
                                alt="Cầm Mộng"
                                class="cam-co-cam-mong-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="cam-co-cam-mong-character"
                            draggable="false"
                        >

                        <div class="cam-co-cam-mong-card-info">
                            <span class="cam-co-cam-mong-card-label">
                                CẦM MỘNG · TU TIÊN
                            </span>

                            <h3>${name}</h3>

                            <div class="cam-co-cam-mong-card-price">
                                🪙 ${formattedPrice} Coin
                            </div>

                            ${actionHTML}
                        </div>
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG TAMON'S B-SIDE
        // Dùng CHÍNH bố cục card Luxury thường:
        // visual -> info -> label -> title -> price -> action.
        // Chỉ skin bằng CSS riêng, không đổi kích thước / flow của grid.
        // ====================================================
        if (item.id === 'pet_tamon_b_side_1') {

            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Tamon/tamon-tag1.png'
            );

            const price =
                Number(item.price) || 15000;

            const formattedPrice =
                price.toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-bside-card-action tamon-bside-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-bside-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-bside-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ▶ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card tamon-bside-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="tamon-b-side-premium"
                    data-theme-immune="true"
                    data-luxury-style="tamon-b-side"
                    tabindex="0"
                >
                    <div class="luxury-product-visual tamon-bside-card-visual">
                        <div class="luxury-product-shape tamon-bside-card-shape"></div>
                        <div class="tamon-bside-card-eq" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>

                        <div class="tamon-bside-card-tag" aria-label="Tamon's B-Side">
                            <img
                                src="${tagImage}"
                                alt="Tamon's B-Side"
                                class="tamon-bside-card-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image tamon-bside-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info tamon-bside-card-info">
                        <span class="luxury-product-label tamon-bside-card-label">
                            TAMON'S B-SIDE
                        </span>

                        <h3>${name}</h3>

                        <div class="luxury-product-price tamon-bside-card-price">
                            🪙 ${formattedPrice} Coin
                        </div>

                        ${actionHTML}
                    </div>
                </article>
            `;
        }



        // ====================================================
        // CARD TAMON · PINK STATIC
        // Giữ ĐÚNG flow Luxury: visual -> info -> label -> title -> price -> action.
        // Chỉ đổi skin bằng namespace tamon-pinkstatic-*.
        // ====================================================
        if (item.id === 'pet_tamon_b_side_2') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Tamon/tamon-tag1.png'
            );

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-pinkstatic-card-action tamon-pinkstatic-event-lock"
                        disabled
                        title="Vật phẩm này nhận từ sự kiện"
                    >
                        🎁 Nhận từ sự kiện
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-pinkstatic-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-pinkstatic-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ▶ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card tamon-pinkstatic-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="tamon-pink-static-premium"
                    data-theme-immune="true"
                    data-luxury-style="tamon-pink-static"
                    tabindex="0"
                >
                    <div class="luxury-product-visual tamon-pinkstatic-card-visual">
                        <div class="luxury-product-shape tamon-pinkstatic-card-shape"></div>
                        <div class="tamon-pinkstatic-card-tape" aria-hidden="true"></div>
                        <div class="tamon-pinkstatic-card-eq" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>

                        <div class="tamon-pinkstatic-card-tag" aria-label="Tamon's B-Side">
                            <img
                                src="${tagImage}"
                                alt="Tamon's B-Side"
                                class="tamon-pinkstatic-card-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image tamon-pinkstatic-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info tamon-pinkstatic-card-info">
                        <span class="luxury-product-label tamon-pinkstatic-card-label">
                            TAMON'S B-SIDE
                        </span>
                        <h3>${name}</h3>
                        <div class="luxury-product-price tamon-pinkstatic-card-price">
                            🎁 Phần thưởng sự kiện
                        </div>
                        ${actionHTML}
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG AETHER · THẦN THOẠI
        // Đồng bộ bố cục Premium full-art đang đứng cạnh Aether:
        // article -> visual toàn thẻ -> tag/nhân vật -> details overlay.
        // Details trượt lên khi hover/focus; outer card không cao hơn các thẻ khác.
        // ====================================================
        if (item.id === 'pet_mythic_aether_1') {
            ensureAetherStylesheet();

            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Thần thoại/aether-tag2.png'
            );
            const formattedPrice =
                Number(item.price || 15000)
                    .toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="aether-mythic-action aether-mythic-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="aether-mythic-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="aether-mythic-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ✦ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card aether-mythic-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="mythic-aether"
                    data-theme-immune="true"
                    data-luxury-style="mythic-aether"
                    tabindex="0"
                >
                    <div class="aether-mythic-visual">
                        <div class="aether-card-shape"></div>
                        <div class="aether-card-sun" aria-hidden="true">
                            <i class="ring ring-a"></i>
                            <i class="ring ring-b"></i>
                            <i class="ring ring-c"></i>
                        </div>
                        <div class="aether-card-stars" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i>
                            <i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>
                        <div class="aether-card-veil" aria-hidden="true"></div>

                        <img
                            src="${tagImage}"
                            alt="Thần thoại"
                            class="aether-mythic-tag-art"
                            draggable="false"
                        >

                        <img
                            src="${image}"
                            alt="${name}"
                            class="aether-mythic-character"
                            draggable="false"
                        >

                        <div class="aether-mythic-info">
                            <span class="aether-mythic-label">
                                ✦ THÚ CƯNG PREMIUM · THẦN THOẠI
                            </span>
                            <h3>${name}</h3>
                            <p class="aether-mythic-description">
                                Thần bầu trời sáng, kết tinh của thiên quang nguyên sơ; khi đồng hành sẽ mở ra Thánh Vực Thiên Quang rực rỡ trên toàn website.
                            </p>
                            <div class="aether-mythic-price">
                                🪙 Giá bán: ${formattedPrice} Coin
                            </div>
                            ${actionHTML}
                        </div>
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG · ĐÊM ĐẦY SAO
        // Vẫn dùng cấu trúc chuẩn: article -> visual -> info -> action.
        // Card tự khóa theme để không bị skin giao diện khác nhuộm màu.
        // ====================================================
        if (item.id === 'pet_dem_day_sao_1') {
            ensureStarryNightStylesheet();

            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/đêm đầy sao/tag.png'
            );

            const formattedPrice =
                Number(item.price || 12000)
                    .toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="starry-night-card-action starry-night-card-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="starry-night-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="starry-night-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ✦ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card starry-night-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="starry-night-premium"
                    data-theme-immune="true"
                    data-luxury-style="starry-night"
                    tabindex="0"
                >
                    <div class="luxury-product-visual starry-night-card-visual">
                        <div class="luxury-product-shape starry-night-card-shape"></div>
                        <div class="starry-night-card-swirls" aria-hidden="true"></div>
                        <div class="starry-night-card-stars" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>
                        <div class="starry-night-card-hills" aria-hidden="true"></div>

                        <div class="starry-night-card-tag" aria-label="Đêm đầy sao">
                            <img
                                src="${tagImage}"
                                alt="Đêm đầy sao"
                                class="starry-night-card-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image starry-night-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info starry-night-card-info">
                        <span class="luxury-product-label starry-night-card-label">
                            ✦ THÚ CƯNG PREMIUM · ĐÊM ĐẦY SAO
                        </span>
                        <h3>${name}</h3>
                        <p class="starry-night-card-description">
                            Bầu trời xoáy sắc cobalt và vàng kim, lấy cảm hứng từ nhịp cọ giàu chuyển động của “Đêm đầy sao”.
                        </p>
                        <div class="luxury-product-price starry-night-card-price">
                            🪙 Giá bán: ${formattedPrice} Coin
                        </div>
                        ${actionHTML}
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG NYX · THẦN THOẠI
        // Namespace riêng: nyx-mythic-*
        // Không dùng class card của Mùa Xuân / Quốc khánh.
        // ====================================================
        if (item.id === 'pet_mythic_nyx_1') {

            ensureNyxStylesheet();

            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Thần thoại/nyx-tag1.png'
            );

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="nyx-mythic-action nyx-mythic-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua 12.000 Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="nyx-mythic-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="nyx-mythic-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ☾ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card nyx-mythic-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="mythic-nyx"
                    data-theme-immune="true"
                    data-luxury-style="mythic-nyx"
                    tabindex="0"
                >
                    <div class="nyx-mythic-visual">
                        <div class="nyx-mythic-nightglass" aria-hidden="true"></div>
                        <div class="nyx-mythic-eclipse" aria-hidden="true">
                            <span class="nyx-mythic-eclipse-core"></span>
                            <span class="nyx-mythic-eclipse-ring ring-a"></span>
                            <span class="nyx-mythic-eclipse-ring ring-b"></span>
                        </div>

                        <div class="nyx-mythic-constellation" aria-hidden="true">
                            <i style="--i:0"></i><i style="--i:1"></i>
                            <i style="--i:2"></i><i style="--i:3"></i>
                            <i style="--i:4"></i><i style="--i:5"></i>
                            <i style="--i:6"></i><i style="--i:7"></i>
                            <i style="--i:8"></i><i style="--i:9"></i>
                            <i style="--i:10"></i><i style="--i:11"></i>
                        </div>

                        <div
    class="nyx-mythic-tag"
    aria-label="Thần thoại"
>
    <img
        src="${tagImage}"
        alt="Thần thoại"
        class="nyx-mythic-tag-art"
        draggable="false"
    >
</div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="nyx-mythic-character"
                            draggable="false"
                        >

                        <div class="nyx-mythic-details">
                            <div class="nyx-mythic-type">☾ THÚ CƯNG PREMIUM · THẦN THOẠI</div>
                            <h3>${name}</h3>
                            <p>
                                Quyền năng của màn đêm nguyên sơ: nguyệt thực,
                                tinh tú và những dải bóng tối chuyển động quanh Nyx.
                            </p>
                            <div class="nyx-mythic-price">🪙 Giá bán: 12.000 Coin</div>
                            ${actionHTML}
                        </div>
                    </div>
                </article>
            `;
        }



        // ====================================================
        // CARD RIÊNG LINK CLICK · CHENG XIAOSHI
        // Giữ nguyên bố cục card chuẩn: visual -> info -> action.
        // Chỉ đổi skin/thành phần trang trí bên trong card này.
        // ====================================================
        if (item.id === 'pet_linkclick_cheng_xiaoshi_1') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Lock/tag1.png'
            );

            const formattedPrice =
                Number(item.price || 12000)
                    .toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="linkclick-card-action linkclick-card-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="linkclick-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="linkclick-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ▶ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card linkclick-premium-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="linkclick-cheng-xiaoshi"
                    data-theme-immune="true"
                    data-luxury-style="linkclick"
                    tabindex="0"
                >
                    <div class="luxury-product-visual linkclick-card-visual">
                        <div class="luxury-product-shape linkclick-card-shape"></div>
                        <div class="linkclick-card-grid" aria-hidden="true"></div>
                        <div class="linkclick-card-focus" aria-hidden="true"></div>
                        <div class="linkclick-card-film film-a" aria-hidden="true"></div>
                        <div class="linkclick-card-film film-b" aria-hidden="true"></div>

                        <div class="linkclick-card-tag" aria-label="Link Click">
                            <img
                                src="${tagImage}"
                                alt="Link Click"
                                class="linkclick-card-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image linkclick-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info linkclick-card-info">
                        <span class="luxury-product-label linkclick-card-label">
                            LINK CLICK · PREMIUM PET
                        </span>

                        <h3>${name}</h3>

                        <p class="linkclick-card-description">
                            Hiệu ứng Thời Quang Ảnh Quán: khung ảnh, màn trập,
                            timecode và chuyển động thời gian phủ toàn website.
                        </p>

                        <div class="luxury-product-price linkclick-card-price">
                            🪙 ${formattedPrice} Coin
                        </div>

                        ${actionHTML}
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG TRUNG THU · NGUYỆT CUNG TIÊN TỬ — V3
        // Đồng bộ flow với card TAMON'S B-SIDE:
        // visual -> info panel -> label -> title -> price -> action.
        // Không dùng details gradient phủ toàn chiều ngang nhân vật nữa.
        // ====================================================
        if (
            item.id === 'pet_trung_thu_nguyet_cung_tien_tu' ||
            item.id === 'pet_trung_thu_chu_cuoi_2'
        ) {
            const isCuoi =
                item.id === 'pet_trung_thu_chu_cuoi_2';
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Trung thu/tag1.png'
            );

            const specialCardKey =
                isCuoi
                    ? 'midautumn-cuoi-premium'
                    : 'midautumn-moon-palace-premium';

            const cardVariantClass =
                isCuoi
                    ? 'midautumn-cuoi-premium-card'
                    : '';

            const cardStyleKey =
                isCuoi
                    ? 'midautumn-cuoi'
                    : 'midautumn-moon-palace';

            const cardLabel =
                isCuoi
                    ? 'TRUNG THU · NGUYỆT QUẾ'
                    : 'TRUNG THU · NGUYỆT CUNG';

            const cardIntro =
                isCuoi
                    ? 'Chú Cuội dưới bóng nguyệt quế, gọi trăng rằm và hoa đăng về khắp nhân gian.'
                    : 'Tiên tử Nguyệt Cung, mang ánh trăng đoàn viên xuống nhân gian.';

            const midAutumnCoinPrice =
                Number(item.midAutumnCoinPrice || 2);

            const currentMidAutumnBalance =
                window.MidAutumnCoinManager
                    ? window.MidAutumnCoinManager.getBalance()
                    : 0;

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="midautumn-card-action midautumn-card-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🌕 Đổi ${midAutumnCoinPrice} Xu Trung Thu
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="midautumn-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="midautumn-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ▶ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card midautumn-premium-card ${cardVariantClass} store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="${specialCardKey}"
                    data-theme-immune="true"
                    data-luxury-style="${cardStyleKey}"
                    tabindex="0"
                >
                    <div class="luxury-product-visual midautumn-card-visual">
                        <div class="luxury-product-shape midautumn-card-night"></div>
                        <div class="midautumn-card-moon"><i></i></div>
                        <div class="midautumn-card-palace"></div>
                        <div class="midautumn-card-cloud cloud-a"></div>
                        <div class="midautumn-card-cloud cloud-b"></div>
                        <div class="midautumn-card-lantern lantern-a"></div>
                        <div class="midautumn-card-lantern lantern-b"></div>

                        <div class="midautumn-card-stars" aria-hidden="true">
                            <i style="--i:0"></i><i style="--i:1"></i>
                            <i style="--i:2"></i><i style="--i:3"></i>
                            <i style="--i:4"></i><i style="--i:5"></i>
                            <i style="--i:6"></i><i style="--i:7"></i>
                            <i style="--i:8"></i><i style="--i:9"></i>
                            <i style="--i:10"></i><i style="--i:11"></i>
                        </div>

                        <div class="midautumn-card-tag-shell" aria-label="Trung thu">
                            <span class="midautumn-card-tag-halo"></span>
                            <img
                                src="${tagImage}"
                                alt="Trung thu"
                                class="midautumn-card-tag-art"
                                draggable="false"
                            >
                            <span class="midautumn-card-tag-shine"></span>
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image midautumn-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info midautumn-card-info">
                        <span class="luxury-product-label midautumn-card-label">
                            ${cardLabel}
                        </span>

                        <h3>${name}</h3>

                        <p class="midautumn-card-intro">
                            ${cardIntro}
                        </p>

                        <div class="luxury-product-price midautumn-card-price">
                            🌕 ${midAutumnCoinPrice} Xu Trung Thu
                            <small style="display:block; margin-top:4px; opacity:.78; font-size:.78em; font-weight:700;">
                                Bạn có:
                                <span data-midautumn-coin-balance>${currentMidAutumnBalance.toLocaleString('vi-VN')}</span>
                                Xu · Không hết hạn · Đổi sẽ trừ ${midAutumnCoinPrice} Xu · Chỉ đổi đúng ngày Trung Thu
                            </small>
                        </div>

                        ${actionHTML}
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG MÙA HẠ · V2
        // Đồng bộ bố cục với card Premium đang dùng:
        // article -> visual toàn thẻ -> tag + nhân vật -> details overlay.
        // Thông tin chỉ trượt lên khi hover/focus, không chiếm nửa card.
        // ====================================================
        if (item.id === 'pet_luxury_mua_ha') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Bốn mùa/ha_tag2.png'
            );

            const formattedPrice =
                Number(item.price || 12000)
                    .toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="summer-premium-card-action"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="summer-premium-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="summer-premium-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ☀ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="
                        luxury-product-card
                        summer-premium-card
                        store-theme-locked
                        ui-theme-immune
                    "
                    data-item-id="${id}"
                    data-special-card="summer-premium-pet"
                    data-theme-immune="true"
                    data-luxury-style="summer"
                    tabindex="0"
                >
                    <div class="summer-premium-card__visual">
                        <div class="summer-card-sky"></div>
                        <div class="summer-card-sun-disc">
                            <i></i><i></i>
                        </div>
                        <div class="summer-card-horizon"></div>
                        <div class="summer-card-caustic"></div>
                        <div class="summer-card-glow-ribbon ribbon-a"></div>
                        <div class="summer-card-glow-ribbon ribbon-b"></div>

                        <div
                            class="summer-card-spark-field"
                            aria-hidden="true"
                        >
                            <i style="--i:0"></i>
                            <i style="--i:1"></i>
                            <i style="--i:2"></i>
                            <i style="--i:3"></i>
                            <i style="--i:4"></i>
                            <i style="--i:5"></i>
                            <i style="--i:6"></i>
                            <i style="--i:7"></i>
                            <i style="--i:8"></i>
                            <i style="--i:9"></i>
                            <i style="--i:10"></i>
                            <i style="--i:11"></i>
                        </div>

                        <div
                            class="summer-premium-card-tag-shell"
                            aria-hidden="true"
                        >
                            <span class="summer-card-tag-halo"></span>
                            <img
                                src="${tagImage}"
                                alt="Mùa hạ"
                                class="summer-premium-card-tag-art"
                                draggable="false"
                            >
                            <span class="summer-card-tag-glint"></span>
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="summer-premium-card-character"
                            draggable="false"
                        >

                        <div class="summer-premium-details">
                            <div class="summer-premium-type">
                                ☀ THÚ CƯNG PREMIUM · MÙA HẠ
                            </div>

                            <h3>${name}</h3>

                            <p class="summer-premium-description">
                                Thần vực mùa hạ kết hợp kim quang,
                                thủy ảnh, nhiệt lưu và tinh quang dịu.
                            </p>

                            <div class="summer-premium-price">
                                🪙 Giá bán: ${formattedPrice} Coin
                            </div>

                            ${actionHTML}
                        </div>
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG MÙA XUÂN
        // ====================================================
        if (item.id === 'pet_luxury_mua_xuan') {

            const tagImage = escapeHTML(
                item.luxuryTagImage || ''
            );

            let actionHTML = '';

            if (!isOwned) {

                actionHTML = `
        <button
            type="button"
            class="spring-premium-use-button spring-premium-buy-button"
            onclick="
    window.LuxuryStore.buyItemSafely(
        '${id}'
    )
"
        >
            🪙 Mua 12.000 Coin
        </button>
    `;

            } else if (isEquipped) {

                actionHTML = `
        <button
            type="button"
            class="
                spring-premium-use-button
                is-equipped
            "
            onclick="
                StoreManager.unapplyItem(
                    '${id}'
                )
            "
        >
            ✕ Gỡ
        </button>
    `;

            } else {

                actionHTML = `
        <button
            type="button"
            class="spring-premium-use-button"
            onclick="
                StoreManager.applyItem(
                    '${id}'
                )
            "
        >
            🌿 Sử dụng
        </button>
    `;
            }


            return `
        <article
            class="
                luxury-product-card
                spring-premium-card
            "
            data-item-id="${id}"
            data-luxury-style="spring"
            tabindex="0"
        >

            <div class="spring-premium-card__visual">

                <!-- NỀN MÙA XUÂN -->
                <div class="spring-premium-sky"></div>
                <div class="spring-premium-card-sun"></div>
                <div class="spring-premium-card-gate"></div>
                <div class="spring-premium-card-vine vine-left"></div>
                <div class="spring-premium-card-vine vine-right"></div>

                <div class="spring-premium-card-petals" aria-hidden="true">
                    <span style="--i:0"></span>
                    <span style="--i:1"></span>
                    <span style="--i:2"></span>
                    <span style="--i:3"></span>
                    <span style="--i:4"></span>
                    <span style="--i:5"></span>
                    <span style="--i:6"></span>
                    <span style="--i:7"></span>
                </div>

                <div class="
                    spring-premium-hill
                    spring-premium-hill--back
                "></div>

                <div class="
                    spring-premium-hill
                    spring-premium-hill--front
                "></div>


                <!-- TAG -->
                ${tagImage
                    ? `
                            <div
                                class="spring-premium-tag-shell"
                                aria-hidden="true"
                            >
                                <span class="spring-premium-tag-bloom bloom-a"></span>
                                <span class="spring-premium-tag-bloom bloom-b"></span>
                                <span class="spring-premium-tag-spark spark-a"></span>
                                <span class="spring-premium-tag-spark spark-b"></span>

                                <img
                                    src="${tagImage}"
                                    alt="Mùa Xuân"
                                    class="spring-premium-tag"
                                    draggable="false"
                                >

                                <span class="spring-premium-tag-shine"></span>
                            </div>
                        `
                    : ''
                }


                <!-- NHÂN VẬT -->
                <img
                    src="${image}"
                    alt="${name}"
                    class="spring-premium-character"
                    draggable="false"
                >


                <!--
                    THÔNG TIN:
                    Bình thường ẩn hoàn toàn.
                    Hover/touch mới trượt lên.
                -->
                <div
                    class="spring-premium-details"
                >

                    <div class="spring-premium-type">
                        🐾 THÚ CƯNG PREMIUM
                    </div>

                    <h3>
                        ${name}
                    </h3>

                    <p class="spring-premium-description">
                        Vương Miện Xuân Thần mở đồng thời
                        thần vực, giao diện và thú cưng.
                    </p>

                    <div class="spring-premium-source">
    🪙 Giá bán: 12.000 Coin
</div>

                    ${actionHTML}

                </div>

            </div>

        </article>
    `;
        }


        // ====================================================
        // CARD PREMIUM THƯỜNG
        // ====================================================

        const price =
            Number(item.price) || 0;

        return `
        <article
            class="luxury-product-card"
        >

            <div
                class="luxury-product-visual"
            >

                <div
                    class="luxury-product-shape"
                ></div>

                ${image
                ? `
                            <img
                                src="${image}"
                                alt="${name}"
                                class="
                                    luxury-product-image
                                "
                            >
                        `
                : `
                            <div
                                class="
                                    luxury-product-placeholder
                                "
                            >
                                💎
                            </div>
                        `
            }

            </div>

            <div
                class="luxury-product-info"
            >

                <span
                    class="luxury-product-label"
                >
                    LUXURY
                </span>

                <h3>${name}</h3>

                <div
                    class="luxury-product-price"
                >
                    ${price > 0
                ? `🪙 ${price} Coin`
                : 'Vật phẩm đặc biệt'
            }
                </div>

            </div>

        </article>
    `;
    }


    // ========================================================
    // 5. RENDER DANH SÁCH
    // ========================================================
    function renderLuxuryStore() {

        const grid =
            document.getElementById(
                IDS.grid
            );

        if (!grid) return;

        const items =
            getLuxuryItems();

        if (!items.length) {

            grid.innerHTML = `
                <div class="luxury-store-empty">

                    <div class="luxury-store-empty-icon">
                        💎
                    </div>

                    <strong>
                        Chưa có vật phẩm sang trọng
                    </strong>

                </div>
            `;

            return;
        }


        grid.innerHTML =
            items
                .map(renderCard)
                .join('');

        // A trial is not permanent ownership. Offer the existing upgrade flow.
        grid.querySelectorAll('[data-item-id]').forEach(card => {
            const id = card.dataset.itemId;
            const inventory = getLuxuryInventoryItem(id);
            const item = items.find(candidate => String(candidate.id) === id);
            if (!item || item.isLocked || item.eventOnly || item.isNonCoin ||
                inventory?.isTrial !== true || Number(inventory.trialExpiry || 0) <= Date.now()) return;
            const upgrade = document.createElement('button');
            upgrade.type = 'button';
            upgrade.className = 'btn-approve luxury-trial-upgrade';
            upgrade.textContent = 'Nâng cấp vĩnh viễn';
            upgrade.addEventListener('click', async () => {
                upgrade.disabled = true;
                try { await buyLuxuryItemSafely(id); }
                catch (error) { console.error('[LuxuryStore] Upgrade failed:', error); }
                finally { upgrade.disabled = false; }
            });
            card.appendChild(upgrade);
        });

        /*
         * HOTFIX v4.0.1:
         * renderCard() đã tạo placeholder riêng cho vật phẩm bị khóa.
         * Không gắn thêm overlay lần hai để tránh hai dấu ? chồng nhau.
         */

        // Khóa thao tác copy/lưu cho toàn bộ ảnh của Cửa hàng Sang trọng.
        window.StoreImageProtection?.protectSubtree(grid);
    }


    // ========================================================
    // 6. ĐÓNG TRANG SƯU TẦM NẾU ĐANG MỞ
    // ========================================================
    function closeCollectionPage() {

        const storeTab =
            document.getElementById(
                'tab-store'
            );

        const collectionPage =
            document.getElementById(
                'storeCollectionPage'
            );

        /*
         * Đóng popup "cách nhận" của Sưu tầm trước.
         * Nếu API chưa tồn tại thì vẫn có DOM fallback bên dưới.
         */
        try {
            if (
                window.StoreCollectionPage &&
                typeof window
                    .StoreCollectionPage
                    .closeAcquisitionWays ===
                    'function'
            ) {
                window
                    .StoreCollectionPage
                    .closeAcquisitionWays();
            }
        } catch (_) {}

        /*
         * Gọi API chuẩn nếu có.
         */
        try {
            if (
                window.StoreCollectionPage &&
                typeof window
                    .StoreCollectionPage
                    .close === 'function'
            ) {
                window
                    .StoreCollectionPage
                    .close();
            }
        } catch (_) {}

        /*
         * DOM fallback bắt buộc:
         * không phụ thuộc animation/timer của store-collections.js.
         * Mở Luxury là Sưu tầm phải biến mất ngay trong cùng frame.
         */
        storeTab?.classList.remove(
            'store-collection-view-active'
        );

        if (
            storeTab?.dataset.storeView ===
            'collection'
        ) {
            storeTab.dataset.storeView =
                'normal';
        }

        if (collectionPage) {
            collectionPage.classList.remove(
                'is-visible'
            );

            collectionPage.hidden = true;
            collectionPage.inert = true;

            collectionPage.setAttribute(
                'inert',
                ''
            );

            collectionPage.setAttribute(
                'aria-hidden',
                'true'
            );
        }

        const acquisitionModal =
            document.getElementById(
                'storeCollectionAcquisitionModal'
            );

        if (acquisitionModal) {
            acquisitionModal.classList.remove(
                'is-open'
            );

            acquisitionModal.hidden = true;
            acquisitionModal.inert = true;

            acquisitionModal.setAttribute(
                'inert',
                ''
            );

            acquisitionModal.setAttribute(
                'aria-hidden',
                'true'
            );
        }

        document.body?.classList.remove(
            'store-collection-acquisition-open'
        );

        /*
         * Vì click Luxury sẽ stopPropagation(), handler dropdown của
         * Sưu tầm không còn cơ hội tự đóng menu. Ta đóng nó tại đây.
         */
        const collectionArrow =
            document.getElementById(
                'storeCollectionArrow'
            );

        const collectionDropdown =
            document.getElementById(
                'storeCollectionDropdown'
            );

        collectionArrow?.classList.remove(
            'is-open'
        );

        collectionArrow?.setAttribute(
            'aria-expanded',
            'false'
        );

        collectionDropdown?.classList.remove(
            'is-open'
        );

        collectionDropdown?.setAttribute(
            'aria-hidden',
            'true'
        );
    }


    // ========================================================
    // 7. CÔ LẬP VIEW CỬA HÀNG SANG TRỌNG
    // ========================================================
    // Không chỉ dựa vào inline style. student.js/Firebase/lazy-loader có thể
    // đồng bộ quyền truy cập sau đó và ghi lại display:block cho storeActiveView.
    // Class này là "nguồn sự thật" cho view đang mở và CSS !important đảm bảo
    // Cửa hàng thường không thể ló ra phía trên Cửa hàng Sang trọng.
    let luxuryStoreCloseTimer = null;

    function ensureLuxuryStoreViewIsolationStyles() {

        if (
            document.getElementById(
                'luxuryStoreViewIsolationStyles'
            )
        ) {
            return;
        }

        const style =
            document.createElement('style');

        style.id =
            'luxuryStoreViewIsolationStyles';

        style.textContent = `
            /*
             * STRICT STORE VIEW ISOLATION v2
             * Normal / Sưu tầm / Luxury là 3 view loại trừ nhau.
             */

            #tab-store.luxury-store-view-active > #storeActiveView,
            #tab-store.luxury-store-view-active > #storeLockedView,
            #tab-store.luxury-store-view-active > #storeCollectionPage {
                display: none !important;
            }

            #tab-store.luxury-store-view-active > #luxuryStorePage[hidden] {
                display: none !important;
            }

            #tab-store.luxury-store-view-active > #luxuryStorePage:not([hidden]) {
                display: block !important;
            }

            /*
             * Chiều ngược lại: khi Sưu tầm đang mở, Luxury tuyệt đối không
             * được xuất hiện dù timer/fade cũ hoặc module lazy-load vừa chạy.
             */
            #tab-store.store-collection-view-active > #luxuryStorePage {
                display: none !important;
            }
        `;

        (document.head || document.documentElement)
            .appendChild(style);
    }


    function setLuxuryStoreViewActive(active) {

        const storeTab =
            document.getElementById(
                'tab-store'
            );

        if (!storeTab) return;

        const isActive =
            Boolean(active);

        storeTab.classList.toggle(
            'luxury-store-view-active',
            isActive
        );

        if (isActive) {
            /*
             * Một tab chỉ được có đúng một view đặc biệt.
             */
            storeTab.classList.remove(
                'store-collection-view-active'
            );

            storeTab.dataset.storeView =
                'luxury';
        } else if (
            storeTab.dataset.storeView ===
            'luxury'
        ) {
            storeTab.dataset.storeView =
                'normal';
        }
    }


    function isLuxuryStoreOpen() {

        const page =
            document.getElementById(
                IDS.page
            );

        const storeTab =
            document.getElementById(
                'tab-store'
            );

        return Boolean(
            page &&
            page.hidden === false &&
            (
                storeTab?.classList.contains(
                    'luxury-store-view-active'
                ) ||
                page.classList.contains(
                    'is-visible'
                )
            )
        );
    }


    // ========================================================
    // 8. ẨN CỬA HÀNG THƯỜNG
    // ========================================================
    function hideNormalStore() {

        const activeView =
            document.getElementById(
                'storeActiveView'
            );

        const lockedView =
            document.getElementById(
                'storeLockedView'
            );

        if (activeView) {
            activeView.style.display =
                'none';
        }

        if (lockedView) {
            lockedView.style.display =
                'none';
        }
    }


    // ========================================================
    // 9. KHÔI PHỤC CỬA HÀNG THƯỜNG
    // ========================================================
    function restoreNormalStore() {

        const activeView =
            document.getElementById(
                'storeActiveView'
            );

        const lockedView =
            document.getElementById(
                'storeLockedView'
            );

        const storeTab =
            document.getElementById(
                'tab-store'
            );

        const collectionOpen =
            Boolean(
                storeTab?.classList.contains(
                    'store-collection-view-active'
                )
            );

        let storeOpen = true;

        try {
            if (
                typeof window
                    .isStudentStoreSystemOpen ===
                'function'
            ) {
                storeOpen =
                    window
                        .isStudentStoreSystemOpen();
            } else {
                storeOpen = !(
                    window.storeLocked === true ||
                    window.isStoreLocked === true
                );
            }
        } catch (_) {
            storeOpen = !(
                window.storeLocked === true ||
                window.isStoreLocked === true
            );
        }

        if (lockedView) {
            lockedView.style.display =
                storeOpen
                    ? 'none'
                    : 'block';
        }

        if (activeView) {
            activeView.style.display =
                (
                    storeOpen &&
                    !collectionOpen
                )
                    ? 'block'
                    : 'none';
        }
    }


    // ========================================================
    // 10. MỞ CỬA HÀNG SANG TRỌNG
    // ========================================================
    function openLuxuryStore() {

        ensureLuxuryStoreViewIsolationStyles();

        if (luxuryStoreCloseTimer) {
            window.clearTimeout(
                luxuryStoreCloseTimer
            );

            luxuryStoreCloseTimer = null;
        }

        closeCollectionPage();

        const page =
            document.getElementById(
                IDS.page
            );

        if (!page) return;

        /*
         * Đánh dấu view trước khi hiện page để không có một frame nào
         * Cửa hàng thường và Cửa hàng Sang trọng cùng xuất hiện.
         */
        setLuxuryStoreViewActive(true);
        hideNormalStore();

        page.hidden = false;
        page.inert = false;
        page.removeAttribute('inert');
        page.setAttribute(
            'aria-hidden',
            'false'
        );

        requestAnimationFrame(() => {
            /*
             * Nếu close() được gọi ngay trước frame này thì không bật lại.
             */
            if (
                page.hidden === false &&
                document
                    .getElementById('tab-store')
                    ?.classList.contains(
                        'luxury-store-view-active'
                    )
            ) {
                page.classList.add(
                    'is-visible'
                );
            }
        });

        const heading =
            document.querySelector(
                '#tab-store .store-collection-title-row h2'
            ) ||
            document.querySelector(
                '#tab-store > h2'
            );

        if (heading) {
            heading.textContent =
                'Cửa hàng Sang trọng';
        }

        renderLuxuryStore();
    }


    // ========================================================
    // 11. ĐÓNG CỬA HÀNG SANG TRỌNG
    // ========================================================
    function closeLuxuryStore(options = {}) {

        const immediate =
            options === true ||
            options?.immediate === true;

        const restoreNormal =
            options === true ||
            options?.restoreNormal !== false;

        const resetHeading =
            options === true ||
            options?.resetHeading !== false;

        const page =
            document.getElementById(
                IDS.page
            );

        const finishClose = () => {

            if (
                page &&
                page.classList.contains(
                    'is-visible'
                )
            ) {
                /*
                 * Trang đã được mở lại trong lúc timer close cũ đang chờ.
                 * Không được ẩn page mới.
                 */
                return;
            }

            if (page) {
                page.hidden = true;
                page.inert = true;
                page.setAttribute(
                    'inert',
                    ''
                );
                page.setAttribute(
                    'aria-hidden',
                    'true'
                );
            }

            setLuxuryStoreViewActive(false);

            const heading =
                document.querySelector(
                    '#tab-store .store-collection-title-row h2'
                ) ||
                document.querySelector(
                    '#tab-store > h2'
                );

            if (
                resetHeading &&
                heading
            ) {
                heading.textContent =
                    'Cửa hàng Vật phẩm';
            }

            if (restoreNormal) {
                restoreNormalStore();
            }
        };

        if (luxuryStoreCloseTimer) {
            window.clearTimeout(
                luxuryStoreCloseTimer
            );

            luxuryStoreCloseTimer = null;
        }

        if (!page) {
            finishClose();
            return;
        }

        page.classList.remove(
            'is-visible'
        );

        page.setAttribute(
            'aria-hidden',
            'true'
        );

        /*
         * Trong 200 ms fade-out, class luxury-store-view-active vẫn được giữ.
         * Vì vậy storeActiveView KHÔNG được hiện sớm và không còn cảnh 2 cửa hàng
         * chồng/lẫn vào nhau.
         */
        if (immediate) {
            finishClose();
            return;
        }

        luxuryStoreCloseTimer =
            window.setTimeout(
                () => {
                    luxuryStoreCloseTimer =
                        null;

                    finishClose();
                },
                200
            );
    }


    // ========================================================
    // 11B. MUTUAL EXCLUSION · SƯU TẦM ↔ LUXURY
    // ========================================================
    let collectionLuxuryBridgeTimer = null;
    let collectionLuxuryViewObserver = null;
    let collectionLuxuryBridgeInstalled = false;
    let collectionLuxuryClickBridgeTarget = null;
    let collectionLuxuryClickBridgeHandler = null;

    function closeLuxuryForCollection() {
        const storeTab =
            document.getElementById(
                'tab-store'
            );

        const page =
            document.getElementById(
                IDS.page
            );

        const luxuryLooksActive =
            Boolean(
                storeTab?.classList.contains(
                    'luxury-store-view-active'
                ) ||
                (
                    page &&
                    (
                        page.hidden === false ||
                        page.classList.contains(
                            'is-visible'
                        )
                    )
                )
            );

        if (!luxuryLooksActive) {
            return;
        }

        /*
         * Chuyển thẳng sang Sưu tầm:
         * - đóng Luxury ngay;
         * - không bật store normal ở giữa;
         * - không reset heading vì Collection sẽ tự đặt tiêu đề của nó.
         */
        closeLuxuryStore({
            immediate: true,
            restoreNormal: false,
            resetHeading: false
        });
    }

    function installCollectionLuxuryMutualExclusionBridge(
        attempt = 0
    ) {
        const api =
            window.StoreCollectionPage;

        if (
            !api ||
            typeof api.open !==
                'function'
        ) {
            if (attempt < 120) {
                window.setTimeout(
                    () =>
                        installCollectionLuxuryMutualExclusionBridge(
                            attempt + 1
                        ),
                    100
                );
            }

            return false;
        }

        if (collectionLuxuryBridgeInstalled) {
            return true;
        }

        /*
         * StoreCollectionPage được store-collections.js export bằng
         * Object.freeze(...), vì vậy KHÔNG được gán lại api.open hoặc
         * thêm cờ trực tiếp lên object API. Việc ghi đè sẽ ném:
         * "Cannot assign to read only property 'open'" trong strict mode.
         *
         * Thay vào đó:
         * 1) bắt click mở Sưu tầm ở capture phase để đóng Luxury trước;
         * 2) MutationObserver bên dưới vẫn xử lý mọi lần open() bằng code.
         */
        const storeTab =
            document.getElementById(
                'tab-store'
            );

        if (storeTab) {
            collectionLuxuryClickBridgeTarget =
                storeTab;

            collectionLuxuryClickBridgeHandler =
                event => {
                    const target =
                        event.target instanceof Element
                            ? event.target.closest(
                                '#storeCollectionOpenButton'
                            )
                            : null;

                    if (!target) {
                        return;
                    }

                    closeLuxuryForCollection();
                };

            storeTab.addEventListener(
                'click',
                collectionLuxuryClickBridgeHandler,
                true
            );
        }

        collectionLuxuryBridgeInstalled = true;

        return true;
    }

    function installCollectionLuxuryViewObserver() {
        const storeTab =
            document.getElementById(
                'tab-store'
            );

        if (
            !storeTab ||
            collectionLuxuryViewObserver
        ) {
            return;
        }

        collectionLuxuryViewObserver =
            new MutationObserver(() => {
                if (
                    storeTab.classList.contains(
                        'store-collection-view-active'
                    )
                ) {
                    closeLuxuryForCollection();
                }

                /*
                 * Nếu Luxury đang active thì Collection page không được
                 * tự bật lại bởi timer cũ.
                 */
                if (
                    storeTab.classList.contains(
                        'luxury-store-view-active'
                    )
                ) {
                    const collectionPage =
                        document.getElementById(
                            'storeCollectionPage'
                        );

                    if (
                        collectionPage &&
                        (
                            collectionPage.hidden === false ||
                            collectionPage.classList.contains(
                                'is-visible'
                            )
                        )
                    ) {
                        closeCollectionPage();
                    }
                }
            });

        collectionLuxuryViewObserver.observe(
            storeTab,
            {
                attributes: true,
                attributeFilter: [
                    'class',
                    'data-store-view'
                ],
                childList: true,
                subtree: true
            }
        );
    }


    // ========================================================
    // 12. TẠO GIAO DIỆN
    // ========================================================
    function buildLuxuryStoreUI(
        attempt = 0
    ) {

        /*
         * Trang giáo viên vẫn nạp module này để dùng dữ liệu/quản lý Luxury,
         * nhưng không có #tab-store. Không chạy vòng retry dựng UI học sinh.
         */
        if (
            document.documentElement?.dataset?.appRole ===
            'teacher'
        ) {
            return;
        }

        const storeTab =
            document.getElementById(
                'tab-store'
            );

        /*
         * Menu này do store-collections.js
         * tạo ra sau khi trang được tải.
         */
        const dropdownClip =
            document.querySelector(
                '#storeCollectionDropdown ' +
                '.store-collection-dropdown__clip'
            );


        if (
            !storeTab ||
            !dropdownClip
        ) {

            if (attempt < 100) {

                setTimeout(
                    () =>
                        buildLuxuryStoreUI(
                            attempt + 1
                        ),
                    100
                );

            }

            return;
        }


        // Tránh tạo trùng
        if (
            document.getElementById(
                IDS.button
            )
        ) {
            return;
        }


        // ====================================================
        // NÚT CỬA HÀNG SANG TRỌNG
        // ====================================================

        const button =
            document.createElement(
                'button'
            );

        button.type = 'button';

        button.id =
            IDS.button;

        /*
         * Dùng chính class của nút Sưu tầm
         * => giao diện sẽ giống hệt.
         */
        button.className =
            'store-collection-dropdown__item ' +
            'luxury-store-menu-item';

        button.innerHTML = `
            <span
                class="store-collection-dropdown__item-icon"
                aria-hidden="true"
            >
                💎
            </span>

            <span>
                <strong>
                    Cửa hàng sang trọng
                </strong>

                <small>
                    Khám phá các vật phẩm cao cấp
                </small>
            </span>

            <span
                class="store-collection-dropdown__go"
                aria-hidden="true"
            >
                →
            </span>
        `;


        dropdownClip.appendChild(
            button
        );


        // ====================================================
        // TRANG CỬA HÀNG SANG TRỌNG
        // ====================================================

        const page =
            document.createElement(
                'section'
            );

        page.id =
            IDS.page;

        page.className =
            'luxury-store-page';

        page.hidden = true;

        page.innerHTML = `

            <div class="luxury-store-toolbar">

                <div>
                    <span class="luxury-store-kicker">
                        PREMIUM COLLECTION
                    </span>

                    <h3>
                        Bộ sưu tập sang trọng
                    </h3>

                    <p>
                        Các vật phẩm cao cấp
                        được tuyển chọn riêng.
                    </p>
                </div>

                <button
                    type="button"
                    id="luxuryStoreBackButton"
                    class="luxury-store-back"
                >
                    ← Cửa hàng
                </button>

            </div>


            <div
                id="${IDS.grid}"
                class="luxury-store-grid"
            ></div>
        `;


        /*
         * Chèn trang mới vào bên trong tab Cửa hàng.
         */
        storeTab.appendChild(
            page
        );


        window.StoreImageProtection?.protectSubtree(page);


        // CLICK MỞ
        button.addEventListener(
            'click',
            event => {
                /*
                 * QUAN TRỌNG:
                 * button dùng cùng class visual với item Sưu tầm.
                 * Chặn bubbling để click này không lọt vào event delegation
                 * của #storeCollectionDropdown và mở Sưu tầm cùng lúc.
                 */
                event.preventDefault();
                event.stopPropagation();

                openLuxuryStore();
            }
        );


        // CLICK QUAY LẠI
        document
            .getElementById(
                'luxuryStoreBackButton'
            )
            ?.addEventListener(
                'click',
                () => {
                    closeLuxuryStore();
                }
            );

        /*
         * store-collections.js đã tạo dropdown/page trước khi buildLuxuryStoreUI
         * thành công, nên đây là thời điểm tốt nhất để khóa 2 view với nhau.
         */
        installCollectionLuxuryMutualExclusionBridge();
        installCollectionLuxuryViewObserver();
    }


    // ========================================================
    // EQUIPPED LUXURY REHYDRATE BRIDGE
    // ========================================================
    // luxury-store.js có thể được lazy-load SAU khi Firebase inventory đã về.
    // Khi đó applyEquippedItems() trước đó không biết các item Luxury vì chúng
    // chưa được đăng ký vào StoreConfig. Bridge này cho phép tự áp lại ngay sau
    // khi module Luxury vừa boot, không cần người dùng bấm tab Cửa hàng.
    let luxuryRehydrateTimer = null;
    let luxuryRehydratePromise = null;

    function getEquippedLuxuryInventoryItem() {
        if (window.isStudentStoreGameAccessEnabled?.() === false) return null;
        const inventory =
            Array.isArray(window.myInventory)
                ? window.myInventory
                : [];

        return inventory.find(invItem =>
            invItem &&
            invItem.isEquipped === true &&
            LUXURY_ITEM_IDS.includes(
                String(invItem.id || '')
            )
        ) || null;
    }

    async function rehydrateEquippedLuxuryRuntime(
        reason = 'manual'
    ) {
        const equipped =
            getEquippedLuxuryInventoryItem();

        if (!equipped) {
            return false;
        }

        if (
            typeof window.applyEquippedItems !==
            'function'
        ) {
            return false;
        }

        if (luxuryRehydratePromise) {
            return luxuryRehydratePromise;
        }

        luxuryRehydratePromise =
            (async () => {
                await Promise.resolve(
                    window.applyEquippedItems()
                );

                console.debug(
                    '[LuxuryStore] Rehydrated equipped item:',
                    equipped.id,
                    reason
                );

                return true;
            })();

        try {
            return await luxuryRehydratePromise;
        } finally {
            luxuryRehydratePromise = null;
        }
    }

    function scheduleEquippedLuxuryRehydrate(
        reason = 'boot',
        delay = 80
    ) {
        if (luxuryRehydrateTimer) {
            clearTimeout(luxuryRehydrateTimer);
        }

        luxuryRehydrateTimer =
            window.setTimeout(
                () => {
                    luxuryRehydrateTimer = null;

                    rehydrateEquippedLuxuryRuntime(
                        reason
                    ).catch(error => {
                        console.warn(
                            '[LuxuryStore] Không thể tự khôi phục Luxury runtime:',
                            error
                        );
                    });
                },
                Math.max(
                    0,
                    Number(delay) || 0
                )
            );
    }


    // ========================================================
    // API
    // ========================================================
    window.LuxuryStore = {
        clearEquippedRuntime: hardClearBoundaryPetRuntime,
        ensureUI: buildLuxuryStoreUI,
        open: openLuxuryStore,
        close: closeLuxuryStore,
        isOpen: isLuxuryStoreOpen,
        refresh: renderLuxuryStore,
        buyItemSafely:
            itemId =>
                buyLuxuryItemSafely(itemId),
        rehydrateEquipped:
            reason =>
                rehydrateEquippedLuxuryRuntime(
                    reason || 'api'
                ),

        getItems:
            () => getLuxuryItems(),

        // Kiểm tra vật phẩm có thuộc Cửa hàng Sang trọng hay không
        isLuxuryItem: itemOrId => {
            const itemId =
                typeof itemOrId === 'object'
                    ? itemOrId?.id
                    : itemOrId;

            return LUXURY_ITEM_IDS.includes(
                String(itemId ?? '')
            );
        },

        // Lệnh test nhanh trong Console — kích hoạt đủ 3 lớp.
        applySpring: () => {

            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {

                PetManager.spawnPet(
                    SPRING_PREMIUM_PET
                );
            }
        },

        // Test nhanh Mùa Hạ — FULL SUITE độc lập.
        previewSummer: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    SUMMER_PREMIUM_PET
                );
            }
        },

        // Khôi phục runtime Mùa Hạ sau reload / khi pet đã spawn trước LuxuryStore.
        restoreSummer: () => {
            LuxurySummerRuntime.restore();
        },

        // Test riêng ultimate toàn màn hình mà không cần click pet.
        summerUltimateTest: () => {
            const pet = LuxurySummerRuntime.getPet();
            if (!pet) return false;

            const rect = pet.getBoundingClientRect();
            LuxurySummerRuntime.createUltimate(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
            );
            return true;
        },

        // Test nhanh Lord of the Mysteries · Klein — không cấp quyền sở hữu.
        previewLotmKlein: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    LOTM_KLEIN_EVENT_PET
                );
            }
        },

        clearLotmKlein: () => {
            LuxuryLotmKleinRuntime.clear();
        },

        // Khôi phục toàn bộ full-web suite Klein sau reload/lazy-load.
        restoreLotmKlein: () => {
            return LuxuryLotmKleinRuntime.restore();
        },

        // Test riêng ultimate toàn màn hình.
        lotmKleinUltimateTest: () => {
            const pet =
                LuxuryLotmKleinRuntime.getPet() ||
                document.querySelector('#virtual-pet-container #virtual-pet-img');

            if (!pet) return false;

            const rect = pet.getBoundingClientRect();
            return LuxuryLotmKleinRuntime.createUltimate(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
            );
        },

        // Test nhanh Cầm Cơ · Cầm Mộng — FULL SUITE V1.
        previewCamCoCamMong: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    CAM_CO_CAM_MONG_PET
                );
            }
        },

        // Test nhanh Tamon's B-Side — kích hoạt FULL SUITE V1.
        previewTamonBSide: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    TAMON_BSIDE_PET
                );
            }
        },

        // Test nhanh Tamon · Hắc Phấn Nghịch Nhịp — FULL SUITE mới.
        previewTamonPinkStatic: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    TAMON_PINKSTATIC_PET
                );
            }
        },

        // Test nhanh Đêm đầy sao — FULL SUITE V1.
        previewStarryNight: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    STARRY_NIGHT_PREMIUM_PET
                );
            }
        },

        restoreStarryNight: () => {
            return LuxuryStarryNightRuntime.restore();
        },

        starryNightUltimateTest: () => {
            const pet = LuxuryStarryNightRuntime.getPet();
            if (!pet) return false;
            const rect = pet.getBoundingClientRect();
            return LuxuryStarryNightRuntime.createUltimate(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
            );
        },

        clearStarryNight: () => {
            LuxuryStarryNightRuntime.clear();
        },

        // Test nhanh Nyx Thần thoại — kích hoạt FULL SUITE V2.
        previewNyx: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    MYTHIC_NYX_PET
                );
            }
        },


        // Test nhanh Aether Thần thoại — FULL SUITE V1.
        previewAether: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    MYTHIC_AETHER_PET
                );
            }
        },

        // Test nhanh thú cưng Quốc khánh (không cấp quyền sở hữu).
        previewNationalDay: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    NATIONAL_DAY_PREMIUM_PET
                );
            }
        },

        clearSummer: () => {
            LuxurySummerRuntime.clear();
        },

        clearNyx: () => {
            LuxuryNyxRuntime.clear();
        },


        clearAether: () => {
            LuxuryAetherRuntime.clear();
        },

        clearCamCoCamMong: () => {
            LuxuryCamCoCamMongRuntime.clear();
        },

        clearTamonBSide: () => {
            LuxuryTamonBSideRuntime.clear();
        },

        clearTamonPinkStatic: () => {
            LuxuryTamonPinkStaticRuntime.clear();
        },

        previewLinkClickCheng: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    LINKCLICK_CHENG_XIAOSHI_PET
                );
            }
        },

        clearLinkClickCheng: () => {
            LuxuryLinkClickChengRuntime.clear();
        },

        // Chẩn đoán/sửa nhanh full-web Link Click theo pet đang hiển thị.
        repairLinkClickCheng: () => {
            ensureLinkClickChengStylesheet();
            return syncLinkClickChengRuntimeFromDom();
        },

        previewMidAutumn: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    MID_AUTUMN_MOON_PET
                );
            }
        },

        previewMidAutumnCuoi: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    MID_AUTUMN_CUOI_PET
                );
            }
        },

        clearMidAutumn: () => {
            LuxuryMidAutumnRuntime.clear();
        },

        clearSpring: () => {

            LuxurySpringRuntime.clear();

            if (
                typeof PetManager !== 'undefined'
            ) {
                PetManager.container =
                    document.getElementById(
                        'virtual-pet-container'
                    );
            }
        },
    };


    // ========================================================
    // KHỞI ĐỘNG
    // ========================================================
    [LuxurySpringRuntime, LuxurySummerRuntime, LuxuryNationalDayRuntime,
        LuxuryNyxRuntime, LuxuryAetherRuntime, LuxuryTamonBSideRuntime,
        LuxuryTamonPinkStaticRuntime, LuxuryLotmKleinRuntime, LuxuryCamCoCamMongRuntime,
        LuxuryMidAutumnRuntime, LuxuryLinkClickChengRuntime,
        LuxuryStarryNightRuntime].forEach(runtime => {
        ['mount', 'restore', 'repair', 'createUltimate'].forEach(method => {
            const original = runtime[method];
            if (typeof original !== 'function') return;
            runtime[method] = function (...args) {
                if (window.isStudentStoreGameAccessEnabled?.() === false) return false;
                return original.apply(this, args);
            };
        });
    });

    function bootLuxuryStore() {

        // Mount navigation before optional pet/effect recovery can fail.
        buildLuxuryStoreUI();

        ensureLuxuryStoreViewIsolationStyles();
        ensureLotmKleinStylesheet();
        ensureCamCoCamMongStylesheet();
        ensureTamonBSideStylesheet();
        ensureMidAutumnStylesheet();
        ensureLinkClickChengStylesheet();
        ensureStarryNightStylesheet();

        installLuxurySpringPetHook();
        installLinkClickChengAutoMountObserver();

        // Rehydrate Summer V2 even when active_pet was restored before
        // luxury-store.js finished installing its spawn hook.
        LuxurySummerRuntime.restore();
        LuxuryMidAutumnRuntime.restore();
        LuxuryLinkClickChengRuntime.restore();
        LuxuryStarryNightRuntime.restore();

        // Tự sửa thêm một nhịp sau khi DOM/pet đã ổn định.
        window.setTimeout(
            syncLinkClickChengRuntimeFromDom,
            320
        );

        installLuxurySpringUnapplyHook();

        // Khóa trang bị chéo giữa 2 cửa hàng
        installStoreBoundaryEquipGuard();

        buildLuxuryStoreUI();

        installCollectionLuxuryMutualExclusionBridge();
        installCollectionLuxuryViewObserver();

        installLuxuryInventoryListener();

        /*
         * Quan trọng cho lazy-load:
         * inventory có thể đã được đọc trước khi luxury-store.js tồn tại.
         * Sau khi đăng ký item + hook xong, tự áp lại pet Luxury đang mặc.
         */
        scheduleEquippedLuxuryRehydrate(
            'luxury-module-boot',
            90
        );
    }

    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            bootLuxuryStore,
            { once: true }
        );

    } else {

        bootLuxuryStore();

    }

})();