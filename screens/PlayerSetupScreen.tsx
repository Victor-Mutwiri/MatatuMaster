
import React, { useState } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { VehicleType } from '../types';
import { useGameStore } from '../store/gameStore';
import { User, Users, Bus, Zap, Shield, TrendingUp, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const PlayerSetupScreen: React.FC = () => {
  const { setPlayerInfo, setVehicleType, setScreen } = useGameStore();
  
  const [name, setName] = useState('');
  const [sacco, setSacco] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);

  const isFormValid = name.trim().length > 0 && sacco.trim().length > 0 && selectedVehicle !== null;

  const handleContinue = () => {
    if (isFormValid) {
      setPlayerInfo(name, sacco);
      setVehicleType(selectedVehicle!);
      setScreen('MAP_SELECT');
    }
  };

  const handleBack = () => {
    setScreen('LANDING');
  };

  const vehicleOptions = [
    { 
      type: '14-seater' as VehicleType, 
      name: 'The Shark', 
      capacity: 14, 
      icon: <Zap size={32} className="text-yellow-400" />,
      desc: 'Speed demon of the streets.',
      stats: { speed: 90, capacity: 30, cost: 'Low' },
      color: 'border-yellow-500'
    },
    { 
      type: '32-seater' as VehicleType, 
      name: 'The Rumble', 
      capacity: 32, 
      icon: <Shield size={32} className="text-blue-400" />,
      desc: 'Balanced reliability.',
      stats: { speed: 60, capacity: 60, cost: 'Med' },
      color: 'border-blue-500'
    },
    { 
      type: '52-seater' as VehicleType, 
      name: 'The Titan', 
      capacity: 52, 
      icon: <TrendingUp size={32} className="text-green-400" />,
      desc: 'Maximum profit machine.',
      stats: { speed: 40, capacity: 100, cost: 'High' },
      color: 'border-green-500'
    },
  ];

  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <div className="flex flex-col lg:flex-row min-h-screen w-full max-w-7xl mx-auto p-4 md:p-6 gap-6 lg:gap-12 relative pb-28 lg:pb-6">
        
        {/* --- LEFT PANEL: ID / PROFILE --- */}
        <div className="flex flex-col w-full lg:w-[380px] shrink-0 z-20">
          
          {/* Header & Back */}
          <div className="flex items-center gap-4 mb-4 md:mb-6">
             <button 
               onClick={handleBack}
               className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
             >
               <ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="font-display text-xl md:text-2xl font-bold text-white uppercase tracking-wider leading-none">
                 New Conductor
               </h2>
               <p className="text-slate-400 text-[10px] md:text-xs uppercase tracking-widest mt-1">Registration</p>
             </div>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 md:p-6 shadow-2xl space-y-6">
            
             <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-matatu-yellow uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <User size={14} /> Name / Alias
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kevo Ma-Coin"
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg p-3 md:p-4 text-white text-base md:text-lg placeholder-slate-600 focus:outline-none focus:border-matatu-yellow focus:bg-slate-800/50 transition-all"
                  />
               </div>

               <div>
                  <label className="text-[10px] font-bold text-matatu-yellow uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <Users size={14} /> SACCO
                  </label>
                  <input 
                    type="text" 
                    value={sacco}
                    onChange={(e) => setSacco(e.target.value)}
                    placeholder="e.g. Super Metro"
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg p-3 md:p-4 text-white text-base md:text-lg placeholder-slate-600 focus:outline-none focus:border-matatu-yellow focus:bg-slate-800/50 transition-all"
                  />
               </div>
             </div>

             {/* ID Card Visual (Hidden on mobile to save space, visible on tablet+) */}
             <div className="hidden sm:block pt-6 border-t border-slate-800 opacity-50">
                <div className="flex gap-4 items-center">
                   <div className="w-16 h-16 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
                      <User size={32} className="text-slate-600"/>
                   </div>
                   <div className="space-y-2 w-full">
                      <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
                      <div className="h-2 w-1/2 bg-slate-800 rounded"></div>
                   </div>
                </div>
             </div>

          </div>
        </div>

        {/* --- RIGHT PANEL: FLEET SELECTION --- */}
        <div className="flex-1 flex flex-col min-w-0">
          
          <div className="mb-4">
             <h3 className="font-display text-lg md:text-xl font-bold text-white uppercase flex items-center gap-2">
                <Bus className="text-matatu-yellow" size={24} /> Select Vehicle
             </h3>
             <p className="text-slate-400 text-sm">Choose your daily driver.</p>
          </div>

          {/* Grid Layout: 1 col mobile, 2 col tablet, 2/3 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
            {vehicleOptions.map((v) => {
              const isSelected = selectedVehicle === v.type;
              return (
                <div 
                  key={v.type}
                  onClick={() => setSelectedVehicle(v.type)}
                  className={`
                    group relative cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col
                    ${isSelected 
                      ? `bg-slate-800 ${v.color} shadow-[0_0_30px_rgba(0,0,0,0.5)] scale-[1.02] ring-2 ring-white/10 z-10` 
                      : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-600'
                    }
                  `}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-green-500 text-black rounded-full p-1 shadow-lg">
                        <CheckCircle2 size={16} strokeWidth={3} />
                      </div>
                    </div>
                  )}

                  <div className="p-5 md:p-6 flex flex-col items-center text-center space-y-4 flex-1">
                    <div className={`
                      w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 bg-slate-900/50
                      ${isSelected ? 'border-white/20' : 'border-slate-700 group-hover:border-slate-500'}
                    `}>
                      {v.icon}
                    </div>
                    
                    <div>
                      <h4 className="font-display font-bold text-lg md:text-xl text-white">{v.name}</h4>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">{v.type}</p>
                    </div>

                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                      {v.desc}
                    </p>

                    {/* Stats Bars */}
                    <div className="w-full space-y-2 mt-4 pt-4 border-t border-white/5">
                       <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                          <span className="w-12 text-right">Speed</span>
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-slate-400" style={{ width: `${v.stats.speed}%` }}></div>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                          <span className="w-12 text-right">Seats</span>
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-slate-400" style={{ width: `${v.stats.capacity}%` }}></div>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="bg-black/20 p-3 text-center border-t border-white/5">
                     <span className="font-mono text-matatu-yellow font-bold text-base md:text-lg">{v.capacity} PAX</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Button: Inline at bottom right */}
          <div className="hidden lg:flex justify-end mt-4">
             <Button 
                size="lg" 
                disabled={!isFormValid}
                onClick={handleContinue}
                className={`
                   min-w-[200px] shadow-2xl transition-all duration-500
                   ${isFormValid ? 'opacity-100 translate-y-0' : 'opacity-50'}
                `}
              >
                Confirm Profile
              </Button>
          </div>

        </div>

        {/* Mobile/Tablet Button: Sticky Bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-40 lg:hidden">
             <Button 
               size="lg" 
               fullWidth={true}
               disabled={!isFormValid}
               onClick={handleContinue}
               className={`
                  shadow-2xl transition-all duration-500
                  ${isFormValid ? 'opacity-100 translate-y-0' : 'opacity-50'}
               `}
             >
               Confirm Profile
             </Button>
        </div>

      </div>
    </GameLayout>
  );
};
