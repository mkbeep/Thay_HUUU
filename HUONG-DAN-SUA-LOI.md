# 🔧 HƯỚNG DẪN SỬA LỖI

## ❌ Vấn đề 1: QR Scanner Load Liên Tục

### Nguyên nhân:
- Khi quét QR code, app cố gắng mở URL nhưng không xử lý lỗi đúng cách
- Trạng thái "processing" không được reset khi có lỗi
- Không kiểm tra xem URL có thể mở được hay không

### ✅ Đã sửa:
1. **Thêm kiểm tra `canOpenURL`** trước khi mở
2. **Xử lý lỗi chi tiết hơn** với thông báo rõ ràng
3. **Đảm bảo reset trạng thái** `processing` và `scanned` trong mọi trường hợp
4. **Thêm timeout** để tự động đóng scanner sau khi mở URL thành công

### Cách test:
```bash
# 1. Khởi động hệ thống
.\START-SIMPLE-NGROK.ps1

# 2. Mở App trên điện thoại/emulator
cd App
npm start

# 3. Quét QR code từ backend\qr-codes\index.html
# 4. Kiểm tra:
#    - Màn hình scanner không bị "đơ"
#    - Có thông báo lỗi rõ ràng nếu không mở được
#    - Có nút "Thử lại" và "Hủy"
```

---

## ❌ Vấn đề 2: Admin-web Local Không Cập Nhật Real-time

### Nguyên nhân:
- Admin-web chạy `localhost:5173`
- Backend chạy `localhost:3000` nhưng public qua ngrok
- Khách hàng quét QR → truy cập backend qua ngrok
- WebSocket của admin-web kết nối tới `localhost:3000` (không phải ngrok)
- → Admin không nhận được events từ orders của khách

### ❌ Giải pháp SAI (không khả thi):
```
Public cả admin-web lên ngrok
→ Cần 2 domain ngrok (miễn phí chỉ có 1)
→ Phức tạp, tốn tiền
```

### ✅ Giải pháp ĐÚNG (đã áp dụng):
**Admin-web chạy local NHƯNG kết nối tới backend qua ngrok**

```
┌─────────────┐
│  Khách hàng │ quét QR
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Backend (ngrok public)             │
│  https://xxx.ngrok-free.dev         │
│  - REST API                         │
│  - WebSocket Server                 │
└──────┬──────────────────────────────┘
       │
       │ WebSocket events
       │
       ▼
┌─────────────────────────────────────┐
│  Admin-web (localhost:5173)         │
│  Kết nối WebSocket tới ngrok URL    │
│  → Nhận real-time updates!          │
└─────────────────────────────────────┘
```

### Cấu hình:

**File: `admin-web\.env`**
```env
# Kết nối tới backend qua ngrok (không phải localhost)
VITE_API_URL=https://unfrothed-sharri-releasible.ngrok-free.dev/api/v1
VITE_CUSTOMER_WEB_URL=https://unfrothed-sharri-releasible.ngrok-free.dev
VITE_SOCKET_URL=https://unfrothed-sharri-releasible.ngrok-free.dev
```

### Script tự động:
```powershell
# Chạy script này để tự động cấu hình và khởi động
.\START-SIMPLE-NGROK.ps1
```

Script sẽ:
1. ✅ Cập nhật `admin-web\.env` tự động
2. ✅ Khởi động backend (port 3000)
3. ✅ Khởi động ngrok cho backend
4. ✅ Khởi động admin-web (port 5173)

### Cách test:
```bash
# 1. Chạy script
.\START-SIMPLE-NGROK.ps1

# 2. Mở admin-web
# Trình duyệt: http://localhost:5173
# Đăng nhập: admin@restaurant.com / Admin@123456

# 3. Mở App trên điện thoại
cd App
npm start

# 4. Quét QR code và đặt món

# 5. Kiểm tra admin-web
# → Phải thấy order mới xuất hiện NGAY LẬP TỨC!
# → Không cần refresh trang
```

---

## 🎯 Tóm tắt giải pháp

