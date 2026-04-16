import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, Submission, SubmissionListItem } from '@/types/api';

export const useSubmissions = (params?: any) => {
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

export const useUpdateSubmission = (uuid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateData: any) => {
      const { data } = await api.patch<ApiResponse<Submission>>(`/submissions/${uuid}`, updateData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', uuid] });
    },
  });
};

export const useAddSubmissionNote = (uuid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: { content: string }) => {
      const { data } = await api.post(`/submissions/${uuid}/notes`, noteData);
      return data.data;
    },
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', uuid] });
    },
  });
};

export const useCreateSubmission = () => {
  return useMutation({
    mutationFn: async (submissionData: any) => {
      const { data } = await api.post<ApiResponse<Submission>>('/submissions', submissionData);
      return data.data;
    },
  });
};
