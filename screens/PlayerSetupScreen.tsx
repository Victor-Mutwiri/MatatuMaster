
import React, { useState, useEffect } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { Settings, AlertTriangle, Wallet, UserPlus, ArrowLeft, User, Ghost, LogIn } from 'lucide-react';

export const PlayerSetupScreen: React.FC = () => {
  const { setScreen, playerName, saccoName, bankBalance, userMode, registerUser, setPlayerInfo } = useGameStore();
  
  // Local state for the form inputs
  const [localName, setLocalName] = useState(playerName);
  const [localSacco, setLocalSacco] = useState(saccoName);
  const [view, setView] = useState<'CHOICE' | 'FORM'>('CHOICE');

  // If user is already registered, skip this screen
  useEffect(() => {
    if (userMode === 'REGISTERED') {
        setScreen('GAME_MODE');
    }
  }, [userMode, setScreen]);

  // Validation
  const isProfileValid = localName.trim().length > 0 && localSacco.trim().length > 0;

  const handleGuestPlay = () => {
    setScreen('GAME_MODE');
  };

  const handleRegister = () => {
    if (isProfileValid) {
        setPlayerInfo(localName, localSacco);
        registerUser(); // Sets mode to REGISTERED
        setScreen('GAME_MODE');
    }
  };

  const handleBack = () => {
    if (view === 'FORM') {
        setView('CHOICE');
    } else {
        setScreen('LANDING');
    }
  };

  if (view === 'CHOICE') {
      return (
        <GameLayout noMaxWidth className="bg-slate-950">
            <div className="flex flex-col items-center justify-center min-h-full w-full max-w-4xl mx-auto p-6">
                
                <div className="w-full flex items-center gap-4 mb-8">
                    <button 
                        onClick={handleBack}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider">Identity Check</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    
                    {/* Guest Card */}
                    <div 
                        onClick={handleGuestPlay}
                        className="group bg-slate-900 border-2 border-slate-800 hover:border-slate-500 rounded-2xl p-8 cursor-pointer transition-all hover:bg-slate-800 flex flex-col items-center text-center space-y-4"
                    >
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-700">
                            <Ghost size={40} className="text-slate-400" />
                        </div>
                        <div>
                            <h3 className="font-display text-2xl font-bold text-white uppercase">Play as Guest</h3>
                            <p className="text-slate-400 text-sm mt-2">Jump straight into the action.</p>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-lg text-xs text-red-400 font-bold border border-red-900/20 w-full">
                            <AlertTriangle size={12} className="inline mr-1" />
                            No Cloud Save • Limited Features
                        </div>
                        <Button variant="secondary" fullWidth>Start Shift</Button>
                    </div>

                    {/* Register Card */}
                    <div 
                        onClick={() => setView('FORM')}
                        className="group bg-slate-900 border-2 border-matatu-yellow/50 hover:border-matatu-yellow rounded-2xl p-8 cursor-pointer transition-all hover:bg-slate-800 flex flex-col items-center text-center space-y-4 shadow-[0_0_30px_rgba(255,215,0,0.1)] hover:shadow-[0_0_50px_rgba(255,215,0,0.2)]"
                    >
                         <div className="w-20 h-20 bg-matatu-yellow/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-matatu-yellow/30">
                            <LogIn size={40} className="text-matatu-yellow" />
                        </div>
                        <div>
                            <h3 className="font-display text-2xl font-bold text-white uppercase">Register ID</h3>
                            <p className="text-slate-400 text-sm mt-2">Create your persistent profile.</p>
                        </div>
                        <div className="bg-green-900/20 p-3 rounded-lg text-xs text-green-400 font-bold border border-green-900/20 w-full">
                            Unlock Multiplayer • Save Progress
                        </div>
                        <Button variant="primary" fullWidth>Create Profile</Button>
                    </div>

                </div>
            </div>
        </GameLayout>
      );
  }

  // FORM VIEW
  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <div className="flex flex-col items-center justify-center min-h-full w-full max-w-2xl mx-auto p-6 relative">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <button 
                  onClick={handleBack}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">
                    Create Profile
                  </h2>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">New Conductor Registration</p>
                </div>
             </div>
        </div>

        {/* Profile Card */}
        <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
             
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-matatu-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

             <div className="space-y-6">
                
                {/* Inputs */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                            Driver / Conductor Name
                        </label>
                        <input 
                            type="text" 
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            placeholder="e.g. Kevo Ma-Coin"
                            className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-matatu-yellow focus:bg-slate-900 transition-all font-display tracking-wide"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                            Sacco Name
                        </label>
                        <input 
                            type="text" 
                            value={localSacco}
                            onChange={(e) => setLocalSacco(e.target.value)}
                            placeholder="e.g. Super Metro"
                            className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-matatu-yellow focus:bg-slate-900 transition-all font-display tracking-wide"
                        />
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-start gap-3">
                    <UserPlus className="text-matatu-yellow shrink-0 mt-0.5" size={18} />
                    <div className="text-xs text-slate-400 leading-relaxed">
                        By registering, you obtain a valid <span className="text-white font-bold">PSV Badge</span>. This allows you to bank earnings, appear on leaderboards, and access multiplayer features.
                    </div>
                </div>

             </div>
          </div>
          
          {/* Main Action */}
          <div className="w-full pt-6">
             <Button 
                size="lg" 
                fullWidth
                disabled={!isProfileValid}
                onClick={handleRegister}
                className={`h-16 text-xl shadow-xl transition-all ${isProfileValid ? 'opacity-100' : 'opacity-50'}`}
              >
                {isProfileValid ? 'Complete Registration' : 'Enter Details'}
              </Button>
          </div>

      </div>
    </GameLayout>
  );
};
