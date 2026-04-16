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
  Edit
} from "lucide-react";
import styles from "../../Dashboard.module.css";
import RoleGuard from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/rbac";
import { useRole } from "@/context/RoleContext";

interface Terminal {
  id: string;
  name: string;
  zones: { id: string; name: string; status: string; interactions?: number; satisfaction?: number; issues?: number; topComplaint?: string; }[];
}

interface Admin {
  name: string;
  email: string;
  role: UserRole;
}

interface LocationData {
  id: string;
  name: string;
  type: string;
  address: string;
  terminals: Terminal[];
  admins?: Admin[];
}

const INITIAL_LOCATIONS: LocationData[] = [
  {
    id: "abuja",
    name: "Abuja International Airport",
    type: "International",
    address: "Abuja, Nigeria",
    admins: [],
    terminals: [
      {
        id: "abv-t1",
        name: "Terminal 1",
        zones: [
          { id: "abv-t1-g1", name: "Departure Gate A", interactions: 120, satisfaction: 4.8, issues: 2, topComplaint: "Seating", status: "green" },
          { id: "abv-t1-l1", name: "VIP Lounge", interactions: 45, satisfaction: 4.9, issues: 0, topComplaint: "None", status: "green" },
          { id: "abv-t1-r1", name: "Restroom - East Wing", interactions: 230, satisfaction: 3.2, issues: 8, topComplaint: "Cleanliness", status: "red" },
        ]
      },
      {
        id: "abv-t2",
        name: "Terminal 2",
        zones: [
          { id: "abv-t2-s1", name: "Security Area", interactions: 500, satisfaction: 4.1, issues: 5, topComplaint: "Wait Time", status: "yellow" },
        ]
      }
    ]
  },
  {
    id: "lagos",
    name: "Lagos Murtala Muhammed",
    type: "International",
    address: "Lagos, Nigeria",
    admins: [],
    terminals: [
      {
        id: "los-intl",
        name: "International Terminal",
        zones: [
          { id: "los-intl-g1", name: "Gate 1", interactions: 300, satisfaction: 4.5, issues: 3, topComplaint: "Staff", status: "green" },
          { id: "los-intl-b1", name: "Baggage Area", interactions: 600, satisfaction: 3.8, issues: 12, topComplaint: "Baggage Delay", status: "yellow" },
        ]
      }
    ]
  }
];

import { useLocations, useCreateLocation, useDeleteLocation } from "@/hooks/useLocations";
import { Location, Department } from "@/types/api";

export default function LocationsPage() {
  const { currentRole, currentLocation, hasAccessToLocation } = useRole();
  const { data: locationsData, isLoading } = useLocations();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<Department | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const createMutation = useCreateLocation();
  const deleteMutation = useDeleteLocation();

  const locations = locationsData?.data || [];

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
    // Admin creation logic using useUsers would go here
    setIsAdminModalOpen(false);
  };

  const handleCreateLocation = () => {
    createMutation.mutate({
      name: newLocation.name,
      airportCode: newLocation.airportCode,
      city: newLocation.city,
      address: newLocation.address,
      code: newLocation.code || newLocation.airportCode,
    }, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setNewLocation({ name: '', type: 'International', address: '', city: '', airportCode: '', code: '' });
      }
    });
  };

  const handleDeleteLocation = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (selectedLocation?.id === id) setSelectedLocation(null);
      }
    });
  };

  const filteredLocations = (currentRole === UserRole.SUPER_ADMIN 
    ? locations 
    : locations.filter((loc: Location) => loc.id === currentLocation)) as Location[];

  return (
    <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className={styles.locationsLayout} onClick={() => setActiveTooltip(null)}>
        {/* LEFT PANEL - TREE VIEW */}
        <aside className={styles.treePanel} onClick={(e) => e.stopPropagation()}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Locations Tree</h3>
            <div className={styles.panelSearch}>
              <Search size={16} />
              <input type="text" placeholder="Search locations..." />
            </div>
          </div>

          <div className={styles.treeView}>
            {filteredLocations.map((airport) => (
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
                            setSelectedZone(dept as any); // Cast here if needed for state compatibility
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
          <div className={styles.mainHeader}>
            <div>
              <h2 className={styles.locationTitle}>
                {selectedLocation ? selectedLocation.name : "Locations Management"}
              </h2>
              <p className={styles.locationPath}>FAA System / Locations {selectedLocation && `/ ${selectedLocation.name}`}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {selectedLocation && (
                <button className={styles.createButton} onClick={() => setIsAdminModalOpen(true)}>
                  <Plus size={18} />
                  <span>Add Admin</span>
                </button>
              )}
              <button className={styles.filterButton} onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={18} />
                <span>Create New Location</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
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
                <p className={styles.sectionSubtitle}>Detailed health overview of all operational zones.</p>
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
        </main>
      </div>

      {/* CREATE LOCATION MODAL */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New Location</h3>
              <button className={styles.closeBtn} onClick={() => setIsCreateModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateLocation(); }}>
              <div className={styles.modalBody}>
                <div className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Location Name</label>
                    <div className={styles.modalInputWrapper}>
                      <Plane size={18} />
                      <input 
                        type="text" 
                        placeholder="e.g. Lagos Airport"
                        value={newLocation.name}
                        onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Airport Code</label>
                    <div className={styles.modalInputWrapper}>
                      <Plane size={18} />
                      <input 
                        type="text" 
                        placeholder="e.g. ABV"
                        value={newLocation.airportCode}
                        onChange={(e) => setNewLocation({...newLocation, airportCode: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City</label>
                    <div className={styles.modalInputWrapper}>
                      <Building2 size={18} />
                      <input 
                        type="text" 
                        placeholder="e.g. Abuja"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({...newLocation, city: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Address</label>
                    <div className={styles.modalInputWrapper}>
                      <MapPin size={18} />
                      <input 
                        type="text" 
                        placeholder="e.g. Abuja, Nigeria"
                        value={newLocation.address}
                        onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.createButton}>Save Location</button>
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
              <h3 className={styles.modalTitle}>Add Admin to {selectedLocation?.name}</h3>
              <button className={styles.closeBtn} onClick={() => setIsAdminModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddAdmin(); }}>
              <div className={styles.modalBody}>
                <div className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Name</label>
                    <div className={styles.modalInputWrapper}>
                      <Users size={18} />
                      <input 
                        type="text" 
                        placeholder="Admin Name"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <div className={styles.modalInputWrapper}>
                      <Search size={18} />
                      <input 
                        type="email" 
                        placeholder="admin@email.com"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Password</label>
                    <div className={styles.modalInputWrapper}>
                      <Filter size={18} />
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Role</label>
                    <div className={styles.modalInputWrapper}>
                      <Star size={18} />
                      <select 
                        value={newAdmin.role}
                        onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value as UserRole})}
                      >
                        <option value={UserRole.LOCATION_ADMIN}>Location Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAdminModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.createButton}>Save Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
