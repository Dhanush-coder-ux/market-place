import { useEffect, useState } from "react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { Search, RefreshCw, X } from "lucide-react";
import { format } from "date-fns";

export const ActivityLogPage = () => {
  const { getData } = useApi();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getData(`${ENDPOINTS.UTILITIES}/activity-logs/${SHOP_ID}`, {
        limit: "100"
      });
      if (res && res.data) {
        setLogs(res.data);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case "CREATE_MANUAL": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "UPDATE": return "text-blue-600 bg-blue-50 border-blue-200";
      case "EXPORT": return "text-slate-600 bg-slate-50 border-slate-200";
      default: return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="bg-white md:rounded-lg border-y md:border border-slate-200 shadow-sm overflow-hidden h-[600px] flex flex-col relative">
      {/* Header & Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Activity Logs
          </h3>
          <p className="text-[13px] text-slate-500 mt-1">Track user actions and system changes across the CRM.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
          <button 
            onClick={fetchLogs}
            className="p-2 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-6 whitespace-nowrap">User</th>
              <th className="py-3 px-6 whitespace-nowrap">Action</th>
              <th className="py-3 px-6 whitespace-nowrap">Entity Type</th>
              <th className="py-3 px-6 whitespace-nowrap">Date & Time</th>
              <th className="py-3 px-6 whitespace-nowrap text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">Loading activity logs...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No activity logs found.</td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-semibold text-slate-700 whitespace-nowrap">
                    {log.user_name || "Unknown User"}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-1 rounded border font-bold tracking-wide ${getActionColor(log.action)}`}>
                      {log.action?.toUpperCase() || "UPDATE"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 uppercase">{log.entity_type}</span>
                      <span className="text-[11px] text-slate-400">ID: {log.entity_id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 whitespace-nowrap">
                    {log.created_at ? format(new Date(log.created_at), "MMM dd, yyyy, hh:mm:ss a") : "-"}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    {log.changes && log.changes.length > 0 ? (
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline decoration-blue-200 underline-offset-4"
                      >
                        View Details
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal overlay */}
      {selectedLog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2 text-slate-800">
                <Activity className="w-4 h-4 text-blue-500" />
                Action Details
              </h3>
              <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50 flex-1">
              {selectedLog.changes?.map((change: any, i: number) => (
                <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="w-full md:w-1/3">
                    <p className="text-sm font-bold text-slate-700">{change.field}</p>
                  </div>
                  
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    {/* Before */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider">BEFORE</span>
                      <div className="bg-rose-50 text-rose-600 border border-rose-100 text-xs px-3 py-2 rounded-lg font-mono break-all">
                        {change.before}
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="hidden sm:flex text-slate-300">
                      →
                    </div>
                    
                    {/* After */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider">AFTER</span>
                      <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs px-3 py-2 rounded-lg font-mono break-all">
                        {change.after}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Activity Icon definition (since it was missing from lucide imports above)
const Activity = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>
  </svg>
);

export default ActivityLogPage;
