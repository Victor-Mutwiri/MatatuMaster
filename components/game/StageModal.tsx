
import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Users, UserMinus, UserPlus, ArrowRight, AlertTriangle } from 'lucide-react';

export const StageModal: React.FC = () => {
  const { stageData, handleStageAction, currentPassengers, maxPassengers } = useGameStore();

  if (!stageData) return null;

  const passengersAfterAlight = currentPassengers - stageData.alightingPassengers;
  const passengersAfterBoarding = passengersAfterAlight + stageData.waitingPassengers;
  
  const isOverloaded = passengersAfterBoarding > maxPassengers;
  const potentialBoarding = stageData.waitingPassengers;
  const earnings = potentialBoarding * 50; 
  
  const availableSeats = maxPassengers - passengersAfterAlight;

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
              Seats Available: <span className={availableSeats > 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                 {Math.max(0, availableSeats)}
              </span>
            </p>
            {potentialBoarding > 0 && (
               <p className="text-matatu-yellow font-bold text-sm">
                 Potential Fare: KES {earnings}
               </p>
            )}
          </div>
          
          {/* Overload Warning */}
          {isOverloaded && (
             <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex gap-3 items-start">
               <AlertTriangle className="text-red-500 shrink-0" size={20} />
               <div className="text-left">
                  <p className="text-red-400 font-bold text-xs uppercase">Warning: Overloading</p>
                  <p className="text-slate-300 text-[10px] leading-tight mt-1">
                    Picking up all passengers will exceed capacity. Police will fine you heavily if caught.
                  </p>
               </div>
             </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              variant={isOverloaded ? 'danger' : 'primary'} 
              fullWidth 
              onClick={() => handleStageAction('PICKUP')}
            >
              <span className="flex items-center justify-center gap-2">
                {isOverloaded ? 'Overload & Go' : 'Pick Up & Go'} <ArrowRight size={16} />
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
