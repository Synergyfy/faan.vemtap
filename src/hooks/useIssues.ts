import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { ApiResponse, InternalReport, InternalReportStatus, CreateIssueDto, PaginatedResponse } from '@/types/api';

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
      const { data } = await api.get<ApiResponse<PaginatedResponse<InternalReport>>>('/reports/issues', { params });
      return data.data.data;
    },
  });
};

export const useIssue = (uuid: string) => {
  return useQuery({
    queryKey: ['issue', uuid],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InternalReport>>(`/reports/issues/${uuid}`);
      return data.data;
    },
    enabled: !!uuid,
  });
};

export const useCreateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation<InternalReport[], AxiosError<{ message: string | string[] }>, CreateIssueDto>({
    mutationFn: async (issueData: CreateIssueDto) => {
      const { data } = await api.post<ApiResponse<InternalReport[]>>('/reports/issues', issueData);
      return data.data;
    },
    onSuccess: (newIssues) => {
      // Update Kanban Cache
      queryClient.setQueriesData({ queryKey: ['kanban'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pending: [...newIssues, ...(oldData.pending || [])]
        };
      });

      // Update Issues List Cache
      queryClient.setQueriesData({ queryKey: ['issues'] }, (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return [...newIssues, ...oldData];
        }
        if (oldData.data && Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: [...newIssues, ...oldData.data]
          };
        }
        return oldData;
      });

      // Background refetch for eventual consistency
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
};

export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InternalReport>) => {
      // Remove id from updates to avoid backend rejection (property id should not exist)
      const { id: _, ...payload } = updates as any;
      const { data } = await api.patch(`/reports/issues/${id}`, payload);
      return data.data;
    },
    onMutate: async ({ id }) => {
      // Optimistic update for Kanban
      await queryClient.cancelQueries({ queryKey: ['kanban'] });
      const previousKanban = queryClient.getQueryData(['kanban']);
      return { previousKanban };
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
    },
  });
};

export const useAddIssueNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data } = await api.post(`/reports/issues/${id}/notes`, { content });
      return data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
    },
  });
};
