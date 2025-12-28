import React from "react";
import type { InfoCardProps } from "../types";



const InfoCard: React.FC<InfoCardProps> = ({
  value,
  title,
  valueColor = "text-blue-600",
}) => {
  return (
    <div className="card p-6 card-hover flex items-center gap-6 w-full h-full">
      <div className={`text-4xl font-bold ${valueColor}`}>{value}</div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-semibold truncate">{title}</p>
       
      </div>
    </div>
  );
};

export default InfoCard;
