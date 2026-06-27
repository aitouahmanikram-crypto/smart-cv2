import React, { useEffect, useState, useRef } from "react";
import { 
  FileText, Target, Zap, Clock, ArrowRight, BookOpen, Upload, X, CheckCircle, 
  AlertCircle, Sparkles, Star, TrendingUp, Activity, Lightbulb, Sliders, ListFilter
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, LineChart, Line, Legend 
} from "recharts";
import { ViewType } from "../Dashboard";
import { apiFetch } from "../../lib/apiClient";

interface OverviewProps {
  token: string;
  onNavigate: (view: ViewType) => void;
}

export default function Overview({ token, onNavigate }: OverviewProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  
  // Upload Component State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, savedData] = await Promise.all([
          apiFetch("/api/dashboard/stats", { headers: { "Authorization": `Bearer ${token}` } }),
          apiFetch("/api/matches/saved", { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        setStats(statsData);
        setSavedJobs(savedData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [token]);

  const handleRemoveSavedJob = async (matchId: string) => {
    try {
      await apiFetch(`/api/matches/save/${matchId}`, {
         method: "DELETE",
         headers: {
           "Authorization": `Bearer ${token}`
         }
      });
      setSavedJobs(prev => prev.filter(job => job.id !== matchId));
    } catch (err: any) {
       console.error("Error removing saved job:", err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    setUploadSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      if (!validTypes.includes(selected.type) && !selected.name.endsWith(".docx")) {
        setUploadError("Currently, only PDF, DOCX, and TXT files are supported for best AI parsing.");
        return;
      }
      setFile(selected);
      handleUpload(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      if (!validTypes.includes(droppedFile.type) && !droppedFile.name.endsWith(".docx")) {
        setUploadError("Currently, only PDF, DOCX, and TXT files are supported for best AI parsing.");
        return;
      }
      setFile(droppedFile);
      handleUpload(droppedFile);
    }
  };

  const handleUpload = async (uploadFile: File) => {
    setIsUploading(true);
    setUploadError("");
    
    try {
      const formData = new FormData();
      formData.append("cvFile", uploadFile);
      
      await apiFetch("/api/cvs/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      setUploadSuccess(true);
      setTimeout(() => {
        onNavigate('analysis');
      }, 1500);
      
    } catch (err: any) {
      setUploadError(err.message);
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // 1. DATA GENERATOR: ATS SCORE EVOLUTION OVER TIME
  const getAtsEvolutionData = () => {
    const cvs = Array.isArray(stats?.cvs) ? stats.cvs : [];
    if (cvs.length === 0) {
      return [
        { name: "Day 0", score: 65, file: "Baseline Template" },
        { name: "S1", score: 72, file: "First Draft" },
        { name: "S2", score: 85, file: "Optimized Core" }
      ];
    }
    return [...cvs]
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      .map((c, idx) => {
        const d = new Date(c.updatedAt);
        const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return {
          name: dateStr,
          score: c.score || 70,
          file: c.fileName || `Scan #${idx + 1}`
        };
      });
  };

  // 2. DATA GENERATOR: ANALYSES AND CREATIONS PER MONTH
  const getMonthlyActivityData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData: { [key: string]: { monthName: string, year: number, monthIndex: number, cvs: number, letters: number, matches: number } } = {};
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      chartData[key] = {
        monthName: `${mName} ${d.getFullYear().toString().substr(-2)}`,
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        cvs: 0,
        letters: 0,
        matches: 0
      };
    }

    if (stats?.cvs) {
      stats.cvs.forEach((cv: any) => {
        const d = new Date(cv.updatedAt || cv.createdAt || now);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (chartData[key]) chartData[key].cvs++;
      });
    }

    if (stats?.letters) {
      stats.letters.forEach((l: any) => {
        const d = new Date(l.createdAt || now);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (chartData[key]) chartData[key].letters++;
      });
    }

    if (stats?.matches) {
      stats.matches.forEach((m: any) => {
        const d = new Date(m.createdAt || now);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (chartData[key]) chartData[key].matches++;
      });
    }

    // Default mock distribution values as starting point if counts are all 0
    const vals = Object.values(chartData);
    const totalCountSeen = vals.reduce((sum, item) => sum + item.cvs + item.letters + item.matches, 0);
    if (totalCountSeen === 0) {
      vals[0].cvs = 1; vals[0].letters = 1;
      vals[1].cvs = 2; vals[1].letters = 1; vals[1].matches = 1;
      vals[2].cvs = 1; vals[2].letters = 2; vals[2].matches = 2;
      vals[3].cvs = 3; vals[3].letters = 2; vals[3].matches = 4;
      vals[4].cvs = stats?.cvsCount || 2; vals[4].letters = stats?.lettersCount || 2; vals[4].matches = stats?.matchesCount || 3;
    }
    return vals;
  };

  // 3. DATA GENERATOR: TEMPORAL ACTIVITY LEVEL GRAPH (Past 14 Days)
  const getActivityTimelineData = () => {
    const chartData: { [key: string]: { dateStr: string, count: number } } = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toDateString();
      chartData[key] = {
        dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: 0
      };
    }

    const allEvents = [
      ...(stats?.cvs?.map((c: any) => c.updatedAt || c.createdAt) || []),
      ...(stats?.letters?.map((l: any) => l.createdAt) || []),
      ...(stats?.matches?.map((m: any) => m.createdAt) || []),
      ...(stats?.recentActivity?.map((a: any) => a.timestamp) || [])
    ];

    let hasActualTimelineLogs = false;
    allEvents.forEach((timestamp: string) => {
      if (!timestamp) return;
      const d = new Date(timestamp);
      const key = d.toDateString();
      if (chartData[key]) {
        chartData[key].count++;
        hasActualTimelineLogs = true;
      }
    });

    const vals = Object.values(chartData);
    if (!hasActualTimelineLogs) {
      vals[1].count = 1;
      vals[3].count = 2;
      vals[5].count = 1;
      vals[8].count = 3;
      vals[10].count = 2;
      vals[12].count = 4;
    }
    return vals;
  };

  const getActivityTypeDetails = (type: string) => {
    const norm = (type || "").toLowerCase();
    if (norm.includes("upload") || norm.includes("revision") || norm.includes("cv")) {
      return {
        label: 'Resume Upload',
        icon: '📤',
        bgColor: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        textColor: 'text-indigo-400'
      };
    } else if (norm.includes("analysis") || norm.includes("audit") || norm.includes("tailor") || norm.includes("ats")) {
      return {
        label: 'AI Compliance Audit',
        icon: '🛡️',
        bgColor: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        textColor: 'text-indigo-400'
      };
    } else if (norm.includes("letter") || norm.includes("cover")) {
      return {
        label: 'Cover Letter Draft',
        icon: '📝',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        textColor: 'text-emerald-400'
      };
    } else if (norm.includes("match") || norm.includes("job") || norm.includes("fit")) {
      return {
        label: 'Job Match Scan',
        icon: '🎯',
        bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        textColor: 'text-amber-400'
      };
    } else if (norm.includes("interview") || norm.includes("prep") || norm.includes("questions") || norm.includes("iq")) {
      return {
        label: 'Interview Prep Session',
        icon: '🧠',
        bgColor: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
        textColor: 'text-pink-400'
      };
    } else {
      return {
        label: 'System Sync',
        icon: '⚡',
        bgColor: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
        textColor: 'text-slate-400'
      };
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          <span className="text-xs text-slate-400 font-mono tracking-wider">Syncing dashboard parameters...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/5 border border-rose-500/10 text-rose-400 p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm">Failed to sync telemetry nodes</h4>
          <p className="text-xs text-rose-400/80 mt-1">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-mono transition"
        >
          RETRY_SYNC
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              ⚡ Live Control Central
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight mt-2.5">
            SmartCV AI <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Telemetry Workspace</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            Monitor real-time resume iterations, automated compliance pipelines, and tailored career metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onNavigate('upload')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition border border-slate-800 cursor-pointer shadow-lg active:scale-95 duration-150"
          >
            <Upload className="h-4 w-4 text-indigo-400" /> New CV
          </button>
          <button 
            onClick={() => onNavigate('matching')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-600/15 active:scale-95 duration-150"
          >
            <Target className="h-4 w-4" /> Jet Matching
          </button>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { key: "Total CV Analyses", value: stats?.cvsCount || 0, icon: "📋", unit: "scans", color: "border-l-indigo-500", label: "Uploaded & parsed CVs" },
          { key: "Total Cover Letters", value: stats?.lettersCount || 0, icon: "📝", unit: "drafts", color: "border-l-emerald-500", label: "Unique tailored letters" },
          { key: "Total Job Matches", value: stats?.matchesCount || 0, icon: "🎯", unit: "matches", color: "border-l-amber-500", label: "Analyzed role alignments" },
          { key: "Total Interview Sessions", value: stats?.interviewsCount || 0, icon: "🧠", unit: "sessions", color: "border-l-pink-500", label: "QA preps generated" },
          { key: "Average ATS Score", value: stats?.averageScore || 0, icon: "⚡", unit: "avg", max: "/100", color: "gradient", label: "Average resume score" },
        ].map((card, i) => (
          <div 
            key={i} 
            className={`p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl backdrop-blur-sm shadow-xl hover:translate-y-[-2px] transition duration-350 ${
              card.color === "gradient" 
                ? "border-l-4 border-l-transparent bg-gradient-to-b from-indigo-500/10 to-slate-900/60" 
                : `border-l-4 ${card.color}`
            } flex flex-col justify-between min-h-[115px]`}
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block truncate max-w-[110px]" title={card.key}>
                  {card.key}
                </span>
                <span className="text-base shrink-0">{card.icon}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal mt-1 truncate">{card.label}</p>
            </div>
            <div className="flex items-baseline gap-1 mt-3 border-t border-slate-950/20 pt-2">
              <span className={`text-2xl font-extrabold font-mono tracking-tight text-white`}>
                {card.value}
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-medium">
                {card.max ? card.max : card.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Analytics Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Two Charts (9 lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Chart 1: ATS Evolution Over Scan Events */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/2 pointer-events-none rounded-full blur-2xl" />
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" /> Resume ATS Evolution Track
                </h3>
                <p className="text-[11px] text-slate-550 mt-0.5">Chronological score trajectory across multiple updated resumes and scans.</p>
              </div>
              <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Performance Score
              </span>
            </div>
            
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getAtsEvolutionData()}>
                  <defs>
                    <linearGradient id="atsLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#fae" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[40, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: 10 }}
                    formatter={(value: any, name: any, props: any) => [`${value}% ATS Score`, props.payload.file]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    name="ATS compliance score"
                    stroke="url(#atsLineGrad)" 
                    strokeWidth={3} 
                    activeDot={{ r: 7, strokeWidth: 0, fill: '#ec4899' }} 
                    dot={{ fill: '#6366f1', strokeWidth: 1.5, r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Analyses & Activity per Month */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" /> Core Asset Metrics Trend
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated asset creation and optimizations grouped per month indices.</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-slate-400">Resumes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">Letters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-slate-400">Matches</span>
                </div>
              </div>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getMonthlyActivityData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="monthName" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: 10 }}
                  />
                  <Bar dataKey="cvs" name="Resumes" fill="#6366f1" radius={[3, 3, 0, 0]} barSize={9} />
                  <Bar dataKey="letters" name="Cover Letters" fill="#10b981" radius={[3, 3, 0, 0]} barSize={9} />
                  <Bar dataKey="matches" name="Analyzed Fits" fill="#f59e0b" radius={[3, 3, 0, 0]} barSize={9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: Upload CV Box & System Tips (4 lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Beautiful Quick Upload Area */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/20 via-slate-900/80 to-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">Upload Terminal</h3>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                  PDF / Word
                </span>
              </div>
              
              {uploadError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-start gap-2.5 mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">{uploadError}</p>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 p-4 rounded-xl flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                    <p className="text-xs font-semibold">Parsed! Redirecting Workspace...</p>
                  </div>
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-300" />
                </div>
              )}

              {!isUploading && !uploadSuccess ? (
                <div 
                  className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300 rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center group"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-850 group-hover:bg-indigo-500/10 flex items-center justify-center mb-3 transition-colors border border-slate-800 group-hover:border-indigo-500/20">
                    <Upload className="h-5 w-5 text-slate-400 group-hover:text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100 mb-1">Click or drop file to analyse</h4>
                  <p className="text-[10px] text-slate-500">PDF, DOCX, or TXT (Max 10MB)</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="p-8 text-center border border-slate-800/80 rounded-xl bg-slate-950/40">
                  {isUploading && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-7 w-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
                      <p className="text-indigo-400 font-semibold text-xs tracking-wide">Deconstructing Document Node...</p>
                      <p className="text-[10px] text-slate-500 mt-1 italic">Vetting compliance standards & formatting</p>
                    </div>
                  )}
                  {uploadSuccess && (
                    <p className="text-emerald-400 font-semibold text-xs py-2">System Analysis Standard Bypassed!</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Instant AI Matcher</span>
              <span>100% Secure SSL</span>
            </div>
          </div>

          {/* Activity Level Fortnight Heat/Area Plot */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-pink-400" /> Activity Timeline Trend
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Chronological system action spikes over the last fortnight.</p>
            </div>

            <div className="h-32 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getActivityTimelineData()} margin={{ top: 5, right: 5, left: -32, bottom: 0 }}>
                  <defs>
                    <linearGradient id="glowColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dateStr" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: 9 }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#glowColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Advanced Action Flow Feed Block & Saved Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Chronological Activities Feed */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl space-y-5">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ListFilter className="h-4.5 w-4.5 text-indigo-400" /> Chronological Telemetry Feed
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Event stream from your active CV optimizations and cover letter drafts.</p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
              Supabase Synchronized
            </span>
          </div>

          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((activity: any) => {
                const details = getActivityTypeDetails(activity.type);
                return (
                  <div 
                    key={activity.id} 
                    className="flex gap-4 p-4 rounded-xl bg-slate-950/70 hover:bg-slate-950 transition duration-300 border border-slate-900 hover:border-slate-800 items-start group"
                  >
                    <div className={`h-8 w-8 rounded-lg ${details.bgColor} flex items-center justify-center shrink-0 border text-sm font-medium transition group-hover:scale-105`}>
                      {details.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className={`text-[10px] font-mono tracking-wider font-extrabold uppercase ${details.textColor}`}>
                          {details.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {new Date(activity.timestamp).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1 font-medium select-all">
                        {activity.message}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-550 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                <Clock className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-bold">No telemetry logs found.</p>
                <p className="text-[10px] text-slate-500 max-w-sm mx-auto mt-0.5">Activities like resume scans, optimizations, and cover letter builds will stream here in real time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Hand: Saved Roles Central */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Saved Star Fits
              </h3>
              <button 
                onClick={() => onNavigate('matching')}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5 transition cursor-pointer"
              >
                More <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {savedJobs.length > 0 ? (
                savedJobs.map((item) => {
                  const jobTitle = item.customJob?.title || "Staff Engineer";
                  const companyName = item.customJob?.company || "Strategic Tech";
                  const loc = item.customJob?.location || "Remote US";
                  const score = item.matchScore || 50;

                  return (
                    <div 
                      key={item.id} 
                      className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-900/90 flex flex-col justify-between group hover:border-slate-800 transition duration-300"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider uppercase ${score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : score >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'}`}>
                          {score}% Match
                        </span>
                        <button 
                          onClick={() => handleRemoveSavedJob(item.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove bookmark"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <h4 className="text-white font-bold text-xs truncate leading-snug">{jobTitle}</h4>
                      <p className="text-slate-400 text-[11px] truncate mt-0.5">{companyName} • {loc}</p>
                      
                      {item.fitSummary && (
                        <p className="text-slate-500 text-[10px] line-clamp-2 mt-2 leading-relaxed italic">
                          "{item.fitSummary}"
                        </p>
                      )}
                      
                      <div className="mt-3 pt-2.5 border-t border-slate-900 flex justify-end">
                        <button 
                          onClick={() => onNavigate('matching')}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                        >
                          Analyze Match Fit <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-550 border border-dashed border-slate-850 rounded-xl bg-slate-950/10">
                  <Star className="h-5 w-5 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No saved jobs yet.</p>
                  <p className="text-[10px] text-slate-655 max-w-[180px] mx-auto mt-0.5 leading-normal">Star jobs on the Match screen to track them here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-transparent border border-indigo-500/10 mt-5">
            <span className="text-[10px] font-mono font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Lightbulb className="h-3 w-3 animate-bounce" /> Optimization Hint
            </span>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Boost your matching precision by generating target cover letters referencing core job requirements.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
