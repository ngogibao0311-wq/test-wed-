window.parseSafeDate = function(dateString) {
    if (!dateString) return new Date(0);
    if (dateString.includes('-')) return new Date(dateString.replace(" ", "T"));
    if (dateString.includes('/')) {
        let parts = dateString.split(' ');
        let dateParts = parts[0].split('/'); // DD/MM/YYYY
        let timeString = parts[1] || "00:00:00";
        return new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timeString}`);
    }
    return new Date(dateString);
};

const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'student') window.location.href = 'index.html';

let cacheAssignmentsSt = "";
let cacheSubmissionsSt = "";

const nameElement = document.getElementById('studentName');
if (nameElement) {
    nameElement.innerText = currentUser.name;
}
updateAvatarDisplay(currentUser.avatar); // Tự động hiển thị ảnh đại diện ở góc phải

window.studentSubmitDTs = {};

window.handleStudentFileAccumulate = function (input, assignId) {
    if (!window.studentSubmitDTs[assignId]) window.studentSubmitDTs[assignId] = new DataTransfer();
    const existingFiles = Array.from(window.studentSubmitDTs[assignId].files).map(f => f.name + '_' + f.size);
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // Giới hạn 5MB

    let hasOversize = false;
    for (let i = 0; i < input.files.length; i++) {
        // Chặn ngay file quá nặng, không cho vào DataTransfer
        if (input.files[i].size > MAX_SIZE_BYTES) {
            alert(`⚠️ File "${input.files[i].name}" quá lớn (${(input.files[i].size / (1024 * 1024)).toFixed(2)}MB). Hệ thống chỉ cho phép tối đa 5MB/file và đã tự động loại bỏ file này!`);
            hasOversize = true;
            continue;
        }
        const fileKey = input.files[i].name + '_' + input.files[i].size;
        if (!existingFiles.includes(fileKey)) {
            window.studentSubmitDTs[assignId].items.add(input.files[i]);
        }
    }
    input.files = window.studentSubmitDTs[assignId].files;

    // Reset rỗng input nếu tất cả file chọn vào đều lỗi để HS có thể chọn lại
    if (hasOversize && window.studentSubmitDTs[assignId].files.length === 0) {
        input.value = '';
    }
};
// ==============================================================

window.onload = async function () {
    // Kéo dữ liệu user thực tế từ DB để đối chiếu
    let realUsers = await getDB('users');
    let realUser = realUsers.find(u => u.username === currentUser.username);
    if (!realUser || realUser.role !== 'student') {
        alert("⛔ Phát hiện can thiệp dữ liệu! Buộc đăng xuất.");
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return;
    }
    // === TỐI ƯU HÓA HIỆU SUẤT (BỘ ĐỆM CACHE) ===
    let cacheProfileSt = "", cacheUsersSt = "", cacheAssignmentsSt = "", cacheSubmissionsSt = "", cacheMaterialsSt = "";

    db.ref('profile_requests').on('value', async (snapshot) => {
        const hash = JSON.stringify(snapshot.val());
        if (hash !== cacheProfileSt) { cacheProfileSt = hash; await checkProfileRequests(); }
    });
    db.ref('users').on('value', async (snapshot) => {
        const hash = JSON.stringify(snapshot.val());
        if (hash !== cacheUsersSt) {
            cacheUsersSt = hash;
            await syncUserData();
            if (document.getElementById('settingName')) document.getElementById('settingName').value = currentUser.name;
            // Cập nhật lại cột bảng lộ trình ngay lập tức
            if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
        }
    });
    db.ref('assignments').on('value', async (snapshot) => {
        const hash = JSON.stringify(snapshot.val());
        if (hash !== cacheAssignmentsSt) {
            cacheAssignmentsSt = hash;
            window.cachedAssignments = snapshot.val() ? Object.values(snapshot.val()) : []; // Lưu cache
            await loadAssignments();
            if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
        }
    });
    db.ref('submissions').on('value', async (snapshot) => {
        const hash = JSON.stringify(snapshot.val());
        if (hash !== cacheSubmissionsSt) {
            cacheSubmissionsSt = hash;
            window.cachedSubmissions = snapshot.val() ? Object.values(snapshot.val()) : []; // Lưu cache
            await loadAssignments();
            if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
        }
    });
    db.ref('materials').on('value', async (snapshot) => {
        const hash = JSON.stringify(snapshot.val());
        if (hash !== cacheMaterialsSt) { cacheMaterialsSt = hash; await loadMaterialsListStudent(); }
    });
    // ============================================

    // Đồng bộ điểm chuẩn từ xa do giáo viên cài đặt
    db.ref('roadmap_settings/passingGrade').on('value', (snapshot) => {
        window.currentPassingGrade = parseFloat(snapshot.val() || 7);
        if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
    });

    db.ref('schedule').on('value', async () => {
        if (typeof loadScheduleStudent === 'function') await loadScheduleStudent();
    });

    db.ref('game_settings').on('value', (snapshot) => {
        // Cấp giá trị mặc định nếu Firebase chưa có dữ liệu
        const settings = snapshot.val() || { isOpen: true, lockMessage: '' };

        // 1. Đồng bộ đúng tên biến isOpen từ Firebase
        window.isGameEnabled = settings.isOpen;

        // 2. Lấy các vùng giao diện Trò chơi bên thẻ student.html
        const gameActiveView = document.getElementById('gameActiveView');
        const gameLockedView = document.getElementById('gameLockedView');
        const messageText = document.getElementById('gameLockedMessageText');

        // 3. Xử lý logic Ẩn/Hiện và hiển thị Lời nhắn của giáo viên
        if (window.isGameEnabled === false) {
            // Khóa mục trò chơi
            if (gameActiveView) gameActiveView.style.display = 'none';
            if (gameLockedView) gameLockedView.style.display = 'block';
            if (messageText) messageText.innerText = settings.lockMessage || "Giáo viên đã tạm khóa khu vực trò chơi.";
        } else {
            // Mở mục trò chơi
            if (gameActiveView) gameActiveView.style.display = 'block';
            if (gameLockedView) gameLockedView.style.display = 'none';
        }
    });
    window.wheelProbs = { miss: 50, c100: 20, c150: 25, c500: 4, gift: 1 };
    db.ref('game_settings/wheel_probabilities').on('value', (snapshot) => {
        if (snapshot.exists()) {
            window.wheelProbs = snapshot.val();
        }
    });

    // ==========================================
    // DÁN ĐOẠN LẮNG NGHE COIN VÀO ĐÂY LÀ HẾT LỖI
    // ==========================================
    db.ref('student_coins/' + currentUser.username).on('value', (snapshot) => {
        const coins = snapshot.val() || 0;
        const coinEl = document.getElementById('studentCoinBalance');
        if (coinEl) {
            coinEl.style.transform = 'scale(1.5)';
            coinEl.style.color = '#ff9f43';
            coinEl.innerText = coins.toLocaleString('vi-VN');

            setTimeout(() => {
                coinEl.style.transform = 'scale(1)';
                coinEl.style.color = '#fff';
            }, 300);
        }
    });

    // === LẮNG NGHE HỆ THỐNG CỬA HÀNG (REAL-TIME PHÍA HỌC SINH) ===
    db.ref('store_settings').on('value', (snapshot) => {
        const settings = snapshot.val();
        const activeView = document.getElementById('storeActiveView');
        const lockedView = document.getElementById('storeLockedView');

        const isOpen = (settings !== null && settings.isOpen !== undefined) ? settings.isOpen : true;
        if (activeView) activeView.style.display = isOpen ? 'block' : 'none';
        if (lockedView) lockedView.style.display = isOpen ? 'none' : 'block';

        if (settings) {
            StoreConfig.items.forEach(item => {
                if (settings[item.id]) {
                    if (settings[item.id].price !== undefined) item.price = settings[item.id].price;
                    if (settings[item.id].startDate !== undefined) item.startDate = settings[item.id].startDate;
                    if (settings[item.id].endDate !== undefined) item.endDate = settings[item.id].endDate;
                    item.isLocked = !!settings[item.id].isLocked; // ĐỒNG BỘ TRẠNG THÁI KHÓA VỀ HỌC SINH
                }
            });
        }

        if (typeof window.filterStore === 'function') {
            window.filterStore(window.currentStoreFilterType || 'all');
        }
    });

    db.ref('store_items').on('value', async () => {
        if (typeof loadStoreItems === 'function') await loadStoreItems();
    });

    db.ref('student_inventory/' + currentUser.username).on('value', (snapshot) => {
        myInventory = snapshot.val() ? Object.values(snapshot.val()) : [];
        if (typeof loadStoreItems === 'function') loadStoreItems();
        if (typeof applyEquippedItems === 'function') applyEquippedItems();
    });

    // LẮNG NGHE THÔNG BÁO TOÀN TRƯỜNG (ĐÃ FIX LOGIC)
    db.ref('global_notifications').on('value', (snapshot) => {
        const notifications = [];
        snapshot.forEach(child => {
            if (child.val()) notifications.push({ ...child.val(), _fbKey: child.key });
        });

        if (notifications.length > 0) {
            // Sắp xếp: Mới nhất lên đầu
            const sorted = notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            // Quét tìm thông báo MỚI NHẤT mà học sinh CHƯA ĐỌC
            let unreadNoti = null;
            for (let noti of sorted) {
                const receivers = noti.receivers || {};
                if (!receivers[currentUser.username]) {
                    unreadNoti = noti;
                    break;
                }
            }

            const modal = document.getElementById('studentNotificationModal');
            if (unreadNoti) {
                // Tạm hoãn nếu học sinh đang trong chế độ thi
                if (window.currentActiveExamId) return;

                const msgEl = document.getElementById('studentNotificationMessage');
                const btn = document.getElementById('btnAcknowledgeNotification');

                if (msgEl && modal && btn) {
                    msgEl.innerText = unreadNoti.message;
                    modal.classList.add('active');

                    // Gắn đè sự kiện xác nhận
                    btn.onclick = async function () {
                        btn.disabled = true;
                        btn.innerText = "⏳ Đang ghi nhận...";
                        try {
                            await db.ref(`global_notifications/${unreadNoti._fbKey}/receivers/${currentUser.username}`).set(true);
                            modal.classList.remove('active');
                        } catch (e) {
                            console.error("Lỗi khi xác nhận thông báo: ", e);
                        } finally {
                            btn.disabled = false;
                            btn.innerText = "✅ Đã nhận và đọc hiểu";
                        }
                    };
                }
            } else {
                if (modal) modal.classList.remove('active');
            }
        }
    });

    // LẮNG NGHE KHẢO SÁT BẮT BUỘC (ĐÃ FIX LOGIC)
    db.ref('global_surveys').on('value', (snapshot) => {
        const surveys = [];
        snapshot.forEach(child => {
            if (child.val()) surveys.push({ ...child.val(), _fbKey: child.key });
        });

        if (surveys.length > 0) {
            // Sắp xếp: Mới nhất lên đầu
            const sorted = surveys.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            // Quét tìm Khảo sát MỚI NHẤT mà học sinh CHƯA LÀM
            let unreadSurvey = null;
            for (let sv of sorted) {
                const answersObj = sv.answers || {};
                if (!answersObj[currentUser.username]) {
                    unreadSurvey = sv;
                    break;
                }
            }

            const modal = document.getElementById('studentSurveyModal');
            if (unreadSurvey) {
                if (window.currentActiveExamId) return;

                window.currentActiveSurvey = unreadSurvey;
                if (typeof renderStudentSurvey === 'function') {
                    renderStudentSurvey(unreadSurvey);
                }
            } else {
                if (modal) modal.classList.remove('active');
            }
        }
    });

    // BỔ SUNG: Lắng nghe hộp thư và tự động xóa thư quá 5 ngày
    db.ref('inbox_messages/' + currentUser.username).on('value', (snapshot) => {
        const messages = [];
        const now = Date.now();
        snapshot.forEach(child => {
            const msg = child.val();
            // Nếu đã quá 5 ngày -> Tự động xóa khỏi DB
            if (msg.expiry && now > msg.expiry) {
                db.ref(`inbox_messages/${currentUser.username}/${child.key}`).remove();
            } else {
                messages.push({ ...msg, _fbKey: child.key });
            }
        });

        window.myInboxMessages = messages.sort((a, b) => b.timestamp - a.timestamp);

        // Cập nhật chấm đỏ
        const badge = document.getElementById('inboxBadge');
        if (badge) {
            if (messages.length > 0) {
                badge.innerText = messages.length;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
        // Nếu hộp thư đang mở thì render lại liền
        if (document.getElementById('studentInboxModal') && document.getElementById('studentInboxModal').classList.contains('active')) {
            renderStudentInbox();
        }
    });

    // === QUÉT NGẦM VẬT PHẨM DÙNG THỬ (MỖI 60 GIÂY) ===
    setInterval(async () => {
        if (typeof myInventory === 'undefined' || !myInventory.length) return;

        const now = Date.now();
        let hasExpired = false;
        let updates = {};

        myInventory.forEach(item => {
            if (item.isTrial && item.trialExpiry && now > item.trialExpiry) {
                hasExpired = true;
                updates[`student_inventory/${currentUser.username}/${item.id}`] = null; // Xóa khỏi kho đồ
            }
        });

        if (hasExpired) {
            await db.ref().update(updates);
            alert("⏰ Hệ thống ghi nhận có vật phẩm dùng thử của bạn đã hết hạn 24 giờ và vừa bị thu hồi!");
            // Hàm db.ref('student_inventory/').on('value') có sẵn của bạn sẽ tự động chạy lại để gỡ trang bị ngay lập tức
        }
    }, 60000);

    // Đồng bộ nút Bật/Tắt Bảng quy đổi từ Giáo viên
    db.ref('system_settings/conversionTableEnabled').on('value', (snapshot) => {
        const isEnabled = snapshot.val() !== false;

        // 1. Lưu cờ trạng thái để chặn mở popup
        window.isConversionEnabled = isEnabled;

        const conversionSection = document.getElementById('conversionTableSection');
        if (conversionSection) {
            conversionSection.style.display = isEnabled ? 'block' : 'none';
        }

        // 2. Tự động đóng ngay Bảng quy đổi nếu học sinh đang mở mà giáo viên tắt
        const coinModal = document.getElementById('coinConversionModal');
        if (!isEnabled && coinModal && coinModal.classList.contains('active')) {
            closeCoinConversionModal();
            alert("🔒 Giáo viên vừa tạm khóa chức năng Bảng quy đổi!");
        }
    });

    // =================================================================
    // ĐỒNG BỘ TIỀN TÍCH LŨY VÀ TRẠNG THÁI RÚT TIỀN THEO THỜI GIAN THỰC
    // =================================================================

    // 1. Lắng nghe biến động tiền bù trừ (Giáo viên tặng/trừ tiền hoặc rút tiền)
    db.ref('student_money_offset/' + currentUser.username).on('value', async () => {
        // Cập nhật bảng lộ trình & Tổng tiền bên ngoài
        if (typeof renderStudentRoadmap === 'function' && document.getElementById('studentRoadmapBody')) {
            await renderStudentRoadmap();
        }
        // Cập nhật luôn màn hình "Yêu cầu rút tiền mặt" nếu đang mở bảng quy đổi
        if (typeof window.initCashWithdrawInterface === 'function' && document.getElementById('displayRouteMoney')) {
            await window.initCashWithdrawInterface();
        }
    });

    // 2. Lắng nghe trạng thái duyệt/từ chối rút tiền mặt từ Giáo viên
    db.ref('cash_requests').on('value', async () => {
        if (typeof renderCashRequestHistory === 'function' && document.getElementById('cashRequestHistoryContainer')) {
            await renderCashRequestHistory();
        }
    });
};

function getEmbedHTML(url) {
    if (!url) return '';
    let videoId = '';
    if (url.includes('watch?v=')) { videoId = url.split('v=')[1].split('&')[0]; }
    else if (url.includes('youtu.be/')) { videoId = url.split('youtu.be/')[1].split('?')[0]; }
    else if (url.includes('youtube.com/shorts/')) { videoId = url.split('shorts/')[1].split('?')[0]; }
    else if (url.includes('embed/')) { videoId = url.split('embed/')[1].split('?')[0]; }

    if (videoId) {
        let embedUrl = `https://www.youtube.com/embed/${videoId}`;
        // Thêm loading="lazy" vào thẻ iframe
        return `<div class="video-wrapper"><iframe width="100%" height="315" src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
    }
    // Thêm loading="lazy" vào thẻ iframe dự phòng
    return `<div class="video-wrapper"><iframe width="100%" height="315" src="${url}" frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;
}

let assignmentTimers = [];
function formatCountdown(ms) {
    if (ms <= 0) return "00 giây";
    let d = Math.floor(ms / (1000 * 60 * 60 * 24));
    let h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    let s = Math.floor((ms % (1000 * 60)) / 1000);
    
    let timeStr = "";
    if (d > 0) timeStr += `${d} ngày `;
    if (h > 0 || d > 0) timeStr += `${h} tiếng `;
    timeStr += `${m} phút ${s} giây`;
    return timeStr.trim();
}

