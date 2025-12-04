
import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Button } from '../components/ui/Button';
import { GameScene } from '../components/game/GameScene';
import { HUD } from '../components/game/HUD';
import { StageModal } from '../components/game/StageModal';
import { PoliceModal } from '../components/game/PoliceModal';
import { X, AlertOctagon, RotateCcw, Map } from 'lucide-react';

export const GameLoopScreen: React.FC = () => {
  const { vehicleType, resetGame, gameStatus, tickTimer, gameOverReason, activeModal, startGameLoop, exitToMapSelection } = useGameStore();

  // Timer Effect
  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    const timer = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, tickTimer]);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      
      {/* 3D Game World */}
      <div className="absolute inset-0 z-0">
        <GameScene vehicleType={vehicleType} />
      </div>

      {/* Heads Up Display */}
      {gameStatus === 'PLAYING' && activeModal === 'NONE' && <HUD />}

      {/* Pause/Abort Menu Button (Top Right absolute) */}
      <div className="absolute top-4 right-4 z-50">
        <Button 
          variant="danger" 
          size="sm" 
          onClick={exitToMapSelection}
          className="bg-red-600/80 backdrop-blur hover:bg-red-600 shadow-lg !p-2 rounded-full"
        >
          <X size={20} />
        </Button>
      </div>

      {/* Stage Modal Overlay */}
      {activeModal === 'STAGE' && <StageModal />}
      
      {/* Police Modal Overlay */}
      {activeModal === 'POLICE' && <PoliceModal />}

      {/* Game Over Modal */}
      {activeModal === 'GAME_OVER' && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-800 border-2 border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center relative overflow-hidden">
            
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-pulse"></div>

            <div className="flex justify-center mb-4">
              <div className="bg-red-500/20 p-4 rounded-full">
                <AlertOctagon size={48} className="text-red-500" />
              </div>
            </div>

            <h2 className="font-display text-3xl font-black text-white uppercase mb-2 tracking-tighter">
              {gameOverReason === 'TIME_UP' ? 'Time Up!' : 
               gameOverReason === 'ARRESTED' ? 'BUSTED!' : 'WASTED!'}
            </h2>
            
            <p className="text-slate-400 text-sm mb-8">
              {gameOverReason === 'TIME_UP' 
                ? "You ran out of time. The passengers are furious and the trip is cancelled." 
                : gameOverReason === 'ARRESTED' 
                ? "You've been arrested for corruption and traffic violations. Bail is expensive."
                : "Your matatu is wrecked."}
            </p>

            <div className="space-y-3">
              <Button variant="primary" fullWidth onClick={startGameLoop}>
                <span className="flex items-center justify-center gap-2">
                   <RotateCcw size={18} /> Retry Route
                </span>
              </Button>
              
              <Button variant="secondary" fullWidth onClick={exitToMapSelection}>
                <span className="flex items-center justify-center gap-2">
                   <Map size={18} /> Return to Maps
                </span>
              </Button>
              
              <Button variant="danger" fullWidth onClick={resetGame}>
                End Shift (Logout)
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
