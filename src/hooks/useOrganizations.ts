import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, Organization } from '@/types/api';

export const useOrganizations = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['organizations', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<Organization>>>('/organizations', { params });
      return data.data;
    },
  });
};

export const useOrganization = (id: string) => {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Organization>>(`/organizations/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgData: Partial<Organization>) => {
      const { data } = await api.post<ApiResponse<Organization>>('/organizations', orgData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgData: Partial<Organization>) => {
      const { data } = await api.patch<ApiResponse<Organization>>('/organizations', orgData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};
