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
        }
    ];

    static isSupported(petId) { 
        return petId === 'pet_shiba' || this.interactivePets.some(p => p.id === petId); 
    }

    static init() {
        const toggle = document.getElementById('togglePetInteractions');
        if (toggle) toggle.checked = this.isEnabled;

        if (typeof db !== 'undefined') {
            db.ref('.info/serverTimeOffset').on('value', (snap) => {
                this.serverOffset = snap.val() || 0;
            });
        }

        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user && user.username && typeof db !== 'undefined') {
            db.ref(`student_pet_interactions/${user.username}`).on('value', (snapshot) => {
                this.unlockedInteractions = snapshot.exists() ? Object.keys(snapshot.val()) : [];

                const modal = document.getElementById('petInteractionInfoModal');
                if (modal && modal.classList.contains('active')) this.showInfo();

                // FIX LỖI: Thêm chốt chặn isSupported để tránh pet thường hiển thị thanh đói
                const activePetId = localStorage.getItem('active_pet');
                if (activePetId && this.isSupported(activePetId) && this.unlockedInteractions.includes(activePetId)) {
                    this.initHungerSystem(user.username);
                }
            });
        }
    }

    static initHungerSystem(username) {
        const container = document.getElementById('virtual-pet-container');
        if (!container) return;

        if (!document.getElementById('pet-hunger-bar')) {
            const barContainer = document.createElement('div');
            barContainer.id = 'pet-hunger-bar';
            barContainer.style.cssText = 'position: absolute; top: -35px; left: 50%; transform: translateX(-50%); width: 70px; height: 12px; background: rgba(0,0,0,0.7); border-radius: 10px; cursor: pointer; border: 2px solid #fff; z-index: 999999; box-shadow: 0 4px 8px rgba(0,0,0,0.4); padding: 1px; display: flex; align-items: center;';
            barContainer.title = "Độ đói của thú cưng (Nhấn vào để mua đồ ăn)";
            barContainer.onclick = () => this.openFoodShop();

            if (!this.isEnabled) {
                barContainer.style.display = 'none';
            }

            const fill = document.createElement('div');
            fill.id = 'pet-hunger-fill';
            fill.style.cssText = 'width: 100%; height: 100%; background: #2ecc71; border-radius: 8px; transition: width 0.4s, background 0.4s;';
            barContainer.appendChild(fill);

            container.appendChild(barContainer);
        }

        db.ref(`student_pet_status/${username}`).once('value', (snap) => {
            const data = snap.val();
            const now = this.getNow();
            if (data) {
                this.hunger = data.hunger !== undefined ? data.hunger : 100;
                this.lastHungerUpdate = data.lastUpdate || now;

                const hoursPassed = Math.floor((now - this.lastHungerUpdate) / 3600000);
                if (hoursPassed > 0) {
                    this.hunger = Math.max(0, this.hunger - (10 * hoursPassed));
                    this.lastHungerUpdate += hoursPassed * 3600000;
                    this.saveHungerToDB();
                }
            } else {
                this.saveHungerToDB();
            }
            this.updateHungerUI();
            this.startPetLoop();
        });
    }

    static saveHungerToDB() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user && typeof db !== 'undefined') {
            db.ref(`student_pet_status/${user.username}`).set({
                hunger: this.hunger,
                lastUpdate: this.lastHungerUpdate
            });
        }
    }

    static updateHungerUI() {
        const fill = document.getElementById('pet-hunger-fill');
        if (!fill) return;
        fill.style.width = `${this.hunger}%`;

        if (this.hunger > 50) fill.style.background = '#2ecc71';
        else if (this.hunger > 20) fill.style.background = '#f39c12';
        else fill.style.background = '#e74c3c';

        const shopText = document.getElementById('shopHungerText');
        if (shopText) shopText.innerText = Math.round(this.hunger);
    }

    static startPetLoop() {
        if (this.loopInterval) clearInterval(this.loopInterval);

        this.loopInterval = setInterval(() => {
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
        if (this.isSleeping === isSleeping) return;
        this.isSleeping = isSleeping;
        const petImg = document.getElementById('virtual-pet-img');
        const container = document.getElementById('virtual-pet-container');
        const activePetId = localStorage.getItem('active_pet');

        if (isSleeping) {
            this.sleepTime = 0;
            if (petImg) petImg.classList.add('pet-sleeping');

            if (activePetId === 'pet_doisong_bandem') {
                if (!document.getElementById('pet-sleep-stars-container')) {
                    const starsContainer = document.createElement('div');
                    starsContainer.id = 'pet-sleep-stars-container';
                    starsContainer.className = 'cat-sleep-stars-wrap';

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
                    container.appendChild(starsContainer);
                }
            } else {
                if (!document.getElementById('pet-zzz')) {
                    const zzz = document.createElement('div');
                    zzz.id = 'pet-zzz';
                    zzz.className = 'pet-zzz-particle';
                    zzz.innerText = 'Zzz';
                    container.appendChild(zzz);
                }
            }
        } else {
            this.idleTime = 0;
            if (petImg) petImg.classList.remove('pet-sleeping');

            const zzz = document.getElementById('pet-zzz');
            if (zzz) zzz.remove();

            const starsContainer = document.getElementById('pet-sleep-stars-container');
            if (starsContainer) starsContainer.remove();
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
            if (activePetId && this.isSupported(activePetId) && this.unlockedInteractions.includes(activePetId)) {
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

    static showInfo() {
        const modal = document.getElementById('petInteractionInfoModal');
        const list = document.getElementById('interactivePetList');
        if (!modal || !list) return;

        list.innerHTML = '';
        this.interactivePets.forEach(pet => {
            const isUnlocked = this.unlockedInteractions.includes(pet.id);
            let actionHTML = isUnlocked
                ? `<button style="background: rgba(16, 185, 129, 0.15); color: #059669; border: 2px dashed #10b981; padding: 10px; border-radius: 12px; font-weight: bold; width: 100%; cursor: default; font-size: 0.95em;">✅ Đã mở khóa tương tác</button>`
                : `<button onclick="PetInteractionManager.buyInteraction('${pet.id}', ${pet.price})" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white; border: none; padding: 10px; border-radius: 12px; font-weight: bold; width: 100%; cursor: pointer; box-shadow: 0 4px 15px rgba(246, 211, 101, 0.4); font-size: 1em;">🛒 Mua tương tác (${pet.price} 🪙)</button>`;

            list.innerHTML += `<div style="background: rgba(255,255,255,0.8); padding: 18px; border-radius: 16px; margin-bottom: 15px; text-align: left; border-left: 5px solid #f6d365; box-shadow: 0 5px 15px rgba(0,0,0,0.05);"><strong style="color: #2c3e50; font-size: 1.2em;">${pet.name}</strong><p style="margin: 8px 0 15px 0; color: #555; font-size: 0.9em;">${pet.desc}</p>${actionHTML}</div>`;
        });
        modal.classList.add('active');
    }

    static async buyInteraction(petId, price) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const coinRef = db.ref(`student_coins/${user.username}`);
        const snap = await coinRef.once('value');
        let currentCoins = snap.val() || 0;
        if (currentCoins < price) return alert(`❌ Bạn không đủ Coin! Cần thêm ${price - currentCoins} Coin nữa.`);
        if (confirm(`Xác nhận dùng ${price} Coin để mở khóa vĩnh viễn tương tác?`)) {
            await coinRef.set(currentCoins - price);
            await db.ref(`student_pet_interactions/${user.username}/${petId}`).set(true);
            alert('🎉 Tuyệt vời! Bạn đã có thể tương tác với thú cưng này.');
        }
    }

    static attachEvents(petElement, petData) {
        const clone = petElement.cloneNode(true);
        petElement.parentNode.replaceChild(clone, petElement);
        const activePet = document.getElementById('virtual-pet-img');
        const container = document.getElementById('virtual-pet-container');

        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
            setTimeout(() => {
                // KIỂM TRA: Nếu là pet tương tác thì bật hệ thống
                if (this.isSupported(petData.id) && this.unlockedInteractions.includes(petData.id)) {
                    this.initHungerSystem(user.username);
                } else {
                    if (this.loopInterval) {
                        clearInterval(this.loopInterval);
                        this.loopInterval = null;
                    }
                    const hungerBar = document.getElementById('pet-hunger-bar');
                    if (hungerBar) hungerBar.style.display = 'none';
                    this.setSleepState(false);
                }
            }, 500); 
        }

        let clickTimer = null;
        let lastTap = 0;

        // ==========================================
        // FIX: BỔ SUNG LOGIC KÉO THẢ PET HOÀN CHỈNH
        // ==========================================
        let petOffsetX = 0;
        let petOffsetY = 0;

        const startPetDrag = (e) => {
            if (!this.isSupported(petData.id)) return;
            this.isPetDragging = true;
            container.style.transition = 'none';
            this.setSleepState(false);

            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const rect = container.getBoundingClientRect();
            
            petOffsetX = clientX - rect.left;
            petOffsetY = clientY - rect.top;
        };

        const onPetDrag = (e) => {
            if (!this.isPetDragging) return;
            e.preventDefault(); // Ngăn trình duyệt cuộn trang khi vuốt Pet trên Mobile
            
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            let newX = clientX - petOffsetX;
            let newY = clientY - petOffsetY;

            // Giới hạn không cho pet lọt ra ngoài mép màn hình
            const maxX = window.innerWidth - container.offsetWidth;
            const maxY = window.innerHeight - container.offsetHeight;
            newX = Math.max(0, Math.min(maxX, newX));
            newY = Math.max(0, Math.min(maxY, newY));

            container.style.left = `${newX}px`;
            container.style.top = `${newY}px`;
            container.style.bottom = 'auto';
            container.style.right = 'auto';
        };

        const endPetDrag = () => {
            if (!this.isSupported(petData.id)) return;
            if (this.isPetDragging) {
                this.isPetDragging = false;
                this.resetIdle();
            }
        };

        // Gắn sự kiện cho Chuột (Máy tính)
        container.addEventListener('mousedown', (e) => {
            startPetDrag(e);
            document.addEventListener('mousemove', onPetDrag);
        });
        document.addEventListener('mouseup', () => {
            endPetDrag();
            document.removeEventListener('mousemove', onPetDrag);
        });

        // Gắn sự kiện cho Cảm ứng (Điện thoại)
        container.addEventListener('touchstart', (e) => {
            startPetDrag(e);
            document.addEventListener('touchmove', onPetDrag, { passive: false });
        }, { passive: false }); // Bắt buộc false để e.preventDefault() hoạt động

        document.addEventListener('touchend', () => {
            endPetDrag();
            document.removeEventListener('touchmove', onPetDrag);
        });
        // ==========================================

        const handleInteraction = (type) => {
            if (!this.isEnabled || !this.isSupported(petData.id)) return;
            if (!this.unlockedInteractions.includes(petData.id)) return;

            this.resetIdle();

            if (type === 'double') this.feedPet(activePet, petData);
            else this.petTheAnimal(activePet);
        };

        activePet.addEventListener('click', (e) => {
            if (clickTimer) {
                clearTimeout(clickTimer); clickTimer = null; handleInteraction('double');
            } else {
                clickTimer = setTimeout(() => { clickTimer = null; handleInteraction('single'); }, 250);
            }
        });

        activePet.addEventListener('touchend', (e) => {
            const tapLength = new Date().getTime() - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                handleInteraction('double'); if (e.cancelable) e.preventDefault();
            } else { handleInteraction('single'); }
            lastTap = new Date().getTime();
        });
    }

    static petTheAnimal(petElement) {
        if (this.isBusy) return;
        petElement.style.transform = 'scale(1.1) translateY(-15px)';
        setTimeout(() => { petElement.style.transform = 'scale(1) translateY(0)'; }, 200);
        this.spawnParticles(petElement.parentNode, '❤️');
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
                    setTimeout(() => {
                        container.style.transition = 'none';
                        this.isBusy = false;
                    }, 200);
                }, 250);
            }, 500);
        };

        setTimeout(() => { if (document.body.contains(food) && !isDragging) runToBoneAndEat(); }, 1500);
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

document.addEventListener('DOMContentLoaded', () => { PetInteractionManager.init(); });

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
            if (activePetId && PetInteractionManager.isSupported(activePetId) && PetInteractionManager.unlockedInteractions.includes(activePetId)) {
                PetInteractionManager.startPetLoop();
            }
        }
    }
});