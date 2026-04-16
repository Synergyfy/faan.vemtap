import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, Department } from '@/types/api';

export const useDepartments = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<Department>>>('/departments', { params });
      return data.data;
    },
  });
};

export const useDepartment = (id: string | null) => {
  return useQuery({
    queryKey: ['department', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Department>>(`/departments/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deptData: Partial<Department>) => {
      const { data } = await api.post<ApiResponse<Department>>('/departments', deptData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useAssignDepartmentAdmin = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adminData: { firstName?: string; lastName?: string; email?: string; password?: string; userId?: string }) => {
      const { data } = await api.post(`/departments/${id}/admins`, adminData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department', id] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};
export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data: updateData }: { uuid: string; data: Partial<Department> }) => {
      const { data } = await api.patch<ApiResponse<Department>>(`/departments/${uuid}`, updateData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useArchiveDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await api.patch<ApiResponse<Department>>(`/departments/${uuid}/archive`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};
