import React, { useState } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { VehicleType } from '../types';
import { useGameStore } from '../store/gameStore';
import { User, Users, Bus, Zap, Shield, TrendingUp } from 'lucide-react';

export const PlayerSetupScreen: React.FC = () => {
  const { setPlayerInfo, setVehicleType, setScreen } = useGameStore();
  
  const [name, setName] = useState('');
  const [sacco, setSacco] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);

  const isFormValid = name.trim().length > 0 && sacco.trim().length > 0 && selectedVehicle !== null;

  const handleContinue = () => {
    if (isFormValid) {
      setPlayerInfo(name, sacco);
      setVehicleType(selectedVehicle!);
      setScreen('MAP_SELECT');
    }
  };

  const vehicleOptions: { type: VehicleType; name: string; capacity: number; icon: React.ReactNode; stats: string }[] = [
    { 
      type: '14-seater', 
      name: 'The Shark', 
      capacity: 14, 
      icon: <Zap size={20} className="text-yellow-400" />,
      stats: 'High Speed, Low Cap'
    },
    { 
      type: '32-seater', 
      name: 'The Rumble', 
      capacity: 32, 
      icon: <Shield size={20} className="text-blue-400" />,
      stats: 'Balanced Performance'
    },
    { 
      type: '52-seater', 
      name: 'The Titan', 
      capacity: 52, 
      icon: <TrendingUp size={20} className="text-green-400" />,
      stats: 'Low Speed, High Cash'
    },
  ];

  return (
    <GameLayout>
      <div className="flex flex-col h-full space-y-6 animate-fade-in-up">
        
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider">
            Setup Profile
          </h2>
          <p className="text-slate-400 text-xs">Register your details to start the hustle.</p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-matatu-yellow uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> Conductor Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kevo Ma-Coin"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-matatu-yellow focus:ring-1 focus:ring-matatu-yellow transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-matatu-yellow uppercase tracking-wider flex items-center gap-2">
              <Users size={14} /> SACCO Name
            </label>
            <input 
              type="text" 
              value={sacco}
              onChange={(e) => setSacco(e.target.value)}
              placeholder="e.g. Super Metro"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-matatu-yellow focus:ring-1 focus:ring-matatu-yellow transition-all"
            />
          </div>
        </div>

        {/* Vehicle Selection */}
        <div className="space-y-2 flex-1">
          <label className="text-xs font-bold text-matatu-yellow uppercase tracking-wider flex items-center gap-2 mb-2">
            <Bus size={14} /> Select Vehicle
          </label>
          
          <div className="grid gap-3">
            {vehicleOptions.map((v) => (
              <div 
                key={v.type}
                onClick={() => setSelectedVehicle(v.type)}
                className={`
                  relative cursor-pointer p-4 rounded-lg border-2 transition-all duration-200
                  ${selectedVehicle === v.type 
                    ? 'bg-slate-800 border-matatu-yellow shadow-[0_0_15px_rgba(255,215,0,0.15)] scale-[1.02]' 
                    : 'bg-slate-800/50 border-transparent hover:bg-slate-800 hover:border-slate-600'}
                `}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-900 p-2 rounded-full border border-slate-700">
                      {v.icon}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-white text-sm">{v.name}</h3>
                      <p className="text-xs text-slate-400">{v.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-mono text-matatu-yellow">{v.capacity} Pax</span>
                    <span className="block text-[10px] text-slate-500 uppercase">{v.stats}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-4 mt-auto">
          <Button 
            fullWidth 
            variant={isFormValid ? 'primary' : 'secondary'} 
            disabled={!isFormValid}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>

      </div>
    </GameLayout>
  );
};