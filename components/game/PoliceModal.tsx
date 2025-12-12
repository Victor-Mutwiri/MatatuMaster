
import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { ShieldAlert, AlertTriangle, Wallet } from 'lucide-react';

export const PoliceModal: React.FC = () => {
  const { policeData, handlePoliceAction, stats, formatCurrency } = useGameStore();

  if (!policeData) return null;

  const canAfford = stats.cash >= policeData.bribeAmount;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 border-2 border-blue-500 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-tighter">POLICE CHECK</h2>
            <p className="text-xs font-bold opacity-80">Stop Request</p>
          </div>
          <ShieldAlert size={32} className="animate-pulse" />
        </div>

        <div className="p-6 space-y-6">
          
          {/* Officer Message */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 relative">
            <div className="absolute -top-3 -left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">OFFICER</div>
            <p className="text-white italic text-sm pt-2">"{policeData.message}"</p>
          </div>

          {/* Context */}
          <div className="space-y-2">
             <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                <span className="text-slate-400">Status</span>
                <span className={policeData.isOverloaded ? "text-red-500 font-bold uppercase" : "text-green-500 font-bold uppercase"}>
                  {policeData.isOverloaded ? "Overloaded" : "Compliance OK"}
                </span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Demand</span>
                <span className="text-matatu-yellow font-bold">{formatCurrency(policeData.bribeAmount)}</span>
             </div>
          </div>

          {/* Warning */}
          <div className="bg-slate-900/50 p-3 rounded text-xs text-slate-400 flex gap-2">
             <AlertTriangle size={16} className="text-orange-500 shrink-0"/>
             <p>Refusing to pay increases chance of arrest. If arrested, your shift ends immediately.</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              variant="primary" 
              fullWidth 
              disabled={!canAfford}
              onClick={() => handlePoliceAction('PAY')}
            >
              <span className="flex items-center justify-center gap-2">
                Pay Bribe ({formatCurrency(policeData.bribeAmount)}) <Wallet size={16} />
              </span>
            </Button>
            
            <Button 
              variant="danger" 
              fullWidth 
              onClick={() => handlePoliceAction('REFUSE')}
            >
              Refuse & Argue (Risk Arrest)
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};
