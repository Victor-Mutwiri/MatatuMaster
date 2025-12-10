
import React, { useState, useEffect } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, Trophy, Coins, Map, ShieldAlert, AlertTriangle, User, Crown, Loader2 } from 'lucide-react';
import { GameService, LeaderboardEntry } from '../services/gameService';

type RankingMetric = 'CASH' | 'DISTANCE' | 'BRIBES';

export const LeaderboardScreen: React.FC = () => {
  const { setScreen, lifetimeStats, playerName, saccoName } = useGameStore();
  const [activeMetric, setActiveMetric] = useState<RankingMetric>('CASH');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data on Mount or Metric Change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    GameService.getLeaderboard(activeMetric).then(data => {
        if (isMounted) {
            setLeaderboardData(data);
            setIsLoading(false);
        }
    });

    return () => { isMounted = false; };
  }, [activeMetric]);

  // Prepare Data
  const formatValue = (val: number, type: RankingMetric) => {
    if (type === 'CASH') return `KES ${val.toLocaleString()}`;
    if (type === 'DISTANCE') return `${val.toFixed(1)} KM`;
    if (type === 'BRIBES') return `KES ${val.toLocaleString()}`;
    return val;
  };

  const getMetricTitle = (type: RankingMetric) => {
    if (type === 'CASH') return 'The Tycoons';
    if (type === 'DISTANCE') return 'The Legends';
    if (type === 'BRIBES') return 'The Cartel';
    return '';
  };

  const getMetricDesc = (type: RankingMetric) => {
    if (type === 'CASH') return 'Highest Total Earnings';
    if (type === 'DISTANCE') return 'Total Distance Covered';
    if (type === 'BRIBES') return 'Most Bribes Paid (Dark List)';
    return '';
  };

  // Combine Player + Bots and Sort (Client side merge for now)
  // In a real Supabase implementation, the player might already be in the list if synced
  const playerVal = activeMetric === 'CASH' ? lifetimeStats.totalCashEarned 
                  : activeMetric === 'DISTANCE' ? lifetimeStats.totalDistanceKm 
                  : lifetimeStats.totalBribesPaid;

  // Insert current player into list if not present or just for visualization
  // For simplicity in this mock-transition phase, we insert 'You' manually if not found by ID
  const displayList = [...leaderboardData];
  const playerEntry = { id: 'player', name: playerName || 'You', sacco: saccoName || 'Freelancer', stat: playerVal, rank: 0 };
  
  // Sort including player
  const combined = [...displayList, playerEntry].sort((a, b) => b.stat - a.stat).map((e, i) => ({ ...e, rank: i + 1 }));
  
  const topThree = combined.slice(0, 3);
  const restList = combined.slice(3);
  const playerRank = combined.find(e => e.id === 'player')?.rank || 999;

  return (
    <GameLayout noMaxWidth className="bg-slate-950 overflow-hidden">
      
      <div className="flex flex-col h-screen w-full max-w-5xl mx-auto md:p-6 relative">
        
        {/* Header */}
        <div className="flex items-center gap-4 p-4 md:p-0 z-20">
             <button 
               onClick={() => setScreen('LANDING')}
               className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
             >
               <ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">
                 Hall of Fame
               </h2>
               <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Global Rankings</p>
             </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 md:px-0 md:py-4 overflow-x-auto no-scrollbar z-20">
          <button 
             onClick={() => setActiveMetric('CASH')}
             className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold uppercase transition-all whitespace-nowrap
               ${activeMetric === 'CASH' ? 'bg-matatu-yellow text-black border-matatu-yellow' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}
             `}
          >
             <Coins size={16} /> Wealth
          </button>
          <button 
             onClick={() => setActiveMetric('DISTANCE')}
             className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold uppercase transition-all whitespace-nowrap
               ${activeMetric === 'DISTANCE' ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}
             `}
          >
             <Map size={16} /> Distance
          </button>
          <button 
             onClick={() => setActiveMetric('BRIBES')}
             className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold uppercase transition-all whitespace-nowrap
               ${activeMetric === 'BRIBES' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}
             `}
          >
             <ShieldAlert size={16} /> Bribes
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6 p-4 md:p-0">
           
           {/* Top 3 Podium (Desktop: Left, Mobile: Top) */}
           <div className="md:w-1/3 flex flex-col items-center justify-center shrink-0 min-h-[250px]">
              <div className="text-center mb-6">
                 <h3 className={`font-display font-black text-3xl uppercase italic transform -rotate-2 
                    ${activeMetric === 'CASH' ? 'text-matatu-yellow' : activeMetric === 'BRIBES' ? 'text-red-500' : 'text-blue-400'}
                 `}>
                    {getMetricTitle(activeMetric)}
                 </h3>
                 <p className="text-xs text-slate-400">{getMetricDesc(activeMetric)}</p>
              </div>

              {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                      <Loader2 className="animate-spin text-slate-500" size={48} />
                  </div>
              ) : (
                  <div className="flex items-end justify-center gap-2 md:gap-4 w-full h-48 md:h-64">
                     {/* 2nd Place */}
                     {topThree[1] && (
                        <div className="flex flex-col items-center w-1/3 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                           <div className="mb-2 text-center">
                              <span className="font-bold text-xs text-slate-300 block truncate max-w-[80px]">{topThree[1].name}</span>
                              <span className="text-[10px] text-slate-500">{topThree[1].sacco}</span>
                           </div>
                           <div className="w-full bg-slate-700 h-24 md:h-32 rounded-t-lg border-t-4 border-slate-400 flex flex-col items-center justify-end p-2 relative">
                              <div className="absolute -top-3 bg-slate-800 rounded-full p-1 border border-slate-400 shadow-lg">
                                 <span className="font-display font-bold text-slate-400 text-xs">#2</span>
                              </div>
                              <span className="font-mono font-bold text-white text-[10px] md:text-xs">{formatValue(topThree[1].stat, activeMetric)}</span>
                           </div>
                        </div>
                     )}

                     {/* 1st Place */}
                     {topThree[0] && (
                        <div className="flex flex-col items-center w-1/3 z-10 animate-fade-in-up">
                           <Crown className="text-matatu-yellow mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] animate-bounce" size={32} />
                           <div className="mb-2 text-center">
                              <span className="font-bold text-sm text-matatu-yellow block truncate max-w-[100px]">{topThree[0].name}</span>
                              <span className="text-[10px] text-slate-400">{topThree[0].sacco}</span>
                           </div>
                           <div className="w-full bg-slate-800 h-32 md:h-48 rounded-t-lg border-t-4 border-matatu-yellow flex flex-col items-center justify-end p-2 relative shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                              <div className="absolute -top-4 bg-slate-900 rounded-full p-2 border-2 border-matatu-yellow shadow-xl">
                                 <span className="font-display font-black text-matatu-yellow text-lg">#1</span>
                              </div>
                              <span className="font-mono font-bold text-white text-xs md:text-sm">{formatValue(topThree[0].stat, activeMetric)}</span>
                           </div>
                        </div>
                     )}

                     {/* 3rd Place */}
                     {topThree[2] && (
                        <div className="flex flex-col items-center w-1/3 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                           <div className="mb-2 text-center">
                              <span className="font-bold text-xs text-orange-300 block truncate max-w-[80px]">{topThree[2].name}</span>
                              <span className="text-[10px] text-slate-500">{topThree[2].sacco}</span>
                           </div>
                           <div className="w-full bg-slate-700 h-20 md:h-24 rounded-t-lg border-t-4 border-orange-700 flex flex-col items-center justify-end p-2 relative">
                              <div className="absolute -top-3 bg-slate-800 rounded-full p-1 border border-orange-700 shadow-lg">
                                 <span className="font-display font-bold text-orange-700 text-xs">#3</span>
                              </div>
                              <span className="font-mono font-bold text-white text-[10px] md:text-xs">{formatValue(topThree[2].stat, activeMetric)}</span>
                           </div>
                        </div>
                     )}
                  </div>
              )}
           </div>

           {/* The List (Scrollable) */}
           <div className="flex-1 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl overflow-hidden flex flex-col relative">
              <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                 <span className="w-10 text-center">Rank</span>
                 <span className="flex-1">Player / Sacco</span>
                 <span>Score</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {isLoading ? (
                     <div className="p-8 text-center text-slate-500">Loading rankings...</div>
                 ) : (
                     restList.map((item) => (
                        <div key={item.id} className={`flex items-center p-3 rounded-lg border ${item.id === 'player' ? 'bg-slate-800 border-matatu-yellow/50' : 'bg-transparent border-transparent hover:bg-slate-800/30'}`}>
                           <div className="w-10 text-center font-display font-bold text-slate-500">#{item.rank}</div>
                           <div className="flex-1">
                              <div className={`font-bold text-sm ${item.id === 'player' ? 'text-matatu-yellow' : 'text-slate-300'}`}>
                                 {item.name} {item.id === 'player' && '(You)'}
                              </div>
                              <div className="text-[10px] text-slate-500 uppercase">{item.sacco}</div>
                           </div>
                           <div className="font-mono text-sm font-bold text-white">
                              {formatValue(item.stat, activeMetric)}
                           </div>
                        </div>
                     ))
                 )}
              </div>

              {/* Sticky Player Rank if not in view (Optional polish) */}
              <div className="border-t border-slate-700 bg-slate-900 p-4 flex items-center justify-between z-10">
                 <div className="flex items-center gap-3">
                    <div className="bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center border border-slate-600">
                       <User size={20} className="text-slate-400" />
                    </div>
                    <div>
                       <span className="block text-xs text-slate-400 uppercase font-bold">Your Rank</span>
                       <span className="font-display font-bold text-white text-lg">#{playerRank}</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="block text-xs text-slate-400 uppercase font-bold">{getMetricDesc(activeMetric)}</span>
                    <span className={`font-mono font-bold text-lg ${activeMetric === 'BRIBES' ? 'text-red-500' : 'text-green-400'}`}>
                       {formatValue(playerVal, activeMetric)}
                    </span>
                 </div>
              </div>

           </div>

        </div>

      </div>
    </GameLayout>
  );
};
