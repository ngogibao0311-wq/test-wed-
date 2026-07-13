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
                                    100 Coin
                                </span>
                            </div>

                            <div class="lb-reward-item">
                                <span>🎖️</span>
                                <span>
                                    <strong>Hạng 4+</strong><br>
                                    50 Coin khích lệ
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
            id="treasureChestModal ui-theme-immune"
            class="modal-overlay"
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
    // Không cho mở bảng xếp hạng
    // khi học sinh đang làm bài thi nghiêm ngặt.
    if (window.currentActiveExamId) {
        if (
            typeof window.showExamLockWarning ===
            "function"
        ) {
            window.showExamLockWarning(
                "⚠️ Bảng xếp hạng tạm khóa khi đang làm bài thi!"
            );
        } else {
            alert(
                "⚠️ Bảng xếp hạng tạm khóa khi đang làm bài thi!"
            );
        }

        return;
    }


    try {
        const lbSettingsSnap =
            await db
                .ref("leaderboard_settings")
                .once("value");


        const lbSettings =
            lbSettingsSnap.val() || {
                isOpen: false
            };


        const now =
            new Date();


        const currentMonth =
            now.getMonth() + 1;


        const currentYear =
            now.getFullYear();


        let isSeasonActive =
            lbSettings.isOpen;


        // Tự động mở bảng xếp hạng
        // khi đến tháng đã được giáo viên hẹn.
        if (
            !isSeasonActive &&
            lbSettings.targetMonth &&
            lbSettings.targetYear
        ) {
            const reachedTarget =
                currentYear >
                lbSettings.targetYear ||
                (
                    currentYear ===
                    lbSettings.targetYear &&
                    currentMonth >=
                    lbSettings.targetMonth
                );


            if (reachedTarget) {
                isSeasonActive = true;

                await db
                    .ref("leaderboard_settings")
                    .update({
                        isOpen: true
                    });
            }
        }


        if (!isSeasonActive) {
            if (
                lbSettings.targetMonth &&
                lbSettings.targetYear
            ) {
                alert(
                    `🔒 Bảng xếp hạng đang đóng để bảo trì. ` +
                    `Mùa giải mới bắt đầu vào Tháng ` +
                    `${lbSettings.targetMonth}/${lbSettings.targetYear}.`
                );
            } else {
                alert(
                    "🔒 Bảng xếp hạng đang bị khóa do chưa bắt đầu mùa giải!"
                );
            }

            return;
        }


        const lbModal =
            document.getElementById(
                "leaderboardModal"
            );


        if (!lbModal) {
            return;
        }


        lbModal.classList.add("active");

        document.body.classList.add(
            "leaderboard-open"
        );


        document
            .getElementById("lbCloseBtn")
            ?.focus();


        await calculateAndRenderLeaderboard();

    } catch (error) {
        console.error(error);

        alert(
            "❌ Không thể mở bảng xếp hạng. " +
            "Vui lòng kiểm tra kết nối và thử lại!"
        );
    }
};


// ======================================================
// 7. TÍNH TOÁN DỮ LIỆU BẢNG XẾP HẠNG
// ======================================================

