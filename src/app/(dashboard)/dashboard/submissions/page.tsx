"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  X, 
  ChevronRight, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  Shield,
  Trash2,
  Send,
  Download,
  Star
} from "lucide-react";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { UserRole } from "@/types/rbac";

interface Submission {
  id: string;
  type: string;
  location: string;
  locationId?: string;
  datetime: string;
  status: string;
  department: string;
  departmentId?: string;
  passenger: string;
  message: string;
  rating: number | null;
  priority: string;
  formData: Record<string, unknown>;
}

// Mock Data for Submissions
const ALL_SUBMISSIONS: Submission[] = [
  { 
    id: "SUB-8812", 
    type: "Complaint", 
    location: "Abuja T1 - Gate 4",
    locationId: "abuja",
    datetime: "2024-04-14 09:20 AM", 
    status: "Open", 
    department: "Security",
    departmentId: "security",
    passenger: "Anonymous",
    message: "Extremely long wait time at security check. Only 2 lanes open during peak hours.",
    rating: 2,
    priority: "High",
    formData: {
      rating: 2,
      travel_date: "2024-04-14",
      flight_number: "NG-442",
      passenger_email: "test@domain.com"
    }
  },
  { 
    id: "SUB-8815", 
    type: "Feedback", 
    location: "Lagos - International Lounge",
    locationId: "lagos",
    datetime: "2024-04-14 10:45 AM", 
    status: "Resolved", 
    department: "Facilities",
    departmentId: "facilities-lagos",
    passenger: "Emeka Obi",
    message: "The new coffee machine in the wing-B lounge is fantastic! Great improvement.",
    rating: 5,
    priority: "Low",
    formData: {
      rating: 5,
      engagement_type: "Survey",
      preferred_contact: "Email"
    }
  },
  { 
    id: "SUB-8819", 
    type: "Incident", 
    location: "Abuja T2 - Baggage Claim",
    locationId: "abuja",
    datetime: "2024-04-14 11:15 AM", 
    status: "In Progress", 
    department: "Operations",
    departmentId: "operations",
    passenger: "Aisha Yusuf",
    message: "Spilled liquid near Carousel 3. It's a slip hazard and needs immediate cleaning.",
    rating: null,
    priority: "Critical",
    formData: {
       incident_severity: "High",
       action_required: "Cleaning",
       location_verified: "Yes"
    }
  }
];

const DEPARTMENTS = ["Security", "Facilities", "Operations", "Janitorial", "IT", "Customer Service"];
const STATUSES = ["Open", "In Progress", "Resolved", "Archived"];

