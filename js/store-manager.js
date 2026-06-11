// js/store-manager.js

const StoreConfig = {
    items: [
        { id: 'theme_ocean', name: 'Đại Dương Xanh', type: 'theme', price: 150, isNonCoin: false, tag: 'Giao diện' },
        { id: 'effect_snow', name: 'Tuyết Mùa Đông', type: 'effect', price: 200, isNonCoin: false, tag: 'Hiệu ứng' },
        { id: 'pet_shiba', name: 'Chó Shiba', type: 'pet', price: 300, isNonCoin: false, tag: 'Thú cưng', value: '🐕', isIcon: true },
        {
            id: 'pet_cotich_1',
            name: 'Phượng Hoàng Lửa',
            type: 'pet',
            price: 400,
            isNonCoin: false,
            tag: 'Cổ tích',
            value: 'assets/pet/cổ tích/cổ tích 1.png',
            isIcon: false,
            petEffect: 'phoenix-fire'
        },
        {
            id: 'theme_cotich',
            name: 'Vương Quốc Thần Thoại',
            type: 'theme',
            price: 450,
            isNonCoin: false,
            tag: 'Cổ tích',
            value: 'theme-fairy-tale', // Đây là tên Class CSS sẽ áp dụng cho toàn bộ trang
            customIcon: '🏰'
        },
        {
            id: 'pet_cotich_2',
            name: 'Hồ Ly Chín Đuôi',
            type: 'pet',
            price: 0,
            isNonCoin: true,
            tag: 'Cổ tích',
            value: 'assets/pet/cổ tích/cổ tích 2.png',
            isIcon: false,
            petEffect: 'nine-tailed-fox-magic'
        },
        {
            id: 'effect_cotich',
            name: 'Bụi Phép Thuật',
            type: 'effect',
            price: 300,
            isNonCoin: false,
            tag: 'Cổ tích',
            value: '🧚‍♂️'
        }
    ]
};

class StoreManager {
    static getItemsByType(type) {
        if (type === 'all') return StoreConfig.items;
        return StoreConfig.items.filter(item => item.type === type);
    }

    static getItemById(id) {
        return StoreConfig.items.find(item => item.id === id);
    }

    static applyItem(itemId) {
        const item = this.getItemById(itemId);
        if (!item) return;

        switch (item.type) {
            case 'theme':
                ThemeManager.applyTheme(item.id);
                break;
            case 'effect':
                EffectManager.applyEffect(item.id);
                break;
            case 'pet':
                PetManager.spawnPet(item);
                break;
        }
    }

