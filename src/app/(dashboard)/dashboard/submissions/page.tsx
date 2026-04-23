"use client";

import { useState, useMemo, type CSSProperties } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
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
  Star,
  Building2,
  Inbox,
  MousePointer2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft
} from "lucide-react";
import Image from "next/image";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { UserRole } from "@/types/rbac";

import { 
  useSubmissions, 
  useSubmission, 
  useUpdateSubmission, 
  useAddSubmissionNote 
} from "@/hooks/useSubmissions";
import { useDepartments } from "@/hooks/useDepartments";
import { SubmissionStatus, Department, Submission } from "@/types/api";

const STATUS_CONFIG: Record<string, { bg: string; color: string; icon: React.ComponentType<any> }> = {
  OPEN: { bg: '#fef2f2', color: '#ef4444', icon: AlertCircle },
  IN_PROGRESS: { bg: '#fffbeb', color: '#f59e0b', icon: Loader2 },
  RESOLVED: { bg: '#dcfce7', color: '#22c55e', icon: CheckCircle },
  ARCHIVED: { bg: '#f1f5f9', color: '#64748b', icon: CheckCircle2 },
};

const SUBMISSION_ACCENTS = [
  { bg: "rgba(21, 115, 71, 0.12)", fg: "#157347", ring: "rgba(21, 115, 71, 0.22)" },
  { bg: "rgba(37, 99, 235, 0.12)", fg: "#2563eb", ring: "rgba(37, 99, 235, 0.22)" },
  { bg: "rgba(124, 58, 237, 0.12)", fg: "#7c3aed", ring: "rgba(124, 58, 237, 0.22)" },
  { bg: "rgba(217, 119, 6, 0.14)", fg: "#d97706", ring: "rgba(217, 119, 6, 0.24)" },
  { bg: "rgba(219, 39, 119, 0.12)", fg: "#db2777", ring: "rgba(219, 39, 119, 0.22)" },
] as const;

function hashToIndex(input: string, modulo: number) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

const formatSubmissionId = (sub: any, deptIndex: number) => {
  if (!sub) return 'SUB-0000';
  
  // Try to get location and department names
  const locName = sub.touchpoint?.location?.name || sub.location?.name || (typeof sub.location === 'string' ? sub.location : '') || 'UNK';
  const deptName = sub.touchpoint?.department?.name || sub.department?.name || (typeof sub.department === 'string' ? sub.department : '') || 'UNK';
  
  const locPrefix = locName.substring(0, 3).toUpperCase();
  const deptPrefix = deptName.trim().substring(0, 3).toUpperCase();
  
  // Use deptIndex + 1 for the order, padded to 4 digits
  const order = (deptIndex + 1).toString().padStart(4, '0');
  
  return `${locPrefix}-${deptPrefix}-${order}`;
};

