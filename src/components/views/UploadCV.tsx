import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X, Sparkles } from "lucide-react";
import { ViewType } from "../Dashboard";
import { apiFetch } from "../../lib/apiClient";

export default function UploadCV({ token, onNavigate }: { token: string, onNavigate: (view: ViewType) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      if (!validTypes.includes(selected.type) && !selected.name.endsWith(".docx")) {
        setError("Currently, only PDF, DOCX, and TXT files are supported for best AI parsing.");
        return;
      }
      setFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      if (!validTypes.includes(droppedFile.type) && !droppedFile.name.endsWith(".docx")) {
        setError("Currently, only PDF, DOCX, and TXT files are supported for best AI parsing.");
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("cvFile", file);
      
      await apiFetch("/api/cvs/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      setSuccess(true);
      setTimeout(() => {
        onNavigate('analysis');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="font-display text-4xl font-bold text-white tracking-tight">Upload Your CV</h1>
        <p className="text-slate-400 mt-1">Upload your PDF, DOCX, or TXT resume to let our AI parser extract and grade your experience.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">CV successfully analyzed! Redirecting to results...</p>
          </div>
          <Sparkles className="h-4 w-4 animate-pulse" />
        </div>
      )}

      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl">
        {!file ? (
          <div 
            className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors rounded-xl p-12 text-center cursor-pointer flex flex-col items-center justify-center group"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="h-16 w-16 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center mb-4 transition-colors">
              <Upload className="h-8 w-8 text-slate-400 group-hover:text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Click or drag & drop to select</h3>
            <p className="text-sm text-slate-500 max-w-sm">Support for PDF, DOCX, and TXT files. Assure your resume is well-formatted.</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept=".txt,.pdf,.docx"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{file.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                disabled={isUploading || success}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading || success}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold tracking-wide shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
            >
              {isUploading ? (
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Analyze Credentials
                </>
              )}
            </button>
            
            {isUploading && (
              <p className="text-center text-xs text-slate-500 font-mono mt-4 animate-pulse">
                Running 34 logic point checks against current industry standards...
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 shadow-lg">
        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" /> How It Works
        </h4>
        <p className="text-sm text-slate-400 leading-relaxed">
          SmartCV uses Google's Gemini AI model to strictly parse the underlying meaning behind your work experience. Unlike traditional regex parsers, our engine understands industry jargon, implied skills, and formatting nuances, matching them directly to live job descriptions.
        </p>
      </div>
    </div>
  );
}
