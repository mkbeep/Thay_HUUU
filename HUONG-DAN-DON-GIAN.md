# 🎯 HƯỚNG DẪN ĐƠN GIẢN - 2 TRƯỜNG HỢP

> **🔧 Đã sửa lỗi:** QR Scanner load liên tục & Admin-web không cập nhật real-time
> 
> Xem chi tiết: [HUONG-DAN-SUA-LOI.md](HUONG-DAN-SUA-LOI.md)

## 📋 KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────┐
│  LAPTOP (Quản lý)                               │
│  ┌──────────────┐      ┌──────────────┐        │
│  │ Admin Web    │─────>│  Backend     │        │
│  │ localhost    │      │  (ngrok URL) │        │
│  │ :5173        │      │  :3000       │        │
│  └──────────────┘      └──────────────┘        │
│                              ▲                  │
│                              │ WebSocket        │
│                              │ Real-time        │
└──────────────────────────────┼──────────────────┘
                               │
┌──────────────────────────────┼──────────────────┐
│  ĐIỆN THOẠI (Khách hàng)     │                  │
│  ┌──────────────┐      ┌─────┴────────┐        │
│  │ Customer App │─────>│  Backend     │        │
│  │ ngrok URL    │      │  qua ngrok   │        │
│  └──────────────┘      └──────────────┘        │
└─────────────────────────────────────────────────┘
```

**✨ Điểm mới:**
- Admin-web chạy localhost NHƯNG kết nối backend qua ngrok
- WebSocket hoạt động real-time qua ngrok
- Không cần public admin-web

---

## 🚀 KHUYẾN NGHỊ: Dùng script tự động

### Script mới (ĐÃ SỬA LỖI):
```powershell
.\START-SIMPLE-NGROK.ps1
```

**Script này sẽ:**
- ✅ Tự động cấu hình admin-web kết nối backend qua ngrok
- ✅ Khởi động backend + ngrok + admin-web
- ✅ WebSocket hoạt động real-time
- ✅ Admin-web cập nhật ngay khi khách đặt món

---

## 🖥️ TRƯỜNG HỢP 1: Chỉ test Admin Web trên laptop (KHÔNG KHUYẾN NGHỊ)

> ⚠️ **Lưu ý:** Cách này admin-web sẽ KHÔNG nhận real-time updates từ khách hàng

### Chạy lệnh:
```powershell
.\START-SIMPLE.ps1
```

### Kết quả:
- ✅ Backend chạy: http://localhost:3000
- ✅ Admin Web chạy: http://localhost:5173
- ✅ Mở browser vào: http://localhost:5173
- ✅ Login:
  - Email: `admin@restaurant.com`
  - Password: `Admin@123456`

### ⚠️ Hạn chế:
- ❌ Không nhận real-time updates từ khách
- ❌ Phải refresh trang để thấy order mới
- ❌ WebSocket không hoạt động

---

## 📱 TRƯỜNG HỢP 2: Test đầy đủ với Real-time (KHUYẾN NGHỊ)

### Cách 1: Script tự động (ĐƠN GIẢN NHẤT)
```powershell
.\START-SIMPLE-NGROK.ps1
```

**Xong! Script sẽ tự động:**
1. Cấu hình admin-web kết nối backend qua ngrok
2. Khởi động backend (port 3000)
3. Khởi động ngrok cho backend
4. Khởi động admin-web (port 5173)

**Truy cập:**
- Admin Web: http://localhost:5173
- Backend Public: https://unfrothed-sharri-releasible.ngrok-free.dev

### Cách 2: Thủ công (nếu muốn kiểm soát từng bước)

#### Bước 1: Cập nhật admin-web\.env
```env
VITE_API_URL=https://unfrothed-sharri-releasible.ngrok-free.dev/api/v1
VITE_CUSTOMER_WEB_URL=https://unfrothed-sharri-releasible.ngrok-free.dev
VITE_SOCKET_URL=https://unfrothed-sharri-releasible.ngrok-free.dev
```

#### Bước 2: Start Backend + Ngrok + Admin-web
```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Ngrok
ngrok http 3000 --domain=unfrothed-sharri-releasible.ngrok-free.dev

