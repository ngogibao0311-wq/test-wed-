const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'student') window.location.href = 'index.html';

document.getElementById('studentName').innerText = currentUser.name;
updateAvatarDisplay(currentUser.avatar); // Tự động hiển thị ảnh đại diện ở góc phải

window.studentSubmitDTs = {};
window.handleStudentFileAccumulate = function (input, assignId) {
    if (!window.studentSubmitDTs[assignId]) window.studentSubmitDTs[assignId] = new DataTransfer();

    const existingNames = Array.from(window.studentSubmitDTs[assignId].files).map(f => f.name);

    for (let i = 0; i < input.files.length; i++) {
        if (!existingNames.includes(input.files[i].name)) {
            window.studentSubmitDTs[assignId].items.add(input.files[i]);
        }
    }
    input.files = window.studentSubmitDTs[assignId].files;
};
// ==============================================================

window.onload = async function () {
    db.ref('profile_requests').on('value', async () => { await checkProfileRequests(); });
    db.ref('users').on('value', async () => {
        await syncUserData();
        if (document.getElementById('settingName')) document.getElementById('settingName').value = currentUser.name;
    });
    db.ref('assignments').on('value', async () => { await loadAssignments(); if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap(); });
    db.ref('submissions').on('value', async () => { await loadAssignments(); if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap(); });
    db.ref('materials').on('value', async () => { await loadMaterialsListStudent(); });

    // Đồng bộ điểm chuẩn từ xa do giáo viên cài đặt
    db.ref('roadmap_settings/passingGrade').on('value', (snapshot) => {
        window.currentPassingGrade = parseFloat(snapshot.val() || 7);
        if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
    });

    db.ref('schedule').on('value', async () => {
        if (typeof loadScheduleStudent === 'function') await loadScheduleStudent();
    });

    db.ref('game_settings').on('value', (snapshot) => {
        if (snapshot.exists()) {
            const settings = snapshot.val();

            // 1. Đồng bộ đúng tên biến isOpen từ Firebase do teacher.js đẩy lên
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
    
    // === LẮNG NGHE HỆ THỐNG CỬA HÀNG ===
    db.ref('store_settings').on('value', (snapshot) => {
        const settings = snapshot.val();
        // Mặc định là mở (true) nếu chưa có cấu hình trên Firebase
        const isOpen = (settings !== null && settings.isOpen !== undefined) ? settings.isOpen : true;
        
        const activeView = document.getElementById('storeActiveView');
        const lockedView = document.getElementById('storeLockedView');
        
        if (activeView) activeView.style.display = isOpen ? 'block' : 'none';
        if (lockedView) lockedView.style.display = isOpen ? 'none' : 'block';
    });
    
    db.ref('store_items').on('value', async () => {
        if (typeof loadStoreItems === 'function') await loadStoreItems();
    });
    
    db.ref('student_inventory/' + currentUser.username).on('value', (snapshot) => {
        myInventory = snapshot.val() ? Object.values(snapshot.val()) : [];
        if (typeof loadStoreItems === 'function') loadStoreItems();
        if (typeof applyEquippedItems === 'function') applyEquippedItems();
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
        return `<div class="video-wrapper"><iframe width="100%" height="315" src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
    }
    return `<div class="video-wrapper"><iframe width="100%" height="315" src="${url}" frameborder="0" allowfullscreen></iframe></div>`;
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
    const assignments = await getDB('assignments');
    const submissions = await getDB('submissions');
    const list = document.getElementById('assignmentsList');
    const grades = document.getElementById('gradesList');

    if (list) list.innerHTML = '';
    if (grades) grades.innerHTML = '';

    assignmentTimers.forEach(t => clearInterval(t));
    assignmentTimers = [];
    let hasAutoSubmitted = false;

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
            let typeText = assign.assessmentType === 'trac_nghiem' ? 'Trắc nghiệm' : (assign.assessmentType === 'ket_hop' ? 'Kết hợp' : 'Tự luận');
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
            let statusText = `Đã hoàn thành (${typeText})`;

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
                <div id="${uniqueId}" class="accordion-content"><div class="assignment-meta"><p>🕒 <strong>Bạn đã nộp lúc:</strong> ${mySub.submitTime || 'Không rõ'}</p></div>${videoHTML}<div style="background: rgba(255,255,255,0.5); padding: 15px; border-radius: 12px; margin-top: 15px;"><strong>Nội dung bài làm của bạn:</strong><br><p style="margin-top: 5px; color: ${mySub.isAutoSubmitted ? '#e74c3c' : '#444'}; white-space: pre-wrap;">${mySub.answer || '<i>(Không có)</i>'}</p>${myFileHTML}</div>${teacherFileHTML}${gradedFileHTML}${teacherCommentHTML}${viewQuestionsBtnHTML}</div>`;
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
                // Thu bài tự động ngầm dưới DB ngay lập tức
                const autoFlagKey = `auto_sub_${assign.id}_${currentUser.username}`;
                if (!mySub && !localStorage.getItem(autoFlagKey)) {
                    localStorage.setItem(autoFlagKey, 'true'); hasAutoSubmitted = true;
                    pushDB('submissions', { id: Date.now().toString() + Math.floor(Math.random() * 1000), assignmentId: assign.id, studentUsername: currentUser.username, studentName: currentUser.name, answer: "⚠️ [Hệ thống tự động nộp do đã quá hạn - Học sinh không làm bài kịp]", rawEssay: "", mcAnswers: {}, grade: null, submitTime: now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN'), file: null, teacherFile: null, isAutoSubmitted: true, isRedoing: false, isLateFail: true });
                }

                // Nhưng vẫn hiển thị thẻ TRỄ ở danh sách bài tập cần làm trong 5 phút
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
                            loadAssignments(); // Quá 5 phút thì chuyển sang bảng điểm
                        } else {
                            const el = document.getElementById(`cd-late-${assign.id}`);
                            if (el) el.innerText = formatCountdown(gracePeriodEndTime - c);
                        }
                    }, 1000);
                    assignmentTimers.push(timer);
                }
            }
            else {
                // Hiển thị khung làm bài (Hoặc làm lại với dữ liệu cũ)
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
                if ((assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop') && assign.questions) {
                    let noticeHTML = assign.assessmentType === 'ket_hop' ? `<div class="glass-alert" style="padding: 10px; margin-bottom: 15px; border-left-color: #764ba2;"><strong>⚖️ Thang điểm bài này:</strong> Trắc nghiệm (${assign.mcWeight || 5}đ) - Tự luận (${assign.essayWeight || 5}đ)</div>` : '';
                    quizHTML = noticeHTML + '<div style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.9);"><h4 style="color: #d35400; margin-bottom: 10px;">Phần Trắc Nghiệm</h4>';

                    let savedMc = (mySub && mySub.mcAnswers) ? mySub.mcAnswers : {};

                    assign.questions.forEach((q, idx) => {
                        let chkA = savedMc[idx] === 'A' ? 'checked' : '';
                        let chkB = savedMc[idx] === 'B' ? 'checked' : '';
                        let chkC = savedMc[idx] === 'C' ? 'checked' : '';
                        let chkD = savedMc[idx] === 'D' ? 'checked' : '';

                        quizHTML += `<div style="margin-bottom: 15px; background: rgba(255,255,255,0.5); padding: 12px; border-radius: 8px;"><p style="font-weight: bold; color: #2c3e50; margin-bottom: 8px;">Câu ${idx + 1}: ${q.qText}</p><div style="display:flex; flex-direction:column; gap:8px;">
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;"><input type="radio" name="q-${assign.id}-${idx}" value="A" style="width:auto; margin:0;" ${chkA}> <span>A. ${q.A}</span></label>
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;"><input type="radio" name="q-${assign.id}-${idx}" value="B" style="width:auto; margin:0;" ${chkB}> <span>B. ${q.B}</span></label>
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;"><input type="radio" name="q-${assign.id}-${idx}" value="C" style="width:auto; margin:0;" ${chkC}> <span>C. ${q.C}</span></label>
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;"><input type="radio" name="q-${assign.id}-${idx}" value="D" style="width:auto; margin:0;" ${chkD}> <span>D. ${q.D}</span></label></div></div>`;
                    });
                    quizHTML += '</div>';
                }

                let videoHTML = '';
                let descHTML = '';
                let teacherFileHTML = '';
                let tuLuanInputHTML = '';

                if (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType) {
                    videoHTML = assign.videoLink ? getEmbedHTML(assign.videoLink) : '';
                    descHTML = assign.desc ? `<div class="assignment-desc"><strong>Yêu cầu bài tập:</strong> <br>${(assign.desc || '').replace(/\n/g, '<br>')}</div>` : '';
                    if (assign.file) {
                        let aFiles = Array.isArray(assign.file) ? assign.file : [assign.file];
                        aFiles.forEach(f => {
                            teacherFileHTML += `<div class="assignment-file" style="margin-top: 15px;"><p><strong>📎 Tài liệu đính kèm:</strong> <a href="${f.base64}" download="${f.name}" class="file-download-link" target="_blank">${f.name}</a></p></div>`;
                        });
                    }

                    let savedEssay = mySub && mySub.rawEssay ? mySub.rawEssay : '';
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
                        : `<textarea id="answer-${assign.id}" placeholder="Nhập câu trả lời..." rows="4">${savedEssay}</textarea>`;

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
                div.innerHTML = `<div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)"><div class="accordion-title"><h4>${assign.title}</h4></div><div class="accordion-meta"><span>Hạn nộp: <strong style="color: #d35400;">${assign.endDate}</strong></span><span class="toggle-icon">▼</span></div></div>
                    <div id="${uniqueId}" class="accordion-content">
                        ${redoNotice}
                        <div class="assignment-meta"><p>📅 <strong>Từ:</strong> ${assign.startDate} <strong>đến</strong> ${assign.endDate}</p>${countdownHTML}</div>
                        ${videoHTML}
                        ${quizHTML}
                        ${descHTML}
                        ${teacherFileHTML}
                        ${tuLuanInputHTML}
                        ${submitBtnHTML}
                    </div>`;
                list.appendChild(div);

                if (!isRedoing || (isRedoing && now <= endTime)) {
                    const timer = setInterval(() => {
                        const c = new Date();
                        if (c > endTime) {
                            clearInterval(timer);
                            if (!isRedoing) loadAssignments(); // Ép render lại giao diện 5 phút khóa chức năng
                        } else {
                            const el = document.getElementById(`cd-end-${assign.id}`);
                            if (el) el.innerText = formatCountdown(endTime - c);
                        }
                    }, 1000);
                    assignmentTimers.push(timer);
                }
            }
        }
    });
    if (hasAutoSubmitted) { list.innerHTML = '<div class="glass-alert danger"><p style="font-weight:bold; margin:0;">Hệ thống đang đồng bộ thu bài tự động...</p></div>'; }
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
};

async function submitAssignment(assignId, isAuto = false) {
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

    // --- KHÓA LỖI NẾU QUÁ HẠN MÀ CỐ TÌNH BẤM NỘP ---
    if (!isAuto && now > endTime && !isRedoing) {
        alert("⚠️ Lỗi: Đã quá thời gian nộp bài (Dù chỉ 1 giây)! Hệ thống lập tức khóa chức năng nộp.");
        loadAssignments(); // Tải lại để ép ẩn đi nút nộp
        return;
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
    if (isAuto) finalAnswerText += "⚠️ [HỆ THỐNG TỰ ĐỘNG THU BÀI DO HẾT GIỜ LÀM]\n\n";
    if (mcText) finalAnswerText += `[PHẦN TRẮC NGHIỆM]\n${mcText}\n\n`;
    if (answer) finalAnswerText += `[PHẦN TỰ LUẬN]\n${answer}`;

    const processSubmission = async (fileData) => {
        const submitNow = new Date();

        let finalFile = fileData;
        if (!fileData && mySub && mySub.file) finalFile = mySub.file;

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
            isAutoSubmitted: isAuto,
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

        if (!isAuto) alert("Nộp bài tập thành công!");
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
        return;
    }

    sortedAssignments.forEach(assign => {
        // THÊM DÒNG NÀY: Lấy điểm chuẩn riêng của từng bài do Giáo viên đã thiết lập
        const passingGrade = assign.passingGrade || 7;

        const sub = submissions.find(s => s.assignmentId === assign.id && s.studentUsername === currentUser.username);

        let studentScore = '-';
        let statusText = 'Chưa nộp';
        let statusClass = 'status-pending';
        let cellBgStyle = '';

        // Đưa việc khai báo tiền lên trước để có thể ghi đè nếu học sinh bị loại do nộp trễ
        let moneyVal = assign.roadmapMoney ? parseInt(assign.roadmapMoney).toLocaleString('vi-VN') + ' đ' : '-';

        if (sub) {
            // KIỂM TRA XEM CÓ ĐƯỢC GIÁO VIÊN THA ĐIỂM THẤP/NỘP TRỄ KHÔNG
            if (sub.forcePass) {
                statusText = 'Đạt';
                statusClass = 'status-done';
                cellBgStyle = 'background: rgba(16, 185, 129, 0.25) !important; color: #047857; font-weight: bold; border-radius: 8px;';
                studentScore = (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') ? parseFloat(sub.grade) : '0';
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
                } else {
                    statusText = 'Loại';
                    statusClass = 'status-pending';
                    cellBgStyle = 'background: rgba(225, 29, 72, 0.2) !important; color: #b91c1c; font-weight: bold; border-radius: 8px;';
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

async function readMultipleFiles(files) {
    const MAX_SIZE_MB = 5; // Giới hạn 5MB mỗi file
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    const promises = Array.from(files).map(file => {
        return new Promise((resolve) => {
            // Kiểm tra dung lượng file trước khi đọc
            if (file.size > MAX_SIZE_BYTES) {
                alert(`⚠️ File "${file.name}" quá lớn (${(file.size / (1024 * 1024)).toFixed(2)}MB).\nCơ sở dữ liệu chỉ cho phép tối đa ${MAX_SIZE_MB}MB/file. Vui lòng nén file lại!`);
                resolve(null); // Trả về null để bỏ qua file này
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve({ name: file.name, type: file.type, base64: e.target.result });
            reader.readAsDataURL(file);
        });
    });

    // Đợi tất cả file đọc xong
    const results = await Promise.all(promises);

    // Lọc bỏ những file bị lỗi (dung lượng quá lớn trả về null ở trên)
    return results.filter(item => item !== null);
}

// THAY THẾ TOÀN BỘ HÀM spinWheel CŨ Ở CUỐI FILE STUDENT.JS BẰNG ĐOẠN NÀY
window.spinWheel = async function () {
    if (window.isGameEnabled === false) {
        alert("🔒 Trò chơi hiện đang bị Giáo viên tạm khóa!");
        closeLuckyWheel(); // Đóng luôn bảng vòng quay
        return;
    }

    if (isSpinning) return;

    // --- 1. KIỂM TRA GIỚI HẠN BẰNG VÉ TỪ ĐIỂM SỐ ---
    const submissions = await getDB('submissions');
    const mySubs = submissions.filter(s => s.studentUsername === currentUser.username && s.grade !== null && s.grade !== undefined && s.grade !== '');

    let totalTickets = 0;
    mySubs.forEach(sub => {
        let score = parseFloat(sub.grade);
        let subTickets = 0;

        // Tính vé cơ bản theo điểm
        if (score === 10) subTickets = 3;
        else if (score > 7) subTickets = 2;
        else if (score > 5) subTickets = 1;

        // Nếu bài này từng bị giáo viên bắt làm lại (có cờ hasRedone)
        // và học sinh có đạt đủ điểm lấy vé, thì phạt trừ đi 1 vé
        if (sub.hasRedone && subTickets > 0) {
            subTickets -= 1;
        }

        totalTickets += subTickets;
    });

    const countSnapshot = await db.ref('spin_counts/' + currentUser.username).once('value');
    let spinTracking = countSnapshot.val() || { count: 0 };
    let usedSpins = spinTracking.count || 0;

    let remainingTickets = totalTickets - usedSpins;

    // Kiểm tra còn vé hay không
    if (remainingTickets <= 0) {
        alert(`⚠️ Bạn đã hết vé quay! Hãy hoàn thành bài tập (trên 5đ = 1 vé, trên 7đ = 2 vé, 10đ = 3 vé) để nhận vé nhé.`);
        closeLuckyWheel();
        return;
    }
    // ------------------------------------------------

    isSpinning = true;

    const wheel = document.getElementById('wheelContainer');
    const resultText = document.getElementById('spinResultText');

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
    else if (rand < (cumulative += p.c100)) {
        targetSlice = 1; finalRewardStr = "100 Coin";
    }
    else if (rand < (cumulative += p.c150)) {
        targetSlice = 3; finalRewardStr = "150 Coin";
    }
    else if (rand < (cumulative += p.c500)) {
        targetSlice = 5; finalRewardStr = "500 Coin";
    }
    else {
        targetSlice = 6; finalRewardStr = "Quà bí ẩn";
    }

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
        resultText.style.transform = 'scale(1.2)';
        resultText.style.color = finalRewardStr.includes('Coin') || finalRewardStr.includes('Bí ẩn') ? '#ffd700' : '#ff4757';
        resultText.innerText = `🎁 KẾT QUẢ: ${finalRewardStr.toUpperCase()}!`;

        setTimeout(() => {
            resultText.style.transform = 'scale(1)';
        }, 300);

        isSpinning = false;

        spinTracking.count = usedSpins + 1;
        await db.ref('spin_counts/' + currentUser.username).set({ count: spinTracking.count });

        // Cập nhật lại giao diện số vé hiển thị trên tiêu đề
        const titleWheel = document.querySelector('#luckyWheelModal h3');
        if (titleWheel) {
            titleWheel.innerHTML = `🎡 Vòng Quay Nhân Phẩm<br><span style="font-size: 0.5em; color: #ffd700; text-transform: none;">🎫 Vé hiện có: ${remainingTickets - 1}</span>`;
        }

        // --- CỘNG TIỀN NẾU TRÚNG COIN ---
        let wonCoins = 0;
        if (finalRewardStr === "100 Coin") wonCoins = 100;
        else if (finalRewardStr === "150 Coin") wonCoins = 150;
        else if (finalRewardStr === "500 Coin") wonCoins = 500;

        if (wonCoins > 0) {
            const coinRef = db.ref('student_coins/' + currentUser.username);
            // Thay once + set bằng transaction
            coinRef.transaction((currentCoins) => {
                return (currentCoins || 0) + wonCoins;
            });
        }
        // --------------------------------

        const recordNow = new Date();
        const currentTimestamp = recordNow.getTime();

        // Push kết quả lên lịch sử
        await pushDB('spin_history', {
            studentName: currentUser.name,
            username: currentUser.username,
            reward: finalRewardStr,
            time: recordNow.toLocaleTimeString('vi-VN') + ' ' + recordNow.toLocaleDateString('vi-VN'),
            timestamp: currentTimestamp
        });

    }, 4050);
};

// ================= HỆ THỐNG VÒNG QUAY MAY MẮN =================
let isSpinning = false;

window.openLuckyWheel = async function () {
    // --- CHỐT CHẶN 1: TỪ CHỐI MỞ BẢNG NẾU GIÁO VIÊN TẮT ---
    if (window.isGameEnabled === false) {
        alert("🔒 Trò chơi hiện đang bị Giáo viên tạm khóa!");
        return;
    }

    // --- LẤY SỐ VÉ HIỆN CÓ ĐỂ HIỂN THỊ ---
    const submissions = await getDB('submissions');
    const mySubs = submissions.filter(s => s.studentUsername === currentUser.username && s.grade !== null && s.grade !== undefined && s.grade !== '');

    let totalTickets = 0;
    mySubs.forEach(sub => {
        let score = parseFloat(sub.grade);
        let subTickets = 0;

        // Tính vé cơ bản theo điểm
        if (score === 10) subTickets = 3;
        else if (score > 7) subTickets = 2;
        else if (score > 5) subTickets = 1;

        // Trừ 1 vé nếu bài này từng bị bắt làm lại
        if (sub.hasRedone && subTickets > 0) {
            subTickets -= 1;
        }

        totalTickets += subTickets;
    });

    const countSnapshot = await db.ref('spin_counts/' + currentUser.username).once('value');
    let spinTracking = countSnapshot.val() || { count: 0 };
    // Lấy tổng số lần đã từng quay (dùng count)
    let usedSpins = spinTracking.count || 0;
    let remainingTickets = totalTickets - usedSpins;

    // Hiển thị số vé lên tiêu đề vòng quay
    const titleWheel = document.querySelector('#luckyWheelModal h3');
    if (titleWheel) {
        titleWheel.innerHTML = `🎡 Vòng Quay Nhân Phẩm<br><span style="font-size: 0.5em; color: #ffd700; text-transform: none;">🎫 Vé hiện có: ${remainingTickets}</span>`;
    }

    document.getElementById('luckyWheelModal').classList.add('active');
};

window.closeLuckyWheel = function () {
    if (isSpinning) return; // Đang quay thì không cho đóng để tránh lỗi
    document.getElementById('luckyWheelModal').classList.remove('active');

    // Reset lại vòng quay và text khi đóng
    const wheel = document.getElementById('wheelContainer');
    const resultText = document.getElementById('spinResultText');
    if (wheel) {
        wheel.style.transition = 'none';
        wheel.style.transform = `rotate(0deg)`;
    }
    if (resultText) {
        resultText.style.opacity = '0';
        resultText.style.transform = 'scale(0.8)';
    }
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