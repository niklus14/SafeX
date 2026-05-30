import { AlertOctagon, MapPin, Heart, MessageCircle, MessageSquare, Phone } from 'lucide-react';
import { useApp } from '../store';

const ORGANIZATIONS = [
  { name: 'Nərimanov RİH', hotline: 'Qaynar xətt', number: null },
  { name: 'Azərsu', hotline: '955', number: '955' },
  { name: 'Azərişıq', hotline: '199', number: '199' },
  { name: 'Azəriqaz', hotline: '104', number: '104' },
  { name: 'Abadlıq xidməti', hotline: 'Qaynar xətt', number: null },
];

export default function FeedScreen() {
  const { state, dispatch, navigate } = useApp();
  const { reports, activeChip, user } = state;

  const filtered = reports.filter(r => {
    if (activeChip === 'AKTIV') return r.status === 'İCRADADIR' || r.status === 'GÖZLƏYİR';
    if (activeChip === 'HELLEDILIB') return r.status === 'HƏLL EDİLDİ';
    return true;
  });

  const openChat = (org: string) => {
    dispatch({ type: 'SELECT_ORG', org });
    navigate('chat');
  };

  const callHotline = (number: string | null) => {
    if (number) {
      window.location.href = `tel:${number}`;
    }
  };

  return (
    <>
      <main className="px-6 space-y-6 max-w-xl mx-auto w-full pt-4 pb-32">
        {/* Welcome */}
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#281716]">Salam, {user.name.split(' ')[0]} 🇦🇿</h1>
          <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">Şəhərimizdə problemləri bildirin və birlikdə həll edək.</p>
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

        {/* Social-style Report Cards */}
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
                className="bg-white rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5bdba]/15 overflow-hidden transition-all active:scale-[0.98] cursor-pointer hover:shadow-md"
              >
                {/* Post Header */}
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide leading-none ${statusColor}`}>
                      {report.status}
                    </span>
                    <span className="text-[9px] text-brand-on-surface-variant/70 font-bold">{report.category}</span>
                  </div>
                  <span className="text-[10px] text-brand-on-surface-variant/70 font-medium">{report.time}</span>
                </div>

                {/* Title */}
                <div className="px-4 py-2">
                  <h3 className="font-bold text-[#281716] text-base leading-tight">{report.title}</h3>
                </div>

                {/* Image */}
                {report.imageUrl && (
                  <div className="px-4 py-2">
                    <img
                      className="w-full rounded-2xl object-cover max-h-64"
                      src={report.imageUrl}
                      alt={report.title}
                    />
                  </div>
                )}

                {/* Location */}
                <div className="px-4 py-3 flex items-center gap-2 text-[11px] font-bold text-brand-on-surface-variant bg-white/50">
                  <MapPin size={14} className="text-brand-primary/80 flex-shrink-0" />
                  <span>{report.location}</span>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 flex items-center justify-between border-t border-[#e5bdba]/20 bg-white/30">
                  <button className="flex items-center gap-2 text-[11px] font-bold text-brand-on-surface-variant/80 hover:text-brand-primary transition-colors">
                    <Heart size={16} className={report.hasUserReacted ? 'fill-brand-primary text-brand-primary' : ''} />
                    <span>{report.reactionsCount}</span>
                  </button>
                  <button className="flex items-center gap-2 text-[11px] font-bold text-brand-on-surface-variant/80 hover:text-brand-primary transition-colors">
                    <MessageCircle size={16} />
                    <span>{report.comments.length}</span>
                  </button>
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

        {/* Organizations Section - moved lower */}
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider px-1">
            Qurumlarla əlaqə
          </h2>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
            {ORGANIZATIONS.map(org => (
              <div
                key={org.name}
                className="flex-shrink-0 w-32 bg-white rounded-2xl p-3 shadow-sm border border-[#e5bdba]/20 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all hover:shadow-md"
                onClick={() => openChat(org.name)}
              >
                <MessageSquare size={20} className="text-brand-primary mb-1.5" />
                <h3 className="text-[11px] font-bold text-[#281716] mb-2 leading-tight">{org.name}</h3>
                <p className="text-[9px] text-brand-on-surface-variant/70 font-medium mb-2">{org.hotline}</p>
                <button
                  className={`text-[9px] font-bold px-2 py-1 rounded-full transition-all ${
                    org.number
                      ? 'bg-brand-primary text-white hover:bg-brand-primary-container'
                      : 'bg-[#f0f0f0] text-brand-on-surface-variant/50'
                  }`}
                  onClick={e => {
                    e.stopPropagation();
                    callHotline(org.number);
                  }}
                  disabled={!org.number}
                >
                  <Phone size={10} className="inline mr-1" />
                  Zəng et
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-brand-low p-4 rounded-2xl border border-dashed border-[#e5bdba] flex gap-3 text-xs mb-6">
          <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary self-center shrink-0">
            <MessageSquare size={20} />
          </div>
          <div className="font-medium text-[#5c403e]/90 leading-relaxed">
            myRegion ilə birlikdə şəhərə xidmət göstərən qurumlarla birbaşa əlaqə saxlayın və problemlərin tez həllini təmin edin.
          </div>
        </div>
      </main>

    </>
  );
}