async function loadAssignments() {
    const trackingSnap = await db.ref('video_tracking').once('value');
    const trackingData = trackingSnap.val() || {};
    const assignments = (window.cachedAssignments && window.cachedAssignments.length > 0) ? window.cachedAssignments : await getDB('assignments');
    const submissions = (window.cachedSubmissions && window.cachedSubmissions.length > 0) ? window.cachedSubmissions : await getDB('submissions');
    const list = document.getElementById('assignmentsList');
    const grades = document.getElementById('gradesList');

    if (list) list.innerHTML = '';
    if (grades) grades.innerHTML = '';

    assignmentTimers.forEach(t => clearInterval(t));
    assignmentTimers = [];
    let hasAutoSubmitted = false;

    // --- BẮT ĐẦU LOGIC SẮP XẾP ---
    const nowSort = new Date();
    assignments.sort((a, b) => {
        const getSortVals = (assign) => {
            const mySub = submissions.find(s => s.assignmentId === assign.id && s.studentUsername === currentUser.username);
            const end = assign.endDate ? window.parseSafeDate(assign.endDate) : new Date("2100-01-01");

            let rank = 2; // Nhóm 2: Bài đã chốt (Đã chấm / Xong)
            let isActive = nowSort <= end;
            let isGrace = (nowSort > end && nowSort <= new Date(end.getTime() + 5 * 60000));

            // Nhóm 1: Ưu tiên cao
            if (isActive || isGrace) rank = 1; // Mới giao, Đang thi

            if (mySub) {
                if (mySub.isRedoing) rank = 1; // Đang làm lại
                else if (mySub.grade === null || mySub.grade === undefined || mySub.grade === '') rank = 1; // Đang chấm
                else rank = 2; // Đã chấm điểm
            }

            // Xử lý lấy số "Bài N" (Nếu không có số, mặc định là 0 để nổi lên trên)
            let lessonNum = 0;
            const match = (assign.title || '').match(/bài\s*(\d+)/i);
            if (match) lessonNum = parseInt(match[1]);

            return { rank, lessonNum };
        };

        const valsA = getSortVals(a);
        const valsB = getSortVals(b);

        // 1. So sánh Nhóm ưu tiên (Rank 1 đứng trên Rank 2)
        if (valsA.rank !== valsB.rank) return valsA.rank - valsB.rank;
        // 2. So sánh thứ tự số Bài (0 đứng trước 1, 2, 3...)
        if (valsA.lessonNum !== valsB.lessonNum) return valsA.lessonNum - valsB.lessonNum;
        // 3. Fallback: So sánh bảng chữ cái theo Tiêu đề nếu trùng số
        return (a.title || '').localeCompare(b.title || '', 'vi-VN');
    });
    // --- KẾT THÚC LOGIC SẮP XẾP ---

    assignments.forEach(assign => {
        // [THÊM MỚI] Xử lý mảng đối tượng học sinh
        const targetArr = Array.isArray(assign.targetStudent) ? assign.targetStudent : [assign.targetStudent || 'all'];
        if (!targetArr.includes('all') && !targetArr.includes(currentUser.username)) return;

        const mySub = submissions.find(s => s.assignmentId === assign.id && s.studentUsername === currentUser.username);

        const now = new Date();
        const startTime = assign.startDate ? window.parseSafeDate(assign.startDate) : new Date(0);
        const endTime = assign.endDate ? window.parseSafeDate(assign.endDate) : new Date("2100-01-01");
        const isRedoing = mySub && mySub.isRedoing;

        // --- LOGIC 5 PHÚT ÂN HẠN HIỂN THỊ (GRACE PERIOD) ---
        const gracePeriodEndTime = new Date(endTime.getTime() + 5 * 60000);
        const isGracePeriod = (now > endTime && now <= gracePeriodEndTime) && !isRedoing && (!mySub || mySub.isAutoSubmitted);

        // NẾU ĐÃ NỘP VÀ KHÔNG TRONG TRẠNG THÁI LÀM LẠI VÀ KHÔNG NẰM TRONG 5 PHÚT HIỂN THỊ TRỄ -> Bảng điểm
        if (mySub && !isRedoing && !isGracePeriod) {
            let typeText = '';
            if (assign.assessmentType === 'trac_nghiem') typeText = 'Trắc nghiệm';
            else if (assign.assessmentType === 'ket_hop') typeText = 'Kết hợp';
            else if (assign.assessmentType === 'thi') typeText = 'Thi (Nghiêm ngặt)';
            else typeText = 'Tự luận';

            let statusText = `Đã hoàn thành (${typeText})`;

            let violationHTML = '';
            if (mySub.isCheatFail) {
                violationHTML = `<div style="background: rgba(225, 29, 72, 0.1); border-left: 4px solid #e11d48; padding: 15px; margin-top: 15px; border-radius: 8px;"><h4 style="color: #e11d48; margin: 0 0 5px 0;">🚨 BÀI THI VI PHẠM QUY CHẾ</h4><p style="margin: 0; color: #b91c1c;">Hệ thống ghi nhận bạn đã tự ý thoát khỏi chế độ Toàn màn hình trong quá trình làm bài. Bài thi đã bị thu tự động và đánh dấu vi phạm vi chế nghiêm trọng.</p></div>`;
                statusText = `<span style="color: #e11d48; font-weight: bold;">❌ Vi phạm quy chế thi</span>`;
            }

            let teacherFileHTML = '';
            if (assign.file && assign.assessmentType !== 'trac_nghiem') {
                let aFiles = Array.isArray(assign.file) ? assign.file : [assign.file];
                aFiles.forEach((f, index) => {
                    let isImg = (f.type && f.type.startsWith('image/')) || (f.base64 && f.base64.startsWith('data:image/'));
                    if (isImg) {
                        let uniqueId = 'img_nop_' + Date.now() + '_' + index + '_' + Math.floor(Math.random() * 1000);
                        teacherFileHTML += `
                        <div class="assignment-file" style="margin-top: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.02); padding: 6px 10px; border-radius: 6px;">
                                <span style="font-size: 0.9em;"><strong>📎 Ảnh đính kèm:</strong> <span style="color: #666;">${f.name}</span></span>
                                <button onclick="let content = document.getElementById('${uniqueId}'); if(content.style.display==='none'){content.style.display='block'; this.innerHTML='🔼 Thu gọn';}else{content.style.display='none'; this.innerHTML='🔽 Xem ảnh';}" style="background: white; border: 1px solid #ccc; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: 0.2s;">🔽 Xem ảnh</button>
                            </div>
                            <div id="${uniqueId}" style="display: none; margin-top: 8px; text-align: center; background: rgba(0,0,0,0.03); padding: 10px; border-radius: 8px; border: 1px dashed rgba(0,0,0,0.1);">
                                <img src="${f.base64}" alt="${f.name}" style="max-width: 100%; max-height: 300px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: block; margin: 0 auto 10px auto; cursor: pointer;" onclick="window.open('${f.base64}', '_blank')" title="Bấm để xem ảnh gốc">
                                <a href="${f.base64}" download="${f.name}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.85em; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📥 Tải ảnh xuống</a>
                            </div>
                        </div>`;
                    } else {
                        teacherFileHTML += `<div class="assignment-file" style="margin-top: 10px;"><p style="font-size: 0.9em;"><strong>📎 Tài liệu đính kèm:</strong> <a href="${f.base64}" download="${f.name}" class="file-download-link" target="_blank">${f.name}</a></p></div>`;
                    }
                });
            }

            let videoHTML = assign.videoLink && assign.assessmentType !== 'trac_nghiem' ? getEmbedHTML(assign.videoLink) : '';

            let myFileHTML = '';
            if (mySub.file) {
                let mFiles = Array.isArray(mySub.file) ? mySub.file : [mySub.file];
                mFiles.forEach(f => {
                    myFileHTML += `<div class="assignment-file" style="background: rgba(102, 126, 234, 0.1); border-left: 4px solid #667eea; margin-top: 15px;"><p><strong>📄 File bạn đã nộp:</strong> <a href="${f.base64}" download="${f.name}" class="file-download-link" target="_blank">${f.name}</a></p></div>`;
                });
            }

            let gradedFileHTML = '';
            if (mySub.teacherFile) {
                let tFiles = Array.isArray(mySub.teacherFile) ? mySub.teacherFile : [mySub.teacherFile];
                tFiles.forEach(f => {
                    gradedFileHTML += `<div class="assignment-file" style="background: rgba(67, 233, 123, 0.15); border-left: 4px solid #43e97b; margin-top: 15px;"><p><strong>👩‍🏫 File nhận xét từ GV:</strong> <a href="${f.base64}" download="${f.name}" class="file-download-link" target="_blank">${f.name}</a></p></div>`;
                });
            }

            let teacherCommentHTML = mySub.teacherComment ? `<div style="background: rgba(253, 203, 110, 0.15); border-left: 4px solid #fdcb6e; padding: 15px; border-radius: 12px; margin-top: 15px;"><p style="margin: 0; color: #d35400;"><strong>💬 Lời nhận xét của Giáo viên:</strong></p><p style="margin-top: 5px; color: #444; white-space: pre-wrap;">${mySub.teacherComment}</p></div>` : '';

            let gradeDisplay = 'Chưa chấm';
            if (mySub.isRegrading) {
                gradeDisplay = `<span style="color: #e11d48; font-weight: bold;">⚠️ Đang chấm lại (Đã thu hồi)</span>`;
                statusText = `<span style="color: #e11d48; font-weight: bold;">🔄 Đang được chấm lại...</span>`;
            } else if (mySub.grade !== null && mySub.grade !== undefined && mySub.grade !== '') {
                gradeDisplay = mySub.grade;
            }

            let viewQuestionsBtnHTML = `<button class="btn-approve" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-top: 15px; padding: 12px 15px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; display: block; width: 100%; transition: 0.3s;" onclick="viewAssignmentQuestions('${assign.id}')">👁️ Xem lại tất cả câu hỏi</button>`;

            const uniqueId = `student-done-${assign.id}`;
            let isLockedByExam = window.currentActiveExamId && window.currentActiveExamId !== assign.id;
            let clickHandler = isLockedByExam ? `alert('⚠️ Bạn đang làm bài thi! Không thể xem các bài tập khác.')` : `toggleAccordion('${uniqueId}', this)`;
            let glassLockHTML = isLockedByExam ? `<div style="position: absolute; inset: 0; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(4px); z-index: 10; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: not-allowed;"><span style="background: rgba(225, 29, 72, 0.9); color: white; padding: 6px 14px; border-radius: 20px; font-weight: bold; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4);">🔒 Tạm khóa khi thi</span></div>` : '';

            const div = document.createElement('div'); div.className = 'card accordion-card';
            div.style.position = 'relative'; // Bắt buộc để lớp phủ kính (glassmorphism) định vị chính xác

            div.innerHTML = `${glassLockHTML}<div class="accordion-header" onclick="${clickHandler}"><div class="accordion-title"><h4>${assign.title}</h4><span>${statusText}</span></div><div class="accordion-meta"><span>Điểm: <strong style="${(mySub.grade !== null && mySub.grade !== undefined && mySub.grade !== '' && !mySub.isRegrading) ? 'color:#059669;' : 'color:#d35400;'}">${gradeDisplay}</strong></span><span class="toggle-icon">▼</span></div></div>
                <div id="${uniqueId}" class="accordion-content"><div class="assignment-meta"><p>🕒 <strong>Bạn đã nộp lúc:</strong> ${mySub.submitTime || 'Không rõ'}</p></div>${violationHTML}${videoHTML}<div style="background: rgba(255,255,255,0.5); padding: 15px; border-radius: 12px; margin-top: 15px;"><strong>Nội dung bài làm của bạn:</strong><br><p style="margin-top: 5px; color: ${mySub.isAutoSubmitted ? '#e74c3c' : '#444'}; white-space: pre-wrap;">${mySub.answer ? mySub.answer.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '<i>(Không có)</i>'}</p>${myFileHTML}</div>${teacherFileHTML}${gradedFileHTML}${teacherCommentHTML}${viewQuestionsBtnHTML}</div>`;
            grades.appendChild(div);
        }
        // NẾU CHƯA NỘP HOẶC ĐANG LÀM LẠI HOẶC ĐANG TRONG 5 PHÚT TRỄ
        else {
            if (now < startTime) {
                const div = document.createElement('div'); div.className = 'card submit-box';
                div.innerHTML = `<h4 style="font-size: 1.3em; color: #764ba2; font-weight: 800; opacity: 0.6;">${assign.title}</h4><div class="assignment-meta" style="opacity: 0.8;"><p>📅 <strong>Hạn làm bài:</strong> Từ <span class="time-highlight">${assign.startDate}</span> đến <span class="time-highlight">${assign.endDate}</span></p></div><div class="glass-alert" style="margin-top: 15px; border-left-color: #667eea; background: rgba(102, 126, 234, 0.1);"><h4 style="color: #444; margin-bottom: 5px;">⏳ Chưa đến thời gian làm bài</h4><p style="margin: 0; font-size: 0.95em;">Hệ thống sẽ tự động mở khóa sau: <strong id="cd-start-${assign.id}" style="color: #667eea; font-size: 1.1em;">...</strong></p></div>`;
                list.appendChild(div);
                const timer = setInterval(() => { const c = new Date(); if (c >= startTime) { clearInterval(timer); loadAssignments(); } else { const el = document.getElementById(`cd-start-${assign.id}`); if (el) el.innerText = formatCountdown(startTime - c); } }, 1000); assignmentTimers.push(timer);
            }
            else if (isGracePeriod || (now > endTime && !isRedoing)) {
                const autoFlagKey = `auto_sub_${assign.id}_${currentUser.username}`;
                if (!mySub && !localStorage.getItem(autoFlagKey) && !window[`isSubmitting_${assign.id}`]) {
                    window[`isSubmitting_${assign.id}`] = true;
                    localStorage.setItem(autoFlagKey, 'true');
                    hasAutoSubmitted = true;

                    // === BẮT ĐẦU FIX LOGIC: THU BÀI ĐANG LÀM DỞ TỪ BẢN NHÁP (HỖ TRỢ LẤY CẢ FILE ĐÍNH KÈM) ===
                    (async () => {
                        let draftKey = `draft_${currentUser.username}_${assign.id}`;
                        let draft;
                        try {
                            draft = JSON.parse(localStorage.getItem(draftKey));
                            if (typeof draft !== 'object' || draft === null) draft = { mcAnswers: {}, essay: '' };
                        } catch (e) {
                            draft = { mcAnswers: {}, essay: '' };
                        }

                        let mcAnswersObj = draft.mcAnswers || {};
                        let rawEssay = draft.essay || "";
                        let mcText = '';
                        let autoScore = 0;
                        let finalCalculatedGrade = null;

                        // 1. Quét nháp trắc nghiệm và chấm điểm tự động
                        if (assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi') {
                            if (assign.questions) {
                                assign.questions.forEach((q, idx) => {
                                    let selectedVal = mcAnswersObj[idx];
                                    if (selectedVal) {
                                        const isCorrect = selectedVal === q.correct;
                                        if (isCorrect) autoScore++;
                                        mcText += `Câu ${idx + 1}: Chọn ${selectedVal} ${isCorrect ? '✅' : '❌ (Đúng là ' + q.correct + ')'}\n`;
                                    } else {
                                        mcText += `Câu ${idx + 1}: Chưa chọn (Đúng là ${q.correct})\n`;
                                    }
                                });

                                let scale10 = Math.round(((autoScore / assign.questions.length) * 10) * 10) / 10;
                                if (assign.assessmentType === 'trac_nghiem') {
                                    mcText += `\n=> 🎯 CHẤM ĐIỂM TỰ ĐỘNG: ${autoScore} / ${assign.questions.length} (Đạt ${scale10} / 10 điểm)`;
                                    finalCalculatedGrade = scale10;
                                } else if (assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi') {
                                    let weight = assign.mcWeight || 5;
                                    let weightedScore = Math.round(((autoScore / assign.questions.length) * weight) * 100) / 100;
                                    mcText += `\n=> 🎯 CHẤM TỰ ĐỘNG PHẦN TRẮC NGHIỆM: ${autoScore} / ${assign.questions.length} (Đạt ${weightedScore} / ${weight} điểm)`;
                                    if (assign.assessmentType === 'thi' && (assign.essayWeight || 0) === 0) {
                                        finalCalculatedGrade = scale10;
                                    }
                                }
                            }
                        }

                        // 2. Ráp nội dung chữ
                        let finalAnswerText = "⚠️ [Hệ thống tự động thu bài do hết giờ - Đã lưu lại bản nháp làm dở của học sinh]\n\n";
                        if (mcText) finalAnswerText += `[PHẦN TRẮC NGHIỆM]\n${mcText}\n\n`;
                        if (rawEssay) finalAnswerText += `[PHẦN TỰ LUẬN]\n${rawEssay}`;

                        if (!mcText && !rawEssay) {
                            finalAnswerText = "⚠️ [Hệ thống tự động thu bài do hết giờ - Học sinh chưa làm nội dung nào]";
                        }

                        // === BƯỚC MỚI: CỨU TÀI LIỆU/ẢNH MÀ HỌC SINH ĐÃ CHỌN VÀO TRÌNH DUYỆT ===
                        let rescuedFiles = null;

                        // Quét file lưu trong bộ nhớ tạm của hệ thống
                        if (window.studentSubmitDTs && window.studentSubmitDTs[assign.id] && window.studentSubmitDTs[assign.id].files.length > 0) {
                            rescuedFiles = await readMultipleFiles(window.studentSubmitDTs[assign.id].files);
                        } else {
                            // Quét trực tiếp ô input trên màn hình phòng hờ bộ nhớ tạm bị lỗi
                            const fileInput = document.getElementById(`studentFile-${assign.id}`);
                            if (fileInput && fileInput.files.length > 0) {
                                rescuedFiles = await readMultipleFiles(fileInput.files);
                            }
                        }

                        // Nếu tìm thấy file, đổi lại nội dung thông báo cho phù hợp
                        if (rescuedFiles && rescuedFiles.length > 0) {
                            if (finalAnswerText.includes("Học sinh chưa làm nội dung nào")) {
                                finalAnswerText = "⚠️ [Hệ thống tự động thu bài do hết giờ - Đã lưu lại FILE ĐÍNH KÈM của học sinh]";
                            } else {
                                finalAnswerText = finalAnswerText.replace("bản nháp làm dở", "bản nháp và FILE ĐÍNH KÈM làm dở");
                            }
                        }

                        // 3. Đẩy lên Firebase
                        pushDB('submissions', {
                            id: Date.now().toString() + Math.floor(Math.random() * 1000),
                            assignmentId: assign.id,
                            studentUsername: currentUser.username,
                            studentName: currentUser.name,
                            answer: finalAnswerText,
                            rawEssay: rawEssay,
                            mcAnswers: mcAnswersObj,
                            grade: finalCalculatedGrade,
                            submitTime: now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN'),
                            file: rescuedFiles, // Gắn mảng File vừa cứu được vào đây
                            teacherFile: null,
                            isAutoSubmitted: true,
                            isRedoing: false,
                            isLateFail: true
                        }).then(() => {
                            window[`isSubmitting_${assign.id}`] = false;

                            // Xóa nháp
                            localStorage.removeItem(draftKey);

                            // Kích hoạt thoát toàn màn hình và mở khóa menu an toàn
                            if (window.currentActiveExamId === assign.id) {
                                window.currentActiveExamId = null;
                                if (document.fullscreenElement) {
                                    document.exitFullscreen().catch(err => console.log(err));
                                }
                                document.querySelectorAll('.nav-item, .btn-logout').forEach(btn => {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                                });
                            }

                            loadAssignments();
                        });
                    })();
                    // === KẾT THÚC FIX LOGIC THU NHÁP CÓ FILE ===
                }

                if (isGracePeriod) {
                    const div = document.createElement('div'); div.className = 'card submit-box';
                    div.innerHTML = `<h4 style="font-size: 1.3em; color: #764ba2; font-weight: 800; opacity: 0.6;">${assign.title}</h4>
                    <div class="assignment-meta" style="opacity: 0.8;"><p>📅 <strong>Hạn nộp bài:</strong> <span class="time-highlight">${assign.endDate}</span></p></div>
                    <div class="glass-alert" style="margin-top: 15px; border-left-color: #e11d48; background: rgba(225, 29, 72, 0.1);">
                        <h4 style="color: #e11d48; margin-bottom: 5px;">⚠️ Đã quá hạn nộp bài (Trễ)</h4>
                        <p style="margin: 0; font-size: 0.95em;">Hệ thống đã khóa chức năng nộp bài. Bài tập sẽ tự động chuyển hoàn toàn vào kết quả sau: <strong id="cd-late-${assign.id}" style="color: #e11d48; font-size: 1.1em;">...</strong></p>
                    </div>`;
                    list.appendChild(div);

                    const timer = setInterval(() => {
                        const c = new Date();
                        if (c > gracePeriodEndTime) {
                            clearInterval(timer);
                            loadAssignments();
                        } else {
                            const el = document.getElementById(`cd-late-${assign.id}`);
                            if (el) el.innerText = formatCountdown(gracePeriodEndTime - c);
                        }
                    }, 1000);
                    assignmentTimers.push(timer);
                }
            }
            else {
                let redoNotice = isRedoing ? `<div class="glass-alert success" style="padding: 10px; margin-bottom: 15px;"><p style="margin:0; font-size:0.9em; font-weight:bold;">🔁 Bạn đang ở chế độ làm lại bài.</p></div>` : '';

                let countdownHTML = '';
                if (!isRedoing) {
                    countdownHTML = `<p style="margin-top: 5px;">⏳ Tự động khóa nộp bài sau: <strong id="cd-end-${assign.id}" style="color: #e74c3c; font-size: 1.1em;">...</strong></p>`;
                } else if (isRedoing && now <= endTime) {
                    countdownHTML = `<p style="margin-top: 5px;">⏳ Thời gian làm lại còn: <strong id="cd-end-${assign.id}" style="color: #e74c3c; font-size: 1.1em;">...</strong></p>`;
                } else {
                    countdownHTML = `<p style="margin-top: 5px; color: #059669; font-weight: bold;">(Không giới hạn thời gian làm lại, nộp bất cứ lúc nào)</p>`;
                }

                let quizHTML = '';
                if ((assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi') && assign.questions) {
                    let noticeHTML = assign.assessmentType === 'ket_hop' ? `<div class="glass-alert" style="padding: 10px; margin-bottom: 15px; border-left-color: #764ba2;"><strong>⚖️ Thang điểm bài này:</strong> Trắc nghiệm (${assign.mcWeight || 5}đ) - Tự luận (${assign.essayWeight || 5}đ)</div>` : '';
                    quizHTML = noticeHTML + '<div style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.9);"><h4 style="color: #d35400; margin-bottom: 10px;">Phần Trắc Nghiệm</h4>';

                    let draftKey = `draft_${currentUser.username}_${assign.id}`;
                    let draft;
                    try {
                        draft = JSON.parse(localStorage.getItem(draftKey));
                        if (typeof draft !== 'object' || draft === null) draft = { mcAnswers: {}, essay: '' };
                    } catch (e) {
                        draft = { mcAnswers: {}, essay: '' };
                    }
                    let savedMc = (mySub && mySub.mcAnswers) ? mySub.mcAnswers : draft.mcAnswers;

                    assign.questions.forEach((q, idx) => {
                        let chkA = savedMc[idx] === 'A' ? 'checked' : '';
                        let chkB = savedMc[idx] === 'B' ? 'checked' : '';
                        let chkC = savedMc[idx] === 'C' ? 'checked' : '';
                        let chkD = savedMc[idx] === 'D' ? 'checked' : '';

                        quizHTML += `<div style="margin-bottom: 15px; background: rgba(255,255,255,0.5); padding: 12px; border-radius: 8px;"><p style="font-weight: bold; color: #2c3e50; margin-bottom: 8px;">Câu ${idx + 1}: ${q.qText}</p><div style="display:flex; flex-direction:column; gap:8px;">
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;"><input type="radio" name="q-${assign.id}-${idx}" value="A" style="width:auto; margin:0;" ${chkA} onchange="saveDraft('${assign.id}', 'mc', ${idx}, 'A')"> <span>A. ${q.A}</span></label>
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;"><input type="radio" name="q-${assign.id}-${idx}" value="B" style="width:auto; margin:0;" ${chkB} onchange="saveDraft('${assign.id}', 'mc', ${idx}, 'B')"> <span>B. ${q.B}</span></label>
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;"><input type="radio" name="q-${assign.id}-${idx}" value="C" style="width:auto; margin:0;" ${chkC} onchange="saveDraft('${assign.id}', 'mc', ${idx}, 'C')"> <span>C. ${q.C}</span></label>
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;"><input type="radio" name="q-${assign.id}-${idx}" value="D" style="width:auto; margin:0;" ${chkD} onchange="saveDraft('${assign.id}', 'mc', ${idx}, 'D')"> <span>D. ${q.D}</span></label></div></div>`;
                    });
                    quizHTML += '</div>';
                }

                let videoHTML = '';
                let descHTML = '';
                let teacherFileHTML = '';
                let tuLuanInputHTML = '';

                if (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi' || !assign.assessmentType) {
                    videoHTML = assign.videoLink ? getTrackedVideoHTML(assign.videoLink, assign.id) : '';
                    descHTML = assign.desc ? `<div class="assignment-desc"><strong>Yêu cầu bài tập:</strong> <br>${(assign.desc || '').replace(/\n/g, '<br>')}</div>` : '';
                    if (assign.file) {
                        let aFiles = Array.isArray(assign.file) ? assign.file : [assign.file];
                        aFiles.forEach((f, index) => {
                            let isImg = (f.type && f.type.startsWith('image/')) || (f.base64 && f.base64.startsWith('data:image/'));
                            if (isImg) {
                                let uniqueId = 'img_lam_' + Date.now() + '_' + index + '_' + Math.floor(Math.random() * 1000);
                                teacherFileHTML += `
                                <div class="assignment-file" style="margin-top: 10px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.02); padding: 6px 10px; border-radius: 6px;">
                                        <span style="font-size: 0.9em;"><strong>📎 Ảnh đính kèm:</strong> <span style="color: #666;">${f.name}</span></span>
                                        <button onclick="let content = document.getElementById('${uniqueId}'); if(content.style.display==='none'){content.style.display='block'; this.innerHTML='🔼 Thu gọn';}else{content.style.display='none'; this.innerHTML='🔽 Xem ảnh';}" style="background: white; border: 1px solid #ccc; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: 0.2s;">🔽 Xem ảnh</button>
                                    </div>
                                    <div id="${uniqueId}" style="display: none; margin-top: 8px; text-align: center; background: rgba(0,0,0,0.03); padding: 10px; border-radius: 8px; border: 1px dashed rgba(0,0,0,0.1);">
                                        <img src="${f.base64}" alt="${f.name}" style="max-width: 100%; max-height: 300px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: block; margin: 0 auto 10px auto; cursor: pointer;" onclick="window.open('${f.base64}', '_blank')" title="Bấm để xem ảnh gốc">
                                        <a href="${f.base64}" download="${f.name}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.85em; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📥 Tải ảnh xuống</a>
                                    </div>
                                </div>`;
                            } else {
                                teacherFileHTML += `<div class="assignment-file" style="margin-top: 10px;"><p style="font-size: 0.9em;"><strong>📎 Tài liệu đính kèm:</strong> <a href="${f.base64}" download="${f.name}" class="file-download-link" target="_blank">${f.name}</a></p></div>`;
                            }
                        });
                    }

                    let draftKey = `draft_${currentUser.username}_${assign.id}`;
                    let draft;
                    try {
                        draft = JSON.parse(localStorage.getItem(draftKey));
                        if (typeof draft !== 'object' || draft === null) draft = { mcAnswers: {}, essay: '' };
                    } catch (e) {
                        draft = { mcAnswers: {}, essay: '' };
                    }

                    let savedEssay = mySub && mySub.rawEssay ? mySub.rawEssay : draft.essay;
                    if (!savedEssay && mySub && mySub.answer) savedEssay = mySub.answer.replace(/\[PHẦN TRẮC NGHIỆM\][\s\S]*?\[PHẦN TỰ LUẬN\]\n/, '');

                    let prevFileHTML = '';
                    if (mySub && mySub.file) {
                        let mFiles = Array.isArray(mySub.file) ? mySub.file : [mySub.file];
                        mFiles.forEach(f => {
                            prevFileHTML += `<p style="font-size: 0.85em; color: #11998e; margin-bottom: 8px;">📄 <strong>File nộp cũ:</strong> <a href="${f.base64}" target="_blank">${f.name}</a></p>`;
                        });
                        prevFileHTML += `<p style="font-size: 0.85em; color: #e74c3c; margin-bottom: 8px;">(Bạn có thể tải file khác để ghi đè)</p>`;
                    }
                    let essayTextAreaHTML = assign.hideEssayText
                        ? `<div class="glass-alert success" style="padding: 12px; margin-bottom: 12px; border-left-color: #38ef7d; background: rgba(56, 239, 125, 0.1);"><p style="margin:0; font-size:0.95em; font-weight:bold;">📁 Giáo viên yêu cầu nộp bài bằng tệp đính kèm (Không cần nhập nội dung văn bản).</p></div>`
                        : `<textarea id="answer-${assign.id}" placeholder="Nhập câu trả lời..." rows="4" oninput="saveDraft('${assign.id}', 'essay', null, this.value)">${savedEssay ? savedEssay.replace(/</g, "&lt;").replace(/>/g, "&gt;") : ''}</textarea>`;

                    tuLuanInputHTML = `<hr style="border: 0; border-top: 1px dashed rgba(0,0,0,0.1); margin: 20px 0;">
                                       <h3 style="color: #2c3e50; margin-bottom: 10px;">Phần làm bài tự luận</h3>
                                       ${essayTextAreaHTML}
                                       <label style="display: block; margin: 10px 0 8px 0;"><strong>📎 Đính kèm file bài làm:</strong></label>
                                       ${prevFileHTML}
                                       <input type="file" id="studentFile-${assign.id}" accept=".docx, .pdf, image/*" multiple onclick="window.isSelectingFile = true;" onchange="handleStudentFileAccumulate(this, '${assign.id}')" style="margin-bottom: 15px; background: rgba(255,255,255,0.5);">`;
                }

                let submitBtnHTML = currentUser.isLocked
                    ? `<button type="button" style="width: 100%; margin-top: 15px; padding: 14px; border-radius: 12px; border: none; background: #95a5a6; color: white; font-weight: bold; cursor: not-allowed;" onclick="alert('🔒 Tài khoản của bạn đang bị khóa tạm thời. Bạn không thể nộp bài!')">🔒 Tài khoản bị khóa (Không thể thao tác)</button>`
                    : `<button id="btn-submit-${assign.id}" class="btn-approve" style="width: 100%; color: #111; margin-top: 15px;" onclick="this.disabled=true; this.style.opacity='0.6'; this.innerText='⏳ Đang xử lý, vui lòng đợi...'; submitAssignment('${assign.id}').finally(() => { this.disabled=false; this.style.opacity='1'; this.innerText='Nộp bài tập ngay'; })">Nộp bài tập ngay</button>`;

                const uniqueId = `student-todo-${assign.id}`;
                const div = document.createElement('div'); div.className = 'card submit-box accordion-card';
                div.style.position = 'relative'; // Bắt buộc để lớp phủ kính định vị chính xác

                // BẮT ĐẦU KIỂM TRA ĐIỀU KIỆN XEM VIDEO
                let watchedSeconds = 0;
                if (trackingData[assign.id] && trackingData[assign.id][currentUser.username]) {
                    watchedSeconds = trackingData[assign.id][currentUser.username];
                }
                let watchedMinutes = Math.floor(watchedSeconds / 60);

                let conditionAlertHTML = '';
                let isLockedByVideo = false;

                // Nếu giáo viên có đặt điều kiện > 0
                if (assign.watchCondition && assign.watchCondition > 0 && assign.videoDuration) {
                    if (watchedMinutes < assign.watchCondition) {
                        isLockedByVideo = true;
                        conditionAlertHTML = `
                    <div style="background: rgba(225, 29, 72, 0.04); border: 1px solid rgba(225, 29, 72, 0.15); border-left: 5px solid #e11d48; padding: 20px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 10px rgba(225, 29, 72, 0.05);">
                        <h4 style="color: #e11d48; margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px; font-size: 1.1em;">
                            🔒 Cần hoàn thành video để mở khóa!
                        </h4>
                        <p style="margin: 0; font-size: 0.95em; line-height: 1.6; color: #334155;">
                            Giáo viên yêu cầu xem tối thiểu <strong style="color:#b91c1c; background: rgba(225, 29, 72, 0.1); padding: 3px 8px; border-radius: 6px;">${assign.watchCondition} / ${assign.videoDuration} phút</strong> video bài giảng.<br>
                            Hiện tại bạn mới xem: <strong>${watchedMinutes} phút</strong>. Hãy tiếp tục xem nhé!
                        </p>
                    </div>
                `;
                    } else {
                        conditionAlertHTML = `
                    <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-left: 5px solid #10b981; padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; color: #065f46; font-weight: 500; font-size: 0.95em; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.05);">
                        ✅ Đã xem đủ thời lượng yêu cầu (${watchedMinutes}/${assign.videoDuration} phút). Phần bài tập đã mở khóa!
                    </div>
                `;
                    }
                }
                // KẾT THÚC KIỂM TRA

                let assignmentContentRaw = `
                    ${videoHTML} 
                    ${conditionAlertHTML} 
                    
                    ${isLockedByVideo ? `
                        <!-- Khung báo khóa làm đẹp lại -->
                        <div style="text-align: center; padding: 40px 20px; background: repeating-linear-gradient(45deg, rgba(0,0,0,0.01), rgba(0,0,0,0.01) 10px, rgba(255,255,255,0.6) 10px, rgba(255,255,255,0.6) 20px); border: 2px dashed #cbd5e1; border-radius: 16px; margin-top: 10px;">
                            <span style="font-size: 3em; opacity: 0.4; display: block; margin-bottom: 15px;">🙈</span>
                            <h4 style="color: #64748b; margin: 0 0 8px 0; font-size: 1.1em;">Khu vực làm bài đang bị ẩn</h4>
                            <p style="color: #94a3b8; font-style: italic; margin: 0; font-size: 0.9em; line-height: 1.5; max-width: 85%; margin: 0 auto;">
                                (Hãy hoàn thành điều kiện xem video ở trên để hiển thị câu hỏi và nút nộp bài)
                            </p>
                        </div>
                    ` : `
                        ${quizHTML || ''}
                        ${descHTML || ''}
                        ${teacherFileHTML || ''}
                        ${tuLuanInputHTML || ''}
                        ${submitBtnHTML || ''}
                    `}
                `;

                if (assign.assessmentType === 'thi') {
                    assignmentContentRaw = `
                        <div id="exam-wrapper-${assign.id}" style="text-align: center; padding: 30px;">
                            <button class="btn-approve" style="background: linear-gradient(135deg, #e11d48 0%, #ff4d4d 100%); color: white; font-size: 1.2em; padding: 15px 30px; border-radius: 50px; border: none; cursor: pointer; box-shadow: 0 5px 15px rgba(225, 29, 72, 0.4);" onclick="showExamWarning('${assign.id}')">🚀 Bắt đầu bài thi</button>
                        </div>
                        <div id="exam-content-${assign.id}" style="display: none;">
                            ${assignmentContentRaw}
                        </div>
                    `;
                }

                // --- BỔ SUNG: LOGIC LỚP PHỦ KÍNH MỜ KHÓA BÀI ---
                let isLockedByExam = window.currentActiveExamId && window.currentActiveExamId !== assign.id;
                let clickHandler = isLockedByExam ? `alert('⚠️ Đang trong chế độ thi! Vui lòng tập trung hoàn thành bài thi.')` : `toggleAccordion('${uniqueId}', this)`;
                let glassLockHTML = isLockedByExam ? `<div style="position: absolute; inset: 0; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(4px); z-index: 10; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: not-allowed;"><span style="background: rgba(225, 29, 72, 0.9); color: white; padding: 6px 14px; border-radius: 20px; font-weight: bold; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4);">🔒 Tạm khóa khi thi</span></div>` : '';

                div.innerHTML = `${glassLockHTML}<div class="accordion-header" onclick="${clickHandler}"><div class="accordion-title"><h4>${assign.title}</h4></div><div class="accordion-meta"><span>Hạn nộp: <strong style="color: #d35400;">${assign.endDate}</strong></span><span class="toggle-icon">▼</span></div></div>
                    <div id="${uniqueId}" class="accordion-content">
                        ${redoNotice}
                        <div class="assignment-meta"><p>📅 <strong>Từ:</strong> ${assign.startDate} <strong>đến</strong> ${assign.endDate}</p>${countdownHTML}</div>
                        ${assignmentContentRaw}
                    </div>`;

                list.appendChild(div);

                if (!isRedoing || (isRedoing && now <= endTime)) {
                    const timer = setInterval(() => {
                        const c = new Date();
                        const timeLeft = endTime - c;

                        // TUYỆT ĐỐI BỎ QUA KHÓA 15 GIÂY NẾU ĐANG LÀM LẠI
                        const currentlyRedoing = mySub ? !!mySub.isRedoing : false;

                        if (currentlyRedoing === false && timeLeft <= 15000 && timeLeft > 0) {
                            const btnSubmit = document.getElementById(`btn-submit-${assign.id}`);
                            if (btnSubmit && !btnSubmit.disabled) {
                                btnSubmit.disabled = true;
                                btnSubmit.style.background = '#95a5a6';
                                btnSubmit.style.cursor = 'not-allowed';
                                btnSubmit.innerText = '🔒 Đã khóa (Hệ thống chuẩn bị thu bài)';
                            }
                            // BỔ SUNG: Khóa luôn ô tải file để học sinh không tải lên vô ích
                            const fileInput = document.getElementById(`studentFile-${assign.id}`);
                            if (fileInput && !fileInput.disabled) {
                                fileInput.disabled = true;
                                fileInput.style.cursor = 'not-allowed';
                                fileInput.style.opacity = '0.5';
                            }
                        }

                        if (c > endTime) {
                            clearInterval(timer);
                            if (!isRedoing) loadAssignments();
                        } else {
                            const el = document.getElementById(`cd-end-${assign.id}`);
                            if (el) el.innerText = formatCountdown(timeLeft);
                        }
                    }, 1000);
                    assignmentTimers.push(timer);
                }
            }
        }
    });
    if (hasAutoSubmitted) {
        const syncAlert = document.createElement('div');
        syncAlert.className = 'glass-alert danger';
        syncAlert.innerHTML = '<p style="font-weight:bold; margin:0;">Hệ thống đang đồng bộ thu bài tự động...</p>';
        list.prepend(syncAlert);
    }

    if (window.MathJax) {
        const listEl = document.getElementById('assignmentsList');
        const gradesEl = document.getElementById('gradesList');
        const mathJaxTargets = [];
        if (listEl) mathJaxTargets.push(listEl);
        if (gradesEl) mathJaxTargets.push(gradesEl);

        if (mathJaxTargets.length > 0) {
            MathJax.typesetPromise(mathJaxTargets).catch((err) => console.log('MathJax error:', err));
        }
    }

    setTimeout(() => {
        if (typeof initYouTubeTrackers === 'function') {
            initYouTubeTrackers(assignments);
        }
    }, 1000); // Chờ 1 giây để iframe kịp mount vào DOM
}


// =====================================================================
// HÀM HIỂN THỊ POPUP CHỈ XEM CÂU HỎI BÀI TẬP (KHÔNG HIỆN ĐÁP ÁN)
// =====================================================================
window.viewAssignmentQuestions = async function (assignId) {
    const assignments = await getDB('assignments');
    const assign = assignments.find(a => a.id === assignId);
    if (!assign) return;

    // Đã thêm padding-right: 30px để tiêu đề không bị đè dưới nút X
    let contentHTML = `<h3 style="color: #2c3e50; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 20px; padding-right: 30px;">Nội dung câu hỏi: ${assign.title}</h3>`;

    // Nếu có phần trắc nghiệm
    if ((assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop') && assign.questions) {
        contentHTML += `<h4 style="color: #d35400; margin-bottom: 10px;">📚 Phần Trắc Nghiệm</h4>`;
        assign.questions.forEach((q, idx) => {
            contentHTML += `
            <div style="margin-bottom: 15px; background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05);">
                <p style="font-weight: bold; color: #2c3e50; margin-bottom: 8px;">Câu ${idx + 1}: ${q.qText}</p>
                <ul style="list-style-type: none; padding-left: 0; line-height: 1.8; color: #444;">
                    <li>A. ${q.A}</li>
                    <li>B. ${q.B}</li>
                    <li>C. ${q.C}</li>
                    <li>D. ${q.D}</li>
                </ul>
            </div>`;
        });
    }

    // Nếu có phần tự luận
    if (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType) {
        if (assign.desc) {
            contentHTML += `
            <h4 style="color: #d35400; margin-bottom: 10px; margin-top: 20px;">✍️ Phần Tự Luận / Yêu cầu</h4>
            <div style="background: rgba(0,0,0,0.03); padding: 15px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); white-space: pre-wrap; color: #444;">${assign.desc}</div>
            `;
        }
    }

    // Khởi tạo popup (Modal Overlay) nếu chưa có
    let modal = document.getElementById('viewQuestionsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'viewQuestionsModal';
        // Thêm padding cho overlay để trên điện thoại không bị sát mép màn hình
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 15px; box-sizing: border-box;';
        document.body.appendChild(modal);
    }

    // Cấu trúc lại HTML của Modal: Dùng flexbox, tách vùng cuộn (overflow-y) ra khỏi thẻ ngoài cùng
    modal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 12px; max-width: 600px; width: 100%; max-height: 85vh; display: flex; flex-direction: column; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            
            <button onclick="document.getElementById('viewQuestionsModal').style.display='none'" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.05); border-radius: 50%; width: 30px; height: 30px; border: none; font-size: 1em; cursor: pointer; color: #e74c3c; font-weight: bold; z-index: 10; display: flex; justify-content: center; align-items: center; padding: 0;">✖</button>
            
            <div style="overflow-y: auto; padding-right: 10px; flex-grow: 1;">
                ${contentHTML}
            </div>
            
            <button onclick="document.getElementById('viewQuestionsModal').style.display='none'" style="width: 100%; padding: 12px; background: #ddd; border: none; border-radius: 8px; margin-top: 20px; font-weight: bold; cursor: pointer; flex-shrink: 0; transition: background 0.2s;">Đóng lại</button>
        </div>
    `;
    modal.style.display = 'flex';

    if (window.MathJax) {
        MathJax.typesetPromise([modal]).catch((err) => console.log('MathJax error:', err));
    }
};

async function submitAssignment(assignId, isAuto = false, isCheat = false) {
    if (currentUser.isLocked && !isAuto) return alert("🔒 LỖI: Tài khoản đang bị khóa tạm thời!");

    const assignments = await getDB('assignments');
    const assign = assignments.find(a => a.id === assignId);
    if (!assign) return;

    const submissions = await getDB('submissions');
    const mySub = submissions.find(s => s.assignmentId === assignId && s.studentUsername === currentUser.username);
    const isRedoing = mySub && mySub.isRedoing;

    const now = new Date();
    const startTime = assign.startDate ? window.parseSafeDate(assign.startDate) : new Date(0);
const endTime = assign.endDate ? window.parseSafeDate(assign.endDate) : new Date("2100-01-01");

    if (now < startTime) return alert("⚠️ Lỗi: Chưa đến thời gian làm bài!");

    // Ép kiểu boolean tuyệt đối để tránh xung đột
    const isCurrentlyRedoing = mySub ? !!mySub.isRedoing : false;

    // --- KHÓA CHẶN 15 GIÂY TRƯỚC HẠN CHÓT ---
    const timeRemaining = endTime.getTime() - now.getTime();

    // CHỈ ÁP DỤNG KHÓA 15 GIÂY VÀ KHÓA QUÁ HẠN NẾU KHÔNG PHẢI LÀM LẠI
    if (!isAuto && isCurrentlyRedoing === false) {
        if (timeRemaining <= 15000 && timeRemaining > 0) {
            alert("⚠️ Lỗi: Chỉ còn dưới 15 giây là hết hạn! Hệ thống đã khóa tính năng nộp bài để chuẩn bị đồng bộ dữ liệu tự động.");
            loadAssignments(); // Tải lại để ép ẩn đi nút nộp
            return;
        }
        if (now > endTime) {
            alert("⚠️ Lỗi: Đã quá thời gian nộp bài! Hệ thống lập tức khóa chức năng nộp.");
            loadAssignments();
            return;
        }
    }

    let mcAnswersObj = {};
    let mcText = '';
    let autoScore = 0;
    let finalCalculatedGrade = null;

    if (assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop') {
        if (assign.questions) {
            let allAnswered = true;
            assign.questions.forEach((q, idx) => {
                const selected = document.querySelector(`input[name="q-${assignId}-${idx}"]:checked`);
                if (selected) {
                    mcAnswersObj[idx] = selected.value;
                    const isCorrect = selected.value === q.correct;
                    if (isCorrect) autoScore++;
                    mcText += `Câu ${idx + 1}: Chọn ${selected.value} ${isCorrect ? '✅' : '❌ (Đúng là ' + q.correct + ')'}\n`;
                } else {
                    allAnswered = false;
                    mcText += `Câu ${idx + 1}: Chưa chọn (Đúng là ${q.correct})\n`;
                }
            });
            if (!allAnswered && !isAuto) return alert("Vui lòng chọn đáp án cho TẤT CẢ câu hỏi!");

            let scale10 = Math.round(((autoScore / assign.questions.length) * 10) * 10) / 10;
            if (assign.assessmentType === 'trac_nghiem') {
                mcText += `\n=> 🎯 CHẤM ĐIỂM TỰ ĐỘNG: ${autoScore} / ${assign.questions.length} (Đạt ${scale10} / 10 điểm)`;
                finalCalculatedGrade = scale10;
            } else if (assign.assessmentType === 'ket_hop') {
                let weight = assign.mcWeight || 5;
                let weightedScore = Math.round(((autoScore / assign.questions.length) * weight) * 100) / 100;
                mcText += `\n=> 🎯 CHẤM TỰ ĐỘNG PHẦN TRẮC NGHIỆM: ${autoScore} / ${assign.questions.length} (Đạt ${weightedScore} / ${weight} điểm)`;
            }
        }
    }

    let answer = '';
    let filesArray = null;

    // --- BẮT ĐẦU ĐOẠN ĐÃ FIX LỖI ---
    // 1. Thêm assign.assessmentType === 'thi' vào điều kiện để chịu đọc file khi thi
    if (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi' || !assign.assessmentType) {
        const answerEl = document.getElementById(`answer-${assignId}`); if (answerEl) answer = answerEl.value;

        // 2. Ưu tiên đọc từ biến cộng dồn file (studentSubmitDTs) để chắc chắn lấy đủ 2-3 file
        if (window.studentSubmitDTs && window.studentSubmitDTs[assignId] && window.studentSubmitDTs[assignId].files.length > 0) {
            filesArray = await readMultipleFiles(window.studentSubmitDTs[assignId].files);
            if (filesArray.length === 0) return;
        } else {
            // Fallback dự phòng: Quét trực tiếp ô input trên màn hình
            const fileInput = document.getElementById(`studentFile-${assignId}`);
            if (fileInput && fileInput.files.length > 0) {
                filesArray = await readMultipleFiles(fileInput.files);
                if (filesArray.length === 0) return;
            }
        }

        let hasOldFile = mySub && mySub.file;

        if (assign.hideEssayText) {
            if (!filesArray && !hasOldFile && assign.assessmentType === 'tu_luan' && !isAuto) {
                return alert("Bài tự luận này yêu cầu bạn bắt buộc phải đính kèm tệp bài làm!");
            }
        } else {
            // 3. Thêm ngoại lệ 'thi' vào đây để tránh bị chặn hàm cảnh báo sai
            if (!answer && !filesArray && !hasOldFile && assign.assessmentType !== 'ket_hop' && assign.assessmentType !== 'thi' && !isAuto) return alert("Cần nhập nội dung hoặc đính kèm file!");
        }
    }

    let finalAnswerText = "";
    if (isCheat) finalAnswerText += "🚨 [HỆ THỐNG TỰ ĐỘNG THU BÀI DO VI PHẠM QUY CHẾ - TỰ Ý THOÁT TOÀN MÀN HÌNH]\n\n";
    else if (isAuto) finalAnswerText += "⚠️ [HỆ THỐNG TỰ ĐỘNG THU BÀI DO HẾT GIỜ LÀM]\n\n";
    if (mcText) finalAnswerText += `[PHẦN TRẮC NGHIỆM]\n${mcText}\n\n`;
    if (answer) finalAnswerText += `[PHẦN TỰ LUẬN]\n${answer}`;

    const processSubmission = async (fileData) => {
        const submitNow = new Date();

        let finalFile = fileData;
        if (!fileData && mySub && mySub.file && !isCurrentlyRedoing) {
            finalFile = mySub.file;
        }

        const payload = {
            assignmentId: assignId,
            studentUsername: currentUser.username,
            studentName: currentUser.name,
            answer: finalAnswerText || (isAuto ? "⚠️ [Hệ thống tự động thu bài - Trống]" : ""),
            rawEssay: answer,
            mcAnswers: mcAnswersObj,
            grade: finalCalculatedGrade,
            submitTime: submitNow.toLocaleTimeString('vi-VN') + ' ' + submitNow.toLocaleDateString('vi-VN'),
            file: finalFile,
            teacherFile: null,
            isAutoSubmitted: isAuto || isCheat, // Vẫn giữ cờ auto để khóa các thao tác khác
            isCheatFail: isCheat, // Đẩy cờ vi phạm lên Database
            isRedoing: false
        };

        if (mySub && mySub.isLateFail) {
            payload.isLateFail = true;
        }

        if (mySub) {
            await updateDB('submissions', mySub._fbKey, payload);
        } else {
            payload.id = Date.now().toString() + Math.floor(Math.random() * 1000);
            await pushDB('submissions', payload);
        }

        // Dọn dẹp bản nháp sau khi nộp bài thành công
        localStorage.removeItem(`draft_${currentUser.username}_${assignId}`);


        // --- ĐOẠN NÀY ĐỂ THOÁT TOÀN MÀN HÌNH VÀ MỞ KHÓA GIAO DIỆN SAU KHI NỘP ---
        if (window.currentActiveExamId === assignId) {
            window.currentActiveExamId = null;
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
            }

            // Mở khóa toàn bộ menu bên trái (Sidebar) và nút đăng xuất
            document.querySelectorAll('.nav-item, .btn-logout').forEach(btn => {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto'; // Trả lại khả năng click
            });
        }
        // -----------------------------------------------------------
        // -----------------------------------------------------------

        if (!isAuto) alert("Nộp bài tập thành công!");

        await loadAssignments();
        if (typeof renderStudentRoadmap === 'function') renderStudentRoadmap();
    };

    await processSubmission(filesArray);
}

// TẢI DANH SÁCH TÀI LIỆU DÀNH CHO HỌC SINH XEM
async function loadMaterialsListStudent() {
    const materials = await getDB('materials');
    const list = document.getElementById('studentMaterialsList');
    if (!list) return;
    list.innerHTML = '';
    if (materials.length === 0) { list.innerHTML = '<p style="color: #666; font-style: italic;">Chưa có tài liệu học tập nào từ Giáo viên.</p>'; return; }

    [...materials].reverse().forEach(mat => {
        // ---> BẮT ĐẦU THÊM ĐOẠN LỌC NÀY <---
        // Kiểm tra: Nếu tài liệu có gắn tên học sinh, không phải 'all' và không trùng với username của người đang đăng nhập -> Ẩn đi
        if (mat.targetStudent && mat.targetStudent !== 'all' && mat.targetStudent !== currentUser.username) {
            return; // Lệnh return giúp bỏ qua vòng lặp, không in tài liệu này ra màn hình
        }
        // ---> KẾT THÚC ĐOẠN LỌC <---

        let fileHTML = '';
        if (mat.docLink) {
            // Nút bấm dành cho link URL (Mở trực tiếp trên web)
            fileHTML = `<div class="assignment-file" style="margin-top: 15px; background: rgba(56, 239, 125, 0.05); border-left: 4px solid #38ef7d;"><p><strong>📚 Link bài học:</strong> <a href="${mat.docLink}" class="file-download-link" target="_blank" rel="noopener">Nhấn vào đây để xem trực tiếp</a></p></div>`;
        } else if (mat.file) {
            let isImg = (mat.file.type && mat.file.type.startsWith('image/')) || (mat.file.base64 && mat.file.base64.startsWith('data:image/'));
            if (isImg) {
                let uniqueId = 'img_mat_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                fileHTML = `
                <div class="assignment-file" style="margin-top: 10px; background: rgba(56, 239, 125, 0.05); border-left: 4px solid #38ef7d; padding: 8px 10px; border-radius: 0 8px 8px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.9em;"><strong>📚 Ảnh bài học:</strong> <span style="color: #666;">${mat.file.name}</span></span>
                        <button onclick="let content = document.getElementById('${uniqueId}'); if(content.style.display==='none'){content.style.display='block'; this.innerHTML='🔼 Thu gọn';}else{content.style.display='none'; this.innerHTML='🔽 Xem ảnh';}" style="background: white; border: 1px solid #38ef7d; color: #059669; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: 0.2s;">🔽 Xem ảnh</button>
                    </div>
                    <div id="${uniqueId}" style="display: none; margin-top: 10px; text-align: center; background: white; padding: 10px; border-radius: 8px; border: 1px dashed rgba(56, 239, 125, 0.3);">
                        <img src="${mat.file.base64}" alt="${mat.file.name}" style="max-width: 100%; max-height: 300px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: block; margin: 0 auto 10px auto; cursor: pointer;" onclick="window.open('${mat.file.base64}', '_blank')" title="Bấm để xem ảnh gốc">
                        <a href="${mat.file.base64}" download="${mat.file.name}" style="display: inline-block; background: #059669; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.85em; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📥 Tải ảnh xuống</a>
                    </div>
                </div>`;
            } else {
                fileHTML = `<div class="assignment-file" style="margin-top: 10px; background: rgba(56, 239, 125, 0.05); border-left: 4px solid #38ef7d;"><p style="font-size: 0.9em;"><strong>📚 Tải file bài học:</strong> <a href="${mat.file.base64}" download="${mat.file.name}" class="file-download-link" target="_blank">${mat.file.name}</a></p></div>`;
            }
        }

        let videoHTML = mat.videoLink ? getEmbedHTML(mat.videoLink) : '';

        const uniqueId = `student-mat-${mat.id}`;
        const div = document.createElement('div'); div.className = 'card accordion-card';
        div.innerHTML = `
            <div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)">
                <div class="accordion-title"><h4>${mat.title}</h4><span>🕒 Ngày đăng: ${mat.uploadTime || 'Chưa rõ'}</span></div>
                <div class="accordion-meta"><span class="toggle-icon">▼</span></div>
            </div>
            <div id="${uniqueId}" class="accordion-content">
                ${videoHTML}${fileHTML}
            </div>`;
        list.appendChild(div);
    });
}

async function syncUserData() {
    const users = await getDB('users');
    const userRecord = users.find(u => u.username === currentUser.username);
    if (userRecord) {
        if (userRecord.isLocked) { /* ... */ return; }
        localStorage.setItem('currentUser', JSON.stringify(userRecord));
        Object.assign(currentUser, userRecord);

        // FIX: Wrap in a check
        const studentNameEl = document.getElementById('studentName');
        if (studentNameEl) studentNameEl.innerHTML = currentUser.name;

        loadAssignments();
        updateAvatarDisplay(currentUser.avatar);
    }
}

async function updateProfile() { if (currentUser.isLocked) return alert("🔒 Tài khoản đang bị khóa!"); const newName = document.getElementById('settingName').value.trim(); const newPass = document.getElementById('settingPass').value.trim(); if (!newName) return alert("Tên hiển thị trống!"); if (newName === currentUser.name && !newPass) return alert("Chưa đổi thông tin!"); const requests = await getDB('profile_requests'); if (requests.find(r => r.username === currentUser.username && r.status === 'pending')) return alert("Yêu cầu trước đang chờ duyệt!"); const now = new Date(); await pushDB('profile_requests', { username: currentUser.username, currentName: currentUser.name, newName: newName, newPass: newPass, status: 'pending', time: now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN') }); document.getElementById('settingPass').value = ''; alert("Đã gửi yêu cầu thay đổi!"); }
async function checkProfileRequests() {
    const requests = await getDB('profile_requests');
    let myReqs = requests.filter(r => r.username === currentUser.username);
    const container = document.getElementById('requestNotifications');
    if (!container) return;

    // Bước 1: Lọc và tự động xóa các yêu cầu cũ hơn 7 ngày
    const validReqs = [];
    for (let req of myReqs) {
        let isExpired = false;
        if (req.time) {
            try {
                // Tách chuỗi "15:56:34 30/5/2026" thành thời gian và ngày
                const parts = req.time.split(' ');
                if (parts.length === 2) {
                    const dateP = parts[1].split('/'); // [Ngày, Tháng, Năm]
                    const timeP = parts[0].split(':'); // [Giờ, Phút, Giây]

                    // Tạo Object Date (Lưu ý tháng trong JS bắt đầu từ 0)
                    const reqDate = new Date(dateP[2], dateP[1] - 1, dateP[0], timeP[0], timeP[1], timeP[2] || 0);
                    const now = new Date();

                    // Kiểm tra xem đã qua 7 ngày chưa (7 ngày * 24h * 60m * 60s * 1000ms)
                    if ((now - reqDate.getTime()) > 7 * 24 * 60 * 60 * 1000) {
                        isExpired = true;
                    }
                }
            } catch (e) { console.log("Lỗi tính toán thời gian", e); }
        }

        if (isExpired) {
            // Đã quá 1 tuần -> Xóa vĩnh viễn khỏi Firebase để nhẹ dữ liệu
            await removeDB('profile_requests', req._fbKey);
        } else {
            validReqs.push(req);
        }
    }

    // Nếu không còn yêu cầu nào hợp lệ thì thoát
    if (validReqs.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Bước 2: Hiển thị giao diện và logic rút gọn
    let html = '<h3 style="color: #2c3e50; border-bottom: 2px solid rgba(255,255,255,0.5); padding-bottom: 10px; margin-bottom: 15px; margin-top: 30px;">Lịch sử yêu cầu thay đổi:</h3>';

    // Đảo ngược để đưa các yêu cầu mới nhất (vừa gửi) lên đầu tiên
    const reversedReqs = [...validReqs].reverse();

    reversedReqs.forEach((req, index) => {
        let statusHtml = '', alertClass = '';
        if (req.status === 'pending') {
            statusHtml = '<span style="color: #d35400; font-weight: bold;">⏳ Đang chờ duyệt</span>';
        } else if (req.status === 'approved') {
            statusHtml = '<span style="color: #059669; font-weight: bold;">✅ Đã chấp nhận</span>'; alertClass = 'success';
        } else if (req.status === 'rejected') {
            statusHtml = '<span style="color: #e11d48; font-weight: bold;">❌ Bị từ chối</span>'; alertClass = 'danger';
        }

        let reqHtml = `<div class="glass-alert ${alertClass}"><p style="margin: 0; font-size: 0.9em; color: #666;">🕒 Gửi: ${req.time}</p><p style="margin: 5px 0;">Đổi tên thành: <strong style="color:#667eea;">${req.newName}</strong></p>${req.newPass ? '<p style="margin: 0; color: #e11d48; font-weight: bold;">🔑 Có yêu cầu đổi mật khẩu</p>' : ''}<hr style="border: 0; border-top: 1px dashed rgba(0,0,0,0.1); margin: 10px 0;"><p style="margin: 0;">Trạng thái: ${statusHtml}</p></div>`;

        // Nếu là yêu cầu thứ 3 trở đi, bọc nó vào trong 1 div ẩn
        if (index === 2) {
            html += `<div id="moreRequestsContent" style="display: none; animation: fadeInUp 0.4s ease;">`;
        }

        html += reqHtml;

        // Nếu đã lặp đến phần tử cuối cùng và tổng số yêu cầu lớn hơn 2
        if (index === reversedReqs.length - 1 && reversedReqs.length > 2) {
            // Đóng div ẩn và chèn nút Xem thêm
            html += `</div>
            <button id="toggleRequestsBtn" onclick="toggleOldRequests()" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: 2px dashed #667eea; box-shadow: none; margin-top: 5px; width: 100%; padding: 12px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: all 0.3s;">
                Xem thêm yêu cầu cũ ⬇️
            </button>`;
        }
    });

    container.innerHTML = html;
}

// Hàm bổ trợ: Đóng/Mở các yêu cầu cũ
window.toggleOldRequests = function () {
    const content = document.getElementById('moreRequestsContent');
    const btn = document.getElementById('toggleRequestsBtn');

    if (content && btn) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            btn.innerHTML = 'Thu gọn lịch sử ⬆️';
        } else {
            content.style.display = 'none';
            btn.innerHTML = 'Xem thêm yêu cầu cũ ⬇️';
        }
    }
};

function switchTab(tabId, btnElement) {
    // --- BỔ SUNG: CHẶN CHUYỂN TAB KHI ĐANG THI ---
    if (window.currentActiveExamId) {
        window.showExamLockWarning("⚠️ Hệ thống đã khóa menu để đảm bảo tính minh bạch!");
        return;
    }
    // ---------------------------------------------

    // 1. Reset trạng thái active của các tab
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    // 2. Kích hoạt tab mới
    document.getElementById(tabId).classList.add('active');
    btnElement.classList.add('active');

    // 3. Xóa vị trí cuộn cũ, cuộn mượt mà lên vị trí cao nhất
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Nếu bạn đang dùng scroll trên thẻ div .content, thì dòng này sẽ xử lý nó
    const contentArea = document.querySelector('.content');
    if (contentArea) {
        contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

window.openStudentInfoModal = function () {
    if (window.currentActiveExamId) {
        window.showExamLockWarning("⚠️ Hồ sơ cá nhân tạm khóa khi thi!");
        return;
    }
    const currentAvatar = currentUser.avatar || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    document.getElementById('modalAvatarPreview').src = currentAvatar;
    document.getElementById('saveAvatarBtn').style.display = 'none';

    document.getElementById('infoModalName').innerText = currentUser.name || 'Chưa cập nhật';
    document.getElementById('infoModalClass').innerText = 'Lớp: ' + (currentUser.classInfo || 'Chưa cập nhật');
    document.getElementById('infoModalHobbies').innerText = currentUser.hobbies || 'Chưa cập nhật';
    document.getElementById('infoModalMotto').innerText = currentUser.motto || 'Chưa cập nhật';
    document.getElementById('studentInfoModal').classList.add('active');
};

window.closeStudentInfoModal = function () {
    document.getElementById('studentInfoModal').classList.remove('active');
};

// ==============================================================
// HỆ THỐNG XỬ LÝ ẢNH ĐẠI DIỆN (AVATAR)
// ==============================================================

// 1. Hàm hiển thị ảnh đại diện lên góc màn hình ngay khi đăng nhập
function updateAvatarDisplay(avatarData) {
    const avatarImg = document.getElementById('avatarImage');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    const triggerBtn = document.querySelector('.profile-trigger-btn');

    if (avatarData && avatarData.startsWith('data:image')) {
        // Nếu đã có ảnh
        avatarImg.src = avatarData;
        avatarImg.style.display = 'block'; // Hiện ảnh
        avatarPlaceholder.style.display = 'none'; // Ẩn emoji 👤
        triggerBtn.style.background = 'transparent'; // Xóa nền mờ để ảnh đẹp hơn
        triggerBtn.style.border = 'none'; // Xóa viền
    } else {
        // Nếu chưa có ảnh (hoặc ảnh lỗi) -> Hiện mặc định
        avatarImg.style.display = 'none'; // Ẩn ảnh
        avatarPlaceholder.style.display = 'flex'; // Hiện emoji 👤
        triggerBtn.style.background = 'rgba(255,255,255,0.7)'; // Trở lại nền kính
        triggerBtn.style.border = '2px solid rgba(255,255,255,0.9)'; // Trở lại viền
    }
}

// 2. Chức năng xem trước ảnh khi học sinh chọn file
let selectedAvatarBase64 = null; // Biến tạm lưu mã ảnh mới chọn
window.previewAvatar = function (input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // Kiểm tra dung lượng (giới hạn < 1MB để Firebase không bị quá tải)
        if (file.size > 1024 * 1024) {
            alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 1MB.');
            input.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            // Hiển thị ảnh xem trước lên Modal
            document.getElementById('modalAvatarPreview').src = e.target.result;
            // Hiện nút lưu
            document.getElementById('saveAvatarBtn').style.display = 'block';
            // Lưu mã ảnh vào biến tạm
            selectedAvatarBase64 = e.target.result;
        };
        reader.readAsDataURL(file); // Đọc file thành mã Base64
    }
};

// 3. Chức năng lưu ảnh mới lên cơ sở dữ liệu
window.saveNewAvatar = async function () {
    if (!selectedAvatarBase64) return;

    // 1. Hiển thị trạng thái đang lưu ở góc màn hình
    const cornerImg = document.getElementById('avatarImage');
    cornerImg.classList.add('loading');

    // 2. Cập nhật vào Firebase
    await updateDB('users', currentUser._fbKey, { avatar: selectedAvatarBase64 });

    // 3. Cập nhật lại Object người dùng hiện tại trong Session
    currentUser.avatar = selectedAvatarBase64;
    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Lưu lại vào localStorage

    // 4. Cập nhật hiển thị
    updateAvatarDisplay(selectedAvatarBase64); // Cập nhật góc phải

    // 5. Ẩn nút lưu, xóa biến tạm
    document.getElementById('saveAvatarBtn').style.display = 'none';
    selectedAvatarBase64 = null;
    cornerImg.classList.remove('loading');

    alert('Đã cập nhật ảnh đại diện thành công! 🎉');
};

// ================= HỆ THỐNG XỬ LÝ LỊCH HỌC (THỜI KHÓA BIỂU) =================

// Hàm đổi qua lại giữa giao diện Lộ trình / Lịch học
window.toggleRoadmapView = function (view) {
    const btnRoadmap = document.getElementById('btnSubRoadmap');
    const btnSchedule = document.getElementById('btnSubSchedule');
    const viewRoadmap = document.getElementById('view-roadmap');
    const viewSchedule = document.getElementById('view-schedule');

    if (view === 'roadmap') {
        viewRoadmap.style.display = 'block'; viewSchedule.style.display = 'none';
        btnRoadmap.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        btnRoadmap.style.color = 'white';
        btnRoadmap.style.border = 'none';
        btnSchedule.style.background = 'rgba(255,255,255,0.5)';
        btnSchedule.style.color = '#667eea';
        btnSchedule.style.border = '2px solid #667eea';
    } else {
        viewRoadmap.style.display = 'none'; viewSchedule.style.display = 'block';
        btnSchedule.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        btnSchedule.style.color = 'white';
        btnSchedule.style.border = 'none';
        btnRoadmap.style.background = 'rgba(255,255,255,0.5)';
        btnRoadmap.style.color = '#667eea';
        btnRoadmap.style.border = '2px solid #667eea';
    }
};

window.loadScheduleStudent = async function () {
    const schedules = await getDB('schedule');
    const tbody = document.getElementById('studentScheduleBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // LỌC CHẶT CHẼ: Chỉ lấy những lịch học dành cho Tất cả hoặc dành riêng cho mình
    const mySchedules = schedules.filter(s => !s.targetStudent || s.targetStudent === 'all' || s.targetStudent === currentUser.username);

    if (mySchedules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding:15px; text-align:center; color:#666; font-style:italic;">Chưa có lịch học nào được sắp xếp.</td></tr>`;
        return;
    }

    mySchedules.forEach(s => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(0,0,0,0.05)';

        // Thêm một mác nhỏ để học sinh biết đây là lịch học cá nhân (tuỳ chọn)
        let personalLabel = (s.targetStudent && s.targetStudent !== 'all') ? `<br><span style="font-size: 0.8em; color: #059669;">(Lịch học Riêng)</span>` : '';

        tr.innerHTML = `
            <td style="padding:12px; font-weight:bold; color:#764ba2;">${s.day} ${personalLabel}</td>
            <td style="padding:12px; color:#d35400; font-weight:bold;">${s.time}</td>
            <td style="padding:12px; color:#2c3e50;">${s.subject}</td>
            <td style="padding:12px; color:#555;">${s.note || ''}</td>
        `;
        tbody.appendChild(tr);
    });
};

