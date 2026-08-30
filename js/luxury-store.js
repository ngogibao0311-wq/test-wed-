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
        'pet_quoc_khanh_1'
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
        petEffect: 'national-day-dong-son-magic',
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


                /*
                 * DỌN NGAY trước khi Firebase cập nhật.
                 */
                if (isLuxurySpring) {
                    LuxurySpringRuntime.clear();
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
            NATIONAL_DAY_PREMIUM_PET
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
                NATIONAL_DAY_PREMIUM_PET.id
            ) {
                Object.assign(
                    existing,
                    NATIONAL_DAY_PREMIUM_PET
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