import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
  path?: string;
  iconPosition?: "left" | "right";
}

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-xs sm:text-[13px] gap-2",
  lg: "h-10 px-5 text-sm gap-2",
};

export const GradientButton: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  icon,
  className = "",
  path,
  iconPosition = "left",
  ...props
}) => {
  const baseStyles =
    "group inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap overflow-hidden transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer";

  const variants = {
    primary: "text-white hover:brightness-105",
    outline:
      "bg-white border border-slate-200 text-slate-700 shadow-xs hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 focus-visible:ring-slate-300",
    danger:
      "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 focus-visible:ring-red-500",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300",
  };

  const themeStyles: React.CSSProperties =
    variant === "primary"
      ? {
          background: `linear-gradient(to right, var(--t-primary), var(--t-secondary, var(--t-primary)))`,
          boxShadow: `0 2px 8px var(--t-btn-shadow)`,
        }
      : {};

  const combinedClasses = cn(
    baseStyles,
    SIZE_CLASSES[size],
    variants[variant],
    className
  );

  const content = (
    <>
      {icon && iconPosition === "left" && (
        <span className="shrink-0 flex items-center">{icon}</span>
      )}
      <span className="truncate">{children}</span>
      {icon && iconPosition === "right" && (
        <span className="shrink-0 flex items-center">{icon}</span>
      )}
    </>
  );

  if (path) {
    return (
      <Link to={path} className={combinedClasses} style={themeStyles}>
        {content}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} style={themeStyles} {...props}>
      {content}
    </button>
  );
};
