import React from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { BusFront, Play } from 'lucide-react';

interface LandingScreenProps {
  onStart: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  return (
    <GameLayout className="justify-center items-center">
      <div className="flex flex-col items-center text-center space-y-8 animate-fade-in-up">
        
        {/* Logo / Icon */}
        <div className="relative">
          <div className="absolute -inset-4 bg-matatu-yellow/20 blur-xl rounded-full animate-pulse"></div>
          <BusFront size={80} className="text-matatu-yellow relative z-10" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            MATATU<br/>MASTER
          </h1>
          <p className="font-display text-sm tracking-widest text-matatu-yellow uppercase">
            The Conductor's Hustle
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>

        {/* Pitch */}
        <div className="max-w-xs mx-auto">
          <p className="text-gray-300 text-sm leading-relaxed font-sans">
            Welcome, Conductor. Your mission: run the most profitable matatu route possible. 
            Maximize your passenger load, beat the strict time limits, and navigate the unpredictable streets of Nairobi. 
            Success requires speed, strategy, and tough decisions when faced with random roadblocks and the element of corruption. 
            Get ready for the ultimate test of speed and profit.
          </p>
        </div>

        {/* Action */}
        <div className="w-full pt-8 pb-4 sticky bottom-4">
           <Button 
             variant="primary" 
             size="lg" 
             fullWidth 
             onClick={onStart}
             className="shadow-[0_0_20px_rgba(255,215,0,0.3)]"
           >
             <span className="flex items-center justify-center gap-2">
               Start Shift <Play size={20} fill="currentColor" />
             </span>
           </Button>
           <p className="text-xs text-slate-500 mt-4 font-mono">v0.1.0 // FOUNDATION</p>
        </div>

      </div>
    </GameLayout>
  );
};