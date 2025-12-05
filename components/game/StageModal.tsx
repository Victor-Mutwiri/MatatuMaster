

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Users, UserMinus, UserPlus, ArrowRight, AlertTriangle, X, Clock, Banknote } from 'lucide-react';

export const StageModal: React.FC = () => {
  const { stageData, handleStageAction, currentPassengers, maxPassengers, gameTimeRemaining } = useGameStore();
  const [showOverloadConfirm, setShowOverloadConfirm] = useState(false);

  if (!stageData) return null;

  const passengersAfterAlight = Math.max(0, currentPassengers - stageData.alightingPassengers);
  const availableSeats = maxPassengers - passengersAfterAlight;
  
  // Calculate potential overload
  const totalWaiting = stageData.waitingPassengers;
  const passengersIfOverload = passengersAfterAlight + totalWaiting;
  const overloadCount = Math.max(0, passengersIfOverload - maxPassengers);
  const isOverloadingPossible = overloadCount > 0;

  // Earnings calculation uses dynamic ticket price
  const FARE = stageData.ticketPrice;
  const legalEarnings = Math.min(availableSeats, totalWaiting) * FARE;
  const overloadEarnings = totalWaiting * FARE;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  const isLowTime = gameTimeRemaining <= 30;

  // Render Confirmation Popup
  if (showOverloadConfirm) {
    return (
      <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-slate-800 border-2 border-red-500 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-500/20 p-3 rounded-full animate-pulse">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 uppercase">Carry Excess Passengers?</h3>
          <p className="text-slate-400 text-sm mb-6">
            You are about to exceed your vehicle capacity by <span className="text-red-400 font-bold">{overloadCount} people</span>.
            <br/><br/>
            <span className="text-green-400 block">Benefit: Earn KES {overloadEarnings} (Max)</span>
            <span className="text-red-400 block">Risk: High chance of police trouble.</span>
          </p>
          <div className="space-y-3">
             <Button variant="danger" fullWidth onClick={() => handleStageAction('PICKUP_OVERLOAD')}>
               Confirm & Overload
             </Button>
             <Button variant="secondary" fullWidth onClick={() => setShowOverloadConfirm(false)}>
               Cancel
             </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 border-2 border-matatu-yellow w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-matatu-yellow p-4 flex justify-between items-center text-black">
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-tighter">STAGE REACHED</h2>
            <p className="text-xs font-bold opacity-80">Stop & Pick Up</p>
          </div>
          
          {/* Active Timer Display */}
          <div className={`flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full ${isLowTime ? 'animate-pulse text-red-700' : ''}`}>
             <Clock size={16} />
             <span className="font-mono font-bold">{formatTime(gameTimeRemaining)}</span>
          </div>
        </div>

        {/* Current Fare Indicator */}
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex items-center justify-center gap-2">
            <Banknote size={16} className="text-green-400" />
            <span className="text-slate-400 text-xs uppercase font-bold">Current Fare:</span>
            <span className="text-green-400 font-bold font-mono">KES {stageData.ticketPrice}</span>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Alighting */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
               <div className="flex items-center gap-2 text-red-400 mb-1">
                 <UserMinus size={16} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Alighting</span>
               </div>
               <span className="text-2xl font-display font-bold text-white">
                 {stageData.alightingPassengers}
               </span>
            </div>

            {/* Waiting */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
               <div className="flex items-center gap-2 text-green-400 mb-1">
                 <UserPlus size={16} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Waiting</span>
               </div>
               <span className="text-2xl font-display font-bold text-white">
                 {stageData.waitingPassengers}
               </span>
            </div>

          </div>

          {/* Info */}
          <div className="text-center space-y-1">
            <p className="text-slate-400 text-sm">
              Seats Available (After Drop): <span className="text-white font-bold">{Math.max(0, availableSeats)}</span>
            </p>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            
            {/* Option 1: Legal Fill */}
            <Button 
              variant="primary" 
              fullWidth 
              onClick={() => handleStageAction('PICKUP_LEGAL')}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-bold uppercase">Fill Seats Only</span>
                <span className="bg-black/20 px-2 py-0.5 rounded text-xs">KES {legalEarnings}</span>
              </div>
            </Button>

            {/* Option 2: Overload (Conditional) */}
            {isOverloadingPossible && (
              <Button 
                variant="danger" 
                fullWidth 
                onClick={() => setShowOverloadConfirm(true)}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold uppercase flex items-center gap-1">
                    <AlertTriangle size={14} /> Excess ({overloadCount})
                  </span>
                  <span className="bg-black/20 px-2 py-0.5 rounded text-xs">KES {overloadEarnings}</span>
                </div>
              </Button>
            )}
            
            <Button 
              variant="secondary" 
              fullWidth 
              onClick={() => handleStageAction('DEPART')}
            >
              Skip / Depart
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};