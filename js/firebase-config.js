// 1. DÁN ĐOẠN CODE BẠN LẤY ĐƯỢC TỪ FIREBASE VÀO ĐÂY
// ---- DỰ ÁN THẬT
//const firebaseConfig = {
//    apiKey: "AIzaSyAnxiZEjEFUNoXnPFZR2GJh9mJ9KKYsPqI",
//    authDomain: "quan-ly-bai-tap-online.firebaseapp.com",
//    databaseURL: "https://quan-ly-bai-tap-online-default-rtdb.asia-southeast1.firebasedatabase.app",
//    projectId: "quan-ly-bai-tap-online",
//    storageBucket: "quan-ly-bai-tap-online.firebasestorage.app",
//    messagingSenderId: "1045476145868",
//    appId: "1:1045476145868:web:2019476c328a8b52e1e069",
//    measurementId: "G-8MJZ8D9EK1"
//};
// ---- DỰ ÁN NHÁP
const firebaseConfig = {
  apiKey: "AIzaSyDb4pnn0E16MY-aJ1UXD8p59X5vXkcRT_w",
  authDomain: "web-chan-doan-test.firebaseapp.com",
  databaseURL: "https://web-chan-doan-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "web-chan-doan-test",
  storageBucket: "web-chan-doan-test.firebasestorage.app",
  messagingSenderId: "623035254774",
  appId: "1:623035254774:web:70ee10a059363d8cb429d7"
};

// 2. Khởi tạo kết nối
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// =============================================================================
// REQUEST SINGLE-FLIGHT v1.0.0
// - Các getDB()/getDBStrict() cùng path trong cửa sổ 800ms dùng chung 1 Promise .once().
// - Chỉ tối ưu đọc one-shot; KHÔNG can thiệp listener realtime .on()/off().
// - Khi có push/update/remove, cache liên quan bị hủy ngay để lần đọc sau lấy dữ liệu mới.
// =============================================================================
const DB_SINGLE_FLIGHT_TTL_MS = 800;

