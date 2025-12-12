
import React from 'react';
import { useGameStore, VEHICLE_SPECS } from '../../store/gameStore';
import { VehicleType } from '../../types';
import { X, Zap, Fuel, Gauge, CheckCircle2, ArrowUpCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface VehicleUpgradeModalProps {
  vehicleType: VehicleType;
  onClose: () => void;
}

export const VehicleUpgradeModal: React.FC<VehicleUpgradeModalProps> = ({ vehicleType, onClose }) => {
  const { 
    bankBalance, 
    vehicleUpgrades, 
    vehicleFuelUpgrades, 
    vehiclePerformanceUpgrades,
    purchaseUpgrade,
    purchaseFuelUpgrade,
    purchasePerformanceUpgrade,
    getUpgradeCost,
    getFuelUpgradeCost,
    getPerformanceUpgradeCost,
    handleOpenBank,
    formatCurrency
  } = useGameStore(state => ({
    bankBalance: state.bankBalance,
    vehicleUpgrades: state.vehicleUpgrades,
    vehicleFuelUpgrades: state.vehicleFuelUpgrades,
    vehiclePerformanceUpgrades: state.vehiclePerformanceUpgrades,
    purchaseUpgrade: state.purchaseUpgrade,
    purchaseFuelUpgrade: state.purchaseFuelUpgrade,
    purchasePerformanceUpgrade: state.purchasePerformanceUpgrade,
    getUpgradeCost: state.getUpgradeCost,
    getFuelUpgradeCost: state.getFuelUpgradeCost,
    getPerformanceUpgradeCost: state.getPerformanceUpgradeCost,
    handleOpenBank: () => state.setScreen('BANK'),
    formatCurrency: state.formatCurrency
  }));

  const vehicleName = VEHICLE_SPECS[vehicleType] ? vehicleType.replace('-', ' ') : 'Vehicle';

  // --- Helpers for rendering upgrade rows ---
  
  const renderUpgradeRow = (
    title: string,
    icon: React.ReactNode,
    level: number,
    cost: number,
    colorClass: string, // e.g., 'text-green-400'
    bgClass: string,    // e.g., 'bg-green-500'
    onUpgrade: () => void,
    statDescription: string
  ) => {
    const isMaxed = level >= 4;
    const canAfford = bankBalance >= cost;
    
    return (
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
         <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg bg-slate-800 border border-slate-600 ${colorClass}`}>
                  {icon}
               </div>
               <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-wide">{title}</h4>
                  <p className="text-slate-400 text-xs">{statDescription}</p>
               </div>
            </div>
            <div className="text-right">
               <div className={`font-display font-bold text-lg ${colorClass}`}>
                  +{level * 15}%
               </div>
               <div className="text-[10px] text-slate-500 uppercase tracking-wider">Current Boost</div>
            </div>
         </div>

         {/* Progress Bar */}
         <div className="flex gap-1 h-2 bg-slate-800 rounded-full overflow-hidden">
             {[1, 2, 3, 4].map(step => (
                 <div key={step} className={`flex-1 rounded-full transition-all duration-500 ${step <= level ? bgClass : 'bg-slate-700/50'}`}></div>
             ))}
         </div>

         {/* Action Button */}
         <div className="mt-1">
            {isMaxed ? (
                <div className={`w-full py-2 text-center text-xs font-bold uppercase tracking-widest border border-dashed border-slate-600 rounded text-slate-500`}>
                    <CheckCircle2 size={14} className="inline mr-1" /> Max Level Reached
                </div>
            ) : (
                <Button 
                   size="sm" 
                   fullWidth
                   variant={canAfford ? 'outline' : 'secondary'}
                   className={`flex justify-between items-center ${canAfford ? `border-${bgClass.split('-')[1]}-500 text-${bgClass.split('-')[1]}-400 hover:bg-${bgClass.split('-')[1]}-900/20` : ''}`}
                   onClick={canAfford ? onUpgrade : handleOpenBank}
                >
                   <span>{canAfford ? `Upgrade to Lv ${level + 1}` : 'Add Funds'}</span>
                   <span className="font-mono">{canAfford ? formatCurrency(cost) : `Need ${formatCurrency(cost)}`}</span>
                </Button>
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-900 border-2 border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
           <div>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">Tuning Workshop</h2>
              <p className="text-matatu-yellow text-xs font-bold uppercase tracking-widest">{vehicleName}</p>
           </div>
           <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 transition-colors">
              <X size={20} />
           </button>
        </div>

        {/* Balance Strip */}
        <div className="bg-black/30 px-4 py-2 flex justify-between items-center">
            <span className="text-slate-400 text-xs uppercase font-bold">Workshop Funds</span>
            <span className="text-green-400 font-mono font-bold">{formatCurrency(bankBalance)}</span>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
           
           {/* 1. Route Optimization */}
           {renderUpgradeRow(
              "Route Optimization",
              <Gauge size={20} />,
              vehicleUpgrades[vehicleType] || 0,
              getUpgradeCost(vehicleType, vehicleUpgrades[vehicleType] || 0),
              "text-green-400",
              "bg-green-500",
              () => purchaseUpgrade(vehicleType),
              "Increases max earnings per trip."
           )}

           {/* 2. Fuel Efficiency */}
           {renderUpgradeRow(
              "Eco-Tuning",
              <Fuel size={20} />,
              vehicleFuelUpgrades[vehicleType] || 0,
              getFuelUpgradeCost(vehicleType, vehicleFuelUpgrades[vehicleType] || 0),
              "text-orange-400",
              "bg-orange-500",
              () => purchaseFuelUpgrade(vehicleType),
              "Reduces fuel consumption rate."
           )}

           {/* 3. Performance */}
           {renderUpgradeRow(
              "Engine Tuning",
              <Zap size={20} />,
              vehiclePerformanceUpgrades[vehicleType] || 0,
              getPerformanceUpgradeCost(vehicleType, vehiclePerformanceUpgrades[vehicleType] || 0),
              "text-cyan-400",
              "bg-cyan-500",
              () => purchasePerformanceUpgrade(vehicleType),
              "Boosts top speed and acceleration."
           )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <Button fullWidth onClick={onClose}>Done</Button>
        </div>

      </div>
    </div>
  );
};
