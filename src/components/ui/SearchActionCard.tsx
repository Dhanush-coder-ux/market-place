import React from "react";
import type { SearchActionCardProps } from "../types";
import { SearchBar } from "./SearchBar";

const SearchActionCard: React.FC<SearchActionCardProps> = ({
  maxWidth = "",
  searchValue,
  onSearchChange,
  placeholder = "Search...",
}) => {
  return (
    <div className={`${maxWidth} w-full max-w-md`}>
      <SearchBar
        value={searchValue}
        onChange={onSearchChange}
        placeholder={placeholder}
        size="sm"
      />
    </div>
  );
};

export default SearchActionCard;
