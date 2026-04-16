import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, InternalReport } from '@/types/api';

export const useReports = (params?: any) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<InternalReport>>>('/reports', { params });
      return data.data;
    },
  });
};

export const useMyReports = (params?: any) => {
  return useQuery({
    queryKey: ['my-reports', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<InternalReport>>>('/reports/me', { params });
      return data.data;
    },
  });
};

export const useReport = (uuid: string) => {
  return useQuery({
    queryKey: ['report', uuid],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InternalReport>>(`/reports/${uuid}`);
      return data.data;
    },
    enabled: !!uuid,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportData: any) => {
      const { data } = await api.post<ApiResponse<InternalReport>>('/reports', reportData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    },
  });
};
export const useReportTemplates = (params?: any) => {
  return useQuery({
    queryKey: ['report-templates', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<any>>>('/reports/templates', { params });
      return data.data;
    },
  });
};

export const useCreateReportTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: any) => {
      const { data } = await api.post<ApiResponse<any>>('/reports/templates', templateData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });
};

export const useDeleteReportTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      await api.delete(`/reports/templates/${uuid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });
};
