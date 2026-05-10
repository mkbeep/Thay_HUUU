# Hướng Dẫn Setup Firebase Storage cho Menu Images

## Tổng Quan

Hệ thống sử dụng Firebase Storage để lưu trữ ảnh món ăn. Ảnh được upload từ `App/assets/images/menu/` lên Firebase Storage và URL được lưu trong Firestore.

## Cấu Trúc Thư Mục

```
App/assets/images/menu/
├── appetizers/       # Khai vị (10 ảnh)
├── main-courses/     # Món chính (10 ảnh)
├── desserts/         # Tráng miệng (10 ảnh)
├── beverages/        # Đồ uống (10 ảnh)
└── specials/         # Đặc biệt (9 ảnh)
```

## Các Bước Setup

### Bước 1: Upload Ảnh Lên Firebase Storage

```bash
cd backend
npm run upload:images
```

Script này sẽ:
- Upload tất cả ảnh từ `App/assets/images/menu/` lên Firebase Storage
- Tạo public URLs cho mỗi ảnh
- Lưu mapping vào file `backend/scripts/menu-image-urls.json`

**Kết quả:**
```
menu/
├── appetizers/
│   ├── goi-cuon.jpg
│   ├── nem-ran.jpg
│   └── ...
├── main-courses/
│   ├── lau-thai.jpg
│   └── ...
└── ...
```

### Bước 2: Xóa Dữ Liệu Cũ (Nếu Có)

```bash
npm run clear:foods
```

### Bước 3: Seed Món Ăn Với Firebase Storage URLs

```bash
npm run seed:foods-firebase
```

Script này sẽ:
- Tạo 50 món ăn trong collection `food`
- Tạo 50 records trong collection `food_image` với Firebase Storage URLs
- Mỗi món có 1 ảnh primary từ Firebase Storage

## Kiểm Tra Kết Quả

### 1. Kiểm Tra Firebase Storage

Vào Firebase Console:
1. Mở project: `restaurant-qr-order-38314`
2. Vào **Storage** → **Files**
3. Kiểm tra thư mục `menu/` có đầy đủ ảnh

### 2. Kiểm Tra Firestore

```bash
npm run check:food
```

Kết quả mong đợi:
```
🍽️  Found 50 foods
📸 Found 50 food images

Sample foods:
1. Gỏi cuốn tôm thịt - 45,000₫
   Category: Khai vị
   Available: ✅
   Images: 1
   URL: https://storage.googleapis.com/restaurant-qr-order-38314.appspot.com/menu/appetizers/goi-cuon.jpg
```

### 3. Kiểm Tra API

```bash
# Lấy tất cả món ăn
curl http://localhost:3000/api/v1/foods

# Lấy món ăn theo category
curl http://localhost:3000/api/v1/foods?category=Khai%20v%E1%BB%8B
```

Response sẽ có format:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Gỏi cuốn tôm thịt",
      "base_price": 45000,
      "category": "Khai vị",
      "images": [
        {
          "id": "...",
          "food_id": "...",
          "image_url": "https://storage.googleapis.com/.../menu/appetizers/goi-cuon.jpg",
          "is_primary": true,
          "display_order": 0
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Lỗi: "Permission denied" khi upload

**Giải pháp:**
1. Kiểm tra Firebase Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /menu/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

2. Hoặc tạm thời cho phép public write (CHỈ DÙNG CHO DEV):
```javascript
match /menu/{allPaths=**} {
  allow read, write: if true;
}
```

### Lỗi: "Bucket not found"

**Giải pháp:**
1. Kiểm tra `.env` có đúng `FIREBASE_PROJECT_ID`
2. Enable Firebase Storage trong Firebase Console
3. Bucket name phải là: `{FIREBASE_PROJECT_ID}.appspot.com`

### Ảnh không hiển thị trong admin-web

**Nguyên nhân:** MenuRepository không map `images` array

**Đã sửa:** MenuRepository.ts đã được cập nhật để lấy primary image từ `images` array

## Cấu Trúc Dữ Liệu

### Collection: `food`
```typescript
{
  id: string
  name: string
  description: string
  base_price: number
  category: 'Khai vị' | 'Món chính' | 'Tráng miệng' | 'Đồ uống' | 'Đặc biệt'
  is_available: boolean
  is_vegetarian: boolean
  is_spicy: boolean
  created_at: Timestamp
  updated_at: Timestamp
}
```

### Collection: `food_image`
```typescript
{
  id: string
  food_id: string  // Reference to food.id
  image_url: string  // Firebase Storage public URL
  is_primary: boolean
  display_order: number
  uploaded_at: Timestamp
}
```

## Scripts Tóm Tắt

| Script | Mô Tả |
|--------|-------|
| `npm run upload:images` | Upload ảnh từ App/assets lên Firebase Storage |
| `npm run clear:foods` | Xóa tất cả món ăn và ảnh |
| `npm run seed:foods-firebase` | Seed 50 món với Firebase Storage URLs |
| `npm run check:food` | Kiểm tra dữ liệu món ăn |

## Lưu Ý

1. **Chạy theo thứ tự:**
   - `upload:images` → `clear:foods` → `seed:foods-firebase`

2. **Firebase Storage URLs:**
   - Format: `https://storage.googleapis.com/{bucket}/{path}`
   - Public accessible (không cần authentication)
   - Cache: 1 năm (`max-age=31536000`)

3. **Backup:**
   - File `menu-image-urls.json` chứa mapping của tất cả URLs
   - Có thể dùng để restore hoặc reference

4. **Performance:**
   - Ảnh được cache bởi CDN của Google
   - Load nhanh hơn so với external URLs
   - Không bị giới hạn bandwidth
