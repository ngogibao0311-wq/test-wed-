(() => {
    'use strict';
    if (window.BellumEvent) return;

    const VERSION = '1.4.0-cinematic-effects';
    const ASSET_BASE = 'assets/sk quy bi/';
    const SCENE_BASE_JS = 'js/bellum-scenes/';
    const SCENE_BASE_CSS = 'css/bellum-scenes/';
    const SAVE_KEY = 'bellum_visual_novel_progress_v1';
    const AUTO_DELAY = 4200;

    // PHẦN THƯỞNG HOÀN THÀNH BELLUM
    // Chỉ lấy vật phẩm từ StoreConfig.items (cửa hàng thường),
    // không đọc LuxuryStore / cửa hàng Sang trọng.
    const COMPLETION_REWARD_TAG = 'Thất Đại Tội';
    const COMPLETION_REWARD_ROOT = 'student_event_rewards';

    // SỰ KIỆN HẰNG NĂM · THÁNG 11
    // Cảnh 01→20 lần lượt mở vào các ngày:
    // 01, 03, 05, 07, 09, 11, 13, 15, 17, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30/11.
    const EVENT_MONTH = 11;
    const EVENT_START_DAY = 1;
    const EVENT_END_DAY = 30;
    const EVENT_TIME_ZONE = 'Asia/Ho_Chi_Minh';
    const SCENE_RELEASE_DAYS = Object.freeze([
        1, 3, 5, 7, 9, 11, 13, 15, 17, 19,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30
    ]);

    let serverTimeOffset = 0;
    let scheduleRefreshTimer = null;
    const sceneMeta = [{"number": 1, "title": "NGÔI LÀNG KHÔNG CÒN NGƯỜI SỐNG", "act": "HỒI I: CÁNH CỬA DƯỚI LÒNG ĐẤT"}, {"number": 2, "title": "KHU RỪNG CẤM", "act": "HỒI I: CÁNH CỬA DƯỚI LÒNG ĐẤT"}, {"number": 3, "title": "ĐẠI SẢNH CỦA BẢY BỨC TƯỢNG", "act": "HỒI I: CÁNH CỬA DƯỚI LÒNG ĐẤT"}, {"number": 4, "title": "THAM LAM – KHO BÁU KHÔNG THUỘC VỀ AI", "act": "HỒI II: BẢY CĂN PHÒNG"}, {"number": 5, "title": "ĐỐ KỊ – HÀNH LANG CỦA NHỮNG CUỘC ĐỜI KHÁC", "act": "HỒI II: BẢY CĂN PHÒNG"}, {"number": 6, "title": "PHÒNG NHẬT KÝ", "act": "HỒI II: BẢY CĂN PHÒNG"}, {"number": 7, "title": "THAM ĂN – BỮA TIỆC KHÔNG KẾT THÚC", "act": "HỒI II: BẢY CĂN PHÒNG"}, {"number": 8, "title": "LƯỜI BIẾNG – NGÔI NHÀ CỦA NGÀY HÔM QUA", "act": "HỒI II: BẢY CĂN PHÒNG"}, {"number": 9, "title": "CĂN PHÒNG CỦA NHỮNG NGƯỜI BỊ HIẾN TẾ", "act": "HỒI II: BẢY CĂN PHÒNG"}, {"number": 10, "title": "DỤC VỌNG – NHÀ HÁT MẶT NẠ", "act": "HỒI II: BẢY CĂN PHÒNG"}, {"number": 11, "title": "THỊNH NỘ – CHIẾN TRƯỜNG TRO TÀN", "act": "HỒI II: BẢY CĂN PHÒNG"}, {"number": 12, "title": "KIÊU NGẠO – NGÔI ĐỀN TRÊN CAO", "act": "HỒI II: BẢY CĂN PHÒNG"}, {"number": 13, "title": "KÝ ỨC CỦA CHA MALACH", "act": "HỒI III: NGUỒN GỐC CỦA BẢY TỘI LỖI"}, {"number": 14, "title": "NGHI LỄ ĐẦU TIÊN", "act": "HỒI III: NGUỒN GỐC CỦA BẢY TỘI LỖI"}, {"number": 15, "title": "SỰ RA ĐỜI CỦA BẢY THỰC THỂ", "act": "HỒI III: NGUỒN GỐC CỦA BẢY TỘI LỖI"}, {"number": 16, "title": "VẬT CHỨA MỚI", "act": "HỒI III: NGUỒN GỐC CỦA BẢY TỘI LỖI"}, {"number": 17, "title": "CÂU ĐỐ CUỐI CÙNG", "act": "HỒI III: NGUỒN GỐC CỦA BẢY TỘI LỖI"}, {"number": 18, "title": "TRẬN CHIẾN VỚI VỰC THẲM", "act": "HỒI III: NGUỒN GỐC CỦA BẢY TỘI LỖI"}, {"number": 19, "title": "LỰA CHỌN CỦA LYRA", "act": "HỒI III: NGUỒN GỐC CỦA BẢY TỘI LỖI"}, {"number": 20, "title": "BÌNH MINH TẠI EDEVANE", "act": "KẾT"}];
    const introCharacters = [
        { name: 'KAEL', role: 'Thợ săn thực thể siêu nhiên', image: 'Kael.png', text: 'Một thợ săn khoảng hai mươi tám tuổi, dũng cảm và quyết đoán. Anh mang cảm giác tội lỗi vì đã không cứu được em gái Mira mười năm trước.' },
        { name: 'LYRA MALACH', role: 'Nữ tu của Bellum', image: 'Lyra Malach.png', text: 'Một nữ tu trẻ hiểu rõ cấu trúc tu viện và luôn né tránh quá khứ của mình. Cô đã mắc kẹt tại Bellum hơn ba trăm năm.' },
        { name: 'MIRA', role: 'Em gái của Kael', image: 'Mira.png', text: 'Mira qua đời khi mới mười hai tuổi. Hình bóng của cô liên tục xuất hiện trong những ảo giác và ký ức ám ảnh Kael.' },
        { name: 'CHA MALACH', role: 'Người sáng lập Tu viện Bellum', image: 'Cha Malach.png', text: 'Một học giả và giáo sĩ tin rằng tội lỗi là căn nguyên của mọi đau khổ. Ông thực hiện nghi lễ nhằm tách bảy ham muốn đen tối khỏi con người.' },
        { name: 'LUCIEN ARMAND', role: 'Học giả trẻ', image: 'Lucien Armand.png', text: 'Từng phục vụ Cha Malach, để lại nhiều nhật ký và ký hiệu bí mật. Lucien đã cố ngăn nghi lễ nhưng thất bại; số phận của anh vẫn là bí ẩn.' },
        { name: 'ARON', role: 'Người lính trẻ của Edevane', image: 'Aron.png', text: 'Một trong số ít người còn sống tại làng Edevane. Aron là người đầu tiên kể cho Kael về những cái chết kỳ lạ và tiếng chuông trong rừng.' },
        { name: 'MAMMON · THAM LAM', role: 'Thất Đại Tội', image: 'Mammon – Tham Lam.png', text: 'Không chỉ đại diện cho tiền bạc, Mammon là ham muốn sở hữu con người, ký ức, tình yêu và cả sự sống.' },
        { name: 'LEVIATHAN · ĐỐ KỊ', role: 'Thất Đại Tội', image: 'Leviathan – Đố Kị.png', text: 'Một con rắn biển khổng lồ phủ đầy mắt, khiến con người nhìn thấy những cuộc đời hoàn hảo mà họ không có.' },
        { name: 'BEELZEBUB · THAM ĂN', role: 'Thất Đại Tội', image: 'Beelzebub – Tham Ăn.png', text: 'Một sinh vật có chiếc miệng không đáy. Nó không chỉ ăn thức ăn mà còn nuốt ký ức, cảm xúc và linh hồn.' },
        { name: 'BELPHEGOR · LƯỜI BIẾNG', role: 'Thất Đại Tội', image: 'Belphegor – Lười Biếng.png', text: 'Hiện thân của sự buông xuôi: cảm giác muốn từ bỏ vì tin rằng mọi cố gắng cuối cùng đều vô nghĩa.' },
        { name: 'ASMODEUS · DỤC VỌNG', role: 'Thất Đại Tội', image: 'Asmodeus – Dục Vọng.png', text: 'Có thể mang khuôn mặt của bất kỳ người nào đối phương khao khát; đại diện cho chiếm hữu, ám ảnh và biến người khác thành công cụ.' },
        { name: 'SATAN · THỊNH NỘ', role: 'Thất Đại Tội', image: 'Satan – Thịnh Nộ.png', text: 'Sinh ra từ cơn giận bị dồn nén, nỗi đau không được thừa nhận và mong muốn khiến người khác cũng phải đau khổ.' },
        { name: 'LUCIFER · KIÊU NGẠO', role: 'Thất Đại Tội', image: 'Lucifer – Kiêu Ngạo.png', text: 'Thực thể cuối cùng và mạnh nhất. Lucifer không cần hét hay đe dọa; nó khiến con người tự nguyện quỳ xuống.' }
    ];

    const registry = new Map();
    const loadedScripts = new Map();
    const loadedStyles = new Map();

    function pad(n) { return String(Number(n) || 0).padStart(2, '0'); }
    function clampScene(n) { return Math.max(1, Math.min(sceneMeta.length, Number(n) || 1)); }
    function asset(file) {
        if (!file) return '';

        const relativePath = ASSET_BASE + file;

        /*
         * QUAN TRỌNG:
         * --bellum-scene-image được dùng bên trong scene-XX.css.
         * Nếu truyền url("assets/...") tương đối qua CSS variable, trình duyệt
         * sẽ resolve nó theo thư mục của stylesheet (css/bellum-scenes/), tạo
         * đường dẫn sai css/bellum-scenes/assets/....
         * Chuyển sang URL tuyệt đối theo document.baseURI để chạy đúng cả
         * file:// khi test local lẫn HTTP/HTTPS khi deploy.
         */
        try {
            return new URL(relativePath, document.baseURI).href;
        } catch (_) {
            return relativePath;
        }
    }
    function byId(id) { return document.getElementById(id); }
    function safeText(value) { return String(value == null ? '' : value); }


    function getSceneBackgroundForFrame(scene, frameIndex) {
        if (!scene) return '';

        const index = Math.max(0, Number(frameIndex) || 0);
        let selected = scene.background || '';

        if (Array.isArray(scene.backgrounds)) {
            scene.backgrounds
                .filter(entry =>
                    entry &&
                    entry.image &&
                    Number(entry.fromFrame) <= index
                )
                .sort((a, b) =>
                    Number(a.fromFrame) - Number(b.fromFrame)
                )
                .forEach(entry => {
                    selected = entry.image;
                });
        }

        return selected;
    }

    function applySceneBackground(scene = state.scene, frameIndex = state.frameIndex) {
        const stage = byId('bellumStage');
        if (!stage) return;

        const backgroundFile = getSceneBackgroundForFrame(
            scene,
            frameIndex
        );
        const sceneBackground = backgroundFile
            ? asset(backgroundFile)
            : '';

        const nextValue = sceneBackground
            ? `url("${sceneBackground.replace(/"/g, '\\"')}")`
            : 'none';

        if (
            stage.style.getPropertyValue('--bellum-scene-image') !==
            nextValue
        ) {
            stage.classList.add('is-background-changing');
            stage.style.setProperty(
                '--bellum-scene-image',
                nextValue
            );

            requestAnimationFrame(() => {
                stage.classList.remove('is-background-changing');
            });
        }
    }

    // ==========================================================
    // BELLUM CINEMATIC FX v1.4.0
    // Hiệu ứng được kích hoạt từ chính nội dung frame + không khí từng cảnh,
    // không cần sửa 20 file scene khi bổ sung lời thoại.
    // ==========================================================
    const SCENE_AMBIENCE = Object.freeze({
        1: ['rain', 'cold'],
        2: ['forest', 'fog'],
        3: ['crypt', 'fog'],
        4: ['gold'],
        5: ['mirror'],
        6: ['dust', 'memory'],
        7: ['sick'],
        8: ['dream'],
        9: ['crypt', 'dust'],
        10: ['crimson', 'stage'],
        11: ['fire'],
        12: ['holy'],
        13: ['memory', 'dust'],
        14: ['ritual', 'smoke'],
        15: ['ritual', 'fire', 'storm'],
        16: ['sigil', 'abyss'],
        17: ['ritual', 'abyss'],
        18: ['abyss', 'storm', 'debris'],
        19: ['collapse', 'holy'],
        20: ['dawn']
    });

    const AMBIENCE_CLASSES = [
        'bellum-amb-rain',
        'bellum-amb-cold',
        'bellum-amb-forest',
        'bellum-amb-fog',
        'bellum-amb-crypt',
        'bellum-amb-gold',
        'bellum-amb-mirror',
        'bellum-amb-dust',
        'bellum-amb-memory',
        'bellum-amb-sick',
        'bellum-amb-dream',
        'bellum-amb-crimson',
        'bellum-amb-stage',
        'bellum-amb-fire',
        'bellum-amb-holy',
        'bellum-amb-ritual',
        'bellum-amb-smoke',
        'bellum-amb-storm',
        'bellum-amb-sigil',
        'bellum-amb-abyss',
        'bellum-amb-debris',
        'bellum-amb-collapse',
        'bellum-amb-dawn'
    ];

    const TRANSIENT_STAGE_CLASSES = [
        'bellum-fx-shake-soft',
        'bellum-fx-shake-heavy',
        'bellum-fx-distort',
        'bellum-fx-dream-hit',
        'bellum-fx-heartbeat',
        'bellum-fx-memory-hit',
        'bellum-fx-abyss-hit',
        'bellum-fx-ritual-hit',
        'bellum-fx-ghost-hit'
    ];

    let cinematicTimers = [];

    function clearCinematicTimers() {
        cinematicTimers.forEach(timer => clearTimeout(timer));
        cinematicTimers = [];
    }

    function addTimedClass(element, className, duration = 760) {
        if (!element || !className) return;
        element.classList.remove(className);
        // Buộc animation chạy lại nếu hai frame liên tiếp dùng cùng hiệu ứng.
        void element.offsetWidth;
        element.classList.add(className);
        cinematicTimers.push(
            setTimeout(
                () => element.classList.remove(className),
                Math.max(120, Number(duration) || 760)
            )
        );
    }

    function normalizeFxText(value) {
        return safeText(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function applySceneAmbience(sceneNumber = state.sceneNumber) {
        const root = byId('bellumEvent');
        if (!root) return;

        AMBIENCE_CLASSES.forEach(className =>
            root.classList.remove(className)
        );

        const ambience =
            SCENE_AMBIENCE[Number(sceneNumber)] || [];

        ambience.forEach(name =>
            root.classList.add(`bellum-amb-${name}`)
        );
    }

    function clearTransientCinematics() {
        clearCinematicTimers();

        const stage = byId('bellumStage');
        const root = byId('bellumEvent');
        const dialogue = byId('bellumDialogueBox');
        const portrait = byId('bellumPortrait');
        const flash = byId('bellumFxFlash');
        const whisper = byId('bellumFxWhisper');

        TRANSIENT_STAGE_CLASSES.forEach(className =>
            stage?.classList.remove(className)
        );

        [
            'bellum-fx-dialogue-impact',
            'bellum-fx-dialogue-echo',
            'bellum-fx-dialogue-corrupt'
        ].forEach(className =>
            dialogue?.classList.remove(className)
        );

        [
            'bellum-fx-portrait-entity',
            'bellum-fx-portrait-ghost',
            'bellum-fx-portrait-rage',
            'bellum-fx-portrait-holy'
        ].forEach(className =>
            portrait?.classList.remove(className)
        );

        if (flash) {
            flash.className = 'bellum-fx-flash';
        }

        if (whisper) {
            whisper.classList.remove('is-visible');
            whisper.textContent = '';
        }

        root?.classList.remove(
            'bellum-fx-speaker-mammon',
            'bellum-fx-speaker-leviathan',
            'bellum-fx-speaker-beelzebub',
            'bellum-fx-speaker-belphegor',
            'bellum-fx-speaker-asmodeus',
            'bellum-fx-speaker-satan',
            'bellum-fx-speaker-lucifer',
            'bellum-fx-speaker-abyssus',
            'bellum-fx-speaker-malach'
        );
    }

    function triggerFlash(kind = 'white', duration = 520) {
        const flash = byId('bellumFxFlash');
        if (!flash) return;

        const className =
            kind === 'red'
                ? 'is-red'
                : kind === 'gold'
                    ? 'is-gold'
                    : kind === 'blue'
                        ? 'is-blue'
                        : 'is-white';

        flash.className = `bellum-fx-flash ${className}`;
        void flash.offsetWidth;
        flash.classList.add('is-active');

        cinematicTimers.push(
            setTimeout(() => {
                flash.className = 'bellum-fx-flash';
            }, duration)
        );
    }

    function showWhisper(text, duration = 1700) {
        const whisper = byId('bellumFxWhisper');
        if (!whisper) return;

        const value = safeText(text)
            .replace(/\s+/g, ' ')
            .trim();

        if (!value) return;

        whisper.textContent =
            value.length > 92
                ? value.slice(0, 89) + '…'
                : value;

        whisper.classList.remove('is-visible');
        void whisper.offsetWidth;
        whisper.classList.add('is-visible');

        cinematicTimers.push(
            setTimeout(
                () => whisper.classList.remove('is-visible'),
                duration
            )
        );
    }

    function spawnFxParticles(kind = 'dust', count = 14) {
        const container = byId('bellumFxParticles');
        if (!container) return;

        container
            .querySelectorAll('.bellum-fx-particle')
            .forEach(node => node.remove());

        const total =
            Math.max(
                4,
                Math.min(34, Number(count) || 14)
            );

        for (let index = 0; index < total; index += 1) {
            const particle = document.createElement('i');
            particle.className =
                `bellum-fx-particle is-${kind}`;

            const x = 4 + Math.random() * 92;
            const y = 14 + Math.random() * 72;
            const dx = -70 + Math.random() * 140;
            const dy =
                kind === 'debris'
                    ? 90 + Math.random() * 150
                    : kind === 'light'
                        ? -80 - Math.random() * 120
                        : -30 - Math.random() * 110;

            particle.style.setProperty('--fx-x', `${x}vw`);
            particle.style.setProperty('--fx-y', `${y}vh`);
            particle.style.setProperty('--fx-dx', `${dx}px`);
            particle.style.setProperty('--fx-dy', `${dy}px`);
            particle.style.setProperty(
                '--fx-delay',
                `${Math.random() * 160}ms`
            );
            particle.style.setProperty(
                '--fx-size',
                `${3 + Math.random() * 8}px`
            );

            container.appendChild(particle);
        }

        cinematicTimers.push(
            setTimeout(() => {
                container
                    .querySelectorAll('.bellum-fx-particle')
                    .forEach(node => node.remove());
            }, 1850)
        );
    }

    function applySpeakerCinematics(frame) {
        const root = byId('bellumEvent');
        const portrait = byId('bellumPortrait');
        const dialogue = byId('bellumDialogueBox');

        if (!root || !frame) return;

        const speaker =
            normalizeFxText(frame.speaker || '');

        if (!speaker) return;

        if (speaker.includes('mammon')) {
            root.classList.add('bellum-fx-speaker-mammon');
            portrait?.classList.add('bellum-fx-portrait-entity');
        } else if (speaker.includes('leviathan')) {
            root.classList.add('bellum-fx-speaker-leviathan');
            portrait?.classList.add('bellum-fx-portrait-entity');
            addTimedClass(dialogue, 'bellum-fx-dialogue-corrupt', 900);
        } else if (speaker.includes('beelzebub')) {
            root.classList.add('bellum-fx-speaker-beelzebub');
            portrait?.classList.add('bellum-fx-portrait-entity');
        } else if (speaker.includes('belphegor')) {
            root.classList.add('bellum-fx-speaker-belphegor');
            portrait?.classList.add('bellum-fx-portrait-ghost');
        } else if (speaker.includes('asmodeus')) {
            root.classList.add('bellum-fx-speaker-asmodeus');
            portrait?.classList.add('bellum-fx-portrait-entity');
        } else if (speaker.includes('satan')) {
            root.classList.add('bellum-fx-speaker-satan');
            portrait?.classList.add('bellum-fx-portrait-rage');
            addTimedClass(dialogue, 'bellum-fx-dialogue-impact', 760);
        } else if (speaker.includes('lucifer')) {
            root.classList.add('bellum-fx-speaker-lucifer');
            portrait?.classList.add('bellum-fx-portrait-holy');
        } else if (speaker.includes('abyssus')) {
            root.classList.add('bellum-fx-speaker-abyssus');
            portrait?.classList.add('bellum-fx-portrait-entity');
            addTimedClass(dialogue, 'bellum-fx-dialogue-corrupt', 980);
        } else if (speaker.includes('malach')) {
            root.classList.add('bellum-fx-speaker-malach');
            addTimedClass(dialogue, 'bellum-fx-dialogue-echo', 1100);
        }
    }

    function applyFrameCinematics(
        scene = state.scene,
        frame = null,
        frameIndex = state.frameIndex
    ) {
        if (!scene || !frame) return;

        clearTransientCinematics();
        applySceneAmbience(scene.number || state.sceneNumber);
        applySpeakerCinematics(frame);

        const stage = byId('bellumStage');
        const dialogue = byId('bellumDialogueBox');
        const portrait = byId('bellumPortrait');

        const rawText =
            `${safeText(frame.speaker)} ${safeText(frame.text)}`;

        const text = normalizeFxText(rawText);

        // Cảnh mưa Edevane + cơn mưa được nhấn mạnh trong bản thảo.
        if (/\bmua\b/.test(text)) {
            addTimedClass(stage, 'bellum-fx-heartbeat', 700);
        }

        // Chuông và giọng gọi từ rừng.
        if (/chuong|tieng goi|thi tham|gan sat tai/.test(text)) {
            addTimedClass(dialogue, 'bellum-fx-dialogue-echo', 1300);
            showWhisper(frame.text, 1900);
        }

        // Va chạm mạnh / đóng sầm / sụp đổ / nổ.
        if (
            /dong sam|dap vo|dap ban|no tung|sup do|sup xuong|gao len|gam len|lao toi|vung kiem|dam lucien/.test(text)
        ) {
            addTimedClass(
                stage,
                /sup do|no tung|gao len|lao toi/.test(text)
                    ? 'bellum-fx-shake-heavy'
                    : 'bellum-fx-shake-soft',
                760
            );
        }

        // Ánh sáng, tượng mở mắt, dấu ấn phát sáng, bình minh.
        if (/mo mat|phat sang|anh sang xuat hien|mat troi dang moc|tan thanh anh sang|binh minh/.test(text)) {
            triggerFlash(
                /mat troi|binh minh|tan thanh anh sang/.test(text)
                    ? 'gold'
                    : 'white',
                620
            );
        }

        // Khói / khói đen.
        if (/khoi den|bien thanh khoi|thanh khoi/.test(text)) {
            spawnFxParticles('smoke', 20);
            addTimedClass(stage, 'bellum-fx-memory-hit', 900);
        }

        // Gương, ảo ảnh và thực tại méo.
        if (/guong|phan chieu|ao anh|meo mat|rung chuyen|khong co that/.test(text)) {
            addTimedClass(stage, 'bellum-fx-distort', 980);
            addTimedClass(dialogue, 'bellum-fx-dialogue-corrupt', 900);
        }

        // Tham lam / kho báu.
        if (/vang|dong tien|da quy|chia khoa vang|pha le/.test(text)) {
            spawnFxParticles('gold', 18);
            triggerFlash('gold', 420);
        }

        // Lửa / tro / thiêu.
        if (/lua|thieu|chay|tro tan|do ruc/.test(text)) {
            spawnFxParticles('ember', 22);
            triggerFlash('red', 360);
        }

        // Ký ức và chuyển thời gian.
        if (/ky uc|ba tram nam truoc|ky uc thay doi|ngay hom qua/.test(text)) {
            addTimedClass(stage, 'bellum-fx-memory-hit', 1250);
        }

        // Ngủ, ảo giác, cảm giác không thật.
        if (/ao giac|ngu|giac mo|nam xuong|muon o lai/.test(text)) {
            addTimedClass(stage, 'bellum-fx-dream-hit', 1250);
        }

        // Nghi lễ, phong ấn, dấu ấn, xiềng xích.
        if (/nghi le|vong tron|dau an|phong an|than chu|xieng xich|vat chu/.test(text)) {
            addTimedClass(stage, 'bellum-fx-ritual-hit', 1250);
            triggerFlash('blue', 420);
        }

        // Abyssus / vực thẳm / sự phân rã.
        if (/abyssus|vuc tham|bay khuon mat|tan ra|phan ra/.test(text)) {
            addTimedClass(stage, 'bellum-fx-abyss-hit', 1150);
            addTimedClass(stage, 'bellum-fx-distort', 900);
        }

        // Nhân vật mờ đi / linh hồn tan biến.
        if (/trong suot|bien mat|tan thanh anh sang|linh hon/.test(text)) {
            addTimedClass(stage, 'bellum-fx-ghost-hit', 1200);
            portrait?.classList.add('bellum-fx-portrait-ghost');
        }

        // Máu / đâm / dao: flash đỏ ngắn, không lạm dụng.
        if (/\bmau\b|rut dao|dung dao|cat tay|dam lucien/.test(text)) {
            triggerFlash('red', 300);
        }

        // Cảnh 18–19 có sập vỡ, thêm mảnh vụn đúng nhịp câu.
        if (
            Number(scene.number) >= 18 &&
            /sup|vo|pha tru|no tung|dap vo/.test(text)
        ) {
            spawnFxParticles('debris', 22);
        }

        // Cảnh cuối: bình minh / kết thúc chuyển sang hạt sáng.
        if (
            Number(scene.number) === 20 &&
            /mat troi|binh minh|anh sang|nguoi dan buoc ra/.test(text)
        ) {
            spawnFxParticles('light', 18);
        }

        // Nhịp kịch tính cho lời hét / mệnh lệnh.
        if (
            frame.type === 'dialogue' &&
            /!$/.test(safeText(frame.text).trim())
        ) {
            addTimedClass(dialogue, 'bellum-fx-dialogue-impact', 620);
        }

        // Ghi dấu frame hiện tại để tiện debug trong Console.
        const root = byId('bellumEvent');
        if (root) {
            root.dataset.fxScene =
                String(scene.number || state.sceneNumber);
            root.dataset.fxFrame =
                String(Number(frameIndex) || 0);
        }
    }

    function showSceneStinger(scene) {
        if (!scene) return;

        const stinger = byId('bellumSceneStinger');
        const act = byId('bellumStingerAct');
        const title = byId('bellumStingerTitle');
        const number = byId('bellumStingerNumber');

        if (!stinger || !act || !title || !number) return;

        number.textContent =
            `CẢNH ${pad(scene.number || state.sceneNumber)}`;
        act.textContent =
            safeText(scene.act || 'THẤT ĐẠI TỘI');
        title.textContent =
            safeText(scene.title || 'TU VIỆN BELLUM');

        stinger.classList.remove('is-visible');
        void stinger.offsetWidth;
        stinger.classList.add('is-visible');

        cinematicTimers.push(
            setTimeout(
                () => stinger.classList.remove('is-visible'),
                1900
            )
        );
    }


    function getVietnamDateParts(timestamp = Date.now() + serverTimeOffset) {
        try {
            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: EVENT_TIME_ZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const parts = Object.fromEntries(
                formatter.formatToParts(new Date(timestamp))
                    .filter(part => part.type !== 'literal')
                    .map(part => [part.type, part.value])
            );
            return {
                year: Number(parts.year),
                month: Number(parts.month),
                day: Number(parts.day)
            };
        } catch (_) {
            const date = new Date(timestamp);
            return {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            };
        }
    }

    function formatBellumDate(day, year) {
        return `${pad(day)}/11/${year}`;
    }

    function getSceneReleaseDay(sceneNumber) {
        return SCENE_RELEASE_DAYS[clampScene(sceneNumber) - 1] || EVENT_END_DAY;
    }

    function getEventStatus(timestamp = Date.now() + serverTimeOffset) {
        const parts = getVietnamDateParts(timestamp);
        const isOpen = (
            parts.month === EVENT_MONTH &&
            parts.day >= EVENT_START_DAY &&
            parts.day <= EVENT_END_DAY
        );

        let nextOpenYear = parts.year;
        if (
            parts.month > EVENT_MONTH ||
            (parts.month === EVENT_MONTH && parts.day > EVENT_END_DAY)
        ) {
            nextOpenYear += 1;
        }

        let dateUnlockedScene = 0;
        if (isOpen) {
            SCENE_RELEASE_DAYS.forEach((releaseDay, index) => {
                if (parts.day >= releaseDay) {
                    dateUnlockedScene = index + 1;
                }
            });
        }

        const nextReleaseScene =
            isOpen && dateUnlockedScene < sceneMeta.length
                ? dateUnlockedScene + 1
                : null;

        return {
            ...parts,
            isOpen,
            nextOpenYear,
            dateUnlockedScene,
            nextReleaseScene,
            nextReleaseDay:
                nextReleaseScene
                    ? getSceneReleaseDay(nextReleaseScene)
                    : null
        };
    }

    function isSceneDateOpen(sceneNumber, status = getEventStatus()) {
        return (
            status.isOpen &&
            status.day >= getSceneReleaseDay(sceneNumber)
        );
    }

    function defaultSave(seasonYear = null) {
        return {
            scene: 1,
            frame: 0,
            unlockedScene: 1,
            completed: false,
            rewardClaimed: false,
            rewardItemId: '',
            rewardItemName: '',
            seasonYear:
                seasonYear !== null &&
                seasonYear !== undefined &&
                Number.isFinite(Number(seasonYear))
                    ? Number(seasonYear)
                    : null
        };
    }

    function persistSave(save) {
        try {
            localStorage.setItem(
                SAVE_KEY,
                JSON.stringify(save)
            );
        } catch (_) {}
        return save;
    }

    function notifySchedule(message, type = 'warning') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        console.info('[BellumEvent]', message);
    }

    async function refreshServerTimeOffset() {
        try {
            const database =
                typeof db !== 'undefined'
                    ? db
                    : window.db;

            if (
                database &&
                typeof database.ref === 'function'
            ) {
                const snapshot = await database
                    .ref('.info/serverTimeOffset')
                    .once('value');

                serverTimeOffset =
                    Number(snapshot.val()) || 0;
            }
        } catch (error) {
            console.warn(
                '[BellumEvent] Không lấy được giờ máy chủ, dùng giờ thiết bị:',
                error
            );
            serverTimeOffset = 0;
        }

        refreshEventCard();
        return serverTimeOffset;
    }

    window.BellumScenes = Object.freeze({
        register(scene) {
            if (!scene || !scene.number) return false;
            registry.set(Number(scene.number), scene);
            return true;
        },
        get(number) { return registry.get(Number(number)) || null; },
        has(number) { return registry.has(Number(number)); }
    });
    (window.__bellumPendingScenes || []).splice(0).forEach(scene => window.BellumScenes.register(scene));

    const state = {
        opened: false,
        scene: null,
        sceneNumber: 1,
        frameIndex: 0,
        lastPortrait: '',
        lastSide: 'right',
        auto: false,
        autoTimer: null,
        busy: false
    };

    function readSave() {
        let normalized;

        try {
            const parsed =
                JSON.parse(
                    localStorage.getItem(SAVE_KEY) || '{}'
                );

            normalized = {
                scene: clampScene(parsed.scene || 1),
                frame: Math.max(
                    0,
                    Number(parsed.frame) || 0
                ),
                unlockedScene: clampScene(
                    parsed.unlockedScene || 1
                ),
                completed:
                    parsed.completed === true,
                rewardClaimed:
                    parsed.rewardClaimed === true,
                rewardItemId:
                    String(parsed.rewardItemId || ''),
                rewardItemName:
                    String(parsed.rewardItemName || ''),
                seasonYear:
                    parsed.seasonYear !== null &&
                    parsed.seasonYear !== undefined &&
                    Number.isFinite(
                        Number(parsed.seasonYear)
                    )
                        ? Number(parsed.seasonYear)
                        : null
            };
        } catch (_) {
            normalized = defaultSave();
        }

        /*
         * Mỗi tháng 11 là một mùa Bellum mới.
         * Tiến độ cũ không được dùng để vượt lịch mở cảnh của năm mới.
         */
        const status = getEventStatus();

        if (
            status.isOpen &&
            normalized.seasonYear !== status.year
        ) {
            normalized = defaultSave(status.year);
            persistSave(normalized);
        }

        return normalized;
    }

    function writeSave(patch) {
        const status = getEventStatus();
        const next = {
            ...readSave(),
            ...patch
        };

        if (status.isOpen) {
            next.seasonYear = status.year;
        }

        return persistSave(next);
    }


    function normalizeBellumRewardTag(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    function getBellumDatabase() {
        try {
            if (typeof db !== 'undefined' && db) {
                return db;
            }
        } catch (_) {}

        return window.db || null;
    }

    function getBellumUsername() {
        let user = null;

        try {
            if (
                typeof currentUser !== 'undefined' &&
                currentUser
            ) {
                user = currentUser;
            }
        } catch (_) {}

        if (!user) {
            try {
                user = JSON.parse(
                    localStorage.getItem('currentUser') || 'null'
                );
            } catch (_) {}
        }

        const username =
            user && user.username
                ? String(user.username).trim()
                : '';

        return username;
    }

    function hasRegularStoreRuntime() {
        try {
            return (
                typeof StoreConfig !== 'undefined' &&
                StoreConfig &&
                Array.isArray(StoreConfig.items)
            );
        } catch (_) {
            return false;
        }
    }

    async function ensureRegularStoreRuntime() {
        if (hasRegularStoreRuntime()) {
            return true;
        }

        if (
            window.StudentFeatureLoader &&
            typeof window.StudentFeatureLoader.ensure === 'function'
        ) {
            try {
                await window.StudentFeatureLoader.ensure(
                    'visual-runtime'
                );
            } catch (error) {
                console.warn(
                    '[BellumEvent] Không nạp được regular store runtime:',
                    error
                );
            }
        }

        return hasRegularStoreRuntime();
    }

    function getRegularSevenSinsItems() {
        if (!hasRegularStoreRuntime()) {
            return [];
        }

        const wanted =
            normalizeBellumRewardTag(
                COMPLETION_REWARD_TAG
            );

        /*
         * CỐ Ý chỉ duyệt StoreConfig.items:
         * đây là danh sách của CỬA HÀNG THƯỜNG.
         * Không lấy dữ liệu từ LuxuryStore / cửa hàng Sang trọng.
         */
        return StoreConfig.items.filter(item => {
            if (!item || !item.id) return false;

            const tags = [];

            if (item.tag) tags.push(item.tag);

            if (Array.isArray(item.tags)) {
                tags.push(...item.tags);
            }

            return tags.some(tag =>
                normalizeBellumRewardTag(tag) ===
                wanted
            );
        });
    }

    function getCompletionRewardPath(
        username,
        seasonYear
    ) {
        return (
            `${COMPLETION_REWARD_ROOT}/` +
            `${username}/bellum/` +
            `${seasonYear}/completion`
        );
    }

    function getCompletionRewardUiState(
        save,
        status
    ) {
        const claimed =
            save.rewardClaimed === true;

        const unlocked =
            save.completed === true;

        if (claimed) {
            return {
                claimed: true,
                unlocked: true,
                claimable: false,
                stateClass: 'is-claimed',
                label: 'ĐÃ NHẬN',
                reason:
                    save.rewardItemName
                        ? `Đã nhận: ${save.rewardItemName}`
                        : 'Phần thưởng mùa này đã được nhận.'
            };
        }

        if (!unlocked) {
            return {
                claimed: false,
                unlocked: false,
                claimable: false,
                stateClass: 'is-reward-locked',
                label: 'KHÓA',
                reason:
                    'Hoàn thành Cảnh 20 để mở phần thưởng.'
            };
        }

        if (!status.isOpen) {
            return {
                claimed: false,
                unlocked: true,
                claimable: false,
                stateClass: 'is-reward-locked',
                label: 'ĐÓNG',
                reason:
                    'Phần thưởng chỉ nhận trong thời gian Bellum mở cửa.'
            };
        }

        return {
            claimed: false,
            unlocked: true,
            claimable: true,
            stateClass: 'is-reward-ready',
            label: 'NHẬN QUÀ',
            reason:
                'Nhấn để nhận ngẫu nhiên 1 vật phẩm tag Thất Đại Tội.'
        };
    }

    function renderCompletionRewardCard(
        save,
        status
    ) {
        const reward =
            getCompletionRewardUiState(
                save,
                status
            );

        return `
            <button
                type="button"
                class="bellum-scene-pick bellum-completion-reward ${reward.stateClass}"
                data-bellum-completion-reward
                ${reward.claimable ? '' : 'disabled'}
            >
                <span class="bellum-scene-pick-head">
                    <small>PHẦN THƯỞNG</small>
                    <span class="bellum-reward-badge">
                        ${safeText(reward.label)}
                    </span>
                </span>

                <span class="bellum-reward-icon" aria-hidden="true">
                    ${reward.claimed ? '✓' : '🎁'}
                </span>

                <span class="bellum-scene-pick-title">
                    DI VẬT THẤT ĐẠI TỘI
                </span>

                <span class="bellum-scene-lock-reason">
                    ${safeText(reward.reason)}
                </span>
            </button>`;
    }

    async function syncCompletionRewardFromFirebase(
        status = getEventStatus()
    ) {
        const save = readSave();

        if (save.rewardClaimed === true) {
            return false;
        }

        const username =
            getBellumUsername();

        const database =
            getBellumDatabase();

        const seasonYear =
            status.isOpen
                ? status.year
                : save.seasonYear;

        if (
            !username ||
            !database ||
            !seasonYear
        ) {
            return false;
        }

        try {
            const snapshot =
                await database
                    .ref(
                        getCompletionRewardPath(
                            username,
                            seasonYear
                        )
                    )
                    .once('value');

            const record =
                snapshot.val();

            if (
                !record ||
                record.claimed !== true
            ) {
                return false;
            }

            writeSave({
                rewardClaimed: true,
                rewardItemId:
                    String(record.itemId || ''),
                rewardItemName:
                    String(record.itemName || '')
            });

            return true;
        } catch (error) {
            console.warn(
                '[BellumEvent] Không đồng bộ được phần thưởng hoàn thành:',
                error
            );

            return false;
        }
    }

    async function releaseCompletionRewardReservation(
        rewardRef,
        token
    ) {
        try {
            await rewardRef.transaction(
                current => {
                    if (
                        current &&
                        current.status === 'claiming' &&
                        current.token === token
                    ) {
                        return null;
                    }

                    return current;
                },
                undefined,
                false
            );
        } catch (_) {}
    }

    async function claimCompletionReward() {
        const status =
            getEventStatus();

        const save =
            readSave();

        if (!status.isOpen) {
            notifySchedule(
                'Phần thưởng Bellum chỉ có thể nhận trong tháng 11 khi sự kiện đang mở.',
                'warning'
            );
            return false;
        }

        if (save.completed !== true) {
            notifySchedule(
                'Bạn phải hoàn thành đủ 20 cảnh trước khi nhận phần thưởng.',
                'warning'
            );
            return false;
        }

        const storeReady =
            await ensureRegularStoreRuntime();

        if (!storeReady) {
            notifySchedule(
                'Chưa tải được dữ liệu Cửa hàng thường. Hãy thử lại.',
                'error'
            );
            return false;
        }

        const allRewardItems =
            getRegularSevenSinsItems();

        if (!allRewardItems.length) {
            notifySchedule(
                'Cửa hàng thường hiện chưa có vật phẩm tag Thất Đại Tội.',
                'warning'
            );
            return false;
        }

        const database =
            getBellumDatabase();

        const username =
            getBellumUsername();

        if (!database || !username) {
            notifySchedule(
                'Không xác định được tài khoản hoặc kết nối Firebase.',
                'error'
            );
            return false;
        }

        const rewardPath =
            getCompletionRewardPath(
                username,
                status.year
            );

        const rewardRef =
            database.ref(
                rewardPath
            );

        const claimToken =
            (
                Date.now().toString(36) +
                '_' +
                Math.random()
                    .toString(36)
                    .slice(2, 10)
            );

        const now =
            Date.now() +
            serverTimeOffset;

        let reservation;

        try {
            reservation =
                await rewardRef.transaction(
                    current => {
                        if (
                            current &&
                            current.claimed === true
                        ) {
                            return;
                        }

                        if (
                            current &&
                            current.status === 'claiming' &&
                            Number(current.startedAt || 0) >
                                now - 120000
                        ) {
                            return;
                        }

                        return {
                            status: 'claiming',
                            token: claimToken,
                            startedAt: now,
                            seasonYear: status.year
                        };
                    },
                    undefined,
                    false
                );
        } catch (error) {
            console.error(
                '[BellumEvent] Không thể khóa lượt nhận thưởng:',
                error
            );

            notifySchedule(
                'Không thể bắt đầu nhận thưởng. Hãy kiểm tra kết nối.',
                'error'
            );

            return false;
        }

        if (!reservation.committed) {
            try {
                const latest =
                    (
                        await rewardRef.once(
                            'value'
                        )
                    ).val();

                if (
                    latest &&
                    latest.claimed === true
                ) {
                    writeSave({
                        rewardClaimed: true,
                        rewardItemId:
                            String(
                                latest.itemId || ''
                            ),
                        rewardItemName:
                            String(
                                latest.itemName || ''
                            )
                    });

                    notifySchedule(
                        latest.itemName
                            ? `Bạn đã nhận phần thưởng mùa này: ${latest.itemName}.`
                            : 'Phần thưởng mùa này đã được nhận.',
                        'success'
                    );

                    return true;
                }
            } catch (_) {}

            notifySchedule(
                'Phần thưởng đang được xử lý ở một phiên khác. Hãy thử lại sau vài giây.',
                'warning'
            );

            return false;
        }

        try {
            const liveClaim = (await rewardRef.once('value')).val();
            if (!liveClaim || liveClaim.status !== 'claiming' || liveClaim.token !== claimToken) {
                throw new Error('BELLUM_STALE_CLAIM_TOKEN');
            }

            const inventorySnapshot =
                await database
                    .ref(
                        `student_inventory/${username}`
                    )
                    .once('value');

            const inventory =
                inventorySnapshot.val() || {};

            const ownedIds =
                new Set(
                    Object.values(inventory)
                        .filter(Boolean)
                        .map(entry =>
                            String(entry.id || '')
                        )
                );

            const unownedItems =
                allRewardItems.filter(item =>
                    !ownedIds.has(
                        String(item.id)
                    ) &&
                    !Object.prototype
                        .hasOwnProperty.call(
                            inventory,
                            item.id
                        )
                );

            /*
             * Không tiêu hao lượt thưởng nếu người dùng đã sở hữu
             * toàn bộ vật phẩm Thất Đại Tội của Cửa hàng thường.
             * Khi cửa hàng có vật phẩm mới, người dùng có thể quay lại nhận.
             */
            if (!unownedItems.length) {
                await releaseCompletionRewardReservation(
                    rewardRef,
                    claimToken
                );

                notifySchedule(
                    'Bạn đã sở hữu toàn bộ vật phẩm Thất Đại Tội hiện có trong Cửa hàng thường. Phần thưởng chưa bị tiêu hao.',
                    'warning'
                );

                return false;
            }

            const rewardItem =
                unownedItems[
                    Math.floor(
                        Math.random() *
                        unownedItems.length
                    )
                ];

            const claimedAt =
                Date.now() +
                serverTimeOffset;

            const updates = {};

            updates[
                `student_inventory/${username}/${rewardItem.id}`
            ] = {
                id: rewardItem.id,
                purchaseTime: claimedAt,
                isEquipped: false,
                isTrial: null,
                trialExpiry: null,
                source:
                    'bellum_completion_reward',
                sourceEvent:
                    'that_dai_toi_tu_vien_bellum',
                sourceYear:
                    status.year,
                bellumSeasonKey:
                    String(status.year),
                bellumClaimToken:
                    claimToken
            };

            updates[rewardPath] = {
                claimed: true,
                status: 'claimed',
                token: claimToken,
                startedAt: Number(liveClaim.startedAt || now),
                itemId: rewardItem.id,
                itemName: rewardItem.name || rewardItem.id,
                itemType: rewardItem.type || '',
                tag: COMPLETION_REWARD_TAG,
                claimedAt,
                seasonYear: status.year,
                sourceStore: 'regular'
            };

            await database
                .ref()
                .update(updates);

            writeSave({
                rewardClaimed: true,
                rewardItemId:
                    String(rewardItem.id),
                rewardItemName:
                    String(
                        rewardItem.name ||
                        rewardItem.id
                    )
            });

            if (
                typeof window.syncStudentLazyStoreRuntime ===
                'function'
            ) {
                Promise.resolve(
                    window.syncStudentLazyStoreRuntime()
                ).catch(() => {});
            }

            if (
                typeof window.showToast ===
                'function'
            ) {
                window.showToast(
                    `🎁 Bellum: Bạn nhận được ${rewardItem.name}!`,
                    'success'
                );
            }

            window.alert(
                `🎁 PHẦN THƯỞNG BELLUM\n\n` +
                `Bạn nhận được:\n${rewardItem.name}\n\n` +
                `Tag: ${COMPLETION_REWARD_TAG}`
            );

            return true;
        } catch (error) {
            console.error(
                '[BellumEvent] Nhận phần thưởng thất bại:',
                error
            );

            await releaseCompletionRewardReservation(
                rewardRef,
                claimToken
            );

            notifySchedule(
                'Nhận phần thưởng thất bại. Lượt nhận chưa bị tiêu hao, hãy thử lại.',
                'error'
            );

            return false;
        }
    }

    function canPlayScene(
        sceneNumber,
        save = readSave(),
        status = getEventStatus()
    ) {
        const n = clampScene(sceneNumber);

        if (!isSceneDateOpen(n, status)) {
            return false;
        }

        return (
            save.completed === true ||
            n <= save.unlockedScene
        );
    }

    function getSceneLockText(
        sceneNumber,
        save = readSave(),
        status = getEventStatus()
    ) {
        const n = clampScene(sceneNumber);
        const releaseDay = getSceneReleaseDay(n);

        if (!status.isOpen) {
            return `Mở ${formatBellumDate(
                releaseDay,
                status.nextOpenYear
            )}`;
        }

        if (!isSceneDateOpen(n, status)) {
            return `Mở ${formatBellumDate(
                releaseDay,
                status.year
            )}`;
        }

        if (
            save.completed !== true &&
            n > save.unlockedScene
        ) {
            return n <= 1
                ? 'Chưa mở'
                : `Hoàn thành Cảnh ${pad(n - 1)} trước`;
        }

        return 'Đã mở';
    }

    function ensureShell() {
        let root = byId('bellumEvent');
        if (root) return root;
        root = document.createElement('div');
        root.id = 'bellumEvent';
        root.className = 'ui-theme-immune';
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-modal', 'true');
        root.setAttribute('aria-label', 'THẤT ĐẠI TỘI: TU VIỆN BELLUM');
        root.innerHTML = `
            <div class="bellum-shell">
                <div class="bellum-stage" id="bellumStage">
                    <div class="bellum-fx-stack" aria-hidden="true">
                        <div class="bellum-fx-layer bellum-fx-rain"></div>
                        <div class="bellum-fx-layer bellum-fx-fog"></div>
                        <div class="bellum-fx-layer bellum-fx-embers"></div>
                        <div class="bellum-fx-layer bellum-fx-shimmer"></div>
                        <div class="bellum-fx-layer bellum-fx-glyphs"></div>
                        <div class="bellum-fx-particles" id="bellumFxParticles"></div>
                        <div class="bellum-fx-whisper" id="bellumFxWhisper"></div>
                        <div class="bellum-fx-flash" id="bellumFxFlash"></div>
                    </div>
                    <div class="bellum-scene-stinger" id="bellumSceneStinger" aria-hidden="true">
                        <div class="bellum-scene-stinger-inner">
                            <div class="bellum-stinger-number" id="bellumStingerNumber">CẢNH 01</div>
                            <div class="bellum-stinger-act" id="bellumStingerAct"></div>
                            <div class="bellum-stinger-title" id="bellumStingerTitle"></div>
                        </div>
                    </div>
                    <div class="bellum-topbar">
                        <div class="bellum-scene-meta">
                            <div class="bellum-scene-number" id="bellumSceneNumber">THẤT ĐẠI TỘI</div>
                            <div class="bellum-scene-title" id="bellumSceneTitle">TU VIỆN BELLUM</div>
                        </div>
                        <div class="bellum-top-actions" aria-label="Điều khiển Bellum">
                            <button type="button" class="bellum-icon-btn bellum-action-auto" id="bellumBtnAuto" title="Tự động chuyển lời thoại" aria-label="Tự động chuyển lời thoại">AUTO</button>
                            <button type="button" class="bellum-icon-btn" id="bellumBtnScenes" title="Danh sách cảnh" aria-label="Danh sách cảnh">CẢNH</button>
                            <button type="button" class="bellum-icon-btn" id="bellumBtnMenu" title="Màn hình chính" aria-label="Màn hình chính">MENU</button>
                            <button type="button" class="bellum-icon-btn bellum-action-close" id="bellumBtnClose" title="Đóng sự kiện" aria-label="Đóng sự kiện">ĐÓNG</button>
                        </div>
                    </div>
                    <div class="bellum-portrait-wrap is-right" id="bellumPortraitWrap">
                        <img class="bellum-portrait" id="bellumPortrait" alt="">
                    </div>
                    <div class="bellum-dialogue-wrap" id="bellumDialogueWrap" hidden>
                        <div class="bellum-dialogue-box" id="bellumDialogueBox">
                            <div class="bellum-speaker-name" id="bellumSpeaker"></div>
                            <div class="bellum-dialogue-text" id="bellumText"></div>
                            <div class="bellum-dialogue-hint">Nhấp vào khung thoại hoặc nhấn Enter / Space / → để tiếp tục</div>
                        </div>
                        <div class="bellum-progress"><div class="bellum-progress-fill" id="bellumProgressFill"></div></div>
                    </div>
                </div>
                <div class="bellum-screen" id="bellumMenuScreen"></div>
                <div class="bellum-screen" id="bellumIntroScreen"></div>
                <div class="bellum-screen" id="bellumSceneScreen"></div>
                <div class="bellum-screen" id="bellumCompleteScreen"></div>
            </div>`;
        document.body.appendChild(root);
        root.addEventListener('click', event => {
            if (event.target.closest('button')) return;
            const box = event.target.closest('#bellumDialogueBox');
            if (box && !state.busy) nextFrame();
        });
        const bindTopAction = (id, handler) => {
            const button = byId(id);
            if (!button) return;
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                handler();
            });
        };
        bindTopAction('bellumBtnClose', close);
        bindTopAction('bellumBtnMenu', showMenu);
        bindTopAction('bellumBtnScenes', showSceneList);
        bindTopAction('bellumBtnAuto', toggleAuto);
        document.addEventListener('keydown', onKeydown);
        return root;
    }

    function onKeydown(event) {
        if (!state.opened) return;
        if (event.key === 'Escape') { close(); return; }
        if (byId('bellumDialogueWrap')?.hidden) return;
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight') {
            event.preventDefault(); nextFrame();
        }
    }

    function openRoot() {
        const root = ensureShell();
        root.classList.add('is-open');
        document.body.classList.add('bellum-event-open');
        state.opened = true;
    }

    function hideScreens() {
        ['bellumMenuScreen','bellumIntroScreen','bellumSceneScreen','bellumCompleteScreen'].forEach(id => byId(id)?.classList.remove('is-visible'));
    }

    function setStoryVisible(visible) {
        const dialogue = byId('bellumDialogueWrap');
        if (dialogue) dialogue.hidden = !visible;
    }

    function showMenu() {
        stopAuto();
        openRoot();
        setStoryVisible(false);
        hideScreens();

        const status = getEventStatus();
        const save = readSave();
        const screen = byId('bellumMenuScreen');

        const hasProgress =
            status.isOpen &&
            (
                save.scene > 1 ||
                save.frame > 0 ||
                save.unlockedScene > 1 ||
                save.completed
            );

        const continueAllowed =
            status.isOpen &&
            hasProgress &&
            canPlayScene(
                save.scene,
                save,
                status
            );

        const nextOpenText =
            `01/11/${status.nextOpenYear}`;

        const seasonNotice = status.isOpen
            ? (
                `<div class="bellum-season-banner is-open">
                    <strong>🕯️ BELLUM ĐANG MỞ · THÁNG 11/${status.year}</strong>
                    <span>
                        Hôm nay đã mở theo lịch đến Cảnh ${pad(
                            status.dateUnlockedScene
                        )}/20.
                        ${
                            status.nextReleaseScene
                                ? `Cảnh ${pad(status.nextReleaseScene)} mở ngày ${formatBellumDate(status.nextReleaseDay, status.year)}.`
                                : 'Toàn bộ 20 cảnh đã được mở theo lịch.'
                        }
                    </span>
                </div>`
            )
            : (
                `<div class="bellum-season-banner is-closed">
                    <strong>🔒 SỰ KIỆN CHƯA MỞ</strong>
                    <span>
                        THẤT ĐẠI TỘI: TU VIỆN BELLUM chỉ mở hằng năm từ
                        <b>01/11</b> đến hết <b>30/11</b>.
                        Lần mở kế tiếp: <b>${nextOpenText}</b>.
                    </span>
                </div>`
            );

        const waitingText =
            status.isOpen &&
            hasProgress &&
            !continueAllowed &&
            !save.completed
                ? (
                    `<div class="bellum-menu-waiting">
                        ⏳ Cảnh ${pad(save.scene)} chưa tới ngày mở:
                        ${formatBellumDate(
                            getSceneReleaseDay(save.scene),
                            status.year
                        )}.
                    </div>`
                )
                : '';

        screen.innerHTML = `
            <div class="bellum-menu-card">
                <div>
                    <div class="bellum-menu-kicker">Visual Novel · Kinh dị · Bí ẩn · Giải đố</div>
                    <h1 class="bellum-menu-title">THẤT ĐẠI TỘI:<br>TU VIỆN BELLUM</h1>
                    <p class="bellum-menu-subtitle">Tu viện Bellum đã bị chôn dưới lòng đất hơn ba trăm năm. Kael bước vào nơi ấy để săn những thực thể mang tên Thất Đại Tội — và phải đối mặt với phần bóng tối mà con người luôn muốn chối bỏ.</p>

                    ${seasonNotice}
                    ${waitingText}

                    <div class="bellum-menu-actions">
                        ${
                            continueAllowed
                                ? '<button class="bellum-menu-btn primary" data-action="continue">▶ Tiếp tục</button>'
                                : ''
                        }

                        ${
                            status.isOpen
                                ? `<button class="bellum-menu-btn ${hasProgress ? '' : 'primary'}" data-action="start">⛪ Bắt đầu từ Cảnh 1</button>`
                                : `<button class="bellum-menu-btn primary" type="button" disabled>🔒 Mở lại ${nextOpenText}</button>`
                        }

                        <button class="bellum-menu-btn" data-action="intro">📖 Cốt truyện & nhân vật</button>
                        <button class="bellum-menu-btn" data-action="scenes">☷ Lịch mở 20 cảnh</button>
                        <button class="bellum-menu-btn" data-action="close">✕ Thoát</button>
                    </div>

                    <div class="bellum-menu-progress">
                        ${
                            status.isOpen
                                ? (
                                    save.completed
                                        ? `Đã hoàn thành mùa Bellum ${status.year}.`
                                        : `Tiến độ mùa ${status.year}: Cảnh ${save.scene}/20 · tiến trình đã mở tới Cảnh ${save.unlockedScene}.`
                                )
                                : 'Sự kiện sẽ tự mở lại vào tháng 11 hằng năm.'
                        }
                    </div>
                </div>

                <div class="bellum-cover-figures" aria-hidden="true">
                    <img class="bellum-cover-kael" src="${asset('Kael.png')}" alt="">
                    <img class="bellum-cover-lucifer" src="${asset('Lucifer – Kiêu Ngạo.png')}" alt="">
                </div>
            </div>`;

        screen.classList.add('is-visible');

        screen
            .querySelector('[data-action="continue"]')
            ?.addEventListener(
                'click',
                () => loadScene(
                    save.scene,
                    save.frame
                )
            );

        screen
            .querySelector('[data-action="start"]')
            ?.addEventListener(
                'click',
                () => {
                    if (
                        hasProgress &&
                        !confirm(
                            'Bắt đầu lại từ Cảnh 1? Tiến độ hiện tại vẫn có thể được mở lại từ danh sách cảnh đã mở.'
                        )
                    ) {
                        return;
                    }

                    loadScene(1, 0);
                }
            );

        screen
            .querySelector('[data-action="intro"]')
            ?.addEventListener(
                'click',
                showIntroduction
            );

        screen
            .querySelector('[data-action="scenes"]')
            ?.addEventListener(
                'click',
                showSceneList
            );

        screen
            .querySelector('[data-action="close"]')
            ?.addEventListener(
                'click',
                close
            );
    }

    function showIntroduction() {
        stopAuto();
        openRoot();
        setStoryVisible(false);
        hideScreens();
        const screen = byId('bellumIntroScreen');
        if (!screen) return;

        const status = getEventStatus();
        const introStartText = status.isOpen
            ? '⛪ Bước vào Bellum'
            : `🔒 Mở lại 01/11/${status.nextOpenYear}`;

        screen.innerHTML = `
            <div class="bellum-intro-card">
                <div class="bellum-intro-head">
                    <div>
                        <div class="bellum-menu-kicker">HỒ SƠ BELLUM · KHÔNG TIẾT LỘ KẾT THÚC</div>
                        <h2>Giới thiệu cốt truyện & nhân vật</h2>
                    </div>
                    <button type="button" class="bellum-icon-btn bellum-intro-close" data-intro-close>ĐÓNG</button>
                </div>

                <section class="bellum-story-panel">
                    <div class="bellum-story-copy">
                        <span class="bellum-intro-label">CỐT TRUYỆN</span>
                        <h3>Tiếng chuông dưới lòng đất</h3>
                        <p>Ba trăm năm trước, Cha Malach xây dựng Tu viện Bellum với tham vọng loại bỏ tội lỗi khỏi con người. Một nghi lễ nhằm tách bảy ham muốn đen tối đã thất bại, tạo ra những thực thể được gọi là <strong>Thất Đại Tội</strong> và biến Bellum thành một nơi bị chôn vùi khỏi thế giới.</p>
                        <p>Ở hiện tại, ngôi làng Edevane liên tiếp xuất hiện những cái chết kỳ lạ. Khi tiếng chuông vang lên từ khu rừng không hề có nhà thờ, thợ săn Kael lần theo dấu vết và tìm thấy cánh cửa dẫn xuống Bellum.</p>
                        <p>Bên trong tu viện, Kael gặp Lyra Malach và phải vượt qua bảy căn phòng. Mỗi căn phòng không chỉ là một cuộc đối đầu với quái vật, mà còn buộc anh nhìn thẳng vào tội lỗi, ký ức và phần bóng tối của chính mình.</p>
                    </div>
                    <div class="bellum-story-art" aria-hidden="true">
                        <img src="${asset('Kael.png')}" alt="">
                        <img src="${asset('Lyra Malach.png')}" alt="">
                    </div>
                </section>

                <div class="bellum-intro-section-title">
                    <div>
                        <span class="bellum-intro-label">NHÂN VẬT</span>
                        <h3>Những người và thực thể của Bellum</h3>
                    </div>
                    <span class="bellum-intro-count">${introCharacters.length} hồ sơ</span>
                </div>

                <div class="bellum-character-grid">
                    ${introCharacters.map(character => `
                        <article class="bellum-character-card">
                            <div class="bellum-character-portrait">
                                <img src="${asset(character.image)}" alt="${safeText(character.name)}" loading="lazy">
                            </div>
                            <div class="bellum-character-copy">
                                <small>${safeText(character.role)}</small>
                                <h4>${safeText(character.name)}</h4>
                                <p>${safeText(character.text)}</p>
                            </div>
                        </article>
                    `).join('')}
                </div>

                <div class="bellum-intro-actions">
                    <button type="button" class="bellum-menu-btn" data-intro-back>← Màn hình Bellum</button>
                    <button type="button" class="bellum-menu-btn primary" data-intro-start ${status.isOpen ? '' : 'disabled'}>${introStartText}</button>
                </div>
            </div>`;

        screen.classList.add('is-visible');
        screen.scrollTop = 0;
        screen.querySelector('[data-intro-close]')?.addEventListener('click', close);
        screen.querySelector('[data-intro-back]')?.addEventListener('click', showMenu);
        screen.querySelector('[data-intro-start]')?.addEventListener('click', () => {
            if (!status.isOpen) {
                notifySchedule(
                    `Bellum chỉ mở từ 01/11 đến 30/11 hằng năm. Lần tới: 01/11/${status.nextOpenYear}.`,
                    'warning'
                );
                return;
            }
            open();
        });
    }

    function showSceneList() {
        stopAuto();
        openRoot();
        setStoryVisible(false);
        hideScreens();

        const status = getEventStatus();
        const save = readSave();
        const screen = byId('bellumSceneScreen');

        screen.innerHTML = `
            <div class="bellum-scenes-card">
                <div class="bellum-scenes-head">
                    <div>
                        <div class="bellum-menu-kicker">LỊCH MỞ CỬA · THÁNG 11 HẰNG NĂM</div>
                        <h2 style="margin:5px 0 0">20 Cảnh của Bellum</h2>
                    </div>
                    <button class="bellum-icon-btn" data-back>←</button>
                </div>

                <div class="bellum-scene-schedule-note">
                    Mỗi cảnh chỉ có thể chơi sau ngày mở của cảnh đó và sau khi bạn đã hoàn thành các cảnh trước.
                    ${
                        status.isOpen
                            ? `Hiện tại: ${pad(status.day)}/11/${status.year} · lịch đã mở đến Cảnh ${pad(status.dateUnlockedScene)}.`
                            : `Sự kiện đang đóng · lần tới mở 01/11/${status.nextOpenYear}.`
                    }
                </div>

                <div class="bellum-scene-grid">
                    ${sceneMeta.map(meta => {
                        const releaseDay =
                            getSceneReleaseDay(
                                meta.number
                            );

                        const dateReady =
                            isSceneDateOpen(
                                meta.number,
                                status
                            );

                        const progressReady =
                            save.completed === true ||
                            meta.number <=
                                save.unlockedScene;

                        const playable =
                            status.isOpen &&
                            dateReady &&
                            progressReady;

                        const lockText =
                            getSceneLockText(
                                meta.number,
                                save,
                                status
                            );

                        const stateClass =
                            playable
                                ? 'is-playable'
                                : (
                                    !dateReady
                                        ? 'is-date-locked'
                                        : 'is-progress-locked'
                                );

                        return `
                            <button
                                class="bellum-scene-pick ${stateClass}"
                                data-scene="${meta.number}"
                                ${playable ? '' : 'disabled'}
                            >
                                <span class="bellum-scene-pick-head">
                                    <small>CẢNH ${pad(meta.number)}</small>
                                    <span class="bellum-scene-release">
                                        ${pad(releaseDay)}/11
                                    </span>
                                </span>
                                <span class="bellum-scene-pick-title">
                                    ${safeText(meta.title)}
                                </span>
                                <span class="bellum-scene-lock-reason">
                                    ${safeText(lockText)}
                                </span>
                            </button>`;
                    }).join('')}

                    ${renderCompletionRewardCard(
                        save,
                        status
                    )}
                </div>
            </div>`;

        screen.classList.add('is-visible');

        screen
            .querySelector('[data-back]')
            ?.addEventListener(
                'click',
                showMenu
            );

        screen
            .querySelectorAll('[data-scene]')
            .forEach(btn => {
                btn.addEventListener(
                    'click',
                    () => loadScene(
                        Number(btn.dataset.scene),
                        0
                    )
                );
            });

        const rewardButton =
            screen.querySelector(
                '[data-bellum-completion-reward]'
            );

        if (
            rewardButton &&
            !rewardButton.disabled
        ) {
            rewardButton.addEventListener(
                'click',
                async () => {
                    if (
                        rewardButton.dataset.claiming ===
                        '1'
                    ) {
                        return;
                    }

                    rewardButton.dataset.claiming =
                        '1';
                    rewardButton.disabled = true;
                    rewardButton.classList.add(
                        'is-claiming'
                    );

                    const reason =
                        rewardButton.querySelector(
                            '.bellum-scene-lock-reason'
                        );

                    if (reason) {
                        reason.textContent =
                            'Đang chọn phần thưởng ngẫu nhiên...';
                    }

                    await claimCompletionReward();

                    if (
                        byId('bellumSceneScreen')
                            ?.classList
                            .contains('is-visible')
                    ) {
                        showSceneList();
                    }
                }
            );
        }

        if (
            save.completed === true &&
            save.rewardClaimed !== true
        ) {
            syncCompletionRewardFromFirebase(
                status
            ).then(changed => {
                if (
                    changed &&
                    byId('bellumSceneScreen')
                        ?.classList
                        .contains('is-visible')
                ) {
                    showSceneList();
                }
            });
        }
    }

    function loadStyle(url) {
        if (loadedStyles.has(url)) return loadedStyles.get(url);
        const existing = [...document.querySelectorAll('link[rel="stylesheet"][href]')].find(link => link.href.includes(url.split('?')[0]));
        if (existing) return Promise.resolve(existing.href);
        const p = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = url; link.dataset.bellumSceneStyle = '1';
            link.onload = () => resolve(url);
            link.onerror = () => { loadedStyles.delete(url); link.remove(); reject(new Error('Không tải được CSS cảnh: ' + url)); };
            document.head.appendChild(link);
        });
        loadedStyles.set(url, p); return p;
    }

    function loadScript(url) {
        if (loadedScripts.has(url)) return loadedScripts.get(url);
        const p = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url; script.async = false; script.dataset.bellumSceneScript = '1';
            script.onload = () => resolve(url);
            script.onerror = () => { loadedScripts.delete(url); script.remove(); reject(new Error('Không tải được JS cảnh: ' + url)); };
            (document.body || document.head).appendChild(script);
        });
        loadedScripts.set(url, p); return p;
    }

    async function ensureScene(number) {
        const n = clampScene(number);
        if (registry.has(n)) return registry.get(n);
        const id = pad(n);
        await Promise.all([
            loadStyle(`${SCENE_BASE_CSS}scene-${id}.css?v=20260912.3`),
            loadScript(`${SCENE_BASE_JS}scene-${id}.js?v=20260912.3`)
        ]);
        const scene = registry.get(n);
        if (!scene) throw new Error(`Cảnh ${n} đã tải nhưng chưa đăng ký dữ liệu.`);
        return scene;
    }

    async function loadScene(number, frameIndex = 0) {
        if (state.busy) return false;

        const n = clampScene(number);
        const status = getEventStatus();
        const save = readSave();

        if (!status.isOpen) {
            notifySchedule(
                `THẤT ĐẠI TỘI: TU VIỆN BELLUM chỉ mở từ 01/11 đến 30/11 hằng năm. Lần tới: 01/11/${status.nextOpenYear}.`,
                'warning'
            );
            refreshEventCard();
            return false;
        }

        if (!isSceneDateOpen(n, status)) {
            notifySchedule(
                `Cảnh ${pad(n)} sẽ mở ngày ${formatBellumDate(
                    getSceneReleaseDay(n),
                    status.year
                )}.`,
                'warning'
            );
            return false;
        }

        if (
            save.completed !== true &&
            n > save.unlockedScene
        ) {
            notifySchedule(
                n <= 1
                    ? 'Cảnh này chưa được mở.'
                    : `Hãy hoàn thành Cảnh ${pad(n - 1)} trước.`,
                'warning'
            );
            return false;
        }

        state.busy = true;
        stopAuto();
        openRoot();
        hideScreens();
        setStoryVisible(true);

        try {
            const scene = await ensureScene(n);
            state.scene = scene;
            state.sceneNumber = n;
            state.frameIndex = Math.max(
                0,
                Math.min(
                    Number(frameIndex) || 0,
                    Math.max(
                        0,
                        scene.frames.length - 1
                    )
                )
            );
            state.lastPortrait = '';
            state.lastSide = 'right';

            const root = byId('bellumEvent');

            [...root.classList]
                .filter(c =>
                    /^bellum-scene-\d+$/.test(c)
                )
                .forEach(c =>
                    root.classList.remove(c)
                );

            root.classList.add(
                `bellum-scene-${pad(n)}`
            );

            applySceneAmbience(n);
            applySceneBackground(scene, state.frameIndex);

            byId('bellumSceneNumber')
                .textContent =
                `${scene.act || 'THẤT ĐẠI TỘI'} · CẢNH ${pad(n)}`;

            byId('bellumSceneTitle')
                .textContent =
                scene.title;

            if (state.frameIndex === 0) {
                showSceneStinger(scene);
            }

            renderFrame();

            const currentSave = readSave();

            writeSave({
                scene: n,
                frame: state.frameIndex,
                unlockedScene:
                    Math.max(
                        currentSave.unlockedScene,
                        n
                    )
            });

            /*
             * Chỉ preload cảnh kế tiếp nếu lịch ngày đã cho phép.
             * Như vậy file cảnh tương lai cũng không bị kéo xuống sớm.
             */
            if (
                n < sceneMeta.length &&
                isSceneDateOpen(
                    n + 1,
                    status
                )
            ) {
                setTimeout(
                    () => ensureScene(n + 1)
                        .catch(() => {}),
                    1200
                );
            }

            return true;
        } catch (error) {
            console.error(
                '[BellumEvent] Không tải được cảnh:',
                error
            );

            window.showToast?.(
                'Không tải được cảnh Bellum. Kiểm tra các file js/css của cảnh.',
                'error'
            );

            showMenu();
            return false;
        } finally {
            state.busy = false;
        }
    }

    function renderFrame() {
        const scene = state.scene;
        if (!scene || !scene.frames.length) return;
        const frame = scene.frames[state.frameIndex];
        applySceneBackground(scene, state.frameIndex);
        applyFrameCinematics(
            scene,
            frame,
            state.frameIndex
        );
        const speaker = byId('bellumSpeaker');
        const text = byId('bellumText');
        const portrait = byId('bellumPortrait');
        const portraitWrap = byId('bellumPortraitWrap');
        const total = scene.frames.length;
        const percent = Math.max(1, ((state.frameIndex + 1) / total) * 100);
        byId('bellumProgressFill').style.width = `${percent}%`;

        if (frame.type === 'dialogue') {
            speaker.textContent = frame.speaker || '';
            text.textContent = frame.text || '';
            if (frame.image) {
                const src = asset(frame.image);
                if (portrait.getAttribute('src') !== src) portrait.src = src;
                portrait.alt = frame.speaker || 'Nhân vật';
                portrait.classList.add('is-visible');
                portrait.classList.remove('is-narration');
                state.lastPortrait = src;
                state.lastSide = frame.side || 'right';
            } else if (state.lastPortrait) {
                portrait.classList.add('is-visible', 'is-narration');
            } else {
                portrait.classList.remove('is-visible');
            }
        } else {
            speaker.textContent = 'DẪN TRUYỆN';
            text.textContent = frame.text || '';
            if (state.lastPortrait) portrait.classList.add('is-visible', 'is-narration');
            else portrait.classList.remove('is-visible');
        }
        portraitWrap.classList.toggle('is-left', state.lastSide === 'left');
        portraitWrap.classList.toggle('is-right', state.lastSide !== 'left');
        portrait.onerror = () => { portrait.classList.remove('is-visible'); portrait.onerror = null; };
        writeSave({ scene: state.sceneNumber, frame: state.frameIndex });
        scheduleAuto();
    }

    function nextFrame() {
        if (state.busy || !state.scene) return;

        const status = getEventStatus();
        if (!status.isOpen) {
            notifySchedule(
                `Bellum đã đóng. Sự kiện sẽ mở lại vào 01/11/${status.nextOpenYear}.`,
                'warning'
            );
            close();
            refreshEventCard();
            return;
        }

        if (state.frameIndex < state.scene.frames.length - 1) {
            state.frameIndex += 1;
            renderFrame();
            return;
        }
        completeScene();
    }

    function completeScene() {
        stopAuto();
        setStoryVisible(false);
        hideScreens();

        const finished = state.sceneNumber;
        const isLast =
            finished >= sceneMeta.length;

        const next =
            Math.min(
                sceneMeta.length,
                finished + 1
            );

        const status = getEventStatus();
        const save = readSave();

        const nextSave = writeSave({
            scene:
                isLast
                    ? finished
                    : next,
            frame: 0,
            unlockedScene:
                Math.max(
                    save.unlockedScene,
                    next
                ),
            completed:
                isLast
                    ? true
                    : save.completed
        });

        const nextDateReady =
            !isLast &&
            isSceneDateOpen(
                next,
                status
            );

        const nextPlayable =
            !isLast &&
            canPlayScene(
                next,
                nextSave,
                status
            );

        let message;

        if (isLast) {
            message =
                'Bạn đã đi hết 20 cảnh của THẤT ĐẠI TỘI: TU VIỆN BELLUM. Phần thưởng hoàn thành đã được mở trong Danh sách cảnh.';
        } else if (nextDateReady) {
            message =
                `Cảnh ${pad(next)} đã được mở khóa: ${safeText(
                    sceneMeta[next - 1].title
                )}`;
        } else {
            message =
                `Bạn đã hoàn tất Cảnh ${pad(finished)}. ` +
                `Cảnh ${pad(next)} sẽ mở ngày ` +
                `${formatBellumDate(
                    getSceneReleaseDay(next),
                    status.year
                )}.`;
        }

        const screen =
            byId('bellumCompleteScreen');

        screen.innerHTML = `
            <div class="bellum-complete-card">
                <div class="bellum-menu-kicker">
                    ${
                        isLast
                            ? 'KẾT'
                            : `CẢNH ${pad(finished)} HOÀN TẤT`
                    }
                </div>

                <h2>
                    ${
                        isLast
                            ? 'Bình minh đã đến Edevane'
                            : safeText(state.scene.title)
                    }
                </h2>

                <p>${safeText(message)}</p>

                ${
                    !isLast && !nextDateReady
                        ? `<div class="bellum-next-release">
                            🔒 Cảnh ${pad(next)} · Mở ${formatBellumDate(
                                getSceneReleaseDay(next),
                                status.year
                            )}
                           </div>`
                        : ''
                }

                <div
                    class="bellum-menu-actions"
                    style="justify-content:center"
                >
                    ${
                        nextPlayable
                            ? '<button class="bellum-menu-btn primary" data-next>Tiếp tục Cảnh ' + pad(next) + ' →</button>'
                            : ''
                    }

                    <button class="bellum-menu-btn" data-scenes>
                        ☷ Danh sách cảnh
                    </button>

                    <button class="bellum-menu-btn" data-menu>
                        ⌂ Màn hình chính
                    </button>
                </div>
            </div>`;

        screen.classList.add('is-visible');

        screen
            .querySelector('[data-next]')
            ?.addEventListener(
                'click',
                () => loadScene(next, 0)
            );

        screen
            .querySelector('[data-scenes]')
            ?.addEventListener(
                'click',
                showSceneList
            );

        screen
            .querySelector('[data-menu]')
            ?.addEventListener(
                'click',
                showMenu
            );

        refreshEventCard();
    }

    function scheduleAuto() {
        clearTimeout(state.autoTimer);
        state.autoTimer = null;
        if (!state.auto || !state.scene || byId('bellumDialogueWrap')?.hidden) return;
        state.autoTimer = setTimeout(nextFrame, AUTO_DELAY);
    }
    function stopAuto() {
        clearTimeout(state.autoTimer); state.autoTimer = null;
        state.auto = false;
        byId('bellumBtnAuto')?.classList.remove('is-active');
    }
    function toggleAuto() {
        state.auto = !state.auto;
        byId('bellumBtnAuto')?.classList.toggle('is-active', state.auto);
        scheduleAuto();
    }

    function close() {
        clearTransientCinematics();
        stopAuto();
        const root = byId('bellumEvent');
        root?.classList.remove('is-open');
        document.body.classList.remove('bellum-event-open');
        state.opened = false;
    }

    function refreshEventCard() {
        const card = byId('bellumEventCard');
        if (!card) return false;

        const status = getEventStatus();

        card.classList.toggle(
            'is-season-open',
            status.isOpen
        );

        card.classList.toggle(
            'is-season-locked',
            !status.isOpen
        );

        const copy =
            card.querySelector(
                '.bellum-card-copy'
            );

        let scheduleLine =
            card.querySelector(
                '.bellum-card-schedule'
            );

        if (!scheduleLine && copy) {
            scheduleLine =
                document.createElement('div');

            scheduleLine.className =
                'bellum-card-schedule';

            copy.appendChild(scheduleLine);
        }

        if (scheduleLine) {
            if (status.isOpen) {
                scheduleLine.innerHTML = `
                    <strong>🕯️ Đang mở · Tháng 11/${status.year}</strong>
                    <span>
                        Lịch đã mở đến Cảnh ${pad(status.dateUnlockedScene)}/20.
                        ${
                            status.nextReleaseScene
                                ? `Cảnh ${pad(status.nextReleaseScene)} mở ${pad(status.nextReleaseDay)}/11.`
                                : 'Toàn bộ 20 cảnh đã mở.'
                        }
                    </span>`;
            } else {
                scheduleLine.innerHTML = `
                    <strong>🔒 Sự kiện tháng 11 hằng năm</strong>
                    <span>
                        Mở từ 01/11 đến 30/11 · Lần tới:
                        01/11/${status.nextOpenYear}.
                    </span>`;
            }
        }

        const playButton =
            [...card.querySelectorAll(
                '.bellum-card-button'
            )]
                .find(button =>
                    !button.classList.contains(
                        'bellum-card-button-info'
                    )
                );

        if (playButton) {
            playButton.disabled =
                !status.isOpen;

            playButton.setAttribute(
                'aria-disabled',
                status.isOpen
                    ? 'false'
                    : 'true'
            );

            playButton.textContent =
                status.isOpen
                    ? 'Bước vào Bellum ➡️'
                    : `🔒 Mở 01/11/${status.nextOpenYear}`;
        }

        return true;
    }

    async function open() {
        if (window.currentActiveExamId) {
            window.showExamLockWarning?.(
                '⚠️ Bạn đang làm bài thi, không thể tham gia sự kiện lúc này!'
            );
            return false;
        }

        const status = getEventStatus();

        if (!status.isOpen) {
            notifySchedule(
                `THẤT ĐẠI TỘI: TU VIỆN BELLUM chỉ mở từ 01/11 đến 30/11 hằng năm. Lần tới: 01/11/${status.nextOpenYear}.`,
                'warning'
            );

            refreshEventCard();
            return false;
        }

        /*
         * readSave() sẽ tự tạo mùa mới khi bước sang tháng 11 của năm mới.
         */
        readSave();
        showMenu();
        return true;
    }

    window.BellumEvent = Object.freeze({
        version: VERSION,
        open,
        close,
        showMenu,
        showIntroduction,
        showSceneList,
        loadScene,
        next: nextFrame,
        getProgress: readSave,
        claimCompletionReward,
        syncCompletionReward:
            syncCompletionRewardFromFirebase,
        getRegularRewardItems() {
            return getRegularSevenSinsItems()
                .map(item => ({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    tag: item.tag
                }));
        },
        getSchedule() {
            const status = getEventStatus();
            return {
                month: EVENT_MONTH,
                startDay: EVENT_START_DAY,
                endDay: EVENT_END_DAY,
                releaseDays: [...SCENE_RELEASE_DAYS],
                status: { ...status }
            };
        },
        refreshSchedule: refreshEventCard,
        resetProgress() {
            try {
                localStorage.removeItem(SAVE_KEY);
            } catch (_) {}

            if (getEventStatus().isOpen) {
                readSave();
            }

            showMenu();
        }
    });

    /*
     * Đồng bộ trạng thái thẻ sự kiện ngay khi module Bellum được lazy-load.
     * Sau đó cập nhật mỗi phút để nếu trang mở qua 00:00, lịch tự thay đổi.
     */
    refreshEventCard();
    refreshServerTimeOffset();

    if (!scheduleRefreshTimer) {
        scheduleRefreshTimer = setInterval(
            refreshEventCard,
            60 * 1000
        );
    }
})();
