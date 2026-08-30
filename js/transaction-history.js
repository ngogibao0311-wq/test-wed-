/* NHẬT KÝ GIAO DỊCH + HOÀN TÁC - Firebase RTDB v8 */
(() => {
    'use strict';
    if (window.TransactionHistory) return;

    const ROOT = 'transaction_logs';

    const LOG_PAGE_SIZE = 5;

    const state = {
        logs: [],
        loadingStudents: false,
        undoing: new Set(),

        visibleLogCount:
            LOG_PAGE_SIZE,

        lastLogFilterKey:
            ''
    };

    const user = () => {
        try {
            return JSON.parse(
                localStorage.getItem('currentUser')
            ) || {};
        } catch (_) {
            return {};
        }
    };

    const actor = () => {
        const u = user();

        return {
            uid:
                firebase.auth().currentUser?.uid ||
                u._fbKey ||
                '',

            username:
                String(u.username || ''),

            name:
                String(
                    u.name ||
                    u.username ||
                    'Không rõ'
                ),

            role:
                String(u.role || 'unknown')
        };
    };

    const esc = value => {
        if (window.escapeHTML) {
            return window.escapeHTML(value);
        }

        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const clean = value => {
        if (
            value === undefined ||
            value === null
        ) {
            return null;
        }

        if (Array.isArray(value)) {
            return value.map(clean);
        }

        if (typeof value !== 'object') {
            return value;
        }

        const out = {};

        Object.keys(value).forEach(key => {
            if (
                value[key] !== undefined &&
                typeof value[key] !== 'function'
            ) {
                out[key] = clean(value[key]);
            }
        });

        return out;
    };

    const same = (a, b) =>
        JSON.stringify(a ?? null) ===
        JSON.stringify(b ?? null);

    const newId = () =>
        db.ref(ROOT).push().key;

    async function recordWithId(
        id,
        data
    ) {
        if (!id) {
            throw new Error(
                'Không tạo được mã nhật ký.'
            );
        }

        await db
            .ref(`${ROOT}/${id}`)
            .set(
                clean({
                    id,

                    type:
                        data.type ||
                        'other',

                    summary:
                        data.summary ||
                        'Giao dịch hệ thống',

                    source:
                        data.source ||
                        'unknown',

                    targetUsername:
                        data.targetUsername ||
                        '',

                    targetName:
                        data.targetName ||
                        '',

                    amount:
                        data.amount ?? null,

                    unit:
                        data.unit || '',

                    before:
                        data.before ?? null,

                    after:
                        data.after ?? null,

                    details:
                        data.details || {},

                    reversible:
                        data.reversible === true,

                    nonReversibleReason:
                        data.nonReversibleReason ||
                        '',

                    status:
                        'active',

                    actor:
                        actor(),

                    createdAt:
                        firebase.database
                            .ServerValue
                            .TIMESTAMP,

                    createdAtClient:
                        Date.now()
                })
            );

        return id;
    }

    async function record(data) {
        return recordWithId(
            newId(),
            data
        );
    }

    async function recordSafe(
        data,
        id = null
    ) {
        try {
            return await recordWithId(
                id || newId(),
                data
            );
        } catch (error) {
            console.warn(
                '[TransactionHistory] Không ghi được log:',
                error
            );

            return null;
        }
    }

    async function lock(logId) {
        const normalizedLogId =
            String(logId || '').trim();

        if (!normalizedLogId) {
            throw new Error(
                'Mã nhật ký không hợp lệ.'
            );
        }

        const logRef =
            db.ref(
                `${ROOT}/${normalizedLogId}`
            );

        const statusRef =
            logRef.child('status');

        /*
         * Firebase có thể trả null ở lần chạy transaction đầu tiên
         * khi cache chưa được đồng bộ. Vì vậy thử tối đa 3 lần.
         */
        for (
            let attempt = 1;
            attempt <= 3;
            attempt++
        ) {
            const initialSnapshot =
                await logRef.once('value');

            if (!initialSnapshot.exists()) {
                await loadTeacherLogs()
                    .catch(console.error);

                throw new Error(
                    'Nhật ký giao dịch không còn tồn tại.'
                );
            }

            const initialLog =
                initialSnapshot.val() || {};

            if (
                initialLog.status ===
                'undone'
            ) {
                throw new Error(
                    'Giao dịch này đã được hoàn tác trước đó.'
                );
            }

            if (
                initialLog.status ===
                'undoing'
            ) {
                throw new Error(
                    'Giao dịch đang được hoàn tác ở tab hoặc thiết bị khác.'
                );
            }

            if (
                initialLog.status !==
                'active'
            ) {
                throw new Error(
                    `Trạng thái giao dịch không hợp lệ: ` +
                    `${initialLog.status || 'không rõ'}.`
                );
            }

            if (
                initialLog.reversible !==
                true
            ) {
                throw new Error(
                    'Giao dịch này chỉ được xem, không hỗ trợ hoàn tác.'
                );
            }

            let receivedTemporaryNull =
                false;

            let transactionError =
                'Giao dịch đã thay đổi trước khi hoàn tác.';

            /*
             * Chỉ khóa trường status.
             * Không transaction toàn bộ bản ghi nữa.
             */
            const tx =
                await statusRef.transaction(
                    currentStatus => {
                        if (
                            currentStatus === null ||
                            currentStatus === undefined
                        ) {
                            // SỬA Ở ĐÂY: Trả về 'undoing' thay vì return;
                            // Việc này ép Firebase SDK gửi request lên server để đồng bộ giá trị thật.
                            // Server sẽ không tạo bản ghi rác vì Firebase Rules của bạn đã chặn việc tạo log thiếu dữ liệu.
                            return 'undoing';
                        }

                        if (
                            currentStatus ===
                            'undone'
                        ) {
                            transactionError =
                                'Giao dịch này đã được hoàn tác trước đó.';

                            return;
                        }

                        if (
                            currentStatus ===
                            'undoing'
                        ) {
                            transactionError =
                                'Giao dịch đang được hoàn tác ở nơi khác.';

                            return;
                        }

                        if (
                            currentStatus !==
                            'active'
                        ) {
                            transactionError =
                                `Trạng thái giao dịch không hợp lệ: ` +
                                `${currentStatus}.`;

                            return;
                        }

                        return 'undoing';
                    }
                );

            if (tx.committed) {
                await logRef.update({
                    undoStartedAt:
                        firebase.database
                            .ServerValue
                            .TIMESTAMP,

                    undoStartedBy:
                        actor()
                });

                const lockedSnapshot =
                    await logRef.once('value');

                return {
                    ...(
                        lockedSnapshot.val() ||
                        initialLog
                    ),

                    id:
                        normalizedLogId,

                    firebaseKey:
                        normalizedLogId
                };
            }

            /*
             * Nếu callback chỉ nhận null tạm thời,
             * chờ một chút rồi đọc và thử lại.
             */
            if (
                receivedTemporaryNull &&
                attempt < 3
            ) {
                await new Promise(resolve =>
                    setTimeout(
                        resolve,
                        attempt * 150
                    )
                );

                continue;
            }

            const latestSnapshot =
                await logRef.once('value');

            if (!latestSnapshot.exists()) {
                throw new Error(
                    'Nhật ký giao dịch đã bị xóa.'
                );
            }

            const latestStatus =
                latestSnapshot
                    .child('status')
                    .val();

            if (latestStatus === 'undone') {
                throw new Error(
                    'Giao dịch này đã được hoàn tác trước đó.'
                );
            }

            if (latestStatus === 'undoing') {
                throw new Error(
                    'Giao dịch đang được hoàn tác ở nơi khác.'
                );
            }

            throw new Error(
                transactionError
            );
        }

        throw new Error(
            'Không thể khóa giao dịch sau nhiều lần thử.'
        );
    }

    async function activeAgain(
        logId,
        error
    ) {
        const normalizedLogId =
            String(logId || '').trim();

        if (!normalizedLogId) {
            return;
        }

        const logRef =
            db.ref(
                `${ROOT}/${normalizedLogId}`
            );

        const statusRef =
            logRef.child('status');

        try {
            const statusSnapshot =
                await statusRef.once('value');

            /*
             * Chỉ trả về active khi log thực sự
             * đang ở trạng thái undoing.
             */
            if (
                statusSnapshot.val() !==
                'undoing'
            ) {
                return;
            }

            const tx =
                await statusRef.transaction(
                    currentStatus => {
                        if (
                            currentStatus !==
                            'undoing'
                        ) {
                            return;
                        }

                        return 'active';
                    }
                );

            if (!tx.committed) {
                return;
            }

            await logRef.update({
                undoStartedAt:
                    null,

                undoStartedBy:
                    null,

                lastUndoError:
                    String(
                        error?.message ||
                        error ||
                        'Không rõ lỗi'
                    ),

                lastUndoErrorAt:
                    firebase.database
                        .ServerValue
                        .TIMESTAMP
            });

        } catch (restoreError) {
            console.error(
                'Không thể phục hồi trạng thái log:',
                restoreError
            );
        }
    }

    async function markUndone(
        logId,
        extra = {}
    ) {
        await db
            .ref(`${ROOT}/${logId}`)
            .update(
                clean({
                    status:
                        'undone',

                    undoneAt:
                        firebase.database
                            .ServerValue
                            .TIMESTAMP,

                    undoneBy:
                        actor(),

                    ...extra
                })
            );
    }

    async function undoCoin(log) {
        const path = String(
            log.details?.coinPath ||
            ''
        );

        const delta = Number(
            log.details?.delta
        );

        if (
            !path ||
            !Number.isFinite(delta) ||
            delta === 0
        ) {
            throw new Error(
                'Log Coin thiếu dữ liệu.'
            );
        }

        let beforeUndo = 0;
        let afterUndo = 0;

        const tx = await db
            .ref(path)
            .transaction(current => {
                beforeUndo =
                    Number(current) || 0;

                afterUndo =
                    beforeUndo - delta;

                if (afterUndo < 0) {
                    return;
                }

                return afterUndo;
            });

        if (!tx.committed) {
            throw new Error(
                'Số dư Coin hiện tại không đủ để hoàn tác.'
            );
        }

        await markUndone(
            log.id,
            {
                undoResult: {
                    beforeUndo,
                    afterUndo,
                    reversedDelta:
                        -delta
                }
            }
        );
    }

    async function undoGrade(log) {
        const path = String(
            log.details
                ?.submissionPath ||
            ''
        );

        const before =
            log.details?.before ||
            {};

        const after =
            log.details?.after ||
            {};

        if (!path) {
            throw new Error(
                'Log điểm thiếu đường dẫn bài nộp.'
            );
        }

        const tx = await db
            .ref(path)
            .transaction(current => {
                if (!current) {
                    return;
                }

                const unchanged = [
                    'grade',
                    'teacherComment',
                    'isRegrading'
                ].every(key =>
                    same(
                        current[key],
                        after[key]
                    )
                );

                if (!unchanged) {
                    return;
                }

                return {
                    ...current,

                    grade:
                        before.grade ??
                        null,

                    teacherComment:
                        before.teacherComment ??
                        null,

                    isRegrading:
                        before.isRegrading ??
                        false
                };
            });

        if (!tx.committed) {
            throw new Error(
                'Điểm hoặc nhận xét đã được sửa tiếp nên không thể hoàn tác.'
            );
        }

        await markUndone(log.id);
    }

    async function undoProfile(log) {
        const d =
            log.details || {};

        const requestPath =
            String(
                d.requestPath ||
                ''
            );

        if (!requestPath) {
            throw new Error(
                'Log yêu cầu thiếu đường dẫn.'
            );
        }

        if (
            d.passwordChanged === true
        ) {
            throw new Error(
                'Không hoàn tác tự động yêu cầu có đổi mật khẩu.'
            );
        }

        if (
            d.decision === 'rejected'
        ) {
            const tx = await db
                .ref(requestPath)
                .transaction(current => {
                    if (
                        !current ||
                        current.status !==
                        'rejected'
                    ) {
                        return;
                    }

                    return {
                        ...current,

                        status:
                            'pending',

                        reviewedBy:
                            null,

                        reviewedByName:
                            null,

                        reviewedAt:
                            null
                    };
                });

            if (!tx.committed) {
                throw new Error(
                    'Yêu cầu không còn ở trạng thái bị từ chối.'
                );
            }

            await markUndone(log.id);
            return;
        }

        if (
            d.decision !== 'approved'
        ) {
            throw new Error(
                'Quyết định duyệt không hợp lệ.'
            );
        }

        const userPath =
            String(
                d.userPath ||
                ''
            );

        if (!userPath) {
            throw new Error(
                'Log yêu cầu thiếu đường dẫn học sinh.'
            );
        }

        const [
            uSnap,
            rSnap
        ] = await Promise.all([
            db.ref(userPath)
                .once('value'),

            db.ref(requestPath)
                .once('value')
        ]);

        if (
            uSnap.val()?.name !==
            d.afterName
        ) {
            throw new Error(
                'Tên học sinh đã được thay đổi tiếp.'
            );
        }

        if (
            rSnap.val()?.status !==
            'approved'
        ) {
            throw new Error(
                'Yêu cầu không còn ở trạng thái đã duyệt.'
            );
        }

        const updates = {};

        updates[
            `${userPath}/name`
        ] =
            d.beforeName ?? '';

        updates[
            `${requestPath}/status`
        ] =
            'pending';

        updates[
            `${requestPath}/reviewedBy`
        ] =
            null;

        updates[
            `${requestPath}/reviewedByName`
        ] =
            null;

        updates[
            `${requestPath}/reviewedAt`
        ] =
            null;

        updates[
            `${ROOT}/${log.id}/status`
        ] =
            'undone';

        updates[
            `${ROOT}/${log.id}/undoneAt`
        ] =
            firebase.database
                .ServerValue
                .TIMESTAMP;

        updates[
            `${ROOT}/${log.id}/undoneBy`
        ] =
            actor();

        await db.ref().update(
            updates
        );
    }

    async function undoPurchase(log) {
        const d =
            log.details || {};

        const itemPath =
            String(
                d.itemPath ||
                ''
            );

        const coinPath =
            String(
                d.coinPath ||
                ''
            );

        const discountPath =
            String(
                d.discountPath ||
                ''
            );

        const finalPrice =
            Number(
                d.finalPrice
            ) || 0;

        if (
            !itemPath ||
            !coinPath
        ) {
            throw new Error(
                'Log mua hàng thiếu dữ liệu.'
            );
        }

        const reads = [
            db.ref(itemPath)
                .once('value')
        ];

        if (discountPath) {
            reads.push(
                db.ref(discountPath)
                    .once('value')
            );
        }

        const snaps =
            await Promise.all(
                reads
            );

        const item =
            snaps[0].val();

        const discount =
            discountPath
                ? snaps[1].val()
                : null;

        if (
            !item ||
            item.auditTransactionId !==
            log.id
        ) {
            throw new Error(
                'Vật phẩm không còn thuộc đúng giao dịch này.'
            );
        }

        if (
            discountPath &&
            (
                !discount ||
                discount
                    .usedTransactionId !==
                log.id
            )
        ) {
            throw new Error(
                'Mã giảm giá đã thay đổi sau giao dịch.'
            );
        }

        const updates = {};

        updates[itemPath] =
            null;

        if (finalPrice > 0) {
            updates[coinPath] =
                firebase.database
                    .ServerValue
                    .increment(
                        finalPrice
                    );
        }

        if (discountPath) {
            updates[
                `${discountPath}/isUsed`
            ] =
                false;

            updates[
                `${discountPath}/usedAt`
            ] =
                null;

            updates[
                `${discountPath}/usedForItem`
            ] =
                null;

            updates[
                `${discountPath}/usedTransactionId`
            ] =
                null;
        }

        updates[
            `${ROOT}/${log.id}/status`
        ] =
            'undone';

        updates[
            `${ROOT}/${log.id}/undoneAt`
        ] =
            firebase.database
                .ServerValue
                .TIMESTAMP;

        updates[
            `${ROOT}/${log.id}/undoneBy`
        ] =
            actor();

        await db.ref().update(
            updates
        );
    }

    async function undoConversion(
        log
    ) {
        const d =
            log.details || {};

        const coinPath =
            String(
                d.coinPath ||
                ''
            );

        const offsetPath =
            String(
                d.offsetPath ||
                ''
            );

        const coinDelta =
            Number(
                d.coinDelta
            );

        const offsetDelta =
            Number(
                d.offsetDelta
            );

        if (
            !coinPath ||
            !offsetPath ||
            !Number.isFinite(
                coinDelta
            ) ||
            !Number.isFinite(
                offsetDelta
            )
        ) {
            throw new Error(
                'Log quy đổi thiếu dữ liệu.'
            );
        }

        const coinSnapshot =
            await db
                .ref(coinPath)
                .once('value');

        const currentCoins =
            Number(
                coinSnapshot.val()
            ) || 0;

        if (
            currentCoins -
            coinDelta <
            0
        ) {
            throw new Error(
                'Học sinh không còn đủ Coin để hoàn tác quy đổi.'
            );
        }

        const updates = {};

        updates[coinPath] =
            firebase.database
                .ServerValue
                .increment(
                    -coinDelta
                );

        updates[offsetPath] =
            firebase.database
                .ServerValue
                .increment(
                    -offsetDelta
                );

        updates[
            `${ROOT}/${log.id}/status`
        ] =
            'undone';

        updates[
            `${ROOT}/${log.id}/undoneAt`
        ] =
            firebase.database
                .ServerValue
                .TIMESTAMP;

        updates[
            `${ROOT}/${log.id}/undoneBy`
        ] =
            actor();

        await db.ref().update(
            updates
        );
    }

    async function undoGiftSent(log) {
        const details =
            log.details || {};

        const messagePath =
            String(
                details.messagePath || ''
            );

        if (!messagePath) {
            throw new Error(
                'Nhật ký không có đường dẫn thư.'
            );
        }

        const messageSnapshot =
            await db
                .ref(messagePath)
                .once('value');

        const message =
            messageSnapshot.val();

        if (!message) {
            // SỬA Ở ĐÂY: Cập nhật Firebase để khóa vĩnh viễn nút hoàn tác của giao dịch này
            await db.ref(`${ROOT}/${log.id}`).update({
                reversible: false,
                nonReversibleReason: 'Học sinh đã mở quà hoặc thư đã bị xóa.',
                status: 'active'
            });

            throw new Error(
                'Thư không còn tồn tại. Có thể học sinh đã nhận hoặc đã xóa thư.'
            );
        }

        if (
            message.source !==
            'teacher_gift'
        ) {
            throw new Error(
                'Thư này không phải quà do giáo viên gửi.'
            );
        }

        if (
            String(
                message.giftType || ''
            ) !==
            String(
                details.giftType || ''
            )
        ) {
            throw new Error(
                'Loại quà trong thư đã thay đổi.'
            );
        }

        if (
            String(
                message.giftValue ?? ''
            ) !==
            String(
                details.giftValue ?? ''
            )
        ) {
            throw new Error(
                'Giá trị quà trong thư đã thay đổi.'
            );
        }

        const updates = {};

        // Thu hồi thư khỏi hộp thư học sinh
        updates[messagePath] =
            null;

        // Đánh dấu nhật ký đã hoàn tác
        updates[
            `${ROOT}/${log.id}/status`
        ] =
            'undone';

        updates[
            `${ROOT}/${log.id}/undoneAt`
        ] =
            firebase.database
                .ServerValue
                .TIMESTAMP;

        updates[
            `${ROOT}/${log.id}/undoneBy`
        ] =
            actor();

        updates[
            `${ROOT}/${log.id}/undoResult`
        ] = {
            action:
                'teacher_gift_recalled',

            messagePath:
                messagePath
        };

        await db.ref().update(
            updates
        );
    }

    async function undo(logId) {
        if (
            actor().role !==
            'teacher'
        ) {
            alert(
                '⛔ Chỉ giáo viên được hoàn tác.'
            );
            return;
        }

        if (
            state.undoing.has(
                logId
            )
        ) {
            return;
        }

        if (
            !confirm(
                'Bạn chắc chắn muốn hoàn tác giao dịch này?'
            )
        ) {
            return;
        }

        state.undoing.add(
            logId
        );

        /*
         * Chỉ phục hồi trạng thái active nếu
         * bước lock đã thành công nhưng quá trình
         * hoàn tác phía sau gặp lỗi.
         */
        let lockAcquired = false;

        try {
            const log =
                await lock(logId);

            lockAcquired = true;

            if (
                [
                    'coin_adjustment',
                    'coin_change'
                ].includes(log.type)
            ) {
                await undoCoin(log);

            } else if (
                log.type ===
                'grade_change'
            ) {
                await undoGrade(log);

            } else if (
                log.type ===
                'profile_request_decision'
            ) {
                await undoProfile(log);

            } else if (
                log.type ===
                'store_purchase'
            ) {
                await undoPurchase(log);

            } else if (
                log.type ===
                'coin_conversion'
            ) {
                await undoConversion(log);

            } else if (
                log.type ===
                'gift_sent'
            ) {
                await undoGiftSent(log);

            } else {
                throw new Error(
                    'Loại giao dịch này chưa hỗ trợ hoàn tác.'
                );
            }

            alert(
                '✅ Hoàn tác thành công.'
            );

            await loadTeacherLogs();

        } catch (error) {
            console.error(error);

            /*
             * Không gọi activeAgain khi lock thất bại.
             * Nếu không, giao dịch đã hoàn tác có thể
             * bị đổi nhầm về active.
             */
            if (lockAcquired) {
                await activeAgain(
                    logId,
                    error
                );
            }

            /*
             * Tải lại danh sách để loại bỏ
             * nút Hoàn tác đã cũ.
             */
            await loadTeacherLogs()
                .catch(console.error);

            alert(
                `❌ Không thể hoàn tác: ${error.message}`
            );

        } finally {
            state.undoing.delete(
                logId
            );
        }
    }

    const typeName = type => ({
        coin_adjustment:
            'Điều chỉnh Coin',

        coin_change:
            'Biến động Coin',

        grade_change:
            'Đổi điểm',

        inventory_grant:
            'Nhận vật phẩm',

        discount_used:
            'Dùng mã giảm giá',

        store_purchase:
            'Mua vật phẩm',

        coin_conversion:
            'Quy đổi Coin/Tiền',

        gift_sent:
            'Giáo viên gửi quà',

        gift_claimed:
            'Nhận quà qua thư',

        grade_ticket_reward:
            'Nhận vé từ điểm',

        game_reward:
            'Phần thưởng trò chơi',

        leaderboard_reward:
            'Phần thưởng thi đua',

        daily_login_reward:
            'Quà đăng nhập',

        profile_request_decision:
            'Duyệt đổi thông tin'
    }[type] || type || 'Khác');

    function getCurrentMonthStartTimestamp() {
        const now = new Date();

        return new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
            0,
            0,
            0,
            0
        ).getTime();
    }

    /*
     * Xóa toàn bộ nhật ký thuộc các tháng trước.
     *
     * Ví dụ:
     * - Sang ngày 01/08/2026
     * - Toàn bộ log trước 01/08/2026 sẽ bị xóa.
     *
     * Các giao dịch mới tạo trong ngày 01 vẫn được giữ.
     */
    async function cleanupOldTransactionLogs() {
        if (
            actor().role !==
            'teacher'
        ) {
            return 0;
        }

        const cutoff =
            getCurrentMonthStartTimestamp() - 1;

        const snapshot =
            await db
                .ref(ROOT)
                .orderByChild(
                    'createdAtClient'
                )
                .endAt(cutoff)
                .once('value');

        const updates = {};
        let removedCount = 0;

        snapshot.forEach(child => {
            updates[
                `${ROOT}/${child.key}`
            ] = null;

            removedCount++;
        });

        if (removedCount > 0) {
            await db.ref().update(
                updates
            );

            console.info(
                `[TransactionHistory] Đã xóa ` +
                `${removedCount} nhật ký của tháng cũ.`
            );
        }

        return removedCount;
    }

    function renderTeacherLogs() {
        const box =
            document.getElementById(
                'transactionLogList'
            );

        if (!box) {
            return;
        }

        const keyword =
            String(
                document.getElementById(
                    'transactionSearch'
                )?.value || ''
            )
                .trim()
                .toLowerCase();

        const type =
            document.getElementById(
                'transactionTypeFilter'
            )?.value ||
            'all';

        const status =
            document.getElementById(
                'transactionStatusFilter'
            )?.value ||
            'all';

        const logs =
            state.logs.filter(log => {
                if (
                    type !== 'all' &&
                    log.type !== type
                ) {
                    return false;
                }

                if (
                    status !== 'all' &&
                    log.status !== status
                ) {
                    return false;
                }

                if (!keyword) {
                    return true;
                }

                return [
                    log.summary,
                    log.targetUsername,
                    log.targetName,
                    log.actor?.name,
                    log.actor?.username,
                    log.source,
                    typeName(log.type)
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(keyword);
            });

        const filterKey =
            JSON.stringify([
                keyword,
                type,
                status
            ]);

        /*
         * Khi đổi từ khóa hoặc bộ lọc,
         * quay lại hiển thị 5 dòng đầu.
         */
        if (
            state.lastLogFilterKey !==
            filterKey
        ) {
            state.lastLogFilterKey =
                filterKey;

            state.visibleLogCount =
                LOG_PAGE_SIZE;
        }

        const visibleLogs =
            logs.slice(
                0,
                state.visibleLogCount
            );

        const remainingCount =
            Math.max(
                0,
                logs.length -
                visibleLogs.length
            );

        if (!logs.length) {
            box.innerHTML = `
        <p style="
          text-align:center;
          color:#64748b;
          padding:20px;
        ">
          Chưa có giao dịch phù hợp.
        </p>
      `;

            return;
        }

        box.innerHTML =
            visibleLogs.map(log => {
                const canUndo =
                    log.reversible === true &&
                    log.status === 'active';

                const statusText =
                    log.status === 'undone'
                        ? '↩️ Đã hoàn tác'
                        : log.status === 'undoing'
                            ? '⏳ Đang hoàn tác'
                            : canUndo
                                ? '✅ Có thể hoàn tác'
                                : '🔒 Chỉ xem';

                const timestamp =
                    Number(
                        log.createdAt ||
                        log.createdAtClient ||
                        0
                    );

                const time =
                    timestamp
                        ? new Date(
                            timestamp
                        ).toLocaleString(
                            'vi-VN'
                        )
                        : 'Đang đồng bộ...';

                const amount =
                    log.amount === null ||
                        log.amount === undefined
                        ? ''
                        : `
              ·
              <span style="color:#d97706">
                ${Number(
                            log.amount
                        ).toLocaleString(
                            'vi-VN'
                        )}
                ${esc(
                            log.unit || ''
                        )}
              </span>
            `;

                return `
          <div style="
            background:#fff;
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:14px;
            margin-bottom:10px;
          ">
            <div style="
              display:flex;
              justify-content:space-between;
              gap:10px;
              flex-wrap:wrap;
            ">
              <strong>
                ${esc(
                    typeName(
                        log.type
                    )
                )}
                ${amount}
              </strong>

              <strong>
                ${esc(statusText)}
              </strong>
            </div>

            <p style="
              margin:8px 0;
            ">
              ${esc(
                    log.summary || ''
                )}
            </p>

            <div style="
              font-size:.9em;
              color:#64748b;
              line-height:1.55;
            ">
              <div>
                <b>Người thực hiện:</b>
                ${esc(
                    log.actor?.name ||
                    log.actor?.username ||
                    'Không rõ'
                )}
              </div>

              <div>
                <b>Học sinh:</b>

                ${esc(
                    log.targetName ||
                    log.targetUsername ||
                    '---'
                )}

                ${log.targetUsername
                        ? `(${esc(
                            log.targetUsername
                        )})`
                        : ''
                    }
              </div>

              <div>
                <b>Nguồn:</b>
                ${esc(
                        log.source || ''
                    )}
              </div>

              <div>
                <b>Thời gian:</b>
                ${esc(time)}
              </div>

              ${log.nonReversibleReason
                        ? `
                    <div>
                      <b>Không hoàn tác:</b>
                      ${esc(
                            log.nonReversibleReason
                        )}
                    </div>
                  `
                        : ''
                    }
            </div>

            ${canUndo
                        ? `
                  <button
                    type="button"
                    onclick="
                      TransactionHistory.undo(
                        '${esc(log.id)}'
                      )
                    "
                    style="
                      margin-top:10px;
                      padding:8px 13px;
                      background:#7c3aed;
                      color:white;
                      border:0;
                      border-radius:8px;
                      font-weight:bold;
                      cursor:pointer;
                    "
                  >
                    ↩️ Hoàn tác
                  </button>
                `
                        : ''
                    }
          </div>
        `;
            }).join('') +
            (
                remainingCount > 0
                    ? `
        <button
            type="button"
            onclick="
                TransactionHistory
                    .loadMoreTeacherLogs()
            "
            style="
                width:100%;
                margin-top:12px;
                padding:12px;
                border:0;
                border-radius:10px;
                background:linear-gradient(
                    135deg,
                    #4f46e5,
                    #7c3aed
                );
                color:#fff;
                font-weight:700;
                cursor:pointer;
            "
        >
            📥 Tải thêm
            (${Math.min(
                        LOG_PAGE_SIZE,
                        remainingCount
                    )} giao dịch)
        </button>
      `
                    : `
        <p style="
            text-align:center;
            color:#64748b;
            margin:14px 0 0;
            font-size:.9em;
        ">
            Đã hiển thị
            ${visibleLogs.length}/${logs.length}
            giao dịch.
        </p>
      `
            );
    }

    function loadMoreTeacherLogs() {
        state.visibleLogCount +=
            LOG_PAGE_SIZE;

        renderTeacherLogs();
    }

    async function loadTeacherLogs() {
        const box =
            document.getElementById(
                'transactionLogList'
            );

        if (box) {
            box.textContent =
                'Đang tải nhật ký...';
        }

        try {
            /*
             * Xóa nhật ký các tháng trước
             * trước khi tải dữ liệu.
             */
            await cleanupOldTransactionLogs();

            const snap =
                await db
                    .ref(ROOT)
                    .orderByChild(
                        'createdAtClient'
                    )
                    .once('value');

            const logs = [];

            snap.forEach(child => {
                const logData =
                    child.val() || {};

                logs.push({
                    /*
                     * Đưa dữ liệu lên trước.
                     * Sau đó đặt id = child.key để
                     * không bị trường id cũ ghi đè.
                     */
                    ...logData,

                    id:
                        child.key,

                    firebaseKey:
                        child.key
                });
            });

            state.logs =
                logs.sort((a, b) =>
                    Number(
                        b.createdAtClient ||
                        b.createdAt ||
                        0
                    ) -
                    Number(
                        a.createdAtClient ||
                        a.createdAt ||
                        0
                    )
                );

            state.visibleLogCount =
                LOG_PAGE_SIZE;

            state.lastLogFilterKey =
                '';

            renderTeacherLogs();

        } catch (error) {
            console.error(error);

            if (box) {
                box.innerHTML = `
          <p style="color:#dc2626">
            Không tải được nhật ký:
            ${esc(error.message)}
          </p>
        `;
            }
        }
    }

    async function populateStudentSelect() {
        const select =
            document.getElementById(
                'txCoinStudent'
            );

        if (
            !select ||
            state.loadingStudents
        ) {
            return;
        }

        state.loadingStudents =
            true;

        try {
            const snap =
                await db
                    .ref('users')
                    .once('value');

            const students = [];

            snap.forEach(child => {
                const u =
                    child.val() || {};

                if (
                    u.role === 'student' &&
                    u.username
                ) {
                    students.push({
                        username:
                            u.username,

                        name:
                            u.name ||
                            u.username
                    });
                }
            });

            students.sort((a, b) =>
                a.name.localeCompare(
                    b.name,
                    'vi'
                )
            );

            select.innerHTML =
                `
          <option value="">
            -- Chọn học sinh --
          </option>
        ` +
                students.map(s => `
          <option
            value="${esc(
                    s.username
                )}"
            data-name="${esc(
                    s.name
                )}"
          >
            ${esc(s.name)}
            (${esc(s.username)})
          </option>
        `).join('');

        } finally {
            state.loadingStudents =
                false;
        }
    }

    async function adjustCoinFromTeacher() {
        if (
            actor().role !==
            'teacher'
        ) {
            alert(
                '⛔ Chỉ giáo viên được điều chỉnh Coin.'
            );
            return;
        }

        const select =
            document.getElementById(
                'txCoinStudent'
            );

        const deltaInput =
            document.getElementById(
                'txCoinDelta'
            );

        const reasonInput =
            document.getElementById(
                'txCoinReason'
            );

        const username =
            String(
                select?.value || ''
            ).trim();

        const delta =
            Number(
                deltaInput?.value
            );

        const reason =
            String(
                reasonInput?.value ||
                ''
            ).trim();

        const targetName =
            select
                ?.selectedOptions?.[0]
                ?.dataset?.name ||
            username;

        if (!username) {
            alert(
                'Vui lòng chọn học sinh.'
            );
            return;
        }

        if (
            !Number.isInteger(delta) ||
            delta === 0
        ) {
            alert(
                'Nhập số nguyên khác 0, ví dụ 50 hoặc -20.'
            );
            return;
        }

        if (!reason) {
            alert(
                'Vui lòng nhập lý do.'
            );
            return;
        }

        if (
            !confirm(
                `${delta > 0
                    ? 'Cộng'
                    : 'Trừ'
                } ${Math.abs(delta)} Coin cho ${targetName}?`
            )
        ) {
            return;
        }

        const coinPath =
            `student_coins/${username}`;

        const logId =
            newId();

        let before = 0;
        let after = 0;

        try {
            const tx =
                await db
                    .ref(coinPath)
                    .transaction(current => {
                        before =
                            Number(current) ||
                            0;

                        after =
                            before +
                            delta;

                        if (after < 0) {
                            return;
                        }

                        return after;
                    });

            if (!tx.committed) {
                throw new Error(
                    'Số dư sau điều chỉnh không được âm.'
                );
            }

            try {
                await recordWithId(
                    logId,
                    {
                        type:
                            'coin_adjustment',

                        summary:
                            `${delta > 0
                                ? 'Cộng'
                                : 'Trừ'
                            } ` +
                            `${Math.abs(delta)} Coin: ${reason}`,

                        source:
                            'teacher_manual',

                        targetUsername:
                            username,

                        targetName,

                        amount:
                            delta,

                        unit:
                            'Coin',

                        before,

                        after,

                        reversible:
                            true,

                        details: {
                            coinPath,
                            delta,
                            reason
                        }
                    }
                );

            } catch (logError) {
                await db
                    .ref(coinPath)
                    .transaction(current =>
                        Number(current) === after
                            ? before
                            : undefined
                    );

                throw new Error(
                    'Không ghi được nhật ký nên thay đổi Coin đã bị hủy.'
                );
            }

            deltaInput.value = '';
            reasonInput.value = '';

            alert(
                `✅ Số dư mới: ` +
                `${after.toLocaleString('vi-VN')} Coin.`
            );

            await loadTeacherLogs();

        } catch (error) {
            console.error(error);

            alert(
                `❌ Thất bại: ${error.message}`
            );
        }
    }

    async function openTeacherTab() {
        await Promise.all([
            populateStudentSelect(),
            loadTeacherLogs()
        ]);
    }

    window.TransactionHistory =
        Object.freeze({
            newId,
            record,
            recordSafe,
            recordWithId,
            undo,
            renderTeacherLogs,
            loadMoreTeacherLogs,
            loadTeacherLogs,
            cleanupOldTransactionLogs,
            populateStudentSelect,
            adjustCoinFromTeacher,
            openTeacherTab
        });
})();