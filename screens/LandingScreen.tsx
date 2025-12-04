
import React from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { BusFront, Play, ShieldAlert, Coins, Map, Zap, Trophy, MousePointer2 } from 'lucide-react';

interface LandingScreenProps {
  onStart: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  return (
    <GameLayout noMaxWidth className="bg-slate-950 relative overflow-x-hidden">
      
      {/* Background Ambience - Nairobi Night Vibe */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Neon Blurs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-matatu-yellow/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px] mix-blend-screen"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full max-w-6xl mx-auto px-4 py-12 lg:py-0">
        
        {/* --- HERO SECTION --- */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto mb-16 animate-fade-in-up">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-md shadow-xl mb-4">
             <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
             <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">
               #1 Matatu Simulator Game
             </span>
          </div>

          {/* Main Title with Graffiti Vibe */}
          <div className="relative">
             <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-2xl transform -rotate-2">
               MATATU<br/>
               <span className="text-matatu-yellow drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]">MASTER</span>
             </h1>
             {/* Decorative Elements around title */}
             <div className="absolute -top-8 -right-8 text-matatu-yellow opacity-20 hidden md:block">
                <BusFront size={120} />
             </div>
          </div>

          {/* Tagline */}
          <p className="font-display text-lg md:text-2xl text-slate-300 uppercase tracking-widest max-w-2xl leading-relaxed">
            The Ultimate <span className="text-white font-bold border-b-2 border-matatu-yellow">Nairobi</span> Conductor Experience
          </p>

          {/* Primary CTA */}
          <div className="w-full max-w-md pt-8">
             <Button 
               variant="primary" 
               size="lg" 
               fullWidth 
               onClick={onStart}
               className="h-16 text-xl shadow-[0_0_40px_rgba(255,215,0,0.4)] hover:shadow-[0_0_60px_rgba(255,215,0,0.6)] hover:scale-105 transition-all duration-300 group"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-20">
          
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/80 transition-colors group">
             <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Map className="text-blue-400" size={24} />
             </div>
             <h3 className="font-display text-xl text-white font-bold mb-2">Real Nairobi Routes</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               Drive legendary routes like Thika Highway, Rongai, and Waiyaki Way. Master the traffic and shortcuts.
             </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/80 transition-colors group">
             <div className="bg-red-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldAlert className="text-red-400" size={24} />
             </div>
             <h3 className="font-display text-xl text-white font-bold mb-2">Police & Bribes</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               Navigate police roadblocks. Will you pay the bribe ("Kitu Kidogo") or risk arrest? The choice is yours.
             </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/80 transition-colors group">
             <div className="bg-matatu-yellow/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Coins className="text-matatu-yellow" size={24} />
             </div>
             <h3 className="font-display text-xl text-white font-bold mb-2">Hustle & Upgrade</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               Maximize fares, manage fuel, and upgrade from a 14-seater to a 52-seater bus. Build your Sacco empire.
             </p>
          </div>

        </div>

        {/* --- SEO RICH CONTENT BLOCK --- */}
        <div className="w-full border-t border-slate-800 pt-16 pb-8">
           <div className="flex flex-col md:flex-row gap-8 items-start">
              
              <div className="md:w-1/3">
                 <h2 className="font-display text-2xl font-bold text-white mb-4">
                   About The Game
                 </h2>
                 <div className="flex flex-wrap gap-2">
                    {['Matatu Culture', 'Boda Boda', 'Simulation', 'Nairobi', 'Racing', 'Strategy'].map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-slate-800 rounded-full text-[10px] uppercase font-bold text-slate-400 border border-slate-700">
                        {tag}
                      </span>
                    ))}
                 </div>
              </div>

              <div className="md:w-2/3 text-slate-400 text-sm leading-7 space-y-4">
                 <p>
                   <strong>Matatu Master</strong> is the definitive <span className="text-slate-200">Kenyan PSV simulator</span>. 
                   Immerse yourself in the chaotic, high-energy world of Nairobi's public transport industry. 
                   Unlike standard racing games, this is a true test of strategy and grit. You aren't just a driver; 
                   you are a conductor managing passengers, fares, and the unpredictable nature of the streets.
                 </p>
                 <p>
                   Dodge reckless <span className="text-slate-200">boda boda riders</span>, outrun the competition, 
                   and customize your vehicle with the loudest graffiti (Matwana style). 
                   Whether you are looking for a realistic bus simulator, a taste of the <span className="text-slate-200">Ma3 culture</span>, 
                   or just want to experience the hustle of the CBD, Matatu Master delivers the authentic thrill. 
                   Can you become the King of the Road?
                 </p>
              </div>

           </div>
        </div>

        {/* Footer */}
        <div className="w-full border-t border-slate-900 py-6 flex flex-col md:flex-row justify-between items-center text-slate-600 text-xs font-mono">
           <p>&copy; 2024 Nairobi Hustle Studios. All Rights Reserved.</p>
           <div className="flex gap-4 mt-2 md:mt-0">
              <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-400 cursor-pointer">v1.2.0 (Beta)</span>
           </div>
        </div>

      </div>
    </GameLayout>
  );
};
