'use client';

import { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Building2, 
  Shield, 
  ShieldCheck,
  ChevronDown,
  X,
  Eye
} from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { UserRole, ROLE_LABELS } from '@/types/rbac';

interface DemoRoleSwitcherProps {
  minimal?: boolean;
}

export default function DemoRoleSwitcher({ minimal = false }: DemoRoleSwitcherProps) {
  const { 
    currentRole, 
    currentLocation, 
    currentDepartment,
    locationName, 
    departmentName,
    switchRole,
    switchLocation,
    switchDepartment,
    availableLocations,
    availableDepartments
  } = useRole();

  const [isOpen, setIsOpen] = useState(!minimal);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return ShieldCheck;
      case UserRole.LOCATION_ADMIN:
        return Building2;
      case UserRole.DEPARTMENT_ADMIN:
        return Shield;
      default:
        return Users;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return '#92400e';
      case UserRole.LOCATION_ADMIN:
        return '#1e40af';
      case UserRole.DEPARTMENT_ADMIN:
        return '#475569';
      default:
        return '#64748b';
    }
  };

  if (!isOpen && minimal) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          backgroundColor: '#0f172a',
          border: 'none',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
        }}
      >
        <Eye size={20} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: minimal ? 'auto' : '20px',
        right: minimal ? '20px' : '20px',
        width: minimal ? 'auto' : '360px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        zIndex: 9999,
        overflow: 'hidden',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: '#0f172a',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Eye size={18} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Demo Role Switcher</span>
        </div>
        {minimal && (
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Role Selector */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Switch Role
          </label>
          <div style={{ position: 'relative', marginTop: '6px' }}>
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: '#1e293b',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(() => {
                  const Icon = getRoleIcon(currentRole);
                  return <Icon size={16} style={{ color: getRoleColor(currentRole) }} />;
                })()}
                {ROLE_LABELS[currentRole]}
              </span>
              <ChevronDown size={14} />
            </button>

            {roleDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  zIndex: 10,
                }}
              >
                {Object.values(UserRole).map((role) => {
                  const Icon = getRoleIcon(role);
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setRoleDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        background: currentRole === role ? '#f1f5f9' : 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#475569',
                        textAlign: 'left',
                      }}
                    >
                      <Icon size={16} style={{ color: getRoleColor(role) }} />
                      {ROLE_LABELS[role]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Location Selector - Show for Super Admin */}
        {(currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.LOCATION_ADMIN) && (
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {(currentRole === UserRole.SUPER_ADMIN ? 'Switch ' : '') + 'Location'}
            </label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <button
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: currentRole === UserRole.SUPER_ADMIN ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1e293b',
                  opacity: currentRole === UserRole.SUPER_ADMIN ? 1 : 0.6,
                }}
                disabled={currentRole !== UserRole.SUPER_ADMIN}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} style={{ color: '#157347' }} />
                  {locationName}
                </span>
                {currentRole === UserRole.SUPER_ADMIN && <ChevronDown size={14} />}
              </button>

              {locationDropdownOpen && currentRole === UserRole.SUPER_ADMIN && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    zIndex: 10,
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {availableLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        switchLocation(loc.id);
                        setLocationDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        background: locationName === loc.name ? '#f1f5f9' : 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#475569',
                        textAlign: 'left',
                      }}
                    >
                      <MapPin size={16} style={{ color: '#94a3b8' }} />
                      {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Scope Info */}
        <div
          style={{
            padding: '14px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Current View
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
            {currentRole === UserRole.SUPER_ADMIN && (
              <span>Super Admin (HQ) viewing <strong>ALL</strong> airports</span>
            )}
            {currentRole === UserRole.LOCATION_ADMIN && (
              <span>Location Admin viewing <strong>{locationName}</strong></span>
            )}
            {currentRole === UserRole.DEPARTMENT_ADMIN && (
              <span>
                {departmentName} @ <strong>{locationName}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}