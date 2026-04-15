import { Department } from '@/types/rbac';

export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 'security',
    name: 'Aviation Security (AVSEC)',
    locationId: 'abuja',
    icon: 'Shield',
    color: '#ef4444',
    users: 24,
    touchpoints: 12,
    activeIssues: 3,
  },
  {
    id: 'security-lagos',
    name: 'Aviation Security (AVSEC)',
    locationId: 'lagos',
    icon: 'Shield',
    color: '#ef4444',
    users: 32,
    touchpoints: 18,
    activeIssues: 5,
  },
  {
    id: 'customer-service',
    name: 'Customer Service',
    locationId: 'abuja',
    icon: 'Users',
    color: '#22c55e',
    users: 18,
    touchpoints: 45,
    activeIssues: 0,
  },
  {
    id: 'customer-service-lagos',
    name: 'Customer Service',
    locationId: 'lagos',
    icon: 'Users',
    color: '#22c55e',
    users: 22,
    touchpoints: 38,
    activeIssues: 2,
  },
  {
    id: 'operations',
    name: 'Operations Control',
    locationId: 'abuja',
    icon: 'Settings',
    color: '#3b82f6',
    users: 15,
    touchpoints: 8,
    activeIssues: 5,
  },
  {
    id: 'operations-lagos',
    name: 'Operations Control',
    locationId: 'lagos',
    icon: 'Settings',
    color: '#3b82f6',
    users: 20,
    touchpoints: 10,
    activeIssues: 3,
  },
  {
    id: 'facilities',
    name: 'Facilities & Assets',
    locationId: 'abuja',
    icon: 'Briefcase',
    color: '#f59e0b',
    users: 12,
    touchpoints: 15,
    activeIssues: 8,
  },
  {
    id: 'facilities-lagos',
    name: 'Facilities & Assets',
    locationId: 'lagos',
    icon: 'Briefcase',
    color: '#f59e0b',
    users: 16,
    touchpoints: 20,
    activeIssues: 4,
  },
  {
    id: 'protocol',
    name: 'Protocol & VIP',
    locationId: 'abuja',
    icon: 'User',
    color: '#8b5cf6',
    users: 8,
    touchpoints: 5,
    activeIssues: 0,
  },
  {
    id: 'it',
    name: 'IT & Technology',
    locationId: 'abuja',
    icon: 'Monitor',
    color: '#06b6d4',
    users: 6,
    touchpoints: 3,
    activeIssues: 1,
  },
];

export const getDepartmentsByLocation = (locationId: string): Department[] => {
  return MOCK_DEPARTMENTS.filter((dept) => dept.locationId === locationId);
};

export const getDepartmentById = (id: string): Department | undefined => {
  return MOCK_DEPARTMENTS.find((dept) => dept.id === id);
};

export const getDepartmentName = (id: string): string => {
  const dept = getDepartmentById(id);
  return dept?.name || 'Unknown Department';
};