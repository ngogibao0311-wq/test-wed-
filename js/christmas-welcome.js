/* Màn chào 31/12. Hình vẽ SVG + canvas, không mạng, không ghi dữ liệu tài khoản. */
(() => {
  'use strict';
  const CONFIG = {
    enabled: true,
    timeZone: 'Asia/Ho_Chi_Minh',
    month: 12, day: 31,
    durationMs: 14000,
    snow: { desktop: 86, mobile: 34 },
    previewButton: true // Bản test bật nút trong Cài đặt; xem thử không được lưu.
  };
  if (window.ChristmasWelcome) return;
  function isWelcomeDay(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: CONFIG.timeZone, month: 'numeric', day: 'numeric'
    }).formatToParts(date);
    return Number(parts.find(p => p.type === 'month').value) === CONFIG.month &&
      Number(parts.find(p => p.type === 'day').value) === CONFIG.day;
  }
  // Chốt vé chờ ngay lúc tải module, nhưng chỉ chiếu sau khi core xác thực/tải xong.
  const scheduled = CONFIG.enabled && isWelcomeDay();
  let release, released = !scheduled, started = false, scene = null;
  const ready = scheduled ? new Promise(resolve => { release = resolve; }) : Promise.resolve();
  function releaseStartup() { if (!released) { released = true; release(); } }
  function policy() {
    try {
      const managed = window.WebPerformanceOptimizer?.getDecorationPolicy?.();
      if (managed) return managed;
      const level = window.EffectQualityManager?.getEffectiveLevel?.() || 'high';
      return { level, snowScale: level === 'low' ? .24 : level === 'medium' ? .58 : 1,
        fps: level === 'high' ? 60 : 30, animated: level !== 'low' };
    } catch (_) { return { level: 'low', snowScale: .24, fps: 30, animated: false }; }
  }
  // Reusable hand-drawn geometry: never depend on a font/icon pack or downloaded image.
  function artwork() {
    const pines = Array.from({ length: 27 }, (_, i) => {
      const x = i * 59 - 30, central = x > 440 && x < 1160;
      const y = central ? 548 + (i % 3) * 7 : 433 + (i % 4) * 15;
      const s = central ? .29 + (i % 3) * .045 : .56 + (i % 5) * .12;
      return `<use href="#xmas-welcome-pine" opacity="${central ? .65 : 1}" transform="translate(${x} ${y}) scale(${s})"/>`;
    }).join('');
    const stars = Array.from({ length: 66 }, (_, i) => {
      const x = (i * 193 + 31) % 1600, y = (i * 71 + 23) % 405;
      return `<circle cx="${x}" cy="${y}" r="${i % 7 === 0 ? 1.8 : .8}" fill="#ffedc2" opacity="${.25 + (i % 5) * .13}"/>`;
    }).join('');
    function house(x, y, scale, wall, roof) {
      return `<g transform="translate(${x} ${y}) scale(${scale})">
        <ellipse cx="100" cy="190" rx="134" ry="18" fill="#bbd1e0" opacity=".5"/>
        <g class="xmas-welcome-smoke" fill="#deedf3" opacity=".24"><ellipse cx="148" cy="-10" rx="11" ry="16"/><ellipse cx="144" cy="-35" rx="17" ry="12"/><ellipse cx="157" cy="-59" rx="22" ry="11"/></g>
        <path d="M138 4h24v69h-24Z" fill="#98675c"/><path d="M135 5h29" stroke="#f6fbff" stroke-width="9" stroke-linecap="round"/>
        <path d="M15 70 100 0 185 70v111H15Z" fill="${wall}"/><path d="M-1 75 100-11 201 75l-16 10L100 15 15 85Z" fill="${roof}"/>
        <path d="M-1 72 100-11 201 72" fill="none" stroke="#f4fbff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 78v12m14-25v13m156-13v16m13-7v18" stroke="#c6e3f1" stroke-width="3" stroke-linecap="round"/>
        <rect x="33" y="91" width="35" height="45" rx="12" fill="url(#xmas-welcome-window)" stroke="#634d4f" stroke-width="5"/>
        <rect x="132" y="91" width="35" height="45" rx="12" fill="url(#xmas-welcome-window)" stroke="#634d4f" stroke-width="5"/>
        <path d="M50 92v45m-17-22h35m82-23v45m-18-23h35" stroke="#82614d" stroke-width="3"/>
        <path d="M82 180v-53a18 18 0 0 1 36 0v53" fill="#254f51" stroke="#d5b887" stroke-width="3"/>
        <circle cx="109" cy="153" r="2.5" fill="#ffd68e"/>
        <circle cx="100" cy="133" r="11" fill="none" stroke="#3b785c" stroke-width="6"/><path d="m98 127-8-4v8l8-2 11 3v-10Z" fill="#bd4d62"/>
        <circle cx="100" cy="51" r="15" fill="url(#xmas-welcome-window)" stroke="#f3ddba" stroke-width="4"/><path d="M85 51h30m-15-15v30" stroke="#6c5650" stroke-width="3"/>
        <path d="M17 76q83 37 166 0" fill="none" stroke="#22564c" stroke-width="8"/>
        ${[24, 49, 74, 100, 126, 151, 177].map((a, i) => `<circle class="xmas-welcome-bulb" style="animation-delay:-${i * .4}s" cx="${a}" cy="${80 + Math.sin(i / 6 * Math.PI) * 19}" r="3" fill="${i % 2 ? '#ffbe69' : '#ff8195'}"/>`).join('')}
        <path d="M14 180h173M30 141h40m60 0h40" stroke="#edf7ff" stroke-width="9" stroke-linecap="round"/>
      </g>`;
    }
    return `<svg class="xmas-welcome-landscape" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="xmas-welcome-sky" x2=".3" y2="1"><stop stop-color="#071728"/><stop offset=".55" stop-color="#173a4f"/><stop offset="1" stop-color="#648492"/></linearGradient>
        <linearGradient id="xmas-welcome-snow" x2="0" y2="1"><stop stop-color="#e6f3fb"/><stop offset="1" stop-color="#8fafc8"/></linearGradient>
        <linearGradient id="xmas-welcome-window" x2="0" y2="1"><stop stop-color="#fff4bb"/><stop offset="1" stop-color="#edab63"/></linearGradient>
        <radialGradient id="xmas-welcome-glow"><stop stop-color="#ffe9b3" stop-opacity=".65"/><stop offset="1" stop-color="#ffd69a" stop-opacity="0"/></radialGradient>
        <g id="xmas-welcome-pine"><path d="M-5 0h10v17H-5Z" fill="#65544a"/><path d="M0-169-36-112h16l-35 60h20L-68 5H68L35-52h20l-35-60h16Z" fill="#204d55"/><path d="m0-169-24 42q24 13 48 0Zm0 54-39 53q39 16 78 0Zm0 54L-50-5Q0 13 50-5Z" fill="#cce5ee"/><path d="M-18-114 0-144l18 30M-32-60 0-98l32 38M-43-9 0-44 43-9" fill="none" stroke="#f7fbff" stroke-width="3" opacity=".8"/></g>
        <g id="xmas-welcome-lamp"><ellipse cy="33" rx="72" ry="102" fill="url(#xmas-welcome-glow)"/><path d="M0 8v161m-13 0h26" stroke="#263e50" stroke-width="7" stroke-linecap="round"/><path d="m-15 0 4 32h22L15 0Z" fill="url(#xmas-welcome-window)" stroke="#304653" stroke-width="4"/><path d="M-20 0 0-18 20 0ZM-4-22h8" fill="#233c4a"/><path d="M-18 0h36" stroke="#f2f8ff" stroke-width="4"/><path d="M0 2v28" stroke="#8c7b57" stroke-width="2"/><path d="M-5 53q-29-20-21 1 9 11 26 0 18-11 22 0 3 18-20 1" fill="#ac3650"/><ellipse cy="166" rx="25" ry="5" fill="#e6f3f9"/></g>
      </defs>
      <path d="M0 0H1600V900H0Z" fill="url(#xmas-welcome-sky)"/>
      <ellipse cx="1150" cy="155" rx="180" ry="180" fill="url(#xmas-welcome-glow)" opacity=".24"/><circle cx="1150" cy="155" r="43" fill="#f4eed6"/><circle cx="1136" cy="141" r="10" fill="#d9dece" opacity=".45"/>
      ${stars}
      <path d="M0 477Q190 335 403 459T805 435T1200 459T1600 392V900H0Z" fill="#3b6171"/>
      ${pines}
      <path d="M0 514Q310 465 540 532T1060 508T1600 513V900H0Z" fill="#afcbdc"/>
      ${house(90, 442, .95, '#876c70', '#754957')}${house(330, 475, .7, '#3b7075', '#3a5c65')}
      ${house(607, 505, .56, '#77768a', '#5f536b')}${house(892, 498, .56, '#a17c69', '#6f4c58')}
      ${house(1075, 462, .83, '#997761', '#644e5a')}${house(1320, 430, 1.04, '#697487', '#6b4358')}
      <path d="M0 664Q250 582 510 639T1060 641T1600 620V900H0Z" fill="url(#xmas-welcome-snow)"/>
      <path d="M817 579q-230 90-54 153t96 168h403q84-121-255-182T817 579" fill="#8daec5" opacity=".62"/>
      <path d="M817 579q-204 88-14 151t106 170" fill="none" stroke="#f3f9fc" stroke-width="5" opacity=".65"/>
      <g stroke="#7497ad" stroke-width="2" opacity=".5">${Array.from({length: 12}, (_, i) => `<path d="m${810 + Math.sin(i * .45) * 70} ${614 + i * 15} 9 3"/>`).join('')}</g>
      <use href="#xmas-welcome-lamp" transform="translate(669 539) scale(.65)"/><use href="#xmas-welcome-lamp" transform="translate(978 584) scale(.8)"/>
      <use href="#xmas-welcome-lamp" transform="translate(454 624) scale(1.2)"/><use href="#xmas-welcome-lamp" transform="translate(1220 655) scale(1.3)"/>
      <use href="#xmas-welcome-pine" transform="translate(60 777) scale(1.8)"/><use href="#xmas-welcome-pine" transform="translate(255 706) scale(1.1)"/>
      <use href="#xmas-welcome-pine" transform="translate(1517 813) scale(2.05)"/><use href="#xmas-welcome-pine" transform="translate(1340 740) scale(1.25)"/>
      <g fill="#fff1b1">${[[-12,650],[67,567],[109,688],[248,594],[267,653],[1488,614],[1536,528],[1561,731],[1341,574],[1312,687]].map(([x,y])=>`<circle class="xmas-welcome-bulb" cx="${x}" cy="${y}" r="3"/>`).join('')}</g>
      <g transform="translate(360 725)"><path d="M-35 0h70v9h-70Zm3-30h64v22h-64Z" fill="#755c58" stroke="#f6fbff" stroke-width="4"/><path d="M-27 10v20m54-20v20M-29-7V4m58-11V4" stroke="#3c5363" stroke-width="5"/></g>
      <g transform="translate(1430 760)"><circle cy="-13" r="26" fill="#eff7fb"/><circle cy="-49" r="18" fill="#f8fcff"/><path d="M-24-64h48M-16-67v-19h31v19" stroke="#274758" stroke-width="5"/><path d="M-15-32h32m-2 0 5 25" stroke="#b34458" stroke-width="7"/><path d="m0-48 15 4L0-41" fill="#db8e51"/><circle cx="-5" cy="-52" r="2"/><circle cx="7" cy="-52" r="2"/><path d="m-22-17-27-18m70 19 20-25" stroke="#8a7466" stroke-width="3"/></g>
      <path d="M0 855q235-63 454 12t498-6 648-18v57H0Z" fill="#dcecf6"/>
    </svg>
    <svg class="xmas-welcome-flight" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 180" aria-hidden="true">
      <g fill="#ffe4a4" opacity=".7"><circle cx="12" cy="130" r="2"/><circle cx="33" cy="118" r="1.5"/><circle cx="51" cy="132" r="2.5"/><circle cx="69" cy="117" r="1.7"/></g>
      <path d="M176 115Q270 165 361 73M173 118Q315 157 493 60" fill="none" stroke="#d0b57f" stroke-width="1.7"/>
      <g transform="translate(110 60)"><path d="M-22 47q-15-37 7-45l20 2q18 15 10 43" fill="#396b60"/><path d="m-15 3-5-14 15 6 9-5-1 15" fill="#4e8270"/><path d="M-17 5H4" stroke="#e9ca8b" stroke-width="3"/>
        <path d="M-5 39q-1-31 26-31 27 6 32 38" fill="#b83e51"/><path d="M1 22q-7 10-9 21m38-21 19 15 16-6" fill="none" stroke="#c94c59" stroke-width="12" stroke-linecap="round"/><path d="m-8 41 1 4m57-8 3 0" stroke="#fff1dd" stroke-width="7"/>
        <ellipse cx="23" cy="5" rx="15" ry="18" fill="#eebf98"/><path d="M9 3q-2 29 15 28 16-3 15-29l-9 11-7-4-6 5Z" fill="#fff4df"/><circle cx="28" cy="2" r="1.5" fill="#40363c"/>
        <path d="M7-7q1-31 26-21l20 12-15-2-3 12Z" fill="#c64455"/><path d="M8-6q14-7 29 0" stroke="#fff3e0" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="-15" r="6" fill="#fff3e0"/>
        <path d="M5 42v9h33v-9" stroke="#48383f" stroke-width="8"/><rect x="15" y="37" width="11" height="9" fill="#e9c67e"/>
        <rect x="-39" y="20" width="22" height="26" fill="#d0aa67"/><path d="M-28 20v26m-11-17h22" stroke="#a54558" stroke-width="3"/>
        <path d="M-47 43q40 21 93 4l10-23q5-13 17-7-12-1-12 13l-5 35H-27q-19-2-20-22" fill="#9c344e" stroke="#efc888" stroke-width="3"/>
        <path d="M-44 80H56q22 0 28-17M-20 65l-6 15m66-15 10 15" fill="none" stroke="#f4d594" stroke-width="4" stroke-linecap="round"/><path d="M-25 54q31 11 65 0" stroke="#dba773" fill="none" stroke-width="2"/>
      </g>
      <g class="xmas-welcome-team" fill="none" stroke-linecap="round" stroke-linejoin="round">
        ${[290, 425].map((x, i) => `<g transform="translate(${x} ${92 - i * 18})"><path d="m-24 9-20 25 23 12m39-40 24 19 26-20M-4 10l13 24-15 22m32-47 27 5 13-30" stroke="#c79564" stroke-width="6"/><ellipse rx="39" ry="18" fill="#ac7651"/><path d="M20-7 33-49 50-40 35 9" fill="#c89564"/><path d="M32-47q11-17 27-6l18 7q9 13-8 15H43Z" fill="#dfb17e"/><path d="m-35-8-19-12 8 18m80-47-15-11 5 20" fill="#c89564"/><path d="m41-54-12-20-3-15m6 19-15-6m19 0 8-19m-1 7 10-6m-2 40 15-18 2-17m-2 14 13-6" stroke="#e5c9a0" stroke-width="3"/><circle cx="62" cy="-47" r="2.5" fill="#172b35"/><circle cx="79" cy="-40" r="4" fill="#df7467"/><path d="m29-26 20 9M-17-15l9 32" stroke="#b13b51" stroke-width="6"/><circle cx="38" cy="-21" r="4" fill="#ffe1a2"/></g>`).join('')}
      </g>
    </svg>`;
  }
  const CSS = `
    :host{all:initial;color:#fff4d9;font-family:Segoe UI,Arial,sans-serif;font-size:16px}
    *,*::before,*::after{box-sizing:border-box}
    .xmas-welcome-stage{position:relative;width:100%;height:100%;overflow:hidden;background:#102d40;isolation:isolate}
    .xmas-welcome-landscape,.xmas-welcome-snow{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
    .xmas-welcome-flight{position:absolute;top:12%;left:0;width:clamp(300px,42vw,650px);height:auto;pointer-events:none;animation:xmas-welcome-fly 13s linear both}
    .xmas-welcome-team{animation:xmas-welcome-gallop 1.3s ease-in-out infinite alternate;transform-origin:center}
    .xmas-welcome-smoke{animation:xmas-welcome-smoke 4s ease-out infinite;transform-box:fill-box;transform-origin:bottom}
    .xmas-welcome-bulb{animation:xmas-welcome-glimmer 2.8s ease-in-out infinite alternate}
    .xmas-welcome-copy{position:absolute;top:28%;left:50%;transform:translateX(-50%);width:min(90%,700px);text-align:center;text-shadow:0 3px 24px #071b2a;pointer-events:none}
    h1{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(35px,4.5vw,68px);font-weight:normal;line-height:1.16;margin:0;color:#fff4d9;letter-spacing:-.025em}
    .xmas-welcome-message{font-size:clamp(14px,1.25vw,18px);line-height:1.7;max-width:480px;margin:18px auto 0;color:#e3edf0}
    .xmas-welcome-divider{width:100px;height:1px;background:linear-gradient(90deg,transparent,#f3ce8d,transparent);margin:22px auto}
    .xmas-welcome-footer{position:absolute;bottom:max(24px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);text-align:center;width:min(90%,460px)}
    button{font:600 15px Segoe UI,Arial,sans-serif;cursor:pointer;border:1px solid #f4d9a4;border-radius:30px;color:#173542;background:#fff1d0;padding:13px 28px;box-shadow:0 8px 28px #18374840;min-height:48px}
    button:hover{background:#fff9e9}button:focus-visible{outline:3px solid #fff;outline-offset:5px}
    button:active{background:#f1d8a5;transform:translateY(1px)}::selection{background:#f2d495;color:#173542}
    .xmas-welcome-hint{font-size:12px;margin:12px 0 0;color:#183748;background:#e6f1f6df;border-radius:20px;padding:5px 12px;display:inline-block}
    .xmas-welcome-paused *{animation-play-state:paused!important}
    .xmas-welcome-still .xmas-welcome-flight{animation:none;left:52%;top:11%;transform:translateX(-50%)}
    .xmas-welcome-still .xmas-welcome-team,.xmas-welcome-still .xmas-welcome-smoke,.xmas-welcome-still .xmas-welcome-bulb{animation:none}
    @keyframes xmas-welcome-fly{0%{transform:translateX(-105%) translateY(12px)}40%{transform:translateX(35vw) translateY(-12px)}100%{transform:translateX(110vw) translateY(8px)}}
    @keyframes xmas-welcome-gallop{to{transform:translateY(-4px) rotate(-1deg)}}
    @keyframes xmas-welcome-smoke{to{transform:translate(9px,-28px) scale(1.3);opacity:0}}
    @keyframes xmas-welcome-glimmer{from{opacity:.55}to{opacity:1}}
    @media(max-width:600px){.xmas-welcome-landscape{width:200%;left:-50%}.xmas-welcome-copy{top:28%}.xmas-welcome-flight{top:10%}.xmas-welcome-message{max-width:310px}.xmas-welcome-divider{margin:14px auto}}
    @media(max-height:500px){.xmas-welcome-copy{top:16%}h1{font-size:34px}.xmas-welcome-message{margin:8px auto;font-size:13px}.xmas-welcome-divider,.xmas-welcome-hint{display:none}.xmas-welcome-footer{bottom:14px}.xmas-welcome-flight{top:0;width:280px}}
  `;
  function show(preview) {
    if (scene) return scene.done;
    let resolve;
    const done = new Promise(r => { resolve = r; });
    const current = { done, finish: null };
    scene = current;
    let dialog, frame = 0, timer = 0, startTime = 0, remaining = CONFIG.durationMs;
    let previousFrame = 0, flakes = [], ctx, width = 0, height = 0;
    const cleanups = [], focusBefore = document.activeElement;
    const listen = (target, type, fn) => { target.addEventListener(type, fn); cleanups.push(() => target.removeEventListener(type, fn)); };
    function finish() {
      if (scene !== current) return;
      scene = null;
      cancelAnimationFrame(frame); clearTimeout(timer);
      cleanups.splice(0).forEach(fn => fn());
      try { if (dialog?.open) dialog.close(); } catch (_) {}
      dialog?.remove();
      try { focusBefore?.focus?.({ preventScroll: true }); } catch (_) {}
      window.dispatchEvent(new CustomEvent('christmas-welcome-change', { detail: { active: false } }));
      resolve();
    }
    current.finish = finish;
    try {
      dialog = document.createElement('dialog');
      dialog.id = 'xmas-welcome-dialog';
      dialog.setAttribute('aria-label', 'Chúc mừng Giáng Sinh');
      // Inline !important prevents existing theme/card rules from restyling the dialog.
      dialog.style.cssText = 'position:fixed!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;background:#102d40!important;overflow:hidden!important;color:#fff!important;';
      const host = document.createElement('div');
      host.id = 'xmas-welcome-host';
      host.style.cssText = 'display:block!important;width:100%!important;height:100%!important;';
      dialog.append(host);
      const root = host.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${CSS}</style><div class="xmas-welcome-stage">${artwork()}<canvas class="xmas-welcome-snow" aria-hidden="true"></canvas><div class="xmas-welcome-copy"><h1>Chúc mừng<br>Giáng Sinh</h1><div class="xmas-welcome-divider"></div><p class="xmas-welcome-message">Gửi bạn một mùa đông ấm áp,<br>những ước mơ đẹp và một năm mới rực rỡ.</p></div><div class="xmas-welcome-footer"><button type="button" autofocus>Vào lớp học</button><br><p class="xmas-welcome-hint">Màn chào sẽ tự khép lại sau ít giây</p></div></div>`;
      const stage = root.querySelector('.xmas-welcome-stage');
      const canvas = root.querySelector('canvas');
      const button = root.querySelector('button');
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      let quality = policy();
      const still = () => motion.matches || !quality.animated;
      try { ctx = canvas.getContext('2d'); } catch (_) { ctx = null; }
      function paint(dt) {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath(); ctx.strokeStyle = '#effaff'; ctx.lineWidth = .9;
        for (const f of flakes) {
          f.y += dt * f.speed; f.phase += dt * .55;
          if (f.y > height + 8) f.y = -8;
          const x = f.x + Math.sin(f.phase) * 12;
          for (let arm = 0; arm < 6; arm++) {
            const a = arm * Math.PI / 3, c = Math.cos(a), s = Math.sin(a);
            ctx.moveTo(x, f.y); ctx.lineTo(x + c * f.r, f.y + s * f.r);
            for (const t of [.45, .72]) for (const side of [-1, 1]) {
              const bx = x + c * f.r * t, by = f.y + s * f.r * t;
              ctx.moveTo(bx, by); ctx.lineTo(bx - c * f.r * .18 - s * side * f.r * .18, by - s * f.r * .18 + c * side * f.r * .18);
            }
          }
        }
        ctx.stroke();
      }
      function resize() {
        width = document.documentElement.clientWidth; height = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.round((width <= 600 ? CONFIG.snow.mobile : CONFIG.snow.desktop) * quality.snowScale);
        flakes = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height,
          r: 2 + Math.random() * 4.5, speed: 12 + Math.random() * 20, phase: Math.random() * 6.28 }));
        paint(0);
      }
      function tick(now) {
        frame = 0;
        if (scene !== current || document.hidden || still() || !ctx) return;
        if (!previousFrame || now - previousFrame >= 1000 / quality.fps - 1) {
          paint(previousFrame ? Math.min((now - previousFrame) / 1000, .08) : 0); previousFrame = now;
        }
        frame = requestAnimationFrame(tick);
      }
      function deadline() {
        timer = 0;
        if (scene !== current || document.hidden) return;
        const now = performance.now(); remaining -= Math.max(0, now - startTime); startTime = now;
        if (remaining <= 0 || (!preview && !isWelcomeDay())) { finish(); return; }
        timer = setTimeout(deadline, Math.min(250, remaining));
      }
      function refresh() {
        cancelAnimationFrame(frame); clearTimeout(timer); frame = timer = previousFrame = 0;
        quality = policy();
        stage.classList.toggle('xmas-welcome-still', still());
        stage.classList.toggle('xmas-welcome-paused', document.hidden);
        if (document.hidden) {
          if (startTime) remaining -= Math.max(0, performance.now() - startTime);
          startTime = 0; return;
        }
        if (startTime) remaining -= Math.max(0, performance.now() - startTime);
        startTime = performance.now(); resize(); deadline();
        if (scene === current && !still() && ctx) frame = requestAnimationFrame(tick);
      }
      listen(button, 'click', finish);
      listen(dialog, 'cancel', event => { event.preventDefault(); finish(); });
      listen(dialog, 'close', finish);
      listen(window, 'pagehide', finish);
      listen(document, 'visibilitychange', refresh);
      listen(window, 'resize', resize);
      listen(window, 'web-performance-optimizer-change', refresh);
      listen(window, 'effect-quality-change', refresh);
      if (motion.addEventListener) listen(motion, 'change', refresh);
      document.body.append(dialog);
      dialog.showModal(); // Native top layer and focus trap; the rest of the page is inert.
      button.focus({ preventScroll: true });
      window.dispatchEvent(new CustomEvent('christmas-welcome-change', { detail: { active: true } }));
      refresh();
    } catch (error) {
      console.warn('[ChristmasWelcome] Không thể dựng màn chào:', error);
      finish(); // A decorative failure must never lock surveys or login rewards.
    }
    return done;
  }
  async function start() {
    if (started) return ready;
    started = true;
    try { if (scheduled && isWelcomeDay()) await show(false); }
    finally { releaseStartup(); }
    return ready;
  }
  function preview() {
    if (scene) return scene.done;
    if (!window.__studentStartupCompleted || window.currentActiveExamId ||
      document.querySelector('dialog[open], .modal-overlay.active')) {
      return 'Hãy chờ tải xong và hoàn tất hộp thoại đang mở trước khi xem thử.';
    }
    return show(true);
  }
  function addPreviewButton() {
    if (!CONFIG.previewButton || document.getElementById('xmas-welcome-preview')) return;
    const container = document.querySelector('#tab-settings .form-container');
    if (!container) return;
    const button = document.createElement('button');
    button.id = 'xmas-welcome-preview'; button.type = 'button';
    button.textContent = 'Xem thử màn chào Giáng Sinh 31/12';
    button.style.cssText = 'display:block;margin:0 0 18px;padding:12px 18px;border:1px solid #b4cec6;border-radius:12px;background:#214f48;color:#fff5df;font:600 14px Segoe UI,Arial,sans-serif;cursor:pointer;max-width:100%;';
    button.addEventListener('click', () => {
      const result = preview();
      if (typeof result === 'string') { button.textContent = result; setTimeout(() => { button.textContent = 'Xem thử màn chào Giáng Sinh 31/12'; }, 4000); }
    });
    container.prepend(button);
  }
  window.ChristmasWelcome = Object.freeze({ start, ready, preview, isWelcomeDay,
    isActive: () => !!scene, close: () => scene?.finish(), version: '20261022.welcome-restored1' });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addPreviewButton, { once: true });
  else addPreviewButton();
})();
