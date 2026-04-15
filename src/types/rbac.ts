export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  LOCATION_ADMIN = 'LOCATION_ADMIN',
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',
}

export interface Location {
  id: string;
  name: string;
  code: string;
  terminals?: Terminal[];
}

export interface Terminal {
  id: string;
  name: string;
  zones?: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  status: 'green' | 'yellow' | 'red';
}

export interface Department {
  id: string;
  name: string;
  locationId: string;
  icon?: string;
  color?: string;
  users?: number;
  touchpoints?: number;
  activeIssues?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  locationId?: string;
  departmentId?: string;
}

export interface Permission {
  canViewAllLocations: boolean;
  canViewAllDepartments: boolean;
  canViewAllSubmissions: boolean;
  canViewAllIssues: boolean;
  canViewGlobalDashboard: boolean;
  canViewLocationDashboard: boolean;
  canViewDepartmentDashboard: boolean;
  canManageLocations: boolean;
  canManageAllDepartments: boolean;
  canManageStaff: boolean;
  canCreateReports: boolean;
  canExportData: boolean;
  canSwitchLocations: boolean;
}

export const PERMISSIONS: Record<UserRole, Permission> = {
  [UserRole.SUPER_ADMIN]: {
    canViewAllLocations: true,
    canViewAllDepartments: true,
    canViewAllSubmissions: true,
    canViewAllIssues: true,
    canViewGlobalDashboard: true,
    canViewLocationDashboard: false,
    canViewDepartmentDashboard: false,
    canManageLocations: true,
    canManageAllDepartments: true,
    canManageStaff: true,
    canCreateReports: true,
    canExportData: true,
    canSwitchLocations: true,
  },
  [UserRole.LOCATION_ADMIN]: {
    canViewAllLocations: false,
    canViewAllDepartments: true,
    canViewAllSubmissions: true,
    canViewAllIssues: true,
    canViewGlobalDashboard: false,
    canViewLocationDashboard: true,
    canViewDepartmentDashboard: false,
    canManageLocations: false,
    canManageAllDepartments: true,
    canManageStaff: true,
    canCreateReports: true,
    canExportData: true,
    canSwitchLocations: false,
  },
  [UserRole.DEPARTMENT_ADMIN]: {
    canViewAllLocations: false,
    canViewAllDepartments: false,
    canViewAllSubmissions: false,
    canViewAllIssues: false,
    canViewGlobalDashboard: false,
    canViewLocationDashboard: false,
    canViewDepartmentDashboard: true,
    canManageLocations: false,
    canManageAllDepartments: false,
    canManageStaff: false,
    canCreateReports: true,
    canExportData: false,
    canSwitchLocations: false,
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin (HQ)',
  [UserRole.LOCATION_ADMIN]: 'Location Admin',
  [UserRole.DEPARTMENT_ADMIN]: 'Department Admin',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'FAAN Headquarters - Full system access across all airports',
  [UserRole.LOCATION_ADMIN]: 'Airport Manager - Access to one specific airport',
  [UserRole.DEPARTMENT_ADMIN]: 'Department Manager - Access to one department only',
};