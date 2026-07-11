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

            this.youtubeApiPromise = new Promise(
                (resolve, reject) => {
                    const oldCallback =
                        window.onYouTubeIframeAPIReady;

                    const timeout = setTimeout(() => {
                        reject(
                            new Error('YOUTUBE_API_TIMEOUT')
                        );
                    }, 15000);

                    window.onYouTubeIframeAPIReady =
                        function () {
                            try {
                                if (
                                    typeof oldCallback ===
                                    'function'
                                ) {
                                    oldCallback();
                                }
                            } finally {
                                clearTimeout(timeout);
                                resolve(window.YT);
                            }
                        };

                    const exists =
                        document.querySelector(
                            'script[src*="youtube.com/iframe_api"]'
                        );

                    if (!exists) {
                        const script =
                            document.createElement('script');

                        script.src =
                            'https://www.youtube.com/iframe_api';

                        script.async = true;

                        script.onerror = () => {
                            reject(
                                new Error(
                                    'YOUTUBE_API_LOAD_FAILED'
                                )
                            );
                        };

                        document.head.appendChild(script);
                    }
                }
            );

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
                        event.target.setVolume(
                            Math.round(
                                this.volume * 100
                            )
                        );

                        if (
                            this.shouldPlay &&
                            this.videoTokens.size === 0
                        ) {
                            event.target.playVideo();
                        }
                    },

                    onError: event => {
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
                } else if (
                    this.youtubePlayer &&
                    typeof this.youtubePlayer.playVideo === 'function'
                ) {
                    this.youtubePlayer.playVideo();
                } else if (
                    this.spotifyController &&
                    typeof this.spotifyController.resume === 'function'
                ) {
                    this.spotifyController.resume();
                } else if (
                    this.spotifyController &&
                    typeof this.spotifyController.play === 'function'
                ) {
                    this.spotifyController.play();
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
            };

            const retry = () => {
                cleanup();

                this.retryInstalled = false;
                this.userInteracted = true;

                if (
                    this.shouldPlay &&
                    this.videoTokens.size === 0
                ) {
                    this.playCurrent();
                }
            };

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
            this.currentItemId = '';
            this.currentUrl = '';
            this.sourceType = '';
            this.videoTokens.clear();
            this.generation++;

            this.destroyPlayer();
        }

        static destroyPlayer() {
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
    MusicManager.generation = 0;

    MusicManager.videoTokens = new Set();

    MusicManager.audioElement = null;
    MusicManager.youtubePlayer = null;
    MusicManager.spotifyController = null;
    MusicManager.playerHost = null;

    MusicManager.youtubeApiPromise = null;
    MusicManager.spotifyApiPromise = null;
    MusicManager.spotifyApi = null;

    MusicManager.retryInstalled = false;
    MusicManager.userInteracted = false;
    MusicManager.videoEventsInstalled = false;
    MusicManager.videoSequence = 0;

    window.MusicManager = MusicManager;
})();

MusicManager.installHtml5VideoEvents();