import { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, Sparkles, RotateCcw, ChevronDown, X,
} from 'lucide-react';
import { api } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const WELCOME = `👋 Hi! I'm **FutureIntern AI** — your personal career assistant.

I can help you with:
• Finding & applying for internships
• Resume & CV tips
• Interview preparation
• Navigating the platform

What's on your mind?`;

const SUGGESTIONS = [
  "How do I apply for internships?",
  "Give me CV tips",
  "How does AI matching work?",
  "Interview preparation tips",
];

// Simple markdown-like bold renderer
function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Render line breaks
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: WELCOME, sender: 'bot', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    setShowSuggestions(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Build history (exclude welcome message)
    const history = messages
      .filter(m => m.id !== '0')
      .map(m => ({ sender: m.sender, text: m.text }));

    try {
      const res = await api.chatbot.sendMessage(text.trim(), history);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: res.response || "I'm not sure about that. Try rephrasing!",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: err?.message?.includes('402')
            ? "⚠️ You've run out of chatbot points. Visit the Points Store to get more!"
            : "Sorry, I couldn't connect right now. Please try again in a moment.",
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([{ id: '0', text: WELCOME, sender: 'bot', timestamp: new Date() }]);
    setShowSuggestions(true);
  };

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-50 shadow-2xl transition-all duration-300 hover:scale-110 group"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '2px solid #f43f5e' }}
          aria-label="Open AI chat"
        >
          <Bot className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-40" />
          {/* AI badge */}
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black px-1 rounded-full border border-white">AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: 'min(420px, calc(100vw - 2rem))',
            height: 'min(620px, calc(100vh - 6rem))',
            background: 'white',
            border: '3px solid #0f172a',
            boxShadow: '8px 8px 0px 0px #0f172a',
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', borderBottom: '2px solid #f43f5e' }}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center">
                <Bot className="w-5 h-5 text-rose-400" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm tracking-tight leading-none">FutureIntern AI</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Powered by Hugging Face
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear chat"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: '#f8fafc' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 mt-1 border-2 border-rose-500/30">
                    <Bot className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-br-sm shadow-md'
                      : 'bg-white text-slate-800 rounded-bl-sm shadow-sm border border-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{renderText(msg.text)}</p>
                  <span className={`text-[10px] mt-1.5 block font-bold ${msg.sender === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 border-2 border-rose-500/30">
                  <Bot className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-200">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 150, 300].map(delay => (
                      <span
                        key={delay}
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && !isTyping && messages[messages.length - 1]?.sender === 'bot' && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quick questions</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-2 bg-white text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl border-2 border-slate-200 hover:border-slate-900 transition-all text-xs font-bold text-left shadow-sm hover:shadow-md"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input ── */}
          <div className="flex-shrink-0 px-3 py-3" style={{ background: 'white', borderTop: '2px solid #e2e8f0' }}>
            <div
              className="flex items-end gap-2 rounded-xl border-2 border-slate-200 focus-within:border-slate-900 transition-colors px-3 py-2"
              style={{ background: '#f8fafc' }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  // auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                }}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent resize-none text-sm text-slate-900 placeholder-slate-400 focus:outline-none max-h-24 font-medium"
                style={{ minHeight: '24px', lineHeight: '1.5' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0 transition-all hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">
              Shift+Enter for new line · Enter to send
            </p>
          </div>
        </div>
      )}
    </>
  );
}
