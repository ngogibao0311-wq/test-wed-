const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'teacher') window.location.href = 'index.html';

let attachedFileData = null;
let attachedMaterialFileData = null;

// Biến lưu trữ file cộng dồn
const dtTeacherAssign = new DataTransfer(); // Dùng cho Giao bài
window.teacherGradeDTs = {}; // Dùng cho Chấm bài (nhiều học sinh)

window.handleTeacherFileAccumulate = function (input, subId) {
    if (!window.teacherGradeDTs[subId]) window.teacherGradeDTs[subId] = new DataTransfer();

    const existingNames = Array.from(window.teacherGradeDTs[subId].files).map(f => f.name);

    for (let i = 0; i < input.files.length; i++) {
        if (!existingNames.includes(input.files[i].name)) {
            window.teacherGradeDTs[subId].items.add(input.files[i]);
        }
    }
    input.files = window.teacherGradeDTs[subId].files;
};

window.onload = async function () {
    if (document.getElementById('settingName')) document.getElementById('settingName').value = currentUser.name;
    initFileListener();
    initMaterialFileListener();

    db.ref('profile_requests').on('value', async () => { await loadProfileRequests(); });
    db.ref('submissions').on('value', async () => { await loadSubmissions(); if (document.getElementById('teacherRoadmapBody')) renderTeacherRoadmap(); });
    db.ref('assignments').on('value', async () => { await loadAssignedList(); if (document.getElementById('teacherRoadmapBody')) renderTeacherRoadmap(); });
    db.ref('materials').on('value', async () => { await loadMaterialsListTeacher(); });
    db.ref('users').on('value', async () => { await loadStudentsList(); await populateStudentDropdown(); await populateRoadmapStudentDropdown(); });

    // Lắng nghe cấu hình điểm đạt tối thiểu từ Firebase
    db.ref('roadmap_settings/passingGrade').on('value', (snapshot) => {
        const val = snapshot.val() || 7;
        if (document.getElementById('passingGradeSetting')) document.getElementById('passingGradeSetting').value = val;
        window.currentPassingGrade = parseFloat(val);
        if (document.getElementById('teacherRoadmapBody')) renderTeacherRoadmap();
    });

    // BỔ SUNG: Lắng nghe cấu hình Lịch học
    db.ref('schedule').on('value', async () => {
        if (typeof loadScheduleTeacher === 'function') await loadScheduleTeacher();
    });

    // DÁN ĐOẠN THỜI GIAN THỰC ĐỒNG BỘ NÀY VÀO ĐÂY
    db.ref('game_settings').on('value', (snapshot) => {
        const settings = snapshot.val() || { isOpen: true, lockMessage: '' };
        const toggleInput = document.getElementById('gameToggle');
        const msgArea = document.getElementById('gameLockMessageArea');
        const msgInput = document.getElementById('gameLockMessage');

        if (toggleInput) toggleInput.checked = !!settings.isOpen;
        if (msgInput && !msgInput.matches(':focus')) msgInput.value = settings.lockMessage || '';
        if (msgArea) msgArea.style.display = settings.isOpen ? 'none' : 'block';
    });

    window.wheelProbs = { miss: 50, c100: 20, c150: 25, c500: 4, gift: 1 }; // Mặc định
    db.ref('game_settings/wheel_probabilities').on('value', (snapshot) => {
        if (snapshot.exists()) {
            window.wheelProbs = snapshot.val();
        }
    });

    db.ref('spin_history').on('value', async () => {
        if (typeof loadSpinHistory === 'function') await loadSpinHistory();
    });
    db.ref('game_settings/wheel_probabilities').on('value', (snapshot) => {
        const probs = snapshot.val() || { miss: 50, c100: 20, c150: 25, c500: 4, gift: 1 };
        if (document.getElementById('probMiss')) {
            document.getElementById('probMiss').value = probs.miss;
            document.getElementById('prob100').value = probs.c100;
            document.getElementById('prob150').value = probs.c150;
            document.getElementById('prob500').value = probs.c500;
            document.getElementById('probGift').value = probs.gift;
        }
    });
    // Lắng nghe sự thay đổi biến động Coin để cập nhật bảng quản lý tự động
    db.ref('student_coins').on('value', async () => {
        if (document.getElementById('studentsListContainer')) {
            await loadStudentsList();
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
        return `<div class="video-wrapper"><iframe width="100%" height="315" src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
    }
    return `<div class="video-wrapper"><iframe width="100%" height="315" src="${url}" frameborder="0" allowfullscreen></iframe></div>`;
}

window.toggleAssessmentFields = function () {
    const type = document.getElementById('assessmentType').value;
    const tuLuan = document.getElementById('tuLuanFields');
    const tracNghiem = document.getElementById('tracNghiemFields');
    const scoreDist = document.getElementById('scoreDistributionFields'); // Thêm dòng này

    if (type === 'tu_luan') {
        tuLuan.style.display = 'block'; tracNghiem.style.display = 'none'; scoreDist.style.display = 'none';
    } else if (type === 'trac_nghiem') {
        tuLuan.style.display = 'none'; tracNghiem.style.display = 'block'; scoreDist.style.display = 'none';
    } else {
        tuLuan.style.display = 'block'; tracNghiem.style.display = 'block'; scoreDist.style.display = 'block'; // Hiện chia điểm
    }
};

let questionCount = 0;
let questionIdGen = Date.now(); // Tạo ID duy nhất để gom nhóm nút radio
window.addQuestion = function () {
    questionCount++;
    questionIdGen++;
    const qId = questionIdGen;
    const container = document.getElementById('questionsContainer');
    const div = document.createElement('div');
    div.className = 'question-block';
    div.style.cssText = 'background: rgba(255,255,255,0.6); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1);';
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
            <strong>Câu ${questionCount}:</strong>
            <button type="button" style="background: transparent; color: #ff0844; border: none; padding: 0; font-weight: bold; width: auto; box-shadow: none;" onclick="removeQuestion(this)">Xóa</button>
        </div>
        <input type="text" class="q-text" placeholder="Nhập nội dung câu hỏi..." style="margin-bottom: 10px;">
        <p style="font-size: 0.85em; color: #d35400; margin-bottom: 8px; font-weight: bold;">(Tích chọn nút tròn bên cạnh để đánh dấu đáp án ĐÚNG)</p>
        <div style="display:flex; gap:10px; margin-bottom: 10px;">
            <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                <input type="radio" name="correct_${qId}" value="A" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn A là đáp án đúng">
                <input type="text" class="q-optA" placeholder="A. Đáp án A" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
            </div>
            <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                <input type="radio" name="correct_${qId}" value="B" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn B là đáp án đúng">
                <input type="text" class="q-optB" placeholder="B. Đáp án B" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
            </div>
        </div>
        <div style="display:flex; gap:10px; margin-bottom: 10px;">
            <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                <input type="radio" name="correct_${qId}" value="C" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn C là đáp án đúng">
                <input type="text" class="q-optC" placeholder="C. Đáp án C" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
            </div>
            <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                <input type="radio" name="correct_${qId}" value="D" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn D là đáp án đúng">
                <input type="text" class="q-optD" placeholder="D. Đáp án D" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
            </div>
        </div>
    `;
    container.appendChild(div);
};

async function createAssignment() {
    const title = document.getElementById('title').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const targetStudent = document.getElementById('targetStudent').value;
    const type = document.getElementById('assessmentType').value;
    let desc = '', videoLink = '', attachedFile = null, questions = [];
    let mcWeight = null, essayWeight = null;
    let hideEssayText = false; // Thêm biến cờ trạng thái này

    if (type === 'tu_luan' || type === 'ket_hop') {
        desc = document.getElementById('desc').value;
        videoLink = document.getElementById('videoLink').value.trim();
        hideEssayText = document.getElementById('hideEssayText').checked;

        // Đọc toàn bộ file đính kèm ngay tại lúc bấm nút Phát hành
        const fInput = document.getElementById('fileInput');
        if (fInput && fInput.files.length > 0) {
            attachedFile = await readMultipleFiles(fInput.files);
            // Thêm dòng này để chặn giao bài
            if (attachedFile.length === 0) return;
        } else {
            attachedFile = null;
        }
    }
    if (type === 'trac_nghiem' || type === 'ket_hop') {
        // Thay đoạn lấy dữ liệu cũ thành:
        document.querySelectorAll('.question-block').forEach((block) => {
            const correctRadio = block.querySelector('.q-correct-radio:checked');
            const oldCorrectSelect = block.querySelector('.q-correct'); // Giữ lại dự phòng
            const correctVal = correctRadio ? correctRadio.value : (oldCorrectSelect ? oldCorrectSelect.value : '');

            questions.push({
                qText: block.querySelector('.q-text').value.trim(),
                A: block.querySelector('.q-optA').value.trim(),
                B: block.querySelector('.q-optB').value.trim(),
                C: block.querySelector('.q-optC').value.trim(),
                D: block.querySelector('.q-optD').value.trim(),
                correct: correctVal
            });
        });
        if (questions.length === 0) return alert("Vui lòng thêm ít nhất 1 câu hỏi trắc nghiệm!");
        for (let q of questions) {
            if (!q.qText || !q.A || !q.B || !q.C || !q.D || !q.correct) return alert("Vui lòng điền đầy đủ và chọn đáp án trắc nghiệm!");
        }
    }
    if (!title || !startDate || !endDate) return alert("Vui lòng điền đủ Tiêu đề và Thời hạn!");

    if (type === 'ket_hop') {
        mcWeight = parseFloat(document.getElementById('mcWeight').value);
        essayWeight = parseFloat(document.getElementById('essayWeight').value);
        if (mcWeight + essayWeight !== 10) return alert("Tổng điểm Trắc nghiệm và Tự luận phải đúng bằng 10!");
    }

    await pushDB('assignments', {
        id: Date.now().toString(), title, desc,
        startDate: startDate.replace("T", " "), endDate: endDate.replace("T", " "),
        targetStudent, file: attachedFile, videoLink: videoLink,
        assessmentType: type, questions: questions,
        mcWeight: mcWeight, essayWeight: essayWeight,
        hideEssayText: hideEssayText // Đẩy lên Firebase dữ liệu cấu hình mới
    });

    document.getElementById('title').value = ''; document.getElementById('desc').value = '';
    document.getElementById('startDate').value = ''; document.getElementById('endDate').value = '';
    document.getElementById('videoLink').value = ''; document.getElementById('fileInput').value = '';
    document.getElementById('questionsContainer').innerHTML = ''; questionCount = 0;
    if (document.getElementById('hideEssayText')) document.getElementById('hideEssayText').checked = false; // Reset checkbox
    dtTeacherAssign.items.clear(); attachedFileData = null; alert("Giao bài tập thành công!");
}

async function loadAssignedList() {
    const assignments = await getDB('assignments');
    const container = document.getElementById('assignedListContainer');
    if (!container) return;
    container.innerHTML = '';
    if (assignments.length === 0) { container.innerHTML = '<p style="color: #666; font-style: italic;">Chưa có bài tập nào.</p>'; return; }

    [...assignments].reverse().forEach(assign => {
        let typeText = assign.assessmentType === 'trac_nghiem' ? 'Trắc nghiệm' : (assign.assessmentType === 'ket_hop' ? `Kết hợp (TN: ${assign.mcWeight || 5}đ - TL: ${assign.essayWeight || 5}đ)` : 'Tự luận');
        if (assign.hideEssayText && assign.assessmentType !== 'trac_nghiem') {
            typeText += ' 📁 [Chỉ nhận Tệp]';
        }
        let fileHTML = '';
        if (assign.file) {
            // Hỗ trợ cả bài tập cũ (1 file) và mới (nhiều file)
            let files = Array.isArray(assign.file) ? assign.file : [assign.file];
            files.forEach(f => {
                fileHTML += `<p style="margin-top:10px;"><strong>📎 File đính kèm:</strong> <a href="${f.base64}" download="${f.name}" class="file-download-link">${f.name}</a></p>`;
            });
        }
        let videoHTML = assign.videoLink ? getEmbedHTML(assign.videoLink) : '';
        let quizHTML = '';
        if ((assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop') && assign.questions) {
            quizHTML = `<div style="background: rgba(255,255,255,0.5); padding: 10px; border-radius: 8px; margin-top: 10px;"><strong>Trắc nghiệm:</strong><ul style="margin-left: 20px;">`;
            assign.questions.forEach((q, idx) => { quizHTML += `<li>Câu ${idx + 1}: ${q.qText} <strong>(${q.correct})</strong></li>`; });
            quizHTML += '</ul></div>';
        }
        let tuLuanHTML = (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType) ? `<p style="background: rgba(255,255,255,0.5); padding:15px; border-radius:12px; border-left:4px solid #667eea;"><strong>Yêu cầu Tự luận:</strong><br>${(assign.desc || '').replace(/\n/g, '<br>')}</p>` : '';

        const uniqueId = `teacher-assign-${assign.id}`;
        const div = document.createElement('div'); div.className = 'card accordion-card';
        div.innerHTML = `<div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)"><div class="accordion-title"><h4>${assign.title}</h4><span>Loại: ${typeText}</span></div><div class="accordion-meta"><span>Hạn: <strong>${assign.endDate}</strong></span><span class="toggle-icon">▼</span></div></div>
            <div id="${uniqueId}" class="accordion-content">
                <div style="text-align: right; margin-bottom: 15px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-approve" style="padding: 6px 15px; font-size: 0.9em; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;" onclick="openAssignmentStatusModal('${assign.id}')">📊 Trạng thái</button>
                    <button class="btn-approve" style="padding: 6px 15px; font-size: 0.9em; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white;" onclick="openEditAssignmentModal('${assign._fbKey}')">✏️ Sửa bài</button>
                    <button class="btn-reject" style="padding: 6px 15px; font-size: 0.9em;" onclick="deleteAssignment('${assign._fbKey}')">🗑 Xóa bài</button>
                </div>
                ${videoHTML}
                ${quizHTML}
                ${tuLuanHTML}
                ${fileHTML}
            </div>`;
        container.appendChild(div);
    });
}

// LOGIC XỬ LÝ ĐĂNG TẢI TÀI LIỆU
function initMaterialFileListener() {
    const mInput = document.getElementById('materialFileInput');
    if (!mInput) return;
    mInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) { attachedMaterialFileData = { name: file.name, type: file.type, base64: event.target.result }; };
            reader.readAsDataURL(file);
        } else { attachedMaterialFileData = null; }
    });
}

