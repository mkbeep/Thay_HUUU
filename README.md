# Hệ thống quản lý nhà hàng - Kiến trúc Microservice

## Cấu trúc dự án

```
restaurant-management/
├── mobile-app/           # React Native - App khách hàng (iOS/Android)
├── frontend-admin/       # ReactJS Web - Quản lý nhân viên/admin (TailwindCSS + Responsive)
├── services/             # Microservices Backend
│   ├── api-gateway/      # API Gateway
│   ├── auth-service/     # Xác thực & phân quyền (JWT)
│   ├── menu-service/     # Quản lý thực đơn
│   ├── order-service/    # Quản lý đơn hàng
│   ├── table-service/    # Quản lý bàn & session
│   ├── payment-service/  # Thanh toán
│   └── notification-service/ # Thông báo
├── shared/               # Code dùng chung
└── docker-compose.yml    # Docker orchestration
```

## Phân quyền

### Khách hàng (Mobile App)
- React Native (iOS/Android)
- Không cần login
- Session-based với tableId
- Chức năng: Chọn bàn → Xem menu → Đặt món → Theo dõi đơn hàng

### Nhân viên & Quản lý (Web Admin)
- ReactJS Web Desktop
- Login với JWT
- Role-based access control
- Roles: ADMIN, MANAGER, WAITER, CHEF

## Công nghệ sử dụng

### Mobile App (Khách hàng)
- React Native + Expo
- Redux Toolkit
- React Navigation
- AsyncStorage

### Web Admin (Nhân viên & Quản lý)
- ReactJS (Desktop + Mobile Web - Responsive)
- Redux Toolkit
- TailwindCSS
- React Router
- JWT Authentication
- Role-based access control

### Backend
- Node.js/Express
- MongoDB
- RabbitMQ
- JWT + Session
- Docker

## Cài đặt và chạy

### 🐳 Cách 1: Sử dụng Docker (Khuyến nghị - Cực đơn giản!)

**Yêu cầu:** Docker Desktop

```bash
# Chỉ cần 1 lệnh - tất cả sẽ tự động chạy!
docker-compose up --build

# Hoặc chạy ở background
docker-compose up --build -d
```

Docker sẽ tự động:
- ✅ Build tất cả services
- ✅ Khởi động MongoDB & RabbitMQ
- ✅ Khởi động tất cả microservices
- ✅ Tự động seed dữ liệu mẫu
- ✅ Khởi động Frontend Admin

**Dừng services:**
```bash
docker-compose down
```

Xem hướng dẫn chi tiết: [DOCKER.md](./DOCKER.md)

### 💻 Cách 2: Chạy thủ công (Development)

Xem hướng dẫn chi tiết trong [SETUP.md](./SETUP.md)

#### macOS/Linux

```bash
# 1. Cài đặt dependencies cho tất cả services
npm install --prefix services/api-gateway
npm install --prefix services/auth-service
npm install --prefix services/menu-service
npm install --prefix services/order-service
npm install --prefix services/table-service

# 2. Khởi động MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7

# 3. Seed dữ liệu
cd scripts && npm install && node seed-data.js && cd ..

# 4. Chạy từng service trong terminal riêng
cd services/api-gateway && npm start
cd services/auth-service && npm start
cd services/menu-service && npm start
cd services/order-service && npm start
cd services/table-service && npm start
```

#### Windows

```bash
# 1. Cài đặt dependencies
npm run install-all

# 2. Khởi động MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7

# 3. Seed dữ liệu
cd scripts && npm install && node seed-data.js && cd ..

# 4. Chạy tất cả services
scripts\start-dev.bat
```

### Tài khoản test

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| manager | manager123 | MANAGER |
| waiter | waiter123 | WAITER |
| chef | chef123 | CHEF |

### URLs

- Web Admin: http://localhost:3000
- API Gateway: http://localhost:3000/api
- Mobile App: Quét QR từ Expo
