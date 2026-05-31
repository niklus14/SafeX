import { ArrowRight, Calendar, CheckCircle2, ClipboardList } from 'lucide-react';
import { useApp } from '../store';

export default function ReportSuccessScreen() {
  const { state, navigate } = useApp();
  const { draft, justCreatedId } = state;

  function viewReport() {
    if (justCreatedId) {
      navigate('report-detail');
    } else {
      navigate('feed');
    }
  }

  return (
    <div className="flex-grow flex flex-col bg-[#fff8f7]">
      <main className="flex-grow flex flex-col items-center justify-center px-6 pt-12 max-w-md mx-auto w-full">
        {/* Checkmark */}
        <div className="w-20 h-20 bg-[#e8f5e9] rounded-full flex items-center justify-center mb-6 shadow-sm checkmark-scale">
          <CheckCircle2 className="text-[#2e7d32]" size={48} />
        </div>

        <h1 className="font-display text-2xl font-extrabold text-[#281716] text-center mb-2 leading-none">
          Müraciətiniz qəbul edildi!
        </h1>
        <p className="text-sm text-brand-on-surface-variant text-center max-w-xs leading-relaxed mb-6">
          Bakı şəhərinin abadlaşdırılmasına verdiyiniz töhfə üçün təşəkkür edirik.
        </p>

        {/* Summary card */}
        <div className="w-full bg-white rounded-3xl p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#e5bdba]/20 mb-4">
          <h2 className="text-sm font-bold text-brand-primary flex items-center gap-2 mb-4">
            <ClipboardList size={16} /> Müraciət xülasəsi
          </h2>
          <div className="space-y-4 text-xs font-semibold">
            <div className="flex justify-between items-center pb-2 border-b border-[#fadbd9]/30">
              <span className="text-brand-on-surface-variant">Kateqoriya</span>
              <span className="text-brand-on-surface text-sm font-bold">{draft.type}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#fadbd9]/30">
              <span className="text-brand-on-surface-variant">Ciddilik statusu</span>
              <span className="bg-[#ffe2df] text-brand-primary px-3 py-1 rounded-full font-bold">Orta</span>
            </div>
            <div className="flex justify-between items-start pb-2">
              <span className="text-brand-on-surface-variant mr-4">Aidiyyatı qurum</span>
              <span className="text-brand-on-surface text-right font-bold flex-1">
                {draft.type.includes('Yol') ? 'Bakı Şəhər İcra Hakimiyyəti' : 'Abadlıq şöbəsi'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-brand-outline-variant/30">
              <span className="text-brand-on-surface-variant">Proqnoz həll tarixi</span>
              <div className="flex items-center gap-1 text-brand-primary font-bold">
                <Calendar size={14} />
                <span>5 gün ərzində</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      <footer className="p-6 bg-[#fff8f7] border-t border-[#e5bdba]/15 space-y-3 shrink-0 max-w-md mx-auto w-full">
        <button
          onClick={viewReport}
          className="w-full h-14 bg-brand-primary text-white rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm tracking-wide cursor-pointer hover:bg-brand-primary-container shadow-md"
        >
          Müraciətə bax <ArrowRight size={16} />
        </button>
        <button
          onClick={() => navigate('feed')}
          className="w-full h-14 border-2 border-brand-outline-variant text-[#5c403e] bg-white rounded-full font-bold flex items-center justify-center active:scale-95 transition-all text-sm cursor-pointer hover:bg-brand-low/40"
        >
          Bağla
        </button>
      </footer>
    </div>
  );
}
