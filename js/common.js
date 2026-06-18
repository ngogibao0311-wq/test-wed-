const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const userVal = document.getElementById('username').value;
        const passVal = document.getElementById('password').value;

        // Tải danh sách user từ server
        let users = await getDB('users');

        // Nếu DB chưa có ai (mới tạo), tự động cấp 2 tài khoản mẫu
        if (users.length === 0) {
            await pushDB('users', { username: 'gv1', password: '123', role: 'teacher', name: 'Giáo viên A' });
            await pushDB('users', { username: 'hs1', password: '123', role: 'student', name: 'Học sinh B' });
            users = await getDB('users'); // Tải lại
        }

        const user = users.find(u => u.username === userVal && u.password === passVal);

        if (user) {
            // ========================================================
            // THÊM LOGIC CHẶN ĐĂNG NHẬP KHI TÀI KHOẢN BỊ KHÓA
            // ========================================================
            if (user.isLocked) {
                document.getElementById('errorMsg').innerHTML = '🔒 LỖI: Tài khoản đã bị khóa tạm thời.<br>Vui lòng liên hệ Giáo viên để giải quyết!';
                return; // Dừng tiến trình đăng nhập ngay lập tức
            }

            // Nếu không bị khóa thì mới cho lưu phiên và vào trong
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = user.role === 'teacher' ? 'teacher.html' : 'student.html';
        } else {
            document.getElementById('errorMsg').innerText = 'Sai tài khoản hoặc mật khẩu!';
        }
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ==============================================================
// HÀM XỬ LÝ ĐÓNG / MỞ CARD (ACCORDION)
// ==============================================================
window.toggleAccordion = function (contentId, headerElement) {
    const content = document.getElementById(contentId);
    if (content) {
        content.classList.toggle('active');
        headerElement.classList.toggle('active');
    }
};

// ==============================================================
// HỆ THỐNG KIỂM TRA CẬP NHẬT PHIÊN BẢN TỪ GITHUB (TRÁNH CACHE)
// ==============================================================
let currentAppVersion = localStorage.getItem('appVersion') || '1.0.0';
let latestAppVersion = currentAppVersion;

async function checkForUpdates() {
    try {
        // Gắn thêm timestamp (?t=...) để ép trình duyệt không dùng bộ nhớ đệm khi tải file này
        const response = await fetch('version.json?t=' + new Date().getTime());
        if (!response.ok) return;

        const data = await response.json();
        latestAppVersion = data.version;

        // Nếu số phiên bản trên GitHub khác số đang lưu trong máy
        if (latestAppVersion !== currentAppVersion) {
            // Hiện chấm đỏ nhấp nháy ở Menu
            const navBtn = document.getElementById('btnSettingsNav');
            if (navBtn) navBtn.classList.add('has-update');

            // Hiện khung màu đỏ trong tab Cài đặt
            const updateBanner = document.getElementById('updateBannerArea');
            if (updateBanner) updateBanner.style.display = 'flex';
        }
    } catch (error) {
        console.log('Không thể kiểm tra cập nhật:', error);
    }
}

window.applySystemUpdate = function () {
    // 1. Lưu phiên bản mới vào máy
    localStorage.setItem('appVersion', latestAppVersion);

    // 2. Xóa sạch bộ nhớ đệm (Cache) của trình duyệt để ép tải lại file HTML/CSS/JS mới
    if ('caches' in window) {
        caches.keys().then((names) => {
            names.forEach(name => { caches.delete(name); });
        });
    }

    // 3. Tải lại trang triệt để
    window.location.reload(true);
};

// Đặt độ trễ 2.5 giây sau khi tải trang mới bắt đầu kiểm tra để web luôn tải nhanh nhất
window.addEventListener('load', () => {
    setTimeout(checkForUpdates, 2500);
});

// ==============================================================
// HỆ THỐNG THAY ĐỔI GIAO DIỆN (ĐỘC LẬP TỪNG TÀI KHOẢN)
// ==============================================================
window.changeTheme = function (themeName, saveToStorage = true) {
    // 1. Xóa các class theme cũ trên thẻ body
    document.body.classList.remove('theme-blue', 'theme-green', 'theme-pink');

    // 2. Thêm class theme mới (nếu không phải mặc định)
    if (themeName !== 'default') {
        document.body.classList.add('theme-' + themeName);
    }

    // 3. Lưu vào bộ nhớ cục bộ THEO TÊN TÀI KHOẢN (VD: appTheme_hs1)
    if (saveToStorage) {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                localStorage.setItem('appTheme_' + user.username, themeName);
            } catch (e) { }
        }
    }
};

