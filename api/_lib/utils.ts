import { getSupabase } from './db';

// Multi-tenant activity logger
export async function logActivity(userId: string, tenantId: string, type: 'upload' | 'analysis' | 'letter' | 'match' | 'chat' | 'auth' | 'admin', message: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  
  try {
    await supabase.from('activities').insert([{
      id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      tenantId,
      type,
      message,
      timestamp: new Date().toISOString()
    }]);
  } catch (err) {
    console.error("❌ Failed to log activity to Supabase:", err);
  }
}

export function serializeUserBio(role: string, status: string, realBio: string) {
  return "__VIRTUAL_USER_DATA__:" + JSON.stringify({
    role,
    status,
    real_bio: realBio
  });
}

export function extendUserWithVirtualFields(user: any) {
  if (!user) return null;
  
  let role = "user";
  let status = "active";
  let bio = user.bio || "";
  
  if (user.email === "admin@smartcvai.com") {
    role = "super_admin";
  }
  
  if (user.bio && typeof user.bio === "string" && user.bio.startsWith("__VIRTUAL_USER_DATA__:")) {
    try {
      const jsonStr = user.bio.slice("__VIRTUAL_USER_DATA__:".length);
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === "object") {
        role = parsed.role || role;
        status = parsed.status || status;
        bio = parsed.real_bio !== undefined ? parsed.real_bio : "";
      }
    } catch (e) {}
  }
  
  return {
    ...user,
    role,
    status,
    bio
  };
}
