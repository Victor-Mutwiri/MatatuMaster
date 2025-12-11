
import React, { useState } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, Users, Trophy, Zap, Globe } from 'lucide-react';
import { AuthGateModal } from '../components/ui/AuthGateModal';

export const GameModeScreen: React.FC = () => {
  const { setScreen, userMode } = useGameStore();
  const [showAuthGate, setShowAuthGate] = useState(false);

  const handleBack = () => {
    // If user is guest, back goes to Landing. If registered, back goes to Landing (logging out effectively or just back)
    setScreen('LANDING'); 
  };

  const handleMultiplayerClick = () => {
    if (userMode === 'GUEST') {
        setShowAuthGate(true);
    } else {
        setScreen('MULTIPLAYER_LOBBY');
    }
  };

  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <AuthGateModal 
        isOpen={showAuthGate} 
        onClose={() => setShowAuthGate(false)}
        featureName="Multiplayer"
        message="You need a registered profile to be discoverable by friends and join online lobbies."
      />

      <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-6 relative">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 z-20">
             <button 
               onClick={handleBack}
               className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
             >
               <ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="font-display text-3xl font-bold text-white uppercase tracking-wider leading-none">
                 Select Mode
               </h2>
               <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Choose your path</p>
             </div>
        </div>

        {/* Cards Container */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 pb-12">
            
            {/* Mode 1: The Hustle */}
            <div 
                onClick={() => setScreen('VEHICLE_SELECT')}
                className="group relative w-full md:w-1/2 h-[300px] md:h-[450px] bg-slate-900 rounded-3xl overflow-hidden cursor-pointer border-2 border-slate-800 hover:border-matatu-yellow transition-all duration-300 shadow-2xl hover:shadow-[0_0_50px_rgba(255,215,0,0.2)]"
            >
                {/* Background Image/Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-900/40 via-slate-950 to-slate-950 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Icon Background */}
                <div className="absolute -right-10 -bottom-10 text-slate-800 group-hover:text-yellow-900/20 transition-colors transform rotate-12">
                    <Trophy size={300} strokeWidth={1} />
                </div>

                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="mb-auto">
                        <div className="bg-matatu-yellow/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-matatu-yellow/20 group-hover:scale-110 transition-transform duration-300">
                             <Zap className="text-matatu-yellow" size={32} />
                        </div>
                    </div>
                    
                    <h3 className="font-display font-black text-4xl md:text-5xl text-white uppercase tracking-tighter mb-2 group-hover:text-matatu-yellow transition-colors">
                        The Hustle
                    </h3>
                    <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6 max-w-sm">
                        Master the streets of Nairobi. Earn cash, buy new matatus, manage passengers, and evade the police. Build your empire.
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-matatu-yellow opacity-80 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                        <span>Start Career</span> <ArrowLeft className="rotate-180" size={16} />
                    </div>
                </div>
            </div>

            {/* Mode 2: Multiplayer */}
            <div 
                onClick={handleMultiplayerClick}
                className="group relative w-full md:w-1/2 h-[300px] md:h-[450px] bg-slate-900 rounded-3xl overflow-hidden cursor-pointer border-2 border-slate-800 hover:border-neon-blue transition-all duration-300 shadow-2xl hover:shadow-[0_0_50px_rgba(0,243,255,0.2)]"
            >
                {/* Background Image/Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Icon Background */}
                <div className="absolute -right-10 -bottom-10 text-slate-800 group-hover:text-blue-900/20 transition-colors transform -rotate-12">
                    <Users size={300} strokeWidth={1} />
                </div>

                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="mb-auto">
                        <div className="bg-neon-blue/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-neon-blue/20 group-hover:scale-110 transition-transform duration-300">
                             <Globe className="text-neon-blue" size={32} />
                        </div>
                    </div>

                    <h3 className="font-display font-black text-4xl md:text-5xl text-white uppercase tracking-tighter mb-2 group-hover:text-neon-blue transition-colors">
                        Multiplayer
                    </h3>
                    <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6 max-w-sm">
                        Challenge friends to 1v1 races. High stakes, rough roads. Sync up and see who is the true Matatu Master.
                    </p>

                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon-blue opacity-80 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                        <span>Enter Lobby</span> <ArrowLeft className="rotate-180" size={16} />
                    </div>
                </div>
            </div>

        </div>
      </div>
    </GameLayout>
  );
};
