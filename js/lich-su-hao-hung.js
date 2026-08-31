/*
 * ============================================================
 * SỰ KIỆN HẰNG NĂM · LỊCH SỬ HÀO HÙNG
 * Mở: 31/08 00:00 -> 05/09 23:59:59 (giờ Việt Nam), hằng năm.
 * 10 câu ngẫu nhiên / lượt, 50 giây / câu, tối đa 10 điểm.
 *
 * Module độc lập: tự chèn card vào tab Trò chơi + toàn bộ popup/game.
 * Cần được load SAU store-manager.js, luxury-store.js và student.js.
 * ============================================================
 */
(() => {
        'use strict';

        const CONFIG = Object.freeze({
                id: 'lich_su_hao_hung',
                title: 'Lịch sử hào hùng',
                questionCount: 10,
                secondsPerQuestion: 50,
                startMonthDay: '08-31',
                endMonthDay: '09-05',
                progressRoot: 'student_history_events',

                /*
                 * Nếu sau này bạn muốn ép đúng ID vật phẩm, điền ID vào các mảng dưới.
                 * Khi để trống, hệ thống tự dò trong StoreConfig theo tag/tên chứa
                 * "2/9" hoặc "Quốc khánh" và đúng type.
                 */
                preferredRewardIds: {
                        background: [
                                'background_quoc_khanh_son_ha_ruc_sang'
                        ],
                        frame: [
                                'frame_quoc_khanh_viet_dieu_quoc_an'
                        ],
                        theme: [
                                'theme_quoc_khanh_viet_dieu_hong_ky'
                        ],
                        pet: [
                                'pet_quoc_khanh_chibi_1'
                        ],
                        effect: [
                                'effect_quoc_khanh_viet_dieu_non_song'
                        ],
                        luxury: [
                                'pet_quoc_khanh_1'
                        ]
                }
        });

        const QUESTIONS = [
                {
                        "id": 1,
                        "question": "Quốc khánh Việt Nam được tổ chức vào ngày nào?",
                        "answers": [
                                "2/9"
                        ],
                        "displayAnswer": "2/9"
                },
                {
                        "id": 2,
                        "question": "Ngày 2/9/1945 diễn ra sự kiện lịch sử quan trọng nào?",
                        "answers": [
                                "Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập"
                        ],
                        "displayAnswer": "Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập"
                },
                {
                        "id": 3,
                        "question": "Ai là người đọc Tuyên ngôn Độc lập ngày 2/9/1945?",
                        "answers": [
                                "Chủ tịch Hồ Chí Minh"
                        ],
                        "displayAnswer": "Chủ tịch Hồ Chí Minh"
                },
                {
                        "id": 4,
                        "question": "Tuyên ngôn Độc lập được đọc tại thành phố nào?",
                        "answers": [
                                "Hà Nội"
                        ],
                        "displayAnswer": "Hà Nội"
                },
                {
                        "id": 5,
                        "question": "Tuyên ngôn Độc lập được đọc tại quảng trường nào?",
                        "answers": [
                                "Quảng trường Ba Đình"
                        ],
                        "displayAnswer": "Quảng trường Ba Đình"
                },
                {
                        "id": 6,
                        "question": "Sự kiện ngày 2/9/1945 khai sinh ra nước nào?",
                        "answers": [
                                "Nước Việt Nam Dân chủ Cộng hòa"
                        ],
                        "displayAnswer": "Nước Việt Nam Dân chủ Cộng hòa"
                },
                {
                        "id": 7,
                        "question": "Quốc kỳ Việt Nam có nền màu gì?",
                        "answers": [
                                "Đỏ"
                        ],
                        "displayAnswer": "Đỏ"
                },
                {
                        "id": 8,
                        "question": "Hình nằm giữa Quốc kỳ Việt Nam là gì?",
                        "answers": [
                                "Ngôi sao vàng năm cánh"
                        ],
                        "displayAnswer": "Ngôi sao vàng năm cánh"
                },
                {
                        "id": 9,
                        "question": "Ngôi sao trên Quốc kỳ Việt Nam có màu gì?",
                        "answers": [
                                "Màu vàng"
                        ],
                        "displayAnswer": "Màu vàng"
                },
                {
                        "id": 10,
                        "question": "Quốc ca Việt Nam có tên là gì?",
                        "answers": [
                                "Tiến quân ca"
                        ],
                        "displayAnswer": "Tiến quân ca"
                },
                {
                        "id": 11,
                        "question": "Ai sáng tác bài Tiến quân ca?",
                        "answers": [
                                "Văn Cao"
                        ],
                        "displayAnswer": "Văn Cao"
                },
                {
                        "id": 12,
                        "question": "Thủ đô của Việt Nam là thành phố nào?",
                        "answers": [
                                "Hà Nội"
                        ],
                        "displayAnswer": "Hà Nội"
                },
                {
                        "id": 13,
                        "question": "Ngày 2/9/1945 thuộc thế kỷ nào?",
                        "answers": [
                                "Thế kỷ XX"
                        ],
                        "displayAnswer": "Thế kỷ XX"
                },
                {
                        "id": 14,
                        "question": "Quốc khánh 2/9 diễn ra vào tháng mấy?",
                        "answers": [
                                "Tháng 9"
                        ],
                        "displayAnswer": "Tháng 9"
                },
                {
                        "id": 15,
                        "question": "Năm 2026 kỷ niệm bao nhiêu năm Quốc khánh 2/9/1945?",
                        "answers": [
                                "81 năm"
                        ],
                        "displayAnswer": "81 năm"
                },
                {
                        "id": 16,
                        "question": "Trước ngày Quốc khánh 2/9 là ngày nào?",
                        "answers": [
                                "1/9"
                        ],
                        "displayAnswer": "1/9"
                },
                {
                        "id": 17,
                        "question": "Sau ngày Quốc khánh 2/9 là ngày nào?",
                        "answers": [
                                "3/9"
                        ],
                        "displayAnswer": "3/9"
                },
                {
                        "id": 18,
                        "question": "Từ năm 1945 đến năm 2025 là bao nhiêu năm?",
                        "answers": [
                                "80 năm"
                        ],
                        "displayAnswer": "80 năm"
                },
                {
                        "id": 19,
                        "question": "Quốc khánh Việt Nam gắn với hai chữ quan trọng nào?",
                        "answers": [
                                "Độc lập"
                        ],
                        "displayAnswer": "Độc lập"
                },
                {
                        "id": 20,
                        "question": "Người dân Việt Nam thường treo gì vào dịp Quốc khánh?",
                        "answers": [
                                "Quốc kỳ",
                                "cờ đỏ sao vàng"
                        ],
                        "displayAnswer": "Quốc kỳ/cờ đỏ sao vàng"
                },
                {
                        "id": 21,
                        "question": "Màu chủ đạo thường thấy trong dịp Quốc khánh là màu gì?",
                        "answers": [
                                "Đỏ"
                        ],
                        "displayAnswer": "Đỏ"
                },
                {
                        "id": 22,
                        "question": "Cờ Việt Nam có bao nhiêu ngôi sao lớn ở chính giữa?",
                        "answers": [
                                "1"
                        ],
                        "displayAnswer": "1"
                },
                {
                        "id": 23,
                        "question": "Ngôi sao trên Quốc kỳ có bao nhiêu cánh?",
                        "answers": [
                                "5 cánh"
                        ],
                        "displayAnswer": "5 cánh"
                },
                {
                        "id": 24,
                        "question": "Ngày 2/9 là ngày lễ của quốc gia nào?",
                        "answers": [
                                "Việt Nam"
                        ],
                        "displayAnswer": "Việt Nam"
                },
                {
                        "id": 25,
                        "question": "Chủ tịch Hồ Chí Minh còn được nhân dân gọi thân mật là gì?",
                        "answers": [
                                "Bác Hồ"
                        ],
                        "displayAnswer": "Bác Hồ"
                },
                {
                        "id": 26,
                        "question": "Quốc khánh 2/9 gắn liền với thắng lợi của cuộc cách mạng nào?",
                        "answers": [
                                "Cách mạng Tháng Tám năm 1945"
                        ],
                        "displayAnswer": "Cách mạng Tháng Tám năm 1945"
                },
                {
                        "id": 27,
                        "question": "Cách mạng Tháng Tám thành công vào năm nào?",
                        "answers": [
                                "1945"
                        ],
                        "displayAnswer": "1945"
                },
                {
                        "id": 28,
                        "question": "Cuộc Tổng khởi nghĩa giành chính quyền ở Hà Nội thắng lợi vào ngày nào?",
                        "answers": [
                                "19/8/1945"
                        ],
                        "displayAnswer": "19/8/1945"
                },
                {
                        "id": 29,
                        "question": "Ngày 19/8 hằng năm gắn với sự kiện lịch sử nào?",
                        "answers": [
                                "Thắng lợi của Cách mạng Tháng Tám tại Hà Nội"
                        ],
                        "displayAnswer": "Thắng lợi của Cách mạng Tháng Tám tại Hà Nội"
                },
                {
                        "id": 30,
                        "question": "Vua nào thoái vị vào tháng 8/1945?",
                        "answers": [
                                "Vua Bảo Đại"
                        ],
                        "displayAnswer": "Vua Bảo Đại"
                },
                {
                        "id": 31,
                        "question": "Vua Bảo Đại là vị vua cuối cùng của triều đại nào?",
                        "answers": [
                                "Triều Nguyễn"
                        ],
                        "displayAnswer": "Triều Nguyễn"
                },
                {
                        "id": 32,
                        "question": "Vua Bảo Đại thoái vị tại thành phố nào?",
                        "answers": [
                                "Huế"
                        ],
                        "displayAnswer": "Huế"
                },
                {
                        "id": 33,
                        "question": "Tuyên ngôn Độc lập khẳng định quyền gì của dân tộc Việt Nam?",
                        "answers": [
                                "Quyền tự do và độc lập"
                        ],
                        "displayAnswer": "Quyền tự do và độc lập"
                },
                {
                        "id": 34,
                        "question": "Trước ngày 2/9/1945, Chủ tịch Hồ Chí Minh soạn Tuyên ngôn Độc lập tại phố nào ở Hà Nội?",
                        "answers": [
                                "Phố Hàng Ngang"
                        ],
                        "displayAnswer": "Phố Hàng Ngang"
                },
                {
                        "id": 35,
                        "question": "Địa chỉ nổi tiếng gắn với việc soạn thảo Tuyên ngôn Độc lập là số bao nhiêu Hàng Ngang?",
                        "answers": [
                                "48 Hàng Ngang"
                        ],
                        "displayAnswer": "48 Hàng Ngang"
                },
                {
                        "id": 36,
                        "question": "Số 48 Hàng Ngang thuộc khu vực nào hiện nay?",
                        "answers": [
                                "Hà Nội"
                        ],
                        "displayAnswer": "Hà Nội"
                },
                {
                        "id": 37,
                        "question": "Tuyên ngôn Độc lập được công bố trước đông đảo ai?",
                        "answers": [
                                "Đồng bào cả nước",
                                "nhân dân"
                        ],
                        "displayAnswer": "Đồng bào cả nước/nhân dân"
                },
                {
                        "id": 38,
                        "question": "Câu mở đầu lời đọc Tuyên ngôn của Chủ tịch Hồ Chí Minh hướng tới ai?",
                        "answers": [
                                "Đồng bào cả nước"
                        ],
                        "displayAnswer": "Đồng bào cả nước"
                },
                {
                        "id": 39,
                        "question": "Nhà nước ra đời ngày 2/9/1945 theo thể chế cộng hòa có tên đầy đủ là gì?",
                        "answers": [
                                "Việt Nam Dân chủ Cộng hòa"
                        ],
                        "displayAnswer": "Việt Nam Dân chủ Cộng hòa"
                },
                {
                        "id": 40,
                        "question": "Tên nước Việt Nam hiện nay là gì?",
                        "answers": [
                                "Cộng hòa xã hội chủ nghĩa Việt Nam"
                        ],
                        "displayAnswer": "Cộng hòa xã hội chủ nghĩa Việt Nam"
                },
                {
                        "id": 41,
                        "question": "Quốc hiệu hiện nay bắt đầu bằng cụm từ nào?",
                        "answers": [
                                "Cộng hòa xã hội chủ nghĩa"
                        ],
                        "displayAnswer": "Cộng hòa xã hội chủ nghĩa"
                },
                {
                        "id": 42,
                        "question": "Tiêu ngữ quen thuộc dưới Quốc hiệu Việt Nam là gì?",
                        "answers": [
                                "Độc lập – Tự do – Hạnh phúc"
                        ],
                        "displayAnswer": "Độc lập – Tự do – Hạnh phúc"
                },
                {
                        "id": 43,
                        "question": "Từ nào đứng giữa “Độc lập” và “Hạnh phúc”?",
                        "answers": [
                                "Tự do"
                        ],
                        "displayAnswer": "Tự do"
                },
                {
                        "id": 44,
                        "question": "Ba giá trị trong tiêu ngữ Việt Nam là gì?",
                        "answers": [
                                "Độc lập – Tự do – Hạnh phúc"
                        ],
                        "displayAnswer": "Độc lập – Tự do – Hạnh phúc"
                },
                {
                        "id": 45,
                        "question": "Chủ tịch Hồ Chí Minh sinh năm nào?",
                        "answers": [
                                "1890"
                        ],
                        "displayAnswer": "1890"
                },
                {
                        "id": 46,
                        "question": "Chủ tịch Hồ Chí Minh ra đi tìm đường cứu nước vào năm nào?",
                        "answers": [
                                "1911"
                        ],
                        "displayAnswer": "1911"
                },
                {
                        "id": 47,
                        "question": "Chủ tịch Hồ Chí Minh trở về Tổ quốc sau nhiều năm hoạt động ở nước ngoài vào năm nào?",
                        "answers": [
                                "1941"
                        ],
                        "displayAnswer": "1941"
                },
                {
                        "id": 48,
                        "question": "Địa danh gắn với thời gian Bác Hồ trở về Tổ quốc năm 1941 là nơi nào?",
                        "answers": [
                                "Pác Bó, Cao Bằng"
                        ],
                        "displayAnswer": "Pác Bó, Cao Bằng"
                },
                {
                        "id": 49,
                        "question": "Việt Minh được thành lập vào năm nào?",
                        "answers": [
                                "1941"
                        ],
                        "displayAnswer": "1941"
                },
                {
                        "id": 50,
                        "question": "Tên đầy đủ của Việt Minh là gì?",
                        "answers": [
                                "Việt Nam Độc lập Đồng minh"
                        ],
                        "displayAnswer": "Việt Nam Độc lập Đồng minh"
                },
                {
                        "id": 51,
                        "question": "Tuyên ngôn Độc lập năm 1945 có nhắc tới Tuyên ngôn Độc lập của quốc gia nào?",
                        "answers": [
                                "Hoa Kỳ"
                        ],
                        "displayAnswer": "Hoa Kỳ"
                },
                {
                        "id": 52,
                        "question": "Tuyên ngôn Độc lập của Hoa Kỳ được công bố vào năm nào?",
                        "answers": [
                                "1776"
                        ],
                        "displayAnswer": "1776"
                },
                {
                        "id": 53,
                        "question": "Ngoài Tuyên ngôn Độc lập của Hoa Kỳ, Chủ tịch Hồ Chí Minh còn dẫn tư tưởng từ tuyên ngôn của nước nào?",
                        "answers": [
                                "Pháp"
                        ],
                        "displayAnswer": "Pháp"
                },
                {
                        "id": 54,
                        "question": "Văn kiện của Pháp được nhắc tới là Tuyên ngôn gì?",
                        "answers": [
                                "Tuyên ngôn Nhân quyền và Dân quyền"
                        ],
                        "displayAnswer": "Tuyên ngôn Nhân quyền và Dân quyền"
                },
                {
                        "id": 55,
                        "question": "Tuyên ngôn Nhân quyền và Dân quyền của Pháp ra đời năm nào?",
                        "answers": [
                                "1789"
                        ],
                        "displayAnswer": "1789"
                },
                {
                        "id": 56,
                        "question": "Hai quyền đặc biệt được nhấn mạnh trong Tuyên ngôn Độc lập Việt Nam là gì?",
                        "answers": [
                                "Tự do và độc lập"
                        ],
                        "displayAnswer": "Tự do và độc lập"
                },
                {
                        "id": 57,
                        "question": "Câu “Nước Việt Nam có quyền hưởng tự do và độc lập” nằm trong văn kiện nào?",
                        "answers": [
                                "Tuyên ngôn Độc lập"
                        ],
                        "displayAnswer": "Tuyên ngôn Độc lập"
                },
                {
                        "id": 58,
                        "question": "Tuyên ngôn Độc lập ngày 2/9/1945 tuyên bố với thế giới về điều gì?",
                        "answers": [
                                "Nền độc lập của Việt Nam"
                        ],
                        "displayAnswer": "Nền độc lập của Việt Nam"
                },
                {
                        "id": 59,
                        "question": "Quảng trường Ba Đình nằm tại quận nào của Hà Nội?",
                        "answers": [
                                "Ba Đình"
                        ],
                        "displayAnswer": "Ba Đình"
                },
                {
                        "id": 60,
                        "question": "Lăng Chủ tịch Hồ Chí Minh hiện nằm tại quảng trường nào?",
                        "answers": [
                                "Quảng trường Ba Đình"
                        ],
                        "displayAnswer": "Quảng trường Ba Đình"
                },
                {
                        "id": 61,
                        "question": "Địa danh Tân Trào thuộc tỉnh nào hiện nay?",
                        "answers": [
                                "Tuyên Quang"
                        ],
                        "displayAnswer": "Tuyên Quang"
                },
                {
                        "id": 62,
                        "question": "Tân Trào thường được nhắc đến như căn cứ quan trọng của cuộc cách mạng nào?",
                        "answers": [
                                "Cách mạng Tháng Tám"
                        ],
                        "displayAnswer": "Cách mạng Tháng Tám"
                },
                {
                        "id": 63,
                        "question": "Quốc dân Đại hội Tân Trào diễn ra vào tháng nào năm 1945?",
                        "answers": [
                                "Tháng 8"
                        ],
                        "displayAnswer": "Tháng 8"
                },
                {
                        "id": 64,
                        "question": "Tổng khởi nghĩa giành chính quyền trên cả nước diễn ra chủ yếu trong tháng nào năm 1945?",
                        "answers": [
                                "Tháng 8"
                        ],
                        "displayAnswer": "Tháng 8"
                },
                {
                        "id": 65,
                        "question": "Sau Cách mạng Tháng Tám, chính quyền thuộc về ai?",
                        "answers": [
                                "Nhân dân"
                        ],
                        "displayAnswer": "Nhân dân"
                },
                {
                        "id": 66,
                        "question": "Cuộc Tổng tuyển cử đầu tiên của nước Việt Nam Dân chủ Cộng hòa diễn ra năm nào?",
                        "answers": [
                                "1946"
                        ],
                        "displayAnswer": "1946"
                },
                {
                        "id": 67,
                        "question": "Ngày Tổng tuyển cử đầu tiên là ngày nào?",
                        "answers": [
                                "6/1/1946"
                        ],
                        "displayAnswer": "6/1/1946"
                },
                {
                        "id": 68,
                        "question": "Hiến pháp đầu tiên của nước Việt Nam Dân chủ Cộng hòa được thông qua năm nào?",
                        "answers": [
                                "1946"
                        ],
                        "displayAnswer": "1946"
                },
                {
                        "id": 69,
                        "question": "Tên của bản Hiến pháp đầu tiên là gì?",
                        "answers": [
                                "Hiến pháp năm 1946"
                        ],
                        "displayAnswer": "Hiến pháp năm 1946"
                },
                {
                        "id": 70,
                        "question": "Bài hát “Tiến quân ca” được sáng tác vào khoảng năm nào?",
                        "answers": [
                                "1944"
                        ],
                        "displayAnswer": "1944"
                },
                {
                        "id": 71,
                        "question": "Nhạc sĩ Văn Cao sinh tại thành phố nào?",
                        "answers": [
                                "Hải Phòng"
                        ],
                        "displayAnswer": "Hải Phòng"
                },
                {
                        "id": 72,
                        "question": "“Độc lập – Tự do – Hạnh phúc” thường xuất hiện ở phần nào của văn bản hành chính Việt Nam?",
                        "answers": [
                                "Phần đầu văn bản, dưới Quốc hiệu"
                        ],
                        "displayAnswer": "Phần đầu văn bản, dưới Quốc hiệu"
                },
                {
                        "id": 73,
                        "question": "Ngày 2/9/1945 diễn ra sau khi Nhật Bản tuyên bố đầu hàng Đồng minh trong năm nào?",
                        "answers": [
                                "1945"
                        ],
                        "displayAnswer": "1945"
                },
                {
                        "id": 74,
                        "question": "Nhật Bản tuyên bố đầu hàng Đồng minh vào tháng nào năm 1945?",
                        "answers": [
                                "Tháng 8"
                        ],
                        "displayAnswer": "Tháng 8"
                },
                {
                        "id": 75,
                        "question": "Thắng lợi của Cách mạng Tháng Tám đã tạo điều kiện trực tiếp cho sự kiện lịch sử nào ngày 2/9?",
                        "answers": [
                                "Tuyên bố độc lập và thành lập nước Việt Nam Dân chủ Cộng hòa"
                        ],
                        "displayAnswer": "Tuyên bố độc lập và thành lập nước Việt Nam Dân chủ Cộng hòa"
                },
                {
                        "id": 76,
                        "question": "Điền vào chỗ trống: “Độc lập – _____ – Hạnh phúc”.",
                        "answers": [
                                "Tự do"
                        ],
                        "displayAnswer": "Tự do"
                },
                {
                        "id": 77,
                        "question": "Điền vào chỗ trống: “Quảng trường _____” – nơi Bác Hồ đọc Tuyên ngôn Độc lập.",
                        "answers": [
                                "Ba Đình"
                        ],
                        "displayAnswer": "Ba Đình"
                },
                {
                        "id": 78,
                        "question": "Điền vào chỗ trống: “Tiến _____ ca”.",
                        "answers": [
                                "Quân"
                        ],
                        "displayAnswer": "Quân"
                },
                {
                        "id": 79,
                        "question": "Điền vào chỗ trống: “Cờ đỏ sao _____”.",
                        "answers": [
                                "Vàng"
                        ],
                        "displayAnswer": "Vàng"
                },
                {
                        "id": 80,
                        "question": "Điền vào chỗ trống: “Cách mạng Tháng _____”.",
                        "answers": [
                                "Tám"
                        ],
                        "displayAnswer": "Tám"
                },
                {
                        "id": 81,
                        "question": "1945 + 81 bằng bao nhiêu?",
                        "answers": [
                                "2026"
                        ],
                        "displayAnswer": "2026"
                },
                {
                        "id": 82,
                        "question": "Nếu Quốc khánh lần thứ nhất là năm 1945 thì năm 2025 đánh dấu tròn bao nhiêu năm?",
                        "answers": [
                                "80 năm"
                        ],
                        "displayAnswer": "80 năm"
                },
                {
                        "id": 83,
                        "question": "Từ ngày 19/8/1945 đến ngày 2/9/1945 là khoảng bao nhiêu ngày?",
                        "answers": [
                                "14 ngày"
                        ],
                        "displayAnswer": "14 ngày"
                },
                {
                        "id": 84,
                        "question": "Tôi có nền đỏ, giữa thân có ngôi sao vàng năm cánh. Tôi là gì?",
                        "answers": [
                                "Quốc kỳ Việt Nam"
                        ],
                        "displayAnswer": "Quốc kỳ Việt Nam"
                },
                {
                        "id": 85,
                        "question": "Tôi là bài hát được cất lên trong những nghi lễ trang trọng của đất nước. Tôi là gì?",
                        "answers": [
                                "Quốc ca – Tiến quân ca"
                        ],
                        "displayAnswer": "Quốc ca – Tiến quân ca"
                },
                {
                        "id": 86,
                        "question": "Tôi nằm ở Hà Nội, ngày 2/9/1945 hàng vạn người đã tập trung để nghe lời tuyên bố độc lập. Tôi là đâu?",
                        "answers": [
                                "Quảng trường Ba Đình"
                        ],
                        "displayAnswer": "Quảng trường Ba Đình"
                },
                {
                        "id": 87,
                        "question": "Tôi là một văn kiện lịch sử, được Chủ tịch Hồ Chí Minh đọc vào ngày 2/9/1945. Tôi là gì?",
                        "answers": [
                                "Tuyên ngôn Độc lập"
                        ],
                        "displayAnswer": "Tuyên ngôn Độc lập"
                },
                {
                        "id": 88,
                        "question": "Tôi là căn nhà ở khu phố cổ Hà Nội, nơi bản Tuyên ngôn Độc lập được soạn thảo. Địa chỉ của tôi là gì?",
                        "answers": [
                                "48 Hàng Ngang"
                        ],
                        "displayAnswer": "48 Hàng Ngang"
                },
                {
                        "id": 89,
                        "question": "Tôi có năm cánh, màu vàng và nằm giữa nền đỏ. Tôi là gì?",
                        "answers": [
                                "Ngôi sao trên Quốc kỳ Việt Nam"
                        ],
                        "displayAnswer": "Ngôi sao trên Quốc kỳ Việt Nam"
                },
                {
                        "id": 90,
                        "question": "“Hỡi đồng bào cả nước!” gợi nhắc tới sự kiện lịch sử trọng đại nào?",
                        "answers": [
                                "Lễ Độc lập ngày 2/9/1945"
                        ],
                        "displayAnswer": "Lễ Độc lập ngày 2/9/1945"
                },
                {
                        "id": 91,
                        "question": "Một ngày đầu thu năm 1945, tại Ba Đình vang lên lời tuyên bố một dân tộc đã giành lại tự do. Đó là ngày nào?",
                        "answers": [
                                "2/9/1945"
                        ],
                        "displayAnswer": "2/9/1945"
                },
                {
                        "id": 92,
                        "question": "Một nhạc sĩ tên Văn Cao để lại tác phẩm được cả nước hát trong lễ chào cờ. Đó là bài gì?",
                        "answers": [
                                "Tiến quân ca"
                        ],
                        "displayAnswer": "Tiến quân ca"
                },
                {
                        "id": 93,
                        "question": "Tôi gồm ba từ khóa: Độc lập, Tự do và một từ chỉ cuộc sống tốt đẹp. Từ còn lại là gì?",
                        "answers": [
                                "Hạnh phúc"
                        ],
                        "displayAnswer": "Hạnh phúc"
                },
                {
                        "id": 94,
                        "question": "Không phải tháng Một, cũng chẳng tháng Tám; tôi đứng ngay sau tháng Tám và có ngày Quốc khánh Việt Nam. Tôi là tháng nào?",
                        "answers": [
                                "Tháng 9"
                        ],
                        "displayAnswer": "Tháng 9"
                },
                {
                        "id": 95,
                        "question": "Ngày của tôi mang số 2, tháng của tôi mang số 9, năm lịch sử của tôi là 1945. Tôi là ngày gì?",
                        "answers": [
                                "Ngày Quốc khánh Việt Nam"
                        ],
                        "displayAnswer": "Ngày Quốc khánh Việt Nam"
                },
                {
                        "id": 96,
                        "question": "Tôi là thành phố nghìn năm văn hiến và là nơi diễn ra Lễ Độc lập ngày 2/9/1945. Tôi là đâu?",
                        "answers": [
                                "Hà Nội"
                        ],
                        "displayAnswer": "Hà Nội"
                },
                {
                        "id": 97,
                        "question": "Một vị lãnh tụ sinh năm 1890, đọc Tuyên ngôn Độc lập năm 1945. Đó là ai?",
                        "answers": [
                                "Chủ tịch Hồ Chí Minh"
                        ],
                        "displayAnswer": "Chủ tịch Hồ Chí Minh"
                },
                {
                        "id": 98,
                        "question": "Hai màu nào xuất hiện trên Quốc kỳ Việt Nam?",
                        "answers": [
                                "Đỏ và vàng"
                        ],
                        "displayAnswer": "Đỏ và vàng"
                },
                {
                        "id": 99,
                        "question": "Một biểu tượng có 1 ngôi sao nhưng 5 cánh, thường tung bay trong ngày Quốc khánh. Đó là gì?",
                        "answers": [
                                "Cờ đỏ sao vàng"
                        ],
                        "displayAnswer": "Cờ đỏ sao vàng"
                },
                {
                        "id": 100,
                        "question": "Câu đố cuối: “Ngày nào cả nước cờ hoa, Ba Đình lịch sử ngân xa lời Người?”",
                        "answers": [
                                "Ngày 2/9 – Quốc khánh Việt Nam"
                        ],
                        "displayAnswer": "Ngày 2/9 – Quốc khánh Việt Nam"
                }
        ];

        const state = {
                serverOffset: 0,
                progress: null,
                currentYear: null,
                timerId: null,
                timerDeadline: 0,
                busy: false,

                // Khóa riêng cho việc gửi đáp án.
                // Không dùng chung state.busy để tránh một tác vụ khác
                // làm kẹt nút Gửi đáp án / tự chuyển câu khi hết giờ.
                answerSubmitting: false,
                answerSubmitStartedAt: 0,
                answerSubmitSerial: 0,

        };

        function getCurrentUserSafe() {
                try {
                        if (typeof currentUser !== 'undefined' && currentUser?.username) {
                                return currentUser;
                        }
                } catch (_) { }

                try {
                        return JSON.parse(localStorage.getItem('currentUser') || 'null');
                } catch (_) {
                        return null;
                }
        }

        function getDbSafe() {
                try {
                        if (typeof db !== 'undefined' && db) return db;
                } catch (_) { }
                return null;
        }

        function now() {
                return Date.now() + state.serverOffset;
        }

        function getVietnamParts(timestamp = now()) {
                const d = new Date(timestamp + 7 * 60 * 60 * 1000);
                return {
                        year: d.getUTCFullYear(),
                        month: d.getUTCMonth() + 1,
                        day: d.getUTCDate(),
                        hour: d.getUTCHours(),
                        minute: d.getUTCMinutes(),
                        second: d.getUTCSeconds()
                };
        }

        function vietnamTimestamp(year, month, day, hour = 0, minute = 0, second = 0, ms = 0) {
                return Date.UTC(year, month - 1, day, hour - 7, minute, second, ms);
        }

        function getAnnualWindow(timestamp = now()) {
                const year = getVietnamParts(timestamp).year;
                const start = vietnamTimestamp(year, 8, 31, 0, 0, 0, 0);
                const endExclusive = vietnamTimestamp(year, 9, 6, 0, 0, 0, 0);

                if (timestamp >= start && timestamp < endExclusive) {
                        return { year, start, end: endExclusive - 1, isOpen: true };
                }

                if (timestamp < start) {
                        return { year, start, end: endExclusive - 1, isOpen: false, nextStart: start };
                }

                const nextYear = year + 1;
                return {
                        year,
                        start,
                        end: endExclusive - 1,
                        isOpen: false,
                        nextStart: vietnamTimestamp(nextYear, 8, 31, 0, 0, 0, 0)
                };
        }

        function formatVietnamDateTime(timestamp) {
                return new Intl.DateTimeFormat('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                }).format(new Date(timestamp));
        }

        function normalizeAnswer(value) {
                return String(value ?? '')
                        .normalize('NFC')
                        .toLowerCase() // ✅ Chỉ giữ lại dòng này
                        .replace(/[.,!?;:…“”"'‘’()[\]{}]/g, ' ')
                        .replace(/[–—-]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
        }

        function isCorrectAnswer(question, input) {
                const normalizedInput = normalizeAnswer(input);
                if (!normalizedInput) return false;
                return (question.answers || []).some(answer =>
                        normalizeAnswer(answer) === normalizedInput
                );
        }

        function shuffle(values) {
                const arr = [...values];
                for (let i = arr.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
        }

        function getQuestionById(id) {
                return QUESTIONS.find(q => Number(q.id) === Number(id)) || null;
        }

        function escapeHtml(value) {
                return String(value ?? '')
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;');
        }

        function notify(message, type = 'success') {
                if (typeof window.showToast === 'function') {
                        window.showToast(message, type);
                } else {
                        alert(message);
                }
        }

        function gameSectionAvailable() {
                if (window.currentActiveExamId) return false;
                const locked = document.getElementById('gameLockedView');
                const active = document.getElementById('gameActiveView');
                if (!active) return true;
                if (locked && getComputedStyle(locked).display !== 'none') return false;
                return getComputedStyle(active).display !== 'none';
        }

        function guardCanPlay() {
                if (window.currentActiveExamId) {
                        notify('Bạn đang làm bài thi nên không thể mở sự kiện lúc này.', 'error');
                        return false;
                }
                if (!gameSectionAvailable()) {
                        notify('Mục Trò chơi đang bị giáo viên tạm khóa.', 'error');
                        return false;
                }
                const eventWindow = getAnnualWindow();
                if (!eventWindow.isOpen) {
                        notify('Sự kiện chỉ mở từ 31/08 đến hết 05/09 hằng năm.', 'error');
                        return false;
                }
                return true;
        }

        function progressRef(year = state.currentYear) {
                const user = getCurrentUserSafe();
                const database = getDbSafe();
                if (!user?.username || !database || !year) return null;
                return database.ref(`${CONFIG.progressRoot}/${user.username}/${year}`);
        }

        async function loadServerOffset() {
                const database = getDbSafe();
                if (!database) return;
                try {
                        const snap = await database.ref('.info/serverTimeOffset').once('value');
                        state.serverOffset = Number(snap.val()) || 0;
                } catch (error) {
                        console.warn('[Lịch sử hào hùng] Không lấy được serverTimeOffset:', error);
                        state.serverOffset = 0;
                }
        }

        async function loadProgress() {
                const eventWindow = getAnnualWindow();
                state.currentYear = eventWindow.isOpen
                        ? eventWindow.year
                        : getVietnamParts().year;
                const ref = progressRef(state.currentYear);
                if (!ref) return null;
                try {
                        const snap = await ref.once('value');
                        state.progress = snap.val() || null;
                        return state.progress;
                } catch (error) {
                        console.error('[Lịch sử hào hùng] Không đọc được tiến trình:', error);
                        return null;
                }
        }

        function buildShell() {
                if (document.getElementById('historyHeroOverlay')) return;

                const overlay = document.createElement('div');
                overlay.id = 'historyHeroOverlay';
                overlay.className = 'history-hero-overlay ui-theme-immune';
                overlay.innerHTML = `
            <div class="history-hero-modal" role="dialog" aria-modal="true" aria-labelledby="historyHeroTitle">
                <button type="button" class="history-hero-close" aria-label="Đóng">✕</button>
                <div class="history-hero-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
                <div id="historyHeroView"></div>
            </div>
        `;
                document.body.appendChild(overlay);

                overlay.querySelector('.history-hero-close')?.addEventListener('click', closeModal);
                overlay.addEventListener('mousedown', e => {
                        if (e.target === overlay && !isGameInProgress()) closeModal();
                });
        }

        function injectEventCard() {
                if (document.getElementById('historyHeroEventCard')) return;
                const activeView = document.getElementById('gameActiveView');
                if (!activeView) return;

                const card = document.createElement('div');
                card.id = 'historyHeroEventCard';
                card.className = 'card history-hero-event-card ui-theme-immune';
                card.innerHTML = `
            <div class="history-card-copy">
                <div class="history-card-kicker">🇻🇳 SỰ KIỆN HẰNG NĂM</div>
                <h3>Lịch sử hào hùng</h3>
                <p id="historyHeroCardStatus">Đang kiểm tra thời gian sự kiện...</p>
            </div>
            <div class="history-card-actions">
                <button type="button" class="history-info-btn">Giới thiệu</button>
                <button type="button" class="history-join-btn">Tham gia ➜</button>
            </div>
        `;

                const royal = document.getElementById('royalEventCard');
                if (royal?.parentElement === activeView) {
                        royal.insertAdjacentElement('afterend', card);
                } else {
                        activeView.appendChild(card);
                }

                card.querySelector('.history-info-btn')?.addEventListener('click', () => openModal('intro'));
                card.querySelector('.history-join-btn')?.addEventListener('click', () => openModal('landing'));
                refreshCard();
        }

        function refreshCard() {
                const card = document.getElementById('historyHeroEventCard');
                if (!card) return;
                const status = card.querySelector('#historyHeroCardStatus');
                const join = card.querySelector('.history-join-btn');
                const w = getAnnualWindow();

                card.dataset.state = w.isOpen ? 'open' : 'closed';
                if (w.isOpen) {
                        status.textContent = `Đang mở • 31/08 – 05/09/${w.year} • 10 câu, 50 giây mỗi câu.`;
                        join.disabled = false;
                        if (state.progress?.status === 'completed') {
                                join.textContent = `Xem kết quả ${Number(state.progress.score) || 0}/10`;
                        } else if (state.progress?.status === 'in_progress') {
                                join.textContent = 'Tiếp tục ➜';
                        } else {
                                join.textContent = 'Tham gia ➜';
                        }
                } else {
                        status.textContent = `Mở hằng năm từ 31/08 đến 05/09 • Lần tới: ${formatVietnamDateTime(w.nextStart)}.`;
                        join.disabled = true;
                        join.textContent = 'Chưa mở';
                }
        }

        function openOverlay() {
                buildShell();
                document.getElementById('historyHeroOverlay')?.classList.add('active');
                document.body.classList.add('history-hero-modal-open');
        }

        function closeModal() {
                if (isGameInProgress()) {
                        const ok = confirm('Đồng hồ vẫn tiếp tục chạy. Bạn có chắc muốn đóng cửa sổ sự kiện?');
                        if (!ok) return;
                }
                document.getElementById('historyHeroOverlay')?.classList.remove('active');
                document.body.classList.remove('history-hero-modal-open');
        }

        function renderLanding() {
                const view = document.getElementById('historyHeroView');
                if (!view) return;
                const w = getAnnualWindow();
                const p = state.progress;
                const completed = p?.status === 'completed';
                const inProgress = p?.status === 'in_progress';
                const buttonLabel = completed ? 'Xem kết quả' : (inProgress ? 'Tiếp tục' : 'Bắt đầu');

                view.innerHTML = `
            <section class="history-landing">
                <div class="history-flag-mark" aria-hidden="true"><span>★</span></div>
                <div class="history-kicker">31/08 – 05/09 • HẰNG NĂM</div>
                <h2 id="historyHeroTitle">LỊCH SỬ HÀO HÙNG</h2>
                <p class="history-subtitle">10 câu hỏi ngẫu nhiên về Quốc khánh Việt Nam 2/9. Mỗi câu đúng được 1 điểm.</p>
                ${completed ? `<div class="history-completed-note">Bạn đã hoàn thành mùa ${state.currentYear} với <strong>${Number(p.score) || 0}/10 điểm</strong>.</div>` : ''}
                ${!w.isOpen ? `<div class="history-closed-note">Sự kiện hiện chưa mở. Lần tới bắt đầu lúc ${escapeHtml(formatVietnamDateTime(w.nextStart))}.</div>` : ''}
                <div class="history-primary-actions">
                    <button type="button" id="historyStartBtn" class="history-primary-btn" ${!w.isOpen ? 'disabled' : ''}>${buttonLabel}</button>
                    <button type="button" id="historyIntroBtn" class="history-secondary-btn">Giới thiệu</button>
                </div>
            </section>
        `;

                view.querySelector('#historyIntroBtn')?.addEventListener('click', renderIntro);
                view.querySelector('#historyStartBtn')?.addEventListener('click', async () => {
                        if (!guardCanPlay()) return;
                        if (completed) return renderResult();
                        if (inProgress) return resumeGame();
                        await startNewGame();
                });
        }

        function renderIntro() {
                const view = document.getElementById('historyHeroView');
                if (!view) return;
                view.innerHTML = `
            <section class="history-intro">
                <div class="history-kicker">HƯỚNG DẪN SỰ KIỆN</div>
                <h2>Cách chơi & phần thưởng</h2>
                <div class="history-rule-grid">
                    <article><b>🎯 Cách chơi</b><p>Hệ thống chọn ngẫu nhiên 10 câu trong bộ 100 câu có sẵn. Trả lời đúng 1 câu = 1 điểm.</p></article>
                    <article><b>⏱️ Thời gian</b><p>Mỗi câu có 50 giây. Hết giờ mà chưa gửi đáp án sẽ tính là bỏ câu và tự chuyển câu tiếp theo.</p></article>
                    <article><b>⌨️ Nhập đáp án</b><p>Phải đúng từng chữ và dấu tiếng Việt. Không phân biệt chữ hoa/thường; dấu chấm, phẩy và một số dấu câu không ảnh hưởng kết quả.</p></article>
                    <article><b>🏁 Giới hạn</b><p>Mỗi mùa sự kiện có 1 lượt chính thức. Nếu tải lại trang giữa chừng, hệ thống tiếp tục tiến trình đã lưu.</p></article>
                </div>
                <div class="history-reward-table">
                    <div><strong>0–4 điểm</strong><span>Chưa nhận vật phẩm</span></div>
                    <div><strong>5–6 điểm</strong><span>🌄 Vật phẩm Nền tag 2/9 • Cửa hàng thường</span></div>
                    <div><strong>7 điểm</strong><span>🖼️ Khung viền tag 2/9 • Cửa hàng thường</span></div>
                    <div><strong>8 điểm</strong><span>🎨 Giao diện tag 2/9 • Cửa hàng thường</span></div>
                    <div><strong>9 điểm</strong><span>🎁 Chọn 1: Thú cưng / Hiệu ứng / Giao diện tag 2/9 • Cửa hàng thường</span></div>
                    <div><strong>10 điểm</strong><span>👑 Vật phẩm tag Quốc khánh • Cửa hàng Sang trọng</span></div>
                </div>
                <div class="history-bottom-actions">
                    <button type="button" id="historyBackBtn" class="history-secondary-btn">← Quay lại</button>
                    <button type="button" id="historyIntroStartBtn" class="history-primary-btn">Bắt đầu</button>
                </div>
            </section>
        `;
                view.querySelector('#historyBackBtn')?.addEventListener('click', renderLanding);
                view.querySelector('#historyIntroStartBtn')?.addEventListener('click', async () => {
                        if (!guardCanPlay()) return;
                        if (state.progress?.status === 'completed') return renderResult();
                        if (state.progress?.status === 'in_progress') return resumeGame();
                        await startNewGame();
                });
        }

        async function openModal(mode = 'landing') {
                await loadProgress();
                openOverlay();
                if (mode === 'intro') renderIntro();
                else if (state.progress?.status === 'completed' && mode === 'result') renderResult();
                else renderLanding();
        }

        function isGameInProgress() {
                return Boolean(state.progress?.status === 'in_progress');
        }

        async function startNewGame() {
                if (state.busy) return;
                state.busy = true;
                try {
                        const w = getAnnualWindow();
                        if (!w.isOpen) return renderLanding();
                        state.currentYear = w.year;
                        const ref = progressRef(w.year);
                        if (!ref) throw new Error('Không tìm thấy Firebase hoặc tài khoản học sinh.');

                        const ids = shuffle(QUESTIONS.map(q => q.id)).slice(0, CONFIG.questionCount);
                        const started = now();
                        const candidate = {
                                eventId: CONFIG.id,
                                eventName: CONFIG.title,
                                year: w.year,
                                status: 'in_progress',
                                questionIds: ids,
                                currentIndex: 0,
                                score: 0,
                                startedAt: started,
                                updatedAt: started,
                                questionDeadline: started + CONFIG.secondsPerQuestion * 1000,
                                rewardStatus: 'pending',
                                rewardTier: 'pending',
                                answerLog: {}
                        };

                        const tx = await ref.transaction(current => current || candidate);
                        state.progress = tx.snapshot.val() || candidate;
                        refreshCard();
                        if (state.progress.status === 'completed') renderResult();
                        else renderGame();
                } catch (error) {
                        console.error('[Lịch sử hào hùng] Không thể bắt đầu:', error);
                        notify('Không thể bắt đầu sự kiện. Kiểm tra Firebase Rules và kết nối mạng.', 'error');
                } finally {
                        state.busy = false;
                }
        }

        async function resumeGame() {
                if (!state.progress) await loadProgress();
                if (state.progress?.status === 'completed') return renderResult();
                if (state.progress?.status !== 'in_progress') return startNewGame();

                if (Number(state.progress.currentIndex) >= CONFIG.questionCount) {
                        await completeProgressIfNeeded();
                        return renderResult();
                }

                if (Number(state.progress.questionDeadline) <= now()) {
                        await submitCurrentQuestion({ timeout: true });
                        return;
                }
                renderGame();
        }

        function renderGame() {
                stopTimer();
                const p = state.progress;
                const index = Number(p?.currentIndex) || 0;
                const questionId = p?.questionIds?.[index];
                const question = getQuestionById(questionId);
                const view = document.getElementById('historyHeroView');
                if (!view || !question) {
                        completeProgressIfNeeded().then(renderResult);
                        return;
                }

                view.innerHTML = `
            <section class="history-game">
                <div class="history-game-topbar">
                    <div><span>Câu</span><strong>${index + 1}/${CONFIG.questionCount}</strong></div>
                    <div><span>Điểm</span><strong id="historyScore">${Number(p.score) || 0}</strong></div>
                    <div class="history-timer-box"><span>Thời gian</span><strong id="historyTimer">50</strong><small>giây</small></div>
                </div>
                <div class="history-progress"><span style="width:${((index + 1) / CONFIG.questionCount) * 100}%"></span></div>
                <div class="history-question-card">
                    <div class="history-question-label">CÂU HỎI #${question.id}</div>
                    <h3>${escapeHtml(question.question)}</h3>
                    <label class="history-answer-label" for="historyAnswerInput">Nhập đáp án</label>
                    <input id="historyAnswerInput" class="history-answer-input" type="text" autocomplete="off" autocapitalize="sentences" spellcheck="false" maxlength="180" placeholder="Nhập đáp án chính xác...">
                    <div id="historyFeedback" class="history-feedback" aria-live="polite"></div>
                    <button type="button" id="historySubmitAnswer" class="history-primary-btn history-submit-btn">Gửi đáp án</button>
                </div>
                <p class="history-answer-note">Không phân biệt chữ hoa/thường. Dấu chấm, phẩy và dấu câu thông dụng được bỏ qua khi chấm.</p>
            </section>
        `;

                const input = view.querySelector('#historyAnswerInput');
                const submit = view.querySelector('#historySubmitAnswer');
                input?.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                                e.preventDefault();
                                submit?.click();
                        }
                });
                submit?.addEventListener('click', () => submitCurrentQuestion({ input: input?.value || '' }));
                setTimeout(() => input?.focus(), 50);
                startTimer(Number(p.questionDeadline) || (now() + CONFIG.secondsPerQuestion * 1000));
        }

        function startTimer(deadline) {
                stopTimer();

                state.timerDeadline = deadline;

                const tick = () => {
                        const timer = document.getElementById('historyTimer');
                        const remaining = Math.max(0, Math.ceil((deadline - now()) / 1000));

                        if (timer) {
                                timer.textContent = String(remaining);
                                timer.parentElement?.classList.toggle('danger', remaining <= 10);
                        }

                        if (remaining <= 0) {
                                // QUAN TRỌNG: interval đã được gán trước khi tick chạy,
                                // nên stopTimer() luôn dừng đúng interval hiện tại.
                                stopTimer();

                                // Không chờ người dùng bấm nút. Hết giờ phải tự nộp
                                // và chuyển sang câu kế tiếp.
                                void submitCurrentQuestion({ timeout: true });
                        }
                };

                // Gán interval TRƯỚC rồi mới tick lần đầu.
                // Bản cũ làm ngược lại nên câu đã hết hạn có thể kẹt ở 0 giây.
                state.timerId = setInterval(tick, 250);
                tick();
        }

        function stopTimer() {
                if (state.timerId) clearInterval(state.timerId);
                state.timerId = null;
        }

        async function submitCurrentQuestion({ input = '', timeout = false } = {}) {
                if (state.progress?.status !== 'in_progress') return;

                /*
                 * Khóa RIÊNG cho đáp án, không dùng state.busy.
                 * Nếu request cũ treo quá 10 giây thì tự vô hiệu hóa request cũ
                 * và cho game phục hồi, tránh kẹt vĩnh viễn ở 0 giây.
                 */
                if (state.answerSubmitting) {
                        const submittingFor = Date.now() - Number(state.answerSubmitStartedAt || 0);

                        if (submittingFor < 10000) {
                                return;
                        }

                        state.answerSubmitting = false;
                        state.answerSubmitStartedAt = 0;
                }

                const index = Number(state.progress.currentIndex) || 0;
                const questionId = state.progress.questionIds?.[index];
                const question = getQuestionById(questionId);
                if (!question) return;

                const ref = progressRef();
                if (!ref) {
                        notify('Không tìm thấy tiến trình Firebase của sự kiện. Hãy tải lại trang rồi thử lại.', 'error');
                        return;
                }

                const submitSerial = ++state.answerSubmitSerial;
                state.answerSubmitting = true;
                state.answerSubmitStartedAt = Date.now();

                /*
                 * Dừng timer ngay khi bắt đầu gửi (cả gửi tay lẫn hết giờ).
                 * Bản cũ để timer tiếp tục chạy khi gửi tay, có thể phát sinh một lần
                 * submit timeout song song nếu Firebase phản hồi chậm và làm UI kẹt câu.
                 * Nếu lưu thất bại, renderGame() sẽ khởi động lại timer theo deadline hiện tại.
                 */
                stopTimer();

                const inputEl = document.getElementById('historyAnswerInput');
                const button = document.getElementById('historySubmitAnswer');
                const feedback = document.getElementById('historyFeedback');

                if (inputEl) inputEl.disabled = true;

                if (button) {
                        button.disabled = true;
                        button.dataset.originalText = button.textContent || 'Gửi đáp án';
                        button.textContent = timeout
                                ? 'Hết giờ — đang chuyển câu...'
                                : 'Đang gửi...';
                }

                const expired = now() >= Number(state.progress.questionDeadline || 0);
                const wasTimeout = Boolean(timeout || expired);

                /*
                 * Watchdog: Firebase transaction bình thường phản hồi rất nhanh.
                 * Nếu 10 giây vẫn chưa xong, đọc lại tiến trình và dựng lại game.
                 * Serial làm request cũ mất quyền thay đổi UI nếu nó phản hồi muộn.
                 */
                const watchdog = setTimeout(async () => {
                        if (
                                state.answerSubmitSerial !== submitSerial ||
                                !state.answerSubmitting
                        ) {
                                return;
                        }

                        console.warn(
                                '[Lịch sử hào hùng] Firebase gửi đáp án phản hồi quá chậm. Tự phục hồi giao diện.'
                        );

                        // Vô hiệu hóa request hiện tại nếu nó phản hồi muộn.
                        state.answerSubmitSerial++;
                        state.answerSubmitting = false;
                        state.answerSubmitStartedAt = 0;

                        try {
                                await loadProgress();
                        } catch (_) { }

                        notify(
                                'Máy chủ phản hồi chậm. Hệ thống đã tự đồng bộ lại câu hỏi.',
                                'warning'
                        );

                        if (state.progress?.status === 'completed') {
                                renderResult();
                        } else {
                                renderGame();
                        }
                }, 10000);

                try {
                        const correct = !wasTimeout && isCorrectAnswer(question, input);
                        const processedAt = now();
                        const fallbackYear = Number(
                                state.currentYear ||
                                getAnnualWindow().year ||
                                getVietnamParts().year
                        );

                        /*
                         * QUAN TRỌNG VỚI FIREBASE TRANSACTION:
                         * updateFunction có thể được gọi lần đầu với `current === null`
                         * khi cache cục bộ ở ref này chưa kịp có dữ liệu, dù dữ liệu thật
                         * trên server vẫn tồn tại. Nếu `return` ngay ở lần gọi đó thì
                         * transaction bị abort (committed = false) và UI lại render câu cũ.
                         *
                         * Đọc server một lần ngay trước transaction và dùng snapshot đó
                         * làm fallback. Khi server phát hiện hash khác, Firebase vẫn tự retry
                         * callback bằng dữ liệu mới nhất nên không làm mất cơ chế chống race.
                         */
                        const preflightSnap = await ref.once('value');
                        const preflightProgress = preflightSnap.val() || state.progress || null;

                        if (!preflightProgress || preflightProgress.status !== 'in_progress') {
                                state.progress = preflightProgress;

                                if (state.progress?.status === 'completed') {
                                        return renderResult();
                                }

                                await loadProgress();
                                return state.progress?.status === 'completed'
                                        ? renderResult()
                                        : renderGame();
                        }

                        // Nếu server đã sang câu khác (tab/request khác xử lý trước),
                        // chỉ đồng bộ UI; tuyệt đối không nộp lại câu cũ.
                        if ((Number(preflightProgress.currentIndex) || 0) !== index) {
                                state.progress = preflightProgress;
                                return renderGame();
                        }

                        const tx = await ref.transaction(current => {
                                const base = current || preflightProgress;
                                if (!base || base.status !== 'in_progress') return;

                                const remoteIndex = Number(base.currentIndex) || 0;

                                // Một tab/request khác đã xử lý câu này rồi.
                                if (remoteIndex !== index) return;

                                const nextIndex = index + 1;
                                const nextScore = Math.min(
                                        CONFIG.questionCount,
                                        (Number(base.score) || 0) + (correct ? 1 : 0)
                                );

                                const log = Object.assign({}, base.answerLog || {});
                                log[String(index)] = {
                                        questionId: Number(question.id),
                                        correct: Boolean(correct),
                                        timeout: Boolean(wasTimeout),
                                        answeredAt: processedAt
                                };

                                const nextData = Object.assign({}, base, {
                                        eventId: CONFIG.id,
                                        eventName: CONFIG.title,
                                        year: Number(base.year) >= 2026
                                                ? Number(base.year)
                                                : fallbackYear,
                                        startedAt: Number(base.startedAt) || processedAt,
                                        currentIndex: nextIndex,
                                        score: nextScore,
                                        updatedAt: processedAt,
                                        answerLog: log,
                                        questionDeadline: nextIndex < CONFIG.questionCount
                                                ? processedAt + CONFIG.secondsPerQuestion * 1000
                                                : 0,
                                        status: nextIndex >= CONFIG.questionCount
                                                ? 'completed'
                                                : 'in_progress'
                                });

                                if (nextIndex >= CONFIG.questionCount) {
                                        nextData.completedAt = processedAt;
                                } else if (nextData.completedAt == null) {
                                        delete nextData.completedAt;
                                }

                                return nextData;
                        });

                        /* Request này đã bị watchdog/request mới thay thế. */
                        if (state.answerSubmitSerial !== submitSerial) {
                                return;
                        }

                        if (!tx.committed) {
                                await loadProgress();

                                if (state.progress?.status === 'completed') {
                                        return renderResult();
                                }

                                return renderGame();
                        }

                        state.progress = tx.snapshot.val();
                        stopTimer();

                        /*
                         * Không tin mù snapshot cục bộ: xác nhận currentIndex thật sự đã tăng.
                         * Nếu dữ liệu Firebase/transaction bị lệch do tab khác hoặc cache cũ,
                         * đọc lại một lần trước khi dựng câu tiếp theo.
                         */
                        if (
                                state.progress?.status === 'in_progress' &&
                                Number(state.progress.currentIndex) <= index
                        ) {
                                await loadProgress();
                        }

                        if (
                                state.progress?.status === 'in_progress' &&
                                Number(state.progress.currentIndex) <= index
                        ) {
                                throw new Error(
                                        `Firebase đã phản hồi nhưng currentIndex không tăng (đang ở ${Number(state.progress.currentIndex) || 0}).`
                                );
                        }

                        if (button) {
                                button.textContent = 'Đã gửi';
                        }

                        if (feedback) {
                                feedback.className = `history-feedback show ${correct ? 'correct' : 'wrong'}`;
                                feedback.innerHTML = correct
                                        ? '✅ Chính xác! +1 điểm'
                                        : (wasTimeout
                                                ? `⏰ Hết 50 giây. Đáp án: <b>${escapeHtml(question.displayAnswer)}</b>`
                                                : `❌ Chưa đúng. Đáp án: <b>${escapeHtml(question.displayAnswer)}</b>`);
                        }

                        await new Promise(resolve => setTimeout(resolve, 650));

                        if (state.answerSubmitSerial !== submitSerial) {
                                return;
                        }

                        if (state.progress?.status === 'completed') {
                                try {
                                        await finalizeRewardState();
                                } catch (rewardError) {
                                        console.error(
                                                '[Lịch sử hào hùng] Đáp án đã lưu nhưng chưa thể xác nhận phần thưởng:',
                                                rewardError
                                        );
                                }

                                await renderResult();
                        } else {
                                renderGame();
                        }
                } catch (error) {
                        if (state.answerSubmitSerial !== submitSerial) {
                                return;
                        }

                        console.error('[Lịch sử hào hùng] Lỗi ghi đáp án:', error);

                        const permissionDenied =
                                error?.code === 'PERMISSION_DENIED' ||
                                error?.code === 'permission_denied';

                        notify(
                                permissionDenied
                                        ? 'Firebase Rules đang từ chối lưu đáp án của Lịch Sử Hào Hùng.'
                                        : 'Không thể lưu đáp án. Hãy kiểm tra kết nối mạng rồi thử lại.',
                                'error'
                        );

                        try {
                                await loadProgress();
                        } catch (_) { }

                        if (state.progress?.status === 'completed') {
                                renderResult();
                        } else {
                                renderGame();
                        }
                } finally {
                        clearTimeout(watchdog);

                        if (state.answerSubmitSerial === submitSerial) {
                                state.answerSubmitting = false;
                                state.answerSubmitStartedAt = 0;
                        }
                }
        }

        async function completeProgressIfNeeded() {
                const ref = progressRef();
                if (!ref || !state.progress) return;
                if (state.progress.status === 'completed') return finalizeRewardState();

                const completedAt = now();
                const tx = await ref.transaction(current => {
                        if (!current) return;
                        if (Number(current.currentIndex) < CONFIG.questionCount) return;
                        if (current.status === 'completed') return current;
                        return Object.assign({}, current, { status: 'completed', completedAt, updatedAt: completedAt, questionDeadline: 0 });
                });
                if (tx.snapshot.exists()) state.progress = tx.snapshot.val();
                return finalizeRewardState();
        }

        function normalizeSearch(value) {
                return String(value ?? '')
                        .normalize('NFD')
                        .replace(/[̀-ͯ]/g, '')
                        .replace(/đ/g, 'd')
                        .replace(/Đ/g, 'D')
                        .toLowerCase();
        }

        function isNationalDayItem(item) {
                if (!item) return false;
                const corpus = [item.name, item.tag, ...(Array.isArray(item.tags) ? item.tags : [])]
                        .map(normalizeSearch)
                        .join(' | ');
                return corpus.includes('2/9') || corpus.includes('quoc khanh');
        }

        function getStoreItems() {
                try {
                        return (typeof StoreConfig !== 'undefined' && Array.isArray(StoreConfig.items))
                                ? StoreConfig.items
                                : [];
                } catch (_) {
                        return [];
                }
        }

        function isLuxuryItem(item) {
                if (!item) return false;
                if (item.luxuryOnly === true) return true;
                try {
                        return Boolean(window.LuxuryStore?.isLuxuryItem?.(item.id));
                } catch (_) {
                        return false;
                }
        }

        function findRewardItem(type, luxury = false) {
                const items = getStoreItems();
                const preferred = CONFIG.preferredRewardIds[luxury ? 'luxury' : type] || [];
                for (const id of preferred) {
                        const exact = items.find(i => String(i.id) === String(id));
                        if (exact && (luxury ? isLuxuryItem(exact) : !isLuxuryItem(exact))) return exact;
                }

                return items.find(item =>
                        isNationalDayItem(item) &&
                        (luxury ? isLuxuryItem(item) : !isLuxuryItem(item)) &&
                        (luxury || item.type === type)
                ) || null;
        }

        function getRewardTier(score) {
                const n = Number(score) || 0;
                if (n >= 10) return 'luxury';
                if (n === 9) return 'choice';
                if (n === 8) return 'theme';
                if (n === 7) return 'frame';
                if (n >= 5) return 'background';
                return 'none';
        }

        function getChoiceItems() {
                return ['pet', 'effect', 'theme']
                        .map(type => findRewardItem(type, false))
                        .filter(Boolean);
        }

        async function finalizeRewardState() {
                if (!state.progress || state.progress.status !== 'completed') return;
                const tier = getRewardTier(state.progress.score);
                const ref = progressRef();
                if (!ref) return;

                if (state.progress.rewardStatus === 'granted' || state.progress.rewardStatus === 'not_eligible') return;

                if (tier === 'none') {
                        await ref.update({ rewardTier: 'none', rewardStatus: 'not_eligible', rewardUpdatedAt: now() });
                        await loadProgress();
                        return;
                }

                if (tier === 'choice') {
                        if (state.progress.rewardItemId) return grantReservedReward(state.progress.rewardItemId, 'choice');
                        await ref.update({ rewardTier: 'choice', rewardStatus: 'choice_required', rewardUpdatedAt: now() });
                        await loadProgress();
                        return;
                }

                const item = tier === 'luxury'
                        ? findRewardItem('', true)
                        : findRewardItem(tier, false);

                if (!item) {
                        await ref.update({
                                rewardTier: tier,
                                rewardStatus: 'missing_item',
                                rewardMessage: 'Chưa tìm thấy vật phẩm Quốc khánh phù hợp trong StoreConfig.',
                                rewardUpdatedAt: now()
                        });
                        await loadProgress();
                        return;
                }

                await reserveAndGrant(item, tier);
        }

        async function reserveAndGrant(item, tier) {
                const ref = progressRef();
                if (!ref || !item) return false;
                const reservedAt = now();
                const tx = await ref.transaction(current => {
                        if (!current || current.status !== 'completed') return;
                        if (current.rewardStatus === 'granted') return current;
                        if (current.rewardItemId && current.rewardItemId !== item.id) return current;
                        return Object.assign({}, current, {
                                rewardTier: tier,
                                rewardStatus: 'reserved',
                                rewardItemId: item.id,
                                rewardName: item.name || item.id,
                                rewardReservedAt: current.rewardReservedAt || reservedAt,
                                rewardUpdatedAt: reservedAt
                        });
                });
                state.progress = tx.snapshot.val() || state.progress;
                if (state.progress.rewardItemId !== item.id) return false;
                return grantReservedReward(item.id, tier);
        }

        async function grantReservedReward(itemId, tier) {
                const user = getCurrentUserSafe();
                const database = getDbSafe();
                const ref = progressRef();
                if (!user?.username || !database || !ref) return false;
                const item = getStoreItems().find(i => String(i.id) === String(itemId));
                if (!item) {
                        await ref.update({ rewardStatus: 'missing_item', rewardUpdatedAt: now() });
                        await loadProgress();
                        return false;
                }

                const itemRef = database.ref(`student_inventory/${user.username}/${item.id}`);
                let alreadyOwned = false;
                const tx = await itemRef.transaction(current => {
                        if (current && current.id) {
                                alreadyOwned = true;
                                return current;
                        }
                        return {
                                id: item.id,
                                purchaseTime: now(),
                                source: `lich_su_hao_hung_${state.currentYear}`,
                                eventId: CONFIG.id,
                                eventYear: state.currentYear,
                                isTrial: null,
                                trialExpiry: null,
                                isEquipped: false
                        };
                });

                if (!tx.committed && !tx.snapshot.exists()) throw new Error('Không thể thêm vật phẩm vào kho.');

                await ref.update({
                        rewardTier: tier,
                        rewardStatus: 'granted',
                        rewardItemId: item.id,
                        rewardName: item.name || item.id,
                        rewardGrantedAt: now(),
                        rewardAlreadyOwned: Boolean(alreadyOwned),
                        rewardUpdatedAt: now()
                });
                await loadProgress();
                refreshCard();
                return true;
        }

        async function chooseReward(itemId) {
                if (state.busy) return;
                state.busy = true;
                try {
                        const allowed = getChoiceItems().find(item => item.id === itemId);
                        if (!allowed) throw new Error('Vật phẩm lựa chọn không hợp lệ hoặc chưa tồn tại.');
                        await reserveAndGrant(allowed, 'choice');
                        renderResult();
                } catch (error) {
                        console.error('[Lịch sử hào hùng] Lỗi chọn thưởng:', error);
                        notify('Không thể nhận vật phẩm đã chọn. Vui lòng thử lại.', 'error');
                } finally {
                        state.busy = false;
                }
        }

        function rewardSummaryHtml() {
                const p = state.progress || {};
                const score = Number(p.score) || 0;
                const tier = getRewardTier(score);

                if (p.rewardStatus === 'granted') {
                        return `<div class="history-reward-success">🎁 Đã nhận: <strong>${escapeHtml(p.rewardName || p.rewardItemId || 'Vật phẩm sự kiện')}</strong>${p.rewardAlreadyOwned ? '<br><small>Bạn đã sở hữu vật phẩm này từ trước nên kho không tạo bản trùng.</small>' : ''}</div>`;
                }
                if (tier === 'none') {
                        return '<div class="history-reward-none">Bạn cần ít nhất 5 điểm để nhận vật phẩm.</div>';
                }
                if (p.rewardStatus === 'missing_item') {
                        return '<div class="history-reward-warning">⚠️ Điểm đã được lưu, nhưng bộ cửa hàng hiện chưa có vật phẩm tag <b>2/9 / Quốc khánh</b> phù hợp. Khi thêm vật phẩm đúng tag/type, mở lại trang để hệ thống nhận thưởng tiếp.</div>';
                }
                if (tier === 'choice' || p.rewardStatus === 'choice_required') {
                        const items = getChoiceItems();
                        if (!items.length) {
                                return '<div class="history-reward-warning">⚠️ Chưa tìm thấy Thú cưng / Hiệu ứng / Giao diện tag 2/9 trong Cửa hàng thường.</div>';
                        }
                        return `
                <div class="history-choice-title">Bạn đạt 9 điểm — chọn đúng 1 phần thưởng:</div>
                <div class="history-choice-grid">
                    ${items.map(item => `
                        <button type="button" class="history-choice-item" data-item-id="${escapeHtml(item.id)}">
                            <span>${item.type === 'pet' ? '🐾' : item.type === 'effect' ? '✨' : '🎨'}</span>
                            <b>${escapeHtml(item.name || item.id)}</b>
                            <small>${item.type === 'pet' ? 'Thú cưng' : item.type === 'effect' ? 'Hiệu ứng' : 'Giao diện'}</small>
                        </button>
                    `).join('')}
                </div>
            `;
                }
                return '<div class="history-reward-pending">🎁 Đang xác nhận phần thưởng...</div>';
        }

        async function renderResult() {
                stopTimer();
                if (state.progress?.status === 'completed' && !['granted', 'not_eligible', 'choice_required', 'missing_item'].includes(state.progress.rewardStatus)) {
                        try { await finalizeRewardState(); } catch (e) { console.error(e); }
                }

                const view = document.getElementById('historyHeroView');
                if (!view) return;
                const p = state.progress || { score: 0 };
                const score = Number(p.score) || 0;

                view.innerHTML = `
            <section class="history-result">
                <div class="history-result-medal">${score === 10 ? '👑' : score >= 8 ? '🏆' : score >= 5 ? '🎖️' : '📜'}</div>
                <div class="history-kicker">KẾT QUẢ MÙA ${state.currentYear || ''}</div>
                <h2>${score} / 10 ĐIỂM</h2>
                <p>${score === 10 ? 'Xuất sắc! Bạn đã chinh phục trọn vẹn thử thách.' : score >= 8 ? 'Rất tốt! Bạn đã vượt qua thử thách với kết quả nổi bật.' : score >= 5 ? 'Hoàn thành tốt và đã đạt mốc nhận thưởng.' : 'Bạn đã hoàn thành lượt chơi của mùa sự kiện này.'}</p>
                <div id="historyRewardArea">${rewardSummaryHtml()}</div>
                <button type="button" id="historyResultClose" class="history-primary-btn">Hoàn tất</button>
            </section>
        `;

                view.querySelectorAll('.history-choice-item').forEach(btn => {
                        btn.addEventListener('click', () => chooseReward(btn.dataset.itemId));
                });
                view.querySelector('#historyResultClose')?.addEventListener('click', closeModal);
                refreshCard();
        }

        async function recoverPendingReward() {
                if (state.progress?.status !== 'completed') return;
                if (state.progress.rewardStatus === 'missing_item' || state.progress.rewardStatus === 'reserved' || state.progress.rewardStatus === 'pending') {
                        try { await finalizeRewardState(); } catch (error) { console.warn('[Lịch sử hào hùng] Chưa thể phục hồi thưởng:', error); }
                }
        }

        async function boot() {
                buildShell();
                injectEventCard();
                await loadServerOffset();
                await loadProgress();
                refreshCard();
                await recoverPendingReward();
                refreshCard();

                /*
                 * KHÔNG tự mở popup khi vào web.
                 * Popup chỉ được mở khi người dùng bấm “Giới thiệu” hoặc “Tham gia”.
                 * Interval chỉ cập nhật trạng thái card theo thời gian sự kiện.
                 */
                setInterval(() => {
                        refreshCard();
                }, 30000);

                window.addEventListener('focus', () => {
                        refreshCard();
                        if (state.progress?.status === 'in_progress' && Number(state.progress.questionDeadline) <= now()) {
                                submitCurrentQuestion({ timeout: true });
                        }
                });

                document.addEventListener('visibilitychange', () => {
                        if (!document.hidden && state.progress?.status === 'in_progress' && Number(state.progress.questionDeadline) <= now()) {
                                submitCurrentQuestion({ timeout: true });
                        }
                });
        }

        window.HistoryHeroEvent = Object.freeze({
                open: () => openModal('landing'),
                showIntro: () => openModal('intro'),
                getQuestions: () => QUESTIONS.map(q => ({ ...q, answers: [...q.answers] })),
                getState: () => ({ ...state, progress: state.progress ? { ...state.progress } : null }),
                retryReward: recoverPendingReward
        });

        if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', boot, { once: true });
        } else {
                boot();
        }
})();
