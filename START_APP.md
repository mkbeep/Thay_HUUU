# 🚀 Hướng dẫn chạy app

## ✅ Đã sửa xong tất cả lỗi!

### Các lỗi đã fix:
1. ✅ Version conflict của `@expo/vector-icons` (15.x → 14.1.0)
2. ✅ Version conflict của `expo-font` (55.x → 12.0.10)
3. ✅ Version conflict của `expo-linear-gradient` (55.x → 13.0.2)
4. ✅ Xóa MaterialCommunityIcons, chỉ dùng Ionicons
5. ✅ Sửa navigation structure
6. ✅ Xóa toàn bộ cache

### Dependencies hiện tại (tương thích Expo SDK 51):
```json
{
  "@expo/vector-icons": "14.1.0",
  "expo-font": "12.0.10",
  "expo-linear-gradient": "13.0.2",
  "expo": "~51.0.0"
}
```

## 🎯 Chạy app ngay:

```bash
npm start
```

Hoặc chạy trực tiếp trên iOS:
```bash
npm run ios
```

## 📱 Flow của app:

1. **WelcomeScreen** (Màn hình đầu tiên)
   - Hiển thị số bàn: "Table 12"
   - Hero image với gradient
   - 2 buttons:
     - "Explore Our Menu" → Vào app
     - "View Drink Selection" → Vào app

2. **MainTabs** (Sau khi nhấn button)
   - 📋 Menu (Thực đơn)
   - 🧾 Orders (Đơn hàng)
   - 🪑 Tables (Bàn ăn)
   - 📊 Stats (Thống kê)

## 🎨 Giao diện WelcomeScreen:
- ✅ Header với logo "Gourmet Tech"
- ✅ Hero image (món ăn đẹp)
- ✅ Location badge "IN-RESTAURANT DINING"
- ✅ Table number lớn và nổi bật
- ✅ 2 feature cards (Daily Specials, Fresh Ingredients)
- ✅ Gradient button đẹp mắt
- ✅ Footer "No login required"

## 🔥 Nếu gặp lỗi:

### Lỗi cache:
```bash
rm -rf .expo
rm -rf node_modules/.cache
watchman watch-del-all
npm start -- --clear
```

### Lỗi dependencies:
```bash
rm -rf node_modules
npm install
npm start
```

### Lỗi Metro Bundler:
```bash
watchman watch-del-all
npm start -- --reset-cache
```

## ✨ Tất cả đã sẵn sàng!

Chỉ cần chạy `npm start` và scan QR code là xong! 🎉
