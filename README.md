# LOOPUP CHAT

## Giới thiệu dự án

LoopUp Chat là một ứng dụng nhắn tin trực tuyến hiện đại, được phát triển với mục tiêu tạo ra nền tảng giao tiếp đa nền tảng, an toàn và thân thiện với người dùng. Dự án này được thực hiện như một phần của khóa học Công Nghệ Mới tại trường đại học, nhằm áp dụng các công nghệ tiên tiến vào thực tế.

## Tổng quan về tính năng

- **Nhắn tin thời gian thực**: Trò chuyện tức thì với bạn bè và nhóm thông qua tin nhắn văn bản
- **Chat nhóm**: Tạo và quản lý các nhóm chat với nhiều thành viên, phân quyền admin
- **Chia sẻ file đa phương tiện**: Hỗ trợ chia sẻ hình ảnh, video, tài liệu và nhiều định dạng file khác
- **Gọi video**: Tính năng gọi video trực tiếp với chất lượng cao
- **Giao diện thân thiện**: Thiết kế UI/UX hiện đại, dễ sử dụng và hỗ trợ đa nền tảng
- **Bảo mật**: Đảm bảo an toàn dữ liệu người dùng với hệ thống xác thực mạnh mẽ

## Kiến trúc dự án

### Frontend

#### Web Client

- **Công nghệ chính**: React, Firebase Auth, Material UI, Socket.IO
- **Thư viện UI**: MUI (Material-UI), React Icons, Framer Motion
- **Quản lý trạng thái**: React Hooks
- **Thư viện hỗ trợ**: Axios, React Router DOM, Emoji Picker, React Toastify

#### Mobile Client (Đang phát triển)

- **Framework**: React Native (Expo)
- **Điều hướng**: Expo Router
- **Hoạt ảnh**: React Native Reanimated
- **Giao diện**: Expo UI components

### Backend

#### Authentication Service

- **Framework**: Spring Boot 3.4.4
- **Ngôn ngữ**: Java 17
- **Cơ sở dữ liệu**: Firestore (Firebase)
- **Xác thực**: Firebase Authentication
- **Lưu trữ đám mây**: Amazon S3
- **Giao tiếp thời gian thực**: WebSocket, Socket.IO (Netty implementation)

## Quá trình phát triển dự án

### Giai đoạn 1: Khởi tạo dự án và thiết kế cơ sở

1. **Phân tích yêu cầu và lập kế hoạch**

   - Xác định các tính năng cốt lõi của ứng dụng chat
   - Nghiên cứu và lựa chọn công nghệ phù hợp
   - Thiết kế kiến trúc hệ thống

2. **Thiết lập cấu trúc dự án**

   - Tạo cấu trúc thư mục frontend và backend
   - Cài đặt các framework và thư viện cần thiết
   - Thiết lập môi trường phát triển

3. **Thiết kế cơ sở dữ liệu**
   - Thiết kế schema cho Firestore
   - Xác định các collections chính: users, chats, messages
   - Thiết lập mối quan hệ giữa các entities

### Giai đoạn 2: Phát triển tính năng cốt lõi

1. **Xây dựng hệ thống xác thực**

   - Tích hợp Firebase Authentication
   - Phát triển các API đăng ký và đăng nhập
   - Xác thực token JWT và quản lý phiên

2. **Phát triển tính năng chat cơ bản**

   - Xây dựng API quản lý cuộc trò chuyện
   - Thiết lập kết nối WebSocket cho tin nhắn thời gian thực
   - Phát triển giao diện chat trên web client

3. **Tích hợp lưu trữ đám mây**
   - Cấu hình Amazon S3 cho việc lưu trữ file
   - Phát triển API tải lên và tải xuống file
   - Tạo presigned URL cho việc tải lên trực tiếp từ client

### Giai đoạn 3: Mở rộng tính năng và tối ưu hóa

1. **Phát triển tính năng chat nhóm**

   - Xây dựng API quản lý nhóm chat
   - Triển khai hệ thống phân quyền trong nhóm
   - Phát triển giao diện quản lý nhóm

2. **Triển khai tính năng gọi video**

   - Thiết lập kết nối WebRTC
   - Xây dựng hệ thống trao đổi tín hiệu (signaling)
   - Phát triển giao diện gọi video

3. **Tối ưu hóa hiệu suất**
   - Cải thiện tốc độ tải và phản hồi của ứng dụng
   - Tối ưu hóa truy vấn Firestore
   - Tối ưu hóa quá trình upload/download file

### Giai đoạn 4: Kiểm thử và triển khai

1. **Kiểm thử ứng dụng**

   - Kiểm thử tính năng và giao diện người dùng
   - Kiểm thử bảo mật và hiệu suất
   - Sửa lỗi và cải thiện trải nghiệm người dùng

