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
  Info,
  Star,
  Users,
  HelpCircle
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import styles from "../../Dashboard.module.css";
import Image from "next/image";

// Mock Data
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
        <button className={styles.createButton} onClick={() => { setIsModalOpen(true); setWizardStep(1); }}>
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
          <div className={`${styles.modalContent} ${wizardStep === 2 ? styles.wideModal : ""}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.wizardBadge}>Step {wizardStep} of 3</div>
                <h3 className={styles.modalTitle}>
                  {wizardStep === 1 && "Basic Configuration"}
                  {wizardStep === 2 && "Form Builder"}
                  {wizardStep === 3 && "Review & Generate"}
                </h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            <div className={styles.wizardProgress}>
              <div className={`${styles.progressStep} ${wizardStep >= 1 ? styles.active : ""}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 2 ? styles.active : ""}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 3 ? styles.active : ""}`} />
            </div>
            
            <div className={styles.modalBody}>
              {/* STEP 1: BASICS */}
              {wizardStep === 1 && (
                <div className={styles.modalForm}>
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
                        <label className={styles.formLabel}>Physical Location</label>
                        <span className={styles.fieldDesc}>The exact area where the QR code will be placed.</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <MapPin size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. Abuja - T1" 
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
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Interaction Type</label>
                        <span className={styles.fieldDesc}>Determines the focus of the engagement.</span>
                      </div>
                      <div className={styles.modalInputWrapper}>
                        <Layers size={18} />
                        <select 
                          value={newTouchpoint.type}
                          onChange={(e) => {
                            const type = e.target.value;
                            setNewTouchpoint({...newTouchpoint, type: type});
                            // Auto-set default fields based on type
                            if (type === "Complaint") setFormFields([{ id: 1, type: "text", label: "Complaint Category", required: true }, { id: 2, type: "textarea", label: "Description", required: true }]);
                            if (type === "Incident") setFormFields([{ id: 1, type: "text", label: "Incident Subject", required: true }, { id: 2, type: "file", label: "Evidence/Photo", required: false }]);
                            if (type === "Feedback") setFormFields([{ id: 1, type: "rating", label: "Overall Experience", required: true }]);
                          }}
                        >
                          <option value="Feedback">Feedback</option>
                          <option value="Complaint">Complaint</option>
                          <option value="Incident">Incident</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: FORM BUILDER */}
              {wizardStep === 2 && (
                <div className={styles.builderArea}>
                  <div className={styles.builderSidebar}>
                    <h4 className={styles.builderLabel}>Add Form Elements</h4>
                    <div className={styles.elementButtons}>
                      <button onClick={() => addField("rating")} className={styles.elementBtn}><Star size={14} /> 5-Star Rating</button>
                      <button onClick={() => addField("text")} className={styles.elementBtn}><FileText size={14} /> Short Text</button>
                      <button onClick={() => addField("textarea")} className={styles.elementBtn}><Layers size={14} /> Long Answer</button>
                      <button onClick={() => addField("select")} className={styles.elementBtn}><Filter size={14} /> Dropdown Menu</button>
                      <button onClick={() => addField("number")} className={styles.elementBtn}><Plus size={14} /> Number Input</button>
                      <button onClick={() => addField("email")} className={styles.elementBtn}><Plus size={14} /> Email Input</button>
                      <button onClick={() => addField("date")} className={styles.elementBtn}><Plus size={14} /> Date Picker</button>
                    </div>
                    
                    <div className={styles.builderSettings} style={{ marginTop: "40px" }}>
                       <h4 className={styles.builderLabel}>Advanced Tools</h4>
                       <button onClick={() => addField("file")} className={styles.elementBtn} style={{ background: "#f8fafc" }}><Plus size={14} /> Attachment Field</button>
                    </div>
                  </div>

                  <div className={styles.builderStage}>
                    {/* ... (existing field stage code) */}
                    <h4 className={styles.builderLabel}>Passenger View Flow</h4>
                    <div className={styles.fieldList}>
                      {formFields.map((field, index) => (
                        <div key={field.id} className={styles.fieldCard}>
                          <div className={styles.fieldCardHeader}>
                            <span className={styles.fieldIndex}>#{index + 1}</span>
                            <span className={styles.fieldTypeBadge}>{field.type}</span>
                            <button onClick={() => removeField(field.id)} className={styles.fieldRemove}><X size={14} /></button>
                          </div>
                          <input 
                            className={styles.fieldLabelInput} 
                            value={field.label} 
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="Enter question label..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.mobilePreviewContainer}>
                    <div className={styles.iphoneMockup}>
                       <div className={styles.iphoneNotch} />
                       <div className={styles.iphoneScreen}>
                          <div className={styles.previewHeaderMini}>
                             <div style={{ transform: "scale(0.5)", marginBottom: "-15px" }}>
                                <Image src="/Faan.logo_.png" alt="Logo" width={60} height={60} />
                             </div>
                             <h5 className={styles.previewTitleMini}>{newTouchpoint.type} Form</h5>
                          </div>
                          
                          {formFields.map(field => (
                            <div key={field.id} className={styles.previewField}>
                               <span className={styles.previewLabel}>{field.label}</span>
                               {field.type === "rating" ? (
                                 <div className={styles.previewRating}>
                                    <Star size={10} fill="currentColor" />
                                    <Star size={10} fill="currentColor" />
                                    <Star size={10} fill="currentColor" />
                                    <Star size={10} fill="none" />
                                    <Star size={10} fill="none" />
                                 </div>
                               ) : (
                                 <div className={styles.previewInputPlaceholder}>
                                    {field.type === "number" && "123..."}
                                    {field.type === "email" && "example@..."}
                                    {field.type === "date" && "YYYY-MM-DD"}
                                 </div>
                               )}
                            </div>
                          ))}

                          <div className={styles.previewContactMini} style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px", marginTop: "10px" }}>
                             <span className={styles.previewLabel} style={{ fontSize: "9px", opacity: 0.7 }}>Optional Contact Details</span>
                             <div className={styles.previewInputPlaceholder} style={{ height: "20px", marginBottom: "5px" }} />
                             <div className={styles.previewInputPlaceholder} style={{ height: "20px" }} />
                          </div>

                          <div className={styles.previewSubmitMini}>
                             Submit {newTouchpoint.type}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW */}
              {wizardStep === 3 && (
                <div className={styles.modalForm}>
                  <div className={styles.generatedSection}>
                    <div className={styles.sectionHeaderGroup}>
                      <h4 className={styles.sectionHeader}>Final Touchpoint Review</h4>
                      <p className={styles.sectionDesc}>Confirm details and generated assets.</p>
                    </div>
                    <div className={styles.reviewSummary}>
                      <div className={styles.summaryItem}><strong>Target:</strong> {newTouchpoint.title}</div>
                      <div className={styles.summaryItem}><strong>Type:</strong> {newTouchpoint.type}</div>
                      <div className={styles.summaryItem}><strong>Questions:</strong> {formFields.length} active fields</div>
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
                        <span className={styles.previewLabel}>QR Code Preview</span>
                        <div className={styles.previewQr} onClick={() => setShowQrPreview(true)}>
                          <QRCodeSVG value={dynamicLink} size={40} />
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
              {wizardStep < 3 ? (
                <button 
                  type="button" 
                  className={styles.submitBtn} 
                  onClick={() => setWizardStep(wizardStep + 1)}
                  disabled={!newTouchpoint.title || !newTouchpoint.location}
                >
                  Continue to {wizardStep === 1 ? "Builder" : "Review"}
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

      {/* ... prev QR PREVIEW MODAL ... */}
      {showQrPreview && (
        <div className={styles.modalOverlay} onClick={() => setShowQrPreview(false)}>
          <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
            {/* ... prev qr preview code ... */}
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
