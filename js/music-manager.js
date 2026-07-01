// js/music-items.js

class MusicManager {
    static applyMusic(itemId) {
        // Tạm thời khóa tính năng, hiển thị thông báo thay vì phát nhạc
        alert("🎵 Tính năng Nhạc nền đang trong quá trình phát triển. Vui lòng quay lại sau!");
        console.log(`[MusicManager] Đã chặn yêu cầu phát nhạc nền: ${itemId} (Tính năng đang khóa)`);
    }

    static stopMusic() {
        // Hàm chuẩn bị cho tương lai để tắt nhạc
        console.log("[MusicManager] Đã dừng nhạc nền.");
    }
}