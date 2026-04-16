"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  Plus,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  Shield,
  Send,
  MoreVertical
} from "lucide-react";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { 
  useKanban, 
  useUpdateIssueStatus, 
  useCreateIssue, 
  useAddIssueNote 
} from "@/hooks/useIssues";
import { useLocations } from "@/hooks/useLocations";
import { useDepartments } from "@/hooks/useDepartments";
import { InternalReport, InternalReportStatus, Priority, ReportType, Department, UserProfile } from "@/types/api";

interface ColumnProps {
  title: string;
  status: InternalReportStatus | string;
  color: string;
  getStatusIssues: (status: string) => InternalReport[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (status: string) => void;
}

function Column({ title, status, color, getStatusIssues, onDragOver, onDrop }: ColumnProps) {
  return (
    <div 
      className={styles.kanbanColumn}
      onDragOver={onDragOver}
      onDrop={() => onDrop(status)}
    >
      <div className={styles.columnHeader}>
        <div className={styles.columnTitleGroup}>
           <div className={styles.dot} style={{ backgroundColor: color }} />
           <h3 className={styles.columnTitle}>{title}</h3>
           <span className={styles.columnCount}>{getStatusIssues(status).length}</span>
        </div>
        <button className={styles.columnAction}><Plus size={16} /></button>
      </div>

      <div className={styles.columnCards}>
        {getStatusIssues(status).map((issue: InternalReport) => (
          <div 
            key={issue.uuid} 
            className={styles.issueCard}
            draggable
            onDragStart={() => {}}
            onClick={() => {}}
          >
            <div className={styles.cardHeader}>
              <span className={`${styles.priorityTagSmall} ${styles[issue.priority.toLowerCase()]}`}>{issue.priority}</span>
              <button className={styles.cardMore}><MoreVertical size={14} /></button>
            </div>
            <h4 className={styles.cardTitle}>{issue.title}</h4>
            <p className={styles.cardDesc}>{issue.content}</p>
            
            <div className={styles.cardFooter}>
              <div className={styles.cardMeta}>
                <MapPin size={12} />
                <span>{}</span>
              </div>
              <div className={styles.cardMeta}>
                <Clock size={12} />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IssueManagementPage() {
  const { currentRole, currentDepartment, currentLocation } = useRole();
  const [selectedIssue, setSelectedIssue] = useState<InternalReport | null>(null);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState("");
  const [tempLocId, setTempLocId] = useState("");
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    departmentId: "",
    location: ""
  });

  const [newComment, setNewComment] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [issues, setIssues] = useState<InternalReport[]>([]);

  // Queries
  const { data: kanbanData, isLoading: kanbanLoading } = useKanban({
    locationId: currentLocation || undefined,
    departmentId: currentDepartment || undefined
  });

  const { data: locationsData } = useLocations();
  const { data: deptsData } = useDepartments();

  // Mutations
  const updateStatusMutation = useUpdateIssueStatus();
  const createIssueMutation = useCreateIssue();
  const addNoteMutation = useAddIssueNote();

  const onDragStart = (id: string) => {
    setDraggedIssueId(id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (status: string) => {
    if (!draggedIssueId) return;
    updateStatusMutation.mutate({ 
      uuid: draggedIssueId, 
      status: status.toUpperCase() as InternalReportStatus 
    });
    setDraggedIssueId(null);
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    createIssueMutation.mutate({
      title: newTask.title,
      content: newTask.description, // Map UI description to API content
      priority: newTask.priority as Priority,
      locationId: currentRole === 'DEPARTMENT_ADMIN' ? (currentLocation || "") : selectedLocId,
      departmentId: currentRole === 'DEPARTMENT_ADMIN' ? (currentDepartment || "") : newTask.departmentId,
      reportType: ReportType.INCIDENT
    }, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setNewTask({ title: "", description: "", priority: "MEDIUM", departmentId: "", location: "" });
      }
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedIssue) return;
    addNoteMutation.mutate({ uuid: selectedIssue.uuid, content: newComment }, {
      onSuccess: () => setNewComment("")
    });
  };

  const getStatusIssues = (status: string): InternalReport[] => {
    if (!kanbanData) return [];
    return kanbanData[status.toLowerCase() as keyof typeof kanbanData] || [];
  };

  const locations = locationsData?.data || [];
  const depts = deptsData?.data || [];

  const formatEntityName = (entity: string | { name: string } | null) => {
    if (!entity) return 'General';
    if (typeof entity === 'object') return (entity as { name: string }).name;
    return entity;
  };

  const issueDepartmentId = useMemo(() => {
    if (!selectedIssue) return null;
    if (typeof selectedIssue.department === 'object' && selectedIssue.department !== null) {
      const deptObj = selectedIssue.department as Department;
      return deptObj.id;
    }
    const dept = depts.find((d: Department) => d.name === selectedIssue.department || d.id === (selectedIssue.department as string));
    return dept?.id || null;
  }, [selectedIssue, depts]);

  const departmentUsers = useMemo(() => {
    if (!issueDepartmentId) return [];
    const dept = depts.find(d => d.id === issueDepartmentId);
    return dept?.users ?? [];
  }, [issueDepartmentId, depts]);

  return (
    <div className={styles.touchpointsLayout}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Issue Management</h2>
          <p className={styles.pageSubtitle}>Monitor real-time operational issues and track resolution progress.</p>
        </div>
        <div className={styles.headerActions}>
           <div className={styles.kanbanSearch}>
              <Search size={18} />
              <input type="text" placeholder="Search issues..." />
           </div>
<button className={styles.createButton} onClick={() => {
              if (currentRole === 'DEPARTMENT_ADMIN') {
                setSelectedLocation(currentDepartment || "Security");
                setIsCreateModalOpen(true);
              } else {
                setShowLocationPicker(true);
              }
            }}>
              <Plus size={18} />
              <span>New Task</span>
            </button>
        </div>
      </div>

      <div className={styles.kanbanBoard}>
        <Column title="Pending" status="pending" color="#ef4444" getStatusIssues={getStatusIssues} onDragOver={onDragOver} onDrop={onDrop} />
        <Column title="In Progress" status="in-progress" color="#f59e0b" getStatusIssues={getStatusIssues} onDragOver={onDragOver} onDrop={onDrop} />
        <Column title="Resolved" status="resolved" color="#22c55e" getStatusIssues={getStatusIssues} onDragOver={onDragOver} onDrop={onDrop} />
      </div>

      {/* CREATE NEW TASK MODAL */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Report New Operational Issue</h3>
                <button className={styles.closeBtn} onClick={() => setIsCreateModalOpen(false)}><X size={20} /></button>
             </div>
             <form onSubmit={handleCreateIssue}>
              <div className={styles.modalBody}>
                <div style={{ 
                  background: "#f0fdf4", 
                  border: "1px solid #bbf7d0", 
                  borderRadius: "8px", 
                  padding: "12px 16px", 
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  {currentRole === 'DEPARTMENT_ADMIN' ? (
                    <>
                      <Shield size={16} style={{ color: "#16a34a" }} />
                      <span style={{ color: "#166534", fontWeight: 500 }}>Creating task for department: {currentDepartment || "Security"}</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={16} style={{ color: "#16a34a" }} />
                      <span style={{ color: "#166534", fontWeight: 500 }}>Creating task for: {selectedLocation}</span>
                    </>
                  )}
                </div>
                <div className={styles.modalForm}>
                   <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Issue Title</label>
                        <span className={styles.fieldDesc}>Briefly describe what happened (e.g. Elevator Down).</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <Plus size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. Broken Glass at T3" 
                          required 
                          value={newTask.title}
                          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Exact Location</label>
                        <span className={styles.fieldDesc}>Specify the terminal, gate, or floor.</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <MapPin size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. Terminal 2, Near Gate 44" 
                          required 
                          value={newTask.location}
                          onChange={(e) => setNewTask({...newTask, location: e.target.value})}
                        />
                      </div>
                   </div>

                    <div className={styles.formGrid}>
                       <div className={styles.formGroup}>
                         <label className={styles.formLabel}>Urgency / Priority</label>
                         <div className={styles.modalInputWrapper}>
                           <AlertCircle size={18} />
                           <select 
                             value={newTask.priority}
                             onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                           >
                             <option value="LOW">Low Priority</option>
                             <option value="MEDIUM">Medium Priority</option>
                             <option value="HIGH">High Priority</option>
                             <option value="CRITICAL">Critical (Immediate)</option>
                           </select>
                         </div>
                       </div>
                       <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            {currentRole === 'DEPARTMENT_ADMIN' ? 'Department (Auto-assigned)' : 'Handling Department'}
                          </label>
                          <div className={styles.modalInputWrapper}>
                            <Shield size={18} />
                            {currentRole === 'DEPARTMENT_ADMIN' ? (
                              <input 
                                type="text" 
                                value={currentDepartment || "Security"} 
                                disabled 
                                style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                              />
                            ) : (
                              <select 
                                value={newTask.departmentId}
                                onChange={(e) => setNewTask({...newTask, departmentId: e.target.value})}
                              >
                                <option value="">Select Department</option>
                                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                            )}
                          </div>
                        </div>
                    </div>

                   <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Operational Details</label>
                        <span className={styles.fieldDesc}>Provide as much detail as possible for the responding team.</span>
                      </div>
                      <textarea 
                        placeholder="Describe the situation here..." 
                        required 
                        className={styles.modalTextarea}
                        style={{ height: "120px", marginTop: "8px" }}
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      />
                   </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.createButton}>Create Task</button>
              </div>
             </form>
          </div>
        </div>
      )}

      {/* ISSUE DETAIL VIEW */}
      {selectedIssue && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.detailModal}`}>
             <div className={styles.modalHeader}>
                <div className={styles.modalTitleGroup}>
                  <span className={`${styles.priorityTag} ${styles[selectedIssue.priority.toLowerCase()]}`}>
                    {selectedIssue.priority} Priority
                  </span>
                  <h3 className={styles.modalTitle}>{selectedIssue.title}</h3>
                </div>
                <button className={styles.closeBtn} onClick={() => setSelectedIssue(null)}><X size={20} /></button>
             </div>

             <div className={styles.modalBody}>
                <div className={styles.detailGrid}>
                   <div className={styles.detailMain}>
                      <section className={styles.messageSection}>
                         <h4 className={styles.detailLabel}>Issue Description</h4>
                         <div className={styles.messageCard}>
                            <p>{selectedIssue.description}</p>
                         </div>
                      </section>

                      <div className={styles.infoCards}>
                         <div className={styles.infoCard}>
                            <MapPin size={18} />
                            <div><span>Location</span><strong>{formatEntityName(selectedIssue.location)}</strong></div>
                         </div>
                         <div className={styles.infoCard}>
                            <Shield size={18} />
                            <div><span>Dept</span><strong>{formatEntityName(selectedIssue.department)}</strong></div>
                         </div>
                         <div className={styles.infoCard}>
                            <Clock size={18} />
                            <div><span>Created</span><strong>{new Date(selectedIssue.createdAt).toLocaleString()}</strong></div>
                         </div>
                      </div>

<section className={styles.internalNotes}>
                          <h4 className={styles.detailLabel}>Internal Updates</h4>
                          <div className={styles.notesList}>
                             {selectedIssue.internalNotes?.map((note: { author: string; content: string; time: string }, idx: number) => (
                               <div key={idx} className={styles.noteItem}>
                                  <span className={styles.noteAuthor}>{note.author}</span>
                                  <p>{note.content}</p>
                                  <span className={styles.noteTime}>{new Date(note.time).toLocaleString()}</span>
                               </div>
                             ))}
                          </div>
                          {currentRole === 'DEPARTMENT_ADMIN' && (
                          <div className={styles.noteInputArea}>
                             <textarea 
                               placeholder="Add a comment..." 
                               value={newComment}
                               onChange={(e) => setNewComment(e.target.value)}
                             />
                             <button className={styles.noteSendBtn} onClick={handleAddComment}><Send size={16} /></button>
                          </div>
                          )}

                          {currentRole === 'DEPARTMENT_ADMIN' && (
                          <section className={styles.internalNotes} style={{ marginTop: '20px' }}>
                             <h4 className={styles.detailLabel}>Attach Proof (Optional)</h4>
                             <div style={{ 
                               border: '2px dashed #e2e8f0', 
                               borderRadius: '8px', 
                               padding: '20px', 
                               textAlign: 'center',
                               cursor: 'pointer',
                               background: '#f8fafc'
                             }}>
                               <p style={{ color: '#64748b', fontSize: '14px' }}>
                                 Click to upload image proof or drag and drop
                               </p>
                               <input 
                                 type="file" 
                                 accept="image/*" 
                                 style={{ display: 'none' }}
                                 id="proof-upload"
                               />
                               <label 
                                 htmlFor="proof-upload" 
                                 style={{ 
                                   display: 'inline-block', 
                                   marginTop: '10px',
                                   padding: '8px 16px', 
                                   background: '#2563eb', 
                                   color: 'white', 
                                   borderRadius: '6px',
                                   cursor: 'pointer',
                                   fontSize: '13px'
                                 }}
                               >
                                 Choose File
                               </label>
                             </div>
                          </section>
                          )}
                       </section>
                   </div>

                   <div className={styles.detailSidebar}>
                      <div className={styles.actionGroup}>
                         <h4 className={styles.detailLabel}>Status Control</h4>
                         
                         <div className={styles.controlItem}>
                            <label>Current Column</label>
                            <select value={selectedIssue.status} onChange={(e) => {
                               const newStatus = e.target.value as InternalReportStatus;
                               setIssues(issues.map(i => i.id === selectedIssue.id ? { ...i, status: newStatus } : i));
                               setSelectedIssue({...selectedIssue, status: newStatus});
                            }}>
                               <option value="PENDING">Pending</option>
                               <option value="IN_PROGRESS">In Progress</option>
                               <option value="RESOLVED">Resolved</option>
                            </select>
                         </div>

<div className={styles.controlItem}>
                             <label>Owner Assignment</label>
                             <select defaultValue="unassigned">
                                <option value="unassigned">Unassigned</option>
                                {departmentUsers.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.role})
                                  </option>
                                ))}
                             </select>
                          </div>
                      </div>

                      <div className={styles.dangerZone}>
                        <button className={styles.archiveBtn}><Trash2 size={16} /> Archive Issue</button>
                      </div>
                   </div>
                </div>
             </div>

<div className={styles.modalActions}>
                 <button className={styles.cancelBtn} onClick={() => setSelectedIssue(null)}>Close</button>
                 <button className={styles.createButton} onClick={() => {
                    setIssues(issues.map(i => i.id === selectedIssue.id ? { ...i, status: selectedIssue.status } : i));
                    setSelectedIssue(null);
                 }}>
                    <CheckCircle2 size={18} />
                    Save
                 </button>
              </div>
           </div>
         </div>
       )}

       {/* LOCATION PICKER MODAL */}
       {showLocationPicker && (
         <div className={styles.modalOverlay} onClick={() => setShowLocationPicker(false)}>
           <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
             <div className={styles.previewHeader}>
               <h3 className={styles.previewTitle}>Select Location</h3>
               <button className={styles.closeBtn} onClick={() => setShowLocationPicker(false)}><X size={20} /></button>
             </div>
             <div style={{ padding: "20px" }}>
               <p style={{ marginBottom: "16px", color: "#64748b", fontSize: "14px" }}>
                 Choose the airport location for this task.
               </p>
               <div style={{ marginBottom: "20px" }}>
                 <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                   Airport Location
                 </label>
                <select
                   value={tempLocId}
                   onChange={(e) => setTempLocId(e.target.value)}
                   style={{
                     width: "100%",
                     padding: "12px 16px",
                     border: "1px solid #e2e8f0",
                     borderRadius: "8px",
                     fontSize: "15px",
                     background: "white",
                     color: "#1e293b",
                   }}
                 >
                   <option value="">Select an airport</option>
                   {locations.map((loc) => (
                     <option key={loc.id} value={loc.id}>{loc.name}</option>
                   ))}
                 </select>
               </div>
               <button
                 onClick={() => {
                   setSelectedLocId(tempLocId);
                   setShowLocationPicker(false);
                   setIsCreateModalOpen(true);
                 }}
                 disabled={!tempLocId}
                 style={{
                   width: "100%",
                   padding: "12px",
                   background: tempLocId ? "#2563eb" : "#94a3b8",
                   color: "white",
                   border: "none",
                   borderRadius: "8px",
                   fontSize: "15px",
                   fontWeight: 600,
                   cursor: tempLocId ? "pointer" : "not-allowed",
                 }}
               >
                 Confirm
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
