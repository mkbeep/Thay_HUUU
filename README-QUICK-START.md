# ⚡ QUICK START - Restaurant QR System

## 🚀 Chạy 1 lệnh duy nhất:

```powershell
.\START-ALL-COMPLETE.ps1
```

## ⏳ Đợi 30 giây, sau đó:

### 1. Xem terminal NGROK, lấy URL mới:
```
https://abc-xyz-NEW.ngrok-free.dev
```

### 2. Restart Expo App:
- Terminal "EXPO APP" → Ctrl+C
- Chạy: `npm run start`

### 3. Restart Admin Web:
- Terminal "ADMIN WEB" → Ctrl+C
- Chạy: `npm run dev`

## 📱 Test trên điện thoại:

```
https://NEW-URL.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true
```

---

## 📚 Xem hướng dẫn chi tiết:
- `HUONG-DAN-CHAY-DAY-DU.md` - Hướng dẫn đầy đủ
- `FIX-NGROK-OFFLINE.md` - Sửa lỗi ngrok offline
- `QUICK-FIX.md` - Sửa lỗi nhanh

---

## ❓ Vấn đề thường gặp:

### Màn hình trắng "Đang tải thực đơn..."
→ URL ngrok cũ đã offline, chạy lại script trên

### Admin web "Chưa có món ăn nào"
→ Chưa restart admin-web sau khi ngrok start

### Lỗi ERR_NGROK_3200
→ Ngrok đã timeout, chạy lại script

---

## 🎯 Kết quả mong đợi:

✅ Backend: http://localhost:3000
✅ Expo App: http://localhost:8081
✅ Admin Web: http://localhost:5173
✅ Ngrok: https://NEW-URL.ngrok-free.dev
✅ Mobile: Vào được menu đầy đủ
