import {
  ArrowLeft,
  Check,
  Flame,
  ImagePlus,
  MapPin,
  MessageSquare,
  Send,
  Star,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { ReportComment } from '../types';
import { api, IssueDetail } from '../api';

export default function ReportDetailScreen() {
  const { state, dispatch, navigate, toast } = useApp();
  const { selectedReportId, reports, prevScreen, user, apiIssueIds, reportDetailView } = state;

  // Local tab state — initialised from store (set by caller)
  const [activeTab, setActiveTab] = useState<'thread' | 'comments'>(reportDetailView);

  // Full issue detail from backend (for thread + live status)
  const [issueDetail, setIssueDetail] = useState<IssueDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);

  useEffect(() => {
    setActiveTab(reportDetailView);
  }, [selectedReportId, reportDetailView]);

  useEffect(() => {
    if (!selectedReportId) return;
    const apiId = apiIssueIds[selectedReportId];
    if (!apiId) return;

    setThreadLoading(true);
    api.getIssue(apiId).then(issue => {
      setIssueDetail(issue);
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
    }).catch(() => {}).finally(() => setThreadLoading(false));
  }, [selectedReportId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [commentText, setCommentText] = useState('');
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const report = reports.find(r => r.id === selectedReportId);
  if (!report) return null;


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
    toast('Şərhiniz əlavə edildi! +2 Coin', 'success');
  }

  const statusColor =
    report.status === 'HƏLL EDİLDİ' ? 'bg-[#e8f5e9] text-[#2e7d32]'
    : report.status === 'İCRADADIR'  ? 'bg-[#fff0ef] text-brand-primary'
    : 'bg-brand-highest text-brand-on-surface-variant';

  const currentStep =
    report.steps.find(s => s.status === 'current') ||
    [...report.steps].reverse().find(s => s.status === 'completed') ||
    report.steps[0];

  const visibleSteps = showAllSteps ? report.steps : (currentStep ? [currentStep] : []);

  const threadReports = issueDetail?.reports ?? [];
  const location = issueDetail?.location_az || report.location;

  return (
    <div className="flex-grow flex flex-col min-h-0 bg-[#faf5f4]">

      {/* ── Header ── */}
      <header className="shrink-0 h-14 bg-white border-b border-[#e5bdba]/30 z-10 flex items-center justify-between px-4">
        <button
          onClick={() => navigate(prevScreen || 'feed')}
          className="p-2 -ml-1 text-[#1c0f0e] hover:bg-[#fff0ef] rounded-full transition-all active:scale-95"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${statusColor}`}>
            {report.status === 'HƏLL EDİLDİ' ? 'Həll edildi' : report.status === 'İCRADADIR' ? 'İcradadır' : 'Gözləyir'}
          </span>
          <span className="text-[11px] font-bold text-brand-primary bg-[#fff0ef] px-2.5 py-1 rounded-full truncate max-w-[110px]">
            {report.category}
          </span>
        </div>
      </header>

      {/* ── X-style tab bar ── */}
      <div className="shrink-0 bg-white border-b border-[#e5bdba]/30 flex">
        {(['thread', 'comments'] as const).map(tab => {
          const isActive = activeTab === tab;
          const label = tab === 'thread'
            ? `Müraciətlər${threadReports.length > 0 ? ` (${threadReports.length})` : ''}`
            : `Şərhlər${report.comments.length > 0 ? ` (${report.comments.length})` : ''}`;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[13px] font-bold relative transition-colors cursor-pointer ${
                isActive ? 'text-[#1c0f0e]' : 'text-[#a08280] hover:text-[#6b4947]'
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-12 bg-brand-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ════════════════ THREAD TAB ════════════════ */}
        {activeTab === 'thread' && (
          <div className="max-w-xl mx-auto w-full">

            {/* Hero — root report */}
            <div className="bg-white border-b border-[#e5bdba]/20">
              {/* Image */}
              {report.imageUrl && (
                <div className="w-full bg-[#f5e8e7] max-h-64 overflow-hidden">
                  <img className="w-full h-full object-cover" src={report.imageUrl} alt={report.title} />
                </div>
              )}
              <div className="px-4 pt-3 pb-4">
                {/* Reporter */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-[#e5bdba]/40 bg-[#f5e8e7] shrink-0">
                    <img className="w-full h-full object-cover" src={report.reporterAvatar} alt={report.reporterName}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1c0f0e] leading-tight truncate">{report.reporterName}</p>
                    <p className="text-[11px] text-[#a08280]">Əsas müraciət · {report.time}</p>
                  </div>
                  <span className="ml-auto shrink-0">
                    <Star size={14} className="text-brand-primary fill-brand-primary/30" />
                  </span>
                </div>

                {/* Title — bold headline */}
                <h2 className="text-[16px] font-bold text-[#1c0f0e] leading-snug mb-2">{report.title}</h2>

                {/* Description — secondary context */}
                {report.descr && (
                  <div className="border-l-2 border-[#e5bdba] pl-3 mb-3">
                    <p className="text-[13px] text-[#8a6260] leading-relaxed italic">{report.descr}</p>
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center gap-1.5 mb-4">
                  <MapPin size={13} className="text-brand-primary/70 shrink-0" />
                  <span className="text-[12px] text-[#8a6260]">{location}</span>
                </div>

              </div>
            </div>

            {/* Status stepper */}
            <div className="bg-white border-b border-[#e5bdba]/20 px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[12px] font-bold text-[#1c0f0e] flex items-center gap-1.5">
                  <Flame size={14} className="text-brand-primary" /> Status
                </h3>
                <button
                  onClick={() => setShowAllSteps(v => !v)}
                  className="text-[10px] font-bold text-brand-primary active:scale-95"
                >
                  {showAllSteps ? 'Gizlət' : 'Hamısı'}
                </button>
              </div>
              <div className="relative pl-1 space-y-3">
                {showAllSteps && (
                  <div className="absolute left-[15px] top-1 bottom-1 w-[2px] bg-[#e5bdba]/40 z-0" />
                )}
                {visibleSteps.map((step, i) => {
                  const idx = report.steps.findIndex(s => s.name === step.name);
                  return (
                    <div key={i} className={`flex items-start gap-3 relative z-10 ${step.status === 'pending' ? 'opacity-35' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                        step.status === 'completed' ? 'bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32]'
                        : step.status === 'current'  ? 'bg-[#fff0ef] border-brand-primary text-brand-primary'
                        : 'bg-[#f5f5f5] border-[#ddd] text-[#aaa]'
                      }`}>
                        {step.status === 'completed' ? <Check size={14} /> : <span className="text-[11px] font-bold">{idx + 1}</span>}
                        {step.status === 'current' && <span className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping" />}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className={`text-[12px] font-bold leading-tight ${step.status === 'current' ? 'text-brand-primary' : 'text-[#1c0f0e]'}`}>
                          {step.name}
                        </p>
                        <p className="text-[11px] text-[#a08280] mt-0.5">{step.subtitle}</p>
                      </div>
                      {step.time && (
                        <span className="text-[10px] text-[#c4a09e] shrink-0 pt-0.5">{step.time}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cluster thread — additional reports on same issue */}
            {threadLoading && (
              <div className="px-4 py-8 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                <span className="text-[11px] text-[#a08280]">Müraciətlər yüklənir...</span>
              </div>
            )}
            {!threadLoading && threadReports.length > 1 && (
              <div className="bg-white border-b border-[#e5bdba]/20">
                <div className="px-4 py-3 border-b border-[#f0dbd9]/50">
                  <p className="text-[11px] font-extrabold text-[#a08280] uppercase tracking-widest">
                    {threadReports.length} Vətəndaş eyni yerdə bildirdi
                  </p>
                </div>
                {threadReports.filter(r => !r.is_root).map((r, i) => (
                  <div key={r.id} className={`flex gap-3 px-4 py-3.5 ${i < threadReports.filter(x => !x.is_root).length - 1 ? 'border-b border-[#f0dbd9]/40' : ''}`}>
                    {/* Avatar */}
                    <div className="shrink-0 w-9 h-9 rounded-full bg-[#f5e8e7] border border-[#e5bdba]/30 overflow-hidden mt-0.5 flex items-center justify-center text-brand-primary font-bold text-sm">
                      {r.reporter_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[13px] font-bold text-[#1c0f0e]">{r.reporter_name}</span>
                        <span className="text-[#c4a09e] text-[11px]">·</span>
                        <span className="text-[11px] text-[#a08280]">
                          {new Date(r.created_at).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {r.user_text && (
                        <p className="text-[13px] text-[#3d2120] leading-snug mb-2">{r.user_text}</p>
                      )}
                      {r.image_url && (
                        <div className="rounded-xl overflow-hidden border border-[#e5bdba]/25 bg-[#f5e8e7] max-h-40">
                          <img src={r.image_url} alt="Sübut" className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="h-8" />
          </div>
        )}

        {/* ════════════════ COMMENTS TAB ════════════════ */}
        {activeTab === 'comments' && (
          <div className="max-w-xl mx-auto w-full">
            {report.comments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                <div className="w-14 h-14 rounded-full bg-[#fff0ef] flex items-center justify-center mb-3">
                  <MessageSquare size={24} className="text-brand-primary/40" />
                </div>
                <p className="text-[13px] font-bold text-[#1c0f0e]">Hələ heç bir şərh yoxdur</p>
                <p className="text-[12px] text-[#a08280] mt-1">İlk şərhi siz yazın!</p>
              </div>
            )}

            {report.comments.map((c, i) => (
              <div
                key={c.id}
                className={`flex gap-3 px-4 py-3.5 bg-white ${i < report.comments.length - 1 ? 'border-b border-[#f0dbd9]/50' : ''}`}
              >
                <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden border border-[#e5bdba]/30 bg-[#f5e8e7]">
                  <img className="w-full h-full object-cover" src={c.avatar} alt={c.author}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[13px] font-bold text-[#1c0f0e] truncate">{c.author}</span>
                    <span className="text-[#c4a09e] text-[11px]">·</span>
                    <span className="text-[11px] text-[#a08280] shrink-0">{c.time}</span>
                  </div>
                  <p className="text-[13px] text-[#3d2120] leading-relaxed">{c.text}</p>
                  {c.imageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-[#e5bdba]/25 max-h-44">
                      <img src={c.imageUrl} alt="Şərh şəkli" className="w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="h-24" />
          </div>
        )}
      </div>

      {/* ── Comment input footer (only on comments tab) ── */}
      {activeTab === 'comments' && (
        <div className="shrink-0 bg-white border-t border-[#e5bdba]/25 px-4 py-3 z-10">
          {commentImage && (
            <div className="relative mb-2 rounded-xl overflow-hidden border border-[#e5bdba]/30 bg-[#f5e8e7]">
              <img src={commentImage} alt="Sübut" className="w-full max-h-32 object-cover" />
              <button
                onClick={() => setCommentImage(null)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e5bdba]/30 shrink-0">
              <img className="w-full h-full object-cover" src={user.avatar} alt={user.name} />
            </div>
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addComment()}
              placeholder="Şərh yazın..."
              className="flex-1 min-w-0 bg-[#f5f0ef] rounded-full px-4 py-2 text-[13px] outline-none placeholder:text-[#c4a09e] text-[#1c0f0e]"
            />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setCommentImage(URL.createObjectURL(f)); }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-brand-primary hover:bg-[#fff0ef] rounded-full transition-colors active:scale-95"
            >
              <ImagePlus size={18} />
            </button>
            <button
              onClick={addComment}
              className="p-2 bg-brand-primary text-white rounded-full transition-colors active:scale-95 hover:bg-brand-primary/90"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
