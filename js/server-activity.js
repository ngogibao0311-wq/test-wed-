/* Feedback only: never retries, cancels or settles a transaction. */
(() => {
    'use strict';
    if (window.ServerActivity) return;
    const pending = new Map();
    let ui = null, showTimer = null, slowTimer = null, suspensions = 0;
    let sequence = 0, previousFocus = null, slow = false;
    const silentEconomy = new Set([
        'video_tick', 'that_tich_auto', 'mid_autumn_auto', 'discount_migrate',
        'collection_milestone', 'pet_status', 'shopping_status',
        'birthday_issue', 'legacy_store_recover'
    ]);
    const labels = {
        cash_request: 'Đang gửi yêu cầu đổi tiền…', cash_approve: 'Đang xác nhận duyệt tiền…',
        cash_transition: 'Đang cập nhật giao dịch…', legacy_cash_recover: 'Đang đối soát yêu cầu trước…',
        convert_coin_to_money: 'Đang xác nhận đổi Coin…', convert_money_to_coin: 'Đang xác nhận đổi tiền…',
        store_buy: 'Đang xác nhận mua vật phẩm…', store_trial: 'Đang xác nhận dùng thử…',
        that_tich_redeem: 'Đang xác nhận đổi vật phẩm…', inbox_claim: 'Đang xác nhận nhận thưởng…',
        ticket_buy: 'Đang xác nhận mua vé…', daily_claim: 'Đang xác nhận nhận quà…',
        wheel_spin: 'Đang xác nhận lượt quay…', royal_ball_play: 'Đang xác nhận lượt chơi…',
        submission_submit: 'Đang xác nhận nộp bài…', teacher_grade: 'Đang lưu kết quả chấm bài…',
        teacher_source_write: 'Đang lưu thay đổi…', teacher_gift: 'Đang xác nhận gửi quà…',
        pet_food: 'Đang xác nhận cho thú cưng ăn…', pet_unlock: 'Đang mở tương tác thú cưng…'
    };
    const accountLabels = {
        verify:'Đang xác minh mã khôi phục…', enroll:'Đang lưu mã khôi phục…',
        reset_device:'Đang xác nhận thiết bị…', rotate:'Đang đổi mã khôi phục…',
        request_device:'Đang gửi yêu cầu hỗ trợ…', request_password:'Đang báo quên mật khẩu…',
        teacher_decide:'Đang xác nhận yêu cầu hỗ trợ…', release_session:'Đang xác nhận đăng xuất…'
    };
    function render() {
        if (!ui || !pending.size) return;
        const label = [...pending.values()].at(-1);
        ui.title.textContent = label;
        ui.detail.textContent = slow
            ? 'Máy chủ phản hồi lâu hơn dự kiến. Yêu cầu vẫn đang chờ xác nhận; thu gọn không hủy thao tác.'
            : 'Vui lòng chờ phản hồi từ máy chủ.';
        ui.compactLabel.textContent = ui.title.textContent;
        ui.minimize.hidden = !slow;
    }
    function hide() {
        clearTimeout(showTimer); clearTimeout(slowTimer);
        showTimer = slowTimer = null;
        if (ui) {
            const restore = document.activeElement === ui.host;
            if (ui.dialog.open) ui.dialog.close();
            if (ui.compact.hidePopover && ui.compact.matches(':popover-open')) ui.compact.hidePopover();
            ui.host.remove(); ui = null;
            if (restore && previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
        }
        previousFocus = null; slow = false;
    }
    function minimize() {
        if (!ui || !pending.size) return;
        ui.dialog.close();
        ui.compact.hidden = false;
        if (ui.compact.showPopover) ui.compact.showPopover();
    }
    function expand() {
        if (!ui || !pending.size) return;
        if (ui.compact.hidePopover && ui.compact.matches(':popover-open')) ui.compact.hidePopover();
        ui.compact.hidden = true;
        ui.dialog.showModal();
        ui.dialog.focus({preventScroll:true});
    }
    function show() {
        showTimer = null;
        if (!pending.size || ui || suspensions || !document.body) return;
        try {
            previousFocus = document.activeElement;
            while (previousFocus?.shadowRoot?.activeElement) previousFocus = previousFocus.shadowRoot.activeElement;
            const host = document.createElement('div');
            host.id = 'serverActivity'; host.className = 'ui-theme-immune server-activity-host';
            const root = host.attachShadow({mode:'open'});
            root.innerHTML = `<style>
                :host{all:initial}*{box-sizing:border-box}
                dialog{position:fixed;inset:0;margin:auto;width:min(360px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;padding:30px 26px 24px;border:1px solid #e3e7f4;border-radius:26px;background:#fff;color:#253451;box-shadow:0 24px 85px #18243d32;text-align:center;font:15px/1.6 'Segoe UI',sans-serif;outline:none}
                dialog::backdrop{background:#14223865;backdrop-filter:blur(3px)}
                .orb{position:relative;display:grid;place-items:center;width:76px;height:76px;margin:0 auto 20px;border-radius:50%;background:#f0f1ff;color:#6064db}
                .orb:before,.orb:after{content:'';position:absolute;border-radius:50%;inset:0;border:3px solid #e3e4fb;border-top-color:#6064db;animation:orbit 1.1s linear infinite}
                .orb:after{inset:8px;border-width:2px;border-color:transparent;border-bottom-color:#a0a5ec;animation-direction:reverse;animation-duration:1.8s}
                svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
                h2{margin:0 0 8px;font-size:19px;line-height:1.45;color:#253451;font-weight:700;overflow-wrap:anywhere}
                p{margin:0;color:#71809b;font-size:13px;line-height:1.65}
                .rail{height:3px;margin:20px 22px 0;border-radius:8px;background:#eef0fa;overflow:hidden}.rail:after{content:'';display:block;width:40%;height:100%;border-radius:inherit;background:#7478e8;animation:travel 1.5s ease-in-out infinite}
                button{font:600 13px/1.5 'Segoe UI',sans-serif;cursor:pointer}.minimize{margin-top:18px;padding:7px 15px;background:#f4f6fc;color:#536184;border:1px solid #e1e6f4;border-radius:10px}
                button:focus-visible{outline:3px solid #a1a7f1;outline-offset:3px}[hidden]{display:none!important}
                .compact{position:fixed;inset:auto 16px max(16px,env(safe-area-inset-bottom)) auto;margin:0;padding:12px 18px;max-width:calc(100vw - 32px);border:1px solid #dce2f3;border-radius:16px;background:#fff;color:#344363;box-shadow:0 8px 36px #21355125;align-items:center;gap:12px;text-align:left;z-index:2147483000}
                .compact:popover-open,.compact:not([popover]){display:flex}.compact i{width:20px;height:20px;flex:0 0 20px;border:2px solid #e2e5f5;border-top-color:#6064db;border-radius:50%;animation:orbit 1.1s linear infinite}
                @keyframes orbit{to{transform:rotate(360deg)}}@keyframes travel{0%{transform:translateX(-110%)}100%{transform:translateX(360%)}}
                @media(prefers-reduced-motion:reduce){.orb:before,.orb:after,.compact i,.rail:after{animation:none}.rail:after{width:100%;opacity:.45}}
            </style><dialog tabindex="-1" aria-labelledby="activityTitle" aria-describedby="activityDetail" aria-busy="true">
              <div class="orb" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 19 6v5c0 4-3 7-7 10-4-3-7-6-7-10V6Z"/><path d="M12 8v4l2 2"/></svg></div>
              <h2 id="activityTitle" role="status" aria-live="polite"></h2><p id="activityDetail"></p><div class="rail" aria-hidden="true"></div>
              <button type="button" class="minimize" hidden>Thu gọn</button>
            </dialog><button type="button" class="compact" hidden aria-label="Mở trạng thái xử lý"><i aria-hidden="true"></i><span role="status" aria-live="polite"></span></button>`;
            ui = {host,dialog:root.querySelector('dialog'),title:root.querySelector('h2'),detail:root.querySelector('p'),minimize:root.querySelector('.minimize'),compact:root.querySelector('.compact'),compactLabel:root.querySelector('.compact span')};
            if (ui.compact.showPopover) ui.compact.setAttribute('popover','manual');
            ui.dialog.addEventListener('cancel',event=>{event.preventDefault();if(slow)minimize();});
            ui.minimize.addEventListener('click',minimize); ui.compact.addEventListener('click',expand);
            document.body.append(host); render(); ui.dialog.showModal(); ui.dialog.focus({preventScroll:true});
            slowTimer=setTimeout(()=>{slow=true;render();},10000);
        } catch (_) { // A missing UI capability must not alter transaction semantics.
            ui?.host.remove(); ui=null;
        }
    }
    function begin(label='Đang xác nhận với máy chủ…') {
        const id=++sequence; pending.set(id,String(label));
        if (ui) render(); else if (!showTimer && !suspensions) showTimer=setTimeout(show,120);
        let done=false;
        return () => {
            if (done) return; done=true; pending.delete(id);
            if (!pending.size) hide(); else render();
        };
    }
    async function run(label,task) {
        const finish=begin(label);
        try { return await task(); } finally { finish(); }
    }
    function economy(action,task,options={}) {
        if (options.feedback === false || silentEconomy.has(action)) return task();
        return run(options.loadingText || labels[action] || 'Đang xác nhận với máy chủ…',task);
    }
    function account(action,task) {
        return accountLabels[action] ? run(accountLabels[action],task) : task();
    }
    // Confirmation/error dialogs must remain usable even inside a longer action.
    function suspend() {
        suspensions++; hide(); let released=false;
        return () => {
            if(released)return; released=true; suspensions--;
            if(!suspensions && pending.size && !showTimer)showTimer=setTimeout(show,120);
        };
    }
    function bindActions() {
        const actions = {
            buyLuckyTicket:'Đang xác nhận mua vé…', buyItem:'Đang kiểm tra vật phẩm…',
            trialItem:'Đang xác nhận dùng thử…', processPayment:'Đang xác nhận thanh toán…',
            executeConversion:'Đang xác nhận quy đổi…', handleRequestCashSubmit:'Đang gửi yêu cầu đổi tiền…',
            handleTeacherProcessCash:'Đang xác nhận yêu cầu tiền mặt…',
            saveStudentProfileDetails:'Đang lưu thông tin…', saveNewAvatar:'Đang lưu ảnh đại diện…'
        };
        for(const [name,label] of Object.entries(actions)) {
            const original=window[name];
            if(typeof original!=='function'||original.serverActivityBound)continue;
            const wrapped=function(...args){return run(label,()=>original.apply(this,args));};
            wrapped.serverActivityBound=true;window[name]=wrapped;
        }
    }
    document.addEventListener('DOMContentLoaded',()=>{if(pending.size&&!ui)show();},{once:true});
    document.addEventListener('DOMContentLoaded',bindActions,{once:true});
    if(document.readyState!=='loading')bindActions();
    window.ServerActivity=Object.freeze({begin,run,economy,account,suspend});
})();
