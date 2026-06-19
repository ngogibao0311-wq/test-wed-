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
        },
        'theme_doisong': { 
            primary: '#88ab75',     // Xanh lá dịu
            secondary: '#4a3c31',   // Nâu gỗ đậm
            background: '#fdfaf5',  // Màu giấy kem ấm
            className: 'theme-lifestyle' 
        },
        'theme_bandem': { 
            primary: '#81d4fa',     // Xanh ngọc sáng (Neon Cyan)
            secondary: '#aa00ff',   // Tím dạ quang
            background: '#0a0f1e',  // Xanh đen không gian
            className: 'theme-night-sky' 
        },
        'theme_banngay_ngaymoi': { 
            primary: '#ffaa00',     // Vàng cam mặt trời rực rỡ
            secondary: '#00b4d8',   // Xanh bầu trời trong vắt
            background: '#e0fbfc',  // Nền trời sáng sủa
            className: 'theme-daylight-sky' 
        },
        'theme_cotich_phale': { 
            primary: '#a29bfe',     // Tím pha lê mộng mơ
            secondary: '#00cec9',   // Xanh ngọc bích
            background: '#1a1829',  // Nền tím than đậm
            className: 'theme-crystal-palace' 
        },
        'theme_truyenthuyet_vutru': { 
            primary: '#bd00ff',     // Tím Neon
            secondary: '#00f5ff',   // Xanh Cyan (Plasma)
            background: '#050508',  // Đen vũ trụ sâu thẳm
            className: 'theme-cosmic-godhood' // <--- Class chốt để kích hoạt CSS vũ trụ
        },
        'theme_vutru_saothuy': { 
            primary: '#45f3ff',     // Xanh Cyan (Plasma lỏng)
            secondary: '#c5c6c7',   // Bạc hợp kim
            background: '#0b0c10',  // Đen không gian thẳm
            className: 'theme-mercury-station' 
        },
    };

    static applyTheme(themeId) {
        const theme = this.themes[themeId] || this.themes['default'];
        const root = document.documentElement;
        
        root.style.setProperty('--primary-color', theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);
        root.style.setProperty('--bg-color', theme.background);

        Array.from(document.body.classList).forEach(className => {
            if (className.startsWith('theme-') || className.startsWith('theme_')) {
                document.body.classList.remove(className);
            }
        });

        // 1. Xóa tất cả các class theme đặc biệt cũ khỏi body
        document.body.classList.remove('theme-fairy-tale', 'theme-magic-forest', 'theme-lifestyle', 'theme-night-sky', 'theme-daylight-sky', 'theme_truyenthuyet_vutru', 'theme-mercury-station');

        // 2. Tiêm class mới vào body nếu theme đó có yêu cầu thay đổi hình dáng
        if (theme.className) {
            document.body.classList.add(theme.className);
        }
        
        localStorage.setItem('active_theme', themeId);
    }
}