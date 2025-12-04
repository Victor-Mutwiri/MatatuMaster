
import React from 'react';
import { Users, Smile, Wallet, Clock, Radio, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export const HUD: React.FC = () => {
  const { gameTimeRemaining, currentPassengers, maxPassengers, stats, happiness, isStereoOn, toggleStereo } = useGameStore();

  // Format Seconds to MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = gameTimeRemaining <= 30; // Red alert if under 30s
  const happinessColor = happiness > 75 ? 'text-neon-blue' : happiness > 40 ? 'text-yellow-400' : 'text-red-500';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      
      {/* Top Bar: Time and Happiness */}
      <div className="flex justify-between items-start">
        {/* Time */}
        <div className={`
          backdrop-blur-md border-l-4 px-4 py-2 rounded-r-lg shadow-lg flex items-center gap-3 transition-colors duration-300
          ${isLowTime 
            ? 'bg-red-900/80 border-red-500 animate-pulse' 
            : 'bg-slate-900/80 border-matatu-yellow'
          }
        `}>
          <Clock className={isLowTime ? 'text-red-200' : 'text-white'} size={20} />
          <div className="flex flex-col">
             <span className={`text-[10px] uppercase font-bold tracking-wider ${isLowTime ? 'text-red-200' : 'text-slate-400'}`}>
               Time Rem.
             </span>
             <span className={`font-display text-xl font-bold leading-none ${isLowTime ? 'text-white' : 'text-white'}`}>
               {formatTime(gameTimeRemaining)}
             </span>
          </div>
        </div>

        {/* Happiness & Stereo */}
        <div className="flex flex-col gap-2 items-end pointer-events-auto">
          {/* Happiness Meter */}
          <div className="bg-slate-900/80 backdrop-blur-md border-r-4 border-neon-blue px-4 py-2 rounded-l-lg shadow-lg flex items-center gap-3">
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vibe</span>
               <span className={`font-display text-xl font-bold leading-none ${happinessColor}`}>
                 {Math.round(happiness)}%
               </span>
             </div>
             <Smile className={happinessColor} size={20} />
          </div>

          {/* Stereo Toggle */}
          <button 
            onClick={toggleStereo}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-lg
              ${isStereoOn 
                ? 'bg-purple-600 text-white shadow-purple-500/30 ring-2 ring-purple-400 animate-pulse-fast' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }
            `}
          >
            {isStereoOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>Stereo {isStereoOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar: Passengers and Fare */}
      <div className="flex justify-between items-end">
        
        {/* Passengers */}
        <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-700 shadow-lg flex items-center gap-3">
          <Users className="text-slate-300" size={20} />
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Pax</span>
            <span className="font-display text-lg font-bold text-white">
              {currentPassengers}/{maxPassengers}
            </span>
          </div>
        </div>

        {/* Fare (Cash) */}
        <div className="bg-slate-900/80 backdrop-blur-md px-5 py-3 rounded-lg border border-matatu-yellow/50 shadow-[0_0_15px_rgba(255,215,0,0.2)] flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[10px] text-matatu-yellow uppercase font-bold tracking-wider">Total Cash</span>
            <span className="font-display text-xl font-bold text-green-400">KES {stats.cash.toLocaleString()}</span>
          </div>
          <Wallet className="text-green-400" size={24} />
        </div>

      </div>
    </div>
  );
};
