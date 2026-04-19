"use client";

import { useState } from "react";
import { 
  FileStack, 
  Plus, 
  Search, 
  Trash2,
  Edit,
  Copy,
  X,
  CheckCircle2,
  FileText,
  Type,
  List,
  Upload,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Star,
  Layers2,
  BarChart3,
  MousePointer2,
  MapPin,
  Building2,
  MoreVertical,
  ClipboardList,
  FileCheck
} from "lucide-react";
import Image from "next/image";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { 
  useTouchpoints, 
  useCreateTouchpoint, 
  useUpdateTouchpoint,
  useDeleteTouchpoint
} from "@/hooks/useTouchpoints";
import { useLocations } from "@/hooks/useLocations";
import { useDepartments } from "@/hooks/useDepartments";
import { Touchpoint, Location, Department, FormField, TouchpointType } from "@/types/api";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { MultiSelect } from "@/components/displays/MultiSelect";

const FIELD_TYPES = [
  { value: 'rating', label: 'Rating', icon: Star, color: '#f59e0b' },
  { value: 'text', label: 'Text Input', icon: Type, color: '#3b82f6' },
  { value: 'textarea', label: 'Long Text', icon: FileText, color: '#8b5cf6' },
  { value: 'dropdown', label: 'Dropdown', icon: List, color: '#ec4899' },
  { value: 'file', label: 'File Upload', icon: Upload, color: '#10b981' },
  { value: 'date', label: 'Date', icon: Calendar, color: '#f97316' },
];

