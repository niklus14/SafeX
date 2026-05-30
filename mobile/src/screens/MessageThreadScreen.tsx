import { ArrowLeft, Phone, Send, Image, MapPinIcon } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../store';

type ThreadData = {
  org: string;
  subtitle: string;
  hotline: string;
  number: string | null;
  messages: { id: number; text: string; time: string; isOwn: boolean }[];
};

const THREAD_DATA: Record<string, ThreadData> = {
  azarsu: {
    org: 'Azərsu əməkdaşı',
    subtitle: 'Müraciət üzrə əlaqə',
    hotline: '955',
    number: '955',
    messages: [
      { id: 1, text: 'Salam, müraciətiniz üzrə əlavə məlumata ehtiyac var.', time: '14:30', isOwn: false },
      { id: 2, text: 'Zəhmət olmasa yaxın plandan əlavə şəkil və dəqiq konum göndərin.', time: '14:32', isOwn: false },
      { id: 3, text: 'Əlavə məlumatı göndərirəm.', time: '14:35', isOwn: true },
    ],
  },
  azerisiq: {
    org: 'Azərişıq əməkdaşı',
    subtitle: 'Müraciət üzrə əlaqə',
    hotline: '199',
    number: '199',
    messages: [
      { id: 1, text: 'Salam, işıqlandırma müraciətiniz qəbul olunub.', time: '15:05', isOwn: false },
      { id: 2, text: 'Zəhmət olmasa dəqiq konumu göndərin ki, briqada əraziyə yönləndirilsin.', time: '15:07', isOwn: false },
    ],
  },
  rih: {
    org: 'Nərimanov RİH operatoru',
    subtitle: 'Müraciət üzrə əlaqə',
    hotline: 'Qaynar xətt',
    number: null,
    messages: [
      { id: 1, text: 'Müraciətiniz operator tərəfindən yoxlanıldı.', time: 'Dünən', isOwn: false },
      { id: 2, text: 'Məlumat aidiyyəti quruma yönləndirildi.', time: 'Dünən', isOwn: false },
    ],
  },
};

export default function MessageThreadScreen() {
  const { state, navigate } = useApp();
  const thread = THREAD_DATA[state.messageThread || 'azarsu'] || THREAD_DATA.azarsu;
  const [messages, setMessages] = useState(thread.messages);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        text: input.trim(),
        time: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      },
    ]);
    setInput('');
  };

  const callOrg = () => {
    if (thread.number) window.location.href = `tel:${thread.number}`;
  };

  return (
    <div className="absolute inset-0 bg-brand-surface flex flex-col">
      <header className="shrink-0 bg-white/90 backdrop-blur-md border-b border-[#e5bdba]/30 shadow-sm z-10 px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('messages')}
              className="w-10 h-10 rounded-full bg-brand-low text-brand-primary flex items-center justify-center active:scale-95 transition-all shrink-0"
              aria-label="Geri"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-base font-extrabold text-[#281716] truncate">{thread.org}</h1>
              <p className="text-[10px] text-brand-on-surface-variant font-semibold">{thread.subtitle}</p>
            </div>
          </div>
          <button
            onClick={callOrg}
            disabled={!thread.number}
            className={`px-3 py-2 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all ${
              thread.number ? 'bg-brand-primary text-white' : 'bg-brand-low text-brand-on-surface-variant/50'
            }`}
          >
            <Phone size={15} />
            {thread.number ? 'Zəng et' : 'Nömrə əlavə olunacaq'}
          </button>
        </div>
        <p className="ml-[52px] mt-1 text-[10px] font-semibold text-brand-primary">{thread.hotline}</p>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[82%] px-4 py-3 rounded-3xl shadow-sm ${
                msg.isOwn
                  ? 'bg-brand-primary text-white rounded-br-md'
                  : 'bg-white border border-[#e5bdba]/20 text-brand-on-surface rounded-bl-md'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.isOwn ? 'text-white/70' : 'text-brand-on-surface-variant/60'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </main>

      <footer className="shrink-0 bg-white border-t border-[#e5bdba]/30 px-4 pt-3 pb-5 space-y-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Mesaj yazın..."
            className="flex-1 min-w-0 px-4 py-3 rounded-full border border-[#e5bdba]/40 bg-white text-sm text-brand-on-surface placeholder:text-brand-on-surface-variant/45 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
          <button
            onClick={sendMessage}
            className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center active:scale-95 transition-all shrink-0"
          >
            <Send size={19} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 rounded-full border border-[#e5bdba]/40 text-[11px] font-extrabold text-brand-on-surface-variant flex items-center justify-center gap-1.5 active:scale-95 transition-all">
            <Image size={14} /> Şəkil
          </button>
          <button className="px-3 py-2 rounded-full border border-[#e5bdba]/40 text-[11px] font-extrabold text-brand-on-surface-variant flex items-center justify-center gap-1.5 active:scale-95 transition-all">
            <MapPinIcon size={14} /> Konum
          </button>
        </div>
      </footer>
    </div>
  );
}
