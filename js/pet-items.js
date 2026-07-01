// js/pet-items.js

class PetManager {
    static container = document.getElementById('virtual-pet-container');

    static spawnPet(petData) {
        if (!this.container) return;

        // Xóa đồ họa thú cưng cũ nếu có
        this.container.innerHTML = '';

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

        this.container.appendChild(petElement);
        this.container.style.display = 'block';
        this.container.classList.add('pet-idle');

        let closeBtn = document.createElement('div');
        closeBtn.innerHTML = '✖';
        closeBtn.style.cssText = 'position: absolute; top: -5px; right: -15px; width: 22px; height: 22px; background: rgba(225, 29, 72, 0.2); color: #e11d48; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 11px; cursor: pointer; opacity: 0; transition: opacity 0.3s; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';

        // Tàng hình, chỉ hiện khi rê chuột hoặc chạm vào thú cưng
        this.container.onmouseenter = () => closeBtn.style.opacity = '1';
        this.container.onmouseleave = () => closeBtn.style.opacity = '0';

        closeBtn.onclick = (e) => {
            e.stopPropagation(); // Ngăn lệnh kéo thả bị kích hoạt
            if (typeof StoreManager !== 'undefined' && StoreManager.unapplyItem) {
                StoreManager.unapplyItem(petData.id); // Gọi hàm tháo trang bị
            }
        };
        this.container.appendChild(closeBtn);
        this.makePetDraggable();
        localStorage.setItem('active_pet', petData.id);

        if (typeof PetInteractionManager !== 'undefined') {
            const petImg = document.getElementById('virtual-pet-img');
            if (petImg) PetInteractionManager.attachEvents(petImg, petData);
        }
    }

    static makePetDraggable() {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        // Cần gỡ bỏ event mousedown cũ để không bị nhân bản sự kiện khi spawn thú mới
        const newContainer = this.container.cloneNode(true);
        this.container.parentNode.replaceChild(newContainer, this.container);
        this.container = newContainer;

        this.container.addEventListener('mousedown', (e) => {
            isDragging = true;
            this.container.classList.remove('pet-idle');
            startX = e.clientX;
            startY = e.clientY;
            initialX = this.container.offsetLeft;
            initialY = this.container.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            this.container.style.left = `${initialX + dx}px`;
            this.container.style.top = `${initialY + dy}px`;
            this.container.style.bottom = 'auto';
            this.container.style.right = 'auto';

            // CỘNG HƯỞNG DẢI PHÉP THUẬT KHI DI CHUYỂN
            const nyxPet = this.container.querySelector('.nyx-night-goddess-magic');
            if (nyxPet) {
                const isDarkWorld = document.querySelector('.nyx-dark-world') !== null;

                // SỬA Ở ĐÂY: Nếu không có Màn Đêm, lập tức dừng lại, không sinh ra vệt sao nào cả!
                if (!isDarkWorld) return;

                // Nếu đang có Màn Đêm, tạo chùm 3 hạt siêu sáng
                if (Math.random() < 1.0) {
                    for (let i = 0; i < 3; i++) {
                        let particle = document.createElement('div');
                        // Gộp sẵn class cường hóa vì giờ vệt sao chỉ xuất hiện trong màn đêm
                        particle.className = 'nyx-trail-particle nyx-trail-enhanced';

                        // Tạo độ lệch quanh con trỏ chuột
                        particle.style.left = `${e.clientX + (Math.random() * 50 - 25)}px`;
                        particle.style.top = `${e.clientY + (Math.random() * 30 - 10) + 20}px`;

                        document.body.appendChild(particle);

                        // ĐỒNG BỘ CSS: Xóa hạt sau đúng 2000ms (2 giây) để vệt đuôi không bị cắt ngang đột ngột
                        setTimeout(() => {
                            if (particle.parentNode) particle.remove();
                        }, 2000);
                    }
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.container.classList.add('pet-idle');
            }
        });

        // Lắng nghe sự kiện click trên toàn trang
        document.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'virtual-pet-img' && e.target.classList.contains('nyx-night-goddess-magic')) {
                const petImg = e.target;
                const container = document.getElementById('virtual-pet-container');

                // Tránh spam click
                if (document.querySelector('.nyx-dark-world')) return;

                // 1. Phóng thích năng lượng 
                petImg.classList.add('nyx-power-release');
                setTimeout(() => petImg.classList.remove('nyx-power-release'), 800);

                // 2. Tạo màn đêm
                let darkBg = document.createElement('div');
                darkBg.className = 'nyx-dark-world';

                // --- THÊM MẶT TRĂNG ---
                let moon = document.createElement('div');
                moon.className = 'nyx-moon';
                moon.innerHTML = '🌙'; // Bạn có thể đổi thành 🌕 nếu thích trăng tròn
                darkBg.appendChild(moon);

                // --- THÊM 50 NGÔI SAO NGẪU NHIÊN ---
                for (let i = 0; i < 50; i++) {
                    let star = document.createElement('div');
                    star.className = 'nyx-star';

                    // Random vị trí
                    star.style.top = Math.random() * 100 + 'vh';
                    star.style.left = Math.random() * 100 + 'vw';

                    // Random kích thước (từ 1px đến 3px)
                    let size = Math.random() * 2 + 1;
                    star.style.width = size + 'px';
                    star.style.height = size + 'px';

                    // Random tốc độ nhấp nháy và độ trễ
                    star.style.animationDuration = (Math.random() * 1.5 + 0.8) + 's';
                    star.style.animationDelay = (Math.random() * 2) + 's';

                    darkBg.appendChild(star);
                }

                document.body.appendChild(darkBg);

                // 3. Khung thoại
                let dialogue = document.createElement('div');
                dialogue.className = 'nyx-dialogue-box';
                dialogue.innerHTML = '✨ "Ta là Nyx, Nữ thần của Màn Đêm..."';
                container.appendChild(dialogue);

                // 4. Dọn dẹp DOM sau 3.5 giây
                setTimeout(() => {
                    if (darkBg.parentNode) darkBg.remove();
                    if (dialogue.parentNode) dialogue.remove();
                }, 5500);
            }
        });
    }
}