"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { format, startOfWeek, endOfWeek, addDays, subDays, startOfMonth, endOfMonth } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Calendar, ChevronLeft, ChevronRight, Download, Mail, Share2, Printer, FileText,
  MapPin, Loader2, Sparkles, Wand2
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/context/RoleContext";
import styles from "../../Dashboard.module.css";
import Image from "next/image";

// --- TYPES ---
export enum SystemReportType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum SystemReportCategory {
  GENERAL = 'GENERAL',
  INTERNAL = 'INTERNAL',
}

export interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
}

export interface ChartData {
  title: string;
  data: DistributionItem[];
  explanation: string;
}

export interface SystemReport {
  id: string;
  reportType: SystemReportType;
  category: SystemReportCategory;
  date: string;
  weekRange?: string | null;
  month?: string | null;
  content: string;
  metrics: Record<string, any>;
  graphData: ChartData[];
  pdfFileUrl?: string | null;
  locationId?: string | null;
  departmentId?: string | null;
  createdAt: string;
}

const COLORS = ['#157347', '#0284c7', '#ea580c', '#db2777', '#9333ea', '#dc2626', '#0d9488'];

function SummaryReportsContents() {
  const { locationName, currentRole, currentLocation } = useRole();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const locationId = currentLocation;
  
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as SystemReportCategory;
  const category = categoryParam || SystemReportCategory.INTERNAL;

  const [reportType, setReportType] = useState<SystemReportType>(SystemReportType.DAILY);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [currentReport, setCurrentReport] = useState<SystemReport | null>(null);
  
  const reportRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await axios.get(`${API_URL}/system-reports`, {
        params: {
          reportType,
          category,
          locationId: isSuperAdmin ? undefined : locationId
        }
      });
      const data = res.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (data.length > 0) {
        if (reportType === SystemReportType.DAILY) {
          const targetStr = format(selectedDate, 'yyyy-MM-dd');
          const match = data.find((r: SystemReport) => r.date && r.date.startsWith(targetStr));
          setCurrentReport(match || null);
        } else {
          setCurrentReport(data[0]);
        }
      } else {
        setCurrentReport(null);
      }
    } catch (error) {
      console.error("Failed to load reports", error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType, category, selectedDate, locationId, isSuperAdmin]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCurrentReport(null);
    try {
      const res = await axios.post(`${API_URL}/system-reports/generate`, {
        reportType,
        category,
        locationId: isSuperAdmin ? undefined : locationId,
        date: format(selectedDate, 'yyyy-MM-dd')
      });
      
      setCurrentReport(res.data);
      toast.success("AI Report successfully generated!");
    } catch (error: any) {
      console.error("Error generating report", error);
      toast.error(error?.response?.data?.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = async (id: string) => {
    try {
      const url = `${API_URL}/system-reports/${id}/pdf`;
      window.open(url, '_blank');
      toast.success("Opening PDF...");
    } catch {
      toast.error("Failed to download PDF.");
    }
  };

  const handleEmailShare = async (id: string) => {
    const email = prompt("Enter recipient email address:");
    if (!email) return;

    try {
      toast.loading("Sending email...", { id: 'emailSend' });
      await axios.post(`${API_URL}/system-reports/${id}/share`, { email });
      toast.success("Report sent successfully!", { id: 'emailSend' });
    } catch (err) {
      toast.error("Failed to send email.", { id: 'emailSend' });
    }
  };

  const handleWhatsAppShare = (id: string) => {
    const url = `${API_URL}/system-reports/${id}/pdf`;
    const message = `Here is the latest ${reportType} report from FAAN VEMTAP: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    toast.success("Prepared for WhatsApp sharing.");
  };

  const renderDateControls = () => {
    let displayText = "";
    if (reportType === SystemReportType.DAILY) {
      displayText = format(selectedDate, "EEEE, MMMM do, yyyy");
    } else if (reportType === SystemReportType.WEEKLY) {
       displayText = `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM do")} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM do")}`;
    } else {
      displayText = format(selectedDate, "MMMM yyyy");
    }

    const handlePrev = () => {
      if (reportType === SystemReportType.DAILY) setSelectedDate(subDays(selectedDate, 1));
      if (reportType === SystemReportType.WEEKLY) setSelectedDate(subDays(selectedDate, 7));
      if (reportType === SystemReportType.MONTHLY) setSelectedDate(subDays(startOfMonth(selectedDate), 1));
    };

    const handleNext = () => {
      if (reportType === SystemReportType.DAILY) setSelectedDate(addDays(selectedDate, 1));
      if (reportType === SystemReportType.WEEKLY) setSelectedDate(addDays(selectedDate, 7));
      if (reportType === SystemReportType.MONTHLY) setSelectedDate(addDays(endOfMonth(selectedDate), 1));
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={handlePrev} className={styles.iconButton}><ChevronLeft size={18} /></button>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', minWidth: '200px', textAlign: 'center' }}>
          {displayText}
        </span>
        <button onClick={handleNext} className={styles.iconButton}><ChevronRight size={18} /></button>
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Sparkles className="text-brand-green" /> 
            AI Reporting Engine
          </h1>
          <p className={styles.pageSubtitle}>Automatically generate stunning, human-readable insights from your operational data.</p>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '6px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '6px' }}>
            {Object.values(SystemReportType).map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: reportType === type ? 'var(--brand-green)' : 'transparent',
                  color: reportType === type ? '#fff' : '#64748b',
                  boxShadow: reportType === type ? '0 4px 12px rgba(21, 115, 71, 0.2)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: '32px', background: 'linear-gradient(to right, #ffffff, #f8fafc)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                Period Selection
              </p>
              {renderDateControls()}
            </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              background: 'linear-gradient(135deg, var(--brand-green) 0%, #0d9488 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.7 : 1,
              boxShadow: '0 8px 20px rgba(13, 148, 136, 0.25)',
              transition: 'transform 0.2s',
            }}
          >
            {isGenerating ? <Loader2 size={18} className="spin" /> : <Wand2 size={18} />}
            Generate AI Report
          </button>
        </div>
      </div>

      {isLoadingReports && !currentReport && !isGenerating && (
         <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#94a3b8' }}>
            <Loader2 className="spin" size={32} />
         </div>
      )}

      {currentReport && !isGenerating ? (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div ref={reportRef} style={{ 
            background: 'white', 
            borderRadius: '24px', 
            padding: '56px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)',
            maxWidth: '960px',
            margin: '0 auto',
            color: '#1e293b',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(90deg, var(--brand-green), #0d9488)' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '32px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Image src="/Faan.logo_.png" alt="FAAN" width={70} height={35} />
                  <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--brand-green)', letterSpacing: '-0.5px' }}>VEMTAP</span>
                </div>
                <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px', color: '#0f172a' }}>
                  {currentReport.reportType} REPORT
                </h2>
                <p style={{ color: '#64748b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} /> {locationName || 'All Locations'} • {category}
                </p>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '10px', background: 'rgba(21,115,71,0.08)', color: 'var(--brand-green)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>
                   AI Generated
                </span>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>
                    {format(new Date(currentReport.date || currentReport.createdAt), "MMMM do, yyyy")}
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Ref: {currentReport.id.split('-')[0]}</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '56px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Sparkles size={20} color="var(--brand-green)" />
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>Executive Summary</h3>
              </div>
              <div className="report-markdown" style={{ 
                fontSize: '18px', 
                lineHeight: '1.8', 
                color: '#334155',
                background: '#f8fafc',
                padding: '32px',
                borderRadius: '20px',
                borderLeft: '4px solid var(--brand-green)'
              }}>
                <ReactMarkdown>{currentReport.content}</ReactMarkdown>
              </div>
            </div>

            {currentReport.graphData && currentReport.graphData.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px', color: '#0f172a' }}>Data Visualizations</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: currentReport.graphData.length > 1 ? '1fr 1fr' : '1fr', gap: '32px' }}>
                  {currentReport.graphData.map((graph, idx) => (
                    <div key={idx} style={{ padding: '24px', border: '1px solid #e2e8f0', borderRadius: '20px', background: 'white' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '16px', color: '#475569', marginBottom: '24px', textAlign: 'center' }}>{graph.title}</h4>
                      
                      <div style={{ height: '240px', width: '100%' }}>
                        {idx % 2 === 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={graph.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                              >
                                {graph.data.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={graph.data}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                              <Bar dataKey="count" fill="var(--brand-green)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      
                      <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                        <ReactMarkdown>{graph.explanation}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '60px', textAlign: 'center', borderTop: '2px solid #f1f5f9', paddingTop: '32px' }}>
              <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                Generated dynamically by GEMINI AI Engine • Automated Reporting System
              </p>
            </div>
          </div>

          <div style={{ 
            marginTop: '32px', 
            background: 'white', 
            padding: '16px 24px', 
            borderRadius: '20px', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            position: 'sticky',
            bottom: '32px',
            width: 'fit-content',
            margin: '40px auto 0 auto',
            zIndex: 10
          }}>
            <button onClick={() => downloadPdf(currentReport.id)} style={{ border: 'none', background: '#f1f5f9', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Download PDF">
              <Download size={20} color="#1e293b" />
            </button>
            <button onClick={() => window.print()} style={{ border: 'none', background: '#f1f5f9', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Print">
              <Printer size={20} color="#1e293b" />
            </button>
            <div style={{ width: '1px', background: '#e2e8f0', margin: '8px 0' }}></div>
            <button onClick={() => handleEmailShare(currentReport.id)} className={styles.createButton} style={{ gap: '10px', padding: '0 24px', height: '50px', borderRadius: '14px' }}>
              <Mail size={18} /> Send via Email
            </button>
            <button onClick={() => handleWhatsAppShare(currentReport.id)} style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: '14px', padding: '0 24px', height: '50px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)' }}>
              <Share2 size={18} /> WhatsApp
            </button>
          </div>
        </div>
      ) : !isGenerating ? (
        <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', borderRadius: '24px', border: '2px dashed #cbd5e1', color: '#94a3b8' }}>
          <div style={{ background: '#f1f5f9', padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
            <FileText size={48} color="#94a3b8" />
          </div>
          <h3 style={{ color: '#475569', fontWeight: 700, fontSize: '22px', marginBottom: '8px' }}>No report available</h3>
          <p style={{ fontSize: '15px' }}>Click <strong style={{color: 'var(--brand-green)'}}>Generate AI Report</strong> to analyze the data and generate insights.</p>
        </div>
      ) : null}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-content, #report-content * { visibility: visible !important; }
          #report-content { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 0 !important; box-shadow: none !important; border: none !important; margin: 0 !important; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); filter: blur(5px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .iconButton { border: none; background: #f1f5f9; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s; }
        .iconButton:hover { background: #e2e8f0; color: #1e293b; }
        .report-markdown p { margin-bottom: 1em; }
        .report-markdown strong { color: #0f172a; font-weight: 700; }
      `}</style>
    </div>
  );
}

export default function SummaryReportsPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Loader2 className="spin" size={48} /></div>}>
      <SummaryReportsContents />
    </Suspense>
  );
}
