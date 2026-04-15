'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { 
  UserRole, 
  User, 
  Permission, 
  PERMISSIONS, 
  ROLE_LABELS, 
  ROLE_DESCRIPTIONS 
} from '@/types/rbac';
import { MOCK_LOCATIONS, getLocationById, getLocationName } from '@/data/mockLocations';
import { MOCK_DEPARTMENTS, getDepartmentById, getDepartmentName, getDepartmentsByLocation } from '@/data/mockDepartments';

interface RoleContextType {
  currentUser: User | null;
  currentRole: UserRole;
  currentLocation: string | null;
  currentDepartment: string | null;
  permissions: Permission;
  roleLabel: string;
  roleDescription: string;
  locationName: string;
  departmentName: string;
  availableLocations: typeof MOCK_LOCATIONS;
  availableDepartments: typeof MOCK_DEPARTMENTS;
  switchRole: (role: UserRole) => void;
  switchLocation: (locationId: string) => void;
  switchDepartment: (departmentId: string) => void;
  checkPermission: (permission: keyof Permission) => boolean;
  hasAccessToLocation: (locationId: string) => boolean;
  hasAccessToDepartment: (departmentId: string) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const DEFAULT_SUPER_ADMIN_USER: User = {
  id: 'user-super-1',
  name: 'HQ Administrator',
  email: 'admin@faan.gov.ng',
  role: UserRole.SUPER_ADMIN,
};

const DEFAULT_LOCATION_ADMIN_USER: User = {
  id: 'user-loc-1',
  name: 'Airport Manager',
  email: 'lagos.admin@faan.gov.ng',
  role: UserRole.LOCATION_ADMIN,
  locationId: 'lagos',
};

const DEFAULT_DEPT_ADMIN_USER: User = {
  id: 'user-dept-1',
  name: 'Department Manager',
  email: 'security.dept@faan.gov.ng',
  role: UserRole.DEPARTMENT_ADMIN,
  locationId: 'abuja',
  departmentId: 'security',
};

interface RoleProviderProps {
  children: React.ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.SUPER_ADMIN);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [currentDepartment, setCurrentDepartment] = useState<string | null>(null);

  const permissions = useMemo(() => {
    return PERMISSIONS[currentRole];
  }, [currentRole]);

  const roleLabel = useMemo(() => {
    return ROLE_LABELS[currentRole];
  }, [currentRole]);

  const roleDescription = useMemo(() => {
    return ROLE_DESCRIPTIONS[currentRole];
  }, [currentRole]);

  const locationName = useMemo(() => {
    if (!currentLocation) return 'All Locations';
    return getLocationName(currentLocation);
  }, [currentLocation]);

  const departmentName = useMemo(() => {
    if (!currentDepartment) return 'All Departments';
    return getDepartmentName(currentDepartment);
  }, [currentDepartment]);

  const currentUser = useMemo(() => {
    const baseUser = currentRole === UserRole.SUPER_ADMIN 
      ? DEFAULT_SUPER_ADMIN_USER
      : currentRole === UserRole.LOCATION_ADMIN
        ? DEFAULT_LOCATION_ADMIN_USER
        : DEFAULT_DEPT_ADMIN_USER;
    
    return {
      ...baseUser,
      role: currentRole,
      locationId: currentLocation || undefined,
      departmentId: currentDepartment || undefined,
    };
  }, [currentRole, currentLocation, currentDepartment]);

  const availableLocations = useMemo(() => {
    if (currentRole === UserRole.SUPER_ADMIN) {
      return MOCK_LOCATIONS;
    }
    if (currentRole === UserRole.LOCATION_ADMIN && currentLocation) {
      return MOCK_LOCATIONS.filter(loc => loc.id === currentLocation);
    }
    return [];
  }, [currentRole, currentLocation]);

  const availableDepartments = useMemo(() => {
    if (currentRole === UserRole.SUPER_ADMIN) {
      return MOCK_DEPARTMENTS;
    }
    if (currentRole === UserRole.LOCATION_ADMIN && currentLocation) {
      return getDepartmentsByLocation(currentLocation);
    }
    if (currentRole === UserRole.DEPARTMENT_ADMIN && currentDepartment) {
      return MOCK_DEPARTMENTS.filter(dept => dept.id === currentDepartment);
    }
    return [];
  }, [currentRole, currentLocation, currentDepartment]);

