// js/pet-interactions.js

class PetInteractionManager {
    static isEnabled = localStorage.getItem('petInteractionsEnabled') !== 'false';
    static unlockedInteractions = [];

    static serverOffset = 0;
    static getNow() {
        return Date.now() + this.serverOffset;
    }

    // --- CÁC CHỈ SỐ SINH TỒN ---
    static hunger = 100;
    static lastHungerUpdate = this.getNow();
    static idleTime = 0;
    static sleepTime = 0;
    static isSleeping = false;
    static isBusy = false;
    static isPetDragging = false;
    static loopInterval = null;
    static tapTimer = null;
    static interactionAbortController = null;
    static initialized = false;
    static purchaseInProgress = false;
    static currentPetId = null;
    static stellarAmbientInterval = null;
    static stellarLongPressTimer = null;
    static stellarLongPressTriggered = false;
    static interactionFilter = 'all';

    static interactivePets = [
        {
            id: 'pet_shiba',
            name: '🐕 Cún Shiba',
            desc: 'Nhấn 1 lần: Vuốt ve. Nhấn đúp: Ném xương. Lưu ý: Cần cho cún ăn để có sức chạy nhảy!',
            price: 250
        },
        {
            id: 'pet_doisong_bandem',
            name: '🌌 Mèo Đêm Đầy Sao',
            desc: 'Nhấn 1 lần: Vuốt ve. Nhấn đúp: Cho ăn cá. Tốc độ di chuyển lẹ làng và ngủ nướng gấp 3 lần!',
            price: 350
        },
        {
            id: 'pet_doisong_banngay',
            name: '🐶 Cún Vui Vẻ',
            desc: 'Nhấn 1 lần: Vuốt ve. Nhấn đúp: Cho ăn xương.',
            price: 300
        },
        {
            id: 'pet_truyenthuyet_1',
            name: '🦄 Kỳ Lân Tinh Tú',
            desc: 'Nhấn 1 lần: Dệt Chòm Sao (-5 Tinh lực). Nhấn đúp: Bước Nhảy Thiên Hà (-10). Nhấn giữ: Thánh Địa Tinh Vân (-15). Nhấn thanh Tinh lực để tiếp năng lượng.',
            price: 450,
            usesHunger: true,
            interactionType: 'stellar'
        },
        {
            id: 'pet_premium_mua_xuan',
            name: '🌸 Tiểu Hoa Mộng',
            desc: 'Dùng Mộng Ấn cạnh thanh Mộng lực để chọn 1 trong 3 kỹ năng: Hoa Tức Lưu Ly (-5), Tửu Quang Hồi Vũ (-10), Lưu Ly Hoa Viên (-15). Nhấn trực tiếp Tiểu Hoa Mộng vẫn giữ hiệu ứng Thần Yến riêng.',
            price: 500,
            usesHunger: true,
            interactionType: 'spring-dream'
        }
    ];

    static isSupported(petId) {
        return this.interactivePets.some(
            pet => pet.id === petId
        );
    }

    static usesHungerSystem(petId) {
        const pet = this.interactivePets.find(
            item => item.id === petId
        );

        return Boolean(pet) &&
            pet.usesHunger !== false;
    }

    static isUnlocked(petId) {
        return this.unlockedInteractions.includes(petId);
    }

    static getPerPetInteractionStorageKey() {
        const user = this.getCurrentUser();
        const ownerKey = user?.username
            ? String(user.username)
            : 'guest';

        return `petInteractionEnabledByPet:${ownerKey}`;
    }

    static getPerPetInteractionPreferences() {
        try {
            const raw = localStorage.getItem(
                this.getPerPetInteractionStorageKey()
            );

            if (!raw) return {};

            const parsed = JSON.parse(raw);

            return parsed && typeof parsed === 'object'
                ? parsed
                : {};
        } catch (error) {
            console.warn(
                '[PetInteraction] Không đọc được trạng thái bật/tắt từng pet:',
                error
            );
            return {};
        }
    }

    static isPetInteractionEnabled(petId) {
        const preferences =
            this.getPerPetInteractionPreferences();

        /*
         * Mặc định BẬT để giữ nguyên hành vi của những tài khoản
         * đã mua tương tác trước khi có công tắc riêng.
         */
        return preferences[petId] !== false;
    }

    static savePetInteractionPreference(
        petId,
        enabled
    ) {
        const preferences =
            this.getPerPetInteractionPreferences();

        preferences[petId] = Boolean(enabled);

        try {
            localStorage.setItem(
                this.getPerPetInteractionStorageKey(),
                JSON.stringify(preferences)
            );
        } catch (error) {
            console.warn(
                '[PetInteraction] Không lưu được trạng thái bật/tắt từng pet:',
                error
            );
        }
    }

    static canInteract(petId) {
        return (
            this.isEnabled &&
            this.isSupported(petId) &&
            this.isUnlocked(petId) &&
            this.isPetInteractionEnabled(petId)
        );
    }

    /*
     * Một số Premium có click riêng trên nhân vật.
     * Những pet này vẫn dùng hệ Tương tác thú cưng nhưng
     * kích hoạt bằng UI độc lập, tuyệt đối không chiếm click của pet.
     */
    static usesExternalActivation(petId) {
        return (
            petId ===
            'pet_premium_mua_xuan'
        );
    }

    static getCurrentUser() {
        try {
            return JSON.parse(
                localStorage.getItem('currentUser')
            );
        } catch (error) {
            console.error(
                'Không đọc được tài khoản hiện tại:',
                error
            );

            return null;
        }
    }

    static init() {
        if (this.initialized) return;
        this.initialized = true;

        const toggle =
            document.getElementById(
                'togglePetInteractions'
            );

        if (toggle) {
            toggle.checked = this.isEnabled;

            toggle.addEventListener(
                'change',
                () => {
                    this.toggle(toggle.checked);
                }
            );
        }

        if (typeof db !== 'undefined') {
            db.ref('.info/serverTimeOffset')
                .on('value', snapshot => {
                    this.serverOffset =
                        Number(snapshot.val()) || 0;
                });
        }

        const user = this.getCurrentUser();

        if (
            !user?.username ||
            typeof db === 'undefined'
        ) {
            return;
        }

        this.recoverPendingPetEconomyOps(user.username);

        db.ref(
            `student_pet_interactions/${user.username}`
        ).on(
            'value',
            snapshot => {
                const data = snapshot.val() || {};

                /*
                 * Chỉ nhận những pet có giá trị true.
                 * Không dùng Object.keys trực tiếp vì
                 * dữ liệu false vẫn có thể bị tính là mở khóa.
                 */
                this.unlockedInteractions =
                    Object.keys(data).filter(
                        petId => data[petId] === true
                    );

                const modal =
                    document.getElementById(
                        'petInteractionInfoModal'
                    );

                if (
                    modal?.classList.contains('active')
                ) {
                    this.showInfo();
                }

                const activePetId =
                    localStorage.getItem('active_pet');

                if (
                    activePetId &&
                    this.canInteract(activePetId) &&
                    this.usesHungerSystem(activePetId)
                ) {
                    this.initHungerSystem(
                        user.username
                    );

                    if (
                        activePetId ===
                        'pet_premium_mua_xuan'
                    ) {
                        const petElement =
                            document.getElementById(
                                'virtual-pet-img'
                            );

                        this.mountSpringDreamSkillDock(
                            petElement,
                            this.interactionAbortController
                                ?.signal
                        );
                    }
                } else {
                    if (this.loopInterval) {
                        clearInterval(
                            this.loopInterval
                        );

                        this.loopInterval = null;
                    }

                    document
                        .getElementById(
                            'pet-hunger-bar'
                        )
                        ?.remove();

                    this.setSleepState(false);
                }
            },
            error => {
                console.error(
                    'Không đọc được tương tác pet:',
                    error
                );
            }
        );
    }

    static initHungerSystem(username) {
        const container =
            document.getElementById(
                'virtual-pet-container'
            );

        if (!container) return;

        const activePetId =
            localStorage.getItem('active_pet');

        const isStellar =
            activePetId ===
            'pet_truyenthuyet_1';

        const isSpringDream =
            activePetId ===
            'pet_premium_mua_xuan';

        let barContainer =
            document.getElementById(
                'pet-hunger-bar'
            );

        if (!barContainer) {
            barContainer =
                document.createElement('div');

            barContainer.id =
                'pet-hunger-bar';

            barContainer.innerHTML = `
            <span id="pet-hunger-icon"
                  class="pet-hunger-icon">
                ${isSpringDream ? '❖' : (isStellar ? '✦' : '🍖')}
            </span>

            <div class="pet-hunger-track">
                <div id="pet-hunger-fill"></div>
            </div>

            <span id="pet-hunger-value"
                  class="pet-hunger-value">
                100
            </span>
        `;

            barContainer.addEventListener(
                'pointerdown',
                event => {
                    event.stopPropagation();
                }
            );

            container.appendChild(
                barContainer
            );
        }

        barContainer.className =
            isSpringDream
                ? 'pet-hunger-bar spring-dream-hunger-bar'
                : (
                    isStellar
                        ? 'pet-hunger-bar stellar-hunger-bar'
                        : 'pet-hunger-bar'
                );

        const icon =
            document.getElementById(
                'pet-hunger-icon'
            );

        if (icon) {
            icon.textContent =
                isSpringDream
                    ? '❖'
                    : (isStellar ? '✦' : '🍖');
        }

        barContainer.title =
            isSpringDream
                ? 'Mộng lực của Tiểu Hoa Mộng — nhấn để mở Vườn Dưỡng Mộng'
                : (
                    isStellar
                        ? 'Tinh lực của Kỳ Lân — nhấn để mở Đài Tiếp Năng'
                        : 'Độ đói của thú cưng — nhấn để mua đồ ăn'
                );

        barContainer.onclick = event => {
            event.preventDefault();
            event.stopPropagation();

            if (isSpringDream) {
                this.openSpringDreamFoodShop();
            } else if (isStellar) {
                this.openStellarFoodShop();
            } else {
                this.openFoodShop();
            }
        };

        barContainer.style.display =
            this.isEnabled
                ? 'flex'
                : 'none';

        db.ref(
            `student_pet_status/${username}`
        ).once(
            'value',
            snapshot => {
                const data =
                    snapshot.val();

                const now =
                    this.getNow();

                if (data) {
                    const energyKey =
                        isSpringDream
                            ? 'springDreamEnergy'
                            : 'hunger';

                    const updateKey =
                        isSpringDream
                            ? 'springDreamLastUpdate'
                            : 'lastUpdate';

                    this.hunger =
                        data[energyKey] !== undefined
                            ? Number(data[energyKey])
                            : 100;

                    this.lastHungerUpdate =
                        Number(data[updateKey]) ||
                        now;

                    const hoursPassed =
                        Math.floor(
                            (
                                now -
                                this.lastHungerUpdate
                            ) / 3600000
                        );

                    if (hoursPassed > 0) {
                        /*
                         * Tiểu Hoa Mộng có Mộng lực riêng, giảm 6/giờ.
                         * Kỳ Lân mất 8 Tinh lực/giờ.
                         * Pet thường mất 10/giờ.
                         */
                        const decay =
                            isSpringDream
                                ? 6
                                : (isStellar ? 8 : 10);

                        this.hunger =
                            Math.max(
                                0,
                                this.hunger -
                                decay *
                                hoursPassed
                            );

                        this.lastHungerUpdate +=
                            hoursPassed *
                            3600000;

                        this.saveHungerToDB();
                    }
                } else {
                    this.hunger = 100;
                    this.lastHungerUpdate = now;
                    this.saveHungerToDB();
                }

                this.updateHungerUI();
                this.startPetLoop();

                if (isStellar) {
                    this.startStellarAmbient();
                }
            },
            error => {
                console.error(
                    'Không đọc được trạng thái pet:',
                    error
                );
            }
        );
    }

    static async saveHungerToDB() {
        const user = this.getCurrentUser();
        if (!user?.username || typeof db === 'undefined') return;

        try {
            const activePetId = localStorage.getItem('active_pet');
            const safeEnergy = Math.max(0, Math.min(100, Number(this.hunger) || 0));
            const safeUpdatedAt = Number(this.lastHungerUpdate) || this.getNow();
            const isSpringDream = activePetId === 'pet_premium_mua_xuan';
            const energyKey = isSpringDream ? 'springDreamEnergy' : 'hunger';
            const updateKey = isSpringDream ? 'springDreamLastUpdate' : 'lastUpdate';

            const ref = db.ref(`student_pet_status/${user.username}`);
            const tx = await ref.transaction(current => {
                const next = current && typeof current === 'object' ? { ...current } : {};
                const remoteUpdatedAt = Number(next[updateKey]) || 0;

                // Tab/snapshot cũ không được ghi đè trạng thái mới hơn (đặc biệt sau khi mua food).
                if (remoteUpdatedAt > safeUpdatedAt) return next;

                next[energyKey] = safeEnergy;
                next[updateKey] = safeUpdatedAt;
                return next;
            }, undefined, false);

            if (tx.committed) {
                const value = tx.snapshot.val() || {};
                this.hunger = Number(value[energyKey] ?? safeEnergy);
                this.lastHungerUpdate = Number(value[updateKey]) || safeUpdatedAt;
            }
        } catch (error) {
            console.error('Không thể lưu trạng thái thú cưng:', error);
        }
    }

