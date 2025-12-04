import React from 'react';
import { PlayerStats } from '../types';
import { Wallet, Clock, Zap } from 'lucide-react';

interface HeaderProps {
  stats: PlayerStats;
}

export const Header: React.FC<HeaderProps> = ({ stats }) => {
  return (
    <header className="sticky top-2 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl mb-6">
      <div className="flex justify-between items-center text-xs sm:text-sm font-display font-bold">
        
        {/* Cash */}
        <div className="flex items-center text-green-400 gap-1.5">
          <Wallet size={16} />
          <span>KES {stats.cash.toLocaleString()}</span>
        </div>

        {/* Time */}
        <div className="flex items-center text-white/80 gap-1.5">
          <Clock size={16} />
          <span>{stats.time}</span>
        </div>

        {/* Energy/Rep */}
        <div className="flex items-center text-matatu-yellow gap-1.5">
          <Zap size={16} />
          <span>{stats.energy}%</span>
        </div>

      </div>
      
      {/* Reputation Bar */}
      <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
        <div 
          className="bg-neon-blue h-full transition-all duration-500" 
          style={{ width: `${stats.reputation}%` }}
        />
      </div>
    </header>
  );
};