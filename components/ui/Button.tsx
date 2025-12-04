import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  ...props
}) => {
  const baseStyles = "relative font-display font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  
  const variants = {
    primary: "bg-matatu-yellow text-black hover:bg-yellow-400 focus:ring-yellow-500 border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1",
    secondary: "bg-slate-700 text-white hover:bg-slate-600 focus:ring-slate-500 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1",
    danger: "bg-danger-red text-white hover:bg-red-600 focus:ring-red-500 border-b-4 border-red-800 active:border-b-0 active:translate-y-1",
    outline: "bg-transparent border-2 border-matatu-yellow text-matatu-yellow hover:bg-matatu-yellow/10 focus:ring-yellow-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
           Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};