    static updateHungerUI() {
        this.hunger = Math.max(
            0,
            Math.min(
                100,
                Number(this.hunger) || 0
            )
        );

        const activePetId =
            localStorage.getItem(
                'active_pet'
            );

        const isStellar =
            activePetId ===
            'pet_truyenthuyet_1';

        const isSpringDream =
            activePetId ===
            'pet_premium_mua_xuan';

        const fill =
            document.getElementById(
                'pet-hunger-fill'
            );

        const value =
            document.getElementById(
                'pet-hunger-value'
            );

        const bar =
            document.getElementById(
                'pet-hunger-bar'
            );

        if (fill) {
            fill.style.width =
                `${this.hunger}%`;

            if (isSpringDream) {
                if (this.hunger > 70) {
                    fill.style.background =
                        'linear-gradient(90deg, #84a92f, #e2b85c, #b51f55)';
                } else if (
                    this.hunger > 30
                ) {
                    fill.style.background =
                        'linear-gradient(90deg, #9f6f2c, #b51f55, #72148f)';
                } else {
                    fill.style.background =
                        'linear-gradient(90deg, #7f1d1d, #c2415d, #ea580c)';
                }
            } else if (isStellar) {
                if (this.hunger > 70) {
                    fill.style.background =
                        'linear-gradient(90deg, #38bdf8, #818cf8, #d8b4fe)';
                } else if (
                    this.hunger > 30
                ) {
                    fill.style.background =
                        'linear-gradient(90deg, #6366f1, #a78bfa)';
                } else {
                    fill.style.background =
                        'linear-gradient(90deg, #7f1d1d, #ef4444, #f97316)';
                }
            } else if (
                this.hunger > 50
            ) {
                fill.style.background =
                    '#2ecc71';
            } else if (
                this.hunger > 20
            ) {
                fill.style.background =
                    '#f39c12';
            } else {
                fill.style.background =
                    '#e74c3c';
            }
        }

        if (value) {
            value.textContent =
                Math.round(this.hunger);
        }

        if (bar) {
            bar.classList.toggle(
                'is-low',
                this.hunger <= 30
            );

            bar.classList.toggle(
                'is-critical',
                this.hunger <= 10
            );
        }

        const normalShopText =
            document.getElementById(
                'shopHungerText'
            );

        if (normalShopText) {
            normalShopText.textContent =
                Math.round(this.hunger);
        }

        const stellarShopText =
            document.getElementById(
                'stellarEnergyText'
            );

        if (stellarShopText) {
            stellarShopText.textContent =
                Math.round(this.hunger);
        }

        const springDreamShopText =
            document.getElementById(
                'springDreamEnergyText'
            );

        if (springDreamShopText) {
            springDreamShopText.textContent =
                Math.round(this.hunger);
        }

        const petImg =
            document.getElementById(
                'virtual-pet-img'
            );

        if (petImg) {
            petImg.classList.toggle(
                'stellar-energy-full',
                isStellar &&
                this.hunger > 70
            );

            petImg.classList.toggle(
                'stellar-energy-low',
                isStellar &&
                this.hunger <= 30
            );

            petImg.classList.toggle(
                'stellar-energy-critical',
                isStellar &&
                this.hunger <= 10
            );

            petImg.classList.toggle(
                'spring-dream-energy-full',
                isSpringDream &&
                this.hunger > 70
            );

            petImg.classList.toggle(
                'spring-dream-energy-low',
                isSpringDream &&
                this.hunger <= 30
            );

            petImg.classList.toggle(
                'spring-dream-energy-critical',
                isSpringDream &&
                this.hunger <= 10
            );
        }

        if (isSpringDream) {
            this.updateSpringDreamSkillDock();
        }
    }

