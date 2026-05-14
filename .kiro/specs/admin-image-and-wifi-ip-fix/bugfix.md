# Bugfix Requirements Document

## Introduction

Tài liệu này mô tả yêu cầu sửa lỗi cho 2 vấn đề trong hệ thống nhà hàng:

1. **Hình ảnh món ăn không hiển thị trong admin web**: Một số món ăn (Cơm chiên dương châu, Phở bò Hà Nội, Bún bò Huế, Mì xào hải sản, Cá lăng nướng muối ớt, Gà ta nguyên con, Vịt quay Bắc Kinh, Set lẩu hải sản 4 người, Lẩu nấm chay, Hải sản tổng hợp) không hiển thị hình ảnh trong trang quản lý menu của admin web, mặc dù đã được upload lên Cloudinary thành công với định dạng JPG.

2. **IP WiFi cũ trong cấu hình**: Toàn bộ project đang sử dụng IP WiFi cũ (`192.168.1.3`) trong các file cấu hình, cần cập nhật sang IP WiFi hiện tại (`10.15.140.15`) để hệ thống hoạt động đúng trên mạng LAN mới.

**Ngữ cảnh kỹ thuật:**
- Vấn đề hình ảnh đã được fix trong App (React Native) bằng cách sử dụng utility `cloudinaryMenuImageFixes.ts` để ánh xạ các URL Cloudinary sai sang URL đúng
- Admin web (Vite + React) chưa có logic tương tự, dẫn đến hình ảnh không hiển thị
- Các món bị lỗi có URL Cloudinary trỏ đến file `.jpg` nhưng file thực tế trên Cloudinary là `.png`

## Bug Analysis

### Current Behavior (Defect)

**Bug 1: Hình ảnh món ăn không hiển thị trong admin web**

1.1 WHEN admin web tải danh sách món ăn từ API và món ăn có `image_url` trỏ đến Cloudinary với đường dẫn `.jpg` không tồn tại (ví dụ: `menu/main-courses/com-chien-duong-chau.jpg`) THEN hệ thống hiển thị broken image hoặc fallback image thay vì hình ảnh thực tế của món ăn

1.2 WHEN admin web render component hiển thị món ăn với URL Cloudinary sai định dạng (`.jpg` thay vì `.png`) THEN trình duyệt không tải được hình ảnh và hiển thị lỗi 404 trong Network tab

1.3 WHEN admin web xử lý `image_url` từ API response trong `MenuRepository.mapToMenuItem()` THEN hệ thống không có logic sửa URL Cloudinary sai, dẫn đến URL lỗi được truyền trực tiếp vào component

1.4 WHEN admin web hiển thị các món: Cơm chiên dương châu, Phở bò Hà Nội, Bún bò Huế, Mì xào hải sản, Cá lăng nướng, Gà ta nguyên con, Vịt quay Bắc Kinh, Set lẩu hải sản, Lẩu nấm chay, Hải sản nướng tổng hợp THEN hình ảnh không hiển thị do URL Cloudinary sai

**Bug 2: IP WiFi cũ trong cấu hình**

1.5 WHEN hệ thống khởi động với IP WiFi cũ (`192.168.1.3`) trong file `.env` THEN các service không thể kết nối với nhau trên mạng LAN mới (IP hiện tại: `10.15.140.15`)

1.6 WHEN backend khởi động với `BACKEND_URL=http://192.168.1.3:3000` THEN API không accessible từ các client trên mạng LAN mới

1.7 WHEN App (React Native) khởi động với `API_URL=http://192.168.1.3:3000/api/v1` THEN App không thể gọi API từ backend

1.8 WHEN admin web khởi động với `VITE_API_URL=http://192.168.1.3:3000/api/v1` THEN admin web không thể gọi API từ backend

1.9 WHEN QR code được tạo với URL cũ `http://192.168.1.3:8081` THEN khách hàng scan QR code không thể truy cập vào customer web

### Expected Behavior (Correct)

