"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ReusableComboboxProps } from "../types"



export function ReusableCombobox({
  options = [],
  value = "",
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
}: ReusableComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between rounded-xl border-gray-200 h-12 px-4 hover:bg-gray-50 hover:border-blue-400 transition-all shadow-sm font-medium",
            className
          )}
        >
          <span className="truncate">
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-blue-500" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="start"
       
        className="w-[--radix-popover-trigger-width] p-0 rounded-2xl shadow-2xl border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <Command className="rounded-2xl">
          <div className="flex items-center  px-3 bg-white">
            <CommandInput 
                placeholder={searchPlaceholder} 
                className="h-11 border-none focus:ring-0" 
            />
          </div>
          <CommandList className="max-h-64 scrollbar-thin scrollbar-thumb-gray-200">
            <CommandEmpty className="py-6 text-center text-sm text-gray-500 italic">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup className="p-1.5">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="px-3 py-2.5 rounded-lg cursor-pointer flex items-center justify-between aria-selected:bg-blue-600 aria-selected:text-white transition-all group mb-1 last:mb-0"
                >
                  <div className="flex items-center overflow-hidden">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 transition-all",
                        value === option.value ? "opacity-100 scale-100" : "opacity-0 scale-50"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}