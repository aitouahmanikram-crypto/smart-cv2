import React, { useState } from "react";
import { PenTool } from "lucide-react";
import { apiFetch } from "../lib/apiClient";

interface CoverLetterGeneratorProps {
  token: string;
  cvs: any[];
  onGenerated: (letter: any) => void;
}

export default function CoverLetterGenerator({ token, cvs, onGenerated }: CoverLetterGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    cvId: cvs.length > 0 ? cvs[0].id : "none",
    jobTitle: "",
    companyName: "",
    recipientName: "",
    jobDescription: "",
    experienceLevel: "",
    skills: ""
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jobTitle || !form.companyName) {
      setError("Please fill in the required fields (Job Title, Company).");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const data = await apiFetch("/api/cover-letters/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          cvId: form.cvId === "none" ? "" : form.cvId
        })
      });

      onGenerated(data);
      setForm({ ...form, jobTitle: "", companyName: "", recipientName: "", jobDescription: "", experienceLevel: "", skills: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={handleGenerate} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <PenTool className="h-5 w-5 text-indigo-400" /> Draft Settings
      </h3>
      
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">Base CV Profile (Optional)</label>
        <select 
          value={form.cvId}
          onChange={e => setForm({...form, cvId: e.target.value})}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="none">No CV (Manual input only)</option>
          {cvs.map(c => <option key={c.id} value={c.id}>{c.fileName}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">Target Company *</label>
        <input 
          type="text" 
          required
          value={form.companyName}
          onChange={e => setForm({...form, companyName: e.target.value})}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Acme Corp"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">Job Title *</label>
        <input 
          type="text" 
          required
          value={form.jobTitle}
          onChange={e => setForm({...form, jobTitle: e.target.value})}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Senior Frontend Engineer"
        />
      </div>
      
      <div>
        <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">Job Description *</label>
        <textarea 
          required
          value={form.jobDescription}
          onChange={e => setForm({...form, jobDescription: e.target.value})}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500 min-h-[100px]"
          placeholder="Paste the job description here..."
        />
      </div>
      
      <div>
        <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">Experience Level</label>
        <select 
          value={form.experienceLevel}
          onChange={e => setForm({...form, experienceLevel: e.target.value})}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Select Level (Optional)</option>
          <option value="Entry-Level">Entry-Level</option>
          <option value="Mid-Level">Mid-Level</option>
          <option value="Senior">Senior</option>
          <option value="Executive">Executive</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">Key Skills (Comma separated)</label>
        <input 
          type="text"
          value={form.skills}
          onChange={e => setForm({...form, skills: e.target.value})}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500"
          placeholder="e.g. React, Node.js, Leadership"
        />
      </div>

      <button 
        type="submit"
        disabled={generating}
        className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Generating...
          </>
        ) : "Generate Letter"}
      </button>
    </form>
  );
}
