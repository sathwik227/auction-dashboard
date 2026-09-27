"""MSTC property search client (powers IBAPI + MSTC listings)."""

from __future__ import annotations

import logging
import os
import re
import time
from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup

from utils import parse_auction_date, parse_inr_price

logger = logging.getLogger(__name__)

BASE = "https://www.mstcecommerce.com/auctionhome/propsearch"
CAPTCHA_URL = "https://www.mstcecommerce.com/auctionhome/imageverification.jsp"
SEARCH_URL = f"{BASE}/get_event_details.jsp"
DETAILS_URL = f"{BASE}/get_itm_details.jsp"

TARGET_STATES = ("Andhra Pradesh", "Telangana")


@dataclass
class RawEvent:
    mstc_auc_id: str
    bank_name: str
    title: str
    date_text: str
    state: str
    district: str
    is_ibapi_property: bool


def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": requests.utils.default_user_agent()})
    s.headers["User-Agent"] = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    return s


def _fetch_captcha(session: requests.Session) -> str:
    return session.post(CAPTCHA_URL, timeout=30).text.strip()


def parse_districts(html: str, state: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    select = soup.find("select", {"name": "district"}) or soup.find("select", {"id": "district"})
    if not select:
        return []
    districts: list[str] = []
    for opt in select.find_all("option"):
        if (opt.get("data-attribute") or "") == state:
            val = (opt.get("value") or "").strip()
            if val:
                districts.append(val)
    return districts


def _search_events(session: requests.Session, state: str, district: str) -> str:
    captcha = _fetch_captcha(session)
    payload = {
        "bLVal": "Both",
        "locValD": f"true#false#true#{state}#{district}",
        "pinValD": "false#",
        "sellerValD": "false#false#",
        "propValD": "0#",
        "lUpval": "Both",
        "captcha": captcha,
    }
    resp = session.post(SEARCH_URL, data=payload, timeout=120)
    text = resp.text.strip()
    if text == "Failed":
        raise RuntimeError("MSTC captcha verification failed")
    if "Error 500" in text:
        raise RuntimeError("MSTC server error (session or criteria)")
    return text


def _parse_events(html: str, state: str, district: str) -> list[RawEvent]:
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    events: list[RawEvent] = []
    for row in soup.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        bank = cells[0].get_text(" ", strip=True)
        link = cells[1].find("a")
        if not link:
            continue
        onclick = link.get("onclick") or ""
        title = link.get_text(" ", strip=True)
        m_item = re.search(r"getAuctItemDtls\((\d+)\)", onclick)
        m_prop = re.search(r"getPropertyDtls\(['\"]?([^'\");]+)", onclick)
        if not m_item and not m_prop:
            continue
        auc_id = m_item.group(1) if m_item else m_prop.group(1)
        date_text = cells[2].get_text(" ", strip=True) if len(cells) > 2 else ""
        events.append(
            RawEvent(
                mstc_auc_id=auc_id,
                bank_name=bank,
                title=title,
                date_text=date_text,
                state=state,
                district=district,
                is_ibapi_property=bool(m_prop),
            )
        )
    return events


def _city_from_title(title: str) -> str:
    parts = title.split("/")
    for part in parts:
        p = part.strip()
        if p.isupper() and len(p) > 2 and p not in ("MSTC", "NRO", "IBAPI"):
            return p.title()
    return ""


def fetch_event_details(
    session: requests.Session, event: RawEvent
) -> list[dict]:
    """Return lot-level detail dicts for an event."""
    if event.is_ibapi_property:
        resp = session.post(
            DETAILS_URL,
            data={"ref_id": event.mstc_auc_id},
            timeout=120,
        )
    else:
        resp = session.post(
            DETAILS_URL,
            data={
                "auc_id": event.mstc_auc_id,
                "bLVal": "Both",
                "locValD": f"true#false#true#{event.state}#{event.district}",
                "pinValD": "false#",
                "propValD": "0#",
            },
            timeout=120,
        )
    text = resp.text.strip()
    if not text or "###@$" not in text:
        return []
    parts = text.split("###@$")
    if len(parts) < 4:
        return []
    seller = parts[0]
    period = parts[1]
    auction_no = parts[2]
    html = parts[3]
    soup = BeautifulSoup(html, "html.parser")
    lots: list[dict] = []
    for row in soup.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 4:
            continue
        lot_no = cells[0].get_text(" ", strip=True)
        prop_type = cells[1].get_text(" ", strip=True)
        location = cells[2].get_text(" ", strip=True)
        reserve = parse_inr_price(cells[3].get_text(" ", strip=True))
        city = _city_from_title(event.title) or event.district
        state_match = re.search(r"State\s*:?\s*([^\-]+)", location, re.I)
        state = state_match.group(1).strip() if state_match else event.state
        lots.append(
            {
                "auctionId": f"{auction_no}-{lot_no}",
                "bankName": seller or event.bank_name,
                "propertyType": prop_type,
                "city": city,
                "district": event.district,
                "state": state,
                "reservePrice": reserve,
                "auctionDate": parse_auction_date(period or event.date_text),
                "detailUrl": "https://www.mstcecommerce.com/auctionhome/propsearch/property_search.jsp",
                "title": event.title,
                "is_ibapi_property": event.is_ibapi_property,
            }
        )
    return lots


def fetch_all_events(include_details: bool = True) -> list[dict]:
    session = _session()
    page = session.get(f"{BASE}/property_search.jsp", timeout=60)
    page.raise_for_status()
    html = page.text

    seen: set[str] = set()
    raw_events: list[RawEvent] = []

    for state in TARGET_STATES:
        districts = parse_districts(html, state)
        max_d = os.environ.get("SCRAPER_MAX_DISTRICTS")
        if max_d:
            districts = districts[: int(max_d)]
        logger.info("MSTC scanning %s (%d districts)", state, len(districts))
        for district in districts:
            try:
                result_html = _search_events(session, state, district)
                for ev in _parse_events(result_html, state, district):
                    key = f"{ev.is_ibapi_property}:{ev.mstc_auc_id}"
                    if key in seen:
                        continue
                    seen.add(key)
                    raw_events.append(ev)
            except Exception as exc:
                logger.warning("MSTC search failed for %s / %s: %s", state, district, exc)
            time.sleep(0.4)

    listings: list[dict] = []
    for ev in raw_events:
        if not include_details:
            listings.append(
                {
                    "auctionId": ev.mstc_auc_id,
                    "bankName": ev.bank_name,
                    "propertyType": "Unknown",
                    "city": _city_from_title(ev.title),
                    "district": ev.district,
                    "state": ev.state,
                    "reservePrice": None,
                    "auctionDate": parse_auction_date(ev.date_text),
                    "detailUrl": "https://www.mstcecommerce.com/auctionhome/propsearch/property_search.jsp",
                    "title": ev.title,
                    "is_ibapi_property": ev.is_ibapi_property,
                }
            )
            continue
        try:
            listings.extend(fetch_event_details(session, ev))
        except Exception as exc:
            logger.warning("MSTC details failed for %s: %s", ev.mstc_auc_id, exc)
        time.sleep(0.3)

    return listings
