// js/effect-items.js

class EffectManager {
    static container = document.getElementById('global-effect-container');
    static currentInterval = null;
    static shootingStarInterval = null;

    static clearEffects() {
        // Dừng các bộ đếm sinh hạt
        if (this.currentInterval) clearInterval(this.currentInterval);
        
        if (this.container) {
            // Thay vì xóa ngay (innerHTML = ''), đợi các hoạt ảnh cuối cùng kết thúc
            const children = Array.from(this.container.children);
            children.forEach(child => {
                // Tắt animation và ép mờ đi trong 0.3s
                child.style.animation = 'none';
                child.style.transition = 'opacity 0.3s';
                child.style.opacity = '0';
                setTimeout(() => {
                    if (child.parentNode) child.remove();
                }, 300);
            });
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
        }
        localStorage.setItem('active_effect', effectId);
    }

    static createSnowEffect() {
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
        }, 300);
    }

    static createFairyDust() {
        this.currentInterval = setInterval(() => {
            const particle = document.createElement('div');
            particle.classList.add('fairy-dust');

            // TĂNG KÍCH THƯỚC: Random từ 5px đến 12px (to và dễ nhìn hơn rất nhiều)
            let size = Math.random() * 7 + 5;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.top = Math.random() * 100 + 'vh';

            let duration = Math.random() * 4 + 4;
            particle.style.animationDuration = duration + 's';

            this.container.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, duration * 1000);

        }, 200); // Đẩy tốc độ sinh hạt lên (0.2s/hạt) để hiệu ứng nhìn rõ ràng hơn
    }

    static createFireflyEffect() {
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

        }, 350); // Tốc độ sinh đom đóm (0.35s/con)
    }

    static createFallingLeavesEffect() {
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

        }, 350); // Nhịp độ sinh lá (0.35s / lá)
    }

    static createNightSkyEffect() {
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
        this.currentInterval = setInterval(() => {
            const particle = document.createElement('div');
            // Gọi đúng class CSS đã có trong file store-items.css
            particle.classList.add('effect-cotich-tinhlinh');

            // Random vị trí xuất phát theo chiều ngang
            particle.style.left = Math.random() * 100 + 'vw';

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

        }, 200); // Tốc độ sinh hạt: 0.2s tạo ra 1 hạt
    }

    static createGalaxyLegendEffect() {
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
}