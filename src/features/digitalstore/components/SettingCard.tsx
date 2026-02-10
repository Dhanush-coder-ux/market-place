export const SettingsCard = ({
  title,
  subtitle,
  icon: Icon,
  enabled,
  onToggle,
  color,
  children,
}: any) => {
  return (
    <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div
        className={`flex items-center justify-between px-6 py-4 border-b bg-${color}-50`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`text-${color}-600`} size={20} />
          <div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition" />
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5" />
        </label>
      </div>

      {enabled && <div className="p-6 space-y-6">{children}</div>}
    </section>
  );
};