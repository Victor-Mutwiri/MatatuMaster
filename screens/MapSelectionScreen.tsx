
import React, { useRef, useEffect } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { Route } from '../types';
import { Map, Clock, AlertTriangle, Lock, MapPin, ArrowLeft, TrendingUp, Car, Shield, Navigation } from 'lucide-react';

const MAPS: Route[] = [
  {
    id: 'kiambu-route',
    name: 'Nairobi → Kiambu',
    distance: 14.5,
    potentialEarnings: 4500,
    trafficLevel: 'Medium',
    dangerLevel: 'Safe',
    timeLimit: '45 mins',
    description: 'The standard commuter route. Good for beginners, but watch out for rush hour.',
    isLocked: false
  },
  {
    id: 'thika-highway',
    name: 'Thika Highway Super',
    distance: 40.2,
    potentialEarnings: 8000,
    trafficLevel: 'Gridlock',
    dangerLevel: 'Sketchy',
    timeLimit: '1h 15m',
    isLocked: true
  },
  {
    id: 'rongai-extreme',
    name: 'Rongai Extreme',
    distance: 25.0,
    potentialEarnings: 12000,
    trafficLevel: 'Gridlock',
    dangerLevel: 'No-Go Zone',
    timeLimit: '2h 00m',
    isLocked: true
  }
];

