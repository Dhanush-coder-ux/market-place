import { useState } from "react";
import { 
  Bell, 
  Trash2, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle, 
  CheckCheck,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useToast } from "@/context/ToastContext";

const getIconForType = (type?: string) => {
  switch (type?.toLowerCase()) {
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case "error":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "success":
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    case "announcement":
      return <Sparkles className="w-5 h-5 text-purple-500" />;
    case "info":
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const getBgColorForType = (type?: string, isRead?: boolean) => {
  if (isRead) {
    return "bg-slate-50/70 border-slate-200/60 opacity-80 hover:opacity-100";
  }
  switch (type?.toLowerCase()) {
    case "warning":
      return "bg-amber-50/80 border-amber-200 shadow-amber-50/50";
    case "error":
      return "bg-red-50/80 border-red-200 shadow-red-50/50";
    case "success":
      return "bg-emerald-50/80 border-emerald-200 shadow-emerald-50/50";
    case "announcement":
      return "bg-purple-50/80 border-purple-200 shadow-purple-50/50";
    case "info":
    default:
      return "bg-blue-50/80 border-blue-200 shadow-blue-50/50";
  }
};

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications, 
    refreshNotifications 
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showToast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshNotifications();
      showToast("Notifications refreshed", "success");
    } catch {
      showToast("Could not refresh notifications", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      showToast("All notifications marked as read", "success");
    } catch {
      showToast("Failed to mark all as read", "error");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await clearAllNotifications();
      showToast("All notifications cleared", "success");
    } catch {
      showToast("Failed to clear notifications", "error");
    }
  };

  const handleItemClick = async (notifId: string, isRead?: boolean) => {
    if (!isRead) {
      await markAsRead(notifId);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      showToast("Notification dismissed", "success");
    } catch {
      showToast("Failed to dismiss notification", "error");
    }
  };

  const filteredNotifications = activeTab === "unread" 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              Notifications
            </h1>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm" title="Real-time WebSocket connection active">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Wifi className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm" title="Connecting to WebSocket server...">
                <WifiOff className="w-3 h-3" /> Connecting...
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Stay updated with your latest alerts, real-time activities, and announcements.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-100 transition-all shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-sm rounded-xl hover:bg-rose-100 transition-all shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab("unread")}
          className={`relative px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "unread"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className={`ml-2 px-1.5 py-0.2 rounded-full text-xs font-black ${activeTab === "unread" ? "bg-white text-blue-600" : "bg-blue-100 text-blue-700"}`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100 shadow-inner">
              <Bell className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              {activeTab === "unread" ? "No unread notifications" : "All Caught Up!"}
            </h3>
            <p className="text-slate-500 text-sm max-w-sm">
              {activeTab === "unread" 
                ? "You have read all notifications. Switch to 'All' tab to view past history."
                : "You don't have any notifications right now. Alerts will appear here in real-time."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredNotifications.map((notif) => {
              const isRead = notif.is_read ?? false;
              const bgColor = getBgColorForType(notif.type, isRead);
              
              return (
                <div 
                  key={notif.id}
                  onClick={() => handleItemClick(notif.id, isRead)}
                  className={`group relative flex items-start gap-4 p-4 md:p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${bgColor}`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 mt-0.5 p-2 rounded-full shadow-sm bg-white ${!isRead ? 'ring-2 ring-blue-400/50' : ''}`}>
                    {getIconForType(notif.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2 pr-8">
                        <h4 className={`font-bold text-sm md:text-base ${isRead ? 'text-slate-700' : 'text-slate-900 font-extrabold'}`}>
                          {notif.title}
                        </h4>
                        {!isRead && (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" title="Unread"></span>
                        )}
                      </div>

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
                    
                    <p className={`text-sm mt-1 leading-relaxed ${isRead ? 'text-slate-500' : 'text-slate-700'}`}>
                      {notif.message}
                    </p>
                    
                    {/* Mobile timestamp */}
                    {notif.created_at && (
                      <span className="block sm:hidden text-xs font-semibold text-slate-400 mt-2">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Dismiss notification"
                      aria-label="Dismiss notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
