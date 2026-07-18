const loginForm = document.getElementById('loginForm');
let lockoutInterval = null;

// ==========================================
// HỆ THỐNG BẢO MẬT: DẤU VÂN TAY THIẾT BỊ
// ==========================================
// Hàm này tạo ra một ID cố định dựa trên phần cứng và trình duyệt của thiết bị
function getDeviceID() {
    const deviceInfo = navigator.userAgent + screen.width + screen.height + navigator.language;
    let hash = 0;
    for (let i = 0; i < deviceInfo.length; i++) {
        hash = ((hash << 5) - hash) + deviceInfo.charCodeAt(i);
        hash |= 0;
    }
    return 'dev_' + Math.abs(hash);
}

const DEVICE_ID = getDeviceID();

// Vẫn giữ LocalStorage/Cookie làm lớp phòng thủ đầu tiên cho nhẹ Server
function getLockoutData(key) {
    let val = localStorage.getItem(key);
    if (!val) {
        const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
        if (match) val = match[2];
    }
    return val;
}

function setLockoutData(key, value, expireSeconds) {
    localStorage.setItem(key, value);
    if (expireSeconds > 0) {
        document.cookie = `${key}=${value}; max-age=${expireSeconds}; path=/`;
    } else {
        document.cookie = `${key}=; max-age=0; path=/`;
    }
}

async function clearAllLockouts() {
    localStorage.removeItem('_sys_df');
    localStorage.removeItem('_sys_dl');
    document.cookie = '_sys_df=; max-age=0; path=/';
    document.cookie = '_sys_dl=; max-age=0; path=/';

    // Xóa án phạt trên Server Firebase
    if (typeof db !== 'undefined') {
        try {
            await db.ref('device_locks/' + DEVICE_ID).remove();
        } catch (e) { }
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const userVal = document.getElementById('username').value.trim();
        if (userVal.includes(' ')) {
            errorMsg.innerHTML = '❌ Tên đăng nhập không được chứa khoảng trắng!';
            return;
        }
        const passVal = document.getElementById('password').value.trim();
        const errorMsg = document.getElementById('errorMsg');

        if (lockoutInterval) {
            clearInterval(lockoutInterval);
            lockoutInterval = null;
        }

        errorMsg.innerHTML = '⏳ Đang kiểm tra an ninh thiết bị...';
        errorMsg.style.color = 'blue';

        const now = Date.now();
        let serverLockoutTime = 0;

        // 1. KIỂM TRA ÁN PHẠT TRÊN SERVER FIREBASE (Chống xóa Cache tuyệt đối)
        try {
            const snap = await db.ref('device_locks/' + DEVICE_ID).once('value');
            if (snap.exists()) {
                serverLockoutTime = parseInt(snap.val());
            }
        } catch (err) {
            console.log("Không thể kết nối Server kiểm tra an ninh.");
        }

        const localLockout = parseInt(getLockoutData('_sys_dl') || '0');
        const finalLockoutTime = Math.max(serverLockoutTime, localLockout);

        if (finalLockoutTime > now) {
            startLockoutCountdown(finalLockoutTime, errorMsg);
            return;
        }

        errorMsg.innerHTML = 'Đang xác thực...';
        const fakeEmail = userVal + "@hethong.edu.vn";

        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(fakeEmail, passVal);
            const uid = userCredential.user.uid;

            const snapshot = await db.ref('users/' + uid).once('value');
            const user = snapshot.val();

            if (!user) {
                errorMsg.innerHTML = '❌ Tài khoản không tồn tại dữ liệu trên máy chủ!';
                errorMsg.style.color = 'red';
                return;
            }

            if (user.isLocked) {
                errorMsg.innerHTML = '🔒 LỖI: Tài khoản đã bị khóa.<br>Vui lòng liên hệ Giáo viên để giải quyết!';
                errorMsg.style.color = 'red';
                await firebase.auth().signOut();
                return;
            }

            // Đăng nhập thành công -> Gỡ bỏ hoàn toàn mọi án phạt
            await clearAllLockouts();

            user._fbKey = uid;
            localStorage.setItem('currentUser', JSON.stringify(user));

            if (user.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else {
                window.location.href = 'student.html';
            }

        } catch (error) {
            let currentFails = parseInt(getLockoutData('_sys_df') || '0') + 1;
            let forceLock = false;

            // Bắt lỗi brute-force native từ Firebase
            if (error.code === 'auth/too-many-requests') {
                forceLock = true;
            }

            if (currentFails >= 5 || forceLock) {
                const lockTime = Date.now() + (15 * 60 * 1000); // Phạt 15 phút

                // Lưu cục bộ
                setLockoutData('_sys_dl', lockTime, 15 * 60);
                setLockoutData('_sys_df', '0', 0);

                // LƯU LÊN SERVER FIREBASE (Khóa cứng thiết bị)
                try {
                    await db.ref('device_locks/' + DEVICE_ID).set(lockTime);
                } catch (e) { }

                startLockoutCountdown(lockTime, errorMsg);
            } else {
                setLockoutData('_sys_df', currentFails, 24 * 60 * 60);
                errorMsg.innerHTML = `❌ Sai Tên đăng nhập hoặc Mật khẩu! Thiết bị này còn <b>${5 - currentFails}</b> lần thử.`;
                errorMsg.style.color = 'red';
            }
        }
    });
}

