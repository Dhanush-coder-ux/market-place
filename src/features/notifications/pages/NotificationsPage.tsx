import { useState, useEffect } from "react";
import { notificationApi } from "@/services/api/notification";
import { 
  Bell, 
  Trash2, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

// Define local shape based on what the API returns
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: string; // info, warning, error, success
  created_at?: string;
}

const getIconForType = (type?: string) => {
  switch (type?.toLowerCase()) {
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case "error":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "success":
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    case "info":
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const getBgColorForType = (type?: string) => {
  switch (type?.toLowerCase()) {
    case "warning":
      return "bg-amber-50 border-amber-200";
    case "error":
      return "bg-red-50 border-red-200";
    case "success":
      return "bg-emerald-50 border-emerald-200";
    case "info":
    default:
      return "bg-blue-50 border-blue-200";
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { showToast } = useToast();

  // We fetch by the user_id from localStorage
  const userId = localStorage.getItem("user_id") || "unknown_user";

  const loadNotifications = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await notificationApi.getNotifications(userId);
      let actualData = res;
      if (res && typeof res === 'object' && !Array.isArray(res)) {
        if ('data' in res) actualData = res.data;
        else if ('datas' in res) actualData = res.datas;
      }
      setNotifications(Array.isArray(actualData) ? actualData : []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      showToast("Could not load notifications", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast("Notification dismissed", "success");
    } catch (error) {
      console.error("Delete failed:", error);
      showToast("Failed to dismiss notification", "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Stay updated with your latest alerts and activities.
          </p>
        </div>
        
        <button 
          onClick={() => loadNotifications(true)}
          disabled={loading || isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Feed Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading your notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
              <Bell className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">All Caught Up!</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              You don't have any unread notifications right now. Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {notifications.map((notif) => {
              const bgColor = getBgColorForType(notif.type);
              
              return (
                <div 
                  key={notif.id}
                  className={`group relative flex items-start gap-4 p-4 md:p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${bgColor}`}
                >
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5 bg-white p-2 rounded-full shadow-sm">
                    {getIconForType(notif.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-slate-800 text-sm md:text-base pr-8">
                        {notif.title}
                      </h4>
                      {notif.created_at && (
                        <span className="shrink-0 text-xs font-semibold text-slate-400 whitespace-nowrap hidden sm:block">
                          {new Date(notif.created_at).toLocaleString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    
                    {/* Mobile time */}
                    {notif.created_at && (
                      <span className="block sm:hidden text-xs font-semibold text-slate-400 mt-3">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDelete(notif.id)}
                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                    aria-label="Dismiss notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
