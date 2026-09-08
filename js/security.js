// =========================================================================
// SECURITY GUARD — F12 / CHUỘT PHẢI (RACE-SAFE)
// =========================================================================
// Mục tiêu:
// - Không để security.js đá nhầm Giáo viên trong lúc teacher.js còn xác thực Firebase.
// - Giáo viên chỉ được bỏ chặn phím tắt/chuột phải sau khi UID + role xác minh thành công.
// - Bỏ hoàn toàn bẫy debugger động/timer dò DevTools vì gây giật và false positive.
// - Đây chỉ là lớp bảo vệ giao diện. Quyền dữ liệu vẫn phải do Firebase Rules/Auth bảo vệ.
// =========================================================================

(function () {
    'use strict';

    if (window.SecurityGuard?.version === '4.1.0-race-safe') {
        return;
    }

    const VERSION = '4.1.0-race-safe';

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

        const state = getTeacherVerificationState();

        return (
            state === 'pending' ||
            state === 'error' ||
            state === 'network-error'
        );
    }

    // Chỉ dùng với tài khoản/trang không phải Giáo viên đã xác minh.
    // Khi trang Giáo viên đang chờ Firebase, tuyệt đối không kick để tránh race condition.
    function kickUser(reason = 'blocked-devtools-shortcut') {
        if (isVerifiedTeacher()) {
            return false;
        }

        if (isTeacherVerificationInProgress()) {
            console.warn(
                '[SecurityGuard] Bỏ qua kick trong lúc Giáo viên đang chờ xác thực:',
                reason
            );
            return false;
        }

        try {
            document.head.innerHTML = '';
            document.body.innerHTML = '';
        } catch (_) {}

        window.location.replace('about:blank');
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

    // Chuột phải: Giáo viên đã xác minh được dùng bình thường.
    document.addEventListener('contextmenu', function (event) {
        if (isVerifiedTeacher()) {
            return;
        }

        event.preventDefault();
    });

    // Phím tắt DevTools/source.
    document.addEventListener('keydown', function (event) {
        if (!isBlockedShortcut(event)) {
            return;
        }

        // Giáo viên đã xác minh: không can thiệp.
        if (isVerifiedTeacher()) {
            return;
        }

        // Trong lúc xác thực Giáo viên: chỉ chặn phím, KHÔNG xóa DOM/đá khỏi web.
        if (isTeacherVerificationInProgress()) {
            event.preventDefault();
            console.warn(
                '[SecurityGuard] Đang chờ xác thực Giáo viên; phím tắt tạm thời bị chặn.'
            );
            return false;
        }

        // Hành vi cũ cho các trang/tài khoản còn lại.
        event.preventDefault();
        kickUser('keyboard-shortcut');
        return false;
    });

    // Không dùng Image getter / console detector và không chạy bẫy debugger động.
    // Các kỹ thuật đó không tạo bảo mật thực sự và có thể gây false positive/performance issue.

    window.SecurityGuard = Object.freeze({
        version: VERSION,
        resolvePageRole,
        getTeacherVerificationState,
        isVerifiedTeacher,
        kickUser
    });
})();
