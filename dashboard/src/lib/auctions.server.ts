import fs from "fs";
import path from "path";

import type { AuctionRecord } from "./types";

const REVALIDATE_SECONDS = 3600;

export async function loadAuctions(): Promise<AuctionRecord[]> {
  const remoteUrl = process.env.NEXT_PUBLIC_AUCTIONS_JSON_URL;

  if (remoteUrl) {
    const res = await fetch(remoteUrl, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch auctions JSON (${res.status})`);
    }
    const data = (await res.json()) as AuctionRecord[];
    return Array.isArray(data) ? data : [];
  }

  const filePath = path.join(process.cwd(), "..", "data", "auctions.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as AuctionRecord[];
  return Array.isArray(data) ? data : [];
}
