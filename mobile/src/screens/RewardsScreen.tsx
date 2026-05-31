import { Award, Info, Medal, Trophy, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store';

const LEADERBOARD = [
  { rank: 1, name: 'Leyla Məmmədova', role: 'Məhəllə müşahidəçisi', coins: 2180, solved: 31, reports: 44 },
  { rank: 2, name: 'Rəşad Əliyev', role: 'Aktiv vətəndaş', coins: 1960, solved: 28, reports: 39 },
  { rank: 3, name: 'Anar Məmmədov', role: 'Etibarlı iştirakçı', coins: 1540, solved: 18, reports: 24 },
  { rank: 4, name: 'Nigar Həsənova', role: 'Sübut göndərən', coins: 1425, solved: 19, reports: 27 },
  { rank: 5, name: 'Kamal Vəliyev', role: 'İcma dəstəyi', coins: 1310, solved: 16, reports: 22 },
  { rank: 6, name: 'Fərid Qasımov', role: 'Təsdiqçi', coins: 1190, solved: 14, reports: 21 },
  { rank: 7, name: 'Aysel Quliyeva', role: 'Aktiv vətəndaş', coins: 1125, solved: 12, reports: 20 },
  { rank: 8, name: 'Murad Hüseynov', role: 'Məhəllə müşahidəçisi', coins: 1030, solved: 11, reports: 18 },
  { rank: 9, name: 'Sevinc Əliyeva', role: 'Sübut göndərən', coins: 980, solved: 10, reports: 16 },
  { rank: 10, name: 'Elvin Rzayev', role: 'İcma dəstəyi', coins: 930, solved: 9, reports: 15 },
  { rank: 11, name: 'Günel Məmmədli', role: 'Aktiv vətəndaş', coins: 870, solved: 8, reports: 14 },
  { rank: 12, name: 'Tural Abbasov', role: 'Təsdiqçi', coins: 820, solved: 7, reports: 13 },
  { rank: 13, name: 'Lalə Qurbanova', role: 'Sübut göndərən', coins: 780, solved: 7, reports: 12 },
  { rank: 14, name: 'Emin İsmayılov', role: 'İcma dəstəyi', coins: 735, solved: 6, reports: 12 },
  { rank: 15, name: 'Samir Əliyev', role: 'Aktiv vətəndaş', coins: 690, solved: 6, reports: 11 },
  { rank: 16, name: 'Aytən Rəhimova', role: 'Təsdiqçi', coins: 650, solved: 5, reports: 10 },
  { rank: 17, name: 'Orxan Nəcəfov', role: 'Məhəllə müşahidəçisi', coins: 610, solved: 5, reports: 9 },
  { rank: 18, name: 'Zəhra Kərimli', role: 'İcma dəstəyi', coins: 570, solved: 4, reports: 9 },
  { rank: 19, name: 'Rauf Cəfərov', role: 'Aktiv vətəndaş', coins: 530, solved: 4, reports: 8 },
  { rank: 20, name: 'Fidan Əhmədova', role: 'Sübut göndərən', coins: 490, solved: 3, reports: 7 },
].sort((a, b) => b.coins - a.coins).map((item, index) => ({ ...item, rank: index + 1 }));

const EARN_ROWS = [
  { letter: 'A', label: 'Yeni düzgün müraciət', pts: '+10 Xal', color: 'bg-green-100 text-green-700' },
  { letter: 'B', label: 'Digər müraciətin təsdiqlənməsi', pts: '+5 Xal', color: 'bg-blue-100 text-blue-700' },
  { letter: 'C', label: 'Problem rəsmi həll olunanda', pts: '+20 Xal', color: 'bg-amber-100 text-amber-700' },
  { letter: 'D', label: 'Yanlış və ya spam müraciət', pts: '-10 Xal', color: 'bg-rose-100 text-rose-700' },
];

function maskName(name: string, firstLen = 3, lastLen = 2) {
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].slice(0, firstLen) + '.';
  return parts[0].slice(0, firstLen) + '. ' + parts[parts.length - 1].slice(0, lastLen) + '.';
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function rankClass(rank: number) {
  if (rank === 1) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (rank === 2) return 'bg-slate-100 text-slate-600 border-slate-200';
  if (rank === 3) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-brand-low text-brand-primary border-brand-outline-variant/30';
}

export default function RewardsScreen() {
  const { state } = useApp();
  const { user } = state;
  const [infoOpen, setInfoOpen] = useState(false);
  const visibleList = LEADERBOARD.slice(0, 3);
  const userRank = LEADERBOARD.findIndex(m => m.coins <= user.coins) + 1 || LEADERBOARD.length + 1;

  return (
    <>
      <main className="h-full flex flex-col px-6 pt-4 pb-4 gap-4 max-w-xl mx-auto w-full min-h-0">
        <div className="shrink-0">
          <h1 className="font-display text-xl font-extrabold text-[#281716]">Mükafatlar</h1>
          <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">
            Topladığınız xallar şəhərə verdiyiniz töhfəni göstərir
          </p>
        </div>

        {/* Balance banner */}
        <section className="shrink-0 coin-shimmer-bg rounded-3xl py-6 text-center flex flex-col items-center justify-center shadow-lg">
          <div className="bg-white/10 p-2.5 rounded-full mb-2 backdrop-blur-sm text-[#ffbeb9]">
            <Award size={30} />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display text-3xl font-extrabold text-white leading-none">{user.coins} Xal</h2>
            <button
              onClick={() => setInfoOpen(true)}
              aria-label="Necə qazanılır?"
              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white/80 hover:bg-white/30 transition-colors"
            >
              <Info size={13} />
            </button>
          </div>
          <p className="text-[11px] text-white/80 font-bold uppercase tracking-widest leading-none">MÖVCUD XAL BALANSINIZ</p>
        </section>

        {/* Civic leaderboard — flex-1 so it fills remaining height; list scrolls internally when expanded */}
        <section className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 bg-white rounded-3xl border border-brand-outline-variant/20 shadow-sm p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between">
              <h3 className="font-display text-sm font-extrabold text-brand-on-surface">Aylıq liderlik cədvəli</h3>
              <span className="text-[10px] font-extrabold text-brand-primary bg-brand-low px-2.5 py-1 rounded-full shrink-0">
                Sizin yeriniz: #{userRank}
              </span>
            </div>

            <div className="space-y-2 shrink-0">
              {visibleList.map(member => {
                const isTop3 = member.rank <= 3;
                const rowBg = member.rank === 1
                  ? 'bg-amber-50 border-amber-200'
                  : member.rank === 2
                  ? 'bg-slate-50 border-slate-200'
                  : member.rank === 3
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-brand-surface border-brand-outline-variant/15';
                const avatarBg = member.rank === 1
                  ? 'bg-amber-400 text-white'
                  : member.rank === 2
                  ? 'bg-slate-400 text-white'
                  : member.rank === 3
                  ? 'bg-orange-400 text-white'
                  : 'bg-brand-primary text-white';

                return (
                  <div
                    key={member.name}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${rowBg}`}
                  >
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-extrabold shrink-0 ${rankClass(member.rank)}`}>
                      {isTop3
                        ? (member.rank === 1 ? <Trophy size={14} /> : <Medal size={14} />)
                        : member.rank}
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0 ${avatarBg}`}>
                      {initials(member.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-sm font-extrabold text-brand-on-surface truncate">{maskName(member.name, 3, 3)}</h4>
                      <p className="text-[10px] font-semibold text-brand-on-surface-variant truncate">{member.role}</p>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-brand-on-surface-variant/70 mt-1">
                        <span>{member.reports} müraciət</span>
                        <span>•</span>
                        <span>{member.solved} həllə töhfə</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-sm font-extrabold text-brand-primary">{member.coins}</div>
                      <div className="text-[9px] font-bold uppercase text-brand-on-surface-variant/70">Xal</div>
                    </div>
                  </div>
                );
              })}

              {/* User's own card — shown when user is outside top 3 */}
              {userRank > 3 && (
                <>
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex-1 h-px bg-brand-outline-variant/25" />
                    <span className="text-[11px] text-brand-on-surface-variant/40 font-bold tracking-widest">···</span>
                    <div className="flex-1 h-px bg-brand-outline-variant/25" />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border px-3 py-3 bg-brand-low border-brand-primary/25">
                    <div className="w-8 h-8 rounded-xl border border-brand-primary/30 bg-brand-container flex items-center justify-center text-xs font-extrabold text-brand-primary shrink-0">
                      {userRank}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0">
                      {initials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-sm font-extrabold text-brand-primary truncate">
                        {maskName(user.name, 3, 3)}
                        <span className="ml-1.5 text-[9px] font-extrabold uppercase tracking-wide bg-brand-primary text-white px-1.5 py-0.5 rounded-full">siz</span>
                      </h4>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-sm font-extrabold text-brand-primary">{user.coins}</div>
                      <div className="text-[9px] font-bold uppercase text-brand-on-surface-variant/70">Xal</div>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </section>
      </main>


      {/* Bottom sheet — portalled into #root so it's clipped by the phone frame */}
      {createPortal(
        <AnimatePresence>
          {infoOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                className="absolute inset-0 z-40 bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setInfoOpen(false)}
              />

              {/* Sheet */}
              <motion.div
                key="sheet"
                className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85%] flex flex-col"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              >
              {/* Handle */}
              <div className="pt-3 pb-1 flex justify-center shrink-0">
                <div className="w-10 h-1 rounded-full bg-brand-outline-variant/40" />
              </div>

              {/* Header */}
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

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 pb-10">
                {/* Concept explanation */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 space-y-2">
                  <p className="text-sm font-extrabold text-amber-900 font-display">Keyfiyyət, aktivlik yox</p>
                  <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                    Xallar şəhərə verdiyiniz real töhfəni ölçür. Eyni yerdəki təkrar müraciətlər mövcud problemə birləşdirilir — əlavə xal qazandırmır. Yeni, real ictimai problem açıldıqda və ya həll olunduqda xallarınız artır.
                  </p>
                </div>

                {/* Earn table */}
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

                {/* Anti-spam note */}
                <p className="text-[11px] font-semibold text-brand-on-surface-variant/70 text-center leading-relaxed px-2">
                  Spam və ya əsassız müraciətlər xallarınızı azaldır və hesabınıza məhdudiyyət gətirilə bilər.
                </p>
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
