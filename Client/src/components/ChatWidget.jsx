/**
 * ChatWidget — floating AI assistant chat.
 * A small button in the bottom-right that expands into a sleek chat panel.
 */
import { useState, useRef, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import { useUserStore } from '../store/userStore';
import { Terminal, X, ChevronRight, Activity, Trash2, Shield, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWidget() {
  const triggerRefetch = useUserStore(s => s.triggerRefetch);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMission, setPreviewMission] = useState(null);
  const bottomRef = useRef(null);

  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Fetch chat history only when user opens the chat (not on mount)
  useEffect(() => {
    if (!open || historyLoaded) return;
    const fetchHistory = async () => {
      try {
        const { data } = await axiosInstance.get('/assistant/history');
        if (data && data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([{ role: 'assistant', content: "Hey Hunter! 💀 I'm your Growth Assistant. Ask me anything about your stats, missions, streaks, or get suggestions for your next move." }]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setMessages([{ role: 'assistant', content: "Hey Hunter! 💀 I'm your Growth Assistant. Ask me anything about your stats, missions, streaks, or get suggestions for your next move." }]);
      } finally {
        setHistoryLoaded(true);
      }
    };
    fetchHistory();
  }, [open, historyLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = async () => {
    if (!window.confirm("Are you sure you want to clear your chat history?")) return;
    try {
      setLoading(true);
      await axiosInstance.delete('/assistant/history');
      setMessages([{ role: 'assistant', content: "Memory cleared. What's our next move, Hunter?" }]);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendCustom = async (textOverride) => {
    const text = typeof textOverride === 'string' ? textOverride.trim() : input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axiosInstance.post('/assistant/chat', { message: text });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, action: data.action }]);

      if (data.action?.type === 'mission_created' || data.action?.type === 'mission_proposal_canceled') {
        triggerRefetch();
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Connection error. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendCustom();

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
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[60] w-12 h-12 sm:w-14 sm:h-14 bg-[#050608] border border-[#a855f7]/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:bg-[#a855f7]/10 hover:scale-110 transition-all duration-300 flex items-center justify-center group overflow-hidden"
        title="SYSTEM ORACLE"
        style={{ clipPath: 'polygon(30% 0%, 100% 0, 100% 70%, 70% 100%, 0 100%, 0% 30%)' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#a855f7] to-transparent"></div>
        <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-[#a855f7] group-hover:animate-pulse relative z-10" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-[60] w-full sm:w-[380px] h-[100dvh] sm:h-[520px] flex flex-col bg-[#050608]/95 backdrop-blur-xl sm:border sm:border-white/5 shadow-[-10px_-10px_30px_rgba(0,0,0,0.8)] overflow-hidden font-['Rajdhani'] sm:[clip-path:polygon(0_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%)]">

      {/* Scanline Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-10 pointer-events-none z-0"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-[#a855f7]/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#121319] border border-[#a855f7]/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            <Terminal className="w-4 h-4 text-[#a855f7]" />
          </div>
          <div>
            <p className="text-[12px] font-black italic tracking-widest text-white font-['Exo_2'] drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">SYSTEM ORACLE</p>
            <p className="text-[9px] font-bold tracking-[0.3em] text-[#a855f7]/80 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#a855f7] rounded-full animate-ping shadow-[0_0_5px_#a855f7]"></span>
              NEURAL LINK ESTABLISHED
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 z-20 relative">
          <button
            onClick={clearChat}
            title="Clear Memory"
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#a855f7]/50 to-transparent"></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative z-10 scrollbar-none">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 text-[13px] font-medium tracking-wide flex flex-col gap-1 ${
              msg.role === 'user'
                ? 'bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-gray-200'
                : 'bg-[#121319] border border-white/5 text-gray-300'
            }`}
            style={msg.role === 'user' ? { clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' } : { clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
            >
              <div className="text-[9px] font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-1 opacity-50">
                {msg.role === 'user' ? <span className="text-[#3b82f6]">USER_QUERY</span> : <span className="text-[#a855f7]">SYS_RESPONSE</span>}
              </div>
              <div className="leading-relaxed prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 prose-sm text-[13px] prose-a:text-[#3b82f6] prose-strong:text-white">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#121319] border border-white/5 px-4 py-3" style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
              <div className="flex items-center gap-2 text-[#a855f7]/80">
                <Activity className="w-3 h-3 animate-spin" />
                <span className="text-[10px] font-bold tracking-[0.2em]">PROCESSING...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5 bg-[#050608] relative z-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="flex items-start bg-[#121319] border border-white/10 focus-within:border-[#a855f7]/50 transition-colors p-1" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
          <div className="py-2 pl-3 pr-2 text-[#a855f7] opacity-60">
            <ChevronRight className="w-4 h-4" />
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="AWAITING COMMAND PARAMETERS..."
            rows={1}
            className="flex-1 bg-transparent py-2 text-[13px] font-bold tracking-wide text-gray-200 placeholder-gray-600 resize-none outline-none max-h-24 scrollbar-none"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-10 h-10 shrink-0 bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#a855f7] hover:bg-[#a855f7]/40 hover:text-white disabled:opacity-30 disabled:hover:bg-[#a855f7]/20 disabled:hover:text-[#a855f7] transition-all flex items-center justify-center font-black"
          >
            {'/>'}
          </button>
        </div>
      </div>
    </div>
  );
}