export default function SubmissionsPage() {
  const { currentRole, currentLocation, currentDepartment, locationName: roleLocationName } = useRole();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Drilldown states
  const [viewingLocationId, setViewingLocationId] = useState<string | null>(null);
  const [viewingDeptId, setViewingDeptId] = useState<string | null>(null);

  const { data: submissionsData, isLoading: listLoading } = useSubmissions({
    search: searchTerm || undefined,
    locationId: currentLocation || undefined,
    departmentId: currentDepartment || undefined,
  });

  const { data: detail, isLoading: detailLoading } = useSubmission(selectedUuid || "");
  const { data: deptsData } = useDepartments({ locationId: currentLocation || undefined });


  const updateMutation = useUpdateSubmission();
  const noteMutation = useAddSubmissionNote();

  const handleUpdateStatus = (uuid: string, status: string) => {
    updateMutation.mutate({ uuid, data: { status: status as SubmissionStatus } });
  };

  const handleAssignDept = (uuid: string, departmentId: string) => {
    updateMutation.mutate({ uuid, data: { departmentId } });
  };

  const handleAddNote = () => {
    if (!noteContent.trim() || !selectedUuid) return;
    noteMutation.mutate({ uuid: selectedUuid, content: noteContent }, {
      onSuccess: () => setNoteContent("")
    });
  };

  const submissions = (submissionsData?.data || []) as any[];

  const submissionsWithIds = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    const sortedSubmissions = [...submissions].reverse();
    const idMap = new Map();
    
    sortedSubmissions.forEach(s => {
      const deptId = s.touchpoint?.departmentId || s.departmentId || 'unknown';
      deptCounts[deptId] = (deptCounts[deptId] || 0) + 1;
      idMap.set(s.id, deptCounts[deptId] - 1);
    });

    return submissions.map(sub => ({
      ...sub,
      displayId: formatSubmissionId(sub, idMap.get(sub.id) || 0)
    }));
  }, [submissions]);

  const depts = (deptsData?.data || []) as any[];

  const openCount = submissions.filter((s: any) => s.status === 'OPEN').length;
  const inProgressCount = submissions.filter((s: any) => s.status === 'IN_PROGRESS').length;
  const resolvedCount = submissions.filter((s: any) => s.status === 'RESOLVED').length;

  // Taxonomized Data Grouping
  const taxonomizedData = useMemo(() => {
    const locations: Record<string, { id: string; name: string; depts: Record<string, { id: string; name: string; submissions: any[] }> }> = {};
    
    submissionsWithIds.forEach(sub => {
      const locId = sub.touchpoint?.location?.id || sub.location?.id || (typeof sub.location === 'object' ? sub.location?.id : null) || 'unknown-loc';
      const locName = sub.touchpoint?.location?.name || sub.location?.name || (typeof sub.location === 'string' ? sub.location : null) || 'Unknown Location';
      
      const deptId = sub.touchpoint?.department?.id || sub.department?.id || (typeof sub.department === 'object' ? sub.department?.id : null) || 'unknown-dept';
      const deptName = sub.touchpoint?.department?.name || sub.department?.name || (typeof sub.department === 'string' ? sub.department : null) || 'Unknown Department';
      
      if (!locations[locId]) {
        locations[locId] = { id: locId, name: locName, depts: {} };
      }
      
      if (!locations[locId].depts[deptId]) {
        locations[locId].depts[deptId] = { id: deptId, name: deptName, submissions: [] };
      }
      
      locations[locId].depts[deptId].submissions.push(sub);
    });
    
    return Object.values(locations);
  }, [submissionsWithIds]);

  const currentViewingLocation = useMemo(() => 
    taxonomizedData.find(l => l.id === viewingLocationId), 
  [taxonomizedData, viewingLocationId]);

  const currentViewingDept = useMemo(() => 
    currentViewingLocation?.depts[viewingDeptId || ''], 
  [currentViewingLocation, viewingDeptId]);

  const scopeLabel =
    currentRole === "DEPARTMENT_ADMIN"
      ? currentDepartment || "Your Department"
      : currentRole === "LOCATION_ADMIN"
      ? roleLocationName || "Your Location"
      : "All Locations";

  const getTypeIcon = (type?: string) => {
    if (!type) return Inbox;
    switch (type.toLowerCase()) {
      case 'feedback': return MessageSquare;
      case 'complaint': return AlertTriangle;
      case 'incident': return AlertCircle;
      default: return Inbox;
    }
  };

  return (
    <div className={styles.touchpointsLayout}>
      <div className={styles.deptHero}>
        <div className={styles.deptHeroMain}>
          <div className={styles.deptHeroTitleRow}>
            <div className={styles.deptHeroMark} aria-hidden="true">
              <Image src="/Faan.logo_.png" alt="" width={34} height={34} />
            </div>
            <div className={styles.deptHeroText}>
              <h2 className={styles.deptHeroTitle}>Engagement Submissions</h2>
              <p className={styles.deptHeroSubtitle}>
                Monitor real-time passenger feedback, complaints, and incidents. Take action and track resolution progress.
              </p>
            </div>
          </div>
          <div className={styles.deptHeroPills}>
            <span className={styles.deptPill}>
              <MapPin size={14} />
              <span>Scope: {scopeLabel}</span>
            </span>
            <span className={styles.deptPillMuted}>
              <Building2 size={14} />
              <span>{currentRole === 'DEPARTMENT_ADMIN' ? 'Department Admin' : currentRole === 'LOCATION_ADMIN' ? 'Location Admin' : 'System Admin'}</span>
            </span>
          </div>
        </div>

        <div className={styles.deptHeroActions}>
          <button className={styles.createButton}>
            <Download size={18} />
            <span>Export All</span>
          </button>
          <p className={styles.deptHeroHint}>Download submissions as CSV for analysis.</p>
        </div>
      </div>

      <div className={styles.deptStatsGrid} aria-label="Submissions summary">
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.22)', color: '#ef4444' }} aria-hidden="true">
            <AlertCircle size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Open</div>
            <div className={styles.deptStatValue}>{openCount}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.22)', color: '#f59e0b' }} aria-hidden="true">
            <Loader2 size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>In Progress</div>
            <div className={styles.deptStatValue}>{inProgressCount}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.22)', color: '#22c55e' }} aria-hidden="true">
            <CheckCircle size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Resolved</div>
            <div className={styles.deptStatValue}>{resolvedCount}</div>
          </div>
        </div>
      </div>

      <div className={styles.deptControlsCard}>
        <div className={styles.deptControlsRow}>
          <div className={`${styles.searchBar} ${styles.deptSearchBar}`}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by ID, location or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.deptControlsMeta} aria-live="polite">
            {listLoading ? (
              <span>Loading...</span>
            ) : (
              <span>
                Showing <strong>{submissions.length}</strong> submissions
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Taxonomized Drilldown View */}
      {!listLoading && submissions.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          {/* Breadcrumb / Navigation Header */}
          {(viewingLocationId || viewingDeptId) && (
            <div className={styles.drilldownHeader}>
              <button 
                className={styles.backButton}
                onClick={() => {
                  if (viewingDeptId) setViewingDeptId(null);
                  else setViewingLocationId(null);
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <div className={styles.drilldownInfo}>
                <span className={styles.drilldownTitle}>Viewing</span>
                <div className={styles.drilldownName}>
                  <span onClick={() => { setViewingLocationId(null); setViewingDeptId(null); }} style={{ cursor: 'pointer' }}>All Locations</span>
                  {currentViewingLocation && (
                    <>
                      <span style={{ margin: '0 8px', opacity: 0.5 }}>/</span>
                      <span onClick={() => setViewingDeptId(null)} style={{ cursor: viewingDeptId ? 'pointer' : 'default' }}>
                        {currentViewingLocation.name}
                      </span>
                    </>
                  )}
                  {currentViewingDept && (
                    <>
                      <span style={{ margin: '0 8px', opacity: 0.5 }}>/</span>
                      <span>{currentViewingDept.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Level 1: Locations */}
          {!viewingLocationId && (
            <div className={styles.deptGrid}>
              {taxonomizedData.map(loc => (
                <div 
                  key={loc.id} 
                  className={styles.deptCard}
                  onClick={() => setViewingLocationId(loc.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.deptCardHeader}>
                    <div className={styles.deptIconBox} style={{ "--accent-bg": "rgba(21, 115, 71, 0.1)", "--accent-fg": "var(--brand-green)" } as any}>
                      <MapPin size={24} />
                    </div>
                  </div>
                  <div className={styles.deptCardInfo}>
                    <h3 className={styles.deptCardTitle}>{loc.name}</h3>
                    <p className={styles.deptCardDesc}>Terminal and Facility Submissions</p>
                  </div>
                  <div className={styles.deptCardMetrics}>
                    <div className={styles.deptMetric}>
                      <Building2 size={14} />
                      <span>{Object.keys(loc.depts).length} Departments</span>
                    </div>
                    <div className={styles.deptMetric}>
                      <Inbox size={14} />
                      <span>{Object.values(loc.depts).reduce((acc, d) => acc + d.submissions.length, 0)} Total</span>
                    </div>
                  </div>
                  <button className={styles.deptManageBtn}>
                    View Departments
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Level 2: Departments */}
          {viewingLocationId && !viewingDeptId && currentViewingLocation && (
            <div className={styles.deptGrid}>
              {Object.values(currentViewingLocation.depts).map(dept => (
                <div 
                  key={dept.id} 
                  className={styles.deptCard}
                  onClick={() => setViewingDeptId(dept.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.deptCardHeader}>
                    <div className={styles.deptIconBox} style={{ "--accent-bg": "rgba(37, 99, 235, 0.1)", "--accent-fg": "#2563eb" } as any}>
                      <Building2 size={24} />
                    </div>
                  </div>
                  <div className={styles.deptCardInfo}>
                    <h3 className={styles.deptCardTitle}>{dept.name}</h3>
                    <p className={styles.deptCardDesc}>Departmental Operations</p>
                  </div>
                  <div className={styles.deptCardMetrics}>
                    <div className={styles.deptMetric}>
                      <Inbox size={14} />
                      <span>{dept.submissions.length} Submissions</span>
                    </div>
                  </div>
                  <button className={styles.deptManageBtn}>
                    View Submissions
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Level 3: Submissions */}
          {viewingLocationId && viewingDeptId && currentViewingDept && (
            <div className={styles.deptGrid}>
              {currentViewingDept.submissions.map((sub: any) => {
                const displayId = sub.displayId;
                const accent = SUBMISSION_ACCENTS[hashToIndex(String(sub.id), SUBMISSION_ACCENTS.length)];
                const accentStyle = {
                  "--accent-bg": accent.bg,
                  "--accent-fg": accent.fg,
                  "--accent-ring": accent.ring,
                } as CSSProperties;
                const statusConfig = STATUS_CONFIG[sub.status] || STATUS_CONFIG.OPEN;
                const StatusIcon = statusConfig.icon;
                const TypeIcon = getTypeIcon(sub.type);

                return (
                  <div 
                    key={sub.id} 
                    className={styles.deptCard}
                    onClick={() => setSelectedUuid(sub.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.deptCardHeader}>
                      <div className={styles.deptIconBox} style={accentStyle} aria-hidden="true">
                        <TypeIcon size={24} />
                      </div>
                      <div className={styles.cardMenuWrapper}>
                        <button
                          className={styles.cardMore}
                          aria-label={`Actions for ${displayId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === sub.id ? null : sub.id);
                          }}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {activeDropdown === sub.id && (
                          <div className={styles.cardDropdown}>
                            <button
                              className={styles.dropdownItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUuid(sub.id);
                                setActiveDropdown(null);
                              }}
                            >
                              View Details
                            </button>
                            <div className={styles.dropdownSeparator} />
                            <button
                              className={`${styles.dropdownItem} ${styles.danger}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(sub.id, 'ARCHIVED');
                                setActiveDropdown(null);
                              }}
                            >
                              <AlertCircle size={14} /> Archive
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.deptCardInfo}>
                      <h3 className={styles.deptCardTitle}>{displayId}</h3>
                      <p className={styles.deptCardDesc}>
                        {sub.type === 'FEEDBACK' ? 'Passenger Feedback' : 
                         sub.type === 'COMPLAINT' ? 'Complaint Report' :
                         sub.type === 'INCIDENT' ? 'Incident Report' : sub.type}
                      </p>
                    </div>

                    <div className={styles.deptCardMetrics}>
                      <div 
                        className={styles.deptMetric}
                        style={{ 
                          background: statusConfig.bg, 
                          color: statusConfig.color 
                        }}
                      >
                        <StatusIcon size={14} />
                        <span>{(sub.status || 'OPEN').replace('_', ' ')}</span>
                      </div>
                      <div className={styles.deptMetric}>
                        <Clock size={14} />
                        <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button 
                      className={styles.deptManageBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUuid(sub.id);
                      }}
                    >
                      View Details
                      <ChevronRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedUuid && detail && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.detailModal}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span 
                  className={styles.priorityTag}
                  style={{ 
                    background: detail.priority === 'HIGH' ? '#fee2e2' : 
                               detail.priority === 'MEDIUM' ? '#fef9c3' : '#dcfce7',
                    color: detail.priority === 'HIGH' ? '#ef4444' : 
                           detail.priority === 'MEDIUM' ? '#ca8a04' : '#16a34a'
                  }}
                >
                  {detail.priority} Priority
                </span>
                <h3 className={styles.modalTitle}>{
                  submissionsWithIds.find(s => s.id === detail.id)?.displayId || detail.id
                }</h3>
                <p className={styles.modalSubtitle}>Submission details and resolution tracking</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedUuid(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailMain}>
                  <section className={styles.messageSection}>
                    <h4 className={styles.detailLabel}>Submission Data</h4>
                    <div className={styles.messageCard}>
                      {/* New Relational Form Responses */}
                      {detail.formResponses && detail.formResponses.length > 0 ? (
                        detail.formResponses.map((form: any, formIdx: number) => (
                          <div key={form.formId || formIdx} style={{ marginBottom: formIdx < (detail.formResponses?.length || 0) - 1 ? '24px' : '0' }}>
                            {detail.formResponses!.length > 1 && (
                              <h5 style={{ 
                                fontSize: '13px', 
                                fontWeight: 700, 
                                color: 'var(--brand-green)', 
                                marginBottom: '12px',
                                paddingLeft: '4px',
                                borderLeft: '3px solid var(--brand-green)'
                              }}>
                                {form.title}
                              </h5>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {form.answers && form.answers.map((fr: any, i: number) => (
                                <div key={fr.fieldId || i} style={{ padding: '12px 0', borderBottom: i < form.answers.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
                                    {fr.label || 'Unknown Field'}
                                  </div>
                                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                                    {fr.type === 'rating' ? (
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        {[...Array(5)].map((_, starIdx) => (
                                          <Star 
                                            key={starIdx} 
                                            size={16} 
                                            fill={starIdx < (parseInt(fr.value) || 0) ? "#fbbf24" : "none"} 
                                            color={starIdx < (parseInt(fr.value) || 0) ? "#fbbf24" : "#e2e8f0"} 
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <span>{fr.value?.toString() || '—'}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : detail.fieldResponses ? (
                        detail.fieldResponses.map((fr: any, i: number) => (
                          <div key={fr.id || i} style={{ padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
                              {fr.field?.label || 'Unknown Field'}
                            </div>
                            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                              {fr.field?.type === 'rating' ? (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {[...Array(5)].map((_, starIdx) => (
                                    <Star 
                                      key={starIdx} 
                                      size={16} 
                                      fill={starIdx < (parseInt(fr.value) || 0) ? "#fbbf24" : "none"} 
                                      color={starIdx < (parseInt(fr.value) || 0) ? "#fbbf24" : "#e2e8f0"} 
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span>{fr.value?.toString() || '—'}</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : detail.formData && Object.keys(detail.formData).length > 0 ? (
                        Object.entries(detail.formData).map(([key, value]: [string, any], i: number) => (
                          <div key={key} style={{ padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
                              {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </div>
                            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                              {key.toLowerCase().includes('rating') ? (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {[...Array(5)].map((_, starIdx) => (
                                    <Star 
                                      key={starIdx} 
                                      size={16} 
                                      fill={starIdx < (value as number) ? "#fbbf24" : "none"} 
                                      color={starIdx < (value as number) ? "#fbbf24" : "#e2e8f0"} 
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span>{value?.toString() || '—'}</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No response data available</p>
                      )}
                    </div>
                  </section>

                  <div className={styles.infoCards}>
                    <div className={styles.infoCard}>
                      <MapPin size={18} />
                      <div>
                        <span>Location</span>
                        <strong>{typeof detail.location === 'string' ? detail.location : detail.location?.name}</strong>
                      </div>
                    </div>
                    <div className={styles.infoCard}>
                      <User size={18} />
                      <div>
                        <span>Type</span>
                        <strong>{detail.type}</strong>
                      </div>
                    </div>
                    <div className={styles.infoCard}>
                      <Clock size={18} />
                      <div>
                        <span>Submitted</span>
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
                    <div className={styles.noteInputArea} style={{ position: 'relative' }}>
                      <textarea 
                        placeholder="Add an internal note..." 
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 50px 12px 16px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '14px',
                          resize: 'none',
                          minHeight: '80px'
                        }}
                      />
                      <button 
                        className={styles.noteSendBtn} 
                        onClick={handleAddNote}
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
                  </section>
                </div>

                <div className={styles.detailSidebar}>
                  <div className={styles.actionGroup}>
                    <h4 className={styles.detailLabel}>Management</h4>
                    
                    <div className={styles.controlItem}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block' }}>Status</label>
                      <select 
                        value={detail.status}
                        onChange={(e) => handleUpdateStatus(detail.id, e.target.value)}
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
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>

                    {currentRole !== 'DEPARTMENT_ADMIN' && (
                      <div className={styles.controlItem}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block' }}>Assign Department</label>
                        <select 
                          value={typeof detail.department === 'string' ? detail.department : (detail.department as any)?.id}
                          onChange={(e) => handleAssignDept(detail.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            fontSize: '14px',
                            background: 'white'
                          }}
                        >
                          <option value="">Select Dept</option>
                          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className={styles.dangerZone}>
                    <button 
                      className={styles.archiveBtn}
                      onClick={() => handleUpdateStatus(detail.id, 'ARCHIVED')}
                    >
                      <AlertCircle size={16} /> Archive Submission
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelectedUuid(null)}>Close</button>
              <button 
                className={styles.createButton}
                onClick={() => handleUpdateStatus(detail.id, 'RESOLVED')}
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