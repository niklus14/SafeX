import {
  AlertOctagon,
  Award,
  Camera,
  CheckCircle2,
  ClipboardList,
  Compass,
  Info,
  MapPin,
  User,
  X,
} from 'lucide-react';
import { useApp } from './store';
import { Screen } from './types';

// Screens
import AIAnalysisScreen from './screens/AIAnalysisScreen';
import CameraScreen from './screens/CameraScreen';
import CreateDetailsScreen from './screens/CreateDetailsScreen';
import FeedScreen from './screens/FeedScreen';
import MyReportsScreen from './screens/MyReportsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ReportDetailScreen from './screens/ReportDetailScreen';
import ReportSuccessScreen from './screens/ReportSuccessScreen';
import RewardClaimedScreen from './screens/RewardClaimedScreen';
import RewardsScreen from './screens/RewardsScreen';

const SHELL_SCREENS: Screen[] = ['feed', 'my-reports', 'rewards', 'profile'];

// ── Shell header — in-flow, not fixed ────────────────────────────────────────

function ShellHeader() {
  const { state, navigate } = useApp();
  return (
    <header className="shrink-0 h-16 bg-white/90 backdrop-blur-md border-b border-[#e5bdba]/30 shadow-sm z-10 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <span className="p-1.5 bg-[#fff0ef] rounded-xl text-brand-primary shrink-0 animate-pulse">
          <MapPin size={20} />
        </span>
        <span className="font-display font-extrabold text-xl text-brand-primary tracking-tight">Openwave</span>
      </div>
      <div
        onClick={() => navigate('profile')}
        className="w-10 h-10 rounded-full border-2 border-[#ffdad7] shadow-sm overflow-hidden shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
      >
        <img className="w-full h-full object-cover" src={state.user.avatar} alt="Avatar" />
      </div>
    </header>
  );
}

// ── Bottom nav — in-flow, not fixed ──────────────────────────────────────────

function BottomNav() {
  const { state, navigate, dispatch } = useApp();

  function triggerCamera() {
    dispatch({
      type: 'SET_DRAFT',
      patch: { photo: '', type: 'Yol Təmiri', description: '', location: 'Nərimanov r., Təbriz küç.', isLocationCustom: false },
    });
    navigate('camera');
  }

  const isActive = (id: Screen) => state.screen === id;

  const navItem = (id: Screen, icon: React.ReactNode, label: string) => (
    <a
      key={id}
      onClick={e => { e.preventDefault(); navigate(id); }}
      className={`flex flex-col items-center justify-center rounded-full px-3 py-1 transition-all duration-200 cursor-pointer ${
        isActive(id) ? 'text-brand-primary font-bold' : 'text-brand-on-surface-variant/70 hover:bg-brand-primary-fixed/20'
      }`}
      href="#"
    >
      {icon}
      <span className="text-[10px] font-bold mt-1">{label}</span>
    </a>
  );

  return (
    <nav className="shrink-0 flex justify-around items-end pb-5 pt-3 px-2 bg-white/80 backdrop-blur-xl border-t border-brand-outline-variant/30 shadow-[0px_-4px_22px_rgba(135,0,18,0.04)] z-10 rounded-t-3xl">
      {navItem('feed', <Compass size={22} />, 'Lent')}
      {navItem('my-reports', <ClipboardList size={22} />, 'Müraciətlər')}

      {/* FAB — lifted above nav with negative top margin */}
      <div className="relative -top-5 flex flex-col items-center">
        <button
          onClick={triggerCamera}
          className="w-16 h-16 bg-brand-primary text-white rounded-full shadow-[0_8px_25px_rgba(135,0,18,0.4)] active:scale-90 transition-all duration-200 border-4 border-brand-surface flex items-center justify-center hover:bg-brand-primary-container cursor-pointer"
        >
          <Camera size={28} />
        </button>
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-brand-primary uppercase tracking-wide whitespace-nowrap">
          BİLDİR
        </span>
      </div>

      {navItem('rewards', <Award size={22} />, 'Mükafatlar')}
      {navItem('profile', <User size={22} />, 'Profil')}
    </nav>
  );
}

// ── Toast — absolute so it stays inside the phone frame ───────────────────────

function Toast() {
  const { state, dispatch } = useApp();
  const { toast } = state;
  if (!toast) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] w-11/12 max-w-sm bg-[#3f2c2a] text-[#ffedeb] px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-[#e5bdba]/20">
      <div className="flex items-center gap-3">
        {toast.type === 'success' ? (
          <CheckCircle2 className="text-[#a5d6a7] shrink-0" size={20} />
        ) : toast.type === 'error' ? (
          <AlertOctagon className="text-brand-secondary-container shrink-0" size={20} />
        ) : (
          <Info className="text-blue-300 shrink-0" size={20} />
        )}
        <p className="text-xs font-semibold leading-tight">{toast.message}</p>
      </div>
      <button onClick={() => dispatch({ type: 'HIDE_TOAST' })} className="text-white/60 hover:text-white p-1 ml-1 shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { state } = useApp();
  const { screen } = state;
  const isShell = SHELL_SCREENS.includes(screen);

  return (
    /*
      phone-root: on desktop this class is overridden by index.css to
      height:100% so the flex children divide the phone frame height exactly.
      On mobile min-h-screen keeps it full-viewport-height.
    */
    <div className="phone-root relative min-h-screen bg-brand-surface text-brand-on-surface font-sans flex flex-col antialiased selection:bg-brand-primary/20">
      <Toast />

      {/* Full-screen overlays: absolute inset-0 fills the phone-root div */}
      {screen === 'onboarding' && <OnboardingScreen />}
      {screen === 'permissions' && <PermissionsScreen />}
      {screen === 'camera' && <CameraScreen />}
      {screen === 'ai-analysis' && <AIAnalysisScreen />}

      {/*
        Shell layout:
          ShellHeader  (shrink-0, 64 px)
          scroll area  (flex-1, overflow-y-auto — the only scrollable element)
          BottomNav    (shrink-0)
        All three are in-flow children of this flex-col wrapper, so they
        are clipped by #root's border-radius and never escape the frame.
      */}
      {isShell && (
        <div className="flex-grow flex flex-col min-h-0">
          <ShellHeader />
          <div id="scroll-content" className="flex-1 overflow-y-auto min-h-0">
            {screen === 'feed' && <FeedScreen />}
            {screen === 'my-reports' && <MyReportsScreen />}
            {screen === 'rewards' && <RewardsScreen />}
            {screen === 'profile' && <ProfileScreen />}
          </div>
          <BottomNav />
        </div>
      )}

      {/* Standalone screens with their own internal flex layout */}
      {screen === 'create-details' && <CreateDetailsScreen />}
      {screen === 'report-success' && <ReportSuccessScreen />}
      {screen === 'report-detail' && <ReportDetailScreen />}
      {screen === 'reward-claimed' && <RewardClaimedScreen />}
    </div>
  );
}
