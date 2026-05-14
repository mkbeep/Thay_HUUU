# Admin Image and WiFi IP Fix - Bugfix Design

## Overview

Tài liệu thiết kế này mô tả cách sửa 2 lỗi trong hệ thống nhà hàng:

1. **Bug 1 - Cloudinary Image URL Mismatch**: Admin web không hiển thị hình ảnh cho 10 món ăn do URL Cloudinary trỏ đến file `.jpg` không tồn tại, trong khi file thực tế trên Cloudinary là `.png`. App (React Native) đã có logic sửa URL này trong `cloudinaryMenuImageFixes.ts`, nhưng admin web chưa có logic tương tự.

2. **Bug 2 - Outdated WiFi IP Configuration**: Toàn bộ project đang sử dụng IP WiFi cũ (`192.168.1.3`) trong các file cấu hình, cần cập nhật sang IP WiFi hiện tại (`10.15.140.15`) để hệ thống hoạt động đúng trên mạng LAN mới.

**Chiến lược sửa lỗi**:
- **Bug 1**: Port logic `fixCloudinaryMenuFoodImageUrl()` từ App sang admin web, áp dụng trong `MenuRepository.mapToMenuItem()`
- **Bug 2**: Tìm và thay thế tất cả occurrences của `192.168.1.3` bằng `10.15.140.15` trong các file `.env`, QR code files, và hardcoded URLs

## Glossary

- **Bug_Condition_1 (C1)**: Điều kiện kích hoạt bug hình ảnh - khi URL Cloudinary chứa path `.jpg` không tồn tại cho 10 món ăn cụ thể
- **Bug_Condition_2 (C2)**: Điều kiện kích hoạt bug IP - khi config value chứa IP cũ `192.168.1.3`
- **Property_1 (P1)**: Hành vi mong muốn cho C1 - URL Cloudinary sai được ánh xạ sang URL `.png` đúng
- **Property_2 (P2)**: Hành vi mong muốn cho C2 - IP cũ được thay thế bằng IP mới `10.15.140.15`
- **Preservation_1**: Các URL Cloudinary không nằm trong danh sách lỗi phải giữ nguyên
- **Preservation_2**: Các config không chứa IP (JWT secrets, Cloudinary credentials) phải giữ nguyên
- **BAD_TO_GOOD**: Mapping table ánh xạ từ URL Cloudinary sai sang URL đúng (10 entries)
- **MenuRepository**: Repository class trong admin web xử lý CRUD operations cho menu items
- **mapToMenuItem()**: Method trong MenuRepository chuyển đổi API response thành domain model MenuItem
- **resolveImageUrl()**: Helper function trong MenuRepository xử lý relative/absolute URLs
- **fixCloudinaryMenuFoodImageUrl()**: Function cần port từ App để sửa URL Cloudinary sai

## Bug Details

### Bug Condition 1: Cloudinary Image URL Mismatch

Admin web hiển thị broken images cho 10 món ăn vì URL Cloudinary trong database trỏ đến file `.jpg` không tồn tại, trong khi file thực tế trên Cloudinary là `.png`. App đã có logic sửa URL này, nhưng admin web chưa có.

**Formal Specification:**
```
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

### Bug Condition 2: Outdated WiFi IP Configuration

Hệ thống sử dụng IP WiFi cũ (`192.168.1.3`) trong các file cấu hình, khiến các service không thể kết nối với nhau trên mạng LAN mới (IP hiện tại: `10.15.140.15`).

**Formal Specification:**
```
FUNCTION isBugCondition2(configValue)
  INPUT: configValue of type string
  OUTPUT: boolean
  
  // Returns true when the config contains old IP address
  RETURN configValue.contains("192.168.1.3")
END FUNCTION
```

### Examples

**Bug 1 - Cloudinary Image URL:**
- **Input**: `https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324610/menu/main-courses/com-chien-duong-chau.jpg`
- **Current behavior**: Image fails to load (404 error), admin web shows broken image
- **Expected behavior**: Should map to `https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324610/menu/main-courses/bo-luc-lac.png`

- **Input**: `https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324623/menu/specials/vit-quay-bac-kinh.jpg`
- **Current behavior**: Image fails to load (404 error)
- **Expected behavior**: Should map to `https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324630/menu/main-courses/vit-quay-bac-kinh.png`

- **Input**: Valid Cloudinary URL `https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324617/menu/appetizers/goi-cuon.jpg`
- **Current behavior**: Image loads correctly
- **Expected behavior**: URL should remain unchanged (preservation)

**Bug 2 - WiFi IP Configuration:**
- **Input** (backend/.env): `BACKEND_URL=http://192.168.1.3:3000`
- **Current behavior**: Backend not accessible on new LAN, API calls fail
- **Expected behavior**: `BACKEND_URL=http://10.15.140.15:3000`

