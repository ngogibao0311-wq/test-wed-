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