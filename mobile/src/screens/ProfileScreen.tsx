import { Bell, CheckCircle2, ChevronRight, Globe, LogOut } from 'lucide-react';
import { useApp } from '../store';

export default function ProfileScreen() {
  const { state, dispatch, navigate, toast } = useApp();
  const { user } = state;

  function toggleLanguage() {
    dispatch({ type: 'UPDATE_USER', patch: { language: user.language === 'AZ' ? 'EN' : 'AZ' } });
    toast(`Dil dəyişdirildi: ${user.language === 'AZ' ? 'EN' : 'AZ'}`, 'info');
  }

  function toggleNotifications() {
    dispatch({ type: 'UPDATE_USER', patch: { notificationsEnabled: !user.notificationsEnabled } });
    toast(user.notificationsEnabled ? 'Anlıq bildirişlər söndürüldü.' : 'Anlıq bildirişlər aktivdir!', 'info');
  }

  function signOut() {
    dispatch({ type: 'RESET' });
    navigate('onboarding');
  }

  const circumference = 339.3;

  return (
    <main className="px-5 space-y-5 max-w-xl mx-auto w-full pt-4 pb-28">
      {/* Trust score gauge */}
      <section className="flex flex-col items-center justify-center text-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle className="text-brand-highest" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="8" />
            <circle
              className="text-brand-primary"
              cx="64" cy="64" fill="transparent" r="54"
              stroke="currentColor" strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * user.trustScore) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-extrabold text-brand-primary leading-none">{user.trustScore}</span>
            <span className="text-[10px] font-bold text-brand-on-surface-variant mt-0.5">Etibar xalı</span>
          </div>
        </div>
        <div className="mt-4">
          <h1 className="font-display text-lg font-extrabold text-[#281716] leading-none mb-1.5">{user.name}</h1>
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-primary font-bold">
            <CheckCircle2 size={13} className="text-brand-primary shrink-0" />
            Fəal Vətəndaş
          </span>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-brand-low/55 p-3.5 rounded-2xl text-center shadow-sm border border-[#e5bdba]/15">
          <span className="font-display text-xl font-extrabold text-brand-primary leading-none block mb-1">{user.reportsCount}</span>
          <p className="text-[10px] font-bold text-brand-on-surface-variant leading-tight">Müraciət</p>
        </div>
        <div className="bg-brand-primary p-3.5 rounded-2xl text-center shadow-[0_4px_12px_rgba(135,0,18,0.15)] text-white">
          <span className="font-display text-xl font-extrabold leading-none block mb-1">{user.solvedCount}</span>
          <p className="text-[10px] font-bold text-white/80 leading-tight">Həll edilib</p>
        </div>
        <div className="bg-brand-low/55 p-3.5 rounded-2xl text-center shadow-sm border border-[#e5bdba]/15">
          <span className="font-display text-xl font-extrabold text-brand-on-surface leading-none block mb-1 truncate">{user.coins}</span>
          <p className="text-[10px] font-bold text-brand-on-surface-variant leading-tight">Civic Coin</p>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-3">
        <div className="flex justify-between items-center text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider px-1">
          <span>Mükafatlar</span>
          <button className="text-brand-primary text-[10px] font-bold" onClick={() => navigate('rewards')}>Hamısı</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
          {[
            { icon: 'workspace_premium', label: 'Qızıl İştirakçı', earned: true },
            { icon: 'photo_camera', label: 'Foto-detektiv', earned: true },
            { icon: 'groups', label: 'Könüllü', earned: false },
            { icon: 'volunteer_activism', label: 'Yardımçı', earned: true },
          ].map(badge => (
            <div key={badge.label} className={`flex flex-col items-center gap-1.5 shrink-0 ${!badge.earned ? 'opacity-40 grayscale' : ''}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${badge.earned ? 'bg-brand-highest border-[#bd0e21]/15 text-[#bd0e21]' : 'bg-brand-low border-brand-outline-variant/30 text-brand-on-surface-variant'}`}>
                <span className="material-symbols-outlined !text-2xl">{badge.icon}</span>
              </div>
              <p className="text-[10px] font-bold text-center w-16 leading-tight">{badge.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Settings */}
      <section className="space-y-3">
        <h2 className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider px-1">Tənzimləmələr</h2>
        <div className="space-y-2">
          {/* Language */}
          <div
            onClick={toggleLanguage}
            className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-[#e5bdba]/15 cursor-pointer hover:bg-brand-low/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-low rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                <Globe size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#281716]">Sistem Dili</p>
                <span className="text-[10px] text-brand-on-surface-variant font-medium">
                  {user.language === 'AZ' ? 'Azərbaycan dili (AZ)' : 'English (EN)'}
                </span>
              </div>
            </div>
            <div className="flex bg-[#ffe9e7]/60 rounded-full p-1 border border-brand-primary/10">
              {(['AZ', 'EN'] as const).map(lang => (
                <span key={lang} className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${user.language === lang ? 'bg-brand-primary text-white' : 'text-brand-on-surface-variant/70'}`}>
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div
            onClick={toggleNotifications}
            className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-[#e5bdba]/15 cursor-pointer hover:bg-brand-low/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-low rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#281716]">Anlıq Bildirişlər</p>
                <span className="text-[10px] font-medium text-brand-on-surface-variant block">Status yenilənmələri barədə xəbər verilir</span>
              </div>
            </div>
            <div className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${user.notificationsEnabled ? 'bg-[#bd0e21]' : 'bg-gray-300'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${user.notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Sign out */}
          <div
            onClick={signOut}
            className="flex justify-between items-center bg-brand-low/40 p-4 rounded-2xl border border-brand-primary/10 cursor-pointer hover:bg-brand-secondary-fixed-dim/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-secondary-fixed/50 rounded-xl flex items-center justify-center text-brand-secondary shrink-0">
                <LogOut size={18} />
              </div>
              <p className="text-xs font-bold text-brand-secondary">Çıxış</p>
            </div>
            <ChevronRight size={16} className="text-brand-secondary" />
          </div>
        </div>
      </section>
    </main>
  );
}