async function createMaterial() {
    const title = document.getElementById('materialTitle').value.trim();
    const videoLink = document.getElementById('materialVideoLink').value.trim();
    const docLink = document.getElementById('materialLinkInput').value.trim();

    if (!title) return alert("Vui lòng nhập tiêu đề tài liệu!");
    if (!videoLink && !docLink) return alert("Vui lòng đính kèm ít nhất video bài giảng hoặc link tài liệu!");

    const now = new Date();
    await pushDB('materials', {
        id: Date.now().toString(), title, videoLink, docLink,
        uploadTime: now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN')
    });

    // Reset lại form trống
    document.getElementById('materialTitle').value = '';
    document.getElementById('materialVideoLink').value = '';
    document.getElementById('materialLinkInput').value = '';

    // Tự động đóng Popup
    closeMaterialModal();

    alert("Đăng tải tài liệu học tập thành công!");
}

async function loadMaterialsListTeacher() {
    const materials = await getDB('materials');
    const container = document.getElementById('teacherMaterialsContainer');
    if (!container) return;
    container.innerHTML = '';
    if (materials.length === 0) { container.innerHTML = '<p style="color: #666; font-style: italic;">Chưa có tài liệu nào.</p>'; return; }

    [...materials].reverse().forEach(mat => {
        let fileHTML = '';
        if (mat.docLink) {
            // Nút bấm mới sẽ mở trực tiếp trên web bằng target="_blank"
            fileHTML = `<div class="assignment-file" style="margin-top:10px;"><p><strong>📎 Link tài liệu:</strong> <a href="${mat.docLink}" class="file-download-link" target="_blank" rel="noopener">Mở xem trực tiếp trên Web</a></p></div>`;
        } else if (mat.file) {
            // Giữ lại logic này để không bị lỗi với các file bạn đã lỡ đăng tải trước đó
            fileHTML = `<div class="assignment-file" style="margin-top:10px;"><p><strong>📎 Tài liệu đính kèm:</strong> <a href="${mat.file.base64}" download="${mat.file.name}" class="file-download-link">${mat.file.name} (Tải xuống)</a></p></div>`;
        }

        let videoHTML = mat.videoLink ? getEmbedHTML(mat.videoLink) : '';

        const uniqueId = `teacher-mat-${mat.id}`;
        const div = document.createElement('div'); div.className = 'card accordion-card';
        div.innerHTML = `
            <div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)">
                <div class="accordion-title"><h4>${mat.title}</h4><span>🕒 Đăng lúc: ${mat.uploadTime || 'Chưa rõ'}</span></div>
                <div class="accordion-meta"><span class="toggle-icon">▼</span></div>
            </div>
            <div id="${uniqueId}" class="accordion-content">
                <div style="text-align: right; margin-bottom:15px; display: flex; gap: 10px; justify-content: flex-end;">
    <button class="btn-approve" style="padding: 6px 15px; font-size: 0.9em; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white;" onclick="openEditMaterialModal('${mat._fbKey}')">✏️ Đổi tên</button>
    <button class="btn-reject" style="padding: 6px 15px; font-size: 0.9em;" onclick="deleteMaterial('${mat._fbKey}')">🗑 Xóa tài liệu</button>
</div>
                ${videoHTML}${fileHTML}
            </div>`;
        container.appendChild(div);
    });
}

window.deleteMaterial = async function (fbKey) {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu học tập này không?")) return;
    await removeDB('materials', fbKey);
    alert("Đã xóa tài liệu thành công!");
}

