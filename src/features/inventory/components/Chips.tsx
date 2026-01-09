
interface ChipProps {
    label:string
    action:string
    dot:string
}
const Chips = ({label,action,dot}:ChipProps) => {
  return (
   <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-sm shadow-sm animate-in fade-in zoom-in duration-200">
     
          <span className={`w-2 h-2 rounded-full bg-${dot}-500 shadow-sm shadow-red-200`}></span>
          
          <span className="font-semibold text-gray-700">{label}</span>
         
          <span className="text-gray-400 text-xs">›</span>
      
          <button className="text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium">
           {action}
          </button>
        </div>
  )
}

export default Chips
