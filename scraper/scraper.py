#!/usr/bin/env python3
"""Scrape bank auctions from eAuctionDekho API and BaankNet (best-effort)."""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any

import requests

SCRAPER_DIR = Path(__file__).resolve().parent
ROOT = SCRAPER_DIR.parent
DATA_FILE = ROOT / "data" / "auctions.json"

sys.path.insert(0, str(SCRAPER_DIR))

from utils import (  # noqa: E402
    is_ap_or_telangana,
    make_record,
    merge_records,
    parse_auction_date,
    parse_inr_price,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("scraper")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}

TARGET_STATES = ["Andhra Pradesh", "Telangana"]
EAUCTIONDEKHO_API = "https://api.eauctiondekho.com/api/notices"
BAANKNET_FILTER_URL = "https://baanknet.com/api/v1/property/detail/property-filter"
BAANKNET_STATES_URL = "https://baanknet.com/api/v1/common/states"
ALLOWED_SOURCES = frozenset({"eauctiondekho", "baanknet"})
BAANKNET_LISTING_URL = "https://baanknet.com/property-listing"


def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def scrape_eauctiondekho(
    states: list[str] | None = None,
    page_size: int = 25,
    max_pages: int | None = None,
) -> list[dict[str, Any]]:
    """Fetch notices from eAuctionDekho Strapi API (not HTML — site is Next.js)."""
    states = states or TARGET_STATES
    if max_pages is None:
        max_pages = int(os.environ.get("SCRAPER_MAX_PAGES", "5"))
    if max_pages <= 0:
        max_pages = 10_000

    session = _session()
    records: list[dict[str, Any]] = []

    for state in states:
        page = 1
        while page <= max_pages:
            params = {
                "filters[state][$eq]": state,
                "pagination[page]": page,
                "pagination[pageSize]": page_size,
                "sort[0]": "auctionDate:desc",
            }
            resp = session.get(EAUCTIONDEKHO_API, params=params, timeout=60)
            resp.raise_for_status()
            payload = resp.json()
            items = payload.get("data") or []
            if not items:
                break

            for item in items:
                attrs = item.get("attributes") or {}
                notice_id = str(item.get("id") or attrs.get("bankPropertyId") or "")
                reserve_raw = attrs.get("reservePrice")
                reserve_price: float | None = None
                if isinstance(reserve_raw, (int, float)) and reserve_raw > 0:
                    reserve_price = float(reserve_raw)
                else:
                    est = attrs.get("estimatedMarketPrice")
                    if isinstance(est, (int, float)) and est > 0:
                        reserve_price = float(est)

                rec = make_record(
                    source="eauctiondekho",
                    auction_id=notice_id or attrs.get("slug") or "unknown",
                    bank_name=attrs.get("bankName") or attrs.get("rawBankName") or "Unknown",
                    property_type=attrs.get("assetCategory")
                    or attrs.get("assetType")
                    or attrs.get("rawAssetCategory")
                    or "Unknown",
                    city=attrs.get("city") or attrs.get("rawCity") or "",
                    district=attrs.get("city") or "",
                    state=attrs.get("state") or state,
                    reserve_price=reserve_price,
                    auction_date=parse_auction_date(
                        attrs.get("auctionDate") or attrs.get("effectiveAuctionStartTime")
                    ),
                    detail_url=attrs.get("noticeLink"),
                )
                if is_ap_or_telangana(rec):
                    records.append(rec)

            meta = (payload.get("meta") or {}).get("pagination") or {}
            page_count = meta.get("pageCount") or page
            logger.info(
                "eAuctionDekho %s page %s/%s -> %s rows (running total %s)",
                state,
                page,
                page_count,
                len(items),
                len(records),
            )
            if page >= page_count:
                break
            page += 1
            time.sleep(0.3)

    return records


def _baanknet_state_ids(session: requests.Session) -> dict[str, int]:
    resp = session.get(
        BAANKNET_STATES_URL, params={"countryId": 101}, timeout=30
    )
    resp.raise_for_status()
    mapping: dict[str, int] = {}
    for row in resp.json().get("data") or []:
        name = row.get("name")
        if name in TARGET_STATES:
            mapping[name] = int(row["id"])
    return mapping


def _baanknet_listing_url(state_id: int, property_type_id: int | None) -> str:
    params = f"state={state_id}"
    if property_type_id:
        params = f"propertyTypeId={property_type_id}&{params}"
    return f"{BAANKNET_LISTING_URL}?{params}"


