export async function safeJson(response: Response) {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error(`[safeJson] Non-JSON response from ${response.url} (Status: ${response.status})`, { 
      contentType, 
      textSample: text.substring(0, 200) 
    });
    
    // Nettoyer le HTML pour le message d'erreur
    const cleanText = text.substring(0, 300).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return { 
      error: `Erreur Serveur (${response.status}): Le serveur n'a pas renvoyé de JSON. Réponse: ${cleanText || 'Vide'}`, 
      status: response.status,
      rawResponse: text
    };
  }
  
  try {
    return await response.json();
  } catch (err) {
    return { error: "Impossible de lire le JSON du serveur", status: response.status };
  }
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  let finalUrl = url;
  // Mappings to Serverless Functions
  if (url === '/api/auth/login') finalUrl = '/api/auth/login';
  else if (url === '/api/auth/register') finalUrl = '/api/auth/register';
  else if (url === '/api/auth/me') finalUrl = '/api/auth/me';
  else if (url === '/api/auth/logout') finalUrl = '/api/auth/logout';
  else if (url === '/api/dashboard/stats') finalUrl = '/api/dashboard/stats';
  else if (url === '/api/profile/update') finalUrl = '/api/profile/update';
  else if (url === '/api/cvs/upload') finalUrl = '/api/cvs/upload';
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
    
    // If it's a 404 in development, try mock data
    if (response.status === 404 && import.meta.env.DEV) {
      console.warn(`API route ${finalUrl} not found (404). Using mock fallback.`);
      return getMockData(url, options);
    }

    const data = await safeJson(response);

    if (!response.ok) {
      console.error(`[apiFetch] HTTP Error: ${response.status}`, data);
      throw new Error(data.error || data.message || `Request failed: ${response.status}`);
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
    // If network error in dev, also try mock data
    if (import.meta.env.DEV) {
      console.warn(`Network error for ${finalUrl}. Using mock fallback.`, error);
      return getMockData(url, options);
    }
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
  if (url.includes('/api/cvs') || url.includes('/api/jobs') || url.includes('/api/matches') || url.includes('/api/history') || url.includes('/api/career-advice')) {
    return [];
  }

  // Single items / Objects
  if (url.match(/\/api\/[^\/]+\/[^\/]+$/)) {
    return {};
  }

  // Default success for actions
  return { success: true };
}
