# 🔧 Sửa lỗi: Laptop vào được, điện thoại không vào được ngrok

## ❌ Vấn đề
- URL ngrok: `https://unfrothed-sharri-releasible.ngrok-free.dev/table/1`
- ✅ Laptop: Vào được bình thường
- ❌ Điện thoại: Màn hình trắng hoặc ngrok warning page

---

## ✅ Giải pháp đã áp dụng

### 1. Bật proxy trong backend
**File:** `backend/.env`
```env
CUSTOMER_WEB_PROXY=true
CUSTOMER_WEB_PROXY_TARGET=http://127.0.0.1:8081
```

### 2. Thêm ngrok bypass vào backend proxy
**File:** `backend/src/server.ts`
- Thêm header `ngrok-skip-browser-warning: true` vào mọi proxied request

### 3. Tạo index.html với ngrok bypass
**File:** `App/public/index.html`
- Thêm meta tag `ngrok-skip-browser-warning`
- Thêm script để inject header vào mọi fetch request

### 4. Tạo trang test
**File:** `App/public/test.html`
- Trang debug để test API connection từ mobile

---

## 🚀 Cách chạy (QUAN TRỌNG!)

### Bước 1: Restart tất cả services

**Cách 1: Dùng script tự động (Khuyến nghị)**
```powershell
.\restart-all.ps1
```

**Cách 2: Restart thủ công**

Terminal 1 - Backend:
```bash
cd backend
# Nhấn Ctrl+C để dừng
npm run dev
```

Terminal 2 - Expo Web:
```bash
cd App
# Nhấn Ctrl+C để dừng
npm run web
```

### Bước 2: Đợi services khởi động
- Đợi 10-15 giây
- Kiểm tra logs không có lỗi

### Bước 3: Test trên laptop trước
```
http://localhost:3000/api/v1/health
http://localhost:8081
```

---

## 📱 Test trên điện thoại

### Bước 1: Xóa cache browser
**Safari (iOS):**
- Settings > Safari > Clear History and Website Data

**Chrome (Android):**
- Settings > Privacy > Clear browsing data
- Chọn: Cached images and files

### Bước 2: Test trang debug
Mở URL này trên điện thoại:
```
https://unfrothed-sharri-releasible.ngrok-free.dev/test.html?ngrok-skip-browser-warning=true
```

Trang này sẽ:
- ✅ Hiển thị thông tin thiết bị
- ✅ Test API connections
- ✅ Cho phép navigate đến các trang khác

### Bước 3: Nếu test.html hoạt động
Thử các URL sau:

1. **Với bypass parameter:**
```
https://unfrothed-sharri-releasible.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true
```

2. **Không có parameter:**
```
https://unfrothed-sharri-releasible.ngrok-free.dev/table/1
```

### Bước 4: Nếu thấy ngrok warning page
- Click nút "Visit Site"
- Hoặc thêm `?ngrok-skip-browser-warning=true` vào URL

---

## 🔍 Kiểm tra logs

### Backend logs (terminal 1)
Phải thấy dòng này:
```
🔀 Customer web proxy: http://127.0.0.1:8081 (Expo phải đang chạy :8081)
```

Nếu KHÔNG thấy:
- ❌ `CUSTOMER_WEB_PROXY` chưa được set đúng
- ❌ Backend chưa restart sau khi sửa .env

### Expo logs (terminal 2)
Phải thấy:
```
› Metro waiting on exp://...
› Scan the QR code above...
```

Nếu KHÔNG thấy:
- ❌ Expo chưa chạy
- ❌ Port 8081 bị chiếm bởi process khác

---

## 🐛 Debug nếu vẫn lỗi

### 1. Kiểm tra backend có chạy không
```bash
curl http://localhost:3000/api/v1/health
```

Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Server is running"
}
```

### 2. Kiểm tra Expo có chạy không
```bash
curl http://localhost:8081
```

Phải trả về HTML (không phải lỗi)

### 3. Kiểm tra ngrok có hoạt động không
```bash
curl https://unfrothed-sharri-releasible.ngrok-free.dev/api/v1/health
```

### 4. Kiểm tra proxy có hoạt động không
Trên laptop, mở DevTools (F12):
- Truy cập: `https://unfrothed-sharri-releasible.ngrok-free.dev/table/1`
- Tab Network > Xem request đầu tiên
- Headers phải có: `ngrok-skip-browser-warning: true`

### 5. Test từ điện thoại với Chrome Remote Debugging
**Android:**
1. Kết nối điện thoại với laptop qua USB
2. Bật USB Debugging trên điện thoại
3. Mở Chrome trên laptop > `chrome://inspect`
4. Chọn thiết bị > Inspect
5. Xem Console có lỗi gì

**iOS:**
1. Kết nối iPhone với Mac qua USB
2. Mở Safari trên Mac > Develop > [Tên iPhone]
3. Chọn trang web > Xem Console

---

## 🎯 Checklist cuối cùng

Trước khi test trên điện thoại, đảm bảo:

- [ ] Backend đang chạy (port 3000)
- [ ] Expo Web đang chạy (port 8081)
- [ ] File `backend/.env` có `CUSTOMER_WEB_PROXY=true`
- [ ] Backend đã restart SAU KHI sửa .env
- [ ] Backend logs có dòng "Customer web proxy"
- [ ] Test `http://localhost:3000/api/v1/health` OK
- [ ] Test `http://localhost:8081` OK
- [ ] Đã xóa cache browser trên điện thoại
- [ ] Thử URL test.html trước: `/test.html?ngrok-skip-browser-warning=true`

---

## 🔗 URLs để test (theo thứ tự)

1. **Test page (test đầu tiên):**
   ```
   https://unfrothed-sharri-releasible.ngrok-free.dev/test.html?ngrok-skip-browser-warning=true
   ```

2. **Health API:**
   ```
   https://unfrothed-sharri-releasible.ngrok-free.dev/api/v1/health
   ```

3. **Table 1 (với bypass):**
   ```
   https://unfrothed-sharri-releasible.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true
   ```

4. **Table 1 (không bypass):**
   ```
   https://unfrothed-sharri-releasible.ngrok-free.dev/table/1
   ```

---

## 💡 Giải pháp thay thế

### Nếu vẫn không được sau tất cả các bước trên:

**Option 1: Dùng ngrok paid account**
- Không có warning page
- Custom domain
- Ổn định hơn

**Option 2: Dùng LAN IP (không cần ngrok)**
- Chỉ hoạt động khi cùng WiFi
- Xem file: `App/RUN_ON_LAN.md`
- Không có ngrok warning

**Option 3: Deploy lên hosting thật**
- Vercel (frontend)
- Railway/Render (backend)
- Không có giới hạn

---

## 📞 Cần trợ giúp?

Nếu vẫn lỗi, cung cấp thông tin sau:

1. Screenshot màn hình điện thoại
2. Backend logs (terminal 1)
3. Expo logs (terminal 2)
4. Kết quả test từ test.html
5. Browser và OS của điện thoại (iOS/Android, Safari/Chrome)

---

## ✅ Kết quả mong đợi

Sau khi làm đúng các bước:
- ✅ Laptop vào được
- ✅ Điện thoại vào được
- ✅ Không có màn hình trắng
- ✅ Không có ngrok warning page
- ✅ App load menu bình thường
