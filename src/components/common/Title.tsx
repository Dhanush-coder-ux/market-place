import React from "react";
import { TitleProps } from "../types";

const Title: React.FC<TitleProps> = ({
  title,
  subtitle,
  icon,
  actions,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 w-full">
      <div className="flex items-start gap-2">
        {icon && (
          <div className="mt-0.5 text-blue-600">
            {icon}
          </div>
        )}

        <div>
          <h1 className="heading-page text-slate-900">
            {title}
          </h1>

          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default Title;