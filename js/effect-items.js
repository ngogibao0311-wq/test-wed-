// js/effect-items.js
const IS_MOBILE_EFFECT = window.matchMedia(
    '(max-width: 768px), (pointer: coarse)'
).matches;

class EffectManager {
    static getViewport() {
        const visualViewport = window.visualViewport;

        const width =
            visualViewport?.width ||
            document.documentElement.clientWidth ||
            window.innerWidth;

        const height =
            visualViewport?.height ||
            document.documentElement.clientHeight ||
            window.innerHeight;

        return {
            width: Math.max(1, width),
            height: Math.max(1, height),
            offsetLeft: visualViewport?.offsetLeft || 0,
            offsetTop: visualViewport?.offsetTop || 0
        };
    }

    static setTopSpawnPosition(element, padding = 12) {
        const viewport = this.getViewport();

        const usableWidth = Math.max(
            1,
            viewport.width - padding * 2
        );

        const x =
            viewport.offsetLeft +
            padding +
            Math.random() * usableWidth;

        element.style.left = `${Math.round(x)}px`;
        element.style.top =
            `${Math.round(viewport.offsetTop - 60)}px`;
    }

    static setRandomScreenPosition(element, padding = 12) {
        const viewport = this.getViewport();

        const usableWidth = Math.max(
            1,
            viewport.width - padding * 2
        );

        const usableHeight = Math.max(
            1,
            viewport.height - padding * 2
        );

        element.style.left =
            `${Math.round(
                viewport.offsetLeft +
                padding +
                Math.random() * usableWidth
            )}px`;

        element.style.top =
            `${Math.round(
                viewport.offsetTop +
                padding +
                Math.random() * usableHeight
            )}px`;
    }

    static setShootingStarPosition(element) {
        const viewport = this.getViewport();

        /*
         * Sao bắt đầu từ vùng trên và giữa màn hình.
         * Không để lệch quá xa ra ngoài như -20vw.
         */
        const minX = viewport.offsetLeft - 20;
        const maxX =
            viewport.offsetLeft +
            viewport.width * 0.78;

        const minY = viewport.offsetTop - 50;
        const maxY =
            viewport.offsetTop +
            viewport.height * 0.38;

        element.style.left =
            `${Math.round(
                minX + Math.random() * (maxX - minX)
            )}px`;

        element.style.top =
            `${Math.round(
                minY + Math.random() * (maxY - minY)
            )}px`;
    }
    static get container() {
        return document.getElementById('global-effect-container');
    }
    static currentInterval = null;
    static shootingStarInterval = null;

    static stopIntervals() {
        if (this.currentInterval !== null) {
            clearInterval(this.currentInterval);
            this.currentInterval = null;
        }

        if (this.shootingStarInterval !== null) {
            clearInterval(this.shootingStarInterval);
            this.shootingStarInterval = null;
        }
    }

    static clearEffects(removeSavedEffect = false) {
        this.stopIntervals();

        if (this.container) {
            const children = Array.from(
                this.container.children
            );

            children.forEach(child => {
                if (child.dataset.isClearing) {
                    child.remove();
                    return;
                }

                child.dataset.isClearing = 'true';
                child.style.animation = 'none';
                child.style.transition =
                    'opacity 0.3s ease-out';
                child.style.opacity = '0';

                setTimeout(() => {
                    if (child?.parentNode) {
                        child.remove();
                    }
                }, 300);
            });
        }

        if (removeSavedEffect) {
            localStorage.removeItem('active_effect');
        }
    }

    static applyEffect(effectId) {
        this.clearEffects();
        if (!this.container) return;

        switch (effectId) {
            case 'effect_snow':
                this.createSnowEffect();
                break;
            case 'effect_cotich': // Thêm case kích hoạt hiệu ứng Bụi Phép Thuật
                this.createFairyDust();
                break;
            case 'effect_cotich_firefly':
                this.createFireflyEffect();
                break;
            case 'effect_doisong_laroi': // Thêm case kích hoạt hiệu ứng Lá Rơi
                this.createFallingLeavesEffect();
                break;
            case 'effect_bandem_tinhthu':
                this.createNightSkyEffect();
                break;
            case 'effect_banngay_bautroi':
                this.createSummerSkyEffect();
                break;
            case 'effect_cotich_tinhlinh':
                this.createFairyRainEffect();
                break;
            case 'effect_truyenthuyet_vutru':
                this.createGalaxyLegendEffect();
                break;
            case 'effect_vutru_saothuy':
                this.createMercuryRainEffect();
                break;
            case 'effect_cosmic_dust':
                this.createCosmicDustEffect();
                break;
            case 'effect_truyenthuyet_nganha':
                this.createGalaxyGuardianEffect();
                break;
            case 'effect_lotm_amon':
                this.createAmonTimeEffect();
                break;
            case 'effect_truyenthuyet_nyx_domain':
                this.createNyxDomainEffect();
                break;
            case 'effect_cotich_bot_ngoc_mong':
                this.createPearlDreamEffect();
                break;
            case 'effect_doraemon_school_memories':
                this.createDoraemonSchoolMemoriesEffect();
                break;
            case 'effect_hoihoa_living_canvas':
                this.createEnchantedAtelierEffect();
                break;
        }
        localStorage.setItem('active_effect', effectId);
    }

    static createSnowEffect() {
        this.stopIntervals();
        this.currentInterval = setInterval(() => {
            const snowflake = document.createElement('div');
            snowflake.classList.add('effect-snowflake');
            snowflake.innerHTML = '❄';
            snowflake.style.left = Math.random() * 100 + 'vw';
            snowflake.style.animationDuration = Math.random() * 3 + 2 + 's'; // 2-5s
            snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';

            this.container.appendChild(snowflake);

            setTimeout(() => {
                snowflake.remove();
            }, 5000);
        }, IS_MOBILE_EFFECT ? 600 : 300);
    }

