/**
 * Firebase Cloud Functions v2.
 * Quét sinh nhật vào phút thứ 5 mỗi giờ,
 * theo múi giờ Việt Nam.
 */

const {
    onSchedule
} = require(
    'firebase-functions/v2/scheduler'
);

const {
    initializeApp,
    getApps
} = require(
    'firebase-admin/app'
);

const {
    getDatabase
} = require(
    'firebase-admin/database'
);

if (getApps().length === 0) {
    initializeApp();
}

const TIME_ZONE =
    'Asia/Ho_Chi_Minh';

const DEFAULT_BIRTHDAY_ITEMS_BY_YEAR = {
    2026: [
        'pet_sinh_nhat_2026'
    ]
};

function getVietnamTodayParts(
    date = new Date()
) {
    const parts =
        new Intl.DateTimeFormat(
            'en-US',
            {
                timeZone: TIME_ZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }
        ).formatToParts(date);

    const result = {};

    for (const part of parts) {
        if (
            part.type !== 'literal'
        ) {
            result[part.type] =
                part.value;
        }
    }

    return {
        year:
            Number(result.year),

        month:
            Number(result.month),

        day:
            Number(result.day)
    };
}

function normalizeRole(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '');
}

function getBirthDate(user) {
    return String(
        user?.birthdayProfile?.date ||
        user?.birthDate ||
        ''
    ).trim();
}

function isValidBirthDate(value) {
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {
        return false;
    }

    const [year, month, day] =
        value.split('-').map(Number);

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

    return (
        date.getUTCFullYear() ===
            year &&
        date.getUTCMonth() ===
            month - 1 &&
        date.getUTCDate() ===
            day
    );
}

exports.issueBirthdayRewards =
onSchedule(
    {
        schedule: '5 * * * *',
        timeZone: TIME_ZONE,
        retryCount: 3
    },

    async () => {
        const db =
            getDatabase();

        const today =
            getVietnamTodayParts();

        const catalogSnapshot =
            await db.ref(
                'birthday_item_catalog'
            ).once('value');

        const birthdayItemsByYear = {
            ...DEFAULT_BIRTHDAY_ITEMS_BY_YEAR
        };

        const databaseCatalog =
            catalogSnapshot.val() || {};

        for (
            const [catalogYear, itemMap]
            of Object.entries(
                databaseCatalog
            )
        ) {
            const itemIds =
                Object.entries(
                    itemMap || {}
                )
                .filter(
                    ([, enabled]) =>
                        enabled === true
                )
                .map(
                    ([itemId]) =>
                        itemId
                );

            if (itemIds.length > 0) {
                birthdayItemsByYear[
                    catalogYear
                ] = [
                    ...new Set([
                        ...(
                            birthdayItemsByYear[
                                catalogYear
                            ] || []
                        ),
                        ...itemIds
                    ])
                ];
            }
        }

        const catalogUpdates = {};

        for (
            const [catalogYear, itemIds]
            of Object.entries(
                birthdayItemsByYear
            )
        ) {
            for (
                const itemId of itemIds
            ) {
                catalogUpdates[
                    `birthday_item_catalog/${catalogYear}/${itemId}`
                ] = true;

                catalogUpdates[
                    `birthday_item_years/${itemId}`
                ] = String(catalogYear);
            }
        }

        if (
            Object.keys(
                catalogUpdates
            ).length > 0
        ) {
            await db
                .ref()
                .update(
                    catalogUpdates
                );
        }

        const usersSnapshot =
            await db.ref(
                'users'
            ).once('value');

        const jobs = [];

        usersSnapshot.forEach(
            child => {
                const student =
                    child.val() || {};

                const role =
                    normalizeRole(
                        student.role
                    );

                if (
                    ![
                        'student',
                        'hocsinh',
                        'hs'
                    ].includes(role) ||
                    !student.username
                ) {
                    return;
                }

                const birthDate =
                    getBirthDate(
                        student
                    );

                if (
                    !isValidBirthDate(
                        birthDate
                    )
                ) {
                    return;
                }

                const [, month, day] =
                    birthDate
                        .split('-')
                        .map(Number);

                if (
                    month !==
                        today.month ||
                    day !==
                        today.day
                ) {
                    return;
                }

                jobs.push(
                    issueOneBirthdayReward(
                        db,
                        student,
                        birthDate,
                        today.year,
                        birthdayItemsByYear
                    )
                );
            }
        );

        await Promise.all(jobs);
    }
);

async function issueOneBirthdayReward(
    db,
    student,
    birthDate,
    year,
    birthdayItemsByYear
) {
    const username =
        String(
            student.username
        ).trim();

    const logRef = db.ref(
        `birthday_reward_logs/` +
        `${username}/` +
        `${year}`
    );

    const lockResult =
        await logRef.transaction(
            current => {
                if (
                    current &&
                    current.status ===
                        'issued'
                ) {
                    return;
                }

                return {
                    status: 'issuing',
                    username,
                    year,
                    birthDate,
                    attemptAt:
                        Date.now(),
                    issuedBy:
                        'cloud_function'
                };
            }
        );

    if (!lockResult.committed) {
        return;
    }

    const messageId =
        `birthday_${year}`;

    const issuedAt =
        Date.now();

    const timeString =
        new Date(
            issuedAt
        ).toLocaleString(
            'vi-VN',
            {
                timeZone:
                    TIME_ZONE
            }
        );

    const updates = {};

    for (
        const itemId
        of birthdayItemsByYear[
            year
        ] || []
    ) {
        updates[
            `birthday_item_catalog/${year}/${itemId}`
        ] = true;

        updates[
            `birthday_item_years/${itemId}`
        ] = String(year);
    }

    updates[
        `inbox_messages/${username}/${messageId}`
    ] = {
        message:
            `🎉 Chúc mừng sinh nhật ` +
            `${student.name || username}! ` +
            `Bạn nhận được 1 Xu Sinh Nhật ${year}. ` +
            `Xu này chỉ đổi được 1 vật phẩm ` +
            `mang tag Sinh nhật ${year}.`,

        giftType:
            'birthday_coin',

        giftValue:
            year,

        birthdayYear:
            year,

        source:
            'birthday_system',

        timestamp:
            issuedAt,

        timeString
    };

    updates[
        `birthday_reward_logs/${username}/${year}`
    ] = {
        status: 'issued',
        username,
        year,
        birthDate,
        messageId,
        issuedAt,
        issuedBy:
            'cloud_function'
    };

    await db
        .ref()
        .update(updates);
}