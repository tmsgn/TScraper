import "dotenv/config";
import puppeteer from "puppeteer";
function isM3U8(url) {
    return /\.m3u8(\?|$)/i.test(url);
}
function isSubtitle(url) {
    return /\.(vtt|srt)(\?|$)/i.test(url);
}
function isHeavyResource(type) {
    return ["image", "stylesheet", "font", "media"].includes(type);
}
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
function attachNetworkCollectors(page, m3u8, subs) {
    page.on("request", (req) => {
        const url = req.url();
        if (isM3U8(url))
            m3u8.add(url);
        if (isSubtitle(url))
            subs.add(url);
        if (isHeavyResource(req.resourceType()))
            return req.abort().catch(() => { });
        return req.continue().catch(() => { });
    });
    page.on("response", async (res) => {
        try {
            const url = res.url();
            if (isM3U8(url))
                m3u8.add(url);
            if (isSubtitle(url))
                subs.add(url);
            const req = res.request();
            const reqUrl = req.url();
            if (isM3U8(reqUrl))
                m3u8.add(reqUrl);
            if (isSubtitle(reqUrl))
                subs.add(reqUrl);
        }
        catch { }
    });
}
async function createPage(browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);
    await page.setRequestInterception(true);
    return page;
}
async function tryClickSelectors(frame, selectors) {
    for (const sel of selectors) {
        const el = await frame.$(sel).catch(() => null);
        if (!el)
            continue;
        try {
            await el.click({ delay: 50 });
            return true;
        }
        catch { }
    }
    return false;
}
async function tryCloseOverlays(frame) {
    const closeSelectors = [
        "[class*=close]",
        ".vjs-modal-dialog-close-button",
        ".jw-icon-close",
        ".x-close,.btn-close",
        "[aria-label*=Close i]",
    ];
    await tryClickSelectors(frame, closeSelectors);
}
async function tryAutoplay(frame) {
    try {
        await frame.evaluate(() => {
            const vids = Array.from(document.querySelectorAll("video"));
            for (const v of vids) {
                try {
                    v.muted = true;
                    v.playsInline = true;
                    v.play().catch(() => { });
                }
                catch { }
            }
        });
    }
    catch { }
}
async function tryPlay(frame) {
    const playSelectors = [
        "button[aria-label*=Play i]",
        ".vjs-big-play-button",
        "button.jw-icon.jw-icon-display",
        "button[title*=Play i]",
        "[class*=play]",
        "button, .btn, [role=button]",
    ];
    await tryClickSelectors(frame, playSelectors);
    await tryAutoplay(frame);
}
async function tryInteractAllFrames(page) {
    const frames = page.frames();
    for (const f of frames) {
        await tryCloseOverlays(f);
        await tryPlay(f);
    }
}
export async function scrapeProvider(targetUrl) {
    // returns discovered m3u8 urls and subtitle urls
    let browser = null;
    const m3u8Urls = new Set();
    const subUrls = new Set();
    const PASSIVE_WAIT_MS = 6000;
    const CLICK_WAIT_MS = 8000;
    const launchArgs = [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
        "--autoplay-policy=no-user-gesture-required",
        "--mute-audio",
        "--ignore-certificate-errors",
        "--allow-running-insecure-content",
    ];
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: launchArgs,
            executablePath: process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer.executablePath(),
        });
        const page = await createPage(browser);
        attachNetworkCollectors(page, m3u8Urls, subUrls);
        await page.goto(targetUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
        });
        await delay(PASSIVE_WAIT_MS);
        if (m3u8Urls.size > 0)
            return Array.from(m3u8Urls);
        await tryInteractAllFrames(page);
        await delay(CLICK_WAIT_MS);
        if (m3u8Urls.size > 0)
            return Array.from(m3u8Urls);
        await tryInteractAllFrames(page);
        const start = Date.now();
        while (Date.now() - start < 5000) {
            if (m3u8Urls.size > 0)
                break;
            await delay(250);
        }
        return Array.from(m3u8Urls);
    }
    finally {
        try {
            await browser?.close();
        }
        catch { }
    }
}
export async function scrapeProviderWithSubtitles(targetUrl) {
    let browser = null;
    const m3u8Urls = new Set();
    const subUrls = new Set();
    const PASSIVE_WAIT_MS = 6000;
    const CLICK_WAIT_MS = 8000;
    const launchArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--autoplay-policy=no-user-gesture-required",
        "--mute-audio",
        "--ignore-certificate-errors",
        "--allow-running-insecure-content",
    ];
    try {
        browser = await puppeteer.launch({ headless: true, args: launchArgs });
        const page = await createPage(browser);
        attachNetworkCollectors(page, m3u8Urls, subUrls);
        await page.goto(targetUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
        });
        await delay(PASSIVE_WAIT_MS);
        // Attempt to extract subtitles from common players in DOM as a fallback
        const domSubs = await page.evaluate(() => {
            const urls = new Set();
            // <track src="..." kind="subtitles" label="..." srclang="...">
            document.querySelectorAll("track[kind='subtitles'][src]").forEach((t) => {
                const u = t.src;
                if (u)
                    urls.add(u);
            });
            // data-track or data-subtitle attributes seen on some sites
            document
                .querySelectorAll("[data-track],[data-subtitle]")
                .forEach((el) => {
                const u = (el.getAttribute("data-track") ||
                    el.getAttribute("data-subtitle") ||
                    "").trim();
                if (u)
                    urls.add(u);
            });
            return Array.from(urls);
        });
        domSubs.forEach((u) => subUrls.add(u));
        if (m3u8Urls.size === 0) {
            await tryInteractAllFrames(page);
            await delay(CLICK_WAIT_MS);
        }
        if (m3u8Urls.size === 0) {
            await tryInteractAllFrames(page);
            const start = Date.now();
            while (Date.now() - start < 5000) {
                if (m3u8Urls.size > 0)
                    break;
                await delay(250);
            }
        }
        const subtitles = Array.from(subUrls).map((u) => ({ url: u }));
        return { urls: Array.from(m3u8Urls), subtitles };
    }
    finally {
        try {
            await browser?.close();
        }
        catch { }
    }
}
