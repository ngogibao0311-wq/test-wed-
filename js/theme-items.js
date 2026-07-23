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
            primary: '#c9a96e',
            secondary: '#7f8b99',
            background: '#07090d',
            className: 'theme-lotm-mysteries'
        },
        'theme_truyenthuyet_celestial': {
            primary: '#ffd700',       // Màu Vàng Thần Thánh (Divine Gold)
            secondary: '#e5e4e2',     // Màu Bạch Kim (Platinum)
            background: '#050508',    // Màu Đen Vô Cực (Deep Void)
            className: 'theme-legendary-celestial'
        },
        'theme_cotich_hai_nguyet': {
            primary: '#42cfe5',
            secondary: '#a78bfa',
            background: '#e8fbff',
            className: 'theme-fairy-sea-dream'
        },
        'theme_doraemon_childhood': {
            primary: '#5ab4e6',
            secondary: '#f5a3c2',
            background: '#fff8ed',
            className: 'theme-doraemon-childhood'
        },
        'theme_hoihoa_atelier': {
            primary: '#1595a5',
            secondary: '#8b5cf6',
            background: '#f6efd9',
            className: 'theme-enchanted-atelier'
        },
        'theme_thatdaitoi_acedia_dream': {
            primary: '#8f68b8',
            secondary: '#d4b9f2',
            background: '#0b0712',
            className: 'theme-seven-sins-acedia'
        },
        'theme_he_mat_troi_sinh_quyen': {
            primary: '#36d6c3',
            secondary: '#ffbd45',
            background: '#071a28',
            className: 'theme-solar-biosphere'
        },
        'theme_sinh_nhat_tiec_ngot_2026': {
            primary: '#ef7866',
            secondary: '#2f846b',
            background: '#fff7e9',
            className: 'theme-birthday-sweet-2026'
        },
    };

    // Những popup phải giữ giao diện riêng,
    // không nhận CSS từ vật phẩm giao diện.
    static themeImmunePopupSelectors = Object.freeze([
        '[data-theme-immune="true"]'
    ]);

    /* =========================================================
   CARD AMON KHÔNG NHẬN GIAO DIỆN TOÀN WEB
   ========================================================= */

    /* =========================================================
   CARD ĐẶC BIỆT KHÔNG NHẬN GIAO DIỆN TOÀN WEB
   ========================================================= */

    static specialStoreCardGroups = Object.freeze({
        'amon-trinity': Object.freeze({
            itemIds: Object.freeze([
                'pet_lotm_amon',
                'effect_lotm_amon',
                'theme_lotm_mysteries'
            ]),

            className:
                'store-card-amon-trinity',

            styleId:
                'amon-trinity-card-style'
        }),

        'shizuka-trinity': Object.freeze({
            itemIds: Object.freeze([
                'pet_doraemon_shizuka',
                'theme_doraemon_childhood',
                'effect_doraemon_school_memories'
            ]),

            className:
                'store-card-shizuka-trinity',

            styleId:
                'shizuka-trinity-card-style'
        }),

        'seven-sins-sloth': Object.freeze({
            itemIds: Object.freeze([
                'pet_thatdaitoi_luoibieng_1',
                'theme_thatdaitoi_acedia_dream',
                'effect_thatdaitoi_acedia_domain'
            ]),

            className:
                'store-card-seven-sins-sloth'
        }),

        /* Bộ Thần Hệ Tinh Vân */
        'galaxy-legend-trinity': Object.freeze({
            itemIds: Object.freeze([
                'pet_truyenthuyet_1',
                'effect_truyenthuyet_vutru',
                'theme_truyenthuyet_vutru'
            ]),

            className:
                'store-card-galaxy-legend-trinity'
        }),

        /* Bộ Vệ Thần Ngân Hà */
        'galaxy-guardian-trinity': Object.freeze({
            itemIds: Object.freeze([
                'pet_truyenthuyet_2',
                'effect_truyenthuyet_nganha',
                'theme_truyenthuyet_nganha'
            ]),

            className:
                'store-card-galaxy-guardian-trinity'
        }),

        'birthday-2026': Object.freeze({
            itemIds: Object.freeze([
                'pet_sinh_nhat_2026',
                'theme_sinh_nhat_tiec_ngot_2026',
                'effect_sinh_nhat_than_an_phuc_loc_2026'
            ]),

            className:
                'store-card-birthday-2026'
        }),
    });


    static preserveSpecialStoreCards(
        root = document
    ) {
        const selector =
            '.store-item-card[data-item-id]';

        const cards = [];

        if (
            root instanceof Element &&
            root.matches(selector)
        ) {
            cards.push(root);
        }

        if (root.querySelectorAll) {
            cards.push(
                ...root.querySelectorAll(selector)
            );
        }


        cards.forEach(card => {
            const itemId =
                card.dataset.itemId;

            const matchedGroup =
                Object.entries(
                    this.specialStoreCardGroups
                ).find(([, config]) => {
                    return config
                        .itemIds
                        .includes(itemId);
                });

            if (!matchedGroup) {
                return;
            }

            const [
                groupName,
                config
            ] = matchedGroup;

            card.classList.add(
                config.className,
                'store-theme-locked',
                'ui-theme-immune'
            );

            card.dataset.themeImmune =
                'true';

            card.dataset.specialCard =
                groupName;
        });


        /*
         * Đưa CSS card đặc biệt xuống cuối <head>.
         * Giao diện toàn web không thể ghi đè.
         */
        Object.values(
            this.specialStoreCardGroups
        ).forEach(config => {
            const stylesheet =
                document.getElementById(
                    config.styleId
                );

            if (
                stylesheet &&
                stylesheet.parentNode
            ) {
                document.head.appendChild(
                    stylesheet
                );
            }
        });
    }


    static preserveAmonStoreCards(
        root = document
    ) {
        const cards = [];

        const selector =
            '.store-item-card[data-item-id]';

        if (
            root instanceof Element &&
            root.matches(selector)
        ) {
            cards.push(root);
        }

        if (root.querySelectorAll) {
            cards.push(
                ...root.querySelectorAll(
                    selector
                )
            );
        }

        cards.forEach(card => {
            const itemId =
                card.dataset.itemId;

            if (
                !this.amonStoreItemIds.includes(
                    itemId
                )
            ) {
                return;
            }

            card.classList.add(
                'store-card-amon-trinity',
                'store-theme-locked',
                'ui-theme-immune'
            );

            card.dataset.themeImmune =
                'true';

            card.dataset.specialCard =
                'amon-trinity';
        });


        /*
         * Luôn chuyển CSS card Amon xuống cuối <head>.
         * Nhờ đó CSS của giao diện vừa mặc không thể
         * ghi đè card Amon.
         */
        const amonStyle =
            document.getElementById(
                'amon-trinity-card-style'
            );

        if (
            amonStyle &&
            amonStyle.parentNode
        ) {
            document.head.appendChild(
                amonStyle
            );
        }
    }

    static markThemeImmunePopups(root = document) {
        const selector = this.themeImmunePopupSelectors.join(',');
        const targets = [];

        if (root instanceof Element && root.matches(selector)) {
            targets.push(root);
        }

        if (root.querySelectorAll) {
            targets.push(...root.querySelectorAll(selector));
        }

        targets.forEach(popup => {
            popup.classList.add('ui-theme-immune');
        });
    }

    static initThemePopupIsolation() {
        if (this._themePopupObserver) return;

        const start = () => {
            // Bảo vệ những popup đã tồn tại
            this.markThemeImmunePopups(document);
            this.preserveSpecialStoreCards(
                document
            );

            // Bảo vệ popup được JavaScript tạo sau
            this._themePopupObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (
                            node.nodeType ===
                            Node.ELEMENT_NODE
                        ) {
                            this.markThemeImmunePopups(
                                node
                            );

                            this.preserveSpecialStoreCards(
                                node
                            );
                        }
                    });
                });
            });

            this._themePopupObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        };

        if (document.body) {
            start();
        } else {
            document.addEventListener('DOMContentLoaded', start, {
                once: true
            });
        }
    }

    static clearAcediaPalaceDecor() {
        const oldDecor =
            document.getElementById(
                'acedia-palace-chrome'
            );

        if (oldDecor) {
            oldDecor.remove();
        }

        document.documentElement.classList.remove(
            'acedia-palace-mounted'
        );
    }

    static createAcediaPalaceDecor() {
        this.clearAcediaPalaceDecor();

        if (!document.body) return;

        const decor = document.createElement('div');

        decor.id = 'acedia-palace-chrome';
        decor.className = 'acedia-palace-chrome';
        decor.setAttribute('aria-hidden', 'true');

        decor.innerHTML = `
            <div class="acedia-palace-vault"></div>

            <div class="acedia-palace-eclipse">
                <span class="eclipse-crown"></span>
                <span class="eclipse-core">Ⅶ</span>
            </div>

            <div class="acedia-palace-arches"></div>

            <div class="acedia-palace-hourglass">
                <span class="hourglass-crown"></span>
                <span class="hourglass-frame"></span>

                <span
                    class="hourglass-sand sand-upper"
                ></span>

                <span
                    class="hourglass-sand sand-lower"
                ></span>
            </div>

            <div
                class="acedia-palace-chain chain-a"
            ></div>

            <div
                class="acedia-palace-chain chain-b"
            ></div>

            <div
                class="acedia-palace-chain chain-c"
            ></div>

            <div class="acedia-palace-dust"></div>

            <div class="acedia-palace-inscription">
                <span>PECCATUM VII</span>

                <strong>
                    MỘNG ĐIỆN TRÌ HOÃN
                </strong>

                <small>
                    Ở đây, mọi khoảnh khắc đều đến muộn.
                </small>
            </div>
        `;

        const arches =
            decor.querySelector(
                '.acedia-palace-arches'
            );

        const numerals = [
            'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'
        ];

        for (let index = 0; index < 7; index++) {
            const arch =
                document.createElement('span');

            arch.className = 'acedia-palace-arch';
            arch.dataset.number = numerals[index];

            arch.style.setProperty(
                '--acedia-arch-index',
                index
            );

            arch.style.setProperty(
                '--acedia-arch-delay',
                `${-index * 0.7}s`
            );

            arch.style.setProperty(
                '--acedia-arch-height',
                `${58 + index * 2.7}%`
            );

            arches.appendChild(arch);
        }

        const dustField =
            decor.querySelector(
                '.acedia-palace-dust'
            );

        const isMobile = window.matchMedia(
            '(max-width: 768px), (pointer: coarse)'
        ).matches;

        const dustCount = isMobile ? 18 : 36;

        for (
            let index = 0;
            index < dustCount;
            index++
        ) {
            const mote =
                document.createElement('span');

            const duration = 8 + index % 9;

            mote.className =
                'acedia-palace-mote';

            mote.style.setProperty(
                '--acedia-palace-x',
                `${(index * 37) % 100}%`
            );

            mote.style.setProperty(
                '--acedia-palace-y',
                `${(index * 61) % 100}%`
            );

            mote.style.setProperty(
                '--acedia-palace-size',
                `${1 + index % 4}px`
            );

            mote.style.setProperty(
                '--acedia-palace-duration',
                `${duration}s`
            );

            mote.style.setProperty(
                '--acedia-palace-delay',
                `${-(index % 13) * 0.55}s`
            );

            dustField.appendChild(mote);
        }

        document.body.prepend(decor);

        document.documentElement.classList.add(
            'acedia-palace-mounted'
        );

        requestAnimationFrame(() => {
            decor.classList.add('is-mounted');
        });
    }

    static applyTheme(themeId) {
        this.initThemePopupIsolation();
        this.clearAcediaPalaceDecor();
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

        if (
            themeId ===
            'theme_thatdaitoi_acedia_dream'
        ) {
            this.createAcediaPalaceDecor();
        }

        // Lưu lựa chọn vào bộ nhớ trình duyệt
        localStorage.setItem('active_theme', themeId);
        requestAnimationFrame(() => {
            this.preserveSpecialStoreCards(
                document
            );
        });
    }
}

// Bắt cả popup có sẵn và popup được tạo động.
ThemeManager.initThemePopupIsolation();