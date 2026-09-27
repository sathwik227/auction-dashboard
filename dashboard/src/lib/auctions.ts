import type { AuctionRecord } from "./types";

export function filterAuctions(
  records: AuctionRecord[],
  filters: {
    query: string;
    state: string;
    district: string;
    propertyType: string;
    minPrice: number | null;
    maxPrice: number | null;
  },
): AuctionRecord[] {
  const q = filters.query.trim().toLowerCase();

  return records.filter((item) => {
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
