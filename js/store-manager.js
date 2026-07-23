// js/store-manager.js

const StoreConfig = {
    items: [
        { id: 'theme_ocean', name: 'Đại Dương Xanh', type: 'theme', price: 150, isNonCoin: false, tag: 'Giao diện' },
        { id: 'effect_snow', name: 'Tuyết Mùa Đông', type: 'effect', price: 200, isNonCoin: false, tag: 'Hiệu ứng' },
        { id: 'pet_shiba', name: 'Chó Shiba', type: 'pet', price: 300, isNonCoin: false, tag: 'Thú cưng', value: '🐕', isIcon: true },
        {
            id: 'pet_cat_wizard',
            name: 'Mèo Phù Thủy',
            type: 'pet',
            price: 0,
            isNonCoin: true,
            tag: 'Thú cưng',
            value: 'assets/pet/cat_wizard.png',
            isIcon: false
        },
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
            isNonCoin: true,        // Vật phẩm sự kiện đặc biệt
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
            name: 'Hí Khúc',
            type: 'music',
            price: 250,
            isNonCoin: false,
            tag: 'Âm nhạc',
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
            price: 550,
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
        {
            id: 'pet_doraemon_shizuka',
            name: 'Shizuka - Giai Điệu Dịu Dàng',
            type: 'pet',
            price: 300,
            isNonCoin: false,
            tag: 'Doraemon',
            value: 'assets/pet/Doraemon/sishuka.png',
            isIcon: false,
            petEffect: 'doraemon-shizuka-study-magic',
            disableClickEffect: true
        },
        {
            id: 'theme_doraemon_childhood',
            name: 'Khúc Ca Tuổi Thơ',
            type: 'theme',
            price: 0,
            isNonCoin: true,
            tag: 'Doraemon',
            value: 'theme-doraemon-childhood',
            customIcon: '🎶'
        },
        {
            id: 'effect_doraemon_school_memories',
            name: 'Ký Ức Sân Trường',
            type: 'effect',
            price: 0,
            isNonCoin: true,
            tag: 'Doraemon',
            value: 'effect_doraemon_school_memories',
            customIcon: '🪁'
        },
        {
            id: 'pet_hoihoa_1',
            name: 'Nàng Họa Sĩ Tinh Linh',
            type: 'pet',
            price: 0,
            isNonCoin: true,
            tag: 'Hội họa',
            value: 'assets/pet/hội họa/hội họa 1.png',
            isIcon: false,
            petEffect: 'painting-muse-magic',
            disableClickEffect: true
        },
        {
            id: 'theme_hoihoa_atelier',
            name: 'Xưởng Vẽ Tinh Linh',
            type: 'theme',
            price: 0,
            isNonCoin: true,
            tag: 'Hội họa',
            value: 'theme-enchanted-atelier',
            customIcon: '🎨'
        },
        {
            id: 'effect_hoihoa_living_canvas',
            name: 'Họa Giới Sắc Màu',
            type: 'effect',
            price: 0,
            isNonCoin: true,
            tag: 'Hội họa',
            value: 'effect_hoihoa_living_canvas',
            customIcon: '🖌️'
        },
        {
            id: 'pet_thatdaitoi_luoibieng_1',
            name: 'Acedia - Linh Thú Lười Biếng',
            type: 'pet',
            price: 0,
            isNonCoin: true,
            eventOnly: true,
            tag: 'Thất Đại Tội',
            value: 'assets/pet/thất đại tội/lười biếng/lười biếng i.png',
            isIcon: false,
            petEffect: 'seven-sins-sloth-magic',
            disableClickEffect: true,

            acediaRole: 'Linh thú ngủ giới',
            acediaLore: 'Kẻ canh giữ giấc ngủ vĩnh hằng',
            acediaGlyph: '☾',
            acediaIndex: 'VII·FAMILIAR'
        },
        {
            id: 'theme_thatdaitoi_acedia_dream',
            name: 'Mộng Điện Trì Hoãn',
            type: 'theme',
            price: 0,
            isNonCoin: true,
            eventOnly: true,
            tag: 'Thất Đại Tội',
            value: 'theme-seven-sins-acedia',
            customIcon: '⌛',

            acediaRole: 'Mộng điện tối thượng',
            acediaLore: 'Cung điện nơi thời gian từ chối bước tiếp',
            acediaGlyph: '⌛',
            acediaIndex: 'VII·PALACE'
        },
        {
            id: 'effect_thatdaitoi_acedia_domain',
            name: 'Thất Trọng Mộng Vực',
            type: 'effect',
            price: 0,
            isNonCoin: true,
            eventOnly: true,
            tag: 'Thất Đại Tội',
            value: 'effect_thatdaitoi_acedia_domain',
            customIcon: 'Ⅶ',

            acediaRole: 'Mộng vực bảy tầng',
            acediaLore: 'Bảy tầng giấc mơ đè nặng lên thực tại',
            acediaGlyph: 'Ⅶ',
            acediaIndex: 'VII·DOMAIN'
        },
        {
            id: 'pet_he_mat_troi_trai_dat',
            name: 'Linh Thú Trái Đất',
            type: 'pet',
            price: 400,
            isNonCoin: false,
            tag: 'Hệ Mặt Trời',
            value: 'assets/pet/Trái Đất.png',
            isIcon: false,
            petEffect: 'earth-guardian-magic',
            disableClickEffect: true
        },
        {
            id: 'theme_he_mat_troi_sinh_quyen',
            name: 'Quỹ Đạo Sinh Quyển',
            type: 'theme',
            price: 705,
            isNonCoin: false,
            tag: 'Hệ Mặt Trời',

            value: 'theme-solar-biosphere',
            customIcon: '🌞',
            annualSale: {
                startMonth: 4,
                startDay: 22,
                endMonth: 4,
                endDay: 25
            }
        },
        {
            id: 'effect_he_mat_troi_nhat_trieu_gaia',
            name: 'Nhật Triều Gaia',
            type: 'effect',
            price: 710,
            isNonCoin: false,
            tag: 'Hệ Mặt Trời',
            value: 'effect_he_mat_troi_nhat_trieu_gaia',
            customIcon: '◉',
            annualSale: {
                startMonth: 4,
                startDay: 22,
                endMonth: 4,
                endDay: 25
            }
        },
        {
            id: 'pet_sinh_nhat_2026',
            name: 'Bé Rắn Phúc Lộc 2026',
            type: 'pet',
            price: 0,
            isNonCoin: true,
            eventOnly: true,
            rewardSource: 'birthday_coin',
            rewardLabel: 'Xu Sinh Nhật',
            birthdayYear: 2026,
            tag: 'Sinh nhật 2026',
            value: 'assets/pet/sinh nhật/sinh nhật 2026.png',
            isIcon: false,
            petEffect: 'birthday-serpent-2026-magic'
        },
        {
            id: 'theme_sinh_nhat_tiec_ngot_2026',
            name: 'Bữa Tiệc Ngọt 2026',
            type: 'theme',

            price: 0,
            isNonCoin: true,
            eventOnly: true,

            rewardSource: 'birthday_coin',
            rewardLabel: 'Xu Sinh Nhật',

            /* Cho phép đổi bằng Xu Đặc Biệt */
            specialBirthdayCoinEligible: true,

            birthdayYear: 2026,
            tag: 'Sinh nhật 2026',

            value: 'theme-birthday-sweet-2026',
            customIcon: '🎂'
        },
        {
            id: 'effect_sinh_nhat_than_an_phuc_loc_2026',
            name: 'Thần Ấn Phúc Lộc 2026',
            type: 'effect',

            price: 0,
            isNonCoin: true,
            eventOnly: true,

            rewardSource: 'birthday_coin',
            rewardLabel: 'Xu Sinh Nhật',

            /* Cho phép dùng cả Xu Đặc Biệt */
            specialBirthdayCoinEligible: true,

            birthdayYear: 2026,
            tag: 'Sinh nhật 2026',

            value:
                'effect_sinh_nhat_than_an_phuc_loc_2026',

            customIcon: '✦'
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

    static getAnnualSaleState(item, now = new Date()) {
        const schedule = item?.annualSale;

        // Vật phẩm bình thường không bị giới hạn ngày bán
        if (!schedule) {
            return {
                hasAnnualSale: false,
                isOpen: true,
                start: null,
                end: null,
                nextStart: null,
                nextOpenLabel: '',
                windowLabel: ''
            };
        }

        const year = now.getFullYear();

        const start = new Date(
            year,
            schedule.startMonth - 1,
            schedule.startDay,
            0,
            0,
            0,
            0
        );

        const end = new Date(
            year,
            schedule.endMonth - 1,
            schedule.endDay,
            23,
            59,
            59,
            999
        );

        const isOpen =
            now.getTime() >= start.getTime() &&
            now.getTime() <= end.getTime();

        const nextStart =
            now.getTime() < start.getTime()
                ? start
                : new Date(
                    year + 1,
                    schedule.startMonth - 1,
                    schedule.startDay,
                    0,
                    0,
                    0,
                    0
                );

        const padNumber = number =>
            String(number).padStart(2, '0');

        const formatFullDate = date => {
            return [
                padNumber(date.getDate()),
                padNumber(date.getMonth() + 1),
                date.getFullYear()
            ].join('/');
        };

        const windowLabel =
            `${padNumber(schedule.startDay)}/${padNumber(schedule.startMonth)}` +
            `–${padNumber(schedule.endDay)}/${padNumber(schedule.endMonth)}`;

        return {
            hasAnnualSale: true,
            isOpen,
            start,
            end,
            nextStart,
            nextOpenLabel: formatFullDate(nextStart),
            windowLabel
        };
    }

    /*
     * Cổng mua vật phẩm.
     * Ngăn giao diện giới hạn bị mua ngoài ngày mở bán.
     */
    static buyItemSafely(itemId, isUpgrade = false) {
        const item = this.getItemById(itemId);

        if (!item) {
            console.error(
                `[StoreManager] Không tìm thấy vật phẩm: ${itemId}`
            );
            return;
        }

        const saleState =
            this.getAnnualSaleState(item);

        if (
            saleState.hasAnnualSale &&
            !saleState.isOpen
        ) {
            window.alert(
                `${item.name} chỉ mở bán từ ` +
                `${saleState.windowLabel} hằng năm.\n\n` +
                `Đợt mở bán tiếp theo: ${saleState.nextOpenLabel}.`
            );

            return;
        }

        const purchaseHandler =
            typeof window.buyItem === 'function'
                ? window.buyItem
                : (
                    typeof buyItem === 'function'
                        ? buyItem
                        : null
                );

        if (!purchaseHandler) {
            console.error(
                '[StoreManager] Không tìm thấy hàm buyItem().'
            );
            return;
        }

        purchaseHandler(itemId, isUpgrade);
    }

    /*
     * Dùng thử cũng chỉ hoạt động trong thời gian mở bán.
     */
    static trialItemSafely(itemId) {
        const item = this.getItemById(itemId);

        if (!item) {
            console.error(
                `[StoreManager] Không tìm thấy vật phẩm: ${itemId}`
            );
            return;
        }

        const saleState =
            this.getAnnualSaleState(item);

        if (
            saleState.hasAnnualSale &&
            !saleState.isOpen
        ) {
            window.alert(
                `${item.name} hiện chưa mở bán.\n\n` +
                `Thời gian: ${saleState.windowLabel} hằng năm.\n` +
                `Mở lại: ${saleState.nextOpenLabel}.`
            );

            return;
        }

        const trialHandler =
            typeof window.trialItem === 'function'
                ? window.trialItem
                : (
                    typeof trialItem === 'function'
                        ? trialItem
                        : null
                );

        if (!trialHandler) {
            console.error(
                '[StoreManager] Không tìm thấy hàm trialItem().'
            );
            return;
        }

        trialHandler(itemId);
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
        const annualSaleState =
            this.getAnnualSaleState(item);

        /*
         * Người đã sở hữu vẫn có thể mặc giao diện quanh năm.
         * Chỉ khóa người chưa sở hữu.
         */
        const annualSaleLocked =
            annualSaleState.hasAnnualSale &&
            !annualSaleState.isOpen &&
            !isOwned;
        const tagClassMap = {
            'Lord of the Mysteries': 'tag-lotm',
            'Truyền thuyết': 'tag-truyen-thuyet',
            'Sao thủy': 'tag-sao-thuy',
            'Cổ tích': 'tag-co-tich',
            'Đời sống': 'tag-doi-song',
            'Ban đêm': 'tag-ban-dem',
            'Ban ngày': 'tag-ban-ngay',
            'Doraemon': 'tag-doraemon',
            'Hội họa': 'tag-hoi-hoa',
            'Thất Đại Tội': 'tag-that-dai-toi',
            'Hệ Mặt Trời': 'tag-he-mat-troi',
            'Sinh nhật 2026': 'tag-sinh-nhat-2026',
        };

        let tagClass = tagClassMap[item.tag] || 'tag-normal';
        let actionButton = '';
        let trialButton = '';

        const normalizedBirthdayTag =
            String(item.tag || '')
                .normalize('NFD')
                .replace(
                    /[\u0300-\u036f]/g,
                    ''
                )
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .trim()
                .toLowerCase();

        const specialBirthdayCoinEligible =
            item
                .specialBirthdayCoinEligible !==
            false &&
            (
                normalizedBirthdayTag ===
                'sinh nhat' ||
                normalizedBirthdayTag
                    .startsWith(
                        'sinh nhat '
                    )
            );

        const specialBirthdayCoinBalance =
            Number(
                window
                    .studentSpecialBirthdayCoinCount
            ) || 0;

        // --- LOGIC 1: XỬ LÝ VẬT PHẨM BỊ GIÁO VIÊN KHÓA SỬ DỤNG VÀ MUA ---
        if (item.isLocked) {
            trialButton =
                `<button class="btn-preview disabled" disabled>` +
                `🔒 Đã bị khóa` +
                `</button>`;

            actionButton =
                `<button class="btn-equip disabled" disabled ` +
                `style="background: #e11d48; color: white; border: none; ` +
                `cursor: not-allowed; box-shadow: none;">` +
                `🔒 Giáo viên đã khóa` +
                `</button>`;
        }

        /*
         * Vật phẩm giới hạn Hệ Mặt Trời
         */
        else if (annualSaleLocked) {
            trialButton = `
        <button
            class="btn-preview disabled"
            disabled
            title="Chỉ dùng thử trong thời gian mở bán"
        >
            🚫 Thử từ ${annualSaleState.windowLabel}
        </button>
    `;

            actionButton = `
        <button
            class="btn-equip active annual-sale-locked"
            disabled
            title="Vật phẩm giới hạn Ngày Trái Đất"
        >
            🌍 Mở lại ${annualSaleState.nextOpenLabel}
        </button>
    `;
        }

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
                if (
                    item.rewardSource ===
                    'birthday_coin' ||
                    specialBirthdayCoinEligible
                ) {
                    const rewardButtons = [];

                    // Xu Sinh Nhật đúng năm.
                    if (
                        item.rewardSource ===
                        'birthday_coin'
                    ) {
                        const birthdayYear =
                            Number(
                                item.birthdayYear
                            );

                        const birthdayBalance =
                            Number(
                                window
                                    .studentBirthdayCoins &&
                                window
                                    .studentBirthdayCoins[
                                String(
                                    birthdayYear
                                )
                                ]
                            ) || 0;

                        if (
                            birthdayBalance > 0 &&
                            typeof window
                                .redeemBirthdayItem ===
                            'function'
                        ) {
                            rewardButtons.push(`
                <button
                    class="
                        btn-buy
                        birthday-coin-reward
                    "
                    onclick="
                        window.redeemBirthdayItem(
                            '${item.id}',
                            ${birthdayYear}
                        )
                    "
                >
                    🎂 Đổi Xu Sinh Nhật
                    ${birthdayYear}
                </button>
            `);
                        } else {
                            rewardButtons.push(`
                <button
                    class="
                        btn-buy
                        birthday-coin-reward
                    "
                    disabled
                >
                    🎂 Cần Xu Sinh Nhật
                    ${birthdayYear}
                </button>
            `);
                        }
                    }

                    // Xu Đặc Biệt không phân biệt năm.
                    if (
                        specialBirthdayCoinEligible
                    ) {
                        if (
                            specialBirthdayCoinBalance >
                            0 &&
                            typeof window
                                .redeemSpecialBirthdayItem ===
                            'function'
                        ) {
                            rewardButtons.push(`
                <button
                    class="btn-buy"
                    onclick="
                        window.redeemSpecialBirthdayItem(
                            '${item.id}'
                        )
                    "
                    style="
                        background:
                            linear-gradient(
                                135deg,
                                #8b5cf6,
                                #ec4899
                            );
                    "
                >
                    ✨ Đổi 1 Xu Đặc Biệt
                </button>
            `);
                        } else {
                            rewardButtons.push(`
                <button
                    class="btn-buy"
                    disabled
                    style="
                        background:#cbd5e1;
                        color:#64748b;
                    "
                >
                    ✨ Cần Xu Đặc Biệt
                </button>
            `);
                        }
                    }

                    actionButton = `
        <div style="
            display:flex;
            flex-direction:column;
            gap:8px;
        ">
            ${rewardButtons.join('')}
        </div>
    `;
                } else if (item.eventOnly === true) {
                    actionButton = `
            <button
                class="btn-buy event-only"
                disabled
                title="Vật phẩm này chỉ được trao từ sự kiện"
            >
                🎁 Chỉ nhận từ sự kiện
            </button>
        `;
                } else if (item.isNonCoin) {
                    // Nếu giáo viên đặt giá lớn hơn 0 thì mở bán giới hạn
                    if (item.price > 0) {
                        actionButton = `
                <button
                    class="btn-buy"
                    onclick="StoreManager.buyItemSafely('${item.id}')"
                >
                    🛒 Mua giới hạn: ${item.price} 🪙
                </button>
            `;
                    } else {
                        actionButton = `
                <button
                    class="btn-buy"
                    onclick="StoreManager.buyItemSafely('${item.id}')"
                >
                    🎁 Nhận được từ sự kiện
                </button>
            `;
                    }
                } else {
                    actionButton = `
            <button
                class="btn-buy"
                onclick="StoreManager.buyItemSafely('${item.id}')"
            >
                🛒 Mua đứt: ${item.price} 🪙
            </button>
        `;
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
                actionButton = `<button class="btn-buy upgrade" onclick="StoreManager.buyItemSafely('${item.id}', true)">💎 Nâng cấp vĩnh viễn: ${finalPrice} 🪙</button>`;
            } else if (!isOwned) {
                let trialPrice = item.price / 2;
                trialButton = `<button class="btn-preview" onclick="StoreManager.trialItemSafely('${item.id}')">⏳ Dùng thử 1 ngày: ${trialPrice} 🪙</button>`;
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

        /* =========================================================
   NHÓM CARD CỬA HÀNG ĐẶC BIỆT
   ========================================================= */

        const nyxTrinityIds = new Set([
            'pet_truyenthuyet_nyx',
            'effect_truyenthuyet_nyx_domain',
            'theme_truyenthuyet_celestial'
        ]);

        const amonTrinityIds = new Set([
            'pet_lotm_amon',
            'effect_lotm_amon',
            'theme_lotm_mysteries'
        ]);

        const shizukaTrinityIds = new Set([
            'pet_doraemon_shizuka',
            'theme_doraemon_childhood',
            'effect_doraemon_school_memories'
        ]);

        const sevenSinsSlothIds = new Set([
            'pet_thatdaitoi_luoibieng_1',
            'theme_thatdaitoi_acedia_dream',
            'effect_thatdaitoi_acedia_domain'
        ]);

        const birthday2026Ids = new Set([
            'pet_sinh_nhat_2026',
            'theme_sinh_nhat_tiec_ngot_2026',
            'effect_sinh_nhat_than_an_phuc_loc_2026'
        ]);

        const acediaCardVariantMap = Object.freeze({
            pet_thatdaitoi_luoibieng_1: 'familiar',
            theme_thatdaitoi_acedia_dream: 'palace',
            effect_thatdaitoi_acedia_domain: 'domain'
        });

        const acediaVariant =
            acediaCardVariantMap[item.id] || '';

        const acediaRelicHTML = acediaVariant
            ? `
                <div
                    class="acedia-card-architecture"
                    aria-hidden="true"
                >
                    <span
                        class="acedia-card-pillar pillar-left"
                    ></span>

                    <span
                        class="acedia-card-pillar pillar-right"
                    ></span>

                    <span class="acedia-card-arch"></span>
                    <span class="acedia-card-hourglass"></span>

                    <span
                        class="acedia-card-chain chain-left"
                    ></span>

                    <span
                        class="acedia-card-chain chain-right"
                    ></span>
                </div>

                <div class="acedia-relic-header">
                    <span class="acedia-relic-number">
                        Ⅶ
                    </span>

                    <span class="acedia-relic-order">
                        ORDO ACEDIAE
                    </span>

                    <span class="acedia-relic-index">
                        ${item.acediaIndex || 'VII'}
                    </span>
                </div>

                <div class="acedia-relic-lore">
                    <span class="acedia-relic-glyph">
                        ${item.acediaGlyph || '☾'}
                    </span>

                    <span class="acedia-relic-copy">
                        <b>
                            ${item.acediaRole ||
            'Di vật Lười Biếng'}
                        </b>

                        <small>
                            ${item.acediaLore ||
            'Thời gian ngủ quên trong mộng điện.'}
                        </small>
                    </span>
                </div>
            `
            : '';

        const cardClasses = [
            'store-item-card'
        ];

        let specialCardGroup = '';
        let isThemeImmune = false;


        /* Bộ ba Nyx */
        if (nyxTrinityIds.has(item.id)) {
            cardClasses.push(
                'store-card-nyx-trinity',
                'store-theme-locked',
                'ui-theme-immune'
            );

            specialCardGroup = 'nyx-trinity';
            isThemeImmune = true;
        }


        /* Bộ ba Amon */
        if (amonTrinityIds.has(item.id)) {
            cardClasses.push(
                'store-card-amon-trinity',
                'store-theme-locked',
                'ui-theme-immune'
            );

            specialCardGroup = 'amon-trinity';
            isThemeImmune = true;
        }

        /* Bộ ba Shizuka */
        if (shizukaTrinityIds.has(item.id)) {
            cardClasses.push(
                'store-card-shizuka-trinity',
                'store-theme-locked',
                'ui-theme-immune'
            );

            specialCardGroup = 'shizuka-trinity';
            isThemeImmune = true;
        }

        /* Thẻ riêng Thất Đại Tội — Lười Biếng */
        if (sevenSinsSlothIds.has(item.id)) {
            cardClasses.push(
                'store-card-seven-sins-sloth',
                `store-card-acedia-${acediaVariant}`,
                'store-theme-locked',
                'ui-theme-immune'
            );

            specialCardGroup = 'seven-sins-sloth';
            isThemeImmune = true;
        }

        /* Thẻ riêng Sinh Nhật 2026 */
        if (birthday2026Ids.has(item.id)) {
            cardClasses.push(
                'store-card-birthday-2026',
                'store-theme-locked',
                'ui-theme-immune'
            );

            specialCardGroup = 'birthday-2026';
            isThemeImmune = true;
        }

        const annualSaleBadge =
            annualSaleState.hasAnnualSale
                ? `
            <div class="
                annual-sale-chip
                ${annualSaleState.isOpen
                    ? 'is-open'
                    : 'is-closed'
                }
            ">
                <strong>
                    ${annualSaleState.isOpen
                    ? '● ĐANG MỞ BÁN'
                    : '◌ GIỚI HẠN HẰNG NĂM'
                }
                </strong>

                <small>
                    ${annualSaleState.windowLabel}
                </small>
            </div>
        `
                : '';

        return `
    <div
        class="${cardClasses.join(' ')}"

        data-item-id="${item.id}"
        data-type="${item.type}"

        data-special-card="${specialCardGroup}"
        data-acedia-variant="${acediaVariant}"

        data-theme-immune="${isThemeImmune
                ? 'true'
                : 'false'
            }"

        style="${item.isLocked
                ? 'opacity: 0.75; filter: grayscale(0.4); border: 1px solid rgba(225,29,72,0.3);'
                : ''
            }"
    >
        <div class="card-glow"></div>

        ${acediaRelicHTML}
        ${annualSaleBadge}

        <div class="item-tag ${tagClass}">
            <span>${item.tag}</span>
        </div>

        <div class="item-icon-wrapper">
            ${iconHTML}
        </div>

        <div class="item-info">
            <h4 class="item-name">
                ${item.name}
            </h4>

            <span class="item-type-label">
                ${typeName}
            </span>
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