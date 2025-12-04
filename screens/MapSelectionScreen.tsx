
import React from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { Route } from '../types';
import { Map, Clock, AlertTriangle, Lock, MapPin } from 'lucide-react';

const MAPS: Route[] = [
  {
    id: 'kiambu-route',
    name: 'Nairobi → Kiambu',
    distance: 14.5,
    potentialEarnings: 4500,
    trafficLevel: 'Medium',
    dangerLevel: 'Safe',
    timeLimit: '45 mins',
    description: 'The standard commuter route. Good for beginners, but watch out for rush hour.',
    isLocked: false
  },
  {
    id: 'thika-highway',
    name: 'Thika Highway Super',
    distance: 40.2,
    potentialEarnings: 8000,
    trafficLevel: 'Gridlock',
    dangerLevel: 'Sketchy',
    timeLimit: '1h 15m',
    isLocked: true
  },
  {
    id: 'rongai-extreme',
    name: 'Rongai Extreme',
    distance: 25.0,
    potentialEarnings: 12000,
    trafficLevel: 'Gridlock',
    dangerLevel: 'No-Go Zone',
    timeLimit: '2h 00m',
    isLocked: true
  }
];

export const MapSelectionScreen: React.FC = () => {
  const { selectRoute, selectedRoute, startGameLoop } = useGameStore();

  const handleStartGame = () => {
    if (selectedRoute) {
      startGameLoop();
    }
  };

  return (
    <GameLayout>
      <div className="flex flex-col h-full space-y-6 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
           <div>
             <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">
               Select Route
             </h2>
             <p className="text-slate-400 text-xs">Where are we heading today?</p>
           </div>
           <Map className="text-matatu-yellow" size={24} />
        </div>

        {/* Map Grid */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {MAPS.map((map) => (
            <div 
              key={map.id}
              onClick={() => !map.isLocked && selectRoute(map)}
              className={`
                relative rounded-xl border-2 transition-all duration-300 overflow-hidden
                ${map.isLocked 
                  ? 'bg-slate-900 border-slate-800 opacity-60 grayscale cursor-not-allowed' 
                  : 'cursor-pointer hover:bg-slate-800'
                }
                ${selectedRoute?.id === map.id 
                  ? 'border-matatu-yellow bg-slate-800 ring-1 ring-matatu-yellow/50' 
                  : 'border-slate-800'
                }
              `}
            >
              {/* Map Image Placeholder */}
              <div className="h-24 bg-slate-900 w-full relative group">
                {/* Grid Pattern BG */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                
                {/* Route Line Visualization (Abstract) */}
                <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 40">
                  <path 
                    d="M10,20 Q30,5 50,20 T90,20" 
                    fill="none" 
                    stroke={map.isLocked ? '#475569' : '#FFD700'} 
                    strokeWidth="2" 
                    strokeDasharray={map.isLocked ? "4 4" : "0"}
                  />
                  <circle cx="10" cy="20" r="3" fill={map.isLocked ? '#475569' : '#FFD700'} />
                  <circle cx="90" cy="20" r="3" fill={map.isLocked ? '#475569' : '#FF2A2A'} />
                </svg>

                {map.isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300 border border-slate-500 px-3 py-1 rounded-full">
                      <Lock size={12} /> Coming Soon
                    </span>
                  </div>
                )}
              </div>

              {/* Map Details */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display font-bold text-white text-lg">{map.name}</h3>
                  {!map.isLocked && (
                    <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[10px] font-mono border border-green-500/20">
                      PLAYABLE
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{map.description || 'Route details unavailable.'}</p>

                <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 uppercase font-bold">Dist</span>
                    <span className="text-white flex items-center gap-1"><MapPin size={10} /> {map.distance}km</span>
                  </div>
                  <div className="flex flex-col gap-1">
                     <span className="text-slate-500 uppercase font-bold">Time</span>
                     <span className="text-white flex items-center gap-1"><Clock size={10} /> {map.timeLimit}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                     <span className="text-slate-500 uppercase font-bold">Risk</span>
                     <span className={`flex items-center justify-end gap-1 ${map.dangerLevel === 'Safe' ? 'text-green-400' : 'text-red-400'}`}>
                        <AlertTriangle size={10} /> {map.dangerLevel}
                     </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action */}
        <div className="pt-4 mt-auto">
          <Button 
            fullWidth 
            size="lg"
            variant={selectedRoute ? 'primary' : 'secondary'} 
            disabled={!selectedRoute}
            onClick={handleStartGame}
          >
            Start Game
          </Button>
        </div>

      </div>
    </GameLayout>
  );
};
