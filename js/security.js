// =========================================================================
// HỆ THỐNG BẢO MẬT GIAO DIỆN CHỐNG F12 VÀ CHUỘT PHẢI (BẢN V3)
// =========================================================================

// Hàm xử lý khi phát hiện vi phạm: Xóa trắng và ép văng khỏi web
function kickUser() {
    // NGOẠI LỆ: Cho phép Giáo viên mở F12 để kiểm tra và chẩn đoán hệ thống
    if (window.isVerifiedTeacher === true) return;

    // Các tài khoản khác sẽ bị phạt
    document.head.innerHTML = ""; 
    document.body.innerHTML = ""; 
    window.location.replace("about:blank"); 
}

// 1. Chặn click chuột phải trên toàn bộ trang web
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// 2. Chặn các phím tắt phổ biến và VĂNG NGAY LẬP TỨC
document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123 || 
       (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
       (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
       (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) ||
       (e.ctrlKey && (e.key === 'U' || e.key === 'u'))) {
        
        e.preventDefault();
        kickUser(); 
        return false;
    }
});

// 4. Phát hiện Console (Dành cho ai mở F12 dạng cửa sổ rời - Undocked)
// Đẩy một hình ảnh ảo vào Console, nếu Console đang mở nó sẽ cố đọc hình ảnh này và sập bẫy.
const devtoolsDetector = new Image();
Object.defineProperty(devtoolsDetector, 'id', {
    get: function () {
        kickUser();
    }
});
//setInterval(() => {
//    console.log('%c', devtoolsDetector);
//    console.clear(); // Xóa log ngay lập tức để không bị lộ
//}, 500);

// =========================================================================
// 3. BẪY DEVTOOLS NÂNG CAO (CHẶN MENU TRÌNH DUYỆT & MỞ SẴN)
// =========================================================================

setInterval(() => {
    // 1. Ngoại lệ: Chỉ tha khi Firebase đã cấp cờ xác thực
    if (window.isVerifiedTeacher === true) return;

    // 2. Bẫy đo kích thước màn hình
    // Nếu DevTools gắn ở mép màn hình, kích thước hiển thị (inner) sẽ nhỏ hơn nhiều so với cửa sổ (outer)
    const widthDiff = window.outerWidth - window.innerWidth > 160;
    const heightDiff = window.outerHeight - window.innerHeight > 160;
    
    if (widthDiff || heightDiff) {
        kickUser();
    }

    // 3. Bẫy thời gian ngưng đọng (Lệnh Debugger thần thánh)
    // Nếu DevTools đang mở, lệnh 'debugger' sẽ làm trình duyệt khựng lại vài mili-giây
    const startTime = Date.now();
    
    // Hàm eval để ẩn giấu chữ debugger tránh bị một số extension chặn
    eval('debugger'); 
    
    if (Date.now() - startTime > 100) {
        kickUser();
    }
}, 1000); // Quét liên tục mỗi 1 giây