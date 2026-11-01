import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Sparkles, Bot, User, 
  ChevronDown, Minimize2, Loader2, Copy, Check, Lightbulb 
} from 'lucide-react';
import axios from 'axios';
import { useResume } from '../state/ResumeContext';

export default function ChatbotWidget() {
  const { resume, targetRole } = useResume();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your **ProResume Career & Recruiter Assistant**. How can I help you today? You can ask about resume keywords, interview question prep, career transitions, or recruiter requirements."
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "What technical questions should I expect for this role?",
    "How can I explain a gap in my career history?",
    "Give me 3 STAR framework examples for system design.",
    "Draft a professional cover letter for this resume."
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputVal.trim();
    if (!textToSend || loading) return;

    const userMsg = { role: 'user', content: textToSend };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!customText) setInputVal('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat/message', {
        messages: newHistory,
        resume: resume,
        target_role: targetRole || resume.target_role
      });

      const replyContent = res.data?.reply || "I'm here to assist with your career and interview prep. What specific topic would you like to explore?";
      setMessages([...newHistory, { role: 'assistant', content: replyContent }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: "I'm momentarily recalibrating my connection. Try asking about specific technical keywords or interview tips!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Trigger Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2.5 px-4 py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-full shadow-2xl shadow-slate-900/30 border border-slate-700/50 hover:scale-105 transition-all duration-200 group"
        >
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-wide">Career Coach</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Career & Interview Coach</h3>
                <p className="text-[11px] text-slate-400">Context-aware AI Advisor</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] ${
                      isUser ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white shadow'
                    }`}>
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div className={`p-3 rounded-2xl relative group ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm leading-relaxed whitespace-pre-wrap'
                    }`}>
                      <div>{msg.content}</div>

                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(msg.content, idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded"
                          title="Copy message"
                        >
                          {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 text-xs text-slate-500 shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Thinking & formulating guidance...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.slice(0, 2).map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition-colors truncate max-w-[200px]"
              >
                💡 {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything about resume, interview, or roles..."
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputVal.trim()}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl disabled:opacity-50 transition-all shadow"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
