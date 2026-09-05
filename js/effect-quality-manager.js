/**
 * EFFECT QUALITY MANAGER — Vật phẩm + Web Animations
 * Phiên bản: 1.2.0
 *
 * Mục tiêu:
 * - Chỉ giảm CHUYỂN ĐỘNG / HẠT / LỚP TRANG TRÍ của hiệu ứng vật phẩm, card cửa hàng và Web Animations.
 * - KHÔNG thay đổi theme/giao diện, Firebase, điểm, game, cửa hàng, pet interaction hay logic khác.
 * - Có 3 mức khi bật: high (đầy đủ), medium (giảm vừa), low (tối ưu mạnh).
 * - Tự nhận diện runtime Premium/Luxury mới theo DOM/namespace; không cần danh sách ID cố định.
 * - MutationObserver được gom theo frame để tránh quét lặp khi vật phẩm sinh nhiều hạt.
 */
(() => {
    'use strict';

    if (window.EffectQualityManager) return;

    const VERSION = '1.2.0';
    const STORAGE_PREFIX = 'effectQualityManager:v1';
    const STYLE_ID = 'effect-quality-manager-style';
    const SETTINGS_ROW_ID = 'effectQualitySettingsRow';
    const TOGGLE_ID = 'toggleEffectQualityManager';
    const LEVELS_ID = 'effectQualityLevelControls';
    const STATUS_ID = 'effectQualityStatus';
    const DETECTION_ID = 'effectQualityDetectionStatus';
    const RESCAN_ID = 'effectQualityRescanBtn';

    const LEVELS = Object.freeze({
        high: Object.freeze({
            label: 'Cao',
            description: 'Đầy đủ hiệu ứng',
            intervalMultiplier: 1
        }),
        medium: Object.freeze({
            label: 'Trung bình',
            description: 'Giảm hạt và lớp phụ',
            intervalMultiplier: 1.9
        }),
        low: Object.freeze({
            label: 'Thấp',
            description: 'Ưu tiên ổn định máy',
            intervalMultiplier: 3.8
        })
    });

    const state = {
        initialized: false,
        enabled: false,
        level: 'high',
        observer: null,
        effectManagerPatched: false,
        timerPatchDepth: 0,
        forcedWebAnimationPause: false,
        webAnimationWasEnabled: true,
        restartTimer: null,
        rootCounters: new WeakMap(),
        storeCardCounters: new WeakMap(),
        pendingNodes: new Set(),
        observerFlushHandle: null,
        lastScanAt: 0
    };

    const ROOT_SELECTOR = [
        '#global-effect-container',
        '#virtual-pet-container',
        '#wfx-web-animation-layer',
        '[data-effect-quality-root="1"]',
        '[data-fxq-root="1"]'
    ].join(',');

    // Card vật phẩm chỉ được quản lý phần chuyển động/trang trí bên trong.
    // Không coi card là effect root để tránh đụng layout, nút, giá, tag và logic cửa hàng.
    const STORE_CARD_SELECTOR = [
        '#storeItemsContainer > .store-item-card',
        '#storeItemsContainer > [data-item-id]',
        '#storeItemsContainer > *[class*="card"]',
        '#luxuryStoreGrid > [data-item-id]',
        '#luxuryStoreGrid > article',
        '#luxuryStoreGrid > *[class*="card"]',
        '.luxury-store-grid > [data-item-id]',
        '.luxury-store-grid > article',
        '.luxury-store-grid > *[class*="card"]'
    ].join(',');

    const UI_EXCLUSION_SELECTOR = [
        '.store-item-card',
        '.luxury-product-card',
        '.modal-overlay',
        '.student-modal-overlay',
        '.modal-content',
        '.sidebar',
        '.toolbar',
        '.form-container',
        '.card',
        '.accordion-card',
        '#tab-settings',
        '#leaderboardModal',
        '#royalBallModal',
        '#hoihoaStudentModal',
        '#hhConfirmModal',
        '#artworkPreviewModal',
        '.ui-theme-immune'
    ].join(',');

    // Root runtime mới thường được append thẳng vào <body> và không đi qua EffectManager.
    // Nhận diện theo vai trò + namespace, KHÔNG theo danh sách ID vật phẩm cố định.
    const BODY_EFFECT_ROOT_RE = /(realm|ultimate|domain|sanctuary|heritage|world(?:-effect)?|fullscreen(?:-effect|-ultimate)?|ambient(?:-layer)?|effect(?:-layer)?|magic(?:-realm)?|portal|stage|screen-burst|page-click|click-burst|pet-realm|visual-layer)/i;
    const KNOWN_RUNTIME_NAMESPACE_RE = /(cam-co|cam-mong|tamon|bside|premium|spring-vintage|spring-crown|spring-goddess|summer-solstice|national-day|quoc-khanh|nyx|mythic|lotm|birthday|sinh-nhat|gaia|cassini|saturn|doraemon|acedia|seven-sins|truyenthuyet|legend|heritage|dong-son)/i;
    const RUNTIME_VISUAL_HINT_RE = /(world|realm|ultimate|domain|sanctuary|heritage|fullscreen|ambient|effect|magic|portal|stage|screen|click|burst|field|layer|backdrop|pet-realm|particles?)/i;
    const SECONDARY_RE = /(particle|spark|shard|confetti|dust|star|firefly|leaf|snow|flake|tendril|glyph|rune|seal|corridor|meteor|debris|fragment|petal|bubble|drop|crystal|ember|feather|mote|speck|ray-particle|rain-particle|orbit-dot|eq-bar|bokeh|lantern|lotus|talisman|note|ribbon)/i;
    const AMBIENT_RE = /(aura|aurora|glow|fog|vignette|grid|trail|beam|ring|orbit|halo|wave|ripple|mist|ray|smoke|cloud|flare|field|horizon|void|backdrop|background|overlay|crest|light|shine|pulse|wash|haze|curtain|ink|moon|mountain|gate)/i;
    const STRUCTURAL_RE = /(button|input|select|textarea|label|menu|sidebar|toolbar|panel|form|table|card|content|interface|control|status|progress|title|copy|text|modal|dialog)/i;

    const STORE_CARD_PRIMARY_RE = /(item-icon\b|product-image|character|avatar|portrait|pet-image|pet-art|main-image|hero-image)/i;
    const STORE_CARD_STRUCTURAL_RE = /(item-info|item-actions|item-name|item-type|price|description|details|source|button|action|label|tag|badge|lock|teacher|title|copy|text|info|content|control)/i;
    const STORE_CARD_SECONDARY_RE = /(particle|spark|sparkle|shard|confetti|dust|star|meteor|fragment|petal|bubble|crystal|ember|feather|mote|speck|glyph|rune|seal|tendril|eq-bar|eq\b|glint|shine-dot|debris)/i;
    const STORE_CARD_AMBIENT_RE = /(aura|aurora|glow|fog|vignette|trail|beam|ring|orbit|halo|wave|ripple|mist|ray|smoke|flare|field|horizon|void|backdrop|background|shine|shimmer|spectrum|tape|vinyl|light|pulse|shape)/i;

    function resolveRole() {
        const title = String(document.title || '').toLowerCase();

        if (
            title.includes('giáo viên') ||
            document.querySelector('#tab-manage-students')
        ) {
            return 'teacher';
        }

        if (
            title.includes('học sinh') ||
            document.querySelector('#studentName')
        ) {
            return 'student';
        }

        return 'default';
    }

    function getCurrentUsername() {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
            return String(user?.username || '').trim() || 'anonymous';
        } catch (_) {
            return 'anonymous';
        }
    }

    function getStorageKey() {
        return `${STORAGE_PREFIX}:${resolveRole()}:${getCurrentUsername()}`;
    }

    function normalizeLevel(value) {
        return Object.prototype.hasOwnProperty.call(LEVELS, value)
            ? value
            : 'high';
    }

    function loadStoredState() {
        try {
            const raw = localStorage.getItem(getStorageKey());
            if (!raw) {
                return { enabled: false, level: 'high' };
            }

            const parsed = JSON.parse(raw);
            return {
                enabled: parsed?.enabled === true,
                level: normalizeLevel(parsed?.level)
            };
        } catch (_) {
            return { enabled: false, level: 'high' };
        }
    }

    function saveStoredState() {
        try {
            localStorage.setItem(
                getStorageKey(),
                JSON.stringify({
                    enabled: state.enabled,
                    level: state.level,
                    version: VERSION
                })
            );
        } catch (_) {}
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
/* =========================================================
   EFFECT QUALITY MANAGER
   Chỉ đụng lớp hiệu ứng. Không selector theme/sidebar/card UI.
   ========================================================= */
#${SETTINGS_ROW_ID} {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid rgba(0,0,0,.05);
    border-radius: 12px;
    background: rgba(255,255,255,.5);
}

#${SETTINGS_ROW_ID} .fxq-setting-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
}

