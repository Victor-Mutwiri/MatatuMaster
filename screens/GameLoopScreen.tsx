
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Button } from '../components/ui/Button';
import { GameScene } from '../components/game/GameScene';
import { HUD } from '../components/game/HUD';
import { StageModal } from '../components/game/StageModal';
import { PoliceModal } from '../components/game/PoliceModal';
import { X, AlertOctagon, RotateCcw, Map, CheckCircle2, TrendingUp, TrendingDown, Coins, Play, LogOut, Pause } from 'lucide-react';

export const GameLoopScreen: React.FC = () => {
  const { 
    vehicleType, 
    resetGame, 
    gameStatus, 
    isCrashing,
    tickTimer, 
    gameOverReason, 
    activeModal, 
    startGameLoop, 
    exitToMapSelection,
    endGame,
    stats,
    fuel,
    fuelUsedLiters,
    totalPassengersCarried,
    bribesPaid,
    happiness,
    selectedRoute,
    resumeGame,
    setQuitConfirmation
  } = useGameStore();

  const [countdown, setCountdown] = useState<number | null>(null);

  // Timer Effect
  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    const timer = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, tickTimer]);

  // Crash Sequence Handler
  useEffect(() => {
    if (gameStatus === 'CRASHING') {
      // Wait for dramatic pause before showing modal
      const crashTimer = setTimeout(() => {
        endGame('CRASH');
      }, 2500); // 2.5 seconds of chaos
      return () => clearTimeout(crashTimer);
    }
  }, [gameStatus, endGame]);

  // Countdown Logic
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished
      setCountdown(null);
      resumeGame();
    }
  }, [countdown, resumeGame]);

  const handleStartResume = () => {
    setCountdown(3);
  };

  const handleConfirmQuit = () => {
    setQuitConfirmation(false);
    exitToMapSelection();
  };

  const handleCancelQuit = () => {
    setQuitConfirmation(false);
  };

  // Scoring Calculation
  const fuelPricePerLiter = 182;
  const fuelCost = Math.floor(fuelUsedLiters * fuelPricePerLiter);
  
  // We use current cash for total earnings display
  const finalScore = stats.cash - fuelCost;
  
  // Render Success Modal
  const renderSuccessModal = () => (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-slate-800 border-2 border-green-500 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden">
         {/* Confetti / Lights effect (CSS) */}
         <div className="absolute top-0 inset-x-0 h-1 bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.8)]"></div>
         
         <div className="flex flex-col items-center mb-6">
            <div className="bg-green-500/20 p-4 rounded-full mb-3 animate-bounce">
              <CheckCircle2 size={48} className="text-green-400" />
            </div>
            <h2 className="font-display text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
              ARRIVAL
            </h2>
            <p className="text-slate-400 text-sm uppercase tracking-widest">Route Completed</p>
         </div>

         {/* Score Card */}
         <div className="bg-slate-900/50 rounded-lg p-4 space-y-3 mb-6 border border-slate-700">
            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
               <span className="text-slate-400">Total Pax Carried</span>
               <span className="text-white font-bold">{totalPassengersCarried}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-green-400">
               <span>Base Earnings</span>
               <span className="font-mono">+ KES {stats.cash}</span>
            </div>
            
            {bribesPaid > 0 && (
              <div className="flex justify-between items-center text-sm text-red-400">
                 <span>Bribes Paid</span>
                 <span className="font-mono">- KES {bribesPaid}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm text-orange-400">
               <span className="flex items-center gap-1">Fuel ({fuelUsedLiters.toFixed(1)}L @ 182)</span>
               <span className="font-mono">- KES {fuelCost}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-700 mt-2">
               <span className="font-bold text-white uppercase">Net Profit</span>
               <div className="text-right">
                 <span className="block font-display text-xl font-bold text-matatu-yellow">
                   KES {Math.max(0, finalScore)}
                 </span>
                 <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Vibe: {Math.round(happiness)}%
                 </span>
               </div>
            </div>
         </div>

         <div className="space-y-3">
            <Button variant="primary" fullWidth onClick={exitToMapSelection}>
              <span className="flex items-center justify-center gap-2">
                 <Coins size={18} /> Bank & Continue
              </span>
            </Button>
            <Button variant="secondary" fullWidth onClick={startGameLoop}>
              <span className="flex items-center justify-center gap-2">
                 <RotateCcw size={18} /> Replay Route
              </span>
            </Button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      
      {/* 3D Game World */}
      <div className="absolute inset-0 z-0">
        <GameScene vehicleType={vehicleType} />
      </div>

      {/* Heads Up Display - Now visible during Modals (Stage/Police) to show timer */}
      {gameStatus === 'PLAYING' && <HUD />}

      {/* Crash Overlay - GTA Style */}
      {isCrashing && (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
          {/* Blood Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_30%,_rgba(180,0,0,0.6)_90%)] animate-pulse"></div>
          
          {/* Red Flash */}
          <div className="absolute inset-0 bg-red-600/30 mix-blend-overlay animate-[ping_0.5s_ease-out_infinite]"></div>
          
          {/* Text Animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="font-display font-black text-6xl sm:text-8xl text-red-600 uppercase tracking-tighter scale-150 animate-[ping_0.2s_ease-out_reverse]">
              WASTED
            </h1>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
           <h1 className="font-display font-black text-9xl text-white animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
             {countdown === 0 ? "GO!" : countdown}
           </h1>
        </div>
      )}

      {/* Pause Menu Overlay */}
      {gameStatus === 'PAUSED' && activeModal === 'NONE' && countdown === null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fade-in">
           <div className="flex flex-col items-center max-w-md w-full space-y-8">
              <div className="flex flex-col items-center">
                 <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center mb-4">
                    <Pause size={40} className="text-white" fill="currentColor" />
                 </div>
                 <h2 className="font-display font-black text-4xl text-white uppercase tracking-widest">Paused</h2>
                 <p className="text-slate-400 text-sm uppercase tracking-wide mt-2">Take a breather</p>
              </div>

              <div className="w-full space-y-4">
                 <Button variant="primary" fullWidth size="lg" onClick={handleStartResume}>
                    <span className="flex items-center justify-center gap-3">
                       <Play size={24} fill="currentColor" /> Resume Shift
                    </span>
                 </Button>
                 <Button variant="danger" fullWidth size="lg" onClick={() => setQuitConfirmation(true)}>
                    <span className="flex items-center justify-center gap-3">
                       <LogOut size={24} /> Quit Game
                    </span>
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Quit Confirmation Modal */}
      {activeModal === 'QUIT_CONFIRM' && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-slate-800 border-2 border-red-500 w-full max-w-sm rounded-xl p-6 text-center shadow-2xl">
              <div className="flex justify-center mb-4">
                 <div className="bg-red-500/20 p-4 rounded-full animate-pulse">
                    <AlertOctagon size={48} className="text-red-500" />
                 </div>
              </div>
              <h3 className="font-display text-2xl font-bold text-white uppercase mb-2">End Shift?</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                 Are you sure you want to quit? <br/>
                 <span className="text-red-400 font-bold">All progress for this trip will be lost.</span>
              </p>
              
              <div className="space-y-3">
                 <Button variant="danger" fullWidth onClick={handleConfirmQuit}>
                    Yes, Quit Game
                 </Button>
                 <Button variant="secondary" fullWidth onClick={handleCancelQuit}>
                    Cancel
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Stage Modal Overlay */}
      {activeModal === 'STAGE' && <StageModal />}
      
      {/* Police Modal Overlay */}
      {activeModal === 'POLICE' && <PoliceModal />}

      {/* Game Over Modal */}
      {activeModal === 'GAME_OVER' && (
        gameOverReason === 'COMPLETED' ? renderSuccessModal() : (
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
                  : "Fatal crash! The vehicle is totaled and passengers are injured."}
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
        )
      )}

    </div>
  );
};