# Terminal 3: Admin-web
cd admin-web
npm run dev
```

#### Bước 3: Test Customer App (nếu cần)
```powershell
# Terminal 4: App
cd App
npm start
```

### ✅ Kết quả:
- Admin-web chạy local: http://localhost:5173
- Kết nối backend qua ngrok: https://unfrothed-sharri-releasible.ngrok-free.dev
- WebSocket hoạt động real-time
- Khi khách đặt món → Admin thấy ngay lập tức!

---

## ❓ TẠI SAO ADMIN WEB KHÔNG CẦN PUBLIC?

### Giải pháp CŨ (SAI):
```
❌ Public cả admin-web lên ngrok
❌ Cần 2 domain ngrok (miễn phí chỉ có 1)
❌ Phức tạp, tốn tiền
```

### Giải pháp MỚI (ĐÚNG):
```
✅ Admin-web chạy localhost
✅ Kết nối backend qua ngrok
✅ WebSocket hoạt động qua ngrok URL
✅ Chỉ cần 1 domain ngrok (miễn phí)
```

### Luồng hoạt động:
```
Khách quét QR
    ↓
Backend (ngrok) nhận order
    ↓
Phát WebSocket event
    ↓
Admin-web (localhost) nhận event qua ngrok
    ↓
Cập nhật UI ngay lập tức!
```

---

## 🔧 SỬA LỖI

### ❌ Vấn đề 1: QR Scanner load liên tục
**Đã sửa!** Xem chi tiết: [HUONG-DAN-SUA-LOI.md](HUONG-DAN-SUA-LOI.md)

### ❌ Vấn đề 2: Admin-web không cập nhật real-time
**Đã sửa!** Dùng script `START-SIMPLE-NGROK.ps1`

---

## 📊 BẢNG SO SÁNH

| Thành phần | URL | Ai dùng | Cần public? | Real-time? |
|------------|-----|---------|-------------|------------|
| Backend | localhost:3000 | Nội bộ | ✅ Qua ngrok | - |
| Admin Web | localhost:5173 | Nhân viên | ❌ Không | ✅ Qua ngrok |
| Customer App | ngrok URL | Khách hàng | ✅ Có | ✅ Có |

---

## 🎯 CHECKLIST

### Test Admin Web với Real-time (KHUYẾN NGHỊ):
- [ ] Chạy `.\START-SIMPLE-NGROK.ps1`
- [ ] Mở http://localhost:5173
- [ ] Login thành công
- [ ] Thấy danh sách menu
- [ ] Mở Console (F12) → Tab Network → WS
- [ ] Thấy WebSocket kết nối tới ngrok URL
- [ ] Test: Tạo order mới → Admin thấy ngay lập tức

### Test Customer App (nếu cần):
- [ ] Backend + ngrok đang chạy
- [ ] Mở App trên điện thoại
- [ ] Quét QR code
- [ ] Không bị "đơ" hoặc load liên tục
- [ ] Đặt món thành công
- [ ] Admin-web cập nhật ngay

---

## 💡 LƯU Ý QUAN TRỌNG

1. **Admin Web PHẢI kết nối backend qua ngrok**
   - File `.env` phải trỏ tới ngrok URL
   - Không phải localhost
   - WebSocket mới hoạt động

2. **QR Scanner đã sửa lỗi**
   - Không còn load liên tục
   - Có error handling đầy đủ
   - Có nút "Thử lại" khi lỗi

3. **Backend chỉ cần 1 ngrok domain**
   - Admin-web kết nối qua ngrok
   - Customer App cũng qua ngrok
   - Tiết kiệm chi phí

---

## 🆘 VẪN LỖI?

### Admin Web không hiển thị menu:
```powershell
# Kiểm tra backend có chạy không
curl http://localhost:3000/api/v1/health

# Kiểm tra .env admin-web
type admin-web\.env
```
Phải thấy: `VITE_API_URL=http://localhost:3000/api/v1`

### Customer App xoay mãi:
- ❌ Đang dùng URL ngrok cũ
- ✅ Phải chạy `.\setup-ngrok.ps1` để có URL mới
- ✅ Phải restart Expo sau khi ngrok start
