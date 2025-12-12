
import React, { useState, useEffect } from 'react';
import { Users, Smile, Wallet, Clock, Radio, Volume2, VolumeX, Music, Music2, AlertOctagon, MapPin, Fuel, Megaphone, Car, Pause, Maximize, Minimize, Siren, Flag } from 'lucide-react';
import { useGameStore, VEHICLE_SPECS } from '../../store/gameStore';
import { playSfx } from '../../utils/audio';

// --- SVG Gauge Component ---
interface SpeedGaugeProps {
  speed: number;
  maxSpeed: number;
}

const SpeedGauge: React.FC<SpeedGaugeProps> = ({ speed, maxSpeed }) => {
  const radius = 35;
  const stroke = 6;
  const normalizedSpeed = Math.min(speed, maxSpeed);
  const percentage = normalizedSpeed / maxSpeed;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360); 
  const strokeDashoffset = arcLength - (percentage * arcLength);
  const hue = 120 - (percentage * 120); // 120 (Green) -> 0 (Red)
  const color = `hsl(${hue}, 100%, 50%)`;

  return (
    <div className="relative flex flex-col items-center justify-center w-20 h-20">
      <svg width="80" height="80" className="rotate-[150deg] drop-shadow-lg">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#1e293b" strokeWidth={stroke} strokeDasharray={`${arcLength} ${circumference}`} strokeLinecap="round" />
        <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${arcLength} ${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-[stroke-dashoffset] duration-300 ease-out" />
      </svg>
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
    isEngineSoundOn, 
    toggleEngineSound,
    currentSpeed,
    distanceTraveled,
    totalRouteDistance,
    setControl,
    fuel,
    pauseGame,
    vehicleType,
    overlapTimer,
    selectedRoute,
    formatCurrency
  } = useGameStore();

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = gameTimeRemaining <= 30; 
  const happinessColor = happiness > 75 ? 'text-neon-blue' : happiness > 40 ? 'text-yellow-400' : 'text-red-500';
  const isOverloaded = currentPassengers > maxPassengers;
  
  const displaySpeed = Math.round(currentSpeed * 1.6);
  
  const spec = vehicleType ? VEHICLE_SPECS[vehicleType] : VEHICLE_SPECS['14-seater'];
  const maxDisplaySpeed = spec.maxSpeedKmh;

  const distLeftKm = Math.max(0, (totalRouteDistance - distanceTraveled) / 1000).toFixed(1);
  const distProgress = Math.min(100, (distanceTraveled / totalRouteDistance) * 100);

  const handleGasStart = () => setControl('GAS', true);
  const handleGasEnd = () => setControl('GAS', false);
  const handleBrakeStart = () => setControl('BRAKE', true);
  const handleBrakeEnd = () => setControl('BRAKE', false);

  // Prevent context menu on long press
  const preventContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Warning logic
  const isOverlapWarning = overlapTimer > 2;
  const isRiverRoad = selectedRoute?.id === 'river-road';
  const isRaceMode = selectedRoute?.gamemode === 'RACE';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1 md:p-2 lg:p-4 z-10 select-none">
      
      {/* POLICE ATTENTION WARNING (Visual Screen Overlay) */}
      {isOverlapWarning && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Flashing Borders */}
            <div className="absolute inset-0 border-[20px] border-red-500/30 animate-pulse"></div>
            <div className="absolute inset-0 border-[20px] border-blue-500/30 animate-pulse delay-75"></div>
            
            {/* Text Alert */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-lg shadow-xl animate-bounce flex items-center gap-3 border-2 border-white">
                 <Siren size={32} className="animate-spin" />
                 <div className="text-center">
                    <h2 className="font-black text-xl uppercase tracking-wider leading-none">POLICE ALERT</h2>
                    <p className="text-[10px] font-bold">
                        {isRiverRoad ? "SIDEWALK VIOLATION" : "ILLEGAL OVERLAP DETECTED"}
                    </p>
                 </div>
                 <Siren size={32} className="animate-spin" />
            </div>
        </div>
      )}

      {/* --- TOP HUD AREA --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-2 relative z-10 pt-1 lg:pt-0">
        
        {/* Left Side: Stats */}
        <div className="flex flex-row lg:flex-col gap-2 pointer-events-auto w-full lg:w-auto items-center lg:items-start overflow-x-auto lg:overflow-visible no-scrollbar">
            
            {/* Control Buttons Group */}
            <div className="flex items-center gap-2 mr-2 lg:mr-0 lg:mb-1">
                {/* Pause Button */}
                <button 
                    onClick={pauseGame}
                    className="bg-slate-900/80 backdrop-blur-md border border-slate-600 hover:border-white hover:bg-slate-800 text-white w-8 h-8 lg:w-10 lg:h-10 rounded-lg shadow-lg flex items-center justify-center transition-all active:scale-95 group shrink-0"
                    title="Pause Game"
                >
                    <Pause size={16} fill="currentColor" className="lg:w-5 lg:h-5 group-hover:scale-110 transition-transform"/>
                </button>

                {/* Fullscreen Button */}
                <button 
                    onClick={toggleFullscreen}
                    className="bg-slate-900/80 backdrop-blur-md border border-slate-600 hover:border-matatu-yellow hover:text-matatu-yellow hover:bg-slate-800 text-slate-300 w-8 h-8 lg:w-10 lg:h-10 rounded-lg shadow-lg flex items-center justify-center transition-all active:scale-95 group shrink-0"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? (
                        <Minimize size={16} className="lg:w-5 lg:h-5 group-hover:scale-110 transition-transform"/>
                    ) : (
                        <Maximize size={16} className="lg:w-5 lg:h-5 group-hover:scale-110 transition-transform"/>
                    )}
                </button>
            </div>

            {/* Time Card */}
            <div className={`backdrop-blur-md border-l-2 lg:border-l-4 px-2 py-1 lg:px-3 lg:py-2 rounded-r-lg shadow-lg flex items-center gap-2 transition-colors duration-300 min-w-fit lg:min-w-[130px] shrink-0 ${isLowTime ? 'bg-red-900/80 border-red-500 animate-pulse' : 'bg-slate-900/80 border-matatu-yellow'}`}>
                <Clock className={isLowTime ? 'text-red-200' : 'text-white'} size={14} />
                <div className="flex flex-col leading-none">
                    <span className={`text-[8px] lg:text-[10px] uppercase font-bold tracking-wider mb-0 lg:mb-0.5 hidden lg:block ${isLowTime ? 'text-red-200' : 'text-slate-400'}`}>Time</span>
                    <span className={`font-display text-sm lg:text-lg font-bold ${isLowTime ? 'text-white' : 'text-white'}`}>{formatTime(gameTimeRemaining)}</span>
                </div>
            </div>

            {/* Distance Card */}
            <div className="backdrop-blur-md bg-slate-900/80 border-l-2 lg:border-l-4 border-slate-500 px-2 py-1 lg:px-3 lg:py-2 rounded-r-lg shadow-lg flex items-center gap-2 min-w-fit lg:min-w-[130px] shrink-0">
                {isRaceMode ? <Flag className="text-neon-blue" size={14} /> : <MapPin className="text-neon-blue" size={14} />}
                <div className="flex flex-col leading-none w-full">
                    <span className="text-[8px] lg:text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0 lg:mb-0.5 hidden lg:block">Dst. Left</span>
                    <span className="font-display text-sm lg:text-lg font-bold text-white whitespace-nowrap">{distLeftKm} km</span>
                    <div className="w-full h-1 bg-slate-700 mt-1 rounded-full overflow-hidden hidden lg:block">
                        <div className="h-full bg-neon-blue transition-all duration-1000 ease-linear" style={{ width: `${distProgress}%` }} />
                    </div>
                </div>
            </div>

            {/* Fuel Card - Always relevant */}
            <div className="backdrop-blur-md bg-slate-900/80 border-l-2 lg:border-l-4 border-slate-600 px-2 py-1 lg:px-3 lg:py-2 rounded-r-lg shadow-lg flex items-center gap-2 min-w-fit lg:min-w-[130px] shrink-0">
                <Fuel className={fuel < 20 ? "text-red-500 animate-pulse" : "text-orange-400"} size={14} />
                <div className="flex flex-col leading-none w-full">
                    <span className="text-[8px] lg:text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0 lg:mb-0.5 hidden lg:block">Fuel</span>
                    <span className="font-display text-sm lg:text-lg font-bold text-white">{Math.round(fuel)}%</span>
                     <div className="w-full h-1 bg-slate-700 mt-1 rounded-full overflow-hidden hidden lg:block">
                        <div className={`h-full transition-all duration-300 ${fuel < 20 ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${fuel}%` }} />
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Vibe & Settings */}
        <div className="flex lg:flex-col gap-2 items-center lg:items-end pointer-events-auto absolute top-1 right-0 lg:static">
          
          {/* Vibe / Happiness - Hidden in Race Mode (less relevant) */}
          {!isRaceMode && (
              <div className="bg-slate-900/80 backdrop-blur-md border-r-4 border-neon-blue px-3 py-1 lg:px-4 lg:py-2 rounded-l-lg shadow-lg flex items-center gap-2">
                 <div className="flex flex-col items-end leading-none">
                   <span className="text-[8px] lg:text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0 lg:mb-0.5 hidden lg:block">Vibe</span>
                   <span className={`font-display text-sm lg:text-lg font-bold ${happinessColor}`}>{Math.round(happiness)}%</span>
                 </div>
                 <Smile className={happinessColor} size={16} />
              </div>
          )}

          <div className="flex gap-2">
            <button onClick={toggleEngineSound} className={`flex items-center justify-center w-8 h-8 rounded-full transition-all shadow-lg ${isEngineSoundOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`} title="Toggle Engine Sound">
                <Car size={14} />
            </button>
            <button onClick={toggleSound} className={`flex items-center justify-center w-8 h-8 rounded-full transition-all shadow-lg ${isSoundOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`} title="Toggle Sound Effects">
                {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button onClick={toggleStereo} className={`flex items-center justify-center lg:gap-2 w-8 h-8 lg:w-auto lg:h-auto lg:px-3 lg:py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${isStereoOn ? 'bg-purple-600 text-white shadow-purple-500/30 ring-2 ring-purple-400 animate-pulse-fast' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {isStereoOn ? <Music size={14} /> : <Music2 size={14} />}
              <span className="hidden lg:inline">Stereo</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- BOTTOM AREA (Pedals and Stats) --- */}
      <div className="mt-auto flex justify-between items-end pb-1 lg:pb-4 relative z-10">
        
        {/* Left: Brake Pedal & Passengers */}
        <div className="flex items-end gap-2 lg:gap-3 pointer-events-auto">
          <button 
            className="group active:scale-95 transition-transform touch-none select-none" 
            onMouseDown={handleBrakeStart} 
            onMouseUp={handleBrakeEnd} 
            onMouseLeave={handleBrakeEnd} 
            onTouchStart={handleBrakeStart} 
            onTouchEnd={handleBrakeEnd}
            onContextMenu={preventContextMenu}
          >
            <div className="w-14 h-20 lg:w-16 lg:h-32 bg-red-900 border-4 border-red-600 rounded-lg flex flex-col justify-end p-1.5 lg:p-2 shadow-lg relative overflow-hidden">
               <span className="text-[8px] lg:text-[10px] font-black text-red-400 uppercase text-center w-full z-10">Brake</span>
               <div className="absolute inset-0 bg-red-500 opacity-0 group-active:opacity-30 transition-opacity"></div>
               <div className="w-full h-1 bg-black/30 mb-1"></div>
               <div className="w-full h-1 bg-black/30 mb-1"></div>
               <div className="w-full h-1 bg-black/30 mb-1"></div>
            </div>
          </button>

          <div className="flex flex-col gap-1 lg:gap-2 pointer-events-none mb-0.5 lg:mb-1">
            <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-full border border-slate-700 shadow-2xl relative scale-75 origin-bottom-left">
               <SpeedGauge speed={displaySpeed} maxSpeed={maxDisplaySpeed} />
            </div>

            {/* Passenger Counter - HIDDEN IN RACE MODE */}
            {!isRaceMode && (
                <div className={`backdrop-blur-md px-2 py-1 lg:px-3 lg:py-2 rounded-lg border shadow-lg flex items-center gap-2 transition-colors ${isOverloaded ? 'bg-red-900/90 border-red-500' : 'bg-slate-900/80 border-slate-700'}`}>
                  {isOverloaded ? (<AlertOctagon className="text-white animate-pulse" size={14} />) : (<Users className="text-slate-300" size={14} />)}
                  <div className="leading-none">
                    <span className={`block text-[8px] uppercase font-bold mb-0.5 ${isOverloaded ? 'text-red-200' : 'text-slate-400'}`}>Pass.</span>
                    <span className="font-display text-xs lg:text-sm font-bold text-white">{currentPassengers}/{maxPassengers}</span>
                  </div>
                </div>
            )}
          </div>
        </div>
        
        {/* Center/Right: Horn & Gas */}
        <div className="flex items-end gap-2 lg:gap-4 pointer-events-auto">
           
           <button 
             className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-lg active:scale-95 active:bg-slate-700 active:border-slate-500 transition-all group touch-none select-none"
             onClick={() => playSfx('HORN')}
             onContextMenu={preventContextMenu}
           >
             <Megaphone className="text-slate-400 group-active:text-yellow-400 group-active:scale-110 transition-all" size={20} />
           </button>

           <div className="flex flex-col gap-1 lg:gap-2 items-end">
              
              {/* Cash Counter - HIDDEN IN RACE MODE */}
              {!isRaceMode && (
                  <div className="bg-slate-900/80 backdrop-blur-md px-2 py-1 lg:px-4 lg:py-2 rounded-lg border border-matatu-yellow/50 shadow-[0_0_15px_rgba(255,215,0,0.2)] flex items-center gap-3 pointer-events-none">
                    <div className="text-right leading-none">
                      <span className="block text-[8px] lg:text-[10px] text-matatu-yellow uppercase font-bold tracking-wider mb-0.5">Cash</span>
                      <span className="font-display text-sm lg:text-lg font-bold text-green-400">{formatCurrency(stats.cash)}</span>
                    </div>
                    <Wallet className="text-green-400" size={16} />
                  </div>
              )}

              <button 
                className="group active:scale-95 transition-transform touch-none select-none" 
                onMouseDown={handleGasStart} 
                onMouseUp={handleGasEnd} 
                onMouseLeave={handleGasEnd} 
                onTouchStart={handleGasStart} 
                onTouchEnd={handleGasEnd}
                onContextMenu={preventContextMenu}
              >
                <div className="w-14 h-24 lg:w-16 lg:h-32 bg-slate-800 border-4 border-green-500 rounded-lg flex flex-col justify-end p-1.5 lg:p-2 shadow-lg relative overflow-hidden">
                  <span className="text-[8px] lg:text-[10px] font-black text-green-400 uppercase text-center w-full z-10">Gas</span>
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
    </div>
  );
};
