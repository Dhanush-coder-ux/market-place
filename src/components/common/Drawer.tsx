import React from "react";
import {  CircleArrowRight } from "lucide-react";
import type { DrawerProps } from "../types";



const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      <div
        className={`
          fixed top-0 right-0 h-full bg-white shadow-2xl rounded-lg
          w-[90%] md:w-[50%] 
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
       
        <div className="flex items-center justify-baseline p-5 border-b">
        
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <CircleArrowRight size={30} color="blue"/>
          </button>
          <h2 className="text-3xl py-2 font-semibold">{title}</h2>
        </div>

    
        <div className="p-5 overflow-y-auto h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </>
  );
};

export default Drawer;
