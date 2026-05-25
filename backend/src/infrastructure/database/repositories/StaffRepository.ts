/**
 * Staff Repository - Infrastructure Layer
 * Truy vấn users, role, user_role cho quản lý nhân sự
 */

import bcrypt from 'bcryptjs';
import { db, firebaseAdmin } from '../../config/firebase.config';
import {
  CreateStaffDTO,
  RoleDTO,
  StaffMemberDTO,
} from '../../../application/dto/StaffDTO';

const FieldValue = firebaseAdmin.firestore.FieldValue;
const CUSTOMER_ROLE_NAME = 'CUSTOMER';

const isCustomerRoleName = (roleName?: string): boolean =>
  (roleName || '').trim().toUpperCase() === CUSTOMER_ROLE_NAME;

export class StaffRepository {
  private readonly usersCollection = db.collection('users');
  private readonly userRolesCollection = db.collection('user_role');
  private readonly rolesCollection = db.collection('role');

  async countActiveUsers(): Promise<number> {
    const staff = await this.getStaffDirectory();
    return staff.filter((member) => member.is_active).length;
  }

  async findAllRoles(): Promise<RoleDTO[]> {
    const snapshot = await this.rolesCollection.get();
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          role_name: data.role_name as string,
          description: data.description as string | undefined,
          permissions: (data.permissions as string[]) || [],
        };
      })
      .filter((role) => !isCustomerRoleName(role.role_name));
  }

  async getStaffDirectory(): Promise<StaffMemberDTO[]> {
    const [usersSnap, userRolesSnap, rolesSnap] = await Promise.all([
      this.usersCollection.get(),
      this.userRolesCollection.get(),
      this.rolesCollection.get(),
    ]);

    const roleMap = new Map<string, { role_name: string }>();
    rolesSnap.docs.forEach((doc) => {
      roleMap.set(doc.id, { role_name: doc.data().role_name as string });
    });

    const userRoleByUserId = new Map<
      string,
      { role_id: string; user_role_id: string; assigned_at: number }
    >();
    userRolesSnap.docs.forEach((doc) => {
      const data = doc.data();
      const userId = data.user_id as string;
      if (!userId) return;

      const assignedAt = this.timestampToMillis(data.assigned_at);
      const existing = userRoleByUserId.get(userId);

      if (!existing || assignedAt >= existing.assigned_at) {
        userRoleByUserId.set(userId, {
          role_id: data.role_id as string,
          user_role_id: doc.id,
          assigned_at: assignedAt,
        });
      }
    });

    return usersSnap.docs
      .map((doc) => {
        const data = doc.data();
        const userRoleEntry = userRoleByUserId.get(doc.id);
        const role = userRoleEntry ? roleMap.get(userRoleEntry.role_id) : undefined;
        const createdAt = data.created_at;

        return {
          id: doc.id,
          uid: (data.uid as string) || doc.id,
          full_name: (data.full_name as string) || '',
          email: (data.email as string) || '',
          avatar_url: data.avatar_url as string | undefined,
          is_active: Boolean(data.is_active),
          created_at: this.serializeTimestamp(createdAt),
          role_id: userRoleEntry?.role_id,
          role_name: role?.role_name,
          user_role_id: userRoleEntry?.user_role_id,
        };
      })
      .filter((member) => !isCustomerRoleName(member.role_name));
  }

  /**
   * Firebase Auth chỉ dùng khi bật USE_FIREBASE_AUTH=true và đã cấu hình
   * Email/Password trên Firebase Console. Mặc định tạo user Firestore + bcrypt
   * (cùng cơ chế login hiện tại và seed-admin).
   */
  private useFirebaseAuth(): boolean {
    return process.env.USE_FIREBASE_AUTH === 'true';
  }

  async createStaff(
    dto: CreateStaffDTO,
    assignedBy: string
  ): Promise<StaffMemberDTO> {
    const email = dto.email.trim();
    const fullName = dto.full_name.trim();

    const existing = await this.usersCollection
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new Error('EMAIL_EXISTS');
    }

    const roleDoc = await this.rolesCollection.doc(dto.role_id).get();
    if (!roleDoc.exists) {
      throw new Error('ROLE_NOT_FOUND');
    }
    if (isCustomerRoleName(roleDoc.data()?.role_name as string | undefined)) {
      throw new Error('ROLE_NOT_STAFF');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const userPayload = {
      email,
      full_name: fullName,
      password: hashedPassword,
      is_active: true,
      email_verified: false,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    let userId: string | null = null;
    let authUserCreated = false;

    try {
      if (this.useFirebaseAuth()) {
        const authUser = await firebaseAdmin.auth().createUser({
          email,
          password: dto.password,
          displayName: fullName,
        });
        userId = authUser.uid;
        authUserCreated = true;

        await this.usersCollection.doc(userId).set({
          ...userPayload,
          uid: userId,
        });
      } else {
        const docRef = this.usersCollection.doc();
        userId = docRef.id;

        await docRef.set({
          ...userPayload,
          uid: userId,
        });
      }

      await this.userRolesCollection.add({
        user_id: userId,
        role_id: dto.role_id,
        assigned_at: FieldValue.serverTimestamp(),
        assigned_by: assignedBy,
      });

      const createdDoc = await this.usersCollection.doc(userId).get();
      const createdData = createdDoc.data()!;

      return {
        id: userId,
        uid: userId,
        full_name: createdData.full_name as string,
        email: createdData.email as string,
        avatar_url: createdData.avatar_url as string | undefined,
        is_active: true,
        created_at: this.serializeTimestamp(createdData.created_at),
        role_id: dto.role_id,
        role_name: roleDoc.data()?.role_name as string,
      };
    } catch (error: unknown) {
      if (userId) {
        try {
          await this.usersCollection.doc(userId).delete();
        } catch {
          // ignore rollback failure
        }
      }
      if (authUserCreated && userId) {
        try {
          await firebaseAdmin.auth().deleteUser(userId);
        } catch {
          // ignore
        }
      }
      throw error;
    }
  }

  async updateUserRole(
    userId: string,
    roleId: string,
    assignedBy: string
  ): Promise<void> {
    const roleDoc = await this.rolesCollection.doc(roleId).get();
    if (!roleDoc.exists) {
      throw new Error('ROLE_NOT_FOUND');
    }
    if (isCustomerRoleName(roleDoc.data()?.role_name as string | undefined)) {
      throw new Error('ROLE_NOT_STAFF');
    }

    const userDoc = await this.usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('USER_NOT_FOUND');
    }

    const existingSnap = await this.userRolesCollection
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (existingSnap.empty) {
      await this.userRolesCollection.add({
        user_id: userId,
        role_id: roleId,
        assigned_at: FieldValue.serverTimestamp(),
        assigned_by: assignedBy,
      });
      return;
    }

    await existingSnap.docs[0].ref.update({
      role_id: roleId,
      assigned_at: FieldValue.serverTimestamp(),
      assigned_by: assignedBy,
    });
  }

  private timestampToMillis(value: unknown): number {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    if (
      typeof value === 'object' &&
      value !== null &&
      'toMillis' in value &&
      typeof (value as { toMillis: () => number }).toMillis === 'function'
    ) {
      return (value as { toMillis: () => number }).toMillis();
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private serializeTimestamp(value: unknown): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate: () => Date }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof value === 'string') return value;
    return null;
  }
}
