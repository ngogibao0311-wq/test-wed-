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
        const timestamp = Date.now() + Number(this.serverTimeOffset || 0);
        if (this.currentSettings) return this.isEventActiveAt(this.currentSettings, timestamp);
        const now = new Date(timestamp);

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
            const clockSnap = await db.ref('.info/serverTimeOffset').once('value');
            this.serverTimeOffset = Number(clockSnap.val()) || 0;
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

    serverTimeOffset: 0,
    ROYAL_OPERATION_VERSION: 2,
    ROYAL_PAYMENT_LEASE_MS: 120000,

    getRoyalServerNow: async function () {
        const snap = await db.ref('.info/serverTimeOffset').once('value');
        const offset = Number(snap.val()) || 0;
        this.serverTimeOffset = offset;
        return { offset, now: Date.now() + offset };
    },

    isEventActiveAt: function (settings, timestamp) {
        const safe = { ...this.defaultSettings, ...(settings || {}) };
        const now = new Date(Number(timestamp));
        if (safe.useCustomDates && safe.startDate && safe.endDate) {
            const start = new Date(`${safe.startDate}T00:00:00+07:00`);
            const end = new Date(`${safe.endDate}T23:59:59.999+07:00`);
            return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
        }
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Ho_Chi_Minh', month: '2-digit', day: '2-digit'
        }).formatToParts(now).reduce((acc, part) => {
            if (part.type === 'month' || part.type === 'day') acc[part.type] = Number(part.value);
            return acc;
        }, {});
        return (parts.month === 7 && parts.day >= 29) || (parts.month === 8 && parts.day === 1);
    },

    validateRoyalProbabilities: function (settings) {
        const item = Number(settings?.probItem);
        const coin = Number(settings?.probCoin);
        if (!Number.isFinite(item) || !Number.isFinite(coin) || item < 0 || coin < 0 || item > 100 || coin > 100 || Math.abs((item + coin) - 100) > 1e-9) {
            throw new Error('ROYAL_INVALID_PROBABILITY_CONFIG');
        }
        return { probItem: item, probCoin: coin };
    },

    secureRandomUnit: function () {
        try {
            if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
                const value = new Uint32Array(1);
                window.crypto.getRandomValues(value);
                return Number(value[0]) / 4294967296;
            }
        } catch (_) {}
        return Math.random();
    },

    makeRoyalOperationId: function () {
        try {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                return `royal_${window.crypto.randomUUID()}`;
            }
        } catch (_) {}
        return `royal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    },

    reserveRoyalOperation: async function (today, serverNow, settings) {
        const username = String(currentUser?.username || '').trim();
        if (!username) throw new Error('ROYAL_NO_USERNAME');
        const ref = db.ref(`royal_ball_limits/${username}`);
        const candidateId = this.makeRoyalOperationId();
        let blocked = false;
        let resumable = false;
        const tx = await ref.transaction(current => {
            if (current && current.lastDate === today) {
                const status = String(current.status || 'legacy_claimed');
                if (['reserved', 'paying', 'paid', 'reward_reserved'].includes(status) && current.operationId) {
                    resumable = true;
                    return;
                }
                blocked = true;
                return;
            }
            return {
                version: this.ROYAL_OPERATION_VERSION,
                lastDate: today,
                operationId: candidateId,
                status: 'reserved',
                startedAt: serverNow,
                updatedAt: serverNow,
                probItem: Number(settings?.probItem),
                probCoin: Number(settings?.probCoin)
            };
        }, undefined, false);
        if (!tx.committed) {
            const remote = tx.snapshot.val();
            if (resumable && remote?.operationId) return { ref, operation: remote };
            if (blocked) throw new Error('ROYAL_ALREADY_JOINED_TODAY');
            throw new Error('ROYAL_RESERVE_FAILED');
        }
        return { ref, operation: tx.snapshot.val() };
    },

    ensureRoyalPayment: async function (limitRef, operation, serverNow) {
        const username = String(currentUser?.username || '').trim();
        const fee = 5;
        let latest = operation || {};
        if (['paid', 'reward_reserved', 'claimed'].includes(String(latest.status || ''))) return latest;

        const paymentToken = this.makeRoyalOperationId();
        let ownsPayment = false;
        const lockTx = await limitRef.transaction(current => {
            if (!current || current.operationId !== latest.operationId) return;
            const status = String(current.status || '');
            if (['paid', 'reward_reserved', 'claimed'].includes(status)) return;
            if (status === 'reserved' || (status === 'paying' && Number(current.paymentStartedAt || 0) <= serverNow - this.ROYAL_PAYMENT_LEASE_MS)) {
                ownsPayment = true;
                return {
                    ...current,
                    status: 'paying',
                    paymentToken,
                    paymentStartedAt: serverNow,
                    updatedAt: serverNow
                };
            }
            return;
        }, undefined, false);
        latest = lockTx.snapshot.val() || latest;
        if (!ownsPayment) {
            if (['paid', 'reward_reserved', 'claimed'].includes(String(latest.status || ''))) return latest;
            throw new Error('ROYAL_PAYMENT_IN_PROGRESS');
        }

        const rootUpdates = {};
        rootUpdates[`student_coins/${username}`] = firebase.database.ServerValue.increment(-fee);
        rootUpdates[`royal_ball_limits/${username}/status`] = 'paid';
        rootUpdates[`royal_ball_limits/${username}/paidAt`] = firebase.database.ServerValue.TIMESTAMP;
        rootUpdates[`royal_ball_limits/${username}/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;

        try {
            await db.ref().update(rootUpdates);
        } catch (error) {
            const latestSnap = await limitRef.once('value').catch(() => null);
            const remote = latestSnap?.val?.() || null;
            if (remote && remote.operationId === latest.operationId && ['paid', 'reward_reserved', 'claimed'].includes(String(remote.status || ''))) {
                return remote;
            }
            const coinSnap = await db.ref(`student_coins/${username}`).once('value').catch(() => null);
            const balance = Number(coinSnap?.val?.());
            if (Number.isFinite(balance) && balance < fee) {
                await limitRef.transaction(current => {
                    if (current && current.operationId === latest.operationId && current.status === 'paying' && current.paymentToken === paymentToken) return null;
                    return current;
                }, undefined, false).catch(() => {});
                const noFunds = new Error('ROYAL_INSUFFICIENT_COINS');
                noFunds.balance = balance;
                throw noFunds;
            }
            throw error;
        }
        const paidSnap = await limitRef.once('value');
        return paidSnap.val();
    },

    reserveRoyalReward: async function (limitRef, settings) {
        let current = (await limitRef.once('value')).val() || {};
        if (current.status === 'claimed' || current.status === 'reward_reserved') return current;
        if (current.status !== 'paid') throw new Error('ROYAL_REWARD_NOT_PAID');
        const probabilities = this.validateRoyalProbabilities({
            probItem: current.probItem,
            probCoin: current.probCoin
        });
        const username = String(currentUser?.username || '').trim();

        let outcome;
        if (this.secureRandomUnit() * 100 < probabilities.probItem) {
            const legendaryItems = (typeof StoreConfig !== 'undefined' && Array.isArray(StoreConfig.items))
                ? StoreConfig.items.filter(item => item && item.id && item.luxuryOnly !== true && String(item.tag || '').toLowerCase().trim() === 'truyền thuyết')
                : [];
            if (legendaryItems.length) {
                const randomItem = legendaryItems[Math.floor(this.secureRandomUnit() * legendaryItems.length)];
                const ownedSnap = await db.ref(`student_inventory/${username}/${randomItem.id}`).once('value');
                if (ownedSnap.exists()) {
                    outcome = { rewardType: 'coin', rewardCoins: 500, rewardItemId: String(randomItem.id), rewardItemName: String(randomItem.name || randomItem.id), rewardReason: 'duplicate' };
                } else {
                    outcome = { rewardType: 'item', rewardCoins: 0, rewardItemId: String(randomItem.id), rewardItemName: String(randomItem.name || randomItem.id), rewardReason: 'legendary_item' };
                }
            } else {
                outcome = { rewardType: 'coin', rewardCoins: 500, rewardItemId: '', rewardItemName: '', rewardReason: 'empty_pool' };
            }
        } else {
            outcome = { rewardType: 'coin', rewardCoins: Math.floor(this.secureRandomUnit() * 901) + 100, rewardItemId: '', rewardItemName: '', rewardReason: 'coin' };
        }

        let won = false;
        const tx = await limitRef.transaction(value => {
            if (!value || value.operationId !== current.operationId) return;
            if (value.status === 'reward_reserved' || value.status === 'claimed') return;
            if (value.status !== 'paid') return;
            won = true;
            return {
                ...value,
                status: 'reward_reserved',
                rewardType: outcome.rewardType,
                rewardCoins: outcome.rewardCoins,
                rewardItemId: outcome.rewardItemId,
                rewardItemName: outcome.rewardItemName,
                rewardReason: outcome.rewardReason,
                rewardReservedAt: Date.now() + Number(this.serverTimeOffset || 0),
                updatedAt: Date.now() + Number(this.serverTimeOffset || 0)
            };
        }, undefined, false);
        current = tx.snapshot.val() || current;
        if (!won && current.status !== 'reward_reserved' && current.status !== 'claimed') throw new Error('ROYAL_REWARD_RESERVE_FAILED');
        return current;
    },

    finalizeRoyalReward: async function (limitRef, operation) {
        const username = String(currentUser?.username || '').trim();
        let current = operation || (await limitRef.once('value')).val() || {};
        if (current.status === 'claimed') return current;
        if (current.status !== 'reward_reserved') throw new Error('ROYAL_REWARD_NOT_RESERVED');

        if (current.rewardType === 'item' && current.rewardItemId) {
            const itemRef = db.ref(`student_inventory/${username}/${current.rewardItemId}`);
            const exists = (await itemRef.once('value')).exists();
            if (exists) {
                const convertTx = await limitRef.transaction(value => {
                    if (!value || value.operationId !== current.operationId || value.status !== 'reward_reserved' || value.rewardType !== 'item' || value.rewardItemId !== current.rewardItemId) return;
                    return { ...value, rewardType: 'coin', rewardCoins: 500, rewardReason: 'duplicate_after_reserve', updatedAt: Date.now() + Number(this.serverTimeOffset || 0) };
                }, undefined, false);
                current = convertTx.snapshot.val() || current;
            }
        }

        const historyId = String(current.operationId);
        const recordNow = new Date(Date.now() + Number(this.serverTimeOffset || 0));
        const rewardText = current.rewardType === 'item'
            ? `Truyền thuyết: ${current.rewardItemName || current.rewardItemId}`
            : `${Number(current.rewardCoins || 0)} Coin (Dạ hội${String(current.rewardReason || '').includes('duplicate') ? ' - bù trùng' : ''})`;
        const updates = {};
        if (current.rewardType === 'item') {
            updates[`student_inventory/${username}/${current.rewardItemId}`] = {
                id: current.rewardItemId,
                purchaseTime: firebase.database.ServerValue.TIMESTAMP,
                isEquipped: false,
                source: 'royal_ball',
                royalBallOperationId: current.operationId
            };
        } else {
            updates[`student_coins/${username}`] = firebase.database.ServerValue.increment(Number(current.rewardCoins || 0));
        }
        updates[`spin_history/${historyId}`] = {
            studentName: currentUser.name,
            username,
            reward: rewardText,
            time: recordNow.toLocaleTimeString('vi-VN') + ' ' + recordNow.toLocaleDateString('vi-VN'),
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            source: 'royal_ball',
            operationId: historyId
        };
        updates[`royal_ball_limits/${username}/status`] = 'claimed';
        updates[`royal_ball_limits/${username}/claimedAt`] = firebase.database.ServerValue.TIMESTAMP;
        updates[`royal_ball_limits/${username}/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;

        try {
            await db.ref().update(updates);
        } catch (error) {
            const remote = (await limitRef.once('value').catch(() => null))?.val?.();
            if (remote && remote.operationId === current.operationId && remote.status === 'claimed') return remote;
            throw error;
        }
        return (await limitRef.once('value')).val() || { ...current, status: 'claimed' };
    },

    startDance: async function () {
        if (this.isDancing) return;

        let royalContext;
        let limitRef;
        try {
            const clock = await this.getRoyalServerNow();
            const settingsSnap = await db.ref('game_settings/royal_ball').once('value');
            const settings = settingsSnap.exists() ? { ...this.defaultSettings, ...settingsSnap.val() } : { ...this.defaultSettings };
            this.currentSettings = settings;
            this.validateRoyalProbabilities(settings);
            if (settings.isEnabled === false || (typeof window.isGameEnabled !== 'undefined' && window.isGameEnabled === false)) {
                throw new Error('ROYAL_EVENT_DISABLED');
            }
            if (!this.isEventActiveAt(settings, clock.now)) {
                throw new Error('ROYAL_EVENT_OUTSIDE_WINDOW');
            }
            const today = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(new Date(clock.now));
            const reservation = await this.reserveRoyalOperation(today, clock.now, settings);
            limitRef = reservation.ref;
            royalContext = await this.ensureRoyalPayment(limitRef, reservation.operation, clock.now);
        } catch (error) {
            console.error('[RoyalBall] Không thể bắt đầu operation:', error);
            const code = String(error?.message || '');
            if (code === 'ROYAL_ALREADY_JOINED_TODAY') return alert('⏳ Bạn đã tham gia khiêu vũ hôm nay rồi! Hãy quay lại vào ngày mai nhé.');
            if (code === 'ROYAL_INSUFFICIENT_COINS') return alert(`🪙 Bạn cần 5 Coin để khiêu vũ.\nSố dư hiện tại: ${Number(error.balance || 0)} Coin.`);
            if (code === 'ROYAL_EVENT_DISABLED') return alert('🔒 Dạ Hội Hoàng Gia đang bị khóa.');
            if (code === 'ROYAL_EVENT_OUTSIDE_WINDOW') return alert('⚠️ Hiện tại không nằm trong thời gian Dạ Hội Hoàng Gia.');
            if (code === 'ROYAL_INVALID_PROBABILITY_CONFIG') return alert('❌ Cấu hình tỷ lệ Dạ hội không hợp lệ. Giáo viên cần lưu lại tổng xác suất = 100%.');
            if (code === 'ROYAL_PAYMENT_IN_PROGRESS') return alert('⏳ Lượt Dạ hội đang được xử lý ở một phiên khác.');
            return alert('❌ Không thể bắt đầu Dạ hội. Dữ liệu operation đã được giữ để retry an toàn nếu cần.');
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

            return alert(
                '❌ Giao diện Dạ hội chưa tải đầy đủ. ' +
                'Operation đã thanh toán được giữ lại; mở lại Dạ hội để tiếp tục nhận đúng phần thưởng, không bị trừ Coin lần hai.'
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

                // Không hoàn phí và không mở lượt sau khi payment đã commit.
                // Operation durable sẽ được resume ở lần mở tiếp theo.

                this.setDanceProgress(
                    0,
                    10,
                    'Trao thưởng tạm gián đoạn — operation được giữ để retry'
                );

                alert(
                    '❌ Trao thưởng chưa hoàn tất. Mở lại Dạ hội để hệ thống tiếp tục đúng operation hiện tại; không bị trừ phí hay cấp quà hai lần.'
                );
            } finally {
                this.isDancing = false;
                btn.disabled = false;
            }
        }, 10000);
    },

    calculateReward: async function () {
        const resultBox = document.getElementById('royalBallResult');
        if (!resultBox) throw new Error('Không tìm thấy royalBallResult');
        const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[character]);
        resultBox.style.display = 'block';
        resultBox.className = 'royal-reward-result';
        resultBox.innerHTML = `<div class="royal-reward-loading"><div class="royal-loading-rays"></div><div class="royal-loading-crown">♛</div><div class="royal-loading-chest"><div class="royal-loading-chest-lid"></div><div class="royal-loading-chest-body"><span>R</span></div></div><div class="royal-loading-title">Đang mở rương Hoàng gia</div><div class="royal-loading-subtitle">Đang tiếp tục operation phần thưởng an toàn...</div><div class="royal-loading-dots"><span></span><span></span><span></span></div></div>`;
        await new Promise(resolve => setTimeout(resolve, 850));

        const username = String(currentUser?.username || '').trim();
        const limitRef = db.ref(`royal_ball_limits/${username}`);
        await this.getRoyalServerNow();
        let operation = await this.reserveRoyalReward(limitRef, null);
        operation = await this.finalizeRoyalReward(limitRef, operation);

        let rewardTheme = 'coin';
        let rewardIcon = '🪙';
        let rewardLabel = 'Kho báu Hoàng gia';
        let rewardTitle = 'Coin Dạ Hội';
        let rewardDetail = 'Phần thưởng đã được ghi nhận atomically cùng lịch sử operation.';
        let rewardValueText = `+${Number(operation.rewardCoins || 0).toLocaleString('vi-VN')} Coin`;
        if (operation.rewardType === 'item') {
            rewardTheme = 'item'; rewardIcon = '💎'; rewardLabel = 'Vật phẩm Truyền thuyết';
            rewardTitle = operation.rewardItemName || operation.rewardItemId || 'Vật phẩm Truyền thuyết';
            rewardValueText = 'TRUYỀN THUYẾT'; rewardDetail = 'Vật phẩm đã được đưa vào kho đồ của bạn.';
        } else if (String(operation.rewardReason || '').includes('duplicate')) {
            rewardTheme = 'duplicate'; rewardIcon = '♻️'; rewardLabel = 'Quà trùng được quy đổi';
            rewardTitle = 'Vật phẩm đã có trong kho'; rewardDetail = 'Hoàng gia đã đổi món quà thành 500 Coin.';
        } else if (operation.rewardReason === 'empty_pool') {
            rewardTheme = 'compensation'; rewardIcon = '🎁'; rewardLabel = 'Quà bù Hoàng gia'; rewardTitle = 'Kho báu bí ẩn';
        }

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

// Đăng ký sự kiện DOM — tương thích cả eager-load và lazy-load
function initRoyalBallDOM() {
    if (window.__royalBallDomInitialized) {
        return;
    }

    window.__royalBallDomInitialized = true;

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

}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initRoyalBallDOM,
        { once: true }
    );
} else {
    initRoyalBallDOM();
}
