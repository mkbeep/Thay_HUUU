# App + ngrok (cổng 8081)

## Thứ tự chạy (bắt buộc)

### 1. Backend
```powershell
cd backend
npm run dev
```

### 2. App (cổng 8081)
```powershell
cd App
npm run start
```
Đợi dòng: **Web is waiting on http://localhost:8081**

### 3. Bật ngrok + tạo QR
```powershell
cd ..
.\setup-ngrok.ps1
```

Script **chỉ chạy được** khi cổng **8081** đang mở (App đang chạy).

### 4. Khởi động lại App một lần
Sau `setup-ngrok.ps1`, trong terminal App: **Ctrl+C** → `npm run start`  
(để nạp `API_URL` và `CUSTOMER_WEB_BASE_URL` ngrok mới)

---

## Cách hoạt động

| Cổng | Việc |
|------|------|
| **8081** | Expo App — ngrok trỏ vào đây, QR mở giao diện |
| **3000** | Backend API — chạy local, Metro proxy `/api` từ ngrok về :3000 |

Khách quét QR → mở link `https://xxx.ngrok-free.dev/table/...` → thấy App đầy đủ.

---

## Lưu ý

- Mỗi lần tắt/mở lại ngrok → chạy lại `.\setup-ngrok.ps1` và in QR lại.
- Phải giữ **3 thứ chạy**: backend, App, ngrok.
- Lần đầu mở link ngrok có thể bấm **Visit Site**.
