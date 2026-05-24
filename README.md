# 🍽️ Hệ Thống Quản Lý Nhà Hàng QR

Hệ thống đặt món qua QR code cho nhà hàng, chạy hoàn toàn trên mạng WiFi local.

## 🚀 Khởi Động Nhanh

### Bước 1: Cài đặt dependencies (chỉ lần đầu)
```powershell
# Backend
cd backend
npm install

# Admin Web
cd ..\admin-web
npm install

# Customer App
cd ..\App
npm install
```

### Bước 2: Seed dữ liệu (chỉ lần đầu)
```powershell
cd backend
npm run seed:tables    # Tạo 20 bàn
npm run seed:foods     # Tạo 50 món ăn
```

### Bước 3: Khởi động hệ thống
```powershell
# Từ thư mục gốc
.\START-ALL-LOCAL.ps1
```

Script sẽ tự động:
- ✅ Cập nhật IP WiFi hiện tại (192.168.110.67)
- ✅ Khởi động Backend (port 3000)
- ✅ Khởi động Admin Web (port 5173)
- ✅ Khởi động Customer App (port 8081)

## 📱 Truy Cập

### Từ máy tính:
- **Backend API:** http://192.168.110.67:3000
- **Admin Web:** http://192.168.110.67:5173
- **Customer App:** http://192.168.110.67:8081

### Từ điện thoại (cùng WiFi):
- **Quét QR hoặc truy cập:** http://192.168.110.67:8081?tableId=1

## 🔐 Đăng Nhập Admin

- **Email:** admin@restaurant.com
- **Password:** Admin@123456

## 📋 Tạo QR Code

Tạo QR code cho từng bàn với URL:
- Bàn 1: `http://192.168.110.67:8081?tableId=1`
- Bàn 2: `http://192.168.110.67:8081?tableId=2`
- Bàn 3: `http://192.168.110.67:8081?tableId=3`
- ...

Công cụ tạo QR miễn phí:
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/

## 📁 Cấu Trúc Dự Án

```
Thay_HUUU/
├── backend/          # Node.js + Express API
├── admin-web/        # React Admin Dashboard
├── App/              # React Customer App
└── START-ALL-LOCAL.ps1  # Script khởi động
```

## 🔧 Cấu Hình IP

Nếu IP WiFi thay đổi, chỉnh sửa trong file:
- `backend/.env` → BACKEND_URL, CORS_ORIGIN, CUSTOMER_WEB_BASE_URL
- `admin-web/.env` → VITE_API_URL, VITE_SOCKET_URL
- `App/.env` → EXPO_PUBLIC_API_URL, REACT_NATIVE_PACKAGER_HOSTNAME

Hoặc chỉnh trong script `START-ALL-LOCAL.ps1` dòng:
```powershell
$wifiIp = "192.168.110.67"  # Thay IP của bạn
```

## ⚠️ Lưu Ý

- Máy tính và điện thoại phải cùng WiFi
- Nếu firewall chặn, thêm rule cho port 3000, 5173, 8081
- Nếu đổi WiFi, phải tạo lại QR code với IP mới

## 📚 Tài Liệu Chi Tiết

- [HUONG-DAN-LOCAL.md](./HUONG-DAN-LOCAL.md) - Hướng dẫn chi tiết
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Xử lý lỗi

## 🛠️ Công Nghệ

- **Backend:** Node.js, Express, Firebase
- **Admin Web:** React, Vite, TailwindCSS
- **Customer App:** React, Expo
- **Database:** Firebase Firestore
- **Real-time:** WebSocket

---

**Chúc bạn sử dụng thành công! 🎉**
