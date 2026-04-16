import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, Location } from '@/types/api';

export const useLocations = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['locations', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Location>>('/locations', { params });
      return data;
    },
  });
};

export const useLocation = (id: string) => {
  return useQuery({
    queryKey: ['locations', id],
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
    mutationFn: async (locationData: Partial<Location>) => {
      const { data } = await api.post<ApiResponse<Location>>('/locations', locationData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data: locationData }: { uuid: string; data: Partial<Location> }) => {
      const { data } = await api.patch<ApiResponse<Location>>(`/locations/${uuid}`, locationData);
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
