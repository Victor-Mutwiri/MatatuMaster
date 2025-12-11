
import React, { useState } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { VehicleType } from '../types';
import { useGameStore, VEHICLE_SPECS, UPGRADE_COSTS } from '../store/gameStore';
import { CheckCircle2, Lock, ArrowLeft, Bike, ShoppingCart, Car, Zap, Shield, TrendingUp, Wallet, Wrench, X, TrendingDown, Gauge, FileCheck, Coins } from 'lucide-react';
import { AuthGateModal } from '../components/ui/AuthGateModal';

// --- UPGRADE MODAL ---
const UpgradeModal = ({ selectedVehicle, onClose }: { selectedVehicle: VehicleType | null, onClose: () => void }) => {
    const { bankBalance, vehicleUpgrades, purchaseUpgrade } = useGameStore();
    
    if (!selectedVehicle) return null;
    
    // Defensive check: ensure upgrades exist
    const upgrades = (vehicleUpgrades && vehicleUpgrades[selectedVehicle]) 
        ? vehicleUpgrades[selectedVehicle] 
        : { engineLevel: 0, licenseLevel: 0, suspensionLevel: 0 };
    
    const renderUpgradeRow = (title: string, icon: React.ReactNode, type: 'engine' | 'license' | 'suspension', level: number, desc: string) => {
        const isMax = level >= 3;
        const cost = !isMax ? UPGRADE_COSTS[type][level] : 0;
        const canAfford = bankBalance >= cost;

        return (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isMax ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-300'}`}>
                            {icon}
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">{title}</h4>
                            <p className="text-[10px] text-slate-400">{desc}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase font-bold">Level</div>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-2 h-4 rounded-sm ${i <= level ? 'bg-matatu-yellow' : 'bg-slate-700'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {!isMax ? (
                    <button 
                      onClick={() => purchaseUpgrade(selectedVehicle, type)}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-lg font-bold text-xs flex justify-between items-center px-4 transition-all ${canAfford ? 'bg-slate-700 hover:bg-matatu-yellow hover:text-black text-white' : 'bg-slate-900 text-slate-500 cursor-not-allowed'}`}
                    >
                        <span>Upgrade</span>
                        <span className={`${canAfford ? 'text-green-400' : 'text-red-500'}`}>KES {cost.toLocaleString()}</span>
                    </button>
                ) : (
                    <div className="w-full py-2 bg-green-900/30 text-green-400 text-center rounded-lg text-xs font-bold uppercase border border-green-900/50">
                        Maxed Out
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-slate-900 border-2 border-slate-600 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <div>
                        <h3 className="font-display font-bold text-xl text-white uppercase">{selectedVehicle.replace('-', ' ')}</h3>
                        <p className="text-xs text-slate-400">Customization Shop</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="p-4 overflow-y-auto space-y-4">
                    {renderUpgradeRow("Turbo Tuning", <Gauge size={20}/>, 'engine', upgrades.engineLevel, "Boosts Top Speed +15% per level.")}
                    {renderUpgradeRow("Route Permit", <FileCheck size={20}/>, 'license', upgrades.licenseLevel, "Increases Max Earnings +20% per level.")}
                    {renderUpgradeRow("Suspension", <TrendingDown size={20}/>, 'suspension', upgrades.suspensionLevel, "Reduces happiness penalty on rough roads.")}
                </div>

                <div className="p-4 bg-slate-950 border-t border-slate-800">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Balance:</span>
                        <span className="text-green-400 font-mono font-bold">KES {bankBalance.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    )
};

// --- BANK MODAL ---
const BankModal = ({ onClose }: { onClose: () => void }) => {
    const { buyGameCash } = useGameStore();
    const packages = [
        { amount: 20000, cost: 20, tag: 'Starter' },
        { amount: 50000, cost: 50, tag: 'Popular' },
        { amount: 150000, cost: 100, tag: 'Best Value' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-slate-900 border-2 border-matatu-yellow w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="p-6 text-center border-b border-slate-800 bg-slate-950 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-matatu-yellow animate-pulse"></div>
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-700">
                        <Wallet className="text-green-400" size={32} />
                    </div>
                    <h3 className="font-display font-black text-2xl text-white uppercase tracking-tighter">M-Pesa Top Up</h3>
                    <p className="text-xs text-slate-400 mt-1">Instant Game Cash Deposit</p>
                </div>

                <div className="p-6 space-y-3">
                    {packages.map((pkg, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                              buyGameCash(pkg.amount, pkg.cost);
                              onClose();
                          }}
                          className="w-full flex justify-between items-center p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all group active:scale-95"
                        >
                            <div className="text-left">
                                <div className="text-xs font-bold text-matatu-yellow uppercase mb-1">{pkg.tag}</div>
                                <div className="font-display font-bold text-xl text-white group-hover:text-green-400 transition-colors flex items-center gap-2">
                                    <Coins size={18} /> {pkg.amount.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
                                Ksh {pkg.cost}
                            </div>
                        </button>
                    ))}
                </div>
                
                <div className="p-4 text-center">
                    <button onClick={onClose} className="text-slate-500 text-xs hover:text-white">Cancel Transaction</button>
                </div>
            </div>
        </div>
    )
}

export const VehicleSelectionScreen: React.FC = () => {
  const { setVehicleType, setScreen, bankBalance, userMode, unlockedVehicles, unlockVehicle, vehicleUpgrades } = useGameStore();
  
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

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

  const vehicleOptions = [
    { 
      type: 'boda' as VehicleType, 
      name: 'The Boxer', 
      capacity: 1, 
      icon: <Bike size={24} className="text-orange-400" />,
      desc: 'High risk, high speed.',
      color: 'border-orange-500'
    },
    { 
      type: 'tuktuk' as VehicleType, 
      name: 'Keke Napep', 
      capacity: 3, 
      icon: <ShoppingCart size={24} className="text-yellow-400" />,
      desc: 'Slow but steady.',
      color: 'border-yellow-500'
    },
    { 
      type: 'personal-car' as VehicleType, 
      name: 'Uber Chap', 
      capacity: 4, 
      icon: <Car size={24} className="text-blue-400" />, 
      desc: 'Comfortable cruising.',
      color: 'border-blue-500'
    },
    { 
      type: '14-seater' as VehicleType, 
      name: 'The Shark', 
      capacity: 14, 
      icon: <Zap size={24} className="text-yellow-400" />,
      desc: 'Speed demon.',
      color: 'border-yellow-500'
    },
    { 
      type: '32-seater' as VehicleType, 
      name: 'The Rumble', 
      capacity: 32, 
      icon: <Shield size={24} className="text-blue-400" />,
      desc: 'Balanced reliability.',
      color: 'border-blue-500'
    },
    { 
      type: '52-seater' as VehicleType, 
      name: 'The Titan', 
      capacity: 52, 
      icon: <TrendingUp size={24} className="text-green-400" />,
      desc: 'Profit machine.',
      color: 'border-green-500'
    },
  ];

  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <AuthGateModal 
        isOpen={showAuthGate} 
        onClose={() => setShowAuthGate(false)}
        featureName="Vehicle Purchase"
        message="You need a registered profile to purchase and own new vehicles."
      />

      {showUpgradeModal && <UpgradeModal selectedVehicle={selectedVehicle} onClose={() => setShowUpgradeModal(false)} />}
      {showBankModal && <BankModal onClose={() => setShowBankModal(false)} />}

      <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:gap-8 relative">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 z-20">
             <button 
               onClick={handleBack}
               className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
             >
               <ArrowLeft size={20} />
             </button>
             <div className="flex-1 flex justify-between items-center">
               <div>
                   <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">
                     Select Vehicle
                   </h2>
                   <p className="text-slate-400 text-xs mt-1">Tap card to select</p>
               </div>
               
               {/* Bank Balance Widget */}
               <button 
                 onClick={() => setShowBankModal(true)}
                 className="flex flex-col items-end bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-green-500 transition-colors group"
               >
                   <span className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-green-400">Add Cash +</span>
                   <span className="text-green-400 font-mono font-bold text-sm">KES {bankBalance.toLocaleString()}</span>
               </button>
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

              // Defensive upgrade check
              const upgrades = (vehicleUpgrades && vehicleUpgrades[v.type]) ? vehicleUpgrades[v.type] : { engineLevel: 0, licenseLevel: 0 };
              const speedBoost = Math.round(VEHICLE_SPECS[v.type].maxSpeedKmh * (1 + (upgrades.engineLevel * 0.15)));

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
                     <div className="min-w-0 flex-1">
                        <h4 className="font-display font-bold text-lg text-white truncate">{v.name}</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{v.type.replace('-', ' ')}</p>
                        
                        {isUnlocked ? (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="bg-black/30 px-2 py-1 rounded text-[10px] text-slate-300 font-mono">
                                    {speedBoost} KM/H
                                </div>
                                {upgrades.engineLevel > 0 && <span className="text-[10px] text-matatu-yellow font-bold">+Turbo</span>}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-300 mt-1">{v.desc}</p>
                        )}
                     </div>
                  </div>
                  
                  {/* Footer Action */}
                  <div className="mt-auto pt-3 border-t border-white/5">
                     {isUnlocked ? (
                        <div className="flex gap-2">
                           {/* Only allow customize if selected */}
                           {isSelected ? (
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 fullWidth 
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     setShowUpgradeModal(true);
                                 }}
                                 className="border-slate-600 hover:border-matatu-yellow text-xs"
                               >
                                   <Wrench size={14} className="mr-1" /> Customize
                               </Button>
                           ) : (
                               <div className="w-full text-center py-2 text-xs text-slate-500">Tap to Select</div>
                           )}
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
