const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'teacher') window.location.href = 'index.html';

let cacheAssignmentsSt = "";
let cacheSubmissionsSt = "";

let attachedFileData = null;
let attachedMaterialFileData = null;

// Biến lưu trữ file cộng dồn
const dtTeacherAssign = new DataTransfer(); // Dùng cho Giao bài
window.teacherGradeDTs = {}; // Dùng cho Chấm bài (nhiều học sinh)

window.handleTeacherFileAccumulate = function (input, subId) {
    if (!window.teacherGradeDTs[subId]) window.teacherGradeDTs[subId] = new DataTransfer();
    const existingFiles = Array.from(window.teacherGradeDTs[subId].files).map(f => f.name + '_' + f.size);
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // Giới hạn 5MB

    let hasOversize = false;
    for (let i = 0; i < input.files.length; i++) {
        // Chặn file quá nặng ngay từ lúc chọn
        if (input.files[i].size > MAX_SIZE_BYTES) {
            alert(`⚠️ File "${input.files[i].name}" quá lớn (${(input.files[i].size / (1024 * 1024)).toFixed(2)}MB). Hệ thống chỉ cho phép tối đa 5MB/file và đã tự động loại bỏ file này!`);
            hasOversize = true;
            continue;
        }
        const fileKey = input.files[i].name + '_' + input.files[i].size;
        if (!existingFiles.includes(fileKey)) {
            window.teacherGradeDTs[subId].items.add(input.files[i]);
        }
    }
    input.files = window.teacherGradeDTs[subId].files;

    if (hasOversize && window.teacherGradeDTs[subId].files.length === 0) {
        input.value = '';
    }
};

