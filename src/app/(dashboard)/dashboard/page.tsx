"use client";

import { 
  Users, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Star, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import styles from "../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { UserRole } from "@/types/rbac";
import { useAnalyticsSummary } from "@/hooks/useAnalytics";
import { useMemo } from "react";

export default function DashboardPage() {
  const { currentRole, locationName, departmentName, currentLocation, currentDepartment } = useRole();
  
  const { data: summary, isLoading } = useAnalyticsSummary({
    locationId: currentLocation,
    departmentId: currentDepartment
  });

  const kpis = useMemo(() => {
    if (!summary) return [];

    const base = [
      { label: "Total Engagement", value: summary.totalSubmissions.toLocaleString(), change: "+0%", trendingUp: true, icon: Users, color: "#157347" },
      { label: "Feedback Received", value: summary.feedbacks.toLocaleString(), change: "+0%", trendingUp: true, icon: MessageSquare, color: "#2563eb" },
      { label: "Open Issues", value: summary.openSubmissions.toLocaleString(), change: "-0%", trendingUp: false, icon: AlertCircle, color: "#f59e0b" },
      { label: "Resolved Issues", value: summary.resolvedSubmissions.toLocaleString(), change: "+0%", trendingUp: true, icon: CheckCircle2, color: "#10b981" },
    ];

    if (currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.LOCATION_ADMIN) {
      base.push({ label: "Avg. Satisfaction", value: summary.averageRating?.toFixed(1) || "0.0", change: "+0.0", trendingUp: true, icon: Star, color: "#8b5cf6" });
      base.push({ label: "Response Time", value: "12m", change: "-0m", trendingUp: false, icon: Clock, color: "#6366f1" });
    }

    return base;
  }, [summary, currentRole]);
  
  const getPageTitle = () => {
    if (currentRole === UserRole.SUPER_ADMIN) return "HQ Dashboard Overview";
    if (currentRole === UserRole.LOCATION_ADMIN) return `${locationName} Dashboard`;
    return `${departmentName} Dashboard`;
  };
  
  const getPageSubtitle = () => {
    if (currentRole === UserRole.SUPER_ADMIN) return "Real-time metrics across all FAAN airports.";
    if (currentRole === UserRole.LOCATION_ADMIN) return `Real-time metrics for ${locationName}.`;
    return `Real-time metrics for ${departmentName} department.`;
  };
  
  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>{getPageTitle()}</h2>
          <p className={styles.pageSubtitle}>{getPageSubtitle()}</p>
        </div>
        <div className={styles.datePicker}>
          <span>Last 7 Days</span>
        </div>
      </div>

      {/* KPI Section */}
      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ color: kpi.color, backgroundColor: `${kpi.color}15` }}>
                  <Icon size={24} />
                </div>
                <div className={`${styles.kpiBadge} ${kpi.trendingUp ? styles.badgeSuccess : styles.badgeDanger}`}>
                  {kpi.trendingUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{kpi.change}</span>
                </div>
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiValue}>{kpi.value}</h3>
                <p className={styles.kpiLabel}>{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Feedback Trend</h3>
            <button className={styles.moreButton}><MoreVertical size={20} /></button>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={FEEDBACK_TREND}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "none", 
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="feedback" 
                  stroke="#157347" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#157347", strokeWidth: 2, stroke: "#fff" }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Issue Categories</h3>
            <button className={styles.moreButton}><MoreVertical size={20} /></button>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ISSUE_CATEGORIES}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {ISSUE_CATEGORIES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className={styles.activityCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Recent Activity Feed</h3>
          <button className={styles.viewAll}>View All</button>
        </div>
        <div className={styles.activityList}>
          {ACTIVITIES.map((activity) => (
            <div key={activity.id} className={styles.activityItem}>
              <div className={styles.activityBullet} />
              <div className={styles.activityContent}>
                <p className={styles.activityText}>{activity.text}</p>
                <span className={styles.activityTime}>{activity.time}</span>
              </div>
              <div className={`${styles.statusBadge} ${styles[activity.status.toLowerCase().replace(" ", "")]}`}>
                {activity.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
