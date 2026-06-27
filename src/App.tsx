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
  const [isLoading, setIsLoading] = useState(true);

  // Persistence logic: Try to restore session on mount
  React.useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        try {
          // Attempt to validate token by fetching current profile
          const userData = await apiFetch('/api/auth/me', {
            headers: { "Authorization": `Bearer ${storedToken}` }
          });
          
          if (userData) {
            setToken(storedToken);
            setUser(userData);
            setCurrentView('dashboard');
            
            // Try to load language preference
            try {
              const settings = await apiFetch('/api/settings', {
                headers: { "Authorization": `Bearer ${storedToken}` }
              });
              if (settings && settings.language) {
                i18n.changeLanguage(settings.language);
              }
            } catch (err) {
              console.warn("Could not load language settings");
            }
          } else {
            // Invalid session
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        } catch (err) {
          console.error("Session restoration failed:", err);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const handleLogin = async (jwt: string, userData: any) => {
    setToken(jwt);
    setUser(userData);
    
    // Persist to localStorage
    localStorage.setItem('auth_token', jwt);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setCurrentView('landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