async function readMultipleFiles(files) {
    const MAX_SIZE_MB = 5; // Tăng giới hạn lên 5MB
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    const results = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Chặn file quá lớn
        if (file.size > MAX_SIZE_BYTES) {
            alert(`⚠️ File "${file.name}" quá lớn. Hệ thống chỉ cho phép tối đa ${MAX_SIZE_MB}MB/file!`);
            continue;
        }

        // Băm file thành chuỗi Base64
        const base64String = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });

        results.push({ name: file.name, type: file.type, base64: base64String });
    }

    return results;
}

// THAY THẾ TOÀN BỘ HÀM spinWheel CŨ Ở CUỐI FILE STUDENT.JS BẰNG ĐOẠN NÀY
// ================= HỆ THỐNG VÒNG QUAY MAY MẮN =================
let isSpinning = false;

// HÀM DÙNG CHUNG: Tính vé chính xác (Vé từ điểm + Vé quà tặng - Số lần đã quay)
window.calculateTotalTickets = async function () {
    const submissions = await getDB('submissions');
    const mySubs = submissions.filter(s => s.studentUsername === currentUser.username && s.grade !== null && s.grade !== undefined && s.grade !== '');

    let totalTickets = 0;
    // 1. Tính vé cơ bản theo điểm
    mySubs.forEach(sub => {
        let score = parseFloat(sub.grade);
        let subTickets = 0;
        if (score === 10) subTickets = 3;
        else if (score > 7) subTickets = 2;
        else if (score > 5) subTickets = 1;

        if (sub.hasRedone && subTickets > 0) subTickets -= 1;
        totalTickets += subTickets;
    });

    // 2. Cộng thêm vé quà tặng từ hộp thư
    const bonusSnap = await db.ref('student_bonus_tickets/' + currentUser.username).once('value');
    const bonusTickets = parseInt(bonusSnap.val()) || 0; // Đảm bảo luôn là số nguyên
    totalTickets += bonusTickets;

    // 3. Trừ đi số lần đã quay
    const countSnapshot = await db.ref('spin_counts/' + currentUser.username).once('value');
    let spinTracking = countSnapshot.val() || { count: 0 };
    let usedSpins = parseInt(spinTracking.count) || 0;

    return {
        remaining: totalTickets - usedSpins,
        used: usedSpins,
        spinTracking: spinTracking
    };
};

