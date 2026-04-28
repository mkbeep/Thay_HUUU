# Hướng dẫn cài đặt và chạy hệ thống

## Yêu cầu

- Node.js 18+
- MongoDB
- Docker & Docker Compose (tùy chọn)
- Expo CLI (cho mobile app)

## Cài đặt nhanh

### 1. Cài đặt dependencies

```bash
# Backend services
cd services/auth-service && npm install && cd ../..
cd services/menu-service && npm install && cd ../..
cd services/order-service && npm install && cd ../..
cd services/table-service && npm install && cd ../..
cd services/api-gateway && npm install && cd ../..

# Frontend Admin
cd frontend-admin && npm install && cd ..

# Mobile App
cd mobile-app && npm install && cd ..
```

### 2. Cấu hình môi trường

```bash
# Copy các file .env.example
cp services/auth-service/.env.example services/auth-service/.env
cp frontend-admin/.env.example frontend-admin/.env
```

### 3. Khởi động MongoDB

```bash
# Nếu dùng Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Hoặc khởi động MongoDB local
mongod
```

### 4. Seed dữ liệu mẫu

```bash
# Tạo user admin và dữ liệu mẫu
node scripts/seed-data.js
```

## Chạy hệ thống

### Option 1: Chạy từng service (Development)

Mở 6 terminal riêng biệt:

**Terminal 1 - API Gateway:**
```bash
cd services/api-gateway
npm run dev
```

**Terminal 2 - Auth Service:**
```bash
cd services/auth-service
npm run dev
```

**Terminal 3 - Menu Service:**
```bash
cd services/menu-service
npm run dev
```

**Terminal 4 - Order Service:**
```bash
cd services/order-service
npm run dev
```

**Terminal 5 - Table Service:**
```bash
cd services/table-service
npm run dev
```

**Terminal 6 - Frontend Admin:**
```bash
cd frontend-admin
npm start
```

**Terminal 7 - Mobile App:**
```bash
cd mobile-app
npm start
```

### Option 2: Chạy với Docker Compose

```bash
docker-compose up --build
```

## Kiểm tra hệ thống

### 1. Kiểm tra Backend Services

```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/api/auth/health

# Menu Service
curl http://localhost:3002/api/menu/health

# Order Service
curl http://localhost:3003/api/orders/health

# Table Service
curl http://localhost:3004/api/tables/health
```

### 2. Kiểm tra Web Admin

1. Mở trình duyệt: http://localhost:3000
2. Đăng nhập với tài khoản mẫu:
   - **Admin**: username: `admin`, password: `admin123`
   - **Manager**: username: `manager`, password: `manager123`
   - **Waiter**: username: `waiter`, password: `waiter123`

### 3. Kiểm tra Mobile App

1. Quét QR code từ Expo
2. Nhập số bàn: `1`, `2`, hoặc `3`
3. Xem menu và đặt món

## Tài khoản mẫu

| Username | Password | Role | Quyền |
|----------|----------|------|-------|
| admin | admin123 | ADMIN | Toàn quyền |
| manager | manager123 | MANAGER | Quản lý menu, đơn hàng, bàn |
| waiter | waiter123 | WAITER | Xem và cập nhật đơn hàng |
| chef | chef123 | CHEF | Xem đơn hàng bếp |

## Ports

- API Gateway: 3000
- Auth Service: 3001
- Menu Service: 3002
- Order Service: 3003
- Table Service: 3004
- Frontend Admin: 3000 (dev server)
- MongoDB: 27017

## Troubleshooting

### Lỗi kết nối MongoDB
```bash
# Kiểm tra MongoDB đang chạy
docker ps | grep mongodb
# hoặc
ps aux | grep mongod
```

### Lỗi port đã được sử dụng
```bash
# Tìm process đang dùng port
netstat -ano | findstr :3000
# Kill process
taskkill /PID <PID> /F
```

### Mobile app không kết nối được API
- Đổi `localhost` thành IP máy tính trong `mobile-app/src/services/api.js`
- Ví dụ: `http://192.168.1.100:3000/api`
