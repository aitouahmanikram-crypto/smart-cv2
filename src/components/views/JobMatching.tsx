import React, { useState, useEffect } from "react";
import { Target, Search, Building, MapPin, DollarSign, ExternalLink, Zap, CheckCircle, AlertTriangle, Star } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { apiFetch } from "../../lib/apiClient";

function AnimatedScore({ score, className }: { score: number, className?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest) + "%");

  useEffect(() => {
    const controls = animate(count, score, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [score, count]);

  return <motion.span className={className}>{rounded}</motion.span>;
}

export default function JobMatching({ token }: { token: string }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [cvs, setCvs] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [savedMatchIds, setSavedMatchIds] = useState<Record<string, boolean>>({});
  
  const [loading, setLoading] = useState(true);
  const [matchingStatus, setMatchingStatus] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [selectedCv, setSelectedCv] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, cvData, matchesData, savedData] = await Promise.all([
          apiFetch("/api/jobs", { headers: { "Authorization": `Bearer ${token}` } }),
          apiFetch("/api/cvs", { headers: { "Authorization": `Bearer ${token}` } }),
          apiFetch("/api/matches", { headers: { "Authorization": `Bearer ${token}` } }),
          apiFetch("/api/matches/saved", { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        
        setJobs(jobsData);
        setCvs(cvData);
        setMatches(matchesData);
        
        const savedMap: Record<string, boolean> = {};
        if (Array.isArray(savedData)) {
          savedData.forEach((m: any) => {
            savedMap[m.id] = true;
          });
        }
        setSavedMatchIds(savedMap);
        
        if (cvData.length > 0) {
          setSelectedCv(cvData[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const toggleBookmark = async (matchId: string) => {
    const isCurrentlySaved = savedMatchIds[matchId];
    try {
      await apiFetch(`/api/matches/save/${matchId}`, {
        method: isCurrentlySaved ? "DELETE" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      setSavedMatchIds(prev => ({
        ...prev,
        [matchId]: !isCurrentlySaved
      }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMatch = async (jobId: string) => {
    if (!selectedCv) {
      setError("Please select a CV first to run diagnostics.");
      return;
    }

    setMatchingStatus(prev => ({ ...prev, [jobId]: true }));
    setError("");

    try {
      const data = await apiFetch("/api/matches/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ cvId: selectedCv, jobId })
      });
      
      setMatches([data, ...matches.filter(m => !(m.cvId === selectedCv && m.jobId === jobId))]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMatchingStatus(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const [isCustomMatching, setIsCustomMatching] = useState(false);
  const [customForm, setCustomForm] = useState({
    jobTitle: "",
    companyName: "",
    jobDescription: ""
  });

  const handleCustomMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCv) {
      setError("Please select a CV first to run diagnostics.");
      return;
    }

    if (!customForm.jobTitle || !customForm.jobDescription) {
      setError("Please fill in Job Title and Description.");
      return;
    }

    setIsCustomMatching(true);
    setError("");

    try {
      const data = await apiFetch("/api/matches/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          cvId: selectedCv,
          ...customForm
        })
      });
      
      setMatches([data, ...matches]);
      setJobs([data.customJob, ...jobs]);
      setCustomForm({ jobTitle: "", companyName: "", jobDescription: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCustomMatching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight">Active Job Matches</h1>
          <p className="text-slate-400 mt-1">Discover roles and let the AI score your compatibility.</p>
        </div>
        
        {cvs.length > 0 && (
          <div className="flex items-center gap-3">
             <span className="text-xs text-slate-500 font-medium uppercase font-mono tracking-wider">Scoring Profile:</span>
             <select 
               className="bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
               onChange={(e) => setSelectedCv(e.target.value)}
               value={selectedCv}
             >
               {cvs.map(c => (
                 <option key={c.id} value={c.id}>{c.fileName}</option>
               ))}
             </select>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {cvs.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-sm font-medium">
          Note: You must upload and parse a CV before you can calculate match scores against job postings.
        </div>
      )}

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-400" /> Custom Match Analysis
        </h3>
        <form onSubmit={handleCustomMatch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">Job Title *</label>
              <input 
                type="text" 
                value={customForm.jobTitle}
                onChange={e => setCustomForm({...customForm, jobTitle: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="e.g. Senior Frontend Engineer"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">Company Name</label>
              <input 
                type="text" 
                value={customForm.companyName}
                onChange={e => setCustomForm({...customForm, companyName: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="e.g. TechCorp Inc."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">Job Description *</label>
            <textarea 
              value={customForm.jobDescription}
              onChange={e => setCustomForm({...customForm, jobDescription: e.target.value})}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500 text-sm resize-none custom-scrollbar"
              placeholder="Paste the full job description here..."
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCustomMatching || !selectedCv}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {isCustomMatching ? (
                <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing Match...</>
              ) : (
                <><Target className="h-4 w-4" /> Run Custom Match</>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.map((job) => {
           const existingMatch = matches.find(m => m.jobId === job.id && m.cvId === selectedCv);
           const isAnalyzing = matchingStatus[job.id];
           
           return (
             <div key={job.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col justify-between group relative">
               <div>
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{job.title}</h3>
                     <p className="text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                       <Building className="h-4 w-4" /> {job.company}
                     </p>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     {existingMatch && (
                       <button
                         onClick={() => toggleBookmark(existingMatch.id)}
                         className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                           savedMatchIds[existingMatch.id] 
                             ? "bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30" 
                             : "bg-slate-950 border-slate-800 text-slate-500 hover:text-white"
                         }`}
                         title={savedMatchIds[existingMatch.id] ? "Remove star" : "Star job match"}
                       >
                         <Star className={`h-4 w-4 ${savedMatchIds[existingMatch.id] ? "fill-amber-400" : ""}`} />
                       </button>
                     )}

                     {existingMatch && (
                       <div className={`px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center shrink-0 ${existingMatch.matchScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : existingMatch.matchScore >= 60 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                          <AnimatedScore score={existingMatch.matchScore} className={`text-xl font-bold ${existingMatch.matchScore >= 80 ? 'text-emerald-400' : existingMatch.matchScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`} />
                          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider">Match</span>
                       </div>
                     )}
                   </div>
                 </div>
                 
                 <div className="flex flex-wrap gap-3 mb-4">
                    <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800"><MapPin className="h-3 w-3" /> {job.location}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800"><DollarSign className="h-3 w-3" /> {job.salary}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">{job.type}</span>
                 </div>
                 
                 <p className="text-sm text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                   {job.description}
                 </p>

                 {existingMatch && (
                   <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-slate-900 space-y-4">
                     <div className="space-y-2 mb-3">
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-300 font-semibold tracking-wide">Match Score</span>
                         <AnimatedScore score={existingMatch.matchScore} className={`font-bold ${existingMatch.matchScore >= 80 ? 'text-emerald-400' : existingMatch.matchScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`} />
                       </div>
                       <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 relative">
                         <motion.div className={`absolute left-0 top-0 h-full rounded-full ${existingMatch.matchScore >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : existingMatch.matchScore >= 60 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} initial={{ width: "0%" }} animate={{ width: `${existingMatch.matchScore}%` }} transition={{ duration: 1.5, ease: "easeOut" }}></motion.div>
                       </div>
                     </div>
                     
                     <p className="text-sm text-indigo-300 font-medium leading-relaxed">✨ {existingMatch.fitSummary}</p>
                     
                     <div className="grid grid-cols-2 gap-4 pt-2">
                       <div>
                         <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono mb-2">
                           <CheckCircle className="h-3 w-3" /> Core Strengths
                         </span>
                         <ul className="space-y-1">
                           {existingMatch.strengths.slice(0, 3).map((s: string, i: number) => <li key={i} className="text-xs text-slate-300 truncate">• {s}</li>)}
                         </ul>
                       </div>
                       <div>
                         <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 uppercase tracking-wider font-mono mb-2">
                           <AlertTriangle className="h-3 w-3" /> Potential Gaps
                         </span>
                         <ul className="space-y-1">
                           {existingMatch.gaps.slice(0, 3).map((g: string, i: number) => <li key={i} className="text-xs text-slate-300 truncate">• {g}</li>)}
                         </ul>
                       </div>
                     </div>
                     <div className="mt-2 pt-3 border-t border-slate-800 flex items-center justify-between">
                         <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Strategy: {existingMatch.applicationStrategy}</span>
                     </div>
                   </div>
                 )}
               </div>
               
               <div className="pt-4 border-t border-slate-800 flex justify-between items-center mt-auto">
                 <button 
                  className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                 >
                   View Source <ExternalLink className="h-3 w-3" />
                 </button>
                 
                 <button
                   onClick={() => handleMatch(job.id)}
                   disabled={isAnalyzing || !selectedCv}
                   className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md ${
                     existingMatch 
                       ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700" 
                       : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                   } disabled:opacity-50`}
                 >
                   {isAnalyzing ? (
                     <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                   ) : existingMatch ? (
                     <><Zap className="h-4 w-4" /> Re-Scan</>
                   ) : (
                     <><Target className="h-4 w-4" /> Match</>
                   )}
                 </button>
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
}
