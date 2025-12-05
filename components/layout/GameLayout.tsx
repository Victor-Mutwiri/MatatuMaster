import React from 'react';

interface GameLayoutProps {
  children: React.ReactNode;
  className?: string;
  noMaxWidth?: boolean;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children, className = '', noMaxWidth = false }) => {
  return (
    <div className={`h-screen w-full bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-white flex flex-col overflow-hidden ${className}`}>
      {/* Scanline effect overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 z-50"></div>
      
      {/* Main Content Area - Scrollable */}
      <main className={`flex-1 relative z-10 w-full mx-auto flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar ${noMaxWidth ? '' : 'max-w-md px-4 py-6'}`}>
        {children}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 1); 
        }
      `}</style>
    </div>
  );
};