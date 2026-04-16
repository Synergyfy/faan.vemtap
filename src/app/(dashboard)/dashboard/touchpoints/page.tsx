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
import { useRole } from "@/context/RoleContext";
import { 
  useTouchpoints, 
  useCreateTouchpoint, 
  useUpdateTouchpoint, 
  useArchiveTouchpoint,
  useDownloadQr
} from "@/hooks/useTouchpoints";
import { useLocations } from "@/hooks/useLocations";
import { useDepartments } from "@/hooks/useDepartments";
import { TouchpointType, Touchpoint, Location, Department } from "@/types/api";

export default function TouchpointsPage() {
  const { currentRole, currentLocation, locationName: roleLocationName } = useRole();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [origin, setOrigin] = useState("");
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [currentTouchpoint, setCurrentTouchpoint] = useState<Touchpoint | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState("");
  const [tempLocId, setTempLocId] = useState("");

  // Queries
  const { data: tpData, isLoading: tpLoading } = useTouchpoints({
    locationId: (currentRole === 'LOCATION_ADMIN' ? currentLocation : (selectedLocId || undefined)) || undefined
  });

  // Fetch touchpoints to use as form templates (as per migration guide)
  const { data: formsData } = useTouchpoints();

  const { data: locationsData } = useLocations();
  const { data: deptsData } = useDepartments({ 
    locationId: currentRole === 'LOCATION_ADMIN' ? (currentLocation || undefined) : (selectedLocId || undefined) 
  });


  // Mutations
  const createMutation = useCreateTouchpoint();
  const updateMutation = useUpdateTouchpoint();
  const archiveMutation = useArchiveTouchpoint();
  const { mutate: downloadQr } = useDownloadQr();

  // Form Builder State
  const [newTouchpoint, setNewTouchpoint] = useState({
    title: "",
    location: "",
    departmentId: "",
    type: TouchpointType.FEEDBACK,
    templateId: ""
  });

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: newTouchpoint.title,
      description: "",
      type: newTouchpoint.type,
      departmentId: newTouchpoint.departmentId,
      locationId: currentRole === 'LOCATION_ADMIN' ? (currentLocation || "") : selectedLocId,
      formConfig: [] // Default empty form config
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setWizardStep(1);
        setNewTouchpoint({ title: "", location: "", departmentId: "", type: TouchpointType.FEEDBACK, templateId: "" });
      }
    });
  };

  const toggleStatus = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ 
      uuid: id, 
      data: { isActive: !currentStatus }
    });
  };

  const touchpoints = tpData?.data || [];
  const locations = locationsData?.data || [];
  const departments = deptsData?.data || [];
  const forms = formsData?.data || [];

  const getSelectedLocationName = () => {
    if (currentRole === 'LOCATION_ADMIN') return roleLocationName;
    return locations.find(l => l.id === selectedLocId)?.name || "Selected Location";
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
        <button className={styles.createButton} onClick={() => {
          if (currentRole === 'LOCATION_ADMIN' && currentLocation) {
            setSelectedLocId(currentLocation);
            setIsModalOpen(true);
            setWizardStep(1);
          } else {
            setShowLocationPicker(true);
          }
        }}>
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
            {touchpoints.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).map((tp) => (
              <tr key={tp.id}>
                <td>
                  <div className={styles.nameCell}>
                    <span className={styles.tpName}>{tp.title}</span>
                    <span className={styles.tpId}>ID: {tp.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                </td>
                <td>{tp.location?.name || tp.locationId}</td>
                <td>
                  <span className={`${styles.typeTag} ${styles[tp.type.toLowerCase()]}`}>
                    {tp.type}
                  </span>
                </td>
                <td>
                  <div className={styles.statusCell}>
                    <div className={`${styles.statusDot} ${tp.isActive ? styles.green : styles.gray}`} />
                    <span>{tp.isActive ? "ACTIVE" : "INACTIVE"}</span>
                  </div>
                </td>
                <td>{tp.interactions || 0}</td>
                <td className={styles.textRight}>
                  <div className={styles.actionButtons}>
                    <button className={styles.actionIcon} title="View QR" onClick={() => {
                       setCurrentTouchpoint(tp);
                       setShowQrPreview(true);
                    }}><QrCode size={18} /></button>
                    <button className={styles.actionIcon} title="Download" onClick={() => downloadQr(tp.id)}><Download size={18} /></button>
                    <button className={styles.actionIcon} title="Edit"><Edit size={18} /></button>
                    <button 
                      className={`${styles.actionIcon} ${styles.disableIcon} ${!tp.isActive ? styles.disabled : ""}`} 
                      title={tp.isActive ? "Disable" : "Enable"}
                      onClick={() => toggleStatus(tp.id, tp.isActive)}
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
                    <span style={{ color: "#166534", fontWeight: 500 }}>Creating touchpoint for: {getSelectedLocationName()}</span>
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
                        <span className={styles.fieldDesc}>The specific area within the {getSelectedLocationName()}.</span>
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
                          value={newTouchpoint.departmentId}
                          onChange={(e) => setNewTouchpoint({...newTouchpoint, departmentId: e.target.value})}
                        >
                          <option value="">Select Department</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
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
                          value={newTouchpoint.templateId}
                          onChange={(e) => {
                            const form = forms.find((f: Touchpoint) => f.id === e.target.value);
                            if (form) {
                              setNewTouchpoint({...newTouchpoint, templateId: form.id, type: form.type});
                            }
                          }}
                        >
                          <option value="">Select a Form</option>
                          {forms.map((form: Touchpoint) => (
                            <option key={form.id} value={form.id}>{form.title} ({form.type})</option>
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
                      <div className={styles.summaryItem}><strong>Department:</strong> {departments.find((d: Department) => d.id === newTouchpoint.departmentId)?.name}</div>
                      <div className={styles.summaryItem}><strong>Form:</strong> {forms.find((f: Touchpoint) => f.id === newTouchpoint.templateId)?.title || newTouchpoint.type}</div>
                    </div>
                    <div className={styles.previewGrid}>
                      <div className={styles.previewItem}>
                        <span className={styles.previewLabel}>Access Link (Live)</span>
                        <div className={styles.previewLink}>
                          <span>{origin}/p/{newTouchpoint.title.toLowerCase().replace(/\s+/g, '-')}</span>
                          <ExternalLink size={14} />
                        </div>
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
                  disabled={!newTouchpoint.title || !newTouchpoint.location || !newTouchpoint.departmentId || !newTouchpoint.type}
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
                  value={tempLocId}
                  onChange={(e) => setTempLocId(e.target.value)}
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
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setSelectedLocId(tempLocId);
                  setShowLocationPicker(false);
                  setIsModalOpen(true);
                  setWizardStep(1);
                }}
                disabled={!tempLocId}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: tempLocId ? "#2563eb" : "#94a3b8",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: tempLocId ? "pointer" : "not-allowed",
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
                  value={`${origin}/p/${currentTouchpoint?.uuid || 'sample'}`} 
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
                <p className={styles.qrLinkText}>{origin}/p/{currentTouchpoint?.uuid || 'sample'}</p>
                <span className={styles.qrScanHint}>Scan to test this touchpoint</span>
              </div>
            </div>
            <div className={styles.previewActions}>
              <button className={styles.downloadBtn} onClick={() => currentTouchpoint && downloadQr(currentTouchpoint.uuid)}>
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
