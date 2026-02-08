import React from "react";

interface TooltipProps {
  children: React.ReactNode;
  message: string;
  className?: string;
}

export const Tooltip = ({ children, message, className = "" }: TooltipProps) => {
  if (!message) return <>{children}</>;

  return (
    <div className={`group relative flex items-center ${className}`}>
      {children}

      <div 
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                   flex flex-col items-center 
                   opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0
                   pointer-events-none transition-all duration-200 ease-out
                   z-[9999]"
      >
        <div className="bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1.5 
                        rounded-lg shadow-xl border border-white/10 whitespace-normal 
                        min-w-[120px] max-w-[200px] text-center leading-tight">
          {message}
        </div>

        <div className="w-2.5 h-2.5 -mt-1.5 rotate-45 bg-gray-900 border-r border-b border-white/10"></div>
      </div>
    </div>
  );
};