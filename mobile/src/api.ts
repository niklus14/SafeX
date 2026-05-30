/**
 * api.ts — typed client for the Openwave backend.
 *
 * Base URL is read from VITE_API_URL (defaults to http://localhost:8000).
 * All endpoints that require form data send multipart/form-data via FormData,
 * matching the FastAPI Form(...) declarations in main.py.
 */

const BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000';

async function postForm<T>(path: string, fd: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: fd });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Response types (mirror the shapes returned by main.py)

export interface UserResponse {
  id: number;
  display_name: string;
  credibility: number;
  coins: number;
}

export type ReportSubmitResponse =
  | {
      is_relevant: true;
      issue_id: number;
      joined_thread: boolean;
      status: string;
      category: string;
      severity: string;
      title_az: string;
      deadline: string | null;
    }
  | {
      is_relevant: false;
      rejection_reason_az: string;
      credibility: number;
    };

export interface IssueStep {
  name: string;
  status: 'completed' | 'current' | 'pending';
  subtitle: string;
}

export interface IssueReport {
  id: number;
  user_text: string;
  image_url: string;
  created_at: string;
  is_root: boolean;
}

export interface IssueDetail {
  id: number;
  category: string;
  severity: string;
  title_az: string;
  description_az: string;
  status: string;
  deadline: string | null;
  created_at: string;
  lat: number;
  lng: number;
  org: { key: string; name_az: string } | null;
  report_count: number;
  reports: IssueReport[];
  steps: IssueStep[];
}

export interface MyReportSummary {
  issue_id: number;
  status: string;
  title_az: string;
  category: string;
  image_url: string;
  created_at: string;
  deadline: string | null;
}

export interface UserProfile {
  id: number;
  display_name: string;
  credibility: number;
  coins: number;
  reports: MyReportSummary[];
}

export interface ApiReward {
  id: string;
  title_az: string;
  badge: string;
  cost_coins: number;
  partner: string;
  image_url: string;
}

// ---------------------------------------------------------------------------
// API methods

export const api = {
  /** Register a new citizen user. Call once; persist the returned id. */
  createUser(display_name: string, phone?: string): Promise<UserResponse> {
    const fd = new FormData();
    fd.append('display_name', display_name);
    if (phone) fd.append('phone', phone);
    return postForm('/users', fd);
  },

  /**
   * Submit a report. For the demo the prototype supplies a preset image URL;
   * in production pass an actual File object via the `image` field instead.
   */
  submitReport(params: {
    imageUrl: string;
    description: string;
    lat: number;
    lng: number;
    userId: number;
  }): Promise<ReportSubmitResponse> {
    const fd = new FormData();
    fd.append('image_url', params.imageUrl);
    fd.append('description', params.description);
    fd.append('lat', String(params.lat));
    fd.append('lng', String(params.lng));
    fd.append('user_id', String(params.userId));
    return postForm('/reports', fd);
  },

  /** Full issue detail with X-style thread + citizen stepper steps. */
  getIssue(id: number): Promise<IssueDetail> {
    return get(`/issues/${id}`);
  },

  /** Citizen profile: coins, credibility, list of contributed issues. */
  getMe(userId: number): Promise<UserProfile> {
    return get(`/me/${userId}`);
  },

  /** Static rewards catalog (marketplace mocked per spec). */
  getRewards(): Promise<ApiReward[]> {
    return get('/rewards');
  },
};
