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
  useFeedbackForms, 
  useCreateFeedbackForm, 
  useUpdateFeedbackForm,
  useDeleteFeedbackForm
} from "@/hooks/useFeedbackForms";
import { useTouchpoints } from "@/hooks/useTouchpoints";
import { useLocations } from "@/hooks/useLocations";
import { useDepartments } from "@/hooks/useDepartments";
import { FeedbackForm, FeedbackFormField, Touchpoint, Location, Department, FormField, TouchpointType } from "@/types/api";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { MultiSelect } from "@/components/displays/MultiSelect";
import DeleteConfirmationModal from "@/components/displays/DeleteConfirmationModal";

const FIELD_TYPES = [
  { value: 'rating', label: 'Rating', icon: Star, color: '#f59e0b' },
  { value: 'text', label: 'Text Input', icon: Type, color: '#3b82f6' },
  { value: 'textarea', label: 'Long Text', icon: FileText, color: '#8b5cf6' },
  { value: 'dropdown', label: 'Dropdown', icon: List, color: '#ec4899' },
  { value: 'checkbox', label: 'Multi-Select', icon: ClipboardList, color: '#14b8a6' },
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
  const { data: formsData, isLoading: formsLoading } = useFeedbackForms({ 
    locationId: currentLocation || undefined
  });
  const { data: touchpointsData } = useTouchpoints({ 
    type: 'FEEDBACK',
    locationId: currentLocation || undefined
  });
  const { data: locationsData } = useLocations();
  const { data: departmentsData } = useDepartments();


  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<FeedbackForm | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [drilldownGroup, setDrilldownGroup] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemName: string;
    itemType: 'form';
    isGroup: boolean;
    instanceCount: number;
    affectedItems?: string[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    itemName: '',
    itemType: 'form',
    isGroup: false,
    instanceCount: 0,
    affectedItems: [],
    onConfirm: () => {},
  });
  
  const createMutation = useCreateFeedbackForm();
  const updateMutation = useUpdateFeedbackForm();
  const deleteMutation = useDeleteFeedbackForm();

  const forms = formsData?.data || [];
  const locations = locationsData?.data || [];
  const departments = departmentsData?.data || [];
  const touchpoints = touchpointsData?.data || [];

  // Grouping Logic for Forms (based on title)
  const groupedForms = forms.reduce((acc: Record<string, any>, form) => {
    const key = form.title; 
    if (!acc[key]) {
      acc[key] = {
        ...form,
        title: form.title,
        instances: [form],
        totalInteractions: 0 // Will need to sum from linked touchpoints later if available
      };
    } else {
      acc[key].instances.push(form);
    }
    return acc;
  }, {});

  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    successMessage: '',
    locationIds: (currentLocation ? [currentLocation] : []) as string[],
    departmentIds: [] as string[],
    isActive: true,
    fields: [] as Partial<FeedbackFormField>[],
  });

  const filteredGroupedForms = Object.values(groupedForms).sort((a: any, b: any) => 
    (b.totalInteractions || 0) - (a.totalInteractions || 0)
  ).filter((f: any) => 
    !searchTerm || f.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFields = forms.reduce((sum, form) => sum + (form.fields?.length || 0), 0);
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
    const newField: Partial<FeedbackFormField> = {
      type: type,
      label: 'New Field',
      name: `field_${Date.now()}`,
      required: false,
      options: type === 'dropdown' ? ['Option 1', 'Option 2'] : [],
      order: newForm.fields.length,
    };
    setNewForm({...newForm, fields: [...newForm.fields, newField]});
  };

  const handleUpdateField = (index: number, updates: Partial<FeedbackFormField>) => {
    setNewForm({
      ...newForm,
      fields: newForm.fields.map((f, i) => i === index ? { ...f, ...updates } : f)
    });
  };

  const handleRemoveField = (index: number) => {
    setNewForm({
      ...newForm,
      fields: newForm.fields.filter((_, i) => i !== index)
    });
  };

  const handleSaveForm = () => {
    if (!newForm.title.trim()) return toast.error("Form title is required");
    if (newForm.locationIds.length === 0) return toast.error("Please select at least one location");
    if (newForm.departmentIds.length === 0) return toast.error("Please select at least one department");
    if (newForm.fields.length === 0) return toast.error("Please add at least one field to the form");

    const creations: any[] = [];
    newForm.locationIds.forEach(locId => {
      newForm.departmentIds.forEach(deptId => {
        const dept = departments.find(d => d.id === deptId);
        if (dept && (dept.locationId === locId || dept.location?.id === locId)) {
          creations.push({
            title: newForm.title,
            description: newForm.description,
            locationId: locId,
            departmentId: deptId,
            isActive: newForm.isActive,
            fields: newForm.fields.map((f, i) => ({ ...f, order: i })),
          });
        }
      });
    });

    if (creations.length === 0) {
      return toast.error("No valid Location-Department combinations found.");
    }

    if (isEditMode && editingFormId) {
      updateMutation.mutate({ id: editingFormId, data: creations[0] }, {
        onSuccess: () => {
          toast.success("Form updated successfully");
          setIsCreateModalOpen(false);
          resetWizard();
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || "Failed to update form";
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
        .catch((error: any) => {
          const message = error.response?.data?.message || "Failed to create forms";
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

  const confirmDeleteForm = (form: FeedbackForm) => {
    setDeleteModal({
      isOpen: true,
      itemName: form.title,
      itemType: 'form',
      isGroup: false,
      instanceCount: 1,
      affectedItems: [],
      onConfirm: () => {
        deleteMutation.mutate(form.id, {
          onSuccess: () => {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
            toast.success("Form deleted successfully");
            if (activeDropdown === form.id) setActiveDropdown(null);
          }
        });
      }
    });
  };

  const confirmDeleteGroup = (groupedForm: any) => {
    const locationsList = groupedForm.instances.map((inst: any) => {
      const loc = locations.find(l => l.id === inst.locationId);
      const dept = departments.find(d => d.id === inst.departmentId);
      return `${loc?.name || 'Unknown'}${dept ? ` - ${dept.name}` : ''}`;
    });

    setDeleteModal({
      isOpen: true,
      itemName: groupedForm.title,
      itemType: 'form',
      isGroup: true,
      instanceCount: groupedForm.instances.length,
      affectedItems: locationsList,
      onConfirm: () => {
        const promises = groupedForm.instances.map((inst: any) => deleteMutation.mutateAsync(inst.id));
        toast.promise(Promise.all(promises), {
          loading: 'Deleting forms...',
          success: () => {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
            setActiveDropdown(null);
            return 'All instances deleted successfully';
          },
          error: 'Failed to delete some forms'
        });
      }
    });
  };

  const resetWizard = () => {
    setWizardStep(1);
    setNewForm({
      title: '',
      description: '',
      successMessage: '',
      locationIds: currentLocation ? [currentLocation] : [],
      departmentIds: [],
      isActive: true,
      fields: [],
    });
    setEditingFormId(null);
    setIsEditMode(false);
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
            {drilldownGroup.instances.map((form: FeedbackForm) => {
              const accent = FORM_ACCENTS[hashToIndex(form.title, FORM_ACCENTS.length)];
              const accentStyle = {
                "--accent-bg": accent.bg,
                "--accent-fg": accent.fg,
                "--accent-ring": accent.ring,
              } as React.CSSProperties;

              const loc = locations.find(l => l.id === form.locationId);
              const dept = departments.find(d => d.id === form.departmentId);

              return (
                <div key={form.id} className={styles.deptCard}>
                  <div className={styles.deptCardHeader}>
                    <div className={styles.deptIconBox} style={accentStyle}>
                      <FileStack size={24} />
                    </div>
                    <div className={styles.cardMenuWrapper}>
                      <button
                        className={styles.cardMore}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === form.id ? null : form.id);
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === form.id && (
                        <div className={styles.cardDropdown}>
                          <button
                            className={styles.dropdownItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditMode(true);
                              setEditingFormId(form.id);

                              setNewForm({
                                title: form.title,
                                description: form.description || '',
                                successMessage: form.successMessage || '',
                                locationIds: [form.locationId],
                                departmentIds: [form.departmentId],
                                isActive: form.isActive,
                                fields: form.fields,
                              });

                              setIsCreateModalOpen(true);
                              setActiveDropdown(null);
                            }}                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            className={`${styles.dropdownItem} ${styles.danger}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteForm(form);
                            }}
                          >
                            <Trash2 size={14} /> Delete Template
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.deptCardInfo}>
                    <h3 className={styles.deptCardTitle}>{form.title}</h3>
                    <p className={styles.deptCardDesc}>
                      {form.description || "No description provided"}
                    </p>
                    <div className={styles.deptLocationRow}>
                      <MapPin size={12} />
                      <span>{loc?.name || '—'} {dept ? `(${dept.code})` : ''}</span>
                    </div>
                  </div>

                  <div className={styles.deptCardMetrics}>
                    <div className={styles.deptMetric}>
                      <FileCheck size={14} />
                      <span>{form.fields?.length || 0} Fields</span>
                    </div>
                  </div>

                  <button 
                    className={styles.deptManageBtn}
                    onClick={() => setSelectedForm(form)}
                  >
                    View Template Details
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
            const loc = locations.find(l => l.id === primaryInstance.locationId);
            const primaryLocationName = loc?.name || roleLocationName || "—";
            
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
                            setIsEditMode(true);
                            setEditingFormId(groupedForm.id);
                            
                            const uniqueLocs = Array.from(new Set(groupedForm.instances.map((i: any) => String(i.locationId)))).filter(id => id !== 'undefined' && id !== 'null');
                            const uniqueDepts = Array.from(new Set(groupedForm.instances.map((i: any) => String(i.departmentId)))).filter(id => id !== 'undefined' && id !== 'null');

                            setNewForm({
                              title: groupedForm.title,
                              description: groupedForm.description || '',
                              successMessage: primaryInstance.successMessage || '',
                              locationIds: uniqueLocs as string[],
                              departmentIds: uniqueDepts as string[],
                              isActive: groupedForm.isActive,
                              fields: groupedForm.fields || [],
                            });
                            
                            setIsCreateModalOpen(true);
                            setActiveDropdown(null);
                          }}
                        >
                          <Edit size={14} /> {groupedForm.instances.length > 1 ? "Edit Group" : "Edit"}
                        </button>
                        <button
                          className={`${styles.dropdownItem} ${styles.danger}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteGroup(groupedForm);
                          }}
                        >
                          <Trash2 size={14} /> {groupedForm.instances.length > 1 ? "Delete Group" : "Delete"}
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
                    <span>{primaryInstance.fields?.length || 0} Fields</span>
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
                    View Template Details
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
                  <h3 className={styles.modalTitle}>{isEditMode ? 'Edit Form' : 'Create Passenger Form'}</h3>
                  <p className={styles.modalSubtitle}>Design a structured passenger form</p>
                </div>
              </div>

              <div className={styles.wizardProgress} style={{ padding: '24px 32px', borderBottom: 'none', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                   <span className={styles.wizardBadge} style={{ margin: 0 }}>Step {wizardStep} of 3</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className={`${styles.progressStep} ${wizardStep >= 1 ? styles.active : ''}`} style={{ flex: 1, height: '6px', borderRadius: '3px' }} />
                  <div className={`${styles.progressStep} ${wizardStep >= 2 ? styles.active : ''}`} style={{ flex: 1, height: '6px', borderRadius: '3px' }} />
                  <div className={`${styles.progressStep} ${wizardStep >= 3 ? styles.active : ''}`} style={{ flex: 1, height: '6px', borderRadius: '3px' }} />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px 32px' }}>
                {wizardStep === 1 && (
                  <div>
                    <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Form Title *</label>
                        <span className={styles.fieldDesc}>A clear title passengers will see</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <FileStack size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. Passenger Feedback Survey"
                          value={newForm.title}
                          onChange={(e) => setNewForm({...newForm, title: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Description</label>
                        <span className={styles.fieldDesc}>Brief internal description</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <FileText size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. Monthly satisfaction survey"
                          value={newForm.description}
                          onChange={(e) => setNewForm({...newForm, description: e.target.value})}
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
                          checked={newForm.isActive}
                          onChange={(e) => setNewForm({...newForm, isActive: e.target.checked})}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--brand-green)' }}
                        />
                        Form is Active
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>Template Status</span>
                      </label>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Form Fields ({newForm.fields.length})</h4>
                      <button 
                        onClick={() => handleAddField('text')}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '8px 16px', 
                          borderRadius: '8px', 
                          border: '1px solid var(--brand-green)', 
                          background: 'rgba(21, 115, 71, 0.05)', 
                          color: 'var(--brand-green)', 
                          fontWeight: 600, 
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={16} /> Add Field
                      </button>
                    </div>

                    {newForm.fields.length === 0 ? (
                      <div className={styles.emptyStage} style={{ height: '220px', background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>
                        <p style={{ fontSize: '13px', color: '#64748b' }}>No fields added yet</p>
                      </div>
                    ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {Array.isArray(newForm.fields) && newForm.fields.map((field, index) => (
                          <div key={index} style={{ 
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
                                onChange={(e) => handleUpdateField(index, { type: e.target.value })}
                                style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600, background: '#f8fafc' }}
                              >
                                {FIELD_TYPES.map(ft => (
                                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => handleRemoveField(index)}
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
                              onChange={(e) => handleUpdateField(index, { label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
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
                                  onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                                  style={{ accentColor: 'var(--brand-green)' }}
                                />
                                Required field
                              </label>
                                {(field.type === 'dropdown' || field.type === 'checkbox') && (
                                  <input 
                                    type="text"
                                    placeholder="Options: Option 1, Option 2, Option 3"
                                    value={field.options?.join(', ') || ''}
                                    onChange={(e) => handleUpdateField(index, { 
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
                  onClick={() => { setIsCreateModalOpen(false); resetWizard(); }}
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
                    disabled={(wizardStep === 1 && !newForm.title) || (wizardStep === 2 && (newForm.locationIds.length === 0 || newForm.departmentIds.length === 0))}
                    style={{ padding: '10px 28px', fontSize: '14px', fontWeight: 600, opacity: ((wizardStep === 1 && !newForm.title) || (wizardStep === 2 && (newForm.locationIds.length === 0 || newForm.departmentIds.length === 0))) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    className={styles.createButton} 
                    onClick={handleSaveForm} 
                    disabled={newForm.fields.length === 0 || createMutation.isPending || updateMutation.isPending}
                    style={{ padding: '10px 28px', fontSize: '14px', fontWeight: 600, opacity: (newForm.fields.length === 0 || createMutation.isPending || updateMutation.isPending) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    { (createMutation.isPending || updateMutation.isPending) ? 'Saving...' : <><CheckCircle2 size={18} /> {isEditMode ? 'Update Form' : 'Save Form'}</> }
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
                    onClick={() => { setIsCreateModalOpen(false); resetWizard(); }}
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
                      <div style={{ 
                        padding: '16px 20px', 
                        borderBottom: '1px solid #f1f5f9',
                        background: 'linear-gradient(to bottom, #fafafa, #ffffff)',
                      }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                          {newForm.title || 'Untitled Form'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          {locations.find((l: Location) => l.id === newForm.locationIds[0])?.name || 'FAAN'} • {departments.find((d) => d.id === newForm.departmentIds[0])?.name || 'Operations'}
                        </div>
                      </div>
                      
                      {/* Form Content */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                        {(!newForm.fields || !Array.isArray(newForm.fields) || newForm.fields.length === 0) ? (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '100%',
                            color: '#94a3b8',
                            opacity: 0.5
                          }}>
                            <FileStack size={48} />
                            <p style={{ fontSize: '13px', marginTop: '12px', fontWeight: 500 }}>No fields added yet</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {newForm.fields.map((field, i) => (
                              <div key={field.id || i}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                  {field.label || 'New Question'} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                </div>
                                {field.type === 'rating' && (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    {[1,2,3,4,5].map(s => (
                                      <Star key={s} size={24} fill="#fbbf24" color="#fbbf24" style={{ cursor: 'pointer' }} />
                                    ))}
                                  </div>
                                )}
                                {field.type === 'text' && (
                                  <input 
                                    type="text" 
                                    placeholder="Enter text..."
                                    disabled
                                    style={{ 
                                      height: '40px', 
                                      background: '#f9fafb', 
                                      border: '1px solid #e5e7eb', 
                                      borderRadius: '10px', 
                                      width: '100%',
                                      padding: '0 12px',
                                      fontSize: '13px',
                                      color: '#1e293b'
                                    }}
                                  />
                                )}
                                {field.type === 'textarea' && (
                                  <textarea 
                                    placeholder="Enter long text..."
                                    disabled
                                    style={{ 
                                      height: '80px', 
                                      background: '#f9fafb', 
                                      border: '1px solid #e5e7eb', 
                                      borderRadius: '10px', 
                                      width: '100%',
                                      padding: '12px',
                                      fontSize: '13px',
                                      color: '#1e293b',
                                      resize: 'none',
                                      fontFamily: 'inherit'
                                    }}
                                  />
                                )}
                                {field.type === 'dropdown' && (
                                  <select
                                    defaultValue=""
                                    disabled
                                    style={{ 
                                      height: '40px', 
                                      background: '#f9fafb', 
                                      border: '1px solid #e5e7eb', 
                                      borderRadius: '10px', 
                                      width: '100%', 
                                      padding: '0 12px', 
                                      fontSize: '13px', 
                                      color: '#1e293b', 
                                      cursor: 'pointer',
                                      fontFamily: 'inherit'
                                    }}
                                  >
                                    <option value="" disabled>Select option</option>
                                    {field.options?.filter(o => o.trim()).map((opt, i) => <option key={`${opt}-${i}`}>{opt}</option>)}
                                  </select>
                                )}
                                {field.type === 'checkbox' && (
                                  <div style={{ width: '100%' }}>
                                    <MultiSelect
                                      options={(field.options || []).filter(o => o.trim()).map(opt => ({ id: opt, name: opt }))}
                                      selectedIds={[]}
                                      onChange={() => {}}
                                      placeholder="Select options..."
                                    />
                                  </div>
                                )}
                                {field.type === 'date' && (
                                  <input 
                                    type="date"
                                    disabled
                                    style={{ height: '40px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', width: '100%', padding: '0 12px', fontSize: '13px', color: '#1e293b', fontFamily: 'inherit', cursor: 'pointer' }}
                                  />
                                )}
                                {field.type === 'file' && (
                                  <div style={{ height: '80px', border: '2px dashed #e5e7eb', borderRadius: '10px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#9ca3af', cursor: 'pointer', background: '#f9fafb' }}>
                                    <Upload size={20} />
                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Tap to upload</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
                        <div style={{ 
                          width: '100%',
                          background: 'var(--brand-green)', 
                          color: 'white', 
                          padding: '14px', 
                          borderRadius: '14px', 
                          textAlign: 'center', 
                          fontSize: '15px', 
                          fontWeight: 700, 
                          opacity: 0.9
                        }}>
                          Submit Feedback
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                    <h4 className={styles.detailLabel}>Form Fields ({selectedForm.fields?.length || 0})</h4>
                    <div className={styles.messageCard}>
                      {selectedForm.fields?.map((field: FeedbackFormField, i: number) => (
                        <div key={field.id} style={{ padding: '16px 0', borderBottom: i < (selectedForm.fields?.length || 0) - 1 ? '1px solid #e2e8f0' : 'none' }}>
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
                        <div><span>Total Submissions</span><strong>0</strong></div>
                      </div>
                      <div className={styles.infoCard}>
                        <FileCheck size={18} />
                        <div><span>Form Fields</span><strong>{selectedForm.fields?.length || 0}</strong></div>
                      </div>
                      <div className={styles.infoCard}>
                        <Calendar size={18} />
                        <div><span>Created</span><strong>{selectedForm.createdAt ? new Date(selectedForm.createdAt).toLocaleDateString() : '-'}</strong></div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.dangerZone}>
                    <button className={styles.archiveBtn} onClick={() => {
                      confirmDeleteForm(selectedForm);
                    }}>
                      <Trash2 size={16} /> Delete Template
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

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModal.onConfirm}
        itemName={deleteModal.itemName}
        itemType={deleteModal.itemType}
        isGroup={deleteModal.isGroup}
        instanceCount={deleteModal.instanceCount}
        affectedItems={deleteModal.affectedItems}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}