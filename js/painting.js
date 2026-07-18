/* ============================================================================
 * HỆ THỐNG SỰ KIỆN HỘI HỌA PRO v2.0
 * - Tương thích dữ liệu cũ: hoihoa_rounds, hoihoa_submissions, season_rankings
 * - Chỉ mở rộng mô-đun hội họa, không sửa student.js / teacher.js
 * ========================================================================== */
(function () {
    'use strict';

    const DEFAULTS = Object.freeze({
        canvasWidth: 1400,
        canvasHeight: 900,
        backgroundColor: '#ffffff',
        maxVotes: 3,
        teacherWeight: 70,
        voteWeight: 30,
        anonymousVoting: true,
        historyLimit: 30,
        autosaveMs: 8000,
        recentRounds: 8,
        maxImageBytes: 9 * 1024 * 1024
    });

    const TOOL_LABELS = Object.freeze({
        select: 'Chọn / Di chuyển',
        brush: 'Bút mềm',
        pencil: 'Bút chì',
        ink: 'Bút mực',
        watercolor: 'Màu nước',
        marker: 'Bút dạ',
        neon: 'Bút neon',
        pixel: 'Bút pixel',
        spray: 'Bình xịt',
        eraser: 'Tẩy',
        line: 'Đường thẳng',
        arrow: 'Mũi tên',
        rect: 'Hình chữ nhật',
        ellipse: 'Hình elip',
        star: 'Ngôi sao',
        text: 'Chèn chữ',
        fill: 'Đổ màu',
        picker: 'Hút màu'
    });

    const COLOR_PALETTE = [
        '#111827', '#475569', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
        '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
        '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#92400e', '#f5d0a9'
    ];

    const HoiHoaSystem = {
        version: '3.0.0',
        canvas: null,
        ctx: null,
        previewCanvas: null,
        previewCtx: null,
        objectCanvas: null,
        objectCtx: null,

        objects: [],
        selectedObjectId: null,

        isDraggingObject: false,
        objectDragStart: null,
        objectDragOriginal: null,

        objectImageCache: new Map(),
        canvasStage: null,
        canvasScroll: null,
        currentRound: null,
        availableRounds: [],
        teacherRounds: [],
        currentTool: 'brush',
        currentColor: '#111827',
        currentSize: 12,
        currentOpacity: 1,
        fillTolerance: 24,
        shapeMode: 'stroke',
        currentFontFamily: 'Arial, sans-serif',

        imageAdjustments: {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            temperature: 0,
            grayscale: 0,
            blur: 0
        },
        mirrorX: false,
        mirrorY: false,
        gridEnabled: false,
        zoom: 1,
        isDrawing: false,
        activePointerId: null,
        startPoint: null,
        lastPoint: null,
        hasDrawnContent: false,
        history: [],
        historyStep: -1,
        draftInterval: null,
        countdownInterval: null,
        myVotesCount: 0,
        isDirty: false,
        isSubmitting: false,
        editingRoundKey: null,
        teacherShowArchived: false,
        initialized: false,
        globalEventsBound: false,
        activeStudentModal: false,
        activeTeacherRoundId: null,

        studioMode: 'contest',
        lastContestRoundId: null,

        get user() {
            try {
                return (typeof currentUser !== 'undefined' && currentUser) ||
                    JSON.parse(localStorage.getItem('currentUser') || 'null');
            } catch (_) {
                return null;
            }
        },

        get isTeacher() {
            return !!this.user && this.user.role === 'teacher';
        },

        get isStudent() {
            return !!this.user && this.user.role === 'student';
        },

        async init() {
            if (this.initialized) return;
            if (!this.user || typeof db === 'undefined') {
                setTimeout(() => this.init(), 700);
                return;
            }

            this.initialized = true;
            this.injectSharedModals();
            this.bindGlobalEvents();

            if (this.isStudent) this.initStudent();
            if (this.isTeacher) this.initTeacher();
        },

        injectSharedModals() {
            if (!document.getElementById('artworkPreviewModal')) {
                document.body.insertAdjacentHTML('beforeend', `
                    <div id="artworkPreviewModal" class="modal-overlay hh-preview-overlay" aria-hidden="true">
                        <div class="hh-preview-shell" role="dialog" aria-modal="true" aria-label="Xem tác phẩm">
                            <button type="button" class="hh-icon-btn hh-preview-close" data-hh-action="close-preview" aria-label="Đóng">✕</button>
                            <img id="artworkPreviewImg" alt="Tác phẩm hội họa phóng to">
                        </div>
                    </div>
                `);
            }

            if (!document.getElementById('hhConfirmModal')) {
                document.body.insertAdjacentHTML('beforeend', `
                    <div id="hhConfirmModal" class="modal-overlay hh-confirm-overlay" aria-hidden="true">
                        <div class="hh-dialog" role="dialog" aria-modal="true">
                            <h3 id="hhConfirmTitle">Xác nhận</h3>
                            <p id="hhConfirmMessage"></p>
                            <div class="hh-dialog-actions">
                                <button type="button" class="hh-btn hh-btn-ghost" data-hh-action="confirm-cancel">Hủy</button>
                                <button type="button" class="hh-btn hh-btn-danger" id="hhConfirmAccept">Xác nhận</button>
                            </div>
                        </div>
                    </div>
                `);
            }

            if (!document.getElementById('hhEventInfoModal')) {
                document.body.insertAdjacentHTML('beforeend', `
        <div
            id="hhEventInfoModal"
            class="hh-event-info-overlay"
            aria-hidden="true">

            <section
                class="hh-event-info-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hhEventInfoTitle">

                <button
                    type="button"
                    class="hh-event-info-close"
                    data-hh-action="close-event-info"
                    aria-label="Đóng">
                    ✕
                </button>

                <header class="hh-event-info-header">
                    <div class="hh-event-info-icon">🎨</div>

                    <div>
                        <span class="hh-eyebrow">
                            SỰ KIỆN HỘI HỌA
                        </span>

                        <h2 id="hhEventInfoTitle">
                            Quy tắc và phần thưởng
                        </h2>

                        <p>
                            Đọc kỹ trước khi tham gia sáng tác,
                            bình chọn và nhận thưởng.
                        </p>
                    </div>
                </header>

                <div class="hh-event-info-content">
                    <section class="hh-event-info-section">
                        <h3>📜 Quy tắc sự kiện</h3>

                        <div class="hh-rule-list">
                            <article class="hh-rule-item">
                                <strong>1. Sáng tác</strong>
                                <p>
                                    Tác phẩm phải được vẽ trực tiếp
                                    trong Studio Hội Họa.
                                </p>
                            </article>

                            <article class="hh-rule-item">
                                <strong>2. Nộp bài</strong>
                                <p>
                                    Mỗi học sinh chỉ được nộp một
                                    tác phẩm trong mỗi vòng.
                                </p>
                            </article>

                            <article class="hh-rule-item">
                                <strong>3. Khóa bài</strong>
                                <p>
                                    Sau khi nộp, tác phẩm sẽ bị khóa.
                                    Học sinh chỉ có thể nộp lại khi
                                    giáo viên xóa bài cũ.
                                </p>
                            </article>

                            <article class="hh-rule-item">
                                <strong>4. Bình chọn</strong>
                                <p>
                                    Không được bình chọn cho bài của
                                    chính mình. Mỗi tài khoản được
                                    chọn tối đa
                                    <b id="hh-info-max-votes">3</b>
                                    tác phẩm.
                                </p>
                            </article>

                            <article class="hh-rule-item">
                                <strong>5. Tính điểm vòng</strong>
                                <p>
                                    Điểm giáo viên chiếm
                                    <b id="hh-info-teacher-weight">
                                        70%
                                    </b>,
                                    bình chọn chiếm
                                    <b id="hh-info-vote-weight">
                                        30%
                                    </b>.
                                </p>
                            </article>

                            <article class="hh-rule-item">
                                <strong>6. Tổng kết mùa</strong>
                                <p>
                                    Điểm được tích lũy qua 5 vòng.
                                    Sau khi đủ 5 vòng đã công bố,
                                    hệ thống tự tổng kết mùa giải.
                                </p>
                            </article>
                        </div>
                    </section>

                    <section class="hh-event-info-section">
                        <h3>🏆 Phần thưởng mùa giải</h3>

                        <div class="hh-reward-list">
                            <article class="hh-reward-item rank-one">
                                <div class="hh-reward-rank hh-reward-rank-badge">
    ${this.badgeEmblem('talent')}
</div>

                                <div>
                                    <strong>
                                        Hạng 1 – Quán quân
                                    </strong>

                                    <p>
                                        500 Coin, huy hiệu
                                        <b class="hh-badge-name hh-badge-name-talent">
    “Họa sĩ tài năng”
</b> và
                                        1 Rương Kho Báu Hội Họa.
                                    </p>
                                </div>
                            </article>

                            <div class="hh-chest-details">
                                <strong>
                                    🎁 Rương Kho Báu Hội Họa
                                </strong>

                                <p>
                                    <b>1%</b> nhận một vật phẩm có
                                    tag Hội Họa ngẫu nhiên.
                                </p>

                                <p>
                                    Nếu đã sở hữu vật phẩm trúng được,
                                    học sinh nhận bù
                                    <b>200 Coin</b>.
                                </p>

                                <p>
    <b>8%</b> nhận thẻ giảm giá
    ngẫu nhiên từ 10–35%, dùng 1 lần
    và có hạn 30 ngày kể từ lúc mở rương.
    Thẻ chỉ dùng cho vật phẩm bán bằng Coin
    có giá dưới 700 Coin; không dùng cho
    vật phẩm sự kiện, tag Doraemon và
    tag Truyền thuyết,...
</p>

                                <p>
                                    <b>91%</b> nhận ngẫu nhiên
                                    từ 100–700 Coin.
                                </p>
                            </div>

                            <article class="hh-reward-item rank-two">
                                <div class="hh-reward-rank hh-reward-rank-badge">
    ${this.badgeEmblem('golden-brush')}
</div>

                                <div>
                                    <strong>
                                        Hạng 2 – Á quân
                                    </strong>

                                    <p>
                                        300 Coin, huy hiệu
<b class="hh-badge-name hh-badge-name-golden-brush">
    “Bút vẽ vàng”
</b> và thẻ giảm giá 20%, dùng 1 lần,
có hạn 30 ngày. Thẻ chỉ dùng cho
vật phẩm bán bằng Coin có giá dưới
600 Coin; không dùng cho vật phẩm
sự kiện, tag Doraemon và tag
Truyền thuyết.
                                    </p>
                                </div>
                            </article>

                            <article class="hh-reward-item rank-three">
                                <div class="hh-reward-rank hh-reward-rank-badge">
    ${this.badgeEmblem('vibrant-color')}
</div>

                                <div>
                                    <strong>Hạng 3</strong>

                                    <p>
                                        200 Coin và huy hiệu
                                        <b class="hh-badge-name hh-badge-name-vibrant-color">
    “Màu sắc rực rỡ”
</b>.
                                    </p>
                                </div>
                            </article>

                            <article class="hh-reward-item">
                                <div class="hh-reward-rank">⭐</div>

                                <div>
                                    <strong>Hạng 4–10</strong>
                                    <p>Mỗi học sinh nhận 100 Coin.</p>
                                </div>
                            </article>

                            <article class="hh-reward-item">
                                <div class="hh-reward-rank">🎨</div>

                                <div>
                                    <strong>Ngoài Top 10</strong>

                                    <p>
                                        Không nhận Coin, chỉ ghi nhận
                                        thứ hạng và thành tích tham gia.
                                    </p>
                                </div>
                            </article>
                        </div>
                    </section>
                </div>

                <footer class="hh-event-info-footer">
                    <button
                        type="button"
                        class="hh-event-info-understood"
                        data-hh-action="close-event-info">
                        Đã hiểu
                    </button>
                </footer>
            </section>
        </div>
    `);
            }

            const eventInfoModal =
                document.getElementById('hhEventInfoModal');

            if (
                eventInfoModal &&
                !eventInfoModal.dataset.backdropBound
            ) {
                eventInfoModal.dataset.backdropBound = 'true';

                eventInfoModal.addEventListener('click', event => {
                    if (event.target === eventInfoModal) {
                        this.closeEventInfo();
                    }
                });
            }
        },

        badgeEmblem(type) {
            const badges = {
                talent: `
            <span
                class="hh-award-badge hh-award-badge-talent"
                role="img"
                aria-label="Huy hiệu Họa sĩ tài năng">

                <svg
                    viewBox="0 0 88 100"
                    aria-hidden="true"
                    focusable="false">

                    <defs>
                        <linearGradient
                            id="hhTalentGold"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1">

                            <stop
                                offset="0"
                                stop-color="#fff3a6"/>

                            <stop
                                offset="0.42"
                                stop-color="#fbbf24"/>

                            <stop
                                offset="1"
                                stop-color="#b45309"/>
                        </linearGradient>

                        <linearGradient
                            id="hhTalentCore"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1">

                            <stop
                                offset="0"
                                stop-color="#7c3aed"/>

                            <stop
                                offset="1"
                                stop-color="#db2777"/>
                        </linearGradient>

                        <filter
                            id="hhTalentShadow"
                            x="-30%"
                            y="-30%"
                            width="160%"
                            height="180%">

                            <feDropShadow
                                dx="0"
                                dy="5"
                                stdDeviation="4"
                                flood-color="#6b21a8"
                                flood-opacity=".28"/>
                        </filter>
                    </defs>

                    <path
                        d="M23 68 17 97l17-9 10 12 4-31z"
                        fill="#7c3aed"/>

                    <path
                        d="m65 68 6 29-17-9-10 12-4-31z"
                        fill="#db2777"/>

                    <circle
                        cx="44"
                        cy="42"
                        r="34"
                        fill="url(#hhTalentGold)"
                        filter="url(#hhTalentShadow)"/>

                    <circle
                        cx="44"
                        cy="42"
                        r="27"
                        fill="#fff7d6"
                        stroke="#fff"
                        stroke-width="2"/>

                    <circle
                        cx="44"
                        cy="42"
                        r="22"
                        fill="url(#hhTalentCore)"/>

                    <path
                        d="M32 47c0-10 7-18 16-18 7 0 13 5 13 11 0 4-3 7-7 7h-4c-2 0-3 2-2 4l1 2c1 3-1 6-4 6-8 0-13-5-13-12Z"
                        fill="#fff"
                        opacity=".96"/>

                    <circle cx="40" cy="35" r="2.4" fill="#fbbf24"/>
                    <circle cx="47" cy="34" r="2.4" fill="#38bdf8"/>
                    <circle cx="53" cy="39" r="2.4" fill="#fb7185"/>
                    <circle cx="38" cy="43" r="2.4" fill="#34d399"/>

                    <path
                        d="m65 17 2.1 4.8L72 24l-4.9 2.1L65 31l-2.1-4.9L58 24l4.9-2.2Z"
                        fill="#fff"/>
                </svg>
            </span>
        `,

                'golden-brush': `
            <span
                class="hh-award-badge hh-award-badge-golden-brush"
                role="img"
                aria-label="Huy hiệu Bút vẽ vàng">

                <svg
                    viewBox="0 0 88 100"
                    aria-hidden="true"
                    focusable="false">

                    <defs>
                        <linearGradient
                            id="hhBrushGold"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1">

                            <stop
                                offset="0"
                                stop-color="#fff7b2"/>

                            <stop
                                offset="0.5"
                                stop-color="#f59e0b"/>

                            <stop
                                offset="1"
                                stop-color="#92400e"/>
                        </linearGradient>

                        <linearGradient
                            id="hhBrushBlue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1">

                            <stop
                                offset="0"
                                stop-color="#2563eb"/>

                            <stop
                                offset="1"
                                stop-color="#172554"/>
                        </linearGradient>
                    </defs>

                    <path
                        d="M25 68 19 97l17-9 8 11 4-30z"
                        fill="#1d4ed8"/>

                    <path
                        d="m63 68 6 29-17-9-8 11-4-30z"
                        fill="#0f172a"/>

                    <path
                        d="M44 7 75 21v25c0 22-13 36-31 43-18-7-31-21-31-43V21Z"
                        fill="url(#hhBrushGold)"/>

                    <path
                        d="M44 14 68 25v20c0 17-9 29-24 36-15-7-24-19-24-36V25Z"
                        fill="url(#hhBrushBlue)"
                        stroke="#fff4b0"
                        stroke-width="2"/>

                    <path
                        d="m30 26 5 2 4-5 5 5 5-5 4 5 5-2-2 10H32Z"
                        fill="#fcd34d"/>

                    <g transform="rotate(-38 45 52)">
                        <rect
                            x="41"
                            y="34"
                            width="8"
                            height="31"
                            rx="4"
                            fill="#fbbf24"/>

                        <rect
                            x="42.5"
                            y="38"
                            width="2"
                            height="24"
                            rx="1"
                            fill="#fff2a8"
                            opacity=".8"/>

                        <path
                            d="M41 64h8l-1.2 9-2.8 5-2.8-5Z"
                            fill="#f8fafc"/>

                        <path
                            d="M42.2 72.5h5.6L45 78Z"
                            fill="#f97316"/>
                    </g>
                </svg>
            </span>
        `,

                'vibrant-color': `
            <span
                class="hh-award-badge hh-award-badge-vibrant-color"
                role="img"
                aria-label="Huy hiệu Màu sắc rực rỡ">

                <svg
                    viewBox="0 0 88 100"
                    aria-hidden="true"
                    focusable="false">

                    <defs>
                        <linearGradient
                            id="hhColorRing"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1">

                            <stop offset="0" stop-color="#fb7185"/>
                            <stop offset="0.25" stop-color="#f59e0b"/>
                            <stop offset="0.5" stop-color="#22c55e"/>
                            <stop offset="0.75" stop-color="#38bdf8"/>
                            <stop offset="1" stop-color="#a855f7"/>
                        </linearGradient>

                        <radialGradient
                            id="hhColorCore"
                            cx="35%"
                            cy="28%"
                            r="75%">

                            <stop offset="0" stop-color="#ffffff"/>
                            <stop offset="0.17" stop-color="#d8b4fe"/>
                            <stop offset="0.58" stop-color="#7c3aed"/>
                            <stop offset="1" stop-color="#312e81"/>
                        </radialGradient>
                    </defs>

                    <path
                        d="M23 68 17 97l17-9 10 12 4-31z"
                        fill="#ec4899"/>

                    <path
                        d="m65 68 6 29-17-9-10 12-4-31z"
                        fill="#06b6d4"/>

                    <circle
                        cx="44"
                        cy="42"
                        r="34"
                        fill="url(#hhColorRing)"/>

                    <circle
                        cx="44"
                        cy="42"
                        r="27"
                        fill="#fff"
                        opacity=".92"/>

                    <circle
                        cx="44"
                        cy="42"
                        r="23"
                        fill="url(#hhColorCore)"/>

                    <path
                        d="M27 48a20 20 0 0 1 34-14"
                        fill="none"
                        stroke="#fb7185"
                        stroke-width="4"
                        stroke-linecap="round"/>

                    <path
                        d="M30 52a16 16 0 0 1 28-15"
                        fill="none"
                        stroke="#fbbf24"
                        stroke-width="4"
                        stroke-linecap="round"/>

                    <path
                        d="M34 55a12 12 0 0 1 21-14"
                        fill="none"
                        stroke="#34d399"
                        stroke-width="4"
                        stroke-linecap="round"/>

                    <path
                        d="m58 50 2.3 5.2L66 58l-5.7 2.3L58 66l-2.3-5.7L50 58l5.7-2.8Z"
                        fill="#fff"/>

                    <circle cx="30" cy="35" r="2.5" fill="#38bdf8"/>
                    <circle cx="52" cy="29" r="2.1" fill="#f9a8d4"/>
                </svg>
            </span>
        `
            };

            return badges[type] || badges.talent;
        },

        bindGlobalEvents() {
            if (this.globalEventsBound) return;
            this.globalEventsBound = true;

            document.addEventListener('click', (event) => {
                const el = event.target.closest('[data-hh-action]');
                if (!el) return;
                const action = el.dataset.hhAction;
                this.dispatchAction(action, el, event);
            });

            document.addEventListener('input', (event) => {
                const target = event.target;
                if (!target || !target.dataset) return;
                const setting = target.dataset.hhSetting;
                if (!setting) return;
                this.applySetting(setting, target.value, target);
            });

            document.addEventListener('change', event => {
                const target = event.target;

                if (!target) return;

                /*
                 * File ảnh chỉ dùng trong chế độ Luyện tập.
                 */
                if (
                    target.id ===
                    'hh-practice-image-input'
                ) {
                    const file =
                        target.files?.[0] || null;

                    this.handlePracticeImageUpload(file);
                    return;
                }

                if (!target.dataset) return;

                if (target.dataset.hhSetting) {
                    this.applySetting(
                        target.dataset.hhSetting,
                        target.value,
                        target
                    );
                }
            });

            document.addEventListener('keydown', (event) => this.handleKeyboard(event));

            window.addEventListener('beforeunload', (event) => {
                if (this.activeStudentModal && this.isDirty && !this.isSubmitting) {
                    event.preventDefault();
                    event.returnValue = '';
                }
            });
        },

        dispatchAction(action, el, event) {
            const map = {
                'toggle-studio-menu': () =>
                    this.toggleStudioMenu(),

                'open-contest-studio': () =>
                    this.openStudentModal('contest'),

                'open-practice-studio': () =>
                    this.openStudentModal('practice'),

                'close-student': () =>
                    this.closeStudentModal(),

                'open-event-info': () => this.openEventInfo(),
                'close-event-info': () => this.closeEventInfo(),

                'select-round': () =>
                    this.selectRound(el.dataset.roundId),
                'tool': () => this.setTool(el.dataset.tool),
                'undo': () => this.undo(),
                'redo': () => this.redo(),
                'clear': () =>
                    this.clearCanvas(true),

                'upload-practice-image': () =>
                    this.triggerPracticeImageUpload(),

                'download': () =>
                    this.downloadBackup(),

                'submit': () =>
                    this.submitArtwork(),
                'zoom-in': () => this.setZoom(this.zoom + 0.1),
                'zoom-out': () => this.setZoom(this.zoom - 0.1),
                'zoom-fit': () => this.setZoom(1),
                'toggle-grid': () => this.toggleGrid(),
                'toggle-mirror-x': () => this.toggleMirror('x'),
                'toggle-mirror-y': () => this.toggleMirror('y'),
                'fullscreen': () => this.toggleFullscreen(),
                'toggle-adjustments': () => this.toggleAdjustmentPanel(),
                'apply-adjustments': () => this.applyImageAdjustments(),
                'reset-adjustments': () => this.resetImageAdjustments(),
                'palette': () => this.setColor(el.dataset.color),
                'vote': () => this.voteArtwork(el.dataset.submissionId),
                'preview': () => this.previewImage(el.dataset.image || el.currentSrc || el.src || el.querySelector('img')?.currentSrc || el.querySelector('img')?.src),
                'close-preview': () => this.closePreview(),
                'teacher-toggle': () => this.toggleTeacherPanel(),
                'save-round': () => this.saveRoundForm(),
                'cancel-edit-round': () => this.cancelEditRound(),
                'edit-round': () => this.editRound(el.dataset.roundKey),
                'duplicate-round': () => this.duplicateRound(el.dataset.roundKey),
                'archive-round': () =>
                    this.archiveRound(el.dataset.roundKey),

                'delete-round': () =>
                    this.deleteRound(
                        el.dataset.roundKey,
                        el.dataset.roundId
                    ),

                'toggle-archived': () =>
                    this.toggleArchivedRounds(),
                'round-status': () => this.changeRoundStatus(el.dataset.roundKey, el.dataset.status),
                'grade-round': () => this.loadSubmissionsForGrading(el.dataset.roundId),
                'save-grade': () => this.saveSingleGrade(
                    el.dataset.submissionKey,
                    el.dataset.submissionId
                ),
                'delete-submission': () => this.deleteSubmission(
                    el.dataset.submissionKey,
                    el.dataset.roundId
                ),
                'save-all-grades': () => this.saveAllGrades(el.dataset.roundId),
                'publish-results': () => this.publishResults(el.dataset.roundKey, el.dataset.roundId),
                'confirm-cancel': () => this.resolveConfirm(false)
            };
            if (map[action]) {
                event.preventDefault();
                map[action]();
            }
        },

        applySetting(setting, value, target) {
            if (setting === 'color') this.setColor(value);
            if (setting === 'size') {
                this.currentSize = this.clamp(Number(value), 1, 120);
                const output = document.getElementById('hh-size-output');
                if (output) output.textContent = `${Math.round(this.currentSize)} px`;
            }
            if (setting === 'opacity') {
                this.currentOpacity = this.clamp(Number(value) / 100, 0.05, 1);
                const output = document.getElementById('hh-opacity-output');
                if (output) output.textContent = `${Math.round(this.currentOpacity * 100)}%`;
            }
            if (setting === 'tolerance') {
                this.fillTolerance = this.clamp(Number(value), 0, 100);
                const output = document.getElementById('hh-tolerance-output');
                if (output) output.textContent = `${Math.round(this.fillTolerance)}`;
            }
            if (setting === 'shape-mode') this.shapeMode = value === 'fill' ? 'fill' : 'stroke';
            if (setting === 'font-family') {
                this.currentFontFamily = value || 'Arial, sans-serif';
            }

            if (setting.startsWith('adjust-')) {
                const key = setting.replace('adjust-', '');

                if (
                    Object.prototype.hasOwnProperty.call(
                        this.imageAdjustments,
                        key
                    )
                ) {
                    this.imageAdjustments[key] = Number(value) || 0;

                    const output = document.getElementById(
                        `hh-adjust-${key}-output`
                    );

                    if (output) {
                        output.textContent =
                            key === 'blur'
                                ? `${this.imageAdjustments[key]} px`
                                : `${this.imageAdjustments[key]}%`;
                    }

                    this.previewImageAdjustments();
                }
            }
            if (setting === 'grade-search') this.filterGradingCards(target.value);
            if (setting === 'grade-sort') this.sortGradingCards(target.value);
        },

        /* ============================= TIỆN ÍCH ============================= */
        clamp(value, min, max) {
            return Math.min(max, Math.max(min, value));
        },

        escapeHTML(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        getTeacherIdentity() {
            let authUid = '';

            try {
                authUid =
                    firebase.auth().currentUser?.uid || '';
            } catch (_) {
                authUid = '';
            }

            return String(
                this.user?.username ||
                this.user?.name ||
                authUid ||
                'teacher'
            );
        },

        safeDataImage(value) {
            const image = String(value || '');
            return /^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=\s]+$/i.test(image) ? image : '';
        },

        getRoundConfig(round) {
            const r = round || {};
            const teacherWeight = this.clamp(Number(r.teacherWeight ?? DEFAULTS.teacherWeight), 0, 100);
            const voteWeight = this.clamp(Number(r.voteWeight ?? DEFAULTS.voteWeight), 0, 100);
            const totalWeight = teacherWeight + voteWeight || 100;
            return {
                canvasWidth: this.clamp(Number(r.canvasWidth || DEFAULTS.canvasWidth), 600, 2400),
                canvasHeight: this.clamp(Number(r.canvasHeight || DEFAULTS.canvasHeight), 400, 1800),
                backgroundColor: /^#[0-9a-f]{6}$/i.test(r.backgroundColor || '') ? r.backgroundColor : DEFAULTS.backgroundColor,
                maxVotes: this.clamp(Number(r.maxVotes ?? DEFAULTS.maxVotes), 1, 10),
                teacherWeight: teacherWeight / totalWeight,
                voteWeight: voteWeight / totalWeight,
                anonymousVoting: r.anonymousVoting !== false,
                historyLimit: this.clamp(Number(r.historyLimit || DEFAULTS.historyLimit), 10, 60),
                voteScoringMode: r.voteScoringMode || (r.schemaVersion >= 2 ? 'top' : 'share')
            };
        },

        getEffectiveStatus(round) {
            if (!round) return 'closed';
            if (round.status === 'closed') return 'closed';
            if (round.status === 'voting') return 'voting';
            const now = Date.now();
            if (Number(round.startTime) > now) return 'scheduled';
            if (Number(round.endTime) < now && (round.status === 'active' || round.status === 'scheduled')) return 'awaiting_voting';
            if (round.status === 'scheduled') return 'active';
            return round.status || 'active';
        },

        formatDateTime(timestamp) {
            if (!timestamp) return 'Không xác định';
            return new Date(Number(timestamp)).toLocaleString('vi-VN', {
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
            });
        },

        formatDuration(ms) {
            if (ms <= 0) return '00:00:00';
            const totalSeconds = Math.floor(ms / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const hms = [hours, minutes, seconds].map(v => String(v).padStart(2, '0')).join(':');
            return days > 0 ? `${days} ngày ${hms}` : hms;
        },

        async confirmDialog(message, title = 'Xác nhận', danger = true) {
            const modal = document.getElementById('hhConfirmModal');
            const titleEl = document.getElementById('hhConfirmTitle');
            const messageEl = document.getElementById('hhConfirmMessage');
            const accept = document.getElementById('hhConfirmAccept');
            if (!modal || !titleEl || !messageEl || !accept) return window.confirm(message);

            titleEl.textContent = title;
            messageEl.textContent = message;
            accept.className = `hh-btn ${danger ? 'hh-btn-danger' : 'hh-btn-primary'}`;
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');

            return new Promise((resolve) => {
                this.confirmResolver = resolve;
                accept.onclick = () => this.resolveConfirm(true);
            });
        },

        resolveConfirm(value) {
            const modal = document.getElementById('hhConfirmModal');
            if (modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
            }
            if (this.confirmResolver) {
                const resolve = this.confirmResolver;
                this.confirmResolver = null;
                resolve(value);
            }
        },

        toast(message, type = 'info') {
            if (typeof window.showToast === 'function') {
                window.showToast(message, type === 'info' ? 'warning' : type);
                return;
            }
            let container = document.getElementById('hh-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'hh-toast-container';
                container.className = 'hh-toast-container';
                document.body.appendChild(container);
            }
            const toast = document.createElement('div');
            toast.className = `hh-toast hh-toast-${type}`;
            toast.textContent = message;
            container.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('show'));
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 250);
            }, 3500);
        },

        /* ============================ HỌC SINH ============================== */
        initStudent() {
            const gameContainer = document.getElementById('gameActiveView');
            if (!gameContainer || document.getElementById('hh-student-entry-card')) return;

            gameContainer.insertAdjacentHTML('beforeend', `
                <section id="hh-student-entry-card" class="card hh-entry-card">
                    <div class="hh-entry-art" aria-hidden="true">
                        <span>✦</span><span>🎨</span><span>✦</span>
                    </div>
                    <div class="hh-entry-copy">
    <span class="hh-eyebrow">ART EVENT</span>

    <div class="hh-entry-title-row">
        <h3>Studio Hội Họa</h3>

        <button
            type="button"
            class="hh-entry-info-button"
            data-hh-action="open-event-info"
            title="Xem quy tắc và phần thưởng"
            aria-label="Xem quy tắc và phần thưởng">
            ?
        </button>
    </div>

    <p>
        Vẽ bằng bộ công cụ nâng cao, lưu nháp tự động,
        triển lãm và bình chọn tác phẩm.
    </p>
</div>
                    <div class="hh-entry-actions">
    <div
        id="hh-entry-mode-menu"
        class="hh-entry-mode-menu"
        aria-hidden="true">

        <button
            type="button"
            class="hh-entry-mode-choice hh-entry-contest-choice"
            data-hh-action="open-contest-studio">

            <span class="hh-entry-choice-icon">🏆</span>

            <span>
                <strong>Thi</strong>
<small>Tham gia vòng thi · Miễn phí</small>
            </span>
        </button>

        <button
            type="button"
            class="hh-entry-mode-choice hh-entry-practice-choice"
            data-hh-action="open-practice-studio">

            <span class="hh-entry-choice-icon">🖌️</span>

            <span>
                <strong>Luyện tập</strong>
<small>Vẽ tự do · 25 Coin/lần</small>
            </span>
        </button>
    </div>

    <button
        type="button"
        id="hh-entry-open-button"
        class="hh-btn hh-btn-primary hh-entry-button"
        data-hh-action="toggle-studio-menu"
        aria-expanded="false">

        Mở studio

        <span class="hh-entry-open-arrow">
            ↑
        </span>
    </button>
</div>
                </section>
            `);

            if (!document.getElementById('hoihoaStudentModal')) {
                document.body.insertAdjacentHTML('beforeend', `
                    <div id="hoihoaStudentModal" class="modal-overlay hh-student-overlay" aria-hidden="true">
                        <div class="modal-content hoihoa-container hh-studio-modal" role="dialog" aria-modal="true" aria-label="Studio Hội Họa">
                            <button type="button" class="hh-icon-btn hh-modal-close" data-hh-action="close-student" aria-label="Đóng">✕</button>
                            <header class="hoihoa-header hh-studio-header">
                                <div class="hh-round-heading">
    <span class="hh-eyebrow">STUDIO HỘI HỌA</span>
    <h2 id="hh-round-title">Đang tải...</h2>
    <p id="hh-round-topic"></p>
</div>
                                <div class="hh-round-meta">
                                    <span id="hh-round-status" class="hh-status-pill">Đang tải</span>
                                    <p id="hh-round-time"></p>
                                    <p id="hh-round-countdown" class="hh-countdown"></p>
                                </div>
                            </header>

<nav
    id="hh-round-tabs"
    class="hh-round-tabs"
    aria-label="Danh sách vòng thi">
</nav>

<main
    id="hh-student-content"
    class="hh-student-content">
</main>
                        </div>
                    </div>
                `);
            }
        },

        toggleStudioMenu(forceState) {
            const menu =
                document.getElementById(
                    'hh-entry-mode-menu'
                );

            const button =
                document.getElementById(
                    'hh-entry-open-button'
                );

            if (!menu || !button) return;

            const shouldOpen =
                typeof forceState === 'boolean'
                    ? forceState
                    : !menu.classList.contains('open');

            menu.classList.toggle(
                'open',
                shouldOpen
            );

            button.classList.toggle(
                'menu-open',
                shouldOpen
            );

            menu.setAttribute(
                'aria-hidden',
                shouldOpen ? 'false' : 'true'
            );

            button.setAttribute(
                'aria-expanded',
                shouldOpen ? 'true' : 'false'
            );
        },

        async openStudentModal(
            mode = 'contest'
        ) {
            const modal =
                document.getElementById(
                    'hoihoaStudentModal'
                );

            const content =
                document.getElementById(
                    'hh-student-content'
                );

            const tabs =
                document.getElementById(
                    'hh-round-tabs'
                );

            if (!modal || !content || !tabs) {
                return;
            }

            const nextMode =
                mode === 'practice'
                    ? 'practice'
                    : 'contest';

            /*
             * Chế độ Thi hoàn toàn miễn phí.
             * Chỉ Luyện tập mới mất 25 Coin.
             */
            const PRACTICE_ENTRY_FEE = 25;

            let practiceCoinRef = null;
            let practiceFeePaid = false;

            if (nextMode === 'practice') {
                if (
                    !this.user ||
                    !this.user.username
                ) {
                    this.toast(
                        'Không xác định được tài khoản học sinh.',
                        'error'
                    );

                    return;
                }

                practiceCoinRef = db.ref(
                    `student_coins/${this.user.username}`
                );

                let currentCoins = 0;

                try {
                    const feeTransaction =
                        await practiceCoinRef.transaction(
                            currentValue => {
                                currentCoins =
                                    Number(currentValue) || 0;

                                if (
                                    currentCoins <
                                    PRACTICE_ENTRY_FEE
                                ) {
                                    return;
                                }

                                return (
                                    currentCoins -
                                    PRACTICE_ENTRY_FEE
                                );
                            }
                        );

                    if (!feeTransaction.committed) {
                        this.toast(
                            `Bạn cần ${PRACTICE_ENTRY_FEE} Coin ` +
                            `để vào Luyện tập. ` +
                            `Số dư hiện tại: ${currentCoins} Coin.`,
                            'warning'
                        );

                        return;
                    }

                    practiceFeePaid = true;
                } catch (error) {
                    console.error(
                        'Lỗi thanh toán phí Luyện tập:',
                        error
                    );

                    this.toast(
                        'Không thể thanh toán phí Luyện tập. ' +
                        'Vui lòng thử lại.',
                        'error'
                    );

                    return;
                }
            }

            // Thu menu lựa chọn lại.
            this.toggleStudioMenu(false);

            try {
                this.activeStudentModal = true;

                modal.classList.add('active');

                modal.setAttribute(
                    'aria-hidden',
                    'false'
                );

                await this.switchStudioMode(
                    nextMode,
                    true
                );
            } catch (error) {
                console.error(
                    'Không thể mở Studio Hội họa:',
                    error
                );

                this.activeStudentModal = false;

                modal.classList.remove('active');

                modal.setAttribute(
                    'aria-hidden',
                    'true'
                );

                /*
                 * Nếu mở Luyện tập thất bại sau khi đã trừ Coin
                 * thì hoàn lại 25 Coin.
                 */
                if (
                    practiceFeePaid &&
                    practiceCoinRef
                ) {
                    try {
                        await practiceCoinRef.transaction(
                            currentValue =>
                                (Number(currentValue) || 0) +
                                PRACTICE_ENTRY_FEE
                        );
                    } catch (refundError) {
                        console.error(
                            'Không thể hoàn phí Luyện tập:',
                            refundError
                        );
                    }
                }

                this.toast(
                    nextMode === 'practice'
                        ? 'Không thể mở Luyện tập. Đã hoàn lại 25 Coin.'
                        : 'Không thể mở vòng Thi Hội họa.',
                    'error'
                );
            }
        },

        updateStudioModeUI() {
            document
                .querySelectorAll(
                    '.hh-studio-mode-button'
                )
                .forEach(button => {
                    const active =
                        button.dataset.mode ===
                        this.studioMode;

                    button.classList.toggle(
                        'active',
                        active
                    );

                    button.setAttribute(
                        'aria-selected',
                        active ? 'true' : 'false'
                    );
                });
        },

        async switchStudioMode(
            mode,
            force = false
        ) {
            const nextMode =
                mode === 'practice'
                    ? 'practice'
                    : 'contest';

            if (
                !force &&
                this.studioMode === nextMode
            ) {
                return;
            }

            // Lưu nháp của chế độ đang sử dụng.
            this.saveDraft(true);
            this.stopRoundTimers();
            this.detachCanvasEvents();
            this.resetCanvasState();

            this.studioMode = nextMode;
            this.updateStudioModeUI();

            const content =
                document.getElementById(
                    'hh-student-content'
                );

            const tabs =
                document.getElementById(
                    'hh-round-tabs'
                );

            if (!content || !tabs) return;

            if (nextMode === 'practice') {
                /*
                 * Luyện tập không cần đọc vòng thi
                 * và không gửi dữ liệu lên Firebase.
                 */
                tabs.hidden = true;
                tabs.innerHTML = '';

                this.currentRound = {
                    id: 'practice_free',
                    title: 'Luyện tập tự do',
                    topic: 'Tự do sáng tạo',
                    status: 'active',

                    startTime: 0,
                    endTime:
                        Number.MAX_SAFE_INTEGER,

                    canvasWidth:
                        DEFAULTS.canvasWidth,

                    canvasHeight:
                        DEFAULTS.canvasHeight,

                    backgroundColor:
                        DEFAULTS.backgroundColor,

                    schemaVersion: 2
                };

                this.setPracticeHeader();

                await this.renderCanvasArea(
                    content,
                    {
                        practice: true
                    }
                );

                return;
            }

            tabs.hidden = false;

            await this.loadContestStudio();
        },

        async loadContestStudio() {
            const content =
                document.getElementById(
                    'hh-student-content'
                );

            const tabs =
                document.getElementById(
                    'hh-round-tabs'
                );

            if (!content || !tabs) return;

            content.innerHTML =
                this.loadingHTML(
                    'Đang đồng bộ các vòng thi...'
                );

            tabs.innerHTML = '';

            try {
                const snap = await db
                    .ref('hoihoa_rounds')
                    .once('value');

                /*
                 * Người dùng có thể chuyển sang luyện tập
                 * trong lúc Firebase đang tải.
                 */
                if (
                    this.studioMode !== 'contest'
                ) {
                    return;
                }

                const rounds = [];

                snap.forEach(child => {
                    const value = child.val();

                    if (
                        value &&
                        !value.isArchived
                    ) {
                        rounds.push({
                            ...value,
                            _fbKey: child.key
                        });
                    }
                });

                rounds.sort(
                    (a, b) =>
                        Number(b.startTime || 0) -
                        Number(a.startTime || 0)
                );

                this.availableRounds =
                    rounds.slice(
                        0,
                        DEFAULTS.recentRounds
                    );

                if (!this.availableRounds.length) {
                    this.currentRound = null;
                    this.setRoundHeader(null);

                    content.innerHTML =
                        this.emptyStateHTML(
                            '🖼️',
                            'Phòng tranh đang trống',
                            'Giáo viên chưa mở sự kiện nào. Bạn vẫn có thể chuyển sang Luyện tập.'
                        );

                    return;
                }

                tabs.innerHTML =
                    this.availableRounds
                        .map(round => {
                            const status =
                                this.getEffectiveStatus(
                                    round
                                );

                            const icon =
                                status === 'active'
                                    ? '●'
                                    : status === 'voting'
                                        ? '♥'
                                        : status === 'closed'
                                            ? '★'
                                            : '◷';

                            return `
                        <button
                            type="button"
                            class="hh-round-tab"
                            id="hh-tab-${this.escapeHTML(round.id)}"
                            data-hh-action="select-round"
                            data-round-id="${this.escapeHTML(round.id)}">

                            <span>${icon}</span>
                            ${this.escapeHTML(round.title)}
                        </button>
                    `;
                        })
                        .join('');

                const rememberedRound =
                    this.availableRounds.find(
                        round =>
                            String(round.id) ===
                            String(
                                this.lastContestRoundId ||
                                ''
                            )
                    );

                const defaultRound =
                    rememberedRound ||

                    this.availableRounds.find(
                        round =>
                            this.getEffectiveStatus(
                                round
                            ) === 'active'
                    ) ||

                    this.availableRounds.find(
                        round =>
                            this.getEffectiveStatus(
                                round
                            ) === 'voting'
                    ) ||

                    this.availableRounds[0];

                await this.selectRound(
                    defaultRound.id
                );
            } catch (error) {
                console.error(error);

                if (
                    this.studioMode !== 'contest'
                ) {
                    return;
                }

                this.currentRound = null;
                this.setRoundHeader(null);

                content.innerHTML =
                    this.emptyStateHTML(
                        '⚠️',
                        'Không tải được phòng tranh',
                        'Kiểm tra kết nối hoặc Firebase Rules.'
                    );
            }
        },

        closeStudentModal() {
            const modal = document.getElementById('hoihoaStudentModal');
            if (modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
            }
            this.activeStudentModal = false;
            this.stopRoundTimers();
            this.saveDraft(true);
            this.detachCanvasEvents();
        },

        openEventInfo() {
            const modal =
                document.getElementById('hhEventInfoModal');

            if (!modal) return;

            const config = this.getRoundConfig(
                this.currentRound || {}
            );

            const maxVotes =
                document.getElementById(
                    'hh-info-max-votes'
                );

            const teacherWeight =
                document.getElementById(
                    'hh-info-teacher-weight'
                );

            const voteWeight =
                document.getElementById(
                    'hh-info-vote-weight'
                );

            if (maxVotes) {
                maxVotes.textContent =
                    String(config.maxVotes);
            }

            if (teacherWeight) {
                teacherWeight.textContent =
                    `${Math.round(
                        config.teacherWeight * 100
                    )}%`;
            }

            if (voteWeight) {
                voteWeight.textContent =
                    `${Math.round(
                        config.voteWeight * 100
                    )}%`;
            }

            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');

            requestAnimationFrame(() => {
                modal
                    .querySelector(
                        '.hh-event-info-close'
                    )
                    ?.focus();
            });
        },

        closeEventInfo() {
            const modal =
                document.getElementById('hhEventInfoModal');

            if (!modal) return;

            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        },

        setPracticeHeader() {
            const title =
                document.getElementById(
                    'hh-round-title'
                );

            const topic =
                document.getElementById(
                    'hh-round-topic'
                );

            const statusEl =
                document.getElementById(
                    'hh-round-status'
                );

            const time =
                document.getElementById(
                    'hh-round-time'
                );

            const countdown =
                document.getElementById(
                    'hh-round-countdown'
                );

            if (title) {
                title.textContent =
                    'Luyện tập tự do';
            }

            if (topic) {
                topic.textContent =
                    'Vẽ tùy ý — không nộp bài và không tính điểm.';
            }

            if (statusEl) {
                statusEl.textContent =
                    'Chế độ luyện tập';

                statusEl.dataset.status =
                    'practice';
            }

            if (time) {
                time.textContent =
                    'Không giới hạn thời gian';
            }

            if (countdown) {
                countdown.textContent = '';
            }
        },

        async selectRound(roundId) {
            this.saveDraft(true);
            this.stopRoundTimers();
            this.detachCanvasEvents();
            this.resetCanvasState();

            this.studioMode = 'contest';

            this.lastContestRoundId =
                String(roundId || '');

            this.updateStudioModeUI();

            const tabs =
                document.getElementById(
                    'hh-round-tabs'
                );

            if (tabs) {
                tabs.hidden = false;
            }

            this.currentRound =
                this.availableRounds.find(r => String(r.id) === String(roundId));
            if (!this.currentRound) return;

            document.querySelectorAll('.hh-round-tab').forEach(btn => btn.classList.remove('active'));
            const tab = document.getElementById(`hh-tab-${this.currentRound.id}`);
            if (tab) tab.classList.add('active');
            this.setRoundHeader(this.currentRound);

            const container = document.getElementById('hh-student-content');
            const status = this.getEffectiveStatus(this.currentRound);

            if (status === 'active') await this.renderCanvasArea(container);
            else if (status === 'voting') await this.renderVotingArea(container);
            else if (status === 'closed') await this.renderLeaderboardArea(container);
            else if (status === 'scheduled') {
                container.innerHTML = this.emptyStateHTML('🕒', 'Sự kiện chưa bắt đầu', `Studio sẽ mở lúc ${this.formatDateTime(this.currentRound.startTime)}.`);
            } else {
                container.innerHTML = this.emptyStateHTML('⏳', 'Đã hết hạn nộp bài', 'Giáo viên chưa chuyển vòng thi sang giai đoạn bình chọn.');
            }
            this.startCountdown(status);
        },

        setRoundHeader(round) {
            const title = document.getElementById('hh-round-title');
            const topic = document.getElementById('hh-round-topic');
            const statusEl = document.getElementById('hh-round-status');
            const time = document.getElementById('hh-round-time');
            if (!round) {
                if (title) title.textContent = 'Phòng tranh trống';
                if (topic) topic.textContent = '';
                if (statusEl) statusEl.textContent = 'Chưa có vòng';
                if (time) time.textContent = '';
                return;
            }
            const status = this.getEffectiveStatus(round);
            const labels = {
                active: 'Đang mở studio', voting: 'Đang triển lãm & bình chọn', closed: 'Đã công bố kết quả',
                scheduled: 'Sắp diễn ra', awaiting_voting: 'Chờ mở bình chọn'
            };
            if (title) title.textContent = round.title || 'Vòng hội họa';
            if (topic) topic.textContent = `Đề tài: ${round.topic || 'Tự do sáng tạo'}`;
            if (statusEl) {
                statusEl.textContent = labels[status] || status;
                statusEl.dataset.status = status;
            }
            if (time) time.textContent = `${this.formatDateTime(round.startTime)} → ${this.formatDateTime(round.endTime)}`;
        },

        startCountdown(status) {
            const el = document.getElementById('hh-round-countdown');
            if (!el || !this.currentRound) return;
            const target = status === 'scheduled' ? Number(this.currentRound.startTime) :
                status === 'active' ? Number(this.currentRound.endTime) : 0;
            if (!target) {
                el.textContent = '';
                return;
            }
            const update = () => {
                const remain = target - Date.now();
                el.textContent = status === 'scheduled' ? `Mở sau: ${this.formatDuration(remain)}` : `Còn lại: ${this.formatDuration(remain)}`;
                if (remain <= 0) {
                    clearInterval(this.countdownInterval);
                    this.countdownInterval = null;
                    this.selectRound(this.currentRound.id);
                }
            };
            update();
            this.countdownInterval = setInterval(update, 1000);
        },

        stopRoundTimers() {
            if (this.draftInterval) clearInterval(this.draftInterval);
            if (this.countdownInterval) clearInterval(this.countdownInterval);
            this.draftInterval = null;
            this.countdownInterval = null;
        },

        async renderCanvasArea(
            container,
            options = {}
        ) {
            if (
                !container ||
                !this.currentRound
            ) {
                return;
            }

            const isPractice =
                options.practice === true ||
                this.studioMode === 'practice';

            /*
             * Chỉ chế độ Thi mới kiểm tra
             * bài nộp trên Firebase.
             */
            if (!isPractice) {
                const roundIdAtStart =
                    String(this.currentRound.id);

                const submissionId =
                    `${roundIdAtStart}_${this.user.username}`;

                const existing = await db
                    .ref(
                        `hoihoa_submissions/${submissionId}`
                    )
                    .once('value');

                /*
                 * Không ghi đè giao diện nếu học sinh đã
                 * chuyển sang Luyện tập khi Firebase đang tải.
                 */
                if (
                    this.studioMode !== 'contest' ||
                    String(
                        this.currentRound?.id || ''
                    ) !== roundIdAtStart
                ) {
                    return;
                }

                if (existing.exists()) {
                    const sub = existing.val();

                    const safeImage =
                        this.safeDataImage(
                            sub.imageBase64
                        );

                    container.innerHTML = `
                <section class="hh-submitted-state">
                    <div class="hh-success-orb">✓</div>

                    <div>
                        <span class="hh-eyebrow">
                            ĐÃ NỘP TÁC PHẨM
                        </span>

                        <h3>
                            Bài của bạn đã được khóa an toàn
                        </h3>

                        <p>
                            Mỗi vòng chỉ nộp một lần.
                            Hãy chờ giai đoạn triển lãm
                            và bình chọn.
                        </p>

                        <p class="hh-muted">
                            Nộp lúc:
                            ${this.formatDateTime(sub.submitTime)}
                        </p>
                    </div>

                    ${safeImage
                            ? `
                                <img
                                    src="${safeImage}"
                                    class="hh-submitted-preview"
                                    alt="Tác phẩm đã nộp"
                                    data-hh-action="preview">
                            `
                            : ''
                        }
                </section>
            `;

                    return;
                }
            }

            const config =
                this.getRoundConfig(
                    this.currentRound
                );
            container.innerHTML = `
                <section class="hh-workspace">
                    <aside class="hh-tool-dock" aria-label="Công cụ vẽ">
    <span class="hh-tool-dock-label">Nét vẽ</span>

    ${this.toolButton('brush', '🖌', 'B')}
    ${this.toolButton('pencil', '✎', 'P')}
    ${this.toolButton('ink', '✒', 'K')}
    ${this.toolButton('watercolor', '◌', 'W')}
    ${this.toolButton('marker', '▰', 'M')}
    ${this.toolButton('neon', '✦', 'N')}
    ${this.toolButton('pixel', '▦', 'X')}
    ${this.toolButton('spray', '⁙', 'S')}
    ${this.toolButton('eraser', '⌫', 'E')}

    <span class="hh-tool-separator"></span>
    <span class="hh-tool-dock-label">
    Hình & chữ
</span>

${this.toolButton(
                'select',
                '↖',
                'V'
            )}

    ${this.toolButton('line', '╱', 'L')}
    ${this.toolButton('arrow', '➜', 'A')}
    ${this.toolButton('rect', '□', 'R')}
    ${this.toolButton('ellipse', '○', 'O')}
    ${this.toolButton('star', '☆', 'H')}
    ${this.toolButton('text', 'T', 'T')}

    <span class="hh-tool-separator"></span>

    ${this.toolButton('fill', '◒', 'G')}
    ${this.toolButton('picker', '◉', 'I')}
</aside>

                    <div class="hh-workspace-main">
                        <div class="canvas-toolbar hh-top-toolbar">
                            <div class="hh-control-group hh-color-group">
                                <label class="hh-color-input-wrap" title="Màu hiện tại">
                                    <input type="color" id="hh-color" value="${this.currentColor}" data-hh-setting="color">
                                    <span id="hh-color-chip" style="--hh-current-color:${this.currentColor}"></span>
                                </label>
                                <div class="hh-palette" aria-label="Bảng màu nhanh">
                                    ${COLOR_PALETTE.map(color => `<button type="button" class="hh-swatch" style="--swatch:${color}" data-hh-action="palette" data-color="${color}" title="${color}"></button>`).join('')}
                                </div>
                            </div>
                            <div class="hh-control-group hh-slider-group">
                                <label>Kích thước <output id="hh-size-output">${this.currentSize} px</output></label>
                                <input type="range" id="hh-size" min="1" max="120" value="${this.currentSize}" data-hh-setting="size">
                            </div>
                            <div class="hh-control-group hh-slider-group">
                                <label>Độ đậm <output id="hh-opacity-output">${Math.round(this.currentOpacity * 100)}%</output></label>
                                <input type="range" min="5" max="100" value="${Math.round(this.currentOpacity * 100)}" data-hh-setting="opacity">
                            </div>
                            <div class="hh-control-group hh-shape-options">
                                <label>Hình</label>
                                <select data-hh-setting="shape-mode">
                                    <option value="stroke" ${this.shapeMode === 'stroke' ? 'selected' : ''}>Viền</option>
                                    <option value="fill" ${this.shapeMode === 'fill' ? 'selected' : ''}>Tô kín</option>
                                </select>
                            </div>
                            <div
    class="hh-control-group hh-text-options
    ${this.currentTool === 'text' ? 'active' : ''}"
    id="hh-text-options">

    <label>Phông chữ</label>

    <select data-hh-setting="font-family">
        <option
            value="Arial, sans-serif"
            ${this.currentFontFamily === 'Arial, sans-serif'
                    ? 'selected'
                    : ''}>
            Arial
        </option>

        <option
            value="Georgia, serif"
            ${this.currentFontFamily === 'Georgia, serif'
                    ? 'selected'
                    : ''}>
            Georgia
        </option>

        <option
            value="'Times New Roman', serif"
            ${this.currentFontFamily === "'Times New Roman', serif"
                    ? 'selected'
                    : ''}>
            Times New Roman
        </option>

        <option
            value="'Courier New', monospace"
            ${this.currentFontFamily === "'Courier New', monospace"
                    ? 'selected'
                    : ''}>
            Courier New
        </option>

        <option
            value="system-ui, sans-serif"
            ${this.currentFontFamily === 'system-ui, sans-serif'
                    ? 'selected'
                    : ''}>
            System UI
        </option>
    </select>
</div>
                            <div class="hh-control-group hh-fill-options">
                                <label>Độ lan <output id="hh-tolerance-output">${this.fillTolerance}</output></label>
                                <input type="range" min="0" max="100" value="${this.fillTolerance}" data-hh-setting="tolerance">
                            </div>
                        </div>

                        <div class="hh-canvas-commandbar">
                            <div>
                                <button type="button" class="hh-icon-text-btn" data-hh-action="undo" title="Ctrl+Z">↶ Hoàn tác</button>
                                <button type="button" class="hh-icon-text-btn" data-hh-action="redo" title="Ctrl+Y">↷ Làm lại</button>
                                <button type="button" class="hh-icon-text-btn" data-hh-action="clear">⌫ Xóa bảng</button>
                            </div>
                            <div>
                                <button type="button" class="hh-icon-text-btn" id="hh-mirror-x" data-hh-action="toggle-mirror-x">↔ Đối xứng X</button>
                                <button type="button" class="hh-icon-text-btn" id="hh-mirror-y" data-hh-action="toggle-mirror-y">↕ Đối xứng Y</button>
                                <button type="button" class="hh-icon-text-btn" id="hh-grid-button" data-hh-action="toggle-grid"># Lưới</button>
                                <button
    type="button"
    class="hh-icon-text-btn hh-adjust-toggle"
    id="hh-adjust-toggle"
    data-hh-action="toggle-adjustments">

    ☀ Chỉnh ảnh
</button>
                            </div>
                            <div class="hh-zoom-controls">
                                <button type="button" class="hh-icon-btn" data-hh-action="zoom-out" aria-label="Thu nhỏ">−</button>
                                <button type="button" class="hh-zoom-value" data-hh-action="zoom-fit" id="hh-zoom-value">100%</button>
                                <button type="button" class="hh-icon-btn" data-hh-action="zoom-in" aria-label="Phóng to">＋</button>
                                <button type="button" class="hh-icon-btn" data-hh-action="fullscreen" aria-label="Toàn màn hình">⛶</button>
                            </div>
                        </div>

                        <section
    class="hh-adjust-panel"
    id="hh-adjust-panel"
    hidden
    aria-label="Bảng chỉnh ảnh">

    <header class="hh-adjust-header">
        <div>
            <strong>Chỉnh ảnh chuyên nghiệp</strong>
            <span>
                Xem trước trực tiếp, sau đó bấm “Áp dụng”.
            </span>
        </div>

        <div class="hh-adjust-actions">
            <button
                type="button"
                class="hh-icon-text-btn"
                data-hh-action="reset-adjustments">

                Đặt lại
            </button>

            <button
                type="button"
                class="hh-btn hh-btn-primary"
                data-hh-action="apply-adjustments">

                Áp dụng
            </button>
        </div>
    </header>

    <div class="hh-adjust-grid">
        ${this.adjustmentControl(
                        'brightness',
                        'Độ sáng',
                        -100,
                        100,
                        1
                    )}

        ${this.adjustmentControl(
                        'contrast',
                        'Tương phản',
                        -100,
                        100,
                        1
                    )}

        ${this.adjustmentControl(
                        'saturation',
                        'Bão hòa',
                        -100,
                        100,
                        1
                    )}

        ${this.adjustmentControl(
                        'temperature',
                        'Nhiệt độ màu',
                        -100,
                        100,
                        1
                    )}

        ${this.adjustmentControl(
                        'grayscale',
                        'Trắng đen',
                        0,
                        100,
                        1
                    )}

        ${this.adjustmentControl(
                        'blur',
                        'Làm mờ',
                        0,
                        12,
                        0.5,
                        'px'
                    )}
    </div>
</section>

                        <div class="hh-canvas-scroll" id="hh-canvas-scroll">
                            <div class="hh-canvas-stage" id="hh-canvas-stage" style="aspect-ratio:${config.canvasWidth}/${config.canvasHeight}; --hh-canvas-bg:${config.backgroundColor};">
                                <canvas
    id="hoihoaCanvas"
    width="${config.canvasWidth}"
    height="${config.canvasHeight}">
</canvas>

<canvas
    id="hoihoaObjectCanvas"
    width="${config.canvasWidth}"
    height="${config.canvasHeight}">
</canvas>

<canvas
    id="hoihoaPreviewCanvas"
    width="${config.canvasWidth}"
    height="${config.canvasHeight}">
</canvas>
                                <div class="hh-grid-overlay" id="hh-grid-overlay"></div>
                            </div>
                        </div>

                        <footer class="hh-workspace-footer">
                            <div class="hh-draft-info">
                                <span class="hh-save-dot" id="hh-save-dot"></span>
                                <span id="hh-draft-status">Sẵn sàng vẽ</span>
                                <span class="hh-canvas-spec">${config.canvasWidth} × ${config.canvasHeight}px</span>
                            </div>
                            <div class="hh-submit-actions">
    ${isPractice
                    ? `
        <input
            type="file"
            id="hh-practice-image-input"
            accept="image/png,image/jpeg,image/webp"
            hidden>

        <button
            type="button"
            class="hh-btn hh-btn-ghost hh-practice-upload-btn"
            data-hh-action="upload-practice-image">

            🖼️ Tải ảnh từ máy
        </button>

        <button
            type="button"
            class="hh-btn hh-btn-primary"
            data-hh-action="download">

            💾 Lưu ảnh PNG về máy
        </button>
    `
                    : `
                <button
                    type="button"
                    class="hh-btn hh-btn-ghost"
                    data-hh-action="download">

                    Tải bản dự phòng
                </button>

                <button
                    type="button"
                    class="hh-btn hh-btn-primary"
                    id="hh-submit-btn"
                    data-hh-action="submit">

                    Nộp tác phẩm
                </button>
            `
                }
</div>
                        </footer>
                        <p class="hh-integrity-note">
    ${isPractice
                    ? 'Chế độ luyện tập không gửi dữ liệu lên Firebase. Bản nháp chỉ lưu trong trình duyệt; hãy bấm “Lưu ảnh PNG về máy” để giữ tác phẩm.'
                    : 'Tác phẩm được tạo trực tiếp trong studio. Mỗi vòng chỉ nộp một lần; bản đã nộp không bị ghi đè.'
                }
</p>
                    </div>
                </section>
            `;
            this.setupCanvas(config);
        },

        toolButton(tool, icon, shortcut) {
            return `<button type="button" class="hh-tool-button ${this.currentTool === tool ? 'active' : ''}" data-hh-action="tool" data-tool="${tool}" title="${TOOL_LABELS[tool]} (${shortcut})"><span>${icon}</span><small>${this.escapeHTML(TOOL_LABELS[tool])}</small></button>`;
        },

        adjustmentControl(
            key,
            label,
            min,
            max,
            step = 1,
            suffix = '%'
        ) {
            const value = Number(
                this.imageAdjustments[key] || 0
            );

            return `
        <label class="hh-adjust-control">
            <span>
                ${this.escapeHTML(label)}

                <output id="hh-adjust-${key}-output">
                    ${value}${suffix}
                </output>
            </span>

            <input
                type="range"
                min="${min}"
                max="${max}"
                step="${step}"
                value="${value}"
                data-hh-setting="adjust-${key}">
        </label>
    `;
        },

        setupCanvas(config) {
            this.canvas = document.getElementById('hoihoaCanvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d', { willReadFrequently: true }) : null;
            this.previewCanvas = document.getElementById('hoihoaPreviewCanvas');
            this.previewCtx =
                this.previewCanvas
                    ? this.previewCanvas.getContext('2d')
                    : null;
            this.objectCanvas =
                document.getElementById(
                    'hoihoaObjectCanvas'
                );

            this.objectCtx =
                this.objectCanvas
                    ? this.objectCanvas.getContext('2d')
                    : null;
            this.canvasStage = document.getElementById('hh-canvas-stage');
            this.canvasScroll = document.getElementById('hh-canvas-scroll');
            if (
                !this.canvas ||
                !this.ctx ||
                !this.objectCanvas ||
                !this.objectCtx ||
                !this.previewCanvas ||
                !this.previewCtx
            ) {
                return;
            }

            this.canvas.width = config.canvasWidth;
            this.canvas.height = config.canvasHeight;
            this.objectCanvas.width =
                config.canvasWidth;

            this.objectCanvas.height =
                config.canvasHeight;
            this.previewCanvas.width = config.canvasWidth;
            this.previewCanvas.height = config.canvasHeight;
            this.canvasStage.style.setProperty('--hh-canvas-bg', config.backgroundColor);

            this.ctx.fillStyle = config.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.imageSmoothingEnabled = true;
            this.previewCtx.imageSmoothingEnabled = true;
            this.objectCtx.imageSmoothingEnabled = true;

            this.objects = [];
            this.selectedObjectId = null;
            this.isDraggingObject = false;
            this.objectImageCache = new Map();

            this.boundPointerDown = (e) => this.onPointerDown(e);
            this.boundPointerMove = (e) => this.onPointerMove(e);
            this.boundPointerUp = (e) => this.onPointerUp(e);
            this.boundContextMenu = (e) => e.preventDefault();
            this.previewCanvas.addEventListener('pointerdown', this.boundPointerDown);
            this.previewCanvas.addEventListener('pointermove', this.boundPointerMove);
            this.previewCanvas.addEventListener('pointerup', this.boundPointerUp);
            this.previewCanvas.addEventListener('pointercancel', this.boundPointerUp);
            this.previewCanvas.addEventListener('contextmenu', this.boundContextMenu);

            this.restoreDraft().finally(() => {
                this.resetHistory();
                this.pushHistory();
            });

            this.draftInterval = setInterval(() => this.saveDraft(false), DEFAULTS.autosaveMs);
            const isMobile =
                window.matchMedia(
                    '(max-width: 760px)'
                ).matches;

            const isPortraitScreen =
                window.innerHeight >
                window.innerWidth;

            const canvasRatio =
                config.canvasWidth /
                config.canvasHeight;

            let initialZoom = 1;

            if (isMobile) {
                /*
                 * Tranh ngang trên điện thoại dọc cần
                 * phóng lớn hơn để không quá nhỏ.
                 */
                if (
                    canvasRatio >= 1.2 &&
                    isPortraitScreen
                ) {
                    initialZoom = 1.8;
                } else if (
                    canvasRatio >= 1.2
                ) {
                    initialZoom = 1.4;
                } else {
                    initialZoom = 1.45;
                }
            }

            this.setZoom(initialZoom);

            /*
             * Sau khi tăng kích thước, đưa vùng nhìn
             * vào giữa canvas nhưng vẫn cuộn được tới mép.
             */
            requestAnimationFrame(() => {
                if (!this.canvasScroll) return;

                this.canvasScroll.scrollLeft =
                    Math.max(
                        0,
                        (
                            this.canvasScroll.scrollWidth -
                            this.canvasScroll.clientWidth
                        ) / 2
                    );

                this.canvasScroll.scrollTop = 0;
            });
            this.updateToolUI();
        },

        detachCanvasEvents() {
            if (!this.previewCanvas) return;
            if (this.boundPointerDown) this.previewCanvas.removeEventListener('pointerdown', this.boundPointerDown);
            if (this.boundPointerMove) this.previewCanvas.removeEventListener('pointermove', this.boundPointerMove);
            if (this.boundPointerUp) {
                this.previewCanvas.removeEventListener('pointerup', this.boundPointerUp);
                this.previewCanvas.removeEventListener('pointercancel', this.boundPointerUp);
            }
            if (this.boundContextMenu) this.previewCanvas.removeEventListener('contextmenu', this.boundContextMenu);
        },

        resetCanvasState() {
            this.canvas = null;
            this.ctx = null;
            this.previewCanvas = null;
            this.previewCtx = null;
            this.objectCanvas = null;
            this.objectCtx = null;

            this.objects = [];
            this.selectedObjectId = null;

            this.isDraggingObject = false;
            this.objectDragStart = null;
            this.objectDragOriginal = null;

            this.objectImageCache = new Map();
            this.canvasStage = null;
            this.canvasScroll = null;
            this.isDrawing = false;
            this.activePointerId = null;
            this.startPoint = null;
            this.lastPoint = null;
            this.history = [];
            this.historyStep = -1;
            this.isDirty = false;
            this.hasDrawnContent = false;
            this.zoom = 1;
        },

        createObjectId() {
            return (
                `hh-object-${Date.now()}-` +
                Math.random()
                    .toString(36)
                    .slice(2, 9)
            );
        },

        cloneObjects(objects = this.objects) {
            return JSON.parse(
                JSON.stringify(objects || [])
            );
        },

        getSelectedObject() {
            return this.objects.find(
                object =>
                    object.id ===
                    this.selectedObjectId
            ) || null;
        },

        createShapeObject(
            type,
            start,
            end
        ) {
            const common = {
                id: this.createObjectId(),
                type,
                color: this.currentColor,
                lineWidth: this.currentSize,
                opacity: this.currentOpacity,
                mode: this.shapeMode
            };

            if (
                type === 'line' ||
                type === 'arrow'
            ) {
                return {
                    ...common,

                    x1: start.x,
                    y1: start.y,

                    x2: end.x,
                    y2: end.y
                };
            }

            return {
                ...common,

                x: Math.min(
                    start.x,
                    end.x
                ),

                y: Math.min(
                    start.y,
                    end.y
                ),

                width: Math.abs(
                    end.x - start.x
                ),

                height: Math.abs(
                    end.y - start.y
                )
            };
        },

        measureTextObject(object) {
            const context =
                this.objectCtx ||
                this.ctx;

            const lines =
                String(
                    object.text || ''
                ).split(/\n/);

            const fontSize =
                Number(
                    object.fontSize || 20
                );

            context.save();

            context.font =
                `700 ${fontSize}px ` +
                (
                    object.fontFamily ||
                    'Arial, sans-serif'
                );

            const width = Math.max(
                20,

                ...lines.map(line =>
                    context.measureText(line).width
                )
            );

            context.restore();

            return {
                width,
                height:
                    Math.max(
                        1,
                        lines.length
                    ) *
                    fontSize *
                    1.25
            };
        },

        getObjectBounds(object) {
            if (!object) {
                return {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };
            }

            if (
                object.type === 'line' ||
                object.type === 'arrow'
            ) {
                const padding = Math.max(
                    10,
                    Number(
                        object.lineWidth || 1
                    ) * 2
                );

                const x = Math.min(
                    object.x1,
                    object.x2
                );

                const y = Math.min(
                    object.y1,
                    object.y2
                );

                return {
                    x: x - padding,
                    y: y - padding,

                    width:
                        Math.abs(
                            object.x2 -
                            object.x1
                        ) +
                        padding * 2,

                    height:
                        Math.abs(
                            object.y2 -
                            object.y1
                        ) +
                        padding * 2
                };
            }

            if (object.type === 'text') {
                const measured =
                    this.measureTextObject(
                        object
                    );

                return {
                    x: object.x,
                    y: object.y,

                    width:
                        measured.width,

                    height:
                        measured.height
                };
            }

            return {
                x: object.x,
                y: object.y,

                width:
                    Math.max(
                        1,
                        object.width || 1
                    ),

                height:
                    Math.max(
                        1,
                        object.height || 1
                    )
            };
        },

        pointToSegmentDistance(
            point,
            x1,
            y1,
            x2,
            y2
        ) {
            const dx = x2 - x1;
            const dy = y2 - y1;

            if (dx === 0 && dy === 0) {
                return Math.hypot(
                    point.x - x1,
                    point.y - y1
                );
            }

            const lengthSquared =
                dx * dx +
                dy * dy;

            const t = this.clamp(
                (
                    (
                        point.x - x1
                    ) * dx +
                    (
                        point.y - y1
                    ) * dy
                ) / lengthSquared,
                0,
                1
            );

            const px =
                x1 + t * dx;

            const py =
                y1 + t * dy;

            return Math.hypot(
                point.x - px,
                point.y - py
            );
        },

        objectContainsPoint(
            object,
            point
        ) {
            if (
                object.type === 'line' ||
                object.type === 'arrow'
            ) {
                return (
                    this.pointToSegmentDistance(
                        point,
                        object.x1,
                        object.y1,
                        object.x2,
                        object.y2
                    ) <=
                    Math.max(
                        12,
                        Number(
                            object.lineWidth || 1
                        ) + 8
                    )
                );
            }

            const bounds =
                this.getObjectBounds(
                    object
                );

            const padding = 8;

            return (
                point.x >=
                bounds.x - padding &&

                point.x <=
                bounds.x +
                bounds.width +
                padding &&

                point.y >=
                bounds.y - padding &&

                point.y <=
                bounds.y +
                bounds.height +
                padding
            );
        },

        hitTestObject(point) {
            for (
                let index =
                    this.objects.length - 1;

                index >= 0;

                index--
            ) {
                const object =
                    this.objects[index];

                if (
                    this.objectContainsPoint(
                        object,
                        point
                    )
                ) {
                    return object;
                }
            }

            return null;
        },

        moveObjectFromOriginal(
            object,
            original,
            dx,
            dy
        ) {
            if (
                object.type === 'line' ||
                object.type === 'arrow'
            ) {
                object.x1 =
                    original.x1 + dx;

                object.y1 =
                    original.y1 + dy;

                object.x2 =
                    original.x2 + dx;

                object.y2 =
                    original.y2 + dy;

                return;
            }

            object.x =
                original.x + dx;

            object.y =
                original.y + dy;
        },

        getObjectImage(src) {
            if (!src) return null;

            const cached =
                this.objectImageCache.get(
                    src
                );

            if (cached?.image) {
                return cached.image;
            }

            if (!cached?.promise) {
                const promise =
                    this.loadImage(src)
                        .then(image => {
                            this.objectImageCache.set(
                                src,
                                {
                                    image,
                                    promise: null
                                }
                            );

                            this.renderObjectLayer();

                            return image;
                        })
                        .catch(error => {
                            console.warn(
                                'Không thể tải ảnh đối tượng:',
                                error
                            );

                            this.objectImageCache.delete(
                                src
                            );

                            return null;
                        });

                this.objectImageCache.set(
                    src,
                    {
                        image: null,
                        promise
                    }
                );
            }

            return null;
        },

        async preloadObjectImages() {
            const imageObjects =
                this.objects.filter(
                    object =>
                        object.type ===
                        'image' &&
                        object.src
                );

            await Promise.all(
                imageObjects.map(
                    async object => {
                        try {
                            const image =
                                await this.loadImage(
                                    object.src
                                );

                            this.objectImageCache.set(
                                object.src,
                                {
                                    image,
                                    promise: null
                                }
                            );
                        } catch (error) {
                            console.warn(
                                'Không thể khôi phục ảnh đối tượng:',
                                error
                            );
                        }
                    }
                )
            );
        },

        drawObject(
            context,
            object
        ) {
            if (!context || !object) {
                return;
            }

            context.save();

            context.globalAlpha =
                this.clamp(
                    Number(
                        object.opacity ?? 1
                    ),
                    0.05,
                    1
                );

            context.lineWidth =
                Math.max(
                    1,
                    Number(
                        object.lineWidth || 1
                    )
                );

            context.lineCap = 'round';
            context.lineJoin = 'round';

            context.strokeStyle =
                object.color ||
                '#111827';

            context.fillStyle =
                object.color ||
                '#111827';

            if (object.type === 'line') {
                context.beginPath();

                context.moveTo(
                    object.x1,
                    object.y1
                );

                context.lineTo(
                    object.x2,
                    object.y2
                );

                context.stroke();
            }

            if (object.type === 'arrow') {
                const angle =
                    Math.atan2(
                        object.y2 -
                        object.y1,

                        object.x2 -
                        object.x1
                    );

                const head =
                    Math.max(
                        10,
                        Number(
                            object.lineWidth || 1
                        ) * 3.2
                    );

                context.beginPath();

                context.moveTo(
                    object.x1,
                    object.y1
                );

                context.lineTo(
                    object.x2,
                    object.y2
                );

                context.stroke();

                context.beginPath();

                context.moveTo(
                    object.x2,
                    object.y2
                );

                context.lineTo(
                    object.x2 -
                    head *
                    Math.cos(
                        angle -
                        Math.PI / 6
                    ),

                    object.y2 -
                    head *
                    Math.sin(
                        angle -
                        Math.PI / 6
                    )
                );

                context.lineTo(
                    object.x2 -
                    head *
                    Math.cos(
                        angle +
                        Math.PI / 6
                    ),

                    object.y2 -
                    head *
                    Math.sin(
                        angle +
                        Math.PI / 6
                    )
                );

                context.closePath();
                context.fill();
            }

            if (object.type === 'rect') {
                if (object.mode === 'fill') {
                    context.fillRect(
                        object.x,
                        object.y,
                        object.width,
                        object.height
                    );
                } else {
                    context.strokeRect(
                        object.x,
                        object.y,
                        object.width,
                        object.height
                    );
                }
            }

            if (object.type === 'ellipse') {
                context.beginPath();

                context.ellipse(
                    object.x +
                    object.width / 2,

                    object.y +
                    object.height / 2,

                    Math.max(
                        1,
                        object.width / 2
                    ),

                    Math.max(
                        1,
                        object.height / 2
                    ),

                    0,
                    0,
                    Math.PI * 2
                );

                if (object.mode === 'fill') {
                    context.fill();
                } else {
                    context.stroke();
                }
            }

            if (object.type === 'star') {
                const cx =
                    object.x +
                    object.width / 2;

                const cy =
                    object.y +
                    object.height / 2;

                const outerRadius =
                    Math.max(
                        2,

                        Math.min(
                            object.width,
                            object.height
                        ) / 2
                    );

                const innerRadius =
                    Math.max(
                        1,
                        outerRadius / 2.2
                    );

                let angle =
                    -Math.PI / 2;

                context.beginPath();

                for (
                    let index = 0;
                    index < 10;
                    index++
                ) {
                    const radius =
                        index % 2 === 0
                            ? outerRadius
                            : innerRadius;

                    const x =
                        cx +
                        Math.cos(angle) *
                        radius;

                    const y =
                        cy +
                        Math.sin(angle) *
                        radius;

                    if (index === 0) {
                        context.moveTo(x, y);
                    } else {
                        context.lineTo(x, y);
                    }

                    angle += Math.PI / 5;
                }

                context.closePath();

                if (object.mode === 'fill') {
                    context.fill();
                } else {
                    context.stroke();
                }
            }

            if (object.type === 'text') {
                const fontSize =
                    Math.max(
                        14,
                        Number(
                            object.fontSize || 20
                        )
                    );

                const lines =
                    String(
                        object.text || ''
                    ).split(/\n/);

                context.textBaseline =
                    'top';

                context.font =
                    `700 ${fontSize}px ` +
                    (
                        object.fontFamily ||
                        'Arial, sans-serif'
                    );

                lines.forEach(
                    (line, index) => {
                        context.fillText(
                            line,
                            object.x,

                            object.y +
                            index *
                            fontSize *
                            1.25
                        );
                    }
                );
            }

            if (object.type === 'image') {
                const image =
                    this.getObjectImage(
                        object.src
                    );

                if (image) {
                    context.drawImage(
                        image,
                        object.x,
                        object.y,
                        object.width,
                        object.height
                    );
                }
            }

            context.restore();
        },

        renderObjectLayer() {
            if (
                !this.objectCanvas ||
                !this.objectCtx
            ) {
                return;
            }

            this.objectCtx.clearRect(
                0,
                0,
                this.objectCanvas.width,
                this.objectCanvas.height
            );

            this.objects.forEach(
                object =>
                    this.drawObject(
                        this.objectCtx,
                        object
                    )
            );
        },

        renderSelectionOverlay() {
            if (
                !this.previewCanvas ||
                !this.previewCtx
            ) {
                return;
            }

            this.previewCtx.clearRect(
                0,
                0,
                this.previewCanvas.width,
                this.previewCanvas.height
            );

            const selected =
                this.getSelectedObject();

            if (!selected) return;

            const bounds =
                this.getObjectBounds(
                    selected
                );

            this.previewCtx.save();

            this.previewCtx.strokeStyle =
                '#2563eb';

            this.previewCtx.fillStyle =
                '#ffffff';

            this.previewCtx.lineWidth =
                Math.max(
                    1,
                    2 / Math.max(
                        this.zoom,
                        0.1
                    )
                );

            this.previewCtx.setLineDash([
                8,
                5
            ]);

            this.previewCtx.strokeRect(
                bounds.x - 5,
                bounds.y - 5,
                bounds.width + 10,
                bounds.height + 10
            );

            this.previewCtx.setLineDash([]);

            const handleSize = 9;

            [
                [bounds.x - 5, bounds.y - 5],

                [
                    bounds.x +
                    bounds.width +
                    5,

                    bounds.y - 5
                ],

                [
                    bounds.x - 5,

                    bounds.y +
                    bounds.height +
                    5
                ],

                [
                    bounds.x +
                    bounds.width +
                    5,

                    bounds.y +
                    bounds.height +
                    5
                ]
            ].forEach(([x, y]) => {
                this.previewCtx.fillRect(
                    x - handleSize / 2,
                    y - handleSize / 2,
                    handleSize,
                    handleSize
                );

                this.previewCtx.strokeRect(
                    x - handleSize / 2,
                    y - handleSize / 2,
                    handleSize,
                    handleSize
                );
            });

            this.previewCtx.restore();
        },

        refreshObjects() {
            this.renderObjectLayer();
            this.renderSelectionOverlay();
        },

        deleteSelectedObject() {
            if (!this.selectedObjectId) {
                return;
            }

            const oldLength =
                this.objects.length;

            this.objects =
                this.objects.filter(
                    object =>
                        object.id !==
                        this.selectedObjectId
                );

            if (
                this.objects.length ===
                oldLength
            ) {
                return;
            }

            this.selectedObjectId = null;

            this.refreshObjects();
            this.markChanged(true);
            this.pushHistory();
        },

        moveSelectedObjectBy(
            dx,
            dy
        ) {
            const object =
                this.getSelectedObject();

            if (!object) return;

            const original =
                this.cloneObjects([
                    object
                ])[0];

            this.moveObjectFromOriginal(
                object,
                original,
                dx,
                dy
            );

            this.refreshObjects();
            this.markChanged(true);
        },

        onPointerDown(event) {
            if (
                !this.canvas ||
                !this.ctx ||
                event.button > 0
            ) {
                return;
            }

            event.preventDefault();

            this.previewCanvas
                .setPointerCapture?.(
                    event.pointerId
                );

            this.activePointerId =
                event.pointerId;

            const point =
                this.getCanvasPoint(
                    event
                );

            if (
                this.currentTool ===
                'select'
            ) {
                const object =
                    this.hitTestObject(
                        point
                    );

                this.selectedObjectId =
                    object?.id || null;

                this.renderSelectionOverlay();

                if (object) {
                    this.isDraggingObject =
                        true;

                    this.objectDragStart = {
                        x: point.x,
                        y: point.y
                    };

                    this.objectDragOriginal =
                        this.cloneObjects([
                            object
                        ])[0];
                }

                return;
            }

            if (
                this.currentTool ===
                'picker'
            ) {
                this.pickColor(point);
                return;
            }

            if (
                this.currentTool ===
                'fill'
            ) {
                this.floodFill(
                    Math.round(point.x),
                    Math.round(point.y)
                );

                this.markChanged();
                this.pushHistory();
                return;
            }

            if (
                this.currentTool ===
                'text'
            ) {
                this.insertText(point);
                return;
            }

            this.isDrawing = true;
            this.startPoint = point;
            this.lastPoint = point;

            const freehandTools = [
                'brush',
                'pencil',
                'ink',
                'watercolor',
                'marker',
                'neon',
                'pixel',
                'eraser',
                'spray'
            ];

            if (
                freehandTools.includes(
                    this.currentTool
                )
            ) {
                this.drawFreehandSegment(
                    point,
                    point,
                    event.pressure
                );

                this.markChanged();
            }
        },

        onPointerMove(event) {
            if (
                event.pointerId !==
                this.activePointerId
            ) {
                return;
            }

            const point =
                this.getCanvasPoint(
                    event
                );

            if (
                this.currentTool ===
                'select' &&
                this.isDraggingObject
            ) {
                event.preventDefault();

                const object =
                    this.getSelectedObject();

                if (
                    !object ||
                    !this.objectDragStart ||
                    !this.objectDragOriginal
                ) {
                    return;
                }

                const dx =
                    point.x -
                    this.objectDragStart.x;

                const dy =
                    point.y -
                    this.objectDragStart.y;

                this.moveObjectFromOriginal(
                    object,
                    this.objectDragOriginal,
                    dx,
                    dy
                );

                this.refreshObjects();
                this.markChanged(true);

                return;
            }

            if (!this.isDrawing) return;

            event.preventDefault();

            const freehandTools = [
                'brush',
                'pencil',
                'ink',
                'watercolor',
                'marker',
                'neon',
                'pixel',
                'eraser',
                'spray'
            ];

            if (
                freehandTools.includes(
                    this.currentTool
                )
            ) {
                this.drawFreehandSegment(
                    this.lastPoint,
                    point,
                    event.pressure
                );

                this.lastPoint = point;
                this.markChanged();
            } else {
                this.renderShapePreview(
                    this.startPoint,
                    point
                );
            }
        },

        onPointerUp(event) {
            if (
                event.pointerId !==
                this.activePointerId
            ) {
                return;
            }

            event.preventDefault();

            if (
                this.currentTool ===
                'select' &&
                this.isDraggingObject
            ) {
                this.isDraggingObject =
                    false;

                this.objectDragStart =
                    null;

                this.objectDragOriginal =
                    null;

                this.activePointerId =
                    null;

                this.refreshObjects();
                this.pushHistory();

                return;
            }

            if (!this.isDrawing) {
                this.activePointerId =
                    null;

                return;
            }

            const point =
                this.getCanvasPoint(
                    event
                );

            const shapeTools = [
                'line',
                'arrow',
                'rect',
                'ellipse',
                'star'
            ];

            if (
                shapeTools.includes(
                    this.currentTool
                )
            ) {
                const object =
                    this.createShapeObject(
                        this.currentTool,
                        this.startPoint,
                        point
                    );

                const bounds =
                    this.getObjectBounds(
                        object
                    );

                if (
                    bounds.width >= 3 ||
                    bounds.height >= 3
                ) {
                    this.objects.push(
                        object
                    );

                    this.selectedObjectId =
                        object.id;

                    this.markChanged(true);
                    this.pushHistory();

                    this.setTool(
                        'select'
                    );
                }

                this.refreshObjects();
            }

            this.isDrawing = false;

            this.activePointerId =
                null;

            this.ctx.beginPath();
        },

        getCanvasPoint(event) {
            const rect =
                this.previewCanvas.getBoundingClientRect();

            return {
                x: this.clamp(
                    (event.clientX - rect.left) *
                    (
                        this.previewCanvas.width /
                        rect.width
                    ),
                    0,
                    this.previewCanvas.width
                ),

                y: this.clamp(
                    (event.clientY - rect.top) *
                    (
                        this.previewCanvas.height /
                        rect.height
                    ),
                    0,
                    this.previewCanvas.height
                )
            };
        },

        getMirroredPairs(from, to) {
            const width = this.canvas.width;
            const height = this.canvas.height;

            const pairs = [
                {
                    from,
                    to
                }
            ];

            if (this.mirrorX) {
                pairs.push({
                    from: {
                        x: width - 1 - from.x,
                        y: from.y
                    },

                    to: {
                        x: width - 1 - to.x,
                        y: to.y
                    }
                });
            }

            if (this.mirrorY) {
                pairs.push({
                    from: {
                        x: from.x,
                        y: height - 1 - from.y
                    },

                    to: {
                        x: to.x,
                        y: height - 1 - to.y
                    }
                });
            }

            if (this.mirrorX && this.mirrorY) {
                pairs.push({
                    from: {
                        x: width - 1 - from.x,
                        y: height - 1 - from.y
                    },

                    to: {
                        x: width - 1 - to.x,
                        y: height - 1 - to.y
                    }
                });
            }

            return pairs;
        },

        drawFreehandSegment(
            from,
            to,
            pressure = 0.5
        ) {
            const ctx = this.ctx;

            const effectivePressure =
                pressure > 0
                    ? pressure
                    : 0.5;

            const baseSize =
                this.currentSize *
                (
                    this.currentTool === 'pencil'
                        ? 0.45
                        : 1
                );

            const lineSize = Math.max(
                1,
                baseSize *
                (
                    0.55 +
                    effectivePressure * 0.45
                )
            );

            const config =
                this.getRoundConfig(this.currentRound);

            this.getMirroredPairs(from, to)
                .forEach(pair => {
                    if (
                        this.currentTool === 'spray'
                    ) {
                        this.drawSpray(
                            pair.to,
                            lineSize
                        );

                        return;
                    }

                    if (
                        this.currentTool ===
                        'watercolor'
                    ) {
                        this.drawWatercolorStroke(
                            pair.from,
                            pair.to,
                            lineSize
                        );

                        return;
                    }

                    if (
                        this.currentTool === 'neon'
                    ) {
                        this.drawNeonStroke(
                            pair.from,
                            pair.to,
                            lineSize
                        );

                        return;
                    }

                    if (
                        this.currentTool === 'pixel'
                    ) {
                        this.drawPixelStroke(
                            pair.from,
                            pair.to,
                            lineSize
                        );

                        return;
                    }

                    ctx.save();

                    ctx.globalAlpha =
                        this.currentTool === 'eraser'
                            ? 1
                            : (
                                this.currentTool ===
                                    'marker'
                                    ? Math.min(
                                        this.currentOpacity,
                                        0.3
                                    )
                                    : this.currentOpacity
                            );

                    if (
                        this.currentTool === 'marker'
                    ) {
                        ctx.lineWidth =
                            lineSize * 1.7;
                    } else if (
                        this.currentTool === 'ink'
                    ) {
                        ctx.lineWidth = Math.max(
                            1,
                            lineSize * 0.72
                        );
                    } else {
                        ctx.lineWidth = lineSize;
                    }

                    ctx.lineCap = [
                        'pencil',
                        'ink'
                    ].includes(this.currentTool)
                        ? 'butt'
                        : 'round';

                    ctx.lineJoin = 'round';

                    ctx.strokeStyle =
                        this.currentTool === 'eraser'
                            ? config.backgroundColor
                            : this.currentColor;

                    if (
                        this.currentTool === 'brush'
                    ) {
                        ctx.shadowColor =
                            this.currentColor;

                        ctx.shadowBlur = Math.max(
                            0,
                            lineSize * 0.08
                        );
                    }

                    ctx.beginPath();

                    ctx.moveTo(
                        pair.from.x,
                        pair.from.y
                    );

                    ctx.lineTo(
                        pair.to.x,
                        pair.to.y
                    );

                    ctx.stroke();
                    ctx.restore();
                });
        },

        drawSpray(point, radius) {
            const ctx = this.ctx;

            const dots = Math.max(
                8,
                Math.round(radius * 1.8)
            );

            ctx.save();

            ctx.fillStyle = this.currentColor;

            ctx.globalAlpha =
                this.currentOpacity * 0.65;

            for (let i = 0; i < dots; i++) {
                const angle =
                    Math.random() * Math.PI * 2;

                const distance =
                    Math.sqrt(Math.random()) *
                    radius;

                const dotRadius = Math.max(
                    0.6,
                    radius *
                    0.035 *
                    Math.random()
                );

                ctx.beginPath();

                ctx.arc(
                    point.x +
                    Math.cos(angle) *
                    distance,

                    point.y +
                    Math.sin(angle) *
                    distance,

                    dotRadius,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }

            ctx.restore();
        },

        drawWatercolorStroke(
            from,
            to,
            size
        ) {
            const ctx = this.ctx;
            const layers = 7;

            ctx.save();

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = this.currentColor;

            ctx.globalCompositeOperation =
                'source-over';

            for (
                let i = 0;
                i < layers;
                i++
            ) {
                const jitter = Math.max(
                    0.5,
                    size * 0.12
                );

                const ox =
                    (Math.random() - 0.5) *
                    jitter;

                const oy =
                    (Math.random() - 0.5) *
                    jitter;

                ctx.globalAlpha = Math.max(
                    0.018,
                    this.currentOpacity *
                    (
                        0.035 +
                        Math.random() * 0.035
                    )
                );

                ctx.lineWidth =
                    size *
                    (
                        0.7 +
                        Math.random() * 0.65
                    );

                ctx.beginPath();

                ctx.moveTo(
                    from.x + ox,
                    from.y + oy
                );

                ctx.lineTo(
                    to.x + ox,
                    to.y + oy
                );

                ctx.stroke();
            }

            ctx.restore();
        },

        drawNeonStroke(
            from,
            to,
            size
        ) {
            const ctx = this.ctx;

            ctx.save();

            ctx.globalAlpha =
                this.currentOpacity;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.strokeStyle =
                this.currentColor;

            ctx.shadowColor =
                this.currentColor;

            ctx.shadowBlur = Math.max(
                8,
                size * 1.15
            );

            ctx.lineWidth = Math.max(
                3,
                size * 1.45
            );

            ctx.beginPath();

            ctx.moveTo(
                from.x,
                from.y
            );

            ctx.lineTo(
                to.x,
                to.y
            );

            ctx.stroke();

            ctx.shadowBlur = Math.max(
                3,
                size * 0.35
            );

            ctx.strokeStyle = '#ffffff';

            ctx.globalAlpha = Math.min(
                1,
                this.currentOpacity * 0.9
            );

            ctx.lineWidth = Math.max(
                1,
                size * 0.28
            );

            ctx.stroke();
            ctx.restore();
        },

        drawPixelStroke(
            from,
            to,
            size
        ) {
            const ctx = this.ctx;

            const cell = Math.max(
                2,
                Math.round(size)
            );

            const distance = Math.hypot(
                to.x - from.x,
                to.y - from.y
            );

            const steps = Math.max(
                1,
                Math.ceil(
                    distance /
                    Math.max(
                        1,
                        cell * 0.45
                    )
                )
            );

            ctx.save();

            ctx.fillStyle =
                this.currentColor;

            ctx.globalAlpha =
                this.currentOpacity;

            for (
                let i = 0;
                i <= steps;
                i++
            ) {
                const t = i / steps;

                const x = Math.round(
                    (
                        from.x +
                        (
                            to.x - from.x
                        ) * t
                    ) / cell
                ) * cell;

                const y = Math.round(
                    (
                        from.y +
                        (
                            to.y - from.y
                        ) * t
                    ) / cell
                ) * cell;

                ctx.fillRect(
                    x - cell / 2,
                    y - cell / 2,
                    cell,
                    cell
                );
            }

            ctx.restore();
        },

        renderShapePreview(
            start,
            end
        ) {
            this.previewCtx.clearRect(
                0,
                0,
                this.previewCanvas.width,
                this.previewCanvas.height
            );

            const object =
                this.createShapeObject(
                    this.currentTool,
                    start,
                    end
                );

            this.drawObject(
                this.previewCtx,
                object
            );
        },

        drawShape(ctx, start, end) {
            ctx.save();

            ctx.globalAlpha =
                this.currentOpacity;

            ctx.lineWidth =
                this.currentSize;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.strokeStyle =
                this.currentColor;

            ctx.fillStyle =
                this.currentColor;

            const x = Math.min(
                start.x,
                end.x
            );

            const y = Math.min(
                start.y,
                end.y
            );

            const w = Math.abs(
                end.x - start.x
            );

            const h = Math.abs(
                end.y - start.y
            );

            if (
                this.currentTool === 'line'
            ) {
                ctx.beginPath();

                ctx.moveTo(
                    start.x,
                    start.y
                );

                ctx.lineTo(
                    end.x,
                    end.y
                );

                ctx.stroke();
            }

            if (
                this.currentTool === 'arrow'
            ) {
                this.drawArrow(
                    ctx,
                    start,
                    end
                );
            }

            if (
                this.currentTool === 'rect'
            ) {
                if (
                    this.shapeMode === 'fill'
                ) {
                    ctx.fillRect(
                        x,
                        y,
                        w,
                        h
                    );
                } else {
                    ctx.strokeRect(
                        x,
                        y,
                        w,
                        h
                    );
                }
            }

            if (
                this.currentTool === 'ellipse'
            ) {
                ctx.beginPath();

                ctx.ellipse(
                    x + w / 2,
                    y + h / 2,
                    Math.max(
                        1,
                        w / 2
                    ),
                    Math.max(
                        1,
                        h / 2
                    ),
                    0,
                    0,
                    Math.PI * 2
                );

                if (
                    this.shapeMode === 'fill'
                ) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
            }

            if (
                this.currentTool === 'star'
            ) {
                this.drawStar(
                    ctx,
                    x + w / 2,
                    y + h / 2,

                    Math.max(
                        2,
                        Math.min(w, h) / 2
                    ),

                    Math.max(
                        1,
                        Math.min(w, h) / 4.4
                    )
                );
            }

            ctx.restore();
        },

        drawArrow(ctx, start, end) {
            const angle = Math.atan2(
                end.y - start.y,
                end.x - start.x
            );

            const head = Math.max(
                10,
                this.currentSize * 3.2
            );

            ctx.beginPath();

            ctx.moveTo(
                start.x,
                start.y
            );

            ctx.lineTo(
                end.x,
                end.y
            );

            ctx.stroke();

            ctx.beginPath();

            ctx.moveTo(
                end.x,
                end.y
            );

            ctx.lineTo(
                end.x -
                head *
                Math.cos(
                    angle -
                    Math.PI / 6
                ),

                end.y -
                head *
                Math.sin(
                    angle -
                    Math.PI / 6
                )
            );

            ctx.lineTo(
                end.x -
                head *
                Math.cos(
                    angle +
                    Math.PI / 6
                ),

                end.y -
                head *
                Math.sin(
                    angle +
                    Math.PI / 6
                )
            );

            ctx.closePath();

            if (
                this.shapeMode === 'fill'
            ) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
        },

        drawStar(
            ctx,
            cx,
            cy,
            outerRadius,
            innerRadius
        ) {
            let angle = -Math.PI / 2;

            const step =
                Math.PI / 5;

            ctx.beginPath();

            for (
                let i = 0;
                i < 10;
                i++
            ) {
                const radius =
                    i % 2 === 0
                        ? outerRadius
                        : innerRadius;

                const px =
                    cx +
                    Math.cos(angle) *
                    radius;

                const py =
                    cy +
                    Math.sin(angle) *
                    radius;

                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }

                angle += step;
            }

            ctx.closePath();

            if (
                this.shapeMode === 'fill'
            ) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
        },

        insertText(point) {
            const text =
                window.prompt(
                    'Nhập nội dung cần chèn:'
                );

            if (!text) return;

            const object = {
                id: this.createObjectId(),
                type: 'text',

                x: point.x,
                y: point.y,

                text:
                    String(text),

                fontSize:
                    Math.max(
                        14,
                        Math.round(
                            this.currentSize
                        )
                    ),

                fontFamily:
                    this.currentFontFamily,

                color:
                    this.currentColor,

                opacity:
                    this.currentOpacity
            };

            this.objects.push(
                object
            );

            this.selectedObjectId =
                object.id;

            this.refreshObjects();

            this.markChanged(true);
            this.pushHistory();

            this.setTool('select');
        },

        hexToRgba(hex, alpha = 255) {
            const normalized =
                hex.replace('#', '');

            return [
                parseInt(
                    normalized.slice(0, 2),
                    16
                ),

                parseInt(
                    normalized.slice(2, 4),
                    16
                ),

                parseInt(
                    normalized.slice(4, 6),
                    16
                ),

                alpha
            ];
        },

        floodFill(startX, startY) {
            if (
                !this.ctx ||
                startX < 0 ||
                startY < 0 ||
                startX >= this.canvas.width ||
                startY >= this.canvas.height
            ) {
                return;
            }

            const image =
                this.ctx.getImageData(
                    0,
                    0,
                    this.canvas.width,
                    this.canvas.height
                );

            const data = image.data;
            const width = this.canvas.width;
            const height = this.canvas.height;

            const startIndex =
                (
                    startY *
                    width +
                    startX
                ) * 4;

            const target = [
                data[startIndex],
                data[startIndex + 1],
                data[startIndex + 2],
                data[startIndex + 3]
            ];

            const replacement =
                this.hexToRgba(
                    this.currentColor,
                    Math.round(
                        this.currentOpacity *
                        255
                    )
                );

            const tolerance =
                this.fillTolerance * 2.55;

            const matches = idx =>
                Math.abs(
                    data[idx] -
                    target[0]
                ) <= tolerance &&

                Math.abs(
                    data[idx + 1] -
                    target[1]
                ) <= tolerance &&

                Math.abs(
                    data[idx + 2] -
                    target[2]
                ) <= tolerance &&

                Math.abs(
                    data[idx + 3] -
                    target[3]
                ) <= tolerance;

            if (
                target.every(
                    (value, index) =>
                        Math.abs(
                            value -
                            replacement[index]
                        ) <= tolerance
                )
            ) {
                return;
            }

            const stack =
                new Int32Array(
                    width * height
                );

            const visited =
                new Uint8Array(
                    width * height
                );

            let stackSize = 0;

            const startPosition =
                startY * width + startX;

            stack[stackSize++] =
                startPosition;

            visited[startPosition] = 1;

            const pushOnce = position => {
                if (!visited[position]) {
                    visited[position] = 1;
                    stack[stackSize++] =
                        position;
                }
            };

            while (stackSize > 0) {
                const position =
                    stack[--stackSize];

                const x =
                    position % width;

                const y =
                    (position / width) | 0;

                const index =
                    position * 4;

                if (!matches(index)) {
                    continue;
                }

                data[index] =
                    replacement[0];

                data[index + 1] =
                    replacement[1];

                data[index + 2] =
                    replacement[2];

                data[index + 3] =
                    replacement[3];

                if (x > 0) {
                    pushOnce(
                        position - 1
                    );
                }

                if (x < width - 1) {
                    pushOnce(
                        position + 1
                    );
                }

                if (y > 0) {
                    pushOnce(
                        position - width
                    );
                }

                if (y < height - 1) {
                    pushOnce(
                        position + width
                    );
                }
            }

            this.ctx.putImageData(
                image,
                0,
                0
            );
        },

        pickColor(point) {
            const pixel =
                this.ctx.getImageData(
                    Math.floor(point.x),
                    Math.floor(point.y),
                    1,
                    1
                ).data;

            const hex = `#${[
                pixel[0],
                pixel[1],
                pixel[2]
            ]
                .map(value =>
                    value
                        .toString(16)
                        .padStart(2, '0')
                )
                .join('')
                }`;

            this.setColor(hex);
            this.setTool('brush');

            this.toast(
                `Đã lấy màu ${hex}`,
                'success'
            );
        },

        setTool(tool) {
            if (!TOOL_LABELS[tool]) {
                return;
            }

            this.currentTool = tool;

            this.updateToolUI();
        },

        setColor(color) {
            if (
                !/^#[0-9a-f]{6}$/i.test(
                    color || ''
                )
            ) {
                return;
            }

            this.currentColor = color;

            const input =
                document.getElementById(
                    'hh-color'
                );

            const chip =
                document.getElementById(
                    'hh-color-chip'
                );

            if (
                input &&
                input.value !== color
            ) {
                input.value = color;
            }

            if (chip) {
                chip.style.setProperty(
                    '--hh-current-color',
                    color
                );
            }
        },

        updateToolUI() {
            document
                .querySelectorAll(
                    '.hh-tool-button'
                )
                .forEach(button => {
                    button.classList.toggle(
                        'active',
                        button.dataset.tool ===
                        this.currentTool
                    );
                });

            document
                .getElementById(
                    'hh-text-options'
                )
                ?.classList.toggle(
                    'active',
                    this.currentTool === 'text'
                );

            if (this.previewCanvas) {
                const cursors = {
                    select: 'default',
                    picker: 'copy',
                    fill: 'cell',
                    eraser: 'crosshair',
                    text: 'text'
                };

                this.previewCanvas.style.cursor =
                    cursors[this.currentTool] ||
                    'crosshair';
            }
        },

        toggleMirror(axis) {
            if (axis === 'x') this.mirrorX = !this.mirrorX;
            if (axis === 'y') this.mirrorY = !this.mirrorY;
            document.getElementById('hh-mirror-x')?.classList.toggle('active', this.mirrorX);
            document.getElementById('hh-mirror-y')?.classList.toggle('active', this.mirrorY);
        },

        toggleGrid() {
            this.gridEnabled = !this.gridEnabled;
            document.getElementById('hh-grid-overlay')?.classList.toggle('active', this.gridEnabled);
            document.getElementById('hh-grid-button')?.classList.toggle('active', this.gridEnabled);
        },

        setZoom(value) {
            this.zoom = this.clamp(Math.round(value * 10) / 10, 0.5, 2.5);
            if (this.canvasStage) this.canvasStage.style.width = `${this.zoom * 100}%`;
            const output = document.getElementById('hh-zoom-value');
            if (output) output.textContent = `${Math.round(this.zoom * 100)}%`;
        },

        async toggleFullscreen() {
            /*
             * Mở toàn bộ workspace, gồm cả:
             * - thanh bút bên trái
             * - khu vực bảng vẽ
             */
            const workspace =
                document.querySelector(
                    '#hoihoaStudentModal .hh-workspace'
                );

            if (!workspace) return;

            try {
                if (
                    document.fullscreenElement ===
                    workspace
                ) {
                    await document.exitFullscreen();
                    return;
                }

                /*
                 * Nếu đang fullscreen một phần tử khác,
                 * thoát trước rồi mới mở workspace.
                 */
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                }

                await workspace.requestFullscreen();
            } catch (error) {
                console.error(
                    'Không thể mở toàn màn hình:',
                    error
                );

                this.toast(
                    'Trình duyệt không cho phép toàn màn hình.',
                    'warning'
                );
            }
        },

        resetHistory() {
            this.history = [];
            this.historyStep = -1;
        },

        pushHistory() {
            if (!this.canvas) return;

            const config =
                this.getRoundConfig(
                    this.currentRound
                );

            const snapshot = {
                image:
                    this.canvas.toDataURL(
                        'image/webp',
                        0.92
                    ),

                objects:
                    this.cloneObjects()
            };

            if (
                this.historyStep <
                this.history.length - 1
            ) {
                this.history =
                    this.history.slice(
                        0,
                        this.historyStep + 1
                    );
            }

            this.history.push(
                snapshot
            );

            if (
                this.history.length >
                config.historyLimit
            ) {
                this.history.shift();
            }

            this.historyStep =
                this.history.length - 1;

            this.updateHistoryButtons();
        },

        async restoreHistoryStep() {
            if (
                !this.canvas ||
                this.historyStep < 0 ||
                !this.history[
                this.historyStep
                ]
            ) {
                return;
            }

            const snapshot =
                this.history[
                this.historyStep
                ];

            const imageSource =
                typeof snapshot === 'string'
                    ? snapshot
                    : snapshot.image;

            const image =
                await this.loadImage(
                    imageSource
                );

            this.ctx.clearRect(
                0,
                0,
                this.canvas.width,
                this.canvas.height
            );

            this.ctx.drawImage(
                image,
                0,
                0,
                this.canvas.width,
                this.canvas.height
            );

            await this.preloadObjectImages();

            this.selectedObjectId = null;

            this.refreshObjects();

            this.objects =
                typeof snapshot === 'object'
                    ? this.cloneObjects(
                        snapshot.objects || []
                    )
                    : [];

            this.selectedObjectId = null;

            await this.preloadObjectImages();

            this.refreshObjects();

            this.markChanged(false);
            this.updateHistoryButtons();
        },

        undo() {
            if (this.historyStep <= 0) return;
            this.historyStep--;
            this.restoreHistoryStep();
        },

        redo() {
            if (this.historyStep >= this.history.length - 1) return;
            this.historyStep++;
            this.restoreHistoryStep();
        },

        updateHistoryButtons() {
            const undo = document.querySelector('[data-hh-action="undo"]');
            const redo = document.querySelector('[data-hh-action="redo"]');
            if (undo) undo.disabled = this.historyStep <= 0;
            if (redo) redo.disabled = this.historyStep >= this.history.length - 1;
        },

        async clearCanvas(ask = false) {
            if (!this.ctx || !this.currentRound) return;
            if (ask && !(await this.confirmDialog('Xóa toàn bộ nét vẽ hiện tại? Bạn vẫn có thể hoàn tác ngay sau đó.', 'Xóa bảng vẽ'))) return;
            const config = this.getRoundConfig(this.currentRound);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = config.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.objects = [];
            this.selectedObjectId = null;
            this.objectImageCache = new Map();

            this.refreshObjects();

            this.hasDrawnContent = false;
            this.markChanged(false);
            this.pushHistory();
        },

        markChanged(content = true) {
            this.isDirty = true;
            if (content) this.hasDrawnContent = true;
            const dot = document.getElementById('hh-save-dot');
            const status = document.getElementById('hh-draft-status');
            if (dot) dot.classList.add('dirty');
            if (status) status.textContent = 'Có thay đổi chưa lưu';
        },

        getDraftKey() {
            if (
                this.studioMode === 'practice' ||
                this.currentRound?.id ===
                'practice_free'
            ) {
                return `hh_practice_v2_${this.user.username}`;
            }

            return `hh_draft_v2_${this.user.username}_${this.currentRound.id}`;
        },

        getLegacyDraftKey() {
            if (
                this.studioMode === 'practice' ||
                this.currentRound?.id ===
                'practice_free'
            ) {
                return `hh_practice_${this.user.username}`;
            }

            return `hh_draft_${this.user.username}_${this.currentRound.id}`;
        },

        async restoreDraft() {
            if (!this.canvas || !this.currentRound) return;
            let raw = localStorage.getItem(this.getDraftKey());
            let image = '';
            let savedAt = 0;
            try {
                if (raw) {
                    const parsed = JSON.parse(raw);
                    image = parsed.image || '';
                    savedAt = Number(parsed.savedAt || 0);
                    this.objects =
                        Array.isArray(
                            parsed.objects
                        )
                            ? this.cloneObjects(
                                parsed.objects
                            )
                            : [];
                    if (parsed.settings) {
                        this.currentColor = parsed.settings.color || this.currentColor;
                        this.currentSize = Number(parsed.settings.size || this.currentSize);
                        this.currentOpacity = Number(parsed.settings.opacity || this.currentOpacity);
                        this.currentFontFamily =
                            parsed.settings.fontFamily ||
                            this.currentFontFamily;
                    }
                }
            } catch (_) {
                image = raw || '';
            }

            if (!image) {
                const legacy = localStorage.getItem(this.getLegacyDraftKey());
                if (legacy && legacy.startsWith('data:image/')) image = legacy;
            }
            if (!image) return;

            try {
                const img = await this.loadImage(image);
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.hasDrawnContent = true;
                const status = document.getElementById('hh-draft-status');
                if (status) status.textContent = savedAt ? `Đã khôi phục nháp ${this.formatDateTime(savedAt)}` : 'Đã khôi phục bản nháp cũ';
                this.setColor(this.currentColor);
            } catch (error) {
                console.warn('Không thể khôi phục nháp hội họa:', error);
            }
        },

        saveDraft(force = false) {
            if (!this.canvas || !this.currentRound || (!this.isDirty && !force)) return;
            try {
                const payload = {
                    version: 2,
                    roundId: this.currentRound.id,
                    width: this.canvas.width,
                    height: this.canvas.height,
                    savedAt: Date.now(),
                    image: this.canvas.toDataURL('image/webp', 0.9),
                    objects: this.cloneObjects(),
                    settings: {
                        color: this.currentColor,
                        size: this.currentSize,
                        opacity: this.currentOpacity,
                        fontFamily: this.currentFontFamily
                    }
                };
                localStorage.setItem(this.getDraftKey(), JSON.stringify(payload));
                this.isDirty = false;
                const dot = document.getElementById('hh-save-dot');
                const status = document.getElementById('hh-draft-status');
                if (dot) dot.classList.remove('dirty');
                if (status) status.textContent = `Đã lưu nháp lúc ${new Date().toLocaleTimeString('vi-VN')}`;
            } catch (error) {
                console.warn(error);
                this.toast('Bộ nhớ trình duyệt đã đầy. Hãy tải bản dự phòng về máy.', 'warning');
            }
        },

        getExportCanvas() {
            const config =
                this.getRoundConfig(
                    this.currentRound
                );

            /*
             * Nếu người dùng đang xem trước hiệu ứng
             * nhưng chưa nhấn Áp dụng, ảnh tải xuống
             * hoặc ảnh nộp vẫn có đầy đủ hiệu ứng.
             */
            const source =
                this.hasPendingAdjustments()
                    ? this.createAdjustedCanvas(
                        this.canvas
                    )
                    : this.canvas;

            const output =
                document.createElement(
                    'canvas'
                );

            output.width =
                this.canvas.width;

            output.height =
                this.canvas.height;

            const ctx =
                output.getContext('2d');

            ctx.fillStyle =
                config.backgroundColor;

            ctx.fillRect(
                0,
                0,
                output.width,
                output.height
            );

            ctx.drawImage(
                source,
                0,
                0
            );

            this.renderObjectLayer();

            ctx.drawImage(
                this.objectCanvas,
                0,
                0
            );

            return output;
        },

        /*
         * Mở hoặc đóng bảng chỉnh ảnh.
         */
        toggleAdjustmentPanel() {
            const panel =
                document.getElementById(
                    'hh-adjust-panel'
                );

            if (!panel) return;

            panel.hidden =
                !panel.hidden;

            document
                .getElementById(
                    'hh-adjust-toggle'
                )
                ?.classList.toggle(
                    'active',
                    !panel.hidden
                );
        },

        /*
         * Kiểm tra người dùng có chỉnh bất kỳ
         * thông số ảnh nào hay chưa.
         */
        hasPendingAdjustments() {
            return Object
                .values(
                    this.imageAdjustments
                )
                .some(value => {
                    return Math.abs(
                        Number(value) || 0
                    ) > 0.001;
                });
        },

        /*
         * Xem trước hiệu ứng trực tiếp trên canvas.
         *
         * Đây mới chỉ là hiệu ứng CSS, chưa làm thay
         * đổi dữ liệu pixel thật của bức tranh.
         */
        previewImageAdjustments() {
            if (!this.canvas) return;

            const adjustments =
                this.imageAdjustments;

            const temperature =
                Number(
                    adjustments.temperature ||
                    0
                );

            /*
             * Nhiệt độ dương:
             * làm ảnh ấm hơn.
             *
             * Nhiệt độ âm:
             * làm ảnh lạnh hơn.
             */
            const sepia =
                Math.max(
                    0,
                    temperature
                ) * 0.28;

            const hue =
                temperature >= 0
                    ? temperature * -0.08
                    : Math.abs(
                        temperature
                    ) * 0.12;

            this.canvas.style.filter = [
                `brightness(${Math.max(
                    0,
                    100 +
                    Number(
                        adjustments
                            .brightness ||
                        0
                    )
                )
                }%)`,

                `contrast(${Math.max(
                    0,
                    100 +
                    Number(
                        adjustments
                            .contrast ||
                        0
                    )
                )
                }%)`,

                `saturate(${Math.max(
                    0,
                    100 +
                    Number(
                        adjustments
                            .saturation ||
                        0
                    )
                )
                }%)`,

                `sepia(${sepia}%)`,

                `hue-rotate(${hue}deg)`,

                `grayscale(${Math.max(
                    0,
                    Number(
                        adjustments
                            .grayscale ||
                        0
                    )
                )
                }%)`,

                `blur(${Math.max(
                    0,
                    Number(
                        adjustments.blur ||
                        0
                    )
                )
                }px)`
            ].join(' ');
        },

        /*
         * Đặt tất cả thanh chỉnh ảnh về 0.
         */
        resetImageAdjustments(
            showToast = true
        ) {
            Object
                .keys(
                    this.imageAdjustments
                )
                .forEach(key => {
                    this.imageAdjustments[key] =
                        0;

                    const input =
                        document.querySelector(
                            `[data-hh-setting="adjust-${key}"]`
                        );

                    const output =
                        document.getElementById(
                            `hh-adjust-${key}-output`
                        );

                    if (input) {
                        input.value = 0;
                    }

                    if (output) {
                        output.textContent =
                            key === 'blur'
                                ? '0 px'
                                : '0%';
                    }
                });

            /*
             * Xóa hiệu ứng xem trước CSS.
             */
            if (this.canvas) {
                this.canvas.style.filter =
                    'none';
            }

            if (showToast) {
                this.toast(
                    'Đã đặt lại các thông số chỉnh ảnh.',
                    'success'
                );
            }
        },

        /*
         * Tạo một canvas mới đã được áp dụng
         * các hiệu ứng ảnh bằng xử lý pixel thật.
         *
         * Không sửa trực tiếp canvas chính cho đến
         * khi người dùng nhấn nút Áp dụng.
         */
        createAdjustedCanvas(
            sourceCanvas
        ) {
            const result =
                document.createElement(
                    'canvas'
                );

            result.width =
                sourceCanvas.width;

            result.height =
                sourceCanvas.height;

            const resultCtx =
                result.getContext(
                    '2d',
                    {
                        willReadFrequently:
                            true
                    }
                );

            resultCtx.drawImage(
                sourceCanvas,
                0,
                0
            );

            const adjustments =
                this.imageAdjustments;

            /*
             * Chuyển khoảng -100 đến 100 thành
             * giá trị phù hợp cho pixel 0 đến 255.
             */
            const brightness =
                Number(
                    adjustments.brightness ||
                    0
                ) * 2.55;

            const contrastValue =
                this.clamp(
                    Number(
                        adjustments.contrast ||
                        0
                    ) * 2.55,
                    -255,
                    255
                );

            const contrast =
                (
                    259 *
                    (
                        contrastValue +
                        255
                    )
                ) /
                (
                    255 *
                    (
                        259 -
                        contrastValue ||
                        1
                    )
                );

            const saturation =
                Number(
                    adjustments.saturation ||
                    0
                ) / 100;

            const temperature =
                Number(
                    adjustments.temperature ||
                    0
                ) * 0.9;

            const grayscale =
                this.clamp(
                    Number(
                        adjustments.grayscale ||
                        0
                    ) / 100,
                    0,
                    1
                );

            /*
             * Chỉ đọc và xử lý pixel khi có
             * hiệu ứng màu cần áp dụng.
             */
            if (
                brightness ||
                contrastValue ||
                saturation ||
                temperature ||
                grayscale
            ) {
                const image =
                    resultCtx.getImageData(
                        0,
                        0,
                        result.width,
                        result.height
                    );

                const data =
                    image.data;

                for (
                    let i = 0;
                    i < data.length;
                    i += 4
                ) {
                    /*
                     * Độ sáng và nhiệt độ màu.
                     *
                     * Nhiệt độ dương:
                     * tăng đỏ, giảm xanh lam.
                     *
                     * Nhiệt độ âm:
                     * giảm đỏ, tăng xanh lam.
                     */
                    let red =
                        data[i] +
                        brightness +
                        temperature;

                    let green =
                        data[i + 1] +
                        brightness +
                        temperature * 0.12;

                    let blue =
                        data[i + 2] +
                        brightness -
                        temperature;

                    /*
                     * Tương phản.
                     */
                    red =
                        contrast *
                        (
                            red - 128
                        ) +
                        128;

                    green =
                        contrast *
                        (
                            green - 128
                        ) +
                        128;

                    blue =
                        contrast *
                        (
                            blue - 128
                        ) +
                        128;

                    /*
                     * Tính độ sáng cảm nhận
                     * của pixel hiện tại.
                     */
                    const luminance =
                        red * 0.2126 +
                        green * 0.7152 +
                        blue * 0.0722;

                    /*
                     * Độ bão hòa.
                     */
                    red =
                        luminance +
                        (
                            red -
                            luminance
                        ) *
                        (
                            1 +
                            saturation
                        );

                    green =
                        luminance +
                        (
                            green -
                            luminance
                        ) *
                        (
                            1 +
                            saturation
                        );

                    blue =
                        luminance +
                        (
                            blue -
                            luminance
                        ) *
                        (
                            1 +
                            saturation
                        );

                    /*
                     * Chuyển dần sang trắng đen.
                     */
                    red =
                        red *
                        (
                            1 -
                            grayscale
                        ) +
                        luminance *
                        grayscale;

                    green =
                        green *
                        (
                            1 -
                            grayscale
                        ) +
                        luminance *
                        grayscale;

                    blue =
                        blue *
                        (
                            1 -
                            grayscale
                        ) +
                        luminance *
                        grayscale;

                    /*
                     * Giới hạn lại màu trong
                     * khoảng hợp lệ 0–255.
                     */
                    data[i] =
                        this.clamp(
                            Math.round(red),
                            0,
                            255
                        );

                    data[i + 1] =
                        this.clamp(
                            Math.round(green),
                            0,
                            255
                        );

                    data[i + 2] =
                        this.clamp(
                            Math.round(blue),
                            0,
                            255
                        );

                    /*
                     * data[i + 3] là độ trong suốt.
                     * Không thay đổi giá trị này.
                     */
                }

                resultCtx.putImageData(
                    image,
                    0,
                    0
                );
            }

            /*
             * Làm mờ được áp dụng riêng sau khi
             * đã xử lý độ sáng và màu sắc.
             */
            const blur =
                Math.max(
                    0,
                    Number(
                        adjustments.blur ||
                        0
                    )
                );

            if (blur > 0) {
                const blurred =
                    document.createElement(
                        'canvas'
                    );

                blurred.width =
                    result.width;

                blurred.height =
                    result.height;

                const blurredCtx =
                    blurred.getContext('2d');

                blurredCtx.filter =
                    `blur(${blur}px)`;

                blurredCtx.drawImage(
                    result,
                    0,
                    0
                );

                return blurred;
            }

            return result;
        },

        /*
         * Ghi các hiệu ứng vào canvas chính.
         *
         * Sau khi áp dụng, người dùng có thể
         * hoàn tác bằng nút Undo hoặc Ctrl + Z.
         */
        applyImageAdjustments() {
            if (
                !this.canvas ||
                !this.ctx
            ) {
                return;
            }

            if (
                !this.hasPendingAdjustments()
            ) {
                this.toast(
                    'Chưa có thông số chỉnh ảnh nào thay đổi.',
                    'warning'
                );

                return;
            }

            const adjusted =
                this.createAdjustedCanvas(
                    this.canvas
                );

            this.ctx.save();

            /*
             * Đặt lại mọi phép biến đổi trước khi
             * vẽ ảnh đã chỉnh vào canvas chính.
             */
            this.ctx.setTransform(
                1,
                0,
                0,
                1,
                0,
                0
            );

            this.ctx.clearRect(
                0,
                0,
                this.canvas.width,
                this.canvas.height
            );

            this.ctx.drawImage(
                adjusted,
                0,
                0
            );

            this.ctx.restore();

            /*
             * Xóa thông số và hiệu ứng xem trước
             * vì hiệu ứng đã nằm trong pixel thật.
             */
            this.resetImageAdjustments(
                false
            );

            this.markChanged();
            this.pushHistory();

            this.toast(
                'Đã áp dụng chỉnh ảnh vào tác phẩm.',
                'success'
            );
        },

        triggerPracticeImageUpload() {
            if (
                this.studioMode !== 'practice'
            ) {
                this.toast(
                    'Chỉ được tải ảnh trong chế độ Luyện tập.',
                    'warning'
                );

                return;
            }

            const input =
                document.getElementById(
                    'hh-practice-image-input'
                );

            if (!input) {
                this.toast(
                    'Không tìm thấy bộ chọn ảnh.',
                    'error'
                );

                return;
            }

            /*
             * Xóa giá trị cũ để có thể chọn lại
             * chính file vừa chọn trước đó.
             */
            input.value = '';
            input.click();
        },

        readFileAsDataURL(file) {
            return new Promise(
                (resolve, reject) => {
                    const reader =
                        new FileReader();

                    reader.onload = () =>
                        resolve(
                            String(
                                reader.result ||
                                ''
                            )
                        );

                    reader.onerror = () =>
                        reject(
                            new Error(
                                'Không đọc được file ảnh.'
                            )
                        );

                    reader.readAsDataURL(
                        file
                    );
                }
            );
        },

        async handlePracticeImageUpload(file) {
            if (!file) return;

            if (
                this.studioMode !== 'practice'
            ) {
                this.toast(
                    'Tải ảnh chỉ khả dụng trong chế độ Luyện tập.',
                    'warning'
                );

                return;
            }

            if (
                !this.canvas ||
                !this.ctx ||
                !this.previewCanvas ||
                !this.previewCtx
            ) {
                this.toast(
                    'Bảng vẽ chưa sẵn sàng.',
                    'error'
                );

                return;
            }

            const allowedTypes = [
                'image/png',
                'image/jpeg',
                'image/webp'
            ];

            const validExtension =
                /\.(png|jpe?g|webp)$/i.test(
                    file.name || ''
                );

            if (
                !allowedTypes.includes(file.type) &&
                !validExtension
            ) {
                this.toast(
                    'Chỉ hỗ trợ ảnh PNG, JPG, JPEG hoặc WebP.',
                    'error'
                );

                return;
            }

            const maxBytes =
                12 * 1024 * 1024;

            if (file.size > maxBytes) {
                this.toast(
                    'Ảnh vượt quá giới hạn 12 MB.',
                    'error'
                );

                return;
            }

            /*
             * Nếu đã vẽ hoặc đã tải ảnh trước đó,
             * hỏi xác nhận trước khi thay ảnh.
             */
            if (
                this.hasDrawnContent ||
                this.isDirty
            ) {
                const accepted =
                    await this.confirmDialog(
                        'Tải ảnh vào bảng vẽ',
                        false
                    );

                if (!accepted) return;
            }

            try {
                const dataUrl =
                    await this.readFileAsDataURL(
                        file
                    );

                const image =
                    await this.loadImage(
                        dataUrl
                    );

                const imageWidth =
                    Number(
                        image.naturalWidth ||
                        image.width
                    );

                const imageHeight =
                    Number(
                        image.naturalHeight ||
                        image.height
                    );

                if (
                    !imageWidth ||
                    !imageHeight
                ) {
                    throw new Error(
                        'Không đọc được kích thước ảnh.'
                    );
                }

                const scale = Math.min(
                    (
                        this.canvas.width *
                        0.8
                    ) / imageWidth,

                    (
                        this.canvas.height *
                        0.8
                    ) / imageHeight,

                    1
                );

                const width =
                    Math.round(
                        imageWidth * scale
                    );

                const height =
                    Math.round(
                        imageHeight * scale
                    );

                const object = {
                    id: this.createObjectId(),
                    type: 'image',

                    src: dataUrl,

                    x: Math.round(
                        (
                            this.canvas.width -
                            width
                        ) / 2
                    ),

                    y: Math.round(
                        (
                            this.canvas.height -
                            height
                        ) / 2
                    ),

                    width,
                    height,
                    opacity: 1
                };

                this.objectImageCache.set(
                    dataUrl,
                    {
                        image,
                        promise: null
                    }
                );

                this.objects.push(
                    object
                );

                this.selectedObjectId =
                    object.id;

                this.refreshObjects();

                this.markChanged(true);
                this.pushHistory();
                this.saveDraft(true);

                this.setTool('select');

                const status =
                    document.getElementById(
                        'hh-draft-status'
                    );

                if (status) {
                    status.textContent =
                        `Đã chèn ảnh “${file.name}” — kéo ảnh để di chuyển`;
                }

                this.toast(
                    'Đã chèn ảnh. Bạn có thể kéo ảnh đến vị trí khác.',
                    'success'
                );
            } catch (error) {
                console.error(
                    'Không thể chèn ảnh:',
                    error
                );

                this.toast(
                    `Không đọc được ảnh: ${error.message ||
                    'file không hợp lệ'
                    }`,
                    'error'
                );
            } finally {
                const input =
                    document.getElementById(
                        'hh-practice-image-input'
                    );

                if (input) {
                    input.value = '';
                }
            }
        },

        downloadBackup() {
            if (!this.canvas) return;

            const output =
                this.getExportCanvas();

            const link =
                document.createElement('a');

            const defaultTitle =
                this.studioMode === 'practice'
                    ? 'luyen-tap-hoi-hoa'
                    : 'tac-pham';

            const safeTitle = String(
                this.currentRound?.title ||
                defaultTitle
            )
                .replace(
                    /[^a-z0-9\p{L}]+/giu,
                    '-'
                )
                .replace(/^-|-$/g, '');

            link.download =
                `${safeTitle || defaultTitle}-` +
                `${this.user.username}-` +
                `${Date.now()}.png`;

            link.href =
                output.toDataURL('image/png');

            link.click();

            this.toast(
                this.studioMode === 'practice'
                    ? 'Đã lưu ảnh luyện tập PNG về máy.'
                    : 'Đã tạo bản dự phòng PNG.',
                'success'
            );
        },

        async submitArtwork() {
            if (
                this.studioMode === 'practice'
            ) {
                this.downloadBackup();
                return;
            }
            if (!this.canvas || !this.currentRound || this.isSubmitting) return;
            if (Date.now() < Number(this.currentRound.startTime) || Date.now() > Number(this.currentRound.endTime)) {
                this.toast('Vòng thi hiện không nhận bài.', 'error');
                return;
            }
            if (!this.hasDrawnContent) {
                this.toast('Bảng vẽ đang trống. Hãy tạo tác phẩm trước khi nộp.', 'warning');
                return;
            }
            const accepted = await this.confirmDialog('Nộp tác phẩm và khóa bài vĩnh viễn? Hãy tải bản dự phòng trước khi nộp nếu cần.', 'Nộp tác phẩm', false);
            if (!accepted) return;

            this.isSubmitting = true;
            const button = document.getElementById('hh-submit-btn');
            if (button) {
                button.disabled = true;
                button.textContent = 'Đang nộp...';
            }

            const output = this.getExportCanvas();
            const imageBase64 = output.toDataURL('image/png');
            const sizeInBytes = this.estimateBase64Bytes(imageBase64);
            if (sizeInBytes > DEFAULTS.maxImageBytes) {
                this.toast('Ảnh vượt giới hạn 9 MB. Hãy giảm kích thước vòng thi hoặc nét vẽ.', 'error');
                this.isSubmitting = false;
                if (button) {
                    button.disabled = false;
                    button.textContent = 'Nộp tác phẩm';
                }
                return;
            }

            const id = `${this.currentRound.id}_${this.user.username}`;
            const payload = {
                id,
                roundId: this.currentRound.id,
                studentUsername: this.user.username,
                studentName: this.user.name,
                imageBase64,
                submitTime: Date.now(),
                teacherScore: 0,
                teacherFeedback: '',
                votes: 0,
                voters: {},
                finalScore: 0,
                rank: 0,
                schemaVersion: 2,
                canvasMeta: {
                    width: output.width,
                    height: output.height,
                    backgroundColor: this.getRoundConfig(this.currentRound).backgroundColor,
                    appVersion: this.version
                }
            };

            try {
                const ref = db.ref(`hoihoa_submissions/${id}`);
                const transaction = await ref.transaction(current => current || payload);
                if (!transaction.committed || (transaction.snapshot.val() || {}).studentUsername !== this.user.username) {
                    throw new Error('Bài đã tồn tại hoặc không thể khóa bài.');
                }
                localStorage.removeItem(this.getDraftKey());
                localStorage.removeItem(this.getLegacyDraftKey());
                this.isDirty = false;
                this.toast('Tác phẩm đã được nộp và khóa thành công.', 'success');
                await this.selectRound(this.currentRound.id);
            } catch (error) {
                console.error(error);
                this.toast(`Nộp bài thất bại: ${error.message || 'kiểm tra kết nối và Firebase Rules.'}`, 'error');
            } finally {
                this.isSubmitting = false;
                if (button) {
                    button.disabled = false;
                    button.textContent = 'Nộp tác phẩm';
                }
            }
        },

        estimateBase64Bytes(value) {
            const base64 = String(value).split(',')[1] || '';
            const padding = (base64.match(/=*$/) || [''])[0].length;
            return Math.floor(base64.length * 3 / 4) - padding;
        },

        async renderVotingArea(container) {
            container.innerHTML = this.loadingHTML('Đang dựng triển lãm...');
            const submissions =
                await this.getSubmissionsForRound(
                    this.currentRound.id
                );
            if (!submissions.length) {
                container.innerHTML = this.emptyStateHTML('🖼️', 'Chưa có tác phẩm', 'Vòng này không có bài nộp để bình chọn.');
                return;
            }

            const config = this.getRoundConfig(this.currentRound);
            const existingVotes = submissions.filter(sub => sub.voters && sub.voters[this.user.username]).map(sub => sub.id || sub._fbKey);
            await this.syncVoteUsage(existingVotes, config.maxVotes);
            this.myVotesCount = existingVotes.length;

            const ordered = this.stableShuffle(submissions, `${this.currentRound.id}:${this.user.username}`);
            container.innerHTML = `
                <section class="hh-gallery-header">
                    <div>
                        <span class="hh-eyebrow">TRIỂN LÃM ẨN DANH</span>
                        <h3>Chọn tác phẩm khiến bạn ấn tượng nhất</h3>
                        <p>Mỗi tài khoản được bình chọn tối đa ${config.maxVotes} tác phẩm và không thể bình chọn cho chính mình.</p>
                    </div>
                    <div class="hh-vote-meter">
                        <strong id="hh-vote-count">${this.myVotesCount}</strong><span>/${config.maxVotes}</span>
                        <small>lượt đã dùng</small>
                    </div>
                </section>
                <div class="hoihoa-gallery">
                    ${ordered.map(sub => this.renderArtworkCard(sub, config)).join('')}
                </div>
            `;
        },

        renderArtworkCard(sub, config) {
            const safeImage = this.safeDataImage(sub.imageBase64);
            if (!safeImage) return '';
            const isMine = sub.studentUsername === this.user.username;
            const hasVoted = !!(sub.voters && sub.voters[this.user.username]);
            const voteCount = this.getVoteCount(sub);
            const author = config.anonymousVoting && !isMine ? 'Ẩn danh' : (sub.studentName || sub.studentUsername || 'Không rõ');
            let action = '';
            if (isMine) action = '<div class="hh-own-artwork">Tác phẩm của bạn</div>';
            else if (hasVoted) action = '<button type="button" class="vote-btn voted" disabled>✓ Đã bình chọn</button>';
            else action = `<button type="button" class="vote-btn" id="vote-btn-${this.escapeHTML(sub.id)}" data-hh-action="vote" data-submission-id="${this.escapeHTML(sub.id)}">Bình chọn</button>`;
            return `
                <article class="artwork-card" data-votes="${voteCount}">
                    <button type="button" class="hh-artwork-image-button" data-hh-action="preview">
                        <img src="${safeImage}" class="artwork-img" alt="Tác phẩm của ${this.escapeHTML(author)}" loading="lazy">
                        <span>Phóng to</span>
                    </button>
                    <div class="hh-artwork-body">
                        <h4>${this.escapeHTML(author)}</h4>
                        <p><span id="vote-val-${this.escapeHTML(sub.id)}">${voteCount}</span> lượt yêu thích</p>
                        ${action}
                    </div>
                </article>
            `;
        },

        async getSubmissionsForRound(roundId) {
            const targetRoundId = String(roundId ?? '').trim();

            if (!targetRoundId) return [];

            // Đọc toàn bộ rồi tự lọc để tương thích:
            // - roundId dạng chuỗi
            // - roundId dạng số
            // - bài cũ thiếu roundId nhưng khóa có dạng ROUND_USERNAME
            const snap = await db.ref('hoihoa_submissions').once('value');
            const submissions = [];

            snap.forEach(child => {
                const sub = child.val();

                if (!sub || typeof sub !== 'object') return;

                const submissionKey = String(child.key || '');
                const storedRoundId = String(sub.roundId ?? '').trim();

                const matchesRoundField =
                    storedRoundId === targetRoundId;

                const matchesLegacyKey =
                    submissionKey.startsWith(`${targetRoundId}_`);

                if (!matchesRoundField && !matchesLegacyKey) return;

                submissions.push({
                    ...sub,

                    // Chống bài cũ thiếu id
                    id: sub.id || child.key,

                    // Chống bài cũ thiếu roundId
                    roundId: sub.roundId ?? roundId,

                    _fbKey: child.key
                });
            });

            // Bài cũ trước, bài mới sau
            submissions.sort(
                (a, b) =>
                    Number(a.submitTime || 0) -
                    Number(b.submitTime || 0)
            );

            return submissions;
        },

        getVoteCount(submission) {
            if (submission && submission.voters && typeof submission.voters === 'object') return Object.keys(submission.voters).filter(k => submission.voters[k]).length;
            return Number(submission?.votes || 0);
        },

        async syncVoteUsage(existingIds, maxVotes) {
            if (!this.currentRound || !this.user) return;
            const ref = db.ref(`hoihoa_vote_usage/${this.currentRound.id}/${this.user.username}`);
            try {
                await ref.transaction(current => {
                    const next = current && typeof current === 'object' ? { ...current } : {};
                    existingIds.slice(0, maxVotes).forEach(id => { next[id] = true; });
                    return next;
                });
            } catch (error) {
                console.warn('Không đồng bộ được bộ đếm phiếu:', error);
            }
        },

        async voteArtwork(submissionId) {
            const config = this.getRoundConfig(this.currentRound);
            if (this.getEffectiveStatus(this.currentRound) !== 'voting') return this.toast('Vòng thi không ở giai đoạn bình chọn.', 'warning');
            if (this.myVotesCount >= config.maxVotes) return this.toast(`Bạn đã dùng đủ ${config.maxVotes} lượt bình chọn.`, 'warning');

            const subRef = db.ref(`hoihoa_submissions/${submissionId}`);
            const subSnap = await subRef.once('value');
            const submission = subSnap.val();
            if (!submission || submission.roundId !== this.currentRound.id) return this.toast('Tác phẩm không tồn tại.', 'error');
            if (submission.studentUsername === this.user.username) return this.toast('Bạn không thể bình chọn cho chính mình.', 'warning');
            if (submission.voters && submission.voters[this.user.username]) return this.toast('Bạn đã bình chọn tác phẩm này.', 'warning');

            const usageRef = db.ref(`hoihoa_vote_usage/${this.currentRound.id}/${this.user.username}`);
            let reserved = false;
            try {
                const usageResult = await usageRef.transaction(current => {
                    const next = current && typeof current === 'object' ? { ...current } : {};
                    if (next[submissionId]) return;
                    if (Object.keys(next).filter(key => next[key]).length >= config.maxVotes) return;
                    next[submissionId] = true;
                    reserved = true;
                    return next;
                });
                if (!usageResult.committed || !reserved) throw new Error('Đã hết lượt hoặc phiếu đã tồn tại.');

                await subRef.child(`voters/${this.user.username}`).set(true);
                this.myVotesCount++;
                const countEl = document.getElementById('hh-vote-count');
                if (countEl) countEl.textContent = this.myVotesCount;
                const btn = document.getElementById(`vote-btn-${submissionId}`);
                if (btn) {
                    btn.classList.add('voted');
                    btn.disabled = true;
                    btn.textContent = '✓ Đã bình chọn';
                }
                const voteVal = document.getElementById(`vote-val-${submissionId}`);
                if (voteVal) voteVal.textContent = String(Number(voteVal.textContent || 0) + 1);
                this.toast('Đã ghi nhận bình chọn.', 'success');
            } catch (error) {
                if (reserved) {
                    try { await usageRef.child(submissionId).remove(); } catch (_) { /* bỏ qua rollback phụ */ }
                }
                console.error(error);
                this.toast(error.message || 'Không thể bình chọn.', 'error');
            }
        },

        stableShuffle(items, seedText) {
            const result = [...items];
            let seed = 2166136261;
            for (let i = 0; i < seedText.length; i++) {
                seed ^= seedText.charCodeAt(i);
                seed = Math.imul(seed, 16777619);
            }
            const random = () => {
                seed += 0x6D2B79F5;
                let t = seed;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        },

        previewImage(image) {
            const safe = this.safeDataImage(image);
            if (!safe) return;
            const modal = document.getElementById('artworkPreviewModal');
            const img = document.getElementById('artworkPreviewImg');
            if (!modal || !img) return;
            img.src = safe;
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
        },

        closePreview() {
            const modal = document.getElementById('artworkPreviewModal');
            if (modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
            }
        },

        async renderLeaderboardArea(container) {
            container.innerHTML = this.loadingHTML('Đang dựng bảng kết quả...');
            const seasonSnap = await db.ref(`season_rankings/${this.currentRound.id}`).once('value');
            if (seasonSnap.exists()) {
                const rankings = Object.values(seasonSnap.val()).sort((a, b) => Number(a.rank) - Number(b.rank));
                container.innerHTML = `
                    <section class="hh-result-hero">
                        <span>🏆</span>
                        <div><span class="hh-eyebrow">TỔNG KẾT MÙA GIẢI</span><h3>Bảng vàng tích lũy 5 vòng</h3><p>Phần thưởng đã được chuyển vào ví, hộp thư hoặc túi đồ.</p></div>
                    </section>
                    <div class="hh-table-wrap"><table class="leaderboard-table">
                        <thead><tr><th>Hạng</th><th>Họa sĩ</th><th>Tổng điểm</th><th>Thành tích</th></tr></thead>
                        <tbody>${rankings.map(row => {
                    const reward = row.rank === 1 ? 'Quán quân' : row.rank === 2 ? 'Á quân' : row.rank === 3 ? 'Hạng ba' : row.rank <= 10 ? 'Top 10' : 'Hoàn thành';
                    return `<tr><td class="rank-${row.rank <= 3 ? row.rank : ''}">#${Number(row.rank)}</td><td><strong>${this.escapeHTML(row.studentName)}</strong></td><td>${Number(row.totalScore || 0).toFixed(2)}</td><td>${reward}</td></tr>`;
                }).join('')}</tbody>
                    </table></div>
                `;
                return;
            }

            const submissions = await this.getSubmissionsForRound(
                this.currentRound.id
            );
            submissions.sort((a, b) => Number(b.finalScore || 0) - Number(a.finalScore || 0));
            if (!submissions.length) {
                container.innerHTML = this.emptyStateHTML('📊', 'Chưa có kết quả', 'Vòng thi chưa có dữ liệu chấm điểm.');
                return;
            }
            container.innerHTML = `
                <section class="hh-result-hero hh-result-hero-blue">
                    <span>✦</span><div><span class="hh-eyebrow">KẾT QUẢ VÒNG</span><h3>Bảng điểm tác phẩm</h3><p>Điểm vòng được tích lũy cho mùa giải 5 vòng.</p></div>
                </section>
                <div class="hh-table-wrap"><table class="leaderboard-table">
                    <thead><tr><th>#</th><th>Tác phẩm</th><th>Họa sĩ</th><th>Điểm GV</th><th>Phiếu</th><th>Điểm vòng</th></tr></thead>
                    <tbody>${submissions.map((sub, index) => {
                const safe = this.safeDataImage(sub.imageBase64);
                return `<tr><td>${index + 1}</td><td>${safe ? `<img src="${safe}" class="hh-result-thumb" data-hh-action="preview" alt="Tác phẩm">` : '-'}</td><td><strong>${this.escapeHTML(sub.studentName)}</strong></td><td>${Number(sub.teacherScore || 0).toFixed(1)}</td><td>${this.getVoteCount(sub)}</td><td class="hh-final-score">${Number(sub.finalScore || 0).toFixed(2)}</td></tr>`;
            }).join('')}</tbody>
                </table></div>
            `;
        },

        /* ============================ GIÁO VIÊN ============================= */
        initTeacher() {
            if (!this.isTeacher) return;
            const host = document.getElementById('tab-game-manage') || document.querySelector('.game-manage-container') || document.getElementById('tab-games');
            if (!host || document.getElementById('hh-teacher-container-wrapper')) return;

            host.insertAdjacentHTML('beforeend', `
                <section id="hh-teacher-container-wrapper" class="hoihoa-teacher-section">
                    <button type="button" class="hh-teacher-heading" data-hh-action="teacher-toggle" aria-expanded="false">
                        <span class="hh-teacher-heading-icon">🎨</span>
                        <span><strong>Quản lý sự kiện Hội Họa</strong><small>Tạo vòng, theo dõi bài nộp, chấm điểm và công bố kết quả</small></span>
                        <span id="hh-toggle-icon">▾</span>
                    </button>
                    <div id="hh-teacher-content" class="hh-teacher-content">
                        <div class="hh-teacher-grid">
                            <section class="hh-admin-card hh-round-form-card">
                                <div class="hh-admin-card-title"><div><span class="hh-eyebrow">ROUND BUILDER</span><h3 id="hh-round-form-title">Tạo vòng thi mới</h3></div><button type="button" class="hh-btn hh-btn-ghost hh-hidden" id="hh-cancel-edit-round" data-hh-action="cancel-edit-round">Hủy sửa</button></div>
                                <div class="hh-form-grid">
                                    <label class="hh-field hh-span-2"><span>Tên vòng</span><input id="hh-create-title" type="text" maxlength="100" placeholder="Ví dụ: Vòng 1 — Sắc màu quê hương"></label>
                                    <label class="hh-field hh-span-2"><span>Đề tài</span><input id="hh-create-topic" type="text" maxlength="180" placeholder="Mô tả ngắn chủ đề sáng tác"></label>
                                    <label class="hh-field hh-span-2"><span>Hướng dẫn / tiêu chí</span><textarea id="hh-create-instructions" rows="3" maxlength="800" placeholder="Gợi ý bố cục, nội dung bắt buộc, điều cấm..."></textarea></label>
                                    <label class="hh-field"><span>Bắt đầu</span><input id="hh-create-start" type="datetime-local"></label>
                                    <label class="hh-field"><span>Hạn nộp</span><input id="hh-create-end" type="datetime-local"></label>
                                    <label class="hh-field"><span>Khổ tranh</span><select id="hh-create-size"><option value="1400x900">Ngang 1400×900</option><option value="1200x1200">Vuông 1200×1200</option><option value="900x1400">Dọc 900×1400</option><option value="1600x900">Màn ảnh 1600×900</option></select></label>
                                    <label class="hh-field"><span>Màu nền</span><input id="hh-create-bg" type="color" value="#ffffff"></label>
                                    <label class="hh-field"><span>Lượt bình chọn/người</span><input id="hh-create-max-votes" type="number" min="1" max="10" value="3"></label>
                                    <label class="hh-field"><span>Cách tính vote</span><select id="hh-create-vote-mode"><option value="top">So với bài nhiều phiếu nhất</option><option value="share">Tỷ lệ trên tổng phiếu</option></select></label>
                                    <label class="hh-field"><span>Trọng số GV (%)</span><input id="hh-create-teacher-weight" type="number" min="0" max="100" value="70"></label>
                                    <label class="hh-field"><span>Trọng số vote (%)</span><input id="hh-create-vote-weight" type="number" min="0" max="100" value="30"></label>
                                    <label class="hh-check-field hh-span-2"><input id="hh-create-anonymous" type="checkbox" checked><span>Ẩn tên tác giả trong thời gian bình chọn</span></label>
                                </div>
                                <button type="button" class="hh-btn hh-btn-primary hh-full-width" id="hh-save-round-button" data-hh-action="save-round">Tạo vòng thi</button>
                            </section>
                            <section class="hh-admin-card hh-guide-card">
                                <span class="hh-eyebrow">QUY TRÌNH</span><h3>Luồng vận hành an toàn</h3>
                                <ol><li>Tạo vòng và kiểm tra thời gian.</li><li>Học sinh vẽ, hệ thống tự lưu nháp.</li><li>Chuyển sang bình chọn khi hết hạn.</li><li>Chấm điểm, nhập nhận xét và lưu hàng loạt.</li><li>Chốt kết quả; đủ 5 vòng sẽ tổng kết mùa.</li></ol>
                                <p>“Lưu trữ vòng” chỉ ẩn khỏi học sinh, không xóa bài nộp hoặc dữ liệu cũ.</p>
                            </section>
                        </div>
                        <div class="hh-round-list-heading"><div><span class="hh-eyebrow">EVENT CONTROL</span><h3>Danh sách vòng thi</h3></div><button type="button" class="hh-btn hh-btn-ghost" data-hh-action="toggle-archived" id="hh-toggle-archived">Hiện vòng đã lưu trữ</button></div>
                        <div id="hh-teacher-rounds-list">${this.loadingHTML('Đang tải vòng thi...')}</div>
                    </div>
                </section>
            `);
            this.prefillRoundDates();
            this.loadTeacherRounds();
        },

        toggleTeacherPanel() {
            const content = document.getElementById('hh-teacher-content');
            const heading = document.querySelector('.hh-teacher-heading');
            if (!content) return;
            const open = content.classList.toggle('open');
            heading?.setAttribute('aria-expanded', String(open));
        },

        prefillRoundDates() {
            const startEl = document.getElementById('hh-create-start');
            const endEl = document.getElementById('hh-create-end');
            if (!startEl || !endEl || startEl.value || endEl.value) return;
            const start = new Date(Date.now() + 10 * 60 * 1000);
            const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
            startEl.value = this.toDateTimeLocal(start);
            endEl.value = this.toDateTimeLocal(end);
        },

        toDateTimeLocal(dateValue) {
            const date = new Date(dateValue);
            const pad = v => String(v).padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        },

        readRoundForm() {
            const [width, height] = (document.getElementById('hh-create-size')?.value || '1400x900').split('x').map(Number);
            const startTime = new Date(document.getElementById('hh-create-start')?.value || '').getTime();
            const endTime = new Date(document.getElementById('hh-create-end')?.value || '').getTime();
            return {
                title: document.getElementById('hh-create-title')?.value.trim() || '',
                topic: document.getElementById('hh-create-topic')?.value.trim() || '',
                instructions: document.getElementById('hh-create-instructions')?.value.trim() || '',
                startTime,
                endTime,
                canvasWidth: width,
                canvasHeight: height,
                backgroundColor: document.getElementById('hh-create-bg')?.value || '#ffffff',
                maxVotes: Number(document.getElementById('hh-create-max-votes')?.value || 3),
                teacherWeight: Number(document.getElementById('hh-create-teacher-weight')?.value || 70),
                voteWeight: Number(document.getElementById('hh-create-vote-weight')?.value || 30),
                voteScoringMode: document.getElementById('hh-create-vote-mode')?.value || 'top',
                anonymousVoting: !!document.getElementById('hh-create-anonymous')?.checked
            };
        },

        validateRoundForm(data) {
            if (!data.title || !data.topic) return 'Cần nhập tên vòng và đề tài.';
            if (!Number.isFinite(data.startTime) || !Number.isFinite(data.endTime)) return 'Thời gian không hợp lệ.';
            if (data.endTime <= data.startTime) return 'Hạn nộp phải sau thời gian bắt đầu.';
            if (data.teacherWeight < 0 || data.voteWeight < 0 || data.teacherWeight + data.voteWeight <= 0) return 'Trọng số điểm phải lớn hơn 0.';
            if (data.teacherWeight + data.voteWeight !== 100) return 'Tổng trọng số giáo viên và bình chọn phải bằng 100%.';
            if (data.maxVotes < 1 || data.maxVotes > 10) return 'Lượt bình chọn phải từ 1 đến 10.';
            return '';
        },

        async saveRoundForm() {
            if (!this.isTeacher) return;
            const form = this.readRoundForm();
            const error = this.validateRoundForm(form);
            if (error) return this.toast(error, 'warning');

            const now = Date.now();
            try {
                if (this.editingRoundKey) {
                    const old = this.teacherRounds.find(r => r._fbKey === this.editingRoundKey);
                    await db.ref(`hoihoa_rounds/${this.editingRoundKey}`).update({
                        ...form,
                        updatedAt: firebase.database.ServerValue.TIMESTAMP,
                        schemaVersion: 2,
                        status: old?.status === 'closed' || old?.status === 'voting' ? old.status : 'active'
                    });
                    this.toast('Đã cập nhật vòng thi mà không thay đổi ID hoặc bài nộp cũ.', 'success');
                } else {
                    const id = `HH_${Date.now()}`;
                    await db.ref(`hoihoa_rounds/${id}`).set({
                        id,
                        ...form,
                        status: 'active',
                        totalVotes: 0,
                        schemaVersion: 2,
                        createdAt: firebase.database.ServerValue.TIMESTAMP,
                        createdBy: String(
                            this.user?.username ||
                            this.user?.name ||
                            firebase.auth().currentUser?.uid ||
                            'teacher'
                        )
                    });
                    this.toast('Đã tạo vòng thi mới.', 'success');
                }
                this.cancelEditRound();
                await this.loadTeacherRounds();
            } catch (error) {
                console.error(error);
                this.toast(`Không lưu được vòng thi: ${error.message}`, 'error');
            }
        },

        editRound(roundKey) {
            const round = this.teacherRounds.find(r => r._fbKey === roundKey);
            if (!round) return;
            this.editingRoundKey = roundKey;
            const setValue = (id, value) => { const el = document.getElementById(id); if (el) el.value = value ?? ''; };
            setValue('hh-create-title', round.title);
            setValue('hh-create-topic', round.topic);
            setValue('hh-create-instructions', round.instructions);
            setValue('hh-create-start', this.toDateTimeLocal(round.startTime));
            setValue('hh-create-end', this.toDateTimeLocal(round.endTime));
            setValue('hh-create-size', `${round.canvasWidth || DEFAULTS.canvasWidth}x${round.canvasHeight || DEFAULTS.canvasHeight}`);
            setValue('hh-create-bg', round.backgroundColor || DEFAULTS.backgroundColor);
            setValue('hh-create-max-votes', round.maxVotes ?? DEFAULTS.maxVotes);
            setValue('hh-create-teacher-weight', round.teacherWeight ?? DEFAULTS.teacherWeight);
            setValue('hh-create-vote-weight', round.voteWeight ?? DEFAULTS.voteWeight);
            setValue('hh-create-vote-mode', round.voteScoringMode || 'share');
            const anonymous = document.getElementById('hh-create-anonymous');
            if (anonymous) anonymous.checked = round.anonymousVoting !== false;
            document.getElementById('hh-round-form-title').textContent = `Sửa: ${round.title}`;
            document.getElementById('hh-save-round-button').textContent = 'Lưu cập nhật';
            document.getElementById('hh-cancel-edit-round').classList.remove('hh-hidden');
            document.getElementById('hh-round-form-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },

        cancelEditRound() {
            this.editingRoundKey = null;
            const ids = ['hh-create-title', 'hh-create-topic', 'hh-create-instructions'];
            ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            const formTitle = document.getElementById('hh-round-form-title');
            const saveButton = document.getElementById('hh-save-round-button');
            if (formTitle) formTitle.textContent = 'Tạo vòng thi mới';
            if (saveButton) saveButton.textContent = 'Tạo vòng thi';
            document.getElementById('hh-cancel-edit-round')?.classList.add('hh-hidden');
            this.prefillRoundDates();
        },

        async duplicateRound(roundKey) {
            const source = this.teacherRounds.find(r => r._fbKey === roundKey);
            if (!source) return;
            const id = `HH_${Date.now()}`;
            const duration = Math.max(24 * 60 * 60 * 1000, Number(source.endTime) - Number(source.startTime));
            const startTime = Date.now() + 10 * 60 * 1000;
            const copy = { ...source };
            delete copy._fbKey;
            delete copy.isSeasonRewarded;
            delete copy.resultPublishedAt;
            delete copy.publishingLock;
            await db.ref(`hoihoa_rounds/${id}`).set({
                ...copy,
                id,
                title: `${source.title} — Bản sao`,
                startTime,
                endTime: startTime + duration,
                status: 'active',
                isArchived: false,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                schemaVersion: 2
            });
            this.toast('Đã nhân bản vòng thi. Bài nộp cũ không bị sao chép.', 'success');
            this.loadTeacherRounds();
        },

        async deleteRound(roundKey, roundId) {
            if (!this.isTeacher || !roundKey) return;

            const round = this.teacherRounds.find(
                item => item._fbKey === roundKey
            );

            if (!round) {
                this.toast(
                    'Không tìm thấy vòng thi cần xóa.',
                    'warning'
                );
                return;
            }

            try {
                const submissions =
                    await this.getSubmissionsForRound(
                        roundId || round.id
                    );

                const submissionCount = submissions.length;

                const confirmed = await this.confirmDialog(
                    `Xóa vĩnh viễn vòng “${round.title || 'Không tên'}”? ` +
                    `Vòng này có ${submissionCount} bài nộp. ` +
                    `Toàn bộ vòng thi và các bài thuộc vòng sẽ bị xóa. ` +
                    `Thao tác này không thể hoàn tác.`,
                    'Xóa vòng thi',
                    true
                );

                if (!confirmed) return;

                const updates = {};

                // Xóa vòng thi
                updates[
                    `hoihoa_rounds/${roundKey}`
                ] = null;

                // Xóa toàn bộ bài nộp thuộc vòng
                submissions.forEach(submission => {
                    const submissionKey =
                        submission._fbKey ||
                        submission.id;

                    if (submissionKey) {
                        updates[
                            `hoihoa_submissions/${submissionKey}`
                        ] = null;
                    }
                });

                await db.ref().update(updates);

                /*
                 * Dọn dữ liệu lượt bình chọn.
                 * Phần này không làm chặn việc xóa vòng nếu Rules
                 * chưa cho giáo viên xóa hoihoa_vote_usage.
                 */
                const effectiveRoundId = String(
                    roundId || round.id || ''
                ).trim();

                if (effectiveRoundId) {
                    try {
                        await db
                            .ref(
                                `hoihoa_vote_usage/${effectiveRoundId}`
                            )
                            .remove();
                    } catch (voteCleanupError) {
                        console.warn(
                            'Đã xóa vòng nhưng chưa dọn được dữ liệu lượt bình chọn:',
                            voteCleanupError
                        );
                    }
                }

                // Nếu đang sửa đúng vòng vừa xóa thì thoát chế độ sửa
                if (this.editingRoundKey === roundKey) {
                    this.cancelEditRound();
                }

                if (
                    String(this.activeTeacherRoundId) ===
                    String(effectiveRoundId)
                ) {
                    this.activeTeacherRoundId = null;
                }

                this.toast(
                    `Đã xóa vòng “${round.title || 'Không tên'}” và ${submissionCount} bài nộp.`,
                    'success'
                );

                await this.loadTeacherRounds();
            } catch (error) {
                console.error(error);

                this.toast(
                    `Không xóa được vòng thi: ${error.message || 'lỗi không xác định'
                    }`,
                    'error'
                );
            }
        },

        async archiveRound(roundKey) {
            const round = this.teacherRounds.find(r => r._fbKey === roundKey);
            if (!round) return;
            const action = round.isArchived ? 'khôi phục' : 'lưu trữ';
            if (!(await this.confirmDialog(`${action === 'lưu trữ' ? 'Ẩn' : 'Hiện lại'} vòng “${round.title}”? Dữ liệu vòng và bài nộp vẫn được giữ nguyên.`, `${action[0].toUpperCase()}${action.slice(1)} vòng`, false))) return;
            await db.ref(`hoihoa_rounds/${roundKey}`).update({ isArchived: !round.isArchived, archivedAt: round.isArchived ? null : firebase.database.ServerValue.TIMESTAMP });
            this.toast(`Đã ${action} vòng thi.`, 'success');
            this.loadTeacherRounds();
        },

        toggleArchivedRounds() {
            this.teacherShowArchived = !this.teacherShowArchived;
            const button = document.getElementById('hh-toggle-archived');
            if (button) button.textContent = this.teacherShowArchived ? 'Ẩn vòng đã lưu trữ' : 'Hiện vòng đã lưu trữ';
            this.renderTeacherRounds();
        },

        async loadTeacherRounds() {
            const container =
                document.getElementById('hh-teacher-rounds-list');

            if (!container) return;

            container.innerHTML =
                this.loadingHTML('Đang tải vòng thi và thống kê...');

            try {
                const [roundSnap, subSnap] = await Promise.all([
                    db.ref('hoihoa_rounds').once('value'),
                    db.ref('hoihoa_submissions').once('value')
                ]);

                this.teacherRounds = [];

                roundSnap.forEach(child => {
                    const round = child.val();

                    if (round) {
                        this.teacherRounds.push({
                            ...round,
                            _fbKey: child.key
                        });
                    }
                });

                const stats = {};

                this.teacherRounds.forEach(round => {
                    const roundKey = String(round.id ?? '').trim();

                    stats[roundKey] = {
                        submissions: 0,
                        votes: 0,
                        graded: 0
                    };
                });

                subSnap.forEach(child => {
                    const sub = child.val();

                    if (!sub || typeof sub !== 'object') return;

                    const submissionKey = String(child.key || '');

                    // Tìm vòng bằng roundId hoặc khóa bài cũ
                    const matchedRound = this.teacherRounds.find(round => {
                        const targetRoundId =
                            String(round.id ?? '').trim();

                        if (!targetRoundId) return false;

                        return (
                            String(sub.roundId ?? '').trim() ===
                            targetRoundId ||
                            submissionKey.startsWith(
                                `${targetRoundId}_`
                            )
                        );
                    });

                    if (!matchedRound) return;

                    const statKey =
                        String(matchedRound.id ?? '').trim();

                    if (!stats[statKey]) {
                        stats[statKey] = {
                            submissions: 0,
                            votes: 0,
                            graded: 0
                        };
                    }

                    stats[statKey].submissions++;
                    stats[statKey].votes += this.getVoteCount(sub);

                    if (
                        Number(sub.teacherScore) > 0 ||
                        sub.teacherFeedback
                    ) {
                        stats[statKey].graded++;
                    }
                });

                this.teacherRounds = this.teacherRounds.map(round => ({
                    ...round,

                    _stats:
                        stats[String(round.id ?? '').trim()] || {
                            submissions: 0,
                            votes: 0,
                            graded: 0
                        }
                }));

                this.teacherRounds.sort(
                    (a, b) =>
                        Number(b.startTime || 0) -
                        Number(a.startTime || 0)
                );

                this.renderTeacherRounds();
            } catch (error) {
                console.error(error);

                container.innerHTML = this.emptyStateHTML(
                    '⚠️',
                    'Không tải được dữ liệu',
                    'Kiểm tra kết nối và Firebase Rules.'
                );
            }
        },

        renderTeacherRounds() {
            const container = document.getElementById('hh-teacher-rounds-list');
            if (!container) return;
            const rounds = this.teacherRounds.filter(r => this.teacherShowArchived || !r.isArchived);
            if (!rounds.length) {
                container.innerHTML = this.emptyStateHTML('🎨', 'Chưa có vòng thi', 'Hãy tạo vòng đầu tiên ở biểu mẫu phía trên.');
                return;
            }
            container.innerHTML = rounds.map(round => this.renderTeacherRoundCard(round)).join('');
        },

        renderTeacherRoundCard(round) {
            const status = this.getEffectiveStatus(round);
            const statusLabels = { active: 'Đang nhận bài', voting: 'Đang bình chọn', closed: 'Đã chốt', scheduled: 'Đã lên lịch', awaiting_voting: 'Hết hạn — chờ bình chọn' };
            const stats = round._stats || {};
            let primaryAction = '';
            if (status === 'scheduled') primaryAction = round.status === 'scheduled'
                ? `<button class="hh-btn hh-btn-primary" data-hh-action="round-status" data-round-key="${round._fbKey}" data-status="active">Mở ngay</button>`
                : '<span class="hh-complete-label">◷ Đã lên lịch</span>';
            if (status === 'active' || status === 'awaiting_voting') primaryAction = `<button class="hh-btn hh-btn-warning" data-hh-action="round-status" data-round-key="${round._fbKey}" data-status="voting">Mở bình chọn</button>`;
            if (status === 'voting') primaryAction = `<button class="hh-btn hh-btn-success" data-hh-action="publish-results" data-round-key="${round._fbKey}" data-round-id="${this.escapeHTML(round.id)}">Chốt kết quả</button>`;
            if (status === 'closed') primaryAction = '<span class="hh-complete-label">✓ Đã công bố</span>';
            return `
                <article class="hh-round-admin-card ${round.isArchived ? 'archived' : ''}">
                    <div class="hh-round-card-main">
                        <div class="hh-round-card-title"><span class="hh-status-dot" data-status="${status}"></span><div><h4>${this.escapeHTML(round.title)}</h4><p>${this.escapeHTML(round.topic)}</p></div></div>
                        <span class="hh-status-pill" data-status="${status}">${statusLabels[status] || status}${round.isArchived ? ' · Đã lưu trữ' : ''}</span>
                    </div>
                    <div class="hh-round-card-meta">
                        <span>🕒 ${this.formatDateTime(round.startTime)} → ${this.formatDateTime(round.endTime)}</span>
                        <span>🖼 ${stats.submissions || 0} bài</span><span>♥ ${stats.votes || 0} phiếu</span><span>✎ ${stats.graded || 0}/${stats.submissions || 0} đã chấm</span>
                    </div>
                    <div class="hh-round-card-actions">
                        <div>${primaryAction}<button class="hh-btn hh-btn-ghost" data-hh-action="grade-round" data-round-id="${this.escapeHTML(round.id)}">Chấm bài</button></div>
                        <div>
    <button
        type="button"
        class="hh-icon-text-btn"
        data-hh-action="edit-round"
        data-round-key="${round._fbKey}">
        Sửa
    </button>

    <button
        type="button"
        class="hh-icon-text-btn"
        data-hh-action="duplicate-round"
        data-round-key="${round._fbKey}">
        Nhân bản
    </button>

    <button
        type="button"
        class="hh-icon-text-btn"
        data-hh-action="archive-round"
        data-round-key="${round._fbKey}">
        ${round.isArchived ? 'Khôi phục' : 'Lưu trữ'}
    </button>

    <button
        type="button"
        class="hh-icon-text-btn hh-delete-round-btn"
        data-hh-action="delete-round"
        data-round-key="${round._fbKey}"
        data-round-id="${this.escapeHTML(round.id)}">
        Xóa vòng
    </button>
