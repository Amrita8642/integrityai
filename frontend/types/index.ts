export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'educator';
  created_at: string;
}

export interface Assignment {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
}

export interface Draft {
  id: number;
  assignment_id: number;
  content: string;
  similarity_score: number | null;
  ai_probability: number | null;
  risk_level: 'Low' | 'Medium' | 'High' | null;
  learning_score: number | null;
  reflection_text: string | null;
  feedback: string | null;
  improvement_tips: string | null;
  missing_citations: string | null;
  language: string;
  created_at: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export const riskColor: Record<RiskLevel, string> = {
  Low: 'text-green-400',
  Medium: 'text-yellow-400',
  High: 'text-red-400',
};

export const riskBg: Record<RiskLevel, string> = {
  Low: 'bg-green-400/10 border-green-400/30',
  Medium: 'bg-yellow-400/10 border-yellow-400/30',
  High: 'bg-red-400/10 border-red-400/30',
};
