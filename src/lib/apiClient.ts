const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === "true";

export async function safeJson(response: Response) {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error(`[safeJson] Non-JSON response from ${response.url} (Status: ${response.status})`, { 
      contentType, 
      textSample: text.substring(0, 200) 
    });
    
    // Clean text for error message
    const cleanText = text.substring(0, 300).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return { 
      error: `Server Error (${response.status}): The server did not return JSON. Response: ${cleanText || 'Empty'}`, 
      status: response.status,
      rawResponse: text
    };
  }
  
  try {
    return await response.json();
  } catch (err) {
    return { error: "Failed to parse server JSON", status: response.status };
  }
}

// Local storage simulation for development ONLY
let mockCVs: any[] = [];

export async function apiFetch(url: string, options: RequestInit = {}) {
  // Only intercept for mock mode if explicitly enabled via environment variable
  if (MOCK_MODE) {
    console.log(`[apiFetch] MOCK MODE ACTIVE: Intercepting ${url}`);
    const mockData = getMockData(url, options) as any;
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (mockData && typeof mockData === 'object' && 'success' in mockData) {
       return mockData.data !== undefined ? mockData.data : mockData;
    }
    return mockData;
  }

  let finalUrl = url;
  
  // Mappings to Serverless Functions (Vercel style)
  if (url === '/api/auth/login') finalUrl = '/api/auth/login';
  else if (url === '/api/auth/register') finalUrl = '/api/auth/register';
  else if (url === '/api/auth/me') finalUrl = '/api/auth/me';
  else if (url === '/api/auth/logout') finalUrl = '/api/auth/logout';
  else if (url === '/api/dashboard/stats') finalUrl = '/api/dashboard/stats';
  else if (url === '/api/cvs/upload') finalUrl = '/api/cvs/upload';
  else if (url === '/api/cvs/upload-test') finalUrl = '/api/cvs/upload-test';
  else if (url === '/api/cvs') finalUrl = '/api/cvs/index';
  else if (url === '/api/jobs') finalUrl = '/api/jobs/index';
  else if (url === '/api/jobs/create') finalUrl = '/api/jobs/create';
  else if (url === '/api/admin/stats') finalUrl = '/api/admin?action=stats';
  else if (url.startsWith('/api/admin/users')) {
    const parts = url.split('/');
    if (parts.length >= 5) {
      if (parts[parts.length-1] === 'reset-password') {
        finalUrl = `/api/admin?action=reset-password&id=${parts[4]}`;
      } else {
        finalUrl = `/api/admin?action=users&id=${parts[4]}`;
      }
    } else {
      finalUrl = '/api/admin?action=users';
    }
  }
  else if (url.startsWith('/api/admin/jobs')) {
    const parts = url.split('/');
    if (parts.length >= 5) {
      finalUrl = `/api/admin?action=jobs&id=${parts[4]}`;
    } else {
      finalUrl = '/api/admin?action=jobs';
    }
  }
  else if (url.startsWith('/api/admin/settings')) finalUrl = '/api/admin?action=settings';
  else if (url.startsWith('/api/admin/seed-demo')) finalUrl = '/api/admin?action=seed';
  
  // Consolidate others into api/actions.ts
  else if (url === '/api/matches') finalUrl = '/api/actions?action=list_matches';
  else if (url.startsWith('/api/matches/analyze')) finalUrl = '/api/actions?action=analyze_match';
  else if (url.startsWith('/api/matches/custom')) finalUrl = '/api/actions?action=custom_match';
  else if (url.startsWith('/api/matches/saved')) finalUrl = '/api/actions?action=saved_matches';
  else if (url.startsWith('/api/matches/')) {
    const parts = url.split('/');
    if (parts.length >= 4) {
      finalUrl = `/api/actions?action=toggle_save_match&id=${parts[3]}`;
    }
  }
  else if (url === '/api/history') finalUrl = '/api/actions?action=list_history';
  else if (url.startsWith('/api/history/')) {
    const parts = url.split('/');
    if (parts.length >= 5) {
      finalUrl = `/api/actions?action=delete_history_item&type=${parts[3]}&id=${parts[4]}`;
    }
  }
  else if (url === '/api/career-advice') finalUrl = '/api/actions?action=list_career_advice';
  else if (url.startsWith('/api/career-advice/generate')) finalUrl = '/api/actions?action=generate_career_advice';
  else if (url.startsWith('/api/career-advice/')) {
    const parts = url.split('/');
    finalUrl = `/api/actions?action=get_career_advice&cvId=${parts[parts.length-1]}`;
  }
  else if (url === '/api/cover-letters') finalUrl = '/api/actions?action=list_cover_letters';
  else if (url.startsWith('/api/cover-letters/generate')) finalUrl = '/api/actions?action=generate_cover_letter';
  else if (url === '/api/settings') finalUrl = '/api/actions?action=get_settings';
  else if (url.startsWith('/api/settings/language')) finalUrl = '/api/actions?action=update_settings';
  else if (url.startsWith('/api/cvs/rewrite')) finalUrl = '/api/actions?action=rewrite_cv';
  else if (url.startsWith('/api/cvs/')) {
    const parts = url.split('/');
    if (parts.length >= 4) {
      if (parts[parts.length-1] === 'restore') {
        finalUrl = `/api/actions?action=restore_cv_version&cvId=${parts[3]}&versionId=${parts[5]}`;
      } else if (parts[parts.length-1] === 'versions') {
        finalUrl = `/api/actions?action=cv_versions&cvId=${parts[3]}`;
      }
    }
  }

  console.log(`[apiFetch] Request: ${options.method || 'GET'} ${url} -> ${finalUrl}`, { body: !!options.body });

  try {
    const response = await fetch(finalUrl, options);
    
    // Read as text first to handle empty/non-JSON safely
    const responseText = await response.text();
    
    if (!responseText && !response.ok) {
      throw new Error(`Server returned empty response (Status: ${response.status})`);
    }

    let data: any = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error(`[apiFetch] Non-JSON response (Status: ${response.status}):`, responseText.substring(0, 100));
        if (response.ok) return { success: true, raw: responseText };
        throw new Error(`Non-JSON response (${response.status}): ${responseText.substring(0, 50)}`);
      }
    }

    if (!response.ok) {
      console.error(`[apiFetch] HTTP Error: ${response.status}`, data);
      throw new Error(data.error || data.message || `Server error: ${response.status}`);
    }

    // Unpack data if it follows the { success, data } format
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success) {
        return data.data !== undefined ? data.data : data;
      } else {
        throw new Error(data.error || "Operation failed");
      }
    }

    return data;
  } catch (error: any) {
    console.error(`[apiFetch] Error for ${finalUrl}:`, error);
    throw error;
  }
}

