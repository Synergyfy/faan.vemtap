import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, FeedbackForm } from '@/types/api';

export const useFeedbackForms = (params?: Record<string, unknown>, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['feedback-forms', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<FeedbackForm>>>('/feedback-forms', { params });
      return data.data;
    },
    ...options,
  });
};

export const useFeedbackForm = (id: string) => {
  return useQuery({
    queryKey: ['feedback-form', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FeedbackForm>>(`/feedback-forms/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateFeedbackForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: Partial<FeedbackForm>) => {
      const { data } = await api.post<ApiResponse<FeedbackForm>>('/feedback-forms', formData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-forms'] });
    },
  });
};

export const useUpdateFeedbackForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: Partial<FeedbackForm> }) => {
      const { data } = await api.patch<ApiResponse<FeedbackForm>>(`/feedback-forms/${id}`, updateData);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['feedback-forms'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-form', id] });
    },
  });
};

export const useDeleteFeedbackForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/feedback-forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-forms'] });
    },
  });
};
