import { useTheme, THEME_REGISTRY, type ThemeId } from "@/context/ThemeContext";
import { Check, Palette } from "lucide-react";

/**
 * ThemeSwitcher — a compact, beautiful settings card that lets the user
 * toggle between the registered themes.  Drop it into any settings page.
 */
export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const themes = Object.values(THEME_REGISTRY);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-slate-50/80 to-white">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--t-primary-lighter)' }}
          >
            <Palette size={17} style={{ color: 'var(--t-primary)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Theme & Appearance
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Choose your preferred colour scheme. Changes apply instantly across all pages.
            </p>
          </div>
        </div>
      </div>

      {/* Theme Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {themes.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as ThemeId)}
                className={`group relative flex flex-col rounded-2xl border-2 p-5 text-left cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "ring-4 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                }`}
                style={
                  isActive
                    ? {
                        borderColor: 'var(--t-primary)',
                        backgroundColor: 'var(--t-primary-lighter)',
                        boxShadow: `0 0 0 4px color-mix(in srgb, var(--t-primary) 8%, transparent)`,
                      }
                    : undefined
                }
              >
                {/* Check indicator */}
                {isActive && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--t-primary)' }}
                  >
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Swatches */}
                <div className="flex items-center gap-1.5 mb-3">
                  {t.swatches.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-white/50 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Label */}
                <span className="text-sm font-bold text-slate-800 mb-0.5">
                  {t.label}
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed">
                  {t.description}
                </span>

                {/* Active indicator bar */}
                {isActive && (
                  <div
                    className="mt-3 h-1 w-full rounded-full"
                    style={{ background: `linear-gradient(to right, ${t.swatches[0]}, ${t.swatches[2] || t.swatches[1]})` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Info note */}
        <div
          className="mt-5 p-4 rounded-xl border flex gap-2.5 max-w-2xl"
          style={{
            backgroundColor: 'var(--t-primary-lighter)',
            borderColor: 'var(--t-primary-light)',
          }}
        >
          <Palette size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--t-primary)' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--t-primary-hover)' }}>
            <strong>Centralised Theming:</strong> Your selection is saved locally and applies to
            the sidebar, buttons, active tabs, badges, and all accent colours across every page.
          </p>
        </div>
      </div>
    </div>
  );
};
