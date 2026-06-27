import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false
    },
    resources: {
      en: {
        translation: {
          "Dashboard": "Dashboard",
          "Profile": "Profile",
          "Upload CV": "Upload CV",
          "Analysis": "Analysis",
          "ATS": "ATS",
          "Cover Letter": "Cover Letter",
          "Job Matching": "Job Matching",
          "Interview Questions": "Interview Questions",
          "Admin Panel": "Admin Panel",
        }
      },
      fr: {
        translation: {
          "Dashboard": "Tableau de bord",
          "Profile": "Profil",
          "Upload CV": "Télécharger CV",
          "Analysis": "Analyse",
          "ATS": "ATS",
          "Cover Letter": "Lettre de motivation",
          "Job Matching": "Job Matching",
          "Interview Questions": "Questions d'entretien",
          "Admin Panel": "Panneau d'administration",
        }
      }
    }
  });

export default i18n;
