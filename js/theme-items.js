// js/theme-items.js

class ThemeManager {
    static themes = {
        'default': { primary: '#667eea', secondary: '#764ba2', background: '#f4f7f6', className: '' },
        'theme_ocean': { primary: '#4facfe', secondary: '#00f2fe', background: '#e0f7fa', className: '' },
        'theme_cotich': { 
            primary: '#d4af37',     // Vàng hoàng gia
            secondary: '#1a1a2e',   // Xanh đêm huyền bí
            background: '#0f0f1a',  // Màu nền tổng thể tối
            className: 'theme-fairy-tale' 
        },
        'theme_cotich_forest': { 
            primary: '#2ecc71',     // Xanh ngọc lục bảo
            secondary: '#1abc9c',   // Xanh bạc hà
            background: '#04120c',  // Xanh đen rừng sâu
            className: 'theme-magic-forest' 
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
            className: 'theme-cosmic-godhood' 
        },
        'theme_vutru_saothuy': { 
            primary: '#45f3ff',     // Xanh Cyan (Plasma lỏng)
            secondary: '#c5c6c7',   // Bạc hợp kim
            background: '#0b0c10',  // Đen không gian thẳm
            className: 'theme-mercury-station' 
        },
        'theme_cosmic_anomaly': { 
            primary: '#ec4899',       // Hồng Neon Tinh Vân (Deep Space Pink)
            secondary: '#06b6d4',     // Xanh Plasma Lỏng (Quantum Cyan)
            background: '#030712',    // Đen Hố Đen (Vantablack Void)
            className: 'theme-cosmic-anomaly' 
        },
        'theme_truyenthuyet_nganha': { 
            primary: '#00f2fe',       // Quang phổ Xanh Tinh Tú (Cyan Neon)
            secondary: '#9b5de5',     // Hào quang Tím Tinh Vân (Deep Nebula Violet)
            background: '#04060f',    // Đen Thẳm Không Gian (Abyssal Void)
            className: 'theme-vethan-nganha' 
        },
        'theme_lotm_mysteries': { 
            primary: '#8c1c1c',       // Đỏ máu Hồng Nguyệt (Crimson Moon)
            secondary: '#a3a3a3',     // Xám Sương Mù
            background: '#0a0a0d',    // Đen Vực Thẳm
            className: 'theme-lotm-mysteries' 
        },
        'theme_truyenthuyet_celestial': { 
            primary: '#ffd700',       // Màu Vàng Thần Thánh (Divine Gold)
            secondary: '#e5e4e2',     // Màu Bạch Kim (Platinum)
            background: '#050508',    // Màu Đen Vô Cực (Deep Void)
            className: 'theme-legendary-celestial' 
        },
    };

    static applyTheme(themeId) {
        const theme = this.themes[themeId] || this.themes['default'];
        const root = document.documentElement;
        
        // Áp dụng biến màu sắc CSS
        root.style.setProperty('--primary-color', theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);
        root.style.setProperty('--bg-color', theme.background);

        // 1. Xóa động TẤT CẢ các class theme cũ một cách tối ưu
        Array.from(document.body.classList).forEach(className => {
            if (className.startsWith('theme-') || className.startsWith('theme_')) {
                document.body.classList.remove(className);
            }
        });

        // 2. Tiêm class mới vào body nếu theme đó có yêu cầu thay đổi hình dáng
        if (theme.className) {
            document.body.classList.add(theme.className);
        }
        
        // Lưu lựa chọn vào bộ nhớ trình duyệt
        localStorage.setItem('active_theme', themeId);
    }
}