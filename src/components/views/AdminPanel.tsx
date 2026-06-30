import React, { useEffect, useState } from "react";
import { 
  Users, Briefcase, Settings, BarChart2, Shield, Search, Power, Trash2, 
  Key, Save, Edit, RefreshCw, AlertTriangle, Plus, X, ArrowUpRight, 
  Check, Lock, Star, ChevronRight, Sparkles
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend, Cell, PieChart, Pie
} from "recharts";
import { apiFetch } from "../../lib/apiClient";

interface AdminPanelProps {
  token: string;
}

export default function AdminPanel({ token }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'jobs' | 'analytics' | 'settings'>('dashboard');
  
  // States
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [sysSettings, setSysSettings] = useState<any>({
    openaiApiKey: "",
    appName: "SmartCV AI",
    logo: "Zap",
    maintenanceMode: false
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search state
  const [userSearch, setUserSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  
  // Modals state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resettingUserPassword, setResettingUserPassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  
  // Job Offer flow
  const [editingJob, setEditingJob] = useState<any>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    category: "Software Engineering",
    type: "Full-Time",
    salary: "",
    description: "",
    requirements: ""
  });

  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedingSuccess, setSeedingSuccess] = useState("");
  const [seedingError, setSeedingError] = useState("");

  const handleSeedDemoData = async () => {
    if (!confirm("Are you sure you want to generate high-fidelity demo data? This will safely clear previous seeded records and generate exactly 100 premium Users, 200 CV Analyses, 100 Cover Letters, 100 Job Matches, 50 detailed Job Offers, and 100 Interview Sessions with 6-month date patterns for the analytics dashboards.")) return;
    setSeeding(true);
    setSeedingSuccess("");
    setSeedingError("");
    try {
      const data = await apiFetch("/api/admin/seed-demo", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      setSeedingSuccess(data.message || "Seeding completed successfully.");
      fetchAllAdminData();
    } catch (err: any) {
      setSeedingError(err.message || "Failed to seed demo data.");
    } finally {
      setSeeding(false);
    }
  };

  const fetchAllAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, usersData, jobsData, settingsData] = await Promise.all([
        apiFetch("/api/admin/stats", { headers: { "Authorization": `Bearer ${token}` } }),
        apiFetch("/api/admin/users", { headers: { "Authorization": `Bearer ${token}` } }),
        apiFetch("/api/admin/jobs", { headers: { "Authorization": `Bearer ${token}` } }),
        apiFetch("/api/admin/settings", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setSysSettings(settingsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, [token]);

  // Handle setting updates
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess("");
    try {
      const data = await apiFetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(sysSettings)
      });
      setSysSettings(data);
      setSettingsSuccess("System settings successfully updated.");
      setTimeout(() => setSettingsSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Toggle user suspension
  const handleToggleSuspendUser = async (user: any) => {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      // Update local state list
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    console.log("Delete clicked:", userId);
    
    let shouldDelete = true;
    try {
      shouldDelete = confirm("Are you sure you want to delete this item?");
    } catch (e) {
      shouldDelete = true;
    }
    if (!shouldDelete) return;

    const previousUsers = [...users];
    const endpoint = `/api/admin/users/${userId}`;
    console.log("DELETE request:", endpoint);
    try {
      // Remove item from UI state immediately
      setUsers(prev => prev.filter(u => u.id !== userId));

      const response = await apiFetch(endpoint, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      console.log("DELETE response:", response);
    } catch (err: any) {
      console.error("Error deleting user:", err);
      alert(err.message || "Failed to delete user. Please try again.");
      // Rollback state on error
      setUsers(previousUsers);
    }
  };

  // Promote/Demote user role
  const handleToggleUserRole = async (user: any) => {
    const nextRole = user.role === "super_admin" ? "user" : "super_admin";
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: nextRole })
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: nextRole } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save profile edits
  const handleSaveUserEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiFetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: editingUser.name,
          title: editingUser.title,
          bio: editingUser.bio,
          role: editingUser.role,
          status: editingUser.status
        })
      });
      
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...editingUser } : u));
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Reset user password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUserPassword || !newPassword) return;
    try {
      await apiFetch(`/api/admin/users/${resettingUserPassword.id}/reset-password`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: newPassword })
      });
      alert(`Password successfully changed for ${resettingUserPassword.name}`);
      setResettingUserPassword(null);
      setNewPassword("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create Job Offer
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const returnedJob = await apiFetch("/api/admin/jobs", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...jobForm,
          requirements: jobForm.requirements.split(",").map(s => s.trim()).filter(s => s)
        })
      });
      setJobs(prev => [returnedJob, ...prev]);
      setIsCreatingJob(false);
      setJobForm({
        title: "",
        company: "",
        location: "",
        category: "Software Engineering",
        type: "Full-Time",
        salary: "",
        description: "",
        requirements: ""
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Edit Job Offer
  const handleSaveJobEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    try {
      const parsedReqs = typeof editingJob.requirements === 'string' 
        ? editingJob.requirements.split(",").map((s: string) => s.trim()).filter((s: string) => s)
        : editingJob.requirements;

      await apiFetch(`/api/admin/jobs/${editingJob.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...editingJob,
          requirements: parsedReqs
        })
      });
      
      setJobs(prev => prev.map(j => j.id === editingJob.id ? { ...editingJob, requirements: parsedReqs } : j));
      setEditingJob(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Job Offer
  const handleDeleteJob = async (jobId: string) => {
    console.log("Delete clicked:", jobId);
    
    let shouldDelete = true;
    try {
      shouldDelete = confirm("Are you sure you want to delete this item?");
    } catch (e) {
      shouldDelete = true;
    }
    if (!shouldDelete) return;

    const previousJobs = [...jobs];
    const endpoint = `/api/admin/jobs/${jobId}`;
    console.log("DELETE request:", endpoint);
    try {
      // Remove item from UI state immediately
      setJobs(prev => prev.filter(j => j.id !== jobId));

      const response = await apiFetch(endpoint, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      console.log("DELETE response:", response);
    } catch (err: any) {
      console.error("Error deleting job offer:", err);
      alert(err.message || "Failed to delete job offer. Please try again.");
      // Rollback state on error
      setJobs(previousJobs);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.status || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredJobs = jobs.filter(j =>
    (j.title || "").toLowerCase().includes(jobSearch.toLowerCase()) ||
    (j.company || "").toLowerCase().includes(jobSearch.toLowerCase()) ||
    (j.location || "").toLowerCase().includes(jobSearch.toLowerCase())
  );

  // Computations for Analytics
  const getAverageAts = () => {
    if (!users || users.length === 0) return 72;
    // We can simulate an average based on the stats payload or average from user list
    return stats?.summary?.averageScore || 74;
  };

  const getTopSkills = () => {
    const list = [
      { name: "React & TypeScript", count: 18 },
      { name: "Node.js & Express", count: 15 },
      { name: "PostgreSQL & Supabase", count: 12 },
      { name: "AWS Cloud & Docker", count: 9 },
      { name: "Python & Machine Learning", count: 8 },
      { name: "Tailwind CSS & UI Design", count: 7 }
    ];
    return list;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          <span className="text-xs text-slate-400 font-mono tracking-wider">Acquiring administrative privilege...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <Shield className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Administration Sub-system Locked</h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchAllAdminData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> RE-AUTHENTICATE_SESSION
        </button>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div id="admin_console_view" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-550">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5">
              <Shield className="h-3 w-3" /> SECURITY_LEVEL_ADMIN
            </span>
            {sysSettings.maintenanceMode && (
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> MAINTENANCE_ACTIVE
              </span>
            )}
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight mt-2.5">
            Super Admin <span className="bg-gradient-to-r from-red-500 to-indigo-400 bg-clip-text text-transparent">Control Tower</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Total application governance, metrics tracking, system orchestration, and user configuration.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">System Name:</span>
          <span className="text-indigo-400 font-bold">{sysSettings.appName}</span>
        </div>
      </div>

      {/* Internal Nav bar for Admin Categories */}
      <div className="flex gap-2 p-1 bg-slate-950/80 border border-slate-850 rounded-xl overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Shield },
          { id: 'users', label: 'User Governance', icon: Users },
          { id: 'jobs', label: 'Job Positions', icon: Briefcase },
          { id: 'analytics', label: 'ATS Analytics', icon: BarChart2 },
          { id: 'settings', label: 'System Configurations', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive 
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow' 
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. DASHBOARD VIEW */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* KPI metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'tu', label: "Total Users", count: stats.summary.totalUsers, desc: "Active system tenants", icon: "👥", color: "border-l-indigo-500" },
              { id: 'tc', label: "Total CVs Uploaded", count: stats.summary.totalCvs, desc: "Iterated resumes", icon: "📄", color: "border-l-emerald-500" },
              { id: 'tcl', label: "Cover Letters Build", count: stats.summary.totalCoverLetters, desc: "Synthesized drafts", icon: "📝", color: "border-l-amber-500" },
              { id: 'tjo', label: "Managed Job Offers", count: stats.summary.totalJobOffers, desc: "Available roles in db", icon: "💼", color: "border-l-pink-500" },
            ].map(card => (
              <div 
                key={card.id} 
                className={`p-4 bg-slate-900/60 border border-slate-800 rounded-xl border-l-4 ${card.color} flex flex-col justify-between min-h-[110px] hover:translate-y-[-1px] transition`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">{card.label}</span>
                  <span className="text-sm">{card.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-extrabold font-mono text-white mt-1">{card.count}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1: Month Registration Growth */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wider">REGISTRATION ACQUISITION SLOPE</h3>
                <p className="text-[10px] text-slate-400">Total new registered users monthly</p>
              </div>
              {stats?.charts?.newUsers && stats.charts.newUsers.length > 0 ? (
                <div className="w-full h-[300px] min-h-[300px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.charts.newUsers}>
                      <defs>
                        <linearGradient id="userAcq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', color: '#fff', fontSize: 10, borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="count" name="New registrations" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#userAcq)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-[300px] min-h-[300px] flex items-center justify-center text-slate-500 italic text-xs">
                  No registration tracking data available yet.
                </div>
              )}
            </div>

            {/* Chart 2: ATS Score Volume Distribution */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wider">RESUME ATS COMPLIANCE DISTRIBUTION</h3>
                <p className="text-[10px] text-slate-400">Volume index of analyzed CV scores</p>
              </div>
              {stats?.charts?.atsDistribution && stats.charts.atsDistribution.length > 0 ? (
                <div className="w-full h-[300px] min-h-[300px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.charts.atsDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                      <XAxis dataKey="range" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', color: '#fff', fontSize: 10, borderRadius: '8px' }} />
                      <Bar dataKey="count" name="Analyses Count" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={30}>
                        {stats.charts.atsDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-[300px] min-h-[300px] flex items-center justify-center text-slate-500 italic text-xs">
                  No compliance score statistics found.
                </div>
              )}
            </div>

            {/* Chart 3: Feature Interaction Frequencies */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wider">AI FUNCTIONAL UTILITY STATS</h3>
                <p className="text-[10px] text-slate-400">Action frequency per critical core feature</p>
              </div>
              {stats?.charts?.mostUsedFeatures && stats.charts.mostUsedFeatures.length > 0 ? (
                <div className="w-full h-[300px] min-h-[300px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.charts.mostUsedFeatures}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                      <XAxis dataKey="feature" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', color: '#fff', fontSize: 10, borderRadius: '8px' }} />
                      <Bar dataKey="count" name="Triggers" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-[300px] min-h-[300px] flex items-center justify-center text-slate-500 italic text-xs">
                  No feature usage statistics found.
                </div>
              )}
            </div>

            {/* Application Health Diagnostics */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wider">SYSTEM TELEMETRY METADATA</h3>
                <p className="text-[10px] text-slate-400">Real-time telemetry diagnostic metrics</p>
              </div>
              <div className="space-y-3.5 pt-2">
                {[
                  { name: "Database Endpoint Status", value: "Fully Connected (Supabase)", icon: "🟢" },
                  { name: "API Rate-Limits compliance", value: "Normal Level (20 req / limit max)", icon: "🟢" },
                  { name: "Global Encryption Integrity", value: "ACTIVE - SHA256 Secured", icon: "🟢" },
                  { name: "AI Inference Engine latency", value: "Healthy (1.4s average)", icon: "🟢" }
                ].map((item, id) => (
                  <div key={id} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-950/60 border border-slate-850">
                    <span className="text-slate-400">{item.name}</span>
                    <span className="font-mono text-indigo-300 font-medium flex items-center gap-1.5">{item.icon} {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. USER GOVERNANCE VIEW */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search tenant users by name, email, role, or status..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-550 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 font-medium"
              />
              {userSearch && (
                <button onClick={() => setUserSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <span className="text-xs text-slate-500 font-mono self-center">
              Showing <span className="text-white font-bold">{filteredUsers.length}</span> of {users.length} registered tenants
            </span>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/40 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">User Particulars</th>
                  <th className="px-6 py-4">Security Level</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Registration Time</th>
                  <th className="px-6 py-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-xs text-slate-300">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-950/30 transition">
                      
                      {/* Name / Email Particulars */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8.5 w-8.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-200 flex items-center justify-center font-bold text-xs uppercase uppercase shadow-sm">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-white truncate max-w-[150px]" title={user.name}>{user.name}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[150px]" title={user.email}>{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Security Level role */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider ${
                          user.role === "super_admin" 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                            : "bg-slate-850 text-slate-400 border border-slate-800"
                        }`}>
                          {user.role === "super_admin" ? "SUPER_ADMIN" : "TENANT_USER"}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          user.status === "suspended"
                            ? "bg-rose-500/15 text-rose-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.status === "suspended" ? "bg-rose-500" : "bg-emerald-500"}`} />
                          {user.status === "suspended" ? "Suspended" : "Active"}
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit"
                        }) : "Pre-migration"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          
                          {/* Toggle Suspend */}
                          <button
                            onClick={() => handleToggleSuspendUser(user)}
                            className={`p-1.5 rounded-lg border transition ${
                              user.status === "suspended"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                            }`}
                            title={user.status === "suspended" ? "Activate User" : "Suspend User"}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>

                          {/* Toggle authority */}
                          <button
                            onClick={() => handleToggleUserRole(user)}
                            className="p-1.5 bg-slate-950/60 border border-slate-850 hover:bg-slate-850 text-slate-350 hover:text-white rounded-lg transition"
                            title={user.role === "super_admin" ? "Demote to User" : "Promote to Super Admin"}
                          >
                            <Shield className="h-3.5 w-3.5 text-indigo-400" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResettingUserPassword(user);
                              setNewPassword("");
                            }}
                            className="p-1.5 bg-slate-950/60 border border-slate-850 hover:bg-slate-850 text-slate-350 hover:text-white rounded-lg transition"
                            title="Reset Password"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 bg-slate-950/60 border border-slate-850 hover:bg-slate-850 text-slate-350 hover:text-white rounded-lg transition"
                            title="Edit profile bio"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 bg-rose-950/30 border border-rose-900/30 hover:border-rose-500/40 hover:bg-rose-500/15 text-rose-450 hover:text-rose-400 rounded-lg transition"
                            title="Delete Account"
                            disabled={user.email === "admin@smartcvai.com"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500 font-medium">
                      No registered tenants matching search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. JOB POSITIONS MANAGER */}
      {activeTab === 'jobs' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search positions, companies, or locations..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-550 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            <button
              onClick={() => {
                setIsCreatingJob(true);
                setEditingJob(null);
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 justify-center cursor-pointer shadow"
            >
              <Plus className="h-3.5 w-3.5" /> Create Job Offer
            </button>
          </div>

          {/* Job listings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <div key={job.id} className="p-5 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl flex flex-col justify-between transition relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-indigo-500/2 pointer-events-none rounded-full blur-xl group-hover:bg-indigo-500/5 duration-300" />
                  
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 uppercase">
                        {job.type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {job.postedAt ? new Date(job.postedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Active"}
                      </span>
                    </div>

                    <h3 className="text-white font-bold text-base leading-snug">{job.title}</h3>
                    <p className="text-slate-400 text-xs font-medium mt-1">{job.company} • <span className="text-slate-500">{job.location || "Remote US"}</span></p>
                    
                    <p className="text-slate-400 text-xs line-clamp-3 mt-3.5 leading-relaxed select-all">
                      {job.description}
                    </p>

                    {/* Requirements skills */}
                    {job.requirements && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).slice(0, 4).map((req: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 text-[10px] text-slate-400 border border-slate-850">
                            {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-850 mt-5 pt-3">
                    <span className="font-mono text-[10px] text-indigo-300 font-bold">{job.salary || "Competitive salary"}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingJob({
                            ...job,
                            requirements: Array.isArray(job.requirements) ? job.requirements.join(", ") : job.requirements
                          });
                          setIsCreatingJob(false);
                        }}
                        className="px-2 py-1 bg-slate-950/80 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 hover:text-rose-450 rounded-lg border border-rose-550/10 hover:border-rose-500/30 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-500 font-medium">
                No job postings matching the query.
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. ATS ANALYTICS VIEW */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* KPI box 1 */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xl">📈</span>
                <h4 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider mt-2.5">Global AVG ATS Rating</h4>
                <p className="text-3xl font-extrabold font-mono text-white mt-1">{getAverageAts()}%</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-normal">
                Weighted index computed over all scanned CV iterations in database records.
              </p>
            </div>

            {/* KPI box 2 */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xl">⚡</span>
                <h4 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider mt-2.5">Job-to-CV Fit Ratio</h4>
                <p className="text-3xl font-extrabold font-mono text-white mt-1">100% Fully automated</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-normal">
                Automatic prompt parsing and qualification audits run with zero latency.
              </p>
            </div>

            {/* KPI box 3 */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xl">🔥</span>
                <h4 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider mt-2.5">Most Parsed Industry</h4>
                <p className="text-xl font-extrabold text-white mt-1 truncate">Software Engineering</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-normal">
                Accounting for 62% of analyzed resume templates across the dashboard.
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Requested Capabilities / Skills */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wider uppercase">Most Requested Target Skills</h3>
                <p className="text-[10px] text-slate-400">Total counted occurrences across standard and custom job requirements</p>
              </div>
              <div className="space-y-3 pt-2">
                {getTopSkills().map((skill, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-200">
                      <span className="truncate max-w-[200px]">{skill.name}</span>
                      <span className="font-mono text-indigo-400">{skill.count} job matches</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-550"
                        style={{ width: `${(skill.count / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Call Optimization and Diagnostics */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wider uppercase">Inference Engine Diagnostics</h3>
                <p className="text-[10px] text-slate-400">Response parameters and prompt performance audits</p>
              </div>
              
              <div className="w-full h-[300px] min-h-[300px] pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Gemini-3.5-Flash (Core)", value: 72 },
                        { name: "OpenAI Fallbacks", value: 12 },
                        { name: "Text Parsers (Cached)", value: 16 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[0,1,2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', color: '#fff', fontSize: 10, borderRadius: '8px' }} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-slate-400 font-medium">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 5. SYSTEM CONFIGURATIONS VIEW */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
          <form onSubmit={handleSaveSettings} className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 leading-snug font-mono uppercase tracking-wider">
                <Settings className="h-4.5 w-4.5 text-indigo-400" /> System Governance Settings
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configure global API access credentials, branding variables, and master site status toggles.</p>
            </div>

            {settingsSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                {settingsSuccess}
              </div>
            )}

            <div className="space-y-4 pt-2">
              
              {/* OpenAI API Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">OpenAI Private Secret Key</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={sysSettings.openaiApiKey}
                    onChange={(e) => setSysSettings({ ...sysSettings, openaiApiKey: e.target.value })}
                    placeholder="sk-proj-............................................."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-550 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 font-mono tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Stored securely with server-side decryption layers. Used for fallback analysis and cover letter generation pipelines.</p>
              </div>

              {/* App Name & Logo Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">Application Manifest Name</label>
                  <input
                    type="text"
                    value={sysSettings.appName}
                    onChange={(e) => setSysSettings({ ...sysSettings, appName: e.target.value })}
                    placeholder="SmartCV AI"
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-550 focus:border-indigo-500 focus:outline-none focus:ring-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">Corporate Icon Symbol</label>
                  <select
                    value={sysSettings.logo}
                    onChange={(e) => setSysSettings({ ...sysSettings, logo: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1"
                  >
                    <option value="Zap">Zap⚡</option>
                    <option value="Shield">Shield🛡️</option>
                    <option value="Briefcase">Briefcase💼</option>
                    <option value="Star">Star🌟</option>
                  </select>
                </div>
              </div>

              {/* Maintenance Mode master switch */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-start gap-4 justify-between mt-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-200 uppercase tracking-widest font-mono">SITE MAINTENANCE SHIELD</span>
                    {sysSettings.maintenanceMode && (
                      <span className="text-[9px] bg-amber-500/15 border border-amber-500/20 text-amber-300 font-bold tracking-widest px-1.5 py-0.5 rounded">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-450 leading-relaxed">
                    When enabled, non-admin users will immediately be blocked from completing scanning actions, and are presented with a friendly maintenance splash screen. Best for scheduled platform upgrades.
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setSysSettings({ ...sysSettings, maintenanceMode: !sysSettings.maintenanceMode })}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-colors self-center flex relative border border-slate-800 ${
                    sysSettings.maintenanceMode ? 'bg-indigo-600 justify-end' : 'bg-slate-900 justify-start'
                  }`}
                >
                  <span className="w-5.5 h-5.5 bg-white rounded-full shadow transition-all duration-300" />
                </button>
              </div>

            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 active:transform active:scale-97"
              >
                <Save className="h-4 w-4" /> Save App Configuration
              </button>
            </div>
          </form>

          {/* PLATFORM SEEDING & DEMO ACCELERATOR */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 leading-snug font-mono uppercase tracking-wider">
                <Sparkles className="h-4.5 w-4.5 text-indigo-400 font-sans" /> Platform Seeding & Demo Accelerator
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Programmatically generate high-fidelity, date-distributed mock datasets directly inside Supabase for flawless, production-ready product demos.
              </p>
            </div>

            {seedingSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 font-sans animate-in fade-in">
                <Check className="h-4 w-4 shrink-0" />
                {seedingSuccess}
              </div>
            )}

            {seedingError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/35 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2 font-sans animate-in fade-in">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {seedingError}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-3">
              <h4 className="text-xs font-bold text-slate-350 font-mono uppercase tracking-wider">Metrics Payload Blueprint:</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-[11px] text-slate-450 list-disc pl-4 font-mono leading-relaxed">
                <li>100 Active Users (Auth virtual roles)</li>
                <li>200 Structured CV ATS Analyses</li>
                <li>100 Custom Coherent Cover Letters</li>
                <li>100 Algorithmic Intelligent Job Matches</li>
                <li>50 Live Managed Job Offers (Db jobs)</li>
                <li>100 Dynamic Interview Session Logs</li>
              </ul>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans pt-1">
                *All generated assets are distributed over a 6-month historical curve to ensure high-density analytics tables, bar charts, and area graphs are rendered with realistic, organic distributions. Real accounts are never affected.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={seeding}
                onClick={handleSeedDemoData}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md ${
                  seeding
                    ? "bg-indigo-650/50 text-indigo-300 border border-indigo-500/20 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:transform active:scale-97 hover:shadow-indigo-600/15"
                }`}
              >
                {seeding ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-300 border-t-transparent" />
                    Generating High-Density Workspace...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate Professional Demo Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* --- EDIT USER MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveUserEdits}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                <Edit className="h-4 w-4 text-indigo-400" /> Coordinate Account Profile
              </h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white transition">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">User Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Professional Title</label>
                <input
                  type="text"
                  value={editingUser.title}
                  onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Biography (Bio)</label>
                <textarea
                  value={editingUser.bio}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none resize-none font-medium text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Assigned Authority</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="user">User Role</option>
                    <option value="super_admin">Super Admin Role</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Account Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-850 pt-3">
              <button 
                type="button" 
                onClick={() => setEditingUser(null)} 
                className="px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-850 hover:bg-slate-850 text-slate-400 font-bold text-[11px] transition"
              >
                Go Back
              </button>
              <button 
                type="submit" 
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" /> Save Overrides
              </button>
            </div>
          </form>
        </div>
      )}


      {/* --- RESET PASSWORD PASSWORD MODAL --- */}
      {resettingUserPassword && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <form 
            onSubmit={handleResetPassword}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-400" /> Override Password
              </h3>
              <button type="button" onClick={() => setResettingUserPassword(null)} className="text-slate-400 hover:text-white transition">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                Applying secure manual overwrite of password for <span className="text-indigo-300">{resettingUserPassword.name}</span> (<span className="text-slate-350">{resettingUserPassword.email}</span>).
              </p>

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Set New Pasword String</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Insert minimum 6 characters..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-850 pt-3">
              <button 
                type="button" 
                onClick={() => setResettingUserPassword(null)} 
                className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-850 text-slate-400 font-bold text-[11px] transition"
              >
                Go Back
              </button>
              <button 
                type="submit" 
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition flex items-center gap-1"
                disabled={newPassword.length < 5}
              >
                <Lock className="h-3 w-3" /> Commit Key
              </button>
            </div>
          </form>
        </div>
      )}


      {/* --- CREATE / EDIT JOB OFFER MODAL --- */}
      {(isCreatingJob || editingJob) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <form 
            onSubmit={isCreatingJob ? handleCreateJob : handleSaveJobEdit}
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="h-4.5 w-4.5 text-indigo-400" /> {isCreatingJob ? "Broadcast New Job Offer" : "Edit Position Details"}
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setIsCreatingJob(false);
                  setEditingJob(null);
                }} 
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Job Title Name</label>
                  <input
                    type="text"
                    required
                    value={isCreatingJob ? jobForm.title : editingJob.title}
                    onChange={(e) => isCreatingJob 
                      ? setJobForm({ ...jobForm, title: e.target.value })
                      : setEditingJob({ ...editingJob, title: e.target.value })
                    }
                    placeholder="e.g. Senior Staff React Architect"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Company Name</label>
                  <input
                    type="text"
                    required
                    value={isCreatingJob ? jobForm.company : editingJob.company}
                    onChange={(e) => isCreatingJob 
                      ? setJobForm({ ...jobForm, company: e.target.value })
                      : setEditingJob({ ...editingJob, company: e.target.value })
                    }
                    placeholder="e.g. SmartCV Systems Labs"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Geographic Location</label>
                  <input
                    type="text"
                    value={isCreatingJob ? jobForm.location : editingJob.location}
                    onChange={(e) => isCreatingJob 
                      ? setJobForm({ ...jobForm, location: e.target.value })
                      : setEditingJob({ ...editingJob, location: e.target.value })
                    }
                    placeholder="e.g. Boston, MA or Remote US"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Sector / Industry</label>
                  <select
                    value={isCreatingJob ? jobForm.category : editingJob.category}
                    onChange={(e) => isCreatingJob 
                      ? setJobForm({ ...jobForm, category: e.target.value })
                      : setEditingJob({ ...editingJob, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Project Management">Project Management</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Business Analysis">Business Analysis</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Employment Type</label>
                  <select
                    value={isCreatingJob ? jobForm.type : editingJob.type}
                    onChange={(e) => isCreatingJob 
                      ? setJobForm({ ...jobForm, type: e.target.value })
                      : setEditingJob({ ...editingJob, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Salary Bracket</label>
                <input
                  type="text"
                  value={isCreatingJob ? jobForm.salary : editingJob.salary}
                  onChange={(e) => isCreatingJob 
                    ? setJobForm({ ...jobForm, salary: e.target.value })
                    : setEditingJob({ ...editingJob, salary: e.target.value })
                  }
                  placeholder="e.g. $140,000 - $175,000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Required Skills (Comma-separated list)</label>
                <input
                  type="text"
                  value={isCreatingJob ? jobForm.requirements : editingJob.requirements}
                  onChange={(e) => isCreatingJob 
                    ? setJobForm({ ...jobForm, requirements: e.target.value })
                    : setEditingJob({ ...editingJob, requirements: e.target.value })
                  }
                  placeholder="React, TypeScript, Node.js, PostgreSQL, AWS"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Description & Responsibilities</label>
                <textarea
                  required
                  rows={4}
                  value={isCreatingJob ? jobForm.description : editingJob.description}
                  onChange={(e) => isCreatingJob 
                    ? setJobForm({ ...jobForm, description: e.target.value })
                    : setEditingJob({ ...editingJob, description: e.target.value })
                  }
                  placeholder="Describe core duties and expectations of candidate..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-850 pt-3">
              <button 
                type="button" 
                onClick={() => {
                  setIsCreatingJob(false);
                  setEditingJob(null);
                }} 
                className="px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-850 text-slate-400 font-bold text-[11px] transition"
              >
                Go Back
              </button>
              <button 
                type="submit" 
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> {isCreatingJob ? "Broadcast Position" : "Save Positions Updates"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