    static createFairyDust() {
        this.stopIntervals();
        this.currentInterval = setInterval(() => {
            const particle = document.createElement('div');
            particle.classList.add('fairy-dust');

            // TĂNG KÍCH THƯỚC: Random từ 5px đến 12px (to và dễ nhìn hơn rất nhiều)
            let size = Math.random() * 7 + 5;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            this.setRandomScreenPosition(particle, 10);

            let duration = Math.random() * 4 + 4;
            particle.style.animationDuration = duration + 's';

            this.container.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, duration * 1000);

        }, IS_MOBILE_EFFECT ? 500 : 200); // Đẩy tốc độ sinh hạt lên (0.2s/hạt) để hiệu ứng nhìn rõ ràng hơn
    }

    static createFireflyEffect() {
        this.stopIntervals();
        this.currentInterval = setInterval(() => {
            const firefly = document.createElement('div');
            firefly.classList.add('fairy-firefly');

            // Kích thước ngẫu nhiên từ 3px đến 7px để tạo chiều sâu (con to con nhỏ)
            let size = Math.random() * 4 + 3;
            firefly.style.width = `${size}px`;
            firefly.style.height = `${size}px`;

            // Vị trí xuất phát ngẫu nhiên theo chiều ngang màn hình
            firefly.style.left = Math.random() * 100 + 'vw';

            // Thời gian bay ngẫu nhiên từ chậm đến vừa (8s - 14s)
            let duration = Math.random() * 6 + 8;
            firefly.style.animationDuration = duration + 's';

            this.container.appendChild(firefly);

            // Dọn dẹp thẻ div sau khi bay ra khỏi màn hình
            setTimeout(() => {
                firefly.remove();
            }, duration * 1000);

        }, IS_MOBILE_EFFECT ? 700 : 350); // Tốc độ sinh đom đóm (0.35s/con)
    }

    static createFallingLeavesEffect() {
        this.stopIntervals();
        // Mảng chứa các class đại diện cho các màu lá khác nhau
        const leafClasses = ['leaf-green', 'leaf-autumn', 'leaf-yellow', 'leaf-orange'];

        this.currentInterval = setInterval(() => {
            const leaf = document.createElement('div');
            leaf.classList.add('effect-leaf-css'); // Class gốc

            // Lấy ngẫu nhiên màu lá
            const randomType = leafClasses[Math.floor(Math.random() * leafClasses.length)];
            leaf.classList.add(randomType);

            // Vị trí xuất phát ngẫu nhiên
            leaf.style.left = Math.random() * 100 + 'vw';

            // Thời gian rơi ngẫu nhiên từ 5s - 9s để nhìn bay bổng hơn
            let duration = Math.random() * 4 + 5;
            leaf.style.animationDuration = duration + 's';

            // Tạo kích thước ngẫu nhiên (tạo độ sâu trường ảnh)
            let scale = Math.random() * 0.6 + 0.6; // Scale từ 0.6 đến 1.2
            leaf.style.setProperty('--leaf-scale', scale); // Truyền vào CSS biến --leaf-scale

            this.container.appendChild(leaf);

            // Dọn dẹp
            setTimeout(() => {
                leaf.remove();
            }, duration * 1000);

        }, IS_MOBILE_EFFECT ? 700 : 350); // Nhịp độ sinh lá (0.35s / lá)
    }

    static createNightSkyEffect() {
        this.stopIntervals();
        // 1. Tạo lớp màn đêm phủ tối toàn trang web
        const darkOverlay = document.createElement('div');
        darkOverlay.classList.add('night-sky-overlay');
        this.container.appendChild(darkOverlay);

        // 2. Tạo các vì sao
        this.currentInterval = setInterval(() => {
            const star = document.createElement('div');
            star.classList.add('effect-night-star');

            star.style.left = Math.random() * 100 + 'vw';
            star.style.top = Math.random() * 100 + 'vh';

            // Đã tăng kích thước lõi sao lên to hơn (3px - 6px) để nhìn rõ hơn xíu
            let size = Math.random() * 3 + 3;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;

            let duration = Math.random() * 3 + 3;
            star.style.animationDuration = duration + 's';

            this.container.appendChild(star);

            setTimeout(() => {
                star.remove();
            }, duration * 1000);
        }, 350); // Tăng tốc độ xuất hiện một xíu (từ 400ms xuống 350ms)
    }

    static createSummerSkyEffect() {
        this.stopIntervals();
        // 1. Tạo vầng tia sáng quét từ trên xuống (God Rays)
        const godRays = document.createElement('div');
        godRays.classList.add('effect-god-rays');
        this.container.appendChild(godRays);

        // 2. Dùng 1 bộ đếm chung để quản lý thời gian sinh Mây và Chim
        let tick = 0;
        this.currentInterval = setInterval(() => {
            tick++;

            // Cứ mỗi 4 giây sẽ sinh ra một đám mây trôi từ trái sang phải
            if (tick % 4 === 0) {
                const cloud = document.createElement('div');
                cloud.classList.add('effect-daylight-cloud');
                cloud.innerHTML = '☁️';

                // Đám mây chỉ trôi ở nửa trên bầu trời (0vh -> 40vh)
                cloud.style.top = Math.random() * 40 + 'vh';

                // Tốc độ trôi ngẫu nhiên từ chậm đến rất chậm (15s - 30s)
                let duration = Math.random() * 15 + 15;
                cloud.style.animationDuration = duration + 's';

                // Kích thước và độ mờ ngẫu nhiên tạo chiều sâu
                let scale = Math.random() * 1.5 + 1;
                cloud.style.fontSize = (scale * 30) + 'px';
                cloud.style.opacity = Math.random() * 0.5 + 0.3;

                this.container.appendChild(cloud);
                setTimeout(() => cloud.remove(), duration * 1000);
            }

            // Cứ mỗi 9 giây sẽ sinh ra một chú chim bay ngang qua
            if (tick % 9 === 0) {
                const bird = document.createElement('div');
                bird.classList.add('effect-daylight-bird');
                bird.innerHTML = '🕊️';
                bird.style.top = Math.random() * 50 + 10 + 'vh';

                // Chim bay nhanh hơn mây (7s - 12s)
                let duration = Math.random() * 5 + 7;
                // Gắn 2 animation: 1 cái tiến về trước, 1 cái nhấp nhô
                bird.style.animation = `flyBirdAcross ${duration}s linear forwards, birdBobbing 1.5s ease-in-out infinite alternate`;
                bird.style.fontSize = (Math.random() * 10 + 20) + 'px';

                this.container.appendChild(bird);
                setTimeout(() => bird.remove(), duration * 1000);
            }

        }, 1000); // Mỗi giây quét 1 lần
    }

    static createFairyRainEffect() {
        this.stopIntervals();
        this.currentInterval = setInterval(() => {
            const particle = document.createElement('div');
            // Gọi đúng class CSS đã có trong file store-items.css
            particle.classList.add('effect-cotich-tinhlinh');

            // Random vị trí xuất phát theo chiều ngang
            this.setTopSpawnPosition(particle, 12);

            const viewport = this.getViewport();

            particle.style.setProperty(
                '--fairy-fall-distance',
                `${Math.round(viewport.height + 120)}px`
            );

            // Random kích thước hạt (từ 4px đến 8px) để tạo chiều sâu 3D
            let size = Math.random() * 4 + 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            // Random tốc độ rơi (từ 5s đến 8s) để rơi tự nhiên, dập dềnh
            let duration = Math.random() * 3 + 5;
            particle.style.animationDuration = duration + 's';

            this.container.appendChild(particle);

            // Xóa hạt sau khi rơi xong để không làm nặng web
            setTimeout(() => {
                particle.remove();
            }, duration * 1000);

        }, IS_MOBILE_EFFECT ? 500 : 200); // Tốc độ sinh hạt: 0.2s tạo ra 1 hạt
    }

    static createGalaxyLegendEffect() {
        this.stopIntervals();
        if (!this.container) return;

        // Tạo bộ khung cấu trúc vật thể tinh hệ - 100% hình ảnh điều khiển bởi CSS bên dưới
        this.container.innerHTML = `
            <div class="cosmic-nebula-core"></div>
            <div class="cosmic-celestial-engine">
                <div class="cosmic-orbit-ring ring-primary"></div>
                <div class="cosmic-orbit-ring ring-secondary"></div>

                <div class="mythic-constellation constellation-alpha">
                    <div class="const-star c-star-1"></div>
                    <div class="const-star c-star-2"></div>
                    <div class="const-star c-star-3"></div>
                </div>
                <div class="mythic-constellation constellation-beta">
                    <div class="const-star c-star-1"></div>
                    <div class="const-star c-star-2"></div>
                </div>

                <div class="cosmic-glowing-planet planet-galaxy-purple">
                    <div class="planet-sphere"></div>
                    <div class="planet-planetary-ring"></div>
                </div>

                <div class="cosmic-glowing-planet planet-galaxy-cyan">
                    <div class="planet-sphere"></div>
                    <div class="planet-planetary-ring"></div>
                </div>

                <div class="cinematic-comet comet-v1"></div>
                <div class="cinematic-comet comet-v2"></div>
                <div class="cinematic-comet comet-v3"></div>

                <div class="pure-css-cosmic-dust">
                    <span></span><span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span><span></span>
                </div>
            </div>
        `;
    }

    static createMercuryRainEffect() {
        this.stopIntervals();
        this.currentInterval = setInterval(() => {
            const crystal = document.createElement('div');
            crystal.classList.add('effect-mercury-crystal');

            // Xuất phát ngẫu nhiên ở mép trên màn hình
            this.setTopSpawnPosition(crystal, 10);

            // Kích thước ngẫu nhiên để tạo cảm giác vệt dài vệt ngắn
            let width = Math.random() * 2 + 2;
            let height = Math.random() * 15 + 15;
            crystal.style.width = `${width}px`;
            crystal.style.height = `${height}px`;

            // Tốc độ rơi từ 3s đến 6s
            let duration = Math.random() * 3 + 3;
            crystal.style.animationDuration = duration + 's';
            const viewport = this.getViewport();

            const driftDistance = Math.min(
                110,
                viewport.width * 0.22
            );

            crystal.style.setProperty(
                '--mercury-fall-distance',
                `${Math.round(viewport.height + 130)}px`
            );

            crystal.style.setProperty(
                '--mercury-drift-distance',
                `${Math.round(-driftDistance)}px`
            );

            this.container.appendChild(crystal);

            // Dọn dẹp sau khi hạt rơi xong
            setTimeout(() => {
                crystal.remove();
            }, duration * 1000);

        }, 150); // Mỗi 0.15s sinh ra 1 vệt tinh thể
    }

    static createCosmicDustEffect() {
        this.stopIntervals();
        // 1. Sinh hạt Bụi Tinh Vân (Sáng hơn, to hơn, bay nhanh hơn)
        this.currentInterval = setInterval(() => {
            const dust = document.createElement('div');
            dust.classList.add('effect-cosmic-dust-particle');

            // Xuất phát ngẫu nhiên ở trục ngang, bắt đầu từ sát mép dưới màn hình
            dust.style.left = Math.random() * 100 + 'vw';
            dust.style.bottom = '-5vh';

            // Tăng kích thước (từ 3px đến 8px)
            const size = Math.random() * 5 + 3;
            dust.style.width = `${size}px`;
            dust.style.height = `${size}px`;

            const colors = ['#ec4899', '#06b6d4', '#8b5cf6', '#ffffff'];
            const chosenColor = colors[Math.floor(Math.random() * colors.length)];
            dust.style.background = chosenColor;
            // Tăng quầng sáng (Glow) lên gấp 3 lần
            dust.style.boxShadow = `0 0 ${size * 3}px ${chosenColor}`;

            // Tốc độ bay ngẫu nhiên (5s đến 9s)
            const duration = Math.random() * 4 + 5;
            dust.style.animationDuration = `${duration}s`;

            this.container.appendChild(dust);

            setTimeout(() => {
                if (dust.parentNode) dust.remove();
            }, duration * 1000);
        }, 100); // Tăng tốc độ đẻ hạt (0.1s tạo 1 hạt)

        // 2. Vệt Sao Băng
        this.shootingStarInterval = setInterval(() => {
            const star = document.createElement('div');
            star.classList.add('nyx-domain-shooting-star');

            // CẬP NHẬT: Random mạnh cả tọa độ ngang và dọc để sao rơi rải rác khắp nơi
            this.setShootingStarPosition(star); // Xuất phát lùi sâu ra ngoài màn hình

            // Tốc độ sao băng xẹt (1s - 2s)
            const starDuration = Math.random() * 1 + 1;
            star.style.animationDuration = `${starDuration}s`;

            this.container.appendChild(star);

            setTimeout(() => {
                if (star.parentNode) star.remove();
            }, starDuration * 1000);
        }, 3000); // Cứ 3 giây xẹt 1 lần
    }

    static createGalaxyGuardianEffect() {
        this.stopIntervals();
        if (!this.container) return;

        // 1. Tạo lớp Cực quang vũ trụ làm nền (Chỉ sinh 1 lần)
        const aurora = document.createElement('div');
        aurora.classList.add('effect-guardian-aurora-bg');
        this.container.appendChild(aurora);

        // 2. Tạo Sóng Hấp Dẫn (Vòng tròn lan rộng)
        this.currentInterval = setInterval(() => {
            const ripple = document.createElement('div');
            ripple.classList.add('effect-guardian-ripple');

            // Xuất hiện ngẫu nhiên trên màn hình
            ripple.style.left = Math.random() * 100 + 'vw';
            ripple.style.top = Math.random() * 100 + 'vh';

            this.container.appendChild(ripple);

            setTimeout(() => {
                if (ripple.parentNode) ripple.remove();
            }, 4000); // Sống trong 4s để lan rộng hết cỡ
        }, 1500); // Cứ 1.5s tạo 1 gợn sóng

        // 3. Tận dụng interval thứ 2 để tạo Vết nứt thời không (Spatial Rifts)
        // Mình dùng biến this.shootingStarInterval có sẵn của hệ thống bạn để dễ clear
        this.shootingStarInterval = setInterval(() => {
            const rift = document.createElement('div');
            rift.classList.add('effect-guardian-rift');

            // Vết nứt tập trung ở giữa màn hình hơn một chút
            rift.style.left = (Math.random() * 80 + 10) + 'vw';
            rift.style.top = (Math.random() * 80 + 10) + 'vh';

            // Xoay vết nứt theo các góc chéo ngẫu nhiên
            let angle = Math.random() * 180;
            rift.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

            this.container.appendChild(rift);

            setTimeout(() => {
                if (rift.parentNode) rift.remove();
            }, 2500); // Xé rách và khép lại trong 2.5s
        }, 3500); // Lâu lâu (3.5s) mới bị rách không gian 1 lần
    }

    static createAmonTimeEffect() {
        this.stopIntervals();
        if (!this.container) return;

        // NGHỊCH LÝ KÝ SINH — Miền đánh cắp danh tính.
        // Không dùng lại kính một tròng hoặc đàn quạ cũ.
        const domain = document.createElement('div');
        domain.className = 'amon-paradox-domain';

        const hasAmon = Boolean(document.querySelector('.amon-time-magic'));
        const hasSefirah = document.body.classList.contains('theme-lotm-mysteries');

        if (hasAmon || hasSefirah) {
            domain.classList.add('amon-paradox-resonance');
        }

        domain.innerHTML = `
        <div class="amon-paradox-void"></div>
        <div class="amon-paradox-horizon"></div>

        <div class="amon-paradox-cathedral">
            <div class="amon-paradox-spire spire-left"></div>
            <div class="amon-paradox-spire spire-right"></div>

            <div class="amon-paradox-iris">
                <span class="iris-ring iris-ring-a"></span>
                <span class="iris-ring iris-ring-b"></span>
                <span class="iris-ring iris-ring-c"></span>
                <span class="iris-pupil"></span>
            </div>

            <div class="amon-paradox-stairway"></div>
        </div>

        <div class="amon-paradox-counterfeit counterfeit-one"></div>
        <div class="amon-paradox-counterfeit counterfeit-two"></div>
        <div class="amon-paradox-counterfeit counterfeit-three"></div>

        <div class="amon-paradox-vignette"></div>
    `;

        // 12 con dấu danh tính bị chiếm đoạt.
        const sealOrbit = document.createElement('div');
        sealOrbit.className = 'amon-identity-seal-orbit';

        const sealGlyphs = [
            'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ',
            'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ'
        ];

        sealGlyphs.forEach((glyph, index) => {
            const seal = document.createElement('span');

            seal.className = 'amon-identity-seal';
            seal.textContent = glyph;

            seal.style.setProperty('--seal-angle', `${index * 30}deg`);
            seal.style.setProperty('--seal-angle-inverse', `${index * -30}deg`);
            seal.style.setProperty('--seal-delay', `${-index * 0.23}s`);

            sealOrbit.appendChild(seal);
        });

        domain.appendChild(sealOrbit);

        // Sáu hành lang thời gian phân nhánh.
        for (let i = 0; i < 6; i++) {
            const corridor = document.createElement('div');

            corridor.className = 'amon-paradox-corridor';
            corridor.style.setProperty('--corridor-index', i);
            corridor.style.setProperty('--corridor-angle', `${i * 60}deg`);
            corridor.style.setProperty('--corridor-delay', `${-i * 0.7}s`);

            domain.appendChild(corridor);
        }

        // 42 giây bị đánh cắp nằm rải rác trên toàn màn hình.
        for (let i = 0; i < 42; i++) {
            const second = document.createElement('span');

            second.className = 'amon-borrowed-second';

            const randomSymbol = Math.random();

            second.textContent =
                randomSymbol > 0.66
                    ? '⌁'
                    : randomSymbol > 0.33
                        ? '∴'
                        : '⊘';

            second.style.left = `${Math.random() * 96 + 2}%`;
            second.style.top = `${Math.random() * 92 + 4}%`;

            second.style.setProperty(
                '--second-size',
                `${Math.random() * 14 + 8}px`
            );

            second.style.setProperty(
                '--second-delay',
                `${Math.random() * -8}s`
            );

            second.style.setProperty(
                '--second-duration',
                `${Math.random() * 6 + 7}s`
            );

            domain.appendChild(second);
        }

        this.container.appendChild(domain);

        // Các xúc tu ký sinh bò ra từ những vị trí ngẫu nhiên.
        this.currentInterval = setInterval(() => {
            if (!domain.isConnected) return;

            const batchSize = hasAmon ? 3 : 2;

            for (let i = 0; i < batchSize; i++) {
                const tendril = document.createElement('span');

                tendril.className = 'amon-paradox-tendril';

                tendril.style.left = `${Math.random() * 90 + 5}%`;
                tendril.style.top = `${Math.random() * 86 + 7}%`;

                tendril.style.setProperty(
                    '--tendril-angle',
                    `${Math.random() * 360}deg`
                );

                tendril.style.setProperty(
                    '--tendril-length',
                    `${Math.random() * 150 + 100}px`
                );

                const tendrilBend = Math.random() * 70 - 35;

                tendril.style.setProperty(
                    '--tendril-bend',
                    `${tendrilBend}deg`
                );

                tendril.style.setProperty(
                    '--tendril-bend-inverse',
                    `${-tendrilBend}deg`
                );

                tendril.style.animationDuration =
                    `${Math.random() * 1.6 + 2.4}s`;

                domain.appendChild(tendril);

                setTimeout(() => {
                    tendril.remove();
                }, 4300);
            }
        }, hasAmon ? 360 : 520);

        // Chu kỳ ghi đè danh tính.
        this.shootingStarInterval = setInterval(() => {
            if (
                !domain.isConnected ||
                domain.querySelector('.amon-identity-overwrite')
            ) {
                return;
            }

            const overwrite = document.createElement('div');

            overwrite.className = 'amon-identity-overwrite';

            overwrite.innerHTML = `
            <span class="overwrite-crown">
                ERROR: SELF ≠ SELF
            </span>

            <span class="overwrite-sigil"></span>

            <span class="overwrite-name">
                IDENTITY BORROWED
            </span>
        `;

            overwrite.style.left = `${Math.random() * 46 + 27}%`;
            overwrite.style.top = `${Math.random() * 34 + 33}%`;

            domain.appendChild(overwrite);

            setTimeout(() => {
                overwrite.remove();
            }, 3600);
        }, hasSefirah ? 4600 : 6100);
    }

    static createNyxDomainEffect() {
        this.stopIntervals();
        if (!this.container) return;

        // 1. Tạo lớp phủ không gian sương tối huyền ảo chuyển động chậm
        const domainBg = document.createElement('div');
        domainBg.classList.add('nyx-domain-ambient');
        this.container.appendChild(domainBg);

        const hasNyxPet = document.querySelector('.nyx-night-goddess-magic') !== null;

        // 2. Bộ đếm sinh các hạt bụi tinh tú lơ lửng màu tím/trắng
        this.currentInterval = setInterval(() => {
            const particle = document.createElement('div');
            particle.classList.add('nyx-domain-dust');

            this.setRandomScreenPosition(particle, 10);

            let size = Math.random() * 3 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            const isPurple = Math.random() > 0.5;
            particle.style.background = isPurple ? '#c77dff' : '#ffffff';
            particle.style.boxShadow = isPurple ? '0 0 8px #8a2be2' : '0 0 8px #ffffff';

            let duration = Math.random() * 4 + 4;
            particle.style.animationDuration = duration + 's';

            this.container.appendChild(particle);

            setTimeout(() => {
                if (particle.parentNode) particle.remove();
            }, duration * 1000);
        }, IS_MOBILE_EFFECT ? 700 : (hasNyxPet ? 120 : 250));

        // 3. Bộ đếm tạo dải sao băng xẹt chéo màn hình cực đẹp mắt (NÂNG CẤP CỘNG HƯỞNG)
        this.shootingStarInterval = setInterval(() => {
            // KIỂM TRA TRẠNG THÁI MÀN ĐÊM BUÔNG XUỐNG
            const isDarkWorld = document.querySelector('.nyx-dark-world') !== null;

            // Nếu đang trong màn đêm, số lượng sao băng rơi đồng thời TĂNG LÊN 3 CÁI!
            const spawnCount = isDarkWorld ? 3 : 1;

            for (let k = 0; k < spawnCount; k++) {
                const star = document.createElement('div');
                star.classList.add('nyx-domain-shooting-star');

                // Tọa độ rơi ngẫu nhiên rải rác khắp bầu trời
                this.setShootingStarPosition(star);

                if (hasNyxPet) {
                    star.classList.add('nyx-enhanced-star');
                }

                // NẾU LÀ MÀN ĐÊM: Gắn thêm class siêu phát sáng độc quyền
                if (isDarkWorld) {
                    star.classList.add('nyx-dark-world-star');
                }

                let starDuration = Math.random() * 1.5 + 1;
                star.style.animationDuration = `${starDuration}s`;

                // Tránh việc 3 ngôi sao xuất hiện trùng lặp hoàn toàn cùng 1 mili giây
                if (isDarkWorld) {
                    star.style.animationDelay = `${Math.random() * 0.4}s`;
                }

                this.container.appendChild(star);

                setTimeout(() => {
                    if (star.parentNode) star.remove();
                }, (starDuration + 0.5) * 1000);
            }
        }, IS_MOBILE_EFFECT ? 5500 : (hasNyxPet ? 2000 : 4500));
    }

    static createPearlDreamEffect() {
        this.stopIntervals();

        if (!this.container) return;

        let tick = 0;

        this.currentInterval = setInterval(() => {
            tick++;

            // Cứ 5 phần tử thì có 1 hạt sáng
            const isSparkle = tick % 5 === 0;
            const particle = document.createElement('span');

            particle.classList.add(
                isSparkle
                    ? 'effect-pearl-dream-sparkle'
                    : 'effect-pearl-dream-bubble'
            );

            // Không sinh quá sát hai mép màn hình
            particle.style.left =
                `${Math.random() * 92 + 4}vw`;

            // Bong bóng lắc nhẹ sang trái hoặc phải
            particle.style.setProperty(
                '--pearl-drift',
                `${Math.random() * 70 - 35}px`
            );

            // Tăng độ rõ lên khoảng 0.68–0.9
            particle.style.setProperty(
                '--pearl-opacity',
                `${Math.random() * 0.22 + 0.68}`
            );

            let duration;

            if (isSparkle) {
                // Hạt sáng: 5–8 px
                const size = Math.random() * 3 + 5;

                particle.style.setProperty(
                    '--pearl-size',
                    `${size}px`
                );

                duration = Math.random() * 2 + 4;
            } else {
                // Bong bóng: 11–20 px
                const size = Math.random() * 9 + 11;

                particle.style.setProperty(
                    '--pearl-size',
                    `${size}px`
                );

                duration = Math.random() * 3 + 7;
            }

            particle.style.animationDuration =
                `${duration}s`;

            const hasDreamSet =
                document.body.classList.contains(
                    'theme-fairy-sea-dream'
                ) ||
                document.querySelector(
                    '.fairy-narwhal-bubble-magic'
                );

            if (hasDreamSet) {
                particle.classList.add(
                    'pearl-dream-combo'
                );
            }

            this.container.appendChild(particle);

            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, duration * 1000 + 500);

        }, 650);
    }

    static createDoraemonSchoolMemoriesEffect() {
        this.stopIntervals();

        if (!this.container) return;

        /*
         * Lớp hiệu ứng riêng.
         * Không dùng lại cấu trúc của tuyết, bong bóng,
         * bụi phép thuật hoặc hiệu ứng cũ.
         */
        const stage = document.createElement('div');

        stage.className =
            'effect-doraemon-childhood-stage';

        const hasShizuka = Boolean(
            document.querySelector(
                '.doraemon-shizuka-study-magic'
            )
        );

        const hasChildhoodTheme =
            document.body.classList.contains(
                'theme-doraemon-childhood'
            );

        /*
         * Cộng hưởng khi đang dùng pet hoặc giao diện Doraemon.
         */
        if (hasShizuka || hasChildhoodTheme) {
            stage.classList.add(
                'effect-doraemon-childhood-combo'
            );
        }

        /*
         * Cộng hưởng hoàn chỉnh khi dùng đủ cả pet và theme.
         */
        if (hasShizuka && hasChildhoodTheme) {
            stage.classList.add(
                'effect-doraemon-childhood-complete'
            );
        }

        stage.innerHTML = `
        <div class="effect-doraemon-daylight"></div>

        <div
            class="
                effect-doraemon-ribbon
                effect-doraemon-ribbon-blue
            "
        ></div>

        <div
            class="
                effect-doraemon-ribbon
                effect-doraemon-ribbon-pink
            "
        ></div>

        <div
            class="
                effect-doraemon-memory-ring
                effect-doraemon-ring-left
            "
        ></div>

        <div
            class="
                effect-doraemon-memory-ring
                effect-doraemon-ring-right
            "
        ></div>
    `;

        this.container.appendChild(stage);

        /*
         * Bộ ký hiệu tuổi thơ riêng.
         */
        const childhoodTokens = [
            {
                character: '♪',
                type: 'music'
            },
            {
                character: '♫',
                type: 'music'
            },
            {
                character: '✦',
                type: 'spark'
            },
            {
                character: '♡',
                type: 'heart'
            },
            {
                character: '✎',
                type: 'pencil'
            },
            {
                character: '○',
                type: 'shape'
            },
            {
                character: '△',
                type: 'shape'
            },
            {
                character: '□',
                type: 'shape'
            }
        ];

        const childhoodColors = [
            '#5ab4e6',
            '#f4a7c1',
            '#ffe08a',
            '#7dd9c5',
            '#ffffff'
        ];

        const spawnDoodle = (isInitial = false) => {
            if (!stage.isConnected) return;

            const token =
                childhoodTokens[
                Math.floor(
                    Math.random() *
                    childhoodTokens.length
                )
                ];

            const doodle =
                document.createElement('span');

            doodle.className =
                'effect-doraemon-childhood-doodle';

            doodle.dataset.doodleType =
                token.type;

            doodle.textContent =
                token.character;

            const viewport =
                this.getViewport();

            const duration =
                Math.random() * 5 + 8;

            const size =
                Math.random() * 12 + 14;

            const horizontalPosition =
                Math.random() * 92 + 4;

            doodle.style.left =
                `${horizontalPosition}%`;

            /*
             * Các phần tử ban đầu được rải khắp trang.
             * Phần tử mới bắt đầu từ cạnh dưới.
             */
            doodle.style.top =
                isInitial
                    ? `${Math.random() * 90 + 5}%`
                    : `calc(100% + ${Math.random() * 35 + 20
                    }px)`;

            doodle.style.setProperty(
                '--doraemon-doodle-size',
                `${size}px`
            );

            doodle.style.setProperty(
                '--doraemon-doodle-drift',
                `${Math.random() * 120 - 60}px`
            );

            doodle.style.setProperty(
                '--doraemon-doodle-rise',
                `${Math.round(
                    viewport.height + 190
                )}px`
            );

            doodle.style.setProperty(
                '--doraemon-doodle-turn',
                `${Math.random() * 34 - 17}deg`
            );

            doodle.style.setProperty(
                '--doraemon-doodle-color',
                childhoodColors[
                Math.floor(
                    Math.random() *
                    childhoodColors.length
                )
                ]
            );

            doodle.style.animationDuration =
                `${duration}s`;

            if (isInitial) {
                doodle.style.animationDelay =
                    `${-Math.random() * duration}s`;
            }

            stage.appendChild(doodle);

            setTimeout(() => {
                if (doodle.parentNode) {
                    doodle.remove();
                }
            }, (duration + 1) * 1000);
        };

        /*
         * Tạo vòng ký ức xuất hiện ngẫu nhiên.
         */
        const spawnMemoryPulse = () => {
            if (!stage.isConnected) return;

            const pulse =
                document.createElement('span');

            pulse.className =
                'effect-doraemon-memory-pulse';

            pulse.style.left =
                `${Math.random() * 84 + 8}%`;

            pulse.style.top =
                `${Math.random() * 72 + 14}%`;

            pulse.style.setProperty(
                '--doraemon-pulse-color',
                childhoodColors[
                Math.floor(
                    Math.random() *
                    childhoodColors.length
                )
                ]
            );

            stage.appendChild(pulse);

            setTimeout(() => {
                if (pulse.parentNode) {
                    pulse.remove();
                }
            }, 2400);
        };

        /*
         * Rải một lượng phần tử vừa phải ngay khi kích hoạt.
         */
        const initialDoodleCount =
            IS_MOBILE_EFFECT ? 8 : 15;

        for (
            let index = 0;
            index < initialDoodleCount;
            index++
        ) {
            spawnDoodle(true);
        }

        let effectTick = 0;

        this.currentInterval =
            setInterval(() => {
                effectTick++;

                spawnDoodle(false);

                /*
                 * Sau mỗi năm ký hiệu sẽ xuất hiện
                 * một vòng ký ức.
                 */
                if (effectTick % 5 === 0) {
                    spawnMemoryPulse();
                }
            }, IS_MOBILE_EFFECT ? 1500 : 900);
    }

    /* =========================================================
   HỌA GIỚI SẮC MÀU
   Hiệu ứng Hội họa toàn web mới hoàn toàn.

   Phối hợp với:
   - Pet: Nàng Họa Sĩ Tinh Linh
   - Theme: Xưởng Vẽ Tinh Linh
   ========================================================= */
    static createEnchantedAtelierEffect() {
        this.stopIntervals();

        if (!this.container) return;

        // Sân khấu toàn màn hình
        const stage = document.createElement('div');

        stage.className = 'effect-atelier-world';
        stage.setAttribute('aria-hidden', 'true');

        stage.innerHTML = `
        <div class="effect-atelier-paper-light"></div>

        <div class="effect-atelier-wash wash-top-left"></div>
        <div class="effect-atelier-wash wash-top-right"></div>
        <div class="effect-atelier-wash wash-bottom-left"></div>
        <div class="effect-atelier-wash wash-bottom-right"></div>

        <div class="effect-atelier-border-stroke border-top"></div>
        <div class="effect-atelier-border-stroke border-bottom"></div>

        <div class="effect-atelier-signature">
            <span class="signature-line line-one"></span>
            <span class="signature-line line-two"></span>

            <span class="signature-dot dot-one"></span>
            <span class="signature-dot dot-two"></span>
            <span class="signature-dot dot-three"></span>
        </div>
    `;

        this.container.appendChild(stage);

        // Cùng bảng màu với Xưởng Vẽ Tinh Linh
        const palette = [
            '#1595a5',
            '#38bfc9',
            '#8b5cf6',
            '#db5d93',
            '#d89a2b',
            '#4ba985'
        ];

        const getColor = offset => {
            const randomIndex =
                Math.floor(Math.random() * palette.length);

            return palette[
                (randomIndex + offset) % palette.length
            ];
        };

        // Giọt màu loang trên nền
        const spawnPigmentBloom = (
            isInitial = false
        ) => {
            if (!stage.isConnected) return;

            const bloom =
                document.createElement('span');

            bloom.className =
                'effect-atelier-pigment-bloom';

            const minSize =
                IS_MOBILE_EFFECT ? 28 : 38;

            const extraSize =
                IS_MOBILE_EFFECT ? 36 : 58;

            const size =
                Math.round(
                    Math.random() * extraSize +
                    minSize
                );

            const duration =
                Math.random() * 4.5 + 6.5;

            bloom.style.left =
                `${Math.random() * 100}%`;

            bloom.style.top =
                `${Math.random() * 100}%`;

            bloom.style.width = `${size}px`;
            bloom.style.height = `${size}px`;

            bloom.style.setProperty(
                '--atelier-bloom-color-a',
                getColor(0)
            );

            bloom.style.setProperty(
                '--atelier-bloom-color-b',
                getColor(2)
            );

            bloom.style.setProperty(
                '--atelier-bloom-rotate',
                `${Math.random() * 90 - 45}deg`
            );

            bloom.style.setProperty(
                '--atelier-bloom-drift-x',
                `${Math.random() * 110 - 55}px`
            );

            bloom.style.setProperty(
                '--atelier-bloom-drift-y',
                `${Math.random() * 90 - 45}px`
            );

            bloom.style.animationDuration =
                `${duration}s`;

            // Những giọt đầu xuất hiện ở nhiều giai đoạn khác nhau
            if (isInitial) {
                bloom.style.animationDelay =
                    `${-Math.random() * duration}s`;
            }

            stage.appendChild(bloom);

            setTimeout(() => {
                bloom.remove();
            }, (duration + 0.5) * 1000);
        };

        // Nét cọ bay ngang màn hình
        const spawnBrushRibbon = () => {
            if (!stage.isConnected) return;

            const ribbon =
                document.createElement('span');

            const isReverse =
                Math.random() > 0.5;

            ribbon.className =
                isReverse
                    ? 'effect-atelier-brush-ribbon is-reverse'
                    : 'effect-atelier-brush-ribbon';

            const duration =
                Math.random() * 2.4 + 5.6;

            ribbon.style.top =
                `${8 + Math.random() * 78}%`;

            ribbon.style.width =
                `${Math.round(
                    Math.random() *
                    (IS_MOBILE_EFFECT ? 100 : 190) +
                    (IS_MOBILE_EFFECT ? 110 : 170)
                )}px`;

            ribbon.style.setProperty(
                '--atelier-ribbon-color-a',
                getColor(0)
            );

            ribbon.style.setProperty(
                '--atelier-ribbon-color-b',
                getColor(3)
            );

            ribbon.style.setProperty(
                '--atelier-ribbon-angle',
                `${Math.random() * 9 - 4.5}deg`
            );

            ribbon.style.setProperty(
                '--atelier-ribbon-wave',
                `${Math.random() * 36 - 18}px`
            );

            ribbon.style.animationDuration =
                `${duration}s`;

            stage.appendChild(ribbon);

            setTimeout(() => {
                ribbon.remove();
            }, (duration + 0.5) * 1000);
        };

        // Vòng màu nước lan nhẹ
        const spawnPaintRipple = () => {
            if (!stage.isConnected) return;

            const ripple =
                document.createElement('span');

            ripple.className =
                'effect-atelier-paint-ripple';

            const size =
                Math.round(
                    Math.random() *
                    (IS_MOBILE_EFFECT ? 70 : 120) +
                    (IS_MOBILE_EFFECT ? 80 : 110)
                );

            ripple.style.left =
                `${10 + Math.random() * 80}%`;

            ripple.style.top =
                `${10 + Math.random() * 80}%`;

            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;

            ripple.style.setProperty(
                '--atelier-ripple-color',
                getColor(1)
            );

            ripple.style.setProperty(
                '--atelier-ripple-tilt',
                `${Math.random() * 35 - 17.5}deg`
            );

            stage.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 4300);
        };

        // Tạo sẵn màu khi vừa trang bị
        const initialBloomCount =
            IS_MOBILE_EFFECT ? 7 : 13;

        for (
            let index = 0;
            index < initialBloomCount;
            index++
        ) {
            spawnPigmentBloom(true);
        }

        spawnPaintRipple();

        let effectTick = 0;

        this.currentInterval =
            setInterval(() => {
                if (!stage.isConnected) {
                    this.stopIntervals();
                    return;
                }

                effectTick++;

                spawnPigmentBloom(false);

                // Mỗi bốn nhịp xuất hiện một nét cọ
                if (effectTick % 4 === 0) {
                    spawnBrushRibbon();
                }

                // Mỗi bảy nhịp xuất hiện vòng màu nước
                if (effectTick % 7 === 0) {
                    spawnPaintRipple();
                }
            }, IS_MOBILE_EFFECT ? 1100 : 680);
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        EffectManager.stopIntervals();
        return;
    }

    const activeEffect = localStorage.getItem('active_effect');

    if (activeEffect) {
        EffectManager.applyEffect(activeEffect);
    }
});