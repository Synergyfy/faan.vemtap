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
import { useProfile } from '@/hooks/useAuth';
import { useAuthContext } from '@/context/AuthContext';
import { useLocations } from '@/hooks/useLocations';
import { useDepartments } from '@/hooks/useDepartments';
import { Location, Department } from '@/types/api';

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
  availableLocations: Location[];
  availableDepartments: Department[];
  isLoading: boolean;
  switchRole: (role: UserRole) => void;
  switchLocation: (locationId: string | null) => void;
  switchDepartment: (departmentId: string) => void;
  checkPermission: (permission: keyof Permission) => boolean;
  hasAccessToLocation: (locationId: string) => boolean;
  hasAccessToDepartment: (departmentId: string) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: React.ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const { isAuthenticated } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: locationsData, isLoading: locationsLoading } = useLocations(undefined, { enabled: isAuthenticated });
  const { data: deptsData, isLoading: deptsLoading } = useDepartments(undefined, { enabled: isAuthenticated });

  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.SUPER_ADMIN);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [currentDepartment, setCurrentDepartment] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Sync profile to current role/loc/dept on first load
  useEffect(() => {
    if (profile && !hasInitialized) {
      setCurrentRole(profile.role as unknown as UserRole);
      
      // Derive location prioritizing direct locationId (for Location Admins)
      if (profile.locationId) {
        setCurrentLocation(profile.locationId);
      } else if (profile.department?.location?.id) {
        // Fallback for Department Admins
        setCurrentLocation(profile.department.location.id);
      } else if (profile.departmentId) {
        // Fallback if department object isn't fully expanded
        setCurrentLocation(null); 
      }
      
      setCurrentDepartment(profile.departmentId);
      setHasInitialized(true);
    }
  }, [profile, hasInitialized]);

  const permissions = useMemo(() => {
    return PERMISSIONS[currentRole];
  }, [currentRole]);

  const roleLabel = useMemo(() => {
    return ROLE_LABELS[currentRole];
  }, [currentRole]);

  const roleDescription = useMemo(() => {
    return ROLE_DESCRIPTIONS[currentRole];
  }, [currentRole]);

  const availableLocations = useMemo(() => {
    const locations = locationsData?.data || [];
    if (currentRole === UserRole.SUPER_ADMIN) {
      return locations;
    }
    if (currentRole === UserRole.LOCATION_ADMIN && currentLocation) {
      return locations.filter((loc: Location) => loc.id === currentLocation);
    }
    if (currentRole === UserRole.DEPARTMENT_ADMIN && currentLocation) {
      return locations.filter((loc: Location) => loc.id === currentLocation);
    }
    return [];
  }, [currentRole, currentLocation, locationsData]);

  const availableDepartments = useMemo(() => {
    const depts = deptsData?.data || [];
    if (currentRole === UserRole.SUPER_ADMIN) {
      return depts;
    }
    if (currentRole === UserRole.LOCATION_ADMIN && currentLocation) {
      return depts.filter((dept: Department) => dept.locationId === currentLocation);
    }
    if (currentRole === UserRole.DEPARTMENT_ADMIN && currentDepartment) {
      return depts.filter((dept: Department) => dept.id === currentDepartment);
    }
    return [];
  }, [currentRole, currentLocation, currentDepartment, deptsData]);

  const locationName = useMemo(() => {
    if (!currentLocation) return 'All Locations';
    const loc = (locationsData?.data || []).find((l: Location) => l.id === currentLocation);
    return loc ? loc.name : 'Unknown Location';
  }, [currentLocation, locationsData]);

  const departmentName = useMemo(() => {
    if (!currentDepartment) return 'All Departments';
    const dept = (deptsData?.data || []).find((d: Department) => d.id === currentDepartment);
    return dept ? dept.name : 'Unknown Department';
  }, [currentDepartment, deptsData]);

  const currentUser = useMemo((): User | null => {
    if (!profile) return null;
    
    return {
      id: profile.id,
      name: `${profile.firstName} ${profile.lastName}`,
      email: profile.email,
      role: currentRole,
      locationId: currentLocation || undefined,
      departmentId: currentDepartment || undefined,
    };
  }, [profile, currentRole, currentLocation, currentDepartment]);

  const switchRole = useCallback((role: UserRole) => {
    setCurrentRole(prevRole => {
      // If role hasn't changed, don't do anything that might trigger downstream resets
      if (prevRole === role) return prevRole;
      
      // If switching to Super Admin, we clear location/department filters
      if (role === UserRole.SUPER_ADMIN) {
        setCurrentLocation(null);
        setCurrentDepartment(null);
      } else if (role === UserRole.LOCATION_ADMIN) {
        // For Location Admin, try to default to the first available location if none set
        setCurrentLocation(prevLoc => {
          if (!prevLoc && locationsData?.data?.length) {
            return locationsData.data[0].id;
          }
          return prevLoc;
        });
        setCurrentDepartment(null);
      } else if (role === UserRole.DEPARTMENT_ADMIN) {
        // For Department Admin, ensure a location and department are set
        setCurrentLocation(prevLoc => {
          const locId = prevLoc || locationsData?.data?.[0]?.id || null;
          
          setCurrentDepartment(prevDept => {
            if (!prevDept && deptsData?.data?.length) {
              const firstLocDepts = deptsData.data.filter((d: Department) => d.locationId === locId);
              return firstLocDepts[0]?.id || null;
            }
            return prevDept;
          });
          
          return locId;
        });
      }
      
      return role;
    });
  }, [locationsData, deptsData]);


  const switchLocation = useCallback((locationId: string | null) => {
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
    return currentLocation === locationId;
  }, [currentRole, currentLocation]);

  const hasAccessToDepartment = useCallback((departmentId: string): boolean => {
    if (currentRole === UserRole.SUPER_ADMIN) return true;
    if (currentRole === UserRole.LOCATION_ADMIN) {
      const dept = (deptsData?.data || []).find((d: Department) => d.id === departmentId);
      return dept?.locationId === currentLocation;
    }
    return currentDepartment === departmentId;
  }, [currentRole, currentLocation, currentDepartment, deptsData]);

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
    isLoading: profileLoading || locationsLoading || deptsLoading,
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
    profileLoading,
    locationsLoading,
    deptsLoading,
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