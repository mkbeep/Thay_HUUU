import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../api/staffApi';
import type { CreateStaffPayload, UpdateStaffRolePayload } from '../types/staff.types';

export const staffQueryKeys = {
  all: ['staff'] as const,
  activeCount: ['staff', 'active-count'] as const,
  directory: ['staff', 'directory'] as const,
  roles: ['staff', 'roles'] as const,
};

export function useActiveStaffCount() {
  return useQuery({
    queryKey: staffQueryKeys.activeCount,
    queryFn: () => staffApi.getActiveCount(),
  });
}

export function useStaffDirectory() {
  return useQuery({
    queryKey: staffQueryKeys.directory,
    queryFn: () => staffApi.getDirectory(),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: staffQueryKeys.roles,
    queryFn: () => staffApi.getRoles(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => staffApi.createStaff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.all });
    },
  });
}

export function useUpdateStaffRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateStaffRolePayload;
    }) => staffApi.updateStaffRole(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.all });
    },
  });
}