const FORM_ACCENTS = [
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

const normalizeFields = (config: any): FormField[] => {
  if (!config) return [];
  if (Array.isArray(config)) return config;
  if (typeof config === 'string') {
    try {
      const parsed = JSON.parse(config);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function FormsPage() {
  const { currentRole, currentLocation, locationName: roleLocationName } = useRole();
  const { data: touchpointsData, isLoading: formsLoading } = useTouchpoints({ 
    type: 'FEEDBACK',
    locationId: currentLocation || undefined
  });
  const { data: locationsData } = useLocations();
  const { data: departmentsData } = useDepartments({ 
    locationId: currentLocation || undefined 
  });


  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<Touchpoint | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [drilldownGroup, setDrilldownGroup] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState<{
    type: 'SINGLE' | 'GROUP';
    id?: string;
    ids?: string[];
    title: string;
    count?: number;
  } | null>(null);

  const createMutation = useCreateTouchpoint();
  const updateMutation = useUpdateTouchpoint();
  const deleteMutation = useDeleteTouchpoint();

  const touchpoints = touchpointsData?.data || [];
  const locations = locationsData?.data || [];
  const departments = departmentsData?.data || [];

  // Grouping Logic for Forms
  const groupedForms = touchpoints.reduce((acc: Record<string, any>, tp) => {
    const key = tp.title; // Using title as grouping key
    if (!acc[key]) {
      acc[key] = {
        ...tp,
        instances: [tp],
        totalInteractions: tp.interactions || 0
      };
    } else {
      acc[key].instances.push(tp);
      acc[key].totalInteractions += tp.interactions || 0;
    }
    return acc;
  }, {});

  const [newForm, setNewForm] = useState({
    name: '',
    locationIds: (currentLocation ? [currentLocation] : []) as string[],
    departmentIds: [] as string[],
    allowAnonymous: true,
    successMessage: 'Thank you for your feedback!',
    fields: [] as FormField[],
  });

  const filteredGroupedForms = Object.values(groupedForms).sort((a: any, b: any) => 
    (b.totalInteractions || 0) - (a.totalInteractions || 0)
  ).filter((f: any) => 
    !searchTerm || f.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFields = touchpoints.reduce((sum, tp) => sum + (normalizeFields(tp.formConfig).length), 0);
  const totalSubmissions = touchpoints.reduce((sum, tp) => sum + (tp.interactions || 0), 0);

  const scopeLabel =
    currentRole === "LOCATION_ADMIN"
      ? roleLocationName || "Your Location"
      : "All Locations";

  const handleLocationChange = (ids: string[]) => {
    setNewForm({
      ...newForm,
      locationIds: ids,
      departmentIds: [],
    });
  };

  const handleAddField = (type: string = 'text') => {
    const newField: FormField = {
      id: String(Date.now()),
      type: type as FormField['type'],
      label: 'New Field',
      required: false,
      options: type === 'dropdown' ? ['Option 1', 'Option 2'] : [],
    };
    setNewForm({...newForm, fields: [...newForm.fields, newField]});
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setNewForm({
      ...newForm,
      fields: newForm.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    });
  };

  const handleRemoveField = (fieldId: string) => {
    setNewForm({
      ...newForm,
      fields: newForm.fields.filter(f => f.id !== fieldId)
    });
  };

  const handleSaveForm = () => {
    // Validation
    // Validation
    if (!newForm.name.trim()) return toast.error("Form name is required");
    if (newForm.locationIds.length === 0) return toast.error("Please select at least one location");
    if (newForm.departmentIds.length === 0) return toast.error("Please select at least one department");
    if (newForm.fields.length === 0) return toast.error("Please add at least one field to the form");

    // We'll create a combination of all selected locations and departments
    const creations: any[] = [];
    newForm.locationIds.forEach(locId => {
      newForm.departmentIds.forEach(deptId => {
        // Only add if the department belongs to this location
        const dept = departments.find(d => d.id === deptId);
        if (dept && (dept.locationId === locId || dept.location?.id === locId)) {
          creations.push({
            title: newForm.name,
            locationId: locId,
            departmentId: deptId,
            type: 'FEEDBACK' as TouchpointType,
            formConfig: newForm.fields,
          });
        }
      });
    });

    if (creations.length === 0) {
      return toast.error("No valid Location-Department combinations found. Please ensure selected departments belong to the selected locations.");
    }

    if (isEditMode && editingFormId) {
      updateMutation.mutate({ uuid: editingFormId, data: creations[0] }, {
        onSuccess: () => {
          toast.success("Form updated successfully");
          setIsCreateModalOpen(false);
          resetWizard();
        },
        onError: (error) => {
          const axiosError = error as AxiosError<{ message: string | string[] }>;
          const message = axiosError.response?.data?.message || "Failed to update form";
          toast.error(Array.isArray(message) ? message[0] : message);
        }
      });
    } else {
      Promise.all(creations.map(payload => createMutation.mutateAsync(payload)))
        .then(() => {
          toast.success(`Form(s) created successfully for ${creations.length} combinations`);
          setIsCreateModalOpen(false);
          resetWizard();
        })
        .catch((error) => {
          const axiosError = error as AxiosError<{ message: string | string[] }>;
          const message = axiosError.response?.data?.message || "Failed to create forms";
          toast.error(Array.isArray(message) ? message[0] : message);
        });
    }
  };

  const handleDeleteForm = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (selectedForm?.id === id) setSelectedForm(null);
        toast.success("Form deleted successfully");
      }
    });
  };

  const confirmDelete = async () => {
    if (!deleteData) return;

    if (deleteData.type === 'SINGLE' && deleteData.id) {
      deleteMutation.mutate(deleteData.id, {
        onSuccess: () => {
          if (selectedForm?.id === deleteData.id) setSelectedForm(null);
          toast.success(`Form "${deleteData.title}" deleted successfully`);
          setShowDeleteModal(false);
          setDeleteData(null);
        },
        onError: () => {
          toast.error("Failed to delete form");
        }
      });
    } else if (deleteData.type === 'GROUP' && deleteData.ids) {
      try {
        await Promise.all(deleteData.ids.map(id => deleteMutation.mutateAsync(id)));
        toast.success(`Group "${deleteData.title}" and all its instances deleted successfully`);
        setShowDeleteModal(false);
        setDeleteData(null);
      } catch (error) {
        toast.error("Failed to delete some forms in the group");
      }
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setNewForm({
      name: '',
      locationIds: currentLocation ? [currentLocation] : [],
      departmentIds: [],
      allowAnonymous: true,
      successMessage: 'Thank you for your feedback!',
      fields: [],
    });
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
              <h2 className={styles.deptHeroTitle}>Forms Management</h2>
              <p className={styles.deptHeroSubtitle}>
                Design and deploy passenger feedback forms, surveys, and data collection touchpoints across all airport locations.
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
              <span>{currentRole === "LOCATION_ADMIN" ? "Location Administration" : "System Administration"}</span>
            </span>
          </div>
        </div>

        <div className={styles.deptHeroActions}>
          <button
            className={styles.createButton}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} />
            <span>Create Form</span>
          </button>
          <p className={styles.deptHeroHint}>Build custom forms with ratings, text fields, and dropdowns.</p>
        </div>
      </div>

      <div className={styles.deptStatsGrid} aria-label="Forms summary">
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} aria-hidden="true">
            <Layers2 size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Active Forms</div>
            <div className={styles.deptStatValue}>{touchpoints.length}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} aria-hidden="true">
            <FileCheck size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Form Fields</div>
            <div className={styles.deptStatValue}>{totalFields}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} aria-hidden="true">
            <MousePointer2 size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Submissions</div>
            <div className={styles.deptStatValue}>{totalSubmissions}</div>
          </div>
        </div>
      </div>

      <div className={styles.deptControlsCard}>
        <div className={styles.deptControlsRow}>
          <div className={`${styles.searchBar} ${styles.deptSearchBar}`}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search forms by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.deptControlsMeta} aria-live="polite">
            {formsLoading ? (
              <span>Loading...</span>
            ) : (
              <span>
                Showing <strong>{filteredGroupedForms.length}</strong> groups of <strong>{touchpoints.length}</strong> forms
              </span>
            )}
          </div>
        </div>
      </div>

      {formsLoading ? (
        <div className={styles.deptGrid} aria-label="Loading forms">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`form-skeleton-${i}`} className={`${styles.deptCard} ${styles.deptSkeletonCard}`}>
              <div className={styles.deptCardHeader}>
                <div className={styles.deptSkeletonIcon} />
                <div className={styles.deptSkeletonMenu} />
              </div>
              <div className={styles.deptCardInfo}>
                <div className={styles.deptSkeletonLine} style={{ width: "70%" }} />
                <div className={styles.deptSkeletonLine} style={{ width: "95%" }} />
                <div className={styles.deptSkeletonLine} style={{ width: "60%" }} />
              </div>
              <div className={styles.deptCardMetrics}>
                <div className={styles.deptSkeletonPill} />
                <div className={styles.deptSkeletonPill} />
              </div>
              <div className={styles.deptSkeletonBtn} />
            </div>
          ))}
        </div>
      ) : filteredGroupedForms.length === 0 ? (
        <div className={styles.deptEmptyState} role="status">
          <div className={styles.deptEmptyIcon} aria-hidden="true">
            <ClipboardList size={22} />
          </div>
          <h3 className={styles.deptEmptyTitle}>
            {searchTerm ? "No forms match your search" : "No forms created yet"}
          </h3>
          <p className={styles.deptEmptyText}>
            {searchTerm
              ? "Try a different keyword or clear the search."
              : "Create your first form to start collecting passenger feedback and data."}
          </p>
          <div className={styles.deptEmptyActions}>
            {searchTerm ? (
              <button className={styles.cancelBtn} onClick={() => setSearchTerm("")}>
                Clear Search
              </button>
            ) : (
              <button
                className={styles.createButton}
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={18} />
                <span>Create Form</span>
              </button>
            )}
          </div>
        </div>
      ) : drilldownGroup ? (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <div className={styles.drilldownHeader}>
            <button className={styles.backButton} onClick={() => setDrilldownGroup(null)}>
              <ChevronLeft size={20} />
            </button>
            <div className={styles.drilldownInfo}>
              <span className={styles.drilldownTitle}>Grouping View</span>
              <span className={styles.drilldownName}>{drilldownGroup.title} ({drilldownGroup.instances.length} Instances)</span>
            </div>
          </div>

          <div className={styles.deptGrid}>
            {drilldownGroup.instances.map((tp: any) => {
              const accent = FORM_ACCENTS[hashToIndex(tp.title, FORM_ACCENTS.length)];
              const accentStyle = {
                "--accent-bg": accent.bg,
                "--accent-fg": accent.fg,
                "--accent-ring": accent.ring,
              } as React.CSSProperties;

              return (
                <div key={tp.id} className={styles.deptCard}>
                  <div className={styles.deptCardHeader}>
                    <div className={styles.deptIconBox} style={accentStyle}>
                      <FileStack size={24} />
                    </div>
                    <div className={styles.cardMenuWrapper}>
                      <button
                        className={styles.cardMore}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === tp.id ? null : tp.id);
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === tp.id && (
                        <div className={styles.cardDropdown}>
                          <button
                            className={styles.dropdownItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewForm({
                                name: tp.title,
                                locationIds: [tp.locationId],
                                departmentIds: tp.departmentIds || [],
                                allowAnonymous: true,
                                successMessage: 'Thank you for your feedback!',
                                fields: Array.isArray(tp.formConfig) ? tp.formConfig : [],
                              });
                              setIsEditMode(true);
                              setEditingFormId(tp.id);
                              setIsCreateModalOpen(true);
                              setActiveDropdown(null);
                            }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            className={`${styles.dropdownItem} ${styles.danger}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteData({
                                type: 'SINGLE',
                                id: tp.id,
                                title: tp.title
                              });
                              setShowDeleteModal(true);
                              setActiveDropdown(null);
                            }}
                          >
                            <Trash2 size={14} /> Delete Form
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.deptCardInfo}>
                    <h3 className={styles.deptCardTitle}>{tp.title}</h3>
                    <p className={styles.deptCardDesc}>
                      Passenger Form
                    </p>
                    <div className={styles.deptLocationRow}>
                      <MapPin size={12} />
                      <span>{tp.location?.name || roleLocationName || '—'}</span>
                    </div>
                  </div>

                  <div className={styles.deptCardMetrics}>
                    <div className={styles.deptMetric}>
                      <FileCheck size={14} />
                      <span>{tp.formConfig?.length || 0} Fields</span>
                    </div>
                    <div className={styles.deptMetric}>
                      <MousePointer2 size={14} />
                      <span>{tp.totalInteractions || 0} Submissions</span>
                    </div>
                  </div>

                  <button 
                    className={styles.deptManageBtn}
                    onClick={() => setSelectedForm(tp)}
                  >
                    View Form Details
                    <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.deptGrid}>
          {filteredGroupedForms.map((groupedForm: any) => {
            const accent = FORM_ACCENTS[hashToIndex(groupedForm.title, FORM_ACCENTS.length)];
            const accentStyle = {
              "--accent-bg": accent.bg,
              "--accent-fg": accent.fg,
              "--accent-ring": accent.ring,
            } as React.CSSProperties;

            const primaryInstance = groupedForm.instances[0];
            const primaryLocationName =
              typeof primaryInstance.location === "string"
                ? primaryInstance.location
                : primaryInstance.location?.name || roleLocationName || "—";
            
            const locationLabel = groupedForm.instances.length > 1
              ? `${primaryLocationName} +${groupedForm.instances.length - 1}`
              : primaryLocationName;

            return (
              <div 
                key={groupedForm.title} 
                className={styles.deptCard}
              >
                <div className={styles.deptCardHeader}>
                  <div className={styles.deptIconBox} style={accentStyle} aria-hidden="true">
                    <FileStack size={24} />
                  </div>
                  <div className={styles.cardMenuWrapper}>
                    <button
                      className={styles.cardMore}
                      aria-label={`Form actions for ${groupedForm.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === groupedForm.title ? null : groupedForm.title);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeDropdown === groupedForm.title && (
                      <div className={styles.cardDropdown}>
                        <button
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewForm({
                              name: groupedForm.title,
                              locationIds: groupedForm.instances.map((i: any) => i.locationId),
                              departmentIds: groupedForm.instances.map((i: any) => i.departmentId),
                              allowAnonymous: true,
                              successMessage: 'Thank you for your feedback!',
                              fields: normalizeFields(groupedForm.formConfig),
                            });
                            setIsEditMode(true);
                            setEditingFormId(groupedForm.id);
                            setIsCreateModalOpen(true);
                            setActiveDropdown(null);
                          }}
                        >
                          <Edit size={14} /> {groupedForm.instances.length > 1 ? "Edit Group" : "Edit Form"}
                        </button>
                        <button
                          className={`${styles.dropdownItem} ${styles.danger}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteData({
                              type: 'GROUP',
                              ids: groupedForm.instances.map((i: any) => i.id),
                              title: groupedForm.title,
                              count: groupedForm.instances.length
                            });
                            setShowDeleteModal(true);
                            setActiveDropdown(null);
                          }}
                        >
                          <Trash2 size={14} /> {groupedForm.instances.length > 1 ? "Delete Group" : "Delete Form"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.deptCardInfo}>
                  <h3 className={styles.deptCardTitle}>{groupedForm.title}</h3>
                  <p className={styles.deptCardDesc}>
                    {groupedForm.instances.length} Active Deployments
                  </p>
                  <div className={styles.deptLocationRow}>
                    <MapPin size={12} />
                    <span>{locationLabel}</span>
                  </div>
                </div>

                <div className={styles.deptCardMetrics}>
                  <div className={styles.deptMetric}>
                    <FileCheck size={14} />
                    <span>{normalizeFields(groupedForm.formConfig).length} Fields</span>
                  </div>
                  <div className={styles.deptMetric}>
                    <MousePointer2 size={14} />
                    <span>{groupedForm.totalInteractions} Submissions</span>
                  </div>
                </div>

                {groupedForm.instances.length > 1 ? (
                  <button 
                    className={styles.groupCardManageBtn}
                    onClick={() => setDrilldownGroup(groupedForm)}
                  >
                    Manage {groupedForm.instances.length} Instances
                  </button>
                ) : (
                  <button 
                    className={styles.deptManageBtn}
                    onClick={() => setSelectedForm(primaryInstance)}
                  >
                    View Form Details
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent}`} style={{ 
            maxWidth: '1200px', 
            width: '96%', 
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>Step {wizardStep} of 3</span>
                <h3 className={styles.modalTitle}>{isEditMode ? 'Edit Form' : 'Create New Form'}</h3>
                <p className={styles.modalSubtitle}>Build a professional passenger feedback form</p>
              </div>
              <button className={styles.closeBtn} onClick={() => { setIsCreateModalOpen(false); resetWizard(); }}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.wizardProgress}>
              <div className={`${styles.progressStep} ${wizardStep >= 1 ? styles.active : ''}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 2 ? styles.active : ''}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 3 ? styles.active : ''}`} />
            </div>

            <div className={styles.modalBody} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 380px', 
              gap: '0', 
              flex: 1,
              minHeight: 0,
              padding: '0',
              overflow: 'hidden'
            }}>
              
              <div style={{ padding: '32px', borderRight: '1px solid #e2e8f0', overflow: 'auto' }}>
                {wizardStep === 1 && (
                  <div>
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                        Form Details
                      </h4>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Give your form a name and configure basic settings
                      </p>
                    </div>
                    
                    <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Form Name *</label>
                        <span className={styles.fieldDesc}>A clear title passengers will see</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <FileStack size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. Passenger Feedback Survey"
                          value={newForm.name}
                          onChange={(e) => setNewForm({...newForm, name: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Success Message</label>
                        <span className={styles.fieldDesc}>Message shown after submission</span>
                      </div>
                      <div className={styles.modalInputWrapper} style={{ padding: '16px', alignItems: 'flex-start' }}>
                        <CheckCircle2 size={18} style={{ marginTop: '2px', color: 'var(--brand-green)' }} />
                        <textarea 
                          placeholder="Thank you for your feedback!"
                          value={newForm.successMessage}
                          onChange={(e) => setNewForm({...newForm, successMessage: e.target.value})}
                          style={{ minHeight: '80px', resize: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '14px', background: 'transparent' }}
                        />
                      </div>
                    </div>

                    <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(21, 115, 71, 0.04), rgba(21, 115, 71, 0.08))', borderRadius: '16px', border: '1px solid rgba(21, 115, 71, 0.12)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                        <input 
                          type="checkbox"
                          checked={newForm.allowAnonymous}
                          onChange={(e) => setNewForm({...newForm, allowAnonymous: e.target.checked})}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--brand-green)' }}
                        />
                        Allow anonymous submissions
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>Recommended</span>
                      </label>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div>
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                        Assignment
                      </h4>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Select where this form will be deployed
                      </p>
                    </div>
                    
                    <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Location *</label>
                        <span className={styles.fieldDesc}>Which airport should host this form?</span>
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
                            selectedIds={newForm.locationIds}
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
                          options={departments.filter((dept: Department) => 
                            newForm.locationIds.length === 0 || 
                            newForm.locationIds.includes(dept.locationId) || 
                            (dept.location?.id && newForm.locationIds.includes(dept.location.id))
                          )}
                          selectedIds={newForm.departmentIds}
                          onChange={(ids) => setNewForm({...newForm, departmentIds: ids})}
                          placeholder="Select Departments"
                          icon={<Building2 size={18} />}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div>
                        <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                          Build Fields
                        </h4>
                        <p style={{ fontSize: '14px', color: '#64748b' }}>
                          Add and configure form fields ({newForm.fields.length} added)
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                      {FIELD_TYPES.map(ft => {
                        const Icon = ft.icon;
                        return (
                          <button
                            key={ft.value}
                            onClick={() => handleAddField(ft.value as FormField['type'])}
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
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Icon size={14} style={{ color: ft.color }} /> {ft.label}
                          </button>
                        );
                      })}
                    </div>

                    {newForm.fields.length === 0 ? (
                      <div className={styles.emptyStage} style={{ height: '220px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '2px dashed #e2e8f0', borderRadius: '20px' }}>
                        <div style={{ padding: '16px', background: 'rgba(21, 115, 71, 0.08)', borderRadius: '16px', marginBottom: '12px' }}>
                          <FileStack size={32} style={{ color: 'var(--brand-green)' }} />
                        </div>
                        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>No fields added yet</p>
                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Click a field type above to start building</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {Array.isArray(newForm.fields) && newForm.fields.map((field, index) => (
                          <div key={field.id} style={{ 
                            background: 'white', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '16px', 
                            padding: '20px',
                            transition: 'all 0.2s',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <span style={{ 
                                width: '28px', 
                                height: '28px', 
                                borderRadius: '8px', 
                                background: 'var(--brand-green)', 
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}>
                                {index + 1}
                              </span>
                              <select 
                                value={field.type}
                                onChange={(e) => handleUpdateField(field.id, { type: e.target.value as FormField['type'] })}
                                style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600, background: '#f8fafc' }}
                              >
                                {FIELD_TYPES.map(ft => (
                                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => handleRemoveField(field.id)}
                                style={{ 
                                  marginLeft: 'auto', 
                                  padding: '8px', 
                                  borderRadius: '8px', 
                                  border: 'none', 
                                  background: 'transparent',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <input 
                              type="text"
                              placeholder="Field label (e.g. How would you rate our service?)"
                              value={field.label}
                              onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                              style={{ 
                                width: '100%', 
                                fontSize: '14px', 
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '12px',
                                fontWeight: 500,
                              }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                                <input 
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                                  style={{ accentColor: 'var(--brand-green)' }}
                                />
                                Required field
                              </label>
                              {field.type === 'dropdown' && (
                                <input 
                                  type="text"
                                  placeholder="Options: Option 1, Option 2, Option 3"
                                  value={field.options?.join(', ') || ''}
                                  onChange={(e) => handleUpdateField(field.id, { 
                                    options: e.target.value.split(',').map(o => o.trim()).filter(o => o) 
                                  })}
                                  style={{ flex: 1, fontSize: '12px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
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

              <div style={{ 
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                padding: '32px 0 64px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                overflowY: 'auto'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: '#94a3b8', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1.5px', 
                  marginBottom: '20px',
                }}>
                  LIVE PREVIEW
                </div>
                
                <div style={{
                  width: '280px',
                  height: '560px',
                  background: '#000',
                  borderRadius: '44px',
                  padding: '10px',
                  position: 'relative',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                }}>
                  <div style={{
                    width: '90px',
                    height: '28px',
                    background: '#000',
                    borderRadius: '16px',
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                  }} />
                  
                  <div style={{
                    height: '100%',
                    background: '#fff',
                    borderRadius: '34px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <div style={{ 
                      height: '46px', 
                      padding: '0 20px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1e293b',
                    }}>
                      <span>9:41</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <div style={{ width: '16px', height: '10px', background: '#1e293b', borderRadius: '2px' }} />
                        <div style={{ width: '14px', height: '10px', background: '#1e293b', borderRadius: '2px' }} />
                      </div>
                    </div>

                    <div style={{ 
                      padding: '16px 20px', 
                      borderBottom: '1px solid #f1f5f9',
                      background: 'linear-gradient(to bottom, #fafafa, #ffffff)',
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                        {newForm.name || 'Untitled Form'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        {locations.find((l: Location) => l.id === newForm.locationIds[0])?.name || 'FAAN'} • {departments.find((d) => d.id === newForm.departmentIds[0])?.name || 'Operations'}
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
                      {(!newForm.fields || !Array.isArray(newForm.fields) || newForm.fields.length === 0) ? (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          height: '200px',
                          color: '#94a3b8',
                        }}>
                          <FileStack size={32} />
                          <p style={{ fontSize: '12px', marginTop: '8px' }}>No fields yet</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {Array.isArray(newForm.fields) && newForm.fields.slice(0, 5).map(field => (
                            <div key={field.id}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                                {field.label || 'Field'} {field.required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
                              </div>
                              {field.type === 'rating' && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} size={20} fill="#fbbf24" color="#fbbf24" />
                                  ))}
                                </div>
                              )}
                              {field.type === 'text' && (
                                <input 
                                  disabled
                                  placeholder="Enter text..."
                                  style={{ 
                                    height: '36px', 
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    background: '#f9fafb', 
                                    border: '1px solid #e5e7eb', 
                                    borderRadius: '8px',
                                    padding: '0 12px',
                                    fontSize: '13px',
                                  }}
                                />
                              )}
                              {field.type === 'textarea' && (
                                <textarea 
                                  disabled
                                  placeholder="Enter details..."
                                  style={{ 
                                    height: '60px',
                                    width: '100%',
                                    boxSizing: 'border-box', 
                                    background: '#f9fafb', 
                                    border: '1px solid #e5e7eb', 
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    fontSize: '13px',
                                    resize: 'none',
                                  }}
                                />
                              )}
                              {field.type === 'dropdown' && (
                                <div style={{ 
                                  height: '36px', 
                                  background: '#f9fafb', 
                                  border: '1px solid #e5e7eb', 
                                  borderRadius: '8px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between', 
                                  padding: '0 12px',
                                  fontSize: '12px', 
                                  color: '#9ca3af',
                                }}>
                                  Select option
                                  <ChevronRight size={14} />
                                </div>
                              )}
                              {field.type === 'date' && (
                                <div style={{ 
                                  height: '36px', 
                                  background: '#f9fafb', 
                                  border: '1px solid #e5e7eb', 
                                  borderRadius: '8px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  padding: '0 12px',
                                  fontSize: '12px', 
                                  color: '#9ca3af',
                                }}>
                                  <Calendar size={14} style={{ marginRight: '8px' }} />
                                  Pick a date
                                </div>
                              )}
                              {field.type === 'file' && (
                                <div style={{ 
                                  height: '60px', 
                                  border: '1.5px dashed #d1d5db', 
                                  borderRadius: '8px', 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  color: '#9ca3af', 
                                  fontSize: '11px',
                                }}>
                                  <Upload size={18} />
                                  Tap to upload
                                </div>
                              )}
                            </div>
                          ))}
                          {Array.isArray(newForm.fields) && newForm.fields.length > 5 && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>
                              +{newForm.fields.length - 5} more fields
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div style={{
                      padding: '16px 20px',
                      borderTop: '1px solid #f1f5f9',
                    }}>
                      <div style={{
                        background: 'var(--brand-green)',
                        color: 'white',
                        padding: '14px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}>
                        Submit
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              {wizardStep > 1 ? (
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => setWizardStep(wizardStep - 1)}
                  style={{ marginRight: 'auto' }}
                >
                  <ChevronLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}
              <button 
                className={styles.cancelBtn} 
                onClick={() => { setIsCreateModalOpen(false); resetWizard(); }}
              >
                Cancel
              </button>
              {wizardStep < 3 ? (
                <button 
                  className={styles.createButton}
                  onClick={() => setWizardStep(wizardStep + 1)}
                  disabled={
                    (wizardStep === 1 && !newForm.name) || 
                    (wizardStep === 2 && (newForm.locationIds.length === 0 || newForm.departmentIds.length === 0))
                  }
                  style={{ 
                    opacity: (
                      (wizardStep === 1 && !newForm.name) || 
                      (wizardStep === 2 && (newForm.locationIds.length === 0 || newForm.departmentIds.length === 0))
                    ) ? 0.5 : 1 
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  className={styles.createButton}
                  onClick={handleSaveForm}
                  disabled={(!Array.isArray(newForm.fields) || newForm.fields.length === 0) || createMutation.isPending || updateMutation.isPending}
                  style={{ opacity: (!Array.isArray(newForm.fields) || newForm.fields.length === 0 || createMutation.isPending || updateMutation.isPending) ? 0.5 : 1 }}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    'Saving...'
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> {isEditMode ? 'Update Form' : 'Save Form'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedForm && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.wideModal}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={`${styles.typeTag} feedback`}>
                  Passenger Form
                </span>
                <h3 className={styles.modalTitle}>{selectedForm.title}</h3>
                <p className={styles.modalSubtitle}>Form configuration and field details</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedForm(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailMain}>
                  <section className={styles.messageSection}>
                    <h4 className={styles.detailLabel}>Form Fields ({normalizeFields(selectedForm.formConfig).length})</h4>
                    <div className={styles.messageCard}>
                      {normalizeFields(selectedForm.formConfig).map((field: FormField, i: number) => (
                        <div key={field.id} style={{ padding: '16px 0', borderBottom: i < (normalizeFields(selectedForm.formConfig).length) - 1 ? '1px solid #e2e8f0' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ 
                              fontWeight: 700, 
                              color: '#1e293b',
                              fontSize: '15px'
                            }}>{field.label}</span>
                            {field.required && <span className={styles.priorityTag} style={{ fontSize: '9px' }}>Required</span>}
                            <span style={{ 
                              fontSize: '11px', 
                              color: '#94a3b8',
                              marginLeft: 'auto',
                              textTransform: 'capitalize',
                              background: '#f1f5f9',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontWeight: 600
                            }}>{field.type}</span>
                          </div>
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
                        <MousePointer2 size={18} />
                        <div><span>Total Submissions</span><strong>{selectedForm.interactions || 0}</strong></div>
                      </div>
                      <div className={styles.infoCard}>
                        <FileCheck size={18} />
                        <div><span>Form Fields</span><strong>{normalizeFields(selectedForm.formConfig).length}</strong></div>
                      </div>
                      <div className={styles.infoCard}>
                        <Calendar size={18} />
                        <div><span>Created</span><strong>{selectedForm.createdAt ? new Date(selectedForm.createdAt).toLocaleDateString() : '-'}</strong></div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.dangerZone}>
                    <button className={styles.archiveBtn} onClick={() => {
                      setDeleteData({
                        type: 'SINGLE',
                        id: selectedForm.id,
                        title: selectedForm.title
                      });
                      setShowDeleteModal(true);
                    }}>
                      <Trash2 size={16} /> Delete Form
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelectedForm(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deleteData && (
        <div className={styles.modalOverlay} style={{ zIndex: 1000 }}>
          <div className={styles.modalContent} style={{ maxWidth: '450px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '32px 32px 24px 32px', textAlign: 'center' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '20px', 
                background: '#fef2f2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 20px auto',
                color: '#ef4444'
              }}>
                <Trash2 size={32} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                {deleteData.type === 'GROUP' ? 'Delete Form Group?' : 'Delete Form?'}
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                {deleteData.type === 'GROUP' ? (
                  <>Are you sure you want to delete <strong>{deleteData.title}</strong>? This will remove all <strong>{deleteData.count}</strong> instances of this form across all departments.</>
                ) : (
                  <>Are you sure you want to delete the form <strong>{deleteData.title}</strong>? This action cannot be undone.</>
                )}
              </p>
            </div>
            <div style={{ 
              padding: '24px 32px', 
              background: '#f8fafc', 
              display: 'flex', 
              gap: '12px',
              borderTop: '1px solid #f1f5f9'
            }}>
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteData(null); }}
                style={{ 
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                style={{ 
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: deleteMutation.isPending ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {deleteMutation.isPending ? 'Deleting...' : (
                  <>
                    <Trash2 size={16} />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}