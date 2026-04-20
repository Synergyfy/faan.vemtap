"use client";

import React, { useState, use, useEffect } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";
import styles from "../../p/[id]/Passenger.module.css";
import Image from "next/image";
import { useReportTemplatePublic, useCreateReportPublic } from "@/hooks/useReports";
import { FormField, ReportTemplate } from "@/types/api";

export default function StaffReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const { data: template, isLoading, error } = useReportTemplatePublic(id);
  const createReportMutation = useCreateReportPublic();

  const [submitted, setSubmitted] = useState(false);
  const [submissionRef, setSubmissionRef] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});

  if (isLoading) {
    return (
      <div className={styles.container} style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Loader2 className={styles.spinning} size={48} color="#157347" />
        <p style={{ marginTop: '16px', color: '#64748b' }}>Loading report template...</p>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className={styles.container} style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <AlertCircle size={64} color="#dc2626" />
        <h1 style={{ marginTop: '20px' }}>Template Not Found</h1>
        <p style={{ color: '#64748b', maxWidth: '300px' }}>
          This QR code may be invalid or the report template has been deactivated.
        </p>
      </div>
    );
  }

  const fields = (template.schema || []) as unknown as FormField[];

  const handleInputChange = (fieldId: string | number, value: string | number) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      templateId: template.id,
      title: `${template.name} - Unit Submission`,
      date: new Date().toISOString().split('T')[0],
      fieldValues: formData,
    };

    createReportMutation.mutate(payload, {
      onSuccess: (data: any) => {
        setSubmissionRef(data.id || "SUCCESS");
        setSubmitted(true);
      }
    });
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon} style={{ color: "#157347" }}>
            <CheckCircle2 size={64} />
          </div>
          <h1 className={styles.successTitle}>Report Submitted</h1>
          <p className={styles.successText}>
            The internal report has been successfully logged to the dashboard for {template.locationName}.
          </p>
          <div className={styles.refInfo}>
            <span>REF: {submissionRef.substring(0, 8).toUpperCase()}</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <button className={styles.doneBtn} onClick={() => window.location.reload()}>
            Submit Another
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
        <h1 className={styles.brandTitle}>Staff Internal Report</h1>
        <p className={styles.brandSubtitle}>Unit: {template.departmentName} • {template.locationName}</p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.animateIn}>
          <form onSubmit={handleSubmit} className={styles.dynamicForm}>
            <h2 className={styles.selectionTitle}>{template.name}</h2>
            
            {fields.map((field: FormField) => (
              <div key={field.id} className={styles.fieldGroup}>
                <label className={styles.label}>
                  {field.label} {field.required && <span className={styles.required}>*</span>}
                </label>

                {field.type === "textarea" && (
                  <textarea 
                    className={styles.textarea}
                    placeholder="Type details here..."
                    required={field.required}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                )}

                {(field.type === "dropdown" || field.type === "select") && (
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
                    placeholder="Type here..."
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
              style={{ backgroundColor: "#157347", marginTop: '8px' }}
              disabled={createReportMutation.isPending}
            >
              {createReportMutation.isPending ? "Submitting..." : "Submit Internal Report"}
              {createReportMutation.isPending ? <Loader2 className={styles.spinning} size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>INTERNAL USE ONLY • FAAN SECURITY & COMPLIANCE</p>
      </footer>
    </div>
  );
}
