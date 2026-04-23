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
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { 
  useAnalyticsSummary, 
  useActivityFeed, 
  useAnalyticsDistribution, 
  useSatisfactionTrend 
} from "@/hooks/useAnalytics";
import { useMemo, useState, useRef, useEffect } from "react";

const CATEGORY_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#6366f1"];

function formatTimeAgo(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { currentRole, locationName, departmentName, currentLocation, currentDepartment } = useRole();
  const params = {
    locationId: currentLocation,
    departmentId: currentDepartment
  };

  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState("Last 7 Days");
  const dateFilterRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setIsDateFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dateFilters = ["Last 7 Days", "1 Month", "3 Months", "6 Months"];

  const { data: summary, isLoading: isSummaryLoading } = useAnalyticsSummary(params);
  const { data: activityData, isLoading: isActivityLoading } = useActivityFeed(params);
  const { data: distribution, isLoading: isDistributionLoading } = useAnalyticsDistribution(params);
  const { data: trendData, isLoading: isTrendLoading } = useSatisfactionTrend(params);

  const kpis = useMemo(() => {
    if (!summary) return [];

    const formatGrowth = (val: number) => {
      const sign = val >= 0 ? "+" : "";
      return `${sign}${val}%`;
    };

    const base = [
      { 
        label: "Total Engagement", 
        value: (summary.totalSubmissions + summary.totalIssues).toLocaleString(), 
        change: formatGrowth(summary.totalIssuesGrowth), 
        trendingUp: summary.totalIssuesGrowth >= 0, 
        icon: Users, 
        color: "#157347" 
      },
      { 
        label: "Issues Logged", 
        value: summary.totalIssues.toLocaleString(), 
        change: formatGrowth(summary.totalIssuesGrowth), 
        trendingUp: true, 
        icon: AlertCircle, 
        color: "#2563eb" 
      },
      { 
        label: "Open Issues", 
        value: (summary.pendingIssues + summary.inProgressIssues).toLocaleString(), 
        change: "Active", 
        trendingUp: summary.inProgressIssues > 0, 
        icon: MessageSquare, 
        color: "#f59e0b" 
      },
      { 
        label: "Resolved Issues", 
        value: (summary.resolvedIssues + summary.closedIssues).toLocaleString(), 
        change: formatGrowth(summary.resolvedIssuesGrowth), 
        trendingUp: summary.resolvedIssuesGrowth >= 0, 
        icon: CheckCircle2, 
        color: "#10b981" 
      },
    ];

    if (currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.LOCATION_ADMIN) {
      base.push({ 
        label: "Avg. Satisfaction", 
        value: summary.averageRating?.toFixed(1) || "0.0", 
        change: `${summary.averageRatingGrowth >= 0 ? "+" : ""}${summary.averageRatingGrowth.toFixed(1)}`, 
        trendingUp: summary.averageRatingGrowth >= 0, 
        icon: Star, 
        color: "#8b5cf6" 
      });
      base.push({ 
        label: "Response Time", 
        value: (summary.avgResponseTime !== undefined && summary.avgResponseTime !== null) ? `${summary.avgResponseTime}m` : "N/A", 
        change: "-0m", 
        trendingUp: false, 
        icon: Clock, 
        color: "#6366f1" 
      });
    }

    return base;
  }, [summary, currentRole]);

  const issueCategories = useMemo(() => {
    if (!distribution?.byCategory) return [];
    return distribution.byCategory.map((item, index) => ({
      name: item.name,
      value: item.count,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }));
  }, [distribution]);

  const feedbackTrend = useMemo(() => {
    if (!trendData) return [];
    // Convert YYYY-MM-DD to DD/MM
    return trendData.map(point => {
      const parts = point.name.split("-");
      return {
        day: `${parts[2]}/${parts[1]}`, // DD/MM
        feedback: point.score
      };
    });
  }, [trendData]);
  
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
  
  const activities = activityData?.data || [];
  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
  const paginatedActivities = activities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>{getPageTitle()}</h2>
          <p className={styles.pageSubtitle}>{getPageSubtitle()}</p>
        </div>
        <div className={styles.datePickerContainer} ref={dateFilterRef}>
          <button 
            className={styles.datePicker}
            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
          >
            <span>{selectedDateFilter}</span>
            <ChevronDown size={16} className={`${styles.datePickerChevron} ${isDateFilterOpen ? styles.chevronRotated : ''}`} />
          </button>
          
          <AnimatePresence>
            {isDateFilterOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={styles.dateFilterDropdown}
              >
                {dateFilters.map(filter => (
                  <button
                    key={filter}
                    className={`${styles.dateFilterOption} ${selectedDateFilter === filter ? styles.dateFilterOptionActive : ''}`}
                    onClick={() => {
                      setSelectedDateFilter(filter);
                      setIsDateFilterOpen(false);
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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
            <h3 className={styles.cardTitle}>Satisfaction Trend</h3>
            <button className={styles.moreButton}><MoreVertical size={20} /></button>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={feedbackTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  domain={[0, 5]}
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
            <h3 className={styles.cardTitle}>Issue Distribution</h3>
            <button className={styles.moreButton}><MoreVertical size={20} /></button>
          </div>
          <div className={styles.chartWrapper}>
            {issueCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={issueCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {issueCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>No category data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className={styles.activityCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Recent Activity Feed</h3>
        </div>
        <div className={styles.activityList}>
          {paginatedActivities.length > 0 ? (
            paginatedActivities.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={`${styles.activityBullet} ${styles[activity.type.toLowerCase()]}`} />
                <div className={styles.activityContent}>
                  <p className={styles.activityText}>
                    <strong>{activity.title}:</strong> {activity.content}
                    {activity.code && <span className={styles.activityCode}> ({activity.code})</span>}
                  </p>
                  <span className={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</span>
                </div>
                {activity.status && (
                  <div className={`${styles.statusBadge} ${styles[activity.status.toLowerCase().replace(" ", "")]}`}>
                    {activity.status}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className={styles.emptyList}>No recent activity</p>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ 
            padding: '20px 24px', 
            borderTop: '1px solid #f1f5f9', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
              Showing Page <span style={{ color: '#1e293b', fontWeight: 600 }}>{currentPage}</span> of <span style={{ color: '#1e293b', fontWeight: 600 }}>{totalPages}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={styles.iconButton}
                style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={styles.iconButton}
                style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
