import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, AnalyticsSummary } from '@/types/api';

export const useAnalyticsSummary = (params?: any) => {
  return useQuery({
    queryKey: ['analytics-summary', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AnalyticsSummary>>('/analytics/summary', { params });
      return data.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useSatisfactionTrend = (params?: any) => {
  return useQuery({
    queryKey: ['charts-satisfaction', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>('/analytics/charts/satisfaction-trend', { params });
      return data.data;
    },
  });
};

export const usePeakActivity = (params?: any) => {
  return useQuery({
    queryKey: ['charts-peak', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>('/analytics/charts/peak-activity', { params });
      return data.data;
    },
  });
};

export const useHotspots = (params?: any) => {
  return useQuery({
    queryKey: ['charts-hotspots', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>('/analytics/charts/hotspots', { params });
      return data.data;
    },
  });
};

export const useDeptPerformanceChart = (params?: any) => {
  return useQuery({
    queryKey: ['charts-dept-perf', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>('/analytics/charts/dept-performance', { params });
      return data.data;
    },
  });
};
