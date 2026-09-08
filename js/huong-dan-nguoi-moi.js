/**
 * NEW USER GUIDE — Hướng dẫn người mới cho website học tập
 * Phiên bản: 2.14.0 — đào tạo bắt buộc 1 lần về nộp bài, cập nhật và hiệu năng
 *
 * Cách nạp khuyến nghị (đặt cuối <body>, sau teacher.js hoặc student.js):
 * <script src="js/huong-dan-nguoi-moi.js?v=2.14.0"></script>
 *
 * API có thể gọi từ nơi khác:
 *   NewUserGuide.open();          // Mở trung tâm hướng dẫn
 *   NewUserGuide.start();         // Chạy toàn bộ hướng dẫn từng bước
 *   NewUserGuide.startFeature('store'); // Chỉ hướng dẫn riêng một mục
 *   NewUserGuide.reset();         // Cho phép tự hiện lại như người dùng mới
 *   NewUserGuide.goTo('store');   // Đi tới một chức năng theo ID
 */
(() => {
    'use strict';

    if (window.NewUserGuide) return;

    const VERSION = '2.14.0';
    const REQUIRED_STUDENT_TRAINING_VERSION =
        '2026-09-06-submission-update-effects-v1';
    const REQUIRED_STUDENT_TRAINING_FEATURES = Object.freeze([
        'submission-guide',
        'system-update',
        'effects-performance'
    ]);
    const ROOT_ID = 'nug-root';
    const STYLE_ID = 'nug-style';
    const MAX_Z_INDEX = 2147483000;

    const state = {
        initialized: false,
        role: 'student',
        user: {},
        features: [],
        tourSteps: [],
        currentStep: -1,
        activeTarget: null,
        previousFocus: null,
        previousSidebarCollapsed: null,
        resizeTimer: null,
        transitionLocked: false,
        activeFeatureTour: null,
        coinWidgetTemporarilyRevealed: false,
        coinWidgetInitialStoredVisibility: null,
        mandatoryMode: false,
        mandatoryScope: 'full',
        mandatoryTourCompleted: false,
        mandatorySuspended: false,
        mandatoryStartPending: false,
        mandatoryGateStartedAt: 0,
        mandatoryGateQuietSince: 0,
        mandatoryGateObserver: null,
        mandatoryGatePoller: null,
        launcherVisible: true,
        reviewPracticeGuideMode: null,
        reviewPracticeRealAssignmentId: '',
        initializing: false,
        remoteGuideCompleted: false,
        remoteCompletionResolved: false,
        remoteCompletionReadFailed: false,
        remoteCompletionPath: null,
        remoteCompletionWritePromise: null,
        remoteGuideStatus: 'unknown',
        remoteMandatoryProgress: 0,
        remoteProgressPendingIndex: null,
        remoteProgressWritePromise: null,
        remoteTrainingCompleted: false,
        remoteTrainingProgress: 0
    };

    const roleData = {
        teacher: {
            roleName: 'Giáo viên',
            welcomeTitle: 'Hướng dẫn chi tiết trang Giáo viên',
            welcomeText:
                'Mỗi mục đều có hướng dẫn riêng. Thầy/cô bấm “Hướng dẫn mục này” hoặc chạy toàn bộ và dùng nút “Tiếp theo” để xem từng thao tác.',
            features: [
                {
                    id: 'create-assignment', icon: '➕', title: 'Giao bài tập mới', tabId: 'tab-create',
                    description: 'Soạn và phát hành bài tự luận, trắc nghiệm hoặc bài kết hợp.',
                    access: 'Thanh bên → Giao bài tập mới.',
                    details: [
                        'Chọn loại kiểm tra và tỉ lệ điểm.',
                        'Nhập tiêu đề, thời gian và học sinh nhận bài.',
                        'Dán câu hỏi để bóc tách hoặc thêm từng câu.',
                        'Tạo nhiều mã đề, xáo câu và đáp án.',
                        'Đính kèm video, tệp và đặt thời gian làm bài.',
                        'Xem thử rồi phát hành bài.'
                    ]
                },
                {
                    id: 'assigned', icon: '📋', title: 'Bài tập đã giao', tabId: 'tab-assigned',
                    description: 'Tìm và quản lý các bài đã phát hành.',
                    access: 'Thanh bên → Bài tập đã giao.',
                    details: ['Tìm theo tên bài.', 'Lọc theo học sinh.', 'Mở danh sách và thao tác với từng bài.']
                },
                {
                    id: 'submissions', icon: '📥', title: 'Bài đã nộp và chấm điểm', tabId: 'tab-list',
                    description: 'Xem bài học sinh nộp, chấm điểm và nhận xét.',
                    access: 'Thanh bên → Danh sách bài đã nộp.',
                    details: ['Tìm bài nộp.', 'Lọc theo học sinh.', 'Mở bài làm, tệp đính kèm và chấm điểm.']
                },
                {
                    id: 'materials', icon: '📚', title: 'Tài liệu học tập', tabId: 'tab-materials',
                    description: 'Đăng và quản lý tài liệu gửi cho học sinh.',
                    access: 'Thanh bên → Tài liệu học tập.',
                    details: ['Thêm tài liệu mới.', 'Chọn học sinh được nhận.', 'Tìm, lọc và quản lý tài liệu đã đăng.']
                },
                {
                    id: 'question-bank', icon: '🧠', title: 'Ngân hàng câu hỏi', tabId: 'tab-question-bank',
                    description: 'Lưu câu hỏi để tái sử dụng và tạo đề ngẫu nhiên.',
                    access: 'Thanh bên → Ngân hàng câu hỏi.',
                    details: ['Nhập câu từ bài cũ.', 'Phân loại theo môn, lớp, bài, mức độ.', 'Lọc danh sách.', 'Thống kê câu học sinh làm sai nhiều.']
                },
                {
                    id: 'students', icon: '👥', title: 'Quản lý học sinh', tabId: 'tab-manage-students',
                    description: 'Tạo tài khoản và quản lý thông tin học sinh.',
                    access: 'Thanh bên → Quản lý học sinh.',
                    details: ['Thêm học sinh.', 'Tìm tài khoản.', 'Duyệt yêu cầu đổi thông tin.', 'Xem danh sách lớp.']
                },
                {
                    id: 'transactions', icon: '🧾', title: 'Nhật ký giao dịch', tabId: 'tab-transactions',
                    description: 'Cộng hoặc trừ Coin có lý do và xem lịch sử thay đổi.',
                    access: 'Thanh bên → Nhật ký giao dịch.',
                    details: ['Chọn học sinh.', 'Nhập số dương để cộng hoặc số âm để trừ.', 'Ghi lý do.', 'Lọc nhật ký và hoàn tác giao dịch hỗ trợ hoàn tác.']
                },
                {
                    id: 'roadmap', icon: '🗺️', title: 'Lộ trình và thời khóa biểu', tabId: 'tab-roadmap',
                    description: 'Theo dõi lộ trình và tạo lịch học chung hoặc riêng.',
                    access: 'Thanh bên → Lộ trình & Lịch.',
                    details: ['Chọn học sinh để xem lộ trình.', 'Chuyển sang thời khóa biểu.', 'Thêm, sửa hoặc xóa lịch.', 'Tải PDF.']
                },
                {
                    id: 'game-management', icon: '🎮', title: 'Quản lý trò chơi', tabId: 'tab-game-manage',
                    description: 'Điều khiển trò chơi, cửa hàng, sự kiện và phần thưởng.',
                    access: 'Thanh bên → Quản lý trò chơi.',
                    details: ['Khóa/mở khu trò chơi.', 'Chỉnh tỉ lệ vòng quay.', 'Cộng hoặc trừ vé.', 'Khóa/mở và định giá cửa hàng.', 'Quản lý Dạ hội, bảng xếp hạng và quà đăng nhập.']
                },
                {
                    id: 'system-update', icon: '🔄', title: 'Kiểm tra & cập nhật hệ thống', tabId: 'tab-settings',
                    description: 'Kiểm tra phiên bản đang chạy, xem bản mới và cập nhật website an toàn.',
                    access: 'Thanh bên → Cài đặt → khu vực Cập nhật hệ thống.',
                    details: [
                        'Xem phiên bản đang chạy, phiên bản mới nhất và lần kiểm tra gần nhất.',
                        'Bấm Kiểm tra lại khi cần đối chiếu ngay với máy chủ.',
                        'Nếu có bản mới, xem Chi tiết trước khi cập nhật.',
                        'Bản cập nhật thường có thể chọn Để sau; bản bắt buộc phải cập nhật.',
                        'Trong lúc cập nhật không đóng, tải lại hoặc thoát trang.',
                        'Nếu báo Ngoại tuyến hoặc Không kiểm tra được, kiểm tra Internet rồi thử lại.'
                    ]
                },
                {
                    id: 'effects-performance', icon: '⚡', title: 'Hiệu ứng & tối ưu hiệu năng', tabId: 'tab-settings',
                    description: 'Điều chỉnh độ nặng hiệu ứng và giảm tải hiển thị khi thiết bị chạy chậm.',
                    access: 'Thanh bên → Cài đặt → Mức hiệu ứng vật phẩm & web / Tối ưu hiệu năng.',
                    details: [
                        'Mức hiệu ứng chỉ tác động chuyển động, hạt và lớp trang trí; không đổi theme, dữ liệu hay chức năng.',
                        'Cao giữ đầy đủ hiệu ứng; Trung bình giảm một phần; Thấp ưu tiên độ ổn định của máy.',
                        'Tối ưu hiệu năng giảm tải nền, blur và nội dung hiển thị nặng; không thay điểm, trò chơi, dữ liệu hay vật phẩm.',
                        'Nếu máy giật hoặc nóng, ưu tiên bật Tối ưu hiệu năng và chọn hiệu ứng Trung bình/Thấp.',
                        'Có thể đổi lại bất cứ lúc nào; trạng thái hiện tại hiển thị ngay dưới từng tùy chọn.'
                    ]
                },
                {
                    id: 'settings', icon: '⚙️', title: 'Cài đặt và công cụ hệ thống', tabId: 'tab-settings',
                    description: 'Cập nhật tài khoản, thông báo, khảo sát và quà tặng.',
                    access: 'Thanh bên → Cài đặt.',
                    details: ['Đổi giao diện, tên và mật khẩu.', 'Ẩn hoặc hiện nút Hướng dẫn chi tiết.', 'Bật bảng quy đổi.', 'Xử lý yêu cầu tiền mặt.', 'Quét lỗi.', 'Gửi thông báo, khảo sát, Coin, vật phẩm hoặc thẻ giảm giá.']
                }
            ]
        },

        student: {
            roleName: 'Học sinh',
            welcomeTitle: 'Hướng dẫn chi tiết trang Học sinh',
            welcomeText:
                'Em có thể học toàn bộ website hoặc chọn riêng từng mục. Hãy bấm “Tiếp theo” để hệ thống chỉ đúng vị trí và giải thích từng thao tác.',
            features: [
                {
                    id: 'todo', icon: '📝', title: 'Bài tập cần làm', tabId: 'tab-todo',
                    description: 'Tìm bài giáo viên giao và bắt đầu làm bài.',
                    access: 'Thanh bên → Bài tập cần làm.',
                    details: ['Tìm theo tên bài.', 'Xem hạn nộp và trạng thái.', 'Mở bài để làm hoặc nộp tệp.', 'Xem mục Nộp bài & xử lý lỗi nếu cần hướng dẫn chi tiết.']
                },
                {
                    id: 'submission-guide', icon: '📤', title: 'Nộp bài & xử lý lỗi', tabId: 'tab-todo',
                    description: 'Hướng dẫn bắt buộc 1 lần với bài mô phỏng an toàn: nộp bài, đính kèm tệp và xử lý lỗi thường gặp.',
                    access: 'Thanh bên → Bài tập cần làm. Hướng dẫn tạo bài giả ngay trên trang, không gửi dữ liệu.',
                    details: [
                        'Mỗi học sinh bắt buộc xem mô-đun này một lần; có thể mở lại thủ công bất cứ lúc nào.',
                        'Bài giả và cảnh báo giả chỉ dùng để học thao tác, không ghi Firebase/R2 và không ảnh hưởng điểm.',
                        'Đọc yêu cầu, thời gian bắt đầu và hạn nộp trước khi làm.',
                        'Hoàn thành phần trắc nghiệm/tự luận đúng yêu cầu của giáo viên.',
                        'Tệp thường tối đa 7 MB mỗi tệp; tệp âm thanh tối đa 30 MB mỗi tệp.',
                        'Tệp quá dung lượng sẽ bị tự loại khỏi danh sách chờ nộp; hãy giảm dung lượng hoặc chọn tệp khác.',
                        'Kiểm tra danh sách tệp đang chờ, xóa tệp chọn nhầm rồi mới nộp.',
                        'Bấm Nộp bài một lần và chờ thông báo; không bấm liên tục khi hệ thống đang lưu.',
                        'Nếu mất mạng hoặc nộp chưa thành công, giữ nguyên trang, khôi phục kết nối và thử lại; bài làm/tệp đã chọn được giữ trong các tình huống lỗi được hỗ trợ.',
                        'Chỉ coi là đã nộp khi website báo nộp thành công và trạng thái bài đã thay đổi.'
                    ]
                },
                {
                    id: 'grades', icon: '📈', title: 'Kết quả học tập', tabId: 'tab-grades',
                    description: 'Xem điểm và nhận xét sau khi giáo viên chấm.',
                    access: 'Thanh bên → Kết quả học tập.',
                    details: ['Tìm bài đã nộp.', 'Xem điểm.', 'Đọc nhận xét và tệp chữa bài nếu có.']
                },
                {
                    id: 'review-practice', icon: '🔁', title: 'Xem lại câu hỏi & làm lại trắc nghiệm', tabId: 'tab-grades',
                    description: 'Mở toàn bộ câu hỏi của bài đã nộp và luyện lại phần trắc nghiệm mà không ảnh hưởng điểm chính thức.',
                    access: 'Kết quả học tập → mở bài → Xem lại tất cả câu hỏi → Làm lại trắc nghiệm.',
                    details: [
                        'Mở một bài đã nộp trong Kết quả học tập.',
                        'Bấm Xem lại tất cả câu hỏi để đọc toàn bộ nội dung và các lựa chọn.',
                        'Bấm Làm lại trắc nghiệm và xác nhận Đã rõ.',
                        'Chọn đủ đáp án rồi bấm Nộp và chấm điểm.',
                        'Xem câu đúng, câu sai và điểm luyện tập.',
                        'Kết quả luyện lại chỉ nằm tạm trong RAM, không đổi điểm chính thức.',
                        'Nếu tài khoản chưa có bài phù hợp, hướng dẫn sẽ tạo bài mẫu mô phỏng an toàn.'
                    ]
                },
                {
                    id: 'profile', icon: '👤', title: 'Hồ sơ & thông tin cá nhân', selector: '.profile-trigger-btn',
                    description: 'Mở hồ sơ, kiểm tra thông tin tài khoản và cập nhật ảnh hoặc ngày sinh đúng cách.',
                    access: 'Bấm ảnh đại diện hoặc biểu tượng người ở góc trên màn hình.',
                    details: [
                        'Xem tên hiển thị, tên tài khoản và lớp.',
                        'Nhập ngày sinh đúng 1 lần nếu hồ sơ chưa có; kiểm tra hộp xác nhận trước khi lưu.',
                        'Chạm ảnh đại diện để chọn PNG, JPEG hoặc GIF nhỏ hơn 1 MB; xem trước rồi bấm Lưu ảnh mới.',
                        'Tên hiển thị và mật khẩu phải gửi yêu cầu trong Cài đặt để giáo viên duyệt.',
                        'Lớp, ngày sinh đã lưu, sở thích và châm ngôn cần báo giáo viên chỉnh.',
                        'Tên tài khoản không có chức năng tự đổi; cần liên hệ giáo viên hoặc quản trị viên.'
                    ],
                    action: () => safeOpenStudentProfileForGuide()
                },
                {
                    id: 'materials', icon: '📚', title: 'Tài liệu học tập', tabId: 'tab-materials',
                    description: 'Mở tài liệu và bài giảng giáo viên gửi.',
                    access: 'Thanh bên → Tài liệu học tập.',
                    details: ['Tìm tài liệu.', 'Mở liên kết hoặc tệp.', 'Đọc nội dung được giao riêng hoặc giao chung.']
                },
                {
                    id: 'roadmap', icon: '🗺️', title: 'Lộ trình và lịch học', tabId: 'tab-roadmap',
                    description: 'Theo dõi tiến độ, tiền tích lũy và thời khóa biểu.',
                    access: 'Thanh bên → Lộ trình & Lịch.',
                    details: ['Xem lộ trình cá nhân.', 'Xem tổng tiền tích lũy.', 'Chuyển sang thời khóa biểu.', 'Tải PDF.']
                },
                {
                    id: 'games', icon: '🎮', title: 'Trò chơi và sự kiện', tabId: 'tab-game',
                    description: 'Tham gia vòng quay, Dạ hội và sự kiện đang mở.',
                    access: 'Thanh bên → Trò chơi.',
                    details: ['Kiểm tra trò chơi có đang mở.', 'Dùng vé để quay.', 'Xem phần thưởng Dạ hội.', 'Tham gia sự kiện giới hạn.']
                },
                {
                    id: 'store', icon: '🛒', title: 'Mua vật phẩm và áp mã giảm giá', tabId: 'tab-store',
                    description: 'Mua giao diện, hiệu ứng, thú cưng hoặc nhạc nền bằng Coin.',
                    access: 'Thanh bên → Cửa hàng.',
                    details: ['Lọc loại vật phẩm.', 'Chọn Mua đứt hoặc Dùng thử.', 'Chọn thẻ giảm giá trong bảng thanh toán.', 'Kiểm tra giá cuối rồi xác nhận.', 'Mở Túi đồ để trang bị.']
                },
                {
                    id: 'collections', icon: '📚', title: 'Sưu tầm vật phẩm', tabId: 'tab-store', selector: '#storeCollectionArrow',
                    description: 'Theo dõi vật phẩm đã sở hữu, tiến độ từng bộ, thưởng Coin và cách nhận được hệ thống tự phát hiện từ website.',
                    access: 'Thanh bên → Cửa hàng → mũi tên cạnh tiêu đề → Sưu tầm.',
                    details: [
                        'Bấm mũi tên cạnh tiêu đề rồi chọn Sưu tầm để chuyển trang.',
                        'Lướt ngang thanh danh mục và chọn bộ muốn xem.',
                        'Vật phẩm chưa sở hữu hiển thị màu xám; vật phẩm đã sở hữu hiện đủ màu.',
                        'Theo dõi các mốc 3, 5, 10, 15 và 20 vật phẩm; Coin đạt mốc được cộng thẳng vào số dư.',
                        'Bấm nút ! cạnh tên bộ để xem các cách nhận mà hệ thống tự phát hiện từ dữ liệu hiện tại của website.',
                        'Trong bảng Cách nhận, bấm Quét lại khi giá, lịch mở bán, trạng thái khóa hoặc cấu hình cửa hàng vừa thay đổi.',
                        'Trang Sưu tầm chỉ dùng để xem; không có nút Mua hoặc Dùng thử.',
                        'Muốn quay lại, bấm mũi tên rồi chọn Cửa hàng.'
                    ]
                },
                {
                    id: 'bag', icon: '🎒', title: 'Túi đồ cá nhân', selector: '.bag-trigger-btn',
                    description: 'Xem vật phẩm, vé, thẻ giảm giá và vật phẩm sự kiện.',
                    access: 'Bấm nút Túi đồ ở phía trên.',
                    details: ['Xem vật phẩm đã sở hữu.', 'Nhấn giữ ô đồ để xem chi tiết.', 'Trang bị hoặc tháo vật phẩm trong cửa hàng.', 'Bán thẻ giảm giá đã hết hạn nếu được hỗ trợ.'],
                    action: () => {
                        if (typeof window.openStudentBag === 'function') {
                            window.openStudentBag();
                            return true;
                        }
                        return false;
                    }
                },
                {
                    id: 'inbox', icon: '📨', title: 'Hộp thư và nhận quà', selector: '.inbox-trigger-btn',
                    description: 'Đọc thông báo và nhận quà giáo viên gửi.',
                    access: 'Bấm nút Hộp thư ở phía trên.',
                    details: ['Mở thư mới.', 'Đọc lời nhắn.', 'Nhận Coin, vật phẩm hoặc thẻ giảm giá khi thư có quà.'],
                    action: () => {
                        if (typeof window.openStudentInbox === 'function') {
                            window.openStudentInbox();
                            return true;
                        }
                        return false;
                    }
                },
                {
                    id: 'leaderboard', icon: '🏆', title: 'Bảng xếp hạng', selector: '.leaderboard-trigger-btn',
                    description: 'Xem thứ hạng và thành tích thi đua.',
                    access: 'Bấm nút Cúp cạnh Túi đồ.',
                    details: ['Xem thứ hạng.', 'Xem điểm thi đua và phần thưởng mùa nếu được bật.'],
                    action: () => {
                        const button = document.querySelector('.leaderboard-trigger-btn');
                        if (button) { button.click(); return true; }
                        return false;
                    }
                },
                {
                    id: 'coin', icon: '🪙', title: 'Số dư Coin và bảng quy đổi', selector: '#coinWidget',
                    description: 'Theo dõi Coin, đổi Tiền lộ trình với Coin và gửi yêu cầu lấy tiền mặt khi giáo viên cho phép.',
                    access: 'Thanh Coin → nút dấu !. Nếu đã ẩn thanh, vào Cài đặt để bật lại.',
                    details: [
                        'Bật lại thanh Coin trong Cài đặt nếu thanh đang bị ẩn.',
                        'Bấm dấu ! cạnh chữ Số dư Coin để mở Bảng quy đổi.',
                        'Chọn Tiền → Coin hoặc Coin → Tiền; tỉ lệ hiển thị là 1:1.',
                        'Nhập số lượng, kiểm tra kết quả rồi mới bấm Thực hiện Quy đổi.',
                        'Coin → Tiền giới hạn tối đa 500 Coin cho mỗi lần đổi.',
                        'Xem tiền tích lũy, gửi yêu cầu lấy tiền mặt và theo dõi lịch sử xử lý.'
                    ]
                },
                {
                    id: 'system-update', icon: '🔄', title: 'Kiểm tra & cập nhật hệ thống', tabId: 'tab-settings',
                    description: 'Kiểm tra phiên bản website và cài bản mới khi hệ thống phát hành.',
                    access: 'Thanh bên → Cài đặt → khu vực Cập nhật hệ thống.',
                    details: [
                        'Xem phiên bản đang dùng, phiên bản mới nhất và lần kiểm tra gần nhất.',
                        'Bấm Kiểm tra lại nếu muốn kiểm tra ngay.',
                        'Nếu có bản mới, có thể xem Chi tiết trước khi cập nhật.',
                        'Bản thường có thể Để sau; bản bắt buộc phải cập nhật.',
                        'Không đóng hoặc tải lại trang khi thanh tiến trình đang cập nhật.',
                        'Nếu báo Ngoại tuyến hoặc lỗi kiểm tra, kiểm tra mạng rồi thử lại.'
                    ]
                },
                {
                    id: 'effects-performance', icon: '⚡', title: 'Hiệu ứng & tối ưu hiệu năng', tabId: 'tab-settings',
                    description: 'Giảm hiệu ứng hoặc tối ưu trang khi máy học sinh bị giật, chậm hoặc nóng.',
                    access: 'Thanh bên → Cài đặt → Mức hiệu ứng vật phẩm & web / Tối ưu hiệu năng.',
                    details: [
                        'Mức hiệu ứng chỉ giảm chuyển động, hạt và lớp trang trí của vật phẩm, thú cưng và Web Animations; không làm mất vật phẩm.',
                        'Cao giữ đầy đủ hiệu ứng; Trung bình giảm vừa; Thấp ưu tiên máy ổn định.',
                        'Tối ưu hiệu năng giúp giảm tải nền và các nội dung nặng; phía học sinh còn hỗ trợ danh sách bài, video và trình soạn thảo khi cần.',
                        'Trên điện thoại/thiết bị cảm ứng màn hình nhỏ, tối ưu hiệu năng có thể tự bật ở lần đầu; máy tính giữ lựa chọn người dùng.',
                        'Hai chức năng độc lập: có thể bật Tối ưu hiệu năng và đồng thời chọn mức hiệu ứng phù hợp.',
                        'Nếu máy yếu hoặc trang giật, nên bật Tối ưu hiệu năng và thử Trung bình trước; vẫn chậm thì chuyển Thấp.',
                        'Các cài đặt này không thay đổi điểm, bài làm, Coin, trò chơi hay dữ liệu tài khoản.'
                    ]
                },
                {
                    id: 'settings', icon: '⚙️', title: 'Cài đặt tài khoản', tabId: 'tab-settings',
                    description: 'Chỉnh tùy chọn và gửi yêu cầu đổi thông tin.',
                    access: 'Thanh bên → Cài đặt.',
                    details: ['Bật/tắt tương tác thú cưng.', 'Ẩn/hiện thanh Coin.', 'Ẩn hoặc hiện nút Hướng dẫn chi tiết.', 'Đổi giao diện.', 'Gửi yêu cầu đổi tên hoặc mật khẩu.', 'Chạy quét lỗi.']
                }
            ]
        }
    };

    function readCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('currentUser')) || {};
        } catch (_) {
            return {};
        }
    }

    function normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase()
            .trim();
    }

    function isMobileGuideViewport() {
        return window.matchMedia(
            '(max-width: 720px), (pointer: coarse)'
        ).matches;
    }

    function stepTargetsSidebar(step) {
        if (!step) return false;

        if (step.tabId && !step.selector) {
            return true;
        }

        const selectors = Array.isArray(step.selector)
            ? step.selector
            : (step.selector ? [step.selector] : []);

        return selectors.some(selector => {
            const value = String(selector || '');

            return (
                value.includes('.sidebar') ||
                value.includes('.nav-item') ||
                value.includes('data-nug-nav-target') ||
                value.includes('.sidebar-toggle')
            );
        });
    }

    function setMobileSidebarForStep(step, dashboard) {
        if (!dashboard || !isMobileGuideViewport()) {
            return false;
        }

        const shouldOpen = stepTargetsSidebar(step);
        const wasCollapsed = dashboard.classList.contains('collapsed');

        if (shouldOpen) {
            dashboard.classList.remove('collapsed');
        } else {
            dashboard.classList.add('collapsed');
        }

        return wasCollapsed !== dashboard.classList.contains('collapsed');
    }

    function detectRole() {
        const storedRole = normalizeText(state.user.role);

        if (storedRole.includes('teacher') || storedRole.includes('giaovien')) {
            return 'teacher';
        }

        if (storedRole.includes('student') || storedRole.includes('hocsinh')) {
            return 'student';
        }

        if (document.getElementById('tab-create') || document.title.includes('Giáo Viên')) {
            return 'teacher';
        }

        return 'student';
    }

    function getGuideUsername() {
        return String(
            state.user.username ||
            state.user._fbKey ||
            'guest'
        );
    }

    function getStorageKey() {
        return `new_user_guide_seen:${VERSION}:${state.role}:${getGuideUsername()}`;
    }

    function getCompletionStorageKey() {
        return `new_user_guide_completed:${state.role}:${getGuideUsername()}`;
    }

    function getFirebaseDatabaseForGuide() {
        try {
            if (window.db && typeof window.db.ref === 'function') {
                return window.db;
            }

            if (
                window.firebase &&
                typeof window.firebase.database === 'function'
            ) {
                return window.firebase.database();
            }
        } catch (_) {
            // Firebase chưa sẵn sàng; hàm gọi sẽ xử lý bằng bộ nhớ cục bộ.
        }

        return null;
    }

    function getCurrentFirebaseAuthUser() {
        try {
            return window.firebase?.auth?.().currentUser || null;
        } catch (_) {
            return null;
        }
    }

    async function waitForFirebaseAuthUser(timeoutMs = 5000) {
        const existing = getCurrentFirebaseAuthUser();
        if (existing) return existing;

        if (
            !window.firebase ||
            typeof window.firebase.auth !== 'function'
        ) {
            return null;
        }

        return new Promise(resolve => {
            let settled = false;
            let unsubscribe = null;

            const finish = user => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                try { unsubscribe?.(); } catch (_) { /* Không cần xử lý. */ }
                resolve(user || null);
            };

            const timer = setTimeout(
                () => finish(getCurrentFirebaseAuthUser()),
                Math.max(500, Number(timeoutMs) || 5000)
            );

            try {
                unsubscribe = window.firebase
                    .auth()
                    .onAuthStateChanged(
                        user => finish(user),
                        () => finish(null)
                    );
            } catch (_) {
                finish(null);
            }
        });
    }

    function getGuideFirebaseUid(authUser = null) {
        return String(
            authUser?.uid ||
            getCurrentFirebaseAuthUser()?.uid ||
            state.user?.uid ||
            state.user?._fbKey ||
            ''
        ).trim();
    }

    function getRemoteCompletionPath(authUser = null) {
        if (state.role !== 'student') return '';

        const uid = getGuideFirebaseUid(authUser);
        if (!uid) return '';

        return `users/${uid}/newUserGuide`;
    }

    function isRemoteCompletionValueComplete(value) {
        return Boolean(
            value === true ||
            value?.status === 'completed' ||
            value?.completed === true ||
            value?.studentCompleted === true ||
            value?.requiredTourCompleted === true
        );
    }

    function normalizeRemoteMandatoryProgress(value) {
        const progress = Number(
            value?.currentStep ??
            value?.mandatoryStep ??
            value?.progressStep ??
            0
        );

        return Number.isInteger(progress) && progress >= 0
            ? progress
            : 0;
    }

    function isRemoteRequiredTrainingComplete(value) {
        return Boolean(
            value &&
            typeof value === 'object' &&
            value.requiredTrainingCompleted === true &&
            value.requiredTrainingVersion ===
                REQUIRED_STUDENT_TRAINING_VERSION
        );
    }

    function normalizeRemoteTrainingProgress(value) {
        const progress = Number(
            value?.requiredTrainingCurrentStep ??
            value?.trainingStep ??
            0
        );

        return Number.isInteger(progress) && progress >= 0
            ? progress
            : 0;
    }

    function getTrainingCompletionStorageKey() {
        return (
            'new_user_guide_required_training:' +
            `${REQUIRED_STUDENT_TRAINING_VERSION}:` +
            `${state.role}:${getGuideUsername()}`
        );
    }

    function getTrainingProgressStorageKey() {
        return (
            'new_user_guide_required_training_progress:' +
            `${REQUIRED_STUDENT_TRAINING_VERSION}:` +
            `${state.role}:${getGuideUsername()}`
        );
    }

    function hasRequiredTrainingCompletedLocally() {
        return (
            localStorage.getItem(
                getTrainingCompletionStorageKey()
            ) === 'true'
        );
    }

    function cacheRequiredTrainingCompletionLocally() {
        localStorage.setItem(
            getTrainingCompletionStorageKey(),
            'true'
        );
        localStorage.removeItem(
            getTrainingProgressStorageKey()
        );
    }

    function hasRequiredTrainingCompleted() {
        return (
            state.role !== 'student' ||
            state.remoteTrainingCompleted === true ||
            isRemoteRequiredTrainingComplete(
                state.user?.newUserGuide
            ) ||
            hasRequiredTrainingCompletedLocally()
        );
    }

    function isMandatoryRequirementSatisfied() {
        return state.mandatoryScope === 'training'
            ? hasRequiredTrainingCompleted()
            : hasCompletedGuide();
    }

    function cacheGuideCompletionLocally() {
        localStorage.setItem(getStorageKey(), 'true');
        localStorage.setItem(getCompletionStorageKey(), 'true');
        localStorage.removeItem(getProgressStorageKey());
    }

    async function readRemoteGuideCompletion() {
        if (state.role !== 'student') {
            state.remoteCompletionResolved = true;
            return {
                available: false,
                completed: false,
                trainingCompleted: true
            };
        }

        const authUser = await waitForFirebaseAuthUser();
        const database = getFirebaseDatabaseForGuide();
        const path = getRemoteCompletionPath(authUser);

        state.remoteCompletionPath = path || null;

        if (!database || !path) {
            state.remoteCompletionResolved = true;
            state.remoteCompletionReadFailed = true;
            return {
                available: false,
                completed: false,
                trainingCompleted: false
            };
        }

        try {
            const snapshot = await database.ref(path).once('value');
            const remoteValue = snapshot.val() || {};
            const completed = isRemoteCompletionValueComplete(
                remoteValue
            );
            const trainingCompleted =
                isRemoteRequiredTrainingComplete(remoteValue);

            state.remoteCompletionResolved = true;
            state.remoteCompletionReadFailed = false;
            state.remoteGuideCompleted = completed;
            state.remoteTrainingCompleted = trainingCompleted;
            state.remoteGuideStatus = completed
                ? 'completed'
                : (
                    remoteValue?.status === 'in_progress'
                        ? 'in_progress'
                        : 'not_started'
                );
            state.remoteMandatoryProgress = completed
                ? 0
                : normalizeRemoteMandatoryProgress(remoteValue);
            state.remoteTrainingProgress = trainingCompleted
                ? 0
                : normalizeRemoteTrainingProgress(remoteValue);

            if (completed) {
                cacheGuideCompletionLocally();
            }

            if (trainingCompleted) {
                cacheRequiredTrainingCompletionLocally();
            }

            return {
                available: true,
                completed,
                trainingCompleted,
                status: state.remoteGuideStatus,
                progress: state.remoteMandatoryProgress,
                trainingProgress: state.remoteTrainingProgress
            };
        } catch (error) {
            console.warn(
                'Không thể đọc trạng thái hướng dẫn từ Firebase:',
                error
            );

            state.remoteCompletionResolved = true;
            state.remoteCompletionReadFailed = true;
            return {
                available: false,
                completed: false,
                trainingCompleted: false
            };
        }
    }

    async function persistGuideCompletionToFirebase(options = {}) {
        if (state.role !== 'student') return false;

        const includeRequiredTraining =
            options.includeRequiredTraining !== false;

        if (state.remoteCompletionWritePromise) {
            return state.remoteCompletionWritePromise;
        }

        state.remoteCompletionWritePromise = (async () => {
            const authUser = await waitForFirebaseAuthUser();
            const database = getFirebaseDatabaseForGuide();
            const path = getRemoteCompletionPath(authUser);

            state.remoteCompletionPath = path || null;

            if (!database || !path) return false;

            const serverTimestamp =
                window.firebase?.database?.ServerValue?.TIMESTAMP ||
                Date.now();

            try {
                let lastError = null;
                let saved = false;

                for (let attempt = 1; attempt <= 3; attempt += 1) {
                    try {
                        const completionTransaction = await database
                            .ref(path)
                            .transaction(currentValue => {
                                const current = (
                                    currentValue &&
                                    typeof currentValue === 'object'
                                )
                                    ? currentValue
                                    : {};

                                const trainingPatch =
                                    includeRequiredTraining
                                        ? {
                                            requiredTrainingCompleted: true,
                                            requiredTrainingVersion:
                                                REQUIRED_STUDENT_TRAINING_VERSION,
                                            requiredTrainingCompletedAt:
                                                current.requiredTrainingCompletedAt ||
                                                serverTimestamp,
                                            requiredTrainingCurrentStep: null,
                                            trainingStep: null
                                        }
                                        : {};

                                return {
                                    ...current,
                                    ...trainingPatch,
                                    status: 'completed',
                                    completed: true,
                                    studentCompleted: true,
                                    requiredTourCompleted: true,
                                    completedAt:
                                        current.completedAt ||
                                        serverTimestamp,
                                    completedVersion: VERSION,
                                    completedStepId: 'finish',
                                    completionProof:
                                        'mandatory-final-step',
                                    currentStep: null,
                                    mandatoryStep: null,
                                    progressStep: null,
                                    updatedAt: serverTimestamp
                                };
                            });

                        if (!completionTransaction.committed) {
                            throw new Error(
                                'GUIDE_COMPLETION_TRANSACTION_ABORTED'
                            );
                        }

                        saved = true;
                        break;
                    } catch (error) {
                        lastError = error;
                        if (attempt < 3) {
                            await wait(700 * attempt);
                        }
                    }
                }

                if (!saved) {
                    throw (
                        lastError ||
                        new Error('GUIDE_COMPLETION_SAVE_FAILED')
                    );
                }

                state.remoteGuideCompleted = true;
                state.remoteGuideStatus = 'completed';
                state.remoteMandatoryProgress = 0;
                state.remoteProgressPendingIndex = null;
                state.remoteCompletionResolved = true;
                state.remoteCompletionReadFailed = false;

                if (includeRequiredTraining) {
                    state.remoteTrainingCompleted = true;
                    state.remoteTrainingProgress = 0;
                    cacheRequiredTrainingCompletionLocally();
                }

                const trainingLocalPatch =
                    includeRequiredTraining
                        ? {
                            requiredTrainingCompleted: true,
                            requiredTrainingVersion:
                                REQUIRED_STUDENT_TRAINING_VERSION
                        }
                        : {};

                state.user.newUserGuide = {
                    ...(state.user.newUserGuide || {}),
                    ...trainingLocalPatch,
                    status: 'completed',
                    completed: true,
                    studentCompleted: true,
                    requiredTourCompleted: true,
                    completedVersion: VERSION,
                    completedStepId: 'finish',
                    completionProof: 'mandatory-final-step'
                };

                try {
                    const storedUser = readCurrentUser();
                    localStorage.setItem(
                        'currentUser',
                        JSON.stringify({
                            ...storedUser,
                            newUserGuide: {
                                ...(storedUser.newUserGuide || {}),
                                ...trainingLocalPatch,
                                status: 'completed',
                                completed: true,
                                studentCompleted: true,
                                requiredTourCompleted: true,
                                completedVersion: VERSION,
                                completedStepId: 'finish',
                                completionProof:
                                    'mandatory-final-step'
                            }
                        })
                    );
                } catch (_) {
                    // Không để lỗi cập nhật cache ảnh hưởng trạng thái Firebase.
                }

                return true;
            } catch (error) {
                console.warn(
                    'Không thể lưu trạng thái hướng dẫn lên Firebase:',
                    error
                );
                return false;
            } finally {
                state.remoteCompletionWritePromise = null;
            }
        })();

        return state.remoteCompletionWritePromise;
    }

    async function persistRequiredTrainingCompletionToFirebase() {
        if (state.role !== 'student') return false;

        const authUser = await waitForFirebaseAuthUser();
        const database = getFirebaseDatabaseForGuide();
        const path = getRemoteCompletionPath(authUser);

        state.remoteCompletionPath = path || null;

        if (!database || !path) return false;

        const serverTimestamp =
            window.firebase?.database?.ServerValue?.TIMESTAMP ||
            Date.now();

        try {
            const transaction = await database
                .ref(path)
                .transaction(currentValue => {
                    const current = (
                        currentValue &&
                        typeof currentValue === 'object'
                    )
                        ? currentValue
                        : (
                            currentValue === true
                                ? {
                                    status: 'completed',
                                    completed: true,
                                    studentCompleted: true,
                                    requiredTourCompleted: true
                                }
                                : {}
                        );

                    return {
                        ...current,
                        requiredTrainingCompleted: true,
                        requiredTrainingVersion:
                            REQUIRED_STUDENT_TRAINING_VERSION,
                        requiredTrainingCompletedAt:
                            current.requiredTrainingCompletedAt ||
                            serverTimestamp,
                        requiredTrainingCurrentStep: null,
                        trainingStep: null,
                        updatedAt: serverTimestamp
                    };
                });

            if (!transaction.committed) return false;

            state.remoteTrainingCompleted = true;
            state.remoteTrainingProgress = 0;
            state.remoteCompletionResolved = true;
            state.remoteCompletionReadFailed = false;

            const trainingPatch = {
                requiredTrainingCompleted: true,
                requiredTrainingVersion:
                    REQUIRED_STUDENT_TRAINING_VERSION
            };

            state.user.newUserGuide = {
                ...(state.user.newUserGuide || {}),
                ...trainingPatch
            };

            try {
                const storedUser = readCurrentUser();
                localStorage.setItem(
                    'currentUser',
                    JSON.stringify({
                        ...storedUser,
                        newUserGuide: {
                            ...(storedUser.newUserGuide || {}),
                            ...trainingPatch
                        }
                    })
                );
            } catch (_) {
                // Firebase vẫn là nguồn xác nhận chính.
            }

            return true;
        } catch (error) {
            console.warn(
                'Không thể lưu trạng thái đào tạo bắt buộc lên Firebase:',
                error
            );
            return false;
        }
    }

    async function persistRequiredTrainingProgressToFirebase(stepIndex) {
        if (
            state.role !== 'student' ||
            state.remoteTrainingCompleted === true
        ) {
            return false;
        }

        const normalizedStep = Math.max(
            0,
            Number.isInteger(Number(stepIndex))
                ? Number(stepIndex)
                : 0
        );

        const authUser = await waitForFirebaseAuthUser();
        const database = getFirebaseDatabaseForGuide();
        const path = getRemoteCompletionPath(authUser);

        state.remoteCompletionPath = path || null;

        if (!database || !path) return false;

        try {
            const now = Date.now();
            const transaction = await database
                .ref(path)
                .transaction(currentValue => {
                    const current = (
                        currentValue &&
                        typeof currentValue === 'object'
                    )
                        ? currentValue
                        : (
                            currentValue === true
                                ? {
                                    status: 'completed',
                                    completed: true,
                                    studentCompleted: true,
                                    requiredTourCompleted: true
                                }
                                : {}
                        );

                    if (isRemoteRequiredTrainingComplete(current)) {
                        return current;
                    }

                    const nextStep = Math.max(
                        normalizeRemoteTrainingProgress(current),
                        normalizedStep
                    );

                    return {
                        ...current,
                        requiredTrainingCompleted: false,
                        requiredTrainingVersion:
                            REQUIRED_STUDENT_TRAINING_VERSION,
                        requiredTrainingCurrentStep: nextStep,
                        trainingStep: nextStep,
                        requiredTrainingStartedAt:
                            current.requiredTrainingStartedAt || now,
                        requiredTrainingUpdatedAt: now,
                        updatedAt: now
                    };
                });

            const savedValue = transaction.snapshot?.val?.() || {};

            if (isRemoteRequiredTrainingComplete(savedValue)) {
                state.remoteTrainingCompleted = true;
                state.remoteTrainingProgress = 0;
                cacheRequiredTrainingCompletionLocally();
                return true;
            }

            if (transaction.committed) {
                state.remoteTrainingProgress = Math.max(
                    state.remoteTrainingProgress || 0,
                    normalizeRemoteTrainingProgress(savedValue),
                    normalizedStep
                );
                state.remoteCompletionResolved = true;
                state.remoteCompletionReadFailed = false;
                return true;
            }
        } catch (error) {
            console.warn(
                'Không thể lưu tiến độ đào tạo bắt buộc lên Firebase:',
                error
            );
        }

        return false;
    }

    async function persistGuideProgressToFirebase(stepIndex) {
        if (
            state.role !== 'student' ||
            state.remoteGuideCompleted === true
        ) {
            return false;
        }

        const normalizedStep = Math.max(
            0,
            Number.isInteger(Number(stepIndex))
                ? Number(stepIndex)
                : 0
        );

        const authUser = await waitForFirebaseAuthUser();
        const database = getFirebaseDatabaseForGuide();
        const path = getRemoteCompletionPath(authUser);

        state.remoteCompletionPath = path || null;

        if (!database || !path) return false;

        try {
            const now = Date.now();
            const transaction = await database
                .ref(path)
                .transaction(currentValue => {
                    /*
                     * Không cho một lệnh lưu tiến độ đến muộn ghi đè trạng
                     * thái completed do tab khác hoặc bước cuối vừa lưu.
                     */
                    if (isRemoteCompletionValueComplete(currentValue)) {
                        return currentValue;
                    }

                    const current = (
                        currentValue &&
                        typeof currentValue === 'object'
                    )
                        ? currentValue
                        : {};

                    const currentStep =
                        normalizeRemoteMandatoryProgress(current);
                    const nextStep = Math.max(
                        currentStep,
                        normalizedStep
                    );

                    return {
                        ...current,
                        status: 'in_progress',
                        completed: false,
                        studentCompleted: false,
                        requiredTourCompleted: false,
                        currentStep: nextStep,
                        mandatoryStep: nextStep,
                        progressStep: nextStep,
                        startedAt: current.startedAt || now,
                        startedVersion:
                            current.startedVersion || VERSION,
                        lastSeenVersion: VERSION,
                        updatedAt: now
                    };
                });

            const savedValue = transaction.snapshot?.val?.() || {};

            if (isRemoteCompletionValueComplete(savedValue)) {
                state.remoteGuideCompleted = true;
                state.remoteGuideStatus = 'completed';
                state.remoteMandatoryProgress = 0;
                cacheGuideCompletionLocally();
                return true;
            }

            if (transaction.committed) {
                state.remoteGuideStatus = 'in_progress';
                state.remoteMandatoryProgress = Math.max(
                    state.remoteMandatoryProgress || 0,
                    normalizeRemoteMandatoryProgress(savedValue),
                    normalizedStep
                );
                state.remoteCompletionResolved = true;
                state.remoteCompletionReadFailed = false;
                return true;
            }
        } catch (error) {
            console.warn(
                'Không thể lưu tiến độ hướng dẫn lên Firebase:',
                error
            );
        }

        return false;
    }

    function queueMandatoryProgressSync(stepIndex) {
        if (
            state.role !== 'student' ||
            state.remoteGuideCompleted === true
        ) {
            return;
        }

        const normalizedStep = Math.max(
            0,
            Number.isInteger(Number(stepIndex))
                ? Number(stepIndex)
                : 0
        );

        state.remoteProgressPendingIndex = Math.max(
            Number(state.remoteProgressPendingIndex) || 0,
            normalizedStep
        );

        if (state.remoteProgressWritePromise) return;

        state.remoteProgressWritePromise = (async () => {
            while (
                state.remoteProgressPendingIndex !== null &&
                state.remoteGuideCompleted !== true
            ) {
                const pendingStep = Math.max(
                    0,
                    Number(state.remoteProgressPendingIndex) || 0
                );

                state.remoteProgressPendingIndex = null;
                await persistGuideProgressToFirebase(pendingStep);
            }
        })().finally(() => {
            state.remoteProgressWritePromise = null;

            if (
                state.remoteProgressPendingIndex !== null &&
                state.remoteGuideCompleted !== true
            ) {
                queueMandatoryProgressSync(
                    state.remoteProgressPendingIndex
                );
            }
        });
    }

    async function resolveGuideCompletionState() {
        const localCompleted = hasCompletedGuideLocally();
        const localTrainingCompleted =
            hasRequiredTrainingCompletedLocally();

        if (state.role !== 'student') {
            return {
                completed: localCompleted,
                trainingCompleted: true,
                remoteAvailable: false
            };
        }

        /*
         * Firebase là nguồn xác nhận chính. Không tin trực tiếp trường
         * newUserGuide nằm trong currentUser/localStorage vì dữ liệu đó có
         * thể cũ sau khi đăng xuất hoặc bị chỉnh trong trình duyệt.
         */
        const remote = await readRemoteGuideCompletion();

        if (remote.completed) {
            if (
                !remote.trainingCompleted &&
                localTrainingCompleted
            ) {
                persistRequiredTrainingCompletionToFirebase();
            }

            return {
                completed: true,
                trainingCompleted:
                    remote.trainingCompleted ||
                    localTrainingCompleted,
                remoteAvailable: true
            };
        }

        if (localCompleted) {
            /*
             * Tự động di chuyển dữ liệu hoàn tất của bản cũ lên Firebase.
             * Không được tự đánh dấu đào tạo mới là đã xem nếu học sinh chưa
             * thực sự hoàn thành mô-đun bắt buộc của phiên bản này.
             */
            persistGuideCompletionToFirebase({
                includeRequiredTraining:
                    localTrainingCompleted
            });

            return {
                completed: true,
                trainingCompleted: remote.available
                    ? (
                        remote.trainingCompleted ||
                        localTrainingCompleted
                    )
                    : (
                        localTrainingCompleted
                            ? true
                            : null
                    ),
                remoteAvailable: remote.available
            };
        }

        if (!remote.available) {
            /*
             * Không kết luận đây là học sinh mới khi máy chủ chưa trả lời.
             * Điều này ngăn tour bắt buộc chạy lại chỉ vì mất mạng, quyền đọc
             * Firebase chưa sẵn sàng hoặc trình duyệt vừa xóa dữ liệu cục bộ.
             */
            return {
                completed: null,
                trainingCompleted:
                    localTrainingCompleted ? true : null,
                remoteAvailable: false
            };
        }

        return {
            completed: false,
            trainingCompleted: false,
            remoteAvailable: true
        };
    }

    function getProgressStorageKey() {
        return `new_user_guide_progress:${state.role}:${getGuideUsername()}`;
    }

    function getLauncherVisibilityStorageKey() {
        return `new_user_guide_launcher_visible:${state.role}:${getGuideUsername()}`;
    }

    function getSavedLauncherVisibility() {
        return localStorage.getItem(
            getLauncherVisibilityStorageKey()
        ) !== 'false';
    }

    function isLauncherVisibilityLocked() {
        return (
            state.role === 'student' &&
            state.remoteCompletionReadFailed !== true &&
            (
                !hasCompletedGuide() ||
                !hasRequiredTrainingCompleted()
            )
        );
    }

    function syncLauncherVisibilitySetting() {
        const setting = document.getElementById(
            'nugDetailedGuideSetting'
        );

        const toggle = document.getElementById(
            'nugDetailedGuideToggle'
        );

        const status = document.getElementById(
            'nugDetailedGuideStatus'
        );

        const locked = isLauncherVisibilityLocked();

        if (toggle) {
            toggle.checked = state.launcherVisible;
            toggle.disabled = locked;
            toggle.setAttribute(
                'aria-disabled',
                String(locked)
            );
        }

        setting?.classList.toggle(
            'is-locked',
            locked
        );

        if (status) {
            if (locked) {
                status.textContent =
                    'Học sinh cần hoàn thành hướng dẫn bắt buộc trước khi có thể ẩn nút này.';
            } else if (state.launcherVisible) {
                status.textContent =
                    'Nút dấu hỏi đang hiển thị ở góc màn hình.';
            } else {
                status.textContent =
                    'Nút dấu hỏi đang được ẩn. Có thể bật lại tại đây bất cứ lúc nào.';
            }
        }
    }

    function applyLauncherVisibility(
        isVisible,
        shouldPersist = true
    ) {
        const requestedVisible = isVisible !== false;
        const locked = isLauncherVisibilityLocked();

        /*
         * Học sinh chưa hoàn thành lần hướng dẫn đầu tiên không được
         * dùng cài đặt này để né tour bắt buộc. Trạng thái đã lưu cũ
         * chỉ được áp dụng lại sau khi tour bắt buộc hoàn tất.
         */
        const effectiveVisible = locked
            ? true
            : requestedVisible;

        state.launcherVisible = effectiveVisible;

        const root = document.getElementById(ROOT_ID);
        const launcher = root?.querySelector('.nug-launcher');

        root?.classList.toggle(
            'is-launcher-hidden',
            !effectiveVisible
        );

        if (launcher) {
            launcher.setAttribute(
                'aria-hidden',
                String(!effectiveVisible)
            );

            launcher.tabIndex = effectiveVisible
                ? 0
                : -1;
        }

        if (shouldPersist && !locked) {
            localStorage.setItem(
                getLauncherVisibilityStorageKey(),
                String(requestedVisible)
            );
        }

        syncLauncherVisibilitySetting();
        return effectiveVisible;
    }

    function toggleDetailedGuideLauncher(isVisible) {
        if (isLauncherVisibilityLocked()) {
            applyLauncherVisibility(true, false);
            showToast(
                'Hãy hoàn thành hướng dẫn bắt buộc trước khi ẩn nút Hướng dẫn chi tiết.'
            );
            return false;
        }

        const visible = applyLauncherVisibility(
            Boolean(isVisible),
            true
        );

        showToast(
            visible
                ? 'Đã hiện nút Hướng dẫn chi tiết.'
                : 'Đã ẩn nút Hướng dẫn chi tiết. Có thể bật lại trong Cài đặt.'
        );

        return visible;
    }

    function hasCompletedGuideLocally() {
        /*
         * Chỉ khóa hoàn tất riêng mới được tính là đã hoàn thành.
         * Khóa new_user_guide_seen chỉ có nghĩa là đã mở/bắt đầu và tuyệt đối
         * không được dùng để bỏ qua tour bắt buộc sau khi đăng xuất.
         */
        return (
            localStorage.getItem(getCompletionStorageKey()) === 'true'
        );
    }

    function hasCompletedGuide() {
        return (
            state.remoteGuideCompleted === true ||
            isRemoteCompletionValueComplete(state.user?.newUserGuide) ||
            hasCompletedGuideLocally()
        );
    }

    function isFirstVisit() {
        return !hasCompletedGuide();
    }

    function markAsSeen() {
        localStorage.setItem(getStorageKey(), 'true');
    }

    function markGuideAsCompleted() {
        cacheGuideCompletionLocally();
        cacheRequiredTrainingCompletionLocally();
        state.remoteGuideCompleted = true;
        state.remoteTrainingCompleted = true;
        state.remoteGuideStatus = 'completed';
        state.remoteMandatoryProgress = 0;
        state.remoteTrainingProgress = 0;
        state.remoteProgressPendingIndex = null;

        /*
         * Học sinh mới đã đi qua toàn bộ tour, trong đó có mô-đun nộp bài,
         * cập nhật và hiệu năng. Vì vậy hoàn tất tour đầy đủ cũng đồng thời
         * hoàn tất đào tạo bắt buộc của phiên bản này.
         */
        persistGuideCompletionToFirebase({
            includeRequiredTraining: true
        }).then(saved => {
            if (!saved) {
                showToast(
                    'Đã hoàn thành hướng dẫn nhưng chưa đồng bộ được lên máy chủ. Hãy giữ kết nối và tải lại trang để hệ thống thử lại.'
                );
            }
        });
    }

    function markRequiredTrainingAsCompleted() {
        cacheRequiredTrainingCompletionLocally();
        state.remoteTrainingCompleted = true;
        state.remoteTrainingProgress = 0;

        persistRequiredTrainingCompletionToFirebase()
            .then(saved => {
                if (!saved) {
                    showToast(
                        'Đã xem xong hướng dẫn bắt buộc nhưng chưa đồng bộ được lên máy chủ. Hãy giữ kết nối và tải lại trang để hệ thống thử lại.'
                    );
                }
            });
    }

    function saveMandatoryProgress(stepIndex) {
        if (!state.mandatoryMode) return;

        const normalizedStep = Math.max(
            0,
            Number.isInteger(Number(stepIndex))
                ? Number(stepIndex)
                : 0
        );

        if (state.mandatoryScope === 'training') {
            localStorage.setItem(
                getTrainingProgressStorageKey(),
                String(normalizedStep)
            );

            persistRequiredTrainingProgressToFirebase(
                normalizedStep
            );
            return;
        }

        localStorage.setItem(
            getProgressStorageKey(),
            String(normalizedStep)
        );

        /*
         * Lưu cả Firebase để đăng xuất, đổi tab, xóa cache hoặc đăng nhập lại
         * vẫn nhận ra đây chỉ là in_progress chứ chưa phải completed.
         */
        queueMandatoryProgressSync(normalizedStep);
    }

    function readMandatoryProgress(maxIndex) {
        const isTraining =
            state.mandatoryScope === 'training';

        const localSaved = Number(
            localStorage.getItem(
                isTraining
                    ? getTrainingProgressStorageKey()
                    : getProgressStorageKey()
            )
        );

        const validLocal = (
            Number.isInteger(localSaved) &&
            localSaved >= 0
        )
            ? localSaved
            : 0;

        const remoteCandidate = isTraining
            ? state.remoteTrainingProgress
            : state.remoteMandatoryProgress;

        const remoteSaved = (
            Number.isInteger(Number(remoteCandidate)) &&
            Number(remoteCandidate) >= 0
        )
            ? Number(remoteCandidate)
            : 0;

        return Math.min(
            Math.max(validLocal, remoteSaved),
            Math.max(0, maxIndex)
        );
    }

    const GUIDE_MANAGED_DIALOG_IDS = new Set([
        'coinConversionModal',
        'studentBagModal',
        'studentInboxModal',
        'studentInfoModal',
        'viewQuestionsModal',
        'practiceRedoWarningModal',
        'practiceRedoModal',
        'storeCollectionAcquisitionModal',
        'nug-demo-review-modal',
        'nug-demo-checkout'
    ]);

    const EXTERNAL_DIALOG_SELECTORS = [
        '.modal-overlay.active',
        '#dl-student-modal',
        '.dl-overlay',
        '[aria-modal="true"]',
        '[role="dialog"]'
    ].join(',');

    function isActuallyVisible(element) {
        if (!(element instanceof Element) || !element.isConnected) {
            return false;
        }

        const style = window.getComputedStyle(element);

        if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            Number(style.opacity || 1) <= 0.01
        ) {
            return false;
        }

        const rect = element.getBoundingClientRect();

        return rect.width > 1 && rect.height > 1;
    }

    function isGuideManagedDialog(element) {
        if (!(element instanceof Element)) return false;
        if (element.closest(`#${ROOT_ID}`)) return true;

        let current = element;

        while (current && current !== document.body) {
            if (current.id && GUIDE_MANAGED_DIALOG_IDS.has(current.id)) {
                return true;
            }

            current = current.parentElement;
        }

        return false;
    }

    function getVisibleExternalDialogs() {
        const candidates = [
            ...document.querySelectorAll(EXTERNAL_DIALOG_SELECTORS)
        ];

        return [...new Set(candidates)].filter(element => {
            if (isGuideManagedDialog(element)) return false;

            /*
             * Modal overlay của website chỉ được xem là đang mở khi có
             * class active. Riêng Quà đăng nhập dùng .dl-overlay và được
             * chèn/xóa trực tiếp nên không cần class active.
             */
            if (
                element.classList.contains('modal-overlay') &&
                !element.classList.contains('active')
            ) {
                return false;
            }

            return isActuallyVisible(element);
        });
    }

    function syncMandatoryLauncherVisibility() {
        document.getElementById(ROOT_ID)?.classList.toggle(
            'is-mandatory-waiting',
            state.mandatoryStartPending || state.mandatorySuspended
        );
    }

    function setMandatoryTourSuspended(isSuspended) {
        const suspended = Boolean(isSuspended);

        if (state.mandatorySuspended === suspended) return;

        state.mandatorySuspended = suspended;
        syncMandatoryLauncherVisibility();

        const layer = document.getElementById('nug-tour-layer');

        if (!layer) return;

        layer.classList.toggle('is-suspended', suspended);
        layer.setAttribute('aria-hidden', String(suspended));

        if (!suspended) {
            requestAnimationFrame(() => {
                updateTourPosition();
                document.getElementById('nug-next')?.focus({
                    preventScroll: true
                });
            });
        }
    }

    function stopMandatoryDialogMonitor() {
        state.mandatoryGateObserver?.disconnect();
        state.mandatoryGateObserver = null;

        if (state.mandatoryGatePoller !== null) {
            clearInterval(state.mandatoryGatePoller);
            state.mandatoryGatePoller = null;
        }

        state.mandatoryStartPending = false;
        state.mandatoryGateQuietSince = 0;
        setMandatoryTourSuspended(false);
        syncMandatoryLauncherVisibility();
    }

    function evaluateMandatoryDialogGate() {
        if (
            state.role !== 'student' ||
            isMandatoryRequirementSatisfied()
        ) {
            stopMandatoryDialogMonitor();
            return;
        }

        const blockers = getVisibleExternalDialogs();
        const now = Date.now();

        if (blockers.length > 0) {
            state.mandatoryGateQuietSince = 0;

            if (state.mandatoryMode) {
                /*
                 * Một thông báo/khảo sát có thể đến muộn từ Firebase.
                 * Tạm ẩn hướng dẫn để học sinh xử lý cửa sổ đó trước.
                 */
                setMandatoryTourSuspended(true);
            }

            return;
        }

        if (state.mandatoryGateQuietSince === 0) {
            state.mandatoryGateQuietSince = now;
        }

        /*
         * Chờ giao diện yên ổn một khoảng ngắn để các cửa sổ khởi động
         * kế tiếp (quà 7 ngày, thông báo, khảo sát...) có thời gian hiện.
         */
        const quietLongEnough =
            now - state.mandatoryGateQuietSince >= 900;

        if (state.mandatoryMode) {
            if (state.mandatorySuspended && quietLongEnough) {
                setMandatoryTourSuspended(false);
            }

            return;
        }

        const startupReady =
            now - state.mandatoryGateStartedAt >= 2600;

        if (
            state.mandatoryStartPending &&
            startupReady &&
            quietLongEnough
        ) {
            state.mandatoryStartPending = false;

            startTour(null, {
                mandatory: true,
                mandatoryScope: state.mandatoryScope,
                resume: true
            });
        }
    }

    function installMandatoryDialogMonitor() {
        if (state.mandatoryGateObserver || state.mandatoryGatePoller !== null) {
            return;
        }

        state.mandatoryGateObserver = new MutationObserver(() => {
            /* Gộp nhiều thay đổi DOM liên tiếp thành một lần kiểm tra. */
            clearTimeout(installMandatoryDialogMonitor.timer);
            installMandatoryDialogMonitor.timer = setTimeout(
                evaluateMandatoryDialogGate,
                40
            );
        });

        state.mandatoryGateObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [
                'class',
                'style',
                'hidden',
                'aria-hidden'
            ]
        });

        state.mandatoryGatePoller = setInterval(
            evaluateMandatoryDialogGate,
            300
        );
    }

    function queueMandatoryStudentTour(scope = 'full') {
        const normalizedScope =
            scope === 'training' ? 'training' : 'full';

        const requirementAlreadyMet =
            normalizedScope === 'training'
                ? hasRequiredTrainingCompleted()
                : hasCompletedGuide();

        if (
            state.role !== 'student' ||
            requirementAlreadyMet ||
            state.mandatoryMode ||
            state.mandatoryStartPending
        ) {
            return false;
        }

        state.mandatoryScope = normalizedScope;
        state.mandatoryStartPending = true;
        state.mandatoryGateStartedAt = Date.now();
        state.mandatoryGateQuietSince = 0;
        syncMandatoryLauncherVisibility();

        installMandatoryDialogMonitor();
        evaluateMandatoryDialogGate();

        return true;
    }

    function createElement(tag, options = {}) {
        const element = document.createElement(tag);

        if (options.className) element.className = options.className;
        if (options.id) element.id = options.id;
        if (options.text !== undefined) element.textContent = options.text;
        if (options.type) element.type = options.type;
        if (options.title) element.title = options.title;
        if (options.ariaLabel) element.setAttribute('aria-label', options.ariaLabel);

        return element;
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            :root {
                --nug-primary: #6d5dfc;
                --nug-primary-dark: #5142dc;
                --nug-text: #18212f;
                --nug-muted: #667085;
                --nug-surface: #ffffff;
                --nug-soft: #f5f7ff;
                --nug-border: #dfe4f2;
                --nug-success: #0f9f6e;
            }

            #${ROOT_ID}, #${ROOT_ID} * { box-sizing: border-box; }

            #${ROOT_ID} .nug-forced-hidden { display: none !important; }

            #${ROOT_ID} .nug-tour-layer.is-suspended {
                display: none !important;
            }

            #${ROOT_ID}.is-mandatory-waiting .nug-launcher,
            #${ROOT_ID}.is-launcher-hidden .nug-launcher {
                display: none !important;
            }

            #nugDetailedGuideSetting {
                width: 100% !important;
                box-sizing: border-box !important;
                margin: 0 0 20px !important;
                padding: 16px 18px !important;
                border: 1px solid rgba(99,102,241,.18) !important;
                border-radius: 14px !important;
                background: rgba(255,255,255,.62) !important;
                box-shadow: 0 6px 18px rgba(15,23,42,.05) !important;
            }

            #nugDetailedGuideSetting .nug-setting-row {
                width: 100% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 16px !important;
                flex-wrap: nowrap !important;
            }

            #nugDetailedGuideSetting .nug-setting-copy {
                min-width: 0 !important;
                flex: 1 1 auto !important;
            }

            #nugDetailedGuideSetting .nug-setting-title {
                display: block !important;
                margin: 0 !important;
                color: #253047 !important;
                font: 800 15px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
            }

            #nugDetailedGuideSetting .nug-setting-description,
            #nugDetailedGuideSetting .nug-setting-status {
                display: block !important;
                margin: 5px 0 0 !important;
                color: #667085 !important;
                font: 500 13px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
            }

            #nugDetailedGuideSetting .nug-setting-status {
                color: #4f46e5 !important;
                font-weight: 700 !important;
            }

            #nugDetailedGuideSetting.is-locked .nug-setting-status {
                color: #b45309 !important;
            }

            #nugDetailedGuideSetting .nug-setting-switch {
                position: relative !important;
                display: inline-flex !important;
                width: 52px !important;
                min-width: 52px !important;
                height: 30px !important;
                margin: 0 !important;
                padding: 0 !important;
                flex: 0 0 52px !important;
                align-items: center !important;
                cursor: pointer !important;
            }

            #nugDetailedGuideSetting .nug-setting-switch input {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                margin: 0 !important;
                padding: 0 !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }

            #nugDetailedGuideSetting .nug-setting-slider {
                position: absolute !important;
                inset: 0 !important;
                display: block !important;
                border-radius: 999px !important;
                background: #cbd5e1 !important;
                box-shadow: inset 0 0 0 1px rgba(15,23,42,.08) !important;
                transition: background .2s ease !important;
            }

            #nugDetailedGuideSetting .nug-setting-slider::before {
                content: "" !important;
                position: absolute !important;
                top: 4px !important;
                left: 4px !important;
                width: 22px !important;
                height: 22px !important;
                border-radius: 50% !important;
                background: #fff !important;
                box-shadow: 0 2px 6px rgba(15,23,42,.25) !important;
                transition: transform .2s ease !important;
            }

            #nugDetailedGuideSetting .nug-setting-switch input:checked + .nug-setting-slider {
                background: linear-gradient(135deg,#6d5dfc,#5142dc) !important;
            }

            #nugDetailedGuideSetting .nug-setting-switch input:checked + .nug-setting-slider::before {
                transform: translateX(22px) !important;
            }

            #nugDetailedGuideSetting .nug-setting-switch input:focus-visible + .nug-setting-slider {
                outline: 3px solid rgba(99,102,241,.28) !important;
                outline-offset: 3px !important;
            }

            #nugDetailedGuideSetting .nug-setting-switch input:disabled + .nug-setting-slider {
                cursor: not-allowed !important;
                opacity: .58 !important;
            }

            @media (max-width: 520px) {
                #nugDetailedGuideSetting {
                    padding: 14px !important;
                }

                #nugDetailedGuideSetting .nug-setting-row {
                    align-items: flex-start !important;
                    gap: 12px !important;
                }
            }

            #${ROOT_ID} .nug-tooltip.is-mandatory {
                border: 2px solid rgba(109,93,252,.35) !important;
            }

            #${ROOT_ID} .nug-tooltip.is-mandatory .nug-step-count {
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                padding: 6px 9px !important;
                border-radius: 999px !important;
                background: #fff1f2 !important;
                color: #be123c !important;
            }

            #${ROOT_ID} .nug-tooltip.is-mandatory .nug-tooltip-actions {
                justify-content: flex-end !important;
            }

            #${ROOT_ID} .nug-mandatory-shield {
                position: fixed !important;
                inset: 0 !important;
                display: none !important;
                pointer-events: auto !important;
                background: transparent !important;
            }

            #${ROOT_ID} .nug-mandatory-shield.is-active {
                display: block !important;
            }

            .nug-launcher {
                position: fixed;
                top: 18px;
                right: 18px;
                z-index: ${MAX_Z_INDEX};
                width: 48px;
                height: 48px;
                border: 2px solid rgba(255,255,255,.8);
                border-radius: 50%;
                background: linear-gradient(135deg, #7968ff, #4f46e5);
                color: #fff;
                font: 900 24px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                cursor: pointer;
                box-shadow: 0 12px 30px rgba(79,70,229,.35);
                transition: transform .2s ease, box-shadow .2s ease;
            }

            .nug-launcher:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 16px 34px rgba(79,70,229,.42); }
            .nug-launcher:focus-visible { outline: 4px solid rgba(99,102,241,.28); outline-offset: 3px; }

            .nug-backdrop {
                position: fixed;
                inset: 0;
                z-index: ${MAX_Z_INDEX + 1};
                background: rgba(12,18,32,.66);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                display: none;
                align-items: center;
                justify-content: center;
                padding: 18px;
            }

            .nug-backdrop.is-open { display: flex; }

            .nug-panel {
                width: min(920px, 100%);
                max-height: min(780px, calc(100vh - 36px));
                background: var(--nug-surface);
                color: var(--nug-text);
                border: 1px solid rgba(255,255,255,.75);
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 30px 90px rgba(0,0,0,.32);
                display: flex;
                flex-direction: column;
                animation: nug-pop .22s ease-out;
            }

            @keyframes nug-pop {
                from { opacity: 0; transform: translateY(12px) scale(.985); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .nug-panel-header {
                padding: 24px 26px 18px;
                background: linear-gradient(135deg, #f6f5ff, #eef6ff);
                border-bottom: 1px solid var(--nug-border);
                position: relative;
            }

            .nug-eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(109,93,252,.1);
                color: var(--nug-primary-dark);
                font: 800 12px/1.2 system-ui, sans-serif;
                letter-spacing: .02em;
                text-transform: uppercase;
            }

            .nug-title {
                margin: 12px 50px 6px 0;
                font: 900 clamp(24px, 4vw, 34px)/1.16 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                color: #172033;
            }

            .nug-subtitle {
                margin: 0;
                max-width: 720px;
                color: var(--nug-muted);
                font: 500 15px/1.55 system-ui, sans-serif;
            }

            /*
             * Các trang chính có CSS chung đặt button/input/label width:100% hoặc
             * background !important. Khối dưới cô lập giao diện hướng dẫn để
             * thanh tìm kiếm không bị co lại trên máy tính.
             */
            #${ROOT_ID} button,
            #${ROOT_ID} input,
            #${ROOT_ID} label {
                box-sizing: border-box !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
            }

            .nug-close {
                position: absolute !important;
                top: 18px !important;
                right: 18px !important;
                width: 38px !important;
                min-width: 38px !important;
                max-width: 38px !important;
                height: 38px !important;
                min-height: 38px !important;
                margin: 0 !important;
                padding: 0 !important;
                display: grid !important;
                place-items: center !important;
                border: 1px solid var(--nug-border) !important;
                border-radius: 12px !important;
                background: rgba(255,255,255,.88) !important;
                color: #475467 !important;
                box-shadow: none !important;
                font: 800 21px/1 system-ui, sans-serif !important;
                cursor: pointer !important;
            }

            .nug-toolbar {
                width: 100% !important;
                padding: 16px 26px !important;
                display: grid !important;
                grid-template-columns: minmax(260px, 1fr) auto !important;
                gap: 12px !important;
                align-items: center !important;
                border-bottom: 1px solid var(--nug-border) !important;
            }

            .nug-search-wrap {
                width: auto !important;
                min-width: 260px !important;
                height: 48px !important;
                margin: 0 !important;
                padding: 0 14px !important;
                display: flex !important;
                flex: 1 1 auto !important;
                align-items: center !important;
                gap: 10px !important;
                overflow: hidden !important;
                border: 1px solid var(--nug-border) !important;
                border-radius: 14px !important;
                background: #fff !important;
                box-shadow: none !important;
            }

            .nug-search-icon {
                width: 24px !important;
                min-width: 24px !important;
                height: 24px !important;
                display: grid !important;
                place-items: center !important;
                flex: 0 0 24px !important;
                font-size: 18px !important;
                line-height: 1 !important;
            }

            .nug-search {
                display: block !important;
                flex: 1 1 auto !important;
                width: 100% !important;
                min-width: 0 !important;
                height: 46px !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                border: 0 !important;
                border-radius: 0 !important;
                outline: 0 !important;
                box-shadow: none !important;
                color: var(--nug-text) !important;
                background: transparent !important;
                font: 600 14px/1.3 system-ui, sans-serif !important;
                appearance: none !important;
                -webkit-appearance: none !important;
            }

            .nug-search::-webkit-search-cancel-button {
                cursor: pointer;
            }

            .nug-primary-button, .nug-secondary-button, .nug-card-button {
                min-height: 0 !important;
                margin: 0 !important;
                border: 0 !important;
                border-radius: 13px !important;
                cursor: pointer !important;
                font: 800 14px/1.2 system-ui, sans-serif !important;
                transition: transform .16s ease, filter .16s ease !important;
                text-transform: none !important;
                letter-spacing: normal !important;
            }

            .nug-primary-button:hover, .nug-secondary-button:hover, .nug-card-button:hover { transform: translateY(-1px); filter: brightness(1.02); }

            .nug-primary-button {
                width: auto !important;
                min-width: 230px !important;
                flex: 0 0 auto !important;
                padding: 13px 18px !important;
                background: linear-gradient(135deg, var(--nug-primary), var(--nug-primary-dark)) !important;
                color: #fff !important;
                box-shadow: 0 8px 20px rgba(81,66,220,.22) !important;
                white-space: nowrap !important;
            }

            .nug-secondary-button {
                width: auto !important;
                padding: 12px 16px !important;
                background: #eef1ff !important;
                color: #4f46e5 !important;
                box-shadow: none !important;
            }

            .nug-feature-list {
                padding: 18px 26px 26px;
                overflow: auto;
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 14px;
            }

            .nug-card {
                border: 1px solid var(--nug-border);
                border-radius: 18px;
                background: #fff;
                padding: 17px;
                display: grid;
                grid-template-columns: 46px minmax(0, 1fr);
                gap: 13px;
                align-items: start;
                box-shadow: 0 6px 18px rgba(16,24,40,.04);
            }

            .nug-card[hidden] { display: none !important; }

            .nug-card-icon {
                width: 46px;
                height: 46px;
                border-radius: 14px;
                display: grid;
                place-items: center;
                background: var(--nug-soft);
                font-size: 24px;
            }

            .nug-card-title {
                margin: 0 0 5px;
                font: 850 16px/1.25 system-ui, sans-serif;
                color: #172033;
            }

            .nug-card-description {
                margin: 0;
                color: var(--nug-muted);
                font: 500 13px/1.48 system-ui, sans-serif;
            }

            .nug-access {
                margin: 10px 0 0;
                padding: 10px 11px;
                border-radius: 11px;
                background: #f7f8fc;
                color: #344054;
                font: 600 12.5px/1.45 system-ui, sans-serif;
            }

            .nug-detail-list {
                margin: 11px 0 0;
                padding-left: 19px;
                color: #475467;
                font: 600 12.5px/1.5 system-ui, sans-serif;
            }

            .nug-detail-list li + li { margin-top: 4px; }

            .nug-card-actions {
                grid-column: 1 / -1;
                display: flex;
                justify-content: flex-end;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 2px;
            }

            .nug-card-button {
                width: auto !important;
                min-width: 0 !important;
                flex: 0 0 auto !important;
                padding: 9px 13px !important;
                background: #edf0ff !important;
                color: #4f46e5 !important;
                box-shadow: none !important;
            }

            .nug-card-button.is-tour {
                background: linear-gradient(135deg, #6d5dfc, #5142dc) !important;
                color: #fff !important;
                box-shadow: 0 7px 16px rgba(81,66,220,.18) !important;
            }

            .nug-card-button:disabled {
                background: #f2f4f7 !important;
                color: #98a2b3 !important;
                box-shadow: none !important;
                cursor: not-allowed !important;
                transform: none !important;
                filter: none !important;
            }

            .nug-empty {
                grid-column: 1 / -1;
                padding: 28px;
                text-align: center;
                color: var(--nug-muted);
                font: 650 14px/1.5 system-ui, sans-serif;
                display: none;
            }

            .nug-empty.is-visible { display: block; }

            .nug-tour-layer {
                position: fixed;
                inset: 0;
                z-index: ${MAX_Z_INDEX + 10};
                pointer-events: none;
                display: none;
            }

            .nug-tour-layer.is-open { display: block; }

            .nug-mask {
                position: fixed;
                background: rgba(7,12,24,.72);
                pointer-events: auto;
            }

            .nug-highlight {
                position: fixed;
                border: 3px solid #8b7cff;
                border-radius: 15px;
                box-shadow: 0 0 0 4px rgba(139,124,255,.18), 0 12px 34px rgba(0,0,0,.22);
                pointer-events: none;
                transition: left .2s ease, top .2s ease, width .2s ease, height .2s ease;
            }

            .nug-tooltip {
                position: fixed;
                width: min(390px, calc(100vw - 24px));
                background: #fff;
                color: var(--nug-text);
                border: 1px solid rgba(255,255,255,.7);
                border-radius: 20px;
                box-shadow: 0 24px 70px rgba(0,0,0,.34);
                padding: 19px;
                pointer-events: auto;
                animation: nug-pop .18s ease-out;
            }

            .nug-step-count {
                color: var(--nug-primary-dark);
                font: 850 12px/1.2 system-ui, sans-serif;
                text-transform: uppercase;
                letter-spacing: .03em;
            }

            .nug-tooltip-title {
                margin: 8px 0 7px;
                font: 900 21px/1.2 system-ui, sans-serif;
                color: #172033;
            }

            .nug-tooltip-text {
                margin: 0;
                color: var(--nug-muted);
                font: 500 14px/1.55 system-ui, sans-serif;
            }

            .nug-tooltip-access {
                margin: 12px 0 0;
                padding: 11px 12px;
                border-radius: 12px;
                background: #f4f5ff;
                color: #353c70;
                font: 700 13px/1.5 system-ui, sans-serif;
            }

            .nug-progress {
                margin-top: 16px;
                height: 5px;
                overflow: hidden;
                border-radius: 999px;
                background: #e8eaf3;
            }

            .nug-progress-bar {
                height: 100%;
                border-radius: inherit;
                background: linear-gradient(90deg, #8b7cff, #4f46e5);
                transition: width .22s ease;
            }

            .nug-tooltip-actions {
                margin-top: 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }

            .nug-tooltip-actions-left,
            .nug-tooltip-actions-right {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .nug-text-button {
                border: 0;
                background: transparent;
                color: #667085;
                font: 750 13px/1.2 system-ui, sans-serif;
                padding: 9px 6px;
                cursor: pointer;
            }

            .nug-toast {
                position: fixed;
                left: 50%;
                bottom: 24px;
                transform: translate(-50%, 18px);
                z-index: ${MAX_Z_INDEX + 30};
                max-width: min(560px, calc(100vw - 32px));
                padding: 12px 16px;
                border-radius: 13px;
                background: #172033;
                color: #fff;
                font: 700 13px/1.45 system-ui, sans-serif;
                box-shadow: 0 16px 40px rgba(0,0,0,.25);
                opacity: 0;
                pointer-events: none;
                transition: opacity .2s ease, transform .2s ease;
            }

            .nug-toast.is-visible { opacity: 1; transform: translate(-50%, 0); }

            .nug-demo-checkout {
                position: fixed;
                inset: 0;
                z-index: ${MAX_Z_INDEX + 5};
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                background: rgba(8, 15, 30, .32);
            }

            .nug-demo-checkout-card {
                width: min(420px, 94vw);
                max-height: 88vh;
                overflow: auto;
                padding: 22px;
                border-radius: 18px;
                border-top: 6px solid #f39c12;
                background: #fff;
                box-shadow: 0 18px 60px rgba(0,0,0,.35);
                color: #344054;
                font-family: system-ui, sans-serif;
            }

            .nug-demo-checkout-card h3 { margin: 0 0 14px; color: #f39c12; }
            .nug-demo-checkout-card select { width: 100%; padding: 11px; border: 2px dashed #f39c12; border-radius: 10px; font-weight: 750; }
            .nug-demo-summary { margin: 14px 0; padding: 13px; border-radius: 12px; background: #fff9ed; }
            .nug-demo-row { display: flex; justify-content: space-between; gap: 12px; margin: 6px 0; }
            .nug-demo-total { text-align: center; margin-top: 12px; font-size: 27px; font-weight: 900; color: #d35400; }
            .nug-demo-confirm { width: 100%; padding: 13px; border: 0; border-radius: 12px; cursor: pointer; background: linear-gradient(135deg,#f6d365,#fda085); color:#fff; font-weight:900; }
            .nug-demo-note { margin: 12px 0 0; color:#667085; font-size:12px; line-height:1.45; }

            #nug-submission-demo {
                margin: 0 0 18px !important;
                padding: 18px !important;
                border: 2px dashed #2563eb !important;
                border-radius: 18px !important;
                background: linear-gradient(135deg, #eff6ff, #f8fafc) !important;
                box-shadow: 0 12px 30px rgba(37,99,235,.12) !important;
                color: #1e293b !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
            }

            #nug-submission-demo * {
                box-sizing: border-box !important;
            }

            .nug-submission-demo-badge {
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                margin-bottom: 10px !important;
                padding: 6px 10px !important;
                border-radius: 999px !important;
                background: #dbeafe !important;
                color: #1d4ed8 !important;
                font-size: 12px !important;
                font-weight: 900 !important;
                letter-spacing: .02em !important;
            }

            .nug-submission-demo-head {
                display: flex !important;
                justify-content: space-between !important;
                gap: 12px !important;
                align-items: flex-start !important;
                flex-wrap: wrap !important;
            }

            .nug-submission-demo-head h3 {
                margin: 0 !important;
                color: #1e3a8a !important;
                font-size: 18px !important;
                line-height: 1.35 !important;
            }

            .nug-submission-demo-meta {
                margin: 7px 0 13px !important;
                color: #64748b !important;
                font-size: 13px !important;
                line-height: 1.5 !important;
            }

            .nug-submission-demo-question {
                margin: 12px 0 !important;
                padding: 13px !important;
                border-radius: 13px !important;
                background: rgba(255,255,255,.86) !important;
                border: 1px solid #bfdbfe !important;
                line-height: 1.55 !important;
            }

            #nug-submission-demo-answer {
                min-height: 86px !important;
                margin: 10px 0 12px !important;
                padding: 12px !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 12px !important;
                background: #fff !important;
                color: #334155 !important;
                font-size: 13px !important;
                line-height: 1.55 !important;
                white-space: pre-wrap !important;
            }

            #nug-submission-demo-files {
                display: grid !important;
                gap: 8px !important;
                margin: 10px 0 !important;
            }

            .nug-submission-demo-file {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 10px !important;
                padding: 9px 10px !important;
                border-radius: 10px !important;
                background: #fff !important;
                border: 1px solid #e2e8f0 !important;
                font-size: 12px !important;
            }

            .nug-submission-demo-file.is-rejected {
                border-color: #fecaca !important;
                background: #fff1f2 !important;
                color: #9f1239 !important;
            }

            #nug-submission-demo-alert {
                margin: 11px 0 !important;
                padding: 11px 12px !important;
                border-radius: 11px !important;
                font-size: 13px !important;
                font-weight: 750 !important;
                line-height: 1.5 !important;
            }

            #nug-submission-demo-alert[data-tone="info"] {
                background: #e0f2fe !important;
                color: #075985 !important;
                border: 1px solid #bae6fd !important;
            }

            #nug-submission-demo-alert[data-tone="warn"] {
                background: #fffbeb !important;
                color: #92400e !important;
                border: 1px solid #fde68a !important;
            }

            #nug-submission-demo-alert[data-tone="error"] {
                background: #fff1f2 !important;
                color: #9f1239 !important;
                border: 1px solid #fecdd3 !important;
            }

            #nug-submission-demo-alert[data-tone="success"] {
                background: #ecfdf5 !important;
                color: #065f46 !important;
                border: 1px solid #a7f3d0 !important;
            }

            #nug-submission-demo-submit {
                width: 100% !important;
                min-height: 43px !important;
                margin: 8px 0 0 !important;
                padding: 10px 14px !important;
                border: 0 !important;
                border-radius: 11px !important;
                background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
                color: #fff !important;
                font-weight: 900 !important;
                cursor: pointer !important;
            }

            #nug-submission-demo-submit[disabled] {
                opacity: .58 !important;
                cursor: not-allowed !important;
            }

            .nug-submission-demo-footnote {
                margin: 10px 0 0 !important;
                color: #64748b !important;
                font-size: 11px !important;
                line-height: 1.5 !important;
            }

            #nug-demo-review-entry {
                margin: 0 0 16px !important;
                padding: 18px !important;
                border: 2px dashed #8b5cf6 !important;
                border-radius: 16px !important;
                background: linear-gradient(135deg, #faf5ff, #eef2ff) !important;
                box-shadow: 0 10px 28px rgba(79,70,229,.12) !important;
                color: #25324a !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
            }

            #nug-demo-review-entry h4 {
                margin: 0 0 6px !important;
                color: #4f46e5 !important;
                font-size: 17px !important;
            }

            #nug-demo-review-entry p {
                margin: 0 0 12px !important;
                color: #64748b !important;
                line-height: 1.5 !important;
            }

            #nug-demo-review-entry button,
            #nug-demo-review-modal button {
                min-height: 44px !important;
                border: 0 !important;
                border-radius: 12px !important;
                padding: 11px 16px !important;
                background: linear-gradient(135deg, #6366f1, #7c3aed) !important;
                color: #fff !important;
                font: 850 14px/1.2 system-ui, sans-serif !important;
                cursor: pointer !important;
                box-shadow: 0 8px 20px rgba(79,70,229,.2) !important;
            }

            #nug-demo-review-modal {
                position: fixed !important;
                inset: 0 !important;
                z-index: ${MAX_Z_INDEX + 5} !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 16px !important;
                background: rgba(7,12,24,.58) !important;
                box-sizing: border-box !important;
            }

            .nug-demo-review-card {
                width: min(760px, calc(100vw - 32px)) !important;
                max-height: 90vh !important;
                overflow: auto !important;
                padding: 22px !important;
                border-radius: 18px !important;
                border-top: 6px solid #6366f1 !important;
                background: #fff !important;
                color: #263247 !important;
                box-shadow: 0 24px 70px rgba(0,0,0,.35) !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
            }

            .nug-demo-review-header {
                margin-bottom: 15px !important;
                padding-bottom: 12px !important;
                border-bottom: 1px solid #e2e8f0 !important;
            }

            .nug-demo-review-header h3 {
                margin: 0 0 6px !important;
                color: #4338ca !important;
            }

            .nug-demo-review-header p {
                margin: 0 !important;
                color: #64748b !important;
                line-height: 1.5 !important;
            }

            .nug-demo-review-question {
                margin: 0 0 12px !important;
                padding: 14px !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 13px !important;
                background: #f8fafc !important;
            }

            .nug-demo-review-question strong {
                display: block !important;
                margin-bottom: 8px !important;
                color: #172033 !important;
            }

            .nug-demo-review-question ul {
                margin: 0 !important;
                padding-left: 22px !important;
                color: #475569 !important;
                line-height: 1.65 !important;
            }

            .nug-demo-review-actions {
                position: sticky !important;
                bottom: -22px !important;
                display: flex !important;
                justify-content: flex-end !important;
                gap: 10px !important;
                margin: 18px -22px -22px !important;
                padding: 14px 22px !important;
                border-top: 1px solid #e2e8f0 !important;
                background: rgba(255,255,255,.98) !important;
            }

            .nug-demo-review-actions .is-secondary {
                background: #e2e8f0 !important;
                color: #334155 !important;
                box-shadow: none !important;
            }

            @media (max-width: 720px) {
                .nug-launcher {
                    top: calc(12px + env(safe-area-inset-top, 0px));
                    right: 12px;
                    width: 44px;
                    height: 44px;
                    font-size: 21px;
                }

                .nug-backdrop {
                    padding: 8px;
                    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
                    align-items: flex-end;
                }

                .nug-panel {
                    max-height: 94dvh;
                    border-radius: 22px 22px 12px 12px;
                }

                .nug-panel-header { padding: 20px 18px 15px; }
                .nug-demo-review-card { padding: 17px !important; max-height: 92dvh !important; }
                .nug-demo-review-actions {
                    bottom: -17px !important;
                    flex-direction: column !important;
                    margin: 16px -17px -17px !important;
                    padding: 12px 17px !important;
                }
                .nug-demo-review-actions button { width: 100% !important; }
                .nug-toolbar {
                    padding: 12px 18px !important;
                    grid-template-columns: minmax(0, 1fr) !important;
                    align-items: stretch !important;
                    gap: 10px !important;
                }
                .nug-search-wrap {
                    width: 100% !important;
                    min-width: 0 !important;
                }
                .nug-feature-list { padding: 14px 18px 22px; grid-template-columns: 1fr; }
                .nug-toolbar > .nug-primary-button {
                    width: 100% !important;
                    min-width: 0 !important;
                }
                .nug-card-actions {
                    display: grid !important;
                    grid-template-columns: 1fr !important;
                }
                .nug-card-button {
                    width: 100% !important;
                }

                /*
                 * Tooltip mobile là một thẻ nổi ở nửa đối diện mục đang tô sáng.
                 * JS sẽ đặt nó ở mép trên hoặc mép dưới để không che mục tiêu.
                 */
                .nug-tooltip {
                    width: calc(100vw - 20px);
                    max-width: none;
                    max-height: min(46dvh, 390px);
                    overflow-x: hidden;
                    overflow-y: auto;
                    overscroll-behavior: contain;
                    -webkit-overflow-scrolling: touch;
                    padding: 16px;
                    border-radius: 19px;
                }

                .nug-tooltip-title {
                    margin-top: 7px;
                    font-size: 20px;
                }

                .nug-tooltip-text,
                .nug-tooltip-access {
                    font-size: 13.5px;
                    line-height: 1.48;
                }

                .nug-tooltip-actions {
                    position: sticky;
                    bottom: -16px;
                    z-index: 2;
                    margin: 14px -2px -16px;
                    padding: 10px 2px 15px;
                    background: linear-gradient(to bottom, rgba(255,255,255,.88), #fff 28%);
                }

                .nug-tooltip-actions-left,
                .nug-tooltip-actions-right {
                    min-width: 0;
                }

                .nug-tooltip .nug-primary-button,
                .nug-tooltip .nug-secondary-button,
                .nug-tooltip .nug-text-button {
                    min-height: 46px;
                    margin: 0 !important;
                    touch-action: manipulation;
                }

                .nug-tooltip .nug-primary-button,
                .nug-tooltip .nug-secondary-button {
                    width: auto;
                    padding-left: 15px;
                    padding-right: 15px;
                }

                .nug-highlight {
                    border-width: 3px;
                    border-radius: 13px;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                #${ROOT_ID} *, #${ROOT_ID} *::before, #${ROOT_ID} *::after {
                    animation-duration: .01ms !important;
                    transition-duration: .01ms !important;
                    scroll-behavior: auto !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function buildInterface() {
        if (document.getElementById(ROOT_ID)) return;

        const root = createElement('div', { id: ROOT_ID });

        const launcher = createElement('button', {
            className: 'nug-launcher',
            type: 'button',
            text: '?',
            title: 'Mở hướng dẫn sử dụng',
            ariaLabel: 'Mở hướng dẫn sử dụng website'
        });
        launcher.dataset.nugAction = 'open';

        const backdrop = createElement('div', { className: 'nug-backdrop' });
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-labelledby', 'nug-main-title');

        const panel = createElement('section', { className: 'nug-panel' });
        const panelHeader = createElement('header', { className: 'nug-panel-header' });
        const eyebrow = createElement('span', {
            className: 'nug-eyebrow',
            text: `Hướng dẫn ${roleData[state.role].roleName}`
        });
        const title = createElement('h2', {
            id: 'nug-main-title',
            className: 'nug-title',
            text: roleData[state.role].welcomeTitle
        });
        const subtitle = createElement('p', {
            className: 'nug-subtitle',
            text: roleData[state.role].welcomeText
        });
        const closeButton = createElement('button', {
            className: 'nug-close',
            type: 'button',
            text: '×',
            ariaLabel: 'Đóng hướng dẫn'
        });
        closeButton.dataset.nugAction = 'close';

        panelHeader.append(eyebrow, title, subtitle, closeButton);

        const toolbar = createElement('div', { className: 'nug-toolbar' });
        const searchWrap = createElement('div', { className: 'nug-search-wrap' });
        const searchIcon = createElement('span', { className: 'nug-search-icon', text: '🔎' });
        searchIcon.setAttribute('aria-hidden', 'true');
        const searchInput = createElement('input', { className: 'nug-search' });
        searchInput.id = 'nug-search';
        searchInput.type = 'search';
        searchInput.placeholder = 'Tìm chức năng hoặc cách sử dụng...';
        searchInput.setAttribute('aria-label', 'Tìm chức năng hoặc cách sử dụng');
        searchInput.autocomplete = 'off';
        searchWrap.append(searchIcon, searchInput);

        const startButton = createElement('button', {
            className: 'nug-primary-button',
            type: 'button',
            text: '▶ Hướng dẫn từng bước'
        });
        startButton.dataset.nugAction = 'start';
        toolbar.append(searchWrap, startButton);

        const featureList = createElement('div', { className: 'nug-feature-list' });
        featureList.id = 'nug-feature-list';

        state.features.forEach(feature => {
            featureList.appendChild(createFeatureCard(feature));
        });

        const empty = createElement('div', {
            className: 'nug-empty',
            text: 'Không tìm thấy chức năng phù hợp. Hãy thử từ khóa khác.'
        });
        empty.id = 'nug-empty';
        featureList.appendChild(empty);

        panel.append(panelHeader, toolbar, featureList);
        backdrop.appendChild(panel);

        const tourLayer = buildTourLayer();
        const toast = createElement('div', { className: 'nug-toast' });
        toast.id = 'nug-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        root.append(launcher, backdrop, tourLayer, toast);
        document.body.appendChild(root);

        root.addEventListener('click', handleRootClick);
        searchInput.addEventListener('input', handleSearch);
        backdrop.addEventListener('click', event => {
            if (event.target !== backdrop) return;

            if (state.mandatoryMode) {
                showToast('Hướng dẫn bắt buộc chưa hoàn thành. Hãy bấm Tiếp theo.');
                return;
            }

            closePanel();
        });

        document.addEventListener('keydown', handleKeyboard);
        window.addEventListener('resize', scheduleTourPositionUpdate, { passive: true });
        window.addEventListener('orientationchange', scheduleTourPositionUpdate, { passive: true });
        window.addEventListener('scroll', scheduleTourPositionUpdate, { passive: true, capture: true });

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', scheduleTourPositionUpdate, { passive: true });
            window.visualViewport.addEventListener('scroll', scheduleTourPositionUpdate, { passive: true });
        }
    }

    function injectGuideVisibilitySetting() {
        const settingsTab = document.getElementById('tab-settings');

        if (
            !settingsTab ||
            document.getElementById('nugDetailedGuideSetting')
        ) {
            syncLauncherVisibilitySetting();
            return;
        }

        const settingCard = createElement('div', {
            className: 'card nug-guide-setting-card'
        });
        settingCard.id = 'nugDetailedGuideSetting';

        settingCard.innerHTML = `
            <div class="nug-setting-row">
                <div class="nug-setting-copy">
                    <strong class="nug-setting-title">
                        ❓ Hiển thị nút Hướng dẫn chi tiết
                    </strong>
                    <span class="nug-setting-description">
                        Ẩn hoặc hiện nút dấu hỏi nổi ở góc màn hình. Việc tắt nút không xóa tiến độ hay dữ liệu hướng dẫn.
                    </span>
                    <span id="nugDetailedGuideStatus" class="nug-setting-status"></span>
                </div>

                <label class="nug-setting-switch" title="Ẩn hoặc hiện nút Hướng dẫn chi tiết">
                    <input
                        type="checkbox"
                        id="nugDetailedGuideToggle"
                        aria-label="Hiển thị nút Hướng dẫn chi tiết"
                    >
                    <span class="nug-setting-slider" aria-hidden="true"></span>
                </label>
            </div>
        `;

        const firstCard = settingsTab.querySelector('.card');

        if (firstCard) {
            settingsTab.insertBefore(
                settingCard,
                firstCard
            );
        } else {
            settingsTab.appendChild(settingCard);
        }

        document.getElementById(
            'nugDetailedGuideToggle'
        )?.addEventListener('change', event => {
            toggleDetailedGuideLauncher(
                event.currentTarget.checked
            );
        });

        syncLauncherVisibilitySetting();
    }

    function createFeatureCard(feature) {
        const card = createElement('article', { className: 'nug-card' });
        card.dataset.featureId = feature.id;
        card.dataset.search = normalizeText(
            `${feature.title} ${feature.description} ${feature.access} ${(feature.details || []).join(' ')}`
        );

        const icon = createElement('div', {
            className: 'nug-card-icon',
            text: feature.icon
        });
        icon.setAttribute('aria-hidden', 'true');

        const content = createElement('div');
        const title = createElement('h3', {
            className: 'nug-card-title',
            text: feature.title
        });
        const description = createElement('p', {
            className: 'nug-card-description',
            text: feature.description
        });
        const access = createElement('p', {
            className: 'nug-access',
            text: `Cách truy cập: ${feature.access}`
        });
        content.append(title, description, access);

        if (Array.isArray(feature.details) && feature.details.length) {
            const list = createElement('ul', { className: 'nug-detail-list' });
            feature.details.forEach(detail => {
                list.appendChild(createElement('li', { text: detail }));
            });
            content.appendChild(list);
        }

        const actions = createElement('div', { className: 'nug-card-actions' });

        const tourButton = createElement('button', {
            className: 'nug-card-button is-tour',
            type: 'button',
            text: '▶ Hướng dẫn mục này'
        });
        tourButton.dataset.nugAction = 'start-feature';
        tourButton.dataset.featureId = feature.id;

        const goButton = createElement('button', {
            className: 'nug-card-button',
            type: 'button',
            text: 'Đi tới chức năng →'
        });
        goButton.dataset.nugAction = 'goto';
        goButton.dataset.featureId = feature.id;
        actions.append(tourButton, goButton);

        card.append(icon, content, actions);
        return card;
    }

    function buildTourLayer() {
        const layer = createElement('div', { className: 'nug-tour-layer' });
        layer.id = 'nug-tour-layer';
        layer.setAttribute('aria-hidden', 'true');

        ['top', 'right', 'bottom', 'left'].forEach(side => {
            const mask = createElement('div', { className: `nug-mask nug-mask-${side}` });
            mask.dataset.mask = side;
            layer.appendChild(mask);
        });

        const mandatoryShield = createElement('div', {
            className: 'nug-mandatory-shield'
        });
        mandatoryShield.id = 'nug-mandatory-shield';
        mandatoryShield.setAttribute('aria-hidden', 'true');

        const highlight = createElement('div', { className: 'nug-highlight' });
        highlight.id = 'nug-highlight';

        const tooltip = createElement('section', { className: 'nug-tooltip' });
        tooltip.id = 'nug-tooltip';
        tooltip.setAttribute('role', 'dialog');
        tooltip.setAttribute('aria-modal', 'true');
        tooltip.setAttribute('aria-labelledby', 'nug-tooltip-title');

        const count = createElement('div', { className: 'nug-step-count' });
        count.id = 'nug-step-count';
        const title = createElement('h2', {
            className: 'nug-tooltip-title',
            id: 'nug-tooltip-title'
        });
        const text = createElement('p', {
            className: 'nug-tooltip-text',
            id: 'nug-tooltip-text'
        });
        const access = createElement('p', {
            className: 'nug-tooltip-access',
            id: 'nug-tooltip-access'
        });

        const progress = createElement('div', { className: 'nug-progress' });
        const progressBar = createElement('div', { className: 'nug-progress-bar' });
        progressBar.id = 'nug-progress-bar';
        progress.appendChild(progressBar);

        const actions = createElement('div', { className: 'nug-tooltip-actions' });
        const leftActions = createElement('div', { className: 'nug-tooltip-actions-left' });
        const skipButton = createElement('button', {
            className: 'nug-text-button',
            type: 'button',
            text: 'Bỏ qua'
        });
        skipButton.dataset.nugAction = 'end-tour';
        leftActions.appendChild(skipButton);

        const rightActions = createElement('div', { className: 'nug-tooltip-actions-right' });
        const previousButton = createElement('button', {
            className: 'nug-secondary-button',
            type: 'button',
            text: '← Trước'
        });
        previousButton.id = 'nug-previous';
        previousButton.dataset.nugAction = 'previous';
        const nextButton = createElement('button', {
            className: 'nug-primary-button',
            type: 'button',
            text: 'Tiếp theo →'
        });
        nextButton.id = 'nug-next';
        nextButton.dataset.nugAction = 'next';
        rightActions.append(previousButton, nextButton);

        actions.append(leftActions, rightActions);
        tooltip.append(count, title, text, access, progress, actions);
        layer.append(mandatoryShield, highlight, tooltip);

        return layer;
    }

    function handleRootClick(event) {
        const actionElement = event.target.closest('[data-nug-action]');
        if (!actionElement) return;

        const action = actionElement.dataset.nugAction;

        if (
            (state.mandatoryMode || state.mandatoryStartPending) &&
            ['open', 'close', 'start', 'start-feature', 'goto', 'previous', 'end-tour']
                .includes(action)
        ) {
            showToast('Hướng dẫn bắt buộc: chỉ có thể bấm Tiếp theo.');
            return;
        }

        if (action === 'open') openPanel();
        if (action === 'close') closePanel();
        if (action === 'start') startTour();
        if (action === 'start-feature') startFeatureTour(actionElement.dataset.featureId);
        if (action === 'goto') goToFeature(actionElement.dataset.featureId);
        if (action === 'previous') showTourStep(state.currentStep - 1);
        if (action === 'next') showTourStep(state.currentStep + 1);
        if (action === 'end-tour') endTour(true);
    }

    function handleSearch(event) {
        const keyword = normalizeText(event.target.value);
        const cards = [...document.querySelectorAll('.nug-card[data-feature-id]')];
        let visibleCount = 0;

        cards.forEach(card => {
            const isVisible = !keyword || card.dataset.search.includes(keyword);
            card.hidden = !isVisible;
            if (isVisible) visibleCount += 1;
        });

        document.getElementById('nug-empty')?.classList.toggle('is-visible', visibleCount === 0);
    }

    function handleKeyboard(event) {
        const panelOpen = document.querySelector('.nug-backdrop.is-open');
        const tourOpen = document.querySelector('.nug-tour-layer.is-open');

        /*
         * Khi hướng dẫn đang nhường chỗ cho quà đăng nhập, thông báo
         * hoặc khảo sát thì không chiếm phím Enter/Esc của cửa sổ đó.
         */
        if (state.mandatorySuspended) return;

        if (event.key === 'Escape') {
            if (state.mandatoryMode) {
                event.preventDefault();
                showToast('Không thể đóng khi hướng dẫn bắt buộc chưa hoàn thành.');
                return;
            }

            if (tourOpen) endTour(true);
            else if (panelOpen) closePanel();
            return;
        }

        if (!tourOpen) return;

        if (event.key === 'ArrowRight' || event.key === 'Enter') {
            event.preventDefault();
            showTourStep(state.currentStep + 1);
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();

            if (state.mandatoryMode) {
                showToast('Hướng dẫn bắt buộc không cho quay lại bước trước.');
                return;
            }

            showTourStep(state.currentStep - 1);
        }
    }

    function openPanel(options = {}) {
        if (state.mandatoryMode || state.mandatoryStartPending) {
            showToast(
                state.mandatoryStartPending
                    ? 'Hãy xử lý xong quà đăng nhập, thông báo hoặc khảo sát trước.'
                    : 'Hãy hoàn thành hướng dẫn bắt buộc trước.'
            );
            return false;
        }

        endTour(false);

        const backdrop = document.querySelector('.nug-backdrop');
        if (!backdrop) return;

        state.previousFocus = document.activeElement;
        backdrop.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        if (options.markSeen !== false) markAsSeen();

        requestAnimationFrame(() => {
            const search = document.getElementById('nug-search');
            if (search) search.focus({ preventScroll: true });
        });
    }

    function closePanel(options = {}) {
        if (state.mandatoryMode && options.force !== true) {
            showToast('Hướng dẫn bắt buộc chưa hoàn thành.');
            return false;
        }

        const backdrop = document.querySelector('.nug-backdrop');
        if (!backdrop) return;

        backdrop.classList.remove('is-open');
        document.body.style.overflow = '';

        if (options.markSeen !== false) {
            markAsSeen();
        }

        if (state.previousFocus && typeof state.previousFocus.focus === 'function') {
            state.previousFocus.focus({ preventScroll: true });
        }
    }

    function runIfFunction(name, ...args) {
        if (typeof window[name] === 'function') {
            try {
                return window[name](...args);
            } catch (_) {
                return false;
            }
        }
        return false;
    }

    function teacherTourSteps() {
        return [
            { featureId: 'create-assignment', tabId: 'tab-create', title: 'Mở mục Giao bài tập mới', description: 'Đây là nơi tạo bài tự luận, trắc nghiệm hoặc bài kết hợp.', access: 'Bấm Tiếp theo để xem lần lượt các vùng cần nhập.' },
            { featureId: 'create-assignment', tabId: 'tab-create', selector: '#assessmentType', title: '1. Chọn loại hình kiểm tra', description: 'Chọn dạng bài. Khi dùng bài kết hợp, hệ thống có thể hiện thêm phần phân bố điểm trắc nghiệm và tự luận.', access: 'Chọn đúng loại trước khi nhập câu hỏi.' },
            { featureId: 'create-assignment', tabId: 'tab-create', selector: '#title', title: '2. Nhập tiêu đề bài', description: 'Tiêu đề giúp học sinh nhận biết bài cần làm và giúp giáo viên tìm lại bài đã giao.', access: 'Nhập tên môn, bài hoặc nội dung kiểm tra rõ ràng.' },
            { featureId: 'create-assignment', tabId: 'tab-create', selector: ['#targetStudent_displayText', '#targetStudent'], title: '3. Chọn học sinh nhận bài', description: 'Có thể giao chung hoặc chọn học sinh cụ thể. Kiểm tra kỹ danh sách trước khi phát hành.', access: 'Mở ô chọn và đánh dấu người nhận.' },
            { featureId: 'create-assignment', tabId: 'tab-create', selector: '#quickImportText', title: '4. Dán câu hỏi để nhập nhanh', description: 'Dán nhiều câu trắc nghiệm vào đây theo định dạng Câu 1, A, B, C, D.', access: 'Sau khi dán, bấm nút Tự động bóc tách câu hỏi.' },
            { featureId: 'create-assignment', tabId: 'tab-create', selector: '#quickImportButton', title: '5. Tự động bóc tách', description: 'Hệ thống tạo các ô câu hỏi và đáp án từ nội dung vừa dán. Sau đó cần kiểm tra lại đáp án đúng.', access: 'Bấm một lần rồi xem vùng Phần Trắc Nghiệm.' },
            { featureId: 'create-assignment', tabId: 'tab-create', selector: '#questionsContainer', title: '6. Kiểm tra từng câu hỏi', description: 'Sửa nội dung, đáp án và chọn đáp án đúng. Có thể thêm câu thủ công bằng nút Thêm câu hỏi trắc nghiệm.', access: 'Không phát hành trước khi kiểm tra toàn bộ câu.' },
            { featureId: 'create-assignment', tabId: 'tab-create', selector: '#enableRandomExam', title: '7. Tạo nhiều mã đề', description: 'Bật tùy chọn này để chọn số mã đề, số câu và cách xáo trộn câu hoặc đáp án.', access: 'Dùng nút Xem thử các mã đề trước khi phát hành.' },
            { featureId: 'create-assignment', tabId: 'tab-create', selector: ['#videoLink', '#fileInput'], title: '8. Đính kèm học liệu', description: 'Có thể thêm video YouTube hoặc tệp tài liệu. Với bài tự luận, giáo viên còn có thể chỉ cho phép học sinh nộp bằng tệp.', access: 'Tệp lớn cần chờ tải xong trước khi phát hành.' },
            { featureId: 'create-assignment', tabId: 'tab-create', selector: '#enableExamTimeLimit', title: '9. Giới hạn thời gian làm bài', description: 'Bật khi đây là bài kiểm tra có thời lượng. Nhập số phút phù hợp.', access: 'Thời gian làm bài khác với hạn nộp.' },
            { featureId: 'create-assignment', tabId: 'tab-create', selector: 'button[onclick*="createAssignment"]', title: '10. Phát hành bài tập', description: 'Bấm sau khi đã kiểm tra tiêu đề, người nhận, câu hỏi, đáp án, thời gian và tệp.', access: 'Sau khi phát hành, xem lại trong Bài tập đã giao.' },

            { featureId: 'assigned', tabId: 'tab-assigned', title: 'Mở mục Bài tập đã giao', description: 'Mục này hiển thị các bài đã phát hành.', access: 'Dùng tìm kiếm và bộ lọc để thu hẹp danh sách.' },
            { featureId: 'assigned', tabId: 'tab-assigned', selector: '#searchAssigned', title: 'Tìm bài đã giao', description: 'Nhập tên bài hoặc loại hình để tìm nhanh.', access: 'Xóa từ khóa để hiện lại toàn bộ.' },
            { featureId: 'assigned', tabId: 'tab-assigned', selector: '#assignedStudentFilterContainer', title: 'Lọc theo học sinh', description: 'Chọn Tất cả hoặc một học sinh để chỉ xem bài liên quan.', access: 'Bộ lọc không sửa dữ liệu bài.' },
            { featureId: 'assigned', tabId: 'tab-assigned', selector: '#assignedListContainer', title: 'Danh sách bài đã giao', description: 'Các nút thao tác của từng bài nằm trong danh sách này. Đọc kỹ trạng thái trước khi sửa hoặc xóa.', access: 'Nếu chưa thấy dữ liệu, chờ hệ thống tải hoặc đổi bộ lọc.' },

            { featureId: 'submissions', tabId: 'tab-list', title: 'Mở mục Bài đã nộp', description: 'Theo dõi bài học sinh đã gửi và tiến hành chấm.', access: 'Mỗi bài nộp gắn với học sinh và bài tập tương ứng.' },
            { featureId: 'submissions', tabId: 'tab-list', selector: '#searchSubmissions', title: 'Tìm bài nộp', description: 'Nhập tên bài để tìm nhanh trong danh sách.', access: 'Kết hợp với bộ lọc học sinh khi lớp có nhiều bài.' },
            { featureId: 'submissions', tabId: 'tab-list', selector: '#submittedStudentFilterContainer', title: 'Lọc người nộp', description: 'Chọn học sinh cần kiểm tra hoặc chọn Tất cả.', access: 'Bộ lọc giúp tránh chấm nhầm người.' },
            { featureId: 'submissions', tabId: 'tab-list', selector: '#submissionsList', title: 'Mở và chấm bài', description: 'Trong từng thẻ bài nộp, giáo viên có thể đọc nội dung, mở tệp, nhập điểm và nhận xét theo các nút đang hiển thị.', access: 'Kiểm tra đúng học sinh và đúng bài trước khi lưu điểm.' },

            { featureId: 'materials', tabId: 'tab-materials', title: 'Mở mục Tài liệu học tập', description: 'Đăng bài giảng, tệp hoặc đường dẫn cho học sinh.', access: 'Bấm Tiếp theo để xem nút thêm và danh sách.' },
            { featureId: 'materials', tabId: 'tab-materials', selector: 'button[onclick*="openMaterialModal"]', title: 'Thêm tài liệu mới', description: 'Mở biểu mẫu, nhập tên, nội dung hoặc đường dẫn, đính kèm tệp và chọn người nhận.', access: 'Kiểm tra người nhận trước khi lưu.' },
            { featureId: 'materials', tabId: 'tab-materials', selector: '#searchMaterials', title: 'Tìm tài liệu', description: 'Tìm theo tên hoặc nội dung tài liệu.', access: 'Dùng khi danh sách đã dài.' },
            { featureId: 'materials', tabId: 'tab-materials', selector: '#teacherMaterialsContainer', title: 'Quản lý tài liệu đã đăng', description: 'Xem các tài liệu hiện có và dùng các nút thao tác trên từng tài liệu.', access: 'Nếu tài liệu giao riêng, bộ lọc học sinh giúp kiểm tra người nhận.' },

            { featureId: 'question-bank', tabId: 'tab-question-bank', title: 'Mở Ngân hàng câu hỏi', description: 'Lưu câu hỏi để tái sử dụng trong nhiều bài.', access: 'Phân loại càng rõ thì tìm lại càng nhanh.' },
            { featureId: 'question-bank', tabId: 'tab-question-bank', selector: 'button[onclick*="importQuestionsFromAssignmentsToBank"]', title: 'Nhập câu hỏi từ bài cũ', description: 'Sao chép câu hỏi đã từng sử dụng vào ngân hàng.', access: 'Kiểm tra lại phân loại và đáp án sau khi nhập.' },
            { featureId: 'question-bank', tabId: 'tab-question-bank', selector: ['#qbSubject', '#qbGrade', '#qbLesson'], title: 'Phân loại câu hỏi', description: 'Nhập môn, lớp, bài và chọn mức độ. Đây là dữ liệu dùng để lọc và tạo đề.', access: 'Dùng cách ghi thống nhất giữa các câu.' },
            { featureId: 'question-bank', tabId: 'tab-question-bank', selector: '#qbText', title: 'Nhập nội dung và đáp án', description: 'Nhập câu hỏi, bốn lựa chọn, đáp án đúng và lời giải nếu cần.', access: 'Không để trống đáp án đúng.' },
            { featureId: 'question-bank', tabId: 'tab-question-bank', selector: 'button[onclick*="saveQuestionBankItem"]', title: 'Lưu câu hỏi', description: 'Bấm Lưu câu hỏi để thêm mới hoặc cập nhật câu đang sửa.', access: 'Dùng Làm mới để xóa biểu mẫu trước khi tạo câu khác.' },
            { featureId: 'question-bank', tabId: 'tab-question-bank', selector: '#questionBankList', title: 'Danh sách và bộ lọc', description: 'Tìm theo nội dung hoặc lọc theo môn, lớp, bài, mức độ.', access: 'Có thể đổi số câu hiển thị mỗi trang.' },
            { featureId: 'question-bank', tabId: 'tab-question-bank', selector: '#questionBankStats', title: 'Thống kê câu sai nhiều', description: 'Bấm Tính lại thống kê để xem câu nào nhiều học sinh trả lời sai.', access: 'Dùng kết quả để ôn tập hoặc điều chỉnh cách dạy.' },

            { featureId: 'students', tabId: 'tab-manage-students', title: 'Mở Quản lý học sinh', description: 'Tạo và quản lý tài khoản học sinh.', access: 'Bấm Tiếp theo để xem các vùng chính.' },
            { featureId: 'students', tabId: 'tab-manage-students', selector: 'button[onclick*="openStudentModal"]', title: 'Thêm học sinh mới', description: 'Mở biểu mẫu tạo tài khoản. Nhập đúng tên, tài khoản, lớp và thông tin cần thiết.', access: 'Không dùng trùng tên đăng nhập.' },
            { featureId: 'students', tabId: 'tab-manage-students', selector: '#requestsCard', title: 'Yêu cầu đổi thông tin', description: 'Các yêu cầu học sinh gửi sẽ xuất hiện tại đây để giáo viên duyệt hoặc từ chối.', access: 'Đọc nội dung thay đổi trước khi duyệt.' },
            { featureId: 'students', tabId: 'tab-manage-students', selector: '#studentsListContainer', title: 'Danh sách tài khoản', description: 'Tìm và kiểm tra tài khoản của lớp trong vùng này.', access: 'Các thao tác nhạy cảm cần kiểm tra đúng học sinh.' },

            { featureId: 'transactions', tabId: 'tab-transactions', title: 'Mở Nhật ký giao dịch', description: 'Cộng hoặc trừ Coin có lưu lịch sử người thực hiện.', access: 'Không sửa trực tiếp Firebase khi có thể dùng mục này.' },
            { featureId: 'transactions', tabId: 'tab-transactions', selector: '#txCoinStudent', title: '1. Chọn học sinh', description: 'Chọn đúng tài khoản cần điều chỉnh Coin.', access: 'Kiểm tra tên trước khi xác nhận.' },
            { featureId: 'transactions', tabId: 'tab-transactions', selector: '#txCoinDelta', title: '2. Nhập số Coin', description: 'Số dương là cộng Coin; số âm là trừ Coin.', access: 'Ví dụ 50 để cộng, -20 để trừ.' },
            { featureId: 'transactions', tabId: 'tab-transactions', selector: '#txCoinReason', title: '3. Ghi lý do', description: 'Lý do sẽ được lưu trong nhật ký để kiểm tra về sau.', access: 'Ghi rõ thưởng, điều chỉnh lỗi hoặc hình thức xử lý.' },
            { featureId: 'transactions', tabId: 'tab-transactions', selector: 'button[onclick*="adjustCoinFromTeacher"]', title: '4. Xác nhận giao dịch', description: 'Chỉ bấm sau khi đã kiểm tra học sinh, số Coin và lý do.', access: 'Giao dịch thành công sẽ xuất hiện trong lịch sử.' },
            { featureId: 'transactions', tabId: 'tab-transactions', selector: '#transactionLogList', title: '5. Tìm, lọc và hoàn tác', description: 'Dùng ô tìm kiếm và bộ lọc. Nếu một giao dịch hỗ trợ hoàn tác, nút Hoàn tác sẽ nằm trên dòng lịch sử tương ứng.', access: 'Hoàn tác thay vì tự sửa dữ liệu cũ.' },

            { featureId: 'roadmap', tabId: 'tab-roadmap', title: 'Mở Lộ trình & Lịch', description: 'Mục này có hai chế độ: lộ trình học tập và thời khóa biểu.', access: 'Hai nút phía trên dùng để chuyển chế độ.' },
            { featureId: 'roadmap', tabId: 'tab-roadmap', selector: '#roadmapStudentSelect', before: () => runIfFunction('toggleRoadmapView', 'roadmap'), title: 'Xem lộ trình theo học sinh', description: 'Chọn học sinh để xem dữ liệu lộ trình tương ứng.', access: 'Nút Tải PDF xuất nội dung đang hiển thị.' },
            { featureId: 'roadmap', tabId: 'tab-roadmap', selector: '#btnSubSchedule', title: 'Chuyển sang thời khóa biểu', description: 'Bấm Thời khóa biểu để xem lịch học của lớp hoặc lịch giao riêng.', access: 'Hướng dẫn sẽ tự mở chế độ lịch ở bước tiếp theo.' },
            { featureId: 'roadmap', tabId: 'tab-roadmap', selector: 'button[onclick*="openScheduleModal"]', before: () => runIfFunction('toggleRoadmapView', 'schedule'), title: 'Thêm lịch học', description: 'Mở biểu mẫu, nhập thứ/ngày, thời gian, môn hoặc nội dung, ghi chú và người nhận.', access: 'Có thể tạo lịch chung hoặc giao riêng.' },
            { featureId: 'roadmap', tabId: 'tab-roadmap', selector: '#teacherScheduleBody', before: () => runIfFunction('toggleRoadmapView', 'schedule'), title: 'Quản lý lịch đã tạo', description: 'Lịch hiện có nằm trong bảng này. Dùng nút sửa hoặc xóa trên từng dòng.', access: 'Kiểm tra nhãn lịch chung hoặc giao riêng.' },

            { featureId: 'game-management', tabId: 'tab-game-manage', title: 'Mở Quản lý trò chơi', description: 'Các nhóm thiết lập có thể thu gọn hoặc mở rộng.', access: 'Hướng dẫn sẽ giới thiệu các nhóm quan trọng.' },
            { featureId: 'game-management', tabId: 'tab-game-manage', selector: '#gameToggle', title: 'Khóa hoặc mở khu trò chơi', description: 'Tắt để học sinh không vào trò chơi. Có thể nhập lời nhắn giải thích lý do khóa.', access: 'Sau khi đổi trạng thái, lưu thông báo khóa nếu có.' },
            { featureId: 'game-management', tabId: 'tab-game-manage', selector: '#probMiss', title: 'Tỉ lệ vòng quay', description: 'Điều chỉnh tỉ lệ trượt và các phần thưởng. Tổng tỉ lệ cần hợp lệ trước khi lưu.', access: 'Dùng nút Lưu cấu hình tỉ lệ.' },
            { featureId: 'game-management', tabId: 'tab-game-manage', selector: '#ticketStudentSelect', title: 'Quản lý vé quay', description: 'Chọn học sinh, nhập số vé rồi dùng nút Cộng thêm hoặc Trừ bớt.', access: 'Kiểm tra số vé hiện tại trước khi sửa.' },
            { featureId: 'game-management', tabId: 'tab-game-manage', selector: '#storeToggle', title: 'Khóa hoặc mở cửa hàng', description: 'Công tắc này quyết định học sinh có được truy cập cửa hàng hay không.', access: 'Bên dưới có vùng chỉnh giá và thời gian mở bán từng món.' },
            { featureId: 'game-management', tabId: 'tab-game-manage', selector: '#editStoreItemId', title: 'Chỉnh vật phẩm cửa hàng', description: 'Chọn vật phẩm, nhập giá mới và thời gian mở/đóng bán rồi lưu thay đổi.', access: 'Kiểm tra đúng vật phẩm trước khi lưu.' },
            { featureId: 'game-management', tabId: 'tab-game-manage', selector: '#btnToggleRoyalStatus', title: 'Quản lý Dạ hội Hoàng gia', description: 'Khóa/mở sự kiện, chỉnh tỉ lệ nhận Coin hoặc vật phẩm và đặt lịch diễn ra.', access: 'Lưu cấu hình sau khi chỉnh.' },
            { featureId: 'game-management', tabId: 'tab-game-manage', selector: '#lbToggle', title: 'Bảng xếp hạng và phần thưởng', description: 'Bật/tắt bảng xếp hạng, đặt phần thưởng hạng và tỉ lệ rương.', access: 'Kiểm tra mùa hiện tại trước khi lưu.' },

            { featureId: 'system-update', tabId: 'tab-settings', selector: '#updateBannerArea', title: '1. Xem trạng thái cập nhật', description: 'Thẻ Cập nhật hệ thống cho biết phiên bản đang chạy, phiên bản mới nhất, lần kiểm tra gần nhất và trạng thái kết nối với máy chủ cập nhật.', access: 'Hệ thống có thể tự kiểm tra; dùng Kiểm tra lại khi cần kiểm tra ngay.' },
            { featureId: 'system-update', tabId: 'tab-settings', selector: '#updateBannerArea [data-update-action="check"]', skipIfMissing: true, title: '2. Kiểm tra lại', description: 'Bấm Kiểm tra lại để đối chiếu phiên bản ngay với máy chủ. Nếu đang ngoại tuyến, hãy kết nối Internet rồi thử lại.', access: 'Không cần bấm liên tục; chờ trạng thái Đã mới nhất hoặc Có bản mới.' },
            { featureId: 'system-update', tabId: 'tab-settings', selector: '#updateBannerArea [data-update-action="details"]', skipIfMissing: true, title: '3. Xem chi tiết bản mới', description: 'Khi có bản mới, nút Chi tiết mở ghi chú thay đổi, số build, ngày phát hành và kênh phát hành nếu máy chủ cung cấp.', access: 'Nên đọc phần Có gì mới trước khi cập nhật.' },
            { featureId: 'system-update', tabId: 'tab-settings', selector: '#updateBannerArea [data-update-action="apply"]', skipIfMissing: true, title: '4. Cập nhật ngay', description: 'Bấm Cập nhật ngay để hệ thống làm mới tài nguyên/cache và chuyển sang phiên bản mới. Trong lúc có thanh tiến trình, không đóng, tải lại hoặc rời trang.', access: 'Nếu là cập nhật bắt buộc sẽ không có lựa chọn Để sau.' },
            { featureId: 'system-update', tabId: 'tab-settings', selector: '#updateBannerArea', title: '5. Khi kiểm tra hoặc cập nhật gặp lỗi', description: 'Ngoại tuyến: kiểm tra Internet. Không kiểm tra được: chờ kết nối ổn định rồi bấm Kiểm tra lại. Cập nhật chưa hoàn tất: đọc thông báo lỗi và thử lại sau khi kết nối ổn định.', access: 'Sau cập nhật, website sẽ tải lại và báo kết quả phiên bản.' },

            { featureId: 'effects-performance', tabId: 'tab-settings', selector: '#effectQualitySettingsRow', skipIfMissing: true, title: '1. Mức hiệu ứng vật phẩm & web', description: 'Tùy chọn này chỉ điều chỉnh chuyển động, hạt và lớp trang trí của hiệu ứng vật phẩm, thú cưng và Web Animations. Nó không đổi theme, dữ liệu hay chức năng.', access: 'Bật công tắc nếu muốn tự chọn mức Cao, Trung bình hoặc Thấp.' },
            { featureId: 'effects-performance', tabId: 'tab-settings', selector: '#toggleEffectQualityManager', skipIfMissing: true, title: '2. Bật điều chỉnh chất lượng hiệu ứng', description: 'Khi tắt, website giữ hiệu ứng gốc. Khi bật, mức Cao giữ đầy đủ hiệu ứng; Trung bình giảm một phần; Thấp giảm mạnh để ưu tiên độ ổn định.', access: 'Nếu thiết bị giật, hãy thử Trung bình rồi Thấp.' },
            { featureId: 'effects-performance', tabId: 'tab-settings', selector: ['#effectQualityLevelControls:not([hidden])', '#effectQualitySettingsRow'], skipIfMissing: true, title: '3. Chọn Cao / Trung bình / Thấp', description: 'Cao = đầy đủ hiệu ứng. Trung bình = giảm hạt/lớp phụ và tần suất sinh hiệu ứng. Thấp = ưu tiên ổn định, giảm mạnh phần trang trí động.', access: 'Đây là cài đặt hiển thị; không làm mất vật phẩm đang sở hữu.' },
            { featureId: 'effects-performance', tabId: 'tab-settings', selector: '#webPerformanceOptimizerSettingsRow', skipIfMissing: true, title: '4. Tối ưu hiệu năng', description: 'Tối ưu hiệu năng là chức năng riêng: giảm tải nền, blur và nội dung hiển thị nặng mà không sửa điểm, dữ liệu, trò chơi hay vật phẩm. Trên thiết bị mobile nhỏ, hệ thống có thể tự bật ở lần đầu; máy tính giữ lựa chọn người dùng.', access: 'Phía giáo viên dùng chế độ cân bằng để giảm tải khi trang quản lý có nhiều nội dung.' },
            { featureId: 'effects-performance', tabId: 'tab-settings', selector: '#toggleWebPerformanceOptimizer', skipIfMissing: true, title: '5. Khi nào nên bật?', description: 'Nên bật khi cuộn trang bị giật, máy nóng hoặc nhiều nội dung làm trình duyệt chậm. Có thể dùng cùng Mức hiệu ứng: bật tối ưu và chọn Trung bình/Thấp nếu cần nhẹ hơn nữa.', access: 'Dòng trạng thái dưới công tắc cho biết tối ưu đang bật, tắt hoặc đang hỗ trợ thêm.' },

            { featureId: 'settings', tabId: 'tab-settings', title: 'Mở Cài đặt và công cụ', description: 'Mục này chứa tài khoản, hệ thống, thông báo, khảo sát và quà.', access: 'Bấm Tiếp theo để xem từng nhóm.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#nugDetailedGuideSetting', title: 'Ẩn hoặc hiện nút Hướng dẫn chi tiết', description: 'Công tắc này điều khiển nút dấu hỏi nổi ở góc màn hình. Tắt nút không xóa nội dung, tiến độ hay trạng thái đã hoàn thành hướng dẫn.', access: 'Sau khi ẩn, có thể vào lại Cài đặt để bật nút bất cứ lúc nào.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#themeSelector', title: 'Cài đặt tài khoản', description: 'Đổi giao diện, tên hiển thị hoặc mật khẩu rồi bấm Lưu thay đổi tài khoản.', access: 'Để trống mật khẩu nếu không muốn đổi.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#toggleConversionTable', title: 'Bật bảng quy đổi', description: 'Quyết định học sinh có được mở bảng quy đổi Coin và tiền tích lũy hay không.', access: 'Tắt chức năng sẽ đóng bảng đang mở ở phía học sinh.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#teacherCashRequestsSection', title: 'Yêu cầu lấy tiền mặt', description: 'Xem và xử lý các yêu cầu rút tiền do học sinh gửi.', access: 'Kiểm tra số tiền và trạng thái trước khi duyệt.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: 'button[onclick*="runSystemDiagnostics"]', title: 'Quét lỗi hệ thống', description: 'Chạy kiểm tra khi website có dấu hiệu lỗi hoặc dữ liệu không tải.', access: 'Đọc kết quả chẩn đoán trước khi sửa.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#notificationToggle', title: 'Gửi thông báo toàn trường', description: 'Bật nhóm thông báo, nhập nội dung rồi bấm Gửi thông báo ngay.', access: 'Thông báo nên ngắn, rõ và có thời gian cụ thể.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#surveyToggle', title: 'Tạo khảo sát', description: 'Bật khảo sát, nhập tiêu đề, thêm câu trắc nghiệm hoặc câu trả lời chữ rồi phát hành.', access: 'Kiểm tra toàn bộ câu trước khi gửi.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#giftToggle', title: 'Gửi thư và quà', description: 'Chọn học sinh, nhập lời nhắn và loại quà. Có thể gửi Coin, vật phẩm hoặc thẻ giảm giá có phạm vi và hạn dùng.', access: 'Khi chọn thẻ giảm giá, kiểm tra phần trăm, vật phẩm áp dụng và ngày hết hạn.' }
        ];
    }

    function ensureDemoCheckout() {
        removeDemoCheckout();

        const modal = createElement('div', { className: 'nug-demo-checkout', id: 'nug-demo-checkout' });
        modal.innerHTML = `
            <div class="nug-demo-checkout-card">
                <h3>🛒 Thanh toán mẫu</h3>
                <div class="nug-demo-row"><strong>Vật phẩm:</strong><span>Giao diện mẫu</span></div>
                <div class="nug-demo-row"><strong>Số dư:</strong><span>500 🪙</span></div>
                <label for="nug-demo-discount"><strong>🏷️ Chọn thẻ giảm giá:</strong></label>
                <select id="nug-demo-discount">
                    <option value="0">-- Không dùng mã giảm giá --</option>
                    <option value="10">Giảm 10%</option>
                    <option value="25">Giảm 25%</option>
                    <option value="50">Giảm 50%</option>
                </select>
                <div class="nug-demo-summary">
                    <div class="nug-demo-row"><span>Giá gốc:</span><strong>200 🪙</strong></div>
                    <div class="nug-demo-row"><span>Mã giảm giá:</span><strong id="nug-demo-minus">- 0 🪙</strong></div>
                    <div id="nug-demo-total" class="nug-demo-total">200 🪙</div>
                </div>
                <button id="nug-demo-confirm" class="nug-demo-confirm" type="button">💳 Xác nhận mua</button>
                <p class="nug-demo-note">Đây là bảng mô phỏng để học cách áp mã. Bấm nút này không trừ Coin và không mua vật phẩm.</p>
            </div>
        `;

        document.body.appendChild(modal);
        const select = document.getElementById('nug-demo-discount');
        const update = () => {
            const percent = Number(select?.value || 0);
            const discount = Math.floor(200 * percent / 100);
            const finalPrice = Math.max(0, 200 - discount);
            const minus = document.getElementById('nug-demo-minus');
            const total = document.getElementById('nug-demo-total');
            if (minus) minus.textContent = `- ${discount} 🪙`;
            if (total) total.textContent = `${finalPrice} 🪙`;
        };
        select?.addEventListener('change', update);
        document.getElementById('nug-demo-confirm')?.addEventListener('click', () => {
            showToast('Đây là mô phỏng. Khi mua thật, hãy kiểm tra giá rồi mới xác nhận.');
        });
    }

    function removeDemoCheckout() {
        document.getElementById('nug-demo-checkout')?.remove();
    }

    function ensureSubmissionGuideDemo() {
        if (state.role !== 'student') return null;

        let demo = document.getElementById(
            'nug-submission-demo'
        );

        if (demo) return demo;

        const tab = document.getElementById('tab-todo');
        const list = document.getElementById('assignmentsList');

        if (!tab) return null;

        demo = createElement('section', {
            id: 'nug-submission-demo'
        });

        demo.setAttribute(
            'data-nug-simulation',
            'true'
        );

        demo.innerHTML = `
            <span class="nug-submission-demo-badge">
                🧪 MÔ PHỎNG HƯỚNG DẪN · KHÔNG GỬI DỮ LIỆU
            </span>
            <div class="nug-submission-demo-head">
                <div>
                    <h3>📘 Bài tập mẫu: Luyện tập nộp bài đúng cách</h3>
                    <div class="nug-submission-demo-meta">
                        Môn: Toán · Loại: Kết hợp ·
                        Hạn nộp giả: 20:00 hôm nay
                    </div>
                </div>
            </div>
            <div class="nug-submission-demo-question">
                <strong>Yêu cầu mô phỏng:</strong>
                Trả lời phần tự luận, kiểm tra câu trắc nghiệm và
                đính kèm tệp nếu giáo viên yêu cầu.
            </div>
            <div id="nug-submission-demo-answer">
                Bấm “Tiếp theo” để hệ thống lần lượt mô phỏng
                cách chuẩn bị bài và các lỗi thường gặp.
            </div>
            <div id="nug-submission-demo-files"></div>
            <div
                id="nug-submission-demo-alert"
                data-tone="info"
            >
                ℹ️ Đây chỉ là bài giả trong hướng dẫn.
                Không có bài nộp, file hoặc điểm nào được ghi lên máy chủ.
            </div>
            <button
                type="button"
                id="nug-submission-demo-submit"
            >
                📤 Nộp bài tập ngay · MÔ PHỎNG
            </button>
            <p class="nug-submission-demo-footnote">
                Bài mẫu tự biến mất khi kết thúc mục hướng dẫn.
                Không liên quan đến bài thật do giáo viên giao.
            </p>
        `;

        if (list?.parentElement) {
            list.parentElement.insertBefore(demo, list);
        } else {
            tab.prepend(demo);
        }

        demo
            .querySelector('#nug-submission-demo-submit')
            ?.addEventListener('click', event => {
                event.preventDefault();
                showToast(
                    'Đây là nút mô phỏng, không gửi bài thật.'
                );
            });

        return demo;
    }

    function setSubmissionGuideDemoState(mode = 'intro') {
        const demo = ensureSubmissionGuideDemo();
        if (!demo) return null;

        const answer = demo.querySelector(
            '#nug-submission-demo-answer'
        );
        const files = demo.querySelector(
            '#nug-submission-demo-files'
        );
        const alertBox = demo.querySelector(
            '#nug-submission-demo-alert'
        );
        const submit = demo.querySelector(
            '#nug-submission-demo-submit'
        );

        const setAlert = (tone, message) => {
            if (!alertBox) return;
            alertBox.dataset.tone = tone;
            alertBox.textContent = message;
        };

        if (files) files.innerHTML = '';
        if (submit) {
            submit.disabled = false;
            submit.textContent =
                '📤 Nộp bài tập ngay · MÔ PHỎNG';
        }

        if (mode === 'ready') {
            if (answer) {
                answer.textContent =
                    'Em đã trình bày đủ nội dung lời giải, nêu cách làm, ' +
                    'kết quả và kiểm tra lại phép tính. Đây là đoạn văn mẫu ' +
                    'dài hơn 25 từ để minh họa một bài tự luận đã có nội dung.';
            }

            setAlert(
                'info',
                '✅ Trước khi nộp: đọc lại yêu cầu, kiểm tra đáp án và hạn nộp.'
            );
        } else if (mode === 'valid-file') {
            if (answer) {
                answer.textContent =
                    'Nội dung bài làm đã sẵn sàng. Bây giờ mô phỏng việc chọn một tệp hợp lệ.';
            }

            if (files) {
                files.innerHTML = `
                    <div class="nug-submission-demo-file">
                        <span>📎 Bai_lam_Toan.pdf</span>
                        <strong>2.35 MB · đang chờ nộp</strong>
                    </div>
                `;
            }

            setAlert(
                'info',
                '☁️ Tệp hợp lệ sẽ xuất hiện trong danh sách “đang chờ nộp”. Kiểm tra tên và dung lượng trước khi gửi.'
            );
        } else if (mode === 'oversize') {
            if (answer) {
                answer.textContent =
                    'Hệ thống đang mô phỏng hai tệp vượt giới hạn để em nhận biết cảnh báo.';
            }

            if (files) {
                files.innerHTML = `
                    <div class="nug-submission-demo-file is-rejected">
                        <span>❌ Bai_lam_scan.pdf</span>
                        <strong>8.40 MB &gt; 7 MB</strong>
                    </div>
                    <div class="nug-submission-demo-file is-rejected">
                        <span>❌ Ghi_am.m4a</span>
                        <strong>31.20 MB &gt; 30 MB</strong>
                    </div>
                `;
            }

            setAlert(
                'error',
                '⚠️ FILE QUÁ DUNG LƯỢNG — File thường tối đa 7 MB/file; file âm thanh tối đa 30 MB/file. File vượt ngưỡng bị tự động loại khỏi danh sách chờ nộp. Hãy giảm dung lượng, chia nhỏ hoặc chọn file khác.'
            );
        } else if (mode === 'short-essay') {
            if (answer) {
                answer.textContent =
                    'Em làm bài ngắn quá.';
            }

            setAlert(
                'warn',
                '⚠️ TỰ LUẬN CHƯA ĐỦ — Với bài tự luận thông thường, nếu nội dung dưới 25 từ và không có tệp đính kèm, hệ thống sẽ cảnh báo phần tự luận có thể không được công nhận và nhận 0 điểm. Hãy bổ sung nội dung hoặc tệp theo yêu cầu.'
            );
        } else if (mode === 'unanswered') {
            if (answer) {
                answer.textContent =
                    'Câu 1: đã chọn đáp án · Câu 2: CHƯA CHỌN · Câu 3: đã chọn đáp án.';
            }

            setAlert(
                'warn',
                '⚠️ CÒN CÂU CHƯA TRẢ LỜI — Hệ thống sẽ báo số câu còn thiếu và đưa em tới câu đầu tiên chưa chọn. Hoàn thành các câu được đánh dấu rồi nộp lại.'
            );
        } else if (mode === 'deadline') {
            if (answer) {
                answer.textContent =
                    'Mô phỏng tình huống chỉ còn dưới 15 giây trước hạn nộp.';
            }

            if (submit) {
                submit.disabled = true;
                submit.textContent =
                    '🔒 Đã khóa nộp để chuẩn bị đồng bộ';
            }

            setAlert(
                'error',
                '⏱️ SÁT/QUÁ HẠN — Dưới 15 giây trước hạn, hệ thống có thể khóa nút nộp để chuẩn bị đồng bộ; khi đã quá hạn, chức năng nộp bị khóa. Không bấm liên tục. Nếu cần xử lý bài quá hạn, liên hệ giáo viên.'
            );
        } else if (mode === 'network') {
            if (answer) {
                answer.textContent =
                    'Mô phỏng mất mạng trong lúc gửi bài.';
            }

            if (submit) {
                submit.textContent =
                    '↻ Thử nộp lại sau khi có mạng · MÔ PHỎNG';
            }

            setAlert(
                'error',
                '📡 MẤT MẠNG / MÁY CHỦ KHÔNG PHẢN HỒI — Giữ nguyên trang, kiểm tra Wi-Fi/4G, chờ kết nối ổn định rồi thử nộp lại. Không coi bài là đã nộp nếu chưa có thông báo thành công.'
            );
        } else if (mode === 'success') {
            if (answer) {
                answer.textContent =
                    'Bài mẫu đã đủ nội dung và tệp hợp lệ.';
            }

            if (files) {
                files.innerHTML = `
                    <div class="nug-submission-demo-file">
                        <span>📎 Bai_lam_Toan.pdf</span>
                        <strong>2.35 MB · đã gửi mô phỏng</strong>
                    </div>
                `;
            }

            if (submit) {
                submit.disabled = true;
                submit.textContent =
                    '✅ Nộp bài thành công · MÔ PHỎNG';
            }

            setAlert(
                'success',
                '✅ NỘP THÀNH CÔNG (MÔ PHỎNG) — Khi nộp bài thật, chỉ rời trang sau khi website báo thành công và trạng thái bài đã thay đổi. Nếu chỉ thấy cảnh báo lỗi thì chưa được tính là đã nộp.'
            );
        } else {
            if (answer) {
                answer.textContent =
                    'Bấm “Tiếp theo” để hệ thống lần lượt mô phỏng cách chuẩn bị bài và các lỗi thường gặp.';
            }

            setAlert(
                'info',
                'ℹ️ Đây chỉ là bài giả trong hướng dẫn. Không có bài nộp, file hoặc điểm nào được ghi lên máy chủ.'
            );
        }

        requestAnimationFrame(
            scheduleTourPositionUpdate
        );

        return demo;
    }

    function removeSubmissionGuideDemo() {
        document
            .getElementById('nug-submission-demo')
            ?.remove();
    }

    function safeOpenStudentBag() {
        if (typeof window.openStudentBag === 'function') {
            window.openStudentBag();
        }
    }

    function safeCloseStudentBag() {
        if (typeof window.closeStudentBag === 'function') {
            window.closeStudentBag();
        }
    }

    function safeOpenStudentInbox() {
        if (typeof window.openStudentInbox === 'function') {
            window.openStudentInbox();
        }
    }

    function safeCloseStudentInbox() {
        if (typeof window.closeStudentInbox === 'function') {
            window.closeStudentInbox();
        }
    }

    function getStudentProfileUsernameForGuide() {
        const latestUser = readCurrentUser();

        return String(
            latestUser.username ||
            state.user?.username ||
            state.user?._fbKey ||
            'Chưa cập nhật'
        ).trim() || 'Chưa cập nhật';
    }

    function ensureStudentProfileGuideFields() {
        if (state.role !== 'student') return false;

        const modal = document.getElementById('studentInfoModal');
        const content = modal?.querySelector('.modal-content');
        const name = document.getElementById('infoModalName');
        const classRow = document.getElementById('infoModalClass');
        const avatarSaveButton = document.getElementById('saveAvatarBtn');

        if (!modal || !content) return false;

        let usernameRow = document.getElementById('nugInfoModalUsername');

        if (!usernameRow) {
            usernameRow = createElement('p', {
                id: 'nugInfoModalUsername'
            });
            usernameRow.style.cssText = `
                margin:0 0 7px;
                padding:8px 12px;
                border-radius:9px;
                background:rgba(102,126,234,.09);
                color:#4338ca;
                font-size:.92rem;
                font-weight:700;
                line-height:1.45;
                text-align:center;
                word-break:break-word;
            `;
            usernameRow.innerHTML = `
                <strong>👤 Tên tài khoản:</strong>
                <span data-nug-profile-username></span>
            `;

            if (classRow) {
                classRow.insertAdjacentElement('beforebegin', usernameRow);
            } else if (name) {
                name.insertAdjacentElement('afterend', usernameRow);
            } else {
                content.prepend(usernameRow);
            }
        }

        const usernameValue = usernameRow.querySelector(
            '[data-nug-profile-username]'
        );
        if (usernameValue) {
            usernameValue.textContent = getStudentProfileUsernameForGuide();
        }

        let avatarHint = document.getElementById('nugAvatarHelpText');

        if (!avatarHint) {
            avatarHint = createElement('small', {
                id: 'nugAvatarHelpText',
                text: 'Chạm ảnh hoặc biểu tượng ✏️ → chọn PNG/JPEG/GIF nhỏ hơn 1 MB → kiểm tra ảnh xem trước → bấm “Lưu ảnh mới”.'
            });
            avatarHint.style.cssText = `
                display:block;
                margin:-5px auto 15px;
                padding:9px 12px;
                max-width:390px;
                border-radius:9px;
                background:rgba(22,163,74,.08);
                color:#166534;
                font-size:.82rem;
                font-weight:650;
                line-height:1.45;
                text-align:left;
            `;

            if (avatarSaveButton) {
                avatarSaveButton.insertAdjacentElement('afterend', avatarHint);
            } else {
                const avatarContainer = content.querySelector(
                    '.avatar-upload-container'
                );
                avatarContainer?.insertAdjacentElement('afterend', avatarHint);
            }
        }

        let rules = document.getElementById('nugProfileChangeRules');

        if (!rules) {
            rules = createElement('div', {
                id: 'nugProfileChangeRules'
            });
            rules.style.cssText = `
                margin-top:15px;
                padding:14px 15px;
                border:1px solid rgba(245,158,11,.28);
                border-radius:12px;
                background:rgba(255,247,237,.92);
                color:#44403c;
                text-align:left;
                line-height:1.55;
                font-size:.88rem;
            `;
            rules.innerHTML = `
                <strong style="display:block;color:#b45309;margin-bottom:7px;">
                    🛡️ Thông tin nào em được tự thay đổi?
                </strong>
                <ul style="margin:0;padding-left:19px;">
                    <li><b>Tự đổi ngay:</b> ảnh đại diện.</li>
                    <li><b>Tự nhập đúng 1 lần:</b> ngày sinh, chỉ khi hồ sơ chưa có.</li>
                    <li><b>Gửi yêu cầu trong Cài đặt:</b> tên hiển thị hoặc mật khẩu.</li>
                    <li><b>Báo giáo viên chỉnh:</b> lớp, ngày sinh đã lưu, sở thích và châm ngôn.</li>
                    <li><b>Tên tài khoản:</b> không có nút tự đổi; cần liên hệ giáo viên hoặc quản trị viên.</li>
                </ul>
            `;
            content.appendChild(rules);
        }

        return true;
    }

    function installStudentProfileEnhancement() {
        if (state.role !== 'student') return;

        ensureStudentProfileGuideFields();

        const originalOpen = window.openStudentInfoModal;

        if (
            typeof originalOpen === 'function' &&
            originalOpen.__nugProfileEnhanced !== true
        ) {
            const wrappedOpen = function (...args) {
                ensureStudentProfileGuideFields();
                const result = originalOpen.apply(this, args);

                requestAnimationFrame(() => {
                    ensureStudentProfileGuideFields();
                });

                return result;
            };

            wrappedOpen.__nugProfileEnhanced = true;
            wrappedOpen.__nugOriginal = originalOpen;
            window.openStudentInfoModal = wrappedOpen;
        }
    }

    function safeOpenStudentProfileForGuide() {
        if (state.role !== 'student') return false;

        ensureStudentProfileGuideFields();

        if (window.currentActiveExamId) {
            return false;
        }

        try {
            if (typeof window.openStudentInfoModal === 'function') {
                window.openStudentInfoModal();
            } else {
                document
                    .getElementById('studentInfoModal')
                    ?.classList.add('active');
            }
        } catch (_) {
            return false;
        }

        ensureStudentProfileGuideFields();

        return Boolean(
            document
                .getElementById('studentInfoModal')
                ?.classList.contains('active')
        );
    }

    function safeCloseStudentProfileForGuide() {
        const modal = document.getElementById('studentInfoModal');
        if (!modal?.classList.contains('active')) return;

        try {
            if (typeof window.closeStudentInfoModal === 'function') {
                window.closeStudentInfoModal();
            } else {
                modal.classList.remove('active');
            }
        } catch (_) {
            modal.classList.remove('active');
        }
    }

    function hasSavedStudentBirthdayForGuide() {
        const latestUser = readCurrentUser();
        const profile =
            latestUser.birthdayProfile ||
            state.user?.birthdayProfile;

        if (
            profile &&
            typeof profile === 'object' &&
            String(profile.date || '').trim()
        ) {
            return true;
        }

        return Boolean(
            String(latestUser.birthDate || state.user?.birthDate || '').trim()
        );
    }

    function getGuideCoinVisibilityStorageKey() {
        const username = String(
            state.user?.username ||
            state.user?._fbKey ||
            'guest'
        ).trim();

        return `student_coin_widget_visible:${username}`;
    }

    function isCoinWidgetActuallyVisible() {
        const widget = document.getElementById('coinWidget');
        if (!widget) return false;

        const style = window.getComputedStyle(widget);
        const rect = widget.getBoundingClientRect();

        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            Number(style.opacity || 1) > 0.01 &&
            widget.getAttribute('aria-hidden') !== 'true' &&
            rect.width > 0 &&
            rect.height > 0
        );
    }

    function isCoinWidgetHidden() {
        return !isCoinWidgetActuallyVisible();
    }

    function temporarilyRevealCoinWidgetForGuide() {
        const widget = document.getElementById('coinWidget');
        if (!widget || isCoinWidgetActuallyVisible()) return true;

        if (state.coinWidgetInitialStoredVisibility === null) {
            state.coinWidgetInitialStoredVisibility = localStorage.getItem(
                getGuideCoinVisibilityStorageKey()
            );
        }

        if (typeof window.applyCoinBalanceWidgetVisibility === 'function') {
            window.applyCoinBalanceWidgetVisibility(true, false);
        } else {
            widget.style.visibility = 'visible';
            widget.style.opacity = '1';
            widget.style.pointerEvents = 'auto';
            widget.setAttribute('aria-hidden', 'false');
        }

        state.coinWidgetTemporarilyRevealed = true;
        return true;
    }

    function restoreCoinWidgetAfterGuide() {
        if (!state.coinWidgetTemporarilyRevealed) return;

        const storedNow = localStorage.getItem(
            getGuideCoinVisibilityStorageKey()
        );

        /*
         * Nếu học sinh tự bật công tắc trong lúc được hướng dẫn,
         * student.js đã lưu "true" nên giữ thanh Coin đang hiện.
         * Chỉ ẩn lại khi cài đặt vẫn là "false" như trước.
         */
        if (storedNow !== 'true') {
            if (typeof window.applyCoinBalanceWidgetVisibility === 'function') {
                window.applyCoinBalanceWidgetVisibility(false, false);
            } else {
                const widget = document.getElementById('coinWidget');
                if (widget) {
                    widget.style.visibility = 'hidden';
                    widget.style.opacity = '0';
                    widget.style.pointerEvents = 'none';
                    widget.setAttribute('aria-hidden', 'true');
                }
            }
        }

        state.coinWidgetTemporarilyRevealed = false;
        state.coinWidgetInitialStoredVisibility = null;
    }

    function canOpenCoinConversionForGuide() {
        return (
            window.isConversionEnabled !== false &&
            !window.currentActiveExamId &&
            typeof window.openCoinConversionModal === 'function'
        );
    }

    function getCoinConversionUnavailableText() {
        if (window.currentActiveExamId) {
            return 'Bảng quy đổi bị khóa trong lúc em đang làm bài thi. Hãy hoàn thành hoặc nộp bài trước rồi mở lại.';
        }

        if (window.isConversionEnabled === false) {
            return 'Giáo viên đang tạm khóa Bảng quy đổi. Em vẫn xem được số dư Coin nhưng chưa thể mở hoặc thực hiện quy đổi.';
        }

        return 'Bảng quy đổi chưa sẵn sàng trên trang này. Hãy tải lại website hoặc báo giáo viên nếu lỗi vẫn còn.';
    }

    function safeEnsureCoinConversionModalOpen() {
        temporarilyRevealCoinWidgetForGuide();

        const modal = document.getElementById('coinConversionModal');
        if (modal?.classList.contains('active')) return true;
        if (!canOpenCoinConversionForGuide()) return false;

        try {
            window.openCoinConversionModal();
        } catch (_) {
            return false;
        }

        return Boolean(
            document.getElementById('coinConversionModal')
                ?.classList.contains('active')
        );
    }

    function safeCloseCoinConversionModalForGuide() {
        const modal = document.getElementById('coinConversionModal');
        if (!modal?.classList.contains('active')) return;

        if (typeof window.closeCoinConversionModal === 'function') {
            window.closeCoinConversionModal();
        } else {
            modal.classList.remove('active');
        }
    }

    const GUIDE_PRACTICE_DEMO_ASSIGNMENT = Object.freeze({
        id: 'nug-demo-practice-assignment',
        title: 'Bài mẫu: Ôn tập trắc nghiệm',
        assessmentType: 'trac_nghiem',
        questions: [
            {
                qText: 'Số nào là số nguyên tố?',
                A: '9',
                B: '11',
                C: '15',
                D: '21',
                correct: 'B'
            },
            {
                qText: 'Từ nào dưới đây là danh từ?',
                A: 'Chạy',
                B: 'Đẹp',
                C: 'Học sinh',
                D: 'Nhanh',
                correct: 'C'
            },
            {
                qText: 'Choose the correct form: She ___ to school every day.',
                A: 'go',
                B: 'goes',
                C: 'going',
                D: 'gone',
                correct: 'B'
            }
        ]
    });

    function getRealQuestionsReviewButton() {
        return [
            ...document.querySelectorAll(
                '#gradesList button[onclick*="viewAssignmentQuestions"]'
            )
        ].find(button => button.isConnected) || null;
    }

    function getAssignmentIdFromReviewButton(button) {
        const onclick = String(
            button?.getAttribute('onclick') || ''
        );

        const match = onclick.match(
            /viewAssignmentQuestions\(\s*['"]([^'"]+)['"]\s*\)/
        );

        return match ? match[1] : '';
    }

    async function waitForRealQuestionsReviewButton(
        timeoutMs = 1500
    ) {
        const startedAt = Date.now();

        while (Date.now() - startedAt < timeoutMs) {
            const button = getRealQuestionsReviewButton();
            if (button) return button;
            await wait(120);
        }

        return null;
    }

    function ensureDemoReviewEntry() {
        let entry = document.getElementById(
            'nug-demo-review-entry'
        );

        if (entry) return entry;

        entry = createElement('div', {
            id: 'nug-demo-review-entry'
        });

        entry.innerHTML = `
            <h4>🧪 Bài mẫu hướng dẫn</h4>
            <p>
                Tài khoản chưa có bài trắc nghiệm phù hợp.
                Thẻ này chỉ mô phỏng cách xem lại và luyện lại,
                không tạo bài nộp và không thay đổi điểm.
            </p>
            <button
                id="nug-demo-open-review"
                type="button"
            >
                👁️ Xem lại tất cả câu hỏi
            </button>
        `;

        const gradesList =
            document.getElementById('gradesList');
        const gradesTab =
            document.getElementById('tab-grades');

        if (gradesList) {
            gradesList.prepend(entry);
        } else if (gradesTab) {
            gradesTab.appendChild(entry);
        } else {
            document.body.appendChild(entry);
        }

        entry
            .querySelector('#nug-demo-open-review')
            ?.addEventListener(
                'click',
                openDemoQuestionsReview
            );

        return entry;
    }

    function openDemoQuestionsReview() {
        closeDemoQuestionsReview();

        const modal = createElement('div', {
            id: 'nug-demo-review-modal'
        });

        const questionHTML =
            GUIDE_PRACTICE_DEMO_ASSIGNMENT.questions
                .map((question, index) => `
                    <section
                        class="nug-demo-review-question"
                    >
                        <strong>
                            Câu ${index + 1}:
                            ${question.qText}
                        </strong>
                        <ul>
                            <li>A. ${question.A}</li>
                            <li>B. ${question.B}</li>
                            <li>C. ${question.C}</li>
                            <li>D. ${question.D}</li>
                        </ul>
                    </section>
                `)
                .join('');

        modal.innerHTML = `
            <div class="nug-demo-review-card">
                <div class="nug-demo-review-header">
                    <h3>
                        👁️ Xem lại tất cả câu hỏi
                    </h3>
                    <p>
                        Đây là bài mẫu mô phỏng. Em có thể cuộn để
                        xem toàn bộ câu hỏi và các lựa chọn trước khi
                        chuyển sang phần luyện lại.
                    </p>
                </div>

                <div id="nug-demo-review-question-list">
                    ${questionHTML}
                </div>

                <div class="nug-demo-review-actions">
                    <button
                        id="nug-demo-start-practice"
                        type="button"
                    >
                        🔁 Làm lại trắc nghiệm
                    </button>
                    <button
                        id="nug-demo-close-review"
                        class="is-secondary"
                        type="button"
                    >
                        Đóng lại
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal
            .querySelector('#nug-demo-start-practice')
            ?.addEventListener('click', () => {
                closeDemoQuestionsReview();
                openPracticeWarningForGuide();
            });

        modal
            .querySelector('#nug-demo-close-review')
            ?.addEventListener(
                'click',
                closeDemoQuestionsReview
            );

        return modal;
    }

    function closeDemoQuestionsReview() {
        document
            .getElementById('nug-demo-review-modal')
            ?.remove();
    }

    async function prepareQuestionsReviewEntryForGuide() {
        closeReviewPracticeDialogsForGuide({
            keepEntry: true
        });

        const realButton =
            await waitForRealQuestionsReviewButton();

        if (realButton) {
            state.reviewPracticeGuideMode = 'real';
            state.reviewPracticeRealAssignmentId =
                getAssignmentIdFromReviewButton(
                    realButton
                );

            document
                .getElementById('nug-demo-review-entry')
                ?.remove();

            return true;
        }

        state.reviewPracticeGuideMode = 'demo';
        state.reviewPracticeRealAssignmentId = '';
        ensureDemoReviewEntry();
        return true;
    }

    async function openQuestionsReviewForGuide() {
        if (state.reviewPracticeGuideMode !== 'demo') {
            const realButton =
                getRealQuestionsReviewButton() ||
                await waitForRealQuestionsReviewButton(700);

            const assignId =
                state.reviewPracticeRealAssignmentId ||
                getAssignmentIdFromReviewButton(
                    realButton
                );

            if (
                assignId &&
                typeof window.viewAssignmentQuestions ===
                    'function'
            ) {
                try {
                    await window.viewAssignmentQuestions(
                        assignId
                    );
                    await wait(350);

                    if (
                        isActuallyVisible(
                            document.getElementById(
                                'viewQuestionsModal'
                            )
                        )
                    ) {
                        state.reviewPracticeGuideMode =
                            'real';
                        return true;
                    }
                } catch (_) {
                    // Chuyển sang bài mẫu nếu dữ liệu thật chưa tải được.
                }
            }
        }

        state.reviewPracticeGuideMode = 'demo';
        ensureDemoReviewEntry();
        openDemoQuestionsReview();
        return true;
    }

    function openPracticeWarningForGuide() {
        if (state.reviewPracticeGuideMode === 'real') {
            const redoButton = document.getElementById(
                'btnPracticeRedoFromReview'
            );

            if (redoButton) {
                redoButton.click();
                return true;
            }
        }

        state.reviewPracticeGuideMode = 'demo';
        closeDemoQuestionsReview();

        if (
            typeof window.openPracticeRedoWarning ===
                'function'
        ) {
            window.openPracticeRedoWarning(
                GUIDE_PRACTICE_DEMO_ASSIGNMENT
            );
            return true;
        }

        return false;
    }

    function openPracticeModalForGuide() {
        const warning = document.getElementById(
            'practiceRedoWarningModal'
        );

        if (
            warning &&
            isActuallyVisible(warning) &&
            typeof window.confirmPracticeRedo ===
                'function'
        ) {
            window.confirmPracticeRedo();
            return true;
        }

        if (
            document.getElementById('practiceRedoModal') &&
            isActuallyVisible(
                document.getElementById(
                    'practiceRedoModal'
                )
            )
        ) {
            return true;
        }

        if (
            typeof window.openPracticeRedoModal ===
                'function'
        ) {
            window.openPracticeRedoModal(
                state.reviewPracticeGuideMode === 'demo'
                    ? GUIDE_PRACTICE_DEMO_ASSIGNMENT
                    : window.pendingPracticeRedoAssignment
            );

            return true;
        }

        return false;
    }

    function showDemoPracticeResultForGuide() {
        if (state.reviewPracticeGuideMode !== 'demo') {
            return true;
        }

        const modal = document.getElementById(
            'practiceRedoModal'
        );

        if (!modal || !window.practiceRedoSession) {
            return false;
        }

        const result = document.getElementById(
            'practiceRedoResult'
        );

        if (result?.classList.contains('show')) {
            return true;
        }

        const demoAnswers = ['B', 'A', 'B'];

        demoAnswers.forEach((answer, index) => {
            modal
                .querySelector(
                    `[data-practice-question="${index}"] ` +
                    `input[value="${answer}"]`
                )
                ?.click();
        });

        if (typeof window.submitPracticeRedo === 'function') {
            window.submitPracticeRedo();
        }

        return true;
    }

    function closeReviewPracticeDialogsForGuide(
        options = {}
    ) {
        closeDemoQuestionsReview();

        if (
            typeof window.closeAssignmentQuestionsReview ===
                'function'
        ) {
            window.closeAssignmentQuestionsReview();
        } else {
            const reviewModal = document.getElementById(
                'viewQuestionsModal'
            );
            if (reviewModal) {
                reviewModal.style.display = 'none';
                reviewModal.innerHTML = '';
            }
        }

        if (
            typeof window.cancelPracticeRedoWarning ===
                'function'
        ) {
            window.cancelPracticeRedoWarning();
        }

        if (
            typeof window.closePracticeRedo ===
                'function'
        ) {
            window.closePracticeRedo();
        }

        if (!options.keepEntry) {
            document
                .getElementById('nug-demo-review-entry')
                ?.remove();
        }

        state.reviewPracticeGuideMode = null;
        state.reviewPracticeRealAssignmentId = '';
    }

    function activateStoreTabForCollectionGuide() {
        const tab = document.getElementById('tab-store');
        if (!tab) return false;

        const navButton = getNavButton('tab-store');

        if (!tab.classList.contains('active')) {
            try {
                navButton?.click();
            } catch (_) {
                activateTabFallback('tab-store', navButton);
            }
        }

        return true;
    }

    function closeCollectionDropdownForGuide() {
        const toggle = document.getElementById('storeCollectionArrow');
        const dropdown = document.getElementById('storeCollectionDropdown');

        toggle?.classList.remove('is-open');
        toggle?.setAttribute('aria-expanded', 'false');
        if (toggle) toggle.title = 'Mở menu Sưu tầm';

        dropdown?.classList.remove('is-open');
        dropdown?.setAttribute('aria-hidden', 'true');
    }

    function safeCloseCollectionPageForGuide() {
        safeCloseCollectionAcquisitionForGuide();

        try {
            if (typeof window.StoreCollectionPage?.close === 'function') {
                window.StoreCollectionPage.close();
            } else {
                const storeTab = document.getElementById('tab-store');
                const page = document.getElementById('storeCollectionPage');

                storeTab?.classList.remove('store-collection-view-active');
                page?.classList.remove('is-visible');
                if (page) {
                    page.hidden = true;
                    page.setAttribute('aria-hidden', 'true');
                }
            }
        } catch (_) {
            // Dọn giao diện tốt nhất có thể.
        }

        closeCollectionDropdownForGuide();
        return true;
    }

    function safeOpenCollectionMenuForGuide(options = {}) {
        if (!activateStoreTabForCollectionGuide()) return false;

        if (options.keepCollectionPage !== true) {
            safeCloseCollectionPageForGuide();
        }

        const toggle = document.getElementById('storeCollectionArrow');
        if (!toggle) return false;

        if (toggle.getAttribute('aria-expanded') !== 'true') {
            toggle.click();
        }

        return true;
    }

    function safeOpenCollectionPageForGuide(collectionId = 'all') {
        if (!activateStoreTabForCollectionGuide()) return false;

        try {
            if (typeof window.StoreCollectionPage?.open === 'function') {
                window.StoreCollectionPage.open(collectionId);
                return true;
            }
        } catch (_) {
            // Thử mở bằng nút giao diện bên dưới.
        }

        if (!safeOpenCollectionMenuForGuide()) return false;
        document.getElementById('storeCollectionOpenButton')?.click();
        return Boolean(
            document.getElementById('tab-store')
                ?.classList.contains('store-collection-view-active')
        );
    }

    function safeOpenCollectionReturnMenuForGuide() {
        if (!safeOpenCollectionPageForGuide('all')) return false;
        return safeOpenCollectionMenuForGuide({ keepCollectionPage: true });
    }

    function safeCloseCollectionAcquisitionForGuide() {
        try {
            if (
                typeof window.StoreCollectionPage
                    ?.closeAcquisitionWays === 'function'
            ) {
                window.StoreCollectionPage
                    .closeAcquisitionWays();

                return true;
            }
        } catch (_) {
            // Dọn popup bằng DOM bên dưới.
        }

        const modal = document.getElementById(
            'storeCollectionAcquisitionModal'
        );

        if (!modal) return true;

        const active = document.activeElement;

        if (
            active instanceof HTMLElement &&
            modal.contains(active)
        ) {
            active.blur();
        }

        modal.classList.remove('is-open');
        modal.hidden = true;
        modal.inert = true;
        modal.setAttribute('inert', '');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove(
            'store-collection-acquisition-open'
        );

        return true;
    }

    function safeOpenCollectionAcquisitionForGuide(
        collectionId = 'all'
    ) {
        safeCloseCollectionAcquisitionForGuide();

        if (!safeOpenCollectionPageForGuide(collectionId)) {
            return false;
        }

        try {
            if (
                typeof window.StoreCollectionPage
                    ?.showAcquisitionWays === 'function'
            ) {
                window.StoreCollectionPage
                    .showAcquisitionWays(collectionId);

                return true;
            }
        } catch (_) {
            // Thử mở bằng nút dấu ! bên dưới.
        }

        const button = document.querySelector(
            '#storeCollectionSummary ' +
            '[data-collection-acquisition-info]'
        );

        button?.click();

        return Boolean(
            document.getElementById(
                'storeCollectionAcquisitionModal'
            )?.classList.contains('is-open')
        );
    }

    function studentTourSteps() {
        const coinGuideSteps = [];
        const coinHiddenAtStart = isCoinWidgetHidden();
        const conversionAvailable = canOpenCoinConversionForGuide();

        const profileGuideSteps = [
            {
                featureId: 'profile',
                selector: '.profile-trigger-btn',
                skipIfMissing: true,
                title: 'Mở Hồ sơ cá nhân',
                description: 'Bấm ảnh đại diện hoặc biểu tượng 👤 ở góc trên màn hình để mở popup hồ sơ.',
                access: 'Hồ sơ tạm khóa trong lúc làm bài thi nghiêm ngặt.'
            },
            {
                featureId: 'profile',
                selector: '#studentInfoModal .modal-content',
                before: safeOpenStudentProfileForGuide,
                waitMs: 350,
                skipIfMissing: true,
                title: 'Giao diện hồ sơ',
                description: 'Popup này chứa ảnh đại diện, tên, tên tài khoản, lớp, ngày sinh, sở thích và châm ngôn.',
                access: 'Bấm Tiếp theo để xem từng khu vực; hướng dẫn không tự lưu hoặc thay đổi dữ liệu.'
            },
            {
                featureId: 'profile',
                selector: '#studentInfoModal .avatar-upload-container',
                before: safeOpenStudentProfileForGuide,
                skipIfMissing: true,
                title: 'Chọn ảnh đại diện mới',
                description: 'Chạm vào ảnh hoặc biểu tượng ✏️ rồi chọn ảnh PNG, JPEG hoặc GIF. Hệ thống chỉ nhận ảnh nhỏ hơn 1 MB.',
                access: 'Sau khi chọn, hãy nhìn kỹ ảnh xem trước; chưa bấm Lưu thì ảnh chính thức chưa thay đổi.'
            },
            {
                featureId: 'profile',
                selector: '#nugAvatarHelpText',
                before: safeOpenStudentProfileForGuide,
                skipIfMissing: true,
                title: 'Kiểm tra và lưu ảnh',
                description: 'Khi ảnh hợp lệ được chọn, nút “Lưu ảnh mới” sẽ hiện. Chỉ bấm sau khi ảnh xem trước đúng chiều, đúng người và không bị cắt mất phần quan trọng.',
                access: 'Hướng dẫn không mở trình chọn tệp và không tự tải ảnh lên.'
            },
            {
                featureId: 'profile',
                selector: '#infoModalName',
                before: safeOpenStudentProfileForGuide,
                skipIfMissing: true,
                title: 'Xem tên hiển thị',
                description: 'Đây là tên được hiển thị trong website. Học sinh không sửa trực tiếp tại popup này.',
                access: 'Muốn đổi tên, vào Cài đặt và gửi yêu cầu để giáo viên duyệt.'
            },
            {
                featureId: 'profile',
                selector: '#nugInfoModalUsername',
                before: safeOpenStudentProfileForGuide,
                skipIfMissing: true,
                title: 'Xem tên tài khoản',
                description: 'Đây là tên dùng để đăng nhập. Tên tài khoản khác với tên hiển thị.',
                access: 'Website không có nút tự đổi tên tài khoản; cần liên hệ giáo viên hoặc quản trị viên nếu có sai sót.'
            },
            {
                featureId: 'profile',
                selector: '#infoModalClass',
                before: safeOpenStudentProfileForGuide,
                skipIfMissing: true,
                title: 'Kiểm tra lớp',
                description: 'Kiểm tra lớp đang hiển thị có đúng không để nhận đúng bài tập, lịch học và tài liệu giao riêng.',
                access: 'Nếu lớp sai, báo giáo viên chỉnh trong phần quản lý học sinh.'
            }
        ];

        if (hasSavedStudentBirthdayForGuide()) {
            profileGuideSteps.push({
                featureId: 'profile',
                selector: '#infoModalBirthDate',
                before: safeOpenStudentProfileForGuide,
                skipIfMissing: true,
                title: 'Ngày sinh đã được lưu',
                description: 'Ngày sinh đã khóa chỉnh sửa phía học sinh vì mỗi học sinh chỉ được tự nhập một lần.',
                access: 'Nếu phát hiện sai, không tạo dữ liệu mới; hãy báo giáo viên cập nhật.'
            });
        } else {
            profileGuideSteps.push(
                {
                    featureId: 'profile',
                    selector: '#studentBirthDateInput',
                    before: safeOpenStudentProfileForGuide,
                    skipIfMissing: true,
                    title: 'Nhập ngày sinh lần đầu',
                    description: 'Chọn đúng ngày, tháng và năm sinh. Không chọn ngày trong tương lai hoặc trước năm 1900.',
                    access: 'Học sinh chỉ được tự nhập đúng một lần nên cần đối chiếu kỹ trước khi lưu.'
                },
                {
                    featureId: 'profile',
                    selector: '#saveStudentBirthDateBtn',
                    before: safeOpenStudentProfileForGuide,
                    skipIfMissing: true,
                    title: 'Kiểm tra hộp xác nhận trước khi lưu',
                    description: 'Bấm “Lưu ngày sinh” sẽ hiện hộp xác nhận theo định dạng ngày/tháng/năm. Đọc lại con số; bấm Hủy nếu sai và chỉ xác nhận khi hoàn toàn chính xác.',
                    access: 'Hướng dẫn không tự bấm nút này vì thao tác thật sẽ khóa quyền tự sửa ngày sinh.'
                }
            );
        }

        profileGuideSteps.push(
            {
                featureId: 'profile',
                selector: '#infoModalHobbies',
                before: safeOpenStudentProfileForGuide,
                skipIfMissing: true,
                title: 'Xem sở thích',
                description: 'Thông tin sở thích chỉ được hiển thị trong hồ sơ; popup không có ô để học sinh tự sửa.',
                access: 'Báo giáo viên nếu cần cập nhật.'
            },
            {
                featureId: 'profile',
                selector: '#infoModalMotto',
                before: safeOpenStudentProfileForGuide,
                skipIfMissing: true,
                title: 'Xem châm ngôn',
                description: 'Đây là câu nói yêu thích được lưu trong hồ sơ học sinh.',
                access: 'Báo giáo viên nếu muốn thay đổi nội dung này.'
            },
            {
                featureId: 'profile',
                selector: '#nugProfileChangeRules',
                before: safeOpenStudentProfileForGuide,
                skipIfMissing: true,
                title: 'Phân biệt quyền thay đổi',
                description: 'Ảnh đại diện được tự đổi; ngày sinh chỉ tự nhập một lần. Tên hiển thị và mật khẩu gửi yêu cầu trong Cài đặt. Lớp, ngày sinh đã lưu, sở thích và châm ngôn cần giáo viên chỉnh.',
                access: 'Tên tài khoản không có chức năng tự đổi trên website.'
            },
            {
                featureId: 'profile',
                tabId: 'tab-settings',
                selector: '#settingName',
                before: safeCloseStudentProfileForGuide,
                title: 'Yêu cầu đổi tên hiển thị',
                description: 'Nhập tên hiển thị muốn đổi tại đây. Đây là yêu cầu chờ giáo viên duyệt, không đổi ngay lập tức.',
                access: 'Không dùng ô này để đổi tên tài khoản đăng nhập.'
            },
            {
                featureId: 'profile',
                tabId: 'tab-settings',
                selector: '#settingPass',
                title: 'Yêu cầu đổi mật khẩu',
                description: 'Chỉ nhập mật khẩu mới khi thật sự cần đổi. Để trống nếu chỉ yêu cầu đổi tên hiển thị.',
                access: 'Giữ bí mật mật khẩu và không nhập mật khẩu của người khác.'
            },
            {
                featureId: 'profile',
                tabId: 'tab-settings',
                selector: 'button[onclick*="updateProfile"]',
                title: 'Gửi yêu cầu cho giáo viên',
                description: 'Kiểm tra lại tên và mật khẩu rồi mới bấm gửi. Giáo viên có thể chấp nhận hoặc từ chối yêu cầu.',
                access: 'Hướng dẫn không tự bấm nút gửi để tránh tạo yêu cầu ngoài ý muốn.'
            }
        );

        if (coinHiddenAtStart) {
            coinGuideSteps.push({
                featureId: 'coin',
                tabId: 'tab-settings',
                selector: '#toggleCoinBalanceWidget',
                title: 'Thanh Coin đang bị ẩn',
                description: 'Em đã tắt thanh số dư Coin. Bật công tắc này để thanh Coin hiện lại và có thể mở Bảng quy đổi.',
                access: 'Nếu em chưa bật, bước sau chỉ tạm hiện thanh Coin để tiếp tục hướng dẫn; cài đặt đã lưu vẫn không bị tự ý thay đổi.'
            });
        }

        coinGuideSteps.push(
            {
                featureId: 'coin',
                selector: '#coinWidget',
                before: temporarilyRevealCoinWidgetForGuide,
                skipIfMissing: true,
                title: '1. Xem thanh số dư Coin',
                description: 'Thanh nổi hiển thị số Coin dùng trong cửa hàng. Em có thể kéo thanh tới vị trí thuận tiện trên màn hình.',
                access: 'Coin dùng để mua vật phẩm; Tiền lộ trình là số tiền tích lũy từ quá trình học.'
            },
            {
                featureId: 'coin',
                selector: '#coinWidget [onclick*="openCoinConversionModal"]',
                before: temporarilyRevealCoinWidgetForGuide,
                skipIfMissing: true,
                title: '2. Nút mở Bảng quy đổi',
                description: 'Bấm dấu ! cạnh chữ “Số dư Coin” để mở Bảng quy đổi Tiền và Coin.',
                access: conversionAvailable
                    ? 'Hướng dẫn sẽ tự mở bảng ở bước tiếp theo; chưa có giao dịch nào được thực hiện.'
                    : getCoinConversionUnavailableText()
            }
        );

        if (conversionAvailable) {
            coinGuideSteps.push(
                {
                    featureId: 'coin',
                    selector: '#coinConversionModal .modal-content',
                    before: safeEnsureCoinConversionModalOpen,
                    waitMs: 450,
                    skipIfMissing: true,
                    title: '3. Giao diện Bảng quy đổi',
                    description: 'Bảng gồm khu vực đổi Tiền lộ trình với Coin và khu vực gửi yêu cầu lấy tiền mặt.',
                    access: 'Hướng dẫn chỉ mở và giới thiệu giao diện, không tự nhập số hay thực hiện giao dịch.'
                },
                {
                    featureId: 'coin',
                    selector: '#btnDirM2C',
                    before: () => {
                        safeEnsureCoinConversionModalOpen();
                        runIfFunction('setConvertDir', 'M2C');
                    },
                    title: '4. Đổi Tiền lộ trình thành Coin',
                    description: 'Chọn “Tiền ➔ Coin” khi muốn dùng tiền tích lũy lộ trình để nhận Coin mua vật phẩm.',
                    access: 'Tỉ lệ hiển thị của hệ thống là 1:1; chỉ đổi trong phạm vi tiền lộ trình hiện có.'
                },
                {
                    featureId: 'coin',
                    selector: '#btnDirC2M',
                    before: () => {
                        safeEnsureCoinConversionModalOpen();
                        runIfFunction('setConvertDir', 'C2M');
                    },
                    title: '5. Đổi Coin thành Tiền lộ trình',
                    description: 'Chọn “Coin ➔ Tiền” khi muốn chuyển Coin trở lại tiền lộ trình.',
                    access: 'Mỗi lần chỉ được đổi tối đa 500 Coin và không được vượt quá số dư Coin hiện có.'
                },
                {
                    featureId: 'coin',
                    selector: '#convertAmount',
                    before: safeEnsureCoinConversionModalOpen,
                    title: '6. Nhập số lượng muốn đổi',
                    description: 'Nhập một số nguyên lớn hơn 0. Ô bên phải sẽ tự tính số Coin hoặc số tiền nhận được.',
                    access: 'Không nhập vượt số dư nguồn; kiểm tra lại hướng quy đổi trước khi nhập.'
                },
                {
                    featureId: 'coin',
                    selector: '#convertResult',
                    before: safeEnsureCoinConversionModalOpen,
                    title: '7. Kiểm tra kết quả dự kiến',
                    description: 'Ô này chỉ hiển thị số lượng dự kiến nhận được và không cho nhập trực tiếp.',
                    access: 'Hãy kiểm tra cả nhãn nguồn, nhãn nhận và con số trước khi xác nhận.'
                },
                {
                    featureId: 'coin',
                    selector: '#coinConversionModal button[onclick*="executeConversion"]',
                    before: safeEnsureCoinConversionModalOpen,
                    title: '8. Thực hiện quy đổi',
                    description: 'Chỉ bấm nút này khi hướng quy đổi, số lượng và kết quả đều chính xác. Giao dịch thành công sẽ cập nhật số dư ngay.',
                    access: 'Hướng dẫn không tự bấm nút này, vì đây là thao tác làm thay đổi Coin và tiền lộ trình thật.'
                },
                {
                    featureId: 'coin',
                    selector: '#cashWithdrawalSection',
                    before: safeEnsureCoinConversionModalOpen,
                    title: '9. Khu vực yêu cầu lấy tiền mặt',
                    description: 'Khu vực này hiển thị tổng tiền lộ trình hiện có và cho phép gửi yêu cầu lấy tiền cho giáo viên xử lý.',
                    access: 'Đây là yêu cầu chờ duyệt, không phải hệ thống tự chuyển tiền ngay lập tức.'
                },
                {
                    featureId: 'coin',
                    selector: '#inputWithdrawAmount',
                    before: safeEnsureCoinConversionModalOpen,
                    title: '10. Nhập số tiền muốn lấy',
                    description: 'Nhập số tiền cần yêu cầu, không vượt quá tổng tiền lộ trình đang hiển thị.',
                    access: 'Kiểm tra số tiền thật kỹ trước khi gửi yêu cầu.'
                },
                {
                    featureId: 'coin',
                    selector: '#cashWithdrawalSection button[onclick*="handleRequestCashSubmit"]',
                    before: safeEnsureCoinConversionModalOpen,
                    title: '11. Gửi yêu cầu cho giáo viên',
                    description: 'Bấm nút này để tạo yêu cầu thật. Giáo viên sẽ duyệt, từ chối hoặc chuyển trạng thái xử lý.',
                    access: 'Hướng dẫn không tự bấm để tránh tạo yêu cầu ngoài ý muốn.'
                },
                {
                    featureId: 'coin',
                    selector: '#cashRequestHistoryContainer',
                    before: safeEnsureCoinConversionModalOpen,
                    after: safeCloseCoinConversionModalForGuide,
                    title: '12. Theo dõi lịch sử yêu cầu',
                    description: 'Danh sách này cho biết số tiền và trạng thái của các yêu cầu trước đó như đang chờ, đang xử lý, hoàn tất hoặc bị từ chối.',
                    access: 'Đóng Bảng quy đổi bằng nút ✖ khi xem xong.'
                }
            );
        } else {
            coinGuideSteps.push({
                featureId: 'coin',
                selector: '#coinWidget [onclick*="openCoinConversionModal"]',
                before: temporarilyRevealCoinWidgetForGuide,
                skipIfMissing: true,
                title: 'Bảng quy đổi hiện chưa mở được',
                description: getCoinConversionUnavailableText(),
                access: 'Khi hết điều kiện khóa, bấm dấu ! trên thanh Coin để mở lại.'
            });
        }

        return [
            { featureId: 'todo', tabId: 'tab-todo', title: 'Mở Bài tập cần làm', description: 'Đây là danh sách bài giáo viên đã giao cho em.', access: 'Bấm Tiếp theo để xem cách tìm và mở bài.' },
            { featureId: 'todo', tabId: 'tab-todo', selector: '#tab-todo input[type="text"]', title: 'Tìm bài tập', description: 'Nhập tên bài để lọc nhanh danh sách.', access: 'Xóa từ khóa để hiện lại tất cả bài.' },
            { featureId: 'todo', tabId: 'tab-todo', selector: '#assignmentsList', title: 'Mở bài cần làm', description: 'Mỗi thẻ hiển thị thông tin bài, hạn nộp và nút thao tác. Chọn đúng bài rồi bắt đầu làm hoặc nộp tệp theo yêu cầu.', access: 'Đọc kỹ yêu cầu và thời gian trước khi bấm làm bài.' },

            {
                featureId: 'submission-guide',
                tabId: 'tab-todo',
                selector: '#nug-submission-demo',
                before: () => setSubmissionGuideDemoState('intro'),
                title: '1. Nhận biết bài tập mô phỏng',
                description: 'Hệ thống tạo một bài giả ngay trên trang để em học cách nộp bài. Bài này chỉ tồn tại trong hướng dẫn, không ghi Firebase/R2, không tạo điểm và không xuất hiện cho giáo viên.',
                access: 'Nhìn nhãn “MÔ PHỎNG HƯỚNG DẪN · KHÔNG GỬI DỮ LIỆU” để phân biệt với bài thật.'
            },
            {
                featureId: 'submission-guide',
                tabId: 'tab-todo',
                selector: '#nug-submission-demo-answer',
                before: () => setSubmissionGuideDemoState('ready'),
                title: '2. Hoàn thành nội dung trước khi nộp',
                description: 'Làm đủ phần trắc nghiệm và tự luận giáo viên yêu cầu. Với tự luận thông thường, hệ thống kiểm tra tối thiểu 25 từ hoặc có tệp đính kèm; bài chỉ yêu cầu tệp thì phải có tệp.',
                access: 'Đọc kỹ yêu cầu từng bài thật vì giáo viên có thể cấu hình loại bài khác nhau.'
            },
            {
                featureId: 'submission-guide',
                tabId: 'tab-todo',
                selector: '#nug-submission-demo-files',
                before: () => setSubmissionGuideDemoState('valid-file'),
                title: '3. Tệp hợp lệ sẽ nằm trong danh sách chờ',
                description: 'Sau khi chọn file thật, kiểm tra tên và dung lượng trong danh sách đang chờ nộp. Có thể xóa file chọn nhầm trước khi bấm Nộp bài.',
                access: 'Ví dụ mô phỏng đang dùng PDF 2,35 MB nên nằm trong giới hạn.'
            },
            {
                featureId: 'submission-guide',
                tabId: 'tab-todo',
                selector: '#nug-submission-demo-alert',
                before: () => setSubmissionGuideDemoState('oversize'),
                title: '4. Lỗi giả: File quá dung lượng',
                description: 'Đây là cảnh báo mô phỏng đúng theo giới hạn hiện tại: file thường tối đa 7 MB/file, file âm thanh tối đa 30 MB/file. File vượt ngưỡng bị tự động loại khỏi danh sách chờ.',
                access: 'Cách xử lý: giảm dung lượng, chia nhỏ hoặc chọn file khác. Sau đó kiểm tra lại danh sách chờ nộp.'
            },
            {
                featureId: 'submission-guide',
                tabId: 'tab-todo',
                selector: '#nug-submission-demo-alert',
                before: () => setSubmissionGuideDemoState('short-essay'),
                title: '5. Lỗi giả: Tự luận quá ngắn hoặc thiếu tệp',
                description: 'Nếu bài tự luận thông thường dưới 25 từ và không có file, website sẽ cảnh báo phần tự luận có thể không được công nhận và nhận 0 điểm. Nếu bài được đặt chế độ chỉ nộp tệp thì thiếu tệp cũng bị cảnh báo.',
                access: 'Không bấm xác nhận bỏ qua cảnh báo nếu em vẫn còn thời gian bổ sung bài.'
            },
            {
                featureId: 'submission-guide',
                tabId: 'tab-todo',
                selector: '#nug-submission-demo-alert',
                before: () => setSubmissionGuideDemoState('unanswered'),
                title: '6. Lỗi giả: Còn câu trắc nghiệm chưa trả lời',
                description: 'Nếu còn câu chưa chọn đáp án, hệ thống sẽ báo số câu còn thiếu và đưa em tới câu đầu tiên chưa làm. Hoàn thành các câu được đánh dấu rồi mới nộp lại.',
                access: 'Kiểm tra toàn bộ câu trước khi bấm Nộp bài, nhất là bài có nhiều câu.'
            },
            {
                featureId: 'submission-guide',
                tabId: 'tab-todo',
                selector: '#nug-submission-demo-alert',
                before: () => setSubmissionGuideDemoState('deadline'),
                title: '7. Lỗi giả: Sát hạn hoặc đã quá hạn',
                description: 'Dưới 15 giây trước hạn, hệ thống có thể khóa nộp để chuẩn bị đồng bộ. Khi đã quá hạn, chức năng nộp bị khóa. Đây là lý do không nên chờ đến những giây cuối.',
                access: 'Nếu đã quá hạn và cần hỗ trợ, liên hệ giáo viên; không bấm nộp liên tục.'
            },
            {
                featureId: 'submission-guide',
                tabId: 'tab-todo',
                selector: '#nug-submission-demo-alert',
                before: () => setSubmissionGuideDemoState('network'),
                title: '8. Lỗi giả: Mất mạng hoặc máy chủ chưa phản hồi',
                description: 'Nếu chưa có thông báo thành công, bài chưa được coi là đã nộp. Giữ nguyên trang, kiểm tra Wi-Fi/4G, chờ kết nối ổn định rồi thử lại.',
                access: 'Trong lúc file đang tải hoặc bài đang lưu, không đóng tab và không bấm Nộp bài nhiều lần.'
            },
            {
                featureId: 'submission-guide',
                tabId: 'tab-todo',
                selector: '#nug-submission-demo-alert',
                before: () => setSubmissionGuideDemoState('success'),
                after: removeSubmissionGuideDemo,
                title: '9. Chỉ rời trang khi đã báo thành công',
                description: 'Khi nộp bài thật, chỉ rời trang sau khi website báo nộp thành công và trạng thái bài đã thay đổi. Nếu chỉ thấy cảnh báo lỗi thì chưa được tính là đã nộp.',
                access: 'Khi nghi ngờ, mở lại Bài tập cần làm/Kết quả học tập để kiểm tra trạng thái.'
            },

            { featureId: 'grades', tabId: 'tab-grades', title: 'Mở Kết quả học tập', description: 'Xem các bài đã nộp và kết quả giáo viên chấm.', access: 'Bấm Tiếp theo để xem danh sách điểm.' },
            { featureId: 'grades', tabId: 'tab-grades', selector: '#tab-grades input[type="text"]', title: 'Tìm kết quả', description: 'Tìm theo tên bài hoặc điểm số.', access: 'Dùng khi có nhiều bài đã nộp.' },
            { featureId: 'grades', tabId: 'tab-grades', selector: '#gradesList', title: 'Xem điểm và nhận xét', description: 'Mở từng bài để xem điểm, nhận xét và tệp chữa bài nếu giáo viên có gửi.', access: 'Nếu chưa có điểm, bài có thể đang chờ chấm.' },

            { featureId: 'review-practice', tabId: 'tab-grades', title: 'Mở nơi xem lại và luyện lại', description: 'Chức năng nằm trong Kết quả học tập, bên trong từng bài đã nộp.', access: 'Nếu chưa có bài phù hợp, hệ thống hướng dẫn sẽ chèn một thẻ bài mẫu tạm thời.' },
            { featureId: 'review-practice', tabId: 'tab-grades', selector: ['#gradesList button[onclick*="viewAssignmentQuestions"]', '#nug-demo-open-review'], before: prepareQuestionsReviewEntryForGuide, waitMs: 250, title: '1. Bấm Xem lại tất cả câu hỏi', description: 'Mở một bài đã nộp rồi bấm nút này để xem toàn bộ nội dung câu hỏi và các phương án lựa chọn.', access: 'Bài mẫu chỉ xuất hiện khi tài khoản chưa có bài trắc nghiệm phù hợp và sẽ tự xóa sau hướng dẫn.' },
            { featureId: 'review-practice', selector: ['#viewQuestionsModal > div', '#nug-demo-review-modal .nug-demo-review-card'], before: openQuestionsReviewForGuide, waitMs: 450, title: '2. Giao diện xem lại câu hỏi', description: 'Cửa sổ này hiển thị tiêu đề bài, mã đề nếu có, phần trắc nghiệm và phần yêu cầu tự luận nếu bài có.', access: 'Cuộn bên trong cửa sổ để xem hết nội dung.' },
            { featureId: 'review-practice', selector: ['#viewQuestionsModal h4 + div', '#nug-demo-review-question-list'], before: openQuestionsReviewForGuide, waitMs: 180, title: '3. Xem từng câu và các lựa chọn', description: 'Đọc lại câu hỏi cùng bốn lựa chọn A, B, C, D. Đây là bước ôn lại nội dung trước khi làm lại.', access: 'Đáp án đúng sẽ được phản hồi sau khi em nộp bài luyện tập.' },
            { featureId: 'review-practice', selector: ['#btnPracticeRedoFromReview', '#nug-demo-start-practice'], before: openQuestionsReviewForGuide, title: '4. Bấm Làm lại trắc nghiệm', description: 'Nút này mở chế độ luyện lại chỉ dành cho phần trắc nghiệm.', access: 'Kết quả luyện lại không ghi vào Firebase, không thay đổi điểm và bị xóa khi đóng popup.' },
            { featureId: 'review-practice', selector: '#practiceRedoWarningModal .practice-warning-box', before: openPracticeWarningForGuide, waitMs: 260, skipIfMissing: true, title: '5. Đọc cảnh báo luyện tập', description: 'Hệ thống nhắc rằng đây chỉ là ôn luyện, không lưu kết quả và không ảnh hưởng điểm chính thức.', access: 'Bấm Đã rõ để vào bài luyện; hướng dẫn sẽ tự mở ở bước tiếp theo.' },
            { featureId: 'review-practice', selector: '#btnConfirmPracticeRedo', before: openPracticeWarningForGuide, skipIfMissing: true, title: '6. Xác nhận Đã rõ', description: 'Bấm nút này để mở bài trắc nghiệm luyện lại.', access: 'Nút Hủy sẽ quay về mà không bắt đầu luyện.' },
            { featureId: 'review-practice', selector: '#practiceRedoModal .practice-redo-box', before: openPracticeModalForGuide, waitMs: 360, skipIfMissing: true, title: '7. Bài luyện lại trắc nghiệm', description: 'Popup luyện tập hiển thị các câu hỏi của bài. Đáp án và điểm chỉ tồn tại trong lần mở này.', access: 'Khi đóng popup, toàn bộ lựa chọn và kết quả luyện tập sẽ bị xóa.' },
            { featureId: 'review-practice', selector: '#practiceRedoModal .practice-redo-question:first-of-type', before: openPracticeModalForGuide, skipIfMissing: true, title: '8. Chọn đáp án cho từng câu', description: 'Chạm hoặc bấm vào một lựa chọn A, B, C hoặc D. Cần trả lời đủ tất cả câu trước khi chấm.', access: 'Câu chưa chọn sẽ được đánh dấu và hệ thống chưa cho chấm điểm.' },
            { featureId: 'review-practice', selector: '#btnSubmitPracticeRedo', before: openPracticeModalForGuide, skipIfMissing: true, title: '9. Nộp và chấm điểm', description: 'Sau khi chọn đủ đáp án, bấm nút này để hệ thống chấm ngay trong popup luyện tập.', access: 'Đây không phải nút nộp bài chính thức và không thay đổi bài đã nộp.' },
            { featureId: 'review-practice', selector: ['#practiceRedoResult.show', '#practiceRedoModal .practice-redo-feedback', '#practiceRedoModal .practice-redo-box'], before: () => { openPracticeModalForGuide(); showDemoPracticeResultForGuide(); }, waitMs: 250, title: '10. Xem câu đúng, câu sai và điểm', description: 'Sau khi chấm, đáp án đúng được tô xanh; lựa chọn sai được tô đỏ; mỗi câu có phản hồi và phía trên hiện điểm thang 10.', access: 'Với bài mẫu, hướng dẫn tự chấm một lượt để minh họa. Với bài thật, em tự chọn đáp án rồi bấm Nộp và chấm điểm; mọi kết quả luyện đều không được lưu.' },
            { featureId: 'review-practice', selector: ['#btnClosePracticeRedo', '#btnClosePracticeRedoTop'], before: openPracticeModalForGuide, after: closeReviewPracticeDialogsForGuide, skipIfMissing: true, title: '11. Đóng bài luyện', description: 'Bấm Đóng hoặc dấu ✖ khi luyện xong.', access: 'Mọi đáp án và điểm luyện tập sẽ bị xóa; điểm chính thức vẫn giữ nguyên.' },

            { featureId: 'materials', tabId: 'tab-materials', title: 'Mở Tài liệu học tập', description: 'Tài liệu giáo viên giao chung hoặc riêng xuất hiện tại đây.', access: 'Bấm Tiếp theo để xem cách tìm.' },
            { featureId: 'materials', tabId: 'tab-materials', selector: '#tab-materials input[type="text"]', title: 'Tìm tài liệu', description: 'Nhập tên bài giảng hoặc tài liệu.', access: 'Xóa từ khóa để xem lại toàn bộ.' },
            { featureId: 'materials', tabId: 'tab-materials', selector: '#studentMaterialsList', title: 'Mở tệp hoặc liên kết', description: 'Chọn tài liệu muốn học. Một tài liệu có thể gồm nội dung, liên kết hoặc tệp tải xuống.', access: 'Chỉ mở liên kết được giáo viên cung cấp.' },

            { featureId: 'roadmap', tabId: 'tab-roadmap', title: 'Mở Lộ trình & Lịch', description: 'Mục này gồm lộ trình cá nhân và thời khóa biểu.', access: 'Hai nút phía trên dùng để chuyển chế độ.' },
            { featureId: 'roadmap', tabId: 'tab-roadmap', selector: '#studentRoadmapBody', before: () => runIfFunction('toggleRoadmapView', 'roadmap'), title: 'Xem lộ trình cá nhân', description: 'Bảng này cho biết tiến độ và các mốc học tập của em.', access: 'Theo dõi trạng thái từng mục để biết việc tiếp theo.' },
            { featureId: 'roadmap', tabId: 'tab-roadmap', selector: '#totalRoadmapMoney', before: () => runIfFunction('toggleRoadmapView', 'roadmap'), title: 'Xem tiền tích lũy', description: 'Đây là tổng tiền tích lũy theo lộ trình, không phải số Coin trong cửa hàng.', access: 'Bảng quy đổi chỉ mở khi giáo viên cho phép.' },
            { featureId: 'roadmap', tabId: 'tab-roadmap', selector: '#btnSubSchedule', title: 'Chuyển sang thời khóa biểu', description: 'Bấm nút này để xem lịch học.', access: 'Hướng dẫn sẽ tự mở lịch ở bước sau.' },
            { featureId: 'roadmap', tabId: 'tab-roadmap', selector: '#studentScheduleBody', before: () => runIfFunction('toggleRoadmapView', 'schedule'), title: 'Xem lịch học', description: 'Bảng lịch hiển thị thời gian, môn hoặc nội dung và ghi chú. Lịch có thể là lịch chung hoặc lịch riêng cho em.', access: 'Kiểm tra lịch thường xuyên để không bỏ lỡ buổi học.' },
            { featureId: 'roadmap', tabId: 'tab-roadmap', selector: 'button[onclick*="downloadStudentRoadmapPDF"]', before: () => runIfFunction('toggleRoadmapView', 'roadmap'), title: 'Tải lộ trình PDF', description: 'Dùng nút này khi cần lưu hoặc in lộ trình.', access: 'Nội dung tải xuống phụ thuộc chế độ đang hiển thị.' },

            { featureId: 'games', tabId: 'tab-game', title: 'Mở Trò chơi', description: 'Nếu giáo viên khóa, trang sẽ hiện thông báo và không cho tham gia.', access: 'Chỉ chơi khi không có bài thi đang hoạt động.' },
            { featureId: 'games', tabId: 'tab-game', selector: 'button[onclick*="openLuckyWheel"]', title: 'Vòng quay may mắn', description: 'Bấm Chơi ngay để mở vòng quay. Mỗi lượt có thể cần vé.', access: 'Kiểm tra số vé trước khi quay.' },
            { featureId: 'games', tabId: 'tab-game', selector: 'button[onclick*="showRoyalBallRewards"]', title: 'Xem phần thưởng Dạ hội', description: 'Nút dấu hỏi bên cạnh Dạ hội giải thích phần thưởng và luật chơi.', access: 'Đọc phần thưởng trước khi tham gia.' },
            { featureId: 'games', tabId: 'tab-game', selector: '#btnRoyalJoin', title: 'Tham gia Dạ hội', description: 'Nút chỉ hoạt động khi sự kiện đang mở đúng lịch và giáo viên không khóa.', access: 'Bấm Tham gia ngay khi nút đang mở.' },

            { featureId: 'store', tabId: 'tab-store', title: 'Mở Cửa hàng', description: 'Cửa hàng bán giao diện, hiệu ứng, thú cưng và nhạc nền bằng Coin.', access: 'Nếu giáo viên khóa cửa hàng, em cần quay lại sau.' },
            { featureId: 'store', tabId: 'tab-store', selector: '#tab-store .btn-approve', title: '1. Lọc loại vật phẩm', description: 'Chọn Tất cả, Giao diện, Hiệu ứng, Thú cưng hoặc Nhạc nền.', access: 'Bộ lọc chỉ thay đổi danh sách đang xem.' },
            { featureId: 'store', tabId: 'tab-store', selector: ['#storeItemsContainer .store-item-card', '#storeItemsContainer'], title: '2. Chọn vật phẩm', description: 'Mỗi thẻ cho biết tên, loại, trạng thái và các nút Dùng thử, Mua hoặc Trang bị.', access: 'Vật phẩm sự kiện hoặc đang khóa có thể không mua được.' },
            { featureId: 'store', tabId: 'tab-store', selector: ['#storeItemsContainer .store-item-card .btn-buy:not([disabled])', '#storeItemsContainer'], title: '3. Bấm Mua đứt', description: 'Khi mua thật, bấm nút Mua đứt trên vật phẩm. Hệ thống sẽ mở bảng thanh toán; bước này không tự mua.', access: 'Dùng thử 24 giờ thường có giá bằng một phần giá vật phẩm.' },
            { featureId: 'store', selector: '#nug-demo-checkout .nug-demo-checkout-card', before: ensureDemoCheckout, title: '4. Bảng thanh toán', description: 'Bảng thanh toán cho biết vật phẩm, số dư và giá gốc. Đây là bảng mô phỏng an toàn.', access: 'Bấm Tiếp theo để học cách chọn mã giảm giá.' },
            { featureId: 'store', selector: '#nug-demo-discount', before: () => { if (!document.getElementById('nug-demo-checkout')) ensureDemoCheckout(); }, title: '5. Chọn mã giảm giá', description: 'Mở danh sách và chọn thẻ phù hợp. Thẻ không áp dụng cho món hiện tại sẽ không làm giảm giá.', access: 'Em có thể thử chọn 10%, 25% hoặc 50% ngay trên bảng mẫu.' },
            { featureId: 'store', selector: '#nug-demo-total', before: () => { if (!document.getElementById('nug-demo-checkout')) ensureDemoCheckout(); }, title: '6. Kiểm tra giá cuối', description: 'Sau khi chọn mã, giá giảm và tổng thanh toán sẽ tự cập nhật.', access: 'Luôn kiểm tra tổng Coin phải trả trước khi xác nhận.' },
            { featureId: 'store', selector: '#nug-demo-confirm', before: () => { if (!document.getElementById('nug-demo-checkout')) ensureDemoCheckout(); }, after: removeDemoCheckout, title: '7. Xác nhận mua', description: 'Khi mua thật, bấm Xác nhận mua một lần và chờ hệ thống xử lý. Nút đang thấy chỉ là mô phỏng, không trừ Coin.', access: 'Sau khi mua thành công, vật phẩm xuất hiện trong Túi đồ.' },

            { featureId: 'collections', tabId: 'tab-store', selector: '#storeCollectionArrow', before: safeCloseCollectionPageForGuide, waitMs: 280, skipIfMissing: true, title: '1. Mở menu Sưu tầm', description: 'Bấm nút mũi tên nhỏ cạnh tiêu đề Cửa hàng Vật phẩm để làm trượt xuống mục chuyển trang.', access: 'Mũi tên chỉ mở menu; chưa chuyển trang ngay.' },
            { featureId: 'collections', tabId: 'tab-store', selector: '#storeCollectionOpenButton', before: safeOpenCollectionMenuForGuide, waitMs: 280, skipIfMissing: true, title: '2. Chọn Sưu tầm', description: 'Trong menu vừa mở, bấm Sưu tầm để chuyển toàn bộ nội dung từ Cửa hàng sang trang Sưu tầm.', access: 'Khi đã vào, tiêu đề và chữ trên thanh bên sẽ đổi thành Sưu tầm.' },
            { featureId: 'collections', tabId: 'tab-store', selector: '#storeCollectionTabs', before: () => safeOpenCollectionPageForGuide('all'), waitMs: 360, skipIfMissing: true, title: '3. Lướt các bộ sưu tầm', description: 'Thanh danh mục nằm trên một hàng ngang. Dùng con lăn chuột, touchpad, vuốt cảm ứng hoặc phím mũi tên trái/phải để lướt.', access: 'Bấm trực tiếp vào Tất cả, Đời thường, Quỷ Bí Chi Chủ, Truyền thuyết, Cổ tích, Vũ trụ, Sinh nhật, Thất Đại Tội, Hội họa hoặc Doraemon.' },
            { featureId: 'collections', tabId: 'tab-store', selector: ['#storeCollectionSummary', '#storeCollectionTabs'], before: () => safeOpenCollectionPageForGuide('all'), waitMs: 220, skipIfMissing: true, title: '4. Xem tên bộ và tiến độ sở hữu', description: 'Dòng tóm tắt cho biết bộ đang chọn và số vật phẩm đã sưu tầm trên tổng số vật phẩm của bộ.', access: 'Danh sách được ghép tự động theo tag trong cấu hình Cửa hàng.' },
            { featureId: 'collections', tabId: 'tab-store', selector: ['#storeCollectionGrid .store-collection-card', '#storeCollectionGrid'], before: () => safeOpenCollectionPageForGuide('all'), waitMs: 260, skipIfMissing: true, title: '5. Phân biệt vật phẩm đã và chưa sở hữu', description: 'Vật phẩm chưa sở hữu hiển thị màu xám và có nhãn Chưa sở hữu. Khi vật phẩm đã có trong Túi đồ vĩnh viễn, thẻ sẽ hiện đủ màu và đổi thành Đã sưu tầm.', access: 'Vật phẩm dùng thử không được tính vào tiến độ Sưu tầm.' },
            { featureId: 'collections', tabId: 'tab-store', selector: '#storeCollectionRewards', before: () => safeOpenCollectionPageForGuide('daily-life'), waitMs: 300, skipIfMissing: true, title: '6. Theo dõi mốc thưởng Coin', description: 'Mỗi bộ riêng có các mốc 3, 5, 10, 15 và 20 vật phẩm. Khi đạt mốc, phần thưởng tương ứng được cộng thẳng vào số dư Coin và mốc đổi thành Đã nhận.', access: 'Mỗi mốc chỉ được nhận một lần; mục Tất cả sưu tầm không có thanh thưởng riêng.' },
            { featureId: 'collections', tabId: 'tab-store', selector: '#storeCollectionSummary [data-collection-acquisition-info]', before: () => { safeCloseCollectionAcquisitionForGuide(); return safeOpenCollectionPageForGuide('daily-life'); }, waitMs: 260, skipIfMissing: true, title: '7. Mở bảng Cách nhận bằng nút !', description: 'Bấm nút dấu ! cạnh tên bộ để xem cách có thể nhận từng vật phẩm.', access: 'Bản V12 tự đọc dữ liệu hiện tại của website; không nhập sẵn cách nhận riêng cho từng món.' },
            { featureId: 'collections', tabId: 'tab-store', selector: '#storeCollectionAcquisitionModal .store-collection-acquisition-dialog', before: () => safeOpenCollectionAcquisitionForGuide('daily-life'), waitMs: 360, skipIfMissing: true, title: '8. Xem cách nhận được tự phát hiện', description: 'Bảng này đọc giá, lịch mở bán, trạng thái khóa và nút hành động do Cửa hàng sinh ra để nhận biết mua bằng Coin, đổi Xu, chờ mở bán, nhận từ sự kiện hoặc chưa có cách nhận được công bố.', access: 'Mỗi vật phẩm có thể hiển thị nhiều cách hoặc trạng thái cùng lúc.' },
            { featureId: 'collections', selector: '#storeCollectionAcquisitionModal .store-collection-acquisition-refresh', before: () => safeOpenCollectionAcquisitionForGuide('daily-life'), after: safeCloseCollectionAcquisitionForGuide, waitMs: 260, skipIfMissing: true, title: '9. Quét lại dữ liệu hiện tại', description: 'Bấm Quét lại sau khi giáo viên đổi giá, khóa/mở vật phẩm, thay lịch bán hoặc cập nhật cấu hình website.', access: 'Quét lại chỉ đọc dữ liệu; không mua vật phẩm và không thay đổi Túi đồ.' },
            { featureId: 'collections', tabId: 'tab-store', selector: '#storeCollectionArrow', before: () => { safeCloseCollectionAcquisitionForGuide(); return safeOpenCollectionPageForGuide('all'); }, waitMs: 220, skipIfMissing: true, title: '10. Mở menu để quay lại', description: 'Khi đang ở trang Sưu tầm, bấm lại mũi tên cạnh tiêu đề để mở mục Cửa hàng.', access: 'Lúc này nút Sưu tầm đã đổi thành Cửa hàng.' },
            { featureId: 'collections', tabId: 'tab-store', selector: '#storeCollectionOpenButton', before: safeOpenCollectionReturnMenuForGuide, after: safeCloseCollectionPageForGuide, waitMs: 280, skipIfMissing: true, title: '11. Quay lại Cửa hàng', description: 'Bấm Cửa hàng để trở lại danh sách vật phẩm có chức năng lọc, mua, dùng thử và trang bị.', access: 'Hướng dẫn sẽ tự trả giao diện về Cửa hàng sau bước này.' },

            { featureId: 'bag', selector: '.bag-trigger-btn', title: 'Mở Túi đồ', description: 'Bấm nút Túi đồ ở phía trên để xem vé, thẻ giảm giá và vật phẩm đã nhận.', access: 'Hướng dẫn sẽ mở Túi đồ ở bước tiếp theo.' },
            { featureId: 'bag', selector: '#studentBagModal .modal-content', before: safeOpenStudentBag, waitMs: 500, skipIfMissing: true, title: 'Giao diện Túi đồ', description: 'Túi đồ gom các vật phẩm của em theo dạng ô.', access: 'Bấm Tiếp theo để xem các ô vật phẩm.' },
            { featureId: 'bag', selector: ['#studentBagBody .bag-inventory-slot', '#studentBagBody'], before: safeOpenStudentBag, waitMs: 450, after: safeCloseStudentBag, skipIfMissing: true, title: 'Xem chi tiết vật phẩm', description: 'Nhấn giữ một ô khoảng nửa giây để mở thông tin chi tiết. Thẻ giảm giá hết hạn có thể có nút bán lại; rương có nút mở.', access: 'Đóng Túi đồ bằng nút X khi xem xong.' },

            { featureId: 'inbox', selector: '.inbox-trigger-btn', title: 'Mở Hộp thư', description: 'Thông báo và quà giáo viên gửi xuất hiện trong Hộp thư.', access: 'Hướng dẫn sẽ mở thư ở bước tiếp theo.' },
            { featureId: 'inbox', selector: '#studentInboxBody', before: safeOpenStudentInbox, waitMs: 450, after: safeCloseStudentInbox, skipIfMissing: true, title: 'Đọc thư và nhận quà', description: 'Mở từng thư, đọc lời nhắn và dùng nút nhận quà nếu thư có Coin, vật phẩm hoặc thẻ giảm giá.', access: 'Chỉ bấm nhận một lần và chờ thông báo thành công.' },

            ...profileGuideSteps,

            { featureId: 'leaderboard', selector: '.leaderboard-trigger-btn', skipIfMissing: true, title: 'Mở Bảng xếp hạng', description: 'Bấm nút Cúp để xem thứ hạng thi đua khi giáo viên bật chức năng.', access: 'Thứ hạng có thể thay đổi theo dữ liệu mới.' },
            ...coinGuideSteps,

            { featureId: 'system-update', tabId: 'tab-settings', selector: '#updateBannerArea', title: '1. Xem trạng thái cập nhật', description: 'Khu vực Cập nhật hệ thống cho biết phiên bản em đang dùng, bản mới nhất, lần kiểm tra gần nhất và trạng thái cập nhật.', access: 'Website có thể tự kiểm tra; em vẫn có thể bấm Kiểm tra lại khi cần.' },
            { featureId: 'system-update', tabId: 'tab-settings', selector: '#updateBannerArea [data-update-action="check"]', skipIfMissing: true, title: '2. Kiểm tra lại', description: 'Bấm Kiểm tra lại để hỏi máy chủ ngay. Nếu báo Ngoại tuyến, kiểm tra Wi-Fi/4G hoặc Internet rồi thử lại.', access: 'Chờ website trả về Đã mới nhất hoặc Có bản mới; không bấm liên tục.' },
            { featureId: 'system-update', tabId: 'tab-settings', selector: '#updateBannerArea [data-update-action="details"]', skipIfMissing: true, title: '3. Xem bản cập nhật có gì mới', description: 'Nếu có bản mới, nút Chi tiết hiển thị ghi chú thay đổi và thông tin phiên bản nếu máy chủ cung cấp.', access: 'Đọc trước rồi mới chọn Cập nhật ngay.' },
            { featureId: 'system-update', tabId: 'tab-settings', selector: '#updateBannerArea [data-update-action="apply"]', skipIfMissing: true, title: '4. Cập nhật an toàn', description: 'Khi bấm Cập nhật ngay, website sẽ làm mới tài nguyên rồi tải lại sang bản mới. Không đóng tab, tải lại thủ công hoặc thoát trang trong lúc thanh tiến trình đang chạy.', access: 'Bản cập nhật bắt buộc sẽ không có nút Để sau.' },
            { featureId: 'system-update', tabId: 'tab-settings', selector: '#updateBannerArea', title: '5. Nếu cập nhật gặp lỗi', description: 'Ngoại tuyến hoặc lỗi kiểm tra: kết nối Internet ổn định rồi bấm Kiểm tra lại. Nếu cập nhật chưa hoàn tất, đọc thông báo và thử lại sau; không xóa dữ liệu học tập để sửa lỗi cập nhật.', access: 'Sau khi cập nhật thành công, website tự tải lại và có thể hiện thông báo phiên bản mới.' },

            { featureId: 'effects-performance', tabId: 'tab-settings', selector: '#effectQualitySettingsRow', skipIfMissing: true, title: '1. Mức hiệu ứng vật phẩm & web', description: 'Chức năng này chỉ giảm chuyển động, hạt và lớp trang trí của vật phẩm, thú cưng và Web Animations. Nó không làm mất vật phẩm, không đổi theme và không đổi dữ liệu.', access: 'Bật công tắc để chọn mức phù hợp với máy.' },
            { featureId: 'effects-performance', tabId: 'tab-settings', selector: '#toggleEffectQualityManager', skipIfMissing: true, title: '2. Bật điều chỉnh hiệu ứng', description: 'Khi tắt, website dùng hiệu ứng gốc. Khi bật: Cao giữ đầy đủ; Trung bình giảm một phần; Thấp ưu tiên ổn định và giảm mạnh phần trang trí động.', access: 'Nếu máy bắt đầu giật, thử Trung bình trước.' },
            { featureId: 'effects-performance', tabId: 'tab-settings', selector: ['#effectQualityLevelControls:not([hidden])', '#effectQualitySettingsRow'], skipIfMissing: true, title: '3. Chọn mức phù hợp', description: 'Cao phù hợp máy chạy mượt; Trung bình cân bằng hình ảnh và hiệu năng; Thấp dành cho máy yếu hoặc khi website giật/nóng.', access: 'Mức này chỉ ảnh hưởng phần hiệu ứng hiển thị.' },
            { featureId: 'effects-performance', tabId: 'tab-settings', selector: '#webPerformanceOptimizerSettingsRow', skipIfMissing: true, title: '4. Tối ưu hiệu năng', description: 'Đây là chức năng riêng với Mức hiệu ứng. Nó giảm tải nền và nội dung hiển thị nặng; phía học sinh còn tối ưu danh sách bài, video và trình soạn thảo khi cần. Trên điện thoại/thiết bị cảm ứng màn hình nhỏ, chế độ này có thể tự bật ở lần đầu; máy tính giữ lựa chọn đã lưu.', access: 'Không thay đổi điểm, bài làm, Coin, trò chơi hay vật phẩm.' },
            { featureId: 'effects-performance', tabId: 'tab-settings', selector: '#toggleWebPerformanceOptimizer', skipIfMissing: true, title: '5. Cách dùng khi máy chậm', description: 'Nếu trang giật hoặc máy nóng, bật Tối ưu hiệu năng. Nếu vẫn nặng, bật thêm Mức hiệu ứng và chọn Trung bình hoặc Thấp. Hai tùy chọn có thể dùng cùng nhau.', access: 'Dòng trạng thái ngay dưới công tắc cho biết chế độ hiện tại; có thể đổi lại bất cứ lúc nào.' },

            { featureId: 'settings', tabId: 'tab-settings', title: 'Mở Cài đặt', description: 'Chỉnh tùy chọn cá nhân và gửi yêu cầu đổi thông tin.', access: 'Bấm Tiếp theo để xem từng tùy chọn.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#nugDetailedGuideSetting', title: 'Ẩn hoặc hiện nút Hướng dẫn chi tiết', description: state.mandatoryMode ? 'Học sinh mới phải hoàn thành hướng dẫn bắt buộc nên công tắc này tạm khóa. Sau bước cuối, em có thể tắt nút dấu hỏi nếu không muốn nút nổi trên màn hình.' : 'Công tắc này ẩn hoặc hiện nút dấu hỏi nổi. Tắt nút không xóa tiến độ hay nội dung hướng dẫn.', access: 'Nếu đã ẩn, vào lại Cài đặt để bật nút bất cứ lúc nào.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#togglePetInteractions', title: 'Bật/tắt tương tác thú cưng', description: 'Tắt khi không muốn thao tác chạm hoặc nhấn trên thú cưng.', access: 'Nút dấu hỏi bên cạnh giải thích cách tương tác.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#toggleCoinBalanceWidget', title: 'Ẩn hoặc hiện thanh Coin', description: 'Chỉ thay đổi giao diện, không làm mất Coin.', access: 'Có thể bật lại bất cứ lúc nào.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#themeSelector', title: 'Chọn giao diện cơ bản', description: 'Chọn màu giao diện tài khoản. Giao diện vật phẩm được trang bị từ cửa hàng hoạt động riêng.', access: 'Thay đổi được áp dụng theo tùy chọn của trang.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: '#settingName', title: 'Gửi yêu cầu đổi thông tin', description: 'Nhập tên mới hoặc mật khẩu mới rồi bấm Gửi yêu cầu thay đổi. Giáo viên sẽ xem và duyệt.', access: 'Để trống phần không muốn đổi.' },
            { featureId: 'settings', tabId: 'tab-settings', selector: 'button[onclick*="runSystemDiagnostics"]', title: 'Quét lỗi hệ thống', description: 'Dùng khi dữ liệu, bài tập hoặc giao diện không hoạt động đúng.', access: 'Đọc kết quả rồi báo giáo viên nếu lỗi vẫn còn.' }
        ];
    }

    function buildTourSteps(featureId = null) {
        const data = roleData[state.role];
        const detailSteps = state.role === 'teacher'
            ? teacherTourSteps()
            : studentTourSteps();

        const selectedSteps = featureId
            ? detailSteps.filter(step => step.featureId === featureId)
            : detailSteps;

        const feature = state.features.find(item => item.id === featureId);
        const introTarget = feature
            ? (
                feature.id === 'coin' && isCoinWidgetHidden()
                    ? getNavSelector('tab-settings')
                    : (feature.selector || (feature.tabId ? getNavSelector(feature.tabId) : '.dashboard'))
            )
            : (document.querySelector('.sidebar') ? '.sidebar' : '.dashboard');

        return [
            {
                id: 'welcome',
                title: feature
                    ? `Hướng dẫn: ${feature.title}`
                    : data.welcomeTitle,
                description: feature
                    ? `Hệ thống sẽ chỉ từng thao tác trong mục “${feature.title}”. Bấm “Tiếp theo” để đi tiếp; hướng dẫn không tự xác nhận mua, gửi, xóa hoặc thay đổi dữ liệu.`
                    : `${data.welcomeText} Hướng dẫn không tự bấm các nút xác nhận có thể thay đổi dữ liệu.`,
                access: 'Có thể dùng phím ← và → hoặc các nút bên dưới.',
                selector: introTarget,
                tabId: feature?.tabId || null
            },
            ...selectedSteps,
            {
                id: 'finish',
                title: feature ? `Đã xem xong: ${feature.title}` : 'Đã hoàn thành hướng dẫn',
                description: state.launcherVisible
                    ? 'Bấm dấu hỏi ở góc trên bên phải để mở lại hướng dẫn hoặc chọn một mục khác.'
                    : 'Nút Hướng dẫn chi tiết đang được ẩn. Khi cần mở lại, vào Cài đặt và bật công tắc “Hiển thị nút Hướng dẫn chi tiết”.',
                access: 'Bấm Hoàn tất để quay lại website.',
                selector: (
                    state.mandatoryMode ||
                    !state.launcherVisible
                )
                    ? '.dashboard'
                    : '.nug-launcher'
            }
        ];
    }

    function buildRequiredTrainingTourSteps() {
        const detailSteps = studentTourSteps()
            .filter(step =>
                REQUIRED_STUDENT_TRAINING_FEATURES
                    .includes(step.featureId)
            );

        return [
            {
                id: 'required-training-welcome',
                title: 'Hướng dẫn bắt buộc: Nộp bài, cập nhật & hiệu năng',
                description:
                    'Website có một số chức năng quan trọng em cần biết: cách nộp bài và xử lý lỗi, kiểm tra cập nhật, mức hiệu ứng vật phẩm & web và tối ưu hiệu năng. Mỗi học sinh chỉ phải hoàn thành mô-đun này một lần.',
                access:
                    'Hướng dẫn có mô phỏng an toàn; không gửi bài giả, không đổi điểm, Coin, vật phẩm hoặc dữ liệu tài khoản.',
                selector: '.dashboard'
            },
            ...detailSteps,
            {
                id: 'required-training-finish',
                title: 'Đã hoàn thành hướng dẫn bắt buộc',
                description:
                    'Em đã xem xong cách nộp bài, nhận biết các lỗi thường gặp, kiểm tra cập nhật và điều chỉnh hiệu ứng/hiệu năng. Từ lần sau hệ thống không bắt xem lại mô-đun này.',
                access:
                    'Bấm Hoàn tất. Khi cần, em vẫn có thể mở nút dấu hỏi và xem lại từng mục.',
                selector: '.dashboard'
            }
        ];
    }

    function startTour(featureId = null, options = {}) {
        if (
            state.mandatoryStartPending &&
            options.mandatory !== true
        ) {
            showToast('Hãy xử lý xong các cửa sổ bắt buộc trước.');
            return false;
        }

        if (state.mandatoryMode && options.mandatory !== true) {
            showToast('Hướng dẫn bắt buộc đang diễn ra. Hãy tiếp tục đến bước cuối.');
            return false;
        }

        const mandatory = Boolean(
            options.mandatory === true &&
            state.role === 'student'
        );

        state.mandatoryMode = mandatory;
        state.mandatoryScope = mandatory
            ? (
                options.mandatoryScope === 'training'
                    ? 'training'
                    : 'full'
            )
            : 'full';
        state.mandatoryTourCompleted = false;
        state.mandatoryStartPending = false;
        state.mandatoryGateQuietSince = 0;
        syncMandatoryLauncherVisibility();

        if (mandatory) {
            installMandatoryDialogMonitor();
        }

        closePanel({
            force: true,
            markSeen: false
        });

        if (!mandatory) {
            markAsSeen();
        }

        removeDemoCheckout();
        removeSubmissionGuideDemo();
        closeReviewPracticeDialogsForGuide();
        safeCloseStudentBag();
        safeCloseStudentInbox();
        safeCloseStudentProfileForGuide();
        safeCloseCoinConversionModalForGuide();
        restoreCoinWidgetAfterGuide();
        state.coinWidgetTemporarilyRevealed = false;
        state.coinWidgetInitialStoredVisibility = null;

        const dashboard = document.querySelector('.dashboard');
        state.previousSidebarCollapsed = dashboard
            ? dashboard.classList.contains('collapsed')
            : null;

        state.activeFeatureTour = mandatory
            ? (
                state.mandatoryScope === 'training'
                    ? 'required-training'
                    : null
            )
            : (featureId || null);

        state.tourSteps = (
            mandatory &&
            state.mandatoryScope === 'training'
        )
            ? buildRequiredTrainingTourSteps()
            : buildTourSteps(
                mandatory ? null : featureId
            );
        state.currentStep = -1;

        const layer = document.getElementById('nug-tour-layer');
        if (layer) {
            layer.classList.add('is-open');
            layer.setAttribute('aria-hidden', 'false');
        }

        if (mandatory && getVisibleExternalDialogs().length > 0) {
            setMandatoryTourSuspended(true);
        } else {
            setMandatoryTourSuspended(false);
        }

        const startIndex = mandatory && options.resume !== false
            ? readMandatoryProgress(state.tourSteps.length - 1)
            : 0;

        showTourStep(startIndex);
        return true;
    }

    function startFeatureTour(featureId) {
        if (state.mandatoryMode || state.mandatoryStartPending) {
            showToast(
                state.mandatoryStartPending
                    ? 'Hãy xử lý xong các cửa sổ bắt buộc trước.'
                    : 'Hãy hoàn thành hướng dẫn bắt buộc trước.'
            );
            return false;
        }

        const feature = state.features.find(item => item.id === featureId);
        if (!feature) {
            showToast('Không tìm thấy hướng dẫn của mục này.');
            return false;
        }
        startTour(featureId);
        return true;
    }

    async function showTourStep(index) {
        if (!state.tourSteps.length || state.transitionLocked) return;
        state.transitionLocked = true;

        try {
            const direction = index >= state.currentStep ? 1 : -1;
            const previousStep = state.tourSteps[state.currentStep];

            if (previousStep && typeof previousStep.after === 'function') {
                try {
                    await previousStep.after();
                } catch (_) {
                    // Không để lỗi dọn giao diện chặn hướng dẫn.
                }
            }

            if (index < 0) index = 0;
            if (index >= state.tourSteps.length) {
                endTour(true, { completed: true });
                showToast('Hoàn thành hướng dẫn. Bấm dấu “?” để xem lại khi cần.');
                return;
            }

            let step = null;
            let target = null;
            let candidateIndex = index;

            while (candidateIndex >= 0 && candidateIndex < state.tourSteps.length) {
                step = state.tourSteps[candidateIndex];
                target = await prepareStep(step);

                if (target || !step.skipIfMissing) break;
                candidateIndex += direction;
            }

            if (!step || candidateIndex < 0 || candidateIndex >= state.tourSteps.length) {
                endTour(true, { completed: true });
                return;
            }

            state.currentStep = candidateIndex;
            saveMandatoryProgress(candidateIndex);
            state.activeTarget = target || document.querySelector('.dashboard') || document.body;
            renderTourContent(step);
            updateTourPosition();
        } finally {
            state.transitionLocked = false;
        }
    }

    async function prepareStep(step) {
        const dashboard = document.querySelector('.dashboard');
        let sidebarChanged = false;

        /*
         * Điện thoại:
         * - Chỉ mở sidebar khi bước hiện tại đang giới thiệu chính menu/nút điều hướng.
         * - Khi hướng dẫn nội dung bên trong tab, đóng sidebar để nó không phủ lên input,
         *   danh sách hoặc nút đang cần tô sáng.
         */
        if (isMobileGuideViewport()) {
            sidebarChanged = setMobileSidebarForStep(step, dashboard);
        } else if (step.tabId && dashboard?.classList.contains('collapsed')) {
            dashboard.classList.remove('collapsed');
            sidebarChanged = true;
        }

        if (step.tabId) {
            const navButton = getNavButton(step.tabId);
            const tab = document.getElementById(step.tabId);

            if (navButton && tab && !tab.classList.contains('active')) {
                try {
                    navButton.click();
                } catch (_) {
                    activateTabFallback(step.tabId, navButton);
                }
            }
        }

        if (typeof step.before === 'function') {
            try {
                await step.before();
            } catch (_) {
                // Bỏ qua lỗi của thao tác chuẩn bị và tiếp tục tìm mục tiêu.
            }
        }

        await waitForLayout();

        /* mobile.css dùng transition 0.3 giây cho sidebar. Chờ xong rồi mới đo vị trí. */
        if (sidebarChanged && isMobileGuideViewport()) {
            await wait(340);
        }

        if (step.waitMs) await wait(step.waitMs);

        let target = resolveTarget(step, false);
        if (target) {
            await revealHiddenAccordion(target);
            target = resolveTarget(step, false) || target;
        }

        if (target && !isElementVisible(target)) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            await wait(280);
        }

        return target;
    }

    async function revealHiddenAccordion(target) {
        if (!target || isElementVisible(target)) return;
        const accordion = target.closest('.accordion-card');
        const header = accordion?.querySelector('.accordion-header');
        if (header) {
            try {
                header.click();
                await wait(220);
            } catch (_) {
                // Bỏ qua nếu nhóm không hỗ trợ mở bằng click.
            }
        }
    }

    function activateTabFallback(tabId, navButton) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(button => button.classList.remove('active'));
        document.getElementById(tabId)?.classList.add('active');
        navButton?.classList.add('active');
    }

    function getNavButton(tabId) {
        return [...document.querySelectorAll('.nav-item')].find(button =>
            String(button.getAttribute('onclick') || '').includes(tabId)
        ) || null;
    }

    function getNavSelector(tabId) {
        const button = getNavButton(tabId);
        if (!button) return `#${CSS.escape(tabId)}`;

        if (!button.dataset.nugNavTarget) {
            button.dataset.nugNavTarget = tabId;
        }

        return `.nav-item[data-nug-nav-target="${CSS.escape(tabId)}"]`;
    }

    function resolveTarget(step, useFallback = true) {
        const selectors = Array.isArray(step.selector)
            ? step.selector
            : (step.selector ? [step.selector] : []);

        for (const selector of selectors) {
            try {
                const selected = document.querySelector(selector);
                if (selected) return selected;
            } catch (_) {
                // Thử selector tiếp theo.
            }
        }

        if (step.tabId) {
            const tabTarget = getNavButton(step.tabId) || document.getElementById(step.tabId);
            if (tabTarget) return tabTarget;
        }

        return useFallback
            ? (document.querySelector('.dashboard') || document.body)
            : null;
    }

    function isElementVisible(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
    }

    function renderTourContent(step) {
        const total = state.tourSteps.length;
        const current = state.currentStep + 1;

        const count = document.getElementById('nug-step-count');
        const title = document.getElementById('nug-tooltip-title');
        const text = document.getElementById('nug-tooltip-text');
        const access = document.getElementById('nug-tooltip-access');
        const progress = document.getElementById('nug-progress-bar');
        const previous = document.getElementById('nug-previous');
        const next = document.getElementById('nug-next');
        const skip = document.querySelector('[data-nug-action="end-tour"]');
        const tooltip = document.getElementById('nug-tooltip');
        const mandatoryShield = document.getElementById('nug-mandatory-shield');
        const mandatory = state.mandatoryMode;

        if (count) {
            count.textContent = mandatory
                ? `🔒 Hướng dẫn bắt buộc · Bước ${current}/${total}`
                : `Bước ${current}/${total} · ${step.icon || '💡'}`;
        }

        if (title) title.textContent = step.title;
        if (text) {
            const firstMandatoryText =
                state.mandatoryScope === 'training'
                    ? 'Đây là mô-đun hướng dẫn cập nhật bắt buộc. Mỗi học sinh chỉ cần xem một lần để nắm cách nộp bài, xử lý lỗi, kiểm tra cập nhật và tối ưu hiệu năng.'
                    : 'Đây là hướng dẫn bắt buộc dành cho học sinh mới. Em cần bấm “Tiếp theo” và xem đủ các bước để bắt đầu sử dụng website.';

            text.textContent = mandatory && state.currentStep === 0
                ? firstMandatoryText
                : step.description;
        }
        if (access) {
            access.textContent = mandatory && state.currentStep === 0
                ? 'Không thể bỏ qua, quay lại hoặc đóng hướng dẫn. Tiến độ được lưu để tiếp tục nếu tải lại trang.'
                : (step.access || '');
        }
        if (progress) progress.style.width = `${Math.round((current / total) * 100)}%`;

        skip?.classList.toggle('nug-forced-hidden', mandatory);
        previous?.classList.toggle('nug-forced-hidden', mandatory);
        tooltip?.classList.toggle('is-mandatory', mandatory);
        mandatoryShield?.classList.toggle('is-active', mandatory);
        mandatoryShield?.setAttribute('aria-hidden', String(!mandatory));

        if (previous) previous.disabled = mandatory || state.currentStep === 0;
        if (next) next.textContent = state.currentStep === total - 1 ? 'Hoàn tất ✓' : 'Tiếp theo →';
    }

    function updateTourPosition() {
        const layer = document.getElementById('nug-tour-layer');
        if (!layer?.classList.contains('is-open')) return;

        const target = state.activeTarget || document.body;
        const highlight = document.getElementById('nug-highlight');
        const tooltip = document.getElementById('nug-tooltip');
        if (!highlight || !tooltip) return;

        const viewportWidth = Math.max(1, window.innerWidth);
        const viewportHeight = Math.max(1, window.innerHeight);
        const rawRect = target.getBoundingClientRect();
        const padding = target === document.body ? 0 : 7;

        const left = clamp(rawRect.left - padding, 8, viewportWidth - 8);
        const top = clamp(rawRect.top - padding, 8, viewportHeight - 8);
        const right = clamp(rawRect.right + padding, 8, viewportWidth - 8);
        const bottom = clamp(rawRect.bottom + padding, 8, viewportHeight - 8);
        const width = Math.max(1, right - left);
        const height = Math.max(1, bottom - top);

        Object.assign(highlight.style, {
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`
        });

        positionMasks(left, top, right, bottom, viewportWidth, viewportHeight);
        positionTooltip(tooltip, { left, top, right, bottom, width, height }, viewportWidth, viewportHeight);
    }

    function positionMasks(left, top, right, bottom, viewportWidth, viewportHeight) {
        const topMask = document.querySelector('[data-mask="top"]');
        const rightMask = document.querySelector('[data-mask="right"]');
        const bottomMask = document.querySelector('[data-mask="bottom"]');
        const leftMask = document.querySelector('[data-mask="left"]');

        if (topMask) Object.assign(topMask.style, { left: '0', top: '0', width: '100vw', height: `${top}px` });
        if (bottomMask) Object.assign(bottomMask.style, { left: '0', top: `${bottom}px`, width: '100vw', height: `${Math.max(0, viewportHeight - bottom)}px` });
        if (leftMask) Object.assign(leftMask.style, { left: '0', top: `${top}px`, width: `${left}px`, height: `${Math.max(0, bottom - top)}px` });
        if (rightMask) Object.assign(rightMask.style, { left: `${right}px`, top: `${top}px`, width: `${Math.max(0, viewportWidth - right)}px`, height: `${Math.max(0, bottom - top)}px` });
    }

    function positionTooltip(tooltip, rect, viewportWidth, viewportHeight) {
        const gap = 14;
        const margin = isMobileGuideViewport() ? 10 : 12;

        /* Xóa các giá trị của lần đặt trước, nhất là khi vừa xoay màn hình. */
        Object.assign(tooltip.style, {
            right: 'auto',
            bottom: 'auto'
        });

        if (isMobileGuideViewport()) {
            const safeWidth = Math.max(1, viewportWidth - margin * 2);
            const maxTooltipHeight = Math.max(
                230,
                Math.min(390, Math.floor(viewportHeight * 0.46))
            );

            Object.assign(tooltip.style, {
                width: `${safeWidth}px`,
                maxWidth: `${safeWidth}px`,
                maxHeight: `${maxTooltipHeight}px`,
                overflowY: 'auto'
            });

            const measured = tooltip.getBoundingClientRect();
            const tooltipHeight = Math.min(
                measured.height || maxTooltipHeight,
                maxTooltipHeight
            );

            const targetCenter = rect.top + rect.height / 2;
            const spaceAbove = Math.max(0, rect.top - margin);
            const spaceBelow = Math.max(0, viewportHeight - rect.bottom - margin);

            /*
             * Mục tiêu ở nửa trên -> tooltip nằm sát đáy.
             * Mục tiêu ở nửa dưới -> tooltip nằm sát đỉnh.
             * Khi mục tiêu ở giữa, chọn phía có nhiều khoảng trống hơn.
             */
            let placeAtTop;

            if (targetCenter >= viewportHeight * 0.58) {
                placeAtTop = true;
            } else if (targetCenter <= viewportHeight * 0.42) {
                placeAtTop = false;
            } else {
                placeAtTop = spaceAbove > spaceBelow;
            }

            let top = placeAtTop
                ? margin
                : viewportHeight - tooltipHeight - margin;

            /* Nếu vị trí dự kiến vẫn đè trực tiếp lên mục tiêu thì đổi sang phía còn lại. */
            const proposedBottom = top + tooltipHeight;
            const overlapsTarget = !(
                proposedBottom + gap <= rect.top ||
                top >= rect.bottom + gap
            );

            if (overlapsTarget) {
                const alternateTop = placeAtTop
                    ? viewportHeight - tooltipHeight - margin
                    : margin;

                const alternateBottom = alternateTop + tooltipHeight;
                const alternateOverlaps = !(
                    alternateBottom + gap <= rect.top ||
                    alternateTop >= rect.bottom + gap
                );

                if (!alternateOverlaps) {
                    top = alternateTop;
                }
            }

            top = clamp(top, margin, Math.max(margin, viewportHeight - tooltipHeight - margin));

            Object.assign(tooltip.style, {
                left: `${margin}px`,
                top: `${Math.round(top)}px`
            });

            return;
        }

        /* Trở về kích thước desktop sau khi đổi từ mobile sang màn hình lớn. */
        Object.assign(tooltip.style, {
            width: '',
            maxWidth: '',
            maxHeight: '',
            overflowY: ''
        });

        const tooltipRect = tooltip.getBoundingClientRect();
        const tooltipWidth = tooltipRect.width || Math.min(390, viewportWidth - 24);
        const tooltipHeight = tooltipRect.height || 280;

        const spaces = {
            right: viewportWidth - rect.right,
            left: rect.left,
            bottom: viewportHeight - rect.bottom,
            top: rect.top
        };

        let placement = 'bottom';
        if (spaces.right >= tooltipWidth + gap) placement = 'right';
        else if (spaces.left >= tooltipWidth + gap) placement = 'left';
        else if (spaces.bottom >= tooltipHeight + gap) placement = 'bottom';
        else placement = 'top';

        let left;
        let top;

        if (placement === 'right') {
            left = rect.right + gap;
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
        } else if (placement === 'left') {
            left = rect.left - tooltipWidth - gap;
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
        } else if (placement === 'top') {
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            top = rect.top - tooltipHeight - gap;
        } else {
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            top = rect.bottom + gap;
        }

        left = clamp(left, margin, viewportWidth - tooltipWidth - margin);
        top = clamp(top, margin, viewportHeight - tooltipHeight - margin);

        Object.assign(tooltip.style, {
            left: `${Math.round(left)}px`,
            top: `${Math.round(top)}px`
        });
    }

    function scheduleTourPositionUpdate() {
        clearTimeout(state.resizeTimer);
        state.resizeTimer = setTimeout(updateTourPosition, 60);
    }

    function endTour(markSeen = true, options = {}) {
        const completed = options.completed === true;

        if (state.mandatoryMode && !completed) {
            showToast('Hướng dẫn bắt buộc chưa hoàn thành. Hãy bấm Tiếp theo.');
            return false;
        }

        const wasMandatory = state.mandatoryMode;
        const completedMandatoryScope =
            state.mandatoryScope;
        const layer = document.getElementById('nug-tour-layer');
        if (layer) {
            layer.classList.remove('is-open');
            layer.setAttribute('aria-hidden', 'true');
        }

        const currentStep = state.tourSteps[state.currentStep];
        if (currentStep && typeof currentStep.after === 'function') {
            try { currentStep.after(); } catch (_) { /* Dọn giao diện tốt nhất có thể. */ }
        }

        removeDemoCheckout();
        removeSubmissionGuideDemo();
        closeReviewPracticeDialogsForGuide();
        safeCloseStudentBag();
        safeCloseStudentInbox();
        safeCloseStudentProfileForGuide();
        safeCloseCoinConversionModalForGuide();
        restoreCoinWidgetAfterGuide();
        safeCloseCollectionPageForGuide();

        state.currentStep = -1;
        state.activeTarget = null;
        state.activeFeatureTour = null;
        state.transitionLocked = false;
        state.mandatoryTourCompleted = wasMandatory && completed;
        state.mandatoryMode = false;
        state.mandatoryScope = 'full';
        state.mandatorySuspended = false;
        syncMandatoryLauncherVisibility();

        if (wasMandatory && completed) {
            stopMandatoryDialogMonitor();
        }

        const dashboard = document.querySelector('.dashboard');
        if (dashboard && state.previousSidebarCollapsed === true) {
            dashboard.classList.add('collapsed');
        }
        state.previousSidebarCollapsed = null;

        if (wasMandatory && completed) {
            if (completedMandatoryScope === 'training') {
                markRequiredTrainingAsCompleted();
            } else {
                markGuideAsCompleted();
            }

            applyLauncherVisibility(
                getSavedLauncherVisibility(),
                false
            );
        } else if (markSeen) {
            markAsSeen();
        }

        syncLauncherVisibilitySetting();
        return true;
    }

    async function goToFeature(featureId) {
        if (state.mandatoryMode || state.mandatoryStartPending) {
            showToast(
                state.mandatoryStartPending
                    ? 'Hãy xử lý xong các cửa sổ bắt buộc trước.'
                    : 'Hãy hoàn thành hướng dẫn bắt buộc trước.'
            );
            return false;
        }

        const feature = state.features.find(item => item.id === featureId);
        if (!feature) {
            showToast('Không tìm thấy chức năng này.');
            return false;
        }

        closePanel();

        if (feature.tabId) {
            const dashboard = document.querySelector('.dashboard');

            const navButton = getNavButton(feature.tabId);
            if (navButton) {
                navButton.click();
            } else {
                activateTabFallback(feature.tabId, null);
            }

            /* Sau khi chọn mục trên điện thoại, đóng menu để hiện trọn nội dung tab. */
            if (isMobileGuideViewport()) {
                dashboard?.classList.add('collapsed');
                await wait(340);
            } else {
                dashboard?.classList.remove('collapsed');
            }

            await waitForLayout();
            const target = document.getElementById(feature.tabId);
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            flashTarget(target || navButton);
            showToast(`Đã mở: ${feature.title}`);
            return true;
        }

        if (typeof feature.action === 'function') {
            const result = feature.action();
            await waitForLayout();
            flashTarget(resolveTarget(feature));
            if (result !== false) {
                showToast(`Đã mở: ${feature.title}`);
                return true;
            }
        }

        const target = resolveTarget(feature);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            flashTarget(target);
            showToast(`Vị trí chức năng: ${feature.title}`);
            return true;
        }

        showToast('Chức năng này chưa xuất hiện trên trang hoặc đang bị khóa.');
        return false;
    }

    function flashTarget(target) {
        if (!target) return;

        const oldOutline = target.style.outline;
        const oldOffset = target.style.outlineOffset;
        const oldTransition = target.style.transition;

        target.style.transition = 'outline-color .2s ease, box-shadow .2s ease';
        target.style.outline = '4px solid #7c6df2';
        target.style.outlineOffset = '4px';

        setTimeout(() => {
            target.style.outline = oldOutline;
            target.style.outlineOffset = oldOffset;
            target.style.transition = oldTransition;
        }, 2200);
    }

    function showToast(message) {
        const toast = document.getElementById('nug-toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
    }

    function wait(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    function waitForLayout() {
        return new Promise(resolve => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
    }

    function clamp(value, min, max) {
        if (max < min) return min;
        return Math.min(Math.max(value, min), max);
    }

    async function resetGuide(options = {}) {
        const suffix = `:${state.role}:${getGuideUsername()}`;
        const keysToRemove = [];

        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);

            if (
                key &&
                key.startsWith('new_user_guide_seen:') &&
                key.endsWith(suffix)
            ) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        localStorage.removeItem(getCompletionStorageKey());
        localStorage.removeItem(getProgressStorageKey());
        localStorage.removeItem(
            getTrainingCompletionStorageKey()
        );
        localStorage.removeItem(
            getTrainingProgressStorageKey()
        );
        state.remoteGuideCompleted = false;
        state.remoteTrainingCompleted = false;
        state.remoteGuideStatus = 'unknown';
        state.remoteMandatoryProgress = 0;
        state.remoteTrainingProgress = 0;
        state.remoteProgressPendingIndex = null;

        if (options.remote === true && state.role === 'student') {
            const authUser = await waitForFirebaseAuthUser();
            const database = getFirebaseDatabaseForGuide();
            const path = getRemoteCompletionPath(authUser);

            if (database && path) {
                try {
                    await database.ref(path).remove();
                } catch (error) {
                    console.warn(
                        'Không thể xóa trạng thái hướng dẫn trên Firebase:',
                        error
                    );
                }
            }
        }

        showToast(
            options.remote === true
                ? 'Đã đặt lại cả trạng thái Firebase. Tải lại trang để kiểm tra chế độ bắt buộc.'
                : 'Đã xóa cache hướng dẫn trên trình duyệt. Trạng thái Firebase vẫn được giữ.'
        );
        return true;
    }

    async function init() {
        if (state.initialized || state.initializing) return;
        state.initializing = true;

        try {
            state.user = readCurrentUser();
            state.role = detectRole();
            state.features = roleData[state.role].features;

            /*
             * Phải kiểm tra Firebase trước khi quyết định đây có phải học sinh
             * mới hay không. Nhờ vậy xóa localStorage/cookie không làm tour
             * bắt buộc chạy lại với tài khoản đã hoàn thành.
             */
            const completionState =
                await resolveGuideCompletionState();

            injectStyles();
            buildInterface();
            installStudentProfileEnhancement();
            injectGuideVisibilitySetting();
            applyLauncherVisibility(
                getSavedLauncherVisibility(),
                false
            );

            state.initialized = true;

            if (
                state.role === 'student' &&
                completionState.completed === false
            ) {
                /*
                 * Học sinh mới: chạy toàn bộ tour bắt buộc. Tour đầy đủ đã chứa
                 * mô-đun nộp bài/cập nhật/hiệu năng nên khi hoàn tất sẽ đánh dấu
                 * cả hai trạng thái.
                 */
                queueMandatoryStudentTour('full');
            } else if (
                state.role === 'student' &&
                completionState.completed === true &&
                completionState.trainingCompleted === false
            ) {
                /*
                 * Học sinh cũ đã hoàn thành onboarding chỉ phải xem phần mới
                 * một lần, không bị ép xem lại toàn bộ hướng dẫn cũ.
                 */
                queueMandatoryStudentTour('training');
            } else if (state.role !== 'student') {
                /*
                 * Giáo viên luôn vào thẳng trang làm việc. Trung tâm hướng dẫn
                 * chỉ mở khi giáo viên chủ động bấm nút dấu hỏi hoặc gọi
                 * NewUserGuide.open(). Không tự mở theo trạng thái hoàn thành,
                 * kể cả khi đăng nhập ở trình duyệt/thiết bị mới.
                 */
            }
        } catch (error) {
            console.error('Khởi tạo hướng dẫn thất bại:', error);

            /*
             * Chỉ dùng localStorage làm phương án dự phòng. Không tự ép tour
             * khi chưa kiểm tra được Firebase, tránh bắt học sinh cũ xem lại
             * vì lỗi mạng tạm thời.
             */
            if (!document.getElementById(ROOT_ID)) {
                injectStyles();
                buildInterface();
                installStudentProfileEnhancement();
                injectGuideVisibilitySetting();
                applyLauncherVisibility(
                    getSavedLauncherVisibility(),
                    false
                );
            }

            state.initialized = true;

            if (
                state.role === 'student' &&
                hasCompletedGuideLocally() === false
            ) {
                showToast(
                    'Chưa thể kiểm tra trạng thái hướng dẫn trên máy chủ. Hệ thống sẽ không bắt xem lại cho đến khi kết nối ổn định.'
                );
            }
        } finally {
            state.initializing = false;
        }
    }

    window.NewUserGuide = Object.freeze({
        version: VERSION,
        init,
        open: openPanel,
        close: closePanel,
        start: startTour,
        startFeature: startFeatureTour,
        end: () => endTour(true),
        reset: resetGuide,
        resetRemote: () => resetGuide({ remote: true }),
        goTo: goToFeature,
        setLauncherVisible: toggleDetailedGuideLauncher,
        isLauncherVisible: () => state.launcherVisible,
        getRole: () => state.role,
        getFeatures: () => state.features.map(feature => ({
            id: feature.id,
            title: feature.title,
            description: feature.description,
            access: feature.access,
            details: [...(feature.details || [])]
        }))
    });

    const runInitSafely = () => {
        Promise.resolve(init()).catch(error => {
            console.error('Không thể chạy Hướng dẫn người mới:', error);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            runInitSafely,
            { once: true }
        );
    } else {
        runInitSafely();
    }
})();
