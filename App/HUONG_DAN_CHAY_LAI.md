# 🎯 HƯỚNG DẪN CHẠY LẠI APP SAU KHI SỬA LỖI

## ✅ Đã sửa xong các lỗi:

1. ✅ **socket.io-client** - Downgrade về version 4.7.5 + thêm polyfills
2. ✅ **PaymentScreen.tsx** - Thêm useEffect import, xóa Alert không dùng

---

## 🚀 CÁCH 1: Dùng PowerShell Script (KHUYẾN NGHỊ)

```powershell
cd App
.\restart-expo.ps1
```

Script này sẽ tự động:
- Stop tất cả Node/Expo processes
- Clear cache
- Start Expo với --clear flag

---

## 🚀 CÁCH 2: Chạy thủ công

### Bước 1: Stop Expo server đang chạy
Nhấn `Ctrl+C` trong terminal

### Bước 2: Kill tất cả Node processes (nếu cần)
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

### Bước 3: Start Expo với cache cleared
```powershell
cd App
npx expo start --clear
```

### Bước 4: Reload app trên device/emulator
- **Android Emulator/Device:** 
  - Nhấn `r` trong terminal, HOẶC
  - Shake device → chọn "Reload"
  
- **iOS Simulator/Device:**
  - Nhấn `Cmd+R`, HOẶC
  - Shake device → chọn "Reload"
  
- **Web Browser:**
  - Nhấn `F5` hoặc `Ctrl+R`

---

## 🔍 Kiểm tra lỗi

Sau khi reload, kiểm tra terminal:

### ✅ Thành công nếu thấy:
```
✓ Bundled 1234ms
✓ Running on http://localhost:8081
```

### ❌ Vẫn lỗi nếu thấy:
```
Unable to resolve "socket.io-client"
```

---

## 🆘 Nếu vẫn còn lỗi socket.io-client:

### Option 1: Clear toàn bộ và reinstall
```powershell
cd App
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache clean --force
npm install
npx expo start --clear
```

### Option 2: Kiểm tra App.tsx
Mở file `App/App.tsx` và đảm bảo **3 dòng đầu tiên** là:
```typescript
// Polyfills for socket.io-client
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
```

### Option 3: Verify dependencies
```powershell
cd App
npm list socket.io-client
npm list react-native-get-random-values
npm list react-native-url-polyfill
```

Kết quả mong đợi:
```
├── socket.io-client@4.7.5
├── react-native-get-random-values@2.0.0
└── react-native-url-polyfill@3.0.0
```

---

## 📱 Test WebSocket connection

Sau khi app chạy thành công, test WebSocket:

1. Mở app trên device/emulator
2. Scan QR code để vào bàn
3. Kiểm tra terminal backend xem có log:
   ```
   🔌 Client connected: socket-id-xxx
   ```

---

## 💡 Tips

### Nếu Metro bundler chậm:
```powershell
# Clear Metro cache
npx expo start --clear
```

### Nếu app không reload:
```powershell
# Force reload bằng cách restart app hoàn toàn
# Android: Close app → Open lại
# iOS: Swipe up → Close app → Open lại
```

### Nếu vẫn thấy lỗi cũ:
```powershell
# Hard reset Metro bundler
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
Remove-Item -Recurse -Force $env:TEMP\metro-*
Remove-Item -Recurse -Force $env:TEMP\haste-*
npx expo start --clear
```

---

## 📋 Checklist trước khi chạy:

- [ ] Đã stop Expo server cũ (Ctrl+C)
- [ ] Đã kill tất cả Node processes
- [ ] Backend đang chạy (port 3000)
- [ ] File `.env` có đúng IP address
- [ ] Đã chạy `npx expo start --clear`
- [ ] Đã reload app trên device

---

## 🎉 Khi nào biết đã thành công?

1. ✅ Terminal không còn lỗi "Unable to resolve socket.io-client"
2. ✅ App mở được và hiển thị WelcomeScreen
3. ✅ Scan QR code được và vào được màn hình menu
4. ✅ Backend terminal hiển thị "Client connected"
5. ✅ Đặt món và thấy order xuất hiện trong admin-web

---

## 📞 Nếu cần help thêm:

Gửi screenshot của:
1. Terminal error message
2. File `App/package.json` (dòng dependencies)
3. File `App/App.tsx` (10 dòng đầu)
4. Output của `npm list socket.io-client`
