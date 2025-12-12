
import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { X, User, MapPin, Wallet, ShieldAlert, Briefcase, Settings, Trophy, Award, UserPlus } from 'lucide-react';
import { Button } from './Button';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { 
    playerName, 
    saccoName, 
    userMode, 
    lifetimeStats, 
    bankBalance,
    setScreen,
    formatCurrency // Import the currency formatter
  } = useGameStore();

  const isGuest = userMode === 'GUEST';

  const handleEditProfile = () => {
    onClose();
    if (isGuest) {
      setScreen('SETUP'); // Go to Auth/Onboarding
    } else {
      setScreen('SETTINGS'); // Go to Settings (Read-only)
    }
  };

  // Determine Rank Title based on Distance
  let rankTitle = "Makanga (Rookie)";
  if (lifetimeStats.totalDistanceKm > 500) rankTitle = "Dere (Driver)";
  if (lifetimeStats.totalDistanceKm > 2000) rankTitle = "Captain";
  if (lifetimeStats.totalDistanceKm > 5000) rankTitle = "Matatu Master";

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      
      {/* ID Badge Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-100 rounded-2xl overflow-hidden shadow-2xl flex flex-col transform transition-all scale-100"
      >
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full blur-3xl translate-x-10 -translate-y-10 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl -translate-x-10 translate-y-10 opacity-30"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 bg-black/20 hover:bg-red-500 text-white/80 hover:text-white rounded-full transition-all backdrop-blur-md shadow-lg"
          title="Close Profile"
        >
          <X size={18} />
        </button>

        {/* Header Section */}
        <div className="bg-slate-900 text-white p-6 pb-8 relative overflow-hidden">
           <div className="flex justify-between items-start relative z-10 pr-8">
              <div className="flex items-center gap-2">
                 <div className="bg-matatu-yellow text-black text-xs font-black px-2 py-0.5 rounded uppercase tracking-widest">
                    PSV License
                 </div>
                 {!isGuest && (
                    <div className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                        <Award size={10} /> Verified
                    </div>
                 )}
              </div>
              <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Class</div>
                  <div className="font-display font-bold text-matatu-yellow">PUBLIC SERVICE</div>
              </div>
           </div>
           
           <div className="mt-6 flex items-center gap-5">
              <div className="w-20 h-20 bg-slate-700 rounded-xl border-2 border-slate-500 flex items-center justify-center shadow-lg relative shrink-0">
                  <User size={40} className="text-slate-400" />
                  {!isGuest && (
                    <div className="absolute -bottom-2 -right-2 bg-matatu-yellow text-black text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-900">
                        KE
                    </div>
                  )}
              </div>
              <div className="min-w-0">
                  <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider truncate">
                      {isGuest ? 'Guest Driver' : playerName}
                  </h2>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
                      {isGuest ? 'Unregistered' : saccoName}
                  </p>
                  <div className="inline-flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded text-xs text-yellow-400 font-bold border border-yellow-500/30">
                     <Trophy size={12} /> {rankTitle}
                  </div>
              </div>
           </div>
        </div>

        {/* Stats Section */}
        <div className="p-6 bg-white text-slate-800 relative z-10">
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Wallet size={16} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Total Wealth</span>
                    </div>
                    {/* Updated to use dynamic currency format */}
                    <div className="font-display font-bold text-xl text-slate-900">
                        {formatCurrency(bankBalance)}
                    </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <MapPin size={16} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Distance</span>
                    </div>
                    <div className="font-display font-bold text-xl text-slate-900">
                        {lifetimeStats.totalDistanceKm.toFixed(1)} <span className="text-sm text-slate-500">KM</span>
                    </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Briefcase size={16} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Trips</span>
                    </div>
                    <div className="font-display font-bold text-xl text-slate-900">
                        {lifetimeStats.totalTripsCompleted}
                    </div>
                </div>
                <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2 text-red-400 mb-1">
                        <ShieldAlert size={16} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Bribes Paid</span>
                    </div>
                    {/* Updated to use dynamic currency format */}
                    <div className="font-display font-bold text-xl text-red-900">
                        {formatCurrency(lifetimeStats.totalBribesPaid)}
                    </div>
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="flex gap-3">
                <Button variant={isGuest ? 'primary' : 'secondary'} fullWidth onClick={handleEditProfile}>
                    <span className="flex items-center gap-2 justify-center text-xs">
                        {isGuest ? (
                           <> <UserPlus size={16} /> Create Profile </>
                        ) : (
                           <> <Settings size={16} /> View Details </>
                        )}
                    </span>
                </Button>
            </div>

            <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                    ID: {isGuest ? 'UNREGISTERED' : btoa(playerName).substring(0, 12).toUpperCase()}
                </p>
            </div>

        </div>

      </div>
    </div>
  );
};