- **Input** (App/.env): `API_URL=http://192.168.1.3:3000/api/v1`
- **Current behavior**: App cannot connect to backend
- **Expected behavior**: `API_URL=http://10.15.140.15:3000/api/v1`

- **Input** (QR code HTML): `<p class="url">http://192.168.1.3:8081/table/1?tid=...</p>`
- **Current behavior**: Customers cannot access customer web after scanning QR
- **Expected behavior**: `<p class="url">http://10.15.140.15:8081/table/1?tid=...</p>`

- **Edge case** (localhost URL): `http://localhost:3000`
- **Current behavior**: Works for local development
- **Expected behavior**: Should remain unchanged (preservation)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors - Bug 1 (Cloudinary Images):**
- Admin web displaying menu items with correct Cloudinary URLs (not in the BAD_TO_GOOD list) must continue to show images without URL modification
- Admin web displaying menu items without `image_url` or with empty `image_url` must continue to show fallback image (Unsplash placeholder)
- Admin web uploading new images to Cloudinary must continue to save the URL returned from Cloudinary API without applying fix logic
- Admin web displaying images from local assets or external URLs (non-Cloudinary) must continue to display as before

**Unchanged Behaviors - Bug 2 (WiFi IP):**
- System using localhost URLs (`http://localhost:3000`, `http://localhost:5173`, `http://localhost:8081`) must continue to work for local development
- Backend CORS configuration must continue to accept both localhost and LAN IP addresses
- System using other configs unrelated to IP (JWT secrets, Cloudinary credentials, Firebase config) must continue unchanged
- App using `EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0` must continue unchanged (only update `REACT_NATIVE_PACKAGER_HOSTNAME`)

## Hypothesized Root Cause

### Bug 1 - Cloudinary Image URL Mismatch

Based on the bug description and code analysis, the root cause is:

1. **Missing URL Fix Logic in Admin Web**: Admin web's `MenuRepository.mapToMenuItem()` calls `resolveImageUrl()` which only handles relative/absolute URL conversion, but does NOT apply the Cloudinary URL fix logic that exists in App's `cloudinaryMenuImageFixes.ts`

2. **Database Contains Incorrect URLs**: The Firestore database contains `image_url` fields pointing to `.jpg` files that were never uploaded to Cloudinary, while the actual uploaded files are `.png`

3. **App Has Workaround, Admin Web Does Not**: App works around this by applying `fixCloudinaryMenuFoodImageUrl()` after resolving URLs, but admin web lacks this step

4. **No Validation During Upload**: When images were initially uploaded, there was no validation to ensure the database URL matched the actual Cloudinary file extension

### Bug 2 - Outdated WiFi IP Configuration

Based on the bug description, the root cause is:

1. **Network Change**: The WiFi network IP changed from `192.168.1.3` to `10.15.140.15`, but configuration files were not updated

2. **Hardcoded IP in Multiple Locations**: The old IP is hardcoded in:
   - Environment files (`.env` in backend, App, admin-web)
   - QR code HTML file (`backend/qr-codes/index.html`)
   - QR code README (`backend/qr-codes/README.md`)
   - Fallback IP in `App/src/utils/apiBaseUrl.ts`

3. **No Centralized Configuration**: IP configuration is duplicated across multiple files instead of being centralized, making updates error-prone

4. **QR Codes Contain Old URLs**: The QR code images themselves encode the old IP, requiring regeneration (but this is outside the scope of this bugfix - we only update the HTML/README documentation)

## Correctness Properties

Property 1: Bug Condition 1 - Cloudinary URL Mapping

_For any_ image URL where the bug condition holds (isBugCondition1 returns true), the fixed admin web SHALL apply the BAD_TO_GOOD mapping to convert the incorrect `.jpg` URL to the correct `.png` URL, ensuring the image displays correctly in the admin interface.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation 1 - Non-buggy Image URLs Unchanged

