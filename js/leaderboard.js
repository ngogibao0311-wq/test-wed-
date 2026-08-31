// leaderboard.js — giao diện Bảng Xếp Hạng Thi Đua phiên bản mới

const LB_ICONS = {
    trophy: `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 4h8v3.5c0 3.1-1.6 5.5-4 5.5s-4-2.4-4-5.5V4Z" fill="currentColor"/>
            <path d="M8 6H5.5v1.1c0 2.2 1.3 3.8 3.4 4.2M16 6h2.5v1.1c0 2.2-1.3 3.8-3.4 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M12 13v3m-3 4h6m-5-4h4l1 4H9l1-4Z" fill="currentColor"/>
        </svg>`,

    refresh: `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 11a8 8 0 1 0-2.34 5.66" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M20 5v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

    close: `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`,

    info: `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M12 10.8V17M12 7.2h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`
};


// ======================================================
// 1. KHỞI TẠO GIAO DIỆN BẢNG XẾP HẠNG
// ======================================================

function initLeaderboardSystem() {
    // Không chèn lại giao diện nếu script bị tải nhiều lần.
    if (document.getElementById("leaderboardModal")) {
        return;
    }

    // Tạo nút mở bảng xếp hạng cạnh nút Túi đồ.
    const bagBtn = document.querySelector(".bag-trigger-btn");

    if (bagBtn && !document.querySelector(".leaderboard-trigger-btn")) {
        const lbBtn = document.createElement("button");

        lbBtn.type = "button";
        lbBtn.className = "leaderboard-trigger-btn ui-theme-immune";
        lbBtn.title = "Mở bảng xếp hạng thi đua";
        lbBtn.setAttribute("aria-label", "Mở bảng xếp hạng thi đua");

        lbBtn.innerHTML = `
            <span class="lb-trigger-icon">
                ${LB_ICONS.trophy}
            </span>
        `;

        lbBtn.addEventListener("click", openLeaderboardModal);

        bagBtn.parentNode.insertBefore(lbBtn, bagBtn);
    }

    const modalHTML = `
        <!-- BẢNG XẾP HẠNG -->
        <div
            id="leaderboardModal"
            class="modal-overlay"
            style="z-index:999998;"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leaderboardTitle"
        >
            <section class="modal-content form-container lb-panel">

                <header class="lb-header">
                    <div class="lb-header-inner">

                        <div class="lb-title-wrap">
                            <div class="lb-title-emblem">
                                ${LB_ICONS.trophy}
                            </div>

                            <div>
                                <p class="lb-eyebrow">
                                    Vinh danh thành tích
                                </p>

                                <h3
                                    id="leaderboardTitle"
                                    class="lb-title"
                                >
                                    Bảng Xếp Hạng Thi Đua
                                </h3>

                                <p class="lb-subtitle">
                                    Cùng tiến bộ, chinh phục từng cột mốc.
                                </p>
                            </div>
                        </div>

                        <div class="lb-header-actions">

                            <button
                                id="lbRefreshBtn"
                                class="lb-icon-btn"
                                type="button"
                                title="Làm mới dữ liệu"
                                aria-label="Làm mới dữ liệu"
                            >
                                ${LB_ICONS.refresh}
                            </button>

                            <button
                                id="lbRulesBtn"
                                class="lb-rules-btn"
                                type="button"
                                title="Xem quy chế thi đua"
                            >
                                ${LB_ICONS.info}
                                <span>Quy chế</span>
                            </button>

                            <button
                                id="lbCloseBtn"
                                class="lb-icon-btn"
                                type="button"
                                title="Đóng"
                                aria-label="Đóng bảng xếp hạng"
                            >
                                ${LB_ICONS.close}
                            </button>

                        </div>
                    </div>

                    <div class="lb-season-line">

                        <span
                            id="lbMonthDisplay"
                            class="lb-season-chip"
                        >
                            Đang tải mùa thi đua…
                        </span>

                        <span class="lb-live-chip">
                            <i class="lb-live-dot"></i>
                            Đang diễn ra
                        </span>

                    </div>
                </header>

                <main
                    id="leaderboardBody"
                    class="lb-content"
                    aria-live="polite"
                >
                    ${getLeaderboardLoadingHTML()}
                </main>

            </section>
        </div>


        <!-- QUY CHẾ THI ĐUA -->
        <div
            id="rulesModal"
            class="modal-overlay ui-theme-immune"
            style="z-index:999999;"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rulesTitle"
        >
            <section class="modal-content form-container lb-rules-panel">

                <button
                    id="rulesCloseBtn"
                    class="lb-icon-btn"
                    type="button"
                    title="Đóng"
                    aria-label="Đóng quy chế"
                >
                    ${LB_ICONS.close}
                </button>

                <header class="lb-rules-head">
                    <h3 id="rulesTitle">
                        Quy chế thi đua
                    </h3>

                    <p>
                        Điểm số minh bạch, phần thưởng rõ ràng.
                    </p>
                </header>

                <div class="lb-rules-scroll">

                    <article class="lb-rule-card">
                        <h4 class="lb-rule-title">
                            <span class="lb-rule-number">1</span>
                            Cách tính điểm xếp hạng
                        </h4>

                        <ul>
                            <li>
                                <strong>Điểm xếp hạng</strong>
                                = Điểm trung bình bài hợp lệ
                                + Điểm thưởng video,
                                tối đa <strong>+1,0 điểm</strong>.
                            </li>

                            <li>
                                Chỉ học sinh có ít nhất
                                <strong>1 bài đã chấm và hợp lệ</strong>
                                mới xuất hiện trên bảng xếp hạng.
                            </li>

                            <li>
                                Thứ tự ưu tiên:
                                điểm xếp hạng cao hơn →
                                nhiều điểm 10 hơn →
                                ít vi phạm hơn.
                            </li>
                        </ul>
                    </article>

                    <article class="lb-rule-card">
                        <h4 class="lb-rule-title">
                            <span class="lb-rule-number">2</span>
                            Các hình thức vi phạm
                        </h4>

                        <ul>
                            <li>
                                <strong>Nộp trễ hoặc bị thu tự động:</strong>
                                bài không được tính vào điểm trung bình
                                và ghi nhận 1 lần vi phạm.
                            </li>

                            <li>
                                <strong>Gian lận thi cử:</strong>
                                thoát toàn màn hình hoặc mở tab khác;
                                bài bị thu, không tính điểm trung bình.
                            </li>

                            <li>
                                <strong>Thiếu phần tự luận:</strong>
                                không có tệp hoặc nội dung theo yêu cầu;
                                phần tự luận nhận 0 điểm
                                và ghi nhận vi phạm.
                            </li>

                            <li>
                                <strong>Chưa hoàn thành video:</strong>
                                không được mở khóa bài tập tương ứng.
                            </li>
                        </ul>
                    </article>

                    <article class="lb-rule-card">
                        <h4 class="lb-rule-title">
                            <span class="lb-rule-number">3</span>
                            Phần thưởng cuối tháng
                        </h4>

                        <div class="lb-reward-grid">

                            <div class="lb-reward-item">
                                <span>🥇</span>
                                <span>
                                    <strong>Hạng 1</strong><br>
                                    1 Rương Kho Báu
                                </span>
                            </div>

                            <div class="lb-reward-item">
                                <span>🥈</span>
                                <span>
                                    <strong>Hạng 2</strong><br>
                                    Thẻ giảm giá ngẫu nhiên
                                </span>
                            </div>

                            <div class="lb-reward-item">
                                <span>🥉</span>
                                <span>
                                    <strong>Hạng 3</strong><br>
                                    <span id="lbRuleRank3Reward">100 Coin</span>
                                </span>
                            </div>

                            <div class="lb-reward-item">
                                <span>🎖️</span>
                                <span>
                                    <strong>Hạng 4+</strong><br>
                                    <span id="lbRuleRank4Reward">50 Coin khích lệ</span>
                                </span>
                            </div>

                        </div>
                    </article>

                </div>

                <footer class="lb-rules-footer">
                    <button
                        id="rulesConfirmBtn"
                        class="lb-primary-btn"
                        type="button"
                    >
                        Đã hiểu quy chế
                    </button>
                </footer>

            </section>
        </div>


        <!-- RƯƠNG KHO BÁU -->
        <div
            id="treasureChestModal"
class="modal-overlay ui-theme-immune"
            style="z-index:999999;"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chestTitle"
        >
            <section class="modal-content treasure-chest-box lb-chest-panel">

                <button
                    id="chestCloseBtn"
                    class="lb-icon-btn"
                    type="button"
                    title="Đóng"
                    aria-label="Đóng rương kho báu"
                >
                    ${LB_ICONS.close}
                </button>

                <div class="lb-chest-art">
                    🎁
                </div>

                <h3
                    id="chestTitle"
                    class="lb-chest-title"
                >
                    Rương Kho Báu
                </h3>

                <p class="lb-chest-copy">
                    Bạn đang sở hữu Rương Hạng 1.
                    Hãy chọn một trong hai loại phần thưởng bên dưới.
                </p>

                <div class="lb-reward-options">

                    <button
                        class="lb-reward-option"
                        type="button"
                        data-chest-choice="coin"
                    >
                        <span class="lb-reward-option-icon">
                            💰
                        </span>

                        <strong>
                            Coin ngẫu nhiên
                        </strong>

                        <small>
                            Cơ hội nhận từ 200 đến 1.000 Coin.
                        </small>
                    </button>

                    <button
                        class="lb-reward-option is-item"
                        type="button"
                        data-chest-choice="item"
                    >
                        <span class="lb-reward-option-icon">
                            📦
                        </span>

                        <strong>
                            Vật phẩm ngẫu nhiên
                        </strong>

                        <small>
                            Có cơ hội nhận vật phẩm Truyền Thuyết.
                        </small>
                    </button>

                </div>

            </section>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    bindLeaderboardEvents();
}