#${SETTINGS_ROW_ID} .fxq-setting-copy {
    min-width: 0;
    flex: 1;
}

#${SETTINGS_ROW_ID} .fxq-setting-copy strong {
    color: #2c3e50;
}

#${SETTINGS_ROW_ID} .fxq-setting-copy p {
    margin: 4px 0 0;
    color: #666;
    font-size: .85em;
    line-height: 1.45;
}

#${STATUS_ID} {
    display: inline-block;
    margin-top: 6px;
    color: #64748b;
    font-size: .78em;
    font-weight: 800;
}

#${DETECTION_ID} {
    display: block;
    margin-top: 4px;
    color: #77839a;
    font-size: .72em;
    line-height: 1.35;
}

#${RESCAN_ID} {
    width: auto !important;
    margin: 7px 0 0 !important;
    padding: 5px 9px !important;
    border: 1px solid rgba(100,116,139,.22) !important;
    border-radius: 8px !important;
    background: rgba(248,250,252,.82) !important;
    color: #475569 !important;
    box-shadow: none !important;
    font-size: .72rem !important;
    font-weight: 800 !important;
    cursor: pointer;
}

#${LEVELS_ID} {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 13px;
    padding-top: 12px;
    border-top: 1px dashed rgba(100,116,139,.22);
}

#${LEVELS_ID}[hidden] {
    display: none !important;
}

