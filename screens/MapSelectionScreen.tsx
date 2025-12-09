
import React, { useRef, useEffect, useState } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore, EARNINGS_CAPS } from '../store/gameStore';
import { Route } from '../types';
import { Clock, Lock, MapPin, ArrowLeft, TrendingUp, Car, Shield, Navigation } from 'lucide-react';
import { AuthGateModal } from '../components/ui/AuthGateModal';

// Base map definitions - Earnings will be overwritten dynamically
const MAPS: Route[] = [
  {
    id: 'kiambu-route',
    name: 'Nairobi → Kiambu',
    distance: 14.5,
    potentialEarnings: 4500, // Placeholder
    trafficLevel: 'Medium',
    dangerLevel: 'Safe',
    timeLimit: '45 mins',
    description: 'The standard commuter route. Good for beginners.',
    isLocked: false
  },
  {
    id: 'river-road',
    name: 'River Road Gridlock',
    distance: 6.5,
    potentialEarnings: 15000, // Placeholder
    trafficLevel: 'Gridlock',
    dangerLevel: 'No-Go Zone',
    timeLimit: '40 mins',
    description: 'The Chaos Capital. Traffic is stuck. Drive on the pavement to pass, squeeze through gaps, but avoid the foot patrol!',
    isLocked: false
  },
  {
    id: 'rural-dirt',
    name: 'Upcountry Dirt Road',
    distance: 17.0,
    potentialEarnings: 6000, // Placeholder
    trafficLevel: 'Low',
    dangerLevel: 'Sketchy',
    timeLimit: '55 mins',
    description: 'A rough offroad route through the village. Very bumpy and dusty.',
    isLocked: false
  },
  {
    id: 'limuru-drive',
    name: 'Limuru Misty Drive',
    distance: 22.5,
    potentialEarnings: 7500, // Placeholder
    trafficLevel: 'High',
    dangerLevel: 'Sketchy',
    timeLimit: '1h 00m',
    description: 'A dangerous single-carriageway. Overtake slow trucks but watch out for incoming traffic in the fog!',
    isLocked: false
  },
  {
    id: 'maimahiu-escarpment',
    name: 'Mai Mahiu Escarpment',
    distance: 35.0,
    potentialEarnings: 9500, // Placeholder
    trafficLevel: 'High',
    dangerLevel: 'No-Go Zone',
    timeLimit: '1h 10m',
    description: 'The Gravity Challenge. A steep descent down the Rift Valley. Gravity accelerates you, brakes will overheat!',
    isLocked: false
  },
  {
    id: 'thika-highway',
    name: 'Thika Highway',
    distance: 40.2,
    potentialEarnings: 8000, // Placeholder
    trafficLevel: 'Gridlock',
    dangerLevel: 'Sketchy',
    timeLimit: '1h 15m',
    description: 'A massive 3-lane superhighway. Overtake traffic moving in your direction. Watch your speed!',
    isLocked: false
  },
  {
    id: 'rongai-extreme',
    name: 'Rongai Extreme',
    distance: 25.0,
    potentialEarnings: 12000, // Placeholder
    trafficLevel: 'Gridlock',
    dangerLevel: 'No-Go Zone',
    timeLimit: '2h 00m',
    description: 'The Wild West. Potholes, overlapping Nganyas, and head-on collision risks. Drive on the shoulder to survive.',
    isLocked: false
  }
];

