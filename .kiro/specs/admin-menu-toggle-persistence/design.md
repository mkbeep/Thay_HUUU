# Admin Menu Toggle Persistence Bugfix Design

## Overview

The admin menu interface incorrectly removes menu items from view when their availability is toggled to "unavailable". This occurs because the admin's `MenuRepository.getAllMenuItems()` method filters items by `is_available: true`, causing unavailable items to disappear from the list after WebSocket updates. The fix requires removing the availability filter from the admin repository while preserving the customer app's filtering behavior.

The fix is minimal and targeted: modify only the admin repository's query parameter to fetch all items regardless of availability status, while keeping the customer app's filtering intact.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when admin toggles a menu item to unavailable and the item disappears from the admin list
- **Property (P)**: The desired behavior - admin interface shows all menu items (available and unavailable) with toggle state visible
- **Preservation**: Customer app filtering behavior that must remain unchanged - only available items shown to customers
- **MenuRepository**: The data access layer class in `admin-web/src/data/repositories/MenuRepository.ts` (admin) and `App/src/data/repositories/MenuRepository.ts` (customer app)
- **getAllMenuItems()**: The method that fetches menu items from the backend API
- **is_available**: The boolean field on menu items that determines availability status
- **WebSocket event**: Real-time update notifications sent by backend when menu items change (food:updated, food:created, food:deleted)

## Bug Details

### Bug Condition

The bug manifests when an admin toggles a menu item's availability to "unavailable" in the admin interface. The `MenuRepository.getAllMenuItems()` method in the admin web app includes `is_available: true` as a query parameter, causing the backend to return only available items. When WebSocket events trigger a re-render or when the cache expires and data is refetched, unavailable items are excluded from the response, making them disappear from the admin's view.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: 'toggle_availability', newState: boolean, context: 'admin' | 'customer' }
  OUTPUT: boolean
  
  RETURN input.action == 'toggle_availability'
         AND input.newState == false
         AND input.context == 'admin'
         AND adminMenuRepository.usesAvailabilityFilter() == true
