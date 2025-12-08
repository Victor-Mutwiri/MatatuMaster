import React from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, Wifi, UserPlus, PlayCircle, Lock } from 'lucide-react';
import { Card } from '../components/ui/Card';

export const MultiplayerLobbyScreen: React.FC = () => {
  const { setScreen, playerName } = useGameStore();

  const handleBack = () => {
    setScreen('GAME_MODE');
  };

  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-6 relative">
        
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
                 Multiplayer
               </h2>
               <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Lobby</p>
             </div>
        </div>

        {/* Content Placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
            
            <div className="w-24 h-24 bg-neon-blue/10 rounded-full flex items-center justify-center animate-pulse">
                <Wifi size={48} className="text-neon-blue" />
            </div>

            <div className="max-w-md space-y-2">
                <h3 className="font-display text-3xl font-bold text-white uppercase">Online Racing</h3>
                <p className="text-slate-400">
                    Welcome, <span className="text-matatu-yellow font-bold">{playerName}</span>. 
                    <br/>Join a lobby or invite a friend to race.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                <Card className="hover:bg-slate-800 transition-colors cursor-pointer group border-slate-700 hover:border-neon-blue">
                    <div className="flex flex-col items-center py-4">
                        <UserPlus size={32} className="text-slate-300 group-hover:text-neon-blue mb-2" />
                        <h4 className="font-bold text-white uppercase">Create Room</h4>
                        <p className="text-xs text-slate-500 mt-1">Host a private race</p>
                    </div>
                </Card>

                <Card className="hover:bg-slate-800 transition-colors cursor-pointer group border-slate-700 hover:border-matatu-yellow">
                    <div className="flex flex-col items-center py-4">
                        <PlayCircle size={32} className="text-slate-300 group-hover:text-matatu-yellow mb-2" />
                        <h4 className="font-bold text-white uppercase">Join Room</h4>
                        <p className="text-xs text-slate-500 mt-1">Enter Invite Code</p>
                    </div>
                </Card>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center gap-2 text-xs text-slate-500">
                <Lock size={12} />
                <span>Leaderboards and Ranked Matches coming soon.</span>
            </div>

        </div>

      </div>
    </GameLayout>
  );
};