</div>
                    </div>
                    <div id="hh-grading-area-${this.escapeHTML(round.id)}" class="hh-grading-area"></div>
                </article>
            `;
        },

        async changeRoundStatus(roundKey, newStatus) {
            if (!this.isTeacher) return;
            const round = this.teacherRounds.find(r => r._fbKey === roundKey);
            if (!round) return;
            const message = newStatus === 'voting' ? 'Sau khi mở bình chọn, học sinh không thể vẽ hoặc nộp thêm. Tiếp tục?' : 'Mở vòng thi ngay bây giờ?';
            if (!(await this.confirmDialog(message, 'Đổi trạng thái vòng', false))) return;
            await db.ref(`hoihoa_rounds/${roundKey}`).update({ status: newStatus, statusChangedAt: firebase.database.ServerValue.TIMESTAMP });
            this.toast('Đã cập nhật trạng thái vòng.', 'success');
            this.loadTeacherRounds();
        },

        async loadSubmissionsForGrading(
            roundId,
            forceReload = false
        ) {
            if (!this.isTeacher) return;

            const container = document.getElementById(
                `hh-grading-area-${roundId}`
            );

            if (!container) return;

            // Khi nhấn nút bình thường thì đóng/mở.
            // Khi vừa xóa bài thì forceReload để tải lại.
            if (
                !forceReload &&
                this.activeTeacherRoundId === roundId &&
                container.classList.contains('open')
            ) {
                container.classList.remove('open');
                this.activeTeacherRoundId = null;
                return;
            }

            this.activeTeacherRoundId = roundId;

            document
                .querySelectorAll('.hh-grading-area')
                .forEach(el => {
                    el.classList.remove('open');
                });

            container.classList.add('open');

            container.innerHTML =
                this.loadingHTML('Đang tải bài nộp...');

            try {
                const submissions =
                    await this.getSubmissionsForRound(roundId);

                if (!submissions.length) {
                    container.innerHTML = this.emptyStateHTML(
                        '🖼️',
                        'Chưa có bài nộp',
                        'Danh sách sẽ xuất hiện khi học sinh nộp tác phẩm.'
                    );

                    return;
                }

                container.innerHTML = `
            <div class="hh-grading-toolbar">
                <strong class="hh-submission-count">
                    Đang hiển thị ${submissions.length} bài
                </strong>

                <input
                    type="search"
                    placeholder="Tìm học sinh..."
                    data-hh-setting="grade-search">

                <select data-hh-setting="grade-sort">
                    <option value="name">Tên A–Z</option>
                    <option value="votes">
                        Nhiều phiếu trước
                    </option>
                    <option value="ungraded">
                        Chưa chấm trước
                    </option>
                </select>

                <button
                    type="button"
                    class="hh-btn hh-btn-success"
                    data-hh-action="save-all-grades"
                    data-round-id="${this.escapeHTML(roundId)}">
                    Lưu toàn bộ
                </button>
            </div>

            <div
                class="hh-grading-grid"
                data-round-id="${this.escapeHTML(roundId)}">

                ${submissions
                        .map(sub =>
                            this.renderGradingCard(sub, roundId)
                        )
                        .join('')}
            </div>
        `;
            } catch (error) {
                console.error(error);

                container.innerHTML = this.emptyStateHTML(
                    '⚠️',
                    'Không tải được bài nộp',
                    error.message ||
                    'Kiểm tra kết nối và Firebase Rules.'
                );
            }
        },

        renderGradingCard(sub, roundId) {
            const safe = this.safeDataImage(sub.imageBase64);
            const votes = this.getVoteCount(sub);

            const name =
                sub.studentName ||
                sub.studentUsername ||
                'Không rõ';

            // Dữ liệu cũ có thể không có trường id
            const stableId = String(
                sub.id ||
                sub._fbKey ||
                ''
            );

            const submissionKey = String(
                sub._fbKey ||
                stableId
            );

            return `
        <article
            class="hh-grading-card"
            data-name="${this.escapeHTML(name.toLowerCase())}"
            data-votes="${votes}"
            data-graded="${Number(sub.teacherScore) > 0 ||
                    sub.teacherFeedback
                    ? 1
                    : 0
                }">

            ${safe
                    ? `
                        <button
                            type="button"
                            class="hh-grading-image"
                            data-hh-action="preview">

                            <img
                                src="${safe}"
                                alt="Tác phẩm của ${this.escapeHTML(name)}"
                                loading="lazy">

                            <span>Phóng to</span>
                        </button>
                    `
                    : `
                        <div class="hh-grading-image hh-image-missing">
                            Không có ảnh
                        </div>
                    `
                }

            <div class="hh-grading-body">
                <div class="hh-grading-student">
                    <div>
                        <strong>
                            ${this.escapeHTML(name)}
                        </strong>

                        <small>
                            @${this.escapeHTML(
                    sub.studentUsername ||
                    'không-rõ'
                )}
                        </small>
                    </div>

                    <span>♥ ${votes}</span>
                </div>

                <label>
                    <span>Điểm giáo viên (0–10)</span>

                    <input
                        class="hh-grade-input"
                        id="grade-hh-${this.escapeHTML(stableId)}"
                        data-sub-key="${this.escapeHTML(submissionKey)}"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value="${sub.teacherScore ?? 0}">
                </label>

                <label>
                    <span>Nhận xét riêng</span>

                    <textarea
                        class="hh-feedback-input"
                        id="feedback-hh-${this.escapeHTML(stableId)}"
                        rows="3"
                        maxlength="500"
                        placeholder="Điểm mạnh và góp ý...">${this.escapeHTML(
                    sub.teacherFeedback || ''
                )}</textarea>
                </label>

                <div class="hh-grading-actions">
                    <button
                        type="button"
                        class="hh-btn hh-btn-ghost"
                        data-hh-action="save-grade"
                        data-submission-key="${this.escapeHTML(
                    submissionKey
                )}"
                        data-submission-id="${this.escapeHTML(
                    stableId
                )}">
                        Lưu bài này
                    </button>

                    <button
                        type="button"
                        class="hh-btn hh-btn-danger"
                        data-hh-action="delete-submission"
                        data-submission-key="${this.escapeHTML(
                    submissionKey
                )}"
                        data-round-id="${this.escapeHTML(roundId)}">
                        Xóa bài
                    </button>
                </div>
            </div>
        </article>
    `;
        },

        filterGradingCards(query) {
            const normalized = String(query || '').trim().toLowerCase();
            document.querySelectorAll('.hh-grading-card').forEach(card => {
                card.style.display = !normalized || card.dataset.name.includes(normalized) ? '' : 'none';
            });
        },

        sortGradingCards(mode) {
            const grid = document.querySelector('.hh-grading-grid');
            if (!grid) return;
            const cards = [...grid.querySelectorAll('.hh-grading-card')];
            cards.sort((a, b) => {
                if (mode === 'votes') return Number(b.dataset.votes) - Number(a.dataset.votes);
                if (mode === 'ungraded') return Number(a.dataset.graded) - Number(b.dataset.graded);
                return a.dataset.name.localeCompare(b.dataset.name, 'vi');
            });
            cards.forEach(card => grid.appendChild(card));
        },

        async saveSingleGrade(submissionKey, submissionId) {
            const score = Number(document.getElementById(`grade-hh-${submissionId}`)?.value);
            const feedback = document.getElementById(`feedback-hh-${submissionId}`)?.value.trim() || '';
            if (!Number.isFinite(score) || score < 0 || score > 10) return this.toast('Điểm phải từ 0 đến 10.', 'warning');
            await db.ref(
                `hoihoa_submissions/${submissionKey}`
            ).update({
                teacherScore: score,
                teacherFeedback: feedback,
                gradedAt:
                    firebase.database.ServerValue.TIMESTAMP,
                gradedBy: this.getTeacherIdentity()
            });
            this.toast('Đã lưu điểm và nhận xét.', 'success');
        },

        async deleteSubmission(submissionKey, roundId) {
            if (!this.isTeacher || !submissionKey) return;

            try {
                const submissionRef = db.ref(
                    `hoihoa_submissions/${submissionKey}`
                );

                const submissionSnap =
                    await submissionRef.once('value');

                const submission = submissionSnap.val();

                if (!submission) {
                    this.toast(
                        'Bài nộp không còn tồn tại.',
                        'warning'
                    );

                    await this.loadSubmissionsForGrading(
                        roundId,
                        true
                    );

                    return;
                }

                const studentLabel =
                    submission.studentName ||
                    submission.studentUsername ||
                    submissionKey;

                const confirmed = await this.confirmDialog(
                    `Xóa vĩnh viễn bài của “${studentLabel}”? ` +
                    `Học sinh sẽ có thể nộp lại nếu vòng vẫn đang nhận bài. ` +
                    `Thao tác này không thể hoàn tác.`,
                    'Xóa bài nộp',
                    true
                );

                if (!confirmed) return;

                const effectiveRoundId = String(
                    roundId ??
                    submission.roundId ??
                    ''
                ).trim();

                // Có bài cũ dùng id khác với Firebase key
                const submissionIds = new Set(
                    [
                        submissionKey,
                        submission.id
                    ]
                        .filter(Boolean)
                        .map(value => String(value))
                );

                const updates = {
                    [`hoihoa_submissions/${submissionKey}`]: null
                };

                // Xóa dấu vết phiếu của tác phẩm khỏi bộ đếm
                if (effectiveRoundId) {
                    const usageSnap = await db
                        .ref(
                            `hoihoa_vote_usage/${effectiveRoundId}`
                        )
                        .once('value');

                    usageSnap.forEach(userSnap => {
                        submissionIds.forEach(id => {
                            if (userSnap.child(id).exists()) {
                                updates[
                                    `hoihoa_vote_usage/${effectiveRoundId}/${userSnap.key}/${id}`
                                ] = null;
                            }
                        });
                    });
                }

                // Xóa bài và dữ liệu lượt bình chọn liên quan
                // trong một lần cập nhật
                await db.ref().update(updates);

                this.toast(
                    `Đã xóa bài của ${studentLabel}.`,
                    'success'
                );

                // Tải lại số lượng bài trên thẻ vòng
                await this.loadTeacherRounds();

                // Mở lại danh sách bài sau khi giao diện được dựng lại
                this.activeTeacherRoundId = null;

                if (effectiveRoundId) {
                    await this.loadSubmissionsForGrading(
                        effectiveRoundId,
                        true
                    );
                }
            } catch (error) {
                console.error(error);

                this.toast(
                    `Không xóa được bài: ${error.message ||
                    'lỗi không xác định'
                    }`,
                    'error'
                );
            }
        },

        async saveAllGrades(roundId) {
            const grid = document.querySelector(`.hh-grading-grid[data-round-id="${roundId}"]`);
            if (!grid) return;
            const updates = {};
            let invalid = false;
            grid.querySelectorAll('.hh-grade-input').forEach(input => {
                const subKey = input.dataset.subKey;
                const score = Number(input.value);
                const card = input.closest('.hh-grading-card');
                const feedback = card?.querySelector('.hh-feedback-input')?.value.trim() || '';
                if (!Number.isFinite(score) || score < 0 || score > 10) invalid = true;
                updates[`hoihoa_submissions/${subKey}/teacherScore`] = score;
                updates[`hoihoa_submissions/${subKey}/teacherFeedback`] = feedback;
                updates[`hoihoa_submissions/${subKey}/gradedAt`] = firebase.database.ServerValue.TIMESTAMP;
                updates[`hoihoa_submissions/${subKey}/gradedBy`] =
                    this.getTeacherIdentity();
            });
            if (invalid) return this.toast('Có điểm không hợp lệ. Hãy kiểm tra lại.', 'warning');
            await db.ref().update(updates);
            this.toast('Đã lưu toàn bộ điểm và nhận xét.', 'success');
        },

        async publishResults(roundKey, roundId) {
            if (!this.isTeacher) return;
            if (!(await this.confirmDialog('Chốt điểm vòng này? Sau khi công bố, bảng kết quả sẽ hiện cho học sinh. Nếu đủ 5 vòng chưa tổng kết, hệ thống sẽ tạo bảng xếp hạng mùa.', 'Công bố kết quả', false))) return;

            const roundRef = db.ref(`hoihoa_rounds/${roundKey}`);
            const roundSnap = await roundRef.once('value');
            const round = roundSnap.val();
            if (!round || round.status === 'closed') return this.toast('Vòng này đã được chốt trước đó.', 'warning');

            let lockOwned = false;
            const lockResult = await roundRef.child('publishingLock').transaction(current => {
                if (current) return;
                lockOwned = true;
                return {
                    by: this.getTeacherIdentity(),
                    at: Date.now()
                };
            });
            if (!lockResult.committed || !lockOwned) return this.toast('Một phiên khác đang công bố kết quả.', 'warning');

            try {
                const submissions =
                    await this.getSubmissionsForRound(roundId);
                if (!submissions.length) throw new Error('Không có bài nộp để công bố.');

                const config = this.getRoundConfig(round);
                const totalVotes = submissions.reduce((sum, sub) => sum + this.getVoteCount(sub), 0);
                const maxVotes = Math.max(0, ...submissions.map(sub => this.getVoteCount(sub)));
                const updates = {};
                const publishedAt = Date.now();

                submissions.forEach((sub, index) => {
                    const voteCount = this.getVoteCount(sub);
                    const voteScore = config.voteScoringMode === 'top'
                        ? (maxVotes > 0 ? voteCount / maxVotes * 10 : 0)
                        : (totalVotes > 0 ? voteCount / totalVotes * 10 : 0);
                    const teacherScore = this.clamp(Number(sub.teacherScore || 0), 0, 10);
                    const finalScore = teacherScore * config.teacherWeight + voteScore * config.voteWeight;
                    updates[`hoihoa_submissions/${sub._fbKey}/votes`] = voteCount;
                    updates[`hoihoa_submissions/${sub._fbKey}/voteScore`] = voteScore;
                    updates[`hoihoa_submissions/${sub._fbKey}/finalScore`] = finalScore;
                    updates[`hoihoa_submissions/${sub._fbKey}/resultPublishedAt`] = publishedAt;
                    const msgId = `hh_round_${roundId}`;
                    updates[`inbox_messages/${sub.studentUsername}/${msgId}`] = {
                        title: '🎨 Kết quả vòng Hội Họa',
                        message: `Điểm vòng của bạn: ${finalScore.toFixed(2)}. Điểm giáo viên: ${teacherScore.toFixed(1)}; bình chọn: ${voteCount} phiếu.${sub.teacherFeedback ? `\nNhận xét: ${sub.teacherFeedback}` : ''}`,
                        time: publishedAt + index,
                        timestamp: publishedAt + index,
                        timeString: new Date(publishedAt).toLocaleString('vi-VN'),
                        read: false,
                        giftType: 'none', giftValue: ''
                    };
                    sub.finalScore = finalScore;
                });
                updates[`hoihoa_rounds/${roundKey}/status`] = 'closed';
                updates[`hoihoa_rounds/${roundKey}/resultPublishedAt`] = publishedAt;
                updates[`hoihoa_rounds/${roundKey}/publishingLock`] = null;
                await db.ref().update(updates);

                const seasonResult = await this.tryBuildSeason(roundId, submissions);
                this.toast(seasonResult ? 'Đã công bố vòng và tổng kết đủ 5 vòng.' : 'Đã công bố kết quả vòng.', 'success');
                await this.loadTeacherRounds();
            } catch (error) {
                console.error(error);
                try { await roundRef.child('publishingLock').remove(); } catch (_) { /* bỏ qua */ }
                this.toast(`Công bố thất bại: ${error.message}`, 'error');
            }
        },

        async tryBuildSeason(currentRoundId, currentSubmissions) {
            const roundsSnap = await db.ref('hoihoa_rounds').once('value');
            const rounds = [];
            roundsSnap.forEach(child => {
                const round = { ...child.val(), _fbKey: child.key };
                if (round.id === currentRoundId) round.status = 'closed';
                if (round.status === 'closed' && !round.isSeasonRewarded) rounds.push(round);
            });
            rounds.sort((a, b) => Number(a.startTime) - Number(b.startTime));
            if (rounds.length < 5) return false;

            const seasonRounds = rounds.slice(0, 5);
            const seasonRoundIds = seasonRounds.map(r => r.id);
            const finalRound = seasonRounds[4];
            const seasonId = `SEASON_${finalRound.id}`;
            let lockOwned = false;
            const lock = await db.ref(`hoihoa_reward_logs/${seasonId}`).transaction(current => {
                if (current) return;
                lockOwned = true;
                return { status: 'processing', createdAt: Date.now(), roundIds: seasonRoundIds };
            });
            if (!lock.committed || !lockOwned) return false;

            try {
                const allSubsSnap = await db.ref('hoihoa_submissions').once('value');
                const aggregated = {};
                allSubsSnap.forEach(child => {
                    const sub = child.val();
                    if (!seasonRoundIds.includes(sub.roundId)) return;
                    let finalScore = Number(sub.finalScore || 0);
                    if (sub.roundId === currentRoundId) {
                        const current = currentSubmissions.find(item => item.id === sub.id);
                        if (current) finalScore = Number(current.finalScore || finalScore);
                    }
                    if (!aggregated[sub.studentUsername]) aggregated[sub.studentUsername] = { studentUsername: sub.studentUsername, studentName: sub.studentName, totalScore: 0, roundsJoined: 0 };
                    aggregated[sub.studentUsername].totalScore += finalScore;
                    aggregated[sub.studentUsername].roundsJoined++;
                });
                const rankings = Object.values(aggregated).sort((a, b) => b.totalScore - a.totalScore);
                const updates = {};
                rankings.forEach((student, index) => {
                    const rank = index + 1;
                    updates[`season_rankings/${finalRound.id}/${student.studentUsername}`] = {
                        rank,
                        totalScore: student.totalScore,
                        roundsJoined: student.roundsJoined,
                        studentName: student.studentName,
                        seasonId
                    };
                });
                seasonRounds.forEach(round => {
                    updates[`hoihoa_rounds/${round._fbKey}/isSeasonRewarded`] = true;
                    updates[`hoihoa_rounds/${round._fbKey}/seasonId`] = seasonId;
                });
                updates[`hoihoa_reward_logs/${seasonId}/status`] = 'ranked';
                updates[`hoihoa_reward_logs/${seasonId}/finalRoundId`] = finalRound.id;
                updates[`hoihoa_reward_logs/${seasonId}/rankingCount`] = rankings.length;
                await db.ref().update(updates);
                await this.rewardSeasonStudents(seasonId, finalRound.id, rankings);
                await db.ref(`hoihoa_reward_logs/${seasonId}`).update({ status: 'completed', completedAt: firebase.database.ServerValue.TIMESTAMP });
                return true;
            } catch (error) {
                await db.ref(`hoihoa_reward_logs/${seasonId}`).update({ status: 'error', error: String(error.message || error), failedAt: firebase.database.ServerValue.TIMESTAMP });
                throw error;
            }
        },

        async rewardSeasonStudents(seasonId, finalRoundId, rankings) {
            for (let i = 0; i < rankings.length; i++) {
                const student = rankings[i];
                const rank = i + 1;
                const reward =
                    rank === 1
                        ? {
                            coins: 500,
                            label: 'Quán quân',
                            badge: [
                                'badge_hoasi',
                                '🎨',
                                'Họa sĩ tài năng',
                                'talent',
                                'Biểu tượng bảng màu tỏa sáng dành cho Quán quân.'
                            ],
                            chest: true
                        }
                        : rank === 2
                            ? {
                                coins: 300,
                                label: 'Á quân',
                                badge: [
                                    'badge_butve',
                                    '🖌️',
                                    'Bút vẽ vàng',
                                    'golden-brush',
                                    'Chiếc bút vàng trên khiên xanh dành cho Á quân.'
                                ],
                                discount: 20
                            }
                            : rank === 3
                                ? {
                                    coins: 200,
                                    label: 'Hạng ba',
                                    badge: [
                                        'badge_mausac',
                                        '🌈',
                                        'Màu sắc rực rỡ',
                                        'vibrant-color',
                                        'Huy chương cầu vồng dành cho tác phẩm giàu sắc màu.'
                                    ]
                                }
                                : rank <= 10
                                    ? {
                                        coins: 100,
                                        label: `Top ${rank}`
                                    }
                                    : {
                                        coins: 0,
                                        label: `Hạng ${rank}`
                                    };

                const userLogRef = db.ref(`hoihoa_reward_logs/${seasonId}/students/${student.studentUsername}`);
                let shouldReward = false;
                const claim = await userLogRef.transaction(current => {
                    if (current?.status === 'done' || current?.status === 'processing') return;
                    shouldReward = true;
                    return { status: 'processing', rank, startedAt: Date.now() };
                });
                if (!claim.committed || !shouldReward) continue;

                if (reward.coins > 0) {
                    await db.ref(`student_coins/${student.studentUsername}`).transaction(current => Number(current || 0) + reward.coins);
                }
                const updates = {};
                if (reward.badge) {
                    const [
                        badgeId,
                        badgeIcon,
                        badgeName,
                        badgeStyle,
                        badgeDescription
                    ] = reward.badge;

                    updates[
                        `student_inventory/${student.studentUsername}/${badgeId}`
                    ] = {
                        id: badgeId,
                        type: 'badge',
                        name: badgeName,
                        icon: badgeIcon,

                        badgeStyle,

                        rarity:
                            rank === 1
                                ? 'legendary'
                                : rank === 2
                                    ? 'epic'
                                    : 'rare',

                        visualVersion: 2,

                        isEquipped: false,
                        purchaseTime: Date.now(),

                        source: 'hoihoa_season',
                        seasonId,
                        rank,

                        description:
                            badgeDescription ||
                            (
                                `Huy hiệu ${reward.label} ` +
                                `mùa giải Hội Họa.`
                            )
                    };
                }
                if (reward.chest) {
                    updates[`student_inventory/${student.studentUsername}/chest_hh_${seasonId}`] = { id: 'chest_hoihoa', type: 'chest', name: 'Rương Kho Báu Hội Họa', icon: '🎁', isEquipped: false, purchaseTime: Date.now(), description: 'Phần thưởng Quán quân mùa giải Hội Họa.' };
                }
                if (reward.discount) {
                    const discountCreatedAt = Date.now();

                    updates[
                        `student_discounts/${student.studentUsername}/hh_discount_${seasonId}`
                    ] = {
                        percent: reward.discount,
                        isUsed: false,
                        targetItem: ['all'],

                        // Thẻ chỉ dùng một lần.
                        usageLimit: 1,

                        createdAt: discountCreatedAt,

                        expiry:
                            discountCreatedAt +
                            30 * 24 * 60 * 60 * 1000,

                        source: 'hoihoa_runner_up',
                        rewardType: 'season_runner_up',

                        maxEligiblePriceExclusive: 600,
                        excludesEventItems: true,

                        excludedTags: [
                            'Doraemon',
                            'Truyền thuyết'
                        ]
                    };
                }
                updates[`inbox_messages/${student.studentUsername}/hh_season_${seasonId}`] = {
                    title: '🏆 Tổng kết mùa giải Hội Họa',
                    message: `Bạn đạt ${reward.label} với tổng ${student.totalScore.toFixed(2)} điểm qua ${student.roundsJoined} vòng. Phần thưởng: ${reward.coins} Coin${reward.badge ? `, huy hiệu “${reward.badge[2]}”` : ''}${reward.chest ? ', Rương Kho Báu' : ''}${reward.discount ? `, thẻ giảm ${reward.discount}% dùng 1 lần, hạn 30 ngày, chỉ áp dụng cho vật phẩm bán bằng Coin dưới 600 Coin; không áp dụng cho vật phẩm sự kiện, Doraemon và Truyền thuyết` : ''}.`,
                    time: Date.now() + i,
                    timestamp: Date.now() + i,
                    timeString: new Date().toLocaleString('vi-VN'),
                    read: false,
                    giftType: 'none', giftValue: ''
                };
                updates[`hoihoa_reward_logs/${seasonId}/students/${student.studentUsername}/status`] = 'done';
                updates[`hoihoa_reward_logs/${seasonId}/students/${student.studentUsername}/coins`] = reward.coins;
                updates[`hoihoa_reward_logs/${seasonId}/students/${student.studentUsername}/completedAt`] = firebase.database.ServerValue.TIMESTAMP;
                await db.ref().update(updates);
            }
        },

        /* ========================== PHÍM TẮT / UI ============================ */
        handleKeyboard(event) {
            if (!this.activeStudentModal || !this.canvas || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
            const key = event.key.toLowerCase();
            if ((event.ctrlKey || event.metaKey) && key === 'z') {
                event.preventDefault();
                event.shiftKey ? this.redo() : this.undo();
                return;
            }
            if ((event.ctrlKey || event.metaKey) && key === 'y') {
                event.preventDefault(); this.redo(); return;
            }
            const tools = {
                v: 'select',
                b: 'brush',
                p: 'pencil',
                k: 'ink',
                w: 'watercolor',
                m: 'marker',
                n: 'neon',
                x: 'pixel',
                s: 'spray',
                e: 'eraser',
                l: 'line',
                a: 'arrow',
                r: 'rect',
                o: 'ellipse',
                h: 'star',
                t: 'text',
                g: 'fill',
                i: 'picker'
            };
            if (
                (
                    key === 'delete' ||
                    key === 'backspace'
                ) &&
                this.selectedObjectId
            ) {
                event.preventDefault();

                this.deleteSelectedObject();

                return;
            }

            if (
                this.selectedObjectId &&
                [
                    'arrowleft',
                    'arrowright',
                    'arrowup',
                    'arrowdown'
                ].includes(key)
            ) {
                event.preventDefault();

                const distance =
                    event.shiftKey
                        ? 10
                        : 1;

                const movement = {
                    arrowleft:
                        [-distance, 0],

                    arrowright:
                        [distance, 0],

                    arrowup:
                        [0, -distance],

                    arrowdown:
                        [0, distance]
                }[key];

                this.moveSelectedObjectBy(
                    movement[0],
                    movement[1]
                );

                this.pushHistory();

                return;
            }
            if (tools[key]) { event.preventDefault(); this.setTool(tools[key]); }
            if (key === '[') { this.currentSize = this.clamp(this.currentSize - 2, 1, 120); this.syncSizeInput(); }
            if (key === ']') { this.currentSize = this.clamp(this.currentSize + 2, 1, 120); this.syncSizeInput(); }
        },

        syncSizeInput() {
            const input = document.getElementById('hh-size');
            const output = document.getElementById('hh-size-output');
            if (input) input.value = this.currentSize;
            if (output) output.textContent = `${Math.round(this.currentSize)} px`;
        },

        loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        },

        loadingHTML(text) {
            return `<div class="hh-loading"><span></span><p>${this.escapeHTML(text)}</p></div>`;
        },

        emptyStateHTML(icon, title, description) {
            return `<div class="hh-empty-state"><span>${icon}</span><h3>${this.escapeHTML(title)}</h3><p>${this.escapeHTML(description)}</p></div>`;
        }
    };

    window.HoiHoaSystem = HoiHoaSystem;
    document.addEventListener('DOMContentLoaded', () => HoiHoaSystem.init());
    if (document.readyState !== 'loading') HoiHoaSystem.init();
})();
