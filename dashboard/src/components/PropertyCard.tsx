"use client";

import { useState } from "react";
import { detailLinkLabel, formatInr, formatInrShort } from "@/lib/auctions";
import type { AuctionRecord } from "@/lib/types";

const sourceStyles: Record<
  AuctionRecord["source"],
  { label: string; badgeClass: string }
> = {
  eauctiondekho: {
    label: "eAuctionDekho",
    badgeClass: "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs",
  },
  baanknet: {
    label: "BaankNet",
    badgeClass: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs",
  },
};

const defaultBadge = {
  label: "Auction",
  badgeClass: "bg-slate-700 text-white",
};

type PropertyCardProps = {
  auction: AuctionRecord;
};

export function PropertyCard({ auction }: PropertyCardProps) {
  const [copied, setCopied] = useState(false);

  const badge = sourceStyles[auction.source] ?? defaultBadge;
  const location = [auction.city, auction.district, auction.state]
    .filter(Boolean)
    .join(", ");
  const linkLabel = detailLinkLabel(auction.detailUrl, auction.listingPortal);

  const handleCopyId = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!auction.auctionId) return;
    navigator.clipboard.writeText(auction.auctionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortPrice = formatInrShort(auction.reservePrice);
  const fullPrice = formatInr(auction.reservePrice);

  return (
    <article className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div>
        {/* Top Header Row: Source Badge & Property Type */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200/60">
            {auction.propertyType || "Property"}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${badge.badgeClass}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Bank Name */}
        <h3 className="text-lg font-bold leading-snug text-slate-900 group-hover:text-indigo-600 transition">
          {auction.bankName || "Bank Property"}
        </h3>

        {/* Reserve Price Block */}
        <div className="my-3.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Reserve Price
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {shortPrice}
            </span>
            {auction.reservePrice != null && auction.reservePrice >= 100000 && (
              <span className="text-xs font-medium text-slate-500">
                ({fullPrice})
              </span>
            )}
          </div>
        </div>

        {/* Property Metadata List */}
        <div className="space-y-2 text-xs sm:text-sm text-slate-600">
          {/* Location */}
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="font-medium text-slate-800">
              {location || "Location not specified"}
            </span>
          </div>

          {/* Auction ID with Copy Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <svg
                className="h-4 w-4 shrink-0 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                />
              </svg>
              <span className="truncate font-mono text-xs text-slate-700">
                ID: <strong className="font-semibold text-slate-900">{auction.auctionId || auction.id}</strong>
              </span>
            </div>
            {auction.auctionId && (
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Auction ID"
                className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {/* Auction Date */}
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              <span className="text-slate-500">Auction Date: </span>
              <strong className="font-semibold text-slate-900">
                {auction.auctionDate || "Check Listing"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action Link */}
      <footer className="mt-5 border-t border-slate-100 pt-4">
        {auction.detailUrl ? (
          <a
            href={auction.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-600 hover:shadow-md active:scale-98"
          >
            <span>{linkLabel}</span>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ) : (
          <span className="block text-center text-xs font-medium text-slate-400 py-2">
            No direct listing link available
          </span>
        )}
      </footer>
    </article>
  );
}