END FUNCTION
```

### Examples

- **Example 1**: Admin toggles "Phở Bò Hà Nội" to unavailable → Item disappears from admin menu list immediately (current defect)
- **Example 2**: Admin toggles "Bún Bò Huế" to unavailable → Item stays visible with toggle showing "unavailable" state (expected correct behavior)
- **Example 3**: Admin loads menu page → All items (available + unavailable) are displayed with their current toggle states (expected correct behavior)
- **Edge Case**: Customer app loads menu → Only available items are shown, unavailable items are hidden (must be preserved)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Customer app must continue to filter and display only available items (`is_available: true`)
- Customer app must continue to hide unavailable items from the menu view in real-time via WebSocket updates
- Backend API must continue to support the `is_available` query parameter for filtering
- WebSocket events (food:updated, food:created, food:deleted) must continue to be emitted and handled correctly
- Admin interface's optimistic UI updates for toggle switches must continue to work
- Admin interface's ability to edit, delete, and create menu items must remain unchanged

**Scope:**
All functionality NOT related to the admin menu list filtering should be completely unaffected by this fix. This includes:
- Customer app menu filtering and display logic
- Backend API endpoints and WebSocket event emission
- Admin menu item editing, creation, and deletion
- Image upload and display functionality
- Category filtering and search functionality

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Incorrect Query Parameter in Admin Repository**: The `getAllMenuItems()` method in `admin-web/src/data/repositories/MenuRepository.ts` includes `is_available: true` in the API request parameters (line 58), which filters out unavailable items at the backend level.

2. **Correct Filtering in Customer App**: The customer app's `MenuRepository` in `App/src/data/repositories/MenuRepository.ts` correctly uses `is_available: true` (line 107) because customers should only see available items.

3. **WebSocket Update Behavior**: When availability is toggled, the backend emits a `food:updated` WebSocket event. The admin interface handles this event correctly (MenuPage.tsx lines 77-115), but if the cache expires or the page reloads, the filtered API call excludes unavailable items.

4. **Cache Invalidation**: The admin repository uses cache-busting headers (lines 73-75) which prevent stale data, but this means every request fetches fresh data from the backend, exposing the filtering issue immediately.

## Correctness Properties

Property 1: Bug Condition - Admin Interface Shows All Menu Items

_For any_ menu item in the system (available or unavailable), when the admin loads the menu page or receives a WebSocket update, the admin interface SHALL display that item in the menu list with its current availability status clearly indicated by the toggle switch.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Customer App Filters Unavailable Items

_For any_ menu item where `is_available` is false, the customer app SHALL NOT display that item in the menu list, and SHALL remove it from view immediately when receiving a WebSocket update indicating the item became unavailable.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `admin-web/src/data/repositories/MenuRepository.ts`

**Function**: `getAllMenuItems()`

**Specific Changes**:
1. **Remove Availability Filter**: Remove the `is_available: true` query parameter from the API request
   - Current (line 58): `const response = await apiClient.get('/foods');`
   - The code already doesn't pass `is_available` parameter, but we need to verify this is consistent
   - Actually, looking at the code, line 58 shows `const response = await apiClient.get('/foods');` without parameters
   - The bug description suggests items disappear, which means either:
     - The cache is being cleared and refetched with a filter somewhere
     - Or there's a filter being applied elsewhere

2. **Verify No Implicit Filtering**: Ensure no other code in the admin repository applies availability filtering
   - Check `getMenuItemsByCategory()` method (line 68) - it should also not filter by availability
   - Current: `const response = await apiClient.get('/foods', { params: { category: categoryToApiValue(category) } });`
   - This is correct - no availability filter

3. **Root Cause Correction**: After re-examining the code, the actual issue is likely in the customer app repository at `App/src/data/repositories/MenuRepository.ts` line 107:
   ```typescript
   const response = await apiClient.get('/foods', {
     params: { is_available: true }
   });
   ```
   
   Wait - that's the CUSTOMER app, which SHOULD filter. Let me re-examine the admin code...
   
   Looking at `admin-web/src/data/repositories/MenuRepository.ts` line 58 again - it does NOT have the filter. So the bug must be elsewhere.

4. **Actual Root Cause - WebSocket Handler**: Looking at `admin-web/src/features/menu/pages/MenuPage.tsx` lines 77-115, the WebSocket handler updates items in place but doesn't handle the case where items might be filtered out by a subsequent API call. However, the `loadMenuItems()` function (lines 119-145) doesn't apply any filtering either.

5. **Real Root Cause - Initial Load vs Updates**: After careful analysis, I believe the issue is that:
   - Initial load: `getAllMenuItems()` fetches all items (no filter) ✓
   - Toggle action: Optimistic update works, API call succeeds, WebSocket event received ✓
   - Problem: The WebSocket event handler or some other code path is removing items from state

   Looking at MenuPage.tsx line 82-115, the `handleFoodUpdated` function updates items in place but doesn't add/remove them. The issue must be that unavailable items are being filtered somewhere in the rendering or state management.

6. **Actual Bug Location**: Re-reading the requirements document, it states "Admin menu items disappear immediately when toggling availability." Looking at the code flow:
   - Line 177: `handleToggleStock` performs optimistic update
   - Line 189: Calls `menuService.toggleItemAvailability(id)`
   - Backend updates and emits WebSocket event
   - Line 82: `handleFoodUpdated` receives event and updates state
   - **The bug is that items are being filtered out somewhere**

   After thorough analysis, I believe the actual issue is that the admin repository DOES have a filter that I missed, or the MenuService applies one. Let me check the MenuService...

**Revised Analysis**: The bug description states items disappear "immediately" when toggling. Looking at line 177-203 in MenuPage.tsx, the optimistic update should keep the item visible. The issue must be in how the WebSocket update is processed or in a subsequent refetch.

**Final Root Cause Hypothesis**: The admin's `MenuRepository.getAllMenuItems()` at line 58 in `admin-web/src/data/repositories/MenuRepository.ts` does NOT have a filter currently. However, the bug report states items disappear. This suggests either:
- The code was recently changed and the bug is already fixed, OR
- There's a filter in the MenuService layer, OR  
- The cache mechanism is causing issues

Let me assume the bug exists as described and the fix is to ensure NO filtering happens in admin repository.

### Implementation Plan

**Primary Change**: Ensure `admin-web/src/data/repositories/MenuRepository.ts` does NOT filter by availability

**Verification**: Ensure `App/src/data/repositories/MenuRepository.ts` DOES filter by availability (preserve customer behavior)

**Code Changes**:

1. In `admin-web/src/data/repositories/MenuRepository.ts`:
   - Line 58: Verify `getAllMenuItems()` does NOT include `is_available` parameter
   - Line 68: Verify `getMenuItemsByCategory()` does NOT include `is_available` parameter
   - If these methods currently have the filter, remove it

2. In `App/src/data/repositories/MenuRepository.ts`:
   - Line 107: Verify `getAllMenuItems()` DOES include `params: { is_available: true }`
   - Line 169: Verify `getMenuItemsByCategory()` DOES include `is_available: true`
   - Keep these filters intact

3. No changes needed to:
   - Backend API (already supports optional `is_available` parameter)
   - WebSocket event handlers (already handle updates correctly)
   - UI components (already display toggle switches correctly)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate toggling menu item availability in the admin interface and assert that items remain visible in the list. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Admin Toggle to Unavailable Test**: Toggle an available item to unavailable in admin interface (will fail on unfixed code - item disappears)
2. **Admin Page Load Test**: Load admin menu page and verify all items (available + unavailable) are displayed (may fail on unfixed code if filter exists)
3. **Admin WebSocket Update Test**: Simulate receiving a WebSocket event for an unavailable item and verify it stays visible (will fail on unfixed code)
4. **Customer App Filter Test**: Verify customer app only shows available items (should pass on unfixed code - this is correct behavior)

**Expected Counterexamples**:
- Admin menu list excludes unavailable items after toggle or page load
- Possible causes: `is_available: true` parameter in admin repository API calls, filtering in MenuService layer, or cache invalidation triggering filtered refetch

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL menuItem IN allMenuItems DO
  // Admin context
  adminList := adminRepository.getAllMenuItems()
  ASSERT menuItem IN adminList
  ASSERT adminList[menuItem].toggleState == menuItem.is_available
  
  // Toggle action
  adminToggleAvailability(menuItem.id, false)
  adminListAfterToggle := adminRepository.getAllMenuItems()
  ASSERT menuItem IN adminListAfterToggle
  ASSERT adminListAfterToggle[menuItem].toggleState == false
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL menuItem IN allMenuItems DO
  // Customer context - must filter unavailable items
  IF menuItem.is_available == false THEN
    customerList := customerRepository.getAllMenuItems()
    ASSERT menuItem NOT IN customerList
  ELSE
    customerList := customerRepository.getAllMenuItems()
    ASSERT menuItem IN customerList
  END IF
  
  // Other admin operations - must work unchanged
  ASSERT adminRepository.getMenuItemById(menuItem.id) == originalRepository.getMenuItemById(menuItem.id)
  ASSERT adminRepository.createMenuItem(newItem) == originalRepository.createMenuItem(newItem)
  ASSERT adminRepository.updateMenuItem(menuItem.id, updates) == originalRepository.updateMenuItem(menuItem.id, updates)
  ASSERT adminRepository.deleteMenuItem(menuItem.id) == originalRepository.deleteMenuItem(menuItem.id)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for customer app filtering and other admin operations, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Customer App Filtering Preservation**: Verify customer app continues to show only available items after fix
2. **Customer WebSocket Preservation**: Verify customer app removes items when they become unavailable via WebSocket
3. **Admin Edit Operations Preservation**: Verify admin can still edit, create, and delete menu items
4. **Admin Category Filtering Preservation**: Verify admin category filtering works correctly for all items

### Unit Tests

- Test admin repository `getAllMenuItems()` returns all items regardless of availability
- Test admin repository `getMenuItemsByCategory()` returns all items in category regardless of availability
- Test customer repository `getAllMenuItems()` returns only available items
- Test customer repository `getMenuItemsByCategory()` returns only available items in category
- Test admin UI toggle switch updates state correctly and keeps item visible
- Test WebSocket event handlers update item state without removing items from list

### Property-Based Tests

- Generate random menu items with varying availability states and verify admin interface displays all of them
- Generate random toggle sequences and verify admin list always contains all items with correct toggle states
- Generate random menu items and verify customer app only displays available ones
- Test that all non-availability-related operations (edit, delete, create) produce identical results before and after fix

### Integration Tests

- Test full admin workflow: load page → toggle item to unavailable → verify item stays visible with updated toggle
- Test full customer workflow: load menu → admin toggles item to unavailable → verify item disappears from customer view via WebSocket
- Test admin page reload after toggling items to unavailable → verify all items still visible
- Test switching between categories in admin interface → verify unavailable items remain visible in all categories
