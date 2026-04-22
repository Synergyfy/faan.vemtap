"use client";

import { useState } from "react";
import { 
  Download, 
  FileText, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertOctagon,
  Calendar
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
  Cell
} from "recharts";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { 
  useAnalyticsSummary, 
  useSatisfactionTrend, 
  usePeakActivity, 
  useHotspots, 
  useDeptPerformanceChart,
  ChartDataPoint
} from "@/hooks/useAnalytics";

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

type TooltipPayloadItem = { name: string; value: number; color?: string };

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className={styles.chartTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className={styles.tooltipRow}>
            <div className={styles.tooltipDot} style={{ backgroundColor: entry.color }}></div>
            <span className={styles.tooltipValue}>{entry.name}: {entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage() {
  const { currentRole, currentDepartment, departmentName, currentLocation } = useRole();
  const [timeRange, setTimeRange] = useState("Last 7 Days");

  // Fetching real data
  const { data: summary } = useAnalyticsSummary({ locationId: currentLocation, departmentId: currentDepartment });
  const { data: satisfactionData } = useSatisfactionTrend({ locationId: currentLocation, departmentId: currentDepartment });
  const { data: peakTimesData } = usePeakActivity({ locationId: currentLocation, departmentId: currentDepartment });
  const { data: locationData } = useHotspots({ locationId: currentLocation });
  const { data: deptPerformanceData } = useDeptPerformanceChart({ locationId: currentLocation });

  const handleExportData = () => {
    try {
      toast.loading("Preparing CSV export...", { id: 'csvExport' });
      
      const headers = ["Metric", "Value"];
      const rows = [
        ["Total Submissions", summary?.totalSubmissions || 0],
        ["Average Rating", summary?.averageRating?.toFixed(2) || 0],
        ["Open Issues", summary?.openSubmissions || 0],
        ["Resolved Issues", summary?.resolvedSubmissions || 0],
        ["Total Issues", summary?.totalIssues || 0],
        ["Resolution Rate", `${summary?.resolutionRate || 0}%`],
        ["Avg Response Time", `${summary?.avgResponseTime || 0}m`],
        ["Generated At", format(new Date(), 'yyyy-MM-dd HH:mm:ss')]
      ];

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `faan_analytics_export_${format(new Date(), 'yyyyMMdd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV exported successfully!", { id: 'csvExport' });
    } catch (error) {
      toast.error("Failed to export CSV.", { id: 'csvExport' });
    }
  };

  const handlePdfReport = () => {
    try {
      toast.loading("Generating PDF Report...", { id: 'pdfExport' });
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text("FAAN Analytics Performance Report", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${format(new Date(), 'PPPP p')}`, 14, 30);
      if (departmentName) doc.text(`Department: ${departmentName}`, 14, 35);

      const tableData = [
        ["Metric", "Value"],
        ["Total Submissions", (summary?.totalSubmissions || 0).toString()],
        ["Average Passenger Rating", (summary?.averageRating?.toFixed(2) || "0.00").toString()],
        ["Total Issues Flagged", (summary?.totalIssues || 0).toString()],
        ["Resolution Rate", `${summary?.resolutionRate || 0}%`],
        ["Avg. Response Time", `${summary?.avgResponseTime || 0} minutes`],
        ["Open (Pending) Issues", (summary?.openSubmissions || 0).toString()],
        ["Resolved Issues", (summary?.resolvedSubmissions || 0).toString()]
      ];

      (doc as any).autoTable({
        startY: 45,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        headStyles: { fillStyle: [59, 130, 246], textColor: [255, 255, 255] },
        alternateRowStyles: { fillStyle: [248, 250, 252] }
      });

      doc.save(`faan_analytics_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success("PDF generated successfully!", { id: 'pdfExport' });
    } catch (error) {
      toast.error("Failed to generate PDF.", { id: 'pdfExport' });
    }
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
           
           <button className={styles.exportBtn} onClick={handlePdfReport}>
             <FileText size={16} />
             PDF Report
           </button>
           <button className={styles.exportBtnPrimary} onClick={handleExportData}>
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
               <h3 className={styles.kpiValue}>
                 {summary?.averageRating?.toFixed(1) || '0.0'}<span className={styles.kpiMetric}>/5.0</span>
               </h3>
               <span className={styles.kpiTrendUp}>+0.0 this week</span>
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
               <h3 className={styles.kpiValue}>{summary?.totalSubmissions.toLocaleString() || '0'}</h3>
               <span className={styles.kpiTrendUp}>+0% this week</span>
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
               <h3 className={styles.kpiValue}>{summary?.openSubmissions || '0'}</h3>
               <span className={styles.kpiTrendDown}>-0% this week</span>
            </div>
         </div>

         <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
               <span className={styles.kpiTitle}>Resolved Issues</span>
               <div className={styles.kpiIconBox} style={{ color: '#f59e0b', backgroundColor: '#fffbeb' }}>
                  <Clock size={20} />
               </div>
            </div>
            <div className={styles.kpiValueGroup}>
               <h3 className={styles.kpiValue}>{summary?.resolvedSubmissions || '0'}</h3>
               <span className={styles.kpiTrendUp}>+0 this week</span>
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
                 <span style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                   {summary?.totalIssues.toLocaleString() || '0'}
                 </span>
                 <span style={{ display: 'block', color: '#22c55e', fontSize: '13px', marginTop: '4px' }}>In current period</span>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Clock size={20} color="#f59e0b" />
                    </div>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Avg Response Time</span>
                 </div>
                 <span style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                    {summary?.avgResponseTime ? `${summary.avgResponseTime}m` : '0m'}
                 </span>
                 <span style={{ display: 'block', color: '#22c55e', fontSize: '13px', marginTop: '4px' }}>Real-time avg</span>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <TrendingUp size={20} color="#22c55e" />
                    </div>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Resolution Rate</span>
                 </div>
                 <span style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                    {summary?.resolutionRate || '0'}%
                 </span>
                 <span style={{ display: 'block', color: '#22c55e', fontSize: '13px', marginTop: '4px' }}>Operational efficiency</span>
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
                     {locationData?.map((entry: ChartDataPoint, index: number) => (
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
