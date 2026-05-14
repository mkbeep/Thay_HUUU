/**
 * Bug Condition Exploration Test for Admin Menu Toggle Persistence
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4**
 * 
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists - items disappear from admin list after toggle to unavailable.
 * 
 * This test encodes the EXPECTED BEHAVIOR:
 * - Admin interface should show ALL menu items (available and unavailable)
 * - Toggle switches should reflect current availability state
 * - Items should NOT disappear when toggled to unavailable
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as fc from 'fast-check'
import MenuPage from './MenuPage'
import { MenuService } from '../../../business/services/MenuService'

// Mock dependencies
vi.mock('../../../business/services/MenuService')
vi.mock('../../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: false,
    socket: null,
  }),
}))

describe('Bug Condition Exploration: Admin Menu Toggle Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage for token
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('mock-token')
  })

  /**
   * Property 1: Bug Condition - Admin Interface Shows All Menu Items After Toggle
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4**
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
   * - The test will fail because items disappear from the admin list after toggle to unavailable
   * - Counterexamples will show which items disappeared (e.g., "Item with id=X disappears")
   * 
   * EXPECTED OUTCOME ON FIXED CODE: PASS
   * - All items remain visible in admin list regardless of availability state
   * - Toggle switches correctly reflect the availability state
   */
  it('Property 1: Admin interface shows all menu items after toggling availability', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a menu item that starts as available
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 3, maxLength: 50 }),
          category: fc.constantFrom('Khai vị', 'Món chính', 'Tráng miệng', 'Đồ uống', 'Đặc biệt'),
          price: fc.integer({ min: 10000, max: 500000 }),
          description: fc.string({ maxLength: 200 }),
          imageUrl: fc.webUrl(),
          available: fc.constant(true), // Start with available item
          preparationTime: fc.integer({ min: 5, max: 60 }),
          isVegetarian: fc.boolean(),
          isSpicy: fc.boolean(),
        }),
        async (menuItem) => {
          // Setup: Mock MenuService to return our test item
          const mockMenuService = MenuService as unknown as {
            prototype: {
              getMenuItems: ReturnType<typeof vi.fn>
              toggleItemAvailability: ReturnType<typeof vi.fn>
            }
          }

          // Initial load: item is available
          mockMenuService.prototype.getMenuItems = vi.fn().mockResolvedValue([menuItem])
          mockMenuService.prototype.toggleItemAvailability = vi.fn().mockResolvedValue(true)

          // Render the admin menu page
          const user = userEvent.setup()
          render(<MenuPage />)

          // Wait for initial load
          await waitFor(() => {
            expect(screen.getByText(menuItem.name)).toBeInTheDocument()
          })

          // Verify item is initially visible and marked as "Còn Hàng" (available)
          expect(screen.getByText(menuItem.name)).toBeInTheDocument()
          expect(screen.getByText('Còn Hàng')).toBeInTheDocument()

          // Find the toggle switch for this item
          const toggleSwitch = screen.getByRole('checkbox', { checked: true })
          expect(toggleSwitch).toBeInTheDocument()
          expect(toggleSwitch).toBeChecked()

          // ACTION: Toggle availability to unavailable
          await user.click(toggleSwitch)

          // After toggle, the item should:
          // 1. Still be visible in the list (NOT removed)
          // 2. Show "Hết Hàng" (unavailable) status
          // 3. Toggle switch should be unchecked

          // CRITICAL ASSERTION: Item must remain in the DOM
          await waitFor(() => {
            const itemElement = screen.queryByText(menuItem.name)
            expect(itemElement).toBeInTheDocument()
          }, { timeout: 2000 })

          // Verify the toggle switch is now unchecked (unavailable state)
          const toggleAfter = screen.getByRole('checkbox', { checked: false })
          expect(toggleAfter).toBeInTheDocument()
          expect(toggleAfter).not.toBeChecked()

          // Verify status text changed to "Hết Hàng"
          expect(screen.getByText('Hết Hàng')).toBeInTheDocument()

          // COUNTEREXAMPLE DOCUMENTATION:
          // If this assertion fails, it means the item disappeared from the admin list
          // after toggling to unavailable, which confirms the bug exists.
          // The counterexample will show: { id: "...", name: "...", ... }
        }
      ),
      {
        numRuns: 10, // Run 10 test cases with different menu items
        verbose: true, // Show detailed output including counterexamples
      }
    )
  })

  /**
   * Additional test: Verify all items (available + unavailable) are shown on page load
   * 
   * This tests the initial load behavior to ensure the admin sees all items.
   */
  it('Property 1 (variant): Admin interface shows all menu items on page load', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a list of menu items with mixed availability
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            category: fc.constantFrom('Khai vị', 'Món chính', 'Tráng miệng', 'Đồ uống', 'Đặc biệt'),
            price: fc.integer({ min: 10000, max: 500000 }),
            description: fc.string({ maxLength: 200 }),
            imageUrl: fc.webUrl(),
            available: fc.boolean(), // Mix of available and unavailable
            preparationTime: fc.integer({ min: 5, max: 60 }),
            isVegetarian: fc.boolean(),
            isSpicy: fc.boolean(),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        async (menuItems) => {
          // Setup: Mock MenuService to return all items
          const mockMenuService = MenuService as unknown as {
            prototype: {
              getMenuItems: ReturnType<typeof vi.fn>
            }
          }

          mockMenuService.prototype.getMenuItems = vi.fn().mockResolvedValue(menuItems)

          // Render the admin menu page
          render(<MenuPage />)

          // Wait for items to load
          await waitFor(() => {
            expect(screen.queryByText('Đang tải menu...')).not.toBeInTheDocument()
          })

          // CRITICAL ASSERTION: ALL items must be visible, regardless of availability
          for (const item of menuItems) {
            const itemElement = screen.queryByText(item.name)
            expect(itemElement).toBeInTheDocument()
          }

          // Count available vs unavailable items
          const availableCount = menuItems.filter(item => item.available).length
          const unavailableCount = menuItems.filter(item => !item.available).length

          // Verify status indicators are present
          const availableElements = screen.queryAllByText('Còn Hàng')
          const unavailableElements = screen.queryAllByText('Hết Hàng')

          expect(availableElements).toHaveLength(availableCount)
          expect(unavailableElements).toHaveLength(unavailableCount)

          // COUNTEREXAMPLE DOCUMENTATION:
          // If this fails, it means some items are missing from the admin list on initial load.
          // This would indicate the repository is filtering by availability.
        }
      ),
      {
        numRuns: 5,
        verbose: true,
      }
    )
  })
})
