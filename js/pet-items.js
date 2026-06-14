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
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.container.classList.add('pet-idle');
            }
        });
    }
}