import React from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../lib/apiClient';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    
    // Store in database
    try {
      await apiFetch('/api/settings/language', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLang })
      });
    } catch (err) {
      console.error("Failed to save language preference:", err);
    }
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs"
    >
      {i18n.language === 'fr' ? 'EN' : 'FR'}
    </button>
  );
}
