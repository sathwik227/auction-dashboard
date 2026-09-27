import type { AuctionRecord } from "./types";

const ALLOWED_SOURCES = new Set<string>(["eauctiondekho", "baanknet"]);

export function todayIstDateString(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(),
  );
}

export function isUpcomingAuction(
  auctionDate: string | null | undefined,
): boolean {
  if (!auctionDate) return false;
  const match = auctionDate.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return false;
  return match[1] >= todayIstDateString();
}

export function filterVisibleAuctions(records: AuctionRecord[]): AuctionRecord[] {
  return records.filter(
    (item) =>
      ALLOWED_SOURCES.has(item.source) && isUpcomingAuction(item.auctionDate),
  );
}

export function detailLinkLabel(
  detailUrl: string | null,
  listingPortal?: string | null,
): string {
  if (listingPortal?.trim()) {
    return `View on ${listingPortal.trim()}`;
  }
  if (!detailUrl) return "View listing";
  try {
    const host = new URL(detailUrl).hostname.replace(/^www\./, "");
    return host ? `View on ${host}` : "View listing";
  } catch {
    return "View listing";
  }
}

export function filterAuctions(
  records: AuctionRecord[],
  filters: {
    query: string;
    state: string;
    district: string;
    propertyType: string;
    minPrice: number | null;
    maxPrice: number | null;
    sortBy?: string;
  },
): AuctionRecord[] {
  const q = filters.query.trim().toLowerCase();

  const filtered = records.filter((item) => {
    if (filters.state && item.state !== filters.state) return false;
    if (filters.district && item.district !== filters.district) return false;
    if (
      filters.propertyType &&
      !item.propertyType.toLowerCase().includes(filters.propertyType.toLowerCase())
    ) {
      return false;
    }

    const price = item.reservePrice;
    if (filters.minPrice != null && price != null && price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice != null && price != null && price > filters.maxPrice) {
      return false;
    }

    if (!q) return true;
    const haystack = [
      item.id,
      item.auctionId,
      item.bankName,
      item.city,
      item.district,
      item.state,
      item.propertyType,
      item.source,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  if (filters.sortBy) {
    filtered.sort((a, b) => {
      if (filters.sortBy === "price-asc") {
        return (a.reservePrice ?? Infinity) - (b.reservePrice ?? Infinity);
      }
      if (filters.sortBy === "price-desc") {
        return (b.reservePrice ?? 0) - (a.reservePrice ?? 0);
      }
      if (filters.sortBy === "bank-asc") {
        return a.bankName.localeCompare(b.bankName);
      }
      // Default: date-asc (earliest auction date first)
      const dateA = a.auctionDate || "9999-99-99";
      const dateB = b.auctionDate || "9999-99-99";
      return dateA.localeCompare(dateB);
    });
  }

  return filtered;
}

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function formatInr(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatInrShort(value: number | null): string {
  if (value == null) return "N/A";
  if (value >= 10000000) {
    const cr = value / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    const lakh = value / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakh`;
  }
  return formatInr(value);
}
