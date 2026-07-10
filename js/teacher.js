const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
// Đã xóa lệnh chuyển hướng. Việc chặn quyền sẽ do Firebase đảm nhận ở bên dưới.

const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryApp")

let cacheAssignmentsSt = "";
let cacheSubmissionsSt = "";

let attachedFileData = null;
let attachedMaterialFileData = null;

let activeAssignedStudentFilter = 'all';
let activeSubmissionStudentFilter = 'all';
let activeMaterialStudentFilter = 'all';
let activeScheduleStudentFilter = 'all';

const PAGE_LIMIT = 20;

let currentAssignKey = null;
let isAssignEnd = false;

let currentSubKey = null;
let isSubEnd = false;

// ==============================================================
// PHÂN TRANG FIREBASE REALTIME DATABASE - DÙNG CHUNG CHO TEACHER
// ==============================================================
async function getPaginatedDB(path, limit = 20, cursorKey = null) {
    let query = db.ref(path).orderByKey();

    if (cursorKey) {
        if (typeof query.endBefore === 'function') {
            query = query.endBefore(cursorKey).limitToLast(limit);
        } else {
            query = query.endAt(cursorKey).limitToLast(limit + 1);
        }
    } else {
        query = query.limitToLast(limit);
    }

    const snap = await query.once('value');
    const rows = [];

    snap.forEach(child => {
        if (!cursorKey || child.key !== cursorKey) {
            rows.push({ _fbKey: child.key, ...child.val() });
        }
    });

    rows.reverse();

    const items = rows.slice(0, limit);
    const nextKey = items.length === limit ? items[items.length - 1]._fbKey : null;

    return { items, nextKey };
}

async function getStudentsLite() {
    const snap = await db.ref('users')
        .orderByChild('role')
        .equalTo('student')
        .once('value');

    const students = [];
    snap.forEach(child => students.push({ _fbKey: child.key, ...child.val() }));
    return students;
}

async function getAssignmentsByIds(assignmentIds) {
    const result = [];
    const uniqueIds = [...new Set((assignmentIds || []).filter(Boolean))];

    await Promise.all(uniqueIds.map(async (assignmentId) => {
        const snap = await db.ref('assignments')
            .orderByChild('id')
            .equalTo(assignmentId)
            .once('value');

        snap.forEach(child => {
            result.push({ _fbKey: child.key, ...child.val() });
        });
    }));

    return result;
}

async function getSubmissionsByAssignmentIds(assignmentIds) {
    const result = {};
    assignmentIds.forEach(id => result[id] = []);

    await Promise.all(assignmentIds.map(async (assignmentId) => {
        const snap = await db.ref('submissions')
            .orderByChild('assignmentId')
            .equalTo(assignmentId)
            .once('value');

        snap.forEach(child => {
            result[assignmentId].push({ _fbKey: child.key, ...child.val() });
        });
    }));

    return result;
}

// Biến lưu trữ file cộng dồn
const dtTeacherAssign = new DataTransfer(); // Dùng cho Giao bài
window.teacherGradeDTs = {}; // Dùng cho Chấm bài (nhiều học sinh)

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

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
    const quillToolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],        // Định dạng chữ cơ bản
        [{ 'color': [] }, { 'background': [] }],          // 🎨 ĐÂY CHÍNH LÀ NÚT CHỌN MÀU CHỮ VÀ MÀU NỀN
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],     // Danh sách số và dấu chấm
        ['link', 'image', 'formula'],                     // Chèn link, ảnh, công thức toán
        ['clean']                                         // Nút xóa nhanh định dạng
    ];

    // Khởi tạo cho ô tạo bài tập mới
    window.quillDesc = new Quill('#desc', {
        theme: 'snow',
        modules: { toolbar: quillToolbarOptions }
    });

    // Khởi tạo cho ô sửa bài tập
    window.quillEditDesc = new Quill('#editDesc', {
        theme: 'snow',
        modules: { toolbar: quillToolbarOptions }
    });

    // --- THÊM CHỨC NĂNG AUTO-SAVE CHO GIÁO VIÊN SOẠN BÀI ---
    const titleInput = document.getElementById('title');
    if (titleInput) window.setupAutoSave(titleInput, 'draft_teacher_title');

    // Phục hồi và lưu nháp cho khung soạn thảo Quill (Phần Nội dung/Mô tả)
    const savedDesc = localStorage.getItem('draft_teacher_desc');
    if (savedDesc) window.quillDesc.root.innerHTML = savedDesc;

    window.quillDesc.on('text-change', function () {
        let timeoutDesc;
        clearTimeout(timeoutDesc);
        timeoutDesc = setTimeout(() => {
            localStorage.setItem('draft_teacher_desc', window.quillDesc.root.innerHTML);
        }, 1000);
    });
    // ------------------------------------------------------

    // === FIX LỖI BẢO MẬT: Chờ và xác thực qua Firebase Auth ===
    const authUser = await new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });

    if (!authUser) {
        alert("⛔ Lỗi: Không tìm thấy phiên đăng nhập hợp lệ!");
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return;
    }

    let realUsers = await getDB('users');
    let realUser = realUsers.find(u => u.username === currentUser.username);

    // Xác thực nghiêm ngặt: UID Firebase Auth phải khớp với khóa (_fbKey)
    if (!realUser || realUser.role !== 'teacher' || realUser._fbKey !== authUser.uid) {
        alert("⛔ Phát hiện can thiệp dữ liệu phân quyền! Buộc đăng xuất.");
        firebase.auth().signOut();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return;
    }
    // BẬT CỜ XÁC THỰC AN TOÀN SAU KHI FIREBASE ĐÃ KIỂM TRA THÀNH CÔNG
    window.isVerifiedTeacher = true;
    if (document.getElementById('settingName')) document.getElementById('settingName').value = currentUser.name;
    initFileListener();
    initMaterialFileListener();

    // ==========================================
    // PHẦN 1: TẢI DỮ LIỆU NẶNG LẦN ĐẦU (Tải 1 lần để có giao diện ngay)
    // ==========================================
    await Promise.all([
        loadProfileRequests(),
        loadAssignedList(),
        loadSubmissions(),
        loadMaterialsListTeacher(),
        loadStudentsList(),
        typeof loadScheduleTeacher === 'function' ? loadScheduleTeacher() : Promise.resolve(),
        typeof loadSpinHistory === 'function' ? loadSpinHistory() : Promise.resolve(),
        typeof loadTeacherCashRequests === 'function' ? loadTeacherCashRequests() : Promise.resolve()
    ]);
    await populateStudentDropdown();
    await populateRoadmapStudentDropdown();
    if (typeof initTicketManagement === 'function') await initTicketManagement();
    if (document.getElementById('teacherRoadmapBody')) renderTeacherRoadmap();
    if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();

    // ==========================================
    // PHẦN 2: LẮNG NGHE DỮ LIỆU NẶNG BẰNG DEBOUNCE
    // Gom các thay đổi liên tục trong 1.5 giây thành 1 lần render duy nhất
    // Bỏ hoàn toàn JSON.stringify cache vì nó ngốn quá nhiều CPU
    // ==========================================
    const renderSubmissions = debounce(async () => {
        // Không getDB('submissions') toàn bộ nữa; loadSubmissions tự phân trang 20 bài/lần.
        await loadSubmissions(false);
        if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
    }, 1500);

    const renderAssignments = debounce(async () => {
        // Không getDB('assignments') toàn bộ nữa; loadAssignedList tự phân trang 20 bài/lần.
        await loadAssignedList(false);
        if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
    }, 1500);

    const renderUsers = debounce(async () => {
        await loadStudentsList();
        await populateStudentDropdown();
        await populateRoadmapStudentDropdown();
        if (document.getElementById('teacherRoadmapBody')) renderTeacherRoadmap();
    }, 1500);

    // --- ĐOẠN CODE MỚI ĐÃ ĐƯỢC TỐI ƯU REALTIME CHỐNG XUNG ĐỘT ---

    // 1. Chỉ lắng nghe khi có một bài nộp nào đó bị chỉnh sửa (ví dụ: HS nộp lại hoặc GV vừa chấm điểm)
    listenFirebase(db.ref('submissions'), 'child_changed', async (snapshot) => {
        const updatedSub = { _fbKey: snapshot.key, ...snapshot.val() };

        // Cập nhật ngầm phần tử này vào bộ nhớ đệm (Cache) mà không cần tải lại cả bảng
        if (window.cachedSubmissions) {
            const idx = window.cachedSubmissions.findIndex(s => s._fbKey === updatedSub._fbKey || s.id === updatedSub.id);
            if (idx !== -1) {
                window.cachedSubmissions[idx] = updatedSub;
            }
        }

        // Chỉ cập nhật giao diện nhỏ của Lộ trình học tập (Roadmap) nếu đang mở
        if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
        if (document.getElementById('teacherRoadmapBody')) renderTeacherRoadmap();
    });

    // 2. Chỉ lắng nghe khi bài tập có sự thay đổi cấu hình
    listenFirebase(db.ref('assignments'), 'child_changed', async (snapshot) => {
        const updatedAssign = { _fbKey: snapshot.key, ...snapshot.val() };
        if (window.cachedAssignments) {
            const idx = window.cachedAssignments.findIndex(a => a._fbKey === updatedAssign._fbKey || a.id === updatedAssign.id);
            if (idx !== -1) window.cachedAssignments[idx] = updatedAssign;
        }
        if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
    });

    // 3. Khi có bài nộp hoàn toàn MỚI, ta không tải lại toàn bộ mà chỉ cần thông báo hoặc tải lại trang đầu
    listenFirebase(db.ref('submissions').limitToLast(1), 'child_added', (snapshot) => {
        // Chỉ xử lý nếu đây là bài nộp mới phát sinh sau khi trang đã tải xong
        if (window.cachedSubmissions && !window.cachedSubmissions.some(s => s._fbKey === snapshot.key)) {
            // Gọi load lại trang đầu tiên để cập nhật bài mới lên trên cùng
            loadSubmissions(false);
        }
    });
    listenFirebase(db.ref('users'), 'value', renderUsers);
    listenFirebase(db.ref('profile_requests'), 'value', debounce(loadProfileRequests, 1500));
    listenFirebase(db.ref('materials'), 'value', debounce(loadMaterialsListTeacher, 1500));
    listenFirebase(db.ref('schedule'), 'value', debounce(loadScheduleTeacher, 1500));
    listenFirebase(db.ref('spin_history'), 'value', debounce(loadSpinHistory, 1500));
    listenFirebase(db.ref('student_coins'), 'value', debounce(loadStudentsList, 1500));
    listenFirebase(db.ref('cash_requests'), 'value', debounce(loadTeacherCashRequests, 1500));

    // ==========================================
    // PHẦN 3: LẮNG NGHE SETTINGS (Dữ liệu nhỏ, giữ nguyên real-time)
    // ==========================================
    listenFirebase(db.ref('roadmap_settings/passingGrade'), 'value', (snapshot) => {
        const val = snapshot.val() || 7;
        if (document.getElementById('passingGradeSetting')) document.getElementById('passingGradeSetting').value = val;
        window.currentPassingGrade = parseFloat(val);
        if (document.getElementById('teacherRoadmapBody')) renderTeacherRoadmap();
    });

    listenFirebase(db.ref('game_settings'), 'value', (snapshot) => {
        const settings = snapshot.val() || { isOpen: true, lockMessage: '' };
        window.isGameEnabled = settings.isOpen;

        const toggleInput = document.getElementById('gameToggle');
        const msgArea = document.getElementById('gameLockMessageArea');
        const msgInput = document.getElementById('gameLockMessage');

        if (toggleInput) toggleInput.checked = !!settings.isOpen;
        if (msgInput && !msgInput.matches(':focus')) msgInput.value = settings.lockMessage || '';
        if (msgArea) msgArea.style.display = settings.isOpen ? 'none' : 'block';
    });

    // Sửa lỗi: Cộp chung 2 listener vòng quay bị trùng lặp ở code cũ
    window.wheelProbs = { miss: 50, c100: 20, c150: 25, c500: 4, gift: 1 };
    listenFirebase(db.ref('game_settings/wheel_probabilities'), 'value', (snapshot) => {
        const probs = snapshot.val() || { miss: 50, c100: 20, c150: 25, c500: 4, gift: 1 };
        window.wheelProbs = probs;
        if (document.getElementById('probMiss')) {
            document.getElementById('probMiss').value = probs.miss;
            document.getElementById('prob100').value = probs.c100;
            document.getElementById('prob150').value = probs.c150;
            document.getElementById('prob500').value = probs.c500;
            document.getElementById('probGift').value = probs.gift;
        }
    });

    listenFirebase(db.ref('store_settings'), 'value', (snapshot) => {
        const settings = snapshot.val();
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
                    item.isLocked = !!settings[item.id].isLocked;
                }
            });
            if (typeof initTeacherStoreManagement === 'function') initTeacherStoreManagement();
        }
    });

    listenFirebase(db.ref('system_settings/conversionTableEnabled'), 'value', (snapshot) => {
        const isEnabled = snapshot.val() !== false;
        window.isConversionEnabled = isEnabled;
        const toggleBtn = document.getElementById('toggleConversionTable');
        if (toggleBtn) toggleBtn.checked = isEnabled;

        const conversionSection = document.getElementById('conversionTableSection');
        if (conversionSection) conversionSection.style.display = isEnabled ? 'block' : 'none';

        const coinModal = document.getElementById('coinConversionModal');
        if (!isEnabled && coinModal && coinModal.classList.contains('active')) {
            closeCoinConversionModal();
        }
    });

    // Lắng nghe giáo viên nhập điểm (Giữ nguyên)
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
        // Thêm margin-bottom: 20px
        return `<div class="video-wrapper" style="margin-bottom: 20px;"><iframe width="100%" height="315" src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
    }
    // Thêm margin-bottom: 20px
    return `<div class="video-wrapper" style="margin-bottom: 20px;"><iframe width="100%" height="315" src="${url}" frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;
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
    const type =
        document.getElementById('assessmentType').value;

    const tuLuan =
        document.getElementById('tuLuanFields');

    const tracNghiem =
        document.getElementById('tracNghiemFields');

    const scoreDist =
        document.getElementById('scoreDistributionFields');

    const videoGroup =
        document.getElementById('videoLinkGroup');

    if (type === 'tu_luan') {
        if (tuLuan) tuLuan.style.display = 'block';
        if (tracNghiem) tracNghiem.style.display = 'none';
        if (scoreDist) scoreDist.style.display = 'none';
        if (videoGroup) videoGroup.style.display = 'block';

    } else if (type === 'trac_nghiem') {
        if (tuLuan) tuLuan.style.display = 'none';
        if (tracNghiem) tracNghiem.style.display = 'block';
        if (scoreDist) scoreDist.style.display = 'none';

        // Trắc nghiệm thường không dùng video
        if (videoGroup) videoGroup.style.display = 'none';

    } else if (type === 'ket_hop') {
        if (tuLuan) tuLuan.style.display = 'block';
        if (tracNghiem) tracNghiem.style.display = 'block';
        if (scoreDist) scoreDist.style.display = 'block';
        if (videoGroup) videoGroup.style.display = 'block';

    } else if (type === 'thi') {
        if (scoreDist) scoreDist.style.display = 'block';

        // Bài thi được phép gắn video trước khi bắt đầu
        if (videoGroup) videoGroup.style.display = 'block';

        window.updateExamFields();
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
    const title = document.getElementById('title').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const targetStudent = window.getMultiSelectValues('targetStudent');
    const type = document.getElementById('assessmentType').value;
    let desc = '', videoLink = '', attachedFile = null, questions = [];
    let mcWeight = null, essayWeight = null;
    let hideEssayText = false;

    // ==========================================
    // 1. KIỂM TRA DỮ LIỆU ĐẦU VÀO (VALIDATION)
    // ==========================================
    if (!title || !startDate || !endDate) return alert("⚠️ Vui lòng điền đủ Tiêu đề và Thời hạn!");
    if (title.length < 5) return alert("⚠️ Tiêu đề bài tập quá ngắn (yêu cầu ít nhất 5 ký tự)!");

    // Kiểm tra logic thời gian
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
        return alert("⏳ Lỗi thời gian: Hạn nộp bài (Thời gian kết thúc) phải diễn ra SAU Thời gian bắt đầu!");
    }

    // Kiểm tra định dạng link YouTube (Nếu có nhập)
    const rawVideoLink =
        document.getElementById('videoLink').value.trim();
    videoLink = rawVideoLink;
    if (rawVideoLink) {
        const ytRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
        if (!ytRegex.test(rawVideoLink)) {
            return alert("🔗 Lỗi: Đường dẫn video không hợp lệ! Hệ thống hiện chỉ hỗ trợ link từ YouTube.");
        }
    }

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
        desc = window.quillDesc.root.innerHTML;
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

    let watchCondition = 0;
    if (rawVideoLink) {
        const d = parseInt(document.getElementById('condDay').value) || 0;
        const h = parseInt(document.getElementById('condHour').value) || 0;
        const m = parseInt(document.getElementById('condMin').value) || 0;
        const s = parseInt(document.getElementById('condSec').value) || 0;
        watchCondition = d * 86400 + h * 3600 + m * 60 + s;
    }

    await pushDB('assignments', {
        id: Date.now().toString(), title, desc,
        startDate: startDate.replace("T", " "), endDate: endDate.replace("T", " "),
        targetStudent, file: attachedFile, videoLink: videoLink,
        assessmentType: type, questions: questions,
        mcWeight: mcWeight, essayWeight: essayWeight,
        hideEssayText: hideEssayText,
        watchCondition: watchCondition // Đẩy lên Firebase dữ liệu cấu hình mới
    });

    document.getElementById('title').value = ''; document.getElementById('desc').value = '';
    document.getElementById('startDate').value = ''; document.getElementById('endDate').value = '';
    document.getElementById('videoLink').value = ''; document.getElementById('fileInput').value = '';
    document.getElementById('questionsContainer').innerHTML = ''; questionCount = 0;
    if (document.getElementById('hideEssayText')) document.getElementById('hideEssayText').checked = false; // Reset checkbox
    dtTeacherAssign.items.clear(); attachedFileData = null;

    // Xóa bản nháp đi để lần sau mở form lên là form trống
    localStorage.removeItem('draft_teacher_title');
    localStorage.removeItem('draft_teacher_desc');

    alert("Giao bài tập thành công!");
}

