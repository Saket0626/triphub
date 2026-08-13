"use client";

import { searchAirports } from "@/lib/airports";
import { airportLabel } from "@/lib/airports";
import { Input } from "@/components/ui/input";
import type { Airport } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";

export function AirportAutocomplete({
  id,
  valueLabel,
  onChange,
  placeholder,
}: {
  id: string;
  valueCode?: string;
  valueLabel: string;
  onChange: (airport: Airport | null) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState(valueLabel);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(valueLabel);
  }, [valueLabel]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => searchAirports(query), [query]);

  return (
    <div ref={box} className="relative">
      <Input
        id={id}
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
      />
      {open ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-white p-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No airports match that search.</li>
          ) : (
            results.map((airport) => (
              <li key={airport.code}>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary focus-visible:bg-secondary"
                  onClick={() => {
                    onChange(airport);
                    setQuery(airportLabel(airport));
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{airport.city}</span>{" "}
                  <span className="text-muted-foreground">({airport.code})</span>
                  <span className="block text-xs text-muted-foreground">{airport.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function Stepper({
  value,
  min = 0,
  max = 9,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-8 w-8 rounded-full border border-border hover:bg-secondary focus-visible:ring-2 focus-visible:ring-chart"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-6 text-center font-medium">{value}</span>
        <button
          type="button"
          className="h-8 w-8 rounded-full border border-border hover:bg-secondary focus-visible:ring-2 focus-visible:ring-chart"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function DualSlider({
  min,
  max,
  step = 25,
  value,
  onChange,
  format = (n: number) => `$${n}`,
}: {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  format?: (n: number) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span>{format(value[0])}</span>
        <span>{format(value[1])}</span>
      </div>
      <div className="grid gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            const next = Number(e.target.value);
            onChange([Math.min(next, value[1]), value[1]]);
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => {
            const next = Number(e.target.value);
            onChange([value[0], Math.max(next, value[0])]);
          }}
        />
      </div>
    </div>
  );
}