#${LEVELS_ID} .fxq-level-btn {
    width: 100% !important;
    min-height: 42px;
    margin: 0 !important;
    padding: 8px 9px !important;
    border: 1px solid rgba(102,126,234,.20) !important;
    border-radius: 10px !important;
    background: rgba(255,255,255,.72) !important;
    color: #475569 !important;
    box-shadow: none !important;
    font: inherit;
    cursor: pointer;
}

#${LEVELS_ID} .fxq-level-btn strong {
    display: block;
    color: inherit;
    font-size: .88rem;
}

#${LEVELS_ID} .fxq-level-btn small {
    display: block;
    margin-top: 2px;
    color: #64748b;
    font-size: .70rem;
    line-height: 1.25;
}

#${LEVELS_ID} .fxq-level-btn.is-active {
    border-color: rgba(79,70,229,.48) !important;
    background: linear-gradient(135deg, rgba(99,102,241,.13), rgba(139,92,246,.12)) !important;
    color: #4f46e5 !important;
}

/* ---------- WEB ANIMATIONS: MEDIUM ---------- */
html.fxq-enabled.fxq-medium #wfx-web-animation-layer {
    --wfx-particle-opacity: .48;
    --wfx-scene-opacity: .82;
}

html.fxq-enabled.fxq-medium #wfx-web-animation-layer .wfx-particle:nth-child(n + 13) {
    display: none !important;
}

html.fxq-enabled.fxq-medium #wfx-web-animation-layer .wfx-aurora-c,
html.fxq-enabled.fxq-medium #wfx-web-animation-layer .wfx-grid {
    opacity: .28 !important;
}

/* ---------- Hiệu ứng vật phẩm / pet: MEDIUM ---------- */
html.fxq-enabled.fxq-medium [data-fxq-skip-medium="1"] {
    display: none !important;
}

/* ---------- LOW: giữ pet chính, giảm tối đa phần trang trí ---------- */
html.fxq-enabled.fxq-low #global-effect-container [data-fxq-weight="secondary"],
html.fxq-enabled.fxq-low #virtual-pet-container [data-fxq-weight="secondary"],
html.fxq-enabled.fxq-low [data-fxq-root="1"] [data-fxq-weight="secondary"] {
    display: none !important;
}

html.fxq-enabled.fxq-low #global-effect-container [data-fxq-weight="ambient"],
html.fxq-enabled.fxq-low #virtual-pet-container [data-fxq-weight="ambient"],
html.fxq-enabled.fxq-low [data-fxq-root="1"] [data-fxq-weight="ambient"] {
    animation: none !important;
    transition: none !important;
    filter: none !important;
    box-shadow: none !important;
    opacity: .35 !important;
}


/* Runtime Premium/Luxury mới có nhiều trang trí nằm ở pseudo-element của root. */
html.fxq-enabled.fxq-medium [data-fxq-root="1"]::after {
    animation-play-state: paused !important;
    opacity: .60 !important;
}

html.fxq-enabled.fxq-low [data-fxq-root="1"]::before,
html.fxq-enabled.fxq-low [data-fxq-root="1"]::after {
    animation: none !important;
    transition: none !important;
    filter: none !important;
    box-shadow: none !important;
}


/* =========================================================
   CARD CỬA HÀNG THƯỜNG + SANG TRỌNG
   Chỉ giảm lớp trang trí/animation; tuyệt đối không ẩn card,
   ảnh chính, tag, giá, nút mua/dùng thử/trang bị hay phần info.
   ========================================================= */
html.fxq-enabled.fxq-medium [data-fxq-store-card="1"] [data-fxq-card-weight="secondary"][data-fxq-card-skip-medium="1"] {
    display: none !important;
}

html.fxq-enabled.fxq-medium [data-fxq-store-card="1"] [data-fxq-card-weight="ambient"] {
    opacity: .56 !important;
    filter: none !important;
    box-shadow: none !important;
}

/* Pseudo-element thường là vòng sáng/shine của card. Ở Medium chỉ dừng lớp ::after. */
html.fxq-enabled.fxq-medium [data-fxq-store-card="1"]::after,
html.fxq-enabled.fxq-medium [data-fxq-store-card="1"] .item-icon-wrapper::after,
html.fxq-enabled.fxq-medium [data-fxq-store-card="1"] [class*="visual"]::after,
html.fxq-enabled.fxq-medium [data-fxq-store-card="1"] [class*="shape"]::after {
    animation-play-state: paused !important;
    opacity: .52 !important;
}

html.fxq-enabled.fxq-low [data-fxq-store-card="1"] [data-fxq-card-weight="secondary"] {
    display: none !important;
}

html.fxq-enabled.fxq-low [data-fxq-store-card="1"] [data-fxq-card-weight="ambient"] {
    animation: none !important;
    transition: none !important;
    filter: none !important;
    box-shadow: none !important;
    opacity: .22 !important;
}

/* Ảnh/nhân vật chính vẫn hiện, chỉ bỏ animation liên tục ở mức Thấp. */
html.fxq-enabled.fxq-low [data-fxq-store-card="1"] [data-fxq-card-primary="1"] {
    animation: none !important;
    filter: none !important;
}

