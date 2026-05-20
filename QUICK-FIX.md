# ⚡ QUICK FIX - Điện thoại không vào được ngrok

## 🚨 Vấn đề
Laptop vào được, điện thoại màn hình trắng

---

## ✅ Giải pháp nhanh (3 bước)

### 1️⃣ Restart services
```powershell
.\restart-all.ps1
```
Hoặc thủ công:
- Terminal 1: `cd backend && npm run dev`
- Terminal 2: `cd App && npm run web`

### 2️⃣ Xóa cache điện thoại
- **iOS**: Settings > Safari > Clear History
- **Android**: Chrome > Settings > Clear browsing data

### 3️⃣ Test URL này TRƯỚC:
```
https://unfrothed-sharri-releasible.ngrok-free.dev/test.html?ngrok-skip-browser-warning=true
```

Nếu test.html OK → Thử:
```
https://unfrothed-sharri-releasible.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true
```

---

## 🔍 Kiểm tra nhanh

### Backend logs phải có:
```
🔀 Customer web proxy: http://127.0.0.1:8081
```

### Nếu KHÔNG có → Sửa:
```env
# File: backend/.env
CUSTOMER_WEB_PROXY=true
```
Sau đó restart backend!

---

## 📱 Nếu thấy ngrok warning page
→ Click "Visit Site" hoặc thêm `?ngrok-skip-browser-warning=true`

---

## 🆘 Vẫn lỗi?
Xem hướng dẫn chi tiết: `FIX-MOBILE-NGROK.md`
