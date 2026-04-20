"use client";

import { useState, type CSSProperties } from "react";
import { 
  Plus, 
  Search, 
  Users, 
  MousePointer2, 
  Shield, 
  MoreVertical,
  X,
  User,
  ExternalLink,
  Settings,
  Briefcase,
  AlertCircle,
  Box,
  Edit,
  Trash2,
  MapPin,
  Building2,
  Layers3,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff
} from "lucide-react";
import { Department } from "@/types/api";

interface DeptAdmin {
  id: string | number;
  departmentId: string;
  name: string;
  email: string;
}

interface StaffMember {
  id: string | number;
  name: string;
  role: string;
}

interface QRLink {
  id: string | number;
  name: string;
  airport: string;
}
import styles from "../../Dashboard.module.css";
import Image from "next/image";
import { useRole } from "@/context/RoleContext";

import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useArchiveDepartment,
  useAssignDepartmentAdmin
} from "@/hooks/useDepartments";
import { useLocations } from "@/hooks/useLocations";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { MultiSelect } from "@/components/displays/MultiSelect";
import DeleteConfirmationModal from "@/components/displays/DeleteConfirmationModal";

const DEPT_ACCENTS = [
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

export default function DepartmentsPage() {
  const { currentRole, currentLocation, locationName: roleLocationName } = useRole();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [drilldownGroup, setDrilldownGroup] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemName: '',
    itemType: 'department' as const,
    isGroup: false,
    instanceCount: 0,
    affectedItems: [] as string[],
    onConfirm: () => {},
  });

  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    locationIds: [] as string[],
    responsibility: '',
    locationName: '',
  });

  // Resources Management State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [deptAdmins, setDeptAdmins] = useState<DeptAdmin[]>([]);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });

  const [isAssigning, setIsAssigning] = useState(false);
  const [tempStaff, setTempStaff] = useState<StaffMember[]>([]);
  const [newStaffDetails, setNewStaffDetails] = useState({ name: "", role: "Duty Officer" });

  const [isLinking, setIsLinking] = useState(false);
  const [tempQR, setTempQR] = useState<QRLink[]>([]);
  const [newQRDetails, setNewQRDetails] = useState({ name: "", airport: "Abuja International" });


  // Queries
  const { data: deptsData, isLoading: deptsLoading } = useDepartments({
    locationId: (currentRole === 'LOCATION_ADMIN' ? currentLocation : undefined) || undefined
  });
  const { data: locationsData } = useLocations();

  // Mutations
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const archiveMutation = useArchiveDepartment();
  const assignAdminMutation = useAssignDepartmentAdmin();

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newDept.name.trim()) return toast.error("Department name is required");
    
    const code = newDept.code.trim();
    if (!code) return toast.error("Department code is required");
    if (code.length > 50) return toast.error("Code must be 50 characters or less");
    const codeRegex = /^[A-Z0-9_]+$/;
    if (!codeRegex.test(code)) {
      return toast.error("Code must be uppercase alphanumeric with underscores (e.g., TECH_OPS)");
    }

    const payload = {
      name: newDept.name,
      code: code,
      locationId: currentRole === 'LOCATION_ADMIN' ? (currentLocation || "") : (newDept.locationIds[0] || ""),
      responsibility: newDept.responsibility,
    };

    if (editingDept) {
      updateMutation.mutate({ uuid: editingDept.id as string, data: payload }, {
        onSuccess: () => {
          toast.success("Department updated successfully");
          setIsAddModalOpen(false);
          setEditingDept(null);
          setNewDept({ name: '', code: '', locationIds: [], responsibility: '', locationName: '' });
        },
        onError: (error: any) => {
          const axiosError = error as AxiosError<{ message: string | string[] }>;
          const message = axiosError.response?.data?.message || "Failed to update department";
          if (Array.isArray(message)) {
            message.forEach(msg => toast.error(msg));
          } else {
            toast.error(message);
          }
        }
      });
    } else {
      const locationIdsToCreate = currentRole === 'LOCATION_ADMIN' ? [(currentLocation || "")] : newDept.locationIds;
      
      if (locationIdsToCreate.length === 0) return toast.error("Please select at least one location");

      // Promise all for multiple locations
      Promise.all(locationIdsToCreate.map(locId => 
        createMutation.mutateAsync({
          ...payload,
          locationId: locId,
        })
      )).then(() => {
        toast.success(`Department(s) created successfully for ${locationIdsToCreate.length} location(s)`);
        setIsAddModalOpen(false);
        setNewDept({ name: '', code: '', locationIds: [], responsibility: '', locationName: '' });
      }).catch((error: any) => {
        const axiosError = error as AxiosError<{ message: string | string[] }>;
        const message = axiosError.response?.data?.message || "Failed to create department";
        toast.error(Array.isArray(message) ? message[0] : message);
      });
    }
  };

  const handleArchiveDept = (uuid: string) => {
    archiveMutation.mutate(uuid);
    setActiveDropdown(null);
  };

  const confirmArchive = (uuid: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      itemName: name,
      itemType: 'department',
      isGroup: false,
      instanceCount: 1,
      onConfirm: () => {
        archiveMutation.mutate(uuid, {
          onSuccess: () => {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
            toast.success(`${name} archived successfully`);
          }
        });
      }
    });
  };

  const confirmArchiveGroup = (groupedDept: any) => {
    const locationsList = groupedDept.instances.map((inst: any) => {
      const locName = typeof inst.location === 'object' ? inst.location?.name : (inst.location || roleLocationName || 'Unnamed Airport');
      return locName;
    });

    setDeleteModal({
      isOpen: true,
      itemName: groupedDept.name,
      itemType: 'department',
      isGroup: true,
      instanceCount: groupedDept.instances.length,
      affectedItems: locationsList,
      onConfirm: () => {
        const promises = groupedDept.instances.map((inst: any) => archiveMutation.mutateAsync(inst.id));
        toast.promise(Promise.all(promises), {
          loading: 'Archiving instances...',
          success: () => {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
            setActiveDropdown(null);
            return 'All instances archived successfully';
          },
          error: 'Failed to archive some instances'
        });
      }
    });
  };

  const departments = deptsData?.data || [];
  const locations = locationsData?.data || [];
  
  // Grouping Logic
  const groupedDepartments = departments.reduce((acc: Record<string, any>, dept) => {
    const key = dept.code;
    if (!acc[key]) {
      acc[key] = {
        ...dept,
        instances: [dept],
        totalStaff: (dept as any).staffCount || 0,
        totalQRs: (dept as any).touchpointCount || 0
      };
    } else {
      acc[key].instances.push(dept);
      acc[key].totalStaff += (dept as any).staffCount || 0;
      acc[key].totalQRs += (dept as any).touchpointCount || 0;
    }
    return acc;
  }, {});

  const filteredGroupedDepts = Object.values(groupedDepartments).filter((d: any) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStaff = departments.reduce((sum, d) => {
    if (typeof (d as any).staffCount === "number") return sum + (d as any).staffCount;
    if (Array.isArray((d as any).users)) return sum + (d as any).users.length;
    if (typeof (d as any).users === "number") return sum + (d as any).users;
    return sum;
  }, 0);

  const totalTouchpoints = departments.reduce((sum, d) => {
    if (typeof (d as any).touchpointCount === "number") return sum + (d as any).touchpointCount;
    if (typeof (d as any)._count?.touchpoints === "number") return sum + (d as any)._count.touchpoints;
    return sum;
  }, 0);

  const scopeLabel =
    currentRole === "LOCATION_ADMIN"
      ? roleLocationName || "Your Location"
      : "All Locations";

  const handleAddDeptAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password || !selectedDept) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Split name into first and last
    const nameParts = newAdmin.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Admin";

    assignAdminMutation.mutate({
      id: selectedDept.id,
      data: {
        firstName,
        lastName,
        email: newAdmin.email,
        password: newAdmin.password,
      }
    }, {
      onSuccess: () => {
        toast.success(`Admin assigned to ${selectedDept.name} successfully`);
        setIsAdminModalOpen(false);
        setNewAdmin({ name: "", email: "", password: "" });
      },
      onError: (error: any) => {
        const axiosError = error as AxiosError<{ message: string | string[] }>;
        const message = axiosError.response?.data?.message || "Failed to assign admin";

        if (Array.isArray(message)) {
          message.forEach(msg => toast.error(msg));
        } else {
          toast.error(message);
        }
      }
    });
  };


  const handleAddStaff = () => {
    if (!newStaffDetails.name) return;
    const newStaff = { id: Date.now(), name: newStaffDetails.name, role: newStaffDetails.role };
    setTempStaff([...tempStaff, newStaff]);
    setIsAssigning(false);
    setNewStaffDetails({ name: "", role: "Duty Officer" });
  };

  const handleLinkQR = () => {
    if (!newQRDetails.name) return;
    const newQR = { id: Date.now(), name: newQRDetails.name, airport: newQRDetails.airport };
    setTempQR([...tempQR, newQR]);
    setIsLinking(false);
    setNewQRDetails({ name: "", airport: "Abuja International" });
  };

  const handleSaveResources = () => {
    if (!selectedDept) return;
    const updated = departments.map(d => {
      if (d.id === selectedDept.id) {
        const currentUsers = Array.isArray(d.users) ? d.users.length : (typeof d.users === 'number' ? d.users : 0);
        const currentTPs = typeof d.touchpointCount === 'number' ? d.touchpointCount : (d._count?.touchpoints || 0);

        return {
          ...d,
          users: currentUsers + tempStaff.length,
          touchpointCount: currentTPs + tempQR.length
        };
      }
      return d;
    });
    // setDepartments(updated); // Removed as departments state is derived from React Query
    setSelectedDept(null);
    setTempStaff([]);
    setTempQR([]);
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
              <h2 className={styles.deptHeroTitle}>Departments</h2>
              <p className={styles.deptHeroSubtitle}>
                Structure airport operations into clear units, assign responsibility, and manage resources.
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
            onClick={() => {
              if (currentRole === "LOCATION_ADMIN" && currentLocation) {
                const location = locations.find((l) => l.id === currentLocation);
                setNewDept({ ...newDept, locationIds: [currentLocation], locationName: location?.name || "" });
              }
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Create Department</span>
          </button>
          <p className={styles.deptHeroHint}>Use clear names like “Customer Service”, “Security”, or “Operations”.</p>
        </div>
      </div>

      <div className={styles.deptStatsGrid} aria-label="Departments summary">
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} aria-hidden="true">
            <Layers3 size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Departments</div>
            <div className={styles.deptStatValue}>{departments.length}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} aria-hidden="true">
            <Users size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Staff</div>
            <div className={styles.deptStatValue}>{totalStaff}</div>
          </div>
        </div>
        <div className={styles.deptStatCard}>
          <div className={styles.deptStatIcon} aria-hidden="true">
            <MousePointer2 size={18} />
          </div>
          <div className={styles.deptStatBody}>
            <div className={styles.deptStatLabel}>Touchpoints</div>
            <div className={styles.deptStatValue}>{totalTouchpoints}</div>
          </div>
        </div>
      </div>

      <div className={styles.deptControlsCard}>
        <div className={styles.deptControlsRow}>
          <div className={`${styles.searchBar} ${styles.deptSearchBar}`}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search departments…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.deptControlsMeta} aria-live="polite">
            {deptsLoading ? (
              <span>Loading…</span>
            ) : (
              <span>
                Showing <strong>{filteredGroupedDepts.length}</strong> groups of <strong>{departments.length}</strong> departments
              </span>
            )}
          </div>
        </div>
      </div>

      {deptsLoading ? (
        <div className={styles.deptGrid} aria-label="Loading departments">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`dept-skeleton-${i}`} className={`${styles.deptCard} ${styles.deptSkeletonCard}`}>
              <div className={styles.deptCardHeader}>
                <div className={styles.deptSkeletonIcon} />
                <div className={styles.deptSkeletonMenu} />
              </div>
              <div className={styles.deptCardInfo}>
                <div className={styles.deptSkeletonLine} style={{ width: "64%" }} />
                <div className={styles.deptSkeletonLine} style={{ width: "92%" }} />
                <div className={styles.deptSkeletonLine} style={{ width: "78%" }} />
              </div>
              <div className={styles.deptCardMetrics}>
                <div className={styles.deptSkeletonPill} />
                <div className={styles.deptSkeletonPill} />
              </div>
              <div className={styles.deptSkeletonBtn} />
            </div>
          ))}
        </div>
      ) : filteredGroupedDepts.length === 0 ? (
        <div className={styles.deptEmptyState} role="status">
          <div className={styles.deptEmptyIcon} aria-hidden="true">
            <Shield size={22} />
          </div>
          <h3 className={styles.deptEmptyTitle}>
            {searchTerm ? "No departments match your search" : "No departments created yet"}
          </h3>
          <p className={styles.deptEmptyText}>
            {searchTerm
              ? "Try a different keyword or clear the search."
              : "Create departments to define responsibilities and assign personnel and touchpoints."}
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
                  if (currentRole === "LOCATION_ADMIN" && currentLocation) {
                    const location = locations.find((l) => l.id === currentLocation);
                    setNewDept({ ...newDept, locationIds: [currentLocation], locationName: location?.name || "" });
                  }
                  setIsAddModalOpen(true);
                }}
              >
                <Plus size={18} />
                <span>Create Department</span>
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
              <span className={styles.drilldownName}>{drilldownGroup.name} ({drilldownGroup.instances.length} Instances)</span>
            </div>
          </div>

          <div className={styles.deptGrid}>
            {drilldownGroup.instances.map((inst: any) => {
              const accent = DEPT_ACCENTS[hashToIndex(String(inst.id ?? inst.name), DEPT_ACCENTS.length)];
              const accentStyle = {
                "--accent-bg": accent.bg,
                "--accent-fg": accent.fg,
                "--accent-ring": accent.ring,
              } as CSSProperties;

              return (
                <div key={inst.id} className={styles.deptCard}>
                  <div className={styles.deptCardHeader}>
                    <div className={styles.deptIconBox} style={accentStyle} aria-hidden="true">
                      <Shield size={24} />
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
                            className={styles.dropdownItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDept(inst);
                              setNewDept({
                                name: inst.name,
                                code: inst.code,
                                locationIds: [inst.locationId],
                                responsibility: inst.responsibility || "",
                                locationName: inst.location?.name || "",
                              });
                              setIsAddModalOpen(true);
                              setActiveDropdown(null);
                            }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            className={`${styles.dropdownItem} ${styles.danger}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmArchive(inst.id as string, inst.name);
                            }}
                          >
                            <Trash2 size={14} /> Archive
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.deptCardInfo}>
                    <h3 className={styles.deptCardTitle}>{inst.name}</h3>
                    <p className={styles.deptCardDesc}>{inst.responsibility || "No responsibility defined."}</p>
                    <div className={styles.deptLocationRow}>
                      <MapPin size={12} />
                      <span>{inst.location?.name || roleLocationName || "—"}</span>
                    </div>
                  </div>

                  <div className={styles.deptCardMetrics}>
                    <div className={styles.deptMetric}>
                      <Users size={14} />
                      <span>{inst.personnel?.length || 0} Staff</span>
                    </div>
                    <div className={styles.deptMetric}>
                      <MousePointer2 size={14} />
                      <span>{inst.touchpoints?.length || 0} QRs</span>
                    </div>
                  </div>

                  <button 
                    className={styles.deptManageBtn}
                    onClick={() => setSelectedDept(inst)}
                  >
                    Manage Resources
                    <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.deptGrid}>
          {filteredGroupedDepts.map((groupedDept: any) => {
            const Icon = Shield;
            const accent = DEPT_ACCENTS[hashToIndex(String(groupedDept.id ?? groupedDept.name), DEPT_ACCENTS.length)];
            const accentStyle = {
              "--accent-bg": accent.bg,
              "--accent-fg": accent.fg,
              "--accent-ring": accent.ring,
            } as CSSProperties;

            const primaryInstance = groupedDept.instances[0];
            const primaryLocationName = 
              typeof primaryInstance.location === 'string' 
                ? primaryInstance.location 
                : primaryInstance.location?.name || roleLocationName || "—";
            
            const locationLabel = groupedDept.instances.length > 1 
              ? `${primaryLocationName} +${groupedDept.instances.length - 1}`
              : primaryLocationName;

            return (
              <div key={groupedDept.code} className={styles.deptCard}>
                <div className={styles.deptCardHeader}>
                  <div className={styles.deptIconBox} style={accentStyle} aria-hidden="true">
                    <Icon size={24} />
                  </div>
                  <div className={styles.cardMenuWrapper}>
                    <button
                      className={styles.cardMore}
                      aria-label={`Department actions for ${groupedDept.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === groupedDept.code ? null : groupedDept.code);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeDropdown === groupedDept.code && (
                      <div className={styles.cardDropdown}>
                        <button
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDept(primaryInstance);
                            setNewDept({
                              name: groupedDept.name,
                              code: groupedDept.code,
                              locationIds: groupedDept.instances.map((i: any) => i.locationId),
                              responsibility: groupedDept.responsibility || "",
                              locationName: "",
                            });
                            setIsAddModalOpen(true);
                            setActiveDropdown(null);
                          }}
                        >
                          <Edit size={14} /> {groupedDept.instances.length > 1 ? "Edit Group" : "Edit"}
                        </button>
                        <button
                          className={`${styles.dropdownItem} ${styles.danger}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmArchiveGroup(groupedDept);
                          }}
                        >
                          <Trash2 size={14} /> {groupedDept.instances.length > 1 ? "Archive Group" : "Archive"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.deptCardInfo}>
                  <h3 className={styles.deptCardTitle}>{groupedDept.name}</h3>
                  <p className={styles.deptCardDesc}>{groupedDept.responsibility || "No responsibility defined."}</p>
                  <div className={styles.deptLocationRow}>
                    <MapPin size={12} />
                    <span>{locationLabel}</span>
                  </div>
                </div>

                <div className={styles.deptCardMetrics}>
                  <div className={styles.deptMetric}>
                    <Users size={14} />
                    <span>{groupedDept.totalStaff} Staff</span>
                  </div>
                  <div className={styles.deptMetric}>
                    <MousePointer2 size={14} />
                    <span>{groupedDept.totalQRs} QRs</span>
                  </div>
                </div>

                {groupedDept.instances.length > 1 ? (
                  <button 
                    className={styles.groupCardManageBtn}
                    onClick={() => setDrilldownGroup(groupedDept)}
                  >
                    Manage {groupedDept.instances.length} Instances
                  </button>
                ) : (
                  <button 
                    className={styles.deptManageBtn}
                    onClick={() => setSelectedDept(primaryInstance)}
                  >
                    Manage Resources
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT DEPARTMENT MODAL */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.modalTitle}>{editingDept ? 'Edit' : 'Register New'} Department</h3>
                <p className={styles.modalSubtitle}>{editingDept ? 'Update department details.' : 'Create a new administrative unit for airport operations.'}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => {
                setIsAddModalOpen(false);
                setEditingDept(null);
                setNewDept({ name: '', code: '', locationIds: [], locationName: '', responsibility: '' });
              }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddDept}>
              <div className={styles.modalBody}>
                <div className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Department Name *</label>
                      <span className={styles.fieldDesc}>Name of the department (e.g. Customer Service).</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <Shield size={18} />
                      <input
                        type="text"
                        placeholder="e.g. Customer Service"
                        value={newDept.name}
                        onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Department Code *</label>
                      <span className={styles.fieldDesc}>Unique identifier (e.g. CUST_SERV). Uppercase alphanumeric with underscores.</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <Box size={18} />
                      <input
                        type="text"
                        placeholder="e.g. CUST_SERV"
                        value={newDept.code}
                        onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>
                        {currentRole === 'LOCATION_ADMIN' ? 'Location (Auto-assigned)' : 'Assign to this Location *'}
                      </label>
                      <span className={styles.fieldDesc}>
                        {currentRole === 'LOCATION_ADMIN' ? 'This department will be created for your airport.' : 'Which airport does this department belong to?'}
                      </span>
                    </div>
                    <div className={currentRole === 'LOCATION_ADMIN' ? styles.modalInputWrapper : ''}>
                      {currentRole === 'LOCATION_ADMIN' ? (
                        <>
                          <Plus size={18} />
                          <input
                            type="text"
                            value={roleLocationName || currentLocation || ''}
                            disabled
                            style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                          />
                        </>
                      ) : (
                        <MultiSelect
                          options={locations}
                          selectedIds={newDept.locationIds}
                          onChange={(ids) => setNewDept({ ...newDept, locationIds: ids })}
                          placeholder="Select Locations"
                          icon={<MapPin size={18} />}
                        />
                      )}
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Operations Charter</label>
                      <span className={styles.fieldDesc}>Summarize the core responsibility of this unit.</span>
                    </div>
                    <textarea
                      placeholder="e.g. Responsible for passenger inquiries..."
                      value={newDept.responsibility}
                      onChange={(e) => setNewDept({ ...newDept, responsibility: e.target.value })}
                      required
                      className={styles.modalTextarea}
                      style={{ height: "100px", marginTop: "8px" }}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingDept(null);
                  setNewDept({ name: '', code: '', locationIds: [], locationName: '', responsibility: '' });
                }}>Discard</button>
                <button 
                  type="submit" 
                  className={styles.createButton}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{ opacity: (createMutation.isPending || updateMutation.isPending) ? 0.7 : 1, cursor: (createMutation.isPending || updateMutation.isPending) ? 'not-allowed' : 'pointer' }}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Confirm & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE DEPARTMENT MODAL */}
      {selectedDept && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.wideModal}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.modalTitle}>{selectedDept.name} Resources</h3>
                <p className={styles.modalSubtitle}>Mapping staff and physical touchpoints to this unit.</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedDept(null)}><X size={20} /></button>
            </div>

            <div className={styles.tabsContainer}>
              <button
                className={`${styles.tabLink} ${activeTab === "admins" ? styles.tabLinkActive : ""}`}
                onClick={() => setActiveTab("admins")}
              >
                <Shield size={18} />
                Admins
              </button>
              <button
                className={`${styles.tabLink} ${activeTab === "users" ? styles.tabLinkActive : ""}`}
                onClick={() => setActiveTab("users")}
              >
                <Users size={18} />
                Personnel
              </button>
              <button
                className={`${styles.tabLink} ${activeTab === "touchpoints" ? styles.tabLinkActive : ""}`}
                onClick={() => setActiveTab("touchpoints")}
              >
                <MousePointer2 size={18} />
                Touchpoints
              </button>
            </div>

            {activeTab === "admins" && (
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <button className={styles.createButton} onClick={() => setIsAdminModalOpen(true)}>
                  <Plus size={16} /> Add Admin
                </button>
              </div>
            )}

            <div className={styles.modalBody} style={{ minHeight: "300px" }}>
              {activeTab === "admins" ? (
                <div className={styles.resourceList}>
                  <div className={styles.resourceHeader}>
                    <h4 className={styles.builderLabel}>Department Admins</h4>
                  </div>
                  <div className={styles.resourceItems}>
                    {deptAdmins.filter(a => a.departmentId === selectedDept?.id).length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <Shield size={32} />
                        <p style={{ marginTop: '8px' }}>No admins assigned yet</p>
                        <p style={{ fontSize: '12px' }}>Click &quot;Add Admin&quot; to assign a department administrator</p>
                      </div>
                    ) : (
                      deptAdmins.filter(a => a.departmentId === selectedDept?.id).map(admin => (
                        <div key={admin.id} className={`${styles.resourceItem} ${styles.newResource}`}>
                          <div className={styles.resourceIcon}><Shield size={16} /></div>
                          <div className={styles.resourceInfo}>
                            <strong>{admin.name}</strong>
                            <span>{admin.email}</span>
                          </div>
                          <button
                            className={styles.resourceRemove}
                            onClick={() => setDeptAdmins(deptAdmins.filter(a => a.id !== admin.id))}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : activeTab === "users" ? (
                <div className={styles.resourceList}>
                  <div className={styles.resourceHeader}>
                    <h4 className={styles.builderLabel}>Registered Staff ({(selectedDept.users?.length || 0) + tempStaff.length})</h4>
                    <button className={styles.inlineAddBtn} onClick={() => setIsAssigning(!isAssigning)}>
                      <Plus size={14} /> Assign Official
                    </button>
                  </div>

                  {isAssigning && (
                    <div className={styles.resourceConfigBox}>
                      <input type="text" placeholder="Official Name" value={newStaffDetails.name} onChange={e => setNewStaffDetails({ ...newStaffDetails, name: e.target.value })} className={styles.miniInput} />
                      <select value={newStaffDetails.role} onChange={e => setNewStaffDetails({ ...newStaffDetails, role: e.target.value })} className={styles.miniSelect}>
                        <option value="Duty Officer">Duty Officer</option>
                        <option value="Manager">Manager</option>
                        <option value="Supervisor">Supervisor</option>
                      </select>
                      <button className={styles.createButton} onClick={handleAddStaff} style={{ padding: "8px 12px", height: "auto" }}>Add</button>
                    </div>
                  )}
                  <div className={styles.resourceItems}>
                    {[1, 2, 3].map(i => (
                      <div key={`existing-staff-${i}`} className={styles.resourceItem}>
                        <div className={styles.resourceIcon}><User size={16} /></div>
                        <div className={styles.resourceInfo}>
                          <strong>Official FAAN-00{i}</strong>
                          <span>Duty Officer | Shift A</span>
                        </div>
                        <button className={styles.resourceRemove}><X size={14} /></button>
                      </div>
                    ))}
                    {tempStaff.map(staff => (
                      <div key={staff.id} className={`${styles.resourceItem} ${styles.newResource}`}>
                        <div className={styles.resourceIcon}><User size={16} /></div>
                        <div className={styles.resourceInfo}>
                          <strong>{staff.name}</strong>
                          <span>{staff.role} | Just Added</span>
                        </div>
                        <button
                          className={styles.resourceRemove}
                          onClick={() => setTempStaff(tempStaff.filter(s => s.id !== staff.id))}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.resourceList}>
                  <div className={styles.resourceHeader}>
                    <h4 className={styles.builderLabel}>Operational Touchpoints ({(selectedDept._count?.touchpoints || 0) + tempQR.length})</h4>
                    <button className={styles.inlineAddBtn} onClick={() => setIsLinking(!isLinking)}>
                      <Plus size={14} /> Link QR Code
                    </button>
                  </div>

                  {isLinking && (
                    <div className={styles.resourceConfigBox}>
                      <input type="text" placeholder="Touchpoint Location" value={newQRDetails.name} onChange={e => setNewQRDetails({ ...newQRDetails, name: e.target.value })} className={styles.miniInput} />
                      <select value={newQRDetails.airport} onChange={e => setNewQRDetails({ ...newQRDetails, airport: e.target.value })} className={styles.miniSelect}>
                        <option value="Abuja International">Abuja International</option>
                        <option value="Lagos Murtala Muhammed">Lagos Murtala Muhammed</option>
                        <option value="Kano Mallam Aminu">Kano Mallam Aminu</option>
                      </select>
                      <button className={styles.createButton} onClick={handleLinkQR} style={{ padding: "8px 12px", height: "auto" }}>Link</button>
                    </div>
                  )}
                  <div className={styles.resourceItems}>
                    {[1, 2].map(i => (
                      <div key={`existing-qr-${i}`} className={styles.resourceItem}>
                        <div className={styles.resourceIcon}><Box size={16} /></div>
                        <div className={styles.resourceInfo}>
                          <strong>Terminal 2 - Gate {i} Feedback</strong>
                          <span>Abuja International Airport</span>
                        </div>
                        <button className={styles.resourceRemove}><X size={14} /></button>
                      </div>
                    ))}
                    {tempQR.map(qr => (
                      <div key={qr.id} className={`${styles.resourceItem} ${styles.newResource}`}>
                        <div className={styles.resourceIcon}><Image src="/Faan.logo_.png" alt="FAAN" width={20} height={20} /></div>
                        <div className={styles.resourceInfo}>
                          <strong>{qr.name}</strong>
                          <span>{qr.airport} | Just Linked</span>
                        </div>
                        <button
                          className={styles.resourceRemove}
                          onClick={() => setTempQR(tempQR.filter(q => q.id !== qr.id))}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => {
                setSelectedDept(null);
                setTempStaff([]);
                setTempQR([]);
              }}>Close</button>
              <button className={styles.createButton} onClick={handleSaveResources}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ADMIN MODAL */}
      {isAdminModalOpen && selectedDept && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.modalTitle}>Add Admin to {selectedDept.name}</h3>
                <p className={styles.modalSubtitle}>Create a department administrator account</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsAdminModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddDeptAdmin(); }}>
              <div className={styles.modalBody}>
                <div className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Name *</label>
                    <div className={styles.modalInputWrapper}>
                      <User size={18} />
                      <input
                        type="text"
                        placeholder="Admin Name"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email *</label>
                    <div className={styles.modalInputWrapper}>
                      <Search size={18} />
                      <input
                        type="email"
                        placeholder="admin@faan.gov.ng"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Password *</label>
                    <div className={styles.modalInputWrapper}>
                      <Settings size={18} />
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={newAdmin.password}
                          onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                          required
                        />
                        <button 
                          type="button"
                          className={styles.eyeBtn}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Role</label>
                    <div className={styles.modalInputWrapper}>
                      <Shield size={18} />
                      <select disabled>
                        <option>Department Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsAdminModalOpen(false)}
                  disabled={assignAdminMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.createButton}
                  disabled={assignAdminMutation.isPending}
                  style={{ opacity: assignAdminMutation.isPending ? 0.7 : 1, cursor: assignAdminMutation.isPending ? 'not-allowed' : 'pointer' }}
                >
                  {assignAdminMutation.isPending ? 'Saving...' : 'Save Admin'}
                </button>
              </div>
            </form>
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
        isPending={archiveMutation.isPending}
      />
    </div>
  );
}
