import { Camera, Check, ChevronRight, MapPin, Shield } from 'lucide-react';
import { useApp } from '../store';

export default function PermissionsScreen() {
  const { state, dispatch, navigate, toast } = useApp();
  const { permissions } = state;

  function grant(perm: 'camera' | 'location') {
    dispatch({ type: 'GRANT_PERMISSION', perm });
    toast(`${perm === 'camera' ? 'Kamera' : 'Məkan'} icazəsi uğurla təmin edildi.`, 'success');
  }

  function proceed() {
    if (!permissions.camera) dispatch({ type: 'GRANT_PERMISSION', perm: 'camera' });
    if (!permissions.location) dispatch({ type: 'GRANT_PERMISSION', perm: 'location' });
    navigate('feed');
    toast('Openwave-ə xoş gəlmisiniz! Cari xəritə və lent yükləndi.', 'success');
  }

  return (
    <div className="absolute inset-0 z-50 bg-[#fff8f7] flex flex-col p-6 overflow-y-auto">
      {/* Header */}
      <div className="mt-6 text-center">
        <div className="inline-flex p-3 bg-brand-primary/10 rounded-full text-brand-primary mb-3">
          <Shield size={36} />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-brand-on-surface mb-2">Lazımi icazələr</h1>
        <p className="text-xs text-brand-on-surface-variant max-w-sm mx-auto mb-8 leading-relaxed">
          Tətbiqin tam funksionallığından və süni intellekt analizindən yararlanmaq üçün aşağıdakı girişləri təmin edin.
        </p>
      </div>

      <div className="flex-grow space-y-4 max-w-sm mx-auto w-full">
        {/* Camera */}
        <div className="bg-white p-5 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5bdba]/30 flex gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary h-fit">
            <Camera size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-brand-on-surface">Kamera Girişi</h3>
            <p className="text-xs text-brand-on-surface-variant mb-4 leading-normal mt-1">
              Problemi yerindəcə fotoşəkil ilə çəkib sənədləşdirmək üçün tələb olunur.
            </p>
            {permissions.camera ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded-full">
                <Check size={14} /> İcazə verildi
              </span>
            ) : (
              <button
                onClick={() => grant('camera')}
                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-full hover:bg-brand-primary-container active:scale-95 transition-all"
              >
                İcazə ver
              </button>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white p-5 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5bdba]/30 flex gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary h-fit">
            <MapPin size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-brand-on-surface">Məkan Girişi</h3>
            <p className="text-xs text-brand-on-surface-variant mb-4 leading-normal mt-1">
              Problemin dəqiq ünvanını avtomatik müəyyənləşdirib aidiyyatı quruma ötürmək üçün lazımdır.
            </p>
            {permissions.location ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded-full">
                <Check size={14} /> İcazə verildi
              </span>
            ) : (
              <button
                onClick={() => grant('location')}
                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-full hover:bg-brand-primary-container active:scale-95 transition-all"
              >
                İcazə ver
              </button>
            )}
          </div>
        </div>

        <div className="bg-[#fadbd9]/30 p-4 rounded-xl border border-dashed border-[#e5bdba] mt-4">
          <p className="text-xs text-brand-on-surface-variant/90 italic leading-relaxed text-center">
            Məlumatlarınızın təhlükəsizliyinə dövlət tərəfindən 100% təminat verilir və yalnız rəsmi orqanlar ilə paylaşılır.
          </p>
        </div>
      </div>

      <div className="mt-8 pb-6 flex justify-center">
        <button
          onClick={proceed}
          className="w-full max-w-xs h-14 bg-brand-primary text-white font-bold rounded-full shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer hover:bg-brand-primary-container"
        >
          Hazırdır <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
