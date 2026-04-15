'use client';

import React from 'react';
import { UserRole } from '@/types/rbac';
import { useRole } from '@/context/RoleContext';
import AccessDenied from './AccessDenied';

interface RoleGuardProps {
  allowedRoles?: UserRole[];
  requiredPermission?: keyof ReturnType<typeof useRole>['permissions'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

export default function RoleGuard({ 
  allowedRoles, 
  requiredPermission,
  children, 
  fallback,
  showAccessDenied = true 
}: RoleGuardProps) {
  const { currentRole, permissions, canAccessRoute } = useRole();

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    if (fallback) return <>{fallback}</>;
    if (showAccessDenied) return <AccessDenied />;
    return null;
  }

  if (requiredPermission && !permissions[requiredPermission]) {
    if (fallback) return <>{fallback}</>;
    if (showAccessDenied) return <AccessDenied />;
    return null;
  }

  return <>{children}</>;
}