// ======================================================
// 2. GẮN SỰ KIỆN CHO GIAO DIỆN
// ======================================================

function bindLeaderboardEvents() {
    const leaderboardModal =
        document.getElementById("leaderboardModal");

    const rulesModal =
        document.getElementById("rulesModal");

    const chestModal =
        document.getElementById("treasureChestModal");


    document
        .getElementById("lbCloseBtn")
        ?.addEventListener(
            "click",
            closeLeaderboardModal
        );


    document
        .getElementById("lbRefreshBtn")
        ?.addEventListener(
            "click",
            calculateAndRenderLeaderboard
        );


    document
        .getElementById("lbRulesBtn")
        ?.addEventListener(
            "click",
            openRulesModal
        );


    document
        .getElementById("rulesCloseBtn")
        ?.addEventListener(
            "click",
            closeRulesModal
        );


    document
        .getElementById("rulesConfirmBtn")
        ?.addEventListener(
            "click",
            closeRulesModal
        );


    document
        .getElementById("chestCloseBtn")
        ?.addEventListener(
            "click",
            closeTreasureChestModal
        );


    document
        .querySelectorAll("[data-chest-choice]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                claimChestReward(
                    button.dataset.chestChoice
                );
            });
        });


    // Nhấn vào nền tối để đóng modal.
    [
        leaderboardModal,
        rulesModal,
        chestModal
    ].forEach((modal) => {
        modal?.addEventListener("click", (event) => {
            if (event.target !== modal) {
                return;
            }

            if (modal.id === "leaderboardModal") {
                closeLeaderboardModal();
            }

            if (modal.id === "rulesModal") {
                closeRulesModal();
            }

            if (modal.id === "treasureChestModal") {
                closeTreasureChestModal();
            }
        });
    });


    // Nhấn phím Esc để đóng modal.
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (rulesModal?.classList.contains("active")) {
            closeRulesModal();
            return;
        }

        if (chestModal?.classList.contains("active")) {
            closeTreasureChestModal();
            return;
        }

        if (leaderboardModal?.classList.contains("active")) {
            closeLeaderboardModal();
        }
    });
}


// ======================================================
// 3. TRẠNG THÁI ĐANG TẢI, RỖNG VÀ LỖI
// ======================================================

function getLeaderboardLoadingHTML() {
    return `
        <div class="lb-state">
            <div>
                <div
                    class="lb-loader"
                    aria-hidden="true"
                ></div>

                <h4>
                    Đang cập nhật thành tích
                </h4>

                <p>
                    Hệ thống đang đồng bộ bài tập,
                    điểm số và thời gian xem video.
                </p>
            </div>
        </div>
    `;
}


function getLeaderboardStateHTML(
    type,
    title,
    message
) {
    const icon =
        type === "error"
            ? "⚠️"
            : "🏁";

    return `
        <div class="lb-state">
            <div>
                <div class="lb-state-icon">
                    ${icon}
                </div>

                <h4>
                    ${escapeHTML(title)}
                </h4>

                <p>
                    ${escapeHTML(message)}
                </p>
            </div>
        </div>
    `;
}


// ======================================================
// 4. CÁC HÀM HỖ TRỢ
// ======================================================

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getCurrentUsername() {
    if (
        typeof currentUser !== "undefined" &&
        currentUser
    ) {
        return currentUser.username;
    }

    return null;
}


function isSafeAvatarURL(value) {
    return /^(data:image\/(png|jpe?g|gif|webp|svg\+xml);|https?:\/\/|blob:)/i
        .test(String(value || ""));
}


function renderAvatar(
    avatar,
    name,
    extraClass = ""
) {
    const safeName =
        escapeHTML(name || "Học sinh");

    const rawAvatar =
        String(avatar || "").trim();


    if (isSafeAvatarURL(rawAvatar)) {
        return `
            <span class="lb-avatar ${extraClass}">
                <img
                    src="${escapeHTML(rawAvatar)}"
                    alt="Ảnh đại diện của ${safeName}"
                    loading="lazy"
                >
            </span>
        `;
    }


    // Cho phép dùng emoji làm avatar.
    const emoji =
        rawAvatar && rawAvatar.length <= 12
            ? escapeHTML(rawAvatar)
            : "👤";


    return `
        <span
            class="lb-avatar ${extraClass}"
            aria-label="Ảnh đại diện của ${safeName}"
        >
            ${emoji}
        </span>
    `;
}


