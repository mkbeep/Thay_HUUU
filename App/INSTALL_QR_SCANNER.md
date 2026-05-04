# Cài Đặt QR Scanner

## 📦 Install Dependencies

```bash
cd App
npm install @react-native-async-storage/async-storage expo-camera
```

## ✅ Đã Hoàn Thành

1. ✅ Tạo `TableContext.tsx` - Quản lý table info
2. ✅ Tạo `QRScannerScreen.tsx` - Màn hình quét QR
3. ✅ Update `App.tsx`:
   - Import TableProvider và QRScannerScreen
   - Thêm TableProvider wrap app
   - Thêm case 'qrScanner' vào renderScreen
4. ✅ Update `MyTableScreen.tsx`:
   - Thêm prop `onQRScan`
   - Button QR code bây giờ gọi `onQRScan()` thay vì Alert

## 🧪 Test Flow

1. Chạy app: `npm start`
2. Vào màn hình "Bàn của tôi"
3. Bấm icon QR ở góc phải trên
4. Camera sẽ mở để quét mã QR
5. Quét QR code format: `restaurant://table/{tableId}`
6. App sẽ lưu table info và quay lại màn hình bàn

## 📝 QR Code Format

App hỗ trợ 3 format:
1. `restaurant://table/{tableId}` - Deep link format
2. `https://restaurant.com/table/{tableId}` - URL format
3. `{tableId}` - Chỉ table ID

## 🔧 Troubleshooting

### Lỗi: "Cannot find module 'expo-camera'"
```bash
npm install expo-camera
```

### Lỗi: "Cannot find module '@react-native-async-storage/async-storage'"
```bash
npm install @react-native-async-storage/async-storage
```

### Camera không mở
- Kiểm tra quyền camera trong settings điện thoại
- Chạy lại app: `npm start` và reload

### QR Scanner không hoạt động
- Đảm bảo backend đang chạy: `cd backend && npm run dev`
- Kiểm tra API_URL trong `.env` file
- Test API: `curl http://192.168.1.100:3000/api/v1/tables`

## 🎯 Next Steps

Sau khi install dependencies và test QR scanner, cần:

1. **Update tất cả screens** để dùng `useTable()` thay vì hardcode tableNumber
2. **Test order creation** với table session ID thực
3. **Test table status** update khi có order mới

## 📱 Demo QR Codes

Để test, bạn có thể tạo QR code với các giá trị sau:
- `restaurant://table/1` - Bàn số 1
- `restaurant://table/2` - Bàn số 2
- `restaurant://table/3` - Bàn số 3

Dùng website: https://www.qr-code-generator.com/