// 4. Tự động áp dụng giao diện khi vừa mở trang web lên
function initAppTheme() {
    // Kiểm tra xem có đang ở trang đăng nhập không (index.html hoặc link gốc)
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');

    let savedTheme = 'default'; // Trang đăng nhập luôn dùng mặc định

    // Nếu ĐANG TRONG TRANG GIÁO VIÊN / HỌC SINH thì mới tải theme cá nhân
    if (!isLoginPage) {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                // Lấy theme tương ứng với tài khoản đang đăng nhập
                savedTheme = localStorage.getItem('appTheme_' + user.username) || 'default';
            } catch (e) { }
        }
    }

    // Áp dụng theme (và KHÔNG lưu đè lại vào bộ nhớ nếu đang ở trang đăng nhập)
    changeTheme(savedTheme, !isLoginPage);

    // Cập nhật lại thanh select (dropdown) cho đúng với theme đang chọn
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.value = savedTheme;
    }
}

// Khắc phục lỗi bất đồng bộ: Nếu DOM đã load xong rồi thì chạy luôn, nếu chưa thì chờ
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppTheme);
} else {
    initAppTheme();
}

// ==============================================================
// XỬ LÝ RÚT GỌN / MỞ RỘNG SIDEBAR
// ==============================================================
window.toggleSidebar = function () {
    const dashboard = document.querySelector('.dashboard');
    if (dashboard) {
        dashboard.classList.toggle('collapsed');

        // Lưu trạng thái vào bộ nhớ để F5 không bị mất
        const isCollapsed = dashboard.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
};

// Tự động khôi phục trạng thái thu gọn khi vừa tải trang xong
window.addEventListener('DOMContentLoaded', () => {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const dashboard = document.querySelector('.dashboard');
    if (isCollapsed && dashboard) {
        dashboard.classList.add('collapsed');
    }
});
// ==============================================================
// HÀM TÌM KIẾM DỮ LIỆU ĐA NĂNG (DÙNG CHUNG)
// ==============================================================
window.filterItems = function(containerId, keyword) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const term = keyword.toLowerCase().trim();
    
    // Kiểm tra xem container đang chứa Table (Bảng) hay Div (Card)
    if (container.tagName === 'TBODY' || container.querySelector('table')) {
        // Xử lý tìm kiếm trong Bảng (Ví dụ: Danh sách học sinh)
        const tbody = container.tagName === 'TBODY' ? container : container.querySelector('tbody');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                // Bỏ qua hàng tiêu đề (th) nếu có
                if (row.querySelector('th')) return;
                
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        }
    } else {
        // Xử lý tìm kiếm trong danh sách Card (Ví dụ: Bài tập, Tài liệu)
        const items = container.children;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // Bỏ qua các thẻ thông báo trống (Chưa có bài nộp...)
            if (item.tagName === 'P' && item.innerText.includes('Chưa có')) continue;
            
            // Tìm kiếm dựa trên toàn bộ text hiển thị trong Card đó
            const text = item.innerText.toLowerCase();
            item.style.display = text.includes(term) ? '' : 'none';
        }
    }
};

// =====================================================================
// HỆ THỐNG QUÉT LỖI VÀ CHẨN ĐOÁN WEBSITE (DIAGNOSTICS SCANNER)
// =====================================================================

