import { Camera, Image, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { resolveLocation } from '../geolocate';

export default function CameraScreen() {
  const { dispatch, navigate, toast } = useApp();

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const [ready, setReady]   = useState(false);
  const [denied, setDenied] = useState(false);

  // ── Start camera + GPS in parallel on mount ─────────────────────────────────
  useEffect(() => {
    let alive = true;

    // Camera
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => { if (alive) setReady(true); }).catch(() => {});
        }
      })
      .catch(() => { if (alive) setDenied(true); });

    // GPS — resolve once and store in draft (not gated on `alive`: the value
    // should survive even if the user captures and navigates away quickly)
    resolveLocation()
      .then(({ lat, lng, location }) =>
        dispatch({ type: 'SET_DRAFT', patch: { lat, lng, location, isLocationCustom: false } }),
      )
      .catch(() => { /* denied/unavailable — keep default draft coords */ });

    return () => {
      alive = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Capture a frame from the live stream ─────────────────────────────────────
  function capture() {
    const video = videoRef.current;
    if (!video || !ready) return;

    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    streamRef.current?.getTracks().forEach(t => t.stop());
    dispatch({ type: 'SET_DRAFT', patch: { photo: dataUrl } });
    navigate('create-details');
    toast('Fotoşəkil çəkildi.', 'success');
  }

  // ── Gallery / file picker (fallback or explicit choice) ────────────────────
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    streamRef.current?.getTracks().forEach(t => t.stop());
    dispatch({ type: 'SET_DRAFT', patch: { photo: url } });
    navigate('create-details');
    toast('Şəkil seçildi.', 'success');
  }

  function close() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    navigate('feed');
  }

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex justify-between items-center p-4 text-white z-10 shrink-0">
        <button onClick={close} className="p-2 rounded-full bg-black/40 backdrop-blur-md">
          <X size={20} />
        </button>
        <span className="font-extrabold text-sm tracking-widest uppercase">Kamera</span>
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/80"
        >
          <Image size={20} />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {/* Live video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Corner guides */}
        {!denied && (
          <div className="absolute z-20 w-72 h-72 border-2 border-white/20 rounded-[32px] pointer-events-none">
            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white -translate-x-1 -translate-y-1 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white translate-x-1 -translate-y-1 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white -translate-x-1 translate-y-1 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white translate-x-1 translate-y-1 rounded-br-xl" />
          </div>
        )}

        {/* Permission denied state */}
        {denied && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-30 px-8 text-center">
            <Camera size={48} className="text-white/30" />
            <p className="text-white/70 text-sm font-semibold leading-relaxed">
              Kameraya icazə verilməyib. Qalereya şəklindən istifadə edin.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 bg-white text-black font-bold text-sm px-6 py-2.5 rounded-full active:scale-95 transition-transform"
            >
              Qalereyadan seç
            </button>
          </div>
        )}

        {/* Loading state */}
        {!ready && !denied && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Hint */}
        {ready && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-semibold z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Şəhər problemini çərçivəyə alın
          </div>
        )}
      </div>

      {/* Shutter bar */}
      <div className="h-36 bg-black flex items-center justify-around px-10 shrink-0">
        {/* Gallery shortcut */}
        <button
          onClick={() => fileRef.current?.click()}
          className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white/70 active:scale-95 transition-transform"
        >
          <Image size={22} />
        </button>

        {/* Shutter */}
        <button
          onClick={capture}
          disabled={!ready}
          className="w-20 h-20 bg-white rounded-full p-1 transition-transform active:scale-90 disabled:opacity-40"
        >
          <div className="w-full h-full rounded-full border-4 border-black flex items-center justify-center">
            <div className="w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center text-white">
              <Camera size={24} />
            </div>
          </div>
        </button>

        <div className="w-12" />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
