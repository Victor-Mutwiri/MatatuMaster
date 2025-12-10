
import React, { useState, useEffect } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { GameService } from '../services/gameService';
import { AlertTriangle, ArrowLeft, Ghost, LogIn, UserPlus, Mail, Lock, CheckCircle2, Loader2, Info } from 'lucide-react';

type SetupView = 'CHOICE' | 'AUTH_SELECT' | 'LOGIN' | 'SIGNUP' | 'ONBOARDING';

export const PlayerSetupScreen: React.FC = () => {
  const { setScreen, playerName, saccoName, userMode, registerUser, setPlayerInfo, loadUserData, userId } = useGameStore();
  
  const [view, setView] = useState<SetupView>('CHOICE');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Onboarding Form State
  const [localName, setLocalName] = useState('');
  const [localSacco, setLocalSacco] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  
  // Temporary storage for auth flow
  const [tempUserId, setTempUserId] = useState<string | null>(userId);

  // If user is already registered AND has a profile, skip this screen
  useEffect(() => {
    if (userMode === 'REGISTERED' && playerName && saccoName) {
        setScreen('GAME_MODE');
    }
  }, [userMode, playerName, saccoName, setScreen]);

  // --- Handlers ---

  const handleBack = () => {
    if (view === 'AUTH_SELECT') setView('CHOICE');
    else if (view === 'LOGIN' || view === 'SIGNUP') {
        setAuthError(null);
        setView('AUTH_SELECT');
    }
    else if (view === 'ONBOARDING') {
        // If they just signed up but cancel onboarding, they are technically authenticated but profile-less
        setView('CHOICE'); 
    }
    else setScreen('LANDING');
  };

  const handleGuestPlay = () => {
    setScreen('GAME_MODE');
  };

  const handleAuthSubmit = async (type: 'LOGIN' | 'SIGNUP') => {
    setIsLoading(true);
    setAuthError(null);

    try {
        if (type === 'SIGNUP') {
            const { data, error } = await GameService.signUp(email, password);
            if (error) throw error;
            if (data.user) {
                setTempUserId(data.user.id);
                setView('ONBOARDING');
            }
        } else {
            const { data, error } = await GameService.signIn(email, password);
            if (error) throw error;
            
            if (data.user) {
                const uid = data.user.id;
                setTempUserId(uid);
                
                // Try to load existing profile
                try {
                    const { profile, progress } = await GameService.loadSave(uid);
                    
                    // If successful, update store and go to game
                    setPlayerInfo(profile.username, profile.sacco);
                    registerUser(uid);
                    if (progress) loadUserData(progress);
                    
                    setScreen('GAME_MODE');
                } catch (e) {
                    // No profile found? Go to onboarding
                    setView('ONBOARDING');
                }
            }
        }
    } catch (err: any) {
        setAuthError(err.message || 'Authentication failed');
    } finally {
        setIsLoading(false);
    }
  };

  // Live Check Simulator
  useEffect(() => {
    const checkName = setTimeout(async () => {
        if (localName.length > 2) {
            setIsCheckingName(true);
            const isAvail = await GameService.checkUsernameAvailability(localName);
            setNameAvailable(isAvail);
            setIsCheckingName(false);
        } else {
            setNameAvailable(null);
        }
    }, 500); // Debounce typing

    return () => clearTimeout(checkName);
  }, [localName]);


  const handleFinalRegistration = async () => {
    if (!tempUserId) {
        setAuthError("Session lost. Please login again.");
        setView('LOGIN');
        return;
    }

    if (nameAvailable && localSacco.length > 2) {
        setIsLoading(true);
        try {
            await GameService.createProfile(tempUserId, localName, localSacco);
            
            setPlayerInfo(localName, localSacco);
            registerUser(tempUserId); 
            setScreen('GAME_MODE');
        } catch (e: any) {
            setAuthError(e.message || "Failed to create profile");
        } finally {
            setIsLoading(false);
        }
    }
  };

  // --- RENDERERS ---

  if (view === 'CHOICE') {
      return (
        <GameLayout noMaxWidth className="bg-slate-950">
            <div className="flex flex-col items-center justify-center min-h-full w-full max-w-4xl mx-auto p-6">
                
                <div className="w-full flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => setScreen('LANDING')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider">Identity Check</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Guest Card */}
                    <div 
                        onClick={handleGuestPlay}
                        className="group bg-slate-900 border-2 border-slate-800 hover:border-slate-500 rounded-2xl p-8 cursor-pointer transition-all hover:bg-slate-800 flex flex-col items-center text-center space-y-4"
                    >
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-700">
                            <Ghost size={40} className="text-slate-400" />
                        </div>
                        <div>
                            <h3 className="font-display text-2xl font-bold text-white uppercase">Play as Guest</h3>
                            <p className="text-slate-400 text-sm mt-2">Jump straight into the action.</p>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-lg text-xs text-red-400 font-bold border border-red-900/20 w-full">
                            <AlertTriangle size={12} className="inline mr-1" />
                            No Cloud Save • Limited Features
                        </div>
                        <Button variant="secondary" fullWidth>Start Shift</Button>
                    </div>

                    {/* Auth Entry Card */}
                    <div 
                        onClick={() => setView('AUTH_SELECT')}
                        className="group bg-slate-900 border-2 border-matatu-yellow/50 hover:border-matatu-yellow rounded-2xl p-8 cursor-pointer transition-all hover:bg-slate-800 flex flex-col items-center text-center space-y-4 shadow-[0_0_30px_rgba(255,215,0,0.1)] hover:shadow-[0_0_50px_rgba(255,215,0,0.2)]"
                    >
                         <div className="w-20 h-20 bg-matatu-yellow/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-matatu-yellow/30">
                            <LogIn size={40} className="text-matatu-yellow" />
                        </div>
                        <div>
                            <h3 className="font-display text-2xl font-bold text-white uppercase">Conductor Access</h3>
                            <p className="text-slate-400 text-sm mt-2">Login or create account.</p>
                        </div>
                        <div className="bg-green-900/20 p-3 rounded-lg text-xs text-green-400 font-bold border border-green-900/20 w-full">
                            Unlock Multiplayer • Save Progress
                        </div>
                        <Button variant="primary" fullWidth>Authenticate</Button>
                    </div>
                </div>
            </div>
        </GameLayout>
      );
  }

  if (view === 'AUTH_SELECT') {
      return (
        <GameLayout noMaxWidth className="bg-slate-950">
           <div className="flex flex-col items-center justify-center min-h-full w-full max-w-md mx-auto p-6">
                <div className="w-full mb-8">
                     <button 
                        onClick={handleBack}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 mb-6"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-display text-3xl font-bold text-white uppercase tracking-wider mb-2">Welcome Back</h2>
                    <p className="text-slate-400">Join the ranks of Nairobi's finest conductors.</p>
                </div>

                <div className="w-full space-y-4">
                    <Button variant="primary" fullWidth size="lg" onClick={() => setView('SIGNUP')}>
                        Create New Account
                    </Button>
                    <Button variant="secondary" fullWidth size="lg" onClick={() => setView('LOGIN')}>
                        Login to Existing
                    </Button>
                </div>
           </div>
        </GameLayout>
      )
  }

  if (view === 'LOGIN' || view === 'SIGNUP') {
      const isSignup = view === 'SIGNUP';
      return (
        <GameLayout noMaxWidth className="bg-slate-950">
           <div className="flex flex-col items-center justify-center min-h-full w-full max-w-md mx-auto p-6">
               <div className="w-full mb-8">
                     <button 
                        onClick={handleBack}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 mb-6"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-display text-3xl font-bold text-white uppercase tracking-wider mb-2">
                        {isSignup ? 'Sign Up' : 'Login'}
                    </h2>
                    <p className="text-slate-400">Secure access to the Conductor Network.</p>
                </div>

                <div className="w-full space-y-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-matatu-yellow transition-colors"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-matatu-yellow transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    {authError && (
                        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-xs">
                            {authError}
                        </div>
                    )}
                </div>

                <div className="w-full mt-6">
                    <Button fullWidth size="lg" onClick={() => handleAuthSubmit(view)} disabled={!email || !password || isLoading}>
                        {isLoading ? 'Processing...' : (isSignup ? 'Create Account' : 'Log In')}
                    </Button>
                </div>
           </div>
        </GameLayout>
      );
  }

  // --- ONBOARDING VIEW (MANDATORY) ---
  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <div className="flex flex-col items-center justify-center min-h-full w-full max-w-2xl mx-auto p-6 relative">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                {/* No Back Button here - Mandatory flow */}
                <div>
                  <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">
                    PSV Badge Issuance
                  </h2>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Official Conductor Registration</p>
                </div>
             </div>
        </div>

        {/* Info Banner */}
        <div className="w-full bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6 flex gap-3">
            <Info className="text-blue-400 shrink-0" size={20} />
            <div className="text-sm text-slate-300">
                <span className="font-bold text-white">Attention:</span> These details are your permanent street identity. They will be used for Leaderboards and Multiplayer. <span className="text-blue-300 font-bold">They cannot be changed later.</span>
            </div>
        </div>

        {/* Profile Card */}
        <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
             
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-matatu-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

             <div className="space-y-6">
                
                {/* Name Input */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                            Conductor Name (Pseudonym)
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                                placeholder="e.g. Kadere 001, Shiro Speed"
                                className={`w-full bg-slate-950 border-2 rounded-xl p-4 text-white focus:outline-none transition-all font-display tracking-wide
                                    ${nameAvailable === false ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-matatu-yellow'}
                                `}
                            />
                            {/* Validation Icon */}
                            <div className="absolute right-4 top-4">
                                {isCheckingName && <Loader2 className="animate-spin text-slate-500" size={20} />}
                                {!isCheckingName && nameAvailable === true && <CheckCircle2 className="text-green-500" size={20} />}
                                {!isCheckingName && nameAvailable === false && <AlertTriangle className="text-red-500" size={20} />}
                            </div>
                        </div>
                        {nameAvailable === false && (
                            <p className="text-red-400 text-xs mt-1">This conductor name is already taken.</p>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                            Sacco Name (Group)
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={localSacco}
                                onChange={(e) => setLocalSacco(e.target.value)}
                                placeholder="e.g. Number Nane Sacco, Super Metro"
                                className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-matatu-yellow focus:bg-slate-900 transition-all font-display tracking-wide"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-start gap-3">
                    <UserPlus className="text-matatu-yellow shrink-0 mt-0.5" size={18} />
                    <div className="text-xs text-slate-400 leading-relaxed">
                        By clicking "Issue Badge", you agree to the Nairobi Hustle rules. Cheating or using offensive names leads to a permanent ban.
                    </div>
                </div>
                
                {authError && (
                    <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-xs">
                        {authError}
                    </div>
                )}

             </div>
          </div>
          
          {/* Main Action */}
          <div className="w-full pt-6">
             <Button 
                size="lg" 
                fullWidth
                disabled={!nameAvailable || !localSacco || isLoading}
                onClick={handleFinalRegistration}
                className={`h-16 text-xl shadow-xl transition-all`}
              >
                {isLoading ? 'Registering...' : 'Issue Badge & Start'}
              </Button>
          </div>

      </div>
    </GameLayout>
  );
};
