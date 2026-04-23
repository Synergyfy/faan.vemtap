"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plane,
  Building2,
  MapPin,
  Users,
  Star,
  AlertCircle,
  MessageSquare,
  Search,
  Plus,
  X,
  Trash2,
  Edit,
  Globe,
  CheckCircle,
  Building,
  Eye,
  EyeOff,
  Shield,
  QrCode,
  ChevronLeft
} from "lucide-react";
import Image from "next/image";
import styles from "../../Dashboard.module.css";
import RoleGuard from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/rbac";
import { useRole } from "@/context/RoleContext";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useLocations, useCreateLocation, useDeleteLocation } from "@/hooks/useLocations";
import { useDepartments } from "@/hooks/useDepartments";
import { useCreateUser } from "@/hooks/useUsers";
import { Location, Department, Role } from "@/types/api";
import DeleteConfirmationModal from "@/components/displays/DeleteConfirmationModal";

export default function LocationsPage() {
  const { currentRole, currentLocation, locationName: roleLocationName } = useRole();
  const [selectedZone, setSelectedZone] = useState<Department | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const { data: locationsData, isLoading } = useLocations();
  const { data: departmentsData, isLoading: isDeptsLoading } = useDepartments(
    selectedLocation ? { locationId: selectedLocation.id } : undefined
  );

  // Sync selectedLocation with global currentLocation from header switcher
  useEffect(() => {
    if (locationsData?.data) {
      if (currentLocation) {
        const found = locationsData.data.find((loc: Location) => loc.id === currentLocation);
        if (found) {
          setSelectedLocation(found);
          setSelectedZone(null); // Reset zone when location changes
        }
      } else {
        setSelectedLocation(null);
        setSelectedZone(null);
      }
    }
  }, [currentLocation, locationsData]);


  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title?: string;
    itemName: string;
    itemType: 'location';
    isGroup: boolean;
    instanceCount: number;
    affectedItems?: string[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    itemName: '',
    itemType: 'location',
    isGroup: false,
    instanceCount: 0,
    affectedItems: [],
    onConfirm: () => {},
  });

  const createMutation = useCreateLocation();
  const deleteMutation = useDeleteLocation();
  const createUserMutation = useCreateUser();

  const locations = locationsData?.data || [];

  const handleDeleteLocation = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      title: "Delete Location",
      itemName: name,
      itemType: 'location',
      isGroup: false,
      instanceCount: 1,
      affectedItems: [],
      onConfirm: () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            toast.success(`${name} deleted successfully`);
            setSelectedLocation(null);
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
          },
          onError: (error: any) => {
            const axiosError = error as AxiosError<{ message: string | string[] }>;
            const message = axiosError.response?.data?.message || "Failed to delete location";
            toast.error(Array.isArray(message) ? message[0] : message);
          }
        });
      }
    });
  };

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.LOCATION_ADMIN,
  });

  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'International',
    address: '',
    city: '',
    state: '',
    airportCode: '',
    code: '',
  });

  const handleDeleteAdmin = (admin: any) => {
    setDeleteModal({
      isOpen: true,
      title: "Remove Administrator",
      itemName: admin.name,
      itemType: 'user' as any,
      isGroup: false,
      instanceCount: 1,
      affectedItems: [],
      onConfirm: () => {
        // Implement remove admin mutation if available
        toast.info("Delete functionality for admins to be implemented via User Management");
        setDeleteModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditAdmin = (admin: any) => {
    setEditingAdmin(admin);
    setNewAdmin({
      name: admin.name,
      email: admin.email,
      password: '', // Keep blank for security during edit
      role: UserRole.LOCATION_ADMIN,
    });
    setIsAdminModalOpen(true);
  };



  const handleAddAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || !selectedLocation) {
      toast.error("Please fill in all required fields and select a location");
      return;
    }

    if (editingAdmin) {
      toast.info("Update functionality for admins to be implemented via User Management module.");
      setIsAdminModalOpen(false);
      setEditingAdmin(null);
      setNewAdmin({ name: '', email: '', password: '', role: UserRole.LOCATION_ADMIN });
      return;
    }

    const departmentId = selectedLocation.departments?.[0]?.id;

    const nameParts = newAdmin.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Admin";

    createUserMutation.mutate({
      firstName,
      lastName,
      email: newAdmin.email,
      password: newAdmin.password,
      role: Role.LOCATION_ADMIN,
      departmentId,
    }, {
      onSuccess: () => {
        toast.success(`Admin assigned to ${selectedLocation.name} successfully`);
        setIsAdminModalOpen(false);
        setNewAdmin({ name: '', email: '', password: '', role: UserRole.LOCATION_ADMIN });
      },
      onError: (error: unknown) => {
        const axiosError = error as AxiosError<{ message: string | string[] }>;
        const message = axiosError.response?.data?.message || "Failed to create admin";
        if (Array.isArray(message)) {
          message.forEach(msg => toast.error(msg));
        } else {
          toast.error(message);
        }
      }
    });
  };

  const handleCreateLocation = () => {
    if (!newLocation.name.trim()) return toast.error("Location name is required");
    if (!newLocation.airportCode.trim()) return toast.error("Airport code is required");
    if (newLocation.airportCode.length > 10) return toast.error("Airport code must be 10 characters or less");

    const locationCode = newLocation.code.trim() || newLocation.airportCode.trim();
    if (!locationCode) return toast.error("Location code is required");

    const codeRegex = /^[A-Z0-9_]+$/;
    if (!codeRegex.test(locationCode)) {
      return toast.error("Code must be uppercase alphanumeric with underscores (e.g., LOS_INTL)");
    }

    if (!newLocation.city.trim()) return toast.error("City is required");

    createMutation.mutate({
      name: newLocation.name,
      airportCode: newLocation.airportCode,
      city: newLocation.city,
      state: newLocation.city, // Using city as state for fallback if not provided
      address: newLocation.address || newLocation.city,
      code: locationCode,
    }, {
      onSuccess: () => {
        toast.success("Location created successfully");
        setIsCreateModalOpen(false);
        setNewLocation({ name: '', type: 'International', address: '', city: '', state: '', airportCode: '', code: '' });
      },
      onError: (error: any) => {
        const axiosError = error as AxiosError<{ message: string | string[] }>;
        const message = axiosError.response?.data?.message || "Failed to create location";

        if (Array.isArray(message)) {
          message.forEach(msg => toast.error(msg));
        } else {
          toast.error(message);
        }
      }
    });
  };


  const totalLocations = locations.length;
  const departments = departmentsData?.data || [];
  const totalDepartments = departmentsData?.meta?.total || departments.length;
  const totalTouchpoints = locations.reduce((sum, loc) => sum + (loc._count?.touchpoints || 0), 0);

  return (
    <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN]}>
      <div className={styles.locationsLayout}>
        {/* SIDEBAR / TREE VIEW */}
        <aside className={`${styles.treePanel} ${isSidebarCollapsed ? styles.collapsed : ""}`}>
          <div className={styles.panelHeader}>
            {!isSidebarCollapsed && <h3 className={styles.panelTitle}>Locations Network</h3>}
            <button 
              className={styles.collapseToggle} 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className={styles.panelSearch}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search locations..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          {!isSidebarCollapsed && (
            <div className={styles.treeView}>
              {locations.filter(loc => 
                loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                loc.airportCode.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((loc) => (
                <div key={loc.id} className={styles.treeItem}>
                  <div 
                    className={`${styles.treeHeader} ${selectedLocation?.id === loc.id ? styles.selected : ""}`}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setSelectedZone(null);
                    }}
                  >
                    <Plane size={16} className={styles.airportIcon} />
                    <span>{loc.name}</span>
                    <span className={styles.airportCodeTag}>{loc.airportCode}</span>
                  </div>
                  
                  {selectedLocation?.id === loc.id && loc.departments && loc.departments.length > 0 && (
                    <div className={styles.treeSubItems}>
                      {loc.departments.map((dept) => (
                        <div 
                          key={dept.id} 
                          className={`${styles.treeHeader} ${selectedZone?.id === dept.id ? styles.selected : ""}`}
                          onClick={() => setSelectedZone(dept as any)}
                          style={{ fontSize: '13px', paddingLeft: '12px' }}
                        >
                          <Building2 size={14} className={styles.terminalIcon} />
                          <span>{dept.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {locations.length === 0 && !isLoading && (
                <div className={styles.emptyList}>No locations found</div>
              )}
              {isLoading && (
                <div className={styles.emptyList}>Loading locations...</div>
              )}
            </div>
          )}
        </aside>

        {/* MAIN VIEW */}
        <main className={`${styles.locationMain} ${isSidebarCollapsed ? styles.expanded : ""}`} onClick={(e) => e.stopPropagation()}>
          {/* Hero Section */}
          <div className={styles.deptHero}>
            <div className={styles.deptHeroMain}>
              <div className={styles.deptHeroTitleRow}>
                <div className={styles.deptHeroMark} aria-hidden="true">
                  <Image src="/Faan.logo_.png" alt="" width={34} height={34} />
                </div>
                <div className={styles.deptHeroText}>
                  <h2 className={styles.deptHeroTitle}>Locations Management</h2>
                  <p className={styles.deptHeroSubtitle}>
                    Manage airport locations, terminals, zones, and operational health across the entire FAAN network.
                  </p>
                </div>
              </div>
              <div className={styles.deptHeroPills}>
                <span className={styles.deptPill}>
                  <Globe size={14} />
                  <span>System-Wide View</span>
                </span>
                <span className={styles.deptPillMuted}>
                  <Building size={14} />
                  <span>{currentRole === UserRole.SUPER_ADMIN ? "Super Admin Access" : "Location Admin Access"}</span>
                </span>
              </div>
            </div>

            <div className={styles.deptHeroActions}>
              <button
                className={styles.createButton}
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={18} />
                <span>Add Location</span>
              </button>
              <p className={styles.deptHeroHint}>Register new airport locations.</p>
            </div>
          </div>

          {/* Stats Grid top */}
          <div className={styles.deptStatsGrid} aria-label="Locations summary">
            <div className={styles.deptStatCard}>
              <div className={styles.deptStatIcon} aria-hidden="true">
                <Globe size={18} />
              </div>
              <div className={styles.deptStatBody}>
                <div className={styles.deptStatLabel}>Total Locations</div>
                <div className={styles.deptStatValue}>{totalLocations}</div>
              </div>
            </div>
            <div className={styles.deptStatCard}>
              <div className={styles.deptStatIcon} style={{ background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.22)', color: '#2563eb' }} aria-hidden="true">
                <Building2 size={18} />
              </div>
              <div className={styles.deptStatBody}>
                <div className={styles.deptStatLabel}>Departments</div>
                <div className={styles.deptStatValue}>{totalDepartments}</div>
              </div>
            </div>
            <div className={styles.deptStatCard}>
              <div className={styles.deptStatIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.22)', color: '#f59e0b' }} aria-hidden="true">
                <QrCode size={18} />
              </div>
              <div className={styles.deptStatBody}>
                <div className={styles.deptStatLabel}>Total Touchpoints</div>
                <div className={styles.deptStatValue}>{totalTouchpoints}</div>
              </div>
            </div>
          </div>

          {/* Location Title */}
          <div className={styles.mainHeader}>
            <div>
              <h2 className={styles.locationTitle}>
                {selectedLocation ? selectedLocation.name : "All Locations"}
              </h2>
              <p className={styles.locationPath}>FAA Network / Locations {selectedLocation && `/ ${selectedLocation.name}`}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {selectedLocation && (
                <>
                  <button 
                    className={styles.cancelBtn} 
                    style={{ color: '#ef4444', border: '1px solid #fee2e2', background: '#fef2f2' }}
                    onClick={() => handleDeleteLocation(selectedLocation.id, selectedLocation.name)}
                  >
                    <Trash2 size={18} />
                    <span>Delete Location</span>
                  </button>
                  <button className={styles.createButton} onClick={() => setIsAdminModalOpen(true)}>
                    <Plus size={18} />
                    <span>Add Admin</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Grid for Selected Zone */}
          {selectedZone && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "#dcfce7", color: "#15803d" }}>
                  <Users size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Staff Count</span>
                  <h3 className={styles.statValue}>{selectedZone?.staffCount || 0}</h3>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "#fef9c3", color: "#a16207" }}>
                  <Star size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Touchpoints</span>
                  <h3 className={styles.statValue}>{selectedZone?.touchpointCount || 0}</h3>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "#fee2e2", color: "#b91c1c" }}>
                  <AlertCircle size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Active Issues</span>
                  <h3 className={styles.statValue}>{selectedZone?.activeIssueCount || 0}</h3>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "#dbeafe", color: "#1e40af" }}>
                  <MessageSquare size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Status</span>
                  <h3 className={styles.statValue}>{selectedZone?.isActive ? "Active" : "Inactive"}</h3>
                </div>
              </div>
            </div>
          )}

          {/* HEATMAP / VISUALIZATION */}
          {/* DEPARTMENTS OVERVIEW */}
          <section className={styles.heatmapSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  {selectedLocation ? `${selectedLocation.name} - Departments` : "Network Departments Overview"}
                </h3>
                <p className={styles.sectionSubtitle}>
                  {selectedLocation 
                    ? `Breakdown of operational capacity across departments in ${selectedLocation.airportCode}.`
                    : "Summary of departmental distribution across all airport locations."
                  }
                </p>
              </div>
            </div>

            <div className={styles.resourceItems} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {departments.length ? (
                departments.map((dept: any) => (
                  <div 
                    key={dept.id} 
                    className={`${styles.resourceItem} ${selectedZone?.id === dept.id ? styles.selected : ""}`}
                    style={{ 
                      flexDirection: 'column', 
                      alignItems: 'flex-start', 
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      background: selectedZone?.id === dept.id ? 'var(--brand-green-light)' : '#ffffff'
                    }}
                    onClick={() => setSelectedZone(dept as any)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
                      <div className={styles.resourceIcon} style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
                        <Building2 size={20} />
                      </div>
                      <div className={`${styles.statusBadge} ${styles.neutral}`}>
                        {dept.code}
                      </div>
                    </div>
                    
                    <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{dept.name}</h4>
                    {dept.location?.name && !selectedLocation && (
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-green)', marginBottom: '4px' }}>{dept.location.name}</p>
                    )}
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>{dept.responsibility || "Operational department"}</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Staff</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>{dept.staffCount || 0}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Touchpoints</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>{dept.touchpointCount || 0}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                  <Building size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                  <h4 style={{ color: '#475569', fontWeight: 600 }}>No Departments Found</h4>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>There are no departments registered yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* ADMINS SECTION */}
            <section className={styles.heatmapSection} style={{ marginTop: '32px', marginBottom: '40px' }}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>
                    {selectedLocation ? "Location Administrators" : "Network Administrators Overview"}
                  </h3>
                  <p className={styles.sectionSubtitle}>
                    {selectedLocation 
                      ? `Accountable officials for ${selectedLocation.name}.`
                      : "Aggregated list of administrators across the entire FAAN network."
                    }
                  </p>
                </div>
                {selectedLocation && (
                  <button 
                    className={styles.createButton} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAdminModalOpen(true);
                    }}
                    style={{ padding: '8px 16px', height: 'auto' }}
                  >
                    <Plus size={16} />
                    <span>Assign Admin</span>
                  </button>
                )}
              </div>

              <div className={styles.resourceItems} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(selectedLocation 
                  ? (selectedLocation as any).admins || []
                  : locations.flatMap(loc => (loc as any).admins?.map((a: any) => ({ ...a, locationName: loc.name })) || [])
                ).map((admin: any) => (
                  <div key={admin.id} className={styles.resourceItem} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div className={styles.resourceIcon} style={{ background: 'rgba(21, 115, 71, 0.08)', color: 'var(--brand-green)', width: '40px', height: '40px' }}>
                      <Shield size={20} />
                    </div>
                    <div className={styles.resourceInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '15px', color: '#1e293b' }}>{admin.firstName} {admin.lastName}</strong>
                          {!selectedLocation && <span style={{ fontSize: '11px', color: 'var(--brand-green)', fontWeight: 600 }}>{admin.locationName}</span>}
                        </div>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 10px', 
                          borderRadius: '20px', 
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: admin.isActive ? '#dcfce7' : '#fee2e2',
                          color: admin.isActive ? '#15803d' : '#b91c1c',
                          border: admin.isActive ? '1px solid #b7e4c7' : '1px solid #fecaca',
                          marginLeft: 'auto'
                        }}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '12px' }}>
                        <span>{admin.email}</span>
                        {admin.phone && (
                          <>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <span>{admin.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedLocation && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className={styles.resourceRemove} 
                          style={{ background: '#f8fafc' }}
                          onClick={() => handleEditAdmin(admin)}
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {!(selectedLocation 
                  ? (selectedLocation as any).admins?.length
                  : locations.some(loc => (loc as any).admins?.length)
                ) && (
                  <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                    <Users size={32} style={{ color: '#94a3b8', marginBottom: '12px' }} />
                    <p style={{ color: '#64748b', fontWeight: 500 }}>No administrators assigned yet</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Assign an official to manage operations.</p>
                  </div>
                )}
              </div>
            </section>
        </main>
      </div>

      {/* CREATE LOCATION MODAL */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>New Entry</span>
                <h3 className={styles.modalTitle}>Create New Location</h3>
                <p className={styles.modalSubtitle}>Register a new airport in the FAAN network</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsCreateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateLocation(); }}>
              <div className={styles.modalBody}>
                <div className={styles.modalForm}>
                  <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Location Name *</label>
                      <span className={styles.fieldDesc}>Full airport name</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <Plane size={18} />
                      <input
                        type="text"
                        placeholder="e.g. Lagos Murtala Muhammed International Airport"
                        value={newLocation.name}
                        onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Airport Code *</label>
                        <span className={styles.fieldDesc}>IATA code</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <Globe size={18} />
                        <input
                          type="text"
                          placeholder="e.g. LOS"
                          value={newLocation.airportCode}
                          onChange={(e) => setNewLocation({ ...newLocation, airportCode: e.target.value.toUpperCase() })}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>City *</label>
                        <span className={styles.fieldDesc}>City name</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <Building size={18} />
                        <input
                          type="text"
                          placeholder="e.g. Lagos"
                          value={newLocation.city}
                          onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Address *</label>
                      <span className={styles.fieldDesc}>Full postal address</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <MapPin size={18} />
                      <input
                        type="text"
                        placeholder="e.g. Ikeja, Lagos, Nigeria"
                        value={newLocation.address}
                        onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Location Code</label>
                      <span className={styles.fieldDesc}>Internal identifier (e.g. LOS_INTL)</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <Building2 size={18} />
                      <input
                        type="text"
                        placeholder="e.g. LAGOS_INTL"
                        value={newLocation.code}
                        onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.createButton} disabled={createMutation.isPending}>
                  <CheckCircle size={18} /> {createMutation.isPending ? "Saving..." : "Save Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ADMIN MODAL */}
      {isAdminModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>{editingAdmin ? "Update Account" : "User Management"}</span>
                <h3 className={styles.modalTitle}>{editingAdmin ? `Edit ${editingAdmin.name}` : `Add Admin to ${selectedLocation?.name}`}</h3>
                <p className={styles.modalSubtitle}>{editingAdmin ? "Update administrator credentials and access." : "Create a new location administrator"}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => {
                setIsAdminModalOpen(false);
                setEditingAdmin(null);
                setNewAdmin({ name: '', email: '', password: '', role: UserRole.LOCATION_ADMIN });
              }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddAdmin(); }}>
              <div className={styles.modalBody}>
                <div className={styles.modalForm}>
                  <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Full Name *</label>
                      <span className={styles.fieldDesc}>Administrator&apos;s full name</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <Users size={18} />
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Email Address *</label>
                      <span className={styles.fieldDesc}>Valid email for login</span>
                    </div>
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

                  <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>{editingAdmin ? "New Password (Optional)" : "Password *"}</label>
                      <span className={styles.fieldDesc}>{editingAdmin ? "Leave blank to keep current password" : "Initial login password"}</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <Shield size={18} />
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
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
                    <div className={styles.labelGroup}>
                      <label className={styles.formLabel}>Role</label>
                      <span className={styles.fieldDesc}>User access level</span>
                    </div>
                    <div className={styles.modalInputWrapper}>
                      <Star size={18} />
                      <select
                        value={newAdmin.role}
                        onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as UserRole })}
                      >
                        <option value={UserRole.LOCATION_ADMIN}>Location Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => {
                  setIsAdminModalOpen(false);
                  setEditingAdmin(null);
                  setNewAdmin({ name: '', email: '', password: '', role: UserRole.LOCATION_ADMIN });
                }}>Cancel</button>
                <button type="submit" className={styles.createButton} disabled={createUserMutation.isPending}>
                  {editingAdmin ? <Edit size={18} /> : <Users size={18} />} 
                  {createUserMutation.isPending ? "Processing..." : editingAdmin ? "Update Admin" : "Create Admin"}
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
        isPending={deleteMutation.isPending}
      />
    </RoleGuard>
  );
}
