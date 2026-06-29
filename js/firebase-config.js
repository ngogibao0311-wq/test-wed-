// 1. DÁN ĐOẠN CODE BẠN LẤY ĐƯỢC TỪ FIREBASE VÀO ĐÂY
// ---- DỰ ÁN THẬT
//const firebaseConfig = {
//    apiKey: "AIzaSyAnxiZEjEFUNoXnPFZR2GJh9mJ9KKYsPqI",
//    authDomain: "quan-ly-bai-tap-online.firebaseapp.com",
//    databaseURL: "https://quan-ly-bai-tap-online-default-rtdb.asia-southeast1.firebasedatabase.app",
//    projectId: "quan-ly-bai-tap-online",
//    storageBucket: "quan-ly-bai-tap-online.firebasestorage.app",
//    messagingSenderId: "1045476145868",
//    appId: "1:1045476145868:web:2019476c328a8b52e1e069",
//    measurementId: "G-8MJZ8D9EK1"
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

// ==============================================================
// CÁC HÀM HỖ TRỢ CHUYỂN ĐỔI ONLINE (Đã cập nhật an toàn hơn)
// ==============================================================

// 1. Lấy dữ liệu (Tối ưu chống sập web khi dữ liệu bị sai cấu trúc)
async function getDB(path) {
    try {
        const snapshot = await db.ref(path).once('value');
        const data = snapshot.val();
        
        // Trả về mảng rỗng nếu không có dữ liệu
        if (data === null || data === undefined) return [];
        
        // Xử lý an toàn: Chuyển object/array của Firebase thành Array
        return Object.keys(data).map(key => {
            const item = data[key];
            // Nếu là Object thì rải (spread) bình thường
            if (typeof item === 'object' && item !== null) {
                return { _fbKey: key, ...item };
            }
            // Nếu vô tình chứa giá trị nguyên thủy (chữ, số) thì gom vào biến value tránh lỗi
            return { _fbKey: key, value: item };
        });
    } catch (error) {
        console.error(`❌ [Lỗi GetDB] tại '${path}':`, error);
        return []; // Trả về mảng rỗng để các vòng lặp for/forEach ở nơi khác không bị văng lỗi
    }
}

// 2. Thêm dữ liệu mới (Nâng cấp: Trả về ID vừa tạo để tái sử dụng nếu cần)
async function pushDB(path, obj) {
    try {
        const ref = await db.ref(path).push(obj);
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
        return true;
    } catch (error) {
        console.error(`❌ [Lỗi RemoveDB] tại '${path}/${fbKey}':`, error);
        throw error;
    }
}