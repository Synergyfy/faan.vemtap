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

export const useApiKey = () => {
  return useQuery({
    queryKey: ['api-key'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ key: string }>>('/organizations/api-key');
      return data.data;
    },
  });
};


export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingsData: Record<string, unknown>) => {
      const { data } = await api.patch<ApiResponse<unknown>>('/settings', settingsData);
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
