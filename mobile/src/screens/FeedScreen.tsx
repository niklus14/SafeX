import { MapPin, MessageCircle, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Report } from '../types';

// ── Skeleton ─────────────────────────────────────────────────────────────────

function TweetSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3.5 border-b border-[#e5bdba]/20 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-[#f5e8e7] shrink-0" />
      <div className="flex-1 space-y-2.5 pt-0.5">
        <div className="flex gap-2">
          <div className="h-3 w-28 bg-[#f5e8e7] rounded-full" />
          <div className="h-3 w-16 bg-[#f5e8e7] rounded-full" />
        </div>
        <div className="h-3.5 w-full bg-[#f5e8e7] rounded" />
        <div className="h-3.5 w-4/5 bg-[#f5e8e7] rounded" />
        <div className="h-44 w-full bg-[#f5e8e7] rounded-2xl" />
        <div className="h-3 w-1/2 bg-[#f5e8e7] rounded" />
      </div>
    </div>
  );
}

// ── Tweet card ────────────────────────────────────────────────────────────────

function TweetCard({
  report,
  onOpenThread,
  onOpenComments,
}: {
  report: Report;
  onOpenThread: () => void;
  onOpenComments: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  const statusBadge =
    report.status === 'HƏLL EDİLDİ'
      ? { label: 'Həll edildi', cls: 'bg-[#e8f5e9] text-[#2e7d32]' }
      : report.status === 'İCRADADIR'
      ? { label: 'İcradadır',  cls: 'bg-[#fff0ef] text-brand-primary' }
      : { label: 'Gözləyir',   cls: 'bg-[#f5f5f5] text-brand-on-surface-variant' };

  return (
    <article className="flex gap-3 px-4 border-b border-[#f0dbd9]/60">

      {/* Avatar — clicking opens thread */}
      <div
        onClick={onOpenThread}
        className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-[#f5e8e7] border border-[#e5bdba]/30 mt-3.5 cursor-pointer"
      >
        {report.reporterAvatar ? (
          <img
            src={report.reporterAvatar}
            alt={report.reporterName}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-primary font-bold text-sm">
            {report.reporterName.charAt(0)}
          </div>
        )}
      </div>

      {/* Content — clicking body opens thread, buttons are independent */}
      <div className="flex-1 min-w-0 py-3.5">

        {/* Meta + content area — whole thing opens thread */}
        <div onClick={onOpenThread} className="cursor-pointer">
          {/* Meta row */}
          <div className="flex items-center gap-1 flex-wrap mb-1 leading-none">
            <span className="font-bold text-[13px] text-[#1c0f0e] truncate max-w-[120px]">{report.reporterName}</span>
            <span className="text-[#c4a09e] text-[11px]">·</span>
            <span className="text-[11px] text-[#7a5250] font-medium truncate max-w-[90px]">{report.category}</span>
            <span className="text-[#c4a09e] text-[11px]">·</span>
            <span className="text-[11px] text-[#a08280]">{report.time}</span>
          </div>

          {/* Title — bold headline */}
          <p className="text-[15px] font-bold text-[#1c0f0e] leading-snug mb-2 line-clamp-2">
            {report.title}
          </p>

          {/* Description — secondary context, visually distinct */}
          {report.descr && (
            <div className="border-l-2 border-[#e5bdba] pl-2.5 mb-2.5">
              <p className="text-[12px] text-[#8a6260] leading-relaxed line-clamp-2 italic">
                {report.descr}
              </p>
            </div>
          )}

          {/* Image */}
          {report.imageUrl && !imgError && (
            <div className="mb-2.5 rounded-2xl overflow-hidden border border-[#e5bdba]/25 bg-[#f5e8e7]">
              <img
                src={report.imageUrl}
                alt={report.title}
                className="w-full object-cover max-h-56"
                onError={() => setImgError(true)}
              />
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-1 mb-3">
            <MapPin size={12} className="text-brand-primary/60 shrink-0" />
            <span className="text-[11.5px] text-[#8a6260] truncate">{report.location}</span>
          </div>
        </div>

        {/* ── Engagement row — each button is independent ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">

            {/* Comments — opens comment tab */}
            <button
              onClick={e => { e.stopPropagation(); onOpenComments(); }}
              className="flex items-center gap-1.5 text-[#a08280] hover:text-brand-primary transition-colors active:scale-95"
            >
              <MessageCircle size={16} />
              <span className="text-[12px] font-medium tabular-nums">{report.comments.length}</span>
            </button>

            {/* Thread/cluster count */}
            <button
              onClick={e => { e.stopPropagation(); onOpenThread(); }}
              className="flex items-center gap-1 text-[#c4a09e] hover:text-brand-primary/60 transition-colors active:scale-95"
            >
              <Users size={14} />
              <span className="text-[11px]">{report.reactionsCount} bildirdi</span>
            </button>
          </div>

          {/* Status pill */}
          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>
    </article>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: 'AKTIV' | 'HELLEDILIB' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-8">
      <div className="w-16 h-16 rounded-full bg-[#fff0ef] flex items-center justify-center mb-4">
        <MessageCircle size={28} className="text-brand-primary/40" />
      </div>
      <p className="text-sm font-bold text-[#281716]">
        {tab === 'AKTIV' ? 'Aktiv müraciət yoxdur' : 'Həll edilmiş müraciət yoxdur'}
      </p>
      <p className="text-xs text-[#a08280] mt-1 leading-relaxed">
        {tab === 'AKTIV'
          ? 'Hazırda aktiv problem qeydə alınmayıb.'
          : 'Hələ heç bir müraciət tamamlanmayıb.'}
      </p>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { state, dispatch, navigate } = useApp();
  const { reports, activeChip } = state;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.listIssues().then(data => {
      dispatch({ type: 'LOAD_FEED', issues: data.items });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Normalise: treat HAMISI same as AKTIV (2-tab design)
  const tab: 'AKTIV' | 'HELLEDILIB' = activeChip === 'HELLEDILIB' ? 'HELLEDILIB' : 'AKTIV';

  const filtered = reports.filter(r =>
    tab === 'AKTIV'
      ? r.status === 'İCRADADIR' || r.status === 'GÖZLƏYİR'
      : r.status === 'HƏLL EDİLDİ'
  );

  const activeCount   = reports.filter(r => r.status === 'İCRADADIR' || r.status === 'GÖZLƏYİR').length;
  const resolvedCount = reports.filter(r => r.status === 'HƏLL EDİLDİ').length;

  return (
    <div className="flex flex-col min-h-0">

      {/* ── X-style sticky tab bar ─────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#e5bdba]/30 flex">
        {(['AKTIV', 'HELLEDILIB'] as const).map(t => {
          const isActive = tab === t;
          const count = t === 'AKTIV' ? activeCount : resolvedCount;
          return (
            <button
              key={t}
              onClick={() => dispatch({ type: 'SET_CHIP', chip: t })}
              className={`flex-1 py-3.5 flex flex-col items-center gap-0.5 relative transition-colors cursor-pointer ${
                isActive ? 'text-[#1c0f0e]' : 'text-[#a08280] hover:text-[#6b4947]'
              }`}
            >
              <span className="text-[14px] font-bold leading-none">
                {t === 'AKTIV' ? 'Aktiv' : 'Həll Edilmiş'}
              </span>
              {count > 0 && (
                <span className={`text-[11px] font-semibold leading-none ${isActive ? 'text-brand-primary' : 'text-[#c4a09e]'}`}>
                  {count}
                </span>
              )}
              {/* Underline indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-14 bg-brand-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Feed list ──────────────────────────────────────────── */}
      <div>
        {/* Loading skeletons */}
        {loading && reports.length === 0 && (
          <>{[1, 2, 3, 4].map(n => <TweetSkeleton key={n} />)}</>
        )}

        {/* Tweet cards */}
        {filtered.map(report => (
          <TweetCard
            key={report.id}
            report={report}
            onOpenThread={() => {
              dispatch({ type: 'SELECT_REPORT', id: report.id, view: 'thread' });
              navigate('report-detail');
            }}
            onOpenComments={() => {
              dispatch({ type: 'SELECT_REPORT', id: report.id, view: 'comments' });
              navigate('report-detail');
            }}
          />
        ))}

        {/* Empty state */}
        {!loading && filtered.length === 0 && <EmptyState tab={tab} />}

        {/* Bottom padding for nav bar */}
        <div className="h-24" />
      </div>
    </div>
  );
}
