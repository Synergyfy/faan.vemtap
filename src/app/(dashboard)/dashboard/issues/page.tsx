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
  MoreVertical,
  Building2,
  AlertTriangle,
  CheckCircle,
  Circle,
  Loader2,
  FileWarning,
  User,
  Upload
} from "lucide-react";
import Image from "next/image";
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
  icon: React.ReactNode;
  getStatusIssues: (status: string) => InternalReport[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (status: string) => void;
  onSelectIssue: (issue: InternalReport) => void;
}

function Column({ title, status, color, icon, getStatusIssues, onDragOver, onDrop, onSelectIssue }: ColumnProps) {
  const issues = getStatusIssues(status);
  
  return (
    <div 
      className={styles.kanbanColumn}
      onDragOver={onDragOver}
      onDrop={() => onDrop(status)}
      style={{ 
        background: `linear-gradient(180deg, ${color}08 0%, ${color}02 100%)`,
        borderTop: `3px solid ${color}`
      }}
    >
      <div className={styles.columnHeader}>
        <div className={styles.columnTitleGroup}>
          <div style={{ 
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color
          }}>
            {icon}
          </div>
          <h3 className={styles.columnTitle}>{title}</h3>
          <span className={styles.columnCount} style={{ background: `${color}15`, color: color }}>{issues.length}</span>
        </div>
      </div>

      <div className={styles.columnCards}>
        {issues.length === 0 ? (
          <div style={{ 
            padding: '32px 16px', 
            textAlign: 'center', 
            color: '#94a3b8',
            background: 'white',
            borderRadius: '16px',
            border: '1px dashed #e2e8f0'
          }}>
            <Circle size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p style={{ fontSize: '12px', fontWeight: 500 }}>No issues</p>
          </div>
        ) : (
          issues.map((issue: InternalReport) => (
            <div 
              key={issue.uuid} 
              className={styles.issueCard}
              draggable
              onDragStart={() => {}}
              onClick={() => onSelectIssue(issue)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.cardHeader}>
                <span 
                  className={styles.priorityTagSmall} 
                  style={{ 
                    background: issue.priority === 'CRITICAL' ? '#fee2e2' : 
                               issue.priority === 'HIGH' ? '#ffedd5' :
                               issue.priority === 'MEDIUM' ? '#fef9c3' : '#f0fdf4',
                    color: issue.priority === 'CRITICAL' ? '#ef4444' : 
                           issue.priority === 'HIGH' ? '#f97316' :
                           issue.priority === 'MEDIUM' ? '#ca8a04' : '#22c55e'
                  }}
                >
                  {issue.priority}
                </span>
                <button className={styles.cardMore} onClick={(e) => e.stopPropagation()}>
                  <MoreVertical size={14} />
                </button>
              </div>
              <h4 className={styles.cardTitle}>{issue.title}</h4>
              <p className={styles.cardDesc}>{issue.content}</p>
              
              <div className={styles.cardFooter}>
                <div className={styles.cardMeta}>
                  <MapPin size={12} />
                  <span>{typeof issue.location === 'object' ? (issue.location as any)?.name || 'Unknown' : issue.location || 'Unknown'}</span>
                </div>
                <div className={styles.cardMeta}>
                  <Clock size={12} />
                  <span>{new Date(issue.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function IssueManagementPage() {
  const { currentRole, currentDepartment, currentLocation, locationName: roleLocationName } = useRole();
  const [selectedIssue, setSelectedIssue] = useState<InternalReport | null>(null);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState("");
  const [tempLocId, setTempLocId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
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

  const { data: kanbanData, isLoading: kanbanLoading } = useKanban({
    locationId: currentLocation || undefined,
    departmentId: currentDepartment || undefined
  });

  const { data: locationsData } = useLocations();
  const { data: deptsData } = useDepartments();

  const updateStatusMutation = useUpdateIssueStatus();
  const createIssueMutation = useCreateIssue();
  const addNoteMutation = useAddIssueNote();

  const pendingIssues = kanbanData?.pending || [];
  const inProgressIssues = kanbanData?.['in-progress'] || kanbanData?.inProgress || [];
  const resolvedIssues = kanbanData?.resolved || [];
  
  const totalIssues = pendingIssues.length + inProgressIssues.length + resolvedIssues.length;
  const criticalCount = [...pendingIssues, ...inProgressIssues].filter((i: InternalReport) => i.priority === 'CRITICAL' || i.priority === 'HIGH').length;

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
      content: newTask.description,
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
    const key = status.toLowerCase().replace('-', '') as keyof typeof kanbanData;
    const alternativeKey = status.toLowerCase() as keyof typeof kanbanData;
    return (kanbanData[key] || kanbanData[alternativeKey] || []) as InternalReport[];
  };

  const locations = locationsData?.data || [];
  const depts = deptsData?.data || [];

  const formatEntityName = (entity: string | { name: string } | null) => {
    if (!entity) return 'General';
    if (typeof entity === 'object') return (entity as { name: string }).name;
    return entity;
  };

  const scopeLabel =
    currentRole === "DEPARTMENT_ADMIN"
      ? currentDepartment || "Your Department"
      : currentRole === "LOCATION_ADMIN"
      ? roleLocationName || "Your Location"
      : "All Locations";

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
      <div className={styles.deptHero}>
        <div className={styles.deptHeroMain}>
          <div className={styles.deptHeroTitleRow}>
            <div className={styles.deptHeroMark} aria-hidden="true">
              <Image src="/Faan.logo_.png" alt="" width={34} height={34} />
            </div>
            <div className={styles.deptHeroText}>
              <h2 className={styles.deptHeroTitle}>Issue Tracking</h2>
              <p className={styles.deptHeroSubtitle}>
                Real-time operational issue management with status tracking, assignment, and resolution workflow.
              </p>
            </div>
          </div>
          <div className={styles.deptHeroPills}>
            <span className={styles.deptPill}>
              <MapPin size={14} />
              <span>Scope: {scopeLabel}</span>
            </span>
            <span className={styles.deptPillMuted}>
              <Shield size={14} />
              <span>{currentRole === 'DEPARTMENT_ADMIN' ? 'Department Admin' : currentRole === 'LOCATION_ADMIN' ? 'Location Admin' : 'System Admin'}</span>
            </span>
          </div>
        </div>

        <div className={styles.deptHeroActions}>
          <button
            className={styles.createButton}
            onClick={() => {
              if (currentRole === 'DEPARTMENT_ADMIN') {
                setSelectedLocation(currentDepartment || "Security");
                setIsCreateModalOpen(true);
              } else {
                setShowLocationPicker(true);
              }
            }}
          >
            <Plus size={18} />
            <span>New Issue</span>
          </button>
          <p className={styles.deptHeroHint}>Report operational issues for immediate resolution.</p>
        </div>
      </div>

      <div className={styles.deptStatsGrid} aria-label="Issues summary">
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.22)', color: '#ef4444' }} aria-hidden="true">
            <AlertCircle size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Pending</div>
            <div className={styles.deptStatValue}>{pendingIssues.length}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.22)', color: '#f59e0b' }} aria-hidden="true">
            <Loader2 size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>In Progress</div>
            <div className={styles.deptStatValue}>{inProgressIssues.length}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.22)', color: '#22c55e' }} aria-hidden="true">
            <CheckCircle size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Resolved</div>
            <div className={styles.deptStatValue}>{resolvedIssues.length}</div>
          </div>
        </div>
      </div>

      <div className={styles.deptControlsCard}>
        <div className={styles.deptControlsRow}>
          <div className={`${styles.searchBar} ${styles.deptSearchBar}`}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search issues by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.deptControlsMeta} aria-live="polite">
            {kanbanLoading ? (
              <span>Loading...</span>
            ) : (
              <span>
                Total: <strong>{totalIssues}</strong> {criticalCount > 0 && <span style={{ color: '#ef4444', marginLeft: '12px' }}>Critical/High: <strong>{criticalCount}</strong></span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {kanbanLoading ? (
        <div className={styles.deptGrid} aria-label="Loading issues">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`issue-skeleton-${i}`} className={`${styles.deptCard} ${styles.deptSkeletonCard}`}>
              <div className={styles.deptCardHeader}>
                <div className={styles.deptSkeletonIcon} />
                <div className={styles.deptSkeletonMenu} />
              </div>
              <div className={styles.deptCardInfo}>
                <div className={styles.deptSkeletonLine} style={{ width: "70%" }} />
                <div className={styles.deptSkeletonLine} style={{ width: "95%" }} />
                <div className={styles.deptSkeletonLine} style={{ width: "60%" }} />
              </div>
              <div className={styles.deptSkeletonBtn} />
            </div>
          ))}
        </div>
      ) : totalIssues === 0 ? (
        <div className={styles.deptEmptyState} role="status">
          <div className={styles.deptEmptyIcon} aria-hidden="true">
            <FileWarning size={22} />
          </div>
          <h3 className={styles.deptEmptyTitle}>No issues reported</h3>
          <p className={styles.deptEmptyText}>
            All operational issues have been resolved. Report a new issue if you spot any problems.
          </p>
          <div className={styles.deptEmptyActions}>
            <button
              className={styles.createButton}
              onClick={() => {
                if (currentRole === 'DEPARTMENT_ADMIN') {
                  setSelectedLocation(currentDepartment || "Security");
                  setIsCreateModalOpen(true);
                } else {
                  setShowLocationPicker(true);
                }
              }}
            >
              <Plus size={18} />
              <span>Report Issue</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.kanbanBoard}>
          <Column 
            title="Pending" 
            status="pending" 
            color="#ef4444"
            icon={<AlertCircle size={16} />}
            getStatusIssues={getStatusIssues} 
            onDragOver={onDragOver} 
            onDrop={onDrop}
            onSelectIssue={setSelectedIssue}
          />
          <Column 
            title="In Progress" 
            status="in-progress" 
            color="#f59e0b"
            icon={<Loader2 size={16} />}
            getStatusIssues={getStatusIssues} 
            onDragOver={onDragOver} 
            onDrop={onDrop}
            onSelectIssue={setSelectedIssue}
          />
          <Column 
            title="Resolved" 
            status="resolved" 
            color="#22c55e"
            icon={<CheckCircle2 size={16} />}
            getStatusIssues={getStatusIssues} 
            onDragOver={onDragOver} 
            onDrop={onDrop}
            onSelectIssue={setSelectedIssue}
          />
        </div>
      )}

      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>New Entry</span>
                <h3 className={styles.modalTitle}>Report Operational Issue</h3>
                <p className={styles.modalSubtitle}>Create a new task for immediate attention</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsCreateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateIssue}>
              <div className={styles.modalBody}>
                <div style={{ 
                  background: "linear-gradient(135deg, rgba(21, 115, 71, 0.04), rgba(21, 115, 71, 0.08))", 
                  border: "1px solid rgba(21, 115, 71, 0.12)", 
                  borderRadius: "12px", 
                  padding: "14px 16px", 
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  {currentRole === 'DEPARTMENT_ADMIN' ? (
                    <>
                      <Shield size={16} style={{ color: "var(--brand-green)" }} />
                      <span style={{ color: "#166534", fontWeight: 600, fontSize: '13px' }}>Creating task for department: {currentDepartment || "Security"}</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={16} style={{ color: "var(--brand-green)" }} />
                      <span style={{ color: "#166534", fontWeight: 600, fontSize: '13px' }}>Creating task for: {selectedLocation}</span>
                    </>
                  )}
                </div>
                <div className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Issue Title *</label>
                      <span className={styles.fieldDesc}>Briefly describe the issue</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <AlertTriangle size={18} />
                      <input 
                        type="text" 
                        placeholder="e.g. Broken Glass at Terminal 3" 
                        required 
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Exact Location *</label>
                      <span className={styles.fieldDesc}>Terminal, gate, or floor</span>
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
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Priority Level</label>
                        <span className={styles.fieldDesc}>Impact urgency</span>
                      </div>
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
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>
                          {currentRole === 'DEPARTMENT_ADMIN' ? 'Department' : 'Handling Dept'}
                        </label>
                        <span className={styles.fieldDesc}>Responsible team</span>
                      </div>
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
                      <label className={styles.formLabel}>Description *</label>
                      <span className={styles.fieldDesc}>Provide detailed information for the responding team</span>
                    </div>
                    <textarea 
                      placeholder="Describe the situation in detail..." 
                      required 
                      className={styles.modalTextarea}
                      style={{ height: "100px", marginTop: "8px", width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', resize: 'none' }}
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.createButton}>
                  <AlertCircle size={16} /> Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedIssue && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.detailModal}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span 
                  className={styles.priorityTag} 
                  style={{ 
                    background: selectedIssue.priority === 'CRITICAL' ? '#fee2e2' : 
                               selectedIssue.priority === 'HIGH' ? '#ffedd5' :
                               selectedIssue.priority === 'MEDIUM' ? '#fef9c3' : '#dcfce7',
                    color: selectedIssue.priority === 'CRITICAL' ? '#ef4444' : 
                           selectedIssue.priority === 'HIGH' ? '#f97316' :
                           selectedIssue.priority === 'MEDIUM' ? '#ca8a04' : '#16a34a'
                  }}
                >
                  {selectedIssue.priority} Priority
                </span>
                <h3 className={styles.modalTitle}>{selectedIssue.title}</h3>
                <p className={styles.modalSubtitle}>Issue details and resolution tracking</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedIssue(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailMain}>
                  <section className={styles.messageSection}>
                    <h4 className={styles.detailLabel}>Issue Description</h4>
                    <div className={styles.messageCard}>
                      <p style={{ fontSize: '15px', lineHeight: 1.7 }}>{selectedIssue.content || selectedIssue.description}</p>
                    </div>
                  </section>

                  <div className={styles.infoCards}>
                    <div className={styles.infoCard}>
                      <MapPin size={18} />
                      <div><span>Location</span><strong>{formatEntityName(selectedIssue.location)}</strong></div>
                    </div>
                    <div className={styles.infoCard}>
                      <Shield size={18} />
                      <div><span>Department</span><strong>{formatEntityName(selectedIssue.department)}</strong></div>
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
                      <div className={styles.noteInputArea} style={{ marginTop: '16px' }}>
                        <textarea 
                          placeholder="Add an update..." 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            fontSize: '14px',
                            resize: 'none',
                            minHeight: '80px'
                          }}
                        />
                        <button 
                          className={styles.noteSendBtn} 
                          onClick={handleAddComment}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            bottom: '12px',
                            background: 'var(--brand-green)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    )}

                    {currentRole === 'DEPARTMENT_ADMIN' && (
                      <section className={styles.internalNotes} style={{ marginTop: '20px' }}>
                        <h4 className={styles.detailLabel}>Attach Proof (Optional)</h4>
                        <div style={{ 
                          border: '2px dashed #e2e8f0', 
                          borderRadius: '12px', 
                          padding: '24px', 
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
                        }}>
                          <Upload size={24} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>
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
                              padding: '10px 20px', 
                              background: 'var(--brand-green)', 
                              color: 'white', 
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: 600
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
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block' }}>Current Status</label>
                      <select 
                        value={selectedIssue.status} 
                        onChange={(e) => {
                          const newStatus = e.target.value as InternalReportStatus;
                          setSelectedIssue({...selectedIssue, status: newStatus});
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '14px',
                          background: 'white',
                          marginBottom: '12px'
                        }}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>

                    <div className={styles.controlItem}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block' }}>Assign Owner</label>
                      <select 
                        defaultValue="unassigned"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '14px',
                          background: 'white'
                        }}
                      >
                        <option value="unassigned">Unassigned</option>
                        {departmentUsers.map((user: any) => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.dangerZone}>
                    <button className={styles.archiveBtn}>
                      <Trash2 size={16} /> Archive Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelectedIssue(null)}>Close</button>
              <button className={styles.createButton} onClick={() => {
                updateStatusMutation.mutate({ 
                  uuid: selectedIssue.uuid, 
                  status: selectedIssue.status 
                });
                setSelectedIssue(null);
              }}>
                <CheckCircle2 size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocationPicker && (
        <div className={styles.modalOverlay} onClick={() => setShowLocationPicker(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>Location</span>
                <h3 className={styles.modalTitle}>Select Airport</h3>
                <p className={styles.modalSubtitle}>Choose location for this issue</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowLocationPicker(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: "16px", color: "#64748b", fontSize: "14px" }}>
                Select the airport location where the issue occurred.
              </p>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#334155", fontSize: '13px' }}>
                  Airport Location
                </label>
                <select
                  value={tempLocId}
                  onChange={(e) => setTempLocId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "14px",
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
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowLocationPicker(false)}>Cancel</button>
              <button
                onClick={() => {
                  setSelectedLocId(tempLocId);
                  setShowLocationPicker(false);
                  setIsCreateModalOpen(true);
                }}
                disabled={!tempLocId}
                className={styles.createButton}
                style={{ opacity: tempLocId ? 1 : 0.5 }}
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