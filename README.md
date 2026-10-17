# Bản test độc lập

HTML, js, css, assets, rule và **r2-worker** nằm trực tiếp trong thư mục ban_test, tương tự bản chính. Mỗi bản có cấu hình và quy trình phát hành riêng.

- Firebase test: `web-chan-doan-test`.
- Worker test: `school-account-access-test`.
- R2 bucket riêng: `school-files-test`.
- Website test: `https://quan-ly-bai-tap-test.pages.dev`.

Đã đồng bộ cấu hình Firebase công khai, .firebaserc, mẫu URL trong Rules và URL Worker trong frontend. File firebase.test.config.json đã sửa về JSON hợp lệ từ đoạn const firebaseConfig người dùng điền. Không lưu khóa service account trong bản test.

## Worker của bản test

Mở [r2-worker/README.md](r2-worker/README.md) để cài thư viện, tạo bucket, deploy và gắn secret đúng Firebase test. Từ nay chạy lệnh trong **ban_test/r2-worker**, không dùng thư mục Worker của bản chính hoặc cấu hình cũ ở nơi lưu trữ.

Cấu hình hiện có đầy đủ tải tệp/tài khoản/IP và tác vụ backend test; giao dịch kinh tế vẫn theo Firebase draft hiện có. Chưa tạo bucket, deploy Worker, thay secret hay Publish Rules trong lượt này.

## Kiểm tra trên máy

```powershell
cd "C:\Users\DELL\Downloads\quan-ly-bai-tap\ban_test"
node tools/check-config.cjs
```

Lệnh chỉ kiểm cấu hình local, không chứng minh dịch vụ cloud đã được triển khai. Firebase đã cấu hình nên không cần chạy lại configure-firebase.cjs. Muốn đổi project sau này cần đồng bộ cả Worker và kiểm tra lại.

## Phát hành

Publish rule/database.rules.json vào Firebase test. Chỉ phát hành các tệp frontend: HTML, js, css, assets, sw.js và tệp tĩnh cần thiết. Không đưa r2-worker, functions, file khóa hay cấu hình nội bộ lên website tĩnh. Functions chỉ giữ nguồn để tích hợp sau, không tự deploy.

Chỉ bật account_access_config/enabled trong Firebase test sau khi Worker, secret và website đã sẵn sàng. Các dịch vụ cloud chuẩn bị trước đây không được coi là đã triển khai theo cấu hình mới nếu chưa kiểm tra.

## Bảo trì ngày 17/10: yêu cầu quên mã

- Worker tự kết thúc yêu cầu quên mã đang chờ khi xác thực mã thành công. Danh sách giáo viên loại yêu cầu đã kết thúc.
- Khi cập nhật danh sách, Worker đối chiếu phiên hợp lệ để sửa yêu cầu tồn từ phiên bản cũ. Nếu không còn bằng chứng phiên, không tự kết luận học sinh đã đăng nhập; học sinh có thể đăng nhập lại bằng mã để đóng yêu cầu.
- Yêu cầu đã duyệt tạo mã mới và báo quên mật khẩu giữ quy trình riêng.
- Khung hỗ trợ giáo viên thu gọn khi trống, vẫn giữ nút cập nhật.
- Mã xử lý: `r2-worker/src/firebase-admin-rest.js`; hiển thị: `js/common.js`, `css/common.css`.
- Kiểm thử độc lập: `node r2-worker/tests/account-access.test.mjs`.

Áp dụng: triển khai Worker trong `r2-worker` của đúng bản bằng `npm.cmd run deploy`, rồi phát hành frontend của bản đó. Không cần Publish Rules cho bản sửa lỗi này. Thay đổi hiện ở máy, chưa tự triển khai cloud.

## Quy ước sắp xếp

HTML và các thư mục `js`, `css`, `assets` giữ vị trí để không làm hỏng đường dẫn, bộ tải module và tài nguyên từ danh mục vật phẩm. `functions` giữ tác vụ nền. `rule` giữ Rules. `r2-worker/src` giữ backend, `r2-worker/tests` giữ kiểm thử.

Không xóa ảnh hoặc module chỉ vì không thấy tên trong HTML: website có nhiều tài nguyên tải động. Hai bản giữ mã riêng để triển khai độc lập, không dùng liên kết file qua lại.

Công cụ cấu hình nằm trong `tools/`: `node tools/check-config.cjs`, `node tools/configure-firebase.cjs`. Kiểm thử Rules nằm trong `tests/test-relaxed-rules.mjs`; bản Rules trước khi nới nằm trong `rule/backups/database.rules.strict-backup.json`. Chạy công cụ nới Rules bằng `python tools/relax-test-rules.py` khi thực sự muốn tạo lại Rules từ bản sao lưu.

## Chỉ một phiên được thao tác (17/10)

Bản test đã thêm quyền theo thứ tự đăng nhập: phiên 1 thao tác, các phiên sau chỉ xem; không tự chuyển quyền cho phiên đang mở. Xem [cơ chế, cách cập nhật và kịch bản thử](docs/PHIEN-DANG-NHAP-VA-CHONG-THAO-TAC-TRUNG.md). Cần cập nhật Worker test, Rules test và frontend test để áp dụng đầy đủ.
