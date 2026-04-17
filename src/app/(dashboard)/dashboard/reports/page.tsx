"use client";

import { useState, useMemo, type CSSProperties } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Download,
  Calendar,
  MapPin,
  Shield,
  MoreVertical,
  X,
  Trash2,
  User,
  FileStack,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Type,
  List,
  LayoutTemplate,
  Wrench,
  Building2,
  FileCheck,
  Layers2,
  Clock,
  BarChart3
} from "lucide-react";
import Image from "next/image";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { UserRole } from "@/types/rbac";
import { 
  InternalReport, 
  ReportType, 
  InternalReportStatus, 
  Location as ApiLocation, 
  Department, 
  ReportTemplate, 
  ReportTemplateField 
} from "@/types/api";

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: Type, color: '#3b82f6' },
  { value: 'number', label: 'Number', icon: Wrench, color: '#8b5cf6' },
  { value: 'date', label: 'Date', icon: Calendar, color: '#f97316' },
  { value: 'dropdown', label: 'Dropdown', icon: List, color: '#ec4899' },
  { value: 'textarea', label: 'Text Area', icon: FileText, color: '#10b981' },
];

const REPORT_ACCENTS = [
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

import { 
  useReports, 
  useCreateReport, 
  useReportTemplates, 
  useCreateReportTemplate,
  useDeleteReportTemplate
} from "@/hooks/useReports";
import { useLocations } from "@/hooks/useLocations";
import { useDepartments } from "@/hooks/useDepartments";

export default function ReportsPage() {
  const { currentRole, currentLocation, locationName: roleLocationName, availableDepartments } = useRole();
  const [activeView, setActiveView] = useState<'reports' | 'templates'>('reports');
  const [selectedReport, setSelectedReport] = useState<InternalReport | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [isSubmitReportOpen, setIsSubmitReportOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const { data: reportsData, isLoading: reportsLoading } = useReports({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    departmentId: filterDepartment !== 'all' ? filterDepartment : undefined,
    from: filterDateFrom || undefined,
    to: filterDateTo || undefined,
  });
  const { data: templatesData, isLoading: templatesLoading } = useReportTemplates();
  const { data: locationsData } = useLocations();

  const createReportMutation = useCreateReport();
  const createTemplateMutation = useCreateReportTemplate();
  const deleteTemplateMutation = useDeleteReportTemplate();

  const reports = reportsData?.data || [];
  const templates = (templatesData?.data || []) as ReportTemplate[];
  const locations = (locationsData?.data || []) as ApiLocation[];

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    locationId: currentLocation || '',
    departmentId: '',
    fields: [] as ReportTemplateField[],
  });

  const previewLocationName = useMemo(() => 
    locations.find((l: ApiLocation) => (l as any).id === newTemplate.locationId)?.name || 'Unknown Location',
    [locations, newTemplate.locationId]
  );

  const previewDepartmentName = useMemo(() => {
    const loc = locations.find((l: ApiLocation) => (l as any).id === newTemplate.locationId);
    const depts = (loc as any)?.departments || [];
    return depts.find((d: Department) => d.id === newTemplate.departmentId)?.name || 'General Department';
  }, [locations, newTemplate.locationId, newTemplate.departmentId]);

  const [newReport, setNewReport] = useState({
    templateId: '',
    templateName: '',
    title: '',
    fieldValues: {} as Record<string, any>,
  });

  const selectedTemplate = useMemo(() => 
    templates.find(t => t.uuid === newReport.templateId || t.id === newReport.templateId),
    [templates, newReport.templateId]
  );

  const handleLocationChange = (locationId: string) => {
    setNewTemplate(prev => ({
      ...prev,
      locationId,
      departmentId: '',
    }));
  };

  const handleAddField = (type: string) => {
    const newField = {
      id: `field-${Date.now()}`,
      type: type as ReportTemplateField['type'],
      label: 'New Field',
      required: false,
      options: type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined,
    };
    setNewTemplate({ ...newTemplate, fields: [...newTemplate.fields, newField] });
  };

  const handleUpdateField = (fieldId: string, updates: Partial<ReportTemplateField>) => {
    setNewTemplate({
      ...newTemplate,
      fields: newTemplate.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    });
  };

  const handleRemoveField = (fieldId: string) => {
    setNewTemplate({
      ...newTemplate,
      fields: newTemplate.fields.filter(f => f.id !== fieldId)
    });
  };

  const handleCreateTemplate = () => {
    createTemplateMutation.mutate({
      name: newTemplate.name,
      locationId: newTemplate.locationId,
      departmentId: newTemplate.departmentId,
      fields: newTemplate.fields,
    }, {
      onSuccess: () => {
        setIsCreateTemplateOpen(false);
        setWizardStep(1);
        setNewTemplate({ name: '', locationId: currentLocation || '', departmentId: '', fields: [] });
      }
    });
  };

  const handleSubmitReport = () => {
    createReportMutation.mutate({
      templateId: newReport.templateId,
      title: newReport.title,
      fieldValues: newReport.fieldValues,
    }, {
      onSuccess: () => {
        setIsSubmitReportOpen(false);
        setNewReport({ templateId: '', templateName: '', title: '', fieldValues: {} });
      }
    });
  };

  const handleDeleteReport = (id: string) => {
    if (selectedReport?.id === id || selectedReport?.uuid === id) setSelectedReport(null);
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplateMutation.mutate(id);
    setActiveDropdown(null);
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return { bg: '#f1f5f9', color: '#64748b', label: 'Draft' };
      case 'submitted': return { bg: '#fef3c7', color: '#92400e', label: 'Submitted' };
      case 'reviewed': return { bg: '#dcfce7', color: '#15803d', label: 'Reviewed' };
      default: return { bg: '#f1f5f9', color: '#64748b', label: status };
    }
  };

  const filteredReports = reports.filter(report => {
    const r = report as InternalReport;
    if (searchTerm && !r.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus !== 'all' && r.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (currentRole === 'LOCATION_ADMIN') {
      const deptId = typeof r.department === 'object' ? (r.department as any)?.id : r.department;
      if (filterDepartment !== 'all' && deptId !== filterDepartment) return false;
      if (filterDateFrom && new Date(r.date || (r as any).createdAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(r.date || (r as any).createdAt) > new Date(filterDateTo)) return false;
    }
    return true;
  });

  const filteredTemplates = templates.filter(t => !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const locationDepartments = useMemo(() => {
    if (!newTemplate.locationId) return [];
    const loc = locations.find((l: ApiLocation) => (l as any).id === newTemplate.locationId);
    return (loc as any)?.departments || [];
  }, [newTemplate.locationId, locations]);

  const totalFields = templates.reduce((sum, t) => sum + (t.fields?.length || 0), 0);
  const recentReports = reports.filter((r: any) => {
    const date = new Date(r.createdAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  }).length;

  const scopeLabel =
    currentRole === "LOCATION_ADMIN"
      ? roleLocationName || "Your Location"
      : currentRole === "DEPARTMENT_ADMIN"
      ? "Your Department"
      : "All Locations";

  return (
    <div className={styles.touchpointsLayout}>
      <div className={styles.deptHero}>
        <div className={styles.deptHeroMain}>
          <div className={styles.deptHeroTitleRow}>
            <div className={styles.deptHeroMark} aria-hidden="true">
              <Image src="/Faan.logo_.png" alt="" width={34} height={34} />
            </div>
            <div className={styles.deptHeroText}>
              <h2 className={styles.deptHeroTitle}>Internal Reports</h2>
              <p className={styles.deptHeroSubtitle}>
                Create structured report templates and submit departmental reports for management review and compliance tracking.
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
          <button
            className={styles.createButton}
            onClick={() => activeView === 'templates' ? setIsCreateTemplateOpen(true) : setIsSubmitReportOpen(true)}
          >
            <Plus size={18} />
            <span>{activeView === 'templates' ? 'Create Template' : 'Submit Report'}</span>
          </button>
          <p className={styles.deptHeroHint}>
            {activeView === 'templates' ? 'Design reusable report forms.' : 'Submit reports from templates.'}
          </p>
        </div>
      </div>

      <div className={styles.deptStatsGrid} aria-label="Reports summary">
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} aria-hidden="true">
            <FileCheck size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Total Reports</div>
            <div className={styles.deptStatValue}>{reports.length}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.22)', color: '#7c3aed' }} aria-hidden="true">
            <LayoutTemplate size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Templates</div>
            <div className={styles.deptStatValue}>{templates.length}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(217, 119, 6, 0.14)', border: '1px solid rgba(217, 119, 6, 0.24)', color: '#d97706' }} aria-hidden="true">
            <Layers2 size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Total Fields</div>
            <div className={styles.deptStatValue}>{totalFields}</div>
          </div>
        </div>
      </div>

      <div className={styles.tabsContainer} style={{ marginBottom: '0', borderRadius: '20px 20px 0 0' }}>
        <button 
          className={`${styles.tabLink} ${activeView === 'reports' ? styles.tabLinkActive : ''}`}
          onClick={() => setActiveView('reports')}
          style={{ borderTopLeftRadius: '20px' }}
        >
          <FileText size={18} /> Reports ({filteredReports.length})
        </button>
        <button 
          className={`${styles.tabLink} ${activeView === 'templates' ? styles.tabLinkActive : ''}`}
          onClick={() => setActiveView('templates')}
        >
          <LayoutTemplate size={18} /> Templates ({filteredTemplates.length})
        </button>
      </div>

      <div className={styles.deptControlsCard} style={{ borderRadius: '0 0 20px 20px' }}>
        <div className={styles.deptControlsRow}>
          <div className={`${styles.searchBar} ${styles.deptSearchBar}`}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={`Search ${activeView}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.deptControlsMeta} aria-live="polite">
            {(reportsLoading || templatesLoading) ? (
              <span>Loading...</span>
            ) : (
              <span>
                Showing <strong>{activeView === 'reports' ? filteredReports.length : filteredTemplates.length}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {activeView === 'reports' && (
        reportsLoading ? (
          <div className={styles.deptGrid} aria-label="Loading reports">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`report-skeleton-${i}`} className={`${styles.deptCard} ${styles.deptSkeletonCard}`}>
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
        ) : filteredReports.length === 0 ? (
          <div className={styles.deptEmptyState} role="status">
            <div className={styles.deptEmptyIcon} aria-hidden="true">
              <FileStack size={22} />
            </div>
            <h3 className={styles.deptEmptyTitle}>
              {searchTerm ? "No reports match your search" : "No reports submitted yet"}
            </h3>
            <p className={styles.deptEmptyText}>
              {searchTerm
                ? "Try a different keyword or clear the search."
                : "Submit your first report using a template."}
            </p>
            <div className={styles.deptEmptyActions}>
              {searchTerm ? (
                <button className={styles.cancelBtn} onClick={() => setSearchTerm("")}>
                  Clear Search
                </button>
              ) : (
                <button
                  className={styles.createButton}
                  onClick={() => setIsSubmitReportOpen(true)}
                >
                  <Plus size={18} />
                  <span>Submit Report</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.deptGrid}>
            {filteredReports.map((report) => {
              const accent = REPORT_ACCENTS[hashToIndex(String(report.id || report.uuid), REPORT_ACCENTS.length)];
              const accentStyle = {
                "--accent-bg": accent.bg,
                "--accent-fg": accent.fg,
                "--accent-ring": accent.ring,
              } as CSSProperties;
              const statusConfig = getStatusConfig(report.status);
              const loc = typeof report.location === 'object' ? report.location : { name: report.location || 'Unknown' };
              const dept = typeof report.department === 'object' ? report.department : { name: report.department || 'General' };

              return (
                <div 
                  key={report.uuid || report.id} 
                  className={styles.deptCard}
                  onClick={() => setSelectedReport(report)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.deptCardHeader}>
                    <div className={styles.deptIconBox} style={accentStyle} aria-hidden="true">
                      <FileText size={24} />
                    </div>
                    <div className={styles.cardMenuWrapper}>
                      <button
                        className={styles.cardMore}
                        aria-label={`Actions for ${report.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === report.id ? null : report.id);
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === report.id && (
                        <div className={styles.cardDropdown}>
                          <button
                            className={styles.dropdownItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                              setActiveDropdown(null);
                            }}
                          >
                            <FileText size={14} /> View Details
                          </button>
                          <div className={styles.dropdownSeparator} />
                          <button
                            className={`${styles.dropdownItem} ${styles.danger}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReport(report.id);
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.deptCardInfo}>
                    <h3 className={styles.deptCardTitle}>{report.title}</h3>
                    <p className={styles.deptCardDesc}>
                      {report.templateName || 'Internal Report'}
                    </p>
                    <div className={styles.deptLocationRow}>
                      <MapPin size={12} />
                      <span>{(loc as any)?.name || 'Unknown'}</span>
                    </div>
                  </div>

                  <div className={styles.deptCardMetrics}>
                    <div className={styles.deptMetric}>
                      <Clock size={14} />
                      <span>{new Date((report as any).createdAt).toLocaleDateString()}</span>
                    </div>
                    <div 
                      className={styles.deptMetric}
                      style={{ 
                        background: statusConfig.bg, 
                        color: statusConfig.color 
                      }}
                    >
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  <button 
                    className={styles.deptManageBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(report);
                    }}
                  >
                    View Details
                    <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {activeView === 'templates' && (
        templatesLoading ? (
          <div className={styles.deptGrid} aria-label="Loading templates">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`template-skeleton-${i}`} className={`${styles.deptCard} ${styles.deptSkeletonCard}`}>
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
        ) : filteredTemplates.length === 0 ? (
          <div className={styles.deptEmptyState} role="status">
            <div className={styles.deptEmptyIcon} aria-hidden="true">
              <LayoutTemplate size={22} />
            </div>
            <h3 className={styles.deptEmptyTitle}>
              {searchTerm ? "No templates match your search" : "No templates created yet"}
            </h3>
            <p className={styles.deptEmptyText}>
              {searchTerm
                ? "Try a different keyword or clear the search."
                : "Create your first report template to standardize data collection."}
            </p>
            <div className={styles.deptEmptyActions}>
              {searchTerm ? (
                <button className={styles.cancelBtn} onClick={() => setSearchTerm("")}>
                  Clear Search
                </button>
              ) : (
                <button
                  className={styles.createButton}
                  onClick={() => setIsCreateTemplateOpen(true)}
                >
                  <Plus size={18} />
                  <span>Create Template</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.deptGrid}>
            {filteredTemplates.map((template) => {
              const accent = REPORT_ACCENTS[hashToIndex(String(template.id || template.uuid), REPORT_ACCENTS.length)];
              const accentStyle = {
                "--accent-bg": accent.bg,
                "--accent-fg": accent.fg,
                "--accent-ring": accent.ring,
              } as CSSProperties;

              return (
                <div key={template.id || template.uuid} className={styles.deptCard}>
                  <div className={styles.deptCardHeader}>
                    <div className={styles.deptIconBox} style={accentStyle} aria-hidden="true">
                      <LayoutTemplate size={24} />
                    </div>
                    <div className={styles.cardMenuWrapper}>
                      <button
                        className={styles.cardMore}
                        aria-label={`Actions for ${template.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === template.id ? null : template.id);
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === template.id && (
                        <div className={styles.cardDropdown}>
                          <button
                            className={styles.dropdownItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewReport({
                                templateId: template.uuid || template.id,
                                templateName: template.name,
                                title: '',
                                fieldValues: {},
                              });
                              setIsSubmitReportOpen(true);
                              setActiveDropdown(null);
                            }}
                          >
                            <FileText size={14} /> Use Template
                          </button>
                          <div className={styles.dropdownSeparator} />
                          <button
                            className={`${styles.dropdownItem} ${styles.danger}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.deptCardInfo}>
                    <h3 className={styles.deptCardTitle}>{template.name}</h3>
                    <p className={styles.deptCardDesc}>
                      {template.departmentName || 'General'} Department
                    </p>
                    <div className={styles.deptLocationRow}>
                      <MapPin size={12} />
                      <span>{template.locationName || 'All Locations'}</span>
                    </div>
                  </div>

                  <div className={styles.deptCardMetrics}>
                    <div className={styles.deptMetric}>
                      <Layers2 size={14} />
                      <span>{template.fields?.length || 0} Fields</span>
                    </div>
                    <div className={styles.deptMetric}>
                      <FileCheck size={14} />
                      <span>0 Uses</span>
                    </div>
                  </div>

                  <button 
                    className={styles.deptManageBtn}
                    onClick={() => {
                      setNewReport({
                        templateId: template.uuid || template.id,
                        templateName: template.name,
                        title: '',
                        fieldValues: {},
                      });
                      setIsSubmitReportOpen(true);
                    }}
                  >
                    Use Template
                    <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {isCreateTemplateOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '1200px', width: '96%', maxHeight: '92vh' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>Step {wizardStep} of 3</span>
                <h3 className={styles.modalTitle}>Create Report Template</h3>
                <p className={styles.modalSubtitle}>Design a structured report form</p>
              </div>
              <button className={styles.closeBtn} onClick={() => { setIsCreateTemplateOpen(false); setWizardStep(1); }}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.wizardProgress}>
              <div className={`${styles.progressStep} ${wizardStep >= 1 ? styles.active : ''}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 2 ? styles.active : ''}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 3 ? styles.active : ''}`} />
            </div>

            <div className={styles.modalBody} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '0', minHeight: '520px', padding: '0' }}>
              <div style={{ padding: '32px', borderRight: '1px solid #e2e8f0', overflow: 'auto' }}>
                {wizardStep === 1 && (
                  <div>
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Template Details</h4>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>Give your report template a name</p>
                    </div>
                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Template Name *</label>
                        <span className={styles.fieldDesc}>A clear name for this report type</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <LayoutTemplate size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. Daily Operations Report" 
                          value={newTemplate.name} 
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div>
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Assignment</h4>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>Select location and department</p>
                    </div>
                    <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Location *</label>
                        <span className={styles.fieldDesc}>Which airport will use this?</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <MapPin size={18} />
                        <select value={newTemplate.locationId} onChange={(e) => handleLocationChange(e.target.value)}>
                          <option value="">Select Location</option>
                          {locations.map(loc => (<option key={(loc as any).id} value={(loc as any).id}>{(loc as any).name}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Department *</label>
                        <span className={styles.fieldDesc}>Responsible department</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <Shield size={18} />
                        <select 
                          value={newTemplate.departmentId} 
                          onChange={(e) => setNewTemplate({ ...newTemplate, departmentId: e.target.value })}
                        >
                          <option value="">Select Department</option>
                          {locationDepartments?.map((dept: Department) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div>
                        <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Build Fields</h4>
                        <p style={{ fontSize: '14px', color: '#64748b' }}>Add fields ({newTemplate.fields.length} added)</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                      {FIELD_TYPES.map(ft => { 
                        const Icon = ft.icon; 
                        return (
                          <button 
                            key={ft.value} 
                            onClick={() => handleAddField(ft.value as ReportTemplateField['type'])} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              padding: '12px 16px', 
                              borderRadius: '12px', 
                              border: '1px solid #e2e8f0', 
                              background: 'white', 
                              fontSize: '13px', 
                              fontWeight: 600, 
                              color: '#475569', 
                              cursor: 'pointer' 
                            }}
                          >
                            <Icon size={14} style={{ color: ft.color }} /> {ft.label}
                          </button>
                        ); 
                      })}
                    </div>
                    {newTemplate.fields.length === 0 ? (
                      <div className={styles.emptyStage} style={{ height: '220px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '2px dashed #e2e8f0', borderRadius: '20px' }}>
                        <div style={{ padding: '16px', background: 'rgba(21, 115, 71, 0.08)', borderRadius: '16px', marginBottom: '12px' }}>
                          <FileStack size={32} style={{ color: 'var(--brand-green)' }} />
                        </div>
                        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>No fields added yet</p>
                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Click a field type above to start building</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {newTemplate.fields.map((field, index) => (
                          <div key={field.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--brand-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>{index + 1}</span>
                              <select value={field.type} onChange={(e) => handleUpdateField(field.id, { type: e.target.value as ReportTemplateField['type'] })} style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600, background: '#f8fafc' }}>
                                {FIELD_TYPES.map(ft => (<option key={ft.value} value={ft.value}>{ft.label}</option>))}
                              </select>
                              <button onClick={() => handleRemoveField(field.id)} style={{ marginLeft: 'auto', padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                            <input type="text" placeholder="Field label (e.g. Number of Passengers)" value={field.label} onChange={(e) => handleUpdateField(field.id, { label: e.target.value })} style={{ width: '100%', fontSize: '14px', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '12px', fontWeight: 500 }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                                <input type="checkbox" checked={field.required} onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })} style={{ accentColor: 'var(--brand-green)' }} />
                                Required field
                              </label>
                              {field.type === 'dropdown' && (
                                <input type="text" placeholder="Options: Option 1, Option 2" value={field.options?.join(', ') || ''} onChange={(e) => handleUpdateField(field.id, { options: e.target.value.split(',').map(o => o.trim()).filter(o => o) })} style={{ flex: 1, fontSize: '12px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px' }}>
                  LIVE PREVIEW
                </div>
                <div style={{ width: '280px', height: '520px', background: '#000', borderRadius: '44px', padding: '10px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                  <div style={{ width: '90px', height: '28px', background: '#000', borderRadius: '16px', position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }} />
                  <div style={{ height: '100%', background: '#fff', borderRadius: '34px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '46px', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}><span>9:41</span><div style={{ display: 'flex', gap: '4px' }}><div style={{ width: '16px', height: '10px', background: '#1e293b', borderRadius: '2px' }} /><div style={{ width: '14px', height: '10px', background: '#1e293b', borderRadius: '2px' }} /></div></div>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to bottom, #fafafa, #ffffff)' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{newTemplate.name || 'Untitled Report'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{previewLocationName.split(' ')[0]} • {previewDepartmentName.split(' ')[0]}</div>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
                      {newTemplate.fields.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94a3b8' }}><FileStack size={32} /><p style={{ fontSize: '12px', marginTop: '8px' }}>No fields yet</p></div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {newTemplate.fields.slice(0, 4).map(field => (
                            <div key={field.id}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{field.label || 'Field'} {field.required && <span style={{ color: '#ef4444' }}>*</span>}</div>
                              {field.type === 'text' && <input disabled placeholder="Enter text..." style={{ height: '36px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0 12px', fontSize: '13px' }} />}
                              {field.type === 'number' && <input disabled type="number" placeholder="0" style={{ height: '36px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0 12px', fontSize: '13px' }} />}
                              {field.type === 'textarea' && <textarea disabled placeholder="Enter details..." style={{ height: '60px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', resize: 'none' }} />}
                              {field.type === 'dropdown' && <div style={{ height: '36px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: '12px', color: '#9ca3af' }}>Select option <ChevronRight size={14} /></div>}
                              {field.type === 'date' && <div style={{ height: '36px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '12px', color: '#9ca3af' }}><Calendar size={14} style={{ marginRight: '8px' }} />Pick a date</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ background: 'var(--brand-green)', color: 'white', padding: '14px', borderRadius: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>Submit Report</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              {wizardStep > 1 ? (
                <button className={styles.cancelBtn} onClick={() => setWizardStep(wizardStep - 1)} style={{ marginRight: 'auto' }}>
                  <ChevronLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}
              <button className={styles.cancelBtn} onClick={() => { setIsCreateTemplateOpen(false); setWizardStep(1); }}>Cancel</button>
              {wizardStep < 3 ? (
                <button className={styles.createButton} onClick={() => setWizardStep(wizardStep + 1)} disabled={wizardStep === 1 && !newTemplate.name} style={{ opacity: wizardStep === 1 && !newTemplate.name ? 0.5 : 1 }}>Next <ChevronRight size={16} /></button>
              ) : (
                <button className={styles.createButton} onClick={handleCreateTemplate} disabled={newTemplate.fields.length === 0} style={{ opacity: newTemplate.fields.length === 0 ? 0.5 : 1 }}><CheckCircle2 size={18} /> Save Template</button>
              )}
            </div>
          </div>
        </div>
      )}

      {isSubmitReportOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>Form Entry</span>
                <h3 className={styles.modalTitle}>Submit Internal Report</h3>
                <p className={styles.modalSubtitle}>Fill out the report form</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsSubmitReportOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                <div className={styles.labelGroup}>
                  <label className={styles.formLabel}>Select Template *</label>
                  <span className={styles.fieldDesc}>Choose a report form</span>
                </div>
                <div className={styles.modalInputWrapper}>
                  <LayoutTemplate size={18} />
                  <select value={newReport.templateId} onChange={(e) => { 
                    const t = templates.find(t => t.uuid === e.target.value || t.id === e.target.value); 
                    setNewReport({ 
                      ...newReport, 
                      templateId: e.target.value, 
                      templateName: t?.name || '',
                    }); 
                  }}>
                    <option value="">Select a template</option>
                    {templates.map(t => (<option key={t.uuid || t.id} value={t.uuid || t.id}>{t.name}</option>))}
                  </select>
                </div>
              </div>
              {newReport.templateId && (
                <>
                  <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Report Title *</label>
                      <span className={styles.fieldDesc}>Brief title for this submission</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <FileText size={18} />
                      <input type="text" placeholder="e.g. Weekly Operations Summary" value={newReport.title} onChange={(e) => setNewReport({ ...newReport, title: e.target.value })} />
                    </div>
                  </div>
                  {selectedTemplate?.fields.map((field: ReportTemplateField) => (
                    <div key={field.id} className={styles.formGroup} style={{ marginTop: '16px' }}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>{field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                      </div>
                      {field.type === 'text' && <div className={styles.modalInputWrapper}><Type size={18} /><input type="text" value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} /></div>}
                      {field.type === 'number' && <div className={styles.modalInputWrapper}><Wrench size={18} /><input type="number" value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} /></div>}
                      {field.type === 'date' && <div className={styles.modalInputWrapper}><Calendar size={18} /><input type="date" value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} /></div>}
                      {field.type === 'dropdown' && <div className={styles.modalInputWrapper}><List size={18} /><select value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required}><option value="">Select</option>{field.options?.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}</select></div>}
                      {field.type === 'textarea' && <textarea placeholder={field.label} value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} className={styles.modalTextarea} style={{ height: '100px', marginTop: '8px', width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', resize: 'none' }} />}
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setIsSubmitReportOpen(false)}>Cancel</button>
              <button className={styles.createButton} onClick={handleSubmitReport} disabled={!newReport.templateId || !newReport.title} style={{ opacity: (!newReport.templateId || !newReport.title) ? 0.5 : 1 }}><CheckCircle2 size={18} /> Submit Report</button>
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.detailModal}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>Report Details</span>
                <h3 className={styles.modalTitle}>{selectedReport.title}</h3>
                <p className={styles.modalSubtitle}>{selectedReport.templateName || 'Internal Report'}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedReport(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailMain}>
                  <section className={styles.messageSection}>
                    <h4 className={styles.detailLabel}>Report Data</h4>
                    <div className={styles.messageCard}>
                      {Object.entries(selectedReport.fieldValues || {}).map(([key, value]) => (
                        <div key={key} style={{ padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>{key}</div>
                          <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>{typeof value === 'object' ? JSON.stringify(value) : String(value) || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
                <div className={styles.detailSidebar}>
                  <div className={styles.actionGroup}>
                    <h4 className={styles.detailLabel}>Quick Stats</h4>
                    <div className={styles.infoCards} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className={styles.infoCard}>
                        <MapPin size={18} />
                        <div><span>Location</span><strong>{selectedReport.locationName || 'Unknown'}</strong></div>
                      </div>
                      <div className={styles.infoCard}>
                        <Shield size={18} />
                        <div><span>Department</span><strong>{selectedReport.departmentName || 'General'}</strong></div>
                      </div>
                      <div className={styles.infoCard}>
                        <User size={18} />
                        <div><span>Reported By</span><strong>{selectedReport.reportedBy || 'Unknown'}</strong></div>
                      </div>
                      <div className={styles.infoCard}>
                        <Calendar size={18} />
                        <div><span>Date</span><strong>{selectedReport.date || new Date((selectedReport as any).createdAt).toLocaleDateString()}</strong></div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.dangerZone}>
                    <button className={styles.archiveBtn} onClick={() => handleDeleteReport(selectedReport.id)}>
                      <Trash2 size={16} /> Delete Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}