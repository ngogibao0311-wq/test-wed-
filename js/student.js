// === HỆ THỐNG THÔNG BÁO NỔI (TOAST) ===
window.showToast = function (message, type = 'error') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'error' ? '#e11d48' : (type === 'success' ? '#059669' : '#f59e0b');
    const icon = type === 'error' ? '❌' : (type === 'success' ? '✅' : '⚠️');

    toast.style.cssText = `background: ${bgColor}; color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transform: translateX(120%); transition: transform 0.3s ease-out; display: flex; align-items: center; gap: 10px; font-size: 0.95em; pointer-events: auto;`;
    const iconElement = document.createElement('span');
    iconElement.textContent = icon;

    const messageElement = document.createElement('span');
    messageElement.textContent = String(message ?? '');

    toast.append(
        iconElement,
        messageElement
    );
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};
// ======================================

const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// ======================================================
// HỖ TRỢ FILE ÂM THANH TRONG BÀI TẬP
// ======================================================

const ASSIGNMENT_ATTACHMENT_ACCEPT =
    '.docx,.pdf,image/*,audio/*,' +
    '.mp3,.wav,.m4a,.aac,.ogg,.oga,.opus,.flac,.webm';

function studentAttachmentSafeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getStudentAttachmentName(fileData) {
    if (typeof fileData === 'string') {
        try {
            const pathname =
                new URL(fileData).pathname;

            return decodeURIComponent(
                pathname.split('/').pop() ||
                'File âm thanh'
            );
        } catch (error) {
            return 'File âm thanh';
        }
    }

    return String(
        fileData?.name ||
        fileData?.fileName ||
        fileData?.originalName ||
        'File âm thanh'
    );
}

function getStudentAttachmentURL(fileData) {
    const value =
        typeof fileData === 'string'
            ? fileData
            : (
                fileData?.secureUrl ||
                fileData?.url ||
                fileData?.href ||
                ''
            );

    const url = String(value || '').trim();

    return /^https?:\/\//i.test(url)
        ? url
        : '';
}

function isStudentAudioAttachment(fileData) {
    const type = String(
        typeof fileData === 'object' &&
            fileData
            ? (
                fileData.type ||
                fileData.mimeType ||
                fileData.contentType ||
                ''
            )
            : ''
    ).toLowerCase();

    if (type.startsWith('audio/')) {
        return true;
    }

    const source = [
        getStudentAttachmentName(fileData),
        getStudentAttachmentURL(fileData)
    ].join(' ');

    return /\.(mp3|wav|m4a|aac|ogg|oga|opus|flac|webm)(?:$|[?#\s])/i
        .test(source);
}

window.buildAttachmentPreviewHTML = function (
    fileData,
    label = '📎 File đính kèm',
    options = {}
) {
    if (!isStudentAudioAttachment(fileData)) {
        return window.buildFilePreviewHTML(
            fileData,
            label,
            options
        );
    }

    const audioURL =
        getStudentAttachmentURL(fileData);

    if (!audioURL) {
        return window.buildFilePreviewHTML(
            fileData,
            label,
            options
        );
    }

    const safeURL =
        studentAttachmentSafeHTML(audioURL);

    const safeName =
        studentAttachmentSafeHTML(
            getStudentAttachmentName(fileData)
        );

    const safeLabel =
        studentAttachmentSafeHTML(
            String(
                label || '🎵 File âm thanh'
            ).replace(/^📎\s*/, '🎵 ')
        );

    return `
        <div
            class="r2-audio-attachment"
            style="
                margin: 10px 0;
                padding: 12px;
                border: 1px solid rgba(102,126,234,.35);
                border-radius: 10px;
                background: rgba(255,255,255,.62);
            "
        >
            <div
                style="
                    font-weight: 700;
                    margin-bottom: 6px;
                "
            >
                ${safeLabel}
            </div>

            <div
                title="${safeName}"
                style="
                    margin-bottom: 8px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                "
            >
                🎧 ${safeName}
            </div>

            <audio
                controls
                preload="metadata"
                src="${safeURL}"
                style="
                    display: block;
                    width: 100%;
                    max-width: 520px;
                "
            >
                Trình duyệt không hỗ trợ phát âm thanh.
            </audio>

            <a
                href="${safeURL}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                    display: inline-block;
                    margin-top: 8px;
                    font-weight: 600;
                "
            >
                ⬇️ Mở hoặc tải file âm thanh
            </a>
        </div>
    `;
};

// ======================================================
// XÓA FILE R2 KHI HỌC SINH GHI ĐÈ BÀI NỘP
// ======================================================

function hasStudentSubmissionStorageValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return false;
    }

    if (Array.isArray(value)) {
        return value.some(
            hasStudentSubmissionStorageValue
        );
    }

    if (typeof value === 'object') {
        return Object.keys(value).length > 0;
    }

    return Boolean(String(value).trim());
}

async function deleteStudentSubmissionStorageFiles(
    values,
    label = 'file bài nộp'
) {
    if (!hasStudentSubmissionStorageValue(values)) {
        return {
            ok: true,
            deleted: [],
            failures: []
        };
    }

    if (
        !window.CloudflareR2Storage ||
        typeof window
            .CloudflareR2Storage
            .deleteAssets !== 'function'
    ) {
        throw new Error(
            'Không tìm thấy chức năng xóa file trên Cloudflare R2.'
        );
    }

    let lastError = null;

    /*
     * Thử lại một lần nếu mạng hoặc Worker
     * gặp lỗi tạm thời.
     */
    for (
        let attempt = 1;
        attempt <= 2;
        attempt++
    ) {
        try {
            return await window
                .CloudflareR2Storage
                .deleteAssets(values);
        } catch (error) {
            lastError = error;

            console.warn(
                `Lần ${attempt} xóa ${label} thất bại:`,
                error,
                error?.failures || []
            );

            if (attempt < 2) {
                await new Promise(resolve =>
                    setTimeout(resolve, 500)
                );
            }
        }
    }

    throw new Error(
        `Không thể xóa ${label} trên Cloudflare R2: ` +
        `${lastError?.message || 'Lỗi không xác định.'}`
    );
}

// ======================================================
// CÀI ĐẶT RIÊNG: ẨN / HIỆN THANH SỐ DƯ COIN
// Chỉ thay đổi giao diện, không sửa dữ liệu Coin.
// ======================================================

function getCoinWidgetVisibilityStorageKey() {
    const username = String(
        currentUser?.username || 'guest'
    ).trim();

    return `student_coin_widget_visible:${username}`;
}

function getSavedCoinWidgetVisibility() {
    return localStorage.getItem(
        getCoinWidgetVisibilityStorageKey()
    ) !== 'false';
}

window.applyCoinBalanceWidgetVisibility = function (
    isVisible,
    shouldPersist = true
) {
    const visible = isVisible !== false;

    const coinWidget = document.getElementById('coinWidget');

    const toggle = document.getElementById(
        'toggleCoinBalanceWidget'
    );

    if (coinWidget) {
        /*
         * Chỉ ẩn giao diện.
         * Phần tử vẫn tồn tại nên listener Firebase và
         * quá trình cập nhật số Coin không bị ảnh hưởng.
         */
        coinWidget.style.visibility = visible
            ? 'visible'
            : 'hidden';

        coinWidget.style.opacity = visible ? '1' : '0';

        coinWidget.style.pointerEvents = visible
            ? 'auto'
            : 'none';

        coinWidget.setAttribute(
            'aria-hidden',
            String(!visible)
        );
    }

    if (toggle && toggle.checked !== visible) {
        toggle.checked = visible;
    }

    if (shouldPersist) {
        localStorage.setItem(
            getCoinWidgetVisibilityStorageKey(),
            String(visible)
        );
    }
};

window.toggleCoinBalanceWidget = function (isVisible) {
    window.applyCoinBalanceWidgetVisibility(
        Boolean(isVisible),
        true
    );

    if (typeof window.showToast === 'function') {
        window.showToast(
            isVisible
                ? 'Đã hiện thanh số dư Coin.'
                : 'Đã ẩn thanh số dư Coin.',
            'success'
        );
    }
};

function initializeCoinBalanceWidgetSetting() {
    window.applyCoinBalanceWidgetVisibility(
        getSavedCoinWidgetVisibility(),
        false
    );
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initializeCoinBalanceWidgetSetting,
        { once: true }
    );
} else {
    initializeCoinBalanceWidgetSetting();
}

// ======================================================
// TƯƠNG THÍCH BÀI TẬP/BÀI NỘP CŨ PHÍA HỌC SINH
// ======================================================
function studentCompatText(value) {
    return String(value ?? '').trim();
}

function getStudentCompatAssignmentIds(assignmentOrId) {
    const values =
        assignmentOrId &&
            typeof assignmentOrId === 'object'
            ? [
                assignmentOrId.id,
                assignmentOrId._fbKey,
                assignmentOrId.assignmentId,
                assignmentOrId.assignmentKey,
                assignmentOrId.key
            ]
            : [assignmentOrId];

    return [...new Set(
        values
            .map(studentCompatText)
            .filter(Boolean)
    )];
}

function getStudentCompatSubmissionAssignmentId(submission) {
    return studentCompatText(
        submission?.assignmentId ??
        submission?.assignId ??
        submission?.assignmentKey ??
        submission?.taskId ??
        submission?.exerciseId
    );
}

function getStudentCompatSubmissionUsername(submission) {
    return studentCompatText(
        submission?.studentUsername ??
        submission?.username ??
        submission?.studentUser ??
        submission?.studentId
    );
}

function getStudentAssignmentDescHTML(value) {
    const normalized = String(value || '')
        .replace(
            /\bql-align-(center|right|justify)\b/gi,
            ''
        )
        .replace(
            /text-align\s*:\s*(center|right|justify)\s*;?/gi,
            'text-align: left;'
        );

    return window.sanitizeRichHTML(
        normalized
    );
}

/*
 * Chuẩn hóa ID để tránh lỗi:
 * 123 !== "123"
 */
function normalizeStoreItemId(value) {
    return value === null || value === undefined
        ? ''
        : String(value);
}

/*
 * Vật phẩm thực sự mua bằng Coin:
 * giá phải là số và lớn hơn 0.
 */
function isCoinPurchasableStoreItem(item) {
    if (!item) return false;

    const price = Number(item.price);

    return Number.isFinite(price) && price > 0;
}

/*
 * Kiểm tra vật phẩm có thuộc Cửa hàng Sang trọng hay không.
 */
function isLuxuryStoreItem(item) {
    if (!item) {
        return false;
    }

    // Ưu tiên cờ được gắn trực tiếp trên vật phẩm.
    if (item.luxuryOnly === true) {
        return true;
    }

    // Kiểm tra thêm theo danh sách ID của Luxury Store.
    if (
        window.LuxuryStore &&
        typeof window.LuxuryStore.isLuxuryItem === 'function'
    ) {
        return window.LuxuryStore.isLuxuryItem(item);
    }

    return false;
}

/*
 * Kiểm tra thẻ giảm giá áp dụng cho vật phẩm.
 */
function isDiscountEligibleForStoreItem(
    targetItems,
    item,
    discount = null
) {
    // Mọi thẻ chỉ áp dụng cho vật phẩm có giá Coin lớn hơn 0.
    if (!isCoinPurchasableStoreItem(item)) {
        return false;
    }

    // =====================================================
    // CỬA HÀNG SANG TRỌNG
    // Không cho sử dụng mã giảm giá thông thường.
    // =====================================================
    const isLuxuryItem =
        isLuxuryStoreItem(item);

    /*
     * Chừa sẵn khả năng tạo thẻ Luxury riêng sau này.
     *
     * Muốn một mã được dùng cho Luxury:
     * luxuryEligible: true
     *
     * hoặc:
     * discountScope: 'luxury'
     */
    const isLuxuryDiscount =
        discount?.luxuryEligible === true ||
        String(
            discount?.discountScope || ''
        ).toLowerCase() === 'luxury';

    if (
        isLuxuryItem &&
        !isLuxuryDiscount
    ) {
        return false;
    }

    const discountSource =
        discount?.source || 'teacher_gift';

    const isDailyLoginDiscount =
        discountSource === 'daily_login';

    const isTeacherGiftDiscount =
        discountSource === 'teacher_gift';

    const isHoiHoaRunnerUpDiscount =
        discountSource === 'hoihoa_runner_up' ||
        discountSource === 'hoihoa_season';

    const isHoiHoaChestDiscount =
        discountSource === 'hoihoa_chest';

    const itemPrice = Number(item.price);

    /*
     * Chuẩn hóa tag để nhận đúng:
     * Doraemon, doraemon, Truyền thuyết,
     * truyen thuyet...
     */
    const normalizeDiscountTag = value => {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .trim()
            .toLowerCase();
    };

    const itemTags = [
        item.tag,
        ...(Array.isArray(item.tags) ? item.tags : [])
    ].map(normalizeDiscountTag);

    const hasBlockedHoiHoaTag =
        itemTags.includes('doraemon') ||
        itemTags.includes('truyen thuyet');

    if (
        isDailyLoginDiscount &&
        (
            !Number.isFinite(itemPrice) ||
            itemPrice > 500 ||
            item.isNonCoin === true ||
            hasBlockedHoiHoaTag
        )
    ) {
        return false;
    }

    // Thẻ giáo viên: món dưới 700 Coin.
    if (
        isTeacherGiftDiscount &&
        (
            !Number.isFinite(itemPrice) ||
            itemPrice >= 700
        )
    ) {
        return false;
    }

    /*
     * Thẻ Á quân Hội Họa:
     * - Chỉ vật phẩm bán bằng Coin.
     * - Không dùng cho vật phẩm sự kiện.
     * - Không dùng cho Doraemon/Truyền thuyết.
     * - Giá dưới 600 Coin.
     */
    if (
        isHoiHoaRunnerUpDiscount &&
        (
            !Number.isFinite(itemPrice) ||
            itemPrice >= 600 ||
            item.isNonCoin === true ||
            hasBlockedHoiHoaTag
        )
    ) {
        return false;
    }

    /*
     * Thẻ từ Rương Hội Họa:
     * - Chỉ vật phẩm bán bằng Coin.
     * - Không dùng cho vật phẩm sự kiện.
     * - Không dùng cho Doraemon/Truyền thuyết.
     * - Giá dưới 700 Coin.
     */
    if (
        isHoiHoaChestDiscount &&
        (
            !Number.isFinite(itemPrice) ||
            itemPrice >= 700 ||
            item.isNonCoin === true ||
            hasBlockedHoiHoaTag
        )
    ) {
        return false;
    }

    let normalizedTargets =
        targetItems || ['all'];

    if (!Array.isArray(normalizedTargets)) {
        normalizedTargets = [normalizedTargets];
    }

    normalizedTargets = normalizedTargets.map(
        normalizeStoreItemId
    );

    const itemId =
        normalizeStoreItemId(item.id);

    return (
        normalizedTargets.includes('all') ||
        normalizedTargets.includes(itemId)
    );
}

// Trạng thái popup bắt buộc
window.currentMandatoryNotification = null;
window.currentActiveSurvey = window.currentActiveSurvey || null;
// ==============================================================
// ECONOMY TRANSACTION HELPERS - CHỐNG RACE CONDITION NHIỀU TAB
// ==============================================================

async function incrementNumberTx(path, amount) {
    const ref = db.ref(path);

    const result = await ref.transaction(current => {
        const value = Number(current) || 0;
        return value + amount;
    });

    if (!result.committed) {
        throw new Error('TRANSACTION_NOT_COMMITTED');
    }

    return result.snapshot.val();
}

async function decrementNumberTx(path, amount) {
    const ref = db.ref(path);
    let reason = '';

    const result = await ref.transaction(current => {
        const value = Number(current) || 0;

        if (value < amount) {
            reason = 'INSUFFICIENT_BALANCE';
            return; // abort transaction
        }

        return value - amount;
    });

    if (!result.committed) {
        throw new Error(reason || 'TRANSACTION_NOT_COMMITTED');
    }

    return result.snapshot.val();
}

async function rollbackIncrement(path, amount) {
    try {
        await incrementNumberTx(path, amount);
    } catch (e) {
        console.warn('⚠️ Rollback cộng lại thất bại:', path, amount, e);
    }
}

async function rollbackDecrement(path, amount) {
    try {
        await decrementNumberTx(path, amount);
    } catch (e) {
        console.warn('⚠️ Rollback trừ lại thất bại:', path, amount, e);
    }
}
if (!currentUser || currentUser.role !== 'student') window.location.href = 'index.html';

// 1. KHỞI TẠO BIẾN TOÀN CỤC NGAY LẬP TỨC ĐỂ TRÁNH LỖI
window.studentSubmitDTs = {};
window.studentBirthdayCoins =
    window.studentBirthdayCoins || {};

window.studentBirthdayWallets =
    window.studentBirthdayWallets || {};

// Xu Đặc Biệt do giáo viên tặng.
window.studentSpecialBirthdayCoinGrants =
    window
        .studentSpecialBirthdayCoinGrants ||
    {};

window.studentSpecialBirthdayCoinCount =
    Number(
        window
            .studentSpecialBirthdayCoinCount
    ) || 0;

function getUsableSpecialBirthdayCoinCount(
    grants,
    now = Date.now()
) {
    return Object.values(grants || {})
        .reduce((total, grant) => {
            if (
                !grant ||
                typeof grant !== 'object'
            ) {
                return total;
            }

            const remaining =
                Number(
                    grant.remaining
                ) || 0;

            const expiresAt =
                Number(
                    grant.expiresAt
                ) || 0;

            if (
                remaining <= 0 ||
                !expiresAt ||
                now >= expiresAt
            ) {
                return total;
            }

            return total + remaining;
        }, 0);
}

window
    .getUsableSpecialBirthdayCoinCount =
    getUsableSpecialBirthdayCoinCount;

function getBirthdayCoinBalance(entry) {
    if (typeof entry === 'number') {
        return Number.isFinite(entry)
            ? entry
            : 0;
    }

    if (
        entry &&
        typeof entry === 'object'
    ) {
        const balance =
            Number(entry.balance);

        return Number.isFinite(balance)
            ? balance
            : 0;
    }

    return 0;
}

function normalizeBirthdayCoinBalances(wallets) {
    const balances = {};

    Object.entries(wallets || {})
        .forEach(([year, entry]) => {
            balances[String(year)] =
                getBirthdayCoinBalance(entry);
        });

    return balances;
}

window.getBirthdayCoinBalance =
    getBirthdayCoinBalance;
let cacheAssignmentsSt = "";
let cacheSubmissionsSt = "";

const nameElement = document.getElementById('studentName');
if (nameElement) {
    nameElement.innerText = currentUser.name;
}

// 2. GỌI HÀM GIAO DIỆN SAU KHI CÁC BIẾN QUAN TRỌNG ĐÃ SẴN SÀNG
updateAvatarDisplay(currentUser.avatar);

// ======================================================
// DANH SÁCH FILE BÀI LÀM TẠM
// File chưa được tải lên Cloudflare.
// ======================================================

function formatStudentPendingFileSize(
    size
) {
    const bytes = Number(size) || 0;

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(2)} MB`;
}

window.renderStudentPendingFiles =
    function (assignId) {
        const input =
            document.getElementById(
                `studentFile-${assignId}`
            );

        if (!input) return;

        const dataTransfer =
            window.studentSubmitDTs[
            assignId
            ];

        const files =
            dataTransfer
                ? Array.from(
                    dataTransfer.files || []
                )
                : [];

        const containerId =
            `pending-student-files-${assignId}`;

        let container =
            document.getElementById(
                containerId
            );

        if (!container) {
            container =
                document.createElement(
                    'div'
                );

            container.id =
                containerId;

            container.style.cssText = `
                display: none;
                margin: -5px 0 15px;
                padding: 10px;
                border: 1px dashed
                    rgba(102,126,234,.45);
                border-radius: 10px;
                background:
                    rgba(255,255,255,.45);
            `;

            input.insertAdjacentElement(
                'afterend',
                container
            );
        }

        container.innerHTML = '';

        if (!files.length) {
            container.style.display =
                'none';

            return;
        }

        container.style.display =
            'block';

        const heading =
            document.createElement(
                'div'
            );

        heading.textContent =
            `☁️ ${files.length} file đang chờ nộp`;

        heading.style.cssText = `
            font-weight: 700;
            margin-bottom: 8px;
            color: #475569;
            font-size: .9em;
        `;

        container.appendChild(
            heading
        );

        files.forEach(
            (file, index) => {
                const row =
                    document.createElement(
                        'div'
                    );

                row.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content:
                        space-between;
                    gap: 10px;
                    padding: 8px 0;
                    border-top:
                        1px solid
                        rgba(0,0,0,.07);
                `;

                const info =
                    document.createElement(
                        'div'
                    );

                info.style.cssText = `
                    min-width: 0;
                    flex: 1;
                `;

                const name =
                    document.createElement(
                        'div'
                    );

                name.textContent =
                    `📎 ${file.name ||
                    `File ${index + 1}`
                    }`;

                name.title =
                    file.name || '';

                name.style.cssText = `
                    font-weight: 600;
                    overflow: hidden;
                    text-overflow:
                        ellipsis;
                    white-space: nowrap;
                `;

                const meta =
                    document.createElement(
                        'small'
                    );

                meta.textContent =
                    formatStudentPendingFileSize(
                        file.size
                    );

                meta.style.color =
                    '#64748b';

                info.append(
                    name,
                    meta
                );

                const removeButton =
                    document.createElement(
                        'button'
                    );

                removeButton.type =
                    'button';

                removeButton.textContent =
                    '✖ Xóa';

                removeButton.style.cssText = `
                    width: auto;
                    margin: 0;
                    padding: 6px 10px;
                    border: none;
                    border-radius: 7px;
                    background: #e11d48;
                    color: white;
                    font-weight: 700;
                    cursor: pointer;
                    flex-shrink: 0;
                `;

                removeButton.addEventListener(
                    'click',
                    event => {
                        event
                            .preventDefault();

                        event
                            .stopPropagation();

                        window
                            .removeStudentPendingFile(
                                assignId,
                                index
                            );
                    }
                );

                row.append(
                    info,
                    removeButton
                );

                container.appendChild(
                    row
                );
            }
        );
    };

window.removeStudentPendingFile =
    function (
        assignId,
        fileIndex
    ) {
        const input =
            document.getElementById(
                `studentFile-${assignId}`
            );

        const dataTransfer =
            window.studentSubmitDTs[
            assignId
            ];

        if (!dataTransfer) return;

        const files =
            Array.from(
                dataTransfer.files || []
            );

        dataTransfer.items.clear();

        files.forEach(
            (file, index) => {
                if (
                    index !==
                    Number(fileIndex)
                ) {
                    dataTransfer
                        .items
                        .add(file);
                }
            }
        );

        if (input) {
            input.files =
                dataTransfer.files;

            if (
                dataTransfer.files
                    .length === 0
            ) {
                input.value = '';
            }
        }

        window
            .renderStudentPendingFiles(
                assignId
            );
    };

window.handleStudentFileAccumulate = function (input, assignId) {
    if (!window.studentSubmitDTs[assignId]) window.studentSubmitDTs[assignId] = new DataTransfer();
    const existingFiles = Array.from(window.studentSubmitDTs[assignId].files).map(f => f.name + '_' + f.size);
    const MAX_SIZE_BYTES = 7 * 1024 * 1024; // Giới hạn 5MB

    let hasOversize = false;
    for (let i = 0; i < input.files.length; i++) {
        // Chặn ngay file quá nặng, không cho vào DataTransfer
        if (input.files[i].size > MAX_SIZE_BYTES) {
            alert(`⚠️ File "${input.files[i].name}" quá lớn (${(input.files[i].size / (1024 * 1024)).toFixed(2)}MB). Hệ thống chỉ cho phép tối đa 7MB/file và đã tự động loại bỏ file này!`);
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

    window.renderStudentPendingFiles(
        assignId
    );
};
// ==============================================================

window.onload = async function () {

    const startupLoader =
        window.AppStartupLoader || null;

    if (startupLoader) {

        startupLoader.setStatus(
            'Đang xác thực phiên đăng nhập...'
        );

        startupLoader.expect([
            'core-runtime',
            'service-worker',
            'cloud-connection',
            'student-auth',
            'student-user',
            'student-profile-requests',
            'student-assignments',
            'student-submissions',
            'student-materials',
            'student-schedule',
            'student-roadmap-settings',
            'student-game-settings',
            'student-wheel-settings',
            'student-coins',
            'student-store-settings',
            'student-store-items',
            'student-inventory',
            'student-birthday-wallet',
            'student-special-wallet',
            'student-notifications',
            'student-surveys',
            'student-inbox',
            'student-conversion-settings',
            'student-money-offset',
            'student-cash-requests',
            'student-limited-event',
            'student-discounts'
        ], {
            'core-runtime': 'Thư viện và module web',
            'service-worker': 'Service Worker / cache',
            'cloud-connection': 'Kết nối Firebase',
            'student-auth': 'Phiên đăng nhập học sinh',
            'student-user': 'Hồ sơ học sinh',
            'student-profile-requests': 'Yêu cầu cập nhật hồ sơ',
            'student-assignments': 'Bài tập',
            'student-submissions': 'Bài nộp',
            'student-materials': 'Tài liệu',
            'student-schedule': 'Lịch học',
            'student-roadmap-settings': 'Cài đặt lộ trình',
            'student-game-settings': 'Cài đặt trò chơi',
            'student-wheel-settings': 'Tỉ lệ vòng quay',
            'student-coins': 'Số dư Coin',
            'student-store-settings': 'Cài đặt cửa hàng',
            'student-store-items': 'Dữ liệu cửa hàng',
            'student-inventory': 'Kho vật phẩm',
            'student-birthday-wallet': 'Ví Xu Sinh Nhật',
            'student-special-wallet': 'Ví Xu Đặc Biệt',
            'student-notifications': 'Thông báo',
            'student-surveys': 'Khảo sát',
            'student-inbox': 'Hộp thư',
            'student-conversion-settings': 'Bảng quy đổi',
            'student-money-offset': 'Tiền tích lũy',
            'student-cash-requests': 'Yêu cầu rút tiền',
            'student-limited-event': 'Sự kiện giới hạn',
            'student-discounts': 'Thẻ giảm giá'
        });

        if (!startupLoader.checkRuntime([
            'firebase.auth',
            'firebase.database',
            'db.ref',
            'Quill',
            'DOMPurify.sanitize',
            'mammoth.convertToHtml',
            'CloudflareR2Storage'
        ])) {
            return;
        }

        if (!startupLoader.checkStylesheets()) {
            return;
        }

        if (
            typeof StoreConfig === 'undefined' ||
            !StoreConfig ||
            !Array.isArray(StoreConfig.items)
        ) {
            startupLoader.fail(
                'Module cửa hàng chưa sẵn sàng.',
                'Không tìm thấy StoreConfig.items. Hãy kiểm tra store-manager.js và các module vật phẩm.',
                'runtime'
            );
            return;
        }

        startupLoader.markReady('core-runtime');
        await startupLoader.registerServiceWorker();
        startupLoader.markReady('service-worker');

        const cloudConnected = await startupLoader.waitForCloudConnection({
            timeoutMs: 18000
        });

        if (!cloudConnected) return;
        startupLoader.markReady('cloud-connection');
    }

    // === FIX LỖI BẢO MẬT: Chờ và xác thực qua Firebase Auth ===
    const authUser = await new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });

    if (startupLoader && authUser) {
        startupLoader.markReady('student-auth');
    }

    if (!authUser) {
        if (startupLoader) startupLoader.fail('Không tìm thấy phiên đăng nhập hợp lệ.', 'Hãy đăng nhập lại để tiếp tục.', 'auth');
        alert("⛔ Lỗi: Không tìm thấy phiên đăng nhập hợp lệ!");
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return;
    }

    // Chỉ đọc đúng tài khoản thuộc UID đang đăng nhập.
    const realUserSnapshot = await db
        .ref(`users/${authUser.uid}`)
        .once('value');

    const realUserData = realUserSnapshot.val();

    const realUser = realUserData
        ? {
            ...realUserData,
            _fbKey: authUser.uid
        }
        : null;

    // UID được lấy trực tiếp từ Firebase Authentication.
    // Đồng thời kiểm tra dữ liệu localStorage có bị sửa hay không.
    if (
        !realUser ||
        realUser.role !== 'student' ||
        realUser.username !== currentUser.username
    ) {
        alert(
            '⛔ Phát hiện phiên đăng nhập không hợp lệ! ' +
            'Hệ thống sẽ đăng xuất.'
        );

        await firebase.auth().signOut();

        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
        return;
    }

    Object.assign(currentUser, realUser);

    localStorage.setItem(
        'currentUser',
        JSON.stringify(currentUser)
    );
    // === TỐI ƯU HÓA HIỆU SUẤT (BỘ ĐỆM CACHE) ===
    // Thay đổi từ chuỗi rỗng "" sang null để lưu trữ Object trực tiếp
    let cacheProfileSt = null, cacheUsersSt = null, cacheAssignmentsSt = null, cacheSubmissionsSt = null, cacheMaterialsSt = null;

    // Hàm so sánh sâu hiệu năng cao: Không sinh rác bộ nhớ (RAM), thoát sớm ngay khi có khác biệt (CPU)
    function isDeepEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false;

        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        for (let i = 0; i < keysA.length; i++) {
            const key = keysA[i];
            if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
            if (!isDeepEqual(a[key], b[key])) return false;
        }
        return true;
    }

    // === CẢM BIẾN THEO DÕI MẠNG FIREBASE ===
    listenFirebase(db.ref('.info/connected'), 'value', (snap) => {
        if (snap.val() === true) {
            if (window.isOffline) {
                window.showToast("Đã khôi phục kết nối máy chủ!", "success");
                window.isOffline = false;
            }
        } else {
            window.isOffline = true;
            window.showToast("Mất kết nối mạng hoặc máy chủ không phản hồi. Vui lòng kiểm tra lại kết nối!", "warning");
        }
    });
    // =======================================

    listenFirebase(db.ref('profile_requests'), 'value', async (snapshot) => {
        const val = snapshot.val();
        if (!isDeepEqual(val, cacheProfileSt)) {
            cacheProfileSt = val;
            await checkProfileRequests();
        }
        if (startupLoader) startupLoader.markReady('student-profile-requests');
    });

    listenFirebase(
        db.ref(`users/${authUser.uid}`),
        'value',
        async snapshot => {
            const val = snapshot.val();

            if (!val) {
                await firebase.auth().signOut();
                localStorage.removeItem('currentUser');
                window.location.replace('index.html');
                return;
            }

            if (!isDeepEqual(val, cacheUsersSt)) {
                cacheUsersSt = val;

                await syncUserData(
                    val,
                    authUser.uid
                );

                const settingName =
                    document.getElementById('settingName');

                if (settingName) {
                    settingName.value =
                        currentUser.name || '';
                }

                if (
                    document.getElementById(
                        'studentRoadmapBody'
                    )
                ) {
                    renderStudentRoadmap();
                }
            }
            if (startupLoader) {
                startupLoader.markReady(
                    'student-user'
                );
            }
        }
    );

    // 2. GIỮ NGUYÊN ASSIGNMENTS (Bài tập chung toàn trường chỉ do GV sửa nên tần suất rất ít, không gây bão)
    listenFirebase(db.ref('assignments'), 'value', async (snapshot) => {
        const val = snapshot.val();
        if (!isDeepEqual(val, cacheAssignmentsSt)) {
            cacheAssignmentsSt = val;
            window.cachedAssignments = val
                ? Object.entries(val).map(
                    ([firebaseKey, assignment]) => {
                        const normalized = {
                            ...(assignment || {}),
                            _fbKey:
                                assignment?._fbKey ||
                                firebaseKey
                        };

                        // Bài cũ không có id thì dùng Firebase key.
                        if (
                            normalized.id === null ||
                            normalized.id === undefined ||
                            normalized.id === ''
                        ) {
                            normalized.id = firebaseKey;
                        }

                        return normalized;
                    }
                )
                : []; // Lưu cache mảng object dữ liệu gốc
            await loadAssignments();
            setTimeout(() => {
                if (
                    typeof window.restoreInterruptedExam ===
                    'function'
                ) {
                    window
                        .restoreInterruptedExam()
                        .catch(console.error);
                }
            }, 300);
            if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
        }
        if (startupLoader) {
            startupLoader.markReady(
                'student-assignments'
            );
        }
    });

    // 3. CHỈ LẮNG NGHE BÀI NỘP/BẢN NHÁP CỦA CHÍNH HỌC SINH NÀY
    listenFirebase(
        db.ref('submissions')
            .orderByChild('studentUsername')
            .equalTo(currentUser.username),
        'value',
        async (snapshot) => {
            const val = snapshot.val();

            if (!isDeepEqual(val, cacheSubmissionsSt)) {
                cacheSubmissionsSt = val;

                window.cachedSubmissions = val
                    ? Object.entries(val).map(
                        ([firebaseKey, submission]) => {
                            const normalized = {
                                ...(submission || {}),
                                _fbKey:
                                    submission?._fbKey ||
                                    firebaseKey,
                                id:
                                    submission?.id ||
                                    firebaseKey
                            };

                            const assignmentId =
                                getStudentCompatSubmissionAssignmentId(
                                    normalized
                                );

                            const studentUsername =
                                getStudentCompatSubmissionUsername(
                                    normalized
                                );

                            if (assignmentId) {
                                normalized.assignmentId =
                                    assignmentId;
                            }

                            if (studentUsername) {
                                normalized.studentUsername =
                                    studentUsername;
                            }

                            return normalized;
                        }
                    )
                    : [];

                await loadAssignments();

                setTimeout(() => {
                    if (
                        typeof window.restoreInterruptedExam ===
                        'function'
                    ) {
                        window
                            .restoreInterruptedExam()
                            .catch(console.error);
                    }
                }, 300);

                if (
                    document.getElementById(
                        'studentRoadmapBody'
                    )
                ) {
                    renderStudentRoadmap();
                }
            }

            if (startupLoader) {
                startupLoader.markReady(
                    'student-submissions'
                );
            }
        }
    );

    listenFirebase(
        db.ref('materials'),
        'value',
        async (snapshot) => {
            const val = snapshot.val();

            if (!isDeepEqual(val, cacheMaterialsSt)) {
                cacheMaterialsSt = val;
                await loadMaterialsListStudent();
            }

            if (startupLoader) {
                startupLoader.markReady(
                    'student-materials'
                );
            }
        }
    );
    // ============================================

    // Đồng bộ điểm chuẩn từ xa do giáo viên cài đặt
    listenFirebase(db.ref('roadmap_settings/passingGrade'), 'value', (snapshot) => {
        window.currentPassingGrade = parseFloat(snapshot.val() ?? 7);
        if (document.getElementById('studentRoadmapBody')) renderStudentRoadmap();
        if (startupLoader) startupLoader.markReady('student-roadmap-settings');
    });

    listenFirebase(
        db.ref('schedule'),
        'value',
        async () => {

            if (
                typeof loadScheduleStudent ===
                'function'
            ) {
                await loadScheduleStudent();
            }

            if (startupLoader) {
                startupLoader.markReady(
                    'student-schedule'
                );
            }
        }
    );

    listenFirebase(db.ref('game_settings'), 'value', (snapshot) => {
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
        if (startupLoader) {
            startupLoader.markReady(
                'student-game-settings'
            );
        }
    });
    window.wheelProbs = { miss: 50, c100: 20, c150: 25, c500: 4, gift: 1 };
    listenFirebase(db.ref('game_settings/wheel_probabilities'), 'value', (snapshot) => {
        if (snapshot.exists()) {
            window.wheelProbs = snapshot.val();
        }
        if (startupLoader) startupLoader.markReady('student-wheel-settings');
    });

    // ==========================================
    // DÁN ĐOẠN LẮNG NGHE COIN VÀO ĐÂY LÀ HẾT LỖI
    // ==========================================
    listenFirebase(db.ref('student_coins/' + currentUser.username), 'value', (snapshot) => {
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
        if (startupLoader) startupLoader.markReady('student-coins');
    });

    // === LẮNG NGHE HỆ THỐNG CỬA HÀNG (REAL-TIME PHÍA HỌC SINH) ===
    listenFirebase(db.ref('store_settings'), 'value', (snapshot) => {
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
                    if (settings[item.id].musicUrl !== undefined) {
                        item.musicUrl =
                            settings[item.id].musicUrl;
                    }

                    if (settings[item.id].volume !== undefined) {
                        item.volume =
                            settings[item.id].volume;
                    }

                    if (settings[item.id].loop !== undefined) {
                        item.loop =
                            settings[item.id].loop;
                    }
                }
            });
        }

        if (typeof window.filterStore === 'function') {
            window.filterStore(window.currentStoreFilterType || 'all');
        }

        if (
            typeof window.applyEquippedItems ===
            'function'
        ) {
            window.applyEquippedItems();
        }
        if (startupLoader) {
            startupLoader.markReady(
                'student-store-settings'
            );
        }
    });

    listenFirebase(db.ref('store_items'), 'value', async () => {
        if (typeof loadStoreItems === 'function') await loadStoreItems();
        if (startupLoader) {
            startupLoader.markReady(
                'student-store-items'
            );
        }
    });

    listenFirebase(db.ref('student_inventory/' + currentUser.username), 'value', async (snapshot) => {
        myInventory = snapshot.val() ? Object.values(snapshot.val()) : [];
        if (typeof loadStoreItems === 'function') await loadStoreItems();
        if (typeof applyEquippedItems === 'function') await Promise.resolve(applyEquippedItems());
        if (startupLoader) {
            startupLoader.markReady(
                'student-inventory'
            );
        }
    });

    // Ví Xu Sinh Nhật được tách riêng theo từng năm.
    listenFirebase(
        db.ref(
            'birthday_coins/' +
            currentUser.username
        ),
        'value',
        snapshot => {
            const wallets =
                snapshot.val() || {};

            window.studentBirthdayWallets =
                wallets;

            window.studentBirthdayCoins =
                normalizeBirthdayCoinBalances(
                    wallets
                );

            if (
                typeof window
                    .recoverBirthdayRedeemedItems ===
                'function'
            ) {
                window
                    .recoverBirthdayRedeemedItems(
                        wallets
                    );
            }

            if (
                typeof window.filterStore ===
                'function'
            ) {
                window.filterStore(
                    window.currentStoreFilterType ||
                    'all'
                );
            }

            const bagModal =
                document.getElementById(
                    'studentBagModal'
                );

            if (
                bagModal &&
                bagModal.classList.contains(
                    'active'
                ) &&
                typeof window
                    .renderStudentBag ===
                'function'
            ) {
                window.renderStudentBag();
            }
            if (startupLoader) startupLoader.markReady('student-birthday-wallet');
        }
    );

    // Ví Xu Đặc Biệt.
    listenFirebase(
        db.ref(
            'student_special_birthday_coins/' +
            currentUser.username
        ),

        'value',

        snapshot => {
            const grants =
                snapshot.val() || {};

            window
                .studentSpecialBirthdayCoinGrants =
                grants;

            window
                .studentSpecialBirthdayCoinCount =
                getUsableSpecialBirthdayCoinCount(
                    grants
                );

            /*
 * Không chạy phục hồi đúng lúc một giao dịch
 * đổi Xu Đặc Biệt đang thực hiện.
 */
            if (
                !window
                    .__specialBirthdayRedeemProcessing &&
                typeof window
                    .recoverSpecialBirthdayRedeemedItems ===
                'function'
            ) {
                window
                    .recoverSpecialBirthdayRedeemedItems(
                        grants
                    );
            }

            if (
                typeof window.filterStore ===
                'function'
            ) {
                window.filterStore(
                    window
                        .currentStoreFilterType ||
                    'all'
                );
            }

            const bagModal =
                document.getElementById(
                    'studentBagModal'
                );

            if (
                bagModal &&
                bagModal.classList.contains(
                    'active'
                ) &&
                typeof window
                    .renderStudentBag ===
                'function'
            ) {
                window.renderStudentBag();
            }
            if (startupLoader) startupLoader.markReady('student-special-wallet');
        }
    );

    // Kiểm tra hết hạn mỗi phút.
    setInterval(() => {
        const nextCount =
            getUsableSpecialBirthdayCoinCount(
                window
                    .studentSpecialBirthdayCoinGrants
            );

        if (
            nextCount ===
            window
                .studentSpecialBirthdayCoinCount
        ) {
            return;
        }

        window
            .studentSpecialBirthdayCoinCount =
            nextCount;

        if (
            typeof window.filterStore ===
            'function'
        ) {
            window.filterStore(
                window
                    .currentStoreFilterType ||
                'all'
            );
        }
    }, 60000);

    // LẮNG NGHE THÔNG BÁO TOÀN TRƯỜNG
    listenFirebase(db.ref('global_notifications'), 'value', (snapshot) => {
        if (startupLoader) startupLoader.markReady('student-notifications');
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
                window.currentMandatoryNotification = unreadNoti;

                const msgEl = document.getElementById('studentNotificationMessage');
                const btn = document.getElementById('btnAcknowledgeNotification');
                const scrollBox = document.getElementById('studentNotificationScrollBox');
                const checkbox = document.getElementById('checkUnderstand');
                const labelCheckbox = document.getElementById('labelUnderstandCheckbox');
                const scrollReminder = document.getElementById('scrollReminderText');

                if (msgEl && modal && btn && scrollBox && checkbox) {
                    msgEl.innerText = unreadNoti.message;
                    modal.classList.add('active');

                    // --- RESET TRẠNG THÁI GIAO DIỆN ---
                    checkbox.checked = false;
                    checkbox.disabled = true;
                    labelCheckbox.style.cursor = 'not-allowed';
                    labelCheckbox.style.color = '#999';
                    scrollReminder.style.display = 'block';

                    btn.disabled = true;
                    btn.style.background = '#9ca3af';
                    btn.style.cursor = 'not-allowed';
                    btn.style.boxShadow = 'none';
                    btn.innerText = "✅ Đã nhận và đọc hiểu (Khóa)";

                    let countdownTimer = null;

                    // Hàm tiện ích: Mở khóa Checkbox
                    const unlockCheckbox = () => {
                        checkbox.disabled = false;
                        labelCheckbox.style.cursor = 'pointer';
                        labelCheckbox.style.color = '#2c3e50';
                        scrollReminder.style.display = 'none';
                    };

                    // --- LOGIC 1: ÉP LƯỚT XUỐNG CUỐI ĐỂ MỞ KHÓA TICK ---
                    setTimeout(() => {
                        // Nếu văn bản quá ngắn, không xuất hiện thanh cuộn -> Mở khóa luôn
                        if (scrollBox.scrollHeight <= scrollBox.clientHeight + 2) {
                            unlockCheckbox();
                        } else {
                            // Nếu có thanh cuộn, buộc học sinh phải cuộn xuống đáy
                            scrollBox.onscroll = () => {
                                // Dung sai 5px để bắt đáy dễ hơn trên các màn hình khác nhau
                                if (scrollBox.scrollTop + scrollBox.clientHeight >= scrollBox.scrollHeight - 5) {
                                    unlockCheckbox();
                                    scrollBox.onscroll = null; // Gỡ sự kiện cuộn sau khi đã mở khóa
                                }
                            };
                        }
                    }, 50);

                    // --- LOGIC 2: TICK VÀO Ô ĐỂ ĐẾM NGƯỢC 5 GIÂY ---
                    checkbox.onchange = function () {
                        if (this.checked) {
                            let timeLeft = 5;
                            btn.innerText = `⏳ Vui lòng đợi (${timeLeft}s)...`;

                            countdownTimer = setInterval(() => {
                                timeLeft--;
                                if (timeLeft > 0) {
                                    btn.innerText = `⏳ Vui lòng đợi (${timeLeft}s)...`;
                                } else {
                                    // Hết 5 giây -> Mở khóa nút Nộp
                                    clearInterval(countdownTimer);
                                    btn.disabled = false;
                                    btn.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                                    btn.style.cursor = 'pointer';
                                    btn.style.boxShadow = '0 4px 15px rgba(17, 153, 142, 0.3)';
                                    btn.innerText = "✅ Đã nhận và đọc hiểu";
                                }
                            }, 1000);
                        } else {
                            // Bỏ tick giữa chừng -> Hủy đếm ngược, khóa lại nút Nộp
                            if (countdownTimer) clearInterval(countdownTimer);
                            btn.disabled = true;
                            btn.style.background = '#9ca3af';
                            btn.style.cursor = 'not-allowed';
                            btn.style.boxShadow = 'none';
                            btn.innerText = "✅ Đã nhận và đọc hiểu (Khóa)";
                        }
                    };

                    // --- LOGIC 3: GHI NHẬN KHI BẤM NÚT ---
                    btn.onclick = async function () {
                        if (btn.disabled) return;

                        btn.disabled = true;
                        btn.innerText = "⏳ Đang ghi nhận...";
                        try {
                            await db.ref(`global_notifications/${unreadNoti._fbKey}/receivers/${currentUser.username}`).set(true);

                            // Đã xác nhận thành công mới cho phép đóng
                            window.currentMandatoryNotification = null;
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
    listenFirebase(db.ref('global_surveys'), 'value', (snapshot) => {
        if (startupLoader) startupLoader.markReady('student-surveys');
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

    // ======================================================
    // HIỆU ỨNG THƯ QUÀ BAY VÀO HỘP THƯ ĐẾN
    // - Chạy khi có thư quà mới tới hộp thư
    // - Áp dụng cho quà giáo viên tặng, quà sinh nhật hệ thống...
    // - BỎ QUA phần thưởng sự kiện
    // ======================================================

    window.__inboxGiftFxState =
        window.__inboxGiftFxState || {
            initialized: false,
            knownKeys: new Set(),
            queue: [],
            running: false
        };

    // ======================================================
    // GHI NHỚ THƯ ĐÃ CHẠY HIỆU ỨNG
    // Mỗi thư chỉ được chạy animation đúng 1 lần.
    // Reload / đăng xuất đăng nhập lại cũng không chạy lại.
    // ======================================================

    function getInboxGiftFxPlayedStorageKey() {
        const username =
            String(
                currentUser?.username ||
                'guest'
            ).trim();

        return `inbox_gift_fx_played:${username}`;
    }

    function loadInboxGiftFxPlayedKeys() {
        try {
            const raw =
                localStorage.getItem(
                    getInboxGiftFxPlayedStorageKey()
                );

            const values =
                JSON.parse(raw || '[]');

            return new Set(
                Array.isArray(values)
                    ? values.map(String)
                    : []
            );
        } catch (error) {
            console.warn(
                'Không đọc được lịch sử hiệu ứng thư:',
                error
            );

            return new Set();
        }
    }

    window.__inboxGiftFxPlayedKeys =
        window.__inboxGiftFxPlayedKeys ||
        loadInboxGiftFxPlayedKeys();

    function hasInboxGiftFxPlayed(messageKey) {
        const key =
            String(messageKey || '').trim();

        if (!key) {
            return false;
        }

        return window
            .__inboxGiftFxPlayedKeys
            .has(key);
    }

    function markInboxGiftFxPlayed(messageKey) {
        const key =
            String(messageKey || '').trim();

        if (!key) {
            return;
        }

        const played =
            window.__inboxGiftFxPlayedKeys;

        played.add(key);

        /*
         * Chỉ giữ tối đa 500 thư gần nhất,
         * tránh localStorage phình quá lớn.
         */
        const values =
            Array.from(played);

        if (values.length > 500) {
            const removeCount =
                values.length - 500;

            values
                .slice(0, removeCount)
                .forEach(oldKey => {
                    played.delete(oldKey);
                });
        }

        try {
            localStorage.setItem(
                getInboxGiftFxPlayedStorageKey(),
                JSON.stringify(
                    Array.from(played)
                )
            );
        } catch (error) {
            console.warn(
                'Không lưu được lịch sử hiệu ứng thư:',
                error
            );
        }
    }

    function ensureInboxGiftFxStyles() {
        if (document.getElementById('inboxGiftFxStyles')) return;

        const style = document.createElement('style');
        style.id = 'inboxGiftFxStyles';
        style.textContent = `
#inboxGiftFxOverlay{
    position:fixed;
    inset:0;
    z-index:2147483000;
    pointer-events:none;
    overflow:hidden;
}
.inbox-gift-fx-stage{
    position:fixed;
    left:50%;
    top:38%;
    transform:translate(-50%,-50%);
    width:260px;
    height:260px;
}
.inbox-gift-fx-envelope{
    position:absolute;
    left:50%;
    top:58%;
    transform:translate(-50%,-50%);
    width:210px;
    height:150px;
    filter:drop-shadow(0 18px 35px rgba(0,0,0,.18));
}
.inbox-gift-fx-envelope-back{
    position:absolute;
    inset:0;
    background:#f7c5c5;
    border-radius:16px;
}
.inbox-gift-fx-letter{
    position:absolute;
    left:50%;
    top:10px;
    transform:translateX(-50%);
    width:140px;
    height:96px;
    background:#fffdfd;
    border-radius:10px;
    box-shadow:0 8px 18px rgba(0,0,0,.12);
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    gap:5px;
    font-size:13px;
    color:#7b5260;
    text-align:center;
    padding:10px;
    box-sizing:border-box;
}
.inbox-gift-fx-letter small{
    font-size:11px;
    opacity:.78;
}
.inbox-gift-fx-pocket-left,
.inbox-gift-fx-pocket-right,
.inbox-gift-fx-pocket-bottom{
    position:absolute;
    inset:0;
}
.inbox-gift-fx-pocket-left{
    clip-path:polygon(0 100%,0 48%,50% 100%);
    background:#eda3a3;
    border-bottom-left-radius:16px;
}
.inbox-gift-fx-pocket-right{
    clip-path:polygon(100% 100%,100% 48%,50% 100%);
    background:#e99999;
    border-bottom-right-radius:16px;
}
.inbox-gift-fx-pocket-bottom{
    clip-path:polygon(0 100%,50% 62%,100% 100%);
    background:#ef7f7f;
    border-bottom-left-radius:16px;
    border-bottom-right-radius:16px;
}
.inbox-gift-fx-flap{
    position:absolute;
    left:0;
    right:0;
    top:0;
    height:88px;
    clip-path:polygon(0 0,100% 0,50% 100%);
    background:#f4b0b0;
    transform-origin:50% 0%;
    transform:rotateX(180deg);
    transition:transform .42s ease;
    z-index:5;
}
.inbox-gift-fx-envelope.closed .inbox-gift-fx-flap{
    transform:rotateX(0deg);
}
.inbox-gift-fx-seal{
    position:absolute;
    left:50%;
    top:-12px;
    transform:translateX(-50%);
    width:38px;
    height:38px;
    border-radius:999px;
    background:#ff3f86;
    color:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:19px;
    box-shadow:0 8px 20px rgba(255,63,134,.35);
    z-index:6;
}
.inbox-gift-fx-gift{
    position:absolute;
    left:50%;
    top:8px;
    transform:translateX(-50%);
    min-width:118px;
    max-width:180px;
    padding:10px 14px;
    border-radius:16px;
    background:linear-gradient(180deg,#fff,#fff7fb);
    border:1px solid rgba(255,255,255,.85);
    box-shadow:0 16px 28px rgba(0,0,0,.14);
    display:flex;
    align-items:center;
    gap:10px;
    color:#334155;
}
.inbox-gift-fx-gift-emoji{
    width:34px;
    height:34px;
    border-radius:999px;
    background:rgba(255,99,132,.14);
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:19px;
    flex-shrink:0;
}
.inbox-gift-fx-gift-label{
    font-size:12px;
    font-weight:700;
    line-height:1.35;
    min-width:0;
}
.inbox-gift-fx-caption{
    position:absolute;
    left:50%;
    bottom:2px;
    transform:translateX(-50%);
    padding:8px 14px;
    border-radius:999px;
    background:rgba(15,23,42,.82);
    color:#fff;
    font-size:12px;
    font-weight:700;
    letter-spacing:.2px;
    white-space:nowrap;
}
.inbox-gift-fx-mail-bubble{
    position:fixed;
    z-index:2147483001;
    padding:8px 12px;
    border-radius:999px;
    background:#ef4444;
    color:#fff;
    font-size:12px;
    font-weight:800;
    box-shadow:0 10px 20px rgba(239,68,68,.28);
    pointer-events:none;
}
`;
        document.head.appendChild(style);
    }

    function getInboxGiftData(msg) {
        const type = String(msg?.giftType || 'none');

        if (type === 'coin') {
            return {
                emoji: '🪙',
                label: `${Number(msg.giftValue || 0).toLocaleString('vi-VN')} Coin`
            };
        }

        if (type === 'birthday_coin') {
            return {
                emoji: '🎂',
                label: `${Number(msg.giftValue || 0).toLocaleString('vi-VN')} Xu Sinh Nhật`
            };
        }

        if (type === 'special_birthday_coin') {
            return {
                emoji: '🌟',
                label: `${Number(msg.giftValue || 0).toLocaleString('vi-VN')} Xu Đặc Biệt`
            };
        }

        if (type === 'money') {
            return {
                emoji: '💵',
                label: `${Number(msg.giftValue || 0).toLocaleString('vi-VN')} đ Tiền lộ trình`
            };
        }

        if (type === 'ticket') {
            return {
                emoji: '🎫',
                label: `${Number(msg.giftValue || 0).toLocaleString('vi-VN')} Vé quay may mắn`
            };
        }

        if (type === 'discount') {
            return {
                emoji: '🏷️',
                label: `Thẻ giảm giá ${Number(msg.giftValue || 0)}%`
            };
        }

        if (type === 'item') {
            const itemDef =
                typeof StoreConfig !== 'undefined' &&
                    Array.isArray(StoreConfig.items)
                    ? StoreConfig.items.find(
                        item =>
                            String(item.id) === String(msg.giftValue)
                    )
                    : null;

            return {
                emoji: '🎁',
                label: itemDef?.name || 'Vật phẩm mới'
            };
        }

        return {
            emoji: '💌',
            label: 'Quà mới'
        };
    }

    function shouldAnimateInboxGiftMessage(msg) {
        if (!msg) return false;
        if (!msg.giftType || msg.giftType === 'none') return false;

        // Chủ động cho phép tắt ở nguồn gửi
        if (msg.skipInboxGiftAnimation === true) {
            return false;
        }

        const source =
            String(msg.source || '')
                .trim()
                .toLowerCase();

        // BỎ QUA phần thưởng sự kiện
        if (
            source.startsWith('hoihoa_') ||
            source === 'event' ||
            source === 'event_reward' ||
            source === 'season_reward'
        ) {
            return false;
        }

        return true;
    }

    function getInboxTargetElement() {
        const badge = document.getElementById('inboxBadge');

        if (
            badge &&
            badge.offsetParent !== null
        ) {
            return badge;
        }

        const selectors = [
            '[onclick="openStudentInbox()"]',
            '[onclick*="openStudentInbox"]',
            '#openStudentInboxBtn',
            '.inbox-button',
            '.mailbox-button'
        ];

        for (const selector of selectors) {
            const node = document.querySelector(selector);
            if (node) return node;
        }

        return null;
    }

    function getInboxTargetRect() {
        const target = getInboxTargetElement();

        if (target) {
            const rect = target.getBoundingClientRect();
            return {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2
            };
        }

        return {
            left: window.innerWidth - 40,
            top: 28,
            width: 28,
            height: 28,
            centerX: window.innerWidth - 26,
            centerY: 42
        };
    }

    function waitInboxGiftFx(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function pulseInboxTarget() {
        const target = getInboxTargetElement();
        const badge = document.getElementById('inboxBadge');

        if (target && typeof target.animate === 'function') {
            target.animate(
                [
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.12)' },
                    { transform: 'scale(0.94)' },
                    { transform: 'scale(1.08)' },
                    { transform: 'scale(1)' }
                ],
                {
                    duration: 700,
                    easing: 'ease-out'
                }
            );
        }

        if (badge && typeof badge.animate === 'function') {
            badge.animate(
                [
                    { transform: 'scale(1)', opacity: 1 },
                    { transform: 'scale(1.25)', opacity: 1 },
                    { transform: 'scale(1)', opacity: 1 }
                ],
                {
                    duration: 650,
                    easing: 'ease-out'
                }
            );
        }
    }

    async function playInboxGiftArrivalAnimation(msg) {
        ensureInboxGiftFxStyles();

        const data = getInboxGiftData(msg);
        const targetRect = getInboxTargetRect();

        const overlay = document.createElement('div');
        overlay.id = 'inboxGiftFxOverlay';

        const stage = document.createElement('div');
        stage.className = 'inbox-gift-fx-stage';

        const envelope = document.createElement('div');
        envelope.className = 'inbox-gift-fx-envelope';

        envelope.innerHTML = `
        <div class="inbox-gift-fx-envelope-back"></div>
        <div class="inbox-gift-fx-letter">
            <small>Gửi đến bạn</small>
            <strong>Thư quà mới</strong>
            <small>${data.label}</small>
        </div>
        <div class="inbox-gift-fx-pocket-left"></div>
        <div class="inbox-gift-fx-pocket-right"></div>
        <div class="inbox-gift-fx-pocket-bottom"></div>
        <div class="inbox-gift-fx-flap"></div>
        <div class="inbox-gift-fx-seal">❤</div>
    `;

        const gift = document.createElement('div');
        gift.className = 'inbox-gift-fx-gift';
        gift.innerHTML = `
        <div class="inbox-gift-fx-gift-emoji">${data.emoji}</div>
        <div class="inbox-gift-fx-gift-label">${data.label}</div>
    `;

        const caption = document.createElement('div');
        caption.className = 'inbox-gift-fx-caption';
        caption.textContent = 'Thư quà đang được gửi vào hộp thư...';

        stage.appendChild(gift);
        stage.appendChild(envelope);
        stage.appendChild(caption);
        overlay.appendChild(stage);
        document.body.appendChild(overlay);

        // B1. Quà rơi xuống gần thư
        gift.animate(
            [
                {
                    transform: 'translate(-50%, -70px) scale(.86)',
                    opacity: 0
                },
                {
                    transform: 'translate(-50%, 0px) scale(1)',
                    opacity: 1
                }
            ],
            {
                duration: 420,
                easing: 'cubic-bezier(.22,1,.36,1)',
                fill: 'forwards'
            }
        );

        await waitInboxGiftFx(450);

        // B2. Quà chui vào trong thư
        gift.animate(
            [
                {
                    transform: 'translate(-50%, 0px) scale(1)',
                    opacity: 1
                },
                {
                    transform: 'translate(-50%, 92px) scale(.74)',
                    opacity: .15
                }
            ],
            {
                duration: 420,
                easing: 'ease-in',
                fill: 'forwards'
            }
        );

        await waitInboxGiftFx(430);

        gift.style.display = 'none';

        // B3. Đóng thư
        envelope.classList.add('closed');
        caption.textContent = 'Đóng thư lại...';

        await waitInboxGiftFx(520);

        // B4. Thư nhỏ dần và bay về hộp thư đến
        caption.textContent = 'Bay vào hộp thư đến...';

        const stageRect = stage.getBoundingClientRect();
        const startX = stageRect.left + stageRect.width / 2;
        const startY = stageRect.top + stageRect.height / 2;

        const deltaX = targetRect.centerX - startX;
        const deltaY = targetRect.centerY - startY;

        await stage.animate(
            [
                {
                    transform: 'translate(-50%, -50%) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(.14)`,
                    opacity: .9
                }
            ],
            {
                duration: 950,
                easing: 'cubic-bezier(.2,.9,.1,1)',
                fill: 'forwards'
            }
        ).finished.catch(() => { });

        pulseInboxTarget();

        // B5. Báo thư mới
        const bubble = document.createElement('div');
        bubble.className = 'inbox-gift-fx-mail-bubble';
        bubble.textContent = '📩 Thư mới';

        bubble.style.left =
            `${Math.max(12, targetRect.centerX - 28)}px`;

        bubble.style.top =
            `${Math.max(12, targetRect.top - 18)}px`;

        overlay.appendChild(bubble);

        bubble.animate(
            [
                {
                    transform: 'translateY(10px) scale(.85)',
                    opacity: 0
                },
                {
                    transform: 'translateY(0) scale(1)',
                    opacity: 1
                },
                {
                    transform: 'translateY(-8px) scale(1)',
                    opacity: 1
                },
                {
                    transform: 'translateY(-16px) scale(.95)',
                    opacity: 0
                }
            ],
            {
                duration: 1200,
                easing: 'ease-out',
                fill: 'forwards'
            }
        );

        await waitInboxGiftFx(1250);

        overlay.remove();
    }

    function runInboxGiftAnimationQueue() {
        const state = window.__inboxGiftFxState;

        if (state.running || !state.queue.length) {
            return;
        }

        state.running = true;

        (async () => {
            try {

                /*
                 * Chờ màn hình Loading biến mất
                 * rồi mới chiếu hiệu ứng thư.
                 */
                while (true) {
                    const loader =
                        document.getElementById(
                            'appStartupLoader'
                        );

                    if (
                        !loader ||
                        loader.classList.contains(
                            'is-hidden'
                        )
                    ) {
                        break;
                    }

                    await waitInboxGiftFx(150);
                }

                while (state.queue.length) {
                    const nextMessage = state.queue.shift();
                    await playInboxGiftArrivalAnimation(nextMessage);
                    await waitInboxGiftFx(120);
                }
            } finally {
                state.running = false;
            }
        })();
    }

    function enqueueInboxGiftAnimation(msg) {
        if (!msg) {
            return;
        }

        const messageKey =
            String(
                msg._fbKey ||
                msg.messageId ||
                ''
            ).trim();

        if (!messageKey) {
            return;
        }

        /*
         * Thư này đã từng phát hiệu ứng
         * ở phiên trước hoặc lần tải trước
         * => tuyệt đối không chạy lại.
         */
        if (
            hasInboxGiftFxPlayed(
                messageKey
            )
        ) {
            return;
        }

        /*
         * Đánh dấu NGAY TRƯỚC KHI đưa vào queue.
         * Nhờ vậy nếu Firebase value callback
         * chạy nhiều lần cũng không thêm trùng.
         */
        markInboxGiftFxPlayed(
            messageKey
        );

        const state =
            window.__inboxGiftFxState;

        state.queue.push(msg);

        runInboxGiftAnimationQueue();
    }

    // BỔ SUNG: Lắng nghe hộp thư (Chỉ cập nhật UI, KHÔNG thực hiện thao tác Xóa ở đây)
    listenFirebase(
        db.ref('inbox_messages/' + currentUser.username),
        'value',
        (snapshot) => {
            const messages = [];
            const now = Date.now();

            const fxState =
                window.__inboxGiftFxState ||
                (window.__inboxGiftFxState = {
                    initialized: false,
                    knownKeys: new Set(),
                    queue: [],
                    running: false
                });

            const nextKeys = new Set();
            const arrivingGiftMessages = [];

            snapshot.forEach(child => {
                const msg = child.val();

                // Chỉ render thư chưa hết hạn
                if (!msg.expiry || now <= msg.expiry) {
                    const fullMsg = {
                        ...msg,
                        _fbKey: child.key
                    };

                    messages.push(fullMsg);
                    nextKeys.add(child.key);

                    // Chỉ phát hiệu ứng với thư MỚI tới
                    const messageTime =
                        Number(
                            fullMsg.timestamp ||
                            fullMsg.time ||
                            0
                        );

                    const messageAge =
                        now - messageTime;

                    /*
                     * Nếu vừa đăng nhập:
                     * vẫn chạy hiệu ứng cho thư được gửi
                     * trong vòng 15 phút gần nhất.
                     */
                    const isRecentGift =
                        messageTime > 0 &&
                        messageAge >= -30000 &&
                        messageAge <=
                        15 * 60 * 1000;

                    /*
                     * Khi trang đã chạy:
                     * mọi thư mới phát sinh đều chạy.
                     */
                    const isNewLiveGift =
                        fxState.initialized &&
                        !fxState.knownKeys.has(
                            child.key
                        );

                    const isNewOnStartup =
                        !fxState.initialized &&
                        isRecentGift;

                    if (
                        (
                            isNewLiveGift ||
                            isNewOnStartup
                        ) &&
                        shouldAnimateInboxGiftMessage(
                            fullMsg
                        )
                    ) {
                        arrivingGiftMessages.push(
                            fullMsg
                        );
                    }
                }
            });

            window.myInboxMessages =
                messages.sort(
                    (a, b) =>
                        (b.timestamp || 0) -
                        (a.timestamp || 0)
                );

            // Cập nhật badge
            const badge = document.getElementById('inboxBadge');
            if (badge) {
                if (messages.length > 0) {
                    badge.innerText = messages.length;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }

            // Chỉ seed trạng thái ở lần đầu, tránh mở web lên là chạy hiệu ứng toàn bộ thư cũ
            if (!fxState.initialized) {
                fxState.initialized = true;
            }

            /*
             * Không dùng else.
             * Nhờ vậy thư mới phát hiện ngay lúc
             * vừa đăng nhập cũng được chạy.
             */
            if (
                arrivingGiftMessages.length > 0
            ) {
                arrivingGiftMessages
                    .sort(
                        (a, b) =>
                            (a.timestamp || 0) -
                            (b.timestamp || 0)
                    )
                    .forEach(msg => {
                        enqueueInboxGiftAnimation(
                            msg
                        );
                    });
            }

            fxState.knownKeys = nextKeys;

            // Nếu hộp thư đang mở thì render lại
            const inboxModal =
                document.getElementById('studentInboxModal');

            if (
                inboxModal &&
                inboxModal.classList.contains('active')
            ) {
                renderStudentInbox();
            }
            if (startupLoader) startupLoader.markReady('student-inbox');
        }
    );

    // === QUÉT NGẦM VÀ XÓA HỘP THƯ HẾT HẠN (MỖI 5 PHÚT) ===
    setInterval(async () => {
        try {
            const snapshot = await db.ref('inbox_messages/' + currentUser.username).once('value');
            if (!snapshot.exists()) return;

            const now = Date.now();
            let updates = {};
            let hasExpired = false;

            snapshot.forEach(child => {
                const msg = child.val();
                // Nếu thư đã quá hạn, gom key lại để chuẩn bị xóa
                if (msg.expiry && now > msg.expiry) {
                    updates[child.key] = null; // Gán null tương đương với lệnh remove()
                    hasExpired = true;
                }
            });

            // Nếu có thư hết hạn, thực hiện xóa 1 lần duy nhất bằng update (Tối ưu hiệu suất)
            if (hasExpired) {
                await db.ref('inbox_messages/' + currentUser.username).update(updates);
            }
        } catch (error) {
            console.error("Lỗi khi dọn dẹp hộp thư ngầm:", error);
        }
    }, 300000); // 300000ms = 5 phút quét một lần

    // === QUÉT NGẦM VẬT PHẨM DÙNG THỬ (MỖI 60 GIÂY) ===
    setInterval(async () => {
        if (typeof myInventory === 'undefined' || !myInventory.length) return;

        const now = Date.now();
        let hasExpired = false;
        let updates = {};

        myInventory.forEach(item => {
            if (
                item.isTrial &&
                item.trialExpiry &&
                now > item.trialExpiry
            ) {
                hasExpired = true;

                // Nếu nhạc dùng thử đang được trang bị thì dừng ngay
                if (item.isEquipped) {
                    const itemDef = StoreConfig.items.find(
                        storeItem => storeItem.id === item.id
                    );

                    if (
                        itemDef &&
                        itemDef.type === 'music' &&
                        typeof MusicManager !== 'undefined'
                    ) {
                        MusicManager.stopMusic();
                    }
                    if (
                        itemDef.type === 'frame' &&
                        window.AvatarFrameManager
                    ) {
                        window.AvatarFrameManager.clearFrame();
                    }
                }

                // Xóa vật phẩm hết hạn khỏi kho
                updates[
                    `student_inventory/${currentUser.username}/${item.id}`
                ] = null;
            }
        });

        if (hasExpired) {
            await db.ref().update(updates);
            alert("⏰ Hệ thống ghi nhận có vật phẩm dùng thử của bạn đã hết hạn 24 giờ và vừa bị thu hồi!");
            // Hàm db.ref('student_inventory/').on('value') có sẵn của bạn sẽ tự động chạy lại để gỡ trang bị ngay lập tức
        }
    }, 60000);

    // Đồng bộ nút Bật/Tắt Bảng quy đổi từ Giáo viên
    listenFirebase(db.ref('system_settings/conversionTableEnabled'), 'value', (snapshot) => {
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
        if (startupLoader) startupLoader.markReady('student-conversion-settings');
    });

    // =================================================================
    // ĐỒNG BỘ TIỀN TÍCH LŨY VÀ TRẠNG THÁI RÚT TIỀN THEO THỜI GIAN THỰC
    // =================================================================

    // 1. Lắng nghe biến động tiền bù trừ (Giáo viên tặng/trừ tiền hoặc rút tiền)
    listenFirebase(db.ref('student_money_offset/' + currentUser.username), 'value', async () => {
        // Cập nhật bảng lộ trình & Tổng tiền bên ngoài
        if (typeof renderStudentRoadmap === 'function' && document.getElementById('studentRoadmapBody')) {
            await renderStudentRoadmap();
        }
        // Cập nhật luôn màn hình "Yêu cầu rút tiền mặt" nếu đang mở bảng quy đổi
        if (typeof window.initCashWithdrawInterface === 'function' && document.getElementById('displayRouteMoney')) {
            await window.initCashWithdrawInterface();
        }
        if (startupLoader) startupLoader.markReady('student-money-offset');
    });

    // 2. Lắng nghe trạng thái duyệt/từ chối rút tiền mặt từ Giáo viên
    listenFirebase(db.ref('cash_requests'), 'value', async () => {
        // Khi trạng thái yêu cầu đổi, cập nhật cả lịch sử lẫn số tiền còn có thể yêu cầu.
        if (typeof window.initCashWithdrawInterface === 'function' && document.getElementById('displayRouteMoney')) {
            await window.initCashWithdrawInterface();
        } else if (typeof renderCashRequestHistory === 'function' && document.getElementById('cashRequestHistoryContainer')) {
            await renderCashRequestHistory();
        }
        if (startupLoader) startupLoader.markReady('student-cash-requests');
    });

    await LimitedEventAnnouncementManager.init();
    if (startupLoader) startupLoader.markReady('student-limited-event');

    // Quét và cập nhật lại điều kiện cho các thẻ giảm giá CŨ của học sinh
    db.ref('student_discounts/' + currentUser.username).once('value', (snap) => {
        const discounts = snap.val();
        if (!discounts) {
            if (startupLoader) startupLoader.markReady('student-discounts');
            return;
        }

        let updates = {};
        // Lấy danh sách ID vật phẩm hợp lệ (<= 500 coin)
        const validItems = StoreConfig.items
            .filter(item => {
                const price = Number(item.price);

                return (
                    Number.isFinite(price) &&
                    price > 0 &&
                    price <= 500 &&
                    item.isNonCoin !== true &&
                    item.tag !== 'Doraemon' &&
                    item.tag !== 'Truyền thuyết'
                );
            })
            .map(item => item.id);

        Object.keys(discounts).forEach(key => {
            const discount = discounts[key];

            const targetItems =
                Array.isArray(discount.targetItem)
                    ? discount.targetItem
                    : [];

            /*
             * Không sửa các thẻ phần thưởng Hội Họa.
             */
            /*
 * Bổ sung nguồn cho thẻ Hội Họa cũ để chúng
 * không bị nhận nhầm thành thẻ giáo viên.
 */
            const isLegacyHoiHoaRunnerUp =
                key.startsWith('hh_discount_') &&
                !discount.source;

            const isLegacyHoiHoaChest =
                key.startsWith('hh_chest_discount_') &&
                !discount.source;

            if (isLegacyHoiHoaRunnerUp) {
                updates[
                    `student_discounts/${currentUser.username}/${key}/source`
                ] = 'hoihoa_runner_up';

                updates[
                    `student_discounts/${currentUser.username}/${key}/usageLimit`
                ] = 1;

                updates[
                    `student_discounts/${currentUser.username}/${key}/maxEligiblePriceExclusive`
                ] = 600;
            }

            if (isLegacyHoiHoaChest) {
                updates[
                    `student_discounts/${currentUser.username}/${key}/source`
                ] = 'hoihoa_chest';

                updates[
                    `student_discounts/${currentUser.username}/${key}/usageLimit`
                ] = 1;

                updates[
                    `student_discounts/${currentUser.username}/${key}/maxEligiblePriceExclusive`
                ] = 700;
            }

            const isHoiHoaDiscount =
                key.startsWith('hh_discount_') ||
                key.startsWith('hh_chest_discount_') ||
                discount.source === 'hoihoa_chest' ||
                discount.source === 'hoihoa_runner_up' ||
                discount.source === 'hoihoa_season';

            /*
             * Chỉ chuyển đổi các thẻ đăng nhập cũ.
             */
            const isLegacyDailyLogin =
                discount.source === 'daily_login';

            if (
                !discount.isUsed &&
                !isHoiHoaDiscount &&
                isLegacyDailyLogin &&
                targetItems.includes('all')
            ) {
                updates[
                    `student_discounts/${currentUser.username}/${key}/targetItem`
                ] = validItems;

                updates[
                    `student_discounts/${currentUser.username}/${key}/source`
                ] = 'daily_login';
            }
        });

        if (Object.keys(updates).length > 0) {
            db.ref().update(updates);
        }
        if (startupLoader) startupLoader.markReady('student-discounts');
    });
    if (startupLoader) {
        const allCloudReady = await startupLoader.waitForExpected({
            timeoutMs: 30000
        });

        if (!allCloudReady) return;

        await new Promise(resolve =>
            requestAnimationFrame(() =>
                requestAnimationFrame(resolve)
            )
        );

        // Không khóa giao diện chỉ để chờ YouTube/iframe.
        // Video tiếp tục tải bình thường sau khi web đã mở.
        startupLoader.waitForMedia({
            timeoutMs: 2000,
            quietMs: 150
        }).catch(() => { });

        startupLoader.hide();
    }
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
        return `<div class="video-wrapper" style="margin-bottom: 20px;"><iframe width="100%" height="315" src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" loading="eager" data-startup-video="1"></iframe></div>`;
    }
    // Thêm margin-bottom: 20px
    return `<div class="video-wrapper" style="margin-bottom: 20px;"><iframe width="100%" height="315" src="${url}" frameborder="0" allow="fullscreen" loading="eager" data-startup-video="1"></iframe></div>`;
}

let assignmentTimers = [];
function formatCountdown(ms) {
    if (ms <= 0) return "00:00:00";
    let d = Math.floor(ms / (1000 * 60 * 60 * 24));
    let h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
    let m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    let s = Math.floor((ms % (1000 * 60)) / 1000).toString().padStart(2, '0');

    if (d > 0) return `${d} ngày ${h}:${m}:${s}`;
    return `${h}:${m}:${s}`;
}

function formatSecondsToDHMS(totalSeconds) {
    if (totalSeconds <= 0) return "0 giây";
    let d = Math.floor(totalSeconds / (24 * 3600));
    let h = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;

    let parts = [];
    if (d > 0) parts.push(`${d} ngày`);
    if (h > 0) parts.push(`${h} giờ`);
    if (m > 0) parts.push(`${m} phút`);
    if (s > 0 || parts.length === 0) parts.push(`${s} giây`);

    return parts.join(' ');
}

// ======================================================
// TÌM BẢN NỘP PHÙ HỢP NHẤT CỦA HỌC SINH
// ======================================================
function normalizeStudentSubmissionValue(value) {
    return String(value ?? '');
}

function getStudentSubmissionTime(sub) {
    const timestamp = Number(
        sub && (sub.submittedAt || sub.updatedAt)
    );

    if (
        Number.isFinite(timestamp) &&
        timestamp > 0
    ) {
        return timestamp;
    }

    const idMatch =
        normalizeStudentSubmissionValue(
            sub && sub.id
        ).match(/^(\d{13})/);

    return idMatch ? Number(idMatch[1]) : 0;
}

function getStudentSubmissionRank(sub) {
    if (!sub) return -1;

    const isPenalty = !!(
        sub.isAutoSubmitted ||
        sub.isLateFail ||
        sub.isCheatFail
    );

    if (sub.forcePass) return 500;
    if (sub.isRedoing) return 450;

    if (sub.hasRedone && !isPenalty) {
        return 425;
    }

    if (!isPenalty) return 400;

    const hasGrade =
        sub.grade !== null &&
        sub.grade !== undefined &&
        sub.grade !== '';

    return hasGrade ? 200 : 100;
}

function getPreferredStudentSubmission(
    submissions,
    assignmentOrId,
    username
) {
    const assignmentIds =
        getStudentCompatAssignmentIds(
            assignmentOrId
        );

    const normalizedUsername =
        normalizeStudentSubmissionValue(
            username
        );

    const matches = (submissions || []).filter(
        submission =>
            assignmentIds.includes(
                normalizeStudentSubmissionValue(
                    getStudentCompatSubmissionAssignmentId(
                        submission
                    )
                )
            ) &&
            normalizeStudentSubmissionValue(
                getStudentCompatSubmissionUsername(
                    submission
                )
            ) === normalizedUsername
    );

    return matches.reduce(
        (preferred, candidate) => {
            if (!preferred) return candidate;

            const preferredRank =
                getStudentSubmissionRank(preferred);

            const candidateRank =
                getStudentSubmissionRank(candidate);

            if (candidateRank !== preferredRank) {
                return candidateRank > preferredRank
                    ? candidate
                    : preferred;
            }

            return getStudentSubmissionTime(candidate) >=
                getStudentSubmissionTime(preferred)
                ? candidate
                : preferred;
        },
        null
    );
}

async function loadAssignments() {
    const assignmentSource =
        window.cachedAssignments &&
            window.cachedAssignments.length > 0
            ? window.cachedAssignments
            : await getDB('assignments');

    // Sắp xếp trên bản sao, không thay đổi cache Firebase gốc.
    const assignments = Array.isArray(assignmentSource)
        ? [...assignmentSource]
        : [];
    const submissions = (window.cachedSubmissions && window.cachedSubmissions.length > 0) ? window.cachedSubmissions : await getDB('submissions');
    const list = document.getElementById('assignmentsList');

    const trackingSnap = await db.ref('video_tracking').once('value');
    const trackingData = trackingSnap.val() || {};
    const grades = document.getElementById('gradesList');

    // Dọn dẹp trình phát Video cũ (giữ nguyên các đoạn if typeof ytPlayers...)
    if (typeof ytPlayers !== 'undefined') { /*...*/ }
    if (typeof watchTimers !== 'undefined') { /*...*/ }

    // === TỐI ƯU HÓA: KHỞI TẠO BIẾN QUẢN LÝ TIMERS & DOM DIFFING ===
    if (typeof window.assignTimersObj === 'undefined') window.assignTimersObj = {};
    let hasAutoSubmitted = false;

    // Thiết lập Flexbox để tự động sắp xếp vị trí mà không cần vẽ lại toàn bộ DOM
    if (list) list.style.cssText = 'display: flex; flex-direction: column;';
    if (grades) grades.style.cssText = 'display: flex; flex-direction: column;';

    // Lọc lấy danh sách ID hiện tại
    const currentAssignIds = new Set(assignments.map(a => a.id));

    // Dọn dẹp DOM: Xóa các thẻ của bài tập đã bị Giáo viên xóa khỏi Database
    [list, grades].forEach(container => {
        if (!container) return;
        Array.from(container.children).forEach(child => {
            const childId = child.getAttribute('data-id');
            if (childId && !currentAssignIds.has(childId)) {
                container.removeChild(child);
                if (window.assignTimersObj[childId]) {
                    clearInterval(window.assignTimersObj[childId]);
                    delete window.assignTimersObj[childId];
                }
            }
        });
    });
    // ==============================================================

    // ==============================================================
    // SẮP XẾP "BÀI TẬP CẦN LÀM" THEO MỨC ĐỘ CẦN HÀNH ĐỘNG
    // ==============================================================
    const ASSIGNMENT_URGENT_MS = 5 * 60 * 1000;
    const ASSIGNMENT_GRACE_MS = 5 * 60 * 1000;
    const nowSortMs = Date.now();

    /**
     * Chuyển thời gian Firebase thành mili giây.
     * Trả về null nếu giáo viên không cài thời gian
     * hoặc dữ liệu thời gian không hợp lệ.
     */
    const parseAssignmentDateMs = value => {
        const textValue = String(value || '').trim();

        if (!textValue) {
            return null;
        }

        const parsed = new Date(
            textValue.includes('T')
                ? textValue
                : textValue.replace(' ', 'T')
        ).getTime();

        return Number.isFinite(parsed)
            ? parsed
            : null;
    };

    /**
     * Kiểm tra bài có được giao cho học sinh hiện tại không.
     */
    const isAssignmentForCurrentStudent = assign => {
        const targets = Array.isArray(assign?.targetStudent)
            ? assign.targetStudent
            : [assign?.targetStudent || 'all'];

        return (
            targets.includes('all') ||
            targets.includes(currentUser.username)
        );
    };

    /**
     * Kiểm tra bài đang có dữ liệu làm dở:
     * - Có file đã chọn nhưng chưa nộp.
     * - Có đáp án trắc nghiệm trong bản nháp.
     * - Có nội dung tự luận trong bản nháp.
     */
    const hasMeaningfulAssignmentDraft = assign => {
        const assignmentId = String(
            assign?.id ||
            assign?._fbKey ||
            ''
        );

        if (!assignmentId) {
            return false;
        }

        const pendingFiles =
            window.studentSubmitDTs?.[assignmentId]
                ?.files?.length || 0;

        if (pendingFiles > 0) {
            return true;
        }

        const rawDraft = localStorage.getItem(
            `draft_${currentUser.username}_${assignmentId}`
        );

        if (!rawDraft) {
            return false;
        }

        try {
            const draft = JSON.parse(rawDraft);

            const hasMultipleChoiceAnswer =
                Object.values(
                    draft?.mcAnswers || {}
                ).some(value => {
                    return String(value || '').trim() !== '';
                });

            const essayText = String(
                draft?.essay || ''
            )
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/gi, ' ')
                .trim();

            return (
                hasMultipleChoiceAnswer ||
                essayText.length > 0
            );
        } catch (error) {
            return false;
        }
    };

    /**
     * Giữ lại thứ tự ban đầu để dùng khi
     * tất cả điều kiện sắp xếp đều bằng nhau.
     */
    const originalAssignmentOrder = new Map(
        assignments.map((assign, index) => {
            return [assign, index];
        })
    );

    const assignmentSortMeta = new Map();

    /**
     * Tính nhóm ưu tiên cho từng bài.
     */
    assignments.forEach(assign => {
        const isTargeted =
            isAssignmentForCurrentStudent(assign);

        const mySub = isTargeted
            ? getPreferredStudentSubmission(
                submissions,
                assign,
                currentUser.username
            )
            : null;

        const startMs =
            parseAssignmentDateMs(assign.startDate);

        const endMs =
            parseAssignmentDateMs(assign.endDate);

        const hasStart = startMs !== null;
        const hasEnd = endMs !== null;

        const isBeforeStart =
            hasStart &&
            nowSortMs < startMs;

        const isPastEnd =
            hasEnd &&
            nowSortMs > endMs;

        const isOpen =
            !isBeforeStart &&
            !isPastEnd;

        const isGracePeriod =
            hasEnd &&
            nowSortMs > endMs &&
            nowSortMs <=
            endMs + ASSIGNMENT_GRACE_MS;

        const isRedoing =
            mySub?.isRedoing === true;

        /*
         * Có bài nộp và không ở trạng thái làm lại
         * nghĩa là học sinh không cần làm bài đó nữa.
         */
        const hasFinishedSubmission =
            Boolean(mySub) &&
            !isRedoing;

        const needsStudentAction =
            !hasFinishedSubmission ||
            isRedoing;

        const timeToDeadline = hasEnd
            ? endMs - nowSortMs
            : Number.POSITIVE_INFINITY;

        /*
         * Bài khẩn cấp:
         * - Học sinh vẫn cần làm.
         * - Bài đang mở.
         * - Có hạn nộp.
         * - Còn từ 0 đến 5 phút.
         */
        const isUrgent =
            needsStudentAction &&
            isOpen &&
            hasEnd &&
            timeToDeadline >= 0 &&
            timeToDeadline <=
            ASSIGNMENT_URGENT_MS;

        /*
         * Bài thi đang thực hiện trên màn hình.
         */
        const isCurrentExam =
            getStudentCompatAssignmentIds(assign)
                .includes(
                    String(
                        window.currentActiveExamId || ''
                    )
                );

        const hasDraft =
            needsStudentAction &&
            hasMeaningfulAssignmentDraft(assign);

        /*
         * Đã nộp nhưng chưa có điểm,
         * hoặc giáo viên đang chấm lại.
         */
        const isWaitingForGrade =
            hasFinishedSubmission &&
            (
                mySub?.isRegrading === true ||
                mySub?.grade === null ||
                mySub?.grade === undefined ||
                mySub?.grade === ''
            );

        let priority = 99;
        let primaryTime =
            Number.POSITIVE_INFINITY;

        let secondaryTime =
            Number.POSITIVE_INFINITY;

        if (!isTargeted) {
            /*
             * Không giao cho học sinh hiện tại.
             * Bài này sau đó cũng bị bỏ qua khi render.
             */
            priority = 99;
        } else if (isCurrentExam) {
            /*
             * Nhóm 0:
             * Bài thi đang thực hiện luôn đứng đầu.
             */
            priority = 0;

            primaryTime =
                endMs ??
                startMs ??
                Number.POSITIVE_INFINITY;
        } else if (isUrgent) {
            /*
             * Nhóm 1:
             * Bài còn tối đa 5 phút đến hạn.
             */
            priority = 1;
            primaryTime = endMs;

            secondaryTime =
                startMs ??
                Number.POSITIVE_INFINITY;
        } else if (
            needsStudentAction &&
            isGracePeriod
        ) {
            /*
             * Nhóm 2:
             * Bài vừa hết hạn, còn trong
             * 5 phút thu bài tự động.
             */
            priority = 2;
            primaryTime = endMs;
        } else if (
            needsStudentAction &&
            isOpen &&
            isRedoing
        ) {
            /*
             * Nhóm 3:
             * Giáo viên cho học sinh làm lại.
             */
            priority = 3;

            primaryTime =
                endMs ??
                Number.POSITIVE_INFINITY;

            secondaryTime =
                startMs ??
                Number.POSITIVE_INFINITY;
        } else if (
            needsStudentAction &&
            isOpen &&
            hasDraft
        ) {
            /*
             * Nhóm 4:
             * Bài đang làm dở hoặc có file chờ nộp.
             */
            priority = 4;

            primaryTime =
                endMs ??
                Number.POSITIVE_INFINITY;

            secondaryTime =
                startMs ??
                Number.POSITIVE_INFINITY;
        } else if (
            needsStudentAction &&
            isOpen &&
            hasEnd
        ) {
            /*
             * Nhóm 5:
             * Bài đã mở và có hạn nộp.
             * Hạn gần nhất đứng trước.
             */
            priority = 5;
            primaryTime = endMs;

            secondaryTime =
                startMs ??
                Number.POSITIVE_INFINITY;
        } else if (
            needsStudentAction &&
            isOpen
        ) {
            /*
             * Nhóm 6:
             * Bài đang mở nhưng không có hạn.
             */
            priority = 6;

            primaryTime =
                startMs ??
                Number.POSITIVE_INFINITY;
        } else if (
            needsStudentAction &&
            isBeforeStart
        ) {
            /*
             * Nhóm 7:
             * Bài chưa mở.
             * Bài mở sớm nhất đứng trước.
             */
            priority = 7;
            primaryTime = startMs;

            secondaryTime =
                endMs ??
                Number.POSITIVE_INFINITY;
        } else if (
            needsStudentAction &&
            isPastEnd
        ) {
            /*
             * Nhóm 8:
             * Bài quá hạn nhưng học sinh chưa nộp.
             */
            priority = 8;

            primaryTime =
                endMs ??
                Number.POSITIVE_INFINITY;
        } else if (isWaitingForGrade) {
            /*
             * Nhóm 9:
             * Đã nộp, chưa chấm hoặc đang chấm lại.
             */
            priority = 9;

            primaryTime =
                -getStudentSubmissionTime(mySub);
        } else {
            /*
             * Nhóm 10:
             * Đã chấm và hoàn thành.
             */
            priority = 10;

            primaryTime =
                -getStudentSubmissionTime(mySub);
        }

        /*
         * Lấy số trong tiêu đề "Bài N".
         * Tiêu đề không có số sẽ xếp sau
         * các bài có số trong cùng một nhóm.
         */
        const lessonMatch =
            String(assign.title || '')
                .match(/bài\s*(\d+)/i);

        const lessonNum = lessonMatch
            ? Number(lessonMatch[1])
            : Number.MAX_SAFE_INTEGER;

        assignmentSortMeta.set(assign, {
            priority,
            primaryTime,
            secondaryTime,
            lessonNum,
            isTargeted,
            needsStudentAction,
            startMs,
            endMs
        });
    });

    /**
     * Sắp xếp danh sách.
     */
    assignments.sort((a, b) => {
        const valsA =
            assignmentSortMeta.get(a);

        const valsB =
            assignmentSortMeta.get(b);

        // 1. Nhóm ưu tiên.
        if (valsA.priority !== valsB.priority) {
            return (
                valsA.priority -
                valsB.priority
            );
        }

        // 2. Hạn nộp hoặc thời gian mở chính.
        if (
            valsA.primaryTime !==
            valsB.primaryTime
        ) {
            return (
                valsA.primaryTime -
                valsB.primaryTime
            );
        }

        // 3. Thời gian phụ.
        if (
            valsA.secondaryTime !==
            valsB.secondaryTime
        ) {
            return (
                valsA.secondaryTime -
                valsB.secondaryTime
            );
        }

        // 4. Số "Bài N".
        if (
            valsA.lessonNum !==
            valsB.lessonNum
        ) {
            return (
                valsA.lessonNum -
                valsB.lessonNum
            );
        }

        // 5. Tên bài.
        const titleCompare =
            String(a.title || '')
                .localeCompare(
                    String(b.title || ''),
                    'vi-VN'
                );

        if (titleCompare !== 0) {
            return titleCompare;
        }

        // 6. Giữ thứ tự ban đầu.
        return (
            originalAssignmentOrder.get(a) -
            originalAssignmentOrder.get(b)
        );
    });

    /**
     * Tự sắp xếp lại đúng lúc trạng thái bài đổi:
     * - Đến thời gian bắt đầu.
     * - Bước vào 5 phút cuối.
     * - Đến hạn nộp.
     * - Hết 5 phút thu bài tự động.
     */
    if (window.assignmentPriorityRefreshTimer) {
        clearTimeout(
            window.assignmentPriorityRefreshTimer
        );
    }

    let nextPriorityRefreshAt =
        Number.POSITIVE_INFINITY;

    assignmentSortMeta.forEach(meta => {
        if (
            !meta.isTargeted ||
            !meta.needsStudentAction
        ) {
            return;
        }

        const transitionTimes = [];

        if (meta.startMs !== null) {
            transitionTimes.push(meta.startMs);
        }

        if (meta.endMs !== null) {
            transitionTimes.push(
                meta.endMs - ASSIGNMENT_URGENT_MS,
                meta.endMs,
                meta.endMs + ASSIGNMENT_GRACE_MS
            );
        }

        transitionTimes.forEach(timeValue => {
            if (
                Number.isFinite(timeValue) &&
                timeValue > nowSortMs + 100 &&
                timeValue < nextPriorityRefreshAt
            ) {
                nextPriorityRefreshAt =
                    timeValue;
            }
        });
    });

    if (
        Number.isFinite(
            nextPriorityRefreshAt
        )
    ) {
        const maxSafeTimeout = 2147483647;

        const refreshDelay = Math.min(
            Math.max(
                100,
                nextPriorityRefreshAt -
                nowSortMs +
                100
            ),
            maxSafeTimeout
        );

        window.assignmentPriorityRefreshTimer =
            setTimeout(() => {
                loadAssignments().catch(error => {
                    console.error(
                        'Lỗi cập nhật thứ tự bài tập theo thời gian:',
                        error
                    );
                });
            }, refreshDelay);
    }

    // --- KẾT THÚC LOGIC SẮP XẾP ---

    assignments.forEach(assign => {
        // [THÊM MỚI] Xử lý mảng đối tượng học sinh
        const targetArr = Array.isArray(assign.targetStudent) ? assign.targetStudent : [assign.targetStudent || 'all'];
        if (!targetArr.includes('all') && !targetArr.includes(currentUser.username)) return;

        const mySub = getPreferredStudentSubmission(
            submissions,
            assign,
            currentUser.username
        );

        const now = new Date();
        const startTime = assign.startDate ? new Date(assign.startDate.replace(" ", "T")) : new Date(0);
        const endTime = assign.endDate ? new Date(assign.endDate.replace(" ", "T")) : new Date("2100-01-01");
        const isRedoing = mySub && mySub.isRedoing;

        // === BỔ SUNG KHAI BÁO BIẾN THỜI GIAN TRỄ (GRACE PERIOD - 5 PHÚT) ===
        const gracePeriodEndTime = new Date(endTime.getTime() + 5 * 60000);
        const isGracePeriod = (now > endTime && now <= gracePeriodEndTime);
        // =================================================================

        // === TỐI ƯU HÓA: DOM DIFFING BẰNG MÃ BĂM (HASH) ===
        // 1. Tạo chuỗi Hash đại diện cho trạng thái hiện tại của bài tập
        let subState = mySub ? `${mySub.submitTime}_${mySub.grade}_${mySub.isRedoing}_${mySub.isAutoSubmitted}` : 'none';
        let cardHash =
            `${assign.id}_` +
            `${subState}_` +
            `${isGracePeriod}_` +
            `${assign.endDate}_` +
            `${assign.startDate}_` +
            `${assign.videoLink || ''}_` +
            `${assign.watchCondition || 0}_` +
            `${assign.videoSummaryEnabled ? '1' : '0'}_` +
            `${assign.videoSummary || ''}_` +
            `${assign.examTimeLimitEnabled ? '1' : '0'}_` +
            `${assign.examTimeLimitMinutes || 0}_` +
            `${window.currentActiveExamId || 'none'}`;

        let existingCard = document.querySelector(`.card[data-id="${assign.id}"]`);

        if (existingCard && existingCard.getAttribute('data-hash') === cardHash) {
            // NẾU HASH KHÔNG ĐỔI -> Trạng thái y nguyên -> Cập nhật vị trí rồi BỎ QUA vẽ lại DOM
            existingCard.style.order = assignments.indexOf(assign);
            return; // Trả về ngay, bảo vệ con trỏ chuột và text đang gõ của học sinh
        }

        // Nếu trạng thái thay đổi -> Xóa Timer cũ chuẩn bị vẽ lại DOM mới
        if (window.assignTimersObj[assign.id]) {
            clearInterval(window.assignTimersObj[assign.id]);
            delete window.assignTimersObj[assign.id];
        }
        // ===================================================

        // NẾU ĐÃ NỘP VÀ KHÔNG TRONG TRẠNG THÁI LÀM LẠI VÀ KHÔNG NẰM TRONG 5 PHÚT HIỂN THỊ TRỄ -> Bảng điểm
        if (mySub && !isRedoing && !isGracePeriod) {
            let typeText = '';
            if (assign.assessmentType === 'trac_nghiem') typeText = 'Trắc nghiệm';
            else if (assign.assessmentType === 'ket_hop') typeText = 'Kết hợp';
            else if (assign.assessmentType === 'thi') typeText = 'Thi';
            else typeText = 'Tự luận';

            let statusText = `Đã hoàn thành (${typeText})`;

            let violationHTML = '';
            if (mySub.isCheatFail) {
                violationHTML = `<div style="background: rgba(225, 29, 72, 0.1); border-left: 4px solid #e11d48; padding: 15px; margin-top: 15px; border-radius: 8px;"><h4 style="color: #e11d48; margin: 0 0 5px 0;">🚨 BÀI THI VI PHẠM QUY CHẾ</h4><p style="margin: 0; color: #b91c1c;">Hệ thống ghi nhận bạn đã tự ý thoát khỏi chế độ Toàn màn hình trong quá trình làm bài. Bài thi đã bị thu tự động và đánh dấu vi phạm vi chế nghiêm trọng.</p></div>`;
                statusText = `<span style="color: #e11d48; font-weight: bold;">❌ Vi phạm quy chế thi</span>`;
            }

            // THÊM ĐOẠN NÀY ĐỂ HIỂN THỊ LỖI THIẾU TỰ LUẬN
            if (mySub.isEssayMissing) {
                violationHTML += `<div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 15px; margin-top: 15px; border-radius: 8px;"><h4 style="color: #d97706; margin: 0 0 5px 0;">⚠️ THIẾU PHẦN TỰ LUẬN</h4><p style="margin: 0; color: #b45309;">Hệ thống ghi nhận bạn chưa nộp bài tự luận hợp lệ (chưa đủ 25 từ hoặc thiếu file đính kèm). Phần tự luận của bạn được tính 0 điểm.</p></div>`;
            }

            let missingEssayBadgeHTML = mySub.isEssayMissing ? `<span style="color: #e11d48; font-weight: bold; font-size: 0.9em; margin-left: 8px;">[❌ Chưa nộp tự luận]</span>` : '';

            let teacherFileHTML = '';

            if (assign.file && assign.assessmentType !== 'trac_nghiem') {
                const aFiles = Array.isArray(assign.file)
                    ? assign.file
                    : [assign.file];

                aFiles.forEach(f => {
                    teacherFileHTML += window.buildAttachmentPreviewHTML(
                        f,
                        '📎 Tài liệu đính kèm',
                        { tone: 'orange' }
                    );
                });
            }

            // Lấy thời gian học sinh đã xem video từ Firebase
            const resultVideoWatchSeconds =
                Number(
                    trackingData?.[assign.id]
                    ?.[currentUser.username]
                ) || 0;

            // Hiển thị video có bảng Tóm tắt
            let videoHTML =
                assign.videoLink
                    ? getTrackedVideoHTML(
                        assign.videoLink,
                        assign.id,
                        assign,
                        resultVideoWatchSeconds,
                        false
                    )
                    : '';

            let myFileHTML = '';

            if (mySub.file) {
                const mFiles = Array.isArray(mySub.file)
                    ? mySub.file
                    : [mySub.file];

                mFiles.forEach(f => {
                    myFileHTML += window.buildAttachmentPreviewHTML(
                        f,
                        '📄 File bạn đã nộp',
                        { tone: 'purple' }
                    );
                });
            }

            let gradedFileHTML = '';

            if (mySub.teacherFile) {
                const tFiles = Array.isArray(mySub.teacherFile)
                    ? mySub.teacherFile
                    : [mySub.teacherFile];

                tFiles.forEach(f => {
                    gradedFileHTML += window.buildAttachmentPreviewHTML(
                        f,
                        '👩‍🏫 File nhận xét từ GV',
                        { tone: 'green' }
                    );
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
            div.style.marginBottom = '20px';

            div.innerHTML = `${glassLockHTML}<div class="accordion-header" onclick="${clickHandler}"><div class="accordion-title"><h4>${assign.title}</h4><span>${statusText} ${missingEssayBadgeHTML}</span></div><div class="accordion-meta"><span>Điểm: <strong style="${(mySub.grade !== null && mySub.grade !== undefined && mySub.grade !== '' && !mySub.isRegrading) ? 'color:#059669;' : 'color:#d35400;'}">${gradeDisplay}</strong></span><span class="toggle-icon">▼</span></div></div>
                <div id="${uniqueId}" class="accordion-content">
                    <div class="assignment-meta"><p>🕒 <strong>Bạn đã nộp lúc:</strong> ${mySub.submitTime || 'Không rõ'}</p></div>
                    ${violationHTML}
                    ${videoHTML}
                    <div style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 12px; margin-top: 20px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.05);">
                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c3e50; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 8px;">📝 Nội dung bài làm của bạn:</p>
<div style="background: rgba(0,0,0,0.02); padding: 15px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.03);">
    <div class="ql-editor" style="margin: 0; color: ${mySub.isAutoSubmitted ? '#e74c3c' : '#444'}; line-height: 1.6; padding: 0;">${mySub.answer
                    ? window.sanitizeRichHTML(mySub.answer)
                    : '<i>(Không có)</i>'}
</div>
                        ${myFileHTML}
                    </div>
                    ${teacherFileHTML}
                    ${gradedFileHTML}
                    ${teacherCommentHTML}
                    ${viewQuestionsBtnHTML}
                </div>`;
            div.setAttribute('data-id', assign.id); div.setAttribute('data-hash', cardHash); div.style.order = assignments.indexOf(assign);
            if (existingCard) { existingCard.replaceWith(div); } else { grades.appendChild(div); }
        }
        // NẾU CHƯA NỘP HOẶC ĐANG LÀM LẠI HOẶC ĐANG TRONG 5 PHÚT TRỄ
        else {
            if (now < startTime) {
                const div = document.createElement('div'); div.className = 'card submit-box';
                div.innerHTML = `<h4 style="font-size: 1.3em; color: #764ba2; font-weight: 800; opacity: 0.6;">${assign.title}</h4><div class="assignment-meta" style="opacity: 0.8;"><p>📅 <strong>Hạn làm bài:</strong> Từ <span class="time-highlight">${assign.startDate}</span> đến <span class="time-highlight">${assign.endDate}</span></p></div><div class="glass-alert" style="margin-top: 15px; border-left-color: #667eea; background: rgba(102, 126, 234, 0.1);"><h4 style="color: #444; margin-bottom: 5px;">⏳ Chưa đến thời gian làm bài</h4><p style="margin: 0; font-size: 0.95em;">Hệ thống sẽ tự động mở khóa sau: <strong id="cd-start-${assign.id}" style="color: #667eea; font-size: 1.1em;">...</strong></p></div>`;
                div.setAttribute('data-id', assign.id); div.setAttribute('data-hash', cardHash); div.style.order = assignments.indexOf(assign);
                if (existingCard) { existingCard.replaceWith(div); } else { list.appendChild(div); }
                const timer = setInterval(() => { const c = new Date(); if (c >= startTime) { clearInterval(window.assignTimersObj[assign.id]); delete window.assignTimersObj[assign.id]; loadAssignments(); } else { const el = document.getElementById(`cd-start-${assign.id}`); if (el) el.innerText = formatCountdown(startTime - c); } }, 1000); window.assignTimersObj[assign.id] = timer;
            }
            else if (isGracePeriod || (now > endTime && !isRedoing)) {
                const autoFlagKey = `auto_sub_${assign.id}_${currentUser.username}`;
                if (!mySub && !localStorage.getItem(autoFlagKey) && !window[`isSubmitting_${assign.id}`]) {
                    window[`isSubmitting_${assign.id}`] = true;
                    localStorage.setItem(autoFlagKey, 'true');
                    hasAutoSubmitted = true;

                    // Khóa toàn bộ cảnh báo thi trong lúc đang tự động lưu bài
                    window.isFinalizingExamSubmission = true;

                    // Hết giờ: thoát thi và khôi phục pet/effect
                    if (
                        window.currentActiveExamId === assign.id ||
                        window.isExamVisualItemsSuspended === true
                    ) {
                        window.finishStudentExamMode(assign.id);
                    }

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

                        let autoExamSet = {
                            questions: [],
                            versionCode: 'Gốc',
                            versionIndex: 0
                        };

                        let autoQuestions = [];

                        // 1. Quét nháp trắc nghiệm và chấm điểm tự động
                        if (assign.assessmentType === 'trac_nghiem' || assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi') {
                            if (assign.questions) {
                                autoExamSet =
                                    window.getStudentExamQuestions(assign);

                                autoQuestions =
                                    autoExamSet.questions;

                                autoQuestions.forEach((q, idx) => {
                                    let selectedVal = mcAnswersObj[idx];
                                    if (selectedVal) {
                                        const isCorrect = selectedVal === q.correct;
                                        if (isCorrect) autoScore++;
                                        mcText += `Câu ${idx + 1}: Chọn ${selectedVal} ${isCorrect ? '✅' : '❌ (Đúng là ' + q.correct + ')'}\n`;
                                    } else {
                                        mcText += `Câu ${idx + 1}: Chưa chọn (Đúng là ${q.correct})\n`;
                                    }
                                });

                                let scale10 = Math.round(((autoScore / autoQuestions.length) * 10) * 10) / 10;
                                if (assign.assessmentType === 'trac_nghiem') {
                                    mcText += `\n=> 🎯 CHẤM ĐIỂM TỰ ĐỘNG: ${autoScore} / ${autoQuestions.length} (Đạt ${scale10} / 10 điểm)`;
                                    finalCalculatedGrade = scale10;
                                } else if (assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi') {
                                    let weight = assign.mcWeight || 5;
                                    let weightedScore = Math.round(((autoScore / autoQuestions.length) * weight) * 100) / 100;
                                    mcText += `\n=> 🎯 CHẤM TỰ ĐỘNG PHẦN TRẮC NGHIỆM: ${autoScore} / ${autoQuestions.length} (Đạt ${weightedScore} / ${weight} điểm)`;
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

                        // === ÁP DỤNG QUY CHẾ CHẤM ĐIỂM CHO BÀI THU TỰ ĐỘNG ===
                        let isEssayMissingAuto = false;
                        let wordCountAuto = rawEssay ? rawEssay.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
                        let hasAttachedFileAuto = rescuedFiles && rescuedFiles.length > 0;

                        if (assign.assessmentType !== 'trac_nghiem') {
                            if (assign.hideEssayText) {
                                if (!hasAttachedFileAuto) isEssayMissingAuto = true;
                            } else {
                                if (wordCountAuto < 25 && !hasAttachedFileAuto) isEssayMissingAuto = true;
                            }
                        }

                        if (isEssayMissingAuto) {
                            if (assign.assessmentType === 'tu_luan' || !assign.assessmentType) {
                                finalCalculatedGrade = 0;
                            } else if (assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi') {
                                if (finalCalculatedGrade === null) finalCalculatedGrade = 0;
                            }
                        }
                        // =======================================================

                        // 3. Đẩy lên Firebase
                        try {
                            const saveTime = Date.now();

                            const autoPayload = {
                                assignmentId: assign.id,
                                studentUsername: currentUser.username,
                                studentName: currentUser.name,
                                answer: finalAnswerText,
                                rawEssay: rawEssay,
                                mcAnswers: mcAnswersObj,

                                examVersionCode:
                                    autoExamSet.versionCode,

                                examVersionIndex:
                                    autoExamSet.versionIndex,

                                questionSnapshot:
                                    autoQuestions,

                                questionResults:
                                    window.buildStudentQuestionResults(
                                        autoExamSet,
                                        mcAnswersObj
                                    ),

                                grade: finalCalculatedGrade,

                                submittedAt: saveTime,

                                submitTime:
                                    new Date(saveTime)
                                        .toLocaleTimeString('vi-VN') +
                                    ' ' +
                                    new Date(saveTime)
                                        .toLocaleDateString('vi-VN'),

                                file: rescuedFiles,
                                teacherFile: null,
                                isAutoSubmitted: true,
                                isRedoing: false,
                                isLateFail: true,
                                isEssayMissing: isEssayMissingAuto
                            };

                            // Kiểm tra lại Firebase ngay trước khi ghi.
                            // Tránh trường hợp học sinh vừa bấm nộp,
                            // đồng thời bộ đếm hết giờ cũng chạy.
                            const latestSubmissions =
                                await getDB('submissions');

                            const existingSubmission =
                                getPreferredStudentSubmission(
                                    latestSubmissions,
                                    assign,
                                    currentUser.username
                                );

                            if (
                                existingSubmission &&
                                !existingSubmission.isRedoing
                            ) {
                                // Đã có bài nộp rồi:
                                // không tạo thêm và không ghi đè bài hợp lệ.
                            } else if (
                                existingSubmission &&
                                existingSubmission._fbKey
                            ) {
                                // Đang làm lại thì cập nhật đúng bản cũ
                                await updateDB(
                                    'submissions',
                                    existingSubmission._fbKey,
                                    autoPayload
                                );
                            } else {
                                // Chỉ tạo mới khi thực sự chưa có bản ghi
                                autoPayload.id =
                                    saveTime.toString() +
                                    Math.floor(Math.random() * 1000);

                                await pushDB(
                                    'submissions',
                                    autoPayload
                                );
                            }

                            // Chỉ xóa nháp sau khi Firebase đã lưu thành công
                            if (
                                assign.assessmentType === 'thi' &&
                                window.examRecoveryManager
                            ) {
                                await window.examRecoveryManager.complete(
                                    assign.id
                                );
                            } else {
                                localStorage.removeItem(draftKey);
                            }

                        } catch (error) {
                            console.error('❌ Tự động thu bài thất bại:', error);

                            // Cho hệ thống thử lại
                            localStorage.removeItem(autoFlagKey);

                            if (typeof window.showToast === 'function') {
                                window.showToast(
                                    'Mất kết nối khi lưu bài. Hệ thống sẽ tự động thử lại.',
                                    'error'
                                );
                            }
                        } finally {
                            window[`isSubmitting_${assign.id}`] = false;
                            window.isFinalizingExamSubmission = false;

                            loadAssignments();
                        }
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
                    div.setAttribute('data-id', assign.id); div.setAttribute('data-hash', cardHash); div.style.order = assignments.indexOf(assign);
                    if (existingCard) { existingCard.replaceWith(div); } else { list.appendChild(div); }

                    const timer = setInterval(() => {
                        const c = new Date();
                        if (c > gracePeriodEndTime) {
                            clearInterval(window.assignTimersObj[assign.id]);
                            delete window.assignTimersObj[assign.id];
                            loadAssignments();
                        } else {
                            const el = document.getElementById(`cd-late-${assign.id}`);
                            if (el) el.innerText = formatCountdown(gracePeriodEndTime - c);
                        }
                    }, 1000);
                    window.assignTimersObj[assign.id] = timer;
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

                if (
                    (
                        assign.assessmentType === 'trac_nghiem' ||
                        assign.assessmentType === 'ket_hop' ||
                        assign.assessmentType === 'thi'
                    ) &&
                    Array.isArray(assign.questions)
                ) {
                    const noticeHTML =
                        assign.assessmentType === 'ket_hop'
                            ? `<div class="glass-alert" style="padding: 10px; margin-bottom: 15px; border-left-color: #764ba2;">
                <strong>⚖️ Thang điểm bài này:</strong>
                Trắc nghiệm (${assign.mcWeight || 5}đ) -
                Tự luận (${assign.essayWeight || 5}đ)
            </div>`
                            : '';

                    // Phải lấy bản nháp trước khi dùng savedMc
                    const draftKey =
                        `draft_${currentUser.username}_${assign.id}`;

                    let draft;

                    try {
                        draft = JSON.parse(
                            localStorage.getItem(draftKey)
                        );

                        if (
                            typeof draft !== 'object' ||
                            draft === null
                        ) {
                            draft = {
                                mcAnswers: {},
                                essay: ''
                            };
                        }
                    } catch (e) {
                        draft = {
                            mcAnswers: {},
                            essay: ''
                        };
                    }

                    // Khai báo trước vòng lặp câu hỏi
                    const savedMc =
                        mySub && mySub.mcAnswers
                            ? mySub.mcAnswers
                            : (draft.mcAnswers || {});

                    const activeExamSet =
                        window.getStudentExamQuestions(assign);

                    const displayQuestions =
                        activeExamSet.questions;

                    const versionNotice =
                        activeExamSet.randomized
                            ? `
            <div class="glass-alert"
                style="
                    padding:10px;
                    margin-bottom:12px;
                    border-left-color:#4f46e5;
                ">
                <strong>
                    🎲 Mã đề ${activeExamSet.versionCode}
                </strong>
                · ${displayQuestions.length} câu
            </div>
        `
                            : '';

                    quizHTML =
                        noticeHTML +
                        versionNotice +
                        `<div class="student-quiz-section">
            <h4 class="student-quiz-title">
                Phần Trắc Nghiệm
            </h4>`;

                    displayQuestions.forEach((q, idx) => {
                        const chkA =
                            savedMc[idx] === 'A'
                                ? 'checked'
                                : '';

                        const chkB =
                            savedMc[idx] === 'B'
                                ? 'checked'
                                : '';

                        const chkC =
                            savedMc[idx] === 'C'
                                ? 'checked'
                                : '';

                        const chkD =
                            savedMc[idx] === 'D'
                                ? 'checked'
                                : '';

                        quizHTML += `
            <div class="student-quiz-question">
                <p class="student-quiz-question-text">
                    Câu ${idx + 1}: ${q.qText}
                </p>

                <div class="student-quiz-options">
                    <label class="student-quiz-option">
                        <input
                            type="radio"
                            name="q-${assign.id}-${idx}"
                            value="A"
                            ${chkA}
                            onchange="saveDraft('${assign.id}', 'mc', ${idx}, 'A')"
                        >
                        <span>A. ${q.A}</span>
                    </label>

                    <label class="student-quiz-option">
                        <input
                            type="radio"
                            name="q-${assign.id}-${idx}"
                            value="B"
                            ${chkB}
                            onchange="saveDraft('${assign.id}', 'mc', ${idx}, 'B')"
                        >
                        <span>B. ${q.B}</span>
                    </label>

                    <label class="student-quiz-option">
                        <input
                            type="radio"
                            name="q-${assign.id}-${idx}"
                            value="C"
                            ${chkC}
                            onchange="saveDraft('${assign.id}', 'mc', ${idx}, 'C')"
                        >
                        <span>C. ${q.C}</span>
                    </label>

                    <label class="student-quiz-option">
                        <input
                            type="radio"
                            name="q-${assign.id}-${idx}"
                            value="D"
                            ${chkD}
                            onchange="saveDraft('${assign.id}', 'mc', ${idx}, 'D')"
                        >
                        <span>D. ${q.D}</span>
                    </label>
                </div>
            </div>
        `;
                    });

                    quizHTML += '</div>';
                }

                const initialVideoWatchSeconds =
                    Number(
                        trackingData?.[assign.id]
                        ?.[currentUser.username]
                    ) || 0;

                let videoHTML =
                    assign.videoLink
                        ? getTrackedVideoHTML(
                            assign.videoLink,
                            assign.id,
                            assign,
                            initialVideoWatchSeconds,
                            true
                        )
                        : '';

                let descHTML = '';
                let teacherFileHTML = '';
                let tuLuanInputHTML = '';

                if (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi' || !assign.assessmentType) {
                    descHTML = assign.desc
                        ? `
        <div
            class="assignment-desc student-assignment-desc-view"
            style="
                text-align: left !important;
                width: 100%;
                word-break: break-word;
                line-height: 1.7;
            "
        >
            <strong>Yêu cầu bài tập:</strong>
            <br>

            <div style="text-align: left !important;">
                ${getStudentAssignmentDescHTML(assign.desc)}
            </div>
        </div>
    `
                        : '';
                    if (assign.file) {
                        const aFiles = Array.isArray(assign.file)
                            ? assign.file
                            : [assign.file];

                        aFiles.forEach(f => {
                            teacherFileHTML += window.buildAttachmentPreviewHTML(
                                f,
                                '📎 Tài liệu đính kèm',
                                { tone: 'orange' }
                            );
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
                        const mFiles = Array.isArray(mySub.file)
                            ? mySub.file
                            : [mySub.file];

                        mFiles.forEach(f => {
                            prevFileHTML += window.buildAttachmentPreviewHTML(
                                f,
                                '📄 File nộp cũ',
                                { tone: 'green' }
                            );
                        });

                        prevFileHTML += `
        <p style="font-size:0.85em; color:#e74c3c; margin:8px 0;">
            Bạn có thể chọn file khác để ghi đè.
        </p>
    `;
                    }
                    let essayTextAreaHTML = assign.hideEssayText
                        ? `<div class="glass-alert success" style="padding: 12px; margin-bottom: 12px; border-left-color: #38ef7d; background: rgba(56, 239, 125, 0.1);"><p style="margin:0; font-size:0.95em; font-weight:bold;">📁 Giáo viên yêu cầu nộp bài bằng tệp đính kèm (Không cần nhập nội dung văn bản).</p></div>`
                        : `<div
        id="answer-${assign.id}"
        class="quill-student-editor"
        style="
            min-height: 200px;
            background: #ffffff;
            color: #172033;
        "
    >${savedEssay ? savedEssay : ''}</div>`;

                    tuLuanInputHTML = `<hr style="border: 0; border-top: 1px dashed rgba(0,0,0,0.1); margin: 20px 0;">
                                       <h3 style="color: #2c3e50; margin-bottom: 10px;">Phần làm bài tự luận</h3>
                                       ${essayTextAreaHTML}
                                       <label style="display: block; margin: 10px 0 8px 0;"><strong>📎 Đính kèm file bài làm:</strong></label>
                                       ${prevFileHTML}
                                       <input type="file" id="studentFile-${assign.id}" accept="${ASSIGNMENT_ATTACHMENT_ACCEPT}" multiple onclick="window.isSelectingFile = true;" onchange="handleStudentFileAccumulate(this, '${assign.id}')" style="margin-bottom: 15px; background: rgba(255,255,255,0.5);">`;
                }

                let submitBtnHTML = currentUser.isLocked
                    ? `<button type="button" style="width: 100%; margin-top: 15px; padding: 14px; border-radius: 12px; border: none; background: #95a5a6; color: white; font-weight: bold; cursor: not-allowed;" onclick="alert('🔒 Tài khoản của bạn đang bị khóa tạm thời. Bạn không thể nộp bài!')">🔒 Tài khoản bị khóa (Không thể thao tác)</button>`
                    : `<button
        id="btn-submit-${assign.id}"
        class="btn-approve"
        style="
            width: 100%;
            color: #111;
            margin-top: 15px;
        "
        onclick="
            window.beginManualExamSubmission(
                '${assign.id}'
            );

            this.disabled = true;
            this.style.opacity = '0.6';

            this.innerText =
                '⏳ Đang xử lý, vui lòng đợi...';

            submitAssignment('${assign.id}')
                .catch(error => {
                    window
                        .handleManualExamSubmissionError(
                            '${assign.id}',
                            error
                        );
                })
                .finally(() => {
                    window
                        .endManualExamSubmission(
                            '${assign.id}'
                        );

                    this.disabled = false;
                    this.style.opacity = '1';

                    this.innerText =
                        'Nộp bài tập ngay';
                });
        ">
        Nộp bài tập ngay
    </button>`;

                const uniqueId = `student-todo-${assign.id}`;
                const div = document.createElement('div'); div.className = 'card submit-box accordion-card';
                div.style.position = 'relative'; // Bắt buộc để lớp phủ kính định vị chính xác
                div.style.marginBottom = '20px';

                // === BẮT ĐẦU LOGIC ĐIỀU KIỆN XEM VIDEO ===
                let currentWatchDuration = 0;
                if (trackingData[assign.id] && trackingData[assign.id][currentUser.username]) {
                    currentWatchDuration = trackingData[assign.id][currentUser.username];
                }

                let isConditionMet = true;
                let conditionNoticeHTML = '';

                if (assign.watchCondition && assign.watchCondition > 0) {
                    if (currentWatchDuration < assign.watchCondition) {
                        isConditionMet = false;
                        let requiredStr = formatSecondsToDHMS(assign.watchCondition);
                        let currentStr = formatSecondsToDHMS(currentWatchDuration);

                        conditionNoticeHTML = `
                            <div class="glass-alert danger" style="padding: 15px; margin-bottom: 15px; border-left: 5px solid #e11d48; background: rgba(225, 29, 72, 0.1);">
                                <h4 style="color: #e11d48; margin-bottom: 5px;">⚠️ Yêu cầu xem Video</h4>
                                <p style="margin: 0;">Giáo viên yêu cầu xem video đạt mốc tối thiểu <strong>${requiredStr}</strong> mới được mở khóa phần làm bài.</p>
                                <p style="margin: 5px 0 0 0; color: #d35400;">
    ⏱️ Hiện tại bạn đã xem:
    <strong id="condition-watch-display-${assign.id}">
        ${currentStr}
    </strong>
</p>
                            </div>
                        `;
                    }
                }

                // Nội dung làm bài thông thường
                let taskContentHTML = `
    <div id="assignment-task-content-${assign.id}"
        style="display: ${isConditionMet ? 'block' : 'none'};
        transition: opacity 0.5s;
        margin-top: 20px;">

        ${quizHTML}
        ${descHTML}
        ${teacherFileHTML}
        ${tuLuanInputHTML}
        ${submitBtnHTML}
    </div>
`;

                // Bài thông thường: video và phần làm bài ở cùng khu vực
                let assignmentContentRaw = `
    ${videoHTML}

    <div id="condition-notice-${assign.id}">
        ${conditionNoticeHTML}
    </div>

    ${taskContentHTML}
`;

                const configuredExamMinutes =
                    assign.examTimeLimitEnabled === true
                        ? Number(
                            assign.examTimeLimitMinutes
                        )
                        : 0;

                const examTimeLimitNoticeHTML =
                    Number.isFinite(
                        configuredExamMinutes
                    ) &&
                        configuredExamMinutes > 0

                        ? `<div class="glass-alert danger"
                            style="margin-bottom: 20px;
                            border-left-color: #e11d48;
                            background: rgba(225, 29, 72, 0.08);
                            text-align: left;">

                            <strong>
                                ⏱️ Thời gian làm bài:
                                ${configuredExamMinutes} phút
                            </strong>

                            <p style="margin: 6px 0 0;">
                                Đồng hồ bắt đầu chạy ngay khi bạn nhấn bắt đầu và vào toàn màn hình.
                                Hết giờ, bài sẽ được thu tự động và không bị tính là vi phạm.
                            </p>
                        </div>`

                        : '';

                // Bài thi nghiêm ngặt:
                // Video phải xem TRƯỚC khi bật chế độ thi
                if (assign.assessmentType === 'thi') {
                    assignmentContentRaw = `
        <div id="pre-exam-area-${assign.id}">
            ${videoHTML}

            <div id="condition-notice-${assign.id}">
                ${conditionNoticeHTML}
            </div>

            <div id="exam-wrapper-${assign.id}"
                style="display: ${isConditionMet ? 'block' : 'none'};
                                text-align: center;
                padding: 30px;">

                ${examTimeLimitNoticeHTML}

                <div class="glass-alert success"
                    style="margin-bottom: 20px;
                    border-left-color: #059669;
                    background: rgba(5, 150, 105, 0.08);">

                    <strong>✅ Điều kiện trước bài thi đã hoàn thành</strong>

                    <p style="margin: 6px 0 0;">
                        Khi nhấn bắt đầu, video sẽ bị đóng và hệ thống mới bật
                        chế độ chống chuyển tab.
                    </p>
                </div>

                <button class="btn-approve"
                    style="background: linear-gradient(135deg, #e11d48 0%, #ff4d4d 100%);
                    color: white;
                    font-size: 1.2em;
                    padding: 15px 30px;
                    border-radius: 50px;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 5px 15px rgba(225, 29, 72, 0.4);"
                    onclick="showExamWarning('${assign.id}')">

                    🚀 Bắt đầu bài thi
                </button>
            </div>
        </div>

        <div id="exam-content-${assign.id}" style="display: none;">
            <div id="assignment-task-content-${assign.id}"
                style="display: block;
                transition: opacity 0.5s;
                margin-top: 20px;">

                ${quizHTML}
                ${descHTML}
                ${teacherFileHTML}
                ${tuLuanInputHTML}
                ${submitBtnHTML}
            </div>
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

                div.setAttribute('data-id', assign.id); div.setAttribute('data-hash', cardHash); div.style.order = assignments.indexOf(assign);
                if (existingCard) { existingCard.replaceWith(div); } else { list.appendChild(div); }

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
                            clearInterval(window.assignTimersObj[assign.id]);
                            delete window.assignTimersObj[assign.id];
                            if (!isRedoing) loadAssignments();
                        } else {
                            const el = document.getElementById(`cd-end-${assign.id}`);
                            if (el) el.innerText = formatCountdown(timeLeft);
                        }
                    }, 1000);
                    window.assignTimersObj[assign.id] = timer;
                }
            }
        }
    });

    // Khởi tạo Quill cho tất cả các ô tự luận vừa render
    document.querySelectorAll('.quill-student-editor').forEach(el => {
        if (!el.classList.contains('ql-container')) {
            let quill = new Quill(el, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }], // 🎨 Thêm bảng chọn màu cho học sinh
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'image', 'formula'],
                        ['clean']
                    ]
                }
            });

            // Tự động lưu nháp khi học sinh gõ chữ hoặc đổi màu chữ
            const assignmentId =
                el.id.replace('answer-', '');

            let essayDraftTimer = null;

            const persistEssayDraft = function () {
                saveDraft(
                    assignmentId,
                    'essay',
                    null,
                    quill.root.innerHTML
                );
            };

            quill.on(
                'text-change',
                function () {
                    clearTimeout(essayDraftTimer);

                    essayDraftTimer = setTimeout(
                        persistEssayDraft,
                        700
                    );
                }
            );

            quill.root.addEventListener(
                'blur',
                function () {
                    clearTimeout(essayDraftTimer);
                    persistEssayDraft();
                }
            );
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
// XEM LẠI CÂU HỎI + LÀM LẠI TRẮC NGHIỆM
// CHỈ ÔN LUYỆN, KHÔNG LƯU FIREBASE HOẶC LOCALSTORAGE
// =====================================================================

function escapePracticeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#039;',
        '"': '&quot;'
    })[character]);
}

// Kiểm tra bài có câu hỏi trắc nghiệm hay không.
function hasPracticeMultipleChoice(assign) {
    return !!(
        assign &&
        Array.isArray(assign.questions) &&
        assign.questions.length > 0
    );
}

// Tạo CSS cho popup bằng JavaScript.
// Không cần sửa thêm student.css.
function ensurePracticeRedoStyles() {
    if (document.getElementById('practiceRedoDynamicStyles')) return;

    const style = document.createElement('style');
    style.id = 'practiceRedoDynamicStyles';

    style.textContent = `
        body.practice-redo-open {
            overflow: hidden !important;
        }

        .practice-redo-overlay {
            position: fixed;
            inset: 0;
            z-index: 100001;

            display: none;
            align-items: center;
            justify-content: center;

            padding: 15px;
            box-sizing: border-box;

            background: rgba(15, 23, 42, 0.72);
        }

        .practice-redo-warning-overlay {
            z-index: 100002;
        }

        .practice-redo-box {
            position: relative;

            width: min(1000px, calc(100vw - 30px));
            max-height: 92vh;

            display: flex;
            flex-direction: column;

            overflow: hidden;

            border-radius: 18px;
            background: #ffffff;

            box-shadow:
                0 25px 70px rgba(0, 0, 0, 0.35);
        }

        .practice-redo-header {
            padding:
                22px 60px 18px 22px;

            color: #ffffff;

            background:
                linear-gradient(
                    135deg,
                    #4338ca,
                    #7c3aed
                );
        }

        .practice-redo-header h3,
        .practice-redo-header p {
            color: #ffffff !important;
        }

        .practice-redo-scroll {
            min-height: 0;

            overflow-y: auto;

            padding: 20px;

            background: #f8fafc;
        }

        .practice-redo-question {
            margin-bottom: 15px;
            padding: 15px;

            border:
                1px solid #dbe3ed;

            border-left:
                5px solid #94a3b8;

            border-radius: 13px;

            background: #ffffff;
        }

        .practice-redo-question.unanswered {
            border-color: #f59e0b;

            box-shadow:
                0 0 0 3px
                rgba(245, 158, 11, 0.14);
        }

        .practice-redo-question.correct-question {
            border-left-color: #16a34a;
        }

        .practice-redo-question.wrong-question {
            border-left-color: #dc2626;
        }

        .practice-redo-options {
            display: grid;

            grid-template-columns:
                repeat(2, minmax(0, 1fr));

            gap: 10px;
        }

        .practice-redo-option {
            display: flex;
            align-items: flex-start;

            gap: 9px;

            padding: 12px;

            cursor: pointer;

            border:
                1px solid #dbe3ed;

            border-radius: 10px;

            background: #f8fafc;

            transition:
                border-color 0.2s,
                background 0.2s,
                transform 0.2s;
        }

        .practice-redo-option:hover {
            border-color: #818cf8;
            background: #eef2ff;
            transform: translateY(-1px);
        }

        .practice-redo-option:has(input:checked) {
            border-color: #6366f1;
            background: #eef2ff;
        }

        .practice-redo-option.answer-correct {
            border-color: #16a34a !important;
            background: #dcfce7 !important;
        }

        .practice-redo-option.answer-wrong {
            border-color: #dc2626 !important;
            background: #fee2e2 !important;
        }

        .practice-redo-feedback {
            display: none;

            margin-top: 12px;
            padding: 10px 12px;

            border-radius: 9px;

            font-weight: 800;
        }

        .practice-redo-feedback.feedback-correct {
            display: block;

            color: #166534;
            background: #dcfce7;
        }

        .practice-redo-feedback.feedback-wrong {
            display: block;

            color: #991b1b;
            background: #fee2e2;
        }

        .practice-redo-result {
            display: none;

            margin-bottom: 18px;
            padding: 16px;

            color: #14532d;

            border:
                2px solid #86efac;

            border-radius: 13px;

            background: #f0fdf4;
        }

        .practice-redo-result.show {
            display: block;
        }

        .practice-redo-video {
            margin-bottom: 18px;
            padding: 15px;

            border:
                1px solid #c7d2fe;

            border-radius: 13px;

            background: #eef2ff;
        }

        .practice-redo-video iframe {
            display: block;

            width: 100%;
            min-height: 260px;

            border: none;
            border-radius: 10px;
        }

        .practice-redo-footer,
        .practice-review-actions,
        .practice-warning-actions {
            display: flex;

            gap: 10px;

            padding: 15px 20px;

            background: #ffffff;
        }

        .practice-review-actions {
            padding: 18px 0 0;
        }

        .practice-warning-actions {
            padding: 18px 0 0;
        }

        .practice-btn {
            flex: 1;

            min-height: 45px;

            padding: 11px 16px;

            border: none;
            border-radius: 10px;

            cursor: pointer;

            font: inherit;
            font-weight: 850;

            transition:
                transform 0.2s,
                box-shadow 0.2s,
                opacity 0.2s;
        }

        .practice-btn:hover:not(:disabled) {
            transform: translateY(-2px);

            box-shadow:
                0 6px 15px
                rgba(0, 0, 0, 0.15);
        }

        .practice-btn-primary {
            color: #ffffff;

            background:
                linear-gradient(
                    135deg,
                    #667eea,
                    #764ba2
                );
        }

        .practice-btn-success {
            color: #ffffff;

            background:
                linear-gradient(
                    135deg,
                    #059669,
                    #22c55e
                );
        }

        .practice-btn-secondary {
            color: #334155;
            background: #e2e8f0;
        }

        .practice-btn:disabled {
            cursor: not-allowed;
            opacity: 0.65;
        }

        .practice-modal-close {
            position: absolute;

            top: 13px;
            right: 13px;

            z-index: 5;

            width: 34px;
            height: 34px;

            padding: 0;

            cursor: pointer;

            border: none;
            border-radius: 50%;

            color: #e11d48;
            background: #f1f5f9;

            font-weight: 900;
        }

        .practice-redo-box > .practice-modal-close {
            color: #ffffff;

            background:
                rgba(255, 255, 255, 0.2);
        }

        .practice-warning-box {
            width:
                min(
                    450px,
                    calc(100vw - 30px)
                );

            padding: 28px;

            text-align: center;

            border-radius: 18px;

            background: #ffffff;

            box-shadow:
                0 25px 70px
                rgba(0, 0, 0, 0.35);
        }

        @media (max-width: 700px) {
            .practice-redo-options {
                grid-template-columns: 1fr;
            }

            .practice-redo-footer,
            .practice-review-actions,
            .practice-warning-actions {
                flex-direction: column;
            }

            .practice-redo-scroll {
                padding: 14px;
            }

            .practice-redo-video iframe {
                min-height: 210px;
            }
        }
    `;

    document.head.appendChild(style);
}

// Đóng popup xem lại toàn bộ câu hỏi.
window.closeAssignmentQuestionsReview = function () {
    const modal =
        document.getElementById(
            'viewQuestionsModal'
        );

    if (modal) {
        modal.style.display = 'none';
        modal.innerHTML = '';
    }
};

// Mở popup xem lại toàn bộ câu hỏi.
window.viewAssignmentQuestions = async function (assignId) {
    ensurePracticeRedoStyles();

    const assignments =
        await getDB('assignments');

    const assign = assignments.find(
        item =>
            String(item.id) ===
            String(assignId)
    );

    if (!assign) {
        alert(
            'Không tìm thấy bài tập này. ' +
            'Vui lòng tải lại trang!'
        );

        return;
    }

    const submissions =
        await getDB('submissions');

    const mySubmission =
        getPreferredStudentSubmission(
            submissions,
            assign,
            currentUser.username
        );

    const fallbackExamSet =
        window.getStudentExamQuestions(assign);

    const reviewQuestions =
        Array.isArray(
            mySubmission?.questionSnapshot
        ) &&
            mySubmission.questionSnapshot.length > 0
            ? mySubmission.questionSnapshot
            : fallbackExamSet.questions;

    const reviewVersionCode =
        mySubmission?.examVersionCode ||
        fallbackExamSet.versionCode;

    const hasMC =
        reviewQuestions.length > 0;

    let contentHTML = `
    <h3
        style="
            color:#2c3e50;
            border-bottom:2px solid #667eea;
            padding:0 40px 10px 0;
            margin:0 0 12px;
        "
    >
        Nội dung câu hỏi:
        ${escapePracticeHTML(
        assign.title || ''
    )}
    </h3>

    ${reviewVersionCode &&
            reviewVersionCode !== 'Gốc'
            ? `
                <p style="
                    margin:0 0 20px;
                    padding:9px 12px;
                    border-radius:8px;
                    background:#eef2ff;
                    color:#4f46e5;
                    font-weight:800;
                ">
                    🎲 Mã đề ${escapePracticeHTML(
                reviewVersionCode
            )
            }
                </p>
            `
            : ''
        }
`;

    // Hiện phần trắc nghiệm.
    if (hasMC) {
        contentHTML += `
            <h4
                style="
                    color:#d35400;
                    margin-bottom:10px;
                "
            >
                📚 Phần Trắc Nghiệm
            </h4>
        `;

        reviewQuestions.forEach(
            (question, index) => {
                contentHTML += `
                    <div
                        style="
                            margin-bottom:15px;
                            padding:12px;
                            border:1px solid #e2e8f0;
                            border-radius:10px;
                            background:#f8fafc;
                        "
                    >
                        <p
                            style="
                                font-weight:bold;
                                color:#2c3e50;
                                margin:0 0 8px;
                            "
                        >
                            Câu ${index + 1}:
                            ${escapePracticeHTML(
                    question.qText || ''
                )}
                        </p>

                        <ul
                            style="
                                list-style:none;
                                padding:0;
                                margin:0;
                                line-height:1.8;
                                color:#444;
                            "
                        >
                            <li>
                                A.
                                ${escapePracticeHTML(
                    question.A || ''
                )}
                            </li>

                            <li>
                                B.
                                ${escapePracticeHTML(
                    question.B || ''
                )}
                            </li>

                            <li>
                                C.
                                ${escapePracticeHTML(
                    question.C || ''
                )}
                            </li>

                            <li>
                                D.
                                ${escapePracticeHTML(
                    question.D || ''
                )}
                            </li>
                        </ul>
                    </div>
                `;
            }
        );
    }

    // Hiện phần tự luận hoặc yêu cầu bài.
    if (
        assign.assessmentType === 'tu_luan' ||
        assign.assessmentType === 'ket_hop' ||
        assign.assessmentType === 'thi' ||
        !assign.assessmentType
    ) {
        if (assign.desc) {
            contentHTML += `
                <h4
                    style="
                        color:#d35400;
                        margin:20px 0 10px;
                    "
                >
                    ✍️ Phần Tự Luận / Yêu cầu
                </h4>

                <div
    style="
        padding:15px;
        border:1px solid #e2e8f0;
        border-radius:10px;
        background:#f8fafc;
        color:#444;
        text-align:left !important;
        word-break:break-word;
        line-height:1.7;
    "
>
    ${getStudentAssignmentDescHTML(assign.desc)}
</div>
            `;
        }
    }

    let modal =
        document.getElementById(
            'viewQuestionsModal'
        );

    if (!modal) {
        modal =
            document.createElement('div');

        modal.id =
            'viewQuestionsModal';

        document.body.appendChild(modal);
    }

    modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:99999;

        display:flex;
        justify-content:center;
        align-items:center;

        padding:15px;

        background:rgba(0,0,0,.65);

        box-sizing:border-box;
    `;

    modal.innerHTML = `
        <div
            style="
                position:relative;

                width:min(
                    1000px,
                    calc(100vw - 30px)
                );

                max-height:92vh;

                padding:28px;

                display:flex;
                flex-direction:column;

                box-sizing:border-box;

                border-radius:16px;

                background:#fff;

                box-shadow:
                    0 20px 60px
                    rgba(0,0,0,.3);
            "
        >
            <button
                id="btnCloseQuestionsReviewTop"
                class="practice-modal-close"
                type="button"
            >
                ✖
            </button>

            <div
                style="
                    min-height:0;
                    overflow-y:auto;
                    padding-right:10px;
                "
            >
                ${contentHTML}
            </div>

            <div class="practice-review-actions">
                ${hasMC
            ? `
                            <button
                                id="btnPracticeRedoFromReview"
                                class="
                                    practice-btn
                                    practice-btn-primary
                                "
                                type="button"
                            >
                                🔁 Làm lại trắc nghiệm
                            </button>
                        `
            : ''
        }

                <button
                    id="btnCloseQuestionsReview"
                    class="
                        practice-btn
                        practice-btn-secondary
                    "
                    type="button"
                >
                    Đóng lại
                </button>
            </div>
        </div>
    `;

    document
        .getElementById(
            'btnCloseQuestionsReviewTop'
        )
        ?.addEventListener(
            'click',
            window.closeAssignmentQuestionsReview
        );

    document
        .getElementById(
            'btnCloseQuestionsReview'
        )
        ?.addEventListener(
            'click',
            window.closeAssignmentQuestionsReview
        );

    document
        .getElementById(
            'btnPracticeRedoFromReview'
        )
        ?.addEventListener(
            'click',
            () =>
                window.openPracticeRedoWarning(
                    assign
                )
        );

    if (
        window.MathJax &&
        typeof window.MathJax
            .typesetPromise === 'function'
    ) {
        MathJax
            .typesetPromise([modal])
            .catch(console.error);
    }
};

// Mở bảng cảnh báo trước khi làm lại.
window.openPracticeRedoWarning = function (assign) {
    ensurePracticeRedoStyles();

    if (!hasPracticeMultipleChoice(assign)) {
        return;
    }

    window.pendingPracticeRedoAssignment =
        assign;

    let modal =
        document.getElementById(
            'practiceRedoWarningModal'
        );

    if (!modal) {
        modal =
            document.createElement('div');

        modal.id =
            'practiceRedoWarningModal';

        modal.className =
            'practice-redo-overlay ' +
            'practice-redo-warning-overlay';

        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div
            class="practice-warning-box"
            role="alertdialog"
            aria-modal="true"
        >
            <div style="font-size:3rem;">
                ⚠️
            </div>

            <h3
                style="
                    color:#b45309;
                    margin:8px 0 12px;
                "
            >
                Xác nhận làm lại
            </h3>

            <p>
                <strong>
                    Bài chỉ được làm lại
                    phần trắc nghiệm.
                </strong>
            </p>

            <p
                style="
                    font-size:.92rem;
                    color:#64748b;
                "
            >
                Đây là phần ôn luyện,
                kết quả không được lưu
                và không ảnh hưởng
                điểm chính thức.
            </p>

            <div class="practice-warning-actions">
                <button
                    id="btnConfirmPracticeRedo"
                    class="
                        practice-btn
                        practice-btn-primary
                    "
                    type="button"
                >
                    Đã rõ
                </button>

                <button
                    id="btnCancelPracticeRedo"
                    class="
                        practice-btn
                        practice-btn-secondary
                    "
                    type="button"
                >
                    Hủy
                </button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';

    document.body.classList.add(
        'practice-redo-open'
    );

    document
        .getElementById(
            'btnConfirmPracticeRedo'
        )
        ?.addEventListener(
            'click',
            window.confirmPracticeRedo
        );

    document
        .getElementById(
            'btnCancelPracticeRedo'
        )
        ?.addEventListener(
            'click',
            window.cancelPracticeRedoWarning
        );
};

// Hủy bảng cảnh báo.
window.cancelPracticeRedoWarning = function () {
    const modal =
        document.getElementById(
            'practiceRedoWarningModal'
        );

    if (modal) {
        modal.style.display = 'none';
        modal.innerHTML = '';
    }

    window.pendingPracticeRedoAssignment =
        null;

    document.body.classList.remove(
        'practice-redo-open'
    );
};

// Nhấn "Đã rõ".
window.confirmPracticeRedo = function () {
    const assign =
        window.pendingPracticeRedoAssignment;

    const warningModal =
        document.getElementById(
            'practiceRedoWarningModal'
        );

    if (warningModal) {
        warningModal.style.display = 'none';
        warningModal.innerHTML = '';
    }

    window.pendingPracticeRedoAssignment =
        null;

    if (!hasPracticeMultipleChoice(assign)) {
        document.body.classList.remove(
            'practice-redo-open'
        );

        return;
    }

    window.closeAssignmentQuestionsReview();

    window.openPracticeRedoModal(assign);
};

// Mở popup làm lại trắc nghiệm.
window.openPracticeRedoModal = function (assign) {
    if (!hasPracticeMultipleChoice(assign)) {
        return;
    }

    // Chỉ giữ dữ liệu tạm trong RAM.
    const practiceExamSet =
        window.getStudentExamQuestions(assign);

    // Chỉ giữ dữ liệu tạm trong RAM.
    window.practiceRedoSession = {
        submitted: false,

        versionCode:
            practiceExamSet.versionCode,

        versionIndex:
            practiceExamSet.versionIndex,

        randomized:
            practiceExamSet.randomized,

        questions:
            practiceExamSet.questions.map(
                question => ({
                    questionId:
                        question.questionId || '',

                    bankQuestionId:
                        question.bankQuestionId || '',

                    _sourceIndex:
                        question._sourceIndex,

                    qText: String(
                        question.qText || ''
                    ),

                    A: String(
                        question.A || ''
                    ),

                    B: String(
                        question.B || ''
                    ),

                    C: String(
                        question.C || ''
                    ),

                    D: String(
                        question.D || ''
                    ),

                    correct: String(
                        question.correct || ''
                    ).toUpperCase()
                })
            )
    };

    const safeId =
        String(
            assign.id || 'practice'
        ).replace(
            /[^a-zA-Z0-9_-]/g,
            '_'
        );

    // Hiển thị video nếu bài có video.
    const videoHTML =
        assign.videoLink
            ? `
                <div class="practice-redo-video">
                    <h4
                        style="
                            color:#4338ca;
                            margin:0 0 12px;
                        "
                    >
                        🎬 Video bài học
                    </h4>

                    ${getEmbedHTML(
                assign.videoLink
            )}
                </div>
            `
            : '';

    const questionsHTML =
        window.practiceRedoSession
            .questions
            .map(
                (question, index) => `
                    <section
                        class="practice-redo-question"
                        data-practice-question="${index}"
                    >
                        <p
                            style="
                                font-weight:850;
                                color:#172033;
                                line-height:1.55;
                                margin:0 0 12px;
                            "
                        >
                            Câu ${index + 1}:
                            ${escapePracticeHTML(
                    question.qText
                )}
                        </p>

                        <div
                            class="practice-redo-options"
                        >
                            ${[
                        'A',
                        'B',
                        'C',
                        'D'
                    ].map(
                        letter => `
                                    <label
                                        class="
                                            practice-redo-option
                                        "
                                        data-practice-option="${letter}"
                                    >
                                        <input
                                            type="radio"
                                            name="
                                                practice-${safeId}-${index}
                                            "
                                            value="${letter}"
                                            style="
                                                width:18px;
                                                height:18px;
                                                margin:2px 0 0;
                                            "
                                        >

                                        <strong>
                                            ${letter}.
                                        </strong>

                                        <span>
                                            ${escapePracticeHTML(
                            question[letter]
                        )}
                                        </span>
                                    </label>
                                `
                    ).join('')}
                        </div>

                        <div
                            class="
                                practice-redo-feedback
                            "
                        ></div>
                    </section>
                `
            )
            .join('');

    let modal =
        document.getElementById(
            'practiceRedoModal'
        );

    if (!modal) {
        modal =
            document.createElement('div');

        modal.id =
            'practiceRedoModal';

        modal.className =
            'practice-redo-overlay';

        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div
            class="practice-redo-box"
            role="dialog"
            aria-modal="true"
        >
            <button
                id="btnClosePracticeRedoTop"
                class="practice-modal-close"
                type="button"
            >
                ✖
            </button>

            <header class="practice-redo-header">
                <p
                    style="
                        margin:0 0 4px;
                        font-size:.78rem;
                        font-weight:900;
                    "
                >
                    ÔN LUYỆN KHÔNG LƯU KẾT QUẢ
                </p>

                <h3 style="margin:0 0 8px;">
                    🔁
                    ${escapePracticeHTML(
        assign.title || ''
    )}
                </h3>

                <p style="margin:0;">
                    Khi đóng popup, toàn bộ
                    đáp án và điểm luyện tập
                    sẽ bị xóa ngay.
                </p>
            </header>

            <div class="practice-redo-scroll">
                ${videoHTML}

                <div
                    id="practiceRedoResult"
                    class="practice-redo-result"
                ></div>

                ${questionsHTML}
            </div>

            <footer class="practice-redo-footer">
                <button
                    id="btnSubmitPracticeRedo"
                    class="
                        practice-btn
                        practice-btn-success
                    "
                    type="button"
                >
                    📤 Nộp và chấm điểm
                </button>

                <button
                    id="btnClosePracticeRedo"
                    class="
                        practice-btn
                        practice-btn-secondary
                    "
                    type="button"
                >
                    Đóng
                </button>
            </footer>
        </div>
    `;

    modal.style.display = 'flex';

    document.body.classList.add(
        'practice-redo-open'
    );

    document
        .getElementById(
            'btnSubmitPracticeRedo'
        )
        ?.addEventListener(
            'click',
            window.submitPracticeRedo
        );

    document
        .getElementById(
            'btnClosePracticeRedo'
        )
        ?.addEventListener(
            'click',
            window.closePracticeRedo
        );

    document
        .getElementById(
            'btnClosePracticeRedoTop'
        )
        ?.addEventListener(
            'click',
            window.closePracticeRedo
        );

    if (
        window.MathJax &&
        typeof window.MathJax
            .typesetPromise === 'function'
    ) {
        MathJax
            .typesetPromise([modal])
            .catch(console.error);
    }
};

// Nộp bài luyện tập và chấm điểm.
window.submitPracticeRedo = function () {
    const session =
        window.practiceRedoSession;

    const modal =
        document.getElementById(
            'practiceRedoModal'
        );

    if (
        !session ||
        !modal ||
        session.submitted
    ) {
        return;
    }

    const answers = {};
    const unanswered = [];

    // Kiểm tra câu chưa trả lời.
    session.questions.forEach(
        (question, index) => {
            const block =
                modal.querySelector(
                    `[data-practice-question="${index}"]`
                );

            const selected =
                block?.querySelector(
                    'input[type="radio"]:checked'
                );

            block?.classList.remove(
                'unanswered'
            );

            if (!selected) {
                unanswered.push(index);

                block?.classList.add(
                    'unanswered'
                );
            } else {
                answers[index] =
                    selected.value;
            }
        }
    );

    if (unanswered.length > 0) {
        modal
            .querySelector(
                `[data-practice-question="${unanswered[0]}"]`
            )
            ?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

        alert(
            `Còn ${unanswered.length} ` +
            `câu chưa chọn đáp án.`
        );

        return;
    }

    let correctCount = 0;

    session.questions.forEach(
        (question, index) => {
            const block =
                modal.querySelector(
                    `[data-practice-question="${index}"]`
                );

            const selectedAnswer =
                answers[index];

            const correctAnswer =
                question.correct;

            const isCorrect =
                selectedAnswer ===
                correctAnswer;

            if (isCorrect) {
                correctCount++;
            }

            block?.classList.add(
                isCorrect
                    ? 'correct-question'
                    : 'wrong-question'
            );

            // Khóa đáp án sau khi nộp.
            block
                ?.querySelectorAll('input')
                .forEach(input => {
                    input.disabled = true;
                });

            // Tô xanh đáp án đúng.
            block
                ?.querySelector(
                    `[data-practice-option="${correctAnswer}"]`
                )
                ?.classList.add(
                    'answer-correct'
                );

            // Tô đỏ lựa chọn sai.
            if (!isCorrect) {
                block
                    ?.querySelector(
                        `[data-practice-option="${selectedAnswer}"]`
                    )
                    ?.classList.add(
                        'answer-wrong'
                    );
            }

            const feedback =
                block?.querySelector(
                    '.practice-redo-feedback'
                );

            if (feedback) {
                feedback.classList.add(
                    isCorrect
                        ? 'feedback-correct'
                        : 'feedback-wrong'
                );

                feedback.textContent =
                    isCorrect
                        ? (
                            `✅ Đúng — bạn chọn ` +
                            `${selectedAnswer}.`
                        )
                        : (
                            `❌ Sai — bạn chọn ` +
                            `${selectedAnswer}, ` +
                            `đáp án đúng là ` +
                            `${correctAnswer}.`
                        );
            }
        }
    );

    const total =
        session.questions.length;

    // Điểm thang 10, làm tròn 1 chữ số.
    const score =
        Math.round(
            (correctCount / total) *
            100
        ) / 10;

    const scoreText =
        Number.isInteger(score)
            ? score
            : score.toFixed(1);

    const result =
        document.getElementById(
            'practiceRedoResult'
        );

    if (result) {
        result.classList.add('show');

        result.innerHTML = `
            <h3
                style="
                    margin:0 0 8px;
                    color:#166534;
                "
            >
                🎯 Điểm:
                ${scoreText}/10
            </h3>

            <p style="margin:0 0 5px;">
                Đúng
                <strong>
                    ${correctCount}/${total}
                </strong>
                câu.
            </p>

            <small>
                Kết quả này chỉ để ôn luyện,
                không được lưu lên hệ thống.
            </small>
        `;

        result.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    const submitButton =
        document.getElementById(
            'btnSubmitPracticeRedo'
        );

    if (submitButton) {
        submitButton.disabled = true;

        submitButton.textContent =
            '✅ Đã nộp và chấm điểm';
    }

    session.submitted = true;
};

// Đóng popup và xóa toàn bộ dữ liệu luyện tập.
window.closePracticeRedo = function () {
    const modal =
        document.getElementById(
            'practiceRedoModal'
        );

    if (modal) {
        // Dừng video đang phát.
        modal
            .querySelectorAll('iframe')
            .forEach(iframe => {
                iframe.src =
                    'about:blank';
            });

        modal.style.display = 'none';
        modal.innerHTML = '';
    }

    // Xóa dữ liệu luyện lại khỏi RAM.
    window.practiceRedoSession = null;

    window.pendingPracticeRedoAssignment =
        null;

    document.body.classList.remove(
        'practice-redo-open'
    );
};

async function submitAssignment(assignId, isAuto = false, isCheat = false) {
    if (currentUser.isLocked && !isAuto) return alert("🔒 LỖI: Tài khoản đang bị khóa tạm thời!");

    const assignments = await getDB('assignments');

    const normalizedAssignId =
        studentCompatText(assignId);

    const assign = assignments.find(
        assignment =>
            getStudentCompatAssignmentIds(
                assignment
            ).includes(normalizedAssignId)
    );
    if (!assign) return;

    const submissions = await getDB('submissions');
    const mySub = getPreferredStudentSubmission(
        submissions,
        assign,
        currentUser.username
    );
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

    let autoExamSet = {
        questions: [],
        versionCode: 'Gốc',
        versionIndex: 0,
        randomized: false
    };

    let autoQuestions = [];

    let activeExamSet = {
        questions: [],
        versionCode: 'Gốc',
        versionIndex: 0,
        randomized: false
    };

    let activeQuestions = [];

    if (
        assign.assessmentType === 'trac_nghiem' ||
        assign.assessmentType === 'ket_hop' ||
        assign.assessmentType === 'thi'
    ) {
        activeExamSet =
            window.getStudentExamQuestions(assign);

        activeQuestions =
            activeExamSet.questions;

        if (activeQuestions.length > 0) {
            const unansweredQuestions = [];

            activeQuestions.forEach(
                (q, idx) => {
                    const selected =
                        document.querySelector(
                            `input[name="q-${assignId}-${idx}"]:checked`
                        );

                    if (selected) {
                        mcAnswersObj[idx] =
                            selected.value;

                        const isCorrect =
                            selected.value ===
                            q.correct;

                        if (isCorrect) {
                            autoScore++;
                        }

                        mcText +=
                            `Câu ${idx + 1}: ` +
                            `Chọn ${selected.value} ` +
                            `${isCorrect
                                ? '✅'
                                : '❌ (Đúng là ' +
                                q.correct +
                                ')'
                            }\n`;
                    } else {
                        unansweredQuestions.push(
                            idx
                        );

                        mcText +=
                            `Câu ${idx + 1}: ` +
                            `Chưa chọn ` +
                            `(Đúng là ${q.correct})\n`;
                    }
                }
            );

            if (
                unansweredQuestions.length > 0 &&
                !isAuto
            ) {
                const questionNumbers =
                    unansweredQuestions.map(
                        index => index + 1
                    );

                const firstMissingIndex =
                    unansweredQuestions[0];

                const firstMissingRadio =
                    document.querySelector(
                        `input[name="q-${assignId}-${firstMissingIndex}"]`
                    );

                const firstMissingBlock =
                    firstMissingRadio?.closest(
                        '.student-quiz-question'
                    );

                document
                    .querySelectorAll(
                        '.student-quiz-question'
                    )
                    .forEach(block => {
                        block.style.outline = '';
                        block.style.boxShadow = '';
                    });

                if (firstMissingBlock) {
                    firstMissingBlock.style.outline =
                        '3px solid #e11d48';

                    firstMissingBlock.style.boxShadow =
                        '0 0 0 5px rgba(225, 29, 72, 0.15)';

                    firstMissingBlock
                        .querySelectorAll(
                            'input[type="radio"]'
                        )
                        .forEach(radio => {
                            radio.addEventListener(
                                'change',
                                function () {
                                    firstMissingBlock
                                        .style.outline = '';

                                    firstMissingBlock
                                        .style.boxShadow = '';
                                },
                                { once: true }
                            );
                        });
                }

                alert(
                    '⚠️ Bạn chưa chọn đáp án ở: ' +
                    questionNumbers
                        .map(number => `Câu ${number}`)
                        .join(', ')
                );

                setTimeout(() => {
                    firstMissingBlock
                        ?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });

                    firstMissingRadio?.focus();
                }, 0);

                return;
            }

            const scale10 =
                Math.round(
                    (
                        (
                            autoScore /
                            activeQuestions.length
                        ) *
                        10
                    ) *
                    10
                ) / 10;

            if (
                assign.assessmentType ===
                'trac_nghiem'
            ) {
                mcText +=
                    `\n=> 🎯 CHẤM ĐIỂM TỰ ĐỘNG: ` +
                    `${autoScore} / ` +
                    `${activeQuestions.length} ` +
                    `(Đạt ${scale10} / 10 điểm)`;

                finalCalculatedGrade =
                    scale10;
            } else if (
                assign.assessmentType ===
                'ket_hop' ||
                assign.assessmentType ===
                'thi'
            ) {
                const weight =
                    assign.mcWeight || 5;

                const weightedScore =
                    Math.round(
                        (
                            (
                                autoScore /
                                activeQuestions.length
                            ) *
                            weight
                        ) *
                        100
                    ) / 100;

                mcText +=
                    `\n=> 🎯 CHẤM TỰ ĐỘNG ` +
                    `PHẦN TRẮC NGHIỆM: ` +
                    `${autoScore} / ` +
                    `${activeQuestions.length} ` +
                    `(Đạt ${weightedScore} / ` +
                    `${weight} điểm)`;

                if (
                    assign.assessmentType ===
                    'thi' &&
                    Number(
                        assign.essayWeight || 0
                    ) === 0
                ) {
                    finalCalculatedGrade =
                        scale10;
                }
            }
        }
    }

    let answer = '';
    let filesArray = null;
    let isEssayMissing = false; // <--- KHAI BÁO BIẾN Ở ĐÂY ĐỂ DÙNG CHUNG CHO TOÀN BỘ HÀM

    // --- BẮT ĐẦU ĐOẠN ĐÃ FIX LỖI ---
    // 1. Thêm assign.assessmentType === 'thi' vào điều kiện để chịu đọc file khi thi
    if (assign.assessmentType === 'tu_luan' || assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi' || !assign.assessmentType) {
        const answerEl = document.getElementById(`answer-${assignId}`);
        if (answerEl) {
            const qlEditor = answerEl.querySelector('.ql-editor');
            answer = qlEditor ? qlEditor.innerHTML : answerEl.innerHTML;
        }

        // 2. Thu thập toàn diện file từ cả bộ đệm (DataTransfer) và thẻ Input thực tế
        let pendingFiles = [];

        // Luồng 1: Kéo file từ DataTransfer (nếu có)
        if (window.studentSubmitDTs && window.studentSubmitDTs[assignId] && window.studentSubmitDTs[assignId].files.length > 0) {
            pendingFiles = Array.from(window.studentSubmitDTs[assignId].files);
        }

        // Luồng 2: Kéo thêm file trực tiếp từ input DOM (phòng hờ DataTransfer bị hụt thao tác)
        const fileInput = document.getElementById(`studentFile-${assignId}`);
        if (fileInput && fileInput.files.length > 0) {
            const inputFiles = Array.from(fileInput.files);
            inputFiles.forEach(inFile => {
                // Chống trùng lặp file (kiểm tra theo tên và kích thước)
                const isDuplicate = pendingFiles.some(pFile => pFile.name === inFile.name && pFile.size === inFile.size);
                if (!isDuplicate) {
                    pendingFiles.push(inFile);
                }
            });
        }

        // Đọc tất cả file đã thu thập được
        if (pendingFiles.length > 0) {
            filesArray = await readMultipleFiles(pendingFiles);
            if (filesArray.length === 0) return;
        }

        let hasOldFile = mySub && mySub.file;

        // === BẮT ĐẦU ÁP DỤNG QUY CHẾ CHẤM ĐIỂM MỚI ===
        isEssayMissing = false; // <--- ĐÃ BỎ CHỮ 'let'
        let wordCount = answer ? answer.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
        let hasAttachedFile = (filesArray && filesArray.length > 0) || hasOldFile;

        // Trắc nghiệm 100% thì không áp dụng quy chế tự luận
        if (assign.assessmentType !== 'trac_nghiem') {
            if (assign.hideEssayText) {
                if (!hasAttachedFile) isEssayMissing = true;
            } else {
                // Yêu cầu ≥ 25 từ HOẶC có đính kèm file
                if (wordCount < 25 && !hasAttachedFile) isEssayMissing = true;
            }
        }

        // Cảnh báo học sinh nếu thiếu tự luận mà vẫn cố tình nộp
        if (!isAuto && !isCheat && isEssayMissing && assign.assessmentType !== 'trac_nghiem') {
            const confirmMsg = assign.hideEssayText
                ? "⚠️ CẢNH BÁO QUY CHẾ: Bạn chưa đính kèm tệp bài làm!\nTheo quy định, phần tự luận sẽ không được công nhận và nhận 0 điểm. Bạn có chắc chắn muốn nộp bài?"
                : `⚠️ CẢNH BÁO QUY CHẾ: Bài làm của bạn chỉ có ${wordCount} từ (yêu cầu ≥ 25 từ) và không đính kèm file!\nTheo quy định, phần tự luận sẽ không được công nhận và nhận 0 điểm. Bạn có chắc chắn muốn nộp bài?`;

            if (!confirm(confirmMsg)) {
                // Mở khóa lại nút bấm để học sinh có thể làm tiếp
                const btn = document.getElementById(`btn-submit-${assignId}`);
                if (btn) {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.innerText = 'Nộp bài tập ngay';
                }
                return;
            }
        }

        // Ép điểm = 0 cho phần tự luận nếu vi phạm quy chế
        if (isEssayMissing) {
            if (assign.assessmentType === 'tu_luan' || !assign.assessmentType) {
                finalCalculatedGrade = 0;
            } else if (assign.assessmentType === 'ket_hop' || assign.assessmentType === 'thi') {
                if (finalCalculatedGrade === null) finalCalculatedGrade = 0; // Chỉ tính điểm Trắc nghiệm
            }
        }
    }

    let finalAnswerText = "";
    if (isCheat) finalAnswerText += "🚨 [HỆ THỐNG TỰ ĐỘNG THU BÀI DO VI PHẠM QUY CHẾ - TỰ Ý THOÁT TOÀN MÀN HÌNH]\n\n";
    else if (isAuto) finalAnswerText += "⚠️ [HỆ THỐNG TỰ ĐỘNG THU BÀI DO HẾT GIỜ LÀM]\n\n";
    if (mcText) finalAnswerText += `[PHẦN TRẮC NGHIỆM]\n${mcText}\n\n`;
    if (answer) finalAnswerText += `[PHẦN TỰ LUẬN]\n${answer}`;

    const processSubmission = async (fileData) => {
        const submitNow = new Date();

        const hasNewUploadedFiles =
            Array.isArray(fileData)
                ? fileData.length > 0
                : Boolean(fileData);

        let finalFile = hasNewUploadedFiles
            ? fileData
            : null;

        /*
         * Không chọn file mới:
         * giữ nguyên file cũ như chức năng hiện tại.
         */
        if (
            !hasNewUploadedFiles &&
            mySub &&
            mySub.file &&
            !isCurrentlyRedoing
        ) {
            finalFile = mySub.file;
        }

        /*
         * File cũ sẽ được lấy từ bản ghi Firebase
         * mới nhất ngay trước khi lưu.
         */
        let replacedOldFiles = null;
        let oldFileCleanupWarning = '';

        const payload = {
            assignmentId: assign.id,
            studentUsername: currentUser.username,
            studentName: currentUser.name,
            answer: finalAnswerText || (isAuto ? "⚠️ [Hệ thống tự động thu bài - Trống]" : ""),
            rawEssay: answer,
            mcAnswers: mcAnswersObj,

            examVersionCode:
                activeExamSet.versionCode,

            examVersionIndex:
                activeExamSet.versionIndex,

            questionSnapshot:
                activeQuestions,

            questionResults:
                window.buildStudentQuestionResults(
                    activeExamSet,
                    mcAnswersObj
                ),

            grade: finalCalculatedGrade,
            submittedAt: submitNow.getTime(),
            submitTime: submitNow.toLocaleTimeString('vi-VN') + ' ' + submitNow.toLocaleDateString('vi-VN'),
            file: finalFile,
            teacherFile: null,
            isAutoSubmitted: isAuto || isCheat,
            isCheatFail: isCheat,
            isRedoing: false,
            isEssayMissing: isEssayMissing // <--- THÊM DÒNG NÀY ĐỂ LƯU VÀO DATABASE
        };

        if (mySub && mySub.isLateFail) {
            payload.isLateFail = true;
        }

        const saveLockKey =
            `submissionSaveLock_${String(assign.id)}`;

        if (window[saveLockKey]) {
            if (!isAuto) {
                alert(
                    "⏳ Bài đang được lưu, vui lòng không bấm nộp nhiều lần!"
                );
            }

            return;
        }

        window[saveLockKey] = true;

        try {
            // Đọc lại dữ liệu mới nhất ngay trước khi lưu,
            // không phụ thuộc dữ liệu đã tải từ trước.
            const latestSubmissions =
                await getDB('submissions');

            const latestSubmission =
                getPreferredStudentSubmission(
                    latestSubmissions,
                    assign,
                    currentUser.username
                );

            /*
 * Chỉ lấy file cũ để xóa khi học sinh
 * thực sự vừa upload file mới.
 */
            if (
                hasNewUploadedFiles &&
                latestSubmission &&
                latestSubmission.file
            ) {
                replacedOldFiles =
                    latestSubmission.file;
            }

            try {
                /*
                 * Bước 1: Lưu Firebase trước.
                 * Không xóa file cũ trước bước này.
                 */
                if (
                    latestSubmission &&
                    latestSubmission._fbKey
                ) {
                    await updateDB(
                        'submissions',
                        latestSubmission._fbKey,
                        payload
                    );
                } else {
                    payload.id =
                        Date.now().toString() +
                        Math.floor(
                            Math.random() * 1000
                        );

                    await pushDB(
                        'submissions',
                        payload
                    );
                }
            } catch (saveError) {
                /*
                 * File mới đã được upload lên R2 nhưng
                 * Firebase lưu thất bại.
                 *
                 * Xóa file mới để không tạo file rác.
                 * File cũ vẫn còn nguyên.
                 */
                if (hasNewUploadedFiles) {
                    try {
                        await deleteStudentSubmissionStorageFiles(
                            fileData,
                            'file mới chưa lưu được'
                        );
                    } catch (rollbackError) {
                        console.error(
                            'Không dọn được file mới sau khi lưu bài thất bại:',
                            rollbackError
                        );
                    }
                }

                throw saveError;
            }

            /*
             * Bước 2: Firebase đã trỏ tới file mới.
             * Bây giờ mới xóa file cũ trên R2.
             */
            if (
                hasNewUploadedFiles &&
                hasStudentSubmissionStorageValue(
                    replacedOldFiles
                )
            ) {
                try {
                    await deleteStudentSubmissionStorageFiles(
                        replacedOldFiles,
                        'file bài nộp cũ'
                    );
                } catch (cleanupError) {
                    /*
                     * Bài mới đã lưu thành công nên không được
                     * hoàn tác Firebase. Chỉ báo file cũ chưa
                     * xóa được để tránh làm mất bài mới.
                     */
                    console.error(
                        'Bài mới đã lưu nhưng chưa xóa được file cũ:',
                        cleanupError
                    );

                    oldFileCleanupWarning =
                        cleanupError.message;
                }
            }
        } finally {
            window[saveLockKey] = false;
        }

        // Dọn dẹp bản nháp sau khi nộp bài thành công
        if (
            assign.assessmentType === 'thi' &&
            window.examRecoveryManager
        ) {
            await window.examRecoveryManager.complete(
                assignId
            );
        } else {
            localStorage.removeItem(
                `draft_${currentUser.username}_${assignId}`
            );
        }

        // === THÊM ĐOẠN CODE DỌN DẸP DATATRANSFER VÀO ĐÂY ===
        if (window.studentSubmitDTs && window.studentSubmitDTs[assignId]) {
            delete window.studentSubmitDTs[assignId];
        }


        // Thoát chế độ thi và khôi phục pet/hiệu ứng
        if (
            window.currentActiveExamId === assignId ||
            window.isExamVisualItemsSuspended === true
        ) {
            await window.finishStudentExamMode(assignId);
        }
        // -----------------------------------------------------------
        // -----------------------------------------------------------

        if (!isAuto) {
            if (oldFileCleanupWarning) {
                alert(
                    '✅ Bài mới đã được lưu thành công.\n\n' +
                    '⚠️ Tuy nhiên file cũ chưa xóa được khỏi ' +
                    'Cloudflare R2:\n' +
                    oldFileCleanupWarning
                );
            } else {
                alert(
                    hasNewUploadedFiles &&
                        replacedOldFiles
                        ? 'Nộp bài thành công và đã xóa file cũ trên Cloudflare R2!'
                        : 'Nộp bài tập thành công!'
                );
            }
        }

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
        const targetArr = Array.isArray(mat.targetStudent) ? mat.targetStudent : [mat.targetStudent || 'all'];
        if (!targetArr.includes('all') && !targetArr.includes(currentUser.username)) {
            return; // Bỏ qua nếu học sinh không có tên trong danh sách
        }
        // ---> KẾT THÚC ĐOẠN LỌC <---

        let fileHTML = '';

        if (mat.docLink) {
            fileHTML += window.buildAttachmentPreviewHTML(
                mat.docLink,
                '📚 Link bài học',
                {
                    name: mat.title || 'Link bài học',
                    tone: 'green',
                    allowDownload: false
                }
            );
        }

        if (mat.file) {
            const materialFiles = Array.isArray(mat.file)
                ? mat.file
                : [mat.file];

            materialFiles.forEach(file => {
                fileHTML += window.buildAttachmentPreviewHTML(
                    file,
                    '📚 File bài học',
                    { tone: 'green' }
                );
            });
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

async function syncUserData(
    suppliedUserRecord = null,
    suppliedUid = null
) {
    const authUser =
        firebase.auth().currentUser;

    const uid =
        suppliedUid ||
        authUser?.uid ||
        currentUser?._fbKey;

    if (!uid) {
        return;
    }

    let userRecord = suppliedUserRecord;

    // Chỉ tải lại khi hàm không được truyền snapshot.
    if (!userRecord) {
        const snapshot = await db
            .ref(`users/${uid}`)
            .once('value');

        userRecord = snapshot.val();
    }

    if (
        !userRecord ||
        userRecord.role !== 'student'
    ) {
        await firebase.auth().signOut();
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
        return;
    }

    if (userRecord.isLocked) {
        alert(
            '🔒 Tài khoản của bạn đang bị khóa!'
        );

        await firebase.auth().signOut();
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
        return;
    }

    const normalizedUser = {
        ...userRecord,
        _fbKey: uid
    };

    Object.assign(
        currentUser,
        normalizedUser
    );

    localStorage.setItem(
        'currentUser',
        JSON.stringify(currentUser)
    );

    const studentNameEl =
        document.getElementById('studentName');

    if (studentNameEl) {
        // Không dùng innerHTML với tên người dùng.
        studentNameEl.textContent =
            currentUser.name ||
            currentUser.username ||
            'Học sinh';
    }

    loadAssignments();
    updateAvatarDisplay(currentUser.avatar);
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

window.switchTab = function (tabId, btnElement) {
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
};

// =============================================================
// NGÀY SINH HỌC SINH - CHỈ TỰ NHẬP MỘT LẦN
// =============================================================

function getCurrentStudentBirthdayProfile() {
    const profile =
        currentUser?.birthdayProfile;

    if (
        profile &&
        typeof profile === 'object'
    ) {
        return profile;
    }

    // Hỗ trợ dữ liệu cũ.
    if (currentUser?.birthDate) {
        return {
            date: String(
                currentUser.birthDate
            ),
            enteredBy: 'legacy'
        };
    }

    return null;
}

function isValidBirthdayDateInput(value) {
    const text =
        String(value || '').trim();

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(text)
    ) {
        return false;
    }

    const [year, month, day] =
        text.split('-').map(Number);

    const date =
        new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return false;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return (
        year >= 1900 &&
        date.getTime() <= today.getTime()
    );
}

function formatBirthdayDateVN(value) {
    if (
        !isValidBirthdayDateInput(value)
    ) {
        return 'Chưa cập nhật';
    }

    const [year, month, day] =
        value.split('-');

    return `${day}/${month}/${year}`;
}

window.renderStudentBirthdayProfile =
    function () {
        const profile =
            getCurrentStudentBirthdayProfile();

        const display =
            document.getElementById(
                'infoModalBirthDate'
            );

        const inputArea =
            document.getElementById(
                'studentBirthDateInputArea'
            );

        const input =
            document.getElementById(
                'studentBirthDateInput'
            );

        const saveButton =
            document.getElementById(
                'saveStudentBirthDateBtn'
            );

        const note =
            document.getElementById(
                'studentBirthDateNote'
            );

        if (
            !display ||
            !inputArea ||
            !input ||
            !saveButton
        ) {
            return;
        }

        input.max =
            new Date()
                .toISOString()
                .slice(0, 10);

        if (
            profile &&
            isValidBirthdayDateInput(
                profile.date
            )
        ) {
            display.style.display = 'block';

            display.textContent =
                `${formatBirthdayDateVN(profile.date)} · ` +
                'Đã khóa chỉnh sửa phía học sinh';

            inputArea.style.display = 'none';
            input.disabled = true;
            saveButton.disabled = true;
        } else {
            display.style.display = 'none';
            inputArea.style.display = 'block';
            input.disabled = false;
            saveButton.disabled = false;
            input.value = '';

            if (note) {
                note.textContent =
                    'Lưu ý: học sinh chỉ được tự nhập ' +
                    'ngày sinh 1 lần duy nhất. ' +
                    'Hãy kiểm tra thật kỹ trước khi lưu.';
            }
        }
    };

window.saveStudentBirthDateOnce =
    async function () {
        if (currentUser.isLocked) {
            return alert(
                '🔒 Tài khoản đang bị khóa!'
            );
        }

        if (
            getCurrentStudentBirthdayProfile()
        ) {
            window
                .renderStudentBirthdayProfile();

            return alert(
                '🎂 Ngày sinh đã được lưu trước đó. ' +
                'Học sinh không thể sửa lại.'
            );
        }

        const input =
            document.getElementById(
                'studentBirthDateInput'
            );

        const saveButton =
            document.getElementById(
                'saveStudentBirthDateBtn'
            );

        const birthDate =
            String(input?.value || '').trim();

        if (
            !isValidBirthdayDateInput(
                birthDate
            )
        ) {
            return alert(
                '🎂 Ngày sinh không hợp lệ, ' +
                'nằm trong tương lai hoặc trước năm 1900!'
            );
        }

        const formatted =
            formatBirthdayDateVN(birthDate);

        if (
            !confirm(
                `Bạn xác nhận ngày sinh là ${formatted}?\n\n` +
                'Học sinh chỉ được tự nhập đúng 1 lần ' +
                'và không thể sửa lại.'
            )
        ) {
            return;
        }

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent =
                '⏳ Đang lưu...';
        }

        try {
            const uid =
                firebase.auth().currentUser?.uid ||
                currentUser._fbKey;

            if (!uid) {
                throw new Error(
                    'Không xác định được UID học sinh.'
                );
            }

            const profileRef = db.ref(
                `users/${uid}/birthdayProfile`
            );

            const transaction =
                await profileRef.transaction(
                    current => {
                        // Đã tồn tại thì hủy.
                        if (current !== null) {
                            return;
                        }

                        return {
                            date: birthDate,
                            enteredBy: 'student',
                            enteredAt:
                                firebase.database
                                    .ServerValue
                                    .TIMESTAMP
                        };
                    }
                );

            if (!transaction.committed) {
                throw new Error(
                    'BIRTHDAY_ALREADY_EXISTS'
                );
            }

            currentUser.birthdayProfile =
                transaction.snapshot.val() || {
                    date: birthDate,
                    enteredBy: 'student',
                    enteredAt: Date.now()
                };

            localStorage.setItem(
                'currentUser',
                JSON.stringify(currentUser)
            );

            window
                .renderStudentBirthdayProfile();

            alert(
                `✅ Đã lưu ngày sinh ${formatted}.\n` +
                'Đến đúng ngày sinh, hệ thống sẽ gửi ' +
                '1 Xu Sinh Nhật của năm đó qua Hộp thư.'
            );
        } catch (error) {
            console.error(
                'Lỗi lưu ngày sinh:',
                error
            );

            if (
                error.message ===
                'BIRTHDAY_ALREADY_EXISTS' ||
                error.code ===
                'PERMISSION_DENIED'
            ) {
                alert(
                    '🎂 Ngày sinh đã được lưu trước đó ' +
                    'hoặc tài khoản không còn quyền tự sửa.'
                );
            } else {
                alert(
                    '❌ Không lưu được ngày sinh: ' +
                    (
                        error.message ||
                        'lỗi không xác định'
                    )
                );
            }
        } finally {
            if (
                saveButton &&
                !getCurrentStudentBirthdayProfile()
            ) {
                saveButton.disabled = false;
                saveButton.textContent =
                    '🎁 Lưu ngày sinh';
            }
        }
    };

window.openStudentInfoModal = function () {
    if (window.currentActiveExamId) {
        window.showExamLockWarning(
            "⚠️ Hồ sơ cá nhân tạm khóa khi thi!"
        );
        return;
    }

    const modal = document.getElementById(
        "studentInfoModal"
    );

    const avatarPreview = document.getElementById(
        "modalAvatarPreview"
    );

    const saveAvatarBtn = document.getElementById(
        "saveAvatarBtn"
    );

    const nameElement = document.getElementById(
        "infoModalName"
    );

    const classElement = document.getElementById(
        "infoModalClass"
    );

    const hobbiesElement = document.getElementById(
        "infoModalHobbies"
    );

    const mottoElement = document.getElementById(
        "infoModalMotto"
    );

    if (
        !modal ||
        !avatarPreview ||
        !saveAvatarBtn
    ) {
        console.error(
            "Không tìm thấy giao diện hồ sơ học sinh."
        );
        return;
    }

    /*
     * Avatar mặc định có biểu tượng người dùng.
     * Không dùng ảnh PNG trong suốt 1x1 nữa.
     */
    const defaultAvatarSVG = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="200"
            height="200"
            viewBox="0 0 200 200"
        >
            <defs>
                <linearGradient
                    id="avatarBackground"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop
                        offset="0%"
                        stop-color="#eef2ff"
                    />

                    <stop
                        offset="100%"
                        stop-color="#ede9fe"
                    />
                </linearGradient>
            </defs>

            <rect
                width="200"
                height="200"
                rx="100"
                fill="url(#avatarBackground)"
            />

            <circle
                cx="100"
                cy="73"
                r="34"
                fill="#818cf8"
            />

            <path
                d="M42 172c5-38 27-57 58-57s53 19 58 57"
                fill="#818cf8"
            />
        </svg>
    `;

    const defaultAvatar =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(defaultAvatarSVG);

    const savedAvatar =
        typeof currentUser.avatar === "string"
            ? currentUser.avatar.trim()
            : "";

    const hasValidAvatar =
        savedAvatar.startsWith("data:image/") ||
        savedAvatar.startsWith("https://") ||
        savedAvatar.startsWith("http://") ||
        savedAvatar.startsWith("blob:");

    avatarPreview.src =
        hasValidAvatar
            ? savedAvatar
            : defaultAvatar;

    avatarPreview.onerror = function () {
        this.onerror = null;
        this.src = defaultAvatar;
    };

    saveAvatarBtn.style.display = "none";

    if (nameElement) {
        nameElement.textContent =
            currentUser.name ||
            "Chưa cập nhật";
    }

    if (classElement) {
        classElement.textContent =
            "Lớp: " +
            (
                currentUser.classInfo ||
                "Chưa cập nhật"
            );
    }

    if (hobbiesElement) {
        hobbiesElement.textContent =
            currentUser.hobbies ||
            "Chưa cập nhật";
    }

    if (mottoElement) {
        mottoElement.textContent =
            currentUser.motto ||
            "Chưa cập nhật";
    }

    window.renderStudentBirthdayProfile();
    modal.classList.add("active");
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

    // FIX: Thêm dòng rào chắn này để ngăn JS bị sập nếu không tìm thấy thẻ HTML
    if (!avatarImg || !avatarPlaceholder || !triggerBtn) return;

    if (
        avatarData &&
        (
            avatarData.startsWith(
                'data:image'
            ) ||
            avatarData.startsWith(
                'https://'
            ) ||
            avatarData.startsWith(
                'http://'
            )
        )
    ) {
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
let selectedAvatarFile = null;
let selectedAvatarPreviewUrl = '';

window.previewAvatar = function (input) {
    if (
        !input.files ||
        !input.files[0]
    ) {
        return;
    }

    const file =
        input.files[0];

    if (
        !file.type.startsWith(
            'image/'
        )
    ) {
        alert(
            'Vui lòng chọn đúng file ảnh!'
        );

        input.value = '';

        return;
    }

    if (
        file.size >
        1024 * 1024
    ) {
        alert(
            'Ảnh quá lớn! ' +
            'Vui lòng chọn ảnh nhỏ hơn 1 MB.'
        );

        input.value = '';

        return;
    }

    if (selectedAvatarPreviewUrl) {
        URL.revokeObjectURL(
            selectedAvatarPreviewUrl
        );
    }

    /*
     * URL tạm chỉ dùng để xem trước.
     * Không lưu URL blob vào Firebase.
     */
    selectedAvatarPreviewUrl =
        URL.createObjectURL(file);

    selectedAvatarFile =
        file;

    const preview =
        document.getElementById(
            'modalAvatarPreview'
        );

    if (preview) {
        preview.src =
            selectedAvatarPreviewUrl;
    }

    const saveButton =
        document.getElementById(
            'saveAvatarBtn'
        );

    if (saveButton) {
        saveButton.style.display =
            'block';
    }
};

window.saveNewAvatar = async function () {
    if (!selectedAvatarFile) {
        return;
    }

    const cornerImg =
        document.getElementById(
            'avatarImage'
        );

    if (cornerImg) {
        cornerImg.classList.add(
            'loading'
        );
    }

    try {
        const uploaded =
            await window
                .CloudinaryStorage
                .uploadFile(
                    selectedAvatarFile,
                    {
                        maxSizeBytes:
                            1024 * 1024
                    }
                );

        /*
         * Chỉ lưu URL, không lưu Base64.
         */
        const userKey =
            firebase.auth().currentUser?.uid ||
            currentUser._fbKey;

        if (!userKey) {
            throw new Error(
                'Không xác định được UID học sinh.'
            );
        }

        const avatarUpdates = {};

        avatarUpdates[
            `users/${userKey}/avatar`
        ] = uploaded.url;

        avatarUpdates[
            `users/${userKey}/avatarStorage`
        ] = uploaded;

        await db.ref().update(avatarUpdates);

        currentUser.avatar =
            uploaded.url;

        currentUser.avatarStorage =
            uploaded;

        localStorage.setItem(
            'currentUser',
            JSON.stringify(
                currentUser
            )
        );

        updateAvatarDisplay(
            uploaded.url
        );

        const saveButton =
            document.getElementById(
                'saveAvatarBtn'
            );

        if (saveButton) {
            saveButton.style.display =
                'none';
        }

        selectedAvatarFile = null;

        if (
            selectedAvatarPreviewUrl
        ) {
            URL.revokeObjectURL(
                selectedAvatarPreviewUrl
            );

            selectedAvatarPreviewUrl =
                '';
        }

        alert(
            'Đã cập nhật ảnh đại diện thành công! 🎉'
        );
    } catch (error) {
        console.error(error);

        alert(
            `❌ Không tải được ảnh đại diện: ` +
            `${error.message}`
        );
    } finally {
        if (cornerImg) {
            cornerImg.classList.remove(
                'loading'
            );
        }
    }
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
    const mySchedules = schedules.filter(s => {
        const targetArr = Array.isArray(s.targetStudent) ? s.targetStudent : [s.targetStudent || 'all'];
        return targetArr.includes('all') || targetArr.includes(currentUser.username);
    });

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

async function readMultipleFiles(
    files,
    options = {}
) {
    if (
        !window.CloudflareR2Storage ||
        typeof window.CloudflareR2Storage.uploadFiles !== 'function'
    ) {
        alert(
            'Không tìm thấy cloudflare-r2-storage.js!'
        );

        return [];
    }

    return window.CloudflareR2Storage.uploadFiles(
        files,
        {
            maxSizeBytes: 10 * 1024 * 1024,

            audioMaxSizeBytes:
                30 * 1024 * 1024,

            folder: options.folder || 'submissions'
        }
    );
}

// THAY THẾ TOÀN BỘ HÀM spinWheel CŨ Ở CUỐI FILE STUDENT.JS BẰNG ĐOẠN NÀY
// ================= HỆ THỐNG VÒNG QUAY MAY MẮN =================
let isSpinning = false;

// ======================================================
// GIỜ VÀNG VÒNG QUAY MAY MẮN
// - Chỉ tăng phần thưởng Coin.
// - Không đổi tỉ lệ trúng, vé quay hoặc vật phẩm.
// - Mỗi lượt trúng Coin trong Giờ Vàng được cộng thêm 50 Coin.
// - Thời gian tính theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
// ======================================================
const LUCKY_WHEEL_GOLDEN_HOUR_BONUS = 50;

const LUCKY_WHEEL_GOLDEN_WINDOWS = Object.freeze([
    { start: 0, end: 60, label: '00:00 - 01:00' },
    { start: 9 * 60, end: 10 * 60, label: '09:00 - 10:00' },
    { start: 12 * 60, end: 13 * 60, label: '12:00 - 13:00' },
    { start: 14 * 60, end: 15 * 60, label: '14:00 - 15:00' },
    { start: 20 * 60, end: 20 * 60 + 30, label: '20:00 - 20:30' }
]);

function getLuckyWheelVietnamClock(date = new Date()) {
    const parts = new Intl.DateTimeFormat(
        'en-GB',
        {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        }
    ).formatToParts(date);

    const values = {};

    parts.forEach(part => {
        if (part.type !== 'literal') {
            values[part.type] = Number(part.value);
        }
    });

    const hour = Number(values.hour) || 0;
    const minute = Number(values.minute) || 0;
    const second = Number(values.second) || 0;

    return {
        hour,
        minute,
        second,
        totalMinutes:
            hour * 60 +
            minute +
            second / 60
    };
}

function getLuckyWheelGoldenHourStatus(date = new Date()) {
    const clock = getLuckyWheelVietnamClock(date);

    const activeWindow =
        LUCKY_WHEEL_GOLDEN_WINDOWS.find(windowConfig =>
            clock.totalMinutes >= windowConfig.start &&
            clock.totalMinutes < windowConfig.end
        ) || null;

    return {
        active: Boolean(activeWindow),
        bonus: activeWindow
            ? LUCKY_WHEEL_GOLDEN_HOUR_BONUS
            : 0,
        windowLabel: activeWindow?.label || '',
        clock
    };
}

window.getLuckyWheelGoldenHourStatus =
    getLuckyWheelGoldenHourStatus;

function renderLuckyWheelGoldenHourNotice() {
    const modal =
        document.getElementById('luckyWheelModal');

    if (!modal) return;

    const title =
        modal.querySelector('h3');

    if (!title) return;

    let notice =
        document.getElementById(
            'luckyWheelGoldenHourNotice'
        );

    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'luckyWheelGoldenHourNotice';

        title.insertAdjacentElement(
            'afterend',
            notice
        );
    }

    const status =
        getLuckyWheelGoldenHourStatus();

    notice.style.cssText = status.active
        ? `
            margin: 10px auto 12px;
            max-width: 520px;
            padding: 10px 14px;
            border: 1px solid rgba(255, 215, 0, .75);
            border-radius: 12px;
            background: linear-gradient(
                135deg,
                rgba(255, 111, 0, .22),
                rgba(255, 215, 0, .18)
            );
            box-shadow: 0 0 18px rgba(255, 193, 7, .22);
            color: #ffd700;
            font-size: .9em;
            font-weight: 800;
            line-height: 1.45;
            text-align: center;
        `
        : `
            margin: 10px auto 12px;
            max-width: 520px;
            padding: 9px 12px;
            border: 1px solid rgba(255,255,255,.16);
            border-radius: 12px;
            background: rgba(255,255,255,.06);
            color: rgba(255,255,255,.78);
            font-size: .82em;
            font-weight: 600;
            line-height: 1.45;
            text-align: center;
        `;

    notice.innerHTML = status.active
        ? `
            🔥 <strong>GIỜ VÀNG ĐANG DIỄN RA</strong><br>
            Trúng Coin được cộng thêm
            <strong>+${LUCKY_WHEEL_GOLDEN_HOUR_BONUS} Coin</strong>
            mỗi lượt · ${status.windowLabel}
        `
        : `
            🕒 Giờ Vàng:
            00:00–01:00 · 09:00–10:00 ·
            12:00–13:00 · 14:00–15:00 ·
            20:00–20:30<br>
            Trong Giờ Vàng:
            <strong>+${LUCKY_WHEEL_GOLDEN_HOUR_BONUS} Coin</strong>
            cho mỗi lượt trúng Coin
        `;
}

window.renderLuckyWheelGoldenHourNotice =
    renderLuckyWheelGoldenHourNotice;

// HÀM DÙNG CHUNG: Tính vé chính xác (Vé từ điểm + Vé quà tặng - Số lần đã quay)
window.calculateTotalTickets = async function () {
    const submissions = await getDB('submissions');
    const mySubs = submissions.filter(sub =>
        getStudentCompatSubmissionUsername(sub) ===
        String(currentUser.username).trim() &&
        sub.grade !== null &&
        sub.grade !== undefined &&
        sub.grade !== ''
    );

    let currentGradeTickets = 0;
    // 1. Tính vé cơ bản theo điểm
    mySubs.forEach(sub => {
        let score = parseFloat(sub.grade);
        let subTickets = 0;
        if (score === 10) subTickets = 3;
        else if (score > 7) subTickets = 2;
        else if (score > 5) subTickets = 1;

        if (sub.hasRedone && subTickets > 0) subTickets -= 1;
        currentGradeTickets += subTickets;
    });

    // --- BẮT ĐẦU FIX LỖI GIÁO VIÊN XÓA BÀI LÀM MẤT VÉ ---
    const histSnap = await db.ref('historical_grade_tickets/' + currentUser.username).once('value');
    let historicalGradeTickets = parseInt(histSnap.val()) || 0;

    const bonusRef = db.ref('student_bonus_tickets/' + currentUser.username);
    const bonusSnap = await bonusRef.once('value');
    let bonusTickets = parseInt(bonusSnap.val()) || 0;

    if (
        currentGradeTickets >
        historicalGradeTickets
    ) {
        /*
         * Chỉ ghi số vé tăng thêm,
         * không ghi lại toàn bộ mỗi lần mở game.
         */
        const earnedTickets =
            currentGradeTickets -
            historicalGradeTickets;

        await db
            .ref(
                'historical_grade_tickets/' +
                currentUser.username
            )
            .set(
                currentGradeTickets
            );

        if (
            earnedTickets > 0 &&
            window.TransactionHistory
        ) {
            await window
                .TransactionHistory
                .recordSafe({
                    type:
                        'grade_ticket_reward',

                    summary:
                        `Nhận thêm ${earnedTickets} ` +
                        `Vé quay từ điểm bài tập`,

                    source:
                        'grade_score',

                    targetUsername:
                        currentUser.username,

                    targetName:
                        currentUser.name ||
                        currentUser.username,

                    amount:
                        earnedTickets,

                    unit:
                        'Vé',

                    reversible:
                        false,

                    nonReversibleReason:
                        'Vé được tự động tính từ điểm bài tập.',

                    details: {
                        previousGradeTickets:
                            historicalGradeTickets,

                        currentGradeTickets:
                            currentGradeTickets,

                        earnedTickets:
                            earnedTickets,

                        qualifyingSubmissionCount:
                            mySubs.length
                    }
                });
        }
    } else if (currentGradeTickets < historicalGradeTickets) {
        // CÓ BÀI BỊ XÓA -> Tổng vé bị sụt giảm
        // Bù đắp số vé bị mất này thẳng vào Bonus Tickets để giữ nguyên tổng số vé
        let lostTickets = historicalGradeTickets - currentGradeTickets;
        bonusTickets += lostTickets;
        await bonusRef.set(bonusTickets);

        if (
            lostTickets > 0 &&
            window.TransactionHistory
        ) {
            await window
                .TransactionHistory
                .recordSafe({
                    type:
                        'grade_ticket_reward',

                    summary:
                        `Nhận bù ${lostTickets} Vé ` +
                        `do dữ liệu bài nộp bị giảm`,

                    source:
                        'deleted_submission_compensation',

                    targetUsername:
                        currentUser.username,

                    targetName:
                        currentUser.name ||
                        currentUser.username,

                    amount:
                        lostTickets,

                    unit:
                        'Vé',

                    reversible:
                        false,

                    nonReversibleReason:
                        'Đây là vé bù để bảo toàn tổng vé đã nhận.',

                    details: {
                        previousGradeTickets:
                            historicalGradeTickets,

                        currentGradeTickets:
                            currentGradeTickets,

                        lostTickets:
                            lostTickets
                    }
                });
        }

        // Reset lại mốc lịch sử xuống bằng hiện tại để không bị cộng bù lần 2
        await db.ref('historical_grade_tickets/' + currentUser.username).set(currentGradeTickets);
    }
    // --- KẾT THÚC FIX LỖI ---

    let totalTickets = currentGradeTickets + bonusTickets;

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

// ================= CHỨC NĂNG MUA VÉ MAY MẮN =================
// Hàm hỗ trợ tính mốc đầu tuần (Thứ 2) để reset lượt mua
function getTicketStartOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek.getTime();
}

// Render nút mua vé trên giao diện
window.renderBuyTicketButton = async function () {
    const container = document.getElementById('buyTicketContainer');
    if (!container) return;

    const startOfWeek = getTicketStartOfWeek();
    const snap = await db.ref(`ticket_purchases/${currentUser.username}`).once('value');
    let purchaseData = snap.val() || { count: 0, weekStart: 0 };

    if (purchaseData.weekStart !== startOfWeek) {
        purchaseData = { count: 0, weekStart: startOfWeek };
    }

    let remainingBuys = 5 - purchaseData.count;

    // Tăng margin-bottom từ 15px lên 30px để tạo khoảng cách thoáng hơn với vòng quay
    const activeStyle = `
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); 
        color: white; 
        border: none; 
        padding: 10px 25px; 
        border-radius: 25px; 
        font-weight: bold; 
        cursor: pointer; 
        box-shadow: 0 4px 15px rgba(246, 211, 101, 0.3); 
        font-size: 0.9em; 
        transition: transform 0.2s, box-shadow 0.2s;
        margin-bottom: 30px; 
        display: inline-block;
    `;

    const disabledStyle = `
        background: rgba(255, 255, 255, 0.1); 
        color: rgba(255, 255, 255, 0.4); 
        border: 1px solid rgba(255, 255, 255, 0.1); 
        padding: 10px 25px; 
        border-radius: 25px; 
        font-size: 0.9em; 
        margin-bottom: 30px;
        cursor: not-allowed;
        display: inline-block;
    `;

    if (remainingBuys > 0) {
        container.innerHTML = `
            <button onclick="buyLuckyTicket()" style="${activeStyle}" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(246, 211, 101, 0.5)'" 
                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(246, 211, 101, 0.3)'">
                🛒 Mua vé (4 Coin) - Còn ${remainingBuys}/5 lượt
            </button>`;
    } else {
        container.innerHTML = `
            <button disabled style="${disabledStyle}">
                🛒 Đã hết lượt mua tuần này
            </button>`;
    }
};

// Logic xử lý trừ tiền và cộng vé
window.buyLuckyTicket = async function () {
    if (window.isOffline || !navigator.onLine) {
        alert("❌ Mất kết nối mạng! Vui lòng kiểm tra lại đường truyền internet trước khi thực hiện giao dịch.");
        return;
    }

    if (!confirm("Bạn có chắc chắn muốn dùng 4 Coin để mua 1 Vé quay may mắn không?")) return;

    const username = currentUser.username;
    const startOfWeek = getTicketStartOfWeek();

    const purchaseRef = db.ref(`ticket_purchases/${username}`);
    const coinPath = `student_coins/${username}`;
    const bonusTicketPath = `student_bonus_tickets/${username}`;

    let purchaseCountCommitted = false;
    let coinDebited = false;
    let bonusTicketAdded = false;

    try {
        // 1. Transaction giới hạn mua tối đa 5 vé/tuần
        const purchaseTx = await purchaseRef.transaction(current => {
            let data = current || { count: 0, weekStart: startOfWeek };

            if (data.weekStart !== startOfWeek) {
                data = { count: 0, weekStart: startOfWeek };
            }

            if ((data.count || 0) >= 5) {
                return; // abort
            }

            return {
                weekStart: startOfWeek,
                count: (data.count || 0) + 1
            };
        });

        if (!purchaseTx.committed) {
            return alert("⚠️ Bạn đã mua tối đa 5 vé trong tuần này. Hãy quay lại vào tuần sau nhé!");
        }

        purchaseCountCommitted = true;

        // 2. Transaction trừ coin theo số mới nhất trên server
        await decrementNumberTx(coinPath, 4);
        coinDebited = true;

        // 3. Transaction cộng vé
        await incrementNumberTx(bonusTicketPath, 1);
        bonusTicketAdded = true;

        if (typeof window.showToast === 'function') {
            window.showToast("🎉 Mua vé thành công! Đã trừ 4 Coin.", "success");
        } else {
            alert("🎉 Mua vé thành công! Đã trừ 4 Coin.");
        }

        await renderBuyTicketButton();

        const ticketData = await window.calculateTotalTickets();
        const titleWheel = document.querySelector('#luckyWheelModal h3');
        if (titleWheel) {
            titleWheel.innerHTML = `🎡 Vòng Quay Nhân Phẩm<br><span style="font-size: 0.5em; color: #ffd700; text-transform: none;">🎫 Vé hiện có: ${ticketData.remaining}</span>`;
        }

        const quickSpinBtn = document.getElementById('quickSpinBtn');
        if (quickSpinBtn) {
            quickSpinBtn.style.display = ticketData.remaining > 1 ? 'block' : 'none';
        }

    } catch (e) {
        console.error(e);

        // Rollback tốt nhất có thể nếu lỗi xảy ra giữa chừng
        if (coinDebited && !bonusTicketAdded) {
            await rollbackIncrement(coinPath, 4);
        }

        if (purchaseCountCommitted && !bonusTicketAdded) {
            await purchaseRef.transaction(current => {
                if (!current || current.weekStart !== startOfWeek) return current;
                return {
                    weekStart: current.weekStart,
                    count: Math.max(0, (current.count || 0) - 1)
                };
            });
        }

        if (e.message === 'INSUFFICIENT_BALANCE') {
            alert("❌ Bạn không đủ Coin! Cần 4 Coin để mua 1 vé.");
        } else {
            alert("❌ Giao dịch thất bại. Hệ thống đã cố gắng hoàn tác thao tác.");
        }
    }
};

// CẬP NHẬT GIAO DIỆN MỞ VÒNG QUAY ĐỂ CHÈN NÚT MUA
window.openLuckyWheel = async function () {
    if (window.isGameEnabled === false) {
        alert("🔒 Trò chơi hiện đang bị Giáo viên tạm khóa!");
        return;
    }

    const ticketData = await window.calculateTotalTickets();

    // Cập nhật trạng thái Giờ Vàng mỗi lần mở vòng quay.
    renderLuckyWheelGoldenHourNotice();

    const titleWheel = document.querySelector('#luckyWheelModal h3');
    if (titleWheel) {
        titleWheel.innerHTML = `🎡 Vòng Quay Nhân Phẩm<br><span style="font-size: 0.5em; color: #ffd700; text-transform: none;">🎫 Vé hiện có: ${ticketData.remaining}</span>`;

        // --- CHÈN KHU VỰC MUA VÉ ---
        let buyBtnContainer = document.getElementById('buyTicketContainer');
        if (!buyBtnContainer) {
            buyBtnContainer = document.createElement('div');
            buyBtnContainer.id = 'buyTicketContainer';
            buyBtnContainer.style.textAlign = 'center';
            // Chèn ngay bên dưới cái tiêu đề h3
            titleWheel.parentNode.insertBefore(buyBtnContainer, titleWheel.nextSibling);
        }
        await renderBuyTicketButton();
        // ---------------------------
    }

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

    // Chốt Giờ Vàng ngay tại thời điểm bắt đầu quay.
    // Animation kết thúc sau giờ vẫn giữ đúng quyền lợi của lượt đã bấm.
    const goldenHourAtSpin =
        getLuckyWheelGoldenHourStatus();

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
    else if (rand < (cumulative += p.c100)) { targetSlice = 1; finalRewardStr = "50 Coin"; }
    else if (rand < (cumulative += p.c150)) { targetSlice = 3; finalRewardStr = "70 Coin"; }
    else if (rand < (cumulative += p.c500)) { targetSlice = 5; finalRewardStr = "200 Coin"; }
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
        let wonItem = null;

        // Xử lý kết quả quay
        if (finalRewardStr === "50 Coin") wonCoins = 50;
        else if (finalRewardStr === "70 Coin") wonCoins = 70;
        else if (finalRewardStr === "200 Coin") wonCoins = 200;
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
                    await db
                        .ref(
                            `student_inventory/` +
                            `${currentUser.username}/` +
                            `${randomItem.id}`
                        )
                        .update({
                            id:
                                randomItem.id,

                            purchaseTime:
                                Date.now(),

                            source:
                                'lucky_wheel',

                            isTrial:
                                null,

                            trialExpiry:
                                null,

                            isEquipped:
                                false
                        });

                    wonItem =
                        randomItem;
                    displayResult = `Vật phẩm: ${randomItem.name}`;
                    actualRewardRecord = `Vật phẩm: ${randomItem.name}`;
                }
            } else {
                wonCoins = 600; displayResult = `600 Coin (Bí ẩn)`; actualRewardRecord = `600 Coin (Bí ẩn)`;
            }
        }

        // GIỜ VÀNG:
        // Nếu lượt này nhận Coin thì cộng thêm đúng 50 Coin.
        // Vật phẩm thật không bị chuyển đổi và không nhận bonus.
        const baseWonCoins = wonCoins;
        const goldenHourBonus =
            wonCoins > 0 &&
                goldenHourAtSpin.active
                ? LUCKY_WHEEL_GOLDEN_HOUR_BONUS
                : 0;

        if (goldenHourBonus > 0) {
            wonCoins += goldenHourBonus;

            if (
                finalRewardStr === '50 Coin' ||
                finalRewardStr === '70 Coin' ||
                finalRewardStr === '200 Coin'
            ) {
                displayResult =
                    `${wonCoins} Coin ` +
                    `(Gốc ${baseWonCoins} + ` +
                    `Giờ Vàng ${goldenHourBonus})`;

                actualRewardRecord =
                    `${wonCoins} Coin ` +
                    `(Gốc ${baseWonCoins} + ` +
                    `Giờ Vàng ${goldenHourBonus})`;
            } else {
                displayResult +=
                    ` + Giờ Vàng ${goldenHourBonus} Coin`;

                actualRewardRecord +=
                    ` + Giờ Vàng ${goldenHourBonus} Coin`;
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
            await coinRef.transaction(
                currentCoins => {
                    return (
                        Number(currentCoins) ||
                        0
                    ) + wonCoins;
                }
            );
        }

        if (
            window.TransactionHistory &&
            (
                wonCoins > 0 ||
                wonItem
            )
        ) {
            const rewardDescription =
                wonItem
                    ? `vật phẩm ${wonItem.name}`
                    : `${wonCoins.toLocaleString('vi-VN')} Coin`;

            await window
                .TransactionHistory
                .recordSafe({
                    type:
                        'game_reward',

                    summary:
                        `Nhận ${rewardDescription} ` +
                        `từ Vòng Quay Nhân Phẩm`,

                    source:
                        'lucky_wheel',

                    targetUsername:
                        currentUser.username,

                    targetName:
                        currentUser.name ||
                        currentUser.username,

                    amount:
                        wonCoins > 0
                            ? wonCoins
                            : null,

                    unit:
                        wonCoins > 0
                            ? 'Coin'
                            : '',

                    reversible:
                        false,

                    nonReversibleReason:
                        'Phần thưởng ngẫu nhiên từ trò chơi.',

                    details: {
                        game:
                            'lucky_wheel',

                        spins:
                            1,

                        ticketsUsed:
                            1,

                        reward:
                            actualRewardRecord,

                        wonCoins:
                            wonCoins,

                        baseWonCoins:
                            baseWonCoins,

                        goldenHour:
                            goldenHourAtSpin.active,

                        goldenHourWindow:
                            goldenHourAtSpin.windowLabel,

                        goldenHourBonus:
                            goldenHourBonus,

                        itemId:
                            wonItem?.id ||
                            '',

                        itemName:
                            wonItem?.name ||
                            ''
                    }
                });
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

    // Toàn bộ lượt trong một lần Quay Nhanh dùng trạng thái
    // Giờ Vàng tại thời điểm người dùng bấm bắt đầu.
    const goldenHourAtMultiSpin =
        getLuckyWheelGoldenHourStatus();

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
    resultText.innerText =
        goldenHourAtMultiSpin.active
            ? `🔥 GIỜ VÀNG +${LUCKY_WHEEL_GOLDEN_HOUR_BONUS} Coin/lượt trúng Coin · Đang quay ${spinsToDo} lần...`
            : `⚡ Đang xử lý quay ${spinsToDo} lần... 🌀`;

    // Chạy ngầm thuật toán quay y hệt hàm spinWheel gốc
    const cotichItems = (typeof StoreConfig !== 'undefined') ? StoreConfig.items.filter(i => i.tag && i.tag.toLowerCase() === 'cổ tích') : [];

    // TẢI TRỰC TIẾP KHO ĐỒ TỪ DB TRƯỚC KHI BẮT ĐẦU VÒNG LẶP QUAY NHIỀU LẦN
    const invSnap = await db.ref(`student_inventory/${currentUser.username}`).once('value');
    let currentOwned = invSnap.val() ? Object.values(invSnap.val()).map(i => i.id) : [];

    let totalCoinsWon = 0;
    let baseCoinsWon = 0;
    let goldenHourBonusCoins = 0;
    let coinRewardSpinCount = 0;
    let missCount = 0;
    let newlyWonItems = [];
    let newlyWonItemNames = [];
    let duplicateItemsCount = 0;

    const addMultiWheelCoinReward = baseAmount => {
        const normalizedBase =
            Math.max(0, Number(baseAmount) || 0);

        if (normalizedBase <= 0) return;

        baseCoinsWon += normalizedBase;
        totalCoinsWon += normalizedBase;
        coinRewardSpinCount++;

        if (goldenHourAtMultiSpin.active) {
            totalCoinsWon +=
                LUCKY_WHEEL_GOLDEN_HOUR_BONUS;

            goldenHourBonusCoins +=
                LUCKY_WHEEL_GOLDEN_HOUR_BONUS;
        }
    };

    const p = window.wheelProbs || { miss: 50, c100: 20, c150: 25, c500: 4, gift: 1 };

    for (let i = 0; i < spinsToDo; i++) {
        const rand = Math.random() * 100;
        let cumulative = 0;

        if (rand < (cumulative += p.miss)) { missCount++; }
        else if (rand < (cumulative += p.c100)) { addMultiWheelCoinReward(50); }
        else if (rand < (cumulative += p.c150)) { addMultiWheelCoinReward(70); }
        else if (rand < (cumulative += p.c500)) { addMultiWheelCoinReward(200); }
        else {
            // Trúng Quà bí ẩn
            if (cotichItems.length > 0) {
                const randomItem = cotichItems[Math.floor(Math.random() * cotichItems.length)];
                if (currentOwned.includes(randomItem.id)) {
                    addMultiWheelCoinReward(600); // Đền bù 600 Coin
                    duplicateItemsCount++;
                } else {
                    currentOwned.push(randomItem.id);
                    newlyWonItems.push(randomItem);
                    newlyWonItemNames.push(randomItem.name);
                }
            } else {
                addMultiWheelCoinReward(600);
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
            updates[
                `student_inventory/` +
                `${currentUser.username}/` +
                `${item.id}`
            ] = {
                id:
                    item.id,

                purchaseTime:
                    Date.now(),

                source:
                    'lucky_wheel_multi',

                isTrial:
                    null,

                trialExpiry:
                    null,

                isEquipped:
                    false
            };
        });
        await db.ref().update(updates);
    }

    if (
        window.TransactionHistory &&
        (
            totalCoinsWon > 0 ||
            newlyWonItems.length > 0
        )
    ) {
        let rewardDescription =
            `${totalCoinsWon.toLocaleString('vi-VN')} Coin`;

        if (
            newlyWonItemNames.length > 0
        ) {
            rewardDescription +=
                ` và vật phẩm: ` +
                `${newlyWonItemNames.join(', ')}`;
        }

        await window
            .TransactionHistory
            .recordSafe({
                type:
                    'game_reward',

                summary:
                    `Quay nhanh ${spinsToDo} lần, ` +
                    `nhận ${rewardDescription}`,

                source:
                    'lucky_wheel_multi',

                targetUsername:
                    currentUser.username,

                targetName:
                    currentUser.name ||
                    currentUser.username,

                amount:
                    totalCoinsWon > 0
                        ? totalCoinsWon
                        : null,

                unit:
                    totalCoinsWon > 0
                        ? 'Coin'
                        : '',

                reversible:
                    false,

                nonReversibleReason:
                    'Kết quả được tạo ngẫu nhiên từ nhiều lượt quay.',

                details: {
                    game:
                        'lucky_wheel',

                    spins:
                        spinsToDo,

                    ticketsUsed:
                        spinsToDo,

                    missCount:
                        missCount,

                    totalCoinsWon:
                        totalCoinsWon,

                    baseCoinsWon:
                        baseCoinsWon,

                    coinRewardSpinCount:
                        coinRewardSpinCount,

                    goldenHour:
                        goldenHourAtMultiSpin.active,

                    goldenHourWindow:
                        goldenHourAtMultiSpin.windowLabel,

                    goldenHourBonusCoins:
                        goldenHourBonusCoins,

                    duplicateItemsCount:
                        duplicateItemsCount,

                    itemIds:
                        newlyWonItems.map(
                            item => item.id
                        ),

                    itemNames:
                        newlyWonItemNames
                }
            });
    }

    let historyStr =
        `Quay nhanh ${spinsToDo} lần: ` +
        `Trượt ${missCount}, +${totalCoinsWon} Coin`;

    if (goldenHourBonusCoins > 0) {
        historyStr +=
            ` (Giờ Vàng +${goldenHourBonusCoins} Coin)`;
    }
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
        const viewportWidth =
            window.visualViewport?.width || window.innerWidth;

        const viewportHeight =
            window.visualViewport?.height || window.innerHeight;

        const maxX = Math.max(
            0,
            viewportWidth - coinWidget.offsetWidth
        );

        const maxY = Math.max(
            0,
            viewportHeight - coinWidget.offsetHeight
        );

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
        if (e.type === 'touchstart' && e.touches.length !== 1) {
            return;
        }
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

        // --- BỔ SUNG KHỐI LỆNH NÀY ---
        // Nếu phát hiện người dùng chạm từ 2 ngón tay trở lên (để zoom), thì lập tức dừng lệnh kéo thả
        if (e.type === 'touchmove' && e.touches.length !== 1) {
            handleDragEnd();
            return;
        }
        // -----------------------------

        e.preventDefault(); // Ngăn trình duyệt cuộn trang khi đang kéo widget bằng 1 ngón

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
    document.addEventListener('touchcancel', handleDragEnd);

    // Sự kiện chuột trên Máy tính
    coinWidget.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
});

// ========================================================
// HỆ THỐNG KHUNG AVATAR
// ========================================================
window.AvatarFrameManager = {

    activeItemId: '',

    // Xóa toàn bộ khung hiện tại
    clearFrame() {

        document.querySelectorAll(
            '.avatar-frame-decoration,' +
            '.avatar-frame-aura,' +
            '.avatar-frame-spark'
        ).forEach(node => node.remove());

        document
            .querySelectorAll('.avatar-frame-equipped')
            .forEach(host => {

                host.classList.remove(
                    'avatar-frame-equipped',
                    'avatar-frame-profile-host',
                    'avatar-frame-modal-host',
                );

                host.removeAttribute(
                    'data-avatar-frame-effect'
                );

                host.removeAttribute(
                    'data-avatar-frame-id'
                );

            });

        this.activeItemId = '';
    },

    // Tạo một bộ khung cho một vị trí avatar
    createLayer(host, item, variant) {

        if (!host || !item || !item.value) {
            return;
        }

        host.classList.add(
            'avatar-frame-equipped',
            variant === 'profile'
                ? 'avatar-frame-profile-host'
                : 'avatar-frame-modal-host'
        );

        host.setAttribute(
            'data-avatar-frame-effect',
            String(
                item.frameEffect ||
                item.id ||
                ''
            )
        );

        host.setAttribute(
            'data-avatar-frame-id',
            String(item.id || '')
        );

        // =====================================================
        // ĐỊNH DANH KHUNG ĐANG MẶC
        // Dùng để mỗi bộ khung có CSS riêng.
        // =====================================================
        host.setAttribute(
            'data-avatar-frame-id',
            String(item.id || '')
        );

        // Quốc khánh 2/9 — Việt Diệu
        if (
            item.id ===
            'frame_quoc_khanh_viet_dieu_vong_son'
        ) {
            host.classList.add(
                'avatar-frame-viet-dieu-host'
            );
        }

        // Hào quang phía sau
        const aura =
            document.createElement('span');

        aura.className =
            'avatar-frame-aura';

        aura.setAttribute(
            'aria-hidden',
            'true'
        );

        // Ảnh khung thật
        const frame =
            document.createElement('img');

        frame.className =
            'avatar-frame-decoration';

        frame.src =
            item.value;

        frame.alt = '';

        frame.draggable =
            false;

        frame.setAttribute(
            'aria-hidden',
            'true'
        );

        frame.onerror = function () {

            this.style.display =
                'none';

            console.warn(
                'Không tải được ảnh khung:',
                item.value
            );

        };

        host.appendChild(aura);
        host.appendChild(frame);

        // Tinh quang quanh khung
        [
            'spark-1',
            'spark-2',
            'spark-3',
            'spark-4'
        ].forEach(className => {

            const spark =
                document.createElement('span');

            spark.className =
                `avatar-frame-spark ${className}`;

            spark.textContent =
                '✦';

            spark.setAttribute(
                'aria-hidden',
                'true'
            );

            host.appendChild(spark);
        });
    },

    // Mặc khung
    applyFrame(itemOrId) {

        const item =
            typeof itemOrId === 'string'
                ? StoreManager.getItemById(
                    itemOrId
                )
                : itemOrId;

        // Chỉ cho mặc 1 khung
        this.clearFrame();

        if (
            !item ||
            item.type !== 'frame' ||
            !item.value
        ) {
            return;
        }

        // Avatar nhỏ góc phải màn hình
        const profileButton =
            document.querySelector(
                '.profile-trigger-btn'
            );

        // Avatar trong popup Hồ sơ cá nhân
        const modalAvatarHost =
            document.querySelector(
                '#studentInfoModal ' +
                '.avatar-upload-container'
            );

        this.createLayer(
            profileButton,
            item,
            'profile'
        );

        this.createLayer(
            modalAvatarHost,
            item,
            'modal'
        );

        this.activeItemId =
            item.id || '';
    }
};

// ========================================================
// HỆ THỐNG NỀN WEB
// KHÔNG CÓ HIỆU ỨNG
// ========================================================
window.WebBackgroundManager = {

    activeItemId: '',

    // Tháo nền
    clearBackground() {

        const body = document.body;

        if (!body) {
            this.activeItemId = '';
            return;
        }

        // Xóa ảnh nền do vật phẩm đặt
        body.style.removeProperty(
            'background-image'
        );

        body.style.removeProperty(
            'background-size'
        );

        body.style.removeProperty(
            'background-position'
        );

        body.style.removeProperty(
            'background-repeat'
        );

        body.style.removeProperty(
            'background-attachment'
        );

        body.classList.remove(
            'store-background-equipped'
        );

        body.removeAttribute(
            'data-store-background-id'
        );

        this.activeItemId = '';
    },


    // Mặc nền
    applyBackground(itemOrId) {

        const item =
            typeof itemOrId === 'string'
                ? StoreManager.getItemById(
                    itemOrId
                )
                : itemOrId;


        // Chỉ sử dụng 1 nền
        this.clearBackground();


        if (
            !item ||
            item.type !== 'background' ||
            !item.value ||
            !document.body
        ) {
            return;
        }


        const body =
            document.body;


        // Chuyển đường dẫn thành CSS url(...)
        const cssURL =
            `url(${JSON.stringify(
                String(item.value)
            )})`;


        /*
         * GHI ĐÈ ẢNH NỀN CỦA WEB
         * Không tạo hiệu ứng.
         */
        body.style.setProperty(
            'background-image',
            cssURL,
            'important'
        );


        body.style.setProperty(
            'background-size',
            'cover',
            'important'
        );


        body.style.setProperty(
            'background-position',
            'center center',
            'important'
        );


        body.style.setProperty(
            'background-repeat',
            'no-repeat',
            'important'
        );


        body.style.setProperty(
            'background-attachment',
            'fixed',
            'important'
        );


        body.classList.add(
            'store-background-equipped'
        );


        body.setAttribute(
            'data-store-background-id',
            String(item.id || '')
        );


        this.activeItemId =
            item.id || '';
    }
};

// ========================================================
// HỆ THỐNG CỬA HÀNG & TÚI ĐỒ (HỌC SINH) - ĐÃ CHUẨN HÓA
// ========================================================

let studentOwnedItems = [];
let studentEquippedItems = {
    theme: 'default',
    effect: '',
    pet: '',
    music: '',
    frame: '',
    background: ''
};
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
    studentEquippedItems = {
        theme: 'default',
        effect: '',
        pet: '',
        music: '',
        frame: '',
        background: ''
    };
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
                    const itemDef = StoreConfig.items.find(
                        i => i.id === item.id
                    );

                    if (itemDef) {
                        if (itemDef.type === 'theme') {
                            ThemeManager.applyTheme('default');
                        }

                        if (itemDef.type === 'effect') {
                            EffectManager.clearEffects();
                        }

                        if (itemDef.type === 'pet') {
                            const petContainer =
                                document.getElementById(
                                    'virtual-pet-container'
                                );

                            if (petContainer) {
                                petContainer.style.display = 'none';
                            }
                        }

                        if (
                            itemDef.type === 'music' &&
                            typeof MusicManager !== 'undefined'
                        ) {
                            MusicManager.stopMusic();
                        }

                        if (
                            itemDef.type === 'background' &&
                            window.WebBackgroundManager
                        ) {
                            window.WebBackgroundManager.clearBackground();
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
                    const isEligible =
                        isDiscountEligibleForStoreItem(
                            targetArr,
                            item,
                            d
                        );

                    discounts.push({
                        ...d,
                        _key: child.key,
                        isEligible
                    });
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

        const discountSource =
            d.source || 'teacher_gift';

        const sourceInfo =
            discountSource === 'teacher_gift'
                ? ' | GV tặng: chỉ món 1–699 Coin'
                : discountSource === 'daily_login'
                    ? ' | Đăng nhập 7 ngày: tối đa 500 Coin'
                    : (
                        discountSource === 'hoihoa_runner_up' ||
                        discountSource === 'hoihoa_season'
                    )
                        ? ' | Á quân Hội Họa: món dưới 600 Coin'
                        : discountSource === 'hoihoa_chest'
                            ? ' | Rương Hội Họa: món dưới 700 Coin'
                            : discountSource === 'leaderboard_runner_up'
                                ? ' | Á quân BXH: thẻ thưởng mùa thi đua'
                                : '';

        let targetArr = d.targetItem || ['all'];
        if (!Array.isArray(targetArr)) targetArr = [targetArr];
        const targetStr = targetArr.join(',');

        // CẤU HÌNH GIAO DIỆN CHO THẺ KHÔNG HỢP LỆ
        let eligibleText = d.isEligible ? "" : " 🚫 (Không áp dụng)";
        let colorStyle = d.isEligible ? "" : "color: #999;"; // Làm mờ thẻ không dùng được

        discountOptions += `
    <option
        value="${d._key}"
        data-percent="${d.percent}"
        data-expiry="${d.expiry || ''}"
        data-target="${targetStr}"
        data-source="${d.source || ''}"
        data-eligible="${d.isEligible}"
        style="${colorStyle}"
    >
        🏷️ Giảm ${d.percent}%${sourceInfo}${expStr}${eligibleText}
    </option>
`;
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
    // === CHỐT CHẶN BẢO MẬT: KIỂM TRA MẠNG ===
    if (window.isOffline || !navigator.onLine) {
        alert("❌ Mất kết nối mạng! Vui lòng kiểm tra lại đường truyền internet trước khi thực hiện giao dịch.");
        return;
    }
    // =========================================

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

    let finalPrice = Math.max(
        0,
        Math.floor(basePrice * (1 - percent / 100))
    );

    const coinPath = `student_coins/${currentUser.username}`;
    const itemPath = `student_inventory/${currentUser.username}/${itemId}`;
    const discountPath = discountKey ? `student_discounts/${currentUser.username}/${discountKey}` : null;

    const auditTransactionId =
        window.TransactionHistory
            ? window.TransactionHistory.newId()
            : '';

    let coinDebited = false;
    let discountMarked = false;
    let itemAdded = false;

    try {
        // 1. Nếu dùng thẻ giảm giá, transaction để chặn dùng cùng 1 thẻ ở 2 tab
        if (discountPath) {
            const discountRef = db.ref(discountPath);

            // Đọc dữ liệu từ máy chủ trước để Firebase nạp thẻ vào cache
            const discountSnap = await discountRef.once('value');
            const latestDiscount = discountSnap.val();

            if (!latestDiscount) {
                throw new Error('DISCOUNT_NOT_FOUND');
            }

            if (latestDiscount.isUsed === true) {
                throw new Error('DISCOUNT_ALREADY_USED');
            }

            // Kiểm tra hạn sử dụng
            if (
                latestDiscount.expiry &&
                Date.now() > Number(latestDiscount.expiry)
            ) {
                throw new Error('DISCOUNT_EXPIRED');
            }

            // Kiểm tra vật phẩm có nằm trong phạm vi áp dụng
            const paymentItem =
                StoreManager.getItemById(itemId);

            if (!paymentItem) {
                throw new Error('ITEM_NOT_FOUND');
            }

            const targetItems =
                latestDiscount.targetItem || ['all'];

            if (
                !isDiscountEligibleForStoreItem(
                    targetItems,
                    paymentItem,
                    latestDiscount
                )
            ) {
                throw new Error('DISCOUNT_NOT_ELIGIBLE');
            }
            // Lấy phần trăm thật trực tiếp từ Firebase
            percent = Number(latestDiscount.percent) || 0;

            finalPrice = Math.max(
                0,
                Math.floor(basePrice * (1 - percent / 100))
            );

            // Chỉ transaction riêng trường isUsed.
            // null hoặc false đều có nghĩa là thẻ chưa dùng.
            const usedRef = discountRef.child('isUsed');

            const usedTx = await usedRef.transaction(
                currentUsed => {
                    // Nếu đã được tab/giao dịch khác sử dụng thì hủy
                    if (currentUsed === true) {
                        return;
                    }

                    // null hoặc false -> đánh dấu đã sử dụng
                    return true;
                },
                undefined,
                false
            );

            if (!usedTx.committed) {
                throw new Error('DISCOUNT_ALREADY_USED');
            }

            // Ghi thêm thời gian và vật phẩm đã sử dụng thẻ
            await discountRef.update({
                usedAt: Date.now(),
                usedForItem: itemId,
                usedTransactionId:
                    auditTransactionId || null
            });

            discountMarked = true;
        }

        // 2. Trừ coin bằng transaction, không dùng currentCoins cũ nữa
        if (finalPrice > 0) {
            await decrementNumberTx(coinPath, finalPrice);
            coinDebited = true;
        }

        // 3. Thêm vật phẩm bằng transaction để tránh ghi đè vật phẩm đã có
        const itemTx = await db.ref(itemPath).transaction(existingItem => {
            if (existingItem && existingItem.id) {
                return existingItem; // đã có thì giữ nguyên
            }

            return {
                id: itemId,
                purchaseTime: Date.now(),

                source: 'store_purchase',

                auditTransactionId:
                    auditTransactionId || null,

                isTrial: null,
                trialExpiry: null,
                isEquipped: true
            };
        });

        if (!itemTx.committed) {
            throw new Error('ITEM_ADD_FAILED');
        }

        itemAdded = true;

        if (
            auditTransactionId &&
            window.TransactionHistory
        ) {
            const purchasedItem =
                StoreManager.getItemById(itemId);

            await window.TransactionHistory.recordSafe(
                {
                    type: 'store_purchase',

                    summary:
                        `Mua vật phẩm: ` +
                        `${purchasedItem?.name || itemId}`,

                    source: 'store',

                    targetUsername:
                        currentUser.username,

                    targetName:
                        currentUser.name ||
                        currentUser.username,

                    amount: -finalPrice,
                    unit: 'Coin',

                    reversible: true,

                    details: {
                        coinPath: coinPath,
                        itemPath: itemPath,

                        discountPath:
                            discountPath || '',

                        itemId: itemId,

                        itemName:
                            purchasedItem?.name ||
                            itemId,

                        basePrice: basePrice,
                        finalPrice: finalPrice,

                        discountKey:
                            discountKey || '',

                        discountPercent:
                            percent
                    }
                },

                auditTransactionId
            );
        }

        // Chỉ cho phép một vật phẩm cùng loại
        // được trang bị tại một thời điểm
        if (
            typeof StoreManager.applyItem ===
            'function'
        ) {
            await StoreManager.applyItem(itemId);
        }

        const modal = document.getElementById('checkoutModal');
        if (modal) modal.remove();

        alert(`🎉 Mua thành công! Bạn đã thanh toán ${finalPrice} 🪙.`);

    } catch (e) {
        console.error(e);

        // Rollback tốt nhất có thể
        if (coinDebited && !itemAdded) {
            await rollbackIncrement(coinPath, finalPrice);
        }

        if (discountMarked && !itemAdded && discountPath) {
            await db.ref(discountPath).update({
                isUsed: false,
                usedAt: null,
                usedForItem: null,
                usedTransactionId: null
            });
        }

        if (e.message === 'INSUFFICIENT_BALANCE') {
            alert(
                "❌ Bạn không đủ Coin! Số dư đã thay đổi ở tab khác."
            );

        } else if (e.message === 'DISCOUNT_ALREADY_USED') {
            alert(
                "❌ Thẻ giảm giá này vừa được sử dụng trong một giao dịch khác."
            );

        } else if (e.message === 'DISCOUNT_NOT_FOUND') {
            alert(
                "❌ Thẻ giảm giá không còn tồn tại trên Firebase. " +
                "Vui lòng đóng bảng thanh toán và mở lại."
            );

        } else if (e.message === 'DISCOUNT_EXPIRED') {
            alert(
                "❌ Thẻ giảm giá đã hết hạn sử dụng."
            );

        } else if (e.message === 'DISCOUNT_NOT_ELIGIBLE') {
            alert(
                "❌ Thẻ giảm giá không áp dụng cho vật phẩm này. " +
                "Mã “tất cả” chỉ áp dụng cho vật phẩm đang bán bằng Coin."
            );

        } else if (e.message === 'ITEM_NOT_FOUND') {
            alert(
                "❌ Không tìm thấy vật phẩm trong cấu hình cửa hàng."
            );

        } else {
            alert(
                "❌ Đã xảy ra lỗi khi thanh toán. " +
                "Hệ thống đã cố gắng hoàn tác thao tác."
            );
        }

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
    if (item.type === 'effect') {
        EffectManager.clearEffects(true);
    }
    if (item.type === 'pet') {
        const petContainer =
            document.getElementById('virtual-pet-container');

        /*
         * Dọn hiệu ứng Sinh Nhật 2026.
         * Có tác dụng cả với hiệu ứng còn sót từ phiên bản cũ.
         */
        if (
            typeof PetManager !== 'undefined' &&
            typeof PetManager.clearBirthday2026Realm === 'function'
        ) {
            PetManager.clearBirthday2026Realm();
        }


        /*
         * Dọn lớp giao diện + ambient + click ultimate của
         * Nữ Thần Mùa Xuân Premium trước khi xóa pet khỏi DOM.
         */
        if (
            typeof PetManager !== 'undefined' &&
            typeof PetManager.clearPremiumSpringRealm === 'function'
        ) {
            PetManager.clearPremiumSpringRealm();
        }

        /*
         * Dọn dự phòng trong trường hợp PetManager
         * chưa được tải hoặc hiệu ứng cũ bị tách khỏi manager.
         */
        const birthdayRealm =
            document.getElementById('birthday-2026-realm');

        if (birthdayRealm) {
            birthdayRealm.remove();
        }

        document.documentElement.classList.remove(
            'birthday-2026-equipped'
        );

        /*
         * Hủy listener kéo, chạm và tương tác của thú cưng.
         */
        if (
            typeof PetManager !== 'undefined' &&
            PetManager.interactionAbortController
        ) {
            PetManager.interactionAbortController.abort();
            PetManager.interactionAbortController = null;
        }

        if (
            typeof PetInteractionManager !== 'undefined' &&
            typeof PetInteractionManager.detachEvents === 'function'
        ) {
            PetInteractionManager.detachEvents({
                keepLoop: false,
                removeHungerBar: true
            });
        } else if (
            typeof PetInteractionManager !== 'undefined' &&
            PetInteractionManager.loopInterval
        ) {
            clearInterval(
                PetInteractionManager.loopInterval
            );

            PetInteractionManager.loopInterval = null;

            if (
                typeof PetInteractionManager.setSleepState ===
                'function'
            ) {
                PetInteractionManager.setSleepState(false);
            }
        }

        /*
 * Dọn ambient / ultimate Quốc khánh.
 * Giữ riêng để không sót lớp toàn màn hình khi tháo pet.
 */
        if (
            typeof PetManager !== 'undefined' &&
            typeof PetManager.clearNationalDayRealm === 'function'
        ) {
            PetManager.clearNationalDayRealm();
        }

        /*
         * Xóa hoàn toàn thú cưng khỏi giao diện,
         * không chỉ ẩn ảnh.
         */
        if (petContainer) {
            petContainer.style.display = 'none';
            petContainer.innerHTML = '';

            petContainer.classList.remove(
                'pet-birthday-serpent-2026-stage',
                'pet-spring-vintage-stage',
                'spring-vintage-awakening',
                'spring-vintage-casting',
                'pet-idle',
                'pet-dragging',
                'pet-national-day-stage',
                'national-day-awakening',
                'national-day-casting',
            );

            petContainer.onmouseenter = null;
            petContainer.onmouseleave = null;
        }

        /*
         * Xóa thú cưng đang hoạt động khỏi bộ nhớ trình duyệt.
         * Ngăn hệ thống tương tác hiểu rằng pet vẫn còn.
         */
        localStorage.removeItem('active_pet');
    }

    if (
        item.type === 'music' &&
        typeof MusicManager !== 'undefined'
    ) {
        MusicManager.stopMusic();
    }

    if (
        item.type === 'frame' &&
        window.AvatarFrameManager
    ) {
        window.AvatarFrameManager.clearFrame();
    }

    if (
        item.type === 'background' &&
        window.WebBackgroundManager
    ) {
        window.WebBackgroundManager.clearBackground();
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

// 6. Cập nhật giao diện UI & Hiệu ứng
// Khi đang thi nghiêm ngặt: chỉ tạm tắt PET và EFFECT.
// Theme vẫn được giữ nguyên.
window.isExamVisualItemsSuspended = false;

// Tạm tắt pet và hiệu ứng khi bắt đầu thi
window.suspendExamVisualItems = function () {
    window.isExamVisualItemsSuspended = true;

    // Dừng toàn bộ hiệu ứng và các interval tạo hiệu ứng
    if (
        typeof EffectManager !== 'undefined' &&
        typeof EffectManager.clearEffects === 'function'
    ) {
        EffectManager.clearEffects();
    }

    const effectContainer =
        document.getElementById('global-effect-container');

    if (effectContainer) {
        effectContainer.style.display = 'none';
        effectContainer.innerHTML = '';
    }

    // Hủy các sự kiện tương tác pet
    if (
        typeof PetManager !== 'undefined' &&
        PetManager.interactionAbortController
    ) {
        PetManager.interactionAbortController.abort();
        PetManager.interactionAbortController = null;
    }

    // Dừng vòng lặp tương tác của pet
    if (
        typeof PetInteractionManager !== 'undefined' &&
        PetInteractionManager.loopInterval
    ) {
        clearInterval(PetInteractionManager.loopInterval);
        PetInteractionManager.loopInterval = null;

        if (
            typeof PetInteractionManager.setSleepState === 'function'
        ) {
            PetInteractionManager.setSleepState(false);
        }
    }

    if (
        typeof PetManager !== 'undefined' &&
        typeof PetManager.clearNationalDayRealm === 'function'
    ) {
        PetManager.clearNationalDayRealm();
    }

    const petContainer =
        document.getElementById('virtual-pet-container');

    if (petContainer) {
        petContainer.style.display = 'none';
        petContainer.innerHTML = '';
    }
};

// Khôi phục pet và hiệu ứng sau khi kết thúc thi
window.restoreExamVisualItems = function () {
    // Không được bật lại khi bài thi vẫn đang hoạt động
    if (window.currentActiveExamId) return;

    window.isExamVisualItemsSuspended = false;

    const effectContainer =
        document.getElementById('global-effect-container');

    if (effectContainer) {
        effectContainer.style.display = '';
    }

    // Đọc lại vật phẩm đang trang bị từ myInventory
    if (typeof window.applyEquippedItems === 'function') {
        window.applyEquippedItems();
    }
};

// Áp dụng các vật phẩm đang trang bị
window.applyEquippedItems = function () {
    const effectContainer =
        document.getElementById('global-effect-container');

    // Xóa khung cũ trước khi đọc lại vật phẩm đang mặc
    if (window.AvatarFrameManager) {
        window.AvatarFrameManager.clearFrame();
    }

    // Xóa nền cũ trước khi đọc lại vật phẩm đang mặc
    if (window.WebBackgroundManager) {
        window.WebBackgroundManager.clearBackground();
    }

    const petContainer =
        document.getElementById('virtual-pet-container');

    const mustSuspendVisualItems =
        window.isExamVisualItemsSuspended === true ||
        Boolean(window.currentActiveExamId);

    // Xóa hiệu ứng cũ trước khi áp dụng lại
    if (
        typeof EffectManager !== 'undefined' &&
        typeof EffectManager.clearEffects === 'function'
    ) {
        /*
         * Xóa cả hiệu ứng lưu cũ.
         * Hiệu ứng thực sự đang trang bị sẽ được
         * áp dụng lại ở vòng lặp phía dưới.
         */
        EffectManager.clearEffects(true);
    }

    if (effectContainer) {
        effectContainer.innerHTML = '';
        effectContainer.style.display =
            mustSuspendVisualItems ? 'none' : '';
    }

    /*
 * Luôn dọn thú cưng cũ trước khi đọc lại kho.
 * Nếu có thú cưng đang trang bị, vòng lặp phía dưới
 * sẽ tạo lại đúng thú cưng đó.
 */
    if (
        typeof PetManager !== 'undefined' &&
        typeof PetManager.clearBirthday2026Realm === 'function'
    ) {
        PetManager.clearBirthday2026Realm();
    }

    const staleBirthdayRealm =
        document.getElementById('birthday-2026-realm');

    if (staleBirthdayRealm) {
        staleBirthdayRealm.remove();
    }

    document.documentElement.classList.remove(
        'birthday-2026-equipped'
    );

    if (petContainer) {
        petContainer.style.display = 'none';
        petContainer.innerHTML = '';

        petContainer.classList.remove(
            'pet-birthday-serpent-2026-stage',
            'pet-idle',
            'pet-dragging'
        );
    }

    /*
     * Xóa trạng thái cũ.
     * PetManager.spawnPet() sẽ ghi lại nếu kho vẫn có pet được trang bị.
     */
    localStorage.removeItem('active_pet');

    if (
        typeof myInventory === 'undefined' ||
        !Array.isArray(myInventory)
    ) {
        return;
    }

    let equippedMusic = null;

    myInventory.forEach(invItem => {
        if (!invItem.isEquipped) return;

        const itemDef = StoreConfig.items.find(
            item => item.id === invItem.id
        );

        if (!itemDef) return;

        // Theme vẫn được sử dụng khi thi
        if (itemDef.type === 'theme') {
            ThemeManager.applyTheme(itemDef.id);
            return;
        }

        if (itemDef.type === 'music') {
            equippedMusic = itemDef;
            return;
        }

        // Áp khung avatar
        if (itemDef.type === 'frame') {

            if (window.AvatarFrameManager) {

                window.AvatarFrameManager.applyFrame(
                    itemDef
                );

            }

            return;
        }

        // Áp ảnh nền web
        if (itemDef.type === 'background') {

            if (window.WebBackgroundManager) {

                window.WebBackgroundManager.applyBackground(
                    itemDef
                );

            }

            return;
        }


        // Đang thi thì không được bật lại pet/effect
        if (mustSuspendVisualItems) return;

        if (itemDef.type === 'effect') {
            EffectManager.applyEffect(itemDef.id);
        } else if (itemDef.type === 'pet') {
            PetManager.spawnPet(itemDef);
        }
    });

    if (typeof MusicManager !== 'undefined') {
        if (equippedMusic) {
            MusicManager.applyMusic(
                equippedMusic
            );
        } else {
            MusicManager.stopMusic();
        }
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

// =====================================================
// HÀM XỬ LÝ ĐIỂM VÀ TIỀN LỘ TRÌNH
// =====================================================
function parseRoadmapNumber(value, fallback = NaN) {
    if (value === null || value === undefined || value === '') {
        return fallback;
    }

    const number = parseFloat(String(value).trim().replace(',', '.'));
    return Number.isFinite(number) ? number : fallback;
}

function getRoadmapPassingGrade(assign) {
    const assignmentGrade = parseRoadmapNumber(
        assign && assign.passingGrade,
        NaN
    );

    if (Number.isFinite(assignmentGrade)) {
        return assignmentGrade;
    }

    const globalGrade = parseRoadmapNumber(
        window.currentPassingGrade,
        NaN
    );

    return Number.isFinite(globalGrade) ? globalGrade : 7;
}

function getRoadmapMoney(assign) {
    const money = parseInt(
        String(assign?.roadmapMoney || 0).replace(/[^0-9-]/g, ''),
        10
    );

    return Number.isFinite(money) ? money : 0;
}

function isSameRoadmapValue(value1, value2) {
    return String(value1 ?? '') === String(value2 ?? '');
}

function isRoadmapSubmissionFailed(sub) {
    return !!(
        sub &&
        !sub.forcePass &&
        (
            sub.isAutoSubmitted ||
            sub.isLateFail ||
            sub.isCheatFail
        )
    );
}

// Lấy đúng bài nộp có kết quả hợp lệ nhất
function getRoadmapSubmission(assign, submissions, username) {
    const passingGrade = getRoadmapPassingGrade(assign);

    const matchedSubmissions = (submissions || []).filter(sub =>
        isSameRoadmapValue(sub.assignmentId, assign.id) &&
        isSameRoadmapValue(sub.studentUsername, username)
    );

    if (matchedSubmissions.length === 0) {
        return null;
    }

    function getSubmissionPriority(sub) {
        if (sub.forcePass) return 50;

        const grade = parseRoadmapNumber(sub.grade, NaN);
        const failed = isRoadmapSubmissionFailed(sub);

        if (
            !failed &&
            !sub.isRegrading &&
            Number.isFinite(grade) &&
            grade >= passingGrade
        ) {
            return 40;
        }

        if (
            !failed &&
            !sub.isRegrading &&
            Number.isFinite(grade)
        ) {
            return 30;
        }

        if (sub.isRegrading) return 20;
        if (failed) return 10;

        return 0;
    }

    matchedSubmissions.sort((a, b) => {
        const priorityDifference =
            getSubmissionPriority(b) -
            getSubmissionPriority(a);

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        const gradeA = parseRoadmapNumber(a.grade, -Infinity);
        const gradeB = parseRoadmapNumber(b.grade, -Infinity);

        if (gradeB !== gradeA) {
            return gradeB - gradeA;
        }

        return Number(b.id || b.timestamp || 0) -
            Number(a.id || a.timestamp || 0);
    });

    return matchedSubmissions[0];
}

function isRoadmapSubmissionPassed(assign, sub) {
    if (!sub) return false;
    if (sub.forcePass) return true;

    if (
        sub.isRegrading ||
        isRoadmapSubmissionFailed(sub)
    ) {
        return false;
    }

    const grade = parseRoadmapNumber(sub.grade, NaN);

    return (
        Number.isFinite(grade) &&
        grade >= getRoadmapPassingGrade(assign)
    );
}

function getRoadmapTargetStudents(assign) {
    const rawTarget = assign?.targetStudent;

    if (Array.isArray(rawTarget)) {
        const values = rawTarget
            .flatMap(value => String(value ?? '').split(','))
            .map(value => value.trim())
            .filter(Boolean);

        return values.length
            ? [...new Set(values)]
            : ['all'];
    }

    const values = String(rawTarget ?? 'all')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);

    return values.length
        ? [...new Set(values)]
        : ['all'];
}

function isRoadmapAssignmentForStudent(assign, username) {
    const targetStudents =
        getRoadmapTargetStudents(assign);

    const normalizedUsername =
        String(username ?? '').trim();

    return (
        targetStudents.includes('all') ||
        targetStudents.includes(normalizedUsername)
    );
}

function calculateRoadmapBaseMoney(
    assignments,
    submissions,
    username
) {
    return (assignments || []).reduce((total, assign) => {
        if (!isRoadmapAssignmentForStudent(assign, username)) {
            return total;
        }

        const sub = getRoadmapSubmission(
            assign,
            submissions,
            username
        );

        if (isRoadmapSubmissionPassed(assign, sub)) {
            return total + getRoadmapMoney(assign);
        }

        return total;
    }, 0);
}

// Render lộ trình cá nhân của học sinh đang đăng nhập
// Hàng đợi chống nhiều lần render chạy song song
let studentRoadmapRenderPromise = null;
let studentRoadmapRenderQueued = false;

async function renderStudentRoadmap() {
    // Ghi nhận có yêu cầu cập nhật mới
    studentRoadmapRenderQueued = true;

    // Nếu đang render thì không mở thêm một tiến trình khác.
    // Yêu cầu mới sẽ được xử lý trong vòng lặp bên dưới.
    if (studentRoadmapRenderPromise) {
        return studentRoadmapRenderPromise;
    }

    studentRoadmapRenderPromise = (async () => {
        try {
            while (studentRoadmapRenderQueued) {
                studentRoadmapRenderQueued = false;

                // Mỗi thời điểm chỉ có duy nhất một lần dựng bảng
                await renderStudentRoadmapCore();
            }
        } catch (error) {
            console.error(
                'Lỗi cập nhật lộ trình học sinh:',
                error
            );
        } finally {
            studentRoadmapRenderPromise = null;
        }
    })();

    return studentRoadmapRenderPromise;
}

async function renderStudentRoadmapCore() {
    const body = document.getElementById('studentRoadmapBody');
    if (!body) return;
    body.innerHTML = '';

    const [assignments, submissions, offsetSnap] = await Promise.all([
        getDB('assignments'),
        getDB('submissions'),
        db.ref('student_money_offset/' + currentUser.username).once('value')
    ]);

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

    // Dùng cùng một hàm chuẩn hóa mục tiêu với phần tính tiền/rút tiền.
    // Tránh lệch số dư khi dữ liệu targetStudent cũ chứa chuỗi phân cách bằng dấu phẩy.
    const myAssignments = assignments.filter(assign =>
        isRoadmapAssignmentForStudent(assign, currentUser.username)
    );
    // Sắp xếp bài tập thông minh theo số đếm trong Tiêu đề (VD: Bài 1 -> Bài 2 -> Bài 10)
    const sortedAssignments = [...myAssignments].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi-VN', { numeric: true, sensitivity: 'base' }));

    if (sortedAssignments.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="padding:15px; text-align:center; color:#666; font-style:italic;">Chưa có dữ liệu lộ trình học tập.</td></tr>`;

        // Không được ép về 0 vì học sinh vẫn có thể còn tiền offset
        // (Coin → Tiền, quà, điều chỉnh hoặc giao dịch trước đó).
        const moneyOffset = Number(offsetSnap.val()) || 0;
        const finalMoney = Math.max(0, moneyOffset);
        const totalMoneyEl = document.getElementById('totalRoadmapMoney');
        if (totalMoneyEl) {
            totalMoneyEl.innerText = finalMoney.toLocaleString('vi-VN');
        }
        return;
    }

    let totalMoney = 0; // Biến lưu tổng số tiền tích lũy

    sortedAssignments.forEach(assign => {
        // Lấy điểm chuẩn riêng của từng bài do Giáo viên đã thiết lập
        const passingGrade = getRoadmapPassingGrade(assign);

        const sub = getRoadmapSubmission(
            assign,
            submissions,
            currentUser.username
        );

        let studentScore = '-';
        let statusText = 'Chưa nộp';
        let statusClass = 'status-pending';
        let cellBgStyle = '';

        // Đưa việc khai báo tiền lên trước để có thể ghi đè nếu học sinh bị loại do nộp trễ hoặc điểm thấp
        let currentItemMoney = getRoadmapMoney(assign);

        let moneyVal = currentItemMoney > 0
            ? currentItemMoney.toLocaleString('vi-VN') + ' đ'
            : '-';

        if (sub) {
            // KIỂM TRA XEM CÓ ĐƯỢC GIÁO VIÊN THA ĐIỂM THẤP/NỘP TRỄ KHÔNG
            if (sub.forcePass) {
                statusText = 'Đạt';
                statusClass = 'status-done';
                cellBgStyle = 'background: rgba(16, 185, 129, 0.25) !important; color: #047857; font-weight: bold; border-radius: 8px;';
                studentScore = (sub.grade !== null && sub.grade !== undefined && sub.grade !== '')
                    ? parseRoadmapNumber(sub.grade, 0)
                    : '0';
                totalMoney += currentItemMoney; // Được tha điểm thấp -> Cộng tiền tích lũy
            }
            // ƯU TIÊN KIỂM TRA NỘP TRỄ TRƯỚC
            else if (
                sub.isAutoSubmitted ||
                sub.isLateFail ||
                sub.isCheatFail
            ) {
                statusText = 'Loại';
                statusClass = 'status-pending';
                cellBgStyle = 'background: rgba(225, 29, 72, 0.2) !important; color: #b91c1c; font-weight: bold; border-radius: 8px;';
                studentScore = (sub.grade !== null && sub.grade !== undefined && sub.grade !== '')
                    ? parseRoadmapNumber(sub.grade, 0)
                    : '0';
                moneyVal = '0 đ'; // Ép tiền thưởng về 0 đ
            }
            else if (sub.isRegrading) {
                statusText = 'Chấm lại';
                statusClass = 'status-pending';
                studentScore = '🔄';
            } else if (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') {
                studentScore = parseRoadmapNumber(sub.grade, 0);

                // So sánh với điểm chuẩn riêng của bài
                if (isRoadmapSubmissionPassed(assign, sub)) {
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

    // Tổng hiển thị phải dùng đúng cùng thuật toán với bảng quy đổi/rút tiền.
    // totalMoney ở trên chỉ phục vụ dựng trạng thái từng dòng; không dùng làm nguồn tổng cuối.
    const baseMoney = calculateRoadmapBaseMoney(
        assignments,
        submissions,
        currentUser.username
    );
    const moneyOffset = Number(offsetSnap.val()) || 0;
    const finalMoney = Math.max(0, baseMoney + moneyOffset);

    // Cập nhật hiển thị số tiền cuối cùng lên ô tổng
    const totalMoneyEl = document.getElementById('totalRoadmapMoney');
    if (totalMoneyEl) {
        totalMoneyEl.innerText = finalMoney.toLocaleString('vi-VN');
    }
}

// ================= QUY ĐỔI TIỀN VÀ COIN =================
// Tiền → Coin: tối đa 2 lần/ngày, không giới hạn số tiền mỗi lần.
// Coin → Tiền: 1 lần/tuần, tối đa 500 Coin.
// Tuần bắt đầu từ thứ Hai, tính theo múi giờ Việt Nam UTC+7.

const STUDENT_CONVERSION_RULES = Object.freeze({
    M2C: Object.freeze({
        maxAmount: null,
        periodType: 'day',
        maxUses: 2,
        limitMessage:
            '* Lưu ý: Tiền → Coin được đổi tối đa 2 lần/ngày, không giới hạn số tiền mỗi lần.'
    }),

    C2M: Object.freeze({
        maxAmount: 500,
        periodType: 'week',
        maxUses: 1,
        limitMessage:
            '* Lưu ý: Chỉ được đổi 1 lần/tuần, tối đa 500 Coin sang Tiền lộ trình.'
    })
});

function getStudentConversionRule(direction) {
    return STUDENT_CONVERSION_RULES[
        direction === 'C2M' ? 'C2M' : 'M2C'
    ];
}

// Lấy thời gian gần với máy chủ Firebase,
// tránh việc học sinh đổi ngày giờ trên máy.
async function getStudentConversionServerNow() {
    try {
        const snapshot = await db
            .ref('.info/serverTimeOffset')
            .once('value');

        return Date.now() + (Number(snapshot.val()) || 0);
    } catch (error) {
        console.warn(
            'Không lấy được giờ Firebase, tạm dùng giờ thiết bị:',
            error
        );

        return Date.now();
    }
}

function getVietnamCalendarParts(timestamp) {
    const VIETNAM_OFFSET = 7 * 60 * 60 * 1000;

    const date = new Date(
        Number(timestamp || Date.now()) +
        VIETNAM_OFFSET
    );

    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate()
    };
}

function padStudentConversionDatePart(value) {
    return String(value).padStart(2, '0');
}

// M2C tạo khóa theo ngày: 2026-08-30
// C2M tạo khóa ngày thứ Hai đầu tuần: 2026-08-24
function getStudentConversionPeriodKey(
    direction,
    timestamp = Date.now()
) {
    const rule = getStudentConversionRule(direction);
    const parts = getVietnamCalendarParts(timestamp);

    // Tiền → Coin: reset lượt mỗi ngày theo giờ Việt Nam
    if (rule.periodType === 'day') {
        return [
            parts.year,
            padStudentConversionDatePart(parts.month),
            padStudentConversionDatePart(parts.day)
        ].join('-');
    }

    // Giữ tương thích nếu sau này cần giới hạn tháng
    if (rule.periodType === 'month') {
        return (
            `${parts.year}-` +
            `${padStudentConversionDatePart(parts.month)}`
        );
    }

    // Coin → Tiền: theo tuần, tuần bắt đầu thứ Hai
    const date = new Date(Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day
    ));

    const dayOfWeek = date.getUTCDay() || 7;

    date.setUTCDate(
        date.getUTCDate() - dayOfWeek + 1
    );

    return [
        date.getUTCFullYear(),
        padStudentConversionDatePart(
            date.getUTCMonth() + 1
        ),
        padStudentConversionDatePart(
            date.getUTCDate()
        )
    ].join('-');
}

function getStudentConversionUsagePath(
    direction,
    timestamp = Date.now()
) {
    const normalizedDirection =
        direction === 'C2M' ? 'C2M' : 'M2C';

    const periodKey = getStudentConversionPeriodKey(
        normalizedDirection,
        timestamp
    );

    return (
        `student_conversion_usage/` +
        `${currentUser.username}/` +
        `${normalizedDirection}/` +
        `${periodKey}`
    );
}

function getStudentConversionUsedMessage(direction) {
    if (direction === 'C2M') {
        return (
            '⛔ Bạn đã dùng lượt đổi Coin → Tiền của tuần này. ' +
            'Mỗi tuần chỉ được đổi 1 lần.'
        );
    }

    return (
        '⛔ Bạn đã dùng đủ 2 lượt đổi Tiền → Coin hôm nay. ' +
        'Lượt sẽ được reset vào ngày mới.'
    );
}

// Giữ lượt trước khi cộng/trừ tiền.
// M2C có 2 slot/ngày.
// Firebase Transaction ngăn 2 tab chiếm cùng một slot.
async function reserveStudentConversionUsage(
    direction,
    amount,
    serverNow
) {
    const normalizedDirection =
        direction === 'C2M' ? 'C2M' : 'M2C';

    const periodKey = getStudentConversionPeriodKey(
        normalizedDirection,
        serverNow
    );

    const usageBasePath = getStudentConversionUsagePath(
        normalizedDirection,
        serverNow
    );

    const reservationId = [
        serverNow,
        Math.random().toString(36).slice(2, 12)
    ].join('_');

    // =====================================================
    // TIỀN → COIN: TỐI ĐA 2 LƯỢT MỖI NGÀY
    // =====================================================
    if (normalizedDirection === 'M2C') {
        for (let slot = 1; slot <= 2; slot++) {
            const usagePath =
                `${usageBasePath}/slot${slot}`;

            const transactionResult = await db
                .ref(usagePath)
                .transaction(currentValue => {
                    // Slot đã có người dùng
                    if (currentValue) {
                        return;
                    }

                    return {
                        used: true,
                        status: 'reserved',
                        direction: normalizedDirection,
                        amount: amount,
                        periodKey: periodKey,
                        reservationId: reservationId,
                        createdAt: serverNow
                    };
                });

            if (transactionResult.committed) {
                return {
                    direction: normalizedDirection,
                    periodKey: periodKey,
                    usagePath: usagePath,
                    reservationId: reservationId,
                    serverNow: serverNow,
                    slot: slot
                };
            }
        }

        const error = new Error(
            'CONVERSION_LIMIT_ALREADY_USED'
        );

        error.code =
            'CONVERSION_LIMIT_ALREADY_USED';

        throw error;
    }

    // =====================================================
    // COIN → TIỀN: GIỮ NGUYÊN 1 LẦN/TUẦN
    // =====================================================
    const transactionResult = await db
        .ref(usageBasePath)
        .transaction(currentValue => {
            if (currentValue) {
                return;
            }

            return {
                used: true,
                status: 'reserved',
                direction: normalizedDirection,
                amount: amount,
                periodKey: periodKey,
                reservationId: reservationId,
                createdAt: serverNow
            };
        });

    if (!transactionResult.committed) {
        const error = new Error(
            'CONVERSION_LIMIT_ALREADY_USED'
        );

        error.code =
            'CONVERSION_LIMIT_ALREADY_USED';

        throw error;
    }

    return {
        direction: normalizedDirection,
        periodKey: periodKey,
        usagePath: usageBasePath,
        reservationId: reservationId,
        serverNow: serverNow
    };
}

// Chuyển lượt từ reserved sang completed.
async function completeStudentConversionUsage(reservation) {
    if (!reservation) return;

    await db
        .ref(reservation.usagePath)
        .transaction(currentValue => {
            if (
                !currentValue ||
                currentValue.status !== 'reserved' ||
                currentValue.reservationId !==
                reservation.reservationId
            ) {
                return;
            }

            return {
                ...currentValue,
                status: 'completed',
                completedAt: reservation.serverNow
            };
        });
}

// Giao dịch lỗi thì xóa lượt đang giữ.
async function releaseStudentConversionUsage(reservation) {
    if (!reservation) return;

    try {
        await db
            .ref(reservation.usagePath)
            .transaction(currentValue => {
                if (
                    !currentValue ||
                    currentValue.status !== 'reserved' ||
                    currentValue.reservationId !==
                    reservation.reservationId
                ) {
                    return;
                }

                return null;
            });
    } catch (error) {
        console.warn(
            'Không thể giải phóng lượt quy đổi:',
            error
        );
    }
}

// Kiểm tra và hiển thị học sinh đã dùng lượt hay chưa.
window.refreshStudentConversionLimitNotice =
    async function (
        direction = window.currentConvertDir
    ) {
        const normalizedDirection =
            direction === 'C2M' ? 'C2M' : 'M2C';

        const limitText = document.getElementById(
            'convertLimitText'
        );

        if (!limitText) return;

        const rule = getStudentConversionRule(
            normalizedDirection
        );

        limitText.style.display = 'block';
        limitText.innerText = rule.limitMessage;

        try {
            const serverNow =
                await getStudentConversionServerNow();

            const snapshot = await db
                .ref(
                    getStudentConversionUsagePath(
                        normalizedDirection,
                        serverNow
                    )
                )
                .once('value');

            // Người dùng đã bấm sang hướng khác thì không ghi đè.
            if (
                window.currentConvertDir !==
                normalizedDirection
            ) {
                return;
            }

            if (normalizedDirection === 'M2C') {
                const usageData = snapshot.val() || {};

                const usedCount = [
                    usageData.slot1,
                    usageData.slot2
                ].filter(Boolean).length;

                if (usedCount >= 2) {
                    limitText.innerText =
                        getStudentConversionUsedMessage('M2C');
                } else {
                    limitText.innerText =
                        `* Tiền → Coin: đã dùng ${usedCount}/2 lượt hôm nay. ` +
                        `Không giới hạn số tiền mỗi lần đổi.`;
                }
            } else if (snapshot.exists()) {
                limitText.innerText =
                    getStudentConversionUsedMessage(
                        normalizedDirection
                    );
            }
        } catch (error) {
            console.warn(
                'Không kiểm tra được lượt quy đổi:',
                error
            );
        }
    };

window.currentConvertDir = 'M2C';

window.openCoinConversionModal = function () {
    if (window.isConversionEnabled === false) {
        alert(
            '🔒 Chức năng Bảng quy đổi hiện đang bị Giáo viên tạm khóa!'
        );
        return;
    }

    if (window.currentActiveExamId) {
        window.showExamLockWarning(
            '⚠️ Bảng quy đổi Coin tạm khóa khi thi!'
        );
        return;
    }

    const amountInput =
        document.getElementById('convertAmount');

    const resultInput =
        document.getElementById('convertResult');

    if (amountInput) {
        amountInput.value = '';
    }

    if (resultInput) {
        resultInput.value = '';
    }

    setConvertDir('M2C');

    document
        .getElementById('coinConversionModal')
        ?.classList.add('active');

    if (
        typeof window.initCashWithdrawInterface ===
        'function'
    ) {
        window.initCashWithdrawInterface();
    }
};

window.closeCoinConversionModal = function () {
    document
        .getElementById('coinConversionModal')
        ?.classList.remove('active');
};

window.setConvertDir = function (direction) {
    const normalizedDirection =
        direction === 'C2M' ? 'C2M' : 'M2C';

    window.currentConvertDir = normalizedDirection;

    const btnM2C =
        document.getElementById('btnDirM2C');

    const btnC2M =
        document.getElementById('btnDirC2M');

    const lblSource =
        document.getElementById('lblConvertSource');

    const lblTarget =
        document.getElementById('lblConvertTarget');

    const limitText =
        document.getElementById('convertLimitText');

    const resultInput =
        document.getElementById('convertResult');

    const amountInput =
        document.getElementById('convertAmount');

    const rule = getStudentConversionRule(
        normalizedDirection
    );

    if (amountInput) {
        amountInput.value = '';
        amountInput.min = '1';
        amountInput.step = '1';

        if (normalizedDirection === 'M2C') {
            // Không giới hạn số tiền nhập
            amountInput.removeAttribute('max');
            amountInput.placeholder =
                'Nhập số tiền muốn đổi';
        } else {
            amountInput.max =
                String(rule.maxAmount);

            amountInput.placeholder =
                'Nhập số Coin (tối đa 500)';
        }
    }

    if (resultInput) {
        resultInput.value = '';
    }

    if (limitText) {
        limitText.style.display = 'block';
        limitText.innerText = rule.limitMessage;
    }

    if (normalizedDirection === 'M2C') {
        if (btnM2C) {
            btnM2C.style.background = '#059669';
            btnM2C.style.color = 'white';
            btnM2C.style.border = 'none';
        }

        if (btnC2M) {
            btnC2M.style.background = 'transparent';
            btnC2M.style.color = '#d35400';
            btnC2M.style.border =
                '2px solid #d35400';
        }

        if (lblSource) {
            lblSource.innerText =
                'Tiền Lộ Trình (đ):';
        }

        if (lblTarget) {
            lblTarget.innerText =
                'Nhận được (Coin):';
        }

        if (resultInput) {
            resultInput.style.color = '#059669';
        }
    } else {
        if (btnC2M) {
            btnC2M.style.background = '#d35400';
            btnC2M.style.color = 'white';
            btnC2M.style.border = 'none';
        }

        if (btnM2C) {
            btnM2C.style.background = 'transparent';
            btnM2C.style.color = '#059669';
            btnM2C.style.border =
                '2px solid #059669';
        }

        if (lblSource) {
            lblSource.innerText =
                'Số dư Coin (🪙):';
        }

        if (lblTarget) {
            lblTarget.innerText =
                'Nhận được (đ):';
        }

        if (resultInput) {
            resultInput.style.color = '#d35400';
        }
    }

    updateConvertPreview();

    window
        .refreshStudentConversionLimitNotice(
            normalizedDirection
        )
        .catch(error => {
            console.warn(
                'Không cập nhật được giới hạn:',
                error
            );
        });
};

// Đồng bộ kết quả theo tỉ lệ 1:1.
window.updateConvertPreview = function () {
    const amountInput =
        document.getElementById('convertAmount');

    const resultInput =
        document.getElementById('convertResult');

    if (!amountInput || !resultInput) return;

    const rawAmount =
        String(amountInput.value || '').trim();

    const amount = Number(rawAmount);

    const rule = getStudentConversionRule(
        window.currentConvertDir
    );

    // Tự động kéo về 500 nếu nhập lớn hơn giới hạn.
    if (
        rawAmount &&
        Number.isFinite(amount) &&
        Number.isFinite(rule.maxAmount) &&
        amount > rule.maxAmount
    ) {
        amountInput.value =
            String(rule.maxAmount);

        resultInput.value =
            String(rule.maxAmount);

        return;
    }

    resultInput.value = rawAmount;
};

// Khóa dùng chung cho mọi thao tác làm thay đổi/giữ chỗ Tiền lộ trình.
async function runWithStudentMoneyMutationLock(task) {
    if (
        navigator.locks &&
        typeof navigator.locks.request === 'function'
    ) {
        return navigator.locks.request(
            `student-money:${currentUser.username}`,
            task
        );
    }

    return task();
}

// Thực hiện quy đổi nội bộ.
async function executeConversionCore() {
    const amountInput =
        document.getElementById('convertAmount');

    if (!amountInput) return;

    const rawAmount =
        String(amountInput.value || '').trim();

    const amount = Number(rawAmount);

    const direction =
        window.currentConvertDir === 'C2M'
            ? 'C2M'
            : 'M2C';

    const rule =
        getStudentConversionRule(direction);

    if (
        !rawAmount ||
        !Number.isInteger(amount) ||
        amount <= 0
    ) {
        alert(
            '⚠️ Vui lòng nhập số nguyên dương hợp lệ!'
        );
        return;
    }

    if (
        Number.isFinite(rule.maxAmount) &&
        amount > rule.maxAmount
    ) {
        alert(
            '❌ Mỗi tuần chỉ được đổi tối đa 500 Coin sang Tiền lộ trình.'
        );
        return;
    }

    const coinPath =
        `student_coins/${currentUser.username}`;

    const offsetPath =
        `student_money_offset/${currentUser.username}`;

    let reservation = null;
    let conversionSucceeded = false;

    // Khi hoàn tác thất bại thì không xóa lượt,
    // tránh học sinh thực hiện lại và bị cộng/trừ hai lần.
    let mayReleaseReservation = true;

    try {
        const [
            coinSnapshot,
            assignments,
            submissions,
            offsetSnapshot,
            cashRequests,
            serverNow
        ] = await Promise.all([
            db.ref(coinPath).once('value'),
            getDB('assignments'),
            getDB('submissions'),
            db.ref(offsetPath).once('value'),
            getDB('cash_requests'),
            getStudentConversionServerNow()
        ]);

        const currentCoins =
            Number(coinSnapshot.val()) || 0;

        const baseRoadmapMoney =
            calculateRoadmapBaseMoney(
                assignments,
                submissions,
                currentUser.username
            );

        const currentOffset =
            Number(offsetSnapshot.val()) || 0;

        const currentMoney = Math.max(
            0,
            baseRoadmapMoney + currentOffset
        );

        // Tiền đang chờ/đang xử lý nhưng CHƯA bị trừ khỏi offset phải được giữ chỗ.
        const reservedCashAmount = getReservedCashRequestAmount(
            cashRequests,
            currentOffset
        );
        const currentAvailableMoney = Math.max(
            0,
            currentMoney - reservedCashAmount
        );

        // Kiểm tra nhanh số dư khả dụng trước khi giữ lượt.
        if (
            direction === 'M2C' &&
            amount > currentAvailableMoney
        ) {
            alert(
                `❌ Không đủ tiền lộ trình khả dụng! ` +
                `Bạn còn có thể dùng ${currentAvailableMoney.toLocaleString('vi-VN')}đ ` +
                `sau khi trừ các yêu cầu tiền mặt đang chờ/đang xử lý.`
            );
            return;
        }

        if (
            direction === 'C2M' &&
            amount > currentCoins
        ) {
            alert('❌ Không đủ Coin!');
            return;
        }

        reservation =
            await reserveStudentConversionUsage(
                direction,
                amount,
                serverNow
            );

        let auditCoinDelta = 0;
        let auditOffsetDelta = 0;
        let successMessage = '';

        if (direction === 'M2C') {
            // Trừ tiền lộ trình theo số mới nhất.
            const offsetTransaction = await db
                .ref(offsetPath)
                .transaction(currentValue => {
                    const latestOffset =
                        Number(currentValue) || 0;

                    const latestMoney = Math.max(
                        0,
                        baseRoadmapMoney +
                        latestOffset -
                        reservedCashAmount
                    );

                    if (amount > latestMoney) {
                        return;
                    }

                    return latestOffset - amount;
                });

            if (!offsetTransaction.committed) {
                throw new Error(
                    'INSUFFICIENT_ROADMAP_MONEY'
                );
            }

            try {
                await incrementNumberTx(
                    coinPath,
                    amount
                );
            } catch (conversionError) {
                try {
                    // Cộng lại tiền nếu cộng Coin thất bại.
                    await incrementNumberTx(
                        offsetPath,
                        amount
                    );
                } catch (rollbackError) {
                    mayReleaseReservation = false;
                    conversionError.rollbackError =
                        rollbackError;
                }

                throw conversionError;
            }

            auditCoinDelta = amount;
            auditOffsetDelta = -amount;

            successMessage =
                `✅ Quy đổi thành công!\n` +
                `Bạn đã dùng ` +
                `${amount.toLocaleString('vi-VN')}đ ` +
                `để nhận ` +
                `${amount.toLocaleString('vi-VN')} Coin 🪙.\n` +
                `Tiền → Coin được phép tối đa 2 lượt mỗi ngày.`;
        } else {
            // Trừ Coin.
            await decrementNumberTx(
                coinPath,
                amount
            );

            try {
                // Cộng tiền lộ trình.
                await incrementNumberTx(
                    offsetPath,
                    amount
                );
            } catch (conversionError) {
                try {
                    // Hoàn lại Coin nếu cộng tiền thất bại.
                    await incrementNumberTx(
                        coinPath,
                        amount
                    );
                } catch (rollbackError) {
                    mayReleaseReservation = false;
                    conversionError.rollbackError =
                        rollbackError;
                }

                throw conversionError;
            }

            auditCoinDelta = -amount;
            auditOffsetDelta = amount;

            successMessage =
                `✅ Quy đổi thành công!\n` +
                `Bạn đã dùng ` +
                `${amount.toLocaleString('vi-VN')} Coin 🪙 ` +
                `để nhận ` +
                `${amount.toLocaleString('vi-VN')}đ.\n` +
                `Lượt Coin → Tiền của tuần này đã được sử dụng.`;
        }

        conversionSucceeded = true;

        try {
            await completeStudentConversionUsage(
                reservation
            );
        } catch (usageError) {
            // Bản ghi reserved vẫn chặn được lượt tiếp theo.
            console.warn(
                'Đã quy đổi nhưng chưa chuyển lượt sang completed:',
                usageError
            );
        }

        // Ghi nhật ký giao dịch nếu hệ thống có hỗ trợ.
        if (window.TransactionHistory) {
            try {
                await window.TransactionHistory.recordSafe({
                    type: 'coin_conversion',

                    summary:
                        direction === 'M2C'
                            ? `Đổi ${amount} đồng thành ${amount} Coin`
                            : `Đổi ${amount} Coin thành ${amount} đồng`,

                    source: 'student_conversion',

                    targetUsername:
                        currentUser.username,

                    targetName:
                        currentUser.name ||
                        currentUser.username,

                    amount: auditCoinDelta,
                    unit: 'Coin',
                    reversible: true,

                    details: {
                        coinPath: coinPath,
                        offsetPath: offsetPath,
                        coinDelta: auditCoinDelta,
                        offsetDelta: auditOffsetDelta,
                        direction: direction,
                        amount: amount,

                        conversionUsagePath:
                            reservation.usagePath,

                        conversionPeriodKey:
                            reservation.periodKey,

                        conversionReservationId:
                            reservation.reservationId
                    }
                });
            } catch (historyError) {
                console.warn(
                    'Quy đổi thành công nhưng không ghi được nhật ký:',
                    historyError
                );
            }
        }

        alert(successMessage);

        closeCoinConversionModal();

        if (
            typeof renderStudentRoadmap ===
            'function'
        ) {
            await Promise.resolve(
                renderStudentRoadmap()
            );
        }
    } catch (error) {
        console.error(
            'Lỗi quy đổi:',
            error
        );

        if (
            reservation &&
            !conversionSucceeded &&
            mayReleaseReservation
        ) {
            await releaseStudentConversionUsage(
                reservation
            );
        }

        if (
            error.code ===
            'CONVERSION_LIMIT_ALREADY_USED' ||
            error.message ===
            'CONVERSION_LIMIT_ALREADY_USED'
        ) {
            alert(
                getStudentConversionUsedMessage(
                    direction
                )
            );
        } else if (
            error.message ===
            'INSUFFICIENT_ROADMAP_MONEY'
        ) {
            alert(
                '❌ Không đủ tiền lộ trình! Số dư có thể đã thay đổi ở tab khác.'
            );
        } else if (
            error.message ===
            'INSUFFICIENT_BALANCE'
        ) {
            alert(
                '❌ Không đủ Coin! Số dư có thể đã thay đổi ở tab khác.'
            );
        } else if (!mayReleaseReservation) {
            alert(
                '❌ Giao dịch gặp lỗi nghiêm trọng khi hoàn tác. ' +
                'Lượt quy đổi đã được khóa để tránh cộng hoặc trừ lặp. ' +
                'Hãy báo giáo viên kiểm tra nhật ký.'
            );
        } else if (
            String(error.code || '').includes(
                'PERMISSION_DENIED'
            ) ||
            String(error.message || '').includes(
                'PERMISSION_DENIED'
            )
        ) {
            alert(
                '❌ Firebase Rules chưa cho phép truy cập student_conversion_usage.'
            );
        } else {
            alert(
                '❌ Giao dịch bị hủy do lỗi kết nối hoặc lỗi Firebase. ' +
                'Số dư đã được hoàn tác tốt nhất có thể.'
            );
        }

        window
            .refreshStudentConversionLimitNotice(
                direction
            )
            .catch(() => { });
    }
}

window.executeConversion = function () {
    return runWithStudentMoneyMutationLock(executeConversionCore);
};

// =========================================================================
// HỆ THỐNG RÚT TIỀN MẶT CỦA HỌC SINH
// Lưu ý: luồng cũ trùng hàm đã được loại bỏ. Luồng duy nhất nằm ở cuối file.
// =========================================================================

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
            else if (
                msg.giftType === 'birthday_coin'
            ) {
                const birthdayYear =
                    Number(
                        msg.birthdayYear ||
                        msg.giftValue
                    );

                giftDisplay =
                    `🎂 1 Xu Sinh Nhật ${birthdayYear}` +
                    `<br>` +
                    `<span style="
            font-size:0.82em;
            color:#be185d;
            font-weight:600;
        ">` +
                    `Chỉ đổi được 1 vật phẩm tag ` +
                    `Sinh nhật ${birthdayYear}` +
                    `</span>`;
            }
            else if (msg.giftType === 'money') giftDisplay = `💵 ${parseInt(msg.giftValue).toLocaleString('vi-VN')} đ (Tiền Lộ trình)`;
            else if (
                msg.giftType ===
                'special_birthday_coin'
            ) {
                const quantity =
                    Math.max(
                        1,
                        parseInt(
                            msg.giftValue,
                            10
                        ) || 1
                    );

                giftDisplay =
                    `✨ ${quantity} Xu Đặc Biệt` +
                    `<br>` +
                    `<span style="
            font-size:0.82em;
            color:#7c3aed;
            font-weight:600;
        ">` +
                    `Đổi vật phẩm tag Sinh nhật, ` +
                    `không phân biệt năm. ` +
                    `Hạn 5 ngày kể từ lúc nhận vào túi.` +
                    `</span>`;
            }
            else if (msg.giftType === 'ticket') giftDisplay = `🎫 ${parseInt(msg.giftValue).toLocaleString('vi-VN')} Vé quay may mắn`;
            else if (msg.giftType === 'discount') {
                let expStr = msg.discountExpiry ? `\n(HSD: ${new Date(msg.discountExpiry).toLocaleString('vi-VN')})` : ' (Vĩnh viễn)';

                const messageDiscountSource =
                    msg.source || 'teacher_gift';

                const conditionHTML =
                    messageDiscountSource === 'teacher_gift'
                        ? `
                            <br>
                            <span style="
                                display: inline-block;
                                margin-top: 5px;
                                padding: 5px 8px;
                                border-radius: 6px;
                                background: #fff7ed;
                                color: #c2410c;
                                font-size: 0.8em;
                                font-weight: normal;
                            ">
                                ⚠️ Chỉ dùng cho vật phẩm giá từ
                                1 đến 699 Coin; không dùng cho món
                                từ 700 Coin trở lên.
                            </span>
                        `
                        : messageDiscountSource === 'daily_login'
                            ? `
                                <br>
                                <span style="
                                    display: inline-block;
                                    margin-top: 5px;
                                    padding: 5px 8px;
                                    border-radius: 6px;
                                    background: #eff6ff;
                                    color: #1d4ed8;
                                    font-size: 0.8em;
                                    font-weight: normal;
                                ">
                                    ℹ️ Thẻ đăng nhập 7 ngày:
                                    chỉ dùng cho vật phẩm đủ điều kiện,
                                    giá tối đa 500 Coin.
                                </span>
                            `
                            : '';

                // XỬ LÝ ĐỌC DANH SÁCH MẢNG VẬT PHẨM
                let targetText =
                    "Tất cả vật phẩm mua bằng Coin";
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
                    giftDisplay = `
    🏷️ Thẻ giảm giá ${msg.giftValue}%
    <span style="font-size: 0.8em; color: #e11d48;">
        ${expStr}
    </span>
    <br>
    <span style="
        font-size: 0.85em;
        color: #059669;
        font-weight: normal;
    ">
        Áp dụng: ${targetText}
    </span>
    ${conditionHTML}
`;
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
                const claimButtonText =
                    msg.giftType ===
                        'birthday_coin'
                        ? '🎂 Nhận Xu Sinh Nhật vào túi'

                        : msg.giftType ===
                            'special_birthday_coin'
                            ? '✨ Nhận Xu Đặc Biệt vào túi'

                            : '🧧 Mở quà & Nhận vào túi';
                btnHTML = `
    <button
        onclick="
            claimGift(
                '${msg._fbKey}',
                '${msg.giftType}',
                '${msg.giftValue}'
            )
        "
        style="
            background:
                linear-gradient(
                    135deg,
                    #11998e 0%,
                    #38ef7d 100%
                );
            width:100%;
            padding:10px;
            border-radius:8px;
            font-weight:bold;
            border:none;
            color:white;
            cursor:pointer;
            box-shadow:
                0 4px 10px
                rgba(17,153,142,0.3);
        "
    >
        ${claimButtonText}
    </button>
`;
            }
        } else {
            const claimButtonText =
                msg.giftType === 'birthday_coin'
                    ? '🎂 Nhận Xu Sinh Nhật vào túi'
                    : '🧧 Mở quà & Nhận vào túi';
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

window.claimGift = async function (msgKey, clientGiftType, clientGiftValue) {
    try {
        // 1. TẢI DỮ LIỆU GỐC TỪ FIREBASE ĐỂ XÁC MINH (Source of Truth)
        const msgSnap = await db.ref(`inbox_messages/${currentUser.username}/${msgKey}`).once('value');
        const msgData = msgSnap.val();

        // 2. KIỂM TRA BẢO MẬT: Bức thư có thực sự tồn tại không?
        if (!msgData) {
            alert("❌ Thư này không tồn tại hoặc đã bị thu hồi!");
            return;
        }

        // 3. GHI ĐÈ THAM SỐ TỪ CLIENT BẰNG DỮ LIỆU CHUẨN TỪ DATABASE
        const giftType = msgData.giftType;
        const giftValue = msgData.giftValue;

        let claimSucceeded = false;

        let claimedPath = '';

        let claimedExtra = {};

        if (!giftType || giftType === 'none') {
            alert("❌ Bức thư này không chứa quà tặng hợp lệ!");
            return;
        }

        // 4. TIẾN HÀNH TRAO QUÀ DỰA TRÊN DỮ LIỆU AN TOÀN
        if (giftType === 'coin') {
            const coinRef = db.ref('student_coins/' + currentUser.username);
            const snap = await coinRef.once('value');
            await coinRef.set(
                (snap.val() || 0) +
                parseInt(giftValue)
            );

            claimSucceeded = true;

            claimedPath =
                `student_coins/${currentUser.username}`;

            alert(
                `🎉 Bạn đã nhận được ` +
                `${parseInt(giftValue).toLocaleString('vi-VN')} Coin!`
            );

        } else if (
            giftType === 'birthday_coin'
        ) {
            const birthdayYear =
                Number(
                    msgData.birthdayYear ||
                    giftValue
                );

            if (
                !Number.isInteger(
                    birthdayYear
                ) ||
                birthdayYear < 2026 ||
                birthdayYear > 9999
            ) {
                throw new Error(
                    'INVALID_BIRTHDAY_YEAR'
                );
            }

            const birthdayCoinRef = db.ref(
                `birthday_coins/` +
                `${currentUser.username}/` +
                `${birthdayYear}`
            );

            const coinTx =
                await birthdayCoinRef.transaction(
                    current => {
                        // Một năm chỉ tạo một ví xu.
                        if (current !== null) {
                            return;
                        }

                        return {
                            year:
                                String(birthdayYear),

                            balance: 1,

                            status:
                                'available',

                            claimedAt:
                                firebase.database
                                    .ServerValue
                                    .TIMESTAMP,

                            sourceMessageId:
                                msgKey
                        };
                    }
                );

            if (!coinTx.committed) {
                alert(
                    `🎂 Xu Sinh Nhật ${birthdayYear} ` +
                    'đã được nhận trước đó.'
                );
            } else {
                // Đánh dấu nhận quà thành công để ghi nhật ký
                claimSucceeded = true;

                claimedPath =
                    `birthday_coins/` +
                    `${currentUser.username}/` +
                    `${birthdayYear}`;

                claimedExtra = {
                    birthdayYear:
                        birthdayYear,

                    balance:
                        1,

                    sourceMessageId:
                        msgKey
                };

                window.studentBirthdayWallets[
                    String(birthdayYear)
                ] = coinTx.snapshot.val();

                window.studentBirthdayCoins[
                    String(birthdayYear)
                ] = 1;

                alert(
                    `🎉 Bạn đã nhận 1 Xu Sinh Nhật ${birthdayYear}!\n` +
                    'Xu đã được lưu trong Túi đồ và chỉ đổi được ' +
                    `vật phẩm Sinh nhật ${birthdayYear}.`
                );
            }
        } else if (
            giftType ===
            'special_birthday_coin'
        ) {
            const quantity =
                parseInt(giftValue, 10);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > 50
            ) {
                throw new Error(
                    'INVALID_SPECIAL_BIRTHDAY_COIN_QUANTITY'
                );
            }

            /*
             * Bắt đầu tính hạn từ lúc
             * học sinh nhấn nhận.
             */
            const claimedAt =
                Date.now();

            const expiresAt =
                claimedAt +
                5 *
                24 *
                60 *
                60 *
                1000;

            const grantRef = db.ref(
                `student_special_birthday_coins/` +
                `${currentUser.username}/` +
                `${msgKey}`
            );

            const grantTx =
                await grantRef.transaction(
                    current => {
                        // Chặn nhận trùng cùng một thư.
                        if (current !== null) {
                            return;
                        }

                        return {
                            id: msgKey,
                            quantity,
                            remaining:
                                quantity,

                            status:
                                'available',

                            claimedAt,
                            expiresAt,

                            source:
                                'teacher_gift',

                            sourceMessageId:
                                msgKey
                        };
                    }
                );

            if (!grantTx.committed) {
                alert(
                    '✨ Xu Đặc Biệt trong thư này đã được nhận trước đó.'
                );
            } else {
                // Đánh dấu nhận quà thành công để ghi nhật ký
                claimSucceeded = true;

                claimedPath =
                    `student_special_birthday_coins/` +
                    `${currentUser.username}/` +
                    `${msgKey}`;

                claimedExtra = {
                    quantity:
                        quantity,

                    remaining:
                        quantity,

                    claimedAt:
                        claimedAt,

                    expiresAt:
                        expiresAt,

                    sourceMessageId:
                        msgKey
                };

                window
                    .studentSpecialBirthdayCoinGrants[
                    msgKey
                ] =
                    grantTx.snapshot.val();

                window
                    .studentSpecialBirthdayCoinCount =
                    getUsableSpecialBirthdayCoinCount(
                        window
                            .studentSpecialBirthdayCoinGrants
                    );

                alert(
                    `✨ Bạn đã nhận ${quantity} Xu Đặc Biệt!\n` +
                    `Hạn dùng đến: ` +
                    `${new Date(expiresAt).toLocaleString('vi-VN')}\n` +
                    `Có thể đổi vật phẩm tag Sinh nhật không phân biệt năm.`
                );
            }
        } else if (giftType === 'money') {
            const offsetRef = db.ref('student_money_offset/' + currentUser.username);
            const snap = await offsetRef.once('value');
            await offsetRef.set((snap.val() || 0) + parseInt(giftValue));
            claimSucceeded = true;

            claimedPath =
                `student_money_offset/${currentUser.username}`;
            alert(`🎉 Bạn đã nhận được ${parseInt(giftValue).toLocaleString('vi-VN')} đ vào Tiền Lộ trình!`);
            if (typeof renderStudentRoadmap === 'function') renderStudentRoadmap();

        } else if (giftType === 'ticket') {
            const ticketRef = db.ref('student_bonus_tickets/' + currentUser.username);
            const snap = await ticketRef.once('value');
            await ticketRef.set((snap.val() || 0) + parseInt(giftValue));
            claimSucceeded = true;

            claimedPath =
                `student_bonus_tickets/${currentUser.username}`;
            alert(`🎉 Bạn đã nhận được ${parseInt(giftValue)} Vé quay may mắn!`);

        } else if (giftType === 'item') {
            const giftItemPath =
                `student_inventory/` +
                `${currentUser.username}/` +
                `${giftValue}`;

            await db
                .ref(giftItemPath)
                .update({
                    id:
                        giftValue,

                    purchaseTime:
                        Date.now(),

                    source:
                        'teacher_gift',

                    originMessageKey:
                        msgKey,

                    isTrial:
                        null,

                    trialExpiry:
                        null,

                    isEquipped:
                        false
                });

            claimSucceeded = true;

            claimedPath =
                giftItemPath;

            const claimedStoreItem =
                StoreConfig.items.find(
                    item =>
                        String(item.id) ===
                        String(giftValue)
                );

            claimedExtra = {
                itemId:
                    giftValue,

                itemName:
                    claimedStoreItem?.name ||
                    giftValue
            };
            alert(`🎉 Vật phẩm đã được thêm vào Túi đồ của bạn!`);

        } else if (giftType === 'discount') {
            const expiry = (msgData.discountExpiry) ? msgData.discountExpiry : null;

            // Xử lý đọc dạng mảng
            let targetArr = msgData.discountTargetItem ? msgData.discountTargetItem : ['all'];
            if (!Array.isArray(targetArr)) targetArr = [targetArr];
            targetArr = targetArr.map(
                normalizeStoreItemId
            );

            if (expiry && Date.now() > expiry) {
                alert("❌ Thẻ giảm giá này đã quá hạn sử dụng, hệ thống không thể thêm vào túi đồ!");
                await db.ref(`inbox_messages/${currentUser.username}/${msgKey}`).remove();
                return;
            }

            const discountRef =
                db.ref(
                    `student_discounts/${currentUser.username}`
                ).push();

            await discountRef.set({
                percent:
                    parseInt(giftValue),

                dateAcquired:
                    Date.now(),

                isUsed:
                    false,

                expiry:
                    expiry,

                targetItem:
                    targetArr,

                discountScope:
                    msgData.discountScope ||
                    (
                        targetArr.includes('all')
                            ? 'all_coin'
                            : 'selected_coin_items'
                    ),

                source:
                    msgData.source ||
                    'teacher_gift',

                originMessageKey:
                    msgKey
            });

            claimSucceeded = true;

            claimedPath =
                `student_discounts/` +
                `${currentUser.username}/` +
                `${discountRef.key}`;

            claimedExtra = {
                discountKey:
                    discountRef.key,

                percent:
                    parseInt(giftValue),

                expiry:
                    expiry,

                targetItem:
                    targetArr
            };
            alert(`🎉 Bạn đã nhận được Thẻ giảm giá ${giftValue}%!`);
        }

        if (
            claimSucceeded &&
            window.TransactionHistory
        ) {
            let giftDescription = '';

            let logAmount = null;

            let logUnit = '';

            if (giftType === 'coin') {
                logAmount =
                    Number(giftValue);

                logUnit =
                    'Coin';

                giftDescription =
                    `${logAmount.toLocaleString('vi-VN')} Coin`;

            } else if (giftType === 'money') {
                logAmount =
                    Number(giftValue);

                logUnit =
                    'đồng';

                giftDescription =
                    `${logAmount.toLocaleString('vi-VN')} đồng Tiền lộ trình`;

            } else if (giftType === 'ticket') {
                logAmount =
                    Number(giftValue);

                logUnit =
                    'Vé';

                giftDescription =
                    `${logAmount} Vé quay may mắn`;

            } else if (giftType === 'discount') {
                logAmount =
                    Number(giftValue);

                logUnit =
                    '%';

                giftDescription =
                    `Thẻ giảm giá ${logAmount}%`;

            } else if (
                giftType ===
                'birthday_coin'
            ) {
                logAmount =
                    1;

                logUnit =
                    'Xu Sinh Nhật';

                giftDescription =
                    `1 Xu Sinh Nhật ${msgData.birthdayYear ||
                    giftValue
                    }`;

            } else if (
                giftType ===
                'special_birthday_coin'
            ) {
                logAmount =
                    Number(giftValue);

                logUnit =
                    'Xu Đặc Biệt';

                giftDescription =
                    `${logAmount} Xu Đặc Biệt`;

            } else if (
                giftType === 'item'
            ) {
                const item =
                    StoreConfig.items.find(
                        storeItem =>
                            String(
                                storeItem.id
                            ) ===
                            String(giftValue)
                    );

                giftDescription =
                    `vật phẩm ${item?.name ||
                    giftValue
                    }`;
            }

            await window
                .TransactionHistory
                .recordSafe({
                    type:
                        'gift_claimed',

                    summary:
                        `Nhận ${giftDescription} ` +
                        `qua thư giáo viên`,

                    source:
                        msgData.source ||
                        'teacher_gift',

                    targetUsername:
                        currentUser.username,

                    targetName:
                        currentUser.name ||
                        currentUser.username,

                    amount:
                        logAmount,

                    unit:
                        logUnit,

                    reversible:
                        false,

                    nonReversibleReason:
                        'Quà đã được nhận và có thể đã được sử dụng.',

                    details: {
                        messageId:
                            msgKey,

                        messagePath:
                            `inbox_messages/` +
                            `${currentUser.username}/` +
                            `${msgKey}`,

                        giftType:
                            giftType,

                        giftValue:
                            giftValue,

                        giftDescription:
                            giftDescription,

                        claimedPath:
                            claimedPath,

                        message:
                            msgData.message ||
                            '',

                        ...claimedExtra
                    }
                });
        }

        // 5. XÓA THƯ SAU KHI NHẬN QUÀ THÀNH CÔNG VÀ LÀM MỚI GIAO DIỆN
        await db.ref(`inbox_messages/${currentUser.username}/${msgKey}`).remove();
        if (typeof renderStudentInbox === 'function') renderStudentInbox();

    } catch (error) {
        console.error(error);

        if (
            error.message ===
            'INVALID_BIRTHDAY_YEAR'
        ) {
            alert(
                '❌ Thư Xu Sinh Nhật có mã năm không hợp lệ.'
            );
        } else {
            alert(
                '❌ Có lỗi xảy ra khi nhận quà. ' +
                'Vui lòng thử lại mạng!'
            );
        }
    }
};

window.deleteMessage = async function (msgKey) {
    await db.ref(`inbox_messages/${currentUser.username}/${msgKey}`).remove();
};

// =============================================================
// GIỚI HẠN THỜI GIAN LÀM BÀI THI
// TÍNH TỪ LÚC VÀO TOÀN MÀN HÌNH
// =============================================================

window.examTimeLimitTimers =
    window.examTimeLimitTimers || {};

window.examTimeLimitSubmitting =
    window.examTimeLimitSubmitting || {};

window.examTimeLimitExpiredPending =
    window.examTimeLimitExpiredPending || {};


window.getExamTimeLimitMinutes = function (
    assignment
) {
    if (
        !assignment ||
        assignment.assessmentType !== 'thi' ||
        assignment.examTimeLimitEnabled !== true
    ) {
        return 0;
    }

    const minutes = Number(
        assignment.examTimeLimitMinutes
    );

    return (
        Number.isFinite(minutes) &&
        minutes > 0
    )
        ? minutes
        : 0;
};


window.getExamTimeLimitDeadline = function (
    assignment,
    session = {}
) {
    const minutes =
        window.getExamTimeLimitMinutes(
            assignment
        );

    if (!minutes) {
        return null;
    }

    const startedAt = Number(
        session.startedAtLocal ||
        session.startedAt ||
        session.localMarker?.startedAtLocal ||
        0
    );

    if (!startedAt) {
        return null;
    }

    let deadline =
        startedAt + minutes * 60000;

    // Hạn nộp chung vẫn có hiệu lực
    // nếu đến trước giới hạn làm bài.
    if (assignment.endDate) {
        const assignmentEnd = new Date(
            assignment.endDate.replace(
                ' ',
                'T'
            )
        ).getTime();

        if (Number.isFinite(assignmentEnd)) {
            deadline = Math.min(
                deadline,
                assignmentEnd
            );
        }
    }

    return deadline;
};


window.formatExamTimeRemaining = function (
    milliseconds
) {
    const safeMs = Math.max(
        0,
        Number(milliseconds) || 0
    );

    const totalSeconds =
        Math.ceil(safeMs / 1000);

    const days =
        Math.floor(totalSeconds / 86400);

    const hours =
        Math.floor(
            (totalSeconds % 86400) / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    const clock = [
        hours,
        minutes,
        seconds
    ]
        .map(value =>
            String(value).padStart(2, '0')
        )
        .join(':');

    return days > 0
        ? `${days} ngày ${clock}`
        : clock;
};


window.ensureExamTimeLimitBadge = function (
    assignId
) {
    let badge =
        document.getElementById(
            'examTimeLimitBadge'
        );

    if (!badge) {
        badge =
            document.createElement('div');

        badge.id = 'examTimeLimitBadge';
        badge.className = 'ui-theme-immune';

        badge.style.cssText = `
            position: fixed;
            top: 16px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999998;
            min-width: 250px;
            padding: 10px 18px;
            border-radius: 999px;
            background: rgba(127, 29, 29, 0.94);
            color: white;
            text-align: center;
            font-weight: 900;
            box-shadow:
                0 8px 25px
                rgba(127, 29, 29, 0.35);
            border:
                2px solid
                rgba(255, 255, 255, 0.85);
            pointer-events: none;
        `;

        document.body.appendChild(badge);
    }

    badge.dataset.assignmentId =
        String(assignId);

    badge.style.display = 'block';

    return badge;
};


window.stopExamTimeLimitCountdown = function (
    assignId
) {
    const key =
        assignId !== undefined &&
            assignId !== null

            ? String(assignId)
            : null;

    if (
        key &&
        window.examTimeLimitTimers[key]
    ) {
        clearInterval(
            window.examTimeLimitTimers[key]
        );

        delete window.examTimeLimitTimers[key];
    }

    const badge =
        document.getElementById(
            'examTimeLimitBadge'
        );

    if (
        badge &&
        (
            !key ||
            badge.dataset.assignmentId === key
        )
    ) {
        badge.remove();
    }
};


window.handleExamTimeLimitExpired =
    async function (assignId) {
        const key = String(assignId);

        if (
            window.examTimeLimitSubmitting[key]
        ) {
            return;
        }

        window.examTimeLimitSubmitting[key] = true;

        window.examTimeLimitExpiredPending[key] =
            true;

        window.isFinalizingExamSubmission = true;

        window.stopExamTimeLimitCountdown(key);

        window.setInterruptedExamLock?.(
            key,
            true
        );

        if (
            typeof window.showToast === 'function'
        ) {
            window.showToast(
                '⏱️ Đã hết thời gian làm bài. Hệ thống đang tự động thu bài; đây không phải lỗi vi phạm.',
                'warning'
            );
        }

        try {
            /*
             * isAuto = true
             * isCheat = false
             *
             * Tự thu nhưng không tính gian lận.
             */
            await submitAssignment(
                key,
                true,
                false
            );

            window.examTimeLimitExpiredPending[key] =
                false;

        } catch (error) {
            console.error(
                'Không thể tự thu bài khi hết giới hạn thời gian:',
                error
            );

            if (
                typeof window.showToast ===
                'function'
            ) {
                window.showToast(
                    'Mất kết nối khi tự thu bài. Bản nháp vẫn được giữ và hệ thống sẽ thử lại.',
                    'error'
                );
            }

            setTimeout(() => {
                window.handleExamTimeLimitExpired(
                    key
                );
            }, 5000);

        } finally {
            window.examTimeLimitSubmitting[key] =
                false;

            window.isFinalizingExamSubmission =
                Object.values(
                    window.examTimeLimitExpiredPending ||
                    {}
                ).some(Boolean);
        }
    };


window.startExamTimeLimitCountdown =
    function (
        assignId,
        assignment
    ) {
        const key = String(assignId);

        window.stopExamTimeLimitCountdown(key);

        const minutes =
            window.getExamTimeLimitMinutes(
                assignment
            );

        if (!minutes) {
            return;
        }

        const marker =
            window.examRecoveryManager
                ?.getMarker(key) || {};

        const deadline =
            window.getExamTimeLimitDeadline(
                assignment,
                marker
            );

        if (!deadline) {
            return;
        }

        const badge =
            window.ensureExamTimeLimitBadge(key);

        const updateCountdown = () => {
            const remaining =
                deadline - Date.now();

            badge.innerHTML = `
            <span style="
                opacity: 0.85;
                font-size: 0.82em;
            ">
                ⏱️ THỜI GIAN LÀM BÀI CÒN
            </span>

            <br>

            <span style="
                font-size: 1.35em;
                letter-spacing: 1px;
            ">
                ${window
                    .formatExamTimeRemaining(
                        remaining
                    )
                }
            </span>
        `;

            if (remaining <= 0) {
                window.stopExamTimeLimitCountdown(
                    key
                );

                window.handleExamTimeLimitExpired(
                    key
                );
            }
        };

        updateCountdown();

        if (
            !window.examTimeLimitSubmitting[key]
        ) {
            window.examTimeLimitTimers[key] =
                setInterval(
                    updateCountdown,
                    1000
                );
        }
    };

// =============================================================
// PHỤC HỒI BÀI THI KHI MẤT MẠNG / SẬP MÁY
// =============================================================
window.examRecoveryManager = {
    syncTimers: {},
    heartbeatTimer: null,
    recoveryPromptOpened: false,

    markerKey(assignId) {
        return `exam_session_${currentUser.username}_${assignId}`;
    },

    draftKey(assignId) {
        return `draft_${currentUser.username}_${assignId}`;
    },

    firebasePath(assignId) {
        return `exam_sessions/${currentUser.username}/${assignId}`;
    },

    getMarker(assignId) {
        try {
            return JSON.parse(
                localStorage.getItem(this.markerKey(assignId))
            ) || {};
        } catch (error) {
            return {};
        }
    },

    getDraft(assignId) {
        try {
            return JSON.parse(
                localStorage.getItem(this.draftKey(assignId))
            ) || {
                mcAnswers: {},
                essay: ''
            };
        } catch (error) {
            return {
                mcAnswers: {},
                essay: ''
            };
        }
    },

    saveMarker(assignId, patch = {}) {
        const oldMarker = this.getMarker(assignId);

        const marker = {
            ...oldMarker,
            ...patch,
            assignmentId: String(assignId),
            username: currentUser.username,
            updatedAtLocal: Date.now()
        };

        localStorage.setItem(
            this.markerKey(assignId),
            JSON.stringify(marker)
        );

        return marker;
    },

    async sync(assignId, patch = {}) {
        const draft = this.getDraft(assignId);
        const marker = this.saveMarker(assignId, patch);

        const payload = {
            assignmentId: String(assignId),
            username: currentUser.username,
            status: marker.status || 'active',
            mcAnswers: draft.mcAnswers || {},
            essay: draft.essay || '',
            interruptionCount:
                Number(marker.interruptionCount) || 0,
            resumeCount:
                Number(marker.resumeCount) || 0,
            lastReason: marker.lastReason || '',

            startedAt: Number(
                marker.startedAtLocal ||
                marker.startedAt ||
                0
            ),

            updatedAt:
                firebase.database.ServerValue.TIMESTAMP
        };

        try {
            await db
                .ref(this.firebasePath(assignId))
                .update(payload);
        } catch (error) {
            // Không xóa localStorage.
            // Khi có mạng lại sẽ đồng bộ tiếp.
            console.warn(
                'Chưa thể đồng bộ phiên thi:',
                error
            );
        }
    },

    queueSync(assignId) {
        clearTimeout(this.syncTimers[assignId]);

        this.syncTimers[assignId] = setTimeout(() => {
            this.sync(assignId);
        }, 1000);
    },

    start(assignId, isResume = false) {
        const oldMarker = this.getMarker(assignId);

        const resumeCount =
            Number(oldMarker.resumeCount || 0) +
            (isResume ? 1 : 0);

        const startedAtLocal = Number(
            oldMarker.startedAtLocal ||
            oldMarker.startedAt ||
            Date.now()
        );

        this.saveMarker(assignId, {
            status: 'active',
            startedAtLocal,
            resumeCount
        });

        this.sync(assignId, {
            status: 'active',
            startedAtLocal,
            resumeCount
        });

        clearInterval(this.heartbeatTimer);

        this.heartbeatTimer = setInterval(() => {
            if (
                String(window.currentActiveExamId) ===
                String(assignId)
            ) {
                this.sync(assignId, {
                    status: 'active'
                });
            }
        }, 10000);
    },

    interrupt(assignId, reason) {
        const oldMarker = this.getMarker(assignId);

        const interruptionCount =
            Number(oldMarker.interruptionCount || 0) + 1;

        this.saveMarker(assignId, {
            status: 'interrupted',
            interruptionCount,
            lastReason: reason,
            interruptedAtLocal: Date.now()
        });

        this.sync(assignId, {
            status: 'interrupted',
            interruptionCount,
            lastReason: reason
        });

        return interruptionCount;
    },

    async complete(assignId) {
        clearInterval(this.heartbeatTimer);
        clearTimeout(this.syncTimers[assignId]);

        try {
            await db
                .ref(this.firebasePath(assignId))
                .update({
                    status: 'submitted',
                    updatedAt:
                        firebase.database.ServerValue.TIMESTAMP
                });
        } catch (error) {
            console.warn(
                'Không thể đánh dấu phiên đã nộp:',
                error
            );
        }

        localStorage.removeItem(this.markerKey(assignId));
        localStorage.removeItem(this.draftKey(assignId));
    }
};

// Có mạng lại thì đồng bộ ngay bài đang làm
window.addEventListener('online', () => {
    const assignId = window.currentActiveExamId;

    if (assignId && window.examRecoveryManager) {
        window.examRecoveryManager.sync(assignId, {
            status: 'active'
        });
    }
});

// =============================================================
// KHÔI PHỤC BÀI THI SAU KHI TẢI LẠI TRANG / SẬP MÁY
// =============================================================
window.restoreInterruptedExam = async function () {
    const manager = window.examRecoveryManager;

    if (
        !manager ||
        manager.recoveryPromptOpened ||
        window.currentActiveExamId ||
        window.isRestoringExam
    ) {
        return;
    }

    // Chờ cả danh sách bài thi và bài nộp được tải xong
    if (
        !Array.isArray(window.cachedAssignments) ||
        !Array.isArray(window.cachedSubmissions)
    ) {
        return;
    }

    window.isRestoringExam = true;

    try {
        const sessions = {};
        const markerPrefix =
            `exam_session_${currentUser.username}_`;

        // 1. Đọc phiên thi còn lưu trên máy
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (!key || !key.startsWith(markerPrefix)) {
                continue;
            }

            try {
                const marker =
                    JSON.parse(localStorage.getItem(key));

                if (
                    marker &&
                    (
                        marker.status === 'active' ||
                        marker.status === 'interrupted'
                    )
                ) {
                    const assignId = String(
                        marker.assignmentId ||
                        key.substring(markerPrefix.length)
                    );

                    sessions[assignId] = {
                        ...marker,
                        assignmentId: assignId,
                        localMarker: marker
                    };
                }
            } catch (error) {
                console.warn(
                    'Không thể đọc phiên thi trên máy:',
                    error
                );
            }
        }

        // 2. Đọc phiên đã đồng bộ trên Firebase
        try {
            const snapshot = await db
                .ref(`exam_sessions/${currentUser.username}`)
                .once('value');

            snapshot.forEach(child => {
                const remoteSession = child.val() || {};
                const assignId = String(
                    remoteSession.assignmentId ||
                    child.key
                );

                if (
                    remoteSession.status !== 'active' &&
                    remoteSession.status !== 'interrupted'
                ) {
                    return;
                }

                const localSession = sessions[assignId] || {};

                sessions[assignId] = {
                    ...remoteSession,
                    ...localSession,
                    assignmentId: assignId,

                    // Giữ riêng phần đáp án trên Firebase
                    remoteDraft: {
                        mcAnswers:
                            remoteSession.mcAnswers || {},
                        essay:
                            remoteSession.essay || ''
                    },

                    remoteUpdatedAt:
                        Number(remoteSession.updatedAt) || 0
                };
            });
        } catch (error) {
            // Mất mạng vẫn có thể phục hồi bằng localStorage
            console.warn(
                'Chưa thể đọc phiên thi trên Firebase:',
                error
            );
        }

        const resumableSessions = [];
        const expiredTimeLimitSessions = [];
        let restoredAnyDraft = false;

        Object.values(sessions).forEach(session => {
            const assignId = String(session.assignmentId);

            const assignment =
                window.cachedAssignments.find(
                    item =>
                        String(item.id) === assignId
                );

            // Chỉ phục hồi bài thi nghiêm ngặt
            if (
                !assignment ||
                assignment.assessmentType !== 'thi'
            ) {
                return;
            }

            const submission =
                window.cachedSubmissions.find(
                    item =>
                        String(item.assignmentId) === assignId &&
                        item.studentUsername ===
                        currentUser.username
                );

            // Đã nộp xong thì xóa dấu phiên cũ trên máy
            if (submission && !submission.isRedoing) {
                localStorage.removeItem(
                    manager.markerKey(assignId)
                );
                return;
            }

            // 3. Ghép đáp án Firebase với đáp án trên máy
            // Dữ liệu trên máy được ưu tiên nếu cùng câu hỏi
            const localDraft =
                manager.getDraft(assignId);

            const remoteDraft =
                session.remoteDraft || {
                    mcAnswers:
                        session.mcAnswers || {},
                    essay:
                        session.essay || ''
                };

            const mergedDraft = {
                mcAnswers: {
                    ...(remoteDraft.mcAnswers || {}),
                    ...(localDraft.mcAnswers || {})
                },

                essay:
                    localDraft.essay ||
                    remoteDraft.essay ||
                    ''
            };

            localStorage.setItem(
                manager.draftKey(assignId),
                JSON.stringify(mergedDraft)
            );

            const restoredStartedAt = Number(
                session.startedAtLocal ||
                session.startedAt ||
                session.localMarker
                    ?.startedAtLocal ||
                Date.now()
            );

            manager.saveMarker(assignId, {
                status: 'interrupted',
                startedAtLocal:
                    restoredStartedAt,

                interruptionCount:
                    Number(session.interruptionCount) || 0,

                resumeCount:
                    Number(session.resumeCount) || 0,

                lastReason:
                    session.lastReason ||
                    'page-reloaded'
            });

            restoredAnyDraft = true;

            const assignmentEndTime =
                assignment.endDate

                    ? new Date(
                        assignment.endDate.replace(
                            ' ',
                            'T'
                        )
                    ).getTime()

                    : new Date(
                        '2100-01-01'
                    ).getTime();

            const timeLimitDeadline =
                window.getExamTimeLimitDeadline(
                    assignment,
                    {
                        ...session,
                        startedAtLocal:
                            restoredStartedAt
                    }
                );

            const effectiveEndTime =
                timeLimitDeadline

                    ? Math.min(
                        assignmentEndTime,
                        timeLimitDeadline
                    )

                    : assignmentEndTime;

            if (
                Date.now() <= effectiveEndTime
            ) {
                resumableSessions.push({
                    assignment,
                    session
                });

            } else if (
                timeLimitDeadline &&
                timeLimitDeadline <=
                assignmentEndTime &&
                Date.now() > timeLimitDeadline
            ) {
                /*
                 * Giới hạn thời gian từ lúc bắt đầu
                 * đã hết trước hạn nộp chung.
                 */
                expiredTimeLimitSessions.push({
                    assignment,
                    session
                });
            }
        });

        // Render lại để radio và phần tự luận nhận bản nháp
        if (restoredAnyDraft) {
            await loadAssignments();
        }

        for (
            const expiredSession
            of expiredTimeLimitSessions
        ) {
            await window
                .handleExamTimeLimitExpired(
                    String(
                        expiredSession
                            .assignment
                            .id
                    )
                );
        }

        if (resumableSessions.length === 0) {
            return;
        }

        // Ưu tiên phiên cập nhật gần nhất
        resumableSessions.sort((a, b) => {
            const timeA = Number(
                a.session.updatedAtLocal ||
                a.session.remoteUpdatedAt ||
                0
            );

            const timeB = Number(
                b.session.updatedAtLocal ||
                b.session.remoteUpdatedAt ||
                0
            );

            return timeB - timeA;
        });

        const selected =
            resumableSessions[0].assignment;

        manager.recoveryPromptOpened = true;

        window.showExamWarning(
            String(selected.id),
            true
        );

        if (
            typeof window.showToast ===
            'function'
        ) {
            window.showToast(
                `Phát hiện bài thi "${selected.title}" bị gián đoạn. Hãy bấm Tiếp tục thi để vào lại toàn màn hình.`,
                'warning'
            );
        }
    } catch (error) {
        console.error(
            'Không thể phục hồi phiên thi:',
            error
        );
    } finally {
        window.isRestoringExam = false;
    }
};

// ================= HỆ THỐNG THI TOÀN MÀN HÌNH =================
window.currentActiveExamId = null;
window.pendingExamId = null;
window.pendingExamIsResume = false;

// ======================================================
// BẢO VỆ THAO TÁC NỘP BÀI HỢP LỆ
// Không tính confirm, lỗi tải file hoặc lỗi mạng là vi phạm
// ======================================================

window.isManualExamSubmissionProcessing = false;
window.isSubmissionResumeRequired = false;
window.manualExamSubmissionId = null;

window.beginManualExamSubmission = function (
    assignId
) {
    const key = String(assignId);

    if (
        window.currentActiveExamId &&
        String(window.currentActiveExamId) === key
    ) {
        window.isManualExamSubmissionProcessing =
            true;

        window.manualExamSubmissionId = key;
    }
};


window.showSafeSubmissionResume = function (
    assignId
) {
    const key = String(assignId);

    if (
        !window.currentActiveExamId ||
        String(window.currentActiveExamId) !== key ||
        document.fullscreenElement
    ) {
        window.isSubmissionResumeRequired =
            false;

        return;
    }

    window.isSubmissionResumeRequired = true;

    let overlay =
        document.getElementById(
            'submissionResumeOverlay'
        );

    if (!overlay) {
        overlay = document.createElement('div');

        overlay.id =
            'submissionResumeOverlay';

        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 10000000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 18px;
            padding: 25px;
            background: rgba(0, 0, 0, 0.93);
            color: white;
            text-align: center;
        `;

        overlay.innerHTML = `
            <h2 style="
                margin: 0;
                color: #fda4af;
            ">
                ⚠️ Bài chưa được nộp thành công
            </h2>

            <p style="
                max-width: 650px;
                margin: 0;
                line-height: 1.6;
            ">
                Bạn đã hủy xác nhận hoặc hệ thống gặp lỗi
                khi tải và lưu bài.

                <br><br>

                Bài làm và các file đã chọn vẫn được giữ.
                Trường hợp này không được tính là vi phạm.
            </p>

            <button type="button"
                id="btnResumeAfterSubmitError"
                style="
                    max-width: 650px;
                    padding: 16px 25px;
                    border: none;
                    border-radius: 999px;
                    background:
                        linear-gradient(
                            135deg,
                            #e11d48,
                            #ff4d4d
                        );
                    color: white;
                    font-size: 1.05em;
                    font-weight: 800;
                    cursor: pointer;
                ">
                🚀 Trở lại toàn màn hình và tiếp tục thi
            </button>
        `;

        document.body.appendChild(overlay);

        const resumeButton =
            document.getElementById(
                'btnResumeAfterSubmitError'
            );

        resumeButton.onclick = async function () {
            this.disabled = true;

            this.innerText =
                '⏳ Đang trở lại toàn màn hình...';

            try {
                const element =
                    document.documentElement;

                if (element.requestFullscreen) {
                    await element.requestFullscreen();

                } else if (
                    element.webkitRequestFullscreen
                ) {
                    await element
                        .webkitRequestFullscreen();

                } else if (
                    element.msRequestFullscreen
                ) {
                    await element
                        .msRequestFullscreen();
                }

                if (!document.fullscreenElement) {
                    throw new Error(
                        'FULLSCREEN_NOT_ENTERED'
                    );
                }

                window.isSubmissionResumeRequired =
                    false;

                overlay.remove();

            } catch (error) {
                console.error(
                    'Không thể trở lại toàn màn hình:',
                    error
                );

                this.disabled = false;

                this.innerText =
                    '🚀 Thử lại chế độ toàn màn hình';
            }
        };
    }

    overlay.style.display = 'flex';
};


window.endManualExamSubmission = function (
    assignId
) {
    const key = String(assignId);

    const sameActiveExam =
        window.currentActiveExamId &&
        String(window.currentActiveExamId) === key;

    const needsFullscreenResume =
        sameActiveExam &&
        !document.fullscreenElement;

    /*
     * Đặt cờ resume trước khi bỏ cờ processing
     * để không có khoảng trống bị tính nhầm vi phạm.
     */
    window.isSubmissionResumeRequired =
        needsFullscreenResume;

    window.isManualExamSubmissionProcessing =
        false;

    window.manualExamSubmissionId = null;

    if (needsFullscreenResume) {
        setTimeout(() => {
            window.showSafeSubmissionResume(key);
        }, 50);
    }
};


window.handleManualExamSubmissionError =
    function (
        assignId,
        error
    ) {
        console.error(
            'Nộp bài chưa thành công:',
            error
        );

        if (
            typeof window.showToast === 'function'
        ) {
            window.showToast(
                'Nộp bài chưa thành công. Bài làm và file đã chọn vẫn được giữ; hãy thử lại.',
                'error'
            );
        }
    };

// Kết thúc thống nhất mọi trường hợp:
// nộp bài, hết giờ, vi phạm, thoát toàn màn hình...
window.finishStudentExamMode = async function (
    assignId,
    options = {}
) {
    const {
        exitFullscreen = true
    } = options;

    // Không kết thúc nhầm bài thi khác
    if (
        assignId &&
        window.currentActiveExamId &&
        window.currentActiveExamId !== assignId
    ) {
        return;
    }

    const examIdToFinish = String(
        assignId ||
        window.currentActiveExamId ||
        ''
    );

    // Dọn trạng thái bảo vệ thao tác nộp bài
    window.isManualExamSubmissionProcessing =
        false;

    window.isSubmissionResumeRequired =
        false;

    window.manualExamSubmissionId = null;

    const submissionOverlay =
        document.getElementById(
            'submissionResumeOverlay'
        );

    if (submissionOverlay) {
        submissionOverlay.remove();
    }

    if (examIdToFinish) {
        window.stopExamTimeLimitCountdown(
            examIdToFinish
        );
    }

    // Phải reset trước khi thoát fullscreen
    // để fullscreenchange không bắt vi phạm lần nữa
    window.currentActiveExamId = null;

    // Gỡ kính mờ đang khóa các bài tập khác
    document
        .querySelectorAll('.exam-lock-overlay')
        .forEach(overlay => {
            overlay.remove();
        });

    // Khôi phục sự kiện click ban đầu của tiêu đề bài tập
    document
        .querySelectorAll(
            '.accordion-header[data-old-onclick]'
        )
        .forEach(header => {
            const oldOnclick =
                header.dataset.oldOnclick;

            if (
                oldOnclick &&
                oldOnclick !== 'null'
            ) {
                header.setAttribute(
                    'onclick',
                    oldOnclick
                );
            } else {
                header.removeAttribute('onclick');
            }

            delete header.dataset.oldOnclick;
        });

    // Mở lại menu và nút đăng xuất
    document
        .querySelectorAll('.nav-item, .btn-logout')
        .forEach(btn => {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        });

    if (
        exitFullscreen &&
        document.fullscreenElement
    ) {
        try {
            await document.exitFullscreen();
        } catch (error) {
            console.warn(
                'Không thể thoát toàn màn hình:',
                error
            );
        }
    }

    // Bật lại pet và hiệu ứng
    if (
        typeof window.restoreExamVisualItems === 'function'
    ) {
        window.restoreExamVisualItems();
    }
};

window.setInterruptedExamLock = function (
    assignId,
    locked
) {
    const content = document.getElementById(
        `exam-content-${assignId}`
    );

    if (!content) return;

    if (locked) {
        content.dataset.interruptedLocked = 'true';
        content.style.pointerEvents = 'none';
        content.style.userSelect = 'none';
        content.style.opacity = '0.35';
        content.style.filter = 'blur(2px)';
    } else {
        delete content.dataset.interruptedLocked;
        content.style.pointerEvents = '';
        content.style.userSelect = '';
        content.style.opacity = '';
        content.style.filter = '';
    }
};

window.showExamWarning = function (
    assignId,
    isResume = false
) {
    window.pendingExamId = String(assignId);
    window.pendingExamIsResume = !!isResume;

    const modal =
        document.getElementById('examWarningModal');

    if (!modal) return;

    // Tìm vùng nội dung chính của modal
    const modalContent =
        modal.querySelector('.modal-content') ||
        modal.firstElementChild ||
        modal;

    // Tạo vùng cảnh báo gián đoạn nếu chưa có
    let resumeNotice =
        document.getElementById(
            'interruptedExamWarning'
        );

    if (!resumeNotice) {
        resumeNotice =
            document.createElement('div');

        resumeNotice.id =
            'interruptedExamWarning';

        resumeNotice.style.cssText = `
            display: none;
            margin: 15px 0;
            padding: 16px;
            border: 2px solid #e11d48;
            border-radius: 12px;
            background: rgba(225, 29, 72, 0.1);
            color: #991b1b;
            line-height: 1.6;
            font-weight: 600;
        `;

        resumeNotice.innerHTML = `
            <div style="
                font-size: 1.1em;
                font-weight: 800;
                margin-bottom: 8px;
            ">
                ⚠️ BÀI THI ĐÃ BỊ GIÁN ĐOẠN
            </div>

            <div>
                Bản nháp và các đáp án đã làm được
                hệ thống bảo vệ.
            </div>

            <div style="margin-top: 6px;">
                Bạn bắt buộc phải bấm
                <strong>Tiếp tục thi</strong>
                và vào lại chế độ toàn màn hình
                mới có thể tiếp tục làm bài.
            </div>

            <div style="
                margin-top: 8px;
                color: #e11d48;
                font-weight: 800;
            ">
                Không được phép tiếp tục làm bài
                bên ngoài chế độ toàn màn hình.
            </div>
        `;

        // Chèn trước khu vực các nút nếu tìm được
        const buttonArea =
            modalContent.querySelector(
                '.modal-actions, .modal-buttons, .button-group'
            );

        if (buttonArea) {
            modalContent.insertBefore(
                resumeNotice,
                buttonArea
            );
        } else {
            modalContent.appendChild(
                resumeNotice
            );
        }
    }

    const cancelButton =
        modal.querySelector(
            'button[onclick*="closeExamWarning"]'
        );

    const startButton =
        modal.querySelector(
            'button[onclick*="startExamFullscreen"]'
        );

    // Lưu giao diện nút ban đầu
    if (
        cancelButton &&
        cancelButton.dataset.originalDisplay ===
        undefined
    ) {
        cancelButton.dataset.originalDisplay =
            cancelButton.style.display || '';
    }

    if (
        startButton &&
        !startButton.dataset.originalText
    ) {
        startButton.dataset.originalText =
            startButton.innerHTML;
    }

    if (isResume) {
        // Khóa phần làm bài
        window.setInterruptedExamLock(
            assignId,
            true
        );

        resumeNotice.style.display = 'block';

        // Không hiện nút Hủy khi phục hồi
        if (cancelButton) {
            cancelButton.style.display = 'none';
        }

        if (startButton) {
            startButton.innerHTML =
                '🔒 Tiếp tục thi trong toàn màn hình';
        }
    } else {
        resumeNotice.style.display = 'none';

        // Khôi phục giao diện khi bắt đầu bài mới
        if (cancelButton) {
            cancelButton.style.display =
                cancelButton.dataset
                    .originalDisplay || '';
        }

        if (
            startButton &&
            startButton.dataset.originalText
        ) {
            startButton.innerHTML =
                startButton.dataset.originalText;
        }
    }

    // Hiện giới hạn thời gian trước khi học sinh bắt đầu thi
    const warningAssignment =
        Array.isArray(window.cachedAssignments)
            ? window.cachedAssignments.find(
                item =>
                    String(item.id) ===
                    String(assignId)
            )
            : null;

    const configuredMinutes =
        typeof window.getExamTimeLimitMinutes ===
            'function'

            ? window.getExamTimeLimitMinutes(
                warningAssignment
            )

            : (
                warningAssignment
                    ?.examTimeLimitEnabled === true

                    ? Number(
                        warningAssignment
                            .examTimeLimitMinutes
                    ) || 0

                    : 0
            );

    let timeLimitWarning =
        document.getElementById(
            'examTimeLimitWarningInfo'
        );

    if (!timeLimitWarning) {
        timeLimitWarning =
            document.createElement('div');

        timeLimitWarning.id =
            'examTimeLimitWarningInfo';

        timeLimitWarning.style.cssText = `
            display: none;
            margin: 15px 0;
            padding: 14px;
            border-radius: 12px;
            background: rgba(245, 158, 11, 0.13);
            border: 2px solid rgba(245, 158, 11, 0.55);
            color: #92400e;
            font-weight: 700;
            line-height: 1.55;
            text-align: left;
        `;

        const actionArea =
            modalContent.querySelector(
                '.modal-actions, ' +
                '.modal-buttons, ' +
                '.button-group'
            );

        if (actionArea) {
            modalContent.insertBefore(
                timeLimitWarning,
                actionArea
            );
        } else {
            modalContent.appendChild(
                timeLimitWarning
            );
        }
    }

    if (
        Number.isFinite(configuredMinutes) &&
        configuredMinutes > 0
    ) {
        timeLimitWarning.style.display =
            'block';

        timeLimitWarning.innerHTML = `
            <div style="
                font-size: 1.08em;
                font-weight: 900;
                margin-bottom: 5px;
            ">
                ⏱️ Thời gian làm bài:
                ${configuredMinutes} phút
            </div>

            <div>
                Đồng hồ bắt đầu đếm ngay khi bạn
                vào chế độ toàn màn hình.
                Hết giờ, hệ thống sẽ tự động thu bài
                và không tính là lỗi vi phạm.
            </div>
        `;
    } else {
        timeLimitWarning.style.display =
            'none';

        timeLimitWarning.innerHTML = '';
    }

    modal.classList.add('active');
};

window.closeExamWarning = function (
    forceClose = false
) {
    const modal =
        document.getElementById('examWarningModal');

    // Không cho đóng modal khi bài đang chờ phục hồi
    if (
        window.pendingExamIsResume === true &&
        forceClose !== true
    ) {
        if (modal) {
            modal.classList.add('active');
        }

        if (
            typeof window.showToast ===
            'function'
        ) {
            window.showToast(
                'Bạn phải bấm Tiếp tục thi và vào lại toàn màn hình.',
                'warning'
            );
        }

        return false;
    }

    window.pendingExamId = null;
    window.pendingExamIsResume = false;

    if (modal) {
        modal.classList.remove('active');

        const resumeNotice =
            document.getElementById(
                'interruptedExamWarning'
            );

        if (resumeNotice) {
            resumeNotice.style.display = 'none';
        }

        const cancelButton =
            modal.querySelector(
                'button[onclick*="closeExamWarning"]'
            );

        const startButton =
            modal.querySelector(
                'button[onclick*="startExamFullscreen"]'
            );

        if (cancelButton) {
            cancelButton.style.display =
                cancelButton.dataset
                    .originalDisplay || '';
        }

        if (
            startButton &&
            startButton.dataset.originalText
        ) {
            startButton.innerHTML =
                startButton.dataset.originalText;
        }
    }

    return true;
};

window.startExamFullscreen = async function (
    isResume = false
) {
    if (!window.pendingExamId) return;

    isResume =
        isResume ||
        window.pendingExamIsResume === true;

    const assignId =
        String(window.pendingExamId);

    const assignment =
        Array.isArray(window.cachedAssignments)
            ? window.cachedAssignments.find(
                a =>
                    String(a.id) ===
                    String(assignId)
            )
            : null;

    if (!assignment) {
        alert(
            "❌ Không tìm thấy dữ liệu bài thi. " +
            "Vui lòng tải lại trang rồi thử lại."
        );

        closeExamWarning();
        return;
    }

    if (
        !isResume &&
        assignment.watchCondition &&
        assignment.watchCondition > 0
    ) {
        try {
            const trackingSnapshot = await db
                .ref(`video_tracking/${assignId}/${currentUser.username}`)
                .once('value');

            const watchedSeconds =
                Number(trackingSnapshot.val()) || 0;

            if (watchedSeconds < assignment.watchCondition) {
                alert(
                    `⚠️ Bạn chưa hoàn thành thời lượng xem video.\n\n` +
                    `Đã xem: ${formatSecondsToDHMS(watchedSeconds)}\n` +
                    `Yêu cầu: ${formatSecondsToDHMS(assignment.watchCondition)}`
                );

                return;
            }
        } catch (error) {
            console.error(
                'Không thể kiểm tra điều kiện video:',
                error
            );

            alert(
                '❌ Không thể xác minh thời lượng xem video. ' +
                'Bài thi chưa được bắt đầu.'
            );

            return;
        }
    }

    try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen(); // Safari
        else if (elem.msRequestFullscreen) await elem.msRequestFullscreen(); // Edge cũ

        setTimeout(() => {
            // Chỉ xác nhận bắt đầu thi sau khi fullscreen thành công
            if (!document.fullscreenElement) {
                window.currentActiveExamId = null;

                alert(
                    "⚠️ Chế độ toàn màn hình đã bị thoát. " +
                    "Bài thi chưa được bắt đầu."
                );

                closeExamWarning();
                return;
            }

            window.currentActiveExamId = assignId;

            window.examRecoveryManager.start(
                assignId,
                isResume
            );

            window.startExamTimeLimitCountdown(
                assignId,
                assignment
            );

            window.setInterruptedExamLock(
                assignId,
                false
            );

            // Tạm tắt pet và hiệu ứng
            if (
                typeof window.suspendExamVisualItems === 'function'
            ) {
                window.suspendExamVisualItems();
            }

            // Ẩn toàn bộ khu vực video trước bài thi
            const preExamArea =
                document.getElementById(`pre-exam-area-${assignId}`);

            if (preExamArea) {
                preExamArea.style.display = 'none';
            }

            // Dừng bộ đếm thời gian video
            if (watchTimers[assignId]) {
                clearInterval(watchTimers[assignId]);
                delete watchTimers[assignId];
            }

            // Hủy hoàn toàn iframe YouTube.
            // Sau thời điểm này học sinh không thể bấm logo YouTube.
            if (ytPlayers[assignId]) {
                try {
                    if (
                        typeof ytPlayers[assignId].pauseVideo === 'function'
                    ) {
                        ytPlayers[assignId].pauseVideo();
                    }

                    if (
                        typeof ytPlayers[assignId].destroy === 'function'
                    ) {
                        ytPlayers[assignId].destroy();
                    }
                } catch (error) {
                    console.warn(
                        'Không thể hủy YouTube Player:',
                        error
                    );
                }

                delete ytPlayers[assignId];
            }

            // Phòng trường hợp API Player chưa khởi tạo nhưng iframe đã tồn tại
            const remainingIframe =
                document.getElementById(`yt-player-${assignId}`);

            if (remainingIframe) {
                remainingIframe.remove();
            }

            const wrapper = document.getElementById(`exam-wrapper-${assignId}`);
            const content = document.getElementById(`exam-content-${assignId}`);

            if (wrapper) wrapper.style.display = 'none';
            if (content) content.style.display = 'block';

            closeExamWarning(true);

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

// ==============================================================
// PHÂN BIỆT ĐIỆN THOẠI / ZALO VÀ CHỐNG ĐẾM TRÙNG GIÁN ĐOẠN
// ==============================================================
window.isMobileExamEnvironment = function () {
    const userAgent = String(
        navigator.userAgent || ''
    );

    const userAgentDataMobile =
        navigator.userAgentData?.mobile === true;

    const mobileUserAgent =
        /Android|iPhone|iPad|iPod|Mobile|Zalo/i.test(
            userAgent
        );

    // iPadOS đôi khi tự nhận là máy Mac.
    const isIPadOS =
        navigator.platform === 'MacIntel' &&
        Number(navigator.maxTouchPoints || 0) > 1;

    return (
        userAgentDataMobile ||
        mobileUserAgent ||
        isIPadOS
    );
};


// Ngăn blur và fullscreenchange của cùng một sự cố
// bị hệ thống đếm thành hai lần khác nhau.
window.examInterruptionGuard = {
    lastExamId: '',
    lastAt: 0,
    windowMs: 2500,

    isDuplicate(assignId) {
        const now = Date.now();
        const examId = String(assignId || '');

        const duplicated =
            this.lastExamId === examId &&
            now - this.lastAt < this.windowMs;

        if (!duplicated) {
            this.lastExamId = examId;
            this.lastAt = now;
        }

        return duplicated;
    }
};


// Điện thoại/Zalo chỉ lưu trạng thái gián đoạn,
// không tăng interruptionCount.
window.recordSoftExamInterruption = async function (
    assignId,
    reason
) {
    const manager =
        window.examRecoveryManager;

    const oldMarker =
        manager.getMarker(assignId);

    const interruptionCount =
        Number(
            oldMarker.interruptionCount || 0
        );

    await manager.sync(assignId, {
        status: 'interrupted',
        interruptionCount,
        lastReason:
            `mobile-system-${reason}`,
        interruptedAtLocal: Date.now()
    });

    return interruptionCount;
};


// Lắng nghe khi học sinh thoát toàn màn hình
document.addEventListener(
    'fullscreenchange',
    () => {
        if (
            window.isSelectingFile ||
            window.isFinalizingExamSubmission ||
            window.isManualExamSubmissionProcessing ||
            window.isSubmissionResumeRequired
        ) {
            return;
        }

        if (
            !document.fullscreenElement &&
            window.currentActiveExamId
        ) {
            window.handleExamInterruption(
                'fullscreen',
                {
                    // Máy tính: vẫn tính vi phạm.
                    // Điện thoại/Zalo: chỉ tạm dừng.
                    countAsViolation:
                        !window.isMobileExamEnvironment()
                }
            );
        }
    }
);

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
    if (
        window.examRecoveryManager &&
        String(window.currentActiveExamId) === String(assignId)
    ) {
        window.examRecoveryManager.queueSync(assignId);
    }
};

// Bắt sự kiện chuyển tab hoặc thu nhỏ trình duyệt
document.addEventListener(
    'visibilitychange',
    () => {
        if (document.hidden) {
            EffectManager.stopIntervals();
            return;
        }

        const activeEffect =
            localStorage.getItem('active_effect');

        if (!activeEffect) {
            EffectManager.clearEffects();
            return;
        }

        const effectDefinition =
            typeof StoreManager !== 'undefined'
                ? StoreManager.getItemById(activeEffect)
                : null;

        /*
         * Kiểm tra hiệu ứng có thực sự đang
         * được trang bị trong túi đồ hay không.
         */
        const inventory =
            typeof myInventory !== 'undefined' &&
                Array.isArray(myInventory)
                ? myInventory
                : [];

        const isActuallyEquipped =
            effectDefinition?.type === 'effect' &&
            inventory.some(invItem =>
                invItem.id === activeEffect &&
                invItem.isEquipped === true
            );

        if (!isActuallyEquipped) {
            EffectManager.clearEffects(true);
            return;
        }

        EffectManager.applyEffect(activeEffect);
    }
);

// ==============================================================
// ĐOẠN CODE FIX LỖI PHÍM WINDOWS VÀ HÌNH-TRONG-HÌNH (THÊM MỚI)
// ==============================================================

// 1. Bắt sự kiện nhấn phím Windows, mở Start Menu, thanh Taskbar (Mất tiêu điểm)
window.addEventListener('blur', () => {
    if (
        window.isSelectingFile ||
        window.isFinalizingExamSubmission ||
        window.isManualExamSubmissionProcessing ||
        window.isSubmissionResumeRequired
    ) {
        return;
    }

    // Không xử lý khi học sinh đang tương tác với iframe hợp lệ
    if (
        document.activeElement &&
        document.activeElement.tagName === 'IFRAME'
    ) {
        return;
    }

    if (window.currentActiveExamId) {
        window.handleExamInterruption(
            'window-blur',
            {
                // Điện thoại và Zalo không tính blur
                // là hành vi gian lận.
                countAsViolation:
                    !window.isMobileExamEnvironment()
            }
        );
    }
});

// 2. Chặn gian lận bằng chế độ Hình-Trong-Hình (PiP)
document.addEventListener(
    'enterpictureinpicture',
    () => {
        if (window.currentActiveExamId) {
            const assignId =
                window.currentActiveExamId;

            document
                .exitPictureInPicture()
                .catch(console.error);

            window.finishStudentExamMode(assignId);

            alert(
                "⚠️ VI PHẠM BẢO MẬT: Không được phép sử dụng " +
                "Hình-trong-Hình (PiP) khi đang thi!"
            );

            submitAssignment(assignId, true, true);
        }
    }
);

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
    const modal =
        document.getElementById('royalRewardsModal');

    if (!modal) {
        console.error(
            'Không tìm thấy popup royalRewardsModal'
        );
        return;
    }

    const modalContent =
        modal.querySelector('.modal-content');

    if (!modalContent) {
        console.error(
            'Không tìm thấy .modal-content trong royalRewardsModal'
        );
        return;
    }

    const escapeHTML = value => {
        return String(value ?? '').replace(
            /[&<>"']/g,
            character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            })[character]
        );
    };

    const getSafeImageURL = value => {
        let url = String(value || '')
            .trim()
            .replace(/\\/g, '/');

        if (!url) return '';

        // Chặn URL nguy hiểm
        if (
            /^javascript:/i.test(url) ||
            /^vbscript:/i.test(url)
        ) {
            return '';
        }

        // Ảnh base64
        if (/^data:image\//i.test(url)) {
            return url;
        }

        // Link mạng hoặc blob
        if (/^(https?:\/\/|blob:)/i.test(url)) {
            return url;
        }

        /*
         * Cho phép đường dẫn ảnh nội bộ:
         * assets/...
         * ./assets/...
         * ../assets/...
         * /assets/...
         */
        if (
            url.startsWith('assets/') ||
            url.startsWith('./') ||
            url.startsWith('../') ||
            url.startsWith('/')
        ) {
            return encodeURI(url);
        }

        return '';
    };

    const storeItems =
        typeof StoreConfig !== 'undefined' &&
            Array.isArray(StoreConfig.items)
            ? StoreConfig.items
            : [];

    const legendaryItems = storeItems.filter(item =>
        item &&
        item.tag &&
        String(item.tag)
            .toLowerCase()
            .includes('truyền thuyết')
    );

    const ownedItemIds = new Set();

    if (
        typeof myInventory !== 'undefined' &&
        Array.isArray(myInventory)
    ) {
        myInventory.forEach(item => {
            if (item?.id) {
                ownedItemIds.add(String(item.id));
            }
        });
    }

    const settings =
        typeof RoyalBallEvent !== 'undefined' &&
            RoyalBallEvent.currentSettings
            ? RoyalBallEvent.currentSettings
            : {
                probItem: 5,
                probCoin: 95
            };

    const itemProbability =
        Number(settings.probItem) || 5;

    const coinProbability =
        Number(settings.probCoin) || 95;

    const itemCards = legendaryItems.map(item => {
        const itemId = String(item.id || '');
        const isOwned = ownedItemIds.has(itemId);

        let typeIcon = '🎁';
        let typeName = 'Vật phẩm';

        if (item.type === 'theme') {
            typeIcon = '🎨';
            typeName = 'Giao diện';
        } else if (item.type === 'effect') {
            typeIcon = '✨';
            typeName = 'Hiệu ứng';
        } else if (item.type === 'pet') {
            typeIcon = '🐾';
            typeName = 'Thú cưng';
        } else if (item.type === 'music') {
            typeIcon = '🎵';
            typeName = 'Nhạc nền';
        } else if (item.type === 'avatar') {
            typeIcon = '👑';
            typeName = 'Ảnh đại diện';
        }

        const rawImageSource =
            item.asset ||
            item.image ||
            item.imageUrl ||
            item.thumbnail ||
            item.value ||
            '';

        const shouldUseImage =
            item.isIcon === false ||
            item.type === 'pet';

        const imageURL =
            shouldUseImage
                ? getSafeImageURL(rawImageSource)
                : '';

        const visual = imageURL
            ? `
                <img
    src="${imageURL}"
    alt="${escapeHTML(item.name)}"
    class="royal-preview-pet-image"
    loading="lazy"
    draggable="false"
    onerror="
        console.warn(
            'Không tải được ảnh vật phẩm:',
            this.src
        );

        this.style.display='none';

        if (this.nextElementSibling) {
            this.nextElementSibling.style.display='grid';
        }
    "
>

                <span
                    class="royal-preview-fallback"
                    style="display:none;"
                >
                    ${typeIcon}
                </span>
            `
            : `
                <span class="royal-preview-icon">
                    ${escapeHTML(
                item.customIcon ||
                item.icon ||
                typeIcon
            )
            }
                </span>
            `;

        return `
            <article
                class="
                    royal-preview-item-card
                    ${isOwned
                ? 'royal-preview-owned'
                : ''
            }
                "
            >
                <div class="royal-preview-item-shine"></div>

                <div class="royal-preview-visual">
                    ${visual}
                </div>

                <div class="royal-preview-item-info">
                    <div class="royal-preview-item-top">
                        <span class="royal-preview-type">
                            ${typeIcon}
                            ${escapeHTML(typeName)}
                        </span>

                        ${isOwned
                ? `
                                    <span
                                        class="royal-preview-owned-badge"
                                    >
                                        ✓ Đã sở hữu
                                    </span>
                                `
                : `
                                    <span
                                        class="royal-preview-new-badge"
                                    >
                                        Có thể nhận
                                    </span>
                                `
            }
                    </div>

                    <h4>
                        ${escapeHTML(item.name)}
                    </h4>

                    <div class="royal-preview-legendary-tag">
                        <span>✦</span>
                        Truyền Thuyết
                        <span>✦</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    modalContent.classList.add(
        'royal-rewards-premium'
    );

    modalContent.innerHTML = `
        <button
            type="button"
            class="royal-preview-close"
            aria-label="Đóng"
            onclick="
                document
                    .getElementById('royalRewardsModal')
                    .classList.remove('active')
            "
        >
            ×
        </button>

        <div class="royal-preview-background">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
        </div>

        <header class="royal-preview-header">
            <div class="royal-preview-crown">
                ♛
            </div>

            <div class="royal-preview-kicker">
                Kho báu Hoàng gia
            </div>

            <h2>
                🎁 Phần Thưởng Dạ Hội
            </h2>

            <p>
                Tham gia khiêu vũ để có cơ hội nhận
                lượng lớn Coin hoặc các vật phẩm mang
                nhãn <strong>Truyền Thuyết</strong>
                cực hiếm dưới đây.
            </p>
        </header>

        <section class="royal-preview-probability">
            <div class="royal-preview-prob-card coin">
                <span class="royal-preview-prob-icon">
                    🪙
                </span>

                <div>
                    <small>Cơ hội nhận Coin</small>
                    <strong>
                        ${coinProbability}%
                    </strong>

                    <p>
                        Nhận ngẫu nhiên từ
                        <b>100–1.000 Coin</b>
                    </p>
                </div>
            </div>

            <div class="royal-preview-prob-card item">
                <span class="royal-preview-prob-icon">
                    💎
                </span>

                <div>
                    <small>Cơ hội vật phẩm</small>
                    <strong>
                        ${itemProbability}%
                    </strong>

                    <p>
                        Vật phẩm Truyền Thuyết cực hiếm
                    </p>
                </div>
            </div>
        </section>

        <div class="royal-preview-notice">
            <span>♕</span>

            <p>
                Mỗi học sinh được tham gia
                <strong>1 lần mỗi ngày</strong>.
                Vật phẩm bị trùng sẽ được đổi thành
                <strong>500 Coin</strong>.
            </p>
        </div>

        <div class="royal-preview-section-title">
            <span></span>

            <h3>
                Tủ đồ Truyền Thuyết
            </h3>

            <span></span>
        </div>

        <section
            id="royalRewardsList"
            class="royal-preview-list"
        >
            ${itemCards ||
        `
                    <div class="royal-preview-empty">
                        <div>🔒</div>

                        <strong>
                            Kho báu đang được cập nhật
                        </strong>

                        <p>
                            Hiện chưa có vật phẩm
                            Truyền Thuyết nào trong hệ thống.
                        </p>
                    </div>
                `
        }
        </section>

        <footer class="royal-preview-footer">
            <button
                type="button"
                onclick="
                    document
                        .getElementById('royalRewardsModal')
                        .classList.remove('active')
                "
            >
                <span>♛</span>
                Đã xem phần thưởng
            </button>
        </footer>
    `;

    modal.classList.add('active');
};

// HÀM HIỂN THỊ THÔNG TIN CHI TIẾT THẺ GIẢM GIÁ ĐANG CHỌN
window.showSelectedDiscountInfo = function () {
    const select = document.getElementById('checkoutDiscount');

    if (
        !select ||
        select.selectedIndex <= 0 ||
        select.value === '0'
    ) {
        alert(
            'Vui lòng nhấp vào ô bên dưới để chọn một thẻ giảm giá trước khi xem thông tin nhé!'
        );
        return;
    }

    const option = select.options[select.selectedIndex];

    const percent =
        option.getAttribute('data-percent');

    const expiry =
        option.getAttribute('data-expiry');

    const targetStr =
        option.getAttribute('data-target');

    /*
 * Các thẻ cũ chưa có source được xem là thẻ giáo viên tặng.
 * Chỉ dùng để xác định nội dung hiển thị.
 */

    const discountSource =
        option.getAttribute('data-source') ||
        'teacher_gift';

    const isDailyLoginDiscount =
        discountSource === 'daily_login';

    const isTeacherGiftDiscount =
        discountSource === 'teacher_gift';

    const isHoiHoaRunnerUpDiscount =
        discountSource === 'hoihoa_runner_up' ||
        discountSource === 'hoihoa_season';

    const isHoiHoaChestDiscount =
        discountSource === 'hoihoa_chest';

    const sourceText =
        isTeacherGiftDiscount
            ? 'Giáo viên tặng qua thư'
            : isDailyLoginDiscount
                ? 'Phần thưởng đăng nhập đủ 7 ngày'
                : isHoiHoaRunnerUpDiscount
                    ? 'Phần thưởng Á quân mùa giải Hội Họa'
                    : isHoiHoaChestDiscount
                        ? 'Mở Rương Kho Báu Hội Họa'
                        : 'Phần thưởng hệ thống';

    const conditionText =
        isTeacherGiftDiscount
            ? 'Chỉ áp dụng cho vật phẩm mua bằng Coin có giá từ 1 đến 699 Coin. Không áp dụng cho vật phẩm có giá từ 700 Coin trở lên.'
            : isDailyLoginDiscount
                ? 'Chỉ áp dụng cho vật phẩm thông thường có giá từ 1 đến 500 Coin; không áp dụng cho vật phẩm sự kiện, tag Doraemon và tag Truyền thuyết,...'
                : isHoiHoaRunnerUpDiscount
                    ? 'Dùng 1 lần. Chỉ áp dụng cho vật phẩm bán bằng Coin có giá dưới 600 Coin; không áp dụng cho vật phẩm sự kiện, tag Doraemon và tag Truyền thuyết,...'
                    : isHoiHoaChestDiscount
                        ? 'Dùng 1 lần. Chỉ áp dụng cho vật phẩm bán bằng Coin có giá dưới 700 Coin; không áp dụng cho vật phẩm sự kiện, tag Doraemon và tag Truyền thuyết,...'
                        : 'Áp dụng theo danh sách vật phẩm được ghi trên thẻ.';

    const expiryText = expiry
        ? new Date(parseInt(expiry, 10))
            .toLocaleString('vi-VN')
        : 'Vĩnh viễn (Không bao giờ hết hạn)';

    let targetText =
        'Tất cả vật phẩm mua bằng Coin hiện có trong Cửa hàng.';

    /*
     * Chỉ điều chỉnh nội dung HIỂN THỊ cho vé đăng nhập.
     * Không thay đổi targetItem, Firebase hoặc logic thanh toán.
     */
    if (
        isDailyLoginDiscount &&
        (!targetStr || targetStr === 'all')
    ) {
        targetText =
            'Tất cả vật phẩm bán bằng Coin, ngoại trừ vật phẩm sự kiện, tag Doraemon và tag Truyền thuyết.';
    } else if (
        isHoiHoaRunnerUpDiscount &&
        (!targetStr || targetStr === 'all')
    ) {
        targetText =
            'Vật phẩm bán bằng Coin có giá từ 1 đến 599 Coin, ngoại trừ vật phẩm sự kiện, tag Doraemon và tag Truyền thuyết.';
    } else if (
        isHoiHoaChestDiscount &&
        (!targetStr || targetStr === 'all')
    ) {
        targetText =
            'Vật phẩm bán bằng Coin có giá từ 1 đến 699 Coin, ngoại trừ vật phẩm sự kiện, tag Doraemon và tag Truyền thuyết.';
    } else if (
        targetStr &&
        targetStr !== 'all'
    ) {
        const targetIds = targetStr
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);

        const visibleItems = targetIds
            .map(id => {
                if (typeof StoreConfig === 'undefined') {
                    return null;
                }

                return StoreConfig.items.find(
                    item => String(item.id) === String(id)
                ) || null;
            })
            .filter(item => {
                if (!item) return false;

                // Các vé khác giữ nguyên danh sách hiển thị.
                if (!isDailyLoginDiscount) {
                    return true;
                }

                // Chỉ ẩn khỏi phần chi tiết của vé đăng nhập.
                return (
                    item.isNonCoin !== true &&
                    item.tag !== 'Doraemon' &&
                    item.tag !== 'Truyền thuyết'
                );
            });

        const itemNamesHTML = visibleItems
            .map(item => {
                return `
                    <li style="margin-bottom: 4px;">
                        [${item.tag}] ${item.name}
                    </li>
                `;
            })
            .join('');

        if (itemNamesHTML) {
            targetText = `
                Chỉ áp dụng khi mua:
                <br>
                <ul style="
                    color: #c0392b;
                    padding-left: 20px;
                    margin-top: 5px;
                    max-height: 120px;
                    overflow-y: auto;
                    font-weight: bold;
                ">
                    ${itemNamesHTML}
                </ul>
            `;
        } else {
            targetText =
                'Thẻ này hiện không có vật phẩm phù hợp trong Cửa hàng.';
        }
    }

    const infoHtml = `
        <div
            id="discountInfoModal"
            class="modal-overlay"
            style="
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.4);
            "
        >
            <div style="
                background: white;
                padding: 20px;
                border-radius: 12px;
                width: 340px;
                max-width: 90%;
                text-align: left;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                border-left: 5px solid #00acc1;
                animation: scaleIn 0.2s ease;
            ">
                <h4 style="
                    margin: 0 0 15px 0;
                    color: #00838f;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 1.2em;
                ">
                    ℹ️ Chi tiết Thẻ giảm giá
                </h4>

                <p style="
                    margin: 0 0 10px 0;
                    font-size: 0.95em;
                    color: #444;
                ">
                    <strong>Mức giảm giá:</strong>

                    <span style="
                        color: #e11d48;
                        font-weight: bold;
                        font-size: 1.1em;
                    ">
                        ${percent}%
                    </span>
                </p>

                <p style="
                    margin: 0 0 10px 0;
                    font-size: 0.95em;
                    color: #444;
                ">
                    <strong>Hạn sử dụng:</strong>

                    <span style="color: #d35400;">
                        ${expiryText}
                    </span>
                </p>

                                <p style="
                    margin: 0 0 10px 0;
                    font-size: 0.95em;
                    color: #444;
                ">
                    <strong>Nguồn thẻ:</strong>

                    <span style="
                        color: #2563eb;
                        font-weight: bold;
                    ">
                        ${sourceText}
                    </span>
                </p>

                <div style="
                    margin: 0 0 15px 0;
                    padding: 10px 12px;
                    border-radius: 8px;
                    background: #fff7ed;
                    border: 1px solid #fdba74;
                    color: #c2410c;
                    font-size: 0.9em;
                    line-height: 1.5;
                ">
                    <strong>⚠️ Điều kiện sử dụng:</strong>
                    <br>
                    ${conditionText}
                </div>

                <p style="
                    margin: 0 0 15px 0;
                    font-size: 0.95em;
                    color: #444;
                    line-height: 1.5;
                ">
                    <strong>Phạm vi áp dụng:</strong>
                    <br>

                    <span style="color: #059669;">
                        ${targetText}
                    </span>
                </p>

                <button
                    onclick="
                        document
                            .getElementById('discountInfoModal')
                            .remove()
                    "
                    style="
                        width: 100%;
                        padding: 12px;
                        background: #f1f5f9;
                        border: 1px solid #cbd5e1;
                        border-radius: 8px;
                        font-weight: bold;
                        color: #334155;
                        cursor: pointer;
                        transition: 0.2s;
                    "
                    onmouseover="
                        this.style.background='#e2e8f0'
                    "
                    onmouseout="
                        this.style.background='#f1f5f9'
                    "
                >
                    Đã hiểu & Đóng lại
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML(
        'beforeend',
        infoHtml
    );
};

// =============================================================
// ĐỔI XU SINH NHẬT THEO ĐÚNG NĂM
// =============================================================

function normalizeBirthdayTag(value) {
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
}

function getBirthdayRewardItemsForYear(
    year
) {
    const numericYear =
        Number(year);

    if (
        !Number.isInteger(numericYear)
    ) {
        return [];
    }

    const expectedTag =
        normalizeBirthdayTag(
            `Sinh nhật ${numericYear}`
        );

    if (
        typeof StoreConfig ===
        'undefined' ||
        !Array.isArray(
            StoreConfig.items
        )
    ) {
        return [];
    }

    return StoreConfig.items.filter(
        item => {
            return (
                item &&
                item.rewardSource ===
                'birthday_coin' &&
                Number(
                    item.birthdayYear
                ) === numericYear &&
                normalizeBirthdayTag(
                    item.tag
                ) === expectedTag
            );
        }
    );
}

// =============================================================
// ĐỔI XU ĐẶC BIỆT
// =============================================================

function isSpecialBirthdayCoinEligibleItem(
    item
) {
    if (
        !item ||
        item.specialBirthdayCoinEligible ===
        false
    ) {
        return false;
    }

    const normalizedTag =
        normalizeBirthdayTag(item.tag);

    return (
        normalizedTag ===
        'sinh nhat' ||
        normalizedTag.startsWith(
            'sinh nhat '
        )
    );
}

window
    .isSpecialBirthdayCoinEligibleItem =
    isSpecialBirthdayCoinEligibleItem;

window.openSpecialBirthdayStoreFromBag =
    function () {
        window.closeStudentBag();

        const storeButton =
            document.querySelector(
                'button[onclick*="tab-store"]'
            );

        if (storeButton) {
            storeButton.click();
        }

        if (
            typeof window.filterStore ===
            'function'
        ) {
            setTimeout(() => {
                window.filterStore('all');
            }, 0);
        }
    };

async function addSpecialBirthdayItemToInventory(
    username,
    item,
    grantId,
    redemptionId
) {
    const inventoryRef = db.ref(
        `student_inventory/` +
        `${username}/` +
        `${item.id}`
    );

    const inventoryTx =
        await inventoryRef.transaction(
            current => {
                if (current !== null) {
                    return;
                }

                return {
                    id: item.id,

                    purchaseTime:
                        firebase.database
                            .ServerValue
                            .TIMESTAMP,

                    isTrial: null,
                    trialExpiry: null,
                    isEquipped: false,

                    source:
                        'special_birthday_coin',

                    specialCoinGrantId:
                        grantId,

                    specialCoinRedemptionId:
                        redemptionId
                };
            }
        );

    if (inventoryTx.committed) {
        return true;
    }

    return (
        await inventoryRef.once(
            'value'
        )
    ).exists();
}

window
    .recoverSpecialBirthdayRedeemedItems =
    async function (grants = null) {
        if (
            window
                .__specialBirthdayRedeemProcessing ||
            window
                .__specialBirthdayRecoveryRunning
        ) {
            return;
        }

        window
            .__specialBirthdayRecoveryRunning =
            true;

        try {
            const grantData =
                grants ||
                (
                    await db.ref(
                        `student_special_birthday_coins/` +
                        `${currentUser.username}`
                    ).once('value')
                ).val() ||
                {};

            for (
                const [grantId, grant]
                of Object.entries(grantData)
            ) {
                const redemptions =
                    grant?.redemptions || {};

                for (
                    const [
                        redemptionId,
                        redemption
                    ]
                    of Object.entries(
                        redemptions
                    )
                ) {
                    const item =
                        StoreManager.getItemById(
                            redemption?.itemId
                        );

                    if (
                        !item ||
                        !isSpecialBirthdayCoinEligibleItem(
                            item
                        )
                    ) {
                        continue;
                    }

                    try {
                        await addSpecialBirthdayItemToInventory(
                            currentUser.username,
                            item,
                            grantId,
                            redemptionId
                        );
                    } catch (error) {
                        console.warn(
                            'Chưa thể phục hồi vật phẩm Xu Đặc Biệt:',
                            error
                        );
                    }
                }
            }
        } finally {
            window
                .__specialBirthdayRecoveryRunning =
                false;
        }
    };

window.redeemSpecialBirthdayItem =
    async function (itemId) {
        if (
            window
                .__specialBirthdayRedeemProcessing
        ) {
            return;
        }

        const item =
            StoreManager.getItemById(
                itemId
            );

        if (
            !item ||
            !isSpecialBirthdayCoinEligibleItem(
                item
            )
        ) {
            return alert(
                '❌ Vật phẩm này không được đổi bằng Xu Đặc Biệt.'
            );
        }

        const username =
            currentUser.username;

        const inventoryRef = db.ref(
            `student_inventory/` +
            `${username}/` +
            `${itemId}`
        );

        if (
            (
                await inventoryRef.once(
                    'value'
                )
            ).exists()
        ) {
            return alert(
                '🎁 Bạn đã sở hữu vật phẩm này.'
            );
        }

        const grantsRef = db.ref(
            `student_special_birthday_coins/` +
            `${username}`
        );

        const grantsSnapshot =
            await grantsRef.once(
                'value'
            );

        /*
 * Dùng giờ Firebase để không bị permission_denied
 * khi đồng hồ máy học sinh lệch giờ.
 */
        const offsetSnapshot =
            await db.ref(
                '.info/serverTimeOffset'
            ).once('value');

        const serverOffset =
            Number(
                offsetSnapshot.val()
            ) || 0;

        const now =
            Date.now() +
            serverOffset;

        // Ưu tiên dùng xu sắp hết hạn trước.
        const candidates =
            Object.entries(
                grantsSnapshot.val() || {}
            )
                .filter(([, grant]) => {
                    return (
                        grant &&
                        Number(
                            grant.remaining
                        ) > 0 &&
                        Number(
                            grant.expiresAt
                        ) > now
                    );
                })
                .sort((a, b) => {
                    return (
                        Number(
                            a[1].expiresAt
                        ) -
                        Number(
                            b[1].expiresAt
                        )
                    );
                });

        if (candidates.length === 0) {
            return alert(
                '✨ Bạn không có Xu Đặc Biệt còn hạn.'
            );
        }

        if (
            !confirm(
                `Dùng 1 Xu Đặc Biệt để đổi “${item.name}”?`
            )
        ) {
            return;
        }

        window
            .__specialBirthdayRedeemProcessing =
            true;

        let committedGrantId = '';
        let redemptionId = '';

        try {
            for (
                const [grantId]
                of candidates
            ) {
                const grantRef =
                    grantsRef.child(
                        grantId
                    );

                const nextRedemptionId =
                    grantRef
                        .child(
                            'redemptions'
                        )
                        .push()
                        .key;

                const redeemedAt =
                    Date.now() +
                    serverOffset;

                const grantTx =
                    await grantRef.transaction(
                        current => {
                            if (
                                !current ||
                                Number(
                                    current.remaining
                                ) <= 0 ||
                                Number(
                                    current.expiresAt
                                ) <= redeemedAt
                            ) {
                                return;
                            }

                            const remaining =
                                Number(
                                    current.remaining
                                ) - 1;

                            return {
                                ...current,

                                remaining,

                                status:
                                    remaining > 0
                                        ? 'available'
                                        : 'depleted',

                                lastRedemptionId:
                                    nextRedemptionId,

                                redemptions: {
                                    ...(
                                        current.redemptions ||
                                        {}
                                    ),

                                    [nextRedemptionId]: {
                                        itemId,
                                        redeemedAt
                                    }
                                }
                            };
                        }
                    );

                if (grantTx.committed) {
                    committedGrantId =
                        grantId;

                    redemptionId =
                        nextRedemptionId;

                    break;
                }
            }

            if (!committedGrantId) {
                throw new Error(
                    'NO_AVAILABLE_SPECIAL_COIN'
                );
            }

            const inventoryAdded =
                await addSpecialBirthdayItemToInventory(
                    username,
                    item,
                    committedGrantId,
                    redemptionId
                );

            if (!inventoryAdded) {
                throw new Error(
                    'INVENTORY_PENDING'
                );
            }

            if (
                typeof window.loadStoreItems ===
                'function'
            ) {
                await window.loadStoreItems();
            }

            if (
                typeof window.renderStudentBag ===
                'function'
            ) {
                await window
                    .renderStudentBag();
            }

            alert(
                `🎉 Đã đổi thành công “${item.name}” bằng 1 Xu Đặc Biệt!`
            );
        } catch (error) {
            console.error(
                'Lỗi đổi Xu Đặc Biệt:',
                error
            );

            if (committedGrantId) {
                alert(
                    '⚠️ Xu đã được ghi nhận là đã dùng. Hệ thống sẽ tự phục hồi vật phẩm khi mạng ổn định.'
                );
            } else {
                const errorText =
                    String(
                        error?.code ||
                        error?.message ||
                        error
                    ).toLowerCase();

                if (
                    errorText.includes(
                        'permission_denied'
                    ) ||
                    errorText.includes(
                        'permission-denied'
                    )
                ) {
                    alert(
                        '❌ Firebase từ chối giao dịch.\n' +
                        'Hãy kiểm tra danh mục vật phẩm ' +
                        'Xu Đặc Biệt và dữ liệu của xu.'
                    );
                } else {
                    alert(
                        '❌ Không còn Xu Đặc Biệt khả dụng ' +
                        'hoặc xu đã hết hạn.'
                    );
                }
            }
        } finally {
            window
                .__specialBirthdayRedeemProcessing =
                false;
        }
    };

window.closeBirthdayRedeemModal =
    function () {
        const modal =
            document.getElementById(
                'birthdayRedeemModal'
            );

        if (modal) {
            modal.remove();
        }
    };

window.redeemBirthdayCoinFromBag =
    function (year) {
        const items =
            getBirthdayRewardItemsForYear(
                year
            );

        if (items.length === 0) {
            return alert(
                `🎂 Hiện chưa có vật phẩm ` +
                `mang tag Sinh nhật ${year}.`
            );
        }

        if (items.length === 1) {
            window.closeBagItemPopup();

            return window
                .redeemBirthdayItem(
                    items[0].id,
                    Number(year)
                );
        }

        window.closeBirthdayRedeemModal();

        const itemButtons =
            items.map(item => {
                const icon =
                    item.isIcon
                        ? `
                        <span style="font-size:3em;">
                            ${item.value || '🎁'}
                        </span>
                    `
                        : `
                        <img
                            src="${item.value}"
                            alt="${item.name}"
                            style="
                                width:72px;
                                height:72px;
                                object-fit:contain;
                            "
                        >
                    `;

                return `
                <button
                    onclick="
                        window.redeemBirthdayItem(
                            '${item.id}',
                            ${Number(year)}
                        )
                    "
                    style="
                        background:white;
                        border:1px solid #f9a8d4;
                        border-radius:12px;
                        padding:12px;
                        cursor:pointer;
                        text-align:center;
                    "
                >
                    ${icon}

                    <strong style="
                        display:block;
                        margin-top:8px;
                        color:#9d174d;
                    ">
                        ${item.name}
                    </strong>
                </button>
            `;
            }).join('');

        document.body.insertAdjacentHTML(
            'beforeend',
            `
        <div
            id="birthdayRedeemModal"
            class="
                modal-overlay
                active
                ui-theme-immune
            "
            style="z-index:1000001;"
        >
            <div
                class="
                    modal-content
                    form-container
                "
                style="
                    max-width:520px;
                    border-top:
                        6px solid #ec4899;
                "
            >
                <button
                    class="close-btn"
                    onclick="
                        closeBirthdayRedeemModal()
                    "
                >
                    ✖
                </button>

                <h3 style="
                    color:#be185d;
                    margin-bottom:8px;
                ">
                    🎂 Đổi Xu Sinh Nhật
                    ${Number(year)}
                </h3>

                <p style="
                    color:#64748b;
                    margin-bottom:15px;
                ">
                    Chọn đúng 1 vật phẩm.
                    Sau khi đổi, xu
                    ${Number(year)}
                    sẽ được sử dụng hết.
                </p>

                <div style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(150px,1fr)
                        );
                    gap:12px;
                ">
                    ${itemButtons}
                </div>
            </div>
        </div>
        `
        );
    };

async function addBirthdayItemToInventory(
    username,
    item,
    numericYear
) {
    const inventoryRef = db.ref(
        `student_inventory/` +
        `${username}/` +
        `${item.id}`
    );

    const inventoryTx =
        await inventoryRef.transaction(
            current => {
                if (current !== null) {
                    return;
                }

                return {
                    id: item.id,

                    purchaseTime:
                        firebase.database
                            .ServerValue
                            .TIMESTAMP,

                    isTrial: null,
                    trialExpiry: null,
                    isEquipped: false,

                    source:
                        'birthday_coin',

                    birthdayYear:
                        String(
                            numericYear
                        )
                };
            }
        );

    if (inventoryTx.committed) {
        return true;
    }

    return (
        await inventoryRef.once(
            'value'
        )
    ).exists();
}

window.recoverBirthdayRedeemedItems =
    async function (wallets = null) {
        if (
            window
                .__birthdayRecoveryRunning
        ) {
            return;
        }

        window.__birthdayRecoveryRunning =
            true;

        try {
            const walletData =
                wallets ||
                (
                    await db.ref(
                        `birthday_coins/` +
                        `${currentUser.username}`
                    ).once('value')
                ).val() ||
                {};

            for (
                const [year, wallet]
                of Object.entries(
                    walletData
                )
            ) {
                if (
                    !wallet ||
                    typeof wallet !== 'object'
                ) {
                    continue;
                }

                if (
                    wallet.status !==
                    'redeemed' ||
                    !wallet.itemId
                ) {
                    continue;
                }

                const numericYear =
                    Number(year);

                const item =
                    StoreManager.getItemById(
                        wallet.itemId
                    );

                const isEligible =
                    getBirthdayRewardItemsForYear(
                        numericYear
                    ).some(
                        candidate =>
                            candidate.id ===
                            wallet.itemId
                    );

                if (
                    !item ||
                    !isEligible
                ) {
                    continue;
                }

                try {
                    await addBirthdayItemToInventory(
                        currentUser.username,
                        item,
                        numericYear
                    );
                } catch (error) {
                    console.warn(
                        `Chưa thể phục hồi vật phẩm sinh nhật ${year}:`,
                        error
                    );
                }
            }
        } finally {
            window
                .__birthdayRecoveryRunning =
                false;
        }
    };

window.redeemBirthdayItem =
    async function (itemId, year) {
        if (
            window
                .__birthdayRedeemProcessing
        ) {
            return;
        }

        const numericYear =
            Number(year);

        const item =
            StoreManager.getItemById(
                itemId
            );

        const eligibleItems =
            getBirthdayRewardItemsForYear(
                numericYear
            );

        const isEligible =
            eligibleItems.some(
                candidate =>
                    candidate.id === itemId
            );

        if (
            !item ||
            !isEligible
        ) {
            return alert(
                `❌ Vật phẩm này không thuộc ` +
                `tag Sinh nhật ${numericYear}.`
            );
        }

        const username =
            currentUser.username;

        const walletRef = db.ref(
            `birthday_coins/` +
            `${username}/` +
            `${numericYear}`
        );

        const inventoryRef = db.ref(
            `student_inventory/` +
            `${username}/` +
            `${itemId}`
        );

        const existingItemSnap =
            await inventoryRef.once(
                'value'
            );

        if (existingItemSnap.exists()) {
            return alert(
                '🎁 Bạn đã sở hữu vật phẩm này.'
            );
        }

        const walletSnap =
            await walletRef.once(
                'value'
            );

        const wallet =
            walletSnap.val();

        /*
         * Xu đã bị trừ nhưng mất mạng
         * trước khi thêm vật phẩm.
         */
        if (
            wallet &&
            typeof wallet === 'object' &&
            wallet.status === 'redeemed'
        ) {
            if (
                wallet.itemId !== itemId
            ) {
                return alert(
                    `🎂 Xu Sinh Nhật ${numericYear} ` +
                    'đã được dùng cho vật phẩm khác.'
                );
            }

            try {
                await addBirthdayItemToInventory(
                    username,
                    item,
                    numericYear
                );

                window
                    .closeBirthdayRedeemModal();

                window
                    .closeBagItemPopup();

                if (
                    typeof window
                        .loadStoreItems ===
                    'function'
                ) {
                    await window
                        .loadStoreItems();
                }

                if (
                    typeof window
                        .renderStudentBag ===
                    'function'
                ) {
                    await window
                        .renderStudentBag();
                }

                return alert(
                    `🎉 Đã phục hồi “${item.name}” ` +
                    'vào Túi đồ!'
                );
            } catch (error) {
                console.error(
                    'Lỗi phục hồi vật phẩm:',
                    error
                );

                return alert(
                    '❌ Giao dịch đã được ghi nhận ' +
                    'nhưng chưa thể thêm vật phẩm. ' +
                    'Hãy tải lại trang khi mạng ổn định.'
                );
            }
        }

        if (
            getBirthdayCoinBalance(
                wallet
            ) !== 1
        ) {
            return alert(
                `🎂 Bạn không có Xu Sinh Nhật ` +
                `${numericYear} khả dụng.`
            );
        }

        if (
            !confirm(
                `Dùng 1 Xu Sinh Nhật ${numericYear} ` +
                `để đổi “${item.name}”?\n\n` +
                `Xu của năm ${numericYear} ` +
                'chỉ được dùng đúng 1 lần.'
            )
        ) {
            return;
        }

        window
            .__birthdayRedeemProcessing =
            true;

        let walletConsumed = false;

        try {
            const walletTx =
                await walletRef.transaction(
                    current => {
                        // Hỗ trợ dữ liệu số cũ.
                        if (
                            typeof current ===
                            'number'
                        ) {
                            if (
                                Number(current) !==
                                1
                            ) {
                                return;
                            }

                            return {
                                year:
                                    String(
                                        numericYear
                                    ),

                                balance: 0,

                                status:
                                    'redeemed',

                                itemId,

                                claimedAt:
                                    Date.now(),

                                redeemedAt:
                                    firebase.database
                                        .ServerValue
                                        .TIMESTAMP
                            };
                        }

                        if (
                            !current ||
                            typeof current !==
                            'object' ||
                            Number(
                                current.balance
                            ) !== 1 ||
                            current.status !==
                            'available' ||
                            String(
                                current.year
                            ) !==
                            String(
                                numericYear
                            )
                        ) {
                            return;
                        }

                        return {
                            ...current,

                            year:
                                String(
                                    numericYear
                                ),

                            balance: 0,

                            status:
                                'redeemed',

                            itemId,

                            redeemedAt:
                                firebase.database
                                    .ServerValue
                                    .TIMESTAMP
                        };
                    }
                );

            if (!walletTx.committed) {
                throw new Error(
                    'BIRTHDAY_ALREADY_REDEEMED'
                );
            }

            walletConsumed = true;

            const inventoryAdded =
                await addBirthdayItemToInventory(
                    username,
                    item,
                    numericYear
                );

            if (!inventoryAdded) {
                throw new Error(
                    'BIRTHDAY_INVENTORY_PENDING'
                );
            }

            window.studentBirthdayWallets[
                String(numericYear)
            ] = walletTx.snapshot.val();

            window.studentBirthdayCoins[
                String(numericYear)
            ] = 0;

            window
                .closeBirthdayRedeemModal();

            window.closeBagItemPopup();

            if (
                typeof window
                    .loadStoreItems ===
                'function'
            ) {
                await window.loadStoreItems();
            }

            if (
                typeof window
                    .renderStudentBag ===
                'function'
            ) {
                await window
                    .renderStudentBag();
            }

            alert(
                `🎉 Đổi thành công “${item.name}” ` +
                `bằng Xu Sinh Nhật ${numericYear}!`
            );
        } catch (error) {
            console.error(
                'Lỗi đổi Xu Sinh Nhật:',
                error
            );

            if (
                error.message ===
                'BIRTHDAY_ALREADY_REDEEMED'
            ) {
                alert(
                    `🎂 Xu Sinh Nhật ${numericYear} ` +
                    'đã được dùng hoặc đang được ' +
                    'xử lý ở tab khác.'
                );
            } else if (
                walletConsumed ||
                error.message ===
                'BIRTHDAY_INVENTORY_PENDING'
            ) {
                alert(
                    '⚠️ Xu đã được ghi nhận là đã dùng. ' +
                    'Hệ thống sẽ tự phục hồi vật phẩm ' +
                    'vào Túi đồ khi kết nối ổn định.'
                );
            } else {
                alert(
                    '❌ Không thể đổi Xu Sinh Nhật. ' +
                    'Vui lòng kiểm tra mạng và thử lại.'
                );
            }
        } finally {
            window
                .__birthdayRedeemProcessing =
                false;
        }
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

    } else if (
        item.type === 'birthday_coin'
    ) {
        actionButtonHtml = `
        <button
            onclick="
                redeemBirthdayCoinFromBag(
                    ${Number(item.year)}
                )
            "
            style="
                margin-top:15px;
                width:100%;
                background:
                    linear-gradient(
                        135deg,
                        #ec4899 0%,
                        #f97316 100%
                    );
                border:none;
                padding:10px;
                border-radius:8px;
                font-weight:bold;
                color:white;
                cursor:pointer;
                box-shadow:
                    0 4px 10px
                    rgba(236,72,153,0.35);
                font-size:0.95em;
            "
        >
            🎂 Dùng Xu Sinh Nhật
            ${Number(item.year)}
        </button>
    `;
    }
    else if (
        item.type ===
        'special_birthday_coin'
    ) {
        actionButtonHtml =
            item.isExpired
                ? `
                <button
                    disabled
                    style="
                        margin-top:15px;
                        width:100%;
                        background:#cbd5e1;
                        border:none;
                        padding:10px;
                        border-radius:8px;
                        font-weight:bold;
                        color:#64748b;
                        cursor:not-allowed;
                    "
                >
                    ⌛ Xu đã hết hạn
                </button>
            `
                : `
                <button
                    onclick="
                        openSpecialBirthdayStoreFromBag()
                    "
                    style="
                        margin-top:15px;
                        width:100%;
                        background:
                            linear-gradient(
                                135deg,
                                #8b5cf6,
                                #ec4899
                            );
                        border:none;
                        padding:10px;
                        border-radius:8px;
                        font-weight:bold;
                        color:white;
                        cursor:pointer;
                    "
                >
                    ✨ Mở cửa hàng Sinh nhật
                </button>
            `;
    }
    else if (item.type === 'chest') {
        actionButtonHtml = `
            <button onclick="openHoiHoaChest('${item.firebaseKey}')" 
                style="margin-top: 15px; width: 100%; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); border: none; padding: 10px; border-radius: 8px; font-weight: bold; color: #c0392b; cursor: pointer; box-shadow: 0 4px 10px rgba(246, 211, 101, 0.4); font-size: 0.95em; transition: 0.2s;">
                🎁 Mở Rương Ngay
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
        const [
            ticketData,
            discountSnap,
            invSnap,
            birthdayCoinSnap,
            specialBirthdayCoinSnap
        ] = await Promise.all([
            window.calculateTotalTickets(),

            db.ref(
                'student_discounts/' +
                currentUser.username
            ).once('value'),

            db.ref(
                'student_inventory/' +
                currentUser.username
            ).once('value'),

            db.ref(
                'birthday_coins/' +
                currentUser.username
            ).once('value')
            ,

            db.ref(
                'student_special_birthday_coins/' +
                currentUser.username
            ).once('value')
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

        // --- 2. XỬ LÝ XU ĐẶC BIỆT ---
        const specialBirthdayGrants =
            specialBirthdayCoinSnap.val() || {};

        window
            .studentSpecialBirthdayCoinGrants =
            specialBirthdayGrants;

        window
            .studentSpecialBirthdayCoinCount =
            getUsableSpecialBirthdayCoinCount(
                specialBirthdayGrants,
                now
            );

        Object.entries(
            specialBirthdayGrants
        )
            .sort((a, b) => {
                return (
                    Number(
                        a[1]?.expiresAt || 0
                    ) -
                    Number(
                        b[1]?.expiresAt || 0
                    )
                );
            })
            .forEach(([grantId, grant]) => {
                const quantity =
                    Number(
                        grant?.remaining
                    ) || 0;

                if (quantity <= 0) {
                    return;
                }

                const expiry =
                    Number(
                        grant?.expiresAt
                    ) || 0;

                const isExpired =
                    !expiry ||
                    now >= expiry;

                slotsData.push({
                    type:
                        'special_birthday_coin',

                    name:
                        'Xu Đặc Biệt',

                    icon: '✨',
                    isImg: false,
                    quantity,
                    grantId,
                    expiry,
                    isExpired,

                    description:
                        `<b>Xu Đặc Biệt do giáo viên tặng.</b><br>` +
                        `🎯 Đổi hầu hết vật phẩm tag Sinh nhật, ` +
                        `không phân biệt năm.<br>` +
                        `⌛ Hạn dùng: ` +
                        `<b>${new Date(expiry).toLocaleString('vi-VN')}</b>`
                });
            });

        // --- 2. XỬ LÝ XU SINH NHẬT THEO TỪNG NĂM ---
        const birthdayWallets =
            birthdayCoinSnap.val() || {};

        const birthdayCoins =
            normalizeBirthdayCoinBalances(
                birthdayWallets
            );

        window.studentBirthdayWallets =
            birthdayWallets;

        window.studentBirthdayCoins =
            birthdayCoins;

        Object.entries(birthdayCoins)
            .sort(
                (a, b) =>
                    Number(b[0]) -
                    Number(a[0])
            )
            .forEach(([year, amount]) => {
                const quantity =
                    Number(amount) || 0;

                if (quantity <= 0) {
                    return;
                }

                slotsData.push({
                    type: 'birthday_coin',

                    name:
                        `Xu Sinh Nhật ${year}`,

                    icon: '🎂',

                    isImg: false,

                    quantity,

                    year: Number(year),

                    isExpired: false,

                    description:
                        `🎁 <b>Xu tặng sinh nhật năm ${year}</b><br>` +
                        `🎯 Chỉ đổi được 1 vật phẩm mang tag ` +
                        `<b>Sinh nhật ${year}</b>.<br>` +
                        `⚠️ Không thể dùng cho vật phẩm sinh nhật ` +
                        `của năm khác.`
                });
            });

        // --- 2. XỬ LÝ GỘP Ô: THẺ GIẢM GIÁ (HIỂN THỊ CẢ THẺ HẾT HẠN) ---
        const discounts = discountSnap.val() || {};
        let groupedDiscounts = {};

        for (let key in discounts) {
            let d = discounts[key];
            if (d.isUsed) continue; // Bỏ qua nếu thẻ đã dùng xong

            let targetStr =
                d.targetItem
                    ? JSON.stringify(d.targetItem)
                    : '["all"]';

            /*
             * Chỉ thêm source vào khóa gộp giao diện.
             * Không sửa dữ liệu Firebase của thẻ.
             */
            const discountSource =
                d.source || 'teacher_gift';

            // Không gộp thẻ giáo viên với thẻ đăng nhập 7 ngày.
            let groupKey =
                `${discountSource}_` +
                `${d.percent}_` +
                `${d.expiry || 'permanent'}_` +
                `${targetStr}`;

            if (!groupedDiscounts[groupKey]) {
                groupedDiscounts[groupKey] = {
                    percent: d.percent,
                    expiry: d.expiry || null,
                    targetItem: d.targetItem || ['all'],
                    source: discountSource,
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

                let targetText =
                    "Áp dụng tất cả vật phẩm mua bằng Coin";
                if (group.targetItem && !group.targetItem.includes('all')) {
                    // Chuyển danh sách ID thành tên vật phẩm
                    const validNames = (Array.isArray(group.targetItem) ? group.targetItem : [group.targetItem]).map(id => {
                        const storeItem = (typeof StoreConfig !== 'undefined') ? StoreConfig.items.find(i => i.id === id) : null;
                        return storeItem ? storeItem.name : id;
                    });

                    // Thu gọn nếu có nhiều hơn 5 vật phẩm
                    if (validNames.length > 5) {
                        targetText = validNames.slice(0, 5).join(', ') + `<br><i>... và ${validNames.length - 5} món khác</i>`;
                    } else {
                        targetText = validNames.join(', ');
                    }
                }

                const isTeacherGiftDiscount =
                    group.source === 'teacher_gift';

                const isDailyLoginDiscount =
                    group.source === 'daily_login';

                const isHoiHoaRunnerUpDiscount =
                    group.source === 'hoihoa_runner_up' ||
                    group.source === 'hoihoa_season';

                const isHoiHoaChestDiscount =
                    group.source === 'hoihoa_chest';

                const sourceText =
                    isTeacherGiftDiscount
                        ? 'Giáo viên tặng qua thư'
                        : isDailyLoginDiscount
                            ? 'Đăng nhập đủ 7 ngày'
                            : isHoiHoaRunnerUpDiscount
                                ? 'Á quân mùa giải Hội Họa'
                                : isHoiHoaChestDiscount
                                    ? 'Mở Rương Kho Báu Hội Họa'
                                    : 'Phần thưởng hệ thống';

                const conditionText =
                    isTeacherGiftDiscount
                        ? 'Chỉ dùng cho vật phẩm mua bằng Coin có giá từ 1 đến 699 Coin. Không dùng cho món từ 700 Coin trở lên.'
                        : isDailyLoginDiscount
                            ? 'Chỉ dùng cho vật phẩm thông thường có giá tối đa 500 Coin; không dùng cho vật phẩm sự kiện, Doraemon và Truyền thuyết,...'
                            : isHoiHoaRunnerUpDiscount
                                ? 'Dùng 1 lần, hạn 30 ngày từ ngày nhận. Chỉ dùng cho vật phẩm bán bằng Coin dưới 600 Coin; không dùng cho vật phẩm sự kiện, Doraemon và Truyền thuyết,...'
                                : isHoiHoaChestDiscount
                                    ? 'Dùng 1 lần, hạn 30 ngày từ ngày nhận. Chỉ dùng cho vật phẩm bán bằng Coin dưới 700 Coin; không dùng cho vật phẩm sự kiện, Doraemon và Truyền thuyết,...'
                                    : 'Áp dụng theo phạm vi ghi trên thẻ.';

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
                    description:
                        `🏷️ <b>Mức giảm:</b> ${group.percent}%` +
                        `<br>🕒 <b>Hạn dùng:</b> ${expText}` +
                        `<br>🎁 <b>Nguồn:</b> ${sourceText}` +
                        `<br>🎯 <b>Phạm vi:</b> ${targetText}` +
                        `<br>⚠️ <b>Điều kiện:</b> ${conditionText}`
                });

                index += count;
                totalVouchers -= count;
            }
        }

        const inventory = invSnap.val() || {};
        for (let key in inventory) {
            let item = inventory[key];
            if (item.type === 'chest' || item.type === 'badge') {
                slotsData.push({
                    type: item.type,
                    name: item.name,
                    icon: item.icon || (item.type === 'chest' ? '🎁' : '🏅'),
                    isImg: false,
                    quantity: 1,
                    firebaseKey: key,
                    description: item.description || 'Vật phẩm danh dự từ các cuộc thi.'
                });
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
// HỆ THỐNG YÊU CẦU LẤY TIỀN MẶT - PHÍA HỌC SINH (BẢN HỢP NHẤT / AN TOÀN)
// =========================================================================

function isCashRequestOwnedByCurrentStudent(req) {
    if (!req) return false;

    // Dữ liệu mới: luôn ưu tiên username vì tên hiển thị có thể trùng/đổi.
    if (req.studentUsername) {
        return String(req.studentUsername) === String(currentUser.username);
    }

    // Tương thích dữ liệu cũ chưa có studentUsername.
    return String(req.studentName || '') === String(currentUser.name || '');
}

function getCashRequestAmount(req) {
    const amount = Number(req && req.amount);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

// Tính phần tiền đang được giữ chỗ bởi yêu cầu tiền mặt nhưng chưa bị trừ khỏi offset.
// processing có thể rơi vào cửa sổ phục hồi: nếu offset đã bằng processingOffsetAfter
// thì tiền đã được trừ, không được giữ chỗ lần hai.
function getReservedCashRequestAmount(allRequests, currentOffset) {
    const normalizedOffset = Number(currentOffset) || 0;

    return (allRequests || [])
        .filter(isCashRequestOwnedByCurrentStudent)
        .reduce((sum, req) => {
            const amount = getCashRequestAmount(req);
            if (!amount) return sum;

            if (req.status === 'pending') {
                return sum + amount;
            }

            if (req.status === 'processing') {
                if (req.debitApplied === true) {
                    return sum;
                }

                const expectedAfter = Number(req.processingOffsetAfter);
                if (
                    Number.isFinite(expectedAfter) &&
                    normalizedOffset === expectedAfter
                ) {
                    return sum;
                }

                return sum + amount;
            }

            return sum;
        }, 0);
}

async function getCurrentRoadmapMoneyState() {
    const [assignments, submissions, offsetSnap, cashRequests] = await Promise.all([
        getDB('assignments'),
        getDB('submissions'),
        db.ref('student_money_offset/' + currentUser.username).once('value'),
        getDB('cash_requests')
    ]);

    const baseMoney = calculateRoadmapBaseMoney(
        assignments,
        submissions,
        currentUser.username
    );

    const moneyOffset = Number(offsetSnap.val()) || 0;
    const totalMoney = Math.max(0, baseMoney + moneyOffset);
    const reservedAmount = getReservedCashRequestAmount(
        cashRequests,
        moneyOffset
    );
    const availableMoney = Math.max(0, totalMoney - reservedAmount);

    return {
        assignments,
        submissions,
        cashRequests,
        baseMoney,
        moneyOffset,
        totalMoney,
        reservedAmount,
        availableMoney
    };
}

// Hiển thị lịch sử. Học sinh chỉ ẩn bản ghi cũ khỏi giao diện,
// KHÔNG tự xóa Firebase để tránh lỗi quyền ghi/xóa phía client.
async function renderCashRequestHistory() {
    const container = document.getElementById('cashRequestHistoryContainer');
    if (!container) return;

    try {
        const allRequests = await getDB('cash_requests');
        const now = Date.now();
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

        const myRequests = (allRequests || [])
            .filter(isCashRequestOwnedByCurrentStudent)
            .filter(req => {
                if (req.status !== 'completed' && req.status !== 'rejected') {
                    return true;
                }

                const checkTime = Number(req.resolvedAt || req.timestamp || 0);
                return !checkTime || now - checkTime <= TWO_DAYS_MS;
            });

        if (myRequests.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8; font-size: 0.9em; margin: 0; text-align: center; padding: 10px;">Chưa có yêu cầu lấy tiền mặt nào.</p>';
            return;
        }

        let html = '';

        [...myRequests]
            .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
            .forEach(req => {
                let statusBadge = '';
                let note = '';

                if (req.status === 'pending') {
                    statusBadge = '<span style="background: #fef3c7; color: #d97706; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85em;">⏳ Đang chờ duyệt</span>';
                } else if (req.status === 'processing') {
                    statusBadge = '<span style="background: #ede9fe; color: #7c3aed; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85em;">🔐 Giáo viên đang xử lý</span>';
                    note = '<p style="margin: 5px 0 0 0; font-size: 0.85em; color: #64748b; font-style: italic;">Yêu cầu đang được khóa để tránh trừ tiền lặp.</p>';
                } else if (req.status === 'transferring') {
                    statusBadge = '<span style="background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85em;">🔄 Đang chuyển</span>';
                    note = '<p style="margin: 5px 0 0 0; font-size: 0.85em; color: #64748b; font-style: italic;">👉 Ghi chú: Tiền sẽ được chuyển đến trong 2-3 ngày</p>';
                } else if (req.status === 'completed') {
                    statusBadge = '<span style="background: #dcfce7; color: #16a34a; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85em;">✅ Đã hoàn tất yêu cầu</span>';
                } else if (req.status === 'rejected') {
                    statusBadge = '<span style="background: #fee2e2; color: #dc2626; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85em;">❌ Bị từ chối</span>';
                } else {
                    statusBadge = '<span style="background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85em;">Không xác định</span>';
                }

                const amount = getCashRequestAmount(req);
                const timestamp = Number(req.timestamp || 0);
                const timeText = timestamp
                    ? new Date(timestamp).toLocaleString('vi-VN')
                    : 'Không rõ';

                html += `
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                            <span style="font-weight: 600; color: #1e293b;">${amount.toLocaleString('vi-VN')} VNĐ</span>
                            ${statusBadge}
                        </div>
                        <div style="font-size: 0.8em; color: #94a3b8; margin-top: 4px;">Thời gian: ${timeText}</div>
                        ${note}
                    </div>
                `;
            });

        container.innerHTML = html;
    } catch (error) {
        console.error('Lỗi khi tải lịch sử rút tiền:', error);
        container.innerHTML = '<p style="color: #dc2626; font-size: 0.85em; padding: 5px; margin: 0;">Lỗi tải dữ liệu lịch sử!</p>';
    }
}

window.calculateCurrentRouteMoney = async function () {
    const state = await getCurrentRoadmapMoneyState();
    return state.totalMoney;
};

window.calculateCurrentAvailableRouteMoney = async function () {
    const state = await getCurrentRoadmapMoneyState();
    return state.availableMoney;
};

window.initCashWithdrawInterface = async function () {
    const displayEl = document.getElementById('displayRouteMoney');
    if (!displayEl) return;

    try {
        const state = await getCurrentRoadmapMoneyState();
        displayEl.innerText = state.totalMoney.toLocaleString('vi-VN');
        window.currentRoadmapMoneyAmount = state.totalMoney;
        window.currentAvailableRoadmapMoneyAmount = state.availableMoney;

        const inputEl = document.getElementById('inputWithdrawAmount');
        if (inputEl) {
            inputEl.max = String(Math.floor(state.availableMoney));
            inputEl.dataset.availableMoney = String(state.availableMoney);
        }

        const section = document.getElementById('cashWithdrawalSection');
        if (section) {
            let availableEl = document.getElementById('cashAvailableMoneyNotice');
            if (!availableEl) {
                availableEl = document.createElement('p');
                availableEl.id = 'cashAvailableMoneyNotice';
                availableEl.style.margin = '-8px 0 15px 0';
                availableEl.style.color = '#64748b';
                availableEl.style.fontSize = '0.88em';

                const firstParagraph = section.querySelector('p');
                if (firstParagraph) {
                    firstParagraph.insertAdjacentElement('afterend', availableEl);
                }
            }

            if (availableEl) {
                availableEl.innerHTML =
                    `Có thể yêu cầu lúc này: <strong style="color:#059669;">` +
                    `${state.availableMoney.toLocaleString('vi-VN')} VNĐ</strong>` +
                    (state.reservedAmount > 0
                        ? ` · Đang giữ chỗ: ${state.reservedAmount.toLocaleString('vi-VN')} VNĐ`
                        : '');
            }
        }

        await renderCashRequestHistory();
    } catch (error) {
        console.error('Lỗi khởi tạo giao diện rút tiền mặt:', error);
        displayEl.innerText = '—';
    }
};

async function handleRequestCashSubmitCore() {
    const inputEl = document.getElementById('inputWithdrawAmount');
    if (!inputEl) return;

    // Chặn double-click / nhiều Promise gửi song song trên cùng client.
    if (window.cashRequestSubmitInFlight) return;
    window.cashRequestSubmitInFlight = true;

    try {
        const rawAmount = String(inputEl.value || '').trim();
        const amount = Number(rawAmount);

        if (!rawAmount || !Number.isInteger(amount) || amount <= 0) {
            alert('⚠️ Vui lòng nhập số tiền mặt muốn lấy là số nguyên dương hợp lệ!');
            return;
        }

        let state = await getCurrentRoadmapMoneyState();

        if (amount > state.totalMoney) {
            alert(`⚠️ Số tiền yêu cầu (${amount.toLocaleString('vi-VN')} VNĐ) vượt quá Tổng tiền tích lũy lộ trình hiện tại (${state.totalMoney.toLocaleString('vi-VN')} VNĐ)!`);
            return;
        }

        if (amount > state.availableMoney) {
            alert(
                `⚠️ Bạn đang có ${state.reservedAmount.toLocaleString('vi-VN')} VNĐ ` +
                `đang chờ/được xử lý. Số tiền còn có thể yêu cầu là ` +
                `${state.availableMoney.toLocaleString('vi-VN')} VNĐ.`
            );
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn gửi yêu cầu lấy ${amount.toLocaleString('vi-VN')} VNĐ về giáo viên không?`)) {
            return;
        }

        // Đọc lại ngay trước khi tạo request để tránh dùng số dư cũ sau thời gian confirm.
        state = await getCurrentRoadmapMoneyState();
        if (amount > state.availableMoney) {
            alert(
                `⚠️ Số dư khả dụng vừa thay đổi. Hiện chỉ còn ` +
                `${state.availableMoney.toLocaleString('vi-VN')} VNĐ có thể yêu cầu.`
            );
            await window.initCashWithdrawInterface();
            return;
        }

        await pushDB('cash_requests', {
            // Tương thích cả Firebase Rules cũ và luồng duyệt tiền hiện tại.
            username: currentUser.username,
            studentUsername: currentUser.username,
            studentName: currentUser.name,
            amount: amount,
            status: 'pending',
            requestVersion: 2,
            timestamp: Date.now()
        });

        alert('🎉 Gửi yêu cầu thành công! Vui lòng đợi giáo viên xét duyệt.');
        inputEl.value = '';

        await window.initCashWithdrawInterface();
    } catch (error) {
        console.error('Lỗi gửi yêu cầu tiền mặt:', error);

        const errorCode = String(error?.code || '').toLowerCase();
        const errorMessage = String(error?.message || '').toLowerCase();

        if (
            errorCode.includes('permission-denied') ||
            errorCode.includes('permission_denied') ||
            errorMessage.includes('permission_denied') ||
            errorMessage.includes('permission denied')
        ) {
            alert('❌ Firebase từ chối quyền tạo yêu cầu tiền mặt. Vui lòng kiểm tra Rules của cash_requests.');
        } else {
            alert('❌ Không thể gửi yêu cầu tiền mặt. Vui lòng kiểm tra kết nối rồi thử lại.');
        }
    } finally {
        window.cashRequestSubmitInFlight = false;
    }
}

window.handleRequestCashSubmit = function () {
    return runWithStudentMoneyMutationLock(handleRequestCashSubmitCore);
};

// ================= HỆ THỐNG THEO DÕI VIDEO YOUTUBE =================
let ytPlayers = {};
let watchTimers = {};
let watchDurations = {}; // Lưu mốc thời gian XA NHẤT học sinh đã xem tới
let lastSavedTime = {};  // Biến phụ để chống spam lưu lên Firebase liên tục

let lastPlayerSamples = {};
let pendingResumeTimes = {};
let videoProgressFlushBound = false;

function normalizeVideoProgressSeconds(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
}

function getVideoProgressStorageKey(assignId) {
    return `student_video_progress:${currentUser.username}:${assignId}`;
}

function getLocalVideoProgress(assignId) {
    try {
        return normalizeVideoProgressSeconds(
            localStorage.getItem(
                getVideoProgressStorageKey(assignId)
            )
        );
    } catch (error) {
        return 0;
    }
}

function saveLocalVideoProgress(assignId, seconds) {
    try {
        const nextSeconds =
            normalizeVideoProgressSeconds(seconds);

        const oldSeconds =
            getLocalVideoProgress(assignId);

        if (nextSeconds > oldSeconds) {
            localStorage.setItem(
                getVideoProgressStorageKey(assignId),
                String(nextSeconds)
            );
        }
    } catch (error) {
        // Firebase vẫn hoạt động nếu LocalStorage bị chặn.
    }
}

function saveVideoProgressToFirebase(assignId, seconds) {
    const safeSeconds = Math.max(
        normalizeVideoProgressSeconds(
            watchDurations[assignId]
        ),
        normalizeVideoProgressSeconds(seconds)
    );

    if (safeSeconds <= 0) {
        return Promise.resolve(0);
    }

    watchDurations[assignId] = safeSeconds;
    saveLocalVideoProgress(assignId, safeSeconds);

    return db.ref(
        `video_tracking/${assignId}/${currentUser.username}`
    ).transaction(oldValue => {
        return Math.max(
            normalizeVideoProgressSeconds(oldValue),
            safeSeconds
        );
    }).then(result => {
        if (result.committed) {
            lastSavedTime[assignId] = Math.max(
                normalizeVideoProgressSeconds(
                    lastSavedTime[assignId]
                ),
                normalizeVideoProgressSeconds(
                    result.snapshot.val()
                )
            );
        }

        return normalizeVideoProgressSeconds(
            result.snapshot?.val()
        );
    }).catch(error => {
        console.error(
            'Không thể lưu tiến độ xem video:',
            error
        );

        return normalizeVideoProgressSeconds(
            lastSavedTime[assignId]
        );
    });
}

function flushAllVideoProgress() {
    Object.keys(watchDurations).forEach(assignId => {
        const seconds =
            normalizeVideoProgressSeconds(
                watchDurations[assignId]
            );

        if (seconds > 0) {
            saveLocalVideoProgress(assignId, seconds);
            saveVideoProgressToFirebase(
                assignId,
                seconds
            );
        }
    });
}

function bindVideoProgressFlushEvents() {
    if (videoProgressFlushBound) return;

    videoProgressFlushBound = true;

    window.addEventListener(
        'pagehide',
        flushAllVideoProgress
    );

    window.addEventListener(
        'beforeunload',
        flushAllVideoProgress
    );

    document.addEventListener(
        'visibilitychange',
        () => {
            if (
                document.visibilityState ===
                'hidden'
            ) {
                flushAllVideoProgress();
            }
        }
    );
}

function destroyTrackedYouTubePlayer(assignId) {
    if (watchTimers[assignId]) {
        clearInterval(watchTimers[assignId]);
        delete watchTimers[assignId];
    }

    delete lastPlayerSamples[assignId];
    delete pendingResumeTimes[assignId];

    const player = ytPlayers[assignId];

    if (
        player &&
        typeof player.destroy === 'function'
    ) {
        try {
            player.destroy();
        } catch (error) {
            console.warn(
                'Không thể hủy YouTube Player cũ:',
                error
            );
        }
    }

    delete ytPlayers[assignId];
}

function seekToSavedVideoProgress(
    assignId,
    player,
    finalAttempt = false
) {
    let targetTime =
        normalizeVideoProgressSeconds(
            pendingResumeTimes[assignId]
        );

    if (
        targetTime <= 0 ||
        !player ||
        typeof player.getCurrentTime !==
        'function' ||
        typeof player.seekTo !== 'function'
    ) {
        if (finalAttempt) {
            delete pendingResumeTimes[assignId];
        }

        return;
    }

    try {
        if (
            typeof player.getDuration ===
            'function'
        ) {
            const duration =
                Number(player.getDuration()) || 0;

            if (duration > 1) {
                targetTime = Math.min(
                    targetTime,
                    Math.max(
                        0,
                        Math.floor(duration - 1)
                    )
                );
            }
        }

        const currentTime =
            Number(player.getCurrentTime()) || 0;

        if (currentTime + 1.5 < targetTime) {
            player.seekTo(targetTime, true);
        }

        if (
            finalAttempt ||
            currentTime + 1.5 >= targetTime
        ) {
            delete pendingResumeTimes[assignId];
        }
    } catch (error) {
        console.warn(
            'Không thể tự tua lại video:',
            error
        );

        if (finalAttempt) {
            delete pendingResumeTimes[assignId];
        }
    }
}

// Hàm thay thế getEmbedHTML dành riêng cho việc có theo dõi thời gian
function escapeVideoSummaryHTML(value) {
    return String(
        value ?? ''
    ).replace(
        /[&<>"']/g,
        character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[character]
    );
}

function getTrackedVideoHTML(
    url,
    assignId,
    assign = null,
    watchedSeconds = 0,
    shouldResumePlayback = true
) {
    if (!url) return '';

    let videoId = '';

    if (url.includes('watch?v=')) {
        videoId =
            url.split('v=')[1]
                .split('&')[0];
    } else if (
        url.includes('youtu.be/')
    ) {
        videoId =
            url.split('youtu.be/')[1]
                .split('?')[0];
    } else if (
        url.includes(
            'youtube.com/shorts/'
        )
    ) {
        videoId =
            url.split(
                'shorts/'
            )[1].split('?')[0];
    } else if (
        url.includes('embed/')
    ) {
        videoId =
            url.split('embed/')[1]
                .split('?')[0];
    }

    if (!videoId) return '';

    const originParam =
        window.location.origin !==
            'null'
            ? (
                '&origin=' +
                encodeURIComponent(
                    window.location.origin
                )
            )
            : '';

    const embedUrl =
        `https://www.youtube.com/embed/` +
        `${videoId}` +
        `?enablejsapi=1&rel=0&playsinline=1` +
        `${originParam}`;

    const summaryText =
        String(
            assign?.videoSummary || ''
        ).trim();

    const hasSummary =
        !!assign?.videoSummaryEnabled &&
        !!summaryText;

    const requiredSeconds =
        Number(
            assign?.watchCondition
        ) || 0;

    const summaryUnlocked =
        requiredSeconds <= 0 ||
        Number(watchedSeconds) >=
        requiredSeconds;

    const summaryHTML =
        hasSummary
            ? `
                <aside
                    id="video-summary-panel-${assignId}"
                    class="video-summary-panel"
                    aria-hidden="true"
                >
                    <div
                        class="video-summary-panel-inner"
                    >
                        <h4
                            class="video-summary-panel-title"
                        >
                            📝 Tóm tắt video
                        </h4>

                        <div
                            class="video-summary-panel-text"
                        >${escapeVideoSummaryHTML(
                summaryText
            )}</div>
                    </div>

                    <div
                        class="video-summary-resizer"
                        title="Kéo để điều chỉnh độ rộng"
                        onpointerdown="
                            startVideoSummaryResize(
                                event,
                                '${assignId}'
                            )
                        "
                    ></div>
                </aside>

                <button
                    id="video-summary-toggle-${assignId}"
                    class="
                        video-summary-toggle
                        ${summaryUnlocked
                ? ''
                : 'is-locked'
            }
                    "
                    type="button"
                    ${summaryUnlocked
                ? ''
                : 'disabled'
            }
                    data-required-seconds="${requiredSeconds}"
                    aria-expanded="false"
                    title="${summaryUnlocked
                ? 'Mở bảng tóm tắt'
                : 'Cần đạt điều kiện xem video trước'
            }"
                    onclick="
                        toggleVideoSummaryPanel(
                            '${assignId}'
                        )
                    "
                >
                    <span
                        id="video-summary-arrow-${assignId}"
                    >
                        ›
                    </span>
                </button>
            `
            : '';

    // Giao diện Tóm tắt riêng cho điện thoại.
    // Nút nằm dưới dòng Mốc thời gian đã xem.
    const mobileSummaryHTML =
        hasSummary
            ? `
            <div
                class="video-summary-mobile-area"
            >
                <button
                    id="video-summary-mobile-toggle-${assignId}"
                    class="
                        video-summary-mobile-toggle
                        ${summaryUnlocked
                ? ''
                : 'is-locked'
            }
                    "
                    type="button"
                    ${summaryUnlocked
                ? ''
                : 'disabled'
            }
                    data-required-seconds="${requiredSeconds}"
                    aria-expanded="false"
                    title="${summaryUnlocked
                ? 'Mở bảng tóm tắt'
                : 'Cần đạt điều kiện xem video trước'
            }"
                    onclick="
                        toggleMobileVideoSummary(
                            '${assignId}'
                        )
                    "
                >
                    <span
                        id="video-summary-mobile-label-${assignId}"
                    >
                        📝 Xem tóm tắt
                    </span>

                    <span
                        id="video-summary-mobile-arrow-${assignId}"
                        class="video-summary-mobile-arrow"
                    >
                        ▼
                    </span>
                </button>

                <div
                    id="video-summary-mobile-panel-${assignId}"
                    class="video-summary-mobile-panel"
                    aria-hidden="true"
                >
                    <div
                        class="video-summary-mobile-panel-inner"
                    >
                        <h4
                            class="video-summary-mobile-title"
                        >
                            📝 Tóm tắt video
                        </h4>

                        <div
                            class="video-summary-mobile-text"
                        >${escapeVideoSummaryHTML(
                summaryText
            )}</div>
                    </div>
                </div>
            </div>
        `
            : '';

    const lockNote =
        hasSummary &&
            !summaryUnlocked
            ? `
                <div
                    id="video-summary-lock-note-${assignId}"
                    class="
                        video-summary-lock-note
                        show
                    "
                >
                    🔒 Bảng tóm tắt sẽ mở
                    sau khi đạt điều kiện
                    xem video.
                </div>
            `
            : hasSummary
                ? `
                    <div
                        id="video-summary-lock-note-${assignId}"
                        class="video-summary-lock-note"
                    ></div>
                `
                : '';

    return `
        <div
            class="
                video-wrapper
                tracked-video-wrapper
            "
            style="
                margin-top:15px;
                margin-bottom:20px;
                border:2px solid #667eea;
                padding:10px;
                border-radius:12px;
                background:rgba(
                    255,
                    255,
                    255,
                    0.8
                );
            "
        >
            <div
                id="tracked-video-shell-${assignId}"
                class="tracked-video-shell"
            >
                <iframe
    id="yt-player-${assignId}"
    data-resume-playback="${shouldResumePlayback ? 'true' : 'false'}"
                    width="100%"
                    height="315"
                    src="${embedUrl}"
                    frameborder="0"
                    allow="
                        accelerometer;
                        autoplay;
                        encrypted-media;
                        picture-in-picture;
                        fullscreen
                    "
                ></iframe>

                ${summaryHTML}
            </div>

            <div
                style="
                    text-align:center;
                    margin-top:10px;
                    font-weight:bold;
                    color:#059669;
                    font-size:1.1em;
                "
            >
                ⏱️ Mốc thời gian đã xem tới:

                <span
                    id="watch-time-display-${assignId}"
                >
                    ${formatSecondsToDHMS(
        Number(
            watchedSeconds
        ) || 0
    )}
                </span>
                        </div>

            ${mobileSummaryHTML}

            ${lockNote}
        </div>
    `;
}

window.toggleVideoSummaryPanel =
    function (assignId) {
        const shell =
            document.getElementById(
                `tracked-video-shell-${assignId}`
            );

        const panel =
            document.getElementById(
                `video-summary-panel-${assignId}`
            );

        const button =
            document.getElementById(
                `video-summary-toggle-${assignId}`
            );

        const arrow =
            document.getElementById(
                `video-summary-arrow-${assignId}`
            );

        if (
            !shell ||
            !panel ||
            !button
        ) {
            return;
        }

        if (
            button.disabled ||
            button.classList.contains(
                'is-locked'
            )
        ) {
            const required =
                Number(
                    button.dataset
                        .requiredSeconds
                ) || 0;

            alert(
                required > 0
                    ? (
                        '🔒 Bạn cần xem video đạt ' +
                        `${formatSecondsToDHMS(
                            required
                        )} trước khi mở ` +
                        'bảng tóm tắt.'
                    )
                    : (
                        '🔒 Bảng tóm tắt hiện ' +
                        'chưa được mở khóa.'
                    )
            );

            return;
        }

        const isOpen =
            shell.classList.toggle(
                'summary-open'
            );

        panel.setAttribute(
            'aria-hidden',
            String(!isOpen)
        );

        button.setAttribute(
            'aria-expanded',
            String(isOpen)
        );

        button.title =
            isOpen
                ? 'Đóng bảng tóm tắt'
                : 'Mở bảng tóm tắt';

        if (arrow) {
            arrow.textContent =
                isOpen ? '‹' : '›';
        }
    };

// ==========================================================
// MỞ / ĐÓNG TÓM TẮT TRÊN ĐIỆN THOẠI
// ==========================================================

window.toggleMobileVideoSummary =
    function (assignId) {
        const panel =
            document.getElementById(
                `video-summary-mobile-panel-${assignId}`
            );

        const button =
            document.getElementById(
                `video-summary-mobile-toggle-${assignId}`
            );

        const label =
            document.getElementById(
                `video-summary-mobile-label-${assignId}`
            );

        const arrow =
            document.getElementById(
                `video-summary-mobile-arrow-${assignId}`
            );

        if (!panel || !button) {
            return;
        }

        // Không cho mở khi chưa đạt điều kiện xem.
        if (
            button.disabled ||
            button.classList.contains(
                'is-locked'
            )
        ) {
            const required =
                Number(
                    button.dataset.requiredSeconds
                ) || 0;

            alert(
                required > 0
                    ? (
                        '🔒 Bạn cần xem video đạt ' +
                        `${formatSecondsToDHMS(
                            required
                        )} trước khi mở ` +
                        'bảng tóm tắt.'
                    )
                    : (
                        '🔒 Bảng tóm tắt hiện ' +
                        'chưa được mở khóa.'
                    )
            );

            return;
        }

        const isOpen =
            panel.classList.toggle(
                'mobile-summary-open'
            );

        panel.setAttribute(
            'aria-hidden',
            String(!isOpen)
        );

        button.setAttribute(
            'aria-expanded',
            String(isOpen)
        );

        button.title =
            isOpen
                ? 'Thu gọn bảng tóm tắt'
                : 'Mở bảng tóm tắt';

        if (label) {
            label.textContent =
                isOpen
                    ? '📝 Thu gọn tóm tắt'
                    : '📝 Xem tóm tắt';
        }

        if (arrow) {
            arrow.textContent =
                isOpen ? '▲' : '▼';
        }

        /*
        Khi bảng vừa mở trên điện thoại,
        trang tự lướt xuống 160px.
        */
        if (
            isOpen &&
            window.innerWidth <= 700
        ) {
            setTimeout(() => {
                window.scrollBy({
                    top: 160,
                    behavior: 'smooth'
                });
            }, 180);
        }
    };

window.updateVideoSummaryAccess =
    function (
        assignId,
        isUnlocked,
        requiredSeconds = 0
    ) {
        // Nút trượt ngang trên máy tính.
        const desktopButton =
            document.getElementById(
                `video-summary-toggle-${assignId}`
            );

        // Nút xổ xuống trên điện thoại.
        const mobileButton =
            document.getElementById(
                `video-summary-mobile-toggle-${assignId}`
            );

        const buttons = [
            desktopButton,
            mobileButton
        ].filter(Boolean);

        const note =
            document.getElementById(
                `video-summary-lock-note-${assignId}`
            );

        if (buttons.length === 0) {
            return;
        }

        buttons.forEach(button => {
            button.dataset.requiredSeconds =
                String(
                    Number(
                        requiredSeconds
                    ) || 0
                );

            button.disabled =
                !isUnlocked;

            button.classList.toggle(
                'is-locked',
                !isUnlocked
            );

            button.title =
                isUnlocked
                    ? 'Mở bảng tóm tắt'
                    : (
                        'Cần đạt điều kiện ' +
                        'xem video trước'
                    );
        });

        if (note) {
            note.classList.toggle(
                'show',
                !isUnlocked
            );

            note.textContent =
                isUnlocked
                    ? ''
                    : (
                        '🔒 Bảng tóm tắt sẽ mở ' +
                        'sau khi đạt điều kiện ' +
                        'xem video.'
                    );
        }
    };

window.startVideoSummaryResize =
    function (event, assignId) {
        // Chỉ nhận chuột trái.
        if (
            event.button !== undefined &&
            event.button !== 0
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const shell =
            document.getElementById(
                `tracked-video-shell-${assignId}`
            );

        const panel =
            document.getElementById(
                `video-summary-panel-${assignId}`
            );

        const handle =
            event.currentTarget;

        if (
            !shell ||
            !panel ||
            !handle
        ) {
            return;
        }

        const pointerId =
            event.pointerId;

        document.body.classList.add(
            'video-summary-resizing'
        );

        shell.classList.add(
            'is-resizing'
        );

        /*
        Giữ sự kiện chuột ở thanh kéo.
        Dù con trỏ đi qua iframe YouTube,
        thao tác kéo vẫn không bị mất.
        */
        try {
            handle.setPointerCapture(
                pointerId
            );
        } catch (error) {
            // Trình duyệt không hỗ trợ thì bỏ qua.
        }

        const updateWidth =
            clientX => {
                const rect =
                    shell.getBoundingClientRect();

                if (!rect.width) return;

                const rawPercent =
                    (
                        (
                            clientX -
                            rect.left
                        ) /
                        rect.width
                    ) * 100;

                const isMobile =
                    window.innerWidth <= 700;

                const minPercent =
                    isMobile ? 45 : 25;

                const maxPercent =
                    isMobile ? 94 : 90;

                const widthPercent =
                    Math.min(
                        maxPercent,
                        Math.max(
                            minPercent,
                            rawPercent
                        )
                    );

                shell.style.setProperty(
                    '--video-summary-width',
                    `${widthPercent}%`
                );
            };

        // Cập nhật ngay từ vị trí nhấn đầu tiên.
        updateWidth(
            event.clientX
        );

        const move =
            moveEvent => {
                if (
                    moveEvent.pointerId !==
                    pointerId
                ) {
                    return;
                }

                moveEvent.preventDefault();

                updateWidth(
                    moveEvent.clientX
                );
            };

        const cleanup = () => {
            window.removeEventListener(
                'pointermove',
                move
            );

            window.removeEventListener(
                'pointerup',
                stop
            );

            window.removeEventListener(
                'pointercancel',
                stop
            );

            window.removeEventListener(
                'blur',
                cleanup
            );

            document.body.classList.remove(
                'video-summary-resizing'
            );

            shell.classList.remove(
                'is-resizing'
            );

            try {
                if (
                    handle.hasPointerCapture(
                        pointerId
                    )
                ) {
                    handle.releasePointerCapture(
                        pointerId
                    );
                }
            } catch (error) {
                // Không cần xử lý.
            }
        };

        const stop =
            stopEvent => {
                if (
                    stopEvent.pointerId !==
                    pointerId
                ) {
                    return;
                }

                cleanup();
            };

        window.addEventListener(
            'pointermove',
            move,
            {
                passive: false
            }
        );

        window.addEventListener(
            'pointerup',
            stop
        );

        window.addEventListener(
            'pointercancel',
            stop
        );

        // Tránh bị kẹt trạng thái kéo khi đổi cửa sổ.
        window.addEventListener(
            'blur',
            cleanup,
            {
                once: true
            }
        );
    };

function updateVideoWatchDisplays(assignId, seconds) {
    const formattedTime =
        formatSecondsToDHMS(Number(seconds) || 0);

    // Dòng nằm dưới video
    const videoDisplay =
        document.getElementById(
            `watch-time-display-${assignId}`
        );

    // Dòng nằm trong bảng cảnh báo điều kiện
    const conditionDisplay =
        document.getElementById(
            `condition-watch-display-${assignId}`
        );

    if (videoDisplay) {
        videoDisplay.innerText = formattedTime;
    }

    if (conditionDisplay) {
        conditionDisplay.innerText = formattedTime;
    }
}

window.initYouTubeTrackers = function (
    assignments,
    retryCount = 0
) {
    bindVideoProgressFlushEvents();

    if (
        typeof YT === 'undefined' ||
        typeof YT.Player === 'undefined'
    ) {
        if (retryCount < 10) {
            setTimeout(
                () =>
                    window.initYouTubeTrackers(
                        assignments,
                        retryCount + 1
                    ),
                1000
            );
        }

        return;
    }

    const renderedPlayerIds = new Set();

    assignments.forEach(assign => {
        const assignId = String(assign.id);
        const iframeId = `yt-player-${assignId}`;

        const iframeEl =
            document.getElementById(iframeId);

        if (!iframeEl) return;

        renderedPlayerIds.add(assignId);

        const existingPlayer =
            ytPlayers[assignId];

        if (existingPlayer) {
            let existingIframe = null;

            try {
                existingIframe =
                    typeof existingPlayer.getIframe ===
                        'function'
                        ? existingPlayer.getIframe()
                        : null;
            } catch (error) {
                existingIframe = null;
            }

            if (existingIframe !== iframeEl) {
                destroyTrackedYouTubePlayer(
                    assignId
                );
            }
        }

        if (!ytPlayers[assignId]) {
            ytPlayers[assignId] =
                new YT.Player(iframeId, {
                    events: {
                        onReady: event => {
                            const resumeEnabled =
                                iframeEl.dataset
                                    .resumePlayback !==
                                'false';

                            db.ref(
                                `video_tracking/${assignId}/${currentUser.username}`
                            )
                                .once('value')
                                .then(snap => {
                                    const firebaseSeconds =
                                        normalizeVideoProgressSeconds(
                                            snap.val()
                                        );

                                    const localSeconds =
                                        resumeEnabled
                                            ? getLocalVideoProgress(
                                                assignId
                                            )
                                            : 0;

                                    watchDurations[
                                        assignId
                                    ] = Math.max(
                                        firebaseSeconds,
                                        localSeconds,
                                        normalizeVideoProgressSeconds(
                                            watchDurations[
                                            assignId
                                            ]
                                        )
                                    );

                                    lastSavedTime[
                                        assignId
                                    ] = firebaseSeconds;

                                    updateVideoWatchDisplays(
                                        assignId,
                                        watchDurations[
                                        assignId
                                        ]
                                    );

                                    const requiredSeconds =
                                        Number(
                                            assign.watchCondition
                                        ) || 0;

                                    window
                                        .updateVideoSummaryAccess(
                                            assignId,
                                            requiredSeconds <=
                                            0 ||
                                            watchDurations[
                                            assignId
                                            ] >=
                                            requiredSeconds,
                                            requiredSeconds
                                        );

                                    if (
                                        resumeEnabled &&
                                        watchDurations[
                                        assignId
                                        ] > 0
                                    ) {
                                        pendingResumeTimes[
                                            assignId
                                        ] =
                                            watchDurations[
                                            assignId
                                            ];

                                        setTimeout(
                                            () => {
                                                seekToSavedVideoProgress(
                                                    assignId,
                                                    event.target,
                                                    false
                                                );
                                            },
                                            150
                                        );
                                    }

                                    if (
                                        localSeconds >
                                        firebaseSeconds
                                    ) {
                                        saveVideoProgressToFirebase(
                                            assignId,
                                            watchDurations[
                                            assignId
                                            ]
                                        );
                                    }
                                })
                                .catch(error => {
                                    console.error(
                                        'Không thể tải tiến độ xem video:',
                                        error
                                    );
                                });
                        },

                        onStateChange: event =>
                            window.onPlayerStateChange(
                                event,
                                assignId
                            )
                    }
                });
        }
    });

    Object.keys(ytPlayers).forEach(
        assignId => {
            if (
                !renderedPlayerIds.has(
                    String(assignId)
                ) ||
                !document.getElementById(
                    `yt-player-${assignId}`
                )
            ) {
                destroyTrackedYouTubePlayer(
                    assignId
                );
            }
        }
    );
};

window.onPlayerStateChange = function (event, assignId) {
    const player = event.target; // Lấy trực tiếp video đang phát

    if (typeof MusicManager !== 'undefined') {
        MusicManager.handleYouTubeVideoState(
            `assignment-video:${assignId}`,
            event.data
        );
    }

    if (event.data === YT.PlayerState.PLAYING) {
        seekToSavedVideoProgress(
            assignId,
            player,
            true
        );

        if (watchTimers[assignId]) {
            clearInterval(watchTimers[assignId]);
        }

        watchTimers[assignId] = setInterval(() => {
            if (player && typeof player.getCurrentTime === 'function') {
                const rawCurrentTime =
                    Number(player.getCurrentTime()) || 0;

                let currentTime =
                    Math.floor(rawCurrentTime);

                let lastTime =
                    watchDurations[assignId] || 0;

                const now = Date.now();

                const previousSample =
                    lastPlayerSamples[assignId] || {
                        videoTime: rawCurrentTime,
                        wallTime: now
                    };

                const wallElapsedSeconds = Math.max(
                    0.25,
                    (now - previousSample.wallTime) / 1000
                );

                let playbackRate = 1;

                try {
                    if (
                        typeof player.getPlaybackRate ===
                        'function'
                    ) {
                        playbackRate = Math.max(
                            0.25,
                            Number(player.getPlaybackRate()) ||
                            1
                        );
                    }
                } catch (error) {
                    playbackRate = 1;
                }

                const videoAdvance =
                    rawCurrentTime -
                    previousSample.videoTime;

                const allowedAdvance =
                    wallElapsedSeconds *
                    playbackRate +
                    3;

                if (currentTime > lastTime) {
                    if (
                        currentTime - lastTime > 5 &&
                        videoAdvance > allowedAdvance
                    ) {
                        player.seekTo(lastTime, true);

                        lastPlayerSamples[assignId] = {
                            videoTime: lastTime,
                            wallTime: now
                        };

                        return;
                    } else {
                        // Hợp lệ -> Đẩy đồng hồ lên
                        watchDurations[assignId] = currentTime;

                        saveLocalVideoProgress(
                            assignId,
                            currentTime
                        );

                        updateVideoWatchDisplays(
                            assignId,
                            currentTime
                        );

                        // =====================================================
                        // LƯU TIẾN ĐỘ ĐỊNH KỲ
                        // =====================================================
                        const savedTime = Number(lastSavedTime[assignId]) || 0;

                        // Không dùng currentTime % 5 vì bộ đếm có thể nhảy qua đúng mốc.
                        if (currentTime - savedTime >= 5) {
                            db.ref(
                                `video_tracking/${assignId}/${currentUser.username}`
                            ).transaction(oldValue => {
                                const oldSeconds = Number(oldValue) || 0;

                                // Chỉ cho phép tiến độ tăng, không bị tab cũ ghi tụt xuống.
                                return Math.max(oldSeconds, currentTime);
                            }).then(result => {
                                if (result.committed) {
                                    lastSavedTime[assignId] =
                                        Number(result.snapshot.val()) || currentTime;
                                }
                            }).catch(error => {
                                console.error(
                                    "Không thể lưu tiến độ xem video:",
                                    error
                                );
                            });
                        }

                        // =====================================================
                        // KIỂM TRA MỞ KHÓA Ở MỖI GIÂY XEM HỢP LỆ
                        // =====================================================
                        const currentAssign = Array.isArray(window.cachedAssignments)
                            ? window.cachedAssignments.find(
                                item => String(item.id) === String(assignId)
                            )
                            : null;

                        if (
                            currentAssign &&
                            Number(currentAssign.watchCondition) > 0 &&
                            currentTime >= Number(currentAssign.watchCondition)
                        ) {
                            // Chặn chạy mở khóa nhiều lần cùng lúc.
                            if (
                                !window[`unlocked_${assignId}`] &&
                                !window[`unlocking_${assignId}`]
                            ) {
                                window[`unlocking_${assignId}`] = true;

                                const progressRef = db.ref(
                                    `video_tracking/${assignId}/${currentUser.username}`
                                );

                                // Lưu mốc đạt yêu cầu trước rồi mở giao diện.
                                progressRef.transaction(oldValue => {
                                    const oldSeconds = Number(oldValue) || 0;
                                    return Math.max(oldSeconds, currentTime);
                                }).then(result => {
                                    if (!result.committed) {
                                        throw new Error("Không thể ghi tiến độ video");
                                    }

                                    const savedSeconds =
                                        Number(result.snapshot.val()) || currentTime;

                                    lastSavedTime[assignId] = Math.max(
                                        Number(lastSavedTime[assignId]) || 0,
                                        savedSeconds
                                    );

                                    window[`unlocked_${assignId}`] = true;

                                    window.updateVideoSummaryAccess(
                                        assignId,
                                        true,

                                        Number(
                                            currentAssign.watchCondition
                                        ) || 0
                                    );

                                    // Ẩn bảng cảnh báo yêu cầu xem video.
                                    const noticeBox = document.getElementById(
                                        `condition-notice-${assignId}`
                                    );

                                    if (noticeBox) {
                                        noticeBox.style.display = "none";
                                    }

                                    if (currentAssign.assessmentType === "thi") {
                                        // Bài thi: mở nút bắt đầu thi.
                                        const examWrapper = document.getElementById(
                                            `exam-wrapper-${assignId}`
                                        );

                                        if (examWrapper) {
                                            examWrapper.style.display = "block";

                                            setTimeout(() => {
                                                examWrapper.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "center"
                                                });
                                            }, 100);
                                        }
                                    } else {
                                        // Bài thường: mở phần làm bài ngay.
                                        const contentBox = document.getElementById(
                                            `assignment-task-content-${assignId}`
                                        );

                                        if (contentBox) {
                                            contentBox.style.display = "block";
                                            contentBox.style.opacity = "1";

                                            setTimeout(() => {
                                                contentBox.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "start"
                                                });
                                            }, 100);
                                        }
                                    }

                                    if (typeof window.showToast === "function") {
                                        window.showToast(
                                            "Đã đạt đủ thời lượng xem. Phần làm bài đã được mở khóa!",
                                            "success"
                                        );
                                    }
                                }).catch(error => {
                                    console.error(
                                        "Không thể mở khóa bài sau khi xem video:",
                                        error
                                    );
                                }).finally(() => {
                                    delete window[`unlocking_${assignId}`];
                                });
                            }
                        }
                    }
                }
                lastPlayerSamples[assignId] = {
                    videoTime:
                        Number(player.getCurrentTime()) || 0,
                    wallTime: Date.now()
                };
            }
        }, 1000);
    } else {
        if (watchTimers[assignId]) {
            clearInterval(
                watchTimers[assignId]
            );

            delete watchTimers[assignId];
        }

        delete lastPlayerSamples[assignId];

        if (watchDurations[assignId]) {
            saveVideoProgressToFirebase(
                assignId,
                watchDurations[assignId]
            );
        }
    }
};

// [FIX] Đã loại bỏ phiên bản downloadStudentRoadmapPDF cũ bị trùng.


const LimitedEventAnnouncementManager = {
    events: {},
    serverOffset: 0,
    timer: null,
    initialized: false,

    /*
     * Chỉ ghi nhớ trong lần mở trang hiện tại.
     * Tải lại trang hoặc đăng nhập lại sẽ tự xóa.
     */
    dismissedInstances: new Set(),

    /*
     * Chuyển ngày giờ thành timestamp.
     * Ngày không có giờ sẽ được hiểu theo giờ Việt Nam.
     */
    parseDateTime: function (
        value,
        isEnd = false
    ) {
        if (
            typeof value === 'number' &&
            Number.isFinite(value)
        ) {
            return value;
        }

        let text = String(value || '')
            .trim()
            .replace(/\//g, '-')
            .replace(' ', 'T');

        if (!text) return NaN;

        /*
         * Dạng YYYY-MM-DD:
         * đầu ngày hoặc cuối ngày Việt Nam.
         */
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            text += isEnd
                ? 'T23:59:59.999+07:00'
                : 'T00:00:00.000+07:00';
        } else if (
            /*
             * Dạng datetime-local chưa có múi giờ.
             */
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/
                .test(text) &&
            !/(Z|[+-]\d{2}:\d{2})$/i.test(text)
        ) {
            text += '+07:00';
        }

        const timestamp = Date.parse(text);

        return Number.isFinite(timestamp)
            ? timestamp
            : NaN;
    },

    getVietnamYear: function (timestamp) {
        return Number(
            new Intl.DateTimeFormat('en', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric'
            }).format(new Date(timestamp))
        );
    },

    /*
     * Sự kiện lặp hằng năm.
     * Ví dụ Dạ Hội: 07-29 đến 08-01.
     */
    buildAnnualWindow: function (
        eventData,
        now
    ) {
        const startMonthDay = String(
            eventData.startMonthDay || ''
        ).trim();

        const endMonthDay = String(
            eventData.endMonthDay || ''
        ).trim();

        if (
            !/^\d{2}-\d{2}$/.test(
                startMonthDay
            ) ||
            !/^\d{2}-\d{2}$/.test(
                endMonthDay
            )
        ) {
            return null;
        }

        const currentYear =
            this.getVietnamYear(now);

        const candidates = [];

        /*
         * Kiểm tra năm trước, năm hiện tại
         * và năm sau để hỗ trợ sự kiện qua năm mới.
         */
        for (
            const startYear of [
                currentYear - 1,
                currentYear,
                currentYear + 1
            ]
        ) {
            const crossesYear =
                endMonthDay < startMonthDay;

            const endYear = crossesYear
                ? startYear + 1
                : startYear;

            const start = this.parseDateTime(
                `${startYear}-${startMonthDay}`,
                false
            );

            const end = this.parseDateTime(
                `${endYear}-${endMonthDay}`,
                true
            );

            if (
                Number.isFinite(start) &&
                Number.isFinite(end)
            ) {
                candidates.push({
                    start,
                    end
                });
            }
        }

        return (
            candidates.find(windowData =>
                now >= windowData.start &&
                now <= windowData.end
            ) || null
        );
    },

    getEventWindow: function (
        eventData,
        now
    ) {
        const scheduleType = String(
            eventData.scheduleType || 'limited'
        ).toLowerCase();

        /*
         * Sự kiện mở vô thời hạn:
         * tuyệt đối không hiện thông báo khai mạc.
         */
        if (
            eventData.isUnlimited === true ||
            scheduleType === 'unlimited'
        ) {
            return null;
        }

        /*
         * Sự kiện lặp hằng năm.
         */
        if (scheduleType === 'annual') {
            return this.buildAnnualWindow(
                eventData,
                now
            );
        }

        /*
         * Sự kiện giới hạn một lần.
         */
        const start = this.parseDateTime(
            eventData.startAt ??
            eventData.startDate,
            false
        );

        const end = this.parseDateTime(
            eventData.endAt ??
            eventData.endDate,
            true
        );

        if (
            !Number.isFinite(start) ||
            !Number.isFinite(end) ||
            end < start ||
            now < start ||
            now > end
        ) {
            return null;
        }

        return {
            start,
            end
        };
    },

    evaluate: function () {
        const banner =
            document.getElementById(
                'dynamicEventBanner'
            );

        if (!banner) return;

        /*
         * Không bật banner trong khi thi.
         */
        if (window.currentActiveExamId) {
            banner.style.display = 'none';
            return;
        }

        const now =
            Date.now() + this.serverOffset;

        const activeEvents = Object.entries(
            this.events || {}
        )
            .map(([id, rawEvent]) => {
                const eventData =
                    rawEvent || {};

                /*
                 * Giáo viên khóa hoặc tắt thông báo.
                 */
                if (
                    eventData.isOpen !== true ||
                    eventData
                        .announcementEnabled ===
                    false
                ) {
                    return null;
                }

                const eventWindow =
                    this.getEventWindow(
                        eventData,
                        now
                    );

                if (!eventWindow) {
                    return null;
                }

                /*
                 * Mỗi đợt mở có mã riêng.
                 * Sự kiện mở lại năm sau sẽ được
                 * thông báo lại.
                 */
                const instanceKey =
                    `${id}_${eventWindow.start}`;

                return {
                    ...eventData,
                    id,

                    _startMs:
                        eventWindow.start,

                    _endMs:
                        eventWindow.end,

                    _instanceKey:
                        instanceKey
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                /*
                 * Số priority lớn hơn hiện trước.
                 */
                const priorityDifference =
                    (Number(b.priority) || 0) -
                    (Number(a.priority) || 0);

                return (
                    priorityDifference ||
                    a._startMs - b._startMs
                );
            });

        /*
         * Tìm sự kiện chưa bị đóng trong phiên này.
         */
        const nextEvent =
            activeEvents.find(eventData =>
                !this.dismissedInstances.has(
                    eventData._instanceKey
                )
            );

        if (!nextEvent) {
            banner.style.display = 'none';

            banner.removeAttribute(
                'data-event-id'
            );

            banner.removeAttribute(
                'data-event-instance'
            );

            return;
        }

        showEventBanner(nextEvent);
    },

    init: async function () {
        if (this.initialized) return;

        this.initialized = true;

        /*
         * Dùng giờ Firebase thay vì giờ máy học sinh.
         */
        try {
            const offsetSnapshot = await db
                .ref('.info/serverTimeOffset')
                .once('value');

            this.serverOffset =
                Number(offsetSnapshot.val()) ||
                0;
        } catch (error) {
            console.warn(
                'Không lấy được thời gian ' +
                'máy chủ cho sự kiện:',
                error
            );

            this.serverOffset = 0;
        }

        /*
         * Firebase thay đổi thì kiểm tra ngay.
         */
        listenFirebase(
            db.ref('limited_events'),
            'value',
            snapshot => {
                this.events =
                    snapshot.val() || {};

                this.evaluate();
            }
        );

        /*
         * Trang đang mở vẫn tự phát hiện
         * đúng thời điểm sự kiện bắt đầu.
         */
        this.timer = setInterval(
            () => this.evaluate(),
            30000
        );

        /*
         * Quay lại tab hoặc cửa sổ thì kiểm tra ngay.
         */
        window.addEventListener(
            'focus',
            () => this.evaluate()
        );

        document.addEventListener(
            'visibilitychange',
            () => {
                if (!document.hidden) {
                    this.evaluate();
                }
            }
        );
    }
};

function showEventBanner(ev) {
    const banner =
        document.getElementById(
            'dynamicEventBanner'
        );

    const title =
        document.getElementById(
            'eventBannerTitle'
        );

    const description =
        document.getElementById(
            'eventBannerDesc'
        );

    if (
        !banner ||
        !title ||
        !description ||
        !ev
    ) {
        return;
    }

    const instanceKey =
        ev._instanceKey || ev.id;

    if (
        instanceKey &&
        LimitedEventAnnouncementManager
            .dismissedInstances
            .has(instanceKey)
    ) {
        return;
    }

    title.textContent =
        ev.name ||
        'Sự kiện giới hạn đã mở';

    description.textContent =
        ev.desc ||
        (
            'Một sự kiện giới hạn thời gian ' +
            'vừa chính thức mở cửa.'
        );

    banner.dataset.targetClass =
        ev.targetClass || '';

    banner.dataset.targetSelector =
        ev.targetSelector || '';

    banner.dataset.eventId =
        ev.id || '';

    banner.dataset.eventInstance =
        instanceKey || '';

    banner.style.display = 'block';
}

/*
 * Học sinh bấm X.
 * Sau đó tự chuyển sang thông báo sự kiện tiếp theo,
 * nếu đang có nhiều sự kiện cùng hoạt động.
 */
window.closeEventBanner = function (event) {
    if (
        event &&
        typeof event.stopPropagation ===
        'function'
    ) {
        event.stopPropagation();
    }

    const banner =
        document.getElementById(
            'dynamicEventBanner'
        );

    if (!banner) return;

    const instanceKey =
        banner.dataset.eventInstance ||
        banner.dataset.eventId;

    if (instanceKey) {
        LimitedEventAnnouncementManager
            .dismissedInstances
            .add(instanceKey);
    }

    banner.style.display = 'none';

    setTimeout(() => {
        LimitedEventAnnouncementManager
            .evaluate();
    }, 100);
};

/*
 * Học sinh bấm vào banner.
 */
window.goToEventGame = function () {
    if (window.currentActiveExamId) {
        window.showExamLockWarning(
            '⚠️ Bạn đang làm bài thi, ' +
            'không thể tham gia trò chơi lúc này!'
        );

        return;
    }

    const banner =
        document.getElementById(
            'dynamicEventBanner'
        );

    if (!banner) return;

    /*
     * Đánh dấu đã xem để timer 30 giây
     * không làm banner hiện lại.
     */
    const instanceKey =
        banner.dataset.eventInstance ||
        banner.dataset.eventId;

    if (instanceKey) {
        LimitedEventAnnouncementManager
            .dismissedInstances
            .add(instanceKey);
    }

    const gameTabButton =
        document.querySelector(
            '.nav-item[onclick*="tab-game"]'
        );

    if (gameTabButton) {
        switchTab(
            'tab-game',
            gameTabButton
        );
    }

    banner.style.display = 'none';

    const targetSelector =
        banner.dataset.targetSelector;

    const targetClass =
        banner.dataset.targetClass;

    setTimeout(() => {
        let targetElement = null;

        /*
         * Cách mới: nhận selector đầy đủ.
         * Ví dụ #royalEventCard.
         */
        if (targetSelector) {
            try {
                targetElement =
                    document.querySelector(
                        targetSelector
                    );
            } catch (error) {
                console.warn(
                    'targetSelector không hợp lệ:',
                    targetSelector
                );
            }
        }

        /*
         * Tương thích dữ liệu cũ dùng targetClass.
         */
        if (
            !targetElement &&
            targetClass
        ) {
            targetElement =
                document.querySelector(
                    `.${targetClass}`
                ) ||
                document.getElementById(
                    targetClass
                );
        }

        if (targetElement) {
            document
                .querySelectorAll(
                    '.event-target-focus'
                )
                .forEach(element => {
                    element.classList.remove(
                        'event-target-focus'
                    );
                });

            targetElement.classList.add(
                'event-target-focus'
            );

            /*
             * Cuộn tới sự kiện sau khi tab Trò chơi
             * đã tính toán xong kích thước.
             */
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });

            setTimeout(() => {
                targetElement.classList.remove(
                    'event-target-focus'
                );
            }, 7000);
        }

        /*
         * Hiện sự kiện tiếp theo nếu có.
         */
        setTimeout(() => {
            LimitedEventAnnouncementManager
                .evaluate();
        }, 700);
    }, 350);
};

window.openHoiHoaChest = async function (chestKey) {
    if (window.__hhChestOpening) {
        alert('Rương đang được xử lý, vui lòng chờ.');
        return;
    }

    if (
        !currentUser ||
        !currentUser.username
    ) {
        alert('Không xác định được tài khoản học sinh.');
        return;
    }

    const accepted = confirm(
        'Bạn có muốn mở Rương Kho Báu Hội Họa không?\n\n' +
        '• 1%: Vật phẩm Hội Họa\n' +
        '• 8%: Thẻ giảm giá 10–35%, dùng 1 lần, hạn 30 ngày\n' +
        '  Chỉ dùng cho vật phẩm bán bằng Coin dưới 700 Coin;\n' +
        '  không dùng cho vật phẩm sự kiện, Doraemon và Truyền thuyết,...\n' +
        '• 91%: 100–700 Coin'
    );

    if (!accepted) return;

    window.__hhChestOpening = true;

    const username = currentUser.username;

    const chestRef = db.ref(
        `student_inventory/${username}/${chestKey}`
    );

    let rewardApplied = false;
    let chestClaimed = false;

    const addCoins = async amount => {
        await db
            .ref(`student_coins/${username}`)
            .transaction(current => {
                return Number(current || 0) + amount;
            });
    };

    const normalizeTag = value => {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');
    };

    try {
        /*
         * Đánh dấu rương đang mở để ngăn người dùng
         * nhấn nhiều lần và nhận phần thưởng trùng.
         */
        const claimResult =
            await chestRef.transaction(current => {
                if (
                    !current ||
                    current.opening === true
                ) {
                    return;
                }

                if (
                    current.id !== 'chest_hoihoa' ||
                    current.type !== 'chest'
                ) {
                    return;
                }

                return {
                    ...current,
                    opening: true,
                    openingAt: Date.now()
                };
            });

        if (!claimResult.committed) {
            throw new Error(
                'Rương không tồn tại hoặc đang được mở ở phiên khác.'
            );
        }

        chestClaimed = true;

        if (
            typeof window.closeBagItemPopup ===
            'function'
        ) {
            window.closeBagItemPopup();
        }

        const randomValue = Math.random();

        let rewardText = '';
        let rewardType = '';

        /*
         * 1%: Vật phẩm có tag Hội Họa.
         */
        if (randomValue < 0.01) {
            const storeItems =
                typeof StoreConfig !== 'undefined' &&
                    Array.isArray(StoreConfig.items)
                    ? StoreConfig.items
                    : [];

            const artItems = storeItems.filter(item => {
                if (!item || !item.id) return false;

                const possibleTags = [];

                if (item.tag) {
                    possibleTags.push(item.tag);
                }

                if (Array.isArray(item.tags)) {
                    possibleTags.push(...item.tags);
                }

                if (item.category) {
                    possibleTags.push(item.category);
                }

                return possibleTags.some(tag => {
                    return normalizeTag(tag)
                        .includes('hoihoa');
                });
            });

            if (!artItems.length) {
                await addCoins(200);

                rewardType = 'coins_compensation';

                rewardText =
                    '🪙 200 Coin ' +
                    '(bù do chưa có vật phẩm tag Hội Họa)';
            } else {
                const randomItem =
                    artItems[
                    Math.floor(
                        Math.random() *
                        artItems.length
                    )
                    ];

                const inventorySnap = await db
                    .ref(
                        `student_inventory/${username}`
                    )
                    .once('value');

                const inventory =
                    inventorySnap.val() || {};

                const alreadyOwned =
                    Object.values(inventory).some(
                        inventoryItem => {
                            return (
                                inventoryItem &&
                                String(inventoryItem.id) ===
                                String(randomItem.id)
                            );
                        }
                    );

                if (alreadyOwned) {
                    await addCoins(200);

                    rewardType =
                        'duplicate_compensation';

                    rewardText =
                        `🪙 200 Coin ` +
                        `(vật phẩm “${randomItem.name}” đã có)`;
                } else {
                    await db
                        .ref(
                            `student_inventory/${username}/${randomItem.id}`
                        )
                        .set({
                            id: randomItem.id,
                            purchaseTime: Date.now(),
                            isEquipped: false,
                            isTrial: null,
                            trialExpiry: null,

                            source:
                                'hoihoa_chest'
                        });

                    rewardType = 'item';

                    rewardText =
                        `🎨 Vật phẩm Hội Họa: ` +
                        `${randomItem.name}`;
                }
            }
        }

        /*
         * 8%: Thẻ giảm giá.
         *
         * Khoảng xác suất:
         * từ 1% đến dưới 9%.
         */
        else if (randomValue < 0.09) {
            const percent =
                Math.floor(Math.random() * 26) + 10;

            const discountKey =
                `hh_chest_discount_` +
                `${Date.now()}_` +
                `${Math.random()
                    .toString(36)
                    .slice(2, 8)}`;

            await db
                .ref(
                    `student_discounts/${username}/${discountKey}`
                )
                .set({
                    percent,
                    isUsed: false,
                    targetItem: ['all'],

                    // Thẻ chỉ dùng một lần.
                    usageLimit: 1,

                    // Thời hạn tính từ thời điểm mở rương.
                    createdAt: Date.now(),

                    expiry:
                        Date.now() +
                        30 * 24 * 60 * 60 * 1000,

                    source: 'hoihoa_chest',
                    rewardType: 'hoihoa_treasure_chest',

                    maxEligiblePriceExclusive: 700,
                    excludesEventItems: true,

                    excludedTags: [
                        'Doraemon',
                        'Truyền thuyết'
                    ]
                });

            rewardType = 'discount';

            rewardText =
                `🏷️ Thẻ giảm giá ${percent}% ` +
                `(dùng 1 lần, hạn 30 ngày, ` +
                `chỉ áp dụng cho món Coin dưới 700)`;
        }

        /*
         * 91% còn lại: Coin từ 100 đến 700.
         */
        else {
            const coinAmount =
                Math.floor(Math.random() * 601) + 100;

            await addCoins(coinAmount);

            rewardType = 'coins';

            rewardText =
                `🪙 ${coinAmount} Coin`;
        }

        rewardApplied = true;

        /*
         * Chỉ xóa rương sau khi phần thưởng
         * đã được cộng thành công.
         */
        await chestRef.remove();

        alert(
            '🎉 Mở Rương Kho Báu thành công!\n\n' +
            `Bạn nhận được: ${rewardText}`
        );

        console.log(
            '[Hội Họa] Kết quả mở rương:',
            {
                chestKey,
                rewardType,
                rewardText,
                openedAt: new Date().toISOString()
            }
        );

        if (
            typeof renderStudentBag ===
            'function'
        ) {
            await renderStudentBag();
        }
    } catch (error) {
        console.error(
            'Lỗi mở Rương Kho Báu Hội Họa:',
            error
        );

        /*
         * Nếu chưa nhận được phần thưởng,
         * trả rương về trạng thái có thể mở lại.
         */
        if (
            chestClaimed &&
            !rewardApplied
        ) {
            try {
                await chestRef.update({
                    opening: false,
                    openingAt: null
                });
            } catch (_) {
                // Không ghi đè lỗi chính.
            }
        }

        if (rewardApplied) {
            alert(
                'Phần thưởng đã được cộng nhưng chưa dọn được rương.\n' +
                'Hãy tải lại trang và không mở lại rương này.'
            );
        } else {
            alert(
                `Không mở được rương: ${error.message ||
                'lỗi không xác định'
                }`
            );
        }
    } finally {
        window.__hhChestOpening = false;
    }
};

// ======================================================
// KHÓA THÔNG BÁO VÀ KHẢO SÁT BẮT BUỘC
// Chặn bấm nền ngoài, nút đóng và phím ESC
// ======================================================
(function installMandatoryModalGuards() {
    const modalConfigs = [
        {
            id: 'studentNotificationModal',

            // Còn thông báo chưa xác nhận thì khóa
            isLocked: function () {
                return !!window.currentMandatoryNotification;
            },

            // Nút này vẫn được phép bấm
            allowedButtonIds: ['btnAcknowledgeNotification']
        },
        {
            id: 'studentSurveyModal',

            // Còn khảo sát chưa nộp thì khóa
            isLocked: function () {
                return !!window.currentActiveSurvey;
            },

            // Nút gửi khảo sát vẫn được phép bấm
            allowedButtonIds: ['btnSubmitSurvey']
        }
    ];

    function getLockedModals() {
        const result = [];

        modalConfigs.forEach(function (config) {
            const modal = document.getElementById(config.id);

            if (
                modal &&
                modal.classList.contains('active') &&
                config.isLocked()
            ) {
                result.push({
                    modal: modal,
                    config: config
                });
            }
        });

        return result;
    }

    // Kiểm tra học sinh có bấm nút X hoặc nút đóng không
    function isCloseControl(target, modal, config) {
        if (!(target instanceof Element)) return false;

        const control = target.closest(
            [
                '[data-close-modal]',
                '[data-dismiss="modal"]',
                '.modal-close',
                '.close-modal',
                '.close',
                '[aria-label="Close"]',
                '[aria-label="Đóng"]'
            ].join(',')
        );

        if (!control || !modal.contains(control)) {
            return false;
        }

        // Không chặn nút xác nhận hoặc nút gửi khảo sát
        if (
            control.id &&
            config.allowedButtonIds.includes(control.id)
        ) {
            return false;
        }

        return true;
    }

    function showLockedMessage(config) {
        if (typeof window.showToast !== 'function') return;

        if (config.id === 'studentSurveyModal') {
            window.showToast(
                'Bạn phải trả lời đầy đủ và gửi khảo sát trước khi thoát.',
                'warning'
            );
        } else {
            window.showToast(
                'Bạn phải đọc và xác nhận thông báo trước khi thoát.',
                'warning'
            );
        }
    }

    function blockCloseAttempt(event) {
        const lockedModals = getLockedModals();

        if (lockedModals.length === 0) return;

        for (const item of lockedModals) {
            const modal = item.modal;
            const config = item.config;

            // Bấm đúng vào lớp nền mờ bên ngoài nội dung
            const clickedOutside = event.target === modal;

            // Bấm nút X hoặc nút đóng
            const clickedCloseButton = isCloseControl(
                event.target,
                modal,
                config
            );

            if (!clickedOutside && !clickedCloseButton) {
                continue;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            showLockedMessage(config);
            return;
        }
    }

    // capture=true để chặn trước những onclick đóng modal khác
    document.addEventListener(
        'pointerdown',
        blockCloseAttempt,
        true
    );

    document.addEventListener(
        'click',
        blockCloseAttempt,
        true
    );

    // Chặn phím ESC
    document.addEventListener(
        'keydown',
        function (event) {
            if (event.key !== 'Escape') return;

            const lockedModals = getLockedModals();

            if (lockedModals.length === 0) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            showLockedMessage(lockedModals[0].config);
        },
        true
    );
})();

window.handleExamInterruption = async function (
    reason,
    options = {}
) {
    if (
        window.isSelectingFile ||
        window.isFinalizingExamSubmission ||
        window.isManualExamSubmissionProcessing ||
        window.isSubmissionResumeRequired ||
        window.isHandlingExamInterruption ||
        !window.currentActiveExamId
    ) {
        return;
    }

    const assignId =
        window.currentActiveExamId;

    /*
     * Khi điện thoại khóa màn hình:
     * blur và fullscreenchange có thể phát ra gần nhau.
     * Chỉ xử lý một lần trong vòng 2,5 giây.
     */
    if (
        window.examInterruptionGuard
            ?.isDuplicate(assignId)
    ) {
        return;
    }

    const countAsViolation =
        options.countAsViolation !== false;

    window.isHandlingExamInterruption =
        true;

    try {
        let interruptionCount = 0;

        if (countAsViolation) {
            /*
             * Máy tính:
             * vẫn tăng số lần vi phạm như cũ.
             */
            interruptionCount =
                window.examRecoveryManager
                    .interrupt(
                        assignId,
                        reason
                    );

        } else {
            /*
             * Điện thoại/Zalo:
             * chỉ lưu trạng thái tạm ngắt,
             * không tăng số lần vi phạm.
             */
            interruptionCount =
                await window
                    .recordSoftExamInterruption(
                        assignId,
                        reason
                    );
        }

        /*
         * Kết thúc trạng thái thi hiện tại,
         * nhưng bản nháp vẫn được giữ.
         */
        await window.finishStudentExamMode(
            assignId,
            {
                exitFullscreen:
                    reason !== 'fullscreen'
            }
        );

        /*
         * Chỉ tự động thu bài khi đây là
         * sự kiện được phép tính vi phạm.
         */
        if (
            countAsViolation &&
            interruptionCount >= 2
        ) {
            alert(
                '⚠️ Bài thi đã bị gián đoạn nhiều lần. ' +
                'Hệ thống tự động thu bài.'
            );

            await submitAssignment(
                assignId,
                true,
                true
            );

            return;
        }

        /*
         * Không vi phạm hoặc mới vi phạm lần đầu:
         * yêu cầu học sinh tiếp tục vào toàn màn hình.
         */
        setTimeout(() => {
            window.showExamWarning(
                String(assignId),
                true
            );

            if (
                typeof window.showToast ===
                'function'
            ) {
                window.showToast(
                    countAsViolation
                        ? (
                            'Bản nháp đã được bảo vệ. ' +
                            'Hãy bấm nút tiếp tục thi ' +
                            'để vào lại toàn màn hình.'
                        )
                        : (
                            'Điện thoại hoặc trình duyệt ' +
                            'vừa tạm ngắt bài thi. ' +
                            'Bản nháp vẫn được giữ; ' +
                            'hãy bấm tiếp tục thi.'
                        ),
                    'warning'
                );
            }
        }, 300);

    } catch (error) {
        console.error(
            'Lỗi xử lý gián đoạn bài thi:',
            error
        );

        if (
            typeof window.showToast ===
            'function'
        ) {
            window.showToast(
                'Không thể xử lý trạng thái bài thi. ' +
                'Bản nháp trên máy vẫn được giữ.',
                'error'
            );
        }

    } finally {
        window.isHandlingExamInterruption =
            false;
    }
};

// ==========================================================
// ĐỀ NGẪU NHIÊN ỔN ĐỊNH THEO HỌC SINH
// ==========================================================
(function initStudentRandomExamModule() {
    const LETTERS = ['A', 'B', 'C', 'D'];

    function hashSeed(value) {
        let hash = 2166136261;
        const input = String(value);

        for (
            let index = 0;
            index < input.length;
            index++
        ) {
            hash ^=
                input.charCodeAt(index);

            hash = Math.imul(
                hash,
                16777619
            );
        }

        return hash >>> 0;
    }

    function randomFromSeed(seed) {
        let state = seed >>> 0;

        return function () {
            state += 0x6D2B79F5;

            let result = state;

            result = Math.imul(
                result ^
                (result >>> 15),
                result | 1
            );

            result ^=
                result +
                Math.imul(
                    result ^
                    (result >>> 7),
                    result | 61
                );

            return (
                (
                    result ^
                    (result >>> 14)
                ) >>> 0
            ) / 4294967296;
        };
    }

    function shuffle(items, seed) {
        const result = items.slice();

        const random =
            randomFromSeed(
                hashSeed(seed)
            );

        for (
            let index =
                result.length - 1;
            index > 0;
            index--
        ) {
            const randomIndex =
                Math.floor(
                    random() *
                    (index + 1)
                );

            [
                result[index],
                result[randomIndex]
            ] = [
                    result[randomIndex],
                    result[index]
                ];
        }

        return result;
    }

    function versionLabel(index) {
        return index < 26
            ? String.fromCharCode(
                65 + index
            )
            : `A${index + 1}`;
    }

    window.getStudentExamQuestions =
        function (
            assign,
            username =
                currentUser?.username ||
                'student'
        ) {
            const sourceQuestions =
                Array.isArray(
                    assign?.questions
                )
                    ? assign.questions
                    : [];

            const config =
                assign?.randomExamConfig ||
                {};

            if (
                !config.enabled ||
                sourceQuestions.length === 0
            ) {
                return {
                    questions:
                        sourceQuestions.map(
                            (question, index) => ({
                                ...question,

                                questionId:
                                    question.questionId ||
                                    `legacy_${index}`,

                                _sourceIndex:
                                    index,

                                _displayIndex:
                                    index
                            })
                        ),

                    versionIndex: 0,
                    versionCode: 'Gốc',
                    randomized: false
                };
            }

            const versionCount =
                Math.max(
                    1,
                    Math.min(
                        50,
                        Number(
                            config.versionCount
                        ) || 1
                    )
                );

            const assignmentId =
                assign.id ||
                assign._fbKey ||
                assign.assignmentId ||
                'assignment';

            const versionIndex =
                hashSeed(
                    `${assignmentId}|${username}`
                ) % versionCount;

            const versionSeed =
                `${assignmentId}|version:` +
                versionIndex;

            const requestedCount =
                Number(
                    config.questionCount
                ) ||
                sourceQuestions.length;

            const questionCount =
                Math.max(
                    1,
                    Math.min(
                        sourceQuestions.length,
                        Math.floor(
                            requestedCount
                        )
                    )
                );

            const base =
                sourceQuestions.map(
                    (question, index) => ({
                        ...question,

                        questionId:
                            question.questionId ||
                            `legacy_${index}`,

                        _sourceIndex:
                            index
                    })
                );

            const selected =
                questionCount < base.length
                    ? shuffle(
                        base,
                        `${versionSeed}|select`
                    ).slice(
                        0,
                        questionCount
                    )
                    : base;

            const ordered =
                config.shuffleQuestions !==
                    false
                    ? shuffle(
                        selected,
                        `${versionSeed}|questions`
                    )
                    : selected
                        .slice()
                        .sort(
                            (a, b) =>
                                a._sourceIndex -
                                b._sourceIndex
                        );

            const questions =
                ordered.map(
                    (
                        question,
                        displayIndex
                    ) => {
                        const output = {
                            ...question,
                            _displayIndex:
                                displayIndex
                        };

                        if (
                            config.shuffleAnswers ===
                            false
                        ) {
                            return output;
                        }

                        const options =
                            LETTERS.map(
                                letter => ({
                                    sourceLetter:
                                        letter,

                                    text:
                                        question[
                                        letter
                                        ]
                                })
                            );

                        const shuffledOptions =
                            shuffle(
                                options,

                                `${versionSeed}|answer|` +
                                `${question.questionId}|` +
                                displayIndex
                            );

                        shuffledOptions.forEach(
                            (
                                option,
                                newIndex
                            ) => {
                                const newLetter =
                                    LETTERS[
                                    newIndex
                                    ];

                                output[newLetter] =
                                    option.text;

                                if (
                                    option.sourceLetter ===
                                    question.correct
                                ) {
                                    output.correct =
                                        newLetter;
                                }
                            }
                        );

                        return output;
                    }
                );

            return {
                questions,
                versionIndex,

                versionCode:
                    versionLabel(
                        versionIndex
                    ),

                randomized: true
            };
        };

    window.buildStudentQuestionResults =
        function (
            questionSet,
            answers
        ) {
            return (
                questionSet?.questions ||
                []
            ).map(
                (question, index) => {
                    const selected =
                        answers?.[index] ??
                        answers?.[
                        String(index)
                        ] ??
                        '';

                    return {
                        questionId:
                            question.questionId ||
                            '',

                        bankQuestionId:
                            question
                                .bankQuestionId ||
                            '',

                        sourceIndex:
                            Number(
                                question
                                    ._sourceIndex ??
                                index
                            ),

                        displayIndex:
                            index,

                        selected,

                        correct:
                            question.correct ||
                            '',

                        isCorrect:
                            Boolean(selected) &&
                            String(selected) ===
                            String(
                                question.correct
                            )
                    };
                }
            );
        };
})();

// =========================================================================
// HỆ THỐNG XUẤT PDF BẢNG ĐIỂM LỘ TRÌNH (PHÍA HỌC SINH)
// =========================================================================

window.downloadStudentRoadmapPDF = async function () {
    // Dùng đúng cùng thuật toán với bảng lộ trình trên màn hình.
    const assignments = await getDB('assignments');
    const submissions = await getDB('submissions');

    const username = String(currentUser?.username || '').trim();
    const stName = currentUser?.name || username || 'HocSinh';

    // Chỉ lấy những bài thực sự giao cho học sinh này.
    const myAssignments = (assignments || []).filter(assign =>
        isRoadmapAssignmentForStudent(assign, username)
    );

    const sortedAssignments = [...myAssignments].sort((a, b) =>
        (a.title || '').localeCompare(
            b.title || '',
            'vi-VN',
            { numeric: true, sensitivity: 'base' }
        )
    );

    let htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="text-align: center; color: #2c3e50; text-transform: uppercase;">
                BẢNG ĐIỂM LỘ TRÌNH HỌC TẬP
            </h2>
            <p style="font-size: 16px;">
                <strong>Họ và tên học sinh:</strong>
                ${studentAttachmentSafeHTML(stName)}
            </p>
            <p style="font-size: 16px;">
                <strong>Ngày xuất:</strong>
                ${new Date().toLocaleDateString('vi-VN')}
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f1f5f9;">
                        <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: left;">Tên bài học</th>
                        <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; width: 100px;">Điểm số</th>
                        <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; width: 140px;">Trạng thái</th>
                        <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; width: 150px;">Hạn nộp</th>
                    </tr>
                </thead>
                <tbody>
    `;

    sortedAssignments.forEach(assign => {
        // Chính helper này cũng được dùng khi tính tiền lộ trình:
        // forcePass -> bài đạt -> bài có điểm -> chấm lại -> bài lỗi.
        const bestSub = getRoadmapSubmission(
            assign,
            submissions,
            username
        );

        let studentScore = '-';
        let statusText = 'Chưa nộp';

        if (bestSub) {
            const parsedGrade = parseRoadmapNumber(
                bestSub.grade,
                NaN
            );

            if (bestSub.forcePass) {
                studentScore = Number.isFinite(parsedGrade)
                    ? parsedGrade
                    : '0';
                statusText = 'Đạt (Được tha)';
            } else if (isRoadmapSubmissionFailed(bestSub)) {
                studentScore = Number.isFinite(parsedGrade)
                    ? parsedGrade
                    : '0';
                statusText = bestSub.isCheatFail
                    ? 'Loại (Vi phạm)'
                    : 'Loại';
            } else if (bestSub.isRegrading) {
                studentScore = '🔄';
                statusText = 'Đang chấm lại';
            } else if (Number.isFinite(parsedGrade)) {
                studentScore = parsedGrade;
                statusText = isRoadmapSubmissionPassed(
                    assign,
                    bestSub
                )
                    ? 'Đạt'
                    : 'Loại';
            } else {
                statusText = 'Chưa chấm';
            }
        }

        htmlContent += `
            <tr>
                <td style="border: 1px solid #cbd5e1; padding: 12px;">
                    ${studentAttachmentSafeHTML(assign?.title || 'Bài học')}
                </td>
                <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; font-weight: bold; color: #e11d48;">
                    ${studentAttachmentSafeHTML(studentScore)}
                </td>
                <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">
                    ${studentAttachmentSafeHTML(statusText)}
                </td>
                <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; color: #64748b;">
                    ${studentAttachmentSafeHTML(assign?.endDate || 'Không giới hạn')}
                </td>
            </tr>
        `;
    });

    htmlContent += `
                </tbody>
            </table>
        </div>
    `;

    const safeFileName = String(stName)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '');

    const opt = {
        margin: 10,
        filename: `BangDiem_LoTrinh_${safeFileName || 'HocSinh'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    };

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    await html2pdf()
        .set(opt)
        .from(tempDiv)
        .save();
};

