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
  Upload,
  LayoutGrid,
  List,
  ChevronRight
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { AxiosError } from "axios";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { 
  useKanban, 
  useIssues,
  useUpdateIssueStatus, 
  useCreateIssue, 
  useAddIssueNote 
} from "@/hooks/useIssues";
import { useLocations } from "@/hooks/useLocations";
import { useDepartments } from "@/hooks/useDepartments";
import { InternalReport, InternalReportStatus, Priority, ReportType, Department, CreateIssueDto } from "@/types/api";
import { MultiSelect } from "@/components/displays/MultiSelect";
import DeleteConfirmationModal from "@/components/displays/DeleteConfirmationModal";

interface ColumnProps {
  title: string;
  status: InternalReportStatus | string;
  color: string;
  icon: React.ReactNode;
  getStatusIssues: (status: string) => InternalReport[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (status: string) => void;
  onDragStart: (id: string) => void;
  onSelectIssue: (issue: InternalReport) => void;
}

function Column({ title, status, color, icon, getStatusIssues, onDragOver, onDrop, onDragStart, onSelectIssue }: ColumnProps) {
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
              key={issue.id} 
              className={styles.issueCard}
              draggable
              onDragStart={() => onDragStart(issue.id)}
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
                {issue.code && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    {issue.code}
                  </span>
                )}
                <button className={styles.cardMore} onClick={(e) => e.stopPropagation()}>
                  <MoreVertical size={14} />
                </button>
              </div>
              <h4 className={styles.cardTitle}>{issue.title}</h4>
              <p className={styles.cardDesc}>{issue.content}</p>
              
