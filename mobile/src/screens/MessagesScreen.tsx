import { ArrowLeft, MessageCircle, Droplet, Zap, Building2 } from 'lucide-react';
import { useApp } from '../store';

type ThreadItem = {
  id: string;
  org: string;
  lastMessage: string;
  time: string;
  unread?: boolean;
  icon: 'water' | 'light' | 'rih';
};

const THREADS: ThreadItem[] = [
  {
    id: 'azarsu',
    org: 'Azərsu əməkdaşı',
    lastMessage: 'Zəhmət olmasa problemin yaxın plandan şəklini göndərin.',
    time: '5 dəq əvvəl',
    unread: true,
    icon: 'water',
  },
  {
    id: 'azerisiq',
    org: 'Azərişıq əməkdaşı',
    lastMessage: 'İşıqlandırma müraciətiniz üzrə əlavə konum lazımdır.',
    time: '18 dəq əvvəl',
    unread: true,
    icon: 'light',
  },
  {
    id: 'rih',
    org: 'Nərimanov RİH operatoru',
    lastMessage: 'Müraciətiniz aidiyyəti quruma yönləndirildi.',
    time: 'Dünən',
    icon: 'rih',
  },
];

function ThreadIcon({ type }: { type: ThreadItem['icon'] }) {
  const common = 'w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0';
  if (type === 'water') return <div className={common}><Droplet size={22} /></div>;
  if (type === 'light') return <div className={common}><Zap size={22} /></div>;
  return <div className={common}><Building2 size={22} /></div>;
}

export default function MessagesScreen() {
  const { navigate, dispatch } = useApp();

  const openThread = (threadId: string) => {
    dispatch({ type: 'SET_MESSAGE_THREAD', thread: threadId });
    navigate('message-thread');
  };

  return (
    <div className="absolute inset-0 bg-brand-surface flex flex-col">
      <header className="shrink-0 h-16 bg-white/90 backdrop-blur-md border-b border-[#e5bdba]/30 shadow-sm z-10 flex items-center gap-3 px-5">
        <button
          onClick={() => navigate('feed')}
          className="w-10 h-10 rounded-full bg-brand-low text-brand-primary flex items-center justify-center active:scale-95 transition-all"
          aria-label="Geri"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-lg font-extrabold text-[#281716]">Mesaj qutusu</h1>
          <p className="text-[11px] font-semibold text-brand-on-surface-variant">Qurumlarla yazışmalar</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-5 pb-8 space-y-4">
        <div className="rounded-3xl bg-gradient-to-br from-brand-primary to-brand-primary-container text-white p-5 shadow-[0_12px_28px_rgba(135,0,18,0.18)]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
              <MessageCircle size={22} />
            </div>
            <div>
              <p className="text-sm font-extrabold">2 yeni mesaj</p>
              <p className="text-[11px] text-white/75 mt-0.5">Qurum əməkdaşları müraciətləriniz üzrə əlavə məlumat istəyir.</p>
            </div>
          </div>
        </div>

        <section className="space-y-3">
          {THREADS.map(thread => (
            <button
              key={thread.id}
              onClick={() => openThread(thread.id)}
              className="w-full text-left bg-white rounded-3xl p-4 border border-[#e5bdba]/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-all"
            >
              <div className="flex gap-3">
                <ThreadIcon type={thread.icon} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-extrabold text-sm text-[#281716] truncate">{thread.org}</h2>
                    <span className="text-[10px] font-semibold text-brand-on-surface-variant/70 shrink-0">{thread.time}</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-brand-on-surface-variant mt-1 line-clamp-2">
                    {thread.lastMessage}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {thread.unread && (
                      <span className="px-2 py-1 rounded-full bg-brand-primary text-white text-[9px] font-extrabold uppercase tracking-wide">Yeni</span>
                    )}
                    <span className="text-[10px] font-bold text-brand-on-surface-variant/60">Müraciət üzrə əlaqə</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
