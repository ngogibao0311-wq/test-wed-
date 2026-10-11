(() => {
    const mount = () => {
        if (document.getElementById('release-history-link')) return;
        const parent = document.getElementById('tab-settings') || document.querySelector('footer');
        if (!parent) return;
        const link = document.createElement('a');
        link.id = 'release-history-link'; link.href = 'release-history.html'; link.target = '_blank'; link.rel = 'noopener';
        link.textContent = 'Lịch sử phiên bản · v4.3.2';
        link.style.cssText = 'display:inline-block;margin:16px 0;padding:12px 16px;background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;border-radius:12px;font:600 14px/1.5 system-ui;text-decoration:none';
        parent.append(link);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