_For any_ image URL where the bug condition does NOT hold (isBugCondition1 returns false), the fixed admin web SHALL produce exactly the same resolved URL as before, preserving all existing functionality for correct Cloudinary URLs, local assets, external URLs, and fallback images.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 3: Bug Condition 2 - IP Address Update

_For any_ configuration value where the bug condition holds (isBugCondition2 returns true), the fixed configuration files SHALL replace all occurrences of `192.168.1.3` with `10.15.140.15`, ensuring all services can connect on the new LAN network.

**Validates: Requirements 2.5, 2.6, 2.7, 2.8, 2.9, 2.10**

Property 4: Preservation 2 - Non-IP Configs Unchanged

_For any_ configuration value where the bug condition does NOT hold (isBugCondition2 returns false), the fixed configuration files SHALL remain exactly the same, preserving localhost URLs, JWT secrets, Cloudinary credentials, Firebase config, and other non-IP settings.

**Validates: Requirements 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

#### Bug 1 - Cloudinary Image URL Fix

**File**: `admin-web/src/data/repositories/MenuRepository.ts`

**Specific Changes**:

1. **Add BAD_TO_GOOD Mapping Table**: Add the same mapping table from `App/src/utils/cloudinaryMenuImageFixes.ts` at the top of the file (after imports)
   ```typescript
   const BAD_TO_GOOD: [string, string][] = [
     ['menu/main-courses/com-chien-duong-chau.jpg', 'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324610/menu/main-courses/bo-luc-lac.png'],
     // ... 9 more entries
   ];
   ```

2. **Add fixCloudinaryMenuFoodImageUrl() Function**: Port the function from App to admin web (after the mapping table)
   ```typescript
   const fixCloudinaryMenuFoodImageUrl = (url: string): string => {
     const u = (url || '').trim();
     if (!u || !u.includes('res.cloudinary.com')) {
       return u;
     }
     const lower = u.toLowerCase();
     for (const [bad, good] of BAD_TO_GOOD) {
       if (lower.includes(bad.toLowerCase())) {
         return good;
       }
     }
     return u;
   };
   ```

3. **Update resolveImageUrl() Function**: Modify the existing `resolveImageUrl()` helper to apply the fix after URL resolution
   ```typescript
   const resolveImageUrl = (rawUrl?: string): string => {
     // ... existing logic ...
     const resolvedUrl = /* existing resolution logic */;
     return fixCloudinaryMenuFoodImageUrl(resolvedUrl);
   };
   ```

4. **No Changes to mapToMenuItem()**: The `mapToMenuItem()` method already calls `resolveImageUrl()`, so no changes needed there

#### Bug 2 - WiFi IP Configuration Update

**Files to Update**:

1. **backend/.env**:
   - Change `BACKEND_URL=http://192.168.1.3:3000` → `http://10.15.140.15:3000`
   - Change `CORS_ORIGIN=http://localhost:5173,http://192.168.1.3:5173,...` → `http://localhost:5173,http://10.15.140.15:5173,...` (3 occurrences)
   - Change `CUSTOMER_WEB_BASE_URL=http://192.168.1.3:8081` → `http://10.15.140.15:8081`

2. **App/.env**:
   - Change `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.3` → `10.15.140.15`
   - Change `API_URL=http://192.168.1.3:3000/api/v1` → `http://10.15.140.15:3000/api/v1`
   - Change `CUSTOMER_WEB_BASE_URL=http://192.168.1.3:8081` → `http://10.15.140.15:8081`

3. **admin-web/.env**:
   - Change `VITE_API_URL=http://192.168.1.3:3000/api/v1` → `http://10.15.140.15:3000/api/v1`
   - Change `VITE_CUSTOMER_WEB_URL=http://192.168.1.3:8081` → `http://10.15.140.15:8081`

4. **App/src/utils/apiBaseUrl.ts**:
   - Change fallback URL in line 11: `'http://192.168.1.3:3000/api/v1'` → `'http://10.15.140.15:3000/api/v1'`

5. **backend/qr-codes/index.html**:
   - Replace all 20 occurrences of `http://192.168.1.3:8081` with `http://10.15.140.15:8081` in the `<p class="url">` tags

6. **backend/qr-codes/README.md**:
   - Change `**Web Base URL**: http://192.168.1.3:8081` → `http://10.15.140.15:8081`

