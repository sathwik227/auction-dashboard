"use client";

import type { AuctionFilters } from "@/lib/types";

type FilterBarProps = {
  filters: AuctionFilters;
  states: string[];
  districts: string[];
  propertyTypes: string[];
  onChange: (next: AuctionFilters) => void;
  resultCount: number;
};

export function FilterBar({
  filters,
  states,
  districts,
  propertyTypes,
  onChange,
  resultCount,
}: FilterBarProps) {
  const set = (patch: Partial<AuctionFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        <p className="text-sm text-slate-600">
          {resultCount} propert{resultCount === 1 ? "y" : "ies"} shown
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Search</span>
          <input
            type="search"
            placeholder="Bank, city, ID…"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-400 focus:ring-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">State</span>
          <select
            value={filters.state}
            onChange={(e) => set({ state: e.target.value, district: "" })}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-400 focus:ring-2"
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">District</span>
          <select
            value={filters.district}
            onChange={(e) => set({ district: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-400 focus:ring-2"
            disabled={!filters.state && districts.length === 0}
          >
            <option value="">All districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Property type</span>
          <select
            value={filters.propertyType}
            onChange={(e) => set({ propertyType: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-400 focus:ring-2"
          >
            <option value="">All types</option>
            {propertyTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Min reserve (₹)</span>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => set({ minPrice: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-400 focus:ring-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Max reserve (₹)</span>
          <input
            type="number"
            min={0}
            placeholder="Any"
            value={filters.maxPrice}
            onChange={(e) => set({ maxPrice: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-400 focus:ring-2"
          />
        </label>
      </div>
    </section>
  );
}
