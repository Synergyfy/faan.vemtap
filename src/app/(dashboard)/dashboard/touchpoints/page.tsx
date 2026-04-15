"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  QrCode, 
  Download, 
  Edit, 
  Power,
  X,
  ExternalLink,
  MapPin,
  Briefcase,
  Layers,
  FileText,
  Wifi
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import styles from "../../Dashboard.module.css";

// Mock Data
const MOCK_LOCATIONS = [
  { id: "abuja", name: "Abuja International Airport" },
  { id: "lagos", name: "Lagos Murtala Muhammed" },
  { id: "kano", name: "Kano Mallam Aminu" },
  { id: "port-harcourt", name: "Port Harcourt Intl" },
  { id: "enugu", name: "Enugu Airport" },
];

const INITIAL_FORMS = [
  { id: "form-001", name: "Passenger Feedback", type: "Feedback" },
  { id: "form-002", name: "Airport Cleanliness Survey", type: "Feedback" },
  { id: "form-003", name: "Security Complaint Form", type: "Complaint" },
  { id: "form-004", name: "Baggage Incident Report", type: "Incident" },
];

const INITIAL_TOUCHPOINTS = [
  { id: "tp-071dau", name: "Restroom Feedback - T1", location: "Abuja International Airport", type: "Feedback", status: "Active", interactions: 1250 },
  { id: 2, name: "Security Complaint - Gate 4", location: "Lagos Murtala Muhammed", type: "Complaint", status: "Inactive", interactions: 450 },
  { id: 3, name: "Baggage Incident - Arrival", location: "Abuja International Airport", type: "Incident", status: "Active", interactions: 120 },
  { id: 4, name: "Lounge satisfaction - VIP", location: "Abuja International Airport", type: "Feedback", status: "Active", interactions: 890 },
];

// Mock Submissions Data
const MOCK_SUBMISSIONS: any = {
  "tp-071dau": [
    { 
      id: "sub-1", 
      user: "Anonymous", 
      timestamp: "2024-04-14 10:20 AM", 
      rating: 5,
      data: { "rating": 5, "comment": "Excellent service at the check-in counter!" }
    },
    { 
      id: "sub-2", 
      user: "John Doe", 
      timestamp: "2024-04-14 11:45 AM", 
      rating: 2,
      data: { "rating": 2, "comment": "Long wait time at security.", "name": "John Doe", "email": "john@example.com" }
    }
  ]
};