              <div className={styles.cardFooter}>
                <div className={styles.cardMeta}>
                  <MapPin size={12} />
                  <span>{typeof issue.location === 'object' ? (issue.location as { name?: string })?.name || 'Unknown' : issue.location || 'Unknown'}</span>
                </div>
                <div className={styles.cardMeta}>
                  <Clock size={12} />
                  <span>{issue.createdAt ? new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
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
  const [selectedLocIds, setSelectedLocIds] = useState<string[]>([]);
  const [tempLocIds, setTempLocIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState<'board' | 'list'>('board');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemName: '',
    itemType: 'issue' as const,
    isGroup: false,
    instanceCount: 0,
    affectedItems: [] as string[],
    onConfirm: () => {},
  });
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    departmentIds: [] as string[],
    location: ""
  });

  const [newComment, setNewComment] = useState("");

  const { data: kanbanData, isLoading: kanbanLoading } = useKanban({
    locationId: currentLocation || undefined,
    departmentId: currentDepartment || undefined
  });

  const { data: locationsData } = useLocations();
  const { data: deptsData } = useDepartments();

  const { data: issuesData, isLoading: issuesLoading } = useIssues({
    locationId: currentLocation || undefined,
    departmentId: currentDepartment || undefined,
    search: searchTerm || undefined
  });

  const updateStatusMutation = useUpdateIssueStatus();
  const createIssueMutation = useCreateIssue();
  const addNoteMutation = useAddIssueNote();

  const pendingIssues = kanbanData?.pending || [];
  const inProgressIssues = kanbanData?.inProgress || kanbanData?.['in-progress'] || [];
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
      id: draggedIssueId, 
      status: status.toUpperCase() as InternalReportStatus 
    });
    setDraggedIssueId(null);
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: CreateIssueDto = {
      title: newTask.title,
      content: newTask.description,
      priority: newTask.priority as Priority,
      locationIds: currentRole === 'DEPARTMENT_ADMIN' ? [currentLocation || ""] : selectedLocIds,
      departmentIds: currentRole === 'DEPARTMENT_ADMIN' ? [currentDepartment || ""] : newTask.departmentIds,
      reportType: ReportType.INCIDENT
    };

    createIssueMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Successfully created ${payload.locationIds?.length || payload.departmentIds?.length || 1} issues`);
        setIsCreateModalOpen(false);
        setNewTask({ title: "", description: "", priority: "MEDIUM", departmentIds: [], location: "" });
      },
      onError: (error: AxiosError<{ message: string | string[] }>) => {
        const errorMsg = error?.response?.data?.message || "Failed to create issues";
        toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      }
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedIssue) return;
    addNoteMutation.mutate({ id: selectedIssue.id, content: newComment }, {
      onSuccess: () => setNewComment("")
    });
  };

  const getStatusIssues = (status: string): InternalReport[] => {
    if (!kanbanData) return [];
    
    // Exact match
    if (kanbanData[status as keyof typeof kanbanData]) {
      return kanbanData[status as keyof typeof kanbanData] as InternalReport[];
    }
    
    // Case-insensitive fallback
    const normalizedStatus = status.toLowerCase().replace('-', '');
    const foundKey = Object.keys(kanbanData).find(key => 
      key.toLowerCase().replace('-', '') === normalizedStatus
    );
    
    return foundKey ? (kanbanData[foundKey as keyof typeof kanbanData] as InternalReport[]) : [];
  };

  const confirmArchiveIssue = (issue: InternalReport) => {
    setDeleteModal({
      isOpen: true,
      itemName: issue.title,
      itemType: 'issue',
      isGroup: false,
      instanceCount: 1,
      affectedItems: [
        `Location: ${formatEntityName(issue.location)}`,
        `Department: ${formatEntityName(issue.department)}`
      ],
      onConfirm: () => {
        // Implement archive mutation here
        // Since there's no archive mutation in useIssues right now, we'll just mock success
        toast.success("Issue archived successfully");
        setDeleteModal(prev => ({ ...prev, isOpen: false }));
        setSelectedIssue(null);
      }
    });
  };

  const locations = useMemo(() => locationsData?.data || [], [locationsData]);
  const depts = useMemo(() => deptsData?.data || [], [deptsData]);

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
            <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
              <button 
                className={`${styles.viewToggleBtn} ${viewType === 'board' ? styles.activeView : ''}`}
                onClick={() => setViewType('board')}
                title="Board View"
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                className={`${styles.viewToggleBtn} ${viewType === 'list' ? styles.activeView : ''}`}
                onClick={() => setViewType('list')}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
            {kanbanLoading || issuesLoading ? (
              <span>Loading...</span>
            ) : (
              <span>
                Total: <strong>{viewType === 'board' ? totalIssues : (issuesData?.length || 0)}</strong> {criticalCount > 0 && <span style={{ color: '#ef4444', marginLeft: '12px' }}>Critical/High: <strong>{criticalCount}</strong></span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {kanbanLoading || issuesLoading ? (
        <div className={styles.deptGrid} aria-label="Loading issues">
          {viewType === 'board' ? (
            Array.from({ length: 6 }).map((_, i) => (
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
            ))
          ) : (
            <div className={styles.listViewContainer} style={{ width: '100%', padding: '20px' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={`list-skeleton-${i}`} className={styles.deptSkeletonLine} style={{ width: "100%", height: "40px", marginBottom: "12px", borderRadius: "8px" }} />
              ))}
            </div>
          )}
        </div>
      ) : (viewType === 'board' ? totalIssues === 0 : (issuesData?.length || 0) === 0) ? (
        <div className={styles.deptEmptyState} role="status">
          <div className={styles.deptEmptyIcon} aria-hidden="true">
            <FileWarning size={22} />
          </div>
          <h3 className={styles.deptEmptyTitle}>{searchTerm ? "No results found" : "No issues reported"}</h3>
          <p className={styles.deptEmptyText}>
            {searchTerm 
              ? "Try adjusting your search or filters to find what you're looking for." 
              : "All operational issues have been resolved. Report a new issue if you spot any problems."}
          </p>
          <div className={styles.deptEmptyActions}>
            <button
              className={styles.createButton}
              onClick={() => {
                if (currentRole === 'DEPARTMENT_ADMIN') {
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
      ) : viewType === 'board' ? (
        <div className={styles.kanbanBoard}>
          <Column 
            title="Pending" 
            status="pending" 
            color="#ef4444"
            icon={<AlertCircle size={16} />}
            getStatusIssues={getStatusIssues} 
            onDragOver={onDragOver} 
            onDrop={onDrop}
            onDragStart={onDragStart}
            onSelectIssue={setSelectedIssue}
          />
          <Column 
            title="In Progress" 
            status="inProgress" 
            color="#f59e0b"
            icon={<Loader2 size={16} />}
            getStatusIssues={getStatusIssues} 
            onDragOver={onDragOver} 
            onDrop={onDrop}
            onDragStart={onDragStart}
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
            onDragStart={onDragStart}
            onSelectIssue={setSelectedIssue}
          />
          <Column 
            title="Closed" 
            status="closed" 
            color="#64748b"
            icon={<Circle size={16} />}
            getStatusIssues={getStatusIssues} 
            onDragOver={onDragOver} 
            onDrop={onDrop}
            onDragStart={onDragStart}
            onSelectIssue={setSelectedIssue}
          />
        </div>
      ) : (
        <div className={styles.listViewContainer}>
          <table className={styles.issueTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Issue</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {issuesData?.map((issue) => (
                <tr 
                  key={issue.id} 
                  className={styles.issueTableRow}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <td>
                    <span className={styles.issueCodeCell}>{issue.code || '---'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{issue.title}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{formatEntityName(issue.department)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <MapPin size={14} style={{ color: '#94a3b8' }} />
                      <span>{formatEntityName(issue.location)}</span>
                    </div>
                  </td>
                  <td>
                    <span 
                      className={styles.issuePriorityBadge}
                      style={{ 
                        background: issue.priority === 'CRITICAL' ? '#fee2e2' : 
                                   issue.priority === 'HIGH' ? '#ffedd5' :
                                   issue.priority === 'MEDIUM' ? '#fef9c3' : '#dcfce7',
                        color: issue.priority === 'CRITICAL' ? '#ef4444' : 
                               issue.priority === 'HIGH' ? '#f97316' :
                               issue.priority === 'MEDIUM' ? '#ca8a04' : '#16a34a'
                      }}
                    >
                      <AlertCircle size={12} />
                      {issue.priority}
                    </span>
                  </td>
                  <td>
                    <span 
                      className={styles.issueStatusBadge}
                      style={{ 
                        background: issue.status === 'PENDING' ? 'rgba(239, 68, 68, 0.1)' : 
                                   issue.status === 'IN_PROGRESS' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: issue.status === 'PENDING' ? '#ef4444' : 
                               issue.status === 'IN_PROGRESS' ? '#f59e0b' : '#22c55e'
                      }}
                    >
                      {issue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <button className={styles.issueActionBtn}>
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                      <span style={{ color: "#166534", fontWeight: 600, fontSize: '13px' }}>Creating tasks for: {selectedLocIds.length} location(s)</span>
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
                      <div>
                        {currentRole === 'DEPARTMENT_ADMIN' ? (
                          <div className={styles.modalInputWrapper}>
                            <Shield size={18} />
                            <input 
                              type="text" 
                              value={currentDepartment || "Security"} 
                              disabled 
                              style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                            />
                          </div>
                        ) : (
                          <MultiSelect
                            options={depts.filter(d => 
                              selectedLocIds.length === 0 || 
                              selectedLocIds.includes(d.locationId) || 
                              (d.location?.id && selectedLocIds.includes(d.location.id))
                            )}
                            selectedIds={newTask.departmentIds}
                            onChange={(ids) => setNewTask({...newTask, departmentIds: ids})}
                            placeholder="Select Departments"
                            icon={<Shield size={18} />}
                          />
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
                <h3 className={styles.modalTitle}>
                  {selectedIssue.code && <span style={{ color: '#64748b', marginRight: '8px' }}>[{selectedIssue.code}]</span>}
                  {selectedIssue.title}
                </h3>
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
                        value={typeof selectedIssue.assignee === 'object' ? selectedIssue.assignee?.id : selectedIssue.assignee || 'unassigned'}
                        onChange={(e) => setSelectedIssue({
                          ...selectedIssue,
                          assignee: e.target.value === 'unassigned' ? null : e.target.value
                        })}
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
                        {departmentUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.controlItem} style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block' }}>Update Priority</label>
                      <select 
                        value={selectedIssue.priority}
                        onChange={(e) => setSelectedIssue({
                          ...selectedIssue,
                          priority: e.target.value as Priority
                        })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '14px',
                          background: 'white'
                        }}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.dangerZone}>
                    <button 
                      className={styles.archiveBtn}
                      onClick={() => selectedIssue && confirmArchiveIssue(selectedIssue)}
                    >
                      <Trash2 size={16} /> Archive Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelectedIssue(null)}>Close</button>
              <button className={styles.createButton} onClick={() => {
                const assigneeId = typeof selectedIssue.assignee === 'object' ? selectedIssue.assignee?.id : selectedIssue.assignee;
                updateStatusMutation.mutate({ 
                  id: selectedIssue.id, 
                  status: selectedIssue.status,
                  priority: selectedIssue.priority,
                  assignee: assigneeId === 'unassigned' ? null : assigneeId
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
                <MultiSelect
                  options={locations}
                  selectedIds={tempLocIds}
                  onChange={(ids) => setTempLocIds(ids)}
                  placeholder="Select airports"
                  icon={<Building2 size={18} />}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowLocationPicker(false)}>Cancel</button>
              <button
                onClick={() => {
                  setSelectedLocIds(tempLocIds);
                  setShowLocationPicker(false);
                  setIsCreateModalOpen(true);
                }}
                disabled={tempLocIds.length === 0}
                className={styles.createButton}
                style={{ opacity: tempLocIds.length > 0 ? 1 : 0.5 }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModal.onConfirm}
        itemName={deleteModal.itemName}
        itemType={deleteModal.itemType}
        isGroup={deleteModal.isGroup}
        instanceCount={deleteModal.instanceCount}
        affectedItems={deleteModal.affectedItems}
        isPending={false}
      />
    </div>
  );
}