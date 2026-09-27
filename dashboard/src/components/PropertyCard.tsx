import { formatInr } from "@/lib/auctions";
import type { AuctionRecord } from "@/lib/types";

const sourceStyles: Record<
  AuctionRecord["source"],
  { label: string; className: string }
> = {
  eauctiondekho: {
    label: "eAuctionDekho",
    className: "bg-amber-100 text-amber-900",
  },
  baanknet: {
    label: "BaankNet",
    className: "bg-violet-100 text-violet-800",
  },
};

type PropertyCardProps = {
  auction: AuctionRecord;
};

export function PropertyCard({ auction }: PropertyCardProps) {
  const badge = sourceStyles[auction.source];
  const location = [auction.city, auction.district, auction.state]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {auction.propertyType}
          </p>
          <h2 className="mt-1 text-lg font-semibold leading-snug text-slate-900">
            {auction.bankName}
          </h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      </header>

      <div className="flex-1 space-y-2 text-sm text-slate-600">
        <p>
          <span className="font-medium text-slate-800">Location:</span>{" "}
          {location || "—"}
        </p>
        <p>
          <span className="font-medium text-slate-800">Auction ID:</span>{" "}
          {auction.auctionId}
        </p>
        <p>
          <span className="font-medium text-slate-800">Reserve price:</span>{" "}
          {formatInr(auction.reservePrice)}
        </p>
        <p>
          <span className="font-medium text-slate-800">Auction date:</span>{" "}
          {auction.auctionDate ?? "—"}
        </p>
      </div>

      <footer className="mt-4 border-t border-slate-100 pt-4">
        {auction.detailUrl ? (
          <a
            href={auction.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            View listing
          </a>
        ) : (
          <span className="block text-center text-sm text-slate-400">
            No listing URL
          </span>
        )}
      </footer>
    </article>
  );
}
