
# Kế hoạch phát triển tiếp theo: Từ Prototype đến Sản phẩm hoàn thiện

Đây là lộ trình đề xuất để đưa ứng dụng từ trạng thái hoạt động cơ bản sang một sản phẩm chất lượng cao, sẵn sàng phát hành trên App Store và Google Play.

---

## Giai đoạn 1: Ổn định & Tinh chỉnh (Ưu tiên cao nhất)

Mục tiêu của giai đoạn này là đảm bảo nền tảng hiện tại hoạt động một cách mượt mà, không có lỗi và mang lại trải nghiệm cốt lõi tốt nhất.

### ✅ Checklist Giai đoạn 1:

-   **[ ] Hoàn thiện Lõi Âm thanh:**
    -   **[ ] Tạo và Tích hợp Asset Âm thanh Thực tế:** Các file `.mp3` hiện tại chỉ là placeholder. Cần phải tạo ra các file âm thanh chất lượng cao, được lặp (loop) một cách mượt mà cho tất cả các tần số Solfeggio, sóng não (binaural beats) và âm thanh tự nhiên.
    -   **[ ] Cải thiện Sóng não (Binaural Beats):** Hiện tại, hiệu ứng binaural đang được giả lập bằng cách `pan` (chỉnh âm thanh sang trái/phải) trên cùng một track. Để có hiệu ứng chính xác, cần tạo ra hai file âm thanh riêng biệt cho mỗi tai với tần số chênh lệch nhau (ví dụ: `binaural_left_180hz.mp3` và `binaural_right_190hz.mp3`). Sau đó, `audioService` cần được cập nhật để phát đồng thời hai track này mà không cần `pan`.
    -   **[ ] Kiểm tra Xử lý Gián đoạn:** Kiểm tra kỹ lưỡng cách ứng dụng xử lý các tình huống gián đoạn âm thanh như có cuộc gọi đến, thông báo từ ứng dụng khác, tạm dừng/phát lại từ Control Center/Notification Shade.

-   **[ ] Tinh chỉnh Giao diện & Trải nghiệm người dùng (UI/UX):**
    -   **[ ] Lưu trữ Trạng thái Người dùng:** Đảm bảo các cài đặt của người dùng như ngôn ngữ, track phát gần nhất, mức âm lượng của mixer và melody được lưu lại bằng `AsyncStorage` và được khôi phục khi khởi động lại ứng dụng.
    -   **[ ] Hoạt ảnh & Chuyển cảnh:** Làm mượt các hiệu ứng chuyển cảnh khi hiển thị/ẩn UI người chơi, mở modals và các sheet. Cân nhắc sử dụng `react-native-reanimated` để có hiệu suất tốt hơn.
    -   **[ ] Tương thích Màn hình:** Kiểm tra và tối ưu hóa giao diện trên các kích thước màn hình khác nhau (ví dụ: iPhone SE, iPhone Pro Max, các thiết bị Android có tỷ lệ khác nhau).

-   **[ ] Sửa lỗi & Tối ưu hóa:**
    -   **[ ] Rà soát và Refactor Code:** Dọn dẹp các đoạn code còn sót lại từ phiên bản web, tối ưu hóa các vòng lặp, và đảm bảo tính nhất quán trong toàn bộ codebase.
    -   **[ ] Tối ưu hóa `Visualizer`:** Shader GLSL hiện tại hoạt động tốt, nhưng cần kiểm tra hiệu suất trên các thiết bị cũ hơn. Đảm bảo nó không gây hao pin hoặc làm nóng máy quá mức.

---

## Giai đoạn 2: Nâng cao Trải nghiệm Native

Mục tiêu là tận dụng các API và tính năng chỉ có trên nền tảng native để làm cho ứng dụng trở nên "thật" hơn, vượt trội so với phiên bản PWA.

### ✅ Checklist Giai đoạn 2:

-   **[ ] Tích hợp Phản hồi Rung (Haptics):**
    -   Sử dụng `expo-haptics` để thêm các phản hồi rung tinh tế khi người dùng tương tác với các nút bấm quan trọng (play/pause, next/prev, chọn mục tiêu). Điều này làm tăng cảm giác "vật lý" và cao cấp cho ứng dụng.

-   **[ ] Hoàn thiện Chức năng Toàn màn hình:**
    -   Nút toàn màn hình hiện tại là một placeholder. Cần triển khai chức năng ẩn thanh trạng thái hệ thống (status bar) và thanh điều hướng (navigation bar trên Android) để mang lại trải nghiệm chìm đắm hoàn toàn.

-   **[ ] Cải thiện Điều khiển trên Màn hình khóa:**
    -   `expo-av` đã xử lý các nút điều khiển cơ bản. Tuy nhiên, chúng ta có thể nâng cao nó bằng cách hiển thị thêm thông tin (metadata) như tên album (ví dụ: "Solfeggio Frequencies"), và có thể là một ảnh bìa (artwork) được tạo động hoặc mặc định cho từng thể loại.

-   **[ ] Thông báo Đẩy (Push Notifications) (Tùy chọn):**
    -   Nếu muốn, có thể tích hợp `expo-notifications` để gửi các lời nhắc thư giãn hàng ngày hoặc thông báo khi có các âm thanh mới được thêm vào.

---

## Giai đoạn 3: Chuẩn bị Phát hành

Giai đoạn cuối cùng, chuẩn bị mọi thứ cần thiết để đưa ứng dụng lên các cửa hàng ứng dụng.

### ✅ Checklist Giai đoạn 3:

-   **[ ] Hoàn thiện Asset cho Cửa hàng:**
    -   **[ ] Icon ứng dụng:** Tạo bộ icon ứng dụng với độ phân giải cao, đúng quy chuẩn cho iOS và Android (bao gồm cả adaptive icon cho Android).
    -   **[ ] Màn hình chờ (Splash Screen):** Thiết kế một màn hình chờ đẹp mắt và chuyên nghiệp.
    -   **[ ] Ảnh chụp màn hình (Screenshots):** Chuẩn bị bộ ảnh chụp màn hình chất lượng cao, giới thiệu các tính năng chính của ứng dụng cho trang sản phẩm trên App Store và Google Play.

-   **[ ] Cấu hình & Xây dựng:**
    -   **[ ] Rà soát `app.json`:** Kiểm tra lại `bundleIdentifier`, `package`, `versionCode`, `version`, và các quyền (permissions) cần thiết.
    -   **[ ] Xây dựng Bản dựng Standalone:** Sử dụng Expo Application Services (EAS) (`eas build`) để tạo các file `.ipa` (cho iOS) và `.aab` (cho Android) để gửi lên cửa hàng.

-   **[ ] Kiểm thử Toàn diện:**
    -   **[ ] Thử nghiệm trên Thiết bị thật:** Kiểm thử ứng dụng trên các thiết bị vật lý (cả iOS và Android) là bắt buộc, đặc biệt là để đánh giá hiệu suất âm thanh và đồ họa.
    -   **[ ] Gửi cho Tester (TestFlight/Google Play Internal Testing):** Trước khi phát hành công khai, hãy gửi ứng dụng cho một nhóm nhỏ người dùng để nhận phản hồi và phát hiện các lỗi cuối cùng.

---

Bằng cách thực hiện theo kế hoạch này, chúng ta sẽ có một lộ trình rõ ràng để biến dự án hiện tại thành một ứng dụng di động hoàn chỉnh, ổn định và mang lại giá trị thực sự cho người dùng.
