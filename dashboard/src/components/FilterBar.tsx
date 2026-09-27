"use client";

import { useState } from "react";
import type { AuctionFilters, SortOption } from "@/lib/types";

type FilterBarProps = {
  filters: AuctionFilters;
  states: string[];
  districts: string[];
  propertyTypes: string[];
  onChange: (next: AuctionFilters) => void;
  resultCount: number;
  totalCount: number;
};

const PRICE_PRESETS = [
  { label: "Any Price", min: "", max: "" },
  { label: "< ₹25 Lakhs", min: "", max: "2500000" },
  { label: "₹25L - ₹50L", min: "2500000", max: "5000000" },
  { label: "₹50L - ₹1 Cr", min: "5000000", max: "10000000" },
  { label: "> ₹1 Cr", min: "10000000", max: "" },
];

export function FilterBar({
  filters,
  states,
  districts,
  propertyTypes,
  onChange,
  resultCount,
  totalCount,
}: FilterBarProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const set = (patch: Partial<AuctionFilters>) =>
    onChange({ ...filters, ...patch });

  // Count how many active filter constraints exist
  const activeFilterCount = [
    Boolean(filters.state),
    Boolean(filters.district),
    Boolean(filters.propertyType),
    Boolean(filters.minPrice),
    Boolean(filters.maxPrice),
    Boolean(filters.query),
  ].filter(Boolean).length;

  const handleReset = () => {
    onChange({
      query: "",
      state: "",
      district: "",
      propertyType: "",
      minPrice: "",
      maxPrice: "",
      sortBy: filters.sortBy || "date-asc",
    });
  };

  const handlePresetPrice = (min: string, max: string) => {
    set({ minPrice: min, maxPrice: max });
  };

  const isPresetActive = (min: string, max: string) =>
    filters.minPrice === min && filters.maxPrice === max;

  return (
    <>
      {/* Search & Filter Header Container */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {/* Top Header Row */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Filter Properties</h2>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Showing <span className="font-semibold text-slate-900">{resultCount}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalCount}</span> properties
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset Filters
              </button>
            )}

            {/* Mobile Filter Drawer Button (Visible on mobile screens) */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 md:hidden"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-indigo-700">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Search & Sort Bar (Always visible on mobile & desktop) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search by Bank, City, District, or ID..."
              value={filters.query}
              onChange={(e) => set({ query: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
            {filters.query && (
              <button
                type="button"
                onClick={() => set({ query: "" })}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full sm:w-56">
            <select
              value={filters.sortBy || "date-asc"}
              onChange={(e) => set({ sortBy: e.target.value as SortOption })}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-8 text-sm font-medium text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="date-asc">Auction Date: Earliest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="bank-asc">Bank Name: A-Z</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Quick Price Presets Row */}
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          <span className="hidden items-center text-xs font-semibold text-slate-500 sm:inline-flex">
            Budget Presets:
          </span>
          {PRICE_PRESETS.map((p) => {
            const active = isPresetActive(p.min, p.max);
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePresetPrice(p.min, p.max)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Desktop Filter Form (Hidden on mobile, visible on md+) */}
        <div className="mt-4 hidden grid-cols-1 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 border-t border-slate-100 pt-4">
          {/* State */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">State</label>
            <div className="relative">
              <select
                value={filters.state}
                onChange={(e) => set({ state: e.target.value, district: "" })}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All States</option>
                {states.map((s) => (
                  <option key={s} value={s} className="bg-white text-slate-900">
                    {s}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* District */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">District</label>
            <div className="relative">
              <select
                value={filters.district}
                onChange={(e) => set({ district: e.target.value })}
                disabled={!filters.state && districts.length === 0}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d} className="bg-white text-slate-900">
                    {d}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Property Type</label>
            <div className="relative">
              <select
                value={filters.propertyType}
                onChange={(e) => set({ propertyType: e.target.value })}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All Property Types</option>
                {propertyTypes.map((t) => (
                  <option key={t} value={t} className="bg-white text-slate-900">
                    {t}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Reserve Price Range (Min & Max) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Reserve Price Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min ₹"
                value={filters.minPrice}
                onChange={(e) => set({ minPrice: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
              <input
                type="number"
                min={0}
                placeholder="Max ₹"
                value={filters.maxPrice}
                onChange={(e) => set({ maxPrice: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Chips / Badges Bar (Mobile & Desktop) */}
        {activeFilterCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs font-semibold text-slate-500">Active Filters:</span>
            {filters.state && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                State: {filters.state}
                <button type="button" onClick={() => set({ state: "", district: "" })} className="hover:text-indigo-900">
                  ×
                </button>
              </span>
            )}
            {filters.district && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                District: {filters.district}
                <button type="button" onClick={() => set({ district: "" })} className="hover:text-indigo-900">
                  ×
                </button>
              </span>
            )}
            {filters.propertyType && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                Type: {filters.propertyType}
                <button type="button" onClick={() => set({ propertyType: "" })} className="hover:text-indigo-900">
                  ×
                </button>
              </span>
            )}
            {filters.minPrice && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                Min: ₹{Number(filters.minPrice).toLocaleString("en-IN")}
                <button type="button" onClick={() => set({ minPrice: "" })} className="hover:text-indigo-900">
                  ×
                </button>
              </span>
            )}
            {filters.maxPrice && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                Max: ₹{Number(filters.maxPrice).toLocaleString("en-IN")}
                <button type="button" onClick={() => set({ maxPrice: "" })} className="hover:text-indigo-900">
                  ×
                </button>
              </span>
            )}
            {filters.query && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                Search: "{filters.query}"
                <button type="button" onClick={() => set({ query: "" })} className="hover:text-indigo-900">
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* MOBILE FILTER BOTTOM SHEET / SLIDE-OVER DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs md:hidden">
          {/* Backdrop Click */}
          <div
            className="flex-1"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Container */}
          <div className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl transition-drawer animate-in slide-in-from-bottom">
            {/* Drawer Header */}
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Filter Properties</h3>
                <p className="text-xs text-slate-500">Refine auction results by location, type & budget</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Fields */}
            <div className="space-y-4">
              {/* State Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">State</label>
                <div className="relative">
                  <select
                    value={filters.state}
                    onChange={(e) => set({ state: e.target.value, district: "" })}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 shadow-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">All States</option>
                    {states.map((s) => (
                      <option key={s} value={s} className="bg-white text-slate-900">
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* District Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">District</label>
                <div className="relative">
                  <select
                    value={filters.district}
                    onChange={(e) => set({ district: e.target.value })}
                    disabled={!filters.state && districts.length === 0}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 shadow-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d} className="bg-white text-slate-900">
                        {d}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Property Type Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Property Type</label>
                <div className="relative">
                  <select
                    value={filters.propertyType}
                    onChange={(e) => set({ propertyType: e.target.value })}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 shadow-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">All Types</option>
                    {propertyTypes.map((t) => (
                      <option key={t} value={t} className="bg-white text-slate-900">
                        {t}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Budget Quick Select */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Budget Range</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRICE_PRESETS.map((p) => {
                    const active = isPresetActive(p.min, p.max);
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handlePresetPrice(p.min, p.max)}
                        className={`rounded-xl py-2.5 text-xs font-semibold transition ${
                          active
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Min / Max Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Min Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 1000000"
                    value={filters.minPrice}
                    onChange={(e) => set({ minPrice: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Max Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 5000000"
                    value={filters.maxPrice}
                    onChange={(e) => set({ maxPrice: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 rounded-xl border border-slate-300 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex-[2] rounded-xl bg-indigo-600 py-3 text-center text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-98"
              >
                Show {resultCount} Properties
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
