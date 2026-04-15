"use client";

import { useState } from "react";
import { 
  Download, 
  FileText, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertOctagon,
  Calendar,
  Filter
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";

// MOCK DATA for analytics
const satisfactionData = [
  { name: "Mon", score: 4.2 },
  { name: "Tue", score: 4.1 },
  { name: "Wed", score: 4.4 },
  { name: "Thu", score: 4.6 },
  { name: "Fri", score: 4.8 },
  { name: "Sat", score: 4.5 },
  { name: "Sun", score: 4.9 },
];

const peakTimesData = [
  { name: "6 AM", issues: 12 },
  { name: "9 AM", issues: 45 },
  { name: "12 PM", issues: 32 },
  { name: "3 PM", issues: 58 },
  { name: "6 PM", issues: 85 },
  { name: "9 PM", issues: 15 },
];

const locationData = [
  { name: "T1 Gate 4", value: 120 },
  { name: "T2 Baggage", value: 95 },
  { name: "VIP Lounge", value: 60 },
  { name: "Arrivals Hall", value: 145 },
];

const deptPerformanceData = [
  { name: "Security", unresolved: 15, resolved: 85 },
  { name: "Facilities", unresolved: 30, resolved: 120 },
  { name: "Operations", unresolved: 5, resolved: 45 },
  { name: "Janitorial", unresolved: 10, resolved: 150 },
];

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const { currentRole, currentDepartment, departmentName } = useRole();
  const [timeRange, setTimeRange] = useState("Last 7 Days");

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.chartTooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className={styles.tooltipRow}>
              <div className={styles.tooltipDot} style={{ backgroundColor: entry.color }}></div>
              <span className={styles.tooltipValue}>{entry.name}: {entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.analyticsLayout}>
      {/* Header & Export Tools */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>
            {currentRole === 'DEPARTMENT_ADMIN' ? `${departmentName || currentDepartment} Performance` : 'Advanced Analytics'}
          </h2>
          <p className={styles.pageSubtitle}>
            {currentRole === 'DEPARTMENT_ADMIN' 
              ? 'Track your department\'s response time and issue resolution metrics.'
              : "Deep insights into terminal operations and passenger satisfaction."
            }
          </p>
        </div>
        <div className={styles.headerActions}>
           <div className={styles.filterDropdown}>
              <Calendar size={18} />
              <select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Year">This Year</option>
              </select>
           </div>
           
           <button className={styles.exportBtn}>
             <FileText size={16} />
             PDF Report
           </button>
           <button className={styles.exportBtnPrimary}>
             <Download size={16} />
             Export Data
           </button>
        </div>
      </div>

      {/* High-Level Scorecards */}
      <div className={styles.metricCardGrid}>
         <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
               <span className={styles.kpiTitle}>Avg. Satisfaction</span>
               <div className={styles.kpiIconBox} style={{ color: '#22c55e', backgroundColor: '#f0fdf4' }}>
                  <TrendingUp size={20} />
               </div>
            </div>
            <div className={styles.kpiValueGroup}>
               <h3 className={styles.kpiValue}>4.6<span className={styles.kpiMetric}>/5.0</span></h3>
               <span className={styles.kpiTrendUp}>+0.2 this week</span>
            </div>
         </div>

         <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
               <span className={styles.kpiTitle}>Total Engagement</span>
               <div className={styles.kpiIconBox} style={{ color: '#3b82f6', backgroundColor: '#eff6ff' }}>
                  <Users size={20} />
               </div>
            </div>
            <div className={styles.kpiValueGroup}>
               <h3 className={styles.kpiValue}>12,450</h3>
               <span className={styles.kpiTrendUp}>+15% this week</span>
            </div>
         </div>

         <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
               <span className={styles.kpiTitle}>Open Issues</span>
               <div className={styles.kpiIconBox} style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}>
                  <AlertOctagon size={20} />
               </div>
            </div>
            <div className={styles.kpiValueGroup}>
               <h3 className={styles.kpiValue}>42</h3>
               <span className={styles.kpiTrendDown}>-12% this week</span>
            </div>
         </div>

         <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
               <span className={styles.kpiTitle}>Avg. Resolution Time</span>
               <div className={styles.kpiIconBox} style={{ color: '#f59e0b', backgroundColor: '#fffbeb' }}>
                  <Clock size={20} />
               </div>
            </div>
            <div className={styles.kpiValueGroup}>
               <h3 className={styles.kpiValue}>1h 45m</h3>
               <span className={styles.kpiTrendUp}>-30m this week</span>
            </div>
</div>
       </div>

       {/* Department Admin Simplified View */}
       {currentRole === 'DEPARTMENT_ADMIN' && (
         <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px' }}>
           <h3 style={{ marginBottom: '16px', color: '#1e293b' }}>Your Performance Summary</h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Users size={20} color="#3b82f6" />
                    </div>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Issues Handled</span>
                 </div>
                 <span style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>156</span>
                 <span style={{ display: 'block', color: '#22c55e', fontSize: '13px', marginTop: '4px' }}>+12 this week</span>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Clock size={20} color="#f59e0b" />
                    </div>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Avg Response Time</span>
                 </div>
                 <span style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>45m</span>
                 <span style={{ display: 'block', color: '#22c55e', fontSize: '13px', marginTop: '4px' }}>-15% faster</span>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <TrendingUp size={20} color="#22c55e" />
                    </div>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Resolution Rate</span>
                 </div>
                 <span style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>94%</span>
                 <span style={{ display: 'block', color: '#22c55e', fontSize: '13px', marginTop: '4px' }}>+5% improvement</span>
              </div>
           </div>
         </div>
       )}

      {/* Main Charts Area */}
      <div className={styles.chartsGrid}>
         
         {/* Chart 1: Satisfaction Trends */}
         <div className={styles.chartPanelFull}>
            <div className={styles.chartPanelHeader}>
               <div>
                  <h4 className={styles.chartTitle}>Passenger Satisfaction Trend</h4>
                  <p className={styles.chartSubtitle}>Aggregated rating history across all terminals.</p>
               </div>
            </div>
            <div className={styles.chartContainer}>
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={satisfactionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                   <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                   <Tooltip content={<CustomTooltip />} />
                   <Line 
                     type="monotone" 
                     dataKey="score" 
                     stroke="#22c55e" 
                     strokeWidth={3} 
                     dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                     activeDot={{ r: 6, strokeWidth: 0 }}
                   />
                 </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Chart 2: Peak Issue Times */}
         <div className={styles.chartPanel}>
            <div className={styles.chartPanelHeader}>
               <div>
                  <h4 className={styles.chartTitle}>Peak Issue Activity</h4>
                  <p className={styles.chartSubtitle}>Volume of complaints vs hour of day.</p>
               </div>
            </div>
            <div className={styles.chartContainer}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={peakTimesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                   <Tooltip content={<CustomTooltip />} />
                   <Area type="monotone" dataKey="issues" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorIssues)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Chart 3: Top Complaint Locations */}
         <div className={styles.chartPanel}>
            <div className={styles.chartPanelHeader}>
               <div>
                  <h4 className={styles.chartTitle}>Issue Hotspots</h4>
                  <p className={styles.chartSubtitle}>Locations generating the most friction.</p>
               </div>
            </div>
            <div className={styles.chartContainer}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={locationData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                   <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                   <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} width={100} />
                   <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                   <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                     {locationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Chart 4: Department Performance */}
         <div className={styles.chartPanelFull}>
            <div className={styles.chartPanelHeader}>
               <div>
                  <h4 className={styles.chartTitle}>Department Resolution Speed</h4>
                  <p className={styles.chartSubtitle}>Comparing active vs resolved operational tickets by unit.</p>
               </div>
            </div>
            <div className={styles.chartContainer} style={{ height: "300px" }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={deptPerformanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                   <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                   <Bar dataKey="resolved" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} barSize={40} />
                   <Bar dataKey="unresolved" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} barSize={40} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

      </div>
    </div>
  );
}