async function loadAssignedList(isLoadMore = false) {
    const container = document.getElementById('assignedListContainer');
    if (!container) return;

    if (!isLoadMore) {
        currentAssignKey = null;
        isAssignEnd = false;
        container.innerHTML = '<p style="color:#666; text-align:center; padding:20px;">⏳ Đang tải danh sách bài tập...</p>';
        window.cachedAssignments = [];
    }

    if (isAssignEnd) return;

    const btn = document.getElementById('btnLoadMoreAssignments');
    if (btn) {
        btn.disabled = true;
        btn.innerText = '⏳ Đang tải...';
    }

    // 1. Chỉ lấy 20 bài/lần thay vì getDB('assignments') toàn bộ.
    const { items: assignmentsPage, nextKey } = await getPaginatedDB('assignments', PAGE_LIMIT, currentAssignKey);
    currentAssignKey = nextKey;
    if (!nextKey || assignmentsPage.length < PAGE_LIMIT) isAssignEnd = true;

    if (!isLoadMore) container.innerHTML = '';

    if (assignmentsPage.length === 0 && !isLoadMore) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Chưa có bài tập nào.</p>';
        return;
    }

    // Lưu cache chỉ cho các bài đang hiển thị, không giữ toàn bộ database.
    window.cachedAssignments = isLoadMore
        ? [...(window.cachedAssignments || []), ...assignmentsPage]
        : assignmentsPage;

    // 2. Lấy học sinh bằng query role=student.
    const students = await getStudentsLite();

    // 3. Chỉ lấy submissions của các bài đang render, không kéo toàn bộ submissions.
    const assignmentIds = assignmentsPage.map(a => a.id).filter(Boolean);
    const submissionsByAssignment = await getSubmissionsByAssignmentIds(assignmentIds);

    // 4. Sắp xếp trong phạm vi trang hiện tại.
    const nowSort = new Date();
    assignmentsPage.sort((a, b) => {
        const getSortVals = (assign) => {
            const end = assign.endDate ? new Date(assign.endDate.replace(" ", "T")) : new Date("2100-01-01");
            const relatedSubs = submissionsByAssignment[assign.id] || [];

            let rank = 2;
            if (nowSort <= end) rank = 1;

            const isRedoing = relatedSubs.some(s => s.isRedoing);
            const needsGrading = relatedSubs.some(s =>
                !s.isRedoing &&
                !s.isAutoSubmitted &&
                !s.isLateFail &&
                (s.grade === null || s.grade === undefined || s.grade === '')
            );
            if (isRedoing || needsGrading) rank = 1;

            let lessonNum = 0;
            const match = (assign.title || '').match(/bài\s*(\d+)/i);
            if (match) lessonNum = parseInt(match[1], 10);

            return { rank, lessonNum };
        };

        const valsA = getSortVals(a);
        const valsB = getSortVals(b);
        if (valsA.rank !== valsB.rank) return valsA.rank - valsB.rank;
        if (valsA.lessonNum !== valsB.lessonNum) return valsA.lessonNum - valsB.lessonNum;
        return (a.title || '').localeCompare(b.title || '', 'vi-VN');
    });

    assignmentsPage.forEach(assign => {
        const relatedSubs = submissionsByAssignment[assign.id] || [];

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

        const now = new Date();
        const startTime = assign.startDate ? new Date(assign.startDate.replace(" ", "T")) : new Date(0);
        let statusBadge = '';

        if (now < startTime) {
            statusBadge = `<span style="background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 4px 10px; border-radius: 20px; font-size: 0.75em; margin-left: 10px; vertical-align: middle; white-space: nowrap; font-weight: bold; border: 1px solid rgba(245, 158, 11, 0.3);">⏳ Chưa đến giờ</span>`;
        } else {
            const targetStudents = students.filter(u => {
                const arr = Array.isArray(assign.targetStudent) ? assign.targetStudent : [assign.targetStudent || 'all'];
                return arr.includes('all') || arr.includes(u.username);
            });

            const totalAssigned = targetStudents.length;
            const submittedUsernames = new Set(relatedSubs.map(s => s.studentUsername));
            const submittedCount = targetStudents.filter(st => submittedUsernames.has(st.username)).length;

            if (submittedCount === 0) {
                statusBadge = `<span style="background: rgba(225, 29, 72, 0.15); color: #e11d48; padding: 4px 10px; border-radius: 20px; font-size: 0.75em; margin-left: 10px; vertical-align: middle; white-space: nowrap; font-weight: bold; border: 1px solid rgba(225, 29, 72, 0.3);">🔴 Chưa ai nộp (0/${totalAssigned})</span>`;
            } else if (submittedCount < totalAssigned) {
                statusBadge = `<span style="background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 4px 10px; border-radius: 20px; font-size: 0.75em; margin-left: 10px; vertical-align: middle; white-space: nowrap; font-weight: bold; border: 1px solid rgba(245, 158, 11, 0.3);">🟡 Đang làm (${submittedCount}/${totalAssigned})</span>`;
            } else {
                statusBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: #059669; padding: 4px 10px; border-radius: 20px; font-size: 0.75em; margin-left: 10px; vertical-align: middle; white-space: nowrap; font-weight: bold; border: 1px solid rgba(16, 185, 129, 0.3);">🟢 Đã nộp đủ (${submittedCount}/${totalAssigned})</span>`;
            }
        }

        let fileHTML = '';
        if (assign.file) {
            const files = Array.isArray(assign.file) ? assign.file : [assign.file];
            files.forEach(f => {
                const fileUrl = f.url || f.base64 || '#';
                fileHTML += `<p style="margin-top:10px;"><strong>📎 File đính kèm:</strong> <a href="${fileUrl}" download="${f.name}" class="file-download-link">${f.name}</a></p>`;
            });
        }

        const videoHTML = assign.videoLink ? getEmbedHTML(assign.videoLink) : '';

        let quizHTML = '';
        const hasMC = assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop' || (assign.assessmentType === 'thi' && (assign.mcWeight || 0) > 0);
        if (hasMC && assign.questions) {
            quizHTML = `<div style="background: rgba(255,255,255,0.5); padding: 10px; border-radius: 8px; margin-top: 10px; margin-bottom: 15px;"><strong>Trắc nghiệm:</strong><ul style="margin-left: 20px;">`;
            assign.questions.forEach((q, idx) => { quizHTML += `<li>Câu ${idx + 1}: ${q.qText} <strong>(${q.correct})</strong></li>`; });
            quizHTML += '</ul></div>';
        }

        const hasEssay = assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType || (assign.assessmentType === 'thi' && (assign.essayWeight || 0) > 0);
        const tuLuanHTML = hasEssay ? `
        <div style="background: rgba(255, 255, 255, 0.8); border-radius: 10px; margin-top: 15px; border: 1px solid rgba(0, 0, 0, 0.08); box-shadow: 0 2px 4px rgba(0,0,0,0.02); overflow: hidden;">
            <div style="background: rgba(102, 126, 234, 0.1); padding: 8px 15px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); font-weight: 600; color: #4338ca; font-size: 0.9em; display: flex; align-items: center; gap: 8px;">
                📝 Yêu cầu Tự luận / Hướng dẫn
            </div>
            <div class="ql-editor" style="padding: 12px 15px; color: #374151; font-size: 0.95em; line-height: 1.6; max-height: 150px; overflow-y: auto; word-break: break-word; background: rgba(0,0,0,0.01);">
                ${(assign.desc || '').replace(/\n/g, '<br>')}
            </div>
        </div>` : '';

        const uniqueId = `teacher-assign-${assign.id}`;
        const div = document.createElement('div');
        div.className = 'card accordion-card';
        div.id = 'assignment-card-' + assign._fbKey;
        div.setAttribute('data-target', Array.isArray(assign.targetStudent) ? assign.targetStudent.join(',') : (assign.targetStudent || 'all'));

        if (typeof activeAssignedStudentFilter !== 'undefined' && activeAssignedStudentFilter !== 'all') {
            const targets = Array.isArray(assign.targetStudent) ? assign.targetStudent : [assign.targetStudent || 'all'];
            if (!targets.includes('all') && !targets.includes(activeAssignedStudentFilter)) {
                div.style.display = 'none';
            }
        }

        div.innerHTML = `<div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)">
            <div class="accordion-title">
                <h4 style="display: flex; align-items: center; gap: 5px; margin: 0;">${assign.title} ${statusBadge}</h4>
                <span style="display: block; margin-top: 5px;">Loại: ${typeText}</span>
            </div>
            <div class="accordion-meta"><span>Hạn: <strong>${assign.endDate || 'Không có'}</strong></span><span class="toggle-icon">▼</span></div>
        </div>
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

    // Nút tải thêm, tự tạo nếu HTML chưa có.
    let loadMore = document.getElementById('btnLoadMoreAssignments');
    if (!loadMore) {
        loadMore = document.createElement('button');
        loadMore.id = 'btnLoadMoreAssignments';
        loadMore.className = 'btn-approve';
        loadMore.style.cssText = 'display:block; margin:20px auto; padding:10px 22px;';
        loadMore.onclick = () => loadAssignedList(true);
        container.after(loadMore);
    }

    loadMore.style.display = isAssignEnd ? 'none' : 'block';
    loadMore.disabled = false;
    loadMore.innerText = '⬇️ Tải thêm bài tập';

    if (window.MathJax) {
        MathJax.typesetPromise([container]).catch((err) => console.log('MathJax error:', err));
    }
}

// LOGIC XỬ LÝ ĐĂNG TẢI TÀI LIỆU
function initMaterialFileListener() {
    const mInput = document.getElementById('materialFileInput');
    if (!mInput) return;

    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    mInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        attachedMaterialFileData = null;

        if (!file) return;

        // Chặn trước khi FileReader đọc Base64
        if (file.size > MAX_SIZE_BYTES) {
            alert(`⚠️ File "${file.name}" quá lớn (${(file.size / (1024 * 1024)).toFixed(2)}MB). Hệ thống chỉ cho phép tối đa ${MAX_SIZE_MB}MB/file và đã tự động loại bỏ file này!`);
            e.target.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            attachedMaterialFileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                base64: event.target.result
            };
        };

        reader.onerror = function () {
            attachedMaterialFileData = null;
            e.target.value = '';
            alert(`⚠️ Không thể đọc file "${file.name}". Vui lòng chọn lại file khác!`);
        };

        reader.readAsDataURL(file);
    });
}

async function createMaterial() {
    const title = document.getElementById('materialTitle').value.trim();
    const videoLink = document.getElementById('materialVideoLink').value.trim();
    const docLink = document.getElementById('materialLinkInput').value.trim();
    const targetStudent = window.getMultiSelectValues('materialTargetStudent'); // MỚI THÊM

    if (!title) return alert("Vui lòng nhập tiêu đề tài liệu!");
    if (!videoLink && !docLink) return alert("Vui lòng đính kèm ít nhất video bài giảng hoặc link tài liệu!");

    const now = new Date();
    await pushDB('materials', {
        id: Date.now().toString(), title, videoLink, docLink,
        targetStudent, // MỚI THÊM: Đẩy dữ liệu đích danh lên Firebase
        uploadTime: now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN')
    });

    document.getElementById('materialTitle').value = '';
    document.getElementById('materialVideoLink').value = '';
    document.getElementById('materialLinkInput').value = '';
    if (document.getElementById('materialTargetStudent')) document.getElementById('materialTargetStudent').value = 'all'; // Reset ô chọn

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
        div.className = 'card accordion-card';
        div.setAttribute('data-target', Array.isArray(mat.targetStudent) ? mat.targetStudent.join(',') : (mat.targetStudent || 'all'));

        if (typeof activeMaterialStudentFilter !== 'undefined' && activeMaterialStudentFilter !== 'all') {
            const targets = Array.isArray(mat.targetStudent) ? mat.targetStudent : [mat.targetStudent || 'all'];
            if (!targets.includes('all') && !targets.includes(activeMaterialStudentFilter)) {
                div.style.display = 'none';
            }
        }

        div.innerHTML = `
            <div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)">
                <div class="accordion-title"><h4>${mat.title}</h4><span>🕒 Đăng lúc: ${mat.uploadTime || 'Chưa rõ'}</span></div>
                <div class="accordion-meta"><span class="toggle-icon">▼</span></div>
            </div>
            <div id="${uniqueId}" class="accordion-content">
                <div style="text-align: right; margin-bottom:15px; display: flex; gap: 10px; justify-content: flex-end;">
    <button class="btn-approve" style="padding: 6px 15px; font-size: 0.9em; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white;" onclick="openEditMaterialModal('${mat._fbKey}')">✏️ Sửa</button>
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

window.deleteAssignment = async function (assignId) {
    if (!confirm("Bạn có chắc chắn muốn xóa bài tập này?")) return;

    try {
        // 1. Xóa trên Firebase
        await db.ref('assignments/' + assignId).remove();

        // 2. Thông báo thành công
        alert("Xóa thành công!");

        // 3. 🔥 CẬP NHẬT GIAO DIỆN NGAY LẬP TỨC
        const element = document.getElementById('assignment-card-' + assignId);
        if (element) {
            element.remove(); // Xóa thẻ HTML khỏi trang mà không cần F5
        }

    } catch (error) {
        console.error("Lỗi khi xóa:", error);
        alert("Có lỗi xảy ra: " + error.message);
    }
};

function initFileListener() {
    const fInput = document.getElementById('fileInput');
    if (!fInput) return;

    fInput.addEventListener('change', function (e) {
        const MAX_SIZE_BYTES = 5 * 1024 * 1024; // Giới hạn an toàn: 5MB
        let hasOversize = false;

        // Lấy danh sách tên các file đã có trong bộ đệm để tránh trùng lặp
        const existingNames = Array.from(dtTeacherAssign.files).map(f => f.name);

        for (let i = 0; i < e.target.files.length; i++) {
            const currentFile = e.target.files[i];

            // BƯỚC VÁ LỖI: Chặn file quá nặng trước khi xử lý
            if (currentFile.size > MAX_SIZE_BYTES) {
                alert(`⚠️ File "${currentFile.name}" quá lớn (${(currentFile.size / (1024 * 1024)).toFixed(2)}MB). Hệ thống chỉ cho phép tối đa 5MB/file và đã tự động loại bỏ file này để bảo vệ máy chủ!`);
                hasOversize = true;
                continue; // Bỏ qua, không đưa vào danh sách cộng dồn
            }

            // Nếu dung lượng hợp lệ và chưa có trong danh sách thì tiến hành cộng dồn
            if (!existingNames.includes(currentFile.name)) {
                dtTeacherAssign.items.add(currentFile);
            }
        }

        // Gán ngược danh sách đã cộng dồn (và đã lọc file rác) vào ô input
        fInput.files = dtTeacherAssign.files;

        // Xử lý giao diện: Nếu file chọn vào bị từ chối hết và danh sách đệm trống, ta dọn sạch ô input
        if (hasOversize && dtTeacherAssign.files.length === 0) {
            fInput.value = '';
        }
    });
}

async function populateStudentDropdown() {
    const users = await getDB('users');
    const select = document.getElementById('targetStudent');
    const matSelect = document.getElementById('materialTargetStudent');
    const editMatSelect = document.getElementById('editMaterialTargetStudent');
    const schSelect = document.getElementById('scheduleTargetStudent'); // THÊM DÒNG NÀY

    if (select) select.innerHTML = '<option value="all">Tất cả học sinh</option>';
    if (matSelect) matSelect.innerHTML = '<option value="all">Tất cả học sinh</option>';
    if (editMatSelect) editMatSelect.innerHTML = '<option value="all">Tất cả học sinh</option>';
    if (schSelect) schSelect.innerHTML = '<option value="all">Tất cả học sinh</option>'; // THÊM DÒNG NÀY

    users.forEach(u => {
        if (u.role === 'student') {
            const opt = document.createElement('option');
            opt.value = u.username;
            opt.innerText = u.name;
            if (select) select.appendChild(opt.cloneNode(true));
            if (matSelect) matSelect.appendChild(opt.cloneNode(true));
            if (editMatSelect) editMatSelect.appendChild(opt.cloneNode(true));
            if (schSelect) schSelect.appendChild(opt.cloneNode(true)); // THÊM DÒNG NÀY
        }
    });
}

async function loadSubmissions(isLoadMore = false) {
    const list = document.getElementById('submissionsList');
    if (!list) return;

    if (!isLoadMore) {
        // Reset trạng thái nếu là tải mới hoàn toàn
        currentSubKey = null;
        isSubEnd = false;
        list.innerHTML = '';
    }

    if (isSubEnd) return;

    // Hiển thị trạng thái đang tải
    const loadingId = 'sub-loading-indicator';
    if (isLoadMore) {
        const btn = document.getElementById('btnLoadMoreSubs');
        if (btn) btn.innerText = '⏳ Đang tải...';
    } else {
        list.innerHTML = `<p id="${loadingId}" style="text-align:center; color:#666; padding: 20px;">⏳ Đang tải dữ liệu bài nộp...</p>`;
    }

    // GỌI HÀM PHÂN TRANG (Lấy từ DB thay vì kéo toàn bộ)
    const { items: rawSubmissions, nextKey } = await getPaginatedDB('submissions', PAGE_LIMIT, currentSubKey);

    // Cập nhật mốc key cho lần tải sau
    currentSubKey = nextKey;
    if (!nextKey || rawSubmissions.length < PAGE_LIMIT) {
        isSubEnd = true;
    }

    // Xóa chữ "Đang tải" của lần tải đầu
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    if (rawSubmissions.length === 0 && !isLoadMore) {
        list.innerHTML = '<p style="color: #666; font-style: italic;">Chưa có bài nộp nào.</p>';
        return;
    }

    // Chỉ lấy assignments liên quan đến 20 bài nộp đang hiển thị, không kéo toàn bộ assignments.
    const assignmentIdsForSubs = [...new Set(rawSubmissions.map(s => s.assignmentId).filter(Boolean))];
    const assignments = await getAssignmentsByIds(assignmentIdsForSubs);

    const trackingSnap = await db.ref('video_tracking').once('value');
    const trackingData = trackingSnap.val() || {};

    const uniqueSubmissions = {};
    rawSubmissions.forEach(sub => {
        const key = `${sub.assignmentId}_${sub.studentUsername}`;
        if (!uniqueSubmissions[key]) {
            uniqueSubmissions[key] = sub;
        } else {
            if (!sub.isAutoSubmitted) {
                uniqueSubmissions[key] = sub;
            }
        }
    });

    // Đảo ngược mảng để bài mới nhất lên trên
    let submissions = Object.values(uniqueSubmissions).reverse();

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
        let watchDuration = 0;
        if (trackingData[assign.id] && trackingData[assign.id][sub.studentUsername]) {
            watchDuration = trackingData[assign.id][sub.studentUsername];
        }

        let d = Math.floor(watchDuration / (24 * 3600));
        let h = Math.floor((watchDuration % (24 * 3600)) / 3600);
        let m = Math.floor((watchDuration % 3600) / 60);
        let s = watchDuration % 60;

        let timeParts = [];
        if (d > 0) timeParts.push(`${d} ngày`);
        if (h > 0) timeParts.push(`${h} giờ`);
        if (m > 0) timeParts.push(`${m} phút`);
        if (s > 0 || timeParts.length === 0) timeParts.push(`${s} giây`);

        let timeStr = timeParts.join(' ');

        let watchStatusHTML = assign.videoLink ? `
            <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 10px; margin-bottom: 15px; border-radius: 8px;">
                <strong style="color: #059669;">⏱️ Thời lượng HS đã xem Video:</strong> 
                <span style="font-weight: bold; color: #2c3e50;">${timeStr}</span>
                ${watchDuration === 0 ? '<span style="color: #e11d48; font-size: 0.85em; margin-left: 5px;">(Học sinh chưa xem hoặc lướt qua)</span>' : ''}
            </div>` : '';

        let gradeStatus = '';
        let actionHTML = '';

        let pardonHTML = '';
        if (sub.isLateFail || sub.isAutoSubmitted) {
            pardonHTML = `<button class="btn-approve" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; margin-left: 5px; border: 2px solid #059669;" onclick="pardonSubmission('${sub._fbKey}')">✨ Tha lỗi (Tính bình thường)</button>`;
        }

        if (sub.isRedoing) {
            gradeStatus = `<span class="status-pending" style="background: rgba(59, 130, 246, 0.15); color: #2563eb;">Đang làm lại</span>`;
            const now = new Date();
            const endTime = assign.endDate ? new Date(assign.endDate.replace(" ", "T")) : new Date("2100-01-01");

            if (now > endTime) {
                actionHTML = `<button class="btn-reject" style="width: 100%; padding: 10px;" onclick="forceSubmitRedo('${sub._fbKey}')">🔒 Khóa bài (Thu bài ngay)</button>`;
            } else {
                actionHTML = `<span style="color:#666; font-size:0.9em; font-style:italic;">⏳ Đang đợi học sinh nộp lại...</span>`;
            }
            actionHTML += pardonHTML;
        } else {
            let regradeStatusText = sub.isRegrading ? " (Đang chấm lại)" : "";
            gradeStatus = hasGrade ? `<span class="status-done">Đã chấm: ${sub.grade} điểm${regradeStatusText}</span>` : `<span class="status-pending">Chưa chấm${regradeStatusText}</span>`;

            actionHTML = `<input type="number" id="grade-${sub.id}" placeholder="Điểm" max="10" min="0" style="margin: 0; width: 90px; text-align: center; font-weight: bold;" value="${hasGrade ? sub.grade : ''}">
                          <button class="btn-approve" onclick="gradeSubmission('${sub.id}')">Lưu điểm</button>
                          <button class="btn-reject" onclick="requestRedo('${sub._fbKey}')">Cho làm lại</button>`;

            if (hasGrade && !sub.isRegrading) {
                actionHTML += `<button class="btn-reject" style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; margin-left: 5px;" onclick="requestRegrade('${sub._fbKey}')">Chấm lại</button>`;
            }
            actionHTML += pardonHTML;
        }

        let violationHTML = '';
        if (sub.isCheatFail) {
            violationHTML = `<div style="background: rgba(225, 29, 72, 0.1); border-left: 4px solid #e11d48; padding: 10px; margin-top: 10px; margin-bottom: 10px; border-radius: 8px;"><strong style="color: #e11d48;">🚨 HỌC SINH VI PHẠM QUY CHẾ THI:</strong><br><span style="color:#b91c1c; font-size:0.9em;">Hệ thống phát hiện học sinh này đã tự ý thoát khỏi chế độ Toàn màn hình trong lúc thi.</span></div>`;
        }

        let missingEssayBadge = sub.isEssayMissing ? '<span style="background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; margin-left: 8px; font-weight: bold; vertical-align: middle;">⚠️ Thiếu tự luận</span>' : '';

        const uniqueId = `teacher-sub-${sub.id}`;
        const div = document.createElement('div');
        div.className = 'card accordion-card';
        div.setAttribute('data-student', sub.studentUsername);

        if (typeof activeSubmissionStudentFilter !== 'undefined' && activeSubmissionStudentFilter !== 'all') {
            if (sub.studentUsername !== activeSubmissionStudentFilter) {
                div.style.display = 'none';
            }
        }

        div.innerHTML = `<div class="accordion-header" onclick="toggleAccordion('${uniqueId}', this)">
    <div class="accordion-title"><h4>${assign.title}</h4><span>HS: <strong>${sub.studentName}</strong> ${missingEssayBadge}</span></div>
    <div class="accordion-meta"><span>${gradeStatus}</span><span class="toggle-icon">▼</span></div>
</div>
            <div id="${uniqueId}" class="accordion-content">${violationHTML}<span style="color: #888; font-size: 0.85em; display: block; margin-bottom: 10px;">🕒 Lần nộp cuối: ${sub.submitTime || 'Chưa rõ'}</span>
    ${watchStatusHTML}
    ${videoHTML}
                <div style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 12px; margin-top: 20px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.05);">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c3e50; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 8px;">📝 Bài nộp của học sinh:</p>
<div style="background: rgba(0,0,0,0.02); padding: 15px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.03);">
    <div class="ql-editor" style="word-break: break-word; margin: 0; color: #444; line-height: 1.6; padding: 0;">${sub.answer ? sub.answer.replace(/\n/g, '<br>') : '<i>(Trống)</i>'}</div>
</div>
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

    // Xử lý nút "Tải thêm"
    let loadMoreBtn = document.getElementById('btnLoadMoreSubs');
    if (!isSubEnd) {
        if (!loadMoreBtn) {
            loadMoreBtn = document.createElement('button');
            loadMoreBtn.id = 'btnLoadMoreSubs';
            loadMoreBtn.innerText = '👇 Tải thêm các bài nộp cũ hơn';
            loadMoreBtn.style.cssText = 'width: 100%; padding: 12px; margin-top: 15px; background: transparent; border: 2px dashed #667eea; color: #667eea; border-radius: 8px; cursor: pointer; font-weight: bold;';
            loadMoreBtn.onclick = () => loadSubmissions(true);
            list.parentElement.appendChild(loadMoreBtn);
        } else {
            loadMoreBtn.innerText = '👇 Tải thêm các bài nộp cũ hơn';
            loadMoreBtn.style.display = 'block';
        }
    } else if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }

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
    renderStudentFilterButtons(students);
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

        // Đọc trạng thái tham gia lộ trình (Mặc định là true nếu chưa có dữ liệu)
        let participateChecked = st.isParticipatingRoadmap !== false ? 'checked' : '';

        // LẤY SỐ COIN TƯƠNG ỨNG VỚI USERNAME (Mặc định là 0 nếu chưa có)
        let studentCoins = coinData[st.username] || 0;

        html += `<tr style="border-bottom: 1px solid rgba(0,0,0,0.05); ${st.isLocked ? 'background: rgba(225, 29, 72, 0.05);' : ''}">
            <td style="padding:12px;">
                <strong>${st.name}</strong> <br>
                <span style="font-size: 0.85em; color: #666;">Lớp: ${st.classInfo || '---'}</span>${statusText}
                <div style="margin-top: 8px;">
                    <label style="cursor: pointer; font-size: 0.85em; color: #059669; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" ${participateChecked} onchange="toggleParticipateRoadmap('${st._fbKey}', this.checked)" style="margin: 0; width: 16px; height: 16px;">
                        Tham gia lộ trình
                    </label>
                </div>
            </td>
            <td style="padding:12px;">${st.username}</td>
            <td style="padding:12px;">${st.password}</td>
            
            <td style="padding:12px; text-align: center; color: #d35400; font-weight: bold; font-size: 1.1em;">
                ${studentCoins.toLocaleString('vi-VN')} 🪙
            </td>

            <td style="padding:12px; text-align: center; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                <button style="padding:5px 12px; font-size: 0.85em; border: none; border-radius: 6px; cursor: pointer; ${lockBtnStyle}" onclick="toggleLockStudent('${st._fbKey}', ${!!st.isLocked})">${lockBtnText}</button>
                <button class="btn-approve" style="padding:5px 12px; font-size:0.85em; background: #3b82f6; color: white;" onclick="openEditStudentModal('${st._fbKey}')">Sửa</button>
                <button class="btn-reject" style="padding:5px 12px; font-size: 0.85em;" onclick="deleteStudent('${st._fbKey}')">Xóa</button>
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

    // ==========================================
    // KIỂM TRA DỮ LIỆU ĐẦU VÀO (VALIDATION)
    // ==========================================
    if (!username || !password || !name) return alert('⚠️ Vui lòng điền đủ Tên đăng nhập, Mật khẩu và Họ tên!');

    // 1. Kiểm tra Tên đăng nhập (Chỉ cho phép chữ cái không dấu, số, dấu gạch dưới)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        return alert('❌ Tên đăng nhập không hợp lệ! Không được chứa khoảng trắng, dấu Tiếng Việt hoặc ký tự đặc biệt (chỉ chấp nhận a-z, 0-9 và _).');
    }
    if (username.length < 2) return alert('⚠️ Tên đăng nhập phải có ít nhất 2 ký tự!');

    // 2. Kiểm tra Mật khẩu an toàn
    if (password.length < 6) return alert('🔒 Mật khẩu quá ngắn! Cần ít nhất 6 ký tự để đảm bảo an toàn.');

    // 3. (Tùy chọn) Kiểm tra Họ tên không chứa số
    const nameHasNumbers = /\d/.test(name);
    if (nameHasNumbers) return alert('⚠️ Họ tên học sinh không được chứa chữ số!');
    // ==========================================

    const fakeEmail = username + "@hethong.edu.vn"; // Tạo email giả cho Auth

    try {
        // 1. Tạo tài khoản trên hệ thống Auth bằng App phụ (Secondary App)
        const userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(fakeEmail, password);
        const newUid = userCredential.user.uid;

        // 2. Lưu thông tin vào Database với khóa chính (key) là UID vừa sinh ra
        await db.ref('users/' + newUid).set({
            username,
            password, // Auth đã quản lý pass, bạn có thể xóa dòng này nếu muốn bảo mật tuyệt đối
            name,
            role: 'student',
            isLocked: false,
            classInfo,
            hobbies,
            motto
        });

        // 3. Đăng xuất app phụ ngay lập tức để không ảnh hưởng app chính
        await secondaryApp.auth().signOut();

        // Dọn dẹp Form sau khi thành công
        document.getElementById('newStudentUsername').value = '';
        document.getElementById('newStudentPassword').value = '';
        document.getElementById('newStudentName').value = '';
        document.getElementById('newStudentClass').value = '';
        document.getElementById('newStudentHobbies').value = '';
        document.getElementById('newStudentMotto').value = '';

        closeStudentModal();
        alert('✅ Đã tạo tài khoản học sinh thành công!');

        // Tùy chọn: Tải lại danh sách học sinh ngay lập tức
        if (typeof loadStudentsList === 'function') loadStudentsList();

    } catch (error) {
        // Bắt lỗi trùng lặp từ Auth thay vì phải tải toàn bộ bảng Users về để check
        if (error.code === 'auth/email-already-in-use') {
            alert('❌ Tên đăng nhập này đã tồn tại trên hệ thống! Vui lòng chọn tên khác.');
        } else {
            alert('❌ Lỗi tạo tài khoản: ' + error.message);
        }
    }
}

