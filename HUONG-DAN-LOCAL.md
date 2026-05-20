# 💻 HƯỚNG DẪN CHẠY LOCAL (KHÔNG DÙNG NGROK)

> **Chạy tất cả trên localhost để test và phát triển**

## 📋 Yêu Cầu

- Node.js 18+
- npm hoặc yarn
- Firebase project đã setup

---

## 🚀 CÁCH 1: Script Tự Động (KHUYẾN NGHỊ)

### Chạy script:
```powershell
.\START-ALL-LOCAL.ps1
```

Script sẽ tự động:
1. ✅ Khởi động Backend (port 3000)
2. ✅ Khởi động Admin-web (port 5173)
3. ✅ Khởi động App (port 8081)
4. ✅ Cấu hình tất cả kết nối localhost

### Truy cập:
- **Backend API:** http://localhost:3000
- **Admin Web:** http://localhost:5173
- **Customer App:** http://localhost:8081

---

## 🔧 CÁCH 2: Chạy Thủ Công

### Bước 1: Cấu hình Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=3000
BACKEND_URL=http://localhost:3000

# Firebase (copy từ Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:8081

# Customer Web
CUSTOMER_WEB_BASE_URL=http://localhost:8081
```

#### Admin-web (.env)
```env
VITE_API_URL=http://localhost:3000
```

#### App (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_PUBLIC_WEB_URL=http://localhost:8081
```

### Bước 2: Cài Đặt Dependencies

```powershell
# Backend
cd backend
npm install

# Admin-web
cd ..\admin-web
npm install

# App
cd ..\App
npm install
```

### Bước 3: Seed Data (Lần đầu tiên)

```powershell
cd backend

# Tạo 20 bàn
npm run seed:tables

# Tạo 50 món ăn
npm run seed:foods
```

### Bước 4: Khởi Động

Mở 3 terminal riêng biệt:

#### Terminal 1: Backend
```powershell
cd backend
npm run dev
```
✅ Backend chạy tại: http://localhost:3000

#### Terminal 2: Admin-web
```powershell
cd admin-web
npm run dev
```
✅ Admin-web chạy tại: http://localhost:5173

#### Terminal 3: App
```powershell
cd App
npm run dev
```
✅ App chạy tại: http://localhost:8081

---

## 🎯 Test Hệ Thống

### 1. Test Backend
```powershell
curl http://localhost:3000/health
```
Kết quả: `{"status":"ok"}`

### 2. Test Admin-web
1. Mở browser: http://localhost:5173
2. Login:
   - Email: `admin@restaurant.com`
   - Password: `Admin@123456`
3. Kiểm tra:
   - ✅ Xem danh sách menu
   - ✅ Xem orders
   - ✅ Quản lý tables
   - ✅ WebSocket real-time

### 3. Test Customer App
1. Mở browser: http://localhost:8081?tableId=1
2. Kiểm tra:
   - ✅ Xem menu
   - ✅ Thêm món vào giỏ
   - ✅ Đặt món
   - ✅ Gọi nhân viên

### 4. Test Real-time
1. Mở Admin-web (http://localhost:5173) → Orders
2. Mở Customer App (http://localhost:8081?tableId=1)
3. Đặt món từ Customer App
4. ✅ Admin-web phải cập nhật ngay lập tức (WebSocket)

---

## 📱 Test QR Code (Local)

### Tạo QR Code cho từng bàn:

**Bàn 1:** http://localhost:8081?tableId=1
**Bàn 2:** http://localhost:8081?tableId=2
**Bàn 3:** http://localhost:8081?tableId=3

### Công cụ tạo QR:
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/

### Lưu ý:
- ⚠️ QR code localhost chỉ hoạt động trên cùng mạng WiFi
- ⚠️ Điện thoại phải kết nối cùng WiFi với laptop
- ⚠️ Để test từ điện thoại khác mạng → Xem [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md)

---

## 🔧 Troubleshooting

### Backend không khởi động
```powershell
# Kiểm tra port 3000 có bị chiếm không
netstat -ano | findstr :3000

# Kill process nếu cần
taskkill /PID <PID> /F
```

### Admin-web không kết nối Backend
1. Kiểm tra Backend đang chạy: http://localhost:3000/health
2. Kiểm tra file `admin-web\.env`:
   ```
   VITE_API_URL=http://localhost:3000
   ```
3. Restart admin-web sau khi sửa .env

### App không kết nối Backend
1. Kiểm tra file `App\.env`:
   ```
   VITE_API_URL=http://localhost:3000
   VITE_PUBLIC_WEB_URL=http://localhost:8081
   ```
2. Restart App sau khi sửa .env

### WebSocket không hoạt động
1. Mở DevTools (F12) → Console
2. Kiểm tra có lỗi WebSocket không
3. Đảm bảo Backend đang chạy
4. Kiểm tra CORS_ORIGIN trong backend/.env

### Port bị chiếm
```powershell
# Kiểm tra port
netstat -ano | findstr :3000
netstat -ano | findstr :5173
netstat -ano | findstr :8081

# Kill process
taskkill /PID <PID> /F
```

---

## 💡 Lưu Ý

### Chế độ Local vs Production

| Tính năng | Local | Production |
|-----------|-------|------------|
| URL | localhost | Domain thật |
| HTTPS | Không | Có |
| CORS | Mở rộng | Giới hạn |
| Database | Firebase | Firebase |
| WebSocket | localhost | WSS (secure) |

### Khi nào dùng Local?
- ✅ Phát triển tính năng mới
- ✅ Debug và test
- ✅ Học tập và thử nghiệm
- ✅ Demo trong cùng mạng WiFi

### Khi nào cần Deploy?
- ✅ Khách hàng thật sử dụng
- ✅ Test từ nhiều địa điểm khác nhau
- ✅ Cần HTTPS và bảo mật
- ✅ Sử dụng lâu dài

---

## 🚀 Bước Tiếp Theo

Sau khi test local thành công, deploy lên internet:

1. Đọc [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md)
2. Push code lên GitHub
3. Deploy Backend lên Render.com
4. Deploy Admin-web lên Vercel
5. Deploy App lên Vercel

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong terminal
2. Mở DevTools (F12) → Console
3. Kiểm tra Network tab
4. Đọc file TROUBLESHOOTING.md

---

**Chúc bạn phát triển thành công! 💪**