async function deleteAssignment(fbKey) {
    if (!confirm("Bạn có chắc chắn muốn xóa bài tập này? (Toàn bộ bài nộp của học sinh cho bài tập này cũng sẽ bị xóa vĩnh viễn)")) return;

    // 1. Lấy danh sách bài tập để tìm ID gốc của bài tập sắp xóa
    const assignments = await getDB('assignments');
    const assignToDelete = assignments.find(a => a._fbKey === fbKey);

    if (!assignToDelete) return; // Nếu không tìm thấy thì thoát

    const assignId = assignToDelete.id; // Lấy custom ID của bài tập

    // 2. Xóa bài tập khỏi database
    await removeDB('assignments', fbKey);

    // 3. Tìm và xóa toàn bộ các bài nộp (submissions) liên quan đến bài tập này
    const submissions = await getDB('submissions');
    const relatedSubmissions = submissions.filter(sub => sub.assignmentId === assignId);

    // Chạy vòng lặp xóa từng bài nộp liên quan
    for (let sub of relatedSubmissions) {
        await removeDB('submissions', sub._fbKey);
    }

    // (Tùy chọn) Xóa luôn cờ lưu trạng thái thu bài tự động dưới LocalStorage để dọn dẹp bộ nhớ máy
    const users = await getDB('users');
    users.forEach(u => {
        if (u.role === 'student') {
            localStorage.removeItem(`auto_sub_${assignId}_${u.username}`);
        }
    });

    alert("Đã xóa bài tập và dọn dẹp các bài nộp liên quan thành công!");
}
function initFileListener() {
    const fInput = document.getElementById('fileInput');
    if (!fInput) return;
    fInput.addEventListener('change', function (e) {
        // Cộng dồn file mới vào danh sách
        const existingNames = Array.from(dtTeacherAssign.files).map(f => f.name);
        for (let i = 0; i < e.target.files.length; i++) {
            if (!existingNames.includes(e.target.files[i].name)) {
                dtTeacherAssign.items.add(e.target.files[i]);
            }
        }
        // Gán ngược danh sách đã cộng dồn vào ô input
        fInput.files = dtTeacherAssign.files;
    });
}

async function populateStudentDropdown() { const users = await getDB('users'); const select = document.getElementById('targetStudent'); if (!select) return; select.innerHTML = '<option value="all">Tất cả học sinh</option>'; users.forEach(u => { if (u.role === 'student') { const opt = document.createElement('option'); opt.value = u.username; opt.innerText = u.name; select.appendChild(opt); } }); }

async function loadSubmissions() {
    const submissions = await getDB('submissions');
    const assignments = await getDB('assignments');
    const list = document.getElementById('submissionsList');
    if (!list) return;
    list.innerHTML = '';

    if (submissions.length === 0) { list.innerHTML = '<p style="color: #666; font-style: italic;">Chưa có bài nộp nào.</p>'; return; }

    [...submissions].reverse().forEach(sub => {
        const assign = assignments.find(a => a.id === sub.assignmentId);
        if (!assign) return;

        let studentFileHTML = '';
        if (sub.file) {
            let sFiles = Array.isArray(sub.file) ? sub.file : [sub.file];
            sFiles.forEach(f => {
                studentFileHTML += `<div style="margin-top: 10px; padding: 8px; background: rgba(102, 126, 234, 0.1); border-radius: 8px;"><p style="margin: 0;"><strong>📎 File HS:</strong> <a href="${f.base64}" download="${f.name}" class="file-download-link">${f.name}</a></p></div>`;
            });
        }

        let previousTeacherFile = '';
        if (sub.teacherFile) {
            let tFiles = Array.isArray(sub.teacherFile) ? sub.teacherFile : [sub.teacherFile];
            tFiles.forEach(f => {
                previousTeacherFile += `<span style="font-size: 0.85em; color: #d35400; font-weight: bold; display: block; margin-bottom: 5px;">✅ Đã gửi file: ${f.name}</span>`;
            });
        }
        const hasGrade = (sub.grade !== null && sub.grade !== undefined && sub.grade !== '');

        let videoHTML = assign.videoLink ? getEmbedHTML(assign.videoLink) : '';

        // XỬ LÝ TRẠNG THÁI "ĐANG LÀM LẠI" VÀ CÁC NÚT THAO TÁC
        let gradeStatus = '';
        let actionHTML = '';

        // Nút tha lỗi (Chỉ xuất hiện nếu bài đang bị đánh dấu nộp trễ/hệ thống tự thu)
        let pardonHTML = '';
        if (sub.isLateFail || sub.isAutoSubmitted) {
            pardonHTML = `<button class="btn-approve" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; margin-left: 5px; border: 2px solid #059669;" onclick="pardonSubmission('${sub._fbKey}')">✨ Tha lỗi (Tính bình thường)</button>`;
        }

        if (sub.isRedoing) {
            gradeStatus = `<span class="status-pending" style="background: rgba(59, 130, 246, 0.15); color: #2563eb;">Đang làm lại</span>`;

            const now = new Date();
            const endTime = assign.endDate ? new Date(assign.endDate.replace(" ", "T")) : new Date("2100-01-01");

            // Nếu học sinh đang làm lại mà bài đã quá hạn gốc -> Hiện nút Thu bài ngay
            if (now > endTime) {
                actionHTML = `<button class="btn-reject" style="width: 100%; padding: 10px;" onclick="forceSubmitRedo('${sub._fbKey}')">🔒 Khóa bài (Thu bài ngay)</button>`;
            } else {
                actionHTML = `<span style="color:#666; font-size:0.9em; font-style:italic;">⏳ Đang đợi học sinh nộp lại...</span>`;
            }
            actionHTML += pardonHTML; // Thêm nút tha lỗi kể cả khi đang làm lại
        } else {
            let regradeStatusText = sub.isRegrading ? " (Đang chấm lại)" : "";
            gradeStatus = hasGrade ? `<span class="status-done">Đã chấm: ${sub.grade} điểm${regradeStatusText}</span>` : `<span class="status-pending">Chưa chấm${regradeStatusText}</span>`;

            actionHTML = `<input type="number" id="grade-${sub.id}" placeholder="Điểm" max="10" min="0" style="margin: 0; width: 90px; text-align: center; font-weight: bold;" value="${hasGrade ? sub.grade : ''}">
                          <button class="btn-approve" onclick="gradeSubmission('${sub.id}')">Lưu điểm</button>
                          <button class="btn-reject" onclick="requestRedo('${sub._fbKey}')">Cho làm lại</button>`;

            // Cơ chế chấm lại: Nếu đã chấm điểm và không nằm trong tiến trình chuẩn bị chấm lại
            if (hasGrade && !sub.isRegrading) {
                actionHTML += `<button class="btn-reject" style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; margin-left: 5px;" onclick="requestRegrade('${sub._fbKey}')">Chấm lại</button>`;
            }
            actionHTML += pardonHTML; // Thêm nút tha lỗi
        }

        const uniqueId = `teacher-sub-${sub.id}`;
        const div = document.createElement('div'); div.className = 'card accordion-card';
        div.innerHTML = `<div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)">
                <div class="accordion-title"><h4>${assign.title}</h4><span>HS: <strong>${sub.studentName}</strong></span></div>
                <div class="accordion-meta"><span>${gradeStatus}</span><span class="toggle-icon">▼</span></div>
            </div>
            <div id="${uniqueId}" class="accordion-content"><span style="color: #888; font-size: 0.85em; display: block; margin-bottom: 10px;">🕒 Lần nộp cuối: ${sub.submitTime || 'Chưa rõ'}</span>${videoHTML}
                <div style="background: rgba(255,255,255,0.4); padding: 15px; border-radius: 12px; margin-bottom: 15px;">
                    <p style="margin: 0; font-weight: bold;">Bài nộp:</p>
                    <p style="white-space: pre-wrap; word-break: break-word; margin-top:5px;">${sub.answer || '<i>(Trống)</i>'}</p>
                    ${studentFileHTML}
                </div>
                <div style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.9);">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                        ${actionHTML}
                    </div>
                    ${!sub.isRedoing ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(0,0,0,0.1);">
                        ${previousTeacherFile}
                        <label style="font-size: 0.9em; display: block; margin-bottom: 8px; font-weight: 700;">Gửi file chữa bài:</label>
                        <input type="file" id="teacherFile-${sub.id}" accept=".docx, .pdf, image/*" multiple onchange="handleTeacherFileAccumulate(this, '${sub.id}')" style="padding: 10px; width: 100%; background: rgba(255,255,255,0.5);">
                        
                        <label style="font-size: 0.9em; display: block; margin-top: 10px; margin-bottom: 8px; font-weight: 700;">Lời nhận xét của giáo viên:</label>
                        <textarea id="teacherComment-${sub.id}" placeholder="Nhập lời nhận xét cho học sinh..." rows="3" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.5);">${sub.teacherComment || ''}</textarea>
                    </div>` : ''}
                </div>
            </div>`;
        list.appendChild(div);
    });
}

async function gradeSubmission(subId) {
    const grade = document.getElementById(`grade-${subId}`).value; if (!grade) return alert("Vui lòng nhập điểm!");
    const commentInput = document.getElementById(`teacherComment-${subId}`);
    const commentVal = commentInput ? commentInput.value : '';

    const fileInput = document.getElementById(`teacherFile-${subId}`);

    const processGrading = async (fileDataArray) => {
        const submissions = await getDB('submissions'); const sub = submissions.find(s => s.id === subId);
        if (sub) {
            const updateObj = { grade: grade, teacherComment: commentVal, isRegrading: false };
            if (fileDataArray) updateObj.teacherFile = fileDataArray;
            await updateDB('submissions', sub._fbKey, updateObj);
            alert("Đã chấm điểm và lưu nhận xét thành công!");
        }
    };

    if (fileInput && fileInput.files.length > 0) {
        const filesArray = await readMultipleFiles(fileInput.files);
        // Thêm dòng này để chặn chấm bài
        if (filesArray.length === 0) return;
        await processGrading(filesArray);
    } else {
        await processGrading(null);
    }
}

window.requestRegrade = async function (subKey) {
    if (confirm("Bạn có chắc chắn muốn tiến hành chấm lại bài này? Kết quả và điểm số hiện tại của học sinh sẽ bị thu hồi tạm thời.")) {
        await updateDB('submissions', subKey, { grade: null, isRegrading: true });
        alert("Đã kích hoạt trạng thái chấm lại! Hệ thống đã ẩn kết quả phía giao diện học sinh.");
    }
}

async function loadStudentsList() {
    const users = await getDB('users');
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const students = users.filter(u => u.role === 'student');
    if (students.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Chưa có học sinh nào.</p>';
        return;
    }

    // LẤY DỮ LIỆU COIN TỪ FIREBASE CỦA TẤT CẢ HỌC SINH
    const coinSnap = await db.ref('student_coins').once('value');
    const coinData = coinSnap.val() || {};

    // THÊM CỘT "SỐ DƯ COIN" VÀO TIÊU ĐỀ BẢNG
    let html = `<div style="overflow-x: auto;"><table style="width:100%; border-collapse: collapse; text-align: left;"><tr style="background:rgba(255,255,255,0.7); border-bottom: 2px solid rgba(0,0,0,0.05);"><th style="padding:15px;">Họ và Tên</th><th style="padding:15px;">Tên đăng nhập</th><th style="padding:15px;">Mật khẩu</th><th style="padding:15px; text-align: center;">Số dư Coin</th><th style="padding:15px; text-align: center;">Thao tác</th></tr>`;

    students.forEach(st => {
        let lockBtnText = st.isLocked ? '🔓 Mở khóa' : '🔒 Khóa';
        let lockBtnStyle = st.isLocked ? 'background: #10b981; color: white;' : 'background: #f59e0b; color: white;';
        let statusText = st.isLocked ? '<br><span style="color: #e11d48; font-size: 0.85em; font-weight: bold;">(Đang bị khóa)</span>' : '';

        // LẤY SỐ COIN TƯƠNG ỨNG VỚI USERNAME (Mặc định là 0 nếu chưa có)
        let studentCoins = coinData[st.username] || 0;

        html += `<tr style="border-bottom: 1px solid rgba(0,0,0,0.05); ${st.isLocked ? 'background: rgba(225, 29, 72, 0.05);' : ''}">
            <td style="padding:12px;"><strong>${st.name}</strong> <br><span style="font-size: 0.85em; color: #666;">Lớp: ${st.classInfo || '---'}</span>${statusText}</td>
            <td style="padding:12px;">${st.username}</td>
            <td style="padding:12px;">${st.password}</td>
            
            <td style="padding:12px; text-align: center; color: #d35400; font-weight: bold; font-size: 1.1em;">
                ${studentCoins.toLocaleString('vi-VN')} 🪙
            </td>

            <td style="padding:12px; text-align: center; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                <button style="padding:5px 12px; font-size: 0.85em; border: none; border-radius: 6px; cursor: pointer; ${lockBtnStyle}" onclick="toggleLockStudent('${st._fbKey}', ${!!st.isLocked})">${lockBtnText}</button>
                <button class="btn-approve" style="padding:5px 12px; font-size: 0.85em; background: #3b82f6; color: white;" onclick="openEditStudentModal('${st._fbKey}')">Sửa</button>
                <button class="btn-reject" style="padding:5px 12px; font-size: 0.85em;" onclick="deleteStudent('${st.username}')">Xóa</button>
            </td>
        </tr>`;
    });
    container.innerHTML = html + '</table></div>';
}

window.toggleLockStudent = async function (userKey, isCurrentlyLocked) {
    const actionText = isCurrentlyLocked ? "MỞ KHÓA" : "KHÓA TẠM THỜI"; if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này không?`)) return;
    await updateDB('users', userKey, { isLocked: !isCurrentlyLocked }); alert(`✅ Đã ${actionText.toLowerCase()} tài khoản thành công!`);
}
async function createStudent() {
    const username = document.getElementById('newStudentUsername').value.trim();
    const password = document.getElementById('newStudentPassword').value.trim();
    const name = document.getElementById('newStudentName').value.trim();
    const classInfo = document.getElementById('newStudentClass').value.trim();
    const hobbies = document.getElementById('newStudentHobbies').value.trim();
    const motto = document.getElementById('newStudentMotto').value.trim();

    if (!username || !password || !name) return alert('Vui lòng điền đủ Tên đăng nhập, Mật khẩu và Họ tên!');

    const users = await getDB('users');
    if (users.find(u => u.username === username)) return alert('Tên đăng nhập đã tồn tại!');

    await pushDB('users', { username, password, name, role: 'student', isLocked: false, classInfo, hobbies, motto });

    document.getElementById('newStudentUsername').value = ''; document.getElementById('newStudentPassword').value = '';
    document.getElementById('newStudentName').value = ''; document.getElementById('newStudentClass').value = '';
    document.getElementById('newStudentHobbies').value = ''; document.getElementById('newStudentMotto').value = '';

    closeStudentModal();
    alert('Đã tạo tài khoản thành công!');
}
async function deleteStudent(username) { if (!confirm(`Xóa tài khoản "${username}"?`)) return; const users = await getDB('users'); const st = users.find(u => u.username === username); if (st) await removeDB('users', st._fbKey); }
async function loadProfileRequests() {
    const requests = await getDB('profile_requests'); const pendingReqs = requests.filter(r => r.status === 'pending'); const card = document.getElementById('requestsCard'); const container = document.getElementById('requestsListContainer');
    if (pendingReqs.length === 0) { card.style.display = 'none'; return; } card.style.display = 'block'; let html = '';
    pendingReqs.forEach(req => { let passInfo = req.newPass ? `<span style="color: #ff0844; font-weight:bold;">Mật khẩu mới: ${req.newPass}</span>` : 'Không đổi'; html += `<div style="background: rgba(255,255,255,0.5); padding: 15px; margin-bottom: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.8);"><p><strong>Học sinh:</strong> ${req.currentName} (<i>${req.username}</i>)</p><p><strong>Đổi tên thành:</strong> <span style="color: #667eea; font-weight:800;">${req.newName}</span></p><p><strong>Mật khẩu:</strong> ${passInfo}</p><div style="margin-top: 15px; display: flex; gap: 10px;"><button onclick="handleRequest('${req._fbKey}', true, '${req.username}', '${req.newName}', '${req.newPass}')" class="btn-approve">✅ Cho phép</button><button onclick="handleRequest('${req._fbKey}', false, '', '', '')" class="btn-reject">❌ Từ chối</button></div></div>`; });
    container.innerHTML = html;
}
async function handleRequest(reqKey, isApprove, username, newName, newPass) {
    if (isApprove) { const users = await getDB('users'); const userRecord = users.find(u => u.username === username); if (userRecord) { const updateData = { name: newName }; if (newPass) updateData.password = newPass; await updateDB('users', userRecord._fbKey, updateData); } await updateDB('profile_requests', reqKey, { status: 'approved' }); }
    else { await updateDB('profile_requests', reqKey, { status: 'rejected' }); }
}
async function updateProfile() {
    const newName = document.getElementById('settingName').value.trim(); const newPass = document.getElementById('settingPass').value.trim(); if (!newName) return alert("Tên hiển thị không được để trống!");
    const users = await getDB('users'); const userRecord = users.find(u => u.username === currentUser.username);
    if (userRecord) { const updateData = { name: newName }; if (newPass) updateData.password = newPass; await updateDB('users', userRecord._fbKey, updateData); currentUser.name = newName; if (newPass) currentUser.password = newPass; localStorage.setItem('currentUser', JSON.stringify(currentUser)); alert("Cập nhật thông tin thành công!"); document.getElementById('settingPass').value = ''; }
}
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
window.requestRedo = async function (subKey) {
    if (confirm("Cấp quyền cho học sinh làm lại bài? Hệ thống sẽ thu hồi điểm/vé cũ (nếu có) và giữ nguyên đáp án để học sinh sửa.")) {
        // Đặt grade = null để thu hồi vé ngay lập tức
        // Bật cờ hasRedone = true để đánh dấu bài này sẽ bị trừ 1 vé khi chấm lại
        await updateDB('submissions', subKey, { 
            isRedoing: true, 
            grade: null, 
            hasRedone: true 
        });
        alert("Đã cấp quyền làm lại bài và thu hồi kết quả cũ!");
    }
}

