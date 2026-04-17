"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { 
  Plus, 
  Search, 
  MoreVertical, 
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
  Wifi,
  Building2,
  MousePointer2,
  CheckCircle,
  AlertCircle,
  Inbox,
  ChevronRight
} from "lucide-react";
import Image from "next/image";
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
  const [selectedLocId, setSelectedLocId] = useState("");
  const [tempLocId, setTempLocId] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const { data: tpData, isLoading: tpLoading } = useTouchpoints({
    locationId: (currentRole === 'LOCATION_ADMIN' ? currentLocation : (selectedLocId || undefined)) || undefined
  });

  const { data: formsData } = useTouchpoints();
  const { data: locationsData } = useLocations();
  const { data: deptsData } = useDepartments({ 
    locationId: currentRole === 'LOCATION_ADMIN' ? (currentLocation || undefined) : (selectedLocId || undefined) 
  });

  const createMutation = useCreateTouchpoint();
  const updateMutation = useUpdateTouchpoint();
  const archiveMutation = useArchiveTouchpoint();
  const { mutate: downloadQr } = useDownloadQr();

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
      formConfig: []
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

  const touchpoints = (tpData?.data || []) as Touchpoint[];
  const locations = (locationsData?.data || []) as Location[];
  const departments = (deptsData?.data || []) as Department[];
  const forms = (formsData?.data || []) as Touchpoint[];

  const getSelectedLocationName = () => {
    if (currentRole === 'LOCATION_ADMIN') return roleLocationName;
    return locations.find(l => l.id === selectedLocId)?.name || "Selected Location";
  };

  const generatedId = `tp-${Math.random().toString(36).substr(2, 6)}`;
  const dynamicLink = `${origin}/p/${generatedId}`;

  const filteredTouchpoints = touchpoints.filter(t => 
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
              if (currentRole === 'LOCATION_ADMIN' && currentLocation) {
                setSelectedLocId(currentLocation);
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
                Showing <strong>{filteredTouchpoints.length}</strong> of <strong>{touchpoints.length}</strong>
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
      ) : filteredTouchpoints.length === 0 ? (
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
                  if (currentRole === 'LOCATION_ADMIN' && currentLocation) {
                    setSelectedLocId(currentLocation);
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
        <div className={styles.deptGrid}>
          {filteredTouchpoints.map((tp) => {
            const accent = TOUCHPOINT_ACCENTS[hashToIndex(String(tp.id), TOUCHPOINT_ACCENTS.length)];
            const accentStyle = {
              "--accent-bg": accent.bg,
              "--accent-fg": accent.fg,
              "--accent-ring": accent.ring,
            } as CSSProperties;

            return (
              <div key={tp.id} className={styles.deptCard}>
                <div className={styles.deptCardHeader}>
                  <div className={styles.deptIconBox} style={accentStyle} aria-hidden="true">
                    <QrCode size={24} />
                  </div>
                  <div className={styles.cardMenuWrapper}>
                    <button
                      className={styles.cardMore}
                      aria-label={`Actions for ${tp.title}`}
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
                            setCurrentTouchpoint(tp);
                            setShowQrPreview(true);
                            setActiveDropdown(null);
                          }}
                        >
                          <QrCode size={14} /> View QR Code
                        </button>
                        <button
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadQr(tp.uuid);
                            setActiveDropdown(null);
                          }}
                        >
                          <Download size={14} /> Download QR
                        </button>
                        <div className={styles.dropdownSeparator} />
                        <button
                          className={`${styles.dropdownItem} ${styles.danger}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(tp.id, tp.isActive);
                            setActiveDropdown(null);
                          }}
                        >
                          <Power size={14} /> {tp.isActive ? 'Disable' : 'Enable'}
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
                    <span>{typeof tp.location === 'string' ? tp.location : (tp.location as any)?.name || 'Unknown'}</span>
                  </div>
                </div>

                <div className={styles.deptCardMetrics}>
                  <div 
                    className={styles.deptMetric}
                    style={{ 
                      background: tp.isActive ? '#dcfce7' : '#f1f5f9', 
                      color: tp.isActive ? '#16a34a' : '#64748b' 
                    }}
                  >
                    <CheckCircle size={14} />
                    <span>{tp.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className={styles.deptMetric}>
                    <MousePointer2 size={14} />
                    <span>{tp.interactions || 0} Interactions</span>
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
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
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
                        value={newTouchpoint.location}
                        onChange={(e) => setNewTouchpoint({...newTouchpoint, location: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <div className={styles.labelGroup}>
                        <label className={styles.formLabel}>Department *</label>
                        <span className={styles.fieldDesc}>Responsible team</span>
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
                        <label className={styles.formLabel}>Form Type</label>
                        <span className={styles.fieldDesc}>Pre-built form template</span>
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

              {wizardStep === 2 && (
                <div className={styles.modalForm}>
                  <div className={styles.generatedSection}>
                    <div className={styles.sectionHeaderGroup}>
                      <h4 className={styles.sectionHeader}>Final Review</h4>
                      <p className={styles.sectionDesc}>Confirm details and generate assets</p>
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
                  disabled={!newTouchpoint.title || !newTouchpoint.location || !newTouchpoint.departmentId}
                  style={{ opacity: (!newTouchpoint.title || !newTouchpoint.location || !newTouchpoint.departmentId) ? 0.5 : 1 }}
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
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.wizardBadge}>Location</span>
                <h3 className={styles.modalTitle}>Select Airport</h3>
                <p className={styles.modalSubtitle}>Choose location for this touchpoint</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowLocationPicker(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: "16px", color: "#64748b", fontSize: "14px" }}>
                Select the airport location where you want to create a touchpoint.
              </p>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#334155", fontSize: '13px' }}>
                  Airport Location
                </label>
                <select
                  value={tempLocId}
                  onChange={(e) => setTempLocId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "14px",
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
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowLocationPicker(false)}>Cancel</button>
              <button
                onClick={() => {
                  setSelectedLocId(tempLocId);
                  setShowLocationPicker(false);
                  setIsModalOpen(true);
                  setWizardStep(1);
                }}
                disabled={!tempLocId}
                className={styles.createButton}
                style={{ opacity: tempLocId ? 1 : 0.5 }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrPreview && currentTouchpoint && (
        <div className={styles.modalOverlay} onClick={() => setShowQrPreview(false)}>
          <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.previewTitle}>QR Code Preview</h3>
                <p className={styles.modalSubtitle}>{currentTouchpoint.title}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowQrPreview(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.fullQrWrapper}>
              <div className={styles.qrBackground}>
                <QRCodeSVG 
                  value={`${origin}/p/${currentTouchpoint.uuid || 'sample'}`} 
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
                <p className={styles.qrLinkText}>{origin}/p/{currentTouchpoint.uuid || 'sample'}</p>
                <span className={styles.qrScanHint}>Scan to test this touchpoint</span>
              </div>
            </div>
            <div className={styles.previewActions}>
              <button className={styles.downloadBtn} onClick={() => downloadQr(currentTouchpoint.uuid)}>
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