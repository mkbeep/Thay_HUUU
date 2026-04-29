# Ứng dụng Quản lý Nhà hàng

Ứng dụng demo quản lý nhà hàng được xây dựng bằng React Native với TypeScript, theo kiến trúc phân tầng (Layered Architecture).

## 🏗️ Kiến trúc

Dự án được tổ chức theo mô hình 3 tầng:

### 1. **Presentation Layer** (`src/presentation/`)
- Chứa các màn hình (Screens) và components UI
- Xử lý tương tác người dùng
- Hiển thị dữ liệu từ Business Layer

### 2. **Business Logic Layer** (`src/business/`)
- Chứa các Services xử lý logic nghiệp vụ
- Điều phối giữa Presentation và Data Layer
- Xử lý các quy tắc kinh doanh

### 3. **Data Layer** (`src/data/`)
- Chứa Repositories quản lý dữ liệu
- Xử lý CRUD operations
- Có thể kết nối với API hoặc database

### Domain Models (`src/domain/`)
- Định nghĩa các entities và interfaces
- Được sử dụng xuyên suốt các tầng

## 📱 Tính năng

### 1. Quản lý Thực đơn
- Xem danh sách món ăn
- Phân loại theo danh mục (Khai vị, Món chính, Tráng miệng, Đồ uống)
- Đánh dấu món còn/hết

### 2. Quản lý Đơn hàng
- Xem danh sách đơn hàng đang hoạt động
- Cập nhật trạng thái đơn hàng (Chờ xử lý → Đang chuẩn bị → Sẵn sàng → Hoàn thành)
- Hủy đơn hàng

### 3. Quản lý Bàn ăn
- Xem trạng thái các bàn (Trống, Đang sử dụng, Đã đặt)
- Thay đổi trạng thái bàn
- Hiển thị thông tin đơn hàng của bàn

### 4. Thống kê
- Thống kê đơn hàng (tổng đơn, doanh thu, giá trị trung bình)
- Thống kê bàn ăn (tổng số, trạng thái, tỷ lệ sử dụng)

## 🚀 Cài đặt

### Yêu cầu
- Node.js (v16 trở lên)
- npm hoặc yarn
- Expo CLI

### Các bước cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Khởi chạy ứng dụng:
```bash
npm start
```

3. Chạy trên thiết bị:
- iOS: `npm run ios`
- Android: `npm run android`
- Web: `npm run web`

## 📂 Cấu trúc thư mục

```
restaurant-management-app/
├── src/
│   ├── domain/
│   │   └── models/          # Định nghĩa entities
│   │       ├── MenuItem.ts
│   │       ├── Order.ts
│   │       └── Table.ts
│   ├── data/
│   │   └── repositories/    # Quản lý dữ liệu
│   │       ├── MenuRepository.ts
│   │       ├── OrderRepository.ts
│   │       └── TableRepository.ts
│   ├── business/
│   │   └── services/        # Logic nghiệp vụ
│   │       ├── MenuService.ts
│   │       ├── OrderService.ts
│   │       └── TableService.ts
│   └── presentation/
│       └── screens/         # Màn hình UI
│           ├── MenuScreen.tsx
│           ├── OrdersScreen.tsx
│           ├── TablesScreen.tsx
│           └── StatsScreen.tsx
├── App.tsx                  # Entry point
├── package.json
└── tsconfig.json
```

## 🎨 Công nghệ sử dụng

- **React Native** - Framework mobile
- **TypeScript** - Type safety
- **Expo** - Development platform
- **React Navigation** - Điều hướng
- **React Native Safe Area Context** - Xử lý safe area

## 🔄 Luồng dữ liệu

```
User Interaction (Screen)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Data Source (Mock Data / API)
```

## 📝 Ghi chú

- Hiện tại ứng dụng sử dụng dữ liệu mock trong memory
- Có thể mở rộng để kết nối với backend API
- Có thể thêm state management (Redux, MobX, Zustand) nếu cần
- Có thể thêm local storage (AsyncStorage) để lưu trữ dữ liệu

## 🚧 Phát triển tiếp

- [ ] Kết nối với backend API
- [ ] Thêm authentication
- [ ] Thêm tính năng đặt món
- [ ] Thêm in hóa đơn
- [ ] Thêm quản lý nhân viên
- [ ] Thêm báo cáo chi tiết
