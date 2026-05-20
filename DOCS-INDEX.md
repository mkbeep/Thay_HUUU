# 📚 TÀI LIỆU DỰ ÁN - INDEX

## 🎯 BẮT ĐẦU TỪ ĐÂY

### ⭐ [BAT-DAU-O-DAY.md](./BAT-DAU-O-DAY.md)
**Điểm khởi đầu cho mọi người!**
- Tổng quan dự án
- Chọn workflow phù hợp
- Quick start guides

---

## 📖 HƯỚNG DẪN CHÍNH (KHUYẾN NGHỊ)

### 1. 💻 [HUONG-DAN-LOCAL.md](./HUONG-DAN-LOCAL.md)
**Chạy dự án trên localhost**
- Setup môi trường local
- Chạy Backend + Admin-web + App
- Test trên máy tính
- Script: `START-ALL-LOCAL.ps1`

### 2. 🚀 [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md)
**Deploy lên Internet (Production)**
- Push code lên GitHub
- Deploy Backend lên Render.com
- Deploy Admin-web lên Vercel
- Deploy App lên Vercel
- Tạo QR codes
- Script: `DEPLOY-QUICK-START.ps1`

### 3. 📋 [README.md](./README.md)
**Tổng quan dự án**
- Tính năng
- Kiến trúc
- Tech stack
- Screenshots

### 4. 🔧 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
**Giải quyết vấn đề**
- Backend issues
- Frontend issues
- Database issues
- Deployment issues
- Network issues

---

## 📝 HƯỚNG DẪN PHỤ

### [HUONG-DAN-CHAY-DAY-DU.md](./HUONG-DAN-CHAY-DAY-DU.md)
Chi tiết từng bước setup và chạy dự án

### [HUONG-DAN-DON-GIAN.md](./HUONG-DAN-DON-GIAN.md)
Hướng dẫn đơn giản cho người mới (có phần ngrok cũ)

---

## ⚠️ FILES LỖI THỜI (KHÔNG DÙNG)

### [DEPRECATED-NGROK-FILES.md](./DEPRECATED-NGROK-FILES.md)
**Danh sách files ngrok đã lỗi thời**

Các files sau **KHÔNG NÊN DÙNG** nữa:
- `START-WITH-NGROK.ps1`
- `START-SIMPLE-NGROK.ps1`
- `update-ip.ps1`
- `setup-ngrok.ps1`
- `FIX-MOBILE-NGROK.md`
- `FIX-NGROK-OFFLINE.md`
- `HUONG-DAN-CAP-NHAT-IP.md`
- `test-ngrok-mobile.md`
- `QUICK-FIX.md`

**Lý do:** Ngrok lag, không ổn định, phức tạp

**Thay thế:**
- Local: `START-ALL-LOCAL.ps1`
- Production: Deploy lên Render + Vercel

---

## 🗂️ CẤU TRÚC TÀI LIỆU

```
docs/
│
├── 🎯 BẮT ĐẦU
│   └── BAT-DAU-O-DAY.md          ⭐ Điểm khởi đầu
│
├── 📖 HƯỚNG DẪN CHÍNH
│   ├── HUONG-DAN-LOCAL.md        💻 Chạy local
│   ├── HUONG-DAN-DEPLOY.md       🚀 Deploy production
│   ├── README.md                  📋 Tổng quan
│   └── TROUBLESHOOTING.md         🔧 Giải quyết vấn đề
│
├── 📝 HƯỚNG DẪN PHỤ
│   ├── HUONG-DAN-CHAY-DAY-DU.md
│   └── HUONG-DAN-DON-GIAN.md
│
└── ⚠️ DEPRECATED (Không dùng)
    ├── DEPRECATED-NGROK-FILES.md
    ├── FIX-MOBILE-NGROK.md
    ├── FIX-NGROK-OFFLINE.md
    ├── HUONG-DAN-CAP-NHAT-IP.md
    ├── test-ngrok-mobile.md
    └── QUICK-FIX.md
```

---

## 🎯 WORKFLOW KHUYẾN NGHỊ

### Cho Developer Mới:
```
1. Đọc BAT-DAU-O-DAY.md
   ↓
2. Đọc HUONG-DAN-LOCAL.md
   ↓
3. Chạy START-ALL-LOCAL.ps1
   ↓
4. Test trên localhost
   ↓
5. Đọc HUONG-DAN-DEPLOY.md (khi cần)
```

### Cho Developer Có Kinh Nghiệm:
```
1. Đọc README.md (tổng quan)
   ↓
2. Setup local hoặc deploy ngay
   ↓
3. Tham khảo TROUBLESHOOTING.md khi cần
```

---

## 📊 BẢNG CHỌN TÀI LIỆU

| Mục đích | Đọc file | Script |
|----------|----------|--------|
| Bắt đầu | BAT-DAU-O-DAY.md | - |
| Chạy local | HUONG-DAN-LOCAL.md | START-ALL-LOCAL.ps1 |
| Deploy | HUONG-DAN-DEPLOY.md | DEPLOY-QUICK-START.ps1 |
| Hiểu dự án | README.md | - |
| Sửa lỗi | TROUBLESHOOTING.md | - |
| Chi tiết | HUONG-DAN-CHAY-DAY-DU.md | - |

---

## 🔍 TÌM KIẾM NHANH

### Tôi muốn...

**...chạy thử trên máy tính**
→ [HUONG-DAN-LOCAL.md](./HUONG-DAN-LOCAL.md)

**...deploy lên internet**
→ [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md)

**...hiểu dự án hoạt động thế nào**
→ [README.md](./README.md)

**...sửa lỗi**
→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

**...bắt đầu từ đầu**
→ [BAT-DAU-O-DAY.md](./BAT-DAU-O-DAY.md)

---

## 📞 HỖ TRỢ

Nếu không tìm thấy thông tin cần thiết:
1. Kiểm tra [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Đọc lại [BAT-DAU-O-DAY.md](./BAT-DAU-O-DAY.md)
3. Liên hệ support

---

## 🔄 CẬP NHẬT

**Phiên bản:** 2.0 (Bỏ ngrok, dùng Render + Vercel)

**Thay đổi chính:**
- ✅ Thêm hướng dẫn deploy production
- ✅ Bỏ ngrok (lag, không ổn định)
- ✅ Thêm script tự động
- ✅ Cải thiện documentation
- ✅ Thêm troubleshooting chi tiết

**Ngày cập nhật:** 20/05/2026

---

**Happy Coding! 🚀**
