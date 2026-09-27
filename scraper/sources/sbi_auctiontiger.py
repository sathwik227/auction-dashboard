"""Listings from SBI AuctionTiger (best-effort public data + MSTC bank filter)."""

from __future__ import annotations

import logging
import re

import requests
from bs4 import BeautifulSoup

from utils import is_ap_or_telangana, make_record

logger = logging.getLogger(__name__)

SBI_PORTAL = "https://sbi.auctiontiger.net/EPROC/"
SBI_PATTERN = re.compile(r"(?i)state bank of india|\bsbi\b")

AP_TS_KEYWORDS = re.compile(
    r"(?i)andhra|telangana|hyderabad|vijayawada|visakhapatnam|warangal|guntur|"
    r"nizamabad|karimnagar|khammam|nellore|tirupati|kadapa|kurnool"
)


def _session() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    return s


def _from_portal_html() -> list[dict]:
    """Parse any AP/TS auction hints from the public SBI landing page."""
    records: list[dict] = []
    try:
        session = _session()
        resp = session.get(f"{SBI_PORTAL}jsinstruction", timeout=30)
        if resp.status_code != 200:
            return records
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text(" ", strip=True)
        if not SBI_PATTERN.search(text):
            return records
        if not AP_TS_KEYWORDS.search(text):
            return records
    except requests.RequestException as exc:
        logger.warning("SBI portal fetch failed: %s", exc)
    return records


def from_mstc_listings(listings: list[dict]) -> list[dict]:
    records: list[dict] = []
    for item in listings:
        bank = item.get("bankName") or ""
        if not SBI_PATTERN.search(bank):
            continue
        rec = make_record(
            source="sbi",
            auction_id=str(item.get("auctionId") or ""),
            bank_name=bank,
            property_type=item.get("propertyType") or "Unknown",
            city=item.get("city") or "",
            district=item.get("district") or "",
            state=item.get("state") or "",
            reserve_price=item.get("reservePrice"),
            auction_date=item.get("auctionDate"),
            detail_url=SBI_PORTAL,
        )
        if is_ap_or_telangana(rec):
            records.append(rec)
    return records


def fetch_listings(shared_mstc: list[dict] | None = None) -> list[dict]:
    records = _from_portal_html()
    if shared_mstc is None:
        from mstc_search import fetch_all_events

        shared_mstc = fetch_all_events()
    records.extend(from_mstc_listings(shared_mstc))
    return records
