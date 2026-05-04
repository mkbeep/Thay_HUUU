# Table QR Codes

Các file QR code này được tạo tự động cho từng bàn trong nhà hàng.

## Cách sử dụng

1. **In QR codes**: In các file PNG này và dán lên bàn tương ứng
2. **Khách quét QR**: Khách hàng dùng camera điện thoại quét QR code
3. **Tự động nhận diện bàn**: App sẽ tự động nhận diện số bàn và tạo session

## Thông tin trong QR Code

Mỗi QR code chứa:
- `type`: "table"
- `tableId`: ID của bàn trong database
- `tableNumber`: Số bàn (T01, T02, V01, etc.)
- `restaurantId`: ID nhà hàng
- `timestamp`: Thời gian tạo QR

## Tái tạo QR Codes

Nếu cần tạo lại QR codes:

```bash
cd backend
npm run generate-qr
```

## Kích thước

- Kích thước: 400x400 pixels
- Format: PNG
- Margin: 2
- Màu: Đen trên nền trắng

---

Generated: 20:51:13 4/5/2026
