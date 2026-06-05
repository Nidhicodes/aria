"use client";

import { useState } from "react";

/**
 * Instrument-calibration slider — precise, with the exact value in monospace.
 * Custom track so it feels like dialing in an instrument, not a web form.
 */
export function InstrumentSlider({
  label,
  min,
  max,
  step,
  unit,
  defaultValue,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-ink-mid">{label}</span>
        <span className="font-mono text-[12px] tracking-data text-amber">
          {value}
          <span className="ml-0.5 text-[9px] text-ink-lo">{unit}</span>
        </span>
      </div>
      <div className="relative mt-2 h-5">
        <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-hair" />
        <div
          className="absolute top-1/2 h-px -translate-y-1/2 bg-amber/60"
          style={{ width: `${pct}%` }}
        />
        {/* Tick marks */}
        <div className="absolute top-1/2 flex w-full -translate-y-1/2 justify-between">
          {Array.from({ length: 11 }).map((_, i) => (
            <span key={i} className="h-1.5 w-px bg-ink-faint" />
          ))}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label={label}
          className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-amber"
        />
      </div>
    </div>
  );
}
