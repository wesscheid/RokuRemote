import React from 'react';

interface RemoteButtonProps {
  label?: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'dpad';
  className?: string;
  disabled?: boolean;
}

export const RemoteButton: React.FC<RemoteButtonProps> = ({ 
  label, 
  icon, 
  onClick, 
  variant = 'default',
  className = '',
  disabled = false
}) => {
  
  const baseStyles = "relative flex items-center justify-center transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none";
  
  const variants = {
    default: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-md rounded-2xl h-14 w-14",
    primary: "bg-roku-purple hover:bg-violet-600 text-white shadow-lg shadow-purple-900/30 rounded-full h-16 w-16",
    danger: "bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50 rounded-full h-12 w-12",
    dpad: "bg-zinc-700 hover:bg-zinc-600 text-white"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      aria-label={label || icon}
    >
      {icon && <span className="material-symbols-rounded text-2xl">{icon}</span>}
      {label && !icon && <span className="font-semibold text-sm">{label}</span>}
    </button>
  );
};