export const MapSelectionScreen: React.FC = () => {
  const { selectRoute, selectedRoute, startGameLoop, setScreen } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected route on mount
  useEffect(() => {
    if (!selectedRoute) {
       selectRoute(MAPS[0]);
    }
  }, []);

  const handleStartGame = () => {
    if (selectedRoute && !selectedRoute.isLocked) {
      startGameLoop();
    }
  };

  const handleBack = () => {
    setScreen('SETUP');
  };

  // Helper to get stats for the active route
  const activeRoute = selectedRoute || MAPS[0];

  return (
    <GameLayout noMaxWidth className="bg-slate-950 h-screen overflow-hidden">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row h-full w-full max-w-7xl mx-auto md:p-6 md:gap-8 relative">
        
        {/* --- LEFT PANEL (Desktop Sidebar / Mobile Header) --- */}
        <div className="flex flex-col md:w-1/3 lg:w-[350px] z-20 shrink-0">
          
          {/* Navigation Header */}
          <div className="flex items-center gap-4 mb-4 md:mb-6">
             <button 
               onClick={handleBack}
               className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
             >
               <ArrowLeft size={20} />
             </button>
             <div className="flex-1 min-w-0">
               <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider leading-none truncate">
                 Select Route
               </h2>
               <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Nairobi Region</p>
             </div>
             <div className="bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 hidden md:flex items-center gap-2">
               <Map size={14} className="text-matatu-yellow" />
               <span className="text-xs font-bold text-white">{MAPS.length}</span>
             </div>
          </div>

          {/* DESKTOP ONLY: Details Panel */}
          <div className="hidden md:flex flex-col flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
             
             {/* Background decoration */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-matatu-yellow/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

             {/* Selected Route Info */}
             <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                   <h1 className="font-display font-black text-3xl text-white uppercase leading-tight">
                     {activeRoute.name}
                   </h1>
                   {activeRoute.isLocked && <Lock size={24} className="text-slate-500 shrink-0" />}
                </div>
                <div className="flex gap-2 mb-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                     activeRoute.dangerLevel === 'Safe' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                     activeRoute.dangerLevel === 'Sketchy' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                     'border-red-500/30 text-red-400 bg-red-500/10'
                  }`}>
                    {activeRoute.dangerLevel}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-500/30 text-blue-400 bg-blue-500/10">
                    {activeRoute.trafficLevel} Traffic
                  </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-slate-700 pl-3">
                  {activeRoute.description}
                </p>
             </div>

             {/* Stats Grid Desktop */}
             <div className="space-y-3 mt-auto mb-8">
                 <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-3 text-slate-400">
                       <MapPin size={18} /> <span className="text-xs uppercase font-bold">Distance</span>
                    </div>
                    <span className="font-mono font-bold text-white">{activeRoute.distance} KM</span>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-3 text-slate-400">
                       <Clock size={18} /> <span className="text-xs uppercase font-bold">Est. Time</span>
                    </div>
                    <span className="font-mono font-bold text-white">{activeRoute.timeLimit}</span>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-3 text-slate-400">
                       <TrendingUp size={18} /> <span className="text-xs uppercase font-bold">Earnings</span>
                    </div>
                    <span className="font-mono font-bold text-green-400">KES {activeRoute.potentialEarnings}</span>
                 </div>
             </div>

             {/* Action Button Desktop */}
             <Button 
                variant={activeRoute.isLocked ? 'secondary' : 'primary'}
                size="lg"
                fullWidth
                disabled={activeRoute.isLocked}
                onClick={handleStartGame}
                className="shadow-xl"
             >
                {activeRoute.isLocked ? (
                   <span className="flex items-center gap-2"><Lock size={18}/> Locked Route</span>
                ) : (
                   <span className="flex items-center gap-2"><Navigation size={18}/> Start Engine</span>
                )}
             </Button>

          </div>
        </div>

        {/* --- RIGHT PANEL (Carousel) --- */}
        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          
          {/* Scroll Area */}
          <div 
            ref={scrollRef}
            className="flex-1 flex items-center overflow-x-auto hide-scrollbar snap-x snap-mandatory px-6 md:px-0 gap-6 md:gap-8 pb-32 md:pb-0 pt-4 md:pt-0"
            style={{ scrollBehavior: 'smooth' }}
          >
            {MAPS.map((map) => {
              const isSelected = selectedRoute?.id === map.id;
              const isLocked = map.isLocked;

              return (
                <div 
                  key={map.id}
                  onClick={() => !isLocked && selectRoute(map)}
                  className={`
                    relative shrink-0 w-[280px] md:w-[340px] aspect-[3/4] snap-center rounded-2xl overflow-hidden transition-all duration-300 group
                    flex flex-col border-2 select-none
                    ${isLocked 
                      ? 'bg-slate-900 border-slate-800 grayscale opacity-60 scale-95' 
                      : 'bg-slate-800 cursor-pointer shadow-2xl hover:scale-[1.02]'
                    }
                    ${isSelected 
                      ? 'border-matatu-yellow ring-4 ring-matatu-yellow/20 scale-[1.02] z-10' 
                      : 'border-slate-700 hover:border-slate-500'
                    }
                  `}
                >
                  {/* Card Visuals */}
                  <div className="h-1/2 bg-slate-900 relative w-full overflow-hidden">
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 opacity-50"></div>
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '16px 16px', opacity: 0.1 }}></div>
                    
                    {/* Abstract Map Lines */}
                    <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path 
                        d={`M10,90 C30,70 20,40 50,30 S90,10 90,10`} 
                        fill="none" 
                        stroke={isLocked ? '#334155' : isSelected ? '#FFD700' : '#64748b'} 
                        strokeWidth={isSelected ? 3 : 2} 
                        strokeLinecap="round"
                        strokeDasharray={isLocked ? "4 4" : "0"}
                        className="drop-shadow-lg transition-colors duration-300"
                      />
                      <circle cx="10" cy="90" r="3" fill="#10b981" />
                      <circle cx="90" cy="10" r="3" fill={isLocked ? "#64748b" : "#ef4444"} />
                    </svg>

                    {/* Status Badge */}
                    {isLocked ? (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                         <div className="flex flex-col items-center">
                            <div className="bg-slate-800 p-2 rounded-full border border-slate-600 mb-1">
                               <Lock size={20} className="text-slate-400" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Locked</span>
                         </div>
                       </div>
                    ) : (
                       <div className="absolute top-4 left-4">
                          <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                             <Shield size={10} /> VERIFIED
                          </span>
                       </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 p-5 flex flex-col bg-slate-800">
                    <div className="mb-2">
                      <h3 className={`font-display font-bold text-xl leading-tight mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {map.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin size={12} /> {map.distance}km
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <Car size={12} /> {map.trafficLevel}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 mb-4">
                      {map.description}
                    </p>

                    {/* Mini Stats (Mobile/Preview) */}
                    <div className="mt-auto grid grid-cols-2 gap-2">
                       <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50 text-center">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Reward</span>
                          <span className="text-green-400 font-mono text-sm font-bold">KES {map.potentialEarnings}</span>
                       </div>
                       <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50 text-center">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Time</span>
                          <span className="text-white font-mono text-sm font-bold">{map.timeLimit}</span>
                       </div>
                    </div>
                  </div>
                  
                  {/* Active Indicator */}
                  {isSelected && !isLocked && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-matatu-yellow animate-pulse"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* --- MOBILE ONLY: Fixed Bottom Sheet --- */}
          <div className="md:hidden absolute bottom-0 left-[-16px] right-[-16px] bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 p-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-30 transition-transform duration-300">
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="font-display font-bold text-lg text-white mb-1">{activeRoute.name}</h3>
                   <div className="flex gap-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                         <MapPin size={12} className="text-blue-400" /> {activeRoute.distance}km
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                         <TrendingUp size={12} className="text-green-400" /> KES {activeRoute.potentialEarnings}
                      </span>
                   </div>
                </div>
                {activeRoute.isLocked && <Lock className="text-slate-500" />}
             </div>
             
             <Button 
                variant={activeRoute.isLocked ? 'secondary' : 'primary'}
                fullWidth
                size="lg"
                disabled={activeRoute.isLocked}
                onClick={handleStartGame}
             >
                {activeRoute.isLocked ? 'Route Locked' : 'Start Drive'}
             </Button>
          </div>

        </div>

      </div>
    </GameLayout>
  );
};
