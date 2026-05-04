# 🔥 Firebase Backend Architecture

## Tổng quan

Backend sử dụng Firebase với Clean Architecture, bao gồm:
- **Firestore**: Database chính
- **Firebase Auth**: Authentication
- **Cloud Functions**: Business logic & triggers
- **Firebase Storage**: Lưu trữ file (ảnh món ăn, QR code, avatar)
- **Cloud Messaging**: Push notifications

## 📁 Cấu trúc thư mục

```
backend/firebase/
├── collections/              # Firestore collections schema
├── functions/               # Cloud Functions
│   ├── src/
│   │   ├── triggers/       # Database triggers
│   │   ├── api/            # HTTP endpoints
│   │   ├── scheduled/      # Scheduled jobs
│   │   └── utils/          # Utilities
│   ├── package.json
│   └── tsconfig.json
├── rules/                   # Security rules
│   ├── firestore.rules
│   └── storage.rules
├── indexes/                 # Firestore indexes
│   └── firestore.indexes.json
├── config/                  # Firebase config
│   ├── firebase.json
│   └── .firebaserc
└── scripts/                 # Utility scripts
    ├── seed-data.ts        # Seed initial data
    └── migrate.ts          # Migration scripts
```

## 🗄️ Collections Schema

Xem chi tiết trong thư mục `collections/`

### Core Collections
1. **users** - Người dùng & nhân viên
2. **role** - Vai trò hệ thống
3. **user_role** - Liên kết user-role
4. **dining_table** - Bàn ăn
5. **table_session** - Phiên làm việc bàn
6. **food** - Món ăn
7. **food_image** - Hình ảnh món ăn
8. **orders** - Đơn hàng
9. **order_item** - Chi tiết đơn hàng
10. **kitchen_ticket** - Phiếu bếp
11. **payment** - Thanh toán

### Additional Collections (Bổ sung)
12. **customer** - Khách hàng thân thiết
13. **reservation** - Đặt bàn trước
14. **inventory** - Quản lý kho
15. **supplier** - Nhà cung cấp
16. **promotion** - Khuyến mãi
17. **review** - Đánh giá món ăn
18. **notification** - Thông báo
19. **activity_log** - Lịch sử hoạt động
20. **settings** - Cấu hình hệ thống

## 🔐 Security Rules

### Firestore Rules
- Role-based access control (RBAC)
- Field-level security
- Data validation rules

### Storage Rules
- Authenticated uploads only
- File size limits
- File type restrictions

## ⚡ Cloud Functions

### Triggers
- `onOrderCreated` - Tạo kitchen tickets, gửi notification
- `onOrderStatusChanged` - Cập nhật table status, analytics
- `onPaymentCompleted` - Cập nhật order, session, analytics
- `onInventoryLow` - Gửi cảnh báo tồn kho thấp

### HTTP Endpoints
- `POST /api/orders/create` - Tạo đơn hàng (với validation phức tạp)
- `POST /api/payments/process` - Xử lý thanh toán
- `GET /api/analytics/dashboard` - Dashboard analytics
- `POST /api/notifications/send` - Gửi notification

### Scheduled Jobs
- `dailyAnalytics` - Tổng hợp báo cáo hàng ngày (0h)
- `checkReservations` - Kiểm tra đặt bàn (mỗi 30 phút)
- `cleanupExpiredSessions` - Dọn dẹp sessions cũ (mỗi ngày)
- `inventoryCheck` - Kiểm tra tồn kho (mỗi 6h)

## 📊 Data Flow

### Tạo đơn hàng
```
Client → orders (create)
  ↓
Cloud Function (onOrderCreated)
  ├→ order_item (create multiple)
  ├→ kitchen_ticket (create for each item)
  ├→ dining_table (update status)
  ├→ table_session (update)
  └→ notification (send to kitchen)
```

### Thanh toán
```
Client → payment (create)
  ↓
Cloud Function (onPaymentCompleted)
  ├→ orders (update status)
  ├→ table_session (close)
  ├→ dining_table (set to cleaning)
  └→ analytics (update revenue)
```

## 🚀 Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init

# Deploy all
firebase deploy

# Deploy functions only
firebase deploy --only functions

# Deploy rules only
firebase deploy --only firestore:rules,storage:rules
```

## 📝 Environment Setup

```bash
# Set environment variables
firebase functions:config:set \
  stripe.secret_key="sk_test_..." \
  momo.partner_code="..." \
  zalopay.app_id="..."

# Get config
firebase functions:config:get
```

## 🧪 Testing

```bash
# Emulator suite
firebase emulators:start

# Test functions locally
cd functions && npm test

# Integration tests
npm run test:integration
```

## 📈 Monitoring

- Firebase Console: https://console.firebase.google.com
- Cloud Functions logs: `firebase functions:log`
- Performance monitoring
- Crash analytics

## 💰 Cost Optimization

1. **Minimize reads**: Sử dụng denormalization
2. **Batch operations**: Gộp nhiều writes
3. **Indexes**: Chỉ tạo indexes cần thiết
4. **Cloud Functions**: Optimize cold start time
5. **Storage**: Compress images, cleanup unused files

## 🔄 Migration từ Mock Data

Xem `scripts/migrate.ts` để migrate từ mock repositories sang Firebase.