window.openLuckyWheel = async function () {
    if (window.isGameEnabled === false) {
        alert("🔒 Trò chơi hiện đang bị Giáo viên tạm khóa!");
        return;
    }

    // Gọi hàm tính toán vé
    const ticketData = await window.calculateTotalTickets();

    // Hiển thị số vé chính xác lên tiêu đề vòng quay
    const titleWheel = document.querySelector('#luckyWheelModal h3');
    if (titleWheel) {
        titleWheel.innerHTML = `🎡 Vòng Quay Nhân Phẩm<br><span style="font-size: 0.5em; color: #ffd700; text-transform: none;">🎫 Vé hiện có: ${ticketData.remaining}</span>`;
    }

    // Tự động ẩn/hiện nút Quay Nhanh khi mở bảng
    const quickSpinBtn = document.getElementById('quickSpinBtn');
    if (quickSpinBtn) {
        quickSpinBtn.style.display = ticketData.remaining > 1 ? 'block' : 'none';
    }

    document.getElementById('luckyWheelModal').classList.add('active');
};

window.spinWheel = async function () {
    if (window.isGameEnabled === false) {
        alert("🔒 Trò chơi hiện đang bị Giáo viên tạm khóa!");
        closeLuckyWheel();
        return;
    }

    if (isSpinning) return;

    // Lấy lại dữ liệu vé chuẩn xác trước khi cho phép quay
    const ticketData = await window.calculateTotalTickets();

    if (ticketData.remaining <= 0) {
        alert(`⚠️ Bạn đã hết vé quay! Hãy làm bài tập điểm cao hoặc kiểm tra hộp thư để nhận vé.`);
        closeLuckyWheel();
        return;
    }

    isSpinning = true;

    const wheel = document.getElementById('wheelContainer');
    const resultText = document.getElementById('spinResultText');
    const titleWheel = document.querySelector('#luckyWheelModal h3');

    // Trừ 1 vé trực tiếp trên giao diện ngay khi bấm quay cho mượt
    if (titleWheel) {
        titleWheel.innerHTML = `🎡 Vòng Quay Nhân Phẩm<br><span style="font-size: 0.5em; color: #ffd700; text-transform: none;">🎫 Vé hiện có: ${ticketData.remaining - 1}</span>`;
    }

    // Reset giao diện text trước khi quay
    resultText.style.opacity = '0';
    resultText.style.transform = 'scale(0.8)';
    resultText.style.color = '#fff';

    setTimeout(() => {
        resultText.innerText = 'Đang quay... 🌀';
        resultText.style.opacity = '1';
        resultText.style.transform = 'scale(1)';
    }, 200);

    // TÍNH TOÁN TỈ LỆ ĐỘNG TỪ GIÁO VIÊN
    const rand = Math.random() * 100;
    let targetSlice;
    let finalRewardStr = "";

    const p = window.wheelProbs || { miss: 50, c100: 20, c150: 25, c500: 4, gift: 1 };
    let cumulative = 0;

    if (rand < (cumulative += p.miss)) {
        const luckRand = Math.random();
        if (luckRand < 0.33) targetSlice = 0;
        else if (luckRand < 0.66) targetSlice = 2;
        else targetSlice = 4;
        finalRewardStr = "Chúc may mắn lần sau";
    }
    else if (rand < (cumulative += p.c100)) { targetSlice = 1; finalRewardStr = "100 Coin"; }
    else if (rand < (cumulative += p.c150)) { targetSlice = 3; finalRewardStr = "150 Coin"; }
    else if (rand < (cumulative += p.c500)) { targetSlice = 5; finalRewardStr = "500 Coin"; }
    else { targetSlice = 6; finalRewardStr = "Quà bí ẩn"; }

    const sliceAngle = 360 / 7;
    const centerOffset = (targetSlice * sliceAngle) + (sliceAngle / 2);
    const finalRotation = (360 * 5) + (360 - centerOffset);

    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';

    setTimeout(() => {
        wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheel.style.transform = `rotate(${finalRotation}deg)`;
    }, 50);

    setTimeout(async () => {
        let displayResult = finalRewardStr;
        let actualRewardRecord = finalRewardStr;
        let wonCoins = 0;

        // Xử lý kết quả quay
        if (finalRewardStr === "100 Coin") wonCoins = 100;
        else if (finalRewardStr === "150 Coin") wonCoins = 150;
        else if (finalRewardStr === "500 Coin") wonCoins = 500;
        else if (finalRewardStr === "Quà bí ẩn") {
            const cotichItems = (typeof StoreConfig !== 'undefined') ? StoreConfig.items.filter(i => i.tag && i.tag.toLowerCase() === 'cổ tích') : [];
            if (cotichItems.length > 0) {

                // TẢI TRỰC TIẾP KHO ĐỒ TỪ DB ĐỂ TRÁNH LỖI ASYNC
                const invSnap = await db.ref(`student_inventory/${currentUser.username}`).once('value');
                const exactInventory = invSnap.val() ? Object.values(invSnap.val()).map(i => i.id) : [];

                const randomItem = cotichItems[Math.floor(Math.random() * cotichItems.length)];

                // KIỂM TRA TRÊN DANH SÁCH CHUẨN XÁC VỪA TẢI
                if (exactInventory.includes(randomItem.id)) {
                    wonCoins = 600;
                    displayResult = `Trùng ${randomItem.name} (Bù 600 Coin)`;
                    actualRewardRecord = `Trùng ${randomItem.name} (+600 Coin)`;
                } else {
                    await db.ref(`student_inventory/${currentUser.username}/${randomItem.id}`).update({
                        id: randomItem.id, purchaseTime: Date.now(), isTrial: null, trialExpiry: null, isEquipped: false
                    });
                    displayResult = `Vật phẩm: ${randomItem.name}`;
                    actualRewardRecord = `Vật phẩm: ${randomItem.name}`;
                }
            } else {
                wonCoins = 600; displayResult = `600 Coin (Bí ẩn)`; actualRewardRecord = `600 Coin (Bí ẩn)`;
            }
        }

        // Hiển thị kết quả ra màn hình
        resultText.style.transform = 'scale(1.2)';
        resultText.style.color = (wonCoins > 0 || finalRewardStr === "Quà bí ẩn") ? '#ffd700' : '#ff4757';
        resultText.innerText = `🎁 KẾT QUẢ: ${displayResult.toUpperCase()}!`;
        setTimeout(() => { resultText.style.transform = 'scale(1)'; }, 300);

        isSpinning = false;

        // Cập nhật số lượt đã quay (Tăng thêm 1)
        ticketData.spinTracking.count = ticketData.used + 1;
        await db.ref('spin_counts/' + currentUser.username).transaction((currentData) => {
            let count = (currentData && currentData.count) ? currentData.count : 0;
            return { count: count + 1 };
        });

        // Cập nhật lại giao diện số vé để chắc chắn đồng bộ
        if (titleWheel) {
            titleWheel.innerHTML = `🎡 Vòng Quay Nhân Phẩm<br><span style="font-size: 0.5em; color: #ffd700; text-transform: none;">🎫 Vé hiện có: ${ticketData.remaining - 1}</span>`;
        }

        // Cộng Coin
        if (wonCoins > 0) {
            const coinRef = db.ref('student_coins/' + currentUser.username);
            coinRef.transaction((currentCoins) => { return (currentCoins || 0) + wonCoins; });
        }

        // Lưu lịch sử
        const recordNow = new Date();
        await pushDB('spin_history', {
            studentName: currentUser.name, username: currentUser.username, reward: actualRewardRecord,
            time: recordNow.toLocaleTimeString('vi-VN') + ' ' + recordNow.toLocaleDateString('vi-VN'),
            timestamp: recordNow.getTime()
        });

        const quickSpinBtn = document.getElementById('quickSpinBtn');
        if (quickSpinBtn) {
            quickSpinBtn.style.display = (ticketData.remaining - 1) > 1 ? 'block' : 'none';
        }

    }, 4050);
};

window.closeLuckyWheel = function () {
    if (isSpinning) return;
    document.getElementById('luckyWheelModal').classList.remove('active');
    const wheel = document.getElementById('wheelContainer');
    const resultText = document.getElementById('spinResultText');
    if (wheel) { wheel.style.transition = 'none'; wheel.style.transform = `rotate(0deg)`; }
    if (resultText) { resultText.style.opacity = '0'; resultText.style.transform = 'scale(0.8)'; }
};

// ================= HỆ THỐNG QUAY NHIỀU LẦN (GACHA x10, x50) =================
window.spinMultipleWheel = async function () {
    if (window.isGameEnabled === false) {
        alert("🔒 Trò chơi hiện đang bị Giáo viên tạm khóa!");
        return;
    }

    if (isSpinning) return;

    // Lấy số vé hiện có
    const ticketData = await window.calculateTotalTickets();

    if (ticketData.remaining < 2) {
        alert(`⚠️ Bạn cần ít nhất 2 vé để dùng tính năng Quay Nhanh! (Hiện có: ${ticketData.remaining} vé)`);
        return;
    }

    // Xác định số vé tối đa có thể quay (không vượt quá 50)
    let maxSpins = Math.min(ticketData.remaining, 50);

    // Hỏi học sinh muốn quay bao nhiêu lần
    let inputStr = prompt(`⚡ NHẬP SỐ LẦN QUAY NHANH:\n(Bạn đang có ${ticketData.remaining} vé. Có thể quay nhanh tối đa ${maxSpins} lần)`, maxSpins);

    if (inputStr === null) return; // Nhấn Hủy

    let spinsToDo = parseInt(inputStr);
    if (isNaN(spinsToDo) || spinsToDo < 2 || spinsToDo > maxSpins) {
        alert(`❌ Số lượng không hợp lệ! Vui lòng nhập số từ 2 đến ${maxSpins}.`);
        return;
    }

    isSpinning = true;

    const resultText = document.getElementById('spinResultText');
    const titleWheel = document.querySelector('#luckyWheelModal h3');

    // Trừ vé trực quan ngay lập tức
    if (titleWheel) {
        titleWheel.innerHTML = `🎡 Vòng Quay Nhân Phẩm<br><span style="font-size: 0.5em; color: #ffd700; text-transform: none;">🎫 Vé hiện có: ${ticketData.remaining - spinsToDo}</span>`;
    }

    // Hiển thị trạng thái đang xử lý (bỏ qua hiệu ứng quay bánh xe)
    resultText.style.opacity = '1';
    resultText.style.color = '#fff';
    resultText.style.transform = 'scale(1)';
    resultText.innerText = `⚡ Đang xử lý quay ${spinsToDo} lần... 🌀`;

    // Chạy ngầm thuật toán quay y hệt hàm spinWheel gốc
    const cotichItems = (typeof StoreConfig !== 'undefined') ? StoreConfig.items.filter(i => i.tag && i.tag.toLowerCase() === 'cổ tích') : [];

    // TẢI TRỰC TIẾP KHO ĐỒ TỪ DB TRƯỚC KHI BẮT ĐẦU VÒNG LẶP QUAY NHIỀU LẦN
    const invSnap = await db.ref(`student_inventory/${currentUser.username}`).once('value');
    let currentOwned = invSnap.val() ? Object.values(invSnap.val()).map(i => i.id) : [];

    let totalCoinsWon = 0;
    let missCount = 0;
    let newlyWonItems = [];
    let newlyWonItemNames = [];
    let duplicateItemsCount = 0;

    const p = window.wheelProbs || { miss: 50, c100: 20, c150: 25, c500: 4, gift: 1 };

    for (let i = 0; i < spinsToDo; i++) {
        const rand = Math.random() * 100;
        let cumulative = 0;

        if (rand < (cumulative += p.miss)) { missCount++; }
        else if (rand < (cumulative += p.c100)) { totalCoinsWon += 100; }
        else if (rand < (cumulative += p.c150)) { totalCoinsWon += 150; }
        else if (rand < (cumulative += p.c500)) { totalCoinsWon += 500; }
        else {
            // Trúng Quà bí ẩn
            if (cotichItems.length > 0) {
                const randomItem = cotichItems[Math.floor(Math.random() * cotichItems.length)];
                if (currentOwned.includes(randomItem.id)) {
                    totalCoinsWon += 600; // Đền bù 600 Coin
                    duplicateItemsCount++;
                } else {
                    currentOwned.push(randomItem.id);
                    newlyWonItems.push(randomItem);
                    newlyWonItemNames.push(randomItem.name);
                }
            } else {
                totalCoinsWon += 600;
            }
        }
    }

    // Cập nhật Database
    ticketData.spinTracking.count = ticketData.used + spinsToDo;
    await db.ref('spin_counts/' + currentUser.username).transaction((currentData) => {
        let count = (currentData && currentData.count) ? currentData.count : 0;
        return { count: count + spinsToDo };
    });

    if (totalCoinsWon > 0) {
        const coinRef = db.ref('student_coins/' + currentUser.username);
        await coinRef.transaction((currentCoins) => { return (currentCoins || 0) + totalCoinsWon; });
    }

    if (newlyWonItems.length > 0) {
        let updates = {};
        newlyWonItems.forEach(item => {
            updates[`student_inventory/${currentUser.username}/${item.id}`] = {
                id: item.id, purchaseTime: Date.now(), isTrial: null, trialExpiry: null, isEquipped: false
            };
        });
        await db.ref().update(updates);
    }

    let historyStr = `Quay nhanh ${spinsToDo} lần: Trượt ${missCount}, +${totalCoinsWon} Coin`;
    if (duplicateItemsCount > 0) historyStr += ` (Bao gồm ${duplicateItemsCount} trùng lặp)`;
    if (newlyWonItemNames.length > 0) historyStr += `. Nhận VP: ${newlyWonItemNames.join(', ')}`;

    const recordNow = new Date();
    await pushDB('spin_history', {
        studentName: currentUser.name, username: currentUser.username, reward: historyStr,
        time: recordNow.toLocaleTimeString('vi-VN') + ' ' + recordNow.toLocaleDateString('vi-VN'),
        timestamp: recordNow.getTime()
    });

    // Hiển thị kết quả tổng hợp ra màn hình sau 1.5 giây
    setTimeout(() => {
        let displayStr = `🎁 TỔNG KẾT: +${totalCoinsWon.toLocaleString('vi-VN')} Coin`;
        if (newlyWonItemNames.length > 0) displayStr += `\nTrúng VP: ${newlyWonItemNames.join(', ')}`;
        if (missCount === spinsToDo) displayStr = `Đen quá! Trượt cả ${spinsToDo} lần 😢`;

        resultText.style.transform = 'scale(1.1)';
        resultText.style.color = (totalCoinsWon > 0 || newlyWonItems.length > 0) ? '#ffd700' : '#ff4757';
        resultText.innerText = displayStr;

        setTimeout(() => { resultText.style.transform = 'scale(1)'; }, 300);
        isSpinning = false;

        if (typeof studentOwnedItems !== 'undefined' && newlyWonItems.length > 0) {
            newlyWonItems.forEach(item => studentOwnedItems.push(item.id));
        }

        const quickSpinBtn = document.getElementById('quickSpinBtn');
        if (quickSpinBtn) {
            quickSpinBtn.style.display = (ticketData.remaining - spinsToDo) > 1 ? 'block' : 'none';
        }
    }, 1500);
};

