// js/theme-items.js

class ThemeManager {
    static themes = {
        'default': { primary: '#667eea', secondary: '#764ba2', background: '#f4f7f6', className: '' },
        'theme_ocean': { primary: '#4facfe', secondary: '#00f2fe', background: '#e0f7fa', className: '' },
        // Thêm cấu hình theme Cổ tích
        'theme_cotich': { 
            primary: '#d4af37',     // Vàng hoàng gia
            secondary: '#1a1a2e',   // Xanh đêm huyền bí
            background: '#0f0f1a',  // Màu nền tổng thể tối
            className: 'theme-fairy-tale' // Class này sẽ bọc toàn trang
        },
        'theme_cotich_forest': { 
            primary: '#2ecc71',     // Xanh ngọc lục bảo
            secondary: '#1abc9c',   // Xanh bạc hà
            background: '#04120c',  // Xanh đen rừng sâu
            className: 'theme-magic-forest' // Gắn class vừa viết ở file CSS
        }
    };

    static applyTheme(themeId) {
        const theme = this.themes[themeId] || this.themes['default'];
        const root = document.documentElement;
        
        root.style.setProperty('--primary-color', theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);
        root.style.setProperty('--bg-color', theme.background);
        
        // 1. Xóa tất cả các class theme đặc biệt cũ khỏi body
        document.body.classList.remove('theme-fairy-tale', 'theme-magic-forest');

        // 2. Tiêm class mới vào body nếu theme đó có yêu cầu thay đổi hình dáng
        if (theme.className) {
            document.body.classList.add(theme.className);
        }
        
        localStorage.setItem('active_theme', themeId);
    }
}