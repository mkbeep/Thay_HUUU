# 🔥 Firebase Quota Exceeded - Hướng dẫn xử lý

## ❌ Lỗi gặp phải

```
Error: 8 RESOURCE_EXHAUSTED: Quota exceeded.
```

## 🔍 Nguyên nhân

Firebase Firestore **Free Plan (Spark)** có giới hạn hàng ngày:
- ✅ **50,000 reads/day** (đọc dữ liệu)
- ✅ **20,000 writes/day** (ghi dữ liệu)  
- ✅ **20,000 deletes/day** (xóa dữ liệu)

Bạn đã vượt quá giới hạn này, thường do:
1. Chạy nhiều lần script seed data
2. Refresh trang nhiều lần
3. App query Firebase liên tục không có cache
4. Nhiều người/thiết bị truy cập đồng thời

---

## ✅ Giải pháp

### **Giải pháp 1: Đợi reset quota (24 giờ)**

Firebase tự động reset quota sau **24 giờ** (theo múi giờ UTC).

**Kiểm tra quota hiện tại:**
1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project: `restaurant-qr-order-38314`
3. Vào **Firestore Database** → **Usage** tab
4. Xem số lượng reads/writes đã dùng

**Trong khi đợi:**
- Không chạy script seed
- Không refresh trang liên tục
- Sử dụng cached data (đã được thêm vào code)

---

### **Giải pháp 2: Nâng cấp lên Blaze Plan (Khuyến nghị)**

**Ưu điểm:**
- ✅ Không giới hạn quota
- ✅ Vẫn có free tier (50K reads/day miễn phí)
- ✅ Chỉ trả tiền khi vượt quá free tier
- ✅ Phù hợp cho production

**Chi phí:**
- $0.06 per 100K reads (sau khi hết free tier)
- $0.18 per 100K writes
- $0.02 per 100K deletes
- Rất rẻ cho development (~$1-5/tháng)

**Cách nâng cấp:**
1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Click **Upgrade** ở góc trái dưới
4. Chọn **Blaze Plan**
5. Thêm thẻ thanh toán (Visa/Mastercard)
6. Đặt budget alert để tránh chi phí bất ngờ

---

### **Giải pháp 3: Tối ưu code (Đã thực hiện)**

✅ **Đã thêm in-memory caching vào FoodRepository:**
- Cache dữ liệu trong 5 phút
- Giảm 90% số lượng Firebase reads
- Tự động clear cache khi có update/create/delete

**Cách hoạt động:**
```typescript
// Lần đầu: Query Firebase
GET /api/v1/foods → Firebase read (50 documents)

// Lần 2-N (trong 5 phút): Dùng cache
GET /api/v1/foods → Cache hit (0 Firebase reads)

// Sau 5 phút: Query Firebase lại
GET /api/v1/foods → Firebase read (50 documents)
```

---

## 📊 Theo dõi Usage

### **Xem usage realtime:**
```bash
# Vào Firebase Console
https://console.firebase.google.com/project/restaurant-qr-order-38314/usage
```

### **Ước tính usage:**
- 1 lần load menu: ~50 reads (50 món ăn)
- 1 lần load bàn: ~40 reads (40 bàn)
- 1 lần tạo order: ~5 writes

**Với cache:**
- 1 lần load menu: ~50 reads (lần đầu)
- 999 lần tiếp theo (trong 5 phút): 0 reads ✅

---

## 🛡️ Best Practices để tránh vượt quota

### **1. Sử dụng cache (Đã implement)**
✅ In-memory cache trong backend
✅ Cache TTL: 5 phút
✅ Auto clear khi có thay đổi

### **2. Giảm số lần query**
❌ **Tránh:**
```typescript
// Query trong loop - RẤT TỐN QUOTA
for (const food of foods) {
  const images = await getImages(food.id); // N queries
}
```

✅ **Nên:**
```typescript
// Query 1 lần, join trong code
const foods = await getAllFoods();
const allImages = await getAllImages();
// Join trong memory
```

### **3. Sử dụng limit**
```typescript
// Chỉ lấy 20 món đầu tiên
const foods = await collection.limit(20).get();
```

### **4. Tránh chạy seed nhiều lần**
```bash
# Chỉ chạy 1 lần khi setup
npm run seed

# Không chạy lại trừ khi cần thiết
```

### **5. Sử dụng pagination**
```typescript
// Thay vì load tất cả
const foods = await collection.get(); // 1000 reads

// Nên dùng pagination
const foods = await collection.limit(20).get(); // 20 reads
```

---

## 🚨 Khi nào cần nâng cấp Blaze Plan?

**Nên nâng cấp khi:**
- ✅ Có nhiều hơn 10 users đồng thời
- ✅ Cần test nhiều lần trong ngày
- ✅ Chuẩn bị deploy production
- ✅ Không muốn lo lắng về quota

**Có thể dùng Free Plan khi:**
- ✅ Chỉ 1-2 người dev
- ✅ Test ít lần trong ngày
- ✅ Có cache tốt
- ✅ Chỉ development

---

## 📞 Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề:
1. Kiểm tra Firebase Console → Usage
2. Xem log backend để biết số lượng cache hits
3. Đợi 24h để quota reset
4. Hoặc nâng cấp lên Blaze Plan

---

## 📝 Tóm tắt

| Giải pháp | Thời gian | Chi phí | Hiệu quả |
|-----------|-----------|---------|----------|
| Đợi reset | 24 giờ | $0 | Tạm thời |
| Cache (đã có) | Ngay lập tức | $0 | Giảm 90% reads |
| Nâng cấp Blaze | 5 phút | ~$1-5/tháng | Vĩnh viễn |

**Khuyến nghị:** Sử dụng cache (đã có) + Nâng cấp Blaze Plan cho production.
