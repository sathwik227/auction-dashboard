"""Listings from MSTC e-commerce property auctions."""

from __future__ import annotations

import logging

from utils import is_ap_or_telangana, make_record

logger = logging.getLogger(__name__)

MSTC_PORTAL = "https://www.mstcecommerce.com/auctionhome/propsearch/property_search.jsp"


def from_mstc_listings(listings: list[dict]) -> list[dict]:
    records: list[dict] = []
    for item in listings:
        title = item.get("title") or ""
        if item.get("is_ibapi_property") or "IBAPI" in title.upper():
            continue
        rec = make_record(
            source="mstc",
            auction_id=str(item.get("auctionId") or ""),
            bank_name=item.get("bankName") or "Unknown",
            property_type=item.get("propertyType") or "Unknown",
            city=item.get("city") or "",
            district=item.get("district") or "",
            state=item.get("state") or "",
            reserve_price=item.get("reservePrice"),
            auction_date=item.get("auctionDate"),
            detail_url=item.get("detailUrl") or MSTC_PORTAL,
        )
        if is_ap_or_telangana(rec):
            records.append(rec)
    return records


def fetch_listings(shared_mstc: list[dict] | None = None) -> list[dict]:
    if shared_mstc is None:
        from mstc_search import fetch_all_events

        shared_mstc = fetch_all_events()
    return from_mstc_listings(shared_mstc)