**Note**: QR code PNG images themselves contain encoded URLs with old IP, but regenerating them is outside the scope of this bugfix. The HTML and README updates are sufficient for documentation purposes.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach:
1. **Exploratory Bug Condition Checking**: Surface counterexamples that demonstrate the bugs BEFORE implementing fixes
2. **Fix and Preservation Checking**: Verify fixes work correctly and existing behavior is preserved

### Exploratory Bug Condition Checking

#### Bug 1 - Cloudinary Image URL

**Goal**: Surface counterexamples that demonstrate the image loading bug BEFORE implementing the fix. Confirm that admin web fails to load images for the 10 affected menu items.

**Test Plan**: Write tests that fetch menu items from the API and check if the image URLs are correctly resolved. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Cơm chiên dương châu Test**: Fetch menu item with `com-chien-duong-chau.jpg` in URL (will fail on unfixed code - broken image)
2. **Phở bò Hà Nội Test**: Fetch menu item with `pho-bo-ha-noi.jpg` in URL (will fail on unfixed code - broken image)
3. **Vịt quay Bắc Kinh Test**: Fetch menu item with `vit-quay-bac-kinh.jpg` in URL (will fail on unfixed code - broken image)
4. **Valid Image Test**: Fetch menu item with correct Cloudinary URL like `goi-cuon.jpg` (should pass on unfixed code - preservation check)

**Expected Counterexamples**:
- Image URLs containing `.jpg` paths in BAD_TO_GOOD list are not mapped to `.png` URLs
- Admin web displays broken images or 404 errors in browser Network tab
- Possible causes: missing `fixCloudinaryMenuFoodImageUrl()` function, `resolveImageUrl()` not applying fix

#### Bug 2 - WiFi IP Configuration

**Goal**: Surface counterexamples that demonstrate the IP configuration bug BEFORE implementing the fix. Confirm that services cannot connect on the new LAN network.

**Test Plan**: Check all configuration files for occurrences of old IP `192.168.1.3`. Attempt to start services and verify connection failures.

**Test Cases**:
1. **Backend .env Test**: Check if `BACKEND_URL` contains old IP (will fail on unfixed code)
2. **App .env Test**: Check if `API_URL` contains old IP (will fail on unfixed code)
3. **Admin Web .env Test**: Check if `VITE_API_URL` contains old IP (will fail on unfixed code)
4. **QR Code HTML Test**: Check if URLs in HTML contain old IP (will fail on unfixed code)
5. **Localhost Preservation Test**: Check if localhost URLs remain unchanged (should pass on unfixed code)

**Expected Counterexamples**:
- Configuration files contain `192.168.1.3` instead of `10.15.140.15`
- Services fail to connect when started on new LAN network
- QR code documentation shows outdated URLs

### Fix Checking

#### Bug 1 - Cloudinary Image URL

**Goal**: Verify that for all image URLs where the bug condition holds, the fixed admin web produces the correct mapped URL.

**Pseudocode:**
```
FOR ALL imageUrl WHERE isBugCondition1(imageUrl) DO
  fixedUrl := fixCloudinaryMenuFoodImageUrl'(imageUrl)
  ASSERT (
    fixedUrl.contains(".png") AND
    fixedUrl.contains("res.cloudinary.com") AND
    NOT fixedUrl.equals(imageUrl) AND
    isValidCloudinaryUrl(fixedUrl)
  )
END FOR
```

**Test Cases**:
- Test all 10 menu items in BAD_TO_GOOD mapping
- Verify each URL is correctly mapped to its corresponding `.png` URL
- Verify images load successfully in admin web UI
- Verify no 404 errors in browser Network tab

#### Bug 2 - WiFi IP Configuration

**Goal**: Verify that for all configuration values where the bug condition holds, the fixed config contains the new IP.

**Pseudocode:**
```
FOR ALL configValue WHERE isBugCondition2(configValue) DO
  updatedValue := updateIPAddress'(configValue)
  ASSERT (
    updatedValue.contains("10.15.140.15") AND
    NOT updatedValue.contains("192.168.1.3") AND
    countOccurrences(configValue, "192.168.1.3") = 
      countOccurrences(updatedValue, "10.15.140.15")
  )
END FOR
```

**Test Cases**:
- Verify all `.env` files contain new IP
- Verify QR code HTML contains new IP (20 occurrences)
- Verify QR code README contains new IP
- Verify fallback URL in `apiBaseUrl.ts` contains new IP
- Start all services and verify successful connections on new LAN

