import { useEffect, useState } from 'react';
import { LogOut, RefreshCw, AlertCircle } from 'lucide-react';

export default function SessionExpiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [resolver, setResolver] = useState<((val: boolean) => void) | null>(null);

  useEffect(() => {
    const handleSessionExpired = (e: Event) => {
      const customEvent = e as CustomEvent<{ resolve: (val: boolean) => void }>;
      setResolver(() => customEvent.detail.resolve);
      setIsOpen(true);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const handleAction = (restart: boolean) => {
    if (resolver) resolver(restart);
    setIsOpen(false);
    setResolver(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => handleAction(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        
        {/* Header Decor */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
        
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm ring-1 ring-slate-100">
              <AlertCircle size={28} className="text-amber-500" />
            </div>
            
            <h2 className="text-lg font-black text-slate-800 mb-2">Session Expired</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
              Your session has expired due to inactivity. Would you like to restart your session or log out?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleAction(true)}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm hover:shadow-blue-500/25"
            >
              <RefreshCw size={16} />
              Restart Session
            </button>
            <button
              onClick={() => handleAction(false)}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-200 rounded-xl font-bold transition-all active:scale-[0.98]"
            >
              <LogOut size={16} className="text-slate-400" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
