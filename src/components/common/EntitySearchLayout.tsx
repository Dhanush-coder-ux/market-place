import React from "react";
import { Search } from "lucide-react";

interface EntitySearchLayoutProps {
  children: React.ReactNode;
}

export const EntitySearchLayout: React.FC<EntitySearchLayoutProps> = ({ children }) => {
  return (
    <div className="h-full w-full bg-slate-50/60 flex items-start sm:items-center justify-center p-3 pt-8 pb-24 sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-7 flex flex-col gap-5">
        <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center mx-auto">
          <Search size={20} />
        </div>
        {children}
      </div>
    </div>
  );
};

export default EntitySearchLayout;

