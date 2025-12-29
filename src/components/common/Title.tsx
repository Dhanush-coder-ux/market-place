import React from "react";
import { TitleProps } from "../types";






const Title: React.FC<TitleProps> = ({
  title,
  subtitle,
  icon,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
     
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-1 text-blue-600">
            {icon}
          </div>
        )}

        <div>
          <h1 className="text-2xl text-blue-600 md:text-3xl font-semibold">
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Title;
