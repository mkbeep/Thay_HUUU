# 🗄️ Firebase Collections Schema

## Tổng quan

Hệ thống gồm **15 collections** được thiết kế dựa trên phân tích thực tế project.

## 📋 Danh sách Collections

### Core Collections (11)
1. **users** - Nhân viên (Phục vụ, Bếp, Quản lý)
2. **role** - Vai trò hệ thống
3. **user_role** - Liên kết user-role
4. **dining_table** - Bàn ăn (có QR code)
5. **table_session** - Phiên làm việc bàn
6. **food** - Món ăn
7. **food_image** - Hình ảnh món ăn (nhiều ảnh/món)
8. **orders** - Đơn hàng
9. **order_item** - Chi tiết đơn hàng
10. **kitchen_ticket** - Phiếu bếp (cho bếp nhận đơn realtime)
11. **payment** - Thanh toán (mock + Momo/ZaloPay)

### Business Collections (4)
12. **inventory** - Quản lý kho (admin)
13. **promotion** - Khuyến mãi/voucher (admin)
14. **notification** - Thông báo realtime
15. **settings** - Cấu hình hệ thống

## 🎯 Phân tích từ User Flow

### Customer Flow (KHÔNG CẦN ĐĂNG NHẬP)
```
Quét QR → Xem menu → Chọn món + ghi chú → Gửi đơn 
→ Thanh toán (mock/Momo/ZaloPay) → Theo dõi realtime → Lịch sử phiên bàn
```

**Collections liên quan:**
- `dining_table` - Lấy thông tin bàn từ QR
- `food` + `food_image` - Hiển thị menu
- `orders` + `order_item` - Tạo đơn hàng
- `payment` - Thanh toán
- `table_session` - Theo dõi phiên bàn

**KHÔNG CẦN:**
- ❌ `customer` - Khách không đăng nhập
- ❌ `reservation` - Không có đặt bàn trước
- ❌ `review` - Không có đánh giá

### Phục vụ Flow
```
Đăng nhập → Xem đơn mới → Xác nhận sau thanh toán 
→ Nhận thông báo món sẵn sàng → Cập nhật "Đã phục vụ" 
→ Chuyển/gộp/giải phóng bàn
```

**Collections liên quan:**
- `users` + `role` + `user_role` - Đăng nhập
- `orders` - Xem đơn mới
- `notification` - Nhận thông báo từ bếp
- `dining_table` + `table_session` - Quản lý bàn

### Bếp Flow
```
Đăng nhập → Nhận đơn realtime → Bắt đầu làm → Mark as Ready
```

**Collections liên quan:**
- `users` + `role` - Đăng nhập
- `kitchen_ticket` - Nhận phiếu bếp realtime
- `notification` - Gửi thông báo món sẵn sàng

### Quản lý Flow
```
Dashboard doanh thu realtime → Quản lý menu + topping + khuyến mãi 
→ Quản lý sơ đồ bàn + QR → Báo cáo cơ bản
```

**Collections liên quan:**
- `orders` + `payment` - Dashboard doanh thu
- `food` + `food_image` - Quản lý menu
- `promotion` - Quản lý khuyến mãi
- `dining_table` - Quản lý sơ đồ bàn + QR
- `inventory` - Quản lý kho

## 🔍 Phân tích chi tiết

### 1. Topping - KHÔNG CẦN COLLECTION
**Lý do:** 
- Topping chỉ là mock data trong UI (`AVAILABLE_TOPPINGS` array)
- Được tính vào `price` của món
- Hiển thị trong `options` string của `CartItem`
- Không được lưu riêng vào database

**Code evidence:**
```typescript
// App/src/presentation/screens/MenuItemDetailScreen.tsx
const AVAILABLE_TOPPINGS: Topping[] = [
  { id: 'cheese', name: 'Phô mai thêm', price: 15 },
  // ...
];

// Chỉ tính vào price
const total = item.price * quantity + toppings.reduce(...)

// Lưu vào options string
options.push(`Topping: ${toppingNames.join(', ')}`);
```

### 2. Customer - KHÔNG CẦN
**Lý do:**
- Khách hàng KHÔNG ĐĂNG NHẬP
- Chỉ có `customerName` và `customerPhone` optional trong `orders`
- Không có loyalty program, không có lịch sử khách hàng

### 3. Reservation - KHÔNG CẦN
**Lý do:**
- Không có tính năng đặt bàn trước trong project
- Khách quét QR trực tiếp tại bàn

### 4. Supplier - KHÔNG CẦN COLLECTION RIÊNG
**Lý do:**
- `supplier` chỉ là string field trong `inventory`
- Không có quản lý nhà cung cấp phức tạp

**Code evidence:**
```typescript
// admin-web/src/features/inventory/pages/InventoryPage.tsx
interface InventoryItem {
  supplier: string  // Chỉ là string, không phải reference
}
```

### 5. Review - KHÔNG CẦN
**Lý do:**
- Không có tính năng đánh giá trong project

### 6. Activity Log - KHÔNG CẦN
**Lý do:**
- Project nhỏ, không cần audit trail phức tạp
- Có thể thêm sau nếu cần compliance

