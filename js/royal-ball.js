// js/royal-ball.js

const RoyalBallEvent = {
    isDancing: false,
    defaultSettings: { probItem: 5, probCoin: 95, isEnabled: true, useCustomDates: false, startDate: '', endDate: '' },
    currentSettings: null,

    updateStudentEventCard: function (settings) {
        const card =
            document.getElementById('royalEventCard');

        const joinButton =
            document.getElementById('btnRoyalJoin');

        const description =
            document.getElementById('royalEventDesc');

        /*
         * Trang giáo viên có thể không có các thẻ này.
         */
        if (!card || !joinButton || !description) {
            return;
        }

        const safeSettings = {
            ...this.defaultSettings,
            ...(settings || {})
        };

        this.currentSettings = safeSettings;

        const now = new Date();

        const formatDate = dateString => {
            if (!dateString) return '';

            const parts =
                String(dateString).split('-');

            if (parts.length !== 3) {
                return dateString;
            }

            return (
                `${parts[2]}/` +
                `${parts[1]}/` +
                `${parts[0]}`
            );
        };

        let eventState = 'locked';
        let ribbonText = 'ĐANG KHÓA';
        let buttonText = '🔒 Sự kiện đang khóa';
        let descriptionText =
            'Giáo viên đang tạm khóa Dạ Hội Hoàng Gia.';

        let canJoin = false;

        /*
         * Ưu tiên số 1:
         * Giáo viên đã bấm khóa thủ công.
         */
        if (safeSettings.isEnabled === false) {
            eventState = 'locked';
            ribbonText = '🔒 ĐANG KHÓA';
            buttonText = '🔒 Giáo viên đã khóa';

            descriptionText =
                'Sự kiện đang được Giáo viên tạm khóa. ' +
                'Vui lòng quay lại sau.';
        } else if (this.isEventActive()) {
            /*
             * Giáo viên bật và hiện tại đúng lịch.
             */
            eventState = 'open';
            ribbonText = '♛ ĐANG MỞ CỬA';
            buttonText = 'Tham gia ngay ➡️';
            canJoin = true;

            if (
                safeSettings.useCustomDates &&
                safeSettings.startDate &&
                safeSettings.endDate
            ) {
                descriptionText =
                    `Dạ hội đang mở từ ` +
                    `${formatDate(safeSettings.startDate)} ` +
                    `đến ` +
                    `${formatDate(safeSettings.endDate)}. ` +
                    `Khiêu vũ để nhận Coin hoặc vật phẩm ` +
                    `Truyền Thuyết.`;
            } else {
                descriptionText =
                    'Dạ hội đang mở! Khiêu vũ để nhận ' +
                    'Coin hoặc vật phẩm Truyền Thuyết. ' +
                    '(29/07 – 01/08)';
            }
        } else if (
            safeSettings.useCustomDates &&
            safeSettings.startDate &&
            safeSettings.endDate
        ) {
            /*
             * Giáo viên bật nhưng lịch tùy chỉnh
             * chưa tới hoặc đã hết.
             */
            const startDate = new Date(
                safeSettings.startDate +
                'T00:00:00'
            );

            const endDate = new Date(
                safeSettings.endDate +
                'T23:59:59'
            );

            if (now < startDate) {
                eventState = 'upcoming';
                ribbonText = '⏳ CHƯA ĐẾN LỊCH';
                buttonText = '⏳ Chưa đến ngày mở';

                descriptionText =
                    `Dạ hội sẽ mở từ ` +
                    `${formatDate(safeSettings.startDate)} ` +
                    `đến ` +
                    `${formatDate(safeSettings.endDate)}.`;
            } else if (now > endDate) {
                eventState = 'ended';
                ribbonText = '⌛ ĐÃ KẾT THÚC';
                buttonText = '⌛ Sự kiện đã kết thúc';

                descriptionText =
                    `Dạ hội đã kết thúc vào ngày ` +
                    `${formatDate(safeSettings.endDate)}.`;
            }
        } else {
            /*
             * Lịch mặc định nhưng hiện tại không nằm
             * trong ngày 29/07 – 01/08.
             */
            eventState = 'upcoming';
            ribbonText = '⏳ CHƯA ĐẾN LỊCH';
            buttonText = '⏳ Chưa đến ngày mở';

            descriptionText =
                'Sự kiện sẽ mở từ ngày 29/07 ' +
                'đến hết ngày 01/08 hằng năm.';
        }

        card.dataset.eventState = eventState;
        card.dataset.ribbonText = ribbonText;

        joinButton.disabled = !canJoin;
        joinButton.innerHTML = buttonText;

        description.textContent = descriptionText;

        /*
         * Cập nhật title để người dùng rê chuột
         * cũng biết trạng thái.
         */
        joinButton.title = canJoin
            ? 'Bấm để tham gia Dạ Hội Hoàng Gia'
            : descriptionText;
    },

    uiEnhanced: false,

    formatEventDate: function (dateString) {
        if (!dateString) return '';

        const parts = String(dateString).split('-');

        if (parts.length !== 3) {
            return dateString;
        }

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },

    updateEventSchedule: function (settings) {
        const schedule =
            document.getElementById('royalEventSchedule');

        if (!schedule) return;

        if (
            settings &&
            settings.useCustomDates &&
            settings.startDate &&
            settings.endDate
        ) {
            schedule.innerHTML =
                `🗓️ Dạ hội mở từ ` +
                `<strong>${this.formatEventDate(settings.startDate)}</strong> ` +
                `đến ` +
                `<strong>${this.formatEventDate(settings.endDate)}</strong>`;
        } else {
            schedule.innerHTML =
                '🗓️ Lịch hoàng gia: ' +
                '<strong>29/07 – 01/08 hằng năm</strong>';
        }
    },

    enhanceUI: function () {
        const modal =
            document.getElementById('royalBallModal');

        if (!modal) return;

        const content =
            modal.querySelector('.modal-content') ||
            modal.firstElementChild;

        if (!content) return;

        modal.classList.add('royal-ball-premium');
        content.classList.add('royal-premium-shell');

        /*
         * Thêm ánh sáng, vương miện và bụi phép.
         * Chỉ thêm một lần.
         */
        if (!content.querySelector('.royal-atmosphere')) {
            const particles = Array.from(
                { length: 20 },
                (_, index) => {
                    const x = 5 + ((index * 37) % 90);
                    const y = 8 + ((index * 53) % 82);
                    const size = 2 + (index % 4);
                    const duration = 5 + (index % 6);
                    const delay =
                        -((index * 0.47) % 5).toFixed(2);

                    const color =
                        index % 3 === 0
                            ? '#fff3b4'
                            : index % 3 === 1
                                ? '#c998ff'
                                : '#8be3ff';

                    return `
                    <span
                        class="royal-particle"
                        style="
                            --x:${x}%;
                            --y:${y}%;
                            --size:${size}px;
                            --duration:${duration}s;
                            --delay:${delay}s;
                            --color:${color};
                        "
                    ></span>
                `;
                }
            ).join('');

            content.insertAdjacentHTML(
                'afterbegin',
                `
                <div
                    class="royal-atmosphere"
                    aria-hidden="true"
                >
                    <div class="royal-light-halo"></div>

                    <div class="royal-particle-field">
                        ${particles}
                    </div>
                </div>

                <div
                    class="royal-orbit-crown"
                    aria-hidden="true"
                >
                    ♛
                </div>
            `
            );
        }

        const wrapper =
            modal.querySelector('.royal-content-wrapper') ||
            content;

        wrapper.classList.add('royal-content-wrapper');

        const firstTitle = wrapper.querySelector('h3');

        if (
            firstTitle &&
            !wrapper.querySelector('.royal-event-kicker')
        ) {
            firstTitle.insertAdjacentHTML(
                'beforebegin',
                `
                <div class="royal-event-kicker">
                    ✦ Thiệp mời độc quyền ✦
                </div>
            `
            );

            firstTitle.insertAdjacentHTML(
                'afterend',
                `
                <p class="royal-subtitle">
                    Bước vào đại sảnh ánh vàng,
                    hoàn thành điệu Waltz 10 giây
                    và nhận món quà bí mật từ Hoàng gia.
                </p>

                <div
                    class="royal-event-schedule"
                    id="royalEventSchedule"
                ></div>
            `
            );
        }

        if (firstTitle) {
            firstTitle.classList.add('royal-main-title');
        }

        const floor =
            document.getElementById('royalDanceFloor');

        if (floor) {
            floor.classList.add('royal-dance-stage');

            if (!floor.querySelector('.royal-floor-monogram')) {
                floor.insertAdjacentHTML(
                    'afterbegin',
                    `
                    <div
                        class="royal-floor-monogram"
                        aria-hidden="true"
                    >
                        R
                    </div>
                `
                );
            }
        }

        const status =
            document.getElementById('royalDanceStatus');

        if (status) {
            status.classList.add('royal-dance-status');
        }

        const resultBox =
            document.getElementById('royalBallResult');

        if (resultBox) {
            resultBox.classList.add('royal-result-box');
        }

        const button =
            document.getElementById('btnStartDance');

        if (button) {
            button.classList.add('royal-start-button');

            button.innerHTML = `
    <span class="royal-button-crown">♛</span>
    <span>Bắt đầu điệu Waltz · 5 Coin</span>
`;
        }

        /*
         * Thêm thanh tiến trình trước nút bắt đầu.
         */
        if (
            !document.getElementById('royalDanceProgress')
        ) {
            const progress =
                document.createElement('div');

            progress.id = 'royalDanceProgress';
            progress.className = 'royal-progress-panel';

            progress.innerHTML = `
            <div class="royal-progress-meta">
                <span id="royalProgressLabel">
                    Sẵn sàng bước vào điệu nhảy
                </span>

                <strong id="royalProgressTime">
                    10 giây
                </strong>
            </div>

            <div class="royal-progress-track">
                <div
                    class="royal-progress-bar"
                    id="royalProgressBar"
                ></div>
            </div>
        `;

            if (button && button.parentNode) {
                button.parentNode.insertBefore(
                    progress,
                    button
                );
            } else {
                wrapper.appendChild(progress);
            }
        }

        this.uiEnhanced = true;

        this.updateEventSchedule(
            this.currentSettings || this.defaultSettings
        );
    },

    setDanceProgress: function (
        percent,
        timeLeft,
        label
    ) {
        const bar =
            document.getElementById('royalProgressBar');

        const time =
            document.getElementById('royalProgressTime');

        const text =
            document.getElementById('royalProgressLabel');

        if (bar) {
            bar.style.width =
                `${Math.max(0, Math.min(100, percent))}%`;
        }

        if (time) {
            time.textContent =
                timeLeft > 0
                    ? `${timeLeft} giây`
                    : 'Hoàn tất';
        }

        if (text && label) {
            text.textContent = label;
        }
    },

    resetDanceUI: function () {
        const modal =
            document.getElementById('royalBallModal');

        const floor =
            document.getElementById('royalDanceFloor');

        const status =
            document.getElementById('royalDanceStatus');

        const resultBox =
            document.getElementById('royalBallResult');

        const button =
            document.getElementById('btnStartDance');

        if (modal) {
            modal.classList.remove(
                'royal-is-dancing',
                'royal-reward-revealed'
            );
        }

        if (floor) {
            floor.classList.remove('dancing');
        }

        if (status) {
            status.style.display = 'none';
        }

        if (resultBox) {
            resultBox.style.display = 'none';

            resultBox
                .querySelectorAll('.royal-burst-particle')
                .forEach(node => node.remove());
        }

        if (button) {
            button.style.display = 'inline-flex';
            button.disabled = false;
        }

        this.setDanceProgress(
            0,
            10,
            'Sẵn sàng bước vào điệu nhảy'
        );
    },

    createCelebrationBurst: function (rewardType) {
        const resultBox =
            document.getElementById('royalBallResult');

        if (!resultBox) return;

        const colors =
            rewardType === 'item'
                ? [
                    '#ffe58f',
                    '#c084fc',
                    '#7dd3fc',
                    '#ffffff'
                ]
                : [
                    '#ffe58f',
                    '#fbbf24',
                    '#fff7c2',
                    '#d89b2b'
                ];

        for (let index = 0; index < 26; index++) {
            const particle =
                document.createElement('span');

            particle.className =
                'royal-burst-particle';

            particle.style.setProperty(
                '--bang',
                `${index * (360 / 26)}deg`
            );

            particle.style.setProperty(
                '--bdistance',
                `${55 + Math.random() * 105}px`
            );

            particle.style.setProperty(
                '--bsize',
                `${3 + Math.random() * 6}px`
            );

            particle.style.setProperty(
                '--bcolor',
                colors[index % colors.length]
            );

            particle.style.setProperty(
                '--bdelay',
                `${Math.random() * 0.18}s`
            );

            resultBox.appendChild(particle);

            setTimeout(
                () => particle.remove(),
                1600
            );
        }
    },

    isEventActive: function () {
        const now = new Date();

        // LUỒNG 1: Nếu giáo viên bật thời gian tùy chỉnh
        if (this.currentSettings && this.currentSettings.useCustomDates && this.currentSettings.startDate && this.currentSettings.endDate) {
            const start = new Date(this.currentSettings.startDate + "T00:00:00");
            const end = new Date(this.currentSettings.endDate + "T23:59:59");
            return now >= start && now <= end;
        }

        // LUỒNG 2: Lịch mặc định (29/07 -> 01/05 năm sau)
        const month = now.getMonth();
        const date = now.getDate();

        // Mở từ 29/07 đến hết tháng 7
        if (month === 6 && date >= 29) return true;
        // Mở vào ngày 01/08
        if (month === 7 && date === 1) return true;

        return false;
    },

    /*
     * Tạo dữ liệu thông báo cho hệ thống
     * sự kiện giới hạn thời gian.
     */
    buildLimitedEventAnnouncement: function (settings) {
        const safeSettings = {
            ...this.defaultSettings,
            ...(settings || {})
        };

        const eventData = {
            name: '🏰 Dạ Hội Hoàng Gia đã mở cửa!',

            desc:
                'Dạ Hội Hoàng Gia đang diễn ra. ' +
                'Hãy tham gia khiêu vũ để nhận Coin ' +
                'hoặc vật phẩm Truyền Thuyết cực hiếm!',

            /*
             * Vị trí thẻ Dạ Hội trên trang học sinh.
             */
            targetClass: 'royal-event-card',
            targetSelector: '#royalEventCard',

            /*
             * Giáo viên khóa Dạ Hội thì
             * thông báo cũng tự tắt.
             */
            isOpen:
                safeSettings.isEnabled !== false,

            /*
             * Đây là sự kiện giới hạn thời gian,
             * không phải sự kiện mở vô hạn.
             */
            isUnlimited: false,
            announcementEnabled: true,

            /*
             * Số càng lớn thì càng ưu tiên
             * hiện thông báo trước.
             */
            priority: 100,

            updatedAt:
                firebase.database
                    .ServerValue.TIMESTAMP
        };

        /*
         * Giáo viên bật lịch tùy chỉnh.
         */
        if (
            safeSettings.useCustomDates &&
            safeSettings.startDate &&
            safeSettings.endDate
        ) {
            eventData.scheduleType = 'limited';

            eventData.startDate =
                safeSettings.startDate;

            eventData.endDate =
                safeSettings.endDate;
        } else {
            /*
             * Lịch mặc định:
             * lặp lại từ 29/07 đến 01/08 hằng năm.
             */
            eventData.scheduleType = 'annual';

            eventData.startMonthDay = '07-29';
            eventData.endMonthDay = '08-01';
        }

        return eventData;
    },

    // ==========================================
    // PHẦN LOGIC DÀNH CHO HỌC SINH
    // ==========================================
    openModal: async function () {
        if (typeof window.isGameEnabled !== 'undefined' && window.isGameEnabled === false) {
            return alert("🔒 Khu vực giải trí đang bị Giáo viên tạm khóa chung!");
        }

        try {
            const snap = await db.ref('game_settings/royal_ball').once('value');
            const settings = snap.exists() ? snap.val() : this.defaultSettings;
            this.currentSettings = settings;

            // 1. Kiểm tra lệnh Khóa/Mở thủ công của giáo viên (Nút đỏ/xanh)
            if (settings.isEnabled === false) {
                return alert("🔒 Sự kiện Dạ Hội Hoàng Gia hiện đã bị Giáo viên ĐÓNG. Học sinh tạm thời không thể truy cập lúc này!");
            }

            // 2. Kiểm tra điều kiện thời gian
            if (!this.isEventActive()) {
                if (settings.useCustomDates) {
                    return alert(`⚠️ Sự kiện đang trong chế độ Lịch Tùy Chỉnh nhưng hiện tại không nằm trong thời gian cho phép.\n(Mở từ: ${settings.startDate} đến ${settings.endDate})`);
                } else {
                    return alert("⚠️ Sự kiện Dạ Hội Hoàng Gia chỉ mở cửa từ ngày 29/07 đến 01/08 hằng năm. Hẹn gặp lại bạn sau nhé!");
                }
            }

            // Mở Modal nếu pass hết điều kiện
            const modal = document.getElementById('royalBallModal');
            if (!modal) return alert("❌ Lỗi HTML: Không tìm thấy khung giao diện sự kiện (royalBallModal)!");

            this.enhanceUI();
            this.updateEventSchedule(settings);
            this.resetDanceUI();

            modal.classList.add('active');

            document.getElementById(
                'royalBallResult'
            ).style.display = 'none';

            document.getElementById(
                'btnStartDance'
            ).style.display = 'inline-flex';

        } catch (error) {
            alert("❌ Lỗi kết nối Firebase khi tải cấu hình sự kiện: " + error.message);
        }
    },

    closeModal: function () {
        if (this.isDancing) return;

        const modal =
            document.getElementById('royalBallModal');

        if (modal) {
            modal.classList.remove(
                'active',
                'royal-is-dancing',
                'royal-reward-revealed'
            );
        }

        this.resetDanceUI();
    },

    startDance: async function () {
        if (this.isDancing) return;

        // --- BẮT ĐẦU: LOGIC KIỂM TRA GIỚI HẠN 1 LẦN / NGÀY ---
        const serverOffsetSnap = await db
            .ref('.info/serverTimeOffset')
            .once('value');

        const serverOffset = Number(serverOffsetSnap.val()) || 0;
        const serverNow = Date.now() + serverOffset;

        const today = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(serverNow));

        const limitRef = db.ref(
            `royal_ball_limits/${currentUser.username}`
        );

        try {
            let alreadyJoined = false;

            const result = await limitRef.transaction(currentData => {
                if (
                    currentData &&
                    currentData.lastDate === today
                ) {
                    alreadyJoined = true;
                    return;
                }

                return {
                    lastDate: today,
                    lastPlayedAt:
                        firebase.database.ServerValue.TIMESTAMP
                };
            });

            if (!result.committed) {
                if (alreadyJoined) {
                    alert(
                        '⏳ Bạn đã tham gia khiêu vũ hôm nay rồi! ' +
                        'Hãy quay lại vào ngày mai nhé.'
                    );
                } else {
                    alert(
                        '❌ Không thể ghi nhận lượt tham gia. ' +
                        'Vui lòng thử lại.'
                    );
                }

                return;
            }
        } catch (error) {
            console.error('Lỗi kiểm tra ngày:', error);

            if (
                error.code === 'PERMISSION_DENIED' ||
                error.code === 'permission_denied'
            ) {
                alert(
                    '❌ Firebase Rules chưa cấp quyền cho royal_ball_limits.'
                );
            } else {
                alert(
                    '❌ Lỗi kiểm tra dữ liệu máy chủ, vui lòng thử lại sau!'
                );
            }

            return;
        }
        // --- KẾT THÚC: LOGIC KIỂM TRA ---

        // =====================================================
        // PHÍ KHIÊU VŨ: 5 COIN / 1 LẦN
        // =====================================================
        const DANCE_ENTRY_FEE = 5;

        const danceCoinRef = db.ref(
            `student_coins/${currentUser.username}`
        );

        let currentDanceCoins = 0;

        try {
            const feeTransaction =
                await danceCoinRef.transaction(currentValue => {
                    currentDanceCoins =
                        Number(currentValue) || 0;

                    // Không đủ Coin thì hủy transaction.
                    if (
                        currentDanceCoins <
                        DANCE_ENTRY_FEE
                    ) {
                        return;
                    }

                    return (
                        currentDanceCoins -
                        DANCE_ENTRY_FEE
                    );
                });

            if (!feeTransaction.committed) {
                /*
                 * Đã giữ lượt trong ngày nhưng không đủ Coin,
                 * vì vậy phải xóa lượt để học sinh có thể
                 * quay lại sau khi kiếm đủ Coin.
                 */
                await limitRef.remove();

                alert(
                    `🪙 Bạn cần ${DANCE_ENTRY_FEE} Coin để khiêu vũ.\n` +
                    `Số dư hiện tại: ${currentDanceCoins} Coin.`
                );

                return;
            }
        } catch (error) {
            console.error(
                'Lỗi trừ phí khiêu vũ:',
                error
            );

            /*
             * Trừ Coin lỗi thì hoàn lại lượt trong ngày.
             */
            try {
                await limitRef.remove();
            } catch (rollbackError) {
                console.error(
                    'Không thể hoàn lại lượt Dạ hội:',
                    rollbackError
                );
            }

            alert(
                '❌ Không thể thanh toán phí khiêu vũ. ' +
                'Vui lòng thử lại!'
            );

            return;
        }


        this.enhanceUI();
        this.isDancing = true;

        const modal =
            document.getElementById('royalBallModal');

        const btn =
            document.getElementById('btnStartDance');

        const floor =
            document.getElementById('royalDanceFloor');

        const status =
            document.getElementById('royalDanceStatus');

        if (!btn || !floor || !status) {
            this.isDancing = false;

            // Hoàn lại lượt trong ngày.
            await limitRef.remove();

            // Hoàn lại 5 Coin.
            await danceCoinRef.transaction(
                currentValue =>
                    (Number(currentValue) || 0) +
                    DANCE_ENTRY_FEE
            );

            return alert(
                '❌ Giao diện Dạ hội chưa tải đầy đủ. ' +
                'Hệ thống đã hoàn lại 5 Coin.'
            );
        }

        if (modal) {
            modal.classList.add('royal-is-dancing');
        }

        btn.disabled = true;
        btn.style.display = 'none';

        status.style.display = 'block';
        status.innerText =
            '🎼 Khúc nhạc mở màn đang vang lên...';

        /*
         * Khởi động lại animation ngay cả khi
         * người dùng vừa mở lại modal.
         */
        floor.classList.remove('dancing');
        void floor.offsetWidth;
        floor.classList.add('dancing');

        const danceMessages = [
            'Cánh cửa đại sảnh vừa mở...',
            'Bước chân đầu tiên trên sàn gương...',
            'Hai vũ công tiến gần nhau...',
            'Điệu Waltz bắt đầu hòa nhịp...',
            'Ánh đèn vàng đang xoay theo âm nhạc...',
            'Một vòng xoay thật duyên dáng...',
            'Điệu nhảy bước vào cao trào...',
            'Khoảnh khắc hoàng gia rực sáng...',
            'Chuẩn bị cho cú chào kết thúc...',
            'Điệu Waltz đã hoàn thành!'
        ];

        let timeLeft = 10;

        this.setDanceProgress(
            0,
            timeLeft,
            danceMessages[0]
        );

        const timer = setInterval(() => {
            timeLeft--;

            const elapsed = 10 - timeLeft;
            const percent = elapsed * 10;

            const message =
                danceMessages[
                Math.min(
                    elapsed,
                    danceMessages.length - 1
                )
                ];

            status.innerText = `🎵 ${message}`;

            this.setDanceProgress(
                percent,
                timeLeft,
                message
            );
        }, 1000);

        setTimeout(async () => {
            clearInterval(timer);

            this.setDanceProgress(
                100,
                0,
                'Điệu Waltz hoàn tất — đang mở quà...'
            );

            status.innerText =
                '✨ Điệu Waltz hoàn tất — ' +
                'đang mở quà Hoàng gia...';

            floor.classList.remove('dancing');

            try {
                await this.calculateReward();

                status.style.display = 'none';

                if (modal) {
                    modal.classList.remove(
                        'royal-is-dancing'
                    );

                    modal.classList.add(
                        'royal-reward-revealed'
                    );
                }
            } catch (error) {
                console.error(
                    'Lỗi trao thưởng Dạ hội:',
                    error
                );

                try {
                    await limitRef.remove();
                    await danceCoinRef.transaction(
                        currentValue =>
                            (Number(currentValue) || 0) +
                            DANCE_ENTRY_FEE
                    );
                } catch (rollbackError) {
                    console.error(
                        'Không thể hoàn lại lượt Dạ hội:',
                        rollbackError
                    );
                }

                this.setDanceProgress(
                    0,
                    10,
                    'Trao thưởng lỗi — lượt đã được hoàn lại'
                );

                alert(
                    '❌ Trao thưởng thất bại. ' +
                    'Hệ thống đã mở lại lượt để bạn thử lại.'
                );
            } finally {
                this.isDancing = false;
                btn.disabled = false;
            }
        }, 10000);
    },

    calculateReward: async function () {
        const resultBox =
            document.getElementById('royalBallResult');

        if (!resultBox) {
            throw new Error(
                'Không tìm thấy royalBallResult'
            );
        }

        const escapeHTML = value => {
            return String(value ?? '').replace(
                /[&<>"']/g,
                character => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                })[character]
            );
        };

        resultBox.style.display = 'block';
        resultBox.className = 'royal-reward-result';

        /*
         * Hiển thị rương đang được mở.
         */
        resultBox.innerHTML = `
        <div class="royal-reward-loading">
            <div class="royal-loading-rays"></div>

            <div class="royal-loading-crown">
                ♛
            </div>

            <div class="royal-loading-chest">
                <div class="royal-loading-chest-lid"></div>
                <div class="royal-loading-chest-body">
                    <span>R</span>
                </div>
            </div>

            <div class="royal-loading-title">
                Đang mở rương Hoàng gia
            </div>

            <div class="royal-loading-subtitle">
                Vận may đang chọn phần thưởng dành cho bạn...
            </div>

            <div class="royal-loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

        /*
         * Khoảng nghỉ nhỏ để hiệu ứng mở rương được nhìn thấy.
         */
        await new Promise(resolve =>
            setTimeout(resolve, 850)
        );

        const probabilityItem =
            this.currentSettings
                ? parseFloat(
                    this.currentSettings.probItem
                )
                : this.defaultSettings.probItem;

        const randomNumber = Math.random() * 100;

        let rewardType =
            randomNumber <= probabilityItem
                ? 'item'
                : 'coin';

        let rewardTheme = 'coin';
        let rewardIcon = '🪙';
        let rewardLabel = 'Kho báu Hoàng gia';
        let rewardTitle = '';
        let rewardDetail = '';
        let rewardValueText = '';

        let wonCoins = 0;
        let actualRewardRecord = '';

        if (rewardType === 'item') {
            const legendaryItems =
                typeof StoreConfig !== 'undefined' &&
                    Array.isArray(StoreConfig.items)
                    ? StoreConfig.items.filter(item =>
                        item.tag &&
                        item.tag
                            .toLowerCase()
                            .trim() === 'truyền thuyết'
                    )
                    : [];

            if (legendaryItems.length > 0) {
                const inventorySnapshot =
                    await db.ref(
                        `student_inventory/${currentUser.username}`
                    ).once('value');

                const currentOwned = new Set();

                inventorySnapshot.forEach(child => {
                    const inventoryItem =
                        child.val() || {};

                    if (child.key) {
                        currentOwned.add(
                            String(child.key)
                        );
                    }

                    if (inventoryItem.id) {
                        currentOwned.add(
                            String(inventoryItem.id)
                        );
                    }
                });

                const randomItem =
                    legendaryItems[
                    Math.floor(
                        Math.random() *
                        legendaryItems.length
                    )
                    ];

                const itemId = String(randomItem.id);

                if (currentOwned.has(itemId)) {
                    /*
                     * Vật phẩm bị trùng:
                     * chuyển thành 500 Coin.
                     */
                    wonCoins = 500;

                    rewardTheme = 'duplicate';
                    rewardIcon = '♻️';
                    rewardLabel =
                        'Quà trùng được quy đổi';

                    rewardTitle =
                        'Bạn đã sở hữu vật phẩm này';

                    rewardValueText =
                        '+500 Coin';

                    rewardDetail =
                        `"${randomItem.name}" đã có trong kho. ` +
                        `Hoàng gia đã đổi món quà thành Coin.`;

                    actualRewardRecord =
                        `Trùng Truyền thuyết: ` +
                        `${randomItem.name} (+500 Coin)`;
                } else {
                    /*
                     * Trao vật phẩm trước khi hiển thị thành công.
                     */
                    await db.ref(
                        `student_inventory/` +
                        `${currentUser.username}/` +
                        `${randomItem.id}`
                    ).update({
                        id: randomItem.id,
                        purchaseTime:
                            firebase.database
                                .ServerValue.TIMESTAMP,
                        isEquipped: false,
                        source: 'royal_ball'
                    });

                    rewardTheme = 'item';
                    rewardIcon = '💎';
                    rewardLabel =
                        'Vật phẩm Truyền thuyết';

                    rewardTitle =
                        randomItem.name;

                    rewardValueText =
                        'TRUYỀN THUYẾT';

                    rewardDetail =
                        'Vật phẩm đã được đưa vào kho đồ của bạn.';

                    actualRewardRecord =
                        `Truyền thuyết: ${randomItem.name}`;
                }
            } else {
                /*
                 * Không tìm thấy vật phẩm Truyền thuyết.
                 */
                wonCoins = 500;

                rewardTheme = 'compensation';
                rewardIcon = '🎁';
                rewardLabel =
                    'Quà bù Hoàng gia';

                rewardTitle =
                    'Kho báu bí ẩn';

                rewardValueText =
                    '+500 Coin';

                rewardDetail =
                    'Danh sách vật phẩm Truyền thuyết đang được cập nhật.';

                actualRewardRecord =
                    '500 Coin bù vật phẩm Dạ hội';
            }
        } else {
            wonCoins =
                Math.floor(
                    Math.random() *
                    (1000 - 100 + 1)
                ) + 100;

            rewardTheme = 'coin';
            rewardIcon = '🪙';
            rewardLabel =
                'Kho báu Hoàng gia';

            rewardTitle =
                'Coin Dạ Hội';

            rewardValueText =
                `+${wonCoins.toLocaleString('vi-VN')} Coin`;

            rewardDetail =
                'Phần thưởng đã được cộng vào số dư của bạn.';

            actualRewardRecord =
                `${wonCoins} Coin (Dạ hội)`;
        }

        /*
         * Cộng Coin trước khi hiển thị thông báo thành công.
         */
        if (wonCoins > 0) {
            const coinReference =
                db.ref(
                    `student_coins/${currentUser.username}`
                );

            const coinTransaction =
                await coinReference.transaction(
                    currentValue =>
                        (Number(currentValue) || 0) +
                        wonCoins
                );

            if (!coinTransaction.committed) {
                throw new Error(
                    'Không thể cộng Coin Dạ hội'
                );
            }
        }

        /*
         * Ghi lịch sử.
         */
        const recordNow = new Date();

        await pushDB('spin_history', {
            studentName: currentUser.name,
            username: currentUser.username,
            reward: actualRewardRecord,
            time:
                recordNow.toLocaleTimeString('vi-VN') +
                ' ' +
                recordNow.toLocaleDateString('vi-VN'),
            timestamp:
                firebase.database
                    .ServerValue.TIMESTAMP,
            source: 'royal_ball'
        });

        const burstParticles =
            Array.from(
                { length: 24 },
                (_, index) => {
                    const angle =
                        index * (360 / 24);

                    const distance =
                        70 + (index % 6) * 12;

                    const size =
                        4 + (index % 4);

                    return `
                    <i
                        style="
                            --reward-angle:${angle}deg;
                            --reward-distance:${distance}px;
                            --reward-size:${size}px;
                            --reward-delay:${(index % 5) * 0.035
                        }s;
                        "
                    ></i>
                `;
                }
            ).join('');

        resultBox.className =
            `royal-reward-result ` +
            `royal-reward-${rewardTheme}`;

        resultBox.innerHTML = `
        <div class="royal-reward-celebration">
            ${burstParticles}
        </div>

        <div class="royal-reward-card">
            <div class="royal-reward-light"></div>

            <div class="royal-reward-top-decoration">
                <span></span>
                <strong>♛</strong>
                <span></span>
            </div>

            <div class="royal-open-chest">
                <div class="royal-open-chest-glow"></div>

                <div class="royal-open-chest-lid">
                    <span></span>
                </div>

                <div class="royal-open-chest-body">
                    <span class="royal-chest-lock">
                        ♛
                    </span>
                </div>

                <div class="royal-reward-icon">
                    ${rewardIcon}
                </div>
            </div>

            <div class="royal-reward-label">
                ${escapeHTML(rewardLabel)}
            </div>

            <h3 class="royal-reward-name">
                ${escapeHTML(rewardTitle)}
            </h3>

            <div class="royal-reward-value">
                ${escapeHTML(rewardValueText)}
            </div>

            <p class="royal-reward-description">
                ${escapeHTML(rewardDetail)}
            </p>

            <div class="royal-reward-divider">
                <span></span>
                <b>✦</b>
                <span></span>
            </div>

            <button
                type="button"
                class="royal-reward-claim"
                onclick="RoyalBallEvent.closeModal()"
            >
                <span>♛</span>
                Nhận thưởng và rời đại sảnh
            </button>

            <div class="royal-reward-confirmed">
                ✓ Phần thưởng đã được ghi nhận
            </div>
        </div>
    `;
    },

    // ==========================================
    // PHẦN LOGIC DÀNH CHO GIÁO VIÊN
    // ==========================================
    syncTeacherUI: function (settings) {
        settings = {
            ...this.defaultSettings,
            ...(settings || {})
        };

        this.currentSettings = settings;

        this.updateStudentEventCard(settings);

        if (
            document.getElementById('probRoyalItem')
        ) {
            document.getElementById(
                'probRoyalItem'
            ).value = settings.probItem;

            document.getElementById(
                'probRoyalCoin'
            ).value = settings.probCoin;
        }

        // Những phần còn lại giữ nguyên

        // Đồng bộ trạng thái đóng/mở thủ công
        const statusBtn = document.getElementById('btnToggleRoyalStatus');
        if (statusBtn) {
            const isEnabled = settings.isEnabled !== undefined ? settings.isEnabled : this.defaultSettings.isEnabled;
            if (isEnabled) {
                statusBtn.innerText = "🟢 Sự Kiện Đang: MỞ CHO HỌC SINH (Bấm để KHÓA)";
                statusBtn.style.background = "linear-gradient(135deg, #059669 0%, #10b981 100%)";
                statusBtn.dataset.status = "open";
            } else {
                statusBtn.innerText = "🔴 Sự Kiện Đang: ĐANG KHÓA TRUY CẬP (Bấm để MỞ)";
                statusBtn.style.background = "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)";
                statusBtn.dataset.status = "closed";
            }
        }

        // ĐỒNG BỘ CẤU HÌNH THỜI GIAN TÙY CHỈNH
        const useCustomCheck = document.getElementById('useCustomDates');
        if (useCustomCheck) {
            useCustomCheck.checked = settings.useCustomDates || false;
            const area = document.getElementById('royalCustomDatesArea');
            if (area) area.style.display = useCustomCheck.checked ? 'block' : 'none';
        }
        if (document.getElementById('royalStartDate')) {
            document.getElementById('royalStartDate').value = settings.startDate || '';
        }
        if (document.getElementById('royalEndDate')) {
            document.getElementById('royalEndDate').value = settings.endDate || '';
        }
    },

    toggleStatusByTeacher: async function () {
        const statusBtn = document.getElementById('btnToggleRoyalStatus');
        if (!statusBtn) return alert("❌ Lỗi: Không tìm thấy nút Trạng thái trên giao diện!");

        const currentStatus = statusBtn.dataset.status;
        const newEnabledState = (currentStatus === "closed");

        try {
            const snap = await db.ref('game_settings/royal_ball').once('value');
            let currentData = snap.exists() ? snap.val() : { ...this.defaultSettings };

            currentData.isEnabled = newEnabledState;

            await db.ref().update({
                'game_settings/royal_ball':
                    currentData,

                'limited_events/royal_ball':
                    this.buildLimitedEventAnnouncement(
                        currentData
                    )
            });
            alert(`🔒 Hệ thống phản hồi: Đã chuyển trạng thái sự kiện thành [${newEnabledState ? "MỞ TRUY CẬP" : "KHÓA TRUY CẬP"}] thành công!`);
        } catch (error) {
            alert("❌ Lỗi kết nối Firebase: " + error.message);
        }
    },

    saveSettings: async function () {
        // Lấy Element cực kỳ cẩn thận để tránh crash ngầm
        const errorMsg = document.getElementById('royalErrorMsg');
        if (!errorMsg) {
            alert("❌ Lỗi: Thiếu thẻ thông báo lỗi (id: royalErrorMsg) trong HTML!");
            return;
        }

        const probItemEl = document.getElementById('probRoyalItem');
        const probCoinEl = document.getElementById('probRoyalCoin');
        const itemProb = probItemEl ? parseFloat(probItemEl.value) || 0 : 5;
        const coinProb = probCoinEl ? parseFloat(probCoinEl.value) || 0 : 95;

        if ((itemProb + coinProb) !== 100) {
            errorMsg.innerText = "❌ LỖI: Tổng tỉ lệ phải đúng bằng 100%!";
            errorMsg.style.display = 'block';
            return;
        }

        // Lấy thông tin thời gian tùy chỉnh an toàn
        const checkEl = document.getElementById('useCustomDates');
        const startEl = document.getElementById('royalStartDate');
        const endEl = document.getElementById('royalEndDate');

        const useCustomDates = checkEl ? checkEl.checked : false;
        const startDate = startEl ? startEl.value : '';
        const endDate = endEl ? endEl.value : '';

        if (useCustomDates && (!startDate || !endDate)) {
            errorMsg.innerText = "❌ LỖI: Vui lòng chọn đầy đủ Ngày bắt đầu và Ngày kết thúc tùy chỉnh!";
            errorMsg.style.display = 'block';
            return;
        }
        if (useCustomDates && (new Date(startDate) > new Date(endDate))) {
            errorMsg.innerText = "❌ LỖI: Ngày bắt đầu không được lớn hơn ngày kết thúc!";
            errorMsg.style.display = 'block';
            return;
        }

        errorMsg.style.display = 'none';

        const statusBtn = document.getElementById('btnToggleRoyalStatus');
        const isEnabled = statusBtn ? (statusBtn.dataset.status === "open") : true;

        try {
            // Đẩy toàn bộ dữ liệu cấu hình lên Firebase
            const savedSettings = {
                probItem: itemProb,
                probCoin: coinProb,
                isEnabled: isEnabled,
                useCustomDates: useCustomDates,
                startDate: startDate,
                endDate: endDate
            };

            await db.ref().update({
                'game_settings/royal_ball':
                    savedSettings,

                'limited_events/royal_ball':
                    this.buildLimitedEventAnnouncement(
                        savedSettings
                    )
            });
            alert('✅ Đã lưu cấu hình Dạ Hội Hoàng Gia thành công!');
        } catch (error) {
            alert('❌ Lỗi lưu Firebase: ' + error.message);
        }
    }
};

// Đăng ký sự kiện DOM
document.addEventListener('DOMContentLoaded', () => {
    RoyalBallEvent.enhanceUI();
    const probItemInp = document.getElementById('probRoyalItem');
    const probCoinInp = document.getElementById('probRoyalCoin');
    if (probItemInp && probCoinInp) {
        probItemInp.addEventListener('input', function () {
            let val = parseFloat(this.value) || 0;
            if (val > 100) val = 100;
            probCoinInp.value = 100 - val;
        });
        probCoinInp.addEventListener('input', function () {
            let val = parseFloat(this.value) || 0;
            if (val > 100) val = 100;
            probItemInp.value = 100 - val;
        });
    }

    const useCustomCheck = document.getElementById('useCustomDates');
    if (useCustomCheck) {
        useCustomCheck.addEventListener('change', function () {
            const area = document.getElementById('royalCustomDatesArea');
            if (area) area.style.display = this.checked ? 'block' : 'none';
        });
    }

    if (typeof db !== 'undefined') {
        db.ref('game_settings/royal_ball').on('value', (snapshot) => {
            if (snapshot.exists()) {
                RoyalBallEvent.syncTeacherUI(snapshot.val());
            } else {
                RoyalBallEvent.syncTeacherUI(RoyalBallEvent.defaultSettings);
            }
        });
    }
});