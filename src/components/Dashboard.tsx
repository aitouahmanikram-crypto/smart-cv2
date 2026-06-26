import React, { useState } from "react";
import { LayoutDashboard, FileText, Zap, BookOpen, Target, User, LogOut, Menu, X, Edit, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import Overview from "./views/Overview";
import UploadCV from "./views/UploadCV";
import CVAnalysis from "./views/CVAnalysis";
import CoverLetters from "./views/CoverLetters";
import JobMatching from "./views/JobMatching";
import Rewrite from "./views/Rewrite";
import Profile from "./views/Profile";
import History from "./views/History";
import AdminPanel from "./views/AdminPanel";
import { FolderClock } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

interface DashboardProps {
  token: string;
  user: any;
  onLogout: () => void;
}

export type ViewType = 'overview' | 'upload' | 'analysis' | 'rewrite' | 'letters' | 'matching' | 'history' | 'profile' | 'admin';

export default function Dashboard({ token, user, onLogout }: DashboardProps) {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const navItems: { id: ViewType; label: string; icon: any }[] = [
    { id: 'overview', label: t('Dashboard'), icon: LayoutDashboard },
    { id: 'upload', label: t('Upload CV'), icon: FileText },
    { id: 'analysis', label: t('Analysis'), icon: Zap },
    { id: 'rewrite', label: 'AI Rewriter', icon: Edit },
    { id: 'letters', label: t('Cover Letter'), icon: BookOpen },
    { id: 'matching', label: t('Job Matching'), icon: Target },
    { id: 'history', label: 'History & Assets', icon: FolderClock },
    { id: 'profile', label: t('Profile'), icon: User },
    ...(user?.role === "super_admin" ? [{ id: 'admin' as ViewType, label: t('Admin Panel'), icon: Shield }] : [])
  ];

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <Overview token={token} onNavigate={setActiveView} />;
      case 'upload': return <UploadCV token={token} onNavigate={setActiveView} />;
      case 'analysis': return <CVAnalysis token={token} />;
      case 'rewrite': return <Rewrite token={token} />;
      case 'letters': return <CoverLetters token={token} />;
      case 'matching': return <JobMatching token={token} />;
      case 'history': return <History token={token} />;
      case 'profile': return <Profile token={token} user={user} />;
      case 'admin': return <AdminPanel token={token} />;
      default: return <Overview token={token} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-slate-900 rounded-lg text-white border border-slate-800"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2.5 p-6 border-b border-slate-900">
             <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Zap className="h-4.5 w-4.5 text-white" />
             </div>
             <div>
               <span className="font-display font-bold tracking-tight text-xl text-white">SmartCV <span className="text-indigo-400">AI</span></span>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-2 mb-2 block">Menu</span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-900">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Language</span>
              <LanguageSwitcher />
            </div>
            
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-900/50 border border-slate-800 mb-2">
              <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300 font-bold text-xs uppercase">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/20 rounded-xl transition-colors border border-transparent"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        {/* Subtle background glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-indigo-500/5 pointer-events-none rounded-full blur-[120px]" />
        
        <div className="p-6 md:p-10 max-w-6xl mx-auto relative z-10 w-full min-h-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
