import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, InternalReport, InternalReportStatus } from '@/types/api';

export const useKanban = (params?: any) => {
  return useQuery({
    queryKey: ['kanban', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>('/reports/kanban', { params });
      return data.data;
    },
    staleTime: 15 * 1000,
  });
};

export const useIssues = (params?: any) => {
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
    mutationFn: async (issueData: any) => {
      const { data } = await api.post<ApiResponse<InternalReport>>('/reports', issueData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
};

export const useUpdateIssueStatus = (uuid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: InternalReportStatus) => {
      const { data } = await api.patch(`/reports/${uuid}/status`, { status });
      return data.data;
    },
    onMutate: async (newStatus) => {
      // Optimistic update for Kanban
      await queryClient.cancelQueries({ queryKey: ['kanban'] });
      const previousKanban = queryClient.getQueryData(['kanban']);
      // Note: Implementation of board state update would go here
      return { previousKanban };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['issue', uuid] });
    },
  });
};

export const useAddIssueNote = (uuid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: { content: string }) => {
      const { data } = await api.post(`/reports/${uuid}/notes`, noteData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', uuid] });
    },
  });
};
