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
            dialog { position:fixed; inset:0; margin:auto; width:min(520px,calc(100vw - 32px)); max-width:calc(100vw - 32px); max-height:calc(100dvh - 32px); height:fit-content; overflow:hidden; border:1px solid #e2e6f2; border-radius:22px; padding:0; background:#fff; color:#243553; box-shadow:0 24px 90px #16244840; font:15px/1.6 'Segoe UI',sans-serif; overflow-wrap:anywhere; z-index:2147483647; }
            dialog[open],dialog:popover-open{display:flex;flex-direction:column}dialog.grade{width:min(680px,calc(100vw - 32px))}
            header{display:flex;gap:13px;align-items:center;padding:22px 26px 18px;flex-shrink:0;border-bottom:1px solid #e8ecf3}
            .body{padding:22px 26px;overflow:auto;overscroll-behavior:contain;min-height:0;scrollbar-width:thin;scrollbar-color:#ccd3e2 transparent}
            dialog:popover-open { display:flex; }
            dialog::backdrop { background:#15223b70; backdrop-filter:blur(4px); }
            .mark { display:grid; place-items:center; width:44px; height:44px; flex:0 0 44px; border-radius:14px; background:#eef1fb; color:#5865d8; font-size:24px; font-weight:800; }
            h2 { margin:0; font-size:20px; line-height:1.35; color:#202f58; }
            p { margin:0; white-space:pre-wrap; }
            label { display:block; margin-top:18px; font-weight:700; }
            input { width:100%; margin-top:8px; border:1px solid #b9c6de; border-radius:12px; padding:12px 14px; font:inherit; color:#243553; background:#fff; }
            .actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:10px; padding:16px 26px; flex-shrink:0; border-top:1px solid #e8ecf3;background:#f8f9fc; }
            button { border:0; border-radius:12px; padding:12px 22px; min-height:46px; font:700 16px/1.4 'Nunito','Segoe UI',sans-serif; cursor:pointer; color:white; background:#5865d8; }
            button.secondary { background:#edf0f8; color:#435475; }
            :focus-visible { outline:3px solid #a9b1f3; outline-offset:3px; }
            @media(max-width:480px) { dialog { border-radius:18px;max-height:calc(100dvh - 20px); } header{padding:17px} .body{padding:16px}.actions{padding:12px 16px}h2{font-size:18px} .actions button { flex:1;padding:12px; } }
        </style><dialog aria-labelledby="title" aria-describedby="message"><header><div class="mark" aria-hidden="true"></div><h2 id="title"></h2></header><div class="body"><p id="message"></p></div><div class="actions"></div></dialog>`;
        const dialog = root.querySelector('dialog');
        // Opt-in styling surfaces keep layout/focus behavior inside the dialog.
        dialog.setAttribute('part', 'panel');
        root.querySelector('h2').setAttribute('part', 'title');
        root.querySelector('.mark').setAttribute('part', 'mark');
        const options = task.options;
        root.querySelector('h2').textContent = options.title || (task.kind === 'confirm' ? 'Xác nhận thao tác' : task.kind === 'prompt' ? 'Nhập thông tin' : 'Thông báo');
        root.querySelector('.mark').textContent = task.kind === 'confirm' ? '?' : options.type === 'error' ? '!' : options.type === 'success' ? '✓' : 'i';
        root.querySelector('p').textContent = task.message;
        if (options.layout === 'grade' && customElements.get('grade-result-summary')) {
            dialog.classList.add('grade');
            const summary = document.createElement('grade-result-summary');
            summary.id = 'message'; summary.textContent = task.message;
            root.querySelector('p').replaceWith(summary);
            // The structured content has its own headings; don't announce it twice.
            dialog.removeAttribute('aria-describedby');
        }
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
            label.append(input); root.querySelector('.body').append(label);
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
