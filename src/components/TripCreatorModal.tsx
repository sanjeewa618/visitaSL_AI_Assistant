import React, { useState } from 'react';
import { X, Plus, Trash2, MapPin, Clock, DollarSign, Sparkles, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Destination {
  id: string;
  name: string;
  days: number;
  cost: number;
}

interface TripCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (destinations: Destination[], numPeople: number) => void;
}

export default function TripCreatorModal({ isOpen, onClose, onGenerate }: TripCreatorModalProps) {
  const [numPeople, setNumPeople] = useState(1);
  const [destinations, setDestinations] = useState<Destination[]>([
    { id: '1', name: '', days: 1, cost: 0 }
  ]);

  const addDestination = () => {
    setDestinations([...destinations, { id: Math.random().toString(36).substr(2, 9), name: '', days: 1, cost: 0 }]);
  };

  const removeDestination = (id: string) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter(d => d.id !== id));
    }
  };

  const updateDestination = (id: string, field: keyof Destination, value: any) => {
    setDestinations(destinations.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const totalBudget = destinations.reduce((acc, d) => acc + (Number(d.cost) || 0), 0);
  const totalDays = destinations.reduce((acc, d) => acc + (Number(d.days) || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Custom Trip Creator</h2>
              <p className="text-xs text-zinc-500">Plan your perfect Sri Lankan journey</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 scrollbar-hide">
          {/* Trip Settings */}
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Number of Travelers</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Adjusts plan recommendations</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button 
                onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-bold text-zinc-900 dark:text-white">{numPeople}</span>
              <button 
                onClick={() => setNumPeople(numPeople + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {destinations.map((dest, index) => (
                <motion.div 
                  key={dest.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 relative group"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-emerald-500" /> Destination
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Ella, Galle..."
                        value={dest.name}
                        onChange={(e) => updateDestination(dest.id, 'name', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3 text-blue-500" /> Duration (Days)
                      </label>
                      <input 
                        type="number"
                        min="1"
                        value={dest.days || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          updateDestination(dest.id, 'days', isNaN(val) ? 0 : val);
                        }}
                        className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-emerald-500" /> Est. Cost (LKR)
                      </label>
                      <input 
                        type="number"
                        placeholder="0"
                        value={dest.cost || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          updateDestination(dest.id, 'cost', isNaN(val) ? 0 : val);
                        }}
                        className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>
                  
                  {destinations.length > 1 && (
                    <button 
                      onClick={() => removeDestination(dest.id)}
                      className="absolute -right-2 -top-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button 
            onClick={addDestination}
            className="w-full py-3 border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-zinc-500 hover:text-emerald-500 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" /> Add Another Destination
          </button>
        </div>

        <div className="p-6 bg-white/50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Summary</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{totalDays} Days</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-500">LKR {totalBudget.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onGenerate(destinations, numPeople)}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            Generate Final Plan
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
