/*
 * store-collections-page-v12-auto-detect.js
 *
 * Cách hoạt động:
 * 1. Thêm nút mũi tên cạnh tiêu đề "Cửa hàng Vật phẩm".
 * 2. Nhấn mũi tên chỉ làm trượt xuống một mục điều hướng "Sưu tầm".
 * 3. Nhấn "Sưu tầm" sẽ chuyển sang trang Sưu tầm.
 * 4. Ở trang Sưu tầm, tiêu đề và menu đổi thành "Sưu tầm" / "Cửa hàng".
 * 5. Trang Sưu tầm chỉ hiển thị vật phẩm, không có nút Mua/Dùng thử.
 * 6. Khi đạt mốc, Coin được cộng thẳng vào số dư và hiện thông báo trên màn hình.
 * 7. Nút ! tự đọc cấu hình và nút hành động hiện có để phát hiện cách nhận vật phẩm.
 *
 * Hãy nạp file này sau store-manager.js và student.js.
 */
(() => {
    'use strict';

    const IDS = Object.freeze({
        toggle: 'storeCollectionArrow',
        dropdown: 'storeCollectionDropdown',
        openButton: 'storeCollectionOpenButton',
        page: 'storeCollectionPage',
        tabs: 'storeCollectionTabs',
        summary: 'storeCollectionSummary',
        rewards: 'storeCollectionRewards',
        grid: 'storeCollectionGrid',
        acquisitionModal: 'storeCollectionAcquisitionModal',
        acquisitionTitle: 'storeCollectionAcquisitionTitle',
        acquisitionBody: 'storeCollectionAcquisitionBody'
    });

    /*
     * Các nhóm vật phẩm trong trang Sưu tầm.
     * - tags: khớp chính xác sau khi chuẩn hóa chữ hoa, chữ thường và dấu.
     * - tagPrefixes: khớp theo tiền tố; dùng cho các tag có thêm năm,
     *   ví dụ "Sinh nhật 2026", "Sinh nhật 2027"...
     */
    const CATEGORY_COLLECTIONS = Object.freeze([
        {
            id: 'daily-life',
            label: 'Đời thường',
            icon: '🌦️',
            tags: [
                'Đời thường',
                'Đời sống',
                'Ban đêm',
                'Ban ngày',
                'Cơn mưa'
            ]
        },
        {
            id: 'lord-of-the-mysteries',
            label: 'Quỷ Bí Chi Chủ',
            icon: '♜',
            tags: ['Lord of the Mysteries']
        },
        {
            id: 'legendary',
            label: 'Truyền thuyết',
            icon: '👑',
            tags: ['Truyền thuyết']
        },
        {
            id: 'fairy-tale',
            label: 'Cổ tích',
            icon: '🏰',
            tags: ['Cổ tích']
        },
        {
            id: 'universe',
            label: 'Vũ trụ',
            icon: '🌌',
            tags: [
                'Sao thủy',
                'Vũ trụ',
                'Hệ mặt trời'
            ]
        },
        {
            id: 'birthday',
            label: 'Sinh nhật',
            icon: '🎂',
            tags: ['Sinh nhật'],
            tagPrefixes: ['Sinh nhật']
        },
        {
            id: 'seven-deadly-sins',
            label: 'Thất Đại Tội',
            icon: '⚔️',
            tags: ['Thất Đại Tội']
        },
        {
            id: 'painting',
            label: 'Hội họa',
            icon: '🎨',
            tags: ['Hội họa']
        },
        {
            id: 'doraemon',
            label: 'Doraemon',
            icon: '🔔',
            tags: ['Doraemon']
        },
        {
            id: 'spring',
            label: 'Mùa xuân',
            icon: '🌸',
            tags: ['Mùa xuân'],

            excludeLuxury: true,

            // Mỗi mốc thưởng cao hơn bộ khác 30 Coin
            rewardBonusCoins: 30
        },
    ]);

    const COLLECTIONS = Object.freeze([
        {
            id: 'all',
            label: 'Tất cả sưu tầm',
            icon: '🗂️',
            isAll: true,
            tags: []
        },
        ...CATEGORY_COLLECTIONS
    ]);

    /*
     * Mốc thưởng áp dụng riêng cho từng bộ sưu tầm, không áp dụng cho
     * mục "Tất cả sưu tầm". Mỗi mốc chỉ được cộng đúng một lần vào
     * số dư Coin nhờ khóa nhận thưởng trong Firebase.
     */
    const REWARD_MILESTONES = Object.freeze([
        { count: 3, coins: 20 },
        { count: 5, coins: 30 },
        { count: 10, coins: 40 },
        { count: 15, coins: 50 },
        { count: 20, coins: 60 }
    ]);

    function getCollectionRewardCoins(
        collection,
        milestone
    ) {
        return (
            Number(milestone?.coins || 0) +
            Number(collection?.rewardBonusCoins || 0)
        );
    }

    let activeCollectionId = 'all';
    let collectedItemIds = new Set();
    let inventoryListenerInstalled = false;
    let inventoryListenerRetryTimer = null;
    let rewardClaims = {};
    let rewardClaimListenerInstalled = false;
    let rewardClaimListenerRetryTimer = null;
    let rewardScanPromise = Promise.resolve();
    let rewardErrorNotified = false;
    let acquisitionModalReturnFocus = null;
    let acquisitionModalCollectionId = 'all';

    function normalizeText(value) {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .trim()
            .toLowerCase();
    }

    function escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttribute(value) {
        return escapeHTML(value).replace(/`/g, '&#096;');
    }

    function getDatabase() {
        try {
            if (typeof db !== 'undefined' && db?.ref) return db;
        } catch (_) {
            // Biến db có thể chưa được khởi tạo khi file vừa nạp.
        }

        if (window.db?.ref) return window.db;

        try {
            if (window.firebase?.database) {
                return window.firebase.database();
            }
        } catch (_) {
            // Firebase chưa sẵn sàng; hàm cài listener sẽ thử lại.
        }

        return null;
    }

    function getCurrentStudent() {
        try {
            return JSON.parse(localStorage.getItem('currentUser')) || {};
        } catch (_) {
            return {};
        }
    }

    function getCurrentUsername() {
        return String(getCurrentStudent().username || '').trim();
    }

    function normalizeInventorySnapshotValue(value) {
        const nextIds = new Set();

        Object.entries(value || {}).forEach(([key, rawEntry]) => {
            if (!rawEntry || typeof rawEntry !== 'object') return;

            const itemId = String(rawEntry.id || key || '').trim();
            if (!itemId) return;

            /*
             * Dùng thử không được tính vào Sưu tầm. Mọi vật phẩm sở hữu
             * vĩnh viễn đều được tính, dù mua bằng Coin hay nhận từ sự kiện,
             * hộp thư, vòng quay hoặc Xu Sinh Nhật.
             */
            const isTrial = rawEntry.isTrial === true ||
                Number(rawEntry.trialExpiry || 0) > 0;

            if (!isTrial) nextIds.add(itemId);
        });

        return nextIds;
    }

    function isItemCollected(itemOrId) {
        const itemId = typeof itemOrId === 'object'
            ? itemOrId?.id
            : itemOrId;

        return collectedItemIds.has(String(itemId || ''));
    }

    function getServerTimestamp() {
        return window.firebase?.database?.ServerValue?.TIMESTAMP || Date.now();
    }

    function getServerIncrement(amount) {
        const increment = window.firebase?.database?.ServerValue?.increment;

        if (typeof increment !== 'function') {
            throw new Error('FIREBASE_SERVER_INCREMENT_UNAVAILABLE');
        }

        return increment(Number(amount) || 0);
    }

    function buildRewardMessageKey(collectionId, milestoneCount) {
        return `collection_reward_${collectionId}_${milestoneCount}`;
    }

    function buildRewardClaimPath(username, collectionId, milestoneCount) {
        return [
            'student_collection_rewards',
            username,
            collectionId,
            String(milestoneCount)
        ].join('/');
    }

    function getRewardClaim(collectionId, milestoneCount) {
        return rewardClaims?.[collectionId]?.[String(milestoneCount)] || null;
    }

    function setLocalRewardClaim(collectionId, milestoneCount, value) {
        rewardClaims = {
            ...(rewardClaims || {}),
            [collectionId]: {
                ...(rewardClaims?.[collectionId] || {}),
                [String(milestoneCount)]: value
            }
        };
    }

    function createClaimToken() {
        if (window.crypto?.randomUUID) return window.crypto.randomUUID();

        return [
            Date.now().toString(36),
            Math.random().toString(36).slice(2),
            Math.random().toString(36).slice(2)
        ].join('_');
    }

    async function creditCollectionMilestone(
        database,
        username,
        collection,
        milestone
    ) {
        const rewardCoins =
            getCollectionRewardCoins(
                collection,
                milestone
            );
        const milestoneKey = String(milestone.count);
        const claimPath = buildRewardClaimPath(
            username,
            collection.id,
            milestone.count
        );
        const claimRef = database.ref(claimPath);
        const claimToken = createClaimToken();
        const now = Date.now();
        const messageKey = buildRewardMessageKey(
            collection.id,
            milestone.count
        );

        /*
         * Bước 1: giữ chỗ mốc bằng transaction. Chỉ tab giữ đúng claimToken
         * mới được đi tiếp, nên mở nhiều tab cũng không cộng trùng Coin.
         */
        const reservation = await claimRef.transaction(current => {
            if (current?.status === 'sent') return;

            if (current?.status === 'reserved') {
                const age = now - Number(current.reservedAt || 0);

                // Một tab khác vẫn đang xử lý; không tranh quyền trong 15 giây.
                if (age >= 0 && age < 15000) return;

                /*
                 * Nếu lần trước dừng giữa chừng, cho phép tiếp quản. Giữ nguyên
                 * các trường bất biến để phù hợp Firebase Rules hiện tại.
                 */
                return {
                    ...current,
                    status: 'reserved',
                    collectionId: current.collectionId,
                    collectionLabel: current.collectionLabel,
                    milestone: current.milestone,
                    milestoneKey: current.milestoneKey,
                    rewardCoins: current.rewardCoins,
                    reservedAt: current.reservedAt,
                    messageKey: current.messageKey,
                    rewardVersion: current.rewardVersion,
                    claimToken
                };
            }

            return {
                status: 'reserved',
                collectionId: collection.id,
                collectionLabel: collection.label,
                milestone: milestone.count,
                milestoneKey,
                rewardCoins: rewardCoins,
                reservedAt: now,
                messageKey,
                rewardVersion: 1,
                claimToken
            };
        });

        const reserved = reservation.snapshot?.val?.() || null;

        if (
            !reservation.committed ||
            !reserved ||
            reserved.status !== 'reserved' ||
            reserved.claimToken !== claimToken
        ) {
            return { credited: false, coins: 0 };
        }

        /*
         * Bước 2: cộng Coin và đổi trạng thái sang sent trong CÙNG một update.
         * ServerValue.increment tránh ghi đè khi số dư thay đổi ở tab khác.
         * Hai thay đổi thành công cùng nhau hoặc thất bại cùng nhau.
         */
        const sentAt = getServerTimestamp();
        const updates = {};

        updates[`student_coins/${username}`] = getServerIncrement(
            rewardCoins
        );

        updates[claimPath] = {
            status: 'sent',
            collectionId: collection.id,
            collectionLabel: collection.label,
            milestone: milestone.count,
            milestoneKey,
            rewardCoins: rewardCoins,
            reservedAt: Number(reserved.reservedAt) || now,
            sentAt,
            messageKey,
            rewardVersion: 1,
            claimToken
        };

        await database.ref().update(updates);

        setLocalRewardClaim(
            collection.id,
            milestone.count,
            updates[claimPath]
        );

        return {
            credited: true,
            coins: rewardCoins,
            collectionLabel: collection.label,
            milestone: milestone.count
        };
    }

    async function checkCollectionMilestoneRewards() {
        const database = getDatabase();
        const username = getCurrentUsername();

        if (!database || !username) return;

        let creditedCoins = 0;
        let creditedMilestones = 0;

        for (const collection of CATEGORY_COLLECTIONS) {
            const ownedCount = getCollectionItems(collection.id)
                .reduce((total, item) => (
                    total + (isItemCollected(item) ? 1 : 0)
                ), 0);

            for (const milestone of REWARD_MILESTONES) {
                if (ownedCount < milestone.count) continue;

                const currentClaim = getRewardClaim(
                    collection.id,
                    milestone.count
                );

                if (currentClaim?.status === 'sent') continue;

                try {
                    const result = await creditCollectionMilestone(
                        database,
                        username,
                        collection,
                        milestone
                    );

                    if (result.credited) {
                        creditedCoins += result.coins;
                        creditedMilestones += 1;
                    }
                } catch (error) {
                    console.warn(
                        '[Sưu tầm] Không thể cộng thưởng mốc:',
                        collection.id,
                        milestone.count,
                        error
                    );

                    if (
                        !rewardErrorNotified &&
                        typeof window.showToast === 'function'
                    ) {
                        rewardErrorNotified = true;
                        window.showToast(
                            'Chưa thể cộng thưởng Sưu tầm. Hãy kiểm tra Firebase Rules rồi tải lại trang.',
                            'warning'
                        );
                    }
                }
            }
        }

        if (creditedCoins > 0) {
            rewardErrorNotified = false;
            renderCollection(activeCollectionId);

            if (typeof window.showToast === 'function') {
                window.showToast(
                    `🎉 Đã cộng ${creditedCoins.toLocaleString('vi-VN')} Coin ` +
                    `từ ${creditedMilestones} mốc Sưu tầm vào số dư!`,
                    'success'
                );
            }

            window.dispatchEvent(new CustomEvent(
                'store-collection-reward-credited',
                {
                    detail: {
                        username,
                        coins: creditedCoins,
                        milestones: creditedMilestones
                    }
                }
            ));
        }
    }

    function queueCollectionRewardScan() {
        rewardScanPromise = rewardScanPromise
            .then(() => checkCollectionMilestoneRewards())
            .catch(error => {
                console.warn('[Sưu tầm] Lỗi quét phần thưởng:', error);
            });

        return rewardScanPromise;
    }

    function installRewardClaimListener(attempt = 0) {
        if (rewardClaimListenerInstalled) return true;

        const database = getDatabase();
        const username = getCurrentUsername();

        if (!database || !username) {
            if (attempt < 80) {
                clearTimeout(rewardClaimListenerRetryTimer);
                rewardClaimListenerRetryTimer = window.setTimeout(
                    () => installRewardClaimListener(attempt + 1),
                    150
                );
            }
            return false;
        }

        rewardClaimListenerInstalled = true;

        database
            .ref(`student_collection_rewards/${username}`)
            .on(
                'value',
                snapshot => {
                    rewardClaims = snapshot.val() || {};
                    renderCollection(activeCollectionId);
                    queueCollectionRewardScan();
                },
                error => {
                    console.warn(
                        '[Sưu tầm] Không đọc được trạng thái thưởng:',
                        error
                    );
                }
            );

        return true;
    }

    function installInventoryListener(attempt = 0) {
        if (inventoryListenerInstalled) return true;

        const database = getDatabase();
        const username = getCurrentUsername();

        if (!database || !username) {
            if (attempt < 80) {
                clearTimeout(inventoryListenerRetryTimer);
                inventoryListenerRetryTimer = window.setTimeout(
                    () => installInventoryListener(attempt + 1),
                    150
                );
            } else {
                console.warn('[Sưu tầm] Không thể kết nối dữ liệu Túi đồ.');
            }
            return false;
        }

        inventoryListenerInstalled = true;

        database
            .ref(`student_inventory/${username}`)
            .on(
                'value',
                snapshot => {
                    collectedItemIds = normalizeInventorySnapshotValue(
                        snapshot.val() || {}
                    );

                    renderCollection(activeCollectionId);
                    queueCollectionRewardScan();
                },
                error => {
                    console.warn(
                        '[Sưu tầm] Không đọc được Túi đồ học sinh:',
                        error
                    );
                }
            );

        return true;
    }

    function getStoreItems() {
        try {
            if (
                typeof StoreConfig !== 'undefined' &&
                StoreConfig &&
                Array.isArray(StoreConfig.items)
            ) {
                /*
                 * Lấy trực tiếp từ StoreConfig.items để vật phẩm vẫn xuất hiện
                 * dù cửa hàng chính đang ẩn vì ngày bán, khóa hoặc điều kiện khác.
                 */
                return StoreConfig.items.filter(Boolean);
            }
        } catch (error) {
            console.warn('[Sưu tầm] Không đọc được StoreConfig.items:', error);
        }

        return [];
    }

    function getCollection(collectionId) {
        return COLLECTIONS.find(collection => collection.id === collectionId)
            || COLLECTIONS[0];
    }

    function getItemTags(item) {
        return [
            item?.tag,
            ...(Array.isArray(item?.tags) ? item.tags : [])
        ]
            .filter(Boolean)
            .map(normalizeText);
    }

    function itemMatchesCollection(item, collection) {
        if (!item || !collection || collection.isAll) return false;

        // Bộ sưu tập có excludeLuxury sẽ bỏ vật phẩm Luxury
        if (
            collection.excludeLuxury === true &&
            item.luxuryOnly === true
        ) {
            return false;
        }

        const itemTags = getItemTags(item);
        const acceptedTags = new Set(
            (collection.tags || []).map(normalizeText)
        );
        const acceptedPrefixes = (collection.tagPrefixes || [])
            .map(normalizeText)
            .filter(Boolean);

        return itemTags.some(tag => {
            if (acceptedTags.has(tag)) return true;

            return acceptedPrefixes.some(prefix => (
                tag === prefix || tag.startsWith(`${prefix} `)
            ));
        });
    }

    function getCollectionItems(collectionId) {
        const collection = getCollection(collectionId);
        const items = getStoreItems();

        if (collection.isAll) {
            return items.filter(item => (
                CATEGORY_COLLECTIONS.some(category => (
                    itemMatchesCollection(item, category)
                ))
            ));
        }

        return items.filter(item => itemMatchesCollection(item, collection));
    }


    /*
     * ================================================================
     * TỰ PHÁT HIỆN CÁCH NHẬN VẬT PHẨM
     * ================================================================
     * Không khai báo thủ công cách nhận cho từng bộ hoặc từng vật phẩm.
     * Bộ dò gọi chính StoreManager.renderStoreItem() rồi đọc các nút hành
     * động mà Cửa hàng hiện tại sinh ra. Vì vậy khi giá, lịch mở bán, cờ
     * sự kiện, Xu Sinh Nhật hoặc trạng thái khóa thay đổi, nội dung nút !
     * cũng tự đổi theo dữ liệu đang chạy trên website.
     */
    function getStoreManagerAPI() {
        try {
            if (
                typeof StoreManager !== 'undefined' &&
                StoreManager &&
                typeof StoreManager.renderStoreItem === 'function'
            ) {
                return StoreManager;
            }
        } catch (_) {
            // StoreManager có thể chưa được nạp ở thời điểm rất sớm.
        }

        return null;
    }

    function cleanDetectedActionText(value) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getDetectedActionKind(text, element = null) {
        const normalized = normalizeText(text);
        const className = String(element?.className || '');

        if (normalized.includes('xu sinh nhat')) return 'birthday-coin';
        if (normalized.includes('xu dac biet')) return 'special-coin';
        if (normalized.includes('su kien')) return 'event';
        if (
            normalized.includes('mua') ||
            className.includes('btn-buy')
        ) return 'store';
        if (
            normalized.includes('mo lai') ||
            normalized.includes('mo sau') ||
            normalized.includes('chua mo ban') ||
            normalized.includes('het thoi gian')
        ) return 'schedule';
        if (normalized.includes('khoa')) return 'locked';
        return 'other';
    }

    function extractAcquisitionActionsFromMarkup(markup) {
        if (!markup) return [];

        const template = document.createElement('template');
        template.innerHTML = String(markup);

        const buttons = template.content.querySelectorAll('button');
        const actions = [];

        buttons.forEach(button => {
            const text = cleanDetectedActionText(button.textContent);
            if (!text) return;

            const normalized = normalizeText(text);
            const isPreview = button.classList.contains('btn-preview');

            // Dùng thử không phải là sở hữu vĩnh viễn nên không tính là cách nhận.
            if (
                isPreview ||
                normalized.includes('dung thu') ||
                normalized.includes('dang trong 24h dung thu') ||
                normalized.includes('mac ngay') ||
                normalized.includes('thao trang bi')
            ) {
                return;
            }

            const looksLikeAcquisitionAction = Boolean(
                button.classList.contains('btn-buy') ||
                button.classList.contains('annual-sale-locked') ||
                button.id.startsWith('countdown-btn-') ||
                normalized.includes('mua') ||
                normalized.includes('nhan') ||
                normalized.includes('doi') ||
                normalized.includes('can xu') ||
                normalized.includes('su kien') ||
                normalized.includes('mo lai') ||
                normalized.includes('mo sau') ||
                normalized.includes('chua mo ban') ||
                normalized.includes('khoa')
            );

            if (!looksLikeAcquisitionAction) return;

            actions.push({
                text,
                kind: getDetectedActionKind(text, button),
                available: !button.disabled,
                source: 'store-renderer'
            });
        });

        return actions;
    }

    function getItemDateState(item) {
        const now = Date.now();
        const startAt = item?.startDate
            ? new Date(item.startDate).getTime()
            : NaN;
        const endAt = item?.endDate
            ? new Date(item.endDate).getTime()
            : NaN;

        return {
            isUpcoming: Number.isFinite(startAt) && now < startAt,
            isExpired: Number.isFinite(endAt) && now > endAt,
            startAt,
            endAt
        };
    }

    function formatAcquisitionDate(timestamp) {
        if (!Number.isFinite(timestamp)) return '';

        try {
            return new Date(timestamp).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (_) {
            return new Date(timestamp).toLocaleString('vi-VN');
        }
    }

    function addDetectedAction(actions, action) {
        if (!action?.text) return;

        const key = normalizeText(action.text);
        if (!key) return;

        const existing = actions.find(entry => normalizeText(entry.text) === key);

        if (existing) {
            // Chỉ cần một nguồn cho biết hành động đang khả dụng.
            existing.available = existing.available || action.available;
            return;
        }

        actions.push(action);
    }

    function detectItemAcquisitionWays(item) {
        const manager = getStoreManagerAPI();
        const actions = [];
        const dateState = getItemDateState(item);

        if (manager) {
            try {
                const currentMarkup = manager.renderStoreItem(
                    item,
                    false,
                    false,
                    false,
                    dateState.isUpcoming
                );

                extractAcquisitionActionsFromMarkup(currentMarkup)
                    .forEach(action => addDetectedAction(actions, action));
            } catch (error) {
                console.warn(
                    '[Sưu tầm] Không đọc được nút hành động hiện tại:',
                    item?.id,
                    error
                );
            }

            /*
             * Tạo một bản sao chỉ để hỏi StoreManager về cách nhận nền tảng.
             * Ví dụ vật phẩm đang bị khóa hoặc chưa đến ngày bán vẫn cần cho
             * học sinh biết sau khi mở khóa thì mua/đổi bằng phương thức nào.
             */
            try {
                const baseItem = {
                    ...item,
                    isLocked: false
                };

                delete baseItem.startDate;
                delete baseItem.endDate;
                delete baseItem.annualSale;

                const baseMarkup = manager.renderStoreItem(
                    baseItem,
                    false,
                    false,
                    false,
                    false
                );

                extractAcquisitionActionsFromMarkup(baseMarkup)
                    .forEach(action => addDetectedAction(actions, action));
            } catch (error) {
                console.warn(
                    '[Sưu tầm] Không dò được cách nhận nền tảng:',
                    item?.id,
                    error
                );
            }
        }

        // Trạng thái thời gian lấy trực tiếp từ dữ liệu sống của vật phẩm.
        if (dateState.isUpcoming) {
            addDetectedAction(actions, {
                text: `Mở bán từ ${formatAcquisitionDate(dateState.startAt)}`,
                kind: 'schedule',
                available: false,
                source: 'live-item-config'
            });
        } else if (dateState.isExpired) {
            addDetectedAction(actions, {
                text: `Đợt mở bán đã kết thúc lúc ${formatAcquisitionDate(dateState.endAt)}`,
                kind: 'schedule',
                available: false,
                source: 'live-item-config'
            });
        }

        if (item?.isLocked === true) {
            addDetectedAction(actions, {
                text: 'Hiện đang bị giáo viên khóa',
                kind: 'locked',
                available: false,
                source: 'live-item-config'
            });
        }

        /*
         * Fallback chỉ dùng khi website chưa có StoreManager hoặc renderer
         * không sinh được nút. Đây vẫn là suy luận từ dữ liệu của chính vật
         * phẩm, không phải danh sách phương thức viết riêng cho từng bộ.
         */
        if (actions.length === 0) {
            const price = Number(item?.price);

            if (Number.isFinite(price) && price > 0) {
                addDetectedAction(actions, {
                    text: `Mua trong Cửa hàng: ${price.toLocaleString('vi-VN')} Coin`,
                    kind: 'store',
                    available: item?.isLocked !== true,
                    source: 'live-item-config'
                });
            } else if (item?.rewardLabel) {
                addDetectedAction(actions, {
                    text: `Đổi bằng ${String(item.rewardLabel)}`,
                    kind: 'other',
                    available: false,
                    source: 'live-item-config'
                });
            } else if (item?.eventOnly === true || item?.isNonCoin === true) {
                addDetectedAction(actions, {
                    text: 'Nhận từ sự kiện đang được website mở',
                    kind: 'event',
                    available: false,
                    source: 'live-item-config'
                });
            } else {
                addDetectedAction(actions, {
                    text: 'Website chưa công bố cách nhận vật phẩm này',
                    kind: 'other',
                    available: false,
                    source: 'live-item-config'
                });
            }
        }

        return actions;
    }

    function getAcquisitionActionIcon(kind) {
        const icons = {
            store: '🛒',
            event: '🎁',
            'birthday-coin': '🎂',
            'special-coin': '✨',
            schedule: '📅',
            locked: '🔒',
            other: 'ℹ️'
        };

        return icons[kind] || icons.other;
    }

    function createAcquisitionItemHTML(item) {
        const ways = detectItemAcquisitionWays(item);
        const collected = isItemCollected(item);
        const typeInfo = getTypeInfo(item?.type);

        return `
            <article class="store-collection-acquisition-item${collected ? ' is-owned' : ''}">
                <div class="store-collection-acquisition-item__visual">
                    ${getItemVisualHTML(item)}
                </div>

                <div class="store-collection-acquisition-item__content">
                    <div class="store-collection-acquisition-item__heading">
                        <div>
                            <span class="store-collection-acquisition-item__tag">
                                ${escapeHTML(item?.tag || 'Chưa phân loại')}
                            </span>
                            <h4>${escapeHTML(item?.name || item?.id || 'Vật phẩm')}</h4>
                        </div>
                        <span class="store-collection-acquisition-item__owned">
                            ${collected ? '✓ Đã sở hữu' : '○ Chưa sở hữu'}
                        </span>
                    </div>

                    <div class="store-collection-acquisition-item__type">
                        ${typeInfo.icon} ${escapeHTML(typeInfo.label)}
                    </div>

                    <div class="store-collection-acquisition-actions">
                        ${ways.map(action => `
                            <span
                                class="store-collection-acquisition-action is-${escapeAttribute(action.kind)}${action.available ? ' is-available' : ' is-unavailable'}"
                                title="Tự phát hiện từ ${escapeAttribute(action.source)}"
                            >
                                <b aria-hidden="true">${getAcquisitionActionIcon(action.kind)}</b>
                                ${escapeHTML(action.text)}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </article>
        `;
    }

    function createAcquisitionReportHTML(collectionId) {
        const collection = getCollection(collectionId);
        const items = getCollectionItems(collection.id);
        const methodCounts = new Map();

        items.forEach(item => {
            detectItemAcquisitionWays(item).forEach(action => {
                const key = normalizeText(action.text);
                if (!key) return;

                const current = methodCounts.get(key) || {
                    text: action.text,
                    kind: action.kind,
                    count: 0
                };

                current.count += 1;
                methodCounts.set(key, current);
            });
        });

        const methods = [...methodCounts.values()];

        return `
            <div class="store-collection-acquisition-note">
                <span aria-hidden="true">🔎</span>
                <div>
                    <strong>Tự phát hiện từ website</strong>
                    <p>
                        Hệ thống đọc dữ liệu vật phẩm, giá, thời gian mở bán,
                        trạng thái khóa và chính các nút hành động do Cửa hàng sinh ra.
                        Nội dung sẽ tự thay đổi khi cấu hình website thay đổi.
                    </p>
                </div>
            </div>

            <div class="store-collection-acquisition-overview">
                <strong>${collection.icon} ${escapeHTML(collection.label)}</strong>
                <span>${items.length} vật phẩm · ${methods.length} cách/trạng thái được phát hiện</span>
            </div>

            ${methods.length ? `
                <div class="store-collection-acquisition-methods" aria-label="Các cách nhận đã phát hiện">
                    ${methods.map(method => `
                        <span class="store-collection-acquisition-method">
                            <b aria-hidden="true">${getAcquisitionActionIcon(method.kind)}</b>
                            ${escapeHTML(method.text)}
                            <em>${method.count} vật phẩm</em>
                        </span>
                    `).join('')}
                </div>
            ` : ''}

            <div class="store-collection-acquisition-list">
                ${items.length
                ? items.map(createAcquisitionItemHTML).join('')
                : `
                        <div class="store-collection-acquisition-empty">
                            Chưa có vật phẩm để dò cách nhận.
                        </div>
                    `
            }
            </div>
        `;
    }

    function moveAcquisitionModalFocusToReturnTarget(modal) {
        const active = document.activeElement;

        if (
            modal?.contains(active) &&
            acquisitionModalReturnFocus instanceof HTMLElement &&
            acquisitionModalReturnFocus.isConnected
        ) {
            try {
                acquisitionModalReturnFocus.focus({ preventScroll: true });
            } catch (_) {
                acquisitionModalReturnFocus.focus();
            }
        } else if (modal?.contains(active) && active instanceof HTMLElement) {
            active.blur();
        }
    }

    function closeAcquisitionModal() {
        const modal = document.getElementById(IDS.acquisitionModal);
        if (!modal || modal.hidden) return;

        moveAcquisitionModalFocusToReturnTarget(modal);
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        modal.inert = true;
        modal.setAttribute('inert', '');
        document.body.classList.remove('store-collection-acquisition-open');

        window.setTimeout(() => {
            if (!modal.classList.contains('is-open')) modal.hidden = true;
        }, 180);
    }

    function openAcquisitionModal(
        collectionId = activeCollectionId,
        returnFocusTarget = null
    ) {
        const modal = document.getElementById(IDS.acquisitionModal);
        const title = document.getElementById(IDS.acquisitionTitle);
        const body = document.getElementById(IDS.acquisitionBody);
        const collection = getCollection(collectionId);

        if (!modal || !title || !body) return;

        acquisitionModalCollectionId = collection.id;
        acquisitionModalReturnFocus = returnFocusTarget instanceof HTMLElement
            ? returnFocusTarget
            : document.activeElement;

        title.textContent = `Cách nhận vật phẩm · ${collection.label}`;
        body.innerHTML = createAcquisitionReportHTML(collection.id);

        modal.hidden = false;
        modal.inert = false;
        modal.removeAttribute('inert');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('store-collection-acquisition-open');

        window.requestAnimationFrame(() => {
            modal.classList.add('is-open');
            modal.querySelector('.store-collection-acquisition-close')?.focus({
                preventScroll: true
            });
        });
    }

    function refreshAcquisitionModal() {
        const body = document.getElementById(IDS.acquisitionBody);
        if (!body) return;

        body.innerHTML = createAcquisitionReportHTML(
            acquisitionModalCollectionId
        );

        if (typeof window.showToast === 'function') {
            window.showToast(
                'Đã quét lại cách nhận từ dữ liệu hiện tại của website.',
                'success'
            );
        }
    }

    function trapAcquisitionModalFocus(event, modal) {
        if (event.key !== 'Tab') return;

        const focusable = [...modal.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )].filter(element => (
            element instanceof HTMLElement &&
            !element.hidden &&
            element.offsetParent !== null
        ));

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function buildAcquisitionModal() {
        if (document.getElementById(IDS.acquisitionModal)) return true;

        const modal = document.createElement('div');
        modal.id = IDS.acquisitionModal;
        modal.className = 'store-collection-acquisition-modal';
        modal.hidden = true;
        modal.inert = true;
        modal.setAttribute('inert', '');
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <section
                class="store-collection-acquisition-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="${IDS.acquisitionTitle}"
            >
                <header class="store-collection-acquisition-header">
                    <div>
                        <span class="store-collection-acquisition-eyebrow">Hướng dẫn tự động</span>
                        <h3 id="${IDS.acquisitionTitle}">Cách nhận vật phẩm</h3>
                    </div>

                    <div class="store-collection-acquisition-header__actions">
                        <button
                            type="button"
                            class="store-collection-acquisition-refresh"
                            title="Quét lại dữ liệu hiện tại"
                        >
                            ↻ <span>Quét lại</span>
                        </button>
                        <button
                            type="button"
                            class="store-collection-acquisition-close"
                            aria-label="Đóng bảng cách nhận"
                            title="Đóng"
                        >×</button>
                    </div>
                </header>

                <div
                    id="${IDS.acquisitionBody}"
                    class="store-collection-acquisition-body"
                ></div>
            </section>
        `;

        modal.addEventListener('click', event => {
            if (
                event.target === modal ||
                event.target.closest('.store-collection-acquisition-close')
            ) {
                closeAcquisitionModal();
                return;
            }

            if (event.target.closest('.store-collection-acquisition-refresh')) {
                refreshAcquisitionModal();
            }
        });

        modal.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeAcquisitionModal();
                return;
            }

            trapAcquisitionModalFocus(event, modal);
        });

        document.body.appendChild(modal);
        return true;
    }

    function getTypeInfo(type) {
        const typeMap = {
            theme: { label: 'Giao diện', icon: '🎨' },
            effect: { label: 'Hiệu ứng', icon: '✨' },
            pet: { label: 'Thú cưng', icon: '🐾' },
            music: { label: 'Nhạc nền', icon: '🎵' }
        };

        return typeMap[type] || { label: 'Vật phẩm', icon: '📦' };
    }

    function isSafeImageSource(value) {
        const source = String(value ?? '').trim();

        return (
            /^(?:https?:\/\/|data:image\/|blob:|assets\/|\.\.?\/)/i.test(source) &&
            !/^javascript:/i.test(source)
        );
    }

    function getItemVisualHTML(item) {
        const typeInfo = getTypeInfo(item.type);

        if (item.isIcon === false && isSafeImageSource(item.value)) {
            return `
                <img
                    class="store-collection-card__image"
                    src="${escapeAttribute(item.value)}"
                    alt="${escapeAttribute(item.name || 'Vật phẩm')}"
                    loading="lazy"
                    decoding="async"
                    onerror="this.hidden=true; this.nextElementSibling.hidden=false;"
                >
                <span class="store-collection-card__fallback" hidden>${typeInfo.icon}</span>
            `;
        }

        let icon = String(item.customIcon || '').trim();
        const rawValue = String(item.value || '').trim();

        if (
            !icon &&
            item.isIcon !== false &&
            rawValue &&
            rawValue.length <= 12 &&
            !/[\\/_-]{2,}/.test(rawValue)
        ) {
            icon = rawValue;
        }

        return `
            <span class="store-collection-card__emoji" aria-hidden="true">
                ${escapeHTML(icon || typeInfo.icon)}
            </span>
        `;
    }

    function getItemState(item) {
        const now = Date.now();
        const startAt = item.startDate ? new Date(item.startDate).getTime() : NaN;
        const endAt = item.endDate ? new Date(item.endDate).getTime() : NaN;

        const explicitlyHidden = Boolean(
            item.hidden === true ||
            item.isHidden === true ||
            item.hideFromStore === true ||
            item.hiddenFromStore === true ||
            item.displayInStore === false ||
            item.visibleInStore === false
        );

        if (item.isLocked === true) {
            return { label: 'Đã khóa', className: 'is-locked' };
        }

        if (explicitlyHidden) {
            return { label: 'Đang ẩn', className: 'is-hidden' };
        }

        if (Number.isFinite(endAt) && now > endAt) {
            return { label: 'Đã hết thời gian', className: 'is-hidden' };
        }

        if (Number.isFinite(startAt) && now < startAt) {
            return { label: 'Chưa mở bán', className: 'is-upcoming' };
        }

        if (item.isNonCoin === true && Number(item.price || 0) <= 0) {
            return { label: 'Vật phẩm sự kiện', className: 'is-event' };
        }

        return { label: 'Đang hiển thị', className: 'is-visible' };
    }

    function createItemCardHTML(item) {
        const typeInfo = getTypeInfo(item.type);
        const tag = item.tag || 'Chưa phân loại';
        const collected = isItemCollected(item);
        const ownershipClass = collected ? 'is-collected' : 'is-uncollected';
        const ownershipLabel = collected ? 'Đã sưu tầm' : 'Chưa sở hữu';

        return `
            <article
                class="store-collection-card ${ownershipClass}"
                data-collection-item-id="${escapeAttribute(item.id || '')}"
                data-collection-item-tag="${escapeAttribute(tag)}"
                data-collected="${String(collected)}"
                aria-label="${escapeAttribute(
            `${item.name || item.id || 'Vật phẩm'}: ${ownershipLabel}`
        )}"
            >
                <div class="store-collection-card__visual">
                    ${getItemVisualHTML(item)}
                </div>

                <div class="store-collection-card__body">
                    <span class="store-collection-card__tag">${escapeHTML(tag)}</span>

                    <h4 class="store-collection-card__name">
                        ${escapeHTML(item.name || item.id || 'Vật phẩm chưa đặt tên')}
                    </h4>

                    <div class="store-collection-card__meta">
                        <span>${typeInfo.icon} ${typeInfo.label}</span>
                        <span class="store-collection-card__state ${ownershipClass}">
                            ${collected ? '✓' : '🔒'} ${ownershipLabel}
                        </span>
                    </div>
                </div>
            </article>
        `;
    }

    function moveFocusOutsideBeforeHide(container, fallbackTarget) {
        const activeElement = document.activeElement;

        if (
            !container ||
            !(activeElement instanceof HTMLElement) ||
            !container.contains(activeElement)
        ) {
            return;
        }

        if (
            fallbackTarget instanceof HTMLElement &&
            fallbackTarget.isConnected &&
            !fallbackTarget.hasAttribute('disabled')
        ) {
            try {
                fallbackTarget.focus({ preventScroll: true });
                return;
            } catch (_) {
                // Trình duyệt cũ có thể không hỗ trợ tùy chọn preventScroll.
                fallbackTarget.focus();
                return;
            }
        }

        activeElement.blur();
    }

    function setDropdownOpen(shouldOpen) {
        const toggle = document.getElementById(IDS.toggle);
        const dropdown = document.getElementById(IDS.dropdown);

        if (!toggle || !dropdown) return;

        const open = Boolean(shouldOpen);

        /*
         * Khi đóng menu, chuyển focus ra ngoài trước khi gắn aria-hidden/inert.
         * Nếu không, Chrome cảnh báo vì nút đang focus nằm trong vùng bị ẩn.
         */
        if (!open) {
            moveFocusOutsideBeforeHide(dropdown, toggle);
        }

        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.title = open ? 'Đóng menu' : 'Mở menu Sưu tầm';

        if (open) {
            dropdown.inert = false;
            dropdown.removeAttribute('inert');
            dropdown.setAttribute('aria-hidden', 'false');
            dropdown.classList.add('is-open');
        } else {
            dropdown.classList.remove('is-open');
            dropdown.setAttribute('aria-hidden', 'true');
            dropdown.inert = true;
            dropdown.setAttribute('inert', '');
        }
    }

    function toggleDropdown() {
        const toggle = document.getElementById(IDS.toggle);
        if (!toggle) return;

        setDropdownOpen(toggle.getAttribute('aria-expanded') !== 'true');
    }

    function renderCollection(collectionId = activeCollectionId) {
        const collection = getCollection(collectionId);
        activeCollectionId = collection.id;

        const tabs = document.getElementById(IDS.tabs);
        const summary = document.getElementById(IDS.summary);
        const rewards = document.getElementById(IDS.rewards);
        const grid = document.getElementById(IDS.grid);

        if (!tabs || !summary || !rewards || !grid) return;

        let activeButton = null;
        tabs.querySelectorAll('[data-collection-id]').forEach(button => {
            const isActive = button.dataset.collectionId === activeCollectionId;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', String(isActive));
            if (isActive) activeButton = button;
        });

        activeButton?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });

        const items = getCollectionItems(activeCollectionId);
        const collectedCount = items.reduce(
            (total, item) => total + (isItemCollected(item) ? 1 : 0),
            0
        );

        summary.innerHTML = `
            <div class="store-collection-summary__identity">
                <strong>${collection.icon} ${escapeHTML(collection.label)}</strong>
                <button
                    type="button"
                    class="store-collection-acquisition-info"
                    data-collection-acquisition-info
                    data-collection-id="${escapeAttribute(collection.id)}"
                    aria-label="Xem cách nhận vật phẩm trong mục ${escapeAttribute(collection.label)}"
                    title="Tự phát hiện cách nhận vật phẩm"
                >!</button>
            </div>
            <span>
                <b>${collectedCount}/${items.length}</b> vật phẩm đã sưu tầm
                · vật phẩm chưa sở hữu sẽ hiển thị màu xám
            </span>
        `;

        if (collection.isAll) {
            rewards.hidden = true;
            rewards.innerHTML = '';
        } else {
            rewards.hidden = false;
            rewards.innerHTML = `
                <div class="store-collection-rewards__title">
                    <span>🎁 Thưởng theo tiến độ</span>
                    <small>Đạt mốc sẽ tự cộng thẳng vào số dư Coin</small>
                </div>
                <div class="store-collection-rewards__track">
                    ${REWARD_MILESTONES.map(milestone => {

                const rewardCoins =
                    getCollectionRewardCoins(
                        collection,
                        milestone
                    );

                const reached =
                    collectedCount >= milestone.count;
                const claim = getRewardClaim(
                    collection.id,
                    milestone.count
                );
                const claimed = claim?.status === 'sent';
                const processing = reached && claim?.status === 'reserved';
                const classNames = [
                    'store-collection-reward',
                    reached ? 'is-reached' : '',
                    claimed ? 'is-claimed' : '',
                    processing ? 'is-processing' : ''
                ].filter(Boolean).join(' ');
                const statusText = claimed
                    ? '✓ Đã nhận'
                    : (
                        processing
                            ? '⏳ Đang cộng'
                            : (reached ? '✓ Đã đạt' : 'Chưa đạt')
                    );

                return `
                            <span class="${classNames}">
                                <b>${milestone.count}</b> món
                                <i>+${rewardCoins} 🪙</i>
                                <em>${statusText}</em>
                            </span>
                        `;
            }).join('')}
                </div>
            `;
        }

        grid.innerHTML = items.length
            ? items.map(createItemCardHTML).join('')
            : `
                <div class="store-collection-empty">
                    <span aria-hidden="true">📭</span>
                    <strong>Chưa có vật phẩm trong danh sách này.</strong>
                </div>
            `;
    }

    function getStoreHeading(storeTab = document.getElementById('tab-store')) {
        if (!storeTab) return null;

        return storeTab.querySelector(
            ':scope > .store-collection-title-row > h2, :scope > h2'
        );
    }

    function getStoreSidebarText() {
        return document.querySelector(
            '.sidebar .nav-item[onclick*="tab-store"] .nav-text'
        );
    }

    function updateViewLabels(isCollectionView) {
        const collectionView = Boolean(isCollectionView);
        const heading = getStoreHeading();
        const sidebarText = getStoreSidebarText();
        const openButton = document.getElementById(IDS.openButton);

        if (heading) {
            heading.textContent = collectionView
                ? 'Sưu tầm'
                : 'Cửa hàng Vật phẩm';
        }

        if (sidebarText) {
            sidebarText.textContent = collectionView
                ? 'Sưu tầm'
                : 'Cửa hàng';
        }

        if (!openButton) return;

        const icon = openButton.querySelector(
            '.store-collection-dropdown__item-icon'
        );
        const title = openButton.querySelector('strong');
        const description = openButton.querySelector('small');
        const direction = openButton.querySelector(
            '.store-collection-dropdown__go'
        );

        if (icon) icon.textContent = collectionView ? '🛒' : '📚';
        if (title) title.textContent = collectionView ? 'Cửa hàng' : 'Sưu tầm';
        if (description) {
            description.textContent = collectionView
                ? 'Quay lại danh sách vật phẩm trong cửa hàng'
                : 'Xem các bộ vật phẩm đã phân loại';
        }
        if (direction) direction.textContent = collectionView ? '←' : '→';

        openButton.setAttribute(
            'aria-label',
            collectionView
                ? 'Quay lại Cửa hàng Vật phẩm'
                : 'Mở trang Sưu tầm'
        );
    }

    function openCollectionPage(collectionId = activeCollectionId) {
        const storeTab = document.getElementById('tab-store');
        const page = document.getElementById(IDS.page);

        if (!storeTab || !page) return;

        setDropdownOpen(false);
        renderCollection(collectionId);

        storeTab.classList.add('store-collection-view-active');
        updateViewLabels(true);
        page.hidden = false;
        page.inert = false;
        page.removeAttribute('inert');
        page.setAttribute('aria-hidden', 'false');

        window.requestAnimationFrame(() => {
            page.classList.add('is-visible');
        });

        getStoreHeading(storeTab)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    function closeCollectionPage() {
        const storeTab = document.getElementById('tab-store');
        const page = document.getElementById(IDS.page);

        if (!storeTab || !page) return;

        setDropdownOpen(false);
        page.classList.remove('is-visible');
        storeTab.classList.remove('store-collection-view-active');
        updateViewLabels(false);

        window.setTimeout(() => {
            if (!storeTab.classList.contains('store-collection-view-active')) {
                /*
                 * Có thể đóng trang bằng API khi một tab/danh mục bên trong vẫn
                 * đang focus. Di chuyển focus ra nút mũi tên trước khi ẩn trang.
                 */
                moveFocusOutsideBeforeHide(
                    page,
                    document.getElementById(IDS.toggle)
                );

                page.inert = true;
                page.setAttribute('inert', '');
                page.setAttribute('aria-hidden', 'true');
                page.hidden = true;
            }
        }, 220);

        getStoreHeading(storeTab)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    function enableHorizontalTabScrolling(tabs) {
        if (!tabs || tabs.dataset.horizontalScrollReady === 'true') return;
        tabs.dataset.horizontalScrollReady = 'true';

        /*
         * Chỉ đổi con lăn dọc thành cuộn ngang.
         * Không bắt pointer/capture trên toàn thanh vì việc đó có thể
         * nuốt sự kiện click của các nút danh mục.
         */
        tabs.addEventListener('wheel', event => {
            if (tabs.scrollWidth <= tabs.clientWidth) return;

            const verticalMovement = Math.abs(event.deltaY);
            const horizontalMovement = Math.abs(event.deltaX);

            if (verticalMovement <= horizontalMovement) return;

            event.preventDefault();
            tabs.scrollLeft += event.deltaY;
        }, { passive: false });

        /*
         * Bàn phím: khi thanh đang được focus, dùng mũi tên trái/phải
         * để lướt mà không ảnh hưởng khả năng bấm nút.
         */
        tabs.addEventListener('keydown', event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
            }

            event.preventDefault();
            tabs.scrollBy({
                left: event.key === 'ArrowRight' ? 180 : -180,
                behavior: 'smooth'
            });
        });
    }

    function buildUI() {
        const storeTab = document.getElementById('tab-store');
        if (!storeTab) return false;

        if (document.getElementById(IDS.page)) return true;

        let titleRow = storeTab.querySelector(
            ':scope > .store-collection-title-row'
        );
        let heading = getStoreHeading(storeTab);

        if (!heading) return false;

        /*
         * Không đặt nút vào bên trong <h2>. Việc đó làm pseudo-element
         * gạch màu của tiêu đề chạy sang cạnh nút. Giữ <h2> nguyên vẹn
         * rồi bọc tiêu đề và nút trong một hàng riêng.
         */
        if (!titleRow) {
            titleRow = document.createElement('div');
            titleRow.className = 'store-collection-title-row';
            heading.insertAdjacentElement('beforebegin', titleRow);
            titleRow.appendChild(heading);
        }

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.id = IDS.toggle;
        toggle.className = 'store-collection-arrow';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', IDS.dropdown);
        toggle.title = 'Mở menu Sưu tầm';
        toggle.innerHTML = `
            <span class="store-collection-arrow__icon" aria-hidden="true"></span>
            <span class="store-collection-sr-only">Mở menu Sưu tầm</span>
        `;
        toggle.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            toggleDropdown();
        });
        titleRow.appendChild(toggle);

        const dropdown = document.createElement('div');
        dropdown.id = IDS.dropdown;
        dropdown.className = 'store-collection-dropdown';
        dropdown.setAttribute('aria-hidden', 'true');
        dropdown.setAttribute('inert', '');
        dropdown.inert = true;
        dropdown.innerHTML = `
            <div class="store-collection-dropdown__clip">
                <button
                    type="button"
                    id="${IDS.openButton}"
                    class="store-collection-dropdown__item"
                >
                    <span class="store-collection-dropdown__item-icon" aria-hidden="true">📚</span>
                    <span>
                        <strong>Sưu tầm</strong>
                        <small>Xem các bộ vật phẩm đã phân loại</small>
                    </span>
                    <span class="store-collection-dropdown__go" aria-hidden="true">→</span>
                </button>
            </div>
        `;
        titleRow.insertAdjacentElement('afterend', dropdown);

        const page = document.createElement('section');
        page.id = IDS.page;
        page.className = 'store-collection-page';
        page.hidden = true;
        page.setAttribute('aria-hidden', 'true');
        page.setAttribute('inert', '');
        page.inert = true;
        page.innerHTML = `
            <div
                id="${IDS.tabs}"
                class="store-collection-tabs"
                role="tablist"
                aria-label="Các danh sách sưu tầm"
            >
                ${COLLECTIONS.map((collection, index) => `
                    <button
                        type="button"
                        class="store-collection-tab${index === 0 ? ' is-active' : ''}"
                        data-collection-id="${collection.id}"
                        role="tab"
                        aria-selected="${index === 0 ? 'true' : 'false'}"
                    >
                        <span aria-hidden="true">${collection.icon}</span>
                        ${escapeHTML(collection.label)}
                    </button>
                `).join('')}
            </div>

            <div id="${IDS.summary}" class="store-collection-summary"></div>
            <div
                id="${IDS.rewards}"
                class="store-collection-rewards"
                hidden
            ></div>
            <div id="${IDS.grid}" class="store-collection-grid"></div>
        `;
        dropdown.insertAdjacentElement('afterend', page);
        enableHorizontalTabScrolling(page.querySelector('.store-collection-tabs'));
        buildAcquisitionModal();

        document.getElementById(IDS.openButton)?.addEventListener('click', () => {
            if (storeTab.classList.contains('store-collection-view-active')) {
                closeCollectionPage();
            } else {
                openCollectionPage('all');
            }
        });

        page.querySelectorAll('[data-collection-id]').forEach(button => {
            button.addEventListener('click', () => {
                renderCollection(button.dataset.collectionId);
            });
        });

        document.getElementById(IDS.summary)?.addEventListener(
            'click',
            event => {
                const infoButton = event.target.closest(
                    '[data-collection-acquisition-info]'
                );

                if (!infoButton) return;

                event.preventDefault();
                event.stopPropagation();
                openAcquisitionModal(
                    infoButton.dataset.collectionId || activeCollectionId,
                    infoButton
                );
            }
        );

        document.addEventListener('click', event => {
            const clickedInside =
                toggle.contains(event.target) ||
                dropdown.contains(event.target);

            if (!clickedInside) setDropdownOpen(false);
        });

        document.addEventListener('keydown', event => {
            if (
                event.key === 'Escape' &&
                !document.getElementById(IDS.acquisitionModal)?.classList.contains('is-open')
            ) {
                setDropdownOpen(false);
            }
        });

        updateViewLabels(false);
        renderCollection('all');
        installRewardClaimListener();
        installInventoryListener();
        return true;
    }

    function initialize(attempt = 0) {
        if (buildUI()) return;

        if (attempt < 60) {
            window.setTimeout(() => initialize(attempt + 1), 100);
        } else {
            console.warn('[Sưu tầm] Không tìm thấy #tab-store hoặc tiêu đề cửa hàng.');
        }
    }

    window.StoreCollectionPage = Object.freeze({
        open: openCollectionPage,
        close: closeCollectionPage,
        toggleMenu: toggleDropdown,
        show: openCollectionPage,
        refresh: () => renderCollection(activeCollectionId),
        refreshInventory: () => installInventoryListener(),
        checkRewards: () => queueCollectionRewardScan(),
        showAcquisitionWays: (collectionId = activeCollectionId) =>
            openAcquisitionModal(collectionId),
        closeAcquisitionWays: closeAcquisitionModal,
        detectItemAcquisitionWays: itemId => {
            const item = getStoreItems().find(entry => String(entry?.id) === String(itemId));
            return item ? detectItemAcquisitionWays(item) : [];
        },
        rewardMode: 'direct-balance',
        acquisitionMode: 'auto-detect-store-renderer',
        getCollectedItemIds: () => [...collectedItemIds],
        getRewardClaims: () => JSON.parse(JSON.stringify(rewardClaims || {}))
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
    } else {
        initialize();
    }
})();
