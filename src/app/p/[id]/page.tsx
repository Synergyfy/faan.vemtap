"use client";

import React, { useState, use, useEffect } from "react";
import { Star, Send, CheckCircle2, AlertCircle, Loader2, ChevronLeft, Layout, Lock } from "lucide-react";
import styles from "./Passenger.module.css";
import Image from "next/image";
import { useTouchpointBySlug } from "@/hooks/useTouchpoints";
import { useCreateSubmission, useCreatePublicSubmission } from "@/hooks/useSubmissions";
import { FormField, Submission, ReportTemplate, Touchpoint, FeedbackForm, FeedbackFormField } from "@/types/api";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// Normalized Backend Enum Mapping
const TYPE_THEMES: Record<string, { title: string; subtitle: string; color: string }> = {
  FEEDBACK: { title: "Passenger Feedback", subtitle: "How was your experience today?", color: "#157347" },
  COMPLAINT: { title: "Lodge a Complaint", subtitle: "We're sorry to hear about your issue.", color: "#dc2626" },
  INCIDENT: { title: "Report an Incident", subtitle: "Help us keep our airport safe and secure.", color: "#92400e" },
  LOST_AND_FOUND: { title: "Lost & Found", subtitle: "Tell us what you lost, we'll help find it.", color: "#0369a1" }
};

type PageStep = 'selection' | 'form' | 'success';

