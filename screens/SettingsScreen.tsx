
import React, { useState, useEffect } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, User, Settings as SettingsIcon, Volume2, VolumeX, Save, Trash2, Lock, ShieldCheck } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { setScreen, playerName, saccoName, setPlayerInfo, isSoundOn, toggleSound, resetCareer, userMode } = useGameStore();
  
  const [name, setName] = useState('');
  const [sacco, setSacco] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // If registered, these fields are immutable
  const isProfileLocked = userMode === 'REGISTERED';

  useEffect(() => {
    setName(playerName);
    setSacco(saccoName);
  }, [playerName, saccoName]);

  const handleSave = () => {
    // Only allow saving if not locked
    if (!isProfileLocked) {
        setPlayerInfo(name, sacco);
    }
    setScreen('SETUP');
  };

  const handleBack = () => {
    setScreen('SETUP'); // Note: Setup will redirect to choice/GameMode based on auth status
  };

  const handleReset = () => {
    resetCareer();
    setName('');
    setSacco('');
    setShowResetConfirm(false);
  };

  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <div className="flex flex-col h-screen w-full max-w-2xl mx-auto p-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
             <button 
               onClick={handleBack}
               className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
             >
               <ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">
                 Settings
               </h2>
               <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Profile & Config</p>
             </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto pb-20">
            
            {/* Profile Section */}
            <section className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                {isProfileLocked && (
                    <div className="absolute top-0 right-0 bg-green-900/30 border-l border-b border-green-500/30 rounded-bl-xl px-3 py-1 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-green-400" />
                        <span className="text-[10px] uppercase font-bold text-green-400">Verified Profile</span>
                    </div>
                )}
                
                <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-2">
                    <User className="text-matatu-yellow" size={24} />
                    <h3 className="font-display text-lg font-bold text-white">Driver Profile</h3>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            Conductor Name / Alias
                            {isProfileLocked && <Lock size={12} className="text-slate-500" />}
                        </label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isProfileLocked}
                            placeholder="Enter your name"
                            className={`w-full border-2 rounded-lg p-3 text-white transition-all
                                ${isProfileLocked 
                                    ? 'bg-slate-950 border-slate-800 text-slate-500 cursor-not-allowed' 
                                    : 'bg-slate-800 border-slate-700 focus:outline-none focus:border-matatu-yellow focus:bg-slate-800/80'}
                            `}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            Sacco Name
                            {isProfileLocked && <Lock size={12} className="text-slate-500" />}
                        </label>
                        <input 
                            type="text" 
                            value={sacco}
                            onChange={(e) => setSacco(e.target.value)}
                            disabled={isProfileLocked}
                            placeholder="Enter your SACCO"
                             className={`w-full border-2 rounded-lg p-3 text-white transition-all
                                ${isProfileLocked 
                                    ? 'bg-slate-950 border-slate-800 text-slate-500 cursor-not-allowed' 
                                    : 'bg-slate-800 border-slate-700 focus:outline-none focus:border-matatu-yellow focus:bg-slate-800/80'}
                            `}
                        />
                    </div>

                    {!isProfileLocked ? (
                        <div className="pt-2">
                            <Button fullWidth onClick={handleSave} disabled={!name || !sacco}>
                                <span className="flex items-center justify-center gap-2">
                                    <Save size={16} /> Save Profile
                                </span>
                            </Button>
                        </div>
                    ) : (
                        <div className="pt-2">
                            <p className="text-xs text-slate-500 text-center italic">
                                Identity details are permanent for registered conductors.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Game Config Section */}
            <section className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-2">
                    <SettingsIcon className="text-blue-400" size={24} />
                    <h3 className="font-display text-lg font-bold text-white">Preferences</h3>
                </div>
                
                <div className="flex items-center justify-between">
                    <div>
                        <span className="block text-white font-bold">Sound Effects</span>
                        <span className="text-xs text-slate-400">Engine, horns, and ambient noise</span>
                    </div>
                    <button 
                        onClick={toggleSound}
                        className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center ${isSoundOn ? 'bg-green-500 justify-end' : 'bg-slate-700 justify-start'}`}
                    >
                        <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                            {isSoundOn ? <Volume2 size={12} className="text-green-600"/> : <VolumeX size={12} className="text-slate-500"/>}
                        </div>
                    </button>
                </div>
            </section>

             {/* Danger Zone */}
             <section className="bg-red-900/10 border border-red-900/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-red-900/30 pb-2">
                    <Trash2 className="text-red-500" size={24} />
                    <h3 className="font-display text-lg font-bold text-red-500">Danger Zone</h3>
                </div>
                
                {!showResetConfirm ? (
                    <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-900/20 w-full" onClick={() => setShowResetConfirm(true)}>
                        Reset Career Progress
                    </Button>
                ) : (
                    <div className="bg-red-900/20 p-4 rounded-lg text-center border border-red-900/50">
                        <p className="text-red-200 text-sm mb-4 font-bold">Are you sure? This will delete all your earnings and leaderboard stats.</p>
                        <div className="flex gap-2">
                            <Button variant="danger" fullWidth onClick={handleReset}>Yes, Delete</Button>
                            <Button variant="secondary" fullWidth onClick={() => setShowResetConfirm(false)}>Cancel</Button>
                        </div>
                    </div>
                )}
            </section>

        </div>
      </div>
    </GameLayout>
  );
};
