# 🔧 TROUBLESHOOTING - GIẢI QUYẾT VẤN ĐỀ

## 📋 Mục Lục
- [Backend Issues](#backend-issues)
- [Admin-web Issues](#admin-web-issues)
- [Customer App Issues](#customer-app-issues)
- [Database Issues](#database-issues)
- [Deployment Issues](#deployment-issues)
- [Network Issues](#network-issues)

---

## 🔴 Backend Issues

### ❌ Backend không khởi động

**Triệu chứng:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Nguyên nhân:** Port 3000 đã bị chiếm

**Giải pháp:**
```powershell
# Tìm process đang dùng port 3000
netstat -ano | findstr :3000

# Kill process (thay <PID> bằng số PID tìm được)
taskkill /PID <PID> /F

# Hoặc đổi port trong backend/.env
PORT=3001
```

---

### ❌ Firebase Connection Error

**Triệu chứng:**
```
Error: Could not load the default credentials
```

**Nguyên nhân:** Firebase credentials không đúng

**Giải pháp:**
1. Kiểm tra file `backend/.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   ```

2. Lấy credentials mới từ Firebase Console:
   - Vào Project Settings → Service Accounts
   - Click "Generate new private key"
   - Copy thông tin vào `.env`

3. Restart backend

---

### ❌ JWT Secret Error

**Triệu chứng:**
```
Error: JWT_SECRET is not defined
```

**Giải pháp:**
```env
# Thêm vào backend/.env
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
```

---

## 🔵 Admin-web Issues

### ❌ Admin-web không kết nối Backend

**Triệu chứng:**
- Trang trắng
- Console error: `Network Error`
- Không load được menu

**Giải pháp:**

1. **Kiểm tra Backend đang chạy:**
   ```powershell
   curl http://localhost:3000/health
   ```
   Phải trả về: `{"status":"ok"}`

2. **Kiểm tra file `admin-web/.env`:**
   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. **Restart admin-web:**
   ```powershell
   cd admin-web
   npm run dev
   ```

4. **Kiểm tra CORS trong `backend/.env`:**
   ```env
   CORS_ORIGIN=http://localhost:5173,http://localhost:8081
   ```

---

### ❌ Login không thành công

**Triệu chứng:**
- Nhập đúng email/password nhưng không vào được
- Error: `Invalid credentials`

**Giải pháp:**

1. **Kiểm tra tài khoản admin đã tạo chưa:**
   ```powershell
   cd backend
   npm run seed:admin
   ```

2. **Thử tài khoản mặc định:**
   - Email: `admin@restaurant.com`
   - Password: `Admin@123456`

3. **Kiểm tra Firebase Console:**
   - Vào Authentication
   - Xem user có tồn tại không

---

### ❌ WebSocket không hoạt động

**Triệu chứng:**
- Orders không cập nhật real-time
- Phải refresh trang để thấy order mới

**Giải pháp:**

1. **Mở DevTools (F12) → Console:**
   Tìm lỗi WebSocket

2. **Kiểm tra Backend WebSocket:**
   ```javascript
   // Trong backend logs phải thấy:
   WebSocket server is running
   ```

3. **Kiểm tra CORS:**
   ```env
   # backend/.env
   CORS_ORIGIN=http://localhost:5173,http://localhost:8081
   ```

4. **Restart cả Backend và Admin-web**

---

## 🟢 Customer App Issues

### ❌ App không load menu

**Triệu chứng:**
- Trang trắng
- Loading mãi không dừng
- Console error

**Giải pháp:**

1. **Kiểm tra Backend:**
   ```powershell
   curl http://localhost:3000/api/v1/foods
   ```

2. **Kiểm tra file `App/.env`:**
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_PUBLIC_WEB_URL=http://localhost:8081
   ```

3. **Restart App:**
   ```powershell
   cd App
   npm run dev
   ```

---

### ❌ QR Scanner không hoạt động

**Triệu chứng:**
- Quét QR code không chuyển trang
- Lỗi camera

**Giải pháp:**

1. **Kiểm tra URL trong QR code:**
   ```
   http://localhost:8081?tableId=1
   ```

2. **Test trực tiếp bằng URL:**
   Paste URL vào browser

3. **Kiểm tra camera permission:**
   - Browser phải có quyền truy cập camera
   - HTTPS required (production)

---

### ❌ Đặt món không thành công

**Triệu chứng:**
- Click "Đặt món" không có gì xảy ra
- Error trong console

**Giải pháp:**

1. **Kiểm tra tableId:**
   ```
   URL phải có: ?tableId=1
   ```

2. **Kiểm tra Backend logs:**
   ```powershell
   cd backend
   npm run dev
   # Xem logs khi đặt món
   ```

3. **Kiểm tra Firebase:**
   - Vào Firestore
   - Xem collection `orders`

---

## 🟡 Database Issues

### ❌ Không có data trong database

**Triệu chứng:**
- Menu trống
- Không có bàn
- Không có staff

**Giải pháp:**

1. **Seed data:**
   ```powershell
   cd backend
   npm run seed:tables    # Tạo 20 bàn
   npm run seed:foods     # Tạo 50 món ăn
   npm run seed:admin     # Tạo admin user
   ```

2. **Kiểm tra Firebase Console:**
   - Vào Firestore Database
   - Xem các collections: `foods`, `tables`, `users`

---

### ❌ Firebase quota exceeded

**Triệu chứng:**
```
Error: Quota exceeded
```

**Giải pháp:**

1. **Kiểm tra Firebase Console → Usage:**
   - Reads/Writes/Deletes
   - Storage

2. **Nâng cấp plan hoặc chờ reset quota**

3. **Optimize queries:**
   - Thêm indexes
   - Giảm số lần query

---

## 🟣 Deployment Issues

### ❌ Render deployment failed

**Triệu chứng:**
- Build failed
- Deploy failed

**Giải pháp:**

1. **Kiểm tra logs trong Render Dashboard**

2. **Kiểm tra Environment Variables:**
   - Tất cả biến cần thiết đã thêm chưa
   - Firebase credentials đúng chưa

3. **Kiểm tra build command:**
   ```
   npm install && npm run build
   ```

4. **Kiểm tra start command:**
   ```
   npm start
   ```

---

### ❌ Vercel deployment failed

**Triệu chứng:**
- Build error
- Deploy error

**Giải pháp:**

1. **Kiểm tra Root Directory:**
   - Admin-web: `admin-web`
   - App: `App`

2. **Kiểm tra Build Command:**
   ```
   npm run build
   ```

3. **Kiểm tra Output Directory:**
   ```
   dist
   ```

4. **Kiểm tra Environment Variables:**
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

---

### ❌ CORS error sau khi deploy

**Triệu chứng:**
```
Access to fetch at 'https://backend.com' from origin 'https://frontend.com' has been blocked by CORS policy
```

**Giải pháp:**

1. **Cập nhật CORS_ORIGIN trong Render:**
   ```
   CORS_ORIGIN=https://your-admin.vercel.app,https://your-app.vercel.app
   ```

2. **Redeploy backend**

3. **Clear browser cache**

---

## 🔶 Network Issues

### ❌ Slow response time

**Triệu chứng:**
- API chậm
- Trang load lâu

**Giải pháp:**

1. **Kiểm tra network trong DevTools:**
   - F12 → Network tab
   - Xem request nào chậm

2. **Optimize queries:**
   - Thêm indexes trong Firestore
   - Cache data

3. **Check Render instance:**
   - Free tier có thể sleep
   - Upgrade nếu cần

---

### ❌ WebSocket disconnected

**Triệu chứng:**
```
WebSocket connection failed
```

**Giải pháp:**

1. **Kiểm tra Backend WebSocket:**
   ```javascript
   // Backend logs
   WebSocket server is running on port 3000
   ```

2. **Kiểm tra firewall:**
   - Cho phép WebSocket connections
   - Port 3000 mở

3. **Restart Backend**

---

## 🛠️ General Debugging Tips

### 1. Kiểm tra logs
```powershell
# Backend logs
cd backend
npm run dev

# Admin-web logs
cd admin-web
npm run dev

# App logs
cd App
npm run dev
```

### 2. Kiểm tra DevTools
- F12 → Console (xem errors)
- F12 → Network (xem API calls)
- F12 → Application → Local Storage (xem data)

### 3. Kiểm tra Environment Variables
```powershell
# Backend
type backend\.env

# Admin-web
type admin-web\.env

# App
type App\.env
```

### 4. Clear cache
```powershell
# Clear npm cache
npm cache clean --force

# Clear browser cache
Ctrl + Shift + Delete
```

### 5. Reinstall dependencies
```powershell
# Backend
cd backend
rm -rf node_modules
npm install

# Admin-web
cd admin-web
rm -rf node_modules
npm install

# App
cd App
rm -rf node_modules
npm install
```

---

## 📞 Vẫn Không Giải Quyết Được?

### Checklist cuối cùng:
- [ ] Node.js version >= 18
- [ ] npm version >= 8
- [ ] Firebase credentials đúng
- [ ] All .env files configured
- [ ] Backend running
- [ ] CORS configured
- [ ] Ports not blocked
- [ ] Internet connection stable

### Liên hệ hỗ trợ:
- 📧 Email: support@example.com
- 🐛 GitHub Issues
- 📚 Đọc lại docs

---

**Good luck! 🍀**
