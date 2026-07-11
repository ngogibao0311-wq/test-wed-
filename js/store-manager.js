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
        },
        {
            id: 'theme_cotich_forest',
            name: 'Khu Rừng Phép Thuật',
            type: 'theme',
            price: 0,             // Giá 0 đồng
            isNonCoin: true,      // Nhận từ sự kiện, kích hoạt khóa preview
            tag: 'Cổ tích',
            value: 'theme-magic-forest', // Class CSS kích hoạt giao diện
            customIcon: '🌲'
        },
        {
            id: 'effect_cotich_firefly',
            name: 'Đom Đóm Rừng Tiên',
            type: 'effect',
            price: 0,             // Không bán bằng coin
            isNonCoin: true,      // Nhận từ sự kiện
            tag: 'Cổ tích',
            value: '🎇'           // Icon hiển thị trong cửa hàng
        },
        {
            id: 'pet_doisong_thiennhien',
            name: 'Cáo Thiên Nhiên',
            type: 'pet',
            price: 350,
            isNonCoin: false,
            tag: 'Đời sống',
            value: 'assets/pet/đời sống/thiên nhiên/thiên nhiên.png',
            isIcon: false,
            petEffect: 'nature-fox-magic'
        },
        {
            id: 'effect_doisong_laroi',
            name: 'Lá Rơi Mùa Hạ',
            type: 'effect',
            price: 0,             // Không bán bằng coin
            isNonCoin: true,      // Nhận từ sự kiện, khóa chức năng preview theo logic có sẵn
            tag: 'Đời sống',
            value: '🍃'           // Icon hiển thị chính trong cửa hàng
        },
        {
            id: 'theme_doisong',
            name: 'Nhịp Sống Xanh',
            type: 'theme',
            price: 300,
            isNonCoin: false,
            tag: 'Đời sống',
            value: 'theme-lifestyle', // Class CSS sẽ áp dụng
            customIcon: '🌿'
        },
        {
            id: 'pet_doisong_bandem',
            name: 'Mèo Đêm Đầy Sao',
            type: 'pet',
            price: 400,
            isNonCoin: false,
            tag: 'Ban đêm',
            value: 'assets/pet/đời sống/thời tiết/ban đêm.png',
            isIcon: false,
            petEffect: 'night-cat-magic' // Phục vụ cho class CSS hiệu ứng
        },
        {
            id: 'effect_bandem_tinhthu',
            name: 'Đêm Sao Huyền Bí',
            type: 'effect',
            price: 0,
            isNonCoin: true, // Vật phẩm sự kiện, kích hoạt khóa preview theo logic của bạn
            tag: 'Ban đêm',
            value: '🌌' // Icon hiển thị đại diện trong cửa hàng
        },
        {
            id: 'theme_bandem',
            name: 'Dải Ngân Hà',
            type: 'theme',
            price: 0,             // Không bán bằng coin
            isNonCoin: true,      // Kích hoạt khóa preview theo logic sự kiện của bạn
            tag: 'Ban đêm',
            value: 'theme-night-sky', // Class CSS sẽ tiêm vào <body>
            customIcon: '🌃'
        },
        {
            id: 'pet_doisong_banngay',
            name: 'Cún Vui Vẻ',
            type: 'pet',
            price: 350,
            isNonCoin: false,
            tag: 'Ban ngày',
            value: 'assets/pet/đời sống/thời tiết/ban ngày.png',
            isIcon: false,
            petEffect: 'daylight-magic' // Class CSS tạo hiệu ứng
        },
        {
            id: 'effect_banngay_bautroi',
            name: 'Bầu Trời Mùa Hạ',
            type: 'effect',
            price: 300,
            isNonCoin: false,
            tag: 'Ban ngày',
            value: '🌤️'
        },
        {
            id: 'theme_banngay_ngaymoi',
            name: 'Ngày Mới Rực Rỡ',
            type: 'theme',
            price: 390,
            isNonCoin: false,
            tag: 'Ban ngày',
            value: 'theme-daylight-sky', // Class CSS kích hoạt giao diện
            customIcon: '🌅'
        },
        {
            id: 'pet_cotich_3',
            name: 'Thần Thú Cổ Tích',
            type: 'pet',
            price: 300,
            isNonCoin: false,
            tag: 'Cổ tích',
            value: 'assets/pet/cổ tích/cổ tích 3.png',
            isIcon: false,
            petEffect: 'fairy-tale-magic-3' // Đã thêm dòng này để gọi hiệu ứng CSS
        },
        {
            id: 'effect_cotich_tinhlinh',
            name: 'Mưa Tinh Linh',
            type: 'effect',
            price: 300,
            isNonCoin: false,
            tag: 'Cổ tích',
            value: '🧚'
        },
        {
            id: 'theme_cotich_phale',
            name: 'Cung Điện Pha Lê',
            type: 'theme',
            price: 250,
            tag: 'Cổ tích',
            value: 'theme-crystal-palace', // Tên class CSS kích hoạt giao diện
            customIcon: '🔮'
        },
        {
            id: 'pet_truyenthuyet_1',
            name: 'Kỳ Lân Tinh Tú',
            type: 'pet',
            price: 0,             // Không bán bằng Coin
            isNonCoin: true,      // Nhận từ sự kiện Royal Ball
            tag: 'Truyền thuyết',
            value: 'assets/pet/truyền thuyết/truyền thuyết 1.png',
            isIcon: false,
            petEffect: 'galaxy-legend-magic' // Kích hoạt hiệu ứng Điện Ảnh Vũ Trụ
        },
        {
            id: 'effect_truyenthuyet_vutru',
            name: 'Tinh Trần Vũ Trụ',
            type: 'effect',
            price: 0,             // Nhận từ sự kiện
            isNonCoin: true,      // Không bán bằng Coin
            tag: 'Truyền thuyết', // Gắn tag Truyền thuyết
            value: 'effect_truyenthuyet_vutru',
            customIcon: '🌘'
        },
        {
            id: 'theme_truyenthuyet_vutru',
            name: 'Thần Hệ Tinh Vân',
            type: 'theme',
            price: 0,               // Không bán bằng Coin
            isNonCoin: false,        // Vật phẩm sự kiện đặc biệt
            tag: 'Truyền thuyết',   // Gắn tag Truyền thuyết
            value: 'theme-cosmic-godhood', // Class CSS định danh của giao diện
            customIcon: '🌗'
        },
        {
            id: 'pet_vutru_saothuy',
            name: 'Mèo Sao Thủy',
            type: 'pet',
            price: 290,
            isNonCoin: false,
            tag: 'Sao thủy', // Sửa ở đây
            value: 'assets/pet/sao thủy.png',
            isIcon: false,
            petEffect: 'mercury-magic'
        },
        {
            id: 'effect_vutru_saothuy',
            name: 'Mưa Tinh Thể',
            type: 'effect',
            price: 300,
            isNonCoin: false,
            tag: 'Sao thủy', // Sửa ở đây
            value: '☄️'
        },
        {
            id: 'theme_vutru_saothuy',
            name: 'Trạm Không Gian Sao Thủy',
            type: 'theme',
            price: 300,
            isNonCoin: false,
            tag: 'Sao thủy',
            value: 'theme-mercury-station', // Class CSS kích hoạt
            customIcon: '🛸'
        },
        {
            id: 'pet_vutru_meotinhvan',
            name: 'Mèo Tinh Vân',
            type: 'pet',
            price: 400,
            isNonCoin: false,
            tag: 'Vũ trụ',
            value: 'assets/pet/vũ trụ.png',
            isIcon: false,
            petEffect: 'nebula-cat-magic' // Class kích hoạt hiệu ứng hoàn toàn mới
        },
        {
            id: 'theme_cosmic_anomaly',
            name: 'Dị Điểm Không Gian',
            type: 'theme',
            price: 350,
            tag: 'Vũ trụ',
            value: 'theme-cosmic-anomaly', // Tên Class CSS đại diện cho toàn bộ giao diện
            customIcon: '🌌'
        },
        {
            id: 'effect_cosmic_dust',
            name: 'Bụi Tinh Vân',
            type: 'effect',
            price: 300,
            isNonCoin: false, // Bán bằng coin bình thường
            tag: 'Vũ trụ',
            customIcon: '☄️' // Icon sao băng
        },
        {
            id: 'pet_truyenthuyet_2',
            name: 'Vệ Thần Ngân Hà',
            type: 'pet',
            price: 0,             // Không bán bằng Coin (nhận từ sự kiện)
            isNonCoin: true,      // Đánh dấu là vật phẩm sự kiện
            tag: 'Truyền thuyết', // Gắn tag Truyền thuyết
            value: 'assets/pet/truyền thuyết/truyền thuyết 2.png',
            isIcon: false,
            petEffect: 'galaxy-guardian-magic' // Tên class hiệu ứng hoàn toàn mới
        },
        {
            id: 'effect_truyenthuyet_nganha',
            name: 'Tinh Vân Vệ Thần',
            type: 'effect',
            price: 0,             // Không bán bằng Coin
            isNonCoin: true,      // Kích hoạt cơ chế nhận từ sự kiện
            tag: 'Truyền thuyết', // Gắn tag Truyền thuyết
            value: 'effect_truyenthuyet_nganha',
            customIcon: '🌠'      // Icon hiển thị trong cửa hàng
        },
        {
            id: 'theme_truyenthuyet_nganha',
            name: 'Giao Diện Vệ Thần Ngân Hà',
            type: 'theme',
            price: 0,             // Sự kiện, không bán bằng coin
            isNonCoin: true,      // Cờ vật phẩm sự kiện
            tag: 'Truyền thuyết', // Gắn tag Truyền thuyết bảo chứng
            value: 'theme-vethan-nganha', // Tên Class CSS độc quyền sẽ bọc toàn bộ Web
            customIcon: '🌌'      // Biểu tượng thiên hà tinh vân
        },
        {
            id: 'pet_lotm_amon',
            name: 'Thiên Sứ Thời Gian Amon',
            type: 'pet',
            price: 0,
            isNonCoin: true,
            tag: 'Lord of the Mysteries',
            value: 'assets/pet/quỷ bí chi chủ/Amon.png',
            isIcon: false,
            petEffect: 'amon-time-magic',
            eventTier: 'event-mythic',
            effectScale: 'grand'
        },
        {
            id: 'effect_lotm_amon',
            name: 'Nghịch Lý Ký Sinh',
            type: 'effect',
            price: 0,
            isNonCoin: true,
            tag: 'Lord of the Mysteries',
            value: 'effect_lotm_amon',
            customIcon: '⊘',
            eventTier: 'event-mythic',
            effectScale: 'grand'
        },
        {
            id: 'theme_lotm_mysteries',
            name: 'Thần Điện Sương Mù Xám',
            type: 'theme',
            price: 0,
            isNonCoin: true,
            tag: 'Lord of the Mysteries',
            value: 'theme-lotm-mysteries',
            customIcon: '♜',
            eventTier: 'event-mythic',
            effectScale: 'grand'
        },
        // Thêm vào cuối mảng StoreConfig.items
        {
            id: 'music_lofi_01',
            name: 'That gril',
            type: 'music',
            price: 250,
            isNonCoin: false,
            tag: 'Thư giãn',
            customIcon: '🎧',
            musicUrl: 'https://youtu.be/TWX6Eq8v46M?si=xOz5ZQcJmbKI1Paa',
            volume: 0.35,
            loop: true
        },
        {
            id: 'pet_truyenthuyet_nyx',
            name: 'Nyx - Nữ Thần Màn Đêm',
            type: 'pet',
            price: 2000,
            isNonCoin: false,
            tag: 'Truyền thuyết',
            value: 'assets/pet/truyền thuyết/truyền thuyết 3.png',
            isIcon: false,
            petEffect: 'nyx-night-goddess-magic'
        },
        {
            id: 'effect_truyenthuyet_nyx_domain',
            name: 'Kỷ Nguyên Đêm Trường Cửu',
            type: 'effect',
            price: 1500,
            isNonCoin: false,
            tag: 'Truyền thuyết',
            value: 'effect_truyenthuyet_nyx_domain',
            customIcon: '🌌'
        },
        {
            id: 'theme_truyenthuyet_celestial',
            name: 'Thánh Vực Tối Thượng',
            type: 'theme',
            price: 1500,
            isNonCoin: false,
            tag: 'Truyền thuyết',
            value: 'theme-legendary-celestial', // Tên Class CSS sẽ kích hoạt
            customIcon: '👁️‍🗨️'
        },
        {
            id: 'pet_cotich_5',
            name: 'Kỳ Lân Biển Mộng Mơ',
            type: 'pet',
            price: 700,
            isNonCoin: false,
            tag: 'Cổ tích',
            value: 'assets/pet/cổ tích/cổ tích 5.png',
            isIcon: false,
            petEffect: 'fairy-narwhal-bubble-magic'
        },
        {
            id: 'theme_cotich_hai_nguyet',
            name: 'Vịnh Ngọc Trai Mộng',
            type: 'theme',
            price: 450,
            isNonCoin: false,
            tag: 'Cổ tích',
            value: 'theme-fairy-sea-dream',
            customIcon: '🐚'
        },
        {
            id: 'effect_cotich_bot_ngoc_mong',
            name: 'Bọt Ngọc Mộng',
            type: 'effect',
            price: 300,
            isNonCoin: false,
            tag: 'Cổ tích',
            customIcon: '🫧'
        },
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
                // FIX KẸT GIAO DIỆN: Xóa toàn bộ class giao diện cũ trong StoreConfig khỏi thẻ <body> trước khi đổi
                StoreConfig.items.forEach(i => {
                    if (i.type === 'theme' && i.value) {
                        document.body.classList.remove(i.value);
                    }
                });
                ThemeManager.applyTheme(item.id);
                break;
            case 'effect':
                EffectManager.applyEffect(item.id);
                break;
            case 'pet':
                PetManager.spawnPet(item);
                break;
            case 'music': // BỔ SUNG DÒNG NÀY
                MusicManager.applyMusic(item.id);
                break;
        }
    }

    static renderStoreItem(item, isOwned = false, isEquipped = false, isTrial = false, isUpcoming = false) {
        let tagClass = item.tag === 'Lord of the Mysteries' ? 'tag-lotm' : (item.tag === 'Truyền thuyết' ? 'tag-truyen-thuyet' : (item.tag === 'Sao thủy' ? 'tag-sao-thuy' : (item.tag === 'Cổ tích' ? 'tag-co-tich' : (item.tag === 'Đời sống' ? 'tag-doi-song' : (item.tag === 'Ban đêm' ? 'tag-ban-dem' : (item.tag === 'Ban ngày' ? 'tag-ban-ngay' : 'tag-normal'))))));
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

        let typeName = item.type === 'theme' ? 'Giao diện' : (item.type === 'effect' ? 'Hiệu ứng' : (item.type === 'music' ? 'Nhạc nền' : 'Thú cưng ảo'));

        let iconHTML = '';
        if (item.isIcon === false && item.value) {
            // Đã xóa toàn bộ logic gán extraClass hiệu ứng
            // Chỉ giữ lại class 'item-icon' mặc định để không bị hiện hiệu ứng trong Cửa hàng
            iconHTML = `<img src="${item.value}" class="item-icon" style="width: 80px; height: 80px; object-fit: contain;">`;
        } else {
            let displayIcon = this.getIconForType(item.type);
            if (item.customIcon) displayIcon = item.customIcon;
            else if (item.type !== 'theme' && item.value) displayIcon = item.value;

            iconHTML = `<div class="item-icon">${displayIcon}</div>`;
        }

        return `
        <div class="store-item-card" data-type="${item.type}" style="${item.isLocked ? 'opacity: 0.75; filter: grayscale(0.4); border: 1px solid rgba(225,29,72,0.3);' : ''}">
            <div class="card-glow"></div>
            <div class="item-tag ${tagClass}"><span>${item.tag}</span></div>
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
            case 'music': return '🎵'; // BỔ SUNG DÒNG NÀY
            default: return '📦';
        }
    }
}