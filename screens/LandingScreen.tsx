import React from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { BusFront, Play, ShieldAlert, Coins, Map, Trophy } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface LandingScreenProps {
  onStart: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  const { setScreen } = useGameStore();

  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-matatu-yellow/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px] mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-full w-full max-w-6xl mx-auto px-4 py-8 lg:py-12">
        
        {/* Top Right Actions - Shifted left to accommodate Profile Button */}
        <div className="w-full flex justify-end mb-8 md:absolute md:top-6 md:right-24 md:mb-0 z-40">
           <button 
             onClick={() => setScreen('LEADERBOARD')}
             className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-full text-white font-bold text-xs uppercase hover:bg-slate-800 hover:scale-105 transition-all shadow-lg group backdrop-blur-md"
           >
              <Trophy size={16} className="text-matatu-yellow group-hover:animate-bounce" /> Leaderboard
           </button>
        </div>

        {/* --- HERO SECTION --- */}
        <div className="flex flex-col items-center text-center space-y-4 md:space-y-6 max-w-4xl mx-auto mb-12 md:mb-16 animate-fade-in-up mt-4 md:mt-16">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-md shadow-xl mb-2">
             <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
             <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">
               #1 Matatu Simulator Game
             </span>
          </div>

          <div className="relative">
             <h1 className="font-display text-5xl md:text-7xl lg:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-2xl transform -rotate-2">
               MATATU<br/>
               <span className="text-matatu-yellow drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]">MASTER</span>
             </h1>
             <div className="absolute -top-4 -right-4 md:-top-8 md:-right-8 text-matatu-yellow opacity-20 hidden sm:block">
                <BusFront className="w-20 h-20 md:w-[120px] md:h-[120px]" />
             </div>
          </div>

          <p className="font-display text-base md:text-2xl text-slate-300 uppercase tracking-widest max-w-2xl leading-relaxed px-4">
            The Ultimate <span className="text-white font-bold border-b-2 border-matatu-yellow">Nairobi</span> Conductor Experience
          </p>

          <div className="w-full max-w-md pt-6 md:pt-8">
             <Button 
               variant="primary" 
               size="lg" 
               fullWidth 
               onClick={onStart}
               className="h-14 md:h-16 text-lg md:text-xl shadow-[0_0_40px_rgba(255,215,0,0.4)] hover:shadow-[0_0_60px_rgba(255,215,0,0.6)] hover:scale-105 transition-all duration-300 group"
             >
               <span className="flex items-center justify-center gap-3">
                 START SHIFT <Play size={24} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
               </span>
             </Button>
             <p className="text-xs text-slate-500 mt-3 font-mono">
               Join 10,000+ Conductors on the Streets
             </p>
          </div>
        </div>

        {/* --- FEATURES GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full mb-12 md:mb-20">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl hover:bg-slate-800/80 transition-colors group">
             <div className="bg-blue-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Map className="text-blue-400" size={20} />
             </div>
             <h3 className="font-display text-lg text-white font-bold mb-1">Real Routes</h3>
             <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
               Thika Highway, Rongai, Waiyaki Way. Master the shortcuts.
             </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl hover:bg-slate-800/80 transition-colors group">
             <div className="bg-red-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShieldAlert className="text-red-400" size={20} />
             </div>
             <h3 className="font-display text-lg text-white font-bold mb-1">Police & Bribes</h3>
             <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
               Deal with roadblocks. Pay "Kitu Kidogo" or risk arrest.
             </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl hover:bg-slate-800/80 transition-colors group">
             <div className="bg-matatu-yellow/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Coins className="text-matatu-yellow" size={20} />
             </div>
             <h3 className="font-display text-lg text-white font-bold mb-1">Hustle Hard</h3>
             <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
               Manage fares, fuel, and upgrade your fleet.
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full border-t border-slate-900 py-6 flex flex-col md:flex-row justify-between items-center text-slate-600 text-xs font-mono mt-auto">
           <p>&copy; 2024 Nairobi Hustle Studios.</p>
           <div className="flex gap-4 mt-2 md:mt-0">
              <span className="hover:text-slate-400 cursor-pointer">Terms</span>
              <span className="hover:text-slate-400 cursor-pointer">v1.2.0</span>
           </div>
        </div>

      </div>
    </GameLayout>
  );
};