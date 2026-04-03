import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Navigation, Hotel, Utensils, Info, Loader2, Sparkles, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { ChatMessage, UserSettings } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

const QUICK_ACTIONS = [
  { label: "Plan a 3-day Ella trip", icon: Compass },
  { label: "Best beaches in Mirissa", icon: Navigation },
  { label: "Route: Colombo to Kandy", icon: MapPin },
  { label: "Budget for 1 week", icon: Sparkles },
];

export default function ChatInterface({ messages, onSendMessage, isLoading, settings, onUpdateSettings }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 relative overflow-hidden transition-colors duration-500">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="h-16 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between px-8 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">visitaSL AI Assistant</h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Clear Chat</button>
          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
          <button className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors">Share Plan</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20"
            >
              <Sparkles className="w-10 h-10 text-emerald-500" />
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Ayubowan!</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg">I'm your AI guide to the wonders of Sri Lanka. How can I help you today?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              {QUICK_ACTIONS.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => onSendMessage(action.label)}
                  className="p-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30 rounded-2xl text-left transition-all group"
                >
                  <action.icon className="w-5 h-5 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{action.label}</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
              "flex gap-4 max-w-4xl mx-auto",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-emerald-500"
            )}>
              {msg.role === 'user' ? 'U' : <Sparkles className="w-4 h-4" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-md",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-tr-none font-semibold" 
                : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-none"
            )}>
              <div className={cn(
                "max-w-none overflow-x-auto",
                msg.role === 'assistant' ? "prose prose-sm dark:prose-invert" : ""
              )}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => {
                      const isGoogleMaps = props.href?.includes('google.com/maps') || props.href?.includes('goo.gl/maps');
                      if (isGoogleMaps) {
                        return (
                          <a 
                            {...props} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 transition-all no-underline mt-2"
                          >
                            <MapPin className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">View on Map</span>
                          </a>
                        );
                      }
                      return <a {...props} target="_blank" rel="noopener noreferrer" />;
                    }
                  }}
                >
                  {msg.content
                    .replace(/```json\s*\{[\s\S]*?"type":\s*"trip_plan"[\s\S]*?\}\s*```/g, '')
                    .replace(/IMPORTANT: You MUST include the structured JSON block[\s\S]*?defined in your instructions\./g, '')
                    .trim()}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-2xl rounded-tl-none border border-zinc-200 dark:border-zinc-800 text-sm">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800/50">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about Sri Lanka..."
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 rounded-2xl py-4 pl-6 pr-14 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600 mt-4 uppercase tracking-widest font-bold">
          Powered by Gemini AI • Real-time Travel Intelligence
        </p>
      </div>
    </div>
  );
}
