import { MapPin, ThumbsUp } from 'lucide-react';
import { useApp } from '../store';

export default function MyReportsScreen() {
  const { state, dispatch, navigate } = useApp();
  const { reports } = state;

  const activeCount = reports.filter(r => r.status === 'İCRADADIR' || r.status === 'GÖZLƏYİR').length;
  const solvedCount = reports.filter(r => r.status === 'HƏLL EDİLDİ').length;

  return (
    <main className="px-6 space-y-6 max-w-xl mx-auto w-full pt-4">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[#281716]">Müraciətlərim</h1>
        <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">
          Sizin tərəfinizdən göndərilmiş və ya dəstəklənmiş bütün müraciətlər
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-[#e5bdba]/15 text-center shadow-sm">
          <p className="text-base font-extrabold text-[#281716] leading-none mb-1">{reports.length}</p>
          <span className="text-[10px] text-brand-on-surface-variant font-bold uppercase tracking-wider">Cəm</span>
        </div>
        <div className="bg-[#ffe9e7]/50 p-3 rounded-2xl border border-brand-primary/5 text-center shadow-sm">
          <p className="text-base font-extrabold text-brand-primary leading-none mb-1">{activeCount}</p>
          <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">Aktiv</span>
        </div>
        <div className="bg-[#e8f5e9] p-3 rounded-2xl border border-black/5 text-center shadow-sm">
          <p className="text-base font-extrabold text-[#2e7d32] leading-none mb-1">{solvedCount}</p>
          <span className="text-[10px] text-[#2e7d32] font-bold uppercase tracking-wider">Həll edilib</span>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4 pb-8">
        {reports.map(report => (
          <div
            key={report.id}
            onClick={() => {
              dispatch({ type: 'SELECT_REPORT', id: report.id });
              navigate('report-detail');
            }}
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e5bdba]/15 transition-all active:scale-[0.98] cursor-pointer hover:shadow-md"
          >
            <div className="aspect-video w-full bg-[#fadbd9] relative overflow-hidden">
              <img className="w-full h-full object-cover" src={report.imageUrl} alt={report.title} />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                {report.status}
              </div>
              <div className="absolute bottom-3 right-3 bg-white text-brand-primary rounded-lg px-2.5 py-1 text-[11px] font-bold flex items-center gap-1">
                <ThumbsUp size={11} />
                <span>{report.reactionsCount} sakin</span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-center text-[10px] text-[#5c403e] font-display font-semibold">
                <span>{report.category}</span>
                <span>{report.date}</span>
              </div>
              <h3 className="font-bold text-sm text-[#281716] leading-snug line-clamp-1">{report.title}</h3>
              <div className="flex items-center gap-2 text-xs text-brand-on-surface-variant font-medium pt-1 border-t border-[#fadbd9]/30">
                <MapPin size={12} className="text-brand-primary shrink-0" />
                <span className="truncate">{report.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
