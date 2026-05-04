# 🔥 FIX FIRESTORE INDEX ERROR - 500

## 🔴 LỖI

```
ERROR  Error fetching menu items: [AxiosError: Request failed with status code 500]
```

**Backend error:**
```
9 FAILED_PRECONDITION: The query requires an index.
```

---

## 🎯 NGUYÊN NHÂN

Firestore cần **composite index** cho query:
```typescript
db.collection('food_image')
  .where('food_id', '==', id)
  .orderBy('display_order', 'asc')  // ← Cần index
```

Khi query có cả `where` và `orderBy`, Firestore yêu cầu tạo index.

---

## ✅ GIẢI PHÁP

### Option 1: Tạo Index Qua Firebase Console (Khuyến nghị)

1. **Click vào link trong error message:**
```
https://console.firebase.google.com/v1/r/project/restaurant-qr-order-38314/firestore/indexes?create_composite=...
```

2. **Hoặc tạo thủ công:**
   - Vào [Firebase Console](https://console.firebase.google.com/)
   - Chọn project: `restaurant-qr-order-38314`
   - Firestore Database → Indexes
   - Click **Create Index**
   
3. **Cấu hình index:**
   - Collection: `food_image`
   - Fields:
     - `food_id` - Ascending
     - `display_order` - Ascending
   - Query scope: Collection
   
4. **Click Create**

5. **Chờ index build** (1-5 phút)

6. **Test lại API**

---

### Option 2: Sửa Code (Temporary Fix)

Nếu không cần sort images, có thể bỏ `orderBy`:

**File:** `backend/src/infrastructure/database/repositories/FoodRepository.ts`

```typescript
// OLD (cần index)
const imagesSnapshot = await this.imagesCollection
  .where('food_id', '==', id)
  .orderBy('display_order', 'asc')  // ← Remove this
  .get();

// NEW (không cần index)
const imagesSnapshot = await this.imagesCollection
  .where('food_id', '==', id)
  .get();

// Sort in memory
const images: FoodImage[] = imagesSnapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() } as FoodImage))
  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
```

---

## 🚀 CÁCH FIX NHANH

### Bước 1: Lấy Index URL

Chạy API và copy URL từ error:

```bash
curl http://192.168.1.2:3000/api/v1/foods?is_available=true
```

Error sẽ chứa URL dạng:
```
https://console.firebase.google.com/v1/r/project/restaurant-qr-order-38314/firestore/indexes?create_composite=...
```

### Bước 2: Click URL

- Paste URL vào browser
- Đăng nhập Firebase
- Click **Create Index**

### Bước 3: Chờ

- Index status: **Building** → **Enabled**
- Thời gian: 1-5 phút

### Bước 4: Test

```bash
curl http://192.168.1.2:3000/api/v1/foods?is_available=true
```

**Expected:**
```json
{
  "success": true,
  "data": [...],
  "total": 16
}
```

---

## 📊 INDEX CẦN TẠO

### Index 1: food_image (food_id + display_order)
```
Collection: food_image
Fields:
  - food_id (Ascending)
  - display_order (Ascending)
Query scope: Collection
```

**Tại sao cần:**
- Query: `where('food_id', '==', id).orderBy('display_order')`
- Dùng trong: `findByIdWithImages()` và `findAllWithImages()`

---

## 🔍 VERIFY

### Check Index Status:

1. Vào Firebase Console
2. Firestore Database → Indexes
3. Xem status:
   - ⏳ **Building** - Đang tạo
   - ✅ **Enabled** - Sẵn sàng
   - ❌ **Error** - Lỗi

### Test API:

```bash
# Test get all foods
curl http://192.168.1.2:3000/api/v1/foods

# Test with filter
curl http://192.168.1.2:3000/api/v1/foods?is_available=true

# Test get by ID
curl http://192.168.1.2:3000/api/v1/foods/7MHQLmvrIn3nhvOSIVIo
```

### Test Mobile App:

1. Restart app
2. Navigate to menu
3. ✅ Thấy danh sách món ăn
4. ✅ Không còn error 500

---

## 📝 NOTES

### Khi nào cần index?

Firestore yêu cầu index khi:
- ✅ Query có `where` + `orderBy` trên fields khác nhau
- ✅ Query có nhiều `where` clauses
- ✅ Query có `orderBy` trên nhiều fields

### Khi nào KHÔNG cần index?

- ❌ Query chỉ có `where` đơn giản
- ❌ Query chỉ có `orderBy` đơn giản
- ❌ Query trên field đã được index tự động (như `__name__`)

### Auto-indexed fields:

Firestore tự động index:
- Document ID (`__name__`)
- Single field queries

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Index already exists"
- Index đã được tạo rồi
- Chờ status chuyển sang **Enabled**

### Lỗi: "Permission denied"
- Cần quyền Owner hoặc Editor trong Firebase project
- Liên hệ admin để cấp quyền

### Index build quá lâu
- Bình thường: 1-5 phút
- Nếu > 10 phút: Refresh page
- Nếu vẫn lỗi: Delete và tạo lại

---

## ✅ CHECKLIST

- [ ] Copy index URL từ error message
- [ ] Click URL và đăng nhập Firebase
- [ ] Click "Create Index"
- [ ] Chờ status = "Enabled"
- [ ] Test API với curl
- [ ] Test mobile app
- [ ] Verify không còn error 500

---

## 🎯 EXPECTED RESULT

**Before:**
```
❌ GET /api/v1/foods → 500 Internal Server Error
❌ Mobile app: "Error fetching menu items"
```

**After:**
```
✅ GET /api/v1/foods → 200 OK
✅ Mobile app: Hiển thị danh sách món ăn
✅ 16 món ăn được load thành công
```

---

**✨ Click vào index URL và tạo index ngay!**

**Index URL:** (Xem trong error message hoặc backend logs)
