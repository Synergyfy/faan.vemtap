import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, Touchpoint } from '@/types/api';

export const useTouchpoints = (params?: Record<string, unknown>, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['touchpoints', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<Touchpoint>>>('/touchpoints', { params });
      return data.data;
    },
    ...options,
  });
};

export const useTouchpoint = (id: string) => {
  return useQuery({
    queryKey: ['touchpoint', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Touchpoint>>(`/touchpoints/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useTouchpointBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['touchpoint', slug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Touchpoint>>(`/touchpoints/slug/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
};

export const useTouchpointQR = (id: string) => {
  return useQuery({
    queryKey: ['touchpoint-qr', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ qrCode: string; url: string }>>(`/touchpoints/${id}/qr-data`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateTouchpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (touchpointData: Partial<Touchpoint>) => {
      const { data } = await api.post<ApiResponse<Touchpoint>>('/touchpoints', touchpointData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] });
    },
  });
};

export const useUpdateTouchpointStatus = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: boolean) => {
      const { data } = await api.patch(`/touchpoints/${id}/status`, { isActive: status });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] });
      queryClient.invalidateQueries({ queryKey: ['touchpoint', id] });
    },
  });
};

export const useDeleteTouchpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/touchpoints/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] });
    },
  });
};

export const useUpdateTouchpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data: updateData }: { uuid: string; data: Partial<Touchpoint> }) => {
      const { data } = await api.patch<ApiResponse<Touchpoint>>(`/touchpoints/${uuid}`, updateData);
      return data.data;
    },
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] });
      queryClient.invalidateQueries({ queryKey: ['touchpoint', uuid] });
    },
  });
};

export const useArchiveTouchpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/touchpoints/${id}/status`, { isActive: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] });
    },
  });
};

export const useDownloadQr = () => {
  return {
    mutate: (id: string, format: string = 'png') => {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/touchpoints/${id}/qr?format=${format}`;
      window.open(url, '_blank');
    }
  };
};