// 2. Logic Kéo - Thả (Drag & Drop) Widget
document.addEventListener('DOMContentLoaded', () => {
    const coinWidget = document.getElementById('coinWidget');
    if (!coinWidget) return;

    let isDraggingCoin = false;
    let startX, startY, initialX, initialY;

    // Khôi phục vị trí lưu trước đó (nếu có)
    const savedPos = JSON.parse(localStorage.getItem('coinWidgetPos'));
    if (savedPos) {
        let savedLeft = parseInt(savedPos.left);
        let savedTop = parseInt(savedPos.top);

        // Giới hạn lại tọa độ không cho lọt ra ngoài màn hình
        const maxX = window.innerWidth - coinWidget.offsetWidth;
        const maxY = window.innerHeight - coinWidget.offsetHeight;

        if (savedLeft < 0) savedLeft = 0;
        if (savedTop < 0) savedTop = 0;
        if (savedLeft > maxX) savedLeft = Math.max(0, maxX);
        if (savedTop > maxY) savedTop = Math.max(0, maxY);

        coinWidget.style.bottom = 'auto';
        coinWidget.style.right = 'auto';
        coinWidget.style.left = savedLeft + 'px';
        coinWidget.style.top = savedTop + 'px';
    }

    function handleDragStart(e) {
        isDraggingCoin = true;
        coinWidget.style.cursor = 'grabbing';
        coinWidget.style.transition = 'none'; // Tắt mượt để kéo không bị lag trễ

        if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }

        const rect = coinWidget.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
    }

    function handleDragMove(e) {
        if (!isDraggingCoin) return;
        e.preventDefault(); // Ngăn trình duyệt cuộn trang khi đang kéo widget

        let currentX, currentY;
        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        } else {
            currentX = e.clientX;
            currentY = e.clientY;
        }

        const diffX = currentX - startX;
        const diffY = currentY - startY;

        let newX = initialX + diffX;
        let newY = initialY + diffY;

        // Giới hạn để widget không bị kéo lọt ra ngoài màn hình
        const maxX = window.innerWidth - coinWidget.offsetWidth;
        const maxY = window.innerHeight - coinWidget.offsetHeight;

        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX > maxX) newX = maxX;
        if (newY > maxY) newY = maxY;

        coinWidget.style.bottom = 'auto';
        coinWidget.style.right = 'auto';
        coinWidget.style.left = newX + 'px';
        coinWidget.style.top = newY + 'px';
    }

    function handleDragEnd() {
        if (!isDraggingCoin) return;
        isDraggingCoin = false;
        coinWidget.style.cursor = 'grab';
        coinWidget.style.transition = 'transform 0.1s';

        // Lưu lại tọa độ để lần sau tải trang nó vẫn nằm ở vị trí cũ
        localStorage.setItem('coinWidgetPos', JSON.stringify({
            left: coinWidget.style.left,
            top: coinWidget.style.top
        }));
    }

    // Sự kiện cảm ứng trên Điện thoại
    coinWidget.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    // Sự kiện chuột trên Máy tính
    coinWidget.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
});

// ========================================================
// HỆ THỐNG CỬA HÀNG & TÚI ĐỒ (HỌC SINH) - ĐÃ CHUẨN HÓA
// ========================================================

let studentOwnedItems = [];
let studentEquippedItems = { theme: 'default', effect: '', pet: '' };
let trialItemsList = [];
window.currentStoreFilterType = 'all';

function formatStoreCountdown(ms) {
    if (ms <= 0) return "00 giây";
    let d = Math.floor(ms / (1000 * 60 * 60 * 24));
    let h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    let s = Math.floor((ms % (1000 * 60)) / 1000);
    
    let timeStr = "";
    if (d > 0) timeStr += `${d} ngày `;
    if (h > 0 || d > 0) timeStr += `${h} tiếng `;
    timeStr += `${m} phút ${s} giây`;
    return timeStr.trim();
}

// 1. Hàm lọc và hiển thị vật phẩm ra màn hình (Có kiểm tra Ngày Mở Bán)
window.filterStore = function (type) {
    window.currentStoreFilterType = type;
    const container = document.getElementById('storeItemsContainer');
    if (!container) return;

    // Đổi màu nút tab hiện tại
    const buttons = document.querySelectorAll('#tab-store .btn-approve');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${type}'`)) {
            btn.style.background = '#667eea'; btn.style.color = 'white';
        } else {
            btn.style.background = 'rgba(255,255,255,0.5)'; btn.style.color = '#667eea';
        }
    });

    const items = StoreManager.getItemsByType(type);
    let htmlContent = '';
    const now = new Date().getTime();

    // Dọn dẹp bộ đếm ngược cũ nếu có để tránh bị giật lag khi chuyển Tab
    if (window.storeCountdownInterval) clearInterval(window.storeCountdownInterval);
    let upcomingItems = [];

    items.forEach(item => {
        let isUpcoming = false;

        // KIỂM TRA THỜI HẠN MỞ BÁN
        if (item.startDate && item.endDate) {
            const startT = new Date(item.startDate).getTime();
            const endT = new Date(item.endDate).getTime();

            if (now > endT) return; // Đã quá hạn -> Bỏ qua hẳn không hiện

            if (now < startT) {
                isUpcoming = true; // Chưa tới giờ -> Cắm cờ để hiện đồng hồ đếm ngược
                upcomingItems.push({ id: item.id, startT: startT });
            }
        }

        const isOwned = studentOwnedItems.includes(item.id);
        const isEquipped = studentEquippedItems[item.type] === item.id;
        const isTrial = trialItemsList.includes(item.id);

        // Truyền tham số isUpcoming vào trong (Tham số thứ 5)
        htmlContent += StoreManager.renderStoreItem(item, isOwned, isEquipped, isTrial, isUpcoming);
    });

    container.innerHTML = htmlContent || '<p style="text-align:center; color:#666; grid-column: 1/-1;">Chưa có vật phẩm nào trong danh mục này.</p>';

    // --- KÍCH HOẠT ĐỒNG HỒ ĐẾM NGƯỢC ---
    if (upcomingItems.length > 0) {
        // Cập nhật text ngay lập tức ở Giây thứ 0
        const initialNow = new Date().getTime();
        upcomingItems.forEach(upc => {
            const btn = document.getElementById(`countdown-btn-${upc.id}`);
            if (btn) btn.innerText = `⏳ Mở sau: ${formatStoreCountdown(upc.startT - initialNow)}`;
        });

        // Thiết lập chạy ngầm đếm lùi mỗi 1 giây
        window.storeCountdownInterval = setInterval(() => {
            const currentTime = new Date().getTime();
            let allStarted = true;

            upcomingItems.forEach(upc => {
                const btn = document.getElementById(`countdown-btn-${upc.id}`);
                if (btn) {
                    const diff = upc.startT - currentTime;
                    if (diff <= 0) {
                        btn.innerText = "🔄 Đang mở bán...";
                        // Tự động tải lại cửa hàng khi có 1 món đồ đếm ngược về 0 để mở khóa nút Mua
                        if (allStarted) {
                            window.filterStore(window.currentStoreFilterType);
                        }
                    } else {
                        allStarted = false;
                        btn.innerText = `⏳ Mở sau: ${formatStoreCountdown(diff)}`;
                    }
                }
            });

            // Nếu tất cả vật phẩm đã qua mốc đếm ngược thì dừng vòng lặp Interval
            if (allStarted) clearInterval(window.storeCountdownInterval);
        }, 1000);
    }
};

// 2. Render Cửa hàng & Kiểm tra thời hạn dùng thử 
window.loadStoreItems = async function () {
    studentOwnedItems = ['theme_default'];
    studentEquippedItems = { theme: 'default', effect: '', pet: '' };
    trialItemsList = [];

    const now = Date.now();
    let hasExpiredTrials = false;
    let updates = {};

    if (typeof myInventory !== 'undefined' && Array.isArray(myInventory)) {
        myInventory.forEach(item => {
            if (item.isTrial && item.trialExpiry && now > item.trialExpiry) {
                hasExpiredTrials = true;
                updates[`student_inventory/${currentUser.username}/${item.id}`] = null;

                if (item.isEquipped) {
                    const itemDef = StoreConfig.items.find(i => i.id === item.id);
                    if (itemDef) {
                        if (itemDef.type === 'theme') ThemeManager.applyTheme('default');
                        if (itemDef.type === 'effect') EffectManager.clearEffects();
                        if (itemDef.type === 'pet') {
                            const petContainer = document.getElementById('virtual-pet-container');
                            if (petContainer) petContainer.style.display = 'none';
                        }
                    }
                }
            } else {
                if (!studentOwnedItems.includes(item.id)) studentOwnedItems.push(item.id);
                if (item.isTrial) trialItemsList.push(item.id);
                if (item.isEquipped) {
                    const itemDef = StoreConfig.items.find(i => i.id === item.id);
                    if (itemDef) studentEquippedItems[itemDef.type] = item.id;
                }
            }
        });
    }

    if (hasExpiredTrials) {
        await db.ref().update(updates);
        alert("⏰ Một số vật phẩm dùng thử của bạn đã hết thời gian 24 giờ và bị thu hồi!");
    }

    window.filterStore(window.currentStoreFilterType);
};

// 3. Logic kích hoạt dùng thử 1 Ngày (Nửa giá)
window.trialItem = async function (itemId) {
    const item = StoreManager.getItemById(itemId);
    if (!item) return;
    if (item.isLocked) return alert("🔒 Vật phẩm này hiện đang bị Giáo viên khóa, không thể dùng thử!");
    if (item.isNonCoin && (!item.price || item.price <= 0)) return alert("🚫 Vật phẩm sự kiện không hỗ trợ thử nghiệm!");

    const trialPrice = item.price / 2;
    const coinRef = db.ref('student_coins/' + currentUser.username);
    const snap = await coinRef.once('value');
    let currentCoins = snap.val() || 0;

    if (currentCoins < trialPrice) return alert(`❌ Không đủ Coin! Phí dùng thử yêu cầu ${trialPrice} Coin.`);

    if (confirm(`Bạn sẽ dùng ${trialPrice} Coin để trải nghiệm [ ${item.name} ] trong 24 giờ?\nĐồng ý kích hoạt?`)) {
        await coinRef.set(currentCoins - trialPrice);

        const trialExpiry = Date.now() + (24 * 60 * 60 * 1000);
        await db.ref(`student_inventory/${currentUser.username}/${item.id}`).set({
            id: item.id,
            purchaseTime: Date.now(),
            isEquipped: true,
            isTrial: true,
            trialExpiry: trialExpiry
        });

        // Tự động tháo các đồ cùng loại đang mặc
        const invSnap = await db.ref(`student_inventory/${currentUser.username}`).once('value');
        const inventory = invSnap.val();
        if (inventory) {
            let updates = {};
            for (let key in inventory) {
                if (key !== item.id) {
                    let invItem = inventory[key];
                    const checkTypeItem = StoreConfig.items.find(i => i.id === invItem.id);
                    if (checkTypeItem && checkTypeItem.type === item.type) {
                        updates[`${key}/isEquipped`] = false;
                    }
                }
            }
            if (Object.keys(updates).length > 0) await db.ref(`student_inventory/${currentUser.username}`).update(updates);
        }
        alert(`⏳ Bắt đầu dùng thử [ ${item.name} ]! (Thời hạn: 24 giờ)`);
    }
};

// 4. Logic Mua đứt và Bảng Thanh Toán (Có áp dụng Mã giảm giá)
window.buyItem = async function (itemId, isUpgradingFromTrial = false) {
    const item = StoreManager.getItemById(itemId);
    if (!item) return;
    if (item.isLocked) return alert("🔒 Vật phẩm này hiện đang bị Giáo viên khóa!");
    if (item.isNonCoin && (!item.price || item.price <= 0)) return alert(`🎁 Vật phẩm sự kiện!`);

    const coinRef = db.ref('student_coins/' + currentUser.username);
    const snap = await coinRef.once('value');
    let currentCoins = snap.val() || 0;

    let finalPrice = item.price;
    let isUpgrade = false;
    if (isUpgradingFromTrial) {
        const trialPrice = item.price / 2;
        const refund = trialPrice * 0.3;
        finalPrice = Math.floor(item.price - refund);
        isUpgrade = true;
    }

    const discSnap = await db.ref(`student_discounts/${currentUser.username}`).once('value');
    let discounts = [];
    const now = Date.now();

    if (discSnap.exists()) {
        discSnap.forEach(child => {
            let d = child.val();
            if (!d.isUsed) {
                if (d.expiry && now > d.expiry) {
                    // CỐ TÌNH ĐỂ TRỐNG: Mã giảm giá hết hạn KHÔNG BỊ XÓA nữa để hiển thị trong Túi đồ
                } else {
                    let targetArr = d.targetItem || ['all'];
                    if (typeof targetArr === 'string') targetArr = [targetArr];
                    if (!Array.isArray(targetArr)) targetArr = ['all'];

                    // LƯU TOÀN BỘ THẺ VÀO MẢNG, đánh dấu thẻ nào đủ điều kiện cho món đồ này
                    let isEligible = targetArr.includes('all') || targetArr.includes(itemId);
                    discounts.push({ ...d, _key: child.key, isEligible: isEligible });
                }
            }
        });
    }

    openPaymentModal(item, finalPrice, currentCoins, discounts, isUpgrade);
};

