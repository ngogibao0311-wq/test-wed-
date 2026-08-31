const CACHE_VERSION = 'study-shell-v4';
const OFFLINE_CACHE = `${CACHE_VERSION}-offline`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_PAGE = './offline.html';
const MAX_RUNTIME_ENTRIES = 120;

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(OFFLINE_CACHE);
        await cache.add(new Request(OFFLINE_PAGE, { cache: 'reload' }));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(
            names
                .filter(name => name.startsWith('study-') && ![OFFLINE_CACHE, RUNTIME_CACHE].includes(name))
                .map(name => caches.delete(name))
        );
        await self.clients.claim();
    })());
});

async function pruneRuntimeCache() {
    const cache = await caches.open(RUNTIME_CACHE);
    const keys = await cache.keys();
    if (keys.length <= MAX_RUNTIME_ENTRIES) return;
    const overflow = keys.length - MAX_RUNTIME_ENTRIES;
    await Promise.all(keys.slice(0, overflow).map(request => cache.delete(request)));
}

async function buildFallbackResponse(mode, failedUrl, status) {
    const cached = await caches.match(OFFLINE_PAGE, { ignoreSearch: true });
    if (!cached) {
        return new Response(
            '<!doctype html><meta charset="utf-8"><title>Lỗi hệ thống</title><h1>Không thể tải trang</h1><p>Không có trang dự phòng trong cache.</p>',
            { status: status || 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }

    let html = await cached.text();
    const injection = `<script>window.__APP_SW_ERROR_MODE__=${JSON.stringify(mode)};window.__APP_FAILED_URL__=${JSON.stringify(failedUrl)};<\/script>`;
    html = html.replace('</head>', injection + '</head>');

    return new Response(html, {
        status: status || (mode === '404' ? 404 : 503),
        statusText: mode === '404' ? 'Not Found' : 'Service Unavailable',
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-App-Fallback': mode
        }
    });
}

async function networkFirstNavigation(request) {
    const url = new URL(request.url);
    const cache = await caches.open(RUNTIME_CACHE);

    if (url.pathname.endsWith('/offline.html')) {
        try {
            const response = await fetch(request);
            if (response && response.ok) return response;
        } catch (_) {}

        const cachedOffline = await caches.match(
            OFFLINE_PAGE,
            { ignoreSearch: true }
        );

        return cachedOffline ||
            buildFallbackResponse(
                'offline',
                request.url,
                503
            );
    }

    try {
        const response = await fetch(request);

        if (response && response.ok) {
            cache.put(
                request,
                response.clone()
            )
                .then(pruneRuntimeCache)
                .catch(() => {});

            return response;
        }

        // Server có phản hồi nhưng trang đang lỗi:
        // ưu tiên bản cache tốt gần nhất nếu đã từng tải thành công.
        if (
            response.status === 404 ||
            response.status === 410 ||
            response.status >= 500
        ) {
            const cached = await cache.match(request);

            if (cached) {
                return cached;
            }

            return buildFallbackResponse(
                response.status === 404 ||
                response.status === 410
                    ? '404'
                    : 'server',
                request.url,
                response.status
            );
        }

        return response;
    } catch (error) {
        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        return buildFallbackResponse(
            'offline',
            request.url,
            503
        );
    }
}

async function networkFirstStatic(request) {
    const cache = await caches.open(RUNTIME_CACHE);

    try {
        const response = await fetch(request);

        if (response && response.ok) {
            cache.put(
                request,
                response.clone()
            )
                .then(pruneRuntimeCache)
                .catch(() => {});

            return response;
        }

        // 404/410/5xx không xóa khả năng dùng bản JS/CSS đã cache tốt.
        if (
            response &&
            (
                response.status === 404 ||
                response.status === 410 ||
                response.status >= 500
            )
        ) {
            const cached = await cache.match(request);

            if (cached) {
                return cached;
            }
        }

        return response;
    } catch (error) {
        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        throw error;
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    const networkPromise = fetch(request)
        .then(response => {
            if (response && response.ok) {
                cache.put(request, response.clone()).then(pruneRuntimeCache).catch(() => {});
            }
            return response;
        })
        .catch(() => null);

    if (cached) {
        // Trả cache ngay, đồng thời networkPromise âm thầm làm mới cache.
        return cached;
    }

    return (await networkPromise) || Response.error();
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Không can thiệp Firebase, Cloudflare R2, CDN hoặc API bên ngoài.
    // Dữ liệu đám mây phải luôn đi trực tiếp tới dịch vụ gốc.
    if (url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirstNavigation(request));
        return;
    }

    const destination = request.destination;

    if (destination === 'script' || destination === 'style' || destination === 'worker') {
        event.respondWith(networkFirstStatic(request));
        return;
    }

    if (destination === 'image' || destination === 'font') {
        event.respondWith(staleWhileRevalidate(request));
    }
});

self.addEventListener('message', event => {
    const type = event.data && event.data.type;

    if (type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }

    if (type === 'CLEAR_RUNTIME_CACHE') {
        event.waitUntil(caches.delete(RUNTIME_CACHE));
        return;
    }

    if (type === 'PING' && event.source) {
        event.source.postMessage({ type: 'PONG', cacheVersion: CACHE_VERSION });
    }
});
