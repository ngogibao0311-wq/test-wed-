/* Pending operations only: completed ownership and balances are never rewritten. */
(() => {
    const terminal = new Set(['completed','active','failed_refunded','cancelled_refunded','refunded','rejected']);
    const running = new Map();
    async function scan(options) {
        const report = { recovered: [], review: [], deferred: [], released: [], checked: 0 };
        for (const [root, kind] of [['store_purchase_ops','purchase'],['store_trial_claims','trial']]) {
            let cursor = null;
            do {
                if (!options.isCurrent()) return report;
                let query = options.db.ref(`${root}/${options.username}`).orderByKey();
                if (cursor) query = query.startAt(cursor);
                const snapshot = await query.limitToFirst(21).once('value');
                const rows = [];
                snapshot.forEach(child => { if (child.key !== cursor) rows.push([child.key, child.val()]); });
                if (!rows.length) break;
                for (const [itemId, operation] of rows) {
                    if (!options.isCurrent()) return report;
                    if (!operation || terminal.has(operation.status)) continue;
                    report.checked++;
                    const entry = { kind, itemId, operationId: operation.operationId || '', status: operation.status };
                    if(operation.protocolVersion===2&&operation.atomicCharge!==true&&['reserved','debit_pending'].includes(operation.status)&&Number(operation.startedAt)+600000<=Date.now()&&options.cancelUnpaid){
                        try {
                            if(await options.cancelUnpaid(kind,itemId,operation)){report.released.push(entry);continue;}
                        }catch(error){report.review.push({...entry,reason:String(error.message||error)});continue;}
                    }
                    // A new payment or an uncertain old debit must never be resumed blindly.
                    if (operation.atomicCharge !== true || !operation.inventoryGrant ||
                        operation.status !== (kind === 'trial' ? 'debited' : 'paid')) {
                        (['reserved','debit_pending'].includes(operation.status) && Date.now()-Number(operation.startedAt)<600000
                            ? report.deferred : report.review).push(entry);
                        continue;
                    }
                    if (kind === 'trial' && (!Number.isFinite(Number(operation.expiresAt)) || Number(operation.expiresAt) <= Date.now())) {
                        report.review.push({ ...entry, reason: 'Thời hạn dùng thử đã hết; không tự gia hạn hoặc thu thêm tiền.' });
                        continue;
                    }
                    try {
                        const done = await options.recover(kind, itemId);
                        (done ? report.recovered : report.deferred).push(entry);
                    } catch (error) {
                        report.review.push({ ...entry, reason: String(error.message || error) });
                    }
                }
                cursor = rows[rows.length-1][0];
                if (snapshot.numChildren() < 21) break;
            } while (cursor);
        }
        return report;
    }
    window.PendingMechanismReconciliation = {
        run(options) {
            const key = options.uid + '/' + options.username;
            if (running.has(key)) return running.get(key);
            const task = scan(options).finally(() => { if (running.get(key) === task) running.delete(key); });
            running.set(key, task);
            return task;
        }
    };
})();
