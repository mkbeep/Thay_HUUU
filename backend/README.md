# Restaurant Management System - Backend API

Backend API cho hệ thống quản lý nhà hàng, được xây dựng với kiến trúc đa tầng (Clean Architecture) sử dụng Node.js, Express, TypeScript và Firebase.

## 🏗️ Kiến trúc

Dự án tuân theo **Clean Architecture** với 4 tầng chính:

```
src/
├── domain/              # Domain Layer - Business Logic Core
│   ├── entities/        # Domain entities (User, Order, Food, etc.)
│   └── repositories/    # Repository interfaces
│
├── application/         # Application Layer - Use Cases
│   ├── use-cases/       # Business use cases
│   ├── services/        # Application services (JWT, Notification)
│   └── errors/          # Custom error classes
│
├── infrastructure/      # Infrastructure Layer - External Services
│   ├── config/          # Configuration (Firebase, Environment)
│   └── database/        # Database implementation
│       ├── repositories/  # Repository implementations
│       └── seeders/       # Database seeders
│
└── presentation/        # Presentation Layer - API Interface
    ├── controllers/     # HTTP controllers
    ├── routes/          # API routes
    └── middlewares/     # Express middlewares
```

## 🚀 Tính năng

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Refresh token mechanism
- ✅ Role-based access control (RBAC)
- ✅ Password hashing với bcrypt

### Notification System
- ✅ Firebase Cloud Messaging (FCM) integration
- ✅ Real-time push notifications
- ✅ Notification history
- ✅ Broadcast notifications
- ✅ Role-based notifications

### Core Features
- ✅ User management
- ✅ Food menu management
- ✅ Order management
- ✅ Table management
- ✅ Inventory management
- ✅ Promotion management
- ✅ Real-time notifications

## 📋 Yêu cầu hệ thống

- Node.js >= 16.x
- npm >= 8.x
- Firebase project với Firestore enabled
- Firebase Admin SDK credentials

## 🔧 Cài đặt

### 1. Clone repository

```bash
cd backend
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong `.env`:

```env
# Server
NODE_ENV=development
PORT=3000

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:19006
```

### 4. Lấy Firebase credentials

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Copy thông tin từ file JSON vào `.env`

### 5. Seed database

Tạo dữ liệu mẫu:

```bash
npm run seed
```

Lệnh này sẽ tạo:
- 5 roles (admin, manager, staff, chef, customer)
- 7 users với các roles khác nhau
- 15+ món ăn với hình ảnh
- 20 bàn ăn
- 20+ nguyên liệu kho
- 6 chương trình khuyến mãi

## 🏃 Chạy ứng dụng

### Development mode

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

### Production mode

```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

#### 1. Đăng ký

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyễn Văn A",
  "phone_number": "0901234567"
}
```

#### 2. Đăng nhập

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@restaurant.com",
  "password": "Admin@123456",
  "fcm_token": "optional-fcm-token"
}
```

Response:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "user-id",
      "email": "admin@restaurant.com",
      "full_name": "Nguyễn Văn Admin",
      "roles": ["admin"]
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 3. Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

#### 4. Lấy thông tin user hiện tại

```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

### Foods

#### 1. Lấy danh sách món ăn

```http
GET /api/v1/foods?category=main_course&is_available=true
```

#### 2. Lấy chi tiết món ăn

```http
GET /api/v1/foods/{id}
```

#### 3. Tạo món ăn mới (Admin/Manager only)

```http
POST /api/v1/foods
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Phở Bò",
  "description": "Phở bò truyền thống",
  "category": "main_course",
  "base_price": 75000,
  "preparation_time": 15,
  "is_available": true,
  "is_vegetarian": false,
  "is_spicy": false
}
```

### Orders

#### 1. Tạo đơn hàng

```http
POST /api/v1/orders
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "order_type": "dine_in",
  "table_session_id": "session-id",
  "items": [
    {
      "food_id": "food-id",
      "quantity": 2,
      "special_instructions": "Không hành"
    }
  ],
  "subtotal": 150000,
  "tax_amount": 15000,
  "discount_amount": 0,
  "total_amount": 165000
}
```

#### 2. Cập nhật trạng thái đơn hàng

```http
PATCH /api/v1/orders/{id}/status
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "preparing"
}
```

### Notifications

#### 1. Lấy danh sách notifications

```http
GET /api/v1/notifications?is_read=false&limit=20
Authorization: Bearer {access_token}
```

#### 2. Đánh dấu đã đọc

```http
PATCH /api/v1/notifications/{id}/read
Authorization: Bearer {access_token}
```

#### 3. Gửi notification (Admin only)

```http
POST /api/v1/notifications/send
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "user_id": "user-id",
  "type": "order_ready",
  "title": "Đơn hàng đã sẵn sàng",
  "message": "Đơn hàng #ORD-001 của bạn đã sẵn sàng",
  "priority": "high"
}
```

### Tables

#### 1. Lấy danh sách bàn

```http
GET /api/v1/tables
```

#### 2. Tạo phiên bàn

```http
POST /api/v1/tables/{id}/session
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "customer_count": 4
}
```

### Inventory

#### 1. Lấy danh sách kho

```http
GET /api/v1/inventory?category=Thịt
Authorization: Bearer {access_token}
```

#### 2. Lấy nguyên liệu sắp hết

```http
GET /api/v1/inventory/low-stock
Authorization: Bearer {access_token}
```

## 👥 Tài khoản mẫu

Sau khi chạy seed, bạn có thể đăng nhập với các tài khoản sau:

| Email | Password | Role |
|-------|----------|------|
| admin@restaurant.com | Admin@123456 | Admin |
| manager@restaurant.com | Manager@123 | Manager |
| staff1@restaurant.com | Staff@123 | Staff |
| chef@restaurant.com | Chef@123 | Chef |
| customer1@gmail.com | Customer@123 | Customer |

## 🔒 Security Features

- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ JWT token expiration
- ✅ Password hashing
- ✅ Input validation
- ✅ Error handling

## 📊 Database Schema

Xem chi tiết schema tại `firebase/collections/`

## 🧪 Testing

```bash
npm test
```

## 📝 Scripts

- `npm run dev` - Chạy development server với hot reload
- `npm run build` - Build production
- `npm start` - Chạy production server
- `npm run seed` - Seed database với dữ liệu mẫu
- `npm run lint` - Lint code

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

Nếu có vấn đề, vui lòng tạo issue trên GitHub hoặc liên hệ team phát triển.
