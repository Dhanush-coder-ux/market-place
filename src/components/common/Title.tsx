import React from "react";
import { TitleProps } from "../types";

const Title: React.FC<TitleProps> = ({
  title,
  subtitle,
  icon,
}) => {
  return (
    <div className="flex items-start gap-2 mb-4">
      
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
  );
};

export default Title;