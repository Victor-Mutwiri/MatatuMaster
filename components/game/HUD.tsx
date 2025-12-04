

import React from 'react';
import { Users, Smile, Wallet, Clock, Radio, Volume2, VolumeX, Music, Music2, AlertOctagon, MapPin } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

// --- SVG Gauge Component ---
interface SpeedGaugeProps {
  speed: number;
  maxSpeed: number;
}

const SpeedGauge: React.FC<SpeedGaugeProps> = ({ speed, maxSpeed }) => {
  // Visual tweaks
  const radius = 35;
  const stroke = 6;
  const normalizedSpeed = Math.min(speed, maxSpeed);
  const percentage = normalizedSpeed / maxSpeed;
  
  // Calculate stroke dash based on arc
  // We want a 240 degree gauge (Leaving 120 degrees open at bottom)
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360); 
  const strokeDashoffset = arcLength - (percentage * arcLength);

  // Dynamic Color
  const hue = 120 - (percentage * 120); // 120 (Green) -> 0 (Red)
  const color = `hsl(${hue}, 100%, 50%)`;

  return (
    <div className="relative flex flex-col items-center justify-center w-20 h-20">
      <svg width="80" height="80" className="rotate-[150deg] drop-shadow-lg">
        {/* Background Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Progress Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
      
      {/* Digital Speed Readout centered absolutely */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 pointer-events-none">
        <span className="font-display text-2xl font-black text-white leading-none drop-shadow-md">
           {Math.round(speed)}
        </span>
        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">KM/H</span>
      </div>
    </div>
  );
};

