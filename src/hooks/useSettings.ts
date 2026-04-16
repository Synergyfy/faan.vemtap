import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, Organization } from '@/types/api';

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Organization>>('/organizations/settings');
      return data.data;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingsData: any) => {
      const { data } = await api.patch<ApiResponse<Organization>>('/organizations/settings', settingsData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

export const useRotateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/organizations/rotate-api-key');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

export const usePurgeData = () => {
  return useMutation({
    mutationFn: async (password: string) => {
      const { data } = await api.post('/organizations/purge-data', { password });
      return data.data;
    },
  });
};
