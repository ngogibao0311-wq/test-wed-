// leaderboard.js

// 1. KHỞI TẠO GIAO DIỆN BẢNG XẾP HẠNG
function initLeaderboardSystem() {
    // Chèn nút vào giao diện
    const bagBtn = document.querySelector('.bag-trigger-btn');
    if (bagBtn) {
        const lbBtn = document.createElement('button');
        lbBtn.className = 'leaderboard-trigger-btn';
        lbBtn.title = 'Bảng xếp hạng thi đua';
        lbBtn.innerHTML = '🏆';
        lbBtn.onclick = openLeaderboardModal;
        bagBtn.parentNode.insertBefore(lbBtn, bagBtn);
    }

    // Chèn Modal HTML
    const modalHTML = `
    <div id="leaderboardModal" class="modal-overlay" style="z-index: 999998;">
        <div class="modal-content form-container" style="max-width: 600px; background: rgba(255, 255, 255, 0.98); border-top: 6px solid #f1c40f; border-radius: 12px; box-shadow: 0 15px 30px rgba(0,0,0,0.2);">
            <button class="close-btn" onclick="closeLeaderboardModal()">✖</button>
            <h3 style="color: #f39c12; margin-bottom: 5px; font-size: 1.6em; text-align: center; text-transform: uppercase; font-weight: 900;">
                🏆 Bảng Xếp Hạng Thi Đua
            </h3>
            
            <div style="text-align: center; margin-bottom: 15px; border-bottom: 1px solid rgba(241, 196, 15, 0.2); padding-bottom: 10px; display: flex; justify-content: center; align-items: center; gap: 8px;">
                <span id="lbMonthDisplay" style="color: #64748b; font-weight: bold; font-size: 1.05em;"></span>
                <button onclick="openRulesModal()" title="Xem Quy chế thi đua" style="background: #3b82f6; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-weight: bold; cursor: pointer; font-size: 0.9em; box-shadow: 0 2px 5px rgba(59,130,246,0.4); display: flex; justify-content: center; align-items: center; transition: 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">?</button>
            </div>
            
            <div id="leaderboardBody" style="max-height: 55vh; overflow-y: auto; padding: 5px; margin-bottom: 5px;">
                <div style="text-align:center; padding: 30px; color: #888;">⏳ Đang đồng bộ và tính toán dữ liệu...</div>
            </div>
        </div>
    </div>

    <div id="rulesModal" class="modal-overlay" style="z-index: 999999; background: rgba(0,0,0,0.5);">
        <div class="modal-content form-container" style="max-width: 500px; text-align: left; border-top: 6px solid #3b82f6; border-radius: 12px; padding: 25px;">
            <button class="close-btn" onclick="closeRulesModal()">✖</button>
            <h3 style="color: #3b82f6; margin-top: 0; margin-bottom: 15px; font-size: 1.4em; text-align: center; text-transform: uppercase;">📜 Quy Chế Thi Đua</h3>
            
            <div style="max-height: 60vh; overflow-y: auto; font-size: 0.95em; color: #444; line-height: 1.6; padding-right: 10px;">
                <h4 style="color: #2c3e50; margin-bottom: 5px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">1. Tính Điểm Xếp Hạng</h4>
                <ul style="margin-top: 5px; padding-left: 20px;">
                    <li><strong>Điểm xếp hạng</strong> = ĐTB bài hợp lệ + Điểm thưởng video (Tối đa +1.0đ).</li>
                    <li>Chỉ tính bài tập đã chấm điểm. Điều kiện để lọt vào BXH là có <strong>ít nhất 1 bài hợp lệ</strong>.</li>
                    <li>Thứ tự ưu tiên xếp hạng: <strong>Điểm xếp hạng cao hơn</strong> > <strong>Số bài điểm 10 nhiều hơn</strong> > <strong>Số lần vi phạm ít hơn</strong>.</li>
                </ul>

                <h4 style="color: #e11d48; margin-bottom: 5px; margin-top: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">2. Các Hình Thức Vi Phạm</h4>
                <ul style="margin-top: 5px; padding-left: 20px;">
                    <li><strong>Nộp trễ hạn / Thu tự động:</strong> Bài làm sẽ không được tính vào ĐTB và bị ghi nhận 1 lần vi phạm.</li>
                    <li><strong>Gian lận thi cử:</strong> Thoát toàn màn hình, mở tab khác. Bị thu bài, không tính vào ĐTB, ghi nhận 1 lần vi phạm.</li>
                    <li><strong>Vi phạm nộp tự luận:</strong> Thiếu file đính kèm hoặc văn bản. Bị 0đ phần tự luận và ghi nhận 1 lần vi phạm.</li>
                    <li><strong>Không hoàn thành video:</strong> Chưa xem đủ thời gian, không được mở khóa bài tập (không được tính ĐTB).</li>
                </ul>

                <h4 style="color: #f39c12; margin-bottom: 5px; margin-top: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">3. Cơ Chế Phần Thưởng (Cuối Tháng)</h4>
                <ul style="margin-top: 5px; padding-left: 20px; list-style-type: none;">
                    <li style="margin-bottom: 8px;">🥇 <strong>Hạng 1:</strong> 1 Rương Kho Báu.</li>
                    <li style="margin-bottom: 8px;">🥈 <strong>Hạng 2:</strong> 1 Thẻ giảm giá ngẫu nhiên.</li>
                    <li style="margin-bottom: 8px;">🥉 <strong>Hạng 3:</strong> Nhận ngay 100 Coin.</li>
                    <li>🎖️ <strong>Hạng 4 trở đi:</strong> Nhận 50 Coin khích lệ.</li>
                </ul>
            </div>
            
            <button onclick="closeRulesModal()" style="width: 100%; padding: 12px; margin-top: 20px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: bold; color: #334155; cursor: pointer; transition: 0.2s;">Đã hiểu</button>
        </div>
    </div>
    <!-- ... Giữ nguyên HTML của treasureChestModal ... -->
    <div id="treasureChestModal" class="modal-overlay" style="z-index: 999999;">
        <div class="modal-content treasure-chest-box" style="max-width: 480px; text-align: center; border-radius: 16px;">
            <button class="close-btn" onclick="document.getElementById('treasureChestModal').classList.remove('active')" style="color: white; background: rgba(255,255,255,0.1);">✖</button>
            <div style="font-size: 4em; filter: drop-shadow(0 0 20px rgba(241, 196, 15, 0.8)); margin-bottom: 10px;">🎁</div>
            <h3 style="color: #f1c40f; font-size: 1.8em; text-transform: uppercase; margin-bottom: 10px;">Rương Kho Báu</h3>
            <p style="color: #cbd5e1; margin-bottom: 25px; font-size: 0.95em;">Hệ thống phát hiện bạn đang sở hữu Rương Hạng 1. Hãy chọn 1 phần thưởng:</p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="claimChestReward('coin')" style="padding: 15px; border-radius: 12px; border: 2px dashed #f1c40f; background: rgba(241, 196, 15, 0.1); color: #f1c40f; font-size: 1.1em; font-weight: bold; cursor: pointer; transition: 0.2s;">
                    💰 Lựa chọn 1: Nhận Ngẫu Nhiên Coin<br>
                    <span style="font-size: 0.8em; color: #94a3b8; font-weight: normal;">(Tỉ lệ nhận 200 - 1000 Coin)</span>
                </button>
                <button onclick="claimChestReward('item')" style="padding: 15px; border-radius: 12px; border: 2px dashed #38ef7d; background: rgba(56, 239, 125, 0.1); color: #38ef7d; font-size: 1.1em; font-weight: bold; cursor: pointer; transition: 0.2s;">
                    📦 Lựa chọn 2: Vật Phẩm Ngẫu Nhiên<br>
                    <span style="font-size: 0.8em; color: #94a3b8; font-weight: normal;">(Có 1% cơ hội ra vật phẩm Truyền Thuyết)</span>
                </button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// CÁC HÀM ĐÓNG MỞ MODAL QUY CHẾ
window.openRulesModal = function() {
    document.getElementById('rulesModal').classList.add('active');
};

window.closeRulesModal = function() {
    document.getElementById('rulesModal').classList.remove('active');
};

// 2. MỞ BẢNG XẾP HẠNG VÀ TÍNH TOÁN
window.openLeaderboardModal = async function() {
    // Chặn mở bảng xếp hạng nếu học sinh đang trong bài thi nghiêm ngặt
    if (window.currentActiveExamId) {
        window.showExamLockWarning("⚠️ Bảng xếp hạng tạm khóa khi đang làm bài thi!");
        return;
    }

    // Lấy trạng thái cài đặt từ Giáo viên
    const lbSettingsSnap = await db.ref('leaderboard_settings').once('value');
    const lbSettings = lbSettingsSnap.val() || { isOpen: false };

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let isSeasonActive = lbSettings.isOpen;

    // LOGIC TỰ ĐỘNG MỞ LẠI KHI ĐẾN LỊCH HẸN:
    // Nếu giáo viên đang TẮT bảng xếp hạng nhưng có thiết lập lịch hẹn tương lai
    if (!isSeasonActive && lbSettings.targetMonth && lbSettings.targetYear) {
        // Kiểm tra xem thời gian thực tế đã đạt hoặc vượt qua mốc tháng/năm hẹn chưa
        if (currentYear > lbSettings.targetYear || (currentYear === lbSettings.targetYear && currentMonth >= lbSettings.targetMonth)) {
            isSeasonActive = true;
            // Kích hoạt đồng bộ ngầm trạng thái mở lên cơ sở dữ liệu để hệ thống hoạt động bình thường
            await db.ref('leaderboard_settings').update({ isOpen: true });
        }
    }

    // Nếu sau khi kiểm tra lịch hẹn mà bảng xếp hạng vẫn đóng (chưa đến thời gian)
    if (!isSeasonActive) {
        if (lbSettings.targetMonth && lbSettings.targetYear) {
            // Trường hợp có lịch hẹn tương lai
            alert(`🔒 Bảng xếp hạng thi đua hiện đang đóng để bảo trì. Mùa giải mới sẽ chính thức bắt đầu vào Tháng ${lbSettings.targetMonth}/${lbSettings.targetYear}!`);
        } else {
            // Trường hợp giáo viên tắt và xóa lịch (Mặc định hiển thị thông báo chưa bắt đầu)
            alert(`🔒 Bảng xếp hạng đang bị khóa do chưa bắt đầu mùa giải!`);
        }
        return;
    }

    // Nếu hợp lệ thì hiển thị modal bảng xếp hạng
    const lbModal = document.getElementById('leaderboardModal');
    if (lbModal) {
        lbModal.classList.add('active');
        if (typeof calculateAndRenderLeaderboard === 'function') {
            await calculateAndRenderLeaderboard();
        }
    }
};

window.closeLeaderboardModal = function() {
    document.getElementById('leaderboardModal').classList.remove('active');
};

async function calculateAndRenderLeaderboard() {
    const body = document.getElementById('leaderboardBody');
    const monthDisplay = document.getElementById('lbMonthDisplay');
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    monthDisplay.innerText = `Thống kê Tháng ${currentMonth + 1}/${currentYear}`;

    try {
        // Tích hợp việc gọi thêm dữ liệu video_tracking từ Firebase
        const [users, assignments, submissions, trackingSnap] = await Promise.all([
            getDB('users'),
            getDB('assignments'),
            getDB('submissions'),
            db.ref('video_tracking').once('value')
        ]);

        const trackingData = trackingSnap.val() || {};
        const students = users.filter(u => u.role === 'student');
        let rankedData = [];

        // Lọc trước danh sách bài tập thuộc tháng hiện tại để tối ưu vòng lặp
        const monthAssignments = assignments.filter(assign => {
            if (!assign.endDate) return false;
            const assignDate = new Date(assign.endDate.replace(" ", "T"));
            return assignDate.getMonth() === currentMonth && assignDate.getFullYear() === currentYear;
        });

        students.forEach(student => {
            let totalScore = 0;
            let validCount = 0;
            let count10s = 0;
            let violationCount = 0;
            let totalVideoBonus = 0;

            // 1. TÍNH ĐIỂM THƯỞNG TỪ THỜI GIAN XEM VIDEO TRONG THÁNG
            monthAssignments.forEach(assign => {
                if (assign.watchCondition && assign.watchCondition > 0) {
                    let watchedTime = 0;
                    if (trackingData[assign.id] && trackingData[assign.id][student.username]) {
                        watchedTime = trackingData[assign.id][student.username];
                    }
                    
                    let ratio = watchedTime / assign.watchCondition;
                    if (ratio > 1) ratio = 1; // Giới hạn tỉ lệ ở mức 1
                    
                    let bonus = ratio * 0.5; // Tối đa 0.5 điểm/video
                    totalVideoBonus += bonus;
                }
            });

            // Tổng điểm thưởng video không vượt quá 1.0 điểm
            if (totalVideoBonus > 1.0) totalVideoBonus = 1.0;

            // 2. LỌC BÀI NỘP VÀ TÍNH ĐIỂM TRUNG BÌNH (ĐTB)
            const studentSubs = submissions.filter(s => s.studentUsername === student.username);

            studentSubs.forEach(sub => {
                const assign = monthAssignments.find(a => a.id === sub.assignmentId);
                if (!assign) return;

                // Chỉ tính các bài đã có điểm và không đang chấm lại
                if (sub.grade === null || sub.grade === undefined || sub.grade === '' || sub.isRegrading) return;

                const isLate = sub.isLateFail || sub.isAutoSubmitted;
                const isCheat = sub.isCheatFail;
                const isMissingEssay = sub.isEssayMissing;

                // Xử lý vi phạm và Tha lỗi (forcePass)
                if (sub.forcePass) {
                    // Giáo viên đã tha lỗi -> Bài tập trở nên hợp lệ toàn phần, không tính vi phạm
                } else {
                    // Ghi nhận tổng số lần vi phạm (Sẽ dùng làm tiêu chí xếp hạng 3)
                    if (isLate || isCheat || isMissingEssay) {
                        violationCount++;
                    }
                    // Bài nộp trễ hoặc gian lận không được tính vào ĐTB
                    if (isLate || isCheat) {
                        return; 
                    }
                }

                // Cộng điểm (Trên hệ thang 10.0)
                let score = parseFloat(sub.grade) || 0;
                totalScore += score;
                validCount++;

                if (score === 10) count10s++;
            });

            // Tính ĐTB làm tròn 2 chữ số
            const dtb = validCount > 0 ? (totalScore / validCount) : 0;
            const roundedDTB = Math.round(dtb * 100) / 100;
            
            // Tính điểm xếp hạng tổng
            const finalScore = roundedDTB + totalVideoBonus;

            // Chỉ những học sinh có ít nhất 1 bài tập hợp lệ mới được đưa vào
            if (validCount > 0) {
                rankedData.push({
                    name: student.name,
                    username: student.username,
                    avatar: student.avatar || '👤',
                    finalScore: Math.round(finalScore * 100) / 100, // Điểm xếp hạng
                    dtb: roundedDTB, // Lưu lại để hiển thị UI
                    videoBonus: Math.round(totalVideoBonus * 100) / 100, // Lưu lại để hiển thị UI
                    tens: count10s,
                    violations: violationCount
                });
            }
        });

        // 3. THUẬT TOÁN SẮP XẾP: 
        // Ưu tiên 1: Điểm xếp hạng giảm dần
        // Ưu tiên 2: Số điểm 10 giảm dần
        // Ưu tiên 3: Số vi phạm tăng dần
        rankedData.sort((a, b) => {
            if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
            if (b.tens !== a.tens) return b.tens - a.tens;
            return a.violations - b.violations;
        });

        // 4. RENDER GIAO DIỆN
        if (rankedData.length === 0) {
            body.innerHTML = '<div style="text-align:center; padding: 30px; color: #64748b; font-style: italic;">Chưa có dữ liệu xếp hạng hợp lệ trong tháng này.</div>';
            return;
        }

        let html = '';
        rankedData.forEach((st, index) => {
            let rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : (index === 2 ? 'rank-3' : ''));
            let rankIcon = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `#${index + 1}`));
            
            let avatarHtml = st.avatar.startsWith('data:image') 
                ? `<img src="${st.avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;">`
                : `<div style="font-size: 1.8em;">👤</div>`;

            html += `
            <div class="rank-row ${rankClass}">
                <div class="rank-info">
                    <div class="rank-number">${rankIcon}</div>
                    ${avatarHtml}
                    <div class="rank-name">${st.name} ${st.username === currentUser.username ? '<span style="color:#059669; font-size:0.8em;">(Bạn)</span>' : ''}</div>
                </div>
                <div class="rank-stats" style="text-align: right; display: flex; flex-direction: column; gap: 4px;">
                    <span class="rank-score" style="font-size: 1.2em; font-weight: 900;">${st.finalScore} <span style="font-size: 0.55em; color: #64748b; font-weight: normal;">(ĐTB: ${st.dtb} + Video: ${st.videoBonus})</span></span>
                    <span style="font-size: 0.85em; color: #475569;">Điểm 10: <strong>${st.tens}</strong> | Vi phạm: <strong style="color: ${st.violations > 0 ? '#e11d48' : '#059669'}">${st.violations}</strong></span>
                </div>
            </div>`;
        });

        body.innerHTML = html;

    } catch (e) {
        body.innerHTML = '<div style="text-align:center; padding: 30px; color: #e11d48;">❌ Lỗi kết nối dữ liệu. Vui lòng thử lại sau!</div>';
        console.error(e);
    }
}