export default function PassengerFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id; // slug or uuid
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();

  const { data: touchpoint, isLoading, error } = useTouchpointBySlug(id);
  const createSubMutation = useCreateSubmission();
  const createPublicSubMutation = useCreatePublicSubmission();

  const [step, setStep] = useState<PageStep>('selection');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | FeedbackForm | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submissionRef, setSubmissionRef] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Handle Draft Recovery and Step Determination
  useEffect(() => {
    if (!touchpoint) return;

    // Check if there are assigned templates (legacy and relational)
    const templates = touchpoint.templates || [];
    const feedbackForms = touchpoint.feedbackForms || [];
    
    // Auto-select if only one template exists total and no formConfig
    const totalTemplates = templates.length + feedbackForms.length;
    const hasFormConfig = touchpoint.formConfig && touchpoint.formConfig.length > 0;

    // Load draft if exists
    const draftKey = `draft_tp_${touchpoint.slug}`;
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      try {
        const { formData: savedForm, selectedTemplate: savedTemp, step: savedStep } = JSON.parse(savedDraft);
        setFormData(savedForm);
        setSelectedTemplate(savedTemp);
        setStep(savedStep);
        localStorage.removeItem(draftKey); // Clear after recovery
        return;
      } catch (e) {
        console.error("Failed to recover draft", e);
      }
    }

    if (totalTemplates === 1 && !hasFormConfig) {
      const singleTemplate = feedbackForms.length > 0 ? feedbackForms[0] : templates[0];
      setSelectedTemplate(singleTemplate);
      setStep('form');
    } else if (totalTemplates === 0 && hasFormConfig) {
      setStep('form');
    } else {
      setStep('selection');
    }
  }, [touchpoint]);

  if (isLoading) {
    return (
      <div className={styles.container} style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Loader2 className={styles.spinning} size={48} color="#157347" />
        <p style={{ marginTop: '16px', color: '#64748b' }}>Loading engagement form...</p>
      </div>
    );
  }

  if (error || !touchpoint) {
    return (
      <div className={styles.container} style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <AlertCircle size={64} color="#dc2626" />
        <h1 style={{ marginTop: '20px' }}>Invalid Link</h1>
        <p style={{ color: '#64748b', maxWidth: '300px' }}>
          This QR code may have expired or the link is incorrect. Please contact airport staff for assistance.
        </p>
      </div>
    );
  }

  const theme = TYPE_THEMES[touchpoint.type] || TYPE_THEMES.FEEDBACK;
  
  // Determine which fields to show
  const getFields = (): (FormField | FeedbackFormField)[] => {
    if (selectedTemplate) {
      if ('schema' in selectedTemplate) return selectedTemplate.schema as unknown as FormField[];
      if ('fields' in selectedTemplate) return selectedTemplate.fields;
    }
    return (touchpoint.formConfig || []) as unknown as FormField[];
  };

  const fields = getFields();

  const handleInputChange = (fieldId: string | number, value: string | number) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleSelectTemplate = (template: ReportTemplate | FeedbackForm | null) => {
    setSelectedTemplate(template);
    setStep('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mutation = isAuthenticated ? createSubMutation : createPublicSubMutation;
    
    // Check if we are using the new relational model or a legacy ReportTemplate
    const isFeedbackForm = selectedTemplate && 'fields' in selectedTemplate;
    const isReportTemplate = selectedTemplate && 'schema' in selectedTemplate;

    let formResponses: any[] = [];

    if (isFeedbackForm || isReportTemplate) {
      formResponses = [{
        formId: selectedTemplate.id,
        answers: Object.entries(formData).map(([fieldId, value]) => ({
          fieldId: String(fieldId),
          value: String(value)
        }))
      }];
    }

    const payload = isAuthenticated 
      ? { 
          touchpointId: touchpoint.id, 
          formResponses,
          submittedAt: new Date().toISOString()
        }
      : { 
          slug: touchpoint.slug, 
          formResponses,
          submittedAt: new Date().toISOString()
        };

    mutation.mutate(payload as any, {
      onSuccess: (data: Submission) => {
        setSubmissionRef(data.uuid || data.id);
        setSubmitted(true);
        // Clear draft
        localStorage.removeItem(`draft_tp_${touchpoint.slug}`);
      }
    });
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon} style={{ color: theme.color }}>
            <CheckCircle2 size={64} />
          </div>
          <h1 className={styles.successTitle}>Report Captured</h1>
          <p className={styles.successText}>
            Thank you for helping us improve. Your {(selectedTemplate as any)?.title || (selectedTemplate as any)?.name || touchpoint.type.toLowerCase().replace('_', ' ')} has been logged for FAAN review.
          </p>
          <div className={styles.refInfo}>
            <span>REF: {submissionRef.substring(0, 8).toUpperCase()}</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <button className={styles.doneBtn} onClick={() => window.location.reload()}>
            Finish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.brandHeader}>
        <div className={styles.logoWrapper}>
          <Image src="/Faan.logo_.png" alt="FAAN Logo" width={80} height={80} />
        </div>
        <h1 className={styles.brandTitle}>{touchpoint.title || theme.title}</h1>
        <p className={styles.brandSubtitle}>
          {touchpoint.department?.name} • {touchpoint.location?.name}
        </p>
        {touchpoint.description && (
          <p className={styles.brandDesc}>{touchpoint.description}</p>
        )}
      </div>

      <div className={styles.formCard}>
        {step === 'selection' && (
          <div className={styles.animateIn}>
            <div className={styles.selectionHeader}>
              <h2 className={styles.selectionTitle}>Select an Option</h2>
              <p className={styles.selectionSubtitle}>Please choose the type of report you wish to submit.</p>
            </div>
            
            <div className={styles.templateGrid}>
              {/* Ad-hoc form if exists */}
              {touchpoint.formConfig && touchpoint.formConfig.length > 0 && (
                <button className={styles.templateCard} onClick={() => handleSelectTemplate(null)}>
                  <span className={styles.templateName}>General {touchpoint.type.toLowerCase()}</span>
                  <span className={styles.templateDesc}>Standard engagement form</span>
                </button>
              )}
              
              {/* Relational feedback forms */}
              {touchpoint.feedbackForms?.map((form) => (
                <button key={form.id} className={styles.templateCard} onClick={() => handleSelectTemplate(form)}>
                  <span className={styles.templateName}>{form.title}</span>
                  {form.description && <span className={styles.templateDesc}>{form.description}</span>}
                </button>
              ))}

              {/* legacy assigned templates */}
              {touchpoint.templates?.map((template) => (
                <button key={template.id} className={styles.templateCard} onClick={() => handleSelectTemplate(template)}>
                  <span className={styles.templateName}>{template.name}</span>
                  {template.description && <span className={styles.templateDesc}>{template.description}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className={styles.animateIn}>
            {/* Back button if multi-template */}
            {((touchpoint.templates?.length || 0) + (touchpoint.feedbackForms?.length || 0) > 1 || 
              ((touchpoint.templates?.length || 0) + (touchpoint.feedbackForms?.length || 0) > 0 && touchpoint.formConfig && touchpoint.formConfig.length > 0)) && (
              <button className={styles.backBtn} onClick={() => setStep('selection')}>
                <ChevronLeft size={18} /> Back to options
              </button>
            )}

            <form onSubmit={handleSubmit} className={styles.dynamicForm}>
              <h2 className={styles.selectionTitle}>{(selectedTemplate as any)?.title || (selectedTemplate as any)?.name || `General ${touchpoint.type.toLowerCase()}`}</h2>
              
              {fields.map((field) => (
                <div key={field.id} className={styles.fieldGroup}>
                  <label className={styles.label}>
                    {field.label} {field.required && <span className={styles.required}>*</span>}
                  </label>

                  {field.type === "rating" && (
                    <div className={styles.starRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`${styles.starBtn} ${formData[field.id] >= star ? styles.starFilled : ""}`}
                          onClick={() => handleInputChange(field.id, star)}
                        >
                          <Star size={36} fill={formData[field.id] >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  )}

                  {field.type === "textarea" && (
                    <textarea 
                      className={styles.textarea}
                      placeholder="Provide more details..."
                      required={field.required}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === "dropdown" && (
                    <select 
                      className={styles.input}
                      required={field.required}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    >
                      <option value="">Select Option</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {(field.type === "text" || field.type === "email" || field.type === "number" || field.type === "date") && (
                    <input 
                      type={field.type} 
                      className={styles.input}
                      placeholder={field.type === 'date' ? '' : "Type here..."}
                      required={field.required}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}


              <button 
                type="submit" 
                className={styles.submitBtn}
                style={{ backgroundColor: theme.color, marginTop: '24px' }}
                disabled={createSubMutation.isPending || createPublicSubMutation.isPending}
              >
                {(createSubMutation.isPending || createPublicSubMutation.isPending) ? "Submitting..." : "Submit Report"}
                {(createSubMutation.isPending || createPublicSubMutation.isPending) ? <Loader2 className={styles.spinning} size={18} /> : <Send size={18} />}
              </button>
            </form>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <p>Digital Health & Safety Infrastructure</p>
        <div className={styles.footerTerms}>
          <span>Terms</span> • <span>Privacy Policy</span> • <span>FAAN.gov.ng</span>
        </div>
      </footer>
    </div>
  );
}