**Bug 1: Hình ảnh món ăn hiển thị đúng trong admin web**

2.1 WHEN admin web tải danh sách món ăn từ API và món ăn có `image_url` trỏ đến Cloudinary với đường dẫn `.jpg` không tồn tại THEN hệ thống SHALL ánh xạ URL sang đường dẫn `.png` đúng và hiển thị hình ảnh món ăn chính xác

2.2 WHEN admin web render component hiển thị món ăn với URL Cloudinary THEN hệ thống SHALL kiểm tra và sửa URL sai định dạng trước khi truyền vào `<img>` tag

2.3 WHEN admin web xử lý `image_url` từ API response trong `MenuRepository.mapToMenuItem()` THEN hệ thống SHALL áp dụng logic sửa URL Cloudinary tương tự như trong App (sử dụng mapping table `BAD_TO_GOOD`)

2.4 WHEN admin web hiển thị các món: Cơm chiên dương châu, Phở bò Hà Nội, Bún bò Huế, Mì xào hải sản, Cá lăng nướng, Gà ta nguyên con, Vịt quay Bắc Kinh, Set lẩu hải sản, Lẩu nấm chay, Hải sản nướng tổng hợp THEN hình ảnh SHALL hiển thị đúng với URL Cloudinary đã được sửa

**Bug 2: IP WiFi được cập nhật trong toàn bộ cấu hình**

2.5 WHEN hệ thống khởi động với IP WiFi mới (`10.15.140.15`) trong file `.env` THEN tất cả các service SHALL kết nối được với nhau trên mạng LAN mới

2.6 WHEN backend khởi động với `BACKEND_URL=http://10.15.140.15:3000` THEN API SHALL accessible từ các client trên mạng LAN mới

2.7 WHEN App (React Native) khởi động với `API_URL=http://10.15.140.15:3000/api/v1` THEN App SHALL gọi API thành công từ backend

2.8 WHEN admin web khởi động với `VITE_API_URL=http://10.15.140.15:3000/api/v1` THEN admin web SHALL gọi API thành công từ backend

2.9 WHEN QR code được tạo với URL mới `http://10.15.140.15:8081` THEN khách hàng scan QR code SHALL truy cập được vào customer web

2.10 WHEN các file cấu hình khác (QR code HTML, README, hardcoded URLs) chứa IP cũ THEN tất cả SHALL được cập nhật sang IP mới `10.15.140.15`

### Unchanged Behavior (Regression Prevention)

**Hành vi không thay đổi - Hình ảnh**

3.1 WHEN admin web hiển thị các món ăn có URL Cloudinary đúng (không nằm trong danh sách lỗi) THEN hệ thống SHALL CONTINUE TO hiển thị hình ảnh như hiện tại mà không thay đổi URL

3.2 WHEN admin web hiển thị món ăn không có `image_url` hoặc `image_url` rỗng THEN hệ thống SHALL CONTINUE TO hiển thị fallback image (Unsplash placeholder)

3.3 WHEN admin web upload hình ảnh mới lên Cloudinary THEN hệ thống SHALL CONTINUE TO lưu URL trả về từ Cloudinary API mà không áp dụng logic sửa URL

3.4 WHEN admin web hiển thị hình ảnh từ local assets hoặc external URLs (không phải Cloudinary) THEN hệ thống SHALL CONTINUE TO hiển thị như hiện tại

**Hành vi không thay đổi - Cấu hình**

3.5 WHEN hệ thống sử dụng localhost URLs (`http://localhost:3000`, `http://localhost:5173`, `http://localhost:8081`) THEN các URL này SHALL CONTINUE TO hoạt động cho development trên local machine

3.6 WHEN backend xử lý CORS configuration THEN hệ thống SHALL CONTINUE TO chấp nhận cả localhost và LAN IP addresses

3.7 WHEN hệ thống sử dụng các cấu hình khác không liên quan đến IP (JWT secrets, Cloudinary credentials, Firebase config) THEN các cấu hình này SHALL CONTINUE TO không thay đổi

