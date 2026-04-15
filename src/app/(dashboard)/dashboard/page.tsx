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

const SUPER_ADMIN_KPIS = [
  { label: "Total Interactions (All Airports)", value: "2,450", change: "+12.5%", trendingUp: true, icon: Users, color: "#157347" },
  { label: "Total Feedback Received", value: "1,280", change: "+8.2%", trendingUp: true, icon: MessageSquare, color: "#2563eb" },
  { label: "Open Issues", value: "42", change: "-4.3%", trendingUp: false, icon: AlertCircle, color: "#f59e0b" },
  { label: "Resolved Issues", value: "156", change: "+21.0%", trendingUp: true, icon: CheckCircle2, color: "#10b981" },
  { label: "Average Satisfaction Score", value: "4.8", change: "+0.2", trendingUp: true, icon: Star, color: "#8b5cf6" },
  { label: "Average Response Time", value: "12m", change: "-2m", trendingUp: false, icon: Clock, color: "#6366f1" },
];

const LOCATION_ADMIN_KPIS = [
  { label: "Interactions (This Airport)", value: "892", change: "+9.3%", trendingUp: true, icon: Users, color: "#157347" },
  { label: "Feedback Received", value: "445", change: "+6.1%", trendingUp: true, icon: MessageSquare, color: "#2563eb" },
  { label: "Open Issues", value: "18", change: "-2.1%", trendingUp: false, icon: AlertCircle, color: "#f59e0b" },
  { label: "Resolved Issues", value: "67", change: "+15.2%", trendingUp: true, icon: CheckCircle2, color: "#10b981" },
  { label: "Airport Satisfaction", value: "4.6", change: "+0.1", trendingUp: true, icon: Star, color: "#8b5cf6" },
  { label: "Avg Response Time", value: "10m", change: "-3m", trendingUp: false, icon: Clock, color: "#6366f1" },
];

const DEPARTMENT_ADMIN_KPIS = [
  { label: "My Dept Issues", value: "12", change: "+3", trendingUp: true, icon: AlertCircle, color: "#f59e0b" },
  { label: "Pending Items", value: "8", change: "-2", trendingUp: false, icon: Clock, color: "#6366f1" },
  { label: "Resolved Today", value: "4", change: "+1", trendingUp: true, icon: CheckCircle2, color: "#10b981" },
  { label: "Dept Satisfaction", value: "4.5", change: "+0.2", trendingUp: true, icon: Star, color: "#8b5cf6" },
];

const FEEDBACK_TREND = [
  { day: "Mon", feedback: 400 },
  { day: "Tue", feedback: 300 },
  { day: "Wed", feedback: 600 },
  { day: "Thu", feedback: 800 },
  { day: "Fri", feedback: 500 },
  { day: "Sat", feedback: 900 },
  { day: "Sun", feedback: 700 },
];

const ISSUE_CATEGORIES = [
  { name: "Cleanliness", value: 400, color: "#157347" },
  { name: "Staff", value: 300, color: "#2563eb" },
  { name: "Security", value: 200, color: "#f59e0b" },
  { name: "Facilities", value: 278, color: "#ef4444" },
];

const ACTIVITIES = [
  { id: 1, type: "complaint", text: "Complaint submitted – Terminal 2 Restroom", time: "5 mins ago", status: "Open" },
  { id: 2, type: "feedback", text: "Feedback received – Departure Gate A", time: "12 mins ago", status: "Neutral" },
  { id: 3, type: "resolved", text: "Issue resolved – Baggage Area", time: "45 mins ago", status: "Resolved" },
  { id: 4, type: "complaint", text: "Security concern reported – Check-in Counter 4", time: "1 hour ago", status: "In Progress" },
];

export default function DashboardPage() {
  const { currentRole, roleLabel, locationName, departmentName } = useRole();
  
  const getKPIs = () => {
    if (currentRole === UserRole.SUPER_ADMIN) return SUPER_ADMIN_KPIS;
    if (currentRole === UserRole.LOCATION_ADMIN) return LOCATION_ADMIN_KPIS;
    return DEPARTMENT_ADMIN_KPIS;
  };
  
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
  
  const kpis = getKPIs();
  
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
