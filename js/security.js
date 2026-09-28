// =========================================================================
// SECURITY GUARD — STUDENT DEVTOOLS GUARD / TEACHER-SAFE v4.2.0
// =========================================================================
// Mục tiêu:
// - Học sinh: chặn chuột phải, F12, Ctrl+Shift+I/J/C, Ctrl+U.
// - Học sinh: phát hiện DevTools dạng dock mở bằng menu hoặc đã mở trước khi vào trang.
// - Giáo viên: được dùng DevTools sau khi teacher.js xác minh Firebase UID + role=teacher.
// - Tránh debugger loop / timer nặng; dùng heuristic kích thước có debounce nhiều mẫu.
// - Đây chỉ là lớp bảo vệ giao diện. Quyền dữ liệu vẫn phải do Firebase Rules/Auth bảo vệ.
//
// Lưu ý kỹ thuật:
// Browser không cung cấp API chính thức để website biết DevTools có mở hay không.
// Vì vậy không thể đảm bảo 100% với DevTools mở ở cửa sổ tách rời hoặc người dùng cố tình bypass JS.
// =========================================================================

(function () {
    'use strict';

    const VERSION = '4.2.0-devtools-guard';

    if (window.SecurityGuard?.version === VERSION) {
        return;
    }

    const CONFIG = Object.freeze({
        dimensionThreshold: 160,
        requiredConsecutiveHits: 3,
        probeIntervalMs: 280,
        startupGraceMs: 900,
        resizeProbeDelayMs: 80
    });

    const state = {
        startedAt: Date.now(),
        dimensionHits: 0,
        devtoolsLikelyOpen: false,
        lastReason: '',
        lastMetrics: null,
        intervalId: null,
        resizeTimer: null
    };

    function resolvePageRole() {
        const explicitRole = String(
            window.__APP_PAGE_ROLE__ ||
            document.documentElement?.dataset?.appRole ||
            document.body?.dataset?.appRole ||
            ''
        ).trim().toLowerCase();

        if (explicitRole === 'teacher' || explicitRole === 'student') {
            return explicitRole;
        }

        const title = String(document.title || '').toLowerCase();

        if (
            title.includes('giáo viên') ||
            document.querySelector('#teacherGameMainNav') ||
            document.querySelector('#tab-manage-students')
        ) {
            return 'teacher';
        }

        if (
            title.includes('học sinh') ||
            document.querySelector('#studentName') ||
            document.querySelector('#tab-game')
        ) {
            return 'student';
        }

        return 'unknown';
    }

    function getTeacherVerificationState() {
        if (window.isVerifiedTeacher === true) {
            return 'verified';
        }

        return String(
            window.__teacherSecurityVerificationState || 'pending'
        ).trim().toLowerCase();
    }

    function isVerifiedTeacher() {
        return (
            resolvePageRole() === 'teacher' &&
            window.isVerifiedTeacher === true &&
            getTeacherVerificationState() === 'verified'
        );
    }

    function isTeacherVerificationInProgress() {
        if (resolvePageRole() !== 'teacher') {
            return false;
        }

        const verificationState = getTeacherVerificationState();

        return (
            verificationState === 'pending' ||
            verificationState === 'error' ||
            verificationState === 'network-error'
        );
    }

    function isStudentPage() {
        return resolvePageRole() === 'student';
    }

    function shouldStrictlyProtectStudent() {
        return isStudentPage() && !isVerifiedTeacher();
    }

    function clearPageAndExit() {
        try {
            if (state.intervalId) {
                clearInterval(state.intervalId);
                state.intervalId = null;
            }

            document.documentElement.innerHTML = '';
        } catch (_) {
            try {
                document.head.innerHTML = '';
                document.body.innerHTML = '';
            } catch (_) {}
        }

        try {
            window.stop();
        } catch (_) {}

        window.location.replace('about:blank');
    }

    function kickUser(reason = 'security-policy') {
        if (isVerifiedTeacher()) {
            return false;
        }

        if (isTeacherVerificationInProgress()) {
            console.warn(
                '[SecurityGuard] Bỏ qua cưỡng chế trong lúc Giáo viên đang chờ xác thực:',
                reason
            );
            return false;
        }

        // DevTools detector mới chỉ cưỡng chế trên trang Học sinh.
        if (reason.startsWith('devtools-') && !shouldStrictlyProtectStudent()) {
            return false;
        }

        state.lastReason = reason;
        clearPageAndExit();
        return true;
    }

    function isBlockedShortcut(event) {
        const key = String(event.key || '').toLowerCase();

        return (
            event.key === 'F12' ||
            event.keyCode === 123 ||
            (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
            (event.ctrlKey && key === 'u')
        );
    }

    function collectWindowMetrics() {
        const outerWidth = Number(window.outerWidth) || 0;
        const outerHeight = Number(window.outerHeight) || 0;
        const innerWidth = Number(window.innerWidth) || 0;
        const innerHeight = Number(window.innerHeight) || 0;

        const widthGap = Math.max(0, outerWidth - innerWidth);
        const heightGap = Math.max(0, outerHeight - innerHeight);

        return {
            outerWidth,
            outerHeight,
            innerWidth,
            innerHeight,
            widthGap,
            heightGap,
            threshold: CONFIG.dimensionThreshold
        };
    }

    function hasDockedDevToolsDimensionSignal(metrics) {
        if (!metrics) return false;

        // Không đánh giá cửa sổ chưa có kích thước hợp lệ / quá nhỏ.
        if (
            metrics.outerWidth < 320 ||
            metrics.outerHeight < 320 ||
            metrics.innerWidth <= 0 ||
            metrics.innerHeight <= 0
        ) {
            return false;
        }

        return (
            metrics.widthGap >= CONFIG.dimensionThreshold ||
            metrics.heightGap >= CONFIG.dimensionThreshold
        );
    }

    function resetDevToolsSignal() {
        state.dimensionHits = 0;
        state.devtoolsLikelyOpen = false;
    }

    function probeDevTools(reason = 'interval') {
        // Giáo viên và các trang không phải Học sinh không chạy detector cưỡng chế.
        if (!shouldStrictlyProtectStudent()) {
            resetDevToolsSignal();
            return false;
        }

        if (Date.now() - state.startedAt < CONFIG.startupGraceMs) {
            return false;
        }

        const metrics = collectWindowMetrics();
        state.lastMetrics = metrics;

        if (hasDockedDevToolsDimensionSignal(metrics)) {
            state.dimensionHits += 1;
        } else {
            state.dimensionHits = 0;
            state.devtoolsLikelyOpen = false;
            return false;
        }

        if (state.dimensionHits < CONFIG.requiredConsecutiveHits) {
            return false;
        }

        state.devtoolsLikelyOpen = true;
        state.lastReason = `devtools-${reason}`;
        kickUser(`devtools-${reason}`);
        return true;
    }

    function scheduleResizeProbe() {
        if (state.resizeTimer) {
            clearTimeout(state.resizeTimer);
        }

        state.resizeTimer = setTimeout(() => {
            state.resizeTimer = null;
            probeDevTools('resize');
        }, CONFIG.resizeProbeDelayMs);
    }

    // Chuột phải: Giáo viên đã xác minh được dùng bình thường.
    document.addEventListener('contextmenu', function (event) {
        if (isVerifiedTeacher()) {
            return;
        }

        event.preventDefault();
    }, true);

    // Phím tắt DevTools/source.
    document.addEventListener('keydown', function (event) {
        if (!isBlockedShortcut(event)) {
            return;
        }

        // Giáo viên đã xác minh: không can thiệp.
        if (isVerifiedTeacher()) {
            return;
        }

        // Trong lúc xác thực Giáo viên: chỉ chặn phím, KHÔNG đá khỏi web.
        if (isTeacherVerificationInProgress()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            console.warn(
                '[SecurityGuard] Đang chờ xác thực Giáo viên; phím tắt tạm thời bị chặn.'
            );
            return false;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        kickUser('keyboard-shortcut');
        return false;
    }, true);

    // Phát hiện DevTools dock mở bằng menu / đã mở trước khi vào trang Học sinh.
    window.addEventListener('resize', scheduleResizeProbe, { passive: true });
    window.addEventListener('focus', () => probeDevTools('focus'), { passive: true });
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            setTimeout(() => probeDevTools('visibility'), 120);
        }
    });

    state.intervalId = window.setInterval(
        () => probeDevTools('interval'),
        CONFIG.probeIntervalMs
    );

    // Khi teacher.js xác minh xong, detector tự trở thành no-op nhờ isVerifiedTeacher().
    window.addEventListener('teacher-security-state-change', function () {
        if (isVerifiedTeacher()) {
            resetDevToolsSignal();
        }
    });

    function getState() {
        return {
            version: VERSION,
            role: resolvePageRole(),
            verifiedTeacher: isVerifiedTeacher(),
            teacherVerificationState: getTeacherVerificationState(),
            devtoolsLikelyOpen: state.devtoolsLikelyOpen,
            dimensionHits: state.dimensionHits,
            lastReason: state.lastReason,
            lastMetrics: state.lastMetrics,
            config: CONFIG
        };
    }

    window.SecurityGuard = Object.freeze({
        version: VERSION,
        resolvePageRole,
        getTeacherVerificationState,
        isVerifiedTeacher,
        isStudentPage,
        kickUser,
        probeDevToolsNow: () => probeDevTools('manual'),
        getState
    });
})();
