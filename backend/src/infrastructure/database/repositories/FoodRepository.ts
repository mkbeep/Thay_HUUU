/**
 * Food Repository Implementation - Infrastructure Layer
 */

import { db } from '../../config/firebase.config';
import { IFoodRepository } from '../../../domain/repositories/IFoodRepository';
import { Food, FoodWithImages, FoodCategory, FoodImage } from '../../../domain/entities/Food';
import { CloudinaryService } from '../../services/CloudinaryService';

export class FoodRepository implements IFoodRepository {
  private readonly collection = db.collection('food');
  private readonly imagesCollection = db.collection('food_image');

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
      public_id: data.public_id,
      is_primary: data.is_primary,
      display_order: data.display_order,
      uploaded_at: data.uploaded_at,
    };
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

    return { ...food, images };
  }

  async findAll(filters?: {
    category?: FoodCategory;
    is_available?: boolean;
    is_vegetarian?: boolean;
    search?: string;
  }): Promise<Food[]> {
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

        return { ...food, images };
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
    return { id: docRef.id, ...data } as Food;
  }

  async createImage(foodId: string, imageUrl: string, publicId?: string): Promise<FoodImage> {
    const now = new Date();
    const docRef = await this.imagesCollection.add({
      food_id: foodId,
      image_url: imageUrl,
      public_id: publicId,
      is_primary: true,
      display_order: 0,
      uploaded_at: now,
    });

    return {
      id: docRef.id,
      food_id: foodId,
      image_url: imageUrl,
      public_id: publicId,
      is_primary: true,
      display_order: 0,
      uploaded_at: now,
    };
  }

  async replacePrimaryImage(foodId: string, imageUrl: string, publicId?: string): Promise<FoodImage> {
    await this.deleteImages(foodId, true);
    return this.createImage(foodId, imageUrl, publicId);
  }

  async movePrimaryImageToCategory(foodId: string, category?: string): Promise<void> {
    const imagesSnapshot = await this.imagesCollection
      .where('food_id', '==', foodId)
      .get();
    const primaryImageDoc = imagesSnapshot.docs.find(doc => doc.data().is_primary) || imagesSnapshot.docs[0];
    if (!primaryImageDoc) return;

    const image = primaryImageDoc.data();
    const currentPublicId = image.public_id || CloudinaryService.publicIdFromUrl(image.image_url);
    if (!currentPublicId) return;

    const currentFolder = currentPublicId.split('/').slice(0, -1).join('/');
    const nextFolder = `menu/${CloudinaryService.folderForCategory(category)}`;
    if (currentFolder === nextFolder) return;

    const moved = await CloudinaryService.moveImageToCategory(currentPublicId, foodId, category);
    await primaryImageDoc.ref.update({
      image_url: moved.secure_url,
      public_id: moved.public_id,
      uploaded_at: new Date(),
    });
  }

  async deleteImages(foodId: string, deleteCloudinaryAssets = true): Promise<void> {
    const imagesSnapshot = await this.imagesCollection
      .where('food_id', '==', foodId)
      .get();

    if (deleteCloudinaryAssets) {
      await Promise.all(
        imagesSnapshot.docs.map((doc) => {
          const image = doc.data();
          return CloudinaryService.deleteImage(
            image.public_id || CloudinaryService.publicIdFromUrl(image.image_url)
          );
        })
      );
    }

    if (imagesSnapshot.empty) return;

    const batch = db.batch();
    imagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  async update(id: string, data: Partial<Food>): Promise<Food> {
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    await this.collection.doc(id).update(updateData);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Food not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
    await this.deleteImages(id, true);
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<Food> {
    await this.collection.doc(id).update({
      is_available: isAvailable,
      updated_at: new Date(),
    });
    
    const updated = await this.findById(id);
    if (!updated) throw new Error('Food not found after update');
    return updated;
  }
}
