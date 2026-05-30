import {
  ArrowLeft,
  Check,
  Compass,
  Flame,
  ImagePlus,
  MapPin,
  MessageSquare,
  Send,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { ReportComment } from '../types';
import { api } from '../api';

export default function ReportDetailScreen() {
  const { state, dispatch, navigate, toast } = useApp();
  const { selectedReportId, reports, prevScreen, user, apiIssueIds } = state;

  // Sync live status / steps / org from the backend when an apiIssueId exists
  useEffect(() => {
    if (!selectedReportId) return;
    const apiId = apiIssueIds[selectedReportId];
    if (!apiId) return;
    api.getIssue(apiId).then(issue => {
      const statusMap: Record<string, 'İCRADADIR' | 'HƏLL EDİLDİ' | 'GÖZLƏYİR'> = {
        ai_review: 'GÖZLƏYİR', manual_review: 'GÖZLƏYİR', routed: 'GÖZLƏYİR',
        in_progress: 'İCRADADIR', resolved: 'HƏLL EDİLDİ', rejected: 'HƏLL EDİLDİ',
      };
      dispatch({
        type: 'UPDATE_REPORT',
        id: selectedReportId,
        patch: {
          status: statusMap[issue.status] ?? 'GÖZLƏYİR',
          authority: issue.org?.name_az ?? undefined,
          reactionsCount: issue.report_count,
          steps: issue.steps.map(s => ({
            name: s.name,
            status: s.status as 'completed' | 'current' | 'pending',
            subtitle: s.subtitle,
          })),
        },
      });
    }).catch(() => {/* API offline — show local optimistic state */});
  }, [selectedReportId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [commentText, setCommentText] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showAllStatusSteps, setShowAllStatusSteps] = useState(false);
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const report = reports.find(r => r.id === selectedReportId);
  if (!report) return null;

  function support() {
    if (report!.hasUserReacted) { toast('Siz artıq bu müraciəti dəstəkləmisiniz.', 'info'); return; }
    dispatch({ type: 'SUPPORT_REPORT', id: report!.id, userName: user.name, avatar: user.avatar });
    toast('Müraciətiniz digər vətəndaşlarla birləşdirildi! +5 Coin', 'success');
  }

  function addComment() {
    if (!commentText.trim() && !commentImage) return;
    const c: ReportComment = {
      id: `comment-${Date.now()}`,
      author: `${user.name} (Siz)`,
      avatar: user.avatar,
      time: 'İndi',
      text: commentText.trim() || 'Əlavə şəkil sübutu göndərildi.',
      imageUrl: commentImage || undefined,
    };
    dispatch({ type: 'ADD_COMMENT', reportId: report!.id, comment: c });
    setCommentText('');
    setCommentImage(null);
    toast('Bildirişiniz mövzuya əlavə edildi! +2 Coin', 'success');
  }

  function attachCommentImage(file: File | null) {
    if (!file) return;
    setCommentImage(URL.createObjectURL(file));
  }

  const statusColor =
    report.status === 'HƏLL EDİLDİ' ? 'bg-[#e8f5e9] text-[#2e7d32]'
    : report.status === 'İCRADADIR' ? 'bg-[#fff0ef] text-brand-primary'
    : 'bg-brand-highest text-brand-on-surface-variant';

  const currentStatusStep =
    report.steps.find(step => step.status === 'current') ||
    [...report.steps].reverse().find(step => step.status === 'completed') ||
    report.steps[0];

  const visibleStatusSteps = showAllStatusSteps
    ? report.steps
    : currentStatusStep
      ? [currentStatusStep]
      : [];

  const shouldTruncateDescription = report.descr.length > 110;
  const visibleDescription =
    isDescriptionExpanded || !shouldTruncateDescription
      ? report.descr
      : `${report.descr.slice(0, 110).trim()}...`;

  return (
    /* Flex column that fills the phone-root: header | scrollable content | footer */
    <div className="flex-grow flex flex-col min-h-0 bg-brand-surface">

      {/* ── Header — in-flow ────────────────────────────────── */}
      <header className="shrink-0 h-16 bg-white/90 backdrop-blur-md border-b border-[#e5bdba]/30 shadow-sm z-10 flex items-center justify-between px-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(prevScreen || 'feed')}
            className="p-2 -ml-2 text-brand-primary hover:bg-[#ffe9e7] rounded-full transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="ml-2 font-display text-lg font-extrabold text-[#281716] tracking-tight">Müraciət</h1>
        </div>
        <div className="bg-[#ffe9e7] text-brand-primary px-3 py-1 rounded-full text-[11px] font-bold tracking-wider truncate max-w-[120px]">
          {report.category}
        </div>
      </header>

      {/* ── Scrollable body ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <main className="px-6 pt-4 pb-6 max-w-xl mx-auto w-full space-y-6">

          {/* Hero card */}
          <article className="bg-white rounded-2xl shadow-md border border-[#e5bdba]/15 overflow-hidden">
            <div className="p-4 border-b border-[#e5bdba]/20 flex justify-between items-start gap-3">
              <div className="min-w-0">
                <div className="flex gap-2 items-center mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${statusColor}`}>
                    {report.status}
                  </span>
                  <span className="text-[11px] font-bold text-brand-on-surface-variant/80">ID: {report.id}</span>
                </div>
                <h2 className="font-bold text-base text-brand-on-surface leading-tight">{report.title}</h2>
              </div>
              <span className="text-xs text-brand-on-surface-variant/70 shrink-0 font-medium whitespace-nowrap pt-1">{report.time}</span>
            </div>
            <div className="aspect-video w-full bg-[#fadbd9] relative overflow-hidden group">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" src={report.imageUrl} alt={report.title} />
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
                <MapPin size={12} />
                <span className="truncate max-w-[200px]">{report.location}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#fadbd9]/30 mb-3">
                <div className="w-10 h-10 rounded-full border border-brand-primary/20 overflow-hidden shrink-0">
                  <img className="w-full h-full object-cover" src={report.reporterAvatar} alt="Reporter" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#281716] truncate">{report.reporterName}</p>
                  <span className="text-[10px] font-medium text-brand-on-surface-variant/70 block">Müraciət sahibi</span>
                </div>
                <span className="text-[10px] text-brand-on-surface-variant px-2.5 py-1 bg-[#fff0ef] rounded-lg border border-[#e5bdba]/40 shrink-0 font-display">
                  {report.id.startsWith('#RG-') ? 'Siz' : 'Sakin'}
                </span>
              </div>
              <div className="text-xs leading-normal font-medium text-[#281716] bg-brand-low/40 p-3 rounded-xl border border-dashed border-[#e5bdba]/40">
                <p className="whitespace-pre-line">{visibleDescription}</p>
                {shouldTruncateDescription && (
                  <button
                    onClick={() => setIsDescriptionExpanded(v => !v)}
                    className="mt-2 text-brand-primary font-extrabold text-[11px] active:scale-95 transition-all"
                  >
                    {isDescriptionExpanded ? 'Daha az göstər' : 'Davamı'}
                  </button>
                )}
              </div>
            </div>
          </article>

          {/* Status stepper */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5bdba]/20">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-brand-on-surface flex items-center gap-1.5">
                <Flame size={16} className="text-brand-primary" /> Cari status
              </h3>
              <button
                onClick={() => setShowAllStatusSteps(v => !v)}
                className="px-3 py-1.5 rounded-full bg-[#fff0ef] text-brand-primary text-[10px] font-extrabold active:scale-95 transition-all"
              >
                {showAllStatusSteps ? 'Gizlət' : 'Hamısı'}
              </button>
            </div>
            <div className="relative pl-1">
              {showAllStatusSteps && (
                <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-brand-outline-variant/30 z-0" />
              )}
              <div className="space-y-4 relative z-10">
                {visibleStatusSteps.map((step, i) => {
                  const realIndex = report.steps.findIndex(s => s.name === step.name);
                  return (
                    <div key={`${step.name}-${i}`} className={`flex items-start gap-3.5 ${step.status === 'pending' ? 'opacity-40' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all relative ${
                        step.status === 'completed' ? 'bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32]'
                        : step.status === 'current' ? 'bg-[#ffe9e7] border-brand-primary text-brand-primary pulse-animation-btn'
                        : 'bg-brand-low border-brand-outline-variant text-[#5c403e]/40'
                      }`}>
                        {step.status === 'completed' ? <Check size={16} /> : <span className="text-xs font-bold">{realIndex + 1}</span>}
                        {step.status === 'current' && <span className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-xs font-bold leading-tight ${step.status === 'current' ? 'text-brand-primary' : 'text-brand-on-surface'}`}>
                            {step.name}
                          </h4>
                          {step.time && <span className="text-[10px] text-brand-on-surface-variant font-medium whitespace-nowrap">{step.time}</span>}
                        </div>
                        <p className="text-[11px] text-brand-on-surface-variant mt-0.5 leading-tight">{step.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5bdba]/20 shadow-sm flex flex-col items-center text-center">
            <p className="text-[11px] text-brand-on-surface-variant mb-3 font-semibold">
              Bu problem sizin üçün də narahatlıq yaradır? "Dəstəklə" düyməsini sıxın.
            </p>
            <button
              onClick={support}
              className={`w-full py-4 rounded-full border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                report.hasUserReacted
                  ? 'bg-brand-primary border-brand-primary text-white pointer-events-none'
                  : 'border-brand-primary text-brand-primary hover:bg-brand-primary/5 active:scale-95'
              }`}
            >
              <ThumbsUp size={16} />
              <span>{report.hasUserReacted ? 'Təsdiq edildi (Siz də görürsünüz)' : 'Mən də görürəm'}</span>
              <span className="bg-brand-highest text-brand-primary rounded-full px-2.5 py-0.5 ml-1 text-[10px] font-extrabold">
                {report.reactionsCount}
              </span>
            </button>
          </div>

          {/* Comments */}
          <section className="space-y-3">
            <h3 className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider px-1">
              Sakinlərin bildirişləri ({report.comments.length})
            </h3>
            <div className="space-y-4">
              {report.comments.map(c => (
                <div key={c.id} className="thread-vertical-line relative flex gap-3.5 items-start">
                  <div className="z-10 w-11 h-11 rounded-full overflow-hidden border-2 border-brand-container ring-4 ring-brand-surface shrink-0">
                    <img className="w-full h-full object-cover" src={c.avatar} alt={c.author} />
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl shadow-sm flex-1 border border-[#e5bdba]/15 min-w-0">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-[#281716] truncate">{c.author}</span>
                      <span className="text-[10px] text-brand-on-surface-variant shrink-0 font-medium">{c.time}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed font-semibold text-brand-on-surface-variant/90">{c.text}</p>
                    {c.imageUrl && (
                      <img
                        src={c.imageUrl}
                        alt="Şərh şəkli"
                        className="mt-2 w-full max-h-44 object-cover rounded-xl border border-[#e5bdba]/30"
                      />
                    )}
                  </div>
                </div>
              ))}
              {report.comments.length === 0 && (
                <div className="bg-white/50 p-6 rounded-2xl border border-dashed border-[#e5bdba]/30 text-center">
                  <MessageSquare className="text-brand-on-surface-variant/40 mx-auto mb-2" size={24} />
                  <p className="text-xs text-brand-on-surface-variant font-medium italic">
                    Heç bir sakin rəyi hələ yoxdur. İlk şərhi siz yazın!
                  </p>
                </div>
              )}
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#e5bdba]/15 space-y-3">
              {commentImage && (
                <div className="relative w-full rounded-xl overflow-hidden border border-[#e5bdba]/30 bg-brand-low/40">
                  <img src={commentImage} alt="Əlavə edilən sübut" className="w-full max-h-40 object-cover" />
                  <button
                    onClick={() => setCommentImage(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center active:scale-95"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Əlavə məlumat və ya sübut yazın..."
                  className="flex-1 min-w-0 bg-transparent outline-none text-xs font-semibold px-2 placeholder:text-brand-on-surface-variant/50"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => attachCommentImage(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-[#fff0ef] text-brand-primary rounded-xl active:scale-95 transition-all cursor-pointer hover:bg-brand-primary/10 shrink-0"
                  aria-label="Şəkil əlavə et"
                >
                  <ImagePlus size={14} />
                </button>
                <button
                  onClick={addComment}
                  className="p-3 bg-brand-primary text-white rounded-xl active:scale-95 transition-all cursor-pointer hover:bg-brand-primary-container shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* ── Footer — in-flow ────────────────────────────────── */}
      <div className="shrink-0 p-4 bg-white/90 backdrop-blur-xl border-t border-[#e5bdba]/20 z-10 flex justify-center">
        <button
          onClick={() => navigate('feed')}
          className="w-full max-w-md h-12 border-2 border-brand-primary text-brand-primary font-bold bg-white rounded-full text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-brand-low/50"
        >
          <Compass size={16} /> Lentə geri dön
        </button>
      </div>
    </div>
  );
}