  const switchRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    
    if (role === UserRole.SUPER_ADMIN) {
      setCurrentLocation(null);
      setCurrentDepartment(null);
    } else if (role === UserRole.LOCATION_ADMIN) {
      if (!currentLocation) {
        setCurrentLocation(MOCK_LOCATIONS[0].id);
      }
      setCurrentDepartment(null);
    } else if (role === UserRole.DEPARTMENT_ADMIN) {
      if (!currentLocation) {
        setCurrentLocation(MOCK_LOCATIONS[0].id);
      }
      if (!currentDepartment) {
        const depts = getDepartmentsByLocation(currentLocation || MOCK_LOCATIONS[0].id);
        setCurrentDepartment(depts[0]?.id || null);
      }
    }
  }, [currentLocation, currentDepartment]);

  const switchLocation = useCallback((locationId: string) => {
    if (!permissions.canSwitchLocations && currentRole !== UserRole.SUPER_ADMIN) {
      return;
    }
    setCurrentLocation(locationId);
    setCurrentDepartment(null);
  }, [permissions.canSwitchLocations, currentRole]);

  const switchDepartment = useCallback((departmentId: string) => {
    setCurrentDepartment(departmentId);
  }, []);

  const checkPermission = useCallback((permission: keyof Permission): boolean => {
    return permissions[permission];
  }, [permissions]);

  const hasAccessToLocation = useCallback((locationId: string): boolean => {
    if (currentRole === UserRole.SUPER_ADMIN) return true;
    if (currentRole === UserRole.LOCATION_ADMIN) return currentLocation === locationId;
    if (currentRole === UserRole.DEPARTMENT_ADMIN) return currentLocation === locationId;
    return false;
  }, [currentRole, currentLocation]);

  const hasAccessToDepartment = useCallback((departmentId: string): boolean => {
    if (currentRole === UserRole.SUPER_ADMIN) return true;
    if (currentRole === UserRole.LOCATION_ADMIN) {
      const dept = getDepartmentById(departmentId);
      return dept?.locationId === currentLocation;
    }
    if (currentRole === UserRole.DEPARTMENT_ADMIN) return currentDepartment === departmentId;
    return false;
  }, [currentRole, currentLocation, currentDepartment]);

  const canAccessRoute = useCallback((route: string): boolean => {
    const routePermissions: Record<string, (keyof Permission)[]> = {
      '/dashboard/locations': ['canViewAllLocations'],
      '/dashboard/departments': ['canViewAllDepartments', 'canManageAllDepartments'],
      '/dashboard/touchpoints': ['canViewAllDepartments'],
      '/dashboard/submissions': ['canViewAllSubmissions'],
      '/dashboard/issues': ['canViewAllIssues'],
      '/dashboard/analytics': ['canViewAllSubmissions', 'canViewAllIssues'],
      '/dashboard/settings': ['canManageStaff'],
    };

    const requiredPermissions = routePermissions[route];
    if (!requiredPermissions) return true;
    
    return requiredPermissions.some(perm => permissions[perm]);
  }, [permissions]);

  const value = useMemo(() => ({
    currentUser,
    currentRole,
    currentLocation,
    currentDepartment,
    permissions,
    roleLabel,
    roleDescription,
    locationName,
    departmentName,
    availableLocations,
    availableDepartments,
    switchRole,
    switchLocation,
    switchDepartment,
    checkPermission,
    hasAccessToLocation,
    hasAccessToDepartment,
    canAccessRoute,
  }), [
    currentUser,
    currentRole,
    currentLocation,
    currentDepartment,
    permissions,
    roleLabel,
    roleDescription,
    locationName,
    departmentName,
    availableLocations,
    availableDepartments,
    switchRole,
    switchLocation,
    switchDepartment,
    checkPermission,
    hasAccessToLocation,
    hasAccessToDepartment,
    canAccessRoute,
  ]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

export { RoleContext };