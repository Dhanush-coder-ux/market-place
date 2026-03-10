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
  const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-200/50 hover:-translate-y-0.5",
    outline: "bg-white border-2 border-blue-100 text-blue-600 hover:border-blue-400 hover:bg-blue-50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${className}`;

  // Content structure (to avoid repetition)
  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
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