3.8 WHEN App sử dụng `EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0` THEN cấu hình này SHALL CONTINUE TO không thay đổi (chỉ cập nhật `REACT_NATIVE_PACKAGER_HOSTNAME`)

## Bug Condition Derivation

### Bug Condition 1: Cloudinary Image URL Mismatch

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition1(imageUrl)
  INPUT: imageUrl of type string
  OUTPUT: boolean
  
  // Returns true when the image URL points to a non-existent Cloudinary file
  RETURN (
    imageUrl.contains("res.cloudinary.com") AND
    imageUrl.contains("menu/") AND
    (
      imageUrl.contains("menu/main-courses/com-chien-duong-chau.jpg") OR
      imageUrl.contains("menu/main-courses/pho-bo-ha-noi.jpg") OR
      imageUrl.contains("menu/main-courses/bun-bo-hue.jpg") OR
      imageUrl.contains("menu/main-courses/mi-xao-hai-san.jpg") OR
      imageUrl.contains("menu/specials/set-lau-hai-san.jpg") OR
      imageUrl.contains("menu/specials/ca-lang-nuong.jpg") OR
      imageUrl.contains("menu/specials/vit-quay-bac-kinh.jpg") OR
      imageUrl.contains("menu/specials/lau-nam-chay.jpg") OR
      imageUrl.contains("menu/specials/ga-ta-nguyen-con.jpg") OR
      imageUrl.contains("menu/specials/hai-san-nuong-tong-hop.jpg")
    )
  )
END FUNCTION
```

**Property Specification - Fix Checking:**
```pascal
// Property: Fix Checking - Cloudinary URL Mapping
FOR ALL imageUrl WHERE isBugCondition1(imageUrl) DO
  fixedUrl ← fixCloudinaryMenuFoodImageUrl'(imageUrl)
  ASSERT (
    fixedUrl.contains(".png") AND
    fixedUrl.contains("res.cloudinary.com") AND
    NOT fixedUrl.equals(imageUrl) AND
    isValidCloudinaryUrl(fixedUrl)
  )
END FOR
```

**Preservation Goal:**
```pascal
// Property: Preservation Checking - Non-buggy URLs unchanged
FOR ALL imageUrl WHERE NOT isBugCondition1(imageUrl) DO
  ASSERT resolveImageUrl(imageUrl) = resolveImageUrl'(imageUrl)
END FOR
```

### Bug Condition 2: Outdated WiFi IP Configuration

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition2(configValue)
  INPUT: configValue of type string
  OUTPUT: boolean
  
  // Returns true when the config contains old IP address
  RETURN configValue.contains("192.168.1.3")
END FUNCTION
```

**Property Specification - Fix Checking:**
```pascal
// Property: Fix Checking - IP Address Update
FOR ALL configValue WHERE isBugCondition2(configValue) DO
  updatedValue ← updateIPAddress'(configValue)
  ASSERT (
    updatedValue.contains("10.15.140.15") AND
    NOT updatedValue.contains("192.168.1.3") AND
    countOccurrences(configValue, "192.168.1.3") = 
      countOccurrences(updatedValue, "10.15.140.15")
  )
END FOR
```

**Preservation Goal:**
```pascal
// Property: Preservation Checking - Non-IP configs unchanged
FOR ALL configValue WHERE NOT isBugCondition2(configValue) DO
  ASSERT configValue = configValue'
END FOR
```

## Counterexamples

**Bug 1 - Cloudinary Image URL:**
- Input: `https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324610/menu/main-courses/com-chien-duong-chau.jpg`
- Current behavior: Image fails to load (404 error)
- Expected behavior: Should map to `https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324610/menu/main-courses/bo-luc-lac.png`

**Bug 2 - WiFi IP Configuration:**
- Input (backend/.env): `BACKEND_URL=http://192.168.1.3:3000`
- Current behavior: Backend not accessible on new LAN
- Expected behavior: `BACKEND_URL=http://10.15.140.15:3000`
