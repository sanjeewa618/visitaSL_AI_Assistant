import React, { useState } from 'react';
import { Calendar, MapPin, DollarSign, Download, Trash2, ChevronRight, Map as MapIcon, Clock, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TripPlan } from '../types';
import { cn } from '../lib/utils';
import jsPDF from 'jspdf';
import TripCreatorModal from './TripCreatorModal';

interface PlannerPanelProps {
  trips: TripPlan[];
  onDeleteTrip: (id: string) => void;
  onSelectTrip: (trip: TripPlan) => void;
  onOptimizeCosts: () => void;
  onCreateTrip: (destinations: any[], numPeople: number) => void;
}

export default function PlannerPanel({ trips, onDeleteTrip, onSelectTrip, onOptimizeCosts, onCreateTrip }: PlannerPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const exportToPDF = (trip: TripPlan) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Trip to ${trip.location}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Duration: ${trip.days} Days`, 20, 30);
    doc.text(`Budget: LKR ${trip.budget.total}`, 20, 40);
    doc.text('Itinerary:', 20, 50);
    
    trip.itinerary.forEach((day, i) => {
      doc.text(`Day ${i + 1}: ${day.title || 'Activities'}`, 20, 60 + (i * 10));
    });
    
    doc.save(`${trip.location}-itinerary.pdf`);
  };

  return (
    <div className="w-80 bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800/50 flex flex-col h-screen transition-colors duration-500">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800/50 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              Trip Planner
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Your saved itineraries & routes</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            title="Create Custom Trip"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <TripCreatorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={(destinations, numPeople) => {
          onCreateTrip(destinations, numPeople);
          setIsModalOpen(false);
        }}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {trips.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
              <MapIcon className="w-6 h-6 text-zinc-400 dark:text-zinc-700" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No trips planned yet</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest font-bold">Start a chat to plan</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {trips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="group bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{trip.location}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{trip.days} Days</span>
                      <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                      <span className="text-[8px] font-bold">LKR</span>
                      <span>{trip.budget.total}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteTrip(trip.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span>Hotels</span>
                    <span className="text-zinc-900 dark:text-zinc-200">LKR {trip.budget.breakdown.hotels}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${trip.budget.total > 0 ? (Math.max(0, Number(trip.budget.breakdown?.hotels) || 0) / trip.budget.total) * 100 : 0}%` }} 
                    />
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${trip.budget.total > 0 ? (Math.max(0, Number(trip.budget.breakdown?.transport) || 0) / trip.budget.total) * 100 : 0}%` }} 
                    />
                    <div 
                      className="h-full bg-amber-500" 
                      style={{ width: `${trip.budget.total > 0 ? (Math.max(0, Number(trip.budget.breakdown?.food) || 0) / trip.budget.total) * 100 : 0}%` }} 
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onSelectTrip(trip)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => exportToPDF(trip)}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800/50 space-y-4">
        <div className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative p-5 rounded-[24px] border border-emerald-500/20 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] font-black">Global Budget</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    <span className="text-xs font-medium text-zinc-500 mr-1">LKR</span>
                    {trips.reduce((acc, t) => acc + t.budget.total, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-zinc-950/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800/50 text-center">
                <p className="text-[8px] text-zinc-500 uppercase font-bold">Hotels</p>
                <p className="text-[10px] text-zinc-900 dark:text-white font-bold">
                  {Math.round(trips.reduce((acc, t) => acc + (Number(t.budget.breakdown?.hotels) || 0), 0) / 1000)}k
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-950/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800/50 text-center">
                <p className="text-[8px] text-zinc-500 uppercase font-bold">Trans</p>
                <p className="text-[10px] text-zinc-900 dark:text-white font-bold">
                  {Math.round(trips.reduce((acc, t) => acc + (Number(t.budget.breakdown?.transport) || 0), 0) / 1000)}k
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-950/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800/50 text-center">
                <p className="text-[8px] text-zinc-500 uppercase font-bold">Food</p>
                <p className="text-[10px] text-zinc-900 dark:text-white font-bold">
                  {Math.round(trips.reduce((acc, t) => acc + (Number(t.budget.breakdown?.food) || 0), 0) / 1000)}k
                </p>
              </div>
            </div>

            <button 
              onClick={onOptimizeCosts}
              className="w-full py-3 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-emerald-50 text-white dark:text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-black/5 dark:shadow-white/5 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Optimize Total Spend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
