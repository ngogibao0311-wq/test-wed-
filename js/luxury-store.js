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
        'pet_cam_co_cam_mong_1',
        'pet_tamon_b_side_1',
        'pet_tamon_b_side_2',
        'pet_trung_thu_nguyet_cung_tien_tu'
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
                '#virtual-pet-container #virtual-pet-img.midautumn-moon-palace-pet'
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
                'midautumn-moon-palace-skill-active'
            );
            document.body?.classList.remove(
                'theme-midautumn-moon-palace'
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
                'midautumn-pet-casting'
            );

            container
                ?.querySelectorAll('.midautumn-pet-realm')
                .forEach(element => element.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('midautumn-moon-palace-pet');
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
                        <small>中 秋 · 月 宫</small>
                        <strong>NGUYỆT CUNG</strong>
                        <span>TRĂNG RẰM · CỔ TÍCH · ĐOÀN VIÊN</span>
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
                    <strong>NGUYỆT CUNG TIÊN TỬ</strong>
                    <i></i><span>☾</span>
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

            container.classList.add('pet-midautumn-moon-palace-stage');
            pet.classList.add('midautumn-moon-palace-pet');
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
                <span class="click-seal"><i>月</i></span>
                <span class="moon">☾</span>
                <span class="flower flower-a">❀</span>
                <span class="flower flower-b">✦</span>
                <span class="flower flower-c">❀</span>
                <span class="flower flower-d">✿</span>
                <span class="flower flower-e">❀</span>
                <span class="cloud cloud-a"></span>
                <span class="cloud cloud-b"></span>
                <span class="click-lantern"><i></i></span>
                <span class="click-glyph glyph-a">桂</span>
                <span class="click-glyph glyph-b">宫</span>
                <span class="click-glyph glyph-c">兔</span>
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
                <img class="ma-ult-character" src="assets/Premium/Trung thu/hang_nhan_vat1.png" alt="" draggable="false">

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
                    <small>桂 香 入 梦 · 月 满 人 间</small>
                    <strong>NGUYỆT CUNG TIÊN CẢNH</strong>
                    <span>TRĂNG RẰM KHAI CẢNH · VẠN ĐĂNG ĐỒNG MINH</span>
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
                <small>TRUNG THU · NGUYỆT CUNG KHAI CẢNH</small>
                <strong>NGUYỆT CUNG TIÊN TỬ</strong>
                <span>QUẾ HƯƠNG NHẬP MỘNG · VẠN ĐĂNG ĐOÀN VIÊN</span>
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
            this.clear();
            ensureMidAutumnStylesheet();

            document.documentElement.classList.add(
                'midautumn-moon-palace-equipped'
            );
            document.body?.classList.add(
                'theme-midautumn-moon-palace'
            );

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
                pet?.classList.contains('midautumn-moon-palace-pet-magic') ||
                String(pet?.getAttribute('src') || '').includes('/Trung thu/hang_nhan_vat1.png');

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
                    petData?.petEffect ===
                    'midautumn-moon-palace-pet-magic';
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
                    'pet_trung_thu_nguyet_cung_tien_tu';
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
                            'midautumn-pet-casting'
                        );

                        container
                            ?.querySelectorAll('.midautumn-pet-realm')
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove(
                                'midautumn-moon-palace-pet'
                            );

                        document.documentElement.classList.remove(
                            'midautumn-moon-palace-equipped',
                            'midautumn-moon-palace-skill-active'
                        );

                        document.body?.classList.remove(
                            'theme-midautumn-moon-palace'
                        );
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
            LuxuryTamonBSideRuntime,
            LuxuryTamonPinkStaticRuntime
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

                try {
                    const allowed =
                        await prepareStoreBoundaryEquip(
                            itemId
                        );

                    /*
                     * Người dùng chọn Hủy.
                     */
                    if (!allowed) {
                        return false;
                    }

                    /*
                     * Không xung đột hoặc
                     * người dùng đã đồng ý.
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
            CAM_CO_CAM_MONG_PET,
            TAMON_BSIDE_PET,
            TAMON_PINKSTATIC_PET,
            MID_AUTUMN_MOON_PET
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
                CAM_CO_CAM_MONG_PET.id ||
                itemDefinition.id ===
                TAMON_BSIDE_PET.id ||
                itemDefinition.id ===
                TAMON_PINKSTATIC_PET.id ||
                itemDefinition.id ===
                MID_AUTUMN_MOON_PET.id
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


    function getLuxuryInventoryItem(itemId) {

        return Object
            .values(luxuryInventoryState || {})
            .find(
                inv =>
                    String(inv?.id) ===
                    String(itemId)
            ) || null;
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


        if (window.__luxuryInventoryListening) {
            return;
        }

        window.__luxuryInventoryListening = true;


        db.ref(
            `student_inventory/${user.username}`
        ).on(
            'value',
            snapshot => {

                luxuryInventoryState =
                    snapshot.val() || {};

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
                                String(item?.id) ===
                                'pet_trung_thu_nguyet_cung_tien_tu' &&
                                item?.isEquipped === true
                        );

                if (!equippedMidAutumnMoonPalace) {
                    LuxuryMidAutumnRuntime.clear();
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
        // KHÓA BỞI GIÁO VIÊN — ÁP DỤNG CHO TOÀN BỘ LUXURY CARD
        // Dùng đúng item.isLocked đã được đồng bộ từ store_settings.
        // Khi khóa: che đen toàn bộ thẻ, không render nút mua / dùng / gỡ,
        // chỉ hiện dấu ? lớn ở giữa.
        // ====================================================
        if (item.isLocked === true) {
            return `
                <article
                    class="luxury-product-card luxury-teacher-locked-card ui-theme-immune"
                    data-item-id="${id}"
                    data-locked-by-teacher="true"
                    aria-label="Vật phẩm đang bị giáo viên khóa"
                    style="
                        position:relative !important;
                        min-height:430px;
                        overflow:hidden !important;
                        background:#030303 !important;
                        border:1px solid rgba(255,255,255,.08) !important;
                        box-shadow:0 18px 42px rgba(0,0,0,.55) !important;
                        cursor:not-allowed !important;
                        isolation:isolate;
                    "
                >
                    <div
                        aria-hidden="true"
                        style="
                            position:absolute;
                            inset:-2px;
                            z-index:2147483000;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            background:#030303;
                            color:#fff;
                            font-size:clamp(96px, 12vw, 160px);
                            font-weight:1000;
                            line-height:1;
                            text-shadow:0 0 26px rgba(255,255,255,.22);
                            user-select:none;
                            pointer-events:auto;
                        "
                    >?</div>
                </article>
            `;
        }

        const inventoryItem =
            getLuxuryInventoryItem(item.id);

        const isOwned =
            Boolean(inventoryItem);

        const isEquipped =
            inventoryItem?.isEquipped === true;

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
                        onclick="window.buyItem('${id}')"
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
                        onclick="window.buyItem('${id}')"
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
        // CARD RIÊNG NYX · THẦN THOẠI
        // Namespace riêng: nyx-mythic-*
        // Không dùng class card của Mùa Xuân / Quốc khánh.
        // ====================================================
        if (item.id === 'pet_mythic_nyx_1') {

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
                        onclick="window.buyItem('${id}')"
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
        // CARD RIÊNG TRUNG THU · NGUYỆT CUNG TIÊN TỬ — V3
        // Đồng bộ flow với card TAMON'S B-SIDE:
        // visual -> info panel -> label -> title -> price -> action.
        // Không dùng details gradient phủ toàn chiều ngang nhân vật nữa.
        // ====================================================
        if (item.id === 'pet_trung_thu_nguyet_cung_tien_tu') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Trung thu/tag1.png'
            );

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
                        onclick="window.buyItem('${id}')"
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
                    class="luxury-product-card midautumn-premium-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="midautumn-moon-palace-premium"
                    data-theme-immune="true"
                    data-luxury-style="midautumn-moon-palace"
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
                            TRUNG THU · NGUYỆT CUNG
                        </span>

                        <h3>${name}</h3>

                        <p class="midautumn-card-intro">
                            Tiên tử Nguyệt Cung, mang ánh trăng đoàn viên xuống nhân gian.
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
                        onclick="window.buyItem('${id}')"
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
    window.buyItem(
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

        // Giáo viên khóa vật phẩm: che đen toàn bộ card và hiện dấu ? lớn.
        // Vẫn dùng chính trường isLocked đang đồng bộ qua store_settings.
        items.forEach(item => {
            if (!item?.isLocked) return;

            const card = Array.from(
                grid.querySelectorAll('[data-item-id]')
            ).find(element =>
                String(element.dataset.itemId || '') ===
                String(item.id || '')
            );

            if (!card) return;

            card.classList.add('is-teacher-locked');

            if (!card.querySelector('.store-teacher-lock-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'store-teacher-lock-overlay';
                overlay.setAttribute('role', 'status');
                overlay.setAttribute(
                    'aria-label',
                    'Vật phẩm đang bị giáo viên khóa'
                );
                overlay.title = 'Vật phẩm đang bị giáo viên khóa';
                overlay.innerHTML =
                    '<span class="store-teacher-lock-question">?</span>';
                card.appendChild(overlay);
            }
        });

        // Khóa thao tác copy/lưu cho toàn bộ ảnh của Cửa hàng Sang trọng.
        window.StoreImageProtection?.protectSubtree(grid);
    }


    // ========================================================
    // 6. ĐÓNG TRANG SƯU TẦM NẾU ĐANG MỞ
    // ========================================================
    function closeCollectionPage() {

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
    }


    // ========================================================
    // 7. ẨN CỬA HÀNG THƯỜNG
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
    // 8. KHÔI PHỤC CỬA HÀNG THƯỜNG
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

        const storeLocked =
            window.storeLocked === true ||
            window.isStoreLocked === true;

        if (lockedView) {
            lockedView.style.display =
                storeLocked
                    ? 'block'
                    : 'none';
        }

        if (activeView) {
            activeView.style.display =
                storeLocked
                    ? 'none'
                    : 'block';
        }
    }


    // ========================================================
    // 9. MỞ CỬA HÀNG SANG TRỌNG
    // ========================================================
    function openLuxuryStore() {

        closeCollectionPage();

        hideNormalStore();

        const page =
            document.getElementById(
                IDS.page
            );

        if (!page) return;

        page.hidden = false;

        requestAnimationFrame(() => {
            page.classList.add(
                'is-visible'
            );
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
    // 10. ĐÓNG CỬA HÀNG SANG TRỌNG
    // ========================================================
    function closeLuxuryStore() {

        const page =
            document.getElementById(
                IDS.page
            );

        if (page) {
            page.classList.remove(
                'is-visible'
            );

            window.setTimeout(() => {
                page.hidden = true;
            }, 200);
        }

        const heading =
            document.querySelector(
                '#tab-store .store-collection-title-row h2'
            ) ||
            document.querySelector(
                '#tab-store > h2'
            );

        if (heading) {
            heading.textContent =
                'Cửa hàng Vật phẩm';
        }

        restoreNormalStore();
    }


    // ========================================================
    // 11. TẠO GIAO DIỆN
    // ========================================================
    function buildLuxuryStoreUI(
        attempt = 0
    ) {

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
            () => {
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
    }


    // ========================================================
    // API
    // ========================================================
    window.LuxuryStore = {
        open: openLuxuryStore,
        close: closeLuxuryStore,
        refresh: renderLuxuryStore,

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

        clearCamCoCamMong: () => {
            LuxuryCamCoCamMongRuntime.clear();
        },

        clearTamonBSide: () => {
            LuxuryTamonBSideRuntime.clear();
        },

        clearTamonPinkStatic: () => {
            LuxuryTamonPinkStaticRuntime.clear();
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
    function bootLuxuryStore() {

        ensureCamCoCamMongStylesheet();
        ensureTamonBSideStylesheet();
        ensureMidAutumnStylesheet();

        installLuxurySpringPetHook();

        // Rehydrate Summer V2 even when active_pet was restored before
        // luxury-store.js finished installing its spawn hook.
        LuxurySummerRuntime.restore();
        LuxuryMidAutumnRuntime.restore();

        installLuxurySpringUnapplyHook();

        // Khóa trang bị chéo giữa 2 cửa hàng
        installStoreBoundaryEquipGuard();

        buildLuxuryStoreUI();

        installLuxuryInventoryListener();
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