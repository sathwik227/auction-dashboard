export type AuctionSource = "eauctiondekho" | "baanknet";

export interface AuctionRecord {
  id: string;
  source: AuctionSource;
  auctionId: string;
  bankName: string;
  propertyType: string;
  city: string;
  district: string;
  state: string;
  reservePrice: number | null;
  auctionDate: string | null;
  detailUrl: string | null;
  listingPortal?: string | null;
  scrapedAt: string;
}

export interface AuctionFilters {
  query: string;
  state: string;
  district: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
}

export const emptyFilters: AuctionFilters = {
  query: "",
  state: "",
  district: "",
  propertyType: "",
  minPrice: "",
  maxPrice: "",
};