    static renderStoreItem(item, isOwned = false, isEquipped = false, isTrial = false, isUpcoming = false) {
        let tagClass = item.tag === 'Tứ kị sĩ' ? 'tag-tu-ki-si' : (item.tag === 'Cổ tích' ? 'tag-co-tich' : 'tag-normal');
        let actionButton = '';
        let trialButton = '';

        // --- LOGIC 1: XỬ LÝ VẬT PHẨM BỊ GIÁO VIÊN KHÓA SỬ DỤNG VÀ MUA ---
        if (item.isLocked) {
            trialButton = `<button class="btn-preview disabled" disabled>🔒 Đã bị khóa</button>`;
            actionButton = `<button class="btn-equip disabled" disabled style="background: #e11d48; color: white; border: none; cursor: not-allowed; box-shadow: none;">🔒 Giáo viên đã khóa</button>`;
        }
        // --- LOGIC 2: XỬ LÝ VẬT PHẨM CHƯA ĐẾN GIỜ MỞ BÁN ---
        else if (isUpcoming) {
            trialButton = `<button class="btn-preview disabled" disabled>🔒 Chưa mở bán</button>`;
            actionButton = `<button class="btn-equip active" disabled id="countdown-btn-${item.id}" style="background: #2c3e50; color: #f1c40f; cursor: not-allowed; font-family: 'Courier New', Courier, monospace; font-size: 1.05em; font-weight: bold; border: 1px solid #7f8c8d; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">⏳ Đang tính toán...</button>`;
        }
        // --- LOGIC LUỒNG HOẠT ĐỘNG BÌNH THƯỜNG ---
        else {
            if (isEquipped) {
                actionButton = `<button class="btn-equip active" onclick="StoreManager.unapplyItem('${item.id}')" style="background: rgba(225, 29, 72, 0.08); color: #e11d48; border: 1px dashed #e11d48; cursor: pointer; box-shadow: none;" title="Nhấn để tháo vật phẩm này">❌ Tháo trang bị</button>`;
            } else if (isOwned) {
                actionButton = `<button class="btn-equip" onclick="StoreManager.applyItem('${item.id}')">✨ Mặc ngay</button>`;
            } else {
                if (item.isNonCoin) {
                    // NẾU GIÁO VIÊN XÉT GIÁ > 0 THÌ CHO PHÉP MUA BẰNG COIN TRONG THỜI GIAN GIỚI HẠN
                    if (item.price > 0) {
                        actionButton = `<button class="btn-buy" onclick="buyItem('${item.id}')">🛒 Mua giới hạn: ${item.price} 🪙</button>`;
                    } else {
                        actionButton = `<button class="btn-buy" onclick="buyItem('${item.id}')">🎁 Nhận được từ sự kiện</button>`;
                    }
                } else {
                    actionButton = `<button class="btn-buy" onclick="buyItem('${item.id}')">🛒 Mua đứt: ${item.price} 🪙</button>`;
                }
            }

            // Cấu hình hiển thị nút dùng thử đối với vật phẩm Sự kiện được mở bán bằng Coin
            if (item.isNonCoin && (!item.price || item.price <= 0)) {
                trialButton = `<button class="btn-preview disabled" disabled title="Không khả dụng">🚫 Không hỗ trợ thử nghiệm</button>`;
            } else if (isTrial) {
                let trialPrice = item.price / 2;
                let refund = trialPrice * 0.3;
                let finalPrice = item.price - refund;

                trialButton = `<button class="btn-preview active" disabled>⏳ Đang trong 24h dùng thử</button>`;
                actionButton = `<button class="btn-buy upgrade" onclick="buyItem('${item.id}', true)">💎 Nâng cấp vĩnh viễn: ${finalPrice} 🪙</button>`;
            } else if (!isOwned) {
                let trialPrice = item.price / 2;
                trialButton = `<button class="btn-preview" onclick="trialItem('${item.id}')">⏳ Dùng thử 1 ngày: ${trialPrice} 🪙</button>`;
            }
        }

        let typeName = item.type === 'theme' ? 'Giao diện' : (item.type === 'effect' ? 'Hiệu ứng' : 'Thú cưng ảo');

        let iconHTML = '';
        if (item.isIcon === false && item.value) {
            let extraClass = item.petEffect ? item.petEffect : '';
            if (item.id === 'pet_cotich_1') extraClass = 'phoenix-store-fire';
            else if (item.id === 'pet_cotich_2') extraClass = 'fox-store-magic';

            iconHTML = `<img src="${item.value}" class="item-icon ${extraClass}" style="width: 80px; height: 80px; object-fit: contain;">`;
        } else {
            let displayIcon = this.getIconForType(item.type);
            if (item.customIcon) displayIcon = item.customIcon;
            else if (item.type !== 'theme' && item.value) displayIcon = item.value;

            iconHTML = `<div class="item-icon">${displayIcon}</div>`;
        }

        return `
        <div class="store-item-card" data-type="${item.type}" style="${item.isLocked ? 'opacity: 0.75; filter: grayscale(0.4); border: 1px solid rgba(225,29,72,0.3);' : ''}">
            <div class="card-glow"></div>
            <div class="item-tag ${tagClass}">${item.tag}</div>
            <div class="item-icon-wrapper">
                ${iconHTML}
            </div>
            <div class="item-info">
                <h4 class="item-name">${item.name}</h4>
                <span class="item-type-label">${typeName}</span>
            </div>
            <div class="item-actions">
                ${trialButton}
                ${actionButton}
            </div>
        </div>
    `;
    }

    static getIconForType(type) {
        switch (type) {
            case 'theme': return '🎨';
            case 'effect': return '✨';
            case 'pet': return '🐾';
            default: return '📦';
        }
    }
}