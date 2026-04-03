import React from 'react';
import { 
  X, Globe, DollarSign, Car, Bell, MapPin, Brain, 
  Check, ChevronRight, Languages, Zap, MessageSquare, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSettings } from '../types';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdate: (settings: UserSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onUpdate }: SettingsModalProps) {
  const updateField = (field: keyof UserSettings, value: any) => {
    onUpdate({ ...settings, [field]: value });
  };

  const updateNotification = (key: keyof UserSettings['notifications'], value: boolean) => {
    onUpdate({
      ...settings,
      notifications: { ...settings.notifications, [key]: value }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <Brain className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Chatbot Settings</h2>
                <p className="text-xs text-zinc-500">Personalize your visitaSL experience</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
            
            {/* Language Selection */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <Globe className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest">Language Selection</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['English', 'Sinhala', 'Tamil'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => updateField('language', lang)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all text-center group relative overflow-hidden",
                      settings.language === lang 
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                        : "bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <span className="text-sm font-bold relative z-10">{lang}</span>
                    {settings.language === lang && (
                      <motion.div layoutId="lang-check" className="absolute top-2 right-2">
                        <Check className="w-3 h-3" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Budget & Transport */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-500">
                  <DollarSign className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Budget Range</h3>
                </div>
                <div className="space-y-2">
                  {(['Low Budget', 'Medium Budget', 'Luxury'] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => updateField('budget', b)}
                      className={cn(
                        "w-full p-4 rounded-2xl border transition-all flex items-center justify-between group",
                        settings.budget === b 
                          ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                          : "bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                      )}
                    >
                      <span className="text-sm font-bold">{b}</span>
                      {settings.budget === b && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-purple-500">
                  <Car className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Transport Mode</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['Bus', 'Train', 'Car', 'Bike'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateField('transport', t)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group",
                        settings.transport === t 
                          ? "bg-purple-500/10 border-purple-500 text-purple-400" 
                          : "bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                      )}
                    >
                      <span className="text-sm font-bold">{t}</span>
                      {settings.transport === t && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* AI Style */}
            <div className="grid grid-cols-1 gap-8">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-pink-500">
                  <MessageSquare className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">AI Response Style</h3>
                </div>
                <select 
                  value={settings.responseStyle}
                  onChange={(e) => updateField('responseStyle', e.target.value as any)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-pink-500 transition-all appearance-none cursor-pointer shadow-sm"
                >
                  <option value="Short">Short answers</option>
                  <option value="Detailed">Detailed explanations</option>
                  <option value="Friendly">Friendly tone</option>
                  <option value="Professional">Professional tone</option>
                </select>
              </section>
            </div>

            {/* Notifications & Privacy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Bell className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Notifications</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'tripReminders', label: 'Trip reminders' },
                    { key: 'weatherAlerts', label: 'Weather alerts' },
                    { key: 'travelTips', label: 'Travel tips' }
                  ].map((n) => (
                    <label key={n.key} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{n.label}</span>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications[n.key as keyof UserSettings['notifications']]}
                        onChange={(e) => updateNotification(n.key as any, e.target.checked)}
                        className="w-5 h-5 rounded-lg border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-red-500">
                  <Shield className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Privacy & Location</h3>
                </div>
                <div className="p-6 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        settings.locationEnabled ? "bg-red-500/10 text-red-500" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                      )}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">Location Access</p>
                        <p className="text-[10px] text-zinc-500">For nearby suggestions</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateField('locationEnabled', !settings.locationEnabled)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        settings.locationEnabled ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
                      )}
                    >
                      <motion.div 
                        animate={{ x: settings.locationEnabled ? 26 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-relaxed">
                    When enabled, the chatbot can suggest nearby places and provide real-time travel suggestions based on your current location.
                  </p>
                </div>
              </section>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
