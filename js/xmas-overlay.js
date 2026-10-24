/* Trang trí độc lập. Xóa dòng nhúng script để gỡ. Không dùng dịch vụ bên ngoài. */
(() => {
  'use strict';
  const CONFIG = {
    forceOn: false, // Xem thử bằng true hoặc thêm ?xmas=1 vào URL; không lưu ép bật.
    previewButton: true, // Riêng bản test: hiện nút xem thử cả ngoài mùa.
    season: { start: [12, 20], end: [1, 5] }, // [tháng, ngày], gồm cả ngày cuối.
    controls: { headings: true, actions: true }, // Sticker riêng cho tiêu đề; viền trang trí riêng cho bốn ô trên.
    priority: { luxury: true }, // Vật phẩm sang trọng luôn ưu tiên, kể cả khi preview.
    storageKey: 'xmas-test-enabled',
    background: { enabled: true, frost: '#e1f0f3', mint: '#b8dcd0', gold: '#fff0cf', fir: '#397665' },
    snow: { enabled: true, desktop: 64, mobile: 24, maxDpr: 1.5,
      color: '#9acddd', opacity: 0.85, minSize: 4, maxSize: 9.2, speed: 17, lineWidth: 1 },
    lights: { enabled: true, spacing: 60, height: 20, wire: '#395a4b',
      colors: ['#d94f64', '#edc363', '#69b493', '#fff1cb'] },
    garlands: { enabled: true, maxCards: 4 }, // Dây thông ở khe cột và mép thẻ; không đổi bố cục.
    ornaments: { enabled: true, sceneHeight: 136 }, // Hình riêng mỗi mục; tự né menu.
    hat: { enabled: true, selector: '.login-heading h2, #studentName',
      width: 42, offsetX: -3, offsetY: 2, rotation: 16, red: '#b93650', trim: '#fff6e6' },
    banner: { enabled: false, text: 'Chúc mừng Giáng Sinh', top: 17,
      color: '#74402c', background: '#fff5df' },
    button: { side: 'left', bottom: 16, inset: 16, color: '#254f46',
      avoid: '.mobile-app-nav, .btn-logout, #coinWidget, #virtual-pet-container, .nug-launcher, #appeals-notification' },
    layers: { ornaments: 130, snow: 80, lights: 950, hat: 950, banner: 850, button: 850 }
  };
  const KEY = 'xmas-overlay';
  if (window[KEY]) return; // Nhúng nhầm hai lần cũng chỉ có một bộ hiệu ứng.
  let destroyed = false, booted = false, enabled = true, active = false;
  let previewOnly = false; // Chỉ trong bộ nhớ trang; reload tự kết thúc.
  let host, shadow, style, canvas, ctx, lights, hat, banner, button, motion;
  let frame = 0, layoutFrame = 0, clock = 0, timer = 0, width = 0, height = 0;
  let last = 0, elapsed = 0, flakes = [], small = false, reduced = false;
  const cleanups = [], source = document.currentScript;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const dayKey = date => (date.getMonth() + 1) * 100 + date.getDate();
  function inSeason(date) {
    const d = dayKey(date), a = CONFIG.season.start[0] * 100 + CONFIG.season.start[1];
    const b = CONFIG.season.end[0] * 100 + CONFIG.season.end[1];
    return a <= b ? d >= a && d <= b : d >= a || d <= b;
  }
  function allowed() {
    return previewOnly || CONFIG.forceOn || new URLSearchParams(location.search).get('xmas') === '1' || inSeason(new Date());
  }
  function controlsAvailable() { return CONFIG.previewButton || allowed(); }
  function listen(target, event, fn, options) {
    target.addEventListener(event, fn, options);
    cleanups.push(() => target.removeEventListener(event, fn, options));
  }
  function element(tag, name) {
    const node = document.createElement(tag);
    node.id = node.className = 'xmas-' + name;
    return node;
  }
  function svg(tag, attributes = {}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    return node;
  }
  function visible(node) {
    if (!node || !node.getClientRects().length) return false;
    if (node.checkVisibility) return node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const css = getComputedStyle(node);
    return css.visibility !== 'hidden' && css.display !== 'none' && css.opacity !== '0';
  }
  function query(selector) {
    try { return [...document.querySelectorAll(selector)]; } catch (_) { return []; }
  }
  // Artwork stays local: vector decorations and supplied ticker images; no external services.
  let ornaments, vignette, artTheme = '';
  const THEMES = {
    todo: ['#245d48', '#bb3e56', '#dfbd74'], grades: ['#73533c', '#b74660', '#f0d18b'],
    materials: ['#3f697d', '#b94b57', '#e0c69c'], roadmap: ['#4d7180', '#ad3b50', '#d6b76d'],
    game: ['#9a603c', '#d45d70', '#e4bb7d'], store: ['#38546b', '#91354e', '#d7ae60'],
    history: ['#5c6653', '#a7643e', '#edcc85'], settings: ['#6d9eaf', '#a4cbd4', '#eefaff']
  };
  function currentArtTheme() {
    const panel = query('.tab-content.active').find(visible);
    const id = (panel?.id || '').replace('tab-', '');
    if (THEMES[id]) return id;
    return ({ create: 'todo', assigned: 'todo', list: 'grades', transactions: 'history',
      'game-manage': 'game', 'question-bank': 'materials', 'manage-students': 'store' })[id] || 'todo';
  }
  function sceneMarkup(theme) {
    const scenes = {
      todo: `<path d="M87 27L57 68H70L45 99H77V115H95V99H125L102 68H114Z" fill="url(#xmas-fir)"/>
        <path d="M74 49Q89 56 101 49M62 77Q90 89 113 77M57 94Q89 104 118 94" fill="none" stroke="#e8cb85" stroke-width="2"/>
        <path d="M87 15l3 8 9 1-7 6 2 9-7-5-8 5 3-9-7-6 9-1Z" fill="#f3ce78"/>
        <g fill="#ca4a5e"><circle cx="79" cy="61" r="4"/><circle cx="99" cy="89" r="4"/><circle cx="71" cy="93" r="3"/></g>
        <g fill="#fff4d7"><circle cx="95" cy="65" r="2"/><circle cx="85" cy="84" r="2"/><circle cx="105" cy="98" r="2"/></g>
        <rect x="27" y="99" width="36" height="27" rx="3" fill="#b53c55"/><path d="M45 99v27M27 108h36" stroke="#f2cb87" stroke-width="4"/>
        <path d="M45 99c-20-1-12-17 0-3 12-14 20 2 0 3" fill="none" stroke="#f2cb87" stroke-width="3"/>
        <rect x="111" y="106" width="37" height="22" rx="3" fill="#f1d5a0"/><path d="M130 106v22M111 113h37" stroke="#ba4259" stroke-width="4"/>`,
      grades: `<path d="M53 49Q50 30 72 36L90 48Q119 21 127 40Q133 59 94 55" fill="#b4435e" stroke="#e58491" stroke-width="2"/>
        <path d="M87 51L72 80 69 63 57 64 83 48M94 51l22 24 1-15 12 1-29-14" fill="#9c304a"/>
        <g transform="rotate(17 69 85)"><path d="M49 100Q57 87 55 73Q55 55 70 55Q85 55 84 73Q82 89 93 100Z" fill="url(#xmas-gold)"/><ellipse cx="71" cy="101" rx="23" ry="6" fill="#a77a3d"/><circle cx="71" cy="104" r="5" fill="#edce8d"/><path d="M61 70v20" stroke="#fff1b9" stroke-width="3" stroke-linecap="round"/></g>
        <g transform="rotate(-17 114 88)"><path d="M94 103Q102 89 100 77Q100 59 114 59Q130 59 128 77Q127 91 138 103Z" fill="url(#xmas-gold)"/><ellipse cx="116" cy="104" rx="23" ry="6" fill="#a77a3d"/><circle cx="116" cy="107" r="5" fill="#edce8d"/></g><circle cx="90" cy="49" r="7" fill="#d27985"/>`,
      materials: `<g transform="rotate(-9 88 85)"><rect x="49" y="32" width="80" height="83" rx="4" fill="#f8ebce"/><rect x="55" y="38" width="68" height="71" rx="2" fill="none" stroke="#ba8e57" stroke-dasharray="3 3"/><path d="M64 53h34M64 62h46M64 71h38" stroke="#9f835e" stroke-width="2"/><rect x="105" y="44" width="12" height="16" fill="#67958c"/></g>
        <path d="M34 73h112v54H34Z" fill="#dfc394"/><path d="M34 73l56 39 56-39" fill="#f6dfb7" stroke="#c6a06d"/><path d="M34 127l40-31M146 127l-39-31" stroke="#b99668"/>
        <circle cx="90" cy="106" r="12" fill="#a63b4d"/><circle cx="90" cy="106" r="8" fill="none" stroke="#d77b80"/><path d="M85 111v-9l10 9v-9" fill="none" stroke="#f2c5a4" stroke-width="1.4"/>
        <path d="M135 105Q127 63 154 36Q163 70 135 105M135 105l-8 21" fill="#eae9dd" stroke="#b7bbac"/><path d="M139 83l10-26M139 76l10-3M140 68l8-3" stroke="#9faaa2"/>`,
      roadmap: `<path d="M39 112h92q20 0 25-18" fill="none" stroke="#d9b569" stroke-width="5" stroke-linecap="round"/><path d="M59 101l-6 11M121 99l7 13" stroke="#d9b569" stroke-width="4"/>
        <path d="M40 75q17 17 74 11l9-28q11-13 18-3-12-2-13 14l-5 31H55q-15-1-15-25" fill="#ac3d53" stroke="#df7a82" stroke-width="2"/>
        <path d="M50 87q26 16 66 6" fill="none" stroke="#e6c17b" stroke-width="2"/><path d="M66 83q-20-29 3-43l18-2q30 17 16 48" fill="#47765b"/><path d="M70 40l-8-12 18 4 13-6-6 15" fill="#6c9971"/><path d="M67 41h22" stroke="#d6b269" stroke-width="4"/>
        <rect x="92" y="54" width="25" height="28" rx="2" fill="#e3bd76"/><path d="M105 54v28M92 63h25" stroke="#b54759" stroke-width="3"/><path d="M27 126h88M32 119h27" stroke="#b8d5dd" stroke-width="2" stroke-linecap="round"/>`,
      game: `<path d="M62 73L40 87q-10 8-15-2-4-6 4-12l35-21h42l34 21q10 7 3 14-5 6-13 0l-21-13 1 24 15 19q7 12-5 16-7 2-14-9l-18-20-16 22q-8 11-17 4-6-5 0-14l14-20Z" fill="url(#xmas-cookie)" stroke="#e0ad71" stroke-width="3"/>
        <circle cx="86" cy="40" r="25" fill="url(#xmas-cookie)" stroke="#e0ad71" stroke-width="3"/><g fill="#613e31"><circle cx="77" cy="37" r="2.5"/><circle cx="95" cy="37" r="2.5"/></g><path d="M77 46q9 10 18 0" fill="none" stroke="#fff0d4" stroke-width="3" stroke-linecap="round"/>
        <path d="M83 65l-12-7v15l12-5 14 5V58Z" fill="#b53752"/><g fill="#f8e6c7"><circle cx="86" cy="80" r="4"/><circle cx="86" cy="94" r="4"/></g><path d="M35 75l7 10M126 75l-6 10M61 113l9 5M106 114l9-5" stroke="#fff2df" stroke-width="3"/>
        <path d="M151 119V79q0-13 10-13t10 13" fill="none" stroke="#fff0d9" stroke-width="8"/><path d="M151 110v-5m0-11v-5m2-15 5-5m9 3 3 6" stroke="#c94c62" stroke-width="6"/>`,
      store: `<path d="M68 24h44v22H68Z" fill="#263f53" stroke="#d0ab62" stroke-width="2"/><path d="M64 44h52" stroke="#edcf87" stroke-width="4"/><rect x="73" y="47" width="34" height="31" rx="10" fill="#ebc79a"/><path d="M73 59h-7v25l12-5M107 59h7v25l-12-5" fill="#eee8d8"/><circle cx="82" cy="58" r="2"/><circle cx="98" cy="58" r="2"/><path d="M80 69h20M83 73h14" stroke="#654239" stroke-width="2"/>
        <path d="M66 80h48v35H66Z" fill="#a6324c"/><path d="M90 80v35M69 88h42M69 101h42" stroke="#e8c37b" stroke-width="2"/><g fill="#f0d496"><circle cx="77" cy="88" r="3"/><circle cx="103" cy="88" r="3"/><circle cx="77" cy="101" r="3"/><circle cx="103" cy="101" r="3"/></g><path d="M69 114v17h16v-17M96 114v17h16v-17" fill="#273e54"/><path d="M60 82v28M120 82v28" stroke="#d6b775" stroke-width="8"/>
        <path d="M53 135h70" stroke="#e6c482" stroke-width="5" stroke-linecap="round"/><path d="M85 29h10v9H85Z" fill="#d8b66e"/>`,
      history: `<path d="M79 27q-6-17 11-17t11 17" fill="none" stroke="#b98d51" stroke-width="3"/><path d="M63 41l14-15h26l14 15Z" fill="#a47745"/><rect x="60" y="43" width="60" height="78" rx="7" fill="#f8dfa0" stroke="#9d7648" stroke-width="4"/>
        <rect x="68" y="50" width="44" height="62" rx="3" fill="url(#xmas-flame)"/><path d="M60 48l60 69M120 48l-60 69" stroke="#b78b50" stroke-width="2"/><rect x="83" y="81" width="14" height="29" rx="3" fill="#fff1cb"/><path d="M90 81q-12-9 1-24 10 16-1 24" fill="#eda954"/><path d="M90 76q-5-5 0-10 4 6 0 10" fill="#fffbe6"/>
        <path d="M56 122h68l5 8H51Z" fill="#9b7447"/><path d="M131 98q-5-19 10-31M131 98q17-6 25-1" fill="none" stroke="#7e9270" stroke-width="3"/><g fill="#9bab83"><ellipse cx="139" cy="79" rx="4" ry="9" transform="rotate(30 139 79)"/><ellipse cx="146" cy="95" rx="9" ry="4"/></g>`,
      settings: `<circle cx="90" cy="65" r="48" fill="url(#xmas-glass)" stroke="#b7e2e9" stroke-width="2"/><path d="M48 85q42-9 83 0a44 44 0 0 1-83 0" fill="#ebf6f4"/><circle cx="90" cy="79" r="19" fill="#fffdf3"/><circle cx="90" cy="53" r="13" fill="#fffdf3"/><path d="M76 42h28M80 40V29h19v11" stroke="#45697a" stroke-width="4"/><path d="M78 65h25M99 66v15" stroke="#bd4d62" stroke-width="5"/><circle cx="86" cy="51" r="1.5"/><circle cx="96" cy="51" r="1.5"/><path d="M91 55l10 3-10 2" fill="#df9959"/><path d="M64 120h52l7 13H57Z" fill="#527b8d"/><path d="M64 121h52" stroke="#d7eef0" stroke-width="3"/>
        <path d="M57 58q-2-22 20-29" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/><g fill="#fff"><circle cx="62" cy="73" r="2"/><circle cx="112" cy="42" r="2"/><circle cx="118" cy="75" r="2"/><circle cx="73" cy="46" r="1.5"/></g>`
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 145" aria-hidden="true"><defs>
      <linearGradient id="xmas-fir" x2="1" y2="1"><stop stop-color="#588b67"/><stop offset="1" stop-color="#163f37"/></linearGradient>
      <linearGradient id="xmas-gold"><stop stop-color="#ab793e"/><stop offset=".38" stop-color="#ffe7aa"/><stop offset="1" stop-color="#c59750"/></linearGradient>
      <linearGradient id="xmas-cookie" x2="0" y2="1"><stop stop-color="#d59a5f"/><stop offset="1" stop-color="#a96a3c"/></linearGradient>
      <radialGradient id="xmas-flame"><stop stop-color="#fff9d1"/><stop offset="1" stop-color="#e0ab5b"/></radialGradient>
      <radialGradient id="xmas-glass" cx=".3" cy=".2"><stop stop-color="#e9faff" stop-opacity=".7"/><stop offset="1" stop-color="#82b8ca" stop-opacity=".3"/></radialGradient>
      </defs><ellipse cx="90" cy="134" rx="65" ry="5" fill="#c9dbe3" opacity=".2"/>${scenes[theme]}</svg>`;
  }
  function refreshArt() {
    const theme = currentArtTheme();
    if (theme === artTheme) return;
    artTheme = theme;
    const [green, red, gold] = THEMES[theme];
    // The rich vignette changes completely for every section, not just its colors.
    vignette.innerHTML = sceneMarkup(theme);
    let needles = '';
    for (let i = 0; i < 18; i++) {
      const x = 7 + i * 10, y = 5 + Math.sin(i * .3) * 4;
      needles += `<path d="M${x} ${y}l-8 12m8-12 7 10m-2-12 8 5" stroke="${i % 2 ? green : '#6b957a'}" stroke-width="2" stroke-linecap="round"/>`;
    }
    const sprig = `<svg viewBox="0 0 220 46" aria-hidden="true"><path d="M0 6Q92 2 199 12" stroke="${green}" stroke-width="2" fill="none"/>${needles}
      <path d="M28 16q-17-12-19 0t19 4q17-15 22-4t-20 4" fill="${red}"/><circle cx="29" cy="18" r="4" fill="${gold}"/>
      <path d="M26 21l-5 15 8-5 6 6-4-16" fill="${red}"/><g fill="${gold}"><circle cx="67" cy="15" r="3"/><circle cx="133" cy="12" r="2"/></g>
      <g fill="${red}"><circle cx="90" cy="12" r="3"/><circle cx="96" cy="15" r="3"/><circle cx="92" cy="19" r="3"/></g></svg>`;
    const charm = theme === 'materials' ? `<rect x="2" y="24" width="14" height="12" fill="#f5ddb5" stroke="${gold}"/><path d="M2 24l7 7 7-7" fill="none" stroke="${red}"/>` :
      theme === 'game' ? `<path d="M8 47V25q0-10 7-8t0 12" fill="none" stroke="#fff1dc" stroke-width="6"/><path d="M8 43v-4m0-6v-4m2-8 4-2" stroke="${red}" stroke-width="4"/>` :
      theme === 'settings' ? `<path d="M9 19l7 10-7 22-7-22Z" fill="#c2e5ee" stroke="#83b3c3"/><path d="M9 19v32" stroke="#fff"/>` :
      `<ellipse cx="9" cy="33" rx="7" ry="9" fill="${red}"/><path d="M4 30q5-4 10 0M3 35q6 5 12 0" stroke="${gold}" fill="none"/><rect x="6" y="21" width="6" height="4" rx="1" fill="${gold}"/>`;
    const chain = `<svg viewBox="0 0 20 210" aria-hidden="true"><path d="M9 0v192" stroke="${gold}" stroke-width=".8" opacity=".6"/>${[0,70,140].map(y => `<g transform="translate(0 ${y})">${charm}<circle cx="9" cy="58" r="2" fill="${gold}"/></g>`).join('')}</svg>`;
    ornaments.innerHTML = `<div class="xmas-sprig xmas-sprig-left">${sprig}</div><div class="xmas-sprig xmas-sprig-right">${sprig}</div><div class="xmas-chain xmas-chain-left">${chain}</div><div class="xmas-chain xmas-chain-right">${chain}</div>`;
  }
  function positionArt() {
    ornaments.hidden = vignette.hidden = !active || !CONFIG.ornaments.enabled;
    if (!active || !CONFIG.ornaments.enabled) return;
    refreshArt();
    // Use only genuinely empty sidebar space, never move or cover a menu item.
    const sidebar = query('#studentSidebar, #teacherSidebar').find(visible);
    vignette.hidden = true;
    if (!sidebar || width <= 768) return;
    const box = sidebar.getBoundingClientRect();
    if (box.width < 150) return;
    const occupied = [...query('#studentSidebar button, #studentSidebar h3, #teacherSidebar button, #teacherSidebar h3'), button]
      .filter(visible).map(n => n.getBoundingClientRect()).filter(r => r.bottom > box.top && r.top < box.bottom)
      .sort((a, b) => a.top - b.top);
    let start = Math.max(36, box.top + 12), gap = null;
    for (const r of [...occupied, { top: Math.min(height, box.bottom) - 12, bottom: box.bottom }]) {
      if (r.top - start >= 88 && (!gap || r.top - start > gap.end - gap.start)) gap = { start, end: r.top };
      start = Math.max(start, r.bottom + 8);
    }
    if (!gap) return;
    const h = Math.min(CONFIG.ornaments.sceneHeight, gap.end - gap.start - 8, (box.width - 24) * 145 / 180);
    vignette.style.height = `${h}px`; vignette.style.width = `${h * 180 / 145}px`;
    vignette.style.left = `${box.left + (box.width - h * 180 / 145) / 2}px`;
    vignette.style.top = `${gap.start + (gap.end - gap.start - h) / 2}px`;
    vignette.hidden = false;
  }
  let luxuryBlocked = false;
  const signalStyles = new Map(), actionTrims = new Map();
  // Read cosmetic UI state only. This never grants items, writes inventory, or changes account activation.
  let priorityReason = 'clear';
  function hasLuxuryPriority() {
    priorityReason = 'clear';
    const block = reason => { priorityReason = reason; return true; };
    if (!CONFIG.priority.luxury || !query('#studentDashboard').length) return false;
    try {
      const user = typeof currentUser !== 'undefined' ? currentUser : null;
      if (!user?.username || window.pageAuthBlocked) return block('account_not_ready');
      let cached;
      try { cached = JSON.parse((window.TestBrowserStorage?.localStorage || localStorage).getItem('currentUser') || 'null'); } catch (_) {}
      if (cached === null || (cached && String(cached.username || '') !== String(user.username))) return block('account_changed');
      const bridge = window.__luxuryInventoryBridgeState;
      const inventory = Array.isArray(window.myInventory) ? window.myInventory :
        typeof myInventory !== 'undefined' && Array.isArray(myInventory) ? myInventory :
        bridge?.username === String(user.username) && bridge.inventory && typeof bridge.inventory === 'object'
          ? Object.values(bridge.inventory) : null;
      if (!inventory) return block('inventory_loading');
      const equipped = inventory.filter(item => item && item.isEquipped === true &&
        (item.isTrial !== true || (Number.isFinite(Number(item.trialExpiry)) && Number(item.trialExpiry) > Date.now())));
      if (!equipped.length) return false;
      // Use the same classifier as the student's equipment runtime, including lazy-loaded items.
      const classify = typeof studentInventoryHasEquippedLuxury === 'function' ? studentInventoryHasEquippedLuxury : window.studentInventoryHasEquippedLuxury;
      if (typeof classify === 'function' && classify(equipped)) return block('luxury_equipped');
      let unresolved = false;
      for (const item of equipped) {
        if (item.luxuryOnly === true || window.LuxuryStore?.isLuxuryItem?.(item.id) === true) return block('luxury_equipped');
        const definition = typeof StoreManager !== 'undefined' && typeof StoreManager.getItemById === 'function' ? StoreManager.getItemById(item.id) : null;
        if (definition?.luxuryOnly === true) return block('luxury_equipped');
        // Missing catalog entries are not evidence of luxury. The existing classifier handles startup.
        if (!definition && typeof classify !== 'function') unresolved = true;
      }
      return unresolved ? block('catalog_loading') : false;
    } catch (_) { return block('lookup_error'); }
  }
  function priorityMessage() {
    return ({
      luxury_equipped: 'Noel đang nhường vật phẩm sang trọng đang trang bị. Gỡ trang bị trong Túi đồ rồi thử lại.',
      inventory_loading: 'Kho đồ chưa tải xong nên chưa kiểm tra được trang bị. Đây không phải thông báo bạn đang dùng đồ sang trọng. Hãy kiểm tra kết nối rồi thử lại.',
      catalog_loading: 'Danh mục vật phẩm chưa sẵn sàng. Hãy mở Túi đồ rồi thử lại; chưa xác định bạn có trang bị sang trọng.',
      account_not_ready: 'Thông tin tài khoản chưa sẵn sàng để đọc trang bị. Hãy chờ trang tải xong rồi thử lại.',
      account_changed: 'Phiên tài khoản đã thay đổi. Hãy lưu công việc và mở lại trang test/website đúng tài khoản.',
      lookup_error: 'Không đọc được trạng thái trang bị do lỗi xử lý. Chưa xác định đây là trang bị sang trọng.'
    })[priorityReason] || 'Có thể bật trang trí Noel.';
  }
  // Optimized copies of the supplied transparent ticker artwork. Paths work on file:// too.
  const SIGNAL_ART = {
    todo: 'tree', grades: 'star', materials: 'bear', roadmap: 'reindeer',
    game: 'gingerbread', store: 'cat', history: 'penguin', settings: 'snowman'
  };
  function clearControlArt() {
    for (const style of signalStyles.values()) style.remove();
    for (const node of actionTrims.values()) node.remove();
    signalStyles.clear(); actionTrims.clear();
  }
  function decorateControls() {
    if (!active) { clearControlArt(); return; }
    if (CONFIG.controls.headings) {
      const indicators = query('#studentDashboard .study-connection-dot');
      for (const [node, style] of signalStyles) if (!indicators.includes(node)) { style.remove(); signalStyles.delete(node); }
      for (const node of indicators) {
        if (!node.shadowRoot || signalStyles.has(node)) continue;
        const id = node.closest('.tab-content')?.id.replace('tab-', '');
        const art = SIGNAL_ART[id] || SIGNAL_ART.todo;
        const css = element('style', 'signal-style');
        if (source?.nonce) css.nonce = source.nonce;
        // Keep the original button, event handler, tooltip and live connection attributes.
        css.textContent = `i,:host([data-connected="true"]) i{position:relative;box-sizing:border-box;box-shadow:none;width:32px;height:32px;flex-shrink:0;border:0;border-radius:0;background:transparent url("assets/christmas/tickers/${art}.webp") center/contain no-repeat;pointer-events:none}
          button{position:relative}button::after{content:"";position:absolute;right:0;bottom:0;width:5px;height:5px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 1px #fff;pointer-events:none}
          :host(:not([data-connected="true"])) button::after{width:8px;height:3px;border-radius:1px;background:#dc2626}
          button[aria-label*="Có lỗi lưu bài"]::after{width:9px;height:6px;border-radius:1px;background:repeating-linear-gradient(135deg,#dc2626 0 2px,#fff1d6 2px 4px)}
          @media print{i{display:none}button::after{display:none}}`;
        node.shadowRoot.append(css); signalStyles.set(node, css);
      }
    }
    if (!CONFIG.controls.actions) return;
    const targets = [
      ['#coinWidget', 'coin'], ['.leaderboard-trigger-btn, #btnLeaderboard', 'rank'],
      ['.bag-trigger-btn', 'bag'], ['.inbox-trigger-btn', 'mail']
    ];
    const live = new Set();
    for (const [selector, kind] of targets) {
      for (const target of query(selector)) {
        live.add(target);
        if (actionTrims.has(target) || !visible(target)) continue;
        // Do not move static elements or alter their existing layout to anchor decoration.
        if (getComputedStyle(target).position === 'static') continue;
        const trim = element('span', 'trim-' + kind);
        trim.removeAttribute('id'); // Multiple responsive copies must not create duplicate IDs.
        trim.setAttribute('aria-hidden', 'true');
        trim.style.cssText = 'position:absolute;inset:0;display:block;pointer-events:none;overflow:hidden;border-radius:inherit;z-index:1;';
        const root = trim.attachShadow({ mode: 'open' });
        const css = element('style', 'trim-style');
        if (source?.nonce) css.nonce = source.nonce;
        css.textContent = `:host,*{box-sizing:border-box;pointer-events:none!important}.xmas-trim{position:absolute;inset:0;border-radius:inherit}
          .xmas-trim::before,.xmas-trim::after{content:"";position:absolute;pointer-events:none}
          .xmas-coin{border-bottom:2px solid #497955}.xmas-coin::before{bottom:1px;left:3px;width:26px;height:7px;background:repeating-linear-gradient(135deg,#467b56 0 2px,transparent 2px 5px)}.xmas-coin::after{bottom:2px;left:22px;width:5px;height:5px;border-radius:50%;background:#bc3d52;box-shadow:5px -1px #d36a72}
          .xmas-rank{border:1px solid #d6b46d}.xmas-rank::before{bottom:3px;left:5px;width:8px;height:10px;border-radius:6px 6px 2px 2px;background:linear-gradient(100deg,#b9843e,#ffe6a7,#bb8841);transform:rotate(-20deg)}.xmas-rank::after{bottom:3px;right:5px;width:8px;height:10px;border-radius:6px 6px 2px 2px;background:linear-gradient(100deg,#b9843e,#ffe6a7,#bb8841);transform:rotate(20deg)}
          .xmas-bag{border-bottom:2px solid #bb4560}.xmas-bag::before{top:0;left:4px;width:10px;height:14px;background:linear-gradient(90deg,#b9435b 0 45%,#eed39c 45% 58%,#b9435b 58%);clip-path:polygon(0 0,100% 0,100% 100%,50% 73%,0 100%)}.xmas-bag::after{top:1px;left:1px;width:16px;height:5px;border:2px solid #b9435b;border-radius:50%}
          .xmas-mail{border:1px solid #d5a0a5}.xmas-mail::before{bottom:0;left:0;width:100%;height:3px;background:repeating-linear-gradient(135deg,#ba4d60 0 4px,#fff3dc 4px 8px,#628e9a 8px 12px,#fff3dc 12px 16px)}.xmas-mail::after{top:3px;left:4px;width:8px;height:10px;border:1px dashed #9a595d;background:#f8e6c8}
          @media print{.xmas-trim{display:none}}`;
        const art = element('span', 'trim'); art.className += ' xmas-' + kind; art.removeAttribute('id');
        root.append(css, art); target.append(trim); actionTrims.set(target, trim);
      }
    }
    for (const [target, trim] of actionTrims) if (!live.has(target)) { trim.remove(); actionTrims.delete(target); }
  }

  let backgroundStyle;
  function backgroundCSS() {
    const { frost, mint, gold, fir } = CONFIG.background;
    const trees = Array.from({ length: 14 }, (_, i) => {
      const x = i * 70 - 15, h = 50 + (i * 37 % 90), y = 218 - h;
      return '<path d="M' + x + ' ' + y + 'l-18 35h9l-22 37h13l-27 48h90l-27-48h13l-22-37h9Z"/>';
    }).join('');
    const forest = 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="980" height="250" viewBox="0 0 980 250"><g fill="' + fir + '" opacity=".12">' + trees + '</g><path d="M0 225Q200 190 420 228T980 210V250H0Z" fill="white" opacity=".55"/></svg>') + '")';
    // A removable sheet changes only backgrounds; original files and inline styles stay intact.
    const scope = 'html:not(#xmas-background-off):not(#xmas-background-disabled):not(#xmas-background-inactive) body';
    return '@media screen{' + scope + '{background:radial-gradient(ellipse at 8% 0%,' + mint + ' 0,transparent 58%),radial-gradient(ellipse at 95% 12%,' + gold + ' 0,transparent 45%),linear-gradient(160deg,' + frost + ',#f8faf5 60%,#d3e7e8)!important;background-attachment:fixed!important}' +
      scope + ' :is(#studentDashboard,#teacherDashboard)>.content{background-image:' + forest + ',radial-gradient(ellipse at 95% 5%,#fff0c84d,transparent 55%),linear-gradient(160deg,#e3f3eeaa,#ffffffaa 55%,#d9eaf2aa)!important;background-position:center bottom,center,center!important;background-size:980px 250px,100% 100%,100% 100%!important;background-repeat:repeat-x,no-repeat,no-repeat!important}' +
      scope + ' :is(#studentDashboard,#teacherDashboard)>.content::before{background-image:' + forest + '!important;background-position:center bottom!important;background-size:980px 250px!important;background-repeat:repeat-x!important}' +
      '@media(max-width:768px){' + scope + ' :is(#studentDashboard,#teacherDashboard)>.content{background-size:680px 174px,100% 100%,100% 100%!important}}}';
  }
  // Precompute six arms and their forked tips once, not for every frame.
  const snowSegments = [];
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3, c = Math.cos(angle), s = Math.sin(angle);
    snowSegments.push([0, 0, c, s]);
    // Match Eternal Winter's crystal geometry: three tiers, tips at +/-0.85 radians.
    for (let twig = 1; twig <= 3; twig++) {
      const t = twig / 4;
      for (const side of [-1, 1]) snowSegments.push([c * t, s * t,
        c * t + Math.cos(angle + side * .85) * .22,
        s * t + Math.sin(angle + side * .85) * .22]);
    }
  }
  function drawLights() {
    lights.replaceChildren();
    if (!CONFIG.lights.enabled) return;
    const h = CONFIG.lights.height, count = Math.max(2, Math.ceil(width / CONFIG.lights.spacing));
    const step = width / count;
    const art = svg('svg', { viewBox: `0 0 ${width} ${h}`, width: '100%', height: h, 'aria-hidden': 'true' });
    const colors = CONFIG.lights.colors.length ? CONFIG.lights.colors : ['#fff1cb'];
    let path = 'M0 1';
    for (let i = 0; i < count; i++) path += ` Q${step * (i + 0.5)} ${h * 0.55} ${step * (i + 1)} 1`;
    art.append(svg('path', { d: path, fill: 'none', stroke: CONFIG.lights.wire, 'stroke-width': 1 }));
    for (let i = 0; i < count; i++) {
      const x = step * (i + 0.5), y = 0.5 + h * 0.275;
      const bulb = svg('g', { class: 'xmas-bulb' });
      bulb.style.animationDelay = `${-i * 0.73}s`;
      bulb.style.animationDuration = `${2.1 + (i % 4) * 0.35}s`;
      bulb.style.color = colors[i % colors.length];
      bulb.append(svg('ellipse', { cx: x, cy: y + 5, rx: 9, ry: 9, fill: colors[i % colors.length], opacity: 0.16 }));
      bulb.append(svg('ellipse', { cx: x, cy: y + 5, rx: 5.5, ry: 6.5, fill: colors[i % colors.length], opacity: 0.3 }));
      bulb.append(svg('rect', { x: x - 1.5, y, width: 3, height: 3, rx: 1, fill: CONFIG.lights.wire }));
      bulb.append(svg('ellipse', { cx: x, cy: y + 5, rx: 3.2, ry: 4.3, fill: colors[i % colors.length] }));
      bulb.append(svg('ellipse', { cx: x - 0.8, cy: y + 4, rx: 0.7, ry: 1.4, fill: '#fff9ec', opacity: 0.85 }));
      art.append(bulb);
    }
    lights.append(art);
  }
  function drawHat() {
    const art = svg('svg', { viewBox: '0 0 64 48', width: '100%', height: '100%', 'aria-hidden': 'true' });
    art.append(svg('path', { d: 'M9 35C12 22 17 9 32 6C43 3 52 10 54 21L46 23C43 15 39 14 36 16L49 35Z', fill: CONFIG.hat.red }));
    art.append(svg('path', { d: 'M18 30C21 18 26 13 31 11', fill: 'none', stroke: '#ed8a92', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.7 }));
    art.append(svg('path', { d: 'M8 33Q28 29 49 33Q53 34 52 40Q51 43 47 43H10Q5 43 5 39Q5 34 8 33', fill: CONFIG.hat.trim }));
    art.append(svg('circle', { cx: 52, cy: 23, r: 6, fill: CONFIG.hat.trim }));
    hat.append(art);
  }
  // Procedural fir geometry: reusable paths, no icon font, texture download or library.
  let garlands;
  const garlandPieces = new Map();
  function garlandSVG(length, vertical, seed, detailed) {
    const size = 40, mid = 20, paths = ['', '', ''], berries = [], lamps = [[], [], []];
    const f = n => Number(n.toFixed(2));
    const center = x => mid + Math.sin(x / 48 + seed) * 2.5;
    let stem = '';
    for (let x = 3; x < length - 3; x += 5) stem += `${stem ? 'L' : 'M'}${f(x)} ${f(center(x))}`;
    const step = detailed ? 8 : 13;
    for (let x = 12; x < length - 10; x += step) {
      for (const side of [-1, 1]) {
        const y = center(x), reach = 10 + 3 * Math.sin(x * .29 + side + seed);
        const tipX = x + 10, tipY = y + side * reach;
        const color = (Math.floor(x / step) + (side + 1)) % 3;
        paths[color] += `M${f(x - 6)} ${f(y)}L${f(tipX)} ${f(tipY)}`;
        for (let j = 1; j <= 6; j++) {
          const t = j / 7, bx = x - 6 + 16 * t, by = y + side * reach * t;
          paths[color] += `M${f(bx)} ${f(by)}l${f(-6 + t * 2)} ${f(side * (4.4 - t * 2))}M${f(bx)} ${f(by)}l${f(2.8 - t)} ${f(-side * (4.2 - t * 1.5))}`;
        }
      }
    }
    const id = `xmas-garland-${vertical ? 'v' : 'h'}-${seed}`;
    for (let x = 45; x < length - 15; x += 96) {
      const y = center(x) + (Math.floor(x / 96) % 2 ? -4 : 5);
      berries.push(`<g transform="translate(${f(x)} ${f(y)})"><path d="M0-8v3" stroke="#c5a05d"/><rect x="-2" y="-6" width="4" height="3" rx=".7" fill="#d9b36f"/><circle r="5.5" fill="url(#${id}-red)"/><path d="M-3-2Q-2-4 0-4" stroke="#ffc7a4" stroke-width=".8" fill="none" opacity=".8"/></g>`);
    }
    // Small ribbon knots are deliberately sparse so leaves remain the dominant material.
    for (let x = 95 + seed % 3 * 23; x < length - 25; x += 275) {
      const y = center(x);
      berries.push(`<g transform="translate(${f(x)} ${f(y)})"><path d="M-1 1Q-17-13-14-3Q-14 5-1 2M1 1Q17-13 14-3Q14 5 1 2" fill="#ae3042" stroke="#dba26d" stroke-width=".65"/><path d="M-2 3l-5 13 5-2 3 2 1-12M2 3l5 12 1-4 4 1-8-10" fill="#8b2739" stroke="#d4a062" stroke-width=".5"/><ellipse rx="2.5" ry="3.5" cy="1" fill="#d24e54"/></g>`);
    }
    for (let x = 22, i = 0; x < length - 8; x += 42, i++) {
      const y = center(x) + Math.sin(i * 2.4 + seed) * 8;
      lamps[i % 3].push(`<circle cx="${f(x)}" cy="${f(y)}" r="6" fill="url(#${id}-glow)"/><circle cx="${f(x)}" cy="${f(y)}" r="1.25" fill="#fff0ba"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vertical ? size : length} ${vertical ? length : size}" aria-hidden="true" focusable="false"><defs><radialGradient id="${id}-red" cx="30%" cy="25%"><stop stop-color="#ef7770"/><stop offset=".45" stop-color="#bf3348"/><stop offset="1" stop-color="#671d32"/></radialGradient><radialGradient id="${id}-glow"><stop stop-color="#ffe9aa" stop-opacity=".72"/><stop offset="1" stop-color="#ffe9aa" stop-opacity="0"/></radialGradient></defs><g${vertical ? ' transform="translate(40 0) rotate(90)"' : ''}><path d="${stem}" stroke="#173f32" stroke-width="8" fill="none" stroke-linecap="round"/>${paths.map((d, i) => `<path d="${d}" stroke="${['#194e3d', '#2b6b4b', '#65936a'][i]}" stroke-width="${[1.8, 1.25, .8][i]}" stroke-linecap="round" fill="none"/>`).join('')}${berries.join('')}${lamps.map((parts, i) => `<g class="xmas-garland-light xmas-garland-phase-${i}">${parts.join('')}</g>`).join('')}</g></svg>`;
  }
  function positionGarlands() {
    garlands.hidden = !active || !CONFIG.garlands.enabled || document.hidden ||
      !!window.currentActiveExamId || query('dialog[open], .modal-overlay.active').some(visible);
    if (garlands.hidden) return;
    const detail = !small && decorationBudget.snowScale > .3;
    garlands.classList.toggle('xmas-still', reduced || !decorationBudget.animated);
    const live = new Set(), occupied = [];
    function put(key, x, y, w, h, vertical, seed) {
      const box = { left:x, top:y, right:x+w, bottom:y+h };
      if (box.right < 0 || box.left > width || box.bottom < 22 || box.top > height - 16) return;
      live.add(key);
      let piece = garlandPieces.get(key);
      if (!piece) {
        piece = element('div', 'garland-piece');piece.removeAttribute('id');
        garlandPieces.set(key, piece);garlands.append(piece);
      }
      const length = Math.round(vertical ? h * 40 / w : w * 40 / h);
      const stamp = `${length}:${vertical}:${seed}:${detail}`;
      if (piece.garlandStamp !== stamp) { piece.innerHTML = garlandSVG(length, vertical, seed, detail);piece.garlandStamp = stamp; }
      piece.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
      occupied.push(box);
    }
    const sidebar = query('#studentSidebar, #teacherSidebar').find(visible);
    const content = query('#studentDashboard > .content, #teacherDashboard > .content').find(visible);
    if (!small && sidebar && content) {
      const a = sidebar.getBoundingClientRect(), b = content.getBoundingClientRect();
      const gap = b.left - a.right, thickness = Math.min(30, gap - 4);
      const top = Math.max(32, a.top + 20), bottom = Math.min(height - 24, a.bottom - 20);
      if (thickness >= 16 && bottom - top > 100)
        put('column', a.right + (gap - thickness) / 2, top, thickness, bottom - top, true, 0);
    }
    const limit = small || !decorationBudget.animated ? 2 : CONFIG.garlands.maxCards;
    let count = 0;
    // No changes to target layout/HTML. Only outer cards; editor, product art and dialogs are excluded.
    for (const card of query('.tab-content.active .card, .tab-content.active .form-container')) {
      if (count >= limit) break;
      if (card.shadowRoot || card.parentElement?.closest('.card, .form-container') ||
          card.closest('.store-item-card, .luxury-product-card, .ql-container, dialog, .modal-overlay') || !visible(card)) continue;
      const r = card.getBoundingClientRect();
      if (r.width < 200 || r.height < 70 || r.top < 52 || r.top > height - (small ? 100 : 55) || r.left < 8 || r.right > width - 8) continue;
      // Require real headroom: accordion cards often put their padding on the header.
      const heading = card.querySelector('h3, h4, .accordion-title, label');
      const padding = heading ? heading.getBoundingClientRect().top - r.top : parseFloat(getComputedStyle(card).paddingTop);
      if (!Number.isFinite(padding) || padding < 18) continue;
      const topHeight = small ? 20 : 28, left = r.left + 14, top = r.top - topHeight / 2;
      const candidate = {left, right:r.right-14, top, bottom:top+topHeight};
      if (occupied.some(o => candidate.left < o.right && candidate.right > o.left && candidate.top < o.bottom && candidate.bottom > o.top)) continue;
      const key = `card-${count}`, seed = count * 3 + 1;
      put(key, left, top, r.width - 28, topHeight, false, seed);
      if (!small && detail) {
        const h = Math.min(68, r.height - 30);
        put(key+'-left', r.left - 7, r.top + 12, 16, h, true, seed + 1);
        put(key+'-right', r.right - 9, r.top + 12, 16, h, true, seed + 2);
      }
      count++;
    }
    for (const [key, piece] of garlandPieces) if (!live.has(key)) { piece.remove();garlandPieces.delete(key); }
  }

  function positionExtras() {
    if (!controlsAvailable() || document.hidden || destroyed) return;
    if (hasLuxuryPriority() !== luxuryBlocked) { sync(); return; }
    decorateControls();
    const anchor = active && CONFIG.hat.enabled && query(CONFIG.hat.selector).find(visible);
    hat.hidden = !anchor;
    if (anchor) {
      const box = anchor.getBoundingClientRect(), range = document.createRange();
      range.selectNodeContents(anchor);
      const text = range.getBoundingClientRect();
      const right = text.width ? Math.min(box.right, text.right) : box.right;
      const top = text.height ? Math.max(box.top, text.top) : box.top;
      const size = CONFIG.hat.width;
      const margin = Math.ceil(size * 0.3);
      hat.style.left = `${clamp(right - size * 0.66 + CONFIG.hat.offsetX, margin, Math.max(margin, width - size - margin))}px`;
      hat.style.top = `${Math.max(2, top - size * 0.54 + CONFIG.hat.offsetY)}px`;
      hat.hidden = box.bottom < 0 || box.top > height;
    }
    // Dời riêng nút trang trí lên trên các nút nổi/thanh điều hướng sẵn có.
    const x = CONFIG.button.side === 'right' ? width - CONFIG.button.inset - 44 : CONFIG.button.inset;
    const obstacles = query(CONFIG.button.avoid).filter(visible).map(n => n.getBoundingClientRect());
    let bottom = CONFIG.button.bottom;
    for (let pass = 0; pass < obstacles.length + 1; pass++) {
      const top = height - bottom - 44;
      const hit = obstacles.find(r => x < r.right && x + 44 > r.left && top < r.bottom && top + 44 > r.top);
      if (!hit) break;
      bottom = height - hit.top + 10;
    }
    button.style.bottom = `max(env(safe-area-inset-bottom, 0px), ${clamp(bottom, 8, Math.max(8, height - 52))}px)`;
    positionArt();
    positionGarlands();
  }
  function queueLayout() {
    if (!layoutFrame && controlsAvailable() && !document.hidden) layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0; positionExtras();
    });
  }
  function decorationPolicy() {
    const managed = window.WebPerformanceOptimizer?.getDecorationPolicy?.();
    if (managed) return managed;
    const level = window.EffectQualityManager?.getEffectiveLevel?.() || 'high';
    return { snowScale: level === 'low' ? .24 : level === 'medium' ? .58 : 1,
      fps: level === 'high' ? 60 : 30, animated: level !== 'low' };
  }
  let decorationBudget = decorationPolicy();
  function makeFlakes() {
    const count = Math.round(clamp((small ? CONFIG.snow.mobile : CONFIG.snow.desktop) * decorationBudget.snowScale, 0, 180));
    flakes = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height,
      r: CONFIG.snow.minSize + Math.random() * (CONFIG.snow.maxSize - CONFIG.snow.minSize),
      phase: Math.random() * Math.PI * 2, speed: CONFIG.snow.speed * (0.6 + Math.random()) }));
  }
  function paint(dt) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = CONFIG.snow.opacity;
    ctx.strokeStyle = CONFIG.snow.color;
    ctx.lineWidth = CONFIG.snow.lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const p of flakes) {
      p.y += p.speed * dt;
      if (p.y > height + p.r) p.y = -p.r;
      const x = p.x + Math.sin(elapsed * .7 + p.phase) * (4 + p.r);
      const angle = p.phase + elapsed * .12, c = Math.cos(angle) * p.r, s = Math.sin(angle) * p.r;
      for (const [ax, ay, bx, by] of snowSegments) {
        ctx.moveTo(x + ax * c - ay * s, p.y + ax * s + ay * c);
        ctx.lineTo(x + bx * c - by * s, p.y + bx * s + by * c);
      }
    }
    ctx.stroke();
    ctx.strokeStyle = '#f1fcff'; ctx.lineWidth = CONFIG.snow.lineWidth * .45; ctx.stroke();
  }
  function tick(now) {
    frame = 0;
    if (!active || document.hidden || reduced || !decorationBudget.animated || !ctx || !CONFIG.snow.enabled) return;
    if (last && now - last < 1000 / decorationBudget.fps - 1) { frame = requestAnimationFrame(tick); return; }
    const dt = last ? Math.min((now - last) / 1000, 0.04) : 0;
    last = now; elapsed += dt; paint(dt);
    frame = requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(frame); cancelAnimationFrame(layoutFrame);
    frame = layoutFrame = last = 0;
    clearInterval(timer); timer = 0;
  }
  function resize() {
    if (!controlsAvailable() || document.hidden) return;
    const w = document.documentElement.clientWidth, h = window.innerHeight;
    if (w !== width || h !== height) {
      width = w; height = h; small = w <= 768;
      const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.snow.maxDpr);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeFlakes(); drawLights();
    }
    if (active && CONFIG.snow.enabled) paint(0);
    positionExtras();
  }
  function updateBanner() {
    const now = new Date(), year = now.getFullYear() + (dayKey(now) > 1225 ? 1 : 0);
    const days = Math.round((Date.UTC(year, 11, 25) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    banner.textContent = CONFIG.banner.text + (days ? ` · Còn ${days} ngày đến 25/12` : ' · Hôm nay là 25/12');
  }
  function sync() {
    if (!booted || destroyed) return;
    stop();
    const season = allowed();
    luxuryBlocked = hasLuxuryPriority();
    decorationBudget = decorationPolicy();
    makeFlakes();
    active = season && enabled && !luxuryBlocked && !window.ChristmasWelcome?.isActive?.();
    if (!active) clearControlArt();
    backgroundStyle.textContent = active && CONFIG.background.enabled ? backgroundCSS() : '';
    ornaments.hidden = vignette.hidden = !active || !CONFIG.ornaments.enabled;
    garlands.hidden = !active || !CONFIG.garlands.enabled || document.hidden;
    canvas.hidden = !active || !CONFIG.snow.enabled;
    lights.hidden = !active || !CONFIG.lights.enabled;
    hat.hidden = !active || !CONFIG.hat.enabled;
    banner.hidden = !active || !CONFIG.banner.enabled;
    button.hidden = !controlsAvailable(); // Bản test luôn giữ nút chẩn đoán/xem thử.
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Tắt trang trí Giáng Sinh' : CONFIG.previewButton ? 'Xem thử Noel' : 'Bật trang trí Giáng Sinh');
    button.title = button.getAttribute('aria-label');
    if (luxuryBlocked) button.title = 'Xem thử Noel — ' + priorityMessage();
    lights.classList.toggle('xmas-still', reduced || !decorationBudget.animated);
    lights.classList.toggle('xmas-paused', document.hidden || !active);
    updateBanner();
    if (controlsAvailable() && !document.hidden) {
      resize();
      if (active && !reduced && decorationBudget.animated && CONFIG.snow.enabled && ctx) frame = requestAnimationFrame(tick);
      timer = setInterval(positionExtras, 1000); // Theo tên đổi/chèn muộn; không quét toàn cây mỗi frame.
    }
  }
  function scheduleDate() {
    clearTimeout(clock);
    if (document.hidden || destroyed) return;
    const now = new Date(), midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    clock = setTimeout(() => { sync(); scheduleDate(); }, midnight - now + 50);
  }
  function boot() {
    if (booted || destroyed) return;
    booted = true;
    if (!previewOnly) try { enabled = localStorage.getItem(CONFIG.storageKey) !== 'false'; } catch (_) {}
    host = element('div', 'overlay');
    // Shadow DOM cô lập CSS, không sửa style/class của website hoặc phần tử neo mũ.
    host.style.display = 'contents'; host.style.pointerEvents = 'none';
    shadow = host.attachShadow({ mode: 'open' });
    backgroundStyle = element('style', 'background-style');
    if (source?.nonce) backgroundStyle.nonce = source.nonce;
    document.body.append(backgroundStyle);
    style = element('style', 'style');
    if (source?.nonce) style.nonce = source.nonce;
    style.textContent = `
      :host{display:contents;pointer-events:none}
      .xmas-ornaments,.xmas-vignette,.xmas-snow,.xmas-lights,.xmas-hat,.xmas-banner,.xmas-toggle{box-sizing:border-box;position:fixed;pointer-events:none;margin:0}
      [hidden]{display:none!important}
      .xmas-garlands{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:125;contain:layout style paint}
      .xmas-garlands *{pointer-events:none!important;box-sizing:border-box}
      .xmas-garland-piece{position:absolute;margin:0;padding:0}
      .xmas-garland-piece svg{display:block;width:100%;height:100%;overflow:visible}
      .xmas-garland-light{animation:xmas-garland-glow 3.8s ease-in-out infinite}
      .xmas-garland-phase-1{animation-delay:-1.2s}.xmas-garland-phase-2{animation-delay:-2.5s}
      @keyframes xmas-garland-glow{0%,100%{opacity:.45}50%{opacity:1}}
      .xmas-still .xmas-garland-light{animation:none;opacity:.85}
      .xmas-paused .xmas-garland-light{animation-play-state:paused}
      @media(prefers-reduced-motion:reduce){.xmas-garland-light{animation:none}}
      @media print{.xmas-garlands{display:none!important}}
      .xmas-ornaments{inset:0;overflow:hidden;z-index:${CONFIG.layers.ornaments}}
      .xmas-ornaments *,.xmas-vignette *{pointer-events:none;box-sizing:border-box}
      .xmas-sprig{position:absolute;top:0;width:220px;height:46px}
      .xmas-sprig-left{left:0}.xmas-sprig-right{right:0;transform:scaleX(-1)}
      .xmas-chain{position:absolute;top:24%;width:16px;height:210px}
      .xmas-chain-left{left:1px}.xmas-chain-right{right:1px}
      .xmas-ornaments svg,.xmas-vignette svg{display:block;width:100%;height:100%}
      .xmas-vignette{z-index:${CONFIG.layers.ornaments};filter:drop-shadow(0 4px 4px #071d2c26)}
      @media(max-width:768px){.xmas-sprig{width:145px;height:30px}.xmas-chain{width:7px;height:150px;top:30%}}
      .xmas-snow{inset:0;width:100%;height:100%;z-index:${CONFIG.layers.snow}}
      .xmas-lights{inset:0 0 auto;height:${CONFIG.lights.height}px;overflow:hidden;z-index:${CONFIG.layers.lights}}
      .xmas-lights svg{display:block;overflow:hidden}
      .xmas-bulb{animation:xmas-glow 3.5s ease-in-out infinite}
      @keyframes xmas-glow{0%,100%{opacity:.35;filter:none}45%,60%{opacity:1;filter:drop-shadow(0 0 3px currentColor)}}
      .xmas-paused .xmas-bulb{animation-play-state:paused}
      .xmas-still .xmas-bulb{animation:none;opacity:1;filter:drop-shadow(0 0 2px currentColor)}
      .xmas-hat{width:${CONFIG.hat.width}px;height:${CONFIG.hat.width * 0.75}px;transform:rotate(${CONFIG.hat.rotation}deg);transform-origin:50% 80%;z-index:${CONFIG.layers.hat}}
      .xmas-banner{top:${CONFIG.banner.top}px;left:50%;transform:translateX(-50%);max-width:calc(100% - 32px);padding:2px 10px;border-radius:10px;background:${CONFIG.banner.background};color:${CONFIG.banner.color};font:12px/18px system-ui,sans-serif;text-align:center;z-index:${CONFIG.layers.banner}}
      .xmas-toggle{${CONFIG.button.side === 'right' ? 'right' : 'left'}:${CONFIG.button.inset}px;bottom:${CONFIG.button.bottom}px;width:44px;height:44px;display:grid;place-items:center;border:1px solid #ffffff9c;border-radius:50%;background:${CONFIG.button.color};color:#fff6e5;box-shadow:0 3px 10px #17233d25;pointer-events:auto;cursor:pointer;z-index:${CONFIG.layers.button};touch-action:manipulation;padding:10px}
      .xmas-toggle[aria-pressed=false]{background:#566372}
      .xmas-toggle:focus-visible{outline:3px solid #d7972d;outline-offset:3px}
      .xmas-toggle svg{width:22px;height:22px;pointer-events:none}
      @media(prefers-reduced-motion:reduce){.xmas-bulb{animation:none}}
      @media print{.xmas-ornaments,.xmas-vignette,.xmas-snow,.xmas-lights,.xmas-hat,.xmas-banner,.xmas-toggle{display:none!important}}
    `;
    garlands = element('div', 'garlands');
    canvas = element('canvas', 'snow'); lights = element('div', 'lights');
    ornaments = element('div', 'ornaments'); vignette = element('div', 'vignette');
    hat = element('div', 'hat'); banner = element('div', 'banner'); button = element('button', 'toggle');
    for (const node of [canvas, lights, hat, banner, ornaments, vignette, garlands]) node.setAttribute('aria-hidden', 'true');
    button.type = 'button';
    const icon = svg('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'aria-hidden': 'true' });
    icon.append(svg('path', { d: 'M12 2v20M3.34 7l17.32 10M3.34 17L20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M17 19l-1-4 4-1M4 14l4 1-1 4M17 5l-1 4 4 1' }));
    button.append(icon); drawHat(); shadow.append(style, canvas, ornaments, vignette, garlands, lights, hat, banner, button);
    document.body.append(host);
    try { ctx = canvas.getContext('2d'); } catch (_) { ctx = null; }
    motion = matchMedia('(prefers-reduced-motion: reduce)'); reduced = motion.matches;
    const motionChange = () => { reduced = motion.matches; sync(); };
    if (motion.addEventListener) listen(motion, 'change', motionChange);
    else { motion.addListener(motionChange); cleanups.push(() => motion.removeListener(motionChange)); }
    listen(button, 'click', () => {
      if (hasLuxuryPriority()) {
        sync();
        const message = priorityMessage();
        if (typeof window.showToast === 'function') window.showToast(message, 'info');
        else window.alert(message);
        return;
      }
      if (CONFIG.previewButton && !allowed()) {
        previewOnly = true;
        enabled = true;
      } else enabled = !enabled;
      if (!previewOnly) try { localStorage.setItem(CONFIG.storageKey, String(enabled)); } catch (_) {}
      sync();
    });
    listen(window, 'storage', e => {
      if (e.key === 'currentUser' || window.TestBrowserStorage?.eventKey?.(e) === 'currentUser' || e.key === null) sync();
      if (previewOnly) return;
      if (e.key === CONFIG.storageKey || e.key === null) { enabled = e.newValue !== 'false'; sync(); }
    });
    listen(window, 'web-performance-optimizer-change', sync);
    listen(window, 'effect-quality-change', sync);
    listen(window, 'christmas-welcome-change', sync);
    listen(window, 'resize', resize, { passive: true });
    listen(document, 'click', queueLayout, { passive: true, capture: true });
    listen(document, 'scroll', queueLayout, { passive: true, capture: true });
    listen(document, 'visibilitychange', () => { sync(); scheduleDate(); });
    listen(window, 'pagehide', () => { stop(); clearTimeout(clock); lights.classList.add('xmas-paused'); garlands.classList.add('xmas-paused'); });
    listen(window, 'pageshow', () => { garlands.classList.toggle('xmas-paused',false);sync(); scheduleDate(); });
    if (typeof MutationObserver === 'function') {
      const observer = new MutationObserver(queueLayout);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      cleanups.push(() => observer.disconnect());
    }
    sync(); scheduleDate();
  }
  window[KEY] = {
    status() {
      const blocked = hasLuxuryPriority();
      return { version: '20261023.garland1', blocked, reason: priorityReason, message: priorityMessage() };
    },
    preview() {
      if (destroyed) return;
      previewOnly = true;
      enabled = true;
      sync(); scheduleDate();
      if (luxuryBlocked) return priorityMessage();
      return 'Đã bật Noel xem thử. Tải lại trang để trở về lịch tự động.';
    },
    destroy() {
      destroyed = true; stop(); clearTimeout(clock); cleanups.splice(0).forEach(fn => fn());
      clearControlArt();
      garlandPieces.clear();
      backgroundStyle?.remove();
      host?.remove(); delete window[KEY];
    }
  };
  if (document.readyState === 'loading') listen(document, 'DOMContentLoaded', boot, { once: true });
  else boot();
})();
