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

    // ========================================================
    // 1. DANH SÁCH VẬT PHẨM SANG TRỌNG
    // ========================================================
    // Muốn món nào xuất hiện thì ghi ID món đó vào đây.
    const LUXURY_ITEM_IDS = [
        'pet_luxury_mua_xuan',
        'pet_quoc_khanh_1',
        'pet_mythic_nyx_1',
        'pet_tamon_b_side_1',
        'pet_tamon_b_side_2'
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
                mobile ? 18 : 38;

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
                mobile ? 8 : 17;

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
                mobile ? 10 : 24;

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
                mobile ? 20 : 42;

            const emberCount =
                mobile ? 28 : 64;

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

            const starCount = reduced ? 18 : 42;
            const eqCount = reduced ? 14 : 28;
            const glintCount = reduced ? 7 : 15;

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
            const particleCount = reduced ? 18 : 44;

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

            const starCount = reduced ? 20 : 48;
            const dustCount = reduced ? 10 : 24;

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
                window.matchMedia(
                    '(max-width: 768px), (pointer: coarse)'
                ).matches
                    ? 7
                    : 12;

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
                isMobile ? 32 : 62;

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
                isMobile ? 14 : 30;

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
                isMobile ? 4 : 8;

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
                legacyIsMobile ? 18 : 36;

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
                isMobile ? 22 : 42;


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
                isMobile ? 12 : 26;


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
                isMobile ? 3 : 6;


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
                 * Mỗi lần đổi pet chỉ dọn runtime của 2 pet Luxury.
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

// Render pet gốc trước.
                originalSpawnPet(
                    petData
                );


                const isLuxurySpring =
                    petData?.id ===
                    'pet_luxury_mua_xuan' ||
                    petData?.petEffect ===
                    'premium-spring-goddess-magic';

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

                const isNationalDay =
                    String(itemId) ===
                    'pet_quoc_khanh_1';

                const isMythicNyx =
                    String(itemId) ===
                    'pet_mythic_nyx_1';

                const isTamonBSide =
                    String(itemId) ===
                    'pet_tamon_b_side_1';

                const isTamonPinkStatic =
                    String(itemId) ===
                    'pet_tamon_b_side_2';
/*
                 * DỌN NGAY trước khi Firebase cập nhật.
                 */
                if (isLuxurySpring) {
                    LuxurySpringRuntime.clear();
                }

                if (isMythicNyx) {
                    LuxuryNyxRuntime.clear();
                }

                if (isTamonBSide) {
                    LuxuryTamonBSideRuntime.clear();
                }

                if (isTamonPinkStatic) {
                    LuxuryTamonPinkStaticRuntime.clear();
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
         * Không có đồ bên cửa hàng đối diện
         * → mặc bình thường.
         */
        if (!conflicts.length) {
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
            conflicts
                .map(
                    conflict =>
                        `• ${conflict.item.name}`
                )
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
         * gỡ tất cả vật phẩm đang mặc
         * thuộc cửa hàng đối diện.
         */
        const updates = {};

        conflicts.forEach(
            conflict => {
                updates[
                    `${conflict.firebaseKey}/isEquipped`
                ] = false;
            }
        );

        if (
            Object.keys(updates).length
        ) {
            await inventoryRef.update(
                updates
            );
        }

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
            NATIONAL_DAY_PREMIUM_PET,
            MYTHIC_NYX_PET,
            TAMON_BSIDE_PET,
            TAMON_PINKSTATIC_PET
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
                TAMON_BSIDE_PET.id ||
                itemDefinition.id ===
                TAMON_PINKSTATIC_PET.id
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

        clearNyx: () => {
            LuxuryNyxRuntime.clear();
        },

        clearTamonBSide: () => {
            LuxuryTamonBSideRuntime.clear();
        },

        clearTamonPinkStatic: () => {
            LuxuryTamonPinkStaticRuntime.clear();
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

        ensureTamonBSideStylesheet();

        installLuxurySpringPetHook();

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