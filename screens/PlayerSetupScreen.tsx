import React from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { Settings, AlertTriangle, Wallet, UserPlus, ArrowLeft, User } from 'lucide-react';

export const PlayerSetupScreen: React.FC = () => {
  const { setScreen, playerName, saccoName, bankBalance, userMode, registerUser } = useGameStore();
  
  const isProfileValid = playerName.trim().length > 0 && saccoName.trim().length > 0;

  const handleContinue = () => {
    if (isProfileValid) {
      setScreen('GAME_MODE');
    }
  };

  const handleBack = () => {
    setScreen('LANDING');
  };

  const goToSettings = () => {
    setScreen('SETTINGS');
  };

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
                    Profile
                  </h2>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Identity Check</p>
                </div>
             </div>
             
             <button 
               onClick={goToSettings}
               className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95"
             >
               <Settings size={16} /> <span className="text-xs font-bold uppercase hidden sm:inline">Edit</span>
             </button>
        </div>

        {/* Profile Card */}
        <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
             
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-matatu-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

             {isProfileValid ? (
               <div className="space-y-6">
                  
                  {/* Avatar / ID Section */}
                  <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl border-2 border-slate-600 flex items-center justify-center shadow-inner">
                        <User size={40} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                        <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700 mb-2">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Driver Name</label>
                           <div className="text-white font-display text-xl font-bold truncate tracking-wide">{playerName}</div>
                        </div>
                        <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Sacco</label>
                           <div className="text-matatu-yellow font-display text-lg font-bold truncate tracking-wide">{saccoName}</div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${userMode === 'REGISTERED' ? 'border-green-500/20 bg-green-500/10' : 'border-slate-700 bg-slate-800'}`}>
                           <span className={`text-xl font-bold ${userMode === 'REGISTERED' ? 'text-green-500' : 'text-slate-500'}`}>
                              {userMode === 'REGISTERED' ? '✓' : '?'}
                           </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-500">{userMode}</span>
                    </div>
                  </div>
                  
                  {/* Bank Section */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-xl border border-green-500/30 relative overflow-hidden group">
                     <div className="absolute right-[-10px] top-[-10px] bg-green-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-green-500/20 transition-all"></div>
                     <div className="relative z-10 flex justify-between items-end">
                        <div>
                            <label className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Wallet size={14} /> Total Earnings
                            </label>
                            <div className="text-white font-mono text-3xl font-bold truncate">
                                KES {bankBalance.toLocaleString()}
                            </div>
                        </div>
                        {userMode === 'GUEST' && (
                            <div className="text-xs text-red-400 font-bold bg-red-900/20 px-2 py-1 rounded">
                                * Not Cloud Saved
                            </div>
                        )}
                     </div>
                  </div>
                  
                  {/* Guest CTA */}
                  {userMode === 'GUEST' && (
                     <Button 
                        variant="secondary" 
                        fullWidth 
                        onClick={registerUser}
                        className="border-slate-600 hover:border-white"
                     >
                        <span className="flex items-center justify-center gap-2">
                           <UserPlus size={16} /> Register to Save Progress
                        </span>
                     </Button>
                  )}

               </div>
             ) : (
               <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl text-center space-y-4">
                  <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                     <AlertTriangle className="text-red-500" size={32} />
                  </div>
                  <div>
                    <h3 className="text-red-200 text-lg font-bold mb-1">Profile Incomplete</h3>
                    <p className="text-red-400/80 text-sm">You need a Driver Name and Sacco to operate legally.</p>
                  </div>
                  <Button variant="primary" fullWidth onClick={goToSettings}>
                     Configure Profile
                  </Button>
               </div>
             )}
          </div>
          
          {/* Main Action */}
          <div className="w-full pt-4">
             <Button 
                size="lg" 
                fullWidth
                disabled={!isProfileValid}
                onClick={handleContinue}
                className={`h-16 text-xl shadow-xl transition-all ${isProfileValid ? 'opacity-100' : 'opacity-50'}`}
              >
                {isProfileValid ? 'Next Step' : 'Setup Required'}
              </Button>
          </div>

      </div>
    </GameLayout>
  );
};