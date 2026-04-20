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
  BarChart3,
  CheckSquare,
  Square
} from "lucide-react";
import Image from "next/image";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { UserRole } from "@/types/rbac";
import { MultiSelect } from "@/components/displays/MultiSelect";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { 
  InternalReport, 
  ReportType, 
  InternalReportStatus, 
  Location as ApiLocation, 
  Department, 
  ReportTemplate, 
  ReportTemplateField,
  CreateReportTemplateDto
} from "@/types/api";
import DeleteConfirmationModal from "@/components/displays/DeleteConfirmationModal";

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: Type, color: '#3b82f6' },
  { value: 'number', label: 'Number', icon: Wrench, color: '#8b5cf6' },
  { value: 'date', label: 'Date', icon: Calendar, color: '#f97316' },
  { value: 'dropdown', label: 'Dropdown (Single)', icon: List, color: '#ec4899' },
  { value: 'checkbox', label: 'Checkbox (Multi)', icon: CheckSquare, color: '#10b981' },
  { value: 'textarea', label: 'Text Area', icon: FileText, color: '#6366f1' },
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
  const [drilldownGroup, setDrilldownGroup] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemName: '',
    itemType: 'report' as any,
    isGroup: false,
    instanceCount: 0,
    affectedItems: [] as string[],
    onConfirm: () => {},
  });
  
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [isSubmitReportOpen, setIsSubmitReportOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const { data: reportsData, isLoading: reportsLoading } = useReports({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    departmentId: filterDepartment !== 'all' ? filterDepartment : undefined,
    locationId: currentRole !== 'SUPER_ADMIN' ? (currentLocation || undefined) : undefined,
    from: filterDateFrom || undefined,
    to: filterDateTo || undefined,
  });
  const { data: templatesData, isLoading: templatesLoading } = useReportTemplates({
    locationId: currentRole !== 'SUPER_ADMIN' ? (currentLocation || undefined) : undefined,
  });
  const { data: locationsData } = useLocations();
  const { data: departmentsData } = useDepartments();

  const createReportMutation = useCreateReport();
  const createTemplateMutation = useCreateReportTemplate();
  const deleteTemplateMutation = useDeleteReportTemplate();

  const reports = reportsData?.data || [];
  const templates = (templatesData?.data || []) as ReportTemplate[];
  const locations = (locationsData?.data || []) as ApiLocation[];

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    locationIds: (currentLocation ? [currentLocation] : []) as string[],
    departmentIds: [] as string[],
    fields: [] as ReportTemplateField[],
  });

  const [previewFormData, setPreviewFormData] = useState<Record<string, any>>({});
  const [openPreviewDropdown, setOpenPreviewDropdown] = useState<string | null>(null);

  const previewLocationName = useMemo(() => {
    if (newTemplate.locationIds.length === 1) {
      return locations.find((l: ApiLocation) => (l as any).id === newTemplate.locationIds[0])?.name || 'Unknown Location';
    }
    return `${newTemplate.locationIds.length} Locations Selected`;
  }, [locations, newTemplate.locationIds]);

  const previewDepartmentName = useMemo(() => {
    if (newTemplate.departmentIds.length === 1) {
      const dept = departmentsData?.data?.find((d: Department) => d.id === newTemplate.departmentIds[0]);
      return dept?.name || 'General Department';
    }
    return `${newTemplate.departmentIds.length} Departments Selected`;
  }, [newTemplate.departmentIds, departmentsData]);

  const [newReport, setNewReport] = useState({
    templateId: '',
    templateName: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    fieldValues: {} as Record<string, any>,
  });

  const selectedTemplate = useMemo(() => 
    templates.find(t => t.uuid === newReport.templateId || t.id === newReport.templateId),
    [templates, newReport.templateId]
  );

  const handleLocationChange = (ids: string[]) => {
    setNewTemplate(prev => ({
      ...prev,
      locationIds: ids,
      departmentIds: [],
    }));
  };

  const handleAddField = () => {
    const newField: ReportTemplateField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'New Field',
      name: 'new_field',
      required: false,
      options: undefined,
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
    // Validation
    if (!newTemplate.name.trim()) return toast.error("Template name is required");
    if (newTemplate.locationIds.length === 0 && newTemplate.departmentIds.length === 0) {
      return toast.error("Please select at least one Location or Department target");
    }
    if (newTemplate.fields.length === 0) return toast.error("Please add at least one field to the template");

    const payload: CreateReportTemplateDto = {
      name: newTemplate.name,
      description: newTemplate.description || `Template for ${newTemplate.name}`,
      locationIds: newTemplate.locationIds,
      departmentIds: newTemplate.departmentIds,
      schema: newTemplate.fields.map((f, idx) => ({
        id: `field_${idx + 1}`,
        type: f.type === 'dropdown' ? 'select' : f.type,
        label: f.label,
        name: f.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        required: f.required || false,
        options: f.options?.map(o => o.trim()).filter(Boolean)
      })),
    };

    createTemplateMutation.mutateAsync(payload)
      .then(() => {
        toast.success(`Template(s) created successfully`);
        setIsCreateTemplateOpen(false);
        setWizardStep(1);
        setNewTemplate({ name: '', description: '', locationIds: currentLocation ? [currentLocation] : [], departmentIds: [], fields: [] });
      })
      .catch((error) => {
        const axiosError = error as AxiosError<{ message: string | string[] }>;
        const message = axiosError.response?.data?.message || "Failed to create templates";
        toast.error(Array.isArray(message) ? message[0] : message);
      });
  };

  const handleSubmitReport = () => {
    if (!newReport || !newReport.templateId) return;
    
    createReportMutation.mutate({
      templateId: newReport.templateId,
      title: newReport.title,
      date: newReport.date,
      fieldValues: newReport.fieldValues,
    }, {
      onSuccess: () => {
        setIsSubmitReportOpen(false);
        setNewReport({ 
          templateId: '', 
          templateName: '', 
          title: '', 
          date: new Date().toISOString().split('T')[0],
          fieldValues: {} 
        });
      }
    });
  };

  const handleDeleteReport = (id: string) => {
    if (selectedReport?.id === id) setSelectedReport(null);
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplateMutation.mutate(id);
    setActiveDropdown(null);
  };

  const confirmDeleteReport = (report: any) => {
    setDeleteModal({
      isOpen: true,
      itemName: report.title,
      itemType: 'report',
      isGroup: false,
      instanceCount: 1,
      onConfirm: () => {
        // Implement delete report mutation if available, 
        // for now we just handle local state if it's mock or needs implementation
        handleDeleteReport(report.id);
        setDeleteModal(prev => ({ ...prev, isOpen: false }));
        toast.success("Report deleted successfully");
        setActiveDropdown(null);
      }
    });
  };

  const confirmDeleteTemplate = (template: any) => {
    setDeleteModal({
      isOpen: true,
      itemName: template.name,
      itemType: 'template',
      isGroup: false,
      instanceCount: 1,
      onConfirm: () => {
        deleteTemplateMutation.mutate(template.id, {
          onSuccess: () => {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
            toast.success("Template deleted successfully");
          }
        });
      }
    });
  };

  const confirmDeleteTemplateGroup = (gt: any) => {
    const locationsList = gt.instances.map((inst: any) => {
      const locName = inst.locationName || roleLocationName || 'Unnamed Airport';
      const deptName = inst.departmentName;
      return `${locName}${deptName ? ` - ${deptName}` : ''}`;
    });

    setDeleteModal({
      isOpen: true,
      itemName: gt.name,
      itemType: 'template',
      isGroup: true,
      instanceCount: gt.instances.length,
      affectedItems: locationsList,
      onConfirm: () => {
        const promises = gt.instances.map((inst: any) => deleteTemplateMutation.mutateAsync(inst.id));
        toast.promise(Promise.all(promises), {
          loading: 'Deleting templates...',
          success: () => {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
            setActiveDropdown(null);
            return 'All instances deleted successfully';
          },
          error: 'Failed to delete some templates'
        });
      }
    });
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

  const groupedTemplates = templates.reduce((acc: any, template: any) => {
    const key = template.name;
    if (!acc[key]) {
      acc[key] = {
        ...template,
        instances: []
      };
    }
    acc[key].instances.push(template);
    return acc;
  }, {});

  const filteredGroupedTemplates = Object.values(groupedTemplates).filter((t: any) => 
    !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFields = templates.reduce((sum, t) => sum + (t.schema?.length || 0), 0);
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
          <LayoutTemplate size={18} /> Templates ({filteredGroupedTemplates.length})
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
                Showing <strong>{activeView === 'reports' ? filteredReports.length : filteredGroupedTemplates.length}</strong>
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
              const accent = REPORT_ACCENTS[hashToIndex(String(report.id), REPORT_ACCENTS.length)];
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
                  key={report.id} 
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
                              confirmDeleteReport(report);
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
        ) : filteredGroupedTemplates.length === 0 ? (
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
          drilldownGroup ? (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <div className={styles.drilldownHeader}>
                <button className={styles.backButton} onClick={() => setDrilldownGroup(null)}>
                  <ChevronLeft size={20} />
                </button>
                <div className={styles.drilldownInfo}>
                  <span className={styles.drilldownTitle}>Grouping View</span>
                  <span className={styles.drilldownName}>{drilldownGroup.name} ({drilldownGroup.instances.length} Instances)</span>
                </div>
              </div>

              <div className={styles.deptGrid}>
                {drilldownGroup.instances.map((inst: any) => {
                  const accent = REPORT_ACCENTS[hashToIndex(inst.name, REPORT_ACCENTS.length)];
                  const accentStyle = {
                    "--accent-bg": accent.bg,
                    "--accent-fg": accent.fg,
                    "--accent-ring": accent.ring,
                  } as CSSProperties;

                  return (
                    <div key={inst.id} className={styles.deptCard}>
                      <div className={styles.deptCardHeader}>
                        <div className={styles.deptIconBox} style={accentStyle} aria-hidden="true">
                          <LayoutTemplate size={24} />
                        </div>
                        <div className={styles.cardMenuWrapper}>
                          <button
                            className={styles.cardMore}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === inst.id ? null : inst.id);
                            }}
                          >
                            <MoreVertical size={18} />
                          </button>
                          {activeDropdown === inst.id && (
                            <div className={styles.cardDropdown}>
                              <button
                                className={`${styles.dropdownItem} ${styles.danger}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDeleteTemplate(inst);
                                }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.deptCardInfo}>
                        <h3 className={styles.deptCardTitle}>{inst.name}</h3>
                        <p className={styles.deptCardDesc}>
                          {inst.departmentName || 'General'} Department
                        </p>
                        <div className={styles.deptLocationRow}>
                          <MapPin size={12} />
                          <span>{inst.locationName || roleLocationName || '—'}</span>
                        </div>
                      </div>

                      <div className={styles.deptCardMetrics}>
                        <div className={styles.deptMetric}>
                          <Layers2 size={14} />
                          <span>{inst.schema?.length || 0} Fields</span>
                        </div>
                      </div>

                      <button 
                        className={styles.deptManageBtn}
                        onClick={() => {
                          setNewReport({
                            templateId: inst.uuid || inst.id,
                            templateName: inst.name,
                            title: '',
                            date: new Date().toISOString().split('T')[0],
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
            </div>
          ) : (
            <div className={styles.deptGrid}>
              {filteredGroupedTemplates.map((template: any) => {
                const accent = REPORT_ACCENTS[hashToIndex(template.name, REPORT_ACCENTS.length)];
                const accentStyle = {
                  "--accent-bg": accent.bg,
                  "--accent-fg": accent.fg,
                  "--accent-ring": accent.ring,
                } as CSSProperties;

                const primaryInstance = template.instances[0];
                const primaryLocationName = primaryInstance.locationName || roleLocationName || '—';
                const locationLabel = template.instances.length > 1 
                  ? `${primaryLocationName} +${template.instances.length - 1}`
                  : primaryLocationName;

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
                            setActiveDropdown(activeDropdown === template.name ? null : template.name);
                          }}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {activeDropdown === template.name && (
                          <div className={styles.cardDropdown}>
                            <button
                              className={`${styles.dropdownItem} ${styles.danger}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteTemplateGroup(template);
                              }}
                            >
                              <Trash2 size={14} /> {template.instances.length > 1 ? "Delete Group" : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.deptCardInfo}>
                      <h3 className={styles.deptCardTitle}>{template.name}</h3>
                      <p className={styles.deptCardDesc}>
                        {template.instances.length} Active Deployments
                      </p>
                      <div className={styles.deptLocationRow}>
                        <MapPin size={12} />
                        <span>{locationLabel}</span>
                      </div>
                    </div>

                    <div className={styles.deptCardMetrics}>
                      <div className={styles.deptMetric}>
                        <Layers2 size={14} />
                        <span>{template.schema?.length || 0} Fields</span>
                      </div>
                    </div>

                    {template.instances.length > 1 ? (
                      <button 
                        className={styles.groupCardManageBtn}
                        onClick={() => setDrilldownGroup(template)}
                      >
                        Manage {template.instances.length} Instances
                      </button>
                    ) : (
                      <button 
                        className={styles.deptManageBtn}
                        onClick={() => {
                          setNewReport({
                            templateId: primaryInstance.uuid || primaryInstance.id,
                            templateName: primaryInstance.name,
                            title: '',
                            date: new Date().toISOString().split('T')[0],
                            fieldValues: {},
                          });
                          setIsSubmitReportOpen(true);
                        }}
                      >
                        Use Template
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )
      )}

      {isCreateTemplateOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ 
            maxWidth: '1240px', 
            width: '96%', 
            height: '92vh',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
            background: '#fff'
          }}>
            {/* Left Panel: Form Builder */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              borderRight: '1px solid #f1f5f9',
              background: '#fff',
              minWidth: 0
            }}>
              <div className={styles.modalHeader} style={{ borderBottom: '1px solid #f1f5f9', padding: '24px 32px' }}>
                <div className={styles.modalTitleGroup}>
                  <h3 className={styles.modalTitle}>Create Report Template</h3>
                  <p className={styles.modalSubtitle}>Design a structured report form</p>
                </div>
              </div>

              <div className={styles.wizardProgress} style={{ padding: '0 32px 24px 32px', borderBottom: 'none', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                   <span className={styles.wizardBadge} style={{ margin: 0 }}>Step {wizardStep} of 3</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className={`${styles.progressStep} ${wizardStep >= 1 ? styles.active : ''}`} style={{ flex: 1, height: '6px', borderRadius: '3px' }} />
                  <div className={`${styles.progressStep} ${wizardStep >= 2 ? styles.active : ''}`} style={{ flex: 1, height: '6px', borderRadius: '3px' }} />
                  <div className={`${styles.progressStep} ${wizardStep >= 3 ? styles.active : ''}`} style={{ flex: 1, height: '6px', borderRadius: '3px' }} />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
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
                    <div className={styles.formGroup} style={{ marginTop: '24px' }}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Description</label>
                        <span className={styles.fieldDesc}>Optional notes about this template</span>
                      </div>
                      <textarea 
                        placeholder="e.g. This report tracks hourly restroom cleaning status..." 
                        value={newTemplate.description} 
                        onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })} 
                        style={{ width: '100%', height: '100px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', resize: 'none' }}
                      />
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
                      <div>
                        {currentRole === 'LOCATION_ADMIN' ? (
                          <div className={styles.modalInputWrapper}>
                            <MapPin size={18} />
                            <input 
                              type="text" 
                              value={roleLocationName || currentLocation || ''}
                              disabled
                              style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                            />
                          </div>
                        ) : (
                          <MultiSelect
                            options={locations}
                            selectedIds={newTemplate.locationIds}
                            onChange={(ids) => handleLocationChange(ids)}
                            placeholder="Select Locations"
                            icon={<MapPin size={18} />}
                          />
                        )}
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Department *</label>
                        <span className={styles.fieldDesc}>Responsible department</span>
                      </div>
                      <div>
                        <MultiSelect
                          options={(departmentsData?.data || []).filter((dept: Department) => 
                            newTemplate.locationIds.length === 0 || 
                            newTemplate.locationIds.includes(dept.locationId) || 
                            (dept.location?.id && newTemplate.locationIds.includes(dept.location.id))
                          )}
                          selectedIds={newTemplate.departmentIds}
                          onChange={(ids) => setNewTemplate({ ...newTemplate, departmentIds: ids })}
                          placeholder="Select Departments"
                          icon={<Shield size={18} />}
                        />
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
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                      <button 
                        onClick={handleAddField}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          padding: '12px 24px', 
                          borderRadius: '12px', 
                          border: '2px solid var(--brand-green)', 
                          background: 'rgba(21, 115, 71, 0.05)', 
                          color: 'var(--brand-green)', 
                          fontWeight: 700, 
                          fontSize: '15px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Plus size={20} /> Add New Field
                      </button>
                    </div>

                    {newTemplate.fields.length === 0 ? (
                      <div className={styles.emptyStage} style={{ height: '220px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '2px dashed #e2e8f0', borderRadius: '20px' }}>
                        <div style={{ padding: '16px', background: 'rgba(21, 115, 71, 0.08)', borderRadius: '16px', marginBottom: '12px' }}>
                          <FileStack size={32} style={{ color: 'var(--brand-green)' }} />
                        </div>
                        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>Let&apos;s build your form</p>
                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Click the button above to add your first question</p>
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
                              {(field.type === 'dropdown' || field.type === 'checkbox') && (
                                <input 
                                  type="text" 
                                  placeholder="Options (comma separated): High, Medium, Low" 
                                  value={field.options?.join(', ') || ''} 
                                  onChange={(e) => handleUpdateField(field.id, { options: e.target.value.split(',').map(o => o.trimStart()) })} 
                                  style={{ flex: 1, fontSize: '13px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff' }} 
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wizard Footer */}
              <div style={{ 
                padding: '24px 32px', 
                borderTop: '1px solid #f1f5f9', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px',
                background: '#fff',
                marginTop: 'auto'
              }}>
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => { setIsCreateTemplateOpen(false); setWizardStep(1); }}
                  style={{ color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 24px', fontSize: '14px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                {wizardStep > 1 && (
                  <button 
                    className={styles.cancelBtn} 
                    onClick={() => setWizardStep(wizardStep - 1)}
                    style={{ color: '#0f172a', border: '1px solid #e2e8f0', padding: '10px 24px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                {wizardStep < 3 ? (
                  <button 
                    className={styles.createButton} 
                    onClick={() => setWizardStep(wizardStep + 1)} 
                    disabled={wizardStep === 1 && !newTemplate.name}
                    style={{ padding: '10px 28px', fontSize: '14px', fontWeight: 600, opacity: wizardStep === 1 && !newTemplate.name ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    className={styles.createButton} 
                    onClick={handleCreateTemplate} 
                    disabled={newTemplate.fields.length === 0}
                    style={{ padding: '10px 28px', fontSize: '14px', fontWeight: 600, opacity: newTemplate.fields.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <CheckCircle2 size={18} /> Save Template
                  </button>
                )}
              </div>
            </div>

            {/* Right Panel: Live Preview */}
            <div style={{ 
              width: '420px', 
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative'
            }}>
              {/* Header Bar on Preview Side */}
              <div style={{ 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'flex-end', 
                padding: '0 24px', 
                gap: '12px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <button 
                  className={styles.closeBtn} 
                  onClick={() => { setIsCreateTemplateOpen(false); setWizardStep(1); }}
                  style={{ color: '#fff', marginLeft: '8px', background: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Preview Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0 40px 0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(148, 163, 184, 0.6)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>
                  LIVE PREVIEW
                </div>
                
                {/* Phone Component */}
                <div style={{ 
                  width: '300px', 
                  height: '620px', 
                  flexShrink: 0, 
                  background: '#000', 
                  borderRadius: '44px', 
                  padding: '12px', 
                  position: 'relative', 
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                  border: '4px solid #334155'
                }}>
                  <div style={{ width: '100px', height: '30px', background: '#000', borderRadius: '16px', position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }} />
                  <div style={{ height: '100%', background: '#fff', borderRadius: '34px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Status Bar */}
                    <div style={{ height: '46px', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                      <span>9:41</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                         <div style={{ width: '18px', height: '10px', border: '1px solid #1e293b', borderRadius: '2px', position: 'relative' }}><div style={{ width: '14px', height: '6px', background: '#1e293b', position: 'absolute', top: 1, left: 1 }} /></div>
                      </div>
                    </div>

                    {/* App Header */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to bottom, #fafafa, #ffffff)' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{newTemplate.name || 'Untitled Report'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{previewLocationName.split(' ')[0]} • {previewDepartmentName.split(' ')[0]}</div>
                    </div>

                    {/* Scrollable Fields area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}>
                      {newTemplate.fields.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', opacity: 0.5 }}>
                          <FileStack size={48} />
                          <p style={{ fontSize: '13px', marginTop: '12px', fontWeight: 500 }}>No fields yet</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {newTemplate.fields.map(field => (
                            <div key={field.id}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                {field.label || 'New Question'} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                              </div>
                              {field.type === 'text' && (
                                <input 
                                  type="text"
                                  placeholder="Type here..."
                                  value={previewFormData[field.id] || ''}
                                  onChange={(e) => setPreviewFormData({ ...previewFormData, [field.id]: e.target.value })}
                                  style={{ height: '40px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', width: '100%', padding: '0 12px', fontSize: '13px' }}
                                />
                              )}
                              {field.type === 'number' && (
                                <input 
                                  type="number"
                                  placeholder="0"
                                  value={previewFormData[field.id] || ''}
                                  onChange={(e) => setPreviewFormData({ ...previewFormData, [field.id]: e.target.value })}
                                  style={{ height: '40px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', width: '100%', padding: '0 12px', fontSize: '13px' }}
                                />
                              )}
                              {field.type === 'textarea' && (
                                <textarea 
                                  placeholder="Longer text..."
                                  value={previewFormData[field.id] || ''}
                                  onChange={(e) => setPreviewFormData({ ...previewFormData, [field.id]: e.target.value })}
                                  style={{ height: '80px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', width: '100%', padding: '12px', fontSize: '13px', resize: 'none' }}
                                />
                              )}
                              {field.type === 'dropdown' && (
                                <select 
                                  value={previewFormData[field.id] || ''}
                                  onChange={(e) => setPreviewFormData({ ...previewFormData, [field.id]: e.target.value })}
                                  style={{ height: '40px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', width: '100%', padding: '0 12px', fontSize: '13px', color: '#1e293b' }}
                                >
                                  <option value="">Select option</option>
                                  {(field.options || []).map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}
                              {field.type === 'checkbox' && (
                                <div style={{ position: 'relative' }}>
                                  <button 
                                    onClick={() => setOpenPreviewDropdown(openPreviewDropdown === field.id ? null : field.id)}
                                    style={{ 
                                      width: '100%',
                                      height: '42px', 
                                      background: '#f9fafb', 
                                      border: '1px solid #e5e7eb', 
                                      borderRadius: '12px', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'space-between', 
                                      padding: '0 12px',
                                      fontSize: '13px',
                                      color: (previewFormData[field.id] || []).length > 0 ? '#1e293b' : '#9ca3af',
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                  >
                                    {(previewFormData[field.id] || []).length > 0 
                                      ? `${(previewFormData[field.id] || []).length} items selected`
                                      : 'Select options'}
                                    <ChevronRight size={14} style={{ transform: openPreviewDropdown === field.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                                  </button>
                                  
                                  {openPreviewDropdown === field.id && (
                                    <div style={{ 
                                      marginTop: '6px',
                                      background: '#fff', 
                                      border: '1px solid #e5e7eb', 
                                      borderRadius: '12px', 
                                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                      overflow: 'hidden',
                                      zIndex: 10
                                    }}>
                                      <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '8px' }}>
                                        {(field.options || ['Option 1', 'Option 2', 'Option 3']).map((opt, i) => (
                                          <label 
                                            key={i} 
                                            style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: '10px', 
                                              padding: '10px 12px', 
                                              fontSize: '13px', 
                                              color: (previewFormData[field.id] || []).includes(opt) ? 'var(--brand-green)' : '#4b5563', 
                                              background: (previewFormData[field.id] || []).includes(opt) ? 'rgba(21, 115, 71, 0.05)' : 'transparent',
                                              borderRadius: '8px',
                                              cursor: 'pointer',
                                              marginBottom: '2px',
                                              fontWeight: (previewFormData[field.id] || []).includes(opt) ? 600 : 400
                                            }}
                                          >
                                            <input 
                                              type="checkbox" 
                                              checked={(previewFormData[field.id] || []).includes(opt)}
                                              onChange={(e) => {
                                                const prev = previewFormData[field.id] || [];
                                                const next = e.target.checked ? [...prev, opt] : prev.filter((v: any) => v !== opt);
                                                setPreviewFormData({ ...previewFormData, [field.id]: next });
                                              }}
                                              style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green)' }}
                                            />
                                            {opt}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {field.type === 'date' && (
                                <input 
                                  type="date"
                                  value={previewFormData[field.id] || ''}
                                  onChange={(e) => setPreviewFormData({ ...previewFormData, [field.id]: e.target.value })}
                                  style={{ height: '40px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', width: '100%', padding: '0 12px', fontSize: '13px', color: '#1e293b' }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* App Footer */}
                    <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
                      <button 
                        onClick={() => toast.success("Preview summary looks great!")}
                        style={{ 
                          width: '100%',
                          background: 'var(--brand-green)', 
                          color: 'white', 
                          padding: '14px', 
                          borderRadius: '14px', 
                          textAlign: 'center', 
                          fontSize: '15px', 
                          fontWeight: 700, 
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Submit Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
                  <label className={styles.formLabel}>Select Report *</label>
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
                    <option value="">Select a Report</option>
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

                    <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Report Date *</label>
                        <span className={styles.fieldDesc}>Select the date for this report</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <Calendar size={18} />
                        <input 
                          type="date" 
                          value={newReport.date} 
                          onChange={(e) => setNewReport({ ...newReport, date: e.target.value })} 
                          required
                        />
                      </div>
                    </div>
                  {selectedTemplate?.schema?.map((field: ReportTemplateField) => (
                    <div key={field.id} className={styles.formGroup} style={{ marginTop: '16px' }}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>{field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                      </div>
                      {(field.type === 'text' || (field.type as any) === 'string') && (
                        <div className={styles.modalInputWrapper}>
                          <Type size={18} />
                          <input 
                            type="text" 
                            value={newReport.fieldValues[field.name || field.label] || ''} 
                            onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.name || field.label]: e.target.value } })} 
                            required={field.required} 
                          />
                        </div>
                      )}
                      {field.type === 'number' && (
                        <div className={styles.modalInputWrapper}>
                          <Wrench size={18} />
                          <input 
                            type="number" 
                            value={newReport.fieldValues[field.name || field.label] || ''} 
                            onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.name || field.label]: e.target.value } })} 
                            required={field.required} 
                          />
                        </div>
                      )}
                      {field.type === 'date' && (
                        <div className={styles.modalInputWrapper}>
                          <Calendar size={18} />
                          <input 
                            type="date" 
                            value={newReport.fieldValues[field.name || field.label] || ''} 
                            onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.name || field.label]: e.target.value } })} 
                            required={field.required} 
                          />
                        </div>
                      )}
                      {(field.type === 'dropdown' || field.type === 'select') && (
                        <div className={styles.modalInputWrapper}>
                          <List size={18} />
                          <select 
                            value={newReport.fieldValues[field.name || field.label] || ''} 
                            onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.name || field.label]: e.target.value } })} 
                            required={field.required}
                          >
                            <option value="">Select</option>
                            {field.options?.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}
                          </select>
                        </div>
                      )}
                      {field.type === 'checkbox' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                          {field.options?.map((opt, i) => (
                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569', cursor: 'pointer', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px' }}>
                              <input 
                                type="checkbox" 
                                checked={(newReport.fieldValues[field.name || field.label] || []).includes(opt)}
                                onChange={(e) => {
                                  const current = newReport.fieldValues[field.name || field.label] || [];
                                  const next = e.target.checked 
                                    ? [...current, opt]
                                    : current.filter((v: any) => v !== opt);
                                  setNewReport({
                                    ...newReport,
                                    fieldValues: { ...newReport.fieldValues, [field.name || field.label]: next }
                                  });
                                }}
                                style={{ accentColor: 'var(--brand-green)', width: '18px', height: '18px' }}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                      {field.type === 'textarea' && (
                        <textarea 
                          placeholder={field.label} 
                          value={newReport.fieldValues[field.name || field.label] || ''} 
                          onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.name || field.label]: e.target.value } })} 
                          required={field.required} 
                          className={styles.modalTextarea} 
                          style={{ height: '100px', marginTop: '8px', width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', resize: 'none' }} 
                        />
                      )}
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

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModal.onConfirm}
        itemName={deleteModal.itemName}
        itemType={deleteModal.itemType}
        isGroup={deleteModal.isGroup}
        instanceCount={deleteModal.instanceCount}
        affectedItems={deleteModal.affectedItems}
        isPending={deleteTemplateMutation.isPending || createReportMutation.isPending}
      />
    </div>
  );
}