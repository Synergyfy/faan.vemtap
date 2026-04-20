"use client";

import { useState } from "react";
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
  Filter,
  Plus,
  X,
  Trash2,
  Edit,
  Globe,
  CheckCircle,
  Building,
  Eye,
  EyeOff,
  Shield
} from "lucide-react";
import Image from "next/image";
import styles from "../../Dashboard.module.css";
import RoleGuard from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/rbac";
import { useRole } from "@/context/RoleContext";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useLocations, useCreateLocation, useDeleteLocation } from "@/hooks/useLocations";
import { useCreateUser } from "@/hooks/useUsers";
import { Location, Department, Role } from "@/types/api";
import DeleteConfirmationModal from "@/components/displays/DeleteConfirmationModal";

export default function LocationsPage() {
  const { currentRole, currentLocation, locationName: roleLocationName } = useRole();
  const { data: locationsData, isLoading } = useLocations();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<Department | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locationAdmins, setLocationAdmins] = useState([
    { id: 1, name: "Engr. Jide Ojo", email: "jide.ojo@faan.gov.ng", status: "Accepted", phone: "+234 802 345 6789" },
    { id: 2, name: "Mrs. Amina Bello", email: "amina.bello@faan.gov.ng", status: "Pending", phone: "+234 803 111 2222" },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemName: '',
    itemType: 'location' as const,
    isGroup: false,
    instanceCount: 0,
    affectedItems: [] as string[],
    onConfirm: () => {},
  });

  const createMutation = useCreateLocation();
  const deleteMutation = useDeleteLocation();
  const createUserMutation = useCreateUser();

  const locations = locationsData?.data || [];

  const handleDeleteLocation = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      itemName: name,
      itemType: 'location',
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

  const toggleExpand = (id: string) => {
    setExpanded(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleTooltip = (id: number) => {
    setActiveTooltip(activeTooltip === id ? null : id);
  };

  const handleAddAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password || !selectedLocation) {
      toast.error("Please fill in all required fields and select a location");
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

  const filteredLocations = (currentRole === UserRole.SUPER_ADMIN
    ? locations
    : locations.filter((loc: Location) => loc.id === currentLocation)) as Location[];

  const terminalFiltered = filteredLocations.filter(loc =>
    !searchTerm || loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLocations = locations.length;
  const totalDepartments = locations.reduce((sum, loc) => sum + (loc.departments?.length || 0), 0);

  return (
    <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN]}>
      <div className={styles.locationsLayout} onClick={() => setActiveTooltip(null)}>
        {/* LEFT PANEL - TREE VIEW */}
        <aside className={styles.treePanel} onClick={(e) => e.stopPropagation()}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Locations Tree</h3>
            <div className={styles.panelSearch}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.treeView}>
            {terminalFiltered.map((airport) => (
              <div key={airport.id} className={styles.treeItem}>
                <div
                  className={`${styles.treeHeader} ${selectedLocation?.id === airport.id ? styles.selected : ""}`}
                  onClick={() => {
                    toggleExpand(airport.id);
                    setSelectedLocation(airport);
                    setSelectedZone(null);
                  }}
                >
                  {expanded.includes(airport.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <Plane size={18} className={styles.airportIcon} />
                  <span>{airport.name}</span>
                </div>

                {expanded.includes(airport.id) && (
                  <div className={styles.treeSubItems}>
                    {airport.departments?.map((dept) => (
                      <div key={dept.id} className={styles.treeItem}>
                        <div
                          className={`${styles.treeHeader} ${styles.zoneItem} ${selectedZone?.id === dept.id ? styles.selected : ""}`}
                          onClick={() => {
                            setSelectedZone(dept as any);
                            setSelectedLocation(airport);
                          }}
                        >
                          <Building2 size={16} className={styles.terminalIcon} />
                          <span>{dept.name}</span>
                          <div className={`${styles.statusDot} ${(dept as any).isActive ? styles.green : styles.gray}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN VIEW */}
        <main className={styles.locationMain} onClick={(e) => e.stopPropagation()}>
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
              <div className={styles.deptStatIcon} style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.22)', color: '#22c55e' }} aria-hidden="true">
                <CheckCircle size={18} />
              </div>
              <div className={styles.deptStatBody}>
                <div className={styles.deptStatLabel}>Active Zones</div>
                <div className={styles.deptStatValue}>24</div>
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
                  <h3 className={styles.statValue}>{selectedZone?.staffCount || (selectedZone?._count as any)?.users || 0}</h3>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "#fef9c3", color: "#a16207" }}>
                  <Star size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Touchpoints</span>
                  <h3 className={styles.statValue}>{selectedZone?.touchpointCount || selectedZone?._count?.touchpoints || 0}</h3>
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
          <section className={styles.heatmapSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Zone Status Heatmap</h3>
                <p className={styles.sectionSubtitle}>Real-time operational health across all zones.</p>
              </div>
              <div className={styles.legend}>
                <div className={styles.legendItem}><span className={styles.green} /> Good</div>
                <div className={styles.legendItem}><span className={styles.yellow} /> Warning</div>
                <div className={styles.legendItem}><span className={styles.red} /> Critical</div>
              </div>
            </div>

            <div className={styles.heatmapGrid}>
              {[
                { id: 1, label: "Cleaning Level", value: 94, status: "green", desc: "Maintenance staff actively present. No pending tasks." },
                { id: 2, label: "Staff Presence", value: 88, status: "green", desc: "Full team rotation on-site. Average response time: 4m." },
                { id: 3, label: "Equipment Health", value: 42, status: "red", desc: "Elevator B-14 reported offline. Service technician dispatched." },
                { id: 4, label: "Wait Time", value: 65, status: "yellow", desc: "Higher than average peak. 12m wait time currently." },
                { id: 5, label: "Complaint Rate", value: 12, status: "green", desc: "Negligible complaint volume in the last 2 hours." },
                { id: 6, label: "Passenger Flow", value: 92, status: "green", desc: "Smooth transitions. No congestion reported." },
                { id: 7, label: "Security Status", value: 35, status: "red", desc: "Screening point 4 jammed. Redirecting passengers." },
                { id: 8, label: "Lighting", value: 98, status: "green", desc: "Optimal illumination level. No fixtures require repair." },
                { id: 9, label: "Feedback Loop", value: 75, status: "yellow", desc: "Interaction rate falling. Check engagement kiosks." },
                { id: 10, label: "HVAC System", value: 91, status: "green", desc: "Ambient temperature at 22.5°C. System performing well." },
                { id: 11, label: "Internet Access", value: 68, status: "yellow", desc: "Minor interference in Gate 12 area. IT investigating." },
                { id: 12, label: "Power Supply", value: 100, status: "green", desc: "Consistent power flow. Backup generators on standby." }
              ].map((block) => (
                <div
                  key={block.id}
                  className={`${styles.heatmapBlock} ${styles[block.status]} ${activeTooltip === block.id ? styles.activeBlock : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTooltip(block.id);
                  }}
                >
                  <div className={styles.blockContent}>
                    <span className={styles.blockLabel}>{block.label}</span>
                    <span className={styles.blockValue}>{block.value}%</span>
                  </div>
                  <div className={`${styles.heatmapTooltip} ${activeTooltip === block.id ? styles.activeTooltip : ""}`}>
                    <h4 className={styles.tooltipTitle}>{block.label}</h4>
                    <p className={styles.tooltipDesc}>{block.desc}</p>
                    <div className={styles.tooltipStatus}>
                      <div className={`${styles.statusBadge} ${styles[block.status]}`}>
                        Status: {block.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ADMINS SECTION */}
          {selectedLocation && (
            <section className={styles.heatmapSection} style={{ marginTop: '32px', marginBottom: '40px' }}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Location Administrators</h3>
                  <p className={styles.sectionSubtitle}>Accountable officials for {selectedLocation.name}.</p>
                </div>
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
              </div>

              <div className={styles.resourceItems} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {locationAdmins.map((admin) => (
                  <div key={admin.id} className={styles.resourceItem} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div className={styles.resourceIcon} style={{ background: 'rgba(21, 115, 71, 0.08)', color: 'var(--brand-green)', width: '40px', height: '40px' }}>
                      <Shield size={20} />
                    </div>
                    <div className={styles.resourceInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '15px', color: '#1e293b' }}>{admin.name}</strong>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 10px', 
                          borderRadius: '20px', 
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: admin.status === 'Accepted' ? '#dcfce7' : '#fff9c2',
                          color: admin.status === 'Accepted' ? '#15803d' : '#854d0e',
                          border: admin.status === 'Accepted' ? '1px solid #b7e4c7' : '1px solid #fde68a'
                        }}>
                          {admin.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '12px' }}>
                        <span>{admin.email}</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span>{admin.phone}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className={styles.resourceRemove} style={{ background: '#f8fafc' }}>
                        <Edit size={14} />
                      </button>
                      <button className={styles.resourceRemove} style={{ color: '#ef4444', background: '#fef2f2' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {locationAdmins.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                    <Users size={32} style={{ color: '#94a3b8', marginBottom: '12px' }} />
                    <p style={{ color: '#64748b', fontWeight: 500 }}>No administrators assigned yet</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Assign an official to manage this location's operations.</p>
                  </div>
                )}
              </div>
            </section>
          )}
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
                <span className={styles.wizardBadge}>User Management</span>
                <h3 className={styles.modalTitle}>Add Admin to {selectedLocation?.name}</h3>
                <p className={styles.modalSubtitle}>Create a new location administrator</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsAdminModalOpen(false)}>
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
                      <label className={styles.formLabel}>Password *</label>
                      <span className={styles.fieldDesc}>Initial login password</span>
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
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAdminModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.createButton} disabled={createUserMutation.isPending}>
                  <Users size={18} /> {createUserMutation.isPending ? "Creating..." : "Create Admin"}
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
