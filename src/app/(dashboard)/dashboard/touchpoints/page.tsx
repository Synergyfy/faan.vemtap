"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  QrCode, 
  Download, 
  Edit, 
  Power,
  Trash2,
  X,
  ExternalLink,
  MapPin,
  Briefcase,
  Layers,
  FileText,
  Wifi,
  Building2,
  MousePointer2,
  CheckCircle,
  AlertCircle,
  Inbox,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Copy,
  Check,
  ClipboardList
} from "lucide-react";
import Image from "next/image";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { 
  useTouchpoints, 
  useCreateTouchpoint, 
  useUpdateTouchpoint, 
  useArchiveTouchpoint,
  useDeleteTouchpoint,
  useDownloadQr
} from "@/hooks/useTouchpoints";
import { useLocations } from "@/hooks/useLocations";
import { useDepartments } from "@/hooks/useDepartments";
import { TouchpointType, Touchpoint, Location, Department } from "@/types/api";
import { MultiSelect } from "@/components/displays/MultiSelect";
import { toast } from "sonner";
import { AxiosError } from "axios";
import DeleteConfirmationModal from "@/components/displays/DeleteConfirmationModal";

const TOUCHPOINT_ACCENTS = [
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

export default function TouchpointsPage() {
  const { currentRole, currentLocation, locationName: roleLocationName } = useRole();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [origin, setOrigin] = useState("");
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [currentTouchpoint, setCurrentTouchpoint] = useState<Touchpoint | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedLocIds, setSelectedLocIds] = useState<string[]>([]);
  const [tempLocIds, setTempLocIds] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [drilldownGroup, setDrilldownGroup] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemName: string;
    itemType: 'touchpoint';
    isGroup: boolean;
    instanceCount: number;
    affectedItems?: string[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    itemName: '',
    itemType: 'touchpoint',
    isGroup: false,
    instanceCount: 0,
    affectedItems: [],
    onConfirm: () => {},
  });

  const { data: tpData, isLoading: tpLoading } = useTouchpoints({
    locationId: currentLocation || undefined
  });

  const { data: formsData } = useTouchpoints();
  const { data: locationsData } = useLocations();
  const { data: deptsData } = useDepartments();


  const createMutation = useCreateTouchpoint();
  const updateMutation = useUpdateTouchpoint();
  const deleteMutation = useDeleteTouchpoint();
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = (format: 'png' | 'svg' | 'jpg') => {
    if (!currentTouchpoint) return;
    
    const canvas = document.getElementById(`qr-canvas-${currentTouchpoint.uuid}`) as HTMLCanvasElement;
    const svg = document.getElementById(`qr-svg-${currentTouchpoint.uuid}`) as unknown as SVGElement;
    
    if (format === 'svg' && svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr-${currentTouchpoint.title.toLowerCase().replace(/\s+/g, '-')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (canvas) {
      const url = canvas.toDataURL(format === 'jpg' ? "image/jpeg" : "image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr-${currentTouchpoint.title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTouchpointId, setEditingTouchpointId] = useState<string | null>(null);

  const [newTouchpoint, setNewTouchpoint] = useState({
    title: "",
    description: "",
    departmentIds: [] as string[],
    type: TouchpointType.FEEDBACK,
    templateIds: [] as string[]
  });

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const locationsToUse = currentRole === 'LOCATION_ADMIN' ? [(currentLocation || "")] : selectedLocIds;
    
    if (locationsToUse.length === 0) return toast.error("Please select at least one location");
    if (newTouchpoint.departmentIds.length === 0) return toast.error("Please select at least one department");

    const creations: any[] = [];
    locationsToUse.forEach(locId => {
      newTouchpoint.departmentIds.forEach(deptId => {
        // Find if department belongs to this location
        const dept = departments.find(d => d.id === deptId);
        if (dept && (dept.locationId === locId || dept.location?.id === locId)) {
          creations.push({
            title: newTouchpoint.title,
            description: newTouchpoint.description,
            type: newTouchpoint.type,
            departmentId: deptId,
            locationId: locId,
            formConfig: [],
            templateIds: newTouchpoint.templateIds
          });
        }
      });
    });

    if (creations.length === 0) {
      return toast.error("No valid Location-Department combinations found.");
    }

    if (isEditMode && editingTouchpointId) {
      updateMutation.mutate({ uuid: editingTouchpointId, data: creations[0] }, {
        onSuccess: () => {
          toast.success("Touchpoint updated successfully");
          setIsModalOpen(false);
          resetWizard();
        },
        onError: (error) => {
          const axiosError = error as AxiosError<{ message: string | string[] }>;
          const message = axiosError.response?.data?.message || "Failed to update touchpoint";
          toast.error(Array.isArray(message) ? message[0] : message);
        }
      });
    } else {
      Promise.all(creations.map(payload => createMutation.mutateAsync(payload)))
        .then(() => {
          toast.success(`${creations.length} touchpoint(s) created successfully`);
          setIsModalOpen(false);
          resetWizard();
        })
        .catch((error) => {
          const axiosError = error as AxiosError<{ message: string | string[] }>;
          const message = axiosError.response?.data?.message || "Failed to create touchpoints";
          toast.error(Array.isArray(message) ? message[0] : message);
        });
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setIsEditMode(false);
    setEditingTouchpointId(null);
    setNewTouchpoint({ title: "", description: "", departmentIds: [], type: TouchpointType.FEEDBACK, templateIds: [] });
    setSelectedLocIds([]);
    setTempLocIds([]);
  };

  const toggleStatus = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ 
      uuid: id, 
      data: { isActive: !currentStatus }
    });
  };

  const confirmDeleteTouchpoint = (tp: any) => {
    setDeleteModal({
      isOpen: true,
      itemName: tp.title,
      itemType: 'touchpoint',
      isGroup: false,
      instanceCount: 1,
      affectedItems: [],
      onConfirm: () => {
        deleteMutation.mutate(tp.id, {
          onSuccess: () => {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
            toast.success("Touchpoint deleted permanently");
            if (activeDropdown === tp.id) setActiveDropdown(null);
          }
        });
      }
    });
  };

  const confirmDeleteGroup = (gtp: any) => {
    const locationsList = gtp.instances.map((inst: any) => {
      const locName = typeof inst.location === 'object' ? inst.location?.name : (inst.location || roleLocationName || 'Unnamed Airport');
      const deptName = typeof inst.department === 'object' ? inst.department?.name : inst.department;
      return `${locName}${deptName ? ` - ${deptName}` : ''}`;
    });

    setDeleteModal({
      isOpen: true,
      itemName: gtp.title,
      itemType: 'touchpoint',
      isGroup: true,
      instanceCount: gtp.instances.length,
      affectedItems: locationsList,
      onConfirm: () => {
        const promises = gtp.instances.map((inst: any) => deleteMutation.mutateAsync(inst.id));
        toast.promise(Promise.all(promises), {
          loading: 'Deleting touchpoints...',
          success: () => {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
            setActiveDropdown(null);
            return 'All instances deleted permanently';
          },
          error: 'Failed to delete some touchpoints'
        });
      }
    });
  };

  const touchpoints = (tpData?.data || []) as Touchpoint[];
  const locations = (locationsData?.data || []) as Location[];
  const departments = (deptsData?.data || []) as Department[];
  const forms = (formsData?.data || []) as Touchpoint[];

  // Grouping Logic for Touchpoints
  const groupedTPs = touchpoints.reduce((acc: Record<string, any>, tp) => {
    const key = `${tp.title}-${tp.type}`;
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

  const getSelectedLocationName = () => {
    if (currentRole === 'LOCATION_ADMIN') return roleLocationName;
    if (selectedLocIds.length === 1) return locations.find(l => l.id === selectedLocIds[0])?.name || "Selected Location";
    if (selectedLocIds.length > 1) return `${selectedLocIds.length} Locations Selected`;
    return "All Selected Locations";
  };

  const generatedId = `tp-${Math.random().toString(36).substr(2, 6)}`;
  const dynamicLink = `${origin}/p/${generatedId}`;

  const filteredGroupedTPs = Object.values(groupedTPs).filter((t: any) => 
    !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = touchpoints.filter(t => t.isActive).length;
  const inactiveCount = touchpoints.filter(t => !t.isActive).length;
  const totalInteractions = touchpoints.reduce((sum, t) => sum + (t.interactions || 0), 0);

  const scopeLabel =
    currentRole === "LOCATION_ADMIN"
      ? roleLocationName || "Your Location"
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
              <h2 className={styles.deptHeroTitle}>Touchpoints Management</h2>
              <p className={styles.deptHeroSubtitle}>
                Create and manage QR & NFC engagement points across airport locations. Track interactions and monitor passenger feedback in real-time.
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
              <span>{currentRole === 'LOCATION_ADMIN' ? 'Location Admin' : 'System Admin'}</span>
            </span>
          </div>
        </div>

        <div className={styles.deptHeroActions}>
          <button
            className={styles.createButton}
            onClick={() => {
              setNewTouchpoint({ title: "", description: "", departmentIds: [], type: TouchpointType.FEEDBACK, templateIds: [] });
              if (currentRole === 'LOCATION_ADMIN' && currentLocation) {
                setSelectedLocIds([currentLocation]);
                setIsModalOpen(true);
                setWizardStep(1);
              } else {
                setShowLocationPicker(true);
              }
            }}
          >
            <Plus size={18} />
            <span>Create Touchpoint</span>
          </button>
          <p className={styles.deptHeroHint}>Deploy new QR/NFC engagement points.</p>
        </div>
      </div>

      <div className={styles.deptStatsGrid} aria-label="Touchpoints summary">
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(21, 115, 71, 0.12)', border: '1px solid rgba(21, 115, 71, 0.22)', color: '#157347' }} aria-hidden="true">
            <CheckCircle size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Active</div>
            <div className={styles.deptStatValue}>{activeCount}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.22)', color: '#64748b' }} aria-hidden="true">
            <AlertCircle size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Inactive</div>
            <div className={styles.deptStatValue}>{inactiveCount}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} style={{ background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.22)', color: '#2563eb' }} aria-hidden="true">
            <MousePointer2 size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Total Interactions</div>
            <div className={styles.deptStatValue}>{totalInteractions}</div>
          </div>
        </div>
      </div>

      <div className={styles.deptControlsCard}>
        <div className={styles.deptControlsRow}>
          <div className={`${styles.searchBar} ${styles.deptSearchBar}`}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search touchpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.deptControlsMeta} aria-live="polite">
            {tpLoading ? (
              <span>Loading...</span>
            ) : (
              <span>
                Showing <strong>{filteredGroupedTPs.length}</strong> groups of <strong>{touchpoints.length}</strong> touchpoints
              </span>
            )}
          </div>
        </div>
      </div>

      {tpLoading ? (
        <div className={styles.deptGrid} aria-label="Loading touchpoints">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`tp-skeleton-${i}`} className={`${styles.deptCard} ${styles.deptSkeletonCard}`}>
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
      ) : filteredGroupedTPs.length === 0 ? (
        <div className={styles.deptEmptyState} role="status">
          <div className={styles.deptEmptyIcon} aria-hidden="true">
            <Inbox size={22} />
          </div>
          <h3 className={styles.deptEmptyTitle}>
            {searchTerm ? "No touchpoints match your search" : "No touchpoints created yet"}
          </h3>
          <p className={styles.deptEmptyText}>
            {searchTerm
              ? "Try a different keyword or clear the search."
              : "Create your first QR/NFC touchpoint to start collecting passenger feedback."}
          </p>
          <div className={styles.deptEmptyActions}>
            {searchTerm ? (
              <button className={styles.cancelBtn} onClick={() => setSearchTerm("")}>
                Clear Search
              </button>
            ) : (
              <button
                className={styles.createButton}
                onClick={() => {
                  setNewTouchpoint({ title: "", description: "", departmentIds: [], type: TouchpointType.FEEDBACK, templateIds: [] });
                  if (currentRole === 'LOCATION_ADMIN' && currentLocation) {
                    setSelectedLocIds([currentLocation]);
                    setIsModalOpen(true);
                    setWizardStep(1);
                  } else {
                    setShowLocationPicker(true);
                  }
                }}
              >
                <Plus size={18} />
                <span>Create Touchpoint</span>
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
                <span className={styles.drilldownName}>{drilldownGroup.title} ({drilldownGroup.instances.length} Instances)</span>
              </div>
            </div>

            <div className={styles.deptGrid}>
              {drilldownGroup.instances.map((tp: any) => {
                const accent = TOUCHPOINT_ACCENTS[hashToIndex(tp.title, TOUCHPOINT_ACCENTS.length)];
                const accentStyle = {
                  "--accent-bg": accent.bg,
                  "--accent-fg": accent.fg,
                  "--accent-ring": accent.ring,
                } as CSSProperties;

                return (
                  <div key={tp.id} className={styles.deptCard}>
                    <div className={styles.deptCardHeader}>
                      <div className={styles.deptIconBox} style={accentStyle}>
                        <QrCode size={24} />
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
                              setIsEditMode(true);
                              setEditingTouchpointId(tp.id);
                              
                              const locId = tp.locationId || tp.location?.id;
                              const deptId = tp.departmentId || tp.department?.id;
                              const templateIds = (tp.templateIds || tp.templates?.map((t: any) => t.id) || tp.formTemplates?.map((t: any) => t.id) || []).map(String);

                              setNewTouchpoint({
                                title: tp.title,
                                description: tp.description || "",
                                departmentIds: deptId ? [String(deptId)] : [],
                                type: tp.type,
                                templateIds: templateIds
                              });
                              
                              setSelectedLocIds(locId ? [String(locId)] : []);
                              setIsModalOpen(true);
                              setActiveDropdown(null);
                            }}
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              className={`${styles.dropdownItem} ${styles.danger}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteTouchpoint(tp);
                                setActiveDropdown(null);
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.deptCardInfo}>
                      <h3 className={styles.deptCardTitle}>{tp.title}</h3>
                      <p className={styles.deptCardDesc}>
                        {tp.type === 'FEEDBACK' ? 'Passenger Feedback' : tp.type}
                      </p>
                      <div className={styles.deptLocationRow}>
                        <MapPin size={12} />
                        <span>{tp.location?.name || roleLocationName || '—'}</span>
                      </div>
                    </div>

                    <div className={styles.deptCardMetrics}>
                      <div className={styles.deptMetric}>
                        <CheckCircle size={14} />
                        <span>{tp.isActive ? "Active" : "Inactive"}</span>
                      </div>
                      <div className={styles.deptMetric}>
                        <MousePointer2 size={14} />
                        <span>{tp.totalInteractions || 0} Interactions</span>
                      </div>
                    </div>

                    <button 
                      className={styles.deptManageBtn}
                      onClick={() => {
                        setCurrentTouchpoint(tp);
                        setShowQrPreview(true);
                      }}
                    >
                      View QR Code
                      <ChevronRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.deptGrid}>
            {filteredGroupedTPs.map((gtp: any) => {
              const accent = TOUCHPOINT_ACCENTS[hashToIndex(gtp.title, TOUCHPOINT_ACCENTS.length)];
              const accentStyle = {
                "--accent-bg": accent.bg,
                "--accent-fg": accent.fg,
                "--accent-ring": accent.ring,
              } as CSSProperties;

              const primaryInstance = gtp.instances[0];
              const primaryLocationName = 
                typeof primaryInstance.location === 'string' 
                  ? primaryInstance.location 
                  : primaryInstance.location?.name || roleLocationName || "—";
              
              const locationLabel = gtp.instances.length > 1 
                ? `${primaryLocationName} +${gtp.instances.length - 1}`
                : primaryLocationName;

              return (
                <div key={gtp.title + gtp.type} className={styles.deptCard}>
                  <div className={styles.deptCardHeader}>
                    <div className={styles.deptIconBox} style={accentStyle} aria-hidden="true">
                      <QrCode size={24} />
                    </div>
                    <div className={styles.cardMenuWrapper}>
                      <button
                        className={styles.cardMore}
                        aria-label={`Actions for ${gtp.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === gtp.title ? null : gtp.title);
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === gtp.title && (
                        <div className={styles.cardDropdown}>
                          <button
                            className={styles.dropdownItem}
                            onClick={(e) => {
                            e.stopPropagation();
                            setIsEditMode(true);
                            setEditingTouchpointId(gtp.id);
                            
                            const uniqueLocs = Array.from(new Set(gtp.instances.map((i: any) => String(i.locationId || i.location?.id)))).filter(id => id !== 'undefined' && id !== 'null');
                            const uniqueDepts = Array.from(new Set(gtp.instances.map((i: any) => String(i.departmentId || i.department?.id)))).filter(id => id !== 'undefined' && id !== 'null');
                            const templateIds = (gtp.templateIds || gtp.instances[0].templates?.map((t: any) => t.id) || gtp.instances[0].formTemplates?.map((t: any) => t.id) || []).map(String);

                            setNewTouchpoint({
                              title: gtp.title,
                              description: gtp.description || "",
                              departmentIds: uniqueDepts as string[],
                              type: gtp.type,
                              templateIds: templateIds
                            });
                            
                            setSelectedLocIds(uniqueLocs as string[]);
                            setIsModalOpen(true);
                            setActiveDropdown(null);
                          }}
                          >
                            <Edit size={14} /> {gtp.instances.length > 1 ? "Edit Group" : "Edit"}
                          </button>
                          <button
                            className={`${styles.dropdownItem} ${styles.danger}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (gtp.instances.length > 1) {
                                confirmDeleteGroup(gtp);
                              } else {
                                confirmDeleteTouchpoint(gtp.instances[0]);
                              }
                              setActiveDropdown(null);
                            }}
                          >
                            <Trash2 size={14} /> {gtp.instances.length > 1 ? "Delete Group" : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.deptCardInfo}>
                    <h3 className={styles.deptCardTitle}>{gtp.title}</h3>
                    <p className={styles.deptCardDesc}>
                      {gtp.type === 'FEEDBACK' ? 'Passenger Feedback' : gtp.type}
                    </p>
                    <div className={styles.deptLocationRow}>
                      <MapPin size={12} />
                      <span>{locationLabel}</span>
                    </div>
                  </div>

                  <div className={styles.deptCardMetrics}>
                    <div className={styles.deptMetric}>
                      <CheckCircle size={14} />
                      <span>{gtp.instances.filter((i: any) => i.isActive).length} Active</span>
                    </div>
                    <div className={styles.deptMetric}>
                      <MousePointer2 size={14} />
                      <span>{gtp.totalInteractions} Interactions</span>
                    </div>
                  </div>

                  {gtp.instances.length > 1 ? (
                    <button 
                      className={styles.groupCardManageBtn}
                      onClick={() => setDrilldownGroup(gtp)}
                    >
                      Manage {gtp.instances.length} Instances
                    </button>
                  ) : (
                    <button 
                      className={styles.deptManageBtn}
                      onClick={() => {
                        setCurrentTouchpoint(gtp.instances[0]);
                        setShowQrPreview(true);
                      }}
                    >
                      View QR Code
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '850px', width: '96%' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>Step {wizardStep} of 2</span>
                <h3 className={styles.modalTitle}>
                  {wizardStep === 1 ? "Create Touchpoint" : "Review & Generate"}
                </h3>
                <p className={styles.modalSubtitle}>Set up a new QR/NFC engagement point</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.wizardProgress}>
              <div className={`${styles.progressStep} ${wizardStep >= 1 ? styles.active : ""}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 2 ? styles.active : ""}`} />
            </div>
            
            <div className={styles.modalBody}>
              {wizardStep === 1 && (
                <div className={styles.modalForm}>
                  <div style={{ 
                    background: "linear-gradient(135deg, rgba(21, 115, 71, 0.04), rgba(21, 115, 71, 0.08))", 
                    border: "1px solid rgba(21, 115, 71, 0.12)", 
                    borderRadius: "12px", 
                    padding: "14px 16px", 
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <MapPin size={16} style={{ color: "var(--brand-green)" }} />
                    <span style={{ color: "#166534", fontWeight: 600, fontSize: '13px' }}>Creating touchpoint for: {getSelectedLocationName()}</span>
                  </div>
                  
                  <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Touchpoint Title *</label>
                      <span className={styles.fieldDesc}>Internal name for tracking</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <FileText size={18} />
                      <input 
                        type="text" 
                        placeholder="e.g. Restroom 4 Feedback" 
                        required 
                        value={newTouchpoint.title}
                        onChange={(e) => setNewTouchpoint({...newTouchpoint, title: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Specific Location *</label>
                      <span className={styles.fieldDesc}>Area within the airport</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <MapPin size={18} />
                      <input 
                        type="text" 
                        placeholder="e.g. Gate A - Restroom" 
                        required 
                        value={newTouchpoint.description}
                        onChange={(e) => setNewTouchpoint({...newTouchpoint, description: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Department *</label>
                        <span className={styles.fieldDesc}>Responsible team(s)</span>
                      </div>
                      <div>
                        <MultiSelect
                          options={departments.filter(d => 
                            selectedLocIds.length === 0 || 
                            selectedLocIds.includes(d.locationId) || 
                            (d.location?.id && selectedLocIds.includes(d.location.id))
                          )}
                          selectedIds={newTouchpoint.departmentIds}
                          onChange={(ids) => setNewTouchpoint({...newTouchpoint, departmentIds: ids})}
                          placeholder="Select Departments"
                          icon={<Briefcase size={18} />}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Link Forms *</label>
                        <span className={styles.fieldDesc}>Select one or more forms</span>
                      </div>
                      <MultiSelect
                        options={forms.map(f => ({ id: f.id, name: `${f.title} (${f.type})` }))}
                        selectedIds={newTouchpoint.templateIds}
                        onChange={(ids) => {
                          setNewTouchpoint({
                            ...newTouchpoint, 
                            templateIds: ids,
                            type: forms.find(f => f.id === ids[0])?.type || TouchpointType.FEEDBACK
                          });
                        }}
                        placeholder="Select Forms"
                        icon={<Layers size={18} />}
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className={styles.reviewContainer}>
                  {/* Configuration Card */}
                  <div className={styles.reviewCard}>
                    <div className={styles.reviewCardHeader}>
                      <ClipboardList size={18} style={{ color: "var(--brand-green)" }} />
                      <h4>Configuration Details</h4>
                    </div>
                    <div className={styles.reviewCardBody}>
                      <div className={styles.reviewInfoGrid}>
                        <div className={styles.reviewInfoItem}>
                          <span className={styles.reviewInfoLabel}>Touchpoint Name</span>
                          <div className={styles.reviewInfoValue}>
                            <FileText size={16} style={{ color: "#64748b" }} />
                            {newTouchpoint.title}
                          </div>
                        </div>
                        <div className={styles.reviewInfoItem}>
                          <span className={styles.reviewInfoLabel}>Locations</span>
                          <div className={styles.reviewInfoValue}>
                            <MapPin size={16} style={{ color: "#64748b" }} />
                            {selectedLocIds.length} Site(s) Selected
                          </div>
                        </div>
                        <div className={styles.reviewInfoItem}>
                          <span className={styles.reviewInfoLabel}>Responsible Units</span>
                          <div className={styles.reviewInfoValue}>
                            <Building2 size={16} style={{ color: "#64748b" }} />
                            {newTouchpoint.departmentIds.length} Department(s)
                          </div>
                        </div>
                        <div className={styles.reviewInfoItem}>
                          <span className={styles.reviewInfoLabel}>Linked Forms</span>
                          <div className={styles.reviewInfoValue}>
                            <Layers size={16} style={{ color: "#64748b" }} />
                            {newTouchpoint.templateIds.length} Form(s) Assigned
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Assets Card */}
                  <div className={styles.reviewCard}>
                    <div className={styles.reviewCardHeader}>
                      <QrCode size={18} style={{ color: "var(--brand-green)" }} />
                      <h4>Deployment & Assets</h4>
                    </div>
                    <div className={styles.reviewCardBody}>
                      <div className={styles.reviewVisualSection}>
                        <div className={styles.reviewLinkGroup}>
                          <div 
                            className={styles.reviewLinkCard}
                            onClick={() => {
                              const link = `${origin}/p/${newTouchpoint.title.toLowerCase().replace(/\s+/g, '-')}`;
                              navigator.clipboard.writeText(link);
                              toast.success("Access link copied!");
                            }}
                          >
                            <div className={styles.reviewLinkIcon}>
                              <ExternalLink size={18} />
                            </div>
                            <div className={styles.reviewLinkContent}>
                              <span className={styles.reviewLinkLabel}>Access Link (Live)</span>
                              <span className={styles.reviewLinkText}>{origin}/p/{newTouchpoint.title.toLowerCase().replace(/\s+/g, '-')}</span>
                            </div>
                            <Copy size={16} style={{ color: "#94a3b8" }} />
                          </div>

                          <div 
                            className={styles.reviewLinkCard}
                            onClick={() => {
                              navigator.clipboard.writeText(dynamicLink);
                              toast.success("NFC Link copied!");
                            }}
                          >
                            <div className={styles.reviewLinkIcon}>
                              <Wifi size={18} />
                            </div>
                            <div className={styles.reviewLinkContent}>
                              <span className={styles.reviewLinkLabel}>NFC Payload Link</span>
                              <span className={styles.reviewLinkText}>{dynamicLink}</span>
                            </div>
                            <Copy size={16} style={{ color: "#94a3b8" }} />
                          </div>
                        </div>

                        <div className={styles.reviewQrPreview} onClick={() => setShowQrPreview(true)}>
                          <QRCodeSVG value={dynamicLink} size={150} />
                          <div style={{ position: 'absolute', bottom: '8px', fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>PREVIEW ONLY</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              {wizardStep > 1 && (
                <button type="button" className={styles.cancelBtn} onClick={() => setWizardStep(wizardStep - 1)} style={{ marginRight: 'auto' }}>
                  Back
                </button>
              )}
              <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
              {wizardStep < 2 ? (
                  <button 
                  type="button" 
                  className={styles.createButton} 
                  onClick={() => setWizardStep(wizardStep + 1)}
                  disabled={!newTouchpoint.title || !newTouchpoint.description || newTouchpoint.departmentIds.length === 0}
                  style={{ opacity: (!newTouchpoint.title || !newTouchpoint.description || newTouchpoint.departmentIds.length === 0) ? 0.5 : 1 }}
                >
                  Continue
                </button>
              ) : (
                <button type="button" className={styles.createButton} onClick={handleCreate}>
                  <CheckCircle size={18} /> Finish & Publish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showLocationPicker && (
        <div className={styles.modalOverlay} onClick={() => setShowLocationPicker(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '96%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>Location Selection</span>
                <h3 className={styles.modalTitle}>Select Target Airport</h3>
                <p className={styles.modalSubtitle}>Choose where this touchpoint will be deployed</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowLocationPicker(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody} style={{ flex: 1 }}>
              <p style={{ marginBottom: "24px", color: "#64748b", fontSize: "14px", lineHeight: '1.6' }}>
                Select the airport location(s) where you want to create these engagement points. You can select multiple airports to deploy the same configuration across sites.
              </p>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "10px", fontWeight: 600, color: "#334155", fontSize: '13px' }}>
                  Available Airport Locations
                </label>
                <MultiSelect
                  options={locations}
                  selectedIds={tempLocIds}
                  onChange={(ids) => setTempLocIds(ids)}
                  placeholder="Search and select airports..."
                  icon={<Building2 size={18} />}
                />
              </div>
            </div>
            <div className={styles.modalActions} style={{ paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
              <button className={styles.cancelBtn} onClick={() => setShowLocationPicker(false)}>Cancel</button>
              <button
                onClick={() => {
                  setSelectedLocIds(tempLocIds);
                  setShowLocationPicker(false);
                  setIsModalOpen(true);
                  setWizardStep(1);
                }}
                disabled={tempLocIds.length === 0}
                className={styles.createButton}
                style={{ opacity: tempLocIds.length > 0 ? 1 : 0.5, padding: '10px 24px' }}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrPreview && currentTouchpoint && (
        <div className={styles.modalOverlay} onClick={() => { setShowQrPreview(false); setDownloadDropdownOpen(false); }}>
          <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.previewTitle}>QR Code Preview</h3>
                <p className={styles.modalSubtitle}>{currentTouchpoint.title}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => { setShowQrPreview(false); setDownloadDropdownOpen(false); }}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.fullQrWrapper}>
              <div className={styles.qrBackground} ref={qrRef}>
                <QRCodeSVG 
                  id={`qr-svg-${currentTouchpoint.uuid}`}
                  value={`${origin}/p/${currentTouchpoint.slug || currentTouchpoint.uuid || 'sample'}`} 
                  size={200} 
                  includeMargin={true}
                  level="H" 
                  className={styles.fullQr}
                  imageSettings={{
                    src: "/Faan.logo_.png",
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
                {/* Hidden canvas for PNG/JPG exports */}
                <div style={{ display: 'none' }}>
                  <QRCodeCanvas
                    id={`qr-canvas-${currentTouchpoint.uuid}`}
                    value={`${origin}/p/${currentTouchpoint.uuid || 'sample'}`}
                    size={1024} // High res for export
                    includeMargin={true}
                    level="H"
                    imageSettings={{
                      src: "/Faan.logo_.png",
                      height: 200,
                      width: 200,
                      excavate: true,
                    }}
                  />
                </div>
              </div>
              <div className={styles.qrInfo}>
                <div 
                  className={styles.qrLinkContainer}
                  onClick={() => {
                    const link = `${origin}/p/${currentTouchpoint.slug || currentTouchpoint.uuid || 'sample'}`;
                    navigator.clipboard.writeText(link);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                >
                  <p className={styles.qrLinkText}>{origin}/p/{currentTouchpoint.slug || currentTouchpoint.uuid || 'sample'}</p>
                  <button className={styles.copyBtn} aria-label="Copy link">
                    {copySuccess ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </div>
                <span className={styles.qrScanHint}>Scan to test this touchpoint</span>
              </div>
            </div>
            <div className={styles.previewActionsCentered}>
              <div className={styles.downloadDropdownWrapper}>
                <button 
                  className={styles.downloadBtn} 
                  onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                >
                  <Download size={18} />
                  Download
                  <ChevronDown size={16} className={`${styles.chevronDn} ${downloadDropdownOpen ? styles.rotated : ''}`} />
                </button>
                
                {downloadDropdownOpen && (
                  <div className={styles.downloadMenu}>
                    {(['png', 'svg', 'jpg'] as const).map((format) => (
                      <button 
                        key={format}
                        className={styles.downloadMenuItem}
                        onClick={() => {
                          handleDownload(format);
                          setDownloadDropdownOpen(false);
                        }}
                      >
                        <span className={styles.formatTag}>{format.toUpperCase()}</span>
                        <span>Format</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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