# 🚀 Hướng dẫn chạy nhanh

## Bước 1: Cài đặt dependencies

Mở terminal và chạy:

```bash
# Cài đặt cho tất cả services
cd services/api-gateway && npm install && cd ../..
cd services/auth-service && npm install && cd ../..
cd services/menu-service && npm install && cd ../..
cd services/order-service && npm install && cd ../..
cd services/table-service && npm install && cd ../..

# Cài đặt frontend admin
cd frontend-admin && npm install && cd ..

# Cài đặt mobile app
cd mobile-app && npm install && cd ..

# Cài đặt scripts
cd scripts && npm install && cd ..
```

## Bước 2: Khởi động MongoDB

```bash
# Dùng Docker (khuyến nghị)
docker run -d -p 27017:27017 --name mongodb mongo:7

# Hoặc khởi động MongoDB local nếu đã cài
mongod
```

## Bước 3: Tạo dữ liệu mẫu

```bash
cd scripts
node seed-data.js
cd ..
```

Bạn sẽ thấy thông tin tài khoản test:

```
┌──────────┬──────────────┬─────────┐
│ Username │ Password     │ Role    │
├──────────┼──────────────┼─────────┤
│ admin    │ admin123     │ ADMIN   │
│ manager  │ manager123   │ MANAGER │
│ waiter   │ waiter123    │ WAITER  │
│ chef     │ chef123      │ CHEF    │
└──────────┴──────────────┴─────────┘
```

## Bước 4: Chạy hệ thống

### Cách 1: Chạy tự động (Windows)

```bash
scripts\start-dev.bat
```

### Cách 2: Chạy thủ công

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

**Terminal 7 - Mobile App (tùy chọn):**
```bash
cd mobile-app
npm start
```

## Bước 5: Kiểm tra

### ✅ Test Web Admin

1. Mở trình duyệt: **http://localhost:3000**
2. Đăng nhập:
   - Username: `admin`
   - Password: `admin123`
3. Thử các chức năng:
   - Xem Dashboard
   - Quản lý Menu
   - Quản lý Đơn hàng
   - Quản lý Bàn
   - Quản lý Nhân viên (chỉ ADMIN)

### ✅ Test Mobile App

1. Quét QR code từ Expo
2. Nhập số bàn: `1`, `2`, hoặc `3`
3. Xem menu và thử đặt món

### ✅ Test API trực tiếp

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"

# Test get menu
curl http://localhost:3000/api/menu

# Test chọn bàn
curl -X POST http://localhost:3000/api/tables/select ^
  -H "Content-Type: application/json" ^
  -d "{\"tableNumber\":\"5\"}"
```

## 🎯 Kịch bản test đầy đủ

### Scenario 1: Khách hàng đặt món (Mobile App)

1. Mở app → Nhập số bàn "5"
2. Xem menu → Chọn "Phở bò" (50,000đ)
3. Thêm "Trà đá" (0đ)
4. Vào giỏ hàng → Đặt hàng
5. Xem trạng thái đơn hàng

### Scenario 2: Nhân viên xử lý đơn (Web Admin)

1. Login với `waiter` / `waiter123`
2. Vào "Quản lý đơn hàng"
3. Xem đơn hàng từ bàn 5
4. Cập nhật trạng thái: PENDING → PREPARING → READY → DELIVERED

### Scenario 3: Admin quản lý (Web Admin)

1. Login với `admin` / `admin123`
2. Vào "Quản lý thực đơn" → Thêm món mới
3. Vào "Quản lý nhân viên" → Tạo tài khoản mới
4. Kiểm tra Dashboard

## ❓ Troubleshooting

### Lỗi: Port đã được sử dụng

```bash
# Tìm process đang dùng port 3000
netstat -ano | findstr :3000

# Kill process (thay <PID> bằng số thực tế)
taskkill /PID <PID> /F
```

### Lỗi: Không kết nối được MongoDB

```bash
# Kiểm tra MongoDB đang chạy
docker ps | findstr mongodb

# Nếu không chạy, khởi động lại
docker start mongodb
```

### Mobile app không kết nối API

Sửa file `mobile-app/src/services/api.js`:
```javascript
// Thay localhost bằng IP máy tính
const API_BASE_URL = 'http://192.168.1.100:3000/api';
```

Tìm IP máy:
```bash
ipconfig
# Tìm IPv4 Address
```

## 📊 Ports đang sử dụng

- 3000: API Gateway
- 3001: Auth Service  
- 3002: Menu Service
- 3003: Order Service
- 3004: Table Service
- 27017: MongoDB

## 🎉 Xong!

Hệ thống đã sẵn sàng. Chúc bạn test vui vẻ!
