# Implementation Plan

## Bug 1: Cloudinary Image URL Fix

- [ ] 1. Write bug condition exploration test for Cloudinary URL mapping
  - **Property 1: Bug Condition** - Cloudinary URL Mismatch Detection
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists in admin web
  - **Scoped PBT Approach**: Scope the property to the 10 concrete failing URLs from BAD_TO_GOOD mapping
  - Test that admin web's `MenuRepository.mapToMenuItem()` produces broken image URLs for the 10 affected menu items
  - For each URL in BAD_TO_GOOD mapping, verify that:
    - Input: Cloudinary URL with `.jpg` extension (e.g., `menu/main-courses/com-chien-duong-chau.jpg`)
    - Current behavior: `resolveImageUrl()` returns the broken `.jpg` URL unchanged
    - Expected behavior: Should return the correct `.png` URL from BAD_TO_GOOD mapping
  - Run test on UNFIXED code (before adding `fixCloudinaryMenuFoodImageUrl()`)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Which menu items show broken images
    - What URLs are returned vs. what URLs should be returned
    - Browser Network tab 404 errors for `.jpg` files
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Write preservation property tests for non-buggy image URLs (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-buggy Image URLs Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy image URLs:
    - Valid Cloudinary URLs not in BAD_TO_GOOD list (e.g., `goi-cuon.jpg`, `cha-gio.jpg`)
    - Empty or null `image_url` (should return fallback image)
    - Local asset URLs (e.g., `menu/appetizers/goi-cuon.jpg`)
    - External non-Cloudinary URLs
  - Write property-based tests capturing observed behavior patterns:
    - For all valid Cloudinary URLs not in BAD_TO_GOOD: `resolveImageUrl()` returns URL unchanged
    - For all empty/null URLs: `resolveImageUrl()` returns empty string (fallback handled by component)
    - For all local asset URLs: `resolveImageUrl()` correctly prepends API origin
    - For all external URLs: `resolveImageUrl()` returns URL unchanged
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [-] 3. Fix Cloudinary image URL mapping in admin web

  - [x] 3.1 Port fixCloudinaryMenuFoodImageUrl logic from App to admin web
    - Add BAD_TO_GOOD mapping table at top of `admin-web/src/data/repositories/MenuRepository.ts` (after imports)
    - Copy the 10-entry mapping array from `App/src/utils/cloudinaryMenuImageFixes.ts`
    - Add `fixCloudinaryMenuFoodImageUrl()` function after the mapping table
    - Function should:
      - Accept `url: string` parameter
      - Return early if URL is empty or doesn't contain "res.cloudinary.com"
      - Loop through BAD_TO_GOOD entries and check if URL contains the bad path (case-insensitive)
      - Return the good URL if match found, otherwise return original URL
    - _Bug_Condition: isBugCondition1(imageUrl) where imageUrl contains one of 10 bad Cloudinary paths_
    - _Expected_Behavior: fixCloudinaryMenuFoodImageUrl(imageUrl) returns correct .png URL from BAD_TO_GOOD mapping_
    - _Preservation: Non-buggy URLs (not in BAD_TO_GOOD) must return unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Integrate fix into resolveImageUrl function
    - Modify `resolveImageUrl()` helper in `MenuRepository.ts`
    - Apply `fixCloudinaryMenuFoodImageUrl()` to the resolved URL before returning
    - Ensure fix is applied AFTER URL resolution (relative → absolute conversion)
    - No changes needed to `mapToMenuItem()` since it already calls `resolveImageUrl()`
    - _Bug_Condition: isBugCondition1(imageUrl) from design_
    - _Expected_Behavior: resolveImageUrl(imageUrl) returns fixed URL for buggy inputs_
    - _Preservation: resolveImageUrl(imageUrl) returns same result for non-buggy inputs_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Cloudinary URL Correctly Mapped
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Verify that for all 10 URLs in BAD_TO_GOOD:
      - `resolveImageUrl()` now returns the correct `.png` URL
      - Admin web displays images correctly (no broken images)
      - No 404 errors in browser Network tab
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-buggy URLs Still Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify that:
      - Valid Cloudinary URLs not in BAD_TO_GOOD still work correctly
      - Empty/null URLs still return fallback behavior
      - Local asset URLs still resolve correctly
      - External URLs still work unchanged
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Checkpoint - Ensure Bug 1 tests pass
  - Run all Bug 1 tests (exploration + preservation)
  - Verify admin web displays all 10 affected menu items correctly
  - Verify no regressions in other menu items
  - Ask user if questions arise

## Bug 2: WiFi IP Configuration Update

- [ ] 5. Write bug condition exploration test for IP configuration
  - **Property 1: Bug Condition** - Old IP Address Detection
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate old IP exists in config files
  - **Scoped PBT Approach**: Scope the property to the 6 concrete files containing old IP
  - Test that configuration files contain old IP `192.168.1.3`:
    - `backend/.env`: Check `BACKEND_URL`, `CORS_ORIGIN` (3 occurrences), `CUSTOMER_WEB_BASE_URL`
    - `App/.env`: Check `REACT_NATIVE_PACKAGER_HOSTNAME`, `API_URL`, `CUSTOMER_WEB_BASE_URL`
    - `admin-web/.env`: Check `VITE_API_URL`, `VITE_CUSTOMER_WEB_URL`
    - `App/src/utils/apiBaseUrl.ts`: Check fallback URL in line 11
    - `backend/qr-codes/index.html`: Check all 20 `<p class="url">` tags
    - `backend/qr-codes/README.md`: Check Web Base URL documentation
  - For each file, verify that:
    - Current behavior: File contains `192.168.1.3`
    - Expected behavior: File should contain `10.15.140.15`
  - Run test on UNFIXED code (before replacing IP addresses)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Which files contain old IP
    - How many occurrences in each file
    - Which config keys are affected
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.5, 1.6, 1.7, 1.8, 1.9_

- [ ] 6. Write preservation property tests for non-IP configs (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-IP Configs Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-IP configuration values:
    - Localhost URLs (`http://localhost:3000`, `http://localhost:5173`, `http://localhost:8081`)
    - JWT secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`)
    - Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
    - Firebase config (`FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`)
    - Other settings (`EXPO_DEVTOOLS_LISTEN_ADDRESS`, `NODE_ENV`, `PORT`)
  - Write property-based tests capturing observed behavior patterns:
    - For all localhost URLs: value remains unchanged after fix
    - For all JWT secrets: value remains unchanged after fix
    - For all Cloudinary credentials: value remains unchanged after fix
    - For all Firebase config: value remains unchanged after fix
    - For all other non-IP settings: value remains unchanged after fix
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.5, 3.6, 3.7, 3.8_

- [-] 7. Fix WiFi IP configuration across all files

  - [x] 7.1 Update backend/.env
    - Replace `BACKEND_URL=http://192.168.1.3:3000` with `http://10.15.140.15:3000`
    - Replace `CORS_ORIGIN=http://localhost:5173,http://192.168.1.3:5173,...` with `http://localhost:5173,http://10.15.140.15:5173,...` (3 occurrences of old IP)
    - Replace `CUSTOMER_WEB_BASE_URL=http://192.168.1.3:8081` with `http://10.15.140.15:8081`
    - Verify localhost URLs remain unchanged
    - Verify JWT secrets, Cloudinary credentials, Firebase config remain unchanged
    - _Bug_Condition: isBugCondition2(configValue) where configValue contains "192.168.1.3"_
    - _Expected_Behavior: All occurrences of "192.168.1.3" replaced with "10.15.140.15"_
    - _Preservation: Localhost URLs and non-IP configs remain unchanged_
    - _Requirements: 2.5, 2.6_

  - [x] 7.2 Update App/.env
    - Replace `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.3` with `10.15.140.15`
    - Replace `API_URL=http://192.168.1.3:3000/api/v1` with `http://10.15.140.15:3000/api/v1`
    - Replace `CUSTOMER_WEB_BASE_URL=http://192.168.1.3:8081` with `http://10.15.140.15:8081`
    - Verify `EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0` remains unchanged
    - _Bug_Condition: isBugCondition2(configValue) from design_
    - _Expected_Behavior: All occurrences of "192.168.1.3" replaced with "10.15.140.15"_
    - _Preservation: EXPO_DEVTOOLS_LISTEN_ADDRESS and other non-IP configs remain unchanged_
    - _Requirements: 2.5, 2.7_

  - [x] 7.3 Update admin-web/.env
    - Replace `VITE_API_URL=http://192.168.1.3:3000/api/v1` with `http://10.15.140.15:3000/api/v1`
    - Replace `VITE_CUSTOMER_WEB_URL=http://192.168.1.3:8081` with `http://10.15.140.15:8081`
    - _Bug_Condition: isBugCondition2(configValue) from design_
    - _Expected_Behavior: All occurrences of "192.168.1.3" replaced with "10.15.140.15"_
    - _Preservation: Other Vite configs remain unchanged_
    - _Requirements: 2.5, 2.8_

  - [x] 7.4 Update App/src/utils/apiBaseUrl.ts
    - Replace fallback URL in line 11: `'http://192.168.1.3:3000/api/v1'` with `'http://10.15.140.15:3000/api/v1'`
    - Verify other logic in the file remains unchanged
    - _Bug_Condition: isBugCondition2(configValue) from design_
    - _Expected_Behavior: Fallback URL contains new IP "10.15.140.15"_
    - _Preservation: Other fallback logic remains unchanged_
    - _Requirements: 2.5, 2.7_

  - [x] 7.5 Update backend/qr-codes/index.html
    - Replace all 20 occurrences of `http://192.168.1.3:8081` with `http://10.15.140.15:8081` in `<p class="url">` tags
    - Use find-and-replace to ensure all occurrences are updated
    - Verify HTML structure remains unchanged
    - _Bug_Condition: isBugCondition2(configValue) from design_
    - _Expected_Behavior: All 20 URLs contain new IP "10.15.140.15"_
    - _Preservation: HTML structure and other content remain unchanged_
    - _Requirements: 2.5, 2.9, 2.10_

  - [x] 7.6 Update backend/qr-codes/README.md
    - Replace `**Web Base URL**: http://192.168.1.3:8081` with `http://10.15.140.15:8081`
    - Verify other documentation content remains unchanged
    - _Bug_Condition: isBugCondition2(configValue) from design_
    - _Expected_Behavior: Web Base URL contains new IP "10.15.140.15"_
    - _Preservation: Other documentation remains unchanged_
    - _Requirements: 2.5, 2.10_

  - [ ] 7.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - IP Address Correctly Updated
    - **IMPORTANT**: Re-run the SAME test from task 5 - do NOT write a new test
    - The test from task 5 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 5
    - Verify that for all 6 files:
      - No occurrences of `192.168.1.3` remain
      - All expected occurrences of `10.15.140.15` are present
      - Correct number of replacements in each file
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ] 7.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-IP Configs Still Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 6 - do NOT write new tests
    - Run preservation property tests from step 6
    - Verify that:
      - Localhost URLs remain unchanged in all `.env` files
      - JWT secrets remain unchanged in `backend/.env`
      - Cloudinary credentials remain unchanged in `backend/.env`
      - Firebase config remains unchanged in `backend/.env`
      - `EXPO_DEVTOOLS_LISTEN_ADDRESS` remains unchanged in `App/.env`
      - Other non-IP settings remain unchanged
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.5, 3.6, 3.7, 3.8_

- [ ] 8. Checkpoint - Ensure Bug 2 tests pass
  - Run all Bug 2 tests (exploration + preservation)
  - Verify no files contain old IP `192.168.1.3`
  - Verify all services can connect on new LAN network
  - Ask user if questions arise

## Final Validation

- [ ] 9. Integration testing
  - Start backend on new LAN network and verify accessibility at `http://10.15.140.15:3000`
  - Start App and verify it connects to backend successfully
  - Start admin web and verify it connects to backend successfully
  - Open admin web menu management page and verify all 10 affected menu items display images correctly
  - Verify no broken images or 404 errors in browser Network tab
  - Open QR code HTML in browser and verify URLs display new IP
  - Verify all services can still run on localhost for local development
  - Ask user to confirm all functionality works as expected
