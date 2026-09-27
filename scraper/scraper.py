#!/usr/bin/env python3
"""Fetch bank auction listings and write data/auctions.json."""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

SCRAPER_DIR = Path(__file__).resolve().parent
ROOT = SCRAPER_DIR.parent
DATA_FILE = ROOT / "data" / "auctions.json"

sys.path.insert(0, str(SCRAPER_DIR))

from mstc_search import fetch_all_events  # noqa: E402
from sources import ibapi, mstc, sbi_auctiontiger  # noqa: E402
from utils import is_ap_or_telangana, merge_records  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("scraper")


def load_existing() -> list[dict]:
    if not DATA_FILE.exists():
        return []
    try:
        with DATA_FILE.open(encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Could not read existing data: %s", exc)
        return []


def save_records(records: list[dict]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("w", encoding="utf-8") as fh:
        json.dump(records, fh, ensure_ascii=False, indent=2)
        fh.write("\n")


def main() -> int:
    failures = 0
    shared: list[dict] = []
    try:
        shared = fetch_all_events(include_details=True)
        logger.info("MSTC base fetch returned %d lot rows", len(shared))
    except Exception as exc:
        logger.error("MSTC base fetch failed: %s", exc)
        failures += 1
        shared = []

    incoming: list[dict] = []
    for name, module in (
        ("ibapi", ibapi),
        ("mstc", mstc),
        ("sbi", sbi_auctiontiger),
    ):
        try:
            rows = module.fetch_listings(shared_mstc=shared)
            filtered = [r for r in rows if is_ap_or_telangana(r)]
            logger.info("Source %s contributed %d AP/TS records", name, len(filtered))
            incoming.extend(filtered)
        except Exception as exc:
            logger.exception("Source %s failed: %s", name, exc)
            failures += 1

    if not incoming and failures >= 3:
        logger.error("All sources failed")
        return 1

    existing = load_existing()
    merged = merge_records(existing, incoming)
    save_records(merged)
    logger.info("Wrote %d records to %s", len(merged), DATA_FILE)
    return 0 if incoming else (1 if failures else 0)


if __name__ == "__main__":
    raise SystemExit(main())
