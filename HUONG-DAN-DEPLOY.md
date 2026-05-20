# 🚀 HƯỚNG DẪN DEPLOY DỰ ÁN LÊN INTERNET

## 📋 Tổng Quan

Dự án gồm 3 phần cần deploy:
1. **Backend** (Node.js API) → Deploy lên **Render.com** (MIỄN PHÍ)
2. **Admin-web** (React) → Deploy lên **Vercel** (MIỄN PHÍ)
3. **App** (React Web-App) → Deploy lên **Vercel** (MIỄN PHÍ)

---

## 🎯 BƯỚC 1: CHUẨN BỊ GITHUB

### 1.1. Tạo Repository trên GitHub

1. Truy cập https://github.com
2. Đăng nhập tài khoản
3. Click nút **"New"** để tạo repository mới
4. Đặt tên: `restaurant-management-system`
5. Chọn **Public** (để dùng free tier)
6. Click **"Create repository"**

### 1.2. Push Code Lên GitHub

Mở PowerShell trong thư mục dự án và chạy:

```powershell
# Khởi tạo git (nếu chưa có)
git init

# Add tất cả files
git add .

# Commit
git commit -m "Initial commit - Restaurant Management System"

# Thêm remote (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/restaurant-management-system.git

# Push lên GitHub
git branch -M main
git push -u origin main
```

---

## 🔧 BƯỚC 2: DEPLOY BACKEND LÊN RENDER.COM

### 2.1. Tạo Tài Khoản Render

1. Truy cập https://render.com
2. Click **"Get Started"** và đăng ký bằng GitHub
3. Cho phép Render truy cập GitHub repositories

### 2.2. Tạo Web Service

1. Trong Dashboard Render, click **"New +"** → **"Web Service"**
2. Chọn repository `restaurant-management-system`
3. Cấu hình như sau:

**Basic Settings:**
- **Name:** `restaurant-backend`
- **Region:** Singapore (gần Việt Nam nhất)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Instance Type:**
- Chọn **Free** (0$/tháng)

### 2.3. Thêm Environment Variables

Trong phần **Environment**, thêm các biến sau:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Firebase Config (copy từ file backend/.env của bạn)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# CORS Origins (sẽ cập nhật sau khi có URL của admin-web và app)
CORS_ORIGINS=https://your-admin-web.vercel.app,https://your-app.vercel.app
```

### 2.4. Deploy

1. Click **"Create Web Service"**
2. Đợi 5-10 phút để Render build và deploy
3. Sau khi xong, bạn sẽ có URL backend: `https://restaurant-backend.onrender.com`

⚠️ **LƯU Ý:** Free tier của Render sẽ sleep sau 15 phút không hoạt động. Lần đầu truy cập sẽ mất 30-60 giây để wake up.

---

## 🌐 BƯỚC 3: DEPLOY ADMIN-WEB LÊN VERCEL

### 3.1. Tạo Tài Khoản Vercel

1. Truy cập https://vercel.com
2. Click **"Sign Up"** và đăng ký bằng GitHub
3. Cho phép Vercel truy cập GitHub repositories

### 3.2. Import Project

1. Trong Dashboard Vercel, click **"Add New..."** → **"Project"**
2. Chọn repository `restaurant-management-system`
3. Click **"Import"**

### 3.3. Cấu Hình Project

**Framework Preset:** Vite
**Root Directory:** `admin-web`
**Build Command:** `npm run build`
**Output Directory:** `dist`

### 3.4. Thêm Environment Variables

Trong phần **Environment Variables**, thêm:

```
VITE_API_URL=https://restaurant-backend.onrender.com
```

### 3.5. Deploy

1. Click **"Deploy"**
2. Đợi 2-3 phút
3. Sau khi xong, bạn sẽ có URL: `https://your-admin-web.vercel.app`

---

## 📱 BƯỚC 4: DEPLOY APP (WEB-APP) LÊN VERCEL

### 4.1. Import Project Mới

1. Trong Dashboard Vercel, click **"Add New..."** → **"Project"**
2. Chọn lại repository `restaurant-management-system`
3. Click **"Import"**

### 4.2. Cấu Hình Project

**Framework Preset:** Vite
**Root Directory:** `App`
**Build Command:** `npm run build`
**Output Directory:** `dist`

### 4.3. Thêm Environment Variables

```
VITE_API_URL=https://restaurant-backend.onrender.com
VITE_PUBLIC_WEB_URL=https://your-app.vercel.app
```

