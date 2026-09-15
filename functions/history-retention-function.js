'use strict';

// Firebase Functions v2 - dọn lịch sử hiển thị quá 2 tháng.
// Dùng Admin SDK nên không phụ thuộc Firebase Realtime Database Rules.
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.database();
const RETENTION_MONTHS = 2;
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

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

// CỐ Ý KHÔNG có các node khóa quyền lợi ở đây:
// birthday_reward_logs, leaderboard_reward_claims, hoihoa_reward_logs,
// student_history_events, purchase_locks, wallet/grant/redemption, inventory,
// discounts, limits, assignments/submissions...

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

    return Date.UTC(
        Number(match[6]),
        Number(match[5]) - 1,
        Number(match[4]),
        Number(match[1]),
        Number(match[2]),
        Number(match[3] || 0)
    ) - VIETNAM_OFFSET_MS;
}

function getTimestamp(config, record) {
    for (const field of config.timestampFields || []) {
        const value = Number(record?.[field]);
        if (Number.isFinite(value) && value > 0) return value;
    }

    if (config.legacyTimeField) {
        return parseLegacyVietnamTime(record?.[config.legacyTimeField]);
    }

    return 0;
}

function canDelete(config, record) {
    if (!Array.isArray(config.removableStatuses)) return true;
    return config.removableStatuses.includes(
        String(record?.status || '').trim().toLowerCase()
    );
}

exports.cleanupHistoryRetention = onSchedule(
    {
        schedule: '17 3 * * *',
        timeZone: 'Asia/Ho_Chi_Minh',
        region: 'asia-southeast1',
        timeoutSeconds: 540,
        memory: '256MiB'
    },
    async () => {
        const cutoff = getCutoffTimestamp();
        const rootUpdates = {};
        const removedByCollection = {};

        for (const [collectionName, config] of Object.entries(COLLECTIONS)) {
            const snapshot = await db.ref(collectionName).once('value');
            let removed = 0;

            snapshot.forEach(child => {
                const record = child.val() || {};
                if (!canDelete(config, record)) return;

                const timestamp = getTimestamp(config, record);
                if (!timestamp || timestamp >= cutoff) return;

                rootUpdates[`${collectionName}/${child.key}`] = null;
                removed++;
            });

            removedByCollection[collectionName] = removed;
        }

        const paths = Object.keys(rootUpdates);
        if (paths.length > 0) {
            // Chia batch để tránh một update quá lớn khi dữ liệu lịch sử cũ nhiều.
            const BATCH_SIZE = 400;
            for (let index = 0; index < paths.length; index += BATCH_SIZE) {
                const batch = {};
                paths.slice(index, index + BATCH_SIZE).forEach(path => {
                    batch[path] = null;
                });
                await db.ref().update(batch);
            }
        }

        console.log('[HistoryRetention] cleanup completed', {
            cutoff,
            removedTotal: paths.length,
            removedByCollection
        });
    }
);
