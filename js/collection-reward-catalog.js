/* Thêm nền đặc biệt tại đây. ID phải bắt đầu bằng reward_bg_. Không đưa vào StoreConfig.items.
Ví dụ: {id:'reward_bg_winter',name:'Đông Tuyết',tag:'Mùa đông',tagImage:'assets/.../tag.png',value:'assets/.../nen.png',type:'background'}
Sau khi thêm: giáo viên mở Phần thưởng, chọn nền và công bố bộ; danh mục tự đồng bộ.
Tag được khai báo bằng thuộc tính tag dưới đây, không nhập trong giao diện giáo viên.
Các nền chọn cùng bộ có cùng tag sẽ dùng một tên tag; khác tag sẽ ghép bằng " / ".
Tag của bộ được lưu khi công bố/lưu sửa. Nền đã thuộc bộ đang công bố chỉ hiện khi sửa bộ đó.
*/
window.CollectionRewardCatalog = Object.freeze([
    {
        id: 'reward_bg_poster_xuan',
        name: 'Mùa Xuân',
        tag: 'Mùa Xuân',
        tagImage: 'assets/Premium/Bốn mùa/tag-mua-xuan.png',
        type: 'background',
        value: 'assets/Premium/Poster/xuan.png',
        backgroundFit: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
    },
    ...[
        ['klain', 'Klain', 'Quỷ Bí', 'Klain.png', 'quỷ bí/tag1.png'],
        ['cheng_xiaoshi', 'Cheng Xiaoshi', 'Link Click', 'Cheng Xiaoshi.png', 'Lock/tag1.png'],
        ['day_sao_nam', 'Đầy Sao · Nam', 'Đêm Đầy Sao', 'day sao nam.png', 'đêm đầy sao/tag.png'],
        ['hac_mong', 'Hắc Mộng', 'Hắc Mộng', 'hac mong.png', 'Tu tiên/hac_mong_tag2.png'],
        ['cam_co', 'Cấm Cổ', 'Cấm Cổ', 'cam co.png', 'Tu tiên/cam_co_tag1.png'],
        ['nyx', 'Nyx', 'Nyx', 'nyx.png', 'Thần thoại/nyx-tag1.png'],
        ['aether', 'Aether', 'Aether', 'aether.png', 'Thần thoại/aether-tag2.png'],
        ['quoc_khanh', 'Quốc Khánh', 'Quốc Khánh', 'quoc khanh.png', 'quốc khánh/tag.png'],
        ['thu', 'Mùa Thu', 'Mùa Thu', 'thu.png', 'Bốn mùa/tag3.png'],
        ['ha', 'Mùa Hạ', 'Mùa Hạ', 'ha.png', 'Bốn mùa/ha_tag2.png'],
        ['chu_cuoi', 'Chú Cuội', 'Trung Thu', 'chu cuoi.png', 'Trung thu/tag1.png'],
        ['tamon_1', 'Tamon 1', 'Tamon', 'tamon 1.png', 'Tamon/tamon-tag1.png'],
        ['tamon_2', 'Tamon 2', 'Tamon', 'tamon 2.png', 'Tamon/tamon-tag1.png'],
        ['hang_nga', 'Hằng Nga', 'Trung Thu', 'hang nga.png', 'Trung thu/tag1.png'],
        ['audrey_hall', 'Audrey Hall', 'Quỷ Bí', 'Audrey Hall.png', 'quỷ bí/Audrey Hall_tag2.png'],
        ['alger_wilson', 'Alger Wilson', 'Quỷ Bí', 'Alger Wilson.png', 'quỷ bí/Alger Wilson_tag3.png'],
        ['emlyn_white', 'Emlyn White', 'Quỷ Bí', 'Emlyn White.png', 'quỷ bí/Emlyn White_tag4.png'],
        ['lu_guang', 'Lu Guang', 'lick click', 'lu_guang_.png', 'Lock/Lu_guang_tag2.png'],
        ['liu_xiao', 'Liu Xiao', 'lick click', 'Liu_Xiao.png', 'Lock/Liu_Xiao_tag3.png'],
        ['qiao_ling', 'Qiao Ling', 'lick click', 'Qiao_Ling.png', 'Lock/Qiao_Ling_tag4.png'],
        ['chronos', 'Chronos', 'Thần thoại', 'Chronos.png', 'Thần thoại/Chronos_tag3.png'],
        ['hemera', 'Hemera', 'Thần thoại', 'Hemera.png', 'Thần thoại/Hemera_tag4.png'],
        ['day_sao_nu', 'Đầy Sao · Nữ', 'Đêm Đầy Sao', 'day sao nu.png', 'đêm đầy sao/tag.png'],
        ['dong', 'Mùa Đông', 'Mùa Đông', 'dong.png', 'Bốn mùa/tag4.png'],
        ['kim_lien', 'Kim Liên', 'Tu tiên', 'kim lien.png', 'Tu tiên/kim_lien_tag3.png'],
        ['thanh_lanh', 'Thanh Lãnh', 'Tu tiên', 'thanh lanh.png', 'Tu tiên/thanh_lanh_tag4.png'],
        ['luoi_bieng', 'Lười Biếng', 'Thất Đại Tội', 'luoi bieng.png', 'thất đại tội/lười biếng/luoi_bieng_tag1.png'],
        ['tham_lam', 'Tham Lam', 'Thất Đại Tội', 'tham lam.png', 'thất đại tội/tham lam/tag2.png'],
        ['yeu', 'Tình Yêu', 'Valentine', 'yeu.png', 'Valentine/tag1.png'],
        ['chuc_nu', 'Chức Nữ', 'Thất Tịch', 'chuc nu.png', 'Thất tịch/that_tich_tag1.png'],
        ['nguu_lang', 'Ngưu Lang', 'Thất Tịch', 'nguu lang.png', 'Thất tịch/that_tich_tag1.png']
    ].map(([key, name, tag, poster, tagImage]) => ({
        id: 'reward_bg_poster_' + key,
        name,
        tag,
        tagImage: tagImage ? 'assets/Premium/' + tagImage : '',
        type: 'background',
        value: 'assets/Premium/Poster/' + poster,
        backgroundFit: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
    }))
]);
