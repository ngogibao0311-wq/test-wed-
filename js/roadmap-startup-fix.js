// ======================================================
// HOTFIX STARTUP: CÀI ĐẶT LỘ TRÌNH - TRANG GIÁO VIÊN
// Đọc trực tiếp Firebase ngay lúc khởi động để loader
// không phải chờ một sự kiện child_changed không chắc xảy ra.
// ======================================================
(function installTeacherRoadmapStartupFix() {
    'use strict';

    if (window.__teacherRoadmapStartupFixInstalled) return;
    window.__teacherRoadmapStartupFixInstalled = true;

    const READY_KEY = 'teacher-roadmap-settings';
    const DEFAULT_PASSING_GRADE = 7;
    const MAX_BOOT_WAIT_MS = 8000;
    const startedAt = Date.now();

    function getDatabase() {
        try {
            if (typeof db !== 'undefined' && db) return db;
        } catch (_) {}

        return window.db || null;
    }

    function getLoader() {
        return window.AppStartupLoader || null;
    }

    function normalizePassingGrade(value) {
        const number = parseFloat(value);
        return Number.isFinite(number)
            ? number
            : DEFAULT_PASSING_GRADE;
    }

    function applyPassingGrade(value) {
        const grade = normalizePassingGrade(value);
        window.currentPassingGrade = grade;

        const input = document.getElementById('passingGradeSetting');
        if (input && !input.matches(':focus')) {
            input.value = grade;
        }

        return grade;
    }

    async function run() {
        const loader = getLoader();
        const database = getDatabase();

        if (!loader || !database || typeof database.ref !== 'function') {
            if (Date.now() - startedAt < MAX_BOOT_WAIT_MS) {
                setTimeout(run, 60);
                return;
            }

            console.warn(
                '[Roadmap Startup Fix] Firebase/loader chưa sẵn sàng sau thời gian chờ.'
            );
            return;
        }

        try {
            const snapshot = await database
                .ref('roadmap_settings/passingGrade')
                .once('value');

            const grade = applyPassingGrade(snapshot.val());

            if (typeof loader.markReady === 'function') {
                loader.markReady(
                    READY_KEY,
                    'Cài đặt lộ trình'
                );
            }

            console.info(
                '[Roadmap Startup Fix] Đã tải cài đặt lộ trình:',
                grade
            );
        } catch (error) {
            console.error(
                '[Roadmap Startup Fix] Không thể đọc cài đặt lộ trình:',
                error
            );

            if (typeof loader.fail === 'function') {
                loader.fail(
                    'Không tải được Cài đặt lộ trình.',
                    error?.message || String(error),
                    'roadmap-settings'
                );
            }
        }
    }

    run();
})();
