import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';

const STEPS = [
  'Şəkil təhlil edilir',
  'Mövzu kateqoriyası təyin olunur',
  'Aidiyyəti icraçı orqan tapılır',
];

export default function AIAnalysisScreen() {
  const { state, dispatch, toast } = useApp();
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p > 70) setStep(3);
      else if (p > 35) setStep(2);

      if (p >= 100) {
        clearInterval(interval);

        // Dispatch state update (creates report + navigates to success)
        dispatch({ type: 'COMPLETE_ANALYSIS' });
        toast('Müraciət qəbul edildi! +10 Coin Balansınıza Əlavə Olundu.', 'success');

        // Also persist to backend asynchronously
        const uid = state.userId;
        if (uid !== null) {
          const lat = 40.4093 + (Math.random() - 0.5) * 0.005;
          const lng = 49.8671 + (Math.random() - 0.5) * 0.005;
          api
            .submitReport({
              imageUrl: state.draft.photo,
              description: state.draft.description,
              lat,
              lng,
              userId: uid,
            })
            .then(result => {
              if (result.is_relevant && result.issue_id) {
                // We can't easily get the just-created localId here since state was already updated.
                // The store's COMPLETE_ANALYSIS creates the report; we just note the API id.
                dispatch({ type: 'MAP_API_ISSUE', localId: '', apiId: result.issue_id });
                if (result.joined_thread) {
                  dispatch({ type: 'UPDATE_USER', patch: { coins: state.user.coins + 10 - 5 } });
                }
              }
            })
            .catch(() => {});
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-[#fff8f7] flex flex-col justify-center items-center px-6 text-center">
      {/* Pulsing icon */}
      <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-brand-primary/10 rounded-full animate-ping opacity-60" />
        <div className="absolute inset-4 bg-brand-primary/20 rounded-full animate-pulse" />
        <div className="relative z-10 w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-xl">
          <span className="material-symbols-outlined !text-[48px] animate-pulse">psychology</span>
        </div>
        <div className="absolute w-56 h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent blur-sm z-20 scanning-line-el top-0" />
      </div>

      <h2 className="font-display text-xl font-extrabold text-[#281716] mb-2">Məlumatlar emal olunur</h2>
      <p className="text-xs text-brand-on-surface-variant max-w-[280px] mx-auto mb-10 leading-normal">
        Süni intellekt müraciətinizi yoxlayır, şəkli analiz edir və aidiyyatı qurumu təyin edir...
      </p>

      {/* Steps */}
      <div className="w-full max-w-xs space-y-4 text-left">
        {STEPS.map((label, idx) => {
          const stepNum = idx + 1;
          const done = step > stepNum;
          const active = step === stepNum;
          return (
            <div key={idx} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? 'bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32]'
                    : active
                    ? 'bg-[#ffe9e7] border-brand-primary text-brand-primary'
                    : 'bg-brand-low border-brand-outline-variant text-brand-on-surface-variant/45'
                }`}
              >
                {done ? <Check size={16} /> : <span className="text-xs font-bold">{stepNum}</span>}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-bold ${active || done ? 'text-brand-primary' : 'text-brand-on-surface-variant'}`}>
                  {label}
                </p>
                {active && (
                  <div className="w-full h-1 bg-brand-highest rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all duration-150"
                      style={{ width: `${Math.min(100, progress * 3)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
