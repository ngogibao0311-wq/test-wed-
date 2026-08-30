// js/pet-items.js

class PetManager {
    static container = document.getElementById('virtual-pet-container');
    static interactionAbortController = null;
    static premiumSpringObserver = null;
    static nationalDayObserver = null;

    // =========================================================
    // PREMIUM MÙA XUÂN — DỌN / QUẢN LÝ THẦN VỰC
    // =========================================================
    static clearPremiumSpringRealm() {
        if (this.premiumSpringObserver) {
            this.premiumSpringObserver.disconnect();
            this.premiumSpringObserver = null;
        }

        this.container =
            document.getElementById('virtual-pet-container') ||
            this.container;

        this.container?.classList.remove(
            'pet-spring-vintage-stage',
            'spring-vintage-awakening',
            'spring-vintage-casting'
        );

        const activeImage =
            this.container?.querySelector(
                '#virtual-pet-img.spring-vintage-goddess-magic'
            );

        activeImage?.classList.remove(
            'spring-vintage-goddess-magic',
            'spring-vintage-avatar'
        );

        document
            .querySelectorAll(
                '.spring-vintage-trail, .spring-vintage-ultimate'
            )
            .forEach(node => node.remove());
    }

    static installPremiumSpringObserver() {
        this.container =
            document.getElementById('virtual-pet-container') ||
            this.container;

        if (!this.container) return;

        if (this.premiumSpringObserver) {
            this.premiumSpringObserver.disconnect();
        }

        this.premiumSpringObserver =
            new MutationObserver(() => {
                const activePet =
                    this.container.querySelector(
                        '#virtual-pet-img.spring-vintage-goddess-magic'
                    );

                const style =
                    window.getComputedStyle(this.container);

                const isVisible =
                    style.display !== 'none' &&
                    style.visibility !== 'hidden';

                if (!activePet || !isVisible) {
                    this.clearPremiumSpringRealm();
                }
            });

        this.premiumSpringObserver.observe(
            this.container,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'class',
                    'style'
                ]
            }
        );
    }

    // =========================================================
    // QUỐC KHÁNH — HÀO KHÍ ĐỘC LẬP
    // Concept riêng: trống đồng Đông Sơn + sơn son + sao vàng.
    // Không dùng lại realm, class hoặc animation của pet cũ.
    // =========================================================
    static clearNationalDayRealm() {
        if (this.nationalDayObserver) {
            this.nationalDayObserver.disconnect();
            this.nationalDayObserver = null;
        }

        const realm =
            document.getElementById(
                'national-day-heritage-realm'
            );

        realm?.remove();

        document
            .querySelectorAll(
                '.national-day-independence-burst,' +
                '.national-day-dialogue-box'
            )
            .forEach(node => node.remove());

        document.documentElement.classList.remove(
            'national-day-heritage-equipped'
        );

        this.container =
            document.getElementById('virtual-pet-container') ||
            this.container;

        this.container?.classList.remove(
            'pet-national-day-stage',
            'national-day-awakening',
            'national-day-casting'
        );
    }

    static createNationalDayRealm() {
        this.clearNationalDayRealm();

        this.container =
            document.getElementById('virtual-pet-container') ||
            this.container;

        if (!this.container) return null;

        const realm = document.createElement('div');

        realm.id = 'national-day-heritage-realm';
        realm.className = 'national-day-heritage-realm';
        realm.setAttribute('aria-hidden', 'true');

        realm.innerHTML = `
        <div class="nd-realm-lacquer-wash"></div>

        <div class="nd-realm-drum-watermark">
            <span class="nd-realm-drum-star">★</span>
            <span class="nd-realm-drum-track track-a"></span>
            <span class="nd-realm-drum-track track-b"></span>
            <span class="nd-realm-drum-track track-c"></span>
        </div>

        <div class="nd-realm-gold-horizon"></div>
        <div class="nd-realm-particle-field"></div>

        <div class="nd-realm-title">
            <small>02 · 09</small>
            <strong>HÀO KHÍ ĐỘC LẬP</strong>
        </div>
    `;

        const particleField =
            realm.querySelector(
                '.nd-realm-particle-field'
            );

        const reduced =
            window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)'
            ).matches;

        const particleCount = reduced ? 10 : 22;

        for (
            let index = 0;
            index < particleCount;
            index++
        ) {
            const shard = document.createElement('span');

            shard.className =
                index % 5 === 0
                    ? 'nd-realm-star-particle'
                    : 'nd-realm-bronze-particle';

            shard.textContent =
                index % 5 === 0
                    ? '★'
                    : '';

            shard.style.setProperty(
                '--nd-x',
                `${(index * 43 + 7) % 96}%`
            );

            shard.style.setProperty(
                '--nd-y',
                `${(index * 67 + 11) % 92}%`
            );

            shard.style.setProperty(
                '--nd-delay',
                `${-(index % 11) * 0.48}s`
            );

            shard.style.setProperty(
                '--nd-duration',
                `${7 + (index % 6) * 0.9}s`
            );

            shard.style.setProperty(
                '--nd-scale',
                `${0.62 + (index % 5) * 0.13}`
            );

            particleField?.appendChild(shard);
        }

        document.body.appendChild(realm);

        document.documentElement.classList.add(
            'national-day-heritage-equipped'
        );

        requestAnimationFrame(() => {
            realm.classList.add('is-active');
        });

        this.nationalDayObserver =
            new MutationObserver(() => {
                const activePet =
                    document.getElementById(
                        'virtual-pet-img'
                    );

                const style =
                    this.container
                        ? window.getComputedStyle(
                            this.container
                        )
                        : null;

                const stillActive =
                    activePet?.classList.contains(
                        'national-day-dong-son-magic'
                    ) &&
                    style?.display !== 'none' &&
                    style?.visibility !== 'hidden';

                if (!stillActive) {
                    this.clearNationalDayRealm();
                }
            });

        this.nationalDayObserver.observe(
            this.container,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'class',
                    'style'
                ]
            }
        );

        return realm;
    }

    static clearSlothDreamRealm() {
        const oldRealm =
            document.getElementById('sloth-dream-realm');

        if (oldRealm) {
            if (oldRealm._slothObserver) {
                oldRealm._slothObserver.disconnect();
            }

            oldRealm.remove();
        }

        document.documentElement.classList.remove(
            'sloth-dream-realm-equipped'
        );
    }

    static clearBirthday2026Realm() {
        const oldRealm =
            document.getElementById('birthday-2026-realm');

        if (oldRealm) {
            if (oldRealm._birthday2026Observer) {
                oldRealm._birthday2026Observer.disconnect();
            }

            oldRealm.remove();
        }

        document.documentElement.classList.remove(
            'birthday-2026-equipped'
        );
    }

    static createBirthday2026Realm() {
        this.clearBirthday2026Realm();

        const realm = document.createElement('div');

        realm.id = 'birthday-2026-realm';
        realm.className = 'birthday-2026-realm';
        realm.setAttribute('aria-hidden', 'true');

        realm.innerHTML = `
            <div class="birthday-2026-screen-wash"></div>

            <div class="birthday-2026-grand-medallion">
                <span class="birthday-2026-medallion-ring ring-one"></span>
                <span class="birthday-2026-medallion-ring ring-two"></span>

                <span class="birthday-2026-medallion-core">
                    <b>福</b>
                    <small>2026</small>
                </span>
            </div>

            <div class="birthday-2026-ribbon-vault">
                <span class="birthday-2026-vault-bow"></span>
            </div>

            <div class="birthday-2026-lantern-field"></div>
            <div class="birthday-2026-confetti-field"></div>

            <div class="birthday-2026-candle-altar">
                <span class="birthday-2026-altar-base"></span>

                <span class="birthday-2026-screen-candle candle-one">
                    <i></i>
                </span>

                <span class="birthday-2026-screen-candle candle-two">
                    <i></i>
                </span>

                <span class="birthday-2026-screen-candle candle-three">
                    <i></i>
                </span>
            </div>

            <div class="birthday-2026-screen-title">
                <span>SINH NHẬT 2026</span>
                <strong>PHÚC LỘC AN KHANG</strong>
            </div>
        `;

        const lanternField =
            realm.querySelector('.birthday-2026-lantern-field');

        for (let index = 0; index < 12; index++) {
            const lantern = document.createElement('span');

            lantern.className = 'birthday-2026-screen-lantern';

            const isLeft = index < 6;
            const rowIndex = index % 6;

            lantern.style.setProperty(
                '--birthday-lantern-x',
                isLeft
                    ? `${2 + rowIndex * 2.5}%`
                    : `${98 - rowIndex * 2.5}%`
            );

            lantern.style.setProperty(
                '--birthday-lantern-y',
                `${8 + rowIndex * 15}%`
            );

            lantern.style.setProperty(
                '--birthday-lantern-delay',
                `${-index * 0.48}s`
            );

            lantern.style.setProperty(
                '--birthday-lantern-scale',
                `${0.72 + index % 3 * 0.12}`
            );

            lanternField.appendChild(lantern);
        }

        const confettiField =
            realm.querySelector('.birthday-2026-confetti-field');

        const confettiColors = [
            '#ef7766',
            '#f4ca70',
            '#31876d',
            '#fff0bf'
        ];

        for (let index = 0; index < 38; index++) {
            const confetti = document.createElement('span');

            confetti.className = 'birthday-2026-screen-confetti';

            confetti.style.setProperty(
                '--birthday-confetti-x',
                `${(index * 37) % 100}%`
            );

            confetti.style.setProperty(
                '--birthday-confetti-y',
                `${(index * 61) % 100}%`
            );

            confetti.style.setProperty(
                '--birthday-confetti-color',
                confettiColors[index % confettiColors.length]
            );

            confetti.style.setProperty(
                '--birthday-confetti-delay',
                `${-(index % 14) * 0.45}s`
            );

            confetti.style.setProperty(
                '--birthday-confetti-duration',
                `${6 + index % 6}s`
            );

            confetti.style.setProperty(
                '--birthday-confetti-turn',
                `${index % 2 === 0 ? -18 : 18}deg`
            );

            confettiField.appendChild(confetti);
        }

        document.body.appendChild(realm);

        document.documentElement.classList.add(
            'birthday-2026-equipped'
        );

        requestAnimationFrame(() => {
            realm.classList.add('is-active');
        });

        /*
         * Tự xóa hiệu ứng khi thú cưng bị tháo,
         * đổi sang thú cưng khác hoặc container bị ẩn.
         */
        const observer = new MutationObserver(() => {
            const activePet =
                document.getElementById('virtual-pet-img');

            const containerStyle =
                this.container
                    ? window.getComputedStyle(this.container)
                    : null;

            const isStillActive =
                activePet?.classList.contains(
                    'birthday-serpent-2026-magic'
                ) &&
                containerStyle?.display !== 'none' &&
                containerStyle?.visibility !== 'hidden';

            if (!isStillActive) {
                this.clearBirthday2026Realm();
            }
        });

        if (this.container) {
            observer.observe(this.container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'class',
                    'style'
                ]
            });
        }

        realm._birthday2026Observer = observer;

        return realm;
    }

    static createSlothDreamRealm() {
        this.clearSlothDreamRealm();

        const realm = document.createElement('div');

        realm.id = 'sloth-dream-realm';
        realm.className = 'sloth-dream-realm';

        realm.setAttribute('aria-hidden', 'true');

        realm.innerHTML = `
            <div class="sloth-realm-backdrop"></div>
            <div class="sloth-realm-cathedral"></div>

            <div
                class="
                    sloth-realm-curtain
                    curtain-left
                "
            ></div>

            <div
                class="
                    sloth-realm-curtain
                    curtain-right
                "
            ></div>

            <div class="sloth-realm-aurora"></div>

            <div
                class="
                    sloth-realm-fog
                    sloth-realm-fog-a
                "
            ></div>

            <div
                class="
                    sloth-realm-fog
                    sloth-realm-fog-b
                "
            ></div>

            <div
                class="
                    sloth-realm-fog
                    sloth-realm-fog-c
                "
            ></div>

            <div class="sloth-realm-choir"></div>

            <div
                class="
                    sloth-realm-chain
                    chain-left
                "
            ></div>

            <div
                class="
                    sloth-realm-chain
                    chain-right
                "
            ></div>

            <div class="sloth-realm-sigil">
                <span
                    class="sloth-realm-crown"
                ></span>

                <span
                    class="
                        sloth-realm-ring
                        ring-one
                    "
                ></span>

                <span
                    class="
                        sloth-realm-ring
                        ring-two
                    "
                ></span>

                <span
                    class="
                        sloth-realm-ring
                        ring-three
                    "
                ></span>

                <span class="sloth-realm-core">
                    <b>Ⅶ</b>
                    <small>ACEDIA</small>
                </span>

                <div
                    class="sloth-realm-runes"
                ></div>
            </div>

            <div class="sloth-realm-hourglass">
                <span
                    class="sloth-hourglass-frame"
                ></span>

                <span
                    class="
                        sloth-hourglass-sand
                        sand-top
                    "
                ></span>

                <span
                    class="
                        sloth-hourglass-sand
                        sand-bottom
                    "
                ></span>
            </div>

            <div
                class="sloth-realm-particles"
            ></div>

            <div class="sloth-realm-title">
                <span>
                    PECCATUM VII · THẤT ĐẠI TỘI
                </span>

                <strong>
                    MỘNG GIỚI TRÌ HOÃN
                </strong>

                <small>
                    ACEDIA · KẺ CANH GIẤC NGỦ
                    VĨNH HẰNG
                </small>
            </div>
        `;

        const runeContainer =
            realm.querySelector('.sloth-realm-runes');

        for (let index = 0; index < 7; index++) {
            const rune = document.createElement('span');

            const angle = index * (360 / 7);

            rune.className = 'sloth-realm-rune';
            rune.textContent =
                ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'][index];

            rune.style.setProperty(
                '--sloth-domain-angle',
                `${angle}deg`
            );

            rune.style.setProperty(
                '--sloth-domain-angle-back',
                `${-angle}deg`
            );

            rune.style.setProperty(
                '--sloth-domain-delay',
                `${-index * 0.42}s`
            );

            runeContainer.appendChild(rune);
        }

        const choir =
            realm.querySelector(
                '.sloth-realm-choir'
            );

        const choirNumerals = [
            'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'
        ];

        for (let index = 0; index < 7; index++) {
            const pillar =
                document.createElement('span');

            pillar.className =
                'sloth-realm-choir-pillar';

            pillar.dataset.number =
                choirNumerals[index];

            pillar.style.setProperty(
                '--sloth-choir-index',
                index
            );

            pillar.style.setProperty(
                '--sloth-choir-delay',
                `${-index * 0.56}s`
            );

            pillar.style.setProperty(
                '--sloth-choir-height',
                `${42 + index * 4}%`
            );

            choir.appendChild(pillar);
        }

        const particles =
            realm.querySelector('.sloth-realm-particles');

        for (let index = 0; index < 32; index++) {
            const particle = document.createElement('span');

            particle.className = 'sloth-realm-particle';

            particle.style.setProperty(
                '--realm-x',
                `${(index * 37) % 100}%`
            );

            particle.style.setProperty(
                '--realm-y',
                `${(index * 61) % 100}%`
            );

            particle.style.setProperty(
                '--realm-size',
                `${2 + index % 5}px`
            );

            particle.style.setProperty(
                '--realm-delay',
                `${-(index % 12) * 0.55}s`
            );

            particle.style.setProperty(
                '--realm-duration',
                `${6 + index % 7}s`
            );

            particle.style.setProperty(
                '--realm-drift',
                `${20 + index % 6 * 11}px`
            );

            particles.appendChild(particle);
        }

        document.body.appendChild(realm);

        document.documentElement.classList.add(
            'sloth-dream-realm-equipped'
        );

        requestAnimationFrame(() => {
            realm.classList.add('is-active');
        });

        /*
         * Tự dọn hiệu ứng nếu thú cưng bị tháo,
         * chuyển thú cưng hoặc bị ẩn trong chế độ thi.
         */
        const observer = new MutationObserver(() => {
            const activePet =
                document.getElementById('virtual-pet-img');

            const containerStyle =
                this.container
                    ? window.getComputedStyle(this.container)
                    : null;

            const isStillActive =
                activePet?.classList.contains(
                    'seven-sins-sloth-magic'
                ) &&
                containerStyle?.display !== 'none' &&
                containerStyle?.visibility !== 'hidden';

            if (!isStillActive) {
                this.clearSlothDreamRealm();
            }
        });

        if (this.container) {
            observer.observe(this.container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'class',
                    'style'
                ]
            });
        }

        realm._slothObserver = observer;

        return realm;
    }

    static spawnPet(petData) {
        this.container =
            document.getElementById('virtual-pet-container') ||
            this.container;

        if (!this.container || !petData) return;

        this.clearSlothDreamRealm();
        this.clearBirthday2026Realm();
        this.clearPremiumSpringRealm();
        this.clearNationalDayRealm();
        document
            .querySelectorAll(
                '.nd29-independence-flash, .nd29-pet-dialogue'
            )
            .forEach(node => node.remove());
        // Dọn toàn bộ tương tác và vòng lặp của thú cưng trước
        if (
            typeof PetInteractionManager !== 'undefined' &&
            typeof PetInteractionManager.detachEvents === 'function'
        ) {
            PetInteractionManager.detachEvents({
                keepLoop: false,
                removeHungerBar: true
            });
        }

        // Xóa đồ họa thú cưng cũ nếu có
        this.container.innerHTML = '';
        this.container.classList.remove(
            'pet-doraemon-shizuka-stage',
            'pet-painting-stage',
            'pet-seven-sins-sloth-stage',
            'sloth-dream-release',
            'sloth-domain-casting',
            'pet-birthday-serpent-2026-stage',
            'pet-saturn-cassini-stage',
            'pet-rainy-day-stage',
            'pet-spring-vintage-stage',
            'spring-vintage-awakening',
            'spring-vintage-casting',
            'pet-national-day-stage',
            'national-day-awakening',
            'national-day-casting',
            'pet-national-day-chibi-stage',
            'nd29-awakening',
            'nd29-casting',
        );

        let petElement;

        // Xử lý tạo phần tử hiển thị: Nếu là Icon thì tạo Div text, nếu là File thì tạo Img
        if (petData.isIcon || petData.value && petData.value.length <= 4) {
            petElement = document.createElement('div');
            petElement.id = 'virtual-pet-img'; // Vẫn giữ ID này để ăn CSS Animation nhảy/thở
            petElement.innerHTML = petData.value || '🐕';
            petElement.style.fontSize = '60px'; // Chỉnh kích cỡ icon thú cưng
            petElement.style.filter = 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))';
            petElement.style.userSelect = 'none';
        } else {
            petElement = document.createElement('img');
            petElement.id = 'virtual-pet-img';
            petElement.src = petData.asset || petData.value || 'assets/default_pet.png';
            petElement.style.width = '130px';
            petElement.style.height = 'auto';
            petElement.style.filter = 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))';
        }
        if (petData.petEffect) {
            petElement.classList.add(petData.petEffect);
            petElement.style.filter = '';
        }

        // =========================================================
        // QUỐC KHÁNH 2/9 — SỨ GIẢ SAO VÀNG
        // Vật phẩm mới hoàn toàn.
        // KHÔNG dùng national-day-dong-son-magic của pet cũ.
        // =========================================================
        if (
            petData.petEffect ===
            'national-day-chibi-star-magic'
        ) {
            petElement.setAttribute('draggable', 'false');

            this.container.classList.add(
                'pet-national-day-chibi-stage',
                'nd29-awakening'
            );

            const emblem = document.createElement('div');

            emblem.className = 'nd29-pet-emblem';
            emblem.setAttribute('aria-hidden', 'true');

            emblem.innerHTML = `
        <span class="nd29-halo halo-outer"></span>
        <span class="nd29-halo halo-inner"></span>

        <span class="nd29-emblem-star">
            ★
        </span>

        <span class="nd29-ribbon ribbon-left"></span>
        <span class="nd29-ribbon ribbon-right"></span>

        <div class="nd29-ambient-particles"></div>
    `;

            const particleField =
                emblem.querySelector(
                    '.nd29-ambient-particles'
                );

            const reducedMotion =
                window.matchMedia?.(
                    '(max-width: 768px), ' +
                    '(pointer: coarse), ' +
                    '(prefers-reduced-motion: reduce)'
                ).matches;

            const particleCount =
                reducedMotion ? 8 : 16;

            for (
                let index = 0;
                index < particleCount;
                index++
            ) {
                const particle =
                    document.createElement('span');

                particle.className =
                    index % 4 === 0
                        ? 'nd29-ambient-star'
                        : 'nd29-ambient-spark';

                particle.textContent =
                    index % 4 === 0
                        ? '★'
                        : '';

                particle.style.setProperty(
                    '--nd29-angle',
                    `${index *
                    (360 / particleCount)}deg`
                );

                particle.style.setProperty(
                    '--nd29-radius',
                    `${56 +
                    (index % 5) * 8}px`
                );

                particle.style.setProperty(
                    '--nd29-delay',
                    `${-index * 0.22}s`
                );

                particleField?.appendChild(
                    particle
                );
            }

            this.container.appendChild(emblem);

            window.setTimeout(() => {
                this.container?.classList.remove(
                    'nd29-awakening'
                );
            }, 1450);
        }

        // =========================================================
        // VIỆT LINH · HÀO KHÍ ĐỘC LẬP
        // Idle local: trống đồng, sơn son, quỹ đạo sao và mảnh đồng.
        // =========================================================
        if (
            petData.petEffect ===
            'national-day-dong-son-magic'
        ) {
            petElement.setAttribute(
                'draggable',
                'false'
            );

            this.container.classList.add(
                'pet-national-day-stage'
            );

            const drum = document.createElement('div');

            drum.className =
                'national-day-pet-drum';

            drum.setAttribute(
                'aria-hidden',
                'true'
            );

            drum.innerHTML = `
        <span class="nd-pet-drum-disc"></span>
        <span class="nd-pet-drum-ring ring-one"></span>
        <span class="nd-pet-drum-ring ring-two"></span>
        <span class="nd-pet-drum-star">★</span>
        <span class="nd-pet-lacquer-arc arc-left"></span>
        <span class="nd-pet-lacquer-arc arc-right"></span>
        <div class="nd-pet-orbit-field"></div>
        <div class="nd-pet-bronze-shards"></div>
    `;

            const orbitField =
                drum.querySelector(
                    '.nd-pet-orbit-field'
                );

            for (
                let index = 0;
                index < 5;
                index++
            ) {
                const star =
                    document.createElement('span');

                star.className =
                    'nd-pet-orbit-star';

                star.textContent = '★';

                star.style.setProperty(
                    '--nd-pet-angle',
                    `${index * 72}deg`
                );

                star.style.setProperty(
                    '--nd-pet-angle-back',
                    `${index * -72}deg`
                );

                star.style.setProperty(
                    '--nd-pet-delay',
                    `${-index * 0.44}s`
                );

                orbitField?.appendChild(star);
            }

            const shardField =
                drum.querySelector(
                    '.nd-pet-bronze-shards'
                );

            for (
                let index = 0;
                index < 12;
                index++
            ) {
                const shard =
                    document.createElement('span');

                shard.className =
                    'nd-pet-bronze-shard';

                shard.style.setProperty(
                    '--nd-shard-angle',
                    `${index * 30}deg`
                );

                shard.style.setProperty(
                    '--nd-shard-delay',
                    `${-index * 0.22}s`
                );

                shardField?.appendChild(shard);
            }

            this.container.appendChild(drum);
        }
        // =========================================================
        // MÈO NHỎ NGÀY MƯA — KHUNG MƯA CỤC BỘ
        // Chỉ tạo phần tử bên trong container thú cưng.
        // Không phủ toàn màn hình và không dùng lại hiệu ứng cũ.
        // =========================================================
        if (petData.petEffect === 'rainy-day-cat-magic') {
            petElement.setAttribute('draggable', 'false');
            this.container.classList.add('pet-rainy-day-stage');

            const rainBackdrop = document.createElement('div');
            rainBackdrop.className = 'rainy-day-local-backdrop';
            rainBackdrop.setAttribute('aria-hidden', 'true');
            this.container.appendChild(rainBackdrop);

            const drizzleField = document.createElement('div');
            drizzleField.className = 'rainy-day-drizzle-field';
            drizzleField.setAttribute('aria-hidden', 'true');

            for (let index = 0; index < 11; index++) {
                const drop = document.createElement('span');
                drop.className = 'rainy-day-idle-drop';

                drop.style.setProperty(
                    '--rainy-idle-x',
                    `${7 + (index * 17) % 88}%`
                );

                drop.style.setProperty(
                    '--rainy-idle-delay',
                    `${-index * 0.27}s`
                );

                drop.style.setProperty(
                    '--rainy-idle-duration',
                    `${1.45 + (index % 4) * 0.18}s`
                );

                drop.style.setProperty(
                    '--rainy-idle-length',
                    `${10 + (index % 3) * 4}px`
                );

                drizzleField.appendChild(drop);
            }

            this.container.appendChild(drizzleField);

            const puddle = document.createElement('div');
            puddle.className = 'rainy-day-puddle';
            puddle.setAttribute('aria-hidden', 'true');

            const puddleSheen = document.createElement('span');
            puddleSheen.className = 'rainy-day-puddle-sheen';
            puddle.appendChild(puddleSheen);

            const rippleA = document.createElement('span');
            rippleA.className = 'rainy-day-puddle-ripple';
            puddle.appendChild(rippleA);

            const rippleB = document.createElement('span');
            rippleB.className = 'rainy-day-puddle-ripple ripple-b';
            puddle.appendChild(rippleB);

            this.container.appendChild(puddle);
        }
        // Hiệu ứng Giai Điệu Học Đường riêng của Shizuka
        if (
            petData.petEffect ===
            'doraemon-shizuka-study-magic'
        ) {
            this.container.classList.add(
                'pet-doraemon-shizuka-stage'
            );

            petElement.setAttribute('draggable', 'false');
        }

        // Hiệu ứng riêng của Kỳ Lân Biển Mộng Mơ
        if (petData.petEffect === 'fairy-narwhal-bubble-magic') {
            petElement.setAttribute('draggable', 'false');

            // Hào quang nước phía sau thú cưng
            const waterAura = document.createElement('div');
            waterAura.className = 'fairy-narwhal-water-aura';
            this.container.appendChild(waterAura);

            // Các bong bóng bao quanh thú cưng
            for (let i = 0; i < 7; i++) {
                const orbitBubble = document.createElement('span');
                orbitBubble.className = 'fairy-narwhal-orbit-bubble';

                const angle = (Math.PI * 2 * i) / 7;

                orbitBubble.style.left =
                    `${50 + Math.cos(angle) * 48}%`;

                orbitBubble.style.top =
                    `${50 + Math.sin(angle) * 40}%`;

                orbitBubble.style.setProperty(
                    '--orbit-delay',
                    `${-i * 0.42}s`
                );

                orbitBubble.style.setProperty(
                    '--orbit-size',
                    `${7 + (i % 3) * 4}px`
                );

                this.container.appendChild(orbitBubble);
            }
        }

        // THIÊN SỨ THỜI GIAN AMON — THẦN QUỐC BIÊN NIÊN
        if (petData.petEffect === 'amon-time-magic') {
            petElement.setAttribute('draggable', 'false');

            const chronicleCourt = document.createElement('div');

            chronicleCourt.className = 'amon-chronicle-court';

            chronicleCourt.innerHTML = `
        <span class="amon-chronicle-halo halo-outer"></span>
        <span class="amon-chronicle-halo halo-middle"></span>
        <span class="amon-chronicle-halo halo-inner"></span>

        <span class="amon-chronicle-crown"></span>
        <span class="amon-chronicle-throne"></span>
        <span class="amon-chronicle-floor"></span>

        <span class="amon-chronicle-shadow shadow-left"></span>
        <span class="amon-chronicle-shadow shadow-right"></span>
    `;

            const numerals = [
                'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ',
                'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ'
            ];

            numerals.forEach((numeral, index) => {
                const mark = document.createElement('span');

                mark.className = 'amon-chronicle-mark';
                mark.textContent = numeral;

                mark.style.setProperty(
                    '--mark-angle',
                    `${index * 30}deg`
                );

                mark.style.setProperty(
                    '--mark-angle-inverse',
                    `${index * -30}deg`
                );

                mark.style.setProperty(
                    '--mark-delay',
                    `${-index * 0.18}s`
                );

                chronicleCourt.appendChild(mark);
            });

            // Bốn trang biên niên giả bị tráo đổi.
            for (let i = 0; i < 4; i++) {
                const page = document.createElement('span');

                page.className = 'amon-counterfeit-page';

                page.style.setProperty('--page-index', i);
                page.style.setProperty('--page-angle', `${i * 90}deg`);
                page.style.setProperty('--page-angle-inverse', `${i * -90}deg`);
                page.style.setProperty('--page-delay', `${-i * 0.9}s`);

                chronicleCourt.appendChild(page);
            }

            this.container.appendChild(chronicleCourt);
        }

        // =========================================================
        // NÀNG HỌA SĨ TINH LINH — HIỆU ỨNG HỘI HỌA
        // Chỉ hiển thị quanh thú cưng, không phủ toàn màn hình.
        // Không có hiệu ứng khi nhấn.
        // =========================================================
        if (petData.petEffect === 'painting-muse-magic') {
            petElement.setAttribute('draggable', 'false');

            this.container.classList.add('pet-painting-stage');

            // Hào quang pha màu phía sau
            const canvasAura = document.createElement('div');
            canvasAura.className = 'painting-canvas-aura';
            canvasAura.setAttribute('aria-hidden', 'true');
            this.container.appendChild(canvasAura);

            // Nét cọ ánh sáng
            const brushStroke = document.createElement('span');
            brushStroke.className = 'painting-brush-stroke';
            brushStroke.setAttribute('aria-hidden', 'true');
            this.container.appendChild(brushStroke);

            // Những giọt màu bay xung quanh
            const pigmentColors = [
                '#22d3ee',
                '#a78bfa',
                '#f472b6',
                '#fbbf24',
                '#34d399',
                '#fb7185'
            ];

            pigmentColors.forEach((color, index) => {
                const pigment = document.createElement('span');

                pigment.className = 'painting-pigment';
                pigment.setAttribute('aria-hidden', 'true');

                const startAngle = index * 60;
                const middleAngle = startAngle + 16;
                const endAngle = startAngle + 28;

                pigment.style.setProperty('--paint-color', color);

                pigment.style.setProperty(
                    '--paint-angle',
                    `${startAngle}deg`
                );

                pigment.style.setProperty(
                    '--paint-angle-inverse',
                    `${-startAngle}deg`
                );

                pigment.style.setProperty(
                    '--paint-angle-middle',
                    `${middleAngle}deg`
                );

                pigment.style.setProperty(
                    '--paint-angle-middle-inverse',
                    `${-middleAngle}deg`
                );

                pigment.style.setProperty(
                    '--paint-angle-end',
                    `${endAngle}deg`
                );

                pigment.style.setProperty(
                    '--paint-angle-end-inverse',
                    `${-endAngle}deg`
                );

                pigment.style.setProperty(
                    '--paint-radius',
                    `${72 + (index % 2) * 10}px`
                );

                pigment.style.setProperty(
                    '--paint-delay',
                    `${-index * 0.52}s`
                );

                this.container.appendChild(pigment);
            });
        }

        // =========================================================
        // THẤT ĐẠI TỘI — LƯỜI BIẾNG
        // Hiệu ứng đứng chờ quanh thú cưng
        // =========================================================
        if (petData.petEffect === 'seven-sins-sloth-magic') {
            this.container.classList.add(
                'pet-seven-sins-sloth-stage'
            );

            petElement.setAttribute('draggable', 'false');

            const dreamHaze = document.createElement('div');
            dreamHaze.className = 'sloth-dream-haze';
            dreamHaze.setAttribute('aria-hidden', 'true');
            this.container.appendChild(dreamHaze);

            const dreamThrone =
                document.createElement('div');

            dreamThrone.className =
                'sloth-dream-throne';

            dreamThrone.setAttribute(
                'aria-hidden',
                'true'
            );

            this.container.appendChild(
                dreamThrone
            );

            const dreamHalo =
                document.createElement('div');

            dreamHalo.className =
                'sloth-dream-halo';

            dreamHalo.setAttribute(
                'aria-hidden',
                'true'
            );

            this.container.appendChild(
                dreamHalo
            );

            const dreamHourglass =
                document.createElement('div');

            dreamHourglass.className =
                'sloth-pet-hourglass';

            dreamHourglass.setAttribute(
                'aria-hidden',
                'true'
            );

            dreamHourglass.innerHTML = `
                <span
                    class="pet-hourglass-frame"
                ></span>

                <span
                    class="pet-hourglass-sand"
                ></span>
            `;

            this.container.appendChild(
                dreamHourglass
            );

            const dreamSeal = document.createElement('div');
            dreamSeal.className = 'sloth-dream-seal';
            dreamSeal.setAttribute('aria-hidden', 'true');
            this.container.appendChild(dreamSeal);

            const runeRing = document.createElement('div');
            runeRing.className = 'sloth-rune-ring';
            runeRing.setAttribute('aria-hidden', 'true');

            const runes = [
                'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'
            ];

            runes.forEach((symbol, index) => {
                const rune = document.createElement('span');
                const angle = index * (360 / runes.length);

                rune.className = 'sloth-orbit-rune';
                rune.textContent = symbol;

                rune.style.transform = `
            rotate(${angle}deg)
            translateX(78px)
            rotate(${-angle}deg)
        `;

                rune.style.setProperty(
                    '--sloth-rune-delay',
                    `${-index * 0.38}s`
                );

                runeRing.appendChild(rune);
            });

            this.container.appendChild(runeRing);

            for (
                let index = 0;
                index < 7;
                index++
            ) {
                const feather =
                    document.createElement('span');

                const angle =
                    index * (360 / 7);

                feather.className =
                    'sloth-dream-feather';

                feather.textContent =
                    index === 6 ? 'Ⅶ' : '✦';

                feather.setAttribute(
                    'aria-hidden',
                    'true'
                );

                feather.style.setProperty(
                    '--sloth-feather-angle',
                    `${angle}deg`
                );

                feather.style.setProperty(
                    '--sloth-feather-angle-back',
                    `${-angle}deg`
                );

                feather.style.setProperty(
                    '--sloth-feather-delay',
                    `${-index * 0.44}s`
                );

                this.container.appendChild(
                    feather
                );
            }

            for (let index = 0; index < 6; index++) {
                const mote = document.createElement('span');

                mote.className = 'sloth-sleep-mote';
                mote.textContent = index % 2 === 0 ? 'z' : '✦';
                mote.setAttribute('aria-hidden', 'true');

                mote.style.setProperty(
                    '--sloth-x',
                    `${18 + index * 13}%`
                );

                mote.style.setProperty(
                    '--sloth-delay',
                    `${-index * 0.72}s`
                );

                mote.style.setProperty(
                    '--sloth-duration',
                    `${3.8 + (index % 3) * 0.65}s`
                );

                mote.style.setProperty(
                    '--sloth-size',
                    `${10 + (index % 3) * 3}px`
                );

                this.container.appendChild(mote);
            }
        }

        // =========================================================
        // BÉ RẮN PHÚC LỘC 2026
        // Trang trí riêng quanh thú cưng.
        // Hiệu ứng toàn màn hình được tạo sau khi pet đã xuất hiện.
        // Không có hiệu ứng nhấn.
        // =========================================================
        if (petData.petEffect === 'birthday-serpent-2026-magic') {
            petElement.setAttribute('draggable', 'false');

            this.container.classList.add(
                'pet-birthday-serpent-2026-stage'
            );

            const petCrest = document.createElement('div');

            petCrest.className = 'birthday-2026-pet-crest';
            petCrest.setAttribute('aria-hidden', 'true');

            petCrest.innerHTML = `
                <span class="birthday-2026-pet-ring ring-outer"></span>
                <span class="birthday-2026-pet-ring ring-inner"></span>
                <span class="birthday-2026-pet-platform"></span>
                <span class="birthday-2026-pet-plaque">2026</span>
            `;

            for (let index = 0; index < 10; index++) {
                const bead = document.createElement('span');

                bead.className = 'birthday-2026-blessing-bead';

                bead.style.setProperty(
                    '--birthday-bead-angle',
                    `${index * 36}deg`
                );

                bead.style.setProperty(
                    '--birthday-bead-angle-back',
                    `${index * -36}deg`
                );

                bead.style.setProperty(
                    '--birthday-bead-delay',
                    `${-index * 0.32}s`
                );

                petCrest.appendChild(bead);
            }

            this.container.appendChild(petCrest);
        }

        // =========================================================

        // =========================================================
        // LINH THÚ TRÁI ĐẤT — HIỆU ỨNG RIÊNG
        // Không tái chế hiệu ứng cũ
        // =========================================================
        if (petData.petEffect === 'earth-guardian-magic') {
            petElement.setAttribute('draggable', 'false');
            this.container.classList.add('pet-earth-guardian-stage');

            // Hào quang sinh quyển
            const aura = document.createElement('div');
            aura.className = 'earth-guardian-aura';
            aura.setAttribute('aria-hidden', 'true');
            this.container.appendChild(aura);

            // Vòng nhịp sống
            const pulse = document.createElement('div');
            pulse.className = 'earth-life-pulse';
            pulse.setAttribute('aria-hidden', 'true');
            this.container.appendChild(pulse);

            // Quỹ đạo mặt trăng
            const moonOrbit = document.createElement('div');
            moonOrbit.className = 'earth-moon-orbit';
            moonOrbit.setAttribute('aria-hidden', 'true');
            moonOrbit.innerHTML = `<span class="earth-moon"></span>`;
            this.container.appendChild(moonOrbit);

            // Hạt sinh thái xoay quanh pet
            const particleKinds = ['leaf', 'water', 'cloud', 'spark'];

            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('span');
                particle.className = `earth-orbit-particle earth-particle-${particleKinds[i % particleKinds.length]}`;
                particle.setAttribute('aria-hidden', 'true');

                particle.style.setProperty('--earth-angle', `${i * 30}deg`);
                particle.style.setProperty('--earth-delay', `${-i * 0.35}s`);
                particle.style.setProperty('--earth-size', `${6 + (i % 3) * 3}px`);
                particle.style.setProperty('--earth-radius', `${68 + (i % 2) * 10}px`);

                this.container.appendChild(particle);
            }
        }

        // =========================================================
        // LINH THÚ SAO THỔ — CỘNG HƯỞNG CASSINI
        // Hiệu ứng chỉ được tạo bên trong container của pet.
        // Không phủ toàn màn hình, không có hiệu ứng nhấn.
        // =========================================================
        if (petData.petEffect === 'saturn-cassini-magic') {
            petElement.setAttribute('draggable', 'false');

            this.container.classList.add(
                'pet-saturn-cassini-stage'
            );

            // Nửa vành đai nằm phía sau pet
            const ringBack = document.createElement('div');

            ringBack.className =
                'saturn-cassini-plane saturn-cassini-plane-back';

            ringBack.setAttribute('aria-hidden', 'true');

            ringBack.innerHTML = `
        <span class="saturn-ring-band saturn-ring-amber"></span>
        <span class="saturn-ring-band saturn-ring-ivory"></span>
        <span class="saturn-cassini-gap"></span>
    `;

            this.container.appendChild(ringBack);

            // Cơn bão hình lục giác đặc trưng tại cực Sao Thổ
            const polarStorm = document.createElement('div');

            polarStorm.className = 'saturn-polar-hexagon';
            polarStorm.setAttribute('aria-hidden', 'true');

            polarStorm.innerHTML = `
        <span class="saturn-hexagon-line"></span>
        <span class="saturn-storm-eye"></span>
    `;

            this.container.appendChild(polarStorm);

            // Các vệ tinh nhỏ chuyển động quanh pet
            const moonField = document.createElement('div');

            moonField.className = 'saturn-shepherd-moons';
            moonField.setAttribute('aria-hidden', 'true');

            const moonPalette = [
                '#f4e6c8',
                '#d8c09a',
                '#bba37d',
                '#efe2cf',
                '#c9b28e',
                '#e8d5b2'
            ];

            for (let index = 0; index < 6; index++) {
                const moon = document.createElement('span');

                moon.className = 'saturn-shepherd-moon';

                moon.style.setProperty(
                    '--saturn-moon-delay',
                    `${-index * 0.68}s`
                );

                moon.style.setProperty(
                    '--saturn-moon-size',
                    `${4 + index % 3 * 2}px`
                );

                moon.style.setProperty(
                    '--saturn-moon-color',
                    moonPalette[index]
                );

                moon.style.setProperty(
                    '--saturn-moon-track',
                    `${56 + index % 2 * 18}px`
                );

                moon.style.setProperty(
                    '--saturn-moon-phase',
                    `${index * 60}deg`
                );

                moonField.appendChild(moon);
            }

            this.container.appendChild(moonField);

            // Nửa vành đai nằm phía trước pet
            const ringFront = document.createElement('div');

            ringFront.className =
                'saturn-cassini-plane saturn-cassini-plane-front';

            ringFront.setAttribute('aria-hidden', 'true');

            ringFront.innerHTML = `
        <span class="saturn-ring-band saturn-ring-amber"></span>
        <span class="saturn-ring-band saturn-ring-ivory"></span>
        <span class="saturn-cassini-gap"></span>
        <span class="saturn-ring-sheen"></span>
    `;

            this.container.appendChild(ringFront);
        }

        // =========================================================
        // NỮ THẦN MÙA XUÂN — XUÂN TỬU HOA VIÊN
        // Concept mới hoàn toàn: nho tím, dây leo ánh kim, rượu hồng ngọc
        // và thủy tinh màu. Không dùng cánh hoa, bướm, vương miện, cổng
        // hay mặt trời từ các hiệu ứng Mùa Xuân cũ.
        // =========================================================
        if (
            petData.petEffect ===
            'spring-vintage-goddess-magic'
        ) {
            petElement.setAttribute('draggable', 'false');
            petElement.classList.add('spring-vintage-avatar');

            this.container.classList.add(
                'pet-spring-vintage-stage'
            );

            const relic = document.createElement('div');
            relic.className = 'spring-vintage-pet-relic';
            relic.setAttribute('aria-hidden', 'true');

            relic.innerHTML = `
                <div class="spring-vintage-glass-disc">
                    <span class="spring-vintage-glass-cut cut-a"></span>
                    <span class="spring-vintage-glass-cut cut-b"></span>
                    <span class="spring-vintage-glass-cut cut-c"></span>
                </div>

                <span class="spring-vintage-vine arc-left"></span>
                <span class="spring-vintage-vine arc-right"></span>

                <div class="spring-vintage-grape-orbit orbit-a"></div>
                <div class="spring-vintage-grape-orbit orbit-b"></div>

                <div class="spring-vintage-nectar-vessel">
                    <span class="spring-vintage-nectar-surface"></span>
                    <span class="spring-vintage-nectar-glint"></span>
                </div>

                <div class="spring-vintage-gem-field"></div>
            `;

            const grapeOrbits = relic.querySelectorAll(
                '.spring-vintage-grape-orbit'
            );

            grapeOrbits.forEach((orbit, orbitIndex) => {
                const grapeCount = orbitIndex === 0 ? 9 : 7;

                for (let index = 0; index < grapeCount; index++) {
                    const grape = document.createElement('span');
                    grape.className = 'spring-vintage-grape';
                    grape.style.setProperty(
                        '--sv-grape-angle',
                        `${index * (360 / grapeCount) + orbitIndex * 19}deg`
                    );
                    grape.style.setProperty(
                        '--sv-grape-delay',
                        `${-(index + orbitIndex * 2) * 0.19}s`
                    );
                    grape.style.setProperty(
                        '--sv-grape-scale',
                        `${0.72 + (index % 4) * 0.09}`
                    );
                    orbit.appendChild(grape);
                }
            });

            const gemField = relic.querySelector(
                '.spring-vintage-gem-field'
            );

            const gemCount = window.matchMedia?.(
                '(max-width: 768px), (pointer: coarse)'
            ).matches ? 10 : 18;

            for (let index = 0; index < gemCount; index++) {
                const gem = document.createElement('span');
                gem.className = 'spring-vintage-gem';
                gem.style.setProperty(
                    '--sv-gem-x',
                    `${8 + (index * 31) % 84}%`
                );
                gem.style.setProperty(
                    '--sv-gem-y',
                    `${9 + (index * 47) % 77}%`
                );
                gem.style.setProperty(
                    '--sv-gem-delay',
                    `${-index * 0.31}s`
                );
                gem.style.setProperty(
                    '--sv-gem-size',
                    `${3 + index % 4}px`
                );
                gemField?.appendChild(gem);
            }

            this.container.appendChild(relic);

            // Kỹ năng nhấn riêng: "Xuân Tửu Khai Yến".
            // Listener gắn trực tiếp vào pet nên không gọi hiệu ứng click chung.
            let springCastLocked = false;

            petElement.addEventListener('click', event => {
                if (springCastLocked) return;

                if (
                    typeof PetInteractionManager !== 'undefined' &&
                    PetInteractionManager.isPetDragging
                ) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                springCastLocked = true;

                this.container.classList.remove(
                    'spring-vintage-casting'
                );

                void this.container.offsetWidth;

                this.container.classList.add(
                    'spring-vintage-casting'
                );

                const localBurst = document.createElement('div');
                localBurst.className = 'spring-vintage-local-burst';
                localBurst.setAttribute('aria-hidden', 'true');

                for (let index = 0; index < 16; index++) {
                    const drop = document.createElement('span');
                    drop.className = index % 3 === 0
                        ? 'spring-vintage-burst-grape'
                        : 'spring-vintage-burst-drop';

                    drop.style.setProperty(
                        '--sv-burst-angle',
                        `${index * (360 / 16)}deg`
                    );
                    drop.style.setProperty(
                        '--sv-burst-distance',
                        `${58 + index % 4 * 14}px`
                    );
                    drop.style.setProperty(
                        '--sv-burst-delay',
                        `${(index % 4) * 0.025}s`
                    );
                    localBurst.appendChild(drop);
                }

                this.container.appendChild(localBurst);

                if (
                    typeof EffectManager !== 'undefined' &&
                    typeof EffectManager.pulsePremiumSpringCrown === 'function'
                ) {
                    const rect = petElement.getBoundingClientRect();

                    EffectManager.pulsePremiumSpringCrown(
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2
                    );
                }

                window.setTimeout(() => {
                    localBurst.remove();
                    this.container?.classList.remove(
                        'spring-vintage-casting'
                    );
                }, 1550);

                window.setTimeout(() => {
                    springCastLocked = false;
                }, 6000);
            });
        }

        this.container.appendChild(petElement);

        /*
         * Bé Rắn dùng grid để ảnh, vòng và bệ được căn giữa.
         * Các pet khác vẫn giữ display block như cũ.
         */
        this.container.style.display =
            petData.id === 'pet_sinh_nhat_2026'
                ? 'grid'
                : 'block';

        this.container.classList.add('pet-idle');

        /*
         * Đặt Bé Rắn cách xa mép phải và mép dưới.
         * Chạy sau khi DOM và class hiệu ứng đã được gắn.
         */
        if (petData.id === 'pet_sinh_nhat_2026') {
            requestAnimationFrame(() => {
                const container = this.container;

                container.style.position = 'fixed';

                container.style.left = 'auto';
                container.style.top = 'auto';

                container.style.right = '42px';
                container.style.bottom = '72px';

                container.style.margin = '0';
                container.style.zIndex = '5000';

                /*
                 * Không đặt transform: none vì có thể chặn
                 * animation đứng chờ của thú cưng.
                 */
                container.style.removeProperty('transform');
            });
        }

        const closeBtn = document.createElement('button');

        closeBtn.type = 'button';
        closeBtn.className = 'pet-close-btn';
        closeBtn.innerHTML = '✖';
        closeBtn.title = 'Tháo thú cưng';
        closeBtn.setAttribute('aria-label', 'Tháo thú cưng');

        closeBtn.style.cssText = `
    position: absolute;
    top: -5px;
    right: -15px;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background: rgba(225, 29, 72, 0.18);
    color: #e11d48;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 11px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    font-weight: bold;
    z-index: 20;
`;

        const isTouchDevice =
            window.matchMedia?.('(pointer: coarse)').matches;

        closeBtn.style.opacity = isTouchDevice ? '0.82' : '0';

        this.container.onmouseenter = () => {
            closeBtn.style.opacity = '1';
        };

        this.container.onmouseleave = () => {
            closeBtn.style.opacity = isTouchDevice ? '0.82' : '0';
        };

        closeBtn.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });

        closeBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (
                typeof StoreManager !== 'undefined' &&
                typeof StoreManager.unapplyItem === 'function'
            ) {
                StoreManager.unapplyItem(petData.id);
            }
        });

        this.container.appendChild(closeBtn);
        this.makePetDraggable();
        localStorage.setItem('active_pet', petData.id);

        // =========================================================
        // QUỐC KHÁNH 2/9 — ULTIMATE NHẤN
        // SAO VÀNG KHẢI HOÀN
        //
        // Cùng cấp độ trình diễn với Xuân Tửu Khai Yến,
        // nhưng namespace / hình ảnh / animation hoàn toàn riêng.
        // KHÔNG gọi EffectManager.
        // KHÔNG dùng national-day-dong-son-magic cũ.
        // =========================================================
        if (
            petData.petEffect ===
            'national-day-chibi-star-magic'
        ) {
            let nd29UltimateLocked = false;

            petElement.addEventListener(
                'click',
                event => {
                    if (nd29UltimateLocked) return;

                    if (
                        typeof PetInteractionManager !== 'undefined' &&
                        PetInteractionManager.isPetDragging
                    ) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();

                    nd29UltimateLocked = true;

                    // Không cho hai ultimate tồn tại cùng lúc
                    document
                        .querySelectorAll(
                            '.nd29-victory-ultimate'
                        )
                        .forEach(node => node.remove());

                    this.container.classList.remove(
                        'nd29-casting'
                    );

                    void this.container.offsetWidth;

                    this.container.classList.add(
                        'nd29-casting'
                    );

                    const rect =
                        petElement.getBoundingClientRect();

                    const originX =
                        rect.left + rect.width / 2;

                    const originY =
                        rect.top + rect.height / 2;

                    const ultimate =
                        document.createElement('div');

                    ultimate.className =
                        'nd29-victory-ultimate';

                    ultimate.setAttribute(
                        'aria-hidden',
                        'true'
                    );

                    ultimate.style.setProperty(
                        '--nd29-origin-x',
                        `${originX}px`
                    );

                    ultimate.style.setProperty(
                        '--nd29-origin-y',
                        `${originY}px`
                    );

                    ultimate.innerHTML = `
                <!-- màn đỏ điện ảnh -->
                <div class="nd29-victory-backdrop"></div>

                <!-- ánh vàng lóe từ vị trí pet -->
                <div class="nd29-victory-origin-flare"></div>

                <!-- 5 tia sáng tượng trưng 5 cánh sao -->
                <div class="nd29-victory-rays">
                    <span class="ray ray-1"></span>
                    <span class="ray ray-2"></span>
                    <span class="ray ray-3"></span>
                    <span class="ray ray-4"></span>
                    <span class="ray ray-5"></span>
                </div>

                <!-- đại huy hiệu -->
                <div class="nd29-victory-emblem">
                    <span class="nd29-victory-ring ring-a"></span>
                    <span class="nd29-victory-ring ring-b"></span>
                    <span class="nd29-victory-ring ring-c"></span>

                    <span class="nd29-victory-number">
                        02 · 09
                    </span>

                    <span class="nd29-victory-star">
                        ★
                    </span>

                    <small>
                        VIỆT NAM
                    </small>
                </div>

                <!-- hai dải lụa -->
                <div class="nd29-victory-ribbons"></div>

                <!-- trường sao vàng -->
                <div class="nd29-victory-star-field"></div>

                <!-- các tia lửa -->
                <div class="nd29-victory-spark-field"></div>

                <!-- vòng chấn động -->
                <div class="nd29-victory-impact"></div>

                <!-- chữ ultimate -->
                <div class="nd29-victory-title">
                    <small>
                        QUỐC KHÁNH · 02/09
                    </small>

                    <strong>
                        SAO VÀNG KHẢI HOÀN
                    </strong>

                    <span>
                        ĐỘC LẬP · TỰ DO · VIỆT NAM
                    </span>
                </div>
            `;

                    /* =============================================
                       DẢI LỤA ĐỎ / VÀNG
                       ============================================= */
                    const ribbonField =
                        ultimate.querySelector(
                            '.nd29-victory-ribbons'
                        );

                    for (
                        let index = 0;
                        index < 10;
                        index++
                    ) {
                        const ribbon =
                            document.createElement('span');

                        ribbon.className =
                            index % 2 === 0
                                ? 'nd29-victory-ribbon is-red'
                                : 'nd29-victory-ribbon is-gold';

                        ribbon.style.setProperty(
                            '--nd29-ribbon-angle',
                            `${-42 + index * 9.3}deg`
                        );

                        ribbon.style.setProperty(
                            '--nd29-ribbon-delay',
                            `${0.18 + index * 0.045}s`
                        );

                        ribbon.style.setProperty(
                            '--nd29-ribbon-width',
                            `${10 + (index % 4) * 5}px`
                        );

                        ribbonField?.appendChild(
                            ribbon
                        );
                    }

                    /* =============================================
                       SAO VÀNG BAY
                       ============================================= */
                    const starField =
                        ultimate.querySelector(
                            '.nd29-victory-star-field'
                        );

                    const starCount =
                        window.matchMedia?.(
                            '(max-width: 768px), ' +
                            '(pointer: coarse), ' +
                            '(prefers-reduced-motion: reduce)'
                        ).matches
                            ? 18
                            : 36;

                    for (
                        let index = 0;
                        index < starCount;
                        index++
                    ) {
                        const star =
                            document.createElement('span');

                        star.className =
                            'nd29-victory-particle-star';

                        star.textContent = '★';

                        star.style.setProperty(
                            '--nd29-star-x',
                            `${(index * 47 + 7) % 100}%`
                        );

                        star.style.setProperty(
                            '--nd29-star-y',
                            `${(index * 71 + 11) % 100}%`
                        );

                        star.style.setProperty(
                            '--nd29-star-delay',
                            `${(index % 12) * 0.055}s`
                        );

                        star.style.setProperty(
                            '--nd29-star-size',
                            `${7 + index % 5 * 3}px`
                        );

                        star.style.setProperty(
                            '--nd29-star-spin',
                            `${index % 2 === 0
                                ? 160
                                : -160}deg`
                        );

                        starField?.appendChild(star);
                    }

                    /* =============================================
                       TIA LỬA VÀNG
                       ============================================= */
                    const sparkField =
                        ultimate.querySelector(
                            '.nd29-victory-spark-field'
                        );

                    const sparkCount =
                        starCount < 30
                            ? 28
                            : 58;

                    for (
                        let index = 0;
                        index < sparkCount;
                        index++
                    ) {
                        const spark =
                            document.createElement('span');

                        spark.className =
                            index % 7 === 0
                                ? 'nd29-victory-spark is-bright'
                                : 'nd29-victory-spark';

                        spark.style.setProperty(
                            '--nd29-spark-x',
                            `${(index * 37 + 5) % 100}%`
                        );

                        spark.style.setProperty(
                            '--nd29-spark-y',
                            `${(index * 61 + 9) % 100}%`
                        );

                        spark.style.setProperty(
                            '--nd29-spark-delay',
                            `${(index % 16) * 0.045}s`
                        );

                        spark.style.setProperty(
                            '--nd29-spark-size',
                            `${2 + index % 5}px`
                        );

                        sparkField?.appendChild(
                            spark
                        );
                    }

                    document.body.appendChild(
                        ultimate
                    );

                    requestAnimationFrame(() => {
                        ultimate.classList.add(
                            'is-active'
                        );
                    });

                    /* =============================================
                       LỜI THOẠI CỦA PET
                       ============================================= */
                    const dialogue =
                        document.createElement('div');

                    dialogue.className =
                        'nd29-victory-dialogue';

                    dialogue.textContent =
                        '⭐ “Một ngôi sao — triệu trái tim Việt Nam.”';

                    this.container.appendChild(
                        dialogue
                    );

                    // Ultimate tồn tại 5.7 giây
                    window.setTimeout(() => {
                        ultimate.classList.add(
                            'is-leaving'
                        );
                    }, 5000);

                    window.setTimeout(() => {
                        ultimate.remove();
                        dialogue.remove();

                        this.container
                            ?.classList.remove(
                                'nd29-casting'
                            );
                    }, 5700);

                    // Cooldown 6 giây
                    window.setTimeout(() => {
                        nd29UltimateLocked = false;
                    }, 6000);
                }
            );
        }

        // =========================================================
        // QUỐC KHÁNH — AMBIENT + KỸ NĂNG NHẤN
        // =========================================================
        if (
            petData.petEffect ===
            'national-day-dong-son-magic'
        ) {
            requestAnimationFrame(() => {
                this.container.classList.add(
                    'national-day-awakening'
                );

                const realm =
                    this.createNationalDayRealm();

                window.setTimeout(() => {
                    this.container?.classList.remove(
                        'national-day-awakening'
                    );
                }, 1300);

                let skillLocked = false;

                petElement.addEventListener(
                    'click',
                    event => {
                        if (skillLocked) return;

                        if (
                            typeof PetInteractionManager !==
                            'undefined' &&
                            PetInteractionManager.isPetDragging
                        ) {
                            return;
                        }

                        event.preventDefault();
                        event.stopPropagation();

                        skillLocked = true;

                        this.container.classList.remove(
                            'national-day-casting'
                        );

                        realm?.classList.remove(
                            'is-casting'
                        );

                        void this.container.offsetWidth;

                        if (realm) {
                            void realm.offsetWidth;
                        }

                        this.container.classList.add(
                            'national-day-casting'
                        );

                        realm?.classList.add(
                            'is-casting'
                        );

                        const rect =
                            petElement.getBoundingClientRect();

                        const burst =
                            document.createElement('div');

                        burst.className =
                            'national-day-independence-burst';

                        burst.style.setProperty(
                            '--nd-burst-x',
                            `${rect.left +
                            rect.width / 2}px`
                        );

                        burst.style.setProperty(
                            '--nd-burst-y',
                            `${rect.top +
                            rect.height / 2}px`
                        );

                        burst.innerHTML = `
                    <span class="nd-burst-medallion">
                        <b>★</b>
                        <small>02 · 09</small>
                    </span>
                    <span class="nd-burst-ring ring-a"></span>
                    <span class="nd-burst-ring ring-b"></span>
                    <span class="nd-burst-ring ring-c"></span>
                    <div class="nd-burst-rays"></div>
                    <div class="nd-burst-stars"></div>
                `;

                        const stars =
                            burst.querySelector(
                                '.nd-burst-stars'
                            );

                        for (
                            let index = 0;
                            index < 15;
                            index++
                        ) {
                            const star =
                                document.createElement(
                                    'span'
                                );

                            star.textContent = '★';

                            star.style.setProperty(
                                '--nd-burst-angle',
                                `${index * 24}deg`
                            );

                            star.style.setProperty(
                                '--nd-burst-distance',
                                `${92 +
                                (index % 5) *
                                19}px`
                            );

                            star.style.setProperty(
                                '--nd-burst-delay',
                                `${(index % 4) *
                                0.035}s`
                            );

                            stars?.appendChild(star);
                        }

                        document.body.appendChild(
                            burst
                        );

                        const dialogue =
                            document.createElement(
                                'div'
                            );

                        dialogue.className =
                            'national-day-dialogue-box';

                        dialogue.textContent =
                            '★ Hào khí non sông — Độc lập, Tự do!';

                        this.container.appendChild(
                            dialogue
                        );

                        window.setTimeout(() => {
                            burst.remove();
                            dialogue.remove();

                            this.container?.classList.remove(
                                'national-day-casting'
                            );

                            realm?.classList.remove(
                                'is-casting'
                            );
                        }, 3000);

                        window.setTimeout(() => {
                            skillLocked = false;
                        }, 5200);
                    }
                );
            });
        }

        // =========================================================
        // PREMIUM MÙA XUÂN — KÍCH HOẠT CẢ THEME + EFFECT
        // Chạy sau vòng render để luôn đè lên theme/effect thường
        // trong lúc pet Premium đang được trang bị.
        // =========================================================
        if (
            petData.petEffect ===
            'spring-vintage-goddess-magic'
        ) {
            requestAnimationFrame(() => {
                this.container.classList.add(
                    'spring-vintage-awakening'
                );

                // PET MÙA XUÂN CHỈ CHẠY HIỆU ỨNG RIÊNG CỦA PET.
                // Không can thiệp EffectManager.
                // Không tự bật Xuân Tửu Hoa Viên.
                // Không xóa effect mà người dùng đang trang bị.

                this.installPremiumSpringObserver();

                window.setTimeout(() => {
                    this.container?.classList.remove(
                        'spring-vintage-awakening'
                    );
                }, 1450);
            });
        }

        // =========================================================
        // KỸ NĂNG TOÀN MÀN HÌNH — MỘNG GIỚI TRÌ HOÃN
        // =========================================================
        if (petData.petEffect === 'seven-sins-sloth-magic') {
            // Tạo lớp hiệu ứng toàn màn hình khi trang bị
            this.createSlothDreamRealm();

            const slothPetImage =
                document.getElementById('virtual-pet-img');

            let slothSkillLocked = false;

            if (slothPetImage) {
                slothPetImage.addEventListener(
                    'click',
                    (event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        if (slothSkillLocked) return;

                        slothSkillLocked = true;

                        const realm =
                            document.getElementById(
                                'sloth-dream-realm'
                            );

                        this.container.classList.remove(
                            'sloth-domain-casting'
                        );

                        realm?.classList.remove('is-casting');

                        void this.container.offsetWidth;

                        if (realm) {
                            void realm.offsetWidth;
                        }

                        this.container.classList.add(
                            'sloth-domain-casting'
                        );

                        realm?.classList.add('is-casting');

                        window.setTimeout(() => {
                            this.container.classList.remove(
                                'sloth-domain-casting'
                            );

                            realm?.classList.remove(
                                'is-casting'
                            );

                            slothSkillLocked = false;
                        }, 5000);
                    },
                    {
                        signal:
                            this.interactionAbortController.signal
                    }
                );
            }
        }

        // Chỉ gắn hiệu ứng tương tác nếu vật phẩm cho phép
        if (
            !petData.disableClickEffect &&
            typeof PetInteractionManager !== 'undefined'
        ) {
            const petImg =
                document.getElementById('virtual-pet-img');

            if (petImg) {
                PetInteractionManager.attachEvents(
                    petImg,
                    petData
                );
            }
        }
    }

    static makePetDraggable() {
        let isDragging = false;
        let didDrag = false;

        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;

        // Hủy listener của thú cưng trước đó
        if (this.interactionAbortController) {
            this.interactionAbortController.abort();
        }

        this.interactionAbortController = new AbortController();
        const { signal } = this.interactionAbortController;

        // Cần gỡ bỏ event mousedown cũ để không bị nhân bản sự kiện khi spawn thú mới

        this.container.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            if (
                e.target instanceof Element &&
                e.target.closest(
                    '.pet-close-btn, #pet-hunger-bar, button, a, input'
                )
            ) {
                return;
            }

            const rect = this.container.getBoundingClientRect();

            isDragging = true;
            didDrag = false;

            this.container.dataset.petDragged = '0';
            this.container.classList.remove('pet-idle');

            startX = e.clientX;
            startY = e.clientY;
            initialX = rect.left;
            initialY = rect.top;

            this.container.style.left = `${rect.left}px`;
            this.container.style.top = `${rect.top}px`;
            this.container.style.right = 'auto';
            this.container.style.bottom = 'auto';
            this.container.style.transition = 'none';

            if (typeof PetInteractionManager !== 'undefined') {
                PetInteractionManager.isPetDragging = false;
                PetInteractionManager.resetIdle?.();
            }
        }, { signal });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) + Math.abs(dy) > 6) {
                didDrag = true;
            }
            const containerWidth =
                this.container.offsetWidth || 188;

            const containerHeight =
                this.container.offsetHeight || 198;

            /*
 * Bé Rắn có vòng, bệ và nhãn tràn ra ngoài container,
 * vì vậy cần chừa khoảng an toàn lớn hơn.
 */
            const isBirthdayPet =
                this.container.classList.contains(
                    'pet-birthday-serpent-2026-stage'
                );

            const isPremiumSpringPet =
                this.container.classList.contains(
                    'pet-spring-vintage-stage'
                );

            const safeRightGap =
                isBirthdayPet
                    ? 34
                    : isPremiumSpringPet
                        ? 46
                        : 8;

            const safeBottomGap =
                isBirthdayPet
                    ? 58
                    : isPremiumSpringPet
                        ? 56
                        : 8;

            const safeLeft = Math.min(
                Math.max(8, initialX + dx),
                Math.max(
                    8,
                    window.innerWidth -
                    containerWidth -
                    safeRightGap
                )
            );

            const safeTop = Math.min(
                Math.max(8, initialY + dy),
                Math.max(
                    8,
                    window.innerHeight -
                    containerHeight -
                    safeBottomGap
                )
            );

            this.container.style.left = `${safeLeft}px`;
            this.container.style.top = `${safeTop}px`;

            this.container.style.bottom = 'auto';
            this.container.style.right = 'auto';

            // Vệt bong bóng khi kéo Kỳ Lân Biển
            const narwhalPet = this.container.querySelector(
                '.fairy-narwhal-bubble-magic'
            );

            if (narwhalPet && Math.random() < 0.45) {
                for (let i = 0; i < 2; i++) {
                    const bubble = document.createElement('span');

                    bubble.className = 'fairy-narwhal-trail-bubble';

                    const size = Math.random() * 10 + 7;

                    bubble.style.left =
                        `${e.clientX + (Math.random() * 34 - 17)}px`;

                    bubble.style.top =
                        `${e.clientY + (Math.random() * 26 - 6)}px`;

                    bubble.style.setProperty(
                        '--bubble-size',
                        `${size}px`
                    );

                    bubble.style.setProperty(
                        '--bubble-drift',
                        `${Math.random() * 44 - 22}px`
                    );

                    bubble.style.animationDelay = `${i * 0.05}s`;

                    document.body.appendChild(bubble);

                    setTimeout(() => {
                        bubble.remove();
                    }, 1350);
                }
            }

            // CỘNG HƯỞNG DẢI PHÉP THUẬT KHI DI CHUYỂN
            // ============================================
            // VỆT NHẬT THỰC KHI KÉO NYX
            // ============================================
            const nyxPet = this.container.querySelector(
                '.nyx-night-goddess-magic'
            );

            if (nyxPet && Math.random() < 0.56) {
                // Cường hóa khi đang có Kỷ Nguyên hoặc kỹ năng Nhật Thực
                const hasNightDomain = Boolean(
                    document.querySelector(
                        '.nyx-domain-ambient, .nyx-dark-world'
                    )
                );

                const particleCount = hasNightDomain ? 3 : 1;

                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('span');

                    particle.className = hasNightDomain
                        ? 'nyx-trail-particle nyx-trail-enhanced'
                        : 'nyx-trail-particle';

                    particle.style.left =
                        `${e.clientX + (Math.random() * 34 - 17)}px`;

                    particle.style.top =
                        `${e.clientY + (Math.random() * 24 - 12)}px`;

                    particle.style.setProperty(
                        '--nyx-particle-size',
                        `${hasNightDomain
                            ? Math.random() * 5 + 8
                            : Math.random() * 3 + 5}px`
                    );

                    particle.style.setProperty(
                        '--nyx-trail-drift',
                        `${Math.random() * 56 - 28}px`
                    );

                    particle.style.setProperty(
                        '--nyx-trail-fall',
                        `${Math.random() * 45 + 25}px`
                    );

                    particle.style.setProperty(
                        '--nyx-trail-angle',
                        `${Math.random() * 50 - 35}deg`
                    );

                    particle.style.animationDelay = `${i * 0.035}s`;

                    document.body.appendChild(particle);

                    setTimeout(() => {
                        particle.remove();
                    }, 1450);
                }
            }

            // VỆT “GIÂY BỊ ĐÁNH CẮP” KHI KÉO AMON
            const amonPet = this.container.querySelector('.amon-time-magic');

            if (amonPet && Math.random() < 0.72) {
                const trailCount =
                    document.body.classList.contains('theme-lotm-mysteries')
                        ? 3
                        : 2;

                for (let i = 0; i < trailCount; i++) {
                    const stolenSecond = document.createElement('span');

                    stolenSecond.className = 'amon-stolen-second-trail';

                    stolenSecond.textContent =
                        Math.random() > 0.5
                            ? '⌁'
                            : 'Ⅻ';

                    stolenSecond.style.left =
                        `${e.clientX + (Math.random() * 42 - 21)}px`;

                    stolenSecond.style.top =
                        `${e.clientY + (Math.random() * 34 - 17)}px`;

                    stolenSecond.style.setProperty(
                        '--trail-drift-x',
                        `${Math.random() * 90 - 45}px`
                    );

                    stolenSecond.style.setProperty(
                        '--trail-drift-y',
                        `${Math.random() * 70 + 35}px`
                    );

                    stolenSecond.style.setProperty(
                        '--trail-spin',
                        `${Math.random() * 260 - 130}deg`
                    );

                    stolenSecond.style.animationDelay =
                        `${i * 0.035}s`;

                    document.body.appendChild(stolenSecond);

                    setTimeout(() => {
                        stolenSecond.remove();
                    }, 1650);
                }
            }

            // VỆT XUÂN TỬU KHI KÉO NỮ THẦN MÙA XUÂN
            // Hạt nho + giọt hồng ngọc, hoàn toàn riêng với trail cũ.
            const springVintagePet = this.container.querySelector(
                '.spring-vintage-goddess-magic'
            );

            if (springVintagePet && Math.random() < 0.58) {
                const trailCount = Math.random() < 0.35 ? 2 : 1;

                for (let i = 0; i < trailCount; i++) {
                    const trail = document.createElement('span');
                    trail.className = Math.random() < 0.34
                        ? 'spring-vintage-trail is-grape'
                        : 'spring-vintage-trail is-nectar';

                    trail.style.left =
                        `${e.clientX + (Math.random() * 34 - 17)}px`;
                    trail.style.top =
                        `${e.clientY + (Math.random() * 28 - 14)}px`;
                    trail.style.setProperty(
                        '--sv-trail-drift-x',
                        `${Math.random() * 52 - 26}px`
                    );
                    trail.style.setProperty(
                        '--sv-trail-drift-y',
                        `${24 + Math.random() * 44}px`
                    );
                    trail.style.setProperty(
                        '--sv-trail-spin',
                        `${Math.random() * 220 - 110}deg`
                    );
                    trail.style.setProperty(
                        '--sv-trail-size',
                        `${6 + Math.random() * 7}px`
                    );

                    document.body.appendChild(trail);

                    window.setTimeout(() => {
                        trail.remove();
                    }, 1300);
                }
            }


        }, { signal });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;

            isDragging = false;
            this.container.classList.add('pet-idle');
        }, { signal });

        // Lắng nghe sự kiện click trên toàn trang
        document.addEventListener('click', (e) => {
            // Sau khi kéo thì không vô tình kích hoạt kỹ năng
            if (didDrag) {
                didDrag = false;
                return;
            }

            // =================================================
            // MÈO NHỎ NGÀY MƯA — “VŨ ĐIỆU MÁI Ô”
            // Hiệu ứng nhấn hoàn toàn cục bộ trong container pet.
            // =================================================
            if (
                e.target &&
                e.target.id === 'virtual-pet-img' &&
                e.target.classList.contains('rainy-day-cat-magic')
            ) {
                const petImg = e.target;
                const container = document.getElementById(
                    'virtual-pet-container'
                );

                if (!container || container.dataset.rainyClickLocked === '1') {
                    return;
                }

                container.dataset.rainyClickLocked = '1';

                const oldScene = container.querySelector(
                    '.rainy-day-click-scene'
                );

                oldScene?.remove();

                const clickScene = document.createElement('div');
                clickScene.className = 'rainy-day-click-scene';
                clickScene.setAttribute('aria-hidden', 'true');

                // Một màn mưa ngắn bung từ mép ô xuống vũng nước.
                for (let index = 0; index < 18; index++) {
                    const drop = document.createElement('span');
                    drop.className = 'rainy-day-click-drop';

                    drop.style.setProperty(
                        '--rainy-click-x',
                        `${3 + (index * 29) % 94}%`
                    );

                    drop.style.setProperty(
                        '--rainy-click-delay',
                        `${(index % 6) * 0.035}s`
                    );

                    drop.style.setProperty(
                        '--rainy-click-fall',
                        `${86 + (index % 5) * 10}px`
                    );

                    drop.style.setProperty(
                        '--rainy-click-slant',
                        `${-9 + (index % 4) * 6}deg`
                    );

                    clickScene.appendChild(drop);
                }

                // Ba gợn nước méo nhẹ, không dùng vòng tròn quỹ đạo cũ.
                for (let index = 0; index < 3; index++) {
                    const ripple = document.createElement('span');
                    ripple.className = 'rainy-day-click-ripple';
                    ripple.style.setProperty(
                        '--rainy-ripple-delay',
                        `${index * 0.12}s`
                    );
                    clickScene.appendChild(ripple);
                }

                // Các vệt nước bật khỏi vũng theo hình răng cưa thấp.
                for (let index = 0; index < 7; index++) {
                    const splash = document.createElement('span');
                    splash.className = 'rainy-day-splash-tooth';
                    splash.style.setProperty(
                        '--rainy-splash-x',
                        `${20 + index * 10}%`
                    );
                    splash.style.setProperty(
                        '--rainy-splash-delay',
                        `${0.08 + index * 0.025}s`
                    );
                    splash.style.setProperty(
                        '--rainy-splash-lift',
                        `${18 + (index % 3) * 8}px`
                    );
                    clickScene.appendChild(splash);
                }

                container.appendChild(clickScene);

                petImg.classList.remove('rainy-day-umbrella-twirl');
                container.classList.remove('rainy-day-click-active');

                void petImg.offsetWidth;
                void container.offsetWidth;

                petImg.classList.add('rainy-day-umbrella-twirl');
                container.classList.add('rainy-day-click-active');

                window.setTimeout(() => {
                    clickScene.remove();
                    petImg.classList.remove('rainy-day-umbrella-twirl');
                    container.classList.remove('rainy-day-click-active');
                    delete container.dataset.rainyClickLocked;
                }, 1250);

                return;
            }

            // =================================================
            // AMON — ĐẠI QUYỀN “ĐÁNH CẮP DÒNG THỜI GIAN”
            // =================================================
            if (
                e.target &&
                e.target.id === 'virtual-pet-img' &&
                e.target.classList.contains('amon-time-magic')
            ) {
                const petImg = e.target;

                const container = document.getElementById(
                    'virtual-pet-container'
                );

                // Không cho đại kỹ năng bị kích hoạt chồng nhiều lần.
                if (document.querySelector('.amon-grand-theft')) {
                    return;
                }

                petImg.classList.add('amon-authority-release');

                setTimeout(() => {
                    petImg.classList.remove('amon-authority-release');
                }, 1200);

                const grandTheft = document.createElement('div');

                grandTheft.className = 'amon-grand-theft';

                grandTheft.innerHTML = `
        <div class="amon-theft-blackout"></div>
        <div class="amon-theft-corridor"></div>

        <div class="amon-theft-iris">
            <span class="theft-iris-ring ring-a"></span>
            <span class="theft-iris-ring ring-b"></span>
            <span class="theft-iris-ring ring-c"></span>
            <span class="theft-iris-core"></span>
        </div>

        <div class="amon-theft-verdict">
            THE NEXT SECOND BELONGS TO AMON
        </div>

        <div class="amon-theft-collapse"></div>
    `;

                // Tạo bảy phân thân lịch sử.
                if (
                    petImg.tagName === 'IMG' &&
                    petImg.src
                ) {
                    for (let i = 0; i < 7; i++) {
                        const echo = document.createElement('img');

                        echo.className = 'amon-history-echo';
                        echo.src = petImg.src;
                        echo.alt = '';

                        echo.style.setProperty(
                            '--echo-index',
                            i
                        );

                        echo.style.setProperty(
                            '--echo-angle',
                            `${i * (360 / 7)}deg`
                        );

                        echo.style.setProperty(
                            '--echo-angle-inverse',
                            `${i * (-360 / 7)}deg`
                        );

                        echo.style.setProperty(
                            '--echo-delay',
                            `${0.35 + i * 0.08}s`
                        );

                        grandTheft.appendChild(echo);
                    }
                }

                // Vòng 36 mảnh thời gian vỡ tung.
                for (let i = 0; i < 36; i++) {
                    const shard = document.createElement('span');

                    shard.className = 'amon-time-theft-shard';

                    shard.textContent =
                        i % 3 === 0
                            ? '⊘'
                            : i % 3 === 1
                                ? '⌁'
                                : '∵';

                    shard.style.setProperty(
                        '--shard-angle',
                        `${i * 10}deg`
                    );

                    const shardDistance =
                        160 + Math.random() * 310;

                    shard.style.setProperty(
                        '--shard-distance',
                        `${-shardDistance}px`
                    );

                    shard.style.setProperty(
                        '--shard-distance-end',
                        `${-(shardDistance + 120)}px`
                    );

                    shard.style.setProperty(
                        '--shard-delay',
                        `${0.25 + Math.random() * 0.9}s`
                    );

                    shard.style.setProperty(
                        '--shard-size',
                        `${10 + Math.random() * 17}px`
                    );

                    grandTheft.appendChild(shard);
                }

                document.body.appendChild(grandTheft);

                if (container) {
                    const dialogue = document.createElement('div');

                    dialogue.className = 'amon-dialogue-box';

                    dialogue.textContent =
                        '“Ta không dừng thời gian. Ta chỉ lấy mất khoảnh khắc nó thuộc về ngươi.”';

                    container.appendChild(dialogue);

                    setTimeout(() => {
                        dialogue.remove();
                    }, 5200);
                }

                setTimeout(() => {
                    grandTheft.remove();
                }, 6000);

                return;
            }

            // =================================================
            // NYX — PHÁN QUYẾT NHẬT THỰC
            // =================================================
            if (
                e.target &&
                e.target.id === 'virtual-pet-img' &&
                e.target.classList.contains('nyx-night-goddess-magic')
            ) {
                const petImg = e.target;

                const container = document.getElementById(
                    'virtual-pet-container'
                );

                // Không cho kích hoạt nhiều lần
                if (document.querySelector('.nyx-dark-world')) {
                    return;
                }

                petImg.classList.add('nyx-power-release');

                setTimeout(() => {
                    petImg.classList.remove('nyx-power-release');
                }, 950);

                // Tạo thế giới Vĩnh Dạ
                const darkWorld = document.createElement('div');
                darkWorld.className = 'nyx-dark-world';

                // Nhật thực trung tâm
                const eclipse = document.createElement('div');
                eclipse.className = 'nyx-eclipse';
                darkWorld.appendChild(eclipse);

                // Ma pháp trận
                const sigil = document.createElement('div');
                sigil.className = 'nyx-eclipse-sigil';
                darkWorld.appendChild(sigil);

                // Sao nền
                for (let i = 0; i < 72; i++) {
                    const star = document.createElement('span');
                    star.className = 'nyx-star';

                    const size = Math.random() * 2.6 + 1;

                    star.style.left = `${Math.random() * 100}%`;
                    star.style.top = `${Math.random() * 100}%`;
                    star.style.width = `${size}px`;
                    star.style.height = `${size}px`;

                    star.style.animationDuration =
                        `${Math.random() * 2.2 + 1.1}s`;

                    star.style.animationDelay =
                        `${Math.random() * 2.4}s`;

                    darkWorld.appendChild(star);
                }

                // Sao băng phán quyết
                for (let i = 0; i < 5; i++) {
                    const meteor = document.createElement('span');

                    meteor.className = 'nyx-judgement-meteor';
                    meteor.style.left = '-24vw';
                    meteor.style.top =
                        `${Math.random() * 42 - 8}vh`;

                    meteor.style.setProperty(
                        '--meteor-length',
                        `${Math.random() * 120 + 170}px`
                    );

                    meteor.style.setProperty(
                        '--meteor-speed',
                        `${Math.random() * 0.65 + 1.35}s`
                    );

                    meteor.style.setProperty(
                        '--meteor-delay',
                        `${0.55 + i * 0.62 + Math.random() * 0.35}s`
                    );

                    darkWorld.appendChild(meteor);
                }

                document.body.appendChild(darkWorld);

                // Lời thoại của Nyx
                if (container) {
                    const dialogue = document.createElement('div');

                    dialogue.className = 'nyx-dialogue-box';

                    dialogue.textContent =
                        '\u263E "M\u1ECDi v\u00EC sao \u0111\u1EC1u c\u00FAi \u0111\u1EA7u tr\u01B0\u1EDBc V\u0129nh D\u1EA1."';

                    container.appendChild(dialogue);

                    setTimeout(() => {
                        dialogue.remove();
                    }, 6400);
                }

                setTimeout(() => {
                    darkWorld.remove();
                }, 6400);

                return;
            }

            // Nhấn Kỳ Lân Biển để kích hoạt Điều Ước Hải Lam
            if (
                e.target &&
                e.target.id === 'virtual-pet-img' &&
                e.target.classList.contains('fairy-narwhal-bubble-magic')
            ) {
                const petImg = e.target;

                const container = document.getElementById(
                    'virtual-pet-container'
                );

                // Không cho spam hiệu ứng
                if (document.querySelector('.fairy-narwhal-wish-wave')) {
                    return;
                }

                petImg.classList.add('fairy-narwhal-wish-cast');

                setTimeout(() => {
                    petImg.classList.remove('fairy-narwhal-wish-cast');
                }, 950);

                const rect = petImg.getBoundingClientRect();

                const wishWave = document.createElement('div');
                wishWave.className = 'fairy-narwhal-wish-wave';

                wishWave.style.left =
                    `${rect.left + rect.width / 2}px`;

                wishWave.style.top =
                    `${rect.top + rect.height / 2}px`;

                // Bong bóng bung ra
                for (let i = 0; i < 18; i++) {
                    const wishBubble = document.createElement('span');

                    wishBubble.className =
                        'fairy-narwhal-wish-bubble';

                    wishBubble.style.setProperty(
                        '--wish-angle',
                        `${i * 20}deg`
                    );

                    wishBubble.style.setProperty(
                        '--wish-distance',
                        `${78 + Math.random() * 62}px`
                    );

                    wishBubble.style.setProperty(
                        '--wish-size',
                        `${7 + Math.random() * 13}px`
                    );

                    wishBubble.style.animationDelay =
                        `${Math.random() * 0.18}s`;

                    wishWave.appendChild(wishBubble);
                }

                // Tinh quang bung ra
                for (let i = 0; i < 8; i++) {
                    const sparkle = document.createElement('span');

                    sparkle.className =
                        'fairy-narwhal-wish-sparkle';

                    sparkle.textContent = '✦';

                    sparkle.style.setProperty(
                        '--wish-angle',
                        `${i * 45 + 12}deg`
                    );

                    sparkle.style.setProperty(
                        '--wish-distance',
                        `${95 + Math.random() * 55}px`
                    );

                    sparkle.style.animationDelay =
                        `${0.08 + Math.random() * 0.2}s`;

                    wishWave.appendChild(sparkle);
                }

                document.body.appendChild(wishWave);

                // Khung thoại
                if (container) {
                    const dialogue = document.createElement('div');

                    dialogue.className =
                        'fairy-narwhal-dialogue';

                    dialogue.textContent =
                        '🌊 Điều ước Hải Lam đã thức tỉnh!';

                    container.appendChild(dialogue);

                    setTimeout(() => {
                        dialogue.remove();
                    }, 2100);
                }

                setTimeout(() => {
                    wishWave.remove();
                }, 2100);
            }
        }, { signal });
    }
}