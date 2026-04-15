"use client";

import { useState } from "react";
import { 
  FileStack, 
  Plus, 
  Search, 
  Filter,
  Download,
  Trash2,
  Edit,
  Copy,
  Eye,
  ToggleLeft,
  ToggleRight,
  X,
  CheckCircle2,
  Link2,
  FileText,
  Type,
  List,
  Upload,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Star,
  Phone
} from "lucide-react";
import styles from "../../Dashboard.module.css";
import { useRole } from "@/context/RoleContext";
import { UserRole } from "@/types/rbac";
import { MOCK_LOCATIONS } from "@/data/mockLocations";
import { MOCK_DEPARTMENTS, getDepartmentsByLocation } from "@/data/mockDepartments";

interface FormField {
  id: string;
  type: 'text' | 'dropdown' | 'file' | 'date' | 'rating' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  name: string;
  type: 'passenger';
  locationId: string;
  locationName: string;
  departmentId: string;
  departmentName: string;
  fields: FormField[];
  allowAnonymous: boolean;
  successMessage: string;
  createdAt: string;
  submissions: number;
}

const INITIAL_FORMS: Form[] = [
  {
    id: "form-001",
    name: "Passenger Feedback",
    type: "passenger",
    locationId: "abuja",
    locationName: "Abuja International Airport",
    departmentId: "customer-service",
    departmentName: "Customer Service",
    fields: [
      { id: "f1", type: "rating", label: "How would you rate your experience?", required: true },
      { id: "f2", type: "text", label: "What did you like most?", required: false },
      { id: "f3", type: "textarea", label: "Any additional comments?", required: false },
    ],
    allowAnonymous: true,
    successMessage: "Thank you for your feedback!",
    createdAt: "2024-04-01",
    submissions: 342
  },
  {
    id: "form-002",
    name: "Airport Cleanliness Survey",
    type: "passenger",
    locationId: "lagos",
    locationName: "Lagos Murtala Muhammed",
    departmentId: "facilities",
    departmentName: "Facilities & Assets",
    fields: [
      { id: "f1", type: "rating", label: "Cleanliness Rating", required: true },
      { id: "f2", type: "dropdown", label: "Area", required: true, options: ["Restroom", "Lounge", "Food Court", "Gate Area"] },
      { id: "f3", type: "text", label: "Suggestions", required: false },
    ],
    allowAnonymous: true,
    successMessage: "Thank you for helping us improve!",
    createdAt: "2024-04-10",
    submissions: 156
  }
];

const FIELD_TYPES = [
  { value: 'rating', label: '⭐ Rating', icon: Star },
  { value: 'text', label: 'Text Input', icon: Type },
  { value: 'textarea', label: 'Long Text', icon: FileText },
  { value: 'dropdown', label: 'Dropdown', icon: List },
  { value: 'file', label: 'File Upload', icon: Upload },
  { value: 'date', label: 'Date', icon: Calendar },
];

