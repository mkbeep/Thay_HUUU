# 🔴 Sửa lỗi ERR_NGROK_3200 - Ngrok Offline

## ❌ Lỗi hiện tại:
```
ERR_NGROK_3200
The endpoint unfrothed-sharri-releasible.ngrok-free.dev is offline.
```

## 🔍 Nguyên nhân:
- Ngrok tunnel đã timeout (free plan: 2 giờ)
- Ngrok process bị tắt
- Ngrok chưa được start

---

## ✅ Giải pháp: Start lại ngrok

### Cách 1: Dùng script tự động (KHUYẾN NGHỊ)

```powershell
.\start-all-with-ngrok.ps1
```

Script này sẽ:
1. ✅ Stop tất cả processes cũ
2. ✅ Start Backend (port 3000)
3. ✅ Start Expo App (port 8081)
4. ✅ Start ngrok và cập nhật .env
5. ✅ Generate QR codes mới

**SAU KHI SCRIPT CHẠY XONG:**
1. Xem terminal ngrok để lấy URL mới
2. Restart App terminal (Ctrl+C rồi `npm run start`)
3. Dùng URL mới để test

---

### Cách 2: Start thủ công (từng bước)

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Expo App:**
```powershell
cd App
npm run start
```
Đợi thấy: `Web is waiting on http://localhost:8081`

**Terminal 3 - Ngrok:**
```powershell
.\setup-ngrok.ps1
```

Sau khi ngrok start, bạn sẽ thấy:
```
App (QR / browser): https://NEW-URL.ngrok-free.dev
API (via Metro proxy): https://NEW-URL.ngrok-free.dev/api/v1
```

**Restart App để load .env mới:**
- Quay lại Terminal 2
- Nhấn Ctrl+C
- Chạy lại: `npm run start`

---

## 🌐 Kiểm tra ngrok đang chạy

### Mở ngrok web interface:
```
http://localhost:4040
```

Trang này hiển thị:
- ✅ Tunnel URL hiện tại
- ✅ Requests đang đến
- ✅ Status của tunnel

### Hoặc dùng command:
```powershell
curl http://localhost:4040/api/tunnels
```

---

## 📱 Test trên điện thoại

Sau khi ngrok start và App restart:

1. **Lấy URL mới từ terminal ngrok**
   Ví dụ: `https://abc-xyz-123.ngrok-free.dev`

2. **Test trang debug:**
   ```
   https://abc-xyz-123.ngrok-free.dev/test.html?ngrok-skip-browser-warning=true
   ```

3. **Test table:**
   ```
   https://abc-xyz-123.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true
   ```

4. **Hoặc quét QR code mới:**
   - Mở file: `backend/qr-codes/index.html`
   - Quét QR của bàn bất kỳ

---

## ⚠️ Lưu ý quan trọng

### Ngrok Free Plan giới hạn:
- ⏰ **2 giờ timeout** - Phải restart sau 2 giờ
- 🔄 **URL thay đổi** - Mỗi lần restart có URL mới
- 📱 **40 connections/phút** - Đủ cho testing

### Khi nào cần restart ngrok:
- ❌ Thấy lỗi `ERR_NGROK_3200`
- ❌ URL không load được
- ❌ Sau 2 giờ không dùng
- ❌ Sau khi tắt máy/restart

### Sau mỗi lần restart ngrok:
1. ✅ URL mới được tạo
2. ✅ File .env được cập nhật tự động
3. ✅ QR codes mới được generate
4. ✅ **PHẢI restart App** để load .env mới

---

## 🎯 Checklist

Trước khi test trên mobile:

- [ ] Backend đang chạy (port 3000)
- [ ] Expo App đang chạy (port 8081)
- [ ] Ngrok đang chạy (check http://localhost:4040)
- [ ] Đã restart App SAU KHI ngrok start
- [ ] Đã lấy URL mới từ terminal ngrok
- [ ] Test URL mới trên laptop trước
- [ ] Xóa cache browser trên mobile

---

## 💡 Giải pháp lâu dài

### Option 1: Ngrok Paid Plan
- ✅ Không timeout
- ✅ URL cố định (custom domain)
- ✅ Nhiều connections hơn
- 💰 $8/tháng

### Option 2: Deploy lên hosting thật
- ✅ Không cần ngrok
- ✅ URL cố định
- ✅ Không giới hạn
- 🆓 Free tier: Vercel, Netlify, Railway

### Option 3: Dùng LAN IP (cùng WiFi)
- ✅ Không cần ngrok
- ✅ Không timeout
- ❌ Chỉ hoạt động cùng WiFi
- Xem: `App/RUN_ON_LAN.md`

---

## 🆘 Vẫn lỗi?

### 1. Kiểm tra ngrok authtoken:
```powershell
ngrok config check
```

Nếu chưa có token:
```powershell
ngrok config add-authtoken YOUR_TOKEN
```
Lấy token tại: https://dashboard.ngrok.com/get-started/your-authtoken

### 2. Kiểm tra ports:
```powershell
netstat -ano | findstr "3000 8081 4040"
```

Phải thấy cả 3 ports đang LISTENING

### 3. Xem logs:
- Backend terminal: Có lỗi gì không?
- Expo terminal: App có start thành công không?
- Ngrok terminal: Tunnel có active không?

### 4. Test từng bước:
```powershell
# Test backend
curl http://localhost:3000/api/v1/health

# Test Expo
curl http://localhost:8081

# Test ngrok
curl http://localhost:4040/api/tunnels
```

---

## 📞 Cần trợ giúp?

Cung cấp thông tin:
1. Screenshot lỗi trên mobile
2. Backend terminal logs
3. Expo terminal logs
4. Ngrok terminal logs
5. Output của: `curl http://localhost:4040/api/tunnels`
