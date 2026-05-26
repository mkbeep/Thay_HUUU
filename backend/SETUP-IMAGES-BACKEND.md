# 🖼️ Setup Ảnh Menu với Backend Static Server

## 📋 Tổng Quan

Thay vì upload ảnh lên Firebase Storage, hệ thống sử dụng **Backend Static Server** để serve ảnh trực tiếp từ thư mục `App/assets/images/menu/`.

### ✅ Ưu Điểm
- ✅ **Không cần upload** - Ảnh đã có sẵn trong project
- ✅ **Đơn giản** - Không cần cấu hình Firebase Storage
- ✅ **Nhanh** - Serve trực tiếp từ server
- ✅ **Miễn phí** - Không tốn chi phí storage
- ✅ **Dễ quản lý** - Chỉnh sửa ảnh trực tiếp trong thư mục

### ❌ Nhược Điểm
- ❌ Cần backend chạy để xem ảnh
- ❌ Không có CDN (có thể thêm Cloudflare sau)
- ❌ Bandwidth phụ thuộc vào server

---

## 🚀 Cách Sử Dụng

### Bước 1: Khởi động Backend

```bash
cd backend
npm run dev
```

Backend sẽ serve ảnh tại: `http://192.168.1.3:3000/images/menu/`

### Bước 2: Xóa Dữ Liệu Cũ (Nếu Có)

```bash
npm run clear:foods
```

### Bước 3: Seed Món Ăn với Backend URLs

```bash
npm run seed:foods-backend
```

Script này sẽ:
- Tạo 50 món ăn trong collection `food`
- Tạo 50 records trong collection `food_image` với URLs từ backend
- Mỗi món có 1 ảnh primary

---

## 📂 Cấu Trúc Thư Mục Ảnh

```
App/assets/images/menu/
├── appetizers/       # Khai vị (10 ảnh)
│   ├── goi-cuon.jpg
│   ├── nem-ran.jpg
│   └── ...
├── main-courses/     # Món chính (10 ảnh)
│   ├── lau-thai.jpg
│   ├── bo-luc-lac.jpg
│   └── ...
├── desserts/         # Tráng miệng (10 ảnh)
│   ├── che-ba-mau.jpg
│   ├── banh-flan.jpg
│   └── ...
├── beverages/        # Đồ uống (10 ảnh)
│   ├── nuoc-chanh-day.jpg
│   ├── tra-dao-cam-sa.jpg
│   └── ...
└── specials/         # Đặc biệt (10 ảnh)
    ├── set-lau-hai-san.jpg
    ├── combo-bbq.jpg
    └── ...
```

---

## 🔗 Format URL

### Backend Serve
```
http://192.168.1.3:3000/images/menu/{category}/{filename}
```

### Ví Dụ
```
http://192.168.1.3:3000/images/menu/appetizers/goi-cuon.jpg
http://192.168.1.3:3000/images/menu/main-courses/lau-thai.jpg
http://192.168.1.3:3000/images/menu/desserts/che-ba-mau.jpg
```

---

## ✅ Kiểm Tra Kết Quả

### 1. Kiểm Tra Backend Serve Ảnh

Mở trình duyệt và truy cập:
```
http://192.168.1.3:3000/images/menu/appetizers/goi-cuon.jpg
```

Nếu thấy ảnh → ✅ Backend đang serve ảnh đúng

### 2. Kiểm Tra Firestore

```bash
npm run check:food
```

Kết quả mong đợi:
```
✅ Found 50 foods
📸 Found 50 food images

Sample foods:
1. Gỏi cuốn tôm thịt - 45,000₫
   Category: Khai vị
   Available: ✅
   Images: 1
   URL: http://192.168.1.3:3000/images/menu/appetizers/goi-cuon.jpg
```

### 3. Kiểm Tra API

```bash
curl http://192.168.1.3:3000/api/v1/foods
```

Response:
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
          "image_url": "http://192.168.1.3:3000/images/menu/appetizers/goi-cuon.jpg",
          "is_primary": true
        }
      ]
    }
  ]
}
```

### 4. Kiểm Tra Admin Web

1. Mở admin-web: `http://192.168.1.3:5173`
2. Đăng nhập
3. Vào trang **Menu**
4. Kiểm tra xem ảnh có hiển thị không

### 5. Kiểm Tra Mobile App

