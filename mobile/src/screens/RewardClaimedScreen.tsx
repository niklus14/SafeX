import { CheckCircle2, Copy } from 'lucide-react';
import { useApp } from '../store';

export default function RewardClaimedScreen() {
  const { state, dispatch, navigate, toast } = useApp();
  const { claimedReward } = state;
  if (!claimedReward) return null;

  const { reward, code } = claimedReward;

  function close() {
    dispatch({ type: 'CLEAR_CLAIMED' });
    navigate('rewards');
  }

  return (
    <div className="flex-grow flex flex-col bg-brand-surface justify-center items-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl border border-brand-outline-variant/30 relative overflow-hidden flex flex-col items-center">
        {/* Ticket cutout */}
        <div className="absolute top-1/2 -left-3 w-6 h-6 bg-brand-surface rounded-full -translate-y-1/2" />
        <div className="absolute top-1/2 -right-3 w-6 h-6 bg-brand-surface rounded-full -translate-y-1/2" />

        <div className="w-16 h-16 bg-[#ffe9e7] rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="text-[#bd0e21]" size={36} />
        </div>

        <h1 className="font-display text-xl font-extrabold text-[#281716] mb-1">Uğurla alındı!</h1>
        <p className="text-xs text-brand-on-surface-variant font-medium text-center mb-6">
          Mükafat kuponunuz aktivdir. Məbləğ balansınızdan çıxıldı.
        </p>

        {/* Reward summary */}
        <div className="w-full bg-[#fff0ef] rounded-[20px] p-4 mb-6 border border-[#e5bdba]/25 text-xs font-semibold">
          <div className="flex justify-between items-center mb-1.5 uppercase tracking-wider text-[10px] text-brand-on-surface-variant">
            <span>Məhsul növü</span>
            <span className="text-[#bd0e21] font-bold">{reward.cost} Coin</span>
          </div>
          <p className="text-sm font-bold text-brand-on-surface leading-tight">{reward.title}</p>
        </div>

        {/* QR code */}
        <div className="w-48 h-48 p-4 bg-white rounded-3xl border border-brand-outline-variant/30 flex items-center justify-center relative shadow-sm overflow-hidden mb-6 group">
          <div className="absolute left-0 w-full bg-brand-primary h-[2px] opacity-40 top-0 scanning-line-el shadow-[0_0_10px_#bd0e21]" />
          <img
            className="w-full h-full object-contain filter contrast-125"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD88b05xGqeGQQXwLM5Hgs6vbcmSiqWrig_koVXB9B5_Hj1tpf1BASUbBat3plfi-ehatZMzLCTGYnF5G1-dYg_wKDgRlqXj-2Y3TE4UxKkysAJZIJq9i0JsbnR-zF54Pd0gB17_5l3sVaZtV9De6eQm31F5MDurL5DyKLPgL_KTMuec8c0cuRVBJ11rg3a3RasXNJCrUlt9F74UUSg-9D5MlRurmSF5Z-phJGBWhKL2Svd4MvVia9KgGuZcsteGO8jfqZVsjZSYFU"
            alt="QR Code"
          />
        </div>

        {/* Code + copy */}
        <div className="flex flex-col items-center gap-1.5 mb-6 w-full text-center">
          <div className="inline-flex gap-3 items-center px-5 py-3 bg-[#f2d3d0]/30 rounded-xl border border-brand-primary/10 tracking-widest text-[#870012] font-extrabold font-display text-lg">
            <span>{code}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
                toast('Xüsusi kupon kodu kopyalandı!', 'success');
              }}
              className="p-1 cursor-pointer bg-white rounded-lg hover:bg-brand-primary/15 transition-all text-[#870012] active:scale-90"
            >
              <Copy size={16} />
            </button>
          </div>
          <p className="text-[10px] font-bold text-brand-on-surface-variant uppercase tracking-wider block mt-1">
            KODU KASSADA TƏQDİM EDİN
          </p>
        </div>

        <button
          onClick={close}
          className="w-full h-12 bg-brand-primary text-white font-bold rounded-full shadow-md active:scale-95 transition-transform text-sm cursor-pointer hover:bg-brand-primary-container"
        >
          Bağla
        </button>
      </div>
    </div>
  );
}