// ================= HÀM THA LỖI NỘP TRỄ =================
window.pardonSubmission = async function (subKey) {
    if (confirm("Bạn có chắc chắn muốn tha lỗi nộp trễ cho bài này?\n\nHệ thống sẽ gỡ bỏ án phạt, bài làm sẽ được tính điểm và cộng tiền Lộ trình như bình thường.")) {
        // Ghi đè 2 cờ phạt thành false
        await updateDB('submissions', subKey, {
            isLateFail: false,
            isAutoSubmitted: false
        });
        alert("✨ Đã tha lỗi thành công! Lộ trình của học sinh đã được cập nhật lại theo điểm số thực tế.");
    }
};

window.forceSubmitRedo = async function (subKey) {
    if (confirm("Bạn muốn khóa bài ngay lập tức? Học sinh sẽ mất quyền làm tiếp và bài sẽ được thu ngay.")) {
        await updateDB('submissions', subKey, { isRedoing: false });
        alert("Đã khóa bài làm lại!");
    }
}

window.importQuestions = function () {
    let text = document.getElementById('quickImportText').value.trim();
    if (!text) return alert("Vui lòng dán văn bản!");

    // Ép xuống dòng trước các từ khóa Câu, Đáp án và Lựa chọn ABCD để dễ xử lý
    text = text.replace(/(Câu\s*\d+[\.\:\-]?)/gi, '\n$1')
        .replace(/\s+([A-D][\.\:\/\)])/g, '\n$1')
        .replace(/(Đáp án|ĐA|Trả lời)[\s\:\-\.]*([A-D])/gi, '\n$1: $2');

    const lines = text.split(/\r?\n/);
    let currentQ = null;
    const questionsParsed = [];

    // Các bộ lọc nhận diện
    const optionRegex = /^([A-D])[\.\:\/\)]\s*(.*)/i;
    const questionRegex = /^(Câu\s*\d+|Bài\s*\d+|\d+[\.\:\)])/i;
    const answerRegex = /^(?:Đáp án|ĐA|Trả lời)[\s\:\-\.]*([A-D])/i; // Thêm bộ lọc đáp án

    lines.forEach(line => {
        let t = line.trim();
        if (!t) return;

        const optMatch = t.match(optionRegex);
        const ansMatch = t.match(answerRegex);
        const isNewQuestion = questionRegex.test(t) || t.toLowerCase().startsWith('câu');

        if (isNewQuestion || (!optMatch && !ansMatch && !currentQ)) {
            if (currentQ) questionsParsed.push(currentQ);
            // Khởi tạo thêm trường correct rỗng
            currentQ = { text: t, options: { A: '', B: '', C: '', D: '' }, correct: '' };
        }
        else if (ansMatch && currentQ) {
            // Nếu phát hiện dòng đáp án, lấy chữ cái in hoa gán vào correct
            currentQ.correct = ansMatch[1].toUpperCase();
        }
        else if (optMatch && currentQ) {
            const letter = optMatch[1].toUpperCase();
            currentQ.options[letter] = optMatch[2].trim();
        }
        else if (currentQ) {
            // Dồn các text thừa vào đúng chỗ
            if (currentQ.options.D) currentQ.options.D += ' ' + t;
            else if (currentQ.options.C) currentQ.options.C += ' ' + t;
            else if (currentQ.options.B) currentQ.options.B += ' ' + t;
            else if (currentQ.options.A) currentQ.options.A += ' ' + t;
            else currentQ.text += ' ' + t;
        }
    });

    if (currentQ) questionsParsed.push(currentQ);
    if (questionsParsed.length === 0) return alert("Không nhận diện được câu hỏi.");

    const container = document.getElementById('questionsContainer');
    questionsParsed.forEach(q => {
        questionCount++;
        questionIdGen++;
        let qId = questionIdGen;
        let cleanText = q.text.replace(/^(Câu|Bài)\s*\d+[\.\:\-]*\s*/i, '').replace(/^\d+[\.\:\)]\s*/, '').trim();

        // Kiểm tra xem đáp án nào đang được chọn để gắn thẻ 'checked'
        let chkA = q.correct === 'A' ? 'checked' : '';
        let chkB = q.correct === 'B' ? 'checked' : '';
        let chkC = q.correct === 'C' ? 'checked' : '';
        let chkD = q.correct === 'D' ? 'checked' : '';

        const div = document.createElement('div'); div.className = 'question-block'; div.style.cssText = 'background: rgba(255,255,255,0.6); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1); animation: fadeInUp 0.5s ease;';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;"><strong style="color: #764ba2;">Câu ${questionCount}:</strong><button type="button" style="background: transparent; color: #ff0844; border: none; padding: 0; font-weight: bold; width: auto; box-shadow: none;" onclick="removeQuestion(this)">Xóa</button></div>
            <input type="text" class="q-text" value="${cleanText}" style="margin-bottom: 10px;">
            <p style="font-size: 0.85em; color: #d35400; margin-bottom: 8px; font-weight: bold;">(Tích chọn nút tròn bên cạnh để đánh dấu đáp án ĐÚNG)</p>
            <div style="display:flex; gap:10px; margin-bottom: 10px;">
                <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                    <input type="radio" name="correct_${qId}" value="A" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn A là đáp án đúng" ${chkA}>
                    <input type="text" class="q-optA" value="${q.options.A}" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
                </div>
                <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                    <input type="radio" name="correct_${qId}" value="B" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn B là đáp án đúng" ${chkB}>
                    <input type="text" class="q-optB" value="${q.options.B}" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
                </div>
            </div>
            <div style="display:flex; gap:10px; margin-bottom: 10px;">
                <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                    <input type="radio" name="correct_${qId}" value="C" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn C là đáp án đúng" ${chkC}>
                    <input type="text" class="q-optC" value="${q.options.C}" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
                </div>
                <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                    <input type="radio" name="correct_${qId}" value="D" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn D là đáp án đúng" ${chkD}>
                    <input type="text" class="q-optD" value="${q.options.D}" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
                </div>
            </div>`;
        container.appendChild(div);
    });

    document.getElementById('quickImportText').value = '';
    alert(`✅ Đã bóc tách thành công ${questionsParsed.length} câu hỏi!`);
};

window.removeQuestion = function (btnElement) {
    btnElement.closest('.question-block').remove(); const remaining = document.querySelectorAll('.question-block'); questionCount = remaining.length;
    remaining.forEach((block, index) => { const label = block.querySelector('strong'); if (label) label.innerText = `Câu ${index + 1}:`; });
};
// ================= HÀM ĐÓNG / MỞ POPUP TÀI LIỆU =================
window.openMaterialModal = function () {
    document.getElementById('materialModal').classList.add('active');
};
window.closeMaterialModal = function () {
    document.getElementById('materialModal').classList.remove('active');
};
// ================= HÀM ĐÓNG / MỞ POPUP THÊM HỌC SINH =================
window.openStudentModal = function () {
    document.getElementById('studentModal').classList.add('active');
};
window.closeStudentModal = function () {
    document.getElementById('studentModal').classList.remove('active');
};

// Tự động tải danh sách học sinh vào nút mũi tên nhỏ ở cột Số điểm
async function populateRoadmapStudentDropdown() {
    const users = await getDB('users');
    const select = document.getElementById('roadmapStudentSelect');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">Chọn HS</option>';
    users.forEach(u => {
        if (u.role === 'student') {
            const opt = document.createElement('option');
            opt.value = u.username;
            opt.innerText = u.name;
            select.appendChild(opt);
        }
    });
    if (currentVal) select.value = currentVal;
}

// Cập nhật cài đặt điểm chuẩn lên Firebase
async function updatePassingGrade(val) {
    await db.ref('roadmap_settings').update({ passingGrade: val });
}

// Render dữ liệu bảng lộ trình học tập của Giáo viên
async function renderTeacherRoadmap() {
    const body = document.getElementById('teacherRoadmapBody');
    if (!body) return;
    body.innerHTML = '';

    const assignments = await getDB('assignments');
    const submissions = await getDB('submissions');
    const selectedStudent = document.getElementById('roadmapStudentSelect').value;

    // Sắp xếp bài tập thông minh theo số đếm trong Tiêu đề (VD: Bài 1 -> Bài 2 -> Bài 10)
    const sortedAssignments = [...assignments].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi-VN', { numeric: true, sensitivity: 'base' }));

    if (sortedAssignments.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="padding:15px; text-align:center; color:#666; font-style:italic;">Chưa có bài học nào được giao.</td></tr>`;
        return;
    }

    sortedAssignments.forEach(assign => {
        // THÊM DÒNG NÀY: Lấy điều kiện điểm chuẩn của RIÊNG bài tập này (Mặc định là 7 nếu chưa cài)
        const passingGrade = assign.passingGrade || 7;

        let studentScore = '-';
        let statusText = 'Chưa nộp';
        let statusClass = 'status-pending';
        let cellBgStyle = '';
        let pardonBtnHTML = ''; // Biến lưu cấu trúc nút Tha lỗi

        const moneyVal = assign.roadmapMoney || '';
        const conditionVal = assign.roadmapCondition || '';

        let moneyInputHTML = `<input type="number" value="${moneyVal}" placeholder="Số tiền..." 
                onblur="updateAssignmentRoadmap('${assign._fbKey}', 'roadmapMoney', this.value)"
                style="margin:0; padding:6px 10px; font-size:0.9em; min-width:90px; text-align: center; font-weight: bold;">`;

        if (selectedStudent) {
            const sub = submissions.find(s => s.assignmentId === assign.id && s.studentUsername === selectedStudent);
            if (sub) {
                // TRƯỜNG HỢP 1: GIÁO VIÊN ĐÃ ẤN NÚT THA ĐIỂM THẤP (FORCE PASS)
                if (sub.forcePass) {
                    statusText = 'Đạt (Được tha)';
                    statusClass = 'status-done';
                    cellBgStyle = 'background: rgba(16, 185, 129, 0.25) !important; color: #047857; font-weight: bold; border-radius: 8px;';
                    studentScore = (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') ? parseFloat(sub.grade) : '0';
                    pardonBtnHTML = `<br><button onclick="pardonRoadmap('${sub._fbKey}', 'unpardon')" style="margin-top:6px; padding:3px 8px; font-size:0.8em; background:#6b7280; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; width:100%;">Hủy Tha</button>`;
                }
                // TRƯỜNG HỢP 2: BỊ HỆ THỐNG TỰ THU HOẶC GHIM CỜ NỘP TRỄ
                else if (sub.isAutoSubmitted || sub.isLateFail) {
                    statusText = 'Loại';
                    statusClass = 'status-pending';
                    cellBgStyle = 'background: rgba(225, 29, 72, 0.2) !important; color: #b91c1c; font-weight: bold; border-radius: 8px;';
                    studentScore = (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') ? parseFloat(sub.grade) : '0';
                    moneyInputHTML = `<strong style="color: #e11d48; font-size: 1.1em;">0 đ</strong> <span style="font-size:0.75em; color:#666; display:block;">(Nộp trễ)</span>`;
                    pardonBtnHTML = `<br><button onclick="pardonRoadmap('${sub._fbKey}', 'late')" style="margin-top:6px; padding:3px 8px; font-size:0.8em; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; width:100%;">✨ Tha trễ</button>`;
                }
                else if (sub.isRegrading) {
                    statusText = 'Chấm lại';
                    studentScore = '🔄';
                }
                // TRƯỜNG HỢP 3: BÀI LÀM ĐÃ CHẤM ĐIỂM BÌNH THƯỜNG
                else if (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') {
                    studentScore = parseFloat(sub.grade);
                    if (studentScore >= passingGrade) {
                        statusText = 'Đạt';
                        statusClass = 'status-done';
                        cellBgStyle = 'background: rgba(16, 185, 129, 0.25) !important; color: #047857; font-weight: bold; border-radius: 8px;';
                    } else {
                        statusText = 'Loại';
                        statusClass = 'status-pending';
                        cellBgStyle = 'background: rgba(225, 29, 72, 0.2) !important; color: #b91c1c; font-weight: bold; border-radius: 8px;';
                        pardonBtnHTML = `<br><button onclick="pardonRoadmap('${sub._fbKey}', 'score')" style="margin-top:6px; padding:3px 8px; font-size:0.8em; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; width:100%;">✨ Tha điểm</button>`;
                    }
                } else {
                    statusText = 'Chưa chấm';
                }
            }
        } else {
            statusText = 'Chọn HS';
        }

        const conditionSelectHTML = `
        <select onchange="updateAssignmentRoadmap('${assign._fbKey}', 'passingGrade', parseFloat(this.value))" 
            style="width: auto; padding: 4px 8px; margin-bottom: 8px; display: inline-block; font-size: 0.85em; border-radius: 6px; border: 1px solid rgba(0,0,0,0.15); font-weight: bold; color: #764ba2; cursor: pointer; text-align: center;">
            <option value="5" ${passingGrade === 5 ? 'selected' : ''}>≥ 5 (Đạt)</option>
            <option value="6" ${passingGrade === 6 ? 'selected' : ''}>≥ 6 (Đạt)</option>
            <option value="7" ${passingGrade === 7 ? 'selected' : ''}>≥ 7 (Đạt)</option>
            <option value="8" ${passingGrade === 8 ? 'selected' : ''}>≥ 8 (Đạt)</option>
            <option value="9" ${passingGrade === 9 ? 'selected' : ''}>≥ 9 (Đạt)</option>
        </select><br>
    `;

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
        tr.innerHTML = `
        <td style="padding:12px;"><strong>${assign.title}</strong></td>
        <td style="padding:12px; text-align: center;"><strong>${studentScore}</strong></td>
        <td style="padding:12px; text-align: center;">
            ${conditionSelectHTML}
            <span class="${statusClass}">${statusText}</span>
            ${pardonBtnHTML}
        </td>
        <td style="padding:12px; text-align: center; ${cellBgStyle}">
            ${moneyInputHTML}
        </td>
        <td style="padding:12px; font-size:0.85em; color:#555; white-space: nowrap;">${assign.endDate}</td>
        <td style="padding:12px;">
            <input type="text" value="${conditionVal}" placeholder="Nhập điều kiện..." 
                onblur="updateAssignmentRoadmap('${assign._fbKey}', 'roadmapCondition', this.value)"
                style="margin:0; padding:6px 10px; font-size:0.9em; min-width:140px;">
        </td>
    `;
        body.appendChild(tr);
    });
}

// Lưu tự động dữ liệu tiền và điều kiện khi giáo viên gõ xong (Blur chuột ra ngoài)
window.updateAssignmentRoadmap = async function (fbKey, field, value) {
    const updateObj = {};
    updateObj[field] = value;
    await updateDB('assignments', fbKey, updateObj);
    renderTeacherRoadmap();
};

// ================= HÀM THA LỖI TRÊN GIAO DIỆN LỘ TRÌNH =================
window.pardonRoadmap = async function (subKey, mode) {
    if (mode === 'late') {
        if (confirm("Xác nhận tha lỗi nộp trễ cho học sinh?\n\nHệ thống sẽ gỡ bỏ án phạt quá hạn, bài làm sẽ quay về tính trạng thái theo điểm số thực tế.")) {
            await updateDB('submissions', subKey, { isLateFail: false, isAutoSubmitted: false });
            alert("✨ Đã tha lỗi nộp trễ thành công!");
        }
    }
    else if (mode === 'score') {
        if (confirm("Xác nhận tha lỗi điểm thấp cho học sinh?\n\nHệ thống sẽ ép trạng thái bài học này thành 'Đạt' để tính lộ trình cộng tiền bình thường.")) {
            await updateDB('submissions', subKey, { forcePass: true });
            alert("✨ Đã tha lỗi điểm thấp thành công!");
        }
    }
    else if (mode === 'unpardon') {
        if (confirm("Bạn muốn hủy trạng thái tha lỗi điểm thấp cho bài này?")) {
            await updateDB('submissions', subKey, { forcePass: false });
            alert("Đã hủy bỏ trạng thái tha lỗi.");
        }
    }
};

// Biến toàn cục lưu trữ key của bài tập và số thứ tự câu hỏi khi sửa
let currentEditingAssignmentKey = null;
let editQuestionCount = 0;

// MỞ POPUP SỬA BÀI
window.openEditAssignmentModal = async function (fbKey) {
    try {
        currentEditingAssignmentKey = fbKey;
        const assignments = await getDB('assignments');
        const assign = assignments.find(a => a._fbKey === fbKey);
        if (!assign) return alert("Không tìm thấy thông tin bài tập này!");

        // 1. Đổ dữ liệu Thông tin chung
        document.getElementById('editTitle').value = assign.title || '';
        document.getElementById('editStartDate').value = assign.startDate ? assign.startDate.replace(" ", "T") : '';
        document.getElementById('editEndDate').value = assign.endDate ? assign.endDate.replace(" ", "T") : '';

        // Lấy các Section
        const tuLuanSec = document.getElementById('editTuLuanSection');
        const tracNghiemSec = document.getElementById('editTracNghiemSection');
        const weightSec = document.getElementById('editScoreWeightFields');

        // Reset ẩn đi trước
        if (tuLuanSec) tuLuanSec.style.display = 'none';
        if (tracNghiemSec) tracNghiemSec.style.display = 'none';
        if (weightSec) weightSec.style.display = 'none';

        // 2. Xử lý phần Tự Luận
        if (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType) {
            if (tuLuanSec) tuLuanSec.style.display = 'block';
            if (document.getElementById('editDesc')) document.getElementById('editDesc').value = assign.desc || '';
            if (document.getElementById('editVideoLink')) document.getElementById('editVideoLink').value = assign.videoLink || '';
            if (document.getElementById('editHideEssayText')) {
                document.getElementById('editHideEssayText').checked = !!assign.hideEssayText;
            }
        }

        // 3. Xử lý phần Điểm số (Bài kết hợp)
        if (assign.assessmentType === 'ket_hop') {
            if (weightSec) weightSec.style.display = 'block';
            if (document.getElementById('editMcWeight')) document.getElementById('editMcWeight').value = assign.mcWeight || 4;
            if (document.getElementById('editEssayWeight')) document.getElementById('editEssayWeight').value = assign.essayWeight || 6;
        }

        // 4. Xử lý phần Trắc Nghiệm (Load câu hỏi cũ)
        if (assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop') {
            if (tracNghiemSec) tracNghiemSec.style.display = 'block';
            const qContainer = document.getElementById('editQuestionsContainer');
            if (qContainer) {
                qContainer.innerHTML = ''; // Xóa trắng dữ liệu cũ
                editQuestionCount = 0;

                if (assign.questions && assign.questions.length > 0) {
                    assign.questions.forEach(q => addEditQuestionBlock(q));
                }
            }
        }

        document.getElementById('editAssignmentModal').classList.add('active');
    } catch (err) {
        console.log("Lỗi tải popup:", err);
        alert("Có lỗi khi mở cửa sổ chỉnh sửa!");
    }
};

window.addEditQuestionBlock = function (qData = null) {
    editQuestionCount++;
    const container = document.getElementById('editQuestionsContainer');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'edit-question-block';
    div.style.cssText = 'background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 6px rgba(0,0,0,0.02);';

    let qText = qData ? qData.qText : '';
    let optA = qData ? qData.A : '';
    let optB = qData ? qData.B : '';
    let optC = qData ? qData.C : '';
    let optD = qData ? qData.D : '';
    let correct = qData ? qData.correct : '';
    let qId = Date.now() + Math.random();

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
            <strong style="color: #e11d48;">Câu ${editQuestionCount}:</strong>
            <button type="button" style="background: rgba(225, 29, 72, 0.1); color: #e11d48; border: none; padding: 5px 10px; border-radius: 6px; font-weight: bold; width: auto; box-shadow: none; font-size: 0.85em;" onclick="removeEditQuestion(this)">🗑️ Xóa</button>
        </div>
        <input type="text" class="eq-text" value="${qText}" placeholder="Nhập nội dung câu hỏi..." style="margin-bottom: 10px; background: rgba(0,0,0,0.02);">
        <p style="font-size: 0.85em; color: #d35400; margin-bottom: 8px; font-weight: bold;">(Tích chọn nút tròn bên cạnh để đánh dấu đáp án ĐÚNG)</p>
        <div style="display:flex; gap:10px; margin-bottom: 10px;">
            <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.02); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                <input type="radio" name="eq_correct_${qId}" value="A" class="eq-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" ${correct === 'A' ? 'checked' : ''}>
                <input type="text" class="eq-optA" value="${optA}" placeholder="A. Đáp án A" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
            </div>
            <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.02); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                <input type="radio" name="eq_correct_${qId}" value="B" class="eq-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" ${correct === 'B' ? 'checked' : ''}>
                <input type="text" class="eq-optB" value="${optB}" placeholder="B. Đáp án B" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
            </div>
        </div>
        <div style="display:flex; gap:10px; margin-bottom: 10px;">
            <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.02); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                <input type="radio" name="eq_correct_${qId}" value="C" class="eq-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" ${correct === 'C' ? 'checked' : ''}>
                <input type="text" class="eq-optC" value="${optC}" placeholder="C. Đáp án C" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
            </div>
            <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.02); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                <input type="radio" name="eq_correct_${qId}" value="D" class="eq-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" ${correct === 'D' ? 'checked' : ''}>
                <input type="text" class="eq-optD" value="${optD}" placeholder="D. Đáp án D" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
            </div>
        </div>
    `;
    container.appendChild(div);
};

// XÓA CÂU HỎI KHI SỬA
window.removeEditQuestion = function (btnElement) {
    btnElement.closest('.edit-question-block').remove();
    const remaining = document.querySelectorAll('.edit-question-block');
    editQuestionCount = remaining.length;
    remaining.forEach((block, index) => {
        const label = block.querySelector('strong');
        if (label) label.innerText = `Câu ${index + 1}:`;
    });
};

// ĐÓNG POPUP SỬA
window.closeEditAssignmentModal = function () {
    document.getElementById('editAssignmentModal').classList.remove('active');
    currentEditingAssignmentKey = null;
};

// LƯU TOÀN BỘ THAY ĐỔI
window.saveAssignmentEdit = async function () {
    if (!currentEditingAssignmentKey) return;

    const title = document.getElementById('editTitle').value.trim();
    const startDate = document.getElementById('editStartDate').value;
    const endDate = document.getElementById('editEndDate').value;

    if (!title || !startDate || !endDate) return alert("Vui lòng điền đầy đủ Tiêu đề và Thời hạn nộp!");

    const assignments = await getDB('assignments');
    const assign = assignments.find(a => a._fbKey === currentEditingAssignmentKey);
    if (!assign) return;

    const updateObj = {
        title: title,
        startDate: startDate.replace("T", " "),
        endDate: endDate.replace("T", " ")
    };

    // Thu thập dữ liệu Tự Luận
    if (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType) {
        updateObj.desc = document.getElementById('editDesc').value;
        updateObj.videoLink = document.getElementById('editVideoLink').value.trim();
        updateObj.hideEssayText = document.getElementById('editHideEssayText') ? document.getElementById('editHideEssayText').checked : false;
    }

    // Thu thập dữ liệu Điểm số
    if (assign.assessmentType === 'ket_hop') {
        const mcWeight = parseFloat(document.getElementById('editMcWeight').value);
        const essayWeight = parseFloat(document.getElementById('editEssayWeight').value);

        if (isNaN(mcWeight) || isNaN(essayWeight) || (mcWeight + essayWeight !== 10)) {
            return alert("Tổng điểm tối đa của Trắc nghiệm và Tự luận phải bằng 10!");
        }
        updateObj.mcWeight = mcWeight;
        updateObj.essayWeight = essayWeight;
    }

    // Thu thập dữ liệu Trắc Nghiệm
    if (assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop') {
        const editedQuestions = [];
        // Thay đổi phần lấy dữ liệu trong hàm lưu (saveAssignmentEdit):
        document.querySelectorAll('.edit-question-block').forEach((block) => {
            const correctRadio = block.querySelector('.eq-correct-radio:checked');
            const oldCorrectSelect = block.querySelector('.eq-correct');
            const correctVal = correctRadio ? correctRadio.value : (oldCorrectSelect ? oldCorrectSelect.value : '');

            editedQuestions.push({
                qText: block.querySelector('.eq-text').value.trim(),
                A: block.querySelector('.eq-optA').value.trim(),
                B: block.querySelector('.eq-optB').value.trim(),
                C: block.querySelector('.eq-optC').value.trim(),
                D: block.querySelector('.eq-optD').value.trim(),
                correct: correctVal
            });
        });

        if (editedQuestions.length === 0) return alert("Vui lòng để lại ít nhất 1 câu hỏi trắc nghiệm!");
        for (let q of editedQuestions) {
            if (!q.qText || !q.A || !q.B || !q.C || !q.D || !q.correct) {
                return alert("Vui lòng điền đầy đủ nội dung và chọn đáp án đúng cho TẤT CẢ câu hỏi trắc nghiệm!");
            }
        }
        updateObj.questions = editedQuestions;
    }

    // Đẩy lên Firebase
    await updateDB('assignments', currentEditingAssignmentKey, updateObj);
    closeEditAssignmentModal();
    alert("Đã cập nhật toàn bộ nội dung bài tập thành công!");

    // Ép render lại danh sách
    loadAssignedList();
};

// ================= HÀM ĐÓNG / MỞ POPUP TRẠNG THÁI LÀM BÀI =================
window.openAssignmentStatusModal = async function (assignId) {
    const modal = document.getElementById('assignmentStatusModal');
    const container = document.getElementById('assignmentStatusContainer');

    // Hiển thị loading trong lúc fetch dữ liệu
    container.innerHTML = '<p style="text-align: center; color: #666;">⏳ Đang tải dữ liệu trạng thái...</p>';
    modal.classList.add('active');

    // Tải dữ liệu từ database
    const assignments = await getDB('assignments');
    const users = await getDB('users');
    const submissions = await getDB('submissions');

    // Tìm bài tập hiện tại
    const assign = assignments.find(a => a.id === assignId);
    if (!assign) {
        container.innerHTML = '<p style="color: red;">Không tìm thấy thông tin bài tập.</p>';
        return;
    }

    // Lọc ra danh sách học sinh được giao bài này
    const students = users.filter(u => u.role === 'student' && (assign.targetStudent === 'all' || assign.targetStudent === u.username));

    if (students.length === 0) {
        container.innerHTML = '<p>Không có học sinh nào được giao bài tập này.</p>';
        return;
    }

    // Lấy mốc thời gian
    const now = new Date();
    const startTime = assign.startDate ? new Date(assign.startDate.replace(" ", "T")) : new Date(0);
    const endTime = assign.endDate ? new Date(assign.endDate.replace(" ", "T")) : new Date("2100-01-01");

    // Tạo bảng hiển thị
    let html = '<table style="width:100%; border-collapse: collapse; text-align: left;">';
    html += '<tr style="background:rgba(255,255,255,0.7); border-bottom: 2px solid rgba(0,0,0,0.05);"><th style="padding:12px;">Học sinh</th><th style="padding:12px; text-align:center;">Trạng thái</th></tr>';

    students.forEach(st => {
        // Kiểm tra xem học sinh này đã nộp bài chưa
        const sub = submissions.find(s => s.assignmentId === assignId && s.studentUsername === st.username);

        let statusText = '';
        let statusBg = '';
        let statusColor = '';

        if (sub) {
            statusText = '✅ Đã nộp';
            statusBg = 'rgba(16, 185, 129, 0.15)'; // Nền Xanh lá
            statusColor = '#059669';
        } else {
            if (now < startTime) {
                statusText = '⏳ Chưa thi';
                statusBg = 'rgba(245, 158, 11, 0.15)'; // Nền Cam
                statusColor = '#d97706';
            } else if (now >= startTime && now <= endTime) {
                statusText = '✍️ Đang thi';
                statusBg = 'rgba(59, 130, 246, 0.15)'; // Nền Xanh dương
                statusColor = '#2563eb';
            } else {
                // Thêm trường hợp hết hạn nhưng hệ thống chưa kịp tự thu bài
                statusText = '⚠️ Quá hạn (Chưa nộp)';
                statusBg = 'rgba(225, 29, 72, 0.15)'; // Nền Đỏ
                statusColor = '#e11d48';
            }
        }

        html += `<tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
            <td style="padding:12px; color: #2c3e50;"><strong>${st.name}</strong> <br><span style="font-size: 0.85em; color: #888;">${st.username}</span></td>
            <td style="padding:12px; text-align:center;">
                <span style="color: ${statusColor}; background: ${statusBg}; padding: 6px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 800;">
                    ${statusText}
                </span>
            </td>
        </tr>`;
    });

    html += '</table>';
    container.innerHTML = html;
};

window.closeAssignmentStatusModal = function () {
    document.getElementById('assignmentStatusModal').classList.remove('active');
};

window.openEditStudentModal = async function (fbKey) {
    const users = await getDB('users');
    const st = users.find(u => u._fbKey === fbKey);
    if (!st) return;

    document.getElementById('editStudentKey').value = st._fbKey;
    document.getElementById('editStudentName').value = st.name || '';
    document.getElementById('editStudentPassword').value = '';
    document.getElementById('editStudentClass').value = st.classInfo || '';
    document.getElementById('editStudentHobbies').value = st.hobbies || '';
    document.getElementById('editStudentMotto').value = st.motto || '';

    document.getElementById('editStudentModal').classList.add('active');
};
window.closeEditStudentModal = function () { document.getElementById('editStudentModal').classList.remove('active'); };

window.saveStudentEdit = async function () {
    const fbKey = document.getElementById('editStudentKey').value;
    const name = document.getElementById('editStudentName').value.trim();
    const password = document.getElementById('editStudentPassword').value.trim();
    const classInfo = document.getElementById('editStudentClass').value.trim();
    const hobbies = document.getElementById('editStudentHobbies').value.trim();
    const motto = document.getElementById('editStudentMotto').value.trim();

    if (!name) return alert('Họ tên không được để trống!');

    const updateObj = { name, classInfo, hobbies, motto };
    if (password) updateObj.password = password; // Chỉ cập nhật mật khẩu nếu có nhập

    await updateDB('users', fbKey, updateObj);
    closeEditStudentModal();
    alert('Cập nhật thông tin học sinh thành công!');
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

window.openScheduleModal = function (fbKey = '', day = '', time = '', subject = '', note = '') {
    document.getElementById('editScheduleKey').value = fbKey;
    document.getElementById('scheduleDay').value = day;
    document.getElementById('scheduleTime').value = time;
    document.getElementById('scheduleSubject').value = subject;
    document.getElementById('scheduleNote').value = note;
    document.getElementById('scheduleModal').classList.add('active');
};

window.closeScheduleModal = function () {
    document.getElementById('scheduleModal').classList.remove('active');
};

window.saveSchedule = async function () {
    const fbKey = document.getElementById('editScheduleKey').value;
    const day = document.getElementById('scheduleDay').value.trim();
    const time = document.getElementById('scheduleTime').value.trim();
    const subject = document.getElementById('scheduleSubject').value.trim();
    const note = document.getElementById('scheduleNote').value.trim();

    if (!day || !time || !subject) return alert('Vui lòng nhập đầy đủ: Thứ, Thời gian và Nội dung!');

    const payload = { day, time, subject, note };

    if (fbKey) {
        await updateDB('schedule', fbKey, payload);
        alert('Cập nhật lịch học thành công!');
    } else {
        payload.id = Date.now().toString();
        await pushDB('schedule', payload);
        alert('Đã thêm lịch học mới thành công!');
    }
    closeScheduleModal();
};

window.deleteSchedule = async function (fbKey) {
    if (confirm('Bạn có chắc chắn muốn xóa mục lịch học này khỏi thời khóa biểu?')) {
        await removeDB('schedule', fbKey);
        alert('Xóa thành công!');
    }
};

window.loadScheduleTeacher = async function () {
    const schedules = await getDB('schedule');
    const tbody = document.getElementById('teacherScheduleBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (schedules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:15px; text-align:center; color:#666; font-style:italic;">Chưa có lịch học nào. Nhấn "Thêm lịch học" để bắt đầu tạo.</td></tr>`;
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
            <td style="padding:12px; text-align:center;">
                <button class="btn-approve" style="padding:5px 12px; font-size:0.85em; background: #3b82f6; color: white;" onclick="openScheduleModal('${s._fbKey}', '${s.day}', '${s.time}', '${s.subject}', '${s.note}')">Sửa</button>
                <button class="btn-reject" style="padding:5px 12px; font-size:0.85em;" onclick="deleteSchedule('${s._fbKey}')">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