    static startPetLoop() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
        }

        this.loopInterval = setInterval(() => {
            const activePetId =
                localStorage.getItem('active_pet');

            // Pet không thuộc hệ tương tác thì dừng hoàn toàn
            if (
                !activePetId ||
                !this.canInteract(activePetId) ||
                !this.usesHungerSystem(activePetId)
            ) {
                clearInterval(this.loopInterval);
                this.loopInterval = null;

                this.setSleepState(false);

                document
                    .getElementById('pet-hunger-bar')
                    ?.remove();

                document
                    .getElementById(
                        'spring-dream-skill-dock'
                    )
                    ?.remove();

                return;
            }

            if (
                !this.isEnabled ||
                document
                    .getElementById('virtual-pet-container')
                    ?.style.display === 'none'
            ) {
                return;
            }

            // Phần code cũ phía dưới giữ nguyên
            if (!this.isEnabled || document.getElementById('virtual-pet-container').style.display === 'none') return;

            const now = this.getNow();
            const elapsedHours = Math.max(
                0,
                Math.floor((now - this.lastHungerUpdate) / 3600000)
            );
            if (elapsedHours > 0) {
                const hourlyDecay = this.getPetHourlyDecay(activePetId);

                this.hunger = Math.max(
                    0,
                    this.hunger - hourlyDecay * elapsedHours
                );

                // Giữ phần phút lẻ để reload/background không làm pet đói nhanh/chậm sai.
                this.lastHungerUpdate += elapsedHours * 3600000;
                this.saveHungerToDB();
                this.updateHungerUI();
            }

            if (this.isBusy || this.isPetDragging) return;

            this.idleTime++;

            if (this.hunger < 10) {
                this.setSleepState(true);
            } else {
                if (this.isSleeping) {
                    this.sleepTime++;

                    const activePetId = localStorage.getItem('active_pet');
                    const maxSleepTime = (activePetId === 'pet_doisong_bandem') ? 15 : 5;

                    if (this.sleepTime >= maxSleepTime) {
                        this.setSleepState(false);
                        this.roam();
                    }
                } else {
                    if (this.idleTime >= 10) {
                        this.setSleepState(true);
                    }
                    else if (this.idleTime % 2 === 0 && this.hunger >= 50) {
                        this.roam();
                    }
                }
            }
        }, 1000);
    }

    static roam() {
        const container = document.getElementById('virtual-pet-container');
        const petImg = document.getElementById('virtual-pet-img');
        if (!container || !petImg) return;

        const rect = container.getBoundingClientRect();

        if (container.style.left === '') {
            container.style.left = rect.left + 'px';
            container.style.top = rect.top + 'px';
            container.style.bottom = 'auto';
            container.style.right = 'auto';
        }

        const activePetId = localStorage.getItem('active_pet');
        const isCat = activePetId === 'pet_doisong_bandem';

        const rangeX = isCat ? 100 : 60;
        const rangeY = isCat ? 60 : 40;

        const moveX = (Math.random() * rangeX) - (rangeX / 2);
        const moveY = (Math.random() * rangeY) - (rangeY / 2);

        let newX = rect.left + moveX;
        let newY = rect.top + moveY;

        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        newX = Math.max(0, Math.min(maxX, newX));
        newY = Math.max(0, Math.min(maxY, newY));

        petImg.style.transform = (moveX < 0) ? 'scaleX(-1)' : 'scaleX(1)';

        const speed = isCat ? '0.4s' : '0.8s';
        container.style.transition = `left ${speed} ease-in-out, top ${speed} ease-in-out`;
        container.style.left = `${newX}px`;
        container.style.top = `${newY}px`;

        setTimeout(() => {
            if (!this.isPetDragging) container.style.transition = 'none';
        }, isCat ? 400 : 800);
    }

    static setSleepState(isSleeping) {
        if (
            this.isSleeping ===
            isSleeping
        ) {
            return;
        }

        this.isSleeping = isSleeping;

        const petImg =
            document.getElementById(
                'virtual-pet-img'
            );

        const container =
            document.getElementById(
                'virtual-pet-container'
            );

        const activePetId =
            localStorage.getItem(
                'active_pet'
            );

        if (!container) return;

        if (isSleeping) {
            this.sleepTime = 0;

            if (petImg) {
                petImg.classList.add(
                    'pet-sleeping'
                );
            }

            if (
                activePetId ===
                'pet_truyenthuyet_1'
            ) {
                if (
                    !document.getElementById(
                        'stellar-slumber-cocoon'
                    )
                ) {
                    const cocoon =
                        document.createElement(
                            'div'
                        );

                    cocoon.id =
                        'stellar-slumber-cocoon';

                    cocoon.className =
                        'stellar-slumber-cocoon';

                    cocoon.innerHTML = `
                    <div class="stellar-cocoon-shell"></div>
                    <div class="stellar-cocoon-orbit orbit-one"></div>
                    <div class="stellar-cocoon-orbit orbit-two"></div>
                    <span class="stellar-cocoon-moon">☾</span>
                    <span class="stellar-cocoon-star star-a">✦</span>
                    <span class="stellar-cocoon-star star-b">✧</span>
                    <span class="stellar-cocoon-star star-c">⋆</span>
                `;

                    container.appendChild(
                        cocoon
                    );
                }
            } else if (
                activePetId ===
                'pet_doisong_bandem'
            ) {
                if (
                    !document.getElementById(
                        'pet-sleep-stars-container'
                    )
                ) {
                    const starsContainer =
                        document.createElement(
                            'div'
                        );

                    starsContainer.id =
                        'pet-sleep-stars-container';

                    starsContainer.className =
                        'cat-sleep-stars-wrap';

                    starsContainer.innerHTML = `
                    <div class="css-night-cloud"></div>
                    <div class="css-dream-branch">
                        <div class="css-leaf leaf-1"></div>
                        <div class="css-leaf leaf-2"></div>
                    </div>
                    <div class="css-dream-bird"></div>
                    <div class="css-star star-primary"></div>
                    <div class="css-star star-secondary"></div>
                    <div class="css-star star-tertiary"></div>
                `;

                    container.appendChild(
                        starsContainer
                    );
                }
            } else if (
                !document.getElementById(
                    'pet-zzz'
                )
            ) {
                const zzz =
                    document.createElement(
                        'div'
                    );

                zzz.id = 'pet-zzz';
                zzz.className =
                    'pet-zzz-particle';

                zzz.textContent = 'Zzz';

                container.appendChild(zzz);
            }
        } else {
            this.idleTime = 0;

            if (petImg) {
                petImg.classList.remove(
                    'pet-sleeping'
                );
            }

            document
                .getElementById(
                    'pet-zzz'
                )
                ?.remove();

            document
                .getElementById(
                    'pet-sleep-stars-container'
                )
                ?.remove();

            document
                .getElementById(
                    'stellar-slumber-cocoon'
                )
                ?.remove();
        }
    }

    static resetIdle() {
        this.idleTime = 0;
        if (this.isSleeping && this.hunger >= 10) {
            this.setSleepState(false);
        }
    }

    static openFoodShop() {
        let modal = document.getElementById('foodShopModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'foodShopModal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '999999';
            modal.innerHTML = `
                <div class="modal-content form-container" style="max-width: 360px; text-align: center; border-top: 6px solid #f39c12;">
                    <button class="close-btn" onclick="document.getElementById('foodShopModal').classList.remove('active')">✖</button>
                    <h3 style="color: #f39c12; margin-bottom: 5px;">🍖 Cửa Hàng Thú Cưng</h3>
                    <p style="margin-bottom: 20px; font-size: 0.95em; color: #666;">Độ no hiện tại: <strong id="shopHungerText" style="color: #2ecc71;">0</strong> / 100</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 0;">
                        <button class="food-shop-btn" onclick="PetInteractionManager.buyFood(10, 5)">🍰 Bánh (10 🪙) ➔ +5 No</button>
                        <button class="food-shop-btn" onclick="PetInteractionManager.buyFood(20, 10)">🍪 Bánh quy (20 🪙) ➔ +10 No</button>
                        <button class="food-shop-btn" onclick="PetInteractionManager.buyFood(40, 50)">🍛 Cơm thường (40 🪙) ➔ +50 No</button>
                        <button class="food-shop-btn premium" onclick="PetInteractionManager.buyFood(100, 100)">🥩 Đồ ăn xịn (100 🪙) ➔ Đầy bụng</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        this.updateHungerUI();
        modal.classList.add('active');
    }

    static createPetOperationId(prefix = 'pet') {
        const cryptoPart = (() => {
            try {
                if (window.crypto?.getRandomValues) {
                    const values = new Uint32Array(2);
                    window.crypto.getRandomValues(values);
                    return Array.from(values).map(v => v.toString(36)).join('');
                }
            } catch (_) {}
            return Math.random().toString(36).slice(2, 12);
        })();

        return `${prefix}_${Date.now().toString(36)}_${cryptoPart}`;
    }

    static getPetHourlyDecay(petId) {
        if (petId === 'pet_premium_mua_xuan') return 6;
        if (petId === 'pet_truyenthuyet_1') return 8;
        return 10;
    }

    static async reservePetFoodOperation(username, payload) {
        const opId = payload.opId || this.createPetOperationId('food');
        const ref = db.ref(`pet_food_ops/${username}/${opId}`);
        const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;
        const result = await ref.transaction(current => {
            if (current) return;
            return {
                opId,
                status: 'reserved',
                petId: String(payload.petId || ''),
                price: Number(payload.price) || 0,
                gain: Number(payload.gain) || 0,
                energyField: String(payload.energyField || 'hunger'),
                createdAt: serverTimestamp
            };
        }, undefined, false);

        if (!result.committed) return null;
        return { opId, ref, value: result.snapshot.val() || {} };
    }

    static async applyPaidPetFoodOperation(username, opId, op) {
        if (!username || !opId || !op || op.status !== 'paid') return false;

        const statusRef = db.ref(`student_pet_status/${username}`);
        const now = this.getNow();
        const petId = String(op.petId || '');
        const energyField = op.energyField === 'springDreamEnergy'
            ? 'springDreamEnergy'
            : 'hunger';
        const updateField = energyField === 'springDreamEnergy'
            ? 'springDreamLastUpdate'
            : 'lastUpdate';
        const gain = Math.max(0, Number(op.gain) || 0);
        const hourlyDecay = this.getPetHourlyDecay(petId);

        const tx = await statusRef.transaction(current => {
            const next = current && typeof current === 'object' ? { ...current } : {};
            const foodOps = next.foodOps && typeof next.foodOps === 'object'
                ? { ...next.foodOps }
                : {};

            if (foodOps[opId] === true) return next;

            let energy = next[energyField] !== undefined
                ? Number(next[energyField])
                : 100;
            let lastUpdate = Number(next[updateField]) || now;
            const elapsedHours = Math.max(0, Math.floor((now - lastUpdate) / 3600000));

            if (elapsedHours > 0) {
                energy = Math.max(0, energy - hourlyDecay * elapsedHours);
                lastUpdate += elapsedHours * 3600000;
            }

            next[energyField] = Math.min(100, Math.max(0, energy) + gain);
            next[updateField] = Math.max(lastUpdate, now);
            foodOps[opId] = true;

            // Giữ marker retry gần nhất, tránh node tăng vô hạn.
            const keys = Object.keys(foodOps).sort();
            while (keys.length > 64) {
                delete foodOps[keys.shift()];
            }
            next.foodOps = foodOps;
            return next;
        }, undefined, false);

        if (!tx.committed) return false;

        const snapshotValue = tx.snapshot.val() || {};
        this.hunger = Number(snapshotValue[energyField]);
        this.lastHungerUpdate = Number(snapshotValue[updateField]) || now;

        await db.ref(`pet_food_ops/${username}/${opId}`).update({
            status: 'completed',
            completedAt: firebase.database.ServerValue.TIMESTAMP
        });
        return true;
    }

    static async purchasePetFood({ price, gain, petId, energyField, itemName }) {
        const user = this.getCurrentUser();
        if (!user?.username || typeof db === 'undefined') return false;

        const safePrice = Math.max(0, Math.round(Number(price) || 0));
        const safeGain = Math.max(0, Number(gain) || 0);
        const reservation = await this.reservePetFoodOperation(user.username, {
            petId,
            price: safePrice,
            gain: safeGain,
            energyField
        });
        if (!reservation) return false;

        const opPath = `pet_food_ops/${user.username}/${reservation.opId}`;
        try {
            const coinSnap = await db.ref(`student_coins/${user.username}`).once('value');
            const balance = Number(coinSnap.val()) || 0;
            if (balance < safePrice) {
                await reservation.ref.remove().catch(() => {});
                alert(`❌ Không đủ Coin! Bạn còn thiếu ${safePrice - balance} 🪙.`);
                return false;
            }

            const updates = {};
            updates[`student_coins/${user.username}`] = firebase.database.ServerValue.increment(-safePrice);
            updates[`${opPath}/status`] = 'paid';
            updates[`${opPath}/paidAt`] = firebase.database.ServerValue.TIMESTAMP;
            await db.ref().update(updates);

            const paidSnap = await reservation.ref.once('value');
            const paidOp = paidSnap.val() || {};
            const applied = await this.applyPaidPetFoodOperation(
                user.username,
                reservation.opId,
                paidOp
            );
            if (!applied) throw new Error('PET_FOOD_APPLY_PENDING');

            this.updateHungerUI();
            this.resetIdle();
            return true;
        } catch (error) {
            console.error('[PetInteraction] Lỗi giao dịch thức ăn:', error);
            try {
                const check = await reservation.ref.once('value');
                const op = check.val();
                if (op?.status === 'paid') {
                    await this.applyPaidPetFoodOperation(user.username, reservation.opId, op);
                    this.updateHungerUI();
                    this.resetIdle();
                    return true;
                }
                if (op?.status === 'completed') return true;
            } catch (_) {}
            throw error;
        }
    }

    static async recoverPendingPetEconomyOps(username) {
        if (!username || typeof db === 'undefined') return;
        try {
            const snap = await db.ref(`pet_food_ops/${username}`).once('value');
            const ops = snap.val() || {};
            for (const [opId, op] of Object.entries(ops)) {
                if (op?.status === 'paid') {
                    try {
                        await this.applyPaidPetFoodOperation(username, opId, op);
                    } catch (error) {
                        console.warn('[PetInteraction] Chưa recover được food op:', opId, error);
                    }
                }
            }
        } catch (error) {
            console.warn('[PetInteraction] Không quét được pet economy ops:', error);
        }
    }

    static async buyFood(price, hungerGain) {
        const user = this.getCurrentUser();
        if (!user?.username || typeof db === 'undefined') return;
        if (this.hunger >= 100) {
            alert('Thú cưng đang no căng bụng rồi! Không ăn thêm được đâu.');
            return;
        }
        if (!confirm(`Thanh toán ${price} Coin để mua món này?`)) return;

        const activePetId = localStorage.getItem('active_pet');
        try {
            const ok = await this.purchasePetFood({
                price,
                gain: hungerGain,
                petId: activePetId,
                energyField: 'hunger',
                itemName: 'thức ăn'
            });
            if (!ok) return;
            alert('Ăn ngon quá! Đã hồi phục năng lượng.');
            if (this.hunger > 50) {
                const container = document.getElementById('virtual-pet-container');
                if (container) this.spawnParticles(container, '💖');
            }
        } catch (error) {
            alert('❌ Giao dịch thức ăn chưa hoàn tất. Hệ thống sẽ tự đối soát khi tải lại.');
        }
    }

    static openStellarFoodShop() {
        let modal =
            document.getElementById(
                'stellarFoodShopModal'
            );

        if (!modal) {
            modal =
                document.createElement('div');

            modal.id =
                'stellarFoodShopModal';

            modal.className =
                'modal-overlay stellar-food-modal';

            modal.style.zIndex =
                '999999';

            modal.innerHTML = `
            <div class="modal-content stellar-food-content">
                <button class="close-btn"
                        onclick="document.getElementById('stellarFoodShopModal').classList.remove('active')">
                    ✖
                </button>

                <div class="stellar-food-emblem">
                    ✦
                </div>

                <h3>Đài Tiếp Năng Tinh Tú</h3>

                <p class="stellar-energy-status">
                    Tinh lực hiện tại:
                    <strong id="stellarEnergyText">
                        0
                    </strong>
                    / 100
                </p>

                <div class="stellar-food-list">
                    <button class="stellar-food-btn"
                            onclick="PetInteractionManager.buyStellarFood(15, 10, 'Bụi Sao', '✦')">
                        <span>✦</span>
                        <strong>Bụi Sao</strong>
                        <small>15 Coin · +10 Tinh lực</small>
                    </button>

                    <button class="stellar-food-btn"
                            onclick="PetInteractionManager.buyStellarFood(30, 25, 'Mảnh Trăng', '☾')">
                        <span>☾</span>
                        <strong>Mảnh Trăng</strong>
                        <small>30 Coin · +25 Tinh lực</small>
                    </button>

                    <button class="stellar-food-btn premium"
                            onclick="PetInteractionManager.buyStellarFood(60, 60, 'Trái Tinh Vân', '◉')">
                        <span>◉</span>
                        <strong>Trái Tinh Vân</strong>
                        <small>60 Coin · +60 Tinh lực</small>
                    </button>

                    <button class="stellar-food-btn legendary"
                            onclick="PetInteractionManager.buyStellarFood(100, 100, 'Lõi Sao Sơ Khai', '✺')">
                        <span>✺</span>
                        <strong>Lõi Sao Sơ Khai</strong>
                        <small>100 Coin · hồi đầy Tinh lực</small>
                    </button>
                </div>
            </div>
        `;

            document.body.appendChild(
                modal
            );
        }

        this.updateHungerUI();
        modal.classList.add('active');
    }

    static async buyStellarFood(price, energyGain, itemName, symbol) {
        const user = this.getCurrentUser();
        if (!user?.username || typeof db === 'undefined') {
            alert('❌ Không tìm thấy tài khoản.');
            return;
        }
        if (localStorage.getItem('active_pet') !== 'pet_truyenthuyet_1') {
            alert('❌ Kỳ Lân hiện không hoạt động.');
            return;
        }
        if (this.hunger >= 100) {
            alert('Kỳ Lân đang tràn đầy Tinh lực.');
            return;
        }
        if (!confirm(`Dùng ${price} Coin để mua ${itemName}?`)) return;

        try {
            const ok = await this.purchasePetFood({
                price,
                gain: energyGain,
                petId: 'pet_truyenthuyet_1',
                energyField: 'hunger',
                itemName
            });
            if (!ok) return;
            document.getElementById('stellarFoodShopModal')?.classList.remove('active');
            this.playStellarFeedingRitual(symbol, itemName);
        } catch (error) {
            alert('❌ Giao dịch Tinh lực chưa hoàn tất. Hệ thống sẽ tự đối soát khi tải lại.');
        }
    }

    static playStellarFeedingRitual(
        symbol,
        itemName
    ) {
        const container =
            document.getElementById(
                'virtual-pet-container'
            );

        const petElement =
            document.getElementById(
                'virtual-pet-img'
            );

        if (
            !container ||
            !petElement
        ) {
            return;
        }

        document
            .querySelector(
                '.stellar-feeding-ritual'
            )
            ?.remove();

        this.isBusy = true;

        const ritual =
            document.createElement('div');

        ritual.className =
            'stellar-feeding-ritual';

        ritual.innerHTML = `
        <div class="stellar-feeding-ring ring-one"></div>
        <div class="stellar-feeding-ring ring-two"></div>
        <div class="stellar-feeding-core">
            ${symbol}
        </div>
    `;

        for (
            let index = 0;
            index < 16;
            index++
        ) {
            const mote =
                document.createElement(
                    'span'
                );

            mote.className =
                'stellar-feeding-mote';

            mote.textContent =
                index % 3 === 0
                    ? '✦'
                    : '·';

            mote.style.setProperty(
                '--mote-angle',
                `${index * 22.5}deg`
            );

            mote.style.setProperty(
                '--mote-distance',
                `${55 + Math.random() * 42}px`
            );

            mote.style.setProperty(
                '--mote-delay',
                `${index * 0.035}s`
            );

            ritual.appendChild(mote);
        }

        const dialogue =
            document.createElement('div');

        dialogue.className =
            'stellar-interaction-dialogue';

        dialogue.textContent =
            `✦ Đã hấp thụ ${itemName} ✦`;

        container.appendChild(ritual);
        container.appendChild(dialogue);

        petElement.classList.add(
            'stellar-feeding-awakened'
        );

        setTimeout(
            () => {
                ritual.remove();
                dialogue.remove();

                petElement.classList.remove(
                    'stellar-feeding-awakened'
                );

                this.isBusy = false;
            },
            2300
        );
    }

    static toggle(state) {
        this.isEnabled = state;
        localStorage.setItem('petInteractionsEnabled', state);

        const hungerBar = document.getElementById('pet-hunger-bar');

        if (!state) {
            if (this.loopInterval) {
                clearInterval(this.loopInterval);
                this.loopInterval = null;
            }

            if (hungerBar) {
                hungerBar.style.display = 'none';
            }

            document
                .getElementById(
                    'spring-dream-skill-dock'
                )
                ?.remove();

            const foodItem = document.querySelector('.pet-food-item');
            if (foodItem) foodItem.remove();

            this.setSleepState(false);

        } else {
            const activePetId = localStorage.getItem('active_pet');
            // FIX LỖI: Chặn chặt bằng isSupported để các pet khác không ăn ké tính năng
            if (
                activePetId &&
                this.canInteract(activePetId) &&
                this.usesHungerSystem(activePetId)
            ) {
                this.startPetLoop();
                if (hungerBar) {
                    hungerBar.style.display = 'flex';
                } else {
                    const user = JSON.parse(localStorage.getItem('currentUser'));
                    if (user) this.initHungerSystem(user.username);
                }

                if (
                    activePetId ===
                    'pet_premium_mua_xuan'
                ) {
                    this.mountSpringDreamSkillDock(
                        document.getElementById(
                            'virtual-pet-img'
                        ),
                        this.interactionAbortController
                            ?.signal
                    );
                }
            }
        }
    }

    static ensurePerPetToggleStyles() {
        if (
            document.getElementById(
                'petInteractionPerPetToggleStyles'
            )
        ) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'petInteractionPerPetToggleStyles';
        style.textContent = `
            .pet-interaction-card.is-interaction-disabled {
                opacity: .82;
                filter: saturate(.72);
            }

            .pet-interaction-owned-controls {
                display: flex;
                flex-direction: column;
                gap: 9px;
                min-width: 178px;
            }

            .pet-interaction-toggle-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                padding: 9px 11px;
                border: 1px solid rgba(148, 163, 184, .24);
                border-radius: 12px;
                background: rgba(255, 255, 255, .68);
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7);
            }

            .pet-interaction-toggle-copy {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .pet-interaction-toggle-copy strong {
                font-size: 12px;
                line-height: 1.2;
            }

            .pet-interaction-toggle-copy small {
                font-size: 10px;
                opacity: .72;
            }

            .pet-interaction-switch {
                position: relative;
                flex: 0 0 auto;
                width: 46px;
                height: 25px;
                border: 0;
                border-radius: 999px;
                padding: 0;
                cursor: pointer;
                background: #94a3b8;
                box-shadow: inset 0 0 0 1px rgba(15, 23, 42, .14);
                transition: background .18s ease, transform .18s ease;
            }

            .pet-interaction-switch:hover {
                transform: translateY(-1px);
            }

            .pet-interaction-switch::after {
                content: '';
                position: absolute;
                width: 19px;
                height: 19px;
                left: 3px;
                top: 3px;
                border-radius: 50%;
                background: #fff;
                box-shadow: 0 2px 6px rgba(15, 23, 42, .28);
                transition: transform .18s ease;
            }

            .pet-interaction-switch.is-on {
                background: #22c55e;
            }

            .pet-interaction-switch.is-on::after {
                transform: translateX(21px);
            }

            .pet-interaction-switch:focus-visible {
                outline: 3px solid rgba(59, 130, 246, .3);
                outline-offset: 2px;
            }

            .pet-interaction-enabled-badge {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                margin-top: 5px;
                font-size: 10px;
                font-weight: 800;
            }

            .pet-interaction-enabled-badge.is-on {
                color: #15803d;
            }

            .pet-interaction-enabled-badge.is-off {
                color: #64748b;
            }

            @media (max-width: 640px) {
                .pet-interaction-owned-controls {
                    min-width: 0;
                    width: 100%;
                }
            }
        `;

        (document.head || document.documentElement)
            .appendChild(style);
    }

    static setPetInteractionEnabled(
        petId,
        enabled
    ) {
        if (
            !this.isSupported(petId) ||
            !this.isUnlocked(petId)
        ) {
            return;
        }

        const nextState = Boolean(enabled);

        this.savePetInteractionPreference(
            petId,
            nextState
        );

        const activePetId =
            localStorage.getItem('active_pet');

        if (activePetId === petId) {
            const petElement =
                document.getElementById(
                    'virtual-pet-img'
                );

            if (!nextState) {
                /*
                 * Dọn riêng runtime tương tác. Listener/hiệu ứng click
                 * gốc của PetManager không dùng AbortController này,
                 * nên các kỹ năng riêng như Thần Yến vẫn giữ nguyên.
                 */
                this.detachEvents({
                    keepLoop: false,
                    removeHungerBar: true
                });

                document
                    .getElementById(
                        'spring-dream-skill-dock'
                    )
                    ?.remove();
            } else if (petElement) {
                /*
                 * Chỉ cần id cho PetInteractionManager. Các hiệu ứng pet
                 * gốc vẫn do PetManager quản lý độc lập.
                 */
                this.attachEvents(
                    petElement,
                    { id: petId }
                );
            }
        }

        const modal =
            document.getElementById(
                'petInteractionInfoModal'
            );

        if (modal?.classList.contains('active')) {
            this.showInfo();
        }

        if (typeof window.showToast === 'function') {
            window.showToast(
                nextState
                    ? 'Đã bật tương tác cho thú cưng này.'
                    : 'Đã tắt tương tác cho thú cưng này.',
                'success'
            );
        }
    }

    static togglePetInteractionFromStore(
        petId
    ) {
        this.setPetInteractionEnabled(
            petId,
            !this.isPetInteractionEnabled(petId)
        );
    }

    static setInteractionFilter(filter) {
        const allowedFilters = [
            'all',
            'unlocked',
            'locked',
            'active'
        ];

        this.interactionFilter =
            allowedFilters.includes(filter)
                ? filter
                : 'all';

        this.showInfo();
    }

    static showInfo() {
        const modal =
            document.getElementById(
                'petInteractionInfoModal'
            );

        const list =
            document.getElementById(
                'interactivePetList'
            );

        if (!modal || !list) return;

        this.ensurePerPetToggleStyles();

        const modalContent =
            modal.querySelector(
                '.modal-content'
            );

        modal.classList.add(
            'pet-interaction-modal-upgraded'
        );

        if (modalContent) {
            modalContent.classList.add(
                'pet-interaction-showcase'
            );

            /*
             * Ẩn tiêu đề và mô tả cũ trong HTML.
             * Nút đóng và danh sách vẫn được giữ lại.
             */
            Array.from(
                modalContent.children
            ).forEach(child => {
                if (
                    child === list ||
                    child.classList.contains(
                        'close-btn'
                    ) ||
                    child.classList.contains(
                        'pet-interaction-dashboard'
                    )
                ) {
                    return;
                }

                if (
                    child.tagName === 'H2' ||
                    child.tagName === 'H3' ||
                    child.tagName === 'P'
                ) {
                    child.classList.add(
                        'pet-interaction-legacy-hidden'
                    );
                }
            });
        }

        const activePetId =
            localStorage.getItem(
                'active_pet'
            );

        const totalPets =
            this.interactivePets.length;

        const unlockedCount =
            this.interactivePets.filter(
                pet => this.isUnlocked(pet.id)
            ).length;

        const progress =
            totalPets > 0
                ? Math.round(
                    unlockedCount /
                    totalPets *
                    100
                )
                : 0;

        const currentFilter =
            this.interactionFilter ||
            'all';

        const visualMap = {
            pet_shiba: {
                title: 'Cún Shiba',
                icon: '🐕',
                rarity: 'Thân thiện',
                className: 'theme-shiba',
                skills: [
                    'Vuốt ve',
                    'Ném xương',
                    'Dạo chơi'
                ]
            },

            pet_doisong_bandem: {
                title: 'Mèo Đêm Đầy Sao',
                icon: '🌌',
                rarity: 'Hiếm',
                className: 'theme-night',
                skills: [
                    'Vuốt ve',
                    'Cá sao',
                    'Giấc mộng đêm'
                ]
            },

            pet_doisong_banngay: {
                title: 'Cún Vui Vẻ',
                icon: '☀️',
                rarity: 'Tươi sáng',
                className: 'theme-day',
                skills: [
                    'Vuốt ve',
                    'Ném xương',
                    'Chạy nhảy'
                ]
            },

            pet_truyenthuyet_1: {
                title: 'Kỳ Lân Tinh Tú',
                icon: '🦄',
                rarity: 'Truyền thuyết',
                className: 'theme-stellar',
                skills: [
                    'Dệt Chòm Sao',
                    'Bước Nhảy Thiên Hà',
                    'Thánh Địa Tinh Vân'
                ]
            },

            pet_premium_mua_xuan: {
                title: 'Tiểu Hoa Mộng',
                icon: '🌸',
                rarity: 'Premium · Mùa xuân',
                className: 'theme-spring-dream',
                skills: [
                    'Hoa Tức Lưu Ly',
                    'Tửu Quang Hồi Vũ',
                    'Lưu Ly Hoa Viên'
                ]
            }
        };

        const filteredPets =
            this.interactivePets.filter(
                pet => {
                    const unlocked =
                        this.isUnlocked(
                            pet.id
                        );

                    const active =
                        activePetId ===
                        pet.id;

                    if (
                        currentFilter ===
                        'unlocked'
                    ) {
                        return unlocked;
                    }

                    if (
                        currentFilter ===
                        'locked'
                    ) {
                        return !unlocked;
                    }

                    if (
                        currentFilter ===
                        'active'
                    ) {
                        return active;
                    }

                    return true;
                }
            );

        let dashboard =
            modal.querySelector(
                '.pet-interaction-dashboard'
            );

        if (!dashboard) {
            dashboard =
                document.createElement(
                    'section'
                );

            dashboard.className =
                'pet-interaction-dashboard';

            list.parentElement?.insertBefore(
                dashboard,
                list
            );
        }

        dashboard.innerHTML = `
        <div class="pet-interaction-hero">
            <div class="pet-interaction-hero-orbit orbit-one"></div>
            <div class="pet-interaction-hero-orbit orbit-two"></div>

            <div class="pet-interaction-hero-icon">
                🐾
            </div>

            <div class="pet-interaction-hero-copy">
                <span class="pet-interaction-eyebrow">
                    KHU VỰC ĐỒNG HÀNH
                </span>

                <h2>Thú cưng tương tác</h2>

                <p>
                    Chăm sóc, mở khóa kỹ năng và khám phá
                    những phản ứng độc quyền của từng thú cưng.
                </p>
            </div>

            <div class="pet-interaction-hero-stars">
                <span>✦</span>
                <span>✧</span>
                <span>⋆</span>
            </div>
        </div>

        <div class="pet-interaction-overview">
            <div class="pet-overview-card">
                <span class="pet-overview-icon">🐾</span>

                <div>
                    <strong>${totalPets}</strong>
                    <small>Tổng thú cưng</small>
                </div>
            </div>

            <div class="pet-overview-card is-unlocked">
                <span class="pet-overview-icon">🔓</span>

                <div>
                    <strong>${unlockedCount}</strong>
                    <small>Đã mở khóa</small>
                </div>
            </div>

            <div class="pet-overview-card is-active">
                <span class="pet-overview-icon">✨</span>

                <div>
                    <strong>
                        ${activePetId ? '1' : '0'}
                    </strong>

                    <small>Đang đồng hành</small>
                </div>
            </div>
        </div>

        <div class="pet-collection-progress">
            <div class="pet-progress-heading">
                <span>Tiến độ sưu tập</span>
                <strong>${progress}%</strong>
            </div>

            <div class="pet-progress-track">
                <div class="pet-progress-fill"
                     style="width: ${progress}%">
                </div>
            </div>

            <small>
                Đã mở ${unlockedCount}/${totalPets}
                bộ tương tác
            </small>
        </div>

        <div class="pet-interaction-toolbar">
            <div class="pet-filter-group">
                <button type="button"
                        class="pet-filter-button ${currentFilter === 'all'
                ? 'is-active'
                : ''
            }"
                        onclick="PetInteractionManager.setInteractionFilter('all')">
                    Tất cả
                    <span>${totalPets}</span>
                </button>

                <button type="button"
                        class="pet-filter-button ${currentFilter === 'unlocked'
                ? 'is-active'
                : ''
            }"
                        onclick="PetInteractionManager.setInteractionFilter('unlocked')">
                    Đã mở
                    <span>${unlockedCount}</span>
                </button>

                <button type="button"
                        class="pet-filter-button ${currentFilter === 'locked'
                ? 'is-active'
                : ''
            }"
                        onclick="PetInteractionManager.setInteractionFilter('locked')">
                    Chưa mở
                    <span>${totalPets - unlockedCount}</span>
                </button>

                <button type="button"
                        class="pet-filter-button ${currentFilter === 'active'
                ? 'is-active'
                : ''
            }"
                        onclick="PetInteractionManager.setInteractionFilter('active')">
                    Đang dùng
                    <span>${activePetId ? 1 : 0}</span>
                </button>
            </div>
        </div>
    `;

        list.className =
            'pet-interaction-grid';

        if (filteredPets.length === 0) {
            list.innerHTML = `
            <div class="pet-interaction-empty">
                <div class="pet-empty-icon">🐾</div>

                <h3>Chưa có thú cưng phù hợp</h3>

                <p>
                    Hãy chọn bộ lọc khác hoặc trang bị
                    một thú cưng để xem tại đây.
                </p>
            </div>
        `;
        } else {
            list.innerHTML =
                filteredPets.map(
                    (pet, index) => {
                        const visual =
                            visualMap[pet.id] || {
                                title: pet.name,
                                icon: '🐾',
                                rarity: 'Đồng hành',
                                className:
                                    'theme-default',
                                skills: [
                                    'Tương tác đặc biệt'
                                ]
                            };

                        const unlocked =
                            this.isUnlocked(
                                pet.id
                            );

                        const active =
                            activePetId ===
                            pet.id;

                        const interactionEnabled =
                            unlocked &&
                            this.isPetInteractionEnabled(
                                pet.id
                            );

                        const skillHTML =
                            visual.skills.map(
                                skill => `
                                <span class="pet-skill-chip">
                                    ✦ ${skill}
                                </span>
                            `
                            ).join('');

                        const actionHTML =
                            unlocked
                                ? `
                                <div class="pet-interaction-owned-controls">
                                    <button type="button"
                                            class="pet-interaction-action is-unlocked"
                                            disabled>
                                        <span>✓</span>
                                        Đã mở khóa vĩnh viễn
                                    </button>

                                    <div class="pet-interaction-toggle-row">
                                        <div class="pet-interaction-toggle-copy">
                                            <strong>
                                                ${interactionEnabled
                                                    ? 'Tương tác đang bật'
                                                    : 'Tương tác đã tắt'}
                                            </strong>
                                            <small>
                                                ${interactionEnabled
                                                    ? 'Pet sẽ tự nhận bộ tương tác khi trang bị'
                                                    : 'Trang bị pet nhưng không tự kích hoạt tương tác'}
                                            </small>
                                        </div>

                                        <button type="button"
                                                role="switch"
                                                aria-checked="${interactionEnabled ? 'true' : 'false'}"
                                                aria-label="${interactionEnabled ? 'Tắt' : 'Bật'} tương tác ${visual.title}"
                                                title="${interactionEnabled ? 'Tắt' : 'Bật'} tương tác ${visual.title}"
                                                class="pet-interaction-switch ${interactionEnabled ? 'is-on' : 'is-off'}"
                                                onclick="PetInteractionManager.togglePetInteractionFromStore('${pet.id}')">
                                        </button>
                                    </div>
                                </div>
                            `
                                : `
                                <button type="button"
                                        class="pet-interaction-action is-purchasable"
                                        onclick="PetInteractionManager.buyInteraction('${pet.id}', ${pet.price})">
                                    <span>🪙</span>
                                    Mở khóa với ${pet.price} Coin
                                </button>
                            `;

                        return `
                        <article class="
                            pet-interaction-card
                            ${visual.className}
                            ${unlocked
                                ? 'is-unlocked'
                                : 'is-locked'}
                            ${active
                                ? 'is-active-pet'
                                : ''}
                            ${unlocked && !interactionEnabled
                                ? 'is-interaction-disabled'
                                : ''}
                        "
                        style="--pet-card-index: ${index};">

                            <div class="pet-card-background-symbol">
                                ${visual.icon}
                            </div>

                            <div class="pet-card-topline">
                                <span class="pet-rarity-badge">
                                    ${visual.rarity}
                                </span>

                                ${active
                                ? `
                                            <span class="pet-active-badge">
                                                <i></i>
                                                Đang đồng hành
                                            </span>
                                        `
                                : ''
                            }
                            </div>

                            <div class="pet-card-main">
                                <div class="pet-card-avatar">
                                    <div class="pet-avatar-orbit"></div>
                                    <div class="pet-avatar-orbit orbit-small"></div>

                                    <span>
                                        ${visual.icon}
                                    </span>
                                </div>

                                <div class="pet-card-information">
                                    <h3>${visual.title}</h3>

                                    <p>${pet.desc}</p>
                                </div>
                            </div>

                            <div class="pet-card-divider"></div>

                            <div class="pet-card-skills">
                                <span class="pet-skill-heading">
                                    Bộ kỹ năng
                                </span>

                                <div class="pet-skill-list">
                                    ${skillHTML}
                                </div>
                            </div>

                            <div class="pet-card-footer">
                                <div class="
                                    pet-lock-status
                                    ${unlocked
                                ? 'is-unlocked'
                                : 'is-locked'}
                                ">
                                    <span>
                                        ${unlocked ? '🔓' : '🔒'}
                                    </span>

                                    <div>
                                        <strong>
                                            ${unlocked
                                ? 'Đã sở hữu'
                                : 'Chưa mở khóa'
                            }
                                        </strong>

                                        <small>
                                            ${unlocked
                                ? (interactionEnabled
                                    ? 'Đang cho phép tự động kích hoạt'
                                    : 'Đã tắt tự động kích hoạt')
                                : 'Mua một lần, dùng vĩnh viễn'
                            }
                                        </small>
                                    </div>
                                </div>

                                ${actionHTML}
                            </div>
                        </article>
                    `;
                    }
                ).join('');
        }

        modal.classList.add('active');
    }

    static async buyInteraction(petId, price) {
        if (this.purchaseInProgress) return;
        const user = this.getCurrentUser();
        if (!user?.username || typeof db === 'undefined' || !this.isSupported(petId)) {
            alert('❌ Không xác định được tài khoản hoặc thú cưng.');
            return;
        }
        if (this.isUnlocked(petId)) {
            alert('✅ Tương tác này đã được mở khóa.');
            return;
        }

        const catalogPet = this.interactivePets.find(item => item.id === petId);
        const safePrice = Math.max(0, Math.round(Number(catalogPet?.price ?? price) || 0));
        if (!confirm(`Dùng ${safePrice} Coin để mở khóa vĩnh viễn tương tác?`)) return;

        this.purchaseInProgress = true;
        const opRef = db.ref(`pet_interaction_ops/${user.username}/${petId}`);
        const unlockRef = db.ref(`student_pet_interactions/${user.username}/${petId}`);
        const token = this.createPetOperationId('unlock');
        const now = this.getNow();

        try {
            const unlocked = await unlockRef.once('value');
            if (unlocked.val() === true) {
                this.unlockedInteractions = [...new Set([...this.unlockedInteractions, petId])];
                this.savePetInteractionPreference(petId, true);
                this.showInfo();
                return;
            }

            const reserve = await opRef.transaction(current => {
                if (current?.status === 'completed') return;
                if (current?.status === 'reserved') {
                    const startedAt = Number(current.startedAt) || 0;
                    if (now - startedAt < 120000) return;
                }
                return {
                    operationId: token,
                    status: 'reserved',
                    petId,
                    price: safePrice,
                    startedAt: firebase.database.ServerValue.TIMESTAMP
                };
            }, undefined, false);

            if (!reserve.committed) {
                const existing = reserve.snapshot?.val?.() || (await opRef.once('value')).val();
                if (existing?.status === 'completed') {
                    const unlockSnap = await unlockRef.once('value');
                    if (unlockSnap.val() === true) return;
                }
                alert('⏳ Giao dịch mở khóa đang được xử lý ở tab khác.');
                return;
            }

            const coinSnap = await db.ref(`student_coins/${user.username}`).once('value');
            if ((Number(coinSnap.val()) || 0) < safePrice) {
                await opRef.transaction(current =>
                    current?.operationId === token && current?.status === 'reserved' ? null : current,
                    undefined,
                    false
                );
                alert('❌ Bạn không đủ Coin.');
                return;
            }

            // Một root update: Coin + unlock + terminal op cùng commit hoặc cùng fail.
            const updates = {};
            updates[`student_coins/${user.username}`] = firebase.database.ServerValue.increment(-safePrice);
            updates[`student_pet_interactions/${user.username}/${petId}`] = true;
            updates[`pet_interaction_ops/${user.username}/${petId}/status`] = 'completed';
            updates[`pet_interaction_ops/${user.username}/${petId}/completedAt`] = firebase.database.ServerValue.TIMESTAMP;
            await db.ref().update(updates);

            this.unlockedInteractions = [...new Set([...this.unlockedInteractions, petId])];
            this.savePetInteractionPreference(petId, true);
            this.showInfo();

            if (localStorage.getItem('active_pet') === petId && this.usesHungerSystem(petId)) {
                await this.initHungerSystem(user.username);
                if (petId === 'pet_premium_mua_xuan') {
                    this.mountSpringDreamSkillDock(
                        document.getElementById('virtual-pet-img'),
                        this.interactionAbortController?.signal
                    );
                }
            }
            alert('🎉 Đã mở khóa tương tác thú cưng!');
        } catch (error) {
            console.error('Lỗi mua tương tác thú cưng:', error);
            try {
                const [opSnap, unlockSnap] = await Promise.all([
                    opRef.once('value'),
                    unlockRef.once('value')
                ]);
                if (opSnap.val()?.status === 'completed' && unlockSnap.val() === true) {
                    this.unlockedInteractions = [...new Set([...this.unlockedInteractions, petId])];
                    this.savePetInteractionPreference(petId, true);
                    this.showInfo();
                    alert('🎉 Đã mở khóa tương tác thú cưng!');
                    return;
                }
            } catch (_) {}
            alert('❌ Giao dịch chưa hoàn tất. Nếu mạng vừa gián đoạn, hãy thử lại sau; hệ thống không tự trừ Coin lần hai.');
        } finally {
            this.purchaseInProgress = false;
        }
    }

    static attachEvents(petElement, petData) {
        if (!petElement || !petData) return;

        /*
         * Dọn toàn bộ listener và hiệu ứng của pet trước.
         */
        this.detachEvents({
            keepLoop: false,
            removeHungerBar: false
        });

        this.currentPetId = petData.id;

        this.interactionAbortController =
            new AbortController();

        const { signal } =
            this.interactionAbortController;

        const container =
            document.getElementById(
                'virtual-pet-container'
            );

        if (!container) return;

        /*
         * TIỂU HOA MỘNG:
         * Không gắn pointerdown / pointerup / click vào nhân vật.
         * Click trên nhân vật được dành nguyên vẹn cho
         * "Thần Yến · Xuân Tửu Khai Hội" của PetManager.
         *
         * Ba kỹ năng tương tác được kích hoạt bằng Mộng Ấn riêng.
         */
        if (
            petData.id ===
            'pet_premium_mua_xuan'
        ) {
            const user =
                this.getCurrentUser();

            if (
                user?.username &&
                this.canInteract(
                    petData.id
                ) &&
                this.usesHungerSystem(
                    petData.id
                )
            ) {
                this.initHungerSystem(
                    user.username
                );

                this.mountSpringDreamSkillDock(
                    petElement,
                    signal
                );
            } else {
                document
                    .getElementById(
                        'pet-hunger-bar'
                    )
                    ?.remove();

                document
                    .getElementById(
                        'spring-dream-skill-dock'
                    )
                    ?.remove();
            }

            this.stopStellarAmbient();
            return;
        }

        let startX = 0;
        let startY = 0;
        let startTime = 0;
        let lastTapTime = 0;

        /*
         * Dùng để phân biệt nhấn giữ với kéo pet.
         */
        let pointerMoved = false;

        const runInteraction = type => {
            if (!this.canInteract(petData.id)) {
                return;
            }

            /*
             * Nếu người dùng vừa kéo pet thì
             * không được kích hoạt tương tác.
             */
            if (
                this.isPetDragging ||
                container.dataset.petDragged === '1'
            ) {
                return;
            }

            this.resetIdle();

            /*
             * Tương tác độc quyền Kỳ Lân Tinh Tú.
             */
            if (
                petData.id ===
                'pet_truyenthuyet_1'
            ) {
                if (type === 'double') {
                    this.performAstralLeap(
                        petElement
                    );
                } else {
                    this.startConstellationTrial(
                        petElement
                    );
                }

                return;
            }

            /*
             * Tương tác của các pet cũ.
             */
            if (type === 'double') {
                this.feedPet(
                    petElement,
                    petData
                );
            } else {
                this.petTheAnimal(
                    petElement
                );
            }
        };

        /*
         * =========================================
         * BẮT ĐẦU NHẤN
         * =========================================
         */
        petElement.addEventListener(
            'pointerdown',
            event => {
                if (
                    event.pointerType === 'mouse' &&
                    event.button !== 0
                ) {
                    return;
                }

                startX = event.clientX;
                startY = event.clientY;
                startTime = performance.now();

                pointerMoved = false;

                this.stellarLongPressTriggered =
                    false;

                if (
                    this.stellarLongPressTimer
                ) {
                    clearTimeout(
                        this.stellarLongPressTimer
                    );

                    this.stellarLongPressTimer =
                        null;
                }

                /*
                 * Nhấn giữ trên nhân vật chỉ còn dành cho
                 * Kỳ Lân Tinh Tú. Tiểu Hoa Mộng dùng Mộng Ấn riêng.
                 */
                if (
                    this.canInteract(
                        petData.id
                    ) &&
                    petData.id ===
                    'pet_truyenthuyet_1'
                ) {
                    this.stellarLongPressTimer =
                        setTimeout(
                            () => {
                                if (
                                    pointerMoved ||
                                    this.isPetDragging ||
                                    container.dataset
                                        .petDragged === '1'
                                ) {
                                    return;
                                }

                                this.stellarLongPressTriggered =
                                    true;

                                this.castStellarSanctuary(
                                    petElement
                                );
                            },
                            750
                        );
                }
            },
            { signal }
        );

        /*
         * =========================================
         * THEO DÕI DI CHUYỂN
         * =========================================
         *
         * Di chuyển quá 9px thì được xem là kéo pet,
         * hủy bộ đếm nhấn giữ.
         */
        petElement.addEventListener(
            'pointermove',
            event => {
                const distance =
                    Math.hypot(
                        event.clientX - startX,
                        event.clientY - startY
                    );

                if (distance <= 9) return;

                pointerMoved = true;

                if (
                    this.stellarLongPressTimer
                ) {
                    clearTimeout(
                        this.stellarLongPressTimer
                    );

                    this.stellarLongPressTimer =
                        null;
                }
            },
            { signal }
        );

        /*
         * =========================================
         * KẾT THÚC NHẤN
         * =========================================
         */
        petElement.addEventListener(
            'pointerup',
            event => {
                /*
                 * Dừng bộ đếm nhấn giữ.
                 */
                if (
                    this.stellarLongPressTimer
                ) {
                    clearTimeout(
                        this.stellarLongPressTimer
                    );

                    this.stellarLongPressTimer =
                        null;
                }

                /*
                 * Nếu nhấn giữ đã chạy Thánh Địa,
                 * không chạy thêm nhấn đơn.
                 */
                if (
                    this.stellarLongPressTriggered
                ) {
                    this.stellarLongPressTriggered =
                        false;

                    startTime = 0;
                    return;
                }

                const distance =
                    Math.hypot(
                        event.clientX - startX,
                        event.clientY - startY
                    );

                const duration =
                    performance.now() -
                    startTime;

                /*
                 * Không xử lý nếu:
                 * - đã di chuyển quá xa;
                 * - nhấn quá lâu nhưng không thành công;
                 * - PetManager xác định vừa kéo pet.
                 */
                if (
                    pointerMoved ||
                    distance > 9 ||
                    duration > 700 ||
                    this.isPetDragging ||
                    container.dataset.petDragged === '1'
                ) {
                    startTime = 0;
                    return;
                }

                const now =
                    performance.now();

                const isDoubleTap =
                    lastTapTime > 0 &&
                    now - lastTapTime <= 320;

                lastTapTime = now;

                if (isDoubleTap) {
                    if (this.tapTimer) {
                        clearTimeout(
                            this.tapTimer
                        );
                    }

                    this.tapTimer = null;
                    lastTapTime = 0;

                    runInteraction('double');
                    return;
                }

                /*
                 * Chờ 330ms để xác định đây có phải
                 * lần nhấn đầu của nhấn đúp hay không.
                 */
                if (this.tapTimer) {
                    clearTimeout(
                        this.tapTimer
                    );
                }

                this.tapTimer =
                    setTimeout(
                        () => {
                            this.tapTimer = null;

                            runInteraction(
                                'single'
                            );
                        },
                        330
                    );
            },
            { signal }
        );

        /*
         * =========================================
         * HỦY TƯƠNG TÁC
         * =========================================
         */
        petElement.addEventListener(
            'pointercancel',
            () => {
                startTime = 0;
                pointerMoved = false;

                if (
                    this.stellarLongPressTimer
                ) {
                    clearTimeout(
                        this.stellarLongPressTimer
                    );

                    this.stellarLongPressTimer =
                        null;
                }

                this.stellarLongPressTriggered =
                    false;
            },
            { signal }
        );

        /*
         * =========================================
         * KHỞI TẠO THANH ĐÓI / TINH LỰC
         * =========================================
         */
        const user =
            this.getCurrentUser();

        if (
            user?.username &&
            this.canInteract(petData.id) &&
            this.usesHungerSystem(petData.id)
        ) {
            this.initHungerSystem(
                user.username
            );
        } else {
            document
                .getElementById(
                    'pet-hunger-bar'
                )
                ?.remove();
        }

        /*
         * =========================================
         * HIỆU ỨNG SAO BAY THỤ ĐỘNG
         * =========================================
         */
        if (
            petData.id ===
            'pet_truyenthuyet_1'
        ) {
            this.startStellarAmbient();
        } else {
            this.stopStellarAmbient();
        }
    }

    static detachEvents({
        keepLoop = false,
        removeHungerBar = true
    } = {}) {
        /*
         * Dừng hạt sao bay liên tục.
         */
        if (
            typeof this.stopStellarAmbient ===
            'function'
        ) {
            this.stopStellarAmbient();
        }

        /*
         * Hủy bộ đếm nhấn giữ.
         */
        if (
            this.stellarLongPressTimer
        ) {
            clearTimeout(
                this.stellarLongPressTimer
            );

            this.stellarLongPressTimer =
                null;
        }

        this.stellarLongPressTriggered =
            false;

        /*
         * Hủy toàn bộ listener Pointer Events
         * của pet trước đó.
         */
        if (
            this.interactionAbortController
        ) {
            this.interactionAbortController
                .abort();

            this.interactionAbortController =
                null;
        }

        /*
         * Hủy thời gian chờ nhấn đơn.
         */
        if (this.tapTimer) {
            clearTimeout(this.tapTimer);
            this.tapTimer = null;
        }

        /*
         * Xóa thức ăn đang tồn tại.
         */
        document
            .querySelectorAll(
                '.pet-food-item'
            )
            .forEach(element => {
                element.remove();
            });

        /*
         * Xóa hạt tương tác của pet thường.
         */
        document
            .querySelectorAll(
                '.pet-interaction-particle'
            )
            .forEach(element => {
                element.remove();
            });

        /*
         * Xóa toàn bộ đồ họa riêng
         * của Kỳ Lân Tinh Tú.
         */
        document
            .querySelectorAll(
                [
                    '.stellar-interaction-layer',
                    '.stellar-interaction-gate',
                    '.stellar-interaction-leap-svg',
                    '.stellar-interaction-comet',
                    '.stellar-interaction-dialogue',
                    '.stellar-interaction-crown',
                    '.stellar-sanctuary-field',
                    '.stellar-feeding-ritual',
                    '.stellar-status-message',
                    '.stellar-pet-ambient-mote',
                    '#stellar-slumber-cocoon',
                    '.spring-dream-interaction-layer',
                    '.spring-dream-status-message',
                    '.spring-dream-feeding-ritual',
                    '#spring-dream-skill-dock'
                ].join(',')
            )
            .forEach(element => {
                element.remove();
            });

        /*
         * Đóng cửa hàng Tinh lực nếu đang mở
         * khi người dùng đổi pet.
         */
        document
            .getElementById(
                'stellarFoodShopModal'
            )
            ?.classList.remove('active');

        document
            .getElementById(
                'springDreamFoodShopModal'
            )
            ?.classList.remove('active');

        /*
         * Xóa class animation còn bám trên ảnh pet.
         */
        document
            .getElementById(
                'virtual-pet-img'
            )
            ?.classList.remove(
                'stellar-interaction-awakened',
                'stellar-interaction-phase-out',
                'stellar-interaction-phase-in',
                'stellar-feeding-awakened',
                'stellar-sanctuary-caster',
                'stellar-energy-full',
                'stellar-energy-low',
                'stellar-energy-critical',
                'spring-dream-whisper-caster',
                'spring-dream-dance-caster',
                'spring-dream-sanctuary-caster',
                'spring-dream-feeding-awakened',
                'spring-dream-energy-full',
                'spring-dream-energy-low',
                'spring-dream-energy-critical'
            );

        /*
         * Tắt trạng thái ngủ.
         */
        this.setSleepState(false);

        this.isBusy = false;
        this.isPetDragging = false;
        this.idleTime = 0;
        this.sleepTime = 0;
        this.currentPetId = null;

        /*
         * Dừng vòng lặp sinh tồn khi đổi pet.
         */
        if (
            !keepLoop &&
            this.loopInterval
        ) {
            clearInterval(
                this.loopInterval
            );

            this.loopInterval = null;
        }

        /*
         * Khi tháo pet thì xóa thanh đói.
         * Khi chỉ thay listener, có thể giữ lại.
         */
        if (removeHungerBar) {
            document
                .getElementById(
                    'pet-hunger-bar'
                )
                ?.remove();
        }
    }

    static mountSpringDreamSkillDock(
        petElement,
        signal
    ) {
        const container =
            document.getElementById(
                'virtual-pet-container'
            );

        document
            .getElementById(
                'spring-dream-skill-dock'
            )
            ?.remove();

        if (
            !container ||
            !petElement ||
            localStorage.getItem(
                'active_pet'
            ) !==
            'pet_premium_mua_xuan' ||
            !this.canInteract(
                'pet_premium_mua_xuan'
            )
        ) {
            return null;
        }

        const dock =
            document.createElement('div');

        dock.id =
            'spring-dream-skill-dock';

        dock.className =
            'spring-dream-skill-dock';

        dock.setAttribute(
            'role',
            'group'
        );

        dock.setAttribute(
            'aria-label',
            'Mộng Ấn kỹ năng của Tiểu Hoa Mộng'
        );

        dock.innerHTML = `
            <div class="spring-dream-skill-dock-head">
                <span class="spring-dream-skill-seal" aria-hidden="true">❖</span>
                <div>
                    <strong>Mộng Ấn</strong>
                    <small>Chọn kỹ năng · không cần nhấn nhân vật</small>
                </div>
            </div>

            <div class="spring-dream-skill-actions">
                <button
                    type="button"
                    class="spring-dream-skill-btn"
                    data-spring-dream-skill="whisper"
                    data-energy-cost="5"
                    aria-label="Hoa Tức Lưu Ly, tốn 5 Mộng lực"
                >
                    <span class="spring-dream-skill-icon" aria-hidden="true">✧</span>
                    <span class="spring-dream-skill-copy">
                        <b>Hoa Tức</b>
                        <small>-5 Mộng lực</small>
                    </span>
                </button>

                <button
                    type="button"
                    class="spring-dream-skill-btn"
                    data-spring-dream-skill="dance"
                    data-energy-cost="10"
                    aria-label="Tửu Quang Hồi Vũ, tốn 10 Mộng lực"
                >
                    <span class="spring-dream-skill-icon" aria-hidden="true">◇</span>
                    <span class="spring-dream-skill-copy">
                        <b>Hồi Vũ</b>
                        <small>-10 Mộng lực</small>
                    </span>
                </button>

                <button
                    type="button"
                    class="spring-dream-skill-btn is-ultimate"
                    data-spring-dream-skill="sanctuary"
                    data-energy-cost="15"
                    aria-label="Lưu Ly Hoa Viên, tốn 15 Mộng lực"
                >
                    <span class="spring-dream-skill-icon" aria-hidden="true">❈</span>
                    <span class="spring-dream-skill-copy">
                        <b>Hoa Viên</b>
                        <small>-15 Mộng lực</small>
                    </span>
                </button>
            </div>
        `;

        /*
         * Dock nằm trong container pet nhưng mọi thao tác trên dock
         * phải dừng tại đây để PetManager không hiểu là kéo pet.
         */
        dock.addEventListener(
            'pointerdown',
            event => {
                event.stopPropagation();
            },
            signal
                ? { signal }
                : undefined
        );

        dock.addEventListener(
            'click',
            event => {
                const button =
                    event.target.closest(
                        '[data-spring-dream-skill]'
                    );

                if (!button) return;

                event.preventDefault();
                event.stopPropagation();

                if (
                    button.disabled ||
                    this.isBusy ||
                    !this.canInteract(
                        'pet_premium_mua_xuan'
                    ) ||
                    localStorage.getItem(
                        'active_pet'
                    ) !==
                    'pet_premium_mua_xuan'
                ) {
                    return;
                }

                const currentPet =
                    document.getElementById(
                        'virtual-pet-img'
                    );

                if (!currentPet) return;

                this.resetIdle();

                switch (
                    button.dataset
                        .springDreamSkill
                ) {
                    case 'whisper':
                        this.performSpringDreamWhisper(
                            currentPet
                        );
                        break;

                    case 'dance':
                        this.performSpringDreamDance(
                            currentPet
                        );
                        break;

                    case 'sanctuary':
                        this.castSpringDreamSanctuary(
                            currentPet
                        );
                        break;
                }

                this.updateSpringDreamSkillDock();
            },
            signal
                ? { signal }
                : undefined
        );

        container.appendChild(
            dock
        );

        const updateDockPlacement = () => {
            const rect =
                container.getBoundingClientRect();

            dock.classList.toggle(
                'is-below',
                rect.top < 165
            );
        };

        updateDockPlacement();

        window.addEventListener(
            'resize',
            updateDockPlacement,
            signal
                ? {
                    signal,
                    passive: true
                }
                : {
                    passive: true
                }
        );

        container.addEventListener(
            'pointerup',
            () => {
                requestAnimationFrame(
                    updateDockPlacement
                );
            },
            signal
                ? {
                    signal,
                    passive: true
                }
                : {
                    passive: true
                }
        );

        this.updateSpringDreamSkillDock();

        return dock;
    }

    static updateSpringDreamSkillDock() {
        const dock =
            document.getElementById(
                'spring-dream-skill-dock'
            );

        if (!dock) return;

        if (
            localStorage.getItem(
                'active_pet'
            ) !==
            'pet_premium_mua_xuan' ||
            !this.canInteract(
                'pet_premium_mua_xuan'
            )
        ) {
            dock.remove();
            return;
        }

        const energy =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(this.hunger) || 0
                )
            );

        dock.dataset.energy =
            String(
                Math.round(energy)
            );

        dock.classList.toggle(
            'is-busy',
            this.isBusy
        );

        dock.querySelectorAll(
            '[data-energy-cost]'
        ).forEach(button => {
            const cost =
                Number(
                    button.dataset
                        .energyCost
                ) || 0;

            const unavailable =
                this.isBusy ||
                energy < cost;

            button.disabled =
                unavailable;

            button.classList.toggle(
                'is-unavailable',
                unavailable
            );
        });
    }

    static consumeSpringDreamEnergy(
        amount,
        failureMessage
    ) {
        const cost =
            Math.max(
                0,
                Number(amount) || 0
            );

        if (
            localStorage.getItem(
                'active_pet'
            ) !==
            'pet_premium_mua_xuan' ||
            !this.canInteract(
                'pet_premium_mua_xuan'
            )
        ) {
            return false;
        }

        if (this.hunger < cost) {
            this.showSpringDreamMessage(
                failureMessage ||
                `Cần ít nhất ${cost} Mộng lực.`
            );

            return false;
        }

        this.hunger =
            Math.max(
                0,
                this.hunger - cost
            );

        this.lastHungerUpdate =
            this.getNow();

        this.saveHungerToDB();
        this.updateHungerUI();

        return true;
    }

    static showSpringDreamMessage(text) {
        const container =
            document.getElementById(
                'virtual-pet-container'
            );

        if (!container) return;

        container
            .querySelector(
                '.spring-dream-status-message'
            )
            ?.remove();

        const message =
            document.createElement('div');

        message.className =
            'spring-dream-status-message';

        message.textContent = text;

        container.appendChild(message);

        setTimeout(
            () => {
                message.remove();
            },
            1700
        );
    }

    static createSpringDreamLayer(
        className,
        label
    ) {
        const container =
            document.getElementById(
                'virtual-pet-container'
            );

        if (!container) return null;

        container
            .querySelectorAll(
                '.spring-dream-interaction-layer'
            )
            .forEach(node => node.remove());

        const layer =
            document.createElement('div');

        layer.className =
            `spring-dream-interaction-layer ${className}`;

        layer.setAttribute(
            'aria-hidden',
            'true'
        );

        const glassField =
            document.createElement('div');

        glassField.className =
            'spring-dream-glass-field';

        for (
            let index = 0;
            index < 6;
            index++
        ) {
            const shard =
                document.createElement('i');

            shard.className =
                'spring-dream-glass-shard';

            shard.style.setProperty(
                '--spring-shard-index',
                index
            );

            shard.style.setProperty(
                '--spring-shard-angle',
                `${index * 60}deg`
            );

            glassField.appendChild(
                shard
            );
        }

        const vine =
            document.createElement('div');

        vine.className =
            'spring-dream-vine-lattice';

        const jewel =
            document.createElement('div');

        jewel.className =
            'spring-dream-ruby-jewel';

        const caption =
            document.createElement('div');

        caption.className =
            'spring-dream-layer-caption';

        caption.textContent = label;

        layer.append(
            glassField,
            vine,
            jewel,
            caption
        );

        container.appendChild(layer);

        return layer;
    }

    static performSpringDreamWhisper(
        petElement
    ) {
        if (
            !petElement ||
            this.isBusy ||
            this.isPetDragging ||
            localStorage.getItem(
                'active_pet'
            ) !==
            'pet_premium_mua_xuan'
        ) {
            return;
        }

        if (
            !this.consumeSpringDreamEnergy(
                5,
                '❖ Cần 5 Mộng lực để gọi Hoa Tức Lưu Ly.'
            )
        ) {
            return;
        }

        this.isBusy = true;
        this.updateSpringDreamSkillDock();

        const layer =
            this.createSpringDreamLayer(
                'is-whisper',
                'Hoa Tức Lưu Ly'
            );

        petElement.classList.add(
            'spring-dream-whisper-caster'
        );

        setTimeout(
            () => {
                layer?.remove();

                petElement.classList.remove(
                    'spring-dream-whisper-caster'
                );

                this.isBusy = false;
                this.updateSpringDreamSkillDock();
            },
            1250
        );
    }

    static performSpringDreamDance(
        petElement
    ) {
        if (
            !petElement ||
            this.isBusy ||
            this.isPetDragging ||
            localStorage.getItem(
                'active_pet'
            ) !==
            'pet_premium_mua_xuan'
        ) {
            return;
        }

        if (
            !this.consumeSpringDreamEnergy(
                10,
                '❖ Cần 10 Mộng lực để gọi Tửu Quang Hồi Vũ.'
            )
        ) {
            return;
        }

        this.isBusy = true;
        this.updateSpringDreamSkillDock();

        const layer =
            this.createSpringDreamLayer(
                'is-dance',
                'Tửu Quang Hồi Vũ'
            );

        petElement.classList.add(
            'spring-dream-dance-caster'
        );

        setTimeout(
            () => {
                layer?.remove();

                petElement.classList.remove(
                    'spring-dream-dance-caster'
                );

                this.isBusy = false;
                this.updateSpringDreamSkillDock();
            },
            1750
        );
    }

    static castSpringDreamSanctuary(
        petElement
    ) {
        if (
            !petElement ||
            this.isBusy ||
            this.isPetDragging ||
            localStorage.getItem(
                'active_pet'
            ) !==
            'pet_premium_mua_xuan'
        ) {
            return;
        }

        if (
            !this.consumeSpringDreamEnergy(
                15,
                '❖ Cần 15 Mộng lực để mở Lưu Ly Hoa Viên.'
            )
        ) {
            return;
        }

        this.isBusy = true;
        this.updateSpringDreamSkillDock();

        const layer =
            this.createSpringDreamLayer(
                'is-sanctuary',
                'Lưu Ly Hoa Viên'
            );

        petElement.classList.add(
            'spring-dream-sanctuary-caster'
        );

        setTimeout(
            () => {
                layer?.remove();

                petElement.classList.remove(
                    'spring-dream-sanctuary-caster'
                );

                this.isBusy = false;
                this.updateSpringDreamSkillDock();
            },
            2350
        );
    }

    static openSpringDreamFoodShop() {
        if (
            localStorage.getItem(
                'active_pet'
            ) !==
            'pet_premium_mua_xuan' ||
            !this.canInteract(
                'pet_premium_mua_xuan'
            )
        ) {
            return;
        }

        let modal =
            document.getElementById(
                'springDreamFoodShopModal'
            );

        if (!modal) {
            modal =
                document.createElement('div');

            modal.id =
                'springDreamFoodShopModal';

            modal.className =
                'modal-overlay spring-dream-food-modal';

            /*
             * Dùng tầng modal chuẩn thay vì z-index cực cao
             * để cảnh báo thi / thông báo giáo viên vẫn ưu tiên.
             */
            modal.style.zIndex =
                'var(--z-modal-normal, 9990)';

            modal.innerHTML = `
            <div class="modal-content spring-dream-food-content">
                <button class="close-btn"
                        onclick="document.getElementById('springDreamFoodShopModal').classList.remove('active')">
                    ✖
                </button>

                <div class="spring-dream-food-emblem">
                    ❖
                </div>

                <h3>Vườn Dưỡng Mộng</h3>

                <p class="spring-dream-energy-status">
                    Mộng lực hiện tại:
                    <strong id="springDreamEnergyText">
                        0
                    </strong>
                    / 100
                </p>

                <div class="spring-dream-food-list">
                    <button class="spring-dream-food-btn"
                            onclick="PetInteractionManager.buySpringDreamFood(15, 12, 'Sương Nho', '◈')">
                        <span>◈</span>
                        <strong>Sương Nho</strong>
                        <small>15 Coin · +12 Mộng lực</small>
                    </button>

                    <button class="spring-dream-food-btn"
                            onclick="PetInteractionManager.buySpringDreamFood(30, 28, 'Tinh Lộ Hồng Ngọc', '◆')">
                        <span>◆</span>
                        <strong>Tinh Lộ Hồng Ngọc</strong>
                        <small>30 Coin · +28 Mộng lực</small>
                    </button>

                    <button class="spring-dream-food-btn premium"
                            onclick="PetInteractionManager.buySpringDreamFood(60, 65, 'Tửu Quang Kết Tinh', '❖')">
                        <span>❖</span>
                        <strong>Tửu Quang Kết Tinh</strong>
                        <small>60 Coin · +65 Mộng lực</small>
                    </button>

                    <button class="spring-dream-food-btn legendary"
                            onclick="PetInteractionManager.buySpringDreamFood(100, 100, 'Lõi Hoa Mộng', '✦')">
                        <span>✦</span>
                        <strong>Lõi Hoa Mộng</strong>
                        <small>100 Coin · hồi đầy Mộng lực</small>
                    </button>
                </div>
            </div>
        `;

            document.body.appendChild(
                modal
            );
        }

        this.updateHungerUI();
        modal.classList.add('active');
    }

    static async buySpringDreamFood(price, energyGain, itemName, symbol) {
        const user = this.getCurrentUser();
        if (!user?.username || typeof db === 'undefined' ||
            localStorage.getItem('active_pet') !== 'pet_premium_mua_xuan') {
            alert('❌ Tiểu Hoa Mộng hiện không hoạt động.');
            return;
        }
        if (this.hunger >= 100) {
            alert('Tiểu Hoa Mộng đang tràn đầy Mộng lực.');
            return;
        }
        const safePrice = Math.max(0, Math.round(Number(price) || 0));
        if (!confirm(`Dùng ${safePrice} Coin để mua ${itemName}?`)) return;

        try {
            const ok = await this.purchasePetFood({
                price: safePrice,
                gain: energyGain,
                petId: 'pet_premium_mua_xuan',
                energyField: 'springDreamEnergy',
                itemName
            });
            if (!ok) return;
            document.getElementById('springDreamFoodShopModal')?.classList.remove('active');
            this.playSpringDreamFeedingRitual(symbol, itemName);
        } catch (error) {
            alert('❌ Giao dịch Mộng lực chưa hoàn tất. Hệ thống sẽ tự đối soát khi tải lại.');
        }
    }

    static playSpringDreamFeedingRitual(
        symbol,
        itemName
    ) {
        const container =
            document.getElementById(
                'virtual-pet-container'
            );

        const petElement =
            document.getElementById(
                'virtual-pet-img'
            );

        if (
            !container ||
            !petElement ||
            localStorage.getItem(
                'active_pet'
            ) !==
            'pet_premium_mua_xuan'
        ) {
            return;
        }

        container
            .querySelector(
                '.spring-dream-feeding-ritual'
            )
            ?.remove();

        this.isBusy = true;

        const ritual =
            document.createElement('div');

        ritual.className =
            'spring-dream-feeding-ritual';

        ritual.innerHTML = `
        <div class="spring-dream-feeding-glass"></div>
        <div class="spring-dream-feeding-core">
            ${symbol}
        </div>
        <div class="spring-dream-feeding-vine"></div>
    `;

        const dialogue =
            document.createElement('div');

        dialogue.className =
            'spring-dream-status-message is-feeding';

        dialogue.textContent =
            `❖ Đã hấp thụ ${itemName} ❖`;

        container.appendChild(ritual);
        container.appendChild(dialogue);

        petElement.classList.add(
            'spring-dream-feeding-awakened'
        );

        setTimeout(
            () => {
                ritual.remove();
                dialogue.remove();

                petElement.classList.remove(
                    'spring-dream-feeding-awakened'
                );

                this.isBusy = false;
            },
            2100
        );
    }

    static consumeStellarEnergy(
        amount,
        failureMessage
    ) {
        const cost =
            Math.max(
                0,
                Number(amount) || 0
            );

        if (this.hunger < cost) {
            this.showStellarMessage(
                failureMessage ||
                `Cần ít nhất ${cost} Tinh lực.`
            );

            return false;
        }

        this.hunger =
            Math.max(
                0,
                this.hunger - cost
            );

        this.lastHungerUpdate =
            this.getNow();

        this.saveHungerToDB();
        this.updateHungerUI();

        return true;
    }

    static showStellarMessage(text) {
        const container =
            document.getElementById(
                'virtual-pet-container'
            );

        if (!container) return;

        container
            .querySelector(
                '.stellar-status-message'
            )
            ?.remove();

        const message =
            document.createElement('div');

        message.className =
            'stellar-status-message';

        message.textContent = text;

        container.appendChild(message);

        setTimeout(
            () => {
                message.remove();
            },
            1800
        );
    }

    static startStellarAmbient() {
        this.stopStellarAmbient();

        const spawnMote = () => {
            if (
                document.hidden ||
                !this.isEnabled ||
                localStorage.getItem(
                    'active_pet'
                ) !==
                'pet_truyenthuyet_1'
            ) {
                return;
            }

            const container =
                document.getElementById(
                    'virtual-pet-container'
                );

            if (
                !container ||
                container.style.display ===
                'none'
            ) {
                return;
            }

            const count =
                this.hunger > 70
                    ? 2
                    : 1;

            for (
                let index = 0;
                index < count;
                index++
            ) {
                const mote =
                    document.createElement(
                        'span'
                    );

                mote.className =
                    'stellar-pet-ambient-mote';

                mote.textContent =
                    Math.random() > 0.45
                        ? '✦'
                        : '·';

                mote.style.left =
                    `${15 + Math.random() * 70}%`;

                mote.style.top =
                    `${20 + Math.random() * 65}%`;

                mote.style.setProperty(
                    '--ambient-drift',
                    `${Math.random() * 60 - 30}px`
                );

                mote.style.setProperty(
                    '--ambient-duration',
                    `${1.7 + Math.random() * 1.5}s`
                );

                container.appendChild(
                    mote
                );

                setTimeout(
                    () => {
                        mote.remove();
                    },
                    3400
                );
            }
        };

        spawnMote();

        const isMobile =
            window.matchMedia?.(
                '(pointer: coarse)'
            ).matches;

        this.stellarAmbientInterval =
            setInterval(
                spawnMote,
                isMobile ? 1250 : 760
            );
    }

    static stopStellarAmbient() {
        if (
            this.stellarAmbientInterval
        ) {
            clearInterval(
                this.stellarAmbientInterval
            );

            this.stellarAmbientInterval =
                null;
        }

        document
            .querySelectorAll(
                '.stellar-pet-ambient-mote'
            )
            .forEach(element => {
                element.remove();
            });
    }

    static castStellarSanctuary(
        petElement
    ) {
        if (
            !petElement ||
            this.isBusy ||
            document.querySelector(
                '.stellar-sanctuary-field'
            )
        ) {
            return;
        }

        if (
            !this.consumeStellarEnergy(
                15,
                'Cần 15 Tinh lực để mở Thánh Địa Tinh Vân.'
            )
        ) {
            return;
        }

        const container =
            petElement.parentElement;

        if (!container) return;

        this.isBusy = true;

        const rect =
            petElement.getBoundingClientRect();

        const field =
            document.createElement('div');

        field.className =
            'stellar-sanctuary-field';

        field.style.left =
            `${rect.left + rect.width / 2}px`;

        field.style.top =
            `${rect.top + rect.height / 2}px`;

        field.innerHTML = `
        <div class="stellar-sanctuary-ring ring-outer"></div>
        <div class="stellar-sanctuary-ring ring-middle"></div>
        <div class="stellar-sanctuary-ring ring-inner"></div>
        <div class="stellar-sanctuary-core">✦</div>
    `;

        for (
            let index = 0;
            index < 18;
            index++
        ) {
            const rune =
                document.createElement(
                    'span'
                );

            rune.className =
                'stellar-sanctuary-rune';

            rune.textContent =
                ['✦', '✧', '⋆', '·'][
                index % 4
                ];

            rune.style.setProperty(
                '--rune-angle',
                `${index * 20}deg`
            );

            rune.style.setProperty(
                '--rune-delay',
                `${index * 0.045}s`
            );

            field.appendChild(rune);
        }

        document.body.appendChild(field);

        petElement.classList.add(
            'stellar-sanctuary-caster'
        );

        this.showStellarMessage(
            '✦ Thánh Địa Tinh Vân đã khai mở ✦'
        );

        setTimeout(
            () => {
                field.remove();

                petElement.classList.remove(
                    'stellar-sanctuary-caster'
                );

                this.isBusy = false;
            },
            3600
        );
    }

    static startConstellationTrial(
        petElement
    ) {
        if (
            !petElement ||
            this.isBusy ||
            document.querySelector(
                '.stellar-interaction-layer'
            )
        ) {
            return;
        }

        const container =
            petElement.parentElement;

        if (!container) return;

        if (
            !this.consumeStellarEnergy(
                5,
                'Không đủ Tinh lực để dệt chòm sao.'
            )
        ) {
            return;
        }

        this.isBusy = true;

        const viewportWidth =
            window.visualViewport?.width ||
            window.innerWidth;

        const viewportHeight =
            window.visualViewport?.height ||
            window.innerHeight;

        const petRect =
            petElement.getBoundingClientRect();

        const center = {
            x: petRect.left +
                petRect.width / 2,

            y: petRect.top +
                petRect.height / 2
        };

        const layer =
            document.createElement('div');

        layer.className =
            'stellar-interaction-layer';

        const svg =
            document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );

        svg.classList.add(
            'stellar-interaction-trace-svg'
        );

        svg.setAttribute(
            'viewBox',
            `0 0 ${viewportWidth} ${viewportHeight}`
        );

        layer.appendChild(svg);

        const hint =
            document.createElement('div');

        hint.className =
            'stellar-interaction-hint';

        hint.textContent =
            'Chạm các tinh điểm theo thứ tự 1 → 5';

        layer.appendChild(hint);

        /*
         * Năm vị trí tạo thành một chòm sao
         * bất đối xứng bao quanh Kỳ Lân.
         */
        const offsets = [
            { x: -118, y: -74 },
            { x: -38, y: -142 },
            { x: 86, y: -112 },
            { x: 126, y: -12 },
            { x: 34, y: 82 }
        ];

        const points = offsets.map(
            offset => ({
                x: Math.max(
                    30,
                    Math.min(
                        viewportWidth - 30,
                        center.x + offset.x
                    )
                ),

                y: Math.max(
                    65,
                    Math.min(
                        viewportHeight - 36,
                        center.y + offset.y
                    )
                )
            })
        );

        let expectedIndex = 0;
        let previousPoint = center;
        let finished = false;
        let failureTimer = null;

        const drawLine = (
            from,
            to
        ) => {
            const line =
                document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'line'
                );

            line.classList.add(
                'stellar-interaction-trace-line'
            );

            line.setAttribute(
                'x1',
                from.x
            );

            line.setAttribute(
                'y1',
                from.y
            );

            line.setAttribute(
                'x2',
                to.x
            );

            line.setAttribute(
                'y2',
                to.y
            );

            line.setAttribute(
                'pathLength',
                '1'
            );

            svg.appendChild(line);
        };

        const cleanup = () => {
            finished = true;

            petElement.classList.remove(
                'stellar-interaction-awakened'
            );

            layer.remove();

            document
                .querySelector(
                    '.stellar-interaction-crown'
                )
                ?.remove();

            this.isBusy = false;
        };

        points.forEach(
            (point, index) => {
                const node =
                    document.createElement(
                        'button'
                    );

                node.type = 'button';

                node.className =
                    'stellar-interaction-node';

                node.textContent =
                    String(index + 1);

                node.style.left =
                    `${point.x}px`;

                node.style.top =
                    `${point.y}px`;

                node.style.setProperty(
                    '--stellar-node-delay',
                    `${index * 0.1}s`
                );

                node.addEventListener(
                    'pointerdown',
                    event => {
                        event.stopPropagation();
                    }
                );

                node.addEventListener(
                    'click',
                    event => {
                        event.preventDefault();
                        event.stopPropagation();

                        if (finished) return;

                        /*
                         * Nhấn sai thứ tự:
                         * rung tinh điểm và nhắc số đúng.
                         */
                        if (
                            index !==
                            expectedIndex
                        ) {
                            node.classList.remove(
                                'is-wrong'
                            );

                            void node.offsetWidth;

                            node.classList.add(
                                'is-wrong'
                            );

                            hint.textContent =
                                `Tinh điểm tiếp theo là số ${expectedIndex + 1}`;

                            return;
                        }

                        node.disabled = true;

                        node.classList.add(
                            'is-activated'
                        );

                        drawLine(
                            previousPoint,
                            point
                        );

                        previousPoint = point;
                        expectedIndex++;

                        if (
                            expectedIndex ===
                            points.length
                        ) {
                            finished = true;

                            if (failureTimer) {
                                clearTimeout(
                                    failureTimer
                                );
                            }

                            /*
                             * Khép đường sao trở lại
                             * vị trí của Kỳ Lân.
                             */
                            drawLine(
                                previousPoint,
                                center
                            );

                            layer.classList.add(
                                'is-complete'
                            );

                            hint.textContent =
                                '✦ Chòm sao Khải Hoàn đã được ghi nhận ✦';

                            petElement.classList.add(
                                'stellar-interaction-awakened'
                            );

                            const crown =
                                document.createElement(
                                    'div'
                                );

                            crown.className =
                                'stellar-interaction-crown';

                            crown.innerHTML =
                                '<span>✦</span><span>✧</span><span>✦</span>';

                            container.appendChild(
                                crown
                            );

                            setTimeout(
                                cleanup,
                                2200
                            );
                        }
                    }
                );

                layer.appendChild(node);
            }
        );

        document.body.appendChild(layer);

        /*
         * Người chơi có 10 giây
         * để hoàn tất chòm sao.
         */
        failureTimer = setTimeout(
            () => {
                if (finished) return;

                finished = true;

                hint.textContent =
                    'Chòm sao đã tan trước khi hoàn tất';

                layer.classList.add(
                    'is-failed'
                );

                setTimeout(
                    cleanup,
                    900
                );
            },
            10000
        );
    }

    static performAstralLeap(
        petElement
    ) {
        if (
            !petElement ||
            this.isBusy ||
            document.querySelector(
                '.stellar-interaction-gate'
            )
        ) {
            return;
        }

        const container =
            petElement.parentElement;

        if (!container) return;

        if (
            !this.consumeStellarEnergy(
                10,
                'Không đủ Tinh lực để mở cổng thiên hà.'
            )
        ) {
            return;
        }

        this.isBusy = true;

        const viewportWidth =
            window.visualViewport?.width ||
            window.innerWidth;

        const viewportHeight =
            window.visualViewport?.height ||
            window.innerHeight;

        const startRect =
            container.getBoundingClientRect();

        const maxLeft = Math.max(
            16,
            viewportWidth -
            container.offsetWidth -
            16
        );

        const maxTop = Math.max(
            72,
            viewportHeight -
            container.offsetHeight -
            20
        );

        let targetLeft = startRect.left;
        let targetTop = startRect.top;

        /*
         * Tìm vị trí mới cách vị trí cũ
         * ít nhất khoảng 180px.
         */
        for (
            let attempt = 0;
            attempt < 10;
            attempt++
        ) {
            const candidateLeft =
                16 +
                Math.random() *
                Math.max(
                    1,
                    maxLeft - 16
                );

            const candidateTop =
                72 +
                Math.random() *
                Math.max(
                    1,
                    maxTop - 72
                );

            const distance = Math.hypot(
                candidateLeft -
                startRect.left,

                candidateTop -
                startRect.top
            );

            targetLeft =
                candidateLeft;

            targetTop =
                candidateTop;

            if (distance >= 180) {
                break;
            }
        }

        const startCenter = {
            x:
                startRect.left +
                startRect.width / 2,

            y:
                startRect.top +
                startRect.height / 2
        };

        const endCenter = {
            x:
                targetLeft +
                startRect.width / 2,

            y:
                targetTop +
                startRect.height / 2
        };

        const createGate = (
            point,
            modifier
        ) => {
            const gate =
                document.createElement(
                    'div'
                );

            gate.className =
                `stellar-interaction-gate ${modifier}`;

            gate.style.left =
                `${point.x}px`;

            gate.style.top =
                `${point.y}px`;

            gate.innerHTML = `
            <span class="stellar-gate-ring ring-a"></span>
            <span class="stellar-gate-ring ring-b"></span>
            <span class="stellar-gate-core"></span>
        `;

            document.body.appendChild(
                gate
            );

            return gate;
        };

        const sourceGate =
            createGate(
                startCenter,
                'is-source'
            );

        const destinationGate =
            createGate(
                endCenter,
                'is-destination'
            );

        /*
         * Vẽ quỹ đạo cong giữa hai cổng.
         */
        const svg =
            document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );

        svg.classList.add(
            'stellar-interaction-leap-svg'
        );

        svg.setAttribute(
            'viewBox',
            `0 0 ${viewportWidth} ${viewportHeight}`
        );

        const path =
            document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );

        const controlX =
            (
                startCenter.x +
                endCenter.x
            ) / 2;

        const controlY =
            Math.min(
                startCenter.y,
                endCenter.y
            ) - 120;

        path.setAttribute(
            'd',
            `
            M ${startCenter.x} ${startCenter.y}
            Q ${controlX} ${controlY}
            ${endCenter.x} ${endCenter.y}
        `
        );

        path.setAttribute(
            'pathLength',
            '1'
        );

        path.classList.add(
            'stellar-interaction-leap-path'
        );

        svg.appendChild(path);
        document.body.appendChild(svg);

        /*
         * Sao chổi bay theo quỹ đạo Bezier.
         */
        const comet =
            document.createElement('div');

        comet.className =
            'stellar-interaction-comet';

        comet.style.left =
            `${startCenter.x}px`;

        comet.style.top =
            `${startCenter.y}px`;

        document.body.appendChild(comet);

        const samples = [];

        for (
            let index = 0;
            index <= 24;
            index++
        ) {
            const t = index / 24;
            const inverse = 1 - t;

            const x =
                inverse *
                inverse *
                startCenter.x +
                2 *
                inverse *
                t *
                controlX +
                t *
                t *
                endCenter.x;

            const y =
                inverse *
                inverse *
                startCenter.y +
                2 *
                inverse *
                t *
                controlY +
                t *
                t *
                endCenter.y;

            samples.push({
                transform:
                    `translate(
                    ${(x - startCenter.x).toFixed(2)}px,
                    ${(y - startCenter.y).toFixed(2)}px
                )
                scale(${0.65 + t * 0.55})`,

                opacity:
                    t < 0.12 ||
                        t > 0.9
                        ? 0
                        : 1
            });
        }

        comet.animate(
            samples,
            {
                duration: 1050,
                easing:
                    'cubic-bezier(.22,.7,.2,1)',
                fill: 'forwards'
            }
        );

        petElement.classList.add(
            'stellar-interaction-phase-out'
        );

        /*
         * Khi Kỳ Lân biến mất tại cổng đầu,
         * chuyển container sang cổng đích.
         */
        setTimeout(
            () => {
                container.style.transition =
                    'none';

                container.style.left =
                    `${targetLeft}px`;

                container.style.top =
                    `${targetTop}px`;

                container.style.right =
                    'auto';

                container.style.bottom =
                    'auto';

                petElement.classList.remove(
                    'stellar-interaction-phase-out'
                );

                petElement.classList.add(
                    'stellar-interaction-phase-in'
                );

                const dialogue =
                    document.createElement(
                        'div'
                    );

                dialogue.className =
                    'stellar-interaction-dialogue';

                dialogue.textContent =
                    '✦ Quỹ đạo mới đã được chọn ✦';

                container.appendChild(
                    dialogue
                );

                setTimeout(
                    () => {
                        dialogue.remove();
                    },
                    1500
                );
            },
            650
        );

        setTimeout(
            () => {
                sourceGate.remove();
                destinationGate.remove();
                svg.remove();
                comet.remove();

                petElement.classList.remove(
                    'stellar-interaction-phase-out',
                    'stellar-interaction-phase-in'
                );

                this.isBusy = false;
            },
            1900
        );
    }

    static petTheAnimal(petElement) {
        if (!petElement || this.isBusy) {
            return;
        }

        this.isBusy = true;

        petElement.classList.remove(
            'pet-interaction-patted'
        );

        /*
         * Buộc trình duyệt chạy lại animation
         * dù người dùng nhấn liên tiếp.
         */
        void petElement.offsetWidth;

        petElement.classList.add(
            'pet-interaction-patted'
        );

        this.spawnParticles(
            petElement.parentElement,
            '❤️'
        );

        setTimeout(() => {
            petElement.classList.remove(
                'pet-interaction-patted'
            );

            this.isBusy = false;
        }, 440);
    }

    static feedPet(petElement, petData) {
        if (document.querySelector('.pet-food-item')) return;
        this.isBusy = true;

        const container = petElement.parentNode;
        const containerRect = container.getBoundingClientRect();

        const food = document.createElement('div');
        const isCat = petData.id === 'pet_doisong_bandem';
        food.innerText = isCat ? '🐟' : '🦴';
        food.className = 'pet-food-item';
        food.style.left = `${containerRect.left + (containerRect.width / 2) - 15}px`;
        food.style.top = `${containerRect.top - 60}px`;
        document.body.appendChild(food);

        let isDragging = false;
        let offsetX = 0; let offsetY = 0;

        const startDrag = (e) => {
            e.preventDefault(); isDragging = true;
            this.resetIdle();
            food.style.cursor = 'grabbing'; food.style.animation = 'none'; food.style.filter = 'drop-shadow(0 0 12px #ffd700)';
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const rect = food.getBoundingClientRect();
            offsetX = clientX - rect.left; offsetY = clientY - rect.top;
        };

        const onDrag = (e) => {
            if (!isDragging) return; e.preventDefault();
            this.resetIdle();
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            food.style.left = `${clientX - offsetX}px`; food.style.top = `${clientY - offsetY}px`;
        };

        const endDrag = (e) => {
            if (!isDragging) return; isDragging = false;
            food.style.cursor = 'grab'; food.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))';
            document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', onDrag); document.removeEventListener('touchend', endDrag);
            runToBoneAndEat();
        };

        food.addEventListener('mousedown', (e) => { startDrag(e); document.addEventListener('mousemove', onDrag); document.addEventListener('mouseup', endDrag); });
        food.addEventListener('touchstart', (e) => { startDrag(e); document.addEventListener('touchmove', onDrag, { passive: false }); document.addEventListener('touchend', endDrag); }, { passive: false });

        const runToBoneAndEat = () => {
            const foodRect = food.getBoundingClientRect();
            const startRect = container.getBoundingClientRect();
            const targetLeft = foodRect.left - (startRect.width / 2) + 15;
            const targetTop = foodRect.top - startRect.height + 40;
            const flipStyle = (targetLeft < startRect.left) ? 'scaleX(-1)' : 'scaleX(1)';
            petElement.style.transform = flipStyle;

            container.style.transition = 'left 0.5s ease-out, top 0.5s ease-out';
            container.style.bottom = 'auto'; container.style.right = 'auto';
            container.style.left = `${targetLeft}px`; container.style.top = `${targetTop}px`;

            setTimeout(() => {
                petElement.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                petElement.style.transform = `${flipStyle} translateY(-30px) scale(1.15)`;
                this.spawnParticles(container, '✨');

                setTimeout(() => {
                    if (food.parentNode) food.remove();
                    petElement.style.transform = `${flipStyle} translateY(0) scale(1)`;

                    // KIỂM TRA NẾU LÀ CÚN VUI VẺ -> KÍCH HOẠT CHUỖI SỰ KIỆN ĐẶC BIỆT
                    if (petData.id === 'pet_doisong_banngay') {
                        this.playHappyDogSequence(petElement, container);
                    } else {
                        // Pet bình thường kết thúc ăn
                        setTimeout(() => {
                            container.style.transition = 'none';
                            this.isBusy = false;
                        }, 200);
                    }
                }, 250);
            }, 500);
        };

        setTimeout(() => { if (document.body.contains(food) && !isDragging) runToBoneAndEat(); }, 1500);
    }

    // HÀM XỬ LÝ SỰ KIỆN: CÚN VUI VẺ CHƠI BÓNG
    static playHappyDogSequence(petElement, container) {
        // 1. Tỏa hào quang rực rỡ
        petElement.classList.add('happy-dog-aura');
        this.spawnParticles(container, '🌟');

        // 2. Đợi 2 giây sau khi ăn xong
        setTimeout(() => {
            // 3. Quả bóng bay đến
            const ball = document.createElement('div');
            ball.innerText = '🎾';
            ball.className = 'happy-dog-ball';
            container.appendChild(ball);

            // 4. Pet nhảy nhót mừng rỡ
            petElement.classList.add('happy-dog-playing');
            this.spawnParticles(container, '🎵');

            // 5. Kết thúc chơi đùa sau 5 giây
            setTimeout(() => {
                if (ball.parentNode) ball.remove(); // Xóa bóng
                petElement.classList.remove('happy-dog-aura'); // Tắt hào quang
                petElement.classList.remove('happy-dog-playing'); // Ngừng nhảy
                container.style.transition = 'none';
                this.isBusy = false; // Giải phóng trạng thái bận để tương tác tiếp
            }, 5000);

        }, 2000);
    }

    static spawnParticles(container, emoji) {
        const particle = document.createElement('div');
        particle.innerText = emoji;
        particle.className = 'pet-particle';
        particle.style.setProperty('--move-x', `${(Math.random() * 40) - 20}px`);
        container.appendChild(particle);
        setTimeout(() => { if (particle.parentNode) particle.remove(); }, 1000);
    }
}

window.PetInteractionManager =
    PetInteractionManager;

const startPetInteractions = () => {
    PetInteractionManager.init();
};

if (
    document.readyState === 'loading'
) {
    document.addEventListener(
        'DOMContentLoaded',
        startPetInteractions,
        { once: true }
    );
} else {
    startPetInteractions();
}

// TỐI ƯU HIỆU SUẤT: Tạm dừng vòng lặp thú cưng khi người dùng chuyển sang Tab khác hoặc thu nhỏ web
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (PetInteractionManager.loopInterval) {
            clearInterval(PetInteractionManager.loopInterval);
        }
    } else {
        if (PetInteractionManager.isEnabled) {
            const activePetId = localStorage.getItem('active_pet');
            // FIX LỖI: Khi người dùng mở lại Tab, hệ thống phải kiểm tra xem pet này có được hỗ trợ vòng lặp không
            if (
                activePetId &&
                PetInteractionManager.canInteract(
                    activePetId
                ) &&
                PetInteractionManager
                    .usesHungerSystem(
                        activePetId
                    )
            ) {
                PetInteractionManager.startPetLoop();
            }
        }
    }
});