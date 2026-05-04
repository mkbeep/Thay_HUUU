# 🍽️ Restaurant Management System

Hệ thống quản lý nhà hàng toàn diện với 2 ứng dụng:
- **Mobile App** (React Native + Expo) - Dành cho khách hàng
- **Admin Web** (React + Vite) - Dành cho quản lý nhà hàng

Được xây dựng theo **Kiến trúc Đa tầng (Layered Architecture)** với TypeScript.

---

## 🎯 Tính năng

### Mobile App (Khách hàng)
- ✅ Xem thực đơn theo danh mục
- ✅ Xem chi tiết món ăn
- ✅ Thêm món vào giỏ hàng
- ✅ Đặt món và theo dõi đơn hàng
- ✅ Xem lịch sử đơn hàng
- ✅ Yêu cầu hỗ trợ nhân viên
- ✅ Xem thông tin bàn ăn
- ✅ Thanh toán

### Admin Web (Quản lý)
- ✅ Dashboard với thống kê tổng quan
- ✅ Quản lý thực đơn (CRUD)
- ✅ Quản lý đơn hàng
- ✅ Quản lý bàn ăn
- ✅ Quản lý nhân viên
- ✅ Quản lý kho
- ✅ Quản lý khuyến mãi
- ✅ Báo cáo và thống kê
- ✅ Cài đặt hệ thống

---

## 🏗️ Kiến trúc

Dự án được xây dựng theo **Kiến trúc Đa tầng (Layered Architecture)** với 4 tầng:

```
┌─────────────────────────────────────┐
│   Presentation Layer (UI)           │  ← React Components, Screens
├─────────────────────────────────────┤
│   Business Logic Layer (Services)   │  ← Business Rules, Validation
├─────────────────────────────────────┤
│   Data Access Layer (Repositories)  │  ← CRUD Operations, API Calls
├─────────────────────────────────────┤
│   Domain Layer (Models)             │  ← Entities, Interfaces, Types
└─────────────────────────────────────┘
```

**Đọc thêm**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🚀 Bắt đầu nhanh

### Yêu cầu
- Node.js v16+ (khuyến nghị v18 hoặc v20)
- npm v8+ hoặc yarn v1.22+

### Cài đặt và Chạy

#### 1. Mobile App
```bash
cd App
npm install
npm start
```

Sau đó quét QR code bằng Expo Go app trên điện thoại.

#### 2. Admin Web
```bash
cd admin-web
npm install
npm run dev
```

Mở trình duyệt: http://localhost:5173

**Đăng nhập**:
- Email: `admin@gourmet.com`
- Password: `admin123`

**Hướng dẫn chi tiết**: [SETUP_AND_RUN.md](./SETUP_AND_RUN.md)

---

## 📂 Cấu trúc Dự án

```
restaurant-management-system/
├── App/                          # Mobile App (React Native)
│   ├── src/
│   │   ├── domain/              # Models & Constants
│   │   │   ├── models/
│   │   │   └── constants/
│   │   ├── data/                # Repositories
│   │   │   ├── repositories/
│   │   │   └── mockData/
│   │   ├── business/            # Services
│   │   │   └── services/
│   │   └── presentation/        # UI
│   │       ├── screens/
│   │       └── context/
│   └── App.tsx
│
├── admin-web/                    # Admin Web (React)
│   ├── src/
│   │   ├── domain/              # Models
│   │   │   └── models/
│   │   ├── data/                # Repositories
│   │   │   └── repositories/
│   │   ├── business/            # Services
│   │   │   └── services/
│   │   ├── features/            # Feature Modules
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── menu/
│   │   │   ├── orders/
│   │   │   └── ...
│   │   ├── components/          # Shared Components
│   │   └── stores/              # State Management
│   └── index.html
│
├── backend/                      # Backend (Coming soon)
│
├── ARCHITECTURE.md               # Tài liệu kiến trúc
├── SETUP_AND_RUN.md             # Hướng dẫn cài đặt
├── FIXES_AND_IMPROVEMENTS.md    # Lỗi đã sửa & cải tiến
└── README.md                     # File này
```

---

## 🛠️ Công nghệ

### Mobile App
- **Framework**: React Native 0.74 + Expo 51
- **Language**: TypeScript 5.3
- **Navigation**: React Navigation 6
- **State**: React Context API
- **UI**: React Native Components

### Admin Web
- **Framework**: React 18 + Vite 5
- **Language**: TypeScript 5.2
- **Routing**: React Router v6
- **State**: Zustand 4
- **UI**: Tailwind CSS 3
- **Data Fetching**: TanStack Query (React Query)
- **HTTP**: Axios
- **Charts**: Recharts

