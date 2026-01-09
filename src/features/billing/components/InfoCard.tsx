import React, { ReactNode } from "react";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility from shadcn, or use a simple string join

interface InfoCardProps {
  title: string;
  icon: ReactNode;
  iconClassName?: string;
  variant?: "default" | "dark";
  children: ReactNode;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon,
  iconClassName,
  variant = "default",
  children,
  className,
}) => {
  // Styles for the main container
  const containerStyles =
    variant === "dark"
      ? "bg-gray-900 text-white shadow-xl border-transparent"
      : "bg-white text-gray-800 shadow-sm border-gray-100 hover:shadow-md";

  // Styles for the title text
  const titleStyles = variant === "dark" ? "text-white/40" : "text-gray-400";

  // Styles for the icon wrapper
  const iconBaseStyles = "absolute top-6 right-6 p-2 rounded-lg transition-colors";
  const iconStyles =
    variant === "dark"
      ? "bg-white/10 text-white" // Default dark mode icon style
      : iconClassName; // Custom colors for light mode (e.g., bg-blue-50)

  return (
    <div
      className={cn(
        "relative group p-6 rounded-[24px] border transition-all",
        containerStyles,
        className
      )}
    >
      <div className={cn(iconBaseStyles, iconStyles)}>
        {icon}
      </div>

      <h3 className={cn("text-xs font-black uppercase tracking-widest mb-4", titleStyles)}>
        {title}
      </h3>

      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};