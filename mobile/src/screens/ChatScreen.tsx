import { X, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../store';

const ORG_HOTLINES: Record<string, { hotline: string; number: string | null }> = {
  'Nərimanov RİH': { hotline: 'Qaynar xətt', number: null },
  'Azərsu': { hotline: '955', number: '955' },
  'Azərişıq': { hotline: '199', number: '199' },
  'Azəriqaz': { hotline: '104', number: '104' },
  'Abadlıq xidməti': { hotline: 'Qaynar xətt', number: null },
};

const MOCK_MESSAGES = [
  {
    id: 1,
    author: 'Support Team',
    text: 'Salam! Xoş gördük. Sizə necə kömək edə bilərik?',
    time: '10:00',
    isOwn: false,
  },
  {
    id: 2,
    author: 'You',
    text: 'Mən bir problem bildirmək istəyirəm.',
    time: '10:05',
    isOwn: true,
  },
];

export default function ChatScreen() {
  const { navigate, state } = useApp();
  const org = state.selectedOrganization;
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          author: 'You',
          text: input,
          time: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
          isOwn: true,
        },
      ]);
      setInput('');
    }
  };

  const hotlineInfo = org ? ORG_HOTLINES[org] : null;

  const handleCall = () => {
    if (hotlineInfo?.number) {
      window.location.href = `tel:${hotlineInfo.number}`;
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-brand-surface flex flex-col">
      {/* Header */}
      <div className="shrink-0 bg-white/90 backdrop-blur-md border-b border-[#e5bdba]/30 shadow-sm z-10 flex items-center justify-between px-6 h-16">
        <div>
          <h1 className="font-bold text-[#281716]">{org}</h1>
          <p className="text-[10px] text-brand-on-surface-variant font-medium">{hotlineInfo?.hotline}</p>
        </div>
        <div className="flex items-center gap-2">
          {hotlineInfo?.number && (
            <button
              onClick={handleCall}
              className="p-2 rounded-full bg-brand-primary text-white hover:bg-brand-primary-container transition-all active:scale-95"
            >
              <Phone size={20} />
            </button>
          )}
          <button
            onClick={() => navigate('feed')}
            className="p-2 rounded-full hover:bg-[#f0f0f0] transition-all active:scale-95"
          >
            <X size={20} className="text-brand-on-surface-variant" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-3 rounded-2xl ${
                msg.isOwn
                  ? 'bg-brand-primary text-white rounded-br-none'
                  : 'bg-white border border-[#e5bdba]/20 text-brand-on-surface rounded-bl-none'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.isOwn ? 'text-white/70' : 'text-brand-on-surface-variant/60'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-[#e5bdba]/30 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Mesajınızı yazın..."
            className="flex-1 px-4 py-3 rounded-full border border-[#e5bdba]/30 bg-white text-brand-on-surface placeholder:text-brand-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
          <button
            onClick={handleSend}
            className="p-3 rounded-full bg-brand-primary text-white hover:bg-brand-primary-container transition-all active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
