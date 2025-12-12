
import React, { useState } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { VehicleType } from '../types';
import { useGameStore, VEHICLE_SPECS } from '../store/gameStore';
import { CheckCircle2, Lock, ArrowLeft, Bike, ShoppingCart, Car, Zap, Shield, TrendingUp, Plus, TrendingDown, Hammer, Gauge, Fuel, Leaf } from 'lucide-react';
import { AuthGateModal } from '../components/ui/AuthGateModal';

export const VehicleSelectionScreen: React.FC = () => {
  const { setVehicleType, setScreen, bankBalance, userMode, unlockedVehicles, unlockVehicle, vehicleUpgrades, vehicleFuelUpgrades, vehiclePerformanceUpgrades, purchaseUpgrade, purchaseFuelUpgrade, purchasePerformanceUpgrade, getUpgradeCost, getFuelUpgradeCost, getPerformanceUpgradeCost } = useGameStore();
  
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Valid if vehicle selected AND vehicle is unlocked
  const isSelectionValid = selectedVehicle !== null && unlockedVehicles.includes(selectedVehicle);

  const handleContinue = () => {
    if (isSelectionValid) {
      setVehicleType(selectedVehicle!);
      setScreen('MAP_SELECT');
    }
  };

  const handleBack = () => {
    setScreen('GAME_MODE');
  };

  const handleUnlockAttempt = (type: VehicleType) => {
    if (userMode === 'GUEST') {
      setShowAuthGate(true);
      return;
    }
    unlockVehicle(type);
  };

  const handleOpenBank = () => {
      if (userMode === 'GUEST') {
          setShowAuthGate(true);
      } else {
          setScreen('BANK');
      }
  };

  const handleRouteUpgrade = (type: VehicleType) => {
      if (userMode === 'GUEST') {
          setShowAuthGate(true);
          return;
      }
      purchaseUpgrade(type);
  };

  const handleFuelUpgrade = (type: VehicleType) => {
      if (userMode === 'GUEST') {
          setShowAuthGate(true);
          return;
      }
      purchaseFuelUpgrade(type);
  };

  const handlePerformanceUpgrade = (type: VehicleType) => {
      if (userMode === 'GUEST') {
          setShowAuthGate(true);
          return;
      }
      purchasePerformanceUpgrade(type);
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
      <AuthGateModal 
        isOpen={showAuthGate} 
        onClose={() => setShowAuthGate(false)}
        featureName="Vehicle Purchase & Banking"
        message="You need a registered profile to access the bank, own new vehicles, and upgrade them."
      />

      <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:gap-8 relative">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 z-20">
             <button 
               onClick={handleBack}
               className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
             >
               <ArrowLeft size={20} />
             </button>
             <div className="flex-1">
               <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">
                 Select Vehicle
               </h2>
               <div className="flex items-center gap-2 mt-1">
                 <span className="text-slate-400 text-xs uppercase tracking-widest">Balance:</span>
                 <span className="text-green-400 font-mono font-bold text-xs">KES {bankBalance.toLocaleString()}</span>
                 <button onClick={handleOpenBank} className="bg-green-600 hover:bg-green-500 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center transition-colors shadow-lg ml-1" title="Get Cash">
                    <Plus size={14} />
                 </button>
               </div>
             </div>
        </div>

        {/* --- GRID --- */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0 px-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicleOptions.map((v) => {
              const isSelected = selectedVehicle === v.type;
              const isUnlocked = unlockedVehicles.includes(v.type);
              const price = VEHICLE_SPECS[v.type].price;
              const canAfford = bankBalance >= price;
              
              // Route Optimization Logic
              const routeLevel = vehicleUpgrades[v.type] || 0;
              const routeUpgradeCost = getUpgradeCost(v.type, routeLevel);
              const canAffordRouteUpgrade = bankBalance >= routeUpgradeCost;
              const isRouteMaxed = routeLevel >= 4;

              // Fuel Upgrade Logic
              const fuelLevel = vehicleFuelUpgrades[v.type] || 0;
              const fuelUpgradeCost = getFuelUpgradeCost(v.type, fuelLevel);
              const canAffordFuelUpgrade = bankBalance >= fuelUpgradeCost;
              const isFuelMaxed = fuelLevel >= 4;

              // Performance Upgrade Logic
              const perfLevel = vehiclePerformanceUpgrades[v.type] || 0;
              const perfUpgradeCost = getPerformanceUpgradeCost(v.type, perfLevel);
              const canAffordPerfUpgrade = bankBalance >= perfUpgradeCost;
              const isPerfMaxed = perfLevel >= 4;

              return (
                <div 
                  key={v.type}
                  onClick={() => setSelectedVehicle(v.type)}
                  className={`
                    relative cursor-pointer rounded-2xl border-2 transition-all duration-200 overflow-hidden flex flex-col p-4 gap-3 group min-h-[180px]
                    ${isSelected 
                      ? `bg-slate-800 ${v.color} shadow-[0_0_30px_rgba(0,0,0,0.5)] scale-[1.02] ring-1 ring-white/10` 
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800'
                    }
                    ${!isUnlocked && !isSelected ? 'opacity-70 grayscale hover:grayscale-0' : ''}
                  `}
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-start">
                     {isUnlocked ? (
                        <div className="flex gap-2 w-full justify-between">
                            {isSelected ? (
                                <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Ready
                                </div>
                            ) : <div className="h-6"></div>}
                        </div>
                     ) : (
                        <div className="bg-slate-950/80 px-2 py-1 rounded text-slate-400 border border-slate-700 flex items-center gap-1">
                           <Lock size={12} />
                           <span className="text-[10px] font-bold uppercase">Locked</span>
                        </div>
                     )}
                     
                     {!isUnlocked && (
                         <span className="font-mono text-matatu-yellow font-bold text-xs bg-black/40 px-2 py-1 rounded">
                             {v.capacity} Seats
                         </span>
                     )}
                  </div>

                  {/* Content */}
                  <div className="flex items-center gap-4 mt-2">
                     <div className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner shrink-0
                        ${isSelected ? 'bg-slate-900 border-white/20' : 'bg-slate-950/50 border-slate-700'}
                     `}>
                        {v.icon}
                     </div>
                     <div className="min-w-0">
                        <h4 className="font-display font-bold text-lg text-white truncate">{v.name}</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{v.type.replace('-', ' ')}</p>
                        {isUnlocked ? (
                            <p className="text-xs text-slate-300 mt-1">{v.desc}</p>
                        ) : null}
                     </div>
                  </div>
                  
                  {/* Footer / Upgrades */}
                  <div className="mt-auto pt-3 border-t border-white/5">
                     {isUnlocked ? (
                        <div className="space-y-3">
                           
                           {/* 1. Route Optimization Upgrade */}
                           <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-700">
                               <div className="flex justify-between items-center mb-1">
                                   <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><Gauge size={10} /> Optimization</span>
                                   <span className="text-[10px] font-bold text-green-400">+{routeLevel * 15}%</span>
                               </div>
                               
                               <div className="flex gap-1 mb-2">
                                   {[1,2,3,4].map(lvl => (
                                       <div key={lvl} className={`h-1.5 flex-1 rounded-full ${lvl <= routeLevel ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                                   ))}
                               </div>

                               {!isRouteMaxed && isSelected && (
                                   <Button 
                                      size="sm" 
                                      fullWidth
                                      variant={canAffordRouteUpgrade ? 'outline' : 'secondary'}
                                      className="py-1 text-[10px] h-8 whitespace-nowrap"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          if (!canAffordRouteUpgrade) handleOpenBank();
                                          else handleRouteUpgrade(v.type);
                                      }}
                                   >
                                      {canAffordRouteUpgrade 
                                        ? `Upgrade (Lv ${routeLevel + 1}) - KES ${routeUpgradeCost.toLocaleString()}` 
                                        : `KES ${routeUpgradeCost.toLocaleString()} (Add Funds)`
                                      }
                                   </Button>
                               )}
                               {isRouteMaxed && (
                                   <div className="text-center text-[10px] text-matatu-yellow font-bold uppercase tracking-widest py-1">Max Level Reached</div>
                               )}
                           </div>

                           {/* 2. Fuel Efficiency Upgrade */}
                           <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-700">
                               <div className="flex justify-between items-center mb-1">
                                   <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><Fuel size={10} /> Eco-Tuning</span>
                                   <span className="text-[10px] font-bold text-orange-400">+{fuelLevel * 15}%</span>
                               </div>
                               
                               <div className="flex gap-1 mb-2">
                                   {[1,2,3,4].map(lvl => (
                                       <div key={lvl} className={`h-1.5 flex-1 rounded-full ${lvl <= fuelLevel ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
                                   ))}
                               </div>

                               {!isFuelMaxed && isSelected && (
                                   <Button 
                                      size="sm" 
                                      fullWidth
                                      variant={canAffordFuelUpgrade ? 'outline' : 'secondary'}
                                      className={`py-1 text-[10px] h-8 whitespace-nowrap ${canAffordFuelUpgrade ? 'border-orange-500 text-orange-500 hover:bg-orange-900/20' : ''}`}
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          if (!canAffordFuelUpgrade) handleOpenBank();
                                          else handleFuelUpgrade(v.type);
                                      }}
                                   >
                                      {canAffordFuelUpgrade 
                                        ? `Tune (Lv ${fuelLevel + 1}) - KES ${fuelUpgradeCost.toLocaleString()}` 
                                        : `KES ${fuelUpgradeCost.toLocaleString()} (Add Funds)`
                                      }
                                   </Button>
                               )}
                               {isFuelMaxed && (
                                   <div className="text-center text-[10px] text-orange-400 font-bold uppercase tracking-widest py-1">Max Tuned</div>
                               )}
                           </div>

                           {/* 3. Performance (Speed) Upgrade */}
                           <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-700">
                               <div className="flex justify-between items-center mb-1">
                                   <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><Zap size={10} /> Performance</span>
                                   <span className="text-[10px] font-bold text-cyan-400">+{perfLevel * 15}%</span>
                               </div>
                               
                               <div className="flex gap-1 mb-2">
                                   {[1,2,3,4].map(lvl => (
                                       <div key={lvl} className={`h-1.5 flex-1 rounded-full ${lvl <= perfLevel ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                                   ))}
                               </div>

                               {!isPerfMaxed && isSelected && (
                                   <Button 
                                      size="sm" 
                                      fullWidth
                                      variant={canAffordPerfUpgrade ? 'outline' : 'secondary'}
                                      className={`py-1 text-[10px] h-8 whitespace-nowrap ${canAffordPerfUpgrade ? 'border-cyan-500 text-cyan-500 hover:bg-cyan-900/20' : ''}`}
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          if (!canAffordPerfUpgrade) handleOpenBank();
                                          else handlePerformanceUpgrade(v.type);
                                      }}
                                   >
                                      {canAffordPerfUpgrade 
                                        ? `Tune (Lv ${perfLevel + 1}) - KES ${perfUpgradeCost.toLocaleString()}` 
                                        : `KES ${perfUpgradeCost.toLocaleString()} (Add Funds)`
                                      }
                                   </Button>
                               )}
                               {isPerfMaxed && (
                                   <div className="text-center text-[10px] text-cyan-400 font-bold uppercase tracking-widest py-1">Max Power</div>
                               )}
                           </div>

                           {isSelected && <span className="text-xs text-white animate-pulse font-bold block text-center mt-2">Tap 'Confirm' below</span>}
                        </div>
                     ) : (
                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 uppercase font-bold">Price</span>
                              <span className="text-white font-bold font-mono">KES {price.toLocaleString()}</span>
                           </div>
                           
                           {isSelected && (
                              <Button 
                                 size="sm" 
                                 fullWidth 
                                 variant={userMode === 'GUEST' ? 'secondary' : canAfford ? 'primary' : 'outline'}
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canAfford && userMode !== 'GUEST') {
                                        handleOpenBank();
                                    } else {
                                        handleUnlockAttempt(v.type);
                                    }
                                 }}
                              >
                                 {userMode === 'GUEST' ? 'Login to Buy' : canAfford ? 'Buy Vehicle' : 'Get Funds (Bank)'}
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

        {/* Desktop Next Button */}
        <div className="hidden lg:block mt-4">
             <Button 
                size="lg" 
                fullWidth
                disabled={!isSelectionValid}
                onClick={handleContinue}
                className={isSelectionValid ? 'opacity-100' : 'opacity-50'}
              >
                {isSelectionValid ? 'Confirm Vehicle' : 'Select a Vehicle'}
              </Button>
        </div>

        {/* Mobile Sticky Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur border-t border-slate-800 z-50 lg:hidden">
             <Button 
               size="lg" 
               fullWidth={true}
               disabled={!isSelectionValid}
               onClick={handleContinue}
               className={isSelectionValid ? 'opacity-100' : 'opacity-50'}
             >
               {isSelectionValid ? 'Confirm Vehicle' : 'Select a Vehicle'}
             </Button>
        </div>

      </div>
    </GameLayout>
  );
};