/* Dừng các pseudo-element trang trí ở mức Thấp, nhưng không thay kích thước/layout card. */
html.fxq-enabled.fxq-low [data-fxq-store-card="1"]::before,
html.fxq-enabled.fxq-low [data-fxq-store-card="1"]::after,
html.fxq-enabled.fxq-low [data-fxq-store-card="1"] .item-icon-wrapper::before,
html.fxq-enabled.fxq-low [data-fxq-store-card="1"] .item-icon-wrapper::after,
html.fxq-enabled.fxq-low [data-fxq-store-card="1"] [class*="visual"]::before,
html.fxq-enabled.fxq-low [data-fxq-store-card="1"] [class*="visual"]::after,
html.fxq-enabled.fxq-low [data-fxq-store-card="1"] [class*="shape"]::before,
html.fxq-enabled.fxq-low [data-fxq-store-card="1"] [class*="shape"]::after {
    animation: none !important;
    transition: none !important;
    filter: none !important;
    box-shadow: none !important;
}

@media (max-width: 640px) {
    #${LEVELS_ID} {
        grid-template-columns: 1fr;
    }
}
`;

        (document.head || document.documentElement).appendChild(style);
    }

    function getTokenText(element) {
        if (!(element instanceof Element)) return '';

        return [
            element.id || '',
            typeof element.className === 'string' ? element.className : '',
            element.getAttribute('data-effect') || '',
            element.getAttribute('data-effect-id') || '',
            element.getAttribute('data-effect-layer') || '',
            element.getAttribute('data-premium-suite') || '',
            element.getAttribute('data-special-card') || '',
            element.getAttribute('data-special-group') || ''
        ].join(' ');
    }

    function isKnownRoot(element) {
        if (!(element instanceof Element)) return false;

        return Boolean(
            element.matches?.('#global-effect-container, #virtual-pet-container, #wfx-web-animation-layer') ||
            element.dataset?.effectQualityRoot === '1' ||
            element.dataset?.fxqRoot === '1'
        );
    }

    function isBodyEffectRootCandidate(element) {
        if (!(element instanceof Element)) return false;
        if (element.parentElement !== document.body) return false;

        const token = getTokenText(element);
        const hasRootHint = BODY_EFFECT_ROOT_RE.test(token);
        const hasKnownRuntimeSignature =
            KNOWN_RUNTIME_NAMESPACE_RE.test(token) &&
            RUNTIME_VISUAL_HINT_RE.test(token);

        // ui-theme-immune được một số Premium dùng cho chính WORLD/ULTIMATE layer.
        // Chỉ loại UI bình thường khi phần tử không mang chữ ký runtime hình ảnh.
        if (
            element.matches?.(UI_EXCLUSION_SELECTOR) &&
            !hasKnownRuntimeSignature &&
            !hasRootHint
        ) {
            return false;
        }

        if (!hasRootHint && !hasKnownRuntimeSignature) return false;

        if (element.getAttribute('aria-hidden') === 'true') return true;
        if (element.dataset?.effectQualityRoot === '1') return true;
        if (element.dataset?.fxqRoot === '1') return true;

        try {
            const style = getComputedStyle(element);
            const floating =
                style.position === 'fixed' ||
                style.position === 'absolute';

            // Lớp trang trí toàn web thường không nhận chuột.
            if (floating && style.pointerEvents === 'none') return true;

            // Một số ultimate/click overlay cần nhận chuột hoặc tự xử lý tương tác,
            // nhưng namespace + vị trí nổi vẫn đủ chắc chắn để coi là runtime hình ảnh.
            if (floating && hasKnownRuntimeSignature) return true;
        } catch (_) {}

        return false;
    }

    function markRoot(element) {
        if (!(element instanceof Element)) return;
        if (element.id === 'wfx-web-animation-layer') return;

        if (!element.matches?.('#global-effect-container, #virtual-pet-container')) {
            element.dataset.fxqRoot = '1';
        }

        const token = getTokenText(element);
        if (KNOWN_RUNTIME_NAMESPACE_RE.test(token)) {
            element.dataset.fxqRuntime = 'known';
        }
    }

    function shouldIgnoreDecorativeElement(element, root) {
        if (!(element instanceof Element)) return true;
        if (element === root) return true;
        if (element.id === 'virtual-pet-img') return true;
        if (element.matches?.('img#virtual-pet-img, button, input, select, textarea, label, a')) return true;

        if (!isKnownRoot(root) && element.closest?.(UI_EXCLUSION_SELECTOR)) {
            return true;
        }

        const token = getTokenText(element);
        if (STRUCTURAL_RE.test(token)) return true;

        return false;
    }

    function getRootCounter(root) {
        let counter = state.rootCounters.get(root);
        if (!counter) {
            counter = { secondary: 0, ambient: 0 };
            state.rootCounters.set(root, counter);
        }
        return counter;
    }

    function classifyDecorativeElement(element, root) {
        if (shouldIgnoreDecorativeElement(element, root)) return;
        if (element.dataset?.fxqWeight) return;

        const token = getTokenText(element);
        let weight = '';

        if (SECONDARY_RE.test(token)) {
            weight = 'secondary';
        } else if (AMBIENT_RE.test(token)) {
            weight = 'ambient';
        } else if (root.id === 'global-effect-container') {
            // Phần tử không có tên chuẩn nhưng nằm trong container hiệu ứng toàn màn hình.
            weight = 'ambient';
        }

        if (!weight) return;

        element.dataset.fxqWeight = weight;
        const counter = getRootCounter(root);
        const index = counter[weight]++;
        element.dataset.fxqIndex = String(index);

        if (weight === 'secondary' && index % 2 === 1) {
            element.dataset.fxqSkipMedium = '1';
        }
    }

    function processRoot(root) {
        if (!(root instanceof Element)) return;
        if (root.id === 'wfx-web-animation-layer') return;

        markRoot(root);
        root.querySelectorAll('*').forEach(node => {
            classifyDecorativeElement(node, root);
        });
    }

    function findManagedRootForNode(node) {
        if (!(node instanceof Element)) return null;

        if (node.matches?.('#global-effect-container, #virtual-pet-container')) {
            return node;
        }

        return node.closest?.(ROOT_SELECTOR) || null;
    }

    function isStoreCard(element) {
        return Boolean(
            element instanceof Element &&
            element.matches?.(STORE_CARD_SELECTOR)
        );
    }

    function findStoreCardForNode(node) {
        if (!(node instanceof Element)) return null;
        if (isStoreCard(node)) return node;
        return node.closest?.('[data-fxq-store-card="1"]') ||
            node.closest?.(STORE_CARD_SELECTOR) ||
            null;
    }

    function getStoreCardCounter(card) {
        let counter = state.storeCardCounters.get(card);
        if (!counter) {
            counter = { secondary: 0, ambient: 0 };
            state.storeCardCounters.set(card, counter);
        }
        return counter;
    }

    function classifyStoreCardElement(element, card) {
        if (!(element instanceof Element) || !(card instanceof Element)) return;
        if (element === card) return;
        if (element.dataset?.fxqCardWeight || element.dataset?.fxqCardPrimary === '1') return;

        const tagName = String(element.tagName || '').toLowerCase();
        const token = getTokenText(element);

        // Thành phần thao tác/nội dung phải giữ nguyên hoàn toàn.
        if (
            ['button', 'input', 'select', 'textarea', 'label', 'a'].includes(tagName) ||
            STORE_CARD_STRUCTURAL_RE.test(token)
        ) {
            return;
        }

        // Ảnh/icon/nhân vật chính không bao giờ bị ẩn; mức Thấp chỉ dừng animation liên tục.
        if (
            STORE_CARD_PRIMARY_RE.test(token) ||
            (tagName === 'img' && !/(tag|badge|label|lock)/i.test(token))
        ) {
            element.dataset.fxqCardPrimary = '1';
            return;
        }

        let weight = '';

        if (STORE_CARD_SECONDARY_RE.test(token) || SECONDARY_RE.test(token)) {
            weight = 'secondary';
        } else if (STORE_CARD_AMBIENT_RE.test(token) || AMBIENT_RE.test(token)) {
            weight = 'ambient';
        } else {
            // Fallback cho hiệu ứng tương lai: lớp tuyệt đối, không nhận chuột thường là trang trí.
            try {
                const style = getComputedStyle(element);
                if (
                    style.pointerEvents === 'none' &&
                    (style.position === 'absolute' || style.position === 'fixed')
                ) {
                    weight = 'ambient';
                }
            } catch (_) {}
        }

        if (!weight) return;

        element.dataset.fxqCardWeight = weight;
        const counter = getStoreCardCounter(card);
        const index = counter[weight]++;
        element.dataset.fxqCardIndex = String(index);

        if (weight === 'secondary' && index % 2 === 1) {
            element.dataset.fxqCardSkipMedium = '1';
        }
    }

    function processStoreCard(card) {
        if (!(card instanceof Element)) return;
        card.dataset.fxqStoreCard = '1';

        const itemId = String(card.getAttribute('data-item-id') || '').trim();
        if (itemId) card.dataset.fxqItemId = itemId;

        card.querySelectorAll('*').forEach(element => {
            classifyStoreCardElement(element, card);
        });
    }

    function scanStoreCards(root = document) {
        root.querySelectorAll?.(STORE_CARD_SELECTOR).forEach(processStoreCard);
    }

    function getDetectionStats() {
        const managedRoots = new Set();

        document.querySelectorAll(
            '#global-effect-container, #virtual-pet-container, [data-fxq-root="1"], [data-effect-quality-root="1"]'
        ).forEach(node => managedRoots.add(node));

        return {
            roots: managedRoots.size,
            customRuntimes: document.querySelectorAll('[data-fxq-runtime="known"]').length,
            storeCards: document.querySelectorAll('[data-fxq-store-card="1"]').length,
            decorations: document.querySelectorAll('[data-fxq-weight], [data-fxq-card-weight]').length
        };
    }

    function updateDetectionUI() {
        const el = document.getElementById(DETECTION_ID);
        if (!el) return;

        const stats = getDetectionStats();
        el.textContent =
            `Tự nhận diện: ${stats.customRuntimes} runtime vật phẩm mới • ` +
            `${stats.storeCards} card • ${stats.decorations} lớp trang trí.`;
    }

    function processAddedNode(node) {
        if (!(node instanceof Element)) return;

        // Card cửa hàng được render động bằng innerHTML; quét ngay khi xuất hiện.
        const storeCard = findStoreCardForNode(node);
        if (storeCard) {
            processStoreCard(storeCard);
        }
        scanStoreCards(node);

        if (isKnownRoot(node) || isBodyEffectRootCandidate(node)) {
            markRoot(node);
            processRoot(node);
        } else {
            const root = findManagedRootForNode(node);
            if (root && root.id !== 'wfx-web-animation-layer') {
                classifyDecorativeElement(node, root);
                node.querySelectorAll?.('*').forEach(child => {
                    classifyDecorativeElement(child, root);
                });
            }
        }

        node.querySelectorAll?.('#global-effect-container, #virtual-pet-container, [data-effect-quality-root="1"], [data-fxq-root="1"]').forEach(root => {
            processRoot(root);
        });

        // Hiệu ứng fullscreen/pet realm mới trong tương lai thường được append thẳng vào body.
        node.querySelectorAll?.('*').forEach(candidate => {
            if (isBodyEffectRootCandidate(candidate)) {
                markRoot(candidate);
                processRoot(candidate);
            }
        });
    }

    function scanExistingEffects() {
        document.querySelectorAll('#global-effect-container, #virtual-pet-container, [data-effect-quality-root="1"], [data-fxq-root="1"]').forEach(processRoot);
        scanStoreCards(document);

        [...document.body?.children || []].forEach(child => {
            if (isBodyEffectRootCandidate(child)) {
                markRoot(child);
                processRoot(child);
            }
        });

        state.lastScanAt = Date.now();
        updateDetectionUI();
    }

    function flushObserverQueue() {
        state.observerFlushHandle = null;

        const nodes = [...state.pendingNodes];
        state.pendingNodes.clear();

        nodes.forEach(processAddedNode);
        updateDetectionUI();
    }

    function queueObservedNode(node) {
        if (!(node instanceof Element)) return;
        state.pendingNodes.add(node);

        if (state.observerFlushHandle !== null) return;

        const schedule = window.requestAnimationFrame || (callback => setTimeout(callback, 16));
        state.observerFlushHandle = schedule(flushObserverQueue);
    }

    function installObserver() {
        if (state.observer || !document.body) return;

        state.observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(queueObservedNode);
                    return;
                }

                if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    if (!(target instanceof Element)) return;

                    // Chỉ quét lại khi phần tử có khả năng thuộc runtime/card đang quản lý.
                    if (
                        findManagedRootForNode(target) ||
                        findStoreCardForNode(target) ||
                        isBodyEffectRootCandidate(target)
                    ) {
                        queueObservedNode(target);
                    }
                }
            });
        });

        state.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }

    function getEffectiveLevel() {
        return state.enabled ? state.level : 'high';
    }

    function getIntervalMultiplier() {
        return LEVELS[getEffectiveLevel()]?.intervalMultiplier || 1;
    }

    function scaleInterval(delay) {
        const numeric = Number(delay);
        if (!Number.isFinite(numeric) || numeric <= 0) return delay;

        const multiplier = getIntervalMultiplier();
        if (multiplier <= 1) return numeric;

        const minimum = state.level === 'low' ? 180 : 90;
        return Math.max(minimum, Math.round(numeric * multiplier));
    }

    function getEffectManagerReference() {
        try {
            if (typeof EffectManager !== 'undefined') return EffectManager;
        } catch (_) {}

        return window.EffectManager || null;
    }

    function runWithScaledVisualIntervals(fn, thisArg, args) {
        if (!state.enabled || state.level === 'high' || state.timerPatchDepth > 0) {
            return fn.apply(thisArg, args);
        }

        const nativeSetInterval = window.setInterval;
        state.timerPatchDepth += 1;

        window.setInterval = function (handler, delay, ...rest) {
            return nativeSetInterval.call(
                window,
                handler,
                scaleInterval(delay),
                ...rest
            );
        };

        try {
            return fn.apply(thisArg, args);
        } finally {
            window.setInterval = nativeSetInterval;
            state.timerPatchDepth = Math.max(0, state.timerPatchDepth - 1);
        }
    }

    function patchEffectManager() {
        const manager = getEffectManagerReference();
        if (!manager) return false;

        let patchedAny = false;

        Object.getOwnPropertyNames(manager).forEach(name => {
            if (!/^create[A-Z]/.test(name)) return;

            const original = manager[name];
            if (typeof original !== 'function') return;
            if (original.__fxqWrapped === true) return;

            const wrapped = function (...args) {
                return runWithScaledVisualIntervals(original, this, args);
            };

            Object.defineProperty(wrapped, '__fxqWrapped', {
                value: true,
                configurable: false
            });

            Object.defineProperty(wrapped, '__fxqOriginal', {
                value: original,
                configurable: false
            });

            try {
                manager[name] = wrapped;
                patchedAny = true;
            } catch (_) {}
        });

        state.effectManagerPatched = state.effectManagerPatched || patchedAny;
        return patchedAny;
    }

    function restartActiveGlobalEffect() {
        clearTimeout(state.restartTimer);

        state.restartTimer = setTimeout(() => {
            const manager = getEffectManagerReference();
            const activeEffect = String(
                localStorage.getItem('active_effect') || ''
            ).trim();

            if (!manager || !activeEffect || typeof manager.applyEffect !== 'function') {
                return;
            }

            try {
                // Chỉ dựng lại lớp hiển thị để interval nhận mức mới.
                // Không thay item, quyền sở hữu, Coin hay Firebase.
                manager.applyEffect(activeEffect);
            } catch (error) {
                console.warn('[EffectQualityManager] Không thể làm mới hiệu ứng đang dùng:', error);
            }
        }, 0);
    }

    function getWebAnimationState() {
        try {
            return window.WebAnimationSystem?.getState?.() || null;
        } catch (_) {
            return null;
        }
    }

    function applyWebAnimationPolicy() {
        const api = window.WebAnimationSystem;
        if (!api) return;

        const shouldForcePause = state.enabled && state.level === 'low';

        if (shouldForcePause && !state.forcedWebAnimationPause) {
            const current = getWebAnimationState();
            state.webAnimationWasEnabled = current?.enabled !== false;

            if (state.webAnimationWasEnabled) {
                try {
                    api.disable?.();
                    state.forcedWebAnimationPause = true;
                } catch (_) {}
            }
            return;
        }

        if (!shouldForcePause && state.forcedWebAnimationPause) {
            if (state.webAnimationWasEnabled) {
                try {
                    api.enable?.();
                } catch (_) {}
            }

            state.forcedWebAnimationPause = false;
        }
    }

    function applyRootClasses() {
        const root = document.documentElement;
        if (!root) return;

        root.classList.remove('fxq-enabled', 'fxq-high', 'fxq-medium', 'fxq-low');
        root.removeAttribute('data-effect-quality');

        if (!state.enabled) return;

        root.classList.add('fxq-enabled', `fxq-${state.level}`);
        root.setAttribute('data-effect-quality', state.level);
    }

    function updateSettingsUI() {
        const toggle = document.getElementById(TOGGLE_ID);
        const levels = document.getElementById(LEVELS_ID);
        const status = document.getElementById(STATUS_ID);

        if (toggle) toggle.checked = state.enabled;
        if (levels) levels.hidden = !state.enabled;
        updateDetectionUI();

        document.querySelectorAll(`#${LEVELS_ID} [data-fxq-level]`).forEach(button => {
            const active = button.dataset.fxqLevel === state.level;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        if (!status) return;

        if (!state.enabled) {
            status.textContent = 'Đang tắt • Website giữ nguyên hiệu ứng gốc';
            return;
        }

        if (state.level === 'high') {
            status.textContent = 'Cao • Đầy đủ hiệu ứng, không giảm chất lượng';
        } else if (state.level === 'medium') {
            status.textContent = 'Trung bình • Giảm hạt/lớp phụ, hiệu ứng card và tần suất sinh hiệu ứng';
        } else {
            status.textContent = 'Thấp • Giảm tối đa hiệu ứng vật phẩm/card/web, ưu tiên độ ổn định của máy';
        }
    }

    function announceChange() {
        try {
            window.dispatchEvent(new CustomEvent('effect-quality-change', {
                detail: {
                    enabled: state.enabled,
                    level: state.level,
                    effectiveLevel: getEffectiveLevel(),
                    intervalMultiplier: getIntervalMultiplier(),
                    stats: getDetectionStats()
                }
            }));
        } catch (_) {}
    }

    function applyState(options = {}) {
        applyRootClasses();
        updateSettingsUI();
        scanExistingEffects();
        patchEffectManager();
        applyWebAnimationPolicy();

        if (options.restartEffect === true) {
            restartActiveGlobalEffect();
        }

        announceChange();
    }

    function setEnabled(enabled, options = {}) {
        const next = Boolean(enabled);
        const changed = state.enabled !== next;
        state.enabled = next;

        if (state.enabled && !LEVELS[state.level]) {
            state.level = 'high';
        }

        if (options.persist !== false) saveStoredState();
        applyState({ restartEffect: changed || options.restartEffect === true });
    }

    function setLevel(level, options = {}) {
        const normalized = normalizeLevel(level);
        const changed = state.level !== normalized;
        state.level = normalized;

        if (options.persist !== false) saveStoredState();
        applyState({ restartEffect: changed || options.restartEffect === true });
    }

    function injectSettingsControl() {
        if (document.getElementById(SETTINGS_ROW_ID)) {
            updateSettingsUI();
            return true;
        }

        const settingsTab = document.getElementById('tab-settings');
        const container = settingsTab?.querySelector('.form-container');
        if (!container) return false;

        const row = document.createElement('div');
        row.id = SETTINGS_ROW_ID;
        row.innerHTML = `
            <div class="fxq-setting-head">
                <div class="fxq-setting-copy">
                    <strong>✨ Mức hiệu ứng vật phẩm & web</strong>
                    <p>
                        Tự nhận diện hiệu ứng động của vật phẩm, thú cưng, Premium/Luxury, card Cửa hàng thường/Sang trọng và Web Animations.
                        Vật phẩm mới được quét theo runtime/lớp hiệu ứng, không cần khai báo từng ID. Không giảm theme và không thay đổi chức năng hay dữ liệu.
                    </p>
                    <span id="${STATUS_ID}">Đang tắt • Website giữ nguyên hiệu ứng gốc</span>
                    <span id="${DETECTION_ID}">Đang quét các lớp hiệu ứng...</span>
                    <button type="button" id="${RESCAN_ID}">↻ Quét lại hiệu ứng mới</button>
                </div>
                <label class="switch" title="Bật điều chỉnh mức hiệu ứng">
                    <input type="checkbox" id="${TOGGLE_ID}">
                    <span class="slider"></span>
                </label>
            </div>

            <div id="${LEVELS_ID}" hidden aria-label="Chọn mức hiệu ứng">
                <button type="button" class="fxq-level-btn" data-fxq-level="high" aria-pressed="false">
                    <strong>🌟 Cao</strong>
                    <small>Đầy đủ hiệu ứng</small>
                </button>
                <button type="button" class="fxq-level-btn" data-fxq-level="medium" aria-pressed="false">
                    <strong>⚖️ Trung bình</strong>
                    <small>Giảm một phần hiệu ứng</small>
                </button>
                <button type="button" class="fxq-level-btn" data-fxq-level="low" aria-pressed="false">
                    <strong>🛡️ Thấp</strong>
                    <small>Ưu tiên máy ổn định</small>
                </button>
            </div>
        `;

        // Đặt đầu nhóm cài đặt để dễ tìm; không sửa HTML chức năng có sẵn.
        container.insertBefore(row, container.firstChild);

        row.querySelector(`#${TOGGLE_ID}`)?.addEventListener('change', event => {
            const checked = Boolean(event.target.checked);

            // Lần đầu bật luôn bắt đầu ở Cao như yêu cầu.
            if (checked && !state.enabled && !LEVELS[state.level]) {
                state.level = 'high';
            }

            setEnabled(checked, { persist: true });
        });

        row.querySelector(`#${RESCAN_ID}`)?.addEventListener('click', () => {
            patchEffectManager();
            scanExistingEffects();
            updateDetectionUI();
        });

        row.querySelectorAll('[data-fxq-level]').forEach(button => {
            button.addEventListener('click', () => {
                if (!state.enabled) return;
                setLevel(button.dataset.fxqLevel, { persist: true });
            });
        });

        updateSettingsUI();
        return true;
    }

    function init() {
        if (state.initialized) return;
        state.initialized = true;

        injectStyles();

        const stored = loadStoredState();
        state.enabled = stored.enabled;
        state.level = stored.level;

        injectSettingsControl();
        patchEffectManager();
        installObserver();
        scanExistingEffects();
        applyState({ restartEffect: false });

        // Một số trang render tab Cài đặt sau; thử lại nhẹ, không tạo timer lặp vô hạn.
        if (!document.getElementById(SETTINGS_ROW_ID)) {
            setTimeout(injectSettingsControl, 500);
            setTimeout(injectSettingsControl, 1400);
        }

        // effect-quality-manager được nạp trước luxury-store.js trên trang học sinh.
        // Quét lại vài nhịp để tự nhận các runtime Premium/Luxury được đăng ký sau.
        [700, 1800, 4200].forEach(delay => {
            setTimeout(() => {
                patchEffectManager();
                scanExistingEffects();
            }, delay);
        });

        window.addEventListener('load', () => {
            patchEffectManager();
            scanExistingEffects();
        }, { once: true });

        window.addEventListener('storage', event => {
            if (event.key !== getStorageKey()) return;

            const next = loadStoredState();
            state.enabled = next.enabled;
            state.level = next.level;
            applyState({ restartEffect: true });
        });

        console.info(
            `[EffectQualityManager] v${VERSION} ready — ` +
            `${state.enabled ? state.level.toUpperCase() : 'OFF'}`
        );
    }

    window.EffectQualityManager = Object.freeze({
        version: VERSION,
        init,
        isEnabled: () => state.enabled,
        getLevel: () => state.level,
        getEffectiveLevel,
        getIntervalMultiplier,
        scaleInterval,
        setEnabled: enabled => setEnabled(enabled, { persist: true }),
        setLevel: level => setLevel(level, { persist: true }),
        refresh: () => {
            patchEffectManager();
            scanExistingEffects();
            applyWebAnimationPolicy();
            updateSettingsUI();
            return getDetectionStats();
        },
        rescan: () => {
            patchEffectManager();
            scanExistingEffects();
            return getDetectionStats();
        },
        getStats: getDetectionStats,
        markRoot: element => {
            if (!(element instanceof Element)) return false;
            element.dataset.effectQualityRoot = '1';
            processRoot(element);
            return true;
        },
        markStoreCard: element => {
            if (!(element instanceof Element)) return false;
            processStoreCard(element);
            return true;
        },
        getRecommendedCount(baseCount) {
            const base = Math.max(0, Number(baseCount) || 0);
            const level = getEffectiveLevel();

            if (level === 'medium') return Math.max(1, Math.ceil(base * 0.58));
            if (level === 'low') return Math.max(1, Math.ceil(base * 0.24));
            return Math.ceil(base);
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
