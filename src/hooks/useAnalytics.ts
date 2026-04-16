import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, AnalyticsSummary } from '@/types/api';

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
      const { data } = await api.get<ApiResponse<ChartData>>('/analytics/charts/satisfaction-trend', { params });
      return data.data;
    },
  });
};

export const usePeakActivity = (params?: Record<string, unknown>) => {
  return useQuery<ChartData>({
    queryKey: ['charts-peak', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ChartData>>('/analytics/charts/peak-activity', { params });
      return data.data;
    },
  });
};

export const useHotspots = (params?: Record<string, unknown>) => {
  return useQuery<ChartData>({
    queryKey: ['charts-hotspots', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ChartData>>('/analytics/charts/hotspots', { params });
      return data.data;
    },
  });
};

export const useDeptPerformanceChart = (params?: Record<string, unknown>) => {
  return useQuery<ChartData>({
    queryKey: ['charts-dept-perf', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ChartData>>('/analytics/charts/dept-performance', { params });
      return data.data;
    },
  });
};
