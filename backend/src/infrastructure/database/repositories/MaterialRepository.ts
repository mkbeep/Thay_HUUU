/**
 * Material Repository - Infrastructure Layer
 * Collection: material
 * Subcollections: import, export
 */

import { db, firebaseAdmin } from '../../config/firebase.config';
import {
  AddExportDTO,
  AddImportDTO,
  CreateMaterialDTO,
  MaterialDTO,
  MaterialExportDTO,
  MaterialHistoryEntryDTO,
  MaterialImportDTO,
  MaterialKpiDTO,
} from '../../../application/dto/MaterialDTO';
import { computeMaterialKpi, getStockStatus } from '../../../domain/utils/stockStatus';

const FieldValue = firebaseAdmin.firestore.FieldValue;
const Timestamp = firebaseAdmin.firestore.Timestamp;
const MATERIAL_COLLECTION = (process.env.MATERIAL_COLLECTION || 'material').trim();

export class MaterialRepository {
  private collection() {
    return db.collection(MATERIAL_COLLECTION);
  }

  private timestampToIso(value: unknown): string {
    if (!value) return new Date().toISOString();
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null && '_seconds' in value) {
      const ts = value as { _seconds: number; _nanoseconds?: number };
      return new Date(ts._seconds * 1000).toISOString();
    }
    return new Date().toISOString();
  }

  private mapMaterialDoc(
    id: string,
    data: FirebaseFirestore.DocumentData
  ): MaterialDTO {
    const quantity = Number(data.quantity ?? 0);
    const legacyQuantity = Number(data.current_quantity ?? 0);
    const minimum = Number(data.minimum ?? data.minimum_quantity ?? 0);
    const resolvedQuantity = Number.isFinite(quantity) && data.quantity !== undefined ? quantity : legacyQuantity;
    return {
      id,
      name: String(data.name ?? data.item_name ?? ''),
      quantity: resolvedQuantity,
      minimum,
      category: String(data.category ?? ''),
      status: getStockStatus(resolvedQuantity, minimum),
    };
  }

  async getKpi(): Promise<MaterialKpiDTO> {
    const snapshot = await this.collection().get();
    const materials = snapshot.docs.map((doc) => {
      const data = doc.data();
      const quantity = data.quantity !== undefined ? data.quantity : data.current_quantity;
      const minimum = data.minimum !== undefined ? data.minimum : data.minimum_quantity;
      return {
        quantity: Number(quantity ?? 0),
        minimum: Number(minimum ?? 0),
      };
    });
    return computeMaterialKpi(materials);
  }

  async findAll(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<MaterialDTO[]> {
    const snapshot = await this.collection().get();
    let items = snapshot.docs.map((doc) =>
      this.mapMaterialDoc(doc.id, doc.data())
    );

    if (filters?.category) {
      items = items.filter((item) => item.category === filters.category);
    }

    if (filters?.status && filters.status !== 'all') {
      items = items.filter((item) => item.status === filters.status);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    items.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return items;
  }

  async findById(id: string): Promise<MaterialDTO | null> {
    const doc = await this.collection().doc(id).get();
    if (!doc.exists) return null;
    return this.mapMaterialDoc(doc.id, doc.data()!);
  }

  async findAlertItems(): Promise<MaterialDTO[]> {
    const all = await this.findAll();
    return all.filter(
      (item) => item.status === 'low-stock' || item.status === 'out-of-stock'
    );
  }

  async createWithInitialImport(dto: CreateMaterialDTO): Promise<MaterialDTO> {
    const materialRef = this.collection().doc();
    const importRef = materialRef.collection('import').doc();
    const now = FieldValue.serverTimestamp();
    const importQuantity = Number(dto.import.quantity);

    await db.runTransaction(async (transaction) => {
      transaction.set(materialRef, {
        name: dto.name.trim(),
        item_name: dto.name.trim(),
        minimum: Number(dto.minimum),
        minimum_quantity: Number(dto.minimum),
        category: dto.category,
        quantity: importQuantity,
        current_quantity: importQuantity,
      });

      transaction.set(importRef, {
        createAt: now,
        price: Number(dto.import.price),
        quantity: importQuantity,
        supplier: dto.import.supplier.trim(),
      });
    });

    const created = await this.findById(materialRef.id);
    if (!created) throw new Error('Material not found after create');
    return created;
  }

  async addImport(materialId: string, dto: AddImportDTO): Promise<MaterialDTO> {
    const materialRef = this.collection().doc(materialId);
    const importRef = materialRef.collection('import').doc();
    const importQuantity = Number(dto.quantity);
    const now = FieldValue.serverTimestamp();

    await db.runTransaction(async (transaction) => {
      const materialSnap = await transaction.get(materialRef);
      if (!materialSnap.exists) {
        throw new Error('MATERIAL_NOT_FOUND');
      }

      const snapData = materialSnap.data();
      const currentQty = Number(snapData?.quantity ?? snapData?.current_quantity ?? 0);

      transaction.update(materialRef, {
        quantity: currentQty + importQuantity,
        current_quantity: currentQty + importQuantity,
      });

      transaction.set(importRef, {
        createAt: now,
        price: Number(dto.price),
        quantity: importQuantity,
        supplier: dto.supplier.trim(),
      });
    });

    const updated = await this.findById(materialId);
    if (!updated) throw new Error('Material not found after import');
    return updated;
  }

  async addExport(materialId: string, dto: AddExportDTO): Promise<MaterialDTO> {
    const materialRef = this.collection().doc(materialId);
    const exportRef = materialRef.collection('export').doc();
    const exportQuantity = Number(dto.quantity);
    const now = FieldValue.serverTimestamp();

    await db.runTransaction(async (transaction) => {
      const materialSnap = await transaction.get(materialRef);
      if (!materialSnap.exists) {
        throw new Error('MATERIAL_NOT_FOUND');
      }

      const snapData = materialSnap.data();
      const currentQty = Number(snapData?.quantity ?? snapData?.current_quantity ?? 0);
      if (exportQuantity <= 0) {
        throw new Error('INVALID_EXPORT_QUANTITY');
      }
      if (currentQty < exportQuantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      transaction.update(materialRef, {
        quantity: currentQty - exportQuantity,
        current_quantity: currentQty - exportQuantity,
      });

      transaction.set(exportRef, {
        createAt: now,
        quantity: exportQuantity,
      });
    });

    const updated = await this.findById(materialId);
    if (!updated) throw new Error('Material not found after export');
    return updated;
  }

  async getHistory(materialId: string): Promise<MaterialHistoryEntryDTO[]> {
    const materialRef = this.collection().doc(materialId);
    const [importSnap, exportSnap] = await Promise.all([
      materialRef.collection('import').get(),
      materialRef.collection('export').get(),
    ]);

    const imports: MaterialHistoryEntryDTO[] = importSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'import' as const,
        createAt: this.timestampToIso(data.createAt ?? data.createdAt),
        quantity: Number(data.quantity ?? 0),
        price: Number(data.price ?? 0),
        supplier: String(data.supplier ?? ''),
      };
    });

    const exports: MaterialHistoryEntryDTO[] = exportSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'export' as const,
        createAt: this.timestampToIso(data.createAt ?? data.createdAt),
        quantity: Number(data.quantity ?? 0),
      };
    });

    return [...imports, ...exports].sort(
      (a, b) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime()
    );
  }

  async getImports(materialId: string): Promise<MaterialImportDTO[]> {
    const snapshot = await this.collection()
      .doc(materialId)
      .collection('import')
      .get();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          createAt: this.timestampToIso(data.createAt ?? data.createdAt),
          price: Number(data.price ?? 0),
          quantity: Number(data.quantity ?? 0),
          supplier: String(data.supplier ?? ''),
        };
      })
      .sort(
        (a, b) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime()
      );
  }

  async getExports(materialId: string): Promise<MaterialExportDTO[]> {
    const snapshot = await this.collection()
      .doc(materialId)
      .collection('export')
      .get();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          createAt: this.timestampToIso(data.createAt ?? data.createdAt),
          quantity: Number(data.quantity ?? 0),
        };
      })
      .sort(
        (a, b) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime()
      );
  }
}