let isProcessingDelete = false;

window.deleteStudent = async function (uid) {
    if (isProcessingDelete) {
        alert("⏳ Hệ thống đang xử lý một học sinh khác!");
        return;
    }

    isProcessingDelete = true;

    try {
        // Lấy thông tin học sinh trực tiếp từ Database
        const studentSnap = await db.ref(`users/${uid}`).once('value');

        if (!studentSnap.exists()) {
            throw new Error("Không tìm thấy dữ liệu học sinh.");
        }

        const student = studentSnap.val();
        const username = student.username;
        const password = student.password;
        const email = `${username}@hethong.edu.vn`;

        if (!username || !password) {
            throw new Error("Thiếu tên đăng nhập hoặc mật khẩu học sinh.");
        }

        const confirmed = confirm(
            `⚠️ Bạn có chắc chắn muốn xóa TẬN GỐC học sinh [${username}] không?\n` +
            `Hành động này không thể hoàn tác.`
        );

        if (!confirmed) return;

        const secondaryAuth = secondaryApp.auth();

        // Dọn phiên đăng nhập cũ của app phụ
        await secondaryAuth.signOut().catch(() => { });

        // XÓA AUTH TRƯỚC
        const credential =
            await secondaryAuth.signInWithEmailAndPassword(email, password);

        // Kiểm tra tránh xóa nhầm tài khoản
        if (credential.user.uid !== uid) {
            await secondaryAuth.signOut().catch(() => { });
            throw new Error("UID tài khoản Auth không khớp với Database.");
        }

        await credential.user.delete();

        // CHỈ XÓA DATABASE KHI AUTH ĐÃ XÓA THÀNH CÔNG
        const updates = {};

        updates[`users/${uid}`] = null;
        updates[`student_coins/${username}`] = null;
        updates[`student_bonus_tickets/${username}`] = null;
        updates[`student_money_offset/${username}`] = null;
        updates[`student_inventory/${username}`] = null;
        updates[`student_discounts/${username}`] = null;
        updates[`spin_counts/${username}`] = null;
        updates[`student_daily_login/${username}`] = null;
        updates[`inbox_messages/${username}`] = null;
        updates[`historical_grade_tickets/${username}`] = null;

        await db.ref().update(updates);

        alert(
            `✅ Đã xóa hoàn toàn tài khoản và dữ liệu của học sinh [${username}].`
        );

    } catch (error) {
        console.error("Lỗi xóa học sinh:", error);

        if (error.code === "auth/too-many-requests") {
            alert(
                "❌ Firebase đang tạm chặn do thao tác đăng nhập quá nhiều.\n" +
                "Dữ liệu học sinh vẫn được giữ nguyên, không tạo tài khoản bóng ma."
            );
        } else if (
            error.code === "auth/wrong-password" ||
            error.code === "auth/invalid-login-credentials"
        ) {
            alert(
                "❌ Mật khẩu trong Database không khớp với Firebase Auth.\n" +
                "Dữ liệu học sinh chưa bị xóa."
            );
        } else {
            alert(`❌ Xóa học sinh thất bại: ${error.message}`);
        }

        // Chỉ đăng xuất, tuyệt đối không xóa SecondaryApp
        await secondaryApp.auth().signOut().catch(() => { });

    } finally {
        // Mở lại sau khi thao tác đã kết thúc
        setTimeout(() => {
            isProcessingDelete = false;
        }, 3000);
    }
};

