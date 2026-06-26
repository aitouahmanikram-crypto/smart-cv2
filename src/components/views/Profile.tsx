import React, { useState } from "react";
import { User, Save, Bell, Shield, Lock } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

export default function Profile({ token, user }: { token: string, user: any }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    title: user?.title || "",
    bio: user?.bio || ""
  });
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      await apiFetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="font-display text-4xl font-bold text-white tracking-tight">Account Settings</h1>
        <p className="text-slate-400 mt-1">Manage your identity and parsing defaults.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-sm">
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl font-medium transition-colors">
            <User className="h-4.5 w-4.5" /> General Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl font-medium transition-colors">
            <Lock className="h-4.5 w-4.5" /> Password & Security
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl font-medium transition-colors">
            <Bell className="h-4.5 w-4.5" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl font-medium transition-colors">
            <Shield className="h-4.5 w-4.5" /> Privacy
          </button>
        </div>
        
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-6">
            <h3 className="text-lg font-bold text-white mb-2">Public Info</h3>
            
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm font-medium">
                Profile saved successfully!
              </div>
            )}
            
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center gap-6">
               <div className="h-24 w-24 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                 <span className="text-3xl font-bold text-indigo-400">
                   {form.name ? form.name.charAt(0).toUpperCase() : 'U'}
                 </span>
               </div>
               <div>
                  <button type="button" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors border border-slate-700 hover:border-slate-600">
                    Change Avatar
                  </button>
                  <p className="text-xs text-slate-500 mt-2">JPG, GIF or PNG. Max size of 800K</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Title</label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Frontend Engineer"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Short Bio</label>
                <textarea 
                  rows={4}
                  value={form.bio}
                  onChange={e => setForm({...form, bio: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Tell us a little bit about yourself..."
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Email (Read-Only)</label>
                <input 
                  type="email" 
                  disabled
                  value={user?.email || ""}
                  className="w-full bg-slate-950/50 border border-slate-900 rounded-lg py-3 px-4 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {saving ? (
                  <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> Save Profile</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
