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
    });
  }, [initialRecords, filters]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          AP & Telangana
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Bank property auctions
        </h1>
        <p className="max-w-2xl text-slate-600">
          Live and upcoming reserve-price auctions from IBAPI, MSTC, and SBI
          AuctionTiger sources. Data refreshes daily via GitHub Actions.
        </p>
      </header>

      <FilterBar
        filters={filters}
        states={states}
        districts={districts}
        propertyTypes={propertyTypes}
        onChange={setFilters}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          No auctions match your filters. Try clearing search criteria or run the
          scraper to refresh <code className="text-sm">data/auctions.json</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((auction) => (
            <PropertyCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
