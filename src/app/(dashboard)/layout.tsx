"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MapPin, 
  MousePointer2, 
  Inbox, 
  AlertCircle, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Bell,
  Search,
  User,
  ChevronDown,
  Building2,
  ShieldCheck,
  Eye,
  FileText,
  FileStack
} from "lucide-react";
import styles from "./Dashboard.module.css";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import { UserRole } from "@/types/rbac";
import DemoRoleSwitcher from "@/components/debug/DemoRoleSwitcher";
import { useProfile, useLogout } from "@/hooks/useAuth";

interface MenuItem {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  href: string;
  allowedRoles?: UserRole[];
  requiredPermission?: keyof ReturnType<typeof useRole>['permissions'];
}

const MENU_ITEMS: MenuItem[] = [
  { 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    href: "/dashboard",
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN, UserRole.DEPARTMENT_ADMIN]
  },
  { 
    icon: MapPin, 
    label: "Locations", 
    href: "/dashboard/locations",
    allowedRoles: [UserRole.SUPER_ADMIN],
    requiredPermission: "canViewAllLocations"
  },
  { 
    icon: Users, 
    label: "Departments", 
    href: "/dashboard/departments",
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN],
    requiredPermission: "canManageAllDepartments"
  },
  { 
    icon: FileStack, 
    label: "Forms", 
    href: "/dashboard/forms",
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN]
  },
  { 
    icon: MousePointer2, 
    label: "Touchpoints", 
    href: "/dashboard/touchpoints",
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN]
  },
  { 
    icon: Inbox, 
    label: "Submissions", 
    href: "/dashboard/submissions",
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN, UserRole.DEPARTMENT_ADMIN]
  },
  { 
    icon: AlertCircle, 
    label: "Issue Management", 
    href: "/dashboard/issues",
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN, UserRole.DEPARTMENT_ADMIN]
  },
  { 
    icon: FileText, 
    label: "Internal Reports", 
    href: "/dashboard/reports",
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN, UserRole.DEPARTMENT_ADMIN]
  },
  { 
    icon: BarChart3, 
    label: "Analytics", 
    href: "/dashboard/analytics",
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN, UserRole.DEPARTMENT_ADMIN]
  },
  { 
    icon: Settings, 
    label: "Settings", 
    href: "/dashboard/settings",
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN, UserRole.DEPARTMENT_ADMIN]
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { 
    currentRole, 
    currentUser,
    roleLabel,
    locationName,
    departmentName,
    permissions,
    availableLocations,
    switchLocation,
    switchRole
  } = useRole();
  
  const { data: profile } = useProfile();
  const logoutMutation = useLogout();
  
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Sync real profile role to mock switcher on initial load
  useEffect(() => {
    if (profile?.role) {
      switchRole(profile.role as any);
    }
  }, [profile?.role, switchRole]);

  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    if (!item.allowedRoles.includes(currentRole)) return false;
    if (item.requiredPermission && !permissions[item.requiredPermission]) return false;
    return true;
  });

  const getRoleDisplayName = () => {
    if (currentRole === UserRole.SUPER_ADMIN) {
      return `Super Admin • ${locationName}`;
    }
    if (currentRole === UserRole.LOCATION_ADMIN) {
      return `Location Admin • ${locationName}`;
    }
    return `${departmentName} • ${locationName}`;
  };

  const getRoleBadgeColor = () => {
    if (currentRole === UserRole.SUPER_ADMIN) return styles.roleBadgeSuper;
    if (currentRole === UserRole.LOCATION_ADMIN) return styles.roleBadgeLocation;
    return styles.roleBadgeDepartment;
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <Image
            src="/Faan.logo_.png"
            alt="FAAN Logo"
            width={120}
            height={60}
            className={styles.sidebarLogo}
          />
        </div>

        <div className={styles.roleIndicator}>
          <div className={`${styles.roleBadge} ${getRoleBadgeColor()}`}>
            {currentRole === UserRole.SUPER_ADMIN && <ShieldCheck size={14} />}
            {currentRole === UserRole.LOCATION_ADMIN && <Building2 size={14} />}
            {currentRole === UserRole.DEPARTMENT_ADMIN && <User size={14} />}
            <span>{roleLabel}</span>
          </div>
          {(currentRole === UserRole.LOCATION_ADMIN || currentRole === UserRole.DEPARTMENT_ADMIN) && (
            <span className={styles.roleScope}>{locationName}</span>
          )}
        </div>
        
        <div style={{ padding: '0 16px 16px 16px' }}>
          <button 
            onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: 0.9,
            }}
          >
            <Eye size={12} />
            Switch Role (Demo)
          </button>
        </div>

        <nav className={styles.nav}>
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button 
            className={styles.logoutButton} 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut size={20} />
            <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.searchBar}>
              <Search size={18} className={styles.searchIcon} />
              <input type="text" placeholder="Search anything..." className={styles.searchInput} />
            </div>
            
            {/* Location Switcher for Super Admin */}
            {permissions.canSwitchLocations && (
              <div className={styles.locationSwitcher}>
                <button 
                  className={styles.locationSwitcherBtn}
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                >
                  <MapPin size={16} />
                  <span>{locationName}</span>
                  <ChevronDown size={14} className={locationDropdownOpen ? styles.chevronUp : ""} />
                </button>
                {locationDropdownOpen && (
                  <div className={styles.locationDropdown}>
                    <div className={styles.dropdownHeader}>All Locations</div>
                    {availableLocations.map((loc) => (
                      <button
                        key={loc.id}
                        className={`${styles.dropdownItem} ${locationName === loc.name ? styles.dropdownItemActive : ""}`}
                        onClick={() => {
                          switchLocation(loc.id);
                          setLocationDropdownOpen(false);
                        }}
                      >
                        <MapPin size={14} />
                        <span>{loc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={styles.headerRight}>
            <button className={styles.iconButton}>
              <Bell size={20} />
              <span className={styles.badge}></span>
            </button>
            <div className={styles.userProfile}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{profile ? `${profile.firstName} ${profile.lastName}` : 'Loading...'}</span>
                <span className={styles.userRole}>{getRoleDisplayName()}</span>
              </div>
              <div className={styles.userAvatar}>
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>

      <DemoRoleSwitcher />
    </div>
  );
}
