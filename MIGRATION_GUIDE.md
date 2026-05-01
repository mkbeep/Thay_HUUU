# 📦 Hướng dẫn di chuyển dự án vào cấu trúc mới

## Bước 1: Tạo folder App và di chuyển React Native app

```bash
# Tạo folder App
mkdir App

# Di chuyển các folder chính
mv src App/
mv assets App/
mv node_modules App/

# Di chuyển các file config
mv App.tsx App/
mv package.json App/
mv package-lock.json App/
mv tsconfig.json App/
mv babel.config.js App/
mv app.json App/

# Di chuyển các file khác
mv .expo App/
mv .gitignore App/
mv test-images.js App/

# Di chuyển các file README (nếu có)
mv START_APP.md App/ 2>/dev/null || true
mv SUPPORT_FEATURE_COMPLETE.md App/ 2>/dev/null || true
```

## Bước 2: Cập nhật .gitignore trong App/

```bash
cd App
cat > .gitignore << 'EOF'
node_modules/
.expo/
.expo-shared/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
.DS_Store
EOF
```

## Bước 3: Test React Native app

```bash
cd App
npm install
npm start
```

## Bước 4: Setup Admin Web

```bash
# Quay lại root
cd ..

# Vào admin-web
cd admin-web

# Install dependencies
npm install

# Chạy dev server
npm run dev
```

Mở browser: http://localhost:5173
Login: admin@gourmet.com / admin123

## Bước 5: Tạo cấu trúc backend (Optional)

```bash
# Quay lại root
cd ..

# Tạo các folder service
mkdir -p backend/api-gateway
mkdir -p backend/menu-service
mkdir -p backend/order-service
mkdir -p backend/table-service
mkdir -p backend/user-service
mkdir -p backend/notification-service
```

## Bước 6: Cấu trúc cuối cùng

```
restaurant-management/
├── App/                          # ✅ React Native Mobile App
│   ├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── package.json
│   └── ...
│
├── admin-web/                    # ✅ React JS Web Admin
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── ...
│
├── backend/                      # 📦 Microservices (Empty)
│   ├── api-gateway/
│   ├── menu-service/
│   ├── order-service/
│   ├── table-service/
│   ├── user-service/
│   ├── notification-service/
│   └── README.md
│
├── PROJECT_STRUCTURE.md
├── README_FULL_PROJECT.md
└── MIGRATION_GUIDE.md
```

## ✅ Checklist

- [ ] Di chuyển React Native app vào `App/`
- [ ] Test React Native app chạy được
- [ ] Install dependencies cho `admin-web/`
- [ ] Test admin web chạy được
- [ ] Tạo cấu trúc backend folders
- [ ] Commit và push lên Git

## 🚀 Chạy toàn bộ hệ thống

### Terminal 1: Mobile App
```bash
cd App
npm start
```

### Terminal 2: Admin Web
```bash
cd admin-web
npm run dev
```

### Terminal 3: Backend (Khi sẵn sàng)
```bash
cd backend
docker-compose up
```

## 📝 Notes

- React Native app hiện đang dùng mock data
- Admin web đã có UI cơ bản, chờ backend API
- Backend cần team khác implement
- Sau khi có backend, cần update API calls trong mobile app và admin web

## 🐛 Troubleshooting

### Lỗi: "Cannot find module"
```bash
cd App
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: Admin web không chạy
```bash
cd admin-web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Lỗi: Port đã được sử dụng
```bash
# Kill process trên port 5173
lsof -ti:5173 | xargs kill -9

# Hoặc đổi port trong vite.config.ts
```

## ✨ Hoàn thành!

Bây giờ bạn đã có:
- ✅ Mobile app trong folder `App/`
- ✅ Admin web trong folder `admin-web/`
- ✅ Cấu trúc backend sẵn sàng cho team khác

Happy coding! 🎉