### Vấn đề 1: QR Scanner
- ✅ Thêm error handling đầy đủ
- ✅ Kiểm tra URL trước khi mở
- ✅ Reset trạng thái đúng cách
- ✅ Thông báo lỗi rõ ràng cho user

### Vấn đề 2: Real-time Updates
- ✅ Admin-web local kết nối backend qua ngrok
- ✅ WebSocket hoạt động qua ngrok URL
- ✅ Không cần public admin-web
- ✅ Tiết kiệm chi phí (chỉ cần 1 domain ngrok)

---

## 📋 Checklist kiểm tra

### Backend:
- [ ] Backend chạy trên port 3000
- [ ] Ngrok public backend: `https://unfrothed-sharri-releasible.ngrok-free.dev`
- [ ] WebSocket server hoạt động
- [ ] CORS cho phép ngrok domain

### Admin-web:
- [ ] Chạy trên `http://localhost:5173`
- [ ] File `.env` trỏ tới ngrok URL (không phải localhost)
- [ ] WebSocket kết nối thành công
- [ ] Nhận được events khi có order mới

### App (Mobile):
- [ ] QR Scanner mở được URL
- [ ] Không bị "đơ" khi quét
- [ ] Có thông báo lỗi rõ ràng
- [ ] Có nút "Thử lại" khi lỗi

### Luồng hoàn chỉnh:
- [ ] Khách quét QR → Mở web app
- [ ] Khách đặt món → Order gửi tới backend
- [ ] Admin-web nhận order ngay lập tức (không cần refresh)
- [ ] Âm thanh thông báo phát ra (nếu có)

---

## 🚀 Khởi động nhanh

```powershell
# Cách 1: Script tự động (KHUYẾN NGHỊ)
.\START-SIMPLE-NGROK.ps1

# Cách 2: Thủ công
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Ngrok
ngrok http 3000 --domain=unfrothed-sharri-releasible.ngrok-free.dev

# Terminal 3: Admin-web (sau khi cập nhật .env)
cd admin-web
npm run dev

# Terminal 4: App (nếu cần)
cd App
npm start
```

---

## 🔍 Debug

### Kiểm tra WebSocket:
```javascript
// Mở Console trong admin-web (F12)
// Xem tab Network → WS (WebSocket)
// Phải thấy kết nối tới: wss://unfrothed-sharri-releasible.ngrok-free.dev
```

### Kiểm tra QR Scanner:
```javascript
// Trong App, xem logs:
// Expo Go → Shake device → Debug Remote JS
// Hoặc: npx react-native log-android / log-ios
```

### Kiểm tra Backend:
```bash
# Xem logs backend
cd backend
npm run dev

# Phải thấy:
# ✅ Server running on port 3000
# ✅ WebSocket server initialized
# ✅ Connected to Firebase
```

---

## ❓ FAQ

**Q: Tại sao không public admin-web lên ngrok?**
A: Không cần thiết. Admin-web chạy local nhưng kết nối backend qua ngrok là đủ. Tiết kiệm domain ngrok (miễn phí chỉ có 1).

**Q: WebSocket có hoạt động qua ngrok không?**
A: Có! Ngrok hỗ trợ WebSocket. Chỉ cần đảm bảo `VITE_SOCKET_URL` trỏ tới ngrok URL.

**Q: Tại sao QR Scanner bị "đơ"?**
A: Đã sửa. Nguyên nhân là không xử lý lỗi khi mở URL. Bây giờ có error handling đầy đủ.

**Q: Làm sao biết admin-web đã kết nối WebSocket?**
A: Mở Console (F12) → Tab Network → WS. Phải thấy kết nối tới ngrok URL.

**Q: Có cần restart khi đổi .env không?**
A: Có! Phải restart admin-web (Ctrl+C rồi `npm run dev` lại).

---

## 📞 Hỗ trợ

Nếu vẫn gặp vấn đề:
1. Kiểm tra logs của backend, admin-web, app
2. Kiểm tra file `.env` đã đúng chưa
3. Kiểm tra ngrok có chạy không
4. Kiểm tra WebSocket connection trong Console

---

**Cập nhật:** 2024
**Phiên bản:** 1.0
