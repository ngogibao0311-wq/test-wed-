// youtube-duration-helper.js
// Hàm lấy thời lượng chính xác từ YouTube Video API (ISO 8601 → Giây)

const YouTubeDurationHelper = {
    // Khóa API YouTube - Thay bằng khóa của bạn nếu cần
    // Lưu ý: Khóa này cần được cấu hình ở Google Cloud Console với quyền YouTube Data API v3
    API_KEY: 'AIzaSyDb4pnn0E16MY-aJ1UXD8p59X5vXkcRT_w', // Thay khóa nếu cần

    // Hàm chính: Lấy thời lượng video từ URL
    async getVideoDuration(youtubeUrl) {
        try {
            const videoId = this.extractVideoId(youtubeUrl);
            if (!videoId) {
                console.error('❌ Không thể trích xuất Video ID từ URL');
                return null;
            }

            // Gọi YouTube API v3
            const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${this.API_KEY}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error('❌ Lỗi kết nối YouTube API:', response.statusText);
                return null;
            }

            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                console.error('❌ Video không tồn tại hoặc bị ẩn');
                return null;
            }

            const duration = data.items[0].contentDetails.duration;
            return this.parseISO8601Duration(duration);
        } catch (error) {
            console.error('❌ Lỗi lấy thời lượng video:', error);
            return null;
        }
    },

    // Hàm: Trích xuất Video ID từ URL YouTube
    extractVideoId(url) {
        let videoId = null;
        
        if (url.includes('youtube.com/watch')) {
            const urlObj = new URL(url);
            videoId = urlObj.searchParams.get('v');
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1].split('?')[0];
        } else if (url.includes('youtube.com/shorts/')) {
            videoId = url.split('shorts/')[1].split('?')[0];
        }
        
        return videoId;
    },

    // Hàm: Chuyển ISO 8601 Duration sang Giây
    // VD: "PT1H2M32S" → 3752 (giây)
    parseISO8601Duration(duration) {
        const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
        const matches = duration.match(regex);
        
        if (!matches) return 0;
        
        const hours = parseInt(matches[1] || 0);
        const minutes = parseInt(matches[2] || 0);
        const seconds = parseInt(matches[3] || 0);
        
        return hours * 3600 + minutes * 60 + seconds;
    },

    // Hàm: Chuyển Giây sang dạng "H:MM:SS"
    formatSeconds(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
};
