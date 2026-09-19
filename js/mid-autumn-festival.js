(() => {
    'use strict';

    if (window.MidAutumnFestival) return;

    const VERSION = '1.3.3-accessibility-focus-fix';
    const EVENT_ID = 'dai_hoi_trung_thu';

    const CONFIG = Object.freeze({
        baseTickets: 2,
        maxExtraTickets: 4,
        extraTicketPrice: 4,
        maxScorePerPlay: 30,
        stateRoot: 'student_mid_autumn_events',
        rewardRoot: 'student_event_rewards',
        backgroundRewards: [
            'background_trung_thu_nguyet_cung_hoa_dang_da',
            'background_trung_thu_chu_cuoi_que_lam_nguyet_da'
        ],
        milestones: [
            { score: 10, type: 'coin', amount: 50, icon: '🪙', label: '50 Coin' },
            { score: 40, type: 'coin', amount: 150, icon: '🪙', label: '150 Coin' },
            { score: 60, type: 'coin', amount: 200, icon: '🪙', label: '200 Coin' },
            { score: 80, type: 'background', amount: 0, icon: '🏮', label: 'Nền web tag Trung Thu' },
            { score: 100, type: 'mid_autumn_coin', amount: 1, icon: '🌕', label: '1 Xu Trung Thu' }
        ]
    });

    const GAME_DEFS = Object.freeze([
        { id: 'baking', icon: '🥮', name: 'Thỏ Ngọc Làm Bánh', desc: 'Giải công thức mức trung bình · 12 giây/câu.' },
        { id: 'lantern', icon: '🏮', name: 'Ghép Đèn Lồng', desc: '30 thẻ · 15 cặp · giới hạn 60 giây.' },
        { id: 'catch', icon: '🧺', name: 'Bắt Bánh Trung Thu', desc: 'Mức trung bình · 20 giây · tối đa 20 điểm.' },
        { id: 'quiz', icon: '❓', name: 'Đố Vui Trung Thu', desc: 'Rút 5 câu ngẫu nhiên từ ngân hàng câu hỏi · 15 giây/câu.' },
        { id: 'find', icon: '🔎', name: 'Tìm Đồ Vật', desc: 'Nhìn mục tiêu 1 giây rồi tìm trong 48 ô · mức trung bình.' }
    ]);

    const QUIZ_QUESTION_BANK = Object.freeze([
        { q: "Tết Trung Thu diễn ra vào ngày nào theo âm lịch?", a: "15/8", opts: ["15/8", "1/8", "10/8", "30/8"] },
        { q: "Hoạt động nào rất phổ biến với thiếu nhi trong đêm Trung Thu?", a: "Rước đèn", opts: ["Rước đèn", "Dựng cây nêu", "Hái lộc", "Gói bánh chưng"] },
        { q: "Loại bánh nào gắn liền với dịp Trung Thu?", a: "Bánh Trung Thu", opts: ["Bánh Trung Thu", "Bánh tét", "Bánh giầy", "Bánh xèo"] },
        { q: "Nhân vật dân gian Việt Nam thường gắn với cây đa trên Mặt Trăng là ai?", a: "Chú Cuội", opts: ["Chú Cuội", "Thánh Gióng", "Sơn Tinh", "Lang Liêu"] },
        { q: "Loại đèn nào là hình ảnh quen thuộc của Trung Thu Việt Nam?", a: "Đèn ông sao", opts: ["Đèn ông sao", "Đèn giao thông", "Đèn pin", "Đèn bàn"] },
        { q: "Tiết mục nào thường xuất hiện trong các chương trình Trung Thu?", a: "Múa lân", opts: ["Múa lân", "Đua thuyền", "Ném còn", "Kéo co dưới nước"] },
        { q: "Đêm Trung Thu thường gắn với hình ảnh nào trên bầu trời?", a: "Trăng tròn", opts: ["Trăng tròn", "Cầu vồng", "Mặt Trời lúc trưa", "Sao chổi"] },
        { q: "Tên gọi 'Tết trông trăng' thường dùng để chỉ dịp nào?", a: "Tết Trung Thu", opts: ["Tết Trung Thu", "Tết Nguyên Đán", "Tết Đoan Ngọ", "Tết Hàn Thực"] },
        { q: "Hoạt động 'phá cỗ' trong Trung Thu gần nghĩa nhất với việc nào?", a: "Cùng thưởng thức mâm cỗ", opts: ["Cùng thưởng thức mâm cỗ", "Dọn nhà", "Trồng cây", "Đi chợ sáng"] },
        { q: "Mâm cỗ Trung Thu thường có nhóm thực phẩm nào?", a: "Bánh và hoa quả", opts: ["Bánh và hoa quả", "Mì ăn liền", "Đồ đông lạnh", "Thức ăn nhanh"] },
        { q: "Nhân vật Hằng Nga trong truyền thuyết Đông Á gắn với nơi nào?", a: "Mặt Trăng", opts: ["Mặt Trăng", "Đáy biển", "Núi lửa", "Sa mạc"] },
        { q: "Thỏ Ngọc trong truyền thuyết thường gắn với hình ảnh nào?", a: "Cung trăng", opts: ["Cung trăng", "Đáy sông", "Rừng ngập mặn", "Hang động"] },
        { q: "Bánh Trung Thu phổ biến có hai kiểu chính nào?", a: "Bánh nướng và bánh dẻo", opts: ["Bánh nướng và bánh dẻo", "Bánh cuốn và bánh hỏi", "Bánh mì và bánh bao", "Bánh xèo và bánh khọt"] },
        { q: "Bánh nướng được làm chín chủ yếu bằng cách nào?", a: "Nướng", opts: ["Nướng", "Luộc", "Hấp cách thủy", "Ướp lạnh"] },
        { q: "Vỏ bánh dẻo truyền thống thường gắn với loại bột nào?", a: "Bột nếp", opts: ["Bột nếp", "Bột ngô", "Bột khoai tây", "Bột sắn dây"] },
        { q: "Nhân nào thường có màu vàng và vị bùi trong bánh Trung Thu?", a: "Đậu xanh", opts: ["Đậu xanh", "Cà chua", "Rau muống", "Khoai tây chiên"] },
        { q: "Nguyên liệu nào thường tạo vị mặn béo ở giữa một số bánh Trung Thu?", a: "Trứng muối", opts: ["Trứng muối", "Dưa leo", "Rau thơm", "Đậu phộng rang muối"] },
        { q: "Nhân hạt sen được làm chủ yếu từ gì?", a: "Hạt sen", opts: ["Hạt sen", "Hạt tiêu", "Hạt cải", "Hạt cà phê"] },
        { q: "Đồ uống nào thường được dùng cùng bánh Trung Thu để cân bằng vị ngọt?", a: "Trà", opts: ["Trà", "Nước mắm", "Giấm", "Dầu ăn"] },
        { q: "Màu sắc nào thường tạo cảm giác ấm áp, lễ hội cho đèn Trung Thu?", a: "Đỏ và vàng", opts: ["Đỏ và vàng", "Xám và đen", "Nâu và xám", "Chỉ màu trắng"] },
        { q: "Mặt Trăng là gì đối với Trái Đất?", a: "Vệ tinh tự nhiên", opts: ["Vệ tinh tự nhiên", "Một hành tinh", "Một ngôi sao", "Một thiên hà"] },
        { q: "Ánh sáng ta thấy từ Mặt Trăng chủ yếu là gì?", a: "Ánh sáng Mặt Trời phản xạ", opts: ["Ánh sáng Mặt Trời phản xạ", "Mặt Trăng tự phát sáng", "Ánh sáng từ đèn điện", "Ánh sáng từ sao Hỏa"] },
        { q: "Pha Mặt Trăng nào có hình tròn sáng gần như đầy đủ?", a: "Trăng tròn", opts: ["Trăng tròn", "Trăng non", "Bán nguyệt", "Không có pha nào"] },
        { q: "Một chu kỳ pha Mặt Trăng kéo dài xấp xỉ bao lâu?", a: "29,5 ngày", opts: ["29,5 ngày", "7 ngày", "365 ngày", "12 giờ"] },
        { q: "Bề mặt Mặt Trăng có nhiều cấu trúc nào dễ quan sát?", a: "Hố va chạm", opts: ["Hố va chạm", "Rừng rậm", "Đại dương nước lỏng", "Thành phố"] },
        { q: "Trọng lực trên Mặt Trăng so với Trái Đất như thế nào?", a: "Nhỏ hơn nhiều", opts: ["Nhỏ hơn nhiều", "Lớn hơn gấp 10 lần", "Bằng hệt", "Không tồn tại"] },
        { q: "Người đầu tiên bước lên Mặt Trăng là ai?", a: "Neil Armstrong", opts: ["Neil Armstrong", "Albert Einstein", "Yuri Gagarin", "Isaac Newton"] },
        { q: "Chuyến bay đưa con người lần đầu đặt chân lên Mặt Trăng là?", a: "Apollo 11", opts: ["Apollo 11", "Voyager 1", "Sputnik 1", "Hubble"] },
        { q: "Năm con người lần đầu đặt chân lên Mặt Trăng là?", a: "1969", opts: ["1969", "1900", "2001", "2020"] },
        { q: "Khi nguyệt thực xảy ra, thiên thể nào nằm giữa Mặt Trời và Mặt Trăng?", a: "Trái Đất", opts: ["Trái Đất", "Sao Kim", "Sao Hỏa", "Sao Mộc"] },
        { q: "Khi nhật thực xảy ra, thiên thể nào nằm giữa Mặt Trời và Trái Đất?", a: "Mặt Trăng", opts: ["Mặt Trăng", "Sao Thổ", "Sao Mộc", "Sao Hỏa"] },
        { q: "Mặt xa của Mặt Trăng có phải lúc nào cũng tối không?", a: "Không", opts: ["Không", "Có, luôn luôn tối", "Chỉ tối vào mùa đông", "Chỉ sáng vào Trung Thu"] },
        { q: "Mặt Trăng quay quanh thiên thể nào?", a: "Trái Đất", opts: ["Trái Đất", "Sao Hỏa", "Sao Kim", "Sao Thổ"] },
        { q: "Trái Đất và Mặt Trăng cùng nhận ánh sáng trực tiếp từ đâu?", a: "Mặt Trời", opts: ["Mặt Trời", "Sao Bắc Cực", "Sao Kim", "Dải Ngân Hà"] },
        { q: "Pha trăng non xảy ra khi phần sáng hướng về Trái Đất như thế nào?", a: "Rất ít hoặc gần như không thấy", opts: ["Rất ít hoặc gần như không thấy", "Sáng tròn hoàn toàn", "Sáng gấp đôi", "Có màu xanh"] },
        { q: "Đèn lồng truyền thống thường có khung làm từ vật liệu nào?", a: "Tre", opts: ["Tre", "Bê tông", "Đá granit", "Thép ray"] },
        { q: "Vật liệu nào thường phủ bên ngoài khung đèn lồng truyền thống?", a: "Giấy hoặc giấy kiếng", opts: ["Giấy hoặc giấy kiếng", "Xi măng", "Kính dày", "Gạch"] },
        { q: "Nguồn sáng nào an toàn hơn cho đèn trẻ em hiện nay?", a: "Đèn LED", opts: ["Đèn LED", "Nến cháy lớn", "Than hồng", "Đuốc dầu"] },
        { q: "Để an toàn khi rước đèn, nên làm gì?", a: "Đi cùng người lớn và tránh xe cộ", opts: ["Đi cùng người lớn và tránh xe cộ", "Chạy xuống lòng đường", "Chơi gần lửa", "Tách khỏi nhóm"] },
        { q: "Đầu lân thường xuất hiện cùng nhạc cụ nào?", a: "Trống", opts: ["Trống", "Đàn piano điện", "Kèn saxophone", "Máy đánh chữ"] },
        { q: "Hình dạng đặc trưng của đèn ông sao là gì?", a: "Ngôi sao năm cánh", opts: ["Ngôi sao năm cánh", "Hình tam giác duy nhất", "Hình chữ nhật dài", "Hình lục giác bắt buộc"] },
        { q: "Con vật nào thường được tạo hình thành đèn Trung Thu?", a: "Cá chép", opts: ["Cá chép", "Cá voi xanh thật", "Khủng long sống", "Bạch tuộc khổng lồ thật"] },
        { q: "Con vật nào cũng thường được dùng làm hình đèn Trung Thu?", a: "Thỏ", opts: ["Thỏ", "Hà mã thật", "Cá mập thật", "Tê giác thật"] },
        { q: "Mâm ngũ quả Trung Thu thuộc nhóm nào?", a: "Đồ bày cỗ", opts: ["Đồ bày cỗ", "Dụng cụ sửa xe", "Thiết bị điện", "Đồ xây dựng"] },
        { q: "Loại quả nào thường được tỉa trang trí trong mâm cỗ Trung Thu Việt Nam?", a: "Bưởi", opts: ["Bưởi", "Ô liu ngâm", "Ớt khô", "Khoai tây sống"] },
        { q: "'Chó bưởi' trong mâm cỗ thường được tạo chủ yếu từ gì?", a: "Múi bưởi", opts: ["Múi bưởi", "Kim loại", "Đá", "Nhựa đường"] },
        { q: "Khi tổ chức Trung Thu xanh, lựa chọn nào thân thiện môi trường hơn?", a: "Tái sử dụng đèn lồng", opts: ["Tái sử dụng đèn lồng", "Vứt pin bừa bãi", "Dùng thật nhiều đồ nhựa một lần", "Đốt rác"] },
        { q: "Sau khi phá cỗ, việc nào nên làm?", a: "Thu gom rác đúng nơi", opts: ["Thu gom rác đúng nơi", "Để rác tại chỗ", "Ném rác xuống cống", "Đốt túi nhựa"] },
        { q: "Khi dùng đèn có pin, pin cũ nên được xử lý thế nào?", a: "Thu gom đúng điểm quy định", opts: ["Thu gom đúng điểm quy định", "Ném xuống ao", "Chôn tùy ý", "Đốt trong nhà"] },
        { q: "Trong đoàn múa lân, người đánh trống có vai trò gì?", a: "Tạo nhịp cho màn biểu diễn", opts: ["Tạo nhịp cho màn biểu diễn", "Nấu bánh", "Điều khiển giao thông", "Thắp pháo trong nhà"] },
        { q: "Tên gọi lễ hội Trung Thu trong tiếng Trung thường được dịch là gì?", a: "Lễ hội Trung Thu", opts: ["Lễ hội Trung Thu", "Lễ hội mùa xuân", "Lễ hội băng tuyết", "Lễ hội biển"] },
        { q: "Ở Hàn Quốc, dịp lễ lớn gần thời điểm rằm tháng Tám âm lịch có tên là gì?", a: "Chuseok", opts: ["Chuseok", "Hanami", "Songkran", "Oktoberfest"] },
        { q: "Món bánh gạo thường gắn với Chuseok của Hàn Quốc là gì?", a: "Songpyeon", opts: ["Songpyeon", "Sushi", "Pizza", "Taco"] },
        { q: "Ở Nhật Bản, hoạt động ngắm trăng mùa thu thường được gọi là gì?", a: "Tsukimi", opts: ["Tsukimi", "Hanami", "Tanabata", "Setsubun"] },
        { q: "Món viên bột thường được bày trong dịp Tsukimi là gì?", a: "Dango", opts: ["Dango", "Kimchi", "Bánh mì", "Phở"] },
        { q: "Trong truyền thuyết Trung Hoa, người bắn hạ nhiều Mặt Trời thường gắn với Hằng Nga là ai?", a: "Hậu Nghệ", opts: ["Hậu Nghệ", "Tôn Ngộ Không", "Lưu Bị", "Bao Công"] },
        { q: "Trong truyền thuyết về Thỏ Ngọc, con thỏ thường được miêu tả đang làm gì?", a: "Giã thuốc", opts: ["Giã thuốc", "Lái tàu", "Rèn kiếm", "Xây cầu"] },
        { q: "Loài hoa thường được nhắc cùng mùa thu và truyền thuyết cung trăng ở Đông Á là gì?", a: "Hoa quế", opts: ["Hoa quế", "Hoa xương rồng", "Hoa súng biển", "Hoa tuyết nhân tạo"] },
        { q: "Ở Việt Nam, Trung Thu đặc biệt hướng nhiều hoạt động đến ai?", a: "Thiếu nhi", opts: ["Thiếu nhi", "Chỉ vận động viên", "Chỉ đầu bếp", "Chỉ thủy thủ"] },
        { q: "Hoạt động gia đình nào phù hợp với tinh thần đoàn viên Trung Thu?", a: "Cùng ăn bánh và ngắm trăng", opts: ["Cùng ăn bánh và ngắm trăng", "Mỗi người ở riêng không giao tiếp", "Chỉ làm việc suốt đêm", "Tắt hết liên lạc"] },
        { q: "Trong các lựa chọn sau, đâu là một loại nhân bánh Trung Thu phổ biến?", a: "Hạt sen", opts: ["Hạt sen", "Rau cần", "Cải thìa", "Nước tương"] },
        { q: "Trong các lựa chọn sau, đâu là một loại nhân bánh Trung Thu phổ biến?", a: "Đậu xanh", opts: ["Đậu xanh", "Rong biển sống", "Cà tím", "Su su"] },
        { q: "Trong các lựa chọn sau, đâu là hương vị có thể dùng cho bánh Trung Thu hiện đại?", a: "Trà xanh", opts: ["Trà xanh", "Nước mắm nguyên chất", "Giấm trắng", "Muối hột"] },
        { q: "Với bánh có trứng muối, phần trứng thường nằm ở đâu?", a: "Trong nhân bánh", opts: ["Trong nhân bánh", "Ngoài hộp", "Dưới đĩa", "Trong đèn lồng"] },
        { q: "Khi chia một chiếc bánh Trung Thu cho 4 người, cách hợp lý là gì?", a: "Cắt thành 4 phần", opts: ["Cắt thành 4 phần", "Chỉ một người ăn hết", "Bỏ đi một nửa", "Không mở bánh"] },
        { q: "Có 5 chiếc đèn, tặng 2 chiếc thì còn bao nhiêu chiếc?", a: "3", opts: ["3", "2", "5", "7"] },
        { q: "Có 4 bánh nướng và 3 bánh dẻo. Tổng cộng có bao nhiêu bánh?", a: "7", opts: ["7", "6", "8", "12"] },
        { q: "Một đội có 12 bạn, chia đều thành 3 nhóm. Mỗi nhóm có bao nhiêu bạn?", a: "4", opts: ["4", "3", "6", "9"] },
        { q: "Có 15 chiếc đèn chia đều cho 5 bạn. Mỗi bạn nhận mấy chiếc?", a: "3", opts: ["3", "5", "10", "15"] },
        { q: "Một hộp có 8 bánh, đã ăn 3 bánh. Còn lại bao nhiêu bánh?", a: "5", opts: ["5", "3", "8", "11"] },
        { q: "Mỗi bạn cầm 1 đèn. Có 9 bạn thì cần bao nhiêu đèn?", a: "9", opts: ["9", "8", "10", "18"] },
        { q: "Hai hộp, mỗi hộp 6 bánh. Tổng cộng có bao nhiêu bánh?", a: "12", opts: ["12", "6", "8", "18"] },
        { q: "Một vòng rước đèn dài 20 phút, đã đi 12 phút. Còn bao nhiêu phút?", a: "8 phút", opts: ["8 phút", "6 phút", "12 phút", "32 phút"] },
        { q: "Có 18 phần quà chia đều cho 6 bạn. Mỗi bạn được mấy phần?", a: "3", opts: ["3", "6", "12", "24"] },
        { q: "Một đội ghép được 7 cặp đèn. Vậy họ đã ghép đúng bao nhiêu thẻ?", a: "14 thẻ", opts: ["14 thẻ", "7 thẻ", "21 thẻ", "28 thẻ"] },
        { q: "Trong trò ghép cặp, 15 cặp tương ứng bao nhiêu thẻ?", a: "30 thẻ", opts: ["30 thẻ", "15 thẻ", "20 thẻ", "45 thẻ"] },
        { q: "Một câu hỏi có 15 giây. 5 câu tối đa có bao nhiêu giây nếu dùng hết thời gian?", a: "75 giây", opts: ["75 giây", "60 giây", "90 giây", "150 giây"] },
        { q: "Nếu bắt được 10 bánh và mỗi bánh 2 điểm thì được bao nhiêu điểm?", a: "20 điểm", opts: ["20 điểm", "10 điểm", "30 điểm", "40 điểm"] },
        { q: "Đạt 100 điểm từ 80 điểm thì còn thiếu bao nhiêu điểm?", a: "20 điểm", opts: ["20 điểm", "10 điểm", "80 điểm", "180 điểm"] },
        { q: "Từ mốc 40 điểm lên mốc 60 điểm cần thêm bao nhiêu điểm?", a: "20 điểm", opts: ["20 điểm", "10 điểm", "40 điểm", "100 điểm"] },
        { q: "Từ mốc 60 lên mốc 80 cần thêm bao nhiêu điểm?", a: "20 điểm", opts: ["20 điểm", "30 điểm", "40 điểm", "10 điểm"] },
        { q: "Nếu có 2 vé miễn phí và mua thêm 4 vé thì tối đa có bao nhiêu vé?", a: "6 vé", opts: ["6 vé", "4 vé", "2 vé", "8 vé"] },
        { q: "Nếu đã dùng 3 trong 6 vé thì còn mấy vé?", a: "3 vé", opts: ["3 vé", "2 vé", "6 vé", "9 vé"] },
        { q: "Từ 'rằm' thường chỉ ngày nào trong tháng âm lịch?", a: "Ngày 15", opts: ["Ngày 15", "Ngày 1", "Ngày 30", "Ngày 7"] },
        { q: "'Đoàn viên' gần nghĩa nhất với điều gì?", a: "Gia đình sum họp", opts: ["Gia đình sum họp", "Đi một mình", "Thi đấu cá nhân", "Làm việc tách biệt"] },
        { q: "'Nguyệt' trong nhiều từ Hán Việt có nghĩa là gì?", a: "Mặt Trăng", opts: ["Mặt Trăng", "Mặt Trời", "Dòng sông", "Ngọn núi"] },
        { q: "'Nguyệt cung' được hiểu là gì trong truyện dân gian?", a: "Cung điện trên Mặt Trăng", opts: ["Cung điện trên Mặt Trăng", "Cung điện dưới biển", "Một loại bánh", "Một nhạc cụ"] },
        { q: "'Lồng đèn' là vật dùng chủ yếu để làm gì trong Trung Thu?", a: "Trang trí và rước đèn", opts: ["Trang trí và rước đèn", "Nấu cơm", "Đo nhiệt độ", "Sửa xe"] },
        { q: "'Trống lân' gắn với hoạt động nào?", a: "Múa lân", opts: ["Múa lân", "Bơi lội", "Đọc sách", "Trồng cây"] },
        { q: "'Mâm cỗ' trong Trung Thu thường được bày để làm gì?", a: "Cùng thưởng thức trong đêm hội", opts: ["Cùng thưởng thức trong đêm hội", "Làm vật liệu xây nhà", "Sửa máy tính", "Làm biển báo"] },
        { q: "'Chị Hằng' là cách gọi dân gian gắn với nhân vật nào?", a: "Hằng Nga", opts: ["Hằng Nga", "Mỵ Châu", "Tấm", "Sơn Tinh"] },
        { q: "Biểu tượng 🥮 thường đại diện cho món gì?", a: "Bánh Trung Thu", opts: ["Bánh Trung Thu", "Bánh mì", "Bánh xèo", "Kẹo mút"] },
        { q: "Biểu tượng 🏮 thường đại diện cho vật gì?", a: "Đèn lồng", opts: ["Đèn lồng", "Trống", "Bánh", "Quạt"] },
        { q: "Biểu tượng 🌕 thường gợi đến hình ảnh nào?", a: "Trăng tròn", opts: ["Trăng tròn", "Mặt Trời mọc", "Cơn mưa", "Đám mây"] },
        { q: "Biểu tượng 🐇 trong chủ đề Trung Thu thường gợi đến ai?", a: "Thỏ Ngọc", opts: ["Thỏ Ngọc", "Rồng biển", "Hổ trắng", "Cá chép"] },
        { q: "Biểu tượng ⭐ trong đèn ông sao là hình gì?", a: "Ngôi sao", opts: ["Ngôi sao", "Hình tròn", "Hình vuông", "Hình thoi"] },
        { q: "Nếu trời mưa khi tổ chức rước đèn ngoài trời, lựa chọn an toàn là gì?", a: "Chuyển vào nơi có mái che", opts: ["Chuyển vào nơi có mái che", "Chạy giữa đường", "Đứng dưới cây cao lúc giông", "Cầm thiết bị điện ngoài mưa"] },
        { q: "Khi đèn lồng điện bị hỏng dây, nên làm gì?", a: "Ngừng sử dụng và nhờ người lớn kiểm tra", opts: ["Ngừng sử dụng và nhờ người lớn kiểm tra", "Tiếp tục dùng", "Nhúng vào nước", "Tự nối khi tay ướt"] },
        { q: "Khi chia bánh cho nhiều người, dụng cụ nào phù hợp nhất?", a: "Dao sạch và đĩa", opts: ["Dao sạch và đĩa", "Kéo cắt giấy bẩn", "Bút chì", "Thước kẻ"] },
        { q: "Trước khi ăn bánh, việc vệ sinh đơn giản nên làm là gì?", a: "Rửa tay", opts: ["Rửa tay", "Chạm tay xuống đất", "Bỏ bánh ra nền", "Không cần làm gì"] },
    ]);

    const state = {
        serverOffset: 0,
        calendar: null,
        annual: null,
        claims: {},
        activeGameCleanup: null,
        gameCompleting: false,
        gameToken: 0,
        open: false,
        busy: false,
        statusTimer: null,
        testMode: false,
        activeAttempt: null
    };

    // Accessibility: remember the control that opened the modal so focus can
    // be restored BEFORE the modal is hidden from assistive technologies.
    let lastFocusedBeforeOpen = null;

    function isUsableFocusTarget(element) {
        return Boolean(
            element &&
            element.isConnected &&
            typeof element.focus === 'function' &&
            !element.disabled &&
            element.getAttribute?.('aria-hidden') !== 'true'
        );
    }

    function restoreFocusOutsideModal(modal) {
        const active = document.activeElement;
        if (!modal || !active || !modal.contains(active)) return;

        const preferred =
            isUsableFocusTarget(lastFocusedBeforeOpen) &&
            !modal.contains(lastFocusedBeforeOpen)
                ? lastFocusedBeforeOpen
                : null;

        const fallback =
            document.getElementById('mafOpenBtn') ||
            document.getElementById('studentGameNav');

        const target =
            preferred ||
            (
                isUsableFocusTarget(fallback) &&
                !modal.contains(fallback)
                    ? fallback
                    : null
            );

        if (target) {
            try {
                target.focus({ preventScroll: true });
                return;
            } catch (_) { }
        }

        // Last resort: make sure focus no longer remains inside the modal.
        try {
            active.blur();
        } catch (_) { }
    }

    function getDatabase() {
        try {
            if (typeof db !== 'undefined' && db && typeof db.ref === 'function') return db;
        } catch (_) { }
        return window.db && typeof window.db.ref === 'function' ? window.db : null;
    }

    function getUser() {
        try {
            if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
        } catch (_) { }
        try {
            return JSON.parse(localStorage.getItem('currentUser') || 'null');
        } catch (_) {
            return null;
        }
    }

    function username() {
        return String(getUser()?.username || '').trim();
    }

    function showToast(message, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }

    function now() {
        return Date.now() + Number(state.serverOffset || 0);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function shuffle(items) {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function getVietnamYear(timestamp = now()) {
        if (window.MidAutumnCalendar?.getVietnamYear) {
            return window.MidAutumnCalendar.getVietnamYear(timestamp);
        }
        return new Date(timestamp + 7 * 60 * 60 * 1000).getUTCFullYear();
    }

    function formatFestivalDate(dateKey) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || ''))) return String(dateKey || '');
        const [y, m, d] = dateKey.split('-');
        return `${d}/${m}/${y}`;
    }

    function stateRef(year) {
        return getDatabase().ref(`${CONFIG.stateRoot}/${username()}/${year}`);
    }

    function claimRef(year, milestone) {
        return getDatabase().ref(`${CONFIG.rewardRoot}/${username()}/mid_autumn/${year}/${milestone}`);
    }

    function walletRef() {
        return getDatabase().ref(`mid_autumn_wallets/${username()}`);
    }

    async function syncServerTime() {
        const database = getDatabase();
        if (!database) return;
        try {
            const snap = await database.ref('.info/serverTimeOffset').once('value');
            state.serverOffset = Number(snap.val() || 0);
        } catch (_) {
            state.serverOffset = 0;
        }
    }

    async function loadCalendar(year) {
        const database = getDatabase();
        let localInfo = null;
        try {
            localInfo = window.MidAutumnCalendar?.getFestivalInfo?.(year) || null;
        } catch (_) { }

        if (database) {
            try {
                const snap = await database.ref(`mid_autumn_calendar/${year}`).once('value');
                const remote = snap.val();
                if (remote && Number(remote.festivalStartAt) > 0 && Number(remote.festivalEndAt) > 0) {
                    state.calendar = {
                        ...(localInfo || {}),
                        ...remote,
                        year: Number(remote.year || year),
                        remoteConfigured: true
                    };
                    return state.calendar;
                }
            } catch (error) {
                console.warn('[Đại Hội Trung Thu] Không đọc được lịch Firebase:', error);
            }
        }

        /*
         * Không hard-code ngày dương. Nếu lịch năm nay chưa tồn tại trên
         * Firebase, dùng chính kết quả 15/8 âm lịch do MidAutumnCalendar tính.
         * Từ D-5 đến hết ngày Trung Thu, thử đồng bộ bản ghi năm hiện tại để
         * cả Đại Hội và cơ chế tự tặng Xu dùng chung một lịch server.
         */
        if (database && localInfo) {
            const t = now();
            const canBootstrap =
                t >= Number(localInfo.autoGrantStartAt) &&
                t <= Number(localInfo.autoGrantEndAt);

            if (canBootstrap) {
                try {
                    const calendarRef =
                        database.ref(`mid_autumn_calendar/${year}`);

                    const tx =
                        await calendarRef.transaction(
                            current => {
                                if (current && typeof current === 'object') {
                                    return current;
                                }

                                return {
                                    year: String(year),
                                    festivalDateKey: String(localInfo.festivalDateKey || ''),
                                    festivalStartAt: Number(localInfo.festivalStartAt),
                                    festivalEndAt: Number(localInfo.festivalEndAt),
                                    autoGrantStartAt: Number(localInfo.autoGrantStartAt),
                                    autoGrantEndAt: Number(localInfo.autoGrantEndAt),
                                    updatedAt: t
                                };
                            },
                            undefined,
                            false
                        );

                    const synced = tx.snapshot?.val();
                    if (
                        synced &&
                        Number(synced.festivalStartAt) > 0 &&
                        Number(synced.festivalEndAt) > 0
                    ) {
                        state.calendar = {
                            ...localInfo,
                            ...synced,
                            year: Number(synced.year || year),
                            remoteConfigured: true
                        };
                        return state.calendar;
                    }
                } catch (error) {
                    console.warn(
                        '[Đại Hội Trung Thu] Chưa thể tự đồng bộ lịch năm hiện tại:',
                        error
                    );
                }
            }
        }

        state.calendar = localInfo ? { ...localInfo, remoteConfigured: false } : null;
        return state.calendar;
    }

    async function getEventStatus() {
        if (state.testMode) {
            const year = getVietnamYear();
            let localInfo = null;
            try {
                localInfo = window.MidAutumnCalendar?.getFestivalInfo?.(year) || null;
            } catch (_) { }

            const t = now();
            const calendar = {
                ...(localInfo || {}),
                year,
                festivalDateKey:
                    String(localInfo?.festivalDateKey || 'TEST'),
                festivalStartAt:
                    t - 60 * 60 * 1000,
                festivalEndAt:
                    t + 24 * 60 * 60 * 1000,
                autoGrantStartAt:
                    t - 5 * 24 * 60 * 60 * 1000,
                autoGrantEndAt:
                    t + 24 * 60 * 60 * 1000,
                remoteConfigured: true,
                testMode: true
            };

            state.calendar = calendar;

            return {
                active: true,
                year,
                calendar,
                reason: 'test',
                testMode: true
            };
        }

        const year = getVietnamYear();
        const calendar = await loadCalendar(year);
        if (!calendar) {
            return { active: false, year, calendar: null, reason: 'calendar_missing' };
        }
        const t = now();
        return {
            active: t >= Number(calendar.festivalStartAt) && t <= Number(calendar.festivalEndAt),
            year,
            calendar,
            reason: t < Number(calendar.festivalStartAt) ? 'upcoming' : 'ended'
        };
    }

    function ticketsRemaining(data = state.annual) {
        if (!data) return 0;
        return Math.max(
            0,
            Number(data.ticketsGranted || 0) +
            Number(data.ticketsPurchased || 0) -
            Number(data.ticketsUsed || 0)
        );
    }

    function normalizedScore(data = state.annual) {
        return Math.max(0, Math.min(100, Number(data?.totalScore || 0)));
    }

    function pendingAttemptStorageKey() {
        const user = username();
        return user ? `maf_pending_attempt_${user}` : '';
    }

    function savePendingAttempt(attempt) {
        if (state.testMode || !attempt) return;
        const key = pendingAttemptStorageKey();
        if (!key) return;
        try {
            localStorage.setItem(key, JSON.stringify(attempt));
        } catch (_) { }
    }

    function clearPendingAttemptStorage() {
        const key = pendingAttemptStorageKey();
        if (!key) return;
        try {
            localStorage.removeItem(key);
        } catch (_) { }
    }

    function readPendingAttemptStorage() {
        const key = pendingAttemptStorageKey();
        if (!key) return null;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed;
        } catch (_) {
            return null;
        }
    }

    function beginGameAttempt(gameId) {
        const year = String(state.annual?.year || getVietnamYear());
        const attempt = {
            id: `${year}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            gameId: String(gameId || ''),
            year,
            startedAt: now(),
            settled: false,
            settling: false
        };
        state.activeAttempt = attempt;
        savePendingAttempt(attempt);
        return attempt;
    }

    function markAttemptCompleted() {
        if (state.activeAttempt) {
            state.activeAttempt.settled = true;
        }
        clearPendingAttemptStorage();
        state.activeAttempt = null;
    }

    async function consumeAbandonedTicket(reason = 'exit', attempt = state.activeAttempt, options = {}) {
        if (!attempt || attempt.settled) return false;
        if (attempt.settling) return attempt.settling;

        const silent = options.silent === true;
        const task = (async () => {
            if (state.testMode) {
                if (!state.annual) return false;
                const granted = Number(state.annual.ticketsGranted || 0);
                const purchased = Number(state.annual.ticketsPurchased || 0);
                const used = Number(state.annual.ticketsUsed || 0);
                if (used < granted + purchased) {
                    state.annual = {
                        ...state.annual,
                        ticketsUsed: used + 1,
                        updatedAt: now(),
                        testMode: true
                    };
                }
                attempt.settled = true;
                state.activeAttempt = null;
                if (!silent) {
                    showToast('🎟️ Đã mất 1 vé vì thoát trò chơi giữa chừng.', 'warning');
                }
                return true;
            }

            const year = String(attempt.year || state.annual?.year || getVietnamYear());
            const tx = await stateRef(year).transaction(current => {
                if (!current) return;
                const granted = Number(current.ticketsGranted || 0);
                const purchased = Number(current.ticketsPurchased || 0);
                const used = Number(current.ticketsUsed || 0);
                if (used >= granted + purchased) return current;
                return {
                    ...current,
                    ticketsUsed: used + 1,
                    updatedAt: now()
                };
            }, undefined, false);

            if (!tx.committed) {
                throw new Error('ABANDON_TICKET_FAILED');
            }

            state.annual = tx.snapshot.val() || state.annual;
            attempt.settled = true;
            clearPendingAttemptStorage();
            if (state.activeAttempt?.id === attempt.id) {
                state.activeAttempt = null;
            }

            if (!silent) {
                showToast('🎟️ Đã mất 1 vé vì thoát trò chơi giữa chừng.', 'warning');
            }
            return true;
        })();

        attempt.settling = task;
        try {
            return await task;
        } finally {
            attempt.settling = false;
        }
    }

    async function reconcileAbandonedAttempt() {
        if (state.testMode) return;
        const pending = readPendingAttemptStorage();
        if (!pending || pending.settled) {
            clearPendingAttemptStorage();
            return;
        }

        try {
            await consumeAbandonedTicket('reload', pending, { silent: true });
            showToast('🎟️ Lượt chơi trước bị bỏ dở nên hệ thống đã trừ 1 vé.', 'warning');
        } catch (error) {
            console.warn('[Đại Hội Trung Thu] Chưa thể xử lý lượt chơi bỏ dở:', error);
        }
    }

    async function ensureAnnualState(status) {
        if (!status?.active) return null;

        if (state.testMode) {
            if (
                !state.annual ||
                String(state.annual.year || '') !==
                    String(status.year)
            ) {
                const t = now();
                state.annual = {
                    eventId: EVENT_ID,
                    year: String(status.year),
                    festivalDateKey:
                        String(
                            status.calendar?.festivalDateKey ||
                            'TEST'
                        ),
                    ticketsGranted: CONFIG.baseTickets,
                    ticketsPurchased: 0,
                    ticketsUsed: 0,
                    totalScore: 0,
                    openedAt: t,
                    updatedAt: t,
                    testMode: true
                };
            }
            return state.annual;
        }

        if (!status.calendar?.remoteConfigured) {
            throw new Error('MID_AUTUMN_REMOTE_CALENDAR_REQUIRED');
        }

        const t = now();
        const ref = stateRef(status.year);
        const existing = await ref.once('value');
        if (existing.exists()) {
            state.annual = existing.val();
            return state.annual;
        }

        const tx = await ref.transaction(current => {
            if (current && typeof current === 'object') return;
            return {
                eventId: EVENT_ID,
                year: String(status.year),
                festivalDateKey: String(status.calendar.festivalDateKey || ''),
                ticketsGranted: CONFIG.baseTickets,
                ticketsPurchased: 0,
                ticketsUsed: 0,
                totalScore: 0,
                openedAt: t,
                updatedAt: t
            };
        }, undefined, false);

        if (!tx.committed) {
            const latest = await ref.once('value');
            if (!latest.exists()) throw new Error('Không thể khởi tạo dữ liệu sự kiện.');
            state.annual = latest.val();
            return state.annual;
        }
        state.annual = tx.snapshot.val();
        return state.annual;
    }

    async function loadAnnualState(year) {
        if (state.testMode) {
            return state.annual;
        }

        const snap = await stateRef(year).once('value');
        state.annual = snap.val() || null;
        return state.annual;
    }

    async function loadClaims(year) {
        if (state.testMode) {
            state.claims = state.claims || {};
            return state.claims;
        }

        const snap = await getDatabase()
            .ref(`${CONFIG.rewardRoot}/${username()}/mid_autumn/${year}`)
            .once('value');
        state.claims = snap.val() || {};
        return state.claims;
    }

    function injectCard() {
        if (document.getElementById('midAutumnFestivalCard')) return;
        const activeView = document.getElementById('gameActiveView');
        if (!activeView) return;

        const card = document.createElement('section');
        card.id = 'midAutumnFestivalCard';
        card.className = 'card maf-card ui-theme-immune';
        card.dataset.eventState = 'loading';
        card.innerHTML = `
            <div class="maf-card-moon" aria-hidden="true">🌕</div>
            <div class="maf-card-copy">
                <div class="maf-eyebrow">🏮 SỰ KIỆN HẰNG NĂM · 15/8 ÂM LỊCH</div>
                <h3>ĐẠI HỘI TRUNG THU</h3>
                <p id="mafCardDesc">Đang kiểm tra lịch Trung Thu...</p>
                <div class="maf-card-meta" id="mafCardMeta"></div>
            </div>
            <div class="maf-card-actions">
                <button type="button" class="maf-btn maf-btn-ghost" data-maf-action="rules">🎁 Phần thưởng</button>
                <button type="button" class="maf-btn maf-btn-primary" id="mafOpenBtn" data-maf-action="open">Vào đại hội ➡️</button>
            </div>`;

        const royal = document.getElementById('royalEventCard');
        if (royal?.parentNode === activeView) activeView.insertBefore(card, royal);
        else activeView.appendChild(card);

        card.addEventListener('click', event => {
            const button = event.target.closest('[data-maf-action]');
            if (!button) return;
            if (button.dataset.mafAction === 'open') api.open();
            if (button.dataset.mafAction === 'rules') api.showRewards();
        });
    }

    function ensureModal() {
        let modal = document.getElementById('midAutumnFestivalModal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'midAutumnFestivalModal';
        modal.className = 'maf-modal ui-theme-immune';
        modal.setAttribute('aria-hidden', 'true');
        modal.inert = true;
        modal.innerHTML = `
            <div class="maf-modal-backdrop" data-maf-action="close"></div>
            <section class="maf-shell" role="dialog" aria-modal="true" aria-labelledby="mafTitle">
                <header class="maf-header">
                    <div>
                        <div class="maf-eyebrow">🌙 NGUYỆT HỘI · ĐÊM TRĂNG RẰM</div>
                        <h2 id="mafTitle">Đại Hội Trung Thu</h2>
                        <p id="mafDateText">15/8 Âm lịch</p>
                    </div>
                    <button class="maf-icon-btn" type="button" data-maf-action="close" aria-label="Đóng">✕</button>
                </header>
                <div class="maf-body">
                    <div id="mafLockedNotice" class="maf-locked" hidden></div>
                    <div id="mafDashboard">
                        <div class="maf-stat-row">
                            <div class="maf-stat"><span>🎟️ Vé còn lại</span><strong id="mafTicketCount">0</strong></div>
                            <div class="maf-stat"><span>✨ Điểm đại hội</span><strong id="mafScoreCount">0/100</strong></div>
                            <div class="maf-stat"><span>🌕 Xu Trung Thu</span><strong data-midautumn-coin-balance>0</strong></div>
                        </div>

                        <section class="maf-progress-panel">
                            <div class="maf-progress-head">
                                <strong>Tiến độ phần thưởng</strong>
                                <span id="mafProgressPercent">0%</span>
                            </div>
                            <div class="maf-progress-track"><i id="mafProgressBar"></i></div>
                            <div id="mafMilestones" class="maf-milestones"></div>
                        </section>

                        <section class="maf-ticket-shop">
                            <div>
                                <strong>🎫 Quầy Vé Nguyệt Hội</strong>
                                <p>Mở sự kiện lần đầu trong năm nhận 2 vé. Có thể mua thêm tối đa 4 vé/năm.</p>
                            </div>
                            <button id="mafBuyTicketBtn" class="maf-btn maf-btn-ticket" type="button" data-maf-action="buy-ticket"></button>
                        </section>

                        <div id="mafLobby">
                            <div class="maf-section-title">
                                <div><span>🎮</span><div><strong>Chọn trò chơi</strong><small>Bắt đầu lượt sẽ khóa 1 vé · thoát giữa chừng vẫn mất vé · tối đa 30 điểm/lượt</small></div></div>
                            </div>
                            <div id="mafGameGrid" class="maf-game-grid"></div>
                        </div>

                        <div id="mafGameStage" class="maf-game-stage" hidden></div>
                    </div>
                </div>
            </section>`;
        document.body.appendChild(modal);

        modal.addEventListener('click', event => {
            const action = event.target.closest('[data-maf-action]')?.dataset.mafAction;
            if (!action) return;
            if (action === 'close') api.close();
            if (action === 'buy-ticket') buyTicket();
            if (action === 'back-lobby') backToLobby().catch(error => console.error('[Đại Hội Trung Thu] Thoát game lỗi:', error));
            if (action === 'claim') claimMilestone(Number(event.target.closest('[data-maf-milestone]')?.dataset.mafMilestone));
            if (action === 'play') startGame(event.target.closest('[data-game-id]')?.dataset.gameId);
        });

        return modal;
    }

    function renderGameGrid() {
        const grid = document.getElementById('mafGameGrid');
        if (!grid) return;
        const noTickets = ticketsRemaining() <= 0;
        grid.innerHTML = GAME_DEFS.map(game => `
            <article class="maf-game-card">
                <div class="maf-game-icon">${game.icon}</div>
                <h4>${escapeHtml(game.name)}</h4>
                <p>${escapeHtml(game.desc)}</p>
                <button class="maf-btn maf-btn-game" type="button" data-maf-action="play" data-game-id="${game.id}" ${noTickets ? 'disabled' : ''}>
                    ${noTickets ? 'Hết vé' : 'Chơi ngay'}
                </button>
            </article>`).join('');
    }

    function rewardStatus(milestone) {
        const claim = state.claims?.[String(milestone.score)] || state.claims?.[milestone.score];
        if (claim?.status === 'completed') return 'completed';
        if (claim?.status === 'reserved') return 'reserved';
        if (normalizedScore() >= milestone.score) return 'available';
        return 'locked';
    }

    function renderMilestones() {
        const root = document.getElementById('mafMilestones');
        if (!root) return;
        root.innerHTML = CONFIG.milestones.map(m => {
            const status = rewardStatus(m);
            const button = status === 'available'
                ? `<button type="button" class="maf-claim-btn" data-maf-action="claim" data-maf-milestone="${m.score}">Nhận</button>`
                : status === 'reserved'
                    ? `<button type="button" class="maf-claim-btn maf-claim-retry" data-maf-action="claim" data-maf-milestone="${m.score}">Nhận lại</button>`
                    : `<span class="maf-reward-state">${status === 'completed' ? '✓ Đã nhận' : '🔒'}</span>`;
            return `
                <div class="maf-milestone maf-${status}" data-score="${m.score}">
                    <div class="maf-milestone-icon">${m.icon}</div>
                    <strong>${m.score} điểm</strong>
                    <span>${escapeHtml(m.label)}</span>
                    ${button}
                </div>`;
        }).join('');
    }

    function renderDashboard(status) {
        const modal = ensureModal();
        const locked = document.getElementById('mafLockedNotice');
        const dashboard = document.getElementById('mafDashboard');
        const dateText = document.getElementById('mafDateText');
        if (dateText && status?.calendar) {
            dateText.textContent = `Trung Thu ${status.year}: ${formatFestivalDate(status.calendar.festivalDateKey)}`;
        }

        if (!status?.active) {
            locked.hidden = false;
            dashboard.classList.add('maf-is-preview');
            const date = status?.calendar?.festivalDateKey ? formatFestivalDate(status.calendar.festivalDateKey) : 'chưa xác định';
            locked.innerHTML = `<strong>🔒 Đại hội chưa mở</strong><p>Sự kiện chỉ diễn ra đúng ngày Trung Thu hằng năm. Lịch năm ${status?.year || ''}: <b>${escapeHtml(date)}</b>.</p>`;
        } else if (!status.calendar?.remoteConfigured) {
            locked.hidden = false;
            dashboard.classList.add('maf-is-preview');
            locked.innerHTML = `<strong>⚠️ Chưa có lịch Trung Thu trên Firebase</strong><p>Ngày âm lịch đã tính được ở trình duyệt nhưng Firebase Rules cần bản ghi <code>mid_autumn_calendar/${status.year}</code> để xác thực giao dịch.</p>`;
        } else {
            locked.hidden = true;
            dashboard.classList.remove('maf-is-preview');
        }

        const score = normalizedScore();
        const remaining = ticketsRemaining();
        const ticketEl = document.getElementById('mafTicketCount');
        const scoreEl = document.getElementById('mafScoreCount');
        const progressBar = document.getElementById('mafProgressBar');
        const percent = document.getElementById('mafProgressPercent');
        if (ticketEl) ticketEl.textContent = String(remaining);
        if (scoreEl) scoreEl.textContent = `${score}/100`;
        if (progressBar) progressBar.style.width = `${score}%`;
        if (percent) percent.textContent = `${score}%`;

        const walletBalance = Math.max(0, Number(window.studentMidAutumnCoinBalance || 0));
        modal.querySelectorAll('[data-midautumn-coin-balance]').forEach(el => {
            el.textContent = walletBalance.toLocaleString('vi-VN');
        });

        const purchased = Number(state.annual?.ticketsPurchased || 0);
        const buyBtn = document.getElementById('mafBuyTicketBtn');
        if (buyBtn) {
            const left = Math.max(0, CONFIG.maxExtraTickets - purchased);
            buyBtn.textContent = left > 0
                ? `Mua 1 vé · ${CONFIG.extraTicketPrice} Coin (${left} lượt mua còn lại)`
                : 'Đã mua tối đa 4 vé/năm';
            buyBtn.disabled = !status?.active || !state.annual || left <= 0;
        }

        renderMilestones();
        renderGameGrid();
    }

    async function renderCardStatus() {
        injectCard();
        const card = document.getElementById('midAutumnFestivalCard');
        if (!card) return;
        try {
            const status = await getEventStatus();
            const desc = document.getElementById('mafCardDesc');
            const meta = document.getElementById('mafCardMeta');
            const btn = document.getElementById('mafOpenBtn');
            const date = status.calendar?.festivalDateKey ? formatFestivalDate(status.calendar.festivalDateKey) : 'Chưa xác định';

            if (status.active) {
                card.dataset.eventState = 'active';
                if (state.testMode) {
                    if (desc) desc.textContent = '🧪 CHẾ ĐỘ TEST: dữ liệu chỉ tồn tại trong RAM, F5 là về bình thường.';
                    if (meta) meta.innerHTML = `<span>🧪 Test Mode</span><span>🎟️ 2 vé thử</span><span>✨ Không ghi Firebase</span>`;
                    if (btn) btn.textContent = 'Chơi thử ➡️';
                } else {
                    if (desc) desc.textContent = 'Đêm hội đã mở! Chơi 5 minigame, tích điểm và chinh phục mốc 100.';
                    if (meta) meta.innerHTML = `<span>🗓️ ${date}</span><span>🎟️ 2 vé miễn phí</span><span>✨ Tối đa 100 điểm</span>`;
                    if (btn) btn.textContent = 'Vào đại hội ➡️';
                }
            } else {
                card.dataset.eventState = status.reason === 'ended' ? 'ended' : 'upcoming';
                if (desc) desc.textContent = `Sự kiện chỉ mở đúng ngày Trung Thu ${status.year}.`;
                if (meta) meta.innerHTML = `<span>🗓️ ${date}</span><span>🏮 15/8 Âm lịch</span>`;
                if (btn) btn.textContent = 'Xem sự kiện';
            }
        } catch (error) {
            card.dataset.eventState = 'error';
            const desc = document.getElementById('mafCardDesc');
            if (desc) desc.textContent = 'Không thể kiểm tra lịch sự kiện lúc này.';
            console.error('[Đại Hội Trung Thu] render card:', error);
        }
    }

    async function buyTicket() {
        if (state.busy) return;
        state.busy = true;
        const button = document.getElementById('mafBuyTicketBtn');
        if (button) button.disabled = true;

        let coinDebited = false;
        try {
            const status = await getEventStatus();

            if (state.testMode) {
                if (!state.annual) {
                    await ensureAnnualState(status);
                }

                if (
                    Number(
                        state.annual
                            .ticketsPurchased || 0
                    ) >=
                    CONFIG.maxExtraTickets
                ) {
                    throw new Error(
                        'PURCHASE_LIMIT'
                    );
                }

                state.annual = {
                    ...state.annual,
                    ticketsPurchased:
                        Number(
                            state.annual
                                .ticketsPurchased || 0
                        ) + 1,
                    updatedAt: now()
                };

                showToast(
                    `🧪 TEST: +1 vé thử. Không trừ ${CONFIG.extraTicketPrice} Coin thật.`,
                    'success'
                );

                renderDashboard(status);
                return;
            }
            if (!status.active) throw new Error('EVENT_CLOSED');
            if (!state.annual) await ensureAnnualState(status);

            if (Number(state.annual.ticketsPurchased || 0) >= CONFIG.maxExtraTickets) {
                throw new Error('PURCHASE_LIMIT');
            }

            if (!confirm(`Dùng ${CONFIG.extraTicketPrice} Coin để mua 1 Vé Đại Hội Trung Thu?\nMỗi năm chỉ mua tối đa ${CONFIG.maxExtraTickets} vé.`)) return;

            const coinRef = getDatabase().ref(`student_coins/${username()}`);
            const coinTx = await coinRef.transaction(current => {
                const balance = Number(current || 0);
                if (balance < CONFIG.extraTicketPrice) return;
                return balance - CONFIG.extraTicketPrice;
            });
            if (!coinTx.committed) throw new Error('INSUFFICIENT_COINS');
            coinDebited = true;

            const eventTx = await stateRef(status.year).transaction(current => {
                if (!current || Number(current.ticketsPurchased || 0) >= CONFIG.maxExtraTickets) return;
                return {
                    ...current,
                    ticketsPurchased: Number(current.ticketsPurchased || 0) + 1,
                    updatedAt: now()
                };
            }, undefined, false);

            if (!eventTx.committed) throw new Error('PURCHASE_LIMIT');
            state.annual = eventTx.snapshot.val();
            coinDebited = false;
            showToast(`🎟️ Mua vé thành công! Đã trừ ${CONFIG.extraTicketPrice} Coin.`, 'success');
            renderDashboard(status);
        } catch (error) {
            if (coinDebited) {
                try {
                    await getDatabase().ref(`student_coins/${username()}`).transaction(current => Number(current || 0) + CONFIG.extraTicketPrice);
                } catch (rollbackError) {
                    console.error('[Đại Hội Trung Thu] Không hoàn Coin được:', rollbackError);
                }
            }
            const messages = {
                EVENT_CLOSED: 'Sự kiện hiện chưa mở.',
                PURCHASE_LIMIT: 'Bạn đã mua tối đa 4 vé trong sự kiện năm nay.',
                INSUFFICIENT_COINS: `Bạn không đủ ${CONFIG.extraTicketPrice} Coin để mua vé.`
            };
            showToast(messages[error.message] || `Không mua được vé: ${error.message}`, 'error');
        } finally {
            state.busy = false;
            const status = await getEventStatus().catch(() => null);
            if (status) renderDashboard(status);
        }
    }

    async function chooseBackgroundReward(year) {
        const inventory = await getDatabase().ref(`student_inventory/${username()}`).once('value');
        for (const itemId of CONFIG.backgroundRewards) {
            if (!inventory.child(itemId).exists()) return itemId;
        }
        return CONFIG.backgroundRewards[(Number(year) + username().length) % CONFIG.backgroundRewards.length];
    }

    function rewardPayload(year, milestone, itemId = '') {
        const m = CONFIG.milestones.find(row => row.score === milestone);
        if (!m) throw new Error('INVALID_MILESTONE');
        const payload = {
            eventId: EVENT_ID,
            year: String(year),
            milestone,
            status: 'reserved',
            rewardType: m.type,
            amount: Number(m.amount || 0),
            source: EVENT_ID,
            reservedAt: now()
        };
        if (m.type === 'background') payload.itemId = itemId;
        return payload;
    }

    async function reserveClaim(year, milestone) {
        const m = CONFIG.milestones.find(row => row.score === milestone);
        if (!m) throw new Error('INVALID_MILESTONE');
        let itemId = '';
        if (m.type === 'background') itemId = await chooseBackgroundReward(year);
        const payload = rewardPayload(year, milestone, itemId);
        const ref = claimRef(year, milestone);
        const existing = await ref.once('value');
        if (existing.exists()) {
            const claim = existing.val();
            state.claims[String(milestone)] = claim;
            return claim;
        }
        const tx = await ref.transaction(current => current ? undefined : payload, undefined, false);
        if (!tx.committed) {
            const latest = await ref.once('value');
            if (!latest.exists()) throw new Error('CLAIM_RESERVE_FAILED');
            state.claims[String(milestone)] = latest.val();
            return latest.val();
        }
        const claim = tx.snapshot.val();
        state.claims[String(milestone)] = claim;
        return claim;
    }

    async function completeClaim(year, milestone, extras = {}) {
        const ref = claimRef(year, milestone);
        await ref.transaction(current => {
            if (!current) return;
            if (current.status === 'completed') return current;
            return {
                ...current,
                ...extras,
                status: 'completed',
                completedAt: now()
            };
        }, undefined, false);
        const snap = await ref.once('value');
        state.claims[String(milestone)] = snap.val();
    }

    async function grantWalletEventCoin(year, milestone) {
        const database = getDatabase();
        const rewardId = `${year}_${milestone}`;
        const ref = walletRef();
        const claim = state.claims[String(milestone)];
        if (!claim || claim.status === 'completed') return;

        const existingWallet = await ref.once('value');
        if (existingWallet.child(`eventRewards/${rewardId}`).exists()) {
            window.studentMidAutumnCoinBalance = Math.max(0, Number(existingWallet.child('balance').val() || 0));
            return;
        }

        const tx = await ref.transaction(current => {
            const wallet = current && typeof current === 'object' ? { ...current } : {};
            wallet.balance = Math.max(0, Number(wallet.balance || 0));
            wallet.eventRewards = { ...(wallet.eventRewards || {}) };
            wallet.autoGrants = { ...(wallet.autoGrants || {}) };
            wallet.teacherGrants = { ...(wallet.teacherGrants || {}) };
            wallet.teacherClaims = { ...(wallet.teacherClaims || {}) };
            wallet.redemptions = { ...(wallet.redemptions || {}) };

            if (wallet.eventRewards[rewardId]) return wallet;

            const t = now();
            wallet.balance += 1;
            wallet.eventRewards[rewardId] = {
                id: rewardId,
                year: String(year),
                milestone,
                amount: 1,
                source: EVENT_ID,
                grantedAt: t
            };
            wallet.lastOperation = {
                type: 'event_reward',
                operationId: rewardId,
                year: String(year),
                milestone,
                amount: 1,
                operatedAt: t
            };
            return wallet;
        }, undefined, false);

        if (!tx.committed) throw new Error('WALLET_REWARD_FAILED');
        window.studentMidAutumnCoinBalance = Math.max(0, Number(tx.snapshot.val()?.balance || 0));
    }

    async function applyClaim(year, milestone) {
        const claim = state.claims[String(milestone)] || await reserveClaim(year, milestone);
        if (!claim) throw new Error('CLAIM_NOT_FOUND');
        if (claim.status === 'completed') return;

        if (claim.rewardType === 'coin') {
            const amount = Number(claim.amount || 0);
            if (amount <= 0) throw new Error('INVALID_COIN_REWARD');
            // One atomic update: the terminal claim rule rejects concurrent/replayed grants.
            const completed = { ...claim, status: 'completed', completedAt: now() };
            const updates = {
                [`student_coins/${username()}`]: firebase.database.ServerValue.increment(amount),
                [`student_event_rewards/${username()}/mid_autumn/${year}/${milestone}`]: completed
            };
            try {
                await getDatabase().ref().update(updates);
                state.claims[String(milestone)] = completed;
            } catch (error) {
                const latest = await claimRef(year, milestone).once('value');
                if (latest.child('status').val() !== 'completed') throw error;
                state.claims[String(milestone)] = latest.val();
            }
            showToast(`🎉 Đã nhận ${amount} Coin từ Đại Hội Trung Thu!`, 'success');
            return;
        }

        if (claim.rewardType === 'mid_autumn_coin') {
            await grantWalletEventCoin(year, milestone);
            await completeClaim(year, milestone);
            showToast('🌕 Đã nhận 1 Xu Trung Thu!', 'success');
            return;
        }

        if (claim.rewardType === 'background') {
            const itemId = String(claim.itemId || '');
            if (!CONFIG.backgroundRewards.includes(itemId)) throw new Error('INVALID_BACKGROUND_REWARD');

            let inventorySnap = await getDatabase().ref(`student_inventory/${username()}/${itemId}`).once('value');
            if (!inventorySnap.exists()) {
                await grantWalletEventCoin(year, milestone);
                if (!window.MidAutumnCoinManager?.redeem) throw new Error('MID_AUTUMN_MANAGER_NOT_READY');
                await window.MidAutumnCoinManager.redeem(itemId);
                inventorySnap = await getDatabase().ref(`student_inventory/${username()}/${itemId}`).once('value');
            }

            if (!inventorySnap.exists()) {
                throw new Error('BACKGROUND_REDEEM_INCOMPLETE');
            }
            await completeClaim(year, milestone, { itemId });
            showToast('🏮 Đã nhận Nền web Trung Thu!', 'success');
            return;
        }

        throw new Error('UNKNOWN_REWARD_TYPE');
    }

    async function claimMilestone(milestone) {
        if (state.busy || !milestone) return;
        const m = CONFIG.milestones.find(row => row.score === milestone);
        if (!m) return;
        if (normalizedScore() < milestone) {
            showToast(`Bạn cần đạt ${milestone} điểm để nhận mốc này.`, 'warning');
            return;
        }

        if (state.testMode) {
            state.claims[String(milestone)] = {
                eventId: EVENT_ID,
                year:
                    String(
                        state.annual?.year ||
                        getVietnamYear()
                    ),
                milestone,
                status: 'completed',
                rewardType: m.type,
                amount: Number(m.amount || 0),
                source: `${EVENT_ID}_test`,
                completedAt: now(),
                testMode: true
            };

            showToast(
                `🧪 TEST: giả lập nhận “${m.label}”. Không cộng phần thưởng thật.`,
                'success'
            );

            const status =
                await getEventStatus();

            renderDashboard(status);
            return;
        }

        state.busy = true;
        try {
            const status = await getEventStatus();
            if (!status.active) throw new Error('EVENT_CLOSED');
            await reserveClaim(status.year, milestone);
            await applyClaim(status.year, milestone);
            await loadClaims(status.year);
            renderDashboard(status);
        } catch (error) {
            console.error('[Đại Hội Trung Thu] Nhận thưởng lỗi:', error);
            const map = {
                EVENT_CLOSED: 'Sự kiện đã đóng, không thể nhận mốc lúc này.',
                MID_AUTUMN_REMOTE_CALENDAR_REQUIRED: 'Firebase chưa có lịch Trung Thu năm nay.',
                MID_AUTUMN_MANAGER_NOT_READY: 'Hệ Xu Trung Thu chưa sẵn sàng. Hãy tải lại trang rồi thử lại.',
                BACKGROUND_REDEEM_INCOMPLETE: 'Chưa hoàn tất việc thêm nền Trung Thu. Mốc thưởng được giữ lại để bạn thử lại.',
                WALLET_REWARD_FAILED: 'Firebase Rules chưa cho phép thưởng Xu Trung Thu từ Đại hội.'
            };
            showToast(map[error.message] || `Chưa nhận được phần thưởng: ${error.message}`, 'error');
        } finally {
            state.busy = false;
        }
    }

    async function commitGameScore(gameId, rawScore) {
        const status = await getEventStatus();
        if (!status.active) throw new Error('EVENT_CLOSED');
        const score = Math.max(0, Math.min(CONFIG.maxScorePerPlay, Math.floor(Number(rawScore) || 0)));

        if (state.testMode) {
            if (!state.annual) {
                await ensureAnnualState(status);
            }

            const granted =
                Number(
                    state.annual
                        .ticketsGranted || 0
                );

            const purchased =
                Number(
                    state.annual
                        .ticketsPurchased || 0
                );

            const used =
                Number(
                    state.annual
                        .ticketsUsed || 0
                );

            if (
                used >=
                granted + purchased
            ) {
                throw new Error(
                    'NO_TICKETS'
                );
            }

            state.annual = {
                ...state.annual,
                ticketsUsed:
                    used + 1,
                totalScore:
                    Math.min(
                        100,
                        Number(
                            state.annual
                                .totalScore || 0
                        ) +
                        score
                    ),
                updatedAt: now(),
                testMode: true
            };

            renderDashboard(status);
            return score;
        }

        const tx = await stateRef(status.year).transaction(current => {
            if (!current) return;
            const granted = Number(current.ticketsGranted || 0);
            const purchased = Number(current.ticketsPurchased || 0);
            const used = Number(current.ticketsUsed || 0);
            if (used >= granted + purchased) return;
            return {
                ...current,
                ticketsUsed: used + 1,
                totalScore: Math.min(100, Number(current.totalScore || 0) + score),
                updatedAt: now()
            };
        }, undefined, false);

        if (!tx.committed) throw new Error('NO_TICKETS');
        state.annual = tx.snapshot.val();
        await loadClaims(status.year);
        renderDashboard(status);
        return score;
    }

    function clearActiveGame() {
        state.gameToken++;
        if (typeof state.activeGameCleanup === 'function') {
            try { state.activeGameCleanup(); } catch (_) { }
        }
        state.activeGameCleanup = null;
        state.gameCompleting = false;
    }

    function showStage(title, html) {
        const lobby = document.getElementById('mafLobby');
        const stage = document.getElementById('mafGameStage');
        if (!stage || !lobby) return null;
        lobby.hidden = true;
        stage.hidden = false;
        stage.innerHTML = `
            <div class="maf-stage-head">
                <div><small>🎟️ 1 lượt chơi · thoát giữa chừng vẫn mất vé</small><h3>${escapeHtml(title)}</h3></div>
                <button class="maf-btn maf-btn-ghost" type="button" data-maf-action="back-lobby">Thoát · mất 1 vé</button>
            </div>
            <div class="maf-stage-content">${html}</div>`;
        return stage.querySelector('.maf-stage-content');
    }

    async function backToLobby(options = {}) {
        const attempt = state.activeAttempt;
        clearActiveGame();

        const lobby = document.getElementById('mafLobby');
        const stage = document.getElementById('mafGameStage');
        if (lobby) lobby.hidden = false;
        if (stage) {
            stage.hidden = true;
            stage.innerHTML = '';
        }

        if (!options.skipPenalty && attempt && !attempt.settled) {
            await consumeAbandonedTicket('back-lobby', attempt);
            const status = await getEventStatus().catch(() => null);
            if (status) renderDashboard(status);
        }
    }

    async function finishGame(gameId, score, details = '') {
        if (state.gameCompleting) return;
        state.gameCompleting = true;
        try {
            const earned = await commitGameScore(gameId, score);
            markAttemptCompleted();
            const reached = CONFIG.milestones.filter(m => normalizedScore() >= m.score && rewardStatus(m) !== 'completed');
            showToast(`✨ Hoàn thành! +${earned} điểm${details ? ` · ${details}` : ''}`, 'success');
            if (reached.length) {
                setTimeout(() => showToast('🎁 Bạn đã mở khóa mốc thưởng mới. Hãy bấm “Nhận” trên thanh tiến độ!', 'success'), 450);
            }
            await backToLobby({ skipPenalty: true });
        } catch (error) {
            state.gameCompleting = false;
            const msg = error.message === 'NO_TICKETS' ? 'Bạn đã hết vé.' : error.message === 'EVENT_CLOSED' ? 'Sự kiện đã kết thúc.' : error.message;
            showToast(`Không lưu được lượt chơi: ${msg}`, 'error');
        }
    }

    function gameBaking(token) {
        const ingredientPool = [
            '🌾 Bột nếp', '🌾 Bột mì', '🫘 Đậu xanh', '🌰 Hạt sen',
            '🥥 Dừa', '🥚 Trứng muối', '🍵 Trà xanh', '🍠 Khoai môn',
            '🍯 Mật ong', '🥜 Hạt hỗn hợp'
        ];
        const recipeBank = [
            { prompt: 'Vỏ bánh dẻo truyền thống cần loại bột tạo độ mềm dẻo. Chọn nguyên liệu phù hợp.', answer: '🌾 Bột nếp' },
            { prompt: 'Vỏ bánh nướng cần loại bột tạo cấu trúc khi đưa vào lò. Chọn nguyên liệu phù hợp.', answer: '🌾 Bột mì' },
            { prompt: 'Nhân vàng mịn, vị bùi, thường được sên nhuyễn. Chọn nguyên liệu chính.', answer: '🫘 Đậu xanh' },
            { prompt: 'Nhân thanh, thơm nhẹ, thường được nấu mềm rồi sên. Chọn nguyên liệu chính.', answer: '🌰 Hạt sen' },
            { prompt: 'Nhân có sợi, vị béo thơm đặc trưng. Chọn nguyên liệu chính.', answer: '🥥 Dừa' },
            { prompt: 'Phần nhân tạo vị mặn béo, thường đặt ở giữa bánh. Chọn nguyên liệu.', answer: '🥚 Trứng muối' },
            { prompt: 'Muốn tạo màu xanh và hương trà cho nhân bánh, nên chọn nguyên liệu nào?', answer: '🍵 Trà xanh' },
            { prompt: 'Nhân tím nhạt, bùi và dẻo thường dùng loại củ nào?', answer: '🍠 Khoai môn' },
            { prompt: 'Muốn thêm vị ngọt thơm dịu cho công thức, nguyên liệu nào phù hợp nhất?', answer: '🍯 Mật ong' },
            { prompt: 'Nhân thập cẩm thường cần thành phần tạo độ giòn bùi. Chọn nhóm nguyên liệu phù hợp.', answer: '🥜 Hạt hỗn hợp' },
            { prompt: 'Bánh dẻo có lớp vỏ trắng mềm, không nướng. Thành phần nền thích hợp nhất là gì?', answer: '🌾 Bột nếp' },
            { prompt: 'Bánh nướng cần lớp vỏ có thể vàng mặt trong lò. Thành phần nền thích hợp nhất là gì?', answer: '🌾 Bột mì' }
        ];
        const rounds = shuffle(recipeBank).slice(0, 6);
        const content = showStage('🥮 Thỏ Ngọc Làm Bánh', `
            <div class="maf-mini-intro">6 công thức mức trung bình · <b>12 giây/câu</b> · 6 lựa chọn/câu · mỗi câu đúng 5 điểm.</div>
            <div class="maf-baking-box">
                <div class="maf-mini-hud"><span id="mafBakeRound"></span><strong id="mafBakeTime">12s</strong></div>
                <div class="maf-recipe" id="mafRecipe"></div>
                <div class="maf-choice-grid maf-choice-grid-3" id="mafBakeChoices"></div>
                <div class="maf-mini-score" id="mafBakeScore">0 điểm</div>
            </div>`);
        if (!content) return;

        let round = 0;
        let correct = 0;
        let locked = false;
        let timer = null;
        const roundEl = content.querySelector('#mafBakeRound');
        const timeEl = content.querySelector('#mafBakeTime');
        const recipe = content.querySelector('#mafRecipe');
        const choices = content.querySelector('#mafBakeChoices');
        const scoreEl = content.querySelector('#mafBakeScore');

        function clearQuestionTimer() {
            if (timer) clearInterval(timer);
            timer = null;
        }

        function finishRound(selectedButton, timedOut = false) {
            if (locked) return;
            locked = true;
            clearQuestionTimer();
            const row = rounds[round];
            const ok = selectedButton && selectedButton.dataset.value === row.answer;
            if (ok) {
                correct++;
                selectedButton.classList.add('is-correct');
            } else {
                if (selectedButton) selectedButton.classList.add('is-wrong');
                [...choices.querySelectorAll('.maf-choice')]
                    .find(btn => btn.dataset.value === row.answer)
                    ?.classList.add('is-correct');
            }
            [...choices.querySelectorAll('.maf-choice')].forEach(btn => { btn.disabled = true; });
            scoreEl.textContent = `${correct * 5} điểm${timedOut ? ' · Hết giờ' : ''}`;
            round++;
            setTimeout(() => {
                if (token === state.gameToken && state.open) next();
            }, 750);
        }

        function next() {
            clearQuestionTimer();
            if (round >= rounds.length) {
                finishGame('baking', correct * 5, `${correct}/6 công thức đúng`);
                return;
            }
            locked = false;
            const row = rounds[round];
            const distractors = shuffle(ingredientPool.filter(x => x !== row.answer)).slice(0, 5);
            const opts = shuffle([row.answer, ...distractors]);
            roundEl.textContent = `Công thức ${round + 1}/6`;
            recipe.textContent = row.prompt;
            choices.innerHTML = opts.map(item => `<button type="button" class="maf-choice" data-value="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join('');
            choices.onclick = event => {
                const btn = event.target.closest('.maf-choice');
                if (!btn || locked) return;
                finishRound(btn, false);
            };

            let remaining = 12;
            timeEl.textContent = `${remaining}s`;
            timeEl.classList.remove('is-urgent');
            timer = setInterval(() => {
                remaining--;
                timeEl.textContent = `${remaining}s`;
                timeEl.classList.toggle('is-urgent', remaining <= 4);
                if (remaining <= 0) finishRound(null, true);
            }, 1000);
        }

        state.activeGameCleanup = () => clearQuestionTimer();
        next();
    }

    function gameLantern(token) {
        const symbols = ['🏮', '🐇', '🌕', '🥮', '🎋', '⭐', '🌸', '🎐', '🪷', '🍵', '🧧', '☁️', '🌙', '🍡', '🎑'];
        const cards = shuffle([...symbols, ...symbols]).map((symbol, index) => ({ symbol, id: index }));
        const content = showStage('🏮 Ghép Đèn Lồng', `
            <div class="maf-mini-intro">30 thẻ · 15 cặp · <b>60 giây</b>. Mỗi cặp đúng 2 điểm; cứ 4 lần ghép sai trừ 1 điểm.</div>
            <div class="maf-mini-hud"><span id="mafMemoryStatus">0/15 cặp · 0 lỗi</span><strong id="mafMemoryTime">60s</strong></div>
            <div class="maf-memory-grid maf-memory-grid-30" id="mafMemoryGrid"></div>`);
        if (!content) return;
        const grid = content.querySelector('#mafMemoryGrid');
        const status = content.querySelector('#mafMemoryStatus');
        const timeEl = content.querySelector('#mafMemoryTime');
        let first = null;
        let lock = false;
        let pairs = 0;
        let mistakes = 0;
        let remaining = 60;
        let done = false;
        let timer = null;

        const calcScore = () => Math.max(0, Math.min(30, pairs * 2 - Math.floor(mistakes / 4)));

        function end(reason) {
            if (done) return;
            done = true;
            if (timer) clearInterval(timer);
            grid.style.pointerEvents = 'none';
            finishGame('lantern', calcScore(), `${pairs}/15 cặp · ${mistakes} lỗi${reason === 'timeout' ? ' · hết 60s' : ''}`);
        }

        grid.innerHTML = cards.map(card => `<button type="button" class="maf-memory-card" data-id="${card.id}" data-symbol="${card.symbol}"><span>?</span></button>`).join('');
        grid.onclick = event => {
            const btn = event.target.closest('.maf-memory-card');
            if (!btn || done || lock || btn.classList.contains('matched') || btn === first) return;
            btn.classList.add('open');
            btn.querySelector('span').textContent = btn.dataset.symbol;
            if (!first) {
                first = btn;
                return;
            }
            if (first.dataset.symbol === btn.dataset.symbol) {
                first.classList.add('matched');
                btn.classList.add('matched');
                first = null;
                pairs++;
                status.textContent = `${pairs}/15 cặp · ${mistakes} lỗi · ${calcScore()} điểm`;
                if (pairs === 15) {
                    setTimeout(() => { if (token === state.gameToken && state.open) end('complete'); }, 280);
                }
            } else {
                mistakes++;
                lock = true;
                const old = first;
                status.textContent = `${pairs}/15 cặp · ${mistakes} lỗi · ${calcScore()} điểm`;
                setTimeout(() => {
                    if (done) return;
                    old.classList.remove('open');
                    btn.classList.remove('open');
                    old.querySelector('span').textContent = '?';
                    btn.querySelector('span').textContent = '?';
                    first = null;
                    lock = false;
                }, 500);
            }
        };

        timer = setInterval(() => {
            remaining--;
            timeEl.textContent = `${remaining}s`;
            timeEl.classList.toggle('is-urgent', remaining <= 10);
            if (remaining <= 0) end('timeout');
        }, 1000);

        state.activeGameCleanup = () => {
            done = true;
            if (timer) clearInterval(timer);
        };
    }

    function gameCatch(token) {
        const content = showStage('🧺 Bắt Bánh Trung Thu', `
            <div class="maf-mini-intro">Mức trung bình: bắt tối đa 10 chiếc bánh trong <b>20 giây</b>. Bánh tự đổi vị trí theo nhịp vừa phải; mỗi bánh = 2 điểm, tối đa <b>20 điểm</b> — thấp nhất trong 5 trò.</div>
            <div class="maf-catch-hud"><strong id="mafCatchScore">0/20 điểm</strong><span id="mafCatchTime">20s</span></div>
            <div class="maf-catch-arena" id="mafCatchArena"><button type="button" class="maf-falling-mooncake" aria-label="Bắt bánh">🥮</button></div>`);
        if (!content) return;
        const arena = content.querySelector('#mafCatchArena');
        const target = content.querySelector('.maf-falling-mooncake');
        const scoreEl = content.querySelector('#mafCatchScore');
        const timeEl = content.querySelector('#mafCatchTime');
        let caught = 0;
        let remaining = 20;
        let done = false;
        let timer = null;
        let mover = null;

        // Kích thước vừa phải: không quá dễ nhưng vẫn đủ vùng bấm trên mobile.
        target.style.width = '64px';
        target.style.height = '64px';
        target.style.fontSize = '2.35rem';

        function move() {
            if (done || target.disabled) return;
            const size = Math.max(64, target.offsetWidth || 64);
            const maxX = Math.max(8, arena.clientWidth - size - 16);
            const maxY = Math.max(8, arena.clientHeight - size - 16);
            target.style.left = `${8 + Math.floor(Math.random() * maxX)}px`;
            target.style.top = `${8 + Math.floor(Math.random() * maxY)}px`;
        }

        function end() {
            if (done) return;
            done = true;
            if (timer) clearInterval(timer);
            if (mover) clearInterval(mover);
            target.disabled = true;
            finishGame('catch', Math.min(20, caught * 2), `${caught}/10 bánh`);
        }

        const catchCake = event => {
            event.preventDefault();
            if (done || target.disabled) return;
            target.disabled = true;
            caught = Math.min(10, caught + 1);
            scoreEl.textContent = `${caught * 2}/20 điểm`;
            target.classList.remove('is-caught');
            void target.offsetWidth;
            target.classList.add('is-caught');
            if (caught >= 10) {
                end();
                return;
            }
            setTimeout(() => {
                if (done || token !== state.gameToken || !state.open) return;
                target.disabled = false;
                move();
            }, 150);
        };

        target.addEventListener('pointerdown', catchCake, { passive: false });

        // Tự đổi vị trí khoảng 1,25 giây/lần: trung bình, không đứng yên nhưng cũng không chạy quá nhanh.
        mover = setInterval(move, 1250);
        timer = setInterval(() => {
            remaining--;
            timeEl.textContent = `${remaining}s`;
            timeEl.classList.toggle('is-urgent', remaining <= 6);
            if (remaining <= 0) end();
        }, 1000);

        requestAnimationFrame(move);
        state.activeGameCleanup = () => {
            done = true;
            if (timer) clearInterval(timer);
            if (mover) clearInterval(mover);
            target.removeEventListener('pointerdown', catchCake);
        };
    }

    function gameQuiz(token) {
        const questions = shuffle(QUIZ_QUESTION_BANK).slice(0, 5);
        const content = showStage('❓ Đố Vui Trung Thu', `
            <div class="maf-mini-intro">Rút 5 câu ngẫu nhiên từ ngân hàng câu hỏi · <b>15 giây/câu</b> · mỗi câu đúng 6 điểm.</div>
            <div class="maf-quiz-card">
                <div class="maf-mini-hud"><span id="mafQuizRound"></span><strong id="mafQuizTime">15s</strong></div>
                <h4 id="mafQuizQuestion"></h4>
                <div class="maf-choice-grid" id="mafQuizChoices"></div>
                <div class="maf-mini-score" id="mafQuizScore">0 điểm</div>
            </div>`);
        if (!content) return;
        let index = 0;
        let correct = 0;
        let locked = false;
        let timer = null;
        const round = content.querySelector('#mafQuizRound');
        const timeEl = content.querySelector('#mafQuizTime');
        const question = content.querySelector('#mafQuizQuestion');
        const choices = content.querySelector('#mafQuizChoices');
        const score = content.querySelector('#mafQuizScore');

        function clearQuestionTimer() {
            if (timer) clearInterval(timer);
            timer = null;
        }

        function resolveAnswer(btn, timedOut = false) {
            if (locked) return;
            locked = true;
            clearQuestionTimer();
            const row = questions[index];
            const ok = btn && btn.dataset.value === row.a;
            if (ok) {
                correct++;
                btn.classList.add('is-correct');
            } else {
                if (btn) btn.classList.add('is-wrong');
                [...choices.querySelectorAll('.maf-choice')]
                    .find(b => b.dataset.value === row.a)
                    ?.classList.add('is-correct');
            }
            [...choices.querySelectorAll('.maf-choice')].forEach(b => { b.disabled = true; });
            score.textContent = `${correct * 6} điểm${timedOut ? ' · Hết giờ' : ''}`;
            index++;
            setTimeout(() => { if (token === state.gameToken && state.open) next(); }, 700);
        }

        function next() {
            clearQuestionTimer();
            if (index >= questions.length) {
                finishGame('quiz', correct * 6, `${correct}/5 câu đúng`);
                return;
            }
            locked = false;
            const row = questions[index];
            round.textContent = `Câu ${index + 1}/5`;
            question.textContent = row.q;
            choices.innerHTML = shuffle(row.opts).map(opt => `<button type="button" class="maf-choice" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`).join('');
            choices.onclick = event => {
                const btn = event.target.closest('.maf-choice');
                if (!btn || locked) return;
                resolveAnswer(btn, false);
            };

            let remaining = 15;
            timeEl.textContent = `${remaining}s`;
            timeEl.classList.remove('is-urgent');
            timer = setInterval(() => {
                remaining--;
                timeEl.textContent = `${remaining}s`;
                timeEl.classList.toggle('is-urgent', remaining <= 5);
                if (remaining <= 0) resolveAnswer(null, true);
            }, 1000);
        }

        state.activeGameCleanup = () => clearQuestionTimer();
        next();
    }

    function gameFind(token) {
        const pool = ['🏮', '🕯️', '💡', '✨', '🐇', '🐰', '🦊', '🐱', '🌕', '🌙', '⭐', '🌟', '🥮', '🍡', '🍪', '🥠', '🎋', '🌿', '🍃', '🌸', '🧧', '🎐', '🎀', '🎏', '🪷', '🍵', '☁️', '🍂'];
        const targets = shuffle(['🏮', '🐇', '🌕', '🥮', '🎋', '⭐', '🎐', '🪷', '🍡', '🧧']).slice(0, 6);
        const content = showStage('🔎 Tìm Đồ Vật', `
            <div class="maf-mini-intro">Mức trung bình: ghi nhớ mục tiêu trong <b>1 giây</b>, sau đó tìm trong <b>48 ô</b>. Mỗi lượt tìm có 20 giây; chọn sai trừ 1 điểm.</div>
            <div class="maf-mini-hud"><span id="mafFindStatus">0/6 · 0 lỗi · 0 điểm</span><strong id="mafFindTime">Chuẩn bị</strong></div>
            <div class="maf-find-target">Ghi nhớ: <strong id="mafFindTarget"></strong></div>
            <div class="maf-find-grid maf-find-grid-48 is-locked" id="mafFindGrid"></div>`);
        if (!content) return;
        const targetEl = content.querySelector('#mafFindTarget');
        const grid = content.querySelector('#mafFindGrid');
        const status = content.querySelector('#mafFindStatus');
        const timeEl = content.querySelector('#mafFindTime');
        let round = 0;
        let mistakes = 0;
        let points = 0;
        let locked = true;
        let timer = null;
        let previewTimer = null;

        function clearTimers() {
            if (timer) clearInterval(timer);
            if (previewTimer) clearTimeout(previewTimer);
            timer = null;
            previewTimer = null;
        }

        function updateStatus(extra = '') {
            status.textContent = `${round}/6 · ${mistakes} lỗi · ${Math.max(0, points)} điểm${extra}`;
        }

        function finishSearchRound(found) {
            if (locked) return;
            locked = true;
            clearTimers();
            grid.classList.add('is-locked');
            if (found) {
                points = Math.min(30, points + 5);
            }
            round++;
            updateStatus(found ? '' : ' · Hết giờ');
            setTimeout(() => {
                if (token === state.gameToken && state.open) renderRound();
            }, 450);
        }

        function startSearchTimer() {
            let remaining = 20;
            timeEl.textContent = `${remaining}s`;
            timer = setInterval(() => {
                remaining--;
                timeEl.textContent = `${remaining}s`;
                timeEl.classList.toggle('is-urgent', remaining <= 6);
                if (remaining <= 0) finishSearchRound(false);
            }, 1000);
        }

        function renderRound() {
            clearTimers();
            if (round >= targets.length) {
                finishGame('find', Math.max(0, Math.min(30, points)), `${mistakes} lần chọn sai`);
                return;
            }
            const wanted = targets[round];
            locked = true;
            targetEl.textContent = wanted;
            timeEl.textContent = 'Nhớ 1s';
            timeEl.classList.remove('is-urgent');

            const distractorPool = pool.filter(x => x !== wanted);
            const cells = [wanted, ...Array.from({ length: 47 }, () => distractorPool[Math.floor(Math.random() * distractorPool.length)])];
            grid.innerHTML = shuffle(cells).map((emoji, index) => `<button type="button" class="maf-find-cell" data-value="${emoji}" data-index="${index}" disabled>${emoji}</button>`).join('');
            grid.classList.add('is-locked');
            updateStatus();

            previewTimer = setTimeout(() => {
                if (token !== state.gameToken || !state.open) return;
                targetEl.textContent = '❓';
                grid.classList.remove('is-locked');
                [...grid.querySelectorAll('.maf-find-cell')].forEach(btn => { btn.disabled = false; });
                locked = false;
                startSearchTimer();
            }, 1000);
        }

        grid.onclick = event => {
            const btn = event.target.closest('.maf-find-cell');
            if (!btn || locked || btn.disabled) return;
            const wanted = targets[round];
            if (btn.dataset.value === wanted) {
                btn.classList.add('is-found');
                finishSearchRound(true);
            } else {
                mistakes++;
                points = Math.max(0, points - 1);
                btn.classList.add('is-wrong');
                btn.disabled = true;
                updateStatus();
                setTimeout(() => btn.classList.remove('is-wrong'), 280);
            }
        };

        state.activeGameCleanup = () => clearTimers();
        renderRound();
    }

    function startGame(gameId) {
        if (!state.annual || ticketsRemaining() <= 0) {
            showToast('Bạn đã hết vé Đại Hội Trung Thu.', 'warning');
            return;
        }

        if (state.activeAttempt && !state.activeAttempt.settled) {
            showToast('Bạn đang có một lượt chơi chưa kết thúc.', 'warning');
            return;
        }

        clearActiveGame();
        const map = {
            baking: gameBaking,
            lantern: gameLantern,
            catch: gameCatch,
            quiz: gameQuiz,
            find: gameFind
        };

        if (!map[gameId]) return;

        beginGameAttempt(gameId);
        const token = state.gameToken;
        map[gameId](token);
    }

    async function open() {
        if (state.open || state.busy) return;

        // Capture the opener before focus is moved into the dialog.
        const currentFocus = document.activeElement;
        if (
            currentFocus &&
            currentFocus !== document.body &&
            !document.getElementById('midAutumnFestivalModal')?.contains(currentFocus)
        ) {
            lastFocusedBeforeOpen = currentFocus;
        }

        state.busy = true;
        try {
            await syncServerTime();
            const status = await getEventStatus();
            ensureModal();

            if (status.active && status.calendar?.remoteConfigured) {
                await ensureAnnualState(status);
                await loadClaims(status.year);
            } else {
                await loadAnnualState(status.year).catch(() => null);
                await loadClaims(status.year).catch(() => ({}));
            }

            const modal = document.getElementById('midAutumnFestivalModal');
            if (!modal) return;

            // IMPORTANT: make the modal interactive/accessibility-visible
            // before moving keyboard focus into it.
            modal.inert = false;
            modal.removeAttribute('inert');
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('active');

            document.body.classList.add('maf-modal-open');
            state.open = true;
            renderDashboard(status);

            // Move focus into the dialog after it becomes visible.
            requestAnimationFrame(() => {
                const closeButton =
                    modal.querySelector('.maf-icon-btn[data-maf-action="close"]') ||
                    modal.querySelector(
                        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                    );

                if (isUsableFocusTarget(closeButton)) {
                    try {
                        closeButton.focus({ preventScroll: true });
                    } catch (_) {
                        closeButton.focus();
                    }
                }
            });
        } catch (error) {
            console.error('[Đại Hội Trung Thu] Không mở được:', error);
            if (error.message === 'MID_AUTUMN_REMOTE_CALENDAR_REQUIRED') {
                showToast('Firebase chưa có lịch Trung Thu năm nay nên chưa thể cấp vé.', 'error');
            } else {
                showToast(`Không mở được Đại Hội Trung Thu: ${error.message}`, 'error');
            }
        } finally {
            state.busy = false;
        }
    }

    async function close() {
        const attempt = state.activeAttempt;

        clearActiveGame();
        const modal = document.getElementById('midAutumnFestivalModal');

        if (modal) {
            /*
             * Accessibility order matters:
             * 1) Move focus OUT of the modal.
             * 2) Disable interaction with inert.
             * 3) Only then hide it from the accessibility tree.
             *
             * This prevents Chrome's:
             * "Blocked aria-hidden ... descendant retained focus" warning.
             */
            restoreFocusOutsideModal(modal);

            modal.inert = true;
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }

        document.body.classList.remove('maf-modal-open');
        state.open = false;

        if (attempt && !attempt.settled) {
            try {
                await consumeAbandonedTicket('close', attempt);
            } catch (error) {
                console.error('[Đại Hội Trung Thu] Không trừ được vé khi thoát giữa chừng:', error);
            }
        }
    }

    function showRewards() {
        const lines = CONFIG.milestones.map(m => `${m.score} điểm: ${m.label}`).join('\n');
        alert(`🎑 ĐẠI HỘI TRUNG THU\n\n${lines}\n\n🎟️ Mỗi năm: 2 vé miễn phí + tối đa 4 vé mua thêm.\n🪙 Giá vé mua thêm: ${CONFIG.extraTicketPrice} Coin/vé.\n🎮 4 trò tối đa ${CONFIG.maxScorePerPlay} điểm/lượt; Bắt Bánh tối đa 20 điểm/lượt.\n⚠️ Vào một trò chơi rồi thoát giữa chừng vẫn mất 1 vé.`);
    }

    async function init() {
        const database = getDatabase();
        if (!database || !username()) {
            console.warn('[Đại Hội Trung Thu] Thiếu Firebase hoặc currentUser.');
            return;
        }
        await syncServerTime();
        await reconcileAbandonedAttempt();
        injectCard();
        ensureModal();
        await renderCardStatus();

        if (state.statusTimer) clearInterval(state.statusTimer);
        state.statusTimer = setInterval(renderCardStatus, 60 * 1000);

        document.addEventListener('midautumn-wallet-updated', () => {
            if (!state.open) return;
            document.querySelectorAll('#midAutumnFestivalModal [data-midautumn-coin-balance]').forEach(el => {
                el.textContent = Math.max(0, Number(window.studentMidAutumnCoinBalance || 0)).toLocaleString('vi-VN');
            });
        });

        window.addEventListener('beforeunload', () => {
            if (state.activeAttempt && !state.activeAttempt.settled) {
                savePendingAttempt(state.activeAttempt);
            }
        });
    }

    async function enableTestMode(options = {}) {
        if (state.open) {
            await close();
        }

        state.testMode = true;
        state.claims = {};

        const status =
            await getEventStatus();

        const startScore =
            Math.max(
                0,
                Math.min(
                    100,
                    Math.floor(
                        Number(
                            options.score || 0
                        )
                    )
                )
            );

        const baseTickets =
            Math.max(
                1,
                Math.min(
                    99,
                    Math.floor(
                        Number(
                            options.tickets ||
                            CONFIG.baseTickets
                        )
                    )
                )
            );

        state.annual = {
            eventId: EVENT_ID,
            year: String(status.year),
            festivalDateKey:
                String(
                    status.calendar
                        ?.festivalDateKey ||
                    'TEST'
                ),
            ticketsGranted:
                baseTickets,
            ticketsPurchased: 0,
            ticketsUsed: 0,
            totalScore:
                startScore,
            openedAt: now(),
            updatedAt: now(),
            testMode: true
        };

        injectCard();
        ensureModal();
        await renderCardStatus();

        showToast(
            '🧪 Đã bật Test Mode Đại Hội Trung Thu. F5 để thoát hoàn toàn.',
            'success'
        );

        await open();

        return {
            testMode: true,
            tickets:
                ticketsRemaining(),
            score:
                normalizedScore()
        };
    }

    async function disableTestMode() {
        if (state.open) {
            await close();
        }

        state.testMode = false;
        state.annual = null;
        state.claims = {};
        state.calendar = null;

        await renderCardStatus();

        showToast(
            'Đã tắt Test Mode Đại Hội Trung Thu.',
            'success'
        );
    }

    async function resetTestMode(options = {}) {
        if (!state.testMode) {
            return enableTestMode(
                options
            );
        }

        if (state.open) {
            await close();
        }

        state.annual = null;
        state.claims = {};

        return enableTestMode(
            options
        );
    }

    const api = {
        VERSION,
        CONFIG,
        init,
        open,
        close,
        showRewards,
        enableTestMode,
        disableTestMode,
        resetTestMode,
        refresh: renderCardStatus,
        getState: () => ({
            ...state,
            annual:
                state.annual
                    ? {
                        ...state.annual
                    }
                    : null,
            claims:
                {
                    ...(state.claims || {})
                }
        })
    };

    window.MidAutumnFestival = api;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init().catch(console.error), { once: true });
    } else {
        init().catch(console.error);
    }
})();
