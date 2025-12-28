import React from 'react'

type FormCardProps ={
    children:React.ReactNode
}
const FormCard:React.FC<FormCardProps> = ({children}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-700">
       <div className="bg-white rounded-[32px] shadow-2xl shadow-blue-100/50 border border-gray-100 overflow-y-auto">
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />
        
          <div className="p-8 md:p-12 space-y-10">
          {children}
          </div>
        </div>
    </div>
  )
}

export default FormCard