// 3. TÍCH HỢP MỞ RƯƠNG KHO BÁU TỪ TÚI ĐỒ (Hoặc gọi toàn cục)
window.openTreasureChest = function() {
    document.getElementById('treasureChestModal').classList.add('active');
};

// 4. THUẬT TOÁN NHẬN THƯỞNG RƯƠNG KHO BÁU
window.claimChestReward = async function(choiceType) {
    const btnNodes = document.querySelectorAll('#treasureChestModal button:not(.close-btn)');
    btnNodes.forEach(btn => { btn.disabled = true; btn.style.opacity = '0.5'; });

    try {
        // Lấy cấu hình rương từ Firebase
        const lbSettingsSnap = await db.ref('leaderboard_settings').once('value');
        const lbSettings = lbSettingsSnap.val() || { chestDup: 95, chestNorm: 4, chestLeg: 1 };
        
        // Tính toán lại mốc thập phân (Ví dụ 95% -> 0.95)
        const dupThreshold = lbSettings.chestDup / 100;
        const normThreshold = dupThreshold + (lbSettings.chestNorm / 100);

        if (choiceType === 'coin') {
            // ... (Logic nhận coin giữ nguyên) ...
            const rand = Math.random();
            let amount = 0;
            if (rand < 0.70) { amount = Math.floor(Math.random() * 301) + 200; }
            else if (rand < 0.90) { amount = Math.floor(Math.random() * 201) + 500; }
            else { amount = Math.floor(Math.random() * 301) + 700; }

            const coinRef = db.ref('student_coins/' + currentUser.username);
            const snap = await coinRef.once('value');
            await coinRef.set((snap.val() || 0) + amount);
            alert(`🎉 CHÚC MỪNG! Bạn đã mở Rương và nhận được ${amount} Coin!`);

        } else if (choiceType === 'item') {
            const rand = Math.random();
            const invSnap = await db.ref(`student_inventory/${currentUser.username}`).once('value');
            const exactInventory = invSnap.val() ? Object.values(invSnap.val()).map(i => i.id) : [];

            // ÁP DỤNG TỈ LỆ TỪ GIÁO VIÊN VÀO ĐÂY
            if (rand < dupThreshold) {
                // Rớt vào mốc Trùng lặp
                const coinRef = db.ref('student_coins/' + currentUser.username);
                const snap = await coinRef.once('value');
                await coinRef.set((snap.val() || 0) + 200);
                alert("♻️ Bạn mở ra vật phẩm trùng lặp. Hệ thống đã tự động quy đổi thành +200 Coin!");

            } else {
                const validItems = StoreConfig.items.filter(i => i.type !== 'music');
                const legendaryTags = ['Truyền thuyết', 'Tứ Kỵ Sĩ'];
                let selectedItem = null;

                if (rand < normThreshold) {
                    // Rớt vào mốc Vật phẩm Thường
                    const normalItems = validItems.filter(i => !legendaryTags.includes(i.tag) && (i.price <= 700) && !exactInventory.includes(i.id));
                    if (normalItems.length > 0) {
                        selectedItem = normalItems[Math.floor(Math.random() * normalItems.length)];
                    } else {
                        const coinRef = db.ref('student_coins/' + currentUser.username);
                        const snap = await coinRef.once('value');
                        await coinRef.set((snap.val() || 0) + 400);
                        alert("📦 Bạn đã sở hữu toàn bộ vật phẩm thường. Hệ thống đền bù +400 Coin!");
                        document.getElementById('treasureChestModal').classList.remove('active');
                        return;
                    }
                } else {
                    // Rớt vào mốc Truyền Thuyết
                    const rareItems = validItems.filter(i => (legendaryTags.includes(i.tag) || i.price > 700) && !exactInventory.includes(i.id));
                    if (rareItems.length > 0) {
                        selectedItem = rareItems[Math.floor(Math.random() * rareItems.length)];
                    } else {
                        const coinRef = db.ref('student_coins/' + currentUser.username);
                        const snap = await coinRef.once('value');
                        await coinRef.set((snap.val() || 0) + 1000);
                        alert("👑 Bạn đã sưu tập đủ mọi vật phẩm Hiếm. Hệ thống đền bù +1000 Coin!");
                        document.getElementById('treasureChestModal').classList.remove('active');
                        return;
                    }
                }

                await db.ref(`student_inventory/${currentUser.username}/${selectedItem.id}`).update({
                    id: selectedItem.id, purchaseTime: Date.now(), isTrial: null, trialExpiry: null, isEquipped: false
                });
                alert(`🎊 KỲ TÍCH! Bạn đã nhận được [${selectedItem.tag}] ${selectedItem.name}!`);
            }
        }
        document.getElementById('treasureChestModal').classList.remove('active');

    } catch (e) {
        console.error(e);
        alert("❌ Có lỗi xảy ra khi nhận thưởng. Vui lòng thử lại!");
    } finally {
        btnNodes.forEach(btn => { btn.disabled = false; btn.style.opacity = '1'; });
    }
};

// Đính kèm hàm khởi tạo vào sự kiện tải xong trang
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeaderboardSystem);
} else {
    initLeaderboardSystem();
}