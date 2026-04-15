'use client';

import React from 'react';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import styles from '../../app/(dashboard)/Dashboard.module.css';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

export default function AccessDenied({ 
  title = 'Access Denied',
  message = 'You do not have permission to view this page.',
  showBackButton = true
}: AccessDeniedProps) {
  const router = useRouter();
  const { currentRole, roleLabel, locationName, departmentName } = useRole();

  return (
    <div className={styles.accessDeniedContainer}>
      <div className={styles.accessDeniedCard}>
        <div className={styles.accessDeniedIcon}>
          <ShieldX size={64} strokeWidth={1.5} />
        </div>
        
        <h1 className={styles.accessDeniedTitle}>{title}</h1>
        <p className={styles.accessDeniedMessage}>{message}</p>
        
        <div className={styles.accessDeniedInfo}>
          <div className={styles.accessDeniedRole}>
            <span className={styles.accessDeniedLabel}>Current Role:</span>
            <span className={styles.accessDeniedValue}>{roleLabel}</span>
          </div>
          <div className={styles.accessDeniedScope}>
            <span className={styles.accessDeniedLabel}>Scope:</span>
            <span className={styles.accessDeniedValue}>
              {currentRole === 'SUPER_ADMIN' 
                ? 'All Locations' 
                : currentRole === 'LOCATION_ADMIN'
                  ? locationName
                  : `${departmentName} (${locationName})`}
            </span>
          </div>
        </div>

        <div className={styles.accessDeniedHint}>
          <p>
            {currentRole === 'DEPARTMENT_ADMIN' 
              ? 'This feature is only available to Location Administrators and Super Admins.'
              : 'This feature is only available to Super Administrators.'}
          </p>
        </div>

        {showBackButton && (
          <div className={styles.accessDeniedActions}>
            <button 
              className={styles.accessDeniedBackBtn}
              onClick={() => router.back()}
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
            <button 
              className={styles.accessDeniedHomeBtn}
              onClick={() => router.push('/dashboard')}
            >
              <Home size={18} />
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}