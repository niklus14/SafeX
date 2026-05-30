import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { Screen, Report, Reward, UserProfile, DraftReport, ReportComment } from './types';
import { INITIAL_USER, INITIAL_REPORTS, INITIAL_REWARDS } from './data';
import { api } from './api';

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
  reports: INITIAL_REPORTS,
  selectedReportId: '#88241',
  selectedOrganization: null,
  messageThread: null,
  rewards: INITIAL_REWARDS,
  apiIssueIds: {},
  draft: INITIAL_DRAFT,
  justCreatedId: null,
  claimedReward: null,
  toast: null,
  carouselIndex: 0,
  permissions: { camera: false, location: false },
  activeChip: 'HAMISI',
};

// ── Actions ──────────────────────────────────────────────────────────────────

export type Action =
  | { type: 'NAVIGATE'; to: Screen }
  | { type: 'SET_USER_ID'; id: number }
  | { type: 'UPDATE_USER'; patch: Partial<UserProfile> }
  | { type: 'SET_REPORTS'; reports: Report[] }
  | { type: 'ADD_REPORT'; report: Report }
  | { type: 'UPDATE_REPORT'; id: string; patch: Partial<Report> }
  | { type: 'SELECT_REPORT'; id: string }
  | { type: 'SELECT_ORG'; org: string }
  | { type: 'SET_MESSAGE_THREAD'; thread: string | null }
  | { type: 'SET_REWARDS'; rewards: Reward[] }
  | { type: 'MAP_API_ISSUE'; localId: string; apiId: number }
  | { type: 'SET_DRAFT'; patch: Partial<DraftReport> }
  | { type: 'COMPLETE_ANALYSIS' }
  | { type: 'CLAIM_REWARD'; reward: Reward; code: string }
  | { type: 'CLEAR_CLAIMED' }
  | { type: 'TOAST'; message: string; toastType: 'success' | 'info' | 'error' }
  | { type: 'HIDE_TOAST' }
  | { type: 'SET_CAROUSEL'; index: number }
  | { type: 'GRANT_PERMISSION'; perm: 'camera' | 'location' }
  | { type: 'SET_CHIP'; chip: AppState['activeChip'] }
  | { type: 'SUPPORT_REPORT'; id: string; userName: string; avatar: string }
  | { type: 'ADD_COMMENT'; reportId: string; comment: ReportComment }
  | { type: 'RESET' };

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
      return { ...state, selectedReportId: action.id };

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

    case 'COMPLETE_ANALYSIS': {
      const { draft, user } = state;
      const reportId = `#RG-${Math.floor(10000 + Math.random() * 90000)}`;
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
        reports: INITIAL_REPORTS,
        carouselIndex: 0,
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

  // Bootstrap: register user + fetch rewards once on mount
  React.useEffect(() => {
    if (!state.userId) {
      api
        .createUser(INITIAL_USER.name)
        .then(u => {
          dispatch({ type: 'SET_USER_ID', id: u.id });
          localStorage.setItem('openwave_user_id', String(u.id));
        })
        .catch(() => {});
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
