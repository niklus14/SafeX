import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { Screen, Report, Reward, UserProfile, DraftReport, ReportComment } from './types';
import { INITIAL_USER } from './data';
import { api, MyReportSummary, FeedIssue } from './api';

// ── State ────────────────────────────────────────────────────────────────────

export interface AppState {
  screen: Screen;
  prevScreen: Screen | null;
  userId: number | null;
  user: UserProfile;
  reports: Report[];
  selectedReportId: string | null;
  selectedOrganization: string | null;
  messageThread: string | null;
  rewards: Reward[];
  apiIssueIds: Record<string, number>;
  draft: DraftReport;
  justCreatedId: string | null;
  claimedReward: { reward: Reward; code: string } | null;
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  carouselIndex: number;
  permissions: { camera: boolean; location: boolean };
  activeChip: 'HAMISI' | 'AKTIV' | 'HELLEDILIB';
  reportDetailView: 'thread' | 'comments';
}

const INITIAL_DRAFT: DraftReport = {
  photo: '',
  type: 'Yol Təmiri',
  description: '',
  location: 'Nərimanov r., Təbriz küç.',
  isLocationCustom: false,
};

const INITIAL_STATE: AppState = {
  screen: 'onboarding',
  prevScreen: null,
  userId: (() => {
    const s = localStorage.getItem('openwave_user_id');
    return s ? parseInt(s, 10) : null;
  })(),
  user: INITIAL_USER,
  reports: [],
  selectedReportId: null,
  selectedOrganization: null,
  messageThread: null,
  rewards: [],
  apiIssueIds: {},
  draft: INITIAL_DRAFT,
  justCreatedId: null,
  claimedReward: null,
  toast: null,
  carouselIndex: 0,
  permissions: { camera: false, location: false },
  activeChip: 'HAMISI',
  reportDetailView: 'thread' as const,
};

// ── Actions ──────────────────────────────────────────────────────────────────

export type Action =
  | { type: 'NAVIGATE'; to: Screen }
  | { type: 'SET_USER_ID'; id: number }
  | { type: 'UPDATE_USER'; patch: Partial<UserProfile> }
  | { type: 'SET_REPORTS'; reports: Report[] }
  | { type: 'ADD_REPORT'; report: Report }
  | { type: 'UPDATE_REPORT'; id: string; patch: Partial<Report> }
  | { type: 'SELECT_REPORT'; id: string; view?: 'thread' | 'comments' }
  | { type: 'SELECT_ORG'; org: string }
  | { type: 'SET_MESSAGE_THREAD'; thread: string | null }
  | { type: 'SET_REWARDS'; rewards: Reward[] }
  | { type: 'MAP_API_ISSUE'; localId: string; apiId: number }
  | { type: 'SET_DRAFT'; patch: Partial<DraftReport> }
  | { type: 'COMPLETE_ANALYSIS'; reportId: string }
  | { type: 'ADJUST_COINS'; delta: number }
  | { type: 'HYDRATE_BACKEND_REPORTS'; summaries: MyReportSummary[] }
  | { type: 'LOAD_FEED'; issues: FeedIssue[] }
  | { type: 'CLAIM_REWARD'; reward: Reward; code: string }
  | { type: 'CLEAR_CLAIMED' }
  | { type: 'TOAST'; message: string; toastType: 'success' | 'info' | 'error' }
  | { type: 'HIDE_TOAST' }
  | { type: 'SET_CAROUSEL'; index: number }
  | { type: 'GRANT_PERMISSION'; perm: 'camera' | 'location' }
  | { type: 'SET_CHIP'; chip: AppState['activeChip'] }
  | { type: 'SUPPORT_REPORT'; id: string; userName: string; avatar: string }
  | { type: 'ADD_COMMENT'; reportId: string; comment: ReportComment }
  | { type: 'TOGGLE_UPVOTE'; id: string }
  | { type: 'RESET' };

// ── Shared label maps (used by both HYDRATE_BACKEND_REPORTS and LOAD_FEED) ───