// ================= HÀM ĐÓNG / MỞ VÀ LƯU POPUP SỬA TÊN TÀI LIỆU =================
window.openEditMaterialModal = async function (fbKey) {
    const materials = await getDB('materials');
    const mat = materials.find(m => m._fbKey === fbKey);
    if (!mat) return alert("Không tìm thấy thông tin tài liệu!");

    // Gán dữ liệu cũ vào form
    document.getElementById('editMaterialKey').value = fbKey;
    document.getElementById('editMaterialTitle').value = mat.title || '';

    document.getElementById('editMaterialModal').classList.add('active');
};

window.closeEditMaterialModal = function () {
    document.getElementById('editMaterialModal').classList.remove('active');
};

window.saveMaterialEdit = async function () {
    const fbKey = document.getElementById('editMaterialKey').value;
    const newTitle = document.getElementById('editMaterialTitle').value.trim();

    if (!newTitle) return alert("Vui lòng nhập tên tài liệu mới!");

    // Cập nhật lên Firebase
    await updateDB('materials', fbKey, { title: newTitle });

    closeEditMaterialModal();
    alert("Đã đổi tên tài liệu thành công!");
};

// Hàm hỗ trợ đọc nhiều file sang Base64
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

// DÁN VÀO DÒNG CUỐI CÙNG CỦA FILE TEACHER.JS
window.toggleGameStatus = async function (isOpen) {
    await db.ref('game_settings').update({ isOpen: isOpen });
    const msgArea = document.getElementById('gameLockMessageArea');
    if (msgArea) msgArea.style.display = isOpen ? 'none' : 'block';
};

