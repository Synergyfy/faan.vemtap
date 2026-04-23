import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, InternalReport, ReportTemplate, CreateReportTemplateDto } from '@/types/api';

export const useReports = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<InternalReport>>>('/reports/template-reports', { params });
      return data.data;
    },
  });
};

export const useMyReports = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['my-reports', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<InternalReport>>>('/reports/my-reports', { params });
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
    mutationFn: async (reportData: Partial<InternalReport> & { templateId: string; date: string }) => {
      const { data } = await api.post<ApiResponse<InternalReport>>('/reports/submit', reportData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    },
  });
};

export const useCreateReportPublic = () => {
  return useMutation({
    mutationFn: async (reportData: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<InternalReport>>('/reports/submit-public', reportData);
      return data.data;
    },
  });
};
export const useReportTemplates = (params?: Record<string, unknown>, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['report-templates', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<ReportTemplate>>>('/report-templates', { params });
      return data.data;
    },
    ...options,
  });
};

export const useReportTemplatePublic = (id: string) => {
  return useQuery({
    queryKey: ['report-template-public', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ReportTemplate>>(`/report-templates/${id}/public`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateReportTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: CreateReportTemplateDto) => {
      const { data } = await api.post<ApiResponse<ReportTemplate>>('/report-templates', templateData);
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
      await api.delete(`/report-templates/${uuid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });
};

export const useUpdateReportTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateReportTemplateDto> }) => {
      const response = await api.patch<ApiResponse<ReportTemplate>>(`/report-templates/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });
};

export const useShareReportTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, departmentIds, locationIds }: { id: string; departmentIds?: string[]; locationIds?: string[] }) => {
      const response = await api.post<ApiResponse<ReportTemplate>>(`/report-templates/${id}/share`, { departmentIds, locationIds });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });
};
