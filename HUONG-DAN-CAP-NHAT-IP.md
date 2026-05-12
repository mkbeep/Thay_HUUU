# Hướng Dẫn Cập Nhật IP WiFi

## 🎯 Vấn đề
Khi thay đổi mạng WiFi, địa chỉ IP của máy tính sẽ thay đổi. Điều này làm cho:
- Backend không thể kết nối
- Admin web không thể gọi API
- App mobile không thể kết nối
- **Mã QR không tự động cập nhật số bàn** (đã sửa)

## ✅ Giải pháp tự động

### Cách 1: Chạy script PowerShell (Khuyến nghị)

```powershell
# Chạy trong PowerShell
.\update-ip.ps1
```

Script này sẽ:
1. Tự động phát hiện IP WiFi hiện tại
2. Cập nhật tất cả file `.env`
3. Hiển thị hướng dẫn các bước tiếp theo

### Cách 2: Cập nhật thủ công

1. **Kiểm tra IP hiện tại:**
```powershell
ipconfig | Select-String -Pattern "IPv4"
```

2. **Cập nhật các file `.env`:**

**App/.env:**
```env
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.7
API_URL=http://192.168.1.7:3000/api/v1
CUSTOMER_WEB_BASE_URL=http://192.168.1.7:8081
```

**admin-web/.env:**
```env
VITE_API_URL=http://192.168.1.7:3000/api/v1
VITE_CUSTOMER_WEB_URL=http://192.168.1.7:8081
```

**backend/.env:**
```env
BACKEND_URL=http://192.168.1.7:3000
CORS_ORIGIN=http://localhost:5173,http://192.168.1.7:5173,http://localhost:8081,http://192.168.1.7:8081,http://localhost:19006,http://192.168.1.7:19006
CUSTOMER_WEB_BASE_URL=http://192.168.1.7:8081
```

3. **Khởi động lại các service:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Admin Web
cd admin-web
npm run dev

# Terminal 3 - Mobile App
cd App
npm start
```

4. **Tạo lại mã QR với IP mới:**

```bash
cd backend
npm run generate-qr
```

## 🔧 Sửa lỗi mã QR không tự động cập nhật số bàn

### Vấn đề cũ:
- Khi tạo bàn mới trong admin web, mã QR được tạo với `localId` tạm thời
- Số bàn không được cập nhật đúng trong URL của mã QR
- Người dùng phải nhập số bàn thủ công

### Giải pháp đã áp dụng:

1. **Tạo bàn mới:** Gọi API backend để tạo bàn, sau đó reload danh sách để có ID và QR code chính xác
2. **Chỉnh sửa bàn:** Gọi API backend để cập nhật, sau đó reload để có QR code mới
3. **Xóa bàn:** Gọi API backend để xóa, sau đó reload danh sách

### Code đã sửa trong `admin-web/src/features/tables/pages/TablesPage.tsx`:

```typescript
// Trước (SAI):
const handleAddTable = () => {
  const localId = `local-${Date.now()}`; // ❌ ID tạm thời
  const table: Table = {
    id: localId,
    qrCode: resolveQrCodeUrl({ id: localId, ... }) // ❌ QR code sai
  };
  setTables([...tables, table]);
};

// Sau (ĐÚNG):
const handleAddTable = async () => {
  const response = await api.post('/tables', { ... }); // ✅ Tạo trên server
  await loadTablesFromApi(); // ✅ Reload để có ID và QR đúng
};
```

## 📱 Cách hoạt động của mã QR

### Định dạng URL trong mã QR:
```
http://192.168.1.7:8081/table/{số_bàn}?tid={id_bàn}
```

Ví dụ:
- Bàn 1: `http://192.168.1.7:8081/table/1?tid=table1`
- Bàn G01: `http://192.168.1.7:8081/table/G01?tid=tableG01`

### Khi khách quét mã QR:

1. **Trên điện thoại (Camera):**
   - Mở trình duyệt → Trang web khách hàng
   - Tự động nhận diện số bàn từ URL
   - Hiển thị thực đơn cho bàn đó

2. **Trong app (Expo Go):**
   - Quét QR → Phát hiện URL web
   - Mở trình duyệt với URL đó
   - Tự động cập nhật số bàn

## 🎨 Tạo lại mã QR

Sau khi cập nhật IP, chạy lệnh sau để tạo lại tất cả mã QR:

```bash
cd backend
npm run generate-qr
```

Mã QR sẽ được tạo trong thư mục `backend/qr-codes/`:
- File PNG cho từng bàn: `table-1.png`, `table-G01.png`, ...
- File HTML để xem tất cả: `index.html`
- File README: `README.md`

## 🔍 Kiểm tra kết nối

### 1. Kiểm tra Backend:
```bash
curl http://192.168.1.7:3000/api/v1/health
```

### 2. Kiểm tra Admin Web:
Mở trình duyệt: `http://192.168.1.7:5173`

### 3. Kiểm tra Customer Web:
Mở trình duyệt: `http://192.168.1.7:8081`

### 4. Kiểm tra từ điện thoại:
- Đảm bảo điện thoại và máy tính cùng mạng WiFi
- Quét mã QR hoặc mở URL trực tiếp

## ⚠️ Lưu ý quan trọng

1. **Cùng mạng WiFi:** Tất cả thiết bị phải kết nối cùng mạng WiFi
2. **Firewall:** Tắt firewall hoặc cho phép cổng 3000, 5173, 8081
3. **IP động:** Nếu IP thay đổi thường xuyên, chạy lại script `update-ip.ps1`
4. **Mã QR:** Sau khi đổi IP, phải tạo lại mã QR và in lại

## 🚀 Quy trình hoàn chỉnh khi đổi WiFi

1. Chạy script cập nhật IP:
```powershell
.\update-ip.ps1
```

2. Khởi động lại backend:
```bash
cd backend
npm run dev
```

3. Khởi động lại admin web:
```bash
cd admin-web
npm run dev
```

4. Khởi động lại app:
```bash
cd App
npm start
```

5. Tạo lại mã QR:
```bash
cd backend
npm run generate-qr
```

6. In lại mã QR và dán lên bàn

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra IP: `ipconfig`
2. Kiểm tra kết nối: `ping 192.168.1.7`
3. Kiểm tra backend: `curl http://192.168.1.7:3000/api/v1/health`
4. Xem log backend để biết lỗi chi tiết
