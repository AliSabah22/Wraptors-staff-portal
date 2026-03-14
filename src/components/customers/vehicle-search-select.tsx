"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { VehicleCatalogOption } from "@/types";
import { ChevronDown, Car, X } from "lucide-react";

type VehicleSearchSelectProps = {
  options: VehicleCatalogOption[];
  value: VehicleCatalogOption | null;
  onSelect: (option: VehicleCatalogOption | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
};

/** Filters options by search string (year, make, or model). */
function filterOptions(options: VehicleCatalogOption[], query: string): VehicleCatalogOption[] {
  if (!query.trim()) return options;
  const q = query.trim().toLowerCase();
  return options.filter(
    (o) =>
      String(o.year).toLowerCase().includes(q) ||
      o.make.toLowerCase().includes(q) ||
      o.model.toLowerCase().includes(q)
  );
}

export function VehicleSearchSelect({
  options,
  value,
  onSelect,
  placeholder = "Search by year, brand, or model…",
  label = "Vehicle (optional)",
  disabled = false,
}: VehicleSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = filterOptions(options, search);
  const displayValue = value ? `${value.year} ${value.make} ${value.model}` : "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <div className="flex rounded-lg border border-wraptors-border bg-wraptors-charcoal focus-within:ring-2 focus-within:ring-wraptors-gold/50 focus-within:ring-offset-0">
          <span className="flex items-center pl-3 text-wraptors-muted">
            <Car className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={open ? search : displayValue}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              if (!value) setSearch("");
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="flex h-10 flex-1 rounded-r-lg border-0 bg-transparent px-3 py-2 text-sm text-white placeholder:text-wraptors-muted focus:outline-none focus:ring-0"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setSearch("");
                setOpen(false);
              }}
              className="flex items-center p-1 text-wraptors-muted hover:text-white"
              title="Clear selection"
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(!open);
              if (!open) setSearch(displayValue);
            }}
            className="flex items-center pr-2 text-wraptors-muted hover:text-wraptors-muted-light"
            tabIndex={-1}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </button>
        </div>

        {open && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-wraptors-border bg-wraptors-surface shadow-gold-glow">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-wraptors-muted">
                {options.length === 0
                  ? "Vehicle list will sync from database. Add one later."
                  : "No matches. Try year, brand, or model."}
              </div>
            ) : (
              <ul className="py-1">
                {filtered.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(opt);
                        setSearch("");
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-wraptors-surface-hover focus:bg-wraptors-surface-hover focus:outline-none"
                    >
                      <span className="font-medium text-wraptors-gold">{opt.year}</span>
                      <span>{opt.make}</span>
                      <span className="text-wraptors-muted-light">{opt.model}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