// ==========================================
// HÀM HỖ TRỢ: CHẠY ĐỒNG HỒ ĐẾM NGƯỢC (ĐÃ SỬA LỖI TRÙNG LẶP)
// ==========================================
function startLockoutCountdown(lockoutUntil, errorElement) {
    if (lockoutInterval) clearInterval(lockoutInterval);

    function update() {
        const remain = lockoutUntil - Date.now();
        if (remain <= 0) {
            clearInterval(lockoutInterval);
            lockoutInterval = null;

            errorElement.innerHTML =
                '✅ Hết thời gian phạt! Bạn có thể thử đăng nhập lại.';
            errorElement.style.color = 'green';

            clearAllLockouts().catch(console.error);
            return;
        }

        const minutes = Math.floor(remain / 60000);
        const seconds = Math.floor((remain % 60000) / 1000);
        errorElement.innerHTML = `⏳ Cảnh báo An ninh: Thiết bị nhập sai quá nhiều lần.<br>Khóa đăng nhập từ Server trong: <b style="color:red;">${minutes} phút ${seconds} giây</b>`;
        errorElement.style.color = '#e67e22';
    }

    // Chạy ngay lập tức hàm update() để không bị delay 1 giây ban đầu
    update();
    lockoutInterval = setInterval(update, 1000);
}

// ==============================================================
// QUẢN LÝ FIREBASE REALTIME LISTENERS - CHỐNG MEMORY LEAK
// ==============================================================

window.firebaseListenerRegistry = window.firebaseListenerRegistry || [];

window.listenFirebase = function (queryOrRef, eventType, callback, cancelCallbackOrContext, context) {
    if (!queryOrRef || typeof queryOrRef.on !== 'function') {
        console.warn('⚠️ listenFirebase nhận ref/query không hợp lệ:', queryOrRef);
        return callback;
    }

    queryOrRef.on(eventType, callback, cancelCallbackOrContext, context);

    window.firebaseListenerRegistry.push({
        ref: queryOrRef,
        eventType,
        callback,
        context
    });

    return callback;
};

window.cleanupFirebaseListeners = function () {
    const list = window.firebaseListenerRegistry || [];

    list.forEach(item => {
        try {
            item.ref.off(item.eventType, item.callback, item.context);
        } catch (err) {
            console.warn('⚠️ Không thể gỡ Firebase listener:', err);
        }
    });

    window.firebaseListenerRegistry = [];
    console.log('✅ Đã gỡ toàn bộ Firebase listeners:', list.length);
};

// Khi rời trang / F5 / đóng tab cũng tự gỡ listener
window.addEventListener('beforeunload', function () {
    if (typeof window.cleanupFirebaseListeners === 'function') {
        window.cleanupFirebaseListeners();
    }
});

