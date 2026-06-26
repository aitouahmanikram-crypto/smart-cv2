import React, { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, Target, Edit3, ShieldCheck, Zap, Activity, Download, Eye, TrendingUp, Save, BarChart2, Sliders, History as HistoryIcon, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend } from "recharts";
import jsPDF from "jspdf";
import CVPreview from "../CVPreview";
import CareerAdvisor from "./CareerAdvisor";
import VersionTimeline from "./VersionTimeline";
import { apiFetch } from "../../lib/apiClient";

export default function CVAnalysis({ token }: { token: string }) {
  const [cvs, setCvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCv, setSelectedCv] = useState<any | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);

  // ATS Optimization & Simulation states
  const [activeTab, setActiveTab] = useState<'ats_optimizer' | 'insights' | 'career_advice'>('ats_optimizer');
  const [kwMatch, setKwMatch] = useState(70);
  const [fmtQuality, setFmtQuality] = useState(70);
  const [skCoverage, setSkCoverage] = useState(70);
  const [expRelevance, setExpRelevance] = useState(70);
  const [eduRelevance, setEduRelevance] = useState(70);
  const [customNotes, setCustomNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedCv) {
      setKwMatch(selectedCv.parsedDetails?.keywordMatching ?? 70);
      setFmtQuality(selectedCv.parsedDetails?.formattingQuality ?? 70);
      setSkCoverage(selectedCv.parsedDetails?.skillsCoverage ?? 70);
      setExpRelevance(selectedCv.parsedDetails?.experienceRelevance ?? 70);
      setEduRelevance(selectedCv.parsedDetails?.educationRelevance ?? 70);
      setCustomNotes(selectedCv.parsedDetails?.atsNotes ?? "");
      setSaveStatus("idle");
      fetchVersions(selectedCv.id);
    }
  }, [selectedCv]);

  const fetchVersions = async (cvId: string) => {
    try {
        const data = await apiFetch(`/api/cvs/${cvId}/versions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        setVersions(Array.isArray(data) ? data : []);
    } catch(err) { console.error("Failed to fetch versions:", err); setVersions([]); }
  };

  const handleRestore = async (versionId: string) => {
      try {
          await apiFetch(`/api/cvs/${selectedCv.id}/versions/${versionId}/restore`, {
              method: 'POST',
              headers: { "Authorization": `Bearer ${token}` }
          });
          window.location.reload(); 
      } catch(err) { console.error(err); }
  };

  const liveOverallScore = Math.round((kwMatch + fmtQuality + skCoverage + expRelevance + eduRelevance) / 5);

  const getChartData = (cv: any) => {
    return [
      { name: 'Grammar', score: cv.grammarScore || 0, color: '#8b5cf6' }, // Purple
      { name: 'Impact', score: cv.impactScore || 0, color: '#ec4899' },  // Pink
      { name: 'Skills', score: cv.skillsScore || 0, color: '#10b981' }   // Emerald
    ];
  };

  const handleDownloadPDF = () => {
    if (!selectedCv) return;
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textAreaWidth = pageWidth - margin * 2;

    // Header styling
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CV Analysis Report", margin, 25);
    
    // Sub-header details
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Candidate: ${selectedCv.parsedDetails?.name || "Unknown"}`, margin, 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`File: ${selectedCv.fileName}`, margin, 63);
    doc.text(`Date Evaluated: ${new Date(selectedCv.updatedAt).toLocaleDateString()}`, margin, 71);
    
    // Line separator
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(margin, 78, pageWidth - margin, 78);

    // Overall Score
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Overall Strength Score: ${selectedCv.score}/100`, margin, 90);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const summaryLines = doc.splitTextToSize(String(selectedCv.summary || "No summary available"), textAreaWidth);
    doc.text(summaryLines, margin, 100);
    
    let currentY = 100 + (summaryLines.length * 6) + 10;
    
    const writeSection = (title: string, items: any[], bulletColor = [79, 70, 229]) => {
      if (!items || !Array.isArray(items) || items.length === 0) return;
      if (currentY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        currentY = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(title, margin, currentY);
      currentY += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      
      items.forEach(item => {
        if (currentY > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          currentY = margin;
        }
        
        doc.setFillColor(bulletColor[0], bulletColor[1], bulletColor[2]);
        doc.circle(margin + 2, currentY - 1, 1.5, "F");
        
        const textLines = doc.splitTextToSize(String(item), textAreaWidth - 8);
        doc.text(textLines, margin + 8, currentY);
        currentY += textLines.length * 6 + 4;
      });
      currentY += 4;
    };
    
    writeSection("Core Strengths", selectedCv.strengths || [], [16, 185, 129]); // emerald
    writeSection("Key Weaknesses", selectedCv.weaknesses || [], [244, 63, 94]); // rose
    writeSection("Matched Skills", selectedCv.skillsMatched || [], [59, 130, 246]); // blue
    writeSection("Missing Standards", selectedCv.skillsMissing || [], [245, 158, 11]); // amber
    writeSection("ATS Optimizations", selectedCv.atsOptimizations || [], [168, 85, 247]); // purple
    writeSection("Recommendations", selectedCv.recommendations || selectedCv.suggestions || [], [99, 102, 241]); // indigo

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated by AI CV Coach • ${new Date().getFullYear()}`, margin, pageHeight - 15);

    doc.save(`CV_Analysis_${selectedCv.parsedDetails?.name?.replace(/\s+/g, '_') || 'Report'}.pdf`);
  };

  useEffect(() => {
    const fetchCVs = async () => {
      try {
        const data = await apiFetch("/api/cvs", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        setCvs(data);
        if (data.length > 0) {
          setSelectedCv(data[0]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCVs();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl">
        {error}
      </div>
    );
  }

  if (cvs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Edit3 className="h-8 w-8 text-slate-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">No CVs Analyzed</h3>
          <p className="text-slate-400 mt-2 max-w-md">Upload a plain text version of your resume to see your complete technical analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight">AI CV Analysis Engine</h1>
          <p className="text-slate-400 mt-1">Review the OpenAI-generated metrics, gaps, and extracted skills.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {cvs.length > 1 && (
            <select 
              className="bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              onChange={(e) => setSelectedCv(cvs.find(c => c.id === e.target.value))}
              value={selectedCv?.id}
            >
              {cvs.map(c => (
                <option key={c.id} value={c.id}>{c.fileName} - {new Date(c.updatedAt).toLocaleDateString()}</option>
              ))}
            </select>
          )}
          {selectedCv && (
            <div className="flex gap-2">
              <button 
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors border border-slate-700 shadow-lg cursor-pointer"
              >
                <Eye className="h-4 w-4" /> View Parsed Data
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors border border-indigo-500 hover:border-indigo-400 shadow-lg cursor-pointer"
              >
                <Download className="h-4 w-4" /> Export Report PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex p-1 bg-slate-900 border border-slate-850 rounded-xl max-w-md w-full">
          <button
            onClick={() => setActiveTab('ats_optimizer')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'ats_optimizer'
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-lg font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="h-4 w-4" />
            ATS Optimizer Lab
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-lg font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Insights & QA Prep
          </button>
          <button
            onClick={() => setActiveTab('career_advice')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'career_advice'
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-lg font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Career Advisor
          </button>
        </div>
      </div>

      {selectedCv && (
        <div className="space-y-6">
            <VersionTimeline versions={versions} onRestore={handleRestore} />
            <div className="tab-content">
              {activeTab === 'ats_optimizer' ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="text-white">ATS Optimizer Lab</div>
                </div>
              ) : activeTab === 'career_advice' ? (
                <CareerAdvisor cvId={selectedCv.id} token={token} />
              ) : (
                <div className="p-6 text-slate-400">Insights feature under development.</div>
              )}
            </div>
            
            <div className="layout-common space-y-6">
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData(selectedCv)} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '8px' }} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                      {getChartData(selectedCv).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-400" /> Detailed ATS Score
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: "Keyword Match", score: selectedCv.parsedDetails?.keywordMatching || 0 },
                      { label: "Format Quality", score: selectedCv.parsedDetails?.formattingQuality || 0 },
                      { label: "Skills Coverage", score: selectedCv.parsedDetails?.skillsCoverage || 0 },
                      { label: "Exp. Relevance", score: selectedCv.parsedDetails?.experienceRelevance || 0 },
                      { label: "Edu. Relevance", score: selectedCv.parsedDetails?.educationRelevance || 0 }
                    ].map((stat, i) => (
                      <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">{stat.label}</span>
                        <div className="relative h-12 w-12 flex flex-col items-center justify-center rounded-full border-2 border-indigo-500/30">
                          <span className="text-white font-bold text-sm">{stat.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-indigo-400" /> ATS Recommendations
                    </h3>
                    <ul className="space-y-4">
                      {selectedCv.atsOptimizations?.length > 0 ? selectedCv.atsOptimizations.map((s: string, idx: number) => (
                        <li key={idx} className="flex gap-3 items-start p-3 bg-slate-950 rounded-xl border border-slate-900">
                          <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-300 leading-relaxed">{s}</p>
                        </li>
                      )) : (
                        <p className="text-xs text-slate-500 italic">No ATS improvements flagged.</p>
                      )}
                    </ul>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-400" /> Professional Recs
                    </h3>
                    <ul className="space-y-4">
                      {selectedCv.recommendations?.length > 0 ? selectedCv.recommendations.map((s: string, idx: number) => (
                        <li key={idx} className="flex gap-3 items-start p-3 bg-slate-950 rounded-xl border border-slate-900">
                          <Target className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-300 leading-relaxed">{s}</p>
                        </li>
                      )) : selectedCv.suggestions?.map((s: string, idx: number) => (
                        <li key={idx} className="flex gap-3 items-start p-3 bg-slate-950 rounded-xl border border-slate-900">
                          <Target className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-300 leading-relaxed">{s}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
        </div>
      )}

      {previewOpen && selectedCv?.parsedDetails && (
        <CVPreview 
          parsedDetails={selectedCv.parsedDetails} 
          onClose={() => setPreviewOpen(false)} 
        />
      )}
    </div>
  );
}
