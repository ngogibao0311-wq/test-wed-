/* Thêm nền đặc biệt tại đây. ID phải bắt đầu bằng reward_bg_. Không đưa vào StoreConfig.items.
Ví dụ: {id:'reward_bg_winter',name:'Đông Tuyết',tag:'Mùa đông',tagImage:'assets/.../tag.png',value:'assets/.../nen.png',type:'background'}
Sau khi thêm: giáo viên mở Phần thưởng, chọn nền và công bố bộ; danh mục tự đồng bộ.
*/
window.CollectionRewardCatalog = Object.freeze([
    {
        id: 'reward_bg_poster_xuan',
        name: 'Mùa Xuân',
        tag: 'Mùa Xuân',
        type: 'background',
        value: 'assets/Premium/Poster/xuan.png',
        backgroundFit: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
    }
]);