window.logout = function () {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        // --- BẮT ĐẦU: Dọn dẹp Firebase Realtime trước khi thoát ---
        if (typeof cleanupFirebaseListeners === 'function') {
            cleanupFirebaseListeners();
        }
        // --- KẾT THÚC ---

        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
};

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
window.filterItems = function (containerId, keyword) {
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

window.runSystemDiagnostics = async function () {
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

// Lắng nghe sự kiện click trên toàn bộ tài liệu
document.addEventListener('click', function (event) {
    // Kiểm tra xem vị trí ngón tay chạm vào có phải là lớp phủ mờ (overlay) không
    if (event.target.classList.contains('modal-overlay') || event.target.classList.contains('student-modal-overlay')) {

        // Tìm nút "X" (close-btn) hoặc nút "Hủy" (btn-cancel) bên trong popup đó
        const closeBtn = event.target.querySelector('.close-btn') || event.target.querySelector('.btn-cancel');

        if (closeBtn) {
            // Tự động kích hoạt nút đóng để chạy các hàm dọn dẹp dữ liệu nếu có
            closeBtn.click();
        } else {
            // Phương án dự phòng: Nếu popup không có nút X, tự ép đóng bằng cách xóa class active
            event.target.classList.remove('active');
            event.target.style.display = 'none';
        }
    }
});

// === HỆ THỐNG AUTO-SAVE DỮ LIỆU NHÁP ===

/**
 * Hàm thiết lập tự động lưu nháp cho một ô nhập liệu (input/textarea)
 * @param {HTMLElement} inputElement - Thẻ input hoặc textarea cần lưu nháp
 * @param {string} storageKey - Khóa lưu trữ duy nhất trong localStorage (VD: 'draft_teacher_assign')
 */
window.setupAutoSave = function (inputElement, storageKey) {
    if (!inputElement) return;

    // 1. Phục hồi dữ liệu nếu có bản nháp từ trước
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
        inputElement.value = savedDraft;
        // Kích hoạt sự kiện input để các thư viện UI (nếu có) tự cập nhật chiều cao, style...
        inputElement.dispatchEvent(new Event('input'));
    }

    // 2. Hàm delay (debounce) tích hợp sẵn để chống lưu liên tục gây giật lag
    let timeout;
    const saveToLocal = function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            localStorage.setItem(storageKey, inputElement.value);
        }, 1000); // Đợi người dùng ngừng gõ 1 giây mới tiến hành lưu
    };

    // 3. Lắng nghe sự kiện gõ phím
    inputElement.addEventListener('input', saveToLocal);
};

/**
 * Hàm xóa bản nháp (gọi hàm này SAU KHI người dùng đã nộp bài/lưu bài thành công)
 */
window.clearAutoSave = function (storageKey) {
    localStorage.removeItem(storageKey);
};

