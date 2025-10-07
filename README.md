# Scraper Express API

A minimal Express API exposing scraping endpoints that return discovered .m3u8 URLs.

## Endpoints

- GET /health — health check
- GET /movie/:tmdbId — scrape movie embeds using TMDB id
- GET /tv/:tmdbId/:season/:episode — scrape show episode embeds using TMDB id

Response JSON shape:

```
{ "urls": string[], "firstProvider"?: string, "error"?: string }
```

## Dev

1. Install deps
2. Run in dev (hot reload)

The server launches on http://localhost:8080 by default.

## Notes

- Uses headless Chromium via Puppeteer. Some providers may block or rate limit.
- Network interception aborts heavy resources to make scraping faster.
- A per-provider timeout stops waiting after 45s.
