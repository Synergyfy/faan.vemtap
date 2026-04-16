import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, Department } from '@/types/api';

export const useDepartments = (params?: any) => {
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
    mutationFn: async (deptData: any) => {
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
    mutationFn: async (adminData: any) => {
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
