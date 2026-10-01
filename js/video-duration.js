/* Thời lượng riêng cho từng form. Không làm tròn lên phần giây lẻ của YouTube. */
(function (root) {
    'use strict';
    const seconds = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Math.floor(Number(value)) : 0;
    const parts = value => {
        const n = seconds(value);
        return [Math.floor(n / 86400), Math.floor(n % 86400 / 3600), Math.floor(n % 3600 / 60), n % 60];
    };
    function videoId(value) {
        try {
            const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value);
            const host = url.hostname.toLowerCase();
            let id = '';
            if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
            else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
                id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:shorts|embed|live)\/([^/]+)/.exec(url.pathname)?.[1];
            }
            return /^[\w-]{11}$/.test(id || '') ? id : '';
        } catch (_) { return ''; }
    }
    // Poll the shared API rather than replacing another player's readiness callback.
    let apiPromise;
    function loadAPI() {
        if (root.YT?.Player) return Promise.resolve(root.YT);
        if (apiPromise) return apiPromise;
        apiPromise = new Promise((resolve, reject) => {
            let script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
            if (!script) {
                script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                document.head.append(script);
            }
            const started = Date.now();
            const timer = setInterval(() => {
                if (root.YT?.Player) { clearInterval(timer); resolve(root.YT); }
                else if (Date.now() - started > 15000) {
                    clearInterval(timer); script.remove(); reject(new Error('Không tải được YouTube. Kiểm tra mạng rồi thử lại.'));
                }
            }, 100);
        }).catch(error => { apiPromise = null; throw error; });
        return apiPromise;
    }
    let sequence = 0;
    async function readDuration(url, signal) {
        const id = videoId(url);
        if (!id) throw new Error('Link YouTube không hợp lệ.');
        const api = await loadAPI();
        if (signal?.aborted) throw new Error('Đã đổi video.');
        return new Promise((resolve, reject) => {
            const holder = document.createElement('div');
            holder.id = 'yt-duration-' + (++sequence);
            holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:200px;height:200px;pointer-events:none';
            holder.setAttribute('aria-hidden', 'true');
            document.body.append(holder);
            let player, poll, timeout, done = false, previous = 0, stable = 0;
            const finish = (error, duration) => {
                if (done) return;
                done = true; clearInterval(poll); clearTimeout(timeout);
                signal?.removeEventListener('abort', abort);
                try { player?.destroy(); } catch (_) { /* iframe already gone */ }
                holder.remove();
                if (error) reject(error); else resolve(duration);
            };
            const abort = () => finish(new Error('Đã đổi video.'));
            signal?.addEventListener('abort', abort, { once: true });
            timeout = setTimeout(() => finish(new Error('Chưa đọc được thời lượng. Video có thể bị chặn hoặc mạng gián đoạn.')), 15000);
            try {
                player = new api.Player(holder.id, {
                    width: 200, height: 200, videoId: id, playerVars: { autoplay: 0, controls: 0 },
                    events: {
                        onReady(event) {
                            if (done) return;
                            clearInterval(poll);
                            // onReady can precede metadata. Require repeated stable, positive readings.
                            poll = setInterval(() => {
                                try {
                                    const raw = Number(event.target.getDuration());
                                    if (event.target.getVideoData?.().isLive) {
                                        return finish(new Error('Video trực tiếp chưa có thời lượng cố định. Hãy dùng video đã kết thúc.'));
                                    }
                                    stable = raw > 0 && raw === previous ? stable + 1 : 0;
                                    previous = raw;
                                    if (stable >= 3 && seconds(raw) > 0) finish(null, seconds(raw));
                                } catch (error) { finish(error); }
                            }, 250);
                        },
                        onError(event) {
                            finish(new Error(event.data === 153
                                ? 'YouTube không xác nhận được nguồn trang. Hãy mở web qua localhost hoặc HTTPS thay cho file://.'
                                : 'Không đọc được video. Kiểm tra link và quyền nhúng video.'));
                        }
                    }
                });
            } catch (error) { finish(error); }
        });
    }
    function createController(read = readDuration, doc = root.document) {
        const forms = new Map();
        const fields = prefix => ['Day','Hour','Min','Sec'].map(suffix => doc.getElementById(prefix + suffix));
        const total = prefix => fields(prefix).reduce((sum, field, i) => sum + Math.max(0, Math.floor(Number(field?.value) || 0)) * [86400,3600,60,1][i], 0);
        const fill = (prefix, n, disabled) => fields(prefix).forEach((field, i) => {
            if (field) { field.value = n === null ? '' : parts(n)[i]; field.disabled = disabled; }
        });
        function update(prefix, url, options = {}) {
            forms.get(prefix)?.abort.abort();
            const state = { url: url.trim(), duration: 0, abort: new AbortController(), status: 'pending' };
            forms.set(prefix, state);
            const display = doc.getElementById(prefix === 'cond' ? 'videoTotalTimeDisplay' : 'editVideoTotalTimeDisplay');
            const saved = options.preserve ? total(prefix) : null;
            fill(prefix, saved, true);
            if (display) display.textContent = state.url ? '⏳ Đang đọc thời lượng video…' : '(Chưa có video)';
            if (!state.url) { state.status = 'empty'; return Promise.resolve(); }
            state.promise = new Promise(resolve => setTimeout(resolve, options.immediate ? 0 : 350))
                .then(() => {
                    if (state.abort.signal.aborted) throw new Error('Đã đổi video.');
                    return read(state.url, state.abort.signal);
                }).then(value => {
                    if (forms.get(prefix) !== state) return;
                    state.duration = seconds(value);
                    if (!state.duration) throw new Error('Chưa đọc được thời lượng video.');
                    state.status = 'ready';
                    fill(prefix, saved === null ? state.duration : Math.min(saved, state.duration), false);
                    const [d,h,m,s] = parts(state.duration);
                    if (display) display.textContent = `(Thời lượng: ${d} ngày ${h} giờ ${m} phút ${s} giây)`;
                }).catch(error => {
                    if (forms.get(prefix) !== state) return;
                    state.status = 'error';
                    fill(prefix, saved, true);
                    if (display) display.textContent = '(' + error.message + ' Dán lại link để thử lại.)';
                });
            return state.promise;
        }
        function validate(prefix) {
            const state = forms.get(prefix);
            const value = total(prefix);
            const limit = state?.status === 'ready' ? state.duration : value;
            fill(prefix, Math.min(value, limit), state?.status !== 'ready');
            return value <= limit;
        }
        function canSave(prefix, url) {
            if (!url.trim()) return true;
            const state = forms.get(prefix);
            return state?.url === url.trim() && state.status === 'ready' && total(prefix) <= state.duration;
        }
        return { update, validate, canSave };
    }
    root.VideoDuration = { seconds, parts, videoId, readDuration, createController };
    if (typeof module !== 'undefined') module.exports = root.VideoDuration;
})(typeof window !== 'undefined' ? window : globalThis);
