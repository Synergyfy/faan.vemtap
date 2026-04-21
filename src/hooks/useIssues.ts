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
    onSuccess: () => {
      // Invalidate all related queries to force a refetch
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
};

export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & {
      title?: string;
      content?: string;
      status?: string;
      priority?: string;
      category?: string;
      assignedTo?: string | null;
      departmentId?: string;
    }) => {
      // Map updates to the fields expected by the backend
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.content !== undefined) payload.content = updates.content;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.assignedTo !== undefined) payload.assignedTo = updates.assignedTo;
      if (updates.departmentId !== undefined) payload.departmentId = updates.departmentId;
      
      const { data } = await api.patch(`/reports/issues/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
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
