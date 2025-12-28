import React from 'react'
import type { ChartCardProp } from '../types'


const ChartCard:React.FC<ChartCardProp> = ({children,title}) => {
  return (
  <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">{title} </h2>
            
            </div>
            
            <div className="w-full h-[400px]">
               {children}
            </div>
          </div>
        </div>
  )
}

export default ChartCard