// HÀM HIỂN THỊ GIAO DIỆN BẢNG THANH TOÁN
window.openPaymentModal = function (item, basePrice, currentCoins, discounts, isUpgrade) {
    const oldModal = document.getElementById('checkoutModal');
    if (oldModal) oldModal.remove();

    let discountOptions = `<option value="0">-- Không dùng mã giảm giá --</option>`;
    discounts.forEach(d => {
        let expStr = d.expiry ? ` | HSD: ${new Date(d.expiry).toLocaleDateString('vi-VN')}` : '';

        let targetArr = d.targetItem || ['all'];
        if (!Array.isArray(targetArr)) targetArr = [targetArr];
        const targetStr = targetArr.join(',');

        // CẤU HÌNH GIAO DIỆN CHO THẺ KHÔNG HỢP LỆ
        let eligibleText = d.isEligible ? "" : " 🚫 (Không áp dụng)";
        let colorStyle = d.isEligible ? "" : "color: #999;"; // Làm mờ thẻ không dùng được

        discountOptions += `<option value="${d._key}" data-percent="${d.percent}" data-expiry="${d.expiry || ''}" data-target="${targetStr}" data-eligible="${d.isEligible}" style="${colorStyle}">🏷️ Giảm ${d.percent}%${expStr}${eligibleText}</option>`;
    });

    const modalHtml = `
    <div id="checkoutModal" class="modal-overlay" style="z-index: 999999; display: flex; align-items: center; justify-content: center;">
        <div class="modal-content form-container" style="max-width: 420px; width: 90%; text-align: left; border-top: 6px solid #f39c12; background: #fff; padding: 25px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); animation: fadeInUp 0.3s ease;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #f39c12; margin: 0; font-size: 1.4em; display: flex; align-items: center; gap: 8px;">🛒 Thanh Toán</h3>
                <button onclick="document.getElementById('checkoutModal').remove()" style="background: rgba(225, 29, 72, 0.1); color: #e11d48; border: none; border-radius: 50%; width: 32px; height: 32px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center;">✖</button>
            </div>
            
            <div style="background: rgba(0,0,0,0.03); padding: 15px; border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.05);">
                <p style="margin: 0 0 10px 0; font-size: 1.05em; color: #444;"><strong>Vật phẩm:</strong> <span style="color: #667eea; font-weight: bold;">${item.name}</span> ${isUpgrade ? '<span style="color:#e83e8c; font-size:0.85em;">(Nâng cấp)</span>' : ''}</p>
                <p style="margin: 0; color: #444;"><strong>Số dư của bạn:</strong> <span style="color: #2ecc71; font-weight: bold;">${currentCoins} 🪙</span></p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label style="font-weight: bold; color: #2c3e50; font-size: 0.95em;">🎁 Chọn thẻ giảm giá:</label>
                <button onclick="showSelectedDiscountInfo()" style="background: #e0f7fa; color: #00838f; border: 1px solid #00acc1; border-radius: 50%; width: 26px; height: 26px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.9em; transition: 0.2s;" title="Xem thông tin chi tiết của thẻ">❓</button>
            </div>
            
            <select id="checkoutDiscount" onchange="updateCheckoutPrice(${basePrice})" style="width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 8px; border: 2px dashed #f39c12; font-weight: bold; color: #e83e8c; background: #fdfbfb; outline: none; cursor: pointer;">
                ${discounts.length > 0 ? discountOptions : '<option value="0">Bạn chưa có thẻ giảm giá nào</option>'}
            </select>

            <!-- DÒNG CẢNH BÁO KHI CHỌN MÃ KHÔNG HỢP LỆ -->
            <p id="checkoutDiscountWarning" style="color: #e11d48; font-size: 0.85em; margin: 0 0 15px 0; font-weight: bold; display: none;">⚠️ Thẻ này không áp dụng cho vật phẩm hiện tại. Vẫn tính giá gốc!</p>

            <div style="background: rgba(243, 156, 18, 0.05); padding: 15px; border-radius: 12px; border: 1px solid rgba(243, 156, 18, 0.2); margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 1em; color: #555;">
                    <span>Giá gốc:</span>
                    <span id="checkoutBasePriceDisplay" style="font-weight: bold;">${basePrice} 🪙</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 1em; color: #e11d48; font-weight: bold;">
                    <span>Mã giảm giá:</span>
                    <span id="checkoutDiscountAmount">- 0 🪙</span>
                </div>
                <hr style="border: 0; border-top: 1px dashed rgba(243, 156, 18, 0.4); margin: 10px 0;">
                <div style="text-align: center; margin-top: 10px;">
                    <p style="margin: 0; font-size: 0.9em; color: #666; font-weight: bold; text-transform: uppercase;">Tổng thanh toán</p>
                    <p style="margin: 5px 0 0 0; font-size: 2.2em; font-weight: 900; color: #d35400; text-shadow: 0 2px 4px rgba(0,0,0,0.1);" id="checkoutFinalPrice">${basePrice} 🪙</p>
                </div>
            </div>

            <button id="btnConfirmCheckout" onclick="processPayment('${item.id}', ${basePrice}, ${currentCoins})" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white; border: none; border-radius: 12px; font-weight: 900; font-size: 1.1em; cursor: pointer; box-shadow: 0 4px 15px rgba(246, 211, 101, 0.4); text-transform: uppercase; transition: all 0.2s;">💳 Xác nhận mua</button>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

// HÀM TÍNH TOÁN LẠI GIÁ TIỀN KHI CHỌN MÃ GIẢM GIÁ KHÁC NHAU
window.updateCheckoutPrice = function (basePrice) {
    const select = document.getElementById('checkoutDiscount');
    const warningText = document.getElementById('checkoutDiscountWarning');
    let percent = 0;

    if (select.selectedIndex > 0 && select.value !== "0") {
        const option = select.options[select.selectedIndex];
        const isEligible = option.getAttribute('data-eligible') === 'true'; // Đọc cờ

        if (isEligible) {
            percent = parseInt(option.getAttribute('data-percent')) || 0;
            warningText.style.display = 'none'; // Đủ điều kiện -> Ẩn cảnh báo
        } else {
            percent = 0; // Không đủ điều kiện -> Ép mức giảm về 0%
            warningText.style.display = 'block'; // Hiện cảnh báo đỏ
        }
    } else {
        warningText.style.display = 'none'; // Ẩn cảnh báo nếu chọn "Không dùng mã"
    }

    const discountAmount = Math.floor(basePrice * (percent / 100));
    const finalPrice = Math.max(0, basePrice - discountAmount);

    document.getElementById('checkoutDiscountAmount').innerText = `- ${discountAmount} 🪙`;
    document.getElementById('checkoutFinalPrice').innerText = finalPrice + ' 🪙';

    const basePriceDisplay = document.getElementById('checkoutBasePriceDisplay');
    if (percent > 0) {
        basePriceDisplay.style.textDecoration = 'line-through';
        basePriceDisplay.style.color = '#999';
    } else {
        basePriceDisplay.style.textDecoration = 'none';
        basePriceDisplay.style.color = '#555';
    }
};

// HÀM XỬ LÝ THANH TOÁN CUỐI CÙNG LÊN FIREBASE
window.processPayment = async function (itemId, basePrice, currentCoins) {
    const btn = document.getElementById('btnConfirmCheckout');
    btn.disabled = true;
    btn.innerText = 'Đang xử lý giao dịch...';

    const select = document.getElementById('checkoutDiscount');
    let discountKey = null;
    let percent = 0;

    if (select && select.selectedIndex > 0 && select.value !== "0") {
        const option = select.options[select.selectedIndex];
        const isEligible = option.getAttribute('data-eligible') === 'true';

        // CHẶN THANH TOÁN NẾU CỐ TÌNH DÙNG THẺ SAI
        if (!isEligible) {
            alert("❌ Thẻ giảm giá bạn chọn không đủ điều kiện cho vật phẩm này! Vui lòng chọn thẻ khác hoặc chuyển về 'Không dùng mã giảm giá'.");
            btn.disabled = false;
            btn.innerText = '💳 Xác nhận mua';
            return;
        }

        discountKey = select.value;
        percent = parseInt(option.getAttribute('data-percent')) || 0;
    }

    const finalPrice = Math.max(0, Math.floor(basePrice * (1 - percent / 100)));

    if (currentCoins < finalPrice) {
        alert(`❌ Bạn không đủ Coin! Tổng tiền cần thanh toán là ${finalPrice} 🪙.`);
        btn.disabled = false;
        btn.innerText = '💳 Xác nhận mua';
        return;
    }

    try {
        await db.ref('student_coins/' + currentUser.username).set(currentCoins - finalPrice);

        if (discountKey) {
            await db.ref(`student_discounts/${currentUser.username}/${discountKey}`).update({
                isUsed: true,
                usedAt: Date.now()
            });
        }

        await db.ref(`student_inventory/${currentUser.username}/${itemId}`).update({
            id: itemId,
            purchaseTime: Date.now(),
            isTrial: null,
            trialExpiry: null,
            isEquipped: true
        });

        document.getElementById('checkoutModal').remove();
        alert(`🎉 Mua thành công! Bạn đã thanh toán ${finalPrice} 🪙.`);

    } catch (e) {
        alert("❌ Đã xảy ra lỗi khi thanh toán. Vui lòng kiểm tra lại mạng!");
        btn.disabled = false;
        btn.innerText = '💳 Xác nhận mua';
    }
};

// 5. Kết nối logic SỬ DỤNG vật phẩm
StoreManager.applyItem = async function (itemId) {
    const item = StoreManager.getItemById(itemId);
    if (!item) return;

    // Lưu trạng thái lên Firebase (Hàm on('value') sẽ tự động gọi applyEquippedItems bên dưới để tạo hiệu ứng)
    const invSnap = await db.ref(`student_inventory/${currentUser.username}`).once('value');
    const inventory = invSnap.val();
    if (inventory) {
        let updates = {};
        for (let key in inventory) {
            let invItem = inventory[key];
            const checkTypeItem = StoreConfig.items.find(i => i.id === invItem.id);
            if (checkTypeItem && checkTypeItem.type === item.type) {
                updates[`${key}/isEquipped`] = (invItem.id === itemId);
            }
        }
        await db.ref(`student_inventory/${currentUser.username}`).update(updates);
    }
};

// 5.5 Kết nối logic THÁO vật phẩm (Gỡ trang bị)
StoreManager.unapplyItem = async function (itemId) {
    const item = StoreManager.getItemById(itemId);
    if (!item) return;

    // 1. Tắt giao diện lập tức (Trả về mặc định)
    if (item.type === 'theme') {
        // FIX KẸT GIAO DIỆN: Ép xóa đích danh class CSS của theme đang tháo
        if (item.value) document.body.classList.remove(item.value);
        ThemeManager.applyTheme('default');
    }
    if (item.type === 'effect') EffectManager.clearEffects();
    if (item.type === 'pet') {
        const petContainer = document.getElementById('virtual-pet-container');
        if (petContainer) petContainer.style.display = 'none';

        // Dọn dẹp vòng lặp thú cưng để tránh lỗi "ké" tương tác khi tháo
        if (typeof PetInteractionManager !== 'undefined' && PetInteractionManager.loopInterval) {
            clearInterval(PetInteractionManager.loopInterval);
            PetInteractionManager.loopInterval = null;
            PetInteractionManager.setSleepState(false);
        }
    }

    // 2. Lưu trạng thái "Đã tháo" lên Firebase
    const invSnap = await db.ref(`student_inventory/${currentUser.username}`).once('value');
    const inventory = invSnap.val();
    if (inventory) {
        let updates = {};
        for (let key in inventory) {
            if (inventory[key].id === itemId) {
                updates[`${key}/isEquipped`] = false;
            }
        }
        await db.ref(`student_inventory/${currentUser.username}`).update(updates);
    }
};

// 6. Cập nhật giao diện UI & Hiệu ứng (Mỗi khi tải trang hoặc kho đồ thay đổi)
window.applyEquippedItems = function () {
    // Reset hiệu ứng và thú cưng về trống trước khi mặc đồ mới
    document.getElementById('global-effect-container').innerHTML = '';
    const petContainer = document.getElementById('virtual-pet-container');
    if (petContainer) petContainer.style.display = 'none';

    if (typeof myInventory !== 'undefined' && Array.isArray(myInventory)) {
        myInventory.forEach(invItem => {
            if (invItem.isEquipped) {
                const itemDef = StoreConfig.items.find(i => i.id === invItem.id);
                if (itemDef) {
                    if (itemDef.type === 'theme') ThemeManager.applyTheme(itemDef.id);
                    else if (itemDef.type === 'effect') EffectManager.applyEffect(itemDef.id);
                    else if (itemDef.type === 'pet') PetManager.spawnPet(itemDef);
                }
            }
        });
    }
};

window.renderStudentSurvey = function (surveyData) {
    document.getElementById('studentSurveyTitle').innerText = surveyData.title || 'Khảo sát';
    const body = document.getElementById('studentSurveyBody');
    body.innerHTML = '';

    const questions = surveyData.questions || [];
    questions.forEach((q, idx) => {
        const div = document.createElement('div');
        div.className = 'survey-answer-block';
        div.dataset.qid = q.id;
        div.style.cssText = 'background: rgba(0,0,0,0.03); padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.05);';

        let html = `<p style="margin: 0 0 10px 0; font-weight: bold; color: #2c3e50;">Câu ${idx + 1}: ${q.text}</p>`;

        if (q.type === 'mc') {
            const opts = q.options || [];
            opts.forEach(opt => {
                html += `
                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; cursor: pointer; background: white; padding: 8px 12px; border-radius: 8px;">
                    <input type="radio" name="ans_${q.id}" value="${opt}" onchange="checkSurveyCompletion()" style="width: auto; margin: 0;"> 
                    <span>${opt}</span>
                </label>`;
            });
        } else {
            html += `<textarea id="ans_${q.id}" placeholder="Nhập câu trả lời của bạn..." rows="3" onkeyup="checkSurveyCompletion()" style="width: 100%; padding: 10px; background: white; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);"></textarea>`;
        }
        div.innerHTML = html;
        body.appendChild(div);
    });

    document.getElementById('btnSubmitSurvey').style.display = 'none';
    document.getElementById('surveyAlertMsg').style.display = 'block';
    document.getElementById('studentSurveyModal').classList.add('active');
};

// Hàm tự động quét xem học sinh đã điền đủ chưa
window.checkSurveyCompletion = function () {
    if (!window.currentActiveSurvey) return;

    let isComplete = true;
    const questions = window.currentActiveSurvey.questions || [];

    questions.forEach(q => {
        if (q.type === 'mc') {
            const checked = document.querySelector(`input[name="ans_${q.id}"]:checked`);
            if (!checked) isComplete = false;
        } else {
            const txtEl = document.getElementById(`ans_${q.id}`);
            if (!txtEl || !txtEl.value.trim()) isComplete = false;
        }
    });

    const btn = document.getElementById('btnSubmitSurvey');
    const alertMsg = document.getElementById('surveyAlertMsg');

    if (isComplete) {
        btn.style.display = 'block';
        alertMsg.style.display = 'none';
    } else {
        btn.style.display = 'none';
        alertMsg.style.display = 'block';
    }
};

window.submitSurvey = async function () {
    if (!window.currentActiveSurvey) return;

    const btn = document.getElementById('btnSubmitSurvey');
    btn.disabled = true;
    btn.innerText = "⏳ Đang gửi dữ liệu cho Giáo viên...";
    btn.style.opacity = '0.7';

    // Thu thập câu trả lời
    let responses = {};
    window.currentActiveSurvey.questions.forEach(q => {
        if (q.type === 'mc') {
            responses[q.id] = document.querySelector(`input[name="ans_${q.id}"]:checked`).value;
        } else {
            responses[q.id] = document.getElementById(`ans_${q.id}`).value.trim();
        }
    });

    // Tạo hiệu ứng mất 1 lúc mới đóng (1.5 giây mô phỏng độ trễ truyền tải)
    setTimeout(async () => {
        // Đẩy lên Firebase
        await db.ref(`global_surveys/${window.currentActiveSurvey._fbKey}/answers/${currentUser.username}`).set({
            studentName: currentUser.name,
            responses: responses,
            timestamp: new Date().toLocaleString('vi-VN')
        });

        // Tắt Modal và reset trạng thái nút
        document.getElementById('studentSurveyModal').classList.remove('active');
        btn.disabled = false;
        btn.innerText = "📤 Gửi câu trả lời & Thoát X";
        btn.style.opacity = '1';
        window.currentActiveSurvey = null; // Dọn dẹp
    }, 1500);
};

// Render lộ trình cá nhân của học sinh đang đăng nhập
async function renderStudentRoadmap() {
    const body = document.getElementById('studentRoadmapBody');
    if (!body) return;
    body.innerHTML = '';

    const assignments = await getDB('assignments');
    const submissions = await getDB('submissions');

    // KIỂM TRA TRẠNG THÁI THAM GIA LỘ TRÌNH CỦA HỌC SINH
    const isParticipating = currentUser.isParticipatingRoadmap !== false;

    // ẨN/HIỆN TIÊU ĐỀ CỘT TRONG THEAD CỦA HỌC SINH
    const table = body.parentElement;
    if (table) {
        const ths = table.querySelectorAll('thead th');
        ths.forEach(th => {
            if (th.innerText.includes('Cộng tiền') || th.innerText.includes('Điều kiện cụ thể')) {
                th.style.display = isParticipating ? '' : 'none';
            }
        });
    }

    // ẨN/HIỆN BẢNG TỔNG TIỀN TÍCH LŨY TRÊN CÙNG
    const totalMoneyCard = document.getElementById('totalRoadmapMoney')?.closest('.card');
    if (totalMoneyCard) {
        totalMoneyCard.style.display = isParticipating ? 'flex' : 'none';
    }

    // Lọc bài học được giao cho "Tất cả" hoặc giao riêng cho chính học sinh này
    const myAssignments = assignments.filter(assign => assign.targetStudent === 'all' || assign.targetStudent === currentUser.username);
    // Sắp xếp bài tập thông minh theo số đếm trong Tiêu đề (VD: Bài 1 -> Bài 2 -> Bài 10)
    const sortedAssignments = [...myAssignments].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi-VN', { numeric: true, sensitivity: 'base' }));

    if (sortedAssignments.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="padding:15px; text-align:center; color:#666; font-style:italic;">Chưa có dữ liệu lộ trình học tập.</td></tr>`;
        if (document.getElementById('totalRoadmapMoney')) document.getElementById('totalRoadmapMoney').innerText = '0';
        return;
    }

    let totalMoney = 0; // Biến lưu tổng số tiền tích lũy

    sortedAssignments.forEach(assign => {
        // Lấy điểm chuẩn riêng của từng bài do Giáo viên đã thiết lập
        const passingGrade = assign.passingGrade || 7;

        const sub = submissions.find(s => s.assignmentId === assign.id && s.studentUsername === currentUser.username);

        let studentScore = '-';
        let statusText = 'Chưa nộp';
        let statusClass = 'status-pending';
        let cellBgStyle = '';

        // Đưa việc khai báo tiền lên trước để có thể ghi đè nếu học sinh bị loại do nộp trễ hoặc điểm thấp
        let moneyVal = assign.roadmapMoney ? parseInt(assign.roadmapMoney).toLocaleString('vi-VN') + ' đ' : '-';
        let currentItemMoney = assign.roadmapMoney ? parseInt(assign.roadmapMoney) : 0;

        if (sub) {
            // KIỂM TRA XEM CÓ ĐƯỢC GIÁO VIÊN THA ĐIỂM THẤP/NỘP TRỄ KHÔNG
            if (sub.forcePass) {
                statusText = 'Đạt';
                statusClass = 'status-done';
                cellBgStyle = 'background: rgba(16, 185, 129, 0.25) !important; color: #047857; font-weight: bold; border-radius: 8px;';
                studentScore = (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') ? parseFloat(sub.grade) : '0';
                totalMoney += currentItemMoney; // Được tha điểm thấp -> Cộng tiền tích lũy
            }
            // ƯU TIÊN KIỂM TRA NỘP TRỄ TRƯỚC
            else if (sub.isAutoSubmitted || sub.isLateFail) {
                statusText = 'Loại';
                statusClass = 'status-pending';
                cellBgStyle = 'background: rgba(225, 29, 72, 0.2) !important; color: #b91c1c; font-weight: bold; border-radius: 8px;';
                studentScore = (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') ? parseFloat(sub.grade) : '0';
                moneyVal = '0 đ'; // Ép tiền thưởng về 0 đ
            }
            else if (sub.isRegrading) {
                statusText = 'Chấm lại';
                statusClass = 'status-pending';
                studentScore = '🔄';
            } else if (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') {
                studentScore = parseFloat(sub.grade);

                // So sánh với điểm chuẩn riêng của bài
                if (studentScore >= passingGrade) {
                    statusText = 'Đạt';
                    statusClass = 'status-done';
                    cellBgStyle = 'background: rgba(16, 185, 129, 0.25) !important; color: #047857; font-weight: bold; border-radius: 8px;';
                    totalMoney += currentItemMoney; // Đủ điểm chuẩn đạt -> Cộng tiền tích lũy
                } else {
                    statusText = 'Loại';
                    statusClass = 'status-pending';
                    cellBgStyle = 'background: rgba(225, 29, 72, 0.2) !important; color: #b91c1c; font-weight: bold; border-radius: 8px;';
                    moneyVal = '0 đ'; // Ép tiền thưởng về 0 đ do điểm thấp hơn điểm chuẩn bài học
                }
            } else {
                statusText = 'Chưa chấm';
            }
        }

        const conditionVal = assign.roadmapCondition || '-';

        // CHUẨN BỊ NỘI DUNG 2 CỘT ẨN/HIỆN
        let moneyCellHtml = isParticipating ? `<td style="padding:12px; text-align: center; ${cellBgStyle}"><strong>${moneyVal}</strong></td>` : '';
        let condCellHtml = isParticipating ? `<td style="padding:12px; color:#2c3e50; font-weight: 600;">${conditionVal}</td>` : '';

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
        tr.innerHTML = `
            <td style="padding:12px;"><strong>${assign.title}</strong></td>
            <td style="padding:12px; text-align: center;"><strong>${studentScore}</strong></td>
            <td style="padding:12px; text-align: center;"><span class="${statusClass}">${statusText}</span></td>
            ${moneyCellHtml}
            <td style="padding:12px; font-size:0.85em; color:#555; white-space: nowrap;">${assign.endDate}</td>
            ${condCellHtml}
        `;
        body.appendChild(tr);
    });

    // FETCH SỐ TIỀN BÙ TRỪ SAU KHI QUY ĐỔI COIN (OFFSET)
    const offsetSnap = await db.ref('student_money_offset/' + currentUser.username).once('value');
    let moneyOffset = offsetSnap.val() || 0;

    // Tổng tiền cuối cùng = Tiền làm bài + Tiền bán Coin - Tiền mua Coin
    let finalMoney = totalMoney + moneyOffset;
    if (finalMoney < 0) finalMoney = 0; // Chặn về âm

    // Cập nhật hiển thị số tiền cuối cùng lên ô tổng
    const totalMoneyEl = document.getElementById('totalRoadmapMoney');
    if (totalMoneyEl) {
        totalMoneyEl.innerText = finalMoney.toLocaleString('vi-VN');
    }
}

// ================= HÀM ĐÓNG / MỞ VÀ XỬ LÝ QUY ĐỔI COIN ĐỘNG =================
window.currentConvertDir = 'M2C'; // Mặc định là Tiền đổi sang Coin

window.openCoinConversionModal = function () {
    // THÊM ĐOẠN CHẶN NÀY
    if (window.isConversionEnabled === false) {
        alert("🔒 Chức năng Bảng quy đổi hiện đang bị Giáo viên tạm khóa!");
        return;
    }

    if (window.currentActiveExamId) {
        window.showExamLockWarning("⚠️ Bảng quy đổi Coin tạm khóa khi thi!");
        return;
    }
    document.getElementById('convertAmount').value = '';
    document.getElementById('convertResult').value = '';
    setConvertDir('M2C'); // Reset về mặc định
    document.getElementById('coinConversionModal').classList.add('active');
    window.initCashWithdrawInterface();
};

window.closeCoinConversionModal = function () {
    document.getElementById('coinConversionModal').classList.remove('active');
};

// Đổi giao diện và chế độ tùy theo hướng mũi tên
window.setConvertDir = function (dir) {
    window.currentConvertDir = dir;
    const btnM2C = document.getElementById('btnDirM2C');
    const btnC2M = document.getElementById('btnDirC2M');
    const lblSource = document.getElementById('lblConvertSource');
    const lblTarget = document.getElementById('lblConvertTarget');
    const limitText = document.getElementById('convertLimitText');
    const resultInput = document.getElementById('convertResult');

    if (dir === 'M2C') {
        btnM2C.style.background = '#059669'; btnM2C.style.color = 'white'; btnM2C.style.border = 'none';
        btnC2M.style.background = 'transparent'; btnC2M.style.color = '#d35400'; btnC2M.style.border = '2px solid #d35400';

        lblSource.innerText = 'Tiền Lộ Trình (đ):'; lblTarget.innerText = 'Nhận được (Coin):';
        limitText.style.display = 'none'; resultInput.style.color = '#059669';
    } else {
        btnC2M.style.background = '#d35400'; btnC2M.style.color = 'white'; btnC2M.style.border = 'none';
        btnM2C.style.background = 'transparent'; btnM2C.style.color = '#059669'; btnM2C.style.border = '2px solid #059669';

        lblSource.innerText = 'Số dư Coin (🪙):'; lblTarget.innerText = 'Nhận được (đ):';
        limitText.style.display = 'block'; resultInput.style.color = '#d35400';
    }
    updateConvertPreview();
};

// Đồng bộ hóa 2 ô nhập liệu
window.updateConvertPreview = function () {
    const amount = document.getElementById('convertAmount').value;
    document.getElementById('convertResult').value = amount ? amount : '';
};

// Thực thi giao dịch với cơ sở dữ liệu
window.executeConversion = async function () {
    const amountInput = document.getElementById('convertAmount');
    const amount = parseInt(amountInput.value);

    if (isNaN(amount) || amount <= 0) return alert("⚠️ Vui lòng nhập số lượng hợp lệ!");

    // 1. Lấy dữ liệu Coin hiện tại
    const coinSnap = await db.ref('student_coins/' + currentUser.username).once('value');
    let currentCoins = coinSnap.val() || 0;

    // 2. Tính dữ liệu Tiền Lộ Trình Gốc (Theo điểm)
    let baseRoadmapMoney = 0;
    const assignments = await getDB('assignments');
    const submissions = await getDB('submissions');
    const myAssignments = assignments.filter(assign => assign.targetStudent === 'all' || assign.targetStudent === currentUser.username);

    myAssignments.forEach(assign => {
        const passingGrade = assign.passingGrade || 7;
        const sub = submissions.find(s => s.assignmentId === assign.id && s.studentUsername === currentUser.username);
        let currentItemMoney = assign.roadmapMoney ? parseInt(assign.roadmapMoney) : 0;

        if (sub) {
            if (sub.forcePass) baseRoadmapMoney += currentItemMoney;
            else if (!sub.isAutoSubmitted && !sub.isLateFail && !sub.isRegrading && sub.grade !== null && sub.grade !== '') {
                if (parseFloat(sub.grade) >= passingGrade) baseRoadmapMoney += currentItemMoney;
            }
        }
    });

    // 3. Lấy biến động tiền do lịch sử quy đổi trước đây (Offset)
    const offsetSnap = await db.ref('student_money_offset/' + currentUser.username).once('value');
    let currentOffset = offsetSnap.val() || 0;

    let currentMoney = baseRoadmapMoney + currentOffset;
    if (currentMoney < 0) currentMoney = 0;

    // 4. Kiểm tra giới hạn và Xử lý cộng/trừ DB
    if (window.currentConvertDir === 'M2C') {
        // Đổi TIỀN LỘ TRÌNH lấy COIN
        if (amount > currentMoney) return alert(`❌ Không đủ tiền lộ trình! Bạn chỉ có tối đa ${currentMoney.toLocaleString('vi-VN')} đ để đổi.`);

        await db.ref('student_coins/' + currentUser.username).set(currentCoins + amount);
        await db.ref('student_money_offset/' + currentUser.username).set(currentOffset - amount);
        alert(`✅ Quy đổi thành công!\nBạn đã dùng ${amount.toLocaleString('vi-VN')} đ để nhận lại ${amount.toLocaleString('vi-VN')} Coin 🪙.`);

    } else {
        // Đổi COIN lấy TIỀN LỘ TRÌNH
        if (amount > currentCoins) return alert(`❌ Không đủ Coin! Bạn chỉ có ${currentCoins.toLocaleString('vi-VN')} Coin.`);
        if (amount > 500) return alert(`❌ Vượt quá giới hạn! Mỗi lần chỉ được đổi tối đa 500 Coin sang Tiền lộ trình.`);

        await db.ref('student_coins/' + currentUser.username).set(currentCoins - amount);
        await db.ref('student_money_offset/' + currentUser.username).set(currentOffset + amount);
        alert(`✅ Quy đổi thành công!\nBạn đã dùng ${amount.toLocaleString('vi-VN')} Coin 🪙 để nhận lại ${amount.toLocaleString('vi-VN')} đ.`);
    }

    // 5. Cập nhật và đóng giao diện
    closeCoinConversionModal();
    renderStudentRoadmap(); // Render lại bảng để tiền nhảy về số dư mới ngay lập tức
};

// Hàm tải lịch sử yêu cầu rút tiền của học sinh
async function loadCashRequestsStudent() {
    const requests = await getDB('cash_requests');
    // Lọc ra các yêu cầu của học sinh hiện tại
    const myRequests = requests.filter(r => r.studentName === currentUser.name);

    let html = '';
    myRequests.reverse().forEach(req => {
        let statusText = '';
        let noteText = '';

        switch (req.status) {
            case 'pending':
                statusText = '<span style="color: #f39c12; font-weight: bold;">⏳ Đang chờ duyệt</span>';
                break;
            case 'transferring':
                statusText = '<span style="color: #2980b9; font-weight: bold;">🔄 Đang chuyển</span>';
                noteText = '<div style="font-size: 0.85em; color: #7f8c8d; margin-top: 5px;"><i>(Tiền sẽ được chuyển đến trong 2-3 ngày)</i></div>';
                break;
            case 'completed':
                statusText = '<span style="color: #27ae60; font-weight: bold;">✅ Đã hoàn tất yêu cầu</span>';
                break;
            case 'rejected':
                statusText = '<span style="color: #c0392b; font-weight: bold;">❌ Bị từ chối</span>';
                break;
        }

        html += `
            <div style="background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                <div><strong>Số tiền:</strong> ${req.amount.toLocaleString()} VNĐ</div>
                <div><strong>Trạng thái:</strong> ${statusText}</div>
                ${noteText}
            </div>
        `;
    });

    document.getElementById('studentRequestHistory').innerHTML = html || '<p style="color: #999;">Chưa có yêu cầu nào.</p>';
}

// Hàm gửi yêu cầu rút tiền
async function submitCashRequest() {
    const amountInput = document.getElementById('withdrawAmount');
    const amount = parseInt(amountInput.value);

    // Lưu ý: Thay 'currentUser.routeMoney' bằng biến/trường lưu "Tổng tiền tích lũy lộ trình" thực tế trong data của bạn
    const currentMoney = currentUser.routeMoney || 0;

    if (!amount || amount <= 0) {
        alert("Vui lòng nhập số tiền hợp lệ!");
        return;
    }

    if (amount > currentMoney) {
        alert("Số tiền vượt quá Tổng tiền tích lũy lộ trình hiện có!");
        return;
    }

    // Gửi lên Firebase
    await pushDB('cash_requests', {
        studentName: currentUser.name,
        amount: amount,
        status: 'pending', // Trạng thái mặc định ban đầu
        timestamp: Date.now()
    });

    // Chạy hàm load khi mở bảng quy đổi
    loadCashRequestsStudent(); currentUser.routeMoney -= amount;
    updateDB('users', currentUser._fbKey, { routeMoney: currentUser.routeMoney });

    alert("Gửi yêu cầu thành công! Vui lòng chờ giáo viên xác nhận.");
    amountInput.value = '';
    loadCashRequestsStudent();
}

// Chạy hàm load khi mở bảng quy đổi
// loadCashRequestsStudent();

// ================= HỆ THỐNG HỘP THƯ & NHẬN QUÀ (HỌC SINH) =================

window.openStudentInbox = function () {
    if (window.currentActiveExamId) {
        window.showExamLockWarning("⚠️ Hộp thư tạm khóa khi đang thi!");
        return;
    }
    renderStudentInbox();
    document.getElementById('studentInboxModal').classList.add('active');
};

window.closeStudentInbox = function () {
    document.getElementById('studentInboxModal').classList.remove('active');
};

window.renderStudentInbox = function () {
    const container = document.getElementById('studentInboxBody');
    if (!window.myInboxMessages || window.myInboxMessages.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 30px 10px; color: #666;"><span style="font-size:3em; display:block; margin-bottom:10px;">📭</span>Chưa có thư mới nào.</div>';
        return;
    }

    let html = '';
    const now = Date.now();

    window.myInboxMessages.forEach(msg => {
        let giftHTML = '';
        let btnHTML = '';
        let isExpiredDiscountInInbox = (msg.giftType === 'discount' && msg.discountExpiry && now > msg.discountExpiry);

        if (msg.giftType !== 'none') {
            let giftDisplay = '';
            if (msg.giftType === 'coin') giftDisplay = `🪙 ${parseInt(msg.giftValue).toLocaleString('vi-VN')} Coin`;
            else if (msg.giftType === 'money') giftDisplay = `💵 ${parseInt(msg.giftValue).toLocaleString('vi-VN')} đ (Tiền Lộ trình)`;
            else if (msg.giftType === 'ticket') giftDisplay = `🎫 ${parseInt(msg.giftValue).toLocaleString('vi-VN')} Vé quay may mắn`;
            else if (msg.giftType === 'discount') {
                let expStr = msg.discountExpiry ? `\n(HSD: ${new Date(msg.discountExpiry).toLocaleString('vi-VN')})` : ' (Vĩnh viễn)';

                // XỬ LÝ ĐỌC DANH SÁCH MẢNG VẬT PHẨM
                let targetText = "Tất cả Cửa hàng";
                let targetArr = msg.discountTargetItem || ['all'];
                if (!Array.isArray(targetArr)) targetArr = [targetArr]; // Cứu code cũ

                if (!targetArr.includes('all')) {
                    const itemNames = targetArr.map(id => {
                        const def = StoreConfig.items.find(i => i.id === id);
                        return def ? def.name : null;
                    }).filter(n => n);

                    // Rút gọn chữ nếu giáo viên chọn quá nhiều món
                    if (itemNames.length > 0) {
                        targetText = itemNames.length > 2 ? `${itemNames.slice(0, 2).join(', ')}... (+${itemNames.length - 2} món nữa)` : itemNames.join(', ');
                    }
                }

                if (isExpiredDiscountInInbox) {
                    giftDisplay = `<span style="text-decoration: line-through; color: #999;">🏷️ Thẻ giảm giá ${msg.giftValue}%</span> <span style="font-size: 0.8em; color: #e11d48; font-weight: bold;">\n(Đã quá hạn)</span>`;
                } else {
                    giftDisplay = `🏷️ Thẻ giảm giá ${msg.giftValue}% <span style="font-size: 0.8em; color: #e11d48;">${expStr}</span><br><span style="font-size: 0.85em; color: #059669; font-weight: normal;">Áp dụng: ${targetText}</span>`;
                }
            }
            else if (msg.giftType === 'item') {
                const itemDef = StoreConfig.items.find(i => i.id === msg.giftValue);
                giftDisplay = itemDef ? `📦 ${itemDef.name} (${itemDef.type})` : '📦 Vật phẩm bí ẩn';
            }

            giftHTML = `<div style="background: rgba(246, 211, 101, 0.2); border: 1px dashed #d35400; padding: 10px; border-radius: 8px; margin: 10px 0;">
                <strong style="color: #d35400;">🎁 Đính kèm quà tặng:</strong><br>
                <span style="font-size: 1.1em; font-weight: bold; color: #2c3e50;">${giftDisplay}</span>
            </div>`;

            if (isExpiredDiscountInInbox) {
                btnHTML = `<button onclick="deleteMessage('${msg._fbKey}')" style="background: rgba(225, 29, 72, 0.1); color: #e11d48; width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; border: 1px solid #e11d48; cursor: pointer;">🗑️ Thẻ đã hết hạn (Xóa thư)</button>`;
            } else {
                btnHTML = `<button onclick="claimGift('${msg._fbKey}', '${msg.giftType}', '${msg.giftValue}')" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; border: none; color: white; cursor: pointer; box-shadow: 0 4px 10px rgba(17, 153, 142, 0.3);">🧧 Mở quà & Nhận vào túi</button>`;
            }
        } else {
            btnHTML = `<button onclick="deleteMessage('${msg._fbKey}')" style="background: rgba(0,0,0,0.05); color: #666; width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; border: none; cursor: pointer;">🗑️ Đã đọc & Xóa thư</button>`;
        }

        html += `<div class="glass-alert" style="margin-bottom: 15px; border-left-color: #3b82f6; padding: 15px;">
            <p style="margin: 0 0 10px 0; font-size: 0.85em; color: #888;">🕒 Gửi lúc: ${msg.timeString}</p>
            ${msg.message ? `<p style="margin: 0 0 10px 0; font-weight: 600; color: #2c3e50; white-space: pre-wrap;">"${msg.message}"</p>` : ''}
            ${giftHTML}
            ${btnHTML}
        </div>`;
    });
    container.innerHTML = html;
};

window.claimGift = async function (msgKey, giftType, giftValue) {
    try {
        if (giftType === 'coin') {
            const coinRef = db.ref('student_coins/' + currentUser.username);
            const snap = await coinRef.once('value');
            await coinRef.set((snap.val() || 0) + parseInt(giftValue));
            alert(`🎉 Bạn đã nhận được ${parseInt(giftValue).toLocaleString('vi-VN')} Coin!`);
        } else if (giftType === 'money') {
            const offsetRef = db.ref('student_money_offset/' + currentUser.username);
            const snap = await offsetRef.once('value');
            await offsetRef.set((snap.val() || 0) + parseInt(giftValue));
            alert(`🎉 Bạn đã nhận được ${parseInt(giftValue).toLocaleString('vi-VN')} đ vào Tiền Lộ trình!`);
            if (typeof renderStudentRoadmap === 'function') renderStudentRoadmap();
        } else if (giftType === 'ticket') {
            const ticketRef = db.ref('student_bonus_tickets/' + currentUser.username);
            const snap = await ticketRef.once('value');
            await ticketRef.set((snap.val() || 0) + parseInt(giftValue));
            alert(`🎉 Bạn đã nhận được ${parseInt(giftValue)} Vé quay may mắn!`);
        } else if (giftType === 'item') {
            await db.ref(`student_inventory/${currentUser.username}/${giftValue}`).update({
                id: giftValue, purchaseTime: Date.now(), isTrial: null, trialExpiry: null, isEquipped: false
            });
            alert(`🎉 Vật phẩm đã được thêm vào Túi đồ của bạn!`);
        } else if (giftType === 'discount') {
            const msgSnap = await db.ref(`inbox_messages/${currentUser.username}/${msgKey}`).once('value');
            const msgData = msgSnap.val();
            const expiry = (msgData && msgData.discountExpiry) ? msgData.discountExpiry : null;

            // Xử lý đọc dạng mảng
            let targetArr = (msgData && msgData.discountTargetItem) ? msgData.discountTargetItem : ['all'];
            if (!Array.isArray(targetArr)) targetArr = [targetArr];

            if (expiry && Date.now() > expiry) {
                alert("❌ Thẻ giảm giá này đã quá hạn sử dụng, hệ thống không thể thêm vào túi đồ!");
                await db.ref(`inbox_messages/${currentUser.username}/${msgKey}`).remove();
                return;
            }

            await db.ref(`student_discounts/${currentUser.username}`).push({
                percent: parseInt(giftValue),
                dateAcquired: Date.now(),
                isUsed: false,
                expiry: expiry,
                targetItem: targetArr // Lưu mảng trực tiếp vào Database
            });
            alert(`🎉 Bạn đã nhận được Thẻ giảm giá ${giftValue}%!`);
        }
        await db.ref(`inbox_messages/${currentUser.username}/${msgKey}`).remove();
    } catch (error) {
        console.error(error);
        alert("❌ Có lỗi xảy ra khi nhận quà. Vui lòng thử lại mạng!");
    }
};

window.deleteMessage = async function (msgKey) {
    await db.ref(`inbox_messages/${currentUser.username}/${msgKey}`).remove();
};

// ================= HỆ THỐNG THI TOÀN MÀN HÌNH =================
window.currentActiveExamId = null;
window.pendingExamId = null;

window.showExamWarning = function (assignId) {
    window.pendingExamId = assignId;
    const modal = document.getElementById('examWarningModal');
    if (modal) modal.classList.add('active');
};

window.closeExamWarning = function () {
    window.pendingExamId = null;
    const modal = document.getElementById('examWarningModal');
    if (modal) modal.classList.remove('active');
};

window.startExamFullscreen = async function () {
    if (!window.pendingExamId) return;

    try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen(); // Safari
        else if (elem.msRequestFullscreen) await elem.msRequestFullscreen(); // Edge cũ

        // Chờ 1 chút để màn hình mở rộng ra rồi mới hiển thị bài thi
        setTimeout(() => {
            const assignId = window.pendingExamId;
            window.currentActiveExamId = assignId;

            const wrapper = document.getElementById(`exam-wrapper-${assignId}`);
            const content = document.getElementById(`exam-content-${assignId}`);

            if (wrapper) wrapper.style.display = 'none';
            if (content) content.style.display = 'block';

            closeExamWarning();

            // === KHÓA UI ĐỘNG (KHÔNG GỌI loadAssignments ĐỂ TRÁNH RESET BÀI) ===

            // 1. Phủ kính mờ khóa tất cả các bài tập khác (trừ bài đang thi)
            const allCards = document.querySelectorAll('.accordion-card');
            allCards.forEach(card => {
                const contentDiv = card.querySelector('.accordion-content');
                if (contentDiv && !contentDiv.id.includes(assignId)) {
                    card.style.position = 'relative';
                    let overlay = document.createElement('div');
                    overlay.className = 'exam-lock-overlay';
                    overlay.style.cssText = 'position: absolute; inset: 0; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); z-index: 10; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: not-allowed;';
                    overlay.innerHTML = '<span style="background: rgba(225, 29, 72, 0.9); color: white; padding: 6px 14px; border-radius: 20px; font-weight: bold; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4);">🔒 Tạm khóa khi thi</span>';

                    // Cụp bài xuống nếu đang vô tình mở
                    if (contentDiv.style.maxHeight) {
                        contentDiv.style.maxHeight = null;
                    }
                    card.appendChild(overlay);

                    // Gắn đè sự kiện click
                    const header = card.querySelector('.accordion-header');
                    if (header) {
                        header.dataset.oldOnclick = header.getAttribute('onclick');
                        header.setAttribute('onclick', "window.showExamLockWarning('⚠️ Hãy tập trung làm bài thi và không mở mục khác!')");
                    }
                }
            });

            // 2. Làm mờ & vô hiệu hóa các Tab ở Sidebar và nút Đăng xuất
            document.querySelectorAll('.nav-item, .btn-logout').forEach(btn => {
                if (!btn.classList.contains('active')) {
                    btn.style.opacity = '0.4';
                    btn.style.pointerEvents = 'none'; // Khóa click triệt để bằng CSS
                }
            });
            // ====================================================

        }, 300);

    } catch (err) {
        alert(`Trình duyệt của bạn đang chặn chế độ toàn màn hình. Vui lòng cấp quyền để có thể làm bài!`);
        closeExamWarning();
    }
};

