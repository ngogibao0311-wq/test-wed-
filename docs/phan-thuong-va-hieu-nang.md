# Phần thưởng và tối ưu hiệu năng

## Cách dùng

**Học sinh:** Cửa hàng → nút đóng/mở menu cạnh tiêu đề → **Phần thưởng**.
Mục này mở thành một tab riêng. Nút **← Cửa hàng** quay về cửa hàng.

- Nền đặc biệt không bán, không dùng thử và không trừ Coin khi nhận.
- Nền chưa sở hữu chỉ có ô đen và tag; không đưa ảnh nền vào thẻ khi chưa mở.
- **Xem vật phẩm cần thu thập** hiển thị từng món đã mua/còn thiếu.
- Một nền thưởng: tự nhận khi đủ bộ và kết nối. Nhiều nền: chọn một, không đổi sau khi máy chủ xác nhận.
- Chỉ tính vật phẩm mua vĩnh viễn có biên nhận khớp. Đồ dùng thử, quà tặng và phần thưởng sự kiện không tính. Món cũ thiếu biên nhận cần đối soát; không mua lại chỉ để thử sửa tiến độ.
- Sau khi nhận, dùng **Sử dụng nền**. Việc nhận không tự trang bị.
- Nếu mất mạng khi gửi, giữ lựa chọn; khi kết nối lại hệ thống đối soát cùng bộ và cùng nền. Có thể dùng **Kiểm tra / thử lại**. Mở thêm tab không tạo thêm lượt nhận.

**Giáo viên:** Quản lý trò chơi → dưới Quản lý Cửa hàng Sang trọng → **Quản lý Phần thưởng**.

1. Nhập tên tag/bộ, lọc danh mục theo tag và tích chọn 1–24 vật phẩm cần mua đủ. Các lựa chọn được giữ khi đổi bộ lọc.
2. Chọn 1–8 nền thưởng. Một nền là tự nhận; nhiều nền là chọn một.
3. Bấm **Công bố bộ thưởng**. Danh mục nền cần dùng tự đồng bộ.
4. Bộ đã công bố giữ cố định. Muốn đổi điều kiện, công bố bộ mới; không sửa bộ cũ khiến quyền lợi học sinh thay đổi.
5. Nếu chưa xác nhận công bố, bản nháp và mã bộ được giữ trên trình duyệt. Mở lại và **Kiểm tra / công bố lại** để đối soát cùng mã bộ.

Nền mới khai báo trong `js/collection-reward-catalog.js`, ID bắt đầu bằng `reward_bg_`, loại `background`. Không thêm nền thưởng vào `StoreConfig.items`. Hiện danh mục có nền Mùa Xuân; thêm các nền khác để cấu hình bộ có nhiều lựa chọn. Cơ chế và giao diện nằm trong `js/collection-rewards.js` và `css/collection-rewards.css`.

## Tối ưu hiệu năng

Bật tại **Cài đặt → Tối ưu hiệu năng**.

- Học sinh: Bài tập cần làm, Kết quả học tập, Tài liệu học tập, Cửa hàng thường và Cửa hàng Sang trọng.
- Giáo viên: Bài tập đã giao, Danh sách bài đã nộp, Tài liệu học tập, Lộ trình và Lịch.
- Ảnh/video mới trong danh sách chờ đến gần vùng xem; âm thanh chờ bấm phát. Những trình phát theo dõi bài học giữ cơ chế theo dõi riêng.
- Thẻ/dòng ngoài vùng xem giảm công việc hiển thị khi trình duyệt hỗ trợ. Khi in, nội dung được hiển thị đầy đủ.
- Tắt tối ưu sẽ khôi phục nguồn ảnh/video đang chờ. Không xóa nguồn của trình phát đang chạy.
- Tài liệu vẫn mở qua nút xem/tải hiện có. Các lần bấm cùng DOCX đang tải dùng chung công việc; kết quả cũ không ghi đè tài liệu mới. Lượt tải DOCX quá 30 giây kết thúc để có thể thử lại.
- Không nén hoặc thay đổi tệp gốc, không thay điểm, thời hạn, bộ đếm bài thi hay tiền.

## Quy tắc và triển khai

`database.rules.patched.json` là bộ quy tắc đầy đủ đã ghép từ tệp người dùng cung cấp. Các nhánh không liên quan được giữ nguyên.

**Cần Publish bộ quy tắc này lên đúng Firebase Realtime Database của website cùng với việc cập nhật các tệp web.** Chỉ cập nhật JavaScript không đủ để cấp thưởng an toàn. Phiên làm việc này chưa triển khai quy tắc lên Firebase thật.

Các ràng buộc mới:

- Chỉ giáo viên công bố danh mục/bộ; danh sách có giới hạn, không trùng và không bỏ chỉ mục.
- Máy chủ kiểm tra kho và biên nhận trước giao dịch. Không tin tiến độ do giao diện gửi lên.
- Dấu nhận thưởng và vật phẩm được kiểm tra trong cùng lần cập nhật nguyên tử. Mỗi học sinh/bộ có một dấu bất biến.
- Không cấp nền thưởng qua mua/dùng thử hoặc giả nguồn nhận. Chặn nhận cho tài khoản khác hoặc tài khoản bị khóa.
- Một nền có thể xuất hiện ở nhiều bộ; nếu đã sở hữu hợp lệ, nhận bộ mới không ghi đè vật phẩm hoặc trạng thái trang bị.
- Ảnh bị che trên giao diện, không phải nội dung bí mật: danh mục/đường dẫn tài nguyên vẫn đọc được bởi người đăng nhập.

## Kiểm tra

- `node --test tests/collection-reward-rules.test.cjs`: kiểm tra biểu thức quy tắc với dữ liệu giả lập, gồm nhận hợp lệ/thiếu món/dùng thử/biên nhận sai/nhận trùng/giả mạo/tái sử dụng nền.
- `node tests/rewards-browser.cjs`: kiểm tra bằng trình duyệt Edge chạy nền, dữ liệu Firebase giả lập, không gọi dữ liệu thật. Có thể chỉ định thư mục chứa Playwright qua `WORKSPACE_NODE_MODULES`.
- Ảnh kiểm tra nằm trong `tests/artifacts/`.

Bộ kiểm tra biểu thức không thay thế Firebase Emulator. Trước khi áp dụng cho học sinh, kiểm tra bộ quy tắc trên môi trường thử với hai phiên nhận cùng bộ, mất mạng lúc gửi, tải lại sau khi đã nhận và trang bị lại nền. Chưa chạy thử với dữ liệu Firebase thật trong phiên này.

Tái tạo quy tắc từ bản đầu vào gốc bằng `node tools/build-collection-reward-rules.cjs <duong-dan-tep-quy-tac-goc>`. Không dùng chính tệp đầu ra làm đầu vào.

Tham khảo ngữ nghĩa cập nhật nguyên tử và `newData`: [Firebase — điều kiện trong Realtime Database Rules](https://firebase.google.com/docs/database/security/rules-conditions).
