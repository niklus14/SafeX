import { ArrowLeft, Camera, Check, MapPin, Send } from 'lucide-react';
import { useApp } from '../store';

const CATEGORIES = ['Yol Təmiri', 'Fontan Təmiri', 'Sanitariya və Təmizlik', 'Qəzalı İşıq'];

export default function CreateDetailsScreen() {
  const { state, dispatch, navigate } = useApp();
  const { draft } = state;

  function setType(t: string) {
    dispatch({ type: 'SET_DRAFT', patch: { type: t } });
  }

  function setDesc(d: string) {
    dispatch({ type: 'SET_DRAFT', patch: { description: d } });
  }

  function toggleLocationMode() {
    const custom = !draft.isLocationCustom;
    dispatch({
      type: 'SET_DRAFT',
      patch: {
        isLocationCustom: custom,
        location: custom ? 'İstiqlaliyyət küçəsi, 24' : 'Nərimanov r., Təbriz küç.',
      },
    });
  }

  function submit() {
    navigate('ai-analysis');
  }

  return (
    <div className="flex-1 flex flex-col bg-brand-surface pt-4">
      <header className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-[#e5bdba]/10">
        <div className="flex items-center">
          <button
            onClick={() => navigate('camera')}
            className="p-2 -ml-2 text-brand-primary hover:bg-[#ffe9e7] rounded-full transition-colors active:scale-95 duration-200"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="ml-4 font-display text-xl font-extrabold text-brand-primary tracking-tight">Detallar</h1>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-[#ffe9e7] text-brand-primary rounded-full">Yeni Müraciət</span>
      </header>

      <main className="flex-grow overflow-y-auto px-6 py-6 space-y-6 max-w-lg mx-auto w-full pb-24">
        {/* Photo */}
        <div>
          <span className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block mb-2">Çəkilmiş şəkil</span>
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md group">
            <img className="w-full h-full object-cover" src={draft.photo} alt="Preview" />
            <button
              onClick={() => navigate('camera')}
              className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold hover:bg-black/75 transition-colors"
            >
              <Camera size={14} /> Yenidən çək
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block">
            Müəyyən edilmiş mövzu növü
          </label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setType(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  draft.type === cat
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-white text-brand-on-surface-variant border border-brand-outline-variant/50 hover:bg-[#ffe9e7]/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="desc" className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block">
            Problemi qısaca təsvir edin…
          </label>
          <textarea
            id="desc"
            className="w-full min-h-[100px] bg-brand-lowest border border-brand-outline-variant rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all placeholder:text-brand-on-surface-variant/40 leading-relaxed shadow-inner"
            placeholder="Məsələn: Fontanın su axını tənzimlənməlidir, asfalt çökmüşdür..."
            rows={3}
            value={draft.description}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block">Ünvan</span>
            <button
              onClick={toggleLocationMode}
              className="text-xs font-bold text-brand-primary hover:underline"
            >
              {draft.isLocationCustom ? 'Avtomatikə keç' : 'Yeri dəqiqləşdir'}
            </button>
          </div>

          {draft.isLocationCustom ? (
            <input
              type="text"
              value={draft.location}
              onChange={e => dispatch({ type: 'SET_DRAFT', patch: { location: e.target.value } })}
              className="w-full h-12 bg-white border border-brand-outline-variant rounded-xl px-4 text-xs font-semibold focus:ring-2 focus:ring-brand-primary outline-none"
              placeholder="Ünvanı daxil edin"
            />
          ) : (
            <div className="bg-brand-low p-4 rounded-xl border border-brand-outline-variant/30 flex items-start gap-4 shadow-sm">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                <MapPin size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-brand-on-surface-variant uppercase tracking-wider">Cari məkan</p>
                <p className="font-bold text-sm text-brand-on-surface leading-tight mt-1 truncate">{draft.location}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-brand-primary font-semibold mt-1">
                  <Check size={12} /> GPS vasitəsilə təyin olundu
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            onClick={submit}
            className="w-full h-14 bg-brand-primary text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-brand-primary-container active:scale-95 transition-all text-sm tracking-wide cursor-pointer"
          >
            <span>Göndər</span>
            <Send size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}
