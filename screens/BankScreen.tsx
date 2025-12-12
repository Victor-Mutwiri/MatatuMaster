
import React, { useState, useEffect } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, CreditCard, Coins, CheckCircle2, ShieldCheck, Gem, Loader2, Lock, Store, Gift, Timer, FlaskConical } from 'lucide-react';
import { AuthGateModal } from '../components/ui/AuthGateModal';

interface BundleProps {
  title: string;
  cashAmount: number;
  price: number;
  icon: React.ReactNode;
  isBestValue?: boolean;
  onBuy: () => void;
  formatCurrency: (amount: number) => string;
}

const BundleCard: React.FC<BundleProps> = ({ title, cashAmount, price, icon, isBestValue, onBuy, formatCurrency }) => {
  return (
    <div className={`relative bg-slate-900 border-2 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 cursor-pointer group ${isBestValue ? 'border-matatu-yellow shadow-[0_0_30px_rgba(255,215,0,0.15)]' : 'border-slate-700 hover:border-slate-500'}`} onClick={onBuy}>
      {isBestValue && (
        <div className="absolute -top-3 bg-matatu-yellow text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
          Best Value
        </div>
      )}
      
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isBestValue ? 'bg-matatu-yellow/20 text-matatu-yellow' : 'bg-slate-800 text-slate-400'}`}>
        {icon}
      </div>
      
      <h3 className="text-white font-display font-bold text-lg uppercase tracking-wide mb-1">{title}</h3>
      <div className="text-2xl font-mono font-bold text-green-400 mb-2">
        {formatCurrency(cashAmount)}
      </div>
      
      <div className="mt-auto w-full">
        <Button variant={isBestValue ? 'primary' : 'outline'} fullWidth size="sm">
          Buy for Ksh {price}
        </Button>
      </div>
    </div>
  );
};

export const BankScreen: React.FC = () => {
  const { setScreen, bankBalance, purchaseCash, userMode, isInternational, claimDailyGrant, lastDailyGrantClaim, formatCurrency } = useGameStore();
  const [showAuthGate, setShowAuthGate] = useState(userMode === 'GUEST');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Grant Countdown Logic (72 Hours)
  const GRANT_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 Days
  const [timeLeft, setTimeLeft] = useState<string>('');
  const canClaim = Date.now() - lastDailyGrantClaim >= GRANT_INTERVAL;

  useEffect(() => {
      if (canClaim) {
          setTimeLeft('READY');
          return;
      }
      const interval = setInterval(() => {
          const now = Date.now();
          const target = lastDailyGrantClaim + GRANT_INTERVAL;
          const diff = target - now;
          if (diff <= 0) {
              setTimeLeft('READY');
              clearInterval(interval);
          } else {
              const d = Math.floor(diff / (1000 * 60 * 60 * 24));
              const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              
              if (d > 0) {
                  setTimeLeft(`${d}d ${h}h`);
              } else {
                  setTimeLeft(`${h}h ${m}m`);
              }
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [lastDailyGrantClaim, canClaim]);

  const handleBack = () => {
    setScreen('VEHICLE_SELECT');
  };

  const handlePurchase = (amount: number) => {
    if (userMode === 'GUEST') {
        setShowAuthGate(true);
        return;
    }

    // SIMULATE PAYSTACK FLOW
    setIsProcessing(true);
    setTimeout(() => {
        purchaseCash(amount);
        setIsProcessing(false);
        setSuccessMsg(`Successfully added ${formatCurrency(amount)} to your account!`);
        setTimeout(() => setSuccessMsg(null), 3000);
    }, 2000);
  };

  const handleClaimGrant = () => {
      if (userMode === 'GUEST') {
          setShowAuthGate(true);
          return;
      }
      claimDailyGrant();
  };

  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <AuthGateModal 
        isOpen={showAuthGate} 
        onClose={() => {
            setShowAuthGate(false);
            if(userMode === 'GUEST') handleBack(); 
        }}
        featureName="Sacco Bank"
        message="Only registered conductors can access the bank to secure assets and receive grants."
      />

      {/* Paystack Simulation Modal */}
      {isProcessing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl p-8 flex flex-col items-center text-slate-900 max-w-sm w-full shadow-2xl relative overflow-hidden">
                  {/* Paystack decorative strip */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-500"></div>
                  
                  <Loader2 className="text-green-500 animate-spin mb-4" size={48} />
                  <h3 className="font-bold text-xl mb-2">Processing Payment</h3>
                  <p className="text-slate-500 text-sm text-center mb-6">Connecting to secure gateway...</p>
                  <div className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase font-bold tracking-widest">
                      Test Mode
                  </div>
              </div>
          </div>
      )}

      {/* Success Notification */}
      {successMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
              <CheckCircle2 size={20} /> <span className="font-bold text-sm">{successMsg}</span>
          </div>
      )}

      <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-6 lg:gap-8 relative">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 z-20 shrink-0">
             <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"><ArrowLeft size={20} /></button>
             <div className="flex-1">
                 <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">Sacco Bank</h2>
                 <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Secure Deposits</p>
             </div>
             <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3">
                 <div className="text-right leading-tight">
                     <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Balance</span>
                     <span className="text-green-400 font-mono font-bold">{formatCurrency(bankBalance)}</span>
                 </div>
                 <ShieldCheck className="text-green-500" size={24} />
             </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
            
            {/* International View */}
            {isInternational ? (
                <div className="flex flex-col items-center justify-center py-8 animate-fade-in-up">
                    <div className="bg-gradient-to-br from-indigo-900/80 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-8 max-w-2xl w-full text-center relative overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.15)]">
                        {/* Background Effect */}
                        <FlaskConical className="absolute -right-10 -bottom-10 text-indigo-500/10" size={250} />
                        
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-500/30">
                                <FlaskConical size={14} /> Beta Access
                            </div>
                            
                            <h2 className="font-display text-3xl md:text-4xl font-black text-white uppercase mb-4 leading-tight">
                                Beta Tester Grant
                            </h2>
                            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-8">
                                Welcome to the Matatu Master Beta! As an early tester, you have been selected to receive a <span className="text-white font-bold">periodic grant</span>.
                                <br/><br/>
                                Use these funds to upgrade vehicles, test routes, and provide feedback on the game economy.
                            </p>

                            <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-700/50 mb-8 max-w-md mx-auto flex items-center justify-between gap-4">
                                <div className="text-left">
                                    <span className="text-xs text-slate-500 uppercase font-bold block">3-Day Stimulus</span>
                                    <span className="font-mono text-2xl font-bold text-green-400">{formatCurrency(50000)}</span>
                                </div>
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <Gift className="text-green-400" size={24} />
                                </div>
                            </div>

                            <Button 
                                variant={canClaim ? 'primary' : 'secondary'} 
                                size="lg" 
                                className="w-full max-w-xs h-14 text-lg shadow-xl"
                                disabled={!canClaim}
                                onClick={handleClaimGrant}
                            >
                                {canClaim ? (
                                    <span className="flex items-center gap-2 justify-center"><CheckCircle2 /> Claim Grant</span>
                                ) : (
                                    <span className="flex items-center gap-2 justify-center text-slate-400"><Timer /> Next in {timeLeft}</span>
                                )}
                            </Button>
                            
                            <p className="text-xs text-slate-500 mt-6">
                                * Grants reset every 72 hours.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                // Local (Kenyan) View
                <>
                    <div className="text-center mb-8">
                        <h3 className="text-white font-bold text-lg mb-2">Need capital for a new Matatu?</h3>
                        <p className="text-slate-400 text-sm max-w-md mx-auto">Top up your game account instantly via M-Pesa. All transactions are secure and funds are available immediately.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 px-2">
                        <BundleCard 
                            title="Street Kiosk" 
                            cashAmount={15000} 
                            price={20} 
                            icon={<Store size={32} />} 
                            onBuy={() => handlePurchase(15000)}
                            formatCurrency={formatCurrency}
                        />
                        <BundleCard 
                            title="Handshake" 
                            cashAmount={50000} 
                            price={50} 
                            icon={<Coins size={32} />} 
                            onBuy={() => handlePurchase(50000)}
                            formatCurrency={formatCurrency}
                        />
                        <BundleCard 
                            title="Route Owner" 
                            cashAmount={150000} 
                            price={100} 
                            icon={<CreditCard size={32} />} 
                            onBuy={() => handlePurchase(150000)}
                            formatCurrency={formatCurrency}
                        />
                        <BundleCard 
                            title="Fleet Manager" 
                            cashAmount={500000} 
                            price={350} 
                            icon={<Gem size={32} />} 
                            onBuy={() => handlePurchase(500000)}
                            formatCurrency={formatCurrency}
                        />
                        <BundleCard 
                            title="The Godfather" 
                            cashAmount={2000000} 
                            price={1000} 
                            isBestValue
                            icon={<div className="relative"><Gem size={32} /><div className="absolute -top-1 -right-1 animate-ping w-2 h-2 bg-white rounded-full"></div></div>} 
                            onBuy={() => handlePurchase(2000000)}
                            formatCurrency={formatCurrency}
                        />
                    </div>

                    <div className="mt-12 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 text-center">
                        <Lock className="mx-auto text-slate-600 mb-2" size={24} />
                        <p className="text-xs text-slate-500 max-w-lg mx-auto">
                            Payments are processed via Paystack (Simulation Mode). In the real version, you would be redirected to a secure payment page.
                            <br/>Game Cash cannot be withdrawn for real money.
                        </p>
                    </div>
                </>
            )}
        </div>

      </div>
    </GameLayout>
  );
};
