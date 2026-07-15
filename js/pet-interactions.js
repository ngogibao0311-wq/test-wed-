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

    static canInteract(petId) {
        return (
            this.isEnabled &&
            this.isSupported(petId) &&
            this.isUnlocked(petId)
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
                ${isStellar ? '✦' : '🍖'}
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
            isStellar
                ? 'pet-hunger-bar stellar-hunger-bar'
                : 'pet-hunger-bar';

        const icon =
            document.getElementById(
                'pet-hunger-icon'
            );

        if (icon) {
            icon.textContent =
                isStellar ? '✦' : '🍖';
        }

        barContainer.title =
            isStellar
                ? 'Tinh lực của Kỳ Lân — nhấn để mở Đài Tiếp Năng'
                : 'Độ đói của thú cưng — nhấn để mua đồ ăn';

        barContainer.onclick = event => {
            event.preventDefault();
            event.stopPropagation();

            if (isStellar) {
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
                    this.hunger =
                        data.hunger !== undefined
                            ? Number(data.hunger)
                            : 100;

                    this.lastHungerUpdate =
                        Number(data.lastUpdate) ||
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
                         * Kỳ Lân mất 8 Tinh lực/giờ.
                         * Pet thường mất 10/giờ.
                         */
                        const decay =
                            isStellar ? 8 : 10;

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
        const user = JSON.parse(
            localStorage.getItem('currentUser')
        );

        if (
            !user?.username ||
            typeof db === 'undefined'
        ) {
            return;
        }

        try {
            await db.ref(
                `student_pet_status/${user.username}`
            ).set({
                hunger: Math.max(
                    0,
                    Math.min(100, Number(this.hunger) || 0)
                ),

                lastUpdate:
                    Number(this.lastHungerUpdate) ||
                    this.getNow()
            });
        } catch (error) {
            console.error(
                'Không thể lưu trạng thái thú cưng:',
                error
            );
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

            if (isStellar) {
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
            if (now - this.lastHungerUpdate >= 3600000) {
                this.hunger = Math.max(0, this.hunger - 10);
                this.lastHungerUpdate = now;
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

    static async buyFood(price, hungerGain) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) return;

        if (this.hunger >= 100) return alert("Thú cưng đang no căng bụng rồi! Không ăn thêm được đâu.");

        const coinRef = db.ref(`student_coins/${user.username}`);
        const snap = await coinRef.once('value');
        let currentCoins = snap.val() || 0;

        if (currentCoins < price) return alert(`❌ Không đủ Coin! Bạn còn thiếu ${price - currentCoins} 🪙.`);

        if (confirm(`Thanh toán ${price} Coin để mua món này?`)) {
            await coinRef.set(currentCoins - price);
            this.hunger = Math.min(100, this.hunger + hungerGain);
            this.saveHungerToDB();
            this.updateHungerUI();
            this.resetIdle();
            alert(`Ăn ngon quá! Đã hồi phục năng lượng.`);

            if (this.hunger > 50) {
                const container = document.getElementById('virtual-pet-container');
                if (container) this.spawnParticles(container, '💖');
            }
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

    static async buyStellarFood(
        price,
        energyGain,
        itemName,
        symbol
    ) {
        const user =
            this.getCurrentUser();

        if (
            !user?.username ||
            typeof db === 'undefined'
        ) {
            alert(
                '❌ Không tìm thấy tài khoản.'
            );

            return;
        }

        if (this.hunger >= 100) {
            alert(
                'Kỳ Lân đang tràn đầy Tinh lực.'
            );

            return;
        }

        const accepted =
            confirm(
                `Dùng ${price} Coin để mua ${itemName}?`
            );

        if (!accepted) return;

        const coinRef =
            db.ref(
                `student_coins/${user.username}`
            );

        try {
            const result =
                await coinRef.transaction(
                    currentValue => {
                        const balance =
                            Number(
                                currentValue
                            ) || 0;

                        if (
                            balance <
                            Number(price)
                        ) {
                            return;
                        }

                        return (
                            balance -
                            Number(price)
                        );
                    }
                );

            if (!result.committed) {
                alert(
                    '❌ Bạn không đủ Coin.'
                );

                return;
            }

            this.hunger =
                Math.min(
                    100,
                    this.hunger +
                    Number(energyGain)
                );

            this.lastHungerUpdate =
                this.getNow();

            await this.saveHungerToDB();

            this.updateHungerUI();
            this.resetIdle();

            document
                .getElementById(
                    'stellarFoodShopModal'
                )
                ?.classList.remove(
                    'active'
                );

            this.playStellarFeedingRitual(
                symbol,
                itemName
            );
        } catch (error) {
            console.error(
                'Lỗi tiếp Tinh lực:',
                error
            );

            alert(
                '❌ Không thể tiếp Tinh lực.'
            );
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
            }
        }
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
                                <button type="button"
                                        class="pet-interaction-action is-unlocked"
                                        disabled>
                                    <span>✓</span>
                                    Đã mở khóa vĩnh viễn
                                </button>
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
                                ? 'Có thể sử dụng ngay'
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

    static async buyInteraction(
        petId,
        price
    ) {
        if (this.purchaseInProgress) return;

        const user = this.getCurrentUser();

        if (
            !user?.username ||
            typeof db === 'undefined' ||
            !this.isSupported(petId)
        ) {
            alert(
                '❌ Không xác định được tài khoản hoặc thú cưng.'
            );

            return;
        }

        if (this.isUnlocked(petId)) {
            alert(
                '✅ Tương tác này đã được mở khóa.'
            );

            return;
        }

        const safePrice = Math.max(
            0,
            Math.round(Number(price) || 0)
        );

        const accepted = confirm(
            `Dùng ${safePrice} Coin để mở khóa vĩnh viễn tương tác?`
        );

        if (!accepted) return;

        this.purchaseInProgress = true;

        const coinRef = db.ref(
            `student_coins/${user.username}`
        );

        const unlockRef = db.ref(
            `student_pet_interactions/${user.username}/${petId}`
        );

        let coinWasDeducted = false;

        try {
            const unlockSnapshot =
                await unlockRef.once('value');

            if (
                unlockSnapshot.val() === true
            ) {
                this.unlockedInteractions = [
                    ...new Set([
                        ...this.unlockedInteractions,
                        petId
                    ])
                ];

                this.showInfo();
                return;
            }

            /*
             * Transaction tránh hai lần mua
             * cùng đọc một số dư Coin.
             */
            const coinTransaction =
                await coinRef.transaction(
                    currentValue => {
                        const balance =
                            Number(currentValue) || 0;

                        if (
                            balance < safePrice
                        ) {
                            return;
                        }

                        return balance - safePrice;
                    }
                );

            if (!coinTransaction.committed) {
                alert('❌ Bạn không đủ Coin.');
                return;
            }

            coinWasDeducted = true;

            await unlockRef.set(true);

            this.unlockedInteractions = [
                ...new Set([
                    ...this.unlockedInteractions,
                    petId
                ])
            ];

            this.showInfo();

            const activePetId =
                localStorage.getItem(
                    'active_pet'
                );

            if (
                activePetId === petId &&
                this.usesHungerSystem(petId)
            ) {
                await this.initHungerSystem(
                    user.username
                );
            }

            alert(
                '🎉 Đã mở khóa tương tác thú cưng!'
            );
        } catch (error) {
            console.error(
                'Lỗi mua tương tác thú cưng:',
                error
            );

            /*
             * Đã trừ Coin nhưng mở khóa thất bại
             * thì tự hoàn lại Coin.
             */
            if (coinWasDeducted) {
                try {
                    await coinRef.transaction(
                        value =>
                            (Number(value) || 0) +
                            safePrice
                    );
                } catch (rollbackError) {
                    console.error(
                        'Không hoàn Coin được:',
                        rollbackError
                    );
                }
            }

            if (
                error?.code ===
                'PERMISSION_DENIED' ||
                String(error?.message).includes(
                    'PERMISSION_DENIED'
                )
            ) {
                alert(
                    '❌ Firebase Rules chưa cho phép ghi dữ liệu tương tác pet.'
                );
            } else {
                alert(
                    '❌ Không thể mở khóa tương tác.'
                );
            }
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
                 * Chỉ Kỳ Lân Tinh Tú có
                 * tương tác nhấn giữ.
                 */
                if (
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
                    '#stellar-slumber-cocoon'
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
                'stellar-energy-critical'
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