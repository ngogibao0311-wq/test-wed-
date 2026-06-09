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
// CÁC HÀM HỖ TRỢ CHUYỂN ĐỔI ONLINE (Không cần sửa phần này)
// ==============================================================

// Lấy dữ liệu
async function getDB(path) {
    const snapshot = await db.ref(path).once('value');
    const data = snapshot.val();
    if (!data) return [];
    // Chuyển object của Firebase thành Array dễ dùng
    return Object.keys(data).map(key => ({ _fbKey: key, ...data[key] }));
}

// Thêm dữ liệu mới
async function pushDB(path, obj) {
    await db.ref(path).push(obj);
}

// Cập nhật dữ liệu
async function updateDB(path, fbKey, obj) {
    await db.ref(`${path}/${fbKey}`).update(obj);
}

// Xóa dữ liệu
async function removeDB(path, fbKey) {
    await db.ref(`${path}/${fbKey}`).remove();
}