window.saveGameLockMessage = async function () {
    const msg = document.getElementById('gameLockMessage').value.trim();
    if (!msg) return alert("Vui lòng nhập nội dung thông báo khóa mục trò chơi!");

    await db.ref('game_settings').update({ lockMessage: msg });
    alert("🔒 Đã khóa mục trò chơi học sinh và gửi thông báo thành công!");
};

// ================= QUẢN LÝ VÒNG QUAY MAY MẮN =================

window.loadSpinHistory = async function () {
    const history = await getDB('spin_history');
    const tbody = document.getElementById('spinHistoryBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding:15px; text-align:center; color:#666; font-style:italic;">Chưa có học sinh nào tham gia vòng quay.</td></tr>`;
        return;
    }

    // Sắp xếp mảng để kết quả mới nhất luôn nằm trên cùng (Dựa vào timestamp)
    const sortedHistory = [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    sortedHistory.forEach((record, index) => {
        let isWin = record.reward.includes('Coin') || record.reward.includes('Quà');
        let rewardColor = isWin ? '#059669' : '#888';
        let rewardBg = isWin ? 'rgba(16, 185, 129, 0.15)' : 'transparent';

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(0,0,0,0.05)';

        // Nếu là dòng thứ 6 trở đi thì gán class ẩn đi
        if (index >= 5) {
            tr.classList.add('hidden-spin-row');
            tr.style.display = 'none';
        }

        tr.innerHTML = `
            <td style="padding:12px; font-weight:bold; color:#2c3e50;">${record.studentName}</td>
            <td style="padding:12px; text-align: center; color:#666; font-size: 0.9em;">${record.time}</td>
            <td style="padding:12px;">
                <span style="color: ${rewardColor}; background: ${rewardBg}; padding: 6px 12px; border-radius: 20px; font-weight: bold;">
                    ${record.reward}
                </span>
            </td>
            <td style="padding:12px; text-align: center;">
                <button class="btn-reject" style="padding: 5px 12px; font-size: 0.85em;" onclick="deleteSpinRecord('${record._fbKey}')">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Nếu có nhiều hơn 5 dòng, in ra nút "Xem thêm"
    if (sortedHistory.length > 5) {
        const btnRow = document.createElement('tr');
        btnRow.id = "toggleSpinBtnRow";
        btnRow.innerHTML = `
            <td colspan="4" style="text-align: center; padding: 15px; background: #f8f9fa;">
                <button id="toggleSpinBtn" onclick="toggleSpinHistoryRows()" style="background: transparent; border: 1px dashed #059669; color: #059669; padding: 8px 20px; border-radius: 20px; cursor: pointer; font-size: 0.95em; font-weight: bold; transition: all 0.2s;">
                    👇 Xem thêm ${sortedHistory.length - 5} lịch sử cũ hơn
                </button>
            </td>
        `;
        tbody.appendChild(btnRow);
    }
};

// Hàm xử lý khi bấm nút Xem thêm / Thu gọn
window.toggleSpinHistoryRows = function () {
    const hiddenRows = document.querySelectorAll('.hidden-spin-row');
    const btn = document.getElementById('toggleSpinBtn');
    if (hiddenRows.length === 0) return;

    // Kiểm tra xem dòng đầu tiên đang ẩn hay hiện
    const isCurrentlyHidden = hiddenRows[0].style.display === 'none';

    hiddenRows.forEach(row => {
        row.style.display = isCurrentlyHidden ? 'table-row' : 'none';
    });

    if (isCurrentlyHidden) {
        btn.innerHTML = `👆 Thu gọn danh sách`;
        btn.style.borderColor = '#e11d48';
        btn.style.color = '#e11d48';
    } else {
        btn.innerHTML = `👇 Xem thêm ${hiddenRows.length} lịch sử cũ hơn`;
        btn.style.borderColor = '#059669';
        btn.style.color = '#059669';
    }
};

window.deleteSpinRecord = async function (fbKey) {
    if (confirm("Xóa lịch sử quay này?")) {
        await removeDB('spin_history', fbKey);
    }
};

window.saveWheelProbabilities = async function () {
    const miss = parseInt(document.getElementById('probMiss').value) || 0;
    const c100 = parseInt(document.getElementById('prob100').value) || 0;
    const c150 = parseInt(document.getElementById('prob150').value) || 0;
    const c500 = parseInt(document.getElementById('prob500').value) || 0;
    const gift = parseInt(document.getElementById('probGift').value) || 0;

    const total = miss + c100 + c150 + c500 + gift;
    const errorMsg = document.getElementById('probErrorMsg');

    if (total !== 100) {
        errorMsg.innerText = `❌ LỖI: Tổng tỉ lệ đang là ${total}%. Vui lòng điều chỉnh lại cho đúng bằng 100%!`;
        errorMsg.style.display = 'block';
        return;
    }

    errorMsg.style.display = 'none';
    await db.ref('game_settings/wheel_probabilities').set({
        miss: miss, c100: c100, c150: c150, c500: c500, gift: gift
    });
    alert('✅ Đã áp dụng tỉ lệ Vòng quay mới cho toàn bộ học sinh!');
};