window.onload = async function () {
    let realUsers = await getDB('users');
    let realUser = realUsers.find(u => u.username === currentUser.username);
    if (!realUser || realUser.role !== 'teacher') {
        alert("⛔ Phát hiện can thiệp dữ liệu! Buộc đăng xuất.");
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return;
    }
    if (document.getElementById('settingName')) document.getElementById('settingName').value = currentUser.name;
    initFileListener();
    initMaterialFileListener();

    // === TỐI ƯU HÓA HIỆU SUẤT (BỘ ĐỆM CACHE) ===
    let cacheProfile = "", cacheSubmissions = "", cacheAssignments = "", cacheMaterials = "", cacheUsers = "";

    db.ref('profile_requests').on('value', async (snapshot) => {
        const hash = JSON.stringify(snapshot.val());
        if (hash !== cacheProfile) { cacheProfile = hash; await loadProfileRequests(); }
    });
    db.ref('assignments').on('value', async (snapshot) => {
        const hash = JSON.stringify(snapshot.val());
        if (hash !== cacheAssignmentsSt) { 
            cacheAssignmentsSt = hash; 
            window.cachedAssignments = snapshot.val() ? Object.values(snapshot.val()) : []; 
            // Sửa tại đây: Gọi đúng hàm loadAssignedList() thay vì loadAssignments()
            await loadAssignedList(); 
            if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap(); 
        }
    });

    db.ref('submissions').on('value', async (snapshot) => {
        const hash = JSON.stringify(snapshot.val());
        if (hash !== cacheSubmissionsSt) { 
            cacheSubmissionsSt = hash; 
            window.cachedSubmissions = snapshot.val() ? Object.values(snapshot.val()) : []; 
            // Sửa tại đây: Gọi đúng hàm loadSubmissions() thay vì loadAssignments()
            await loadSubmissions(); 
            if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap(); 
        }
    });
    db.ref('materials').on('value', async (snapshot) => {
        const hash = JSON.stringify(snapshot.val());
        if (hash !== cacheMaterials) { cacheMaterials = hash; await loadMaterialsListTeacher(); }
    });
    db.ref('users').on('value', async (snapshot) => {
        const hash = JSON.stringify(snapshot.val());
        if (hash !== cacheUsers) { cacheUsers = hash; await loadStudentsList(); await populateStudentDropdown(); await populateRoadmapStudentDropdown(); }
    });
    // ============================================

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
        
        // Khai báo biến toàn cục để hệ thống chẩn đoán nhận diện được
        window.isGameEnabled = settings.isOpen; 

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

    db.ref('store_settings').on('value', (snapshot) => {
        const settings = snapshot.val();

        // ---> THÊM 4 DÒNG NÀY ĐỂ ĐỒNG BỘ NÚT TICK TỪ FIREBASE <---
        const storeToggleInput = document.getElementById('storeToggle');
        if (storeToggleInput && settings !== null && settings.isOpen !== undefined) {
            storeToggleInput.checked = settings.isOpen;
        }

        if (settings) {
            StoreConfig.items.forEach(item => {
                if (settings[item.id]) {
                    if (settings[item.id].price !== undefined) item.price = settings[item.id].price;
                    if (settings[item.id].startDate !== undefined) item.startDate = settings[item.id].startDate;
                    if (settings[item.id].endDate !== undefined) item.endDate = settings[item.id].endDate;
                    item.isLocked = !!settings[item.id].isLocked; // ĐỒNG BỘ TRẠNG THÁI KHÓA
                }
            });
            if (typeof initTeacherStoreManagement === 'function') {
                initTeacherStoreManagement();
            }
        }
    });

    // (Bổ sung) Lắng nghe giáo viên nhập điểm để tự ẩn/hiện phần câu hỏi
    const mcInput = document.getElementById('mcWeight');
    const essayInput = document.getElementById('essayWeight');
    if (mcInput) mcInput.addEventListener('input', window.updateExamFields);
    if (essayInput) essayInput.addEventListener('input', window.updateExamFields);

    const editMcInput = document.getElementById('editMcWeight');
    const editEssayInput = document.getElementById('editEssayWeight');
    if (editMcInput) editMcInput.addEventListener('input', window.updateEditExamFields);
    if (editEssayInput) editEssayInput.addEventListener('input', window.updateEditExamFields);
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

// Hàm tự động ẩn/hiện giao diện tạo câu hỏi khi nhập điểm Thi
window.updateExamFields = function () {
    const type = document.getElementById('assessmentType').value;
    if (type !== 'thi') return;

    const mcWeight = parseFloat(document.getElementById('mcWeight').value) || 0;
    const essayWeight = parseFloat(document.getElementById('essayWeight').value) || 0;

    const tuLuan = document.getElementById('tuLuanFields');
    const tracNghiem = document.getElementById('tracNghiemFields');

    if (mcWeight > 0 && essayWeight === 0) {
        if (tracNghiem) tracNghiem.style.display = 'block';
        if (tuLuan) tuLuan.style.display = 'none';
    } else if (essayWeight > 0 && mcWeight === 0) {
        if (tracNghiem) tracNghiem.style.display = 'none';
        if (tuLuan) tuLuan.style.display = 'block';
    } else {
        if (tracNghiem) tracNghiem.style.display = 'block';
        if (tuLuan) tuLuan.style.display = 'block';
    }
};

window.updateEditExamFields = function () {
    const mcWeight = parseFloat(document.getElementById('editMcWeight').value) || 0;
    const essayWeight = parseFloat(document.getElementById('editEssayWeight').value) || 0;

    const tuLuan = document.getElementById('editTuLuanSection');
    const tracNghiem = document.getElementById('editTracNghiemSection');

    if (mcWeight > 0 && essayWeight === 0) {
        if (tracNghiem) tracNghiem.style.display = 'block';
        if (tuLuan) tuLuan.style.display = 'none';
    } else if (essayWeight > 0 && mcWeight === 0) {
        if (tracNghiem) tracNghiem.style.display = 'none';
        if (tuLuan) tuLuan.style.display = 'block';
    } else {
        if (tracNghiem) tracNghiem.style.display = 'block';
        if (tuLuan) tuLuan.style.display = 'block';
    }
};

window.toggleAssessmentFields = function () {
    const type = document.getElementById('assessmentType').value;
    const tuLuan = document.getElementById('tuLuanFields');
    const tracNghiem = document.getElementById('tracNghiemFields');
    const scoreDist = document.getElementById('scoreDistributionFields');
    const videoGroup = document.getElementById('videoLinkGroup'); // Gọi div chứa video

    if (type === 'tu_luan') {
        tuLuan.style.display = 'block'; tracNghiem.style.display = 'none'; scoreDist.style.display = 'none';
        if (videoGroup) videoGroup.style.display = 'block';
    } else if (type === 'trac_nghiem') {
        tuLuan.style.display = 'none'; tracNghiem.style.display = 'block'; scoreDist.style.display = 'none';
    } else if (type === 'ket_hop') {
        tuLuan.style.display = 'block'; tracNghiem.style.display = 'block'; scoreDist.style.display = 'block';
        if (videoGroup) videoGroup.style.display = 'block';
    } else if (type === 'thi') {
        scoreDist.style.display = 'block';
        if (videoGroup) videoGroup.style.display = 'none'; // Ẩn hoàn toàn mục video
        window.updateExamFields(); // Kích hoạt ẩn/hiện động dựa trên số điểm
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
    let hideEssayText = false;

    // BƯỚC 1: XỬ LÝ ĐIỂM SỐ TRƯỚC (Gỡ bỏ bắt buộc bằng 10 cho hệ thi)
    if (type === 'ket_hop' || type === 'thi') {
        mcWeight = parseFloat(document.getElementById('mcWeight').value) || 0;
        essayWeight = parseFloat(document.getElementById('essayWeight').value) || 0;

        if (type === 'ket_hop' && (mcWeight + essayWeight !== 10)) {
            return alert("Tổng điểm Trắc nghiệm và Tự luận trong loại hình Kết hợp phải đúng bằng 10!");
        }
        if (type === 'thi' && mcWeight === 0 && essayWeight === 0) {
            return alert("Vui lòng nhập điểm tối đa cho phần Trắc nghiệm hoặc Tự luận!");
        }
    }

    // BƯỚC 2: XỬ LÝ DỮ LIỆU TỰ LUẬN
    const hasEssay = type === 'tu_luan' || type === 'ket_hop' || (type === 'thi' && essayWeight > 0);
    if (hasEssay) {
        desc = document.getElementById('desc').value;
        videoLink = (type === 'thi') ? '' : document.getElementById('videoLink').value.trim();
        hideEssayText = document.getElementById('hideEssayText').checked;

        const fInput = document.getElementById('fileInput');
        if (fInput && fInput.files.length > 0) {
            attachedFile = await readMultipleFiles(fInput.files);
            if (attachedFile.length === 0) return;
        } else {
            attachedFile = null;
        }
    }

    // BƯỚC 3: XỬ LÝ DỮ LIỆU TRẮC NGHIỆM
    const hasMC = type === 'trac_nghiem' || type === 'ket_hop' || (type === 'thi' && mcWeight > 0);
    if (hasMC) {
        document.querySelectorAll('.question-block').forEach((block) => {
            const correctRadio = block.querySelector('.q-correct-radio:checked');
            const oldCorrectSelect = block.querySelector('.q-correct');
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
        if (mcWeight + essayWeight !== 10) return alert("Tổng điểm Trắc nghiệm và Tự luận trong loại hình Kết hợp phải đúng bằng 10!");
    } else if (type === 'thi') {
        // Hệ thi sẽ bỏ qua bắt buộc tổng bằng 10, chỉ lưu lại giá trị điểm
        mcWeight = parseFloat(document.getElementById('mcWeight').value) || 0;
        essayWeight = parseFloat(document.getElementById('essayWeight').value) || 0;
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
    const submissions = await getDB('submissions'); // Lấy thêm submissions để phục vụ điều kiện Đang chấm/Làm lại
    const container = document.getElementById('assignedListContainer');
    
    if (!container) return;
    container.innerHTML = '';
    
    if (assignments.length === 0) { 
        container.innerHTML = '<p style="color: #666; font-style: italic;">Chưa có bài tập nào.</p>'; 
        return; 
    }

    // --- BẮT ĐẦU LOGIC SẮP XẾP ---
    const nowSort = new Date();
    assignments.sort((a, b) => {
        const getSortVals = (assign) => {
            const end = assign.endDate ? new Date(assign.endDate.replace(" ", "T")) : new Date("2100-01-01");
            const relatedSubs = submissions.filter(s => s.assignmentId === assign.id);
            
            let rank = 2; // Nhóm 2: Các bài đã ổn định, xong xuôi
            let isActive = nowSort <= end;
            
            // Nhóm 1: Ưu tiên cao
            if (isActive) rank = 1; // Mới giao, Đang diễn ra
            
            let isRedoing = relatedSubs.some(s => s.isRedoing);
            let needsGrading = relatedSubs.some(s => !s.isRedoing && !s.isAutoSubmitted && !s.isLateFail && (s.grade === null || s.grade === undefined || s.grade === ''));
            
            if (isRedoing || needsGrading) rank = 1; // Có HS đang làm lại hoặc chờ chấm bài
            
            // Xử lý lấy số "Bài N" (Nếu không có số, mặc định là 0 để đẩy lên trước các Bài N)
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
        // 3. Dựa theo Tên chữ cái
        return (a.title || '').localeCompare(b.title || '', 'vi-VN');
    });
    // --- KẾT THÚC LOGIC SẮP XẾP ---

    // Chú ý: Đổi từ vòng lặp có [...assignments].reverse().forEach thành .forEach trực tiếp 
    // do thuật toán sort ở trên đã xử lý thứ tự hoàn chỉnh rồi
    assignments.forEach(assign => {
        let typeText = '';
        if (assign.assessmentType === 'trac_nghiem') typeText = 'Trắc nghiệm';
        else if (assign.assessmentType === 'ket_hop') typeText = `Kết hợp (TN: ${assign.mcWeight || 5}đ - TL: ${assign.essayWeight || 5}đ)`;
        else if (assign.assessmentType === 'thi') {
            const mc = assign.mcWeight || 0;
            const tl = assign.essayWeight || 0;
            if (mc > 0 && tl > 0) typeText = `Thi (TN: ${mc}đ - TL: ${tl}đ)`;
            else if (mc > 0) typeText = `Thi Trắc nghiệm (${mc}đ)`;
            else if (tl > 0) typeText = `Thi Tự luận (${tl}đ)`;
            else typeText = 'Thi';
        } else typeText = 'Tự luận';

        if (assign.hideEssayText && assign.assessmentType !== 'trac_nghiem' && !(assign.assessmentType === 'thi' && (assign.essayWeight || 0) === 0)) {
            typeText += ' 📁 [Chỉ nhận Tệp]';
        }
        let fileHTML = '';
        if (assign.file) {
            let files = Array.isArray(assign.file) ? assign.file : [assign.file];
            files.forEach(f => {
                fileHTML += `<p style="margin-top:10px;"><strong>📎 File đính kèm:</strong> <a href="${f.base64}" download="${f.name}" class="file-download-link">${f.name}</a></p>`;
            });
        }
        let videoHTML = assign.videoLink ? getEmbedHTML(assign.videoLink) : '';

        let quizHTML = '';
        const hasMC = assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop' || (assign.assessmentType === 'thi' && (assign.mcWeight || 0) > 0);
        if (hasMC && assign.questions) {
            quizHTML = `<div style="background: rgba(255,255,255,0.5); padding: 10px; border-radius: 8px; margin-top: 10px;"><strong>Trắc nghiệm:</strong><ul style="margin-left: 20px;">`;
            assign.questions.forEach((q, idx) => { quizHTML += `<li>Câu ${idx + 1}: ${q.qText} <strong>(${q.correct})</strong></li>`; });
            quizHTML += '</ul></div>';
        }

        const hasEssay = assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType || (assign.assessmentType === 'thi' && (assign.essayWeight || 0) > 0);
        let tuLuanHTML = hasEssay ? `<p style="background: rgba(255,255,255,0.5); padding:15px; border-radius:12px; border-left:4px solid #667eea;"><strong>Yêu cầu Tự luận:</strong><br>${(assign.desc || '').replace(/\n/g, '<br>')}</p>` : '';

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

    if (window.MathJax) {
        MathJax.typesetPromise([container]).catch((err) => console.log('MathJax error:', err));
    }
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
    const rawSubmissions = await getDB('submissions');
    const assignments = await getDB('assignments');
    const list = document.getElementById('submissionsList');
    if (!list) return;
    list.innerHTML = '';

    if (rawSubmissions.length === 0) { list.innerHTML = '<p style="color: #666; font-style: italic;">Chưa có bài nộp nào.</p>'; return; }

    const uniqueSubmissions = {};
    rawSubmissions.forEach(sub => {
        const key = `${sub.assignmentId}_${sub.studentUsername}`;
        if (!uniqueSubmissions[key]) {
            uniqueSubmissions[key] = sub; // Lần đầu tiên thấy -> Lưu lại
        } else {
            // Nếu phát hiện trùng lặp, ƯU TIÊN bài học sinh tự nộp (không bị gắn cờ isAutoSubmitted)
            if (!sub.isAutoSubmitted) {
                uniqueSubmissions[key] = sub;
            }
        }
    });
    const submissions = Object.values(uniqueSubmissions);

    // --- BẮT ĐẦU LOGIC SẮP XẾP BÀI NỘP ---
    submissions.sort((a, b) => {
        const assignA = assignments.find(x => x.id === a.assignmentId) || {};
        const assignB = assignments.find(x => x.id === b.assignmentId) || {};

        const getSortVals = (sub, assign) => {
            let rank = 2; // Nhóm 2: Bài đã chấm điểm xong, hoàn tất
            
            const hasGrade = sub.grade !== null && sub.grade !== undefined && sub.grade !== '';
            
            // Nhóm 1: Ưu tiên lên đầu (Chưa chấm, Đang làm lại, Đang chấm lại)
            if (sub.isRedoing || sub.isRegrading || !hasGrade) {
                rank = 1; 
            }
            
            // Xử lý lấy số "Bài N" (Nếu không có số, mặc định là 0 để đẩy lên trước)
            let lessonNum = 0; 
            const match = (assign.title || '').match(/bài\s*(\d+)/i);
            if (match) lessonNum = parseInt(match[1]);
            
            return { rank, lessonNum, title: assign.title || '' };
        };
        
        const valsA = getSortVals(a, assignA);
        const valsB = getSortVals(b, assignB);
        
        // 1. So sánh Rank (Rank 1 đứng trên Rank 2)
        if (valsA.rank !== valsB.rank) return valsA.rank - valsB.rank;
        // 2. So sánh thứ tự số Bài (0 đứng trước 1, 2, 3...)
        if (valsA.lessonNum !== valsB.lessonNum) return valsA.lessonNum - valsB.lessonNum;
        // 3. So sánh tên bài tập nếu trùng số
        if (valsA.title !== valsB.title) return valsA.title.localeCompare(valsB.title, 'vi-VN');
        // 4. Nếu cùng một bài, ưu tiên bài nộp mới nhất lên trên
        return (b.id || '').localeCompare(a.id || '');
    });
    // --- KẾT THÚC LOGIC SẮP XẾP ---

    // Đã thay thế logic đảo ngược cũ bằng forEach trực tiếp trên mảng đã sort
    submissions.forEach(sub => {
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

        let violationHTML = '';
        if (sub.isCheatFail) {
            violationHTML = `<div style="background: rgba(225, 29, 72, 0.1); border-left: 4px solid #e11d48; padding: 10px; margin-top: 10px; margin-bottom: 10px; border-radius: 8px;"><strong style="color: #e11d48;">🚨 HỌC SINH VI PHẠM QUY CHẾ THI:</strong><br><span style="color:#b91c1c; font-size:0.9em;">Hệ thống phát hiện học sinh này đã tự ý thoát khỏi chế độ Toàn màn hình trong lúc thi.</span></div>`;
        }

        const uniqueId = `teacher-sub-${sub.id}`;
        const div = document.createElement('div'); div.className = 'card accordion-card';
        div.innerHTML = `<div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)">
                <div class="accordion-title"><h4>${assign.title}</h4><span>HS: <strong>${sub.studentName}</strong></span></div>
                <div class="accordion-meta"><span>${gradeStatus}</span><span class="toggle-icon">▼</span></div>
            </div>
            <div id="${uniqueId}" class="accordion-content">${violationHTML}<span style="color: #888; font-size: 0.85em; display: block; margin-bottom: 10px;">🕒 Lần nộp cuối: ${sub.submitTime || 'Chưa rõ'}</span>${videoHTML}
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

    if (window.MathJax) {
        MathJax.typesetPromise([document.getElementById('submissionsList')]).catch((err) => console.log('MathJax error:', err));
    }
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
            
            // THÊM 2 DÒNG NÀY
            await loadSubmissions();
            if (typeof renderTeacherRoadmap === 'function') renderTeacherRoadmap();
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
    if (confirm("Bạn có chắc chắn muốn tiến hành chấm lại bài này?...")) {
        await updateDB('submissions', subKey, { grade: null, isRegrading: true });
        alert("Đã kích hoạt trạng thái chấm lại! Hệ thống đã ẩn kết quả phía giao diện học sinh.");
        await loadSubmissions(); // THÊM DÒNG NÀY
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
                <button class="btn-approve" style="padding:5px 12px; font-size:0.85em; background: #3b82f6; color: white;" onclick="openEditStudentModal('${st._fbKey}')">Sửa</button>
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
    pendingReqs.forEach(req => { let passInfo = req.newPass ? `<span style="color: #ff0844; font-weight:bold;">Mật khẩu mới: ${req.newPass}</span>` : 'Không đổi'; html += `<div style="background: rgba(255,255,255,0.5); padding: 15px; margin-bottom: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.8);"><p><strong>Học sinh:</strong> ${req.currentName} (<i>${req.username}</i>)</p><p><strong>Đổi tên thành:</strong> <span style="color: #667eea; font-weight:800;">${req.newName}</span></p><p><strong>Mật khẩu:</strong> ${passInfo}</p><div style="margin-top: 15px; display: flex; gap: 10px;"><button onclick="handleRequest('${req._fbKey}', true, '${req.username}', '${(req.newName || '').replace(/'/g, "\\'")}', '${(req.newPass || '').replace(/'/g, "\\'")}')" class="btn-approve">✅ Cho phép</button><button onclick="handleRequest('${req._fbKey}', false, '', '', '')" class="btn-reject">❌ Từ chối</button></div></div>`; });
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
    if (confirm("Cấp quyền cho học sinh làm lại bài?...")) {
        await updateDB('submissions', subKey, {
            isRedoing: true,
            grade: null,
            hasRedone: true
        });
        alert("Đã cấp quyền làm lại bài và thu hồi kết quả cũ!");
        await loadSubmissions(); // THÊM DÒNG NÀY
    }
}

// ================= HÀM THA LỖI NỘP TRỄ / VI PHẠM =================
window.pardonSubmission = async function (subKey) {
    if (confirm("Bạn có chắc chắn muốn tha lỗi cho bài này?...")) {
        await updateDB('submissions', subKey, {
            isLateFail: false,
            isAutoSubmitted: false,
            isCheatFail: false
        });
        alert("✨ Đã tha lỗi thành công! Lộ trình của học sinh đã được cập nhật lại theo điểm số thực tế.");
        await loadSubmissions(); // THÊM DÒNG NÀY
        if (typeof renderTeacherRoadmap === 'function') renderTeacherRoadmap(); // THÊM DÒNG NÀY
    }
};

window.forceSubmitRedo = async function (subKey) {
    if (confirm("Bạn muốn khóa bài ngay lập tức?...")) {
        await updateDB('submissions', subKey, { isRedoing: false });
        alert("Đã khóa bài làm lại!");
        await loadSubmissions(); // THÊM DÒNG NÀY
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
                // TRƯỜNG HỢP 2: BỊ HỆ THỐNG TỰ THU, NỘP TRỄ HOẶC VI PHẠM
                else if (sub.isAutoSubmitted || sub.isLateFail || sub.isCheatFail) {
                    statusText = sub.isCheatFail ? 'Loại (Vi phạm)' : 'Loại';
                    statusClass = 'status-pending';
                    cellBgStyle = 'background: rgba(225, 29, 72, 0.2) !important; color: #b91c1c; font-weight: bold; border-radius: 8px;';
                    studentScore = (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') ? parseFloat(sub.grade) : '0';
                    moneyInputHTML = `<strong style="color: #e11d48; font-size: 1.1em;">0 đ</strong> <span style="font-size:0.75em; color:#666; display:block;">(Bị loại)</span>`;
                    pardonBtnHTML = `<br><button onclick="pardonRoadmap('${sub._fbKey}', 'late')" style="margin-top:6px; padding:3px 8px; font-size:0.8em; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; width:100%;">✨ Tha lỗi</button>`;
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
        if (confirm("Xác nhận tha lỗi nộp trễ / vi phạm cho học sinh?\n\nHệ thống sẽ gỡ bỏ án phạt, bài làm sẽ quay về tính trạng thái theo điểm số thực tế.")) {
            await updateDB('submissions', subKey, { isLateFail: false, isAutoSubmitted: false, isCheatFail: false });
            alert("✨ Đã tha lỗi thành công!");
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
        const hasEssay = assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType || (assign.assessmentType === 'thi' && assign.essayWeight > 0);
        if (hasEssay) {
            if (tuLuanSec) tuLuanSec.style.display = 'block';
            if (document.getElementById('editDesc')) document.getElementById('editDesc').value = assign.desc || '';
            if (document.getElementById('editVideoLink')) document.getElementById('editVideoLink').value = assign.videoLink || '';
            if (document.getElementById('editHideEssayText')) {
                document.getElementById('editHideEssayText').checked = !!assign.hideEssayText;
            }
        }

        // 3. Xử lý phần Điểm số
        if (assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi') {
            if (weightSec) weightSec.style.display = 'block';
            if (document.getElementById('editMcWeight')) document.getElementById('editMcWeight').value = assign.mcWeight || '';
            if (document.getElementById('editEssayWeight')) document.getElementById('editEssayWeight').value = assign.essayWeight || '';
        }

        // 4. Xử lý phần Trắc Nghiệm
        const hasMC = assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop' || (assign.assessmentType === 'thi' && assign.mcWeight > 0);
        if (hasMC) {
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

        if (assign.assessmentType === 'thi') window.updateEditExamFields();

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
    if (assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi') {
        const mcWeight = parseFloat(document.getElementById('editMcWeight').value) || 0;
        const essayWeight = parseFloat(document.getElementById('editEssayWeight').value) || 0;

        if (assign.assessmentType === 'ket_hop' && (mcWeight + essayWeight !== 10)) {
            return alert("Tổng điểm tối đa của Trắc nghiệm và Tự luận phải bằng 10!");
        }
        if (assign.assessmentType === 'thi' && mcWeight === 0 && essayWeight === 0) {
            return alert("Vui lòng nhập điểm cho ít nhất Trắc nghiệm hoặc Tự luận!");
        }
        updateObj.mcWeight = mcWeight;
        updateObj.essayWeight = essayWeight;
    }

    // Thu thập dữ liệu Tự Luận
    const hasEssay = assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || (assign.assessmentType === 'thi' && updateObj.essayWeight > 0);
    if (hasEssay) {
        updateObj.desc = document.getElementById('editDesc').value;
        updateObj.videoLink = document.getElementById('editVideoLink').value.trim();
        updateObj.hideEssayText = document.getElementById('editHideEssayText') ? document.getElementById('editHideEssayText').checked : false;
    } else if (assign.assessmentType === 'thi') {
        updateObj.desc = '';
        updateObj.hideEssayText = false;
    }

    // Thu thập dữ liệu Trắc Nghiệm
    const hasMC = assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop' || (assign.assessmentType === 'thi' && updateObj.mcWeight > 0);
    if (hasMC) {
        const editedQuestions = [];
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
    } else if (assign.assessmentType === 'thi') {
        updateObj.questions = [];
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

// Quản lý trạng thái mở/đóng cửa hàng
window.toggleStoreStatus = async function (isOpen) {
    await db.ref('store_settings').update({ isOpen: isOpen });
};

window.addStoreItem = async function () {
    const name = document.getElementById('newItemName').value.trim();
    const type = document.getElementById('newItemType').value;
    const price = parseInt(document.getElementById('newItemPrice').value);
    const image = document.getElementById('newItemImage').value.trim();
    const startDate = document.getElementById('newItemStartDate').value;
    const endDate = document.getElementById('newItemEndDate').value;
    const value = document.getElementById('newItemValue').value.trim();

    if (!name || !startDate || !endDate || !value) return alert("Vui lòng điền đầy đủ thông tin bắt buộc!");

    await pushDB('store_items', {
        id: Date.now().toString(),
        name, type, price, image, value,
        startDate: startDate.replace("T", " "),
        endDate: endDate.replace("T", " ")
    });

    document.getElementById('newItemName').value = '';
    document.getElementById('newItemValue').value = '';
    alert("Thêm vật phẩm vào cửa hàng thành công!");
};

// 3. Hàm lưu dữ liệu chỉnh sửa lên Firebase
window.updateStoreItem = async function () {
    const selectEl = document.getElementById('editStoreItemId');
    const priceInput = document.getElementById('editStoreItemPrice');
    const startInput = document.getElementById('editStoreItemStart');
    const endInput = document.getElementById('editStoreItemEnd');

    if (!selectEl || !selectEl.value) {
        alert('⚠️ Vui lòng chọn một mặt hàng cụ thể cần chỉnh sửa từ danh sách.');
        return;
    }

    const itemId = selectEl.value;
    const newPrice = parseInt(priceInput.value);

    if (isNaN(newPrice) || newPrice < 0) {
        alert('❌ Giá bán (Coin) phải là một con số hợp lệ và lớn hơn hoặc bằng 0.');
        return;
    }

    const itemIndex = StoreConfig.items.findIndex(i => i.id === itemId);
    if (itemIndex !== -1) {
        // 1. Cập nhật mảng cục bộ để thay đổi hiển thị tạm thời
        StoreConfig.items[itemIndex].price = newPrice;
        StoreConfig.items[itemIndex].startDate = startInput.value;
        StoreConfig.items[itemIndex].endDate = endInput.value;

        try {
            // 2. KÍCH HOẠT ĐỒNG BỘ: Đẩy cấu hình mới này lên Firebase Realtime Database
            await db.ref('store_settings/' + itemId).update({
                price: newPrice,
                startDate: startInput.value,
                endDate: endInput.value
            });

            alert(`✅ Đã lưu và đồng bộ thành công thiết lập cho vật phẩm [ ${StoreConfig.items[itemIndex].name} ] sang hệ thống học sinh!`);

            // Xóa thông tin trống biểu mẫu sau khi lưu thành công
            selectEl.value = '';
            loadStoreItemDetails();
            initTeacherStoreManagement();
        } catch (error) {
            console.error("Lỗi đồng bộ Firebase:", error);
            alert("❌ Đã xảy ra lỗi khi kết nối dữ liệu Firebase. Vui lòng kiểm tra lại mạng!");
        }
    }
};

// Bộ lắng nghe tự động cập nhật bảng quản lý của giáo viên khi database có thay đổi
db.ref('store_settings').on('value', (snapshot) => {
    const settings = snapshot.val();
    if (settings) {
        StoreConfig.items.forEach(item => {
            if (settings[item.id]) {
                if (settings[item.id].price !== undefined) item.price = settings[item.id].price;
                if (settings[item.id].startDate !== undefined) item.startDate = settings[item.id].startDate;
                if (settings[item.id].endDate !== undefined) item.endDate = settings[item.id].endDate;
            }
        });
        if (typeof initTeacherStoreManagement === 'function') {
            initTeacherStoreManagement();
        }
    }
});

window.deleteStoreItem = async function (fbKey) {
    if (confirm("Chắc chắn muốn xóa vật phẩm này khỏi cửa hàng?")) {
        await removeDB('store_items', fbKey);
    }
};

let myInventory = [];
let storeItemsGlobal = [];
let currentFilter = 'all';

window.checkStoreStatus = function (settings) {
    const isOpen = settings ? settings.isOpen : true;
    document.getElementById('storeActiveView').style.display = isOpen ? 'block' : 'none';
    document.getElementById('storeLockedView').style.display = isOpen ? 'none' : 'block';
};

window.filterStore = function (type) {
    currentFilter = type;
    loadStoreItems();
};

window.loadStoreItems = async function () {
    const items = await getDB('store_items');
    storeItemsGlobal = items;
    const container = document.getElementById('storeItemsContainer');
    if (!container) return;
    container.innerHTML = '';

    const now = new Date();

    items.forEach(item => {
        // Kiểm tra thời hạn mở bán
        const start = new Date(item.startDate.replace(" ", "T"));
        const end = new Date(item.endDate.replace(" ", "T"));

        if (now < start || now > end) return; // Chỉ hiển thị hàng đang mở bán
        if (currentFilter !== 'all' && item.type !== currentFilter) return;

        const isOwned = myInventory.find(i => i.id === item.id);
        const isEquipped = isOwned && isOwned.isEquipped;

        let btnHtml = '';
        if (isOwned) {
            if (isEquipped) {
                btnHtml = `<button onclick="equipItem('${item.id}', false)" style="width:100%; padding: 8px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Hủy trang bị</button>`;
            } else {
                btnHtml = `<button onclick="equipItem('${item.id}', true)" style="width:100%; padding: 8px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Sử dụng</button>`;
            }
        } else {
            btnHtml = `<button onclick="buyStoreItem('${item.id}', ${item.price})" style="width:100%; padding: 8px; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Mua: ${item.price} 🪙</button>`;
        }

        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(255,255,255,0.6); border-radius: 12px; padding: 15px; text-align: center; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 10px rgba(0,0,0,0.05);';

        let typeIcon = item.type === 'theme' ? '🎨' : (item.type === 'effect' ? '✨' : '🐾');

        div.innerHTML = `
            ${item.image ? `<img src="${item.image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px; margin-bottom: 10px;">` : `<div style="font-size: 3em; margin-bottom: 10px;">📦</div>`}
            <h4 style="margin: 0 0 5px 0; color: #2c3e50;">${item.name}</h4>
            <p style="font-size: 0.85em; color: #666; margin-bottom: 15px;">${typeIcon} ${item.type === 'theme' ? 'Giao diện' : (item.type === 'effect' ? 'Hiệu ứng' : 'Thú cưng')}</p>
            ${btnHtml}
        `;
        container.appendChild(div);
    });
};

window.buyStoreItem = async function (itemId, price) {
    const coinRef = db.ref('student_coins/' + currentUser.username);
    const snap = await coinRef.once('value');
    const currentCoins = snap.val() || 0;

    if (currentCoins < price) {
        return alert("Bạn không đủ Coin để mua vật phẩm này!");
    }

    if (confirm(`Xác nhận mua vật phẩm này với giá ${price} Coin?`)) {
        // Trừ tiền
        await coinRef.set(currentCoins - price);
        // Lưu vào kho
        await pushDB(`student_inventory/${currentUser.username}`, {
            id: itemId,
            purchaseTime: new Date().getTime(),
            isEquipped: false
        });
        alert("Mua thành công! Vật phẩm đã được thêm vào kho của bạn.");
    }
};

window.equipItem = async function (itemId, equipState) {
    const itemInfo = storeItemsGlobal.find(i => i.id === itemId);
    if (!itemInfo) return;

    // Lấy toàn bộ kho đồ của User
    const invSnap = await db.ref(`student_inventory/${currentUser.username}`).once('value');
    const inventory = invSnap.val();

    if (inventory) {
        let updates = {};
        for (let key in inventory) {
            let invItem = inventory[key];

            // Logic: Chỉ được trang bị 1 item cho 1 loại (1 thú cưng, 1 hiệu ứng, 1 theme cùng lúc)
            if (equipState) {
                const checkTypeItem = storeItemsGlobal.find(i => i.id === invItem.id);
                if (checkTypeItem && checkTypeItem.type === itemInfo.type) {
                    updates[`${key}/isEquipped`] = false; // Gỡ các item cùng loại
                }
            }

            if (invItem.id === itemId) {
                updates[`${key}/isEquipped`] = equipState;
            }
        }
        await db.ref(`student_inventory/${currentUser.username}`).update(updates);
    }
};

window.applyEquippedItems = function () {
    // Reset hiệu ứng và thú cưng
    document.getElementById('global-effect-container').innerHTML = '';
    const petContainer = document.getElementById('virtual-pet-container');
    petContainer.style.display = 'none';

    myInventory.forEach(invItem => {
        if (invItem.isEquipped) {
            const itemDef = storeItemsGlobal.find(i => i.id === invItem.id);
            if (itemDef) {
                if (itemDef.type === 'theme') {
                    document.body.style.background = itemDef.value; // Ví dụ: giá trị là mã màu hoặc link ảnh url(...)
                } else if (itemDef.type === 'pet') {
                    petContainer.style.display = 'block';
                    document.getElementById('virtual-pet-img').src = itemDef.value; // Link ảnh gif thú cưng
                } else if (itemDef.type === 'effect') {
                    renderGlobalEffect(itemDef.value);
                }
            }
        }
    });
};

window.renderGlobalEffect = function (effectType) {
    const container = document.getElementById('global-effect-container');
    if (effectType === 'snow') {
        for (let i = 0; i < 30; i++) {
            let flake = document.createElement('div');
            flake.style.cssText = `position: absolute; width: 8px; height: 8px; background: white; border-radius: 50%; opacity: ${Math.random()}; top: -10px; left: ${Math.random() * 100}vw; animation: fall ${Math.random() * 3 + 2}s linear infinite;`;
            container.appendChild(flake);
        }
    } else if (effectType === 'sparkle') {
        for (let i = 0; i < 20; i++) {
            let spark = document.createElement('div');
            spark.style.cssText = `position: absolute; width: 4px; height: 4px; background: #ffd700; border-radius: 50%; box-shadow: 0 0 10px #ffd700; top: ${Math.random() * 100}vh; left: ${Math.random() * 100}vw; animation: blink ${Math.random() * 2 + 1}s infinite alternate;`;
            container.appendChild(spark);
        }
    }
};

// Cấu hình CSS Animations cho Hiệu ứng bằng JS
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fall {
    to { transform: translateY(100vh); }
}
@keyframes blink {
    0% { opacity: 0; transform: scale(0.5); }
    100% { opacity: 1; transform: scale(1.5); }
}
`;
document.head.appendChild(styleSheet);

// ====== LOGIC KẾT NỐI QUẢN LÝ CỬA HÀNG (GIÁO VIÊN) ======

// Hàm hiển thị danh sách hàng hóa và đổ dữ liệu vào thẻ Select điều khiển
function initTeacherStoreManagement() {
    const selectEl = document.getElementById('editStoreItemId');
    const listContainer = document.getElementById('teacherStoreItemsList');
    if (!selectEl || !listContainer) return;

    selectEl.innerHTML = '<option value="">-- Chọn hàng hóa cần sửa --</option>';
    let listHtml = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:15px; margin-top:10px;">';

    StoreConfig.items.forEach((item, index) => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `[${item.tag}] ${item.name}`;
        selectEl.appendChild(option);

        let priceDisplay = item.isNonCoin ? (item.price > 0 ? `🪙 ${item.price} Coin (Sự kiện)` : 'Vật phẩm Sự kiện') : `🪙 ${item.price} Coin`;

        let hiddenClass = index >= 4 ? 'hidden-store-item-row' : '';
        let hiddenStyle = index >= 4 ? 'display: none;' : '';

        // Xử lý UI nút khóa vật phẩm
        let isItemLocked = !!item.isLocked;
        let lockBtnText = isItemLocked ? '🔓 Mở khóa' : '🔒 Khóa';
        let lockBtnStyle = isItemLocked ? 'background:#10b981; color:white;' : 'background:#e11d48; color:white;';

        listHtml += `
            <div class="card ${hiddenClass}" style="margin:0; padding:15px; border: 1px solid rgba(0,0,0,0.08); position:relative; ${hiddenStyle} ${isItemLocked ? 'background: rgba(225, 29, 72, 0.04);' : ''}">
                <span style="position:absolute; top:8px; right:8px; font-size:0.8em; padding:2px 8px; background:#f0f0f0; border-radius:12px; font-weight:bold;">${item.type}</span>
                <h4 style="margin:0 0 8px 0; color:#764ba2;">${item.name} ${isItemLocked ? '<span style="color:#e11d48; font-size:0.85em;">(Khóa)</span>' : ''}</h4>
                <p style="margin:5px 0; font-size:0.9em;"><b>Giá bán:</b> ${priceDisplay}</p>
                <div style="display: flex; gap: 5px; margin-top: 8px;">
                    <button onclick="quickSelectStoreItem('${item.id}')" style="padding:6px 8px; font-size:0.85em; flex:1; background:rgba(102, 126, 234, 0.1); color:#667eea; box-shadow:none; border:1px solid #667eea;">Sửa ✏️</button>
                    <button onclick="toggleLockStoreItem('${item.id}', ${isItemLocked})" style="padding:6px 8px; font-size:0.85em; flex:1; border:none; ${lockBtnStyle}">${lockBtnText}</button>
                </div>
            </div>
        `;
    });

    listHtml += '</div>';

    if (StoreConfig.items.length > 4) {
        listHtml += `
            <div style="text-align: center; margin-top: 15px;">
                <button id="toggleStoreItemsBtn" onclick="toggleStoreItemsList()" style="background: transparent; border: 1px dashed #10b981; color: #10b981; padding: 8px 20px; border-radius: 20px; cursor: pointer; font-size: 0.95em; font-weight: bold; transition: all 0.2s;">
                    👇 Xem thêm ${StoreConfig.items.length - 4} hàng hóa khác
                </button>
            </div>
        `;
    }
    listContainer.innerHTML = listHtml;
}

// Hàm xử lý khi giáo viên bấm nút Xem thêm / Thu gọn danh sách hàng hóa
window.toggleStoreItemsList = function () {
    const hiddenItems = document.querySelectorAll('.hidden-store-item-row');
    const btn = document.getElementById('toggleStoreItemsBtn');
    if (hiddenItems.length === 0) return;

    // Kiểm tra xem thẻ đầu tiên đang ẩn hay hiện
    const isCurrentlyHidden = hiddenItems[0].style.display === 'none';

    hiddenItems.forEach(item => {
        item.style.display = isCurrentlyHidden ? 'block' : 'none';
    });

    // Thay đổi nội dung và màu sắc nút bấm cho trực quan
    if (isCurrentlyHidden) {
        btn.innerHTML = '👆 Thu gọn danh sách';
        btn.style.borderColor = '#e11d48';
        btn.style.color = '#e11d48';
    } else {
        btn.innerHTML = `👇 Xem thêm ${hiddenItems.length} hàng hóa khác`;
        btn.style.borderColor = '#10b981';
        btn.style.color = '#10b981';
    }
};

// Hàm bổ trợ giúp giáo viên click nhanh nút "Chọn chỉnh sửa" ở danh sách dưới
function quickSelectStoreItem(itemId) {
    const selectEl = document.getElementById('editStoreItemId');
    if (selectEl) {
        selectEl.value = itemId;
        loadStoreItemDetails(); // Kích hoạt sự kiện đổi dữ liệu form
    }
}

// Hàm load thông tin chi tiết vật phẩm lên form khi giáo viên chọn từ Select
function loadStoreItemDetails() {
    const selectEl = document.getElementById('editStoreItemId');
    const priceInput = document.getElementById('editStoreItemPrice');
    const startInput = document.getElementById('editStoreItemStart');
    const endInput = document.getElementById('editStoreItemEnd');

    if (!selectEl || !priceInput) return;

    const itemId = selectEl.value;
    if (!itemId) {
        priceInput.value = ''; startInput.value = ''; endInput.value = '';
        return;
    }

    const item = StoreConfig.items.find(i => i.id === itemId);
    if (item) {
        priceInput.value = item.price;
        priceInput.disabled = false; // LUÔN CHO PHÉP NHẬP GIÁ COIN ĐỂ CHUYỂN THÀNH MUA GIỚI HẠN
        startInput.value = item.startDate || '';
        endInput.value = item.endDate || '';
    }
}

// BỔ SUNG: Hàm xử lý Khóa / Mở khóa vật phẩm từ phía Giáo viên
window.toggleLockStoreItem = async function (itemId, isCurrentlyLocked) {
    const actionText = isCurrentlyLocked ? "MỞ KHÓA" : "KHÓA TẠM THỜI";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} vật phẩm này không? Học sinh sẽ không thể sử dụng hay mua món đồ này.`)) return;

    try {
        await db.ref('store_settings/' + itemId).update({
            isLocked: !isCurrentlyLocked
        });
        alert(`✅ Đã thực hiện ${actionText.toLowerCase()} vật phẩm thành công!`);
    } catch (error) {
        console.error(error);
        alert("❌ Đã xảy ra lỗi khi cập nhật trạng thái khóa.");
    }
};

// Khởi chạy đồng bộ khi giáo viên vào tab quản lý trò chơi / cửa hàng
// Bạn có thể lồng hàm này vào hàm switchTab() có sẵn của bạn khi chuyển qua tab 'tab-game-manage'
document.addEventListener('DOMContentLoaded', () => {
    initTeacherStoreManagement();
});

// Hàm điều khiển ẩn/hiện khu vực nhập thông báo
window.toggleNotificationArea = function (isOpen) {
    const inputArea = document.getElementById('notificationInputArea');
    if (inputArea) {
        inputArea.style.display = isOpen ? 'block' : 'none';
    }
};

// Gửi thông báo mới
window.sendGlobalNotification = async function (customMsg = null) {
    const msgInput = document.getElementById('globalNotificationMessage');
    const message = customMsg || (msgInput ? msgInput.value.trim() : '');

    if (!message) return alert("Vui lòng nhập nội dung thông báo!");

    const payload = {
        id: Date.now().toString(),
        message: message,
        timestamp: Date.now(),
        timeString: new Date().toLocaleString('vi-VN'),
        receivers: {} // Khởi tạo danh sách người đã ấn "Đã nhận" (Rỗng)
    };

    await pushDB('global_notifications', payload);

    if (msgInput && !customMsg) {
        msgInput.value = ''; // Xóa nội dung cũ

        // Tự động tắt nút gạt và ẩn khung nhập sau khi gửi xong
        const toggleBtn = document.getElementById('notificationToggle');
        if (toggleBtn) toggleBtn.checked = false;
        toggleNotificationArea(false);
    }

    alert("✅ Đã phát thông báo đến toàn bộ học sinh!");
};


// Mở lịch sử và thống kê người xem
window.openNotificationHistory = async function () {
    document.getElementById('notificationHistoryModal').classList.add('active');
    const listContainer = document.getElementById('notificationHistoryList');
    listContainer.innerHTML = '<p style="text-align: center; color: #666;">Đang tải dữ liệu...</p>';

    const notifications = await getDB('global_notifications');
    const users = await getDB('users');
    const students = users.filter(u => u.role === 'student');
    const totalStudents = students.length;

    if (notifications.length === 0) {
        listContainer.innerHTML = '<p style="color: #666; font-style: italic; text-align: center;">Chưa có thông báo nào được gửi.</p>';
        return;
    }

    let html = '';
    // Xếp thông báo mới nhất lên đầu
    [...notifications].reverse().forEach(noti => {
        const receiversObj = noti.receivers || {};
        const receivedCount = Object.keys(receiversObj).length;

        // Trích xuất danh sách học sinh đã xem / chưa xem
        let viewedStudentsHTML = '';
        students.forEach(st => {
            const hasViewed = receiversObj[st.username];
            const color = hasViewed ? '#059669' : '#e11d48';
            const icon = hasViewed ? '✅' : '⏳';
            viewedStudentsHTML += `<span style="display:inline-block; margin: 3px 8px 3px 0; font-size:0.85em; color:${color}; font-weight:bold; background: rgba(0,0,0,0.04); padding: 4px 8px; border-radius: 6px;">${icon} ${st.name}</span>`;
        });

        html += `
        <div class="glass-alert" style="margin-bottom: 20px; border-left-color: #f6d365;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <span style="font-size: 0.85em; color: #666;">🕒 Gửi lúc: ${noti.timeString || 'Không rõ'}</span>
                <span style="font-size: 0.85em; font-weight: bold; color: #764ba2; background: rgba(118, 75, 162, 0.1); padding: 4px 10px; border-radius: 12px;">Đã xem: ${receivedCount} / ${totalStudents}</span>
            </div>
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c3e50; white-space: pre-wrap; font-size: 1.05em;">${noti.message}</p>
            
            <div style="background: rgba(255,255,255,0.8); padding: 10px; border-radius: 8px; margin-bottom: 12px; max-height: 100px; overflow-y: auto; border: 1px inset rgba(0,0,0,0.05);">
                ${viewedStudentsHTML}
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="sendGlobalNotification('${noti.message.replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "")}')" style="flex: 1; padding: 8px; font-size: 0.9em; background: rgba(102, 126, 234, 0.1); color: #667eea; border: 2px dashed #667eea; box-shadow: none; border-radius: 8px; font-weight: bold;">🔄 Gửi lại tin này</button>
                <button onclick="deleteNotification('${noti._fbKey}')" style="width: auto; padding: 8px 15px; font-size: 0.9em; background: rgba(225, 29, 72, 0.1); color: #e11d48; border: none; border-radius: 8px; font-weight: bold;">🗑 Xóa</button>
            </div>
        </div>`;
    });
    listContainer.innerHTML = html;
};

window.closeNotificationHistory = function () {
    document.getElementById('notificationHistoryModal').classList.remove('active');
};

window.deleteNotification = async function (fbKey) {
    if (confirm('Chắc chắn xóa thông báo này khỏi lịch sử?')) {
        await removeDB('global_notifications', fbKey);
        openNotificationHistory(); // Render lại danh sách
    }
};

// ================= HỆ THỐNG KHẢO SÁT =================
let surveyQCount = 0;

window.toggleSurveyArea = function (isOpen) {
    const inputArea = document.getElementById('surveyInputArea');
    if (inputArea) inputArea.style.display = isOpen ? 'block' : 'none';
};

window.addSurveyQuestion = function (type) {
    surveyQCount++;
    const container = document.getElementById('surveyQuestionsBuilder');
    const div = document.createElement('div');
    div.className = 'survey-q-block';
    div.dataset.type = type;
    div.style.cssText = 'background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; position: relative; border: 1px solid rgba(0,0,0,0.05);';

    let contentHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <strong style="color:#e83e8c;">Câu ${surveyQCount} (${type === 'mc' ? 'Chọn đáp án' : 'Nhập văn bản'}):</strong>
            <button onclick="removeSurveyQuestion(this)" style="width:auto; padding:2px 8px; font-size:0.8em; background:#e11d48; color:white; border:none; border-radius:4px;">Xóa</button>
        </div>
        <input type="text" class="sq-text" placeholder="Nhập nội dung câu hỏi khảo sát..." style="margin-bottom: ${type === 'mc' ? '10px' : '0'}; background: rgba(0,0,0,0.02);">
    `;

    if (type === 'mc') {
        contentHTML += `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <input type="text" class="sq-opt" placeholder="Lựa chọn 1..." style="margin:0;">
                <input type="text" class="sq-opt" placeholder="Lựa chọn 2..." style="margin:0;">
                <input type="text" class="sq-opt" placeholder="Lựa chọn 3 (Không bắt buộc)..." style="margin:0;">
                <input type="text" class="sq-opt" placeholder="Lựa chọn 4 (Không bắt buộc)..." style="margin:0;">
            </div>
        `;
    }
    div.innerHTML = contentHTML;
    container.appendChild(div);
};

window.removeSurveyQuestion = function (btnElement) {
    // Xóa khối câu hỏi hiện tại trên giao diện
    btnElement.closest('.survey-q-block').remove();

    // Tìm tất cả các câu hỏi còn lại trên màn hình
    const remaining = document.querySelectorAll('.survey-q-block');

    // Cập nhật lại biến đếm tổng
    surveyQCount = remaining.length;

    // Chạy vòng lặp để đổi lại tên "Câu 1, Câu 2..." cho đúng thứ tự
    remaining.forEach((block, index) => {
        const label = block.querySelector('strong');
        if (label) {
            const typeText = block.dataset.type === 'mc' ? 'Chọn đáp án' : 'Nhập văn bản';
            label.innerText = `Câu ${index + 1} (${typeText}):`;
        }
    });
};

window.sendGlobalSurvey = async function () {
    const title = document.getElementById('surveyTitle').value.trim();
    if (!title) return alert("Vui lòng nhập Tiêu đề khảo sát!");

    const qBlocks = document.querySelectorAll('.survey-q-block');
    if (qBlocks.length === 0) return alert("Vui lòng thêm ít nhất 1 câu hỏi khảo sát!");

    let questions = [];
    let isValid = true;

    qBlocks.forEach((block, index) => {
        const qType = block.dataset.type;
        const qText = block.querySelector('.sq-text').value.trim();
        if (!qText) isValid = false;

        let qData = { id: `q_${index}`, type: qType, text: qText };

        if (qType === 'mc') {
            let opts = [];
            block.querySelectorAll('.sq-opt').forEach(optInput => {
                if (optInput.value.trim()) opts.push(optInput.value.trim());
            });
            if (opts.length < 2) isValid = false; // Trắc nghiệm phải có ít nhất 2 lựa chọn
            qData.options = opts;
        }
        questions.push(qData);
    });

    if (!isValid) return alert("Vui lòng điền đầy đủ nội dung câu hỏi và ít nhất 2 lựa chọn cho câu trắc nghiệm!");

    const payload = {
        id: Date.now().toString(),
        title: title,
        questions: questions,
        timestamp: Date.now(),
        timeString: new Date().toLocaleString('vi-VN'),
        answers: {} // Lưu câu trả lời của HS
    };

    await pushDB('global_surveys', payload);

    // Dọn dẹp form
    document.getElementById('surveyTitle').value = '';
    document.getElementById('surveyQuestionsBuilder').innerHTML = '';
    surveyQCount = 0;
    document.getElementById('surveyToggle').checked = false;
    toggleSurveyArea(false);

    alert("🚀 Đã phát hành Khảo sát đến toàn bộ học sinh!");
};

window.openSurveyHistory = async function () {
    document.getElementById('surveyHistoryModal').classList.add('active');
    const container = document.getElementById('surveyHistoryList');
    container.innerHTML = '<p style="text-align: center;">Đang tải...</p>';

    const surveys = await getDB('global_surveys');
    if (surveys.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Chưa có khảo sát nào.</p>';
        return;
    }

    let html = '';
    [...surveys].reverse().forEach(sv => {
        const answerCount = sv.answers ? Object.keys(sv.answers).length : 0;
        html += `
        <div class="glass-alert" style="margin-bottom: 15px; border-left-color: #e83e8c;">
            <h4 style="color: #e83e8c; margin: 0 0 5px 0;">${sv.title}</h4>
            <p style="font-size: 0.85em; color: #666; margin-bottom: 10px;">🕒 Gửi: ${sv.timeString}</p>
            <p style="font-weight: bold; color: #059669; margin-bottom: 15px;">Đã có ${answerCount} học sinh trả lời</p>
            <div style="display: flex; gap: 10px;">
                <button onclick="viewSurveyResults('${sv._fbKey}')" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border-radius: 8px; border: none; font-weight: bold;">👁️ Xem câu trả lời</button>
                <button onclick="deleteSurvey('${sv._fbKey}')" style="width: auto; padding: 8px 15px; background: rgba(225, 29, 72, 0.1); color: #e11d48; border: none; border-radius: 8px; font-weight: bold;">🗑 Xóa</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
};

window.closeSurveyHistory = function () { document.getElementById('surveyHistoryModal').classList.remove('active'); };

window.viewSurveyResults = async function (fbKey) {
    const surveys = await getDB('global_surveys');
    const sv = surveys.find(s => s._fbKey === fbKey);
    if (!sv) return;

    document.getElementById('surveyResultTitle').innerText = `📊 Kết quả: ${sv.title}`;
    const container = document.getElementById('surveyResultsContent');
    container.innerHTML = '';

    if (!sv.answers || Object.keys(sv.answers).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Chưa có học sinh nào nộp câu trả lời.</p>';
    } else {
        Object.values(sv.answers).forEach(ans => {
            let answersHTML = '';
            sv.questions.forEach(q => {
                const studentAns = ans.responses[q.id] || '(Bỏ trống)';
                answersHTML += `
                <div style="margin-bottom: 10px; background: rgba(0,0,0,0.03); padding: 10px; border-radius: 8px;">
                    <p style="margin: 0 0 5px 0; font-size: 0.9em; font-weight: bold; color: #444;">Hỏi: ${q.text}</p>
                    <p style="margin: 0; color: #059669; font-weight: bold;">Đáp: ${studentAns}</p>
                </div>`;
            });

            const div = document.createElement('div');
            div.style.cssText = 'background: rgba(255,255,255,0.6); padding: 15px; border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.05);';
            div.innerHTML = `
                <h4 style="color: #764ba2; margin: 0 0 10px 0; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 5px;">👤 HS: ${ans.studentName} <span style="font-size:0.8em; color:#666;">(${ans.timestamp})</span></h4>
                ${answersHTML}
            `;
            container.appendChild(div);
        });
    }
    document.getElementById('surveyResultsModal').classList.add('active');
};

window.closeSurveyResults = function () { document.getElementById('surveyResultsModal').classList.remove('active'); };
window.deleteSurvey = async function (fbKey) {
    if (confirm('Chắc chắn xóa Khảo sát này khỏi hệ thống?')) {
        await removeDB('global_surveys', fbKey);
        openSurveyHistory(); // Render lại danh sách
    }
};

// ================= HỆ THỐNG GỬI QUÀ & THƯ (GIÁO VIÊN) =================

// Hàm tự động tải danh sách Học sinh và Vật phẩm vào mục Gửi quà
async function initGiftDropdowns() {
    const users = await getDB('users');
    const stuSelect = document.getElementById('giftTargetStudent');
    if (stuSelect) {
        stuSelect.innerHTML = '<option value="all">Tất cả học sinh</option>';
        users.filter(u => u.role === 'student').forEach(u => {
            stuSelect.innerHTML += `<option value="${u.username}">${u.name} (${u.username})</option>`;
        });

        // BỔ SUNG: Lắng nghe sự kiện đổi học sinh để lọc tự động vật phẩm
        stuSelect.addEventListener('change', updateGiftItemDropdown);
    }

    // Gọi lần đầu để khởi tạo danh sách vật phẩm gốc
    await updateGiftItemDropdown();
}

// BỔ SUNG: Hàm kiểm tra kho đồ và làm mờ vật phẩm đã sở hữu
window.updateGiftItemDropdown = async function () {
    const target = document.getElementById('giftTargetStudent').value;
    const itemSelect = document.getElementById('giftValueItem');

    if (!itemSelect || typeof StoreConfig === 'undefined') return;

    let ownedItems = [];

    // Lấy dữ liệu kho đồ trên Firebase nếu chọn 1 học sinh cụ thể
    if (target !== 'all') {
        try {
            const invSnap = await db.ref(`student_inventory/${target}`).once('value');
            const inventory = invSnap.val();
            if (inventory) {
                // Trích xuất ID các vật phẩm học sinh đang có
                ownedItems = Object.values(inventory).map(item => item.id);
            }
        } catch (error) {
            console.error("Lỗi lấy kho đồ học sinh:", error);
        }
    }

    // Reset lại ô chọn
    itemSelect.innerHTML = '';
    let hasAvailableItem = false;

    // Đổ danh sách cửa hàng ra, kèm theo điều kiện kiểm tra
    StoreConfig.items.forEach(item => {
        const isOwned = ownedItems.includes(item.id);

        // Nếu đã sở hữu -> Khóa (disabled) và đổi màu xám mờ
        const disabledAttr = isOwned ? 'disabled style="color: #aaa; background: #eee; font-style: italic;"' : '';
        const suffix = isOwned ? ' (HS đã có)' : '';

        itemSelect.innerHTML += `<option value="${item.id}" ${disabledAttr}>[${item.tag}] ${item.name}${suffix}</option>`;

        if (!isOwned) hasAvailableItem = true;
    });

    // Nếu học sinh đã có toàn bộ vật phẩm trong Shop
    if (!hasAvailableItem && StoreConfig.items.length > 0 && target !== 'all') {
        itemSelect.innerHTML = `<option value="" disabled selected>-- HS đã sở hữu tất cả vật phẩm --</option>` + itemSelect.innerHTML;
    }
};

// Bổ sung gọi hàm vào sự kiện load
document.addEventListener('DOMContentLoaded', () => {
    initGiftDropdowns();
});

window.toggleGiftInput = function () {
    const type = document.getElementById('giftType').value;
    const area = document.getElementById('giftValueInputArea');
    const numInput = document.getElementById('giftValueNumber');
    const itemInput = document.getElementById('giftValueItem');

    if (type === 'none') {
        area.style.display = 'none';
    } else {
        area.style.display = 'block';
        // Thêm 'ticket' vào điều kiện này
        if (type === 'coin' || type === 'money' || type === 'ticket') {
            numInput.style.display = 'block';
            itemInput.style.display = 'none';
        } else if (type === 'item') {
            numInput.style.display = 'none';
            itemInput.style.display = 'block';
        }
    }
};

window.sendGiftMessage = async function () {
    const target = document.getElementById('giftTargetStudent').value;
    const msg = document.getElementById('giftMessage').value.trim();
    const type = document.getElementById('giftType').value;
    let value = '';

    if (type === 'coin' || type === 'money' || type === 'ticket') {
        value = parseInt(document.getElementById('giftValueNumber').value);
        if (isNaN(value) || value <= 0) return alert("Vui lòng nhập số lượng hợp lệ (> 0)!");
    } else if (type === 'item') {
        value = document.getElementById('giftValueItem').value;
        // Bổ sung chặn gửi nếu bị rỗng (do học sinh đã sở hữu hết và menu bị disabled)
        if (!value) return alert("❌ Không thể gửi! Học sinh này đã sở hữu tất cả các vật phẩm hiện có.");
    }

    if (type === 'none' && !msg) return alert("Bạn phải nhập lời nhắn nếu không đính kèm quà tặng!");

    // Thiết lập thư hết hạn sau 5 ngày
    const expiryTimestamp = Date.now() + (5 * 24 * 60 * 60 * 1000);

    const payload = {
        message: msg,
        giftType: type,
        giftValue: value,
        timestamp: Date.now(),
        timeString: new Date().toLocaleString('vi-VN'),
        expiry: expiryTimestamp
    };

    const users = await getDB('users');
    const students = users.filter(u => u.role === 'student');

    if (target === 'all') {
        for (let st of students) {
            await pushDB(`inbox_messages/${st.username}`, payload);
        }
    } else {
        await pushDB(`inbox_messages/${target}`, payload);
    }

    alert("💌 Đã gửi thư và quà thành công!");
    document.getElementById('giftMessage').value = '';
    document.getElementById('giftValueNumber').value = '';

    const toggleBtn = document.getElementById('giftToggle');
    if (toggleBtn) toggleBtn.checked = false;
    toggleGiftArea(false);
};

// Hàm điều khiển ẩn/hiện khu vực nhập quà tặng độc lập
window.toggleGiftArea = function (isOpen) {
    const inputArea = document.getElementById('giftInputArea');
    if (inputArea) {
        inputArea.style.display = isOpen ? 'block' : 'none';
    }
};