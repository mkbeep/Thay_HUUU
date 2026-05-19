import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import type {
  AddExportPayload,
  AddImportPayload,
  CreateMaterialPayload,
} from '../types/inventory.types';

export const inventoryQueryKeys = {
  all: ['inventory'] as const,
  stats: ['inventory', 'stats'] as const,
  list: (filters?: { category?: string; status?: string; search?: string }) =>
    ['inventory', 'list', filters] as const,
  alerts: ['inventory', 'alerts'] as const,
  history: (materialId: string) => ['inventory', 'history', materialId] as const,
};

export function useInventoryStats() {
  return useQuery({
    queryKey: inventoryQueryKeys.stats,
    queryFn: () => inventoryApi.getStats(),
  });
}

export function useMaterials(filters?: {
  category?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: inventoryQueryKeys.list(filters),
    queryFn: () => inventoryApi.getMaterials(filters),
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: inventoryQueryKeys.alerts,
    queryFn: () => inventoryApi.getAlerts(),
  });
}

export function useMaterialHistory(materialId: string | null) {
  return useQuery({
    queryKey: inventoryQueryKeys.history(materialId ?? ''),
    queryFn: () => inventoryApi.getHistory(materialId!),
    enabled: !!materialId,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMaterialPayload) =>
      inventoryApi.createMaterial(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
}

export function useAddImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      materialId,
      payload,
    }: {
      materialId: string;
      payload: AddImportPayload;
    }) => inventoryApi.addImport(materialId, payload),
    onSuccess: (_data, { materialId }) => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.history(materialId),
      });
    },
  });
}

export function useAddExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      materialId,
      payload,
    }: {
      materialId: string;
      payload: AddExportPayload;
    }) => inventoryApi.addExport(materialId, payload),
    onSuccess: (_data, { materialId }) => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.history(materialId),
      });
    },
  });
}
