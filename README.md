# Bank Auction Dashboard

Monorepo for scraping bank property auctions in **Andhra Pradesh** and **Telangana**, committing JSON data daily via GitHub Actions, and viewing results in a Next.js dashboard.

## Project layout

- `scraper/` — Python scraper (`requests` + BeautifulSoup)
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

**Note:** The MSTC property search runs per district (AP + Telangana) and can take several minutes on a full run. For a quick local test, set `SCRAPER_MAX_DISTRICTS=2` (limits districts per state).

## GitHub Actions

- Workflow: `.github/workflows/scraper.yml`
- Schedule: `30 1 * * *` UTC = **7:00 AM IST**
- Manual run: Actions → *Daily auction scraper* → *Run workflow*
- Requires `contents: write` (already set) so the bot can push JSON updates

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

| Source | Portal |
|--------|--------|
| `ibapi` | [ibapi.in](https://www.ibapi.in) (IBAPI listings via MSTC search) |
| `mstc` | [mstcecommerce.com](https://www.mstcecommerce.com) property search |
| `sbi` | [sbi.auctiontiger.net](https://sbi.auctiontiger.net) + SBI-named banks in search results |

Scrapers are best-effort; portal HTML changes may require adapter updates. Respect each site’s terms of use.

## Legal

Use scraped data responsibly. This project is for informational purposes; verify auction details on official portals before bidding.
