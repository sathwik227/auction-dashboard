"use client";

import { useMemo, useState } from "react";

import { filterAuctions, uniqueSorted } from "@/lib/auctions";
import type { AuctionRecord } from "@/lib/types";
import { emptyFilters } from "@/lib/types";

import { FilterBar } from "./FilterBar";
import { PropertyCard } from "./PropertyCard";

type AuctionDashboardProps = {
  initialRecords: AuctionRecord[];
};

export function AuctionDashboard({ initialRecords }: AuctionDashboardProps) {
  const [filters, setFilters] = useState(emptyFilters);

  const states = useMemo(
    () => uniqueSorted(initialRecords.map((r) => r.state)),
    [initialRecords],
  );

  const propertyTypes = useMemo(
    () => uniqueSorted(initialRecords.map((r) => r.propertyType)),
    [initialRecords],
  );

  const districts = useMemo(() => {
    const pool = filters.state
      ? initialRecords.filter((r) => r.state === filters.state)
      : initialRecords;
    return uniqueSorted(pool.map((r) => r.district));
  }, [initialRecords, filters.state]);

  const filtered = useMemo(() => {
    const minPrice = filters.minPrice ? Number(filters.minPrice) : null;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;
    return filterAuctions(initialRecords, {
      query: filters.query,
      state: filters.state,
      district: filters.district,
      propertyType: filters.propertyType,
      minPrice: Number.isFinite(minPrice) ? minPrice : null,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
      sortBy: filters.sortBy,
    });
  }, [initialRecords, filters]);

  // Compute stat highlights
  const stats = useMemo(() => {
    const eAuctionCount = initialRecords.filter(
      (r) => r.source === "eauctiondekho",
    ).length;
    const baanknetCount = initialRecords.filter(
      (r) => r.source === "baanknet",
    ).length;
    const districtCount = uniqueSorted(
      initialRecords.map((r) => r.district),
    ).length;

    return {
      total: initialRecords.length,
      eAuctionCount,
      baanknetCount,
      districtCount,
    };
  }, [initialRecords]);

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* App Header & Branding */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Auctions
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              AP & Telangana
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Bank Property Auctions
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Live and upcoming reserve-price auctions from eAuctionDekho and BaankNet.
          </p>
        </div>

        {/* Quick Stat Pill Cards */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-2xs">
            <p className="text-xs font-medium text-slate-500">Total Properties</p>
            <p className="text-lg font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-2xs">
            <p className="text-xs font-medium text-slate-500">Districts Covered</p>
            <p className="text-lg font-bold text-indigo-600">{stats.districtCount}</p>
          </div>
        </div>
      </header>

      {/* Filter Toolbar */}
      <FilterBar
        filters={filters}
        states={states}
        districts={districts}
        propertyTypes={propertyTypes}
        onChange={setFilters}
        resultCount={filtered.length}
        totalCount={initialRecords.length}
      />

      {/* Auction Property Cards Grid / Empty State */}
      {filtered.length === 0 ? (
        <div className="my-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            No auction properties found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            No properties match your current filter selection. Try adjusting your search query, state, or reserve price range.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filtered.map((auction) => (
            <PropertyCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
