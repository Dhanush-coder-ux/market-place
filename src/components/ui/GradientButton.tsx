import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export  const GradientButton: React.FC<ButtonProps> = ({ variant = 'primary', children, icon, className, ...props }) => {
  const baseStyles = "px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 cursor-pointer";
  
  
  const variants = {
    primary: "flex bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg hover:shadow-blue-500/30 ",
    outline: "flex bg-transparent border-1 border-blue-400 text-[#1b68cf]"
  };

  return (
    <button  className={`${baseStyles} ${variants[variant]} ${className || ''}`} {...props}>
      {icon && <span className="mr-2 flex items-center">{icon}</span>}
      {children}
    </button>
  );
};