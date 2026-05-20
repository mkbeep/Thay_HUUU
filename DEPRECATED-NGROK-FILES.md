# ⚠️ CÁC FILE NGROK ĐÃ LỖI THỜI

Các file sau đây liên quan đến ngrok và **KHÔNG NÊN SỬ DỤNG** nữa:

## ❌ Files Deprecated:
- `START-WITH-NGROK.ps1` - Script cũ dùng ngrok
- `START-SIMPLE-NGROK.ps1` - Script cũ dùng ngrok
- `update-ip.ps1` - Script cập nhật IP cho ngrok
- `setup-ngrok.ps1` - Script setup ngrok

## ✅ Thay thế bằng:

### Chạy Local (Development):
```powershell
.\START-ALL-LOCAL.ps1
```
Xem chi tiết: [HUONG-DAN-LOCAL.md](./HUONG-DAN-LOCAL.md)

### Deploy lên Internet (Production):
1. Push code lên GitHub:
   ```powershell
   .\DEPLOY-QUICK-START.ps1
   ```

2. Deploy các services:
   - Backend → Render.com
   - Admin-web → Vercel
   - App → Vercel

Xem chi tiết: [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md)

## 🤔 Tại sao không dùng ngrok nữa?

### Vấn đề với ngrok:
- ❌ Lag và chậm
- ❌ URL thay đổi mỗi lần restart (free tier)
- ❌ Giới hạn requests
- ❌ Không ổn định cho production
- ❌ Phức tạp khi cấu hình

### Giải pháp mới tốt hơn:
- ✅ **Local:** Chạy localhost - nhanh, ổn định
- ✅ **Production:** Deploy lên Render + Vercel - MIỄN PHÍ, nhanh, ổn định
- ✅ URL cố định, không thay đổi
- ✅ HTTPS tự động
- ✅ Auto-deploy khi push code

## 📚 Tài liệu mới:
- [HUONG-DAN-LOCAL.md](./HUONG-DAN-LOCAL.md) - Chạy local
- [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md) - Deploy production
- [README.md](./README.md) - Tổng quan dự án

---

**Lưu ý:** Các file ngrok cũ vẫn được giữ lại để tham khảo, nhưng không nên sử dụng.
