(() => {
    'use strict';
    if (window.AppDialog) return;
    const queue = [];
    let active = null;

    // A native modal supplies focus trapping and a top layer; the shadow root
    // keeps item themes and page resets out of the notification's appearance.
    function next() {
        if (active || !queue.length || !document.body) return;
        const task = active = queue.shift();
        const previous = document.activeElement;
        const host = document.createElement('div');
        host.className = 'app-dialog-host';
        const root = host.attachShadow({mode: 'open'});
        root.innerHTML = `<style>
            :host { all: initial; }
            * { box-sizing: border-box; }
            dialog { position:fixed; inset:0; margin:auto; width:min(520px,calc(100vw - 32px)); max-width:calc(100vw - 32px); max-height:calc(100dvh - 32px); height:fit-content; overflow:auto; border:1px solid #e2e6f2; border-radius:24px; padding:28px; background:#fff; color:#243553; box-shadow:0 24px 90px #16244840; font:16px/1.6 'Nunito','Segoe UI',sans-serif; overflow-wrap:anywhere; z-index:2147483647; }
            dialog:popover-open { display:block; }
            dialog::backdrop { background:#15223b70; backdrop-filter:blur(4px); }
            .mark { display:grid; place-items:center; width:44px; height:44px; margin-bottom:14px; border-radius:14px; background:#eef1fb; color:#5865d8; font-size:24px; font-weight:800; }
            h2 { margin:0 0 12px; font-size:23px; line-height:1.3; color:#202f58; }
            p { margin:0; white-space:pre-wrap; }
            label { display:block; margin-top:18px; font-weight:700; }
            input { width:100%; margin-top:8px; border:1px solid #b9c6de; border-radius:12px; padding:12px 14px; font:inherit; color:#243553; background:#fff; }
            .actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:10px; margin-top:24px; }
            button { border:0; border-radius:12px; padding:12px 22px; min-height:46px; font:700 16px/1.4 'Nunito','Segoe UI',sans-serif; cursor:pointer; color:white; background:#5865d8; }
            button.secondary { background:#edf0f8; color:#435475; }
            :focus-visible { outline:3px solid #a9b1f3; outline-offset:3px; }
            @media(max-width:480px) { dialog { padding:22px; border-radius:18px; } h2{font-size:21px} .actions button { flex:1; } }
        </style><dialog aria-labelledby="title" aria-describedby="message"><div class="mark" aria-hidden="true"></div><h2 id="title"></h2><p id="message"></p><div class="actions"></div></dialog>`;
        const dialog = root.querySelector('dialog');
        const options = task.options;
        root.querySelector('h2').textContent = options.title || (task.kind === 'confirm' ? 'Xác nhận thao tác' : task.kind === 'prompt' ? 'Nhập thông tin' : 'Thông báo');
        root.querySelector('.mark').textContent = task.kind === 'confirm' ? '?' : options.type === 'error' ? '!' : options.type === 'success' ? '✓' : 'i';
        root.querySelector('p').textContent = task.message;
        const actions = root.querySelector('.actions');
        let input, settled = false, timer;
        const cancelled = task.kind === 'prompt' ? null : false;
        function finish(value) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (dialog.matches(':popover-open')) dialog.hidePopover();
            if (dialog.open) dialog.close();
            if (input) input.value = '';
            host.remove();
            active = null;
            if (!options.transient && previous?.isConnected) previous.focus({preventScroll:true});
            task.resolve(value);
            queueMicrotask(next);
        }
        function button(text, value, secondary) {
            const el = document.createElement('button');
            el.type = 'button'; el.textContent = text;
            if (secondary) el.className = 'secondary';
            el.onclick = () => finish(typeof value === 'function' ? value() : value);
            actions.append(el);
            return el;
        }
        if (task.kind === 'prompt') {
            const label = document.createElement('label');
            label.textContent = options.inputLabel || 'Nội dung';
            input = document.createElement('input');
            input.type = options.password ? 'password' : 'text';
            input.autocomplete = options.password ? 'current-password' : 'off';
            input.value = options.defaultValue || '';
            label.append(input); actions.before(label);
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); finish(input.value); }
            });
        }
        const cancel = task.kind !== 'alert' && button(options.cancelText || 'Hủy', cancelled, true);
        const accept = button(options.acceptText || (task.kind === 'alert' ? 'Đã hiểu' : 'Xác nhận'), () => input ? input.value : true);
        dialog.addEventListener('cancel', event => { event.preventDefault(); finish(cancelled); });
        dialog.addEventListener('close', () => finish(cancelled));
        document.body.append(host);
        task.finish = finish;
        if (options.transient) {
            dialog.setAttribute('role', 'status');
            if (typeof dialog.showPopover === 'function') {
                dialog.setAttribute('popover', 'manual');
                dialog.showPopover();
            } else dialog.show();
        } else {
            dialog.showModal();
            if (!matchMedia('(prefers-reduced-motion: reduce)').matches && window.WebAnimationSystem?.getState?.().enabled !== false) {
                dialog.animate([{opacity:0, translate:'0 8px'}, {opacity:1, translate:'0 0'}], {duration:180, easing:'ease-out'});
            }
            (input || cancel || accept).focus({preventScroll:true});
        }
        if (options.duration > 0) timer = setTimeout(() => finish(true), options.duration);
    }
    function show(kind, message, options = {}) {
        const text = String(message ?? '');
        // Transient notices never pause a timed game or block a confirmation.
        if (active?.options.transient) active.finish(true);
        if (options.transient) {
            for (let i = queue.length - 1; i >= 0; i--) {
                if (queue[i].options.transient) queue.splice(i, 1)[0].resolve(true);
            }
        }
        // Repeated clicks on the same control share one decision, not a queue
        // of dialogs that could approve duplicate destructive actions.
        if (kind === 'confirm' || kind === 'prompt') {
            if ([active, ...queue].some(task => task && task.kind === kind && task.message === text)) return Promise.resolve(kind === 'prompt' ? null : false);
        }
        return new Promise(resolve => { queue.push({kind, message:text, options, resolve}); next(); });
    }
    window.AppDialog = {
        notify: (message, options) => { show('alert', message, options); },
        alert: (message, options) => show('alert', message, options),
        confirm: (message, options) => show('confirm', message, options),
        prompt: (message, defaultValue = '', options = {}) => show('prompt', message, {...options, defaultValue}),
        toast: (message, type = 'info') => show('alert', message, {type, transient:true, duration:4500})
    };
    // Legacy inline alerts also use the web UI. Confirmation calls explicitly
    // await AppDialog.confirm; never replace synchronous confirm with a Promise.
    window.alert = message => window.AppDialog.notify(message);
    window.showToast = window.AppDialog.toast;
    document.addEventListener('DOMContentLoaded', next, {once:true});
})();