function formatScore(value) {
    const number =
        Number(value) || 0;

    return number.toLocaleString(
        "vi-VN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}


function getProgressPercent(score) {
    // Điểm tối đa:
    // 10 điểm trung bình + 1 điểm video.

    return Math.max(
        0,
        Math.min(
            100,
            (Number(score) / 11) * 100
        )
    );
}



function leaderboardText(value) {
    return String(value ?? '').trim();
}


function getLeaderboardAssignmentIds(assignment) {
    return [...new Set(
        [
            assignment?.id,
            assignment?._fbKey,
            assignment?.assignmentId,
            assignment?.assignmentKey,
            assignment?.key
        ]
            .map(leaderboardText)
            .filter(Boolean)
    )];
}


function getLeaderboardSubmissionAssignmentId(submission) {
    return leaderboardText(
        submission?.assignmentId ??
        submission?.assignId ??
        submission?.assignmentKey ??
        submission?.taskId ??
        submission?.exerciseId
    );
}


function getLeaderboardSubmissionUsername(submission) {
    return leaderboardText(
        submission?.studentUsername ??
        submission?.username ??
        submission?.studentUser ??
        submission?.studentId
    );
}


function getLeaderboardTargets(assignment) {
    const rawTarget =
        assignment?.targetStudent;

    if (Array.isArray(rawTarget)) {
        const values = rawTarget
            .flatMap(value =>
                String(value ?? '').split(',')
            )
            .map(value => value.trim())
            .filter(Boolean);

        return values.length
            ? [...new Set(values)]
            : ['all'];
    }

    const values =
        String(rawTarget ?? 'all')
            .split(',')
            .map(value => value.trim())
            .filter(Boolean);

    return values.length
        ? [...new Set(values)]
        : ['all'];
}


function isLeaderboardAssignmentForStudent(
    assignment,
    username
) {
    const targets =
        getLeaderboardTargets(assignment);

    const normalizedUsername =
        leaderboardText(username);

    return (
        targets.includes('all') ||
        targets.includes(normalizedUsername)
    );
}


function getLeaderboardPassingGrade(assignment) {
    const assignmentGrade =
        Number(assignment?.passingGrade);

    if (Number.isFinite(assignmentGrade)) {
        return assignmentGrade;
    }

    const globalGrade =
        Number(window.currentPassingGrade);

    return Number.isFinite(globalGrade)
        ? globalGrade
        : 7;
}


function isLeaderboardSubmissionFailed(submission) {
    return Boolean(
        submission &&
        !submission.forcePass &&
        (
            submission.isAutoSubmitted ||
            submission.isLateFail ||
            submission.isCheatFail
        )
    );
}


/*
 * Một bài tập chỉ được tính đúng MỘT lần.
 * Ưu tiên giống logic lộ trình:
 * forcePass -> đạt -> có điểm -> chấm lại -> lỗi.
 */
function getLeaderboardBestSubmission(
    assignment,
    submissions,
    username
) {
    const assignmentIds =
        getLeaderboardAssignmentIds(assignment);

    const normalizedUsername =
        leaderboardText(username);

    const passingGrade =
        getLeaderboardPassingGrade(assignment);

    const matched = (submissions || [])
        .filter(submission => {
            return (
                assignmentIds.includes(
                    getLeaderboardSubmissionAssignmentId(
                        submission
                    )
                ) &&
                getLeaderboardSubmissionUsername(
                    submission
                ) === normalizedUsername
            );
        });

    if (!matched.length) {
        return null;
    }

    const getPriority = submission => {
        if (submission.forcePass) {
            return 50;
        }

        const grade =
            Number(submission.grade);

        const failed =
            isLeaderboardSubmissionFailed(
                submission
            );

        if (
            !failed &&
            !submission.isRegrading &&
            Number.isFinite(grade) &&
            grade >= passingGrade
        ) {
            return 40;
        }

        if (
            !failed &&
            !submission.isRegrading &&
            Number.isFinite(grade)
        ) {
            return 30;
        }

        if (submission.isRegrading) {
            return 20;
        }

        if (failed) {
            return 10;
        }

        return 0;
    };

    matched.sort((a, b) => {
        const priorityDifference =
            getPriority(b) -
            getPriority(a);

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        const gradeA =
            Number.isFinite(Number(a.grade))
                ? Number(a.grade)
                : -Infinity;

        const gradeB =
            Number.isFinite(Number(b.grade))
                ? Number(b.grade)
                : -Infinity;

        if (gradeB !== gradeA) {
            return gradeB - gradeA;
        }

        const timeA =
            Number(
                a.timestamp ??
                a.submitTimestamp ??
                a.id ??
                0
            ) || 0;

        const timeB =
            Number(
                b.timestamp ??
                b.submitTimestamp ??
                b.id ??
                0
            ) || 0;

        return timeB - timeA;
    });

    return matched[0];
}


function getLeaderboardMonthAssignments(
    assignments,
    year,
    monthIndex
) {
    return (assignments || []).filter(
        assignment => {
            if (!assignment?.endDate) {
                return false;
            }

            const assignmentDate =
                new Date(
                    String(assignment.endDate)
                        .replace(' ', 'T')
                );

            return (
                !Number.isNaN(
                    assignmentDate.getTime()
                ) &&
                assignmentDate.getMonth() ===
                    monthIndex &&
                assignmentDate.getFullYear() ===
                    year
            );
        }
    );
}


/*
 * Hàm tính BXH dùng chung cho:
 * - tháng hiện tại;
 * - tháng trước để phát thưởng.
 */
function buildLeaderboardDataForPeriod({
    users,
    assignments,
    submissions,
    trackingData,
    year,
    monthIndex
}) {
    const students =
        (users || []).filter(
            user =>
                String(user?.role || '')
                    .toLowerCase() ===
                'student'
        );

    const monthAssignments =
        getLeaderboardMonthAssignments(
            assignments,
            year,
            monthIndex
        );

    const rankedData = [];

    students.forEach(student => {
        const username =
            leaderboardText(
                student.username
            );

        if (!username) {
            return;
        }

        const assignedMonthAssignments =
            monthAssignments.filter(
                assignment =>
                    isLeaderboardAssignmentForStudent(
                        assignment,
                        username
                    )
            );

        let totalScore = 0;
        let validCount = 0;
        let count10s = 0;
        let violationCount = 0;
        let totalVideoBonus = 0;

        assignedMonthAssignments.forEach(
            assignment => {
                if (
                    Number(
                        assignment.watchCondition
                    ) > 0
                ) {
                    const assignmentIds =
                        getLeaderboardAssignmentIds(
                            assignment
                        );

                    const watchedTime =
                        Math.max(
                            0,
                            ...assignmentIds.map(
                                assignmentId =>
                                    Number(
                                        trackingData[
                                            assignmentId
                                        ]?.[username]
                                    ) || 0
                            )
                        );

                    const ratio =
                        Math.min(
                            1,
                            watchedTime /
                            Number(
                                assignment.watchCondition
                            )
                        );

                    totalVideoBonus +=
                        ratio * 0.5;
                }

                const submission =
                    getLeaderboardBestSubmission(
                        assignment,
                        submissions,
                        username
                    );

                if (!submission) {
                    return;
                }

                if (
                    submission.grade === null ||
                    submission.grade ===
                        undefined ||
                    submission.grade === '' ||
                    submission.isRegrading
                ) {
                    return;
                }

                const isLate =
                    submission.isLateFail ||
                    submission.isAutoSubmitted;

                const isCheat =
                    submission.isCheatFail;

                const isMissingEssay =
                    submission.isEssayMissing;

                if (!submission.forcePass) {
                    if (
                        isLate ||
                        isCheat ||
                        isMissingEssay
                    ) {
                        violationCount++;
                    }

                    if (
                        isLate ||
                        isCheat
                    ) {
                        return;
                    }
                }

                const score =
                    Number(submission.grade);

                if (!Number.isFinite(score)) {
                    return;
                }

                totalScore += score;
                validCount++;

                if (score === 10) {
                    count10s++;
                }
            }
        );

        totalVideoBonus =
            Math.min(
                totalVideoBonus,
                1
            );

        const average =
            validCount > 0
                ? totalScore / validCount
                : 0;

        const roundedAverage =
            Math.round(
                average * 100
            ) / 100;

        const finalScore =
            roundedAverage +
            totalVideoBonus;

        if (validCount > 0) {
            rankedData.push({
                name:
                    student.name ||
                    username ||
                    'Học sinh',

                username,

                avatar:
                    student.avatar ||
                    '👤',

                finalScore:
                    Math.round(
                        finalScore * 100
                    ) / 100,

                dtb:
                    roundedAverage,

                videoBonus:
                    Math.round(
                        totalVideoBonus *
                        100
                    ) / 100,

                tens:
                    count10s,

                violations:
                    violationCount,

                validCount
            });
        }
    });

    rankedData.sort((a, b) => {
        if (
            b.finalScore !==
            a.finalScore
        ) {
            return (
                b.finalScore -
                a.finalScore
            );
        }

        if (
            b.tens !==
            a.tens
        ) {
            return (
                b.tens -
                a.tens
            );
        }

        return (
            a.violations -
            b.violations
        );
    });

    return rankedData;
}


function getLeaderboardPreviousSeasonInfo(
    now = new Date()
) {
    const previousMonthDate =
        new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );

    const year =
        previousMonthDate.getFullYear();

    const monthIndex =
        previousMonthDate.getMonth();

    const month =
        monthIndex + 1;

    return {
        year,
        month,
        monthIndex,
        seasonKey:
            `${year}-` +
            `${String(month).padStart(2, '0')}`,

        display:
            `Tháng ${month}/${year}`
    };
}


function getLeaderboardClaimPath(
    seasonKey,
    username
) {
    return (
        'leaderboard_reward_claims/' +
        `${seasonKey}/` +
        `${username}`
    );
}


function getLeaderboardRewardTypeForRank(
    rank
) {
    if (rank === 1) {
        return 'chest';
    }

    if (rank === 2) {
        return 'discount';
    }

    return 'coin';
}


function getDeterministicLeaderboardDiscountPercent(
    seasonKey,
    username
) {
    const choices =
        [10, 15, 20, 25, 30];

    const seed =
        `${seasonKey}:${username}`;

    let hash = 0;

    for (
        let index = 0;
        index < seed.length;
        index++
    ) {
        hash =
            (
                (hash * 31) +
                seed.charCodeAt(index)
            ) >>> 0;
    }

    return choices[
        hash % choices.length
    ];
}


async function getLeaderboardSourceData() {
    const [
        users,
        assignments,
        submissions,
        trackingSnap,
        settingsSnap
    ] = await Promise.all([
        getDB('users'),
        getDB('assignments'),
        getDB('submissions'),
        db.ref('video_tracking')
            .once('value'),
        db.ref('leaderboard_settings')
            .once('value')
    ]);

    return {
        users,
        assignments,
        submissions,
        trackingData:
            trackingSnap.val() || {},
        settings:
            settingsSnap.val() || {}
    };
}


async function getPreviousLeaderboardRewardState() {
    const username =
        getCurrentUsername();

    if (!username) {
        return null;
    }

    const season =
        getLeaderboardPreviousSeasonInfo();

    const source =
        await getLeaderboardSourceData();

    const rankedData =
        buildLeaderboardDataForPeriod({
            users:
                source.users,
            assignments:
                source.assignments,
            submissions:
                source.submissions,
            trackingData:
                source.trackingData,
            year:
                season.year,
            monthIndex:
                season.monthIndex
        });

    const rankIndex =
        rankedData.findIndex(
            student =>
                student.username ===
                username
        );

    const rank =
        rankIndex >= 0
            ? rankIndex + 1
            : null;

    const claimRef =
        db.ref(
            getLeaderboardClaimPath(
                season.seasonKey,
                username
            )
        );

    const claimSnap =
        await claimRef.once('value');

    return {
        ...season,
        username,
        rank,
        rankedData,
        settings:
            source.settings,
        claim:
            claimSnap.val() || null
    };
}


function renderLeaderboardRewardPanelHTML(
    rewardState
) {
    if (!rewardState) {
        return '';
    }

    const {
        rank,
        display,
        claim,
        settings
    } = rewardState;

    if (!rank) {
        return `
            <section
                style="
                    margin: 0 0 16px;
                    padding: 14px 16px;
                    border-radius: 14px;
                    background:
                        rgba(148,163,184,.12);
                    border:
                        1px solid
                        rgba(148,163,184,.25);
                "
            >
                <strong>
                    🏁 Phần thưởng ${escapeHTML(display)}
                </strong>
                <div style="margin-top:6px;color:#64748b;">
                    Bạn không có thứ hạng hợp lệ trong mùa này.
                </div>
            </section>
        `;
    }

    if (claim?.status === 'claimed') {
        return `
            <section
                style="
                    margin: 0 0 16px;
                    padding: 14px 16px;
                    border-radius: 14px;
                    background:
                        rgba(16,185,129,.10);
                    border:
                        1px solid
                        rgba(16,185,129,.28);
                "
            >
                <strong>
                    ✅ Đã nhận thưởng ${escapeHTML(display)}
                </strong>
                <div style="margin-top:6px;">
                    Hạng #${rank} ·
                    ${escapeHTML(
                        claim.rewardLabel ||
                        'Phần thưởng đã được ghi nhận.'
                    )}
                </div>
            </section>
        `;
    }

    if (
        rank === 1 &&
        claim?.status ===
            'available_chest'
    ) {
        return `
            <section
                style="
                    margin: 0 0 16px;
                    padding: 14px 16px;
                    border-radius: 14px;
                    background:
                        linear-gradient(
                            135deg,
                            rgba(245,158,11,.16),
                            rgba(251,191,36,.08)
                        );
                    border:
                        1px solid
                        rgba(245,158,11,.35);
                "
            >
                <strong>
                    🥇 Rương Hạng 1 · ${escapeHTML(display)}
                </strong>
                <div style="margin:7px 0 10px;">
                    Rương đã mở khóa và chỉ có thể nhận một lần.
                </div>
                <button
                    type="button"
                    class="lb-primary-btn"
                    onclick="openTreasureChest()"
                >
                    🎁 Mở Rương Hạng 1
                </button>
            </section>
        `;
    }

    const rewardRank3 =
        Number(settings?.rewardRank3);

    const rewardRank4 =
        Number(settings?.rewardRank4);

    let rewardText = '';

    if (rank === 1) {
        rewardText =
            '1 Rương Kho Báu';
    } else if (rank === 2) {
        rewardText =
            '1 Thẻ giảm giá ngẫu nhiên 10–30%';
    } else if (rank === 3) {
        rewardText =
            `${Number.isFinite(rewardRank3)
                ? rewardRank3
                : 100} Coin`;
    } else {
        rewardText =
            `${Number.isFinite(rewardRank4)
                ? rewardRank4
                : 50} Coin khích lệ`;
    }

    return `
        <section
            style="
                margin: 0 0 16px;
                padding: 14px 16px;
                border-radius: 14px;
                background:
                    rgba(99,102,241,.10);
                border:
                    1px solid
                    rgba(99,102,241,.28);
            "
        >
            <strong>
                🏆 Phần thưởng ${escapeHTML(display)}
            </strong>

            <div style="margin:7px 0 10px;">
                Bạn xếp hạng
                <strong>#${rank}</strong>
                · ${escapeHTML(rewardText)}
            </div>

            <button
                type="button"
                class="lb-primary-btn"
                onclick="claimPreviousLeaderboardReward()"
            >
                🎁 Nhận phần thưởng
            </button>
        </section>
    `;
}


async function refreshPreviousLeaderboardRewardPanel() {
    const area =
        document.getElementById(
            'lbSeasonRewardArea'
        );

    if (!area) {
        return;
    }

    area.innerHTML = `
        <div
            style="
                margin: 0 0 16px;
                color: #64748b;
            "
        >
            ⏳ Đang kiểm tra phần thưởng mùa trước…
        </div>
    `;

    try {
        const rewardState =
            await getPreviousLeaderboardRewardState();

        area.innerHTML =
            renderLeaderboardRewardPanelHTML(
                rewardState
            );
    } catch (error) {
        console.error(
            'Lỗi kiểm tra thưởng BXH:',
            error
        );

        area.innerHTML = `
            <div
                style="
                    margin: 0 0 16px;
                    color: #e11d48;
                "
            >
                ⚠️ Không thể kiểm tra phần thưởng mùa trước.
            </div>
        `;
    }
}


async function recordLeaderboardRewardHistory(
    payload
) {
    if (!window.TransactionHistory) {
        return;
    }

    try {
        await window
            .TransactionHistory
            .recordSafe(payload);
    } catch (error) {
        console.warn(
            'Không thể ghi lịch sử thưởng BXH:',
            error
        );
    }
}


window.claimPreviousLeaderboardReward =
    async function () {
        const buttons =
            document.querySelectorAll(
                '#lbSeasonRewardArea button'
            );

        buttons.forEach(button => {
            button.disabled = true;
        });

        let lockedClaimRef = null;
        let rewardFinalized = false;

        try {
            /*
             * Luôn tính lại BXH tháng trước ngay lúc nhận.
             * Không tin rank đang hiển thị trên DOM.
             */
            const rewardState =
                await getPreviousLeaderboardRewardState();

            if (
                !rewardState ||
                !rewardState.rank
            ) {
                alert(
                    '❌ Bạn không có phần thưởng BXH của mùa trước.'
                );
                return;
            }

            const {
                seasonKey,
                display,
                username,
                rank,
                settings,
                claim
            } = rewardState;

            if (claim?.status === 'claimed') {
                alert(
                    '✅ Phần thưởng mùa này đã được nhận trước đó.'
                );
                return;
            }

            if (
                rank === 1 &&
                claim?.status ===
                    'available_chest'
            ) {
                await window
                    .openTreasureChest();
                return;
            }

            const claimRef =
                db.ref(
                    getLeaderboardClaimPath(
                        seasonKey,
                        username
                    )
                );

            lockedClaimRef =
                claimRef;

            const rewardType =
                getLeaderboardRewardTypeForRank(
                    rank
                );

            const lockResult =
                await claimRef.transaction(
                    current => {
                        if (
                            current &&
                            (
                                current.status ===
                                    'claimed' ||
                                current.status ===
                                    'available_chest' ||
                                current.status ===
                                    'processing' ||
                                current.status ===
                                    'processing_chest'
                            )
                        ) {
                            return;
                        }

                        return {
                            seasonKey,
                            seasonLabel:
                                display,
                            username,
                            rank,
                            rewardType,
                            status:
                                'processing',
                            startedAt:
                                Date.now()
                        };
                    }
                );

            if (!lockResult.committed) {
                const current =
                    lockResult.snapshot.val();

                if (
                    current?.status ===
                        'available_chest'
                ) {
                    await window
                        .openTreasureChest();
                    return;
                }

                alert(
                    current?.status ===
                        'claimed'
                        ? '✅ Phần thưởng đã được nhận.'
                        : '⏳ Phần thưởng đang được xử lý ở một tab khác.'
                );
                return;
            }

            if (rank === 1) {
                await claimRef.update({
                    status:
                        'available_chest',
                    rewardLabel:
                        'Rương Kho Báu Hạng 1',
                    unlockedAt:
                        firebase.database
                            .ServerValue
                            .TIMESTAMP
                });

                rewardFinalized = true;

                await refreshPreviousLeaderboardRewardPanel();

                await window
                    .openTreasureChest();

                return;
            }

            if (rank === 2) {
                const percent =
                    getDeterministicLeaderboardDiscountPercent(
                        seasonKey,
                        username
                    );

                const discountKey =
                    'leaderboard_' +
                    seasonKey.replace(
                        /-/g,
                        '_'
                    );

                const rootUpdates = {};

                rootUpdates[
                    `student_discounts/` +
                    `${username}/` +
                    `${discountKey}`
                ] = {
                    percent,
                    dateAcquired:
                        firebase.database
                            .ServerValue
                            .TIMESTAMP,
                    isUsed:
                        false,
                    expiry:
                        null,
                    targetItem:
                        ['all'],
                    discountScope:
                        'all_coin',
                    source:
                        'leaderboard_runner_up',
                    seasonKey,
                    rank:
                        2
                };

                rootUpdates[
                    getLeaderboardClaimPath(
                        seasonKey,
                        username
                    )
                ] = {
                    seasonKey,
                    seasonLabel:
                        display,
                    username,
                    rank,
                    rewardType:
                        'discount',
                    rewardLabel:
                        `Thẻ giảm giá ${percent}%`,
                    status:
                        'claimed',
                    claimedAt:
                        firebase.database
                            .ServerValue
                            .TIMESTAMP
                };

                await db.ref()
                    .update(rootUpdates);

                rewardFinalized = true;

                await recordLeaderboardRewardHistory({
                    type:
                        'leaderboard_reward',
                    summary:
                        `Nhận Thẻ giảm giá ${percent}% ` +
                        `do xếp hạng 2 BXH ${display}`,
                    source:
                        'leaderboard_rank_reward',
                    targetUsername:
                        username,
                    targetName:
                        currentUser?.name ||
                        username,
                    amount:
                        null,
                    unit:
                        '',
                    reversible:
                        false,
                    nonReversibleReason:
                        'Phần thưởng xếp hạng mùa thi đua.',
                    details: {
                        seasonKey,
                        rank,
                        rewardType:
                            'discount',
                        percent,
                        discountKey
                    }
                });

                alert(
                    `🥈 Chúc mừng! Bạn nhận được ` +
                    `Thẻ giảm giá ${percent}% cho ${display}.`
                );
            } else {
                const configuredAmount =
                    rank === 3
                        ? Number(
                            settings?.rewardRank3
                        )
                        : Number(
                            settings?.rewardRank4
                        );

                const fallbackAmount =
                    rank === 3
                        ? 100
                        : 50;

                const amount =
                    Number.isFinite(
                        configuredAmount
                    ) &&
                    configuredAmount >= 0
                        ? configuredAmount
                        : fallbackAmount;

                const rootUpdates = {};

                rootUpdates[
                    `student_coins/${username}`
                ] =
                    firebase.database
                        .ServerValue
                        .increment(amount);

                rootUpdates[
                    getLeaderboardClaimPath(
                        seasonKey,
                        username
                    )
                ] = {
                    seasonKey,
                    seasonLabel:
                        display,
                    username,
                    rank,
                    rewardType:
                        'coin',
                    rewardLabel:
                        `${amount} Coin`,
                    rewardAmount:
                        amount,
                    status:
                        'claimed',
                    claimedAt:
                        firebase.database
                            .ServerValue
                            .TIMESTAMP
                };

                await db.ref()
                    .update(rootUpdates);

                rewardFinalized = true;

                await recordLeaderboardRewardHistory({
                    type:
                        'leaderboard_reward',
                    summary:
                        `Nhận ${amount} Coin ` +
                        `do xếp hạng #${rank} BXH ${display}`,
                    source:
                        'leaderboard_rank_reward',
                    targetUsername:
                        username,
                    targetName:
                        currentUser?.name ||
                        username,
                    amount,
                    unit:
                        'Coin',
                    reversible:
                        false,
                    nonReversibleReason:
                        'Phần thưởng xếp hạng mùa thi đua.',
                    details: {
                        seasonKey,
                        rank,
                        rewardType:
                            'coin',
                        amount
                    }
                });

                alert(
                    `🏆 Chúc mừng! Hạng #${rank} ` +
                    `nhận ${amount} Coin cho ${display}.`
                );
            }

            await refreshPreviousLeaderboardRewardPanel();
        } catch (error) {
            console.error(
                'Lỗi nhận thưởng BXH:',
                error
            );

            if (
                lockedClaimRef &&
                !rewardFinalized
            ) {
                try {
                    await lockedClaimRef.transaction(
                        current => {
                            if (
                                current?.status !==
                                    'processing'
                            ) {
                                return;
                            }

                            return {
                                ...current,
                                status:
                                    'retry',
                                lastErrorAt:
                                    Date.now()
                            };
                        }
                    );
                } catch (
                    rollbackError
                ) {
                    console.warn(
                        'Không thể mở khóa claim BXH:',
                        rollbackError
                    );
                }
            }

            alert(
                '❌ Không thể nhận thưởng BXH. ' +
                'Vui lòng thử lại.'
            );
        } finally {
            buttons.forEach(button => {
                button.disabled = false;
            });
        }
    };


// ======================================================
// 5. ĐÓNG VÀ MỞ MODAL
// ======================================================

window.openRulesModal = function () {
    const modal =
        document.getElementById("rulesModal");

    modal?.classList.add("active");

    document.body.classList.add(
        "leaderboard-open"
    );

    document
        .getElementById("rulesCloseBtn")
        ?.focus();
};


window.closeRulesModal = function () {
    document
        .getElementById("rulesModal")
        ?.classList.remove("active");


    const leaderboardIsOpen =
        document
            .getElementById("leaderboardModal")
            ?.classList.contains("active");


    const chestIsOpen =
        document
            .getElementById("treasureChestModal")
            ?.classList.contains("active");


    if (
        !leaderboardIsOpen &&
        !chestIsOpen
    ) {
        document.body.classList.remove(
            "leaderboard-open"
        );
    }
};


window.closeLeaderboardModal = function () {
    document
        .getElementById("leaderboardModal")
        ?.classList.remove("active");

    document.body.classList.remove(
        "leaderboard-open"
    );
};


function closeTreasureChestModal() {
    document
        .getElementById("treasureChestModal")
        ?.classList.remove("active");


    const leaderboardIsOpen =
        document
            .getElementById("leaderboardModal")
            ?.classList.contains("active");


    if (!leaderboardIsOpen) {
        document.body.classList.remove(
            "leaderboard-open"
        );
    }
}


// ======================================================
// 6. MỞ BẢNG XẾP HẠNG
// ======================================================

window.openLeaderboardModal = async function () {
    if (window.currentActiveExamId) {
        if (
            typeof window.showExamLockWarning ===
            'function'
        ) {
            window.showExamLockWarning(
                '⚠️ Bảng xếp hạng tạm khóa khi đang làm bài thi!'
            );
        } else {
            alert(
                '⚠️ Bảng xếp hạng tạm khóa khi đang làm bài thi!'
            );
        }

        return;
    }

    try {
        const lbSettingsSnap =
            await db
                .ref('leaderboard_settings')
                .once('value');

        const lbSettings =
            lbSettingsSnap.val() || {
                isOpen: false
            };

        const now = new Date();

        const currentMonth =
            now.getMonth() + 1;

        const currentYear =
            now.getFullYear();

        let isSeasonActive =
            lbSettings.isOpen === true;

        /*
         * FIX QUAN TRỌNG:
         * Học sinh KHÔNG còn tự ghi
         * leaderboard_settings/isOpen.
         *
         * Firebase Rules chỉ cho teacher ghi node này.
         * Nếu đã tới tháng được hẹn, phía học sinh chỉ
         * coi mùa giải là đang mở trên giao diện.
         */
        if (
            !isSeasonActive &&
            lbSettings.targetMonth &&
            lbSettings.targetYear
        ) {
            const targetMonth =
                Number(
                    lbSettings.targetMonth
                );

            const targetYear =
                Number(
                    lbSettings.targetYear
                );

            const reachedTarget =
                currentYear > targetYear ||
                (
                    currentYear ===
                        targetYear &&
                    currentMonth >=
                        targetMonth
                );

            if (reachedTarget) {
                isSeasonActive = true;
            }
        }

        if (!isSeasonActive) {
            /*
             * BXH hiện tại có thể đóng nhưng học sinh vẫn phải
             * nhận được phần thưởng của tháng đã kết thúc.
             */
            let previousRewardState = null;

            try {
                previousRewardState =
                    await getPreviousLeaderboardRewardState();
            } catch (rewardError) {
                console.warn(
                    'Không thể kiểm tra thưởng mùa trước khi BXH đóng:',
                    rewardError
                );
            }

            if (
                !previousRewardState?.rank &&
                !previousRewardState?.claim
            ) {
                if (
                    lbSettings.targetMonth &&
                    lbSettings.targetYear
                ) {
                    alert(
                        `🔒 Bảng xếp hạng đang đóng. ` +
                        `Mùa giải mới bắt đầu vào Tháng ` +
                        `${lbSettings.targetMonth}/` +
                        `${lbSettings.targetYear}.`
                    );
                } else {
                    alert(
                        '🔒 Bảng xếp hạng đang bị khóa do chưa bắt đầu mùa giải!'
                    );
                }

                return;
            }

            const lbModal =
                document.getElementById(
                    'leaderboardModal'
                );

            if (!lbModal) {
                return;
            }

            lbModal.classList.add('active');

            document.body.classList.add(
                'leaderboard-open'
            );

            const monthDisplay =
                document.getElementById(
                    'lbMonthDisplay'
                );

            if (monthDisplay) {
                monthDisplay.textContent =
                    'Mùa hiện tại đang đóng';
            }

            const body =
                document.getElementById(
                    'leaderboardBody'
                );

            if (body) {
                body.innerHTML = `
                    <div id="lbSeasonRewardArea"></div>
                    ${getLeaderboardStateHTML(
                        'empty',
                        'Mùa giải hiện tại đang đóng',
                        'Bạn vẫn có thể nhận phần thưởng của mùa thi đua đã kết thúc.'
                    )}
                `;
            }

            await refreshPreviousLeaderboardRewardPanel();

            return;
        }

        const rank3Reward =
            Number.isFinite(
                Number(
                    lbSettings.rewardRank3
                )
            )
                ? Number(
                    lbSettings.rewardRank3
                )
                : 100;

        const rank4Reward =
            Number.isFinite(
                Number(
                    lbSettings.rewardRank4
                )
            )
                ? Number(
                    lbSettings.rewardRank4
                )
                : 50;

        const ruleRank3 =
            document.getElementById(
                'lbRuleRank3Reward'
            );

        if (ruleRank3) {
            ruleRank3.textContent =
                `${rank3Reward} Coin`;
        }

        const ruleRank4 =
            document.getElementById(
                'lbRuleRank4Reward'
            );

        if (ruleRank4) {
            ruleRank4.textContent =
                `${rank4Reward} Coin khích lệ`;
        }

        const lbModal =
            document.getElementById(
                'leaderboardModal'
            );

        if (!lbModal) {
            return;
        }

        lbModal.classList.add('active');

        document.body.classList.add(
            'leaderboard-open'
        );

        document
            .getElementById('lbCloseBtn')
            ?.focus();

        await calculateAndRenderLeaderboard();
    } catch (error) {
        console.error(error);

        alert(
            '❌ Không thể mở bảng xếp hạng. ' +
            'Vui lòng kiểm tra kết nối và thử lại!'
        );
    }
};

// ======================================================
// 7. TÍNH TOÁN DỮ LIỆU BẢNG XẾP HẠNG
// ======================================================

async function calculateAndRenderLeaderboard() {
    const body =
        document.getElementById(
            'leaderboardBody'
        );

    const monthDisplay =
        document.getElementById(
            'lbMonthDisplay'
        );

    if (!body || !monthDisplay) {
        return;
    }

    body.innerHTML =
        getLeaderboardLoadingHTML();

    const now = new Date();

    const currentMonth =
        now.getMonth();

    const currentYear =
        now.getFullYear();

    monthDisplay.textContent =
        `Mùa thi đua · Tháng ` +
        `${currentMonth + 1}/${currentYear}`;

    try {
        const source =
            await getLeaderboardSourceData();

        const rankedData =
            buildLeaderboardDataForPeriod({
                users:
                    source.users,
                assignments:
                    source.assignments,
                submissions:
                    source.submissions,
                trackingData:
                    source.trackingData,
                year:
                    currentYear,
                monthIndex:
                    currentMonth
            });

        if (rankedData.length === 0) {
            body.innerHTML =
                getLeaderboardStateHTML(
                    'empty',
                    'Chưa có dữ liệu xếp hạng',
                    'Tháng này chưa có bài tập hợp lệ đã được chấm điểm.'
                );

            return;
        }

        body.innerHTML =
            renderLeaderboard(
                rankedData
            );

        /*
         * Sau khi dựng BXH hiện tại,
         * kiểm tra phần thưởng của tháng ĐÃ KẾT THÚC.
         */
        await refreshPreviousLeaderboardRewardPanel();
    } catch (error) {
        body.innerHTML =
            getLeaderboardStateHTML(
                'error',
                'Không thể tải bảng xếp hạng',
                'Đã xảy ra lỗi kết nối dữ liệu. Hãy nhấn nút làm mới để thử lại.'
            );

        console.error(error);
    }
}

// ======================================================
// 8. HIỂN THỊ TOÀN BỘ BẢNG XẾP HẠNG
// ======================================================

function renderLeaderboard(rankedData) {
    const participantCount =
        rankedData.length;


    const bestScore =
        rankedData[0]?.finalScore || 0;


    const totalTens =
        rankedData.reduce(
            (sum, student) =>
                sum + student.tens,
            0
        );


    const currentUsername =
        getCurrentUsername();


    const currentIndex =
        rankedData.findIndex(
            (student) =>
                student.username ===
                currentUsername
        );


    const currentStudent =
        currentIndex >= 0
            ? rankedData[currentIndex]
            : null;


    const topThree =
        rankedData.slice(0, 3);


    const remaining =
        rankedData.slice(3);


    return `
        <div id="lbSeasonRewardArea"></div>

        <section
            class="lb-summary-grid"
            aria-label="Thống kê tổng quan"
        >
            ${renderSummaryCard(
        "👥",
        "Học sinh xếp hạng",
        participantCount
    )}

            ${renderSummaryCard(
        "⚡",
        "Điểm dẫn đầu",
        formatScore(bestScore)
    )}

            ${renderSummaryCard(
        "⭐",
        "Tổng điểm 10",
        totalTens
    )}
        </section>


        ${currentStudent
            ? renderCurrentUserCard(
                currentStudent,
                currentIndex + 1
            )
            : ""
        }


        <section aria-labelledby="podiumHeading">

            <div class="lb-section-heading">
                <h4
                    id="podiumHeading"
                    class="lb-section-title"
                >
                    Bục vinh danh
                </h4>

                <span class="lb-section-note">
                    Top 3 tháng này
                </span>
            </div>

            <div class="lb-podium">
                ${renderPodium(
            topThree,
            currentUsername
        )}
            </div>

        </section>


        ${remaining.length > 0
            ? `
                    <section aria-labelledby="rankListHeading">

                        <div class="lb-section-heading">
                            <h4
                                id="rankListHeading"
                                class="lb-section-title"
                            >
                                Bảng thứ hạng
                            </h4>

                            <span class="lb-section-note">
                                ${remaining.length}
                                học sinh tiếp theo
                            </span>
                        </div>

                        <div class="lb-rank-list">
                            ${remaining
                .map(
                    (
                        student,
                        index
                    ) =>
                        renderRankRow(
                            student,
                            index + 4,
                            currentUsername
                        )
                )
                .join("")}
                        </div>

                    </section>
                `
            : ""
        }
    `;
}


// ======================================================
// 9. THẺ THỐNG KÊ
// ======================================================

function renderSummaryCard(
    icon,
    label,
    value
) {
    return `
        <article class="lb-summary-card">

            <span class="lb-summary-icon">
                ${icon}
            </span>

            <span>
                <span class="lb-summary-label">
                    ${escapeHTML(label)}
                </span>

                <strong class="lb-summary-value">
                    ${escapeHTML(value)}
                </strong>
            </span>

        </article>
    `;
}


// ======================================================
// 10. THẺ VỊ TRÍ CỦA NGƯỜI DÙNG
// ======================================================

function renderCurrentUserCard(
    student,
    rank
) {
    return `
        <section
            class="lb-my-rank"
            aria-label="Vị trí của bạn"
        >

            <div class="lb-my-rank-main">

                <span class="lb-my-rank-badge">
                    #${rank}
                </span>

                <div>
                    <p class="lb-my-rank-kicker">
                        Vị trí của bạn
                    </p>

                    <p class="lb-my-rank-name">
                        ${escapeHTML(student.name)}
                    </p>
                </div>

            </div>

            <div class="lb-my-rank-score">
                <strong>
                    ${formatScore(
        student.finalScore
    )}
                </strong>

                <span>
                    điểm xếp hạng
                </span>
            </div>

        </section>
    `;
}


// ======================================================
// 11. BỤC VINH DANH TOP 3
// ======================================================

function renderPodium(
    topThree,
    currentUsername
) {
    // Hiển thị:
    // Hạng 2 - Hạng 1 - Hạng 3.
    const displayOrder = [
        topThree[1],
        topThree[0],
        topThree[2]
    ].filter(Boolean);


    return displayOrder
        .map((student) => {
            const actualRank =
                topThree.indexOf(student) + 1;


            const rankClass =
                actualRank === 1
                    ? "is-first"
                    : actualRank === 2
                        ? "is-second"
                        : "is-third";


            const medal =
                actualRank === 1
                    ? "🥇"
                    : actualRank === 2
                        ? "🥈"
                        : "🥉";


            const isCurrent =
                student.username ===
                currentUsername;


            return `
                <article
                    class="lb-podium-card ${rankClass}"
                >

                    <span class="lb-podium-rank">
                        <span>
                            ${medal}
                        </span>
                    </span>

                    <div class="lb-podium-crown">
                        ${actualRank === 1
                    ? "♛"
                    : "&nbsp;"
                }
                    </div>

                    ${renderAvatar(
                    student.avatar,
                    student.name
                )}

                    <p
                        class="lb-podium-name"
                        title="${escapeHTML(
                    student.name
                )}"
                    >
                        ${escapeHTML(student.name)}

                        ${isCurrent
                    ? `
                                    <span class="lb-you-tag">
                                        Bạn
                                    </span>
                                `
                    : ""
                }
                    </p>

                    <div class="lb-podium-score">
                        ${formatScore(
                    student.finalScore
                )}

                        <small>
                            điểm
                        </small>
                    </div>

                    <div class="lb-podium-meta">

                        <span class="lb-stat-pill">
                            ⭐ ${student.tens}
                            điểm 10
                        </span>

                        <span
                            class="
                                lb-stat-pill
                                ${student.violations > 0
                    ? "is-danger"
                    : "is-good"
                }
                            "
                        >
                            ${student.violations > 0
                    ? "⚠"
                    : "✓"
                }

                            ${student.violations}
                            vi phạm
                        </span>

                    </div>

                </article>
            `;
        })
        .join("");
}


// ======================================================
// 12. DÒNG XẾP HẠNG TỪ HẠNG 4 TRỞ ĐI
// ======================================================

function renderRankRow(
    student,
    rank,
    currentUsername
) {
    const isCurrent =
        student.username ===
        currentUsername;


    const progress =
        getProgressPercent(
            student.finalScore
        );


    return `
        <article
            class="
                rank-row
                ${isCurrent
            ? "is-current-user"
            : ""
        }
            "
        >

            <div class="rank-info">

                <span class="rank-number">
                    #${rank}
                </span>

                ${renderAvatar(
            student.avatar,
            student.name
        )}

                <div class="rank-person">

                    <p
                        class="rank-name"
                        title="${escapeHTML(
            student.name
        )}"
                    >
                        ${escapeHTML(student.name)}

                        ${isCurrent
            ? `
                                    <span class="lb-you-tag">
                                        Bạn
                                    </span>
                                `
            : ""
        }
                    </p>

                    <div class="rank-mini-stats">

                        <span class="lb-stat-pill">
                            ⭐ ${student.tens}
                            điểm 10
                        </span>

                        <span
                            class="
                                lb-stat-pill
                                ${student.violations > 0
            ? "is-danger"
            : "is-good"
        }
                            "
                        >
                            ${student.violations > 0
            ? "⚠"
            : "✓"
        }

                            ${student.violations}
                            vi phạm
                        </span>

                    </div>

                </div>

            </div>


            <div class="rank-score-wrap">

                <strong class="rank-score">
                    ${formatScore(
            student.finalScore
        )}
                </strong>

                <span class="rank-score-label">
                    ĐTB
                    ${formatScore(student.dtb)}
                    · Video
                    +${formatScore(
            student.videoBonus
        )}
                </span>

                <div
                    class="lb-progress"
                    aria-hidden="true"
                >
                    <span
                        style="
                            width:
                            ${progress.toFixed(1)}%
                        "
                    ></span>
                </div>

            </div>

        </article>
    `;
}


// ======================================================
// 13. MỞ RƯƠNG KHO BÁU
// ======================================================

window.openTreasureChest = async function () {
    try {
        const rewardState =
            await getPreviousLeaderboardRewardState();

        if (
            !rewardState ||
            rewardState.rank !== 1 ||
            rewardState.claim?.rewardType !==
                'chest' ||
            rewardState.claim?.status !==
                'available_chest'
        ) {
            alert(
                '🔒 Bạn không có Rương Hạng 1 hợp lệ để mở.'
            );
            return;
        }

        window.activeLeaderboardChestSeasonKey =
            rewardState.seasonKey;

        const chestCopy =
            document.querySelector(
                '#treasureChestModal .lb-chest-copy'
            );

        if (chestCopy) {
            chestCopy.textContent =
                `Rương Hạng 1 ${rewardState.display}. ` +
                `Chỉ được nhận một lần. ` +
                `Hãy chọn một loại phần thưởng.`;
        }

        document
            .getElementById(
                'treasureChestModal'
            )
            ?.classList.add('active');

        document.body.classList.add(
            'leaderboard-open'
        );

        document
            .getElementById(
                'chestCloseBtn'
            )
            ?.focus();
    } catch (error) {
        console.error(
            'Lỗi mở Rương Hạng 1:',
            error
        );

        alert(
            '❌ Không thể xác minh quyền mở Rương Hạng 1.'
        );
    }
};


// ======================================================
// 14. THUẬT TOÁN NHẬN THƯỞNG RƯƠNG
// ======================================================

window.claimChestReward = async function (
    choiceType
) {
    const btnNodes =
        document.querySelectorAll(
            '#treasureChestModal [data-chest-choice]'
        );

    btnNodes.forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.5';
    });

    let claimRef = null;
    let awardCommitted = false;

    try {
        if (
            choiceType !== 'coin' &&
            choiceType !== 'item'
        ) {
            throw new Error(
                'INVALID_CHEST_CHOICE'
            );
        }

        const rewardState =
            await getPreviousLeaderboardRewardState();

        if (
            !rewardState ||
            rewardState.rank !== 1 ||
            rewardState.claim?.rewardType !==
                'chest' ||
            rewardState.claim?.status !==
                'available_chest'
        ) {
            alert(
                '🔒 Rương không còn khả dụng hoặc bạn không có quyền mở.'
            );

            closeTreasureChestModal();
            return;
        }

        const {
            seasonKey,
            display,
            username
        } = rewardState;

        claimRef =
            db.ref(
                getLeaderboardClaimPath(
                    seasonKey,
                    username
                )
            );

        /*
         * Khóa rương bằng transaction.
         * Hai tab bấm cùng lúc chỉ một tab được quyền tiếp tục.
         */
        const lockResult =
            await claimRef.transaction(
                current => {
                    if (
                        !current ||
                        current.rank !== 1 ||
                        current.rewardType !==
                            'chest' ||
                        current.status !==
                            'available_chest'
                    ) {
                        return;
                    }

                    return {
                        ...current,
                        status:
                            'processing_chest',
                        selectedChoice:
                            choiceType,
                        processingAt:
                            Date.now()
                    };
                }
            );

        if (!lockResult.committed) {
            alert(
                '⚠️ Rương này đang được xử lý hoặc đã nhận ở tab khác.'
            );
            return;
        }

        const lbSettingsSnap =
            await db
                .ref(
                    'leaderboard_settings'
                )
                .once('value');

        const lbSettings =
            lbSettingsSnap.val() || {
                chestDup: 95,
                chestNorm: 4,
                chestLeg: 1
            };

        const dupThreshold =
            Math.max(
                0,
                Number(
                    lbSettings.chestDup
                ) || 0
            ) / 100;

        const normThreshold =
            dupThreshold +
            (
                Math.max(
                    0,
                    Number(
                        lbSettings.chestNorm
                    ) || 0
                ) / 100
            );

        let rewardLabel = '';
        let historyPayload = null;
        const rootUpdates = {};

        if (choiceType === 'coin') {
            const rand =
                Math.random();

            let amount = 0;

            if (rand < 0.70) {
                amount =
                    Math.floor(
                        Math.random() * 301
                    ) + 200;
            } else if (rand < 0.90) {
                amount =
                    Math.floor(
                        Math.random() * 201
                    ) + 500;
            } else {
                amount =
                    Math.floor(
                        Math.random() * 301
                    ) + 700;
            }

            rewardLabel =
                `${amount} Coin`;

            rootUpdates[
                `student_coins/${username}`
            ] =
                firebase.database
                    .ServerValue
                    .increment(amount);

            historyPayload = {
                type:
                    'leaderboard_reward',
                summary:
                    `Mở Rương Hạng 1 ${display} ` +
                    `và nhận ${amount} Coin`,
                source:
                    'leaderboard_chest',
                targetUsername:
                    username,
                targetName:
                    currentUser?.name ||
                    username,
                amount,
                unit:
                    'Coin',
                reversible:
                    false,
                nonReversibleReason:
                    'Phần thưởng ngẫu nhiên từ Rương Hạng 1.',
                details: {
                    seasonKey,
                    rank:
                        1,
                    rewardType:
                        'coin',
                    amount
                }
            };
        } else {
            const invSnap =
                await db
                    .ref(
                        `student_inventory/` +
                        `${username}`
                    )
                    .once('value');

            const inventoryData =
                invSnap.val() || {};

            const exactInventory =
                Object.values(
                    inventoryData
                )
                    .map(item =>
                        String(
                            item?.id ?? ''
                        )
                    )
                    .filter(Boolean);

            const normalizeTag =
                value => {
                    return String(value || '')
                        .normalize('NFD')
                        .replace(
                            /[\u0300-\u036f]/g,
                            ''
                        )
                        .replace(/đ/g, 'd')
                        .replace(/Đ/g, 'D')
                        .trim()
                        .toLowerCase();
                };

            const isPaintingItem =
                item =>
                    normalizeTag(
                        item?.tag
                    ) === 'hoi hoa';

            const legendaryTags = [
                'truyen thuyet',
                'tu ky si'
            ];

            const isRareItem =
                item => {
                    return (
                        legendaryTags.includes(
                            normalizeTag(
                                item?.tag
                            )
                        ) ||
                        Number(
                            item?.price
                        ) > 700
                    );
                };

            const validItems =
                (
                    typeof StoreConfig !==
                        'undefined' &&
                    Array.isArray(
                        StoreConfig.items
                    )
                )
                    ? StoreConfig.items.filter(
                        item =>
                            item.type !==
                            'music'
                    )
                    : [];

            if (!validItems.length) {
                throw new Error(
                    'NO_VALID_STORE_ITEMS'
                );
            }

            const unownedItems =
                validItems.filter(
                    item =>
                        !exactInventory.includes(
                            String(item.id)
                        )
                );

            const ownedDuplicateCandidates =
                validItems.filter(
                    item =>
                        exactInventory.includes(
                            String(item.id)
                        ) &&
                        !isPaintingItem(
                            item
                        )
                );

            const rand =
                Math.random();

            if (
                rand < dupThreshold &&
                ownedDuplicateCandidates
                    .length > 0
            ) {
                const duplicateItem =
                    ownedDuplicateCandidates[
                        Math.floor(
                            Math.random() *
                            ownedDuplicateCandidates
                                .length
                        )
                    ];

                const amount = 200;

                rewardLabel =
                    `${amount} Coin bù ` +
                    `do trùng ${duplicateItem.name}`;

                rootUpdates[
                    `student_coins/${username}`
                ] =
                    firebase.database
                        .ServerValue
                        .increment(amount);

                historyPayload = {
                    type:
                        'leaderboard_reward',
                    summary:
                        `Rương Hạng 1 ${display}: ` +
                        `trùng ${duplicateItem.name}, ` +
                        `nhận bù ${amount} Coin`,
                    source:
                        'leaderboard_chest_duplicate',
                    targetUsername:
                        username,
                    targetName:
                        currentUser?.name ||
                        username,
                    amount,
                    unit:
                        'Coin',
                    reversible:
                        false,
                    nonReversibleReason:
                        'Coin bồi thường do vật phẩm trong rương bị trùng.',
                    details: {
                        seasonKey,
                        rank:
                            1,
                        rewardType:
                            'duplicate_compensation',
                        itemId:
                            duplicateItem.id,
                        itemName:
                            duplicateItem.name,
                        amount
                    }
                };
            } else if (
                unownedItems.length === 0
            ) {
                const amount = 500;

                rewardLabel =
                    `${amount} Coin bù ` +
                    `do đã sở hữu toàn bộ vật phẩm`;

                rootUpdates[
                    `student_coins/${username}`
                ] =
                    firebase.database
                        .ServerValue
                        .increment(amount);

                historyPayload = {
                    type:
                        'leaderboard_reward',
                    summary:
                        `Rương Hạng 1 ${display}: ` +
                        `nhận bù ${amount} Coin ` +
                        `do đã sở hữu toàn bộ vật phẩm`,
                    source:
                        'leaderboard_chest_all_owned',
                    targetUsername:
                        username,
                    targetName:
                        currentUser?.name ||
                        username,
                    amount,
                    unit:
                        'Coin',
                    reversible:
                        false,
                    nonReversibleReason:
                        'Coin bồi thường từ Rương Hạng 1.',
                    details: {
                        seasonKey,
                        rank:
                            1,
                        rewardType:
                            'all_items_owned_compensation',
                        amount
                    }
                };
            } else {
                let selectedItem = null;

                if (rand < normThreshold) {
                    const normalItems =
                        unownedItems.filter(
                            item =>
                                !isRareItem(
                                    item
                                )
                        );

                    selectedItem =
                        normalItems.length
                            ? normalItems[
                                Math.floor(
                                    Math.random() *
                                    normalItems.length
                                )
                            ]
                            : unownedItems[
                                Math.floor(
                                    Math.random() *
                                    unownedItems.length
                                )
                            ];
                } else {
                    const rareItems =
                        unownedItems.filter(
                            item =>
                                isRareItem(
                                    item
                                )
                        );

                    selectedItem =
                        rareItems.length
                            ? rareItems[
                                Math.floor(
                                    Math.random() *
                                    rareItems.length
                                )
                            ]
                            : unownedItems[
                                Math.floor(
                                    Math.random() *
                                    unownedItems.length
                                )
                            ];
                }

                if (!selectedItem) {
                    throw new Error(
                        'NO_SELECTED_ITEM'
                    );
                }

                if (
                    isPaintingItem(
                        selectedItem
                    ) &&
                    exactInventory.includes(
                        String(
                            selectedItem.id
                        )
                    )
                ) {
                    throw new Error(
                        'DUPLICATE_PAINTING_ITEM'
                    );
                }

                rewardLabel =
                    `Vật phẩm ` +
                    `${selectedItem.name}`;

                rootUpdates[
                    `student_inventory/` +
                    `${username}/` +
                    `${selectedItem.id}`
                ] = {
                    id:
                        selectedItem.id,
                    purchaseTime:
                        firebase.database
                            .ServerValue
                            .TIMESTAMP,
                    source:
                        'leaderboard_chest',
                    leaderboardSeason:
                        seasonKey,
                    isTrial:
                        null,
                    trialExpiry:
                        null,
                    isEquipped:
                        false
                };

                historyPayload = {
                    type:
                        'leaderboard_reward',
                    summary:
                        `Mở Rương Hạng 1 ${display} ` +
                        `và nhận vật phẩm ` +
                        `${selectedItem.name}`,
                    source:
                        'leaderboard_chest',
                    targetUsername:
                        username,
                    targetName:
                        currentUser?.name ||
                        username,
                    amount:
                        null,
                    unit:
                        '',
                    reversible:
                        false,
                    nonReversibleReason:
                        'Vật phẩm ngẫu nhiên từ Rương Hạng 1.',
                    details: {
                        seasonKey,
                        rank:
                            1,
                        rewardType:
                            'item',
                        itemId:
                            selectedItem.id,
                        itemName:
                            selectedItem.name,
                        itemTag:
                            selectedItem.tag ||
                            ''
                    }
                };
            }
        }

        /*
         * Phần thưởng và trạng thái CLAIMED được ghi
         * trong CÙNG một multi-location update.
         */
        rootUpdates[
            getLeaderboardClaimPath(
                seasonKey,
                username
            )
        ] = {
            seasonKey,
            seasonLabel:
                display,
            username,
            rank:
                1,
            rewardType:
                'chest',
            rewardLabel,
            selectedChoice:
                choiceType,
            status:
                'claimed',
            claimedAt:
                firebase.database
                    .ServerValue
                    .TIMESTAMP
        };

        await db.ref()
            .update(rootUpdates);

        awardCommitted = true;

        if (historyPayload) {
            await recordLeaderboardRewardHistory(
                historyPayload
            );
        }

        alert(
            `🎉 Nhận thưởng thành công!\n` +
            `${rewardLabel}`
        );

        closeTreasureChestModal();

        await refreshPreviousLeaderboardRewardPanel();
    } catch (error) {
        console.error(
            'Lỗi nhận Rương Hạng 1:',
            error
        );

        /*
         * Chỉ mở khóa lại nếu phần thưởng
         * CHƯA được ghi thành công.
         */
        if (
            claimRef &&
            !awardCommitted
        ) {
            try {
                await claimRef.transaction(
                    current => {
                        if (
                            current?.status !==
                                'processing_chest'
                        ) {
                            return;
                        }

                        return {
                            ...current,
                            status:
                                'available_chest',
                            selectedChoice:
                                null,
                            processingAt:
                                null,
                            lastErrorAt:
                                Date.now()
                        };
                    }
                );
            } catch (
                rollbackError
            ) {
                console.warn(
                    'Không thể mở khóa lại Rương:',
                    rollbackError
                );
            }
        }

        alert(
            '❌ Có lỗi xảy ra khi nhận thưởng Rương. ' +
            'Vui lòng thử lại!'
        );
    } finally {
        btnNodes.forEach(button => {
            button.disabled = false;
            button.style.opacity = '1';
        });
    }
};

// ======================================================
// 15. TỰ ĐỘNG KHỞI TẠO KHI TRANG TẢI XONG
// ======================================================

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initLeaderboardSystem
    );
} else {
    initLeaderboardSystem();
}