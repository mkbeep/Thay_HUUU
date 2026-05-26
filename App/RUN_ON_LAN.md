# 🌐 Chạy App trên Mạng LAN

## 📡 Thông tin mạng hiện tại

- **WiFi**: Hoa Nha
- **IP máy tính**: 192.168.1.3
- **Subnet**: 192.168.1.x

## 🚀 Cách chạy

### Cách 1: Sử dụng script đã cấu hình (Khuyến nghị)

```bash
npm run start:lan
```

### Cách 2: Chạy thủ công

```bash
npx expo start --lan --host 192.168.1.3
```

### Cách 3: Chạy bình thường (sẽ tự động dùng .env)

```bash
npm start
```

## 📱 Trên điện thoại

1. **Kết nối WiFi**: `Hoa Nha` (cùng mạng với máy tính)
2. **Mở Expo Go app**
3. **Quét QR code** từ terminal
4. Hoặc nhập thủ công: `exp://192.168.1.3:8081`

## ⚙️ Cấu hình đã thiết lập

File `.env` đã được tạo với:
```
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.3
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
```

## 🔥 Nếu vẫn không kết nối được

### 1. Kiểm tra Firewall

Chạy PowerShell as Administrator:

```powershell
# Tắt firewall cho Private network
Set-NetFirewallProfile -Profile Private -Enabled False

# Hoặc thêm rule cho port 8081
New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
```

### 2. Kiểm tra WiFi

```bash
# Kiểm tra IP hiện tại
ipconfig | findstr "IPv4"

# Kiểm tra WiFi
netsh wlan show interfaces
```

### 3. Xóa cache và restart

```bash
rm -rf .expo
npm start -- --clear
```

## 🔄 Khi đổi mạng WiFi

Nếu đổi sang WiFi khác, cần cập nhật IP trong `.env`:

1. Kiểm tra IP mới:
   ```bash
   ipconfig
   ```

2. Cập nhật file `.env`:
   ```
   REACT_NATIVE_PACKAGER_HOSTNAME=<IP_MỚI>
   ```

3. Restart Expo:
   ```bash
   npm start
   ```

## 💡 Tips

- Đảm bảo điện thoại và máy tính **cùng WiFi**
- Tắt **VPN** nếu đang bật
- Cập nhật **Expo Go** app lên phiên bản mới nhất
- Nếu vẫn không được, dùng **tunnel mode**: `npx expo start --tunnel`
