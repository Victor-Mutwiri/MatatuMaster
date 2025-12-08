
import React from 'react';
import { Button } from './Button';
import { UserPlus, X, ShieldAlert } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  message: string;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({ isOpen, onClose, featureName, message }) => {
  const { setScreen } = useGameStore();

  if (!isOpen) return null;

  const handleSignup = () => {
    setScreen('SETUP'); // Redirect to setup (which now defaults to form/choice)
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
           <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-600">
              <ShieldAlert className="text-matatu-yellow" size={32} />
           </div>
           <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider mb-2">
             Account Required
           </h2>
           <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
             Accessing: {featureName}
           </div>
           <p className="text-slate-300 text-sm leading-relaxed">
             {message}
           </p>
        </div>

        <div className="space-y-3">
           <Button variant="primary" fullWidth size="lg" onClick={handleSignup}>
              <span className="flex items-center justify-center gap-2">
                 <UserPlus size={20} /> Create Conductor Profile
              </span>
           </Button>
           <Button variant="outline" fullWidth onClick={onClose}>
              Maybe Later
           </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Registration is free and saves your progress
            </p>
        </div>

      </div>
    </div>
  );
};
