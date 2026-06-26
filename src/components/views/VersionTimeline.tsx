import React from "react";
import { History, RefreshCw } from "lucide-react";

export default function VersionTimeline({ versions, onRestore }: { versions: any[], onRestore: (versionId: string) => void }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <History className="h-5 w-5 text-indigo-400" /> Version Timeline
      </h3>
      <div className="space-y-4">
        {versions.map((v) => (
          <div key={v.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-900">
            <div>
              <p className="text-white font-bold">Version {v.versionNumber}</p>
              <p className="text-xs text-slate-400">{new Date(v.createdAt).toLocaleString()} • ATS Score: {v.atsScore}</p>
            </div>
            <button
              onClick={() => onRestore(v.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
