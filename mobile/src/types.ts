export type Screen =
  | 'onboarding'
  | 'permissions'
  | 'feed'
  | 'chat'
  | 'messages'
  | 'message-thread'
  | 'my-reports'
  | 'camera'
  | 'create-details'
  | 'ai-analysis'
  | 'report-success'
  | 'report-detail'
  | 'reward-claimed'
  | 'rewards'
  | 'profile';

export type ReportStatus = 'İCRADADIR' | 'HƏLL EDİLDİ' | 'GÖZLƏYİR' | 'İMTİNA EDİLDİ';
export type SeverityLabel = 'Orta' | 'Yüksək' | 'Aşağı';

export interface StatusStep {
  name: string;
  status: 'completed' | 'current' | 'pending';
  subtitle: string;
  time?: string;
}

export interface ReportComment {
  id: string;
  author: string;
  avatar: string;
  time: string;
  text: string;
  imageUrl?: string;
}

export interface Report {
  id: string;
  title: string;
  category: string;
  status: ReportStatus;
  time: string;
  date: string;
  imageUrl: string;
  descr: string;
  location: string;
  severity: SeverityLabel;
  authority: string;
  reporterName: string;
  reporterAvatar: string;
  reactionsCount: number;
  hasUserReacted: boolean;
  upvotes: number;
  upvotedByUser: boolean;
  comments: ReportComment[];
  steps: StatusStep[];
  isOwn?: boolean;
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

export interface DraftReport {
  photo: string;
  type: string;
  description: string;
  location: string;
  isLocationCustom: boolean;
  lat: number;
  lng: number;
}