---

## 📚 Tài liệu

- 📖 [ARCHITECTURE.md](./ARCHITECTURE.md) - Chi tiết về kiến trúc đa tầng
- 🚀 [SETUP_AND_RUN.md](./SETUP_AND_RUN.md) - Hướng dẫn cài đặt và chạy
- 🔧 [FIXES_AND_IMPROVEMENTS.md](./FIXES_AND_IMPROVEMENTS.md) - Lỗi đã sửa và cải tiến
- 📱 [START_APP.md](./START_APP.md) - Hướng dẫn khởi động app
- 🎯 [SUPPORT_FEATURE_COMPLETE.md](./SUPPORT_FEATURE_COMPLETE.md) - Tính năng hỗ trợ

---

## 🔄 Luồng dữ liệu

```
User Action
    ↓
Presentation Layer (UI Component)
    ↓
Business Logic Layer (Service)
    ↓ (validate, transform)
Data Access Layer (Repository)
    ↓ (API call / local storage)
Data Source
    ↓ (response)
Repository (transform)
    ↓
Service (apply business rules)
    ↓
UI Component (update state)
```

---

## ✅ Lỗi Đã Sửa

### 1. TypeScript Configuration Error
- ❌ **Lỗi**: `File 'expo/tsconfig.base' not found`
- ✅ **Đã sửa**: Cập nhật `App/tsconfig.json` với cấu hình đầy đủ

### 2. Thiếu Kiến trúc Đa tầng cho Admin Web
- ❌ **Trước**: Chỉ có UI components
- ✅ **Sau**: Đầy đủ 4 tầng (Domain, Data, Business, Presentation)

**Chi tiết**: [FIXES_AND_IMPROVEMENTS.md](./FIXES_AND_IMPROVEMENTS.md)

---

## 🎓 Best Practices

### 1. Separation of Concerns
- Mỗi tầng có trách nhiệm riêng biệt
- UI không chứa business logic
- Business logic không biết về UI

### 2. Type Safety
- TypeScript strict mode
- Đầy đủ type definitions
- DTOs cho data transfer

### 3. Dependency Flow
- Tầng trên phụ thuộc tầng dưới
- Tầng dưới không biết về tầng trên
- Domain layer độc lập hoàn toàn

### 4. Testability
- Mỗi tầng có thể test riêng
- Mock data dễ dàng
- Business logic tách biệt

---

## 🚧 Roadmap

### Phase 1: ✅ Hoàn thành
- [x] Setup project structure
- [x] Implement layered architecture
- [x] Create domain models
- [x] Implement repositories with mock data
- [x] Implement services with business logic
- [x] Build UI for both apps
- [x] Write documentation

### Phase 2: 🚧 Đang thực hiện
- [ ] Connect to real backend API
- [ ] Implement authentication & authorization
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add notifications

### Phase 3: 📋 Kế hoạch
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Implement caching
- [ ] Add offline support
- [ ] Performance optimization

### Phase 4: 🚀 Production
- [ ] CI/CD pipeline
- [ ] Environment configs
- [ ] Security audit
- [ ] Deploy to production
- [ ] Monitoring & logging

---

## 🧪 Testing

```bash
# Mobile App
cd App
npm test

# Admin Web
cd admin-web
npm test
```

---

## 📦 Build Production

### Mobile App
```bash
cd App
eas build --platform android
eas build --platform ios
```

### Admin Web
```bash
cd admin-web
npm run build
# Output: dist/
```

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

- **Developer**: Your Name
- **Architecture**: Layered Architecture Pattern
- **Version**: 2.0.0
- **Last Updated**: 2026-05-04

---

## 📞 Support

Nếu gặp vấn đề:
1. Xem [SETUP_AND_RUN.md](./SETUP_AND_RUN.md) - Phần "Xử lý Lỗi"
2. Xem [FIXES_AND_IMPROVEMENTS.md](./FIXES_AND_IMPROVEMENTS.md)
3. Tạo issue trên GitHub

---

## 🌟 Features Highlight

- ✨ **Kiến trúc Đa tầng** - Dễ maintain và scale
- 🔒 **Type Safety** - TypeScript strict mode
- 📱 **Cross-platform** - iOS, Android, Web
- 🎨 **Modern UI** - Tailwind CSS, React Native
- 🚀 **Fast Development** - Expo, Vite, Hot Reload
- 📊 **Rich Features** - Dashboard, Reports, Analytics
- 🔄 **Real-time Ready** - Sẵn sàng cho WebSocket
- 🧪 **Testable** - Layered architecture

---

**Happy Coding! 🎉**       