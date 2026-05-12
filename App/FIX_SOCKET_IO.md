# Hướng dẫn sửa lỗi socket.io-client

## Đã thực hiện:

### 1. ✅ Cài đặt polyfills cần thiết
```bash
npm install --save react-native-get-random-values react-native-url-polyfill
```

### 2. ✅ Thêm polyfills vào App.tsx
Đã thêm ở đầu file `App/App.tsx`:
```typescript
// Polyfills for socket.io-client
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
```

### 3. ✅ Cập nhật Metro config
Đã cập nhật `App/metro.config.js` để hỗ trợ `.cjs` files

### 4. ✅ Sửa lỗi PaymentScreen.tsx
- Thêm `useEffect` vào import
- Xóa `Alert` không sử dụng

## Cách test:

### Bước 1: Stop tất cả processes đang chạy
Nhấn `Ctrl+C` trong terminal nếu Expo đang chạy

### Bước 2: Clear cache và restart
```bash
cd App
npx expo start --clear
```

### Bước 3: Reload app
- Trên Android: Nhấn `r` trong terminal hoặc shake device và chọn "Reload"
- Trên iOS: Nhấn `Cmd+R` hoặc shake device và chọn "Reload"
- Trên Web: Refresh browser (F5)

## Nếu vẫn còn lỗi:

### Option 1: Thử downgrade socket.io-client
```bash
npm uninstall socket.io-client
npm install socket.io-client@4.7.5
```

### Option 2: Thử với engine.io-client
```bash
npm install engine.io-client@6.5.4
```

### Option 3: Clear toàn bộ cache
```bash
# Stop Expo server
# Ctrl+C

# Clear all caches
npx expo start --clear
watchman watch-del-all  # Nếu có watchman
rm -rf $TMPDIR/metro-*  # Clear Metro cache
rm -rf $TMPDIR/haste-*  # Clear Haste cache
```

### Option 4: Kiểm tra file socketService.ts
Đảm bảo import đúng:
```typescript
import { io, Socket } from 'socket.io-client';
```

## Lưu ý quan trọng:

1. **Polyfills PHẢI được import TRƯỚC tất cả các imports khác** trong App.tsx
2. **Metro bundler cache** cần được clear sau khi thay đổi config
3. **Reload app** sau khi restart Expo server
4. Nếu dùng **Expo Go app**, một số native modules có thể không hoạt động. Cần build development client:
   ```bash
   npx expo run:android
   # hoặc
   npx expo run:ios
   ```

## Kiểm tra version compatibility:

Các version hiện tại:
- Expo: ^54.0.0
- React Native: 0.81.5
- socket.io-client: ^4.8.1

Nếu vẫn gặp vấn đề, có thể cần downgrade socket.io-client về version 4.7.x hoặc 4.6.x để tương thích tốt hơn với React Native 0.81.5
