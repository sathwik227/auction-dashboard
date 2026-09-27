"""Listings from IBAPI (via MSTC property search + ibapi.in portal metadata)."""

from __future__ import annotations

import logging
import re

import requests

from utils import is_ap_or_telangana, make_record

logger = logging.getLogger(__name__)

IBAPI_HOME = "https://www.ibapi.in"
IBAPI_MSTC = "https://www.mstcecommerce.com/auctionhome/ibapi/index.jsp"


def _portal_reachable() -> bool:
    try:
        r = requests.get(
            IBAPI_HOME,
            timeout=20,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        return r.status_code == 200
    except requests.RequestException:
        return False


def from_mstc_listings(listings: list[dict]) -> list[dict]:
    if not _portal_reachable():
        logger.warning("ibapi.in unreachable; using MSTC IBAPI listings only")

    records: list[dict] = []
    for item in listings:
        title = item.get("title") or ""
        is_ibapi = item.get("is_ibapi_property") or "IBAPI" in title.upper()
        if not is_ibapi:
            continue
        rec = make_record(
            source="ibapi",
            auction_id=str(item.get("auctionId") or ""),
            bank_name=item.get("bankName") or "Unknown",
            property_type=item.get("propertyType") or "Unknown",
            city=item.get("city") or "",
            district=item.get("district") or "",
            state=item.get("state") or "",
            reserve_price=item.get("reservePrice"),
            auction_date=item.get("auctionDate"),
            detail_url=item.get("detailUrl") or IBAPI_MSTC,
        )
        if is_ap_or_telangana(rec):
            records.append(rec)
    return records


def fetch_listings(shared_mstc: list[dict] | None = None) -> list[dict]:
    if shared_mstc is None:
        from mstc_search import fetch_all_events

        shared_mstc = fetch_all_events()
    return from_mstc_listings(shared_mstc)
