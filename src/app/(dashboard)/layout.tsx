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
  User
} from "lucide-react";
import styles from "./Dashboard.module.css";
import Image from "next/image";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MapPin, label: "Locations", href: "/dashboard/locations" },
  { icon: MousePointer2, label: "Touchpoints", href: "/dashboard/touchpoints" },
  { icon: Inbox, label: "Submissions", href: "/dashboard/submissions" },
  { icon: AlertCircle, label: "Issue Management", href: "/dashboard/issues" },
  { icon: Users, label: "Departments", href: "/dashboard/departments" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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

        <nav className={styles.nav}>
          {MENU_ITEMS.map((item) => {
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
          <button className={styles.logoutButton}>
            <LogOut size={20} />
            <span>Logout</span>
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
          </div>
          <div className={styles.headerRight}>
            <button className={styles.iconButton}>
              <Bell size={20} />
              <span className={styles.badge}></span>
            </button>
            <div className={styles.userProfile}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>Admin User</span>
                <span className={styles.userRole}>System Administrator</span>
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
    </div>
  );
}
