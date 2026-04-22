"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { 
  LayoutDashboard, 
  FileStack, 
  AlertCircle, 
  ClipboardList, 
  FileText, 
  MapPin, 
  Building2, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  User,
  ChevronDown,
  LayoutTemplate,
  BarChart3,
  QrCode,
  FileBarChart,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { useAuthContext } from "@/context/AuthContext";
import { UserRole } from "@/types/rbac";
import { toast } from "sonner";
import NotificationDropdown from "@/components/displays/NotificationDropdown";



function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { 
    currentUser, 
    currentRole, 
    roleLabel, 
    locationName, 
    departmentName, 
    isLoading,
    availableLocations,
    currentLocation,
    switchLocation 
  } = useRole();
  const { logout: authLogout } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    authLogout();
    toast.success("Logged out successfully");
  };

  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Reports"]);

  const navItems = [
    { 
      group: "Menu",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN, UserRole.DEPARTMENT_ADMIN] },
        { name: "Locations", icon: MapPin, href: "/dashboard/locations", roles: [UserRole.SUPER_ADMIN] },
        { name: "Departments", icon: Building2, href: "/dashboard/departments", roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
        { name: "Forms", icon: ClipboardList, href: "/dashboard/forms", roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
        { name: "Touchpoints", icon: QrCode, href: "/dashboard/touchpoints", roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
        { name: "Submissions", icon: FileStack, href: "/dashboard/submissions", roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
        { name: "Issue Management", icon: AlertCircle, href: "/dashboard/issues", roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
        { name: "Internal Reports", icon: FileText, href: "/dashboard/reports", roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN, UserRole.DEPARTMENT_ADMIN] },
        { 
          name: "Reports", 
          icon: LayoutTemplate, 
          href: "/dashboard/summary-reports", 
          roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN],
          subItems: [
            { name: "General", href: "/dashboard/summary-reports?category=GENERAL" },
            { name: "Internal", href: "/dashboard/summary-reports?category=INTERNAL" },
          ]
        },
        { name: "Analytics", icon: BarChart3, href: "/dashboard/analytics", roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
        { name: "Settings", icon: Settings, href: "/dashboard/settings", roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN, UserRole.DEPARTMENT_ADMIN] },
      ]
    }
  ];

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => 
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const filteredNav = navItems.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(currentRole))
  })).filter(group => group.items.length > 0);

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <Image 
            src="/Faan.logo_.png" 
            alt="FAAN Logo" 
            width={140} 
            height={50} 
            className={styles.sidebarLogo}
            priority
          />
        </div>

        <nav className={styles.nav}>
          {filteredNav.map((group, groupIdx) => (
            <div key={group.group} className={styles.navGroup}>
              <div style={{ padding: '24px 16px 8px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {group.group}
              </div>
              {group.items.map((item) => {
                const isExpanded = expandedMenus.includes(item.name);
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <div key={item.name} className={styles.navGroupItem}>
                    {hasSubItems ? (
                      <>
                        <button 
                          onClick={() => toggleMenu(item.name)}
                          className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          <Icon size={20} />
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</span>
                          <ChevronDown 
                            size={16} 
                            className={`${styles.subMenuChevron} ${isExpanded ? styles.chevronRotated : ""}`} 
                          />
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className={styles.subMenu}
                            >
                              {item.subItems?.map(sub => {
                                const subUrl = new URL(sub.href, 'http://localhost');
                                const subCategory = subUrl.searchParams.get('category');
                                const currentCategory = searchParams.get('category');
                                const isSubActive = pathname === subUrl.pathname && currentCategory === subCategory;
                                
                                return (
                                  <Link 
                                    key={sub.href} 
                                    href={sub.href}
                                    className={`${styles.subNavItem} ${isSubActive ? styles.subNavItemActive : ""}`}
                                  >
                                    <div className={styles.subMenuDot} />
                                    {sub.name}
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link 
                        href={item.href} 
                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                      >
                        <Icon size={20} />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</span>
                        {isActive && (
                          <motion.div 
                            layoutId="navActive"
                            className={styles.activeIndicator}
                          />
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainWrapper}>
        <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}>
          <div className={styles.headerLeft}>
            <div className={styles.searchBar}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search everything..." 
                className={styles.searchInput}
              />
            </div>

            {currentRole === UserRole.SUPER_ADMIN && (
              <div className={styles.locationSwitcher} ref={locationRef}>
                <button 
                  className={`${styles.locationButton} ${isLocationOpen ? styles.locationButtonActive : ""}`}
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                >
                  <MapPin size={18} className={styles.locationIcon} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{locationName}</span>
                  <ChevronDown 
                    size={16} 
                    className={`${styles.chevronIcon} ${isLocationOpen ? styles.chevronIconRotated : ""}`} 
                  />
                </button>

                <AnimatePresence>
                  {isLocationOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={styles.locationDropdown}
                    >
                      <div className={styles.locationDropdownHeader}>
                        <h4>Select Context</h4>
                      </div>
                      <div className={styles.locationOptions}>
                        <div 
                          className={`${styles.locationOption} ${currentLocation === null ? styles.locationOptionActive : ""}`}
                          onClick={() => {
                            switchLocation(null);
                            setIsLocationOpen(false);
                          }}
                        >
                          <div className={styles.locationOptionDot} />
                          All Locations (Global)
                        </div>
                        
                        {(availableLocations || []).map((loc: any) => (
                          <div 
                            key={loc.id}
                            className={`${styles.locationOption} ${currentLocation === loc.id ? styles.locationOptionActive : ""}`}
                            onClick={() => {
                              switchLocation(loc.id);
                              setIsLocationOpen(false);
                            }}
                          >
                            <div className={styles.locationOptionDot} />
                            {loc.name}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className={styles.headerRight}>
            <div className={styles.notificationWrapper} ref={notificationRef}>
              <button 
                className={styles.iconButton} 
                aria-label="Notifications"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell size={20} />
                <span className={styles.badge} />
              </button>
              {isNotificationsOpen && (
                <NotificationDropdown onClose={() => setIsNotificationsOpen(false)} />
              )}
            </div>

            <div className={styles.userProfile}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{currentUser?.name || "Loading..."}</span>
                <span className={styles.userRole}>{roleLabel}</span>
              </div>
              <div className={styles.userAvatar}>
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.mobileBackdrop}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Loading dashboard environment...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </React.Suspense>
  );
}