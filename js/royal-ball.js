// js/royal-ball.js

const RoyalBallEvent = {
    isDancing: false,
    defaultSettings: { probItem: 5, probCoin: 95, isEnabled: true, useCustomDates: false, startDate: '', endDate: '' },
    currentSettings: null,

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

            modal.classList.add('active');
            document.getElementById('royalBallResult').style.display = 'none';
            document.getElementById('btnStartDance').style.display = 'inline-block';

        } catch (error) {
            alert("❌ Lỗi kết nối Firebase khi tải cấu hình sự kiện: " + error.message);
        }
    },

    closeModal: function () {
        if (this.isDancing) return;
        const modal = document.getElementById('royalBallModal');
        if (modal) modal.classList.remove('active');
    },

    startDance: async function () {
        if (this.isDancing) return;

        // --- BẮT ĐẦU: LOGIC KIỂM TRA GIỚI HẠN 1 LẦN / NGÀY ---
        const today = new Date().toLocaleDateString('vi-VN');
        const limitRef = db.ref(`royal_ball_limits/${currentUser.username}`);

        try {
            const snap = await limitRef.once('value');
            const limitData = snap.val();

            // Nếu ngày lưu trên hệ thống trùng với hôm nay -> Chặn lại
            if (limitData && limitData.lastDate === today) {
                alert("⏳ Bạn đã tham gia khiêu vũ hôm nay rồi! Hãy nghỉ ngơi và quay lại vào ngày mai nhé.");
                return;
            }

            // Nếu chưa nhảy hôm nay -> Ghi nhận ngày luôn để chặn click đúp
            await limitRef.set({ lastDate: today });
        } catch (error) {
            console.error("Lỗi kiểm tra ngày:", error);
            alert("❌ Lỗi kiểm tra dữ liệu máy chủ, vui lòng thử lại sau!");
            return;
        }
        // --- KẾT THÚC: LOGIC KIỂM TRA ---

        this.isDancing = true;

        const btn = document.getElementById('btnStartDance');
        const floor = document.getElementById('royalDanceFloor');
        const status = document.getElementById('royalDanceStatus');

        btn.style.display = 'none';
        status.style.display = 'block';
        status.innerText = "🎵 Âm nhạc vang lên, điệu nhảy bắt đầu... (10s)";

        floor.classList.add('dancing');

        let timeLeft = 10;
        const timer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                status.innerText = `🎵 Đang khiêu vũ... (${timeLeft}s)`;
            }
        }, 1000);

        setTimeout(async () => {
            clearInterval(timer);
            floor.classList.remove('dancing');
            status.style.display = 'none';
            await this.calculateReward();
            this.isDancing = false;
        }, 10000);
    },

    calculateReward: async function () {
        const resultBox = document.getElementById('royalBallResult');
        resultBox.style.display = 'block';
        resultBox.innerHTML = '<p style="color:white;">⏳ Đang tính toán phần thưởng...</p>';

        const rand = Math.random() * 100;
        const probItem = this.currentSettings ? parseFloat(this.currentSettings.probItem) : this.defaultSettings.probItem;

        let rewardType = (rand <= probItem) ? 'item' : 'coin';
        let wonCoins = 0;
        let displayResult = '';
        let actualRewardRecord = '';

        if (rewardType === 'item') {
            const legendaryItems = (typeof StoreConfig !== 'undefined') ? StoreConfig.items.filter(i => i.tag && i.tag.toLowerCase() === 'truyền thuyết') : [];

            if (legendaryItems.length > 0) {
                const invSnap = await db.ref(`student_inventory/${currentUser.username}`).once('value');
                const currentOwned = invSnap.val() ? Object.values(invSnap.val()).map(i => i.id) : [];
                const randomItem = legendaryItems[Math.floor(Math.random() * legendaryItems.length)];

                if (currentOwned.includes(randomItem.id)) {
                    wonCoins = 500;
                    displayResult = `Bị trùng [ ${randomItem.name} ] - Đền bù 500 Coin`;
                    actualRewardRecord = `Trùng Truyền thuyết (+500 Coin)`;
                } else {
                    await db.ref(`student_inventory/${currentUser.username}/${randomItem.id}`).update({
                        id: randomItem.id, purchaseTime: Date.now(), isEquipped: false
                    });
                    displayResult = `🎉 Nhận Vật Phẩm Truyền Thuyết: [ ${randomItem.name} ]`;
                    actualRewardRecord = `Truyền thuyết: ${randomItem.name}`;
                }
            } else {
                wonCoins = 500;
                displayResult = "500 Coin (Bù Vật phẩm Truyền thuyết)";
                actualRewardRecord = "500 Coin (Bí ẩn Royal)";
            }
        } else {
            wonCoins = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
            displayResult = `💰 Nhận được: ${wonCoins.toLocaleString('vi-VN')} Coin`;
            actualRewardRecord = `${wonCoins} Coin (Dạ hội)`;
        }

        resultBox.innerHTML = `<h3 style="color: #ffd700; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${displayResult}</h3>
                               <button onclick="RoyalBallEvent.closeModal()" style="margin-top:15px; padding:10px 20px; background:linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border:none; border-radius:8px; color:white; font-weight:bold; cursor:pointer;">Nhận Thưởng & Thoát</button>`;

        if (wonCoins > 0) {
            const coinRef = db.ref('student_coins/' + currentUser.username);
            await coinRef.transaction(current => (current || 0) + wonCoins);
        }

        const recordNow = new Date();
        await pushDB('spin_history', {
            studentName: currentUser.name, username: currentUser.username, reward: actualRewardRecord,
            time: recordNow.toLocaleTimeString('vi-VN') + ' ' + recordNow.toLocaleDateString('vi-VN'),
            timestamp: recordNow.getTime()
        });
    },

    // ==========================================
    // PHẦN LOGIC DÀNH CHO GIÁO VIÊN
    // ==========================================
    syncTeacherUI: function (settings) {
        if (document.getElementById('probRoyalItem')) {
            document.getElementById('probRoyalItem').value = settings.probItem !== undefined ? settings.probItem : this.defaultSettings.probItem;
            document.getElementById('probRoyalCoin').value = settings.probCoin !== undefined ? settings.probCoin : this.defaultSettings.probCoin;
        }

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

            await db.ref('game_settings/royal_ball').set(currentData);
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
            await db.ref('game_settings/royal_ball').set({
                probItem: itemProb,
                probCoin: coinProb,
                isEnabled: isEnabled,
                useCustomDates: useCustomDates,
                startDate: startDate,
                endDate: endDate
            });
            alert('✅ Đã lưu cấu hình Dạ Hội Hoàng Gia thành công!');
        } catch (error) {
            alert('❌ Lỗi lưu Firebase: ' + error.message);
        }
    }
};

// Đăng ký sự kiện DOM
document.addEventListener('DOMContentLoaded', () => {
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