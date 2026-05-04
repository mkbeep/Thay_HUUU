/**
 * User Repository Implementation - Infrastructure Layer
 * Triển khai cụ thể việc truy xuất dữ liệu User từ Firebase
 */

import { db } from '../../config/firebase.config';
import { firebaseAdmin } from '../../config/firebase.config';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User, UserWithRoles, Role } from '../../../domain/entities/User';

export class UserRepository implements IUserRepository {
  private readonly collection = db.collection('users');
  private readonly userRolesCollection = db.collection('user_role');
  private readonly rolesCollection = db.collection('role');

  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    const user = await this.findById(id);
    if (!user) return null;

    // Lấy roles của user
    const userRolesSnapshot = await this.userRolesCollection
      .where('user_id', '==', id)
      .get();

    const roleIds = userRolesSnapshot.docs.map(doc => doc.data().role_id);
    
    if (roleIds.length === 0) {
      return { ...user, roles: [] };
    }

    // Lấy thông tin chi tiết của roles
    const rolesSnapshot = await this.rolesCollection
      .where(firebaseAdmin.firestore.FieldPath.documentId(), 'in', roleIds)
      .get();

    const roles: Role[] = rolesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Role));

    return { ...user, roles };
  }

  async findAll(filters?: {
    is_active?: boolean;
    role?: string;
    search?: string;
  }): Promise<User[]> {
    let query: FirebaseFirestore.Query = this.collection;

    if (filters?.is_active !== undefined) {
      query = query.where('is_active', '==', filters.is_active);
    }

    const snapshot = await query.get();
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));

    // Filter by search term
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(user =>
        user.full_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    return users;
  }

  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const now = new Date();
    const data = {
      ...userData,
      created_at: now,
      updated_at: now,
    };

    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data } as User;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    await this.collection.doc(id).update(updateData);
    const updated = await this.findById(id);
    if (!updated) throw new Error('User not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
    
    // Xóa user roles
    const userRolesSnapshot = await this.userRolesCollection
      .where('user_id', '==', id)
      .get();
    
    const batch = db.batch();
    userRolesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.collection.doc(userId).update({
      fcm_token: fcmToken,
      updated_at: new Date(),
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.collection.doc(userId).update({
      last_login: new Date(),
    });
  }
}
