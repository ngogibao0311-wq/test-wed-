// ======================================================
// HISTORY RETENTION MANAGER v1.0.0
// Giữ lịch sử hiển thị tối đa 2 tháng theo lịch Việt Nam.
// TUYỆT ĐỐI KHÔNG xóa các node trạng thái/khóa chống nhận thưởng trùng.
// ======================================================
(function initHistoryRetentionManager() {
    'use strict';

    if (window.HistoryRetention) return;

    const RETENTION_MONTHS = 2;
    const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
    const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

    const COLLECTIONS = Object.freeze({
        transaction_logs: {
            timestampFields: ['createdAtClient', 'createdAt']
        },
        spin_history: {
            timestampFields: ['timestamp']
        },
        cash_requests: {
            timestampFields: ['resolvedAt', 'completedAt', 'rejectedAt', 'timestamp'],
            removableStatuses: ['completed', 'rejected']
        },
        profile_requests: {
            timestampFields: ['resolvedAt', 'updatedAt', 'timestamp'],
            legacyTimeField: 'time',
            removableStatuses: ['approved', 'rejected']
        },
        global_notifications: {
            timestampFields: ['timestamp']
        },
        global_surveys: {
            timestampFields: ['timestamp']
        }
    });

    // Những node này có thể nhìn giống "lịch sử" nhưng là trạng thái nghiệp vụ.
    // Xóa chúng có thể làm người dùng nhận thưởng lại hoặc phá giới hạn/hạn mức.
    const PROTECTED_STATE_NODES = Object.freeze([
        'birthday_reward_logs',
        'birthday_coins',
        'leaderboard_reward_claims',
        'hoihoa_reward_logs',
        'student_history_events',
        'student_daily_login',
        'royal_ball_limits',
        'spin_counts',
        'ticket_purchases',
        'student_conversion_usage',
        'historical_grade_tickets',
        'student_inventory',
        'student_discounts',
        'student_collection_rewards',
        'student_coins',
        'student_money_offset',
        'inbox_messages',
        'birthday_item_catalog',
        'birthday_item_years',
        'special_birthday_item_catalog',
        'purchase_locks',
        'student_special_birthday_coins',
        'mid_autumn_wallets',
        'mid_autumn_calendar',
        'season_rankings',
        'hoihoa_rounds',
        'hoihoa_submissions',
        'assignments',
        'submissions'
    ]);

    function getCutoffTimestamp(nowMs = Date.now()) {
        const shifted = new Date(Number(nowMs) + VIETNAM_OFFSET_MS);
        const sourceYear = shifted.getUTCFullYear();
        const sourceMonth = shifted.getUTCMonth();
        const sourceDay = shifted.getUTCDate();

        let targetMonthIndex = sourceMonth - RETENTION_MONTHS;
        let targetYear = sourceYear;

        while (targetMonthIndex < 0) {
            targetMonthIndex += 12;
            targetYear -= 1;
        }

        const lastTargetDay = new Date(
            Date.UTC(targetYear, targetMonthIndex + 1, 0)
        ).getUTCDate();

        const targetDay = Math.min(sourceDay, lastTargetDay);

        return Date.UTC(
            targetYear,
            targetMonthIndex,
            targetDay,
            shifted.getUTCHours(),
            shifted.getUTCMinutes(),
            shifted.getUTCSeconds(),
            shifted.getUTCMilliseconds()
        ) - VIETNAM_OFFSET_MS;
    }

    function parseLegacyVietnamTime(value) {
        const text = String(value || '').trim();
        const match = text.match(
            /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );

        if (!match) return 0;

        const hour = Number(match[1]);
        const minute = Number(match[2]);
        const second = Number(match[3] || 0);
        const day = Number(match[4]);
        const month = Number(match[5]) - 1;
        const year = Number(match[6]);

        if (
            !Number.isInteger(year) ||
            !Number.isInteger(month) ||
            !Number.isInteger(day) ||
            !Number.isInteger(hour) ||
            !Number.isInteger(minute) ||
            !Number.isInteger(second)
        ) {
            return 0;
        }

        return Date.UTC(
            year,
            month,
            day,
            hour,
            minute,
            second
        ) - VIETNAM_OFFSET_MS;
    }

    function getRecordTimestamp(collectionName, record) {
        const config = COLLECTIONS[collectionName];
        if (!config || !record || typeof record !== 'object') return 0;

        for (const field of config.timestampFields || []) {
            const value = Number(record[field]);
            if (Number.isFinite(value) && value > 0) {
                return value;
            }
        }

        if (config.legacyTimeField) {
            return parseLegacyVietnamTime(record[config.legacyTimeField]);
        }

        return 0;
    }

    function isStatusRemovable(collectionName, record) {
        const config = COLLECTIONS[collectionName];
        if (!config) return false;

        if (!Array.isArray(config.removableStatuses)) {
            return true;
        }

        return config.removableStatuses.includes(
            String(record?.status || '').trim().toLowerCase()
        );
    }

    function isExpired(collectionName, record, nowMs = Date.now()) {
        if (!COLLECTIONS[collectionName]) return false;
        if (!isStatusRemovable(collectionName, record)) return false;

        const timestamp = getRecordTimestamp(collectionName, record);
        if (!timestamp) return false;

        return timestamp < getCutoffTimestamp(nowMs);
    }

    function filterRecent(records, collectionName, nowMs = Date.now()) {
        if (!Array.isArray(records)) return [];
        return records.filter(record => !isExpired(collectionName, record, nowMs));
    }

    async function isVerifiedTeacher() {
        if (
            typeof firebase === 'undefined' ||
            !firebase.auth ||
            typeof db === 'undefined' ||
            !db?.ref
        ) {
            return false;
        }

        const authUser = firebase.auth().currentUser;
        if (!authUser?.uid) return false;

        try {
            const snapshot = await db
                .ref(`users/${authUser.uid}/role`)
                .once('value');

            return snapshot.val() === 'teacher';
        } catch (error) {
            console.warn('[HistoryRetention] Không xác minh được quyền giáo viên:', error);
            return false;
        }
    }

    async function cleanupCollection(collectionName, nowMs = Date.now()) {
        if (!COLLECTIONS[collectionName]) {
            throw new Error(`Collection không nằm trong danh sách dọn an toàn: ${collectionName}`);
        }

        if (!(await isVerifiedTeacher())) {
            return 0;
        }

        const snapshot = await db.ref(collectionName).once('value');
        const updates = {};
        let removed = 0;

        snapshot.forEach(child => {
            const record = child.val();
            if (!isExpired(collectionName, record, nowMs)) return;

            updates[`${collectionName}/${child.key}`] = null;
            removed++;
        });

        if (removed > 0) {
            await db.ref().update(updates);
        }

        return removed;
    }

    let cleanupInFlight = null;
    let cleanupTimer = null;

    async function cleanupNow() {
        if (cleanupInFlight) return cleanupInFlight;

        cleanupInFlight = (async () => {
            if (!(await isVerifiedTeacher())) {
                return {
                    skipped: true,
                    reason: 'not_teacher',
                    removedTotal: 0,
                    collections: {}
                };
            }

            const nowMs = Date.now();
            const results = {};
            let removedTotal = 0;

            for (const collectionName of Object.keys(COLLECTIONS)) {
                try {
                    const count = await cleanupCollection(collectionName, nowMs);
                    results[collectionName] = count;
                    removedTotal += count;
                } catch (error) {
                    results[collectionName] = {
                        error: String(error?.message || error)
                    };
                    console.warn(
                        `[HistoryRetention] Không dọn được ${collectionName}:`,
                        error
                    );
                }
            }

            if (removedTotal > 0) {
                console.info(
                    `[HistoryRetention] Đã xóa ${removedTotal} bản ghi lịch sử quá 2 tháng.`,
                    results
                );
            }

            return {
                skipped: false,
                cutoff: getCutoffTimestamp(nowMs),
                removedTotal,
                collections: results
            };
        })();

        try {
            return await cleanupInFlight;
        } finally {
            cleanupInFlight = null;
        }
    }

    function scheduleTeacherCleanup() {
        if (cleanupTimer) return cleanupTimer;

        // Không chặn luồng khởi động trang giáo viên.
        setTimeout(() => {
            cleanupNow().catch(error => {
                console.warn('[HistoryRetention] Dọn lịch sử lúc khởi động thất bại:', error);
            });
        }, 1200);

        cleanupTimer = setInterval(() => {
            cleanupNow().catch(error => {
                console.warn('[HistoryRetention] Dọn lịch sử định kỳ thất bại:', error);
            });
        }, CLEANUP_INTERVAL_MS);

        return cleanupTimer;
    }

    window.HistoryRetention = Object.freeze({
        version: '1.0.0',
        retentionMonths: RETENTION_MONTHS,
        collections: Object.freeze(Object.keys(COLLECTIONS)),
        protectedStateNodes: PROTECTED_STATE_NODES,
        getCutoffTimestamp,
        getRecordTimestamp,
        isExpired,
        filterRecent,
        cleanupCollection,
        cleanupNow,
        scheduleTeacherCleanup
    });
})();
