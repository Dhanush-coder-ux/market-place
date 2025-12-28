import React from "react";
import { Link } from "react-router-dom";
import GradientButton from "./GradientButton";
import type { SearchActionCardProps } from "../types";
import Input from "./Input";
import { Search } from "lucide-react";



const SearchActionCard: React.FC<SearchActionCardProps> = ({
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  buttonLabel,
  buttonLink,
}) => {
  return (
    <div className="card p-6 card-hover flex flex-col sm:flex-row gap-4 items-center justify-between w-full h-full">
    
      <Input
      value={searchValue}
      onChange={onSearchChange}
      placeholder={placeholder}
      leftIcon={<Search size={20} color="blue"/>}
      
      />
      <Link to={buttonLink} className="w-full sm:w-auto">
       <GradientButton>
          {buttonLabel}
       </GradientButton>
      </Link>
    </div>
  );
};

export default SearchActionCard;
