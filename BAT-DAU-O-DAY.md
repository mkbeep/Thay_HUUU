# 🎯 BẮT ĐẦU TỪ ĐÂY

Chào mừng đến với **Restaurant Management System**! 🍽️

## 📚 Bạn muốn làm gì?

### 1️⃣ Chạy thử trên máy tính (Local Development)
**Mục đích:** Test, phát triển tính năng, học tập

👉 **Đọc:** [HUONG-DAN-LOCAL.md](./HUONG-DAN-LOCAL.md)

**Quick Start:**
```powershell
.\START-ALL-LOCAL.ps1
```

**Kết quả:**
- Backend: http://localhost:3000
- Admin Web: http://localhost:5173
- Customer App: http://localhost:8081

---

### 2️⃣ Deploy lên Internet (Production)
**Mục đích:** Khách hàng thật sử dụng, có URL công khai

👉 **Đọc:** [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md)

**Quick Start:**
```powershell
# Bước 1: Push code lên GitHub
.\DEPLOY-QUICK-START.ps1

# Bước 2: Deploy từng service (xem hướng dẫn chi tiết)
```

**Kết quả:**
- Backend: https://your-backend.onrender.com
- Admin Web: https://your-admin.vercel.app
- Customer App: https://your-app.vercel.app

---

### 3️⃣ Hiểu kiến trúc hệ thống
**Mục đích:** Tìm hiểu cách hoạt động, customize

👉 **Đọc:** [README.md](./README.md)

**Nội dung:**
- Tổng quan dự án
- Kiến trúc hệ thống
- Tech stack
- Tính năng

---

## 🗂️ Cấu Trúc Dự Án

```
restaurant-management-system/
│
├── backend/              # Node.js + Express API
│   ├── src/             # Source code
│   ├── scripts/         # Seed data scripts
│   └── .env             # Environment variables
│
├── admin-web/           # React Admin Dashboard
│   ├── src/             # Source code
│   └── .env             # Environment variables
│
├── App/                 # React Customer Web-App
│   ├── src/             # Source code
│   └── .env             # Environment variables
│
└── docs/                # Documentation
    ├── HUONG-DAN-LOCAL.md        # Chạy local
    ├── HUONG-DAN-DEPLOY.md       # Deploy production
    ├── HUONG-DAN-CHAY-DAY-DU.md  # Chi tiết đầy đủ
    └── README.md                  # Tổng quan
```

---

## 🚀 Quick Start (Chọn 1 trong 2)

### Option A: Local Development
```powershell
# 1. Cài dependencies
cd backend && npm install
cd ../admin-web && npm install
cd ../App && npm install

# 2. Seed data (lần đầu)
cd backend
npm run seed:tables
npm run seed:foods

# 3. Khởi động tất cả
cd ..
.\START-ALL-LOCAL.ps1
```

### Option B: Deploy to Production
```powershell
# 1. Push to GitHub
.\DEPLOY-QUICK-START.ps1

# 2. Deploy services (theo hướng dẫn)
# - Backend → Render.com
# - Admin-web → Vercel
# - App → Vercel
```

---

## 📖 Tài Liệu Chi Tiết

| File | Mục đích | Độ khó |
|------|----------|--------|
| [BAT-DAU-O-DAY.md](./BAT-DAU-O-DAY.md) | Điểm bắt đầu | ⭐ |
| [HUONG-DAN-LOCAL.md](./HUONG-DAN-LOCAL.md) | Chạy local | ⭐⭐ |
| [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md) | Deploy production | ⭐⭐⭐ |
| [HUONG-DAN-CHAY-DAY-DU.md](./HUONG-DAN-CHAY-DAY-DU.md) | Chi tiết từng bước | ⭐⭐⭐⭐ |
| [README.md](./README.md) | Tổng quan dự án | ⭐⭐ |

---

## ⚠️ Lưu Ý Quan Trọng

### ❌ KHÔNG dùng ngrok nữa!
Các file sau đã lỗi thời:
- `START-WITH-NGROK.ps1`
- `START-SIMPLE-NGROK.ps1`
- `update-ip.ps1`

Xem: [DEPRECATED-NGROK-FILES.md](./DEPRECATED-NGROK-FILES.md)

### ✅ Dùng giải pháp mới:
- **Local:** `START-ALL-LOCAL.ps1`
- **Production:** Deploy lên Render + Vercel

---

## 🎯 Workflow Khuyến Nghị

### Cho Developer:
```
1. Chạy local để phát triển
   ↓
2. Test trên localhost
   ↓
3. Push code lên GitHub
   ↓
4. Auto-deploy lên production
   ↓
5. Test trên production URL
```

### Cho End User:
```
1. Quét QR code trên bàn
   ↓
2. Xem menu và đặt món
   ↓
3. Nhân viên nhận order real-time
   ↓
4. Xử lý và phục vụ
```

---

## 🔧 Yêu Cầu Hệ Thống

### Development (Local):
- ✅ Node.js 18+
- ✅ npm hoặc yarn
- ✅ Firebase project
- ✅ Git (để push code)

### Production (Deploy):
- ✅ GitHub account (miễn phí)
- ✅ Render.com account (miễn phí)
- ✅ Vercel account (miễn phí)
- ✅ Firebase project (miễn phí)

---

## 🆘 Gặp Vấn Đề?

### Backend không chạy:
```powershell
# Kiểm tra port
netstat -ano | findstr :3000

# Kiểm tra logs
cd backend
npm run dev
```

### Admin-web không kết nối:
1. Kiểm tra Backend đang chạy
2. Kiểm tra file `.env`:
   ```
   VITE_API_URL=http://localhost:3000
   ```
3. Restart admin-web

### App không hoạt động:
1. Kiểm tra Backend đang chạy
2. Kiểm tra file `.env`:
   ```
   VITE_API_URL=http://localhost:3000
   VITE_PUBLIC_WEB_URL=http://localhost:8081
   ```
3. Restart App

### Vẫn không được?
- Đọc [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Kiểm tra logs trong terminal
- Mở DevTools (F12) → Console

---

## 📞 Liên Hệ & Hỗ Trợ

- 📧 Email: support@example.com
- 🐛 Issues: GitHub Issues
- 📚 Docs: Các file .md trong thư mục này

---

## 🎉 Bắt Đầu Ngay!

### Bước 1: Chọn mục đích
- [ ] Chạy local → Đọc [HUONG-DAN-LOCAL.md](./HUONG-DAN-LOCAL.md)
- [ ] Deploy production → Đọc [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md)

### Bước 2: Làm theo hướng dẫn
- [ ] Cài đặt dependencies
- [ ] Cấu hình environment variables
- [ ] Khởi động services

### Bước 3: Test
- [ ] Backend API hoạt động
- [ ] Admin-web đăng nhập được
- [ ] Customer App đặt món được
- [ ] Real-time updates hoạt động

### Bước 4: Enjoy! 🎊
- [ ] Hệ thống chạy ổn định
- [ ] Khách hàng sử dụng được
- [ ] Nhân viên quản lý được

---

**Chúc bạn thành công! 🚀**

Made with ❤️ for Restaurant Management