2. **Triển khai ứng dụng**

   - Cấu hình môi trường sản xuất
   - Triển khai backend lên cloud
   - Đưa web client lên hosting

3. **Theo dõi và bảo trì**
   - Giám sát hiệu suất hệ thống
   - Cập nhật các tính năng mới
   - Xử lý phản hồi từ người dùng

## Công nghệ sử dụng

### Frontend

- **React**: Framework JavaScript để xây dựng giao diện người dùng
- **React Router**: Thư viện điều hướng cho ứng dụng React
- **Material UI**: Thư viện component React với thiết kế Material Design
- **Socket.IO Client**: Kết nối WebSocket cho giao tiếp thời gian thực
- **Axios**: Thư viện HTTP client để thực hiện các yêu cầu API
- **Firebase SDK**: Tích hợp xác thực và lưu trữ Firebase
- **React Icons**: Thư viện icon cho React components
- **React Toastify**: Hiển thị thông báo toast trong ứng dụng
- **Emoji Picker React**: Component cho phép chọn emoji

### Backend

- **Spring Boot**: Framework Java để xây dựng ứng dụng web
- **Firebase Admin SDK**: Quản lý xác thực và tương tác với Firebase
- **AWS SDK for Java**: Tích hợp Amazon S3 cho lưu trữ đám mây
- **Netty SocketIO**: Triển khai Socket.IO trên nền tảng Java
- **WebSocket API**: Giao tiếp thời gian thực
- **Project Lombok**: Giảm mã boilerplate trong Java
- **Dotenv Java**: Quản lý biến môi trường

## Cài đặt và chạy dự án

### Yêu cầu hệ thống

- Node.js 16.x trở lên
- JDK 17 trở lên
- Maven 3.8 trở lên
- Firebase Project
- AWS S3 Account

### Backend

1. Clone repository

   ```
   git clone https://github.com/TranTrungHiu/loopup-chat.git
   cd loopup-chat
   ```

2. Cấu hình Firebase và AWS

   - Đặt file firebase-service-account.json trong thư mục resources
   - Cấu hình thông tin AWS trong biến môi trường hoặc application.properties

3. Chạy backend
   ```
   cd backend/java-services/auth-service
   mvn spring-boot:run
   ```

### Frontend Web

1. Cài đặt dependencies

   ```
   cd frontend/web-client
   npm install
   ```

2. Chạy ứng dụng

   ```
   npm start
   ```

3. Truy cập ứng dụng tại `http://localhost:3000`

### Frontend Mobile (Đang phát triển)

1. Cài đặt dependencies

   ```
   cd frontend/mobile-client
   npm install
   ```

2. Chạy ứng dụng
   ```
   npx expo start
   ```

## Thách thức và giải pháp

### Thách thức 1: Kết nối thời gian thực ổn định

**Giải pháp**: Triển khai Socket.IO với cơ chế tự kết nối lại và phương án dự phòng đa cổng, tăng tính ổn định của kết nối.

### Thách thức 2: Quản lý trạng thái và đồng bộ dữ liệu

**Giải pháp**: Sử dụng Firestore với khả năng đồng bộ thời gian thực, kết hợp với Socket.IO để thông báo kịp thời các thay đổi.

### Thách thức 3: Xử lý file đa phương tiện với hiệu suất cao

**Giải pháp**: Tạo presigned URL cho upload trực tiếp lên S3, tối ưu hóa quá trình upload/download và xử lý file.

### Thách thức 4: Trải nghiệm gọi video mượt mà

**Giải pháp**: Tối ưu hóa kết nối WebRTC, xử lý linh hoạt ICE candidate và thích ứng với điều kiện mạng khác nhau.

## Kết luận và hướng phát triển tương lai

LoopUp Chat được phát triển như một nền tảng giao tiếp đa chức năng, tích hợp nhiều công nghệ hiện đại để cung cấp trải nghiệm người dùng tốt nhất. Dự án đã áp dụng thành công các công nghệ mới và phương pháp phát triển hiện đại.

### Hướng phát triển tương lai:

1. **Hoàn thiện ứng dụng di động**: Phát triển tiếp ứng dụng mobile client trên nền tảng React Native
2. **End-to-end encryption**: Nâng cao bảo mật với mã hóa đầu cuối
3. **Tích hợp AI**: Thêm tính năng gợi ý trả lời và tóm tắt tin nhắn với AI
4. **Mở rộng tính năng cộng đồng**: Tạo các kênh công cộng và tính năng discover
5. **Tối ưu hóa hiệu suất**: Tiếp tục cải thiện tốc độ tải và phản hồi của ứng dụng

## Tác giả

- [TranTrungHiu](https://github.com/TranTrungHiu) - Trưởng nhóm và chịu trách nhiệm chính

## Giấy phép

Dự án này được cấp phép theo giấy phép MIT. Chi tiết xem tại file [LICENSE](./LICENSE).
