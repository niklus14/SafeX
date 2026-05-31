import { Camera, Check, ChevronRight, Loader, MapPin, Shield, X } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../store';

type PermState = 'idle' | 'requesting' | 'granted' | 'denied';

export default function PermissionsScreen() {
  const { dispatch, navigate } = useApp();

  const [camera, setCamera]     = useState<PermState>('idle');
  const [location, setLocation] = useState<PermState>('idle');

  // ── Camera ────────────────────────────────────────────────────────────────
  // IMPORTANT: call getUserMedia DIRECTLY in the tap handler. Any `await` before
  // it (e.g. navigator.permissions.query) consumes the user-activation on mobile
  // Safari/Chrome and the prompt silently never appears.
  function requestCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('denied');
      return;
    }
    setCamera('requesting');
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop()); // only needed the prompt
        setCamera('granted');
        dispatch({ type: 'GRANT_PERMISSION', perm: 'camera' });
      })
      .catch(() => setCamera('denied'));
  }

  // ── Location ──────────────────────────────────────────────────────────────
  function requestLocation() {
    if (!navigator.geolocation) {
      setLocation('denied');
      return;
    }
    setLocation('requesting');
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocation('granted');
        dispatch({ type: 'GRANT_PERMISSION', perm: 'location' });
      },
      () => setLocation('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const allDone = camera !== 'idle' && location !== 'idle';

  function PermButton({ state, onRequest }: { state: PermState; onRequest: () => void }) {
    if (state === 'granted') return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded-full">
        <Check size={13} /> İcazə verildi
      </span>
    );
    if (state === 'denied') return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fce4ec] text-[#c62828] text-xs font-bold rounded-full">
        <X size={13} /> İmtina edildi
      </span>
    );
    if (state === 'requesting') return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-low text-brand-primary text-xs font-bold rounded-full">
        <Loader size={13} className="animate-spin" /> Gözlənilir…
      </span>
    );
    return (
      <button
        onClick={onRequest}
        className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-full hover:bg-brand-primary-container active:scale-95 transition-all"
      >
        İcazə ver
      </button>
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-[#fff8f7] flex flex-col p-6 overflow-y-auto">
      <div className="mt-6 text-center">
        <div className="inline-flex p-3 bg-brand-primary/10 rounded-full text-brand-primary mb-3">
          <Shield size={36} />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-brand-on-surface mb-2">Lazımi icazələr</h1>
        <p className="text-xs text-brand-on-surface-variant max-w-sm mx-auto mb-8 leading-relaxed">
          Tətbiqin tam funksionallığından yararlanmaq üçün aşağıdakı icazələri təmin edin.
        </p>
      </div>

      <div className="flex-grow space-y-4 max-w-sm mx-auto w-full">
        <div className="bg-white p-5 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5bdba]/30 flex gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary h-fit shrink-0">
            <Camera size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-brand-on-surface">Kamera</h3>
            <p className="text-xs text-brand-on-surface-variant mb-4 leading-normal mt-1">
              Problemi yerindəcə fotoşəkil ilə çəkib sənədləşdirmək üçün tələb olunur.
            </p>
            <PermButton state={camera} onRequest={requestCamera} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5bdba]/30 flex gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary h-fit shrink-0">
            <MapPin size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-brand-on-surface">Məkan</h3>
            <p className="text-xs text-brand-on-surface-variant mb-4 leading-normal mt-1">
              Problemin dəqiq ünvanını avtomatik müəyyənləşdirib aidiyyatı quruma ötürmək üçün lazımdır.
            </p>
            <PermButton state={location} onRequest={requestLocation} />
          </div>
        </div>

        {(camera === 'denied' || location === 'denied') && (
          <p className="text-[11px] text-brand-on-surface-variant/70 text-center leading-relaxed px-2">
            İmtina edilmiş icazəni bərpa etmək üçün brauzer parametrlərindən sayt icazələrini açın.
          </p>
        )}

        <div className="bg-[#fadbd9]/30 p-4 rounded-xl border border-dashed border-[#e5bdba]">
          <p className="text-xs text-brand-on-surface-variant/90 italic leading-relaxed text-center">
            Məlumatlarınız yalnız rəsmi icra orqanları ilə paylaşılır.
          </p>
        </div>
      </div>

      <div className="mt-8 pb-6 flex justify-center">
        <button
          onClick={navigate.bind(null, 'feed')}
          disabled={!allDone}
          className="w-full max-w-xs h-14 bg-brand-primary text-white font-bold rounded-full shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer hover:bg-brand-primary-container disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Hazırdır <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