// ==============================================================
// BỘ XEM TRỰC TIẾP TỆP/LINK TRÊN WEB (ẢNH, PDF, DOCX, URL)
// ==============================================================
(function () {
    const registry =
        window.__filePreviewRegistry =
        window.__filePreviewRegistry || {};

    let previewCounter = 0;

    // Chống chèn mã HTML vào giao diện
    function escapeHTML(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Chuẩn hóa và kiểm tra URL
    function normalizeUrl(url) {
        const value = String(url || '').trim();

        if (
            !value ||
            /^(javascript|vbscript|file):/i.test(value)
        ) {
            return '';
        }

        // Chỉ chấp nhận các Data URL an toàn cần dùng
        if (/^data:/i.test(value)) {
            const safeData =
                /^data:(image\/|application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)/i.test(
                    value
                );

            return safeData ? value : '';
        }

        if (
            /^(blob:|https?:\/\/|\/|\.\.?\/)/i.test(value)
        ) {
            return value;
        }

        // Tự thêm https:// khi người dùng nhập www...
        if (
            /^www\./i.test(value) ||
            /^[a-z0-9.-]+\.[a-z]{2,}(?:[\/:?#]|$)/i.test(
                value
            )
        ) {
            return 'https://' + value;
        }

        return value;
    }

    // Lấy phần mở rộng của tên file hoặc URL
    function getExtension(nameOrUrl) {
        const clean = String(nameOrUrl || '')
            .split('#')[0]
            .split('?')[0];

        const match = clean.match(/\.([a-z0-9]{1,8})$/i);

        return match ? match[1].toLowerCase() : '';
    }

    // Nhận diện file là ảnh, PDF, DOCX, DOC hay link web
    function inferKind(item) {
        const url = item.url || '';
        const type = String(item.type || '').toLowerCase();
        const ext = getExtension(item.name || url);

        const dataMime = url.startsWith('data:')
            ? (
                url.slice(5).split(';')[0] || ''
            ).toLowerCase()
            : '';

        const mime = type || dataMime;

        if (
            mime.startsWith('image/') ||
            [
                'png',
                'jpg',
                'jpeg',
                'gif',
                'webp',
                'bmp',
                'svg',
                'avif'
            ].includes(ext)
        ) {
            return 'image';
        }

        if (
            mime === 'application/pdf' ||
            ext === 'pdf'
        ) {
            return 'pdf';
        }

        if (
            mime.includes('wordprocessingml') ||
            ext === 'docx'
        ) {
            return 'docx';
        }

        if (
            mime === 'application/msword' ||
            ext === 'doc'
        ) {
            return 'doc';
        }

        return 'web';
    }

    // Chuyển một số link Google thành link có thể xem trong iframe
    function toEmbeddableUrl(url) {
        let value = normalizeUrl(url);

        if (!value) {
            return '';
        }

        try {
            const parsed = new URL(
                value,
                window.location.href
            );

            const host = parsed.hostname.toLowerCase();

            // Google Drive
            if (host.includes('drive.google.com')) {
                const fileMatch =
                    parsed.pathname.match(
                        /\/file\/d\/([^/]+)/
                    );

                if (fileMatch) {
                    return (
                        'https://drive.google.com/file/d/' +
                        fileMatch[1] +
                        '/preview'
                    );
                }
            }

            // Google Docs, Sheets, Slides
            if (host.includes('docs.google.com')) {
                const docsMatch =
                    parsed.pathname.match(
                        /\/(document|spreadsheets|presentation)\/d\/([^/]+)/
                    );

                if (docsMatch) {
                    return (
                        'https://docs.google.com/' +
                        docsMatch[1] +
                        '/d/' +
                        docsMatch[2] +
                        '/preview'
                    );
                }
            }

            return parsed.href;
        } catch (error) {
            return value;
        }
    }

    // Chuyển DOCX dạng Base64 thành ArrayBuffer cho Mammoth
    function dataUrlToArrayBuffer(dataUrl) {
        const parts = String(dataUrl).split(',');

        if (parts.length < 2) {
            throw new Error(
                'Dữ liệu DOCX không hợp lệ.'
            );
        }

        const meta = parts[0];
        const body = parts.slice(1).join(',');

        const binary = meta.includes(';base64')
            ? atob(body)
            : decodeURIComponent(body);

        const bytes = new Uint8Array(binary.length);

        for (
            let index = 0;
            index < binary.length;
            index++
        ) {
            bytes[index] =
                binary.charCodeAt(index);
        }

        return bytes.buffer;
    }

    // Loại bỏ các nội dung nguy hiểm trong HTML do Mammoth tạo
    function sanitizeMammothHTML(html) {
        const doc = new DOMParser().parseFromString(
            `<div>${html || ''}</div>`,
            'text/html'
        );

        doc.querySelectorAll(
            'script, iframe, object, embed, style, link, meta'
        ).forEach(element => {
            element.remove();
        });

        doc.querySelectorAll('*').forEach(element => {
            [...element.attributes].forEach(attribute => {
                const name =
                    attribute.name.toLowerCase();

                const value =
                    String(attribute.value || '')
                        .trim()
                        .toLowerCase();

                if (
                    name.startsWith('on') ||
                    (
                        (
                            name === 'href' ||
                            name === 'src'
                        ) &&
                        value.startsWith('javascript:')
                    )
                ) {
                    element.removeAttribute(
                        attribute.name
                    );
                }
            });
        });

        return doc.body.firstElementChild
            ? doc.body.firstElementChild.innerHTML
            : '';
    }

    // Tạo cửa sổ xem file nếu chưa tồn tại
    function ensureModal() {
        let modal = document.getElementById(
            'universalFilePreviewModal'
        );

        if (modal) {
            return modal;
        }

        modal = document.createElement('div');

        modal.id = 'universalFilePreviewModal';

        modal.className =
            'modal-overlay universal-preview-overlay';

        modal.innerHTML = `
            <div
                class="universal-preview-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="universalPreviewTitle"
            >
                <div class="universal-preview-header">
                    <div>
                        <p class="universal-preview-kicker">
                            XEM TRỰC TIẾP TRÊN WEB
                        </p>

                        <h3 id="universalPreviewTitle">
                            Tài liệu
                        </h3>
                    </div>

                    <button
                        type="button"
                        class="close-btn universal-preview-close"
                        onclick="closeFilePreview()"
                        aria-label="Đóng"
                    >
                        ✖
                    </button>
                </div>

                <div class="universal-preview-actions">
                    <button
                        type="button"
                        id="universalPreviewOpenTab"
                        class="preview-action-btn"
                        onclick="openPreviewSourceInNewTab()"
                    >
                        ↗ Mở tab mới
                    </button>

                    <a
                        id="universalPreviewDownload"
                        class="preview-action-btn preview-download-btn"
                        href="#"
                        download
                        style="display:none;"
                    >
                        ⬇ Tải xuống
                    </a>
                </div>

                <div
                    id="universalPreviewNotice"
                    class="universal-preview-notice"
                    style="display:none;"
                ></div>

                <div
                    id="universalPreviewBody"
                    class="universal-preview-body"
                ></div>
            </div>
        `;

        document.body.appendChild(modal);

        return modal;
    }

    // Hiển thị trạng thái đang tải
    function showLoading(text) {
        const body = document.getElementById(
            'universalPreviewBody'
        );

        if (!body) {
            return;
        }

        body.innerHTML = `
            <div class="preview-loading">
                <span class="preview-spinner"></span>

                <p>
                    ${escapeHTML(
                        text ||
                        'Đang mở tài liệu...'
                    )}
                </p>
            </div>
        `;
    }

    // Hiện thông báo phía trên khung xem
    function showNotice(message) {
        const notice = document.getElementById(
            'universalPreviewNotice'
        );

        if (!notice) {
            return;
        }

        notice.textContent = message || '';

        notice.style.display = message
            ? 'block'
            : 'none';
    }

    // Tạo iframe dùng xem PDF, link web, Google Drive...
    function createIframe(
        url,
        title,
        sandboxed
    ) {
        const iframe =
            document.createElement('iframe');

        iframe.className =
            'universal-preview-frame';

        iframe.title =
            title || 'Xem tài liệu';

        iframe.src = url;

        iframe.referrerPolicy =
            'no-referrer-when-downgrade';

        iframe.allow =
            'fullscreen; clipboard-read; clipboard-write';

        if (sandboxed) {
            iframe.setAttribute(
                'sandbox',
                [
                    'allow-scripts',
                    'allow-same-origin',
                    'allow-forms',
                    'allow-popups',
                    'allow-downloads'
                ].join(' ')
            );
        }

        return iframe;
    }

    /**
     * Tạo HTML nút xem file.
     *
     * source có thể là:
     * - Chuỗi URL
     * - Object: { name, type, base64 }
     * - Object: { name, type, url }
     */
    window.buildFilePreviewHTML = function (
        source,
        label,
        options
    ) {
        options = options || {};

        const raw =
            typeof source === 'string'
                ? { url: source }
                : (source || {});

        const url = normalizeUrl(
            raw.url ||
            raw.base64 ||
            raw.href ||
            ''
        );

        if (!url) {
            return '';
        }

        const name =
            raw.name ||
            options.name ||
            (
                typeof source === 'string'
                    ? source
                    : 'Tài liệu'
            );

        const key =
            `preview_${Date.now()}_${++previewCounter}`;

        registry[key] = {
            url: url,
            name: name,
            type: raw.type || '',
            label: label || 'Tài liệu',

            allowDownload:
                options.allowDownload !== false,

            sourceIsLink:
                typeof source === 'string' ||
                (
                    Boolean(raw.url) &&
                    !raw.base64
                )
        };

        const tone = options.tone
            ? (
                ' preview-file-card--' +
                escapeHTML(options.tone)
            )
            : '';

        return `
            <div class="preview-file-card${tone}">
                <div class="preview-file-info">
                    <strong>
                        ${escapeHTML(
                            label ||
                            '📎 Tài liệu'
                        )}
                    </strong>

                    <span title="${escapeHTML(name)}">
                        ${escapeHTML(name)}
                    </span>
                </div>

                <div class="preview-file-buttons">
                    <button
                        type="button"
                        class="preview-inline-btn"
                        onclick="
                            event.stopPropagation();
                            openFilePreview('${key}');
                        "
                    >
                        👁 Xem trực tiếp
                    </button>

                    <button
                        type="button"
                        class="
                            preview-inline-btn
                            preview-inline-btn-secondary
                        "
                        onclick="
                            event.stopPropagation();
                            openPreviewSourceInNewTab('${key}');
                        "
                    >
                        ↗ Mở tab mới
                    </button>
                </div>
            </div>
        `;
    };

    // Mở cửa sổ xem trực tiếp
    window.openFilePreview = async function (
        key
    ) {
        const item = registry[key];

        if (!item) {
            alert(
                'Không tìm thấy dữ liệu tài liệu để mở.'
            );

            return;
        }

        const modal = ensureModal();

        window.__activePreviewKey = key;

        modal.classList.add('active');

        document.body.classList.add(
            'preview-modal-open'
        );

        const title =
            document.getElementById(
                'universalPreviewTitle'
            );

        const body =
            document.getElementById(
                'universalPreviewBody'
            );

        const download =
            document.getElementById(
                'universalPreviewDownload'
            );

        if (title) {
            title.textContent =
                item.name ||
                item.label ||
                'Tài liệu';
        }

        if (body) {
            body.innerHTML = '';
        }

        showNotice('');
        showLoading('Đang chuẩn bị nội dung...');

        if (download) {
            const isDownloadableData =
                /^(data:|blob:)/i.test(
                    item.url
                );

            download.style.display =
                item.allowDownload &&
                isDownloadableData
                    ? 'inline-flex'
                    : 'none';

            download.href = item.url;

            download.download =
                item.name || 'tai-lieu';
        }

        const kind = inferKind(item);

        try {
            body.innerHTML = '';

            // Xem ảnh
            if (kind === 'image') {
                const wrap =
                    document.createElement('div');

                wrap.className =
                    'universal-image-wrap';

                const image =
                    document.createElement('img');

                image.src = item.url;

                image.alt =
                    item.name ||
                    'Ảnh tài liệu';

                image.className =
                    'universal-preview-image';

                wrap.appendChild(image);
                body.appendChild(wrap);

                return;
            }

            // Xem PDF
            if (kind === 'pdf') {
                body.appendChild(
                    createIframe(
                        item.url,
                        item.name,
                        false
                    )
                );

                return;
            }

            // Xem DOCX
            if (kind === 'docx') {
                // Ưu tiên dùng Mammoth.js
                if (window.mammoth) {
                    try {
                        let arrayBuffer;

                        // DOCX được lưu Base64 trong Firebase
                        if (
                            item.url.startsWith(
                                'data:'
                            )
                        ) {
                            arrayBuffer =
                                dataUrlToArrayBuffer(
                                    item.url
                                );
                        } else {
                            // DOCX dạng link công khai
                            const response =
                                await fetch(item.url);

                            if (!response.ok) {
                                throw new Error(
                                    'Không tải được DOCX'
                                );
                            }

                            arrayBuffer =
                                await response.arrayBuffer();
                        }

                        const result =
                            await window.mammoth
                                .convertToHtml({
                                    arrayBuffer:
                                        arrayBuffer
                                });

                        const article =
                            document.createElement(
                                'article'
                            );

                        article.className =
                            'universal-docx-content';

                        article.innerHTML =
                            sanitizeMammothHTML(
                                result.value
                            );

                        body.appendChild(article);

                        if (
                            result.messages &&
                            result.messages.length
                        ) {
                            showNotice(
                                'Một số định dạng phức tạp trong DOCX có thể hiển thị khác so với Microsoft Word.'
                            );
                        }

                        return;
                    } catch (docxError) {
                        console.warn(
                            'Không thể đọc DOCX trực tiếp bằng Mammoth:',
                            docxError
                        );
                    }
                }

                // Nếu Mammoth không đọc được và DOCX là URL công khai
                if (
                    /^https?:\/\//i.test(
                        item.url
                    )
                ) {
                    const officeUrl =
                        'https://view.officeapps.live.com/op/embed.aspx?src=' +
                        encodeURIComponent(
                            item.url
                        );

                    showNotice(
                        'Đang dùng Microsoft Office Online để xem DOCX. Link phải được chia sẻ công khai.'
                    );

                    body.appendChild(
                        createIframe(
                            officeUrl,
                            item.name,
                            false
                        )
                    );
                } else {
                    showNotice(
                        'Trình duyệt chưa thể đọc DOCX này trực tiếp. Hãy dùng nút “Mở tab mới” hoặc “Tải xuống”.'
                    );

                    body.innerHTML = `
                        <div class="preview-empty-state">
                            Không thể hiển thị DOCX
                            trong khung xem.
                        </div>
                    `;
                }

                return;
            }

            // Xem định dạng Word .doc cũ
            if (kind === 'doc') {
                if (
                    /^https?:\/\//i.test(
                        item.url
                    )
                ) {
                    const officeUrl =
                        'https://view.officeapps.live.com/op/embed.aspx?src=' +
                        encodeURIComponent(
                            item.url
                        );

                    showNotice(
                        'Đang dùng Microsoft Office Online để xem tệp Word. Link phải được chia sẻ công khai.'
                    );

                    body.appendChild(
                        createIframe(
                            officeUrl,
                            item.name,
                            false
                        )
                    );
                } else {
                    showNotice(
                        'Tệp .doc cũ không thể đọc trực tiếp từ dữ liệu nội bộ. Vui lòng tải xuống.'
                    );

                    body.innerHTML = `
                        <div class="preview-empty-state">
                            Không thể hiển thị
                            tệp .doc cũ.
                        </div>
                    `;
                }

                return;
            }

            // Xem link trang web, Google Drive, Google Docs...
            const embedUrl =
                toEmbeddableUrl(item.url);

            showNotice(
                'Nếu trang nguồn chặn nhúng, hãy bấm “Mở tab mới” ở phía trên.'
            );

            body.appendChild(
                createIframe(
                    embedUrl,
                    item.name,
                    true
                )
            );
        } catch (error) {
            console.error(
                'Lỗi xem trực tiếp tài liệu:',
                error
            );

            showNotice(
                'Không thể hiển thị tài liệu trong khung xem. Hãy thử mở ở tab mới.'
            );

            body.innerHTML = `
                <div class="preview-empty-state">
                    Không thể tải nội dung tài liệu.
                </div>
            `;
        }
    };

    // Mở nguồn tài liệu trong tab mới
    window.openPreviewSourceInNewTab =
        function (key) {
            const activeKey =
                key ||
                window.__activePreviewKey;

            const item =
                registry[activeKey];

            if (
                !item ||
                !item.url
            ) {
                return;
            }

            const targetUrl =
                toEmbeddableUrl(item.url);

            const opened =
                window.open(
                    targetUrl,
                    '_blank'
                );

            if (opened) {
                try {
                    opened.opener = null;
                } catch (error) {
                    // Không cần xử lý
                }
            } else {
                alert(
                    'Trình duyệt đang chặn cửa sổ mới. Vui lòng cho phép pop-up cho trang này.'
                );
            }
        };

    // Đóng cửa sổ xem file
    window.closeFilePreview = function () {
        const modal =
            document.getElementById(
                'universalFilePreviewModal'
            );

        const body =
            document.getElementById(
                'universalPreviewBody'
            );

        if (modal) {
            modal.classList.remove('active');
        }

        if (body) {
            body.innerHTML = '';
        }

        showNotice('');

        document.body.classList.remove(
            'preview-modal-open'
        );

        window.__activePreviewKey = null;
    };

    // Nhấn Escape để đóng cửa sổ xem
    document.addEventListener(
        'keydown',
        function (event) {
            const modal =
                document.getElementById(
                    'universalFilePreviewModal'
                );

            if (
                event.key === 'Escape' &&
                modal &&
                modal.classList.contains(
                    'active'
                )
            ) {
                window.closeFilePreview();
            }
        }
    );
})();