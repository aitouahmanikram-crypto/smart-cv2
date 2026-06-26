export interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  avatarUrl?: string; // Optional user avatar
  title?: string;
  bio?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  type: string; // 'Full-time' | 'Part-time' | 'Contract' | 'Remote'
  description: string;
  requirements: string[];
  salary: string;
  postedAt: string;
}

export interface ParsedCVDetails {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string[];
  education: string[];
}

export interface CVAnalysis {
  id: string;
  userId: string;
  fileName: string;
  status: 'DRAFT' | 'ANALYZING' | 'ANALYSED' | 'OPTIMIZING' | 'COMPLETED';
  score: number; // 0-100 score
  grammarScore: number; // 0-100 score
  impactScore: number; // 0-100 score
  skillsScore: number; // 0-100 score
  summary: string;
  suggestions: string[];
  skillsMatched: string[];
  skillsMissing: string[];
  parsedDetails: ParsedCVDetails;
  updatedAt: string;
}

export interface CoverLetter {
  id: string;
  cvId: string;
  recipientName: string;
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  generatedText: string;
  status: 'DRAFT' | 'COMPLETED';
  createdAt: string;
}

export interface JobMatchResult {
  id: string;
  cvId: string;
  jobId: string;
  matchScore: number; // percentage
  fitSummary: string;
  strengths: string[];
  gaps: string[];
  applicationStrategy: string;
  createdAt: string;
}

export interface DashboardStats {
  cvsCount: number;
  latestScore: number;
  lettersCount: number;
  matchesCount: number;
  recentActivity: Array<{
    id: string;
    type: 'upload' | 'analysis' | 'letter' | 'match';
    message: string;
    timestamp: string;
  }>;
}
