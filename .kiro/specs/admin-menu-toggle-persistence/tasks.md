# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Admin Interface Shows All Menu Items After Toggle
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing case - toggle an available item to unavailable in admin interface and verify it remains visible in the list
  - Test implementation details from Bug Condition in design:
    - Given: Admin interface with menu items loaded
    - When: Admin toggles a menu item's availability to "unavailable" (is_available = false)
    - Then: The item SHOULD remain visible in the admin menu list with toggle showing "unavailable" state
  - The test assertions should match the Expected Behavior Properties from design:
    - Admin menu list contains the toggled item
    - Toggle switch shows "unavailable" state
    - Item is not filtered out or removed from view
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "Item with id=X disappears from admin list after toggle to unavailable")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Customer App Filters Unavailable Items
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (customer app context):
    - Customer app loads menu and displays only available items
    - Customer app receives WebSocket update for unavailable item and hides it
    - Admin can edit, create, and delete menu items without affecting availability display
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all menu items where is_available = false, customer app SHALL NOT display them
    - For all menu items where is_available = true, customer app SHALL display them
    - Customer app SHALL remove items from view when receiving WebSocket event indicating unavailable
    - Admin operations (edit, create, delete) SHALL continue to work unchanged
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [-] 3. Fix for admin menu toggle persistence

  - [x] 3.1 Verify admin repository does not filter by availability
    - Open `admin-web/src/data/repositories/MenuRepository.ts`
    - Check `getAllMenuItems()` method (line ~58) - ensure it does NOT include `is_available: true` parameter
    - Check `getMenuItemsByCategory()` method (line ~68) - ensure it does NOT include `is_available: true` parameter
    - If filters exist, remove them to fetch all items regardless of availability
    - Verify cache-busting headers are present (lines ~73-75) to prevent stale data
    - _Bug_Condition: isBugCondition(input) where input.action == 'toggle_availability' AND input.newState == false AND input.context == 'admin'_
    - _Expected_Behavior: Admin interface displays all menu items (available and unavailable) with toggle state visible_
    - _Preservation: Customer app continues to filter by is_available: true_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Verify customer app repository preserves availability filtering
    - Open `App/src/data/repositories/MenuRepository.ts`
    - Check `getAllMenuItems()` method (line ~107) - ensure it DOES include `params: { is_available: true }`
    - Check `getMenuItemsByCategory()` method (line ~169) - ensure it DOES include `is_available: true`
    - DO NOT modify these filters - they are correct for customer context
    - _Preservation: Customer app must continue to show only available items_
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.3 Verify WebSocket event handlers maintain item visibility
    - Open `admin-web/src/features/menu/pages/MenuPage.tsx`
    - Review `handleFoodUpdated` function (lines ~82-115) - ensure it updates items in place without removing them
    - Review `handleToggleStock` function (lines ~177-203) - ensure optimistic update keeps item visible
    - Ensure no filtering logic removes unavailable items from state
    - _Expected_Behavior: Items remain visible after WebSocket updates regardless of availability_
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 3.4 Test admin interface displays all items after toggle
    - Load admin menu page
    - Toggle an available item to "unavailable"
    - Verify item remains visible in list with toggle showing "unavailable" state
    - Toggle the item back to "available"
    - Verify item remains visible with toggle showing "available" state
    - Reload page and verify all items (available and unavailable) are displayed
    - _Expected_Behavior: Admin interface shows all menu items with correct toggle states_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Admin Interface Shows All Menu Items After Toggle
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Customer App Filters Unavailable Items
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions in customer app filtering or admin operations)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run all exploration and preservation tests
  - Verify admin interface shows all menu items (available and unavailable)
  - Verify customer app continues to show only available items
  - Verify WebSocket updates work correctly in both contexts
  - Verify admin operations (edit, create, delete) work unchanged
  - If any issues arise, ask the user for guidance before proceeding
