import React from 'react'
import type { keyMetricProp } from '../types'

const KeyMetric: React.FC<keyMetricProp> = ({children}) => {
  return (
 <div className="flex flex-col gap-6 lg:col-span-1">
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Key Metrics</h2>
            <div className="flex flex-col gap-4">
                {children}
            </div>
          </div>
        </div>
  )
}

export default KeyMetric