export const MapSelectionScreen: React.FC = () => {
  const { selectRoute, selectedRoute, startGameLoop, setScreen, userMode, vehicleType } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Helper to get real potential earnings
  const getEarnings = (mapId: string) => {
    const currentVehicle = vehicleType || '14-seater';
    const mapCaps = EARNINGS_CAPS[mapId];
    if (mapCaps && mapCaps[currentVehicle]) {
        return mapCaps[currentVehicle];
    }
    return 0;
  };

  useEffect(() => {
    if (!selectedRoute) selectRoute(MAPS[0]);
  }, []);

  const handleRouteSelect = (map: Route) => {
    // Guest check logic - allow most maps but maybe lock special ones later
    const freeMaps = ['kiambu-route', 'rural-dirt', 'river-road', 'thika-highway', 'limuru-drive', 'maimahiu-escarpment', 'rongai-extreme'];
    
    if (userMode === 'GUEST' && !freeMaps.includes(map.id)) {
        setShowAuthGate(true);
        return;
    }
    
    if (!map.isLocked) {
        selectRoute(map);
    }
  };

  const handleStartGame = () => {
    if (selectedRoute && !selectedRoute.isLocked) {
      startGameLoop();
    }
  };

  const activeRoute = selectedRoute || MAPS[0];
  const activeEarnings = getEarnings(activeRoute.id);

  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <AuthGateModal 
        isOpen={showAuthGate} 
        onClose={() => setShowAuthGate(false)}
        featureName="Advanced Routes"
        message="You must create a profile to access high-stakes routes and track new records."
      />

      <div className="flex flex-col h-full w-full max-w-7xl mx-auto md:p-6 lg:gap-8 relative">
        
        {/* Header (Sticky / Fixed Top) */}
        <div className="flex items-center gap-4 p-4 md:p-0 z-20 shrink-0">
             <button 
               onClick={() => setScreen('VEHICLE_SELECT')}
               className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
             >
               <ArrowLeft size={20} />
             </button>
             <div className="flex-1 min-w-0">
               <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider truncate">
                 Select Route
               </h2>
               <p className="text-xs text-slate-400 uppercase tracking-widest">
                  Driving: <span className="text-matatu-yellow font-bold">{vehicleType?.replace('-', ' ') || 'Unknown'}</span>
               </p>
             </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-6">
          
          {/* --- LEFT PANEL: DETAILS (Desktop) --- */}
          <div className="hidden lg:flex flex-col w-[350px] bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden h-fit">
             <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                   <h1 className="font-display font-black text-3xl text-white uppercase leading-tight">
                     {activeRoute.name}
                   </h1>
                   {activeRoute.isLocked && <Lock size={24} className="text-slate-500 shrink-0" />}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {activeRoute.description}
                </p>
                <div className="space-y-3">
                   <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
                      <span className="text-slate-500 uppercase font-bold text-xs">Distance</span>
                      <span className="text-white font-mono">{activeRoute.distance}km</span>
                   </div>
                   <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
                      <span className="text-slate-500 uppercase font-bold text-xs">Potential</span>
                      <span className="text-green-400 font-mono">KES {activeEarnings}</span>
                   </div>
                   <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
                      <span className="text-slate-500 uppercase font-bold text-xs">Difficulty</span>
                      <span className={`${activeRoute.dangerLevel === 'No-Go Zone' ? 'text-red-500' : 'text-orange-400'} font-bold`}>{activeRoute.dangerLevel}</span>
                   </div>
                </div>
             </div>

             <Button 
                variant={activeRoute.isLocked ? 'secondary' : 'primary'}
                size="lg"
                fullWidth
                disabled={activeRoute.isLocked}
                onClick={handleStartGame}
             >
                {activeRoute.isLocked ? 'Locked' : 'Start Engine'}
             </Button>
          </div>

          {/* --- RIGHT PANEL: CAROUSEL --- */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            <div 
              ref={scrollRef}
              className="flex-1 flex lg:flex-wrap items-center lg:items-start lg:justify-start lg:content-start overflow-x-auto lg:overflow-visible hide-scrollbar snap-x snap-mandatory px-6 lg:px-0 gap-6 lg:gap-6 pb-24 lg:pb-0"
            >
              {MAPS.map((map) => {
                const isSelected = selectedRoute?.id === map.id;
                const isLocked = map.isLocked;
                const mapEarnings = getEarnings(map.id);

                return (
                  <div 
                    key={map.id}
                    onClick={() => handleRouteSelect(map)}
                    className={`
                      relative shrink-0 w-[80vw] sm:w-[340px] aspect-[4/3] lg:aspect-[16/9] snap-center rounded-2xl overflow-hidden transition-all duration-300 group
                      flex flex-col border-2 select-none
                      ${isLocked 
                        ? 'bg-slate-900 border-slate-800 grayscale opacity-60' 
                        : 'bg-slate-800 cursor-pointer shadow-xl hover:scale-[1.02]'
                      }
                      ${isSelected 
                        ? 'border-matatu-yellow ring-2 ring-matatu-yellow/20 z-10' 
                        : 'border-slate-700'
                      }
                    `}
                  >
                    <div className="absolute inset-0 bg-slate-800">
                       {/* Mock Map Visual */}
                       <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#64748b_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                       <div className="absolute top-4 left-4 font-display font-bold text-2xl text-white/10 uppercase">{map.name}</div>
                    </div>
                    
                    <div className="relative z-10 flex-1 p-5 flex flex-col justify-end bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent">
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className={`font-display font-bold text-xl ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {map.name}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                             <span className="flex items-center gap-1"><MapPin size={12}/> {map.distance}km</span>
                             <span className="flex items-center gap-1 text-green-400 font-bold"><Car size={12}/> KES {mapEarnings}</span>
                          </div>
                        </div>
                        {isLocked && <Lock className="text-slate-500 mb-1" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Mobile Bottom Sheet */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 p-5 rounded-t-3xl shadow-2xl z-30">
             <div className="flex justify-between items-center mb-4">
                <div>
                   <h3 className="font-display font-bold text-lg text-white">{activeRoute.name}</h3>
                   <div className="text-xs text-slate-400 mt-0.5">{activeRoute.distance}km • {activeRoute.timeLimit}</div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] text-slate-500 uppercase font-bold Reward">Potential</div>
                   <div className="text-green-400 font-mono font-bold">KES {activeEarnings}</div>
                </div>
             </div>
             
             <Button 
                variant={activeRoute.isLocked ? 'secondary' : 'primary'}
                fullWidth
                size="lg"
                disabled={activeRoute.isLocked}
                onClick={handleStartGame}
             >
                {activeRoute.isLocked ? 'Route Locked' : 'Start Drive'}
             </Button>
        </div>

      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </GameLayout>
  );
};
