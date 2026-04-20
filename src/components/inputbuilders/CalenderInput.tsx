import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getYear, getMonth } from "date-fns";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

interface CustomDatePickerProps {
  name: string; value: string; Lable?: string;
  required?: boolean;
  onChange: (e: { target: { name: string; value: string } }) => void;
}

function ensurePortalRoot() {
  const id = "cdp-portal-root";
  if (document.getElementById(id)) return;
  const el = document.createElement("div");
  el.id = id;
  document.body.appendChild(el);
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ name, value, Lable,required, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = !!value;
  const years = range(1950, getYear(new Date()) + 5);

  useEffect(() => { ensurePortalRoot(); }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        .cdp-wrapper { font-family: 'DM Sans', sans-serif; position: relative; width: 100%; }
        .cdp-field   { position: relative; display: flex; flex-direction: column; }

        .cdp-label {
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: #475569; margin-bottom: 7px;
          transition: color 0.18s ease; user-select: none;
        }
        .cdp-label.focused   { color: #4f46e5; }
        .cdp-label.has-value { color: #334155; }

        /* FIX: position: relative on wrapper so clear button is anchored here, not recalculated */
        .cdp-input-wrapper { position: relative; display: flex; align-items: center; }

        .cdp-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          pointer-events: none; z-index: 1; transition: color 0.18s ease; color: #64748b;
        }
        .cdp-icon.focused { color: #4f46e5; }

        .cdp-wrapper .react-datepicker-wrapper { width: 100%; }
        .cdp-wrapper .react-datepicker__input-container { width: 100%; }

        .cdp-wrapper .react-datepicker__input-container input {
          width: 100%; padding: 11px 14px 11px 42px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 400; color: #0f172a;
          background: #fff; border: 1.5px solid #868687; border-radius: 10px;
          outline: none; transition: border-color 0.2s cubic-bezier(0.4,0,0.2,1),
                                     box-shadow 0.2s cubic-bezier(0.4,0,0.2,1);
          /* FIX: always reserve shadow space with a transparent shadow — prevents layout shift */
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 3.5px transparent;
          cursor: pointer;
        }
        .cdp-wrapper .react-datepicker__input-container input::placeholder {
          color: #94a3b8; font-size: 14px; font-weight: 400;
        }
        .cdp-wrapper .react-datepicker__input-container input:hover:not(:focus) {
          border-color: #a5b4fc;
          /* FIX: keep same shadow layers, only change the visible values */
          box-shadow: 0 2px 6px rgba(0,0,0,0.07), 0 0 0 3.5px transparent;
        }
        .cdp-wrapper .react-datepicker__input-container input:focus {
          border-color: #6366f1;
          /* FIX: transition into the ring — no new layer added, no layout jump */
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 3.5px rgba(99,102,241,0.15);
        }

        /* ── Popper portal ── */
        .cdp-portal { z-index: 9999 !important; }

        .cdp-portal .react-datepicker {
          font-family: 'DM Sans', sans-serif !important;
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 14px !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06) !important;
          overflow: hidden; padding: 4px;
        }
        .cdp-portal .react-datepicker__header {
          background: #f8fafc !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 14px 16px 10px;
          border-radius: 10px 10px 0 0;
        }
        .cdp-portal .react-datepicker__day-name {
          font-size: 11px; font-weight: 600; color: #64748b;
          letter-spacing: 0.06em; text-transform: uppercase; width: 32px; line-height: 28px;
        }
        .cdp-portal .react-datepicker__day {
          width: 32px; height: 32px; line-height: 32px;
          font-size: 13px; font-weight: 500; color: #1e293b;
          border-radius: 8px; transition: all 0.15s ease;
        }
        .cdp-portal .react-datepicker__day:hover      { background: #eef2ff !important; color: #4338ca !important; }
        .cdp-portal .react-datepicker__day--selected  { background: #6366f1 !important; color: #fff !important; font-weight: 600; box-shadow: 0 2px 6px rgba(99,102,241,0.4); }
        .cdp-portal .react-datepicker__day--today     { font-weight: 700; color: #4f46e5; background: #eef2ff; }
        .cdp-portal .react-datepicker__day--today.react-datepicker__day--selected { color: #fff !important; }
        .cdp-portal .react-datepicker__day--outside-month { color: #94a3b8; font-weight: 400; }
        .cdp-portal .react-datepicker__navigation { top: 14px; }
        .cdp-portal .react-datepicker__navigation-icon::before {
          border-color: #6366f1; border-width: 2px 2px 0 0; width: 7px; height: 7px;
        }
        .cdp-portal .react-datepicker__triangle { display: none !important; }

        /* Custom header */
        .cdp-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 2px 4px; gap: 6px;
        }
        .cdp-nav-btn {
          width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
          border: none; background: transparent; border-radius: 6px;
          cursor: pointer; color: #4f46e5; flex-shrink: 0; transition: background 0.15s;
        }
        .cdp-nav-btn:hover { background: #eef2ff; }
        .cdp-selects { display: flex; gap: 6px; flex: 1; justify-content: center; }
        .cdp-select {
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          color: #1e293b; background: #fff; border: 1.5px solid #cbd5e1;
          border-radius: 7px; padding: 4px 22px 4px 6px; outline: none; cursor: pointer;
          /* FIX: pre-reserve focus ring space so it never pushes layout */
          box-shadow: 0 0 0 3px transparent;
          transition: border-color 0.15s, box-shadow 0.15s;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%234f46e5' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 6px center;
        }
        .cdp-select:focus {
          border-color: #6366f1;
          /* FIX: shadow was already 0px wide, now just fills in — no size change, no jitter */
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .cdp-select-month { min-width: 90px; }
        .cdp-select-year  { min-width: 66px; }

        /* Clear button */
        .cdp-clear {
          position: absolute; right: 12px;
          /* FIX: use top + margin-top instead of transform so it never triggers a repaint-shift */
          top: 50%; margin-top: -10px;
          width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
          border-radius: 50%; cursor: pointer; color: #64748b; background: transparent;
          border: none; padding: 0; transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
          opacity: 0; pointer-events: none; z-index: 2;
        }
        .cdp-clear.visible { opacity: 1; pointer-events: all; }
        .cdp-clear:hover   { background: #fee2e2; color: #ef4444; }
      `}</style>

      <div className="cdp-wrapper">
        <div className="cdp-field">
            {Lable && (
        <label 
          htmlFor={name} 
          className="text-xs mb-1 font-semibold text-slate-600 ml-0.5"
        >
          {Lable}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
          <div className="cdp-input-wrapper">
            <span className={`cdp-icon ${isFocused ? "focused" : ""}`}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 1.5V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 1.5V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M1.5 6.5H13.5" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="5" cy="9.5" r="0.75" fill="currentColor"/>
                <circle cx="7.5" cy="9.5" r="0.75" fill="currentColor"/>
                <circle cx="10" cy="9.5" r="0.75" fill="currentColor"/>
              </svg>
            </span>

            <DatePicker
              selected={value ? new Date(value + "T00:00:00") : null}
              dateFormat="yyyy-MM-dd"
              placeholderText="yyyy-MM-dd"
              onCalendarOpen={() => setIsFocused(true)}
              onCalendarClose={() => setIsFocused(false)}
              portalId="cdp-portal-root"
              popperClassName="cdp-portal"
              popperPlacement="bottom-start"
              onChange={(date: Date | null) => {
                if (!date) return onChange({ target: { name, value: "" } });
                const y = date.getFullYear();
                const mo = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                onChange({ target: { name, value: `${y}-${mo}-${d}` } });
              }}
              renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                <div className="cdp-header">
                  <button className="cdp-nav-btn" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type="button">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="cdp-selects">
                    <select className="cdp-select cdp-select-month" value={MONTHS[getMonth(date)]}
                      onChange={({ target: { value } }) => changeMonth(MONTHS.indexOf(value))}>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select className="cdp-select cdp-select-year" value={getYear(date)}
                      onChange={({ target: { value } }) => changeYear(Number(value))}>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <button className="cdp-nav-btn" onClick={increaseMonth} disabled={nextMonthButtonDisabled} type="button">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            />

            <button type="button" className={`cdp-clear ${hasValue ? "visible" : ""}`}
              onClick={() => onChange({ target: { name, value: "" } })} tabIndex={-1} aria-label="Clear date">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};