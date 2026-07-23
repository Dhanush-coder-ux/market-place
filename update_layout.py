import re

with open("src/features/Setting/pages/ActivityLogPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace root div
content = content.replace(
    '<div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">',
    '<div className="h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0">'
)

# Replace everything from {/* ── Header ── */} to {/* ── Log list ── */}
# Note: Python's re.DOTALL helps match across multiple lines
pattern = re.compile(r'\{\/\*\s*──\s*Header\s*──\s*\*\/}.*?\{\/\*\s*──\s*Log list\s*──\s*\*\/}', re.DOTALL)

replacement = """{/* ── Compact Header ── */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-white shrink-0">
        
        {/* Left: Title & Compact Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Activity size={14} className="text-blue-500" />
            </div>
            <h1 className="text-sm font-semibold text-slate-800">Activity Log</h1>
          </div>
          <div className="hidden md:flex items-center gap-3 border-l border-slate-200 pl-4 text-[11px] text-slate-500">
            <span><strong className="font-medium text-slate-700">{logs.length}</strong> Total</span>
            <span><strong className="font-medium text-emerald-600">{logs.filter((l) => l.action?.toUpperCase().includes("CREATE")).length}</strong> Creates</span>
            <span><strong className="font-medium text-blue-600">{logs.filter((l) => l.action?.toUpperCase() === "UPDATE").length}</strong> Updates</span>
          </div>
        </div>

        {/* Right: Filters, Search, Refresh */}
        <div className="flex items-center gap-2.5 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 hide-scrollbar">
          {/* Action filters */}
          <div className="flex items-center gap-1.5 shrink-0">
            {uniqueActions.map((action) => {
              const config = action === "ALL" ? null : getAction(action);
              const isActive = filterAction === action;
              return (
                <button
                  key={action}
                  onClick={() => setFilterAction(action)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                    isActive
                      ? action === "ALL"
                        ? "bg-slate-800 text-white shadow-sm ring-1 ring-inset ring-slate-800"
                        : `${config?.color}`
                      : "bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {action === "ALL" ? "All" : (config?.label ?? action)}
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-slate-200 shrink-0 mx-1 hidden sm:block"></div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-3 py-1 h-7 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all w-36 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchLogs}
            title="Refresh"
            className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 transition-all shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Log list ── */}"""

content = pattern.sub(replacement, content)

content = content.replace(
    '<div className="flex-1 overflow-auto min-h-[420px] max-h-[520px]">',
    '<div className="flex-1 overflow-auto min-h-0 bg-white">'
)

content = content.replace(
    '<tr className="bg-slate-50/80 backdrop-blur border-b border-slate-100">',
    '<tr className="bg-slate-50 border-b border-slate-100">'
)

with open("src/features/Setting/pages/ActivityLogPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
