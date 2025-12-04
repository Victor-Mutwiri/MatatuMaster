
import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Users, UserMinus, UserPlus, ArrowRight } from 'lucide-react';

export const StageModal: React.FC = () => {
  const { stageData, handleStageAction, currentPassengers, maxPassengers } = useGameStore();

  if (!stageData) return null;

  const availableSeats = maxPassengers - (currentPassengers - stageData.alightingPassengers);
  const potentialBoarding = Math.min(availableSeats, stageData.waitingPassengers);
  const earnings = potentialBoarding * 50; // Hardcoded fare for now

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 border-2 border-matatu-yellow w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-matatu-yellow p-4 flex justify-between items-center text-black">
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-tighter">STAGE REACHED</h2>
            <p className="text-xs font-bold opacity-80">Stop & Pick Up</p>
          </div>
          <Users size={24} />
        </div>

        <div className="p-6 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Alighting */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
               <div className="flex items-center gap-2 text-red-400 mb-1">
                 <UserMinus size={16} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Alighting</span>
               </div>
               <span className="text-2xl font-display font-bold text-white">
                 {stageData.alightingPassengers}
               </span>
            </div>

            {/* Waiting */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
               <div className="flex items-center gap-2 text-green-400 mb-1">
                 <UserPlus size={16} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Waiting</span>
               </div>
               <span className="text-2xl font-display font-bold text-white">
                 {stageData.waitingPassengers}
               </span>
            </div>

          </div>

          {/* Info */}
          <div className="text-center space-y-1">
            <p className="text-slate-400 text-sm">
              Capacity: <span className="text-white font-bold">{currentPassengers}/{maxPassengers}</span> 
              {' '}&rarr;{' '} 
              <span className={availableSeats > 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                 {Math.max(0, availableSeats)} seats free
              </span>
            </p>
            {potentialBoarding > 0 && (
               <p className="text-matatu-yellow font-bold text-sm">
                 Potential Fare: KES {earnings}
               </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              variant="primary" 
              fullWidth 
              onClick={() => handleStageAction('PICKUP')}
            >
              <span className="flex items-center justify-center gap-2">
                Pick Up {potentialBoarding} Pax <ArrowRight size={16} />
              </span>
            </Button>
            
            <Button 
              variant="secondary" 
              fullWidth 
              onClick={() => handleStageAction('DEPART')}
            >
              Skip / Depart
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};
