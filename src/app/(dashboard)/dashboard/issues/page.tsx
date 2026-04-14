"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  User,
  Shield,
  Send,
  MoreVertical
} from "lucide-react";
import styles from "../../Dashboard.module.css";

// Industry Standard Mock Data for Issues
const INITIAL_ISSUES = [
  { 
    id: "ISSue-001", 
    status: "pending", 
    type: "Complaint", 
    priority: "high", 
    location: "Gate 4 - Abuja", 
    title: "Security Wait Time", 
    description: "Extremely long wait time at security check. Staff shortages reported.",
    time: "4h ago",
    department: "Security"
  },
  { 
    id: "ISSue-002", 
    status: "in-progress", 
    type: "Incident", 
    priority: "critical", 
    location: "Carousel 3 - Lagos", 
    title: "Liquid Spill", 
    description: "Major liquid spill near baggage claim. Risk of slip and fall.",
    time: "1h ago",
    department: "Janitorial"
  },
  { 
    id: "ISSue-003", 
    status: "pending", 
    type: "Maintenance", 
    priority: "medium", 
    location: "Restroom T1 - Abuja", 
    title: "Water Leak", 
    description: "Sink faucet in the male restroom is leaking continuously.",
    time: "6h ago",
    department: "Facilities"
  },
  { 
    id: "ISSue-004", 
    status: "resolved", 
    type: "Feedback", 
    priority: "low", 
    location: "VIP Lounge - Abuja", 
    title: "AC Satisfaction", 
    description: "AC temp is now adjusted. Passenger confirmed comfort.",
    time: "1d ago",
    department: "Operations"
  }
];

export default function IssueManagementPage() {
  const [issues, setIssues] = useState(INITIAL_ISSUES);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    department: "Security",
    location: ""
  });

  const onDragStart = (id: string) => {
    setDraggedIssueId(id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (status: string) => {
    if (!draggedIssueId) return;
    setIssues(issues.map(issue => 
      issue.id === draggedIssueId ? { ...issue, status } : issue
    ));
    setDraggedIssueId(null);
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const created = {
      id: `ISSue-${Math.floor(Math.random() * 9000) + 1000}`,
      status: "pending",
      type: "Manual",
      priority: newTask.priority,
      location: newTask.location,
      title: newTask.title,
      description: newTask.description,
      time: "Just now",
      department: newTask.department
    };
    // @ts-ignore
    setIssues([created, ...issues]);
    setIsCreateModalOpen(false);
    setNewTask({ title: "", description: "", priority: "medium", department: "Security", location: "" });
  };

  const getStatusIssues = (status: string) => issues.filter(i => i.status === status);

  const Column = ({ title, status, color }: { title: string, status: string, color: string }) => (
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
        {getStatusIssues(status).map(issue => (
          <div 
            key={issue.id} 
            className={styles.issueCard}
            draggable
            onDragStart={() => onDragStart(issue.id)}
            onClick={() => setSelectedIssue(issue)}
          >
            <div className={styles.cardHeader}>
              <span className={`${styles.priorityTagSmall} ${styles[issue.priority]}`}>{issue.priority}</span>
              <button className={styles.cardMore}><MoreVertical size={14} /></button>
            </div>
            <h4 className={styles.cardTitle}>{issue.title}</h4>
            <p className={styles.cardDesc}>{issue.description}</p>
            
            <div className={styles.cardFooter}>
              <div className={styles.cardMeta}>
                <MapPin size={12} />
                <span>{issue.location}</span>
              </div>
              <div className={styles.cardMeta}>
                <Clock size={12} />
                <span>{issue.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
           <button className={styles.createButton} onClick={() => setIsCreateModalOpen(true)}>
             <Plus size={18} />
             <span>New Task</span>
           </button>
        </div>
      </div>

      <div className={styles.kanbanBoard}>
        <Column title="Pending" status="pending" color="#ef4444" />
        <Column title="In Progress" status="in-progress" color="#f59e0b" />
        <Column title="Resolved" status="resolved" color="#22c55e" />
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
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                            <option value="critical">Critical (Immediate)</option>
                          </select>
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Handling Department</label>
                        <div className={styles.modalInputWrapper}>
                          <Shield size={18} />
                          <select 
                            value={newTask.department}
                            onChange={(e) => setNewTask({...newTask, department: e.target.value})}
                          >
                            <option value="Security">Aviation Security</option>
                            <option value="Facilities">Facilities & Assets</option>
                            <option value="Operations">Operations Control</option>
                            <option value="Janitorial">Janitorial Services</option>
                          </select>
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
                  <span className={`${styles.priorityTag} ${styles[selectedIssue.priority]}`}>
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
                            <div><span>Location</span><strong>{selectedIssue.location}</strong></div>
                         </div>
                         <div className={styles.infoCard}>
                            <Shield size={18} />
                            <div><span>Dept</span><strong>{selectedIssue.department}</strong></div>
                         </div>
                         <div className={styles.infoCard}>
                            <Clock size={18} />
                            <div><span>Created</span><strong>{selectedIssue.time}</strong></div>
                         </div>
                      </div>

                      <section className={styles.internalNotes}>
                         <h4 className={styles.detailLabel}>Internal Updates</h4>
                         <div className={styles.notesList}>
                            <div className={styles.noteItem}>
                               <span className={styles.noteAuthor}>System</span>
                               <p>Issue flagged from touchpoint submission.</p>
                               <span className={styles.noteTime}>Just now</span>
                            </div>
                         </div>
                         <div className={styles.noteInputArea}>
                            <textarea placeholder="Add a status update..." />
                            <button className={styles.noteSendBtn}><Send size={16} /></button>
                         </div>
                      </section>
                   </div>

                   <div className={styles.detailSidebar}>
                      <div className={styles.actionGroup}>
                         <h4 className={styles.detailLabel}>Status Control</h4>
                         
                         <div className={styles.controlItem}>
                            <label>Current Column</label>
                            <select value={selectedIssue.status} onChange={(e) => {
                               setIssues(issues.map(i => i.id === selectedIssue.id ? { ...i, status: e.target.value } : i));
                               setSelectedIssue({...selectedIssue, status: e.target.value});
                            }}>
                               <option value="pending">Pending</option>
                               <option value="in-progress">In Progress</option>
                               <option value="resolved">Resolved</option>
                            </select>
                         </div>

                         <div className={styles.controlItem}>
                            <label>Owner Assignment</label>
                            <select defaultValue="unassigned">
                               <option value="unassigned">Unassigned</option>
                               <option value="dept-head">Dept. Head</option>
                               <option value="ops-team">Ops Team A</option>
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
                <button className={styles.createButton}>
                   <CheckCircle2 size={18} />
                   Resolve Issue
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