export const HUD: React.FC = () => {
  const { 
    gameTimeRemaining, 
    currentPassengers, 
    maxPassengers, 
    stats, 
    happiness, 
    isStereoOn, 
    toggleStereo, 
    isSoundOn, 
    toggleSound, 
    currentSpeed,
    distanceTraveled,
    totalRouteDistance,
    setControl
  } = useGameStore();

  // Format Seconds to MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = gameTimeRemaining <= 30; 
  const happinessColor = happiness > 75 ? 'text-neon-blue' : happiness > 40 ? 'text-yellow-400' : 'text-red-500';
  const isOverloaded = currentPassengers > maxPassengers;
  
  // Fake KM/H scaling
  const displaySpeed = Math.round(currentSpeed * 1.6);
  const maxDisplaySpeed = 200; // Cap for gauge visual

  // Distance formatting
  const distLeftKm = Math.max(0, (totalRouteDistance - distanceTraveled) / 1000).toFixed(1);
  const distProgress = Math.min(100, (distanceTraveled / totalRouteDistance) * 100);

  // Pedal Handlers
  const handleGasStart = () => setControl('GAS', true);
  const handleGasEnd = () => setControl('GAS', false);
  const handleBrakeStart = () => setControl('BRAKE', true);
  const handleBrakeEnd = () => setControl('BRAKE', false);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      
      {/* Top Bar Area */}
      <div className="flex justify-between items-start gap-2">
        
        {/* Left Side: Time and Distance */}
        <div className="flex flex-col gap-2">
            
            {/* Time Widget */}
            <div className={`
            backdrop-blur-md border-l-4 px-3 py-2 rounded-r-lg shadow-lg flex items-center gap-3 transition-colors duration-300 min-w-[130px]
            ${isLowTime 
                ? 'bg-red-900/80 border-red-500 animate-pulse' 
                : 'bg-slate-900/80 border-matatu-yellow'
            }
            `}>
            <Clock className={isLowTime ? 'text-red-200' : 'text-white'} size={18} />
            <div className="flex flex-col leading-none">
                <span className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isLowTime ? 'text-red-200' : 'text-slate-400'}`}>
                Time Rem.
                </span>
                <span className={`font-display text-lg font-bold ${isLowTime ? 'text-white' : 'text-white'}`}>
                {formatTime(gameTimeRemaining)}
                </span>
            </div>
            </div>

            {/* Distance Widget */}
            <div className="backdrop-blur-md bg-slate-900/80 border-l-4 border-slate-500 px-3 py-2 rounded-r-lg shadow-lg flex items-center gap-3 min-w-[130px]">
                <MapPin className="text-neon-blue" size={18} />
                <div className="flex flex-col leading-none w-full">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">
                       Dst. Left
                    </span>
                    <span className="font-display text-lg font-bold text-white">
                       {distLeftKm} km
                    </span>
                    {/* Mini Progress Bar */}
                    <div className="w-full h-1 bg-slate-700 mt-1 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-neon-blue transition-all duration-1000 ease-linear"
                           style={{ width: `${distProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Controls and Happiness */}
        <div className="flex flex-col gap-2 items-end pointer-events-auto">
          
          {/* Happiness Meter */}
          <div className="bg-slate-900/80 backdrop-blur-md border-r-4 border-neon-blue px-4 py-2 rounded-l-lg shadow-lg flex items-center gap-3">
             <div className="flex flex-col items-end leading-none">
               <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Vibe</span>
               <span className={`font-display text-lg font-bold ${happinessColor}`}>
                 {Math.round(happiness)}%
               </span>
             </div>
             <Smile className={happinessColor} size={20} />
          </div>

          <div className="flex gap-2">
            {/* SFX Toggle */}
            <button 
                onClick={toggleSound}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full transition-all shadow-lg
                  ${isSoundOn 
                    ? 'bg-slate-700 text-white hover:bg-slate-600' 
                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                  }
                `}
                title="Toggle Sound Effects"
              >
                {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

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
              {isStereoOn ? <Music size={14} /> : <Music2 size={14} />}
              <span>Stereo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area - Pedals and Stats */}
      <div className="mt-auto flex justify-between items-end pb-2">
        
        {/* Left: Brake Pedal & Passengers */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Brake Pedal */}
          <button 
             className="group active:scale-95 transition-transform"
             onMouseDown={handleBrakeStart} onMouseUp={handleBrakeEnd} onMouseLeave={handleBrakeEnd}
             onTouchStart={handleBrakeStart} onTouchEnd={handleBrakeEnd}
          >
            <div className="w-16 h-24 bg-red-900 border-4 border-red-600 rounded-lg flex flex-col justify-end p-2 shadow-lg relative overflow-hidden">
               <span className="text-[10px] font-black text-red-400 uppercase text-center w-full z-10">Brake</span>
               <div className="absolute inset-0 bg-red-500 opacity-0 group-active:opacity-30 transition-opacity"></div>
               <div className="w-full h-1 bg-black/30 mb-1"></div>
               <div className="w-full h-1 bg-black/30 mb-1"></div>
               <div className="w-full h-1 bg-black/30 mb-1"></div>
            </div>
          </button>

          {/* Speed & Pax Info (Non-interactive) */}
          <div className="flex flex-col gap-2 pointer-events-none mb-1">
            
            {/* Animated Gauge Speedometer */}
            <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-full border border-slate-700 shadow-2xl relative">
               <SpeedGauge speed={displaySpeed} maxSpeed={maxDisplaySpeed} />
            </div>

            {/* Pax */}
            <div className={`
              backdrop-blur-md px-3 py-2 rounded-lg border shadow-lg flex items-center gap-2 transition-colors
              ${isOverloaded 
                ? 'bg-red-900/90 border-red-500' 
                : 'bg-slate-900/80 border-slate-700'
              }
            `}>
              {isOverloaded ? (
                <AlertOctagon className="text-white animate-pulse" size={16} />
              ) : (
                <Users className="text-slate-300" size={16} />
              )}
              
              <div className="leading-none">
                <span className={`block text-[8px] uppercase font-bold mb-0.5 ${isOverloaded ? 'text-red-200' : 'text-slate-400'}`}>
                  Pax {isOverloaded && '!'}
                </span>
                <span className="font-display text-sm font-bold text-white">
                  {currentPassengers}/{maxPassengers}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Cash & Gas Pedal */}
        <div className="flex items-end gap-4 pointer-events-auto">
          
           {/* Cash (Visual only) */}
           <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-matatu-yellow/50 shadow-[0_0_15px_rgba(255,215,0,0.2)] flex items-center gap-3 mb-2 pointer-events-none">
            <div className="text-right leading-none">
              <span className="block text-[10px] text-matatu-yellow uppercase font-bold tracking-wider mb-0.5">Cash</span>
              <span className="font-display text-lg font-bold text-green-400">KES {stats.cash.toLocaleString()}</span>
            </div>
            <Wallet className="text-green-400" size={20} />
          </div>

          {/* Gas Pedal */}
          <button 
             className="group active:scale-95 transition-transform"
             onMouseDown={handleGasStart} onMouseUp={handleGasEnd} onMouseLeave={handleGasEnd}
             onTouchStart={handleGasStart} onTouchEnd={handleGasEnd}
          >
            <div className="w-16 h-32 bg-slate-800 border-4 border-green-500 rounded-lg flex flex-col justify-end p-2 shadow-lg relative overflow-hidden">
               <span className="text-[10px] font-black text-green-400 uppercase text-center w-full z-10">Gas</span>
               <div className="absolute inset-0 bg-green-500 opacity-0 group-active:opacity-30 transition-opacity"></div>
               <div className="w-full h-1 bg-black/30 mb-1"></div>
               <div className="w-full h-1 bg-black/30 mb-1"></div>
               <div className="w-full h-1 bg-black/30 mb-1"></div>
               <div className="w-full h-1 bg-black/30 mb-1"></div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};