import React from "react";
import { TitleProps } from "../types";

const Title: React.FC<TitleProps> = ({
  title,
  subtitle,
  icon,
}) => {
  return (
    <div className="flex items-start gap-2">
      
      {icon && (
        <div className="mt-0.5 text-indigo-600">
          {icon}
        </div>
      )}

      <div>
        <h1 className="text-lg md:text-xl font-semibold text-slate-900">
          {title}
        </h1>

        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

    </div>
  );
};

export default Title;