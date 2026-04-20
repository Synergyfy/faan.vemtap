import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, Submission, SubmissionListItem } from '@/types/api';

export const useSubmissions = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['submissions', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<SubmissionListItem>>>('/submissions', { params });
      return data.data;
    },
  });
};

export const useSubmission = (uuid: string) => {
  return useQuery({
    queryKey: ['submission', uuid],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Submission>>(`/submissions/${uuid}`);
      return data.data;
    },
    enabled: !!uuid,
  });
};

export const useUpdateSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data: updateData }: { uuid: string; data: Partial<Submission> }) => {
      const { data } = await api.patch<ApiResponse<Submission>>(`/submissions/${uuid}`, updateData);
      return data.data;
    },
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', uuid] });
    },
  });
};

export const useAddSubmissionNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, content }: { uuid: string; content: string }) => {
      const { data } = await api.post(`/submissions/${uuid}/notes`, { content });
      return data.data;
    },
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', uuid] });
    },
  });
};


export const useCreateSubmission = () => {
  return useMutation({
    mutationFn: async (submissionData: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<Submission>>('/submissions', submissionData);
      return data.data;
    },
  });
};

export const useCreatePublicSubmission = () => {
  return useMutation({
    mutationFn: async (submissionData: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<Submission>>('/submissions/public', submissionData);
      return data.data;
    },
  });
};
