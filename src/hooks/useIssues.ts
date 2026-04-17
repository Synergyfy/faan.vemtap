import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, InternalReport, InternalReportStatus } from '@/types/api';

export const useKanban = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['kanban', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Record<string, InternalReport[]>>>('/reports/kanban', { params });
      return data.data;
    },
    staleTime: 15 * 1000,
  });
};

export const useIssues = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['issues', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InternalReport[]>>('/reports', { 
        params: { ...params, reportType: 'INCIDENT' } 
      });
      return data.data;
    },
  });
};

export const useIssue = (uuid: string) => {
  return useQuery({
    queryKey: ['issue', uuid],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InternalReport>>(`/reports/${uuid}`);
      return data.data;
    },
    enabled: !!uuid,
  });
};

export const useCreateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueData: Partial<InternalReport>) => {
      const { data } = await api.post<ApiResponse<InternalReport>>('/reports', issueData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
};

export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, status }: { uuid: string; status: InternalReportStatus }) => {
      const { data } = await api.patch(`/reports/${uuid}/status`, { status });
      return data.data;
    },
    onMutate: async ({ uuid }) => {
      // Optimistic update for Kanban
      await queryClient.cancelQueries({ queryKey: ['kanban'] });
      const previousKanban = queryClient.getQueryData(['kanban']);
      return { previousKanban };
    },
    onSettled: (_, __, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['issue', uuid] });
    },
  });
};

export const useAddIssueNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, content }: { uuid: string; content: string }) => {
      const { data } = await api.post(`/reports/${uuid}/notes`, { content });
      return data.data;
    },
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: ['issue', uuid] });
    },
  });
};
