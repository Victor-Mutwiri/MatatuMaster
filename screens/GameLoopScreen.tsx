
import React, { useEffect, useState, useRef } from 'react';
import { useGameStore, VEHICLE_SPECS } from '../store/gameStore';
import { Button } from '../components/ui/Button';
import { GameScene } from '../components/game/GameScene';
import { HUD } from '../components/game/HUD';
import { StageModal } from '../components/game/StageModal';
import { PoliceModal } from '../components/game/PoliceModal';
import { X, AlertOctagon, RotateCcw, Map, CheckCircle2, TrendingUp, TrendingDown, Coins, Play, LogOut, Pause, Timer, AlertTriangle, Loader2 } from 'lucide-react';
import { AuthGateModal } from '../components/ui/AuthGateModal';
import { RotatePrompt } from '../components/ui/RotatePrompt';
import { GameService, PlayerStatePacket } from '../services/gameService';
import { supabase } from '../services/supabaseClient';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

const CITY_LANE_OFFSET = 2.2;
const HIGHWAY_LANE_OFFSET = 3.5;
const RONGAI_LANE_OFFSET = 3.2;

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
    bankCurrentRun,
    stats,
    fuel,
    fuelUsedLiters,
    totalPassengersCarried,
    bribesPaid,
    happiness,
    selectedRoute,
    resumeGame,
    setQuitConfirmation,
    userMode,
    activeRoomId,
    setOpponentState,
    distanceTraveled,
    currentSpeed,
    multiplayerWastedTimer
  } = useGameStore();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [playerLane, setPlayerLane] = useState(-1);
  
  // Refs for Broadcast
  const broadcastInterval = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // FAILSAFE: If no route is selected, don't try to render the scene (Avoids black screen)
  if (!selectedRoute) {
      return (
          <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
              <Loader2 className="text-matatu-yellow animate-spin mb-4" size={48} />
              <h2 className="text-white font-bold text-xl uppercase tracking-widest">Loading Route Data...</h2>
              <p className="text-slate-400 text-sm mt-2">Connecting to game server.</p>
              
              <Button variant="secondary" className="mt-8" onClick={exitToMapSelection}>
                  Cancel / Return to Lobby
              </Button>
          </div>
      )
  }

  // Timer Effect
  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    const timer = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, tickTimer]);

  // Crash Sequence Handler (Single Player Only)
  useEffect(() => {
    if (gameStatus === 'CRASHING' && !activeRoomId) {
      // Wait for dramatic pause before showing modal
      const crashTimer = setTimeout(() => {
        endGame('CRASH');
      }, 2500); // 2.5 seconds of chaos
      return () => clearTimeout(crashTimer);
    }
  }, [gameStatus, endGame, activeRoomId]);

  // Multiplayer Logic: Setup & Broadcast
  useEffect(() => {
      if (activeRoomId && gameStatus === 'PLAYING') {
          console.log("📡 Multiplayer Active. Room:", activeRoomId);
          
          // Subscribe
          channelRef.current = GameService.subscribeToRoom(activeRoomId, (packet) => {
              setOpponentState(packet);
          });

          // Start Broadcast Loop (200ms = 5 updates/sec to reduce fallback spam)
          broadcastInterval.current = setInterval(() => {
              
              // Only send if channel is ready to avoid "falling back to REST" spam which freezes UI
              if (!channelRef.current || channelRef.current.state !== 'joined') {
                  return;
              }

              // Calculate visual X based on map type
              let laneOffset = CITY_LANE_OFFSET;
              const isHighway = selectedRoute?.id === 'thika-highway' || selectedRoute?.id === 'thika-race';
              const isRongai = selectedRoute?.id === 'rongai-extreme' || selectedRoute?.id === 'rongai-race';
              
              if (isHighway) laneOffset = HIGHWAY_LANE_OFFSET;
              else if (isRongai) laneOffset = RONGAI_LANE_OFFSET;

              const visualX = playerLane * laneOffset;

              const packet: PlayerStatePacket = {
                  x: visualX,
                  z: 0, // Relative Z logic handled by receiver
                  dist: distanceTraveled, 
                  rotZ: 0, // Simplified for now
                  speed: currentSpeed,
                  isCrashed: isCrashing
              };
              
              GameService.broadcastPlayerState(channelRef.current, packet).catch(err => {
                  console.warn("Broadcast failed:", err);
              });

          }, 200); 
      }

      return () => {
          if (broadcastInterval.current) clearInterval(broadcastInterval.current);
          if (channelRef.current) supabase.removeChannel(channelRef.current);
      }
  }, [activeRoomId, gameStatus, distanceTraveled, currentSpeed, isCrashing, playerLane, selectedRoute]);


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

  const handleBankAndContinue = () => {
    if (userMode === 'GUEST') {
        setShowAuthGate(true);
    } else {
        // This will save stats and return to map selection
        bankCurrentRun();
    }
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
            <h2 className="font-display font-black text-3xl text-white uppercase italic tracking-tighter">ROUTE COMPLETE</h2>
            <p className="text-slate-400 text-sm">Safe Arrival at Destination</p>
         </div>

         <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
               <span className="text-slate-400 text-xs uppercase font-bold">Gross Earnings</span>
               <span className="text-white font-mono font-bold">KES {stats.cash}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
               <span className="text-slate-400 text-xs uppercase font-bold flex items-center gap-1"><TrendingDown size={14} className="text-red-400"/> Fuel Cost</span>
               <span className="text-red-400 font-mono font-bold">- KES {fuelCost}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
               <span className="text-slate-400 text-xs uppercase font-bold flex items-center gap-1"><AlertOctagon size={14} className="text-red-400"/> Bribes</span>
               <span className="text-red-400 font-mono font-bold">- KES {bribesPaid}</span>
            </div>
            
            <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
               <span className="text-matatu-yellow text-sm uppercase font-black">Net Profit</span>
               <span className="text-green-400 font-display font-black text-2xl">KES {finalScore}</span>
            </div>
         </div>

         <div className="space-y-3">
            <Button variant="primary" fullWidth size="lg" onClick={handleBankAndContinue}>
               <span className="flex items-center justify-center gap-2">
                  <Coins size={20} /> Bank & Continue
               </span>
            </Button>
            <Button variant="secondary" fullWidth onClick={exitToMapSelection}>
               Exit to Map
            </Button>
         </div>
      </div>
    </div>
  );

  // Render Game Over Modal
  const renderGameOverModal = () => (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-red-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-red-600 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
         
         <div className="relative z-10">
            <div className="inline-block bg-red-600/20 p-4 rounded-full mb-4 animate-pulse">
                <AlertOctagon size={48} className="text-red-500" />
            </div>
            
            <h2 className="font-display font-black text-4xl text-white uppercase italic tracking-tighter mb-2 drop-shadow-lg">
              {gameOverReason === 'CRASH' ? 'MAANGAMIZI!' : gameOverReason === 'ARRESTED' ? 'SHIKWA!' : 'TIME UP!'}
            </h2>
            
            <p className="text-red-200 text-sm mb-8 font-bold uppercase tracking-widest">
              {gameOverReason === 'CRASH' ? 'Fatal Collision' : gameOverReason === 'ARRESTED' ? 'Vehicle Impounded' : 'Schedule Failed'}
            </p>

            <div className="bg-black/40 p-4 rounded-xl border border-red-900/30 mb-8">
               <p className="text-slate-400 text-xs mb-1">Session Earnings Lost</p>
               <p className="text-white font-mono text-xl line-through decoration-red-500 decoration-2">KES {stats.cash}</p>
            </div>

            <div className="space-y-3">
               <Button variant="danger" fullWidth size="lg" onClick={startGameLoop}>
                  <span className="flex items-center justify-center gap-2">
                     <RotateCcw size={20} /> Try Again
                  </span>
               </Button>
               <Button variant="secondary" fullWidth onClick={exitToMapSelection}>
                  Return to Garage
               </Button>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen relative bg-black overflow-hidden">
      
      {/* 1. Mobile Rotation Prompt */}
      <RotatePrompt />

      {/* 2. Auth Gate Modal (Contextual) */}
      <AuthGateModal 
        isOpen={showAuthGate} 
        onClose={() => setShowAuthGate(false)}
        featureName="Banking"
        message="To save your earnings and climb the leaderboard, you need a registered Conductor Profile."
      />

      {/* 3. Quit Confirmation Overlay */}
      {activeModal === 'QUIT_CONFIRM' && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
           <div className="bg-slate-900 border border-slate-600 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <h3 className="font-display font-bold text-white text-xl uppercase mb-2">Abandon Route?</h3>
              <p className="text-slate-400 text-sm mb-6">Current progress and earnings will be lost.</p>
              <div className="flex gap-3">
                 <Button variant="danger" fullWidth onClick={handleConfirmQuit}>Quit</Button>
                 <Button variant="secondary" fullWidth onClick={handleCancelQuit}>Cancel</Button>
              </div>
           </div>
        </div>
      )}

      {/* 4. Pause Menu Overlay */}
      {gameStatus === 'PAUSED' && activeModal === 'NONE' && (
         <div className="absolute inset-0 z-[50] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <div className="text-center mb-4">
                    <h2 className="font-display font-black text-4xl text-white uppercase tracking-widest italic">PAUSED</h2>
                </div>
                {countdown === null ? (
                    <>
                        <Button variant="primary" size="lg" fullWidth onClick={handleStartResume}>
                            <span className="flex items-center justify-center gap-2"><Play size={20} /> Resume</span>
                        </Button>
                        <Button variant="secondary" size="lg" fullWidth onClick={() => setQuitConfirmation(true)}>
                            <span className="flex items-center justify-center gap-2"><LogOut size={20} /> Quit Route</span>
                        </Button>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="font-display font-black text-8xl text-matatu-yellow animate-ping">{countdown}</div>
                    </div>
                )}
            </div>
         </div>
      )}

      {/* 5. MULTIPLAYER WASTED OVERLAY */}
      {activeRoomId && isCrashing && (
          <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-sm animate-pulse">
              <h1 className="font-display font-black text-6xl md:text-8xl text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] tracking-tighter italic transform -rotate-6">
                  WASTED
              </h1>
              <div className="mt-8 bg-black/50 px-6 py-2 rounded-full border border-red-500/50">
                  <p className="text-white font-mono font-bold text-xl flex items-center gap-3">
                      RESPAWN IN <span className="text-3xl text-red-400">{multiplayerWastedTimer}</span>
                  </p>
              </div>
          </div>
      )}

      {/* 6. Game Logic Modals */}
      {activeModal === 'STAGE' && <StageModal />}
      {activeModal === 'POLICE' && <PoliceModal />}
      {activeModal === 'GAME_OVER' && (gameOverReason === 'COMPLETED' ? renderSuccessModal() : renderGameOverModal())}

      {/* 7. HUD Layer - Always rendered on top of 3D */}
      <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="w-full h-full pointer-events-auto">
             <HUD />
          </div>
      </div>

      {/* 8. 3D Scene Layer with Error Boundary */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary>
            <GameScene 
                vehicleType={vehicleType} 
                playerLane={playerLane}
                setPlayerLane={setPlayerLane}
            />
        </ErrorBoundary>
      </div>

    </div>
  );
};
