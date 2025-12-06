
import React, { useState } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { VehicleType } from '../types';
import { useGameStore, VEHICLE_SPECS } from '../store/gameStore';
import { User, Bus, CheckCircle2, Settings, AlertTriangle, Bike, Car, ShoppingCart, Zap, Shield, TrendingUp, ArrowLeft, Wallet, Lock, UserPlus } from 'lucide-react';

export const PlayerSetupScreen: React.FC = () => {
  const { setVehicleType, setScreen, playerName, saccoName, bankBalance, userMode, unlockedVehicles, unlockVehicle, registerUser } = useGameStore();
  
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);

  const isProfileValid = playerName.trim().length > 0 && saccoName.trim().length > 0;
  // Valid if profile is set AND vehicle selected AND vehicle is unlocked
  const isFormValid = isProfileValid && selectedVehicle !== null && unlockedVehicles.includes(selectedVehicle);

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

  const handleUnlockAttempt = (type: VehicleType) => {
    if (userMode === 'GUEST') {
      alert("You must Register an Account to buy vehicles!");
      return;
    }
    unlockVehicle(type);
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
                  <div className="flex justify-between items-start">
                     <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex-1 mr-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Driver</label>
                       <div className="text-white font-display text-lg font-bold truncate">{playerName}</div>
                     </div>
                     <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 w-16 flex items-center justify-center">
                        <span className={`text-2xl font-bold ${userMode === 'REGISTERED' ? 'text-green-500' : 'text-slate-500'}`}>
                           {userMode === 'REGISTERED' ? '✓' : '?'}
                        </span>
                     </div>
                  </div>
                  
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">SACCO</label>
                    <div className="text-matatu-yellow font-display text-lg font-bold truncate">{saccoName}</div>
                  </div>
                  
                  {/* Total Wealth Card */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-3 rounded-lg border border-green-500/30 relative overflow-hidden group">
                     <div className="absolute right-[-10px] top-[-10px] bg-green-500/10 w-20 h-20 rounded-full blur-xl group-hover:bg-green-500/20 transition-all"></div>
                     <label className="text-[10px] font-bold text-green-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Wallet size={12} /> Cash
                     </label>
                     <div className="text-white font-mono text-xl font-bold truncate">
                        KES {bankBalance.toLocaleString()}
                     </div>
                     {userMode === 'GUEST' && (
                        <div className="text-[10px] text-red-400 mt-1 font-bold">
                           * Not saving to cloud (Guest)
                        </div>
                     )}
                  </div>
                  
                  {/* Register Button for Guests */}
                  {userMode === 'GUEST' && (
                     <Button 
                        variant="primary" 
                        fullWidth 
                        size="sm" 
                        onClick={registerUser}
                        className="animate-pulse"
                     >
                        <span className="flex items-center justify-center gap-2">
                           <UserPlus size={16} /> Register Account
                        </span>
                     </Button>
                  )}

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
          
          {/* Desktop Start Button */}
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
              const isUnlocked = unlockedVehicles.includes(v.type);
              const price = VEHICLE_SPECS[v.type].price;
              const canAfford = bankBalance >= price;

              return (
                <div 
                  key={v.type}
                  onClick={() => setSelectedVehicle(v.type)}
                  className={`
                    relative cursor-pointer rounded-xl border-2 transition-all duration-200 overflow-hidden flex flex-col p-3 gap-2 group
                    ${isSelected 
                      ? `bg-slate-800 ${v.color} shadow-lg ring-1 ring-white/10` 
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800'
                    }
                    ${!isUnlocked && !isSelected ? 'opacity-70 grayscale hover:grayscale-0' : ''}
                  `}
                >
                  {/* Status Badges */}
                  <div className="flex justify-between items-start">
                     {isUnlocked ? (
                        isSelected && (
                           <div className="bg-green-500/20 text-green-400 p-1 rounded-full">
                              <CheckCircle2 size={16} />
                           </div>
                        )
                     ) : (
                        <div className="bg-slate-900/80 p-1.5 rounded-md flex items-center gap-1 text-slate-400 border border-slate-700">
                           <Lock size={12} />
                           <span className="text-[10px] font-bold uppercase">Locked</span>
                        </div>
                     )}
                     <div className="text-right ml-auto">
                        <span className="font-mono text-matatu-yellow font-bold text-xs bg-black/20 px-2 py-0.5 rounded">
                           {v.capacity} Seats
                        </span>
                     </div>
                  </div>

                  {/* Icon & Details */}
                  <div className="flex items-center gap-3 mt-1">
                     <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center border bg-slate-900/50 shrink-0
                        ${isSelected ? 'border-white/20' : 'border-slate-700'}
                     `}>
                        {v.icon}
                     </div>
                     <div className="min-w-0">
                        <h4 className="font-display font-bold text-base text-white truncate">{v.name}</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{v.type}</p>
                     </div>
                  </div>
                  
                  <p className="text-xs text-slate-300 line-clamp-2 min-h-[2.5em]">{v.desc}</p>
                  
                  {/* Footer Action */}
                  <div className="mt-auto pt-2 border-t border-white/5">
                     {isUnlocked ? (
                        <div className="text-xs text-green-400 font-bold uppercase flex items-center gap-1">
                           <CheckCircle2 size={12} /> Owned
                        </div>
                     ) : (
                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">Price</span>
                              <span className="text-white font-bold font-mono">KES {price.toLocaleString()}</span>
                           </div>
                           
                           {isSelected && (
                              <Button 
                                 size="sm" 
                                 fullWidth 
                                 variant={userMode === 'GUEST' ? 'secondary' : canAfford ? 'primary' : 'outline'}
                                 disabled={userMode !== 'GUEST' && !canAfford}
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlockAttempt(v.type);
                                 }}
                              >
                                 {userMode === 'GUEST' ? 'Login to Buy' : canAfford ? 'Buy Vehicle' : 'Insufficient Funds'}
                              </Button>
                           )}
                        </div>
                     )}
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
