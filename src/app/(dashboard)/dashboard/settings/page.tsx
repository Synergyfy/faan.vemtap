"use client";

import { useState } from "react";
import api from '@/lib/api';
import { 
  Building2, 
  Upload, 
  BellRing, 
  Database, 
  Code2, 
  Save,
  CheckCircle2,
  Trash2,
  Globe,
  Mail,
  Smartphone,
  Eye,
  EyeOff
} from "lucide-react";
import styles from "../../Dashboard.module.css";
import Image from "next/image";
import { useRole } from "@/context/RoleContext";
import { 
  useOrganization, 
  useUpdateOrganization 
} from "@/hooks/useOrganizations";
import { useApiKey } from "@/hooks/useSettings";
import { useProfile } from "@/hooks/useAuth";
import { useEffect } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { toast } from "react-hot-toast";
import { useAnalyticsSummary } from "@/hooks/useAnalytics";
import { format } from "date-fns";
import { Download, FileText } from "lucide-react";

export default function SettingsPage() {
  const { currentRole, currentLocation, locationName, departmentName, currentDepartment } = useRole();
  const [activeTab, setActiveTab] = useState(currentRole === 'DEPARTMENT_ADMIN' ? 'profile' : 'general');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Queries
  const { data: profile } = useProfile();
  const organizationId = profile?.department?.location?.organization?.id;
  const { data: organization } = useOrganization(organizationId || "");
  const { data: apiKeyData } = useApiKey();
  
  // Mutations
  const updateOrgMutation = useUpdateOrganization();

  // Settings State
  const [orgName, setOrgName] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [retentionPeriod, setRetentionPeriod] = useState("365");
  const [locationInfo, setLocationInfo] = useState({
    name: "Abuja International Airport",
    code: "ABV",
    timezone: "UTC+1",
    email: "abuja@faan.gov.ng",
    phone: "+234 123 456 7890"
  });
  
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
    }
  }, [organization]);

  const { data: analytics } = useAnalyticsSummary({ locationId: currentLocation, departmentId: currentDepartment });

  const handleExportData = () => {
    try {
      toast.loading("Preparing CSV export...", { id: 'csvExport' });
      
      const headers = ["Metric", "Value"];
      const rows = [
        ["Total Submissions", analytics?.totalSubmissions || 0],
        ["Average Rating", analytics?.averageRating?.toFixed(2) || 0],
        ["Open Issues", analytics?.openSubmissions || 0],
        ["Resolved Issues", analytics?.resolvedSubmissions || 0],
        ["Total Issues", analytics?.totalIssues || 0],
        ["Resolution Rate", `${analytics?.resolutionRate || 0}%`],
        ["Avg Response Time", `${analytics?.avgResponseTime || 0}m`],
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
      link.setAttribute("download", `faan_data_export_${format(new Date(), 'yyyyMMdd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV exported successfully!", { id: 'csvExport' });
    } catch (error) {
      toast.error("Failed to export CSV.", { id: 'csvExport' });
    }
  };

  const handlePdfReport = async () => {
    try {
      toast.loading("Fetching latest performance report...", { id: 'pdfExport' });
      
      // Fetch the latest generated report for the current context
      const res = await api.get(`/system-reports`, {
        params: {
          reportType: 'DAILY',
          category: 'INTERNAL',
          locationId: currentLocation
        }
      });
      
      const reports = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      if (reports.length > 0) {
        const latestId = reports[0].id;
        const pdfResponse = await api.get(`/system-reports/${latestId}/pdf`, { responseType: 'blob' });
        const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `vemtap-performance-report-${format(new Date(), 'yyyyMMdd')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        toast.success("PDF report exported successfully!", { id: 'pdfExport' });
      } else {
        toast.error("No recent reports available for this location. Please generate an AI report first.", { id: 'pdfExport' });
      }
    } catch (error) {
      console.error("PDF Export failed", error);
      toast.error("Failed to generate PDF report. Please try again later.", { id: 'pdfExport' });
    }
  };

  const handleSaveOrg = () => {
    updateOrgMutation.mutate({ name: orgName });
  };

  return (
    <div className={styles.touchpointsLayout}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>
            {currentRole === 'LOCATION_ADMIN' ? 'Location Settings' : currentRole === 'DEPARTMENT_ADMIN' ? 'Profile & Settings' : 'System Configuration'}
          </h2>
          <p className={styles.pageSubtitle}>
            {currentRole === 'LOCATION_ADMIN' 
              ? `Manage settings for ${locationName || 'your airport'}.`
              : currentRole === 'DEPARTMENT_ADMIN'
              ? 'Update your profile and notification preferences.'
              : "Manage your organization's core settings, notifications, and integrations."
            }
          </p>
        </div>
        <button 
          className={styles.createButton} 
          onClick={handleSaveOrg}
          disabled={updateOrgMutation.isPending}
        >
          <Save size={18} />
          <span>{updateOrgMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className={styles.settingsLayout}>
        {/* Settings Sidebar */}
        <div className={styles.settingsSidebar}>
           {currentRole === 'DEPARTMENT_ADMIN' && (
             <button 
               className={`${styles.settingsTab} ${activeTab === "profile" ? styles.settingsTabActive : ""}`}
               onClick={() => setActiveTab("profile")}
             >
               <Building2 size={18} />
               <span>My Profile</span>
             </button>
           )}
           {currentRole !== 'LOCATION_ADMIN' && (
             <button 
               className={`${styles.settingsTab} ${activeTab === "general" ? styles.settingsTabActive : ""}`}
               onClick={() => setActiveTab("general")}
             >
               <Building2 size={18} />
               <span>General & Branding</span>
             </button>
           )}
           <button 
             className={`${styles.settingsTab} ${activeTab === "notifications" ? styles.settingsTabActive : ""}`}
             onClick={() => setActiveTab("notifications")}
           >
             <BellRing size={18} />
             <span>Notification Rules</span>
           </button>
           {currentRole !== 'DEPARTMENT_ADMIN' && (
             <button 
               className={`${styles.settingsTab} ${activeTab === "data" ? styles.settingsTabActive : ""}`}
               onClick={() => setActiveTab("data")}
             >
               <Database size={18} />
               <span>Data & Exports</span>
             </button>
           )}
           {currentRole === 'LOCATION_ADMIN' && (
             <button 
               className={`${styles.settingsTab} ${activeTab === "location" ? styles.settingsTabActive : ""}`}
               onClick={() => setActiveTab("location")}
             >
               <Building2 size={18} />
               <span>Location Settings</span>
             </button>
           )}
        </div>

        {/* Settings Content Area */}
        <div className={styles.settingsContent}>
          
          {/* GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className={styles.settingsSection}>
               <div className={styles.settingsHeader}>
                  <h3>Organization Identity</h3>
                  <p>Update your company name and official branding applied to all public touchpoints.</p>
               </div>
               
               <div className={styles.settingsForm}>
                  <div className={styles.formGroup}>
                     <label className={styles.formLabel}>Organization Name</label>
                     <input 
                       type="text" 
                       value={orgName}
                       onChange={e => setOrgName(e.target.value)}
                       className={styles.modalInput}
                     />
                  </div>

                  <div className={styles.formGroup}>
                     <label className={styles.formLabel}>Official Logo</label>
                     <div className={styles.logoUploadArea}>
                        <div className={styles.currentLogo}>
                           <Image src="/Faan.logo_.png" alt="FAAN Logo" width={100} height={40} style={{ objectFit: 'contain' }} />
                        </div>
                        <div className={styles.uploadControls}>
                           <button className={styles.outlineBtn}>
                             <Upload size={16} />
                             Upload New Image
                           </button>
                           <span className={styles.uploadHint}>SVG, PNG, or JPG (max. 800x400px)</span>
                        </div>
                     </div>
                  </div>

                  <div className={styles.formGroup}>
                     <label className={styles.formLabel}>Primary Support URL (Optional)</label>
                     <div className={styles.modalInputWrapper}>
                        <Globe size={18} />
                        <input type="text" placeholder="https://faan.gov.ng/support" />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === "notifications" && (
            <div className={styles.settingsSection}>
               <div className={styles.settingsHeader}>
                  <h3>Alert Preferences</h3>
                  <p>Configure how and when the system notifies your team about new issues.</p>
               </div>
               
               <div className={styles.settingsForm}>
                  <div className={styles.toggleRow}>
                     <div className={styles.toggleInfo}>
                        <div className={styles.toggleIcon}><Mail size={18} /></div>
                        <div>
                           <h4>Email Notifications</h4>
                           <p>Receive daily digests and critical alerts via email.</p>
                        </div>
                     </div>
                     <label className={styles.switch}>
                        <input type="checkbox" checked={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} />
                        <span className={styles.slider}></span>
                     </label>
                  </div>

                  <div className={styles.toggleRow}>
                     <div className={styles.toggleInfo}>
                        <div className={styles.toggleIcon}><Smartphone size={18} /></div>
                        <div>
                           <h4>SMS Alerts (Security & Critical)</h4>
                           <p>Instant SMS bridging for high-priority incidents.</p>
                        </div>
                     </div>
                     <label className={styles.switch}>
                        <input type="checkbox" checked={smsAlerts} onChange={() => setSmsAlerts(!smsAlerts)} />
                        <span className={styles.slider}></span>
                     </label>
                  </div>
               </div>
            </div>
          )}

          {/* DATA MANAGEMENT & EXPORTS */}
          {(activeTab === "data" || (activeTab === "profile" && currentRole === 'DEPARTMENT_ADMIN')) && (
            <div className={styles.settingsSection}>
               <div className={styles.settingsHeader}>
                  <h3>Data Management & Exports</h3>
                  <p>Export your operational data or generate a comprehensive PDF summary of system performance.</p>
               </div>
               
               <div className={styles.settingsForm}>
                  <div className={styles.exportActionsContainer} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                     <button className={styles.exportBtn} onClick={() => handlePdfReport()}>
                        <FileText size={18} />
                        <span>Generate PDF Report</span>
                     </button>
                     <button className={styles.exportBtnPrimary} onClick={() => handleExportData()}>
                        <Download size={18} />
                        <span>Export CSV Data</span>
                     </button>
                  </div>

                  {currentRole !== 'DEPARTMENT_ADMIN' && (
                    <>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Submission Data Retention</label>
                        <p className={styles.fieldDesc} style={{ marginBottom: "12px" }}>Automatically purge unarchived tickets to comply with data standard laws.</p>
                        <select 
                          value={retentionPeriod} 
                          onChange={e => setRetentionPeriod(e.target.value)}
                          className={styles.modalInput}
                        >
                            <option value="30">30 Days</option>
                            <option value="90">90 Days</option>
                            <option value="180">6 Months</option>
                            <option value="365">1 Year (Default)</option>
                            <option value="none">Keep Indefinitely</option>
                        </select>
                      </div>

                      <div className={styles.dangerZoneBox}>
                        <div>
                            <h4>Factory Reset Data</h4>
                            <p>Permanently delete all feedback and touchpoint analytics. Proceed with extreme caution.</p>
                        </div>
                        <button className={`${styles.createButton} ${styles.danger}`} style={{ backgroundColor: '#ef4444' }}>
                            <Trash2 size={16} />
                            Purge Records
                        </button>
                      </div>
                    </>
                  )}
               </div>
            </div>
          )}

          {/* API INTEGRATION */}
          {activeTab === "api" && (
            <div className={styles.settingsSection}>
               <div className={styles.settingsHeader}>
                  <h3>Developer API</h3>
                  <p>Connect FAAN's central operating systems with VEMTAP through secure webhooks and API keys.</p>
               </div>
               
               <div className={styles.settingsForm}>
                  <div className={styles.apiKeyBox}>
                     <div className={styles.apiBoxHeader}>
                        <h4>Production API Key</h4>
                        <span className={styles.apiStatus}><CheckCircle2 size={12} /> Active</span>
                     </div>
                      <div className={styles.apiInputGroup}>
                         <input 
                           type={showApiKey ? "text" : "password"} 
                           value={apiKeyData?.key || "Generating..."} 
                           readOnly 
                           className={styles.modalInput}
                         />
                         <button className={styles.outlineBtn} onClick={() => setShowApiKey(!showApiKey)}>
                           {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                         </button>
                      </div>
                     <p className={styles.fieldDesc} style={{ marginTop: "8px" }}>Used for integrating touchpoints into native mobile apps.</p>
                  </div>

                  <div className={styles.formGroup} style={{ marginTop: "32px" }}>
                     <label className={styles.formLabel}>Webhook Endpoint (Optional)</label>
                     <input type="text" placeholder="https://api.yoursystem.com/webhook" className={styles.modalInput} />
                     <p className={styles.fieldDesc} style={{ marginTop: "8px" }}>We'll send POST requests here when new issues are generated.</p>
                  </div>
               </div>
             </div>
           )}

           {/* LOCATION SETTINGS (For Location Admin) */}
           {currentRole === 'LOCATION_ADMIN' && activeTab === "location" && (
             <div className={styles.settingsSection}>
                <div className={styles.settingsHeader}>
                   <h3>Airport Information</h3>
                   <p>Update your airport's basic information and contact details.</p>
                </div>
                
                <div className={styles.settingsForm}>
                   <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Airport Name</label>
                      <input 
                        type="text" 
                        value={locationInfo.name}
                        onChange={e => setLocationInfo({...locationInfo, name: e.target.value})}
                        className={styles.modalInput}
                      />
                   </div>

                   <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Airport Code</label>
                      <input 
                        type="text" 
                        value={locationInfo.code}
                        onChange={e => setLocationInfo({...locationInfo, code: e.target.value})}
                        className={styles.modalInput}
                        disabled
                        style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                      />
                      <p className={styles.fieldDesc}>Airport code cannot be changed.</p>
                   </div>

                   <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Timezone</label>
                      <input 
                        type="text" 
                        value={locationInfo.timezone}
                        onChange={e => setLocationInfo({...locationInfo, timezone: e.target.value})}
                        className={styles.modalInput}
                      />
                   </div>

                   <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Contact Email</label>
                      <input 
                        type="email" 
                        value={locationInfo.email}
                        onChange={e => setLocationInfo({...locationInfo, email: e.target.value})}
                        className={styles.modalInput}
                      />
                   </div>

                   <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Contact Phone</label>
                      <input 
                        type="text" 
                        value={locationInfo.phone}
                        onChange={e => setLocationInfo({...locationInfo, phone: e.target.value})}
                        className={styles.modalInput}
                      />
                   </div>
                </div>
              </div>
            )}

            {/* PROFILE SETTINGS (For Department Admin) */}
            {currentRole === 'DEPARTMENT_ADMIN' && activeTab === "profile" && (
              <div className={styles.settingsSection}>
                 <div className={styles.settingsHeader}>
                    <h3>My Profile</h3>
                    <p>Update your personal information and department details.</p>
                 </div>
                 
                 <div className={styles.settingsForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Full Name</label>
                        <input 
                          type="text" 
                          value={profile ? `${profile.firstName} ${profile.lastName}` : "Loading..."}
                          className={styles.modalInput}
                          readOnly
                        />
                     </div>

                     <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email Address</label>
                        <input 
                          type="email" 
                          value={profile?.email || ""}
                          className={styles.modalInput}
                          readOnly
                        />
                     </div>

                     <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Phone Number</label>
                        <input 
                          type="text" 
                          value={profile?.phone || "Not set"}
                          className={styles.modalInput}
                          readOnly
                        />
                     </div>

                    <div className={styles.formGroup}>
                       <label className={styles.formLabel}>Department</label>
                       <input 
                         type="text" 
                         value={departmentName || currentDepartment || "Security"}
                         className={styles.modalInput}
                         disabled
                         style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                       />
                    </div>

                    <div className={styles.formGroup}>
                       <label className={styles.formLabel}>Role</label>
                       <input 
                         type="text" 
                         value="Department Admin"
                         className={styles.modalInput}
                         disabled
                         style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                       />
                    </div>
                 </div>
              </div>
            )}

        </div>
      </div>
    </div>
  );
}