def _parse_baanknet_hit(hit: dict, state_name: str) -> dict[str, Any] | None:
    src = hit.get("_source") if isinstance(hit, dict) else None
    if not isinstance(src, dict):
        return None

    state_id = src.get("stateId")
    prop_type_id = src.get("propertyTypeId")
    auction_id = str(
        src.get("propertyUniqueId")
        or src.get("propertyDetailId")
        or hit.get("_id")
        or ""
    )
    price = src.get("propertyPrice")
    reserve = float(price) if isinstance(price, (int, float)) else None

    rec = make_record(
        source="baanknet",
        auction_id=auction_id or "unknown",
        bank_name=src.get("bankName") or "Unknown",
        property_type=src.get("propertyType")
        or src.get("propertySubType")
        or "Unknown",
        city=src.get("cityName") or "",
        district=src.get("districtName") or "",
        state=src.get("stateName") or state_name,
        reserve_price=reserve,
        auction_date=parse_auction_date(str(src.get("createdOn") or "")),
        detail_url=_baanknet_listing_url(int(state_id), prop_type_id)
        if state_id
        else BAANKNET_LISTING_URL,
    )
    return rec if is_ap_or_telangana(rec) else None


def scrape_baanknet(
    states: list[str] | None = None,
    page_size: int = 25,
    max_pages: int | None = None,
) -> list[dict[str, Any]]:
    """
    BaankNet listings via POST /api/v1/property/detail/property-filter.

    The HAR call POST /api/v1/common/cities/search {"stateId":2,"cityName":""}
    only loads city dropdown options (Elasticsearch city index), not auctions.
    Listing payload (from property-listing page JS) looks like:
      {"search":{"stateId":2},"range":{},"sort":{"type":"mostrecent","postedSince":""},"page":1,"limit":10}
    """
    states = states or TARGET_STATES
    if max_pages is None:
        max_pages = int(os.environ.get("SCRAPER_MAX_PAGES", "5"))
    if max_pages <= 0:
        max_pages = 10_000

    session = _session()
    session.headers["Content-Type"] = "application/json"

    try:
        state_ids = _baanknet_state_ids(session)
    except requests.RequestException as exc:
        logger.warning("BaankNet state list failed: %s", exc)
        return []

    records: list[dict[str, Any]] = []

    for state in states:
        state_id = state_ids.get(state)
        if not state_id:
            continue

        for page in range(1, max_pages + 1):
            body = {
                "search": {"stateId": state_id},
                "range": {},
                "sort": {"type": "mostrecent", "postedSince": ""},
                "page": page,
                "limit": page_size,
            }
            try:
                resp = session.post(BAANKNET_FILTER_URL, json=body, timeout=90)
                resp.raise_for_status()
            except requests.RequestException as exc:
                logger.warning("BaankNet filter failed for %s page %s: %s", state, page, exc)
                break

            payload = resp.json().get("data") or {}
            hits = payload.get("data") or []
            total_pages = int(payload.get("totalPages") or 1)

            for hit in hits:
                rec = _parse_baanknet_hit(hit, state)
                if rec:
                    records.append(rec)

            logger.info(
                "BaankNet %s page %s/%s -> %s hits (%s records total)",
                state,
                page,
                total_pages,
                len(hits),
                len(records),
            )

            if page >= total_pages or not hits:
                break
            time.sleep(0.3)

    return records


def load_existing() -> list[dict]:
    if not DATA_FILE.exists():
        return []
    with DATA_FILE.open(encoding="utf-8") as fh:
        data = json.load(fh)
    return data if isinstance(data, list) else []


def main() -> int:
    all_results: list[dict[str, Any]] = []

    try:
        edk = scrape_eauctiondekho()
        all_results.extend(edk)
        logger.info("eAuctionDekho total: %s", len(edk))
    except Exception as exc:
        logger.exception("eAuctionDekho failed: %s", exc)

    try:
        bn = scrape_baanknet()
        all_results.extend(bn)
        logger.info("BaankNet total: %s", len(bn))
    except Exception as exc:
        logger.exception("BaankNet failed: %s", exc)

    print("Fetched", len(all_results), "normalized results")
    for row in all_results[:10]:
        print(
            row.get("source"),
            row.get("bankName"),
            row.get("state"),
            row.get("reservePrice"),
            row.get("auctionDate"),
        )

    existing = [r for r in load_existing() if r.get("source") in ALLOWED_SOURCES]
    merged = merge_records(existing, all_results)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("w", encoding="utf-8") as fh:
        json.dump(merged, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    logger.info("Wrote %s records to %s", len(merged), DATA_FILE)
    return 0 if all_results else 1


if __name__ == "__main__":
    raise SystemExit(main())
