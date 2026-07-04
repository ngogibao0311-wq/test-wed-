/* ================= HỆ THỐNG TRÒ CHƠI HỘI HỌA ================= */
window.HoiHoaSystem = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentTool: 'brush', // brush, eraser
    currentColor: '#000000',
    currentSize: 5,
    history: [],
    historyStep: -1,
    currentRound: null,
    draftInterval: null,
    myVotesCount: 0,

    init: async function () {
        if (typeof currentUser === 'undefined' || !currentUser) {
            setTimeout(() => this.init(), 1000);
            return;
        }

        // Nhúng Modal xem ảnh to
        if (!document.getElementById('artworkPreviewModal')) {
            document.body.insertAdjacentHTML('beforeend', `
                <div id="artworkPreviewModal" class="modal-overlay" style="z-index: 9999999; background: rgba(0,0,0,0.8);" onclick="this.classList.remove('active')">
                    <div class="modal-content" style="text-align: center;">
                        <img id="artworkPreviewImg" src="">
                    </div>
                </div>
            `);
        }

        if (currentUser.role === 'student') {
            this.initStudent();
        } else if (currentUser.role === 'teacher') {
            this.initTeacher();
        }
    },

    /* ================= 1. GIAO DIỆN HỌC SINH ================= */
    initStudent: async function () {
        const gameContainer = document.getElementById('gameActiveView');
        if (!gameContainer) return;

        // Tránh tiêm trùng lặp Card (bổ sung an toàn)
        if (document.getElementById('hh-student-entry-card')) return;

        const cardHtml = `
            <div id="hh-student-entry-card" class="card" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; margin-top: 20px; background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);">
                <div>
                    <h3 style="color: #4a00e0; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
                        🎨 Cuộc Thi Hội Họa
                    </h3>
                    <p style="color: #333; font-size: 0.9em; margin: 0;">Sân chơi nghệ thuật. Thể hiện tài năng, nhận giải thưởng cực lớn!</p>
                </div>
                <button onclick="HoiHoaSystem.openStudentModal()" style="background: #4a00e0; color: white; padding: 12px 25px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(74, 0, 224, 0.4);">Vào Phòng Tranh ➡️</button>
            </div>
        `;
        gameContainer.insertAdjacentHTML('beforeend', cardHtml);

        if (!document.getElementById('hoihoaStudentModal')) {
            const modalHtml = `
                <div id="hoihoaStudentModal" class="modal-overlay" style="z-index: 999998;">
                    <div class="modal-content hoihoa-container" style="max-width: 1000px; width: 95%;">
                        <button class="close-btn" onclick="HoiHoaSystem.closeStudentModal()">✖</button>
                        <div class="hoihoa-header" style="flex-direction: column; align-items: stretch;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                                <div>
                                    <h2 style="color: #4a00e0; margin: 0;" id="hh-round-title">Đang tải...</h2>
                                    <p style="color: #e11d48; font-weight: bold; margin: 5px 0 0 0;" id="hh-round-topic"></p>
                                </div>
                                <div style="text-align: right;">
                                    <span id="hh-round-status" style="padding: 5px 12px; background: #f1f5f9; border-radius: 20px; font-weight: bold;">Trạng thái</span>
                                    <p style="margin: 5px 0 0 0; font-size: 0.85em; color: #64748b;" id="hh-round-time"></p>
                                </div>
                            </div>
                            <!-- THANH TAB ĐIỀU HƯỚNG 5 VÒNG GẦN NHẤT -->
                            <div id="hh-round-tabs" style="display: flex; gap: 10px; margin-top: 15px; overflow-x: auto; padding-bottom: 5px; border-top: 1px dashed #cbd5e1; padding-top: 10px;"></div>
                        </div>
                        <div id="hh-student-content"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    },

    openStudentModal: async function () {
        document.getElementById('hoihoaStudentModal').classList.add('active');
        const content = document.getElementById('hh-student-content');
        const tabsContainer = document.getElementById('hh-round-tabs');

        content.innerHTML = '<p style="text-align:center;">⏳ Đang đồng bộ dữ liệu vòng thi...</p>';
        if (tabsContainer) tabsContainer.innerHTML = '';

        const roundsSnap = await db.ref('hoihoa_rounds').once('value');
        let rounds = roundsSnap.val() ? Object.values(roundsSnap.val()) : [];

        if (rounds.length === 0) {
            content.innerHTML = '<p style="text-align:center; color:#666;">Hiện tại chưa có vòng thi Hội Họa nào được tổ chức.</p>';
            document.getElementById('hh-round-title').innerText = 'Phòng Tranh Trống';
            return;
        }

        // Sắp xếp vòng mới nhất lên đầu và Cắt lấy tối đa 5 vòng
        rounds.sort((a, b) => b.startTime - a.startTime);
        this.availableRounds = rounds.slice(0, 5);

        // Tạo giao diện các nút Tab chuyển vòng
        let tabsHtml = '';
        this.availableRounds.forEach(r => {
            let statusIcon = r.status === 'active' ? '🟢' : (r.status === 'voting' ? '🗳️' : '🏆');
            tabsHtml += `<button class="hh-tab-btn" id="hh-tab-${r.id}" onclick="HoiHoaSystem.selectRound('${r.id}')" style="padding: 6px 12px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; cursor: pointer; font-weight: bold; color: #475569; white-space: nowrap; transition: 0.2s;">${statusIcon} ${r.title}</button>`;
        });

        if (tabsContainer) tabsContainer.innerHTML = tabsHtml;

        // Ưu tiên tự động mở: Vòng đang Active -> Vòng đang Bình chọn -> Vòng mới nhất
        const defaultRound = this.availableRounds.find(r => r.status === 'active') || this.availableRounds.find(r => r.status === 'voting') || this.availableRounds[0];

        this.selectRound(defaultRound.id);
    },

    selectRound: function (roundId) {
        // Xóa lưu nháp tự động của vòng trước đó để tránh ghi đè nhầm
        if (this.draftInterval) clearInterval(this.draftInterval);

        this.currentRound = this.availableRounds.find(r => r.id === roundId);
        if (!this.currentRound) return;

        // Đổi màu Tab đang chọn
        document.querySelectorAll('.hh-tab-btn').forEach(btn => {
            btn.style.background = '#f8fafc';
            btn.style.color = '#475569';
            btn.style.borderColor = '#cbd5e1';
        });
        const activeTab = document.getElementById(`hh-tab-${roundId}`);
        if (activeTab) {
            activeTab.style.background = '#e0e7ff';
            activeTab.style.color = '#2563eb';
            activeTab.style.borderColor = '#3b82f6';
        }

        // Đổ dữ liệu vòng được chọn ra UI
        document.getElementById('hh-round-title').innerText = this.currentRound.title;
        document.getElementById('hh-round-topic').innerText = 'Đề tài: ' + this.currentRound.topic;
        document.getElementById('hh-round-time').innerText = `Hạn chót: ${new Date(this.currentRound.endTime).toLocaleDateString('vi-VN')} - ${new Date(this.currentRound.endTime).toLocaleTimeString('vi-VN')}`;

        const content = document.getElementById('hh-student-content');

        // Render khu vực nội dung tương ứng với trạng thái của vòng
        if (this.currentRound.status === 'active') {
            document.getElementById('hh-round-status').innerText = '🟢 Đang diễn ra (Có thể vẽ)';
            this.renderCanvasArea(content);
        } else if (this.currentRound.status === 'voting') {
            document.getElementById('hh-round-status').innerText = '🗳️ Đang Bình Chọn';
            this.renderVotingArea(content);
        } else {
            document.getElementById('hh-round-status').innerText = '🏆 Đã Kết Thúc (Kết Quả)';
            this.renderLeaderboardArea(content);
        }
    },

    closeStudentModal: function () {
        document.getElementById('hoihoaStudentModal').classList.remove('active');
        if (this.draftInterval) clearInterval(this.draftInterval);
    },

    /* --- Khu vực Bảng Vẽ (Trạng thái Active) --- */
    renderCanvasArea: async function (container) {
        // Fix lỗi 1.1: Kiểm tra thời gian kết thúc trước khi cho vẽ
        if (Date.now() > this.currentRound.endTime) {
            container.innerHTML = '<div style="text-align:center; padding: 40px;"><p style="color:#e11d48; font-weight:bold; font-size:1.2em;">⏰ Vòng thi đã kết thúc thời gian nộp bài!</p><p style="color:#666;">Vui lòng chờ giáo viên chuyển sang giai đoạn bình chọn.</p></div>';
            return;
        }

        const subSnap = await db.ref(`hoihoa_submissions/${this.currentRound.id}_${currentUser.username}`).once('value');
        if (subSnap.exists()) {
            container.innerHTML = `
                <div style="text-align:center; padding: 40px;">
                    <h3 style="color:#10b981;">✅ Bạn đã nộp tác phẩm cho vòng này!</h3>
                    <p style="color:#666;">Vui lòng chờ đến giai đoạn Bình Chọn để xem tranh của các bạn khác.</p>
                    <img src="${subSnap.val().imageBase64}" style="max-width: 80%; height: auto; border-radius: 12px; margin-top: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="canvas-toolbar">
                <input type="color" id="hh-color" value="#000000" onchange="HoiHoaSystem.currentColor = this.value">
                <input type="range" id="hh-size" min="1" max="50" value="5" onchange="HoiHoaSystem.currentSize = this.value">
                <button onclick="HoiHoaSystem.setTool('brush')" id="btn-tool-brush" class="active">🖌️ Bút vẽ</button>
                <button onclick="HoiHoaSystem.setTool('eraser')" id="btn-tool-eraser">🧹 Cục tẩy</button>
                <div style="width: 1px; height: 30px; background: #cbd5e1; margin: 0 10px;"></div>
                <button onclick="HoiHoaSystem.undo()">↩️ Hoàn tác</button>
                <button onclick="HoiHoaSystem.clearCanvas()" style="color: #e11d48;">🗑️ Xóa trắng</button>
                <div style="flex-grow: 1; text-align: right;">
                    <span id="hh-draft-status" style="font-size: 0.85em; color: #64748b; margin-right: 15px;"></span>
                    <button onclick="HoiHoaSystem.submitArtwork()" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border: none;">📤 Nộp Tác Phẩm</button>
                </div>
            </div>
            <div class="canvas-wrapper">
                <canvas id="hoihoaCanvas"></canvas>
            </div>
            <p style="font-size: 0.85em; color: #e11d48; margin-top: 10px; font-weight: bold;">* Lưu ý: Mỗi vòng chỉ được nộp 1 lần duy nhất. Bạn không được chép tranh hoặc tải ảnh từ ngoài vào (Vi phạm sẽ bị loại).</p>
        `;

        this.setupCanvas();
    },

    setupCanvas: function () {
        const canvasEl = document.getElementById('hoihoaCanvas');
        const wrapper = document.querySelector('.canvas-wrapper');
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');

        // Setup kích thước thật
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;

        // Đổ nền trắng
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Sự kiện vẽ
        this.canvas.addEventListener('mousedown', this.startPosition.bind(this));
        this.canvas.addEventListener('mouseup', this.endPosition.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseleave', () => this.isDrawing = false);

        // Cảm ứng điện thoại
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.startPosition(e.touches[0]); }, { passive: false });
        this.canvas.addEventListener('touchend', this.endPosition.bind(this));
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.draw(e.touches[0]); }, { passive: false });

        // Phục hồi nháp
        this.restoreDraft();
        this.saveState();

        // Tự động lưu nháp mỗi 5s
        if (this.draftInterval) clearInterval(this.draftInterval);
        this.draftInterval = setInterval(() => {
            const data = this.canvas.toDataURL();
            localStorage.setItem(`hh_draft_${currentUser.username}_${this.currentRound.id}`, data);
            document.getElementById('hh-draft-status').innerText = 'Bản nháp đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN');
        }, 5000);
    },

    setTool: function (tool) {
        this.currentTool = tool;
        document.getElementById('btn-tool-brush').classList.remove('active');
        document.getElementById('btn-tool-eraser').classList.remove('active');
        document.getElementById(`btn-tool-${tool}`).classList.add('active');
    },

    startPosition: function (e) {
        this.isDrawing = true;
        this.draw(e);
    },

    endPosition: function () {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.ctx.beginPath();
        this.saveState();
    },

    draw: function (e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        // Lấy tọa độ chuẩn xác dựa trên scale của canvas hiển thị
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        this.ctx.lineWidth = this.currentSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = '#ffffff';
        } else {
            this.ctx.strokeStyle = this.currentColor;
        }

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    },

    saveState: function () {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        this.history.push(this.canvas.toDataURL());
    },

    undo: function () {
        if (this.historyStep > 0) {
            this.historyStep--;
            const img = new Image();
            img.src = this.history[this.historyStep];
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            }
        } else {
            this.clearCanvas();
        }
    },

    clearCanvas: function () {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.historyStep = -1;
        this.history = [];
        this.saveState();
    },

    restoreDraft: function () {
        const draft = localStorage.getItem(`hh_draft_${currentUser.username}_${this.currentRound.id}`);
        if (draft) {
            const img = new Image();
            img.src = draft;
            img.onload = () => this.ctx.drawImage(img, 0, 0);
        }
    },

    submitArtwork: async function () {
        if (!confirm('Bạn có chắc chắn muốn nộp tác phẩm này? (Chỉ được nộp 1 lần duy nhất)')) return;

        // Double check time before submitting
        if (Date.now() > this.currentRound.endTime) {
            alert('⏰ Vòng thi đã kết thúc thời gian nộp bài!');
            this.openStudentModal();
            return;
        }

        const imageBase64 = this.canvas.toDataURL('image/png');

        // Fix lỗi 2.2: Kiểm tra dung lượng base64 (<10MB để không vượt quota Firebase)
        const sizeInBytes = Math.ceil((imageBase64.length * 3) / 4) - (imageBase64.indexOf('=') > 0 ? (imageBase64.length - imageBase64.indexOf('=')) : 0);
        if (sizeInBytes > 10 * 1024 * 1024) {
            alert('❌ Ảnh quá lớn (>10MB). Vui lòng dùng cục tẩy làm sạch bớt các nét thừa hoặc tải lại trang để vẽ gọn hơn.');
            return;
        }

        const payload = {
            id: `${this.currentRound.id}_${currentUser.username}`,
            roundId: this.currentRound.id,
            studentUsername: currentUser.username,
            studentName: currentUser.name,
            imageBase64: imageBase64,
            submitTime: Date.now(),
            teacherScore: 0,
            votes: 0,
            voters: {},
            finalScore: 0,
            rank: 0
        };

        try {
            await db.ref(`hoihoa_submissions/${payload.id}`).set(payload);
            // Cải tiến 2.1: Chắc chắn chỉ xóa draft khi nộp thành công
            localStorage.removeItem(`hh_draft_${currentUser.username}_${this.currentRound.id}`);
            alert('🎉 Chúc mừng! Bạn đã nộp tác phẩm thành công.');
            this.openStudentModal();
        } catch (e) {
            alert('❌ Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!');
        }
    },

    /* --- Khu vực Bình chọn (Trạng thái Voting) --- */
    renderVotingArea: async function (container) {
        container.innerHTML = '<p>Đang tải danh sách tác phẩm...</p>';
        const subsSnap = await db.ref('hoihoa_submissions').orderByChild('roundId').equalTo(this.currentRound.id).once('value');
        const submissions = subsSnap.val() ? Object.values(subsSnap.val()) : [];

        if (submissions.length === 0) {
            container.innerHTML = '<p style="text-align:center;">Vòng này không có tác phẩm nào được nộp.</p>';
            return;
        }

        this.myVotesCount = 0;
        submissions.forEach(sub => {
            if (sub.voters && sub.voters[currentUser.username]) this.myVotesCount++;
        });

        // Xáo trộn mảng bằng thuật toán Fisher-Yates chuẩn (thay cho sort Math.random)
        for (let i = submissions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [submissions[i], submissions[j]] = [submissions[j], submissions[i]];
        }

        let html = `
            <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 12px; margin-bottom: 15px; color: #2563eb; font-weight: bold;">
                🗳️ Bạn được bình chọn tối đa 03 tác phẩm. Đã dùng: <span id="hh-vote-count">${this.myVotesCount}</span>/3
            </div>
            <div class="hoihoa-gallery">
        `;

        submissions.forEach(sub => {
            const isMine = sub.studentUsername === currentUser.username;
            const hasVoted = sub.voters && sub.voters[currentUser.username];

            let btnHtml = '';
            if (isMine) {
                btnHtml = `<p style="color:#d97706; font-weight:bold; margin-top:10px;">⭐ Tác phẩm của bạn</p>`;
            } else if (hasVoted) {
                btnHtml = `<button class="vote-btn voted" disabled>✅ Đã bình chọn</button>`;
            } else {
                btnHtml = `<button class="vote-btn" id="vote-btn-${sub.id}" onclick="HoiHoaSystem.voteArtwork('${sub.id}')">❤️ Bình chọn</button>`;
            }

            html += `
                <div class="artwork-card">
                    <img src="${sub.imageBase64}" class="artwork-img" onclick="HoiHoaSystem.previewImage('${sub.imageBase64}')">
                    <h4 style="margin: 5px 0;">Tác giả: Ẩn danh</h4>
                    <p style="font-size: 0.85em; color: #666; margin: 0;">Số phiếu: <span id="vote-val-${sub.id}">${sub.votes || 0}</span></p>
                    ${btnHtml}
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    voteArtwork: async function (subId) {
        if (this.myVotesCount >= 3) return alert('⚠️ Bạn đã dùng hết 3 lượt bình chọn cho vòng này!');

        try {
            await db.ref(`hoihoa_submissions/${subId}/voters/${currentUser.username}`).set(true);
            await db.ref(`hoihoa_submissions/${subId}/votes`).transaction(current => (current || 0) + 1);

            this.myVotesCount++;
            document.getElementById('hh-vote-count').innerText = this.myVotesCount;
            const btn = document.getElementById(`vote-btn-${subId}`);
            btn.className = 'vote-btn voted';
            btn.innerText = '✅ Đã bình chọn';
            btn.disabled = true;

            const voteVal = document.getElementById(`vote-val-${subId}`);
            voteVal.innerText = parseInt(voteVal.innerText) + 1;

            alert('❤️ Đã ghi nhận bình chọn của bạn!');
        } catch (e) {
            alert('❌ Lỗi hệ thống khi bình chọn.');
        }
    },

    previewImage: function (base64) {
        document.getElementById('artworkPreviewImg').src = base64;
        document.getElementById('artworkPreviewModal').classList.add('active');
    },

    /* ================= 2. GIAO DIỆN GIÁO VIÊN ================= */
    initTeacher: async function () {
        // Fix lỗi 1.3: Cổng bảo vệ chỉ dành cho giáo viên
        if (!currentUser || currentUser.role !== 'teacher') return;

        const gameManageTab = document.getElementById('tab-game-manage') || document.querySelector('.game-manage-container') || document.getElementById('tab-games');

        if (!gameManageTab) {
            console.warn('⚠️ Không tìm thấy khu vực Quản lý Trò chơi.');
            return;
        }

        // Fix lỗi 2.4: Tránh tiêm UI nhiều lần khi re-init
        if (document.getElementById('hh-teacher-container-wrapper')) return;

        const dashboardHtml = `
            <div id="hh-teacher-container-wrapper" class="hoihoa-teacher-section" style="margin-top: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                
                <div id="hh-toggle-header" style="background: #f8fafc; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; border-bottom: 1px solid #e2e8f0;">
                    <h2 style="color: #4a00e0; margin: 0; display: flex; align-items: center; gap: 10px; font-size: 1.25em;">
                        🎨 Quản lý Trò chơi Hội Họa
                    </h2>
                    <span id="hh-toggle-icon" style="font-size: 1.1em; color: #64748b; font-weight: bold; transition: all 0.2s;">▶ Thả xuống</span>
                </div>

                <div id="hh-teacher-content" style="display: none; padding: 20px; background: #ffffff;">
                    <p style="color: #64748b; margin-top: 0; margin-bottom: 20px; font-size: 0.95em;">Tổ chức các vòng thi vẽ, chấm điểm và tự động phát thưởng cho học sinh.</p>
                    
                    <div class="card form-container" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
                        <h3 style="color: #333; margin-top: 0; font-size: 1.05em;">➕ Tạo vòng thi mới</h3>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <input type="text" id="hh-create-title" placeholder="Tên vòng (VD: Vòng 1 - Tháng 8)" style="padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; width: 100%; box-sizing: border-box;">
                            <input type="text" id="hh-create-topic" placeholder="Đề tài (VD: Vẽ cảnh mùa hè quê em)" style="padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; width: 100%; box-sizing: border-box;">
                            
                            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 200px;">
                                    <label style="font-size: 0.85em; font-weight: bold; color: #475569;">Thời gian Bắt đầu:</label>
                                    <input type="datetime-local" id="hh-create-start" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; margin-top: 5px; box-sizing: border-box;">
                                </div>
                                <div style="flex: 1; min-width: 200px;">
                                    <label style="font-size: 0.85em; font-weight: bold; color: #475569;">Thời gian Kết thúc (Hạn nộp):</label>
                                    <input type="datetime-local" id="hh-create-end" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; margin-top: 5px; box-sizing: border-box;">
                                </div>
                            </div>
                            
                            <button onclick="HoiHoaSystem.createRound()" style="margin-top: 8px; background: linear-gradient(135deg, #4a00e0, #8e2de2); color: white; padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Tạo Vòng Thi Mới</button>
                        </div>
                    </div>

                    <h3 style="margin-top: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; color: #334155; font-size: 1.05em;">📋 Danh sách Vòng thi Hội Họa</h3>
                    <div id="hh-teacher-rounds-list"></div>
                </div>

            </div>
        `;

        gameManageTab.insertAdjacentHTML('beforeend', dashboardHtml);

        const toggleHeader = document.getElementById('hh-toggle-header');
        const contentArea = document.getElementById('hh-teacher-content');
        const toggleIcon = document.getElementById('hh-toggle-icon');

        toggleHeader.addEventListener('click', function () {
            if (contentArea.style.display === 'none') {
                contentArea.style.display = 'block';
                toggleIcon.innerText = '▼ Thu gọn';
                toggleIcon.style.color = '#4a00e0';
            } else {
                contentArea.style.display = 'none';
                toggleIcon.innerText = '▶ Thả xuống';
                toggleIcon.style.color = '#64748b';
            }
        });

        this.loadTeacherRounds();
    },

    createRound: async function () {
        if (!currentUser || currentUser.role !== 'teacher') return alert('Chỉ giáo viên mới có quyền tạo vòng thi!');

        const title = document.getElementById('hh-create-title').value;
        const topic = document.getElementById('hh-create-topic').value;
        const start = document.getElementById('hh-create-start').value;
        const end = document.getElementById('hh-create-end').value;

        if (!title || !topic || !start || !end) return alert("Vui lòng điền đủ thông tin!");

        const roundId = 'HH_' + Date.now();
        const payload = {
            id: roundId,
            title, topic,
            startTime: new Date(start).getTime(),
            endTime: new Date(end).getTime(),
            status: 'active',
            totalVotes: 0
        };

        try {
            // Thay vì dùng pushDB, gọi thẳng hàm set của Firebase bằng roundId
            await db.ref(`hoihoa_rounds/${roundId}`).set(payload);
            alert("Đã tạo vòng thi thành công!");
            this.loadTeacherRounds();
        } catch (error) {
            alert("Lỗi khi tạo vòng thi: " + error.message);
        }
    },

    loadTeacherRounds: async function () {
        const container = document.getElementById('hh-teacher-rounds-list');
        if (!container) return;

        const roundsSnap = await db.ref('hoihoa_rounds').once('value');
        const rounds = [];

        // CÁCH SỬA CHUẨN: Lặp qua từng node để giữ lại Firebase Key (_fbKey)
        roundsSnap.forEach(childSnap => {
            let data = childSnap.val();
            data._fbKey = childSnap.key; // Gắn cứng key gốc
            rounds.push(data);
        });

        if (rounds.length === 0) {
            container.innerHTML = '<p>Chưa có vòng thi nào.</p>';
            return;
        }

        rounds.sort((a, b) => b.startTime - a.startTime);
        let html = '';

        rounds.forEach(r => {
            let statusBtn = '';
            if (r.status === 'active') {
                statusBtn = `<button onclick="HoiHoaSystem.changeRoundStatus('${r._fbKey}', 'voting')" style="background:#f59e0b; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Chuyển sang Chế độ Bình Chọn</button>`;
            } else if (r.status === 'voting') {
                statusBtn = `<button onclick="HoiHoaSystem.publishResults('${r._fbKey}', '${r.id}')" style="background:#10b981; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Chốt Sổ & Công Bố Kết Quả</button>`;
            } else {
                statusBtn = `<span style="color:#10b981; font-weight:bold;">Đã hoàn tất trao giải</span>`;
            }

            html += `
                <div class="card" style="border-left: 5px solid #4a00e0; margin-bottom: 15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="margin:0; color:#4a00e0;">${r.title}</h4>
                            <p style="margin:5px 0 0 0; color:#666;">Đề tài: ${r.topic}</p>
                        </div>
                        <div style="text-align:right;">
                            <p style="margin:0 0 10px 0; font-weight:bold;">Trạng thái: ${r.status.toUpperCase()}</p>
                            ${statusBtn}
                        </div>
                    </div>
                    <div style="margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 15px;">
                        <button onclick="HoiHoaSystem.loadSubmissionsForGrading('${r.id}')" style="background:#3b82f6; color:white; padding:8px 12px; border:none; border-radius:5px; cursor:pointer;">Chấm Điểm Bài Nộp</button>
                        <button onclick="HoiHoaSystem.deleteRound('${r._fbKey}')" style="background:#e11d48; color:white; padding:8px 12px; border:none; border-radius:5px; cursor:pointer; margin-left: 10px;">Xóa Vòng</button>
                    </div>
                    <div id="hh-grading-area-${r.id}" style="margin-top:15px; display:none;"></div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    changeRoundStatus: async function (fbKey, newStatus) {
        if (!currentUser || currentUser.role !== 'teacher') return alert('Vô quyền!');
        if (!confirm('Chắc chắn chuyển trạng thái vòng thi này?')) return;
        try {
            await db.ref(`hoihoa_rounds/${fbKey}`).update({ status: newStatus });
            this.loadTeacherRounds();
        } catch (error) {
            alert("Lỗi khi đổi trạng thái: " + error.message);
        }
    },

    deleteRound: async function (fbKey) {
        if (!currentUser || currentUser.role !== 'teacher') return alert('Vô quyền!');
        if (!confirm('Hành động này sẽ XÓA VĨNH VIỄN vòng thi. Tiếp tục?')) return;
        try {
            await db.ref(`hoihoa_rounds/${fbKey}`).remove();
            alert('Đã xóa vòng thi thành công!');
            this.loadTeacherRounds();
        } catch (error) {
            alert("Lỗi khi xóa vòng thi: " + error.message);
        }
    },

    loadSubmissionsForGrading: async function (roundId, forceReload = false) {
        if (!currentUser || currentUser.role !== 'teacher') return;
        const container = document.getElementById(`hh-grading-area-${roundId}`);

        if (!forceReload && container.style.display === 'block') {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = '<p>Đang tải bài nộp...</p>';

        const subsSnap = await db.ref('hoihoa_submissions').orderByChild('roundId').equalTo(roundId).once('value');
        const submissions = [];

        // Giữ lại key cho các bản ghi submission
        subsSnap.forEach(childSnap => {
            let data = childSnap.val();
            data._fbKey = childSnap.key;
            submissions.push(data);
        });

        if (submissions.length === 0) {
            container.innerHTML = '<p style="color:#e11d48;">Chưa có học sinh nào nộp bài.</p>';
            return;
        }

        let html = '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">';
        submissions.forEach(sub => {
            html += `
                <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2e8f0; display:flex; gap:10px;">
                    <img src="${sub.imageBase64}" style="width:100px; height:70px; object-fit:cover; border-radius:6px; cursor:pointer;" onclick="HoiHoaSystem.previewImage('${sub.imageBase64}')">
                    <div style="flex-grow:1;">
                        <strong style="display:block;">${sub.studentName}</strong>
                        <span style="font-size:0.85em; color:#666;">Phiếu bầu: ${sub.votes || 0}</span>
                        <div style="margin-top:5px; display:flex; gap:5px; align-items:center;">
                            <input type="number" id="grade-hh-${sub.id}" value="${sub.teacherScore !== undefined ? sub.teacherScore : ''}" placeholder="Điểm (0-10)" style="width:70px; padding:4px; margin:0; border: 1px solid #ccc; border-radius: 4px;" min="0" max="10" step="0.1">
                            <button onclick="HoiHoaSystem.saveGrade('${sub._fbKey}', '${sub.id}', '${roundId}')" style="padding:4px 8px; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer;">Lưu điểm</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    saveGrade: async function (fbKey, subId, roundId) {
        if (!currentUser || currentUser.role !== 'teacher') return alert('Vô quyền!');
        const score = parseFloat(document.getElementById(`grade-hh-${subId}`).value);
        if (isNaN(score) || score < 0 || score > 10) return alert('Điểm không hợp lệ (nhập từ 0-10)!');

        try {
            await db.ref(`hoihoa_submissions/${fbKey}`).update({ teacherScore: score });
            alert('Lưu điểm thành công!');
            this.loadSubmissionsForGrading(roundId, true);
        } catch (error) {
            alert('Lỗi khi lưu điểm: ' + error.message);
        }
    },

    /* ================= THUẬT TOÁN TÍNH ĐIỂM & TRAO GIẢI 5 VÒNG ================= */
    publishResults: async function (roundFbKey, roundId) {
        if (!currentUser || currentUser.role !== 'teacher') return alert('Vô quyền!');
        if (!confirm('Bạn đang chốt điểm vòng này.\nLưu ý: Nếu vòng này là vòng thứ 5 (đủ 1 mùa), hệ thống sẽ TỰ ĐỘNG CỘNG DỒN ĐIỂM 5 VÒNG để xếp hạng và phát thưởng. Tiếp tục?')) return;

        // --- BƯỚC 1: LẤY VÀ CHỐT ĐIỂM VÒNG HIỆN TẠI ---
        const subsSnap = await db.ref('hoihoa_submissions').orderByChild('roundId').equalTo(roundId).once('value');
        const submissions = [];
        subsSnap.forEach(childSnap => {
            let data = childSnap.val();
            data._fbKey = childSnap.key;
            submissions.push(data);
        });

        if (submissions.length === 0) return alert('Không có bài nộp nào để công bố.');

        let totalVotesInRound = 0;
        submissions.forEach(s => totalVotesInRound += (s.votes || 0));

        let updates = {};

        submissions.forEach(sub => {
            let tScore = sub.teacherScore || 0;
            let vScore = totalVotesInRound > 0 ? ((sub.votes || 0) / totalVotesInRound) * 10 : 0;
            sub.finalScore = (tScore * 0.7) + (vScore * 0.3);

            updates[`hoihoa_submissions/${sub._fbKey}/finalScore`] = sub.finalScore;

            // Bắn tin nhắn báo điểm lẻ của vòng này (Không kèm quà)
            let msgId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            updates[`inbox_messages/${sub.studentUsername}/${msgId}`] = {
                title: "🎨 Thông Báo Điểm Hội Họa",
                message: `Vòng thi vừa qua đã chốt điểm. Điểm của bạn là: ${sub.finalScore.toFixed(2)} (Điểm GV: ${tScore}đ | Vote: ${sub.votes || 0} phiếu).\nHãy tiếp tục tích lũy điểm để tranh giải Tổng Kết 5 Vòng nhé!`,
                time: Date.now(),
                timeString: new Date().toLocaleString('vi-VN'),
                read: false,
                giftType: 'none', giftValue: ''
            };
        });

        // Chốt trạng thái vòng hiện tại thành closed
        updates[`hoihoa_rounds/${roundFbKey}/status`] = 'closed';

        // --- BƯỚC 2: KIỂM TRA XEM ĐÃ ĐỦ 5 VÒNG CHƯA ---
        const allRoundsSnap = await db.ref('hoihoa_rounds').once('value');
        const allRounds = [];
        allRoundsSnap.forEach(child => {
            let r = child.val();
            r._fbKey = child.key;
            if (r.id === roundId) r.status = 'closed'; // Ghi đè trạng thái ảo cho vòng vừa đóng
            allRounds.push(r);
        });

        // Lọc ra các vòng đã đóng nhưng CHƯA ĐƯỢC TỔNG KẾT
        const unrewardedClosedRounds = allRounds.filter(r => r.status === 'closed' && !r.isSeasonRewarded);
        unrewardedClosedRounds.sort((a, b) => a.startTime - b.startTime);

        let isSeasonFinale = false;

        // NẾU ĐÃ ĐỦ 5 VÒNG -> KÍCH HOẠT THUẬT TOÁN TỔNG KẾT
        if (unrewardedClosedRounds.length === 5) {
            isSeasonFinale = true;
            const roundIdsToAggregate = unrewardedClosedRounds.map(r => r.id);

            const allSubsSnap = await db.ref('hoihoa_submissions').once('value');
            const aggregatedScores = {};

            allSubsSnap.forEach(child => {
                let sub = child.val();
                if (roundIdsToAggregate.includes(sub.roundId)) {
                    // Cập nhật lại điểm của vòng hiện tại do nó chưa được đẩy lên Firebase
                    let finalS = sub.finalScore || 0;
                    if (sub.roundId === roundId) {
                        const currentSub = submissions.find(s => s.id === sub.id);
                        if (currentSub) finalS = currentSub.finalScore;
                    }

                    if (!aggregatedScores[sub.studentUsername]) {
                        aggregatedScores[sub.studentUsername] = {
                            studentUsername: sub.studentUsername, studentName: sub.studentName, totalScore: 0
                        };
                    }
                    aggregatedScores[sub.studentUsername].totalScore += finalS;
                }
            });

            // Xếp hạng dựa trên Tổng điểm 5 Vòng
            const finalRankings = Object.values(aggregatedScores);
            finalRankings.sort((a, b) => b.totalScore - a.totalScore);

            const coinsSnap = await db.ref('student_coins').once('value');
            const currentCoins = coinsSnap.val() || {};

            for (let i = 0; i < finalRankings.length; i++) {
                let student = finalRankings[i];
                let rank = i + 1;
                let stdUsername = student.studentUsername;
                let stdCoin = currentCoins[stdUsername] || 0;

                let msgIdSeason = `msg_season_${Date.now()}_${Math.floor(Math.random() * 1000)}_${i}`;
                let inboxContent = "";

                // QUY ĐỊNH PHÁT THƯỞNG MỚI (CHỈ PHÁT Ở VÒNG 5)
                if (rank === 1) {
                    updates[`student_coins/${stdUsername}`] = stdCoin + 500;
                    updates[`student_inventory/${stdUsername}/chest_hh_ss_${roundId}`] = { id: 'chest_hoihoa', type: 'chest', name: 'Rương Kho Báu Hội Họa', icon: '🎁', isEquipped: false, purchaseTime: Date.now(), description: 'Nhận ngẫu nhiên vật phẩm hiếm hoặc Coin.' };
                    updates[`student_inventory/${stdUsername}/badge_1_ss_${roundId}`] = { id: 'badge_hoasi', type: 'badge', name: 'Huy hiệu: Họa sĩ tài năng', icon: '🥇', isEquipped: false, purchaseTime: Date.now(), description: 'Quán quân Chung cuộc 5 Vòng.' };
                    inboxContent = `🏆 TỔNG KẾT MÙA GIẢI HỘI HỌA 🏆\nChúc mừng! Tổng điểm 5 vòng của bạn là ${student.totalScore.toFixed(2)}. Bạn xuất sắc đạt HẠNG 1 CHUNG CUỘC.\nPhần thưởng gồm: 500 Coin, Huy hiệu "Họa sĩ tài năng" và 01 Rương Kho Báu (đã gửi vào Túi đồ).`;
                } else if (rank === 2) {
                    updates[`student_coins/${stdUsername}`] = stdCoin + 300;
                    let newDiscountRef = db.ref(`student_discounts/${stdUsername}`).push();
                    updates[`student_discounts/${stdUsername}/${newDiscountRef.key}`] = { percent: 30, isUsed: false, targetItem: ['all'], expiry: Date.now() + (30 * 24 * 60 * 60 * 1000) };
                    updates[`student_inventory/${stdUsername}/badge_2_ss_${roundId}`] = { id: 'badge_butve', type: 'badge', name: 'Huy hiệu: Bút vẽ vàng', icon: '🥈', isEquipped: false, purchaseTime: Date.now(), description: 'Á quân Chung cuộc 5 Vòng.' };
                    inboxContent = `🏆 TỔNG KẾT MÙA GIẢI HỘI HỌA 🏆\nTổng điểm 5 vòng của bạn là ${student.totalScore.toFixed(2)}. Bạn đạt HẠNG 2 CHUNG CUỘC.\nPhần thưởng gồm: 300 Coin, Thẻ giảm giá 30% và Huy hiệu "Bút vẽ vàng".`;
                } else if (rank === 3) {
                    updates[`student_coins/${stdUsername}`] = stdCoin + 200;
                    updates[`student_inventory/${stdUsername}/badge_3_ss_${roundId}`] = { id: 'badge_mausac', type: 'badge', name: 'Huy hiệu: Màu sắc rực rỡ', icon: '🥉', isEquipped: false, purchaseTime: Date.now(), description: 'Hạng 3 Chung cuộc 5 Vòng.' };
                    inboxContent = `🏆 TỔNG KẾT MÙA GIẢI HỘI HỌA 🏆\nTổng điểm 5 vòng của bạn là ${student.totalScore.toFixed(2)}. Bạn đạt HẠNG 3 CHUNG CUỘC.\nPhần thưởng gồm: 200 Coin và Huy hiệu "Màu sắc rực rỡ".`;
                } else if (rank >= 4 && rank <= 10) {
                    updates[`student_coins/${stdUsername}`] = stdCoin + 100;
                    inboxContent = `🏆 TỔNG KẾT MÙA GIẢI HỘI HỌA 🏆\nTổng điểm 5 vòng của bạn là ${student.totalScore.toFixed(2)}. Xếp hạng: ${rank}.\nPhần thưởng khích lệ: 100 Coin đã được cộng vào ví.`;
                } else {
                    inboxContent = `🏆 TỔNG KẾT MÙA GIẢI HỘI HỌA 🏆\nTổng điểm 5 vòng của bạn là ${student.totalScore.toFixed(2)}. Xếp hạng: ${rank}.\nCảm ơn bạn đã tham gia, hãy cố gắng ở mùa sau nhé!`;
                }

                updates[`inbox_messages/${stdUsername}/${msgIdSeason}`] = { title: "🏆 Kết Quả Tổng Kết Hội Họa", message: inboxContent, time: Date.now() + 1000, timeString: new Date().toLocaleString('vi-VN'), read: false, giftType: 'none', giftValue: '' };

                // Lưu bảng vàng tổng kết vào Firebase để hiển thị lên bảng xếp hạng
                updates[`season_rankings/${roundId}/${stdUsername}`] = { rank: rank, totalScore: student.totalScore, studentName: student.studentName };
            }

            // Đánh dấu cờ hiệu: 5 vòng này đã được tổng kết, không tính lại vào mùa sau
            unrewardedClosedRounds.forEach(r => { updates[`hoihoa_rounds/${r._fbKey}/isSeasonRewarded`] = true; });
        }

        try {
            await db.ref().update(updates);
            if (isSeasonFinale) alert('🎉 CHÚC MỪNG! Đã chốt điểm vòng và tự động TỔNG KẾT TRAO GIẢI CHO 5 VÒNG thành công!');
            else alert(`✅ Đã chốt điểm vòng này. (Hiện tại đã đóng ${unrewardedClosedRounds.length}/5 vòng. Cần đủ 5 vòng để hệ thống phát quà chung cuộc).`);
            this.loadTeacherRounds();
        } catch (error) {
            alert('❌ Có lỗi hệ thống khi cập nhật: ' + error.message);
        }
    },

    /* --- Cập nhật Giao diện hiển thị bảng xếp hạng của học sinh --- */
    renderLeaderboardArea: async function (container) {
        // 1. Kiểm tra xem vòng học sinh đang mở có phải là vòng Chung Cuộc không
        const seasonRankSnap = await db.ref(`season_rankings/${this.currentRound.id}`).once('value');
        const seasonRankData = seasonRankSnap.val();

        if (seasonRankData) {
            // NẾU LÀ VÒNG CHUNG CUỘC -> HIỂN THỊ BẢNG ĐIỂM TỔNG KẾT 5 VÒNG
            let rankings = Object.values(seasonRankData);
            rankings.sort((a, b) => a.rank - b.rank);

            let html = `
                <div style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); padding: 15px; border-radius: 12px; margin-bottom: 20px; color: white; text-align: center;">
                    <h3 style="margin: 0; font-size: 1.5em; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🏆 BẢNG XẾP HẠNG CHUNG CUỘC 5 VÒNG 🏆</h3>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">Phần thưởng đã được gửi trực tiếp vào Hộp thư & Túi đồ của các họa sĩ xuất sắc nhất.</p>
                </div>
                <table class="leaderboard-table">
                    <tr>
                        <th>Hạng Chung Cuộc</th>
                        <th>Tác giả</th>
                        <th>Tổng Điểm Tích Lũy</th>
                        <th>Phần Thưởng Mùa</th>
                    </tr>
            `;

            rankings.forEach(sub => {
                let rankClass = sub.rank === 1 ? 'rank-1' : (sub.rank === 2 ? 'rank-2' : (sub.rank === 3 ? 'rank-3' : ''));
                let rewardText = sub.rank === 1 ? '🎁 Rương Báu + 500🪙 + Huy Hiệu' :
                    (sub.rank === 2 ? '🏷️ Thẻ 30% + 300🪙 + Huy Hiệu' :
                        (sub.rank === 3 ? '200🪙 + Huy Hiệu' :
                            (sub.rank <= 10 ? '100🪙' : '-')));

                html += `
                    <tr>
                        <td class="${rankClass}">#${sub.rank}</td>
                        <td style="font-weight: bold; font-size: 1.1em;">${sub.studentName}</td>
                        <td style="color: #e11d48; font-weight: 900; font-size: 1.2em;">${(sub.totalScore || 0).toFixed(2)}</td>
                        <td style="color: #059669; font-size: 0.9em; font-weight: bold;">${rewardText}</td>
                    </tr>
                `;
            });
            html += '</table>';
            container.innerHTML = html;

        } else {
            // NẾU LÀ VÒNG LẺ (1,2,3,4) -> CHỈ HIỂN THỊ ĐIỂM VÒNG NÀY, KHÔNG CÓ QUÀ
            const subsSnap = await db.ref('hoihoa_submissions').orderByChild('roundId').equalTo(this.currentRound.id).once('value');
            let submissions = subsSnap.val() ? Object.values(subsSnap.val()) : [];

            if (submissions.length === 0) {
                container.innerHTML = '<p style="text-align:center;">Chưa có dữ liệu kết quả.</p>';
                return;
            }

            submissions.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

            let html = `
                <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 12px; margin-bottom: 20px; color: #2563eb; text-align: center; border: 1px dashed #3b82f6;">
                    <h3 style="margin: 0; font-size: 1.2em;">📊 BẢNG ĐIỂM VÒNG NÀY</h3>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">Điểm số sẽ được tích lũy. Khi đủ 5 vòng hệ thống mới công bố Xếp hạng Chung cuộc và phát thưởng.</p>
                </div>
                <table class="leaderboard-table">
                    <tr>
                        <th>Tác phẩm</th>
                        <th>Tác giả</th>
                        <th>Điểm GV (70%)</th>
                        <th>Điểm Vote (30%)</th>
                        <th>Điểm Vòng Này</th>
                    </tr>
            `;

            submissions.forEach(sub => {
                html += `
                    <tr>
                        <td><img src="${sub.imageBase64}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; cursor:pointer;" onclick="HoiHoaSystem.previewImage('${sub.imageBase64}')"></td>
                        <td style="font-weight: bold;">${sub.studentName}</td>
                        <td>${sub.teacherScore || 0}</td>
                        <td>${sub.votes || 0} phiếu</td>
                        <td style="color: #e11d48; font-weight: bold;">${(sub.finalScore || 0).toFixed(2)}</td>
                    </tr>
                `;
            });
            html += '</table>';
            container.innerHTML = html;
        }
    },
    // Đừng quên giữ nguyên dấu ngoặc đóng }; ở cuối file nếu bạn có
};

document.addEventListener('DOMContentLoaded', () => {
    HoiHoaSystem.init();
});