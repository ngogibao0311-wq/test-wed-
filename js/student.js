const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'student') window.location.href = 'index.html';

let cacheAssignmentsSt = "";
let cacheSubmissionsSt = "";

document.getElementById('studentName').innerText = currentUser.name;
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

    // LẮNG NGHE THÔNG BÁO TOÀN TRƯỜNG
    db.ref('global_notifications').on('value', (snapshot) => {
        const notifications = [];
        snapshot.forEach(child => notifications.push({ ...child.val(), _fbKey: child.key }));

        if (notifications.length > 0) {
            const sorted = notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            const latestNoti = sorted[0];
            const receivers = latestNoti.receivers || {};

            if (!receivers[currentUser.username]) {
                // CHẶN BẬT POPUP NẾU ĐANG THI TOÀN MÀN HÌNH
                if (window.currentActiveExamId) {
                    console.log("Đã hoãn thông báo do đang trong chế độ thi cử.");
                    return;
                }

                document.getElementById('studentNotificationMessage').innerText = latestNoti.message;
                document.getElementById('studentNotificationModal').classList.add('active');

                const btn = document.getElementById('btnAcknowledgeNotification');
                btn.onclick = async function () {
                    btn.disabled = true; btn.innerText = "⏳ Đang ghi nhận...";
                    await db.ref(`global_notifications/${latestNoti._fbKey}/receivers/${currentUser.username}`).set(true);
                    document.getElementById('studentNotificationModal').classList.remove('active');
                    btn.disabled = false; btn.innerText = "✅ Đã nhận và đọc hiểu";
                };
            } else {
                document.getElementById('studentNotificationModal').classList.remove('active');
            }
        }
    });

    // LẮNG NGHE KHẢO SÁT BẮT BUỘC
    db.ref('global_surveys').on('value', (snapshot) => {
        const surveys = [];
        snapshot.forEach(child => surveys.push({ ...child.val(), _fbKey: child.key }));

        if (surveys.length > 0) {
            const sorted = surveys.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            for (let sv of sorted) {
                const answersObj = sv.answers || {};
                if (!answersObj[currentUser.username]) {
                    // CHẶN BẬT POPUP NẾU ĐANG THI TOÀN MÀN HÌNH
                    if (window.currentActiveExamId) return;

                    window.currentActiveSurvey = sv;
                    renderStudentSurvey(sv);
                    break;
                }
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
    if (ms <= 0) return "00:00:00";
    let h = Math.floor(ms / (1000 * 60 * 60)).toString().padStart(2, '0');
    let m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    let s = Math.floor((ms % (1000 * 60)) / 1000).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

async function loadAssignments() {
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
            const end = assign.endDate ? new Date(assign.endDate.replace(" ", "T")) : new Date("2100-01-01");

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
        if (assign.targetStudent !== 'all' && assign.targetStudent !== currentUser.username) return;
        const mySub = submissions.find(s => s.assignmentId === assign.id && s.studentUsername === currentUser.username);

        const now = new Date();
        const startTime = assign.startDate ? new Date(assign.startDate.replace(" ", "T")) : new Date(0);
        const endTime = assign.endDate ? new Date(assign.endDate.replace(" ", "T")) : new Date("2100-01-01");
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
                aFiles.forEach(f => {
                    teacherFileHTML += `<div class="assignment-file"><p><strong>📎 Tài liệu đính kèm:</strong> <a href="${f.base64}" download="${f.name}" class="file-download-link" target="_blank">${f.name} (Tải xuống)</a></p></div>`;
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
            const div = document.createElement('div'); div.className = 'card accordion-card';
            div.innerHTML = `<div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)"><div class="accordion-title"><h4>${assign.title}</h4><span>${statusText}</span></div><div class="accordion-meta"><span>Điểm: <strong style="${(mySub.grade !== null && mySub.grade !== undefined && mySub.grade !== '' && !mySub.isRegrading) ? 'color:#059669;' : 'color:#d35400;'}">${gradeDisplay}</strong></span><span class="toggle-icon">▼</span></div></div>
                <div id="${uniqueId}" class="accordion-content"><div class="assignment-meta"><p>🕒 <strong>Bạn đã nộp lúc:</strong> ${mySub.submitTime || 'Không rõ'}</p></div>${violationHTML}${videoHTML}<div style="background: rgba(255,255,255,0.5); padding: 15px; border-radius: 12px; margin-top: 15px;"><strong>Nội dung bài làm của bạn:</strong><br><p style="margin-top: 5px; color: ${mySub.isAutoSubmitted ? '#e74c3c' : '#444'}; white-space: pre-wrap;">${mySub.answer || '<i>(Không có)</i>'}</p>${myFileHTML}</div>${teacherFileHTML}${gradedFileHTML}${teacherCommentHTML}${viewQuestionsBtnHTML}</div>`;
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

                    pushDB('submissions', {
                        id: Date.now().toString() + Math.floor(Math.random() * 1000),
                        assignmentId: assign.id,
                        studentUsername: currentUser.username,
                        studentName: currentUser.name,
                        answer: "⚠️ [Hệ thống tự động nộp do đã quá hạn - Học sinh không làm bài kịp]",
                        rawEssay: "",
                        mcAnswers: {},
                        grade: null,
                        submitTime: now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN'),
                        file: null,
                        teacherFile: null,
                        isAutoSubmitted: true,
                        isRedoing: false,
                        isLateFail: true
                    }).then(() => {
                        window[`isSubmitting_${assign.id}`] = false;
                        loadAssignments(); // THÊM DÒNG NÀY: Ép giao diện tự động load lại bài lên danh sách đã nộp
                    });
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
                    let draft = JSON.parse(localStorage.getItem(draftKey)) || { mcAnswers: {}, essay: '' };
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
                    videoHTML = assign.videoLink ? getEmbedHTML(assign.videoLink) : '';
                    descHTML = assign.desc ? `<div class="assignment-desc"><strong>Yêu cầu bài tập:</strong> <br>${(assign.desc || '').replace(/\n/g, '<br>')}</div>` : '';
                    if (assign.file) {
                        let aFiles = Array.isArray(assign.file) ? assign.file : [assign.file];
                        aFiles.forEach(f => {
                            teacherFileHTML += `<div class="assignment-file" style="margin-top: 15px;"><p><strong>📎 Tài liệu đính kèm:</strong> <a href="${f.base64}" download="${f.name}" class="file-download-link" target="_blank">${f.name}</a></p></div>`;
                        });
                    }

                    let draftKey = `draft_${currentUser.username}_${assign.id}`;
                    let draft = JSON.parse(localStorage.getItem(draftKey)) || { mcAnswers: {}, essay: '' };

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
                        : `<textarea id="answer-${assign.id}" placeholder="Nhập câu trả lời..." rows="4" oninput="saveDraft('${assign.id}', 'essay', null, this.value)">${savedEssay}</textarea>`;

                    tuLuanInputHTML = `<hr style="border: 0; border-top: 1px dashed rgba(0,0,0,0.1); margin: 20px 0;">
                                       <h3 style="color: #2c3e50; margin-bottom: 10px;">Phần làm bài tự luận</h3>
                                       ${essayTextAreaHTML}
                                       <label style="display: block; margin: 10px 0 8px 0;"><strong>📎 Đính kèm file bài làm:</strong></label>
                                       ${prevFileHTML}
                                       <input type="file" id="studentFile-${assign.id}" accept=".docx, .pdf, image/*" multiple onchange="handleStudentFileAccumulate(this, '${assign.id}')" style="margin-bottom: 15px; background: rgba(255,255,255,0.5);">`;
                }

                let submitBtnHTML = currentUser.isLocked
                    ? `<button type="button" style="width: 100%; margin-top: 15px; padding: 14px; border-radius: 12px; border: none; background: #95a5a6; color: white; font-weight: bold; cursor: not-allowed;" onclick="alert('🔒 Tài khoản của bạn đang bị khóa tạm thời. Bạn không thể nộp bài!')">🔒 Tài khoản bị khóa (Không thể thao tác)</button>`
                    : `<button id="btn-submit-${assign.id}" class="btn-approve" style="width: 100%; color: #111; margin-top: 15px;" onclick="this.disabled=true; this.style.opacity='0.6'; this.innerText='⏳ Đang xử lý, vui lòng đợi...'; submitAssignment('${assign.id}').finally(() => { this.disabled=false; this.style.opacity='1'; this.innerText='Nộp bài tập ngay'; })">Nộp bài tập ngay</button>`;

                const uniqueId = `student-todo-${assign.id}`;
                const div = document.createElement('div'); div.className = 'card submit-box accordion-card';

                let assignmentContentRaw = `
                    ${videoHTML}
                    ${quizHTML}
                    ${descHTML}
                    ${teacherFileHTML}
                    ${tuLuanInputHTML}
                    ${submitBtnHTML}
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

                div.innerHTML = `<div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)"><div class="accordion-title"><h4>${assign.title}</h4></div><div class="accordion-meta"><span>Hạn nộp: <strong style="color: #d35400;">${assign.endDate}</strong></span><span class="toggle-icon">▼</span></div></div>
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
        MathJax.typesetPromise([
            document.getElementById('assignmentsList'),
            document.getElementById('gradesList')
        ]).catch((err) => console.log('MathJax error:', err));
    }
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
    const startTime = assign.startDate ? new Date(assign.startDate.replace(" ", "T")) : new Date(0);
    const endTime = assign.endDate ? new Date(assign.endDate.replace(" ", "T")) : new Date("2100-01-01");

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

    if (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType) {
        const answerEl = document.getElementById(`answer-${assignId}`); if (answerEl) answer = answerEl.value;
        const fileInput = document.getElementById(`studentFile-${assignId}`);
        if (fileInput && fileInput.files.length > 0) {
            filesArray = await readMultipleFiles(fileInput.files);
            // Thêm dòng này để chặn nộp bài nếu file bị từ chối do quá dung lượng
            if (filesArray.length === 0) return;
        }

        let hasOldFile = mySub && mySub.file;

        if (assign.hideEssayText) {
            if (!filesArray && !hasOldFile && assign.assessmentType === 'tu_luan' && !isAuto) {
                return alert("Bài tự luận này yêu cầu bạn bắt buộc phải đính kèm tệp bài làm!");
            }
        } else {
            if (!answer && !filesArray && !hasOldFile && assign.assessmentType !== 'ket_hop' && !isAuto) return alert("Cần nhập nội dung hoặc đính kèm file!");
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

        // --- BỔ SUNG ĐOẠN NÀY ĐỂ THOÁT TOÀN MÀN HÌNH SAU KHI NỘP ---
        if (window.currentActiveExamId === assignId) {
            window.currentActiveExamId = null;
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
            }
        }
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
        let fileHTML = '';
        if (mat.docLink) {
            // Nút bấm dành cho link URL (Mở trực tiếp trên web)
            fileHTML = `<div class="assignment-file" style="margin-top: 15px; background: rgba(56, 239, 125, 0.05); border-left: 4px solid #38ef7d;"><p><strong>📚 Link bài học:</strong> <a href="${mat.docLink}" class="file-download-link" target="_blank" rel="noopener">Nhấn vào đây để xem trực tiếp</a></p></div>`;
        } else if (mat.file) {
            // Fallback tải xuống cho file cũ
            fileHTML = `<div class="assignment-file" style="margin-top: 15px; background: rgba(56, 239, 125, 0.05); border-left: 4px solid #38ef7d;"><p><strong>📚 Tải file bài học:</strong> <a href="${mat.file.base64}" download="${mat.file.name}" class="file-download-link" target="_blank">${mat.file.name}</a></p></div>`;
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
    const users = await getDB('users'); const userRecord = users.find(u => u.username === currentUser.username);
    if (userRecord) {
        if (userRecord.isLocked) { alert("🔒 Tài khoản của bạn vừa bị Giáo viên khóa. Hệ thống sẽ tự động đăng xuất!"); logout(); return; }
        localStorage.setItem('currentUser', JSON.stringify(userRecord)); Object.assign(currentUser, userRecord);
        document.getElementById('studentName').innerHTML = currentUser.name; loadAssignments();
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
    // --- Bổ sung dòng này ---
    // Hiển thị ảnh hiện tại lên Modal, nếu chưa có thì dùng ảnh mặc định (Base64 của emoji 👤)
    const currentAvatar = currentUser.avatar || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    document.getElementById('modalAvatarPreview').src = currentAvatar;
    // Tự động ẩn nút lưu nếu mở Modal lần đầu
    document.getElementById('saveAvatarBtn').style.display = 'none';
    // --- Kết thúc bổ sung ---

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

    if (schedules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding:15px; text-align:center; color:#666; font-style:italic;">Chưa có lịch học nào được sắp xếp.</td></tr>`;
        return;
    }

    schedules.forEach(s => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
        tr.innerHTML = `
            <td style="padding:12px; font-weight:bold; color:#764ba2;">${s.day}</td>
            <td style="padding:12px; color:#d35400; font-weight:bold;">${s.time}</td>
            <td style="padding:12px; color:#2c3e50;">${s.subject}</td>
            <td style="padding:12px; color:#555;">${s.note || ''}</td>
        `;
        tbody.appendChild(tr);
    });
};

// PHIÊN BẢN MỚI: TẢI FILE LÊN FIREBASE STORAGE THAY VÌ LƯU BASE64
async function readMultipleFiles(files) {
    // 1. Kiểm tra xem file index.html đã thêm thư viện Firebase Storage chưa
    if (typeof firebase === 'undefined' || !firebase.storage) {
        alert("⚠️ HỆ THỐNG: Bạn cần thêm thư viện Firebase Storage vào file HTML (index.html, student.html, teacher.html) để tải file lên!");
        return [];
    }

    const MAX_SIZE_MB = 5; 
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    const results = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 2. Chặn file quá nặng
        if (file.size > MAX_SIZE_BYTES) {
            alert(`⚠️ File "${file.name}" quá lớn (${(file.size / (1024 * 1024)).toFixed(2)}MB).\nHệ thống chỉ cho phép tối đa ${MAX_SIZE_MB}MB/file. Vui lòng nén file lại!`);
            continue; 
        }

        try {
            // 3. Upload thẳng lên Firebase Storage (Thư mục uploads/)
            const storageRef = firebase.storage().ref(`uploads/${Date.now()}_${file.name}`);
            const snapshot = await storageRef.put(file);
            
            // 4. Lấy link tải xuống trực tiếp
            const downloadURL = await snapshot.ref.getDownloadURL();

            // MẸO (TRICK): Vẫn gán URL vào thuộc tính tên là "base64"
            // Việc này giúp toàn bộ giao diện HTML cũ của bạn vẫn tự động nhận diện và tải file bình thường!
            results.push({ name: file.name, type: file.type, base64: downloadURL });
            
        } catch (error) {
            console.error("Lỗi upload file:", error);
            alert(`❌ Lỗi mạng khi tải file "${file.name}" lên máy chủ.`);
        }
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
        coinWidget.style.bottom = 'auto';
        coinWidget.style.right = 'auto';
        coinWidget.style.left = savedPos.left;
        coinWidget.style.top = savedPos.top;
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
    if (ms <= 0) return "00:00:00";
    let d = Math.floor(ms / (1000 * 60 * 60 * 24));
    let h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
    let m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    let s = Math.floor((ms % (1000 * 60)) / 1000).toString().padStart(2, '0');
    if (d > 0) return `${d} ngày ${h}:${m}:${s}`;
    return `${h}:${m}:${s}`;
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

// 4. Logic Mua đứt (Tính hoàn tiền nếu đang dùng thử)
window.buyItem = async function (itemId, isUpgradingFromTrial = false) {
    const item = StoreManager.getItemById(itemId);
    if (!item) return;
    if (item.isLocked) return alert("🔒 Vật phẩm này hiện đang bị Giáo viên khóa, không thể mua!");
    if (item.isNonCoin && (!item.price || item.price <= 0)) return alert(`🎁 Đây là vật phẩm sự kiện, không thể mua bằng Coin!`);

    const coinRef = db.ref('student_coins/' + currentUser.username);
    const snap = await coinRef.once('value');
    let currentCoins = snap.val() || 0;

    let finalPrice = item.price;
    let confirmMsg = `Xác nhận dùng ${finalPrice} Coin để mua vĩnh viễn [ ${item.name} ]?`;

    if (isUpgradingFromTrial) {
        const trialPrice = item.price / 2;
        const refund = trialPrice * 0.3;
        finalPrice = item.price - refund;
        confirmMsg = `Bạn đang dùng thử vật phẩm này. Nâng cấp vĩnh viễn ngay bây giờ sẽ được hoàn lại 30% phí dùng thử.\n\n💰 Giá cần thanh toán: ${finalPrice} Coin.\nXác nhận mua?`;
    }

    if (currentCoins < finalPrice) return alert(`❌ Số dư Coin không đủ! Bạn cần ${finalPrice} Coin.`);

    if (confirm(confirmMsg)) {
        await coinRef.set(currentCoins - finalPrice);
        await db.ref(`student_inventory/${currentUser.username}/${item.id}`).update({
            id: item.id,
            purchaseTime: Date.now(),
            isTrial: null,
            trialExpiry: null,
            isEquipped: true
        });
        alert(`🎉 Chúc mừng! Bạn đã sở hữu vĩnh viễn [ ${item.name} ].`);
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

// ================= HỆ THỐNG KHẢO SÁT =================
window.renderStudentSurvey = function (surveyData) {
    document.getElementById('studentSurveyTitle').innerText = surveyData.title;
    const body = document.getElementById('studentSurveyBody');
    body.innerHTML = '';

    surveyData.questions.forEach((q, idx) => {
        const div = document.createElement('div');
        div.className = 'survey-answer-block';
        div.dataset.qid = q.id;
        div.style.cssText = 'background: rgba(0,0,0,0.03); padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.05);';

        let html = `<p style="margin: 0 0 10px 0; font-weight: bold; color: #2c3e50;">Câu ${idx + 1}: ${q.text}</p>`;

        if (q.type === 'mc') {
            q.options.forEach(opt => {
                // Thêm sự kiện onchange để tự động kiểm tra tiến độ
                html += `
                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; cursor: pointer; background: white; padding: 8px 12px; border-radius: 8px;">
                    <input type="radio" name="ans_${q.id}" value="${opt}" onchange="checkSurveyCompletion()" style="width: auto; margin: 0;"> 
                    <span>${opt}</span>
                </label>`;
            });
        } else {
            // Thêm sự kiện onkeyup để tự động kiểm tra tiến độ
            html += `<textarea id="ans_${q.id}" placeholder="Nhập câu trả lời của bạn..." rows="3" onkeyup="checkSurveyCompletion()" style="width: 100%; padding: 10px; background: white; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);"></textarea>`;
        }
        div.innerHTML = html;
        body.appendChild(div);
    });

    // Ẩn nút gửi và mở Modal
    document.getElementById('btnSubmitSurvey').style.display = 'none';
    document.getElementById('surveyAlertMsg').style.display = 'block';
    document.getElementById('studentSurveyModal').classList.add('active');
};

// Hàm tự động quét xem học sinh đã điền đủ chưa
window.checkSurveyCompletion = function () {
    if (!window.currentActiveSurvey) return;

    let isComplete = true;
    window.currentActiveSurvey.questions.forEach(q => {
        if (q.type === 'mc') {
            const checked = document.querySelector(`input[name="ans_${q.id}"]:checked`);
            if (!checked) isComplete = false;
        } else {
            const txt = document.getElementById(`ans_${q.id}`).value.trim();
            if (!txt) isComplete = false;
        }
    });

    const btn = document.getElementById('btnSubmitSurvey');
    const alertMsg = document.getElementById('surveyAlertMsg');

    if (isComplete) {
        btn.style.display = 'block'; // Hiện nút X
        alertMsg.style.display = 'none'; // Tắt dòng cảnh báo đỏ
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

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
        tr.innerHTML = `
            <td style="padding:12px;"><strong>${assign.title}</strong></td>
            <td style="padding:12px; text-align: center;"><strong>${studentScore}</strong></td>
            <td style="padding:12px; text-align: center;"><span class="${statusClass}">${statusText}</span></td>
            <td style="padding:12px; text-align: center; ${cellBgStyle}"><strong>${moneyVal}</strong></td>
            <td style="padding:12px; font-size:0.85em; color:#555; white-space: nowrap;">${assign.endDate}</td>
            <td style="padding:12px; color:#2c3e50; font-weight: 600;">${conditionVal}</td>
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
    document.getElementById('convertAmount').value = '';
    document.getElementById('convertResult').value = '';
    setConvertDir('M2C'); // Reset về mặc định
    document.getElementById('coinConversionModal').classList.add('active');
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

// ================= HỆ THỐNG HỘP THƯ & NHẬN QUÀ (HỌC SINH) =================

window.openStudentInbox = function () {
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
    window.myInboxMessages.forEach(msg => {
        let giftHTML = '';
        let btnHTML = '';

        if (msg.giftType !== 'none') {
            let giftDisplay = '';
            if (msg.giftType === 'coin') giftDisplay = `🪙 ${parseInt(msg.giftValue).toLocaleString('vi-VN')} Coin`;
            else if (msg.giftType === 'money') giftDisplay = `💵 ${parseInt(msg.giftValue).toLocaleString('vi-VN')} đ (Tiền Lộ trình)`;
            else if (msg.giftType === 'ticket') giftDisplay = `🎫 ${parseInt(msg.giftValue).toLocaleString('vi-VN')} Vé quay may mắn`; // Dòng mới thêm
            else if (msg.giftType === 'item') {
                const itemDef = StoreConfig.items.find(i => i.id === msg.giftValue);
                giftDisplay = itemDef ? `📦 ${itemDef.name} (${itemDef.type})` : '📦 Vật phẩm bí ẩn';
            }

            giftHTML = `<div style="background: rgba(246, 211, 101, 0.2); border: 1px dashed #d35400; padding: 10px; border-radius: 8px; margin: 10px 0;">
                <strong style="color: #d35400;">🎁 Đính kèm quà tặng:</strong><br>
                <span style="font-size: 1.1em; font-weight: bold; color: #2c3e50;">${giftDisplay}</span>
            </div>`;

            btnHTML = `<button onclick="claimGift('${msg._fbKey}', '${msg.giftType}', '${msg.giftValue}')" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; border: none; color: white; cursor: pointer; box-shadow: 0 4px 10px rgba(17, 153, 142, 0.3);">🧧 Mở quà & Nhận vào túi</button>`;
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
            // Cộng tiền vào Offset để Lộ trình tự động cộng dồn
            const offsetRef = db.ref('student_money_offset/' + currentUser.username);
            const snap = await offsetRef.once('value');
            await offsetRef.set((snap.val() || 0) + parseInt(giftValue));
            alert(`🎉 Bạn đã nhận được ${parseInt(giftValue).toLocaleString('vi-VN')} đ vào Tiền Lộ trình!`);
            if (typeof renderStudentRoadmap === 'function') renderStudentRoadmap(); // Cập nhật lại bảng lộ trình lập tức
        } else if (giftType === 'ticket') {
            // Dòng mới thêm: Lưu vé được tặng vào một node riêng trên Firebase
            const ticketRef = db.ref('student_bonus_tickets/' + currentUser.username);
            const snap = await ticketRef.once('value');
            await ticketRef.set((snap.val() || 0) + parseInt(giftValue));
            alert(`🎉 Bạn đã nhận được ${parseInt(giftValue)} Vé quay may mắn!`);
        } else if (giftType === 'item') {
            await db.ref(`student_inventory/${currentUser.username}/${giftValue}`).update({
                id: giftValue,
                purchaseTime: Date.now(),
                isTrial: null,
                trialExpiry: null,
                isEquipped: false
            });
            alert(`🎉 Vật phẩm đã được thêm vào Túi đồ của bạn!`);
        }

        // Xóa thư sau khi nhận quà thành công
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
        }, 300);

    } catch (err) {
        alert(`Trình duyệt của bạn đang chặn chế độ toàn màn hình. Vui lòng cấp quyền để có thể làm bài!`);
        closeExamWarning();
    }
};

// Lắng nghe sự kiện học sinh "vượt rào" thoát toàn màn hình
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && window.currentActiveExamId) {
        alert("⚠️ VI PHẠM BẢO MẬT: Bạn đã thoát chế độ toàn màn hình! Hệ thống tự động thu bài ngay lập tức.");
        // Gắn cờ true thứ nhất cho isAuto, true thứ hai cho isCheat
        submitAssignment(window.currentActiveExamId, true, true);
        window.currentActiveExamId = null;
    }
});

// ================= HỆ THỐNG LƯU NHÁP TỰ ĐỘNG =================
window.saveDraft = function (assignId, type, qIndex, value) {
    const draftKey = `draft_${currentUser.username}_${assignId}`;
    let draft = JSON.parse(localStorage.getItem(draftKey)) || { mcAnswers: {}, essay: '' };
    if (type === 'mc') {
        draft.mcAnswers[qIndex] = value;
    } else if (type === 'essay') {
        draft.essay = value;
    }
    localStorage.setItem(draftKey, JSON.stringify(draft));
};

// Bắt sự kiện chuyển Tab hoặc thu nhỏ trình duyệt
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.currentActiveExamId) {
        alert("⚠️ VI PHẠM BẢO MẬT: Bạn đã chuyển sang tab/cửa sổ khác! Hệ thống tự động thu bài ngay lập tức.");
        // Thu bài tự động và đánh dấu gian lận
        submitAssignment(window.currentActiveExamId, true, true);
    }
});