export default function TouchpointsPage() {
  const [touchpoints, setTouchpoints] = useState(INITIAL_TOUCHPOINTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [origin, setOrigin] = useState("");
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [currentTouchpoint, setCurrentTouchpoint] = useState<any>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [tempLocation, setTempLocation] = useState("");

  // Submission State
  const [showResponses, setShowResponses] = useState(false);
  const [activeResponses, setActiveResponses] = useState<any[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);

  const handleViewResponses = (tp: any) => {
    setActiveResponses(MOCK_SUBMISSIONS[tp.id] || []);
    setShowResponses(true);
    setCurrentTouchpoint(tp);
  };

  // Form Builder State
  const [newTouchpoint, setNewTouchpoint] = useState({
    title: "",
    location: "",
    department: "",
    type: "Feedback",
    template: "Standard Survey"
  });

  const [formFields, setFormFields] = useState<any[]>([
    { id: 1, type: "rating", label: "Overall Experience", required: true }
  ]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const addField = (type: string) => {
    const newField = {
      id: Date.now(),
      type: type,
      label: type === "rating" ? "Rate your experience" : `New ${type} question`,
      required: true,
      options: type === "select" ? ["Option 1", "Option 2"] : undefined
    };
    setFormFields([...formFields, newField]);
  };

  const removeField = (id: number) => {
    setFormFields(formFields.filter(f => f.id !== id));
  };

  const updateField = (id: number, updates: any) => {
    setFormFields(formFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const created = {
      id: touchpoints.length + 1,
      name: newTouchpoint.title,
      location: newTouchpoint.location,
      type: newTouchpoint.type,
      status: "Active",
      interactions: 0,
      config: formFields
    };
    setTouchpoints([created, ...touchpoints]);
    setIsModalOpen(false);
    setWizardStep(1);
    setFormFields([{ id: 1, type: "rating", label: "Overall Experience", required: true }]);
    setNewTouchpoint({ title: "", location: "", department: "", type: "Feedback", template: "Standard Survey" });
  };

  const toggleStatus = (id: any) => {
    setTouchpoints(touchpoints.map(tp => 
      tp.id === id ? { ...tp, status: tp.status === "Active" ? "Inactive" : "Active" } : tp
    ));
  };

  const generatedId = `tp-${Math.random().toString(36).substr(2, 6)}`;
  const dynamicLink = `${origin}/p/${generatedId}`;

  return (
    <div className={styles.touchpointsLayout}>
      {/* ... prev header code ... */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Touchpoints Management</h2>
          <p className={styles.pageSubtitle}>Monitor and manage all QR & NFC passenger engagement points.</p>
        </div>
        <button className={styles.createButton} onClick={() => setShowLocationPicker(true)}>
          <Plus size={18} />
          <span>Create New Touchpoint</span>
        </button>
      </div>

      {/* ... prev table controls & table ... */}
      <div className={styles.tableControls}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search touchpoints..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <button className={styles.filterButton}>
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Type</th>
              <th>Status</th>
              <th>Interactions</th>
              <th className={styles.textRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {touchpoints.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((tp) => (
              <tr key={tp.id}>
                <td>
                  <div className={styles.nameCell}>
                    <span className={styles.tpName}>{tp.name}</span>
                    <span className={styles.tpId}>ID: TP-00{tp.id}</span>
                  </div>
                </td>
                <td>{tp.location}</td>
                <td>
                  <span className={`${styles.typeTag} ${styles[tp.type.toLowerCase()]}`}>
                    {tp.type}
                  </span>
                </td>
                <td>
                  <div className={styles.statusCell}>
                    <div className={`${styles.statusDot} ${tp.status === "Active" ? styles.green : styles.gray}`} />
                    <span>{tp.status}</span>
                  </div>
                </td>
                <td>{tp.interactions.toLocaleString()}</td>
                <td className={styles.textRight}>
                  <div className={styles.actionButtons}>
                    <button className={styles.actionIcon} title="View QR" onClick={() => setShowQrPreview(true)}><QrCode size={18} /></button>
                    <button className={styles.actionIcon} title="Download"><Download size={18} /></button>
                    <button className={styles.actionIcon} title="Edit"><Edit size={18} /></button>
                    <button 
                      className={`${styles.actionIcon} ${styles.disableIcon} ${tp.status === "Inactive" ? styles.disabled : ""}`} 
                      title={tp.status === "Active" ? "Disable" : "Enable"}
                      onClick={() => toggleStatus(tp.id)}
                    >
                      <Power size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE WIZARD MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.wizardBadge}>Step {wizardStep} of 2</div>
                <h3 className={styles.modalTitle}>
                  {wizardStep === 1 && "Create Touchpoint"}
                  {wizardStep === 2 && "Review & Generate"}
                </h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            <div className={styles.wizardProgress}>
              <div className={`${styles.progressStep} ${wizardStep >= 1 ? styles.active : ""}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 2 ? styles.active : ""}`} />
            </div>
            
            <div className={styles.modalBody}>
              {/* STEP 1: BASICS */}
              {wizardStep === 1 && (
                <div className={styles.modalForm}>
                  <div style={{ 
                    background: "#f0fdf4", 
                    border: "1px solid #bbf7d0", 
                    borderRadius: "8px", 
                    padding: "12px 16px", 
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <MapPin size={16} style={{ color: "#16a34a" }} />
                    <span style={{ color: "#166534", fontWeight: 500 }}>Creating touchpoint for: {selectedLocation}</span>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Touchpoint Title</label>
                        <span className={styles.fieldDesc}>A descriptive name for internal tracking.</span>
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

                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Touchpoint Location</label>
                        <span className={styles.fieldDesc}>The specific area within the {selectedLocation}.</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <MapPin size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. Gate A - Restroom" 
                          required 
                          value={newTouchpoint.location}
                          onChange={(e) => setNewTouchpoint({...newTouchpoint, location: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Responsible Department</label>
                        <span className={styles.fieldDesc}>The team in charge of managing this point.</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <Briefcase size={18} />
                        <select 
                          value={newTouchpoint.department}
                          onChange={(e) => setNewTouchpoint({...newTouchpoint, department: e.target.value})}
                        >
                          <option value="">Select Department</option>
                          <option value="Operations">Operations</option>
                          <option value="Security">Security</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Facilities">Facilities</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Select Form</label>
                        <span className={styles.fieldDesc}>Choose a pre-built form for this touchpoint.</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <Layers size={18} />
                        <select 
                          value={newTouchpoint.type}
                          onChange={(e) => {
                            const form = INITIAL_FORMS.find(f => f.id === e.target.value);
                            setNewTouchpoint({...newTouchpoint, type: form?.type || "Feedback"});
                          }}
                        >
                          <option value="">Select a Form</option>
                          {INITIAL_FORMS.map(form => (
                            <option key={form.id} value={form.id}>{form.name} ({form.type})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: REVIEW */}
              {wizardStep === 2 && (
                <div className={styles.modalForm}>
                  <div className={styles.generatedSection}>
                    <div className={styles.sectionHeaderGroup}>
                      <h4 className={styles.sectionHeader}>Final Touchpoint Review</h4>
                      <p className={styles.sectionDesc}>Confirm details and generated assets.</p>
                    </div>
                    <div className={styles.reviewSummary}>
                      <div className={styles.summaryItem}><strong>Name:</strong> {newTouchpoint.title}</div>
                      <div className={styles.summaryItem}><strong>Location:</strong> {newTouchpoint.location}</div>
                      <div className={styles.summaryItem}><strong>Department:</strong> {newTouchpoint.department}</div>
                      <div className={styles.summaryItem}><strong>Form:</strong> {INITIAL_FORMS.find(f => f.id === newTouchpoint.type)?.name || newTouchpoint.type}</div>
                    </div>
                    <div className={styles.previewGrid}>
                      <div className={styles.previewItem}>
                        <span className={styles.previewLabel}>Access Link (Live)</span>
                        <a href={dynamicLink} target="_blank" className={styles.previewLink} onClick={(e) => e.stopPropagation()}>
                          <span>{dynamicLink.length > 30 ? dynamicLink.substring(0, 27) + "..." : dynamicLink}</span>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <div className={styles.previewItem}>
                        <span className={styles.previewLabel}>QR Code</span>
                        <div className={styles.previewQr} onClick={() => setShowQrPreview(true)}>
                          <QRCodeSVG value={dynamicLink} size={40} />
                        </div>
                      </div>
                      <div className={styles.previewItem}>
                        <span className={styles.previewLabel}>NFC Link</span>
                        <div className={styles.nfcLink}>
                          <Wifi size={14} />
                          <span>{dynamicLink}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              {wizardStep > 1 && (
                <button type="button" className={styles.cancelBtn} onClick={() => setWizardStep(wizardStep - 1)}>Back</button>
              )}
              {wizardStep < 2 ? (
                <button 
                  type="button" 
                  className={styles.submitBtn} 
                  onClick={() => setWizardStep(wizardStep + 1)}
                  disabled={!newTouchpoint.title || !newTouchpoint.location || !newTouchpoint.department || !newTouchpoint.type}
                >
                  Continue to Review
                </button>
              ) : (
                <button type="button" className={styles.submitBtn} onClick={handleCreate}>
                  Finish & Publish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOCATION PICKER MODAL */}
      {showLocationPicker && (
        <div className={styles.modalOverlay} onClick={() => setShowLocationPicker(false)}>
          <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <h3 className={styles.previewTitle}>Select Location</h3>
              <button className={styles.closeBtn} onClick={() => setShowLocationPicker(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: "20px" }}>
              <p style={{ marginBottom: "16px", color: "#64748b", fontSize: "14px" }}>
                Choose the airport location where you want to create a touchpoint.
              </p>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                  Airport Location
                </label>
                <select
                  value={tempLocation}
                  onChange={(e) => setTempLocation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "15px",
                    background: "white",
                    color: "#1e293b",
                  }}
                >
                  <option value="">Select an airport</option>
                  {MOCK_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setSelectedLocation(tempLocation);
                  setShowLocationPicker(false);
                  setIsModalOpen(true);
                  setWizardStep(1);
                }}
                disabled={!tempLocation}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: tempLocation ? "#2563eb" : "#94a3b8",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: tempLocation ? "pointer" : "not-allowed",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {showQrPreview && (
        <div className={styles.modalOverlay} onClick={() => setShowQrPreview(false)}>
          <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <h3 className={styles.previewTitle}>QR Code Preview</h3>
              <button className={styles.closeBtn} onClick={() => setShowQrPreview(false)}><X size={20} /></button>
            </div>
            <div className={styles.fullQrWrapper}>
              <div className={styles.qrBackground}>
                <QRCodeSVG 
                  value={dynamicLink} 
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
              </div>
              <div className={styles.qrInfo}>
                <p className={styles.qrLinkText}>{dynamicLink}</p>
                <span className={styles.qrScanHint}>Scan to test this touchpoint</span>
              </div>
            </div>
            <div className={styles.previewActions}>
              <button className={styles.downloadBtn} onClick={() => alert("Downloading QR Code...")}>
                <Download size={18} />
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
