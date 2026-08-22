"use client";

import { useState, useRef, useEffect } from "react";
import { useTrip } from "@/hooks/useTrip";
import { Send, Sparkles, User, Loader2 } from "lucide-react";

export default function AIAssistant() {
  const { chatHistory, sendChatMessage, isChatLoading } = useTrip();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isChatLoading]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isChatLoading) return;
    
    sendChatMessage(input);
    setInput("");
  };

  const quickActions = [
    "🌧️ Raining tomorrow",
    "💰 Make it cheaper",
    "🍽️ Need vegan options",
    "⏰ Make pace relaxed"
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-200 shrink-0">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> AI Travel Assistant
        </h2>
        <p className="text-xs text-slate-500 mt-1">Ask me to modify your trip or find places.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center mt-10">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">How can I help?</h3>
            <p className="text-xs text-slate-500 max-w-[200px] mx-auto mb-6">
              I can adjust your itinerary, find restaurants, or answer travel questions.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => setInput(action.replace(/[^a-zA-Z\s]/g, '').trim())}
                  className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-600 hover:border-primary hover:text-primary transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-primary text-white'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div className={`p-3 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-sm' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isChatLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!input.trim() || isChatLoading}
            className="absolute right-1.5 top-1.5 bottom-1.5 w-9 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
