# Hướng dẫn test ngrok trên điện thoại

## Vấn đề: Laptop vào được, điện thoại không vào được

### Nguyên nhân phổ biến:

1. **Ngrok Warning Page** - Ngrok hiển thị trang cảnh báo trên mobile browser
2. **Cache cũ** - Browser cache trang lỗi cũ
3. **DNS/Network issues** - Mạng điện thoại chặn ngrok

---

## Giải pháp đã áp dụng:

### ✅ 1. Thêm ngrok bypass header vào backend proxy
- File: `backend/src/server.ts`
- Thêm header `ngrok-skip-browser-warning: true` vào mọi response

### ✅ 2. Tạo index.html với meta tag ngrok bypass
- File: `App/public/index.html`
- Thêm meta tag và script để bypass ngrok warning

### ✅ 3. Bật proxy trong backend
- File: `backend/.env`
- Set `CUSTOMER_WEB_PROXY=true`

---

## Các bước kiểm tra:

### Bước 1: Restart backend server
```bash
cd backend
# Nhấn Ctrl+C để dừng server cũ
npm run dev
```

### Bước 2: Restart Expo Web
```bash
cd App
# Nhấn Ctrl+C để dừng Expo cũ
npm run web
```

### Bước 3: Test trên điện thoại

#### A. Xóa cache browser trên điện thoại:
- **Safari (iOS)**: Settings > Safari > Clear History and Website Data
- **Chrome (Android)**: Settings > Privacy > Clear browsing data

#### B. Thử các URL sau (theo thứ tự):

1. **URL với ngrok bypass parameter:**
   ```
   https://unfrothed-sharri-releasible.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true
   ```

2. **URL thông thường:**
   ```
   https://unfrothed-sharri-releasible.ngrok-free.dev/table/1
   ```

3. **Test API endpoint:**
   ```
   https://unfrothed-sharri-releasible.ngrok-free.dev/api/v1/health
   ```

#### C. Nếu vẫn thấy ngrok warning page:
- Click vào nút "Visit Site" trên trang warning
- Hoặc thêm `?ngrok-skip-browser-warning=true` vào URL

---

## Kiểm tra logs:

### Backend logs (terminal chạy backend):
Nên thấy:
```
🔀 Customer web proxy: http://127.0.0.1:8081 (Expo phải đang chạy :8081)
```

### Expo logs (terminal chạy Expo):
Nên thấy:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

---

## Debug thêm:

### 1. Kiểm tra ngrok có hoạt động:
```bash
curl https://unfrothed-sharri-releasible.ngrok-free.dev/api/v1/health
```

Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

### 2. Kiểm tra proxy có hoạt động:
Trên laptop, mở DevTools (F12) > Network tab
- Truy cập: `https://unfrothed-sharri-releasible.ngrok-free.dev/table/1`
- Xem request headers có `ngrok-skip-browser-warning: true` không

### 3. Test trên điện thoại với Chrome DevTools:
- Kết nối điện thoại với laptop qua USB
- Mở Chrome DevTools > Remote devices
- Inspect trang web trên điện thoại
- Xem Console có lỗi gì không

---

## Nếu vẫn không được:

### Giải pháp thay thế 1: Dùng ngrok paid (không có warning page)
```bash
ngrok http 3000 --domain=your-custom-domain.ngrok.app
```

### Giải pháp thay thế 2: Dùng LAN IP thay vì ngrok
- Chỉ hoạt động khi điện thoại và laptop cùng WiFi
- Không cần ngrok
- Xem file: `App/RUN_ON_LAN.md`

### Giải pháp thay thế 3: Deploy lên hosting thật
- Vercel, Netlify, Railway, etc.
- Không có ngrok warning

---

## Checklist cuối cùng:

- [ ] Backend đang chạy (port 3000)
- [ ] Expo Web đang chạy (port 8081)
- [ ] `CUSTOMER_WEB_PROXY=true` trong `backend/.env`
- [ ] Backend đã restart sau khi sửa .env
- [ ] Đã xóa cache browser trên điện thoại
- [ ] Thử URL với `?ngrok-skip-browser-warning=true`
- [ ] Kiểm tra logs backend có thấy proxy message
- [ ] Test API endpoint `/api/v1/health` trước

---

## URL để test:

1. Health check: https://unfrothed-sharri-releasible.ngrok-free.dev/api/v1/health
2. Table 1: https://unfrothed-sharri-releasible.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true
3. Root: https://unfrothed-sharri-releasible.ngrok-free.dev/?ngrok-skip-browser-warning=true
