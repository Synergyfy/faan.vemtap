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


import { 
  useSubmissions, 
  useSubmission, 
  useUpdateSubmission, 
  useAddSubmissionNote 
} from "@/hooks/useSubmissions";
import { useDepartments } from "@/hooks/useDepartments";

export default function SubmissionsPage() {
  const { currentRole, currentLocation, currentDepartment } = useRole();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Queries
  const { data: submissionsData, isLoading: listLoading } = useSubmissions({
    search: searchTerm || undefined,
    locationId: currentLocation || undefined,
    departmentId: currentDepartment || undefined,
  });

  const { data: detail, isLoading: detailLoading } = useSubmission(selectedUuid || "");
  const { data: deptsData } = useDepartments();

  // Mutations
  const updateMutation = useUpdateSubmission(selectedUuid || "");
  const noteMutation = useAddSubmissionNote(selectedUuid || "");

  const handleUpdateStatus = (uuid: string, status: any) => {
    updateMutation.mutate({ status });
  };

  const handleAssignDept = (uuid: string, departmentId: string) => {
    updateMutation.mutate({ departmentId });
  };

  const handleAddNote = () => {
    if (!noteContent.trim() || !selectedUuid) return;
    noteMutation.mutate({ content: noteContent }, {
      onSuccess: () => setNoteContent("")
    });
  };

  const submissions = submissionsData?.data || [];
  const depts = deptsData?.data || [];

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
            {submissions.map((sub) => (
              <tr key={sub.id} className={styles.clickableRow} onClick={() => setSelectedUuid(sub.uuid)}>
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
                    <span>{new Date(sub.submittedAt).toLocaleString()}</span>
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
      {selectedUuid && detail && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.detailModal}`}>
             <div className={styles.modalHeader}>
                <div className={styles.modalTitleGroup}>
                  <span className={`${styles.priorityTag} ${styles[detail.priority.toLowerCase()]}`}>
                    {detail.priority} Priority
                  </span>
                  <h3 className={styles.modalTitle}>{detail.id} Detail</h3>
                </div>
                <button className={styles.closeBtn} onClick={() => setSelectedUuid(null)}><X size={20} /></button>
             </div>

             <div className={styles.modalBody}>
                <div className={styles.detailGrid}>
                   {/* Left Col: Info */}
                   <div className={styles.detailMain}>
                      <section className={styles.messageSection}>
                         <h4 className={styles.detailLabel}>Dynamic Submission Data</h4>
                         <div className={styles.dynamicDataCard}>
                            {detail.formData && Object.entries(detail.formData).map(([key, value]: [string, any]) => (
                                <div key={key} className={styles.dataField}>
                                   <span className={styles.smallLabel}>{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                                   <div className={styles.fieldValueContainer}>
                                      {key.toLowerCase().includes('rating') ? (
                                        <div className={styles.miniStars}>
                                          {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} fill={i < (value as number) ? "#fbbf24" : "none"} color={i < (value as number) ? "#fbbf24" : "#e2e8f0"} />
                                          ))}
                                        </div>
                                      ) : (
                                        <span className={styles.fieldValueText}>{value?.toString() || '—'}</span>
                                      )}
                                   </div>
                                </div>
                            ))}
                         </div>
                      </section>

                      <div className={styles.infoCards}>
                         <div className={styles.infoCard}>
                            <MapPin size={18} />
                            <div>
                               <span>Location Area</span>
                               <strong>{typeof detail.location === 'string' ? detail.location : detail.location?.name}</strong>
                            </div>
                         </div>
                         <div className={styles.infoCard}>
                            <User size={18} />
                            <div>
                               <span>Touchpoint Type</span>
                               <strong>{detail.type}</strong>
                            </div>
                         </div>
                         <div className={styles.infoCard}>
                            <Clock size={18} />
                            <div>
                               <span>Timestamp</span>
                               <strong>{new Date(detail.submittedAt).toLocaleString()}</strong>
                            </div>
                         </div>
                      </div>

                      <section className={styles.internalNotes}>
                         <h4 className={styles.detailLabel}>Internal Notes</h4>
                         <div className={styles.notesList}>
                            {detail.internalNotes?.map((note, idx) => (
                               <div key={idx} className={styles.noteItem}>
                                  <span className={styles.noteAuthor}>{note.author}</span>
                                  <p>{note.content}</p>
                                  <span className={styles.noteTime}>{new Date(note.time).toLocaleString()}</span>
                               </div>
                            ))}
                         </div>
                         <div className={styles.noteInputArea}>
                            <textarea 
                              placeholder="Add an internal note..." 
                              value={noteContent}
                              onChange={(e) => setNoteContent(e.target.value)}
                            />
                            <button className={styles.noteSendBtn} onClick={handleAddNote}><Send size={16} /></button>
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
                              value={detail.status}
                              onChange={(e) => handleUpdateStatus(detail.uuid, e.target.value)}
                            >
                               <option value="OPEN">Open</option>
                               <option value="IN_PROGRESS">In Progress</option>
                               <option value="RESOLVED">Resolved</option>
                               <option value="ARCHIVED">Archived</option>
                            </select>
                         </div>

                          {currentRole !== 'DEPARTMENT_ADMIN' && (
                          <div className={styles.controlItem}>
                             <label>Assign Department</label>
                             <select 
                               value={typeof detail.department === 'string' ? detail.department : (detail.department as any)?.id}
                               onChange={(e) => handleAssignDept(detail.uuid, e.target.value)}
                             >
                                <option value="">Select Dept</option>
                                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                             </select>
                          </div>
                          )}
                       </div>
                   </div>
                </div>
             </div>

             <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setSelectedUuid(null)}>Close</button>
                <button 
                  className={styles.createButton}
                  onClick={() => handleUpdateStatus(detail.uuid, 'RESOLVED')}
                >
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
