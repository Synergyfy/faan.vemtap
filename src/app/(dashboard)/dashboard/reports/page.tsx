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
import { MOCK_LOCATIONS } from "@/data/mockLocations";
import { getDepartmentsByLocation } from "@/data/mockDepartments";

interface ReportTemplateField {
  id: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  locationId: string;
  locationName: string;
  departmentId: string;
  departmentName: string;
  fields: ReportTemplateField[];
  createdAt: string;
}

interface InternalReport {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  locationId: string;
  locationName: string;
  departmentId: string;
  departmentName: string;
  reportedBy: string;
  date: string;
  fieldValues: Record<string, any>;
  status: 'draft' | 'submitted' | 'reviewed';
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: Type },
  { value: 'number', label: 'Number', icon: Wrench },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'dropdown', label: 'Dropdown', icon: List },
  { value: 'textarea', label: 'Text Area', icon: FileText },
];

const MOCK_REPORTS: InternalReport[] = [
  {
    id: 'RPT-001',
    templateId: 'TPL-001',
    templateName: 'Daily Operations Report',
    title: 'Terminal 2 Conveyor Belt Issue',
    locationId: 'abuja',
    locationName: 'Abuja International Airport',
    departmentId: 'facilities',
    departmentName: 'Facilities & Assets',
    reportedBy: 'John Okafor',
    date: '2024-04-14',
    fieldValues: { 'Report Date': '2024-04-14', 'Shift': 'Morning', 'Flights Handled': '45', 'Incidents Noted': 'Baggage carousel malfunction' },
    status: 'submitted'
  },
];

const INITIAL_TEMPLATES: ReportTemplate[] = [
  {
    id: 'TPL-001',
    name: 'Daily Operations Report',
    locationId: 'abuja',
    locationName: 'Abuja International Airport',
    departmentId: 'operations',
    departmentName: 'Operations Control',
    fields: [
      { id: 'f1', type: 'date', label: 'Report Date', required: true },
      { id: 'f2', type: 'dropdown', label: 'Shift', required: true, options: ['Morning', 'Afternoon', 'Night'] },
      { id: 'f3', type: 'number', label: 'Flights Handled', required: false },
      { id: 'f4', type: 'textarea', label: 'Incidents Noted', required: false },
    ],
    createdAt: '2024-04-01'
  },
];

