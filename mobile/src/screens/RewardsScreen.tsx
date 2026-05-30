import { Award } from 'lucide-react';
import { useApp } from '../store';

export default function RewardsScreen() {
  const { state, dispatch, navigate, toast } = useApp();
  const { rewards, user } = state;

  function claim(reward: (typeof rewards)[0]) {
    if (user.coins < reward.cost) {
      toast(`Kifayət qədər Coin yoxdur. Əlavə ${reward.cost - user.coins} Coin lazımdır!`, 'error');
      return;
    }
    const code = `OW-${Math.floor(100 + Math.random() * 900)}-X`;
    dispatch({ type: 'CLAIM_REWARD', reward, code });
    toast(`${reward.badge} kuponu uğurla alındı! Kassada təqdim edin.`, 'success');
  }

  return (
    <main className="px-6 space-y-6 max-w-xl mx-auto w-full pt-4">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[#281716]">Mükafatlar</h1>
        <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">
          Bakı abadlığı üçün qazandığınız Coinləri endirimlərə dəyişin
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
            { letter: 'A', label: 'Yeni dürüst müraciət', coin: '+10 Coin', color: 'bg-green-100 text-green-700' },
            { letter: 'B', label: 'Digər müraciət təsdiqlənməsi', coin: '+5 Coin', color: 'bg-blue-100 text-blue-700' },
            { letter: 'C', label: 'Problem rəsmən həll olunduqda', coin: '+20 Coin', color: 'bg-amber-100 text-amber-700' },
          ].map(row => (
            <div key={row.letter} className="flex items-center justify-between p-3 border-b border-[#e5bdba]/20 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${row.color}`}>{row.letter}</span>
                <span className="text-brand-on-surface">{row.label}</span>
              </div>
              <span className="text-[#870012] font-bold font-display">{row.coin}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Reward grid */}
      <section className="space-y-3 pb-8">
        <h3 className="font-display text-sm font-extrabold text-brand-on-surface-variant px-1">Xüsusi Təkliflər</h3>
        <div className="grid grid-cols-2 gap-4">
          {rewards.map(reward => (
            <div
              key={reward.id}
              className="bg-white rounded-2xl overflow-hidden border border-[#e5bdba]/15 shadow-sm p-3.5 flex flex-col justify-between group hover:shadow-md transition-all"
            >
              <div>
                <div className="aspect-square rounded-xl overflow-hidden bg-brand-low relative mb-3">
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-all" src={reward.imageUrl} alt={reward.title} />
                  <span className="absolute top-2 right-2 bg-[#bd0e21] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full leading-none">
                    {reward.badge}
                  </span>
                </div>
                <h4 className="font-bold text-[#281716] text-xs leading-snug line-clamp-2 mb-2">{reward.title}</h4>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#fadbd9]/30 mt-auto">
                <div className="flex items-center gap-1 font-extrabold text-[#bd0e21]">
                  <span className="text-xs">{reward.cost}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider">Coin</span>
                </div>
                <button
                  onClick={() => claim(reward)}
                  className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-full hover:bg-brand-primary-container active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Al
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
