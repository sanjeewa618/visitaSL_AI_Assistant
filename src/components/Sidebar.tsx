import React from 'react';
import { 
  MessageSquare, 
  Plus, 
  History, 
  Settings, 
  LogOut, 
  Compass, 
  MapPin, 
  Hotel, 
  Utensils, 
  Mountain, 
  Waves, 
  Palmtree, 
  History as HistoryIcon, 
  PawPrint,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ChatSession, UserSettings } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  settings: UserSettings;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onSignOut: () => void;
  onVibeClick: (vibe: string) => void;
  onSettingsClick: () => void;
  onUpdateSettings: (settings: UserSettings) => void;
  user: any;
}

const VIBES = [
  { name: 'Adventure', icon: Mountain, color: 'text-orange-500' },
  { name: 'Beaches', icon: Waves, color: 'text-blue-500' },
  { name: 'Nature', icon: Palmtree, color: 'text-green-500' },
  { name: 'Culture', icon: HistoryIcon, color: 'text-amber-600' },
  { name: 'Wildlife', icon: PawPrint, color: 'text-emerald-600' },
];

export default function Sidebar({ sessions, activeSessionId, settings, onNewChat, onSelectSession, onDeleteSession, onSignOut, onVibeClick, onSettingsClick, onUpdateSettings, user }: SidebarProps) {
  return (
    <div className="w-72 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 h-screen flex flex-col border-r border-zinc-200 dark:border-zinc-800/50 transition-colors duration-500">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">visitaSL</h1>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">AI Assistant</p>
        </div>
      </div>

      <div className="px-4 mb-6">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700/50 group shadow-sm"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          <span className="font-medium text-sm">New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 scrollbar-hide">
        <div>
          <h2 className="px-2 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold mb-3">Travel Vibes</h2>
          <div className="space-y-1">
            {VIBES.map((vibe) => (
              <button
                key={vibe.name}
                onClick={() => onVibeClick(vibe.name)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800/50 text-sm transition-colors group"
              >
                <vibe.icon className={cn("w-4 h-4", vibe.color)} />
                <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{vibe.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="px-2 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold mb-3">Recent Chats</h2>
          <div className="space-y-1">
            {sessions.map((session) => (
              <div key={session.id} className="group relative">
                <button
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left pr-10",
                    activeSessionId === session.id 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                      : "hover:bg-zinc-200 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">{session.title}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-zinc-400 italic">No recent chats</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
            alt="User" 
            className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{user?.displayName || 'Traveler'}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onSettingsClick}
            className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
        <button 
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
