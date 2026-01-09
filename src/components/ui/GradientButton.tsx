import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const GradientButton: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  icon, 
  className, 
  ...props 
}) => {

  const baseStyles = "flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 cursor-pointer active:scale-95";
  
  const variants = {
   
    primary: "bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg hover:shadow-blue-500/30",
    outline: "bg-transparent border border-blue-400 text-[#1b68cf] hover:bg-blue-50"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className || ''}`} {...props}>
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};