import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline'| 'danger';
  children: React.ReactNode;
  icon?: React.ReactNode;
  path?: string;
}

export const GradientButton: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  icon, 
  className, 
  path,
  ...props 
}) => {

  const baseStyles = "flex items-center justify-center gap-2 px-4 py-1 rounded-lg  cursor-pointer";
  
  const variants = {
   
    primary: "bg-gradient-to-r from-blue-600 to-blue-400 text-white ",
    outline: "bg-transparent border border-blue-400 text-[#1b68cf] ",
    danger: "bg-transparent border border-red-400 text-red-500 ",
  };

  const button = (
    <button className={`${baseStyles} ${variants[variant]} ${className || ''}`} {...props}>
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );

  return path ? <Link to={path}>{button}</Link> : button;
};