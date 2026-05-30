import { ChevronUp, MapPin } from 'lucide-react';
import { useApp } from '../store';

export default function MyReportsScreen() {
  const { state, dispatch, navigate } = useApp();
  const { reports } = state;

  const myReports = reports.filter(r => r.isOwn);
  const activeCount = myReports.filter(r => r.status === 'İCRADADIR' || r.status === 'GÖZLƏYİR').length;
  const solvedCount = myReports.filter(r => r.status === 'HƏLL EDİLDİ').length;

  const statusLabel = (s: string) =>
    s === 'HƏLL EDİLDİ' ? 'Həll edildi' : s === 'İCRADADIR' ? 'İcradadır' : 'Gözləyir';

  const statusCls = (s: string) =>
    s === 'HƏLL EDİLDİ'
      ? 'bg-[#e8f5e9] text-[#2e7d32]'
      : s === 'İCRADADIR'
      ? 'bg-[#fff0ef] text-brand-primary'
      : 'bg-black/30 text-white';

  return (
    <main className="px-4 space-y-5 max-w-xl mx-auto w-full pt-4 pb-32">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[#281716]">Müraciətlərim</h1>
        <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">
          Sizin tərəfinizdən göndərilmiş və ya dəstəklənmiş bütün müraciətlər
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-[#e5bdba]/20 text-center">
          <p className="text-lg font-extrabold text-[#1c0f0e] leading-none mb-0.5">{myReports.length}</p>
          <span className="text-[10px] text-[#a08280] font-semibold uppercase tracking-wider">Cəm</span>
        </div>
        <div className="bg-[#fff0ef] p-3 rounded-2xl border border-brand-primary/10 text-center">
          <p className="text-lg font-extrabold text-brand-primary leading-none mb-0.5">{activeCount}</p>
          <span className="text-[10px] text-brand-primary font-semibold uppercase tracking-wider">Aktiv</span>
        </div>
        <div className="bg-[#e8f5e9] p-3 rounded-2xl border border-[#2e7d32]/10 text-center">
          <p className="text-lg font-extrabold text-[#2e7d32] leading-none mb-0.5">{solvedCount}</p>
          <span className="text-[10px] text-[#2e7d32] font-semibold uppercase tracking-wider">Həll edilib</span>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {myReports.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#fff0ef] flex items-center justify-center mx-auto mb-3">
              <MapPin size={22} className="text-brand-primary/40" />
            </div>
            <p className="text-[13px] font-bold text-[#1c0f0e]">Hələ müraciətiniz yoxdur</p>
            <p className="text-[12px] text-[#a08280] mt-1">Lentdən problem bildirin.</p>
          </div>
        )}
        {myReports.map(report => (
          <div
            key={report.id}
            onClick={() => {
              dispatch({ type: 'SELECT_REPORT', id: report.id, view: 'thread' });
              navigate('report-detail');
            }}
            className="bg-white rounded-2xl overflow-hidden border border-[#e5bdba]/20 transition-all active:scale-[0.98] cursor-pointer hover:border-[#e5bdba]/50"
          >
            {/* Image */}
            <div className="w-full bg-[#f5e8e7] relative overflow-hidden" style={{ aspectRatio: '16/7' }}>
              <img className="w-full h-full object-cover" src={report.imageUrl} alt={report.title}
                onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
              {/* Status pill */}
              <span className={`absolute top-2.5 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${statusCls(report.status)}`}>
                {statusLabel(report.status)}
              </span>
              {/* Upvote count */}
              <div className="absolute bottom-2.5 right-3 bg-black/50 backdrop-blur-md text-white rounded-lg px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                <ChevronUp size={12} strokeWidth={2.5} />
                <span>{report.reactionsCount}</span>
              </div>
            </div>
            {/* Info */}
            <div className="px-3.5 py-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-brand-primary font-bold bg-[#fff0ef] px-2 py-0.5 rounded-full">{report.category}</span>
                <span className="text-[10px] text-[#a08280]">{report.date}</span>
              </div>
              <h3 className="font-bold text-[13px] text-[#1c0f0e] leading-snug line-clamp-1">{report.title}</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-[#8a6260] pt-0.5 border-t border-[#f0dbd9]/60">
                <MapPin size={11} className="text-brand-primary/60 shrink-0" />
                <span className="truncate">{report.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
