import React from 'react';
import { Link } from 'react-router-dom';

// Extend types to include both Link and Button attributes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  children: React.ReactNode;
  icon?: React.ReactNode;
  path?: string;
  iconPosition?: 'left' | 'right';
}

export const GradientButton: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  icon,
  className = '',
  path,
  iconPosition = 'left',
  ...props
}) => {
  // Enhanced base styles with focus outlines and smooth scaling
  const baseStyles = "group inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-[14px] transition-all duration-300 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  // Ultra-premium modern variants with micro-interactions
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 via-blue-500 to-blue-500 bg-[length:200%_auto] text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.45)] hover:-translate-y-0.5 hover:bg-[position:right_center] focus-visible:ring-blue-500",
    
    outline: "bg-white border border-slate-200 text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-slate-300",
    
    danger: "bg-gradient-to-r from-rose-50 to-red-50 text-red-600 border border-red-200 hover:from-rose-500 hover:to-red-600 hover:text-white hover:border-transparent hover:shadow-[0_6px_16px_rgba(225,29,72,0.3)] hover:-translate-y-0.5 focus-visible:ring-red-500",
    
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300",
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${className}`;

  // Reusable content structure with animated icon support
  const content = (
    <>
      {icon && iconPosition === 'left' && (
        <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </span>
      )}
    </>
  );

  // Render as Link if path exists, otherwise render as Button
  if (path) {
    return (
      <Link to={path} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {content}
    </button>
  );
};