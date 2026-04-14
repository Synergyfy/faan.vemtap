"use client";

import { useState } from "react";
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Settings State
  const [orgName, setOrgName] = useState("Federal Airports Authority of Nigeria");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [retentionPeriod, setRetentionPeriod] = useState("365");

  return (
    <div className={styles.touchpointsLayout}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>System Configuration</h2>
          <p className={styles.pageSubtitle}>Manage your organization's core settings, notifications, and integrations.</p>
        </div>
        <button className={styles.createButton}>
          <Save size={18} />
          <span>Save Configuration</span>
        </button>
      </div>

      <div className={styles.settingsLayout}>
        {/* Settings Sidebar */}
        <div className={styles.settingsSidebar}>
           <button 
             className={`${styles.settingsTab} ${activeTab === "general" ? styles.settingsTabActive : ""}`}
             onClick={() => setActiveTab("general")}
           >
             <Building2 size={18} />
             <span>General & Branding</span>
           </button>
           <button 
             className={`${styles.settingsTab} ${activeTab === "notifications" ? styles.settingsTabActive : ""}`}
             onClick={() => setActiveTab("notifications")}
           >
             <BellRing size={18} />
             <span>Notification Rules</span>
           </button>
           <button 
             className={`${styles.settingsTab} ${activeTab === "data" ? styles.settingsTabActive : ""}`}
             onClick={() => setActiveTab("data")}
           >
             <Database size={18} />
             <span>Data Retention & Privacy</span>
           </button>
           <button 
             className={`${styles.settingsTab} ${activeTab === "api" ? styles.settingsTabActive : ""}`}
             onClick={() => setActiveTab("api")}
           >
             <Code2 size={18} />
             <span>API Integrations</span>
           </button>
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

          {/* DATA RETENTION */}
          {activeTab === "data" && (
            <div className={styles.settingsSection}>
               <div className={styles.settingsHeader}>
                  <h3>Retention & Analytics</h3>
                  <p>Control how long passenger feedback and media are stored on the VEMTAP platform.</p>
               </div>
               
               <div className={styles.settingsForm}>
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
                          value="vt_live_928374982347nf8w3y4nf9e" 
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

        </div>
      </div>
    </div>
  );
}
