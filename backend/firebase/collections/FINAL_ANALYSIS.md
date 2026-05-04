# 🔍 Phân Tích Chi Tiết Collections - Final Version

## ✅ Tổng kết: 16 Collections

### Core (12)
1. users
2. role
3. user_role
4. dining_table
5. table_session
6. food
7. food_image
8. food_topping (subcollection)
9. orders
10. order_item
11. kitchen_ticket
12. payment

### Business (4)
13. inventory
14. promotion
15. notification
16. settings

---

## 📊 Phân Tích Chi Tiết Từng Collection

### 1. food - ĐÃ TỐI ƯU

**Giữ lại (8 fields):**
- ✅ `id` - Primary key
- ✅ `name` - Hiển thị trong UI
- ✅ `description` - Hiển thị trong UI
- ✅ `price` - Hiển thị trong UI
- ✅ `category` - Dùng để filter trong UI (Khai vị, Món chính, ...)
- ✅ `inStock` - Toggle trong admin, hiển thị trong customer app
- ✅ `createdAt` - Tracking
- ✅ `updatedAt` - Tracking

**Đã xóa (không dùng trong UI):**
- ❌ `allergens` - KHÔNG hiển thị trong UI
- ❌ `ingredients` - KHÔNG hiển thị trong UI (chỉ có text "Nguyên liệu tươi sống" marketing)
- ❌ `preparationTime` - KHÔNG hiển thị trong UI món ăn
- ❌ `isVegetarian` - KHÔNG có filter món chay trong UI
- ❌ `isSpicy` - KHÔNG có badge cay trong UI (độ cay là lựa chọn khách khi đặt)

**Evidence từ code:**
```typescript
// App/src/presentation/screens/HomeMenuScreen.tsx
interface MenuItem {
  id: string;
  name: string;
  price: string;
  image: any;
  badge?: string;
  badgeColor?: string;
  available: boolean;
  category: string;  // ✅ Có dùng
  description?: string;
}

// KHÔNG có: allergens, ingredients, preparationTime, isVegetarian, isSpicy
```

### 2. food_topping - MỚI THÊM (Subcollection)

**Lý do cần:**
- Admin có UI quản lý topping trong MenuPage
- Mỗi món có thể có nhiều topping
- Topping có giá riêng và có thể bắt buộc

**Structure:**
```
food/{foodId}/toppings/{toppingId}
  - name: string
  - price: number
  - mandatory: boolean
```

**Evidence:**
```typescript
// admin-web/src/features/menu/pages/MenuPage.tsx
interface Topping {
  id: string
  name: string
  price: number
  mandatory: boolean
}

interface MenuItem {
  toppings: Topping[]  // ✅ Có quản lý topping
}
```

### 3. orders - ĐÃ TỐI ƯU

**Đã xóa:**
- ❌ `customerId` - Không có customer collection

**Giữ lại:**
- ✅ `customerName`, `customerPhone` - Optional fields trong admin
- ✅ `tax`, `serviceFee`, `discount`, `grandTotal` - Tính toán thanh toán
- ✅ `promotionId` - Áp dụng mã giảm giá
- ✅ `assignedWaiterId` - Nhân viên phục vụ

### 4. order_item - CẦN THIẾT

**Fields:**
- `orderId` - Reference
- `foodId` - Reference
- `quantity` - Số lượng
- `unitPrice` - Giá tại thời điểm đặt (denormalized)
- `totalPrice` - Thành tiền
- `status` - Trạng thái món (pending, preparing, ready, served)
- `note` - Ghi chú món (VD: "Không hành", "Ít cay")

**Lý do tách riêng:**
- Mỗi món có trạng thái riêng
- Bếp cập nhật từng món
- Dễ query món đang làm

### 5. kitchen_ticket - CẦN THIẾT

**Lý do:**
- Bếp nhận phiếu realtime
- Mỗi order_item tạo 1 kitchen_ticket
- Bếp mark as ready từng món

**Fields quan trọng:**
- `orderItemId` - Reference
- `foodId` - Reference
- `quantity` - Số lượng cần làm
- `status` - pending, in_progress, completed
- `assignedChefId` - Đầu bếp được gán
- `startedAt`, `finishedAt` - Tracking thời gian
- `priority` - Độ ưu tiên

### 6. inventory - CẦN THIẾT

**Lý do:**
- Admin có UI quản lý kho đầy đủ (InventoryPage.tsx)
- Cảnh báo low stock
- Tracking nhập hàng

**Fields đã tối ưu:**
- ✅ `name`, `category`, `unit` - Thông tin cơ bản
- ✅ `currentStock`, `minStock` - Tồn kho
- ✅ `estimatedDaysLeft` - Dự kiến hết hàng
- ✅ `lastRestocked` - Lần nhập gần nhất
- ✅ `supplier` - String (không cần collection riêng)
- ✅ `status` - in-stock, low-stock, out-of-stock

