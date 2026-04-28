# Restaurant Customer Mobile App

App React Native cho khách hàng đặt món tại nhà hàng.

## Cài đặt

```bash
cd mobile-app
npm install
```

## Chạy app

```bash
# Chạy trên iOS
npm run ios

# Chạy trên Android
npm run android

# Chạy Expo Dev
npm start
```

## Tính năng

- Chọn bàn (session-based)
- Xem thực đơn
- Thêm món vào giỏ hàng
- Đặt món
- Theo dõi trạng thái đơn hàng

## Cấu trúc

```
mobile-app/
├── App.js                    # Entry point
├── src/
│   ├── screens/             # Các màn hình
│   │   ├── TableSelectionScreen.js
│   │   ├── MenuScreen.js
│   │   ├── CartScreen.js
│   │   └── OrderStatusScreen.js
│   ├── store/               # Redux store
│   │   ├── index.js
│   │   └── slices/
│   └── services/            # API services
│       └── api.js
└── package.json
```
