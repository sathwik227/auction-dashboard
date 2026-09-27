# Bank Auction Dashboard

Monorepo for scraping bank property auctions in **Andhra Pradesh** and **Telangana**, committing JSON data daily via GitHub Actions, and viewing results in a Next.js dashboard.

## Project layout

- `scraper/` — Python scraper (`requests` + JSON APIs)
- `data/auctions.json` — scraped listings (committed by CI)
- `dashboard/` — Next.js + Tailwind UI
- `.github/workflows/scraper.yml` — daily scraper automation

## Local scraper

```bash
cd C:\tempProj\auction-dashboard
python -m venv .venv
.venv\Scripts\activate
pip install -r scraper/requirements.txt
python scraper/scraper.py
```

Output: `data/auctions.json`

### Pagination

The scraper reads **`SCRAPER_MAX_PAGES`** (per state, per source). Default is **5**.

| Run type | Suggested value |
|----------|-----------------|
| **First backfill** | `300` (or `0` = no cap until API ends) |
| **Daily incremental** | `2`–`5` (new listings appear on first pages) |

PowerShell examples:

```powershell
# Full backfill once
$env:SCRAPER_MAX_PAGES='300'
python scraper/scraper.py

# Quick daily-style run
$env:SCRAPER_MAX_PAGES='5'
python scraper/scraper.py
```

Merged output keeps existing rows by `id`, drops legacy sources (`mstc`, `ibapi`, etc.), and **only keeps auctions with `auctionDate` on or after today (IST)**.

### Dashboard labels

- **Badge** on each tile = where data was scraped (`eauctiondekho` or `baanknet`).
- **Button** opens the official listing URL from the API (`noticeLink` or BaankNet property detail). The button text shows the destination (hostname or `listingPortal`), which may differ from the badge when eAuctionDekho links to another portal.

## GitHub Actions

- Workflow: `.github/workflows/scraper.yml`
- Schedule: `30 1 * * *` UTC = **7:00 AM IST** with **`SCRAPER_MAX_PAGES=5`**
- **Full backfill:** Actions → *Daily auction scraper* → *Run workflow* → enable **Full backfill**
- Requires `contents: write` so the bot can push JSON updates

## Dashboard (local)

```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this repo to GitHub.
2. [Vercel](https://vercel.com) → **Add New Project** → import the repo.
3. Set **Root Directory** to `dashboard`.
4. Deploy (defaults for Next.js are fine).
5. Optional: add environment variable  
   `NEXT_PUBLIC_AUCTIONS_JSON_URL` =  
   `https://raw.githubusercontent.com/<owner>/<repo>/main/data/auctions.json`  
   so the site refreshes data without redeploying (ISR revalidate).

## Data sources

| Source | Portal | API |
|--------|--------|-----|
| `eauctiondekho` | [eauctiondekho.com](https://www.eauctiondekho.com) | `api.eauctiondekho.com/api/notices` |
| `baanknet` | [baanknet.com](https://baanknet.com) | `POST .../property/detail/property-filter` |

Scrapers are best-effort; API changes may require updates. Respect each site’s terms of use.

## Legal

Use scraped data responsibly. This project is for informational purposes; verify auction details on official portals before bidding.
