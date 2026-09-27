"""Shared scraper utilities."""

from __future__ import annotations

import re
from datetime import date, datetime, timedelta, timezone
from typing import Any

ALLOWED_SOURCES = frozenset({"eauctiondekho", "baanknet"})
IST = timezone(timedelta(hours=5, minutes=30))

AP_TS_STATES = {
    "andhra pradesh",
    "ap",
    "telangana",
    "ts",
}

AP_TS_DISTRICT_HINTS = {
    "anantapur",
    "chittoor",
    "east godavari",
    "guntur",
    "krishna",
    "kurnool",
    "nellore",
    "srikakulam",
    "visakhapatnam",
    "vizianagaram",
    "west godavari",
    "kadapa",
    "ysr",
    "adilabad",
    "hyderabad",
    "karimnagar",
    "khammam",
    "mahbubnagar",
    "medak",
    "nalgonda",
    "nizamabad",
    "rangareddy",
    "warangal",
    "bhadradri",
    "jagtial",
    "jangaon",
    "jayashankar",
    "jogulamba",
    "kamareddy",
    "komaram bheem",
    "mahabubabad",
    "mancherial",
    "medchal",
    "mulugu",
    "nagarkurnool",
    "narayanpet",
    "nirmal",
    "peddapalli",
    "rajanna",
    "sangareddy",
    "siddipet",
    "suryapet",
    "vikarabad",
    "wanaparthy",
    "yadadri",
}

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def today_ist() -> date:
    return datetime.now(IST).date()


def is_upcoming(auction_date: str | None, *, today: date | None = None) -> bool:
    if not auction_date:
        return False
    parsed = parse_auction_date(auction_date)
    if not parsed:
        return False
    ref = today if today is not None else today_ist()
    return date.fromisoformat(parsed) >= ref


def filter_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    kept = [
        item
        for item in records
        if item.get("source") in ALLOWED_SOURCES
        and is_upcoming(item.get("auctionDate"))
    ]
    return sorted(kept, key=lambda x: (x.get("auctionDate") or "", x.get("id") or ""))


def normalize_state(state: str | None) -> str:
    if not state:
        return ""
    s = state.strip()
    low = s.lower()
    if low in ("ap", "andhra pradesh"):
        return "Andhra Pradesh"
    if low in ("ts", "telangana"):
        return "Telangana"
    return s


def is_ap_or_telangana(record: dict[str, Any]) -> bool:
    state = normalize_state(record.get("state") or "")
    if state.lower() in AP_TS_STATES or state in ("Andhra Pradesh", "Telangana"):
        return True
    district = (record.get("district") or "").lower()
    city = (record.get("city") or "").lower()
    for hint in AP_TS_DISTRICT_HINTS:
        if hint in district or hint in city:
            return True
    return False


def parse_inr_price(text: str | None) -> float | None:
    if not text:
        return None
    cleaned = text.replace(",", "").strip()
    low = cleaned.lower()
    multiplier = 1.0
    if "crore" in low or "cr" in low:
        multiplier = 1e7
        cleaned = re.sub(r"(?i)(crore|cr\.?)", "", cleaned)
    elif "lakh" in low or "lac" in low:
        multiplier = 1e5
        cleaned = re.sub(r"(?i)(lakh|lac\.?)", "", cleaned)
    match = re.search(r"(\d+(?:\.\d+)?)", cleaned)
    if not match:
        return None
    return float(match.group(1)) * multiplier


def parse_auction_date(text: str | None) -> str | None:
    if not text:
        return None
    text = text.strip()
    match = re.search(r"(\d{4}-\d{2}-\d{2})", text)
    if match:
        return match.group(1)
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(text[:19], fmt).date().isoformat()
        except ValueError:
            continue
    return None


def make_record(
    *,
    source: str,
    auction_id: str,
    bank_name: str,
    property_type: str,
    city: str,
    district: str,
    state: str,
    reserve_price: float | None,
    auction_date: str | None,
    detail_url: str | None,
    listing_portal: str | None = None,
) -> dict[str, Any]:
    portal_id = auction_id
    record: dict[str, Any] = {
        "id": f"{source}:{portal_id}",
        "source": source,
        "auctionId": portal_id,
        "bankName": bank_name.strip(),
        "propertyType": property_type.strip() or "Unknown",
        "city": city.strip(),
        "district": district.strip(),
        "state": normalize_state(state),
        "reservePrice": reserve_price,
        "auctionDate": auction_date,
        "detailUrl": detail_url,
        "scrapedAt": utc_now_iso(),
    }
    if listing_portal:
        record["listingPortal"] = listing_portal.strip()
    return record


def merge_records(existing: list[dict], incoming: list[dict]) -> list[dict]:
    by_id: dict[str, dict] = {item["id"]: item for item in existing if item.get("id")}
    for item in incoming:
        rid = item.get("id")
        if not rid:
            continue
        prev = by_id.get(rid)
        if not prev:
            by_id[rid] = item
            continue
        if (item.get("scrapedAt") or "") >= (prev.get("scrapedAt") or ""):
            by_id[rid] = item
    return sorted(by_id.values(), key=lambda x: (x.get("auctionDate") or "", x.get("id") or ""))