async function loadProfileRequests() {
    const requests = await getDB('profile_requests'); const pendingReqs = requests.filter(r => r.status === 'pending'); const card = document.getElementById('requestsCard'); const container = document.getElementById('requestsListContainer');
    if (pendingReqs.length === 0) { card.style.display = 'none'; return; } card.style.display = 'block'; let html = '';
    pendingReqs.forEach(req => { let passInfo = req.newPass ? `<span style="color: #ff0844; font-weight:bold;">Mật khẩu mới: ${req.newPass}</span>` : 'Không đổi'; html += `<div style="background: rgba(255,255,255,0.5); padding: 15px; margin-bottom: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.8);"><p><strong>Học sinh:</strong> ${req.currentName} (<i>${req.username}</i>)</p><p><strong>Đổi tên thành:</strong> <span style="color: #667eea; font-weight:800;">${req.newName}</span></p><p><strong>Mật khẩu:</strong> ${passInfo}</p><div style="margin-top: 15px; display: flex; gap: 10px;"><button onclick="handleRequest('${req._fbKey}', true, '${req.username}', '${(req.newName || '').replace(/'/g, "\\'")}', '${(req.newPass || '').replace(/'/g, "\\'")}')" class="btn-approve">✅ Cho phép</button><button onclick="handleRequest('${req._fbKey}', false, '', '', '')" class="btn-reject">❌ Từ chối</button></div></div>`; });
    container.innerHTML = html;
}
async function handleRequest(reqKey, isApprove, username, newName, newPass) {
    if (isApprove) {
        const users = await getDB('users');
        const userRecord = users.find(u => u.username === username);

        if (userRecord) {
            // NẾU HỌC SINH CÓ YÊU CẦU ĐỔI MẬT KHẨU
            if (newPass) {
                try {
                    const fakeEmail = username + "@hethong.edu.vn";
                    const oldPass = userRecord.password; // Mật khẩu cũ vẫn đang nằm trong DB

                    // Dùng app phụ đăng nhập ngầm vào tài khoản học sinh
                    const userCredential = await secondaryApp.auth().signInWithEmailAndPassword(fakeEmail, oldPass);
                    // Đổi sang mật khẩu mới
                    await userCredential.user.updatePassword(newPass);
                    // Đăng xuất app phụ ngay lập tức
                    await secondaryApp.auth().signOut();
                } catch (error) {
                    console.error("Lỗi đổi pass Auth phụ:", error);
                    return alert("❌ Lỗi hệ thống Auth khi duyệt mật khẩu học sinh: " + error.message);
                }
            }

            // Ghi nhận Database
            const updateData = { name: newName };
            if (newPass) updateData.password = newPass;
            await updateDB('users', userRecord._fbKey, updateData);
        }
        await updateDB('profile_requests', reqKey, { status: 'approved' });
        alert("✅ Đã phê duyệt yêu cầu và đổi mật khẩu thành công!");
    } else {
        await updateDB('profile_requests', reqKey, { status: 'rejected' });
        alert("❌ Đã từ chối yêu cầu!");
    }

    // Tự động load lại danh sách sau khi duyệt
    if (typeof loadProfileRequests === 'function') loadProfileRequests();
}
async function updateProfile() {
    const newName = document.getElementById('settingName').value.trim();
    const newPass = document.getElementById('settingPass').value.trim();
    if (!newName) return alert("Tên hiển thị không được để trống!");

    const users = await getDB('users');
    const userRecord = users.find(u => u.username === currentUser.username);

    if (userRecord) {
        // 1. NẾU CÓ ĐỔI MẬT KHẨU -> CẬP NHẬT TRÊN FIREBASE AUTH TRƯỚC
        if (newPass) {
            try {
                const userAuth = firebase.auth().currentUser;
                if (userAuth) {
                    await userAuth.updatePassword(newPass);
                } else {
                    return alert("❌ Lỗi: Không tìm thấy phiên xác thực để đổi mật khẩu!");
                }
            } catch (error) {
                // Firebase có quy định nếu đăng nhập quá lâu sẽ không cho đổi pass trực tiếp
                if (error.code === 'auth/requires-recent-login') {
                    return alert("⚠️ Bảo mật Firebase yêu cầu: Bạn cần đăng xuất và đăng nhập lại trước khi đổi mật khẩu!");
                }
                return alert("❌ Lỗi cập nhật Auth: " + error.message);
            }
        }

        // 2. KHI AUTH THÀNH CÔNG, LƯU VÀO DATABASE
        const updateData = { name: newName };
        if (newPass) updateData.password = newPass;
        await updateDB('users', userRecord._fbKey, updateData);

        currentUser.name = newName;
        if (newPass) currentUser.password = newPass;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        alert("✅ Cập nhật thông tin thành công!");
        document.getElementById('settingPass').value = '';
    }
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

        // --- ĐOẠN FIX LỖI Ở ĐÂY: Thêm .replace(/"/g, '&quot;') để chống cắt chữ ---
        let cleanText = q.text.replace(/^(Câu|Bài)\s*\d+[\.\:\-]*\s*/i, '').replace(/^\d+[\.\:\)]\s*/, '').trim().replace(/"/g, '&quot;');
        let optA = q.options.A.replace(/"/g, '&quot;');
        let optB = q.options.B.replace(/"/g, '&quot;');
        let optC = q.options.C.replace(/"/g, '&quot;');
        let optD = q.options.D.replace(/"/g, '&quot;');
        // -------------------------------------------------------------------------

        // Kiểm tra xem đáp án nào đang được chọn để gắn thẻ 'checked'
        let chkA = q.correct === 'A' ? 'checked' : '';
        let chkB = q.correct === 'B' ? 'checked' : '';
        let chkC = q.correct === 'C' ? 'checked' : '';
        let chkD = q.correct === 'D' ? 'checked' : '';

        const div = document.createElement('div'); div.className = 'question-block'; div.style.cssText = 'background: rgba(255,255,255,0.6); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1); animation: fadeInUp 0.5s ease;';

        // Nhét biến optA, optB, optC, optD mới vào value
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;"><strong style="color: #764ba2;">Câu ${questionCount}:</strong><button type="button" style="background: transparent; color: #ff0844; border: none; padding: 0; font-weight: bold; width: auto; box-shadow: none;" onclick="removeQuestion(this)">Xóa</button></div>
            <input type="text" class="q-text" value="${cleanText}" style="margin-bottom: 10px;">
            <p style="font-size: 0.85em; color: #d35400; margin-bottom: 8px; font-weight: bold;">(Tích chọn nút tròn bên cạnh để đánh dấu đáp án ĐÚNG)</p>
            <div style="display:flex; gap:10px; margin-bottom: 10px;">
                <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                    <input type="radio" name="correct_${qId}" value="A" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn A là đáp án đúng" ${chkA}>
                    <input type="text" class="q-optA" value="${optA}" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
                </div>
                <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                    <input type="radio" name="correct_${qId}" value="B" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn B là đáp án đúng" ${chkB}>
                    <input type="text" class="q-optB" value="${optB}" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
                </div>
            </div>
            <div style="display:flex; gap:10px; margin-bottom: 10px;">
                <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                    <input type="radio" name="correct_${qId}" value="C" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn C là đáp án đúng" ${chkC}>
                    <input type="text" class="q-optC" value="${optC}" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
                </div>
                <div style="flex:1; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.8); padding-left:12px; border-radius:12px; border:1px solid rgba(0,0,0,0.1);">
                    <input type="radio" name="correct_${qId}" value="D" class="q-correct-radio" style="width:18px; height:18px; margin:0; cursor:pointer;" title="Chọn D là đáp án đúng" ${chkD}>
                    <input type="text" class="q-optD" value="${optD}" style="margin:0; border:none; box-shadow:none; background:transparent; width:100%; padding-left:5px; outline:none;">
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
    const users = await getDB('users');
    const selectedStudent = document.getElementById('roadmapStudentSelect').value;

    let isParticipating = true;
    if (selectedStudent && selectedStudent !== "") {
        const st = users.find(u => u.username === selectedStudent);
        if (st && st.isParticipatingRoadmap === false) {
            isParticipating = false;
        }
    }

    // ẨN/HIỆN TIÊU ĐỀ CỘT TRONG THEAD CỦA GIÁO VIÊN
    const table = body.parentElement;
    if (table) {
        const ths = table.querySelectorAll('thead th');
        ths.forEach(th => {
            if (th.innerText.includes('Cộng tiền') || th.innerText.includes('Điều kiện cụ thể')) {
                th.style.display = isParticipating ? '' : 'none';
            }
        });
    }

    // Sắp xếp bài tập thông minh theo số đếm trong Tiêu đề (VD: Bài 1 -> Bài 2 -> Bài 10)
    const sortedAssignments = [...assignments].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi-VN', { numeric: true, sensitivity: 'base' }));

    if (sortedAssignments.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="padding:15px; text-align:center; color:#666; font-style:italic;">Chưa có bài học nào được giao.</td></tr>`;
        return;
    }

    sortedAssignments.forEach(assign => {
        // ---> BẮT ĐẦU THÊM ĐOẠN LỌC NÀY <---
        // Kiểm tra: Nếu giáo viên đã chọn 1 học sinh cụ thể, 
        // thì bỏ qua (không in ra bảng) những bài tập giao riêng cho học sinh khác.
        if (selectedStudent && selectedStudent !== "") {
            const targetArr = Array.isArray(assign.targetStudent) ? assign.targetStudent : [assign.targetStudent || 'all'];
            if (!targetArr.includes('all') && !targetArr.includes(selectedStudent)) {
                return;
            }
        }
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

        let moneyCellHtml = isParticipating ? `<td style="padding:12px; text-align: center; ${cellBgStyle}">${moneyInputHTML}</td>` : '';
        let conditionCellHtml = isParticipating ? `<td style="padding:12px;">
            <input type="text" value="${conditionVal}" placeholder="Nhập điều kiện..." 
                onblur="updateAssignmentRoadmap('${assign._fbKey}', 'roadmapCondition', this.value)"
                style="margin:0; padding:6px 10px; font-size:0.9em; min-width:140px;">
        </td>` : '';

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
        ${moneyCellHtml}
        <td style="padding:12px; font-size:0.85em; color:#555; white-space: nowrap;">${assign.endDate}</td>
        ${conditionCellHtml}
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

        const users = await getDB('users');
        const editTargetSelect = document.getElementById('editTargetStudent');
        if (editTargetSelect) {
            editTargetSelect.innerHTML = '<option value="all">Tất cả học sinh</option>';
            users.forEach(u => {
                if (u.role === 'student') {
                    const opt = document.createElement('option');
                    opt.value = u.username;
                    opt.innerText = `${u.name} (${u.username})`;
                    editTargetSelect.appendChild(opt);
                }
            });
            // Gán lại giá trị học sinh đang được giao bài (mặc định là 'all')
            window.setMultiSelectValues('editTargetStudent', assign.targetStudent);
        }

        // Lấy các Section
        const tuLuanSec = document.getElementById('editTuLuanSection');
        const tracNghiemSec = document.getElementById('editTracNghiemSection');
        const weightSec = document.getElementById('editScoreWeightFields');
        const editVideoGroup =
            document.getElementById('editVideoLinkGroup');

        const editVideoInput =
            document.getElementById('editVideoLink');

        // Reset ẩn đi trước
        if (tuLuanSec) tuLuanSec.style.display = 'none';
        if (tracNghiemSec) tracNghiemSec.style.display = 'none';
        if (weightSec) weightSec.style.display = 'none';
        // Hiện video cho Tự luận, Kết hợp và Thi.
        // Chỉ ẩn đối với Trắc nghiệm thường.
        if (editVideoGroup) {
            editVideoGroup.style.display =
                assign.assessmentType === 'trac_nghiem'
                    ? 'none'
                    : 'block';
        }

        if (editVideoInput) {
            editVideoInput.value =
                assign.videoLink || '';
        }

        // 2. Xử lý phần Tự Luận
        const hasEssay = assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType || (assign.assessmentType === 'thi' && assign.essayWeight > 0);
        if (hasEssay) {
            if (tuLuanSec) tuLuanSec.style.display = 'block';
            if (window.quillEditDesc) window.quillEditDesc.root.innerHTML = assign.desc || '';
            if (document.getElementById('editHideEssayText')) {
                document.getElementById('editHideEssayText').checked =
                    !!assign.hideEssayText;
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
        // Đổ dữ liệu thời gian vào form sửa và cho phép Edit
        const editDay = document.getElementById('editCondDay');
        const editHour = document.getElementById('editCondHour');
        const editMin = document.getElementById('editCondMin');
        const editSec = document.getElementById('editCondSec');

        if (editDay && editHour && editMin && editSec) {
            // assign.watchCondition đã được quy ra giây ở hàm tạo
            let watchDuration = assign.watchCondition || 0;

            let d = Math.floor(watchDuration / 86400);
            let h = Math.floor((watchDuration % 86400) / 3600);
            let m = Math.floor((watchDuration % 3600) / 60);
            let s = watchDuration % 60;

            editDay.value = d;
            editHour.value = h;
            editMin.value = m;
            editSec.value = s;

            // Gỡ bỏ tính trạng khóa để giáo viên sửa lại
            editDay.disabled = false;
            editHour.disabled = false;
            editMin.disabled = false;
            editSec.disabled = false;
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

    let qText = qData ? qData.qText.replace(/"/g, '&quot;') : '';
    let optA = qData ? qData.A.replace(/"/g, '&quot;') : '';
    let optB = qData ? qData.B.replace(/"/g, '&quot;') : '';
    let optC = qData ? qData.C.replace(/"/g, '&quot;') : '';
    let optD = qData ? qData.D.replace(/"/g, '&quot;') : '';
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

    const targetStudent = window.getMultiSelectValues('editTargetStudent');

    if (!title || !startDate || !endDate) return alert("Vui lòng điền đầy đủ Tiêu đề và Thời hạn nộp!");

    const assignments = await getDB('assignments');
    const assign = assignments.find(a => a._fbKey === currentEditingAssignmentKey);
    if (!assign) return;

    const editVideoInput =
        document.getElementById('editVideoLink');

    const editVideoLink =
        assign.assessmentType === 'trac_nghiem'
            ? ''
            : (editVideoInput?.value || '').trim();

    // Kiểm tra link YouTube nếu giáo viên có nhập
    if (editVideoLink) {
        const ytRegex =
            /^(https?:\/\/)?((www|m)\.)?(youtube\.com|youtu\.be)\/.+$/i;

        if (!ytRegex.test(editVideoLink)) {
            return alert(
                "🔗 Link video không hợp lệ. " +
                "Vui lòng sử dụng link YouTube."
            );
        }
    }

    let watchCondition = 0;

    if (editVideoLink) {
        const d =
            parseInt(
                document.getElementById('editCondDay').value
            ) || 0;

        const h =
            parseInt(
                document.getElementById('editCondHour').value
            ) || 0;

        const m =
            parseInt(
                document.getElementById('editCondMin').value
            ) || 0;

        const s =
            parseInt(
                document.getElementById('editCondSec').value
            ) || 0;

        watchCondition =
            d * 86400 +
            h * 3600 +
            m * 60 +
            s;
    }

    const updateObj = {
        title: title,
        startDate: startDate.replace("T", " "),
        endDate: endDate.replace("T", " "),
        targetStudent: targetStudent,

        videoLink: editVideoLink,
        watchCondition: watchCondition
    };

    // Thu thập dữ liệu Tự Luận
    if (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || !assign.assessmentType) {
        updateObj.desc = window.quillEditDesc.root.innerHTML;
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
        updateObj.desc = window.quillEditDesc.root.innerHTML;
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

// ================= HÀM ĐÓNG / MỞ VÀ PHÂN TÍCH TRẠNG THÁI CHI TIẾT BÀI LÀM =================
window.openAssignmentStatusModal = async function (assignId) {
    const modal = document.getElementById('assignmentStatusModal');
    const container = document.getElementById('assignmentStatusContainer');

    // Hiển thị trạng thái chờ tải dữ liệu thời gian thực
    container.innerHTML = '<p style="text-align: center; color: #475569; font-weight: 500;">⏳ Đang đồng bộ trạng thái hệ thống...</p>';
    modal.classList.add('active');

    // Tải dữ liệu từ database (Ưu tiên bộ nhớ đệm Cache để tăng tốc độ phản hồi)
    const assignments = (window.cachedAssignments && window.cachedAssignments.length > 0) ? window.cachedAssignments : await getDB('assignments');
    const users = await getDB('users');
    const submissions = (window.cachedSubmissions && window.cachedSubmissions.length > 0) ? window.cachedSubmissions : await getDB('submissions');

    // Kiểm tra tính hợp lệ của bài tập
    const assign = assignments.find(a => a.id === assignId);
    if (!assign) {
        container.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 10px; font-weight: 600;">❌ Không tìm thấy dữ liệu bài tập cấu hình.</p>';
        return;
    }

    // XỬ LÝ ĐA DẠNG ĐỐI TƯỢNG ĐƯỢC GIAO: 1 học sinh, chuỗi nhiều học sinh, hoặc mảng học sinh
    let targetArr = [];
    if (Array.isArray(assign.targetStudent)) {
        targetArr = assign.targetStudent;
    } else if (typeof assign.targetStudent === 'string') {
        // Phân tách bằng dấu phẩy nếu giao cho nhiều học sinh viết liền
        targetArr = assign.targetStudent.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (targetArr.length === 0) targetArr = ['all'];

    // Lọc danh sách học sinh thuộc diện được giao bài
    const students = users.filter(u => u.role === 'student' && (targetArr.includes('all') || targetArr.includes(u.username)));

    if (students.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Danh sách học sinh được phân phối đang trống.</p>';
        return;
    }

    // Lấy các mốc thời gian hệ thống
    const now = new Date();
    const startTime = assign.startDate ? new Date(assign.startDate.replace(" ", "T")) : new Date(0);
    const endTime = assign.endDate ? new Date(assign.endDate.replace(" ", "T")) : new Date("2100-01-01");

    // Xây dựng giao diện bảng dữ liệu chống tràn viền (Có thanh cuộn ghim tiêu đề)
    let html = '<div style="max-height: 65vh; overflow-y: auto; border-radius: 8px; border: 1px solid #e2e8f0;">';
    html += '<table style="width:100%; border-collapse: collapse; text-align: left; font-size: 0.95em; background: #fff;">';
    html += '<tr style="background:#f8fafc; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 10;"><th style="padding:12px 16px; color:#475569; font-weight:600;">Học sinh</th><th style="padding:12px 16px; text-align:center; color:#475569; font-weight:600;">Trạng thái tiến độ</th></tr>';

    students.forEach(st => {
        // Tìm lịch sử bản ghi bài làm tương ứng
        const sub = submissions.find(s => s.assignmentId === assignId && s.studentUsername === st.username);

        let statusText = '';
        let statusBg = '';
        let statusColor = '';

        if (sub) {
            // === KIỂM TRA CÁC ĐIỀU KIỆN LOGIC CỦA BÀI NỘP ===
            if (sub.isCheatFail) {
                statusText = '🚨 Vi phạm quy chế thi';
                statusBg = '#fef2f2';
                statusColor = '#ef4444';
            } else if (sub.isRedoing) {
                statusText = '🔁 Đang làm lại'; // Trạng thái học sinh đang phải làm lại bài
                statusBg = '#f3e8ff';
                statusColor = '#9333ea';
            } else if (sub.isAutoSubmitted) {
                statusText = '⏳ Bị thu tự động';
                statusBg = '#fff7ed';
                statusColor = '#ea580c';
            } else if (sub.isLateFail) {
                statusText = '⚠️ Nộp trễ quá hạn';
                statusBg = '#fff1f2';
                statusColor = '#f43f5e';
            } else if (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') {
                // Phân định trạng thái chấm điểm và chấm lại
                if (sub.isRegrading) {
                    statusText = `🔄 Đang chấm lại (${sub.grade}đ)`;
                    statusBg = '#f0fdf4';
                    statusColor = '#16a34a';
                } else {
                    statusText = `✅ Đã chấm điểm: ${sub.grade}đ`;
                    statusBg = '#f0fdf4';
                    statusColor = '#15803d';
                }
            } else {
                statusText = '📥 Đã nộp bài (Chờ chấm)';
                statusBg = '#f0fdfa';
                statusColor = '#0d9488';
            }
        } else {
            // === KIỂM TRA TIẾN TRÌNH KHI CHƯA PHÁT SINH BÀI NỘP CHÍNH THỨC ===
            if (now < startTime) {
                statusText = '📅 Chưa tới giờ làm';
                statusBg = '#f1f5f9';
                statusColor = '#64748b';
            } else if (now >= startTime && now <= endTime) {
                statusText = '✍️ Đang làm (Xem video/Trắc nghiệm)'; // Trạng thái đang thực hiện bài lần đầu
                statusBg = '#eff6ff';
                statusColor = '#2563eb';
            } else {
                statusText = '❌ Quá hạn (Chưa nộp)';
                statusBg = '#fff1f2';
                statusColor = '#e11d48';
            }
        }

        // Tạo dòng dữ liệu với hiệu ứng Hover
        html += `<tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
            <td style="padding:14px 16px;">
                <span style="font-weight: 600; color: #1e293b; display: block;">${st.name}</span>
                <span style="font-size: 0.8em; color: #64748b;">@${st.username}</span>
            </td>
            <td style="padding:14px 16px; text-align:center;">
                <span style="color: ${statusColor}; background: ${statusBg}; padding: 6px 14px; border-radius: 50px; font-size: 0.85em; font-weight: 600; display: inline-block; border: 1px solid ${statusColor}25; white-space: nowrap;">
                    ${statusText}
                </span>
            </td>
        </tr>`;
    });

    html += '</table></div>';
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

    // NẾU GIÁO VIÊN CÓ NHẬP MẬT KHẨU MỚI
    if (password) {
        try {
            const users = await getDB('users');
            const st = users.find(u => u._fbKey === fbKey);

            if (st) {
                const fakeEmail = st.username + "@hethong.edu.vn";
                const oldPass = st.password;

                // Đăng nhập ngầm và đổi pass
                const userCredential = await secondaryApp.auth().signInWithEmailAndPassword(fakeEmail, oldPass);
                await userCredential.user.updatePassword(password);
                await secondaryApp.auth().signOut();

                updateObj.password = password;
            }
        } catch (error) {
            console.error("Lỗi Auth phụ khi sửa HS:", error);
            return alert("❌ Lỗi khi đổi mật khẩu trên hệ thống Auth: " + error.message);
        }
    }

    await updateDB('users', fbKey, updateObj);
    closeEditStudentModal();
    alert('✅ Cập nhật thông tin học sinh thành công!');

    // Load lại danh sách học sinh
    if (typeof loadStudentsList === 'function') loadStudentsList();
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

window.openScheduleModal = function (fbKey = '', day = '', time = '', subject = '', note = '', targetStudent = 'all') {
    document.getElementById('editScheduleKey').value = fbKey;
    document.getElementById('scheduleDay').value = day;
    document.getElementById('scheduleTime').value = time;
    document.getElementById('scheduleSubject').value = subject;
    document.getElementById('scheduleNote').value = note;

    // Mới: Dùng mảng để đổ dữ liệu vào modal
    if (document.getElementById('scheduleTargetStudent')) {
        window.setMultiSelectValues('scheduleTargetStudent', targetStudent);
    }

    // Gán giá trị đích danh
    if (document.getElementById('scheduleTargetStudent')) {
        document.getElementById('scheduleTargetStudent').value = targetStudent;
    }

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
    const targetStudent = document.getElementById('scheduleTargetStudent') ? window.getMultiSelectValues('scheduleTargetStudent') : ['all']; // Đọc thông tin học sinh

    if (!day || !time || !subject) return alert('Vui lòng nhập đầy đủ: Thứ, Thời gian và Nội dung!');

    const payload = { day, time, subject, note, targetStudent }; // Đẩy kèm thông tin đích danh lên Database

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
        tr.setAttribute('data-target', Array.isArray(s.targetStudent) ? s.targetStudent.join(',') : (s.targetStudent || 'all'));

        // Nhãn để giáo viên dễ nhìn xem lịch này là lịch chung hay lịch riêng
        let targetLabel = (s.targetStudent && s.targetStudent !== 'all') ? `<br><span style="font-size: 0.8em; color: #059669; font-weight: normal;">(Giao riêng HS)</span>` : '';

        // Sửa nút bấm gọi thêm biến s.targetStudent
        tr.innerHTML = `
            <td style="padding:12px; font-weight:bold; color:#764ba2;">${s.day} ${targetLabel}</td>
            <td style="padding:12px; color:#d35400; font-weight:bold;">${s.time}</td>
            <td style="padding:12px; color:#2c3e50;">${s.subject}</td>
            <td style="padding:12px; color:#555;">${s.note || ''}</td>
            <td style="padding:12px; text-align:center;">
                <button class="btn-approve" style="padding:5px 12px; font-size:0.85em; background: #3b82f6; color: white;" onclick="openScheduleModal('${s._fbKey}', '${s.day}', '${s.time}', '${s.subject}', '${s.note}', '${s.targetStudent || 'all'}')">Sửa</button>
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

    // Đổ toàn bộ dữ liệu cũ của tài liệu vào form sửa
    document.getElementById('editMaterialKey').value = fbKey;
    document.getElementById('editMaterialTitle').value = mat.title || '';
    document.getElementById('editMaterialVideoLink').value = mat.videoLink || '';
    document.getElementById('editMaterialLinkInput').value = mat.docLink || '';

    if (document.getElementById('editMaterialTargetStudent')) {
        window.setMultiSelectValues('editMaterialTargetStudent', mat.targetStudent);
    }

    document.getElementById('editMaterialModal').classList.add('active');
};

window.closeEditMaterialModal = function () {
    document.getElementById('editMaterialModal').classList.remove('active');
};

window.saveMaterialEdit = async function () {
    const fbKey = document.getElementById('editMaterialKey').value;
    const newTitle = document.getElementById('editMaterialTitle').value.trim();

    // Lấy thêm các thông tin mới từ popup
    const newVideoLink = document.getElementById('editMaterialVideoLink') ? document.getElementById('editMaterialVideoLink').value.trim() : '';
    const newDocLink = document.getElementById('editMaterialLinkInput') ? document.getElementById('editMaterialLinkInput').value.trim() : '';
    const newTargetStudent = document.getElementById('editMaterialTargetStudent') ? window.getMultiSelectValues('editMaterialTargetStudent') : ['all'];

    if (!newTitle) return alert("Vui lòng nhập tên tài liệu mới!");

    // Cập nhật TOÀN BỘ thông tin lên Firebase thay vì chỉ mỗi title
    await updateDB('materials', fbKey, {
        title: newTitle,
        videoLink: newVideoLink,
        docLink: newDocLink,
        targetStudent: newTargetStudent
    });

    closeEditMaterialModal();
    alert("Đã cập nhật thông tin tài liệu thành công!");

    // Yêu cầu tải lại danh sách tài liệu
    if (typeof loadMaterialsListTeacher === 'function') {
        loadMaterialsListTeacher();
    }
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
listenFirebase(db.ref('store_settings'), 'value', (snapshot) => {
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
    const targetSelect = document.getElementById('giftDiscountTargetItem');

    if (!itemSelect || typeof StoreConfig === 'undefined') return;

    let ownedItems = [];
    if (target !== 'all') {
        try {
            const invSnap = await db.ref(`student_inventory/${target}`).once('value');
            const inventory = invSnap.val();
            if (inventory) ownedItems = Object.values(inventory).map(item => item.id);
        } catch (error) { console.error("Lỗi lấy kho đồ học sinh:", error); }
    }

    itemSelect.innerHTML = '';
    let hasAvailableItem = false;
    let targetOptionsHTML = '<option value="all">Tất cả vật phẩm (Mua bằng Coin)</option>';

    StoreConfig.items.forEach(item => {
        const isOwned = ownedItems.includes(item.id);
        const disabledAttr = isOwned ? 'disabled style="color: #aaa; background: #eee; font-style: italic;"' : '';
        const suffix = isOwned ? ' (HS đã có)' : '';

        // Đổ dữ liệu cho nút "Tặng Vật phẩm"
        itemSelect.innerHTML += `<option value="${item.id}" ${disabledAttr}>[${item.tag}] ${item.name}${suffix}</option>`;

        // CHỈ LỌC CÁC VẬT PHẨM BÁN BẰNG COIN VÀO DANH SÁCH THẺ GIẢM GIÁ
        const isEventItem = item.isNonCoin || (!item.price || item.price <= 0);
        if (!isEventItem) {
            targetOptionsHTML += `<option value="${item.id}">[${item.tag}] ${item.name}</option>`;
        }

        if (!isOwned) hasAvailableItem = true;
    });

    if (targetSelect) targetSelect.innerHTML = targetOptionsHTML;

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
    const expiryArea = document.getElementById('giftExpiryInputArea');
    const targetArea = document.getElementById('giftDiscountTargetArea'); // Lấy thẻ ẩn/hiện mục chọn áp dụng

    if (expiryArea) expiryArea.style.display = 'none';
    if (targetArea) targetArea.style.display = 'none'; // Ẩn mặc định

    if (type === 'none') {
        area.style.display = 'none';
    } else {
        area.style.display = 'block';
        if (type === 'coin' || type === 'money' || type === 'ticket' || type === 'discount') {
            numInput.style.display = 'block';
            itemInput.style.display = 'none';
            if (type === 'discount') {
                numInput.placeholder = "Nhập % giảm giá (10 - 100)...";
                if (expiryArea) expiryArea.style.display = 'block';
                if (targetArea) targetArea.style.display = 'block'; // Hiển thị ô chọn vật phẩm áp dụng khi chọn Thẻ giảm giá
            } else {
                numInput.placeholder = "Nhập số lượng...";
            }
        } else if (type === 'item') {
            numInput.style.display = 'none';
            itemInput.style.display = 'block';
        }
    }
};

window.sendGiftMessage = async function () {
    const targets = window.getMultiSelectValues('giftTargetStudent');
    const msg = document.getElementById('giftMessage').value.trim();
    const type = document.getElementById('giftType').value;
    let value = '';
    let discountExpiry = null;
    let discountTargetItems = ['all']; // ĐỔI THÀNH MẢNG (ARRAY)

    if (type === 'coin' || type === 'money' || type === 'ticket' || type === 'discount') {
        value = parseInt(document.getElementById('giftValueNumber').value);
        if (isNaN(value) || value <= 0) return alert("Vui lòng nhập số lượng hợp lệ (> 0)!");

        if (type === 'discount') {
            if (value < 10 || value > 100) return alert("Vui lòng nhập phần trăm giảm giá từ 10 đến 100!");
            const expiryStr = document.getElementById('giftExpiryDate').value;
            if (expiryStr) discountExpiry = new Date(expiryStr).getTime();

            // XỬ LÝ LẤY NHIỀU VẬT PHẨM TỪ Ô SELECT MULTIPLE
            const targetSelect = document.getElementById('giftDiscountTargetItem');
            if (targetSelect && targetSelect.selectedOptions.length > 0) {
                discountTargetItems = Array.from(targetSelect.selectedOptions).map(opt => opt.value);
                // Nếu giáo viên có lỡ chọn cả 'all' và các món khác, ưu tiên 'all'
                if (discountTargetItems.includes('all')) {
                    discountTargetItems = ['all'];
                }
            }
        }
    } else if (type === 'item') {
        value = document.getElementById('giftValueItem').value;
        if (!value) return alert("❌ Không thể gửi! Học sinh này đã sở hữu tất cả các vật phẩm hiện có.");
    }

    if (type === 'none' && !msg) return alert("Bạn phải nhập lời nhắn nếu không đính kèm quà tặng!");

    const expiryTimestamp = Date.now() + (5 * 24 * 60 * 60 * 1000);
    const payload = {
        message: msg,
        giftType: type,
        giftValue: value,
        timestamp: Date.now(),
        timeString: new Date().toLocaleString('vi-VN'),
        expiry: expiryTimestamp
    };

    if (discountExpiry) payload.discountExpiry = discountExpiry;
    if (type === 'discount') payload.discountTargetItem = discountTargetItems; // Đẩy mảng lên Firebase

    const users = await getDB('users');
    const students = users.filter(u => u.role === 'student');

    if (targets.includes('all')) {
        for (let st of students) { await pushDB(`inbox_messages/${st.username}`, payload); }
    } else {
        for (let username of targets) {
            await pushDB(`inbox_messages/${username}`, payload);
        }
    }

    alert("💌 Đã gửi thư và quà thành công!");
    document.getElementById('giftMessage').value = '';
    document.getElementById('giftValueNumber').value = '';
    if (document.getElementById('giftExpiryDate')) document.getElementById('giftExpiryDate').value = '';

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

// Hàm bật tắt Bảng quy đổi
window.toggleConversionSettings = async function (isChecked) {
    await db.ref('system_settings').update({ conversionTableEnabled: isChecked });
    alert("Đã " + (isChecked ? "MỞ" : "ĐÓNG") + " chức năng Bảng quy đổi tiền của học sinh!");
};

// Hàm hiển thị danh sách yêu cầu rút tiền
async function loadCashRequestsForTeacher() {
    const requests = await getDB('cash_requests');
    let html = '';

    requests.reverse().forEach(req => {
        let actionButtons = '';
        let statusDisplay = '';

        if (req.status === 'pending') {
            statusDisplay = '<span style="color: #f39c12;">Đang chờ duyệt</span>';
            actionButtons = `
                <button onclick="updateRequestStatus('${req._fbKey}', 'transferring')" style="background: #2980b9; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Chấp nhận</button>
                <button onclick="updateRequestStatus('${req._fbKey}', 'rejected')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-left: 5px;">Từ chối</button>
            `;
        } else if (req.status === 'transferring') {
            statusDisplay = '<span style="color: #2980b9;">Đang chuyển tiền</span>';
            actionButtons = `
                <button onclick="updateRequestStatus('${req._fbKey}', 'completed')" style="background: #27ae60; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Đã chuyển</button>
            `;
        } else if (req.status === 'completed') {
            statusDisplay = '<span style="color: #27ae60;">Đã hoàn tất</span>';
        } else if (req.status === 'rejected') {
            statusDisplay = '<span style="color: #c0392b;">Đã từ chối</span>';
        }

        html += `
            <div style="background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>Học sinh:</strong> ${req.studentName} <br>
                    <strong>Số tiền:</strong> <span style="color: #e67e22; font-weight: bold;">${req.amount.toLocaleString()} VNĐ</span> <br>
                    <strong>Trạng thái:</strong> ${statusDisplay}
                </div>
                <div>
                    ${actionButtons}
                </div>
            </div>
        `;
    });

    const listElement = document.getElementById('teacherCashRequestsList');
    if (listElement) {
        listElement.innerHTML = html || '<p>Chưa có yêu cầu nào.</p>';
    }
}

// Hàm cập nhật trạng thái yêu cầu
async function updateRequestStatus(requestId, newStatus) {
    let confirmMsg = "";
    if (newStatus === 'transferring') confirmMsg = "Chấp nhận yêu cầu và báo học sinh đang chuyển tiền?";
    if (newStatus === 'completed') confirmMsg = "Xác nhận đã chuyển tiền thành công?";
    if (newStatus === 'rejected') confirmMsg = "Từ chối yêu cầu này (Tiền sẽ cần được hoàn lại nếu đã trừ trước đó)?";

    if (confirm(confirmMsg)) {
        await updateDB('cash_requests', requestId, { status: newStatus });

        // Nếu bạn trừ tiền khi gửi yêu cầu mà giáo viên 'Từ chối', nhớ cộng lại tiền cho học sinh tại đây.

        loadCashRequestsForTeacher(); // Render lại danh sách
    }
}

// Đã ẩn gọi hàm cũ để tránh lỗi xung đột thẻ HTML
// loadCashRequestsForTeacher();

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
};

// =========================================================================
// CHỨC NĂNG KIỂM DUYỆT RÚT TIỀN MẶT - PHÍA GIÁO VIÊN (CÁCH 2)
// =========================================================================

// Hàm tải toàn bộ yêu cầu tiền mặt lên bảng điều khiển của giáo viên
window.loadTeacherCashRequests = async function () {
    const container = document.getElementById('teacherCashRequestsListContainer');
    if (!container) return;

    try {
        let requests = await getDB('cash_requests');
        const now = Date.now();
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 2 ngày tính bằng mili-giây

        // Quét và tự động xóa các yêu cầu đã xử lý quá 2 ngày
        const validRequests = [];
        for (let req of requests) {
            if (req.status === 'completed' || req.status === 'rejected') {
                const checkTime = req.resolvedAt || req.timestamp; // Lấy thời gian xử lý (hoặc thời gian tạo nếu là dữ liệu cũ)
                if (now - checkTime > TWO_DAYS_MS) {
                    // Xóa vĩnh viễn khỏi Firebase
                    await removeDB('cash_requests', req._fbKey);
                    continue; // Bỏ qua, không hiển thị ra màn hình
                }
            }
            validRequests.push(req);
        }
        requests = validRequests;

        if (requests.length === 0) {
            container.innerHTML = '<p style="color: #64748b; font-size: 0.95em; text-align: center; padding: 20px; margin: 0;">Hiện tại chưa có yêu cầu nhận tiền mặt nào.</p>';
            return;
        }

        let html = '';
        // Hiện yêu cầu mới nhất lên trước
        requests.reverse().forEach(req => {
            let statusLabel = '';
            let actionsHtml = '';

            if (req.status === 'pending') {
                statusLabel = '<span style="color: #d97706; background: #fef3c7; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.85em;">⏳ Chờ duyệt</span>';
                actionsHtml = `
                    <button onclick="handleTeacherProcessCash('${req._fbKey}', 'approve')" 
                            style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85em;">
                        Chấp nhận
                    </button>
                    <button onclick="handleTeacherProcessCash('${req._fbKey}', 'reject')" 
                            style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85em; margin-left: 5px;">
                        Từ chối
                    </button>
                `;
            } else if (req.status === 'transferring') {
                statusLabel = '<span style="color: #2563eb; background: #e0f2fe; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.85em;">🔄 Đang chuyển</span>';
                actionsHtml = `
                    <button onclick="handleTeacherProcessCash('${req._fbKey}', 'complete')" 
                            style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85em;">
                        Đã chuyển
                    </button>
                `;
            } else if (req.status === 'completed') {
                statusLabel = '<span style="color: #16a34a; background: #dcfce7; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.85em;">✅ Đã hoàn tất</span>';
            } else if (req.status === 'rejected') {
                statusLabel = '<span style="color: #dc2626; background: #fee2e2; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.85em;">❌ Đã từ chối</span>';
            }

            html += `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center; gap: 15px; box-sizing: border-box;">
                    <div>
                        <div style="font-weight: bold; color: #1e293b; font-size: 0.95em;">👤 Học sinh: ${req.studentName}</div>
                        <div style="margin-top: 4px; color: #475569; font-size: 0.9em;">
                            Số tiền yêu cầu: <strong style="color: #ea580c;">${req.amount.toLocaleString('vi-VN')} VNĐ</strong>
                        </div>
                        <div style="margin-top: 6px; display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 0.8em; color: #94a3b8;">Trạng thái:</span> ${statusLabel}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; box-sizing: border-box;">
                        ${actionsHtml}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error("Lỗi hiển thị yêu cầu phía giáo viên:", error);
        container.innerHTML = '<p style="color: #ef4444; font-size: 0.9em; text-align: center;">Không thể tải dữ liệu kiểm duyệt từ Firebase!</p>';
    }
};

// Hàm xử lý kiểm duyệt (Đã fix lỗi tính sai tiền cho Giáo Viên)
window.handleTeacherProcessCash = async function (reqFbKey, action) {
    try {
        const reqSnapshot = await db.ref(`cash_requests/${reqFbKey}`).once('value');
        const reqData = reqSnapshot.val();
        if (!reqData) {
            alert("⚠️ Yêu cầu kiểm duyệt không tồn tại trên hệ thống!");
            return;
        }

        // --- THAO TÁC 1: CHẤP NHẬN ---
        if (action === 'approve') {
            if (!confirm(`Bạn có đồng ý duyệt yêu cầu lấy tiền mặt trị giá ${reqData.amount.toLocaleString('vi-VN')} VNĐ của học sinh "${reqData.studentName}" không? Hệ thống sẽ kiểm tra tài khoản học sinh ngay bây giờ.`)) return;

            // 1. Tìm Username chính xác của học sinh
            const usersSnapshot = await db.ref('users').once('value');
            const usersData = usersSnapshot.val();
            let studentUsername = null;

            if (usersData) {
                for (let key in usersData) {
                    if (usersData[key].name === reqData.studentName && usersData[key].role === 'student') {
                        studentUsername = usersData[key].username;
                        break;
                    }
                }
            }

            if (!studentUsername) {
                alert("❌ Thất bại: Không tìm thấy tài khoản thông tin của học sinh này trên Firebase.");
                return;
            }

            // 2. TÍNH LẠI CHÍNH XÁC TỔNG TIỀN LỘ TRÌNH CỦA HỌC SINH ĐÓ
            let baseMoney = 0;
            const assignments = await getDB('assignments');
            const submissions = await getDB('submissions');
            const stdAssignments = assignments.filter(a => {
                const targetArr = Array.isArray(a.targetStudent) ? a.targetStudent : [a.targetStudent || 'all'];
                return targetArr.includes('all') || targetArr.includes(studentUsername);
            });

            stdAssignments.forEach(assign => {
                const passingGrade = assign.passingGrade || 7;
                const sub = submissions.find(s => s.assignmentId === assign.id && s.studentUsername === studentUsername);
                let currentItemMoney = assign.roadmapMoney ? parseInt(assign.roadmapMoney) : 0;

                if (sub) {
                    if (sub.forcePass) baseMoney += currentItemMoney;
                    else if (!sub.isAutoSubmitted && !sub.isLateFail && !sub.isRegrading && sub.grade !== null && sub.grade !== '') {
                        if (parseFloat(sub.grade) >= passingGrade) baseMoney += currentItemMoney;
                    }
                }
            });

            // Lấy độ lệch tiền (offset)
            const offsetSnap = await db.ref('student_money_offset/' + studentUsername).once('value');
            let moneyOffset = offsetSnap.val() || 0;

            let currentRouteMoney = baseMoney + moneyOffset;
            if (currentRouteMoney < 0) currentRouteMoney = 0;

            // 3. KIỂM TRA ĐIỀU KIỆN TRỪ TIỀN
            if (currentRouteMoney < reqData.amount) {
                alert(`❌ KHÔNG THỂ DUYỆT! Số dư lộ trình của học sinh hiện tại chỉ còn ${currentRouteMoney.toLocaleString('vi-VN')} VNĐ, không đủ để rút ${reqData.amount.toLocaleString('vi-VN')} VNĐ. Hãy bấm Từ Chối yêu cầu này.`);
                return;
            }

            // TRỪ TIỀN HỌC SINH BẰNG CÁCH CHỈNH OFFSET (Cách hệ thống bạn đang hoạt động)
            await db.ref(`student_money_offset/${studentUsername}`).set(moneyOffset - reqData.amount);

            // Chuyển trạng thái sang 'Đang chuyển'
            await db.ref(`cash_requests/${reqFbKey}`).update({ status: 'transferring' });
            alert("✅ Duyệt thành công! Tài khoản học sinh đã được trừ tiền hợp lệ.");
        }

        // --- THAO TÁC 2: TỪ CHỐI ---
        else if (action === 'reject') {
            if (!confirm(`Bạn có chắc muốn TỪ CHỐI yêu cầu rút ${reqData.amount.toLocaleString('vi-VN')} VNĐ của học sinh "${reqData.studentName}"?`)) return;

            await db.ref(`cash_requests/${reqFbKey}`).update({ status: 'rejected', resolvedAt: Date.now() });
            alert("❌ Đã hủy và từ chối yêu cầu.");
        }

        // --- THAO TÁC 3: XÁC NHẬN ĐÃ CHUYỂN TIỀN XONG ---
        else if (action === 'complete') {
            if (!confirm(`Xác nhận bạn ĐÃ thực hiện chuyển/giao tiền mặt thành công cho học sinh "${reqData.studentName}"?`)) return;

            await db.ref(`cash_requests/${reqFbKey}`).update({ status: 'completed', resolvedAt: Date.now() });
            alert("🎉 Quy trình hoàn tất!");
        }

        // Cập nhật lại giao diện danh sách
        loadTeacherCashRequests();

    } catch (error) {
        console.error("Lỗi khi xử lý phê duyệt tiền mặt:", error);
        alert("❌ Lỗi thao tác Firebase. Vui lòng kiểm tra lại đường truyền kết nối.");
    }
};

// ================= HÀM TẠO NÚT LỌC HỌC SINH TỰ ĐỘNG =================
function renderStudentFilterButtons(studentsArray) {
    const assignedContainer = document.getElementById('assignedStudentFilterContainer');
    const submittedContainer = document.getElementById('submittedStudentFilterContainer');
    const materialsContainer = document.getElementById('materialsStudentFilterContainer');
    const scheduleContainer = document.getElementById('scheduleStudentFilterContainer'); // THÊM DÒNG NÀY

    let htmlAssigned = `<button class="btn-student-filter active" data-id="all" onclick="setStudentFilter('all', this, 'assigned')">Tất cả</button>`;
    let htmlSubmitted = `<button class="btn-student-filter active" data-id="all" onclick="setStudentFilter('all', this, 'submitted')">Tất cả</button>`;
    let htmlMaterials = `<button class="btn-student-filter active" data-id="all" onclick="setStudentFilter('all', this, 'materials')">Tất cả</button>`;
    let htmlSchedule = `<button class="btn-student-filter active" data-id="all" onclick="setStudentFilter('all', this, 'schedule')">Tất cả</button>`; // THÊM DÒNG NÀY

    studentsArray.forEach(student => {
        let btnA = `<button class="btn-student-filter" data-id="${student.username}" onclick="setStudentFilter('${student.username}', this, 'assigned')">${student.name}</button>`;
        let btnS = `<button class="btn-student-filter" data-id="${student.username}" onclick="setStudentFilter('${student.username}', this, 'submitted')">${student.name}</button>`;
        let btnM = `<button class="btn-student-filter" data-id="${student.username}" onclick="setStudentFilter('${student.username}', this, 'materials')">${student.name}</button>`;
        let btnSch = `<button class="btn-student-filter" data-id="${student.username}" onclick="setStudentFilter('${student.username}', this, 'schedule')">${student.name}</button>`; // THÊM DÒNG NÀY

        htmlAssigned += btnA;
        htmlSubmitted += btnS;
        htmlMaterials += btnM;
        htmlSchedule += btnSch; // THÊM DÒNG NÀY
    });

    if (assignedContainer) assignedContainer.innerHTML = htmlAssigned;
    if (submittedContainer) submittedContainer.innerHTML = htmlSubmitted;
    if (materialsContainer) materialsContainer.innerHTML = htmlMaterials;
    if (scheduleContainer) scheduleContainer.innerHTML = htmlSchedule; // THÊM DÒNG NÀY
}

// ================= HÀM LỌC BÀI TẬP VÀ BÀI NỘP THEO HỌC SINH =================
window.setStudentFilter = function (studentId, btnElement, type) {
    const container = btnElement.parentElement;
    container.querySelectorAll('.btn-student-filter').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    if (type === 'assigned') {
        activeAssignedStudentFilter = studentId;
        applyAssignedFilters();
    } else if (type === 'submitted') {
        activeSubmissionStudentFilter = studentId;
        applySubmissionFilters();
    } else if (type === 'materials') {
        activeMaterialStudentFilter = studentId;
        applyMaterialFilters();
    } else if (type === 'schedule') { // BỔ SUNG LỌC CHO LỊCH HỌC
        activeScheduleStudentFilter = studentId;
        applyScheduleFilters();
    }
};

window.applyScheduleFilters = function () {
    let items = document.querySelectorAll('#teacherScheduleBody > tr');

    items.forEach(item => {
        let targetStudent = item.getAttribute('data-target') || 'all'; // Bạn bị thiếu dòng lấy dữ liệu này
        let targetArr = targetStudent.split(',');

        // Đã sửa activeAssignedStudentFilter thành activeScheduleStudentFilter
        let matchFilter = (activeScheduleStudentFilter === 'all') ||
            targetArr.includes('all') ||
            targetArr.includes(activeScheduleStudentFilter);

        item.style.display = matchFilter ? '' : 'none';
    });
};

// HÀM LỌC TÀI LIỆU HỌC TẬP ĐỘNG
window.applyMaterialFilters = function () {
    let searchInput = document.getElementById('searchMaterials');
    let searchText = searchInput ? searchInput.value.toLowerCase() : '';
    let items = document.querySelectorAll('#teacherMaterialsContainer > .card');

    items.forEach(item => {
        let targetStudent = item.getAttribute('data-target') || 'all';
        let targetArr = targetStudent.split(','); // Cắt chuỗi thành mảng
        let text = item.innerText.toLowerCase();

        // Thay vì dùng dấu ===, ta dùng includes() để tìm trong mảng
        let matchFilter = (activeMaterialStudentFilter === 'all') ||
            targetArr.includes('all') ||
            targetArr.includes(activeMaterialStudentFilter);

        let matchSearch = text.includes(searchText);

        item.style.display = (matchFilter && matchSearch) ? '' : 'none';
    });
};

window.applyAssignedFilters = function () {
    let searchInput = document.getElementById('searchAssigned');
    let searchText = searchInput ? searchInput.value.toLowerCase() : '';
    // Quét tất cả các thẻ div đóng vai trò là card bài tập
    let items = document.querySelectorAll('#assignedListContainer > .card');

    items.forEach(item => {
        let targetStudent = item.getAttribute('data-target') || 'all';
        let targetArr = targetStudent.split(','); // Cắt chuỗi thành mảng
        let text = item.innerText.toLowerCase();

        let matchFilter = (activeAssignedStudentFilter === 'all') ||
            targetArr.includes('all') ||
            targetArr.includes(activeAssignedStudentFilter);

        let matchSearch = text.includes(searchText);

        item.style.display = (matchFilter && matchSearch) ? '' : 'none';
    });
};

window.applySubmissionFilters = function () {
    let searchInput = document.getElementById('searchSubmissions');
    let searchText = searchInput ? searchInput.value.toLowerCase() : '';
    // Quét tất cả các thẻ div đóng vai trò là card bài nộp
    let items = document.querySelectorAll('#submissionsList > .card');

    items.forEach(item => {
        let studentId = item.getAttribute('data-student') || '';
        let text = item.innerText.toLowerCase();

        // Ở danh sách bài nộp, nút của ai thì chỉ hiện bài của người đó
        let matchFilter = (activeSubmissionStudentFilter === 'all') ||
            (studentId === activeSubmissionStudentFilter);

        let matchSearch = text.includes(searchText);

        item.style.display = (matchFilter && matchSearch) ? '' : 'none';
    });
};

window.getMultiSelectValues = function (selectId) {
    const select = document.getElementById(selectId);
    if (!select || select.selectedOptions.length === 0) return ['all'];
    const values = Array.from(select.selectedOptions).map(opt => opt.value);
    // Ưu tiên "all" nếu giáo viên lỡ chọn chung "all" cùng các học sinh khác
    if (values.includes('all')) return ['all'];
    return values;
};

window.setMultiSelectValues = function (selectId, valuesArray) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const arr = Array.isArray(valuesArray) ? valuesArray : [valuesArray || 'all'];
    Array.from(select.options).forEach(opt => {
        opt.selected = arr.includes(opt.value);
    });
};

let currentCustomSelectId = '';

function openCustomStudentSelect(selectId) {
    currentCustomSelectId = selectId;
    const selectEl = document.getElementById(selectId);
    const listContainer = document.getElementById('customStudentList');
    document.getElementById('customStudentSearch').value = '';

    let html = '';
    let hasCheckedOthers = false;

    // Kiểm tra xem có học sinh cụ thể nào đang được chọn không
    Array.from(selectEl.options).forEach(opt => {
        if (opt.value !== 'all' && opt.selected) hasCheckedOthers = true;
    });

    Array.from(selectEl.options).forEach(opt => {
        const isAllOption = opt.value === 'all';

        // Logic chọn thông minh: Đã chọn cụ thể thì tắt "Tất cả"
        let isChecked = opt.selected;
        if (isAllOption && hasCheckedOthers) isChecked = false;
        if (isAllOption && !hasCheckedOthers && selectEl.selectedOptions.length === 0) isChecked = true;

        // Tạo Avatar (lấy chữ cái đầu của tên hoặc icon)
        let avatarHtml = '';
        if (isAllOption) {
            avatarHtml = `<div class="student-avatar" style="background:#dbeafe; color:#2563eb;">👥</div>`;
        } else {
            const firstLetter = opt.text.charAt(0).toUpperCase();
            avatarHtml = `<div class="student-avatar" style="background:#f3f4f6; color:#4b5563;">${firstLetter}</div>`;
        }

        html += `
                <label class="student-item">
                    <input type="checkbox" class="student-cb" value="${opt.value}" ${isChecked ? 'checked' : ''} onchange="handleStudentCbChange(this)">
                    ${avatarHtml}
                    <span style="font-weight: 500; font-size: 15px; color: #1f2937;">${opt.text}</span>
                </label>
            `;
    });

    listContainer.innerHTML = html;
    document.getElementById('customStudentModal').style.display = 'flex';
}

function handleStudentCbChange(checkbox) {
    const isAll = checkbox.value === 'all';
    const checkboxes = document.querySelectorAll('.student-cb');

    if (isAll && checkbox.checked) {
        // Nếu click chọn "Tất cả học sinh", gỡ bỏ chọn tất cả các cá nhân
        checkboxes.forEach(cb => { if (cb.value !== 'all') cb.checked = false; });
    } else if (!isAll && checkbox.checked) {
        // Nếu click chọn 1 người, gỡ dấu check ở mục "Tất cả"
        const allCb = Array.from(checkboxes).find(cb => cb.value === 'all');
        if (allCb) allCb.checked = false;
    }
}

function filterCustomStudentList() {
    const text = document.getElementById('customStudentSearch').value.toLowerCase();
    const items = document.querySelectorAll('.student-item');
    items.forEach(item => {
        const label = item.querySelector('span').innerText.toLowerCase();
        item.style.display = label.includes(text) ? 'flex' : 'none';
    });
}

function closeCustomStudentSelect() {
    document.getElementById('customStudentModal').style.display = 'none';
}

function confirmCustomStudentSelect() {
    const selectEl = document.getElementById(currentCustomSelectId);
    const checkboxes = document.querySelectorAll('.student-cb');
    const displaySpan = document.getElementById(currentCustomSelectId + '_displayText');

    let selectedCount = 0;
    let isAllSelected = false;

    // Lưu dữ liệu vào <select> ẩn để hệ thống backend (Firebase) đọc
    Array.from(selectEl.options).forEach(opt => {
        const cb = Array.from(checkboxes).find(c => c.value === opt.value);
        if (cb) {
            opt.selected = cb.checked;
            if (cb.checked) {
                if (opt.value === 'all') isAllSelected = true;
                else selectedCount++;
            }
        }
    });

    // Nếu quên không chọn ai, mặc định chuyển về "Tất cả học sinh"
    if (selectedCount === 0 && !isAllSelected) {
        let allOpt = Array.from(selectEl.options).find(o => o.value === 'all');
        if (allOpt) allOpt.selected = true;
        isAllSelected = true;
    }

    // Đổi chữ bên ngoài (Ví dụ: Đã chọn 3 học sinh)
    if (displaySpan) {
        if (isAllSelected) {
            displaySpan.innerHTML = 'Tất cả học sinh';
        } else {
            displaySpan.innerHTML = `<span style="color:#2563eb; font-weight:600;">Đã chọn ${selectedCount} học sinh</span>`;
        }
    }

    closeCustomStudentSelect();
}

window.toggleParticipateRoadmap = async function (userKey, isParticipating) {
    await updateDB('users', userKey, { isParticipatingRoadmap: isParticipating });
};

window.downloadRoadmapPDF = async function () {
    const selectedStudent = document.getElementById('roadmapStudentSelect').value;

    // Điều kiện: Phải chọn học sinh mới được tải
    if (!selectedStudent || selectedStudent === "") {
        alert("⚠️ Vui lòng chọn một học sinh trong danh sách (ở mục Số điểm) trước khi tải bảng điểm!");
        return;
    }

    const assignments = await getDB('assignments');
    const submissions = await getDB('submissions');
    const users = await getDB('users');

    const st = users.find(u => u.username === selectedStudent);
    const stName = st ? st.name : selectedStudent;

    let htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="text-align: center; color: #2c3e50; text-transform: uppercase;">BẢNG ĐIỂM HỌC TẬP</h2>
            <p style="font-size: 16px;"><strong>Họ và tên học sinh:</strong> ${stName}</p>
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

    const sortedAssignments = [...assignments].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi-VN', { numeric: true, sensitivity: 'base' }));

    sortedAssignments.forEach(assign => {
        // Lọc các bài tập đúng với học sinh đã chọn
        const targetArr = Array.isArray(assign.targetStudent) ? assign.targetStudent : [assign.targetStudent || 'all'];
        if (!targetArr.includes('all') && !targetArr.includes(selectedStudent)) return;

        // SỬA LỖI Ở ĐÂY: Dùng studentUsername để khớp với dữ liệu bài nộp
        const subs = submissions.filter(s => s.assignmentId === assign.id && s.studentUsername === selectedStudent);
        let studentScore = "Chưa làm";

        if (subs.length > 0) {
            // SỬA LỖI Ở ĐÂY: Dùng thuộc tính grade thay vì score
            const bestSub = subs.sort((a, b) => (parseFloat(b.grade) || 0) - (parseFloat(a.grade) || 0))[0];

            if (bestSub.isRegrading) {
                studentScore = "Đang chấm lại";
            } else if (bestSub.grade !== null && bestSub.grade !== undefined && bestSub.grade !== '') {
                studentScore = bestSub.grade;
            } else {
                studentScore = "Chưa chấm";
            }
        }

        htmlContent += `
            <tr>
                <td style="border: 1px solid #cbd5e1; padding: 12px;">${assign.title}</td>
                <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; font-weight: bold; color: #e11d48;">${studentScore}</td>
                <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; color: #64748b;">${assign.endDate || '---'}</td>
            </tr>
        `;
    });

    htmlContent += `
                </tbody>
            </table>
        </div>
    `;

    const opt = {
        margin: 10,
        filename: `BangDiem_${stName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    html2pdf().set(opt).from(tempDiv).save();
};

window.currentVideoDuration = 0; // Biến lưu tổng số giây của video hiện tại để validate

// 1. Hàm tự động tải API Youtube và bóc tách thời lượng chuẩn xác (ĐÃ FIX LỖI)
function getYoutubeDurationCorrectly(url, callback) {
    let videoId = '';
    if (url.includes('watch?v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('shorts/')) videoId = url.split('shorts/')[1].split('?')[0];
    else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];

    if (!videoId) return callback(0);

    let tempDiv = document.createElement('div');
    tempDiv.id = 'yt-temp-' + Date.now();

    // FIX LỖI Ở ĐÂY: Không dùng display none. Đẩy Iframe ra ngoài vùng nhìn thấy của màn hình.
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '10px';
    tempDiv.style.height = '10px';
    document.body.appendChild(tempDiv);

    const loadPlayer = () => {
        let player = new YT.Player(tempDiv.id, {
            height: '10', // Kích thước phải lớn hơn 0 để trình duyệt chịu render
            width: '10',
            videoId: videoId,
            playerVars: {
                'autoplay': 0,
                'controls': 0
            },
            events: {
                'onReady': function (event) {
                    let totalSeconds = Math.floor(event.target.getDuration());
                    callback(totalSeconds);
                    // Tăng delay lên 1000ms để Youtube xử lý xong postMessage trước khi đóng
                    setTimeout(() => {
                        try { player.destroy(); } catch (e) { }
                        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
                    }, 1000);
                },
                'onError': function (event) {
                    callback(0);
                    setTimeout(() => {
                        try { player.destroy(); } catch (e) { }
                        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
                    }, 1000);
                }
            }
        });
    };

    if (typeof YT !== 'undefined' && YT.Player) {
        loadPlayer();
    } else {
        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = loadPlayer;
    }
}

// 2. Hàm xử lý chung để tái sử dụng cho cả Giao bài và Sửa bài
function handleVideoLinkInput(e, displayId, prefix) {
    const url = e.target.value.trim();
    const display = document.getElementById(displayId);
    const inputs = [
        document.getElementById(prefix + 'Day'),
        document.getElementById(prefix + 'Hour'),
        document.getElementById(prefix + 'Min'),
        document.getElementById(prefix + 'Sec')
    ];

    if (!url) {
        if (display) display.innerText = "(Chưa có video)";
        inputs.forEach(inp => { if (inp) { inp.value = ''; inp.disabled = true; } });
        window.currentVideoDuration = 0;
        return;
    }

    if (display) display.innerText = '⏳ Đang phân tích thời lượng...';

    getYoutubeDurationCorrectly(url, function (durationInSeconds) {
        if (durationInSeconds === 0) {
            if (display) display.innerText = '(Không đọc được thời lượng, vui lòng kiểm tra lại link)';
            inputs.forEach(inp => { if (inp) { inp.value = ''; inp.disabled = true; } });
            return;
        }

        window.currentVideoDuration = durationInSeconds; // Lưu để validate không nhập quá số lượng

        let d = Math.floor(durationInSeconds / 86400);
        let h = Math.floor((durationInSeconds % 86400) / 3600);
        let m = Math.floor((durationInSeconds % 3600) / 60);
        let s = durationInSeconds % 60;

        if (inputs[0]) { inputs[0].value = d; inputs[0].disabled = false; }
        if (inputs[1]) { inputs[1].value = h; inputs[1].disabled = false; }
        if (inputs[2]) { inputs[2].value = m; inputs[2].disabled = false; }
        if (inputs[3]) { inputs[3].value = s; inputs[3].disabled = false; }

        if (display) display.innerText = `(Độ dài gốc: ${d > 0 ? d + ' ngày ' : ''}${h}g ${m}p ${s}s)`;
    });
}

// 3. Gắn sự kiện cho Form Giao Bài
const videoLinkInput = document.getElementById('videoLink');
if (videoLinkInput) {
    videoLinkInput.addEventListener('input', function (e) {
        handleVideoLinkInput(e, 'videoTotalTimeDisplay', 'cond');
    });
}

// 4. Gắn sự kiện cho Form Sửa Bài
const editVideoLinkInput = document.getElementById('editVideoLink');
if (editVideoLinkInput) {
    editVideoLinkInput.addEventListener('input', function (e) {
        handleVideoLinkInput(e, 'editVideoTotalTimeDisplay', 'editCond');
    });
}

// 5. Ràng buộc không cho nhập điều kiện quá tổng độ dài video (Giao bài)
window.validateConditionInput = function () {
    const d = parseInt(document.getElementById('condDay').value) || 0;
    const h = parseInt(document.getElementById('condHour').value) || 0;
    const m = parseInt(document.getElementById('condMin').value) || 0;
    const s = parseInt(document.getElementById('condSec').value) || 0;

    const totalInputSec = d * 86400 + h * 3600 + m * 60 + s;
    if (totalInputSec > window.currentVideoDuration && window.currentVideoDuration > 0) {
        alert("⚠️ Điều kiện thời gian không được vượt quá tổng độ dài video!");
        document.getElementById('condSec').value = 0;
    }
};

// 6. Ràng buộc không cho nhập điều kiện quá tổng độ dài video (Sửa bài)
window.validateEditConditionInput = function () {
    const d = parseInt(document.getElementById('editCondDay').value) || 0;
    const h = parseInt(document.getElementById('editCondHour').value) || 0;
    const m = parseInt(document.getElementById('editCondMin').value) || 0;
    const s = parseInt(document.getElementById('editCondSec').value) || 0;

    const totalInputSec = d * 86400 + h * 3600 + m * 60 + s;
    if (totalInputSec > window.currentVideoDuration && window.currentVideoDuration > 0) {
        alert("⚠️ Điều kiện thời gian không được vượt quá tổng độ dài video!");
        document.getElementById('editCondSec').value = 0;
    }
};

// ==============================================================
// HỆ THỐNG QUẢN LÝ VÉ MAY MẮN CHO TỪNG HỌC SINH (GIÁO VIÊN)
// ==============================================================

async function getStudentTicketInfo(username) {
    const submissions = await getDB('submissions');
    const mySubs = submissions.filter(s => s.studentUsername === username && s.grade !== null && s.grade !== undefined && s.grade !== '');

    let totalTickets = 0;
    mySubs.forEach(sub => {
        let score = parseFloat(sub.grade);
        let subTickets = 0;
        if (score === 10) subTickets = 3;
        else if (score > 7) subTickets = 2;
        else if (score > 5) subTickets = 1;

        if (sub.hasRedone && subTickets > 0) subTickets -= 1;
        totalTickets += subTickets;
    });

    const bonusSnap = await db.ref('student_bonus_tickets/' + username).once('value');
    const bonusTickets = parseInt(bonusSnap.val()) || 0;
    totalTickets += bonusTickets;

    const countSnapshot = await db.ref('spin_counts/' + username).once('value');
    let spinTracking = countSnapshot.val() || { count: 0 };
    let usedSpins = parseInt(spinTracking.count) || 0;

    return {
        remaining: totalTickets - usedSpins,
        bonus: bonusTickets
    };
}

window.initTicketManagement = async function () {
    const users = await getDB('users');
    const students = users.filter(u => u.role === 'student');
    const select = document.getElementById('ticketStudentSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn học sinh để xem vé --</option>';
    students.forEach(st => {
        select.innerHTML += `<option value="${st.username}">${st.name} (${st.username})</option>`;
    });
};

window.onTicketStudentChange = async function () {
    const username = document.getElementById('ticketStudentSelect').value;
    const display = document.getElementById('currentTicketDisplay');
    if (!username) {
        display.innerText = '0';
        return;
    }

    display.innerText = '⏳';
    const info = await getStudentTicketInfo(username);
    display.innerText = info.remaining;
};

window.modifyStudentTickets = async function (action) {
    const username = document.getElementById('ticketStudentSelect').value;
    const amountStr = document.getElementById('ticketModifyAmount').value;
    const amount = parseInt(amountStr);

    if (!username) return alert("⚠️ Vui lòng chọn một học sinh trước!");
    if (isNaN(amount) || amount <= 0) return alert("⚠️ Vui lòng nhập số lượng vé hợp lệ (lớn hơn 0)!");

    const info = await getStudentTicketInfo(username);
    let newBonus = info.bonus;

    if (action === 'add') {
        if (!confirm(`Bạn có chắc chắn muốn CỘNG THÊM ${amount} vé cho học sinh này?`)) return;
        newBonus += amount;
    } else if (action === 'sub') {
        if (info.remaining < amount) {
            return alert(`❌ Học sinh này hiện chỉ có ${info.remaining} vé, không đủ để trừ!`);
        }
        if (!confirm(`Bạn có chắc chắn muốn TRỪ ĐI ${amount} vé của học sinh này?`)) return;
        newBonus -= amount;
    }

    try {
        await db.ref('student_bonus_tickets/' + username).set(newBonus);
        alert(`✅ Đã ${action === 'add' ? 'CỘNG' : 'TRỪ'} ${amount} vé thành công!`);
        document.getElementById('ticketModifyAmount').value = '';
        window.onTicketStudentChange();
    } catch (e) {
        console.error("Lỗi cập nhật vé:", e);
        alert("❌ Đã xảy ra lỗi khi kết nối dữ liệu.");
    }
};

// --- QUẢN LÝ BẢNG XẾP HẠNG THI ĐUA (CẬP NHẬT) ---

listenFirebase(db.ref('leaderboard_settings'), 'value', (snapshot) => {
    const settings = snapshot.val() || {};

    // Đảm bảo luôn có giá trị mặc định chạy ngầm nếu Firebase trống
    const isOpen = settings.isOpen !== undefined ? settings.isOpen : false;
    const targetMonth = settings.targetMonth || (new Date().getMonth() + 1);
    const targetYear = settings.targetYear || new Date().getFullYear();
    const rewardRank3 = settings.rewardRank3 !== undefined ? settings.rewardRank3 : 100;
    const rewardRank4 = settings.rewardRank4 !== undefined ? settings.rewardRank4 : 50;
    const chestDup = settings.chestDup !== undefined ? settings.chestDup : 95;
    const chestNorm = settings.chestNorm !== undefined ? settings.chestNorm : 4;
    const chestLeg = settings.chestLeg !== undefined ? settings.chestLeg : 1;

    // Cập nhật giao diện an toàn theo từng ID riêng biệt để tránh lỗi DOM sập luồng
    const toggleInput = document.getElementById('lbToggle');
    if (toggleInput) toggleInput.checked = !!isOpen;

    const seasonDisplay = document.getElementById('currentSeasonDisplay');
    if (seasonDisplay) {
        if (settings.targetMonth && settings.targetYear) {
            seasonDisplay.innerText = `Tháng ${settings.targetMonth}/${settings.targetYear}`;
            seasonDisplay.style.color = '#3b82f6';
        } else {
            seasonDisplay.innerText = `Chưa có lịch`;
            seasonDisplay.style.color = '#e11d48';
        }
    }

    const elR3 = document.getElementById('lbRewardRank3');
    if (elR3) elR3.value = rewardRank3;

    const elR4 = document.getElementById('lbRewardRank4');
    if (elR4) elR4.value = rewardRank4;

    // Đổ dữ liệu tỷ lệ phần trăm ra các ô input công khai
    const elDup = document.getElementById('lbChestDup');
    if (elDup) elDup.value = chestDup;

    const elNorm = document.getElementById('lbChestNorm');
    if (elNorm) elNorm.value = chestNorm;

    const elLeg = document.getElementById('lbChestLeg');
    if (elLeg) elLeg.value = chestLeg;
});

// Tắt/Mở BXH thủ công
window.toggleLeaderboardStatus = async function (isOpen) {
    await db.ref('leaderboard_settings').update({ isOpen: isOpen });
};

// Đặt lịch mùa giải tự động cho tháng sau
window.setNextMonthSeason = async function () {
    const now = new Date();
    let targetMonth = now.getMonth() + 2; // Đẩy tiến sang tháng tiếp theo
    let targetYear = now.getFullYear();

    if (targetMonth > 12) {
        targetMonth = 1;
        targetYear += 1;
    }

    if (confirm(`Bạn có muốn thiết lập lịch hẹn mùa giải mới bắt đầu vào Tháng ${targetMonth}/${targetYear}?`)) {
        await db.ref('leaderboard_settings').update({
            targetMonth: targetMonth,
            targetYear: targetYear
        });
        alert(`✅ Đã đặt lịch hẹn! Khi đến tháng ${targetMonth}/${targetYear}, hệ thống sẽ tự động kích hoạt lại bảng xếp hạng.`);
    }
};

// Lưu cấu hình phần thưởng và kiểm tra tổng tỷ lệ 100%
window.saveLeaderboardSettings = async function () {
    const r3 = parseInt(document.getElementById('lbRewardRank3').value) || 0;
    const r4 = parseInt(document.getElementById('lbRewardRank4').value) || 0;

    const dup = parseInt(document.getElementById('lbChestDup').value) || 0;
    const norm = parseInt(document.getElementById('lbChestNorm').value) || 0;
    const leg = parseInt(document.getElementById('lbChestLeg').value) || 0;

    const totalRate = dup + norm + leg;
    const errorMsg = document.getElementById('lbErrorMsg');

    if (totalRate !== 100) {
        errorMsg.innerText = `❌ LỖI: Tổng tỉ lệ Rương đang là ${totalRate}%. Phải thiết lập tổng đúng bằng 100%!`;
        errorMsg.style.display = 'block';
        return;
    }

    errorMsg.style.display = 'none';
    await db.ref('leaderboard_settings').update({
        rewardRank3: r3,
        rewardRank4: r4,
        chestDup: dup,
        chestNorm: norm,
        chestLeg: leg
    });
    alert('✅ Đã lưu cấu hình phần thưởng và tỷ lệ rương thành công!');
};

window.deleteCurrentSeason = async function () {
    if (confirm("⚠️ Bạn có chắc chắn muốn XÓA lịch mùa giải hiện tại không?\nHành động này sẽ xóa ngày hẹn và Bảng xếp hạng sẽ đóng cho đến khi bạn thiết lập lại.")) {
        // Cập nhật Firebase: set targetMonth và targetYear thành null, đồng thời tắt luôn BXH cho an toàn
        await db.ref('leaderboard_settings').update({
            isOpen: false,
            targetMonth: null,
            targetYear: null
        });
        alert(`🗑️ Đã xóa lịch mùa giải thành công!`);
    }
};

window.changeTeacherPassword = async function () {
    const newPassword = document.getElementById('newPasswordInput').value.trim();
    const confirmPassword = document.getElementById('confirmPasswordInput').value.trim();

    if (!newPassword || newPassword.length < 6) {
        return alert("⚠️ Mật khẩu mới phải có ít nhất 6 ký tự!");
    }
    if (newPassword !== confirmPassword) {
        return alert("❌ Mật khẩu xác nhận không khớp!");
    }

    try {
        const user = firebase.auth().currentUser;
        if (user) {
            // 1. Cập nhật trên Firebase Authentication
            await user.updatePassword(newPassword);

            // 2. Cập nhật vào Realtime Database để đồng bộ với dữ liệu cũ của bạn
            await db.ref('users/' + currentUser._fbKey).update({
                password: newPassword
            });

            // 3. Cập nhật lại localStorage để tránh bị lỗi khi tải lại trang
            currentUser.password = newPassword;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            alert("✅ Đổi mật khẩu thành công! Hãy nhớ mật khẩu mới của bạn.");
            // Reset ô nhập
            document.getElementById('newPasswordInput').value = '';
            document.getElementById('confirmPasswordInput').value = '';
        } else {
            alert("❌ Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại!");
        }
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            alert("⚠️ Bảo mật Firebase: Bạn cần đăng xuất và đăng nhập lại để xác thực quyền đổi mật khẩu!");
        } else {
            alert("❌ Lỗi: " + error.message);
        }
    }
};

// Khởi chạy tải danh sách khi giáo viên mở trang
loadTeacherCashRequests();