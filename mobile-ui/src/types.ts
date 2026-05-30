export enum AppScreen {
  ONBOARDING = 'ONBOARDING',
  PERMISSIONS = 'PERMISSIONS',
  FEED = 'FEED',
  MY_REPORTS = 'MY_REPORTS',
  REWARDS = 'REWARDS',
  PROFILE = 'PROFILE',
  CAMERA = 'CAMERA',
  CREATE_DETAILS = 'CREATE_DETAILS',
  AI_ANALYSIS = 'AI_ANALYSIS',
  REPORT_CREATED_SUCCESS = 'REPORT_CREATED_SUCCESS',
  REPORT_DETAIL = 'REPORT_DETAIL',
  REWARD_CLAIMED = 'REWARD_CLAIMED'
}

export interface ReportComment {
  id: string;
  author: string;
  avatar: string;
  time: string;
  text: string;
  imageUrl?: string;
}

export interface StatusStep {
  name: string;
  status: 'completed' | 'current' | 'pending';
  subtitle: string;
  time?: string;
}

export interface Report {
  id: string;
  title: string;
  category: string;
  status: 'İCRADADIR' | 'HƏLL EDİLDİ' | 'GÖZLƏYİR';
  time: string;
  date: string;
  imageUrl: string;
  descr: string;
  location: string;
  severity: 'Orta' | 'Yüksək' | 'Aşağı';
  authority: string;
  reporterName: string;
  reporterAvatar: string;
  reactionsCount: number;
  hasUserReacted: boolean;
  comments: ReportComment[];
  steps: StatusStep[];
}

export interface Reward {
  id: string;
  title: string;
  badge: string;
  cost: number;
  imageUrl: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  trustScore: number;
  reportsCount: number;
  solvedCount: number;
  coins: number;
  language: 'AZ' | 'EN';
  notificationsEnabled: boolean;
}
