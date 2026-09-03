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
            value: 'assets/pet/sinh nhật/2026/sinh nhật 2026.png',
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
        },
        {
            id: 'pet_he_mat_troi_sao_tho',
            name: 'Linh Thú Sao Thổ',
            type: 'pet',
            price: 550,
            isNonCoin: false,
            tag: 'Hệ Mặt Trời',
            value: 'assets/pet/Sao Thổ.png',
            isIcon: false,
            petEffect: 'saturn-cassini-magic',
            disableClickEffect: true
        },
        {
            id: 'theme_he_mat_troi_vanh_dai_cassini',
            name: 'Đài Quan Sát Cassini',
            type: 'theme',
            price: 550,
            isNonCoin: false,
            tag: 'Hệ Mặt Trời',
            value: 'theme-saturn-observatory',
            customIcon: '🪐',
            annualSaleIcon: '🪐',
            annualSaleTitle:
                'Mở bán duy nhất ngày 30/07 hằng năm',
            annualSale: {
                startMonth: 7,
                startDay: 30,
                endMonth: 7,
                endDay: 30
            }
        },
        {
            id: 'effect_he_mat_troi_dai_trieu_cassini',
            name: 'Đại Triều Vành Đai Cassini',
            type: 'effect',
            price: 600,
            isNonCoin: false,
            tag: 'Hệ Mặt Trời',
            value: 'effect_he_mat_troi_dai_trieu_cassini',
            customIcon: '◉',
            annualSaleIcon: '🪐',
            annualSaleTitle:
                'Mở bán duy nhất ngày 30/07 hằng năm',
            annualSale: {
                startMonth: 7,
                startDay: 30,
                endMonth: 7,
                endDay: 30
            }
        },
        {
            id: 'pet_doisong_conmua',
            name: 'Mèo Nhỏ Ngày Mưa',
            type: 'pet',
            price: 750,
            isNonCoin: false,
            tag: 'Cơn mưa',
            value: 'assets/pet/đời sống/thời tiết/mưa.png',
            isIcon: false,
            petEffect: 'rainy-day-cat-magic',
            disableClickEffect: true // Dùng hiệu ứng nhấn riêng, không gọi hiệu ứng cũ
        },
        {
            id: 'theme_doisong_mua_sao',
            name: 'Đài Quan Trắc Mưa Sao',
            type: 'theme',
            price: 700,
            isNonCoin: false,
            tag: 'Cơn mưa',
            value: 'theme-rain-cosmos',
            customIcon: '🛰️'
        },
        {
            id: 'effect_doisong_mua_ngoai_o_cua',
            name: 'Mưa Ngoài Ô Cửa',
            type: 'effect',
            price: 600,
            isNonCoin: false,
            tag: 'Cơn mưa',
            value: 'effect_doisong_mua_ngoai_o_cua',
            customIcon: '🌧️'
        },
        {
            id: 'pet_premium_mua_xuan',
            name: 'Tiểu Hoa Mộng',
            type: 'pet',
            price: 750,
            isNonCoin: false,
            tag: 'Mùa xuân',
            value: 'assets/Premium/Bốn mùa/mua-xuan-chibi.png',
            isIcon: false,
            petEffect: 'spring-vintage-goddess-magic',
            disableClickEffect: true,

            // ==========================================
            // MỞ BÁN THEO MÙA
            // Chỉ ngày 01 → 05 của tháng 3, 4 và 5
            // ==========================================
            annualSaleIcon: '🌸',

            annualSaleTitle:
                'Chỉ mở bán ngày 01–05 của tháng 03, 04 và 05 hằng năm',

            annualSaleWindows: [
                {
                    startMonth: 3,
                    startDay: 1,
                    endMonth: 3,
                    endDay: 5
                },
                {
                    startMonth: 4,
                    startDay: 1,
                    endMonth: 4,
                    endDay: 5
                },
                {
                    startMonth: 5,
                    startDay: 1,
                    endMonth: 5,
                    endDay: 5
                }
            ]
        },
        {
            id: 'effect_premium_mua_xuan',
            name: 'Xuân Tửu Hoa Viên',
            type: 'effect',
            price: 700,
            isNonCoin: false,
            tag: 'Mùa xuân',
            value: 'effect_premium_mua_xuan',
            customIcon: '🍇',

            // ==========================================
            // HIỆU ỨNG GIỚI HẠN MÙA XUÂN
            // Chỉ ngày 01 → 05 của tháng 3, 4 và 5
            // Đồng bộ lịch mở bán với Nữ Thần Mùa Xuân
            // ==========================================
            annualSaleIcon: '🌸',

            annualSaleTitle:
                'Chỉ mở bán ngày 01–05 của tháng 03, 04 và 05 hằng năm',

            annualSaleWindows: [
                {
                    startMonth: 3,
                    startDay: 1,
                    endMonth: 3,
                    endDay: 5
                },
                {
                    startMonth: 4,
                    startDay: 1,
                    endMonth: 4,
                    endDay: 5
                },
                {
                    startMonth: 5,
                    startDay: 1,
                    endMonth: 5,
                    endDay: 5
                }
            ]
        },
        {
            id: 'theme_mua_xuan_thanh_minh',
            name: 'Thanh Minh Xuân Phổ',
            type: 'theme',
            price: 700,
            isNonCoin: false,
            tag: 'Mùa xuân',
            value: 'theme-spring-celadon-almanac',
            customIcon: '🌿',

            // ==========================================
            // GIAO DIỆN MÙA XUÂN GIỚI HẠN
            // Chỉ ngày 01 → 05 của tháng 3, 4 và 5
            // Người đã sở hữu vẫn được trang bị quanh năm.
            // ==========================================
            annualSaleIcon: '🌱',
            annualSaleTitle:
                'Chỉ mở bán ngày 01–05 của tháng 03, 04 và 05 hằng năm',

            annualSaleWindows: [
                {
                    startMonth: 3,
                    startDay: 1,
                    endMonth: 3,
                    endDay: 5
                },
                {
                    startMonth: 4,
                    startDay: 1,
                    endMonth: 4,
                    endDay: 5
                },
                {
                    startMonth: 5,
                    startDay: 1,
                    endMonth: 5,
                    endDay: 5
                }
            ]
        },
        {
            id: 'frame_premium_mua_xuan_hoa_mong',
            name: 'Hoa Mộng · Vạn Sinh Chi Hoàn',
            type: 'frame',
            price: 400,
            isNonCoin: false,
            tag: 'Mùa xuân',

            value: 'assets/Premium/Bốn mùa/khung-xuan.png',
            isIcon: false,

            frameEffect: 'spring-dream-ring',

            // Chỉ mở bán ngày 01–05 tháng 3, 4 và 5
            annualSaleIcon: '🌸',

            annualSaleTitle:
                'Chỉ mở bán ngày 01–05 của tháng 03, 04 và 05 hằng năm',

            annualSaleWindows: [
                {
                    startMonth: 3,
                    startDay: 1,
                    endMonth: 3,
                    endDay: 5
                },
                {
                    startMonth: 4,
                    startDay: 1,
                    endMonth: 4,
                    endDay: 5
                },
                {
                    startMonth: 5,
                    startDay: 1,
                    endMonth: 5,
                    endDay: 5
                }
            ]
        },
        {
            id: 'background_premium_mua_xuan_hoa_mong',
            name: 'Hoa Mộng · Vạn Sinh Thần Viên',
            type: 'background',
            price: 150,
            isNonCoin: false,
            tag: 'Mùa xuân',

            value: 'assets/Premium/Bốn mùa/nen-xuan.png',
            isIcon: false,

            // Chỉ mở bán ngày 01–05 tháng 3, 4 và 5
            annualSaleIcon: '🌸',

            annualSaleTitle:
                'Chỉ mở bán ngày 01–05 của tháng 03, 04 và 05 hằng năm',

            annualSaleWindows: [
                {
                    startMonth: 3,
                    startDay: 1,
                    endMonth: 3,
                    endDay: 5
                },
                {
                    startMonth: 4,
                    startDay: 1,
                    endMonth: 4,
                    endDay: 5
                },
                {
                    startMonth: 5,
                    startDay: 1,
                    endMonth: 5,
                    endDay: 5
                }
            ]
        },
        {
            id: 'pet_quoc_khanh_chibi_1',
            name: 'Việt Diệu · Sao Vàng Nhí',
            type: 'pet',

            price: 0,
            isNonCoin: true,
            eventOnly: true,

            tag: '2/9',
            tags: ['2/9', 'Quốc khánh'],

            value: 'assets/Premium/quốc khánh/chibi1.png',
            isIcon: false,

            petEffect: 'national-day-chibi-star-magic',
            disableClickEffect: true,

            eventTier: 'event-national-day',

            rewardSource: 'lich_su_hao_hung',
            rewardLabel: 'Sự kiện Lịch sử hào hùng'
        },
        {
            id: 'effect_quoc_khanh_viet_dieu_non_song',
            name: 'Việt Diệu · Hào Quang Non Sông',
            type: 'effect',

            price: 0,
            isNonCoin: true,
            eventOnly: true,

            tag: '2/9',
            tags: ['2/9', 'Quốc khánh'],

            value: 'effect_quoc_khanh_viet_dieu_non_song',
            customIcon: '★',

            eventTier: 'event-national-day',
            effectScale: 'grand',

            rewardSource: 'lich_su_hao_hung',
            rewardLabel: 'Sự kiện Lịch sử hào hùng'
        },
        {
            id: 'theme_quoc_khanh_viet_dieu_hong_ky',
            name: 'Việt Diệu · Hồng Kỳ Tân Chương',
            type: 'theme',

            price: 0,
            isNonCoin: true,
            eventOnly: true,

            tag: '2/9',
            tags: ['2/9', 'Quốc khánh'],

            value: 'theme-viet-dieu-hong-ky',
            customIcon: '🇻🇳',

            eventTier: 'event-national-day',

            rewardSource: 'lich_su_hao_hung',
            rewardLabel: 'Sự kiện Lịch sử hào hùng'
        },
        {
            id: 'frame_quoc_khanh_viet_dieu_quoc_an',
            name: 'Việt Nam · Vòng Sao Non Sông',
            type: 'frame',

            price: 0,
            isNonCoin: true,
            eventOnly: true,

            tag: '2/9',
            tags: ['2/9', 'Quốc khánh'],

            value: 'assets/Premium/quốc khánh/khung1.png',
            isIcon: false,

            frameEffect: 'national-day-viet-dieu-frame',

            eventTier: 'event-national-day',

            rewardSource: 'lich_su_hao_hung',
            rewardLabel: 'Sự kiện Lịch sử hào hùng'
        },
        {
            id: 'background_quoc_khanh_son_ha_ruc_sang',
            name: 'Việt Nam · Sơn Hà Rực Sáng',
            type: 'background',

            price: 0,
            isNonCoin: true,
            eventOnly: true,

            tag: '2/9',
            tags: ['2/9', 'Quốc khánh'],

            value: 'assets/Premium/quốc khánh/nen1.png',
            isIcon: false,

            eventTier: 'event-national-day',

            rewardSource: 'lich_su_hao_hung',
            rewardLabel: 'Sự kiện Lịch sử hào hùng'
        },
        {
            id: 'pet_tamon_bside_chibi_1',
            name: 'Tiểu Quỷ Sân Khấu',
            type: 'pet',

            price: 850,
            isNonCoin: false,

            tag: "Tamon's B-Side",
            tags: ["Tamon's B-Side"],

            value: 'assets/Premium/Tamon/tamon-chibi1.png',
            asset: 'assets/Premium/Tamon/tamon-chibi1.png',
            isIcon: false,

            // Hiệu ứng RIÊNG của vật phẩm mới, không tái dùng effect Tamon cũ.
            petEffect: 'tamon-bside-chibi-signal-magic',
            disableClickEffect: true
        },
        {
            id: 'theme_tamon_bside_backstage',
            name: "Hậu Trường Nhiễu Sóng",
            type: 'theme',

            price: 800,
            isNonCoin: false,

            tag: "Tamon's B-Side",
            tags: ["Tamon's B-Side"],

            value: 'theme-tamon-bside-backstage',
            customIcon: '◈',

            // Theme riêng: không tái dùng effect / class của các giao diện Tamon khác.
            themeEffect: 'tbtheme1-backstage-signal-field'
        },
        {
            id: 'effect_tamon_bside_spectrum_break',
            name: 'Phổ Nhiễu B-Side',
            type: 'effect',

            price: 900,
            isNonCoin: false,

            tag: "Tamon's B-Side",
            tags: ["Tamon's B-Side"],

            value: 'effect_tamon_bside_spectrum_break',
            customIcon: '≋',

            // Effect toàn web RIÊNG, namespace tbfx1-*; không tái dùng effect Tamon cũ.
            effectNamespace: 'tbfx1-spectrum-break'
        },
        {
            id: 'frame_tamon_bside_signal_ring',
            name: 'B-Mask · Neon Heart',
            type: 'frame',

            price: 250,
            isNonCoin: false,

            tag: "Tamon's B-Side",
            tags: ["Tamon's B-Side"],

            value: 'assets/Premium/Tamon/tamon-khung1.png',
            isIcon: false,

            // Khung avatar riêng của bộ Tamon's B-Side.
            // Vị trí/size lấy theo chuẩn khung Premium Mùa Xuân.
            frameEffect: 'tamon-bside-signal-ring'
        },
        {
            id: 'background_tamon_bside_stage_signal',
            name: 'Tamon · Midnight Idol Room',
            type: 'background',

            price: 150,
            isNonCoin: false,

            tag: "Tamon's B-Side",
            tags: ["Tamon's B-Side"],

            value: 'assets/Premium/Tamon/tamon-nen1.png',
            isIcon: false,

            // Nền tĩnh riêng. WebBackgroundManager hiện tại tự dùng:
            // cover + center center + no-repeat + fixed.
            backgroundFit: 'cover',
            backgroundPosition: 'center center'
        },
        {
            id: 'pet_truyenthuyet_nyx_chibi_1',

            name: 'NYX · Tiểu Dạ Tinh Linh',

            type: 'pet',

            price: 1700,
            isNonCoin: false,

            /*
             * Dùng CHÍNH XÁC tag của:
             * Nyx - Nữ Thần Màn Đêm
             */
            tag: 'Truyền thuyết',

            value:
                'assets/Premium/Thần thoại/nyx-chibi1.png',

            asset:
                'assets/Premium/Thần thoại/nyx-chibi1.png',

            isIcon: false,

            /*
             * Effect HOÀN TOÀN RIÊNG.
             * Không phải mythic-nyx-night-magic.
             */
            petEffect:
                'nyx-little-night-spirit-magic',

            /*
             * Không chạy click effect mặc định,
             * vì pet có kỹ năng toàn màn hình riêng.
             */
            disableClickEffect: true
        },
        {
            id: 'theme_truyenthuyet_thanh_dien_nguyet_da',
            name: 'Thánh Điện Nguyệt Dạ',
            type: 'theme',

            price: 1700,
            isNonCoin: false,

            tag: 'Truyền thuyết',

            value: 'theme-nyx-moon-sanctum',

            customIcon: '☾'
        },
        {
            id: 'effect_truyenthuyet_da_trieu_tinh_nguyet',
            name: 'Dạ Triều Tinh Nguyệt',
            type: 'effect',

            price: 1700,
            isNonCoin: false,

            tag: 'Truyền thuyết',

            value: 'effect_truyenthuyet_da_trieu_tinh_nguyet',
            customIcon: '☽'
        },
        {
            id: 'frame_truyenthuyet_nyx_hac_nguyet_chi_hoan',

            name: 'Vương Miện Vĩnh Dạ',

            type: 'frame',

            price: 250,
            isNonCoin: false,

            tag: 'Truyền thuyết',

            value:
                'assets/Premium/Thần thoại/nyx-khung1.png',

            isIcon: false,

            frameEffect:
                'nyx-hac-nguyet-frame'
        },
        {
            id: 'background_truyenthuyet_nyx_vinh_da_thien_mac',

            name: 'Thánh Điện Nguyệt Dạ',

            type: 'background',

            price: 150,
            isNonCoin: false,

            tag: 'Truyền thuyết',

            value:
                'assets/Premium/Thần thoại/nyx-nen1.png',

            isIcon: false
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

    static getAnnualSaleState(item, now = new Date()) {
        const schedules =
            Array.isArray(item?.annualSaleWindows) &&
                item.annualSaleWindows.length
                ? item.annualSaleWindows
                : (
                    item?.annualSale
                        ? [item.annualSale]
                        : []
                );

        // Không có lịch giới hạn = vật phẩm bán bình thường
        if (!schedules.length) {
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

        const nowTime = now.getTime();
        const currentYear = now.getFullYear();

        const padNumber = number =>
            String(number).padStart(2, '0');

        const formatFullDate = date => {
            return [
                padNumber(date.getDate()),
                padNumber(date.getMonth() + 1),
                date.getFullYear()
            ].join('/');
        };

        /*
         * Tạo các đợt mở bán của:
         * - năm hiện tại
         * - năm tiếp theo
         *
         * Nhờ vậy sau 05/05 có thể tự nhảy
         * sang 01/03 năm sau.
         */
        const windows = [];

        [
            currentYear,
            currentYear + 1
        ].forEach(year => {

            schedules.forEach(schedule => {
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

                windows.push({
                    schedule,
                    start,
                    end
                });
            });

        });

        windows.sort(
            (a, b) =>
                a.start.getTime() -
                b.start.getTime()
        );

        // ==========================================
        // KIỂM TRA CÓ ĐANG TRONG ĐỢT MỞ BÁN KHÔNG
        // ==========================================

        const activeWindow =
            windows.find(window => {
                return (
                    nowTime >= window.start.getTime() &&
                    nowTime <= window.end.getTime()
                );
            });

        const isOpen = Boolean(activeWindow);

        // ==========================================
        // TÌM ĐỢT MỞ BÁN TIẾP THEO
        // ==========================================

        const nextWindow =
            windows.find(window => {
                return window.start.getTime() > nowTime;
            }) || null;

        /*
         * Chuỗi hiển thị:
         *
         * 01–05/03 • 01–05/04 • 01–05/05
         */
        const windowLabel =
            schedules
                .map(schedule => {
                    const sameMonth =
                        schedule.startMonth ===
                        schedule.endMonth;

                    if (sameMonth) {
                        return (
                            `${padNumber(schedule.startDay)}` +
                            `–${padNumber(schedule.endDay)}` +
                            `/${padNumber(schedule.startMonth)}`
                        );
                    }

                    return (
                        `${padNumber(schedule.startDay)}` +
                        `/${padNumber(schedule.startMonth)}` +
                        `–` +
                        `${padNumber(schedule.endDay)}` +
                        `/${padNumber(schedule.endMonth)}`
                    );
                })
                .join(' • ');

        return {
            hasAnnualSale: true,

            isOpen,

            start:
                activeWindow?.start ||
                nextWindow?.start ||
                null,

            end:
                activeWindow?.end ||
                nextWindow?.end ||
                null,

            nextStart:
                nextWindow?.start ||
                null,

            nextOpenLabel:
                nextWindow
                    ? formatFullDate(
                        nextWindow.start
                    )
                    : '',

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

        if (item.isLocked) {
            window.alert(
                `🔒 ${item.name} đang bị Giáo viên khóa.`
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

        if (item.isLocked) {
            window.alert(
                `🔒 ${item.name} đang bị Giáo viên khóa.`
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

        // Chặn trang bị từ mọi đường dẫn khi Giáo viên đã khóa vật phẩm.
        // Không ảnh hưởng thao tác Gỡ vật phẩm đang mặc.
        if (item.isLocked === true) {
            window.alert(
                `🔒 ${item.name} đang bị Giáo viên khóa, không thể sử dụng.`
            );
            return false;
        }

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
        const annualSaleIcon =
            item.annualSaleIcon || '📅';

        const annualSaleTitle =
            item.annualSaleTitle ||
            'Vật phẩm giới hạn hằng năm';
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
            'Cơn mưa': 'tag-con-mua',
            'Mùa xuân': 'tag-mua-xuan',
            '2/9': 'tag-quoc-khanh-2-9',
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
    title="${annualSaleTitle}"
>
    ${annualSaleIcon} Mở lại ${annualSaleState.nextOpenLabel}
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

        const typeNameMap = {
            theme: 'Giao diện',
            effect: 'Hiệu ứng',
            pet: 'Thú cưng ảo',
            music: 'Nhạc nền',
            frame: 'Khung viền',
            background: 'Nền'
        };

        let typeName = typeNameMap[item.type] || 'Vật phẩm';

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

        /*
 * NYX · TIỂU DẠ TINH LINH
 * Card riêng hoàn toàn.
 */
        const nyxLittleSpiritIds = new Set([
            'pet_truyenthuyet_nyx_chibi_1'
        ]);

        /*
 * BỘ NGUYỆT DẠ NYX
 * Card giữ nguyên thiết kế riêng,
 * không cho giao diện khác ghi đè.
 */
        const nyxMoonRelicIds = new Set([
            'theme_truyenthuyet_thanh_dien_nguyet_da',
            'effect_truyenthuyet_da_trieu_tinh_nguyet',
            'frame_truyenthuyet_nyx_hac_nguyet_chi_hoan',
            'background_truyenthuyet_nyx_vinh_da_thien_mac'
        ]);

        const tamonBsideChibiIds = new Set([
            'pet_tamon_bside_chibi_1',
            'theme_tamon_bside_backstage',
            'effect_tamon_bside_spectrum_break',
            'frame_tamon_bside_signal_ring',
            'background_tamon_bside_stage_signal'
        ]);

        const premiumSpringIds = new Set([
            'pet_premium_mua_xuan',
            'effect_premium_mua_xuan',
            'theme_mua_xuan_thanh_minh',
            'frame_premium_mua_xuan_hoa_mong',
            'background_premium_mua_xuan_hoa_mong'
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

        const nationalDay29Ids = new Set([
            'pet_quoc_khanh_chibi_1',
            'effect_quoc_khanh_viet_dieu_non_song',
            'theme_quoc_khanh_viet_dieu_hong_ky',
            'frame_quoc_khanh_viet_dieu_quoc_an',
            'background_quoc_khanh_son_ha_ruc_sang'
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

        if (item.isLocked) {
            cardClasses.push('is-teacher-locked');
        }

        let specialCardGroup = '';
        let isThemeImmune = false;

        /* TAMON'S B-SIDE · CHIBI — card riêng nhưng giữ nguyên bố cục chuẩn */
        if (tamonBsideChibiIds.has(item.id)) {
            cardClasses.push(
                'store-card-tamon-bside-chibi',
                'store-theme-locked',
                'ui-theme-immune'
            );

            specialCardGroup = 'tamon-bside-chibi';
            isThemeImmune = true;
        }

        if (premiumSpringIds.has(item.id)) {
            cardClasses.push(
                'store-card-premium-spring',
                'store-theme-locked',
                'ui-theme-immune'
            );

            specialCardGroup = 'premium-spring';
            isThemeImmune = true;
        }



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

        /* =============================================
   NYX · TIỂU DẠ TINH LINH
   Card riêng + miễn nhiễm giao diện
   ============================================= */

        if (nyxLittleSpiritIds.has(item.id)) {

            cardClasses.push(
                'store-card-nyx-little-spirit',
                'store-theme-locked',
                'ui-theme-immune'
            );

            specialCardGroup =
                'nyx-little-spirit';

            isThemeImmune = true;
        }

        /* =============================================
   THÁNH ĐIỆN NGUYỆT DẠ
   + DẠ TRIỀU TINH NGUYỆT
   Miễn nhiễm mọi giao diện bên ngoài
   ============================================= */

        if (nyxMoonRelicIds.has(item.id)) {

            cardClasses.push(
                'store-card-nyx-moon-relic',
                'store-theme-locked',
                'ui-theme-immune'
            );

            specialCardGroup =
                'nyx-moon-relic';

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

        /* =========================================================
   QUỐC KHÁNH 2/9
   Card riêng, không bị theme/giao diện khác ghi đè
   ========================================================= */
        if (nationalDay29Ids.has(item.id)) {
            cardClasses.push(
                'store-card-national-day-2-9',
                'store-theme-locked',
                'ui-theme-immune'
            );

            specialCardGroup = 'national-day-2-9';
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

        style=""
    >
        ${item.isLocked
                ? `
        <div
            class="store-teacher-lock-overlay"
            role="status"
            aria-label="Vật phẩm đang bị giáo viên khóa"
            title="Vật phẩm đang bị giáo viên khóa"
        >
            <span class="store-teacher-lock-question">?</span>
        </div>
        `
                : ''
            }

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
            case 'music': return '🎵';
            case 'frame': return '🖼️';
            case 'background': return '🌄';
            default: return '📦';
        }
    }
}


/* =========================================================
   HIỂN THỊ VẬT PHẨM BỊ GIÁO VIÊN KHÓA
   - Che đen toàn bộ thẻ thay vì chỉ khóa nút Mua / Dùng thử.
   - Dấu ? lớn ở giữa thẻ.
   - Dùng chung cho Cửa hàng thường và Cửa hàng Sang trọng.
   ========================================================= */
(function installTeacherLockedStoreCardStyle() {
    if (document.getElementById('teacherLockedStoreCardStyle')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'teacherLockedStoreCardStyle';
    style.textContent = `
        .is-teacher-locked {
            position: relative !important;
            overflow: hidden !important;
            isolation: isolate;
        }

        .is-teacher-locked > :not(.store-teacher-lock-overlay) {
            filter: grayscale(1) brightness(.05) !important;
            opacity: .08 !important;
            pointer-events: none !important;
            user-select: none !important;
        }

        .store-teacher-lock-overlay {
            position: absolute;
            inset: 0;
            z-index: 2147483000;
            display: grid;
            place-items: center;
            border-radius: inherit;
            background: rgba(0, 0, 0, .96);
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .08);
            cursor: not-allowed;
            pointer-events: auto;
        }

        .store-teacher-lock-question {
            display: grid;
            place-items: center;
            width: min(42%, 118px);
            aspect-ratio: 1;
            border-radius: 50%;
            color: #fff;
            font-size: clamp(4.8rem, 9vw, 7.8rem);
            font-weight: 1000;
            line-height: 1;
            text-shadow: 0 0 18px rgba(255, 255, 255, .45);
            border: 3px solid rgba(255, 255, 255, .88);
            background: rgba(255, 255, 255, .05);
            box-shadow: 0 0 35px rgba(255, 255, 255, .12);
        }
    `;

    document.head.appendChild(style);
})();


/* =========================================================
   BẢO VỆ ẢNH VẬT PHẨM TRONG CỬA HÀNG
   - Áp dụng cho Cửa hàng thường + Cửa hàng Sang trọng.
   - Chặn chuột phải trên ảnh, kéo ảnh, copy ảnh và Ctrl/Cmd+S.
   - Dùng event delegation nên ảnh render động cũng được bảo vệ.
   ========================================================= */
(function installStoreImageProtection() {
    if (window.StoreImageProtection) return;

    const STORE_ROOT_SELECTOR = '#tab-store';
    const STYLE_ID = 'store-image-protection-style';
    let lastNoticeAt = 0;

    function getStoreRoot() {
        return document.querySelector(STORE_ROOT_SELECTOR);
    }

    function isStoreOpen() {
        const root = getStoreRoot();
        if (!root) return false;

        if (root.classList.contains('active')) {
            return true;
        }

        const style = window.getComputedStyle(root);
        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            !root.hidden
        );
    }

    function isImageElement(target) {
        return Boolean(
            target &&
            target.nodeType === 1 &&
            target.matches?.('img')
        );
    }

    function isStoreImage(target) {
        return Boolean(
            isImageElement(target) &&
            target.closest(STORE_ROOT_SELECTOR)
        );
    }

    /*
     * Nhân vật/thú cưng nổi ở góc màn hình nằm NGOÀI #tab-store.
     * Khi người dùng đang ở Cửa hàng, nó vẫn là ảnh vật phẩm nên phải
     * được bảo vệ giống ảnh trong card Cửa hàng.
     */
    function isFloatingStoreItemImage(target) {
        if (!isStoreOpen() || !isImageElement(target)) {
            return false;
        }

        return Boolean(
            target.closest('#virtual-pet-container') ||
            target.id === 'virtual-pet-img'
        );
    }

    function isProtectedStoreImage(target) {
        return (
            isStoreImage(target) ||
            isFloatingStoreItemImage(target)
        );
    }

    function selectionContainsStoreImage() {
        const selection = window.getSelection?.();
        if (!selection || selection.rangeCount === 0) {
            return false;
        }

        const range = selection.getRangeAt(0);
        const node = range.commonAncestorContainer;
        const element = node?.nodeType === 1
            ? node
            : node?.parentElement;

        const storeRoot = element?.closest?.(STORE_ROOT_SELECTOR);
        if (!storeRoot) return false;

        // Trường hợp trình duyệt chọn trực tiếp chính thẻ ảnh.
        if (element?.matches?.('img')) {
            return true;
        }

        // Chỉ chặn copy khi vùng chọn thực sự chạm vào một ảnh vật phẩm.
        return Array.from(
            storeRoot.querySelectorAll('img')
        ).some(img => {
            try {
                return range.intersectsNode(img);
            } catch (error) {
                return false;
            }
        });
    }

    function showProtectionNotice() {
        const now = Date.now();

        // Tránh spam thông báo khi người dùng giữ phím/chuột.
        if (now - lastNoticeAt < 900) return;
        lastNoticeAt = now;

        const message =
            'Ảnh vật phẩm trong Cửa hàng được bảo vệ và không hỗ trợ sao chép/lưu trực tiếp.';

        if (typeof window.showToast === 'function') {
            window.showToast(message, 'warning');
            return;
        }

        console.info('[StoreImageProtection]', message);
    }

    function blockEvent(event, shouldNotify = true) {
        event.preventDefault();
        event.stopPropagation();

        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }

        if (shouldNotify) {
            showProtectionNotice();
        }

        return false;
    }

    function protectSubtree(root = getStoreRoot()) {
        if (!root) return;

        const images = [];

        if (root.matches?.('img')) {
            images.push(root);
        }

        root.querySelectorAll?.('img').forEach(img => {
            images.push(img);
        });

        images.forEach(img => {
            img.setAttribute('draggable', 'false');
            img.setAttribute('data-store-image-protected', 'true');
            img.style.webkitUserDrag = 'none';
            img.style.userSelect = 'none';
            img.style.webkitUserSelect = 'none';
            img.style.webkitTouchCallout = 'none';
        });
    }

    function protectFloatingStoreItemImages() {
        if (!isStoreOpen()) return;

        document
            .querySelectorAll('#virtual-pet-container img, #virtual-pet-img')
            .forEach(img => {
                img.setAttribute('draggable', 'false');
                img.setAttribute(
                    'data-store-floating-image-protected',
                    'true'
                );
                img.style.webkitUserDrag = 'none';
                img.style.userSelect = 'none';
                img.style.webkitUserSelect = 'none';
                img.style.webkitTouchCallout = 'none';
            });
    }

    function installStyle() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #tab-store img,
            #tab-store [data-store-image-protected="true"],
            #virtual-pet-container img[data-store-floating-image-protected="true"],
            #virtual-pet-img[data-store-floating-image-protected="true"] {
                -webkit-user-drag: none !important;
                -webkit-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
            }
        `;

        (document.head || document.documentElement)
            .appendChild(style);
    }

    /*
     * CHẶN MENU CHUỘT PHẢI / NHẤN 2 NGÓN TOUCHPAD.
     *
     * Khi đang ở tab Cửa hàng, chặn context menu trên TOÀN BỘ giao diện.
     * Làm như vậy để trình duyệt không thể hiện các mục:
     * - Copy image
     * - Save image as...
     * - Open image in new tab
     *
     * Cách này cũng bao phủ nhân vật/thú cưng nổi góc phải vì phần tử đó
     * nằm ngoài #tab-store trong DOM.
     */
    document.addEventListener('contextmenu', event => {
        if (isStoreOpen()) {
            blockEvent(event);
        }
    }, true);

    // Kéo ảnh vật phẩm ra Desktop/tab mới, kể cả nhân vật nổi góc phải.
    document.addEventListener('dragstart', event => {
        if (isProtectedStoreImage(event.target)) {
            blockEvent(event);
        }
    }, true);

    // Copy ảnh trong Cửa hàng. Copy chữ bình thường vẫn được phép.
    document.addEventListener('copy', event => {
        const activeElement = document.activeElement;
        const activeImage = Boolean(
            isProtectedStoreImage(activeElement)
        );

        if (
            isStoreOpen() &&
            (
                isProtectedStoreImage(event.target) ||
                activeImage ||
                selectionContainsStoreImage()
            )
        ) {
            blockEvent(event);
        }
    }, true);

    // Chặn Ctrl/Cmd+S khi đang đứng ở tab Cửa hàng.
    // Ctrl/Cmd+C chỉ chặn nếu vùng chọn có ảnh; copy chữ vẫn hoạt động.
    document.addEventListener('keydown', event => {
        if (!isStoreOpen()) return;

        const modifier = event.ctrlKey || event.metaKey;
        if (!modifier) return;

        const key = String(event.key || '').toLowerCase();

        if (key === 's') {
            blockEvent(event);
            return;
        }

        if (
            key === 'c' &&
            selectionContainsStoreImage()
        ) {
            blockEvent(event);
        }
    }, true);

    installStyle();

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            () => {
                protectSubtree();
                protectFloatingStoreItemImages();
            },
            { once: true }
        );
    } else {
        protectSubtree();
        protectFloatingStoreItemImages();
    }

    // Ảnh mới được render sau khi lọc/mua/chuyển Luxury cũng tự khóa.
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (
                    node.nodeType !== 1 ||
                    !node.closest?.(STORE_ROOT_SELECTOR)
                ) {
                    return;
                }

                protectSubtree(node);
            });
        });
    });

    const startObserver = () => {
        const root = getStoreRoot();
        if (!root) return false;

        observer.observe(root, {
            childList: true,
            subtree: true
        });

        protectSubtree(root);
        protectFloatingStoreItemImages();
        return true;
    };

    if (!startObserver()) {
        let attempts = 0;
        const timer = setInterval(() => {
            attempts += 1;

            if (startObserver() || attempts >= 100) {
                clearInterval(timer);
            }
        }, 100);
    }

    /*
     * Theo dõi DOM toàn trang để nếu PetManager thay ảnh nhân vật sau khi
     * trang bị vật phẩm, ảnh mới vẫn bị vô hiệu kéo/long-press ngay khi
     * người dùng đang ở Cửa hàng.
     */
    const floatingObserver = new MutationObserver(() => {
        protectFloatingStoreItemImages();
    });

    const observeFloatingAssets = () => {
        if (!document.body) return false;

        floatingObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        protectFloatingStoreItemImages();
        return true;
    };

    if (!observeFloatingAssets()) {
        document.addEventListener(
            'DOMContentLoaded',
            observeFloatingAssets,
            { once: true }
        );
    }

    /*
     * Tab được mở/đóng bằng class "active". Theo dõi riêng #tab-store
     * để cập nhật bảo vệ cho nhân vật nổi mà không tạo vòng lặp observer.
     */
    const observeStoreVisibility = () => {
        const root = getStoreRoot();
        if (!root) return false;

        const visibilityObserver = new MutationObserver(() => {
            if (isStoreOpen()) {
                protectSubtree(root);
                protectFloatingStoreItemImages();
            }
        });

        visibilityObserver.observe(root, {
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden']
        });

        return true;
    };

    if (!observeStoreVisibility()) {
        document.addEventListener(
            'DOMContentLoaded',
            observeStoreVisibility,
            { once: true }
        );
    }

    window.StoreImageProtection = Object.freeze({
        protectSubtree,
        protectFloatingStoreItemImages,
        isStoreOpen,
        isProtectedStoreImage
    });
})();

/* =========================================================
   THÊM TAB KHUNG VIỀN + NỀN VÀO CỬA HÀNG
   ========================================================= */
(function installExtraStoreCategoryButtons() {

    const EXTRA_FILTERS = [
        {
            type: 'frame',
            label: '🖼️ Khung viền'
        },
        {
            type: 'background',
            label: '🌄 Nền'
        }
    ];

    function install() {
        const storeTab =
            document.getElementById('tab-store');

        if (!storeTab) return false;

        // Tìm nút Nhạc nền hiện tại
        const musicButton =
            storeTab.querySelector(
                'button[onclick*="filterStore(\'music\')"]'
            );

        if (
            !musicButton ||
            !musicButton.parentElement
        ) {
            return false;
        }

        const filterBar =
            musicButton.parentElement;

        // Có thêm 2 nút nên cho phép xuống dòng
        // khi màn hình không đủ rộng.
        filterBar.style.flexWrap = 'wrap';

        EXTRA_FILTERS.forEach(config => {

            // Không tạo trùng nút
            const exists =
                filterBar.querySelector(
                    `button[data-store-extra-filter="${config.type}"]`
                );

            if (exists) return;

            const button =
                document.createElement('button');

            button.type = 'button';

            // Giữ đúng style/class của các nút hiện có
            button.className = 'btn-approve';

            button.dataset.storeExtraFilter =
                config.type;

            button.setAttribute(
                'onclick',
                `filterStore('${config.type}')`
            );

            button.style.background =
                'rgba(255,255,255,0.5)';

            button.style.color =
                '#667eea';

            button.textContent =
                config.label;

            // Thêm ngay sau các nút hiện tại
            filterBar.appendChild(button);
        });

        return true;
    }

    function boot() {

        // Nếu HTML cửa hàng đã có rồi
        if (install()) return;

        // Nếu JS chạy trước khi DOM cửa hàng xuất hiện
        const observer =
            new MutationObserver(() => {

                if (install()) {
                    observer.disconnect();
                }

            });

        observer.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true
            }
        );

        // Không theo dõi vô hạn
        setTimeout(
            () => observer.disconnect(),
            15000
        );
    }

    if (
        document.readyState === 'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            boot,
            { once: true }
        );
    } else {
        boot();
    }

})();