1. Mở App trên điện thoại/emulator
2. Vào trang **Menu**
3. Kiểm tra xem ảnh có hiển thị không

---

## 🐛 Troubleshooting

### Vấn đề 1: Ảnh không hiển thị

**Nguyên nhân:**
- Backend chưa chạy
- Đường dẫn ảnh sai
- CORS chưa được cấu hình

**Giải pháp:**
1. Kiểm tra backend đang chạy:
   ```bash
   curl http://192.168.1.3:3000
   ```

2. Kiểm tra ảnh có tồn tại:
   ```bash
   ls App/assets/images/menu/appetizers/
   ```

3. Kiểm tra CORS trong `.env`:
   ```
   CORS_ORIGIN=http://localhost:5173,http://192.168.1.3:5173,http://localhost:19006,http://192.168.1.3:19006
   ```

### Vấn đề 2: Một số danh mục không hiển thị

**Nguyên nhân:**
- Thiếu ảnh trong thư mục
- Tên file không khớp với seed script

**Giải pháp:**
1. Kiểm tra số lượng ảnh:
   ```bash
   ls App/assets/images/menu/appetizers/ | wc -l
   ls App/assets/images/menu/main-courses/ | wc -l
   ls App/assets/images/menu/desserts/ | wc -l
   ls App/assets/images/menu/beverages/ | wc -l
   ls App/assets/images/menu/specials/ | wc -l
   ```

2. Kiểm tra tên file trong `seed-foods-backend-images.ts`

3. Thêm ảnh thiếu hoặc dùng ảnh placeholder

### Vấn đề 3: Ảnh load chậm

**Nguyên nhân:**
- Ảnh quá lớn
- Không có cache

**Giải pháp:**
1. Nén ảnh xuống < 500KB
2. Backend đã có cache 1 ngày
3. Có thể thêm CDN (Cloudflare) sau

---

## 🔄 Thay Đổi Ảnh

### Thêm Ảnh Mới

1. Copy ảnh vào thư mục tương ứng:
   ```bash
   cp new-image.jpg App/assets/images/menu/appetizers/
   ```

2. Không cần restart backend (static files)

3. Update database nếu cần:
   ```typescript
   await foodImagesCollection.add({
     food_id: 'food-id',
     image_url: 'http://192.168.1.3:3000/images/menu/appetizers/new-image.jpg',
     is_primary: true,
     display_order: 0,
   });
   ```

### Thay Thế Ảnh

1. Thay file ảnh trực tiếp:
   ```bash
   cp new-goi-cuon.jpg App/assets/images/menu/appetizers/goi-cuon.jpg
   ```

2. Clear cache trình duyệt (Ctrl+F5)

---

## 📊 So Sánh với Firebase Storage

| Tiêu Chí | Backend Static | Firebase Storage |
|----------|----------------|------------------|
| Setup | ✅ Đơn giản | ❌ Phức tạp |
| Upload | ✅ Không cần | ❌ Cần upload |
| Chi phí | ✅ Miễn phí | ⚠️ Có giới hạn |
| CDN | ❌ Không có | ✅ Có sẵn |
| Bandwidth | ⚠️ Phụ thuộc server | ✅ Unlimited |
| Quản lý | ✅ Dễ | ⚠️ Trung bình |

---

## 🎯 Kết Luận

Backend Static Server là giải pháp **đơn giản, nhanh, miễn phí** cho việc serve ảnh menu. Phù hợp cho:
- ✅ Development
- ✅ Small-scale production
- ✅ Prototype/MVP

Nếu cần scale lớn, có thể:
1. Thêm CDN (Cloudflare)
2. Chuyển sang Firebase Storage
3. Dùng dịch vụ khác (Cloudinary, Imgur)

---

## 📝 Scripts Tóm Tắt

| Script | Mô Tả |
|--------|-------|
| `npm run dev` | Khởi động backend (serve ảnh) |
| `npm run clear:foods` | Xóa tất cả món ăn |
| `npm run seed:foods-backend` | Seed 50 món với backend URLs |
| `npm run check:food` | Kiểm tra dữ liệu món ăn |

---

## 🔗 Liên Kết

- Backend: http://192.168.1.3:3000
- Admin Web: http://192.168.1.3:5173
- API Docs: http://192.168.1.3:3000/api/v1
- Images: http://192.168.1.3:3000/images/menu/
