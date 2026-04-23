"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  X,
  ChevronLeft,
  ChevronRight
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


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
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
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

  // Build flat searchable list from nav items
  const allSearchablePages = useMemo(() => {
    const pages: { name: string; href: string; icon: any }[] = [];
    navItems.forEach(group => {
      group.items.forEach(item => {
        if (item.roles.includes(currentRole)) {
          pages.push({ name: item.name, href: item.href, icon: item.icon });
          if (item.subItems) {
            item.subItems.forEach(sub => {
              pages.push({ name: `${item.name} → ${sub.name}`, href: sub.href, icon: item.icon });
            });
          }
        }
      });
    });
    return pages;
  }, [currentRole]);

  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const term = globalSearch.toLowerCase().trim();
    return allSearchablePages.filter((p: { name: string; href: string }) => 
      p.name.toLowerCase().includes(term) || p.href.toLowerCase().includes(term)
    );
  }, [globalSearch, allSearchablePages]);

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
    <div className={`${styles.container} ${isSidebarCollapsed ? styles.collapsedSidebar : ""}`}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarHidden : ""}`}>
        <div className={styles.logoContainer}>
          {!isSidebarCollapsed ? (
            <Image 
              src="/Faan.logo_.png" 
              alt="FAAN Logo" 
              width={140} 
              height={50} 
              className={styles.sidebarLogo}
              priority
            />
          ) : (
            <div className={styles.logoMini}>
              <Image src="/Faan.logo_.png" alt="" width={32} height={32} />
            </div>
          )}
        </div>

        <nav className={styles.nav}>
          {filteredNav.map((group, groupIdx) => (
            <div key={group.group} className={styles.navGroup}>
              {!isSidebarCollapsed && (
                <div style={{ padding: '24px 16px 8px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const isExpanded = expandedMenus.includes(item.name);
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <div key={item.name} className={styles.navGroupItem}>
                    {hasSubItems && !isSidebarCollapsed ? (
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
                        title={isSidebarCollapsed ? item.name : ""}
                      >
                        <Icon size={20} />
                        {!isSidebarCollapsed && <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</span>}
                        {isActive && !isSidebarCollapsed && (
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
          <button onClick={handleLogout} className={styles.logoutButton} title={isSidebarCollapsed ? "Logout" : ""}>
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${styles.mainWrapper} ${isSidebarCollapsed ? styles.mainExpanded : ""}`}>
        <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.sidebarToggle}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }} ref={searchRef}>
              <div className={styles.searchBar}>
                <Search size={18} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search pages... (Ctrl+K)" 
                  className={styles.searchInput}
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setIsSearchOpen(true);
                    setSearchHighlight(0);
                  }}
                  onFocus={() => { if (globalSearch.trim()) setIsSearchOpen(true); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false);
                      (e.target as HTMLInputElement).blur();
                    }
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSearchHighlight(prev => Math.min(prev + 1, searchResults.length - 1));
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSearchHighlight(prev => Math.max(prev - 1, 0));
                    }
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      e.preventDefault();
                      const result = searchResults[searchHighlight];
                      if (result) {
                        router.push(result.href);
                        setGlobalSearch('');
                        setIsSearchOpen(false);
                        (e.target as HTMLInputElement).blur();
                      }
                    }
                  }}
                  ref={searchInputRef}
                />
                {globalSearch && (
                  <button 
                    onClick={() => { setGlobalSearch(''); setIsSearchOpen(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isSearchOpen && globalSearch.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 12px 32px -4px rgba(0,0,0,0.12), 0 4px 12px -2px rgba(0,0,0,0.06)',
                      overflow: 'hidden',
                      zIndex: 100
                    }}
                  >
                    {searchResults.length > 0 ? (
                      <div style={{ padding: '6px', maxHeight: '340px', overflowY: 'auto' }}>
                        <div style={{ padding: '8px 12px 6px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Pages — {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                        </div>
                        {searchResults.map((result, idx) => {
                          const Icon = result.icon;
                          return (
                            <div
                              key={result.href}
                              onClick={() => {
                                router.push(result.href);
                                setGlobalSearch('');
                                setIsSearchOpen(false);
                              }}
                              onMouseEnter={() => setSearchHighlight(idx)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                background: searchHighlight === idx ? '#f1f5f9' : 'transparent',
                                transition: 'background 0.15s',
                                color: searchHighlight === idx ? 'var(--brand-green)' : '#475569'
                              }}
                            >
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: searchHighlight === idx ? 'rgba(21,115,71,0.08)' : '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <Icon size={16} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600 }}>{result.name}</span>
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{result.href}</span>
                              </div>
                              {searchHighlight === idx && (
                                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>↵</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                        <Search size={20} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                        <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>No pages match "{globalSearch}"</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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

            <div className={styles.userProfile} ref={profileRef}>
              <div 
                className={styles.userProfileButton} 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{currentUser?.name || "Loading..."}</span>
                  <span className={styles.userRole}>{roleLabel}</span>
                </div>
                <div className={styles.userAvatar}>
                  <User size={20} />
                </div>
              </div>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={styles.userDropdown}
                  >
                    <div className={styles.userDropdownHeader}>
                      <span className={styles.userName}>{currentUser?.name || "User"}</span>
                      <span className={styles.userRole}>{currentUser?.email || "user@example.com"}</span>
                    </div>
                    <div className={styles.userDropdownOptions}>
                      <Link 
                        href="/dashboard/settings" 
                        className={styles.userDropdownItem}
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <div className={styles.userDropdownDivider} />
                      <button 
                        className={`${styles.userDropdownItem} ${styles.userDropdownItemDanger}`}
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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