const BACKEND_STATUS: Record<string, 'GÖZLƏYİR' | 'İCRADADIR' | 'HƏLL EDİLDİ' | 'İMTİNA EDİLDİ'> = {
  ai_review: 'GÖZLƏYİR', manual_review: 'GÖZLƏYİR', routed: 'GÖZLƏYİR',
  in_progress: 'İCRADADIR', resolved: 'HƏLL EDİLDİ', rejected: 'İMTİNA EDİLDİ',
};

const BACKEND_CAT: Record<string, string> = {
  facade: 'Bina fasadı', green_zone: 'Yaşıllıq zonası', flooding: 'Subasma',
  ice: 'Buzlaşma', cleanliness: 'Təmizlik', waste: 'Zibil konteynerləri',
  road_excavation: 'Qazılmış asfalt (bərpa)', road_surface: 'Asfalt örtüyü',
  signage: 'Reklam lövhələri', storefront: 'Vitrinlər', park_equipment: 'Park avadanlığı',
  fountain: 'Fontanlar', sidewalk: 'Səki və bardürlər', construction_fence: 'Tikinti hasarları',
  lighting: 'İşıqlandırma', other: 'Digər',
};

const BACKEND_SEV: Record<string, 'Orta' | 'Yüksək' | 'Aşağı'> = {
  low: 'Aşağı', medium: 'Orta', high: 'Yüksək',
};

// ── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, prevScreen: state.screen, screen: action.to };

    case 'SET_USER_ID':
      return { ...state, userId: action.id };

    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.patch } };

    case 'SET_REPORTS':
      return { ...state, reports: action.reports };

    case 'ADD_REPORT':
      return { ...state, reports: [action.report, ...state.reports] };

    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map(r =>
          r.id === action.id ? { ...r, ...action.patch } : r,
        ),
      };

    case 'SELECT_REPORT':
      return { ...state, selectedReportId: action.id, reportDetailView: action.view ?? 'thread' };

    case 'SELECT_ORG':
      return { ...state, selectedOrganization: action.org };

    case 'SET_MESSAGE_THREAD':
      return { ...state, messageThread: action.thread };

    case 'SET_REWARDS':
      return { ...state, rewards: action.rewards };

    case 'MAP_API_ISSUE':
      return {
        ...state,
        apiIssueIds: { ...state.apiIssueIds, [action.localId]: action.apiId },
      };

    case 'SET_DRAFT':
      return { ...state, draft: { ...state.draft, ...action.patch } };

    case 'ADJUST_COINS':
      return { ...state, user: { ...state.user, coins: state.user.coins + action.delta } };

    case 'HYDRATE_BACKEND_REPORTS': {
      let reports = [...state.reports];
      const apiIssueIds = { ...state.apiIssueIds };
      for (const s of action.summaries) {
        const localId = `#API-${s.issue_id}`;
        const matchIdx = reports.findIndex(r => r.imageUrl === s.image_url || r.id === localId);
        if (matchIdx >= 0) {
          apiIssueIds[reports[matchIdx].id] = s.issue_id;
          reports[matchIdx] = { ...reports[matchIdx], isOwn: true };
        } else {
          const created = new Date(s.created_at);
          reports = [{
            id: localId,
            title: s.title_az,
            category: BACKEND_CAT[s.category] ?? s.category,
            status: BACKEND_STATUS[s.status] ?? 'GÖZLƏYİR',
            time: created.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
            date: created.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' }),
            imageUrl: s.image_url,
            descr: s.title_az,
            location: 'Nərimanov r.',
            severity: 'Orta',
            authority: '',
            reporterName: state.user.name,
            reporterAvatar: state.user.avatar,
            reactionsCount: 1,
            hasUserReacted: true,
            upvotes: 0,
            upvotedByUser: false,
            comments: [],
            steps: [
              { name: 'Süni intellekt yoxlaması', status: 'completed', subtitle: 'Tamamlandı', time: '' },
              { name: 'Operator yoxlaması', status: 'current', subtitle: 'Hazırda bu mərhələdədir' },
            ],
            isOwn: true,
          }, ...reports];
          apiIssueIds[localId] = s.issue_id;
        }
      }
      return { ...state, reports, apiIssueIds };
    }

    case 'LOAD_FEED': {
      // Keep session-created reports (#RG-*) and ones marked isOwn; replace everything else
      const ownIds = new Set(state.reports.filter(r => r.isOwn).map(r => r.id));
      const sessionReports = state.reports.filter(r => r.id.startsWith('#RG-'));
      const apiIssueIds = { ...state.apiIssueIds };
      const feedReports: Report[] = action.issues.map(i => {
        const localId = `#API-${i.id}`;
        apiIssueIds[localId] = i.id;
        const created = new Date(i.created_at);
        return {
          id: localId,
          title: i.title_az || BACKEND_CAT[i.category] || i.category,
          category: BACKEND_CAT[i.category] ?? i.category,
          status: BACKEND_STATUS[i.status] ?? 'GÖZLƏYİR',
          time: created.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
          date: created.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' }),
          imageUrl: i.image_url ?? '',
          descr: i.brief_desc_az ?? '',
          location: i.location_az || `${i.lat.toFixed(4)}°N, ${i.lng.toFixed(4)}°E`,
          severity: BACKEND_SEV[i.severity] ?? 'Orta',
          authority: '',
          reporterName: i.reporter_name || 'Vətəndaş',
          reporterAvatar: `https://picsum.photos/seed/u${i.id}/40/40`,
          reactionsCount: i.report_count,
          hasUserReacted: false,
          upvotes: 0,
          upvotedByUser: false,
          comments: [],
          steps: [],
          isOwn: ownIds.has(localId),
        };
      });
      return {
        ...state,
        reports: [...sessionReports, ...feedReports],
        apiIssueIds,
      };
    }

    case 'COMPLETE_ANALYSIS': {
      const { draft, user } = state;
      const reportId = action.reportId;
      const newReport: Report = {
        id: reportId,
        title:
          draft.description.length > 30
            ? draft.description.substring(0, 30) + '...'
            : draft.type + ' Proseduru',
        category: draft.type,
        status: 'GÖZLƏYİR',
        time: 'İndicə',
        date: 'Növbəti günlər',
        imageUrl: draft.photo,
        descr: draft.description || 'Kamera ilə təyin olunmuş problem sahəsinin təhlili.',
        location: draft.location,
        severity: 'Orta',
        authority: draft.type.includes('Yol')
          ? 'Bakı Şəhər İcra Hakimiyyəti'
          : 'Abadlıq şöbəsi',
        reporterName: user.name,
        reporterAvatar: user.avatar,
        reactionsCount: 1,
        hasUserReacted: true,
        upvotes: 0,
        upvotedByUser: false,
        comments: [],
        steps: [
          {
            name: 'Süni intellekt yoxlaması',
            status: 'completed',
            subtitle: 'Problem uğurla analiz olundu',
            time: 'İndicə',
          },
          {
            name: 'Operator yoxlaması',
            status: 'current',
            subtitle: 'Aidiyyatı idarə tərəfindən baxış gözlənilir',
          },
        ],
        isOwn: true,
      };
      return {
        ...state,
        reports: [newReport, ...state.reports],
        justCreatedId: reportId,
        selectedReportId: reportId,
        user: {
          ...user,
          reportsCount: user.reportsCount + 1,
          coins: user.coins + 10,
        },
        screen: 'report-success',
        prevScreen: state.screen,
      };
    }

    case 'CLAIM_REWARD':
      return {
        ...state,
        user: { ...state.user, coins: state.user.coins - action.reward.cost },
        claimedReward: { reward: action.reward, code: action.code },
        screen: 'reward-claimed',
        prevScreen: state.screen,
      };

    case 'CLEAR_CLAIMED':
      return { ...state, claimedReward: null };

    case 'TOAST':
      return {
        ...state,
        toast: { message: action.message, type: action.toastType },
      };

    case 'HIDE_TOAST':
      return { ...state, toast: null };

    case 'SET_CAROUSEL':
      return { ...state, carouselIndex: action.index };

    case 'GRANT_PERMISSION':
      return {
        ...state,
        permissions: { ...state.permissions, [action.perm]: true },
      };

    case 'SET_CHIP':
      return { ...state, activeChip: action.chip };

    case 'SUPPORT_REPORT': {
      const target = state.reports.find(r => r.id === action.id);
      if (!target || target.hasUserReacted) return state;
      const newComment: ReportComment = {
        id: `uc-${Date.now()}`,
        author: `${action.userName} (Siz)`,
        avatar: action.avatar,
        time: 'İndi qeydə alındı',
        text: 'Mən də bu problemi təsdiq edirəm. Çox vacibdir.',
      };
      return {
        ...state,
        user: { ...state.user, coins: state.user.coins + 5 },
        reports: state.reports.map(r =>
          r.id === action.id
            ? {
                ...r,
                reactionsCount: r.reactionsCount + 1,
                hasUserReacted: true,
                comments: [newComment, ...r.comments],
              }
            : r,
        ),
      };
    }

    case 'ADD_COMMENT':
      return {
        ...state,
        user: { ...state.user, coins: state.user.coins + 2 },
        reports: state.reports.map(r =>
          r.id === action.reportId
            ? { ...r, comments: [...r.comments, action.comment] }
            : r,
        ),
      };

    case 'TOGGLE_UPVOTE':
      return {
        ...state,
        reports: state.reports.map(r =>
          r.id === action.id
            ? { ...r, upvotedByUser: !r.upvotedByUser, upvotes: r.upvotes + (r.upvotedByUser ? -1 : 1) }
            : r,
        ),
      };

    case 'RESET':
      return {
        ...INITIAL_STATE,
        userId: state.userId,
        screen: 'onboarding',
        user: {
          ...INITIAL_USER,
          coins: 1240,
          notificationsEnabled: true,
          language: 'AZ',
        },
        reports: [],
        carouselIndex: 0,
        reportDetailView: 'thread' as const,
      };

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  navigate: (to: Screen) => void;
  toast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback(
    (to: Screen) => {
      dispatch({ type: 'NAVIGATE', to });
      setTimeout(() => {
        const frame = document.getElementById('root');
        if (frame && window.innerWidth >= 540) {
          frame.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 0);
    },
    [],
  );

  const toast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'info') => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      dispatch({ type: 'TOAST', message, toastType: type });
      toastTimer.current = setTimeout(
        () => dispatch({ type: 'HIDE_TOAST' }),
        4000,
      );
    },
    [],
  );

  // Bootstrap: register/restore user + fetch rewards once on mount
  React.useEffect(() => {
    const uid = state.userId;
    if (!uid) {
      api
        .createUser(INITIAL_USER.name)
        .then(u => {
          dispatch({ type: 'SET_USER_ID', id: u.id });
          localStorage.setItem('openwave_user_id', String(u.id));
        })
        .catch(() => {});
    } else {
      api.getMe(uid).then(p => {
        dispatch({
          type: 'UPDATE_USER',
          patch: {
            coins: p.coins,
            trustScore: p.credibility,
            reportsCount: p.reports.length,
            solvedCount: p.reports.filter(r => r.status === 'resolved').length,
          },
        });
        dispatch({ type: 'HYDRATE_BACKEND_REPORTS', summaries: p.reports });
      }).catch(() => {});
    }

    api
      .getRewards()
      .then(data =>
        dispatch({
          type: 'SET_REWARDS',
          rewards: data.map(r => ({
            id: r.id,
            title: r.title_az,
            badge: r.badge,
            cost: r.cost_coins,
            imageUrl: r.image_url,
          })),
        }),
      )
      .catch(() => {});
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, navigate, toast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