export default function SubmissionsPage() {
  const { currentRole, currentLocation, currentDepartment, hasAccessToLocation, hasAccessToDepartment } = useRole();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [note, setNote] = useState("");

  const filteredSubmissions = useMemo(() => {
    return ALL_SUBMISSIONS.filter(sub => {
      if (currentRole === UserRole.SUPER_ADMIN) return true;
      if (currentRole === UserRole.LOCATION_ADMIN && sub.locationId) {
        return hasAccessToLocation(sub.locationId);
      }
      if (currentRole === UserRole.DEPARTMENT_ADMIN) {
        return hasAccessToDepartment(sub.departmentId || sub.department);
      }
      return true;
    });
  }, [currentRole, currentLocation, currentDepartment, hasAccessToLocation, hasAccessToDepartment]);

  const [submissions, setSubmissions] = useState<Submission[]>(filteredSubmissions);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setSubmissions(submissions.map((s: Submission) => s.id === id ? { ...s, status: newStatus } : s));
    if (selectedSubmission?.id === id) {
      setSelectedSubmission({ ...selectedSubmission, status: newStatus });
    }
  };

  const handleAssignDept = (id: string, dept: string) => {
    setSubmissions(submissions.map((s: Submission) => s.id === id ? { ...s, department: dept } : s));
    if (selectedSubmission?.id === id) {
      setSelectedSubmission({ ...selectedSubmission, department: dept });
    }
  };

  return (
    <div className={styles.touchpointsLayout}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Engagement Submissions</h2>
          <p className={styles.pageSubtitle}>Monitor and take action on real-time passenger inputs.</p>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.filterButton}>
             <Download size={18} />
             <span>Export All</span>
           </button>
        </div>
      </div>

      <div className={styles.tableControls}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by ID, location or message..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <button className={styles.filterButton}>
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Location Area</th>
              {currentRole !== 'DEPARTMENT_ADMIN' && <th>Department</th>}
              <th>Status</th>
              <th>Date</th>
              <th className={styles.textRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.filter((s: Submission) => 
              s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
              s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
              s.message.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((sub) => (
              <tr key={sub.id} className={styles.clickableRow} onClick={() => setSelectedSubmission(sub)}>
                <td>
                  <span className={styles.tpName}>{sub.id}</span>
                </td>
                <td>
                  <span className={`${styles.typeTag} ${styles[sub.type.toLowerCase()]}`}>
                    {sub.type}
                  </span>
                </td>
                <td>
                  <div className={styles.deptCell}>
                    <MapPin size={14} className={styles.deptIcon} />
                    <span>{sub.location}</span>
                  </div>
                </td>
                {currentRole !== 'DEPARTMENT_ADMIN' && (
                <td>
                  <div className={styles.deptCell}>
                    <Shield size={14} className={styles.deptIcon} />
                    <span>{sub.department}</span>
                  </div>
                </td>
                )}
                <td>
                  <span className={`${styles.statusBadge} ${styles[sub.status.toLowerCase().replace(" ", "")]}`}>
                    {sub.status}
                  </span>
                </td>
                <td>
                  <div className={styles.timeCell}>
                    <Clock size={14} />
                    <span>{sub.datetime}</span>
                  </div>
                </td>
                <td className={styles.textRight}>
                  <button className={styles.viewLink}>
                    View Details
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedSubmission && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.detailModal}`}>
             <div className={styles.modalHeader}>
                <div className={styles.modalTitleGroup}>
                  <span className={`${styles.priorityTag} ${styles[selectedSubmission.priority.toLowerCase()]}`}>
                    {selectedSubmission.priority} Priority
                  </span>
                  <h3 className={styles.modalTitle}>{selectedSubmission.id} Detail</h3>
                </div>
                <button className={styles.closeBtn} onClick={() => setSelectedSubmission(null)}><X size={20} /></button>
             </div>

             <div className={styles.modalBody}>
                <div className={styles.detailGrid}>
                   {/* Left Col: Info */}
                   <div className={styles.detailMain}>
                      <section className={styles.messageSection}>
                         <h4 className={styles.detailLabel}>Dynamic Submission Data</h4>
                         <div className={styles.dynamicDataCard}>
                            {/* Base Message always shown if present */}
                            {selectedSubmission.message && (
                              <div className={styles.dataField}>
                                <span className={styles.smallLabel}>Primary Message / Comment</span>
                                <p className={styles.masterMessage}>{selectedSubmission.message}</p>
                              </div>
                            )}

                            {/* Dynamically render all other form data */}
                            {selectedSubmission.formData && Object.entries(selectedSubmission.formData).map(([key, value]: [string, any]) => {
                              if (key === "comment") return null; // Already handled as 'message'
                              
                              return (
                                <div key={key} className={styles.dataField}>
                                   <span className={styles.smallLabel}>{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                                   <div className={styles.fieldValueContainer}>
                                      {key === "rating" ? (
                                        <div className={styles.miniStars}>
                                          {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} fill={i < (value as number) ? "#fbbf24" : "none"} color={i < (value as number) ? "#fbbf24" : "#e2e8f0"} />
                                          ))}
                                        </div>
                                      ) : (
                                        <span className={styles.fieldValueText}>{value.toString()}</span>
                                      )}
                                   </div>
                                </div>
                              );
                            })}
                         </div>
                      </section>

                      <div className={styles.infoCards}>
                         <div className={styles.infoCard}>
                            <MapPin size={18} />
                            <div>
                               <span>Location</span>
                               <strong>{selectedSubmission.location}</strong>
                            </div>
                         </div>
                         <div className={styles.infoCard}>
                            <User size={18} />
                            <div>
                               <span>Passenger</span>
                               <strong>{selectedSubmission.passenger}</strong>
                            </div>
                         </div>
                         <div className={styles.infoCard}>
                            <Clock size={18} />
                            <div>
                               <span>Timestamp</span>
                               <strong>{selectedSubmission.datetime}</strong>
                            </div>
                         </div>
                      </div>

                      <section className={styles.internalNotes}>
                         <h4 className={styles.detailLabel}>Internal Notes</h4>
                         <div className={styles.notesList}>
                            <div className={styles.noteItem}>
                               <span className={styles.noteAuthor}>System</span>
                               <p>Submission received from mobile touchpoint.</p>
                               <span className={styles.noteTime}>Just now</span>
                            </div>
                         </div>
                         <div className={styles.noteInputArea}>
                            <textarea 
                              placeholder="Add an internal note..." 
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                            />
                            <button className={styles.noteSendBtn}><Send size={16} /></button>
                         </div>
                      </section>
                   </div>

                   {/* Right Col: Actions */}
                   <div className={styles.detailSidebar}>
                      <div className={styles.actionGroup}>
                         <h4 className={styles.detailLabel}>Management</h4>
                         
                         <div className={styles.controlItem}>
                            <label>Status</label>
                            <select 
                              value={selectedSubmission.status}
                              onChange={(e) => handleUpdateStatus(selectedSubmission.id, e.target.value)}
                            >
                               {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
</div>

                          {currentRole !== 'DEPARTMENT_ADMIN' && (
                          <div className={styles.controlItem}>
                             <label>Assign Department</label>
                             <select 
                               value={selectedSubmission.department}
                               onChange={(e) => handleAssignDept(selectedSubmission.id, e.target.value)}
                             >
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                             </select>
                          </div>
                          )}
                       </div>

                      <div className={styles.dangerZone}>
                        <button className={styles.archiveBtn}>
                          <Trash2 size={16} />
                          Archive Submission
                        </button>
                      </div>
                   </div>
                </div>
             </div>

             <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setSelectedSubmission(null)}>Close</button>
                <button className={styles.createButton}>
                   <CheckCircle2 size={18} />
                   Mark as Resolved
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
