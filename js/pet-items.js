// js/pet-items.js

class PetManager {
    static container = document.getElementById('virtual-pet-container');
    static interactionAbortController = null;

    static spawnPet(petData) {
        this.container =
            document.getElementById('virtual-pet-container') ||
            this.container;

        if (!this.container || !petData) return;
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
            'pet-painting-stage'
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

        this.container.appendChild(petElement);
        this.container.style.display = 'block';
        this.container.classList.add('pet-idle');

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
            this.container.style.left = `${initialX + dx}px`;
            this.container.style.top = `${initialY + dy}px`;
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