### 4.4. Deploy

1. Click **"Deploy"**
2. Đợi 2-3 phút
3. Sau khi xong, bạn sẽ có URL: `https://your-app.vercel.app`

---

## 🔄 BƯỚC 5: CẬP NHẬT CORS VÀ URLS

### 5.1. Cập Nhật CORS trong Backend

1. Quay lại Render Dashboard
2. Vào Web Service `restaurant-backend`
3. Vào tab **Environment**
4. Cập nhật biến `CORS_ORIGINS`:

```
CORS_ORIGINS=https://your-admin-web.vercel.app,https://your-app.vercel.app
```

5. Click **"Save Changes"** → Backend sẽ tự động redeploy

### 5.2. Cập Nhật URL trong App

1. Quay lại Vercel Dashboard
2. Vào project `App`
3. Vào **Settings** → **Environment Variables**
4. Cập nhật `VITE_PUBLIC_WEB_URL` với URL thực tế của App
5. Vào tab **Deployments** → Click **"Redeploy"**

---

## 📊 BƯỚC 6: TẠO QR CODE CHO BÀN

### 6.1. Tạo QR Code

Sau khi có URL của App (ví dụ: `https://your-app.vercel.app`), tạo QR code cho từng bàn:

**Bàn 1:** `https://your-app.vercel.app?tableId=1`
**Bàn 2:** `https://your-app.vercel.app?tableId=2`
**Bàn 3:** `https://your-app.vercel.app?tableId=3`
...

### 6.2. Công Cụ Tạo QR Code

Sử dụng một trong các công cụ sau:
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/
- https://qr.io/

---

## ✅ KIỂM TRA HỆ THỐNG

### Test Backend
```bash
curl https://restaurant-backend.onrender.com/health
```

### Test Admin-Web
Truy cập: `https://your-admin-web.vercel.app`
- Đăng nhập với tài khoản admin
- Kiểm tra các chức năng: Menu, Orders, Tables, Staff

### Test App (Web-App)
Truy cập: `https://your-app.vercel.app?tableId=1`
- Quét QR code hoặc truy cập trực tiếp
- Kiểm tra: Xem menu, đặt món, gọi nhân viên

---

## 🎉 HOÀN THÀNH!

Bây giờ bạn đã có:
- ✅ Backend API chạy 24/7 trên Render
- ✅ Admin-web để quản lý nhà hàng
- ✅ App (web-app) cho khách hàng quét QR
- ✅ Tất cả đều MIỄN PHÍ và có HTTPS

---

## 🔧 CẬP NHẬT CODE SAU NÀY

Khi bạn thay đổi code:

```powershell
# Commit changes
git add .
git commit -m "Update features"
git push

# Vercel và Render sẽ TỰ ĐỘNG deploy lại!
```

---

## 💡 LƯU Ý QUAN TRỌNG

### Render Free Tier
- Backend sẽ sleep sau 15 phút không hoạt động
- Lần đầu truy cập sẽ mất 30-60 giây để wake up
- Giới hạn 750 giờ/tháng (đủ dùng)

### Vercel Free Tier
- Băng thông: 100GB/tháng
- Builds: 6000 phút/tháng
- Không giới hạn số lượng projects

### Nâng Cấp (Nếu Cần)
- **Render:** $7/tháng cho instance không sleep
- **Vercel:** Miễn phí là đủ cho hầu hết trường hợp
- **Railway.app:** Thay thế cho Render, $5/tháng

---

## 🆘 TROUBLESHOOTING

### Backend không kết nối được
- Kiểm tra logs trong Render Dashboard
- Đảm bảo Firebase credentials đúng
- Kiểm tra CORS_ORIGINS đã cập nhật chưa

### Admin-web/App không gọi được API
- Kiểm tra VITE_API_URL trong Environment Variables
- Mở DevTools (F12) → Console để xem lỗi
- Đảm bảo backend đã wake up (truy cập trước)

### QR Code không hoạt động
- Kiểm tra URL có đúng format: `?tableId=X`
- Đảm bảo VITE_PUBLIC_WEB_URL đã cập nhật
- Test trực tiếp bằng cách paste URL vào browser

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. Logs trong Render Dashboard (Backend)
2. Build logs trong Vercel Dashboard (Frontend)
3. Browser Console (F12) để xem lỗi JavaScript
4. Network tab để xem API calls

---

**Chúc bạn deploy thành công! 🎊**