async function calculateAndRenderLeaderboard() {
    const body =
        document.getElementById(
            "leaderboardBody"
        );


    const monthDisplay =
        document.getElementById(
            "lbMonthDisplay"
        );


    if (!body || !monthDisplay) {
        return;
    }


    body.innerHTML =
        getLeaderboardLoadingHTML();


    const now =
        new Date();


    const currentMonth =
        now.getMonth();


    const currentYear =
        now.getFullYear();


    monthDisplay.textContent =
        `Mùa thi đua · Tháng ` +
        `${currentMonth + 1}/${currentYear}`;


    try {
        const [
            users,
            assignments,
            submissions,
            trackingSnap
        ] = await Promise.all([
            getDB("users"),
            getDB("assignments"),
            getDB("submissions"),
            db.ref("video_tracking").once("value")
        ]);


        const trackingData =
            trackingSnap.val() || {};


        const students =
            (users || []).filter(
                (user) =>
                    user.role === "student"
            );


        const rankedData = [];


        // Chỉ lấy bài tập thuộc tháng hiện tại.
        const monthAssignments =
            (assignments || []).filter(
                (assignment) => {
                    if (!assignment.endDate) {
                        return false;
                    }


                    const assignmentDate =
                        new Date(
                            assignment.endDate.replace(
                                " ",
                                "T"
                            )
                        );


                    return (
                        !Number.isNaN(
                            assignmentDate.getTime()
                        ) &&
                        assignmentDate.getMonth() ===
                        currentMonth &&
                        assignmentDate.getFullYear() ===
                        currentYear
                    );
                }
            );


        students.forEach((student) => {
            let totalScore = 0;
            let validCount = 0;
            let count10s = 0;
            let violationCount = 0;
            let totalVideoBonus = 0;


            // ------------------------------------------
            // TÍNH ĐIỂM THƯỞNG XEM VIDEO
            // ------------------------------------------

            monthAssignments.forEach(
                (assignment) => {
                    if (
                        assignment.watchCondition &&
                        assignment.watchCondition > 0
                    ) {
                        const watchedTime =
                            trackingData[
                            assignment.id
                            ]?.[
                            student.username
                            ] || 0;


                        const ratio =
                            Math.min(
                                1,
                                watchedTime /
                                assignment.watchCondition
                            );


                        totalVideoBonus +=
                            ratio * 0.5;
                    }
                }
            );


            // Tổng điểm video tối đa 1 điểm.
            totalVideoBonus =
                Math.min(
                    totalVideoBonus,
                    1
                );


            // ------------------------------------------
            // LẤY BÀI NỘP CỦA HỌC SINH
            // ------------------------------------------

            const studentSubmissions =
                (submissions || []).filter(
                    (submission) =>
                        submission.studentUsername ===
                        student.username
                );


            studentSubmissions.forEach(
                (submission) => {
                    const assignment =
                        monthAssignments.find(
                            (item) =>
                                item.id ===
                                submission.assignmentId
                        );


                    if (!assignment) {
                        return;
                    }


                    // Bỏ qua bài chưa chấm
                    // hoặc đang được chấm lại.
                    if (
                        submission.grade === null ||
                        submission.grade === undefined ||
                        submission.grade === "" ||
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


                    // Nếu giáo viên không tha lỗi.
                    if (!submission.forcePass) {
                        if (
                            isLate ||
                            isCheat ||
                            isMissingEssay
                        ) {
                            violationCount++;
                        }


                        // Nộp trễ hoặc gian lận
                        // không được tính vào ĐTB.
                        if (
                            isLate ||
                            isCheat
                        ) {
                            return;
                        }
                    }


                    const score =
                        parseFloat(
                            submission.grade
                        ) || 0;


                    totalScore += score;

                    validCount++;


                    if (score === 10) {
                        count10s++;
                    }
                }
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


            // Chỉ đưa học sinh có bài hợp lệ vào BXH.
            if (validCount > 0) {
                rankedData.push({
                    name:
                        student.name ||
                        student.username ||
                        "Học sinh",

                    username:
                        student.username,

                    avatar:
                        student.avatar || "👤",

                    finalScore:
                        Math.round(
                            finalScore * 100
                        ) / 100,

                    dtb:
                        roundedAverage,

                    videoBonus:
                        Math.round(
                            totalVideoBonus * 100
                        ) / 100,

                    tens:
                        count10s,

                    violations:
                        violationCount,

                    validCount:
                        validCount
                });
            }
        });


        // ------------------------------------------
        // SẮP XẾP THỨ HẠNG
        // ------------------------------------------

        rankedData.sort((a, b) => {
            // Ưu tiên 1:
            // Điểm xếp hạng cao hơn.
            if (
                b.finalScore !==
                a.finalScore
            ) {
                return (
                    b.finalScore -
                    a.finalScore
                );
            }


            // Ưu tiên 2:
            // Nhiều điểm 10 hơn.
            if (
                b.tens !==
                a.tens
            ) {
                return (
                    b.tens -
                    a.tens
                );
            }


            // Ưu tiên 3:
            // Ít vi phạm hơn.
            return (
                a.violations -
                b.violations
            );
        });


        if (rankedData.length === 0) {
            body.innerHTML =
                getLeaderboardStateHTML(
                    "empty",
                    "Chưa có dữ liệu xếp hạng",
                    "Tháng này chưa có bài tập hợp lệ đã được chấm điểm."
                );

            return;
        }


        body.innerHTML =
            renderLeaderboard(
                rankedData
            );

    } catch (error) {
        body.innerHTML =
            getLeaderboardStateHTML(
                "error",
                "Không thể tải bảng xếp hạng",
                "Đã xảy ra lỗi kết nối dữ liệu. Hãy nhấn nút làm mới để thử lại."
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

window.openTreasureChest = function () {
    document
        .getElementById("treasureChestModal")
        ?.classList.add("active");


    document.body.classList.add(
        "leaderboard-open"
    );


    document
        .getElementById("chestCloseBtn")
        ?.focus();
};


// ======================================================
// 14. THUẬT TOÁN NHẬN THƯỞNG RƯƠNG
// ======================================================

window.claimChestReward = async function (
    choiceType
) {
    const btnNodes =
        document.querySelectorAll(
            "#treasureChestModal [data-chest-choice]"
        );


    btnNodes.forEach((button) => {
        button.disabled = true;
        button.style.opacity = "0.5";
    });


    try {
        const lbSettingsSnap =
            await db
                .ref("leaderboard_settings")
                .once("value");


        const lbSettings =
            lbSettingsSnap.val() || {
                chestDup: 95,
                chestNorm: 4,
                chestLeg: 1
            };


        const dupThreshold =
            lbSettings.chestDup / 100;


        const normThreshold =
            dupThreshold +
            lbSettings.chestNorm / 100;


        // ------------------------------------------
        // NHẬN COIN
        // ------------------------------------------

        if (choiceType === "coin") {
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


            const coinRef =
                db.ref(
                    "student_coins/" +
                    currentUser.username
                );


            const snap =
                await coinRef.once("value");


            await coinRef.set(
                (snap.val() || 0) +
                amount
            );


            alert(
                `🎉 CHÚC MỪNG! ` +
                `Bạn đã mở Rương và nhận được ` +
                `${amount} Coin!`
            );
        }


        // ------------------------------------------
        // NHẬN VẬT PHẨM
        // ------------------------------------------

        else if (choiceType === "item") {
            const rand = Math.random();

            const invSnap = await db
                .ref(`student_inventory/${currentUser.username}`)
                .once("value");

            const inventoryData = invSnap.val() || {};

            const exactInventory = Object
                .values(inventoryData)
                .map(item => item.id);


            // Chuẩn hóa tag để không bị lỗi do chữ hoa, chữ thường hoặc dấu.
            const normalizeTag = value => {
                return String(value || "")
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/đ/g, "d")
                    .replace(/Đ/g, "D")
                    .trim()
                    .toLowerCase();
            };


            // Kiểm tra vật phẩm có tag Hội họa hay không.
            const isPaintingItem = item => {
                return normalizeTag(item.tag) === "hoi hoa";
            };


            const legendaryTags = [
                "truyen thuyet",
                "tu ky si"
            ];


            const isRareItem = item => {
                return (
                    legendaryTags.includes(
                        normalizeTag(item.tag)
                    ) ||
                    Number(item.price) > 700
                );
            };


            // Loại bỏ vật phẩm âm nhạc.
            const validItems = StoreConfig.items.filter(
                item => item.type !== "music"
            );


            // Chỉ lấy vật phẩm học sinh chưa sở hữu.
            // Vì vậy vật phẩm Hội họa không thể được nhận trùng.
            const unownedItems = validItems.filter(
                item => !exactInventory.includes(item.id)
            );


            /*
             * Chỉ vật phẩm KHÔNG thuộc tag Hội họa
             * mới được phép kích hoạt trường hợp trùng lặp.
             */
            const ownedDuplicateCandidates = validItems.filter(
                item =>
                    exactInventory.includes(item.id) &&
                    !isPaintingItem(item)
            );


            let selectedItem = null;


            // ==================================================
            // TRƯỜNG HỢP VẬT PHẨM TRÙNG
            // ==================================================

            if (
                rand < dupThreshold &&
                ownedDuplicateCandidates.length > 0
            ) {
                const duplicateItem =
                    ownedDuplicateCandidates[
                    Math.floor(
                        Math.random() *
                        ownedDuplicateCandidates.length
                    )
                    ];


                const coinRef = db.ref(
                    "student_coins/" +
                    currentUser.username
                );


                const coinSnap = await coinRef.once("value");


                await coinRef.set(
                    (coinSnap.val() || 0) + 200
                );


                alert(
                    `♻️ Vật phẩm [${duplicateItem.tag}] ` +
                    `${duplicateItem.name} đã bị trùng. ` +
                    `Hệ thống quy đổi thành +200 Coin!`
                );


                closeTreasureChestModal();

                return;
            }


            // Nếu chỉ có vật phẩm Hội họa bị trùng,
            // hệ thống sẽ không đổi thành Coin mà tiếp tục chọn
            // một vật phẩm chưa sở hữu.


            // ==================================================
            // KHÔNG CÒN VẬT PHẨM CHƯA SỞ HỮU
            // ==================================================

            if (unownedItems.length === 0) {
                const coinRef = db.ref(
                    "student_coins/" +
                    currentUser.username
                );


                const coinSnap = await coinRef.once("value");


                await coinRef.set(
                    (coinSnap.val() || 0) + 500
                );


                alert(
                    "🏆 Bạn đã sở hữu toàn bộ vật phẩm. " +
                    "Hệ thống tặng bù +500 Coin!"
                );


                closeTreasureChestModal();

                return;
            }


            // ==================================================
            // NHẬN VẬT PHẨM THƯỜNG
            // ==================================================

            if (rand < normThreshold) {
                const normalItems = unownedItems.filter(
                    item => !isRareItem(item)
                );


                if (normalItems.length > 0) {
                    selectedItem =
                        normalItems[
                        Math.floor(
                            Math.random() *
                            normalItems.length
                        )
                        ];
                } else {
                    // Nếu hết vật phẩm thường,
                    // lấy một vật phẩm chưa sở hữu bất kỳ.
                    selectedItem =
                        unownedItems[
                        Math.floor(
                            Math.random() *
                            unownedItems.length
                        )
                        ];
                }
            }


            // ==================================================
            // NHẬN VẬT PHẨM HIẾM / TRUYỀN THUYẾT
            // ==================================================

            else {
                const rareItems = unownedItems.filter(
                    item => isRareItem(item)
                );


                if (rareItems.length > 0) {
                    selectedItem =
                        rareItems[
                        Math.floor(
                            Math.random() *
                            rareItems.length
                        )
                        ];
                } else {
                    // Nếu hết vật phẩm hiếm,
                    // chọn một vật phẩm chưa sở hữu khác.
                    selectedItem =
                        unownedItems[
                        Math.floor(
                            Math.random() *
                            unownedItems.length
                        )
                        ];
                }
            }


            if (!selectedItem) {
                throw new Error(
                    "Không tìm thấy vật phẩm phù hợp để trao thưởng."
                );
            }


            // Kiểm tra thêm lần cuối để tránh trùng vật phẩm Hội họa.
            if (
                isPaintingItem(selectedItem) &&
                exactInventory.includes(selectedItem.id)
            ) {
                throw new Error(
                    "Phát hiện vật phẩm Hội họa bị trùng."
                );
            }


            // Lưu vật phẩm vào túi đồ.
            await db
                .ref(
                    `student_inventory/` +
                    `${currentUser.username}/` +
                    `${selectedItem.id}`
                )
                .update({
                    id: selectedItem.id,
                    purchaseTime: Date.now(),
                    isTrial: null,
                    trialExpiry: null,
                    isEquipped: false
                });


            const paintingNotice =
                isPaintingItem(selectedItem)
                    ? "\n🎨 Vật phẩm Hội họa được bảo vệ không trùng."
                    : "";


            alert(
                `🎊 KỲ TÍCH! Bạn đã nhận được ` +
                `[${selectedItem.tag}] ${selectedItem.name}!` +
                paintingNotice
            );
        }


        closeTreasureChestModal();

    } catch (error) {
        console.error(error);

        alert(
            "❌ Có lỗi xảy ra khi nhận thưởng. " +
            "Vui lòng thử lại!"
        );

    } finally {
        btnNodes.forEach((button) => {
            button.disabled = false;
            button.style.opacity = "1";
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