export default function ReportsPage() {
  const { currentRole, currentLocation, locationName, hasAccessToLocation, hasAccessToDepartment } = useRole();
  
  const [reports, setReports] = useState<InternalReport[]>(MOCK_REPORTS);
  const [templates, setTemplates] = useState<ReportTemplate[]>(INITIAL_TEMPLATES);
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

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    locationId: currentLocation || 'abuja',
    locationName: locationName || 'Abuja International Airport',
    departmentId: 'operations',
    departmentName: 'Operations Control',
    fields: [] as ReportTemplateField[],
  });

  const [newReport, setNewReport] = useState({
    templateId: '',
    templateName: '',
    title: '',
    locationId: currentLocation || 'abuja',
    locationName: locationName || 'Abuja International Airport',
    departmentId: 'operations',
    departmentName: 'Operations Control',
    fieldValues: {} as Record<string, any>,
  });

  const handleLocationChange = (locationId: string) => {
    const location = MOCK_LOCATIONS.find(l => l.id === locationId);
    const depts = getDepartmentsByLocation(locationId);
    setNewTemplate(prev => ({
      ...prev,
      locationId,
      locationName: location?.name || '',
      departmentId: depts[0]?.id || '',
      departmentName: depts[0]?.name || '',
    }));
  };

  const handleAddField = (type: ReportTemplateField['type']) => {
    const newField: ReportTemplateField = {
      id: `field-${Date.now()}`,
      type,
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
    const template: ReportTemplate = {
      id: `TPL-${String(templates.length + 1).padStart(3, '0')}`,
      ...newTemplate,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTemplates([template, ...templates]);
    setIsCreateTemplateOpen(false);
    setWizardStep(1);
    setNewTemplate({
      name: '',
      locationId: currentLocation || 'abuja',
      locationName: locationName || 'Abuja International Airport',
      departmentId: 'operations',
      departmentName: 'Operations Control',
      fields: [],
    });
  };

  const handleSubmitReport = () => {
    const template = templates.find(t => t.id === newReport.templateId);
    if (!template) return;

    const report: InternalReport = {
      id: `RPT-${String(reports.length + 1).padStart(3, '0')}`,
      templateId: newReport.templateId,
      templateName: newReport.templateName,
      title: newReport.title,
      locationId: newReport.locationId,
      locationName: newReport.locationName,
      departmentId: newReport.departmentId,
      departmentName: newReport.departmentName,
      reportedBy: 'Current User',
      date: new Date().toISOString().split('T')[0],
      fieldValues: newReport.fieldValues,
      status: 'submitted',
    };
    setReports([report, ...reports]);
    setIsSubmitReportOpen(false);
    setNewReport({
      templateId: '',
      templateName: '',
      title: '',
      locationId: currentLocation || 'abuja',
      locationName: locationName || 'Abuja International Airport',
      departmentId: 'operations',
      departmentName: 'Operations Control',
      fieldValues: {},
    });
  };

  const handleDeleteReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
    if (selectedReport?.id === id) setSelectedReport(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return { bg: '#f1f5f9', color: '#64748b' };
      case 'submitted': return { bg: '#fef3c7', color: '#92400e' };
      case 'reviewed': return { bg: '#dcfce7', color: '#15803d' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const filteredReports = reports.filter(report => {
    if (searchTerm && !report.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (currentRole === 'LOCATION_ADMIN') {
      if (filterDepartment !== 'all' && report.departmentId !== filterDepartment) return false;
      if (filterDateFrom && new Date(report.date) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(report.date) > new Date(filterDateTo)) return false;
    }
    return true;
  });

  const selectedTemplate = templates.find(t => t.id === newReport.templateId);

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
                  <option value="operations">Operations</option>
                  <option value="security">Security</option>
                  <option value="facilities">Facilities</option>
                  <option value="customer-service">Customer Service</option>
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
                return (
                  <tr key={report.id} className={styles.clickableRow} onClick={() => setSelectedReport(report)}>
                    <td><span className={styles.tpName}>{report.id}</span></td>
                    <td><span className={styles.typeTag} style={{ background: '#e0e7ff', color: '#4338ca' }}>{report.templateName}</span></td>
                    <td><span className={styles.tpName}>{report.title}</span></td>
                    <td><div className={styles.deptCell}><MapPin size={14} className={styles.deptIcon} /><span>{report.locationName}</span></div></td>
                    <td><div className={styles.deptCell}><Shield size={14} className={styles.deptIcon} /><span>{report.departmentName}</span></div></td>
                    <td><div className={styles.timeCell}><Calendar size={14} /><span>{report.date}</span></div></td>
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
                          {MOCK_LOCATIONS.map(loc => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Department *</label>
                      <div className={styles.modalInputWrapper}>
                        <Shield size={18} />
                        <select value={newTemplate.departmentId} onChange={(e) => { const dept = getDepartmentsByLocation(newTemplate.locationId).find(d => d.id === e.target.value); setNewTemplate({ ...newTemplate, departmentId: e.target.value, departmentName: dept?.name || '' }); }}>
                          {getDepartmentsByLocation(newTemplate.locationId).map(dept => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
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
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{newTemplate.locationName.split(' ')[0]} • {newTemplate.departmentName.split(' ')[0]}</div>
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
                  <select value={newReport.templateId} onChange={(e) => { const t = templates.find(t => t.id === e.target.value); setNewReport({ ...newReport, templateId: e.target.value, templateName: t?.name || '', locationId: t?.locationId || '', locationName: t?.locationName || '', departmentId: t?.departmentId || '', departmentName: t?.departmentName || '' }); }}>
                    <option value="">Select a template</option>
                    {templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
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
                  {selectedTemplate?.fields.map(field => (
                    <div key={field.id} className={styles.formGroup} style={{ marginTop: '12px' }}>
                      <label className={styles.formLabel}>{field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                      {field.type === 'text' && <div className={styles.modalInputWrapper}><Type size={18} /><input type="text" value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} /></div>}
                      {field.type === 'number' && <div className={styles.modalInputWrapper}><Wrench size={18} /><input type="number" value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} /></div>}
                      {field.type === 'date' && <div className={styles.modalInputWrapper}><Calendar size={18} /><input type="date" value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required} /></div>}
                      {field.type === 'dropdown' && <div className={styles.modalInputWrapper}><List size={18} /><select value={newReport.fieldValues[field.label] || ''} onChange={(e) => setNewReport({ ...newReport, fieldValues: { ...newReport.fieldValues, [field.label]: e.target.value } })} required={field.required}><option value="">Select</option>{field.options?.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></div>}
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
                      {Object.entries(selectedReport.fieldValues).map(([key, value]) => (<div key={key} style={{ padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}><div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{key}</div><div style={{ fontSize: '14px', color: '#1e293b' }}>{value || '-'}</div></div>))}
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
                    <select value={selectedReport.status} onChange={(e) => { setReports(reports.map(r => r.id === selectedReport.id ? {...r, status: e.target.value as InternalReport['status']} : r)); setSelectedReport({...selectedReport, status: e.target.value as InternalReport['status']}); }} className={styles.modalInputWrapper}>
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