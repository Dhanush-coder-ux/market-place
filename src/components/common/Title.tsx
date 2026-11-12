import React from "react";
import { TitleProps } from "../types";

const Title: React.FC<TitleProps> = ({
  title,
  icon,
  actions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 sm:mb-3 w-full animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
            {React.cloneElement(icon as React.ReactElement, { size: 18 } as any)}
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight truncate flex items-center gap-2">
            {title}
          </h1>
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-2.5 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

export default Title;

