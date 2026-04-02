import React from "react";
import type { SearchActionCardProps } from "../types";
import Input from "./Input";
import { Search } from "lucide-react";

const SearchActionCard: React.FC<SearchActionCardProps> = ({
  maxWidth,
  searchValue,
  onSearchChange,
  placeholder = "Search inventory…",
}) => {
  return (
    <div
      className={`${maxWidth} max-w-md`}
    >
      <Input
        name="search"
        value={searchValue}
        onChange={onSearchChange}
        placeholder={placeholder}
        leftIcon={
          <Search
            size={16}
            strokeWidth={2.5}
            className="text-slate-400"
          />
        }
        className="w-full bg-white rounded-xl border-slate-200 h-10 text-sm focus:border-blue-400 focus:ring-blue-100"
      />
    </div>
  );
};

export default SearchActionCard;