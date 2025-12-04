import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  accent?: 'yellow' | 'blue' | 'red' | 'none';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title,
  accent = 'none' 
}) => {
  const accentColors = {
    yellow: 'border-l-4 border-matatu-yellow',
    blue: 'border-l-4 border-neon-blue',
    red: 'border-l-4 border-danger-red',
    none: 'border border-slate-700',
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm p-5 rounded-r-lg ${accentColors[accent]} ${className} shadow-lg`}>
      {title && (
        <h3 className="font-display text-white/90 text-sm mb-3 uppercase tracking-widest border-b border-slate-700 pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};