**Đã xóa:**
- ❌ `sku` - Không cần mã SKU phức tạp
- ❌ `expiryDate` - Không quản lý HSD
- ❌ `location` - Không quản lý vị trí kho

### 7. promotion - CẦN THIẾT

**Lý do:**
- Admin có UI quản lý promotion đầy đủ (PromotionsPage.tsx)
- Nhiều loại: percentage, fixed, buy-get, combo
- Có giới hạn sử dụng, thời gian

**Fields quan trọng:**
- `code` - Mã giảm giá (unique)
- `type` - Loại khuyến mãi
- `value` - Giá trị giảm
- `minOrderValue` - Đơn tối thiểu
- `usageLimit`, `usedCount` - Giới hạn sử dụng
- `startDate`, `endDate` - Thời gian
- `timeRestrictions` - Giới hạn giờ/ngày

### 8. notification - CẦN THIẾT

**Lý do:**
- Realtime notification cho nhân viên
- Bếp → Phục vụ: "Món sẵn sàng"
- Khách → Phục vụ: "Yêu cầu hỗ trợ"

**Fields:**
- `type` - order_new, order_ready, table_request, inventory_low
- `targetRoles` - Gửi theo role
- `targetUserIds` - Gửi cho user cụ thể
- `priority` - low, normal, high, urgent
- `isRead`, `readBy` - Tracking đã đọc

### 9. settings - CẦN THIẾT

**Lý do:**
- Cấu hình tập trung
- Thông tin nhà hàng
- Cấu hình thanh toán (Momo, ZaloPay)
- Tax rate, service fee

**Structure (singleton document):**
```
settings/system
  - restaurant: {...}
  - payment: {...}
  - notification: {...}
  - kitchen: {...}
```

---

## 🎯 So Sánh Với UI Thực Tế

### Customer App (React Native)

**Screens:**
1. WelcomeScreen - Intro
2. HomeMenuScreen - Xem menu, filter category
3. MenuItemDetailScreen - Chi tiết món, chọn topping, độ cay, ghi chú
4. CartScreen - Giỏ hàng
5. PaymentScreen - Thanh toán
6. OrderSummaryScreen - Theo dõi đơn
7. MyTableScreen - Lịch sử phiên bàn
8. SupportRequestScreen - Yêu cầu hỗ trợ

**Collections dùng:**
- `dining_table` - QR code
- `food` + `food_image` + `food_topping` - Menu
- `orders` + `order_item` - Đơn hàng
- `payment` - Thanh toán
- `table_session` - Lịch sử phiên

### Admin Web (React)

**Pages:**
1. DashboardPage - Tổng quan doanh thu
2. OrdersPage - Quản lý đơn hàng
3. MenuPage - Quản lý menu + topping
4. TablesPage - Quản lý bàn + QR
5. InventoryPage - Quản lý kho
6. PromotionsPage - Quản lý khuyến mãi
7. StaffPage - Quản lý nhân viên
8. ReportsPage - Báo cáo

**Collections dùng:**
- Tất cả 16 collections

---

## 📈 Data Flow Thực Tế

### Flow 1: Khách đặt món
```
1. Quét QR → Get dining_table
2. Xem menu → Query food + food_image
3. Chọn món → Get food_topping (subcollection)
4. Thêm vào cart → Local state (CartContext)
5. Thanh toán → Create payment
6. Tạo đơn → Create orders + order_item
7. Cloud Function → Create kitchen_ticket + notification
```

### Flow 2: Bếp làm món
```
1. Đăng nhập → Auth users
2. Realtime listener → kitchen_ticket (status=pending)
3. Bắt đầu làm → Update kitchen_ticket.status = in_progress
4. Hoàn thành → Update kitchen_ticket.status = completed
5. Cloud Function → Update order_item.status = ready
6. Cloud Function → Create notification (send to waiter)
```

### Flow 3: Phục vụ phục vụ
```
1. Nhận notification → "Món sẵn sàng"
2. Mang món → Update order_item.status = served
3. Check all items served → Update orders.status = completed
4. Cloud Function → Close table_session
```

---

## ✅ Kết Luận

### Collections Cuối Cùng: 16

**Đã xóa so với bản đầu:**
- ❌ customer (khách không đăng nhập)
- ❌ reservation (không đặt bàn trước)
- ❌ supplier (chỉ là string)
- ❌ review (không có đánh giá)
- ❌ activity_log (project nhỏ)

**Đã tối ưu fields:**
- ❌ food.allergens, ingredients, preparationTime, isVegetarian, isSpicy
- ❌ orders.customerId
- ❌ inventory.sku, expiryDate, location

**Đã thêm:**
- ✅ food_topping (subcollection) - Admin quản lý topping

### Tỷ lệ sử dụng: 100%

Tất cả 16 collections đều có UI tương ứng và được sử dụng thực tế trong project.

---

**Last Updated:** 2024-05-04
**Version:** 2.0.0 (Final - Analyzed)
**Status:** ✅ Verified với UI thực tế
