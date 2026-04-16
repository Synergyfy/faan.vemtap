"use client";

import React, { useState, use } from "react";
import { Star, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import styles from "./Passenger.module.css";
import Image from "next/image";
import { useTouchpointBySlug } from "@/hooks/useTouchpoints";
import { useCreateSubmission } from "@/hooks/useSubmissions";
import { FormField, Submission } from "@/types/api";

// Normalized Backend Enum Mapping
const TYPE_THEMES: Record<string, { title: string; subtitle: string; color: string }> = {
  FEEDBACK: { title: "Passenger Feedback", subtitle: "How was your experience today?", color: "#157347" },
  COMPLAINT: { title: "Lodge a Complaint", subtitle: "We're sorry to hear about your issue.", color: "#dc2626" },
  INCIDENT: { title: "Report an Incident", subtitle: "Help us keep our airport safe and secure.", color: "#92400e" },
  LOST_AND_FOUND: { title: "Lost & Found", subtitle: "Tell us what you lost, we'll help find it.", color: "#0369a1" }
};

export default function PassengerFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id; // slug or uuid

  const { data: touchpoint, isLoading, error } = useTouchpointBySlug(id);
  const createSubmission = useCreateSubmission();

  const [submitted, setSubmitted] = useState(false);
  const [submissionRef, setSubmissionRef] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [personalDetails, setPersonalDetails] = useState({
    name: "",
    email: "",
    phone: ""
  });

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
  const fields = touchpoint.formConfig || [];

  const handleInputChange = (fieldId: string | number, value: string | number) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      touchpointId: touchpoint.id,
      locationId: touchpoint.locationId,
      departmentId: touchpoint.departmentId,
      type: touchpoint.type,
      data: formData,
      passengerDetails: (personalDetails.name || personalDetails.email) ? personalDetails : null,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
      }
    };

    createSubmission.mutate(payload, {
      onSuccess: (data: Submission) => {
        setSubmissionRef(data.uuid || data.id);
        setSubmitted(true);
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
            Thank you for helping us improve. Your {touchpoint.type.toLowerCase().replace('_', ' ')} has been logged for FAAN review.
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
        <h1 className={styles.brandTitle}>{theme.title}</h1>
        <p className={styles.brandSubtitle}>{theme.subtitle}</p>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.dynamicForm}>
          {fields.map((field: FormField) => (
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

          {/* CONTACT SECTION */}
          <div className={styles.contactSection}>
            <div className={styles.contactHeader}>
              <h3 className={styles.contactTitle}>Provide your details if you would like a response</h3>
              <p className={styles.trustLabel}>
                Your feedback can be submitted anonymously. Contact details are only required if you would like a response.
              </p>
            </div>
            
            <div className={styles.contactGrid}>
              <div className={styles.contactField}>
                <label className={styles.contactLabel}>Full Name</label>
                <input 
                  type="text" 
                  className={styles.contactInput} 
                  placeholder="Your Name"
                  value={personalDetails.name}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, name: e.target.value })}
                />
              </div>
              <div className={styles.contactGridRow}>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Phone Number</label>
                  <input 
                    type="tel" 
                    className={styles.contactInput} 
                    placeholder="+234..." 
                    value={personalDetails.phone}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, phone: e.target.value })}
                  />
                </div>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Email Address</label>
                  <input 
                    type="email" 
                    className={styles.contactInput} 
                    placeholder="email@example.com"
                    value={personalDetails.email}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <p className={styles.finalTrustMsg}>
            <CheckCircle2 size={12} />
            Securely processed by FAAN Engagement System
          </p>

          <button 
            type="submit" 
            className={styles.submitBtn}
            style={{ backgroundColor: theme.color }}
            disabled={createSubmission.isPending}
          >
            {createSubmission.isPending ? "Submitting..." : "Submit Feedback"}
            {createSubmission.isPending ? <Loader2 className={styles.spinning} size={18} /> : <Send size={18} />}
          </button>
        </form>
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