export default function FormsPage() {
  const { currentRole, currentLocation } = useRole();
  
  const [forms, setForms] = useState<Form[]>(INITIAL_FORMS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);

  const [newForm, setNewForm] = useState({
    name: '',
    locationId: currentLocation || 'abuja',
    locationName: 'Abuja International Airport',
    departmentId: 'customer-service',
    departmentName: 'Customer Service',
    allowAnonymous: true,
    successMessage: 'Thank you for your feedback!',
    fields: [] as FormField[],
  });

  const filteredForms = forms.filter(form => {
    if (searchTerm && !form.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleLocationChange = (locationId: string) => {
    const location = MOCK_LOCATIONS.find(l => l.id === locationId);
    const depts = getDepartmentsByLocation(locationId);
    setNewForm({
      ...newForm,
      locationId,
      locationName: location?.name || '',
      departmentId: depts[0]?.id || '',
      departmentName: depts[0]?.name || '',
    });
  };

  const handleAddField = (type: FormField['type'] = 'text') => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: 'New Field',
      required: false,
      options: type === 'dropdown' ? ['Option 1', 'Option 2'] : [],
    };
    setNewForm({...newForm, fields: [...newForm.fields, newField]});
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setNewForm({
      ...newForm,
      fields: newForm.fields.map(f => f.id === fieldId ? {...f, ...updates} : f)
    });
  };

  const handleRemoveField = (fieldId: string) => {
    setNewForm({
      ...newForm,
      fields: newForm.fields.filter(f => f.id !== fieldId)
    });
  };

  const handleSaveForm = () => {
    if (isEditMode && editingFormId) {
      setForms(forms.map(f => f.id === editingFormId ? { ...f, ...newForm } : f));
    } else {
      const form: Form = {
        id: `form-${String(forms.length + 1).padStart(3, '0')}`,
        name: newForm.name,
        type: 'passenger',
        locationId: newForm.locationId,
        locationName: newForm.locationName,
        departmentId: newForm.departmentId,
        departmentName: newForm.departmentName,
        fields: newForm.fields,
        allowAnonymous: newForm.allowAnonymous,
        successMessage: newForm.successMessage,
        createdAt: new Date().toISOString().split('T')[0],
        submissions: 0,
      };
      setForms([form, ...forms]);
    }
    setIsCreateModalOpen(false);
    setWizardStep(1);
    setIsEditMode(false);
    setEditingFormId(null);
    setNewForm({
      name: '',
      locationId: currentLocation || 'abuja',
      locationName: MOCK_LOCATIONS.find(l => l.id === (currentLocation || 'abuja'))?.name || '',
      departmentId: 'customer-service',
      departmentName: 'Customer Service',
      allowAnonymous: true,
      successMessage: 'Thank you for your feedback!',
      fields: [],
    });
  };

  const handleDeleteForm = (id: string) => {
    setForms(forms.filter(f => f.id !== id));
    if (selectedForm?.id === id) setSelectedForm(null);
  };

  const handleDuplicateForm = (form: Form) => {
    const duplicate: Form = {
      ...form,
      id: `form-${String(forms.length + 1).padStart(3, '0')}`,
      name: `${form.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
      submissions: 0,
    };
    setForms([duplicate, ...forms]);
  };

  const resetWizard = () => {
    setWizardStep(1);
    const locId = currentLocation || 'abuja';
    const location = MOCK_LOCATIONS.find(l => l.id === locId);
    const depts = getDepartmentsByLocation(locId);
    setNewForm({
      name: '',
      locationId: locId,
      locationName: location?.name || '',
      departmentId: depts[0]?.id || '',
      departmentName: depts[0]?.name || '',
      allowAnonymous: true,
      successMessage: 'Thank you for your feedback!',
      fields: [],
    });
  };

  return (
    <div className={styles.touchpointsLayout}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Forms Management</h2>
          <p className={styles.pageSubtitle}>Create and manage passenger and internal forms.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.createButton} onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            <span>Create Form</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.tableControls}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search forms..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

{/* Forms List */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Form Name</th>
              <th>Location</th>
              <th>Department</th>
              <th>Fields</th>
              <th>Submissions</th>
              <th className={styles.textRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredForms.map((form) => (
              <tr key={form.id} className={styles.clickableRow} onClick={() => setSelectedForm(form)}>
                <td>
                  <span className={styles.tpName}>{form.name}</span>
                </td>
                <td>
                  <div className={styles.deptCell}>
                    <span>{form.locationName}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.deptCell}>
                    <span>{form.departmentName}</span>
                  </div>
                </td>
                <td>
                  <span>{form.fields.length} fields</span>
                </td>
                <td>
                  <span className={styles.tpName}>{form.submissions}</span>
                </td>
                <td className={styles.textRight}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      className={styles.viewLink} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setNewForm({
                          name: form.name,
                          locationId: form.locationId,
                          locationName: form.locationName,
                          departmentId: form.departmentId,
                          departmentName: form.departmentName,
                          allowAnonymous: form.allowAnonymous,
                          successMessage: form.successMessage,
                          fields: form.fields,
                        });
                        setIsEditMode(true);
                        setEditingFormId(form.id);
                        setIsCreateModalOpen(true);
                      }}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button className={styles.viewLink} onClick={(e) => { e.stopPropagation(); handleDuplicateForm(form); }}>
                      <Copy size={14} /> Duplicate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

{/* CREATE FORM WIZARD MODAL */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent}`} style={{ maxWidth: '1200px', width: '96%', maxHeight: '92vh' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{isEditMode ? 'Edit Form' : 'Create New Passenger Form'}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Step {wizardStep} of 3</p>
              </div>
              <button className={styles.closeBtn} onClick={() => { setIsCreateModalOpen(false); resetWizard(); }}><X size={20} /></button>
            </div>
            
            {/* Wizard Progress */}
            <div className={styles.wizardProgress}>
              <div className={`${styles.progressStep} ${wizardStep >= 1 ? styles.active : ''}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 2 ? styles.active : ''}`} />
              <div className={`${styles.progressStep} ${wizardStep >= 3 ? styles.active : ''}`} />
            </div>

            {/* Wizard Steps Container */}
            <div className={styles.modalBody} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '0', minHeight: '560px', padding: '0' }}>
              
              {/* LEFT PANEL: Wizard Content */}
              <div style={{ padding: '32px', borderRight: '1px solid #e2e8f0', overflow: 'auto' }}>
                {/* Step 1: Form Details */}
                {wizardStep === 1 && (
                  <div>
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                        Form Details
                      </h4>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Give your form a name and configure basic settings
                      </p>
                    </div>
                    
                    <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                      <label className={styles.formLabel}>Form Name *</label>
                      <div className={styles.modalInputWrapper}>
                        <FileStack size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. Passenger Feedback Survey"
                          value={newForm.name}
                          onChange={(e) => setNewForm({...newForm, name: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                      <label className={styles.formLabel}>Success Message</label>
                      <div className={styles.modalInputWrapper} style={{ padding: '16px', alignItems: 'flex-start' }}>
                        <CheckCircle2 size={18} style={{ marginTop: '2px' }} />
                        <textarea 
                          placeholder="Message to show after successful submission"
                          value={newForm.successMessage}
                          onChange={(e) => setNewForm({...newForm, successMessage: e.target.value})}
                          style={{ minHeight: '80px', resize: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#475569', cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={newForm.allowAnonymous}
                          onChange={(e) => setNewForm({...newForm, allowAnonymous: e.target.checked})}
                          style={{ width: '18px', height: '18px' }}
                        />
                        Allow anonymous submissions
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 2: Location & Department */}
                {wizardStep === 2 && (
                  <div>
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                        Assignment
                      </h4>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Select where this form will be available
                      </p>
                    </div>
                    
                    <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                      <label className={styles.formLabel}>Location *</label>
                      <div className={styles.modalInputWrapper}>
                        <Plus size={18} />
                        <select 
                          value={newForm.locationId}
                          onChange={(e) => handleLocationChange(e.target.value)}
                        >
                          {MOCK_LOCATIONS.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Department *</label>
                      <div className={styles.modalInputWrapper}>
                        <List size={18} />
                        <select 
                          value={newForm.departmentId}
                          onChange={(e) => {
                            const dept = getDepartmentsByLocation(newForm.locationId).find(d => d.id === e.target.value);
                            setNewForm({...newForm, departmentId: e.target.value, departmentName: dept?.name || ''});
                          }}
                        >
                          {getDepartmentsByLocation(newForm.locationId).map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Build Fields */}
                {wizardStep === 3 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div>
                        <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                          Build Fields
                        </h4>
                        <p style={{ fontSize: '14px', color: '#64748b' }}>
                          Add and configure fields for your form ({newForm.fields.length} added)
                        </p>
                      </div>
                      <button className={styles.createButton} onClick={() => handleAddField('text')}>
                        <Plus size={16} /> Add Field
                      </button>
                    </div>

                    {/* Field Type Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                      {FIELD_TYPES.map(ft => {
                        const Icon = ft.icon;
                        return (
                          <button
                            key={ft.value}
                            onClick={() => handleAddField(ft.value as FormField['type'])}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '10px 16px',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              background: 'white',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: '#475569',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Icon size={14} /> {ft.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Fields List */}
                    {newForm.fields.length === 0 ? (
                      <div className={styles.emptyStage} style={{ height: '180px', background: '#f8fafc', border: '2px dashed #e2e8f0' }}>
                        <FileStack size={40} style={{ color: '#cbd5e1' }} />
                        <p style={{ fontWeight: 600, color: '#64748b', marginTop: '12px' }}>No fields added yet</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Click a field type above to start building</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {newForm.fields.map((field, index) => (
                          <div key={field.id} style={{ 
                            background: 'white', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '12px', 
                            padding: '16px',
                            transition: 'all 0.2s',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <span style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                background: 'var(--brand-green-light)', 
                                color: 'var(--brand-green)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}>
                                {index + 1}
                              </span>
                              <select 
                                value={field.type}
                                onChange={(e) => handleUpdateField(field.id, { type: e.target.value as FormField['type'] })}
                                style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                              >
                                {FIELD_TYPES.map(ft => (
                                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => handleRemoveField(field.id)}
                                style={{ 
                                  marginLeft: 'auto', 
                                  padding: '6px', 
                                  borderRadius: '6px', 
                                  border: 'none', 
                                  background: 'transparent',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <input 
                              type="text"
                              placeholder="Field label"
                              value={field.label}
                              onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                              style={{ 
                                width: '100%', 
                                fontSize: '14px', 
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '12px',
                              }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                <input 
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                                />
                                Required
                              </label>
                              {field.type === 'dropdown' && (
                                <input 
                                  type="text"
                                  placeholder="Options: A, B, C"
                                  value={field.options?.join(', ') || ''}
                                  onChange={(e) => handleUpdateField(field.id, { 
                                    options: e.target.value.split(',').map(o => o.trim()).filter(o => o) 
                                  })}
                                  style={{ flex: 1, fontSize: '12px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: Phone Preview */}
              <div style={{ 
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  color: '#64748b', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px', 
                  marginBottom: '16px',
                }}>
                  📱 Live Preview
                </div>
                
                {/* iPhone 14 Pro Style Mockup */}
                <div style={{
                  width: '280px',
                  height: '560px',
                  background: '#000',
                  borderRadius: '44px',
                  padding: '10px',
                  position: 'relative',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                }}>
                  {/* Dynamic Island */}
                  <div style={{
                    width: '90px',
                    height: '28px',
                    background: '#000',
                    borderRadius: '16px',
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                  }} />
                  
                  {/* Screen */}
                  <div style={{
                    height: '100%',
                    background: '#fff',
                    borderRadius: '34px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* Status Bar */}
                    <div style={{ 
                      height: '46px', 
                      padding: '0 20px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1e293b',
                    }}>
                      <span>9:41</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <div style={{ width: '16px', height: '10px', background: '#1e293b', borderRadius: '2px' }} />
                        <div style={{ width: '14px', height: '10px', background: '#1e293b', borderRadius: '2px' }} />
                      </div>
                    </div>

                    {/* App Header */}
                    <div style={{ 
                      padding: '16px 20px', 
                      borderBottom: '1px solid #f1f5f9',
                      background: '#fafafa',
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                        {newForm.name || 'Untitled Form'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {newForm.locationName.split(' ')[0]} • {newForm.departmentName.split(' ')[0]}
                      </div>
                    </div>
                    
                    {/* Scrollable Content */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
                      {newForm.fields.length === 0 ? (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          height: '200px',
                          color: '#94a3b8',
                        }}>
                          <FileStack size={32} />
                          <p style={{ fontSize: '12px', marginTop: '8px' }}>No fields yet</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {newForm.fields.slice(0, 5).map(field => (
                            <div key={field.id}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                                {field.label || 'Field'} {field.required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
                              </div>
                              {field.type === 'rating' && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} size={20} fill="#fbbf24" color="#fbbf24" />
                                  ))}
                                </div>
                              )}
                              {field.type === 'text' && (
                                <input 
                                  disabled
                                  placeholder="Enter text..."
                                  style={{ 
                                    height: '36px', 
                                    background: '#f9fafb', 
                                    border: '1px solid #e5e7eb', 
                                    borderRadius: '8px',
                                    padding: '0 12px',
                                    fontSize: '13px',
                                  }}
                                />
                              )}
                              {field.type === 'textarea' && (
                                <textarea 
                                  disabled
                                  placeholder="Enter details..."
                                  style={{ 
                                    height: '60px', 
                                    background: '#f9fafb', 
                                    border: '1px solid #e5e7eb', 
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    fontSize: '13px',
                                    resize: 'none',
                                  }}
                                />
                              )}
                              {field.type === 'dropdown' && (
                                <div style={{ 
                                  height: '36px', 
                                  background: '#f9fafb', 
                                  border: '1px solid #e5e7eb', 
                                  borderRadius: '8px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between', 
                                  padding: '0 12px',
                                  fontSize: '12px', 
                                  color: '#9ca3af',
                                }}>
                                  Select option
                                  <ChevronRight size={14} />
                                </div>
                              )}
                              {field.type === 'date' && (
                                <div style={{ 
                                  height: '36px', 
                                  background: '#f9fafb', 
                                  border: '1px solid #e5e7eb', 
                                  borderRadius: '8px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  padding: '0 12px',
                                  fontSize: '12px', 
                                  color: '#9ca3af',
                                }}>
                                  <Calendar size={14} style={{ marginRight: '8px' }} />
                                  Pick a date
                                </div>
                              )}
                              {field.type === 'file' && (
                                <div style={{ 
                                  height: '60px', 
                                  border: '1.5px dashed #d1d5db', 
                                  borderRadius: '8px', 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  color: '#9ca3af', 
                                  fontSize: '11px',
                                }}>
                                  <Upload size={18} />
                                  Tap to upload
                                </div>
                              )}
                            </div>
                          ))}
                          {newForm.fields.length > 5 && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>
                              +{newForm.fields.length - 5} more fields
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Submit Button */}
                    <div style={{
                      padding: '16px 20px',
                      borderTop: '1px solid #f1f5f9',
                    }}>
                      <div style={{
                        background: 'var(--brand-green)',
                        color: 'white',
                        padding: '14px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}>
                        Submit
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wizard Actions */}
            <div className={styles.modalActions}>
              {wizardStep > 1 ? (
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => setWizardStep(wizardStep - 1)}
                  style={{ marginRight: 'auto' }}
                >
                  <ChevronLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}
              <button 
                className={styles.cancelBtn} 
                onClick={() => { setIsCreateModalOpen(false); resetWizard(); }}
              >
                Cancel
              </button>
              {wizardStep < 3 ? (
                <button 
                  className={styles.createButton}
                  onClick={() => setWizardStep(wizardStep + 1)}
                  disabled={wizardStep === 1 && !newForm.name}
                  style={{ opacity: wizardStep === 1 && !newForm.name ? 0.5 : 1 }}
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  className={styles.createButton}
                  onClick={handleSaveForm}
                  disabled={newForm.fields.length === 0}
                  style={{ opacity: newForm.fields.length === 0 ? 0.5 : 1 }}
                >
                  <CheckCircle2 size={18} /> {isEditMode ? 'Update Form' : 'Save Form'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW FORM MODAL */}
      {selectedForm && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.wideModal}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={`${styles.typeTag} ${selectedForm.type === 'passenger' ? 'feedback' : 'complaint'}`}>
                  {selectedForm.type === 'passenger' ? 'Passenger' : 'Internal'}
                </span>
                <h3 className={styles.modalTitle}>{selectedForm.name}</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedForm(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailMain}>
                  <section className={styles.messageSection}>
                    <h4 className={styles.detailLabel}>Form Fields ({selectedForm.fields.length})</h4>
                    <div className={styles.messageCard}>
                      {selectedForm.fields.map((field, i) => (
                        <div key={field.id} style={{ padding: '12px 0', borderBottom: i < selectedForm.fields.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{field.label}</span>
                            {field.required && <span className={styles.priorityTag} style={{ fontSize: '9px' }}>Required</span>}
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{field.type}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
                <div className={styles.detailSidebar}>
                  <div className={styles.actionGroup}>
                    <h4 className={styles.detailLabel}>Quick Stats</h4>
                    <div className={styles.infoCards} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className={styles.infoCard}>
                        <FileStack size={18} />
                        <div><span>Total Submissions</span><strong>{selectedForm.submissions}</strong></div>
                      </div>
                      <div className={styles.infoCard}>
                        <Calendar size={18} />
                        <div><span>Created</span><strong>{selectedForm.createdAt}</strong></div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.dangerZone}>
                    <button className={styles.archiveBtn} onClick={() => handleDeleteForm(selectedForm.id)}>
                      <Trash2 size={16} /> Delete Form
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelectedForm(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}