/**
 * ChatWidget — floating AI assistant chat.
 * A small button in the bottom-right that expands into a sleek chat panel.
 */
import { useState, useRef, useEffect } from 'react';
import axiosInstance from '../utils/axios';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey Hunter! 💀 I'm your Growth Assistant. Ask me anything about your stats, missions, streaks, or get suggestions for your next move." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axiosInstance.post('/assistant/chat', { message: text });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Connection error. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-400/50 hover:scale-110 transition-all duration-300 flex items-center justify-center text-2xl"
        title="Growth Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] flex flex-col rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#0f1117] to-[#1a1025] shadow-2xl shadow-purple-900/40 backdrop-blur-xl overflow-hidden"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-pink-900/20">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm">🤖</div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white/90 tracking-wide">Growth Assistant</p>
          <p className="text-[10px] text-purple-300/60">AI-powered • Knows your full profile</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition text-sm"
        >✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-purple-500/20">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-purple-600/30 text-white/90 rounded-br-sm'
                : 'bg-white/5 text-white/80 border border-white/5 rounded-bl-sm'
            }`}>
              {msg.content.split('\n').map((line, j) => (
                <span key={j}>
                  {line}
                  {j < msg.content.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1">
        <div className="flex gap-2 items-end bg-white/5 rounded-xl border border-white/10 px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your stats, missions..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/30 resize-none outline-none max-h-20"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 disabled:opacity-40 flex items-center justify-center text-white text-sm hover:from-purple-500 hover:to-pink-400 transition shrink-0"
          >↑</button>
        </div>
      </div>
    </div>
  );
}
