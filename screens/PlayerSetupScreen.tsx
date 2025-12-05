

import React, { useState } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { VehicleType } from '../types';
import { useGameStore } from '../store/gameStore';
import { User, Bus, CheckCircle2, Settings, AlertTriangle, Bike, Car, ShoppingCart, Zap, Shield, TrendingUp, ArrowLeft } from 'lucide-react';

export const PlayerSetupScreen: React.FC = () => {
  const { setVehicleType, setScreen, playerName, saccoName } = useGameStore();
  
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);

  const isProfileValid = playerName.trim().length > 0 && saccoName.trim().length > 0;
  const isFormValid = isProfileValid && selectedVehicle !== null;

  const handleContinue = () => {
    if (isFormValid) {
      setVehicleType(selectedVehicle!);
      setScreen('MAP_SELECT');
    }
  };

  const handleBack = () => {
    setScreen('LANDING');
  };

  const goToSettings = () => {
    setScreen('SETTINGS');
  };

  const vehicleOptions = [
    { 
      type: 'boda' as VehicleType, 
      name: 'The Boxer', 
      capacity: 1, 
      icon: <Bike size={24} className="text-orange-400" />,
      desc: 'High risk, high speed.',
      stats: { speed: 95, capacity: 10 },
      color: 'border-orange-500'
    },
    { 
      type: 'tuktuk' as VehicleType, 
      name: 'Keke Napep', 
      capacity: 3, 
      icon: <ShoppingCart size={24} className="text-yellow-400" />,
      desc: 'Slow but steady.',
      stats: { speed: 45, capacity: 20 },
      color: 'border-yellow-500'
    },
    { 
      type: 'personal-car' as VehicleType, 
      name: 'Uber Chap', 
      capacity: 4, 
      icon: <Car size={24} className="text-blue-400" />, 
      desc: 'Comfortable cruising.',
      stats: { speed: 85, capacity: 25 },
      color: 'border-blue-500'
    },
    { 
      type: '14-seater' as VehicleType, 
      name: 'The Shark', 
      capacity: 14, 
      icon: <Zap size={24} className="text-yellow-400" />,
      desc: 'Speed demon.',
      stats: { speed: 90, capacity: 45 },
      color: 'border-yellow-500'
    },
    { 
      type: '32-seater' as VehicleType, 
      name: 'The Rumble', 
      capacity: 32, 
      icon: <Shield size={24} className="text-blue-400" />,
      desc: 'Balanced reliability.',
      stats: { speed: 60, capacity: 70 },
      color: 'border-blue-500'
    },
    { 
      type: '52-seater' as VehicleType, 
      name: 'The Titan', 
      capacity: 52, 
      icon: <TrendingUp size={24} className="text-green-400" />,
      desc: 'Profit machine.',
      stats: { speed: 40, capacity: 100 },
      color: 'border-green-500'
    },
  ];

  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <div className="flex flex-col lg:flex-row h-full w-full max-w-7xl mx-auto md:p-6 lg:gap-8 relative">
        
        {/* --- LEFT PANEL: ID / PROFILE --- */}
        <div className="flex flex-col w-full lg:w-[320px] shrink-0 z-20 p-4 md:p-0 bg-slate-950 lg:bg-transparent sticky top-0">
          
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <button 
                  onClick={handleBack}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider leading-none">
                    Setup
                  </h2>
                </div>
             </div>
             
             <button 
               onClick={goToSettings}
               className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95"
             >
               <Settings size={16} />
             </button>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-xl space-y-4">
             {isProfileValid ? (
               <div className="space-y-3">
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Driver</label>
                    <div className="text-white font-display text-lg font-bold truncate">{playerName}</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">SACCO</label>
                    <div className="text-matatu-yellow font-display text-lg font-bold truncate">{saccoName}</div>
                  </div>
               </div>
             ) : (
               <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg text-center space-y-2">
                  <div className="flex justify-center">
                     <AlertTriangle className="text-red-500" size={20} />
                  </div>
                  <p className="text-red-200 text-xs font-bold">Profile Incomplete!</p>
                  <Button variant="secondary" fullWidth onClick={goToSettings} size="sm" className="text-xs">
                     Configure Profile
                  </Button>
               </div>
             )}
          </div>
          
          {/* Desktop Button */}
          <div className="hidden lg:block mt-6">
             <Button 
                size="lg" 
                fullWidth
                disabled={!isFormValid}
                onClick={handleContinue}
                className={isFormValid ? 'opacity-100' : 'opacity-50'}
              >
                {isProfileValid ? 'Start Shift' : 'Complete Profile'}
              </Button>
          </div>
        </div>

        {/* --- RIGHT PANEL: FLEET SELECTION --- */}
        <div className="flex-1 flex flex-col min-w-0 px-4 md:px-0 pb-24 lg:pb-0">
          <div className="mb-3 hidden lg:block">
             <h3 className="font-display text-lg font-bold text-white uppercase flex items-center gap-2">
                <Bus className="text-matatu-yellow" size={20} /> Select Vehicle
             </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {vehicleOptions.map((v) => {
              const isSelected = selectedVehicle === v.type;
              return (
                <div 
                  key={v.type}
                  onClick={() => setSelectedVehicle(v.type)}
                  className={`
                    relative cursor-pointer rounded-xl border-2 transition-all duration-200 overflow-hidden flex flex-row lg:flex-col items-center lg:items-stretch p-3 gap-4 lg:gap-2
                    ${isSelected 
                      ? `bg-slate-800 ${v.color} shadow-lg ring-1 ring-white/10` 
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 lg:top-2 lg:right-2">
                      <CheckCircle2 size={16} className="text-green-500" />
                    </div>
                  )}

                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border bg-slate-900/50 shrink-0
                    ${isSelected ? 'border-white/20' : 'border-slate-700'}
                  `}>
                    {v.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0 lg:text-center">
                    <h4 className="font-display font-bold text-base text-white truncate">{v.name}</h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">{v.type}</p>
                    <p className="text-xs text-slate-300 mt-1 lg:line-clamp-2">{v.desc}</p>
                  </div>
                  
                  <div className="lg:border-t lg:border-white/5 lg:pt-2 lg:mt-2 text-right lg:text-center shrink-0">
                     <span className="font-mono text-matatu-yellow font-bold text-sm">{v.capacity} Seats</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Sticky Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur border-t border-slate-800 z-50 lg:hidden">
             <Button 
               size="lg" 
               fullWidth={true}
               disabled={!isFormValid}
               onClick={handleContinue}
               className={isFormValid ? 'opacity-100' : 'opacity-50'}
             >
               {isProfileValid ? 'Start Shift' : 'Complete Profile'}
             </Button>
        </div>

      </div>
    </GameLayout>
  );
};