const DBReadSingleFlight = (() => {
    const entries = new Map();
    let cleanupTimer = null;

    const stats = {
        firebaseOnceRequests: 0,
        sharedCalls: 0,
        invalidations: 0,
        completed: 0,
        failed: 0
    };

    function normalizePath(path) {
        return String(path ?? '')
            .trim()
            .replace(/^\/+|\/+$/g, '')
            .replace(/\/{2,}/g, '/');
    }

    function clearCleanupTimer() {
        if (cleanupTimer !== null) {
            clearTimeout(cleanupTimer);
            cleanupTimer = null;
        }
    }

    function scheduleCleanup() {
        clearCleanupTimer();

        const now = Date.now();
        let nextExpiry = Infinity;

        for (const [key, entry] of entries) {
            // Request đang chạy luôn được giữ để mọi caller tiếp tục dùng chung Promise,
            // kể cả khi Firebase phản hồi chậm hơn TTL.
            if (entry.pending) continue;

            if (entry.expiresAt <= now) {
                entries.delete(key);
                continue;
            }

            nextExpiry = Math.min(nextExpiry, entry.expiresAt);
        }

        if (Number.isFinite(nextExpiry)) {
            cleanupTimer = setTimeout(
                scheduleCleanup,
                Math.max(0, nextExpiry - Date.now())
            );
        }
    }

    function read(path) {
        const normalizedPath = normalizePath(path);
        const now = Date.now();
        const existing = entries.get(normalizedPath);

        if (
            existing &&
            (existing.pending || existing.expiresAt > now)
        ) {
            existing.sharedCount++;
            stats.sharedCalls++;
            return existing.promise;
        }

        if (existing) {
            entries.delete(normalizedPath);
        }

        const entry = {
            path: normalizedPath,
            startedAt: now,
            expiresAt: now + DB_SINGLE_FLIGHT_TTL_MS,
            pending: true,
            sharedCount: 0,
            promise: null
        };

        stats.firebaseOnceRequests++;

        // Đây là request Firebase thật duy nhất cho path trong cửa sổ single-flight.
        const promise = db
            .ref(normalizedPath)
            .once('value');

        entry.promise = promise;
        entries.set(normalizedPath, entry);

        promise.then(
            () => {
                entry.pending = false;
                stats.completed++;
                scheduleCleanup();
            },
            () => {
                entry.pending = false;
                stats.failed++;
                scheduleCleanup();
            }
        );

        return promise;
    }

    function invalidate(path = '') {
        const normalizedPath = normalizePath(path);
        let removed = 0;

        for (const [key] of entries) {
            const related =
                key === normalizedPath ||
                key.startsWith(`${normalizedPath}/`) ||
                normalizedPath.startsWith(`${key}/`) ||
                normalizedPath === '';

            if (related) {
                entries.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            stats.invalidations += removed;
            scheduleCleanup();
        }

        return removed;
    }

    function getStats() {
        const now = Date.now();
        let pendingEntries = 0;
        let reusableEntries = 0;

        for (const entry of entries.values()) {
            if (entry.pending) {
                pendingEntries++;
            } else if (entry.expiresAt > now) {
                reusableEntries++;
            }
        }

        return Object.freeze({
            version: '1.0.0',
            ttlMs: DB_SINGLE_FLIGHT_TTL_MS,
            activeEntries: entries.size,
            pendingEntries,
            reusableEntries,
            firebaseOnceRequests: stats.firebaseOnceRequests,
            sharedCalls: stats.sharedCalls,
            estimatedRequestsSaved: stats.sharedCalls,
            invalidations: stats.invalidations,
            completed: stats.completed,
            failed: stats.failed
        });
    }

    return Object.freeze({
        read,
        invalidate,
        getStats
    });
})();

// API chỉ đọc cho Chẩn đoán/Developer. Không cho module ngoài sửa Map nội bộ.
window.FirebaseReadSingleFlight = Object.freeze({
    version: '1.0.0',
    ttlMs: DB_SINGLE_FLIGHT_TTL_MS,
    getStats: () => DBReadSingleFlight.getStats()
});

// =============================================================================
// CÁC HÀM HỖ TRỢ CHUYỂN ĐỔI ONLINE
// =============================================================================

function mapFirebaseCollectionSnapshot(snapshot) {
    const data = snapshot.val();

    if (data === null || data === undefined) return [];

    return Object.keys(data).map(key => {
        const item = data[key];

        if (typeof item === 'object' && item !== null) {
            return { _fbKey: key, ...item };
        }

        return { _fbKey: key, value: item };
    });
}

// 1. Lấy dữ liệu — lỗi đọc vẫn trả [] như hành vi cũ.
async function getDB(path) {
    try {
        const snapshot = await DBReadSingleFlight.read(path);
        return mapFirebaseCollectionSnapshot(snapshot);
    } catch (error) {
        console.error(`❌ [Lỗi GetDB] tại '${path}':`, error);
        return [];
    }
}

// 1B. Lấy dữ liệu bắt buộc — lỗi đọc vẫn throw như hành vi cũ.
async function getDBStrict(path) {
    try {
        const snapshot = await DBReadSingleFlight.read(path);
        return mapFirebaseCollectionSnapshot(snapshot);
    } catch (error) {
        console.error(`❌ [Lỗi GetDBStrict] tại '${path}':`, error);
        throw error;
    }
}

// 2. Thêm dữ liệu mới (Nâng cấp: Trả về ID vừa tạo để tái sử dụng nếu cần)
async function pushDB(path, obj) {
    try {
        const ref = await db.ref(path).push(obj);
        DBReadSingleFlight.invalidate(path);
        return ref.key; // Trả về mã _fbKey vừa sinh ra (Code cũ không có, thêm vào không ảnh hưởng gì)
    } catch (error) {
        console.error(`❌ [Lỗi PushDB] tại '${path}':`, error);
        throw error;
    }
}

// 3. Cập nhật dữ liệu (Nâng cấp: Bắt lỗi mạng)
async function updateDB(path, fbKey, obj) {
    try {
        await db.ref(`${path}/${fbKey}`).update(obj);
        DBReadSingleFlight.invalidate(`${path}/${fbKey}`);
        return true;
    } catch (error) {
        console.error(`❌ [Lỗi UpdateDB] tại '${path}/${fbKey}':`, error);
        throw error; // Quăng lỗi ra ngoài nếu cần dùng .catch() ở nơi gọi
    }
}

// 4. Xóa dữ liệu (Nâng cấp: Bắt lỗi phân quyền/mạng)
async function removeDB(path, fbKey) {
    try {
        await db.ref(`${path}/${fbKey}`).remove();
        DBReadSingleFlight.invalidate(`${path}/${fbKey}`);
        return true;
    } catch (error) {
        console.error(`❌ [Lỗi RemoveDB] tại '${path}/${fbKey}':`, error);
        throw error;
    }
}

// firebase-config.js

// Hàm lấy dữ liệu phân trang (Load More)
async function getPaginatedDB(path, limit, lastKey = null) {
    try {
        let query = db.ref(path).orderByKey();

        if (lastKey) {
            // Lấy dư 1 phần tử (limit + 1) để trừ hao phần tử mốc bị trùng lặp
            query = query.endAt(lastKey).limitToLast(limit + 1);
        } else {
            // Tải lần đầu tiên
            query = query.limitToLast(limit);
        }

        const snapshot = await query.once('value');
        const data = snapshot.val();

        if (!data) return { items: [], nextKey: null };

        // Chuyển Object thành Array
        let items = Object.keys(data).map(key => {
            const item = data[key];
            if (typeof item === 'object' && item !== null) {
                return { _fbKey: key, ...item };
            }
            return { _fbKey: key, value: item };
        });

        // Firebase trả về theo thứ tự key tăng dần (cũ -> mới).
        // Nếu không phải lần tải đầu, ta loại bỏ phần tử cuối cùng (vì nó chính là lastKey của đợt trước)
        if (lastKey && items.length > 0) {
            items.pop(); 
        }

        let nextKey = null;
        if (items.length >= limit) {
            // Key nhỏ nhất (phần tử đầu tiên) sẽ làm mốc cho lần tải tiếp theo
            nextKey = items[0]._fbKey; 
        }

        return { items, nextKey };
    } catch (error) {
        console.error(`❌ [Lỗi getPaginatedDB] tại '${path}':`, error);
        return { items: [], nextKey: null };
    }
}