### Preservation Checking

#### Bug 1 - Cloudinary Image URL

**Goal**: Verify that for all image URLs where the bug condition does NOT hold, the fixed admin web produces the same result as the original.

**Pseudocode:**
```
FOR ALL imageUrl WHERE NOT isBugCondition1(imageUrl) DO
  ASSERT resolveImageUrl(imageUrl) = resolveImageUrl'(imageUrl)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-buggy image URLs, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Valid Cloudinary URLs**: Observe that images with correct URLs (e.g., `goi-cuon.jpg`, `cha-gio.jpg`) load correctly on unfixed code, then verify they continue to load after fix
2. **Empty Image URLs**: Observe that menu items without `image_url` show fallback image on unfixed code, then verify this continues after fix
3. **Local Asset URLs**: Observe that relative URLs (e.g., `menu/appetizers/goi-cuon.jpg`) are resolved correctly on unfixed code, then verify this continues after fix
4. **External URLs**: Observe that non-Cloudinary URLs work correctly on unfixed code, then verify this continues after fix

#### Bug 2 - WiFi IP Configuration

**Goal**: Verify that for all configuration values where the bug condition does NOT hold, the fixed config remains unchanged.

**Pseudocode:**
```
FOR ALL configValue WHERE NOT isBugCondition2(configValue) DO
  ASSERT configValue = configValue'
END FOR
```

**Test Plan**: Observe behavior on UNFIXED code first for non-IP configs, then verify they remain unchanged after fix.

**Test Cases**:
1. **Localhost URLs**: Verify `http://localhost:3000`, `http://localhost:5173`, `http://localhost:8081` remain unchanged
2. **JWT Secrets**: Verify `JWT_SECRET`, `JWT_REFRESH_SECRET` remain unchanged
3. **Cloudinary Credentials**: Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` remain unchanged
4. **Firebase Config**: Verify `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` remain unchanged
5. **Other Settings**: Verify `EXPO_DEVTOOLS_LISTEN_ADDRESS`, `NODE_ENV`, `PORT` remain unchanged

### Unit Tests

**Bug 1 - Cloudinary Image URL:**
- Test `fixCloudinaryMenuFoodImageUrl()` with each entry in BAD_TO_GOOD mapping
- Test `fixCloudinaryMenuFoodImageUrl()` with valid Cloudinary URLs (should return unchanged)
- Test `fixCloudinaryMenuFoodImageUrl()` with non-Cloudinary URLs (should return unchanged)
- Test `fixCloudinaryMenuFoodImageUrl()` with empty/null URLs (should return empty)
- Test `resolveImageUrl()` integration with `fixCloudinaryMenuFoodImageUrl()`
- Test `mapToMenuItem()` produces correct imageUrl for buggy and non-buggy items

**Bug 2 - WiFi IP Configuration:**
- Test that each `.env` file contains exactly the expected number of IP occurrences
- Test that QR code HTML contains exactly 20 occurrences of new IP
- Test that no files contain old IP `192.168.1.3` after fix
- Test that localhost URLs are preserved in CORS configuration
- Test that non-IP configs remain unchanged

### Property-Based Tests

**Bug 1 - Cloudinary Image URL:**
- Generate random Cloudinary URLs with various paths and verify fix logic only applies to BAD_TO_GOOD entries
- Generate random non-Cloudinary URLs and verify they pass through unchanged
- Generate random menu item API responses and verify `mapToMenuItem()` produces correct imageUrl

**Bug 2 - WiFi IP Configuration:**
- Generate random config strings containing old IP and verify all occurrences are replaced
- Generate random config strings without old IP and verify they remain unchanged
- Generate random URLs with various protocols/ports and verify only IP is replaced, not other parts

### Integration Tests

**Bug 1 - Cloudinary Image URL:**
- Start admin web and navigate to menu management page
- Verify all 10 affected menu items display images correctly
- Verify no 404 errors in browser Network tab
- Verify other menu items continue to display correctly
- Upload a new menu item image and verify it saves correctly without applying fix logic

**Bug 2 - WiFi IP Configuration:**
- Start backend on new LAN network and verify it's accessible at `http://10.15.140.15:3000`
- Start App and verify it connects to backend successfully
- Start admin web and verify it connects to backend successfully
- Open QR code HTML in browser and verify URLs display new IP
- Verify services can still run on localhost for local development
