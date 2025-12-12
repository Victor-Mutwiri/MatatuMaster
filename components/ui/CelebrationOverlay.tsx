
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Sparkles, Trophy, Unlock, Zap, Crown } from 'lucide-react';

export const CelebrationOverlay: React.FC = () => {
  const activeCelebration = useGameStore(state => state.activeCelebration);
  const [particles, setParticles] = useState<{id: number, x: number, y: number, angle: number, speed: number, size: number, color: string}[]>([]);

  useEffect(() => {
    if (!activeCelebration) {
        setParticles([]);
        return;
    }

    // Generate Particles
    const colors = activeCelebration.type === 'UNLOCK' ? ['#fbbf24', '#f59e0b', '#ffffff'] // Gold
                 : activeCelebration.type === 'UPGRADE' ? ['#06b6d4', '#22d3ee', '#ecfeff'] // Cyan
                 : ['#3b82f6', '#60a5fa', '#ffffff']; // Blue

    const newParticles = Array.from({length: 40}).map((_, i) => ({
        id: i,
        x: 50, // Center %
        y: 50, // Center %
        angle: Math.random() * 360,
        speed: 2 + Math.random() * 8,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);

  }, [activeCelebration]);

  if (!activeCelebration) return null;

  const { type, message } = activeCelebration;

  // Visual Config based on type
  const config = {
      UNLOCK: {
          bg: 'bg-yellow-500/20',
          rayColor: 'from-yellow-500/40',
          titleColor: 'text-yellow-400',
          icon: <Unlock size={64} className="text-yellow-400 animate-bounce" />,
          title: 'ACQUIRED!'
      },
      UPGRADE: {
          bg: 'bg-cyan-500/20',
          rayColor: 'from-cyan-500/40',
          titleColor: 'text-cyan-400',
          icon: <Zap size={64} className="text-cyan-400 animate-pulse" />,
          title: 'UPGRADED!'
      },
      LEVEL_UP: {
          bg: 'bg-green-500/20',
          rayColor: 'from-green-500/40',
          titleColor: 'text-green-400',
          icon: <Trophy size={64} className="text-green-400 animate-bounce" />,
          title: 'LEVEL UP!'
      },
      PROFILE: {
          bg: 'bg-blue-500/20',
          rayColor: 'from-blue-500/40',
          titleColor: 'text-blue-400',
          icon: <Crown size={64} className="text-blue-400 animate-pulse" />,
          title: 'WELCOME!'
      },
      NONE: { bg: '', rayColor: '', titleColor: '', icon: null, title: '' }
  }[type] || { bg: '', rayColor: '', titleColor: '', icon: null, title: '' };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center pointer-events-none ${config.bg} backdrop-blur-sm animate-fade-in`}>
        
        {/* Rotating Sunburst Background */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-50">
             <div className={`w-[200vmax] h-[200vmax] bg-[conic-gradient(var(--tw-gradient-stops))] ${config.rayColor} via-transparent to-transparent animate-[spin_10s_linear_infinite]`}></div>
        </div>

        {/* Particles */}
        {particles.map(p => (
            <div 
                key={p.id}
                className="absolute rounded-full animate-explosion"
                style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: p.color,
                    '--angle': `${p.angle}deg`,
                    '--speed': `${p.speed}0px`
                } as any}
            ></div>
        ))}

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center transform scale-0 animate-pop-in">
            <div className="mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                {config.icon}
            </div>
            <h1 className={`font-display font-black text-6xl md:text-8xl italic uppercase tracking-tighter drop-shadow-2xl ${config.titleColor} mb-2`}>
                {config.title}
            </h1>
            {message && (
                <p className="font-bold text-white text-xl md:text-2xl uppercase tracking-widest bg-black/40 px-6 py-2 rounded-full border border-white/20 backdrop-blur-md">
                    {message}
                </p>
            )}
        </div>

        <style>{`
            @keyframes explosion {
                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                100% { transform: translate(calc(cos(var(--angle)) * var(--speed)), calc(sin(var(--angle)) * var(--speed))) scale(0); opacity: 0; }
            }
            .animate-explosion {
                animation: explosion 1.5s ease-out forwards;
            }
            @keyframes pop-in {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            .animate-pop-in {
                animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
        `}</style>
    </div>
  );
};
