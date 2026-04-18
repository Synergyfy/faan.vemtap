import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, AnalyticsSummary, ActivityResponse, AnalyticsDistribution } from '@/types/api';

export interface ChartDataPoint {
  name: string;
  score?: number;
  issues?: number;
  value?: number;
  resolved?: number;
  unresolved?: number;
  [key: string]: string | number | undefined;
}

export type ChartData = ChartDataPoint[];

export const useAnalyticsSummary = (params?: Record<string, unknown>) => {
  return useQuery<AnalyticsSummary>({
    queryKey: ['analytics-summary', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AnalyticsSummary>>('/analytics/summary', { params });
      return data.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useSatisfactionTrend = (params?: Record<string, unknown>) => {
  return useQuery<ChartData>({
    queryKey: ['charts-satisfaction', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ data: ChartData }>>('/analytics/charts/satisfaction-trend', { params });
      return data.data.data;
    },
  });
};

export const usePeakActivity = (params?: Record<string, unknown>) => {
  return useQuery<ChartData>({
    queryKey: ['charts-peak', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ data: ChartData }>>('/analytics/charts/peak-activity', { params });
      return data.data.data;
    },
  });
};

export const useHotspots = (params?: Record<string, unknown>) => {
  return useQuery<ChartData>({
    queryKey: ['charts-hotspots', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ data: ChartData }>>('/analytics/charts/hotspots', { params });
      return data.data.data;
    },
  });
};

export const useDeptPerformanceChart = (params?: Record<string, unknown>) => {
  return useQuery<ChartData>({
    queryKey: ['charts-dept-perf', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ data: ChartData }>>('/analytics/charts/dept-performance', { params });
      return data.data.data;
    },
  });
};

export const useActivityFeed = (params?: Record<string, unknown>) => {
  return useQuery<ActivityResponse>({
    queryKey: ['analytics-activity', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ActivityResponse>>('/analytics/activity', { params });
      return data.data;
    },
    staleTime: 30 * 1000,
  });
};

export const useAnalyticsDistribution = (params?: Record<string, unknown>) => {
  return useQuery<AnalyticsDistribution>({
    queryKey: ['analytics-distribution', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AnalyticsDistribution>>('/analytics/distribution', { params });
      return data.data;
    },
  });
};
