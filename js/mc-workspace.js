/*
 * MC Workspace V2 · Fullscreen quiz workspace + shared saved progress
 * Build: 2026-10-01.workspace-v7-resume
 *
 * Semantics:
 * - The green button inside the fullscreen workspace finalizes ONLY the MC section to the website.
 * - It NEVER submits the assignment to the teacher.
 * - The existing outer "Nộp bài tập ngay" button remains the only manual teacher submission action.
 * - trac_nghiem / ket_hop: show due date, never a running MC-only countdown.
 * - thi: only show a running countdown when the teacher enabled the whole-exam time limit.
 */
(function () {
    'use strict';

    const BUILD = '20261003.workspace-v8';
    if (window.MCWorkspace?.__build === BUILD) return;
    const LEASE_MS = 90 * 1000;
    const LOCAL_PREFIX = 'mc_workspace_v2_local_';
    const SESSION_VERSION = 2;

    const reviewRegistry = new Map();
    const state = {
        currentAssignId: '',
        currentReviewKey: '',
        sessions: Object.create(null),
        pendingSaves: Object.create(null),
        reviewCounter: 0,
        zoom: 1,
        sessionUsers: Object.create(null),
        finalizing: Object.create(null),
        remoteSaveChains: Object.create(null)
    };

    function text(value) {
        return String(value == null ? '' : value);
    }

    function escapeHTML(value) {
        return text(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function safeRich(value) {
        try {
            if (typeof window.sanitizeRichHTML === 'function') {
                return window.sanitizeRichHTML(text(value));
            }
        } catch (_) {}
        return escapeHTML(value);
    }

    function getUser() {
        try {
            const cached = JSON.parse(localStorage.getItem('currentUser') || '{}');
            return cached && typeof cached === 'object' ? cached : {};
        } catch (_) {
            return {};
        }
    }

    function getUsername() {
        return text(getUser().username).trim();
    }

    function randomId(prefix) {
        try {
            if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
        } catch (_) {}
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    }

    // Identifier retained for compatibility with the stored session schema; it no longer locks tabs.
    const documentOwnerId = randomId('mcowner');
    function getOwnerId() { return documentOwnerId; }

    function getAssignment(assignOrId) {
        if (assignOrId && typeof assignOrId === 'object') return assignOrId;
        const id = text(assignOrId);
        const rows = Array.isArray(window.cachedAssignments) ? window.cachedAssignments : [];
        return rows.find(item => text(item?.id) === id || text(item?._fbKey) === id) || null;
    }

    function getAssignmentKey(assignment) {
        return text(assignment?._fbKey || assignment?.id).trim();
    }

    function isMC(assignment) {
        const type = text(assignment?.assessmentType);
        return (
            type === 'trac_nghiem' ||
            type === 'ket_hop' ||
            type === 'thi'
        ) && Array.isArray(assignment?.questions) && assignment.questions.length > 0;
    }

    function getCurrentSubmission(assignId) {
        const username = getUsername();
        const rows = Array.isArray(window.cachedSubmissions) ? window.cachedSubmissions : [];
        return rows
            .filter(row => text(row?.studentUsername) === username && text(row?.assignmentId) === text(assignId))
            .sort((a, b) => Number(b?.submittedAt || b?.redoCompletedAt || 0) - Number(a?.submittedAt || a?.redoCompletedAt || 0))[0] || null;
    }

    function isRedoActive(assignId) {
        return getCurrentSubmission(assignId)?.isRedoing === true;
    }

    function getExamSet(assignment, submission) {
        if (submission && Array.isArray(submission.questionSnapshot) && submission.questionSnapshot.length) {
            return {
                questions: submission.questionSnapshot,
                versionCode: text(submission.examVersionCode || 'Gốc'),
                versionIndex: Number(submission.examVersionIndex || 0),
                randomized: text(submission.examVersionCode || '') !== '' && text(submission.examVersionCode) !== 'Gốc'
            };
        }
        try {
            if (typeof window.getStudentExamQuestions === 'function') {
                const set = window.getStudentExamQuestions(assignment);
                if (set && Array.isArray(set.questions)) return set;
            }
        } catch (_) {}
        return {
            questions: Array.isArray(assignment?.questions) ? assignment.questions : [],
            versionCode: 'Gốc',
            versionIndex: 0,
            randomized: false
        };
    }

    function localKey(assignId) {
        return `${LOCAL_PREFIX}${getUsername()}_${text(assignId)}`;
    }

    function readLocalState(assignId) {
        let own = {};
        try {
            own = JSON.parse(localStorage.getItem(localKey(assignId)) || '{}') || {};
        } catch (_) {}

        let legacy = {};
        try {
            legacy = JSON.parse(localStorage.getItem(`draft_${getUsername()}_${text(assignId)}`) || '{}') || {};
        } catch (_) {}

        return {
            answers: {
                ...(legacy.mcAnswers && typeof legacy.mcAnswers === 'object' ? legacy.mcAnswers : {}),
                ...(own.answers && typeof own.answers === 'object' ? own.answers : {})
            },
            updatedAt: Number(own.updatedAt || 0),
            finalized: own.finalized === true,
            finalizedAt: Number(own.finalizedAt || 0),
            ownerId: text(own.ownerId || '')
        };
    }

    function writeLocalState(assignId, patch) {
        const prev = readLocalState(assignId);
        const next = {
            ...prev,
            ...patch,
            answers: patch.answers && typeof patch.answers === 'object'
                ? { ...patch.answers }
                : { ...prev.answers },
            updatedAt: Number(patch.updatedAt || Date.now())
        };
        try {
            localStorage.setItem(localKey(assignId), JSON.stringify(next));
        } catch (_) {}
        return next;
    }

    function removeLocalState(assignId) {
        try { localStorage.removeItem(localKey(assignId)); } catch (_) {}
    }

    function sessionPath(assignId, usernameOverride = '') {
        const key = text(assignId);
        const username = text(
            usernameOverride ||
            state.sessionUsers[key] ||
            state.sessions[key]?.username ||
            getUsername()
        ).trim();
        return `mc_workspace_sessions/${username}/${key}`;
    }

    function serverTimestampNow() {
        return Date.now();
    }

    /*
     * Firebase RTDB transaction callbacks may be invoked first with a local
     * `null` before the authoritative server value has been merged. Returning
     * `undefined` at that point aborts the transaction immediately, which was
     * the root cause of the false MC_WORKSPACE_*_CONFLICT_missing errors.
     *
     * Instead, seed a valid ACTIVE record. If the server already has a record,
     * Firebase reruns the callback with that authoritative value; the normal
     * Existing submission state is preserved when Firebase retries the transaction.
     */
    function buildActiveSessionSeed(assignment, answers = {}, base = null, at = serverTimestampNow()) {
        const username = getUsername();
        const assignId = text(assignment?.id || assignment?._fbKey);
        const assignmentKey = getAssignmentKey(assignment);
        const examSet = getExamSet(assignment);
        return {
            version: SESSION_VERSION,
            username,
            assignmentId: assignId,
            assignmentKey,
            status: 'active',
            ownerId: getOwnerId(),
            ownerLeaseUntil: at + LEASE_MS,
            heartbeatAt: at,
            startedAt: Number(base?.startedAt || at),
            updatedAt: at,
            answers: normalizeAnswers(answers),
            questionCount: examSet.questions.length,
            examVersionCode: text(base?.examVersionCode || examSet.versionCode || 'Gốc'),
            examVersionIndex: Number(base?.examVersionIndex ?? examSet.versionIndex ?? 0)
        };
    }

    function normalizeAnswers(value) {
        const result = {};
        if (!value || typeof value !== 'object') return result;
        Object.entries(value).forEach(([key, answer]) => {
            const normalized = text(answer).toUpperCase();
            if (/^[ABCD]$/.test(normalized)) result[text(key)] = normalized;
        });
        return result;
    }

    function mergeAnswers(remote, local, localUpdatedAt, remoteUpdatedAt) {
        const remoteAnswers = normalizeAnswers(remote);
        const localAnswers = normalizeAnswers(local);
        if (Number(localUpdatedAt || 0) > Number(remoteUpdatedAt || 0)) {
            return { ...remoteAnswers, ...localAnswers };
        }
        return { ...localAnswers, ...remoteAnswers };
    }

    function ensureDb() {
        let candidate = null;
        try {
            if (typeof db !== 'undefined' && db && typeof db.ref === 'function') {
                candidate = db;
            }
        } catch (_) {}
        if (!candidate && window.db && typeof window.db.ref === 'function') {
            candidate = window.db;
        }
        if (!candidate) throw new Error('MC_WORKSPACE_DATABASE_UNAVAILABLE');
        return candidate;
    }

    async function transactSession(ref, update, onComplete, applyLocally = false) {
        const keep = () => {};
        ref.on?.('value', keep, () => {});
        try {
            await ref.once('value');
            return await ref.transaction(update, onComplete, applyLocally);
        } finally { ref.off?.('value', keep); }
    }

    async function readSession(assignId) {
        const key = text(assignId);
        const snap = await ensureDb().ref(sessionPath(key)).once('value');
        const value = snap.val();
        if (value && typeof value === 'object') {
            state.sessions[key] = value;
            if (value.username) state.sessionUsers[key] = text(value.username);
        }
        return value || null;
    }

    function canClientResetSubmittedSession(assignId) {
        return isRedoActive(assignId);
    }

    async function acquireOwner(assignOrId, options = {}) {
        const assignment = getAssignment(assignOrId);
        if (!assignment || !isMC(assignment)) return null;

        const username = getUsername();
        const assignId = text(assignment.id || assignment._fbKey);
        state.sessionUsers[assignId] = username;
        const assignmentKey = getAssignmentKey(assignment);
        const ownerId = getOwnerId();
        const allowRedo = options.allowRedo === true || canClientResetSubmittedSession(assignId);
        const now = serverTimestampNow();
        let denial = '';

        if (!username || !assignmentKey || !assignId) {
            throw new Error('MC_WORKSPACE_IDENTITY_MISSING');
        }

        const ref = ensureDb().ref(sessionPath(assignId));
        // Refresh the cached session before reacquiring after an interrupted exam.
        await ref.once('value');
        const result = await transactSession(ref, current => {
            denial = '';
            const old = current && typeof current === 'object' ? current : null;
            const oldStatus = text(old?.status || '');

            if (oldStatus === 'submitted' && !allowRedo) {
                denial = 'already-submitted';
                return;
            }



            const resettingRedo = oldStatus === 'submitted' && allowRedo;
            const preservingFinalized = oldStatus === 'finalized' && !resettingRedo;
            const oldAnswers = normalizeAnswers(old?.answers);

            return {
                version: SESSION_VERSION,
                username,
                assignmentId: assignId,
                assignmentKey,
                status: resettingRedo ? 'active' : (preservingFinalized ? 'finalized' : 'active'),
                ownerId: text(old?.ownerId || ownerId),
                ownerLeaseUntil: now + LEASE_MS,
                heartbeatAt: now,
                startedAt: resettingRedo ? now : Number(old?.startedAt || now),
                updatedAt: now,
                answers: resettingRedo ? {} : oldAnswers,
                questionCount: getExamSet(assignment).questions.length,
                examVersionCode: text(old?.examVersionCode || getExamSet(assignment).versionCode || 'Gốc'),
                examVersionIndex: Number(old?.examVersionIndex ?? getExamSet(assignment).versionIndex ?? 0),
                ...(preservingFinalized && old?.finalizedAt ? { finalizedAt: Number(old.finalizedAt) } : {})
            };
        }, undefined, false);

        if (!result.committed) {
            const live = result.snapshot?.val?.();
            if (live &&
                ['active', 'finalized'].includes(text(live.status)) &&
                Number(live.ownerLeaseUntil || 0) > serverTimestampNow()) {
                state.sessions[assignId] = live;

                return live;
            }
            if (!denial) {
                const error = new Error('MC_WORKSPACE_SESSION_RETRY');
                error.code = 'MC_WORKSPACE_SESSION_RETRY';
                throw error;
            }
            const error = new Error('MC_WORKSPACE_ALREADY_SUBMITTED');
            error.code = denial || 'session-state';
            throw error;
        }

        const session = result.snapshot.val() || null;
        state.sessions[assignId] = session;
        if (session?.username) state.sessionUsers[assignId] = text(session.username);
        writeLocalState(assignId, {
            ownerId,
            finalized: session?.status === 'finalized',
            finalizedAt: Number(session?.finalizedAt || 0)
        });

        return session;
    }

    function getWorkspace(assignId) {
        return document.getElementById(`mc-workspace-v2-${text(assignId)}`);
    }

    function closeAllWorkspaces() {
        document.querySelectorAll('.mcw2-overlay').forEach(node => {
            if (node.__mcw2ClockTimer) clearInterval(node.__mcw2ClockTimer);
            node.remove();
        });
        state.currentAssignId = '';
        state.currentReviewKey = '';
        try { document.body.classList.remove('mcw2-open'); } catch (_) {}
    }

    function setSaveStatus(assignId, kind, label) {
        const root = getWorkspace(assignId);
        const el = root?.querySelector('[data-mcw2-save-status]');
        if (!el) return;
        el.dataset.kind = kind || 'idle';
        el.textContent = label || '';
    }

    function saveLegacyDraft(assignId, index, value) {
        try {
            if (typeof window.saveDraft === 'function') {
                window.saveDraft(text(assignId), 'mc', Number(index), text(value));
                return;
            }
        } catch (_) {}

        const key = `draft_${getUsername()}_${text(assignId)}`;
        let draft = { mcAnswers: {}, essay: '' };
        try { draft = JSON.parse(localStorage.getItem(key) || '{}') || draft; } catch (_) {}
        if (!draft.mcAnswers || typeof draft.mcAnswers !== 'object') draft.mcAnswers = {};
        draft.mcAnswers[text(index)] = text(value);
        try { localStorage.setItem(key, JSON.stringify(draft)); } catch (_) {}
    }

    function cancelPendingRemoteSave(assignId) {
        const key = text(assignId);
        if (state.pendingSaves[key]) {
            clearTimeout(state.pendingSaves[key]);
            delete state.pendingSaves[key];
        }
    }

    function enqueueRemoteSave(assignment, answers) {
        const assignId = text(assignment.id || assignment._fbKey);
        const previousSave = state.remoteSaveChains[assignId] || Promise.resolve();
        const task = previousSave
            .catch(() => {})
            .then(() => saveRemoteDraft(assignment, answers));

        state.remoteSaveChains[assignId] = task;
        task.finally(() => {
            if (state.remoteSaveChains[assignId] === task) {
                delete state.remoteSaveChains[assignId];
            }
        }).catch(() => {});
        return task;
    }

    function scheduleRemoteSave(assignment, answers) {
        const assignId = text(assignment.id || assignment._fbKey);
        if (state.finalizing[assignId]) return;
        if (state.pendingSaves[assignId]) clearTimeout(state.pendingSaves[assignId]);
        setSaveStatus(assignId, 'saving', 'Đang lưu…');
        state.pendingSaves[assignId] = setTimeout(() => {
            delete state.pendingSaves[assignId];
            enqueueRemoteSave(assignment, answers).catch(error => {
                const code = text(error?.code || error?.message || '');
                if (code === 'MC_WORKSPACE_DRAFT_TERMINAL') return;
                console.warn('[MC Workspace] remote draft save failed:', error);
                setSaveStatus(assignId, 'offline', 'Chưa đồng bộ · bản nháp vẫn an toàn trên máy');
            });
        }, 450);
    }

    async function prepareDraftSession(assignment) {
        const assignId = text(assignment.id || assignment._fbKey);
        let session = null;

        // Firebase transaction callbacks can see a locally cached null before the
        // authoritative value is available. Pre-read first so a transient local
        // null is never misclassified as a second-tab conflict.
        try {
            session = await readSession(assignId);
        } catch (error) {
            if (navigator.onLine === false) throw error;
            console.warn('[MC Workspace] Không đọc được session trước autosave; thử tải lại phiên:', error);
        }

        const status = text(session?.status);
        if (status === 'finalized' || status === 'submitted') {
            return session;
        }

        if (status === 'active') return session;

        return acquireOwner(assignment, { allowRedo: isRedoActive(assignId) });
    }

    async function saveRemoteDraft(assignment, answers) {
        const assignId = text(assignment.id || assignment._fbKey);
        const normalized = normalizeAnswers(answers);

        if (state.finalizing[assignId]) {
            return state.sessions[assignId] || null;
        }

        let prepared = await prepareDraftSession(assignment);
        if (text(prepared?.status) === 'finalized' || text(prepared?.status) === 'submitted') {
            state.sessions[assignId] = prepared;
            setSaveStatus(assignId, 'saved', 'Phần Trắc nghiệm đã được chốt trên hệ thống');
            return prepared;
        }

        let lastConflict = '';
        for (let attempt = 0; attempt < 2; attempt++) {
            const now = serverTimestampNow();
            const ref = ensureDb().ref(sessionPath(assignId, prepared?.username));
            let conflict = '';

            const result = await transactSession(ref, current => {
                if (!current) {
                    // A first callback with local null is normal in RTDB.
                    // Create/seed ACTIVE rather than aborting the transaction.
                    return buildActiveSessionSeed(
                        assignment,
                        normalized,
                        prepared,
                        now
                    );
                }

                const status = text(current.status);
                if (status === 'finalized' || status === 'submitted') {
                    return current;
                }
                if (status !== 'active') { conflict = 'status'; return; }


                return {
                    ...current,
                    answers: normalized,
                    ownerLeaseUntil: now + LEASE_MS,
                    heartbeatAt: now,
                    updatedAt: now
                };
            }, undefined, false);

            if (result.committed) {
                const saved = result.snapshot.val();
                state.sessions[assignId] = saved;
                if (saved?.username) state.sessionUsers[assignId] = text(saved.username);
                const status = text(saved?.status);
                if (status === 'active') setSaveStatus(assignId, 'saved', 'Đã lưu');
                else setSaveStatus(assignId, 'saved', 'Phần Trắc nghiệm đã được chốt trên hệ thống');
                return saved;
            }

            lastConflict = conflict || 'unknown';


            let live = null;
            try { live = await readSession(assignId); } catch (_) {}
            const liveStatus = text(live?.status);
            if (liveStatus === 'finalized' || liveStatus === 'submitted') {
                state.sessions[assignId] = live;
                setSaveStatus(assignId, 'saved', 'Phần Trắc nghiệm đã được chốt trên hệ thống');
                return live;
            }


        }

        const error = new Error(`MC_WORKSPACE_DRAFT_RETRY_${lastConflict || 'unknown'}`);
        error.code = 'MC_WORKSPACE_DRAFT_RETRY';
        throw error;
    }

    function getAnswersFromWorkspace(assignId) {
        const root = getWorkspace(assignId);
        const result = {};
        root?.querySelectorAll('input[type="radio"][data-mcw2-index]:checked').forEach(input => {
            result[text(input.dataset.mcw2Index)] = text(input.value);
        });
        return result;
    }

    async function getBestDraftAnswers(assignment) {
        const assignId = text(assignment.id || assignment._fbKey);
        const local = readLocalState(assignId);
        let remote = state.sessions[assignId] || null;
        if (!remote && navigator.onLine !== false) {
            try { remote = await readSession(assignId); } catch (_) {}
        }
        return mergeAnswers(remote?.answers, local.answers, local.updatedAt, remote?.updatedAt);
    }

    async function getFinalizedState(assignOrId, options = {}) {
        const assignment = getAssignment(assignOrId);
        if (!assignment || !isMC(assignment)) return { finalized: true, answers: {} };
        const assignId = text(assignment.id || assignment._fbKey);
        const local = readLocalState(assignId);
        let remote = state.sessions[assignId] || null;

        if (navigator.onLine !== false) {
            try { remote = await readSession(assignId); } catch (error) {
                if (options.requireServer) throw error;
            }
        }

        const finalized = remote?.status === 'finalized' || remote?.status === 'submitted';
        // Once Firebase says finalized/submitted, server answers are authoritative.
        // Never let a forged/stale localStorage draft overwrite the finalized snapshot.
        const answers = finalized
            ? normalizeAnswers(remote?.answers)
            : mergeAnswers(remote?.answers, local.answers, local.updatedAt, remote?.updatedAt);
        return { finalized, answers, session: remote, local };
    }

    async function getAnswersForTeacherSubmit(assignOrId, options = {}) {
        const assignment = getAssignment(assignOrId);
        if (!assignment || !isMC(assignment)) return {};
        const auto = options.auto === true;
        const stateInfo = await getFinalizedState(assignment, { requireServer: !auto });

        if (!auto && !stateInfo.finalized) {
            const error = new Error('MC_WORKSPACE_NOT_FINALIZED');
            error.code = 'MC_WORKSPACE_NOT_FINALIZED';
            throw error;
        }
        return normalizeAnswers(stateInfo.answers);
    }

    async function assertOwner(assignOrId, options = {}) {
        const assignment = getAssignment(assignOrId || state.currentAssignId);
        if (!assignment || !isMC(assignment)) return '';
        const allowDraft = options.allowDraft === true;
        const assignId = text(assignment.id || assignment._fbKey);
        // Read the server submission state before continuing.
        let session = await readSession(assignId);

        if (!session) {
            session = await acquireOwner(assignment, { allowRedo: isRedoActive(assignId) });
        }
        if (!allowDraft && text(session?.status) !== 'finalized' && text(session?.status) !== 'submitted') {
            throw new Error('MC_WORKSPACE_NOT_FINALIZED');
        }
        return text(session?.ownerId || getOwnerId());
    }

    async function ensureFinalizeSession(assignment) {
        const assignId = text(assignment.id || assignment._fbKey);
        let session = null;

        // Always re-read immediately before finalization. This removes stale
        // in-memory assumptions and also repairs a session that disappeared
        // because the page reconnected between opening and submitting.
        try {
            session = await readSession(assignId);
        } catch (error) {
            if (navigator.onLine === false) throw error;
            console.warn('[MC Workspace] Không đọc được session trước finalize, thử tải lại phiên:', error);
        }

        const status = text(session?.status);

        if (status === 'finalized' || status === 'submitted') {
            return session;
        }
        if (status === 'active') {
            return session;
        }

        session = await acquireOwner(assignment, { allowRedo: isRedoActive(assignId) });
        return session;
    }

    async function finalizeMultipleChoice(assignOrId) {
        const assignment = getAssignment(assignOrId);
        if (!assignment || !isMC(assignment)) return false;
        const assignId = text(assignment.id || assignment._fbKey);
        const examSet = getExamSet(assignment);
        const answers = getAnswersFromWorkspace(assignId);
        const missing = [];

        examSet.questions.forEach((_, index) => {
            if (!answers[text(index)]) missing.push(index);
        });

        if (missing.length) {
            const root = getWorkspace(assignId);
            root?.querySelectorAll('.mcw2-question').forEach(node => node.classList.remove('is-missing'));
            missing.forEach(index => root?.querySelector(`[data-mcw2-question="${index}"]`)?.classList.add('is-missing'));
            const first = missing[0];
            scrollToQuestion(root, first);
            root?.querySelector(`input[data-mcw2-index="${first}"]`)?.focus();
            (await AppDialog.alert(`⚠️ Bạn chưa làm ${missing.length} câu: ${missing.map(i => `Câu ${i + 1}`).join(', ')}.\n\nHệ thống chưa nộp phần Trắc nghiệm. Hãy hoàn thành các câu còn thiếu.`));
            return false;
        }

        if (navigator.onLine === false) {
            (await AppDialog.alert('⚠️ Hiện đang mất mạng. Bản nháp vẫn được giữ trên máy nhưng chưa thể nộp phần Trắc nghiệm cho hệ thống. Hãy kết nối lại rồi bấm Nộp trắc nghiệm.'));
            setSaveStatus(assignId, 'offline', 'Ngoại tuyến · bản nháp vẫn lưu trên máy');
            return false;
        }

        if (!await AppDialog.confirm('Sau khi nộp trắc nghiệm, bạn không thể sửa đáp án. Bạn có chắc muốn nộp?')) return false;

        cancelPendingRemoteSave(assignId);
        state.finalizing[assignId] = true;

        const ownerId = getOwnerId();
        const normalizedAnswers = normalizeAnswers(answers);
        let result = null;
        let conflict = '';

        try {
            let prepared = await ensureFinalizeSession(assignment);
            if (text(prepared?.status) === 'submitted') {
                throw new Error('MC_WORKSPACE_FINALIZE_CONFLICT_submitted');
            }

            // Firebase retries with stored state; finalized submissions remain immutable.
            for (let attempt = 0; attempt < 3; attempt++) {
                conflict = '';
                const now = serverTimestampNow();
                const ref = ensureDb().ref(sessionPath(assignId, prepared?.username));

                result = await transactSession(ref, current => {
                    if (!current) {
                        return buildActiveSessionSeed(
                            assignment,
                            normalizedAnswers,
                            prepared,
                            now
                        );
                    }
                    if (text(current.status) === 'submitted') { conflict = 'submitted'; return; }
                    if (text(current.status) === 'finalized') return current;

                    if (text(current.status) !== 'active') { conflict = 'status'; return; }
                    return {
                        ...current,
                        status: 'finalized',
                        answers: normalizedAnswers,
                        finalizedAt: now,
                        ownerLeaseUntil: now + LEASE_MS,
                        heartbeatAt: now,
                        updatedAt: now
                    };
                }, undefined, false);

                if (result.committed) {
                    const committedSession = result.snapshot.val() || null;
                    state.sessions[assignId] = committedSession;
                    if (committedSession?.username) {
                        state.sessionUsers[assignId] = text(committedSession.username);
                    }
                    const committedStatus = text(committedSession?.status);
                    if (committedStatus === 'finalized') break;
                    if (committedStatus === 'submitted') {
                        conflict = 'submitted';
                        break;
                    }
                    // A null seed legitimately commits ACTIVE when the server
                    // record was truly absent. Run one more transaction to
                    // transition ACTIVE -> FINALIZED.
                    if (committedStatus === 'active') {
                        prepared = committedSession;
                        continue;
                    }
                }

                break;
            }

            if (!result?.committed || text(result.snapshot?.val()?.status) !== 'finalized') {

                throw new Error(`MC_WORKSPACE_FINALIZE_CONFLICT_${conflict || 'UNKNOWN'}`);
            }
        } finally {
            delete state.finalizing[assignId];
        }

        const session = result.snapshot.val();
        state.sessions[assignId] = session;
        if (session?.username) state.sessionUsers[assignId] = text(session.username);
        writeLocalState(assignId, {
            answers: normalizeAnswers(session?.answers || normalizedAnswers),
            finalized: true,
            finalizedAt: Number(session?.finalizedAt || Date.now()),
            ownerId
        });

        const root = getWorkspace(assignId);
        root?.querySelectorAll('input[type="radio"]').forEach(input => { input.disabled = true; });
        const button = root?.querySelector('[data-mcw2-finalize]');
        if (button) {
            button.disabled = true;
            button.textContent = '✓ Đã nộp trắc nghiệm';
            button.classList.add('is-finalized');
        }
        setSaveStatus(assignId, 'saved', 'Đã nộp phần Trắc nghiệm cho hệ thống');
        refreshLauncher(assignId, true);
        return true;
    }

    async function markTeacherSubmitted(assignOrId, submissionKey) {
        const assignment = getAssignment(assignOrId);
        if (!assignment || !isMC(assignment)) return;
        const assignId = text(assignment.id || assignment._fbKey);
        const now = Date.now();

        try {
            const ref = ensureDb().ref(sessionPath(assignId));
            await transactSession(ref, current => {
                if (!current) return;
                if (
                    text(current.status) !== 'active' &&
                    text(current.status) !== 'finalized' &&
                    text(current.status) !== 'submitted'
                ) return;
                return {
                    ...current,
                    status: 'submitted',
                    submissionKey: text(submissionKey),
                    submittedAt: now,
                    ownerLeaseUntil: now,
                    heartbeatAt: now,
                    updatedAt: now
                };
            }, undefined, false);
        } catch (error) {
            // Submission to teacher already succeeded. Do not undo it because cleanup metadata failed.
            console.warn('[MC Workspace] Không đánh dấu được session submitted:', error);
        }

        removeLocalState(assignId);
        closeWorkspace(assignId);
    }

    function buildTimeBox(assignment, mode) {
        const type = text(assignment?.assessmentType);
        if (type === 'thi' && assignment?.examTimeLimitEnabled === true && Number(assignment?.examTimeLimitMinutes) > 0) {
            return `
                <div class="mcw2-timebox is-exam-time" data-mcw2-exam-clock>
                    <span>THỜI GIAN TOÀN BÀI CÒN</span>
                    <strong data-mcw2-time-value>--:--</strong>
                    <small>Hết giờ hệ thống thu toàn bộ bài</small>
                </div>`;
        }
        return `
            <div class="mcw2-timebox">
                <span>HẠN NỘP</span>
                <strong>${escapeHTML(assignment?.endDate || 'Không giới hạn')}</strong>
                <small>${mode === 'review' ? 'Bài đã nộp' : 'Không phải đồng hồ Trắc nghiệm'}</small>
            </div>`;
    }

    function formatRemaining(ms) {
        const seconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0
            ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function startWorkspaceClock(root, assignment) {
        if (!root?.querySelector('[data-mcw2-exam-clock]')) return;
        const assignId = text(assignment.id || assignment._fbKey);
        let timer = null;
        const update = () => {
            let deadline = 0;
            try {
                const session = window.examRecoveryManager?.getAuthoritativeSession?.(assignId) || {};
                deadline = Number(session.deadlineAt || 0);
                if (!deadline && typeof window.getExamTimeLimitDeadline === 'function') {
                    deadline = Number(window.getExamTimeLimitDeadline(assignment, session) || 0);
                }
            } catch (_) {}
            const value = root.querySelector('[data-mcw2-time-value]');
            if (!value) return;
            if (!deadline) {
                value.textContent = `${Number(assignment.examTimeLimitMinutes)} phút`;
                return;
            }
            value.textContent = formatRemaining(deadline - Date.now());
            if (deadline <= Date.now()) {
                clearInterval(timer);
                root.querySelectorAll('input, button[data-mcw2-finalize]').forEach(el => { el.disabled = true; });
                const lock = root.querySelector('[data-mcw2-lock-message]');
                if (lock) {
                    lock.hidden = false;
                    lock.textContent = '⏱️ Đã hết thời gian toàn bài. Hệ thống đang thu toàn bộ bài theo cơ chế bài thi.';
                }
            }
        };
        update();
        timer = setInterval(update, 1000);
        root.__mcw2ClockTimer = timer;
    }

    function questionHTML(question, index, selected, reviewMode) {
        const answer = text(selected || '');
        const correct = text(question?.correct || '');
        const keys = ['A', 'B', 'C', 'D'];
        const options = keys.map(key => {
            const chosen = answer === key;
            const isCorrect = correct === key;
            let classes = 'mcw2-option';
            if (reviewMode) {
                if (chosen && isCorrect) classes += ' is-selected-correct';
                else if (chosen && !isCorrect) classes += ' is-selected-wrong';
                else if (isCorrect) classes += ' is-correct-answer';
            } else if (chosen) {
                classes += ' is-selected';
            }
            return `
                <label class="${classes}">
                    <input
                        type="radio"
                        name="mcw2-q-${index}"
                        value="${key}"
                        data-mcw2-index="${index}"
                        ${chosen ? 'checked' : ''}
                        ${reviewMode ? 'disabled' : ''}
                    >
                    <span class="mcw2-option-letter">${key}</span>
                    <span class="mcw2-option-text">${safeRich(question?.[key] || '')}</span>
                    ${reviewMode && isCorrect ? '<span class="mcw2-answer-mark">✓ Đáp án đúng</span>' : ''}
                </label>`;
        }).join('');

        let result = '';
        if (reviewMode) {
            if (!answer) result = '<span class="mcw2-result-chip is-empty">Chưa làm</span>';
            else if (answer === correct) result = '<span class="mcw2-result-chip is-correct">Đúng</span>';
            else result = `<span class="mcw2-result-chip is-wrong">Sai · chọn ${escapeHTML(answer)}</span>`;
        }

        return `
            <section class="mcw2-question" data-mcw2-question="${index}">
                <div class="mcw2-question-head">
                    <h3><em>Câu ${index + 1}:</em> ${safeRich(question?.qText || '')}</h3>
                    ${result}
                </div>
                <div class="mcw2-options">${options}</div>
            </section>`;
    }

    function navHTML(questions, answers, reviewMode) {
        return questions.map((question, index) => {
            const selected = text(answers?.[index] ?? answers?.[text(index)] ?? '');
            const correct = text(question?.correct || '');
            let cls = 'mcw2-nav-btn';
            if (reviewMode) {
                if (!selected) cls += ' is-empty';
                else if (selected === correct) cls += ' is-correct';
                else cls += ' is-wrong';
            } else if (selected) cls += ' is-answered';
            return `<button type="button" class="${cls}" data-mcw2-nav="${index}">${index + 1}</button>`;
        }).join('');
    }

    function buildShell({ assignment, examSet, answers, reviewMode, title, subtitle, finalized }) {
        const assignId = text(assignment.id || assignment._fbKey);
        const questions = examSet.questions || [];
        const answered = questions.reduce((count, _, index) => count + (answers?.[index] || answers?.[text(index)] ? 1 : 0), 0);
        const questionsMarkup = questions.map((q, i) => questionHTML(q, i, answers?.[i] ?? answers?.[text(i)], reviewMode)).join('');
        const navMarkup = navHTML(questions, answers, reviewMode);
        const submit = reviewMode ? '' : `
            <button type="button" class="mcw2-submit ${finalized ? 'is-finalized' : ''}" data-mcw2-finalize ${finalized ? 'disabled' : ''}>
                ${finalized ? '✓ Đã nộp trắc nghiệm' : 'Nộp trắc nghiệm'}
            </button>`;

        return `
            <div class="mcw2-shell" style="--mcw2-zoom:${state.zoom}">
                <header class="mcw2-header">
                    <button type="button" class="mcw2-power" data-mcw2-close aria-label="Quay lại">⏻</button>
                    <div class="mcw2-heading">
                        <strong>${escapeHTML(title || assignment.title || 'Phần Trắc nghiệm')}</strong>
                        <span>${escapeHTML(subtitle || '')}</span>
                    </div>
                    <div class="mcw2-header-actions">
                        ${buildTimeBox(assignment, reviewMode ? 'review' : 'work')}
                        <button type="button" class="mcw2-zoom" data-mcw2-zoom="plus" aria-label="Phóng to">＋</button>
                        <button type="button" class="mcw2-zoom" data-mcw2-zoom="minus" aria-label="Thu nhỏ">−</button>
                        ${submit}
                    </div>
                </header>
                <div class="mcw2-lock-message" data-mcw2-lock-message hidden></div>
                <div class="mcw2-body">
                    <main class="mcw2-main">
                        ${examSet.randomized ? `<div class="mcw2-version">🎲 Mã đề ${escapeHTML(examSet.versionCode)} · ${questions.length} câu</div>` : ''}
                        <div class="mcw2-progress" data-mcw2-progress>Đã trả lời ${answered}/${questions.length} câu</div>
                        <div class="mcw2-question-list">${questionsMarkup}</div>
                    </main>
                    <aside class="mcw2-sidebar">
                        <div class="mcw2-sidebar-title">Danh sách câu hỏi</div>
                        <div class="mcw2-sidebar-section">
                            <em>Phần 1:</em>
                            <div class="mcw2-nav-grid" data-mcw2-nav-grid>${navMarkup}</div>
                        </div>
                        <div class="mcw2-sidebar-legend">
                            ${reviewMode
                                ? '<span><i class="ok"></i> Đúng</span><span><i class="bad"></i> Sai</span><span><i class="empty"></i> Chưa làm</span>'
                                : '<span><i class="done"></i> Đã làm</span><span><i class="empty"></i> Chưa làm</span>'}
                        </div>
                        ${reviewMode ? '' : '<div class="mcw2-save-status" data-mcw2-save-status data-kind="saved">Bản nháp được tự động lưu</div>'}
                        ${!reviewMode && assignment.videoSummaryEnabled && text(assignment.videoSummary).trim() ? `<button type="button" class="mcw2-summary-toggle" data-mcw2-summary-toggle aria-expanded="false">⌄ Tóm tắt video</button><section class="mcw2-summary" data-mcw2-summary hidden></section>` : ''}
                    </aside>
                </div>
            </div>`;
    }

    function scrollToQuestion(root, index) {
        const question = root?.querySelector(`[data-mcw2-question="${Number(index)}"]`);
        const scroller = root?.querySelector(matchMedia('(max-width:760px)').matches ? '.mcw2-body' : '.mcw2-main');
        if (!question || !scroller) return;
        const top = scroller.scrollTop + question.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 10;
        scroller.scrollTo({ top, behavior: 'smooth' });
    }

    function installShellEvents(root, assignment, examSet, answers, reviewMode) {
        const assignId = text(assignment.id || assignment._fbKey);
        root.querySelector('[data-mcw2-close]')?.addEventListener('click', () => closeWorkspace(assignId));
        root.querySelectorAll('[data-mcw2-nav]').forEach(button => {
            button.addEventListener('click', () => {
                const index = Number(button.dataset.mcw2Nav);
                scrollToQuestion(root, index);
            });
        });
        root.querySelectorAll('[data-mcw2-zoom]').forEach(button => {
            button.addEventListener('click', () => {
                const delta = button.dataset.mcw2Zoom === 'plus' ? 0.08 : -0.08;
                state.zoom = Math.min(1.35, Math.max(0.78, state.zoom + delta));
                root.querySelector('.mcw2-shell')?.style.setProperty('--mcw2-zoom', String(state.zoom));
            });
        });

        if (!reviewMode) {
            root.querySelector('[data-mcw2-finalize]')?.addEventListener('click', async event => {
                const button = event.currentTarget;
                button.disabled = true;
                const old = button.textContent;
                button.textContent = 'Đang xác nhận…';
                try {
                    const ok = await finalizeMultipleChoice(assignment);
                    if (!ok && !button.classList.contains('is-finalized')) {
                        button.disabled = false;
                        button.textContent = old;
                    }
                } catch (error) {
                    console.error('[MC Workspace] finalize failed:', error);
                    if (!button.classList.contains('is-finalized')) {
                        button.disabled = false;
                        button.textContent = old;
                    }
                    const message = text(error?.message || '');
                    if (message.includes('CONFLICT_submitted')) {
                        (await AppDialog.alert('ℹ️ Phần Trắc nghiệm/bài này đã được nộp trước đó. Hệ thống không tạo lần nộp trùng.'));
                    } else {
                        (await AppDialog.alert('⚠️ Không thể nộp phần Trắc nghiệm cho hệ thống lúc này. Bản nháp vẫn được giữ. Hệ thống đã thử khôi phục phiên một lần; hãy kiểm tra kết nối rồi thử lại.'));
                    }
                }
            });

            root.querySelectorAll('input[type="radio"][data-mcw2-index]').forEach(input => {
                input.addEventListener('change', () => {
                    const index = Number(input.dataset.mcw2Index);
                    input.closest('.mcw2-question')?.querySelectorAll('.mcw2-option').forEach(option => {
                        option.classList.toggle('is-selected', !!option.querySelector('input:checked'));
                    });
                    saveLegacyDraft(assignId, index, input.value);
                    const currentAnswers = getAnswersFromWorkspace(assignId);
                    writeLocalState(assignId, { answers: currentAnswers, finalized: false, ownerId: getOwnerId() });
                    root.querySelector(`[data-mcw2-question="${index}"]`)?.classList.remove('is-missing');
                    updateProgress(root, examSet.questions, currentAnswers, false);
                    scheduleRemoteSave(assignment, currentAnswers);
                });
            });
        }

        const summaryToggle = root.querySelector('[data-mcw2-summary-toggle]');
        summaryToggle?.addEventListener('click', () => {
            const panel = root.querySelector('[data-mcw2-summary]');
            const required = Number(assignment.watchCondition) || 0;
            const source = document.getElementById('video-summary-toggle-' + assignId);
            const unlocked = required <= 0 || (source && !source.disabled);
            const opening = panel.hidden;
            panel.textContent = unlocked ? text(assignment.videoSummary) : 'Bạn cần xem đủ thời lượng video yêu cầu để mở tóm tắt.';
            panel.hidden = !opening;
            summaryToggle.setAttribute('aria-expanded', String(opening));
            summaryToggle.textContent = opening ? '⌃ Thu gọn tóm tắt' : '⌄ Tóm tắt video';
            if (opening && !matchMedia('(prefers-reduced-motion: reduce)').matches) panel.animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:200});
        });
        startWorkspaceClock(root, assignment);
        try { window.MathJax?.typesetPromise?.([root]); } catch (_) {}
    }

    function updateProgress(root, questions, answers, reviewMode) {
        const count = questions.reduce((sum, _, index) => sum + (answers?.[index] || answers?.[text(index)] ? 1 : 0), 0);
        const progress = root.querySelector('[data-mcw2-progress]');
        if (progress) progress.textContent = `Đã trả lời ${count}/${questions.length} câu`;
        root.querySelectorAll('[data-mcw2-nav]').forEach(button => {
            const index = button.dataset.mcw2Nav;
            button.classList.toggle('is-answered', !!answers[index]);
        });
    }

    async function openStudent(assignOrId) {
        const assignment = getAssignment(assignOrId);
        if (!assignment || !isMC(assignment)) return;
        const assignId = text(assignment.id || assignment._fbKey);

        if (assignment.assessmentType === 'thi' && text(window.currentActiveExamId || '') !== assignId) {
            (await AppDialog.alert('⚠️ Đây là bài thi. Hãy bấm “Bắt đầu bài thi” trước; giới hạn thời gian áp dụng cho toàn bộ bài, không chỉ phần Trắc nghiệm.'));
            return;
        }

        closeAllWorkspaces();
        let session;
        if (assignment.assessmentType === 'thi' && !document.fullscreenElement) {
            await window.handleExamInterruption?.('fullscreen');
            return;
        }
        try {
            session = await acquireOwner(assignment, { allowRedo: isRedoActive(assignId) });
        } catch (error) {

            if (navigator.onLine === false) {
                (await AppDialog.alert('📴 Không thể mở một phiên làm Trắc nghiệm mới khi đang ngoại tuyến vì chưa thể tải tiến độ từ máy chủ. Nếu bạn đã làm dở trước đó, bản nháp vẫn được giữ và sẽ khôi phục khi kết nối lại.'));
                return;
            }
            throw error;
        }

        const local = readLocalState(assignId);
        if (assignment.assessmentType === 'thi' &&
            (!document.fullscreenElement || text(window.currentActiveExamId || '') !== assignId)) return;
        const examSet = getExamSet(assignment);
        const answers = mergeAnswers(session?.answers, local.answers, local.updatedAt, session?.updatedAt);
        const finalized = text(session?.status) === 'finalized';
        const user = getUser();
        const root = document.createElement('section');
        root.id = `mc-workspace-v2-${assignId}`;
        root.className = 'mcw2-overlay ui-theme-immune';
        root.dataset.assignmentId = assignId;
        root.innerHTML = buildShell({
            assignment,
            examSet,
            answers,
            reviewMode: false,
            title: assignment.title,
            subtitle: `${user.name || user.username || 'Học sinh'} · Phần Trắc nghiệm`,
            finalized
        });
        document.body.appendChild(root);
        document.body.classList.add('mcw2-open');
        state.currentAssignId = assignId;
        installShellEvents(root, assignment, examSet, answers, false);
        if (finalized) {
            root.querySelectorAll('input[type="radio"]').forEach(input => { input.disabled = true; });
            setSaveStatus(assignId, 'saved', 'Đã nộp phần Trắc nghiệm cho hệ thống · dùng nút Nộp bài bên ngoài để gửi cho giáo viên');
        }
    }

    function closeWorkspace(assignId) {
        const root = getWorkspace(assignId);
        if (root?.__mcw2ClockTimer) clearInterval(root.__mcw2ClockTimer);
        root?.remove();
        if (!document.querySelector('.mcw2-overlay')) document.body.classList.remove('mcw2-open');
        if (state.currentAssignId === text(assignId)) state.currentAssignId = '';
    }

    function scoreInfo(submission, assignment, questions) {
        const answers = normalizeAnswers(submission?.mcAnswers || {});
        if (!questions.length) return { label: 'Điểm TN: —', correct: 0, total: 0 };
        let correct = 0;
        questions.forEach((q, i) => {
            if (text(answers[i] || answers[text(i)]) && text(answers[i] || answers[text(i)]) === text(q?.correct)) correct++;
        });
        const scale10 = Math.round((correct / questions.length) * 100) / 10;
        if (assignment?.assessmentType === 'ket_hop' || assignment?.assessmentType === 'thi') {
            const weight = Number(assignment?.mcWeight ?? 5);
            const weighted = Math.round((correct / questions.length) * weight * 100) / 100;
            return { label: `Điểm TN: ${weighted}/${weight}`, correct, total: questions.length, scale10 };
        }
        return { label: `Điểm TN: ${scale10}/10`, correct, total: questions.length, scale10 };
    }

    function registerReview(submission, assignment) {
        const key = `mcw2-review-${++state.reviewCounter}-${text(assignment?.id)}-${text(submission?._fbKey || submission?.id || '')}`;
        reviewRegistry.set(key, { submission, assignment });
        return key;
    }

    function reviewButton(submission, assignment) {
        if (!assignment || !isMC(assignment)) return '';
        const examSet = getExamSet(assignment, submission);
        if (!examSet.questions.length) return '';
        const key = registerReview(submission || {}, assignment);
        const score = scoreInfo(submission || {}, assignment, examSet.questions);
        return `
            <div class="mcw2-review-action-row">
                <button type="button" class="mcw2-review-button" data-mcw2-review-open="${escapeHTML(key)}">👁️ Xem đáp án</button>
                <span class="mcw2-score-badge">${escapeHTML(score.label)}</span>
            </div>`;
    }

    function openReview(key) {
        const entry = reviewRegistry.get(text(key));
        if (!entry) return;
        const { submission, assignment } = entry;
        closeAllWorkspaces();
        const examSet = getExamSet(assignment, submission);
        const answers = normalizeAnswers(submission?.mcAnswers || {});
        const score = scoreInfo(submission || {}, assignment, examSet.questions);
        const root = document.createElement('section');
        const id = `review-${text(assignment.id || assignment._fbKey)}-${Date.now()}`;
        root.id = `mc-workspace-v2-${id}`;
        root.className = 'mcw2-overlay is-review';
        root.innerHTML = buildShell({
            assignment,
            examSet,
            answers,
            reviewMode: true,
            title: assignment.title,
            subtitle: `${submission?.studentName || submission?.studentUsername || 'Học sinh'} · ${score.label}`,
            finalized: true
        });
        document.body.appendChild(root);
        document.body.classList.add('mcw2-open');
        state.currentReviewKey = key;
        installShellEvents(root, assignment, examSet, answers, true);
        // Close handler generated with assignment id would not find this review root, so bind directly.
        root.querySelector('[data-mcw2-close]')?.addEventListener('click', () => {
            if (root.__mcw2ClockTimer) clearInterval(root.__mcw2ClockTimer);
            root.remove();
            if (!document.querySelector('.mcw2-overlay')) document.body.classList.remove('mcw2-open');
        }, { once: true });
    }

    function refreshLauncher(assignId, finalized) {
        document.querySelectorAll(`[data-mcw2-launcher="${CSS.escape(text(assignId))}"]`).forEach(button => {
            button.textContent = finalized ? '✓ Xem lại trắc nghiệm' : 'Làm trắc nghiệm →';
            button.classList.toggle('is-finalized', !!finalized);
        });
        document.querySelectorAll(`[data-mcw2-status="${CSS.escape(text(assignId))}"]`).forEach(el => {
            el.textContent = finalized
                ? 'Đã nộp phần Trắc nghiệm cho hệ thống. Muốn gửi bài cho giáo viên, hãy bấm “Nộp bài tập ngay” ở bên ngoài.'
                : 'Mở cửa sổ toàn trang để làm phần Trắc nghiệm. Bản nháp được tự động lưu.';
        });
    }

    function launcherHTML(assignment) {
        const assignId = text(assignment?.id || assignment?._fbKey);
        const local = readLocalState(assignId);
        const finalized = local.finalized === true;
        const type = text(assignment?.assessmentType);
        let timeLabel = `📅 Hạn nộp: <strong>${escapeHTML(assignment?.endDate || 'Không giới hạn')}</strong>`;
        if (type === 'thi' && assignment?.examTimeLimitEnabled === true && Number(assignment?.examTimeLimitMinutes) > 0) {
            timeLabel = `⏱️ Giới hạn thời gian <strong>TOÀN BÀI</strong>: <strong>${Number(assignment.examTimeLimitMinutes)} phút</strong>`;
        }
        return `
            <section class="mcw2-launch-card">
                <div class="mcw2-launch-icon">📝</div>
                <div class="mcw2-launch-copy">
                    <strong>Phần Trắc nghiệm</strong>
                    <span data-mcw2-status="${escapeHTML(assignId)}">${finalized
                        ? 'Đã nộp phần Trắc nghiệm cho hệ thống. Muốn gửi bài cho giáo viên, hãy bấm “Nộp bài tập ngay” ở bên ngoài.'
                        : 'Mở cửa sổ toàn trang để làm phần Trắc nghiệm. Bản nháp được tự động lưu.'}</span>
                    <small>${timeLabel}</small>
                </div>
                <button type="button" class="mcw2-launch-button ${finalized ? 'is-finalized' : ''}" data-mcw2-launcher="${escapeHTML(assignId)}">
                    ${finalized ? '✓ Xem lại trắc nghiệm' : 'Làm trắc nghiệm →'}
                </button>
            </section>`;
    }

    function wrap(assignment, _legacyQuizHTML) {
        if (!isMC(assignment)) {
            return _legacyQuizHTML;
        }
        return launcherHTML(assignment);
    }

    function delegatedClick(event) {
        const launcher = event.target.closest?.('[data-mcw2-launcher]');
        if (launcher) {
            event.preventDefault();
            openStudent(launcher.dataset.mcw2Launcher).catch(error => {
                console.error('[MC Workspace] open failed:', error);
                AppDialog.notify('⚠️ Không thể mở phần Trắc nghiệm lúc này. Vui lòng tải lại trang và thử lại.');
            });
            return;
        }
        const review = event.target.closest?.('[data-mcw2-review-open]');
        if (review) {
            event.preventDefault();
            openReview(review.dataset.mcw2ReviewOpen);
        }
    }

    if (window.location?.protocol === 'file:') {
        console.warn(
            '[MC Workspace] Website đang chạy bằng file://. Chrome cô lập mỗi file thành unique origin; ' +
            'Firebase/iframe có thể phát sinh lỗi origin. Hãy chạy project qua http://localhost.'
        );
    }

    document.addEventListener('click', delegatedClick);
    window.addEventListener('online', () => {
        if (!state.currentAssignId) return;
        const assignment = getAssignment(state.currentAssignId);
        if (!assignment) return;
        acquireOwner(assignment, { allowRedo: isRedoActive(state.currentAssignId) })
            .then(() => {
                const answers = getAnswersFromWorkspace(state.currentAssignId);
                return saveRemoteDraft(assignment, answers);
            })
            .catch(error => {
                console.warn('[MC Workspace] Không thể đồng bộ lại phiên sau reconnect:', error);
                const code = text(error?.code || error?.message || '');

                    setSaveStatus(state.currentAssignId, 'offline', 'Kết nối đã trở lại nhưng chưa đồng bộ được · bản nháp vẫn an toàn trên máy');
            });
    });
    window.addEventListener('offline', () => {
        if (state.currentAssignId) setSaveStatus(state.currentAssignId, 'offline', 'Ngoại tuyến · tiếp tục lưu nháp trên máy');
    });

    const api = {
        __build: BUILD,
        wrap,
        reviewButton,
        openStudent,
        openReview,
        close: closeWorkspace,
        finalizeMultipleChoice,
        getFinalizedState,
        getAnswersForTeacherSubmit,
        getBestDraftAnswers,
        assertOwner,
        acquireOwner,
        markTeacherSubmitted,
        hasMultipleChoice: isMC,
        getScoreInfo: scoreInfo,
        getOwnerId
    };

    window.MCWorkspace = api;
    console.info('[MC Workspace V2]', BUILD);
})();
