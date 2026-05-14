/**
 * Food Repository Implementation - Infrastructure Layer
 */

import { db } from '../../config/firebase.config';
import { IFoodRepository } from '../../../domain/repositories/IFoodRepository';
import { Food, FoodWithImages, FoodCategory, FoodImage } from '../../../domain/entities/Food';

export class FoodRepository implements IFoodRepository {
  private readonly collection = db.collection('food');
  private readonly imagesCollection = db.collection('food_image');
  
  // In-memory cache to reduce Firebase reads
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async findById(id: string): Promise<Food | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Food;
  }

  private mapToMenuItem(data: any): FoodImage {
    // Image URL đã là full URL từ backend, không cần xử lý thêm
    const imageUrl = data.image_url || '';
    
    return {
      id: data.id,
      food_id: data.food_id,
      image_url: imageUrl,
      is_primary: data.is_primary,
      display_order: data.display_order,
      uploaded_at: data.uploaded_at,
    };
  }

  /**
   * Nếu không có dòng food_image (tạo món từ admin, seed cũ, food_id sai…),
   * dùng mảng `images` nhúng trên document `food` nếu có.
   */
  private mergeImagesFromFoodDoc(food: any, fromSubcollection: FoodImage[]): FoodImage[] {
    if (fromSubcollection.length > 0) {
      return fromSubcollection;
    }
    const embedded = food?.images;
    if (Array.isArray(embedded) && embedded.length > 0) {
      return embedded
        .filter((row: any) => row && (row.image_url || row.url))
        .map((row: any, idx: number) =>
          this.mapToMenuItem({
            id: row.id || `embedded-${food.id}-${idx}`,
            food_id: food.id,
            image_url: row.image_url || row.url || '',
            is_primary: row.is_primary ?? idx === 0,
            display_order: row.display_order ?? idx,
            uploaded_at: row.uploaded_at ?? new Date(),
          })
        );
    }
    const rootUrl = typeof food?.image_url === 'string' ? food.image_url.trim() : '';
    if (rootUrl) {
      return [
        this.mapToMenuItem({
          id: `root-${food.id}`,
          food_id: food.id,
          image_url: rootUrl,
          is_primary: true,
          display_order: 0,
          uploaded_at: new Date(),
        }),
      ];
    }
    return [];
  }

  async findByIdWithImages(id: string): Promise<FoodWithImages | null> {
    const food = await this.findById(id);
    if (!food) return null;

    // Get images without orderBy to avoid index requirement
    const imagesSnapshot = await this.imagesCollection
      .where('food_id', '==', id)
      .get();

    // Sort in memory instead and map to full URLs
    const images: FoodImage[] = imagesSnapshot.docs
      .map(doc => this.mapToMenuItem({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const merged = this.mergeImagesFromFoodDoc(food, images);
    return { ...food, images: merged };
  }

  async findAll(filters?: {
    category?: FoodCategory;
    is_available?: boolean;
    is_vegetarian?: boolean;
    search?: string;
  }): Promise<Food[]> {
    // Create cache key from filters
    const cacheKey = `findAll:${JSON.stringify(filters || {})}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('✅ Using cached foods data');
      return cached.data;
    }

    let query: FirebaseFirestore.Query = this.collection;

    if (filters?.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters?.is_available !== undefined) {
      query = query.where('is_available', '==', filters.is_available);
    }

    if (filters?.is_vegetarian !== undefined) {
      query = query.where('is_vegetarian', '==', filters.is_vegetarian);
    }

    const snapshot = await query.get();
    let foods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Food));

    // Filter by search term
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      foods = foods.filter(food =>
        food.name.toLowerCase().includes(searchLower) ||
        food.description?.toLowerCase().includes(searchLower)
      );
    }

    // Cache the result
    this.cache.set(cacheKey, { data: foods, timestamp: Date.now() });
    console.log('📦 Cached foods data');

    return foods;
  }

  async findAllWithImages(filters?: {
    category?: FoodCategory;
    is_available?: boolean;
  }): Promise<FoodWithImages[]> {
    const foods = await this.findAll(filters);
    
    const foodsWithImages = await Promise.all(
      foods.map(async (food) => {
        // Get images without orderBy to avoid index requirement
        const imagesSnapshot = await this.imagesCollection
          .where('food_id', '==', food.id)
          .get();

        // Sort in memory instead and map to full URLs
        const images: FoodImage[] = imagesSnapshot.docs
          .map(doc => this.mapToMenuItem({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        const merged = this.mergeImagesFromFoodDoc(food, images);
        return { ...food, images: merged };
      })
    );

    return foodsWithImages;
  }

  async create(foodData: Omit<Food, 'id' | 'created_at' | 'updated_at'>): Promise<Food> {
    const now = new Date();
    const data = {
      ...foodData,
      created_at: now,
      updated_at: now,
    };

    const docRef = await this.collection.add(data);
    
    // Clear cache when new data is created
    this.cache.clear();
    console.log('🗑️ Cache cleared after create');
    
    return { id: docRef.id, ...data } as Food;
  }

  async update(id: string, data: Partial<Food>): Promise<Food> {
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    await this.collection.doc(id).update(updateData);
    
    // Clear cache when data is updated
    this.cache.clear();
    console.log('🗑️ Cache cleared after update');
    
    const updated = await this.findById(id);
    if (!updated) throw new Error('Food not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
    
    // Xóa images liên quan
    const imagesSnapshot = await this.imagesCollection
      .where('food_id', '==', id)
      .get();
    
    const batch = db.batch();
    imagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Clear cache when data is deleted
    this.cache.clear();
    console.log('🗑️ Cache cleared after delete');
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<Food> {
    await this.collection.doc(id).update({
      is_available: isAvailable,
      updated_at: new Date(),
    });

    this.cache.clear();

    const updated = await this.findById(id);
    if (!updated) throw new Error('Food not found after update');
    return updated;
  }
}
