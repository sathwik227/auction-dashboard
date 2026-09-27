import { AuctionDashboard } from "@/components/AuctionDashboard";
import { loadAuctions } from "@/lib/auctions.server";

export default async function Home() {
  const records = await loadAuctions();

  return (
    <div className="min-h-screen bg-slate-50">
      <AuctionDashboard initialRecords={records} />
    </div>
  );
}
