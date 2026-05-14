/**
 * Bug Condition Exploration Test for Admin Menu Toggle Persistence
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4**
 * 
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists - the repository filters out unavailable items.
 * 
 * This test encodes the EXPECTED BEHAVIOR:
 * - Admin MenuRepository should fetch ALL menu items (available and unavailable)
 * - No filtering by is_available should occur in admin repository
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import axios from 'axios'

// Mock axios BEFORE importing MenuRepository
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn((fn) => {
          // Simulate the interceptor being called
          return fn({ headers: {}, params: {} })
        }),
      },
    },
  }

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn(() => false),
    },
  }
})

import { MenuRepository } from './MenuRepository'

describe('Bug Condition Exploration: Admin Menu Repository Filtering', () => {
  let repository: MenuRepository
  let mockAxiosInstance: any

  beforeEach(() => {
    // Get the mock axios instance that was created by axios.create
    const axiosModule = vi.mocked(axios)
    mockAxiosInstance = (axiosModule.create as any)()

    // Reset all mocks
    vi.clearAllMocks()

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('mock-token')

    repository = new MenuRepository()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Property 1: Bug Condition - Admin Repository Fetches All Menu Items
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
   * - The test will fail if the repository adds `is_available: true` to API requests
   * - Counterexamples will show that unavailable items are filtered out
   * 
   * EXPECTED OUTCOME ON FIXED CODE: PASS
   * - Repository fetches all items without filtering by availability
   * - Both available and unavailable items are returned
   */
  it('Property 1: Admin repository fetches all menu items regardless of availability', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a list of menu items with mixed availability
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            category: fc.constantFrom('appetizer', 'main_course', 'dessert', 'beverage', 'special'),
            base_price: fc.integer({ min: 10000, max: 500000 }),
            description: fc.string({ maxLength: 200 }),
            image_url: fc.webUrl(),
            is_available: fc.boolean(), // Mix of available and unavailable
            preparation_time: fc.integer({ min: 5, max: 60 }),
            is_vegetarian: fc.boolean(),
            is_spicy: fc.boolean(),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        async (backendMenuItems) => {
          // Setup: Mock API response with mixed availability items
          mockAxiosInstance.get.mockResolvedValue({
            data: {
              data: backendMenuItems,
            },
          })

          // ACTION: Call getAllMenuItems()
          const result = await repository.getAllMenuItems()

          // CRITICAL ASSERTION 1: Verify API was called WITHOUT is_available filter
          expect(mockAxiosInstance.get).toHaveBeenCalledWith('/foods')
          
          // Get the actual call arguments
          const callArgs = mockAxiosInstance.get.mock.calls[0]
          const requestConfig = callArgs[1] // Second argument is the config object
          
          // CRITICAL ASSERTION 2: Verify no is_available parameter was sent
          // This is the core bug - if is_available: true is sent, unavailable items are filtered
          if (requestConfig?.params) {
            expect(requestConfig.params).not.toHaveProperty('is_available')
          }

          // CRITICAL ASSERTION 3: All items should be returned (no client-side filtering)
          expect(result).toHaveLength(backendMenuItems.length)

          // CRITICAL ASSERTION 4: Both available and unavailable items should be present
          const unavailableItems = backendMenuItems.filter(item => !item.is_available)
          const availableItems = backendMenuItems.filter(item => item.is_available)

          if (unavailableItems.length > 0) {
            const unavailableInResult = result.filter(item => !item.available)
            expect(unavailableInResult.length).toBe(unavailableItems.length)
          }

          if (availableItems.length > 0) {
            const availableInResult = result.filter(item => item.available)
            expect(availableInResult.length).toBe(availableItems.length)
          }

          // COUNTEREXAMPLE DOCUMENTATION:
          // If this assertion fails, it means:
          // 1. The repository is sending is_available: true to the API, OR
          // 2. The repository is filtering out unavailable items client-side
          // Either way, this confirms the bug exists.
        }
      ),
      {
        numRuns: 20, // Run 20 test cases with different item combinations
        verbose: true, // Show detailed output including counterexamples
      }
    )
  })

  /**
   * Property 1 (variant): Admin repository fetches items by category without availability filter
   * 
   * This tests the getMenuItemsByCategory method to ensure it also doesn't filter by availability.
   */
  it('Property 1 (variant): Admin repository fetches items by category without availability filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate category and items
        fc.constantFrom('appetizer', 'main_course', 'dessert', 'beverage', 'special'),
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            category: fc.constantFrom('appetizer', 'main_course', 'dessert', 'beverage', 'special'),
            base_price: fc.integer({ min: 10000, max: 500000 }),
            description: fc.string({ maxLength: 200 }),
            image_url: fc.webUrl(),
            is_available: fc.boolean(),
            preparation_time: fc.integer({ min: 5, max: 60 }),
            is_vegetarian: fc.boolean(),
            is_spicy: fc.boolean(),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          { minLength: 2, maxLength: 8 }
        ),
        async (category, backendMenuItems) => {
          // Filter items to match the requested category
          const categoryItems = backendMenuItems.map(item => ({ ...item, category }))

          // Setup: Mock API response
          mockAxiosInstance.get.mockResolvedValue({
            data: {
              data: categoryItems,
            },
          })

          // ACTION: Call getMenuItemsByCategory()
          const result = await repository.getMenuItemsByCategory(category as any)

          // CRITICAL ASSERTION 1: Verify API was called with category but WITHOUT is_available filter
          expect(mockAxiosInstance.get).toHaveBeenCalled()
          
          const callArgs = mockAxiosInstance.get.mock.calls[0]
          const requestConfig = callArgs[1]
          
          // Should have category parameter
          expect(requestConfig?.params).toHaveProperty('category')
          
          // CRITICAL ASSERTION 2: Should NOT have is_available parameter
          if (requestConfig?.params) {
            expect(requestConfig.params).not.toHaveProperty('is_available')
          }

          // CRITICAL ASSERTION 3: All items in category should be returned
          expect(result).toHaveLength(categoryItems.length)

          // COUNTEREXAMPLE DOCUMENTATION:
          // If this fails, the getMenuItemsByCategory method is also filtering by availability
        }
      ),
      {
        numRuns: 15,
        verbose: true,
      }
    )
  })

  /**
   * Concrete test case: Toggle scenario
   * 
   * This simulates the exact bug scenario:
   * 1. Admin loads menu (all items visible)
   * 2. Admin toggles item to unavailable
   * 3. Admin reloads or cache expires
   * 4. BUG: Item disappears because repository filters it out
   */
  it('Concrete case: Item remains fetchable after toggle to unavailable', async () => {
    const testItem = {
      id: 'test-item-123',
      name: 'Phở Bò Hà Nội',
      category: 'main_course',
      base_price: 85000,
      description: 'Traditional Vietnamese beef noodle soup',
      image_url: 'https://example.com/pho.jpg',
      is_available: false, // Item is unavailable
      preparation_time: 20,
      is_vegetarian: false,
      is_spicy: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Setup: Mock API to return unavailable item
    mockAxiosInstance.get.mockResolvedValue({
      data: {
        data: [testItem],
      },
    })

    // ACTION: Fetch all menu items
    const result = await repository.getAllMenuItems()

    // CRITICAL ASSERTION: Unavailable item should be in the result
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('test-item-123')
    expect(result[0].available).toBe(false)
    expect(result[0].name).toBe('Phở Bò Hà Nội')

    // Verify no is_available filter was applied
    const callArgs = mockAxiosInstance.get.mock.calls[0]
    const requestConfig = callArgs[1]
    
    if (requestConfig?.params) {
      expect(requestConfig.params).not.toHaveProperty('is_available')
    }

    // COUNTEREXAMPLE DOCUMENTATION:
    // If this fails with "expected length 1 but got 0", it means the repository
    // is filtering out unavailable items, which is the bug we're trying to fix.
  })
})
