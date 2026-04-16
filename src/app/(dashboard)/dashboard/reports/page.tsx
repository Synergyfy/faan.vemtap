"use client";

import { useState, useMemo } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Download,
  Calendar,
  MapPin,
  Shield,
  MoreVertical,
  X,
  Trash2,
  User,
  FileStack,
  CheckCircle2,
  ChevronRight,
  Type,
  List,
  LayoutTemplate,
  Wrench
} from "lucide-react";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { UserRole } from "@/types/rbac";
import { 
  InternalReport, 
  ReportType, 
  InternalReportStatus, 
  Location as ApiLocation, 
  Department, 
  ReportTemplate, 
  ReportTemplateField 
} from "@/types/api";

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: Type },
  { value: 'number', label: 'Number', icon: Wrench },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'dropdown', label: 'Dropdown', icon: List },
  { value: 'textarea', label: 'Text Area', icon: FileText },
];

import { 
  useReports, 
  useCreateReport, 
  useReportTemplates, 
  useCreateReportTemplate,
  useDeleteReportTemplate
} from "@/hooks/useReports";
import { useLocations } from "@/hooks/useLocations";
import { useDepartments } from "@/hooks/useDepartments";

export default function ReportsPage() {
  const { currentRole, currentLocation, locationName: roleLocationName, availableDepartments } = useRole();
  const [activeView, setActiveView] = useState<'reports' | 'templates'>('reports');
  const [selectedReport, setSelectedReport] = useState<InternalReport | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [isSubmitReportOpen, setIsSubmitReportOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Queries
  const { data: reportsData } = useReports({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    departmentId: filterDepartment !== 'all' ? filterDepartment : undefined,
    from: filterDateFrom || undefined,
    to: filterDateTo || undefined,
  });
  const { data: templatesData } = useReportTemplates();
  const { data: locationsData } = useLocations();

  // Mutations
  const createReportMutation = useCreateReport();
  const createTemplateMutation = useCreateReportTemplate();
  const deleteTemplateMutation = useDeleteReportTemplate();

  const reports = reportsData?.data || [];
  const templates = (templatesData?.data || []) as ReportTemplate[];
  const locations = (locationsData?.data || []) as ApiLocation[];

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    locationId: currentLocation || '',
    departmentId: '',
    fields: [] as ReportTemplateField[],
  });

  const previewLocationName = useMemo(() => 
    locations.find((l: ApiLocation) => (l as any).id === newTemplate.locationId)?.name || 'Unknown Location',
    [locations, newTemplate.locationId]
  );

  const previewDepartmentName = useMemo(() => {
    const loc = locations.find((l: ApiLocation) => (l as any).id === newTemplate.locationId);
    const depts = (loc as any)?.departments || [];
    return depts.find((d: Department) => d.id === newTemplate.departmentId)?.name || 'General Department';
  }, [locations, newTemplate.locationId, newTemplate.departmentId]);

  const [newReport, setNewReport] = useState({
    templateId: '',
    templateName: '',
    title: '',
    fieldValues: {} as Record<string, any>,
  });

  const selectedTemplate = useMemo(() => 
    templates.find(t => t.uuid === newReport.templateId || t.id === newReport.templateId),
    [templates, newReport.templateId]
  );

  const handleLocationChange = (locationId: string) => {
    setNewTemplate(prev => ({
      ...prev,
      locationId,
      departmentId: '', // Reset department when location changes
    }));
  };

  const handleAddField = (type: string) => {
    const newField = {
      id: `field-${Date.now()}`,
      type: type as ReportTemplateField['type'],
      label: 'New Field',
      required: false,
      options: type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined,
    };
    setNewTemplate({ ...newTemplate, fields: [...newTemplate.fields, newField] });
  };

  const handleUpdateField = (fieldId: string, updates: Partial<ReportTemplateField>) => {
    setNewTemplate({
      ...newTemplate,
      fields: newTemplate.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    });
  };

  const handleRemoveField = (fieldId: string) => {
    setNewTemplate({
      ...newTemplate,
      fields: newTemplate.fields.filter(f => f.id !== fieldId)
    });
  };

  const handleCreateTemplate = () => {
    createTemplateMutation.mutate({
      name: newTemplate.name,
      locationId: newTemplate.locationId,
      departmentId: newTemplate.departmentId,
      fields: newTemplate.fields,
    }, {
      onSuccess: () => {
        setIsCreateTemplateOpen(false);
        setWizardStep(1);
        setNewTemplate({ name: '', locationId: currentLocation || '', departmentId: '', fields: [] });
      }
    });
  };

  const handleSubmitReport = () => {
    createReportMutation.mutate({
      templateId: newReport.templateId,
      title: newReport.title,
      fieldValues: newReport.fieldValues,
    }, {
      onSuccess: () => {
        setIsSubmitReportOpen(false);
        setNewReport({ templateId: '', templateName: '', title: '', fieldValues: {} });
      }
    });
  };

  const handleDeleteReport = (id: string) => {
    // Note: API deletion for reports not yet implemented in hooks
    if (selectedReport?.id === id || selectedReport?.uuid === id) setSelectedReport(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return { bg: '#f1f5f9', color: '#64748b' };
      case 'submitted': return { bg: '#fef3c7', color: '#92400e' };
      case 'reviewed': return { bg: '#dcfce7', color: '#15803d' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const filteredReports = reports.filter(report => {
    const r = report as InternalReport;
    if (searchTerm && !r.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus !== 'all' && r.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (currentRole === 'LOCATION_ADMIN') {
      const deptId = typeof r.department === 'object' ? (r.department as any)?.id : r.department;
      if (filterDepartment !== 'all' && deptId !== filterDepartment) return false;
      if (filterDateFrom && new Date(r.date || (r as any).createdAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(r.date || (r as any).createdAt) > new Date(filterDateTo)) return false;
    }
    return true;
  });

  const locationDepartments = useMemo(() => {
    if (!newTemplate.locationId) return [];
    const loc = locations.find((l: ApiLocation) => (l as any).id === newTemplate.locationId);
    return (loc as any)?.departments || [];
  }, [newTemplate.locationId, locations]);


  return (
    <div className={styles.touchpointsLayout}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Internal Reports</h2>
          <p className={styles.pageSubtitle}>Create templates and submit department reports.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.filterButton}>
            <Download size={18} /><span>Export</span>
          </button>
          {activeView === 'templates' && (
            <button className={styles.createButton} onClick={() => setIsCreateTemplateOpen(true)}>
              <Plus size={18} /><span>Create Template</span>
            </button>
          )}
          {activeView === 'reports' && (
            <button className={styles.createButton} onClick={() => setIsSubmitReportOpen(true)}>
              <Plus size={18} /><span>Submit Report</span>
            </button>
          )}
        </div>
      </div>

      <div className={styles.tabsContainer} style={{ padding: 0, marginBottom: '24px' }}>
        <button 
          className={`${styles.tabLink} ${activeView === 'reports' ? styles.tabLinkActive : ''}`}
          onClick={() => setActiveView('reports')}
        >
          <FileText size={18} /> Reports ({filteredReports.length})
        </button>
        <button 
          className={`${styles.tabLink} ${activeView === 'templates' ? styles.tabLinkActive : ''}`}
          onClick={() => setActiveView('templates')}
        >
          <LayoutTemplate size={18} /> Templates ({templates.length})
        </button>
      </div>

      <div className={styles.tableControls}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder={activeView === 'reports' ? "Search reports..." : "Search templates..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {activeView === 'reports' && (
          <div className={styles.filterGroup} style={{ display: 'flex', flexDirection: 'row', gap: '8px', flexWrap: 'wrap' }}>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterButton}
              style={{ width: 'auto' }}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
            </select>
            {currentRole === 'LOCATION_ADMIN' && (
              <>
                <select 
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className={styles.filterButton}
                  style={{ width: 'auto' }}
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <input 
                  type="date" 
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className={styles.filterButton}
                  style={{ width: 'auto', padding: '8px 12px' }}
                  placeholder="From Date"
                />
                <input 
                  type="date" 
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className={styles.filterButton}
                  style={{ width: 'auto', padding: '8px 12px' }}
                  placeholder="To Date"
                />
              </>
            )}
          </div>
        )}
      </div>

      {activeView === 'reports' && (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Template</th>
                <th>Title</th>
                <th>Location</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
                <th className={styles.textRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const statusStyle = getStatusColor(report.status);
                const loc = typeof report.location === 'object' ? report.location : { name: report.location };
                const dept = typeof report.department === 'object' ? report.department : { name: report.department };
                
                return (
                  <tr key={report.uuid || report.id} className={styles.clickableRow} onClick={() => setSelectedReport(report)}>
                    <td><span className={styles.tpName}>{report.id}</span></td>
                    <td><span className={styles.typeTag} style={{ background: '#e0e7ff', color: '#4338ca' }}>{report.templateName || 'Internal'}</span></td>
                    <td><span className={styles.tpName}>{report.title}</span></td>
                    <td><div className={styles.deptCell}><MapPin size={14} className={styles.deptIcon} /><span>{(loc as any)?.name || 'Unknown'}</span></div></td>
                    <td><div className={styles.deptCell}><Shield size={14} className={styles.deptIcon} /><span>{(dept as any)?.name || 'General'}</span></div></td>
                    <td><div className={styles.timeCell}><Calendar size={14} /><span>{new Date((report as any).createdAt).toLocaleDateString()}</span></div></td>
                    <td><span className={styles.statusBadge} style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>{report.status}</span></td>
                    <td className={styles.textRight}><button className={styles.viewLink}>View <MoreVertical size={16} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeView === 'templates' && (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Location</th>
                <th>Department</th>
                <th>Fields</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {templates.filter(t => !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((template) => (
                <tr key={template.id}>
                  <td><span className={styles.tpName}>{template.name}</span></td>
                  <td><div className={styles.deptCell}><MapPin size={14} className={styles.deptIcon} /><span>{template.locationName}</span></div></td>
                  <td><div className={styles.deptCell}><Shield size={14} className={styles.deptIcon} /><span>{template.departmentName}</span></div></td>
                  <td><span>{template.fields.length} fields</span></td>
                  <td><div className={styles.timeCell}><Calendar size={14} /><span>{template.createdAt}</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateTemplateOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '1200px', width: '96%', maxHeight: '92vh' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Create Report Template</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Step {wizardStep} of 3</p>
              </div>
              <button className={styles.closeBtn} onClick={() => { setIsCreateTemplateOpen(false); setWizardStep(1); }}><X size={20} /></button>
            </div>

            <div className={styles.wizardProgress}>
              <div className={`${styles.progressStep} ${wizardStep >= 1 ? styles.active : ''}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 2 ? styles.active : ''}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 3 ? styles.active : ''}`} />
            </div>

            <div className={styles.modalBody} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '0', minHeight: '520px', padding: '0' }}>
              <div style={{ padding: '32px', borderRight: '1px solid #e2e8f0', overflow: 'auto' }}>
                {wizardStep === 1 && (
                  <div>
                    <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Template Details</h4>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Give your report template a name</p>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Template Name *</label>
                      <div className={styles.modalInputWrapper}>
                        <LayoutTemplate size={18} />
                        <input type="text" placeholder="e.g. Daily Operations Report" value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div>
                    <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Assignment</h4>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Select location and department</p>
                    <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                      <label className={styles.formLabel}>Location *</label>
                      <div className={styles.modalInputWrapper}>
                        <MapPin size={18} />
                        <select value={newTemplate.locationId} onChange={(e) => handleLocationChange(e.target.value)}>
                          <option value="">Select Location</option>
                          {locations.map(loc => (<option key={(loc as any).id} value={(loc as any).id}>{(loc as any).name}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Department *</label>
                      <div className={styles.modalInputWrapper}>
                        <Shield size={18} />
                        <select 
                          value={newTemplate.departmentId} 
                          onChange={(e) => setNewTemplate({ ...newTemplate, departmentId: e.target.value })}
                        >
                          <option value="">Select Department</option>
                          {locationDepartments?.map((dept: Department) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div>
                        <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Build Fields</h4>
                        <p style={{ fontSize: '14px', color: '#64748b' }}>Add fields ({newTemplate.fields.length} added)</p>
                      </div>
                      <button className={styles.createButton} onClick={() => handleAddField('text')}><Plus size={16} /> Add Field</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                      {FIELD_TYPES.map(ft => { const Icon = ft.icon; return (<button key={ft.value} onClick={() => handleAddField(ft.value as ReportTemplateField['type'])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontSize: '13px', fontWeight: 500, color: '#475569', cursor: 'pointer' }}><Icon size={14} /> {ft.label}</button>); })}
                    </div>
                    {newTemplate.fields.length === 0 ? (
                      <div className={styles.emptyStage} style={{ height: '180px', background: '#f8fafc', border: '2px dashed #e2e8f0' }}>
                        <FileStack size={40} style={{ color: '#cbd5e1' }} />
                        <p style={{ fontWeight: 600, color: '#64748b', marginTop: '12px' }}>No fields added yet</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Click a field type above to start building</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {newTemplate.fields.map((field, index) => (
                          <div key={field.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--brand-green-light)', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>{index + 1}</span>
                              <select value={field.type} onChange={(e) => handleUpdateField(field.id, { type: e.target.value as ReportTemplateField['type'] })} style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                {FIELD_TYPES.map(ft => (<option key={ft.value} value={ft.value}>{ft.label}</option>))}
                              </select>
                              <button onClick={() => handleRemoveField(field.id)} style={{ marginLeft: 'auto', padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                            <input type="text" placeholder="Field label" value={field.label} onChange={(e) => handleUpdateField(field.id, { label: e.target.value })} style={{ width: '100%', fontSize: '14px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                <input type="checkbox" checked={field.required} onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })} /> Required
                              </label>
                              {field.type === 'dropdown' && (
                                <input type="text" placeholder="Options: A, B, C" value={field.options?.join(', ') || ''} onChange={(e) => handleUpdateField(field.id, { options: e.target.value.split(',').map(o => o.trim()).filter(o => o) })} style={{ flex: 1, fontSize: '12px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>📱 Live Preview</div>
                <div style={{ width: '280px', height: '520px', background: '#000', borderRadius: '44px', padding: '10px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                  <div style={{ width: '90px', height: '28px', background: '#000', borderRadius: '16px', position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }} />
                  <div style={{ height: '100%', background: '#fff', borderRadius: '34px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '46px', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}><span>9:41</span><div style={{ display: 'flex', gap: '4px' }}><div style={{ width: '16px', height: '10px', background: '#1e293b', borderRadius: '2px' }} /><div style={{ width: '14px', height: '10px', background: '#1e293b', borderRadius: '2px' }} /></div></div>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{newTemplate.name || 'Untitled Report'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{previewLocationName.split(' ')[0]} • {previewDepartmentName.split(' ')[0]}</div>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
                      {newTemplate.fields.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94a3b8' }}><FileStack size={32} /><p style={{ fontSize: '12px', marginTop: '8px' }}>No fields yet</p></div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {newTemplate.fields.slice(0, 4).map(field => (
                            <div key={field.id}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{field.label || 'Field'} {field.required && <span style={{ color: '#ef4444' }}>*</span>}</div>
                              {field.type === 'text' && <input disabled placeholder="Enter text..." style={{ height: '36px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0 12px', fontSize: '13px' }} />}
                              {field.type === 'number' && <input disabled type="number" placeholder="0" style={{ height: '36px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0 12px', fontSize: '13px' }} />}
                              {field.type === 'textarea' && <textarea disabled placeholder="Enter details..." style={{ height: '60px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', resize: 'none' }} />}
                              {field.type === 'dropdown' && <div style={{ height: '36px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: '12px', color: '#9ca3af' }}>Select option <ChevronRight size={14} /></div>}
                              {field.type === 'date' && <div style={{ height: '36px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '12px', color: '#9ca3af' }}><Calendar size={14} style={{ marginRight: '8px' }} />Pick a date</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ background: 'var(--brand-green)', color: 'white', padding: '14px', borderRadius: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>Submit Report</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              {wizardStep > 1 && <button className={styles.cancelBtn} onClick={() => setWizardStep(wizardStep - 1)} style={{ marginRight: 'auto' }}><ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back</button>}
              {wizardStep === 1 && <div />}
              <button className={styles.cancelBtn} onClick={() => { setIsCreateTemplateOpen(false); setWizardStep(1); }}>Cancel</button>
              {wizardStep < 3 ? (
                <button className={styles.createButton} onClick={() => setWizardStep(wizardStep + 1)} disabled={wizardStep === 1 && !newTemplate.name} style={{ opacity: wizardStep === 1 && !newTemplate.name ? 0.5 : 1 }}>Next <ChevronRight size={16} /></button>
              ) : (
                <button className={styles.createButton} onClick={handleCreateTemplate} disabled={newTemplate.fields.length === 0} style={{ opacity: newTemplate.fields.length === 0 ? 0.5 : 1 }}><CheckCircle2 size={18} /> Save Template</button>
              )}
            </div>
          </div>
        </div>
      )}

      {isSubmitReportOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Submit Internal Report</h3>
              <button className={styles.closeBtn} onClick={() => setIsSubmitReportOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                <label className={styles.formLabel}>Select Template *</label>
                <div className={styles.modalInputWrapper}>
                  <LayoutTemplate size={18} />
                  <select value={newReport.templateId} onChange={(e) => { 
                    const t = templates.find(t => t.uuid === e.target.value || t.id === e.target.value); 
                    setNewReport({ 
                      ...newReport, 
                      templateId: e.target.value, 
                      templateName: t?.name || '',
                    }); 
                  }}>
                    <option value="">Select a template</option>
                    {templates.map(t => (<option key={t.uuid || t.id} value={t.uuid || t.id}>{t.name}</option>))}
                  </select>
                </div>
              </div>
              {newReport.templateId && (
                <>
                  <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                    <label className={styles.formLabel}>Report Title *</label>
                    <div className={styles.modalInputWrapper}>
                      <FileText size={18} />
                      <input type="text" placeholder="Brief title" value={newReport.title} onChange={(e) => setNewReport({ ...newReport, title: e.target.value })} />
                    </div>
                  </div>
                  {selectedTemplate?.fields.map((field: ReportTemplateField) => (
                    <div key={field.id} className={styles.formGroup} style={{ marginTop: '12px' }}>
                      <label className={styles.formLabel}>{field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                      {field.type === 'text' && <div className={styles.modalInputWrapper}><Type size={18} /><input type="text" value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} /></div>}
                      {field.type === 'number' && <div className={styles.modalInputWrapper}><Wrench size={18} /><input type="number" value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} /></div>}
                      {field.type === 'date' && <div className={styles.modalInputWrapper}><Calendar size={18} /><input type="date" value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} /></div>}
                      {field.type === 'dropdown' && <div className={styles.modalInputWrapper}><List size={18} /><select value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required}><option value="">Select</option>{field.options?.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}</select></div>}
                      {field.type === 'textarea' && <textarea placeholder={field.label} value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} className={styles.modalTextarea} style={{ height: '80px', marginTop: '8px' }} />}
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setIsSubmitReportOpen(false)}>Cancel</button>
              <button className={styles.createButton} onClick={handleSubmitReport} disabled={!newReport.templateId || !newReport.title}><CheckCircle2 size={18} /> Submit Report</button>
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.detailModal}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.idBadge}>{selectedReport.id}</span>
                <span className={styles.typeTag} style={{ background: '#e0e7ff', color: '#4338ca' }}>{selectedReport.templateName}</span>
                <h3 className={styles.modalTitle}>{selectedReport.title}</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedReport(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailMain}>
                  <section className={styles.messageSection}>
                    <h4 className={styles.detailLabel}>Report Data</h4>
                    <div className={styles.messageCard}>
                      {Object.entries(selectedReport.fieldValues || {}).map(([key, value]) => (<div key={key} style={{ padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}><div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{key}</div><div style={{ fontSize: '14px', color: '#1e293b' }}>{typeof value === 'object' ? JSON.stringify(value) : String(value) || '-'}</div></div>))}
                    </div>
                  </section>
                  <div className={styles.infoCards}>
                    <div className={styles.infoCard}><MapPin size={18} /><div><span>Location</span><strong>{selectedReport.locationName}</strong></div></div>
                    <div className={styles.infoCard}><Shield size={18} /><div><span>Department</span><strong>{selectedReport.departmentName}</strong></div></div>
                    <div className={styles.infoCard}><User size={18} /><div><span>Reported By</span><strong>{selectedReport.reportedBy}</strong></div></div>
                    <div className={styles.infoCard}><Calendar size={18} /><div><span>Date</span><strong>{selectedReport.date}</strong></div></div>
                  </div>
                </div>
                <div className={styles.detailSidebar}>
                  <div className={styles.actionGroup}>
                    <h4 className={styles.detailLabel}>Status</h4>
                    <select value={selectedReport.status} onChange={(e) => { setSelectedReport({...selectedReport, status: e.target.value as InternalReport['status']}); }} className={styles.modalInputWrapper}>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="reviewed">Reviewed</option>
                    </select>
                  </div>
                  <div className={styles.dangerZone}>
                    <button className={styles.archiveBtn} onClick={() => handleDeleteReport(selectedReport.id)}><Trash2 size={16} /> Delete Report</button>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}