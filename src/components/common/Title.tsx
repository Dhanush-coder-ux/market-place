import React from "react";
import { TitleProps } from "../types";

const Title: React.FC<TitleProps> = ({
  title,
  subtitle,
  icon,
  actions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 w-full animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
            {React.cloneElement(icon as React.ReactElement, { size: 20 } as any)}
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-[17px] sm:text-[20px] font-bold tracking-tight text-slate-900 leading-tight truncate flex items-center gap-2">
            {title}
          </h1>

          {subtitle && (
            <p className="text-[11px] sm:text-[12px] text-slate-500 font-medium mt-0.5 leading-relaxed line-clamp-1 sm:line-clamp-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center justify-end gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default Title;