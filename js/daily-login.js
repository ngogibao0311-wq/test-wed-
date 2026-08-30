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

    static async claimReward(
        username,
        clickedDayId,
        _clientType,
        _clientValue,
        _clientDateString,
        _clientTestMode
    ) {
        const btn = document.querySelector('.dl-btn-claim');

        if (!btn || btn.disabled) return;

        const originalButtonText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '⏳ Đang xác minh...';

        const TIME_ZONE = 'Asia/Ho_Chi_Minh';
        const CLAIM_PREFIX = 'claimed_day_';

        let loginRef = null;
        let claimCommitted = false;
        let rewardGranted = false;

        let serverDateString = '';
        let serverWeekId = '';
        let serverDayId = 0;

        /**
         * Chuyển timestamp thành thông tin ngày tại Việt Nam.
         */
        const getVietnamDateInfo = timestamp => {
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: TIME_ZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                weekday: 'short'
            }).formatToParts(new Date(timestamp));

            const values = {};

            parts.forEach(part => {
                if (part.type !== 'literal') {
                    values[part.type] = part.value;
                }
            });

            const weekdayMap = {
                Mon: 1,
                Tue: 2,
                Wed: 3,
                Thu: 4,
                Fri: 5,
                Sat: 6,
                Sun: 7
            };

            const dayId = weekdayMap[values.weekday];

            if (!dayId) {
                throw new Error('INVALID_SERVER_WEEKDAY');
            }

            const dateString =
                `${values.year}-${values.month}-${values.day}`;

            /*
             * Dùng UTC để tính ngày thứ Hai.
             * dateString đã được lấy theo múi giờ Việt Nam.
             */
            const currentDate = new Date(`${dateString}T00:00:00Z`);
            currentDate.setUTCDate(
                currentDate.getUTCDate() - (dayId - 1)
            );

            const mondayYear = currentDate.getUTCFullYear();
            const mondayMonth = String(
                currentDate.getUTCMonth() + 1
            ).padStart(2, '0');
            const mondayDate = String(
                currentDate.getUTCDate()
            ).padStart(2, '0');

            return {
                dayId,
                dateString,
                weekId: `${mondayYear}-${mondayMonth}-${mondayDate}`
            };
        };

        /**
         * Chuẩn hóa số lượng phần thưởng.
         */
        const normalizePositiveInteger = (
            value,
            min = 1,
            max = 9999999
        ) => {
            const number = Number(value);

            if (
                !Number.isInteger(number) ||
                number < min ||
                number > max
            ) {
                throw new Error('INVALID_REWARD_VALUE');
            }

            return number;
        };

        /**
         * Gỡ trạng thái điểm danh nếu trao quà thất bại.
         */
        const rollbackDailyLogin = async () => {
            if (!loginRef || !claimCommitted || rewardGranted) {
                return;
            }

            try {
                await loginRef.transaction(currentData => {
                    if (
                        !currentData ||
                        currentData.weekId !== serverWeekId
                    ) {
                        return currentData;
                    }

                    const claimKey =
                        `${CLAIM_PREFIX}${serverDayId}`;

                    if (currentData[claimKey] !== true) {
                        return currentData;
                    }

                    delete currentData[claimKey];

                    if (
                        currentData.lastClaimDate === serverDateString
                    ) {
                        currentData.lastClaimDate = '';
                    }

                    if (
                        currentData.rewardMeta &&
                        currentData.rewardMeta[`day_${serverDayId}`]
                    ) {
                        delete currentData.rewardMeta[
                            `day_${serverDayId}`
                        ];
                    }

                    return currentData;
                });

                console.warn(
                    '↩️ Đã rollback trạng thái điểm danh vì trao quà lỗi.'
                );
            } catch (rollbackError) {
                console.error(
                    '❌ Không thể rollback điểm danh:',
                    rollbackError
                );
            }
        };

        try {
            /* =====================================================
               1. KIỂM TRA PHIÊN ĐĂNG NHẬP
               ===================================================== */

            const authUser = firebase.auth().currentUser;

            if (!authUser) {
                throw new Error('AUTH_REQUIRED');
            }

            const localUser = JSON.parse(
                localStorage.getItem('currentUser') || 'null'
            );

            if (
                !localUser ||
                localUser.role !== 'student' ||
                localUser.username !== username
            ) {
                throw new Error('LOCAL_USER_MISMATCH');
            }

            /*
             * Đối chiếu trực tiếp user theo Firebase UID.
             * Cấu trúc users của bạn đang dùng UID làm key.
             */
            const userSnapshot = await db
                .ref(`users/${authUser.uid}`)
                .once('value');

            const databaseUser = userSnapshot.val();

            if (
                !databaseUser ||
                databaseUser.role !== 'student' ||
                databaseUser.username !== username
            ) {
                throw new Error('DATABASE_USER_MISMATCH');
            }

            /* =====================================================
               2. LẤY THỜI GIAN FIREBASE
               ===================================================== */

            btn.innerHTML = '⏳ Đang kiểm tra thời gian...';

            const offsetSnapshot = await db
                .ref('.info/serverTimeOffset')
                .once('value');

            const serverOffset =
                Number(offsetSnapshot.val()) || 0;

            const serverTimestamp =
                Date.now() + serverOffset;

            const serverInfo =
                getVietnamDateInfo(serverTimestamp);

            serverDateString = serverInfo.dateString;
            serverWeekId = serverInfo.weekId;
            serverDayId = serverInfo.dayId;

            if (Number(clickedDayId) !== serverDayId) {
                throw new Error('STALE_DAILY_LOGIN_POPUP');
            }

            /* =====================================================
               3. ĐỌC CẤU HÌNH THẬT TỪ FIREBASE
               ===================================================== */

            btn.innerHTML = '⏳ Đang kiểm tra phần thưởng...';

            const configSnapshot = await db
                .ref(
                    `game_settings/daily_login_weeks/${serverWeekId}`
                )
                .once('value');

            const config = configSnapshot.val();

            if (!config) {
                throw new Error('DAILY_LOGIN_CONFIG_NOT_FOUND');
            }

            /*
             * Không sử dụng isTestMode truyền từ HTML,
             * vì người dùng có thể sửa nó bằng Console.
             */
            if (config.isTestMode === true) {
                document
                    .getElementById('dl-student-modal')
                    ?.remove();

                alert(
                    '🛠️ Chế độ thử nghiệm: hệ thống không ghi nhận và không trao quà thật.'
                );

                return;
            }

            const reward =
                config[`day_${serverDayId}`];

            if (
                !reward ||
                !reward.type ||
                reward.value === undefined ||
                reward.value === null
            ) {
                throw new Error('TODAY_REWARD_NOT_CONFIGURED');
            }

            const allowedRewardTypes = [
                'coin',
                'ticket',
                'discount',
                'item',
                'money'
            ];

            if (!allowedRewardTypes.includes(reward.type)) {
                throw new Error('INVALID_REWARD_TYPE');
            }

            /*
             * Chuẩn bị dữ liệu trước khi đánh dấu đã nhận.
             * Như vậy lỗi StoreConfig sẽ không làm mất lượt.
             */
            let preparedRewardValue = reward.value;
            let discountTargets = [];

            if (reward.type === 'coin') {
                preparedRewardValue =
                    normalizePositiveInteger(
                        reward.value,
                        1,
                        9999999
                    );
            }

            if (reward.type === 'ticket') {
                preparedRewardValue =
                    normalizePositiveInteger(
                        reward.value,
                        1,
                        999
                    );
            }

            if (reward.type === 'money') {
                preparedRewardValue =
                    normalizePositiveInteger(
                        reward.value,
                        1,
                        9999999
                    );
            }

            if (reward.type === 'discount') {
                preparedRewardValue =
                    normalizePositiveInteger(
                        reward.value,
                        1,
                        100
                    );

                if (
                    typeof StoreConfig === 'undefined' ||
                    !Array.isArray(StoreConfig.items) ||
                    StoreConfig.items.length === 0
                ) {
                    throw new Error('STORE_CONFIG_NOT_READY');
                }

                discountTargets = StoreConfig.items
                    .filter(item =>
                        typeof item.price === 'number' &&
                        item.price <= 500
                    )
                    .map(item => item.id);

                if (discountTargets.length === 0) {
                    throw new Error(
                        'NO_VALID_DISCOUNT_TARGETS'
                    );
                }
            }

            if (reward.type === 'item') {
                preparedRewardValue =
                    String(reward.value || '').trim();

                if (!preparedRewardValue) {
                    throw new Error('INVALID_ITEM_ID');
                }

                if (
                    typeof StoreConfig === 'undefined' ||
                    !Array.isArray(StoreConfig.items)
                ) {
                    throw new Error('STORE_CONFIG_NOT_READY');
                }

                const itemExists = StoreConfig.items.some(
                    item => item.id === preparedRewardValue
                );

                if (!itemExists) {
                    throw new Error('STORE_ITEM_NOT_FOUND');
                }
            }

            /* =====================================================
               4. ĐÁNH DẤU ĐIỂM DANH BẰNG TRANSACTION
               ===================================================== */

            btn.innerHTML = '⏳ Đang ghi nhận điểm danh...';

            loginRef = db.ref(
                `student_daily_login/${username}`
            );

            const claimKey =
                `${CLAIM_PREFIX}${serverDayId}`;

            const claimResult =
                await loginRef.transaction(currentData => {
                    let updatedData =
                        currentData &&
                            typeof currentData === 'object'
                            ? { ...currentData }
                            : {};

                    /*
                     * Sang tuần mới thì reset lịch sử tuần cũ.
                     */
                    if (
                        updatedData.weekId !== serverWeekId
                    ) {
                        updatedData = {
                            weekId: serverWeekId
                        };
                    }

                    /*
                     * Đã nhận rồi thì abort transaction.
                     */
                    if (updatedData[claimKey] === true) {
                        return;
                    }

                    updatedData.weekId = serverWeekId;
                    updatedData.lastClaimDate =
                        serverDateString;
                    updatedData[claimKey] = true;

                    updatedData.rewardMeta = {
                        ...(updatedData.rewardMeta || {}),
                        [`day_${serverDayId}`]: {
                            type: reward.type,
                            value: preparedRewardValue,
                            status: 'processing',
                            claimDate: serverDateString,
                            startedAt:
                                firebase.database.ServerValue
                                    .TIMESTAMP
                        }
                    };

                    return updatedData;
                });

            if (!claimResult.committed) {
                throw new Error('REWARD_ALREADY_CLAIMED');
            }

            claimCommitted = true;

            /* =====================================================
               5. TRAO QUÀ TRỰC TIẾP
               ===================================================== */

            btn.innerHTML = '🎁 Đang trao phần thưởng...';

            switch (reward.type) {
                case 'coin': {
                    const coinRef = db.ref(
                        `student_coins/${username}`
                    );

                    const result =
                        await coinRef.transaction(currentValue => {
                            return (
                                (Number(currentValue) || 0) +
                                preparedRewardValue
                            );
                        });

                    if (!result.committed) {
                        throw new Error(
                            'COIN_TRANSACTION_FAILED'
                        );
                    }

                    break;
                }

                case 'ticket': {
                    const ticketRef = db.ref(
                        `student_bonus_tickets/${username}`
                    );

                    const result =
                        await ticketRef.transaction(
                            currentValue => {
                                const newValue =
                                    (Number(currentValue) || 0) +
                                    preparedRewardValue;

                                /*
                                 * Rules của bạn giới hạn tối đa 999 vé.
                                 */
                                if (newValue > 999) {
                                    return;
                                }

                                return newValue;
                            }
                        );

                    if (!result.committed) {
                        throw new Error(
                            'TICKET_LIMIT_OR_TRANSACTION_FAILED'
                        );
                    }

                    break;
                }

                case 'money': {
                    const moneyRef = db.ref(
                        `student_money_offset/${username}`
                    );

                    const result =
                        await moneyRef.transaction(
                            currentValue => {
                                const newValue =
                                    (Number(currentValue) || 0) +
                                    preparedRewardValue;

                                if (newValue > 9999999) {
                                    return;
                                }

                                return newValue;
                            }
                        );

                    if (!result.committed) {
                        throw new Error(
                            'MONEY_LIMIT_OR_TRANSACTION_FAILED'
                        );
                    }

                    break;
                }

                case 'item': {
                    await db
                        .ref(
                            `student_inventory/${username}/${preparedRewardValue}`
                        )
                        .update({
                            id: preparedRewardValue,
                            purchaseTime:
                                firebase.database.ServerValue
                                    .TIMESTAMP,
                            source: 'daily_login',
                            isTrial: null,
                            trialExpiry: null,
                            isEquipped: false
                        });

                    break;
                }

                case 'discount': {
                    const expiryTimestamp =
                        serverTimestamp +
                        7 * 24 * 60 * 60 * 1000;

                    await db
                        .ref(`student_discounts/${username}`)
                        .push({
                            percent: preparedRewardValue,
                            dateAcquired:
                                firebase.database.ServerValue
                                    .TIMESTAMP,
                            isUsed: false,
                            expiry: expiryTimestamp,
                            targetItem: discountTargets,
                            source: 'daily_login',
                            weekId: serverWeekId,
                            dayId: serverDayId
                        });

                    break;
                }

                default:
                    throw new Error('UNSUPPORTED_REWARD_TYPE');
            }

            rewardGranted = true;

            /* =====================================================
               6. CẬP NHẬT TRẠNG THÁI HOÀN THÀNH
               ===================================================== */

            try {
                await loginRef.update({
                    [`rewardMeta/day_${serverDayId}/status`]:
                        'completed',

                    [`rewardMeta/day_${serverDayId}/completedAt`]:
                        firebase.database.ServerValue.TIMESTAMP
                });
            } catch (metaError) {
                /*
                 * Phần thưởng đã trao thành công rồi.
                 * Lỗi metadata không được rollback quà.
                 */
                console.warn(
                    '⚠️ Quà đã trao nhưng không cập nhật được metadata:',
                    metaError
                );
            }

            document
                .getElementById('dl-student-modal')
                ?.remove();

            let rewardText = '';

            switch (reward.type) {
                case 'coin':
                    rewardText =
                        `${preparedRewardValue.toLocaleString(
                            'vi-VN'
                        )} Coin`;
                    break;

                case 'ticket':
                    rewardText =
                        `${preparedRewardValue} vé quay`;
                    break;

                case 'money':
                    rewardText =
                        `${preparedRewardValue.toLocaleString(
                            'vi-VN'
                        )} đồng`;
                    break;

                case 'discount':
                    rewardText =
                        `phiếu giảm giá ${preparedRewardValue}%`;
                    break;

                case 'item': {
                    const item = StoreConfig.items.find(
                        storeItem =>
                            storeItem.id === preparedRewardValue
                    );

                    rewardText = item
                        ? item.name
                        : 'một vật phẩm';
                    break;
                }
            }

            alert(
                `🎉 Điểm danh thành công!\nBạn đã nhận được ${rewardText}.`
            );
        } catch (error) {
            console.error('❌ Daily Login Error:', {
                code: error.code,
                message: error.message,
                error
            });

            await rollbackDailyLogin();

            const errorCode =
                error.code || error.message || 'UNKNOWN_ERROR';

            const errorMessages = {
                AUTH_REQUIRED:
                    'Phiên đăng nhập Firebase đã hết hạn. Vui lòng đăng nhập lại.',

                LOCAL_USER_MISMATCH:
                    'Thông tin tài khoản trên thiết bị không hợp lệ.',

                DATABASE_USER_MISMATCH:
                    'UID Firebase không khớp với tài khoản học sinh.',

                STALE_DAILY_LOGIN_POPUP:
                    'Thông báo điểm danh đã cũ hoặc ngày đã thay đổi. Hãy tải lại trang.',

                DAILY_LOGIN_CONFIG_NOT_FOUND:
                    'Tuần này chưa được giáo viên thiết lập quà điểm danh.',

                TODAY_REWARD_NOT_CONFIGURED:
                    'Hôm nay chưa được cấu hình phần thưởng.',

                INVALID_REWARD_TYPE:
                    'Loại phần thưởng không hợp lệ.',

                INVALID_REWARD_VALUE:
                    'Giá trị phần thưởng không hợp lệ.',

                STORE_CONFIG_NOT_READY:
                    'Dữ liệu cửa hàng chưa tải xong. Hãy đợi vài giây rồi thử lại.',

                STORE_ITEM_NOT_FOUND:
                    'Vật phẩm được cấu hình không tồn tại trong cửa hàng.',

                NO_VALID_DISCOUNT_TARGETS:
                    'Không có vật phẩm phù hợp để áp dụng phiếu giảm giá.',

                REWARD_ALREADY_CLAIMED:
                    'Bạn đã nhận phần thưởng hôm nay rồi.',

                TICKET_LIMIT_OR_TRANSACTION_FAILED:
                    'Không thể cộng vé vì số vé sẽ vượt giới hạn 999.',

                MONEY_LIMIT_OR_TRANSACTION_FAILED:
                    'Không thể cộng tiền vì vượt giới hạn hệ thống.',

                PERMISSION_DENIED:
                    'Firebase Rules không cho phép thực hiện thao tác này.'
            };

            const displayMessage =
                errorMessages[errorCode] ||
                errorMessages[error.message] ||
                `Có lỗi xảy ra: ${errorCode}`;

            alert(`❌ ${displayMessage}`);

            if (
                btn &&
                document.body.contains(btn)
            ) {
                btn.disabled = false;
                btn.innerHTML = originalButtonText;
            }
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