// === BỔ SUNG: BIẾN CỜ HIỆU CHỐNG BẮT LỖI OAN KHI MỞ FILE ===
window.isSelectingFile = false;
window.addEventListener('focus', () => {
    if (window.isSelectingFile) {

        // BỔ SUNG: Bắt buộc học sinh click để bật lại Toàn màn hình hợp lệ
        if (window.currentActiveExamId && !document.fullscreenElement) {

            // Tạo một lớp phủ (overlay) chặn màn hình lại
            let resumeOverlay = document.getElementById('resumeExamOverlay');
            if (!resumeOverlay) {
                resumeOverlay = document.createElement('div');
                resumeOverlay.id = 'resumeExamOverlay';
                resumeOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); z-index: 9999999; display: flex; flex-direction: column; justify-content: center; align-items: center;';

                const resumeBtn = document.createElement('button');
                resumeBtn.innerText = "🚀 Tải file xong! Bấm vào đây để tiếp tục thi";
                resumeBtn.style.cssText = 'background: linear-gradient(135deg, #e11d48 0%, #ff4d4d 100%); color: white; font-size: 1.5em; padding: 20px 40px; border-radius: 50px; border: none; cursor: pointer; box-shadow: 0 5px 25px rgba(225, 29, 72, 0.6); font-weight: bold; text-transform: uppercase; animation: pulse 1.5s infinite;';

                // Khi học sinh bấm nút, kích hoạt lại Fullscreen
                resumeBtn.onclick = async () => {
                    try {
                        const elem = document.documentElement;
                        if (elem.requestFullscreen) await elem.requestFullscreen();
                        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen(); // Safari
                        else if (elem.msRequestFullscreen) await elem.msRequestFullscreen(); // Edge cũ
                    } catch (err) {
                        console.log("Lỗi bật Fullscreen:", err);
                    }

                    resumeOverlay.style.display = 'none'; // Ẩn màn hình chờ

                    // Chờ 0.5s để Fullscreen bung ra hoàn toàn rồi mới gỡ cờ bảo vệ
                    setTimeout(() => { window.isSelectingFile = false; }, 500);
                };

                resumeOverlay.appendChild(resumeBtn);
                document.body.appendChild(resumeOverlay);
            }

            // Hiện lớp phủ lên yêu cầu học sinh click
            resumeOverlay.style.display = 'flex';

        } else {
            // Nếu không ở chế độ thi hoặc màn hình vốn vẫn đang Fullscreen thì gỡ cờ bảo vệ ngay
            setTimeout(() => { window.isSelectingFile = false; }, 1000);
        }
    }
});

// Lắng nghe sự kiện học sinh "vượt rào" thoát toàn màn hình
document.addEventListener('fullscreenchange', () => {
    if (window.isSelectingFile) return; // BỎ QUA BẮT LỖI NẾU ĐANG MỞ HỘP THOẠI FILE

    if (!document.fullscreenElement && window.currentActiveExamId) {
        alert("⚠️ VI PHẠM BẢO MẬT: Bạn đã tự ý thoát chế độ toàn màn hình! Hệ thống tự động thu bài ngay lập tức.");
        // Gắn cờ true thứ nhất cho isAuto, true thứ hai cho isCheat
        submitAssignment(window.currentActiveExamId, true, true);
        window.currentActiveExamId = null;
    }
});

// ================= HỆ THỐNG LƯU NHÁP TỰ ĐỘNG =================
window.saveDraft = function (assignId, type, qIndex, value) {
    const draftKey = `draft_${currentUser.username}_${assignId}`;
    let draft;
    try {
        draft = JSON.parse(localStorage.getItem(draftKey));
        if (typeof draft !== 'object' || draft === null) draft = { mcAnswers: {}, essay: '' };
    } catch (e) {
        draft = { mcAnswers: {}, essay: '' };
    }
    if (type === 'mc') {
        draft.mcAnswers[qIndex] = value;
    } else if (type === 'essay') {
        draft.essay = value;
    }
    localStorage.setItem(draftKey, JSON.stringify(draft));
};

// Bắt sự kiện chuyển Tab hoặc thu nhỏ trình duyệt
document.addEventListener('visibilitychange', () => {
    if (window.isSelectingFile) return; // BỎ QUA BẮT LỖI NẾU ĐANG MỞ HỘP THOẠI FILE

    if (document.hidden && window.currentActiveExamId) {
        alert("⚠️ VI PHẠM BẢO MẬT: Bạn đã chuyển sang tab/cửa sổ khác! Hệ thống tự động thu bài ngay lập tức.");
        // Thu bài tự động và đánh dấu gian lận
        submitAssignment(window.currentActiveExamId, true, true);
    }
});

// Bắt sự kiện chuyển Tab hoặc thu nhỏ trình duyệt (Code cũ của bạn)
document.addEventListener('visibilitychange', () => {
    if (window.isSelectingFile) return; // BỎ QUA BẮT LỖI NẾU ĐANG MỞ HỘP THOẠI FILE

    if (document.hidden && window.currentActiveExamId) {
        alert("⚠️ VI PHẠM BẢO MẬT: Bạn đã chuyển sang tab/cửa sổ khác! Hệ thống tự động thu bài ngay lập tức.");
        // Thu bài tự động và đánh dấu gian lận
        submitAssignment(window.currentActiveExamId, true, true);
    }
});

// ==============================================================
// ĐOẠN CODE FIX LỖI PHÍM WINDOWS VÀ HÌNH-TRONG-HÌNH (THÊM MỚI)
// ==============================================================

// 1. Bắt sự kiện nhấn phím Windows, mở Start Menu, thanh Taskbar (Mất tiêu điểm)
window.addEventListener('blur', () => {
    if (window.isSelectingFile) return;

    // Ngoại lệ quan trọng: Không bắt lỗi nếu học sinh click vào Iframe (Video YouTube bài giảng)
    if (document.activeElement && document.activeElement.tagName === 'IFRAME') return;

    if (window.currentActiveExamId) {
        alert("⚠️ VI PHẠM BẢO MẬT: Bạn đã mở ứng dụng khác hoặc bấm phím hệ thống (Windows/Alt+Tab)! Hệ thống tự động thu bài.");
        submitAssignment(window.currentActiveExamId, true, true);
        window.currentActiveExamId = null; // Reset cờ
    }
});

// 2. Chặn gian lận bằng chế độ Hình-Trong-Hình (PiP)
document.addEventListener('enterpictureinpicture', (e) => {
    if (window.currentActiveExamId) {
        // Tắt PiP ngay lập tức
        document.exitPictureInPicture().catch(console.error);
        alert("⚠️ VI PHẠM BẢO MẬT: Không được phép sử dụng Hình-trong-Hình (PiP) khi đang thi!");
        submitAssignment(window.currentActiveExamId, true, true);
        window.currentActiveExamId = null;
    }
});

// --- BỘ TẠO THÔNG BÁO NỔI KHÔNG LÀM MẤT FULLSCREEN ---
window.showExamLockWarning = function (msg) {
    let toast = document.getElementById('exam-lock-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'exam-lock-toast';
        toast.style.cssText = 'position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #e11d48; color: white; padding: 12px 25px; border-radius: 50px; z-index: 9999999; font-weight: bold; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4); pointer-events: none; opacity: 0; transition: opacity 0.3s ease; text-align: center; white-space: nowrap;';
        document.body.appendChild(toast);
    }
    toast.innerText = msg || '⚠️ Đang trong chế độ thi! Tính năng này tạm khóa.';
    toast.style.opacity = '1';

    clearTimeout(window.examToastTimeout);
    window.examToastTimeout = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
};
// ---------------------------------------------------

// ================= HỆ THỐNG XEM TRƯỚC PHẦN THƯỞNG DẠ HỘI =================
window.showRoyalBallRewards = function () {
    const listContainer = document.getElementById('royalRewardsList');
    if (!listContainer) return;

    let html = '';

    // 1. Giao diện phần thưởng Coin (Mặc định)
    html += `
    <div style="background: rgba(246, 211, 101, 0.2); border: 1px dashed #f39c12; padding: 12px; border-radius: 12px; margin-bottom: 15px; display: flex; align-items: center; gap: 15px;">
        <div style="font-size: 2.5em; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">💰</div>
        <div>
            <strong style="color: #d35400; font-size: 1.1em;">Phần thưởng Coin</strong>
            <p style="margin: 5px 0 0 0; color: #555; font-size: 0.9em; line-height: 1.4;">Nhận ngẫu nhiên lượng lớn <strong>Coin</strong> nếu bạn không rơi ra vật phẩm.</p>
        </div>
    </div>`;

    // 2. Tự động quét và lọc các vật phẩm Truyền Thuyết từ StoreConfig
    if (typeof StoreConfig !== 'undefined' && StoreConfig.items) {
        // Lọc tất cả vật phẩm có chứa tag "Truyền thuyết" (Không phân biệt hoa/thường)
        const legendaryItems = StoreConfig.items.filter(i => i.tag && i.tag.toLowerCase().includes('truyền thuyết'));

        if (legendaryItems.length > 0) {
            html += `<h4 style="color: #c0392b; margin: 20px 0 10px 0; display: flex; align-items: center; gap: 8px;">🔥 Tủ đồ Truyền Thuyết:</h4>`;

            legendaryItems.forEach(item => {
                let typeIcon = '📦';
                let typeName = 'Vật phẩm';

                if (item.type === 'theme') { typeIcon = '🎨'; typeName = 'Giao diện'; }
                else if (item.type === 'effect') { typeIcon = '✨'; typeName = 'Hiệu ứng'; }
                else if (item.type === 'pet') { typeIcon = '🐾'; typeName = 'Thú cưng'; }

                // FIX LỖI: Kiểm tra xem vật phẩm dùng ảnh hay icon để hiển thị chính xác
                let displayVisual = '';
                if (item.isIcon === false && item.value) {
                    displayVisual = `<img src="${item.value}" style="width: 50px; height: 50px; object-fit: contain;">`;
                } else {
                    displayVisual = item.customIcon || item.icon || typeIcon;
                }

                html += `
                <div style="background: rgba(192, 57, 43, 0.05); border: 1px solid rgba(192, 57, 43, 0.15); padding: 12px; border-radius: 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 15px; transition: 0.3s;" onmouseover="this.style.background='rgba(192, 57, 43, 0.1)'" onmouseout="this.style.background='rgba(192, 57, 43, 0.05)'">
                    <div style="font-size: 2.2em; background: rgba(255,255,255,0.8); width: 60px; height: 60px; border-radius: 12px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">${displayVisual}</div>
                    <div>
                        <strong style="color: #c0392b; font-size: 1.1em; display: block; margin-bottom: 4px;">${item.name}</strong>
                        <p style="margin: 0 0 6px 0; color: #666; font-size: 0.85em;">Loại: <span style="font-weight: bold; color: #444;">${typeName}</span></p>
                        <span style="display: inline-block; background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); color: white; padding: 3px 10px; border-radius: 20px; font-size: 0.75em; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 2px 5px rgba(255,8,68,0.3); text-transform: uppercase;">Truyền Thuyết</span>
                    </div>
                </div>`;
            });
        } else {
            html += `<div style="background: rgba(0,0,0,0.05); padding: 15px; border-radius: 12px; text-align: center;">
                <p style="color: #666; font-style: italic; margin: 0;">Hiện tại chưa có vật phẩm Truyền Thuyết nào được mở bán trên hệ thống.</p>
            </div>`;
        }
    }

    listContainer.innerHTML = html;
    document.getElementById('royalRewardsModal').classList.add('active');
};

