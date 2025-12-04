import React from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlayerStats, Route } from '../types';
import { MapPin, Navigation, AlertTriangle, Users } from 'lucide-react';

interface DashboardScreenProps {
  stats: PlayerStats;
  onSelectRoute: (route: Route) => void;
  onLogout: () => void;
}

const SAMPLE_ROUTES: Route[] = [
  {
    id: '1',
    name: 'CBD - Westlands',
    distance: 5.2,
    potentialEarnings: 2500,
    trafficLevel: 'Medium',
    dangerLevel: 'Safe'
  },
  {
    id: '2',
    name: 'CBD - Eastleigh',
    distance: 8.4,
    potentialEarnings: 4500,
    trafficLevel: 'Gridlock',
    dangerLevel: 'Sketchy'
  },
  {
    id: '3',
    name: 'CBD - Githurai',
    distance: 14.1,
    potentialEarnings: 7000,
    trafficLevel: 'Medium',
    dangerLevel: 'No-Go Zone'
  }
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ stats, onSelectRoute, onLogout }) => {
  return (
    <GameLayout>
      <Header stats={stats} />
      
      <div className="flex-1 space-y-6 overflow-y-auto pb-20">
        
        {/* Status Card */}
        <Card title="Vehicle Status" accent="blue">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Matatu Name</span>
            <span className="font-display text-white font-bold text-lg">THE BEAST</span>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-slate-400 text-sm">Condition</span>
             <span className="text-green-400 font-bold text-sm">EXCELLENT</span>
          </div>
        </Card>

        {/* Route Selection */}
        <div>
          <h2 className="font-display text-white mb-3 flex items-center gap-2">
            <Navigation className="text-matatu-yellow" size={20} />
            Available Routes
          </h2>
          
          <div className="space-y-4">
            {SAMPLE_ROUTES.map((route) => (
              <Card key={route.id} className="group hover:bg-slate-800 transition-colors cursor-pointer" accent="none">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-matatu-yellow transition-colors">{route.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <MapPin size={12} /> {route.distance}km
                    </div>
                  </div>
                  <span className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-green-400">
                    KES {route.potentialEarnings}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-slate-900/50 p-2 rounded flex items-center justify-center gap-1">
                     <Users size={12} className="text-blue-400"/>
                     <span className={route.trafficLevel === 'Gridlock' ? 'text-red-400' : 'text-slate-300'}>
                        {route.trafficLevel} Traffic
                     </span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded flex items-center justify-center gap-1">
                     <AlertTriangle size={12} className="text-orange-400"/>
                     <span className={route.dangerLevel === 'Safe' ? 'text-green-400' : 'text-red-400'}>
                        {route.dangerLevel}
                     </span>
                  </div>
                </div>

                <Button variant="secondary" fullWidth size="sm" onClick={() => onSelectRoute(route)}>
                  Select Route
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <Button variant="outline" fullWidth onClick={onLogout}>
          End Shift
        </Button>
      </div>

    </GameLayout>
  );
};