(function () {
    'use strict';

    if (window.MusicManager) {
        console.warn(
            '[MusicManager] File đã được nạp trước đó, bỏ qua lần nạp trùng.'
        );
        return;
    }
    // js/music-manager.js

    class MusicManager {
        static getItem(itemOrId) {
            if (itemOrId && typeof itemOrId === 'object') {
                return itemOrId;
            }

            if (
                typeof StoreManager !== 'undefined' &&
                typeof StoreManager.getItemById === 'function'
            ) {
                return StoreManager.getItemById(itemOrId);
            }

            return null;
        }

        static getUrl(item) {
            return String(
                item?.musicUrl ||
                item?.audioUrl ||
                ''
            ).trim();
        }

        static getSourceType(url) {
            const value = String(url || '').toLowerCase();

            if (
                value.includes('open.spotify.com/') ||
                value.startsWith('spotify:')
            ) {
                return 'spotify';
            }

            if (
                value.includes('youtube.com/') ||
                value.includes('youtu.be/')
            ) {
                return 'youtube';
            }

            if (value.includes('drive.google.com/')) {
                return 'drive';
            }

            return 'audio';
        }

        static getYouTubeId(rawUrl) {
            try {
                const url = new URL(rawUrl);

                if (url.hostname.includes('youtu.be')) {
                    return url.pathname
                        .split('/')
                        .filter(Boolean)[0] || '';
                }

                if (url.searchParams.get('v')) {
                    return url.searchParams.get('v');
                }

                const parts = url.pathname
                    .split('/')
                    .filter(Boolean);

                const index = parts.findIndex(part =>
                    ['embed', 'shorts', 'live'].includes(part)
                );

                return index >= 0
                    ? parts[index + 1] || ''
                    : '';
            } catch (error) {
                return '';
            }
        }

        static getDriveAudioUrl(rawUrl) {
            const pathMatch = String(rawUrl).match(
                /\/d\/([a-zA-Z0-9_-]+)/
            );

            let fileId = pathMatch ? pathMatch[1] : '';

            if (!fileId) {
                try {
                    fileId =
                        new URL(rawUrl).searchParams.get('id') || '';
                } catch (error) {
                    fileId = '';
                }
            }

            if (!fileId) return '';

            return (
                'https://drive.google.com/uc?export=download&id=' +
                encodeURIComponent(fileId)
            );
        }

        static async applyMusic(itemOrId) {
            const item = this.getItem(itemOrId);

            if (!item || item.type !== 'music') {
                return false;
            }

            const musicUrl = this.getUrl(item);

            if (!musicUrl) {
                alert(
                    `⚠️ Nhạc nền "${item.name}" chưa được cấu hình musicUrl.`
                );
                return false;
            }

            const sourceType =
                this.getSourceType(musicUrl);

            const sameMusic =
                this.currentItemId === item.id &&
                this.currentUrl === musicUrl &&
                this.sourceType === sourceType;

            this.shouldPlay = true;
            this.currentItemId = item.id;
            this.currentUrl = musicUrl;
            this.sourceType = sourceType;

            this.volume = Math.max(
                0,
                Math.min(
                    1,
                    Number(item.volume ?? 0.35)
                )
            );

            this.loop = item.loop !== false;
            this.hideFromMediaControls =
                item.hideFromMediaControls !== false;

            // Nếu đúng bài nhạc đang phát thì không tạo lại player
            if (sameMusic && this.hasPlayer()) {
                if (this.videoTokens.size === 0) {
                    await this.playCurrent();
                }

                return true;
            }

            this.generation++;
            const generation = this.generation;

            this.destroyPlayer();

            try {
                if (sourceType === 'youtube') {
                    await this.createYouTubePlayer(
                        musicUrl,
                        generation
                    );
                } else if (sourceType === 'spotify') {
                    await this.createSpotifyPlayer(
                        musicUrl,
                        generation
                    );
                } else {
                    const finalUrl =
                        sourceType === 'drive'
                            ? this.getDriveAudioUrl(musicUrl)
                            : musicUrl;

                    if (!finalUrl) {
                        throw new Error(
                            'DRIVE_LINK_INVALID'
                        );
                    }

                    this.createAudioPlayer(
                        finalUrl,
                        generation
                    );
                }

                if (
                    generation === this.generation &&
                    this.videoTokens.size === 0
                ) {
                    await this.playCurrent();
                }

                return true;
            } catch (error) {
                console.error(
                    '[MusicManager] Không phát được nhạc:',
                    error
                );

                this.destroyPlayer();
                this.shouldPlay = false;

                alert(
                    '❌ Không phát được nhạc. Kiểm tra link và quyền chia sẻ.'
                );

                return false;
            }
        }

        static createAudioPlayer(url, generation) {
            const audio = document.createElement('audio');

            audio.id = 'website-background-music';
            audio.src = url;
            audio.loop = this.loop;
            audio.volume = this.volume;
            audio.preload = 'auto';
            audio.style.display = 'none';
            audio.setAttribute('playsinline', '');

            audio.addEventListener('error', () => {
                if (generation !== this.generation) {
                    return;
                }

                console.error(
                    'Không tải được nguồn audio:',
                    audio.error
                );
            });

            document.body.appendChild(audio);
            this.audioElement = audio;
        }

        static loadYouTubeAPI() {
            if (
                window.YT &&
                typeof window.YT.Player === 'function'
            ) {
                return Promise.resolve(window.YT);
            }

            if (this.youtubeApiPromise) {
                return this.youtubeApiPromise;
            }

            /*
             * Không chiếm dụng window.onYouTubeIframeAPIReady vì trang còn có
             * player YouTube riêng cho video bài tập. Chỉ quan sát API chung.
             * Cách này tránh việc nhạc nền vô tình ghi đè callback của video.
             */
            this.youtubeApiPromise = new Promise(
                (resolve, reject) => {
                    let settled = false;
                    let pollTimer = null;
                    let timeoutTimer = null;

                    const isReady = () =>
                        Boolean(
                            window.YT &&
                            typeof window.YT.Player === 'function'
                        );

                    let script = document.querySelector(
                        'script[src*="youtube.com/iframe_api"]'
                    );

                    const cleanup = () => {
                        if (pollTimer) {
                            clearInterval(pollTimer);
                            pollTimer = null;
                        }

                        if (timeoutTimer) {
                            clearTimeout(timeoutTimer);
                            timeoutTimer = null;
                        }

                        if (script) {
                            script.removeEventListener(
                                'error',
                                handleScriptError
                            );
                        }
                    };

                    const finish = (error = null) => {
                        if (settled) return;
                        settled = true;
                        cleanup();

                        if (error) {
                            reject(error);
                        } else {
                            resolve(window.YT);
                        }
                    };

                    const checkReady = () => {
                        if (isReady()) {
                            finish();
                        }
                    };

                    const handleScriptError = () => {
                        finish(
                            new Error('YOUTUBE_API_LOAD_FAILED')
                        );
                    };

                    const shouldAppendScript = !script;

                    if (shouldAppendScript) {
                        script = document.createElement('script');
                        script.src =
                            'https://www.youtube.com/iframe_api';
                        script.async = true;
                        script.dataset.musicManagerInjected = '1';
                    }

                    script.addEventListener(
                        'error',
                        handleScriptError,
                        { once: true }
                    );

                    if (shouldAppendScript) {
                        document.head.appendChild(script);
                    }

                    pollTimer = setInterval(
                        checkReady,
                        80
                    );

                    timeoutTimer = setTimeout(() => {
                        finish(
                            new Error('YOUTUBE_API_TIMEOUT')
                        );
                    }, 12000);

                    checkReady();
                }
            ).catch(error => {
                /*
                 * Cho phép thử lại sau lỗi mạng tạm thời. Trước đây Promise bị
                 * reject rồi giữ mãi, khiến mọi lần bật lại nhạc đều thất bại
                 * cho đến khi tải lại toàn trang.
                 */
                this.youtubeApiPromise = null;
                throw error;
            });

            return this.youtubeApiPromise;
        }

        static async createYouTubePlayer(
            url,
            generation
        ) {
            const videoId = this.getYouTubeId(url);

            if (!videoId) {
                throw new Error(
                    'YOUTUBE_VIDEO_ID_INVALID'
                );
            }

            await this.loadYouTubeAPI();

            if (generation !== this.generation) {
                return;
            }

            this.youtubeReady = false;

            const host = document.createElement('div');

            host.style.cssText = `
            position: fixed;
            left: -10000px;
            top: 0;
            width: 200px;
            height: 200px;
            opacity: 0;
            pointer-events: none;
        `;

            document.body.appendChild(host);
            this.playerHost = host;

            this.youtubePlayer = new YT.Player(host, {
                width: 200,
                height: 200,
                videoId: videoId,

                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    playsinline: 1,
                    loop: this.loop ? 1 : 0,
                    playlist: this.loop
                        ? videoId
                        : undefined,

                    ...(window.location.origin !== 'null'
                        ? { origin: window.location.origin }
                        : {})
                },

                events: {
                    onReady: event => {
                        if (generation !== this.generation) {
                            return;
                        }

                        this.youtubeReady = true;

                        event.target.setVolume(
                            Math.round(
                                this.volume * 100
                            )
                        );

                        /*
                         * Đi qua playCurrent() để mọi trình duyệt đều dùng chung
                         * kiểm tra tương tác người dùng. Không tự autoplay riêng
                         * trong callback YouTube.
                         */
                        this.playCurrent();
                    },

                    onStateChange: event => {
                        if (generation !== this.generation) {
                            return;
                        }

                        // 1 = PLAYING. Chỉ khi YouTube xác nhận thật sự đang phát
                        // mới gỡ listener thử lại bằng thao tác người dùng.
                        if (event.data === 1) {
                            this.youtubeIsPlaying = true;
                            this.clearRetryAfterUserClick();
                            this.startMediaSessionSuppression();
                            return;
                        }

                        this.youtubeIsPlaying = false;

                        // YouTube có thể chặn playVideo() im lặng trên Safari/WebView.
                        // Khi nhạc vẫn cần phát và không có video web đang chiếm âm thanh,
                        // giữ một lần thử lại ở thao tác người dùng kế tiếp.
                        if (
                            this.shouldPlay &&
                            this.videoTokens.size === 0 &&
                            (event.data === -1 || event.data === 2 || event.data === 5)
                        ) {
                            this.retryAfterUserClick();
                        }
                    },

                    onError: event => {
                        this.youtubeIsPlaying = false;
                        console.error(
                            'Lỗi nhạc YouTube:',
                            event.data
                        );
                    }
                }
            });
        }

        static loadSpotifyAPI() {
            if (this.spotifyApi) {
                return Promise.resolve(
                    this.spotifyApi
                );
            }

            if (this.spotifyApiPromise) {
                return this.spotifyApiPromise;
            }

            this.spotifyApiPromise = new Promise(
                (resolve, reject) => {
                    const oldCallback =
                        window.onSpotifyIframeApiReady;

                    const timeout = setTimeout(() => {
                        reject(
                            new Error(
                                'SPOTIFY_API_TIMEOUT'
                            )
                        );
                    }, 15000);

                    window.onSpotifyIframeApiReady =
                        api => {
                            try {
                                if (
                                    typeof oldCallback ===
                                    'function'
                                ) {
                                    oldCallback(api);
                                }
                            } finally {
                                clearTimeout(timeout);

                                this.spotifyApi = api;
                                resolve(api);
                            }
                        };

                    const exists =
                        document.querySelector(
                            'script[src*="open.spotify.com/embed/iframe-api"]'
                        );

                    if (!exists) {
                        const script =
                            document.createElement('script');

                        script.src =
                            'https://open.spotify.com/embed/iframe-api/v1';

                        script.async = true;

                        script.onerror = () => {
                            reject(
                                new Error(
                                    'SPOTIFY_API_LOAD_FAILED'
                                )
                            );
                        };

                        document.head.appendChild(script);
                    }
                }
            );

            return this.spotifyApiPromise;
        }

        static async createSpotifyPlayer(
            url,
            generation
        ) {
            const api = await this.loadSpotifyAPI();

            if (generation !== this.generation) {
                return;
            }

            const host = document.createElement('div');

            host.style.cssText = `
            position: fixed;
            left: -10000px;
            top: 0;
            width: 300px;
            height: 80px;
            opacity: 0;
            pointer-events: none;
        `;

            document.body.appendChild(host);
            this.playerHost = host;

            await new Promise(resolve => {
                api.createController(
                    host,
                    {
                        url: url,
                        width: 300,
                        height: 80
                    },
                    controller => {
                        if (
                            generation !==
                            this.generation
                        ) {
                            if (
                                typeof controller.destroy ===
                                'function'
                            ) {
                                controller.destroy();
                            }

                            resolve();
                            return;
                        }

                        this.spotifyController =
                            controller;

                        resolve();
                    }
                );
            });
        }

        static clearPageMediaSession() {
            if (!('mediaSession' in navigator)) {
                return;
            }

            try {
                navigator.mediaSession.metadata = null;
            } catch (_) { }

            try {
                navigator.mediaSession.playbackState = 'none';
            } catch (_) { }

            [
                'play',
                'pause',
                'stop',
                'seekbackward',
                'seekforward',
                'seekto',
                'previoustrack',
                'nexttrack'
            ].forEach(action => {
                try {
                    navigator.mediaSession.setActionHandler(
                        action,
                        null
                    );
                } catch (_) { }
            });
        }

        static startMediaSessionSuppression() {
            if (
                this.hideFromMediaControls !== true ||
                !this.shouldPlay ||
                this.videoTokens.size > 0
            ) {
                return;
            }

            this.clearPageMediaSession();

            if (this.mediaSessionSuppressionTimer) {
                return;
            }

            /*
             * Best-effort: trang top-level liên tục xóa Media Session trong khi
             * NHẠC NỀN phát. YouTube iframe là cross-origin nên trình duyệt vẫn
             * có quyền tự tạo Media Controls trên một số nền tảng; web không có
             * API chuẩn để ép ẩn 100% trường hợp đó.
             */
            this.mediaSessionSuppressionTimer = setInterval(() => {
                if (
                    this.hideFromMediaControls === true &&
                    this.shouldPlay &&
                    this.videoTokens.size === 0
                ) {
                    this.clearPageMediaSession();
                } else {
                    this.stopMediaSessionSuppression(false);
                }
            }, 1000);
        }

        static stopMediaSessionSuppression(clearNow = false) {
            if (this.mediaSessionSuppressionTimer) {
                clearInterval(
                    this.mediaSessionSuppressionTimer
                );
                this.mediaSessionSuppressionTimer = null;
            }

            if (clearNow) {
                this.clearPageMediaSession();
            }
        }

        static hasPlayer() {
            return Boolean(
                this.audioElement ||
                this.youtubePlayer ||
                this.spotifyController
            );
        }

        static async playCurrent() {
            if (
                !this.shouldPlay ||
                this.videoTokens.size > 0
            ) {
                return;
            }

            const userActivated =
                this.userInteracted === true ||
                window.__studentMusicUserActivated === true ||
                (
                    navigator.userActivation &&
                    navigator.userActivation.hasBeenActive === true
                );

            // Chưa tương tác thì chưa gọi play() để tránh NotAllowedError
            if (!userActivated) {
                this.retryAfterUserClick();
                return;
            }

            try {
                if (this.audioElement) {
                    await this.audioElement.play();
                    this.startMediaSessionSuppression();
                } else if (
                    this.youtubePlayer &&
                    this.youtubeReady === true &&
                    typeof this.youtubePlayer.playVideo === 'function'
                ) {
                    this.youtubePlayer.playVideo();
                    this.startMediaSessionSuppression();

                    /*
                     * YouTube IFrame API không trả Promise và trên một số Safari/
                     * WebView lệnh playVideo() bị chặn mà không throw NotAllowedError.
                     * Giữ retry cho tới khi onStateChange xác nhận PLAYING.
                     */
                    if (this.youtubeIsPlaying !== true) {
                        this.retryAfterUserClick();
                    }
                } else if (
                    this.spotifyController &&
                    typeof this.spotifyController.resume === 'function'
                ) {
                    this.spotifyController.resume();
                    this.startMediaSessionSuppression();
                } else if (
                    this.spotifyController &&
                    typeof this.spotifyController.play === 'function'
                ) {
                    this.spotifyController.play();
                    this.startMediaSessionSuppression();
                } else {
                    // Player/API chưa sẵn sàng: đừng đánh mất thao tác người dùng.
                    this.retryAfterUserClick();
                }
            } catch (error) {
                if (error && error.name === 'NotAllowedError') {
                    this.retryAfterUserClick();
                    return;
                }

                console.error(
                    '[MusicManager] Lỗi phát nhạc:',
                    error
                );
            }
        }

        static pauseCurrent() {
            if (this.audioElement) {
                this.audioElement.pause();
            }

            if (
                this.youtubePlayer &&
                typeof this.youtubePlayer.pauseVideo ===
                'function'
            ) {
                this.youtubePlayer.pauseVideo();
            }

            if (
                this.spotifyController &&
                typeof this.spotifyController.pause ===
                'function'
            ) {
                this.spotifyController.pause();
            }
        }

        static clearRetryAfterUserClick() {
            if (typeof this.retryCleanup === 'function') {
                try {
                    this.retryCleanup();
                } catch (_) { }
            }

            this.retryCleanup = null;
            this.retryInstalled = false;
        }

        static retryAfterUserClick() {
            if (this.retryInstalled) return;

            this.retryInstalled = true;

            const eventNames = [
                'pointerdown',
                'click',
                'keydown',
                'touchstart'
            ];

            const cleanup = () => {
                eventNames.forEach(eventName => {
                    document.removeEventListener(
                        eventName,
                        retry,
                        true
                    );
                });

                if (this.retryCleanup === cleanup) {
                    this.retryCleanup = null;
                }
            };

            const retry = () => {
                cleanup();

                this.retryInstalled = false;
                this.userInteracted = true;
                window.__studentMusicUserActivated = true;

                if (
                    this.shouldPlay &&
                    this.videoTokens.size === 0
                ) {
                    // Nếu player chưa sẵn sàng, playCurrent() sẽ tự cài lại listener
                    // cho thao tác kế tiếp; nếu đã sẵn sàng, thao tác hiện tại chính là
                    // gesture hợp lệ để Safari/WebView cho phép phát âm thanh.
                    this.playCurrent();
                }
            };

            this.retryCleanup = cleanup;

            eventNames.forEach(eventName => {
                document.addEventListener(
                    eventName,
                    retry,
                    true
                );
            });
        }

        static stopMusic() {
            this.shouldPlay = false;
            this.clearRetryAfterUserClick();
            this.stopMediaSessionSuppression(true);
            this.currentItemId = '';
            this.currentUrl = '';
            this.sourceType = '';
            this.videoTokens.clear();
            this.generation++;

            this.destroyPlayer();
        }

        static destroyPlayer() {
            this.stopMediaSessionSuppression(false);

            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement.removeAttribute('src');
                this.audioElement.load();
                this.audioElement.remove();
                this.audioElement = null;
            }

            try {
                if (
                    this.youtubePlayer &&
                    typeof this.youtubePlayer.destroy ===
                    'function'
                ) {
                    this.youtubePlayer.destroy();
                }
            } catch (error) {
                console.warn(error);
            }

            try {
                if (
                    this.spotifyController &&
                    typeof this.spotifyController.destroy ===
                    'function'
                ) {
                    this.spotifyController.destroy();
                }
            } catch (error) {
                console.warn(error);
            }

            this.youtubePlayer = null;
            this.youtubeReady = false;
            this.youtubeIsPlaying = false;
            this.spotifyController = null;

            if (this.playerHost) {
                this.playerHost.remove();
            }

            this.playerHost = null;
        }

        static pauseForVideo(
            token = 'website-video'
        ) {
            const key = String(token);
            const wasEmpty =
                this.videoTokens.size === 0;

            this.videoTokens.add(key);

            if (wasEmpty && this.shouldPlay) {
                // Nhường Media Session cho video thật của website.
                this.stopMediaSessionSuppression(false);
                this.pauseCurrent();
            }
        }

        static resumeAfterVideo(
            token = 'website-video'
        ) {
            this.videoTokens.delete(
                String(token)
            );

            if (
                this.videoTokens.size === 0 &&
                this.shouldPlay
            ) {
                this.playCurrent();
            }
        }

        static handleYouTubeVideoState(
            token,
            state
        ) {
            // YouTube: 1 = đang phát
            if (state === 1) {
                this.pauseForVideo(token);
                return;
            }

            // 0 = kết thúc
            // 2 = tạm dừng
            // 5 = đã tải sẵn nhưng chưa phát
            if (
                state === 0 ||
                state === 2 ||
                state === 5
            ) {
                this.resumeAfterVideo(token);
            }
        }

        static installHtml5VideoEvents() {
            if (this.videoEventsInstalled) {
                return;
            }

            this.videoEventsInstalled = true;

            const getToken = video => {
                if (
                    !video.dataset.musicVideoToken
                ) {
                    this.videoSequence++;

                    video.dataset.musicVideoToken =
                        `html5-video:${this.videoSequence}`;
                }

                return video.dataset.musicVideoToken;
            };

            document.addEventListener(
                'play',
                event => {
                    if (
                        event.target instanceof
                        HTMLVideoElement
                    ) {
                        this.pauseForVideo(
                            getToken(event.target)
                        );
                    }
                },
                true
            );

            const releaseVideo = event => {
                if (
                    event.target instanceof
                    HTMLVideoElement
                ) {
                    this.resumeAfterVideo(
                        getToken(event.target)
                    );
                }
            };

            document.addEventListener(
                'pause',
                releaseVideo,
                true
            );

            document.addEventListener(
                'ended',
                releaseVideo,
                true
            );

            document.addEventListener(
                'emptied',
                releaseVideo,
                true
            );
        }
    }

    MusicManager.currentItemId = '';
    MusicManager.currentUrl = '';
    MusicManager.sourceType = '';
    MusicManager.shouldPlay = false;
    MusicManager.volume = 0.35;
    MusicManager.loop = true;
    MusicManager.hideFromMediaControls = true;
    MusicManager.mediaSessionSuppressionTimer = null;
    MusicManager.generation = 0;

    MusicManager.videoTokens = new Set();

    MusicManager.audioElement = null;
    MusicManager.youtubePlayer = null;
    MusicManager.youtubeReady = false;
    MusicManager.youtubeIsPlaying = false;
    MusicManager.spotifyController = null;
    MusicManager.playerHost = null;

    MusicManager.youtubeApiPromise = null;
    MusicManager.spotifyApiPromise = null;
    MusicManager.spotifyApi = null;

    MusicManager.retryInstalled = false;
    MusicManager.retryCleanup = null;
    MusicManager.userInteracted =
        window.__studentMusicUserActivated === true;
    MusicManager.videoEventsInstalled = false;
    MusicManager.videoSequence = 0;

    window.MusicManager = MusicManager;
})();

window.MusicManager.installHtml5VideoEvents();