### 7. Promotion - CẦN COLLECTION RIÊNG
**Lý do:**
- Có UI quản lý promotion đầy đủ (`PromotionsPage.tsx`)
- Mã giảm giá áp dụng cho đơn hàng, không phải món ăn
- Có nhiều loại: percentage, fixed, buy-get, combo
- Có giới hạn sử dụng, thời gian, điều kiện

**Code evidence:**
```typescript
interface Promotion {
  code: string
  type: 'percentage' | 'fixed' | 'buy-get' | 'combo'
  value: number
  minOrderValue: number
  usageLimit: number
  timeRestrictions?: {...}
}
```

### 8. Inventory - CẦN
**Lý do:**
- Có UI quản lý kho đầy đủ (`InventoryPage.tsx`)
- Theo dõi tồn kho, cảnh báo low stock
- Quản lý nguyên liệu cho nhà hàng

## 🔗 Entity Relationship

```
users ←→ user_role ←→ role
  ↓
  ├→ table_session → dining_table (QR code)
  │       ↓
  ├→ orders → order_item → food → food_image
  │    ↓         ↓
  │  payment   kitchen_ticket
  │                ↓
  └→ notification (realtime)

promotion → orders (mã giảm giá)
inventory (quản lý kho)
settings (cấu hình)
```

## 📊 Data Flow Realtime

### Tạo đơn hàng
```
Customer App → orders (create)
  ↓
Cloud Function (trigger)
  ├→ order_item (create multiple)
  ├→ kitchen_ticket (create for chef)
  ├→ notification (send to kitchen)
  └→ dining_table (update status = occupied)
```

### Bếp hoàn thành món
```
Kitchen App → kitchen_ticket (update status = ready)
  ↓
Cloud Function (trigger)
  ├→ order_item (update status = ready)
  ├→ notification (send to waiter)
  └→ orders (check if all items ready)
```

### Thanh toán
```
Customer App → payment (create)
  ↓
Cloud Function (trigger)
  ├→ orders (update status = completed)
  ├→ table_session (close session)
  └→ dining_table (status = cleaning)
```

## 🎨 UI Features vs Collections

| Feature | Collection | Note |
|---------|-----------|------|
| Quét QR | dining_table | QR chứa tableId |
| Xem menu | food + food_image | Nhiều ảnh/món |
| Chọn topping | - | Mock data UI only |
| Ghi chú món | order_item.note | String field |
| Thanh toán | payment | Mock + Momo/ZaloPay |
| Theo dõi đơn | orders + order_item | Realtime listener |
| Lịch sử phiên | table_session | Theo tableId |
| Phiếu bếp | kitchen_ticket | Realtime cho chef |
| Thông báo | notification | Realtime |
| Quản lý kho | inventory | Admin only |
| Khuyến mãi | promotion | Admin only |
| Sơ đồ bàn | dining_table | Admin only |

## 🚀 Implementation Priority

### Phase 1: Core (Week 1)
1. users, role, user_role - Authentication
2. dining_table - QR code system
3. food, food_image - Menu display
4. orders, order_item - Order creation

### Phase 2: Payment & Kitchen (Week 2)
5. payment - Payment integration
6. kitchen_ticket - Kitchen workflow
7. notification - Realtime notifications
8. table_session - Session tracking

### Phase 3: Admin Features (Week 3)
9. promotion - Voucher system
10. inventory - Stock management
11. settings - System config

## 💡 Best Practices

### 1. Denormalization
- `order_item.unitPrice` - Giá tại thời điểm đặt
- `orders.customerName` - Không cần join

### 2. Realtime Listeners
```typescript
// Kitchen app
onSnapshot(query(collection(db, 'kitchen_ticket'), 
  where('status', '==', 'pending')), (snapshot) => {
  // Update UI realtime
});
```

### 3. Cloud Functions Triggers
```typescript
// Auto create kitchen tickets
exports.onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    // Create kitchen_ticket for each order_item
  });
```

### 4. Security Rules
```javascript
// Khách không cần auth để tạo order
match /orders/{orderId} {
  allow create: if true;
  allow read: if true;
  allow update: if isStaff();
}

// Chỉ staff mới được đăng nhập
match /users/{userId} {
  allow read: if request.auth.uid == userId;
}
```

## 📈 Scalability

- **Orders**: Shard theo tháng nếu > 100k orders
- **Kitchen Tickets**: Auto delete sau 7 ngày
- **Notifications**: Auto delete sau 30 ngày
- **Table Sessions**: Archive sau 90 ngày

## ✅ Final Collections Count: 15

**Core:** 11 collections
**Business:** 4 collections

**Removed (không cần):**
- ❌ customer (khách không đăng nhập)
- ❌ reservation (không có đặt bàn)
- ❌ supplier (chỉ là string)
- ❌ review (không có đánh giá)
- ❌ activity_log (project nhỏ)
- ❌ topping (mock data UI)

---

**Last Updated:** 2024-05-04
**Version:** 1.0.0 (Final)
**Status:** ✅ Analyzed & Verified
