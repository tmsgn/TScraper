import express from "express";
import cors from "cors";
import { providers, PER_PROVIDER_MAX_MS } from "./providers.js";
import { scrapeProviderWithSubtitles } from "./scraper.js";
const app = express();
app.use(cors());
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/movie/:tmdbId", async (req, res) => {
    const id = req.params.tmdbId;
    const matched = providers.filter((p) => p.idType === "tmdb");
    if (matched.length === 0)
        return res.status(400).json({ urls: [], error: "No providers for tmdb" });
    try {
        const found = new Set();
        const subFound = new Map();
        let firstProvider = null;
        for (const p of matched) {
            const targetUrl = p.url({ type: "movie", id });
            const race = Promise.race([
                scrapeProviderWithSubtitles(targetUrl),
                new Promise((r) => setTimeout(() => r({ urls: [], subtitles: [] }), PER_PROVIDER_MAX_MS)),
            ]);
            const { urls, subtitles } = await race;
            urls.forEach((u) => found.add(u));
            subtitles.forEach((s) => subFound.set(s.url, s));
            if (found.size > 0) {
                firstProvider = p.name;
                break;
            }
        }
        return res.json({
            urls: Array.from(found),
            subtitles: Array.from(subFound.values()),
            firstProvider,
        });
    }
    catch (e) {
        return res
            .status(500)
            .json({ urls: [], subtitles: [], error: e?.message ?? "Scrape failed" });
    }
});
app.get("/tv/:tmdbId/:season/:episode", async (req, res) => {
    const { tmdbId, season, episode } = req.params;
    const id = tmdbId;
    const s = Number(season);
    const ep = Number(episode);
    if (!Number.isFinite(s) || !Number.isFinite(ep))
        return res.status(400).json({ urls: [], error: "Invalid season/episode" });
    const matched = providers.filter((p) => p.idType === "tmdb");
    if (matched.length === 0)
        return res.status(400).json({ urls: [], error: "No providers for tmdb" });
    try {
        const found = new Set();
        const subFound = new Map();
        let firstProvider = null;
        for (const p of matched) {
            const targetUrl = p.url({ type: "show", id, season: s, episode: ep });
            const race = Promise.race([
                scrapeProviderWithSubtitles(targetUrl),
                new Promise((r) => setTimeout(() => r({ urls: [], subtitles: [] }), PER_PROVIDER_MAX_MS)),
            ]);
            const { urls, subtitles } = await race;
            urls.forEach((u) => found.add(u));
            subtitles.forEach((s) => subFound.set(s.url, s));
            if (found.size > 0) {
                firstProvider = p.name;
                break;
            }
        }
        return res.json({
            urls: Array.from(found),
            subtitles: Array.from(subFound.values()),
            firstProvider,
        });
    }
    catch (e) {
        return res
            .status(500)
            .json({ urls: [], subtitles: [], error: e?.message ?? "Scrape failed" });
    }
});
app.listen(PORT, () => {
    console.log(`Express API listening on http://localhost:${PORT}`);
});
