// =========================================================================
// HỆ THỐNG BẢO MẬT GIAO DIỆN CHỐNG F12 VÀ CHUỘT PHẢI (BẢN V3)
// =========================================================================

// Hàm xử lý khi phát hiện vi phạm: Xóa trắng và ép văng khỏi web
function kickUser() {
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

// 3. Phát hiện F12 mở theo dạng neo (Docked) làm thay đổi kích thước khung web
function detectDevToolsSize() {
    const threshold = 160; // Chênh lệch kích thước tối thiểu khi F12 mở
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    
    if (widthDiff || heightDiff) {
        kickUser();
    }
}
window.addEventListener('resize', detectDevToolsSize);
setInterval(detectDevToolsSize, 500);

// 4. Phát hiện Console (Dành cho ai mở F12 dạng cửa sổ rời - Undocked)
// Đẩy một hình ảnh ảo vào Console, nếu Console đang mở nó sẽ cố đọc hình ảnh này và sập bẫy.
const devtoolsDetector = new Image();
Object.defineProperty(devtoolsDetector, 'id', {
    get: function () {
        kickUser();
    }
});
setInterval(() => {
    console.log('%c', devtoolsDetector);
    console.clear(); // Xóa log ngay lập tức để không bị lộ
}, 500);