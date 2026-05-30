import { Award, Medal, ShieldCheck, Trophy, TrendingUp } from 'lucide-react';
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
  { rank: 20, name: 'Fidan Əhmədova', role: 'Sübut göndərən', coins: 490, solved: 3, reports: 7 }
].sort((a, b) => b.coins - a.coins).map((item, index) => ({ ...item, rank: index + 1 }));

function initials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
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

  const topThree = LEADERBOARD.slice(0, 3);
  const remaining = LEADERBOARD.slice(3);

  return (
    <main className="px-6 space-y-6 max-w-xl mx-auto w-full pt-4 pb-8">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[#281716]">Mükafatlar</h1>
        <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">
          Topladığınız coinlər şəhərə verdiyiniz töhfəni və aktivliyinizi göstərir
        </p>
      </div>

      {/* Balance banner */}
      <section className="coin-shimmer-bg rounded-3xl p-8 text-center flex flex-col items-center justify-center shadow-lg">
        <div className="bg-white/10 p-3 rounded-full mb-3 backdrop-blur-sm text-[#ffbeb9]">
          <Award size={36} />
        </div>
        <h2 className="font-display text-3xl font-extrabold text-white leading-none mb-1.5">{user.coins} Coin</h2>
        <p className="text-[11px] text-white/80 font-bold uppercase tracking-widest leading-none">MÖVCUD COIN BALANSINIZ</p>
      </section>

      {/* How to earn */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-extrabold text-brand-on-surface-variant px-1">Necə qazanılır?</h3>
        <div className="bg-brand-low rounded-2xl border border-brand-outline-variant/30 overflow-hidden text-xs font-semibold p-2">
          {[
            { letter: 'A', label: 'Yeni düzgün müraciət', coin: '+10 Coin', color: 'bg-green-100 text-green-700' },
            { letter: 'B', label: 'Digər müraciətin təsdiqlənməsi', coin: '+5 Coin', color: 'bg-blue-100 text-blue-700' },
            { letter: 'C', label: 'Problem rəsmi həll olunanda', coin: '+20 Coin', color: 'bg-amber-100 text-amber-700' },
            { letter: 'D', label: 'Yanlış və ya spam müraciət', coin: '-10 Coin', color: 'bg-rose-100 text-rose-700' }
          ].map(row => (
            <div key={row.letter} className="flex items-center justify-between p-3 border-b border-[#e5bdba]/20 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${row.color}`}>{row.letter}</span>
                <span className="text-brand-on-surface">{row.label}</span>
              </div>
              <span className="text-[#870012] font-bold font-display whitespace-nowrap">{row.coin}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Civic leaderboard */}
      <section className="space-y-4 pb-8">
        <div className="flex items-end justify-between px-1">
          <div>
            <h3 className="font-display text-sm font-extrabold text-brand-on-surface-variant">Liderlik cədvəli</h3>
            <p className="text-[11px] font-semibold text-brand-on-surface-variant/70 mt-0.5">Top 20 vətəndaş coinlərinə görə sıralanır</p>
          </div>
          <span className="text-[10px] font-extrabold text-brand-primary bg-brand-low px-2.5 py-1 rounded-full">Top 20</span>
        </div>

        <div className="bg-white rounded-3xl border border-brand-outline-variant/20 shadow-sm p-4 overflow-hidden">
          <div className="grid grid-cols-3 gap-2 items-end mb-5">
            {topThree.map(member => (
              <div
                key={member.name}
                className={`rounded-2xl border p-3 text-center ${rankClass(member.rank)} ${member.rank === 1 ? 'scale-105 py-5 shadow-sm' : 'py-3'}`}
              >
                <div className="flex justify-center mb-2">
                  {member.rank === 1 ? <Trophy size={24} /> : <Medal size={22} />}
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1">#{member.rank}</div>
                <div className="font-display font-extrabold text-xs leading-tight line-clamp-2 min-h-8">{member.name}</div>
                <div className="text-[11px] font-extrabold mt-2">{member.coins}</div>
                <div className="text-[9px] font-bold uppercase opacity-70">Coin</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {remaining.map(member => (
              <div
                key={member.name}
                className="flex items-center gap-3 rounded-2xl border border-brand-outline-variant/15 bg-brand-surface px-3 py-3"
              >
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-extrabold ${rankClass(member.rank)}`}>
                  {member.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                  {initials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-sm font-extrabold text-brand-on-surface truncate">{member.name}</h4>
                  <p className="text-[10px] font-semibold text-brand-on-surface-variant truncate">{member.role}</p>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-brand-on-surface-variant/70 mt-1">
                    <span>{member.reports} müraciət</span>
                    <span>•</span>
                    <span>{member.solved} həllə töhfə</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-sm font-extrabold text-brand-primary">{member.coins}</div>
                  <div className="text-[9px] font-bold uppercase text-brand-on-surface-variant/70">Coin</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-low rounded-2xl border border-brand-outline-variant/30 p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white text-brand-primary flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-display text-sm font-extrabold text-brand-on-surface">Coin pul deyil</h4>
            <p className="text-xs font-semibold text-brand-on-surface-variant mt-1 leading-relaxed">
              Bu göstərici vətəndaşın real müraciət, sübut və təsdiqlərlə şəhər idarəçiliyinə verdiyi töhfəni göstərir.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-outline-variant/20 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary text-white flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <h4 className="font-display text-sm font-extrabold text-brand-on-surface">Növbəti yenilənmə</h4>
            <p className="text-xs font-semibold text-brand-on-surface-variant mt-1">Liderlik cədvəli hər həftə yenilənir.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
