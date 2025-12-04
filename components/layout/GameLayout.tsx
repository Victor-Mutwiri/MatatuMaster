import React from 'react';

interface GameLayoutProps {
  children: React.ReactNode;
  className?: string;
  noMaxWidth?: boolean;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children, className = '', noMaxWidth = false }) => {
  return (
    <div className={`min-h-screen w-full bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-white flex flex-col ${className}`}>
      {/* Scanline effect overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 z-50"></div>
      
      <main className={`flex-grow relative z-10 w-full mx-auto px-4 py-6 flex flex-col ${noMaxWidth ? '' : 'max-w-md'}`}>
        {children}
      </main>
    </div>
  );
};