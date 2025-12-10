
import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

export const RotatePrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if mobile (width < 768px) and in portrait mode
      if (window.innerWidth < 768 && window.innerHeight > window.innerWidth) {
        setIsVisible(true);
        setShouldRender(true);
        
        // Hide after 5 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
          // Allow animation to finish before unmounting
          setTimeout(() => setShouldRender(false), 500); 
        }, 5000);

        return () => clearTimeout(timer);
      } else {
        setIsVisible(false);
        setShouldRender(false);
      }
    };

    // Initial check
    checkOrientation();

    // Listen for resize/orientation changes
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  if (!shouldRender) return null;

  return (
    <div 
      className={`absolute inset-0 z-[100] pointer-events-none flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="flex flex-col items-center justify-center text-white animate-pulse">
        <div className="relative mb-6 w-20 h-20 flex items-center justify-center">
            {/* Phone Animation Container */}
            <div className="animate-[spin_3s_ease-in-out_infinite] origin-center">
                <Smartphone size={64} className="text-matatu-yellow" />
            </div>
        </div>
        <h2 className="font-display font-bold text-xl uppercase tracking-wider text-center">
          Rotate for Best Experience
        </h2>
        <p className="text-slate-400 text-xs mt-2 text-center max-w-xs">
          Landscape mode is recommended for driving.
        </p>
      </div>
    </div>
  );
};
