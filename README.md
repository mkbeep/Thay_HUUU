# Hệ thống quản lý nhà hàng - Kiến trúc Microservice

## Cấu trúc dự án

```
restaurant-management/
├── mobile-app/           # React Native - App khách hàng (iOS/Android)
├── frontend-admin/       # ReactJS Web - Quản lý nhân viên/admin
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

### Web Admin (Nhân viên)
- ReactJS
- Redux Toolkit
- Material-UI
- React Router

### Backend
- Node.js/Express
- MongoDB
- RabbitMQ
- JWT + Session
- Docker

## Cài đặt và chạy

Xem hướng dẫn chi tiết trong [SETUP.md](./SETUP.md)

### Chạy nhanh (Windows)

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
