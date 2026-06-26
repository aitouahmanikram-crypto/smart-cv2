import React, { useState } from "react";
import i18n from "./i18n";
import LandingPage from "./components/LandingPage";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import { apiFetch } from "./lib/apiClient";

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const handleLogin = async (jwt: string, userData: any) => {
    setToken(jwt);
    setUser(userData);
    
    // Fetch user language preference
    try {
      const data = await apiFetch('/api/settings/language', {
        headers: { "Authorization": `Bearer ${jwt}` }
      });
      if (data && data.language) {
        i18n.changeLanguage(data.language);
      }
    } catch (err) {
      console.error("Failed to load user language:", err);
    }

    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCurrentView('landing');
  };

  return (
    <>
      {currentView === 'landing' && (
        <LandingPage onNavigate={(view) => setCurrentView(view)} />
      )}
      
      {(currentView === 'login' || currentView === 'register') && (
        <Auth 
          initialMode={currentView} 
          onLogin={handleLogin} 
          onNavigateLanding={() => setCurrentView('landing')} 
        />
      )}

      {currentView === 'dashboard' && token && user && (
        <Dashboard token={token} user={user} onLogout={handleLogout} />
      )}
    </>
  );
}
