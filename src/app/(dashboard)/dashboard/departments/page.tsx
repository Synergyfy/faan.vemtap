"use client";

import { useState } from "react";
import { 
  Plus, 
  Search, 
  Users, 
  MousePointer2, 
  Shield, 
  Clock, 
  MoreVertical,
  X,
  User,
  ExternalLink,
  Settings,
  Briefcase,
  AlertCircle,
  Box,
  Edit,
  Trash2
} from "lucide-react";
import styles from "../../Dashboard.module.css";
import Image from "next/image";

// Industry Standard Mock Data for FAAN Departments
const INITIAL_DEPARTMENTS = [
  { 
    id: 1, 
    name: "Aviation Security (AVSEC)", 
    icon: Shield, 
    users: 24, 
    touchpoints: 12, 
    activeIssues: 3,
    responsibility: "Internal and external security of the airport premises and passengers.",
    color: "#ef4444"
  },
  { 
    id: 2, 
    name: "Customer Service", 
    icon: Users, 
    users: 18, 
    touchpoints: 45, 
    activeIssues: 0,
    responsibility: "Handling passenger inquiries, complaints, and satisfaction surveys.",
    color: "#22c55e"
  },
  { 
    id: 3, 
    name: "Operations Control", 
    icon: Settings, 
    users: 15, 
    touchpoints: 8, 
    activeIssues: 5,
    responsibility: "Real-time monitoring of airport flight operations and gate management.",
    color: "#3b82f6"
  },
  { 
    id: 4, 
    name: "Facilities & Assets", 
    icon: Briefcase, 
    users: 12, 
    touchpoints: 15, 
    activeIssues: 8,
    responsibility: "Maintenance of airport infrastructure, restrooms, and terminal amenities.",
    color: "#f59e0b"
  },
  { 
    id: 5, 
    name: "Protocol & VIP", 
    icon: User, 
    users: 8, 
    touchpoints: 5, 
    activeIssues: 0,
    responsibility: "Managing high-profile passenger experiences and lounge standards.",
    color: "#8b5cf6"
  }
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [editingDept, setEditingDept] = useState<any>(null);

  // Manage Modal State (Mocking additions)
  const [tempStaff, setTempStaff] = useState<any[]>([]);
  const [tempQR, setTempQR] = useState<any[]>([]);

  // Configuration toggles
  const [isAssigning, setIsAssigning] = useState(false);
  const [newStaffDetails, setNewStaffDetails] = useState({ name: "", role: "Duty Officer" });
  const [isLinking, setIsLinking] = useState(false);
  const [newQRDetails, setNewQRDetails] = useState({ name: "", airport: "Abuja International" });

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as any;
    const name = target[0].value;
    const desc = target[1].value;

    if (editingDept) {
      setDepartments(departments.map(d => d.id === editingDept.id ? { ...d, name, responsibility: desc } : d));
      setEditingDept(null);
    } else {
      const newDept = {
        id: Date.now(),
        name: name,
        icon: Briefcase,
        users: 0,
        touchpoints: 0,
        activeIssues: 0,
        responsibility: desc,
        color: "#64748b"
      };
      setDepartments([newDept, ...departments]);
    }
    setIsAddModalOpen(false);
  };

  const handleArchiveDept = (id: number) => {
    setDepartments(departments.filter(d => d.id !== id));
    setActiveDropdown(null);
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
        return { 
          ...d, 
          users: d.users + tempStaff.length, 
          touchpoints: d.touchpoints + tempQR.length 
        };
      }
      return d;
    });
    setDepartments(updated);
    setSelectedDept(null);
    setTempStaff([]);
    setTempQR([]);
  };

  return (
    <div className={styles.touchpointsLayout}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Departments Management</h2>
          <p className={styles.pageSubtitle}>Organize FAAN personnel and operational responsibilities.</p>
        </div>
        <button className={styles.createButton} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Add New Department</span>
        </button>
      </div>

      <div className={styles.tableControls}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search departments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.deptGrid}>
        {departments.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map((dept) => {
          const Icon = dept.icon;
          return (
            <div key={dept.id} className={styles.deptCard}>
              <div className={styles.deptCardHeader}>
                <div className={styles.deptIconBox} style={{ backgroundColor: `${dept.color}15`, color: dept.color }}>
                   <Icon size={24} />
                </div>
                <div className={styles.cardMenuWrapper}>
                  <button 
                    className={styles.cardMore} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === dept.id ? null : dept.id);
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {activeDropdown === dept.id && (
                    <div className={styles.cardDropdown}>
                       <button className={styles.dropdownItem} onClick={(e) => {
                         e.stopPropagation();
                         setEditingDept(dept);
                         setIsAddModalOpen(true);
                         setActiveDropdown(null);
                       }}><Edit size={14} /> Edit Dept</button>
                       
                       <div className={styles.dropdownSeparator} />
                       <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={(e) => {
                         e.stopPropagation();
                         handleArchiveDept(dept.id);
                       }}><Trash2 size={14} /> Archive</button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.deptCardInfo}>
                <h3 className={styles.deptCardTitle}>{dept.name}</h3>
                <p className={styles.deptCardDesc}>{dept.responsibility}</p>
              </div>

              <div className={styles.deptCardMetrics}>
                <div className={styles.deptMetric}>
                   <Users size={14} />
                   <span>{dept.users} Staff</span>
                </div>
                <div className={styles.deptMetric}>
                   <MousePointer2 size={14} />
                   <span>{dept.touchpoints} QRs</span>
                </div>
                {dept.activeIssues > 0 && (
                  <div className={`${styles.deptMetric} ${styles.alertMetric}`}>
                     <AlertCircle size={14} />
                     <span>{dept.activeIssues} Alerts</span>
                  </div>
                )}
              </div>

              <button 
                className={styles.deptManageBtn}
                onClick={() => setSelectedDept(dept)}
              >
                Manage Resources
                <ExternalLink size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT DEPARTMENT MODAL */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
                <div className={styles.modalTitleGroup}>
                   <h3 className={styles.modalTitle}>{editingDept ? 'Edit' : 'Register New'} Department</h3>
                   <p className={styles.modalSubtitle}>{editingDept ? 'Update department details.' : 'Create a new administrative unit for airport operations.'}</p>
                </div>
                <button className={styles.closeBtn} onClick={() => { setIsAddModalOpen(false); setEditingDept(null); }}><X size={20} /></button>
             </div>
             <form onSubmit={handleAddDept}>
                <div className={styles.modalBody}>
                   <div className={styles.modalForm}>
                      <div className={styles.formGroup}>
                        <div className={styles.labelGroup}>
                          <label className={styles.formLabel}>Unit Name</label>
                          <span className={styles.fieldDesc}>Technical name of the department (e.g. IT & Maintenance).</span>
                        </div>
                        <div className={styles.modalInputWrapper}>
                           <Shield size={18} />
                           <input type="text" placeholder="e.g. Ground Operations" defaultValue={editingDept?.name || ""} required />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <div className={styles.labelGroup}>
                           <label className={styles.formLabel}>Operations Charter</label>
                           <span className={styles.fieldDesc}>Summarize the core responsibility of this unit.</span>
                        </div>
                        <textarea placeholder="e.g. Responsible for boarding gate efficiency and staff shifts..." defaultValue={editingDept?.responsibility || ""} required className={styles.modalTextarea} style={{ height: "100px", marginTop: "8px" }} />
                      </div>
                   </div>
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => { setIsAddModalOpen(false); setEditingDept(null); }}>Discard</button>
                  <button type="submit" className={styles.createButton}>Confirm & Save</button>
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
                  className={`${styles.tabLink} ${activeTab === "users" ? styles.tabLinkActive : ""}`}
                  onClick={() => setActiveTab("users")}
                >
                  <Users size={18} />
                  Assigned Personnel
                </button>
                <button 
                  className={`${styles.tabLink} ${activeTab === "touchpoints" ? styles.tabLinkActive : ""}`}
                  onClick={() => setActiveTab("touchpoints")}
                >
                  <MousePointer2 size={18} />
                  Linked Touchpoints
                </button>
             </div>

             <div className={styles.modalBody} style={{ minHeight: "300px" }}>
                {activeTab === "users" ? (
                  <div className={styles.resourceList}>
                     <div className={styles.resourceHeader}>
                        <h4 className={styles.builderLabel}>Registered Staff ({selectedDept.users + tempStaff.length})</h4>
                        <button className={styles.inlineAddBtn} onClick={() => setIsAssigning(!isAssigning)}>
                          <Plus size={14} /> Assign Official
                        </button>
                     </div>

                     {isAssigning && (
                       <div className={styles.resourceConfigBox}>
                          <input type="text" placeholder="Official Name" value={newStaffDetails.name} onChange={e => setNewStaffDetails({...newStaffDetails, name: e.target.value})} className={styles.miniInput}/>
                          <select value={newStaffDetails.role} onChange={e => setNewStaffDetails({...newStaffDetails, role: e.target.value})} className={styles.miniSelect}>
                            <option value="Duty Officer">Duty Officer</option>
                            <option value="Manager">Manager</option>
                            <option value="Supervisor">Supervisor</option>
                          </select>
                          <button className={styles.createButton} onClick={handleAddStaff} style={{ padding: "8px 12px", height: "auto" }}>Add</button>
                       </div>
                     )}
                     <div className={styles.resourceItems}>
                        {[1,2,3].map(i => (
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
                        <h4 className={styles.builderLabel}>Operational Touchpoints ({selectedDept.touchpoints + tempQR.length})</h4>
                        <button className={styles.inlineAddBtn} onClick={() => setIsLinking(!isLinking)}>
                          <Plus size={14} /> Link QR Code
                        </button>
                     </div>

                     {isLinking && (
                       <div className={styles.resourceConfigBox}>
                          <input type="text" placeholder="Touchpoint Location" value={newQRDetails.name} onChange={e => setNewQRDetails({...newQRDetails, name: e.target.value})} className={styles.miniInput}/>
                          <select value={newQRDetails.airport} onChange={e => setNewQRDetails({...newQRDetails, airport: e.target.value})} className={styles.miniSelect}>
                            <option value="Abuja International">Abuja International</option>
                            <option value="Lagos Murtala Muhammed">Lagos Murtala Muhammed</option>
                            <option value="Kano Mallam Aminu">Kano Mallam Aminu</option>
                          </select>
                          <button className={styles.createButton} onClick={handleLinkQR} style={{ padding: "8px 12px", height: "auto" }}>Link</button>
                       </div>
                     )}
                     <div className={styles.resourceItems}>
                        {[1,2].map(i => (
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
    </div>
  );
}
