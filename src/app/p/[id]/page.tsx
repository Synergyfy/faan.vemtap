"use client";
import React, { useState, use, useEffect } from "react";
import { Star, Send, CheckCircle2, AlertCircle, Loader2, ChevronLeft, Layout, Lock, MessageCircle, X } from "lucide-react";
import styles from "./Passenger.module.css";
import Image from "next/image";
import { useTouchpointBySlug } from "@/hooks/useTouchpoints";
import { useCreateSubmission, useCreatePublicSubmission } from "@/hooks/useSubmissions";
import { FormField, Submission, ReportTemplate, Touchpoint, FeedbackForm, FeedbackFormField } from "@/types/api";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{sender: 'bot'|'user', text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  useEffect(() => {
    if (isChatOpen && !hasStartedChat) {
      setHasStartedChat(true);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const fullText = "How can I help you today?";
        setChatMessages([{ sender: 'bot', text: "" }]);
        let i = 0;
        const interval = setInterval(() => {
          setChatMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[0] = { sender: 'bot', text: fullText.substring(0, i + 1) };
            }
            return newMessages;
          });
          i++;
          if (i === fullText.length) clearInterval(interval);
        }, 30);
      }, 500);
    }
  }, [isChatOpen, hasStartedChat]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const fullText = `We are still in demo mode, I will be brought to live when devs are done building me. (You said: "${userText}")`;
      
      setChatMessages((prev) => [...prev, { sender: 'bot', text: "" }]);
      
      let i = 0;
      const interval = setInterval(() => {
        setChatMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = { 
            ...newMessages[lastIndex], 
            text: fullText.substring(0, i + 1)
          };
          return newMessages;
        });
        i++;
        if (i === fullText.length) clearInterval(interval);
      }, 30);
    }, 1000);
  };

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
    // Clear error when user types
    if (errors[fieldId]) {
      const newErrors = { ...errors };
      delete newErrors[fieldId];
      setErrors(newErrors);
    }
  };

  const handleSelectTemplate = (template: ReportTemplate | FeedbackForm | null) => {
    setSelectedTemplate(template);
    setStep('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = "This field is required";
      } else if (field.type === 'email' && formData[field.id] && !/^\S+@\S+\.\S+$/.test(formData[field.id])) {
        newErrors[field.id] = "Please enter a valid email address";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }

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

    const loadingToast = toast.loading("Submitting your report...");
    console.log("Starting submission with payload:", payload);

    mutation.mutate(payload as any, {
      onSuccess: (data: any) => {
        toast.dismiss(loadingToast);
        console.log("Submission success handler triggered. Data:", data);
        
        try {
          const result = data?.data || data;
          const ref = result?.code || result?.uuid || result?.id || "PENDING";
          
          toast.success("Report submitted successfully!");
          
          setSubmissionRef(ref);
          setSubmitted(true);
          console.log("State updated: submitted = true, ref =", ref);
          
          // Clear draft
          localStorage.removeItem(`draft_tp_${touchpoint.slug}`);
        } catch (err) {
          console.error("Error in onSuccess handler:", err);
          setSubmitted(true); // Still try to show success state
        }
      },
      onError: (err: any) => {
        toast.dismiss(loadingToast);
        console.error("Submission error handler triggered:", err);
        const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred. Please try again.";
        toast.error(errorMessage);
      }
    });
  };

  return (
    <div className={styles.container}>
      {submitted && (
        <div className={styles.modalOverlay}>
          <div className={styles.successModal}>
            <div className={styles.successIcon} style={{ color: theme.color }}>
              <CheckCircle2 size={80} />
            </div>
            <h1 className={styles.successTitle}>Report Captured</h1>
            <p className={styles.successText}>
              Thank you for helping us improve. Your {(selectedTemplate as any)?.title || (selectedTemplate as any)?.name || touchpoint.type.toLowerCase().replace('_', ' ')} has been logged successfully for FAAN review.
            </p>
            
            <div className={styles.refInfo}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>REFERENCE NUMBER</span>
                <span style={{ fontSize: '16px', color: '#1e293b', fontWeight: 800 }}>{submissionRef.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>SUBMITTED ON</span>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <button 
              className={styles.submitBtn} 
              style={{ backgroundColor: '#1e293b', marginTop: '32px' }} 
              onClick={() => window.location.reload()}
            >
              Finish & Close
            </button>
          </div>
        </div>
      )}

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
                      className={`${styles.textarea} ${errors[field.id] ? styles.inputError : ""}`}
                      placeholder="Provide more details..."
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {(field.type === "dropdown" || field.type === "select") && (
                    <select 
                      className={`${styles.input} ${errors[field.id] ? styles.inputError : ""}`}
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
                      className={`${styles.input} ${errors[field.id] ? styles.inputError : ""}`}
                      placeholder={field.type === 'date' ? '' : "Type here..."}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {errors[field.id] && (
                    <span className={styles.errorMsg}>{errors[field.id]}</span>
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

      {/* Floating Chat */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {isChatOpen && (
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: '12px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
            padding: '20px', 
            marginBottom: '16px', 
            width: '300px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Support Agent</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'user' ? theme.color : '#f1f5f9', 
                  color: msg.sender === 'user' ? 'white' : '#334155',
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  fontSize: '14px',
                  maxWidth: '85%',
                  lineHeight: '1.4'
                }}>
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', padding: '4px' }}>
                  Agent is typing...
                </div>
              )}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Type your message..." 
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                style={{ backgroundColor: theme.color, color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            backgroundColor: theme.color,
            color: 'white',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            transform: isChatOpen ? 'scale(0.9)' : 'scale(1)'
          }}
        >
          {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </button>
      </div>
    </div>
  );
}
