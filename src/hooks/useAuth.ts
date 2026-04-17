import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { setTokens, clearTokens } from '@/lib/api';
import { AuthResponse, UserProfile, ApiResponse } from '@/types/api';
import { useAuthContext } from '@/context/AuthContext';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login } = useAuthContext();

  return useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      return data.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      login(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuthContext();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      clearTokens();
      logout();
      queryClient.clear();
    },
  });
};

export const useProfile = () => {
  const { isAuthenticated } = useAuthContext();
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserProfile>>('/auth/profile');
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      const { data } = await api.patch<ApiResponse<UserProfile>>('/auth/profile', profileData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (passwordData: Record<string, string>) => {
      const { data } = await api.patch('/auth/change-password', passwordData);
      return data.data;
    },
  });
};
