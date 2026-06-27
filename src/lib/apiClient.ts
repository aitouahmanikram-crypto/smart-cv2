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
  
  // Clean REST mappings
  if (url === '/api/cvs') finalUrl = '/api/cvs/index';
  else if (url === '/api/jobs') finalUrl = '/api/jobs/index';

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
