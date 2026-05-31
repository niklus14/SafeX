import { AnimatePresence, motion } from 'motion/react';
import { Bell, ChevronRight, Globe, Info, LogOut, Medal, Shield, Star, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store';

const BOARD_COINS = [2180, 1960, 1540, 1425, 1310, 1190, 1125, 1030, 980, 930, 870, 820, 780, 735, 690, 650, 610, 570, 530, 490];

function getUserRank(coins: number) {
  const idx = BOARD_COINS.findIndex(c => c <= coins);
  return idx === -1 ? BOARD_COINS.length + 1 : idx + 1;
}

const EARN_ROWS = [
  { letter: 'A', label: 'Yeni düzgün müraciət',          pts: '+10 Xal', color: 'bg-green-100 text-green-700' },
  { letter: 'B', label: 'Digər müraciətin təsdiqlənməsi', pts: '+5 Xal',  color: 'bg-blue-100 text-blue-700' },
  { letter: 'C', label: 'Problem rəsmi həll olunanda',    pts: '+20 Xal', color: 'bg-amber-100 text-amber-700' },
  { letter: 'D', label: 'Yanlış və ya spam müraciət',     pts: '-10 Xal', color: 'bg-rose-100 text-rose-700' },
];

const BADGES = [
  { icon: <Star  size={18} className="fill-amber-400 text-amber-400" />, label: 'Rising Star',     level: 3,    bg: 'bg-amber-50 border-amber-200'               },
  { icon: <Medal size={18} className="text-slate-500" />,                label: 'İcma Köməkçisi',  level: null, bg: 'bg-slate-50 border-slate-200'               },
  { icon: <Shield size={18} className="text-brand-primary" />,           label: 'Aktiv Vətəndaş', level: null, bg: 'bg-brand-low border-brand-outline-variant/40' },
];

export default function ProfileScreen() {
  const { state, dispatch, navigate, toast } = useApp();
  const { user } = state;
  const [infoOpen, setInfoOpen] = useState(false);

  const userRank = getUserRank(user.coins);

  function toggleLanguage() {
    dispatch({ type: 'UPDATE_USER', patch: { language: user.language === 'AZ' ? 'EN' : 'AZ' } });
    toast(`Dil dəyişdirildi: ${user.language === 'AZ' ? 'EN' : 'AZ'}`, 'info');
  }

  function toggleNotifications() {
    dispatch({ type: 'UPDATE_USER', patch: { notificationsEnabled: !user.notificationsEnabled } });
    toast(user.notificationsEnabled ? 'Bildirişlər söndürüldü.' : 'Bildirişlər aktivdir!', 'info');
  }

  function signOut() {
    dispatch({ type: 'RESET' });
    navigate('onboarding');
  }

  return (
    <>
      <main className="px-5 space-y-5 max-w-xl mx-auto w-full pt-6 pb-28">

        {/* ── Avatar + name + rank ── */}
        <section className="flex flex-col items-center gap-2 pt-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-outline-variant/40 shadow-sm bg-[#f5e8e7]">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>


          <h1 className="font-display text-xl font-extrabold text-[#281716] leading-none">{user.name}</h1>

          <div className="flex items-center gap-1.5 bg-brand-low border border-brand-outline-variant/30 rounded-full px-3 py-1">
            <span className="text-[11px] font-semibold text-brand-on-surface-variant">Sıralama</span>
            <span className="text-[11px] font-extrabold text-brand-primary">#{userRank}</span>
            <span className="bg-brand-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none">Siz</span>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="bg-white rounded-3xl border border-brand-outline-variant/20 shadow-sm flex divide-x divide-brand-outline-variant/25">
          {/* Etibarlılıq — shown as N/100 */}
          <div className="flex-1 py-4 flex flex-col items-center gap-1">
            <div className="flex items-baseline gap-0.5 leading-none">
              <span className="font-display text-[18px] font-extrabold text-[#281716]">{user.trustScore}</span>
              <span className="text-[10px] font-bold text-brand-on-surface-variant/50">/100</span>
            </div>
            <span className="text-[9px] font-bold text-brand-on-surface-variant/70 uppercase tracking-wide leading-none text-center">Etibarlılıq</span>
          </div>
          {[
            { value: user.reportsCount, label: 'Müraciət' },
            { value: user.solvedCount,  label: 'Həll edilib' },
            { value: user.coins,        label: 'Civic Xal' },
          ].map(stat => (
            <div key={stat.label} className="flex-1 py-4 flex flex-col items-center gap-1">
              <span className="font-display text-[18px] font-extrabold text-[#281716] leading-none">{stat.value}</span>
              <span className="text-[9px] font-bold text-brand-on-surface-variant/70 uppercase tracking-wide leading-none text-center">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* ── Mükafatlar ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <h2 className="font-display text-sm font-extrabold text-brand-on-surface-variant">Mükafatlar</h2>
            <button
              onClick={() => setInfoOpen(true)}
              className="w-5 h-5 rounded-full bg-brand-low border border-brand-outline-variant/30 flex items-center justify-center text-brand-on-surface-variant hover:bg-brand-outline-variant/20 transition-colors"
            >
              <Info size={11} />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-brand-outline-variant/20 shadow-sm p-5 flex justify-around">
            {BADGES.map(b => (
              <div key={b.label} className="flex flex-col items-center gap-2">
                <div className={`relative w-11 h-11 rounded-full border-2 flex items-center justify-center ${b.bg}`}>
                  {b.icon}
                  {b.level !== null && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-primary text-white text-[9px] font-extrabold flex items-center justify-center leading-none">
                      {b.level}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-center text-brand-on-surface-variant leading-tight max-w-[56px]">{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tənzimləmələr ── */}
        <section className="space-y-2">
          <h2 className="font-display text-sm font-extrabold text-brand-on-surface-variant px-1">Tənzimləmələr</h2>

          <div className="bg-white rounded-3xl border border-brand-outline-variant/20 shadow-sm overflow-hidden divide-y divide-brand-outline-variant/15">

            {/* Language */}
            <div
              onClick={toggleLanguage}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-brand-low/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-low rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                  <Globe size={15} />
                </div>
                <span className="text-[13px] font-semibold text-[#281716]">Dil</span>
              </div>
              <div className="flex bg-brand-low rounded-full p-0.5 border border-brand-outline-variant/25">
                {(['AZ', 'EN'] as const).map(lang => (
                  <span key={lang} className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${user.language === lang ? 'bg-brand-primary text-white' : 'text-brand-on-surface-variant/60'}`}>
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div
              onClick={toggleNotifications}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-brand-low/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-low rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                  <Bell size={15} />
                </div>
                <span className="text-[13px] font-semibold text-[#281716]">Bildirişlər</span>
              </div>
              <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${user.notificationsEnabled ? 'bg-brand-primary' : 'bg-brand-outline-variant/60'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${user.notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

          </div>

          {/* Logout */}
          <div
            onClick={signOut}
            className="flex items-center justify-between bg-white px-4 py-3.5 rounded-3xl border border-brand-outline-variant/20 shadow-sm hover:bg-[#fff0ef] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#fff0ef] rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                <LogOut size={15} />
              </div>
              <span className="text-[13px] font-semibold text-brand-primary">Çıxış</span>
            </div>
            <ChevronRight size={15} className="text-brand-primary/40" />
          </div>
        </section>

      </main>

      {/* ── Xal sistemi bottom sheet ── */}
      {createPortal(
        <AnimatePresence>
          {infoOpen && (
            <>
              <motion.div
                key="backdrop"
                className="absolute inset-0 z-40 bg-black/40"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setInfoOpen(false)}
              />
              <motion.div
                key="sheet"
                className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              >
                <div className="pt-3 pb-1 flex justify-center shrink-0">
                  <div className="w-10 h-1 rounded-full bg-brand-outline-variant/40" />
                </div>
                <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-brand-outline-variant/15">
                  <div>
                    <h3 className="font-display text-base font-extrabold text-[#281716]">Necə qazanılır?</h3>
                    <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">Xal sistemi haqqında</p>
                  </div>
                  <button
                    onClick={() => setInfoOpen(false)}
                    className="w-8 h-8 rounded-full bg-brand-low flex items-center justify-center text-brand-on-surface-variant hover:bg-brand-outline-variant/20 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4 pb-10">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs font-semibold text-amber-800 leading-relaxed">
                    Xallar <strong>keyfiyyəti</strong> ölçür. Eyni yerdəki təkrar müraciətlər mövcud problemə birləşdirilir — əlavə xal qazandırmır.
                  </div>
                  <div className="bg-brand-low rounded-2xl border border-brand-outline-variant/30 overflow-hidden text-xs font-semibold p-2">
                    {EARN_ROWS.map(row => (
                      <div key={row.letter} className="flex items-center justify-between p-3 border-b border-[#e5bdba]/20 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${row.color}`}>{row.letter}</span>
                          <span className="text-brand-on-surface">{row.label}</span>
                        </div>
                        <span className="text-[#870012] font-bold font-display whitespace-nowrap">{row.pts}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.getElementById('root')!
      )}
    </>
  );
}
