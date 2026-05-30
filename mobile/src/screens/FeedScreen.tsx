import { AlertOctagon, Award, MapPin } from 'lucide-react';
import { useApp } from '../store';

export default function FeedScreen() {
  const { state, dispatch, navigate } = useApp();
  const { reports, activeChip, user } = state;

  const filtered = reports.filter(r => {
    if (activeChip === 'AKTIV') return r.status === 'İCRADADIR' || r.status === 'GÖZLƏYİR';
    if (activeChip === 'HELLEDILIB') return r.status === 'HƏLL EDİLDİ';
    return true;
  });

  return (
    <main className="px-6 space-y-6 max-w-xl mx-auto w-full pt-4">
      {/* Welcome + coin banner */}
      <div>
        <h1 className="font-display text-xl font-extrabold text-[#281716]">Salam, {user.name.split(' ')[0]} 🇦🇿</h1>
        <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">Xoş gördük! Şəhərimizi abadlaşdırmağa davam edin.</p>
      </div>

      <div className="bg-[#bd0e21] rounded-3xl p-5 text-white shadow-lg overflow-hidden relative">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute right-4 top-4 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
          Güncəlləmə
        </div>
        <h3 className="font-display text-base font-extrabold mb-1">Mövcud Balansınız</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold font-display leading-none">{user.coins}</span>
          <span className="text-[11px] font-bold text-[#ffbeb9] tracking-wider uppercase">civic coin</span>
        </div>
        <p className="text-[11px] text-white/85 mt-3 max-w-xs font-medium leading-relaxed">
          Zədələnmiş yolları, zibillikləri və ya işləməyən lampaları lentdə dəstəkləyib xalınızı artırın!
        </p>
      </div>

      {/* Filter chips */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider px-1">
          <span>Müraciətlər</span>
          <span
            className="text-[11px] text-[#bd0e21] font-bold hover:underline cursor-pointer"
            onClick={() => navigate('my-reports')}
          >
            Hamısı ({reports.length})
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {(['HAMISI', 'AKTIV', 'HELLEDILIB'] as const).map(chip => (
            <button
              key={chip}
              onClick={() => dispatch({ type: 'SET_CHIP', chip })}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
                activeChip === chip
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-white text-brand-on-surface-variant border border-[#e5bdba]/50 hover:bg-[#fff0ef]/40'
              }`}
            >
              {chip === 'HAMISI' ? 'Hamısı' : chip === 'AKTIV' ? 'Aktiv' : 'Həll edilib'}
            </button>
          ))}
        </div>
      </div>

      {/* Report cards */}
      <div className="space-y-4">
        {filtered.map(report => {
          const statusColor =
            report.status === 'HƏLL EDİLDİ'
              ? 'bg-[#e8f5e9] text-[#2e7d32]'
              : report.status === 'İCRADADIR'
              ? 'bg-[#fff0ef] text-brand-primary'
              : 'bg-brand-highest text-brand-on-surface-variant';

          return (
            <div
              key={report.id}
              onClick={() => {
                dispatch({ type: 'SELECT_REPORT', id: report.id });
                navigate('report-detail');
              }}
              className="bg-white p-4 rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5bdba]/15 flex gap-4 transition-all active:scale-[0.98] cursor-pointer hover:shadow-md"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[#fadbd9] border border-[#e5bdba]/10">
                <img className="w-full h-full object-cover select-none" src={report.imageUrl} alt={report.title} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide leading-none ${statusColor}`}>
                      {report.status}
                    </span>
                    <span className="text-[10px] text-brand-on-surface-variant/70 shrink-0 font-medium">{report.time}</span>
                  </div>
                  <h3 className="font-bold text-[#281716] text-sm mt-1 leading-tight truncate">{report.title}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-on-surface-variant mt-1.5">
                  <MapPin size={12} className="text-brand-primary/80" />
                  <span className="truncate">{report.location}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white/50 p-10 rounded-3xl border border-dashed border-[#e5bdba]/30 text-center">
            <AlertOctagon className="text-brand-on-surface-variant/40 mx-auto mb-2" size={32} />
            <p className="text-sm text-brand-on-surface-variant font-bold">Heç bir müraciət tapılmadı</p>
            <p className="text-xs text-brand-on-surface-variant/60 mt-1 max-w-xs mx-auto">
              Filtrləri təmizləyin və ya yeni müraciət edin.
            </p>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-brand-low p-4 rounded-2xl border border-dashed border-[#e5bdba] flex gap-3 text-xs mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary self-center shrink-0">
          <Award size={20} />
        </div>
        <div className="font-medium text-[#5c403e]/90 leading-relaxed">
          Şəhərimiz Openwave ilə daha gözəldir. Hər həll olunmuş müraciətlər sakinlərə mükafat və rəqəmsal xallar qazandırır.
        </div>
      </div>
    </main>
  );
}