window.runSystemDiagnostics = async function() {
    const resultBox = document.getElementById('diagnosticResults');
    const statusText = document.getElementById('diagnosticStatus');
    const list = document.getElementById('diagnosticList');
    
    if (!resultBox || !statusText || !list) return alert("Lỗi: Không tìm thấy khung hiển thị kết quả HTML!");

    // Khởi tạo giao diện
    resultBox.style.display = 'block';
    list.innerHTML = '';
    statusText.innerHTML = '<span style="color: #d35400; font-weight: bold;">⏳ Đang tiến hành rà soát hệ thống... Vui lòng đợi!</span>';
    
    let errors = [];
    let warnings = [];
    let passes = 0;

    // Hàm tiện ích in log ra giao diện
    const addLog = (msg, type) => {
        let color = type === 'error' ? '#e11d48' : (type === 'warn' ? '#f59e0b' : '#059669');
        let icon = type === 'error' ? '❌' : (type === 'warn' ? '⚠️' : '✅');
        let li = document.createElement('li');
        li.style.cssText = `color: ${color}; border-bottom: 1px dashed rgba(0,0,0,0.05); padding: 5px 0;`;
        li.innerHTML = `<strong>${icon}</strong> ${msg}`;
        list.appendChild(li);
    };

    // Tạo độ trễ ảo để quét từng phần (tránh đơ trình duyệt)
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        await sleep(500); // ----------------------------------------------------
        // 1. KIỂM TRA BỘ NHỚ LƯU TRỮ VÀ PHIÊN ĐĂNG NHẬP
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            errors.push("Mất dữ liệu phiên đăng nhập (currentUser null).");
        } else {
            passes++;
            if (!user.username || !user.role) errors.push("Dữ liệu người dùng bị hỏng (Thiếu username/role).");
        }

        await sleep(500); // ----------------------------------------------------
        // 2. KIỂM TRA ĐƯỜNG TRUYỀN FIREBASE REALTIME DATABASE
        if (typeof db === 'undefined') {
            errors.push("Không tìm thấy kết nối Firebase Database.");
        } else {
            try {
                // Ping nhẹ lên node users (Giới hạn 1 để không kéo data nặng)
                await db.ref('users').limitToFirst(1).once('value');
                passes++;
            } catch (e) {
                errors.push("Mất kết nối mạng hoặc sai cấu hình Firebase config.js.");
            }
        }

        await sleep(500); // ----------------------------------------------------
        // 3. QUÉT TOÀN BỘ HÌNH ẢNH TRÊN DOM (Phát hiện link chết, lỗi Base64)
        const images = document.querySelectorAll('img');
        let brokenImages = 0;
        images.forEach(img => {
            if (!img.complete || img.naturalWidth === 0) {
                brokenImages++;
                let shortSrc = img.src.length > 50 ? img.src.substring(0, 50) + '...' : img.src;
                warnings.push(`Phát hiện ảnh lỗi hoặc không thể tải: ${shortSrc}`);
            }
        });
        if (brokenImages === 0) passes++;

        await sleep(500); // ----------------------------------------------------
        // 4. KIỂM TRA CẤU TRÚC CỬA HÀNG (StoreConfig)
        if (typeof StoreConfig !== 'undefined' && StoreConfig.items) {
            passes++;
            StoreConfig.items.forEach(item => {
                if (!item.id || !item.type || !item.name) {
                    errors.push(`Vật phẩm cửa hàng bị lỗi cấu trúc: Mất định danh ID hoặc Tên.`);
                }
                if (item.isNonCoin && item.price === undefined) {
                    warnings.push(`Vật phẩm [${item.name}] là hàng phi lợi nhuận nhưng chưa set giá = 0, có thể gây lỗi undefined.`);
                }
            });
        } else {
            warnings.push("Hệ thống cửa hàng chưa được tải (StoreConfig undefined).");
        }

        await sleep(500); // ----------------------------------------------------
        // 5. KIỂM TRA XUNG ĐỘT QUẢN LÝ TỆP (DataTransfer)
        if (user && user.role === 'student' && typeof window.studentSubmitDTs === 'undefined') {
            errors.push("Biến quản lý file cộng dồn của học sinh (studentSubmitDTs) bị hỏng hoặc chưa khởi tạo.");
        } else if (user && user.role === 'teacher' && typeof window.teacherGradeDTs === 'undefined') {
            errors.push("Biến quản lý file chấm bài của giáo viên (teacherGradeDTs) bị hỏng.");
        } else {
            passes++;
        }

        await sleep(500); // ----------------------------------------------------
// 6. KIỂM TRA CÁC BIẾN TOÀN CỤC HOẠT ĐỘNG (ĐỒNG BỘ TRÒ CHƠI)
        if (typeof window.wheelProbs === 'undefined') {
            warnings.push("Cấu hình tỉ lệ vòng quay đang trống, game sẽ dùng mặc định cứng.");
        }
        
        // Tiến hành kiểm tra động: Nếu chưa có biến, thử đợi Firebase phản hồi trong 1 giây trước khi báo lỗi
        if (typeof window.isGameEnabled === 'undefined') {
            let retryCount = 0;
            while (retryCount < 5 && typeof window.isGameEnabled === 'undefined') {
                await sleep(200); // Đợi thêm 200ms mỗi lần để Firebase kịp kéo data
                retryCount++;
            }
        }

        // Sau khi đã đợi mà vẫn không có dữ liệu thì mới xác nhận là mất đồng bộ dữ liệu hoặc lỗi kết nối
        if (typeof window.isGameEnabled === 'undefined') {
            warnings.push("Hệ thống chưa nhận được trạng thái Trò chơi (isGameEnabled undefined). Vui lòng kiểm tra lại cấu hình node 'game_settings' trên Firebase.");
        } else {
            passes++;
        }
        // === KẾT LUẬN VÀ IN BÁO CÁO ===
        statusText.innerHTML = `<span style="color: #2c3e50; font-weight: bold;">Hoàn tất quét hệ thống!</span>`;
        
        if (errors.length === 0 && warnings.length === 0) {
            addLog(`Hệ thống đang hoạt động hoàn hảo. (Vượt qua ${passes}/5 bài test lõi)`, 'success');
        } else {
            addLog(`Vượt qua ${passes} bài kiểm tra an toàn.`, 'success');
            warnings.forEach(w => addLog(w, 'warn'));
            errors.forEach(e => addLog(e, 'error'));
        }

    } catch (criticalError) {
        statusText.innerHTML = `<span style="color: #e11d48; font-weight: bold;">Lỗi nghiêm trọng khi đang quét hệ thống!</span>`;
        addLog(`Crashed: ${criticalError.message}`, 'error');
    }
};