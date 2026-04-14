"use client";

import React, { useState, useEffect, use } from "react";
import { Star, Send, ArrowRight, CheckCircle2, AlertCircle, Upload, HelpCircle } from "lucide-react";
import styles from "./Passenger.module.css";
import Image from "next/image";

// Mock mapping of Interaction Types to Branding
const TYPE_THEMES: any = {
  Feedback: { title: "Passenger Feedback", subtitle: "How was your experience today?", color: "#157347" },
  Complaint: { title: "Lodge a Complaint", subtitle: "We're sorry to hear about your issue.", color: "#dc2626" },
  Incident: { title: "Report an Incident", subtitle: "Help us keep our airport safe and secure.", color: "#92400e" },
  "Lost & Found": { title: "Lost & Found", subtitle: "Tell us what you lost, we'll help find it.", color: "#0369a1" }
};

export default function PassengerFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<any>({
    rating: 0,
    comment: "",
    name: "",
    email: "",
    phone: ""
  });
  
  const [config, setConfig] = useState<any>({
    type: "Feedback",
    requireContact: false,
    fields: [
      { id: "rating", type: "rating", label: "Rate your experience", required: true },
      { id: "comment", type: "textarea", label: "Tell us more (Optional)", required: false }
    ]
  });

  useEffect(() => {
    if (id.includes("lost")) {
      setConfig({
        type: "Lost & Found",
        requireContact: true,
        fields: [
          { id: "rating", type: "rating", label: "Overall Satisfaction", required: false },
          { id: "comment", type: "textarea", label: "Describe the item you lost in detail", required: true }
        ]
      });
    } else if (id.includes("inc")) {
      setConfig({
        type: "Incident",
        requireContact: false,
        fields: [
          { id: "rating", type: "rating", label: "Impact Rating", required: false },
          { id: "comment", type: "textarea", label: "Describe the incident", required: true }
        ]
      });
    }
  }, [id]);

  const theme = TYPE_THEMES[config.type] || TYPE_THEMES.Feedback;

  const handleInputChange = (id: string, value: any) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate system-level tracking
    console.log("System Data:", {
      timestamp: new Date().toISOString(),
      locationId: id,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
    });
    setSubmitted(true);
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
            Thank you for helping us improve. Your {config.type.toLowerCase()} has been logged for FAAN review.
          </p>
          <div className={styles.refInfo}>
            <span>REF: {id.toUpperCase()}</span>
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
          {config.fields.map((field: any) => (
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
                      className={`${styles.starBtn} ${formData.rating >= star ? styles.starFilled : ""}`}
                      onClick={() => handleInputChange("rating", star)}
                    >
                      <Star size={36} fill={formData.rating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              )}

              {field.type === "textarea" && (
                <textarea 
                  className={styles.textarea}
                  placeholder="Provide more details..."
                  required={field.required}
                  value={formData.comment}
                  onChange={(e) => handleInputChange("comment", e.target.value)}
                />
              )}

              {field.type === "number" && (
                <input 
                  type="number" 
                  className={styles.input}
                  placeholder="0"
                  required={field.required}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                />
              )}

              {field.type === "email" && (
                <input 
                  type="email" 
                  className={styles.input}
                  placeholder="your@email.com"
                  required={field.required}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                />
              )}

              {field.type === "date" && (
                <input 
                  type="date" 
                  className={styles.input}
                  required={field.required}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                />
              )}

              {field.type === "text" && (
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder="Type here..."
                  required={field.required}
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
                <label className={styles.contactLabel}>Full Name {config.requireContact && "*"}</label>
                <input 
                  type="text" 
                  className={styles.contactInput} 
                  placeholder="Your Name"
                  required={config.requireContact}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className={styles.contactGridRow}>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Phone Number {config.requireContact && "*"}</label>
                  <input 
                    type="tel" 
                    className={styles.contactInput} 
                    placeholder="+234..." 
                    required={config.requireContact}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Email Address {config.requireContact && "*"}</label>
                  <input 
                    type="email" 
                    className={styles.contactInput} 
                    placeholder="email@example.com"
                    required={config.requireContact}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
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
            disabled={!formData.rating && config.type === "Feedback"}
          >
            Submit Feedback
            <Send size={18} />
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