// HÀM HIỂN THỊ THÔNG TIN CHI TIẾT THẺ GIẢM GIÁ ĐANG CHỌN
window.showSelectedDiscountInfo = function () {
    const select = document.getElementById('checkoutDiscount');
    if (!select || select.selectedIndex <= 0 || select.value === "0") {
        alert("Vui lòng nhấp vào ô bên dưới để chọn một thẻ giảm giá trước khi xem thông tin nhé!");
        return;
    }

    const option = select.options[select.selectedIndex];
    const percent = option.getAttribute('data-percent');
    const expiry = option.getAttribute('data-expiry');
    const targetStr = option.getAttribute('data-target');

    let expiryText = expiry ? new Date(parseInt(expiry)).toLocaleString('vi-VN') : "Vĩnh viễn (Không bao giờ hết hạn)";

    // Tách chuỗi và hiển thị dạng danh sách hoa thị (Bullet List) nếu có nhiều món
    let targetText = "Tất cả vật phẩm (Mua bằng Coin) hiện có trong Cửa hàng.";
    if (targetStr && targetStr !== 'all') {
        const targetIds = targetStr.split(',');
        const itemNamesHTML = targetIds.map(id => {
            const itemDef = typeof StoreConfig !== 'undefined' ? StoreConfig.items.find(i => i.id === id) : null;
            return itemDef ? `<li style="margin-bottom: 4px;">[${itemDef.tag}] ${itemDef.name}</li>` : '';
        }).join('');

        targetText = `Chỉ áp dụng khi mua:<br><ul style="color: #c0392b; padding-left: 20px; margin-top: 5px; max-height: 120px; overflow-y: auto; font-weight: bold;">${itemNamesHTML}</ul>`;
    }

    const infoHtml = `
    <div id="discountInfoModal" class="modal-overlay" style="z-index: 9999999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);">
        <div style="background: white; padding: 20px; border-radius: 12px; width: 340px; max-width: 90%; text-align: left; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border-left: 5px solid #00acc1; animation: scaleIn 0.2s ease;">
            <h4 style="margin: 0 0 15px 0; color: #00838f; display: flex; align-items: center; gap: 8px; font-size: 1.2em;">ℹ️ Chi tiết Thẻ giảm giá</h4>
            
            <p style="margin: 0 0 10px 0; font-size: 0.95em; color: #444;"><strong>Mức giảm giá:</strong> <span style="color: #e11d48; font-weight: bold; font-size: 1.1em;">${percent}%</span></p>
            <p style="margin: 0 0 10px 0; font-size: 0.95em; color: #444;"><strong>Hạn sử dụng:</strong> <span style="color: #d35400;">${expiryText}</span></p>
            
            <p style="margin: 0 0 15px 0; font-size: 0.95em; color: #444; line-height: 1.5;"><strong>Phạm vi áp dụng:</strong> <br><span style="color: #059669;">${targetText}</span></p>
            
            <button onclick="document.getElementById('discountInfoModal').remove()" style="width: 100%; padding: 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: bold; color: #334155; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">Đã hiểu & Đóng lại</button>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', infoHtml);
};

// ================= HỆ THỐNG TÚI ĐỒ NÂNG CẤP (GRID INVENTORY) =================
let bagHoldTimeout = null;
let isBagPopupOpen = false;

window.openStudentBag = function () {
    if (window.currentActiveExamId) {
        window.showExamLockWarning("⚠️ Túi đồ tạm khóa khi đang thi!");
        return;
    }
    renderStudentBag();
    document.getElementById('studentBagModal').classList.add('active');
};

window.closeStudentBag = function () {
    document.getElementById('studentBagModal').classList.remove('active');
    closeBagItemPopup();
};

window.closeBagItemPopup = function () {
    const popup = document.getElementById('bagItemPopup');
    if (popup) popup.style.display = 'none';
    isBagPopupOpen = false;
};

// Xử lý sự kiện khi bắt đầu nhấn (hỗ trợ cả Chuột và Cảm ứng điện thoại)
window.handleBagSlotPressStart = function (e, itemDataStr) {
    if (isBagPopupOpen) return;
    const itemData = JSON.parse(decodeURIComponent(itemDataStr));

    // Tạo hiệu ứng lún nhẹ khi ấn giữ nhấp chuột/màn hình
    e.currentTarget.style.transform = 'scale(0.92)';
    e.currentTarget.style.borderColor = '#8e44ad';
    e.currentTarget.style.backgroundColor = '#faf5ff';

    bagHoldTimeout = setTimeout(() => {
        window.showBagItemPopup(itemData);
        bagHoldTimeout = null;
    }, 450); // Thời gian giữ im là 450ms để kích hoạt popup thông tin
};

// Xử lý sự kiện khi nhả tay hoặc di chuột ra ngoài
window.handleBagSlotPressEnd = function (e) {
    if (bagHoldTimeout) {
        clearTimeout(bagHoldTimeout);
        bagHoldTimeout = null;
    }
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.borderColor = '#94a3b8';
    e.currentTarget.style.backgroundColor = 'white';
};

// Hiển thị Popup chứa thông tin chi tiết và Nút Bán
window.showBagItemPopup = function (item) {
    isBagPopupOpen = true;
    const popup = document.getElementById('bagItemPopup');
    const content = document.getElementById('bagItemPopupContent');

    let iconHtml = item.isImg
        ? `<img src="${item.icon}" style="width: 65px; height: 65px; object-fit: contain; margin-bottom: 12px; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.15));">`
        : `<div style="font-size: 3.5em; margin-bottom: 10px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">${item.icon}</div>`;

    let actionButtonHtml = '';

    // SỬA LẠI: Chỉ hiện nút bán khi thẻ ĐÃ HẾT HẠN (item.isExpired là true)
    if (item.type === 'discount' && item.firebaseKeys && item.firebaseKeys.length > 0 && item.isExpired) {
        actionButtonHtml = `
            <button onclick="sellDiscountCardFromPopup('${item.firebaseKeys[0]}', ${item.percent}, ${item.sellPrice})" 
                style="margin-top: 15px; width: 100%; background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%); border: none; padding: 10px; border-radius: 8px; font-weight: bold; color: white; cursor: pointer; box-shadow: 0 4px 10px rgba(107, 114, 128, 0.4); font-size: 0.95em; transition: 0.2s;">
                ♻️ Bán thẻ hết hạn nhận lại +${item.sellPrice} Coin
            </button>
        `;
    }

    content.innerHTML = `
        ${iconHtml}
        <h4 style="margin: 0 0 10px 0; color: #8e44ad; font-size: 1.25em; font-weight: bold;">${item.name}</h4>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 0.88em; color: #475569; text-align: left; line-height: 1.4;">
            ${item.description}
            <p style="margin: 8px 0 0 0; font-weight: bold; color: #1e293b; border-top: 1px dashed #cbd5e1; padding-top: 6px; text-align: right;">
                Xếp chồng: ${item.quantity}/50
            </p>
        </div>
        ${actionButtonHtml}
    `;

    popup.style.display = 'block';
};

// Thực hiện giao dịch bán thẻ từ Popup thông tin
window.sellDiscountCardFromPopup = async function (discountKey, percent, sellPrice) {
    if (!confirm(`Bạn có chắc muốn thanh lý 1 tấm thẻ giảm giá ${percent}% này để lấy lại ${sellPrice} Coin không?`)) return;

    try {
        const coinRef = db.ref('student_coins/' + currentUser.username);
        const snap = await coinRef.once('value');
        const currentCoins = snap.val() || 0;

        // Cộng coin thanh lý và gỡ thẻ khỏi cơ sở dữ liệu
        await coinRef.set(currentCoins + sellPrice);
        await db.ref(`student_discounts/${currentUser.username}/${discountKey}`).remove();

        alert(`🎉 Thu gom thành công! Đã quy đổi thẻ thành +${sellPrice} Coin.`);
        window.closeBagItemPopup();
        renderStudentBag(); // Làm tươi lại lưới túi đồ
    } catch (e) {
        console.error("Lỗi giao dịch bán thẻ:", e);
        alert("❌ Hệ thống gặp sự cố phản hồi. Vui lòng thử lại!");
    }
};

// Khởi chạy quy trình gom nhóm và kết xuất túi đồ dạng lưới ô
window.renderStudentBag = async function () {
    const container = document.getElementById('studentBagBody');
    container.innerHTML = '<div style="text-align:center; padding: 40px 10px; color: #888; font-style: italic;">⏳ Đang mở kho hành trang...</div>';

    try {
        // [ĐÃ SỬA LỖI] Gọi thẳng hàm window.calculateTotalTickets() để tính chính xác Vé thưởng + Vé làm bài - Vé đã quay
        const [ticketData, discountSnap] = await Promise.all([
            window.calculateTotalTickets(),
            db.ref('student_discounts/' + currentUser.username).once('value')
        ]);

        let slotsData = [];
        const now = Date.now();

        // --- 1. XỬ LÝ GỘP Ô: VÉ QUAY MAY MẮN ---
        // Sử dụng ticketData.remaining thay vì chỉ đọc mỗi vé quà tặng
        let totalTickets = ticketData.remaining > 0 ? ticketData.remaining : 0;

        while (totalTickets > 0) {
            let count = Math.min(50, totalTickets);
            slotsData.push({
                type: 'ticket',
                name: 'Vé quay may mắn',
                icon: '🎫',
                isImg: false,
                quantity: count,
                isExpired: false,
                description: 'Vật phẩm tiêu hao dùng để tham gia lượt quay Gacha nhân phẩm tại Vòng Quay May Mắn.'
            });
            totalTickets -= count;
        }

        // --- 2. XỬ LÝ GỘP Ô: THẺ GIẢM GIÁ (HIỂN THỊ CẢ THẺ HẾT HẠN) ---
        const discounts = discountSnap.val() || {};
        let groupedDiscounts = {};

        for (let key in discounts) {
            let d = discounts[key];
            if (d.isUsed) continue; // Bỏ qua nếu thẻ đã dùng xong

            let targetStr = d.targetItem ? JSON.stringify(d.targetItem) : '["all"]';
            // Nhóm theo phần trăm, hạn dùng và mục tiêu áp dụng
            let groupKey = `${d.percent}_${d.expiry || 'permanent'}_${targetStr}`;

            if (!groupedDiscounts[groupKey]) {
                groupedDiscounts[groupKey] = {
                    percent: d.percent,
                    expiry: d.expiry || null,
                    targetItem: d.targetItem || ['all'],
                    keys: []
                };
            }
            groupedDiscounts[groupKey].keys.push(key);
        }

        for (let gk in groupedDiscounts) {
            let group = groupedDiscounts[gk];
            let allKeys = group.keys;
            let totalVouchers = allKeys.length;
            let index = 0;

            while (totalVouchers > 0) {
                let count = Math.min(50, totalVouchers);
                let currentChunkKeys = allKeys.slice(index, index + count);

                let isExpired = group.expiry && now > group.expiry;
                let expText = group.expiry ? new Date(group.expiry).toLocaleString('vi-VN') : 'Vĩnh viễn';
                if (isExpired) expText = '<span style="color: #e11d48; font-weight: bold;">Đã hết hạn</span>';

                let targetText = "Áp dụng toàn bộ Cửa hàng";
                if (group.targetItem && !group.targetItem.includes('all')) {
                    targetText = `Áp dụng giới hạn cho một số vật phẩm chỉ định`;
                }

                let sellPrice = Math.max(1, Math.min(10, Math.floor(group.percent / 10)));

                slotsData.push({
                    type: 'discount',
                    name: `Thẻ giảm giá ${group.percent}%`,
                    icon: '🏷️',
                    isImg: false,
                    quantity: count,
                    percent: group.percent,
                    expiry: group.expiry,
                    isExpired: isExpired,
                    sellPrice: sellPrice,
                    firebaseKeys: currentChunkKeys,
                    description: `🏷️ <b>Mức giảm:</b> ${group.percent}%<br>🕒 <b>Hạn dùng:</b> ${expText}<br>🎯 <b>Phạm vi:</b> ${targetText}`
                });

                index += count;
                totalVouchers -= count;
            }
        }

        // Tạo sẵn các ô trống tối thiểu (24 ô lưới vuông) giúp giao diện cân đối
        const minSlots = 24;
        while (slotsData.length < minSlots) {
            slotsData.push({ type: 'empty' });
        }

        // --- 3. RENDER GIAO DIỆN LƯỚI Ô ĐỒ ---
        let gridHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 10px; padding: 4px;">';

        slotsData.forEach(slot => {
            if (slot.type === 'empty') {
                gridHtml += `
                    <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; aspect-ratio: 1 / 1; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);"></div>
                `;
            } else {
                let innerGraphic = slot.isImg
                    ? `<img src="${slot.icon}" style="width: 75%; height: 75%; object-fit: contain; pointer-events: none;">`
                    : `<span style="font-size: 2em; pointer-events: none; user-select: none;">${slot.icon}</span>`;

                let quantityBadge = `
                    <div style="position: absolute; bottom: 4px; right: 4px; background: rgba(30, 41, 59, 0.85); color: white; font-size: 0.72em; font-weight: bold; padding: 1px 5px; border-radius: 4px; pointer-events: none; z-index: 2; font-family: monospace;">
                        ${slot.quantity}
                    </div>
                `;

                let expiredBadge = slot.isExpired ? `
                    <div style="position: absolute; top: 4px; left: 4px; background: #e11d48; color: white; font-size: 0.58em; font-weight: bold; padding: 2px 4px; border-radius: 4px; z-index: 3; box-shadow: 0 1px 3px rgba(0,0,0,0.15); line-height: 1; transform: scale(0.95); transform-origin: top left; letter-spacing: -0.2px;">
                        Hết hạn
                    </div>
                ` : '';

                let slotBg = slot.isExpired ? '#f8fafc' : 'white';
                let slotBorder = slot.isExpired ? '#cbd5e1' : '#94a3b8';
                let slotOpacity = slot.isExpired ? '0.65' : '1';

                let itemStr = encodeURIComponent(JSON.stringify(slot));

                gridHtml += `
                    <div class="bag-inventory-slot"
                         onmousedown="window.handleBagSlotPressStart(event, '${itemStr}')"
                         onmouseup="window.handleBagSlotPressEnd(event)"
                         onmouseleave="window.handleBagSlotPressEnd(event)"
                         ontouchstart="window.handleBagSlotPressStart(event, '${itemStr}')"
                         ontouchend="window.handleBagSlotPressEnd(event)"
                         style="background: ${slotBg}; border: 2px solid ${slotBorder}; opacity: ${slotOpacity}; border-radius: 10px; aspect-ratio: 1 / 1; position: relative; display: flex; justify-content: center; align-items: center; cursor: pointer; user-select: none; -webkit-user-select: none; transition: transform 0.1s ease, background-color 0.1s ease, border-color 0.1s ease; box-shadow: 0 3px 6px rgba(0,0,0,0.04);">
                        ${expiredBadge}
                        ${innerGraphic}
                        ${quantityBadge}
                    </div>
                `;
            }
        });

        gridHtml += '</div>';
        container.innerHTML = gridHtml;

    } catch (error) {
        console.error("Lỗi kết xuất túi lưới đồ: ", error);
        container.innerHTML = '<p style="color: #e11d48; text-align: center; padding: 20px;">❌ Gặp sự cố nạp dữ liệu lưới đồ.</p>';
    }
};

// =========================================================================
// CHỨC NĂNG YÊU CẦU LẤY TIỀN MẶT - PHÍA HỌC SINH (CÁCH 2)
// =========================================================================

// Hàm hiển thị danh sách lịch sử yêu cầu rút tiền của học sinh
async function renderCashRequestHistory() {
    const container = document.getElementById('cashRequestHistoryContainer');
    if (!container) return;

    try {
        const allRequests = await getDB('cash_requests');
        const now = Date.now();
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
        const myRequests = [];

        // Lọc yêu cầu của học sinh hiện tại VÀ tự động xóa cái quá 2 ngày
        for (let req of allRequests) {
            if (req.studentName === currentUser.name) {
                if (req.status === 'completed' || req.status === 'rejected') {
                    const checkTime = req.resolvedAt || req.timestamp;
                    if (now - checkTime > TWO_DAYS_MS) {
                        // Xóa vĩnh viễn khỏi Firebase để tránh nặng data
                        await removeDB('cash_requests', req._fbKey);
                        continue; // Bỏ qua không hiển thị vào danh sách
                    }
                }
                myRequests.push(req);
            }
        }

        if (myRequests.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8; font-size: 0.9em; margin: 0; text-align: center; padding: 10px;">Chưa có yêu cầu lấy tiền mặt nào.</p>';
            return;
        }

        let html = '';
        // Đảo thứ tự để yêu cầu mới nhất hiện lên trên đầu
        myRequests.reverse().forEach(req => {
            let statusBadge = '';
            let note = '';

            if (req.status === 'pending') {
                statusBadge = '<span style="background: #fef3c7; color: #d97706; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85em;">⏳ Đang chờ duyệt</span>';
            } else if (req.status === 'transferring') {
                statusBadge = '<span style="background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85em;">🔄 Đang chuyển</span>';
                note = '<p style="margin: 5px 0 0 0; font-size: 0.85em; color: #64748b; font-style: italic;">👉 Ghi chú: Tiền sẽ được chuyển đến trong 2-3 ngày</p>';
            } else if (req.status === 'completed') {
                statusBadge = '<span style="background: #dcfce7; color: #16a34a; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85em;">✅ Đã hoàn tất yêu cầu</span>';
            } else if (req.status === 'rejected') {
                statusBadge = '<span style="background: #fee2e2; color: #dc2626; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85em;">❌ Bị từ chối</span>';
            }

            html += `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <span style="font-weight: 600; color: #1e293b;">${req.amount.toLocaleString('vi-VN')} VNĐ</span>
                        ${statusBadge}
                    </div>
                    <div style="font-size: 0.8em; color: #94a3b8; margin-top: 4px;">Thời gian: ${new Date(req.timestamp).toLocaleString('vi-VN')}</div>
                    ${note}
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error("Lỗi khi tải lịch sử rút tiền:", error);
        container.innerHTML = '<p style="color: #dc2626; font-size: 0.85em; padding: 5px; margin: 0;">Lỗi tải dữ liệu lịch sử!</p>';
    }
}

// HÀM MỚI: Tính toán chính xác Tổng tiền lộ trình thời gian thực
window.calculateCurrentRouteMoney = async function () {
    let baseMoney = 0;
    const assignments = await getDB('assignments');
    const submissions = await getDB('submissions');
    const myAssignments = assignments.filter(assign => assign.targetStudent === 'all' || assign.targetStudent === currentUser.username);

    myAssignments.forEach(assign => {
        const passingGrade = assign.passingGrade || 7;
        const sub = submissions.find(s => s.assignmentId === assign.id && s.studentUsername === currentUser.username);
        let currentItemMoney = assign.roadmapMoney ? parseInt(assign.roadmapMoney) : 0;

        if (sub) {
            if (sub.forcePass) baseMoney += currentItemMoney;
            else if (!sub.isAutoSubmitted && !sub.isLateFail && !sub.isRegrading && sub.grade !== null && sub.grade !== '') {
                if (parseFloat(sub.grade) >= passingGrade) baseMoney += currentItemMoney;
            }
        }
    });

    // Cộng trừ với lịch sử quy đổi Coin (offset)
    const offsetSnap = await db.ref('student_money_offset/' + currentUser.username).once('value');
    let moneyOffset = offsetSnap.val() || 0;

    let currentMoney = baseMoney + moneyOffset;
    return currentMoney < 0 ? 0 : currentMoney;
};

// HÀM MỚI: Khởi tạo giao diện (Đã fix lỗi hiện 0 VNĐ)
window.initCashWithdrawInterface = async function () {
    // Gọi hàm tính tiền thực tế ở trên
    const totalRouteMoney = await window.calculateCurrentRouteMoney();

    const displayEl = document.getElementById('displayRouteMoney');
    if (displayEl) {
        displayEl.innerText = totalRouteMoney.toLocaleString('vi-VN');
    }

    // Tải danh sách lịch sử yêu cầu
    renderCashRequestHistory();
};

// HÀM MỚI: Xử lý gửi yêu cầu (Đã fix lỗi lấy sai số dư)
window.handleRequestCashSubmit = async function () {
    const inputEl = document.getElementById('inputWithdrawAmount');
    if (!inputEl) return;

    const amount = parseInt(inputEl.value);

    // Lấy số tiền thực tế vào đúng thời điểm học sinh bấm Gửi
    const totalRouteMoney = await window.calculateCurrentRouteMoney();

    if (isNaN(amount) || amount <= 0) {
        alert("⚠️ Vui lòng nhập số tiền mặt muốn lấy hợp lệ!");
        return;
    }

    if (amount > totalRouteMoney) {
        alert(`⚠️ Số tiền yêu cầu (${amount.toLocaleString('vi-VN')} VNĐ) vượt quá Tổng tiền tích lũy lộ trình hiện tại (${totalRouteMoney.toLocaleString('vi-VN')} VNĐ)!`);
        return;
    }

    if (!confirm(`Bạn có chắc chắn muốn gửi yêu cầu lấy ${amount.toLocaleString('vi-VN')} VNĐ về giáo viên không?`)) {
        return;
    }

    try {
        await pushDB('cash_requests', {
            studentName: currentUser.name,
            amount: amount,
            status: 'pending',
            timestamp: Date.now()
        });

        alert("🎉 Gửi yêu cầu thành công! Vui lòng đợi giáo viên xét duyệt.");
        inputEl.value = '';
        renderCashRequestHistory();
    } catch (error) {
        console.error("Lỗi gửi yêu cầu tiền mặt:", error);
        alert("❌ Đã xảy ra lỗi kết nối khi gửi yêu cầu.");
    }
};

// ================= HỆ THỐNG THEO DÕI VIDEO YOUTUBE =================
let ytPlayers = {};
let watchTimers = {};
let watchDurations = {}; // Lưu mốc thời gian XA NHẤT học sinh đã xem tới
let lastSavedTime = {};  // Biến phụ để chống spam lưu lên Firebase liên tục

// Hàm thay thế getEmbedHTML dành riêng cho việc có theo dõi thời gian
function getTrackedVideoHTML(url, assignId) {
    if (!url) return '';
    let videoId = '';
    if (url.includes('watch?v=')) { videoId = url.split('v=')[1].split('&')[0]; }
    else if (url.includes('youtu.be/')) { videoId = url.split('youtu.be/')[1].split('?')[0]; }
    else if (url.includes('youtube.com/shorts/')) { videoId = url.split('shorts/')[1].split('?')[0]; }
    else if (url.includes('embed/')) { videoId = url.split('embed/')[1].split('?')[0]; }

    if (videoId) {
        let embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
        return `
        <div class="video-wrapper" style="margin-top: 10px; margin-bottom: 20px; border: 1px solid rgba(102, 126, 234, 0.3); padding: 15px; border-radius: 16px; background: rgba(255,255,255,0.95); box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
            <iframe id="yt-player-${assignId}" width="100%" height="315" src="${embedUrl}" frameborder="0" allowfullscreen style="border-radius: 8px;"></iframe>
            <div style="text-align: center; margin-top: 15px; font-weight: bold; color: #059669; font-size: 1.05em; background: rgba(16, 185, 129, 0.08); padding: 10px; border-radius: 8px; border: 1px dashed rgba(16, 185, 129, 0.3);">
                ⏱️ Mốc thời gian đã xem tới: <span id="watch-time-display-${assignId}" style="font-size: 1.1em;">0</span> giây
            </div>
        </div>`;
    }
    return '';
}

window.initYouTubeTrackers = function (assignments) {
    if (typeof YT === 'undefined' || !YT.Player) return;

    assignments.forEach(assign => {
        const iframeId = `yt-player-${assign.id}`;
        const iframeEl = document.getElementById(iframeId);

        if (iframeEl && !ytPlayers[assign.id]) {
            // Lấy dữ liệu cũ TỪ TRƯỚC, lấy xong mới khởi tạo video
            db.ref(`video_tracking/${assign.id}/${currentUser.username}`).once('value', (snap) => {
                watchDurations[assign.id] = snap.val() || 0;
                const display = document.getElementById(`watch-time-display-${assign.id}`);
                if (display) display.innerText = watchDurations[assign.id];

                // Bắt đầu khởi tạo Player
                ytPlayers[assign.id] = new YT.Player(iframeId, {
                    events: {
                        'onReady': (event) => {
                            // LỚP BẢO VỆ 1: Khi load video, ép tua tới đúng điểm đang xem dở
                            if (watchDurations[assign.id] > 0) {
                                event.target.seekTo(watchDurations[assign.id], true);
                            }
                        },
                        'onStateChange': (event) => onPlayerStateChange(event, assign.id)
                    }
                });
            });
        }
    });
};

function onPlayerStateChange(event, assignId) {
    const player = ytPlayers[assignId];

    if (event.data == YT.PlayerState.PLAYING) {
        if (watchTimers[assignId]) clearInterval(watchTimers[assignId]);

        watchTimers[assignId] = setInterval(() => {
            if (player && typeof player.getCurrentTime === 'function') {
                let currentTime = Math.floor(player.getCurrentTime());

                if (currentTime > watchDurations[assignId]) {
                    // Chống tua nhanh
                    if (currentTime - watchDurations[assignId] > 5) {
                        player.seekTo(watchDurations[assignId], true);
                    } else {
                        watchDurations[assignId] = currentTime;
                        const display = document.getElementById(`watch-time-display-${assignId}`);
                        if (display) display.innerText = watchDurations[assignId];

                        // FIX LỖI: Lưu Firebase dựa trên khoảng cách thời gian thực (5 giây / lần)
                        let now = Date.now();
                        if (!lastSavedTime[assignId] || now - lastSavedTime[assignId] >= 5000) {
                            db.ref(`video_tracking/${assignId}/${currentUser.username}`).set(watchDurations[assignId]);
                            lastSavedTime[assignId] = now;
                        }
                    }
                }
            }
        }, 1000);
    } else {
        if (watchTimers[assignId]) clearInterval(watchTimers[assignId]);
        // Lưu chốt ngay khi bấm Dừng/Hết video
        if (watchDurations[assignId]) {
            db.ref(`video_tracking/${assignId}/${currentUser.username}`).set(watchDurations[assignId]);
            lastSavedTime[assignId] = Date.now();
        }
    }
}

// FIX LỖI: Lưu chốt lần cuối nếu học sinh đột ngột đóng Tab hoặc bấm F5
window.addEventListener('beforeunload', () => {
    Object.keys(watchDurations).forEach(assignId => {
        if (watchDurations[assignId] > 0) {
            db.ref(`video_tracking/${assignId}/${currentUser.username}`).set(watchDurations[assignId]);
        }
    });
});

window.downloadStudentRoadmapPDF = async function () {
    const assignments = await getDB('assignments');
    const submissions = await getDB('submissions');

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="text-align: center; color: #2c3e50; text-transform: uppercase;">BẢNG ĐIỂM HỌC TẬP</h2>
            <p style="font-size: 16px;"><strong>Họ và tên học sinh:</strong> ${currentUser.name}</p>
            <p style="font-size: 16px;"><strong>Ngày xuất:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f1f5f9;">
                        <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: left;">Tên bài học</th>
                        <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; width: 100px;">Điểm số</th>
                        <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; width: 150px;">Hạn nộp</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Lọc bài tập của học sinh
    const myAssignments = assignments.filter(assign => assign.targetStudent === 'all' || assign.targetStudent === currentUser.username);
    const sortedAssignments = [...myAssignments].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi-VN', { numeric: true, sensitivity: 'base' }));

    let rowsHTML = "";
    sortedAssignments.forEach(assign => {
        const subs = submissions.filter(s => s.assignmentId === assign._fbKey && s.studentId === currentUser.username);
        let studentScore = "Chưa làm";

        if (subs.length > 0) {
            const bestSub = subs.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
            studentScore = bestSub.score !== undefined ? bestSub.score : "Chưa chấm";
        }

        rowsHTML += `
            <tr>
                <td style="border: 1px solid #cbd5e1; padding: 12px;">${assign.title}</td>
                <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; font-weight: bold; color: #e11d48;">${studentScore}</td>
                <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; color: #64748b;">${assign.endDate || '---'}</td>
            </tr>
        `;
    });

    const finalHTML = htmlContent + rowsHTML + `
                </tbody>
            </table>
        </div>
    `;

    const opt = {
        margin: 10,
        filename: `BangDiem_${currentUser.name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = finalHTML;
    html2pdf().set(opt).from(tempDiv).save();
};