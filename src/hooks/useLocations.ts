import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, Location } from '@/types/api';

export const useLocations = (params?: any) => {
  return useQuery({
    queryKey: ['locations', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<Location>>>('/locations', { params });
      return data.data;
    },
  });
};

export const useLocation = (id: string) => {
  return useQuery({
    queryKey: ['location', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Location>>(`/locations/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationData: any) => {
      const { data } = await api.post<ApiResponse<Location>>('/locations', locationData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};