function getMockData(url: string, options: RequestInit) {
  const method = options.method || 'GET';
  
  // Auth mocks
  if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
    return {
      token: 'mock-token-' + Date.now(),
      user: {
        id: 'mock-user-1',
        email: 'mock@example.com',
        fullName: 'Mock User',
        role: 'user'
      }
    };
  }
  
  if (url.includes('/api/auth/me')) {
    return {
      id: 'mock-user-1',
      email: 'mock@example.com',
      fullName: 'Mock User',
      role: 'user'
    };
  }

  // CV Upload Mock
  if (url.includes('/api/cvs/upload')) {
    const now = new Date().toISOString();
    return {
      success: true,
      data: {
        id: 'mock-cv-' + Date.now(),
        candidateName: "Ikram Ait Ouahman",
        fullName: "Ikram Ait Ouahman",
        fileName: "resume.pdf",
        updatedAt: now,
        createdAt: now,
        score: 82,
        atsScore: 82,
        skills: ["React", "Node.js", "Supabase", "AI", "CV Analysis"],
        experience: "Junior AI / Full Stack profile",
        experienceYears: 3,
        summary: "Profil Junior AI / Full Stack avec de solides bases en React et Node.js. Analyse simulée réussie dans l'environnement AI Studio.",
        parsedDetails: {
          name: "Ikram Ait Ouahman",
          keywordMatching: 82,
          formattingQuality: 88,
          skillsCoverage: 75,
          experienceRelevance: 80,
          educationRelevance: 90
        },
        strengths: ["Maîtrise de React", "Capacité d'analyse"],
        weaknesses: ["Expérience limitée en backend"],
        skillsMatched: ["React", "Node.js", "AI"],
        skillsMissing: ["PostgreSQL", "CI/CD"],
        atsOptimizations: ["Détailler davantage les projets React"],
        recommendations: [
          "Ajouter des réalisations mesurables",
          "Améliorer les mots-clés pour les systèmes ATS",
          "Ajouter plus de détails sur les projets techniques"
        ],
        isMock: true
      }
    };
  }

  // Dashboard / Stats
  if (url.includes('/api/dashboard/stats') || url.includes('/api/admin/stats')) {
    return {
      cvsCount: 12,
      lettersCount: 8,
      matchesCount: 25,
      interviewsCount: 3,
      averageScore: 82,
      cvs: [],
      letters: [],
      matches: [],
      recentActivity: []
    };
  }

  // Lists
  if (url.includes('/api/cvs')) {
    if (mockCVs.length === 0) {
      // Return at least one default mock if list is empty in dev
      return [{
        id: 'mock-cv-default',
        candidateName: "Ikram Ait Ouahman",
        fullName: "Ikram Ait Ouahman",
        fileName: "resume_initial.pdf",
        updatedAt: new Date().toISOString(),
        score: 85,
        summary: "Analyse initiale du profil.",
        parsedDetails: {
          name: "Ikram Ait Ouahman",
          keywordMatching: 85,
          formattingQuality: 90,
          skillsCoverage: 80,
          experienceRelevance: 85,
          educationRelevance: 95
        },
        strengths: ["Compétences techniques solides", "Formation académique"],
        weaknesses: ["Manque d'expérience en production"],
        skillsMatched: ["React", "TypeScript"],
        skillsMissing: ["Docker", "Kubernetes"],
        atsOptimizations: ["Ajouter plus de mots-clés techniques"],
        recommendations: ["Continuer à construire des projets personnels"],
        isMock: true
      }];
    }
    return mockCVs;
  }

  if (url.includes('/api/jobs') || url.includes('/api/matches') || url.includes('/api/history') || url.includes('/api/career-advice')) {
    return [];
  }

  // Single items / Objects
  if (url.match(/\/api\/[^\/]+\/[^\/]+$/)) {
    return {};
  }

  // Default success for actions
  return { success: true };
}
