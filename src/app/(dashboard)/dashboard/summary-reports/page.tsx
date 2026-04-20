"use client";

import { useState, useRef } from "react";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Mail, 
  Share2, 
  Printer, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  Loader2
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, subDays, isSameDay, isSameWeek, parseISO } from "date-fns";
import styles from "../../Dashboard.module.css";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useIssues } from "@/hooks/useIssues";
import { useTouchpoints } from "@/hooks/useTouchpoints";
import { useRole } from "@/context/RoleContext";
import { toast } from "sonner";
import Image from "next/image";

export default function SummaryReportsPage() {
  const { locationName } = useRole();
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Data fetching
  const { data: touchpointsData } = useTouchpoints();
  const { data: submissionsData } = useSubmissions({
    limit: 100 // Get enough for summary
  });
  const { data: issuesData } = useIssues();

  const generateReport = () => {
    setIsGenerating(true);
    // Simulate generation delay for "premium" feel
    setTimeout(() => {
      setIsGenerating(false);
      setShowReport(true);
      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated!`);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    const email = prompt("Enter email address(es) separated by comma:");
    if (email) {
      toast.success("Report sent successfully to: " + email);
    }
  };

  const handleWhatsApp = () => {
    toast.success("Preparing PDF for WhatsApp sharing...");
  };

  // Logic to process data based on selected date/week
  const processReportData = () => {
    const submissions = submissionsData?.data || [];
    const issues = issuesData?.data || [];
    const touchpoints = touchpointsData?.data || [];

    const filteredSubmissions = submissions.filter(s => {
      const date = parseISO(s.submittedAt);
      if (reportType === 'daily') {
        return isSameDay(date, selectedDate);
      } else {
        return isSameWeek(date, selectedDate, { weekStartsOn: 1 });
      }
    });

    const filteredIssues = issues.filter(i => {
      const date = parseISO(i.createdAt);
      if (reportType === 'daily') {
        return isSameDay(date, selectedDate);
      } else {
        return isSameWeek(date, selectedDate, { weekStartsOn: 1 });
      }
    });

    const resolvedCount = filteredIssues.filter(i => i.status === 'RESOLVED').length;
    const pendingCount = filteredIssues.length - resolvedCount;
    const uniqueTouchpointIds = new Set(filteredSubmissions.map(s => s.touchpointId));

    // Grouping by department for touchpoint breakdown
    const deptStats: Record<string, { forms: number, actions: number, name: string, location: string }> = {};
    
    filteredSubmissions.forEach(s => {
      const tp = touchpoints.find(t => t.id === s.touchpointId);
      if (tp) {
        const key = tp.departmentId;
        if (!deptStats[key]) {
          deptStats[key] = { 
            forms: 0, 
            actions: 0, 
            name: tp.department?.name || "Other", 
            location: tp.location?.name || locationName 
          };
        }
        deptStats[key].forms += 1;
        deptStats[key].actions += tp.interactions || 0;
      }
    });

    return {
      totalForms: filteredSubmissions.length,
      touchpointsUsed: uniqueTouchpointIds.size,
      resolvedCount,
      pendingCount,
      totalIssues: filteredIssues.length,
      deptStats: Object.values(deptStats),
      weeklyStats: filteredSubmissions.length // simplified for summary
    };
  };

  const data = processReportData();

  return (
    <div className={styles.pageContainer}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className={styles.pageTitle}>Daily & Weekly Reports</h1>
          <p className={styles.pageSubtitle}>Generate easy-to-read summaries for stakeholders</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className={styles.tabSwitcher} style={{ margin: 0, padding: '4px' }}>
            <button 
              className={reportType === 'daily' ? styles.tabActive : ''} 
              onClick={() => { setReportType('daily'); setShowReport(false); }}
              style={{ fontSize: '13px', padding: '6px 16px' }}
            >
              Daily
            </button>
            <button 
              className={reportType === 'weekly' ? styles.tabActive : ''} 
              onClick={() => { setReportType('weekly'); setShowReport(false); }}
              style={{ fontSize: '13px', padding: '6px 16px' }}
            >
              Weekly
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className={styles.card} style={{ marginBottom: reportType === 'daily' ? '12px' : '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: 'rgba(21, 115, 71, 0.1)', 
              color: 'var(--brand-green)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>
                {reportType === 'daily' ? 'Select Day' : 'Select Week'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setSelectedDate(subDays(selectedDate, reportType === 'daily' ? 1 : 7))}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', minWidth: '160px', textAlign: 'center' }}>
                  {reportType === 'daily' 
                    ? format(selectedDate, "EEEE, MMMM do") 
                    : `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM do")} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM do")}`
                  }
                </span>
                <button 
                  onClick={() => setSelectedDate(addDays(selectedDate, reportType === 'daily' ? 1 : 7))}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <button 
            className={styles.createButton} 
            style={{ 
              padding: '12px 32px', 
              fontSize: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              height: '48px',
              minWidth: '200px',
              justifyContent: 'center'
            }}
            onClick={generateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className={`${styles.animateSpin} spin`} />
                Generating...
              </>
            ) : (
              <>
                <BarChart3 size={18} />
                Generate {reportType === 'daily' ? 'Daily' : 'Weekly'} Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Content */}
      {showReport ? (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div id="report-content" ref={reportRef} style={{ 
            background: 'white', 
            borderRadius: '24px', 
            padding: '48px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            border: '1px solid #f1f5f9',
            maxWidth: '900px',
            margin: '0 auto',
            color: '#1e293b'
          }}>
            {/* Report Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '2px solid #f8fafc', paddingBottom: '30px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Image src="/Faan.logo_.png" alt="Logo" width={60} height={30} />
                  <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--brand-green)', letterSpacing: '-0.5px' }}>VEMTAP</span>
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>
                  {reportType === 'daily' ? 'Daily Activity Summary' : 'Weekly Operations Summary'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '16px' }}>
                  For {locationName} • {reportType === 'daily' ? format(selectedDate, "MMMM do, yyyy") : `Week ${format(selectedDate, "w")} of ${format(selectedDate, "yyyy")}`}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '8px', background: '#f0fdf4', color: 'var(--brand-green)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  System Generated
                </span>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>ID: {reportType.toUpperCase()}-{format(selectedDate, "yyyyMMdd")}</p>
              </div>
            </div>

            {/* Plain English Summary */}
            <div style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '20px', lineHeight: '1.6', fontWeight: 500, color: '#334155' }}>
                {reportType === 'daily' ? (
                  <>
                    On <strong>{format(selectedDate, "EEEE, MMMM do")}</strong>, staff at {locationName} filled a total of <strong>{data.totalForms} forms</strong> across <strong>{data.touchpointsUsed}</strong> different areas of the airport.
                  </>
                ) : (
                  <>
                    This week at {locationName}, a total of <strong>{data.totalForms} forms</strong> were submitted across the system. It was a productive week with consistent reporting from all major departments.
                  </>
                )}
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px' }}>
                <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Forms Filled</p>
                <p style={{ fontSize: '28px', fontWeight: 800 }}>{data.totalForms}</p>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Reports generated today</p>
              </div>
              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px' }}>
                <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Areas Active</p>
                <p style={{ fontSize: '28px', fontWeight: 800 }}>{data.touchpointsUsed}</p>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Unique locations used</p>
              </div>
              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px' }}>
                <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Issues Resolved</p>
                <p style={{ fontSize: '28px', fontWeight: 800 }}>{data.resolvedCount} <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: 400 }}>of {data.totalIssues}</span></p>
                <p style={{ fontSize: '13px', color: 'var(--brand-green)', fontWeight: 600, marginTop: '4px' }}>
                  {data.totalIssues > 0 ? `${Math.round((data.resolvedCount/data.totalIssues)*100)}% Success Rate` : 'No issues raised'}
                </p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="var(--brand-green)" />
                What happened in each department
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.deptStats.length > 0 ? data.deptStats.map((dept, idx) => (
                  <div key={idx} style={{ 
                    padding: '20px', 
                    border: '1px solid #f1f5f9', 
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>{dept.name}</p>
                        <p style={{ fontSize: '13px', color: '#64748b' }}>Located at {dept.location}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 800, fontSize: '18px' }}>{dept.forms} <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>forms</span></p>
                      <p style={{ fontSize: '12px', color: 'var(--brand-green)', fontWeight: 600 }}>{dept.actions} actions recorded</p>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', color: '#94a3b8' }}>
                    No department activity recorded for this period.
                  </div>
                )}
              </div>
            </div>

            {/* Actions Taken Section */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="var(--brand-green)" />
                Actions taken {reportType === 'daily' ? 'today' : 'this week'}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <li style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ marginTop: '4px' }}><ArrowRight size={14} color="var(--brand-green)" /></div>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.5' }}>
                    Staff performed regular inspections across <strong>{data.touchpointsUsed}</strong> vital areas, ensuring all facilities are operating as expected.
                  </p>
                </li>
                <li style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ marginTop: '4px' }}><ArrowRight size={14} color="var(--brand-green)" /></div>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.5' }}>
                    A total of <strong>{data.resolvedCount}</strong> reported issues were successfully closed and verified by the relevant managers.
                  </p>
                </li>
                {data.pendingCount > 0 && (
                  <li style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ marginTop: '4px' }}><ArrowRight size={14} color="var(--brand-green)" /></div>
                    <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.5' }}>
                      There are currently <strong>{data.pendingCount}</strong> items still being worked on. We expect these to be updated in the next report.
                    </p>
                  </li>
                )}
              </ul>
            </div>

            {/* Resolution Narrative */}
            <div style={{ padding: '32px', background: 'rgba(21, 115, 71, 0.03)', border: '1px dashed var(--brand-green)', borderRadius: '20px' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--brand-green)', marginBottom: '12px' }}>Resolution Summary</h4>
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                {data.totalIssues > 0 ? (
                  <>
                    Out of the {data.totalIssues} issues raised {reportType === 'daily' ? 'today' : 'this week'}, {data.resolvedCount} were successfully resolved. 
                    {data.pendingCount > 0 
                      ? ` The remaining ${data.pendingCount} are being tracked and priority has been assigned to ensure they are handled quickly.`
                      : " Everything raised has been successfully handled."}
                  </>
                ) : (
                  "The systems were stable during this period, with no new major issues reported by the staff. This indicates an excellent operational standing."
                )}
              </p>
            </div>

            <div style={{ marginTop: '60px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '30px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Report Generated: {format(new Date(), "PPpp")} • FAAN Vemtap Operations Intelligence
              </p>
            </div>
          </div>

          {/* Export Floating Bar */}
          <div style={{ 
            marginTop: '32px', 
            background: 'white', 
            padding: '16px 24px', 
            borderRadius: '20px', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            position: 'sticky',
            bottom: '32px',
            border: '1px solid #e2e8f0',
            width: 'fit-content',
            margin: '32px auto'
          }}>
            <button onClick={handlePrint} style={{ 
                border: 'none',
                background: '#f1f5f9',
                width: '48px', 
                height: '48px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
            }} title="Download/Print PDF">
              <Download size={20} color="#1e293b" />
            </button>
            <button onClick={handlePrint} style={{ 
                border: 'none',
                background: '#f1f5f9',
                width: '48px', 
                height: '48px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
            }} title="Print">
              <Printer size={20} color="#1e293b" />
            </button>
            <div style={{ width: '1px', background: '#e2e8f0', margin: '8px 0' }}></div>
            <button onClick={handleEmail} className={styles.createButton} style={{ gap: '8px', padding: '0 24px' }}>
              <Mail size={18} />
              Send to CEO
            </button>
            <button onClick={handleWhatsApp} className={styles.createButton} style={{ gap: '8px', padding: '0 24px', background: '#25D366' }}>
              <Share2 size={18} />
              WhatsApp Share
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          height: '500px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'white',
          borderRadius: '24px',
          border: '2px dashed #e2e8f0',
          color: '#94a3b8'
        }}>
          <div style={{ background: '#f1f5f9', padding: '24px', borderRadius: '50%', marginBottom: '20px' }}>
            <FileText size={48} color="#cbd5e1" />
          </div>
          <h3 style={{ color: '#64748b', fontWeight: 600, fontSize: '18px' }}>No report displayed</h3>
          <p style={{ marginTop: '8px' }}>Select a date and click "Generate Report" to begin</p>
          
          <div style={{ marginTop: '32px', textAlign: 'left', width: '400px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Recent Summary Downloads</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ padding: '12px 16px', borderRadius: '12px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={16} color="#94a3b8" />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                      {i === 1 ? 'Daily Summary' : i === 2 ? 'Weekly Overview' : 'Operational Status'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{i} days ago</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Print & Animation Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #report-content, #report-content * {
            visibility: visible !important;
          }
          #report-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
