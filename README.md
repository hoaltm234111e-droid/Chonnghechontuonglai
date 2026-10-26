# Cổng thi “Chọn nghề, Chọn tương lai” 2026 – Giao diện người tham gia

Bản code giao diện **đã chốt**, xuất từ bản thiết kế: 8 màn web + 8 màn mobile.
Dữ liệu là **dữ liệu minh họa**, chưa nối backend.

## Chạy trên máy

Không cần cài đặt gì. Chọn một trong hai cách:

1. **Mở thẳng file:** bấm đúp `index.html` (Chrome, Edge, Firefox, Safari đều chạy).
2. **Chạy server tĩnh** (nên dùng khi xem trên điện thoại trong cùng mạng Wi-Fi):
   ```bash
   cd chon-nghe-chon-tuong-lai
   python3 -m http.server 8080      # hoặc: npx serve .
   ```
   Rồi mở `http://localhost:8080` (điện thoại: `http://<IP-máy-tính>:8080`).

Cần có Internet để tải font Be Vietnam Pro và Lora từ Google Fonts. Không có mạng thì trang vẫn chạy, chữ dùng font hệ thống.

## Các màn

| Màn | Web | Mobile |
|---|---|---|
| Trang chủ | `Main.dc.html` | `MainMobile.dc.html` |
| Video dự thi – Bình chọn | `BinhChon.dc.html` | `BinhChonMobile.dc.html` |
| Nộp bài – Bước 1: Hình thức, hạng mục | `NopBai1.dc.html` | `NopBai1Mobile.dc.html` |
| Nộp bài – Bước 2: Thông tin tác giả | `NopBai.dc.html` | `NopBaiMobile.dc.html` |
| Nộp bài – Bước 3: Thông tin tác phẩm | `NopBai3.dc.html` | `NopBai3Mobile.dc.html` |
| Nộp bài – Bước 4: Tải video | `NopBai4.dc.html` | `NopBai4Mobile.dc.html` |
| Nộp bài – Bước 5: Xem lại, cam kết, biên nhận | `NopBai5.dc.html` | `NopBai5Mobile.dc.html` |
| Bài dự thi của tôi | `BaiCuaToi.dc.html` | `BaiCuaToiMobile.dc.html` |

`index.html` là trang mục lục, có nút tự chọn web/mobile theo độ rộng màn hình.

## Xem các trạng thái demo qua URL

Các “Tweaks” của bản thiết kế được đổi bằng tham số trên URL:

| Màn | Tham số | Giá trị |
|---|---|---|
| Trang chủ | `bxh` | `Chưa công bố`, `Đã công bố` (tab Chuyên môn của Bảng xếp hạng) |
| Trang chủ | `warm` | `Cam`, `San hô`, `Đỏ gạch` (màu nhấn) |
| Bình chọn | `showVotes` | `true` / `false` (hiện số lượt) |
| Bình chọn | `perPage` | số video mỗi trang (mặc định 15) |
| Bình chọn | `previewPopup` | `true` mở sẵn popup video |
| Bước 4 | `state` | `Chưa chọn tệp`, `Đang tải`, `Lỗi thời lượng`, `Lỗi dung lượng`, `Lỗi định dạng`, `Hợp lệ` |
| Bước 5 | `guardian` | `Đã xác nhận`, `Chờ xác nhận` |
| Bài dự thi của tôi | `stage` | `Đã nộp – còn sửa được`, `Đã khóa – đang kiểm tra`, `Không hợp lệ`, `Đề nghị đổi hạng mục`, `Top 30 – bổ sung hồ sơ`, `Top 9 – xác nhận chung kết`, `Kết quả` |

Ví dụ: `BaiCuaToi.dc.html?stage=Kết quả`, `NopBai4.dc.html?state=Lỗi thời lượng`.

## Cấu trúc

```
index.html              Mục lục các màn
*.dc.html               16 màn (web + mobile)
assets/dc-lite.js       Runtime nhỏ (~170 dòng, không thư viện) dựng giao diện từ template
assets/img/             Logo và ảnh minh họa
```

Mỗi file `.dc.html` gồm 3 phần:
- `<head>`: font và CSS dùng chung của màn.
- `<template id="dc-template">`: HTML của màn. `{{tên}}` là chỗ điền dữ liệu, `<sc-for>` lặp danh sách, `<sc-if>` hiện/ẩn theo điều kiện, `onClick="{{hàm}}"` gắn sự kiện.
- `<script type="text/x-dc">`: `class Component` chứa dữ liệu mẫu (`renderVals()`) và trạng thái (`this.state`, `this.setState`).

Muốn sửa chữ, màu, khoảng cách: sửa trực tiếp trong `<template>`. Muốn sửa dữ liệu mẫu: sửa trong `renderVals()`.

## Dành cho đội phát triển

Bản này là **giao diện tham chiếu** (HTML/CSS chuẩn, style viết inline). Khi làm sản phẩm thật, nên chuyển sang framework của dự án (Vue/React/Astro…), tách component dùng chung (header, footer, thẻ video, stepper) và thay dữ liệu mẫu bằng API.

Luật nghiệp vụ đang thể hiện trên giao diện:
- Video MP4/MOV, tối đa 300 MB, dài 1:00–1:30 (kiểm tra ngay trên trình duyệt và **phải kiểm tra lại trên máy chủ**).
- Giới thiệu tác phẩm tối đa 150 từ. Video không dùng tiếng Việt phải có phụ đề tiếng Việt.
- Nhóm 2–5 người, 1 trưởng nhóm. Người dưới 18 tuổi cần người đại diện đồng ý.
- Bình chọn: mỗi tài khoản tối đa 05 lượt, dồn cho 1 video hoặc chia cho tối đa 5 video (theo mô tả kỹ thuật).
- Không sửa bài sau khi nộp thành công.
- Bảng xếp hạng chuyên môn chỉ hiện sau chung kết; Top 30 không xếp hạng.
- Điểm chung kết = 40% sơ khảo + 60% hùng biện, làm tròn 2 chữ số thập phân.

Việc backend cần làm: đăng nhập OTP, lưu nháp tự động, tải video theo từng phần, mã hóa CCCD (chỉ trả 4 số cuối), xác nhận người đại diện bằng OTP, chống gian lận bình chọn, chỉ công khai tên, cơ sở, địa phương, hình ảnh (Thể lệ Đ12.3).

### Cần Ban Tổ chức chốt trước khi chạy thật
- **Quy tắc bình chọn:** Thể lệ Đ8.2 ghi “05 lượt/ngày cho tối đa 05 video khác nhau”, giao diện đang theo mô tả kỹ thuật (5 lượt, dồn được cho 1 video). Cần sửa Thể lệ cho khớp.
- **Khóa bài ngay khi nộp:** chặt hơn Thể lệ Đ6.5 (chỉ khóa sau hạn nộp).
- **Chính sách bảo vệ dữ liệu cá nhân:** luồng nộp bài hiện không còn link tới chính sách; nên gắn lại ở cam kết “Đồng ý xử lý dữ liệu cá nhân” (Nghị định 13/2023).
- Các chỗ trong ngoặc vuông `[...]` là nội dung chờ Ban Tổ chức cung cấp (ngày công bố, danh sách miền, danh sách cơ sở, biểu mẫu…).
