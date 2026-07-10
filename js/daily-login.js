// js/daily-login.js

class DailyLoginManager {
    static daysOfWeek = [
        { id: 1, name: 'Thứ 2' }, { id: 2, name: 'Thứ 3' }, { id: 3, name: 'Thứ 4' },
        { id: 4, name: 'Thứ 5' }, { id: 5, name: 'Thứ 6' }, { id: 6, name: 'Thứ 7' }, { id: 7, name: 'Chủ Nhật' }
    ];

    static rewardTypes = {
        'coin': { name: '🪙 Coin', icon: '🪙' },
        'ticket': { name: '🎫 Vé quay Gacha', icon: '🎫' },
        'discount': { name: '🏷️ Phiếu giảm giá (%)', icon: '🏷️' },
        'item': { name: '📦 Vật phẩm cửa hàng', icon: '🎁' }
    };

    static getLocalDateString(d = new Date()) {
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const date = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${date}`;
    }

    // NÂNG CẤP: Truyền ngày bất kỳ vào, hệ thống tự lấy đúng Thứ 2 của tuần đó
    static getWeekId(dateInput = null) {
        const d = dateInput ? new Date(dateInput) : new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.getFullYear(), d.getMonth(), diff);
        return this.getLocalDateString(monday);
    }

    static getTodayInfo() {
        const d = new Date();
        let dayOfWeek = d.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7;
        const dateString = this.getLocalDateString(d);
        return { dayOfWeek, dateString };
    }

    static async init() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) return;

        if (user.role === 'teacher') {
            this.injectTeacherTab();
        } else if (user.role === 'student') {
            this.checkStudentLogin(user.username);
        }
    }

    /* =========================================================
       PHẦN 1: DÀNH CHO GIÁO VIÊN (QUẢN LÝ NHIỀU TUẦN)
       ========================================================= */

    static injectTeacherTab() {
        setTimeout(async () => {
            const gameManageTab = document.getElementById('tab-game-manage');
            if (!gameManageTab) return;

            let html = `
                <div class="card accordion-card" style="margin-top: 20px;">
                    <div class="accordion-header" onclick="toggleAccordion('dailyLoginManageView', this)">
                        <div class="accordion-title">
                            <h3 style="color: #0ea5e9; margin: 0; display: flex; align-items: center; gap: 8px;">🎁 Quản lý Quà Đăng Nhập 7 Ngày</h3>
                        </div>
                        <div class="accordion-meta"><span class="toggle-icon">▼</span></div>
                    </div>

                    <div id="dailyLoginManageView" class="accordion-content">
                        <div style="text-align: right; margin-bottom: 15px;">
                            <button onclick="DailyLoginManager.openTeacherModal()" style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(14, 165, 233, 0.3);">
                                ➕ Thêm tuần đăng nhập mới
                            </button>
                        </div>
                        
                        <div id="dailyLoginActiveDisplay">
                            <p style="text-align: center; color: #666; font-style: italic;">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                </div>
            `;
            gameManageTab.insertAdjacentHTML('beforeend', html);

            this.buildTeacherModal();
            this.loadAndRenderTeacherDisplay();
        }, 800);
    }

    static async loadAndRenderTeacherDisplay() {
        const displayArea = document.getElementById('dailyLoginActiveDisplay');
        if (!displayArea) return;

        // Tải dữ liệu danh sách các tuần
        const snap = await db.ref('game_settings/daily_login_weeks').once('value');
        const allWeeks = snap.val() || {};
        const currentWeekId = this.getWeekId();

        if (Object.keys(allWeeks).length === 0) {
            displayArea.innerHTML = `<div style="background: rgba(0,0,0,0.03); padding: 20px; border-radius: 12px; text-align: center; border: 1px dashed rgba(0,0,0,0.1);"><p style="margin: 0; color: #666;">Hiện tại chưa có sự kiện điểm danh nào được cài đặt.</p></div>`;
            return;
        }

        let summaryHtml = '';

        // Sắp xếp các tuần: Mới nhất lên trên
        const sortedWeeks = Object.keys(allWeeks).sort((a, b) => b.localeCompare(a));

        sortedWeeks.forEach(weekId => {
            const config = allWeeks[weekId];
            let isExpired = weekId < currentWeekId;
            let isCurrent = weekId === currentWeekId;

            let statusBanner = '';
            if (isCurrent) {
                statusBanner = `<div style="background: rgba(34, 197, 94, 0.1); color: #15803d; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; border: 1px dashed #22c55e; font-weight: bold; font-size: 0.85em;">✅ Đang diễn ra trong tuần này. ${config.isTestMode ? '<b>[THỬ NGHIỆM]</b>' : ''}</div>`;
            } else if (isExpired) {
                statusBanner = `<div style="background: rgba(100, 116, 139, 0.1); color: #475569; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; border: 1px dashed #94a3b8; font-weight: bold; font-size: 0.85em;">⌛ Đã kết thúc.</div>`;
            } else {
                statusBanner = `<div style="background: rgba(245, 158, 11, 0.1); color: #d97706; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; border: 1px dashed #f59e0b; font-weight: bold; font-size: 0.85em;">⏳ Sắp diễn ra.</div>`;
            }

            summaryHtml += `<div style="background: rgba(255,255,255,0.5); padding: 15px; border-radius: 12px; border: 1px solid #0ea5e9; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #0ea5e9;">Tuần bắt đầu từ: ${weekId}</h4>
                ${statusBanner}
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 15px;">
            `;

            this.daysOfWeek.forEach(day => {
                const reward = config[`day_${day.id}`];
                if (reward) {
                    let displayVal = `${reward.value} ${this.rewardTypes[reward.type].name.split(' ')[1]}`;
                    if (reward.type === 'discount') displayVal = `Giảm ${reward.value}%`;
                    if (reward.type === 'item' && typeof StoreConfig !== 'undefined') {
                        const storeItem = StoreConfig.items.find(i => i.id === reward.value);
                        if (storeItem) displayVal = `[VP] ${storeItem.name}`;
                    }

                    summaryHtml += `
                    <div style="background: white; padding: 8px; border-radius: 8px; text-align: center; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <strong style="color: #2c3e50; font-size: 0.8em;">${day.name}</strong>
                        <div style="font-size: 1.2em; margin: 2px 0;">${this.rewardTypes[reward.type].icon}</div>
                        <span style="color: #d35400; font-size: 0.75em; font-weight: bold;">${displayVal}</span>
                    </div>`;
                }
            });

            summaryHtml += `
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button onclick="DailyLoginManager.openTeacherModal('${weekId}')" style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.9em;">
                        ✏️ Xem / Sửa tuần này
                    </button>
                    <button class="btn-reject" onclick="DailyLoginManager.deleteConfig('${weekId}')" style="padding: 8px 15px; font-size: 0.9em;">
                        🗑 Xóa tuần này
                    </button>
                </div>
            </div>`;
        });

        displayArea.innerHTML = summaryHtml;
    }

    static buildTeacherModal() {
        if (document.getElementById('dl-teacher-modal')) return;

        let itemOptions = '<option value="">-- Chọn vật phẩm --</option>';
        if (typeof StoreConfig !== 'undefined') {
            StoreConfig.items.forEach(item => {
                itemOptions += `<option value="${item.id}">[${item.type.toUpperCase()}] ${item.name}</option>`;
            });
        }

        let rowsHtml = '';
        this.daysOfWeek.forEach(day => {
            rowsHtml += `
                <div class="dl-config-row" style="margin-bottom: 10px;">
                    <div class="dl-day-label">${day.name}</div>
                    <select id="dl-type-${day.id}" onchange="DailyLoginManager.toggleTeacherInput(${day.id})">
                        ${Object.keys(this.rewardTypes).map(k => `<option value="${k}">${this.rewardTypes[k].name}</option>`).join('')}
                    </select>
                    
                    <input type="number" id="dl-value-number-${day.id}" class="dl-value-input" placeholder="Số lượng/ % Giảm">
                    
                    <select id="dl-value-item-${day.id}" class="dl-value-input" style="display:none;">
                        ${itemOptions}
                    </select>
                </div>
            `;
        });

        const modalHtml = `
            <div id="dl-teacher-modal" class="modal-overlay" style="z-index: 999999;">
                <div class="modal-content form-container" style="max-width: 600px; max-height: 90vh; display: flex; flex-direction: column;">
                    <button class="close-btn" onclick="DailyLoginManager.closeTeacherModal()">✖</button>
                    <h3 style="color: #0ea5e9; margin-bottom: 15px; border-bottom: 2px solid rgba(14, 165, 233, 0.2); padding-bottom: 10px;">Cài đặt Quà Điểm Danh</h3>
                    
                    <div style="overflow-y: auto; padding-right: 10px; flex-grow: 1;">
                        <div style="margin-bottom: 15px; background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px; border: 1px dashed #ccc;">
                            <label style="font-weight: bold; color: #2c3e50; font-size: 0.9em; display: block; margin-bottom: 5px;">📅 Chọn ngày bất kỳ trong tuần muốn thiết lập (Hệ thống sẽ tự quy về Thứ 2):</label>
                            <input type="date" id="dl-week-start-date" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                        </div>

                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 15px; background: rgba(245, 158, 11, 0.1); padding: 12px; border-radius: 8px; border: 1px dashed #f59e0b;">
                            <input type="checkbox" id="dlTestModeToggle" style="width: 22px; height: 22px; margin: 0; cursor: pointer;">
                            <strong style="color: #d97706; font-size: 0.95em;">🛠️ Chế độ Thử Nghiệm (Nhận quà ảo, hiện liên tục khi F5)</strong>
                        </label>
                        
                        <div class="dl-config-list">
                            ${rowsHtml}
                        </div>
                    </div>
                    
                    <button onclick="DailyLoginManager.saveConfig()" style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; border: none; padding: 12px; width: 100%; border-radius: 8px; font-weight: bold; margin-top: 15px; cursor: pointer; flex-shrink: 0;">
                        💾 Lưu Cấu Hình Tuần Này
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static async openTeacherModal(weekId = null, isRefresh = false) {
        let config = {};
        const dateInput = document.getElementById('dl-week-start-date');

        if (weekId) {
            // Mở từ danh sách đã lưu (Chế độ Edit)
            const snap = await db.ref(`game_settings/daily_login_weeks/${weekId}`).once('value');
            config = snap.val() || {};
            dateInput.value = weekId;
            dateInput.disabled = true; // Khóa ngày không cho đổi qua tuần khác
        } else {
            // FIX LỖI: Không ghi đè lại ngày hôm nay nếu người dùng đang tự chọn ngày mới
            if (!isRefresh) {
                dateInput.value = this.getLocalDateString(new Date());
            }
            dateInput.disabled = false;

            // Tự động tải dữ liệu của tuần vừa chọn (nếu có trên Firebase)
            const targetWeekId = this.getWeekId(new Date(dateInput.value));
            const snap = await db.ref(`game_settings/daily_login_weeks/${targetWeekId}`).once('value');
            config = snap.val() || {};
        }

        document.getElementById('dlTestModeToggle').checked = !!config.isTestMode;

        // Logic Khóa các ngày đã qua
        const currentWeekId = this.getWeekId();
        const selectedWeekId = weekId || this.getWeekId(new Date(dateInput.value));
        const todayInfo = this.getTodayInfo();

        // Gắn sự kiện thay đổi ngày để load lại logic khóa nếu giáo viên đổi lịch
        dateInput.onchange = () => {
            this.openTeacherModal(null, true); // Gọi lại với cờ isRefresh = true để không bị reset ngày
        };

        this.daysOfWeek.forEach(day => {
            const currentSetting = config[`day_${day.id}`] || { type: 'coin', value: 100 };

            const typeSelect = document.getElementById(`dl-type-${day.id}`);
            const numInput = document.getElementById(`dl-value-number-${day.id}`);
            const itemInput = document.getElementById(`dl-value-item-${day.id}`);
            const row = typeSelect.closest('.dl-config-row');
            const label = row.querySelector('.dl-day-label');

            typeSelect.value = currentSetting.type;
            this.toggleTeacherInput(day.id);

            if (currentSetting.type === 'item') {
                itemInput.value = currentSetting.value;
            } else {
                numInput.value = currentSetting.value;
            }

            let isPastDay = false;
            // Nếu là tuần cũ -> Khóa tất cả
            if (selectedWeekId < currentWeekId) {
                isPastDay = true;
            }
            // Nếu là tuần này -> Khóa các ngày trước hôm nay
            else if (selectedWeekId === currentWeekId && day.id < todayInfo.dayOfWeek) {
                isPastDay = true;
            }

            if (isPastDay) {
                typeSelect.disabled = true;
                numInput.disabled = true;
                itemInput.disabled = true;
                row.style.opacity = '0.5';
                row.style.pointerEvents = 'none';
                if (!label.innerHTML.includes('Đã qua')) {
                    label.innerHTML = `${day.name} <br><span style="font-size:0.75em; color:#e11d48; font-weight:bold;">(Đã qua)</span>`;
                }
            } else {
                typeSelect.disabled = false;
                numInput.disabled = false;
                itemInput.disabled = false;
                row.style.opacity = '1';
                row.style.pointerEvents = 'auto';
                label.innerHTML = day.name;
            }
        });

        document.getElementById('dl-teacher-modal').classList.add('active');
    }

    static closeTeacherModal() {
        document.getElementById('dl-teacher-modal').classList.remove('active');
    }

    static toggleTeacherInput(dayId) {
        const type = document.getElementById(`dl-type-${dayId}`).value;
        const numInput = document.getElementById(`dl-value-number-${dayId}`);
        const itemInput = document.getElementById(`dl-value-item-${dayId}`);

        if (type === 'item') {
            numInput.style.display = 'none';
            itemInput.style.display = 'block';
        } else {
            numInput.style.display = 'block';
            itemInput.style.display = 'none';
        }
    }

    static async saveConfig() {
        const dateVal = document.getElementById('dl-week-start-date').value;
        if (!dateVal) return alert("Vui lòng chọn ngày để hệ thống định vị Tuần đăng nhập!");

        const selectedDate = new Date(dateVal);
        const weekId = this.getWeekId(selectedDate); // Tự động quy về Thứ 2

        const config = { weekId: weekId, isTestMode: document.getElementById('dlTestModeToggle').checked };

        for (let day of this.daysOfWeek) {
            const typeSelect = document.getElementById(`dl-type-${day.id}`);
            const type = typeSelect.value;
            let value = type === 'item' ? document.getElementById(`dl-value-item-${day.id}`).value : parseInt(document.getElementById(`dl-value-number-${day.id}`).value);

            // Chỉ xác thực giá trị nếu thẻ không bị khóa (những ngày chưa qua)
            if (!typeSelect.disabled) {
                if (type === 'discount' && (value < 10 || value > 50)) return alert(`Lỗi ${day.name}: Giảm giá chỉ được từ 10% đến 50%!`);
                if (type !== 'item' && (!value || value <= 0)) return alert(`Lỗi ${day.name}: Vui lòng nhập số lượng hợp lệ!`);
                if (type === 'item' && !value) return alert(`Lỗi ${day.name}: Vui lòng chọn một vật phẩm!`);
            }

            config[`day_${day.id}`] = { type, value };
        }

        await db.ref(`game_settings/daily_login_weeks/${weekId}`).set(config);

        this.closeTeacherModal();
        this.loadAndRenderTeacherDisplay();
        alert(`✅ Đã lưu cấu hình cho Tuần [${weekId}] thành công!`);
    }

    static async deleteConfig(weekId) {
        if (!confirm(`Bạn có chắc chắn muốn xóa sự kiện Đăng Nhập của tuần [${weekId}] không?`)) return;

        await db.ref(`game_settings/daily_login_weeks/${weekId}`).remove();
        this.loadAndRenderTeacherDisplay();
        alert('🗑 Đã xóa sự kiện thành công!');
    }

    /* =========================================================
       PHẦN 2: DÀNH CHO HỌC SINH 
       ========================================================= */

    static async checkStudentLogin(username) {
        const today = this.getTodayInfo();
        const currentWeekId = this.getWeekId();

        if (localStorage.getItem(`hide_dl_popup_${username}_${today.dateString}`)) {
            return; // Đã tick thì thoát luôn, không tải dữ liệu và không hiện popup
        }

        // 1. Tải TOÀN BỘ cấu hình các tuần thay vì chỉ tuần hiện tại
        const weeksSnap = await db.ref(`game_settings/daily_login_weeks`).once('value');
        const allWeeks = weeksSnap.val() || {};

        let targetWeekId = null;
        let config = null;
        let isUpcomingWeek = false;

        // 2. Tìm tuần ưu tiên hiển thị
        if (allWeeks[currentWeekId]) {
            targetWeekId = currentWeekId; // Ưu tiên tuần hiện tại
            config = allWeeks[currentWeekId];
        } else {
            // Nếu không có tuần hiện tại, tìm tuần SẮP DIỄN RA gần nhất
            const upcomingWeeks = Object.keys(allWeeks).filter(w => w > currentWeekId).sort();
            if (upcomingWeeks.length > 0) {
                targetWeekId = upcomingWeeks[0];
                config = allWeeks[targetWeekId];
                isUpcomingWeek = true; // Cắm cờ đây là tuần của tương lai
            }
        }

        // Không có dữ liệu của tuần này và cũng không có tuần tới -> Thoát
        if (!config) return;

        const historySnap = await db.ref(`student_daily_login/${username}`).once('value');
        let history = historySnap.val() || { lastClaimDate: '', weekId: '' };

        if (history.weekId !== targetWeekId) {
            history = { lastClaimDate: '', weekId: targetWeekId };
        }

        // 3. Logic hiển thị
        if (isUpcomingWeek) {
            // Nếu là tuần tương lai, chỉ hiện 1 lần duy nhất trong phiên đăng nhập để tránh spam khi học sinh F5
            if (!sessionStorage.getItem(`seen_upcoming_${targetWeekId}`)) {
                sessionStorage.setItem(`seen_upcoming_${targetWeekId}`, 'true');
                this.showStudentPopup(username, config, today, history, isUpcomingWeek);
            }
        } else if (config.isTestMode || history.lastClaimDate !== today.dateString) {
            // Logic cũ cho tuần hiện tại
            this.showStudentPopup(username, config, today, history, false);
        }
    }

    static showStudentPopup(username, config, today, history, isUpcomingWeek = false) {
        let cardsHtml = '';
        const isTestMode = config.isTestMode === true;

        this.daysOfWeek.forEach(day => {
            const reward = config[`day_${day.id}`];
            if (!reward) return;

            let isClaimed = history[`claimed_day_${day.id}`] === true;

            // XỬ LÝ CHÍNH: Nếu là tuần sắp diễn ra -> Ép tất cả thành Chưa đến ngày
            let isPast = !isUpcomingWeek && (day.id < today.dayOfWeek);
            let isCurrent = !isUpcomingWeek && (day.id === today.dayOfWeek);

            let stateClass = '';
            let btnHtml = '';

            if (isClaimed) {
                stateClass = 'dl-past';
                btnHtml = `<div class="dl-status-text" style="color: #10b981; font-weight: 900; margin-top: 15px; font-size: 0.9em;">✅ Đã nhận</div>`;
            } else if (isPast) {
                stateClass = 'dl-past';
                btnHtml = `<div class="dl-status-text" style="color: #ef4444; font-weight: 900; margin-top: 15px; font-size: 0.9em;">❌ Bỏ lỡ</div>`;
            } else if (isCurrent) {
                stateClass = 'dl-current';
                btnHtml = `<button class="dl-btn-claim" onclick="DailyLoginManager.claimReward('${username}', ${day.id}, '${reward.type}', '${reward.value}', '${today.dateString}', ${isTestMode})">Nhận Quà</button>`;
            } else {
                stateClass = 'dl-locked';
                btnHtml = `<div class="dl-status-text" style="color: #71717a; font-weight: 900; margin-top: 15px; font-size: 0.9em;">🔒 Chưa mở</div>`;
            }

            let displayIcon = this.rewardTypes[reward.type].icon;
            let displayName = `${reward.value} ${this.rewardTypes[reward.type].name.split(' ')[1]}`;

            if (reward.type === 'discount') displayName = `Giảm ${reward.value}%`;
            if (reward.type === 'item' && typeof StoreConfig !== 'undefined') {
                const storeItem = StoreConfig.items.find(i => i.id === reward.value);
                if (storeItem) {
                    displayIcon = storeItem.customIcon || (storeItem.value.length < 5 ? storeItem.value : '🎁');
                    displayName = storeItem.name;
                }
            }

            cardsHtml += `
                <div class="dl-day-card ${stateClass}">
                    <div class="dl-day-title">${day.name}</div>
                    <div class="dl-reward-icon">${displayIcon}</div>
                    <div class="dl-reward-name">${displayName}</div>
                    ${btnHtml}
                </div>
            `;
        });

        const testModeBanner = isTestMode
            ? `<div style="position: absolute; top: 0; left: 0; width: 100%; background: #f59e0b; color: white; padding: 6px 0; text-align: center; font-weight: bold; font-size: 0.85em; z-index: 10; border-top-left-radius: 20px; border-top-right-radius: 20px; letter-spacing: 0.5px;">🛠️ ĐANG BẬT CHẾ ĐỘ THỬ NGHIỆM (NHẬN QUÀ ẢO) 🛠️</div>`
            : '';

        // Tùy chỉnh câu chào mừng dựa theo việc tuần đó đang diễn ra hay ở tương lai
        const titleText = isUpcomingWeek ? `✨ Xem Trước Quà Tuần Tới ✨` : `✨ Quà Đăng Nhập Tuần ✨`;
        const subtitleText = isUpcomingWeek ? `Sự kiện điểm danh tuần sau (từ ${config.weekId}) sắp bắt đầu, hãy xem qua nhé!` : `Chào mừng trở lại! Hãy nhận phần thưởng của ngày hôm nay nhé.`;

        const hideTodayHtml = `
            <div style="margin-top: 20px; text-align: center;">
                <label style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.9em; color: #666; background: rgba(0,0,0,0.03); padding: 8px 15px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.05); transition: 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.08)'" onmouseout="this.style.background='rgba(0,0,0,0.03)'">
                    <input type="checkbox" onchange="DailyLoginManager.toggleHideToday('${username}', '${today.dateString}', this.checked)" style="margin: 0; width: 16px; height: 16px; cursor: pointer;">
                    Không hiển thị lại thông báo này trong hôm nay
                </label>
            </div>
        `;

        const modalHtml = `
            <div id="dl-student-modal" class="dl-overlay">
                <div class="dl-modal-content dl-student-content" style="position: relative;">
                    ${testModeBanner}
                    <button class="dl-close-btn" onclick="document.getElementById('dl-student-modal').remove()" style="z-index: 20;">✖</button>
                    <div class="dl-header-glow"></div>
                    <h1 class="dl-title" style="${isTestMode ? 'margin-top: 35px;' : ''}">${titleText}</h1>
                    <p class="dl-subtitle">${subtitleText}</p>
                    
                    <div class="dl-cards-container">
                        ${cardsHtml}
                    </div>
                    
                    ${hideTodayHtml} <!-- Gắn UI vào đây -->
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static async claimReward(username, dayId, type, value, dateString, isTestMode) {
        const btn = document.querySelector('.dl-btn-claim');
        btn.innerHTML = 'Đang xử lý...';
        btn.disabled = true;

        try {
            if (isTestMode) {
                setTimeout(() => {
                    document.getElementById('dl-student-modal').remove();
                    alert(`🛠️ [THỬ NGHIỆM] Điểm danh thành công! (Thư sẽ được gửi vào Hộp thư nhưng đây là quà ảo)`);
                }, 400);
                return;
            }

            const currentWeekId = this.getWeekId();

            const loginRef = db.ref(`student_daily_login/${username}`);
            const transactionResult = await loginRef.transaction((currentData) => {
                if (!currentData || currentData.weekId !== currentWeekId) {
                    return { weekId: currentWeekId, lastClaimDate: dateString, [`claimed_day_${dayId}`]: true };
                }
                if (currentData[`claimed_day_${dayId}`]) {
                    return undefined;
                }
                currentData.lastClaimDate = dateString;
                currentData[`claimed_day_${dayId}`] = true;
                return currentData;
            });

            if (!transactionResult.committed) {
                alert("❌ Thao tác quá nhanh hoặc bạn đã nhận quà ngày này rồi!");
                const modal = document.getElementById('dl-student-modal');
                if (modal) modal.remove();
                return;
            }

            // ĐOẠN CODE MỚI BỔ SUNG KIỂM TRA STORECONFIG
            let discountTargets = ['all'];
            
            if (type === 'discount') {
                // Kiểm tra xem StoreConfig đã tồn tại, có mảng items và đã load dữ liệu chưa
                if (typeof StoreConfig !== 'undefined' && Array.isArray(StoreConfig.items) && StoreConfig.items.length > 0) {
                    const validItems = StoreConfig.items.filter(item => typeof item.price === 'number' && item.price <= 500);
                    if (validItems.length > 0) {
                        discountTargets = validItems.map(item => item.id);
                    }
                } else {
                    // Chặn ngang quá trình nhận quà nếu Cửa hàng chưa load xong để bảo vệ logic lọc
                    alert("⏳ Hệ thống dữ liệu vật phẩm đang được đồng bộ. Vui lòng đợi khoảng 2-3 giây rồi bấm Nhận Quà lại nhé!");
                    btn.innerHTML = 'Nhận Quà';
                    btn.disabled = false;
                    return; // Dừng hoàn toàn hàm claimReward
                }
            }

            // 1. Lấy độ lệch thời gian (mili-giây) giữa máy khách hiện tại và máy chủ Firebase
            const offsetSnap = await db.ref(".info/serverTimeOffset").once("value");
            const offset = offsetSnap.val() || 0;
            
            // 2. Tính toán thời gian thực của máy chủ (an toàn tuyệt đối trước việc đổi giờ thiết bị)
            const trueServerTimeMs = Date.now() + offset;
            const trueServerDate = new Date(trueServerTimeMs);
            
            // 3. Tính hạn sử dụng 7 ngày dựa trên thời gian thực
            const expiryTimestamp = trueServerTimeMs + (7 * 24 * 60 * 60 * 1000);
            const message = `Chào mừng em trở lại hệ thống!\\nĐây là phần quà đăng nhập ngày ${dayId} của tuần này. Nhớ duy trì điểm danh mỗi ngày nhé!`;

            const payload = {
                message: message,
                giftType: type,
                giftValue: value,
                // Dùng hằng số của Firebase để tự động ghi mốc thời gian chuẩn xác nhất lúc nhận request
                timestamp: firebase.database.ServerValue.TIMESTAMP, 
                // Định dạng ngày giờ dựa trên thời gian server đã đồng bộ ở trên
                timeString: trueServerDate.toLocaleString('vi-VN'), 
                expiry: expiryTimestamp,
                discountExpiry: expiryTimestamp,
                discountTargetItem: discountTargets,
                source: 'daily_login' 
            };

            await db.ref(`inbox_messages/${username}`).push(payload);

            document.getElementById('dl-student-modal').remove();
            alert(`🎉 Điểm danh thành công! Phần thưởng đã được đóng gói và gửi vào Hộp thư đến 📬 của bạn.`);

        } catch (error) {
            console.error(error);
            alert("❌ Có lỗi xảy ra khi nhận quà. Vui lòng thử lại!");
            btn.innerHTML = 'Nhận Quà';
            btn.disabled = false;
        }
    }

    static toggleHideToday(username, dateString, isChecked) {
        const storageKey = `hide_dl_popup_${username}_${dateString}`;
        if (isChecked) {
            localStorage.setItem(storageKey, 'true');
        } else {
            localStorage.removeItem(storageKey);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    DailyLoginManager.init();
});