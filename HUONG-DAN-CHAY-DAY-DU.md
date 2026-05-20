# 🚀 HƯỚNG DẪN CHẠY ĐẦY ĐỦ HỆ THỐNG

## ⚡ CÁCH NHANH NHẤT (1 lệnh)

```powershell
.\START-ALL-COMPLETE.ps1
```

Script này sẽ tự động start:
- ✅ Backend (port 3000)
- ✅ Expo App - Customer Web (port 8081)
- ✅ Admin Web (port 5173)
- ✅ Ngrok tunnel

---

## 📋 SAU KHI CHẠY SCRIPT

### Bước 1: Đợi ngrok hiển thị URL mới
Xem terminal "NGROK TUNNEL", đợi thấy:
```
App (QR / browser): https://abc-xyz-NEW.ngrok-free.dev
API (via Metro proxy): https://abc-xyz-NEW.ngrok-free.dev/api/v1
```

### Bước 2: Restart Expo App
1. Vào terminal "EXPO APP (Customer Web)"
2. Nhấn `Ctrl+C`
3. Chạy lại: `npm run start`

### Bước 3: Restart Admin Web
1. Vào terminal "ADMIN WEB"
2. Nhấn `Ctrl+C`
3. Chạy lại: `npm run dev`

### Bước 4: Test trên laptop trước
Mở browser, test các URL:
- Backend: http://localhost:3000/api/v1/health
- Expo App: http://localhost:8081
- Admin Web: http://localhost:5173

### Bước 5: Test trên điện thoại
Dùng URL MỚI từ ngrok:
```
https://abc-xyz-NEW.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true
```

---

## 🔍 KIỂM TRA CÁC TERMINAL

Sau khi script chạy, bạn sẽ có 5 terminal windows:

### Terminal 1: BACKEND SERVER
```
Server running on port: 3000
```

### Terminal 2: EXPO APP (Customer Web)
```
Metro waiting on exp://...
Web is waiting on http://localhost:8081
```

### Terminal 3: ADMIN WEB
```
VITE ready in ... ms
Local: http://localhost:5173/
```

### Terminal 4: NGROK TUNNEL
```
App (QR / browser): https://NEW-URL.ngrok-free.dev
```

### Terminal 5: Script (có thể đóng)
Hiển thị hướng dẫn, có thể đóng sau khi đọc xong

---

## ❌ NẾU CÓ LỖI

### Lỗi: "ngrok not installed"
```powershell
# Download và cài ngrok từ:
https://ngrok.com/download

# Sau khi cài, thêm authtoken:
ngrok config add-authtoken YOUR_TOKEN
```

### Lỗi: "Port already in use"
Script đã tự động stop processes cũ, nhưng nếu vẫn lỗi:
```powershell
# Xem process nào đang dùng port
netstat -ano | findstr "3000 5173 8081"

# Kill process theo PID
taskkill /PID <PID_NUMBER> /F
```

### Lỗi: Expo không start
```powershell
cd App
npm install
npm run start
```

### Lỗi: Admin-web không start
```powershell
cd admin-web
npm install
npm run dev
```

---

## 🎯 CHECKLIST HOÀN THÀNH

Trước khi test trên mobile:

- [ ] Script đã chạy xong
- [ ] 4 terminals đang chạy (Backend, Expo, Admin, Ngrok)
- [ ] Ngrok đã hiển thị URL mới
- [ ] Đã restart Expo App
- [ ] Đã restart Admin Web
- [ ] Test localhost URLs OK trên laptop
- [ ] Đã lấy URL mới từ ngrok
- [ ] Xóa cache browser trên mobile

---

## 📱 TEST TRÊN ĐIỆN THOẠI

### 1. Xóa cache browser
- **iOS**: Settings > Safari > Clear History
- **Android**: Chrome > Settings > Clear browsing data

### 2. Test URL mới
```
https://NEW-URL.ngrok-free.dev/test.html?ngrok-skip-browser-warning=true
```

### 3. Nếu test.html OK, thử table:
```
https://NEW-URL.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true
```

### 4. Hoặc quét QR code mới
- Mở: `backend/qr-codes/index.html`
- Quét QR của bàn bất kỳ

---

## 🔄 KHI NÀO CẦN RESTART

### Restart ngrok (mỗi 2 giờ với free plan):
```powershell
.\START-ALL-COMPLETE.ps1
```

### Chỉ restart Expo (sau khi sửa code App):
```powershell
# Trong terminal Expo, nhấn Ctrl+C
npm run start
```

### Chỉ restart Admin (sau khi sửa code admin-web):
```powershell
# Trong terminal Admin, nhấn Ctrl+C
npm run dev
```

### Chỉ restart Backend (sau khi sửa code backend):
```powershell
# Trong terminal Backend, nhấn Ctrl+C
npm run dev
```

---

## 💡 TIPS

### Xem ngrok dashboard:
```
http://localhost:4040
```
Hiển thị tất cả requests đang đến ngrok

### Test API từ command line:
```powershell
# Test backend
curl http://localhost:3000/api/v1/health

# Test qua ngrok
curl https://NEW-URL.ngrok-free.dev/api/v1/health
```

### Nếu quên URL ngrok:
```powershell
curl http://localhost:4040/api/tunnels
```

---

## 🆘 VẪN KHÔNG VÀO ĐƯỢC?

### 1. Kiểm tra tất cả services đang chạy:
```powershell
netstat -ano | findstr "3000 5173 8081 4040"
```
Phải thấy cả 4 ports

### 2. Kiểm tra ngrok có URL không:
Mở: http://localhost:4040
Phải thấy tunnel status "online"

### 3. Kiểm tra .env đã cập nhật chưa:
```powershell
# Xem App .env
type App\.env | findstr API_URL

# Xem admin-web .env
type admin-web\.env | findstr VITE_API_URL
```
Phải thấy URL ngrok MỚI, không phải "unfrothed-sharri-releasible"

### 4. Nếu vẫn lỗi, gửi cho tôi:
- Screenshot màn hình mobile
- Backend terminal logs
- Expo terminal logs
- Ngrok terminal logs
- Admin terminal logs

---

## 📞 LƯU Ý QUAN TRỌNG

1. **URL ngrok thay đổi mỗi lần restart** - Đây là giới hạn của free plan
2. **Phải restart App và Admin sau khi ngrok start** - Để load .env mới
3. **Ngrok timeout sau 2 giờ** - Phải chạy lại script
4. **Xóa cache mobile browser** - Trước mỗi lần test
5. **Backend KHÔNG cần restart** - Khi ngrok restart

---

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi làm đúng các bước:
- ✅ Laptop vào được cả 3 URLs (backend, app, admin)
- ✅ Điện thoại vào được ngrok URL
- ✅ Không còn màn hình trắng "Đang tải thực đơn..."
- ✅ Menu hiển thị đầy đủ món ăn
- ✅ Admin web hiển thị danh sách món
