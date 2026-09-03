(function () {
    'use strict';

    if (window.SystemUpdateManager) {
        return;
    }

    const STORAGE_KEYS = Object.freeze({
        installed: 'appVersion',
        deferred: 'systemUpdateDeferredVersion',
        expected: 'systemUpdateExpectedVersion',
        lastCheck: 'systemUpdateLastCheckAt'
    });

    const config = Object.freeze({
        versionUrl: 'version.json',
        autoCheckDelayMs: 1600,
        periodicCheckMs: 15 * 60 * 1000,
        updateTimeoutMs: 9000
    });

    const state = {
        installedVersion: normalizeVersion(
            window.APP_VERSION ||
            localStorage.getItem(STORAGE_KEYS.installed) ||
            '1.0.0'
        ),
        latest: null,
        status: 'idle',
        checking: false,
        updating: false,
        lastCheckAt: null,
        error: '',
        progress: 0,
        progressText: '',
        periodicTimer: null
    };

    function normalizeVersion(value) {
        return String(value || '0.0.0')
            .trim()
            .replace(/^v/i, '')
            .split('+')[0];
    }

    function parseVersion(value) {
        const normalized = normalizeVersion(value);
        const parts = normalized.split('-', 2);
        const main = parts[0]
            .split('.')
            .map(part => Number.parseInt(part, 10))
            .map(number => Number.isFinite(number) ? number : 0);

        while (main.length < 3) {
            main.push(0);
        }

        return {
            raw: normalized,
            major: main[0],
            minor: main[1],
            patch: main[2],
            prerelease: parts[1] || ''
        };
    }

    function compareVersions(a, b) {
        const left = parseVersion(a);
        const right = parseVersion(b);

        for (const key of ['major', 'minor', 'patch']) {
            if (left[key] > right[key]) return 1;
            if (left[key] < right[key]) return -1;
        }

        if (!left.prerelease && right.prerelease) return 1;
        if (left.prerelease && !right.prerelease) return -1;
        if (left.prerelease === right.prerelease) return 0;

        return left.prerelease.localeCompare(
            right.prerelease,
            undefined,
            { numeric: true, sensitivity: 'base' }
        );
    }

    function escapeHTML(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);

        try {
            return new Intl.DateTimeFormat('vi-VN', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(date);
        } catch (_) {
            return date.toLocaleString('vi-VN');
        }
    }

    function nowLabel() {
        return new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getBanner() {
        return document.getElementById('updateBannerArea');
    }

    function getSettingsNav() {
        return document.getElementById('btnSettingsNav');
    }

    function notify(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'success');
            return;
        }

        console.log('[SystemUpdate]', message);
    }

    function setNavUpdateBadge(active) {
        const nav = getSettingsNav();
        if (!nav) return;
        nav.classList.toggle('has-update', Boolean(active));
    }

    function getChanges(info) {
        if (!info) return [];
        const values = Array.isArray(info.changes)
            ? info.changes
            : Array.isArray(info.releaseNotes)
                ? info.releaseNotes
                : [];

        return values
            .map(item => String(item || '').trim())
            .filter(Boolean);
    }

    function isMandatory(info) {
        if (!info) return false;

        if (info.mandatory === true) {
            return true;
        }

        if (
            info.minSupportedVersion &&
            compareVersions(
                state.installedVersion,
                info.minSupportedVersion
            ) < 0
        ) {
            return true;
        }

        return false;
    }

    function hasUpdate() {
        return Boolean(
            state.latest &&
            compareVersions(
                state.latest.version,
                state.installedVersion
            ) > 0
        );
    }

    function currentStatusCopy() {
        if (state.updating) {
            return {
                icon: '⬆️',
                badge: 'ĐANG CẬP NHẬT',
                title: 'Đang cài đặt phiên bản mới',
                description:
                    state.progressText ||
                    'Đang chuẩn bị tài nguyên mới...'
            };
        }

        if (state.status === 'checking') {
            return {
                icon: '🔎',
                badge: 'ĐANG KIỂM TRA',
                title: 'Đang kiểm tra bản cập nhật',
                description:
                    'Đang đối chiếu phiên bản với máy chủ...'
            };
        }

        if (state.status === 'offline') {
            return {
                icon: '📴',
                badge: 'NGOẠI TUYẾN',
                title: 'Chưa thể kiểm tra cập nhật',
                description:
                    'Thiết bị đang ngoại tuyến. Hệ thống sẽ tự kiểm tra lại khi có Internet.'
            };
        }

        if (state.status === 'error') {
            return {
                icon: '⚠️',
                badge: 'KHÔNG KIỂM TRA ĐƯỢC',
                title: 'Kiểm tra cập nhật gặp lỗi',
                description:
                    state.error ||
                    'Máy chủ phiên bản chưa phản hồi.'
            };
        }

        if (state.status === 'downgrade') {
            return {
                icon: '🧪',
                badge: 'BẢN ĐANG CHẠY MỚI HƠN',
                title: 'Không cần cập nhật',
                description:
                    'Phiên bản đang chạy mới hơn phiên bản công bố trên máy chủ.'
            };
        }

        if (hasUpdate()) {
            const mandatory = isMandatory(state.latest);
            return {
                icon: mandatory ? '🛡️' : '🚀',
                badge: mandatory ? 'CẬP NHẬT BẮT BUỘC' : 'CÓ BẢN MỚI',
                title:
                    state.latest.title ||
                    `Phiên bản ${state.latest.version} đã sẵn sàng`,
                description:
                    state.latest.summary ||
                    'Có phiên bản hệ thống mới với các cải tiến và sửa lỗi.'
            };
        }

        return {
            icon: '✅',
            badge: 'ĐÃ MỚI NHẤT',
            title: 'Hệ thống đã được cập nhật',
            description:
                'Bạn đang sử dụng phiên bản mới nhất hiện có.'
        };
    }

    function renderBanner() {
        const banner = getBanner();
        if (!banner) return;

        const copy = currentStatusCopy();
        const latestVersion = state.latest?.version || '—';
        const releaseDate = formatDate(state.latest?.releasedAt);
        const changes = getChanges(state.latest);
        const updateAvailable = hasUpdate();
        const mandatory = updateAvailable && isMandatory(state.latest);

        banner.className =
            'update-banner system-update-card ' +
            `system-update-${state.status}` +
            (updateAvailable ? ' has-new-version' : '');

        banner.style.display = 'block';

        const changePreview = updateAvailable && changes.length
            ? `
                <ul class="system-update-change-preview">
                    ${changes.slice(0, 3).map(item =>
                        `<li>${escapeHTML(item)}</li>`
                    ).join('')}
                </ul>
            `
            : '';

        const progress = state.updating
            ? `
                <div class="system-update-progress" aria-label="Tiến trình cập nhật">
                    <div class="system-update-progress-track">
                        <i style="width:${Math.max(3, state.progress)}%"></i>
                    </div>
                    <span>${Math.max(0, Math.min(100, state.progress))}%</span>
                </div>
            `
            : '';

        banner.innerHTML = `
            <div class="system-update-card-head">
                <div class="system-update-icon" aria-hidden="true">${copy.icon}</div>
                <div class="system-update-heading">
                    <span class="system-update-badge">${escapeHTML(copy.badge)}</span>
                    <h4>${escapeHTML(copy.title)}</h4>
                    <p>${escapeHTML(copy.description)}</p>
                </div>
            </div>

            <div class="system-update-version-grid">
                <div>
                    <span>Phiên bản đang chạy</span>
                    <strong>v${escapeHTML(state.installedVersion)}</strong>
                </div>
                <div>
                    <span>Phiên bản mới nhất</span>
                    <strong>${latestVersion === '—' ? '—' : 'v' + escapeHTML(latestVersion)}</strong>
                </div>
                <div>
                    <span>Lần kiểm tra gần nhất</span>
                    <strong>${state.lastCheckAt ? escapeHTML(nowLabel()) : 'Chưa kiểm tra'}</strong>
                </div>
                <div>
                    <span>Kênh phát hành</span>
                    <strong>${escapeHTML(state.latest?.channel || 'stable')}</strong>
                </div>
            </div>

            ${releaseDate ? `
                <div class="system-update-release-meta">
                    📅 Phát hành: ${escapeHTML(releaseDate)}
                    ${state.latest?.build ? ` • Build ${escapeHTML(state.latest.build)}` : ''}
                </div>
            ` : ''}

            ${changePreview}
            ${progress}

            <div class="system-update-actions">
                <button type="button"
                    class="system-update-btn system-update-btn-secondary"
                    data-update-action="check"
                    ${state.checking || state.updating ? 'disabled' : ''}>
                    ${state.checking ? 'Đang kiểm tra...' : '↻ Kiểm tra lại'}
                </button>

                ${updateAvailable ? `
                    <button type="button"
                        class="system-update-btn system-update-btn-secondary"
                        data-update-action="details"
                        ${state.updating ? 'disabled' : ''}>
                        📋 Chi tiết
                    </button>

                    ${mandatory ? '' : `
                        <button type="button"
                            class="system-update-btn system-update-btn-ghost"
                            data-update-action="later"
                            ${state.updating ? 'disabled' : ''}>
                            Để sau
                        </button>
                    `}

                    <button type="button"
                        class="system-update-btn system-update-btn-primary"
                        data-update-action="apply"
                        ${state.updating ? 'disabled' : ''}>
                        ${state.updating ? 'Đang cập nhật...' : '⬆️ Cập nhật ngay'}
                    </button>
                ` : ''}
            </div>
        `;

        setNavUpdateBadge(updateAvailable);

        banner.querySelectorAll('[data-update-action]')
            .forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.dataset.updateAction;

                    if (action === 'check') {
                        api.check({ manual: true });
                    } else if (action === 'details') {
                        api.openDetails();
                    } else if (action === 'later') {
                        api.defer();
                    } else if (action === 'apply') {
                        api.apply();
                    }
                });
            });
    }

    function ensureModal() {
        let modal = document.getElementById('systemUpdateModal');

        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'systemUpdateModal';
        modal.className = 'system-update-modal';
        modal.hidden = true;

        modal.innerHTML = `
            <div class="system-update-modal-backdrop" data-update-close></div>
            <section class="system-update-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="systemUpdateModalTitle">
                <button type="button"
                    class="system-update-modal-close"
                    data-update-close
                    aria-label="Đóng">✕</button>
                <div id="systemUpdateModalBody"></div>
            </section>
        `;

        modal.querySelectorAll('[data-update-close]')
            .forEach(element => {
                element.addEventListener('click', () => {
                    if (state.updating || isMandatory(state.latest)) {
                        return;
                    }

                    modal.hidden = true;
                    document.body.classList.remove(
                        'system-update-modal-open'
                    );
                });
            });

        document.body.appendChild(modal);
        return modal;
    }

    function openDetails(options) {
        const modal = ensureModal();
        const body = modal.querySelector('#systemUpdateModalBody');
        const info = state.latest;
        const changes = getChanges(info);
        const mandatory = isMandatory(info);
        const updating = Boolean(options?.updating || state.updating);

        body.innerHTML = `
            <div class="system-update-modal-hero">
                <span class="system-update-modal-icon">
                    ${updating ? '⬆️' : mandatory ? '🛡️' : '🚀'}
                </span>
                <div>
                    <span class="system-update-badge">
                        ${updating ? 'ĐANG CÀI ĐẶT' : mandatory ? 'CẬP NHẬT BẮT BUỘC' : 'BẢN PHÁT HÀNH MỚI'}
                    </span>
                    <h3 id="systemUpdateModalTitle">
                        ${escapeHTML(info?.title || `Phiên bản ${info?.version || ''}`)}
                    </h3>
                    <p>
                        v${escapeHTML(state.installedVersion)}
                        →
                        v${escapeHTML(info?.version || state.installedVersion)}
                    </p>
                </div>
            </div>

            ${info?.summary ? `
                <div class="system-update-modal-summary">
                    ${escapeHTML(info.summary)}
                </div>
            ` : ''}

            <div class="system-update-modal-meta">
                <span>📦 Build: ${escapeHTML(info?.build || '—')}</span>
                <span>📅 ${escapeHTML(formatDate(info?.releasedAt) || 'Không ghi ngày')}</span>
                <span>🌐 ${escapeHTML(info?.channel || 'stable')}</span>
            </div>

            <div class="system-update-modal-section">
                <h4>✨ Có gì mới?</h4>
                ${
                    changes.length
                        ? `<ul>${changes.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`
                        : '<p>Phiên bản này chưa cung cấp ghi chú thay đổi chi tiết.</p>'
                }
            </div>

            ${updating ? `
                <div class="system-update-modal-section">
                    <h4>Trạng thái</h4>
                    <div class="system-update-progress large">
                        <div class="system-update-progress-track">
                            <i style="width:${Math.max(3, state.progress)}%"></i>
                        </div>
                        <span>${state.progress}%</span>
                    </div>
                    <p class="system-update-live-status">
                        ${escapeHTML(state.progressText || 'Đang chuẩn bị...')}
                    </p>
                </div>
            ` : ''}

            <div class="system-update-modal-actions">
                ${
                    updating
                        ? `<button type="button" class="system-update-btn system-update-btn-primary" disabled>
                            Vui lòng không đóng trang...
                           </button>`
                        : `
                            ${mandatory ? '' : `
                                <button type="button"
                                    class="system-update-btn system-update-btn-secondary"
                                    data-modal-action="later">
                                    Để sau
                                </button>
                            `}
                            <button type="button"
                                class="system-update-btn system-update-btn-primary"
                                data-modal-action="apply">
                                ⬆️ Cập nhật ngay
                            </button>
                        `
                }
            </div>
        `;

        body.querySelector('[data-modal-action="later"]')
            ?.addEventListener('click', () => api.defer());

        body.querySelector('[data-modal-action="apply"]')
            ?.addEventListener('click', () => api.apply());

        modal.hidden = false;
        document.body.classList.add('system-update-modal-open');
    }

    function closeModal() {
        const modal = document.getElementById('systemUpdateModal');
        if (modal && !state.updating) {
            modal.hidden = true;
            document.body.classList.remove('system-update-modal-open');
        }
    }

    function setProgress(value, text) {
        state.progress = Math.max(
            0,
            Math.min(100, Number(value) || 0)
        );
        state.progressText = String(text || '');
        renderBanner();

        const modal = document.getElementById('systemUpdateModal');
        if (modal && !modal.hidden && state.updating) {
            openDetails({ updating: true });
        }
    }

    async function fetchVersionInfo() {
        const url = new URL(config.versionUrl, document.baseURI);
        url.searchParams.set('_updateCheck', Date.now().toString());

        const response = await fetch(url.href, {
            cache: 'no-store',
            credentials: 'same-origin',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(
                `Máy chủ trả về HTTP ${response.status}.`
            );
        }

        const data = await response.json();

        if (
            !data ||
            typeof data.version !== 'string' ||
            !data.version.trim()
        ) {
            throw new Error(
                'version.json không chứa trường "version" hợp lệ.'
            );
        }

        return {
            ...data,
            version: normalizeVersion(data.version)
        };
    }

    async function check(options) {
        if (state.checking || state.updating) {
            return state.latest;
        }

        const manual = options?.manual === true;

        if (!navigator.onLine) {
            state.status = 'offline';
            state.error = '';
            renderBanner();

            if (manual) {
                notify(
                    'Thiết bị đang ngoại tuyến, chưa thể kiểm tra cập nhật.',
                    'warning'
                );
            }

            return null;
        }

        state.checking = true;
        state.status = 'checking';
        state.error = '';
        renderBanner();

        try {
            const info = await fetchVersionInfo();

            state.latest = info;
            state.lastCheckAt = new Date();
            localStorage.setItem(
                STORAGE_KEYS.lastCheck,
                state.lastCheckAt.toISOString()
            );

            const comparison = compareVersions(
                info.version,
                state.installedVersion
            );

            if (comparison > 0) {
                state.status = 'update-available';

                const deferredVersion =
                    localStorage.getItem(STORAGE_KEYS.deferred);

                if (
                    isMandatory(info) ||
                    deferredVersion !== info.version
                ) {
                    setNavUpdateBadge(true);
                }

                if (
                    isMandatory(info) &&
                    !document.body.classList.contains(
                        'system-update-modal-open'
                    )
                ) {
                    setTimeout(() => openDetails(), 350);
                }

                if (manual) {
                    notify(
                        `Đã tìm thấy phiên bản ${info.version}.`,
                        'success'
                    );
                }
            } else if (comparison < 0) {
                state.status = 'downgrade';

                if (manual) {
                    notify(
                        'Phiên bản đang chạy mới hơn bản công bố trên máy chủ.',
                        'warning'
                    );
                }
            } else {
                state.status = 'up-to-date';
                localStorage.removeItem(STORAGE_KEYS.deferred);
                setNavUpdateBadge(false);

                if (manual) {
                    notify(
                        'Bạn đang dùng phiên bản mới nhất.',
                        'success'
                    );
                }
            }

            return info;
        } catch (error) {
            state.status = navigator.onLine
                ? 'error'
                : 'offline';

            state.error =
                error?.message ||
                'Không thể kết nối máy chủ cập nhật.';

            if (manual) {
                notify(
                    'Không thể kiểm tra cập nhật: ' + state.error,
                    'error'
                );
            }

            return null;
        } finally {
            state.checking = false;
            renderBanner();
        }
    }

    async function waitForWorkerState(worker, wantedStates, timeoutMs) {
        if (!worker) return false;

        if (wantedStates.includes(worker.state)) {
            return true;
        }

        return await new Promise(resolve => {
            let settled = false;

            const finish = value => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                worker.removeEventListener('statechange', onStateChange);
                resolve(value);
            };

            const onStateChange = () => {
                if (wantedStates.includes(worker.state)) {
                    finish(true);
                }

                if (worker.state === 'redundant') {
                    finish(false);
                }
            };

            const timer = setTimeout(
                () => finish(false),
                timeoutMs
            );

            worker.addEventListener(
                'statechange',
                onStateChange
            );
        });
    }

    async function refreshServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            return {
                supported: false,
                updated: false
            };
        }

        const registration =
            await navigator.serviceWorker.getRegistration();

        if (!registration) {
            return {
                supported: true,
                updated: false
            };
        }

        try {
            await registration.update();

            let worker =
                registration.waiting ||
                registration.installing;

            if (worker?.state === 'installing') {
                await waitForWorkerState(
                    worker,
                    ['installed', 'activated'],
                    config.updateTimeoutMs
                );
            }

            worker =
                registration.waiting ||
                registration.installing;

            if (worker && worker.state === 'installed') {
                try {
                    worker.postMessage({
                        type: 'SKIP_WAITING'
                    });
                } catch (_) {}
            }

            return {
                supported: true,
                updated: true
            };
        } catch (error) {
            console.warn(
                '[SystemUpdate] Service Worker update failed:',
                error
            );

            return {
                supported: true,
                updated: false,
                error
            };
        }
    }

    async function clearSiteCaches() {
        if (!('caches' in window)) {
            return 0;
        }

        const names = await caches.keys();

        const results = await Promise.allSettled(
            names.map(name => caches.delete(name))
        );

        return results.filter(
            result =>
                result.status === 'fulfilled' &&
                result.value === true
        ).length;
    }

    function buildRefreshUrl() {
        const url = new URL(location.href);
        url.searchParams.set(
            '__app_update',
            `${state.latest?.version || 'latest'}_${Date.now()}`
        );
        return url.href;
    }

    async function apply() {
        if (state.updating) return;

        if (!navigator.onLine) {
            state.status = 'offline';
            renderBanner();
            notify(
                'Cần kết nối Internet để cập nhật hệ thống.',
                'warning'
            );
            return;
        }

        if (!state.latest || !hasUpdate()) {
            await check({ manual: true });

            if (!state.latest || !hasUpdate()) {
                return;
            }
        }

        state.updating = true;
        state.status = 'updating';
        setProgress(5, 'Đang xác minh phiên bản mới...');
        openDetails({ updating: true });

        try {
            const freshInfo = await fetchVersionInfo();

            if (
                compareVersions(
                    freshInfo.version,
                    state.installedVersion
                ) <= 0
            ) {
                state.latest = freshInfo;
                state.updating = false;
                state.status = 'up-to-date';
                renderBanner();
                closeModal();
                notify(
                    'Hệ thống đã ở phiên bản mới nhất.',
                    'success'
                );
                return;
            }

            state.latest = freshInfo;

            setProgress(
                20,
                'Đang yêu cầu Service Worker lấy bản mới...'
            );

            await refreshServiceWorker();

            setProgress(
                48,
                'Đang dọn bộ nhớ đệm tài nguyên cũ...'
            );

            const deletedCaches = await clearSiteCaches();

            setProgress(
                70,
                deletedCaches
                    ? `Đã dọn ${deletedCaches} bộ cache. Đang chuẩn bị tải lại...`
                    : 'Cache đã sẵn sàng. Đang chuẩn bị tải lại...'
            );

            try {
                sessionStorage.setItem(
                    STORAGE_KEYS.expected,
                    state.latest.version
                );
                localStorage.setItem(
                    STORAGE_KEYS.expected,
                    state.latest.version
                );
            } catch (_) {}

            if (
                typeof performance !== 'undefined' &&
                typeof performance.clearResourceTimings === 'function'
            ) {
                performance.clearResourceTimings();
            }

            setProgress(
                92,
                'Đang chuyển sang phiên bản mới...'
            );

            await new Promise(resolve =>
                setTimeout(resolve, 500)
            );

            location.replace(buildRefreshUrl());
        } catch (error) {
            state.updating = false;
            state.status = 'error';
            state.error =
                error?.message ||
                'Cập nhật chưa hoàn tất.';

            renderBanner();
            openDetails();

            notify(
                'Cập nhật chưa hoàn tất: ' + state.error,
                'error'
            );
        }
    }

    function defer() {
        if (!state.latest || isMandatory(state.latest)) {
            return;
        }

        localStorage.setItem(
            STORAGE_KEYS.deferred,
            state.latest.version
        );

        closeModal();

        notify(
            `Đã để phiên bản ${state.latest.version} cập nhật sau.`,
            'success'
        );
    }

    function checkPostUpdateResult() {
        const expected =
            sessionStorage.getItem(STORAGE_KEYS.expected) ||
            localStorage.getItem(STORAGE_KEYS.expected);

        if (!expected) return;

        if (
            compareVersions(
                state.installedVersion,
                expected
            ) >= 0
        ) {
            sessionStorage.removeItem(STORAGE_KEYS.expected);
            localStorage.removeItem(STORAGE_KEYS.expected);

            setTimeout(() => {
                notify(
                    `✅ Cập nhật thành công lên phiên bản ${state.installedVersion}.`,
                    'success'
                );
            }, 900);
        } else {
            setTimeout(() => {
                notify(
                    `Trang đã tải lại nhưng vẫn đang ở v${state.installedVersion}; máy chủ có thể chưa phát hành đủ file của v${expected}.`,
                    'warning'
                );
            }, 1200);
        }
    }

    function scheduleChecks() {
        clearInterval(state.periodicTimer);

        state.periodicTimer = setInterval(() => {
            if (
                document.visibilityState === 'visible' &&
                navigator.onLine &&
                !state.updating
            ) {
                check({ manual: false });
            }
        }, config.periodicCheckMs);
    }

    function mount() {
        try {
            localStorage.setItem(
                STORAGE_KEYS.installed,
                state.installedVersion
            );
        } catch (_) {}

        const lastCheck =
            localStorage.getItem(STORAGE_KEYS.lastCheck);

        if (lastCheck) {
            const date = new Date(lastCheck);
            if (!Number.isNaN(date.getTime())) {
                state.lastCheckAt = date;
            }
        }

        ensureModal();
        renderBanner();
        checkPostUpdateResult();
        scheduleChecks();

        setTimeout(
            () => check({ manual: false }),
            config.autoCheckDelayMs
        );
    }

    const api = {
        getState() {
            return {
                ...state,
                latest: state.latest
                    ? { ...state.latest }
                    : null
            };
        },

        compareVersions,
        check,
        apply,
        defer,
        openDetails,
        render: renderBanner
    };

    window.SystemUpdateManager = api;

    // Tương thích các nút/hàm cũ trên website.
    window.checkForUpdates = function () {
        return api.check({ manual: true });
    };

    window.applySystemUpdate = function () {
        return api.apply();
    };

    window.addEventListener('online', () => {
        state.status = 'idle';
        api.check({ manual: false });
    });

    window.addEventListener('offline', () => {
        if (!state.updating) {
            state.status = 'offline';
            renderBanner();
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (
            document.visibilityState === 'visible' &&
            navigator.onLine &&
            !state.updating
        ) {
            const elapsed = state.lastCheckAt
                ? Date.now() - state.lastCheckAt.getTime()
                : Infinity;

            if (elapsed > 5 * 60 * 1000) {
                api.check({ manual: false });
            }
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            mount,
            { once: true }
        );
    } else {
        mount();
    }
})();
